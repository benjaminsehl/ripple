# CartSummary

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `cart-summary` |
| Kind | `commerce` |
| Category | `cart` |
| Custom elements | `rp-cart` |
| Root element and class | `rp-cart` `.rp-cart-summary` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `checkout-button`, `icon-button`, `icon` |
| Milestone | M3 |

### Purpose

The cart totals: subtotal, applied discount codes (each removable), total, the tax and shipping note, and the checkout button. It owns the region `rp-cart-summary`.

- Use when: next to a CartLines, on the cart page or inside CartDrawer.
- Do not use when: you only need a checkout button (use CheckoutButton), or an order summary after purchase (not a cart).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CartSummary` | `blocks/cart-summary.liquid` + `snippets/rp-cart-summary.liquid` | `rp-cart` | `rp-cart-summary` | `data-slot="rp-cart"`, `data-rp-refresh="rp-cart-summary"` | yes | none |
| totals (region part) | `CartSummaryTotals` | `snippets/rp-cart-summary-totals.liquid` | `div` | `rp-cart-summary-totals` | `data-rp-region="rp-cart-summary"` | yes | none |
| rows | printed by totals | same | `dl` | `rp-cart-summary-rows` | none | when the cart has lines | none |
| row | printed by totals | same | `div` | `rp-cart-summary-row` | `data-row="subtotal \| discount \| total"` | when the cart has lines | none |
| code | printed by totals | same | `span` | `rp-cart-summary-code` | none | one per discount row | none |
| remove form | printed by totals | same | `form` | `rp-cart-summary-remove` | liquid: `data-rp-js="inflow"` | one per discount row | none |
| note | printed by totals | same | `p` | `rp-cart-summary-note` | none | when the cart has lines | none |
| checkout | printed by totals | same | CheckoutButton | `rp-button rp-checkout-button` | see CheckoutButton | when the cart has lines | none |
| accelerated | printed by root | same | `div` | `rp-cart-summary-accelerated` | `data-agent-confirm` | when `acceleratedCheckout` is true and the cart has lines | none |
| status | printed by root | same | `p` | `rp-visually-hidden` | `data-rp-part="status"`, `role="status"` | yes | none |

Nesting rules: root children in order: totals, accelerated, status. Totals children in order: rows, note, checkout. Rows children in order: one `subtotal` row, one `discount` row per applied code, one `total` row. When the cart has no lines (`totalQuantity` is 0) the totals part is printed with NO children and the accelerated part is not printed. The checkout button is INSIDE the region so that a changed checkout URL (first add creates the cart) and the empty state are re-rendered (D-050 item b). For an empty cart CartSummary prints no CheckoutButton at all, so the inert form of D-050 item d (CheckoutButton prop `disabled`) is used only where a caller prints a CheckoutButton directly. The accelerated part is outside the region (its content is injected by Shopify scripts and MUST NOT be replaced; D-050 item b). The root MUST NOT contain an error part ([05-commerce.md](05-commerce.md) section 9.2). Children (`{{ content }}`) replace the default rendering of the totals part (RS-2).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `cart` | `cart` | object | `RippleCart` / Liquid `cart` drop | Liquid: the global `cart` | yes (TSX) | no | rows, checkout URL |
| `cartLines` | `cart_lines` | string | the `id` of the CartLines on the page | none | no | no | passed to CheckoutButton (Liquid: `form="<value>-form"`); ignored on hydrogen hosts |
| `acceleratedCheckout` | `accelerated_checkout` | boolean | `true false` | `false` | no | no | the accelerated part (D-050) |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | money text (CV-1) |
| `action` | none | url | the cart endpoint including the locale path prefix | `/api/cart` | no | no | `action` on each remove-code form (hydrogen hosts); TSX hosts only (CV-17, D-118) |

The region part takes `cart`, `cartLines`, `locale` and `action` (Liquid: the snippet `rp-cart-summary-totals` takes exactly `cart` and `cart_lines`; EVERY call passes both, D-091 item 4).

### Content model

`parts` - children replace the default rendering of the totals part (RS-2).

### HTML contract

Fixture `default` (`cart`: `cart.discounted`; hosts `html`, `react`, `remix`):

```html
<rp-cart class="rp-cart-summary" data-slot="rp-cart" data-rp-refresh="rp-cart-summary">
  <div class="rp-cart-summary-totals" data-rp-region="rp-cart-summary">
    <dl class="rp-cart-summary-rows">
      <div class="rp-cart-summary-row" data-row="subtotal"><dt>Subtotal</dt><dd><bdi>$108.00</bdi></dd></div>
      <div class="rp-cart-summary-row" data-row="discount">
        <dt>Discount <span class="rp-cart-summary-code">SAVE10</span></dt>
        <dd>
          <form class="rp-cart-summary-remove" method="post" action="/api/cart">
            <input type="hidden" name="discountCode" value="SAVE10" data-rp-field="discount-code">
            <button class="rp-icon-button" type="submit" name="intent" value="discount-remove" data-variant="ghost" data-size="sm" aria-label="Remove discount SAVE10"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
          </form>
        </dd>
      </div>
      <div class="rp-cart-summary-row" data-row="total"><dt>Total</dt><dd><bdi>$97.20</bdi></dd></div>
    </dl>
    <p class="rp-cart-summary-note">Taxes and shipping calculated at checkout.</p>
    <a class="rp-button rp-checkout-button" href="/checkout" data-variant="primary" data-size="lg" data-full-width="" data-agent-confirm="Goes to checkout with this cart">Check out</a>
  </div>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

Fixture `liquid-default` (`cart`: `cart.discounted`, `cart_lines`: `cart`; host `liquid`): identical except (a) the remove form is `<form class="rp-cart-summary-remove" method="post" action="/cart" data-rp-js="inflow">` with the same children, and (b) the checkout part is:

```html
    <button class="rp-button rp-checkout-button" type="submit" name="checkout" form="cart-form" data-variant="primary" data-size="lg" data-full-width="" data-agent-confirm="Goes to checkout with this cart">Check out</button>
```

Fixture `empty` (`cart`: `cart.empty`; all four hosts, one file):

```html
<rp-cart class="rp-cart-summary" data-slot="rp-cart" data-rp-refresh="rp-cart-summary">
  <div class="rp-cart-summary-totals" data-rp-region="rp-cart-summary"></div>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

Fixture `accelerated` / `liquid-accelerated` (`cart`: `cart.two-lines`, `acceleratedCheckout`: true): the `two-lines` HTML with `<div class="rp-cart-summary-accelerated" data-agent-confirm="Pays for this cart now with an express checkout"></div>` between the totals part and the status part; its children are host-owned.

Fixture `line-discount` / `liquid-line-discount` (`cart`: `cart.line-discounted`, a cart whose code `SHIRT5` applies to one product only; D-120): the `default` / `liquid-default` HTML with the code text `SHIRT5`, `value="SHIRT5"`, `aria-label="Remove discount SHIRT5"` and the (masked) amounts subtotal `$103.00`, total `$103.00`. On Liquid the resource has an EMPTY `cart_level_discount_applications` and the code only in the first item's `line_level_discount_allocations`; the fixture fails when the snippet reads the cart-level list alone.

Further required fixtures: `two-lines` / `liquid-two-lines` (`cart`: `cart.two-lines`: no discount row; subtotal `$108.00`; total `$108.00`); `class` (root class `rp-cart-summary custom-a custom-b`); `children` (children `<div data-rp-region="rp-cart-summary"></div>` printed in place of the totals part).

Host-owned regions and masks: the accelerated part's children (`{ "select": ".rp-cart-summary-accelerated", "op": "children" }`). Masks: `{ "select": ".rp-cart-summary-row dd bdi", "op": "text" }`, `{ "select": ".rp-cart-summary-remove", "op": "attr", "name": "action" }`, `{ "select": "a.rp-checkout-button", "op": "attr", "name": "href" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-rp-refresh` | root | server | always | `rp-cart-summary` |
| `data-pending` | root | `rp-cart` | the cart store is busy | absent |
| `aria-busy` | root | `rp-cart` | the cart store is busy (`"true"`) | absent |
| `aria-busy` | totals | commerce adapter | region `rp-cart-summary` is refreshing (`"true"`) | absent |
| `data-row` | row | server | always | `subtotal`, `discount` or `total` |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-cart", "attrs": ["data-pending", "aria-busy"], "reason": "The store may already hold a pending mutation when the element upgrades." }`, `{ "select": "[data-rp-region]", "attrs": ["aria-busy"], "childList": true, "text": true, "subtree": true, "reason": "A refresh that completes during upgrade replaces the region content." }`, `{ "select": ".rp-cart-summary-accelerated", "attrs": ["style", "class"], "childList": true, "text": true, "subtree": true, "reason": "Platform wallet scripts build the express checkout buttons on the client." }`, `{ "select": "[data-rp-part=\"status\"]", "text": true, "reason": "The status part announces a mutation that completed during upgrade." }`.

### Behaviour with JavaScript

1. After every cart mutation the adapter refreshes region `rp-cart-summary`; the totals part is replaced by the server's rendering (React: re-rendered from the store).
2. The remove form of a discount row is intercepted by `rp-cart` and sent as `discount-remove`; on success `Discount removed` is written to the status part of this root. liquid backend with commerce not usable (`getCommerce().usable === false`): `rp-cart` calls `preventDefault()` on the remove form's submit, and does NOT post ([05-commerce.md](05-commerce.md) 7.1, D-129); CartSummary has no error part (rule `cart-summary-no-error`), so no message is written and the row stays.
3. The checkout control is never intercepted: hydrogen backend it is a link; liquid backend its submitter name is `checkout`.
4. The accelerated part is filled by Shopify's scripts; Ripple does not touch it.

### Behaviour without JavaScript

Totals are the server-rendered values. hydrogen backend: the remove form posts `intent=discount-remove` and the page re-renders; the checkout link navigates to `checkoutUrl`. liquid backend: the remove form is hidden (`data-rp-js="inflow"`; there is no no-JS discount removal on Liquid, D-043), the code text stays visible; the checkout button submits the cart form with `name="checkout"`, which also saves edited quantities and the note.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: description list; `checkPattern`: none.
- Accessible name: none on root. Remove button: `aria-label="Remove discount <code>"`; required.
- Focus: after the focused remove button disappears with the refresh, the adapter focuses the first focusable element of the region (the next remove button or the checkout control).
- Announcements: `Discount removed` through the status part (`role="status"`).

| Key | Action |
|---|---|
| Enter, Space on a remove button | removes that code |

### Styling

- File: `components/cart-summary/cart-summary.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-foreground`, `--color-muted-foreground`, `--text-sm`, `--text-lg`, `--font-weight-semibold`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-cart-summary-gap` | `calc(var(--spacing) * 3)` | space between rows, note and checkout |
| `--rp-cart-summary-busy-opacity` | `0.6` | opacity of the totals while refreshing |

| Modifier selector | Sets |
|---|---|
| `.rp-cart-summary-totals[aria-busy="true"]` | `--rp-cart-summary-opacity: var(--rp-cart-summary-busy-opacity)` |
| `.rp-cart-summary-row[data-row="total"]` | `--rp-cart-summary-row-size: var(--text-lg)`, `--rp-cart-summary-row-weight: var(--font-weight-semibold)` |

Required rules: root `display: block`; totals `display: flex; flex-direction: column; gap: var(--rp-cart-summary-gap); opacity: var(--rp-cart-summary-opacity, 1)`; `.rp-cart-summary-rows { margin: 0; display: flex; flex-direction: column; gap: var(--rp-cart-summary-gap) }`; row `display: flex; justify-content: space-between; align-items: center`; `.rp-cart-summary-row dd { margin: 0 }`; `.rp-cart-summary-totals:empty { display: none }`; `.rp-cart-summary-accelerated { margin-block-start: var(--rp-cart-summary-gap) }`.

### Host notes

- HTML: copy the `default` contract.
- React: file `cart-summary.tsx`, `"use client";`. `CartSummary(props: { cart: RippleCart; cartLines?: string; acceleratedCheckout?: boolean; locale?: string; className?: string; children?: ReactNode })` and `CartSummaryTotals(props: { cart: RippleCart; cartLines?: string; locale?: string })`. `CartSummaryTotals` reads the live cart with `useCart` (server value: the `cart` prop) and `toRippleCart` from `./cart-lines.data` (CV-10). Discount rows: `cart.discountCodes.filter((d) => d.applicable)`. Accelerated part: `<div className="rp-cart-summary-accelerated" data-agent-confirm={strings?.agentConfirmAccelerated ?? "Pays for this cart now with an express checkout"} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: renderShopPayButton({}) }} />` with `renderShopPayButton` imported from `@shopify/hydrogen` (`hydrogen/packages/hydrogen/skills/hydrogen-shop-pay/SKILL.md`; a value import allowed by D-094, CV-9). `CartSummary` also takes `strings?: { agentConfirmAccelerated?: string }` (CV-2).
- Remix: prop `rmxKey?: string` prints `data-rmx-key` on root (omitted when unset; CV-5, D-034). The checkout link carries `data-rmx-document` (CheckoutButton).
- Liquid: discount rows (D-120): one row per UNIQUE discount code, collected from BOTH places Shopify exposes a code: (a) `cart.cart_level_discount_applications` where `type == 'discount_code'` (code `title`) and (b) for each `item` of `cart.items`, each `allocation` of `item.line_level_discount_allocations` where `allocation.discount_application.type == 'discount_code'` (code `allocation.discount_application.title`). A code that applies to specific products appears ONLY in (b); reading (a) alone would hide it and it could not be removed. `snippets/rp-cart-summary-totals.liquid` builds the list with exactly this code (component scope of L-13: `assign`, `for`, `if`, `unless`, `append`, `split`, the `contains` operator; no `uniq`):

  ```liquid
  {%- liquid
    assign codes = '|'
    for application in cart.cart_level_discount_applications
      if application.type == 'discount_code'
        assign marker = '|' | append: application.title | append: '|'
        unless codes contains marker
          assign codes = codes | append: application.title | append: '|'
        endunless
      endif
    endfor
    for item in cart.items
      for allocation in item.line_level_discount_allocations
        if allocation.discount_application.type == 'discount_code'
          assign marker = '|' | append: allocation.discount_application.title | append: '|'
          unless codes contains marker
            assign codes = codes | append: allocation.discount_application.title | append: '|'
          endunless
        endif
      endfor
    endfor
    assign code_list = codes | split: '|'
  -%}
  {%- for code in code_list -%}
    {%- if code != blank -%}
      ... one discount row for {{ code | escape }} (markup of the fixture) ...
    {%- endif -%}
  {%- endfor -%}
  ```

  Subtotal `cart.items_subtotal_price | money`; total `cart.total_price | money`. Empty test: `cart.item_count == 0`. Accelerated part: `{% if additional_checkout_buttons %}<div class="rp-cart-summary-accelerated" data-agent-confirm="{{ 'ripple.cart-summary.agent_confirm_accelerated' | t }}">{{ content_for_additional_checkout_buttons }}</div>{% endif %}` (both objects are in the component scope of the Liquid subset, D-097). The root is not printed by `{% form %}`, so it prints `{{ attributes }}` last (D-035). The region-part snippet `rp-cart-summary-totals` takes exactly the params `cart` and `cart_lines`; EVERY call passes both (D-091 item 4), `cart_lines` being the `cart_lines` param of the block (blank when there is no CartLines on the page). No schema settings. Locale keys: `ripple.cart-summary.subtotal` = `Subtotal`; `ripple.cart-summary.discount` = `Discount`; `ripple.cart-summary.total` = `Total`; `ripple.cart-summary.note` = `Taxes and shipping calculated at checkout.`; `ripple.cart-summary.remove_discount` = `Remove discount {{ code }}`; `ripple.cart-summary.agent_confirm_accelerated` = `Pays for this cart now with an express checkout`.

```tsx
<CartSummary cart={cart} cartLines="cart" />
```

```liquid
{% block 'cart-summary', cart_lines: 'cart' %}
  {% partial 'rp-cart-summary' %}{% render 'rp-cart-summary-totals', cart: cart, cart_lines: 'cart' %}{% endpartial %}
{% endblock %}
```

### Commerce

- Store fields read: `state.data.cost`, `state.data.discountCodes`, `state.data.checkoutUrl`, `state.data.totalQuantity`, `isBusy(state)`.
- Adapter methods called: `submitCart` (discount remove), `usable`; the adapter calls `refresh(["rp-cart-summary"], { reason: "cart" })`.
- Regions refreshed: `rp-cart-summary`.
- Pending and error behaviour: root `data-pending` / `aria-busy`; no error part (a failed removal shows in the cart-scope error part of CartLines).

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Subtotal | `cart.cost.subtotalAmount` | `cart.items_subtotal_price` |
| Total | `cart.cost.totalAmount` | `cart.total_price` |
| Applied codes | `cart.discountCodes` where `applicable` | the unique titles of `cart.cart_level_discount_applications` where `type == 'discount_code'` AND of every `item.line_level_discount_allocations[].discount_application` where `type == 'discount_code'` (D-120; Host notes) |
| Remove code | `<form method="post" action="/api/cart">`, hidden `discountCode`, submit `name="intent" value="discount-remove"` | same markup, `action="{{ routes.cart_url }}"`, `data-rp-js="inflow"` on the form |
| Checkout | `<a href="<checkoutUrl>">` | `<button type="submit" name="checkout" form="<cart_lines>-form">` |

### Agent surface

`bridge`; component `rp-cart`. The manifest `agent.actions` of every `rp-cart` component is `["setQuantity", "remove"]` ([08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.2, D-095): `setQuantity(line: string, quantity: number): void` and `remove(line: string): void`, where `line` is the value of a `data-rp-line` attribute, and `items: (api) => api.lines()` returns `RippleSortOption[]`. This root prints no line, so both actions throw `"rp-cart: nothing to setQuantity here"` / `"rp-cart: nothing to remove here"` and `items` is empty. Discount removal has no bridge action (doc 08 rule A-5); an agent uses the remove button through the accessibility tree. Confirm: the CheckoutButton inside (`data-agent-confirm`, REQUIRED); in fixture `accelerated` the wrapper `.rp-cart-summary-accelerated` carries `data-agent-confirm="Pays for this cart now with an express checkout"` (doc 08 section 7.3; locale key `ripple.cart-summary.agent_confirm_accelerated`). The attribute is never on the `rp-cart` root. Secret: none.

### Checker rules

RP104 (`cart`), RP301, RP305, RP306, RP308 (the root is outside the region it refreshes: an error for `rp-cart`, D-102), RP320, RP403 (Liquid: partial `rp-cart-summary`). Manifest `rules[]`: `cart-summary-region` (`requires-descendant`, selector `:scope`, target `[data-rp-region="rp-cart-summary"]`); `cart-summary-no-error` (`forbids-descendant`, selector `:scope`, target `[data-rp-part="error"]`); `cart-summary-accelerated-outside-region` (`forbids-descendant`, selector `[data-rp-region]`, target `.rp-cart-summary-accelerated`).

### Acceptance tests

1. Tier 2: `default`, `line-discount`, `two-lines`, `accelerated`, `class`, `children` (hydrogen hosts), the `liquid-*` variants (shim) and `empty` (all hosts) are canonical-equal with the masks above.
2. Tier 5: submitting a remove form produces one store call with intent `discount-remove` and the code, one refresh of `rp-cart-summary`, and the status part text `Discount removed`.
3. Tier 5: starting from `cart.empty`, after an add and the refresh the region contains a checkout control whose `href` (hydrogen) equals the store's `checkoutUrl`.
4. Tier 5: a click on the checkout control is not prevented (`defaultPrevented` is false) in both backends.
5. Tier 6: hydrogen dev server, scripting disabled: the remove form posts and the re-rendered page has no discount row. Liquid shim: the remove form is not displayed.

### Evidence and UNVERIFIED

- Evidence: [05-commerce.md](05-commerce.md) sections 6.2, 7.1, 9.1 (code list inside `rp-cart-summary`); `hydrogen/packages/hydrogen/src/core/cart/queries.ts`; Liquid `cart.cart_level_discount_applications` and `line_item.line_level_discount_allocations` (each allocation has `discount_application.title` / `.type`; `discount_application.type` values `automatic`, `discount_code`, `manual`, `script`; Shopify Liquid reference, checked by the feasibility review, D-120); `ripple/theme/snippets/cart-discount-list.liquid`.
- UNVERIFIED: `renderShopPayButton({})` with an empty options object; the rendered result of the code list on a preview store (SPIKE-02, V-12).

### Fallback (SPIKE-nn)

None.

---
