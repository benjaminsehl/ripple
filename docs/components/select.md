# Select

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `select` |
| Kind | `static` |
| Category | `forms` |
| Custom elements | none |
| Root element and class | `select` `.rp-select` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A native single-choice `<select>`. The options are plain `<option>` elements written by the caller.

- Use when: choosing one of more than five options, or a country, a sort order, a quantity from a list.
- Do not use when: there are five options or fewer and space allows (use RadioGroup), or the options need rich content (there is no custom listbox in V1).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Select` | `blocks/select.liquid` | `select` | `rp-select` | none | yes | inside a Field: `id` equals the Field's `id` |

Nesting rules: children MUST be `<option>` and `<optgroup>` elements only. `multiple` is not supported.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `name` | `name` | string | form field name | none (omitted) | no | no | `name` |
| `autoComplete` | `auto_complete` | string | an `autocomplete` token list | none (omitted) | no | no | `autocomplete` |
| `required` | `required` | boolean | `true false` | `false` | no | no | `required` |
| `disabled` | `disabled` | boolean | `true false` | `false` | no | no | `disabled` |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` |
| `invalid` | `invalid` | boolean | `true false` | `false` | no | no | `aria-invalid="true"` |
| `describedBy` | `described_by` | string | space-separated ids | none (omitted) | no | no | `aria-describedby` |
| `ariaLabel` | `aria_label` | string | text | none (omitted) | no | no | `aria-label` |
| `rpField` | `rp_field` | enum | `merchandise-id quantity line-id selling-plan note discount-code` | none (omitted) | no | no | `data-rp-field="<value>"`; an invalid value prints NO attribute (there is no default) |
| `formId` | `form_id` | id | id of a `<form>` in the same document | none (omitted) | no | no | `form` |

`rpField` and `formId` have the meaning stated under Input: `rpField` prints `data-rp-field` (D-043 as amended) and MUST NOT be replaced by rest props or `attributes`; `formId` prints the native `form` attribute. In reference HTML `form` is printed after the other native attributes and `data-rp-field` is printed last (FC-3).
| `defaultValue` | (none; manifest `hosts: ["react"]`) | string | the `value` of the option selected initially | none | no | no | React only: passed to `<select defaultValue>`; React then prints `selected` on the matching `<option>`. In the `html`, `remix` and `liquid` hosts the caller writes `selected` on the `<option>` |

The initial selection is expressed in the contract by the `selected` attribute on one `<option>`. No host prints `aria-selected`.

### Content model

`flow` - restricted to `<option>` and `<optgroup>` elements.

### HTML contract

Fixture `default` (no props; children two options):

```html
<select class="rp-select" data-size="md"><option value="ca">Canada</option><option value="us">United States</option></select>
```

Fixture `sort` (`id="sort"`, `name="sort_by"`, `size="sm"`, `ariaLabel="Sort by"`; the second option selected):

```html
<select class="rp-select" id="sort" name="sort_by" data-size="sm" aria-label="Sort by"><option value="manual">Featured</option><option value="price-ascending" selected>Price, low to high</option></select>
```

| Fixture | `props` | `children` | `hosts` |
|---|---|---|---|
| `default` | `{}` | `<option value="ca">Canada</option><option value="us">United States</option>` | all |
| `sort` | `{ "id": "sort", "name": "sort_by", "size": "sm", "ariaLabel": "Sort by" }` | `<option value="manual">Featured</option><option value="price-ascending" selected>Price, low to high</option>` | `html`, `remix`, `liquid` |
| `sort-react` | `{ "id": "sort", "name": "sort_by", "size": "sm", "ariaLabel": "Sort by", "defaultValue": "price-ascending" }` | `<option value="manual">Featured</option><option value="price-ascending">Price, low to high</option>` | `react` (reference HTML is identical to `sort`) |
| `required-invalid` | `{ "name": "country", "autoComplete": "country", "required": true, "invalid": true, "describedBy": "country-error", "size": "lg" }` | `<option value="">Choose a country</option><option value="ca">Canada</option>` | all |
| `disabled` | `{ "name": "country", "disabled": true }` | `<option value="ca">Canada</option>` | all |
| `class` | `{ "class": "custom-a custom-b" }` | as `default` | all |
| `invalid-enum-falls-back` | `{ "size": "bogus" }` (output `data-size="md"`) | as `default` | all |
| `commerce-field` | `{ "name": "sellingPlanId", "rpField": "selling-plan", "formId": "buy-form", "ariaLabel": "Delivery frequency" }` (output `<select class="rp-select" name="sellingPlanId" form="buy-form" data-size="md" aria-label="Delivery frequency" data-rp-field="selling-plan"><option value="">One-time purchase</option><option value="1">Every month</option></select>`) | `<option value="">One-time purchase</option><option value="1">Every month</option>` | all |
| `invalid-rp-field` | `{ "rpField": "bogus" }` (output equals fixture `default`: no `data-rp-field`) | as `default` | all |
| `escaping` | `{ "name": "Say \"hi\" & <go>" }` | as `default` | all |

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `selected` | one `<option>` child | caller (React: React, from `defaultValue`) | an option is selected initially | present on one option, or on none |
| `required`, `disabled` | root | server | the prop is true | present, or absent |
| `aria-invalid` | root | server | `invalid` is true | `true`, or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None. A Select that must apply its value without a submit button is a commerce concern (SortSelect inside `rp-live`, `11-components-commerce.md`).

### Behaviour without JavaScript

Fully functional: native picker; submits with its form under `name`.

### Events, commands and methods

None.

### Accessibility

- Pattern: native `<select>`; `checkPattern`: none.
- Accessible name: from the associated `<label>` or `ariaLabel`; REQUIRED (RP202).
- Focus: native.
- Announcements: None.

| Key | Action |
|---|---|
| ArrowUp, ArrowDown | change the selected option (native) |
| Space, Enter | open the picker (native, platform dependent) |

### Styling

- File: `components/select/select.css` (layer `rp.components`).
- Tokens used: as Input.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-select-height` | `var(--spacing-control-md)` | minimum block size |
| `--rp-select-px` | `calc(var(--spacing) * 3)` | inline padding at the start |
| `--rp-select-radius` | `var(--radius-field)` | corner radius |
| `--rp-select-font-size` | `var(--text-base)` | font size |

| Modifier selector | Sets |
|---|---|
| `.rp-select[data-size="sm"]` | `--rp-select-height: var(--spacing-control-sm); --rp-select-px: calc(var(--spacing) * 2.5)` |
| `.rp-select[data-size="lg"]` | `--rp-select-height: var(--spacing-control-lg); --rp-select-px: calc(var(--spacing) * 4)` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-select` | custom properties: the four public ones above; `--_bg: var(--color-background); --_fg: var(--color-foreground); --_border: var(--color-input); --_arrow-x: calc(100% - 1em); --_arrow-x2: calc(100% - 1em + 0.35em)`. Declarations: `display: block; inline-size: 100%; min-inline-size: 0; min-block-size: var(--rp-select-height); margin: 0; padding-block: 0; padding-inline-start: var(--rp-select-px); padding-inline-end: 2.5em; border: 1px solid var(--_border); border-radius: var(--rp-select-radius); background-color: var(--_bg); background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%); background-position: var(--_arrow-x) 50%, var(--_arrow-x2) 50%; background-size: 0.35em 0.35em; background-repeat: no-repeat; color: var(--_fg); font-family: inherit; font-size: var(--rp-select-font-size); line-height: 1.25; appearance: none; cursor: pointer` |
| STATES | `.rp-select:hover` | `border-color: var(--color-foreground)` |
| STATES | `.rp-select:disabled` | `opacity: 0.5; cursor: not-allowed` |
| STATES | `.rp-select:is([aria-invalid="true"], :user-invalid)` | `border-color: var(--color-destructive)` |
| STATES | `.rp-select:dir(rtl)` | `--_arrow-x: 1em; --_arrow-x2: calc(1em - 0.35em)` |
| MOTION | `.rp-select` | `transition: border-color var(--rp-duration-fast) var(--ease-out)` |

The chevron is drawn with two gradients in `currentColor`, so it follows the text colour and needs no image. `background-position` is a physical property with no logical form; the `:dir(rtl)` rule moves the chevron to the inline end in right-to-left (this rule sets custom properties in a STATES row; the CSS linter accepts `:dir(rtl)`, D-105 item 2).

### Host notes

- HTML: None.
- React: `export function Select(props: SelectProps)`; generated; has the extra prop `defaultValue`. Writing `selected` on an `<option>` in React logs a development warning; use `defaultValue`.
- Remix: None; `selected` on `<option>` is printed unchanged.
- Liquid: `{% block 'select', name: 'country' %}<option value="ca">Canada</option>{% endblock %}`; the caller prints `selected` with `{% if %}`. Params `rp_field`, `form_id` as Input. `{{ attributes }}` is printed LAST in the opening tag (D-035). Schema settings: `size` (label keys of section 0.5). Locale keys: `ripple.select.name`.

```tsx
<Select name="sort_by" ariaLabel="Sort by" defaultValue="price-ascending">
  <option value="manual">Featured</option>
  <option value="price-ascending">Price, low to high</option>
</Select>
```

```liquid
{% block 'select', name: 'sort_by', aria_label: 'Sort by' %}
  {% for option in collection.sort_options %}
    <option value="{{ option.value | escape }}"{% if option.value == collection.sort_by %} selected{% endif %}>{{ option.name | escape }}</option>
  {% endfor %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4 (RP101 reports a literal `rpField` outside its list), plus RP202 and RP114 (`aria-describedby` and `form` targets exist). Manifest `rules[]` (reported by RP113): `select-children`: kind `max-count`, selector `:scope > *:not(option):not(optgroup)`, count `0`. Message: "A Select has a child that is not option or optgroup." Fix: "Keep only option and optgroup elements inside Select."

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 2: fixtures `sort` (three hosts) and `sort-react` (React) produce canonically equal HTML, with `selected` on the second option.
3. Tier 5: `size` `sm`, `md`, `lg` give heights 36, 44 and 52 px; the element computes `appearance: none`; the chevron is visible (the computed `background-image` contains two gradients).
4. Tier 5: fixture `sort` has the `value` property `price-ascending` before any interaction.
5. Tier 6: fixture `sort` in a GET form submits `sort_by=price-ascending` with JavaScript disabled.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` D-014; `04-elements.md` section 10.10; `02-html-contract.md` section 3.4 (`selected` on `<option>`, written by the server).
- UNVERIFIED: Remix 3 printing the boolean attribute `selected` on `<option>` unchanged; decided by CA-4 on fixture `sort` (local test, no spike).

### Fallback (SPIKE-nn)

None.

---
