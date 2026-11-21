# ProductRecommendations

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `product-recommendations` |
| Kind | `commerce` |
| Category | `product` |
| Custom elements | `rp-recommendations` |
| Root element and class | `rp-recommendations` `.rp-product-recommendations` |
| Liquid tier | `resource` |
| No-JS level | `degraded` |
| Requires `id` | no |
| Depends on | `product-card` |
| Milestone | M3 |

### Purpose

A titled grid of recommended products for a product. The products are either rendered by the server or loaded once, when the element nears the viewport, by refreshing region `rp-product-recommendations`.

- Use when: showing "You may also like" on a product page.
- Do not use when: showing a merchant-chosen collection; use FeaturedCollection.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `ProductRecommendations` | `blocks/product-recommendations.liquid` | `rp-recommendations` | `rp-product-recommendations` | `data-slot="rp-recommendations"` | yes | none |
| list (region part) | `ProductRecommendationsList` | `snippets/rp-product-recommendations-list.liquid` | `div` | `rp-product-recommendations-list` | `data-rp-region="rp-product-recommendations"` | yes | none |
| title | printed by list | same | `h2` to `h6` | `rp-product-recommendations-title` | none | when there are products | none |
| items | printed by list | same | `ul` | `rp-product-recommendations-items` | none | when there are products | none |
| item | printed by list | same | `li` | `rp-product-recommendations-item` | none | one per product | none |

Nesting rules: the list is the only child of root. Each item contains exactly one ProductCard. When `products` is empty or unset the list part is printed with no children.

### Props

Root and region part take the same props, except `url` (root only). The Liquid region-part snippet `rp-product-recommendations-list` takes exactly `products` and `level`; every call passes both (D-091 item 4).

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `products` | `products` | object | `RippleProduct[]` / Liquid array of `product` drops | empty | no | no | one item per product |
| `url` | `url` | url | a URL whose response contains region `rp-product-recommendations` | none | no | no | `data-url` on root; omitted when unset |
| `level` | `level` | enum | `2 3 4 5 6` | `2` | no | no | tag of the title; ProductCards get `level` + 1 (maximum 6) |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | passed to ProductCard; TSX hosts only |

### Content model

`parts` - children (`{{ content }}`) replace the default rendering of the list region part (RS-2).

### HTML contract

Fixture `default` (no props; the lazy state before products are loaded):

```html
<rp-recommendations class="rp-product-recommendations" data-slot="rp-recommendations">
  <div class="rp-product-recommendations-list" data-rp-region="rp-product-recommendations"></div>
</rp-recommendations>
```

Fixture `lazy` (`url`: `/recommendations/products?product_id=1&limit=4&intent=related`):

```html
<rp-recommendations class="rp-product-recommendations" data-slot="rp-recommendations" data-url="/recommendations/products?product_id=1&amp;limit=4&amp;intent=related">
  <div class="rp-product-recommendations-list" data-rp-region="rp-product-recommendations"></div>
</rp-recommendations>
```

Fixture `products` (`products`: [`product.sale`]; `level`: `3`):

```html
<rp-recommendations class="rp-product-recommendations" data-slot="rp-recommendations">
  <div class="rp-product-recommendations-list" data-rp-region="rp-product-recommendations">
    <h3 class="rp-product-recommendations-title">You may also like</h3>
    <ul class="rp-product-recommendations-items">
      <li class="rp-product-recommendations-item">
        <div class="rp-product-card">
          <div class="rp-product-card-media">
            <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=1600 1600w" sizes="(min-width: 64rem) 25vw, 50vw" alt="Grey wool socks" width="1200" height="1200" loading="lazy" decoding="async" data-ratio="1/1" data-fit="cover" data-radius="none">
            <span class="rp-badge rp-product-card-badge" data-variant="solid" data-tone="sale" data-size="md">Sale</span>
          </div>
          <div class="rp-product-card-body">
            <h4 class="rp-product-card-title"><a class="rp-product-card-link" href="/products/wool-socks">Wool Socks</a></h4>
            <span class="rp-price" data-size="base" data-sale=""><span class="rp-visually-hidden">Sale price</span><span class="rp-price-current"><bdi>$12.00</bdi></span><span class="rp-visually-hidden">Regular price</span><s class="rp-price-compare"><bdi>$16.00</bdi></s></span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</rp-recommendations>
```

Further required fixtures: `class`; `invalid-enum-falls-back` (`level`: `9`, with `products`; equals `products` with title tag `h2` and card title `h3`); `escaping` (covered by `lazy`: `&` in `url` is printed `&amp;`).

Host-owned regions and masks: product URLs on Liquid carry tracking parameters (`?pr_prod_strat=...`). Masks (fixture `products`): `img` `src` and `srcset`; `.rp-price-current` and `.rp-price-compare` text; `{ "select": "a.rp-product-card-link", "op": "attr", "name": "href" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-pending`, `aria-busy` | root | `rp-recommendations` | while the region loads | absent |
| `aria-busy` | list | commerce adapter | while the region refreshes | absent |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-recommendations", "attrs": ["data-pending", "aria-busy"], "reason": "When the element is already within 400 px of the viewport at upgrade it starts loading at once." }`; `{ "select": "[data-rp-region=\"rp-product-recommendations\"]", "attrs": ["aria-busy"], "childList": true, "text": true, "subtree": true, "reason": "Same case: the region is replaced by loaded products." }`. Both apply only to fixtures with `url`.

### Behaviour with JavaScript

1. With `data-url`: when the root comes within 400 px below the viewport, once, the element sets `data-pending=""` and `aria-busy="true"` and calls `getCommerce().refresh(["rp-product-recommendations"], { url, reason: "recommendations" })`; then it removes both attributes.
2. Without `data-url` the element does nothing.
3. A failed load leaves the page unchanged: no navigation, no error message.
4. The element runs once per connection; a replaced region does not trigger a second load.

### Behaviour without JavaScript

The server-rendered content of the list stays: products when the server rendered them, nothing in the lazy case. Missing: lazy loading. A server that can render recommendations inline (hydrogen backend) SHOULD pass `products` and omit `url`, which makes the component fully functional without JavaScript.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `rp:refresh` | `document` (adapter) | `{ regions: ["rp-product-recommendations"], url, reason: "recommendations" }` | none |
| event | `rp:refreshed` | `document` (adapter) | `{ regions, ok }` | none |

### Accessibility

- Pattern: heading plus list of links; `checkPattern`: none.
- Accessible name: the title heading.
- Focus: never moved.
- Announcements: None.

| Key | Action |
|---|---|
| None | |

### Styling

- File: `components/product-recommendations/product-recommendations.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--text-2xl`, `--breakpoint-md`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-product-recommendations-columns` | `2` (from 48rem: `4`) | number of grid columns |
| `--rp-product-recommendations-gap` | `calc(var(--spacing) * 4)` | grid gap |

| Modifier selector | Sets |
|---|---|
| `.rp-product-recommendations[data-pending]` | nothing; reserved for project CSS |

Required rules: items `display: grid; grid-template-columns: repeat(var(--rp-product-recommendations-columns), minmax(0, 1fr)); gap: var(--rp-product-recommendations-gap); list-style: none; padding: 0; margin: 0`; `.rp-product-recommendations-list:empty { display: none }`. `base.css` carries `rp-recommendations { display: block }` (generated).

### Host notes

- HTML: None.
- React: `ProductRecommendations(props: { products?: RippleProduct[]; url?: string; level?: 2 | 3 | 4 | 5 | 6; locale?: string; strings?: { title?: string }; className?: string; children?: ReactNode })` and the region part `ProductRecommendationsList` (complete code below) are exported from the same file. The file starts with `"use client";` because the region part calls a hook, and it exports components only (D-094). On `react` the adapter's strategy for reason `recommendations` fetches `data-url`, takes the inner HTML of the region `rp-product-recommendations` from the response and publishes it; `ProductRecommendationsList` reads it with `useRegionHtml("rp-product-recommendations")` from `<pkg>/react` (D-090). While the hook returns `null` the part renders its server children from the `products` prop; afterwards it renders the HTML string with `dangerouslySetInnerHTML` on the region root. There is no navigation. UNVERIFIED (SPIKE-10); see `Fallback (SPIKE-10)`.

  `components/product-recommendations/react/product-recommendations.tsx` MUST contain this region part unchanged (`__PKG__` is replaced by the package name at install):

  ```tsx
  "use client";

  import type { RippleProduct } from "__PKG__";
  import { useRegionHtml } from "__PKG__/react";
  import { ProductCard } from "./product-card";

  const LEVELS = [2, 3, 4, 5, 6] as const;
  type Level = (typeof LEVELS)[number];

  export interface ProductRecommendationsListProps {
    products?: RippleProduct[];
    level?: Level;
    locale?: string;
    strings?: { title?: string };
  }

  export function ProductRecommendationsList(props: ProductRecommendationsListProps) {
    const { products = [], locale = "en-US", strings = {} } = props;
    const level: Level = LEVELS.includes(props.level as Level) ? (props.level as Level) : 2;
    const html = useRegionHtml("rp-product-recommendations");

    if (html !== null) {
      return (
        <div
          className="rp-product-recommendations-list"
          data-rp-region="rp-product-recommendations"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    if (products.length === 0) {
      return <div className="rp-product-recommendations-list" data-rp-region="rp-product-recommendations" />;
    }

    const Title = `h${level}` as "h2";
    const cardLevel = Math.min(level + 1, 6) as Level;
    return (
      <div className="rp-product-recommendations-list" data-rp-region="rp-product-recommendations">
        <Title className="rp-product-recommendations-title">{strings.title ?? "You may also like"}</Title>
        <ul className="rp-product-recommendations-items">
          {products.map((product) => (
            <li className="rp-product-recommendations-item" key={product.id}>
              <ProductCard product={product} level={cardLevel} locale={locale} />
            </li>
          ))}
        </ul>
      </div>
    );
  }
  ```
- Remix: prop `rmxKey?: string` prints `data-rmx-key` on the root (omitted when unset; CV-5, D-034); `data-rmx-preserve-attrs="data-pending aria-busy"` on the root.
- Liquid: the block prints the root and renders `rp-product-recommendations-list` as default body. The list snippet prints the title and items only when `products.size > 0`. The template builds the URL and declares the partial (example below). No schema settings. Locale key: `ripple.product-recommendations.title` = `You may also like`.

```tsx
<ProductRecommendations products={recommended} level={2} />
```

```liquid
{% liquid
  assign rec_url = routes.product_recommendations_url | append: '?product_id=' | append: product.id | append: '&limit=4&intent=related'
%}
{% block 'product-recommendations', url: rec_url %}
  {% partial 'rp-product-recommendations' %}{% render 'rp-product-recommendations-list', products: recommendations.products, level: 2 %}{% endpartial %}
{% endblock %}
```

### Commerce

- Store fields read: none.
- Adapter methods called: `refresh`, `usable`.
- Regions refreshed: `rp-product-recommendations` (fixed; this component has no `refresh` prop).
- Pending and error behaviour: `data-pending` / `aria-busy` on the root while loading; failures are silent ([05-commerce.md](05-commerce.md) section 7.5).

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Products | `productRecommendations(productId:, intent: RELATED)` in the page loader; pass `products`, omit `url` | `recommendations.products` inside the partial; populated only for the request to `routes.product_recommendations_url` (SPIKE-09) |
| `url` | omitted (or an app route that renders the region) | `{{ routes.product_recommendations_url }}?product_id={{ product.id }}&limit=4&intent=related` |

### Agent surface

`accessibility-tree` (links). Bridge: component `rp-recommendations`, manifest `agent.actions`: `[]` with `shown: () => false`, so the bridge does not list it ([08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.2). Confirm: none. Secret: none.

### Checker rules

RP101 (`level`), RP308 (the name `rp-product-recommendations` has a region on the page), RP403 (Liquid: partial `rp-product-recommendations` declared). Manifest `rules[]`: `product-recommendations-region` (`requires-descendant`, selector `:scope`, target `[data-rp-region="rp-product-recommendations"]`).

### Acceptance tests

1. Tier 2: fixtures `default`, `lazy`, `products`, `class`, `invalid-enum-falls-back` are canonical-equal in all four hosts with the masks above.
2. Tier 5: test C-15 of [05-commerce.md](05-commerce.md) (one request when scrolled within 400 px; region replaced; a failing request leaves the URL unchanged).
3. Tier 3: fixture `default` and `products` (no `url`): zero mutations at upgrade.
4. Tier 6: fixture `products` with scripting disabled shows one product link that navigates.
5. Tier 8 (blocked until a preview store exists): SPIKE-09 procedure below.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/05-commerce.md` section 7.5; `ripple/docs/research/spikes/commerce/result.txt` (H7); Shopify docs tool, Liquid object `recommendations` ("returns products only when rendered in a section using the Product Recommendations API and the Section Rendering API").
- UNVERIFIED: whether a `{% partial %}` fetched from `routes.product_recommendations_url` populates `recommendations` (SPIKE-09). The docs sentence quoted above suggests it may not. `useRegionHtml` on the `react` host (SPIKE-10; D-090 item 4).

### Fallback (SPIKE-09)

SPIKE-09 procedure (preview store): call `partials.fetch("rp-product-recommendations", { url: "<routes.product_recommendations_url>?product_id=<id>&limit=4&intent=related" })` on a product page of the Ripple theme and apply it. Pass: the region contains at least one ProductCard for a product that has recommendations.

If it fails, the liquid backend changes as follows and nothing changes on the hydrogen backend:

1. The Liquid product blueprint MUST NOT call `product-recommendations`. It calls FeaturedCollection ([12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md)) with a merchant-chosen collection instead (theme setting `rp_related_collection`, type `collection`, owned by doc 14). The section title is the collection's own title, which FeaturedCollection prints; the block is called with `limit: 4` and no children (doc 12 owns the call, section "product" blueprint).
2. `blocks/product-recommendations.liquid` and `snippets/rp-product-recommendations-list.liquid` stay in the registry (they still serve a template that passes `products` explicitly, for example from a metafield list of products); the `url` param is documented as "not supported on Liquid".
3. Fixture `lazy` gets `"hosts": ["html", "react", "remix"]`.

### Fallback (SPIKE-10)

Applies only to the `react` host and only when SPIKE-10 fails (D-090 item 4). Nothing changes in the other hosts.

1. `ProductRecommendationsList` does not call `useRegionHtml`; it always renders its `products` prop.
2. The React app either passes `products` from its loader and omits `url` (preferred; no request is made), or handles `rp:refresh` on `document`: when `event.detail.reason === "recommendations"` it calls `event.preventDefault()`, fetches its own recommendations route, and passes the result as the `products` prop.

---
