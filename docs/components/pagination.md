# Pagination

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `pagination` |
| Kind | `static` |
| Category | `navigation` |
| Custom elements | none |
| Root element and class | `nav` `.rp-pagination` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `button` |
| Milestone | M1 |

### Purpose

Links to the previous and next page of a paginated list (collection, search results, blog). The URL fully describes the page (D-047), so the links work without script.

- Use when: a list is split across pages.
- Do not use when: the list loads more items in place on scroll (not in v1).

The default body is previous and next links only. Reason: this is the one form that exists in every host. Storefront API connections are cursor-paginated and have no page numbers (the Hydrogen `Pagination` render prop gives `previousPageUrl` and `nextPageUrl`, `hydrogen/examples/hydrogen/app/components/Pagination.tsx`); Liquid `paginate` has numbers. A Liquid theme that wants numbered pages supplies them as the override body (see "Numbered pages" under HTML contract).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Pagination` | `blocks/pagination.liquid` | `nav` | `rp-pagination` | none | yes | none |
| previous | none (printed by the root when `previousUrl` is set) | none | `a` | `rp-button rp-pagination-previous` | none | no | none |
| next | none (printed by the root when `nextUrl` is set) | none | `a` | `rp-button rp-pagination-next` | none | no | none |
| current | none (author-written in an override body) | none | `span` | `rp-pagination-current` | none | no | none |

Nesting rules:

1. The caller MUST NOT render Pagination when both `previousUrl` and `nextUrl` are unset and it supplies no override body (the result would be an empty landmark).
2. Children (TSX) or block body (Liquid), when not blank, REPLACE the default body; the root then prints neither the previous nor the next part.
3. To refresh the list in place with JavaScript, the Pagination and the list are placed inside the same `rp-live` root (`05-commerce.md` section on `rp-live`; `11-components-commerce.md`). Pagination itself is unchanged by that.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `previousUrl` | `previous_url` | url | any URL | none (omitted) | no | no | when set: the previous part with this `href` and `rel="prev"` |
| `nextUrl` | `next_url` | url | any URL | none (omitted) | no | no | when set: the next part with this `href` and `rel="next"` |
| `ariaLabel` | `aria_label` | string | text | locale key `ripple.pagination.label` (`Pagination`) | no | no | `aria-label` on the root |
| `previousLabel` | `previous_label` | string | text | locale key `ripple.pagination.previous` (`Previous`) | no | no | text of the previous part |
| `nextLabel` | `next_label` | string | text | locale key `ripple.pagination.next` (`Next`) | no | no | text of the next part |

The previous and next parts are the Button contract (`## Button`) with `href`, `rel`, `variant="outline"`, `size="md"`, and the part class appended (FC-9, FC-10).

### Content model

`flow` - optional. Blank: the default body. Not blank: the override body, which SHOULD contain only Button links, `span.rp-pagination-current` and text.

### HTML contract

Fixture `default` (`nextUrl="/collections/all?page=2"`):

```html
<nav class="rp-pagination" aria-label="Pagination"><a class="rp-button rp-pagination-next" href="/collections/all?page=2" rel="next" data-variant="outline" data-size="md">Next</a></nav>
```

Fixture `both` (`previousUrl="/collections/all?page=1"`, `nextUrl="/collections/all?page=3"`):

```html
<nav class="rp-pagination" aria-label="Pagination"><a class="rp-button rp-pagination-previous" href="/collections/all?page=1" rel="prev" data-variant="outline" data-size="md">Previous</a><a class="rp-button rp-pagination-next" href="/collections/all?page=3" rel="next" data-variant="outline" data-size="md">Next</a></nav>
```

Fixture `labels` (`previousUrl="/blogs/news?page=1"`, `ariaLabel="Articles"`, `previousLabel="Newer"`):

```html
<nav class="rp-pagination" aria-label="Articles"><a class="rp-button rp-pagination-previous" href="/blogs/news?page=1" rel="prev" data-variant="outline" data-size="md">Newer</a></nav>
```

Numbered pages. Fixture `override` (`previousUrl` and `nextUrl` set and ignored; children as shown): the current page is a `span` with `aria-current="page"`, never a link (`02-html-contract.md` section 8, "Navigation state" row); other pages are Button links with `variant="ghost"`.

```html
<nav class="rp-pagination" aria-label="Pagination"><a class="rp-button" href="/collections/all?page=1" data-variant="ghost" data-size="md">1</a><span class="rp-pagination-current" aria-current="page">2</span><a class="rp-button" href="/collections/all?page=3" data-variant="ghost" data-size="md">3</a></nav>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{ "nextUrl": "/collections/all?page=2" }` | absent |
| `both` | `{ "previousUrl": "/collections/all?page=1", "nextUrl": "/collections/all?page=3" }` | absent |
| `labels` | `{ "previousUrl": "/blogs/news?page=1", "ariaLabel": "Articles", "previousLabel": "Newer" }` | absent |
| `override` | `{ "previousUrl": "/collections/all?page=1", "nextUrl": "/collections/all?page=3" }` | `<a class="rp-button" href="/collections/all?page=1" data-variant="ghost" data-size="md">1</a><span class="rp-pagination-current" aria-current="page">2</span><a class="rp-button" href="/collections/all?page=3" data-variant="ghost" data-size="md">3</a>` |
| `class` | `{ "nextUrl": "/collections/all?page=2", "class": "custom-a custom-b" }` | absent |
| `escaping` | `{ "nextUrl": "/collections/all?page=2", "ariaLabel": "Say \"hi\" & <go>" }` | absent |

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `aria-current` | current (override body) | server (author) | the page shown | `page` |

Upgrade allow-list (mutations permitted when the element upgrades): None. (Inside `rp-live` the whole fragment that contains the Pagination is replaced by the refresh; the allow-list of that replacement belongs to `rp-live`, `05-commerce.md`.)

### Behaviour with JavaScript

None of its own. Inside an `rp-live` root, a click on a link is intercepted by `rp-live`, which fetches the URL, replaces the live region and updates the address bar (D-047; `05-commerce.md`).

### Behaviour without JavaScript

Fully functional: each link navigates to the page URL.

### Events, commands and methods

None.

### Accessibility

- Pattern: navigation landmark with links; `checkPattern`: none.
- Accessible name: `aria-label` on the `nav`, default `Pagination` (locale key `ripple.pagination.label`), per `02-html-contract.md` A-10. A page with two Paginations (above and below the list) MUST give them different labels.
- Focus: each link is in the tab order. After a no-JS navigation focus starts at the top of the new page; after an `rp-live` refresh focus handling is that of `rp-live`.
- Announcements: none of its own.
- A missing direction is omitted, not printed as a disabled control, so that no dead control is in the tab order.

| Key | Action |
|---|---|
| `Tab` | moves to the next link |
| `Enter` | follows the focused link |

### Styling

- File: `components/pagination/pagination.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--spacing-control-md`, `--text-sm`, `--font-weight-medium`, `--radius-control`, `--color-secondary`, `--color-secondary-foreground`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-pagination-gap` | `calc(var(--spacing) * 2)` | gap between children |

| Modifier selector | Sets |
|---|---|
| none | |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-pagination` | custom properties: `--rp-pagination-gap`. Declarations: `display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--rp-pagination-gap); margin: 0` |
| PARTS | `.rp-pagination-current` | `display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; min-inline-size: var(--spacing-control-md); min-block-size: var(--spacing-control-md); padding-inline: calc(var(--spacing) * 3); border: 1px solid transparent; border-radius: var(--radius-control); background-color: var(--color-secondary); color: var(--color-secondary-foreground); font-size: var(--text-sm); font-weight: var(--font-weight-medium)` |

The file has no rule for `.rp-pagination-previous` or `.rp-pagination-next`: they are Buttons and take all their appearance from `button.css`. The two classes exist as stable hooks for the author's own CSS and for tests.

### Host notes

- Binding paths (D-139): `static` that the template language of `07-manifest-registry-cli.md` 2.3 cannot express (D-072 row 2): no `template`; every fixture is `generated: "hand"`; `html` is generated from the fixture files; the `react`, `remix` and `liquid` files are hand-written with their generated regions. Where a line below says a binding is "generated", this line wins.
- HTML: None.
- React: `export function Pagination(props: PaginationProps)`; generated. `children` not `null`, `undefined`, `false` or `""` selects the override body. `previousLabel = "Previous"`, `nextLabel = "Next"`, `ariaLabel = "Pagination"` are default parameter values.
- Remix: None. (With Hydrogen's `<Pagination>` render prop, pass `previousPageUrl` and `nextPageUrl` as `previousUrl` and `nextUrl`, each only when `hasPreviousPage` or `hasNextPage` is true.)
- Liquid: tier `resource`: `{% if content != blank %}{{ content }}{% else %}` default body `{% endif %}` (`06-bindings.md` L-6). The default body renders `{% render 'rp-button', href: previous_url, rel: 'prev', variant: 'outline', class: 'rp-pagination-previous', content: previous_label %}` when `previous_url != blank`, and the same for next. Schema settings: none. Locale keys: `ripple.pagination.name`, `ripple.pagination.label`, `ripple.pagination.previous`, `ripple.pagination.next`.

```tsx
<Pagination previousUrl={hasPreviousPage ? previousPageUrl : undefined} nextUrl={hasNextPage ? nextPageUrl : undefined} />
```

```liquid
{% paginate collection.products by 24 %}
  {%- comment -%} product grid here {%- endcomment -%}
  {% if paginate.pages > 1 %}
    {% block 'pagination', previous_url: paginate.previous.url, next_url: paginate.next.url %}{% endblock %}
  {% endif %}
{% endpaginate %}
```

Numbered pages in Liquid (override body):

```liquid
{% assign current = paginate.current_page | append: '' %}
{% block 'pagination' %}
  {% for part in paginate.parts %}
    {% if part.is_link %}
      {% block 'button', href: part.url, variant: 'ghost' %}{{ part.title }}{% endblock %}
    {% elsif part.title == current %}
      <span class="rp-pagination-current" aria-current="page">{{ part.title }}</span>
    {% else %}
      <span aria-hidden="true">{{ part.title }}</span>
    {% endif %}
  {% endfor %}
{% endblock %}
```

### Commerce

None. Pagination takes URLs, not a resource object; the caller reads them from `paginate` (Liquid) or from the connection's page info (Hydrogen). In-place refresh is `rp-live` (`05-commerce.md`, D-047).

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4. Manifest `rules[]` (reported by RP113, D-059): `pagination-current-not-link`: kind `max-count`, selector `a[aria-current]`, count `0`. Message: "The current page of a Pagination is a link." Fix: "Print the current page as span.rp-pagination-current with aria-current=\"page\", not as a link."

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 2: fixture `default` contains exactly one `a` and it has classes `rp-button rp-pagination-next` and `rel="next"`; fixture `both` contains the previous link before the next link; fixture `override` contains neither `.rp-pagination-previous` nor `.rp-pagination-next`.
3. Tier 2: for fixtures `default`, `both`, `labels`, each `a` with its part class removed equals the Button contract for the same `href`, `rel`, `variant="outline"` and children (canonical comparison against a Button render).
4. Tier 2: the Liquid host with no label params prints `Previous`, `Next` and `aria-label="Pagination"` from `locales/en.default.json`.
5. Tier 3: the accessibility snapshot of fixture `both` is a navigation named `Pagination` with two links named `Previous` and `Next`.
6. Tier 6: with JavaScript disabled, activating the next link of fixture `both` (served on a test route) navigates to `/collections/all?page=3`.
7. Tier 5: fixture `override`: the current part computes a box of at least 44 by 44 px at default dials and is not focusable (`tabIndex` is `-1`).

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` D-047 (Pagination is links whose URL describes the state; `rp-live` intercepts with JS), section 8.1 (`nav`, tier `resource`), D-037 and `ripple/docs/06-bindings.md` section 8.2 tier table and L-6 (override body); `ripple/docs/02-html-contract.md` A-10, section 8 "Navigation state" row; `ripple/docs/05-commerce.md` section on `rp-live` ("Pagination when it refreshes in place"); `hydrogen/examples/hydrogen/app/components/Pagination.tsx` (render prop exposes `previousPageUrl`, `nextPageUrl`, `hasPreviousPage`, `hasNextPage`).
- Verified with the Shopify docs MCP tool (`https://shopify.dev/docs/api/liquid/objects/paginate`, `https://shopify.dev/docs/api/liquid/objects/part`): `paginate.parts`, `paginate.next` (a `part`), `paginate.current_page` (number), `part.is_link`, `part.title` (string), `part.url`.
- UNVERIFIED: `paginate.previous` and `paginate.pages` (not in the excerpt returned by the tool); confirm them before the Liquid blueprint is written. The contract does not depend on them.

### Fallback (SPIKE-nn)

None.

---
