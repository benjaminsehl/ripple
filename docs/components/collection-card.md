# CollectionCard

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `collection-card` |
| Kind | `static` |
| Category | `product` |
| Custom elements | none |
| Root element and class | `div` `.rp-collection-card` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `image`, `placeholder` |
| Milestone | M3 |

### Purpose

A collection summary: image and title link.

- Use when: listing collections (collections list page, home page tiles).
- Do not use when: listing products; use ProductCard.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CollectionCard` | `blocks/collection-card.liquid` | `div` | `rp-collection-card` | none | yes | none |
| media | printed by root | same | `div` | `rp-collection-card-media` | none | yes | none |
| title | printed by root | same | `h2` to `h6` | `rp-collection-card-title` | none | yes | none |
| link | printed by root | same | `a` | `rp-collection-card-link` | none | yes | none |

Nesting rules: media then title are the only children of root. The link is the only child of title. MUST NOT be placed inside an `<a>` or a `<button>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `collection` | `collection` | object | `RippleCollection` / Liquid `collection` drop | none | yes | no | text, `href`, Image |
| `level` | `level` | enum | `2 3 4 5 6` | `3` | no | no | the tag of the title part |
| `ratio` | `ratio` | enum | `auto 1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9` | `1/1` | no | no | `data-ratio` on the embedded Image or Placeholder |
| `sizes` | `sizes` | string | any `sizes` value | `(min-width: 64rem) 33vw, 50vw` | no | no | `sizes` on the embedded Image |
| `loading` | `loading` | enum | `lazy eager` | `lazy` | no | no | `loading` on the embedded Image |

### Content model

`none` in TSX hosts. Liquid: `{{ content }}`, when not blank, replaces every child of the root (CV-6).

### HTML contract

Fixture `default` (`collection`: `collection.basic`):

```html
<div class="rp-collection-card">
  <div class="rp-collection-card-media">
    <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/summer.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/summer.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/summer.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/summer.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/summer.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/summer.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/summer.jpg?width=1600 1600w" sizes="(min-width: 64rem) 33vw, 50vw" alt="Beach at noon" width="1600" height="1200" loading="lazy" decoding="async" data-ratio="1/1" data-fit="cover" data-radius="none">
  </div>
  <h3 class="rp-collection-card-title"><a class="rp-collection-card-link" href="/collections/summer">Summer</a></h3>
</div>
```

Further required fixtures: `class`; `invalid-enum-falls-back` (`level`: `9`; equals `default`); `escaping` (`sizes`: `Say "hi" & <go>`); `props` (`level`: `2`, `ratio`: `3/2`, `loading`: `eager`; title tag `h2`, `data-ratio="3/2"`, `loading="eager"`). A collection without an image prints `<div class="rp-placeholder" data-ratio="1/1" data-radius="none" aria-hidden="true"></div>` in place of the `<img>` (no shared fixture; covered by a host unit test).

Host-owned regions and masks: no host-owned region. Masks: `img` `src` (`attr`) and `srcset` (`srcset`).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| None. | | | | |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None.

### Behaviour without JavaScript

Everything works: the title link navigates to the collection page; the whole card is clickable through the link's `::after`.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: native link inside a heading; `checkPattern`: none.
- Accessible name: the link text (collection title); required.
- Focus: one tab stop per card.
- Announcements: None.

| Key | Action |
|---|---|
| Enter | follows the link |

### Styling

- File: `components/collection-card/collection-card.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--radius-surface`, `--color-foreground`, `--color-ring`, `--text-lg`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-collection-card-gap` | `calc(var(--spacing) * 3)` | space between media and title |
| `--rp-collection-card-radius` | `var(--radius-surface)` | corner radius of the media |

| Modifier selector | Sets |
|---|---|
| None. | |

Required rules: the same overlay-link and focus rules as ProductCard, with the `rp-collection-card-` classes.

### Host notes

- HTML: None.
- React: `CollectionCard(props: { collection: RippleCollection; level?: 2 | 3 | 4 | 5 | 6; ratio?: Ratio; sizes?: string; loading?: "lazy" | "eager"; className?: string })`. No hook.
- Remix: None.
- Liquid: markup in `blocks/collection-card.liquid` (not embedded by another file). Image: `{% render 'rp-image', image: collection.image, sizes: sizes, loading: loading, ratio: ratio %}`; when `collection.image == blank` render Placeholder (`{% render 'rp-placeholder', ratio: ratio %}`). No schema settings. No locale keys.

```tsx
<CollectionCard collection={collection} ratio="3/2" />
```

```liquid
{% block 'collection-card', collection: collection, ratio: '3/2' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP101, RP104 (`collection`), RP110, RP203. Manifest `rules[]`: `collection-card-not-in-link` (`forbids-ancestor`, selector `:scope`, target `a, button`).

### Acceptance tests

1. Tier 2: fixtures `default`, `class`, `invalid-enum-falls-back`, `escaping`, `props` are canonical-equal in all four hosts.
2. Tier 6: with scripting disabled a click on the image navigates to the collection URL.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/templates/list-collections.liquid`; `ripple/docs/research/base-theme.md`.
- UNVERIFIED: Storefront API field names of `RippleCollectionCard` (section 0.6).

### Fallback (SPIKE-nn)

None.

---
