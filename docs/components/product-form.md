# ProductForm

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `product-form` |
| Kind | `commerce` |
| Category | `product` |
| Custom elements | `rp-product-form` |
| Root element and class | `rp-product-form` `.rp-product-form` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes |
| Depends on | `add-to-cart-button`, `quantity-input`, `form-message` |
| Milestone | M3 |

### Purpose

The add-to-cart form for one product variant. It posts natively; with JavaScript the cart store handles the submit and the cart opens.

- Use when: selling one product (product page, quick add).
- Do not use when: choosing a variant (use VariantPicker as a sibling, before the form) or changing a line already in the cart (use CartLines).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `ProductForm` | `blocks/product-form.liquid` | `rp-product-form` | `rp-product-form` | `data-slot="rp-product-form"` | yes | none |
| fields | printed by root | same | `form` | `rp-product-form-fields` | none | yes | `<id>` |
| variant field | printed by root | same | `input type="hidden"` | none | `data-rp-field="merchandise-id"` | yes | none |
| quantity | printed by root (default body) | same | `div` | `rp-product-form-quantity` | none | no | none |
| accelerated | printed by root | same | `div` | `rp-product-form-accelerated` | `data-agent-confirm` | when `acceleratedCheckout` | none |
| error | printed by root | same | `p` | `rp-form-message` | `data-rp-part="error"` | yes | none |

Nesting rules: fields is the only child of root. Children of fields in this order: variant field, body (default body or the caller's children), accelerated, error. The body MUST contain exactly one AddToCartButton. A VariantPicker MUST NOT be inside a ProductForm (a GET form cannot be nested in the add form). The `id` prop is printed on the `<form>`, not on root.

Default body (printed when the caller passes no children): the quantity part containing one QuantityInput (`name` from the dialect, `defaultValue` 1, `min` 1, `step` 1, `ariaLabel` from locale key `ripple.product-form.quantity`), then one AddToCartButton with `fullWidth`, `disabled` when the variant is missing or not available.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on the `<form>` |
| `product` | `product` | object | `RippleProduct & { selectedOrFirstAvailableVariant?: RippleVariant \| null }` / Liquid `product` drop | none | yes | no | default variant; Liquid `{% form 'product', product %}` |
| `variant` | `variant` | object | `RippleVariant` / Liquid `variant` drop | TSX: `product.selectedOrFirstAvailableVariant`; Liquid: `product.selected_or_first_available_variant` | no | no | `value` of the variant field; availability of the default body |
| `acceleratedCheckout` | `accelerated_checkout` | boolean | `true false` | `false` | no | no | the accelerated part (opaque platform markup, D-050) |
| `action` | none | url | route of `createCartServerHandlers()`, including the locale path prefix (for example `/fr-ca/api/cart`; CV-17, D-118) | `/api/cart` | no | no | `action` on the `<form>`; TSX hosts only (Liquid: `routes.cart_add_url`, printed by `{% form %}`) |

### Content model

`flow` - form controls and exactly one AddToCartButton. Children replace the default body. Any named control in the body is posted with the form (line attributes: `attributes.<key>` on the hydrogen backend, `properties[<key>]` on Liquid).

### HTML contract

Fixture `default` (`id`: `pf`, `product`: `product.basic`; no children):

```html
<rp-product-form class="rp-product-form" data-slot="rp-product-form">
  <form class="rp-product-form-fields" id="pf" method="post" action="/api/cart">
    <input type="hidden" name="merchandiseId" value="gid://shopify/ProductVariant/11" data-rp-field="merchandise-id">
    <div class="rp-product-form-quantity">
      <rp-quantity class="rp-quantity" data-size="md" data-slot="rp-quantity">
        <button class="rp-quantity-button" type="button" disabled aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
        <input class="rp-quantity-input" type="number" inputmode="numeric" name="quantity" min="1" step="1" value="1" aria-label="Quantity" data-rp-part="input" data-rp-field="quantity">
        <button class="rp-quantity-button" type="button" aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
      </rp-quantity>
    </div>
    <button class="rp-button rp-add-to-cart-button" type="submit" name="intent" value="add" data-variant="primary" data-size="md" data-full-width="" data-rp-part="submit">Add to cart</button>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  </form>
</rp-product-form>
```

Fixture `children` (`id`: `pf`, `product`: `product.basic`; children: the reference HTML of AddToCartButton `default`):

```html
<rp-product-form class="rp-product-form" data-slot="rp-product-form">
  <form class="rp-product-form-fields" id="pf" method="post" action="/api/cart">
    <input type="hidden" name="merchandiseId" value="gid://shopify/ProductVariant/11" data-rp-field="merchandise-id">
    <button class="rp-button rp-add-to-cart-button" type="submit" name="intent" value="add" data-variant="primary" data-size="md" data-rp-part="submit">Add to cart</button>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  </form>
</rp-product-form>
```

Fixture `sold-out` (`id`: `pf`, `product`: `product.sold-out`; no children): as `default` with `value="gid://shopify/ProductVariant/31"` on the variant field, and the AddToCartButton printed as:

```html
<button class="rp-button rp-add-to-cart-button" type="submit" name="intent" value="add" data-variant="primary" data-size="md" data-full-width="" data-rp-part="submit" disabled>Sold out</button>
```

Fixture `accelerated` (`id`: `pf`, `product`: `product.basic`, `acceleratedCheckout`: true): as `default` with this element between the AddToCartButton and the error part (children shown for the hydrogen backend):

```html
<div class="rp-product-form-accelerated" data-agent-confirm="Buys this product now with an express checkout"><hydrogen-shop-pay-button></hydrogen-shop-pay-button></div>
```

Further required fixtures: `class` (root class `rp-product-form custom-a custom-b`).

What Liquid prints for `default` (shape of `{% form 'product' %}` from `ripple/docs/research/liquid-blocks-partials.md` section 2.6): the `<form>` has `action="/cart/add"`, `accept-charset="UTF-8"`, `enctype="multipart/form-data"` and two extra hidden inputs (`form_type`, `utf8`); the variant field is `<input type="hidden" name="id" value="11" data-rp-field="merchandise-id">`; the AddToCartButton has `name="add"` and no `value`.

Host-owned regions and masks: the form dialect (D-043) and the accelerated part (D-004). Masks, in this order:

```json
[
  { "select": "form.rp-product-form-fields", "op": "attr", "name": "action" },
  { "select": "form.rp-product-form-fields", "op": "drop-attr", "name": "accept-charset" },
  { "select": "form.rp-product-form-fields", "op": "drop-attr", "name": "enctype" },
  { "select": "form.rp-product-form-fields > input[type=\"hidden\"]:not([data-rp-field])", "op": "remove" },
  { "select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "name" },
  { "select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "value" },
  { "select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "name" },
  { "select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "value" }
]
```

Fixture `accelerated` adds `{ "select": ".rp-product-form-accelerated", "op": "children" }`. The two `drop-attr` masks on the form and the `remove` mask match only Liquid output; `drop-attr` and `remove` masks are exempt from rule F-19 of doc 02 (D-074). None of these masks targets a Ripple-owned attribute or class.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-pending` | root | element | from submit until the add settles | absent |
| `aria-busy` | root | element | same | absent |
| `hidden` | error part | element | removed when an add fails; set when a new submit starts | present |
| text | error part | element | the error message | empty |
| `disabled` | AddToCartButton | server | variant missing or not available | per variant |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-product-form [data-rp-part=\"error\"]", "attrs": ["hidden"], "text": true, "reason": "The element fills the error text and removes hidden when an add fails (D-045, D-071 item 3)." }` (the commerce error-part entry fixed by D-071 item 3; the manifest entry in `07-manifest-registry-cli.md` is equal). The element writes nothing at upgrade; the entry covers an add that fails while the element upgrades.

### Behaviour with JavaScript

1. On `submit` of the form, when `getCommerce().usable` is true and the submitter is `null` or matches `[data-rp-part="submit"]`: `preventDefault()`; a second submit while `data-pending` is present is ignored.
2. The root gets `data-pending=""` and `aria-busy="true"`; the error part is emptied and hidden.
3. The form is sent through `getCommerce().submitCart(form, submitter, event)`.
4. On success (no error and no warning recorded since step 2): `action` is dispatched on the root; unless a listener calls `preventDefault()`, `getCommerce().openCart()` opens the CartDrawer (or navigates to the cart page when no drawer exists); then `Added to cart` is announced.
5. On failure (a `userErrors` entry or a network error recorded since step 2; `hasUserError(state, started)`): the error part shows `errorMessage(state, "add") ?? strings.error` and loses `hidden`; nothing is announced through `announce()` (the part has `role="alert"`). Scope `"add"` includes messages Hydrogen keyed to an existing cart line (the variant was already in the cart), whether or not that line is rendered on the page (D-119).
5a. Warnings only (the store recorded warnings and no `userErrors`; the cart DID change): the error part shows the warning text as in item 5, AND `action` is dispatched and the cart opens as in item 4; `Added to cart` is not announced (D-119).
6. `data-pending` and `aria-busy` are removed in both cases.
7. A submit by a control without `data-rp-part="submit"` (the accelerated checkout buttons) is NOT intercepted.
8. The full sequence is specified in [05-commerce.md](05-commerce.md) section 7.2.

### Behaviour without JavaScript

The form posts natively: hydrogen backend to `/api/cart` (303 back to the product page); Liquid to `routes.cart_add_url` (the platform's response). The variant sent is the one the server rendered for the current URL (D-047). In the default body the quantity stepper buttons are invisible; the number input works. Nothing else is missing.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `action` | `rp-product-form` (cancelable; cancel to keep the cart closed) | `{ value: "add", reason: "submit", merchandiseId: string, quantity: number }` | `onAction` |
| method | `api.add()` | `rp-product-form` | none; same path as submitting the form | none |
| method | `api.setQuantity(quantity)` | `rp-product-form` | `quantity: number`; writes the `[data-rp-field="quantity"]` control | none |

### Accessibility

- Pattern: native form; `checkPattern`: none.
- Accessible name: none required for the form. Every control in the body MUST have its own name.
- Focus: stays on the submit button after an add; when the CartDrawer opens, the browser moves focus into the dialog.
- Announcements: `Added to cart` (key `ripple.product-form.added`) after a confirmed add; the error text through the `role="alert"` part.

| Key | Action |
|---|---|
| Enter in a field | submits the form (add to cart) |

### Styling

- File: `components/product-form/product-form.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--rp-duration-base`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-product-form-gap` | `calc(var(--spacing) * 4)` | block gap between children of the form |

| Modifier selector | Sets |
|---|---|
| `.rp-product-form[data-pending]` | `--_opacity: 0.7` (consumed by the submit button's `opacity`) |

Required rules: `.rp-product-form-fields { display: flex; flex-direction: column; gap: var(--rp-product-form-gap) }`. The root `rp-product-form` is a block box: `base.css` carries `rp-product-form { display: block }` (generated; D-021, D-080). `product-form.css` MUST NOT set `display: contents` or `display: none` on the root.

### Host notes

- HTML: use the hydrogen dialect of the fixture; `action` MUST be the cart endpoint including the locale path prefix of the page (CV-17).
- React: `ProductForm(props: { id: string; product: ProductFormProduct; variant?: RippleVariant | null; acceleratedCheckout?: boolean; action?: string; onAction?: (value: "add", detail: { merchandiseId: string; quantity: number }) => void; className?: string; children?: ReactNode })`. `suppressHydrationWarning` on the root, the form and the error part ([06-bindings.md](06-bindings.md) section 6.7). The accelerated part is `<div className="rp-product-form-accelerated" data-agent-confirm={strings?.agentConfirmAccelerated ?? "Buys this product now with an express checkout"} dangerouslySetInnerHTML={{ __html: renderShopPayButton({ variants: [{ id: variant.id, quantity: 1 }], disabled: !variant.availableForSale }) }} />` with `renderShopPayButton` from `@shopify/hydrogen` (`hydrogen/packages/hydrogen/src/core/shop-pay/shop-pay.ts`; a value import allowed by D-094, CV-9); `strings?: { added?: string; quantity?: string; agentConfirmAccelerated?: string }` is a prop (CV-2); it is not printed when there is no variant.
- Remix: `data-rmx-key="<id>"` on the root; `data-rmx-document` on the `<form>`; `data-rmx-preserve-attrs="hidden"` on the error part; `data-rmx-preserve-attrs="data-pending aria-busy"` on the root ([06-bindings.md](06-bindings.md) section 7.7).
- Liquid: `{% form 'product', product, id: id, class: 'rp-product-form-fields' %}`; variant field `name="id" value="{{ variant.id }}"`; the default body calls `{% render 'rp-quantity-input' %}` and `{% render 'rp-add-to-cart-button' %}`; the accelerated part is `<div class="rp-product-form-accelerated" data-agent-confirm="{{ 'ripple.product-form.agent_confirm_accelerated' | t }}">{{ form | payment_button }}</div>` (the `payment_button` filter is in the component scope of the Liquid subset, D-097). The root `rp-product-form` is printed by the binding and prints `{{ attributes }}` last (D-035); the fields part is printed by `{% form %}` and accepts only `id` and `class` (D-091 item 6). A caller-supplied body is rendered before the block runs and cannot read `form`. No schema settings. Locale keys: `ripple.product-form.added` = `Added to cart`; `ripple.product-form.quantity` = `Quantity`; `ripple.product-form.agent_confirm_accelerated` = `Buys this product now with an express checkout`.

```tsx
<ProductForm id="buy" product={product} acceleratedCheckout />
```

```liquid
{% block 'product-form', id: 'buy', product: product, accelerated_checkout: true %}{% endblock %}
```

### Commerce

- Store fields read: `cart.getState().errors` (through `errorMessage(state, "cart")`).
- Adapter methods called: `submitCart`, `openCart`, `usable`.
- Regions refreshed: none declared by this component. The cart regions named by the `rp-cart` roots on the page are refreshed by the adapter when the store settles ([05-commerce.md](05-commerce.md) section 8.4). The root MUST NOT carry `data-rp-refresh`.
- Pending and error behaviour: as in "State and attributes".

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Form | `<form method="post" action="/api/cart">` | `{% form 'product', product %}` (action `routes.cart_add_url`) |
| Variant | `merchandiseId` = variant gid | `id` = numeric variant id |
| Quantity | `quantity` | `quantity` |
| Selling plan (no V1 UI; pass-through) | `sellingPlanId`, `disabled` when empty | `selling_plan`, `disabled` when empty |
| Line attribute | `attributes.<key>` | `properties[<key>]` |
| Submit | `name="intent" value="add"` | `name="add"` |

### Agent surface

`bridge`; component `rp-product-form`; manifest `agent.actions`: `["setQuantity", "add"]` ([08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.2, D-095): `setQuantity(quantity: number): void` sets the quantity field; `add(): void` submits the form ("Add the selected variant to the cart"). Confirm: none on the root. In fixture `accelerated` the wrapper `.rp-product-form-accelerated` carries `data-agent-confirm="Buys this product now with an express checkout"` (doc 08 section 7.3; locale key `ripple.product-form.agent_confirm_accelerated`). Secret: none.

### Checker rules

RP104 (`id`, `product`), RP301, RP305 (dialect fields), RP110. Manifest `rules[]`: `product-form-one-submit` (`requires-descendant`, selector `:scope`, target `button[type="submit"][data-rp-part="submit"]`; "A ProductForm has no AddToCartButton, so nothing can be added to the cart."); `product-form-single-submit` (`max-count`, selector `[data-rp-part="submit"]`, count 1). The rule `variant-picker-outside-form`, which reports a VariantPicker inside a ProductForm, is defined once, in VariantPicker's manifest.

### Acceptance tests

1. Tier 2: fixtures `default`, `children`, `sold-out`, `accelerated`, `class` are canonical-equal in all four hosts with the masks above.
2. Tier 3: zero mutations at upgrade.
3. Tier 5: tests C-02 and C-07 of [05-commerce.md](05-commerce.md) section 14 (add payload, pending attributes, `action` detail, cart opens, non-submit-part submitter posts natively).
4. Tier 5: a listener that cancels `action` keeps `#cart-drawer` closed.
5. Tier 5: a failing add shows the message in the error part (`hidden` removed) and announces nothing.
6. Tier 6 and 7 (mock.shop): with scripting disabled, submitting the form adds the variant and the next page shows the cart count increased by the quantity.
7. Tier 4 (React): hydration with either script order logs no hydration error.
8. Tier 5: [05-commerce.md](05-commerce.md) test C-36 (a line-keyed `userErrors` message is shown in the product form error part; a warnings-only answer shows the text and still opens the cart; D-119).

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/05-commerce.md` sections 6.2, 7.2; `ripple/docs/06-bindings.md` sections 6.7, 7.7, 8.7; `ripple/docs/research/spikes/commerce/result.txt` (L2, D1, D2); `hydrogen/packages/hydrogen/src/core/cart/actions.ts` (form intent `add`); `hydrogen/packages/hydrogen/src/core/shop-pay/shop-pay.ts` (`renderShopPayButton`).
- UNVERIFIED: the real Standard Actions runtime (SPIKE-01); `{{ form | payment_button }}` output inside the Liquid developer preview (tier 8).

### Fallback (SPIKE-nn)

None. (SPIKE-01 changes only `adapter-liquid.ts`; this contract is unaffected.)

---
