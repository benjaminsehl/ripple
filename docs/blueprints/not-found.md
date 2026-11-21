# Blueprint: `not-found`

> Blueprint spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its sections 1 (shared definitions) and 2 (blueprint conventions) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

### Purpose

The page shown for an unknown URL (HTTP 404): a message and ways forward.

### Regions

None.

### Components used

`button`, `container`, `empty-state`, `heading`, `search-form`, `stack`, `text`.

### Structure

```text
Container py="12 md:20"
└─ Stack gap="8 md:12" align="center"
   ├─ EmptyState
   │  ├─ Heading level 1
   │  ├─ Text tone="muted"
   │  └─ Button href (home)
   └─ SearchForm
```

**React** (`blueprints/not-found/react/not-found.tsx`, complete):

```tsx
import { Button } from "@components/button";
import { Container } from "@components/container";
import { EmptyState } from "@components/empty-state";
import { Heading } from "@components/heading";
import { SearchForm } from "@components/search-form";
import { Stack } from "@components/stack";
import { Text } from "@components/text";

export interface NotFoundPageProps {
  /** Home URL, for example "/" or "/fr-ca". */
  homeUrl: string;
  searchUrl?: string;
}

export function NotFoundPage(props: NotFoundPageProps) {
  const { homeUrl, searchUrl = "/search" } = props;
  return (
    <Container py="12 md:20">
      <Stack gap="8 md:12" align="center">
        <EmptyState>
          <Heading level={1}>Page not found</Heading>
          <Text tone="muted">The page you were looking for does not exist.</Text>
          <Button href={homeUrl}>Continue shopping</Button>
        </EmptyState>
        <SearchForm action={searchUrl} />
      </Stack>
    </Container>
  );
}
```

**Remix**: rules R-1 to R-4. **html**: rule H-1.

**Liquid** (`blueprints/not-found/liquid/templates/404.liquid`, complete):

```liquid
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12', align: 'center' %}
    {% block 'empty-state' %}
      {% block 'heading', level: 1 %}{{ 'ripple.blueprints.not-found.title' | t }}{% endblock %}
      {% block 'text', tone: 'muted' %}{{ 'ripple.blueprints.not-found.text' | t }}{% endblock %}
      {% block 'button', href: routes.root_url %}{{ 'ripple.blueprints.not-found.cta' | t }}{% endblock %}
    {% endblock %}
    {% block 'search-form' %}{% endblock %}
  {% endblock %}
{% endblock %}
```

Locale keys (`ripple.blueprints.not-found.*`): `title` "Page not found"; `text` "The page you were looking for does not exist."; `cta` "Continue shopping".

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Home URL | `requestContext.locale.pathPrefix \|\| "/"` | `routes.root_url` |
| Status | the response status MUST be 404. The app's not-found path MUST return a 404 `Response` through the middleware chain so that `handleShopifyRedirects` can run first (`ripple/docs/research/remix-3.md` section 8.1) | the platform sets 404 |

No query.

### No-JS behaviour

1. The button is a link; the search form is a GET form.

### Acceptance tests

BT-1 to BT-9, plus:

- **NF-1** (tier 5, hydrogen backend) A request for `/no-such-page` answers status 404 and the body contains the `h1` of this blueprint inside `main#main`.

---
