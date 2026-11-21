# Icon

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `icon` |
| Kind | `static` |
| Category | `media` |
| Custom elements | none |
| Root element and class | `svg` `.rp-icon` |
| Liquid tier | `snippet` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A decorative inline SVG icon from Ripple's own set of 24 icons (section 0.6), drawn in the current text colour (D-068).

- Use when: adding an icon next to text inside a Button, Link, Badge or Text.
- Do not use when: the icon is the only content of a control (use IconButton, which requires an accessible name), or a custom SVG is needed (write the `<svg>` by hand with `class="rp-icon" aria-hidden="true" focusable="false"`).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Icon` | `snippets/rp-icon.liquid` (no block file) | `svg` | `rp-icon` | none | yes | none |

Nesting rules: none. Icon is phrasing content and may be placed in any `text` content model.

### Props

Icon is the one component that does NOT take the universal props `id`, `span`, `hidden`, rest props or `attributes`. It takes `name` and `class` only.

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `name` | `name` | enum | `account arrow-left arrow-right cart check chevron-down chevron-left chevron-right chevron-up close filter globe info menu minus pause play plus search star tag trash warning zoom-in` | none | yes | no | selects the inner markup (section 0.6); no attribute |
| `class` (`className` in React) | `class` | string | class names | none | no | no | appended after `rp-icon` |

A `name` that is not in the list prints NOTHING (no `<svg>`), in every host; the checker reports RP101.

### Content model

`none` - the inner markup comes from `icons/<name>.svg`.

### HTML contract

Fixture `default` (`name="cart"`):

```html
<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg>
```

Fixture `close` (`name="close"`):

```html
<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
```

Fixture `unknown-name` (`name="bogus"`): the reference HTML is the empty string.

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{ "name": "cart" }` | absent |
| `close` | `{ "name": "close" }` | absent |
| `class` | `{ "name": "cart", "class": "custom-a custom-b" }` | absent |
| `unknown-name` | `{ "name": "bogus" }` | absent |

In addition the generator MUST emit one fixture per icon name, named `icon-<name>` (24 fixtures), with props `{ "name": "<name>" }`, so that conformance covers the whole set. `invalid-enum-falls-back` does not apply (`name` has no default); `unknown-name` takes its place.

Host-owned regions and masks: None.

### State and attributes

None.

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Identical to the behaviour with JavaScript: inline SVG.

### Events, commands and methods

None.

### Accessibility

- Pattern: decorative image; `checkPattern`: none. `aria-hidden="true"` and `focusable="false"` are always printed (`02-html-contract.md` A-7).
- Accessible name: none, by design. The name belongs to the control or text around the icon.
- Focus: not focusable.
- Announcements: None.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/icon/icon.css` (layer `rp.components`).
- Tokens used: none.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-icon-size` | `1.25em` | inline and block size |
| `--rp-icon-stroke` | `1.5` | stroke width in viewBox units |

| Modifier selector | Sets |
|---|---|
| none | |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-icon` | `display: inline-block; flex-shrink: 0; inline-size: var(--rp-icon-size); block-size: var(--rp-icon-size); vertical-align: middle; fill: none; stroke: currentColor; stroke-width: var(--rp-icon-stroke); stroke-linecap: round; stroke-linejoin: round; pointer-events: none` |

Icon does not mirror in right-to-left. A component that embeds a directional icon mirrors it on its own part class (see Breadcrumb).

### Host notes

- HTML: copy the `<svg>` from the reference file.
- React: `export function Icon(props: IconProps)`; generated; the inner markup is a generated constant map from name to JSX; JSX attributes `viewBox`, `aria-hidden="true"`, `focusable="false"`.
- Remix: None.
- Liquid: `{% render 'rp-icon', name: 'cart' %}`. The snippet is a generated `{% case name %}` with one `{% when %}` per icon and no `{% else %}`. It can be rendered from templates, blocks and snippets. No schema. Locale keys: none.

```tsx
<Button><Icon name="plus" />Add to cart</Button>
```

```liquid
{% block 'button', type: 'submit' %}{% render 'rp-icon', name: 'plus' %}Add to cart{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree` (hidden from it by `aria-hidden`); actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4 (RP101 for an unknown `name`). Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 1: the file names in `icons/` are exactly the 24 names of section 0.6 with extension `.svg`; each file matches `^<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">.+</svg>\n?$` and contains no `fill`, `stroke`, `style`, `class` or `id` attribute.
3. Tier 2: the 24 `icon-<name>` fixtures are canonically equal in all four hosts; `unknown-name` renders the empty string in all four hosts.
4. Tier 5: fixture `default` inside `<span style="font-size:16px;color:rgb(1,2,3)">` has a bounding box of 20 by 20 px and computes `stroke: rgb(1, 2, 3)`, `fill: none`.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` D-068 as amended (Icon takes only `name` and `class`; an unknown name prints nothing; path data defined in section 0.6 of this document), section 6.6; `ripple/theme/assets/icon-*.svg` (14 of the names); `ripple/docs/research/base-theme.md` (icon button costs three statements; Icon as a snippet); `02-html-contract.md` section 12.6 row 14 (canonical form of an icon).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
