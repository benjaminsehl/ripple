# Blueprint: `collections-list`

> Blueprint spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its sections 1 (shared definitions) and 2 (blueprint conventions) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

### Purpose

The list of all collections.

### Regions

None.

### Components used

`collection-card`, `container`, `empty-state`, `grid`, `heading`, `pagination`, `stack`.

### Structure

```text
Container py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Heading level 1
   ├─ Grid as="ul" columns="1 sm:2 lg:3" gap="4 md:6"  →  li > CollectionCard   (when collections exist)
   ├─ Pagination                                                               (when a previous or next page exists)
   └─ EmptyState: Heading level 2                                               (when none)
```

**React** (`blueprints/collections-list/react/collections-list.tsx`, complete except `COLLECTIONS_LIST_QUERY`):

```tsx
import type { RippleCollection } from "__PKG__";
import { CollectionCard } from "@components/collection-card";
import { Container } from "@components/container";
import { EmptyState } from "@components/empty-state";
import { Grid } from "@components/grid";
import { Heading } from "@components/heading";
import { Pagination } from "@components/pagination";
import { Stack } from "@components/stack";
import type { PageInfo } from "./types";

export interface CollectionsListPageProps {
  collections: RippleCollection[];
  pageInfo: PageInfo;
}

export function CollectionsListPage(props: CollectionsListPageProps) {
  const { collections, pageInfo } = props;
  return (
    <Container py="12 md:20">
      <Stack gap="8 md:12">
        <Heading level={1}>Collections</Heading>
        {collections.length > 0 ? (
          <Grid as="ul" columns="1 sm:2 lg:3" gap="4 md:6">
            {collections.map((collection) => (
              <li key={collection.id}>
                <CollectionCard collection={collection} />
              </li>
            ))}
          </Grid>
        ) : (
          <EmptyState>
            <Heading level={2}>No collections yet</Heading>
          </EmptyState>
        )}
        {pageInfo.previousUrl !== null || pageInfo.nextUrl !== null ? (
          <Pagination previousUrl={pageInfo.previousUrl ?? undefined} nextUrl={pageInfo.nextUrl ?? undefined} />
        ) : null}
      </Stack>
    </Container>
  );
}
```

**Remix**: rules R-1 to R-4. **html**: rule H-1.

**Liquid** (`blueprints/collections-list/liquid/templates/list-collections.liquid`, complete):

```liquid
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'heading', level: 1 %}{{ 'ripple.blueprints.collections-list.title' | t }}{% endblock %}
    {% paginate collections by 24 %}
      {%- if collections.size > 0 -%}
        {% block 'grid', as: 'ul', columns: '1 sm:2 lg:3', gap: '4 md:6' %}
          {%- for collection in collections -%}
            <li>{% block 'collection-card', collection: collection %}{% endblock %}</li>
          {%- endfor -%}
        {% endblock %}
      {%- else -%}
        {% block 'empty-state' %}
          {% block 'heading', level: 2 %}{{ 'ripple.blueprints.collections-list.empty' | t }}{% endblock %}
        {% endblock %}
      {%- endif -%}
      {%- if paginate.previous or paginate.next -%}
        {% block 'pagination', previous_url: paginate.previous.url, next_url: paginate.next.url %}{% endblock %}
      {%- endif -%}
    {% endpaginate %}
  {% endblock %}
{% endblock %}
```

Locale keys (`ripple.blueprints.collections-list.*`): `title` "Collections"; `empty` "No collections yet".

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Collections | `collections(first: 24, after:, before:, last:)` | `collections` inside `{% paginate collections by 24 %}` |

```graphql
query RippleCollectionsList($first: Int, $last: Int, $after: String, $before: String, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  collections(first: $first, last: $last, after: $after, before: $before) {
    nodes { ...RippleCollectionCard }
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
  }
}
```

Pagination URLs: rule CO-R3.

### No-JS behaviour

1. Cards and pagination are links. Nothing needs script.

### Acceptance tests

BT-1 to BT-9, plus:

- **CS-1** (tier 2) With `collections: []`: one `.rp-empty-state`, no `ul`, no `.rp-pagination`.

---
