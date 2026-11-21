# Blueprint: `home`

> Blueprint spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its sections 1 (shared definitions) and 2 (blueprint conventions) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

### Purpose

The storefront home page: a hero, one featured collection, and a short list of collections.

### Regions

None.

### Components used

`button`, `collection-card`, `container`, `featured-collection`, `grid`, `heading`, `hero`, `stack`, `text`.

### Structure

```text
Hero                      size="lg" align="center"; scheme="dark" when it has an image
├─ Heading level 1        shop name (or hero title)
├─ Text variant="lead"    only when text exists
└─ Button href            link to all products
Container py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ FeaturedCollection  limit 4; grid 2 columns, 4 from lg          (omitted when the collection is missing)
   └─ Stack as="section" gap="4"                                      (omitted when there are no collections)
      ├─ Heading level 2
      └─ Grid as="ul" columns="1 sm:2 lg:3" gap="4 md:6"  →  li > CollectionCard
```

**React** (`blueprints/home/react/home.tsx`, complete except the `HOME_QUERY` constant, whose text is the query under "Data requirements"):

```tsx
import type { RippleCollection, RippleImage, RippleProduct } from "__PKG__";
import { Button } from "@components/button";
import { CollectionCard } from "@components/collection-card";
import { Container } from "@components/container";
import { FeaturedCollection } from "@components/featured-collection";
import { Grid } from "@components/grid";
import { Heading } from "@components/heading";
import { Hero } from "@components/hero";
import { Stack } from "@components/stack";
import { Text } from "@components/text";

export interface HomePageProps {
  hero: { title: string; text: string; image: RippleImage | null; cta: { label: string; href: string } };
  featured: { collection: RippleCollection; products: RippleProduct[] } | null;
  collections: RippleCollection[];
}

export function HomePage(props: HomePageProps) {
  const { hero, featured, collections } = props;
  return (
    <>
      <Hero image={hero.image ?? undefined} size="lg" align="center" scheme={hero.image !== null ? "dark" : undefined}>
        <Stack gap="4" align="center">
          <Heading level={1} size="5xl">{hero.title}</Heading>
          {hero.text !== "" ? <Text variant="lead">{hero.text}</Text> : null}
          <Button href={hero.cta.href} size="lg">{hero.cta.label}</Button>
        </Stack>
      </Hero>
      <Container py="12 md:20">
        <Stack gap="8 md:12">
          {featured !== null ? (
            <FeaturedCollection collection={featured.collection} products={featured.products} limit={4} />
          ) : null}
          {collections.length > 0 ? (
            <Stack as="section" gap="4">
              <Heading level={2}>Shop by collection</Heading>
              <Grid as="ul" columns="1 sm:2 lg:3" gap="4 md:6">
                {collections.map((collection) => (
                  <li key={collection.id}>
                    <CollectionCard collection={collection} />
                  </li>
                ))}
              </Grid>
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </>
  );
}
```

**Remix**: rules R-1 to R-4. **html**: rule H-1.

**Liquid** (`blueprints/home/liquid/templates/index.liquid`, complete):

```liquid
{%- liquid
  assign featured = collections.frontpage
  assign hero_text = 'ripple.blueprints.home.text' | t
  assign hero_scheme = ''
  if featured.image != blank
    assign hero_scheme = 'dark'
  endif
-%}
{% block 'hero', image: featured.image, size: 'lg', align: 'center', scheme: hero_scheme %}
  {% block 'stack', gap: '4', align: 'center' %}
    {% block 'heading', level: 1, size: '5xl' %}{{ shop.name | escape }}{% endblock %}
    {%- if hero_text != blank -%}
      {% block 'text', variant: 'lead' %}{{ hero_text }}{% endblock %}
    {%- endif -%}
    {% block 'button', href: routes.all_products_collection_url, size: 'lg' %}{{ 'ripple.blueprints.home.cta' | t }}{% endblock %}
  {% endblock %}
{% endblock %}
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {%- if featured.products.size > 0 -%}
      {% block 'featured-collection', collection: featured, limit: 4 %}{% endblock %}
    {%- endif -%}
    {%- if collections.size > 0 -%}
      {% block 'stack', as: 'section', gap: '4' %}
        {% block 'heading', level: 2 %}{{ 'ripple.blueprints.home.collections' | t }}{% endblock %}
        {% block 'grid', as: 'ul', columns: '1 sm:2 lg:3', gap: '4 md:6' %}
          {%- for collection in collections limit: 3 -%}
            <li>{% block 'collection-card', collection: collection %}{% endblock %}</li>
          {%- endfor -%}
        {% endblock %}
      {% endblock %}
    {%- endif -%}
  {% endblock %}
{% endblock %}
```

Locale keys (`ripple.blueprints.home.*`): `text` ""; `cta` "Shop now"; `collections` "Shop by collection". `collections.frontpage` and `routes.all_products_collection_url` are used by `ripple/theme/templates/index.liquid` and by the Hero example of this document.

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Hero title | `shop.name` (from the layout query) or a project constant | `shop.name` |
| Hero image | `featured.collection.image` | `collections.frontpage.image` |
| Featured collection | `collection(handle: $featured)` with 4 products | `collections.frontpage` |
| Collections | `collections(first: 3)` | `collections`, first 3 |

```graphql
fragment RippleProductCard on Product {
  id title handle vendor availableForSale
  featuredImage { url altText width height }
  priceRange { minVariantPrice { amount currencyCode } }
  compareAtPriceRange { minVariantPrice { amount currencyCode } }
}
fragment RippleCollectionCard on Collection { id title handle image { url altText width height } }
query RippleHome($featured: String!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  featured: collection(handle: $featured) {
    ...RippleCollectionCard
    products(first: 4) { nodes { ...RippleProductCard } }
  }
  collections(first: 3) { nodes { ...RippleCollectionCard } }
}
```

The fragments `RippleProductCard` and `RippleCollectionCard` are reused by name in the other blueprints; each query file repeats their text. Mapping to `RippleProduct`: `price` is `priceRange.minVariantPrice`; `compareAtPrice` is `compareAtPriceRange.minVariantPrice` when its `amount` is greater than `price.amount`, otherwise `null`; `url` per 2.5. Field names follow `05-commerce.md` section 11.1 and were not re-checked against the schema in this session. `$featured` defaults to `"frontpage"`; UNVERIFIED that mock.shop has that handle, so a `null` result renders the page without the featured area.

### No-JS behaviour

1. Every link (hero button, product cards, collection cards, "View all") navigates.
2. Nothing on this page needs script.

### Acceptance tests

BT-1 to BT-9, plus:

- **HO-1** (tier 2) With `featured: null` and `collections: []` the page still contains exactly one `h1` and no empty `ul`.
- **HO-2** (tier 2) The hero image has `loading="eager"` and `fetchpriority="high"`; every other `img` has `loading="lazy"`.

---
