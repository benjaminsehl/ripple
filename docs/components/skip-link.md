# SkipLink

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `skip-link` |
| Kind | `static` |
| Category | `utilities` |
| Custom elements | none |
| Root element and class | `a` `.rp-skip-link` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

The first focusable element of the page: a link that is off-screen until it receives keyboard focus and that jumps past the header to the main content.

- Use when: writing a document shell. The `layout` blueprint (`12-components-chrome-and-blueprints.md`) prints exactly one, as the first child of `<body>`.
- Do not use when: linking anywhere else (use Link).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `SkipLink` | `blocks/skip-link.liquid` | `a` | `rp-skip-link` | none | yes | none |

Nesting rules: MUST be the first focusable element in `<body>`. The document MUST contain an element whose `id` equals the fragment of `href`; the `layout` blueprint of `12-components-chrome-and-blueprints.md` prints `<main id="main" tabindex="-1">` (Liquid: additionally `data-template="{{ request.page_type }}"`, D-099), so the default `href="#main"` always resolves (D-086).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `href` | `href` | url | `#` followed by an element id | `#main` | no | no | `href` |

SkipLink takes the universal props `id` and `class`; it does NOT take `span` or `hidden` (it is out of flow).

### Content model

`text` - the link text, required, for example `Skip to content`. The text is the caller's (a theme translation); the SkipLink component ships no locale key for it (FC-8); the `layout` blueprint passes its own key `ripple.blueprints.layout.skip` (`12-components-chrome-and-blueprints.md`).

### HTML contract

Fixture `default` (no props; children `Skip to content`):

```html
<a class="rp-skip-link" href="#main">Skip to content</a>
```

Fixture `custom-target` (`href="#results"`; children `Skip to results`):

```html
<a class="rp-skip-link" href="#results">Skip to results</a>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | `Skip to content` |
| `custom-target` | `{ "href": "#results" }` | `Skip to results` |
| `class` | `{ "class": "custom-a custom-b" }` | `Skip to content` |
| `escaping` | `{ "href": "#Say \"hi\" & <go>" }` | `Skip to content` |

Host-owned regions and masks: None.

### State and attributes

None.

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional: a same-document fragment link. Activating it scrolls to the target and moves the sequential focus starting point there; with `tabindex="-1"` on the target, focus moves to the target.

### Events, commands and methods

None.

### Accessibility

- Pattern: skip link (WCAG 2.4.1 Bypass Blocks); `checkPattern`: none.
- Accessible name: the link text.
- Focus: focusable; first in the tab order. Visible only while it matches `:focus-visible`; it then shows the global focus ring (`03-styling-and-tokens.md` section 11).
- Announcements: none.
- The link is moved off-screen with `translate`, not hidden with `display` or `visibility`, so that it stays in the tab order and in the accessibility tree.

| Key | Action |
|---|---|
| `Tab` (first press on the page) | focuses the link and reveals it |
| `Enter` | follows the link to the target |

### Styling

- File: `components/skip-link/skip-link.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--spacing-control-md`, `--radius-control`, `--text-sm`, `--font-weight-medium`, `--color-background`, `--color-foreground`, `--color-border`, `--shadow-md`, `--rp-z-toast`, `--rp-duration-fast`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| none | | |

| Modifier selector | Sets |
|---|---|
| none | |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-skip-link` | `position: absolute; inset-block-start: calc(var(--spacing) * 2); inset-inline-start: calc(var(--spacing) * 2); z-index: var(--rp-z-toast); display: inline-flex; align-items: center; box-sizing: border-box; min-block-size: var(--spacing-control-md); padding-block: 0; padding-inline: calc(var(--spacing) * 4); border: 1px solid var(--color-border); border-radius: var(--radius-control); background-color: var(--color-background); color: var(--color-foreground); box-shadow: var(--shadow-md); font-size: var(--text-sm); font-weight: var(--font-weight-medium); text-decoration: none; translate: 0 -200%` |
| STATES | `.rp-skip-link:focus-visible` | `translate: 0 0` |
| MOTION | `.rp-skip-link` (inside the motion media query) | `transition: translate var(--rp-duration-fast) var(--ease-out)` |

`translate: 0 -200%` moves the link up by twice its own height, which with the 8 px block offset places it wholly above the viewport. It does not cause horizontal overflow in either direction.

### Host notes

- HTML: None.
- React: `export function SkipLink(props: SkipLinkProps)`; generated; `href = "#main"` default.
- Remix: None.
- Liquid: `{% block 'skip-link' %}{{ 'ripple.blueprints.layout.skip' | t }}{% endblock %}`. Schema settings: none. Locale keys: `ripple.skip-link.name`.

```tsx
<body>
  <SkipLink>Skip to content</SkipLink>
  <Header />
  <main id="main" tabIndex={-1}>
    <Outlet />
  </main>
</body>
```

```liquid
<body>
  {% block 'skip-link' %}{{ 'ripple.blueprints.layout.skip' | t }}{% endblock %}
  {% block 'header' %}{% endblock %}
  <main id="main" tabindex="-1" data-template="{{ request.page_type }}">{{ content_for_layout }}</main>
</body>
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4. Manifest `rules[]`: none. (That the target id exists is checked per blueprint by the test in `12-components-chrome-and-blueprints.md`, not by the static checker, because the target is in another file.)

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: fixture `default` as the first child of `<body>` followed by `<main id="main" tabindex="-1">`: before any key press the link's bounding box bottom is less than or equal to 0; after one `Tab` press `document.activeElement` is the link and its bounding box is inside the viewport with top and inline-start offsets of 8 px at default dials.
3. Tier 5: after `Tab` then `Enter`, `location.hash` is `#main` and `document.activeElement` is the `main` element.
4. Tier 5: the same in a `dir="rtl"` document: the focused link's right edge is 8 px from the viewport's right edge.
5. Tier 5: `document.documentElement.scrollWidth` equals `clientWidth` before and after focus (no horizontal overflow).

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` D-086 (SkipLink `href` defaults to `#main`; the layout's `<main>` has `id="main"`), D-099 item 3 (`<main id="main" data-template="{{ request.page_type }}">` in the Liquid layout), section 8.1 (SkipLink), section 8.5 (`layout` blueprint lists SkipLink and `<main id="main" data-template>`); `ripple/docs/02-html-contract.md` A-10 ("SkipLink targets the `id` of `<main>`"); `ripple/docs/03-styling-and-tokens.md` section 4.1 (`:where(dialog, main):focus-visible { outline: none }`), CSS-19 (`z-index` values).
- UNVERIFIED: None. The Liquid example uses the `layout` blueprint's key `ripple.blueprints.layout.skip` (`12-components-chrome-and-blueprints.md`, blueprint `layout`); the text is the caller's.

### Fallback (SPIKE-nn)

None.

---
