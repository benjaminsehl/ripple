# Separator

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `separator` |
| Kind | `static` |
| Category | `layout` |
| Custom elements | none |
| Root element and class | `hr` `.rp-separator` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A thin rule that separates content, horizontal by default.

- Use when: dividing groups of content inside a Stack (horizontal) or items inside an Inline (vertical).
- Do not use when: only space is needed (use `gap`), or for a decorative border on a box (use Card).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Separator` | `blocks/separator.liquid` | `hr` | `rp-separator` | none | yes | none |

Nesting rules: a vertical Separator MUST be a direct child of a flex row (Inline, or Stack with `direction="row"`).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `orientation` | `orientation` | enum | `horizontal vertical` | `horizontal` | no | no | `data-orientation`; the value `vertical` also prints `aria-orientation="vertical"` |

### Content model

`none` - the element is void.

### HTML contract

Fixture `default` (no props):

```html
<hr class="rp-separator" data-orientation="horizontal">
```

Fixture `vertical` (`orientation="vertical"`):

```html
<hr class="rp-separator" data-orientation="vertical" aria-orientation="vertical">
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | absent |
| `vertical` | `{ "orientation": "vertical" }` | absent |
| `class` | `{ "class": "custom-a custom-b" }` | absent |
| `invalid-enum-falls-back` | `{ "orientation": "bogus" }` (output equals `default`) | absent |

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

- Pattern: native `<hr>` (implicit role `separator`); `checkPattern`: none.
- Accessible name: not required.
- Focus: not focusable.
- Announcements: None.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/separator/separator.css` (layer `rp.components`).
- Tokens used: `--color-border`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-separator-color` | `var(--color-border)` | line colour |

| Modifier selector | Sets |
|---|---|
| `.rp-separator[data-orientation="vertical"]` | `--_inline-size: 1px; --_block-size: auto; --_min-block-size: 1em` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-separator` | custom properties: `--rp-separator-color` as above; `--_inline-size: 100%; --_block-size: 1px; --_min-block-size: 0`. Declarations: `display: block; flex-shrink: 0; align-self: stretch; inline-size: var(--_inline-size); block-size: var(--_block-size); min-block-size: var(--_min-block-size); margin: 0; padding: 0; border: 0; background-color: var(--rp-separator-color)` |
| ENVIRONMENT | `.rp-separator` inside `@media (forced-colors: active)` | `background-color: CanvasText` |

### Host notes

- HTML: None.
- React: `export function Separator(props: SeparatorProps)`; generated; no hooks; no `children` prop.
- Remix: None.
- Liquid: `{% block 'separator' %}{% endblock %}`. Schema settings: `orientation`. Locale keys: `ripple.separator.name`.

```tsx
<Stack gap="4">
  <Text>Subtotal</Text>
  <Separator />
  <Text>Total</Text>
</Stack>
```

```liquid
{% block 'stack', gap: '4' %}
  {% block 'text' %}Subtotal{% endblock %}
  {% block 'separator' %}{% endblock %}
  {% block 'text' %}Total{% endblock %}
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
2. Tier 5: fixture `default` in a 400 px parent has a bounding box of 400 by 1 px and `background-color` equal to the computed `--color-border`.
3. Tier 5: fixture `vertical` as a child of `<div style="display:flex;height:40px">` has a bounding box of 1 by 40 px.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` section 6.3 (`orientation`), section 4.3 (`data-orientation` is a reserved UI SDK attribute name; every selector here includes the component class).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
