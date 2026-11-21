# ArticleCard

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `article-card` |
| Kind | `static` |
| Category | `product` |
| Custom elements | none |
| Root element and class | `div` `.rp-article-card` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `image`, `placeholder` |
| Milestone | M3 |

### Purpose

A blog article summary: image, date, title link and excerpt.

- Use when: listing articles on a blog page or a home page.
- Do not use when: rendering the article itself; use Heading and RichText.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `ArticleCard` | `blocks/article-card.liquid` | `div` | `rp-article-card` | none | yes | none |
| media | printed by root | same | `div` | `rp-article-card-media` | none | yes | none |
| body | printed by root | same | `div` | `rp-article-card-body` | none | yes | none |
| date | printed by root | same | `time` | `rp-article-card-date` | none | yes | none |
| title | printed by root | same | `h2` to `h6` | `rp-article-card-title` | none | yes | none |
| link | printed by root | same | `a` | `rp-article-card-link` | none | yes | none |
| excerpt | printed by root | same | `p` | `rp-article-card-excerpt` | none | no | none |

Nesting rules: media then body are the only children of root. Inside body, in order: date, title, excerpt. The excerpt part is printed only when the excerpt is not empty. MUST NOT be placed inside an `<a>` or a `<button>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `article` | `article` | object | `RippleArticle` / Liquid `article` drop | none | yes | no | text, `href`, Image, `datetime` |
| `level` | `level` | enum | `2 3 4 5 6` | `3` | no | no | the tag of the title part |
| `ratio` | `ratio` | enum | `auto 1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9` | `3/2` | no | no | `data-ratio` on the embedded Image or Placeholder |
| `sizes` | `sizes` | string | any `sizes` value | `(min-width: 64rem) 33vw, 100vw` | no | no | `sizes` on the embedded Image |
| `loading` | `loading` | enum | `lazy eager` | `lazy` | no | no | `loading` on the embedded Image |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | date text; TSX hosts only |

### Content model

`none` in TSX hosts. Liquid: `{{ content }}`, when not blank, replaces every child of the root (CV-6).

### HTML contract

Fixture `default` (`article`: `article.basic`):

```html
<div class="rp-article-card">
  <div class="rp-article-card-media">
    <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/wash.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/wash.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/wash.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/wash.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/wash.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/wash.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/wash.jpg?width=1600 1600w" sizes="(min-width: 64rem) 33vw, 100vw" alt="Linen in a basin" width="1500" height="1000" loading="lazy" decoding="async" data-ratio="3/2" data-fit="cover" data-radius="none">
  </div>
  <div class="rp-article-card-body">
    <time class="rp-article-card-date" datetime="2026-06-01">Jun 1, 2026</time>
    <h3 class="rp-article-card-title"><a class="rp-article-card-link" href="/blogs/news/how-to-wash-linen">How to wash linen</a></h3>
    <p class="rp-article-card-excerpt">Cold water and patience.</p>
  </div>
</div>
```

Further required fixtures: `class`; `invalid-enum-falls-back` (`level`: `9`; equals `default`); `escaping` (`sizes`: `Say "hi" & <go>`); `props` (`level`: `2`, `ratio`: `16/9`, `loading`: `eager`).

Host-owned regions and masks: no host-owned region. Masks: `img` `src` and `srcset`; `{ "select": ".rp-article-card-date", "op": "text" }` (date text is formatted by the backend's locale rules). The `datetime` attribute is NOT masked: it MUST be the first 10 characters of the ISO 8601 publication time in UTC.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| None. | | | | |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None.

### Behaviour without JavaScript

Everything works: the title link navigates to the article.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: native link inside a heading; `checkPattern`: none.
- Accessible name: the link text (article title); required.
- Focus: one tab stop per card.
- Announcements: None.

| Key | Action |
|---|---|
| Enter | follows the link |

### Styling

- File: `components/article-card/article-card.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--radius-surface`, `--color-foreground`, `--color-muted-foreground`, `--color-ring`, `--text-sm`, `--text-lg`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-article-card-gap` | `calc(var(--spacing) * 3)` | space between media and body |
| `--rp-article-card-radius` | `var(--radius-surface)` | corner radius of the media |

| Modifier selector | Sets |
|---|---|
| None. | |

Required rules: the same overlay-link and focus rules as ProductCard, with the `rp-article-card-` classes; the excerpt is clamped to three lines with `-webkit-line-clamp: 3`.

### Host notes

- HTML: None.
- React: `ArticleCard(props: { article: RippleArticle; level?: 2 | 3 | 4 | 5 | 6; ratio?: Ratio; sizes?: string; loading?: "lazy" | "eager"; locale?: string; className?: string })`. Date text: `new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(article.publishedAt))`. `datetime`: `article.publishedAt.slice(0, 10)`.
- Remix: None.
- Liquid: date text `{{ article.published_at | date: format: 'abbreviated_date' }}`; `datetime="{{ article.published_at | date: '%Y-%m-%d' }}"`. Excerpt: `article.excerpt` printed with `| escape` (plain text; an HTML excerpt is not supported in V1). No schema settings. No locale keys.

```tsx
<ArticleCard article={article} />
```

```liquid
{% block 'article-card', article: article %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP101, RP104 (`article`), RP110, RP203. Manifest `rules[]`: `article-card-not-in-link` (`forbids-ancestor`, selector `:scope`, target `a, button`).

### Acceptance tests

1. Tier 2: fixtures `default`, `class`, `invalid-enum-falls-back`, `escaping`, `props` are canonical-equal in all four hosts with the masks above; the `datetime` value is `2026-06-01` in every host.
2. Tier 6: with scripting disabled a click on the image navigates to the article URL.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/templates/blog.liquid`; `ripple/docs/research/base-theme.md`.
- UNVERIFIED: the Liquid `date` filter argument `format: 'abbreviated_date'` in the shim (the shim MUST implement it as `Jun 1, 2026` for `en`); Storefront API field names of `RippleArticleCard`.

### Fallback (SPIKE-nn)

None.

---
