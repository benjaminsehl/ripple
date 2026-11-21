import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createShim } from "../src/liquid-shim"
import { canonicalize } from "../../bindings/pkg/canonicalize"

const theme = "../bindings/liquid/theme"
const fixtures = JSON.parse(readFileSync("../bindings/fixtures/fixtures.json", "utf8"))
const product = { id: 7, selected_or_first_available_variant: { id: 43696932421654, available: true } }
const pfMask = [
  { select: "form.rp-product-form-fields", op: "attr", name: "action" },
  { select: "form.rp-product-form-fields", op: "drop-attr", name: "accept-charset" },
  { select: "form.rp-product-form-fields", op: "drop-attr", name: "enctype" },
  { select: 'form.rp-product-form-fields > input[type="hidden"]:not([data-rp-field])', op: "remove" },
  { select: '[data-rp-field="merchandise-id"]', op: "attr", name: "name" },
  { select: '[data-rp-field="merchandise-id"]', op: "attr", name: "value" },
] as any
const cases: Record<string, [string, any?]> = {
  "button/default": [`{% block 'button' %}Add to cart{% endblock %}`],
  "button/escaping": [`{% block 'button', aria_label: 'Say "hi" & <go>' %}Go{% endblock %}`],
  "stack/responsive": [`{% block 'stack', gap: '2 md:6', align: 'start' %}<p>One</p><p>Two</p>{% endblock %}`],
  "dialog/default": [`{% block 'dialog', id: 'size-guide' %}{% block 'dialog-title', dialog: 'size-guide' %}Size guide{% endblock %}<p>S, M, L.</p>{% endblock %}`],
  "tabs/default": [`{% block 'tabs', id: 't', default_value: 'account' %}{% block 'tabs-list', aria_label: 'Settings' %}{% block 'tabs-tab', tabs: 't', value: 'account', selected: true %}Account{% endblock %}{% block 'tabs-tab', tabs: 't', value: 'password' %}Password{% endblock %}{% endblock %}{% block 'tabs-panel', tabs: 't', value: 'account', selected: true %}<p>Manage your profile.</p>{% endblock %}{% block 'tabs-panel', tabs: 't', value: 'password' %}<p>Choose a new password.</p>{% endblock %}{% endblock %}`],
  "product-form/default": [`{% block 'product-form', id: 'pf', product: product %}{% block 'button', type: 'submit' %}Add to cart{% endblock %}{% endblock %}`, pfMask],
}
const shim = createShim(theme)
for (const [name, [source, mask]] of Object.entries(cases)) {
  test(`[T2] liquid ${name}`, async () => {
    const html = await shim.renderTemplate(source, { product }, name.replace("/", "-"))
    assert.equal(canonicalize(html, { mask }), canonicalize(fixtures[name], { mask }))
  })
}
test("[T1] shim filters", async () => {
  const image = { src: "//cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?v=1700000000", alt: "Linen shirt on a hanger", width: 1600, height: 2000 }
  assert.equal(await shim.renderTemplate(`{{ image | image_url: width: 800 }}|{{ 4800 | money }}|{{ 'a,b' | split: ',' | size }}|{{ image.alt | escape }}|{{ image | json }}`, { image }),
    `//cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?v=1700000000&width=800|$48.00|2|Linen shirt on a hanger|${JSON.stringify(image)}`)
  await assert.rejects(shim.renderTemplate(`{{ 'x' | handleize_nope }}`), /undefined filter/)
  await assert.rejects(shim.renderTemplate(`{{ 'ripple.nope.key' | t }}`), /missing translation/)
  await assert.rejects(shim.renderTemplate(`{{ image | image_url }}`, { image }), /width or height/)
})
test("[T1] partial tag renders its body and records the name", async () => {
  const s = createShim(theme)
  assert.equal(await s.renderTemplate(`{% partial 'rp-cart-lines' %}<div data-rp-region="rp-cart-lines">x</div>{% endpartial %}`), `<div data-rp-region="rp-cart-lines">x</div>`)
  assert.deepEqual(s.partials, ["rp-cart-lines"])
})
test("[T1] renderPage wraps the template in layout/theme.liquid", async () => {
  const html = await shim.renderPage("index", {})
  assert.match(html, /<html/)
  console.log("page bytes", html.length)
})
