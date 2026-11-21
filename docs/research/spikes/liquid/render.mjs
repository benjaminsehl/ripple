import fs from 'node:fs';
import path from 'node:path';
import { createEngine, globals } from './shim.mjs';
import { canonicalize } from './canon.mjs';

const theme = path.resolve('theme');
const product = {
  id: 7, title: 'Tee & <b>Co</b>', description: '<p>100% cotton.</p>',
  selected_or_first_available_variant: { id: 42, available: true, price: 2500 },
};
const cases = [
  { name: 'button-default', liquid: `{% block 'rp-button' %}Save{% endblock %}`,
    html: `<button class="rp-button" type="button" data-variant="primary" data-size="md">Save</button>` },
  { name: 'button-link-escaped', liquid: `{% block 'rp-button', variant: 'outline', size: 'lg', href: '/search?q=a&b="c"', class: 'w-full' %}Go{% endblock %}`,
    html: `<a class="rp-button w-full" href="/search?q=a&amp;b=&quot;c&quot;" data-variant="outline" data-size="lg">Go</a>` },
  { name: 'button-disabled-true', liquid: `{% block 'rp-button', type: 'submit', disabled: true, full_width: true %}Buy{% endblock %}`,
    html: `<button class="rp-button" type="submit" disabled data-variant="primary" data-size="md" data-full-width>Buy</button>` },
  { name: 'button-invalid-values-fall-back', liquid: `{% block 'rp-button', disabled: 'false', type: 'bogus', variant: 'huge', size: 4 %}Buy{% endblock %}`,
    html: `<button class="rp-button" type="button" data-variant="primary" data-size="md">Buy</button>` },
  { name: 'button-class-cannot-break-out', liquid: `{% block 'rp-button', class: '"><script>x</script>' %}Buy{% endblock %}`,
    html: `<button class="rp-button &quot;><script>x</script>" type="button" data-variant="primary" data-size="md">Buy</button>` },
  { name: 'stack-responsive', liquid: `{% block 'rp-stack', tag: 'ul', gap: '2 md:6', align: 'start' %}<li>One</li>{% endblock %}`,
    html: `<ul class="rp-stack" data-gap="2 md:6" data-align="start"><li>One</li></ul>` },
  { name: 'stack-bad-tag-falls-back', liquid: `{% block 'rp-stack', tag: 'script' %}x{% endblock %}`,
    html: `<div class="rp-stack">x</div>` },
  { name: 'accordion', liquid: `{% block 'rp-accordion' %}{% block 'rp-accordion-item', name: 'faq', open: true %}{% block 'rp-accordion-summary' %}Shipping &amp; returns{% endblock %}{% block 'rp-accordion-panel' %}<p>2 days</p>{% endblock %}{% endblock %}{% block 'rp-accordion-item', name: 'faq' %}{% block 'rp-accordion-summary' %}Care{% endblock %}{% block 'rp-accordion-panel' %}<p>Wash cold</p>{% endblock %}{% endblock %}{% endblock %}`,
    html: `<div class="rp-accordion" data-variant="default"><details class="rp-accordion-item" name="faq" open><summary class="rp-accordion-summary">Shipping &amp; returns</summary><div class="rp-accordion-panel"><p>2 days</p></div></details><details class="rp-accordion-item" name="faq"><summary class="rp-accordion-summary">Care</summary><div class="rp-accordion-panel"><p>Wash cold</p></div></details></div>` },
  // Expected HTML is the zero-diff closed-state markup from uisdk-web-elements.md section 3.2, plus rp- classes.
  { name: 'dialog', liquid: `{% block 'rp-dialog', id: 'sg' %}{% block 'rp-dialog-trigger', dialog: 'sg', variant: 'link' %}Size guide{% endblock %}{% block 'rp-dialog-content' %}{% block 'rp-dialog-title', dialog: 'sg' %}Size guide{% endblock %}<p>S, M, L.</p>{% endblock %}{% endblock %}`,
    html: `<ui-dialog id="sg" class="rp-dialog"><ui-dialog-trigger><button class="rp-button" id="sg-trigger" type="button" data-variant="link" data-size="md" aria-haspopup="dialog" data-closed data-slot="dialog-trigger">Size guide</button></ui-dialog-trigger><ui-dialog-backdrop class="rp-dialog-backdrop" hidden data-slot="dialog-backdrop"></ui-dialog-backdrop><ui-dialog-content class="rp-dialog-content" hidden data-slot="dialog-content"><ui-dialog-title class="rp-dialog-title" id="sg-title" role="heading" aria-level="2" data-slot="dialog-title">Size guide</ui-dialog-title><p>S, M, L.</p><ui-dialog-close><button class="rp-button rp-dialog-close" type="button" data-variant="ghost" data-size="sm" data-slot="dialog-close">Close</button></ui-dialog-close></ui-dialog-content></ui-dialog>` },
  { name: 'badge-block-wraps-snippet', liquid: `{% block 'rp-badge', tone: 'success' %}In stock{% endblock %}`,
    html: `<span class="rp-badge" data-tone="success">In stock</span>` },
  { name: 'slot-captured-in-caller', liquid: `{% capture label %}{% block 'rp-badge' %}New{% endblock %}{% endcapture %}{% block 'rp-button', attributes: 'data-x="1"' %}{{ label }}{% endblock %}`,
    html: `<button class="rp-button" type="button" data-variant="primary" data-size="md" data-x="1"><span class="rp-badge" data-tone="neutral">New</span></button>` },
  { name: 'product-form', liquid: `{% block 'rp-product-form', product: product, accelerated_checkout: true %}{% block 'rp-button', type: 'submit', name: 'add' %}{{ 'ripple.product.add_to_cart' | t }}{% endblock %}{% endblock %}`,
    html: `<rp-product-form class="rp-product-form" data-product-id="gid://shopify/Product/7"><form method="post" action="/cart/add" id="rp-product-form-7" accept-charset="UTF-8" class="rp-product-form-fields" enctype="multipart/form-data"><input type="hidden" name="form_type" value="product"><input type="hidden" name="utf8" value="✓"><input type="hidden" name="id" value="42" data-rp-field="merchandise-id"><button class="rp-button" type="submit" name="add" data-variant="primary" data-size="md">Add to cart</button><p class="rp-form-message" data-rp-part="error" data-tone="critical" role="alert" hidden></p><div class="rp-product-form-accelerated"><div data-shopify="payment-button" class="shopify-payment-button"></div></div><input type="hidden" name="product-id" value="7"></form></rp-product-form>` },
  // The body cannot see variables assigned inside the block file, and cannot see `form`.
  { name: 'body-is-caller-scope', liquid: `{% block 'rp-product-form', product: product %}[{{ form_id }}|{{ variant.id }}|{{ form.id }}|{{ product.id }}]{% endblock %}`,
    html: `<rp-product-form class="rp-product-form" data-product-id="gid://shopify/Product/7"><form method="post" action="/cart/add" id="rp-product-form-7" accept-charset="UTF-8" class="rp-product-form-fields" enctype="multipart/form-data"><input type="hidden" name="form_type" value="product"><input type="hidden" name="utf8" value="✓"><input type="hidden" name="id" value="42" data-rp-field="merchandise-id">[|||7]<p class="rp-form-message" data-rp-part="error" data-tone="critical" role="alert" hidden></p><input type="hidden" name="product-id" value="7"></form></rp-product-form>` },
];

let failed = 0;
const log = [];
const engine = createEngine(theme, { log });
for (const c of cases) {
  // Case sources are parsed as if they were a template file, so {% block %} is allowed.
  const tpl = engine.parse(c.liquid, path.join(theme, 'templates', `${c.name}.liquid`));
  const got = canonicalize(await engine.render(tpl, { product }, { globals }));
  const want = canonicalize(c.html);
  const ok = got === want;
  if (!ok) { failed++; console.log(`FAIL ${c.name}\n--- want\n${want}--- got\n${got}`); } else console.log(`ok   ${c.name}`);
}

// Whole page: template inside layout, the way Shopify composes them.
const body = await engine.renderFile('product', { product }, { globals });
const page = await engine.renderFile('theme', { product }, { globals: { ...globals, content_for_layout: body } });
fs.writeFileSync('fixtures/product-page.html', page);
console.log(`page bytes: ${page.length}; partials seen: ${JSON.stringify(log)}`);

// A block file must not call a block.
try {
  fs.writeFileSync(path.join(theme, 'blocks', 'zz-bad.liquid'), `{% block 'rp-button' %}x{% endblock %}`);
  const e2 = createEngine(theme);
  await e2.parseAndRender(`{% block 'zz-bad' %}{% endblock %}`, {}, { globals });
  console.log('FAIL nested block was accepted'); failed++;
} catch (e) { console.log(`ok   nested block rejected: ${String(e.message).split('\n')[0]}`); }
finally { fs.rmSync(path.join(theme, 'blocks', 'zz-bad.liquid')); }

process.exit(failed ? 1 : 0);
