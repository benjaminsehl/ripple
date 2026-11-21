# FormMessage

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `form-message` |
| Kind | `static` |
| Category | `forms` |
| Custom elements | none |
| Root element and class | `p` `.rp-form-message` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A short message about a form or a control: an error, a success note or a hint, printed by the server in the response to a form post (`02-html-contract.md` PE-11). Commerce elements also fill an empty, hidden FormMessage with errors (D-045 item 4).

- Use when: reporting the outcome of a form submission next to the form, or an error for one control (through FieldError).
- Do not use when: the message concerns the whole page (use Banner), or is transient feedback for a script action (use `toast()`, `10-components-interactive.md`).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `FormMessage` | `blocks/form-message.liquid` (markup in `snippets/rp-form-message.liquid`) | `p` | `rp-form-message` | none (commerce components add `data-rp-part="error"` themselves) | yes | inside a Field: `<field>-error` (printed by FieldError) |

Nesting rules: none.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `tone` | `tone` | enum | `destructive success info warning muted` | `destructive` | no | no | `data-tone`; and `role`: `alert` when the tone is `destructive`, `status` for every other tone |

### Content model

`text` - phrasing content.

### HTML contract

Fixture `default` (no props; children `Enter a valid email address.`):

```html
<p class="rp-form-message" data-tone="destructive" role="alert">Enter a valid email address.</p>
```

Fixture `success` (`tone="success"`, `id="newsletter-status"`; children `Thanks for subscribing.`):

```html
<p class="rp-form-message" id="newsletter-status" data-tone="success" role="status">Thanks for subscribing.</p>
```

The empty error element of commerce contracts is this contract plus three literal attributes that the commerce component prints itself (it is not a FormMessage fixture):

```html
<p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | `Enter a valid email address.` |
| `success` | `{ "tone": "success", "id": "newsletter-status" }` | `Thanks for subscribing.` |
| `muted` | `{ "tone": "muted" }` | `At least 8 characters.` |
| `class` | `{ "class": "custom-a custom-b" }` | `Enter a valid email address.` |
| `invalid-enum-falls-back` | `{ "tone": "bogus" }` (output equals `default`) | `Enter a valid email address.` |

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `role` | root | server | always | `alert` for `tone="destructive"`, otherwise `status` |
| `hidden` | root (commerce error part only) | commerce element removes it when it fills the text | an error occurs | present (printed by the commerce component, not by FormMessage) |

Upgrade allow-list (mutations permitted when the element upgrades): None for FormMessage itself. (The commerce error part's text and `hidden` writes are on the allow-list of the owning commerce component, `05-commerce.md`.)

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional: the server prints the message in the response page.

### Events, commands and methods

None.

### Accessibility

- Pattern: live region; `checkPattern`: none. `role="alert"` (assertive) for errors, `role="status"` (polite) for everything else.
- Accessible name: not applicable.
- Focus: not focusable. After a failed form post the page SHOULD move focus to the first invalid control (the host's responsibility).
- Announcements: the message text, when the element is inserted or filled.
- The message MUST NOT rely on colour alone: the text states the problem.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/form-message/form-message.css` (layer `rp.components`).
- Tokens used: `--text-sm`, `--text-sm--line-height`, `--color-destructive`, `--color-success`, `--color-info`, `--color-warning`, `--color-muted-foreground`.

| Custom property | Default | Purpose |
|---|---|---|
| none | | |

| Modifier selector | Sets |
|---|---|
| `.rp-form-message[data-tone="success"]` | `--_fg: var(--color-success)` |
| `.rp-form-message[data-tone="info"]` | `--_fg: var(--color-info)` |
| `.rp-form-message[data-tone="warning"]` | `--_fg: var(--color-warning)` |
| `.rp-form-message[data-tone="muted"]` | `--_fg: var(--color-muted-foreground)` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-form-message` | custom properties: `--_fg: var(--color-destructive)`. Declarations: `margin: 0; padding: 0; font-size: var(--text-sm); line-height: var(--text-sm--line-height); color: var(--_fg)` |

### Host notes

- HTML: None.
- React: `export function FormMessage(props: FormMessageProps)`; generated.
- Remix: None.
- Liquid: `{% block 'form-message', tone: 'success' %}<children>{% endblock %}`. Schema settings: `tone`. Locale keys: `ripple.form-message.name`.

```tsx
{form.posted_successfully ? <FormMessage tone="success">Thanks for subscribing.</FormMessage> : null}
```

```liquid
{% if form.posted_successfully? %}
  {% block 'form-message', tone: 'success' %}{{ 'newsletter.success' | t }}{% endblock %}
{% endif %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4. Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 2: `tone="destructive"` prints `role="alert"`; each of `success`, `info`, `warning`, `muted` prints `role="status"`.
3. Tier 5: fixture `default` computes `color` equal to the computed `--color-destructive`, `font-size` 14 px, `margin` 0.
4. Tier 5: the commerce error markup above computes `display: none` while it has `hidden`, and renders like fixture `default` when `hidden` is removed and text is set.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` D-014, D-045 item 4 (exact error element), D-008 item 7; `02-html-contract.md` PE-11, A-8, A-11; `03-styling-and-tokens.md` section 7.5 (tone-only components).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
