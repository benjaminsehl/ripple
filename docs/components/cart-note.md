# CartNote

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `cart-note` |
| Kind | `commerce` |
| Category | `cart` |
| Custom elements | `rp-cart` |
| Root element and class | `rp-cart` `.rp-cart-note` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes (printed on the textarea) |
| Depends on | `label`, `textarea`, `button`, `form-message` |
| Milestone | M3 |

### Purpose

A textarea for the order note, saved to the cart.

- Use when: the merchant wants a free-text note on the order, on the cart page or in CartDrawer.
- Do not use when: collecting structured data (use cart attribute inputs, [05-commerce.md](05-commerce.md) section 6.2) or per-line data (line item properties in ProductForm).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CartNote` | `blocks/cart-note.liquid` + `snippets/rp-cart-note.liquid` | `rp-cart` | `rp-cart-note` | `data-slot="rp-cart"` | yes | none |
| form | printed by root | same | `form` (hydrogen) or `div` (liquid) | `rp-cart-note-form` | none | yes | none |
| label | printed by root | same | `label` | `rp-label` | none | yes | none |
| field | printed by root | same | `textarea` | `rp-textarea` | `data-rp-field="note"` | yes | `<id>` |
| save (hydrogen backend only) | printed by root | same | `button` | `rp-button` | `data-rp-part="submit"`, `data-rp-js="fallback"` | yes on hydrogen | none |
| error | printed by root | same | `p` | `rp-form-message` | `data-rp-part="error"` | yes | none |
| status | printed by root | same | `p` | `rp-visually-hidden` | `data-rp-part="status"`, `role="status"` | yes | none |

Nesting rules: root children in order: the form part, status. Form children in order: label, field, save, error. The root MUST NOT carry `data-rp-refresh`. On Liquid the field joins the cart form of CartLines through `form="<cart_lines>-form"`; the root MUST NOT be inside that form's region.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on the field; `for` on the label |
| `cart` | `cart` | object | `RippleCart` / Liquid `cart` drop | Liquid: the global `cart` | yes (TSX) | no | text content of the field (`cart.note`) |
| `cartLines` | `cart_lines` | string | the `id` of the CartLines on the page | none | yes on Liquid | no | Liquid: `form="<value>-form"` on the field; ignored on hydrogen hosts |
| `rows` | `rows` | number | integer 1 or greater | `3` | no | no | `rows` on the field |

### Content model

`text` - the label text. Default `Order note`.

### HTML contract

Fixture `default` (`id`: `note`, `cart`: `cart.two-lines`; hosts `html`, `react`, `remix`):

```html
<rp-cart class="rp-cart-note" data-slot="rp-cart">
  <form class="rp-cart-note-form" method="post" action="/api/cart">
    <label class="rp-label" for="note">Order note</label>
    <textarea class="rp-textarea" id="note" name="note" rows="3" data-size="md" data-rp-field="note"></textarea>
    <button class="rp-button" type="submit" name="intent" value="note-update" data-variant="outline" data-size="sm" data-rp-part="submit" data-rp-js="fallback">Save note</button>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  </form>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

Fixture `liquid-default` (`id`: `note`, `cart_lines`: `cart`; host `liquid`):

```html
<rp-cart class="rp-cart-note" data-slot="rp-cart">
  <div class="rp-cart-note-form">
    <label class="rp-label" for="note">Order note</label>
    <textarea class="rp-textarea" id="note" name="note" rows="3" form="cart-form" data-size="md" data-rp-field="note"></textarea>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  </div>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

Further required fixtures (both variants): `with-note` (cart note `Leave at the door <3`; textarea content `Leave at the door &lt;3`); `children` (children `Gift message`; label text `Gift message`); `rows` (`rows`: `5`); `class` (root class `rp-cart-note custom-a custom-b`).

Host-owned regions and masks: none beyond the two variants. Mask: `{ "select": "form.rp-cart-note-form", "op": "attr", "name": "action" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-pending` | root | `rp-cart` | the cart store is busy | absent |
| `aria-busy` | root | `rp-cart` | the cart store is busy (`"true"`) | absent |
| `hidden` | error | `rp-cart` | no cart-scope error | present |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-cart", "attrs": ["data-pending", "aria-busy"], "reason": "The store may already hold a pending mutation when the element upgrades." }`, `{ "select": "[data-rp-part=\"error\"]", "attrs": ["hidden"], "text": true, "reason": "The error part shows the result of a mutation that completed during upgrade." }`, `{ "select": "[data-rp-part=\"status\"]", "text": true, "reason": "The status part announces a mutation that completed during upgrade." }`.

### Behaviour with JavaScript

1. On `change` of the field (blur after an edit), `rp-cart` calls `form.requestSubmit(<the submit part of the field's form>)`. hydrogen backend: the form is the CartNote form; its submit is intercepted and sent as `note-update`. liquid backend: the field's form is the cart form in CartLines; the CartLines root intercepts the submit and `translateLiquidForm` yields a `note-update` op because the note differs from its `defaultValue`.
2. On success `Note saved` is written to the status part of the root that handled the submit (hydrogen: this root; liquid: the CartLines root). A failure shows in the error part (cart scope; the same message also appears in the CartLines error part).
3. The Save button (hydrogen) is hidden once the document is ready (`data-rp-js="fallback"`).

### Behaviour without JavaScript

hydrogen backend: `Save note` posts `intent=note-update`; 303 back to the page. liquid backend: the note is sent with the cart form when the buyer presses `Update cart` or the checkout button.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: labelled textarea; `checkPattern`: none.
- Accessible name: the label (`for` = field id); required.
- Focus: nothing moves focus.
- Announcements: `Note saved` through the status part; errors through `role="alert"`.

| Key | Action |
|---|---|
| Tab out of the edited field | saves the note |

### Styling

- File: `components/cart-note/cart-note.css` (layer `rp.components`).
- Tokens used: `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-cart-note-gap` | `calc(var(--spacing) * 2)` | space between label, field, button and message |

| Modifier selector | Sets |
|---|---|
| None | |

Required rules: root `display: block`; `.rp-cart-note-form { display: flex; flex-direction: column; align-items: stretch; gap: var(--rp-cart-note-gap) }`; `.rp-cart-note-form > .rp-button { align-self: flex-start }`.

### Host notes

- HTML: copy the `default` contract.
- React: `CartNote(props: { id: string; cart: RippleCart; cartLines?: string; rows?: number; className?: string; children?: ReactNode })`. No hook, no directive. The field is the embedded Textarea: `<Textarea id={id} name="note" rows={rows} defaultValue={cart.note} rpField="note" />` (uncontrolled; `data-rp-field` through `rpField`, section 0.2). The save button is printed by the binding itself (section 0.2). The error part carries `suppressHydrationWarning`.
- Remix: `data-rmx-key="<id>"` on root.
- Liquid: the field is `{% render 'rp-textarea', id: id, name: 'note', rows: rows, default_value: cart.note, rp_field: 'note', form_id: form_id %}` with `form_id` assigned as `cart_lines | append: '-form'`; `form_id` prints the native `form` attribute (D-020) and `rp_field` prints `data-rp-field`; neither is passed through `attributes`. Field content is `{{ cart.note }}` (escaped by Textarea). The root prints `{{ attributes }}` last (D-035). `cart_lines` is required; when it is blank the binding prints the field without a `form` attribute and `ripple check` reports the rule below. No schema settings. Locale keys: `ripple.cart-note.label` = `Order note`; `ripple.cart-note.save` = `Save note`; `ripple.cart-note.saved` = `Note saved`.

```tsx
<CartNote id="note" cart={cart} />
```

```liquid
{% block 'cart-note', id: 'note', cart_lines: 'cart' %}{% endblock %}
```

### Commerce

- Store fields read: `state.errors`, `isBusy(state)`.
- Adapter methods called: `submitCart`, `usable`.
- Regions refreshed: none declared (the CartLines and CartSummary roots declare theirs; no visible change is expected).
- Pending and error behaviour: root flags; one cart-scope error part.

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Form | own `<form method="post" action="/api/cart">` | none; the field carries `form="<cart_lines>-form"` |
| Field | `name="note"` | `name="note"` |
| Submit | `name="intent" value="note-update"` | the cart form's `name="update"` or `name="checkout"` button |

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP104 (`id`, `cart`), RP301, RP305. Manifest `rules[]`: `cart-note-field` (`requires-descendant`, selector `:scope`, target `textarea[name="note"][data-rp-field="note"]`); `cart-note-error` (`requires-descendant`, selector `:scope`, target `[data-rp-part="error"]`); `cart-note-submit-path` (`requires-descendant`, selector `:scope`, target `form [data-rp-part="submit"], textarea[form]`; "A CartNote has no way to save: on Liquid pass cart_lines; on other hosts keep the Save button."); `cart-note-label` (`requires-descendant`, selector `:scope`, target `label[for]`).

### Acceptance tests

1. Tier 2: `default`, `with-note`, `children`, `rows`, `class` (hydrogen hosts) and the `liquid-*` variants (shim) are canonical-equal with the mask above.
2. Tier 5: [05-commerce.md](05-commerce.md) test C-08 (note `change` sends one call carrying the note); the status part then contains `Note saved`.
3. Tier 5 (Liquid shim): the textarea's `form` property is the element `#cart-form`, and a change of the note leads to exactly one `updateCart` call carrying `note`.
4. Tier 6: hydrogen dev server, scripting disabled: typing a note and pressing `Save note` re-renders the page with the note in the textarea.

### Evidence and UNVERIFIED

- Evidence: [05-commerce.md](05-commerce.md) sections 6.2 (note markup), 7.1 (`change` row), 9.1.
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
