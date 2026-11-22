# Blueprint: `article`

> Blueprint spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its sections 1 (shared definitions) and 2 (blueprint conventions) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

### Purpose

One blog article: title, date and author, lead image, body, and a link back to the blog. Comments are not part of V1 (the base theme's comment list and `new_comment` form in `ripple/theme/templates/article.liquid` are not ported; D-107 item 6, Q19). The template MUST NOT contain a comment form or a comment list.

### Regions

None.

### Components used

`container`, `heading`, `image`, `link`, `rich-text`, `stack`, `text`.

### Structure

```text
Container width="prose" py="12 md:20"
└─ Stack as="article" gap="8 md:12"
   ├─ Stack as="header" gap="2":  Heading level 1 (title); Text tone="muted" size="sm" (date, author)
   ├─ Image ratio="16/9" eager, fetchPriority high, sizes="(min-width: 48rem) 65ch, 100vw"   (when the article has an image)
   ├─ RichText                                                                           (when the body is not empty)
   └─ Link                                    back to the blog
```

**React** (`blueprints/article/react/article.tsx`, complete except `ARTICLE_QUERY`):

```tsx
import type { RippleImage } from "__PKG__";
import { Container } from "@components/container";
import { Heading } from "@components/heading";
import { Image } from "@components/image";
import { Link } from "@components/link";
import { RichText } from "@components/rich-text";
import { Stack } from "@components/stack";
import { Text } from "@components/text";

export interface ArticlePageProps {
  article: {
    title: string;
    contentHtml: string;
    /** Publication date already formatted for the request locale, for example "March 4, 2026". */
    publishedLabel: string;
    /** Author name, or "" when unknown. */
    author: string;
    image: RippleImage | null;
  };
  blog: { title: string; url: string };
}

export function ArticlePage(props: ArticlePageProps) {
  const { article, blog } = props;
  const meta = article.author !== "" ? `${article.publishedLabel} · ${article.author}` : article.publishedLabel;
  return (
    <Container width="prose" py="12 md:20">
      <Stack as="article" gap="8 md:12">
        <Stack as="header" gap="2">
          <Heading level={1}>{article.title}</Heading>
          <Text tone="muted" size="sm">{meta}</Text>
        </Stack>
        {article.image !== null ? (
          <Image image={article.image} ratio="16/9" loading="eager" fetchPriority="high" sizes="(min-width: 48rem) 65ch, 100vw" />
        ) : null}
        {article.contentHtml !== "" ? <RichText html={article.contentHtml} /> : null}
        <Link href={blog.url}>{`Back to ${blog.title}`}</Link>
      </Stack>
    </Container>
  );
}
```

**Remix**: rules R-1 to R-4. **html**: rule H-1.

**Liquid** (`blueprints/article/liquid/templates/article.liquid`, complete):

```liquid
{%- liquid
  assign article_date = article.published_at | date: format: 'date'
  assign author = article.author | escape
  if article.author != blank
    assign meta = 'ripple.blueprints.article.meta' | t: date: article_date, author: author
  else
    assign meta = article_date
  endif
  assign blog_title = blog.title | escape
-%}
{% block 'container', width: 'prose', py: '12 md:20' %}
  {% block 'stack', as: 'article', gap: '8 md:12' %}
    {% block 'stack', as: 'header', gap: '2' %}
      {% block 'heading', level: 1 %}{{ article.title | escape }}{% endblock %}
      {% block 'text', tone: 'muted', size: 'sm' %}{{ meta }}{% endblock %}
    {% endblock %}
    {%- if article.image -%}
      {% block 'image', image: article.image, ratio: '16/9', loading: 'eager', fetch_priority: 'high', sizes: '(min-width: 48rem) 65ch, 100vw' %}{% endblock %}
    {%- endif -%}
    {%- if article.content != blank -%}
      {% block 'rich-text', html: article.content %}{% endblock %}
    {%- endif -%}
    {% block 'link', href: blog.url %}{{ 'ripple.blueprints.article.back' | t: title: blog_title }}{% endblock %}
  {% endblock %}
{% endblock %}
```

Locale keys (`ripple.blueprints.article.*`): `meta` "{{ date }} · {{ author }}"; `back` "Back to {{ title }}". Mask for BT-3: `{ "select": "header > .rp-text", "op": "text" }` (date formatting is host-owned). Evidence: `ripple/theme/templates/article.liquid` (`article.title`, `article.published_at | date: format: 'date'`, `article.author`, `article.image`, `article.content`). UNVERIFIED: `blog.url`, `blog.title` on the article template (documented globals, not re-read).

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Article | `blog(handle:) { articleByHandle(handle:) }` | `article` |
| Blog title and URL | `blog.title`; URL `/blogs/<blog handle>` | `blog.title`, `blog.url` |
| Date text | `new Intl.DateTimeFormat(<BCP 47 tag>, { dateStyle: "long" }).format(new Date(publishedAt))` | `article.published_at \| date: format: 'date'` |

```graphql
query RippleArticle($blog: String!, $article: String!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  blog(handle: $blog) {
    title
    handle
    articleByHandle(handle: $article) {
      id title contentHtml publishedAt
      image { url altText width height }
      authorV2 { name }
    }
  }
}
```

`author` is `authorV2.name` or `""`. A `null` blog or article is a 404 (2.5). UNVERIFIED against the schema in this session: `articleByHandle`, `authorV2`.

### No-JS behaviour

1. The page is static content and one link.

### Acceptance tests

BT-1 to BT-9, plus:

- **AR-1** (tier 2) Without an image and with an empty body: no `img`, no `.rp-rich-text`; the `h1` and the back link exist.
- **AR-2** (tier 2) With an image: it has `loading="eager"` and `fetchpriority="high"`.

---
