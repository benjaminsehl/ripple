# CartLink

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `cart-link` |
| Kind | `commerce` |
| Category | `cart` |
| Custom elements | `rp-cart` |
| Root element and class | `rp-cart` `.rp-cart-link` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `icon`, `visually-hidden` |
| Milestone | M3 |

### Purpose

The link to the cart with a live item count. With JavaScript and a CartDrawer on the page it opens the drawer; otherwise it navigates to the cart page.

- Use when: the header (or any place) needs a cart entry point with a count.
- Do not use when: you need a button that submits the cart (use CheckoutButton), or a count without a link (print `<span data-rp-part="count">` inside any other `rp-cart` root).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CartLink` | `blocks/cart-link.liquid` + `snippets/rp-cart-link.liquid` | `rp-cart` | `rp-cart-link` | `data-slot="rp-cart"` | yes | none |
| trigger | printed by root | same | `a` | `rp-cart-link-trigger` | `data-rp-open="<drawer>"` when `drawer` is set | yes | none |
| label | printed by root | same | `span` | `rp-visually-hidden` | none | yes, unless children are passed | none |
| count | printed by root | same | `span` | `rp-cart-link-count` | `data-rp-part="count"` | yes | none |

Nesting rules: the trigger is the only child of root. Inside the trigger, in order: one Icon `cart`, the label, the count. Children replace the Icon and the label; the count is always printed last. The root MUST NOT carry `data-rp-refresh` and MUST NOT contain an error part ([05-commerce.md](05-commerce.md) section 9.2). The markup lives in a snippet because Header embeds it.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `href` | `href` | url | a URL | `/cart` (Liquid: `routes.cart_url`) | no | no | `href` on the trigger |
| `drawer` | `drawer` | id | the `id` of a CartDrawer on the page | none | no | no | `data-rp-open="<value>"` on the trigger. CartLink prints this opener attribute itself, from its own prop (the same first-class prop pattern as `dialog` on Link, D-009). The caller MUST omit `drawer` on the cart page, where no CartDrawer is rendered (D-091 item 5); the link then navigates to `href` |
| `count` | `count` | number | integer 0 or greater | `0` (Liquid: `cart.item_count`) | no | no | text of the count part; `hidden` on the count part when `0` |

### Content model

`flow` restricted to phrasing content - replaces the Icon and the visually hidden label. The children MUST contain text (it becomes the link's accessible name). When there are no children the label text is `Cart`.

### HTML contract

Fixture `default` (`count`: `3`, `drawer`: `cart-drawer`):

```html
<rp-cart class="rp-cart-link" data-slot="rp-cart">
  <a class="rp-cart-link-trigger" href="/cart" data-rp-open="cart-drawer">
    <svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg>
    <span class="rp-visually-hidden">Cart</span>
    <span class="rp-cart-link-count" data-rp-part="count">3</span>
  </a>
</rp-cart>
```

Fixture `empty` (no props):

```html
<rp-cart class="rp-cart-link" data-slot="rp-cart">
  <a class="rp-cart-link-trigger" href="/cart">
    <svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg>
    <span class="rp-visually-hidden">Cart</span>
    <span class="rp-cart-link-count" data-rp-part="count" hidden>0</span>
  </a>
</rp-cart>
```

Fixture `children` (`count`: `1`, children: `Bag`):

```html
<rp-cart class="rp-cart-link" data-slot="rp-cart">
  <a class="rp-cart-link-trigger" href="/cart">Bag<span class="rp-cart-link-count" data-rp-part="count">1</span></a>
</rp-cart>
```

Further required fixtures: `class` (root class `rp-cart-link custom-a custom-b`); `escaping` (`href`: `/cart?a="b"&c=<d>`; the attribute is `/cart?a=&quot;b&quot;&amp;c=&lt;d&gt;`).

Host-owned regions and masks: none. In Remix the root also carries `data-rmx-key="<rmxKey>"` when the prop `rmxKey` is set (CV-5); the canonicaliser removes it.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `hidden` | count | server, then `rp-cart` | total quantity is 0 | present when `count` is `0` |
| `data-pending` | root | `rp-cart` | the cart store is busy | absent |
| `aria-busy` | root | `rp-cart` | the cart store is busy (`"true"`) | absent |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "[data-rp-part=\"count\"]", "attrs": ["hidden"], "text": true, "reason": "The server value can be stale on a cached page; the store value replaces it." }` (the count entry fixed by D-071), `{ "select": "rp-cart", "attrs": ["data-pending", "aria-busy"], "reason": "The store may already hold a pending mutation when the element upgrades." }`.

### Behaviour with JavaScript

1. `rp-cart` writes `String(totalQuantity)` into the count part and sets `hidden` when it is `0`, after the store is ready and on every store change ([05-commerce.md](05-commerce.md) section 7.1).
2. A plain primary click on the trigger, when `drawer` names a `<dialog>` that exists and `rp-dialog` is defined, opens that dialog instead of navigating (`data-rp-open`, [04-elements.md](04-elements.md) section 9.1). When the dialog does not exist (cart page) the link navigates.
3. Modified clicks (Ctrl, Meta, Shift, middle button) always navigate.

### Behaviour without JavaScript

The link navigates to the cart page. The count shows the server-rendered value.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: native link; `checkPattern`: none.
- Accessible name: label text followed by the count text (for example `Cart 3`); required. The server MUST NOT print `aria-haspopup`, `aria-controls` or `role` on the trigger (D-009).
- Focus: one tab stop. After the drawer closes, focus returns to the trigger (`rp-dialog`).
- Announcements: None. The count is not a live region; cart changes are announced by the component that made them.

| Key | Action |
|---|---|
| Enter | opens the drawer, or follows the link |

### Styling

- File: `components/cart-link/cart-link.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-foreground`, `--color-primary`, `--color-primary-foreground`, `--color-ring`, `--radius-full`, `--text-xs`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-cart-link-size` | `calc(var(--spacing) * 11)` | minimum inline and block size of the trigger (44 px target) |
| `--rp-cart-link-count-bg` | `var(--color-primary)` | count background |
| `--rp-cart-link-count-fg` | `var(--color-primary-foreground)` | count text colour |

| Modifier selector | Sets |
|---|---|
| `.rp-cart-link[data-pending]` | nothing; reserved for project CSS |

Required rules: root `display: inline-flex`; trigger `position: relative; display: inline-flex; align-items: center; justify-content: center; min-inline-size: var(--rp-cart-link-size); min-block-size: var(--rp-cart-link-size)`; count `position: absolute; inset-block-start: 0; inset-inline-end: 0; min-inline-size: 1.25rem; border-radius: var(--radius-full); font-size: var(--text-xs); text-align: center`; `.rp-cart-link-count[hidden] { display: none }`.

### Host notes

- HTML: copy the contract; the count text is replaced by `rp-cart` at runtime.
- React: `CartLink(props: { href?: string; drawer?: string; count?: number; strings?: { label?: string }; className?: string; children?: ReactNode })`. First line `"use client";`. The count is `useCart((state) => state.data?.totalQuantity ?? 0, count ?? 0)` (`useCart` from `<pkg>/react`, [06-bindings.md](06-bindings.md) section 6.2). The count `<span>` MUST carry `suppressHydrationWarning` ([05-commerce.md](05-commerce.md) section 10.3).
- Remix: prop `rmxKey?: string` prints `data-rmx-key` on root; the attribute is omitted when the prop is unset (CV-5, D-034). The server prints `count`; no hydration.
- Liquid: `count` defaults to `cart.item_count`, `href` to `routes.cart_url`. The layout passes `drawer` only when `template.name != 'cart'` (D-091 item 5). The root prints `{{ attributes }}` last (D-035). No schema settings. Locale key: `ripple.cart-link.label` = `Cart`.

```tsx
<CartLink drawer="cart-drawer" count={cart.totalQuantity} />
```

```liquid
{% block 'cart-link', drawer: 'cart-drawer' %}{% endblock %}
```

### Commerce

- Store fields read: `state.data.totalQuantity`, `state.loading`, `isBusy(state)`.
- Adapter methods called: `ready` (through `rp-cart`).
- Regions refreshed: none; the root has no `data-rp-refresh`.
- Pending and error behaviour: `data-pending` and `aria-busy` on root while the store is busy; no error part.

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Cart page URL | `/cart` (the app's cart route) | `{{ routes.cart_url }}` |
| Count | `cart.totalQuantity` | `{{ cart.item_count }}` |

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP110, RP302 (the element with `data-rp-open` is `a` with a non-empty `href`), RP201 (the trigger has a name). Manifest `rules[]`: `cart-link-count` (`requires-descendant`, selector `:scope`, target `a[href] [data-rp-part="count"]`; "A CartLink has no count part inside its link."); `cart-link-no-error` (`forbids-descendant`, selector `:scope`, target `[data-rp-part="error"]`).

### Acceptance tests

1. Tier 2: fixtures `default`, `empty`, `children`, `class`, `escaping` are canonical-equal in all four hosts.
2. Tier 3: after upgrade with a store whose `totalQuantity` is 5 and server text `3`, the only mutations are the count text and the attributes of the allow-list.
3. Tier 5: with a store at quantity 0 the count has `hidden`; after an add it shows `1` without `hidden` ([05-commerce.md](05-commerce.md) tests C-01 and C-10).
4. Tier 5: click with `#cart-drawer` present opens the dialog and the URL is unchanged; with no such dialog the click navigates to `/cart`.
5. Tier 6: with scripting disabled the click navigates to `/cart`.

### Evidence and UNVERIFIED

- Evidence: [05-commerce.md](05-commerce.md) sections 7.1 and 9.2; [04-elements.md](04-elements.md) section 10.2 (link opener); `ripple/docs/research/base-theme.md` (cart count bubble in the header).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
