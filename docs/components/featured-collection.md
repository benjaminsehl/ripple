# FeaturedCollection

> Component spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `featured-collection` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none (`rp-carousel` when `layout="carousel"`) |
| Root element and class | `section` `.rp-featured-collection` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `grid`, `product-card`, `carousel`, `link` |
| Milestone | M4 |

### Purpose

A titled band of products from one collection, as a grid or as a carousel, with a "View all" link to the collection.

- Use when: merchandising a collection on the home page or any content page.
- Do not use when: rendering the collection page itself with filters and pagination (use blueprint `collection`: Grid and ProductCard inside the results region).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `FeaturedCollection` | `blocks/featured-collection.liquid` | `section` | `rp-featured-collection` | none | yes | none |
| header | none (printed by root) | same file | `div` | `rp-featured-collection-header` | none | yes | none |
| title | none (printed by root) | same file | `h2` (or `h1` to `h6` by `level`) | `rp-featured-collection-title` | none | yes | none |
| link | none (printed by root) | same file | `a` | `rp-featured-collection-link` | none | yes | none |
| items | none (printed by root) | same file | `div` (Grid) or `rp-carousel` (Carousel) | `rp-grid` or `rp-carousel` | per the embedded component | yes | Carousel: `<carousel>` and `<carousel>-list` |

Nesting rules: root contains `header` then `items`. `header` contains `title` then `link`. With `layout="grid"`, `items` is a Grid whose children are ProductCards (or the caller's children). With `layout="carousel"`, `items` is a Carousel (`10-components-interactive.md`) with one carousel item per product; children cannot replace the items in this layout.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `collection` | `collection` | object | `RippleCollection` (`05-commerce.md` 11.1); Liquid: a collection drop | none | yes | no | `title` text; `href` of `link` |
| `products` | none (reads `collection.products`) | object | `RippleProduct[]` | `[]` | no | no | default body: one ProductCard per product |
| `limit` | `limit` | number | integer 1 to 12 | `4` | no | no | number of products rendered (TSX: `products.slice(0, limit)`; Liquid: `for ... limit: limit`) |
| `layout` | `layout` | enum | `grid`, `carousel` | `grid` | no | no | `data-layout` on root; chooses the `items` component |
| `columns` | `columns` | scale | `1 2 3 4 5 6 12` | `2 lg:4` | no | yes | `data-columns` on the Grid (ignored for `carousel`) |
| `carousel` | `carousel` | id | any id | none | yes when `layout="carousel"` | no | `id` of the embedded Carousel |
| `level` | `level` | enum | `1 2 3 4 5 6` | `2` | no | no | the tag of `title` |
| `strings` | none | object | key `viewAll` | `"View all"` | no | no | TSX hosts only |

`products` has `hosts: ["html", "react", "remix"]`.

### Content model

`flow`, restricted - the default body of `items` is one ProductCard per product. With `layout="grid"`, children replace the ProductCards inside the Grid. With an empty product list and no children the component prints NOTHING (an empty merchandising band MUST NOT be shown).

### HTML contract

Fixture `default` (`collection: { title: "Featured", url: "/collections/featured" }`, children: `<p>Item</p>`):

```html
<section class="rp-featured-collection" data-layout="grid">
  <div class="rp-featured-collection-header">
    <h2 class="rp-featured-collection-title">Featured</h2>
    <a class="rp-featured-collection-link" href="/collections/featured">View all</a>
  </div>
  <div class="rp-grid" data-columns="2 lg:4" data-gap="4 md:6"><p>Item</p></div>
</section>
```

Fixture `default-body` (same collection, `products: [product.basic]`, `level: 3`, `columns: "2 md:3"`). The ProductCard subtree is a copy of the `default` fixture of ProductCard in `11-components-commerce.md` for `product.basic` (D-069); FeaturedCollection passes no prop to ProductCard other than `product`:

```html
<section class="rp-featured-collection" data-layout="grid">
  <div class="rp-featured-collection-header">
    <h3 class="rp-featured-collection-title">Featured</h3>
    <a class="rp-featured-collection-link" href="/collections/featured">View all</a>
  </div>
  <div class="rp-grid" data-columns="2 md:3" data-gap="4 md:6">
    <div class="rp-product-card"><div class="rp-product-card-media"><img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=600" srcset="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=300 300w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=900 900w" sizes="(min-width: 64rem) 25vw, 50vw" alt="Linen shirt on a hanger" width="1200" height="1200" loading="lazy" data-ratio="1/1" data-fit="cover"></div><div class="rp-product-card-body"><h3 class="rp-product-card-title"><a class="rp-product-card-link" href="/products/linen-shirt">Linen Shirt</a></h3><span class="rp-price" data-size="base"><span class="rp-price-current"><bdi>$48.00</bdi></span></span></div></div>
  </div>
</section>
```

Fixture `carousel` (`layout: "carousel"`, `carousel: "featured"`, `products: [product.basic]`): root has `data-layout="carousel"`; `items` is:

```html
<rp-carousel class="rp-carousel" id="featured" role="group" aria-roledescription="carousel" aria-label="Featured" data-slot="rp-carousel">
  <button class="rp-carousel-control" type="button" disabled aria-controls="featured-list" aria-label="Previous" data-rp-part="prev" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
  <ul class="rp-carousel-viewport" id="featured-list" tabindex="0" data-rp-part="viewport">
    <li class="rp-carousel-item" data-rp-part="item"><div class="rp-product-card"><div class="rp-product-card-media"><img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=600" srcset="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=300 300w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=900 900w" sizes="(min-width: 64rem) 25vw, 50vw" alt="Linen shirt on a hanger" width="1200" height="1200" loading="lazy" data-ratio="1/1" data-fit="cover"></div><div class="rp-product-card-body"><h3 class="rp-product-card-title"><a class="rp-product-card-link" href="/products/linen-shirt">Linen Shirt</a></h3><span class="rp-price" data-size="base"><span class="rp-price-current"><bdi>$48.00</bdi></span></span></div></div></li>
  </ul>
  <button class="rp-carousel-control" type="button" aria-controls="featured-list" aria-label="Next" data-rp-part="next" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
</rp-carousel>
```

The Carousel markup is a copy of the `default` fixture of `10-components-interactive.md` `## Carousel` (control class `rp-carousel-control`, D-016). The Carousel's `aria-label` is the collection title.

Fixture `empty` (`products: []`, no children): the reference HTML is the empty string.

Fixture `invalid-enum-falls-back` (`layout: "masonry"`, children as `default`): equal to `default`.

Fixture `responsive` (`columns: "1 sm:2 lg:4"`, children as `default`): the Grid has `data-columns="1 sm:2 lg:4"`.

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-featured-collection custom-a custom-b`.

Host-owned regions and masks: those of ProductCard (image `src`, `srcset`, money text) as defined in `11-components-commerce.md`; the Carousel upgrade allow-list of `10-components-interactive.md` applies to fixture `carousel`.

Kind note (D-085): `kind` is `static`; the `default` fixture passes children, so it contains no custom element. `dependencies.embeds` is `["grid", "product-card", "carousel"]` (D-070); `dependencies.components` additionally lists `link`. Listing `carousel` makes the CLI install the Carousel component, whose own manifest names the element `rp-carousel`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| none of its own | none | none | none | none |

Carousel state (`disabled` on the buttons) is owned by Carousel.

Upgrade allow-list (mutations permitted when the element upgrades): none of its own; Carousel's entry for the `next` button applies in fixture `carousel`.

### Behaviour with JavaScript

1. `layout="grid"`: none.
2. `layout="carousel"`: the behaviour of Carousel (`04-elements.md` 9.2): previous and next buttons page the list; `indexchange` is dispatched on the `rp-carousel` root.

### Behaviour without JavaScript

`grid`: identical. `carousel`: the list scrolls and snaps natively; the two buttons are invisible (`data-rp-js="inflow"`) and keep their space. Every product link and the "View all" link work. The component's level is `full` because every function of FeaturedCollection itself (seeing the products, following links) works; the embedded Carousel keeps its own level `degraded`.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `indexchange` | the embedded `rp-carousel` (carousel layout only) | per Carousel | none on FeaturedCollection; listen on the element |

### Accessibility

- Pattern: native `<section>` with a heading; `checkPattern`: none.
- Accessible name: none on the root. The text of `link` is the locale key `ripple.featured-collection.view_all` ("View all"); the heading that precedes it in reading order says which collection it belongs to. No `aria-label` is printed.
- Focus: none.
- Announcements: None.

| Key | Action |
|---|---|
| Tab | Through the links (and, in carousel layout, the viewport and buttons per Carousel) |

### Styling

- File: `components/featured-collection/featured-collection.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--text-2xl`, `--text-sm`, `--font-heading`, `--color-foreground`, `--color-link`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-featured-collection-gap` | `calc(var(--spacing) * 6)` | Gap between `header` and `items` |

| Modifier selector | Sets |
|---|---|
| none | none (`data-layout` only selects the embedded component; it has no CSS of its own) |

Required rules: root `display: flex; flex-direction: column; gap: var(--rp-featured-collection-gap)`; `header` `display: flex; align-items: baseline; justify-content: space-between; gap: calc(var(--spacing) * 4)`; `title` `margin: 0; font-family: var(--font-heading); font-size: var(--text-2xl)`; `link` `font-size: var(--text-sm); color: var(--color-link); white-space: nowrap; min-block-size: 1.5rem; display: inline-flex; align-items: center`. The root has no inline padding: place it inside a Container.

### Host notes

- Binding paths (D-139): `static` that the template language of `07-manifest-registry-cli.md` 2.3 cannot express (D-072 row 2): no `template`; every fixture is `generated: "hand"`; `html` is generated from the fixture files; the `react`, `remix` and `liquid` files are hand-written with their generated regions. Where a line below says a binding is "generated", this line wins.
- HTML: copy the fixture.
- React: `export function FeaturedCollection(props: FeaturedCollectionProps): JSX.Element | null`. No hook. Returns `null` for the empty case.
- Remix: none of its own (Carousel prints its own `data-rmx-*`).
- Liquid: block `featured-collection`; renders `rp-product-card` and, for the carousel layout, `rp-carousel` (both are snippets because this block embeds them; `07-manifest-registry-cli.md` `liquid.embeddedBy`). Schema settings: `layout` (select). Locale keys: `ripple.featured-collection.name`, `ripple.featured-collection.view_all` ("View all"). `{{ attributes }}` is printed LAST in the root's opening tag (D-035). Block name `t:ripple.featured-collection.name`; setting labels `t:ripple.props.<prop name>`, option labels `t:ripple.props.<value>` (D-038).

```tsx
<FeaturedCollection collection={collection} products={products} limit={4} />
```

```liquid
{% block 'featured-collection', collection: collections.frontpage, limit: 4 %}{% endblock %}
```

Liquid default body for the grid layout (inside the block file, in the `{% else %}` branch of `{% if content != blank %}`):

```liquid
{%- for product in collection.products limit: limit -%}
  {% render 'rp-product-card', product: product %}
{%- endfor -%}
```

Liquid `limit` guard (before first use): `assign limit = limit | default: 4`.

### Commerce

None. (ProductCard is static; FeaturedCollection binds no store and requests no refresh.)

### Agent surface

`accessibility-tree` for the grid layout. In carousel layout the bridge additionally sees the `rp-carousel` primitive through the Carousel component. Actions: none of its own. Confirm: none. Secret: none.

### Checker rules

- RP113 structure rule `featured-collection-carousel-needs-id` (source layer): `layout="carousel"` without `carousel` is an error.
- RP101 (unknown `layout` value, invalid `columns` token), RP114 (the Carousel id is unique in the document).

### Acceptance tests

- **AT-1** Tier 2: fixtures `default`, `default-body`, `carousel`, `empty`, `invalid-enum-falls-back`, `responsive`, `class` conform in all four hosts (ProductCard masks applied).
- **AT-2** Tier 3: fixture `carousel`: zero mutations outside the Carousel allow-list; other fixtures: zero mutations.
- **AT-3** Tier 5: grid layout shows 2 columns at 375 px and 4 columns at 1280 px with the default `columns`.
- **AT-4** Tier 6: with JavaScript disabled, in carousel layout the viewport scrolls horizontally (`scrollWidth > clientWidth` with 6 products at 375 px) and both buttons have computed `visibility: hidden`.
- **AT-5** Tier 6: clicking the "View all" link navigates to the collection URL.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/blocks/featured-collection.liquid`; `ripple/theme/templates/index.liquid` (featured collection grid written out at the call site); `ripple/docs/research/base-theme.md` 3.1 item 3 (product card written six times); ledger 8.4 (`layout="carousel"`), 8.7 (ProductGrid cut in favour of Grid and FeaturedCollection); `04-elements.md` 10.9.
- UNVERIFIED: the ProductCard and Carousel markup printed above (owned by docs 11 and 10; section 1.1).

### Fallback (SPIKE-nn)

None.

---

---
