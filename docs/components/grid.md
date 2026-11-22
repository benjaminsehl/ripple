# Grid

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `grid` |
| Kind | `static` |
| Category | `layout` |
| Custom elements | none |
| Root element and class | `div` (or the `as` tag) `.rp-grid` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

An equal-column CSS grid. The number of columns can change by breakpoint; a child spans columns with the universal `span` prop.

- Use when: laying out product cards, feature tiles or a two-column page area.
- Do not use when: children have natural, unequal widths (use Inline) or there is one column (use Stack).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Grid` | `blocks/grid.liquid` | `div`, `section`, `ul`, `ol`, `nav`, `header`, `footer`, `main`, `aside`, `article`, `form` | `rp-grid` | none | yes | none |

Nesting rules: none. When `as` is `ul` or `ol` every child MUST be an `<li>`. A child that spans columns carries `data-span` (any Ripple component through its `span` prop, or a plain element with the attribute written by hand).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `as` | `as` | enum | `div section ul ol nav header footer main aside article form` | `div` | no | no | the root tag; no attribute. `ul` or `ol` also prints `role="list"` |
| `columns` | `columns` | enum | `1 2 3 4 5 6 12` | `1` | no | yes | `data-columns` |
| `gap` | `gap` | scale | space steps | none (omitted) | no | yes | `data-gap` |
| `gapX` | `gap_x` | scale | space steps | none (omitted) | no | yes | `data-gap-x` |
| `gapY` | `gap_y` | scale | space steps | none (omitted) | no | yes | `data-gap-y` |
| `p` | `p` | scale | space steps | none (omitted) | no | yes | `data-p` |
| `px` | `px` | scale | space steps | none (omitted) | no | yes | `data-px` |
| `py` | `py` | scale | space steps | none (omitted) | no | yes | `data-py` |
| `pt` | `pt` | scale | space steps | none (omitted) | no | yes | `data-pt` |
| `pb` | `pb` | scale | space steps | none (omitted) | no | yes | `data-pb` |
| `align` | `align` | enum | `start center end stretch baseline` | none (omitted) | no | yes | `data-align` |
| `justify` | `justify` | enum | `start center end between` | none (omitted) | no | yes | `data-justify` |

In TSX `columns` accepts a bare number (`columns={3}`) or a string (`columns="2 md:4"`). In Liquid it is a quoted string.

### Content model

`flow` - any flow content.

### HTML contract

Fixture `default` (no props; children `<div>One</div><div>Two</div>`):

```html
<div class="rp-grid" data-columns="1"><div>One</div><div>Two</div></div>
```

Fixture `responsive` (`columns="2 md:4"`, `gap="4 md:6"`):

```html
<div class="rp-grid" data-columns="2 md:4" data-gap="4 md:6"><div>One</div><div>Two</div></div>
```

Fixture `product-list` (`as="ul"`, `columns="2 lg:4"`, `gapX="4"`, `gapY="8"`; children `<li>One</li><li data-span="2">Two</li>`):

```html
<ul class="rp-grid" data-columns="2 lg:4" data-gap-x="4" data-gap-y="8" role="list"><li>One</li><li data-span="2">Two</li></ul>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | `<div>One</div><div>Two</div>` |
| `responsive` | `{ "columns": "2 md:4", "gap": "4 md:6" }` | `<div>One</div><div>Two</div>` |
| `product-list` | `{ "as": "ul", "columns": "2 lg:4", "gapX": "4", "gapY": "8" }` | `<li>One</li><li data-span="2">Two</li>` |
| `alignment-padding` | `{ "columns": "3", "align": "center", "justify": "between", "p": "4", "px": "6", "py": "2", "pt": "1", "pb": "3" }` | `<div>One</div><div>Two</div>` |
| `class` | `{ "class": "custom-a custom-b" }` | `<div>One</div><div>Two</div>` |
| `invalid-enum-falls-back` | `{ "as": "bogus" }` (output tag is `div`) | `<div>One</div><div>Two</div>` |

Host-owned regions and masks: None.

### State and attributes

None.

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Identical to the behaviour with JavaScript: static markup styled by CSS.

### Events, commands and methods

None.

### Accessibility

- Pattern: native element chosen by `as`; `checkPattern`: none. Visual order equals DOM order; the component never reorders.
- Accessible name: not required.
- Focus: not focusable.
- Announcements: None.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/grid/grid.css` (layer `rp.components`).
- Tokens used: none.

| Custom property | Default | Purpose |
|---|---|---|
| none | | |

| Modifier selector | Sets |
|---|---|
| none | (layout props are matched by `props.css` only) |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-grid` | `display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); min-inline-size: 0; margin: 0; padding: 0; border: 0; list-style: none` |

### Host notes

- HTML: None.
- React: `export function Grid(props: GridProps)`; generated; no hooks.
- Remix: None.
- Liquid: `{% block 'grid', columns: '2 md:4', gap: '4' %}<children>{% endblock %}`. Schema settings: none. Locale keys: `ripple.grid.name`.

```tsx
<Grid as="ul" columns="2 md:4" gap="4 md:6">
  <li>One</li>
  <li>Two</li>
</Grid>
```

```liquid
{% block 'grid', as: 'ul', columns: '2 md:4', gap: '4 md:6' %}
  <li>One</li>
  <li>Two</li>
{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4. Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: fixture `responsive` in a 1280 px viewport has four equal column tracks and `column-gap` 24 px; in a 375 px viewport two tracks and `column-gap` 16 px.
3. Tier 5: in fixture `product-list` at 1280 px the second child's bounding box is twice the first child's width plus one column gap (0.5 px tolerance).
4. Tier 5: fixture `default` has one column track equal to the root's content width.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/research/styling-spike.md` section 8 (`columns`, `span`); `ripple/docs/00-decisions.md` sections 6.1, 6.2.
- UNVERIFIED: Liquid param name `as` (SPIKE-02; see Container).

### Fallback (SPIKE-02)

If SPIKE-02 finds that `as` is not a legal block argument name, the Liquid param is renamed `tag` through the manifest key `prop.liquid.name` (D-038 as amended; `06-bindings.md` section 8.5). The TSX prop stays `as`. Values, default, contract and fixtures do not change; Liquid calls become `{% block '<id>', tag: 'ul' %}`.

---
