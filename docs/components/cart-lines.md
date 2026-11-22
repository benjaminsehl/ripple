# CartLines

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `cart-lines` |
| Kind | `commerce` |
| Category | `cart` |
| Custom elements | `rp-cart` |
| Root element and class | `rp-cart` `.rp-cart-lines` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes |
| Depends on | `cart-line`, `button`, `form-message`, `visually-hidden` |
| Milestone | M3 |

### Purpose

The editable list of cart lines, with the cart-level error message and the status region for announcements. It owns the region `rp-cart-lines` and, on the liquid backend, the one cart form.

- Use when: showing the cart on the cart page or inside CartDrawer.
- Do not use when: showing a read-only order summary (print CartLine markup without the actions part in project code).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CartLines` | `blocks/cart-lines.liquid` + `snippets/rp-cart-lines.liquid` | `rp-cart` | `rp-cart-lines` | `data-slot="rp-cart"`, `data-rp-refresh` | yes | `<id>` |
| form (liquid backend only) | printed by root | same | `form` | `rp-cart-lines-form` | none | yes on Liquid | `<id>-form` |
| list (region part) | `CartLinesList` | `snippets/rp-cart-lines-list.liquid` | `div` | `rp-cart-lines-list` | `data-rp-region="rp-cart-lines"` | yes | none |
| items | printed by list | same | `ul` | `rp-cart-lines-items` | none | when the cart has lines | none |
| empty | printed by list | same | `p` | `rp-cart-lines-empty` | none | when the cart has no lines | none |
| update (liquid backend only) | printed by root | same | `button` | `rp-button rp-cart-lines-update` | `data-rp-part="submit"`, `data-rp-js="fallback"` | yes on Liquid | none |
| error | printed by root | same | `p` | `rp-form-message` | `data-rp-part="error"` | yes | none |
| status | printed by root | same | `p` | `rp-visually-hidden` | `data-rp-part="status"` | yes | none |

Nesting rules, hydrogen backend: root children in order: list, error, status. Liquid backend: root children in order: form, status; form children in order: list, update, error. The list contains either items or empty, never both. Items contains only CartLine roots (`li`). Children (`{{ content }}`) replace the default rendering of the list part (RS-2). The root is outside the region it refreshes (RS-7). On Liquid the update button MUST be the first submit button of the form.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on root; `<id>-form` on the Liquid form |
| `cart` | `cart` | object | `RippleCart` or `null` / Liquid `cart` drop | Liquid: the global `cart`; TSX: `null` | no | no | the lines, or the empty text. TSX: `null` or unset (the buyer has no cart yet) prints the empty text, the same output as a cart with zero lines (D-110) |
| `refresh` | `refresh` | string | region names | `rp-cart-lines rp-cart-summary` | no | no | `data-rp-refresh` on root |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | passed to CartLine (CV-1) |
| `action` | none | url | the cart endpoint including the locale path prefix | `/api/cart` | no | no | passed to every CartLine (the `action` of each line form); TSX hosts only (CV-17, D-118) |

The region part takes `cart`, `locale` and `action` only (Liquid: the snippet `rp-cart-lines-list` takes exactly `cart`; D-091 item 4).

### Content model

`parts` - children replace the default rendering of the list part (RS-2): pass `CartLinesList`, a Remix `<Frame>`, or on Liquid the partial-wrapped snippet.

### HTML contract

Fixture `default` (`id`: `cart`, `cart`: `cart.two-lines`; hosts `html`, `react`, `remix`):

```html
<rp-cart class="rp-cart-lines" data-slot="rp-cart" id="cart" data-rp-refresh="rp-cart-lines rp-cart-summary">
  <div class="rp-cart-lines-list" data-rp-region="rp-cart-lines">
    <ul class="rp-cart-lines-items">
      <!-- CartLine fixture `default` (line.basic) -->
      <!-- CartLine fixture `sale` (second line of cart.two-lines) -->
    </ul>
  </div>
  <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

The two comments stand for the complete reference HTML of the named CartLine fixtures; the fixture file contains that HTML, not the comments.

Fixture `liquid-default` (same props; host `liquid`):

```html
<rp-cart class="rp-cart-lines" data-slot="rp-cart" id="cart" data-rp-refresh="rp-cart-lines rp-cart-summary">
  <form class="rp-cart-lines-form" id="cart-form" method="post" action="/cart">
    <div class="rp-cart-lines-list" data-rp-region="rp-cart-lines">
      <ul class="rp-cart-lines-items">
        <!-- CartLine fixture `liquid-default` (line.basic) -->
        <!-- CartLine fixture `liquid-sale` -->
      </ul>
    </div>
    <button class="rp-button rp-cart-lines-update" type="submit" name="update" data-variant="outline" data-size="sm" data-rp-part="submit" data-rp-js="fallback">Update cart</button>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  </form>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

Fixture `empty` (`id`: `cart`, `cart`: `cart.empty`; hosts `html`, `react`, `remix`):

```html
<rp-cart class="rp-cart-lines" data-slot="rp-cart" id="cart" data-rp-refresh="rp-cart-lines rp-cart-summary">
  <div class="rp-cart-lines-list" data-rp-region="rp-cart-lines">
    <p class="rp-cart-lines-empty">Your cart is empty.</p>
  </div>
  <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

Fixture `liquid-empty` (same props; host `liquid`): the `liquid-default` fixture with the `<ul>` replaced by `<p class="rp-cart-lines-empty">Your cart is empty.</p>`. The form and the update button are still printed (the note and checkout controls of other components reference the form by id).

Further required fixtures (both variants): `class` (root class `rp-cart-lines custom-a custom-b`); `refresh` (`refresh`: `rp-cart-lines`; `data-rp-refresh="rp-cart-lines"`); `children` (children `<div data-rp-region="rp-cart-lines"></div>`; that element is printed in place of the list part).

Host-owned regions and masks: the line actions are host-owned through CartLine. Masks: those of CartLine, plus `{ "select": "form.rp-cart-lines-form", "op": "attr", "name": "action" }` in the `liquid-*` fixtures.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-rp-refresh` | root | server | always | `rp-cart-lines rp-cart-summary` |
| `data-pending` | root | `rp-cart` | the cart store is busy | absent |
| `aria-busy` | root | `rp-cart` | the cart store is busy (`"true"`) | absent |
| `aria-busy` | list | commerce adapter | region `rp-cart-lines` is refreshing (`"true"`) | absent |
| `hidden` | error | `rp-cart` | no cart-scope error to show | present |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-cart", "attrs": ["data-pending", "aria-busy"], "reason": "The store may already hold a pending mutation when the element upgrades." }`, `{ "select": "[data-rp-region]", "attrs": ["aria-busy"], "childList": true, "text": true, "subtree": true, "reason": "A refresh that completes during upgrade replaces the region content." }`, `{ "select": "[data-rp-line]", "attrs": ["data-pending", "aria-busy"], "reason": "A line can have a pending mutation when the element upgrades." }`, `{ "select": "[data-rp-part=\"error\"]", "attrs": ["hidden"], "text": true, "reason": "The error part shows the result of a mutation that completed during upgrade." }`, `{ "select": "[data-rp-part=\"status\"]", "text": true, "reason": "The status part announces a mutation that completed during upgrade." }`. This is the commerce allow-list of [05-commerce.md](05-commerce.md) section 7 restricted to the parts this component prints. The element also sets the `value` PROPERTY of a quantity input from the store; a property write is not a DOM mutation and needs no entry.

### Behaviour with JavaScript

1. A change of a line's quantity input (typing then blur, Enter, or the `valuechange` event of `rp-quantity`) is debounced 250 ms per line and sent as `setLineQuantity(<line id>, <quantity>)`. Quantity 0 removes the line.
2. hydrogen backend: the line's remove button submits `intent=remove`; `rp-cart` intercepts the submit and calls `submitCart`. liquid backend: a plain primary click on the remove link is prevented and sent as `setLineQuantity(<key>, 0)`.
3. While a line is pending the line root carries `data-pending` and `aria-busy="true"`; the root carries both while the store is busy. Controls are NOT disabled (D-045 item 3).
4. When the store settles the adapter refreshes the regions named in `data-rp-refresh`; the list part is replaced by the server's rendering. Quantity inputs are reset to their `defaultValue`, except a focused one.
5. Success is announced by writing `Cart updated` or `Item removed` to the status part. A cart-scope error is shown in the error part (`hidden` removed, text set); a line error in that line's error part.
6. React: the list renders from the store (`useCart`); the refresh is a no-op and lines appear, change and disappear by re-render. Optimistic lines (id starting with `optimistic:`) render with their controls `disabled` (React only).

### Behaviour without JavaScript

hydrogen backend: each line has its own form; the Update button of a line posts `intent=set`, the remove button posts `intent=remove`; the server answers 303 back to the page. liquid backend: the buyer edits quantities and presses `Update cart` (`name="update"`), which posts the cart form to `/cart`; the remove link navigates to `item.url_to_remove`. All line functions work.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

`rp-cart` dispatches no events ([05-commerce.md](05-commerce.md) section 7.1); `rp:refresh` and `rp:refreshed` are dispatched on `document` by the adapter.

### Accessibility

- Pattern: list of forms; `checkPattern`: none.
- Accessible name: none on root. Each control is named by CartLine.
- Focus: stays on the control that was used. After a refresh that removed the focused element, the adapter restores focus ([05-commerce.md](05-commerce.md) section 8.2 step 9).
- Announcements: status part (`role="status"`): `Cart updated`, `Item removed`, and `Added to cart` when ProductForm adds while this root is in the open drawer. Errors: error parts with `role="alert"`.

| Key | Action |
|---|---|
| Enter in a quantity input | hydrogen backend: submits `intent=set` for that line (hidden first button); liquid backend: submits `update`. An empty or non-numeric value sends nothing (hydrogen: the input is `required`, and `rp-cart` ignores the submit; `05-commerce.md` 7.1, D-116) |

### Styling

- File: `components/cart-lines/cart-lines.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-border`, `--color-muted-foreground`, `--rp-duration-base`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-cart-lines-gap` | `calc(var(--spacing) * 4)` | space between lines |
| `--rp-cart-lines-divider` | `1px solid var(--color-border)` | border between lines |
| `--rp-cart-lines-busy-opacity` | `0.6` | opacity of the list while it refreshes |

| Modifier selector | Sets |
|---|---|
| `.rp-cart-lines-list[aria-busy="true"]` | `--rp-cart-lines-opacity: var(--rp-cart-lines-busy-opacity)` |

Required rules: root `display: block`; `.rp-cart-lines-items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--rp-cart-lines-gap) }`; `.rp-cart-lines-list { opacity: var(--rp-cart-lines-opacity, 1); transition: opacity var(--rp-duration-base) }`; `.rp-cart-lines-update { margin-block-start: calc(var(--spacing) * 4) }`.

### Host notes

- HTML: copy the `default` contract; per-line forms post to the cart endpoint (`/api/cart`, or `/<locale prefix>/api/cart` on a prefixed page; CV-17).
- React: file `cart-lines.tsx`, first line `"use client";`. Exports `CartLines(props: { id: string; cart?: RippleCart | null; refresh?: string; locale?: string; className?: string; children?: ReactNode })`, `CartLinesList(props: { cart?: RippleCart | null; locale?: string })` (`null` or unset is the empty cart, D-110), The pure helpers `toRippleCart(cart: CartData): RippleCart` and `toRippleLine(line: CartData["lines"]["nodes"][number]): RippleLine` (`import type { CartData } from "@shopify/hydrogen"`; complete source below) are NOT in this file: a `"use client"` file exports components only (D-094). They live in `cart-lines.data.ts` (file key `data`, no directive; CV-10), imported here as `./cart-lines.data` and by blueprints as `@components/cart-lines.data`. `CartLinesList` reads the live cart with `useCart` ([06-bindings.md](06-bindings.md) rule R-12; the exact selector signature is owned by doc 06), using the `cart` prop as the server value, and maps it with `toRippleCart`. Each `<li>` uses `key={line.id}`. Error and status parts carry `suppressHydrationWarning`.
- Remix: `data-rmx-key="<id>"` on root; default body renders `CartLinesList` inline (RS-5).
- Liquid: root, form, update button, error and status are in `snippets/rp-cart-lines.liquid`; the list in `snippets/rp-cart-lines-list.liquid`, which loops `cart.items` and renders `rp-cart-line` with `line: item`. The update button composes Button by contract (D-070; class pair `rp-button rp-cart-lines-update`): the snippet prints the `<button>` itself with `data-rp-part="submit" data-rp-js="fallback"`; it is the FIRST submit button of the cart form (D-092). The cart form is a plain `<form class="rp-cart-lines-form" id="{{ id }}-form" method="post" action="{{ routes.cart_url }}">` (not `{% form %}`); it is the ONE Liquid cart form (D-092). The block's `{{ attributes }}` go on the `rp-cart` root, printed last (D-035). The region-part snippet is always called as `{% render 'rp-cart-lines-list', cart: cart %}` (D-091 item 4). No schema settings. Locale keys: `ripple.cart-lines.empty` = `Your cart is empty.`; `ripple.cart-lines.update` = `Update cart`; `ripple.cart-lines.updated`, `ripple.cart-lines.removed`, `ripple.cart-lines.error` as in [05-commerce.md](05-commerce.md) section 4.3.

`toRippleLine` mapping (fields of `HydrogenCartFragment`, `hydrogen/packages/hydrogen/src/core/cart/queries.ts`):

| `RippleLine` field | Source |
|---|---|
| `id` | `line.id` |
| `quantity` | `line.quantity` |
| `title` | `line.merchandise.product.title` |
| `variantTitle` | `line.merchandise.title`, or `""` when it equals `Default Title` |
| `url` | `/products/<handle>?variant=<numeric variant id>`, built with `buildProductSelectionSearchParams({ style: "variant", ... })` exactly as in the source below (the function takes ONE object and iterates `optionNames`; `hydrogen/packages/hydrogen/src/core/product/url.ts`). `handleShopifyRoutes` redirects `?variant=<numeric id>` to the option params. The project MAY replace the path template |
| `image` | `line.merchandise.image` or `null` |
| `totalPrice` | `line.cost.totalAmount` |
| `compareAtTotalPrice` | `line.cost.subtotalAmount` when its amount is greater than `totalAmount`, else `null` (D-049) |
| `attributes` | `line.attributes` |

Complete source of `components/cart-lines/react/cart-lines.data.ts` (no directive; the only value import from `@shopify/hydrogen` is the pure function `buildProductSelectionSearchParams`, allowed by D-094 and CV-9):

```ts
import { buildProductSelectionSearchParams } from "@shopify/hydrogen";
import type { CartData } from "@shopify/hydrogen";
import type { RippleCart, RippleLine } from "__PKG__";

type HydrogenLine = CartData["lines"]["nodes"][number];

export function toRippleLine(line: HydrogenLine): RippleLine {
  const merchandise = line.merchandise;
  const selectedOptions = merchandise?.selectedOptions ?? [];
  const query = merchandise
    ? buildProductSelectionSearchParams({
        style: "variant",
        variant: { id: merchandise.id },
        selectedOptions,
        optionNames: selectedOptions.map((option) => option.name),
      }).toString()
    : "";
  const handle = merchandise?.product.handle ?? "";
  const image = merchandise?.image;
  const total = line.cost.totalAmount;
  const subtotal = line.cost.subtotalAmount;
  return {
    id: line.id,
    quantity: line.quantity,
    title: merchandise?.product.title ?? "",
    variantTitle: !merchandise?.title || merchandise.title === "Default Title" ? "" : merchandise.title,
    url: `/products/${handle}${query ? `?${query}` : ""}`,
    image: image ? { url: image.url, altText: image.altText ?? null, width: image.width ?? 0, height: image.height ?? 0 } : null,
    totalPrice: total,
    compareAtTotalPrice: Number(subtotal.amount) > Number(total.amount) ? subtotal : null,
    attributes: line.attributes ?? [],
  };
}

export function toRippleCart(cart: CartData): RippleCart {
  return {
    id: cart.id,
    totalQuantity: cart.totalQuantity,
    checkoutUrl: cart.checkoutUrl ?? "",
    note: cart.note ?? "",
    subtotal: cart.cost.subtotalAmount,
    total: cart.cost.totalAmount,
    discountCodes: cart.discountCodes.map((discount) => ({ code: discount.code, applicable: discount.applicable })),
    lines: cart.lines.nodes.map(toRippleLine),
  };
}
```

```tsx
<CartLines id="cart" cart={cart} />
```

```liquid
{% block 'cart-lines', id: 'cart' %}
  {% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-list', cart: cart %}{% endpartial %}
{% endblock %}
```

### Commerce

- Store fields read: `state.data.lines`, `state.pending.lines`, `state.errors`, `isBusy(state)`.
- Adapter methods called: `submitCart`, `setLineQuantity`, `usable`, `ready`; the adapter calls `refresh(["rp-cart-lines", "rp-cart-summary"], { reason: "cart" })`.
- Regions refreshed: the names in `data-rp-refresh` (default `rp-cart-lines rp-cart-summary`).
- Pending and error behaviour: see "State and attributes"; one cart-scope error part here, one line-scope error part per CartLine.

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Forms | one `<form method="post" action="/api/cart">` per line (inside CartLine) | ONE `<form method="post" action="{{ routes.cart_url }}" id="<id>-form">` around the region |
| Line identity | `data-rp-line="<CartLine gid>"`, hidden `lineId` | `data-rp-line="{{ item.key }}"` |
| Set quantity | `quantity` + `intent=set` | `updates[]` in `cart.items` order + `name="update"` |
| Remove | `intent=remove` | `<a href="{{ item.url_to_remove }}" data-rp-part="remove">` |

### Agent surface

`bridge`; component `rp-cart`. The manifest `agent.actions` of every `rp-cart` component is `["setQuantity", "remove"]` ([08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.2, D-095): `setQuantity(line: string, quantity: number): void` and `remove(line: string): void`, where `line` is the value of a `data-rp-line` attribute, and `items: (api) => api.lines()` returns `RippleSortOption[]`. Each label is the line title. There is no `checkout` action and no discount, note or locale action (D-050; doc 08 rule A-5). Confirm: none. Secret: none.

### Checker rules

RP104 (`id`, `cart`), RP114 (`<id>-form`), RP301, RP305 (dialect of every form), RP308 (the `rp-cart` root MUST be outside the region it refreshes: an error, D-102), RP403 (Liquid: partials `rp-cart-lines` and `rp-cart-summary` declared), and the two form-order checks of [05-commerce.md](05-commerce.md) section 13. Manifest `rules[]`: `cart-lines-region` (`requires-descendant`, selector `:scope`, target `[data-rp-region="rp-cart-lines"]`); `cart-lines-error` (`requires-descendant`, selector `:scope`, target `[data-rp-part="error"]`); `cart-lines-status` (`requires-descendant`, selector `:scope`, target `[data-rp-part="status"][role="status"]`); `cart-lines-items-only-lines` (`forbids-descendant`, selector `.rp-cart-lines-items`, target `:scope > :not(li.rp-cart-line)`).

### Acceptance tests

1. Tier 2: `default`, `empty`, `class`, `refresh`, `children` (hydrogen hosts) and `liquid-default`, `liquid-empty` and the Liquid variants (shim) are canonical-equal with the masks above.
2. Tier 3: upgrade produces no mutation outside the allow-list.
3. Tier 5: [05-commerce.md](05-commerce.md) tests C-03 (Liquid quantity, remove link, Enter), C-04 (line error part), C-06 (failed partial fetch reloads), C-10 (hydrogen quantity and remove; focus after refresh).
4. Tier 5 (React): setting a quantity to 0 removes the `<li>` without a network refresh of the document; no hydration warning is logged ([05-commerce.md](05-commerce.md) test C-23).
5. Tier 6: hydrogen dev server: with scripting disabled, changing the quantity and pressing Update yields a 303 and the new quantity in the re-rendered page. Liquid shim: the form posts `updates[]` in line order and `update`.
6. Tier 5: on Liquid the first submit button of `#cart-form` is `name="update"`, and the number of `[name="updates[]"]` controls equals the number of `[data-rp-line]` elements.

### Evidence and UNVERIFIED

- Evidence: [05-commerce.md](05-commerce.md) sections 6.2, 7.1, 8.4, 9; `hydrogen/packages/hydrogen/src/core/cart/queries.ts`; `ripple/docs/research/base-theme.md` (cart form with `updates[]`).
- UNVERIFIED: `selectedOptions` is part of the cart line merchandise selection of `HydrogenCartFragment` (if it is absent, `url` is `/products/<handle>` without a query).

### Fallback (SPIKE-nn)

None. (SPIKE-01 of [05-commerce.md](05-commerce.md) covers `item.key` as line id; its fallback changes the adapter, not this markup.)

---
