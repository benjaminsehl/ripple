# DiscountCode

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `discount-code` |
| Kind | `commerce` |
| Category | `cart` |
| Custom elements | `rp-cart` |
| Root element and class | `rp-cart` `.rp-discount-code` |
| Liquid tier | `resource` |
| No-JS level | `degraded` (manifest `noJs.level`, D-005). On the liquid backend the form is hidden without JavaScript and codes are entered at checkout (D-092); on the hydrogen backend the form posts natively. |
| Requires `id` | yes (printed on the input) |
| Depends on | `label`, `input`, `button`, `form-message` |
| Milestone | M3 |

### Purpose

A form to apply one discount code to the cart. Applied codes are listed, with their remove buttons, by CartSummary.

- Use when: the cart page or drawer should accept a discount code before checkout.
- Do not use when: there is no CartSummary on the page (the buyer would not see the applied code), or for gift cards (not supported in V1).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `DiscountCode` | `blocks/discount-code.liquid` + `snippets/rp-discount-code.liquid` | `rp-cart` | `rp-discount-code` | `data-slot="rp-cart"` | yes | none |
| form | printed by root | same | `form` | `rp-discount-code-form` | liquid: `data-rp-js="inflow"` | yes | none |
| label | printed by root | same | `label` | `rp-label` | none | yes | none |
| row | printed by root | same | `div` | `rp-discount-code-row` | none | yes | none |
| field | printed by root | same | `input` | `rp-input` | `data-rp-field="discount-code"` | yes | `<id>` |
| apply | printed by root | same | `button` | `rp-button` | `data-rp-part="submit"` | yes | none |
| error | printed by root | same | `p` | `rp-form-message` | `data-rp-part="error"` | yes | none |
| status | printed by root | same | `p` | `rp-visually-hidden` | `data-rp-part="status"`, `role="status"` | yes | none |

Nesting rules: root children in order: the form, status. Form children in order: label, row, error. Row children in order: field, apply. The error part MUST be inside the form (that position gives it the discount scope, [05-commerce.md](05-commerce.md) section 9.2). The root MUST NOT carry `data-rp-refresh`. On Liquid the root MUST NOT be inside the cart form of CartLines (nested forms are invalid).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on the field; `for` on the label |
| `placeholder` | `placeholder` | string | any text | none | no | no | `placeholder` on the field |

The component takes no `cart` prop: it prints nothing that depends on the cart.

### Content model

`text` - the label text. Default `Discount code`.

### HTML contract

Fixture `default` (`id`: `discount`; hosts `html`, `react`, `remix`):

```html
<rp-cart class="rp-discount-code" data-slot="rp-cart">
  <form class="rp-discount-code-form" method="post" action="/api/cart">
    <label class="rp-label" for="discount">Discount code</label>
    <div class="rp-discount-code-row">
      <input class="rp-input" id="discount" type="text" name="discountCode" autocomplete="off" required data-size="md" data-rp-field="discount-code" autocapitalize="characters" spellcheck="false">
      <button class="rp-button" type="submit" name="intent" value="discount-apply" data-variant="outline" data-size="md" data-rp-part="submit">Apply</button>
    </div>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  </form>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

Fixture `liquid-default` (`id`: `discount`; host `liquid`): identical to `default` except the opening tag of the form, which is:

```html
  <form class="rp-discount-code-form" method="post" action="/cart" data-rp-js="inflow">
```

`data-rp-js` is a Ripple-owned attribute and MUST NOT be masked (D-074); that is why the fixture is backend-scoped (FX-2).

Further required fixtures, each in the two backend variants (`<name>` and `liquid-<name>`): `placeholder` (`placeholder`: `SAVE10`); `children` (children `Promo code`); `class` (root class `rp-discount-code custom-a custom-b`); `escaping` (`placeholder`: `Say "hi" & <go>`).

Host-owned regions and masks: `{ "select": "form.rp-discount-code-form", "op": "attr", "name": "action" }`. No other mask.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-pending` | root | `rp-cart` | the cart store is busy | absent |
| `aria-busy` | root | `rp-cart` | the cart store is busy (`"true"`) | absent |
| `hidden` | error | `rp-cart` | no discount-scope error | present |
| `data-rp-js` | form | server | liquid backend only | `inflow` |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-cart", "attrs": ["data-pending", "aria-busy"], "reason": "The store may already hold a pending mutation when the element upgrades." }`, `{ "select": "[data-rp-part=\"error\"]", "attrs": ["hidden"], "text": true, "reason": "The error part shows the result of a mutation that completed during upgrade." }`, `{ "select": "[data-rp-part=\"status\"]", "text": true, "reason": "The status part announces a mutation that completed during upgrade." }`.

### Behaviour with JavaScript

1. Submitting the form is intercepted by `rp-cart` and sent as `discount-apply` with the trimmed field value. An empty value is blocked by the native `required` validation.
2. On success: `Discount applied` is written to the status part, the regions of the page's `rp-cart` roots refresh (the code appears in CartSummary), and the field is cleared by `form.reset()`.
3. When Shopify does not accept the code, the store records a discount error and the error part shows its message (for example the API's own text), `hidden` removed. The field keeps its value and focus stays on the Apply button.
4. Only one code is sent per submit (the hydrogen intent applies one code; `hydrogen/packages/hydrogen/src/core/cart/queries.ts`).

Step 2's `form.reset()`: UNVERIFIED that `rp-cart` resets the form after `discount-apply`; [05-commerce.md](05-commerce.md) does not state it. If it does not, the field keeps the code until the next navigation; this is acceptable and the test below does not assert the reset.

### Behaviour without JavaScript

hydrogen backend: the form posts `intent=discount-apply` to `/api/cart`; 303 back; the code is listed in CartSummary. liquid backend: the form is not displayed (`data-rp-js="inflow"`, D-021); the buyer enters the code at checkout.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: labelled text field with a submit button; `checkPattern`: none.
- Accessible name: the label; required. Apply button: its text.
- Focus: stays on the Apply button or the field after submit.
- Announcements: `Discount applied` through the status part; errors through `role="alert"`.

| Key | Action |
|---|---|
| Enter in the field | applies the code |

### Styling

- File: `components/discount-code/discount-code.css` (layer `rp.components`).
- Tokens used: `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-discount-code-gap` | `calc(var(--spacing) * 2)` | space between label, row and message, and between field and button |

| Modifier selector | Sets |
|---|---|
| None | |

Required rules: root `display: block`; `.rp-discount-code-form { display: flex; flex-direction: column; gap: var(--rp-discount-code-gap) }`; `.rp-discount-code-row { display: flex; gap: var(--rp-discount-code-gap) }`; `.rp-discount-code-row > .rp-input { flex: 1 1 auto; min-inline-size: 0 }`.

### Host notes

- HTML: copy the contract.
- React: `DiscountCode(props: { id: string; placeholder?: string; strings?: { label?: string; apply?: string }; className?: string; children?: ReactNode })`. No hook, no directive. The field is the embedded Input: `<Input id={id} name="discountCode" autoComplete="off" required rpField="discount-code" placeholder={placeholder} autoCapitalize="characters" spellCheck={false} />` (`data-rp-field` through `rpField`; `autoCapitalize` and `spellCheck` are native attributes passed as rest props). Uncontrolled input. The apply button is printed by the binding itself (section 0.2). Error part with `suppressHydrationWarning`.
- Remix: `data-rmx-key="<id>"` on root.
- Liquid: a plain `<form class="rp-discount-code-form" method="post" action="{{ routes.cart_url }}" data-rp-js="inflow">` (not `{% form %}`); `data-rp-js="inflow"` is on the `<form>` itself and the submitter carries `name="intent"` (D-092, ledger 4.4). The field is `{% render 'rp-input', id: id, name: 'discountCode', auto_complete: 'off', required: true, rp_field: 'discount-code', placeholder: placeholder, attributes: 'autocapitalize="characters" spellcheck="false"' %}`. The root prints `{{ attributes }}` last (D-035). No schema settings. Locale keys: `ripple.discount-code.label` = `Discount code`; `ripple.discount-code.apply` = `Apply`; `ripple.discount-code.applied` = `Discount applied`; `ripple.discount-code.removed` = `Discount removed`.

```tsx
<DiscountCode id="discount" />
```

```liquid
{% block 'discount-code', id: 'discount' %}{% endblock %}
```

### Commerce

- Store fields read: `state.errors` (discount group), `isBusy(state)`.
- Adapter methods called: `submitCart`, `usable`.
- Regions refreshed: none declared; the CartSummary root on the page declares `rp-cart-summary`, where the code list lives.
- Pending and error behaviour: root flags; one discount-scope error part.

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Form | `<form method="post" action="/api/cart">` | `<form method="post" action="{{ routes.cart_url }}" data-rp-js="inflow">` |
| Code field | `name="discountCode"` | `name="discountCode"` (read through `data-rp-field`; never posted to Shopify) |
| Apply | `name="intent" value="discount-apply"` | `name="intent" value="discount-apply"` (tells `translateLiquidForm` to read by hook) |

### Agent surface

`bridge`; component `rp-cart`. The manifest `agent.actions` of every `rp-cart` component is `["setQuantity", "remove"]` ([08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.2, D-095): `setQuantity(line: string, quantity: number): void` and `remove(line: string): void`, where `line` is the value of a `data-rp-line` attribute, and `items: (api) => api.lines()` returns `RippleSortOption[]`. This root prints no line, so both actions throw `"rp-cart: nothing to setQuantity here"` / `"rp-cart: nothing to remove here"` and `items` is empty. Applying a code has no bridge action (doc 08 rule A-5); an agent fills the field and presses Apply through the accessibility tree. Confirm: none. Secret: none.

### Checker rules

RP104 (`id`), RP301, RP305. Manifest `rules[]`: `discount-code-field` (`requires-descendant`, selector `form`, target `input[data-rp-field="discount-code"]`); `discount-code-error-in-form` (`requires-descendant`, selector `form`, target `[data-rp-part="error"]`); `discount-code-not-in-form` (`forbids-ancestor`, selector `:scope`, target `form`; "A DiscountCode is inside another form; nested forms are invalid HTML."); `discount-code-label` (`requires-descendant`, selector `:scope`, target `label[for]`).

### Acceptance tests

1. Tier 2: `default`, `placeholder`, `children`, `class`, `escaping` (hydrogen hosts) and their `liquid-*` variants (shim) are canonical-equal with the mask above.
2. Tier 5: [05-commerce.md](05-commerce.md) test C-03 (Liquid discount form sends `{ discountCodes: ["SAVE10"] }`); the status part then contains `Discount applied`. A rejected code shows its message in this error part and the CartLines cart-scope error part stays hidden.
3. Tier 5 (Liquid shim): the form has `data-rp-js="inflow"`; with scripting disabled its computed `display` is `none`.
4. Tier 6: hydrogen dev server, scripting disabled: applying `SAVE10` re-renders the page with a discount row in CartSummary.

### Evidence and UNVERIFIED

- Evidence: [05-commerce.md](05-commerce.md) sections 6.2 (discount forms), 9.2 (discount scope); D-043, D-092; `ripple/theme/snippets/cart-discount-code.liquid`.
- UNVERIFIED: the form reset after a successful apply (see above); the discount application type on Liquid (SPIKE-02, D-092).

### Fallback (SPIKE-nn)

None.

---
