# PriceRange

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `price-range` |
| Kind | `static` |
| Category | `discovery` |
| Custom elements | none |
| Root element and class | `div` `.rp-price-range` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `input` |
| Milestone | M3 |

### Purpose

Two number inputs, minimum and maximum price, for the price filter of a Filters form. It is not a slider.

- Use when: inside a FilterGroup of type `price_range` (FilterGroup renders it).
- Do not use when: outside a GET form inside an `rp-live` root, or for a generic numeric range (use two Inputs).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `PriceRange` | `blocks/price-range.liquid` + `snippets/rp-price-range.liquid` | `div` | `rp-price-range` | none | yes | none |
| field | printed by root | same | `label` | `rp-price-range-field` | none | two | none |
| field label | printed by root | same | `span` | `rp-price-range-label` | none | two | none |
| input | printed by root | same | `input` | `rp-input` | none | two | none |

Nesting rules: root contains exactly two fields: minimum first, maximum second. Each field contains the field label, then the input. The inputs are labelled by their wrapping `<label>`; they carry no `id`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `minName` | none | string | parameter name | `filter.v.price.gte` | no | no | `name` of the first input |
| `maxName` | none | string | parameter name | `filter.v.price.lte` | no | no | `name` of the second input |
| `min` | none | string | decimal number in major units, or empty | empty | no | no | `value` of the first input (omitted when empty) |
| `max` | none | string | decimal number in major units, or empty | empty | no | no | `value` of the second input (omitted when empty) |
| `rangeMax` | none | string | decimal number in major units, or empty | empty | no | no | `max` on both inputs and `placeholder` on the second (omitted when empty) |
| none | `filter` | object | Liquid `filter` drop of type `price_range` | none | yes (Liquid) | no | all of the above |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` on both inputs |

Number text rule: the value is the amount in major currency units with `.` as decimal separator and no grouping. TSX hosts print the string they were given (it comes from the URL). Liquid computes it from the drop's value in cents `c`: `cents = c | modulo: 100`, then `whole = c | minus: cents | divided_by: 100` (the subtraction makes the division exact, so Shopify's integer division and the shim's floating-point division print the same digits; `13-testing.md` section 20 item 7); the text is `whole` when `cents` is 0, otherwise `whole`, `.`, and `cents` left-padded to two digits. (`5000` gives `50`; `5005` gives `50.05`.)

### Content model

`none`.

### HTML contract

Fixture `default` (`max`: `50`):

```html
<div class="rp-price-range">
  <label class="rp-price-range-field"><span class="rp-price-range-label">From</span><input class="rp-input" type="number" data-size="md" name="filter.v.price.gte" min="0" step="any" inputmode="decimal"></label>
  <label class="rp-price-range-field"><span class="rp-price-range-label">To</span><input class="rp-input" type="number" data-size="md" name="filter.v.price.lte" min="0" step="any" inputmode="decimal" value="50"></label>
</div>
```

Fixture `bounded` (`min`: `10`, `max`: `50.5`, `rangeMax`: `120`, `size`: `sm`):

```html
<div class="rp-price-range">
  <label class="rp-price-range-field"><span class="rp-price-range-label">From</span><input class="rp-input" type="number" data-size="sm" name="filter.v.price.gte" min="0" max="120" step="any" inputmode="decimal" value="10"></label>
  <label class="rp-price-range-field"><span class="rp-price-range-label">To</span><input class="rp-input" type="number" data-size="sm" name="filter.v.price.lte" min="0" max="120" step="any" inputmode="decimal" placeholder="120" value="50.5"></label>
</div>
```

The Liquid fixture data for `bounded` uses `min_value.value` 1000, `max_value.value` 5050 and `range_max` 12000; the Liquid text for the maximum is `50.50`, so the fixture masks that one attribute.

Further required fixtures: `empty` (no props; neither input has `value`); `class` (root class `rp-price-range custom-a custom-b`); `invalid-enum-falls-back` (`size`: `huge`; equals `empty`).

Host-owned regions and masks: none host-owned. Mask in `bounded` only: `{ "select": "input[name=\"filter.v.price.lte\"]", "op": "attr", "name": "value" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `value` | input | server | the bound is set in the URL | the number text, or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None of its own. A `change` (blur or Enter) is handled by the enclosing `rp-live`; an empty input contributes no parameter.
2. Native validation applies: a value below `0` or above `rangeMax` blocks `requestSubmit()` and shows the browser's message.

### Behaviour without JavaScript

The inputs are submitted with the Filters form.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: two labelled number fields; `checkPattern`: none.
- Accessible name: `From` and `To` through the wrapping labels; required. The group is named by the FilterGroup summary (`Price`).
- Focus: two tab stops.
- Announcements: None.

| Key | Action |
|---|---|
| Enter | applies the range |
| ArrowUp, ArrowDown | native number stepping |

### Styling

- File: `components/price-range/price-range.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-muted-foreground`, `--text-sm`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-price-range-gap` | `calc(var(--spacing) * 3)` | space between the two fields |

| Modifier selector | Sets |
|---|---|
| None | |

Required rules: root `display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--rp-price-range-gap)`; field `display: flex; flex-direction: column; gap: calc(var(--spacing) * 1)`; field label `font-size: var(--text-sm); color: var(--color-muted-foreground)`.

### Host notes

- HTML: copy the contract.
- React: `PriceRange(props: { minName?: string; maxName?: string; min?: string; max?: string; rangeMax?: string; size?: "sm" | "md" | "lg"; strings?: { from?: string; to?: string }; className?: string })`. No hook. Uncontrolled inputs (`defaultValue`), with `key={min + ":" + max}` set by FilterGroup so that navigation resets them.
- Remix: None.
- Liquid: names `filter.min_value.param_name` and `filter.max_value.param_name`; values from `filter.min_value.value` and `filter.max_value.value` (cents; blank when not set); `rangeMax` from `filter.range_max` (cents). Filters `divided_by` and `modulo` are in the component scope of the Liquid subset (D-097). The two inputs are the embedded Input with `inputmode="decimal"` passed through `attributes` (a native attribute, not a hook). No schema settings. Locale keys: `ripple.price-range.from` = `From`; `ripple.price-range.to` = `To`.

```tsx
<PriceRange min={filter.price.min} max={filter.price.max} />
```

```liquid
{% render 'rp-price-range', filter: filter %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP101 (`size`), RP110. Manifest `rules[]`: `price-range-in-get-form` (`requires-ancestor`, selector `:scope`, target `form[method="get"]`); `price-range-two-inputs` (`max-count`, selector `:scope input[type="number"]`, count 2).

### Acceptance tests

1. Tier 2: `default`, `bounded`, `empty`, `class`, `invalid-enum-falls-back` are canonical-equal in all four hosts with the mask above.
2. Tier 2 (Liquid shim, unit): cents `5000` prints `50`, `5005` prints `50.05`, `5050` prints `50.50`, blank prints no `value` attribute.
3. Tier 5: accessible names of the inputs are `From` and `To`.
4. Tier 5: inside a Filters fixture, typing `20` in `From` and pressing Enter produces a URL containing `filter.v.price.gte=20` and no `filter.v.price.lte` when `To` is empty.

### Evidence and UNVERIFIED

- Evidence: `hydrogen/packages/hydrogen/skills/hydrogen-collection-browser/SKILL.md` (price inputs `filter.v.price.gte` / `filter.v.price.lte`, `type="number"`, `min="0"`, `step="any"`); Liquid `filter.min_value`, `filter.max_value`, `filter.range_max` (Shopify docs tool, this session); `ripple/theme/snippets/filter-group.liquid`.
- UNVERIFIED: that `filter.min_value.value` and `filter.range_max` are numbers of cents in every currency (zero-decimal currencies need a different divisor; doc 14 owns the correction with `shop.money_format` knowledge).

### Fallback (SPIKE-nn)

None.

---
