# Checkbox

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `checkbox` |
| Kind | `static` |
| Category | `forms` |
| Custom elements | none |
| Root element and class | `input[type="checkbox"]` `.rp-checkbox` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A native checkbox.

- Use when: an independent yes/no choice that is applied when the form is submitted, or one of several choices in a filter list.
- Do not use when: the setting reads as on/off (use Switch), or exactly one of several options is chosen (use RadioGroup).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Checkbox` | `blocks/checkbox.liquid` | `input` | `rp-checkbox` | none | yes | inside a Field: `id` equals the Field's `id` |

Nesting rules: none. A Checkbox MUST have a label: a Field with `orientation="horizontal"`, a wrapping Label, or `ariaLabel`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `name` | `name` | string | form field name | none (omitted) | no | no | `name` |
| `value` | `value` | string | value submitted when checked | none (omitted; the browser then submits `on`) | no | no | `value` |
| `defaultChecked` | `default_checked` | boolean | `true false` | `false` | no | no | `checked` |
| `required` | `required` | boolean | `true false` | `false` | no | no | `required` |
| `disabled` | `disabled` | boolean | `true false` | `false` | no | no | `disabled` |
| `invalid` | `invalid` | boolean | `true false` | `false` | no | no | `aria-invalid="true"` |
| `describedBy` | `described_by` | string | space-separated ids | none (omitted) | no | no | `aria-describedby` |
| `ariaLabel` | `aria_label` | string | text | none (omitted) | no | no | `aria-label` |

`type="checkbox"` is always printed and is not a prop.

### Content model

`none` - `<input>` is void.

### HTML contract

Fixture `default` (no props):

```html
<input class="rp-checkbox" type="checkbox">
```

Fixture `checked` (`id="gift"`, `name="gift"`, `value="yes"`, `defaultChecked`):

```html
<input class="rp-checkbox" type="checkbox" id="gift" name="gift" value="yes" checked>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | absent |
| `checked` | `{ "id": "gift", "name": "gift", "value": "yes", "defaultChecked": true }` | absent |
| `required-invalid` | `{ "name": "terms", "value": "1", "required": true, "invalid": true, "describedBy": "terms-error", "ariaLabel": "Accept the terms" }` | absent |
| `disabled` | `{ "name": "gift", "disabled": true }` | absent |
| `class` | `{ "class": "custom-a custom-b" }` | absent |
| `escaping` | `{ "name": "Say \"hi\" & <go>" }` | absent |

Reference attribute order for this component: `class`, `type`, `id`, then the Props-table order (`type` is contract-fixed and printed right after `class`).

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `checked` | root | server | `defaultChecked` is true | present, or absent |
| `required`, `disabled` | root | server | the prop is true | present, or absent |
| `aria-invalid` | root | server | `invalid` is true | `true`, or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None. (React hydration re-writes `type`, `value`, `name`, `checked` with equal values; `06-bindings.md` Q-10.)

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional: native toggle; submits `name=value` when checked.

### Events, commands and methods

None.

### Accessibility

- Pattern: native checkbox; `checkPattern`: none. The server MUST NOT print `aria-checked`.
- Accessible name: from the associated `<label>` or `ariaLabel`; REQUIRED (RP202).
- Focus: native; the focus ring comes from `base.css`.
- Announcements: None.

| Key | Action |
|---|---|
| Space | toggles (native) |

### Styling

- File: `components/checkbox/checkbox.css` (layer `rp.components`).
- Tokens used: `--spacing-target-min`, `--radius-xs`, `--color-input`, `--color-background`, `--color-primary`, `--color-primary-foreground`, `--color-destructive`, `--rp-duration-fast`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-checkbox-size` | `var(--spacing-target-min)` | inline and block size (24 px: the minimum target) |
| `--rp-checkbox-radius` | `var(--radius-xs)` | corner radius |

| Modifier selector | Sets |
|---|---|
| none | |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-checkbox` | custom properties: the two public ones above; `--_bg: var(--color-background); --_fg: var(--color-primary-foreground); --_border: var(--color-input)`. Declarations: `position: relative; display: inline-block; flex-shrink: 0; inline-size: var(--rp-checkbox-size); block-size: var(--rp-checkbox-size); margin: 0; padding: 0; border: 1px solid var(--_border); border-radius: var(--rp-checkbox-radius); background-color: var(--_bg); vertical-align: middle; appearance: none; cursor: pointer` |
| STATES | `.rp-checkbox:hover` | `border-color: var(--color-primary)` |
| STATES | `.rp-checkbox:checked` | `border-color: var(--color-primary); background-color: var(--color-primary)` |
| STATES | `.rp-checkbox:checked::after` | `content: ""; position: absolute; inset: 0; background-color: var(--_fg); clip-path: polygon(18% 52%, 27% 43%, 42% 58%, 73% 26%, 82% 35%, 42% 76%)` |
| STATES | `.rp-checkbox:disabled` | `opacity: 0.5; cursor: not-allowed` |
| STATES | `.rp-checkbox:is([aria-invalid="true"], :user-invalid)` | `border-color: var(--color-destructive)` |
| MOTION | `.rp-checkbox` | `transition: background-color var(--rp-duration-fast) var(--ease-out), border-color var(--rp-duration-fast) var(--ease-out)` |
| ENVIRONMENT | `.rp-checkbox` inside `@media (forced-colors: active)` | `appearance: auto` |

### Host notes

- HTML: None.
- React: `export function Checkbox(props: CheckboxProps)`; generated; `defaultChecked` is passed to React as `defaultChecked`.
- Remix: prints `checked` from `defaultChecked`.
- Liquid: `{% block 'checkbox', id: 'gift', name: 'gift', value: 'yes' %}{% endblock %}`. Schema settings: none. Locale keys: `ripple.checkbox.name`.

```tsx
<Field id="gift" orientation="horizontal">
  <FieldControl><Checkbox id="gift" name="gift" value="yes" /></FieldControl>
  <FieldLabel field="gift">This is a gift</FieldLabel>
</Field>
```

```liquid
{% block 'field', id: 'gift', orientation: 'horizontal' %}
  {% block 'field-control' %}{% block 'checkbox', id: 'gift', name: 'gift', value: 'yes' %}{% endblock %}{% endblock %}
  {% block 'field-label', field: 'gift' %}This is a gift{% endblock %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4, plus RP202 and RP114. Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: fixture `default` has a bounding box of 24 by 24 px; fixture `checked` computes `background-color` equal to the computed `--color-primary` and has a visible check mark (the `::after` pseudo-element computes `content: ""` and a non-`none` `clip-path`).
3. Tier 5: Space toggles the `checked` property; a click on an associated label toggles it.
4. Tier 2: no fixture has `aria-checked`.
5. Tier 6: fixture `checked` in a GET form submits `gift=yes` with JavaScript disabled.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` D-014; `04-elements.md` section 10.12; `ripple/docs/research/uisdk-web-elements.md` section 9.1 (`ui-checkbox` submits nothing without JavaScript); `02-html-contract.md` I-2.
- UNVERIFIED: `::after` on `input[type="checkbox"]` with `appearance: none` in WebKit and Gecko (SPIKE-06, tier 9). If it does not render, see the fallback.

### Fallback (SPIKE-06)

If a pseudo-element on a checkbox input does not render in WebKit or Gecko, the check mark is drawn without a pseudo-element: delete the `:checked::after` rule and add to the `:checked` rule `background-image: linear-gradient(var(--_fg), var(--_fg)); background-size: 50% 50%; background-position: center; background-repeat: no-repeat` (a filled square mark). The contract does not change.

---
