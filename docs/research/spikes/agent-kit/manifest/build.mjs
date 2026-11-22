// Assembles ripple.manifest.json from per-component sources. Fixture html for static components is produced by the
// reference renderer from the template (spike: ../gen/emit.mjs), so template and fixtures cannot drift.
import { writeFileSync } from 'node:fs';
import { renderHtml } from '../gen/emit.mjs';
const P = 'ripple-kit';
const tpl = (c, props, children) => renderHtml({ props: c.props, template: c.template }, props, children);

const button = {
  name: 'button', title: 'Button', category: 'actions', kind: 'static', status: 'beta', since: '0.1.0',
  summary: 'A button or a link that looks like a button. Zero JavaScript.',
  useWhen: ['Submitting a form', 'Navigating to a route with button styling (pass href)', 'Triggering a command on another element (commandfor/command via attributes)'],
  dontUseWhen: [{ case: 'The control shows only an icon', use: 'icon-button' }, { case: 'Inline text link inside a paragraph', use: 'link' }, { case: 'Going to checkout', use: 'checkout-button' }],
  root: { elements: ['button', 'a'], class: 'rp-button' },
  props: [
    { name: 'variant', type: 'enum', values: ['primary', 'secondary', 'outline', 'ghost', 'link', 'destructive'], default: 'primary', attribute: 'data-variant', liquid: { name: 'variant', surface: 'setting', settingType: 'select' }, description: 'Visual treatment.' },
    { name: 'size', type: 'enum', values: ['sm', 'md', 'lg'], default: 'md', attribute: 'data-size', liquid: { name: 'size', surface: 'setting', settingType: 'select' }, description: 'Control height and padding.' },
    { name: 'type', type: 'enum', values: ['button', 'submit', 'reset'], default: 'button', attribute: 'type', liquid: { name: 'type', surface: 'param' }, description: 'Native button type. Ignored when href is set.' },
    { name: 'href', type: 'url', attribute: 'href', liquid: { name: 'href', surface: 'param' }, description: 'When set, the root element is <a>.' },
    { name: 'disabled', type: 'boolean', default: false, liquid: { name: 'disabled', surface: 'param' }, description: 'Native disabled on <button>; aria-disabled="true" and tabindex="-1" on <a>.' },
    { name: 'fullWidth', type: 'boolean', default: false, attribute: 'data-full-width', liquid: { name: 'full_width', surface: 'param' }, description: 'Stretch to the container width.' },
    { name: 'name', type: 'string', attribute: 'name', liquid: { name: 'name', surface: 'param' }, description: 'Form field name (button only).' },
    { name: 'value', type: 'string', attribute: 'value', liquid: { name: 'value', surface: 'param' }, description: 'Form field value (button only).' },
    { name: 'ariaLabel', type: 'string', attribute: 'aria-label', liquid: { name: 'aria_label', surface: 'param' }, description: 'Accessible name. Required when the content has no text.' },
    { name: 'id', type: 'id', attribute: 'id', liquid: { name: 'id', surface: 'param' }, description: 'Root element id.' },
  ],
  content: { model: 'text', required: true, description: 'The label. May include an icon.' },
  parts: [],
  template: {
    tag: { if: { set: 'href' }, then: 'a', else: 'button' },
    attrs: [
      { name: 'class', value: ['rp-button', { prop: 'class' }] },
      { name: 'id', value: { prop: 'id' }, when: { set: 'id' } },
      { name: 'href', value: { prop: 'href' }, when: { set: 'href' } },
      { name: 'type', value: { prop: 'type' }, when: { not: { set: 'href' } } },
      { name: 'name', value: { prop: 'name' }, when: { all: [{ set: 'name' }, { not: { set: 'href' } }] } },
      { name: 'value', value: { prop: 'value' }, when: { all: [{ set: 'value' }, { not: { set: 'href' } }] } },
      { name: 'disabled', when: { all: [{ true: 'disabled' }, { not: { set: 'href' } }] } },
      { name: 'aria-disabled', value: 'true', when: { all: [{ true: 'disabled' }, { set: 'href' }] } },
      { name: 'tabindex', value: '-1', when: { all: [{ true: 'disabled' }, { set: 'href' }] } },
      { name: 'data-variant', value: { prop: 'variant' } },
      { name: 'data-size', value: { prop: 'size' } },
      { name: 'data-full-width', when: { true: 'fullWidth' } },
      { name: 'aria-label', value: { prop: 'ariaLabel' }, when: { set: 'ariaLabel' } },
    ],
    children: [{ slot: 'children' }],
  },
  noJs: { level: 'full', behavior: 'Native <button> or <a>. Nothing to enhance.' },
  a11y: { pattern: 'native', checkPattern: null, name: { required: 'when-no-text', sources: ['text content', 'aria-label'] }, keyboard: [{ keys: 'Enter, Space', does: 'Activates (native).' }], focus: 'Focus ring from :focus-visible using --color-ring.' },
  agent: { surface: 'accessibility-tree' },
  dependencies: { components: [], elements: [], tokens: ['--color-primary', '--color-primary-foreground', '--radius-button', '--color-ring'] },
  liquid: { block: 'button', snippet: 'rp-button' },
  rules: [
    { id: 'no-interactive-descendant', kind: 'forbids-ancestor', selector: '.rp-button', target: 'a, button', message: 'A Button is inside another link or button.', fix: 'Move the Button out, or make the outer element a non-interactive container.' },
  ],
  files: {
    shared: [{ source: 'css/components/button.css', target: '@styles/components/button.css', type: 'css', generated: false }],
    react: [{ source: 'react/button.tsx', target: '@components/button.tsx', type: 'binding', generated: true }],
    remix: [{ source: 'remix/button.tsx', target: '@components/button.tsx', type: 'binding', generated: true }],
    liquid: [
      { source: 'liquid/snippets/rp-button.liquid', target: 'snippets/rp-button.liquid', type: 'snippet', generated: true },
      { source: 'liquid/blocks/button.liquid', target: 'blocks/button.liquid', type: 'block', generated: true },
      { source: 'liquid/locales/button.json', target: 'locales/*.schema.json', type: 'asset', mode: 'patch', generated: true },
    ],
  },
};
button.fixtures = [
  { name: 'default', props: {}, children: 'Add to cart' },
  { name: 'submit-outline-lg', props: { variant: 'outline', size: 'lg', type: 'submit', name: 'add' }, children: 'Add to cart' },
  { name: 'link', props: { href: '/cart' }, children: 'View cart' },
  { name: 'link-disabled', props: { href: '/cart', disabled: true }, children: 'View cart' },
  { name: 'invalid-enum-falls-back', props: { variant: 'loud' }, children: 'Buy' },
].map((f) => ({ ...f, html: tpl(button, f.props, f.children), generated: 'template' }));

const stack = {
  name: 'stack', title: 'Stack', category: 'layout', kind: 'static', status: 'beta', since: '0.1.0',
  summary: 'Vertical flex layout with a gap. Zero JavaScript.',
  useWhen: ['Stacking children vertically with consistent spacing'],
  dontUseWhen: [{ case: 'Children flow horizontally and wrap', use: 'inline' }, { case: 'Columns', use: 'grid' }],
  root: { elements: ['div', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'main', 'ul', 'ol'], class: 'rp-stack' },
  props: [
    { name: 'tag', type: 'enum', values: ['div', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'main', 'ul', 'ol'], default: 'div', liquid: { name: 'tag', surface: 'param' }, description: 'Root element.' },
    { name: 'gap', type: 'scale', scale: 'space', responsive: true, attribute: 'data-gap', liquid: { name: 'gap', surface: 'param' }, description: 'Space between children.' },
    { name: 'align', type: 'enum', values: ['start', 'center', 'end', 'stretch', 'baseline'], responsive: true, attribute: 'data-align', liquid: { name: 'align', surface: 'param' }, description: 'Cross-axis alignment.' },
    { name: 'justify', type: 'enum', values: ['start', 'center', 'end', 'between'], responsive: true, attribute: 'data-justify', liquid: { name: 'justify', surface: 'param' }, description: 'Main-axis distribution.' },
    { name: 'p', type: 'scale', scale: 'space', responsive: true, attribute: 'data-p', liquid: { name: 'p', surface: 'param' }, description: 'Padding on all sides.' },
    { name: 'id', type: 'id', attribute: 'id', liquid: { name: 'id', surface: 'param' }, description: 'Root element id.' },
  ],
  content: { model: 'flow', required: false, description: 'Any elements.' },
  parts: [],
  template: {
    tag: { prop: 'tag' },
    attrs: [
      { name: 'class', value: ['rp-stack', { prop: 'class' }] },
      { name: 'id', value: { prop: 'id' }, when: { set: 'id' } },
      { name: 'data-gap', value: { prop: 'gap' }, when: { set: 'gap' } },
      { name: 'data-align', value: { prop: 'align' }, when: { set: 'align' } },
      { name: 'data-justify', value: { prop: 'justify' }, when: { set: 'justify' } },
      { name: 'data-p', value: { prop: 'p' }, when: { set: 'p' } },
    ],
    children: [{ slot: 'children' }],
  },
  noJs: { level: 'full', behavior: 'CSS only.' },
  a11y: { pattern: 'none', checkPattern: null, name: { required: 'never', sources: [] } },
  agent: { surface: 'accessibility-tree' },
  dependencies: { components: [], elements: [], tokens: ['--spacing'] },
  liquid: { block: 'stack' },
  files: {
    shared: [{ source: 'css/components/stack.css', target: '@styles/components/stack.css', type: 'css', generated: false }, { source: 'css/props.css', target: '@styles/props.css', type: 'css', generated: true }],
    react: [{ source: 'react/stack.tsx', target: '@components/stack.tsx', type: 'binding', generated: true }],
    remix: [{ source: 'remix/stack.tsx', target: '@components/stack.tsx', type: 'binding', generated: true }],
    liquid: [{ source: 'liquid/blocks/stack.liquid', target: 'blocks/stack.liquid', type: 'block', generated: true }],
  },
};
stack.fixtures = [
  { name: 'default', props: {}, children: '<p>One</p><p>Two</p>' },
  { name: 'responsive-gap', props: { gap: '2 md:6', align: 'start' }, children: '<p>One</p><p>Two</p>' },
  { name: 'list', props: { tag: 'ul', gap: '4' }, children: '<li>One</li>' },
].map((f) => ({ ...f, html: tpl(stack, f.props, f.children), generated: 'template' }));

// Dialog: closed-state markup is the zero-diff upgrade snapshot from uisdk-web-elements.md section 3.2.
const dialog = {
  name: 'dialog', title: 'Dialog', category: 'overlays', kind: 'ui', status: 'beta', since: '0.1.0',
  summary: 'A modal window over the page, opened by a trigger button.',
  useWhen: ['Short, self-contained content that must interrupt: size guide, confirm, quick view'],
  dontUseWhen: [{ case: 'Panel sliding from a screen edge (cart, mobile menu)', use: 'drawer' }, { case: 'Content that must be reachable when JavaScript never loads', use: 'a link to a page, or accordion' }],
  root: { elements: ['ui-dialog'], class: 'rp-dialog', requiresId: true },
  props: [
    { name: 'id', type: 'id', required: true, attribute: 'id', liquid: { name: 'id', surface: 'param' }, description: 'Unique, stable id. Part ids derive from it: <id>-trigger, <id>-title, <id>-description.' },
    { name: 'defaultOpen', type: 'boolean', default: false, attribute: 'default-open', hosts: ['html', 'react', 'remix'], description: 'Open on first render. Not available in Liquid V1: the server cannot print open-state markup.' },
    { name: 'open', type: 'boolean', hosts: ['react'], description: 'Controlled open state (React only). Use with onOpenChange.' },
  ],
  content: { model: 'parts', required: true },
  parts: [
    { name: 'trigger', component: 'dialog-trigger', elements: ['ui-dialog-trigger'], class: 'rp-dialog-trigger', required: true, multiple: true, authoredBy: 'author', parent: 'root', description: 'Wraps one native <button class="rp-button">.' },
    { name: 'backdrop', elements: ['ui-dialog-backdrop'], class: 'rp-dialog-backdrop', required: true, authoredBy: 'component', parent: 'root' },
    { name: 'content', component: 'dialog-content', elements: ['ui-dialog-content'], class: 'rp-dialog-content', required: true, authoredBy: 'author', parent: 'root' },
    { name: 'title', component: 'dialog-title', elements: ['ui-dialog-title'], class: 'rp-dialog-title', required: true, authoredBy: 'author', parent: 'content' },
    { name: 'description', component: 'dialog-description', elements: ['ui-dialog-description'], class: 'rp-dialog-description', required: false, authoredBy: 'author', parent: 'content' },
    { name: 'close', elements: ['ui-dialog-close'], class: 'rp-dialog-close', required: true, authoredBy: 'component', parent: 'content', description: 'Icon button printed by dialog-content; label from locale key dialog.close.' },
  ],
  template: {
    tag: 'ui-dialog',
    attrs: [{ name: 'id', value: { prop: 'id' } }, { name: 'class', value: ['rp-dialog', { prop: 'class' }] }, { name: 'default-open', when: { true: 'defaultOpen' } }],
    children: [{ slot: 'children' }],
  },
  state: [{ name: 'open', type: 'boolean', attribute: 'default-open', defaultAttribute: 'default-open', property: 'open', reflects: ['data-open', 'data-closed', 'hidden'] }],
  events: [{ dom: 'openchange', react: 'onOpenChange', detail: '{ value: boolean, reason: string, source: string }', bubbles: false, cancelable: true }],
  fixtures: [{
    name: 'closed', props: { id: 'size-guide' }, generated: 'upgrade-snapshot',
    parts: { trigger: 'Size guide', title: 'Size guide', content: '<p>Measure your foot.</p>' },
    html: '<ui-dialog id="size-guide" class="rp-dialog"><ui-dialog-trigger class="rp-dialog-trigger"><button type="button" id="size-guide-trigger" class="rp-button" data-variant="link" data-size="md" aria-haspopup="dialog" data-closed data-slot="dialog-trigger">Size guide</button></ui-dialog-trigger><ui-dialog-backdrop class="rp-dialog-backdrop" hidden data-slot="dialog-backdrop"></ui-dialog-backdrop><ui-dialog-content class="rp-dialog-content" hidden data-slot="dialog-content"><ui-dialog-title id="size-guide-title" class="rp-dialog-title" role="heading" aria-level="2" data-slot="dialog-title">Size guide</ui-dialog-title><p>Measure your foot.</p><ui-dialog-close class="rp-dialog-close"><button type="button" class="rp-icon-button" aria-label="Close" data-slot="dialog-close"></button></ui-dialog-close></ui-dialog-content></ui-dialog>',
  }],
  noJs: { level: 'none', behavior: 'The trigger does nothing and the content stays hidden. Do not put required content only in a Dialog. For an opener with a page equivalent, use a plain link (see drawer / cart-drawer).', hideUntilDefined: [] },
  a11y: {
    pattern: 'dialog (modal)', checkPattern: 'dialog',
    name: { required: 'always', sources: ['dialog-title (aria-labelledby is wired by ui-dialog)'] },
    keyboard: [{ keys: 'Escape', does: 'Closes and returns focus to the trigger.' }, { keys: 'Tab, Shift+Tab', does: 'Cycle inside the dialog; the page behind is inert.' }],
    focus: 'On open, focus moves into the content. On close, focus returns to the trigger.',
  },
  agent: {
    surface: 'bridge', component: 'dialog',
    actions: [{ name: 'setOpen', args: [{ name: 'open', type: 'boolean' }], description: 'Open or close the dialog.' }, { name: 'press', args: [{ name: 'buttonText', type: 'string' }], description: 'Press a button inside the dialog by its text; opens the dialog first.' }],
  },
  dependencies: { components: ['button', 'icon-button', 'icon'], embeds: ['button', 'icon-button'], elements: ['ui-dialog', 'ui-dialog-trigger', 'ui-dialog-backdrop', 'ui-dialog-content', 'ui-dialog-title', 'ui-dialog-description', 'ui-dialog-close'], uiSdk: ['@ui-sdk/web/dialog'], tokens: ['--color-overlay', '--radius-card', '--ease-drawer'], icons: ['x'], locale: ['dialog.close'] },
  liquid: { block: 'dialog' },
  rules: [
    { id: 'dialog-needs-title', kind: 'requires-descendant', selector: 'ui-dialog.rp-dialog', target: 'ui-dialog-title', message: 'A Dialog has no title, so it has no accessible name.', fix: 'Add a dialog-title part inside dialog-content.' },
    { id: 'dialog-not-in-form', kind: 'forbids-ancestor', selector: 'ui-dialog.rp-dialog:has(form)', target: 'form', message: 'A Dialog that contains a form is inside another form.', fix: 'Move the Dialog outside the outer form.' },
    { id: 'dialog-content-hidden', kind: 'requires-attribute', selector: 'ui-dialog:not([default-open]) > ui-dialog-content', target: 'hidden', message: 'Closed dialog content is not hidden in server HTML; it shows until JavaScript loads.', fix: 'Use the dialog-content binding instead of hand-written markup.' },
  ],
  files: {
    shared: [{ source: 'css/components/dialog.css', target: '@styles/components/dialog.css', type: 'css', generated: false }],
    react: [{ source: 'react/dialog.tsx', target: '@components/dialog.tsx', type: 'binding', generated: true }],
    remix: [{ source: 'remix/dialog.tsx', target: '@components/dialog.tsx', type: 'binding', generated: true }],
    liquid: [
      { source: 'liquid/blocks/dialog.liquid', target: 'blocks/dialog.liquid', type: 'block', generated: true },
      { source: 'liquid/blocks/dialog-trigger.liquid', target: 'blocks/dialog-trigger.liquid', type: 'block', generated: true },
      { source: 'liquid/blocks/dialog-content.liquid', target: 'blocks/dialog-content.liquid', type: 'block', generated: true },
      { source: 'liquid/blocks/dialog-title.liquid', target: 'blocks/dialog-title.liquid', type: 'block', generated: true },
      { source: 'liquid/locales/dialog.json', target: 'locales/*.json', type: 'asset', mode: 'patch', generated: true },
    ],
  },
};

const productForm = {
  name: 'product-form', title: 'ProductForm', category: 'product', kind: 'commerce', status: 'beta', since: '0.1.0',
  summary: 'The add-to-cart form for one product. Works as a plain form post; enhanced through the Hydrogen cart store.',
  useWhen: ['Selling one product: wraps quantity, selling plan and the submit button'],
  dontUseWhen: [{ case: 'Choosing options/variants', use: 'variant-picker (outside the form; option values are links)' }, { case: 'Changing a line already in the cart', use: 'cart-line' }],
  root: { elements: ['rp-product-form'], class: 'rp-product-form' },
  props: [
    { name: 'product', type: 'object', objectType: 'product | ProductInput', required: true, liquid: { name: 'product', surface: 'param' }, description: 'The product being sold.' },
    { name: 'variant', type: 'object', objectType: 'variant | ProductVariant', liquid: { name: 'variant', surface: 'param' }, description: 'Selected variant. Default: the selected or first available variant.' },
    { name: 'acceleratedCheckout', type: 'boolean', default: false, liquid: { name: 'accelerated_checkout', surface: 'param' }, description: 'Print accelerated checkout buttons after the body.' },
    { name: 'id', type: 'id', attribute: 'id', liquid: { name: 'id', surface: 'param' }, description: 'Id of the inner <form>.' },
  ],
  content: { model: 'flow', required: true, description: 'Form controls and exactly one submit Button. In Liquid the submit Button MUST have name: \'add\'.' },
  parts: [
    { name: 'fields', elements: ['form'], class: 'rp-product-form-fields', required: true, authoredBy: 'component', parent: 'root', description: 'The native form. action, method and hidden inputs are host-owned.' },
    { name: 'error', elements: ['p'], class: 'rp-form-message', required: true, authoredBy: 'component', parent: 'fields', description: 'role="alert", hidden until an add fails.' },
  ],
  state: [
    { name: 'pending', type: 'boolean', attribute: 'data-pending', reflects: ['data-pending', 'aria-busy'] },
    { name: 'unavailable', type: 'boolean', attribute: 'data-unavailable', reflects: ['data-unavailable'] },
  ],
  events: [{ dom: 'add', react: 'onAdd', detail: '{ merchandiseId: string, quantity: number }', bubbles: false, cancelable: true }],
  fixtures: [{
    name: 'available', props: { product: '$fixture:product.snowboard', id: 'pf' }, generated: 'hand',
    children: '<button class="rp-button" type="submit" name="add" data-variant="primary" data-size="md">Add to cart</button>',
    mask: ['form[action]', 'form[method]', 'form > input[type=hidden]', '[data-product-id]'],
    html: '<rp-product-form class="rp-product-form" data-product-id="MASKED"><form id="pf" class="rp-product-form-fields" action="MASKED" method="MASKED"><input type="hidden" data-rp-field="merchandise-id" name="MASKED" value="MASKED"><button class="rp-button" type="submit" name="add" data-variant="primary" data-size="md">Add to cart</button><p class="rp-form-message" data-rp-part="error" data-tone="critical" role="alert" hidden></p></form></rp-product-form>',
  }],
  noJs: { level: 'full', behavior: 'The inner form posts to the host cart endpoint (Liquid: /cart/add with id; Hydrogen host: /api/cart with merchandiseId) and the browser navigates. If ripple.js fails to load or the cart store cannot be created, the element MUST NOT call preventDefault().' },
  a11y: { pattern: 'native', checkPattern: null, name: { required: 'never', sources: [] }, announces: ['"Added to cart" via announce() after a confirmed add', 'error text in the role="alert" part'] },
  agent: {
    surface: 'bridge', component: 'rp-product-form',
    actions: [
      { name: 'setQuantity', args: [{ name: 'quantity', type: 'number' }], description: 'Set the quantity field.' },
      { name: 'add', description: 'Add the selected variant to the cart (same path as submitting the form).' },
    ],
    confirm: [{ part: 'accelerated checkout buttons', sentence: 'Buys this product now with accelerated checkout' }],
  },
  dependencies: { components: ['button', 'form-message'], embeds: ['form-message'], elements: ['rp-product-form'], hydrogen: ['createCartStore', 'CartStore.handleFormSubmit'], tokens: [], locale: ['product_form.added', 'product_form.error'] },
  liquid: {
    block: 'product-form',
    formDialect: { variant: 'id', quantity: 'quantity', sellingPlan: 'selling_plan', lineProperty: 'properties[<key>]', submit: 'button[name="add"]' },
    partials: [{ name: 'cart-lines', refreshedBy: 'rp-cart', on: 'cart store confirms a change' }],
  },
  hydrogenHost: { formDialect: { variant: 'merchandiseId', quantity: 'quantity', sellingPlan: 'sellingPlanId', lineProperty: 'attributes.<key>', submit: 'button[name="intent"][value="add"] or bare submit' } },
  rules: [
    { id: 'product-form-one-submit', kind: 'requires-descendant', selector: 'rp-product-form', target: 'button[type=submit]', message: 'A ProductForm has no submit button, so nothing can be added to the cart.', fix: 'Put one Button with type submit inside the ProductForm.' },
    { id: 'variant-picker-outside-form', kind: 'forbids-ancestor', selector: '.rp-variant-picker', target: 'rp-product-form form', message: 'A VariantPicker is inside the ProductForm form. Option values are links and must not submit with the form.', fix: 'Render VariantPicker as a sibling before ProductForm.' },
  ],
  files: {
    shared: [{ source: 'css/components/product-form.css', target: '@styles/components/product-form.css', type: 'css', generated: false }],
    react: [{ source: 'react/product-form.tsx', target: '@components/product-form.tsx', type: 'binding', generated: false }],
    remix: [{ source: 'remix/product-form.tsx', target: '@components/product-form.tsx', type: 'binding', generated: false }],
    liquid: [
      { source: 'liquid/blocks/product-form.liquid', target: 'blocks/product-form.liquid', type: 'block', generated: false },
      { source: 'liquid/locales/product-form.json', target: 'locales/*.json', type: 'asset', mode: 'patch', generated: true },
    ],
  },
};

const manifest = {
  $schema: './manifest.schema.json', manifestVersion: 1,
  package: { name: P, version: '0.1.0' },
  prefix: { css: 'rp-', element: 'rp-', liquidFile: '' },
  pins: { '@ui-sdk/core': '0.1.0-beta.14', '@ui-sdk/web': '0.1.0-beta.14', '@shopify/hydrogen': '2026.10.3' },
  scales: { breakpoint: ['sm', 'md', 'lg', 'xl', '2xl'], space: ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24'] },
  hosts: ['html', 'react', 'remix', 'liquid'],
  components: { button, stack, dialog, 'product-form': productForm },
};
writeFileSync('ripple.manifest.json', JSON.stringify(manifest, null, 2) + '\n');
for (const [k, v] of Object.entries(manifest.components)) writeFileSync(`components/${k}.json`, JSON.stringify(v, null, 2) + '\n');
console.log('components', Object.keys(manifest.components).length, 'bytes', JSON.stringify(manifest).length);
