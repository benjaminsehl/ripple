# Blueprint: `product`

> Blueprint spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its sections 1 (shared definitions) and 2 (blueprint conventions) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

### Purpose

A product page: gallery, vendor, title, variant picker, price, add-to-cart form, description and recommendations. The selected variant lives in the URL (ledger D-047).

### Regions

`rp-product-media` (inside ProductGallery), `rp-product-buy` (owned by this blueprint: price and form), `rp-product-recommendations` (inside ProductRecommendations).

### Components used

`add-to-cart-button`, `container`, `grid`, `heading`, `price`, `product-form`, `product-gallery`, `product-recommendations`, `rich-text`, `stack`, `text`, `variant-picker`. (`add-to-cart-button` is listed because ProductForm's default body renders it and the CLI installs listed components.)

### Structure

```text
Container py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Grid columns="1 md:2" gap="8 md:12"
   │  ├─ ProductGallery id="product-gallery"             contains region rp-product-media; first image eager
   │  └─ Stack gap="4"
   │     ├─ Text variant="overline" tone="muted"         vendor (when present)
   │     ├─ Heading level 1                              title
   │     ├─ VariantPicker id="product-options"           outside every region; data-rp-refresh="rp-product-buy rp-product-media"
   │     ├─ Stack gap="4" [data-rp-region="rp-product-buy"]
   │     │  ├─ Price                                     selected variant
   │     │  └─ ProductForm id="product-form"             quantity, add to cart
   │     └─ RichText                                     description (when present)
   └─ ProductRecommendations                           contains region rp-product-recommendations
rp-view-event (product view; attribute form, BP-11)   the last child the page prints; not inside rp-product-form
```

Below `md` the gallery is above the details. The description is outside the buy region because it does not change with the variant. VariantPicker is outside `rp-product-buy` so that it keeps focus when the region is replaced.

**React** (`blueprints/product/react/product.tsx`, complete except `PRODUCT_QUERY`):

```tsx
import type { RippleProduct, RippleProductDetail, RippleVariant } from "__PKG__";
import { Container } from "@components/container";
import { Grid } from "@components/grid";
import { Heading } from "@components/heading";
import { Price } from "@components/price";
import { ProductForm } from "@components/product-form";
import { ProductGallery } from "@components/product-gallery";
import { ProductRecommendations } from "@components/product-recommendations";
import { RichText } from "@components/rich-text";
import { Stack } from "@components/stack";
import { Text } from "@components/text";
import { VariantPicker } from "@components/variant-picker";

export interface ProductPageProps {
  product: RippleProductDetail;
  /** The variant selected by the URL, or the first available one. */
  variant: RippleVariant;
  /** The current query string without "?": the base of the VariantPicker value URLs. */
  search: string;
  /** Recommended products loaded by the route code; an empty array prints no list. */
  recommended: RippleProduct[];
  /** JSON text of the product view event: `{ "event": ..., "payload": ... }` of 05-commerce.md section 12. */
  viewEvent: string;
  /** Cart endpoint including the locale path prefix (05-commerce.md 10.1 rule 7). Default "/api/cart". */
  cartAction?: string;
}

export function ProductPage(props: ProductPageProps) {
  const { product, variant, search, recommended, viewEvent, cartAction = "/api/cart" } = props;
  return (
    <>
      <Container py="12 md:20">
        <Stack gap="8 md:12">
          <Grid columns="1 md:2" gap="8 md:12">
            <ProductGallery id="product-gallery" media={product.media} variant={variant} />
            <Stack gap="4">
              {product.vendor !== "" ? <Text variant="overline" tone="muted">{product.vendor}</Text> : null}
              <Heading level={1}>{product.title}</Heading>
              <VariantPicker id="product-options" product={product} search={search} />
              <Stack gap="4" data-rp-region="rp-product-buy">
                <Price price={variant.price} compareAtPrice={variant.compareAtPrice ?? undefined} />
                <ProductForm id="product-form" product={product} action={cartAction} />
              </Stack>
              {product.descriptionHtml !== "" ? <RichText html={product.descriptionHtml} /> : null}
            </Stack>
          </Grid>
          <ProductRecommendations products={recommended} level={2} />
        </Stack>
      </Container>
      <rp-view-event view-event-trigger="connect" view-event-payload={viewEvent} />
    </>
  );
}
```

`RippleProductDetail` (`05-commerce.md` section 11.1) carries `descriptionHtml`, `media` (`RippleMedia[]`), the options and the selected variant that VariantPicker and ProductForm read. ProductForm takes no `variant` prop: it reads the selected variant from `product` (`11-components-commerce.md` `## ProductForm`).

**Remix**: rules R-1 to R-6. **html**: rule H-1.

**Liquid** (`blueprints/product/liquid/templates/product.liquid`, complete):

```liquid
{%- liquid
  assign variant = product.selected_or_first_available_variant
  assign rec_url = routes.product_recommendations_url | append: '?product_id=' | append: product.id | append: '&limit=4&intent=related'
-%}
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'grid', columns: '1 md:2', gap: '8 md:12' %}
      {% block 'product-gallery', id: 'product-gallery', media: product.media, variant: variant %}
        {% partial 'rp-product-media' %}{% render 'rp-product-gallery-media', id: 'product-gallery', media: product.media, variant: variant %}{% endpartial %}
      {% endblock %}
      {% block 'stack', gap: '4' %}
        {%- if product.vendor != blank -%}
          {% block 'text', variant: 'overline', tone: 'muted' %}{{ product.vendor | escape }}{% endblock %}
        {%- endif -%}
        {% block 'heading', level: 1 %}{{ product.title | escape }}{% endblock %}
        {% block 'variant-picker', id: 'product-options', product: product %}{% endblock %}
        {% partial 'rp-product-buy' %}
          {% block 'stack', gap: '4', attributes: 'data-rp-region="rp-product-buy"' %}
            {% block 'price', price: variant.price, compare_at_price: variant.compare_at_price %}{% endblock %}
            {% block 'product-form', id: 'product-form', product: product %}{% endblock %}
          {% endblock %}
        {% endpartial %}
        {%- if product.description != blank -%}
          {% block 'rich-text', html: product.description %}{% endblock %}
        {%- endif -%}
      {% endblock %}
    {% endblock %}
    {% block 'product-recommendations', url: rec_url %}
      {% partial 'rp-product-recommendations' %}{% render 'rp-product-recommendations-list', products: recommendations.products %}{% endpartial %}
    {% endblock %}
  {% endblock %}
{% endblock %}
<rp-view-event view-event-trigger="connect" view-event-payload="{{ product | standard_event_data: 'view', context: 'page' | escape }}"></rp-view-event>
```

No locale keys (every string comes from the product or from the embedded components).

`rec_url` is built as `11-components-commerce.md` `## ProductRecommendations` states. The view event is the platform filter's output (D-089 item 4). Mask for BT-3: `{ "select": "rp-view-event", "op": "attr", "name": "view-event-payload" }` (the payload is masked as a whole, D-089 item 3).

Evidence: `ripple/theme/templates/product.liquid` (the `standard_event_data: 'view', context: 'page'` view event); `ripple/docs/research/liquid-blocks-partials.md` section 7 (a template that places `{% partial 'rp-product-buy' %}` inside a block body, around a price and a product form; `product.selected_or_first_available_variant`); `ripple/theme/templates/product.liquid` (`{% partial 'product-form' %}` inside a container block).

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Product | `product(handle:)` with the selection below | `product` |
| Selected variant | `selectedOrFirstAvailableVariant(selectedOptions:)` from URL option params (the param names are owned by VariantPicker, `11-components-commerce.md`) | `product.selected_or_first_available_variant` (the platform reads `?variant=`) |
| Media | `media(first: 20)`, `MediaImage` nodes only | `product.media` (read by the gallery snippet) |
| Recommendations | `productRecommendations(productId:, intent: RELATED)` in the route code, passed as `recommended` (`11-components-commerce.md` `## ProductRecommendations`: pass `products`, omit `url`) | `rec_url` (`routes.product_recommendations_url` with `product_id`, `limit=4`, `intent=related`) through region refresh (SPIKE-09) |
| View event | `viewEvent`: `JSON.stringify` of the product view of `05-commerce.md` section 12 | `product \| standard_event_data: 'view', context: 'page'` |

```graphql
fragment RippleVariantFields on ProductVariant {
  id title availableForSale
  price { amount currencyCode }
  compareAtPrice { amount currencyCode }
  image { url altText width height }
  selectedOptions { name value }
}
query RippleProduct($handle: String!, $selectedOptions: [SelectedOptionInput!]!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  product(handle: $handle) {
    ...RippleProductCard
    descriptionHtml
    options { name optionValues { name } }
    media(first: 20) { nodes { ... on MediaImage { id image { url altText width height } } } }
    variants(first: 100) { nodes { ...RippleVariantFields } }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...RippleVariantFields
    }
  }
}
```

Mapping to `RippleProductDetail`: the field list is owned by `05-commerce.md` section 11.1 and the selection that satisfies it by `11-components-commerce.md` section 0.6 (fragment `RippleProductDetail`); when that fragment differs from the query above, doc 11 wins. `media` drops nodes without `image`. UNVERIFIED against the schema in this session: `optionValues`, `selectedOrFirstAvailableVariant` and its two boolean arguments (they are the fields the Hydrogen product skills use; if absent, select `variants` and choose in route code: the first variant whose `selectedOptions` all match, else the first with `availableForSale`, else the first).

### No-JS behaviour

1. VariantPicker prints one link per option value (`aria-current="true"` on the selected one); following a link loads the page for that variant (D-047). There are no radio inputs in any layout. In layout `dropdown` each option is a GET form with a native select and an `Apply` submit button (`data-rp-js="fallback"`).
2. The add-to-cart form posts; the response is a redirect back (hydrogen: 303 to the referring page; Liquid: the cart page), and the header count shows the new total.
3. The gallery shows the first image and its thumbnails as a scrollable list (Carousel without script, `04-elements.md` section 10.9).
4. Recommendations: on the hydrogen backend the server renders them inline; on Liquid the list is empty until `rp-recommendations` loads it with script.
5. The view event element prints nothing visible and does nothing without script.

### Fallback (SPIKE-09)

If a partial cannot be fetched from `routes.product_recommendations_url` on Liquid, the fallback of `11-components-commerce.md` `## ProductRecommendations` (Fallback SPIKE-09) applies: the Liquid template removes the `rec_url` line and the `product-recommendations` block with its partial, and prints in their place `{% block 'featured-collection', collection: settings.rp_related_collection, limit: 4 %}{% endblock %}` inside `{% if settings.rp_related_collection != blank %}` (theme setting `rp_related_collection`, type `collection`, owned by `14-liquid-theme.md`). Test BT-5 skips `rp-product-recommendations` on Liquid, and `featured-collection` is added to the `components` array of `blueprints/product/blueprint.json` (that array is the union over hosts; D-134 item 19). `blueprint.json` regions and the other hosts do not change.

### Acceptance tests

BT-1 to BT-9, plus:

- **PR-1** (tier 2) `[data-rp-region="rp-product-buy"]` contains `.rp-price` and `rp-product-form`, and does not contain `.rp-variant-picker` or `.rp-rich-text`.
- **PR-2** (tier 2) The first gallery `img` has `loading="eager"` and `fetchpriority="high"`.
- **PR-3** (tier 5 and tier 7) Choosing another variant updates the URL with `history.replaceState`, replaces the price text and keeps focus on the chosen option.
- **PR-4** (tier 6) With JavaScript disabled, submitting the add-to-cart form ends on a page whose cart count is 1.
- **PR-5** (tier 2) A product with one variant and no description renders with no empty `.rp-rich-text`.
- **PR-7** (tier 5; hosts react and remix) Client-side navigation from product A to product B (a click on a recommendation link handled by the router, no document load): `window.Shopify.analytics.publish` is called exactly once more, with B's payload (`05-commerce.md` 12.2, D-123).
- **PR-6** (tier 2) Exactly one `rp-view-event` exists; it is the last element child of `<main>`, is not inside `rp-product-form`, has `view-event-trigger="connect"` and a non-empty `view-event-payload` attribute that parses as JSON. The elements `#product-gallery`, `#product-options` and `#product-form` exist.

---
