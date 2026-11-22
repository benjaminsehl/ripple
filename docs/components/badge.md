# Badge

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `badge` |
| Kind | `static` |
| Category | `feedback` |
| Custom elements | none |
| Root element and class | `span` `.rp-badge` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A short, non-interactive label attached to another object: "Sale", "New", "Sold out", a count.

- Use when: marking a product card, a price, a menu entry or a heading with a status of one to three words.
- Do not use when: the label is clickable (use Button with `size="sm"`), the message is a sentence (use Banner or Text), or the label states a cart count that changes without a page load (use CartCount, `11-components-commerce.md`).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Badge` | `blocks/badge.liquid` | `span` | `rp-badge` | none | yes | none |

Nesting rules: none. Badge is phrasing content.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `variant` | `variant` | enum | `solid soft outline` | `solid` | no | no | `data-variant` |
| `tone` | `tone` | enum | `neutral muted primary info success warning destructive sale` | `neutral` | no | no | `data-tone` |
| `size` | `size` | enum | `sm md` | `md` | no | no | `data-size` |

### Content model

`text` - phrasing content; MAY start with one Icon.

### HTML contract

Fixture `default` (no props; children `New`):

```html
<span class="rp-badge" data-variant="solid" data-tone="neutral" data-size="md">New</span>
```

Fixture `small` (`variant="soft"`, `tone="sale"`, `size="sm"`; children `Sale`):

```html
<span class="rp-badge" data-variant="soft" data-tone="sale" data-size="sm">Sale</span>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | `New` |
| `small` | `{ "variant": "soft", "tone": "sale", "size": "sm" }` | `Sale` |
| `class` | `{ "class": "custom-a custom-b" }` | `New` |
| `invalid-enum-falls-back` | `{ "variant": "bogus" }` (output equals `default`) | `New` |

In addition the generator MUST emit one fixture per pair of `variant` and `tone` (24 fixtures), named `<variant>-<tone>` (for example `outline-muted`), with props `{ "variant": "<variant>", "tone": "<tone>" }` and children `Label`. The contrast test below uses them.

Host-owned regions and masks: None.

### State and attributes

None.

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional: static markup.

### Events, commands and methods

None.

### Accessibility

- Pattern: none; `checkPattern`: none. A Badge is plain text for assistive technology.
- Accessible name: not applicable. The text MUST carry the meaning by itself; tone is decoration.
- Focus: not focusable.
- Announcements: none.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/badge/badge.css` (layer `rp.components`). The complete, normative file is below and MUST be copied as written.
- Tokens used: `--spacing`, `--radius-control`, `--text-xs`, `--text-sm`, `--font-weight-medium`, `--color-foreground`, `--color-background`, `--color-muted`, `--color-muted-foreground`, `--color-primary`, `--color-primary-foreground`, `--color-info`, `--color-info-foreground`, `--color-success`, `--color-success-foreground`, `--color-warning`, `--color-warning-foreground`, `--color-destructive`, `--color-destructive-foreground`, `--color-sale`, `--color-sale-foreground`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-badge-height` | `calc(var(--spacing) * 6)` | minimum block size |
| `--rp-badge-px` | `calc(var(--spacing) * 2)` | inline padding |
| `--rp-badge-radius` | `var(--radius-control)` | corner radius |
| `--rp-badge-font-size` | `var(--text-xs)` | font size |

| Modifier selector | Sets |
|---|---|
| `.rp-badge[data-tone="<tone>"]` for the 7 non-default tones | `--_tone`, `--_on-tone`, `--_tone-text` (values of `03-styling-and-tokens.md` section 7.5) |
| `.rp-badge[data-variant="soft"]` | `--_bg`, `--_fg` |
| `.rp-badge[data-variant="outline"]` | `--_bg`, `--_fg`, `--_border` |
| `.rp-badge[data-size="sm"]` | `--rp-badge-height: calc(var(--spacing) * 5); --rp-badge-px: calc(var(--spacing) * 1.5)` |

| File section | Selector | Declarations |
|---|---|---|
| all | all | as written in the file below |

```css
/* badge.css
   Component: Badge (id `badge`). Contract: 09-components-foundation.md, "Badge".
   Root:      span, class rp-badge
   Props:     data-variant = solid | soft | outline   (default solid)
              data-tone = neutral | muted | primary | info | success | warning | destructive | sale   (default neutral)
              data-size = sm | md   (default md)
   States:    none
   Public:    --rp-badge-height, --rp-badge-px, --rp-badge-radius, --rp-badge-font-size */
@layer rp.components {
  /* 1. ROOT */
  .rp-badge {
    /* 1a. public custom properties */
    --rp-badge-height: calc(var(--spacing) * 6);
    --rp-badge-px: calc(var(--spacing) * 2);
    --rp-badge-radius: var(--radius-control);
    --rp-badge-font-size: var(--text-xs);
    /* 1b. colour slots */
    --_bg: var(--_tone);
    --_fg: var(--_on-tone);
    --_border: transparent;
    /* 1c. other private custom properties */
    --_tone: var(--color-foreground);
    --_on-tone: var(--color-background);
    --_tone-text: var(--color-foreground);
    /* 1d. declarations */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: calc(var(--spacing) * 1);
    box-sizing: border-box;
    min-block-size: var(--rp-badge-height);
    margin: 0;
    padding-block: 0;
    padding-inline: var(--rp-badge-px);
    border: 1px solid var(--_border);
    border-radius: var(--rp-badge-radius);
    background-color: var(--_bg);
    color: var(--_fg);
    font-size: var(--rp-badge-font-size);
    font-weight: var(--font-weight-medium);
    line-height: 1;
    white-space: nowrap;
    vertical-align: middle;
  }

  /* 2. PARTS */

  /* 3. MODIFIERS */
  .rp-badge[data-tone="muted"] {
    --_tone: var(--color-muted);
    --_on-tone: var(--color-muted-foreground);
    --_tone-text: var(--color-muted-foreground);
  }
  .rp-badge[data-tone="primary"] {
    --_tone: var(--color-primary);
    --_on-tone: var(--color-primary-foreground);
    --_tone-text: var(--color-foreground);
  }
  .rp-badge[data-tone="info"] {
    --_tone: var(--color-info);
    --_on-tone: var(--color-info-foreground);
    --_tone-text: var(--color-info);
  }
  .rp-badge[data-tone="success"] {
    --_tone: var(--color-success);
    --_on-tone: var(--color-success-foreground);
    --_tone-text: var(--color-success);
  }
  .rp-badge[data-tone="warning"] {
    --_tone: var(--color-warning);
    --_on-tone: var(--color-warning-foreground);
    --_tone-text: var(--color-warning);
  }
  .rp-badge[data-tone="destructive"] {
    --_tone: var(--color-destructive);
    --_on-tone: var(--color-destructive-foreground);
    --_tone-text: var(--color-destructive);
  }
  .rp-badge[data-tone="sale"] {
    --_tone: var(--color-sale);
    --_on-tone: var(--color-sale-foreground);
    --_tone-text: var(--color-sale);
  }
  .rp-badge[data-variant="soft"] {
    --_bg: color-mix(in oklab, var(--_tone-text) 12%, transparent);
    --_fg: var(--_tone-text);
  }
  .rp-badge[data-variant="outline"] {
    --_bg: transparent;
    --_fg: var(--_tone-text);
    --_border: color-mix(in oklab, var(--_tone-text) 45%, transparent);
  }
  .rp-badge[data-size="sm"] {
    --rp-badge-height: calc(var(--spacing) * 5);
    --rp-badge-px: calc(var(--spacing) * 1.5);
  }

  /* 4. STATES */

  /* 5. MOTION */

  /* 6. ENVIRONMENT */
}
```

An Icon inside a Badge takes the Icon default size (`1em`), which is the badge font size.

### Host notes

- HTML: None.
- React: `export function Badge(props: BadgeProps)`; generated.
- Remix: None.
- Liquid: `{% block 'badge', tone: 'sale' %}Sale{% endblock %}`. Schema settings: `variant`, `tone`, `size`. Locale keys: `ripple.badge.name`.

```tsx
<Badge tone="sale" variant="soft">Sale</Badge>
```

```liquid
{% if product.compare_at_price > product.price %}
  {% block 'badge', tone: 'sale', variant: 'soft' %}{{ 'products.sale' | t }}{% endblock %}
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
2. Tier 1: `components/badge/badge.css` equals the file above byte for byte, ignoring a trailing newline and the provenance trailer.
3. Tier 5: for each of the 24 `<variant>-<tone>` fixtures, in `data-scheme="light"` and `data-scheme="dark"`, the contrast ratio between the computed `color` and the effective background (the computed `background-color` composited over the page background) is at least 4.5.
4. Tier 5: fixture `default` computes `min-block-size` 24 px and `font-size` 12 px at default dials; fixture `small` computes `min-block-size` 20 px.
5. Tier 5: fixture `outline-muted` computes a `border-inline-start-width` of 1 px and a non-transparent `border-inline-start-color`; fixture `default` computes a transparent border colour.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` section 6.3 (`variant`, `tone`, `size` vocabularies), section 8.1; `ripple/docs/03-styling-and-tokens.md` section 7.5 (tone inputs, variant formulas, verified contrast, and the statement that the complete Badge file is specified here), section 7.2 (file skeleton).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
