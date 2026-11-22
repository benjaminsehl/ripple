# Blueprint: `search`

> Blueprint spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its sections 1 (shared definitions) and 2 (blueprint conventions) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

### Purpose

The search results page: a search form, the result count, product results and pagination. It is also the no-JS target of the header's search link.

### Regions

`rp-search-results` (owned by this blueprint).

### Components used

`container`, `empty-state`, `grid`, `heading`, `pagination`, `product-card`, `search-form`, `stack`, `text`.

### Structure

```text
Container py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Heading level 1
   ├─ SearchForm                         GET /search, field q, current terms as value
   └─ Stack gap="8 md:12" [data-rp-region="rp-search-results"]
      ├─ Text tone="muted"               "N results for "terms""          (when terms exist)
      ├─ Grid as="ul" columns="2 lg:4" gap="4 md:6"  →  li > ProductCard  (when results exist)
      ├─ Pagination                                                      (when a previous or next page exists)
      └─ EmptyState icon="search": Heading level 2                        (terms exist, no results)
rp-view-event (search view; attribute form, BP-11)   only when terms exist
```

Results are products only in V1: the hydrogen query passes `types: PRODUCT`, and the Liquid template skips results whose `object_type` is not `product`. A search with no terms shows the form and an empty region.

**React** (`blueprints/search/react/search.tsx`, complete except `SEARCH_QUERY`):

```tsx
import type { RippleProduct } from "__PKG__";
import { Container } from "@components/container";
import { EmptyState } from "@components/empty-state";
import { Grid } from "@components/grid";
import { Heading } from "@components/heading";
import { Pagination } from "@components/pagination";
import { ProductCard } from "@components/product-card";
import { SearchForm } from "@components/search-form";
import { Stack } from "@components/stack";
import { Text } from "@components/text";
import type { PageInfo } from "./types";

export interface SearchPageProps {
  /** The trimmed value of the q param; "" when absent. */
  terms: string;
  results: RippleProduct[];
  /** Total number of results. */
  count: number;
  pageInfo: PageInfo;
  /** JSON text of the search view event: `{ "event": ..., "payload": ... }` of 05-commerce.md section 12. Read only when terms exist. */
  viewEvent: string;
}

export function SearchPage(props: SearchPageProps) {
  const { terms, results, count, pageInfo, viewEvent } = props;
  return (
    <>
      <Container py="12 md:20">
        <Stack gap="8 md:12">
          <Heading level={1}>Search</Heading>
          <SearchForm defaultValue={terms} />
          <Stack gap="8 md:12" data-rp-region="rp-search-results">
            {terms !== "" ? (
              <Text tone="muted">{count === 1 ? `1 result for "${terms}"` : `${count} results for "${terms}"`}</Text>
            ) : null}
            {results.length > 0 ? (
              <Grid as="ul" columns="2 lg:4" gap="4 md:6">
                {results.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </Grid>
            ) : null}
            {terms !== "" && results.length === 0 ? (
              <EmptyState icon="search">
                <Heading level={2}>No results</Heading>
              </EmptyState>
            ) : null}
            {results.length > 0 && (pageInfo.previousUrl !== null || pageInfo.nextUrl !== null) ? (
              <Pagination previousUrl={pageInfo.previousUrl ?? undefined} nextUrl={pageInfo.nextUrl ?? undefined} />
            ) : null}
          </Stack>
        </Stack>
      </Container>
      {terms !== "" ? <rp-view-event view-event-trigger="connect" view-event-payload={viewEvent} /> : null}
    </>
  );
}
```

**Remix**: rules R-1 to R-6. **html**: rule H-1.

**Liquid** (`blueprints/search/liquid/templates/search.liquid`, complete):

```liquid
{%- liquid
  assign terms = search.terms | strip
  # Escape before `t`: a filter after a `t:` named argument applies to the translated output.
  assign terms_escaped = terms | escape
-%}
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'heading', level: 1 %}{{ 'ripple.blueprints.search.title' | t }}{% endblock %}
    {% block 'search-form', default_value: terms %}{% endblock %}
    {% partial 'rp-search-results' %}
      {% paginate search.results by 24 %}
        {% block 'stack', gap: '8 md:12', attributes: 'data-rp-region="rp-search-results"' %}
          {%- if search.performed and terms != blank -%}
            {% block 'text', tone: 'muted' %}{{ 'ripple.blueprints.search.count' | t: count: search.results_count, terms: terms_escaped }}{% endblock %}
            {%- if search.results_count > 0 -%}
              {% block 'grid', as: 'ul', columns: '2 lg:4', gap: '4 md:6' %}
                {%- for result in search.results -%}
                  {%- if result.object_type == 'product' -%}
                    <li>{% block 'product-card', product: result %}{% endblock %}</li>
                  {%- endif -%}
                {%- endfor -%}
              {% endblock %}
              {%- if paginate.previous or paginate.next -%}
                {% block 'pagination', previous_url: paginate.previous.url, next_url: paginate.next.url %}{% endblock %}
              {%- endif -%}
            {%- else -%}
              {% block 'empty-state', icon: 'search' %}
                {% block 'heading', level: 2 %}{{ 'ripple.blueprints.search.empty' | t }}{% endblock %}
              {% endblock %}
            {%- endif -%}
          {%- endif -%}
        {% endblock %}
      {% endpaginate %}
    {% endpartial %}
  {% endblock %}
{% endblock %}
{%- if search.performed and terms != blank -%}
  <rp-view-event view-event-trigger="connect" view-event-payload="{{ search | standard_event_data: 'view', context: 'page' | escape }}"></rp-view-event>
{%- endif -%}
```

Locale keys (`ripple.blueprints.search.*`): `title` "Search"; `count.one` "{{ count }} result for "{{ terms }}""; `count.other` "{{ count }} results for "{{ terms }}""; `empty` "No results".

Notes: `terms` is escaped BEFORE the `t` call (`terms_escaped`; `ripple/theme/AGENTS.md`: a filter written after a `t:` named argument applies to the translated output, not to that argument; the base theme does the same in `ripple/theme/templates/search.liquid`). UNVERIFIED on a store that the terms then render once-escaped (`14-liquid-theme.md` V-21). SearchForm on Liquid MUST add `<input type="hidden" name="type" value="product">` so that the platform returns products only; that input is part of the SearchForm contract in `11-components-commerce.md`. Mask for BT-3: `{ "select": "rp-view-event", "op": "attr", "name": "view-event-payload" }`. Evidence: `ripple/theme/templates/search.liquid` (`search.terms`, `search.performed`, `search.results_count`, `{% paginate search.results by 20 %}`, `routes.search_url`). UNVERIFIED: `result.object_type`; that the filter `standard_event_data` accepts the `search` object (the base theme's `templates/search.liquid`, as read, does not use it). Check: SPIKE-02, on the preview store, the rendered attribute parses as JSON and names the search terms.

#### Fallback (SPIKE-02, search view event)

If `{{ search | standard_event_data: 'view', context: 'page' }}` renders an error or an empty value on the preview store, the Liquid template omits the `rp-view-event` element (the three lines of the final `{% if %}`), and tests SE-2 and SE-4 skip the element on Liquid. The other hosts do not change.

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Terms | URL param `q`, trimmed | `search.terms` |
| Results | `search(query:, types: PRODUCT, first: 24, after:, before:, last:)` | `search.results` inside `{% paginate search.results by 24 %}` |
| Count | `search.totalCount` | `search.results_count` |
| View event | `viewEvent`: `JSON.stringify` of the search view of `05-commerce.md` section 12 | `search \| standard_event_data: 'view', context: 'page'` (UNVERIFIED, see above) |

```graphql
query RippleSearch($terms: String!, $first: Int, $last: Int, $after: String, $before: String, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  search(query: $terms, types: PRODUCT, first: $first, last: $last, after: $after, before: $before) {
    totalCount
    nodes { ... on Product { ...RippleProductCard } }
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
  }
}
```

The route code MUST NOT run the query when `terms` is `""`; it passes `results: []`, `count: 0`. Pagination URLs: rule CO-R3. UNVERIFIED against the schema in this session: `search.totalCount`.

### No-JS behaviour

1. The search form is a GET form; submitting navigates to `/search?q=<terms>`.
2. Result cards and pagination are links.

### Acceptance tests

BT-1 to BT-9, plus:

- **SE-1** (tier 2) With `terms: ""`: the region `rp-search-results` exists and has no element children; no `rp-view-event` exists.
- **SE-2** (tier 2) With terms `<b>x</b>` and no results: the count text contains the literal characters `<b>x</b>` as text (no `b` element in the region), and the `view-event-payload` attribute value parses as JSON.
- **SE-3** (tier 6) Submitting the form with JavaScript disabled lands on `/search?q=shirt` (plus `type=product` on Liquid) and the input value is `shirt`.
- **SE-4** (tier 2) With terms: exactly one `rp-view-event` exists; it is the last element child of `<main>`, has `view-event-trigger="connect"` and no child element.

---
