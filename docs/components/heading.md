# Heading

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `heading` |
| Kind | `static` |
| Category | `typography` |
| Custom elements | none |
| Root element and class | `h1` to `h6` `.rp-heading` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A heading. `level` chooses the element (`h1` to `h6`) and therefore the document outline; `size` chooses the visual size independently.

- Use when: titling a page, a band, a card or a dialog body section.
- Do not use when: the text is not a heading in the outline (use Text with `size` and `weight`), or for the small label above a heading (use Text `variant="overline"`).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Heading` | `blocks/heading.liquid` | `h1`, `h2`, `h3`, `h4`, `h5`, `h6` | `rp-heading` | none | yes | none |

Nesting rules: a page MUST have exactly one `h1`. Levels SHOULD NOT skip (an `h4` directly under an `h2`).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `level` | `level` | enum | `1 2 3 4 5 6` | `2` | no | no | the root tag `h<level>`; no attribute |
| `size` | `size` | enum | `xs sm base lg xl 2xl 3xl 4xl 5xl 6xl` | none (omitted; the CSS default depends on the tag) | no | no | `data-size` |
| `weight` | `weight` | enum | `normal medium semibold bold` | none (omitted; the CSS default is `--rp-heading-weight`) | no | no | `data-weight` |
| `textAlign` | `text_align` | enum | `start center end` | none (omitted) | no | yes | `data-text-align` |

`level` accepts the number or the string in TSX (`level={1}` or `level="1"`) and in Liquid (`level: 1` or `level: '1'`); bindings compare the string form.

### Content model

`text` - phrasing content: text and inline elements (`<span>`, `<em>`, `<bdi>`, Icon, a Link).

### HTML contract

Fixture `default` (no props; children `Title`):

```html
<h2 class="rp-heading">Title</h2>
```

Fixture `display` (`level=1`, `size="5xl"`, `weight="bold"`, `textAlign="center md:start"`; children `Summer sale`):

```html
<h1 class="rp-heading" data-size="5xl" data-weight="bold" data-text-align="center md:start">Summer sale</h1>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | `Title` |
| `display` | `{ "level": 1, "size": "5xl", "weight": "bold", "textAlign": "center md:start" }` | `Summer sale` |
| `level-6` | `{ "level": 6 }` (output tag `h6`) | `Title` |
| `class` | `{ "class": "custom-a custom-b" }` | `Title` |
| `invalid-enum-falls-back` | `{ "level": "bogus" }` (output tag `h2`) | `Title` |
| `responsive` | `{ "textAlign": "center lg:start" }` | `Title` |

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

- Pattern: native heading; `checkPattern`: none. `level` decides the outline and is independent of `size` (`02-html-contract.md` A-9).
- Accessible name: the text content.
- Focus: not focusable.
- Announcements: None.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/heading/heading.css` (layer `rp.components`).
- Tokens used: `--font-heading`, `--rp-heading-weight`, `--font-weight-normal`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`, `--text-xs` to `--text-6xl` and their `--text-<step>--line-height` tokens.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-heading-size` | `var(--text-3xl)` | font size |
| `--rp-heading-line-height` | `var(--text-3xl--line-height)` | line height |
| `--rp-heading-tracking` | `-0.01em` | letter spacing |

| Modifier selector | Sets |
|---|---|
| `.rp-heading[data-size="<step>"]`, one rule for each of `xs sm base lg xl 2xl 3xl 4xl 5xl 6xl` | `--rp-heading-size: var(--text-<step>); --rp-heading-line-height: var(--text-<step>--line-height)` |
| `.rp-heading[data-weight="normal"]` | `--_weight: var(--font-weight-normal)` |
| `.rp-heading[data-weight="medium"]` | `--_weight: var(--font-weight-medium)` |
| `.rp-heading[data-weight="semibold"]` | `--_weight: var(--font-weight-semibold)` |
| `.rp-heading[data-weight="bold"]` | `--_weight: var(--font-weight-bold)` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-heading` | custom properties: the three public ones above; `--_weight: var(--rp-heading-weight)`. Declarations: `margin: 0; padding: 0; font-family: var(--font-heading); font-size: var(--rp-heading-size); line-height: var(--rp-heading-line-height); font-weight: var(--_weight); letter-spacing: var(--rp-heading-tracking); text-wrap: balance; overflow-wrap: break-word` |
| PARTS | `.rp-heading:where(h1)` | `--rp-heading-size: var(--text-4xl); --rp-heading-line-height: var(--text-4xl--line-height)` |
| PARTS | `.rp-heading:where(h3)` | `--rp-heading-size: var(--text-2xl); --rp-heading-line-height: var(--text-2xl--line-height)` |
| PARTS | `.rp-heading:where(h4)` | `--rp-heading-size: var(--text-xl); --rp-heading-line-height: var(--text-xl--line-height)` |
| PARTS | `.rp-heading:where(h5)` | `--rp-heading-size: var(--text-lg); --rp-heading-line-height: var(--text-lg--line-height)` |
| PARTS | `.rp-heading:where(h6)` | `--rp-heading-size: var(--text-base); --rp-heading-line-height: var(--text-base--line-height)` |

The five tag rules have specificity (0,1,0) and come after the root rule, so they override its defaults; every `data-size` modifier has specificity (0,2,0) and overrides the tag rules. `h2` uses the root defaults. Default sizes at the default dials: `h1` 36.3 px, `h2` 30.3 px, `h3` 24.1 px, `h4` 20.1 px, `h5` 18 px, `h6` 16 px.

### Host notes

- HTML: None.
- React: `export function Heading(props: HeadingProps)`; generated; the tag is `` `h${level}` `` after validation (`06-bindings.md` T-10).
- Remix: None.
- Liquid: `{% block 'heading', level: 1 %}<children>{% endblock %}`. Schema settings: none (`size` and `weight` have no default). Locale keys: `ripple.heading.name`.

```tsx
<Heading level={1} size="5xl" textAlign="center md:start">Summer sale</Heading>
```

```liquid
{% block 'heading', level: 1, size: '5xl', text_align: 'center md:start' %}Summer sale{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4. Manifest `rules[]`: none. (The "one `h1` per page" rule is a page rule owned by `07-manifest-registry-cli.md`, layer H.)

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 2: `level` 1 to 6 produce tags `h1` to `h6`; `level` 7, 0 and `"bogus"` produce `h2`, in all four hosts.
3. Tier 5: with default dials, `h1` to `h6` without `size` compute `font-size` 36.3, 30.3, 24.1, 20.1, 18 and 16 px (0.2 px tolerance) where `pow()` is supported.
4. Tier 5: fixture `display` computes `font-size` equal to the computed `--text-5xl`, `font-weight: 700`, `text-align: center` at 375 px viewport width and `start` at 1280 px.
5. Tier 5: every fixture computes `margin` 0 on all sides.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/blocks/heading.liquid`; `ripple/docs/00-decisions.md` section 6.3 (`level`, `size` (text), `weight`, `textAlign`); `03-styling-and-tokens.md` section 3.4 (type scale), section 6.1 (`data-text-align` scope).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
