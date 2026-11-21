// Serves a Liquid theme directory through the shim, with a stateful in-memory cart and
// emulations of the platform modules. Test double only. Used by tiers 3 to 6 for Liquid and by evals.
import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { extname, join, normalize } from "node:path"
import { createShim, type ShimOptions } from "./liquid-shim"
import { RESOURCES } from "./resources"

export interface ThemeRoute {
  /** Matched against the URL path. */
  pattern: RegExp
  /** Template base name under templates/. */
  template: string
  /** Extra Liquid scope for the template. `match` is the RegExp match; `query` the URL query. */
  scope?(match: RegExpMatchArray, query: URLSearchParams): Record<string, unknown>
}

export interface ServeThemeOptions extends ShimOptions {
  themeRoot: string
  /** Default 0 (an ephemeral port). */
  port?: number
  /** Default DEFAULT_THEME_ROUTES. */
  routes?: ThemeRoute[]
}

export interface ThemeServer {
  url: string
  /** Empties the cart. Call between tests. */
  resetCart(): void
  close(): Promise<void>
}

interface CartLineState { key: string; variantId: number; quantity: number }

const liquid = (name: string): any => RESOURCES[name]!.liquid
const PRODUCTS: any[] = [liquid("product.basic"), liquid("product.on-sale"), liquid("product.sold-out")]
const byHandle = (handle: string) => PRODUCTS.find((p) => p.handle === handle) ?? PRODUCTS[0]

export const DEFAULT_THEME_ROUTES: ThemeRoute[] = [
  { pattern: /^\/$/, template: "index" },
  {
    pattern: /^\/products\/([a-z0-9-]+)$/,
    template: "product",
    scope: (match, query) => {
      const product = structuredClone(byHandle(match[1]!))
      const wanted = Number(query.get("variant"))
      const selected = product.variants.find((v: any) => v.id === wanted)
      if (selected) product.selected_or_first_available_variant = selected
      return { product }
    },
  },
  { pattern: /^\/collections\/([a-z0-9-]+)$/, template: "collection", scope: () => ({ collection: structuredClone(liquid("collection.basic")) }) },
  { pattern: /^\/cart$/, template: "cart" },
  {
    pattern: /^\/search$/,
    template: "search",
    scope: (_match, query) => {
      const terms = query.get("q") ?? ""
      const results = terms === "" ? [] : PRODUCTS.filter((p) => p.title.toLowerCase().includes(terms.toLowerCase()))
      return { search: { terms, performed: terms !== "", results, results_count: results.length } }
    },
  },
  { pattern: /^\/blogs\/[a-z0-9-]+\/[a-z0-9-]+$/, template: "article", scope: () => ({ article: structuredClone(liquid("article.basic")) }) },
  { pattern: /^\/pages\/([a-z0-9-]+)$/, template: "page", scope: (match) => ({ page: { title: match[1], handle: match[1], content: "<p>Page content.</p>" } }) },
]

const TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
}

/** Emulation of window.Shopify.actions backed by the shim server's cart. Shapes follow
 *  docs/research/spikes/commerce/fake-sa.js (which follows hydrogen/packages/hydrogen/vendor/standard-actions.d.ts). */
export const STANDARD_ACTIONS_SERVER_EMULATION = `(function(){
  const log = (window.__log = []);
  let config = null;
  const call = async (method, body) => (await fetch("/__shim/cart", { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined })).json();
  const defaultUpdate = (payload) => call("POST", payload);
  function updateCart(payload, options){
    log.push(["updateCart", JSON.parse(JSON.stringify(payload))]);
    const run = () => config?.handler ? config.handler(() => { log.push(["defaultHandler"]); return defaultUpdate(payload); }, payload, options) : defaultUpdate(payload);
    const promise = run();
    if (payload.lines) {
      const action = payload.lines[0].id ? (payload.lines[0].quantity === 0 ? "remove" : "update") : "add";
      const ev = new Event("shopify:cart:lines-update", { bubbles: true });
      Object.assign(ev, { action, context: "standard-action", lines: payload.lines, promise, detail: options?.event?.detail });
      const target = config?.eventTarget?.({ type: ev.type, action }) ?? document;
      target.dispatchEvent(ev);
    }
    return promise;
  }
  updateCart.configure = (c) => { log.push(["configure", Object.keys(c)]); if (config || window.__preconfigured) return false; config = c; return true; };
  updateCart.isDefault = () => !config;
  const getCart = async (p) => { log.push(["getCart", p ?? null]); return call("GET"); };
  let oc = null; const openCart = async () => { log.push(["openCart"]); return oc?.handler ? oc.handler(async () => {}) : undefined; }; openCart.configure = (c) => { oc = c; log.push(["openCart.configure"]); return true; }; openCart.isDefault = () => true;
  window.Shopify = { actions: { getCart, updateCart, openCart } };
})();`

/** Emulation of @shopify/partial-rendering for the SPIKE-02 default path: a region is the element
 *  that carries data-rp-region="<partial name>"; apply() replaces it. */
export const PARTIAL_RENDERING_EMULATION = `export const partials = {
  async fetch(...args) {
    const options = typeof args[args.length - 1] === "object" && args[args.length - 1] !== null ? args.pop() : {};
    const response = await fetch(options.url ?? location.href, { headers: { accept: "text/html" }, signal: options.signal });
    if (!response.ok) throw new Error("partials.fetch: " + response.status);
    (window.__partialsLog ??= []).push({ names: args, url: options.url ?? null });
    return { names: args, html: await response.text() };
  },
  apply(payload) {
    const fresh = new DOMParser().parseFromString(payload.html, "text/html");
    for (const name of payload.names) {
      const selector = '[data-rp-region="' + name + '"]';
      const next = fresh.querySelectorAll(selector);
      document.querySelectorAll(selector).forEach((stale, index) => { if (next[index]) stale.replaceWith(document.adoptNode(next[index])); });
    }
  },
};`

export const STANDARD_EVENTS_EMULATION = `export function createViewEventElement(){ return class extends HTMLElement {}; }`

const PLATFORM_IMPORTS: Record<string, string> = {
  "@shopify/partial-rendering": "/__shim/partial-rendering.js",
  "@shopify/standard-actions": "/__shim/standard-actions.js",
  "@shopify/standard-events": "/__shim/standard-events.js",
}

/** Adds the platform specifiers to the page's single import map; creates the map when the page has none. */
export function injectPlatformImports(html: string): string {
  const pattern = /(<script\b[^>]*type=["']importmap["'][^>]*>)([\s\S]*?)(<\/script>)/i
  const found = html.match(pattern)
  if (found) {
    const map = JSON.parse(found[2]!.trim() || "{}")
    map.imports = { ...PLATFORM_IMPORTS, ...(map.imports ?? {}) }
    return html.replace(pattern, (_whole, open: string, _body: string, close: string) => `${open}${JSON.stringify(map)}${close}`)
  }
  return html.replace(/<head\b[^>]*>/i, (head) => `${head}<script type="importmap">${JSON.stringify({ imports: PLATFORM_IMPORTS })}</script>`)
}

export async function serveTheme(options: ServeThemeOptions): Promise<ThemeServer> {
  const routes = options.routes ?? DEFAULT_THEME_ROUTES
  let lines: CartLineState[] = []
  let note: string | null = null
  let sequence = 0

  const variantOf = (id: number) => {
    for (const product of PRODUCTS) for (const variant of product.variants) if (variant.id === id) return { product, variant }
    throw new Error(`shim cart: unknown variant ${id}`)
  }
  const cartDrop = () => {
    const items = lines.map((line) => {
      const { product, variant } = variantOf(line.variantId)
      return {
        key: line.key,
        quantity: line.quantity,
        product,
        variant,
        url: `${product.url}?variant=${variant.id}`,
        image: variant.image,
        final_line_price: variant.price * line.quantity,
        original_line_price: (variant.compare_at_price ?? variant.price) * line.quantity,
        properties: {},
        url_to_remove: `/cart/change?id=${encodeURIComponent(line.key)}&quantity=0`,
      }
    })
    const cents = items.reduce((sum, item) => sum + item.final_line_price, 0)
    return { item_count: items.reduce((sum, item) => sum + item.quantity, 0), note, items, items_subtotal_price: cents, total_price: cents }
  }
  const money = (cents: number) => ({ amount: (cents / 100).toFixed(2), currencyCode: "USD" })
  const summary = () => {
    const drop = cartDrop()
    if (drop.items.length === 0) return null
    return {
      id: "gid://shopify/Cart/c1",
      totalQuantity: drop.item_count,
      cost: { totalAmount: money(drop.total_price) },
      lines: { nodes: drop.items.map((item) => ({ id: item.key, quantity: item.quantity, cost: { totalAmount: money(item.final_line_price) } })) },
      discountCodes: [],
    }
  }
  const add = (variantId: number, quantity: number) => {
    variantOf(variantId)
    const existing = lines.find((line) => line.variantId === variantId)
    if (existing) existing.quantity += quantity
    else lines.push({ key: `${variantId}:rpline${++sequence}`, variantId, quantity })
  }
  const setQuantity = (key: string, quantity: number) => {
    const line = lines.find((entry) => entry.key === key)
    if (line) line.quantity = quantity
    lines = lines.filter((entry) => entry.quantity > 0)
  }
  const numericVariant = (value: unknown) => Number(String(value).replace(/^gid:\/\/shopify\/ProductVariant\//, ""))

  const readBody = (req: import("node:http").IncomingMessage) =>
    new Promise<string>((resolve) => {
      let body = ""
      req.on("data", (chunk) => (body += chunk))
      req.on("end", () => resolve(body))
    })
  // Reads urlencoded and multipart/form-data text fields into name/value pairs, in document order.
  const formFields = (body: string, contentType: string): Array<[string, string]> => {
    const boundary = contentType.match(/boundary=(.+)$/)?.[1]
    if (!boundary) return [...new URLSearchParams(body).entries()]
    const out: Array<[string, string]> = []
    for (const part of body.split(`--${boundary}`)) {
      const match = part.match(/name="([^"]*)"\r\n\r\n([\s\S]*?)\r\n$/)
      if (match) out.push([match[1]!, match[2]!])
    }
    return out
  }

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1")
      const path = decodeURIComponent(url.pathname)
      const send = (status: number, type: string, body: string | Buffer, headers: Record<string, string> = {}) => {
        res.writeHead(status, { "content-type": type, "cache-control": "no-store", ...headers })
        res.end(body)
      }
      const redirect = (to: string) => send(303, "text/plain", "", { location: to })

      if (path === "/__shim/standard-actions.js") return send(200, TYPES[".js"]!, STANDARD_ACTIONS_SERVER_EMULATION)
      if (path === "/__shim/partial-rendering.js") return send(200, TYPES[".js"]!, PARTIAL_RENDERING_EMULATION)
      if (path === "/__shim/standard-events.js") return send(200, TYPES[".js"]!, STANDARD_EVENTS_EMULATION)
      if (path === "/__shim/cart") {
        if (req.method === "POST") {
          const payload = JSON.parse((await readBody(req)) || "{}")
          for (const line of payload.lines ?? []) {
            if (line.id) setQuantity(String(line.id), Number(line.quantity))
            else add(numericVariant(line.merchandiseId), Number(line.quantity ?? 1))
          }
          if (typeof payload.note === "string") note = payload.note
        }
        return send(200, TYPES[".json"]!, JSON.stringify({ cart: summary() }))
      }
      if (path.startsWith("/assets/")) {
        const file = join(options.themeRoot, "assets", normalize(path.slice("/assets/".length)).replace(/^(\.\.[/\\])+/, ""))
        try {
          return send(200, TYPES[extname(file)] ?? "application/octet-stream", await readFile(file))
        } catch {
          return send(404, "text/plain", "not found")
        }
      }
      if (req.method === "POST" && path === "/cart/add") {
        const fields = formFields(await readBody(req), req.headers["content-type"] ?? "")
        const get = (name: string) => fields.find(([key]) => key === name)?.[1]
        add(numericVariant(get("id")), Number(get("quantity") ?? 1))
        return redirect("/cart")
      }
      if (req.method === "POST" && (path === "/cart" || path === "/cart/update")) {
        const fields = formFields(await readBody(req), req.headers["content-type"] ?? "")
        const updates = fields.filter(([key]) => key === "updates[]").map(([, value]) => Number(value))
        const keys = lines.map((line) => line.key)
        updates.forEach((quantity, index) => keys[index] !== undefined && setQuantity(keys[index]!, quantity))
        const noteField = fields.find(([key]) => key === "note")
        if (noteField) note = noteField[1]
        return redirect(fields.some(([key]) => key === "checkout") ? "/checkout" : "/cart")
      }
      if (path === "/cart/change") {
        setQuantity(url.searchParams.get("id") ?? "", Number(url.searchParams.get("quantity") ?? 0))
        return redirect("/cart")
      }
      if (path === "/checkout") return send(200, "text/html; charset=utf-8", "<!doctype html><title>Checkout</title><h1>Checkout</h1>")

      for (const route of routes) {
        const match = path.match(route.pattern)
        if (!match) continue
        const shim = createShim(options.themeRoot, {
          ...options,
          globals: {
            cart: cartDrop(),
            content_for_header: `<script src="/__shim/standard-actions.js"></script>`,
            request: { locale: { iso_code: "en", root_url: "/" }, design_mode: false, page_type: route.template, path },
            ...(options.globals ?? {}),
          },
        })
        const html = await shim.renderPage(route.template, route.scope?.(match, url.searchParams) ?? {})
        return send(200, "text/html; charset=utf-8", injectPlatformImports(html))
      }
      return send(404, "text/html; charset=utf-8", "<!doctype html><title>Not found</title><h1>Not found</h1>")
    } catch (error) {
      res.writeHead(500, { "content-type": "text/plain" })
      res.end(String((error as Error).stack ?? error))
    }
  })
  await new Promise<void>((resolve) => server.listen(options.port ?? 0, "127.0.0.1", resolve))
  const { port } = server.address() as { port: number }
  return {
    url: `http://127.0.0.1:${port}`,
    resetCart: () => {
      lines = []
      note = null
      sequence = 0
    },
    close: () => new Promise((resolve) => server.close(() => resolve())),
  }
}
