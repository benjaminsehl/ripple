# ProductCard

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `product-card` |
| Kind | `static` |
| Category | `product` |
| Custom elements | none |
| Root element and class | `div` `.rp-product-card` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `image`, `placeholder`, `badge`, `price` |
| Milestone | M3 |

### Purpose

A product summary for grids and carousels: image, optional badge, optional vendor, title link and price.

- Use when: showing a product in a list (collection grid, search results, recommendations, featured collection).
- Do not use when: selling the product on its own page; use ProductGallery, VariantPicker and ProductForm instead.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `ProductCard` | `blocks/product-card.liquid` + `snippets/rp-product-card.liquid` | `div` | `rp-product-card` | none | yes | none |
| media | printed by root | same | `div` | `rp-product-card-media` | none | yes | none |
| badge | printed by root | same | `span` | `rp-badge rp-product-card-badge` | none | no | none |
| body | printed by root | same | `div` | `rp-product-card-body` | none | yes | none |
| vendor | printed by root | same | `p` | `rp-product-card-vendor` | none | no | none |
| title | printed by root | same | `h2` to `h6` | `rp-product-card-title` | none | yes | none |
| link | printed by root | same | `a` | `rp-product-card-link` | none | yes | none |

Nesting rules: media and body are the only children of root, in that order. Inside media: one Image (or one Placeholder when the product has no image), then the badge. Inside body, in order: vendor, title, Price. The link is the only child of title. A ProductCard MUST NOT be placed inside an `<a>` or a `<button>`. The markup lives in `snippets/rp-product-card.liquid` because ProductRecommendations, PredictiveSearch and FeaturedCollection embed it (manifest `liquid.embeddedBy`).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `product` | `product` | object | `RippleProduct` / Liquid `product` drop | none | yes | no | text, `href`, Image, Price, badge |
| `level` | `level` | enum | `2 3 4 5 6` | `3` | no | no | the tag of the title part: `h<level>` |
| `ratio` | `ratio` | enum | `auto 1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9` | `1/1` | no | no | `data-ratio` on the embedded Image or Placeholder |
| `sizes` | `sizes` | string | any `sizes` value | `(min-width: 64rem) 25vw, 50vw` | no | no | `sizes` on the embedded Image |
| `loading` | `loading` | enum | `lazy eager` | `lazy` | no | no | `loading` on the embedded Image |
| `showVendor` | `show_vendor` | boolean | `true false` | `false` | no | no | `data-show-vendor=""` on root, and the vendor part |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | passed to Price (CV-1); TSX hosts only |

### Content model

`none` in TSX hosts. Liquid: `{{ content }}`, when not blank, replaces every child of the root (CV-6); the caller then writes the whole card body.

### HTML contract

Fixture `default` (`product`: `product.basic`):

```html
<div class="rp-product-card">
  <div class="rp-product-card-media">
    <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1600 1600w" sizes="(min-width: 64rem) 25vw, 50vw" alt="Linen shirt on a hanger" width="1200" height="1200" loading="lazy" decoding="async" data-ratio="1/1" data-fit="cover" data-radius="none">
  </div>
  <div class="rp-product-card-body">
    <h3 class="rp-product-card-title"><a class="rp-product-card-link" href="/products/linen-shirt">Linen Shirt</a></h3>
    <span class="rp-price" data-size="base"><span class="rp-price-current"><bdi>$48.00</bdi></span></span>
  </div>
</div>
```

Fixture `sale` (`product`: `product.sale`, `showVendor`: true, `level`: `2`):

```html
<div class="rp-product-card" data-show-vendor="">
  <div class="rp-product-card-media">
    <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=1600 1600w" sizes="(min-width: 64rem) 25vw, 50vw" alt="Grey wool socks" width="1200" height="1200" loading="lazy" decoding="async" data-ratio="1/1" data-fit="cover" data-radius="none">
    <span class="rp-badge rp-product-card-badge" data-variant="solid" data-tone="sale" data-size="md">Sale</span>
  </div>
  <div class="rp-product-card-body">
    <p class="rp-product-card-vendor">Acme</p>
    <h2 class="rp-product-card-title"><a class="rp-product-card-link" href="/products/wool-socks">Wool Socks</a></h2>
    <span class="rp-price" data-size="base" data-sale=""><span class="rp-visually-hidden">Sale price</span><span class="rp-price-current"><bdi>$12.00</bdi></span><span class="rp-visually-hidden">Regular price</span><s class="rp-price-compare"><bdi>$16.00</bdi></s></span>
  </div>
</div>
```

Fixture `sold-out` (`product`: `product.sold-out`, `ratio`: `4/5`):

```html
<div class="rp-product-card">
  <div class="rp-product-card-media">
    <div class="rp-placeholder" data-ratio="4/5" data-radius="none" aria-hidden="true"></div>
    <span class="rp-badge rp-product-card-badge" data-variant="solid" data-tone="neutral" data-size="md">Sold out</span>
  </div>
  <div class="rp-product-card-body">
    <h3 class="rp-product-card-title"><a class="rp-product-card-link" href="/products/canvas-tote">Canvas Tote</a></h3>
    <span class="rp-price" data-size="base"><span class="rp-price-current"><bdi>$48.00</bdi></span></span>
  </div>
</div>
```

Further required fixtures: `class` (root class `rp-product-card custom-a custom-b`); `invalid-enum-falls-back` (`level`: `9`; HTML equals `default`); `escaping` (`sizes`: `Say "hi" & <go>`; the `sizes` attribute is `Say &quot;hi&quot; &amp; &lt;go&gt;`); `eager` (`loading`: `eager`; `loading="eager"` on the image).

Badge rule: when the product is not available the badge is `Sold out` with `data-tone="neutral"`; otherwise, when the compare-at price is greater than the price, the badge is `Sale` with `data-tone="sale"`; otherwise no badge is printed.

Host-owned regions and masks: no host-owned region. Masks: `{ "select": "img", "op": "attr", "name": "src" }`, `{ "select": "img", "op": "srcset", "name": "srcset" }` (fixtures with an image); `{ "select": ".rp-price-current", "op": "text" }`; `{ "select": ".rp-price-compare", "op": "text" }` (fixture `sale`).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-show-vendor` | root | server | `showVendor` is true | `""` or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None. The card is a link; no script touches it.

### Behaviour without JavaScript

Everything works: the title link navigates to the product page. The whole card is clickable through CSS (the link's `::after` covers the card).

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: native link inside a heading; `checkPattern`: none.
- Accessible name: the link text (the product title); required. The image `alt` is the product image's alt text, or the empty string when it has none.
- Focus: one tab stop per card (the link). The focus ring is drawn by the link's `::after` and therefore surrounds the whole card.
- Announcements: None.

| Key | Action |
|---|---|
| Enter | follows the link |

### Styling

- File: `components/product-card/product-card.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--radius-surface`, `--color-foreground`, `--color-muted-foreground`, `--color-ring`, `--text-sm`, `--text-base`, `--rp-duration-base`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-product-card-gap` | `calc(var(--spacing) * 3)` | space between media and body |
| `--rp-product-card-radius` | `var(--radius-surface)` | corner radius of the media |
| `--rp-product-card-badge-inset` | `calc(var(--spacing) * 2)` | distance of the badge from the media's start and top edges |

| Modifier selector | Sets |
|---|---|
| `.rp-product-card[data-show-vendor]` | nothing; reserved for project CSS |

Required rules: root `position: relative; display: flex; flex-direction: column; gap: var(--rp-product-card-gap)`; `.rp-product-card-media { position: relative; overflow: hidden; border-radius: var(--rp-product-card-radius) }`; `.rp-product-card-badge { position: absolute; inset-block-start: var(--rp-product-card-badge-inset); inset-inline-start: var(--rp-product-card-badge-inset) }`; `.rp-product-card-link::after { content: ""; position: absolute; inset: 0 }`; `.rp-product-card-link:focus-visible { outline: none }` together with `.rp-product-card-link:focus-visible::after { outline: 2px solid var(--color-ring); outline-offset: 2px; border-radius: var(--rp-product-card-radius) }`.

### Host notes

- HTML: copy the contract; write the formatted price by hand.
- React: `ProductCard(props: { product: RippleProduct; level?: 2 | 3 | 4 | 5 | 6; ratio?: Ratio; sizes?: string; loading?: "lazy" | "eager"; showVendor?: boolean; locale?: string; className?: string })`. No hook, no `"use client"`. Sale test: `product.compareAtPrice !== null && Number(product.compareAtPrice.amount) > Number(product.price.amount)`. The badge composes Badge by contract (D-070; class pair `rp-badge rp-product-card-badge`, section 0.2): the binding prints the `<span>` itself with Badge's `data-variant`, `data-tone`, `data-size`. Image: the embedded Image, `<Image image={product.featuredImage} sizes={sizes} loading={loading} ratio={ratio} />`; Image prints `src` (width 800) and the six-width `srcset` itself (doc 09). The binding MUST NOT build image URLs.
- Remix: same props with `class`; no `data-rmx-*` attribute.
- Liquid: `snippets/rp-product-card.liquid` holds the markup; `blocks/product-card.liquid` is the thin wrapper (L-3). Sale test: `product.compare_at_price > product.price`. Image: `{% render 'rp-image', image: product.featured_image, sizes: sizes, loading: loading, ratio: ratio %}`; the Image snippet prints `src` (width 800) and the six-width `srcset` (doc 09). The root prints `{{ attributes }}` last (D-035). No schema settings. Locale keys: `ripple.product-card.sale` = `Sale`; `ripple.product-card.sold_out` = `Sold out`.

```tsx
<ProductCard product={product} level={2} showVendor />
```

```liquid
{% block 'product-card', product: product, level: '2', show_vendor: true %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP101 (`level`, `ratio`, `loading` values), RP104 (`product` missing), RP110 (class on a wrong tag), RP203 (embedded Image has `alt`, `width`, `height`). Manifest `rules[]`: `product-card-not-in-link` (`forbids-ancestor`, selector `:scope`, target `a, button`; message: "A ProductCard is inside a link or button; its own link is then nested interactive content.").

### Acceptance tests

1. Tier 2: fixtures `default`, `sale`, `sold-out`, `class`, `invalid-enum-falls-back`, `escaping`, `eager` are canonical-equal in all four hosts with the masks above.
2. Tier 5: in Chromium, a click at the centre of the image navigates to the product URL (the `::after` overlay works), and Tab reaches exactly one element per card.
3. Tier 6: with scripting disabled the same click navigates.
4. Tier 5: the computed `inline-size` of the badge box is inside the media box in both `dir="ltr"` and `dir="rtl"`.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/research/base-theme.md` (product card written six times; card composition); `ripple/theme/templates/collection.liquid`; `hydrogen/packages/hydrogen/skills/hydrogen-image/SKILL.md`.
- UNVERIFIED: Storefront API field names of `RippleProductCard` (section 0.6).

### Fallback (SPIKE-nn)

None.

---
