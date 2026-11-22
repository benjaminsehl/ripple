# Blueprint: `page`

> Blueprint spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its sections 1 (shared definitions) and 2 (blueprint conventions) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

### Purpose

A content page (About, FAQ, policies written as pages): title and rich text body in a reading-width column.

### Regions

None.

### Components used

`container`, `heading`, `rich-text`, `stack`.

### Structure

```text
Container width="prose" py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Heading level 1          page title
   └─ RichText                 page body (when not empty)
```

**React** (`blueprints/page/react/page.tsx`, complete except `PAGE_QUERY`):

```tsx
import { Container } from "@components/container";
import { Heading } from "@components/heading";
import { RichText } from "@components/rich-text";
import { Stack } from "@components/stack";

export interface PagePageProps {
  page: { title: string; bodyHtml: string };
}

export function PagePage(props: PagePageProps) {
  const { page } = props;
  return (
    <Container width="prose" py="12 md:20">
      <Stack gap="8 md:12">
        <Heading level={1}>{page.title}</Heading>
        {page.bodyHtml !== "" ? <RichText html={page.bodyHtml} /> : null}
      </Stack>
    </Container>
  );
}
```

**Remix**: rules R-1 to R-4. **html**: rule H-1.

**Liquid** (`blueprints/page/liquid/templates/page.liquid`, complete):

```liquid
{% block 'container', width: 'prose', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'heading', level: 1 %}{{ page.title | escape }}{% endblock %}
    {%- if page.content != blank -%}
      {% block 'rich-text', html: page.content %}{% endblock %}
    {%- endif -%}
  {% endblock %}
{% endblock %}
```

No locale keys.

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Page | `page(handle:) { id title body }`; `bodyHtml` is `body` | `page.title`, `page.content` |

```graphql
query RipplePage($handle: String!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  page(handle: $handle) { id title body }
}
```

A `null` page is a 404 (2.5). UNVERIFIED: that mock.shop has pages.

### No-JS behaviour

1. The page is static content.

### Acceptance tests

BT-1 to BT-9, plus:

- **PG-1** (tier 2) With an empty body: no `.rp-rich-text`.

---
