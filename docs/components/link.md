# Link

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `link` |
| Kind | `static` |
| Category | `typography` |
| Custom elements | none |
| Root element and class | `a` `.rp-link` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A text link. It is also the opener of an overlay that has a page equivalent (D-009): with the `dialog` prop it stays a real link and the runtime opens the dialog instead of navigating.

- Use when: linking in or next to text, in menus and footers, or opening the cart drawer, search dialog or mobile nav from a link.
- Do not use when: the link must look like a button (use Button with `href`), or contains only an icon (use IconButton with `href`).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Link` | `blocks/link.liquid` | `a` | `rp-link` | `data-rp-open` (only with `dialog`) | yes | none |

Nesting rules: MUST NOT contain interactive content (`a`, `button`, `input`, `select`, `textarea`, `details`, `label`).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `href` | `href` | url | any URL | none | yes | no | `href` |
| `target` | `target` | string | a browsing context name, for example `_blank` | none (omitted) | no | no | `target` |
| `rel` | `rel` | string | link types, for example `noopener` | none (omitted) | no | no | `rel` |
| `variant` | `variant` | enum | `inline plain` | `inline` | no | no | `data-variant` |
| `current` | `current` | boolean | `true false` | `false` | no | no | `aria-current="page"` when true |
| `disabled` | `disabled` | boolean | `true false` | `false` | no | no | `aria-disabled="true"` and `tabindex="-1"` when true; `href` stays |
| `ariaLabel` | `aria_label` | string | text | none (omitted) | no | no | `aria-label` |
| `dialog` | `dialog` | id | the id of a `<dialog>` in the same document | none (omitted) | no | no | `data-rp-open="<id>"` |

Prop `dialog` is the opener pattern of D-009 as amended: `href` is the page equivalent of the overlay and `dialog` is the id of its `<dialog>`. Callers MUST NOT pass `data-rp-open` through rest props or `attributes`. When the target dialog is not on the page (for example the CartDrawer on the cart page, D-091), the caller omits `dialog` and the link navigates. Button and IconButton take the same prop when `href` is set.

`variant="inline"` is an underlined link in the link colour. `variant="plain"` inherits the text colour and is underlined only on hover; it is for menus, footers and cards.

### Content model

`text` - phrasing content without interactive elements.

### HTML contract

Fixture `default` (`href="/pages/about"`; children `About us`):

```html
<a class="rp-link" href="/pages/about" data-variant="inline">About us</a>
```

Fixture `plain-current` (`href="/collections/all"`, `variant="plain"`, `current`):

```html
<a class="rp-link" href="/collections/all" data-variant="plain" aria-current="page">All products</a>
```

Fixture `opener` (`href="/cart"`, `variant="plain"`, `dialog="cart-drawer"`):

```html
<a class="rp-link" href="/cart" data-variant="plain" data-rp-open="cart-drawer">Cart</a>
```

Fixture `disabled` (`href="/pages/soon"`, `disabled`):

```html
<a class="rp-link" href="/pages/soon" data-variant="inline" aria-disabled="true" tabindex="-1">Coming soon</a>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{ "href": "/pages/about" }` | `About us` |
| `plain-current` | `{ "href": "/collections/all", "variant": "plain", "current": true }` | `All products` |
| `opener` | `{ "href": "/cart", "variant": "plain", "dialog": "cart-drawer" }` | `Cart` |
| `disabled` | `{ "href": "/pages/soon", "disabled": true }` | `Coming soon` |
| `external` | `{ "href": "https://example.com/", "target": "_blank", "rel": "noopener", "ariaLabel": "Example (opens in a new tab)" }` | `Example` |
| `class` | `{ "href": "/pages/about", "class": "custom-a custom-b" }` | `About us` |
| `invalid-enum-falls-back` | `{ "href": "/pages/about", "variant": "bogus" }` (output `data-variant="inline"`) | `About us` |
| `escaping` | `{ "href": "/search?q=Say \"hi\" & <go>" }` (output `href="/search?q=Say &quot;hi&quot; &amp; &lt;go&gt;"`) | `Search` |

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `aria-current` | root | server | `current` is true | `page`, or absent |
| `aria-disabled`, `tabindex` | root | server | `disabled` is true | `true` and `-1`, or absent |
| `aria-haspopup`, `aria-controls` | root | runtime opener listener (`04-elements.md`) | after upgrade, on a link with `data-rp-open` whose target is a `<dialog>` inside a defined `rp-dialog` | absent |

Upgrade allow-list (mutations permitted when the element upgrades): `aria-haspopup="dialog"` and `aria-controls="<dialog id>"` on a root that has `data-rp-open` (D-009; `02-html-contract.md` section 7.3 entry 1). This is the global entry for `a[data-rp-open]` in `GLOBAL_UPGRADE_ALLOW` (D-071 item 2); the Link manifest entry has an empty `upgradeAllow[]`.

### Behaviour with JavaScript

1. Without `dialog`: none; the browser navigates.
2. With `dialog`: an unmodified primary click calls `showModal()` on the target dialog instead of navigating. This is done by the document-level opener listener of `04-elements.md`, not by Link; Link only prints `data-rp-open`.

### Behaviour without JavaScript

Fully functional: the link navigates to `href`. With `dialog`, the link navigates to the page equivalent in `href` (for example `/cart`).

### Events, commands and methods

None.

### Accessibility

- Pattern: native `<a href>`; `checkPattern`: none.
- Accessible name: the text content, or `ariaLabel`; one of them is REQUIRED. A link that opens a new tab SHOULD say so in `ariaLabel`.
- Focus: focusable natively; a disabled link is removed from the tab order (`tabindex="-1"`). The focus ring comes from `base.css`.
- Announcements: None.

| Key | Action |
|---|---|
| Enter | follows the link (native) |

### Styling

- File: `components/link/link.css` (layer `rp.components`).
- Tokens used: `--color-link`, `--radius-xs`, `--font-weight-medium`, `--rp-duration-fast`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-link-color` | `var(--color-link)` | text colour of `variant="inline"` |

| Modifier selector | Sets |
|---|---|
| `.rp-link[data-variant="plain"]` | `--_fg: initial; --_decoration: none` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-link` | custom properties: `--rp-link-color` as above; `--_fg: var(--rp-link-color); --_decoration: underline`. Declarations: `color: var(--_fg); text-decoration-line: var(--_decoration); text-decoration-thickness: 1px; text-underline-offset: 0.2em; border-radius: var(--radius-xs); cursor: pointer` |
| STATES | `.rp-link:hover` | `text-decoration-line: underline; text-decoration-thickness: 2px` |
| STATES | `.rp-link[aria-current="page"]` | `font-weight: var(--font-weight-medium)` |
| STATES | `.rp-link[aria-disabled="true"]` | `opacity: 0.5; pointer-events: none` |
| MOTION | `.rp-link` | `transition: color var(--rp-duration-fast) var(--ease-out)` |

`--_fg: initial` makes `color` fall back to the inherited colour (see Text).

### Host notes

- HTML: None.
- React: `export function Link(props: LinkProps)`; generated; no hooks. A router link is used by passing the router's `href`; Link does not wrap a router component.
- Remix: None. A link to an account route or `/checkout` gets `data-rmx-document` through rest props (D-034 item 3).
- Liquid: `{% block 'link', href: routes.cart_url, dialog: 'cart-drawer' %}Cart{% endblock %}`. `{{ attributes }}` is printed LAST in the opening tag (D-035). Schema settings: `variant` (label keys of section 0.5). Locale keys: `ripple.link.name`.

```tsx
<Link href="/cart" variant="plain" dialog="cart-drawer">Cart</Link>
```

```liquid
{% block 'link', href: routes.cart_url, variant: 'plain', dialog: 'cart-drawer' %}Cart{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4, plus RP201 (accessible name), RP114 (the `data-rp-open` target id exists in the document), RP302 (an overlay with `noJs.fallbackHref` is opened by an `<a href>`). Manifest `rules[]` (reported by RP113): `link-no-interactive-content`: kind `forbids-descendant`, selector `:scope`, target `a, button, input, select, textarea, details, label`. Message: "A Link contains interactive content." Fix: "Move the inner control out of the Link."

### Acceptance tests

1. CA-1 to CA-9 pass (CA-8 exempts links inside `.rp-text` and `.rp-rich-text` only; a standalone Link fixture MUST be at least 24 px high, which the line height of 24 px at `--text-base` gives).
2. Tier 5: fixture `default` computes `text-decoration-line: underline` and `color` equal to the computed `--color-link`; fixture `plain-current` inside `<div style="color: rgb(1, 2, 3)">` computes `color: rgb(1, 2, 3)`, `text-decoration-line: none`, `font-weight: 500`.
3. Tier 5: fixture `disabled` computes `pointer-events: none`, is skipped by Tab, and has `href`.
4. Tier 5: fixture `opener` in a page that contains an `rp-dialog` with `<dialog id="cart-drawer">`: after upgrade the link has `aria-haspopup="dialog"` and `aria-controls="cart-drawer"`; a click opens the dialog and the URL does not change.
5. Tier 6: the same page with JavaScript disabled: a click navigates to `/cart`.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/blocks/link.liquid`; `ripple/docs/00-decisions.md` D-009, section 4.4 (`data-rp-open`), section 6.4 (`disabled` on `<a>`); `02-html-contract.md` section 8 (Link opener, Navigation state); `04-elements.md` (opener listener).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
