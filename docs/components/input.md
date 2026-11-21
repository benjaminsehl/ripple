# Input

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `input` |
| Kind | `static` |
| Category | `forms` |
| Custom elements | none |
| Root element and class | `input` `.rp-input` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A native single-line text input.

- Use when: collecting text, email, phone, URL, password, search terms, a number or a date.
- Do not use when: collecting a cart or product quantity (use QuantityInput), multi-line text (use Textarea), a choice (use Select, Checkbox, RadioGroup, Switch).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Input` | `blocks/input.liquid` | `input` | `rp-input` | none | yes | inside a Field: `id` equals the Field's `id` |

Nesting rules: none. An Input MUST have a label: a Field, a Label, or `ariaLabel`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `type` | `type` | enum | `text email tel url password search number date` | `text` | no | no | `type` |
| `name` | `name` | string | form field name | none (omitted) | no | no | `name` |
| `defaultValue` | `default_value` | string | initial value | none (omitted) | no | no | `value` |
| `placeholder` | `placeholder` | string | text | none (omitted) | no | no | `placeholder` |
| `autoComplete` | `auto_complete` | string | an `autocomplete` token list, for example `email`, `off`, `shipping postal-code` | none (omitted) | no | no | `autocomplete` |
| `min` | `min` | string | minimum (number or date) | none (omitted) | no | no | `min` |
| `max` | `max` | string | maximum (number or date) | none (omitted) | no | no | `max` |
| `step` | `step` | string | step | none (omitted) | no | no | `step` |
| `pattern` | `pattern` | string | a regular expression | none (omitted) | no | no | `pattern` |
| `required` | `required` | boolean | `true false` | `false` | no | no | `required` |
| `disabled` | `disabled` | boolean | `true false` | `false` | no | no | `disabled` |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` |
| `invalid` | `invalid` | boolean | `true false` | `false` | no | no | `aria-invalid="true"` |
| `describedBy` | `described_by` | string | space-separated ids | none (omitted) | no | no | `aria-describedby` |
| `ariaLabel` | `aria_label` | string | text | none (omitted) | no | no | `aria-label` |
| `rpField` | `rp_field` | enum | `merchandise-id quantity line-id selling-plan note discount-code` | none (omitted) | no | no | `data-rp-field="<value>"`; an invalid value prints NO attribute (there is no default) |
| `formId` | `form_id` | id | id of a `<form>` in the same document | none (omitted) | no | no | `form` |

`min`, `max` and `step` accept a number in TSX; it is printed with `String(n)`.

`rpField` marks the control's meaning in a commerce form so that commerce elements do not depend on field names (D-043 as amended; `00-decisions.md` section 4.4). Callers MUST NOT pass `data-rp-field` through rest props or `attributes`. `formId` prints the native `form` attribute (the name `form` is reserved in Liquid, D-020). In reference HTML `form` is printed after the other native attributes and `data-rp-field` is printed last (FC-3).

### Content model

`none` - `<input>` is void.

### HTML contract

Fixture `default` (no props):

```html
<input class="rp-input" type="text" data-size="md">
```

Fixture `email-invalid` (`id="email"`, `type="email"`, `name="email"`, `defaultValue="ada@"`, `placeholder="you@example.com"`, `autoComplete="email"`, `required`, `invalid`, `describedBy="email-error"`):

```html
<input class="rp-input" id="email" type="email" name="email" value="ada@" placeholder="you@example.com" autocomplete="email" required data-size="md" aria-invalid="true" aria-describedby="email-error">
```

Fixture `search` (`type="search"`, `name="q"`, `size="lg"`, `ariaLabel="Search"`):

```html
<input class="rp-input" type="search" name="q" data-size="lg" aria-label="Search">
```

Fixture `commerce-field` (`name="discountCode"`, `rpField="discount-code"`, `formId="cart-lines-form"`, `ariaLabel="Discount code"`):

```html
<input class="rp-input" type="text" name="discountCode" form="cart-lines-form" data-size="md" aria-label="Discount code" data-rp-field="discount-code">
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | absent |
| `email-invalid` | `{ "id": "email", "type": "email", "name": "email", "defaultValue": "ada@", "placeholder": "you@example.com", "autoComplete": "email", "required": true, "invalid": true, "describedBy": "email-error" }` | absent |
| `search` | `{ "type": "search", "name": "q", "size": "lg", "ariaLabel": "Search" }` | absent |
| `number-disabled` | `{ "type": "number", "name": "amount", "min": "1", "max": "10", "step": "1", "pattern": "[0-9]+", "size": "sm", "disabled": true }` | absent |
| `class` | `{ "class": "custom-a custom-b" }` | absent |
| `invalid-enum-falls-back` | `{ "type": "bogus" }` (output `type="text"`) | absent |
| `commerce-field` | `{ "name": "discountCode", "rpField": "discount-code", "formId": "cart-lines-form", "ariaLabel": "Discount code" }` | absent |
| `invalid-rp-field` | `{ "rpField": "bogus" }` (output equals fixture `default`: no `data-rp-field`) | absent |
| `escaping` | `{ "name": "Say \"hi\" & <go>" }` | absent |

The manifest `a11y.name` of Input, Textarea, Select, Checkbox and Switch is `label` ("receives its label from Field, Label or `ariaLabel`"); fixture lint check `a-2` skips the root of their fixtures (`02-html-contract.md` section 10, A-2).

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `value` | root | server | `defaultValue` is set | the value, or absent |
| `required`, `disabled` | root | server | the prop is true | present, or absent |
| `aria-invalid` | root | server | `invalid` is true | `true`, or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None. (React hydration re-writes `type`, `value` and `name` with equal values; allowed by `REACT_HYDRATION_ALLOW`, `06-bindings.md` Q-10.)

### Behaviour with JavaScript

None. The input is uncontrolled in every host (D-036).

### Behaviour without JavaScript

Fully functional: native editing, native constraint validation, submits with its form under `name`.

### Events, commands and methods

None.

### Accessibility

- Pattern: native `<input>`; `checkPattern`: none.
- Accessible name: from the associated `<label>` or `ariaLabel`; REQUIRED (RP202). `placeholder` is never the name.
- Focus: native. The focus ring comes from `base.css`.
- Announcements: None.
- The server MUST NOT print `aria-required` or `aria-disabled` (`02-html-contract.md` section 8).

| Key | Action |
|---|---|
| Enter | submits the form (native) |

### Styling

- File: `components/input/input.css` (layer `rp.components`).
- Tokens used: `--spacing-control-sm`, `--spacing-control-md`, `--spacing-control-lg`, `--spacing`, `--radius-field`, `--text-base`, `--color-input`, `--color-background`, `--color-foreground`, `--color-muted-foreground`, `--color-destructive`, `--rp-duration-fast`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-input-height` | `var(--spacing-control-md)` | minimum block size |
| `--rp-input-px` | `calc(var(--spacing) * 3)` | inline padding |
| `--rp-input-radius` | `var(--radius-field)` | corner radius |
| `--rp-input-font-size` | `var(--text-base)` | font size (16 px at every size, so that iOS does not zoom) |

| Modifier selector | Sets |
|---|---|
| `.rp-input[data-size="sm"]` | `--rp-input-height: var(--spacing-control-sm); --rp-input-px: calc(var(--spacing) * 2.5)` |
| `.rp-input[data-size="lg"]` | `--rp-input-height: var(--spacing-control-lg); --rp-input-px: calc(var(--spacing) * 4)` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-input` | custom properties: the four public ones above; `--_bg: var(--color-background); --_fg: var(--color-foreground); --_border: var(--color-input)`. Declarations: `display: block; inline-size: 100%; min-inline-size: 0; min-block-size: var(--rp-input-height); margin: 0; padding-block: 0; padding-inline: var(--rp-input-px); border: 1px solid var(--_border); border-radius: var(--rp-input-radius); background-color: var(--_bg); color: var(--_fg); font-family: inherit; font-size: var(--rp-input-font-size); line-height: 1.25; appearance: none` |
| STATES | `.rp-input::placeholder` | `color: var(--color-muted-foreground); opacity: 1` |
| STATES | `.rp-input:hover` | `border-color: var(--color-foreground)` |
| STATES | `.rp-input:disabled` | `opacity: 0.5; cursor: not-allowed` |
| STATES | `.rp-input:is([aria-invalid="true"], :user-invalid)` | `border-color: var(--color-destructive)` |
| MOTION | `.rp-input` | `transition: border-color var(--rp-duration-fast) var(--ease-out)` |

### Host notes

- HTML: None.
- React: `export function Input(props: InputProps)`; generated; `defaultValue` is passed to React as `defaultValue`; JSX props `autoComplete`, `aria-invalid`, `aria-describedby`.
- Remix: prints `value` from `defaultValue` and `autocomplete` (lowercase).
- Liquid: `{% block 'input', id: 'email', type: 'email', name: 'email' %}{% endblock %}`. Params `rp_field`, `form_id`. The `rp_field` guard prints the attribute only when the value is in the list (no fallback value). `{{ attributes }}` is printed LAST in the opening tag (D-035). Schema settings: `size` (label keys of section 0.5). Locale keys: `ripple.input.name`.

```tsx
<Input type="search" name="q" ariaLabel="Search" />
```

```liquid
{% block 'input', type: 'search', name: 'q', aria_label: 'Search' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none. An Input that holds a secret other than `type="password"` (a gift card code) SHOULD get `data-agent-secret` through rest props.

### Checker rules

Common rules of section 0.4 (RP101 reports a literal `rpField` outside its list), plus RP202 and RP114 (`aria-describedby` and `form` targets exist). Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: `size` `sm`, `md`, `lg` give heights 36, 44 and 52 px; every size computes `font-size` 16 px; in a 300 px parent the width is 300 px.
3. Tier 5: fixture `email-invalid` computes `border-color` equal to the computed `--color-destructive`; fixture `default` computes `border-color` equal to the computed `--color-input`.
4. Tier 2: fixture `default` prints no `value`, `name`, `required`, `disabled`, `form`, `data-rp-field` or `aria-*` attribute; fixture `invalid-rp-field` is canonically equal to fixture `default`.
5. Tier 6: fixture `email-invalid` inside `<form method="get" action="/x">` with the value `ada@example.com` submits `?email=ada%40example.com` with JavaScript disabled.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` D-014 as amended (item e), D-043 as amended (`rpField`), D-086, sections 4.4 (`data-rp-field`), 6.3 (`size` (controls)) and 6.4 (`formId`, `rpField`); `02-html-contract.md` section 8 (native controls row), PE-9; `06-bindings.md` Q-10.
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
