# Placeholder

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `placeholder` |
| Kind | `static` |
| Category | `media` |
| Custom elements | none |
| Root element and class | `div` `.rp-placeholder` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A neutral box with a fixed aspect ratio that stands in for a missing image, so that grids keep their shape.

- Use when: a product, collection or article has no image.
- Do not use when: content is still loading (use Skeleton).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Placeholder` | `blocks/placeholder.liquid` | `div` | `rp-placeholder` | none | yes | none |

Nesting rules: none.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `ratio` | `ratio` | enum | `1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9` | `1/1` | no | no | `data-ratio` |
| `radius` | `radius` | enum | `none sm md lg xl full` | `none` | no | no | `data-radius` |
| `ariaLabel` | `aria_label` | string | text | none | no | no | when set: `role="img"` and `aria-label`; when unset: `aria-hidden="true"` |

### Content model

`none` - the root is always empty.

### HTML contract

Fixture `default` (no props):

```html
<div class="rp-placeholder" data-ratio="1/1" data-radius="none" aria-hidden="true"></div>
```

Fixture `labelled` (`ratio="4/5"`, `radius="lg"`, `ariaLabel="No image available"`):

```html
<div class="rp-placeholder" data-ratio="4/5" data-radius="lg" role="img" aria-label="No image available"></div>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | absent |
| `labelled` | `{ "ratio": "4/5", "radius": "lg", "ariaLabel": "No image available" }` | absent |
| `class` | `{ "class": "custom-a custom-b" }` | absent |
| `invalid-enum-falls-back` | `{ "ratio": "bogus" }` (output `data-ratio="1/1"`) | absent |
| `escaping` | `{ "ariaLabel": "Say \"hi\" & <go>" }` | absent |

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

- Pattern: decorative box, or `role="img"` when labelled; `checkPattern`: none.
- Accessible name: `ariaLabel`, optional. Without it the box is hidden from assistive technology.
- Focus: not focusable.
- Announcements: None.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/placeholder/placeholder.css` (layer `rp.components`).
- Tokens used: `--color-muted`, `--color-muted-foreground`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-placeholder-radius` | `0` | corner radius |

| Modifier selector | Sets |
|---|---|
| `.rp-placeholder[data-ratio="<value>"]`, one rule for each of `4/5 3/4 2/3 4/3 3/2 16/9 21/9` | `--_ratio: <a> / <b>` |
| `.rp-placeholder[data-radius="sm"]` / `"md"` / `"lg"` / `"xl"` / `"full"` (five rules) | `--rp-placeholder-radius: var(--radius-sm)` / `var(--radius-md)` / `var(--radius-lg)` / `var(--radius-xl)` / `9999px` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-placeholder` | custom properties: `--rp-placeholder-radius` as above; `--_ratio: 1 / 1`. Declarations: `display: block; inline-size: 100%; aspect-ratio: var(--_ratio); border-radius: var(--rp-placeholder-radius); background-color: var(--color-muted); background-image: linear-gradient(135deg, transparent, color-mix(in oklab, var(--color-muted-foreground) 12%, transparent))` |

### Host notes

- HTML: None.
- React: `export function Placeholder(props: PlaceholderProps)`; generated; no `children`.
- Remix: None.
- Liquid: `{% block 'placeholder', ratio: '4/5' %}{% endblock %}`. Schema settings: `ratio`, `radius`. Locale keys: `ripple.placeholder.name`.

```tsx
{product.featuredImage ? <Image image={product.featuredImage} ratio="4/5" /> : <Placeholder ratio="4/5" />}
```

```liquid
{% if product.featured_image %}
  {% block 'image', image: product.featured_image, ratio: '4/5' %}{% endblock %}
{% else %}
  {% block 'placeholder', ratio: '4/5' %}{% endblock %}
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
2. Tier 5: fixture `default` in a 200 px parent has a bounding box of 200 by 200 px; fixture `labelled` in a 200 px parent has 200 by 250 px and `border-radius` 8 px.
3. Tier 2: fixture `default` has `aria-hidden="true"` and no `role`; fixture `labelled` has `role="img"`, `aria-label` and no `aria-hidden`.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/snippets/placeholder-texture.liquid`; `ripple/theme/blocks/image.liquid` (placeholder branch); `ripple/docs/00-decisions.md` sections 6.3 and 8.7 (Placeholder added).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
