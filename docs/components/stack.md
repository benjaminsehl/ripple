# Stack

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `stack` |
| Kind | `static` |
| Category | `layout` |
| Custom elements | none |
| Root element and class | `div` (or the `as` tag) `.rp-stack` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A one-dimensional flex layout, vertical by default, that never wraps. It is the default way to put space between children.

- Use when: stacking children vertically, or switching between column and row at a breakpoint (`direction="column md:row"`).
- Do not use when: children must wrap onto several lines (use Inline) or sit in equal columns (use Grid).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Stack` | `blocks/stack.liquid` | `div`, `section`, `ul`, `ol`, `nav`, `header`, `footer`, `main`, `aside`, `article`, `form` | `rp-stack` | none | yes | none |

Nesting rules: none. When `as` is `ul` or `ol` every child MUST be an `<li>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `as` | `as` | enum | `div section ul ol nav header footer main aside article form` | `div` | no | no | the root tag; no attribute. `ul` or `ol` also prints `role="list"` |
| `direction` | `direction` | enum | `row column` | `column` | no | yes | `data-direction` |
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
| `textAlign` | `text_align` | enum | `start center end` | none (omitted) | no | yes | `data-text-align` |

### Content model

`flow` - any flow content.

### HTML contract

Fixture `default` (no props; children `<p>One</p><p>Two</p>`):

```html
<div class="rp-stack" data-direction="column"><p>One</p><p>Two</p></div>
```

Fixture `responsive` (`gap="2 md:6"`, `align="start"`); identical to `02-html-contract.md` section 11.9 fixture 1:

```html
<div class="rp-stack" data-direction="column" data-gap="2 md:6" data-align="start"><p>One</p><p>Two</p></div>
```

Fixture `row-list` (`as="ul"`, `direction="column md:row"`, `gap="4"`, `justify="between"`, `textAlign="center"`; children `<li>One</li><li>Two</li>`):

```html
<ul class="rp-stack" data-direction="column md:row" data-gap="4" data-justify="between" data-text-align="center" role="list"><li>One</li><li>Two</li></ul>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | `<p>One</p><p>Two</p>` |
| `responsive` | `{ "gap": "2 md:6", "align": "start" }` | `<p>One</p><p>Two</p>` |
| `row-list` | `{ "as": "ul", "direction": "column md:row", "gap": "4", "justify": "between", "textAlign": "center" }` | `<li>One</li><li>Two</li>` |
| `axis-gaps-padding` | `{ "gapX": "2", "gapY": "6", "p": "4", "px": "6", "py": "2", "pt": "1", "pb": "3" }` | `<p>One</p><p>Two</p>` |
| `class` | `{ "class": "custom-a custom-b" }` | `<p>One</p><p>Two</p>` |
| `invalid-enum-falls-back` | `{ "as": "bogus" }` (output tag is `div`) | `<p>One</p><p>Two</p>` |

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

- File: `components/stack/stack.css` (layer `rp.components`).
- Tokens used: none. All spacing comes from `props.css`.

| Custom property | Default | Purpose |
|---|---|---|
| none | | |

| Modifier selector | Sets |
|---|---|
| none | (layout props are matched by `props.css` only, `03-styling-and-tokens.md` section 7.7) |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-stack` | `display: flex; flex-direction: column; flex-wrap: nowrap; min-inline-size: 0; margin: 0; padding: 0; border: 0; list-style: none` |

### Host notes

- HTML: None.
- React: `export function Stack(props: StackProps)`; generated (`06-bindings.md` section 6.5); no hooks.
- Remix: None.
- Liquid: `{% block 'stack', gap: '4' %}<children>{% endblock %}`. Schema settings: none. Locale keys: `ripple.stack.name`.

```tsx
<Stack gap="2 md:6" align="start">
  <p>One</p>
  <p>Two</p>
</Stack>
```

```liquid
{% block 'stack', gap: '2 md:6', align: 'start' %}
  <p>One</p>
  <p>Two</p>
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
2. Tier 5: fixture `default` computes `display: flex`, `flex-direction: column`.
3. Tier 5: fixture `responsive` computes `row-gap` 8 px at 375 px viewport width and 24 px at 1280 px, and `align-items: flex-start`.
4. Tier 5: fixture `row-list` computes `flex-direction: column` at 375 px and `row` at 1280 px; `justify-content: space-between`; `text-align: center`; `list-style-type: none`.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/research/styling-spike.md` sections 1 and 8; `ripple/docs/research/spikes/agent-kit/` (Stack generated in three hosts); `ripple/docs/00-decisions.md` sections 6.2, 6.3.
- UNVERIFIED: Liquid param name `as` (SPIKE-02; see Container).

### Fallback (SPIKE-02)

If SPIKE-02 finds that `as` is not a legal block argument name, the Liquid param is renamed `tag` through the manifest key `prop.liquid.name` (D-038 as amended; `06-bindings.md` section 8.5). The TSX prop stays `as`. Values, default, contract and fixtures do not change; Liquid calls become `{% block '<id>', tag: 'ul' %}`.

---
