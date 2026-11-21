import { test, after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { Browser } from "playwright"
import { launch, openPage } from "../src/harness"
import { serveTheme, injectPlatformImports, type ThemeServer } from "../src/serve-theme"

const root = mkdtempSync(join(tmpdir(), "rp-theme-"))
for (const dir of ["layout", "templates", "blocks", "snippets", "locales", "assets"]) mkdirSync(join(root, dir))
writeFileSync(join(root, "locales/en.default.json"), JSON.stringify({ ripple: { cart: { count: { one: "{{ count }} item", other: "{{ count }} items" } } } }))
writeFileSync(join(root, "layout/theme.liquid"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{{ page_title }}</title><script type="importmap">{"imports":{"ripple":"{{ 'ripple.js' | asset_url }}"}}</script>{{ content_for_header }}</head><body><a href="{{ routes.cart_url }}" id="cart-link">{{ 'ripple.cart.count' | t: count: cart.item_count }}</a>{{ content_for_layout }}</body></html>`)
writeFileSync(join(root, "templates/index.liquid"), `<h1>Home</h1>`)
writeFileSync(join(root, "templates/product.liquid"), `{% form 'product', product, id: 'pf' %}<input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}"><input type="number" name="quantity" value="1"><button type="submit">Add</button>{% endform %}`)
writeFileSync(join(root, "templates/cart.liquid"), `{% partial 'rp-cart-lines' %}<ul data-rp-region="rp-cart-lines">{% for item in cart.items %}<li data-rp-line="{{ item.key }}">{{ item.product.title }} x<input name="updates[]" value="{{ item.quantity }}"> {{ item.final_line_price | money }} <a href="{{ item.url_to_remove }}">Remove</a></li>{% endfor %}</ul>{% endpartial %}`)

let browser: Browser | undefined
let server: ThemeServer | undefined
const setup = async () => {
  browser ??= await launch()
  server ??= await serveTheme({ themeRoot: root })
  server.resetCart()
  return { browser, server }
}
after(async () => { await browser?.close(); await server?.close() })

test("[T1] injectPlatformImports merges into the single import map, or creates one", () => {
  const merged = injectPlatformImports(`<head><script type="importmap">{"imports":{"ripple":"/assets/ripple.js"}}</script></head>`)
  assert.equal((merged.match(/importmap/g) ?? []).length, 1)
  assert.match(merged, /"@shopify\/partial-rendering":"\/__shim\/partial-rendering.js"/)
  assert.match(merged, /"ripple":"\/assets\/ripple.js"/)
  assert.match(injectPlatformImports(`<html><head><title>x</title></head></html>`), /<head><script type="importmap">/)
})

test("[T6] no-JS Liquid flow on the shim server: add by form post, then remove by link", async () => {
  const { browser, server } = await setup()
  const { context, page } = await openPage(browser, "disabled")
  await page.goto(server.url + "/products/linen-shirt")
  await page.click("button[type=submit]")
  assert.equal(new URL(page.url()).pathname, "/cart")
  assert.equal(await page.locator("[data-rp-line]").count(), 1)
  assert.equal(await page.textContent("#cart-link"), "1 item")
  assert.match((await page.textContent("[data-rp-line]"))!, /Linen Shirt.*\$48\.00/)
  await page.click("[data-rp-line] a")
  assert.equal(await page.locator("[data-rp-line]").count(), 0)
  await context.close()
})

test("[T5] emulated Standard Actions and partial rendering work against the shim server", async () => {
  const { browser, server } = await setup()
  const { context, page, errors } = await openPage(browser, "on")
  await page.goto(server.url + "/cart")
  const result = await page.evaluate(async () => {
    const actions = (window as any).Shopify.actions
    const added = await actions.updateCart({ lines: [{ merchandiseId: "gid://shopify/ProductVariant/43696932421654", quantity: 2 }] })
    const { partials } = await import("@shopify/partial-rendering" as string)
    partials.apply(await partials.fetch("rp-cart-lines"))
    return { total: added.cart.totalQuantity, lines: document.querySelectorAll("[data-rp-line]").length, got: (await actions.getCart()).cart.lines.nodes[0].quantity }
  })
  assert.deepEqual(result, { total: 2, lines: 1, got: 2 })
  assert.deepEqual(errors, [])
  await context.close()
})
