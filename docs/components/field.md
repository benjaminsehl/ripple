# Field

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `field` |
| Kind | `static` |
| Category | `forms` |
| Custom elements | none |
| Root element and class | `div` `.rp-field` |
| Liquid tier | `parts` |
| No-JS level | `full` |
| Requires `id` | yes |
| Depends on | `label`, `form-message` |
| Milestone | M1 |

### Purpose

A wrapper that lays out one form control with its label, description and error message, and fixes the ids that link them: the control has `id="<id>"`, the label has `for="<id>"`, the description is `<id>-description`, the error is `<id>-error` (D-014, D-020).

- Use when: any form control needs a visible label, a hint or an error.
- Do not use when: the control has no visible label (pass `ariaLabel` to the control), or for a group of radios (use RadioGroup, which has its own legend).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Field` | `blocks/field.liquid` | `div` | `rp-field` | none | yes | the root prints NO `id` attribute; the `id` prop names the control |
| label | `FieldLabel` | `blocks/field-label.liquid` | `label` | `rp-label rp-field-label` | none | yes | `for="<field>"` |
| control | `FieldControl` | `blocks/field-control.liquid` | `div` | `rp-field-control` | none | yes | none; it contains the one control, which the caller gives `id="<field>"` |
| description | `FieldDescription` | `blocks/field-description.liquid` | `p` | `rp-field-description` | none | no | `id="<field>-description"` |
| error | `FieldError` | `blocks/field-error.liquid` | `p` | `rp-form-message rp-field-error` | none | no | `id="<field>-error"` |

Nesting rules:

1. All four parts are direct children of the root. Order for `orientation="vertical"`: label, control, description, error. Order for `orientation="horizontal"`: control, label, description, error. The binding does not reorder; the caller writes them in this order.
2. The control part contains exactly ONE form control component: Input, Textarea, Select, Checkbox, Switch, or QuantityInput (`10-components-interactive.md`).
3. The caller MUST wire the control itself, because a part cannot read its parent (`02-html-contract.md` S-7): pass `id="<id>"`; pass `describedBy` listing `<id>-description` when a FieldDescription is rendered and `<id>-error` when a FieldError is rendered (space-separated, description first); pass `invalid` when a FieldError is rendered.
4. A FieldError MUST be rendered only when the server has an error for the control. An empty FieldError MUST NOT be rendered.

### Props

Root (`Field`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | the id of the control | none | yes | no | nothing (exception to FC-2: printing it would duplicate the control's id). It exists so that the checker and the fixture lint can verify that every part's `field` equals it |
| `orientation` | `orientation` | enum | `vertical horizontal` | `vertical` | no | no | `data-orientation` |

Label (`FieldLabel`), description (`FieldDescription`), error (`FieldError`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `field` | `field` | id | the root's `id` | none | yes | no | label: `for="<field>"`; description: `id="<field>-description"`; error: `id="<field>-error"` |

Control (`FieldControl`): no props other than `class` and rest props. Parts do not take `span` or `hidden`.

### Content model

`parts` - root: the four parts. Label: `text`. Control: exactly one form control. Description: `text`. Error: `text`.

### HTML contract

Fixture `default` (root `id="email"`; label, control with an Input):

```html
<div class="rp-field" data-orientation="vertical"><label class="rp-label rp-field-label" for="email">Email</label><div class="rp-field-control"><input class="rp-input" id="email" type="email" name="email" data-size="md"></div></div>
```

Fixture `invalid` (root `id="email"`; all four parts; the Input has `required`, `invalid`, `describedBy="email-description email-error"`):

```html
<div class="rp-field" data-orientation="vertical"><label class="rp-label rp-field-label" for="email">Email</label><div class="rp-field-control"><input class="rp-input" id="email" type="email" name="email" required data-size="md" aria-invalid="true" aria-describedby="email-description email-error"></div><p class="rp-field-description" id="email-description">We only use it for order updates.</p><p class="rp-form-message rp-field-error" id="email-error" data-tone="destructive" role="alert">Enter a valid email address.</p></div>
```

Fixture `horizontal` (root `id="gift"`, `orientation="horizontal"`; control with a Checkbox, then label):

```html
<div class="rp-field" data-orientation="horizontal"><div class="rp-field-control"><input class="rp-checkbox" type="checkbox" id="gift" name="gift" value="yes"></div><label class="rp-label rp-field-label" for="gift">This is a gift</label></div>
```

Fixture records (`parts` form):

| Fixture | Root `props` | `parts` (in order) |
|---|---|---|
| `default` | `{ "id": "email" }` | `label` `{ "field": "email" }` children `Email`; `control` children `<input class="rp-input" id="email" type="email" name="email" data-size="md">` |
| `invalid` | `{ "id": "email" }` | `label` `{ "field": "email" }` children `Email`; `control` children `<input class="rp-input" id="email" type="email" name="email" required data-size="md" aria-invalid="true" aria-describedby="email-description email-error">`; `description` `{ "field": "email" }` children `We only use it for order updates.`; `error` `{ "field": "email" }` children `Enter a valid email address.` |
| `horizontal` | `{ "id": "gift", "orientation": "horizontal" }` | `control` children `<input class="rp-checkbox" type="checkbox" id="gift" name="gift" value="yes">`; `label` `{ "field": "gift" }` children `This is a gift` |
| `class` | `{ "id": "email", "class": "custom-a custom-b" }` | as `default` |
| `invalid-enum-falls-back` | `{ "id": "email", "orientation": "bogus" }` (output `data-orientation="vertical"`) | as `default` |
| `escaping` | `{ "id": "email" }` | `label` `{ "field": "Say \"hi\" & <go>" }` children `Email`; `control` children `<input class="rp-input" type="email" name="email" data-size="md" aria-label="Email">` (this fixture's lint skips checks `n-9` and `a-3`) |

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `aria-invalid` | the control (not a Field part) | server, through the control's `invalid` prop | the server has an error | `true`, or absent |
| `aria-describedby` | the control | server, through the control's `describedBy` prop | a description or an error is rendered | the ids of the rendered parts, or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None. Validation is native constraint validation; server-side errors arrive as a new page with a FieldError.

### Behaviour without JavaScript

Fully functional: label click focuses the control; native validation bubbles appear on submit; server errors are printed in FieldError.

### Events, commands and methods

None.

### Accessibility

- Pattern: native `<label for>` plus `aria-describedby`; `checkPattern`: none.
- Accessible name: the control is named by the FieldLabel. REQUIRED.
- Focus: clicking the label focuses the control (native).
- Announcements: the FieldError has `role="alert"`; it is announced when the page that contains it loads.
- `aria-describedby` MUST list only ids of elements that are rendered; `aria-invalid="false"` MUST NOT be printed (`02-html-contract.md` section 8).

| Key | Action |
|---|---|
| none | none (the control's own keys) |

### Styling

- File: `components/field/field.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--text-sm`, `--text-sm--line-height`, `--color-muted-foreground`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-field-gap` | `calc(var(--spacing) * 1.5)` | gap between parts |

| Modifier selector | Sets |
|---|---|
| `.rp-field[data-orientation="horizontal"]` | `--_columns: auto minmax(0, 1fr); --_column: 2; --_align: center; --_gap-x: calc(var(--spacing) * 2)` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-field` | custom properties: `--rp-field-gap` as above; `--_columns: minmax(0, 1fr); --_column: 1; --_align: stretch; --_gap-x: 0`. Declarations: `display: grid; grid-template-columns: var(--_columns); align-items: var(--_align); row-gap: var(--rp-field-gap); column-gap: var(--_gap-x); min-inline-size: 0; margin: 0; padding: 0; border: 0` |
| PARTS | `.rp-field-label` | `min-inline-size: 0` |
| PARTS | `.rp-field-control` | `display: flex; align-items: center; min-inline-size: 0` |
| PARTS | `.rp-field-description` | `grid-column: var(--_column); margin: 0; font-size: var(--text-sm); line-height: var(--text-sm--line-height); color: var(--color-muted-foreground)` |
| PARTS | `.rp-field-error` | `grid-column: var(--_column)` |

In the horizontal orientation the control is placed in column 1 and the label in column 2 by grid auto-placement; description and error are forced into column 2.

### Host notes

- HTML: None.
- React: `export function Field(props: FieldProps)`, `FieldLabel`, `FieldControl`, `FieldDescription`, `FieldError` in `field.tsx`; generated; no hooks and no React context (`02-html-contract.md` S-7). `FieldLabel` renders the Label contract with `htmlFor={field}` and the extra class; `FieldError` renders the FormMessage contract with `tone="destructive"`, the derived id and the extra class.
- Remix: None.
- Liquid: five block files. `field-label` renders `{% render 'rp-label', html_for: field, class: 'rp-field-label', content: content %}`; `field-error` renders `{% render 'rp-form-message', id: error_id, tone: 'destructive', class: 'rp-field-error', content: content %}` where `error_id` is `field | append: '-error'`. Schema settings: `orientation` on `field`; none on the parts. Locale keys: `ripple.field.name`, `ripple.field.label_name`, `ripple.field.control_name`, `ripple.field.description_name`, `ripple.field.error_name`.

When a caller passes its own `class` to FieldLabel or FieldError, the output class is the embedded root class, then the part class, then the caller's classes: `rp-label rp-field-label custom`.

```tsx
<Field id="email">
  <FieldLabel field="email">Email</FieldLabel>
  <FieldControl>
    <Input id="email" type="email" name="email" required invalid describedBy="email-description email-error" />
  </FieldControl>
  <FieldDescription field="email">We only use it for order updates.</FieldDescription>
  <FieldError field="email">Enter a valid email address.</FieldError>
</Field>
```

```liquid
{% block 'field', id: 'email' %}
  {% block 'field-label', field: 'email' %}Email{% endblock %}
  {% block 'field-control' %}
    {% block 'input', id: 'email', type: 'email', name: 'email', required: true, invalid: true, described_by: 'email-description email-error' %}{% endblock %}
  {% endblock %}
  {% block 'field-description', field: 'email' %}We only use it for order updates.{% endblock %}
  {% block 'field-error', field: 'email' %}Enter a valid email address.{% endblock %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4, plus RP202 (a control inside a Field with no associated label) and RP114 (duplicate or unresolved ids). RP104 at layer H MUST NOT require an `id` attribute on the `.rp-field` element (the id is on the control); at layer S it requires the `id` argument. Manifest `rules[]`, all RP113 errors:

1. `field-one-control`: `.rp-field` contains exactly one `.rp-field-control`, which contains exactly one of `input`, `select`, `textarea` that is not `type="hidden"`, and that control has an `id`.
2. `field-label-for`: `.rp-field` contains exactly one `label.rp-field-label` whose `for` equals the control's `id`.
3. `field-describedby`: when `.rp-field` contains `#<control id>-description` or `#<control id>-error`, the control's `aria-describedby` contains that id; every id in the control's `aria-describedby` resolves in the document.
4. `field-invalid`: the control has `aria-invalid="true"` if and only if `.rp-field` contains `.rp-field-error`.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: in fixture `invalid` the accessibility tree gives the input the name `Email` and the description `We only use it for order updates. Enter a valid email address.`; clicking the label focuses the input.
3. Tier 5: in fixture `horizontal` the checkbox and the label are on one row (their vertical centres differ by at most 2 px) and the checkbox is before the label in the inline direction, also with `dir="rtl"`.
4. Tier 1: each of the four manifest rules has a failing sample in `components/field/field.test.ts` that produces exactly one RP113 finding with that rule id.
5. Tier 6: with JavaScript disabled, submitting a form that contains fixture `invalid` with an empty value shows the browser's native "required" validation and does not navigate.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` D-014 as amended (parts `label`, `control`, `description`, `error`; the `control` part is a wrapper `div`, TSX export `FieldControl`; the CALLER passes `id`, `describedBy` and `invalid` to the control; Field's `id` is the control's id and is not printed on the Field root), D-020 (suffixes `-description`, `-error`; prop `field`); `02-html-contract.md` section 8 (Field row), S-7; `ripple/docs/research/uisdk-web-elements.md` sections 1 and 9.1 (`ui-field` rewrites attributes at upgrade; rejected).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
