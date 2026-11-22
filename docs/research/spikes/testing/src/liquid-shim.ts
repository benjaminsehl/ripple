// Local stand-in for Shopify's Liquid renderer. It renders Ripple theme files for tests.
// It is NOT a Shopify emulator: only the tags and filters listed in docs/13-testing.md exist.
import { Liquid, type Template } from "liquidjs"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export interface ShimOptions {
  /** Locale file base name under locales/. Default "en.default". */
  locale?: string
  /** Value of the Liquid global `settings`. Default {}. */
  settings?: Record<string, unknown>
  /** Extra Liquid globals, merged over SHIM_GLOBALS. */
  globals?: Record<string, unknown>
}

export interface Shim {
  /** Render Liquid source as if it were the file templates/<name>.liquid (no layout). */
  renderTemplate(source: string, scope?: Record<string, unknown>, name?: string): Promise<string>
  /** Render templates/<template>.liquid inside layout/theme.liquid. */
  renderPage(template: string, scope?: Record<string, unknown>): Promise<string>
  /** Names of every {% partial %} rendered since the shim was created, in order. */
  readonly partials: string[]
}

export const SHIM_GLOBALS: Record<string, unknown> = {
  routes: {
    root_url: "/",
    cart_url: "/cart",
    cart_add_url: "/cart/add",
    cart_change_url: "/cart/change",
    cart_update_url: "/cart/update",
    all_products_collection_url: "/collections/all",
    collections_url: "/collections",
    search_url: "/search",
    predictive_search_url: "/search/suggest",
    product_recommendations_url: "/recommendations/products",
    account_url: "/account",
    account_login_url: "/account/login",
  },
  request: { locale: { iso_code: "en", root_url: "/" }, design_mode: false, page_type: "index", path: "/" },
  shop: { name: "Ripple Test Shop", url: "http://127.0.0.1", currency: "USD", money_format: "${{amount}}" },
  localization: { country: { iso_code: "US", currency: { iso_code: "USD", symbol: "$" } }, language: { iso_code: "en" } },
  cart: { item_count: 0, note: null, items: [], items_subtotal_price: 0, total_price: 0 },
  page_title: "Ripple Test Shop",
  content_for_header: "",
}

/** Split "a, b: [1, 'x,y'], c: d" on top-level commas. */
function splitArgs(source: string): string[] {
  const out: string[] = []
  let current = ""
  let quote: string | null = null
  let depth = 0
  for (const ch of source) {
    if (quote) {
      current += ch
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      current += ch
      continue
    }
    if (ch === "[" || ch === "(") depth += 1
    if (ch === "]" || ch === ")") depth -= 1
    if (ch === "," && depth === 0) {
      out.push(current.trim())
      current = ""
      continue
    }
    current += ch
  }
  if (current.trim()) out.push(current.trim())
  return out
}

function collectBody(tag: any, tagToken: any, remainTokens: any[], endName: string): void {
  tag.templates = []
  const stream = tag.liquid.parser
    .parseStream(remainTokens)
    .on(`tag:${endName}`, () => stream.stop())
    .on("template", (tpl: Template) => tag.templates.push(tpl))
    .on("end", () => {
      throw new Error(`tag ${tagToken.getText()} not closed`)
    })
  stream.start()
}

function swallow(tagToken: any, remainTokens: any[], endName: string): void {
  while (remainTokens.length) {
    const token = remainTokens.shift()
    if (token.name === endName) return
  }
  throw new Error(`tag ${tagToken.getText()} not closed`)
}

const escapeAttr = (value: unknown): string =>
  String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/** liquidjs passes a named filter argument (`width: 800`) as the array ["width", 800]. */
function namedArgs(args: unknown[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const arg of args) if (Array.isArray(arg) && arg.length === 2 && typeof arg[0] === "string") out[arg[0]] = arg[1]
  return out
}

export function createShim(themeRoot: string, options: ShimOptions = {}): Shim {
  const locale = options.locale ?? "en.default"
  const translations = JSON.parse(readFileSync(join(themeRoot, "locales", `${locale}.json`), "utf8"))
  const partials: string[] = []
  const engine = new Liquid({
    root: [join(themeRoot, "templates"), join(themeRoot, "layout")],
    partials: join(themeRoot, "snippets"),
    extname: ".liquid",
    strictFilters: true, // a filter the shim does not define fails loudly
    strictVariables: false, // unset block params are nil, as on Shopify
    ownPropertyOnly: true,
  })
  const globals = { ...SHIM_GLOBALS, settings: options.settings ?? {}, ...(options.globals ?? {}) }

  const blockCache = new Map<string, { tpl: Template[]; defaults: Record<string, unknown> }>()
  let blockSeq = 0
  const loadBlock = (name: string) => {
    if (!/^[a-z0-9_-]+$/.test(name)) throw new Error(`invalid block name '${name}'`)
    let entry = blockCache.get(name)
    if (!entry) {
      const file = join(themeRoot, "blocks", `${name}.liquid`)
      if (!existsSync(file)) throw new Error(`blocks/${name}.liquid does not exist`)
      const source = readFileSync(file, "utf8")
      // Shopify binds each schema setting id as a bare variable and as block.settings.<id>.
      const match = source.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/)
      const schema = match ? JSON.parse(match[1]!) : {}
      const defaults: Record<string, unknown> = {}
      for (const setting of schema.settings ?? []) if (setting.id) defaults[setting.id] = setting.default ?? null
      entry = { tpl: engine.parse(source, file), defaults }
      blockCache.set(name, entry)
    }
    return entry
  }

  // {% block 'name', key: value, list: ['a', 'b'] %} body {% endblock %}
  engine.registerTag("block", {
    parse(this: any, tagToken: any, remainTokens: any[]) {
      const file: string = tagToken.file ?? ""
      if (/[\\/](blocks|snippets)[\\/]/.test(file)) throw new Error(`'block' tag used outside templates/ and layout/: ${file}`)
      const [nameSource, ...rest] = splitArgs(tagToken.args)
      this.nameSource = nameSource
      this.pairs = rest.map((pair: string) => {
        const index = pair.indexOf(":")
        if (index < 0) throw new Error(`block argument without a name: ${pair}`)
        const key = pair.slice(0, index).trim()
        if (key.includes(".")) throw new Error(`dotted block argument '${key}'`)
        return [key, pair.slice(index + 1).trim()]
      })
      collectBody(this, tagToken, remainTokens, "endblock")
    },
    *render(this: any, ctx: any, emitter: any): Generator<any, void, any> {
      const liquid = this.liquid
      const name = yield liquid.evalValue(this.nameSource, ctx)
      // 1. The body renders first, in the CALLER's scope.
      const content = yield liquid.renderer.renderTemplates(this.templates, ctx)
      // 2. Arguments are evaluated in the caller's scope.
      const scope: Record<string, unknown> = {}
      for (const [key, source] of this.pairs as Array<[string, string]>) {
        if (source.startsWith("[")) {
          const items: unknown[] = []
          for (const item of splitArgs(source.slice(1, -1))) items.push(yield liquid.evalValue(item, ctx))
          scope[key] = items
        } else {
          scope[key] = yield liquid.evalValue(source, ctx)
        }
      }
      if (String(content).trim() !== "" || scope.content === undefined) scope.content = content
      // 3. The block file renders in an isolated scope: params + content + block + globals.
      // liquidjs returns a computed value for an UNSET top-level variable named size, first or last;
      // Ruby Liquid returns nil. Define them so unset params behave like Shopify.
      for (const key of ["size", "first", "last"]) if (!(key in scope)) scope[key] = null
      const { tpl, defaults } = loadBlock(name)
      const settings: Record<string, unknown> = {}
      for (const [id, fallback] of Object.entries(defaults)) {
        // A call-site argument with a setting's id overrides the setting.
        settings[id] = scope[id] === undefined || scope[id] === null ? fallback : scope[id]
        scope[id] = settings[id]
      }
      blockSeq += 1
      scope.block = { shopify_attributes: "", settings, id: `shim${blockSeq}`, type: name }
      emitter.write(yield liquid.render(tpl, scope, { globals: ctx.globals }))
    },
  })

  // {% partial 'name' %} body {% endpartial %}: renders its body with no wrapper (SPIKE-02 default path).
  engine.registerTag("partial", {
    parse(this: any, tagToken: any, remainTokens: any[]) {
      this.nameSource = tagToken.args.trim()
      if (!/^(['"])[^'"/]+\1$/.test(this.nameSource)) throw new Error(`partial needs a quoted literal name: ${this.nameSource}`)
      collectBody(this, tagToken, remainTokens, "endpartial")
    },
    *render(this: any, ctx: any, emitter: any): Generator<any, void, any> {
      partials.push(this.nameSource.slice(1, -1))
      emitter.write(yield this.liquid.renderer.renderTemplates(this.templates, ctx))
    },
  })

  for (const raw of ["doc", "schema", "stylesheet", "javascript"]) {
    engine.registerTag(raw, {
      parse(tagToken: any, remainTokens: any[]) {
        swallow(tagToken, remainTokens, `end${raw}`)
      },
      render() {},
    })
  }

  // {% form 'product', product, id: 'x', class: 'y' %} and {% form 'cart', cart, ... %}.
  // Output shape of the product form: https://shopify.dev/docs/api/liquid/tags/form (as recorded in
  // docs/research/liquid-blocks-partials.md section 2.6). Fixtures mask everything the platform owns.
  engine.registerTag("form", {
    parse(this: any, tagToken: any, remainTokens: any[]) {
      this.parts = splitArgs(tagToken.args)
      collectBody(this, tagToken, remainTokens, "endform")
    },
    *render(this: any, ctx: any, emitter: any): Generator<any, void, any> {
      const liquid = this.liquid
      const type = yield liquid.evalValue(this.parts[0], ctx)
      if (type !== "product" && type !== "cart") throw new Error(`form shim supports 'product' and 'cart', got '${type}'`)
      const resource = this.parts[1] && !this.parts[1].includes(":") ? yield liquid.evalValue(this.parts[1], ctx) : null
      const attrs: Record<string, unknown> =
        type === "product"
          ? { id: `product_form_${resource?.id ?? ""}`, class: "shopify-product-form" }
          : { id: "cart_form", class: "shopify-cart-form" }
      for (const part of this.parts.slice(1) as string[]) {
        const index = part.indexOf(":")
        if (index < 0) continue
        attrs[part.slice(0, index).trim()] = yield liquid.evalValue(part.slice(index + 1).trim(), ctx)
      }
      ctx.push({ form: { errors: null, id: attrs.id } })
      const body = yield liquid.renderer.renderTemplates(this.templates, ctx)
      ctx.pop()
      const extra = Object.entries(attrs)
        .filter(([key]) => key !== "id" && key !== "class")
        .map(([key, value]) => ` ${key}="${escapeAttr(value)}"`)
        .join("")
      const head = `id="${escapeAttr(attrs.id)}" accept-charset="UTF-8" class="${escapeAttr(attrs.class)}"`
      if (type === "product") {
        emitter.write(
          `<form method="post" action="/cart/add" ${head} enctype="multipart/form-data"${extra}>` +
            `<input type="hidden" name="form_type" value="product" /><input type="hidden" name="utf8" value="✓" />` +
            `${body}<input type="hidden" name="product-id" value="${escapeAttr(resource?.id ?? "")}" /></form>`,
        )
      } else {
        emitter.write(
          `<form method="post" action="/cart" ${head}${extra}>` +
            `<input type="hidden" name="form_type" value="cart" /><input type="hidden" name="utf8" value="✓" />${body}</form>`,
        )
      }
    },
  })

  // Shopify filters used by Ripple files. A filter MUST be added here before a Ripple file uses it.
  engine.registerFilter("t", (key: unknown, ...args: unknown[]) => {
    let value: unknown = String(key).split(".").reduce((node: any, part) => (node == null ? node : node[part]), translations)
    const named = namedArgs(args)
    if (value !== null && typeof value === "object" && "count" in named) {
      value = (value as Record<string, unknown>)[Number(named.count) === 1 ? "one" : "other"]
    }
    if (typeof value !== "string") throw new Error(`missing translation '${key}'`)
    return value.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (whole, name: string) => (name in named ? String(named[name]) : whole))
  })
  engine.registerFilter("money", (cents: unknown) => `$${(Number(cents) / 100).toFixed(2)}`)
  engine.registerFilter("money_with_currency", (cents: unknown) => `$${(Number(cents) / 100).toFixed(2)} USD`)
  engine.registerFilter("image_url", (image: any, ...args: unknown[]) => {
    const source = typeof image === "string" ? image : (image?.src ?? image?.featured_image?.src ?? image?.image?.src)
    if (typeof source !== "string" || source === "") throw new Error("image_url: the input has no image")
    const named = namedArgs(args)
    if (named.width === undefined && named.height === undefined) throw new Error("image_url: width or height is required")
    let url = source
    for (const key of ["width", "height", "crop"]) {
      if (named[key] !== undefined) url += `${url.includes("?") ? "&" : "?"}${key}=${named[key]}`
    }
    return url
  })
  engine.registerFilter("asset_url", (name: unknown) => `/assets/${name}`)
  engine.registerFilter("stylesheet_tag", (url: unknown) => `<link href="${url}" rel="stylesheet" type="text/css" media="all" />`)
  engine.registerFilter("payment_button", () => '<div data-shopify="payment-button" class="shopify-payment-button"></div>')

  const renderTemplate = async (source: string, scope: Record<string, unknown> = {}, name = "case"): Promise<string> => {
    const tpl = engine.parse(source, join(themeRoot, "templates", `${name}.liquid`))
    return engine.render(tpl, scope, { globals })
  }
  const renderPage = async (template: string, scope: Record<string, unknown> = {}): Promise<string> => {
    const body = await renderTemplate(readFileSync(join(themeRoot, "templates", `${template}.liquid`), "utf8"), scope, template)
    const layoutFile = join(themeRoot, "layout", "theme.liquid")
    const layout = engine.parse(readFileSync(layoutFile, "utf8"), layoutFile)
    return engine.render(layout, { ...scope, content_for_layout: body, template: { name: template } }, { globals })
  }
  return { renderTemplate, renderPage, partials }
}
