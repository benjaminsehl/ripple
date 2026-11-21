# Skeleton

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `skeleton` |
| Kind | `static` |
| Category | `feedback` |
| Custom elements | none |
| Root element and class | `div` `.rp-skeleton` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A grey block that reserves the box of content that script will load, so that the layout does not shift when the content arrives.

- Use when: writing the fallback of a streamed or script-loaded region whose shape is known (a recommendations row, a predictive-search result list).
- Do not use when: the server already has the data (print the data), an image position has no image (use Placeholder), or the wait has no known shape (use Spinner).

A Skeleton MUST NOT be the only content of a region in the no-JS page: a region that script fills MUST have a server-rendered no-JS path, or be omitted without script (`02-html-contract.md` PE-1, PE-8).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Skeleton` | `blocks/skeleton.liquid` | `div` | `rp-skeleton` | none | yes | none |

Nesting rules: none.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `ratio` | `ratio` | enum | `auto 1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9` | `auto` | no | no | `data-ratio` |
| `radius` | `radius` | enum | `none sm md lg xl full` | `md` | no | no | `data-radius` |

`ratio="auto"` is a text line: block size `1em` of the surrounding font size. Any other ratio is a media box: full inline size, block size from the ratio. Inline size is set with the public custom property `--rp-skeleton-width` (for example `class="[--rp-skeleton-width:60%]"` with Tailwind, or a wrapping Grid cell).

### Content model

`none` - the root is empty.

### HTML contract

Fixture `default` (no props):

```html
<div class="rp-skeleton" data-ratio="auto" data-radius="md" aria-hidden="true"></div>
```

Fixture `media` (`ratio="4/5"`, `radius="lg"`):

```html
<div class="rp-skeleton" data-ratio="4/5" data-radius="lg" aria-hidden="true"></div>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | absent |
| `media` | `{ "ratio": "4/5", "radius": "lg" }` | absent |
| `avatar` | `{ "ratio": "1/1", "radius": "full" }` | absent |
| `class` | `{ "class": "custom-a custom-b" }` | absent |
| `invalid-enum-falls-back` | `{ "ratio": "bogus" }` (output equals `default`) | absent |

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `aria-hidden` | root | server | always | `true` |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional as markup: a static grey block (the pulse runs without script because it is CSS).

### Events, commands and methods

None.

### Accessibility

- Pattern: none; `checkPattern`: none. The block is hidden from assistive technology (`aria-hidden="true"`).
- Accessible name: not applicable. The region that contains Skeletons SHOULD carry `aria-busy="true"` while it loads; that attribute is the caller's.
- Focus: not focusable.
- Announcements: none.
- With `prefers-reduced-motion: reduce` the block does not pulse.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/skeleton/skeleton.css` (layer `rp.components`).
- Tokens used: `--color-muted`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--rp-duration-slow`, `--ease-in-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-skeleton-width` | `100%` | inline size |

| Modifier selector | Sets |
|---|---|
| `.rp-skeleton[data-ratio="1/1"]` | `--_ratio: 1 / 1; --_block-size: auto` |
| `.rp-skeleton[data-ratio="4/5"]` | `--_ratio: 4 / 5; --_block-size: auto` |
| `.rp-skeleton[data-ratio="3/4"]` | `--_ratio: 3 / 4; --_block-size: auto` |
| `.rp-skeleton[data-ratio="2/3"]` | `--_ratio: 2 / 3; --_block-size: auto` |
| `.rp-skeleton[data-ratio="4/3"]` | `--_ratio: 4 / 3; --_block-size: auto` |
| `.rp-skeleton[data-ratio="3/2"]` | `--_ratio: 3 / 2; --_block-size: auto` |
| `.rp-skeleton[data-ratio="16/9"]` | `--_ratio: 16 / 9; --_block-size: auto` |
| `.rp-skeleton[data-ratio="21/9"]` | `--_ratio: 21 / 9; --_block-size: auto` |
| `.rp-skeleton[data-radius="none"]` | `--_radius: 0` |
| `.rp-skeleton[data-radius="sm"]` | `--_radius: var(--radius-sm)` |
| `.rp-skeleton[data-radius="lg"]` | `--_radius: var(--radius-lg)` |
| `.rp-skeleton[data-radius="xl"]` | `--_radius: var(--radius-xl)` |
| `.rp-skeleton[data-radius="full"]` | `--_radius: 9999px` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-skeleton` | custom properties: `--rp-skeleton-width: 100%`; `--_ratio: auto`; `--_block-size: 1em`; `--_radius: var(--radius-md)`. Declarations: `display: block; box-sizing: border-box; inline-size: var(--rp-skeleton-width); block-size: var(--_block-size); aspect-ratio: var(--_ratio); margin: 0; border-radius: var(--_radius); background-color: var(--color-muted)` |
| MOTION | `.rp-skeleton` (inside `@media (prefers-reduced-motion: no-preference)`) | `animation: rp-pulse calc(var(--rp-duration-slow) * 5) var(--ease-in-out) infinite` |
| ENVIRONMENT | `.rp-skeleton` (inside `@media (forced-colors: active)`) | `border: 1px solid CanvasText` |

### Host notes

- HTML: None.
- React: `export function Skeleton(props: SkeletonProps)`; generated.
- Remix: None.
- Liquid: `{% block 'skeleton', ratio: '4/5' %}{% endblock %}`. Schema settings: `ratio`, `radius`. Locale keys: `ripple.skeleton.name`.

```tsx
<Suspense
  fallback={
    <Grid columns="2 md:4" gap={4} aria-busy="true">
      <Skeleton ratio="4/5" />
      <Skeleton ratio="4/5" />
    </Grid>
  }
>
  <Await resolve={recommended}>{(products) => <ProductGrid products={products} />}</Await>
</Suspense>
```

```liquid
{% block 'skeleton', ratio: '16/9', radius: 'lg' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4. Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: fixture `default` inside a 320 px wide container with `font-size: 16px` computes inline size 320 px and block size 16 px; fixture `media` in the same container computes 320 by 400 px; fixture `avatar` computes 320 by 320 px and `border-radius` 9999px.
3. Tier 5: with `--rp-skeleton-width: 50%` set on the root through a `style` attribute in the test page, fixture `default` computes inline size 160 px.
4. Tier 5: with `prefers-reduced-motion: no-preference` emulated the computed `animation-name` is `rp-pulse`; with `reduce` emulated it is `none`.
5. Tier 2: every fixture output has `aria-hidden="true"` on the root and no child nodes.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` section 6.3 (`ratio`, `radius`), section 8.1; `ripple/docs/03-styling-and-tokens.md` section 4.1 (`rp-pulse`), section 8 rule 2 (skeleton pulse timing), CSS-12 (system colours inside forced-colours media).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
