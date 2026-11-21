# Blueprint: `blog`

> Blueprint spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its sections 1 (shared definitions) and 2 (blueprint conventions) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

### Purpose

A blog index: the blog title and a paginated grid of article cards.

### Regions

None.

### Components used

`article-card`, `container`, `empty-state`, `grid`, `heading`, `pagination`, `stack`.

### Structure

```text
Container py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Heading level 1                    blog title
   ├─ Grid as="ul" columns="1 sm:2 lg:3" gap="4 md:6"  →  li > ArticleCard    (when articles exist)
   ├─ EmptyState: Heading level 2                                              (when none)
   └─ Pagination                                                              (when a previous or next page exists)
```

**React** (`blueprints/blog/react/blog.tsx`, complete except `BLOG_QUERY`):

```tsx
import type { RippleArticle } from "__PKG__";
import { ArticleCard } from "@components/article-card";
import { Container } from "@components/container";
import { EmptyState } from "@components/empty-state";
import { Grid } from "@components/grid";
import { Heading } from "@components/heading";
import { Pagination } from "@components/pagination";
import { Stack } from "@components/stack";
import type { PageInfo } from "./types";

export interface BlogPageProps {
  blog: { title: string };
  articles: RippleArticle[];
  pageInfo: PageInfo;
}

export function BlogPage(props: BlogPageProps) {
  const { blog, articles, pageInfo } = props;
  return (
    <Container py="12 md:20">
      <Stack gap="8 md:12">
        <Heading level={1}>{blog.title}</Heading>
        {articles.length > 0 ? (
          <Grid as="ul" columns="1 sm:2 lg:3" gap="4 md:6">
            {articles.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} />
              </li>
            ))}
          </Grid>
        ) : (
          <EmptyState>
            <Heading level={2}>No articles yet</Heading>
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

**Liquid** (`blueprints/blog/liquid/templates/blog.liquid`, complete):

```liquid
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'heading', level: 1 %}{{ blog.title | escape }}{% endblock %}
    {% paginate blog.articles by 12 %}
      {%- if blog.articles.size > 0 -%}
        {% block 'grid', as: 'ul', columns: '1 sm:2 lg:3', gap: '4 md:6' %}
          {%- for article in blog.articles -%}
            <li>{% block 'article-card', article: article %}{% endblock %}</li>
          {%- endfor -%}
        {% endblock %}
      {%- else -%}
        {% block 'empty-state' %}
          {% block 'heading', level: 2 %}{{ 'ripple.blueprints.blog.empty' | t }}{% endblock %}
        {% endblock %}
      {%- endif -%}
      {%- if paginate.previous or paginate.next -%}
        {% block 'pagination', previous_url: paginate.previous.url, next_url: paginate.next.url %}{% endblock %}
      {%- endif -%}
    {% endpaginate %}
  {% endblock %}
{% endblock %}
```

Locale keys (`ripple.blueprints.blog.*`): `empty` "No articles yet".

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Blog | `blog(handle:)`: `title` | `blog.title` |
| Articles | `blog.articles(first: 12, after:, before:, last:, sortKey: PUBLISHED_AT, reverse: true)` | `blog.articles` inside `{% paginate blog.articles by 12 %}` |

```graphql
query RippleBlog($blog: String!, $first: Int, $last: Int, $after: String, $before: String, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  blog(handle: $blog) {
    title
    handle
    articles(first: $first, last: $last, after: $after, before: $before, sortKey: PUBLISHED_AT, reverse: true) {
      nodes { id title handle excerpt publishedAt image { url altText width height } }
      pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    }
  }
}
```

`RippleArticle.url` is `/blogs/<blog handle>/<article handle>`; `excerpt` is `""` when the API returns `null`. Pagination URLs: rule CO-R3 with page size 12. UNVERIFIED: that mock.shop has a blog.

### No-JS behaviour

1. Cards and pagination are links. Nothing needs script.

### Acceptance tests

BT-1 to BT-9, plus:

- **BL-1** (tier 2) With `articles: []`: one `.rp-empty-state`, no `ul`.

---
