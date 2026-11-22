# RadioGroup

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `radio-group` |
| Kind | `static` |
| Category | `forms` |
| Custom elements | none |
| Root element and class | `fieldset` `.rp-radio-group` |
| Liquid tier | `parts` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A `<fieldset>` of native radio buttons with a legend: exactly one option of the group is chosen.

- Use when: choosing one of two to five options that should all be visible.
- Do not use when: there are more than five options (use Select), or choosing a product variant (use VariantPicker, `11-components-commerce.md`).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `RadioGroup` | `blocks/radio-group.liquid` | `fieldset` | `rp-radio-group` | none | yes | none |
| legend | `RadioGroupLegend` | `blocks/radio-group-legend.liquid` | `legend` | `rp-radio-group-legend` | none | yes | none |
| item | `RadioGroupItem` | `blocks/radio-group-item.liquid` | `label` | `rp-radio-group-item` | none | yes (at least two) | none |
| input | none (printed by item) | (inside `radio-group-item`) | `input` | `rp-radio-group-input` | none | yes | none |
| label | none (printed by item) | (inside `radio-group-item`) | `span` | `rp-radio-group-label` | none | yes | none |

Nesting rules: the legend is the first child of the root; items follow. Every item of one group MUST receive the same `name` (a part cannot read its parent). At most one item has `defaultChecked`.

### Props

Root (`RadioGroup`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `orientation` | `orientation` | enum | `vertical horizontal` | `vertical` | no | no | `data-orientation` |
| `disabled` | `disabled` | boolean | `true false` | `false` | no | no | `disabled` on the `<fieldset>` (disables every radio in it natively) |
| `describedBy` | `described_by` | string | space-separated ids | none (omitted) | no | no | `aria-describedby` |

Legend (`RadioGroupLegend`): no props other than `class` and rest props.

Item (`RadioGroupItem`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `name` | `name` | string | the group's field name | none | yes | no | `name` on the input |
| `value` | `value` | string | value submitted when chosen | none | yes | no | `value` on the input |
| `defaultChecked` | `default_checked` | boolean | `true false` | `false` | no | no | `checked` on the input |
| `required` | `required` | boolean | `true false` | `false` | no | no | `required` on the input |
| `disabled` | `disabled` | boolean | `true false` | `false` | no | no | `disabled` on the input |

On an item, `class`, `id` and rest props apply to the `<label>` (the item root).

### Content model

`parts` - root: one legend, then two or more items. Legend: `text`. Item: `text` (the option's label, placed in the label part).

### HTML contract

Fixture `default` (legend `Size`; items `s` (checked) and `m`, `name="size"`):

```html
<fieldset class="rp-radio-group" data-orientation="vertical"><legend class="rp-radio-group-legend">Size</legend><label class="rp-radio-group-item"><input class="rp-radio-group-input" type="radio" name="size" value="s" checked><span class="rp-radio-group-label">Small</span></label><label class="rp-radio-group-item"><input class="rp-radio-group-input" type="radio" name="size" value="m"><span class="rp-radio-group-label">Medium</span></label></fieldset>
```

Fixture `horizontal-disabled` (root `orientation="horizontal"`, `disabled`, `describedBy="delivery-hint"`; second item `required`, `disabled`):

```html
<fieldset class="rp-radio-group" disabled data-orientation="horizontal" aria-describedby="delivery-hint"><legend class="rp-radio-group-legend">Delivery</legend><label class="rp-radio-group-item"><input class="rp-radio-group-input" type="radio" name="delivery" value="ship"><span class="rp-radio-group-label">Ship</span></label><label class="rp-radio-group-item"><input class="rp-radio-group-input" type="radio" name="delivery" value="pickup" required disabled><span class="rp-radio-group-label">Pick up</span></label></fieldset>
```

| Fixture | Root `props` | `parts` (in order) |
|---|---|---|
| `default` | `{}` | `legend` children `Size`; `item` `{ "name": "size", "value": "s", "defaultChecked": true }` children `Small`; `item` `{ "name": "size", "value": "m" }` children `Medium` |
| `horizontal-disabled` | `{ "orientation": "horizontal", "disabled": true, "describedBy": "delivery-hint" }` | `legend` children `Delivery`; `item` `{ "name": "delivery", "value": "ship" }` children `Ship`; `item` `{ "name": "delivery", "value": "pickup", "required": true, "disabled": true }` children `Pick up` |
| `class` | `{ "class": "custom-a custom-b" }` | as `default` |
| `invalid-enum-falls-back` | `{ "orientation": "bogus" }` (output `data-orientation="vertical"`) | as `default` |
| `escaping` | `{ "describedBy": "Say \"hi\" & <go>" }` | as `default` (this fixture's lint skips check `a-3`) |

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `checked` | input of an item | server | the item's `defaultChecked` is true | present on at most one input |
| `disabled` | root | server | the root's `disabled` is true | present, or absent |
| `required`, `disabled` | input of an item | server | the item's prop is true | present, or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional: native radio group; arrow keys move the selection; submits `name=value` of the chosen item.

### Events, commands and methods

None.

### Accessibility

- Pattern: native `<fieldset>` + `<legend>` + radio inputs sharing `name`; `checkPattern`: none. No `role="radiogroup"` (`02-html-contract.md` PE-3) and no `aria-checked`.
- Accessible name: the group is named by the legend (REQUIRED); each radio by its wrapping `<label>`.
- Focus: Tab enters the group at the checked radio (or the first); native.
- Announcements: None.

| Key | Action |
|---|---|
| ArrowDown, ArrowRight | select the next radio (native) |
| ArrowUp, ArrowLeft | select the previous radio (native) |
| Space | select the focused radio (native) |

### Styling

- File: `components/radio-group/radio-group.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--spacing-target-min`, `--text-sm`, `--text-sm--line-height`, `--text-base`, `--text-base--line-height`, `--font-weight-medium`, `--color-input`, `--color-background`, `--color-primary`, `--rp-duration-fast`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-radio-group-gap` | `calc(var(--spacing) * 2)` | gap between items |
| `--rp-radio-group-size` | `var(--spacing-target-min)` | size of the radio circle |

| Modifier selector | Sets |
|---|---|
| `.rp-radio-group[data-orientation="horizontal"]` | `--_direction: row; --_gap-x: calc(var(--spacing) * 6)` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-radio-group` | custom properties: the two public ones above; `--_direction: column; --_gap-x: 0`. Declarations: `display: flex; flex-direction: var(--_direction); flex-wrap: wrap; row-gap: var(--rp-radio-group-gap); column-gap: var(--_gap-x); min-inline-size: 0; margin: 0; padding: 0; border: 0` |
| PARTS | `.rp-radio-group-legend` | `inline-size: 100%; margin-block-end: var(--rp-radio-group-gap); padding: 0; font-size: var(--text-sm); line-height: var(--text-sm--line-height); font-weight: var(--font-weight-medium)` |
| PARTS | `.rp-radio-group-item` | `display: inline-flex; align-items: center; gap: calc(var(--spacing) * 2); cursor: pointer` |
| PARTS | `.rp-radio-group-input` | `flex-shrink: 0; inline-size: var(--rp-radio-group-size); block-size: var(--rp-radio-group-size); margin: 0; border: 1px solid var(--color-input); border-radius: 9999px; background-color: var(--color-background); appearance: none; cursor: pointer` |
| PARTS | `.rp-radio-group-label` | `font-size: var(--text-base); line-height: var(--text-base--line-height)` |
| STATES | `.rp-radio-group-input:hover` | `border-color: var(--color-primary)` |
| STATES | `.rp-radio-group-input:checked` | `border-color: var(--color-primary); background-image: radial-gradient(circle, var(--color-primary) 0 40%, transparent 44%)` |
| STATES | `.rp-radio-group-input:disabled` | `opacity: 0.5; cursor: not-allowed` |
| MOTION | `.rp-radio-group-input` | `transition: border-color var(--rp-duration-fast) var(--ease-out)` |
| ENVIRONMENT | `.rp-radio-group-input` inside `@media (forced-colors: active)` | `appearance: auto` |

A `<legend>` inside a flex `<fieldset>` is laid out by the browser's fieldset algorithm, not as a flex item; `inline-size: 100%` keeps it on its own line in both orientations.

### Host notes

- HTML: None.
- React: `RadioGroup`, `RadioGroupLegend`, `RadioGroupItem` in `radio-group.tsx`; generated; `defaultChecked` is passed to React as `defaultChecked`; no context.
- Remix: prints `checked` from `defaultChecked`.
- Liquid: three block files. Schema settings: `orientation` on `radio-group`. Locale keys: `ripple.radio-group.name`, `ripple.radio-group.legend_name`, `ripple.radio-group.item_name`.

```tsx
<RadioGroup>
  <RadioGroupLegend>Size</RadioGroupLegend>
  <RadioGroupItem name="size" value="s" defaultChecked>Small</RadioGroupItem>
  <RadioGroupItem name="size" value="m">Medium</RadioGroupItem>
</RadioGroup>
```

```liquid
{% block 'radio-group' %}
  {% block 'radio-group-legend' %}Size{% endblock %}
  {% block 'radio-group-item', name: 'size', value: 's', default_checked: true %}Small{% endblock %}
  {% block 'radio-group-item', name: 'size', value: 'm' %}Medium{% endblock %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4, plus RP115 (no hand-rolled `role="radiogroup"`). Manifest `rules[]`, RP113 errors: `radio-group-legend` (the first child of `.rp-radio-group` is `legend.rp-radio-group-legend`); `radio-group-one-name` (all `.rp-radio-group-input` elements inside one `.rp-radio-group` have the same `name`); `radio-group-one-checked` (at most one of them has `checked`).

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: in fixture `default` the accessibility tree has a group named `Size` with two radios named `Small` (checked) and `Medium`; ArrowDown from `Small` checks `Medium` and unchecks `Small`.
3. Tier 5: each radio circle is 24 by 24 px; the checked one shows the dot (computed `background-image` is not `none`).
4. Tier 5: in fixture `horizontal-disabled` the two items are on one row at 1280 px and every radio matches `:disabled`.
5. Tier 6: fixture `default` in a GET form submits `size=s` with JavaScript disabled.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` D-014 as amended (item d: part classes `rp-radio-group-item`, `rp-radio-group-input`, `rp-radio-group-label`; any `rp-radio` or `rp-label` class inside a RadioGroup in another document is a defect of that document, D-069), section 8.1 (`fieldset` + `input type="radio"`, tier `parts`); `04-elements.md` section 10.12; `02-html-contract.md` A-8 (groups in `<fieldset>` with `<legend>`).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
