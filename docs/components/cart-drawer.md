# CartDrawer

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `cart-drawer` |
| Kind | `commerce` |
| Category | `cart` |
| Custom elements | `rp-dialog`, `rp-cart` (through the embedded CartLines and CartSummary) |
| Root element and class | `rp-dialog` `.rp-drawer.rp-cart-drawer` |
| Liquid tier | `resource` |
| No-JS level | `degraded` (the drawer cannot open; the cart page gives full function) |
| Requires `id` | yes (default `cart-drawer`) |
| Depends on | `drawer`, `icon-button`, `icon`, `cart-lines`, `cart-summary` |
| Milestone | M3 |

### Purpose

The cart in a modal drawer. It is a Drawer whose body holds a CartLines and a CartSummary. It opens from a CartLink and after a successful add to cart.

- Use when: the storefront shows the cart without leaving the page. Render it once, in the layout, outside every region.
- Do not use when: on the cart page itself (Liquid: forbidden, RS-4; other hosts: SHOULD NOT), or when the project wants a cart page only (omit it; CartLink and ProductForm then navigate).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CartDrawer` | `blocks/cart-drawer.liquid` | `rp-dialog` | `rp-drawer rp-cart-drawer` | `data-slot="rp-dialog"` | yes | none |
| panel | printed by root | same | `dialog` | `rp-drawer-panel` | none | yes | `<id>` |
| title | printed by root | same | `h2` | `rp-drawer-title` | none | yes | `<id>-title` |
| body | printed by root | same | `div` | `rp-drawer-body` | none | yes | none |
| close | printed by root | same | `button` | `rp-icon-button` | `commandfor="<id>"`, `command="close"` | yes | none |

Nesting rules: root contains only the panel. The panel contains, in order: title, body, close. The default body is one CartLines with `id` `<id>-list`, then one CartSummary with `cartLines` `<id>-list`. Children (`{{ content }}`) replace the children of body. The `<dialog>` MUST NOT be inside a `[data-rp-region]` element or a `{% partial %}` (D-046 item 5; RP308, RP404). The body MUST contain an `rp-cart` root that owns a `[data-rp-part="status"]` element (the embedded CartLines prints it).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | `cart-drawer` | yes | no | `id` on the panel; `<id>-title`; `<id>-list` on the embedded CartLines |
| `cart` | `cart` | object | `RippleCart` or `null` / Liquid `cart` drop | Liquid: the global `cart`; TSX: `null` | no | no | passed to CartLines and CartSummary. TSX: `null` or unset (the buyer has no cart yet) renders the empty cart, the same output as a cart with zero lines (D-110) |
| `side` | `side` | enum | `start end` | `end` | no | no | `data-side` on the panel |
| `acceleratedCheckout` | `accelerated_checkout` | boolean | `true false` | `false` | no | no | passed to CartSummary |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | passed on (CV-1) |
| `action` | none | url | the cart endpoint including the locale path prefix | `/api/cart` | no | no | passed to the embedded CartLines and CartSummary; TSX hosts only (CV-17, D-118) |

The value of `id` defaults to `cart-drawer` and MUST equal `CommerceOptions.cartDrawer` (D-087; [05-commerce.md](05-commerce.md) section 4.2; default `cart-drawer`), otherwise the drawer does not open after an add. CartDrawer composes Drawer by contract (D-070, section 0.2): manifest `root.class` is `rp-drawer rp-cart-drawer` and `dependencies.components` contains `drawer`. In EVERY host the `layout` blueprint MUST omit CartDrawer on the cart page (TSX layout prop `cartPage`; Liquid `template.name == 'cart'`), because the regions `rp-cart-lines` and `rp-cart-summary` may be declared only once per page (D-091 item 5, RS-4).

### Content model

`flow` - replaces the children of body. A caller that passes children MUST include one CartLines (which prints the status part) and SHOULD include one CartSummary.

### HTML contract

Fixture `default` (`cart`: `cart.empty`; hosts `html`, `react`, `remix`):

```html
<rp-dialog class="rp-drawer rp-cart-drawer" data-slot="rp-dialog">
  <dialog class="rp-drawer-panel" id="cart-drawer" data-side="end" aria-labelledby="cart-drawer-title" closedby="any">
    <h2 class="rp-drawer-title" id="cart-drawer-title">Cart</h2>
    <div class="rp-drawer-body">
      <rp-cart class="rp-cart-lines" data-slot="rp-cart" id="cart-drawer-list" data-rp-refresh="rp-cart-lines rp-cart-summary">
        <div class="rp-cart-lines-list" data-rp-region="rp-cart-lines">
          <p class="rp-cart-lines-empty">Your cart is empty.</p>
        </div>
        <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
        <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
      </rp-cart>
      <!-- CartSummary fixture `empty` -->
    </div>
    <button class="rp-icon-button" type="button" commandfor="cart-drawer" command="close" data-variant="ghost" data-size="md" aria-label="Close"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  </dialog>
</rp-dialog>
```

The comment stands for the complete reference HTML of the named CartSummary fixture.

Fixture `liquid-default` (same props; host `liquid`): identical except that the first child of body is the `liquid-empty` fixture of CartLines with `id` `cart-drawer-list` (so its form id is `cart-drawer-list-form`). The second child is the same CartSummary `empty` fixture.

Further required fixtures (each in the two backend variants, FX-2): `two-lines` / `liquid-two-lines` (`cart`: `cart.two-lines`; body = CartLines `default` / `liquid-default` with id `cart-drawer-list`, then CartSummary `two-lines` / `liquid-two-lines` with `cartLines` `cart-drawer-list`); `start` (`side`: `start`; `data-side="start"`); `children` (children `<p>Custom</p>`; body contains only that paragraph); `class` (root class `rp-drawer rp-cart-drawer custom-a custom-b`); `invalid-enum-falls-back` (`side`: `top`; equals `default`).

Host-owned regions and masks: the body's default content is the embedded components' contract; the masks of CartLines and CartSummary apply inside it.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `open` | panel | browser (`showModal()`) | the drawer is open | absent (the server MUST NOT print `open`) |
| `data-side` | panel | server | always | `end` |

Other state is that of the embedded CartLines and CartSummary. Upgrade allow-list (mutations permitted when the element upgrades): None for CartDrawer's own parts.

### Behaviour with JavaScript

1. Opening: a click on any `a[data-rp-open="<id>"]` (CartLink), and `openCart()` of the adapter after a successful add ([05-commerce.md](05-commerce.md) section 7.2), call `showModal()` on the panel through `rp-dialog`.
2. Closing: the close button (`command="close"`), Escape and a click on the backdrop (`closedby="any"`), as specified for `rp-dialog` in [04-elements.md](04-elements.md) section 9.1. Focus returns to the opener.
3. While open, cart mutations refresh the regions `rp-cart-lines` and `rp-cart-summary` inside the body; the `<dialog>` element itself is never replaced, so it stays open.
4. Announcements of cart changes are written to the status part of the `rp-cart` root that handled the change (every submitting `rp-cart` root prints one), because the page's live regions are inert under a modal dialog. The channel for `Added to cart` is specified in [05-commerce.md](05-commerce.md) section 9.1.
5. When focus is lost by a refresh (the focused line was removed), the adapter focuses the first focusable element of the region, else the first focusable element of the dialog ([05-commerce.md](05-commerce.md) section 8.2 step 9).

### Behaviour without JavaScript

The drawer never opens (a closed `<dialog>` is not rendered). CartLink navigates to the cart page and ProductForm posts and lands on the cart page or back on the product page, so every cart function stays available. Missing: viewing the cart without leaving the page.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| command | `close` | panel | invoker command of the close button | none |
| event | `openchange` | `rp-dialog` root | `{ value: boolean, reason, source }` ([10-components-interactive.md](10-components-interactive.md), Drawer) | `onOpenChange?: (value: boolean, detail: object) => void` (through `useElement`) |

### Accessibility

- Pattern: modal dialog; `checkPattern`: `dialog`.
- Accessible name: `aria-labelledby="<id>-title"`; required. Close button: `aria-label="Close"`.
- Focus: on open, the dialog's default focus (first focusable element; `rp-dialog` rules); trapped by the browser; returns to the opener on close.
- Announcements: cart changes through the status part inside the dialog.

| Key | Action |
|---|---|
| Escape | closes the drawer |
| Tab, Shift+Tab | cycle inside the dialog |

### Styling

- File: `components/cart-drawer/cart-drawer.css` (layer `rp.components`). All drawer visuals come from `drawer.css`.
- Tokens used: `--spacing`, `--color-border`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-cart-drawer-gap` | `calc(var(--spacing) * 6)` | space between CartLines and CartSummary |

| Modifier selector | Sets |
|---|---|
| None | |

Required rules: `.rp-cart-drawer .rp-drawer-body { display: flex; flex-direction: column; gap: var(--rp-cart-drawer-gap) }`; `.rp-cart-drawer .rp-cart-lines { flex: 1 1 auto; overflow-y: auto }`; `.rp-cart-drawer .rp-cart-summary { border-block-start: 1px solid var(--color-border); padding-block-start: calc(var(--spacing) * 4) }`.

### Host notes

- HTML: copy the contract once per page, as the last child of `<body>`.
- React: `CartDrawer(props: { id?: string; cart?: RippleCart | null; side?: "start" | "end"; acceleratedCheckout?: boolean; locale?: string; action?: string; onOpenChange?: (value: boolean, detail: object) => void; strings?: { title?: string; close?: string }; className?: string; children?: ReactNode })`. `"use client";` (it uses `useElement` for `onOpenChange`). Compose by contract (D-070): the binding prints `<rp-dialog class="rp-drawer rp-cart-drawer">`, the `<dialog class="rp-drawer-panel">`, the title and the body itself with Drawer's attributes; it does NOT render `<Drawer>`. The close button is the embedded IconButton. It renders `<CartLines id={id + "-list"} cart={cart} />` and `<CartSummary cart={cart} cartLines={id + "-list"} />`, which read the store themselves.
- Remix: `data-rmx-key="<id>"` on root. The default body renders the two region parts inline as plain elements (D-090 item 5). Frames are opt-in: an app that configures `reloadFrames` passes children, CartLines and CartSummary each with a `<Frame>` child (RS-5; SPIKE-11).
- Liquid: `blocks/cart-drawer.liquid` renders `{% render 'rp-cart-lines', id: <id>-list, cart: cart %}` and `{% render 'rp-cart-summary', cart: cart, cart_lines: <id>-list %}` as its default body. For in-place refresh the LAYOUT MUST pass the body with partial-wrapped region parts (RS-3), exactly as in the usage below; without it `ripple check` reports RP403. The layout MUST NOT render the block when `template.name == 'cart'` (RS-4, D-091 item 5). The root is not printed by `{% form %}`; it prints `{{ attributes }}` last (D-035). No schema settings. Locale keys: `ripple.cart-drawer.title` = `Cart`; `ripple.cart-drawer.close` = `Close`.

```tsx
<CartDrawer cart={cart} />
```

```liquid
{% unless template.name == 'cart' %}
  {% block 'cart-drawer', id: 'cart-drawer' %}
    {% block 'cart-lines', id: 'cart-drawer-list' %}
      {% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-list', cart: cart %}{% endpartial %}
    {% endblock %}
    {% block 'cart-summary', cart_lines: 'cart-drawer-list' %}
      {% partial 'rp-cart-summary' %}{% render 'rp-cart-summary-totals', cart: cart, cart_lines: 'cart-drawer-list' %}{% endpartial %}
    {% endblock %}
  {% endblock %}
{% endunless %}
```

### Commerce

- Store fields read: none by CartDrawer itself.
- Adapter methods called: none by CartDrawer itself; the adapter's `openCart()` finds the panel by `CommerceOptions.cartDrawer`.
- Regions refreshed: `rp-cart-lines`, `rp-cart-summary` (declared by the embedded roots).
- Pending and error behaviour: that of CartLines and CartSummary.

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Body content | per-line forms (CartLines `default`) | one cart form (CartLines `liquid-default`) |

### Agent surface

`bridge`: `rp-dialog` actions `open`, `close` ([10-components-interactive.md](10-components-interactive.md), Drawer); the embedded `rp-cart` roots expose the actions of CartLines. No `checkout` action exists (D-050). Confirm: the CheckoutButton inside (`data-agent-confirm`). Secret: none.

### Checker rules

RP104 (`id`), RP114 (`<id>-title`, `<id>-list`), RP201 (dialog name), RP204, RP308 and RP404 (dialog not inside a region or partial), RP403. Manifest `rules[]`: `cart-drawer-status` (`requires-descendant`, selector `dialog`, target `rp-cart [data-rp-part="status"][role="status"]`; "The CartDrawer has no status part; cart changes are not announced inside the modal dialog."); `cart-drawer-one` (`max-count`, selector `.rp-cart-drawer`, count 1).

### Acceptance tests

1. Tier 2: fixtures `default`, `two-lines`, `start`, `children`, `class`, `invalid-enum-falls-back` (hydrogen hosts) and `liquid-default`, `liquid-two-lines` (Liquid shim) are canonical-equal to the reference with the masks of the embedded components.
2. Tier 5: [05-commerce.md](05-commerce.md) test C-02: after an add, `#cart-drawer` is open and the status part contains `Added to cart`.
3. Tier 5: removing the focused line inside the open drawer leaves the dialog open and `document.activeElement` inside the dialog.
4. Tier 5: `checkPattern(root, "dialog")` passes while open.
5. Tier 6: with scripting disabled the panel is not rendered and the CartLink navigates.
6. Tier 5 (checker, Liquid source): `ripple check` on a layout that renders the block inside a `{% partial %}` reports RP404.

### Evidence and UNVERIFIED

- Evidence: [04-elements.md](04-elements.md) sections 9.1 and 10.2; [05-commerce.md](05-commerce.md) sections 7.1, 8.1, 9.1; `ripple/docs/research/liquid-blocks-partials.md` (partials replace DOM; overlay outside the partial).
- UNVERIFIED: that a `{% block %}` call nested in another block's body, each with a `{% partial %}` inside, is accepted by the platform in a layout file (SPIKE-02 owns the proof; if it fails, the layout prints the Drawer markup itself and renders the two snippets inside partials).

### Fallback (SPIKE-nn)

None.

---
