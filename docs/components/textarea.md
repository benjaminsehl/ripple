# Textarea

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `textarea` |
| Kind | `static` |
| Category | `forms` |
| Custom elements | none |
| Root element and class | `textarea` `.rp-textarea` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A native multi-line text input.

- Use when: collecting a message, an order note, gift text.
- Do not use when: one line is enough (use Input).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Textarea` | `blocks/textarea.liquid` | `textarea` | `rp-textarea` | none | yes | inside a Field: `id` equals the Field's `id` |

Nesting rules: none. A Textarea MUST have a label: a Field, a Label, or `ariaLabel`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `name` | `name` | string | form field name | none (omitted) | no | no | `name` |
| `defaultValue` | `default_value` | string | initial value | none | no | no | the TEXT CONTENT of the element, HTML-escaped (a `<textarea>` has no `value` attribute; exception to `02-html-contract.md` M-4 row 13) |
| `placeholder` | `placeholder` | string | text | none (omitted) | no | no | `placeholder` |
| `rows` | `rows` | number | a positive integer | `4` | no | no | `rows`; always printed |
| `required` | `required` | boolean | `true false` | `false` | no | no | `required` |
| `disabled` | `disabled` | boolean | `true false` | `false` | no | no | `disabled` |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` |
| `invalid` | `invalid` | boolean | `true false` | `false` | no | no | `aria-invalid="true"` |
| `describedBy` | `described_by` | string | space-separated ids | none (omitted) | no | no | `aria-describedby` |
| `ariaLabel` | `aria_label` | string | text | none (omitted) | no | no | `aria-label` |
| `rpField` | `rp_field` | enum | `merchandise-id quantity line-id selling-plan note discount-code` | none (omitted) | no | no | `data-rp-field="<value>"`; an invalid value prints NO attribute (there is no default) |
| `formId` | `form_id` | id | id of a `<form>` in the same document | none (omitted) | no | no | `form` |

`rpField` and `formId` have the meaning stated under Input: `rpField` prints `data-rp-field` (D-043 as amended) and MUST NOT be replaced by rest props or `attributes`; `formId` prints the native `form` attribute. In reference HTML `form` is printed after the other native attributes and `data-rp-field` is printed last (FC-3).

### Content model

`none` - the caller passes no children; the text content is `defaultValue`. Bindings MUST print no whitespace between the start tag, the value and the end tag (whitespace inside `<textarea>` is content and is compared verbatim).

### HTML contract

Fixture `default` (no props):

```html
<textarea class="rp-textarea" rows="4" data-size="md"></textarea>
```

Fixture `note` (`id="note"`, `name="note"`, `defaultValue="Leave at the door & ring <twice>"`, `placeholder="Order note"`, `rows=3`, `required`, `ariaLabel="Order note"`):

```html
<textarea class="rp-textarea" id="note" name="note" placeholder="Order note" rows="3" required data-size="md" aria-label="Order note">Leave at the door &amp; ring &lt;twice&gt;</textarea>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | absent |
| `note` | `{ "id": "note", "name": "note", "defaultValue": "Leave at the door & ring <twice>", "placeholder": "Order note", "rows": 3, "required": true, "ariaLabel": "Order note" }` | absent |
| `invalid-disabled` | `{ "name": "message", "size": "lg", "invalid": true, "describedBy": "message-error", "disabled": true }` | absent |
| `class` | `{ "class": "custom-a custom-b" }` | absent |
| `invalid-enum-falls-back` | `{ "size": "bogus" }` (output `data-size="md"`) | absent |
| `commerce-field` | `{ "name": "note", "rpField": "note", "formId": "cart-lines-form", "ariaLabel": "Order note" }` (output `<textarea class="rp-textarea" name="note" rows="4" form="cart-lines-form" data-size="md" aria-label="Order note" data-rp-field="note"></textarea>`) | absent |
| `invalid-rp-field` | `{ "rpField": "bogus" }` (output equals fixture `default`: no `data-rp-field`) | absent |
| `escaping` | `{ "name": "Say \"hi\" & <go>" }` | absent |

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `required`, `disabled` | root | server | the prop is true | present, or absent |
| `aria-invalid` | root | server | `invalid` is true | `true`, or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None. (React hydration re-sets the text of a `<textarea>` with an equal value; allowed by `REACT_HYDRATION_ALLOW`, `06-bindings.md` Q-10.)

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional: native editing; submits with its form under `name`.

### Events, commands and methods

None.

### Accessibility

- Pattern: native `<textarea>`; `checkPattern`: none.
- Accessible name: from the associated `<label>` or `ariaLabel`; REQUIRED (RP202).
- Focus: native.
- Announcements: None.

| Key | Action |
|---|---|
| Enter | inserts a line break (native) |

### Styling

- File: `components/textarea/textarea.css` (layer `rp.components`).
- Tokens used: as Input, without the control height tokens being used as a fixed height.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-textarea-min-height` | `calc(var(--spacing-control-md) * 2)` | minimum block size |
| `--rp-textarea-px` | `calc(var(--spacing) * 3)` | inline padding |
| `--rp-textarea-py` | `calc(var(--spacing) * 2.5)` | block padding |
| `--rp-textarea-radius` | `var(--radius-field)` | corner radius |
| `--rp-textarea-font-size` | `var(--text-base)` | font size |

| Modifier selector | Sets |
|---|---|
| `.rp-textarea[data-size="sm"]` | `--rp-textarea-min-height: calc(var(--spacing-control-sm) * 2); --rp-textarea-px: calc(var(--spacing) * 2.5); --rp-textarea-py: calc(var(--spacing) * 2)` |
| `.rp-textarea[data-size="lg"]` | `--rp-textarea-min-height: calc(var(--spacing-control-lg) * 2); --rp-textarea-px: calc(var(--spacing) * 4); --rp-textarea-py: calc(var(--spacing) * 3.5)` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-textarea` | custom properties: the five public ones above; `--_bg: var(--color-background); --_fg: var(--color-foreground); --_border: var(--color-input)`. Declarations: `display: block; inline-size: 100%; min-inline-size: 0; min-block-size: var(--rp-textarea-min-height); margin: 0; padding-block: var(--rp-textarea-py); padding-inline: var(--rp-textarea-px); border: 1px solid var(--_border); border-radius: var(--rp-textarea-radius); background-color: var(--_bg); color: var(--_fg); font-family: inherit; font-size: var(--rp-textarea-font-size); line-height: var(--text-base--line-height); resize: vertical; appearance: none` |
| STATES | `.rp-textarea::placeholder` | `color: var(--color-muted-foreground); opacity: 1` |
| STATES | `.rp-textarea:hover` | `border-color: var(--color-foreground)` |
| STATES | `.rp-textarea:disabled` | `opacity: 0.5; cursor: not-allowed` |
| STATES | `.rp-textarea:is([aria-invalid="true"], :user-invalid)` | `border-color: var(--color-destructive)` |
| MOTION | `.rp-textarea` | `transition: border-color var(--rp-duration-fast) var(--ease-out)` |

### Host notes

- HTML: None.
- React: `export function Textarea(props: TextareaProps)`; generated; `defaultValue` is passed to React as `defaultValue` (React prints it as text content).
- Remix: prints the value as the single text child of `<textarea>`.
- Liquid: the block prints `>{{ default_value | escape }}</textarea>` with no whitespace. `{% block 'textarea', name: 'note', default_value: cart.note, aria_label: note_label %}{% endblock %}`. Params `rp_field`, `form_id` as Input. `{{ attributes }}` is printed LAST in the opening tag (D-035). Schema settings: `size` (label keys of section 0.5). Locale keys: `ripple.textarea.name`.

```tsx
<Textarea name="note" defaultValue={cart.note} ariaLabel="Order note" />
```

```liquid
{% block 'textarea', name: 'note', default_value: cart.note, aria_label: 'Order note' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4 (RP101 reports a literal `rpField` outside its list), plus RP202 and RP114 (`aria-describedby` and `form` targets exist). Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 2: fixture `note` in all four hosts has a text content of exactly `Leave at the door & ring <twice>` (the element's `value` property) with no leading or trailing whitespace; fixture `default` has an empty `value`.
3. Tier 5: fixture `default` is at least 88 px high and 100% of its parent's width; it computes `resize: vertical`.
4. Tier 6: fixture `note` inside a GET form submits `note=Leave+at+the+door+%26+ring+%3Ctwice%3E` with JavaScript disabled.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` D-014, section 6.3; `02-html-contract.md` K-12 and its exception for verbatim text in `textarea` (accepted, D-075: `textarea` content is compared verbatim); `06-bindings.md` Q-10.
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
