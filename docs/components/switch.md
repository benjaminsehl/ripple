# Switch

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `switch` |
| Kind | `static` |
| Category | `forms` |
| Custom elements | none |
| Root element and class | `input[type="checkbox"][role="switch"]` `.rp-switch` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A native checkbox presented as an on/off switch (`role="switch"`). It submits like a checkbox.

- Use when: a setting reads as on or off ("Subscribe and save", "In stock only").
- Do not use when: the choice is an agreement or one of a list (use Checkbox).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Switch` | `blocks/switch.liquid` | `input` | `rp-switch` | none | yes | inside a Field: `id` equals the Field's `id` |

Nesting rules: none. A Switch MUST have a label: a Field with `orientation="horizontal"`, a wrapping Label, or `ariaLabel`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `name` | `name` | string | form field name | none (omitted) | no | no | `name` |
| `value` | `value` | string | value submitted when on | none (omitted; the browser then submits `on`) | no | no | `value` |
| `defaultChecked` | `default_checked` | boolean | `true false` | `false` | no | no | `checked` |
| `required` | `required` | boolean | `true false` | `false` | no | no | `required` |
| `disabled` | `disabled` | boolean | `true false` | `false` | no | no | `disabled` |
| `describedBy` | `described_by` | string | space-separated ids | none (omitted) | no | no | `aria-describedby` |
| `ariaLabel` | `aria_label` | string | text | none (omitted) | no | no | `aria-label` |

`type="checkbox"` and `role="switch"` are always printed and are not props.

### Content model

`none` - `<input>` is void.

### HTML contract

Fixture `default` (no props):

```html
<input class="rp-switch" type="checkbox" role="switch">
```

Fixture `on` (`id="subscribe"`, `name="subscribe"`, `value="1"`, `defaultChecked`):

```html
<input class="rp-switch" type="checkbox" id="subscribe" name="subscribe" value="1" checked role="switch">
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | absent |
| `on` | `{ "id": "subscribe", "name": "subscribe", "value": "1", "defaultChecked": true }` | absent |
| `disabled-labelled` | `{ "name": "stock", "required": true, "disabled": true, "describedBy": "stock-hint", "ariaLabel": "In stock only" }` | absent |
| `class` | `{ "class": "custom-a custom-b" }` | absent |
| `escaping` | `{ "name": "Say \"hi\" & <go>" }` | absent |

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `checked` | root | server | `defaultChecked` is true | present, or absent |
| `required`, `disabled` | root | server | the prop is true | present, or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional: native toggle; submits `name=value` when on.

### Events, commands and methods

None.

### Accessibility

- Pattern: native checkbox with `role="switch"` (the one `role="switch"` allowed by `02-html-contract.md` PE-3); `checkPattern`: none. The browser exposes the checked state; the server MUST NOT print `aria-checked`.
- Accessible name: from the associated `<label>` or `ariaLabel`; REQUIRED (RP202).
- Focus: native.
- Announcements: None.

| Key | Action |
|---|---|
| Space | toggles (native) |

### Styling

- File: `components/switch/switch.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-input`, `--color-background`, `--color-primary`, `--color-primary-foreground`, `--rp-duration-fast`, `--ease-out`, `--rp-dir`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-switch-width` | `calc(var(--spacing) * 11)` | inline size (44 px) |
| `--rp-switch-height` | `calc(var(--spacing) * 6)` | block size (24 px) |

| Modifier selector | Sets |
|---|---|
| none | |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-switch` | custom properties: the two public ones above; `--_bg: var(--color-input); --_fg: var(--color-background); --_border: transparent; --_thumb: calc(var(--rp-switch-height) - 2px * 3); --_travel: 0`. Declarations: `position: relative; display: inline-block; flex-shrink: 0; inline-size: var(--rp-switch-width); block-size: var(--rp-switch-height); margin: 0; padding: 0; border: 1px solid var(--_border); border-radius: 9999px; background-color: var(--_bg); vertical-align: middle; appearance: none; cursor: pointer` |
| STATES | `.rp-switch::after` | `content: ""; position: absolute; inset-block-start: 2px; inset-inline-start: 2px; inline-size: var(--_thumb); block-size: var(--_thumb); border-radius: 9999px; background-color: var(--_fg); translate: calc(var(--_travel) * var(--rp-dir)) 0` |
| STATES | `.rp-switch:checked` | `--_travel: calc(var(--rp-switch-width) - var(--rp-switch-height)); background-color: var(--color-primary)` |
| STATES | `.rp-switch:checked::after` | `background-color: var(--color-primary-foreground)` |
| STATES | `.rp-switch:disabled` | `opacity: 0.5; cursor: not-allowed` |
| MOTION | `.rp-switch` | `transition: background-color var(--rp-duration-fast) var(--ease-out)` |
| MOTION | `.rp-switch::after` | `transition: translate var(--rp-duration-fast) var(--ease-out)` |
| ENVIRONMENT | `.rp-switch` inside `@media (forced-colors: active)` | `appearance: auto; inline-size: var(--rp-switch-height)` |

The `:checked` rule sets the private variable `--_travel` in a STATES row: a state, not a prop, changes it, so it cannot be a MODIFIERS rule. Thumb size at default dials: 18 px; travel: 20 px, mirrored in right-to-left by `--rp-dir`.

### Host notes

- HTML: None.
- React: `export function Switch(props: SwitchProps)`; generated.
- Remix: None.
- Liquid: `{% block 'switch', id: 'subscribe', name: 'subscribe', value: '1' %}{% endblock %}`. Schema settings: none. Locale keys: `ripple.switch.name`.

```tsx
<Field id="subscribe" orientation="horizontal">
  <FieldControl><Switch id="subscribe" name="subscribe" value="1" /></FieldControl>
  <FieldLabel field="subscribe">Subscribe and save</FieldLabel>
</Field>
```

```liquid
{% block 'field', id: 'subscribe', orientation: 'horizontal' %}
  {% block 'field-control' %}{% block 'switch', id: 'subscribe', name: 'subscribe', value: '1' %}{% endblock %}{% endblock %}
  {% block 'field-label', field: 'subscribe' %}Subscribe and save{% endblock %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4, plus RP202, RP114. RP115 MUST NOT flag `role="switch"` on `input[type="checkbox"].rp-switch`. Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: fixture `default` has a bounding box of 44 by 24 px; the accessibility tree role is `switch`, state unchecked; fixture `on` is checked and computes `background-color` equal to the computed `--color-primary`.
3. Tier 5: Space toggles the `checked` property; with `dir="rtl"` the thumb of fixture `on` is at the inline end (its bounding box left edge is within 3 px of the root's left edge).
4. Tier 6: fixture `on` in a GET form submits `subscribe=1` with JavaScript disabled.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` D-007 and D-014 (Switch is `<input type="checkbox" role="switch">`); `04-elements.md` section 10.12; `02-html-contract.md` PE-3.
- UNVERIFIED: `::after` on a checkbox input in WebKit and Gecko (SPIKE-06, tier 9).

### Fallback (SPIKE-06)

If a pseudo-element on a checkbox input does not render in WebKit or Gecko, the thumb is drawn with a background instead: delete both `::after` rules; add to the root rule `background-image: radial-gradient(circle closest-side, var(--_fg) 0 80%, transparent 84%); background-repeat: no-repeat; background-size: var(--rp-switch-height) 100%; background-position: var(--_position) 50%` with `--_position: 0%` in the root rule and `--_position: 100%` in the `:checked` rule, and add a STATES rule `.rp-switch:dir(rtl)` that swaps the two positions. The contract does not change.

---
