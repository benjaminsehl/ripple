# Card

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `card` |
| Kind | `static` |
| Category | `layout` |
| Custom elements | none |
| Root element and class | `div` `.rp-card` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A surface that groups related content: a bordered, tinted or raised box with padding and a radius.

- Use when: grouping content that belongs together (an order summary, a feature tile, a form panel).
- Do not use when: rendering a product, collection or article (use ProductCard, CollectionCard, ArticleCard in `11-components-commerce.md`), or when only spacing is needed (use Stack).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Card` | `blocks/card.liquid` | `div` | `rp-card` | none | yes | none |

Nesting rules: a Card MUST NOT be placed inside `<a>` or `<button>`, and MUST NOT itself be made clickable; links go inside it (`02-html-contract.md` A-14).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `variant` | `variant` | enum | `outline soft elevated plain` | `outline` | no | no | `data-variant` |
| `radius` | `radius` | enum | `none sm md lg xl` | none (omitted; the CSS default is `--radius-surface`) | no | no | `data-radius` |
| `scheme` | `scheme` | string | `light`, `dark`, or a project scheme name matching `^[a-z][a-z0-9-]*$` | none (omitted) | no | no | `data-scheme` |
| `p` | `p` | scale | space steps | none (omitted; the CSS default padding is step 6) | no | yes | `data-p` |
| `px` | `px` | scale | space steps | none (omitted) | no | yes | `data-px` |
| `py` | `py` | scale | space steps | none (omitted) | no | yes | `data-py` |
| `pt` | `pt` | scale | space steps | none (omitted) | no | yes | `data-pt` |
| `pb` | `pb` | scale | space steps | none (omitted) | no | yes | `data-pb` |

### Content model

`flow` - any flow content.

### HTML contract

Fixture `default` (no props; children `<p>Content</p>`):

```html
<div class="rp-card" data-variant="outline"><p>Content</p></div>
```

Fixture `elevated` (`variant="elevated"`, `radius="lg"`, `p="4 md:8"`):

```html
<div class="rp-card" data-variant="elevated" data-radius="lg" data-p="4 md:8"><p>Content</p></div>
```

Fixture `scheme` (`variant="soft"`, `scheme="dark"`, `p="0"`):

```html
<div class="rp-card" data-variant="soft" data-scheme="dark" data-p="0"><p>Content</p></div>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | `<p>Content</p>` |
| `elevated` | `{ "variant": "elevated", "radius": "lg", "p": "4 md:8" }` | `<p>Content</p>` |
| `scheme` | `{ "variant": "soft", "scheme": "dark", "p": "0" }` | `<p>Content</p>` |
| `plain-padding` | `{ "variant": "plain", "radius": "none", "px": "6", "py": "2", "pt": "1", "pb": "3" }` | `<p>Content</p>` |
| `class` | `{ "class": "custom-a custom-b" }` | `<p>Content</p>` |
| `invalid-enum-falls-back` | `{ "variant": "bogus" }` (output `data-variant="outline"`) | `<p>Content</p>` |
| `responsive` | `{ "p": "4 lg:10" }` | `<p>Content</p>` |
| `escaping` | `{ "scheme": "Say \"hi\" & <go>" }` | `<p>Content</p>` |

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

- Pattern: none (a generic container); `checkPattern`: none.
- Accessible name: not required.
- Focus: not focusable.
- Announcements: None.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/card/card.css` (layer `rp.components`).
- Tokens used: `--color-card`, `--color-card-foreground`, `--color-border`, `--color-muted`, `--radius-surface`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--shadow-sm`, `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-card-padding` | `calc(var(--spacing) * 6)` | padding when no padding prop is passed |
| `--rp-card-radius` | `var(--radius-surface)` | corner radius |

| Modifier selector | Sets |
|---|---|
| `.rp-card[data-variant="soft"]` | `--_bg: var(--color-muted); --_border: transparent` |
| `.rp-card[data-variant="elevated"]` | `--_shadow: var(--shadow-sm)` |
| `.rp-card[data-variant="plain"]` | `--_bg: transparent; --_border: transparent` |
| `.rp-card[data-radius="none"]` | `--rp-card-radius: 0` |
| `.rp-card[data-radius="sm"]` | `--rp-card-radius: var(--radius-sm)` |
| `.rp-card[data-radius="md"]` | `--rp-card-radius: var(--radius-md)` |
| `.rp-card[data-radius="lg"]` | `--rp-card-radius: var(--radius-lg)` |
| `.rp-card[data-radius="xl"]` | `--rp-card-radius: var(--radius-xl)` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-card` | custom properties: the two public ones above; `--_bg: var(--color-card); --_fg: var(--color-card-foreground); --_border: var(--color-border); --_shadow: none`. Declarations: `display: block; min-inline-size: 0; margin: 0; padding: var(--rp-card-padding); border: 1px solid var(--_border); border-radius: var(--rp-card-radius); background-color: var(--_bg); color: var(--_fg); box-shadow: var(--_shadow)` |

Because `radius` has no printed default, CSS-07 ("the default value has no modifier rule") is satisfied by the root rule; all five `data-radius` values have a modifier rule.

### Host notes

- HTML: None.
- React: `export function Card(props: CardProps)`; generated; no hooks.
- Remix: None.
- Liquid: `{% block 'card', variant: 'elevated' %}<children>{% endblock %}`. Schema settings: `variant`. Locale keys: `ripple.card.name`.

```tsx
<Card variant="elevated" p="4 md:8">
  <Heading level={3}>Free returns</Heading>
  <Text tone="muted">Within 30 days.</Text>
</Card>
```

```liquid
{% block 'card', variant: 'elevated', p: '4 md:8' %}
  {% block 'heading', level: 3 %}Free returns{% endblock %}
  {% block 'text', tone: 'muted' %}Within 30 days.{% endblock %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4, plus RP204 (a popup inside a clickable card). Manifest `rules[]` (reported by RP113): `card-not-interactive`: kind `forbids-ancestor`, selector `:scope`, target `a, button`. Message: "A Card is inside a link or a button." Fix: "Put the link inside the Card instead of wrapping the Card."

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: fixture `default` computes `padding` 24 px on all sides, `border-radius` 12 px, `border-top-width` 1 px, `background-color` equal to the computed `--color-card`.
3. Tier 5: fixture `elevated` computes a `box-shadow` other than `none`, `border-radius` 8 px, and `padding` 16 px at 375 px viewport width and 32 px at 1280 px.
4. Tier 5: fixture `scheme` computes `padding` 0 and a `background-color` different from fixture `default`.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/blocks/card.liquid`; `ripple/docs/00-decisions.md` sections 6.2, 6.3 (`variant` from `solid soft outline plain elevated`, `radius`, `scheme`); `03-styling-and-tokens.md` section 7.5 (`elevated` formula).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
