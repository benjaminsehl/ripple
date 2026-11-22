# Inline

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `inline` |
| Kind | `static` |
| Category | `layout` |
| Custom elements | none |
| Root element and class | `div` (or the `as` tag) `.rp-inline` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A horizontal flex row that wraps onto new lines, with children centred on the cross axis.

- Use when: placing buttons, badges, chips or short items side by side.
- Do not use when: children must have equal widths (use Grid) or the direction changes by breakpoint (use Stack).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Inline` | `blocks/inline.liquid` | `div`, `section`, `ul`, `ol`, `nav`, `header`, `footer`, `main`, `aside`, `article`, `form` | `rp-inline` | none | yes | none |

Nesting rules: none. When `as` is `ul` or `ol` every child MUST be an `<li>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `as` | `as` | enum | `div section ul ol nav header footer main aside article form` | `div` | no | no | the root tag; no attribute. `ul` or `ol` also prints `role="list"` |
| `wrap` | `wrap` | enum | `wrap nowrap` | `wrap` | no | yes | `data-wrap` |
| `gap` | `gap` | scale | space steps | none (omitted) | no | yes | `data-gap` |
| `gapX` | `gap_x` | scale | space steps | none (omitted) | no | yes | `data-gap-x` |
| `gapY` | `gap_y` | scale | space steps | none (omitted) | no | yes | `data-gap-y` |
| `p` | `p` | scale | space steps | none (omitted) | no | yes | `data-p` |
| `px` | `px` | scale | space steps | none (omitted) | no | yes | `data-px` |
| `py` | `py` | scale | space steps | none (omitted) | no | yes | `data-py` |
| `pt` | `pt` | scale | space steps | none (omitted) | no | yes | `data-pt` |
| `pb` | `pb` | scale | space steps | none (omitted) | no | yes | `data-pb` |
| `align` | `align` | enum | `start center end stretch baseline` | none (omitted; the CSS default is `center`) | no | yes | `data-align` |
| `justify` | `justify` | enum | `start center end between` | none (omitted) | no | yes | `data-justify` |

### Content model

`flow` - any flow content.

### HTML contract

Fixture `default` (no props; children `<span>One</span><span>Two</span>`):

```html
<div class="rp-inline" data-wrap="wrap"><span>One</span><span>Two</span></div>
```

Fixture `toolbar` (`gap="2"`, `justify="between"`, `align="baseline"`, `wrap="nowrap md:wrap"`):

```html
<div class="rp-inline" data-wrap="nowrap md:wrap" data-gap="2" data-align="baseline" data-justify="between"><span>One</span><span>Two</span></div>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | `<span>One</span><span>Two</span>` |
| `toolbar` | `{ "gap": "2", "justify": "between", "align": "baseline", "wrap": "nowrap md:wrap" }` | `<span>One</span><span>Two</span>` |
| `list` | `{ "as": "ol", "gapX": "4", "gapY": "2", "p": "2", "px": "3", "py": "1", "pt": "0", "pb": "0.5" }` (output has `role="list"`) | `<li>One</li><li>Two</li>` |
| `class` | `{ "class": "custom-a custom-b" }` | `<span>One</span><span>Two</span>` |
| `invalid-enum-falls-back` | `{ "as": "bogus" }` (output tag is `div`) | `<span>One</span><span>Two</span>` |
| `responsive` | `{ "wrap": "nowrap lg:wrap" }` | `<span>One</span><span>Two</span>` |

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

- Pattern: native element chosen by `as`; `checkPattern`: none.
- Accessible name: not required.
- Focus: not focusable.
- Announcements: None.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/inline/inline.css` (layer `rp.components`).
- Tokens used: none.

| Custom property | Default | Purpose |
|---|---|---|
| none | | |

| Modifier selector | Sets |
|---|---|
| none | (layout props are matched by `props.css` only) |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-inline` | `display: flex; flex-direction: row; flex-wrap: wrap; align-items: center; min-inline-size: 0; margin: 0; padding: 0; border: 0; list-style: none` |

### Host notes

- HTML: None.
- React: `export function Inline(props: InlineProps)`; generated; no hooks.
- Remix: None.
- Liquid: `{% block 'inline', gap: '2' %}<children>{% endblock %}`. Schema settings: none. Locale keys: `ripple.inline.name`.

```tsx
<Inline gap="2" justify="between">
  <Badge>New</Badge>
  <Button variant="outline">View cart</Button>
</Inline>
```

```liquid
{% block 'inline', gap: '2', justify: 'between' %}
  {% block 'badge' %}New{% endblock %}
  {% block 'button', variant: 'outline', href: routes.cart_url %}View cart{% endblock %}
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
2. Tier 5: fixture `default` computes `display: flex`, `flex-direction: row`, `flex-wrap: wrap`, `align-items: center`.
3. Tier 5: fixture `toolbar` computes `flex-wrap: nowrap` at 375 px viewport width and `wrap` at 1280 px; `column-gap` 8 px; `justify-content: space-between`; `align-items: baseline`.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/research/styling-spike.md` section 8 (`wrap`, `align`, `justify` scoping); `ripple/docs/00-decisions.md` section 6.2.
- UNVERIFIED: Liquid param name `as` (SPIKE-02; see Container).

### Fallback (SPIKE-02)

If SPIKE-02 finds that `as` is not a legal block argument name, the Liquid param is renamed `tag` through the manifest key `prop.liquid.name` (D-038 as amended; `06-bindings.md` section 8.5). The TSX prop stays `as`. Values, default, contract and fixtures do not change; Liquid calls become `{% block '<id>', tag: 'ul' %}`.

---
