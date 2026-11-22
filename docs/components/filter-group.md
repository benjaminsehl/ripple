# FilterGroup

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `filter-group` |
| Kind | `static` |
| Category | `discovery` |
| Custom elements | none |
| Root element and class | `details` `.rp-filter-group` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `checkbox`, `swatch`, `price-range`, `visually-hidden` |
| Milestone | M3 |

### Purpose

One filter inside a Filters form: a native disclosure whose content is a list of checkboxes, or a PriceRange for the price filter.

- Use when: inside the groups part of Filters (Filters renders it; call it directly only in a custom groups part).
- Do not use when: outside a GET form inside an `rp-live` root; the controls would submit nothing.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `FilterGroup` | `blocks/filter-group.liquid` + `snippets/rp-filter-group.liquid` | `details` | `rp-filter-group` | none | yes | none |
| trigger | printed by root | same | `summary` | `rp-filter-group-trigger` | none | yes | none |
| count | printed by root | same | `span` | `rp-filter-group-count` | none | when at least one value is active | none |
| content | printed by root | same | `div` | `rp-filter-group-content` | none | yes | none |
| values | printed by root | same | `ul` | `rp-filter-group-values` | none | for type `list` | none |
| value | printed by root | same | `label` | `rp-filter-group-value` | none | one per value | none |
| value label | printed by root | same | `span` | `rp-filter-group-value-label` | none | one per value | none |
| value count | printed by root | same | `span` | `rp-filter-group-value-count` | none | one per value | none |

Nesting rules: root children in order: trigger, content. Trigger: the filter label text, then count. Content: for `list` one values `ul` with one `li` per value, each `li` containing one value `label`; for `price_range` one PriceRange. Value `label` children in order: the Checkbox input, an optional Swatch, value label, value count. The root MUST be inside a `<form method="get">`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `filter` | `filter` | object | `RippleFilter` / Liquid `filter` drop | none | yes | no | every part |
| `open` | `open` | boolean | `true false` | `true` | no | no | `open` on root |

### Content model

`none`.

### HTML contract

Fixture `default` (`filter`: the `Availability` filter of `filters.basic`):

```html
<details class="rp-filter-group" open>
  <summary class="rp-filter-group-trigger">Availability<span class="rp-filter-group-count">1<span class="rp-visually-hidden"> selected</span></span></summary>
  <div class="rp-filter-group-content">
    <ul class="rp-filter-group-values">
      <li><label class="rp-filter-group-value"><input class="rp-checkbox" type="checkbox" name="filter.v.availability" value="1" checked><span class="rp-filter-group-value-label">In stock</span><span class="rp-filter-group-value-count">(8)</span></label></li>
      <li><label class="rp-filter-group-value"><input class="rp-checkbox" type="checkbox" name="filter.v.availability" value="0"><span class="rp-filter-group-value-label">Out of stock</span><span class="rp-filter-group-value-count">(2)</span></label></li>
    </ul>
  </div>
</details>
```

Fixture `price` (`filter`: the `Price` filter of `filters.basic`):

```html
<details class="rp-filter-group" open>
  <summary class="rp-filter-group-trigger">Price<span class="rp-filter-group-count">1<span class="rp-visually-hidden"> selected</span></span></summary>
  <div class="rp-filter-group-content">
    <div class="rp-price-range">
      <label class="rp-price-range-field"><span class="rp-price-range-label">From</span><input class="rp-input" type="number" data-size="md" name="filter.v.price.gte" min="0" step="any" inputmode="decimal"></label>
      <label class="rp-price-range-field"><span class="rp-price-range-label">To</span><input class="rp-input" type="number" data-size="md" name="filter.v.price.lte" min="0" step="any" inputmode="decimal" value="50"></label>
    </div>
  </div>
</details>
```

Fixture `swatch-disabled` (`filter`: label `Color`; values `Blue` name `filter.v.option.color` value `Blue` count 3 not active swatch colour `#1d4ed8`; `Sand` value `Sand` count 0 not active swatch colour `#d6c7a1`; `open`: false):

```html
<details class="rp-filter-group">
  <summary class="rp-filter-group-trigger">Color</summary>
  <div class="rp-filter-group-content">
    <ul class="rp-filter-group-values">
      <li><label class="rp-filter-group-value"><input class="rp-checkbox" type="checkbox" name="filter.v.option.color" value="Blue"><span class="rp-swatch" data-size="md" data-radius="full" aria-hidden="true" style="--rp-swatch-fill:#1d4ed8"></span><span class="rp-filter-group-value-label">Blue</span><span class="rp-filter-group-value-count">(3)</span></label></li>
      <li><label class="rp-filter-group-value"><input class="rp-checkbox" type="checkbox" name="filter.v.option.color" value="Sand" disabled><span class="rp-swatch" data-size="md" data-radius="full" aria-hidden="true" style="--rp-swatch-fill:#d6c7a1"></span><span class="rp-filter-group-value-label">Sand</span><span class="rp-filter-group-value-count">(0)</span></label></li>
    </ul>
  </div>
</details>
```

Rules: the count part shows the number of active values (for a price range: `1` when `min` or `max` is set), and is not printed when that number is 0. A checkbox is `disabled` when its `count` is 0 and it is not active (an active value with count 0 stays enabled so that it can be removed). The value count text is the count in parentheses.

Further required fixtures: `class` (root class `rp-filter-group custom-a custom-b`); `escaping` (filter label `Say "hi" & <go>`).

Host-owned regions and masks: none.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `open` | root | server, then the browser | the disclosure is open | present when `open` is true |
| `checked` | checkbox | server, then the browser | the value is active | present when active |
| `disabled` | checkbox | server | count is 0 and not active | present or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None of its own. The native `<details>` opens and closes. A checkbox `change` is handled by the enclosing `rp-live` (Filters behaviour 1).
2. After a refresh the group is re-rendered with the server's `open` value; a group the buyer closed re-opens when `open` is true. This is accepted in V1.

### Behaviour without JavaScript

The disclosure works natively. Checkboxes are submitted by the form's `Apply filters` button.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: native disclosure containing native checkboxes; `checkPattern`: none.
- Accessible name: summary text (filter label plus `<n> selected`); each checkbox is named by its wrapping label: value label followed by the count text, for example `In stock (8)`. The Swatch is `aria-hidden`.
- Focus: summary, then each enabled checkbox, in DOM order.
- Announcements: None.

| Key | Action |
|---|---|
| Enter, Space on the summary | opens or closes the group |
| Space on a checkbox | toggles the value |

### Styling

- File: `components/filter-group/filter-group.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-border`, `--color-foreground`, `--color-muted-foreground`, `--color-primary`, `--color-primary-foreground`, `--radius-full`, `--text-sm`, `--text-xs`, `--font-weight-medium`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-filter-group-gap` | `calc(var(--spacing) * 2)` | space between values, and between the parts of a value |
| `--rp-filter-group-padding` | `calc(var(--spacing) * 3)` | block padding of trigger and content |

| Modifier selector | Sets |
|---|---|
| `.rp-filter-group[open]` | `--rp-filter-group-chevron-rotate: 180deg` |

Required rules: root `border-block-end: 1px solid var(--color-border)`; trigger `display: flex; align-items: center; justify-content: space-between; cursor: pointer; list-style: none; min-block-size: calc(var(--spacing) * 11)`, with `::-webkit-details-marker { display: none }` and a chevron drawn in `::after` rotated by `var(--rp-filter-group-chevron-rotate, 0deg)`; values `list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--rp-filter-group-gap)`; value `display: flex; align-items: center; gap: var(--rp-filter-group-gap); min-block-size: calc(var(--spacing) * 6)`; `.rp-filter-group-value:has(:disabled) { color: var(--color-muted-foreground) }`; count `min-inline-size: 1.25rem; border-radius: var(--radius-full); background: var(--color-primary); color: var(--color-primary-foreground); font-size: var(--text-xs); text-align: center`.

### Host notes

- HTML: copy the contract.
- React: `FilterGroup(props: { filter: RippleFilter; open?: boolean; strings?: { selected?: string }; className?: string })`. No hook. `defaultChecked={value.active}`; `open={open}` is printed as an initial attribute only (uncontrolled `<details>`).
- Remix: None.
- Liquid: `filter.type == 'price_range'` renders `rp-price-range`; every other type renders the values list from `filter.values` (`value.param_name`, `value.value`, `value.label`, `value.count`, `value.active`, `value.swatch.color`, `value.swatch.image`). Active count: `filter.active_values.size`, or `1` for a price range when `filter.min_value.value != blank or filter.max_value.value != blank`. No schema settings. Locale key: `ripple.filter-group.selected` = `selected`.

```tsx
<FilterGroup filter={filter} />
```

```liquid
{% render 'rp-filter-group', filter: filter, open: true %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP104 (`filter`), RP110. Manifest `rules[]`: `filter-group-in-get-form` (`requires-ancestor`, selector `:scope`, target `form[method="get"]`; "A FilterGroup is outside a GET form; its checkboxes submit nothing."); `filter-group-labelled-values` (`forbids-descendant`, selector `.rp-filter-group-values`, target `input:not(label input)`; "A filter checkbox is not inside a label.").

### Acceptance tests

1. Tier 2: `default`, `price`, `swatch-disabled`, `class`, `escaping` are canonical-equal in all four hosts.
2. Tier 5: the accessible name of the first checkbox of `default` is `In stock (8)`; the summary's is `Availability 1 selected`.
3. Tier 5: in `swatch-disabled` the `Sand` checkbox is disabled and is not part of the form's submitted data.
4. Tier 6: with scripting disabled, clicking the summary toggles the content.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/snippets/filter-group.liquid`, `ripple/theme/snippets/filter-value.liquid` (details per filter, checkbox per value, count, swatch); Liquid `filter_value` drop (Shopify docs tool, this session).
- UNVERIFIED: how a Liquid filter of type `boolean` exposes its value (the binding treats it as a list through `filter.values`; if `filter.values` is empty for `boolean`, doc 14 MUST switch that branch to `filter.true_value`).

### Fallback (SPIKE-nn)

None.

---
