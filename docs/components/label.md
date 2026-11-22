# Label

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `label` |
| Kind | `static` |
| Category | `forms` |
| Custom elements | none |
| Root element and class | `label` `.rp-label` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A native `<label>` for one form control.

- Use when: labelling a control outside a Field, or wrapping a control and its text.
- Do not use when: inside a Field (use FieldLabel, which prints this contract with the derived `for`), or for a group caption (use RadioGroupLegend).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Label` | `blocks/label.liquid` (markup in `snippets/rp-label.liquid`) | `label` | `rp-label` | none | yes | none |

Nesting rules: either `htmlFor` is set, or the label wraps exactly one form control. MUST NOT be inside `<a>` or `<button>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `htmlFor` | `html_for` | id | the id of a form control | none (omitted) | no | no | `for` |

### Content model

`text` - phrasing content; MAY contain one form control when `htmlFor` is unset.

### HTML contract

Fixture `default` (`htmlFor="email"`; children `Email`):

```html
<label class="rp-label" for="email">Email</label>
```

Fixture `wrapping` (no props; children a Checkbox then text):

```html
<label class="rp-label"><input class="rp-checkbox" type="checkbox" name="terms" value="1">I agree to the terms</label>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{ "htmlFor": "email" }` | `Email` |
| `wrapping` | `{}` | `<input class="rp-checkbox" type="checkbox" name="terms" value="1">I agree to the terms` |
| `class` | `{ "htmlFor": "email", "class": "custom-a custom-b" }` | `Email` |
| `escaping` | `{ "htmlFor": "Say \"hi\" & <go>" }` | `Email` |

Host-owned regions and masks: None.

### State and attributes

None.

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional: clicking the label focuses or toggles its control (native).

### Events, commands and methods

None.

### Accessibility

- Pattern: native `<label>`; `checkPattern`: none.
- Accessible name: it IS the name of its control.
- Focus: not focusable; activating it moves focus to the control.
- Announcements: None.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/label/label.css` (layer `rp.components`).
- Tokens used: `--text-sm`, `--text-sm--line-height`, `--font-weight-medium`, `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-label-font-size` | `var(--text-sm)` | font size |
| `--rp-label-font-weight` | `var(--font-weight-medium)` | font weight |

| Modifier selector | Sets |
|---|---|
| none | |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-label` | `display: inline-flex; align-items: center; gap: calc(var(--spacing) * 2); margin: 0; padding: 0; font-size: var(--rp-label-font-size); line-height: var(--text-sm--line-height); font-weight: var(--rp-label-font-weight); cursor: default` |

### Host notes

- HTML: None.
- React: `export function Label(props: LabelProps)`; generated; JSX prop `htmlFor`.
- Remix: prints `for` (lowercase attribute spelling).
- Liquid: `{% block 'label', html_for: 'email' %}Email{% endblock %}`. Schema settings: none. Locale keys: `ripple.label.name`.

```tsx
<Label htmlFor="email">Email</Label>
```

```liquid
{% block 'label', html_for: 'email' %}Email{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4, plus RP114 (the `for` target exists). Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: fixture `default` next to `<input id="email">`: clicking the label focuses the input; the input's accessible name is `Email`.
3. Tier 5: in fixture `wrapping`, clicking the text toggles the checkbox.
4. Tier 5: fixture `default` computes `font-size` 14 px and `font-weight: 500`.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` D-014, section 6.4 (`htmlFor` renders `for`); `02-html-contract.md` M-4 row 6.
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
