# Text

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `text` |
| Kind | `static` |
| Category | `typography` |
| Custom elements | none |
| Root element and class | `p`, `span` or `div` `.rp-text` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A run of body text with a variant, an optional size, a tone and a weight. `variant="overline"` replaces the base theme's `overline` block.

- Use when: printing a paragraph, a caption, a lead paragraph, an overline, or inline text that needs a tone.
- Do not use when: the text is a heading (use Heading), is HTML from the CMS (use RichText), or is a form error (use FormMessage).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Text` | `blocks/text.liquid` | `p`, `span`, `div` | `rp-text` | none | yes | none |

Nesting rules: with `as="p"` (the default) the children MUST be phrasing content; a Text with `as="p"` MUST NOT contain another block-level Text.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `as` | `as` | enum | `p span div` | `p` | no | no | the root tag; no attribute |
| `variant` | `variant` | enum | `body lead caption overline` | `body` | no | no | `data-variant` |
| `size` | `size` | enum | `xs sm base lg xl 2xl 3xl 4xl 5xl 6xl` | none (omitted; the variant decides) | no | no | `data-size` |
| `tone` | `tone` | enum | `neutral muted primary info success warning destructive sale` | `neutral` | no | no | `data-tone` |
| `weight` | `weight` | enum | `normal medium semibold bold` | none (omitted) | no | no | `data-weight` |
| `textAlign` | `text_align` | enum | `start center end` | none (omitted) | no | yes | `data-text-align` |

### Content model

`text` - phrasing content.

### HTML contract

Fixture `default` (no props; children `Ships in two days.`):

```html
<p class="rp-text" data-variant="body" data-tone="neutral">Ships in two days.</p>
```

Fixture `overline` (`variant="overline"`, `tone="muted"`; children `New`):

```html
<p class="rp-text" data-variant="overline" data-tone="muted">New</p>
```

Fixture `inline-strong` (`as="span"`, `size="lg"`, `weight="semibold"`, `tone="sale"`; children `-20%`):

```html
<span class="rp-text" data-variant="body" data-size="lg" data-tone="sale" data-weight="semibold">-20%</span>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | `Ships in two days.` |
| `overline` | `{ "variant": "overline", "tone": "muted" }` | `New` |
| `inline-strong` | `{ "as": "span", "size": "lg", "weight": "semibold", "tone": "sale" }` | `-20%` |
| `lead-centered` | `{ "as": "div", "variant": "lead", "textAlign": "center" }` | `Made to last.` |
| `caption` | `{ "variant": "caption", "tone": "destructive" }` | `Only 2 left` |
| `class` | `{ "class": "custom-a custom-b" }` | `Ships in two days.` |
| `invalid-enum-falls-back` | `{ "as": "bogus" }` (output tag `p`) | `Ships in two days.` |
| `responsive` | `{ "textAlign": "center md:start" }` | `Ships in two days.` |

Host-owned regions and masks: None.

### State and attributes

None.

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Identical to the behaviour with JavaScript: static markup styled by CSS.

### Events, commands and methods

None.

### Accessibility

- Pattern: native text; `checkPattern`: none. Tone colours meet 4.5:1 on the scheme background (`03-styling-and-tokens.md` section 3.4). Tone MUST NOT be the only carrier of meaning: the text itself says "Sold out" or "Sale".
- Accessible name: not applicable.
- Focus: not focusable.
- Announcements: None.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/text/text.css` (layer `rp.components`).
- Tokens used: `--text-xs` to `--text-6xl` and line heights, `--font-weight-*`, `--color-muted-foreground`, `--color-foreground`, `--color-info`, `--color-success`, `--color-warning`, `--color-destructive`, `--color-sale`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-text-size` | `var(--text-base)` | font size |
| `--rp-text-line-height` | `var(--text-base--line-height)` | line height |

| Modifier selector | Sets |
|---|---|
| `.rp-text[data-variant="lead"]` | `--rp-text-size: var(--text-lg); --rp-text-line-height: var(--text-lg--line-height)` |
| `.rp-text[data-variant="caption"]` | `--rp-text-size: var(--text-sm); --rp-text-line-height: var(--text-sm--line-height)` |
| `.rp-text[data-variant="overline"]` | `--rp-text-size: var(--text-xs); --rp-text-line-height: var(--text-xs--line-height); --_weight: var(--font-weight-medium); --_tracking: 0.08em; --_transform: uppercase` |
| `.rp-text[data-size="<step>"]`, one rule for each of the ten steps, placed AFTER the variant rules | `--rp-text-size: var(--text-<step>); --rp-text-line-height: var(--text-<step>--line-height)` |
| `.rp-text[data-tone="muted"]` | `--_fg: var(--color-muted-foreground)` |
| `.rp-text[data-tone="primary"]` | `--_fg: var(--color-foreground)` |
| `.rp-text[data-tone="info"]` | `--_fg: var(--color-info)` |
| `.rp-text[data-tone="success"]` | `--_fg: var(--color-success)` |
| `.rp-text[data-tone="warning"]` | `--_fg: var(--color-warning)` |
| `.rp-text[data-tone="destructive"]` | `--_fg: var(--color-destructive)` |
| `.rp-text[data-tone="sale"]` | `--_fg: var(--color-sale)` |
| `.rp-text[data-weight="normal"]` / `"medium"` / `"semibold"` / `"bold"` (four rules, placed AFTER the variant rules) | `--_weight: var(--font-weight-normal)` / `-medium` / `-semibold` / `-bold` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-text` | custom properties: the two public ones above; `--_fg: initial; --_weight: initial; --_tracking: initial; --_transform: initial`. Declarations: `margin: 0; padding: 0; font-size: var(--rp-text-size); line-height: var(--rp-text-line-height); font-weight: var(--_weight); letter-spacing: var(--_tracking); text-transform: var(--_transform); color: var(--_fg); overflow-wrap: break-word` |

How the `initial` slots work: a custom property set to `initial` is guaranteed-invalid, so a declaration that reads it is invalid at computed-value time and the property falls back to its inherited value. Therefore `tone="neutral"` (the default) inherits the surrounding colour (a Text inside a Banner or a dark scheme keeps the right colour), and an unset `weight` inherits the surrounding weight. `tone="primary"` is the foreground colour (`03-styling-and-tokens.md` section 7.5, column `--_tone-text`). Size and weight rules follow the variant rules in the file because both write the same variables at equal specificity.

### Host notes

- HTML: None.
- React: `export function Text(props: TextProps)`; generated; no hooks.
- Remix: None.
- Liquid: `{% block 'text', tone: 'muted' %}<children>{% endblock %}`. Schema settings: `variant`, `tone`. Locale keys: `ripple.text.name`.

```tsx
<Text variant="overline" tone="muted">New</Text>
```

```liquid
{% block 'text', variant: 'overline', tone: 'muted' %}New{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4. Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: fixture `default` inside `<div style="color: rgb(1, 2, 3)">` computes `color: rgb(1, 2, 3)` (neutral inherits) and `font-size` 16 px, `margin` 0.
3. Tier 5: fixture `overline` computes `text-transform: uppercase`, `font-size` 12 px, `font-weight: 500`, and `color` equal to the computed `--color-muted-foreground`.
4. Tier 5: fixture `inline-strong` computes `font-size` equal to the computed `--text-lg`, `font-weight: 600`, `color` equal to the computed `--color-sale`.
5. Tier 5: a Text with `variant="caption"` and `size="xl"` computes `font-size` equal to the computed `--text-xl` (size wins over variant).

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/blocks/text.liquid`, `ripple/theme/blocks/overline.liquid`; `ripple/docs/00-decisions.md` sections 6.3 and 8.6 (`overline` maps to Text); `03-styling-and-tokens.md` section 7.5 (tone as text).
- UNVERIFIED: None.

### Fallback (SPIKE-02)

If SPIKE-02 finds that `as` is not a legal block argument name, the Liquid param is renamed `tag` through the manifest key `prop.liquid.name` (D-038 as amended; `06-bindings.md` section 8.5). The TSX prop stays `as`. Values, default, contract and fixtures do not change; Liquid calls become `{% block '<id>', tag: 'ul' %}`.

---
