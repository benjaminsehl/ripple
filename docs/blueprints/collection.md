# Blueprint: `collection`

> Blueprint spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its sections 1 (shared definitions) and 2 (blueprint conventions) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

### Purpose

A collection page: title and description, filters, sort, active filter chips, a product grid and pagination. Filter, sort and page state lives in the URL (ledger D-047).

### Regions

`rp-collection-filters` (inside Filters, owned by that component), `rp-collection-toolbar` and `rp-collection-results` (owned by this blueprint).

### Components used

`button`, `container`, `empty-state`, `filter-chips`, `filters`, `grid`, `heading`, `inline`, `pagination`, `product-card`, `rich-text`, `sort-select`, `stack`, `text`.

### Structure

```text
Container py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Stack as="header" gap="2":  Heading level 1 (title); RichText (description, when present)
   └─ Grid columns="1 lg:4" gap="8 md:12"
      ├─ Filters id="collection-filters"          1 column; rendered inline, not in a Drawer (D-005, D-107 item 3); contains region rp-collection-filters
      └─ Stack gap="4" span="1 lg:3"
         ├─ SortSelect id="collection-sort"        outside every region (it keeps focus while results change)
         ├─ Inline [data-rp-region="rp-collection-toolbar"]:  Text (product count); FilterChips
         └─ Stack gap="8 md:12" [data-rp-region="rp-collection-results"]
            ├─ Grid as="ul" columns="2 lg:3" gap="4 md:6"  →  li > ProductCard     (when products exist)
            ├─ Pagination                                                         (when a previous or next page exists)
            └─ EmptyState: Heading level 2; Button "Clear filters"                 (when no products)
rp-view-event (collection view; attribute form, BP-11)
```

Below `lg` the filters are above the results in one column; from `lg` they are the first of four columns. The product grid uses 3 columns from `lg` (not the 4 of BP-5) because it sits beside the filters. Filters, FilterChips and SortSelect MUST carry `data-rp-refresh="rp-collection-filters rp-collection-toolbar rp-collection-results"`; that attribute is printed by those components (`11-components-commerce.md`), not by the blueprint.

**React** (`blueprints/collection/react/collection.tsx`, complete except the `COLLECTION_QUERY` constant):

```tsx
import type { RippleCollection, RippleFilter, RippleFilterChip, RippleProduct, RippleSortOption } from "__PKG__";
import { Button } from "@components/button";
import { Container } from "@components/container";
import { EmptyState } from "@components/empty-state";
import { FilterChips } from "@components/filter-chips";
import { Filters } from "@components/filters";
import { Grid } from "@components/grid";
import { Heading } from "@components/heading";
import { Inline } from "@components/inline";
import { Pagination } from "@components/pagination";
import { ProductCard } from "@components/product-card";
import { RichText } from "@components/rich-text";
import { SortSelect } from "@components/sort-select";
import { Stack } from "@components/stack";
import { Text } from "@components/text";
import type { PageInfo } from "./types";

export interface CollectionPageProps {
  collection: RippleCollection & { descriptionHtml: string };
  products: RippleProduct[];
  /** Number of products shown on this page (cursor pagination has no total). */
  count: number;
  /** From `toRippleFilters` (`@components/filters.data`). */
  filters: RippleFilter[];
  /** From `toFilterChips` (`@components/filter-chips.data`). */
  chips: { chips: RippleFilterChip[]; clearUrl: string };
  /** Pathname of the request: the `action` of the filter and sort forms. */
  pathname: string;
  sortOptions: RippleSortOption[];
  /** The selected sort value, for example "manual". */
  sort: string;
  /** The `sort_by` URL param, or "" when the URL has none. */
  sortBy: string;
  /** From `sortParams` (`@components/sort-select.data`): the active filter params. */
  params: Array<[string, string]>;
  pageInfo: PageInfo;
  /** JSON text of the collection view event: `{ "event": ..., "payload": ... }` of 05-commerce.md section 12. */
  viewEvent: string;
}

export function CollectionPage(props: CollectionPageProps) {
  const { collection, products, count, filters, chips, pathname, sortOptions, sort, sortBy, params, pageInfo, viewEvent } = props;
  return (
    <>
      <Container py="12 md:20">
        <Stack gap="8 md:12">
          <Stack as="header" gap="2">
            <Heading level={1}>{collection.title}</Heading>
            {collection.descriptionHtml !== "" ? <RichText html={collection.descriptionHtml} /> : null}
          </Stack>
          <Grid columns="1 lg:4" gap="8 md:12">
            <Filters id="collection-filters" filters={filters} action={pathname} sortBy={sortBy} />
            <Stack gap="4" span="1 lg:3">
              <SortSelect id="collection-sort" action={pathname} options={sortOptions} value={sort} params={params} />
              <Inline gap="4" justify="between" data-rp-region="rp-collection-toolbar">
                <Text tone="muted">{count === 1 ? "1 product" : `${count} products`}</Text>
                <FilterChips {...chips} />
              </Inline>
              <Stack gap="8 md:12" data-rp-region="rp-collection-results">
                {products.length > 0 ? (
                  <Grid as="ul" columns="2 lg:3" gap="4 md:6">
                    {products.map((product) => (
                      <li key={product.id}>
                        <ProductCard product={product} />
                      </li>
                    ))}
                  </Grid>
                ) : (
                  <EmptyState icon="search">
                    <Heading level={2}>No products found</Heading>
                    <Button href={collection.url} variant="outline">Clear filters</Button>
                  </EmptyState>
                )}
                {products.length > 0 && (pageInfo.previousUrl !== null || pageInfo.nextUrl !== null) ? (
                  <Pagination previousUrl={pageInfo.previousUrl ?? undefined} nextUrl={pageInfo.nextUrl ?? undefined} />
                ) : null}
              </Stack>
            </Stack>
          </Grid>
        </Stack>
      </Container>
      <rp-view-event view-event-trigger="connect" view-event-payload={viewEvent} />
    </>
  );
}
```

`./types` is `<blueprint dir>/types.ts`, a file of the `layout` blueprint (key `types`, section 2.4). The JSX type of `rp-view-event` comes from the generated intrinsic-element declarations (`src/react/jsx.generated.ts`, `src/remix/jsx.generated.ts`, D-096 item 2). React and Remix escape the attribute value; no `dangerouslySetInnerHTML` and no `innerHTML` is used. The route code builds `viewEvent` with `JSON.stringify` from the shape of `05-commerce.md` section 12, and builds `filters`, `chips` and `params` with the three `.data` helpers named above.

**Remix**: rules R-1 to R-6. **html**: rule H-1.

**Liquid** (`blueprints/collection/liquid/templates/collection.liquid`, complete):

```liquid
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'stack', as: 'header', gap: '2' %}
      {% block 'heading', level: 1 %}{{ collection.title | escape }}{% endblock %}
      {%- if collection.description != blank -%}
        {% block 'rich-text', html: collection.description %}{% endblock %}
      {%- endif -%}
    {% endblock %}
    {% block 'grid', columns: '1 lg:4', gap: '8 md:12' %}
      {% block 'filters', id: 'collection-filters' %}
        {% partial 'rp-collection-filters' %}{% render 'rp-filters-groups', collection: collection %}{% endpartial %}
      {% endblock %}
      {% block 'stack', gap: '4', span: '1 lg:3' %}
        {% block 'sort-select', id: 'collection-sort' %}{% endblock %}
        {% partial 'rp-collection-toolbar' %}
          {% block 'inline', gap: '4', justify: 'between', attributes: 'data-rp-region="rp-collection-toolbar"' %}
            {% block 'text', tone: 'muted' %}{{ 'ripple.blueprints.collection.count' | t: count: collection.products_count }}{% endblock %}
            {% block 'filter-chips' %}{% endblock %}
          {% endblock %}
        {% endpartial %}
        {% partial 'rp-collection-results' %}
          {% paginate collection.products by 24 %}
            {% block 'stack', gap: '8 md:12', attributes: 'data-rp-region="rp-collection-results"' %}
              {%- if collection.products.size > 0 -%}
                {% block 'grid', as: 'ul', columns: '2 lg:3', gap: '4 md:6' %}
                  {%- for product in collection.products -%}
                    <li>{% block 'product-card', product: product %}{% endblock %}</li>
                  {%- endfor -%}
                {% endblock %}
                {%- if paginate.previous or paginate.next -%}
                  {% block 'pagination', previous_url: paginate.previous.url, next_url: paginate.next.url %}{% endblock %}
                {%- endif -%}
              {%- else -%}
                {% block 'empty-state', icon: 'search' %}
                  {% block 'heading', level: 2 %}{{ 'ripple.blueprints.collection.empty' | t }}{% endblock %}
                  {% block 'button', href: collection.url, variant: 'outline' %}{{ 'ripple.blueprints.collection.clear' | t }}{% endblock %}
                {% endblock %}
              {%- endif -%}
            {% endblock %}
          {% endpaginate %}
        {% endpartial %}
      {% endblock %}
    {% endblock %}
  {% endblock %}
{% endblock %}
<rp-view-event view-event-trigger="connect" view-event-payload="{{ collection | standard_event_data: 'view' | escape }}"></rp-view-event>
```

Locale keys (`ripple.blueprints.collection.*`): `count.one` "{{ count }} product"; `count.other` "{{ count }} products"; `empty` "No products found"; `clear` "Clear filters".

The Filters, SortSelect and FilterChips blocks read the global `collection` themselves (`11-components-commerce.md`: source `collection.filters`, action `collection.url`). The two blueprint-owned regions keep `attributes: 'data-rp-region="..."'`, which is allowed (D-091 item 2).

Differences between backends, masked for BT-3: the count text (Liquid prints the collection total, `collection.products_count`; the hydrogen backend prints the number on the page) and the view-event payload, which is masked as a whole (D-089 item 3: Liquid prints the platform filter's output, the hydrogen backend the JSON of `05-commerce.md` section 12). Mask list: `{ "select": "[data-rp-region=\"rp-collection-toolbar\"] > .rp-text", "op": "text" }`, `{ "select": "rp-view-event", "op": "attr", "name": "view-event-payload" }`.

Evidence: `ripple/theme/templates/collection.liquid` (the `standard_event_data: 'view'` view event, printed without a `context` argument; `collection.title`, `collection.description`, `collection.url`, `{% paginate collection.products by 20 %}` inside `{% partial 'collection-grid' %}`, a block call inside the product loop). `paginate.previous`, `paginate.next`: see `09-components-foundation.md`, Pagination, Evidence. UNVERIFIED: `collection.filters`, `collection.sort_options`, `collection.sort_by`, `collection.default_sort_by`, `collection.products_count` were not re-read in this session (they are documented Liquid drops by general knowledge); the hydrogen-backend payload shape of the collection view (`05-commerce.md` section 12; section 5 of this document).

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Collection | `collection(handle:)`: `id`, `title`, `handle`, `descriptionHtml`, `image` | `collection` |
| Products | `collection.products(first: 24, after:, before:, last:, filters:, sortKey:, reverse:)` | `collection.products` inside `{% paginate ... by 24 %}` |
| Filters | `collection.products.filters { id label type values { id label count input } }`, mapped by `toRippleFilters(filters, searchParams, pathname)` (`@components/filters.data`); chips by `toFilterChips` (`@components/filter-chips.data`) | `collection.filters` (read inside the components) |
| Sort | URL param `sort_by`; options are a constant list in the route code (CO-R1); `params` from `sortParams(searchParams)` (`@components/sort-select.data`) | `collection.sort_options`, `collection.sort_by` (read inside SortSelect) |
| View event | `viewEvent`: `JSON.stringify` of the collection view of `05-commerce.md` section 12 | `collection \| standard_event_data: 'view'` (no `context`; it is ignored for collections) |
| Pagination | `pageInfo`; URLs carry `after=<endCursor>` or `before=<startCursor>` with every other param kept | `paginate.previous.url`, `paginate.next.url` |

```graphql
query RippleCollection(
  $handle: String!, $first: Int, $last: Int, $after: String, $before: String,
  $filters: [ProductFilter!], $sortKey: ProductCollectionSortKeys, $reverse: Boolean,
  $country: CountryCode, $language: LanguageCode
) @inContext(country: $country, language: $language) {
  collection(handle: $handle) {
    ...RippleCollectionCard
    descriptionHtml
    products(first: $first, last: $last, after: $after, before: $before, filters: $filters, sortKey: $sortKey, reverse: $reverse) {
      filters { id label type values { id label count input } }
      nodes { ...RippleProductCard }
      pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    }
  }
}
```

Route code rules (hydrogen backend):

- **CO-R1** URL to variables. `sort_by` values and their variables: `manual` (`MANUAL`, false), `best-selling` (`BEST_SELLING`, false), `title-ascending` (`TITLE`, false), `title-descending` (`TITLE`, true), `price-ascending` (`PRICE`, false), `price-descending` (`PRICE`, true), `created-descending` (`CREATED`, true). An unknown or missing value is `manual`. These seven value strings are the Liquid `sort_by` values, so URLs are the same on both backends. `sortOptions` is that list with English labels `Featured`, `Best selling`, `Alphabetically, A-Z`, `Alphabetically, Z-A`, `Price, low to high`, `Price, high to low`, `Date, new to old`.
- **CO-R2** `filter.*` URL params to `$filters`, one `ProductFilter` each: `filter.v.availability=1` gives `{ available: true }` and `filter.v.availability=0` gives `{ available: false }`; `filter.v.price.gte=<n>` and `filter.v.price.lte=<n>` together give one `{ price: { min, max } }` (a missing bound is omitted); `filter.p.vendor=<v>` gives `{ productVendor: v }`; `filter.p.product_type=<v>` gives `{ productType: v }`; `filter.v.option.<name>=<v>` gives `{ variantOption: { name, value: v } }`. Any other `filter.*` param is ignored. A filter value is `active` when its param is in the URL. The param names are the Liquid storefront filter params, so URLs are the same on both backends. Filters (`11-components-commerce.md`) owns the names its form submits; if they differ, that document wins and this rule is updated.
- **CO-R3** With `before` set: `last: 24, before`; otherwise `first: 24, after`. `pageInfo.nextUrl` is the current URL with `before` removed and `after=<endCursor>` when `hasNextPage`; `previousUrl` is the current URL with `after` removed and `before=<startCursor>` when `hasPreviousPage`; otherwise `null`.

### No-JS behaviour

1. Filters is a GET form with a submit button (hidden by `data-rp-js="fallback"` once script runs); submitting reloads the page with the `filter.*` params.
2. SortSelect is a GET form with a submit button; submitting reloads with `sort_by`.
3. Filter chips and the "Clear filters" button are links.
4. Pagination links navigate.
5. With script, the same controls refresh the three regions in place and update the URL; a failed refresh navigates (`05-commerce.md` section 8.2).

### Acceptance tests

BT-1 to BT-9, plus:

- **CL-1** (tier 2) With `products: []` the results region contains `.rp-empty-state` with a link to the collection URL, no `ul.rp-grid` and no `.rp-pagination`.
- **CL-2** (tier 2) `[data-rp-region="rp-collection-results"]` and `[data-rp-region="rp-collection-toolbar"]` do not contain `.rp-sort-select` or `.rp-filters`.
- **CL-3** (tier 5 and tier 7) Choosing a sort option changes the URL to contain `sort_by=price-ascending` without a document navigation, and the first product card changes; focus stays on the sort control.
- **CL-4** (tier 6) With JavaScript disabled, submitting the filter form navigates to a URL containing the chosen `filter.` param, and the chosen value is checked in the response.
- **CL-5** (tier 1) Route helper tests for CO-R1 to CO-R3 with the seven sort values, an unknown value, and both pagination directions.
- **CL-7** (tier 5; hosts react and remix) Client-side navigation from a collection page to a product page: `window.Shopify.analytics.publish` is called exactly once more, with the product view (`05-commerce.md` 12.2, D-123).
- **CL-6** (tier 2) Exactly one `rp-view-event` exists; it is the last element child of `<main>`, has `view-event-trigger="connect"`, a non-empty `view-event-payload` attribute that parses as JSON, and no child element. `#collection-filters` and `#collection-sort` exist; no element has the id `filters`. The Filters root is not inside a `<dialog>`.

---
