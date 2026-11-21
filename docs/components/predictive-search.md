# PredictiveSearch

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `predictive-search` |
| Kind | `commerce` |
| Category | `discovery` |
| Custom elements | `rp-predictive-search` |
| Root element and class | `rp-predictive-search` `.rp-predictive-search` |
| Liquid tier | `resource` |
| No-JS level | `degraded` (a plain search form; no results while typing) |
| Requires `id` | yes |
| Depends on | `search-form`, `product-card` |
| Milestone | M3 |

### Purpose

A search form that shows product results in a panel while the buyer types (D-048). The results are server-rendered: the element fetches the region `rp-predictive-results` for the search URL.

- Use when: the header search should suggest products.
- Do not use when: a plain search box is enough (SearchForm), or a combobox pattern is required (not provided in V1; D-048).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `PredictiveSearch` | `blocks/predictive-search.liquid` + `snippets/rp-predictive-search.liquid` | `rp-predictive-search` | `rp-predictive-search` | `data-slot="rp-predictive-search"` | yes | `<id>` |
| form | printed by root | same | SearchForm (`predictive`) | `rp-search-form` | input: `data-rp-part="input"` | yes | none |
| panel | printed by root | same | `div` | `rp-predictive-search-panel` | `data-rp-part="results"` | yes | `<id>-content` |
| results (region part) | `PredictiveSearchResults` | `snippets/rp-predictive-search-results.liquid` | `div` | `rp-predictive-search-results` | `data-rp-region="rp-predictive-results"` | yes | none |
| list | printed by results | same | `ul` | `rp-predictive-search-list` | `role="list"` (fixed attribute) | when there are results | none |
| all | printed by results | same | `a` | `rp-predictive-search-all` | none | when there are results | none |
| empty | printed by results | same | `p` | `rp-predictive-search-empty` | none | when terms were given and nothing matched | none |
| status | printed by results | same | `p` | `rp-visually-hidden` | `data-rp-part="status"` | when terms were given | none |

Nesting rules: root children in order: form, panel. The panel contains only the results part. Results children: when no terms were searched: none; with results: list, all, status; with terms and no results: empty, status. Each `li` of the list contains one ProductCard (`level` `3`, `ratio` `1/1`, `sizes` `6rem`). The server MUST print `hidden` on the panel in every case. Children (`{{ content }}`) replace the default rendering of the results part (RS-2). At most one PredictiveSearch per page (the region name must be unique, RP308).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on root; `<id>-content` on the panel |
| `action` | `action` | url | the search route | `/search` (Liquid: `routes.search_url`) | no | no | `action` of the form; `href` base of the all link |
| `results` | none | object | `{ terms: string; products: RippleProduct[]; total: number } \| null` | `null` | no | no | the results part |
| none | `search` | object | Liquid `search` drop | the global `search` | no | no | the results part (`search.performed`, `search.terms`, `search.results`, `search.results_count`) |
| `placeholder` | `placeholder` | string | any text | none | no | no | passed to SearchForm |
| `limit` | `limit` | number | integer 1 to 10 | `6` | no | no | maximum number of cards |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | passed to ProductCard (CV-1) |

The form always contains `<input type="hidden" name="type" value="product">`, so that the fetched URL returns products only. The region part takes `results`, `action`, `limit`, `locale` (Liquid: the snippet `rp-predictive-search-results` takes exactly `search`, `action`, `limit`; every call passes all three, D-091 item 4).

### Content model

`parts` - children replace the default rendering of the results part (RS-2).

### HTML contract

Fixture `default` (`id`: `psearch`; no results):

```html
<rp-predictive-search class="rp-predictive-search" data-slot="rp-predictive-search" id="psearch">
  <form class="rp-search-form" method="get" action="/search" role="search">
    <input type="hidden" name="type" value="product">
    <input class="rp-input rp-search-form-input" type="search" data-size="md" name="q" aria-label="Search" autocomplete="off" data-rp-part="input">
    <button class="rp-icon-button rp-search-form-submit" type="submit" data-variant="ghost" data-size="md" aria-label="Search"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></button>
  </form>
  <div class="rp-predictive-search-panel" id="psearch-content" data-rp-part="results" hidden>
    <div class="rp-predictive-search-results" data-rp-region="rp-predictive-results"></div>
  </div>
</rp-predictive-search>
```

Fixture `results` (`id`: `psearch`, resource `search.shirt`): as `default`, with `value="shirt"` on the search input (placed after `name="q"`), and this results part (each comment stands for the complete ProductCard reference HTML for the stated props):

```html
    <div class="rp-predictive-search-results" data-rp-region="rp-predictive-results">
      <ul class="rp-predictive-search-list" role="list">
        <li><!-- ProductCard for product.basic: default props except sizes `6rem` --></li>
        <li><!-- ProductCard for product.sale: default props except sizes `6rem` --></li>
      </ul>
      <a class="rp-predictive-search-all" href="/search?q=shirt">View all 2 results</a>
      <p class="rp-visually-hidden" data-rp-part="status">2 results</p>
    </div>
```

Fixture `no-results` (terms `zzz`, no products, total 0): as `default`, with `value="zzz"` on the input, and this results part:

```html
    <div class="rp-predictive-search-results" data-rp-region="rp-predictive-results">
      <p class="rp-predictive-search-empty">No results for “zzz”</p>
      <p class="rp-visually-hidden" data-rp-part="status">No results</p>
    </div>
```

Text rules: status and all-link use the total: total 1: `1 result` and `View 1 result`; otherwise `<n> results` and `View all <n> results`. The all link is `<action>?q=<terms, URL-encoded>`.

Further required fixtures: `placeholder` (`placeholder`: `Search products`); `class` (root class `rp-predictive-search custom-a custom-b`); `children` (children `<div data-rp-region="rp-predictive-results"></div>`); `escaping` (terms `Say "hi" & <go>` with no results; empty text `No results for “Say "hi" &amp; &lt;go&gt;”`).

Host-owned regions and masks: none host-owned. Masks: those of ProductCard inside the list; `{ "select": ".rp-predictive-search-all", "op": "attr", "name": "href" }` (URL encoding of the terms differs by backend).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `hidden` | panel | `rp-predictive-search` | the panel is closed | present |
| `data-pending` | root | `rp-predictive-search` | a request is running | absent |
| `aria-busy` | root | `rp-predictive-search` | same (`"true"`) | absent |
| `aria-busy` | results | commerce adapter | the region is refreshing | absent |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-predictive-search", "attrs": ["data-pending", "aria-busy"], "reason": "The browser can restore a typed query, which starts a request at upgrade." }`, `{ "select": "[data-rp-part=\"results\"]", "attrs": ["hidden"], "reason": "The panel opens when a restored query has results." }`, `{ "select": "[data-rp-region]", "attrs": ["aria-busy"], "childList": true, "text": true, "subtree": true, "reason": "A refresh that completes during upgrade replaces the region content." }`.

### Behaviour with JavaScript

1. Typing in the input: after 200 ms without input the element requests the region for the form's URL (`<action>?type=product&q=<terms>`) with `refresh(["rp-predictive-results"], { reason: "predictive" })`. No history entry is made. An empty (trimmed) value hides the panel and sends nothing.
2. When the region for the latest term arrives, the panel's `hidden` is removed and the trimmed text of the status part is announced.
3. ArrowDown from the input moves focus to the first result link; ArrowDown and ArrowUp move between the links in the panel (card links, then the all link); ArrowUp on the first link returns to the input; ArrowDown on the last link stays.
4. Escape hides the panel and focuses the input. Focus leaving the root hides the panel.
5. Enter in the input submits the form natively to the search page.
6. A failed request leaves the page unchanged; no navigation.
7. It is not an ARIA combobox: the server and the element print no `role="combobox"`, no `aria-expanded`, no `aria-activedescendant`.

### Behaviour without JavaScript

A plain search form: the panel stays `hidden`; submitting navigates to the search page. Missing: results while typing.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: search field with a disclosure-like results panel reached by arrow keys or Tab; `checkPattern`: none (D-048).
- Accessible name: the input's `aria-label` (SearchForm). Each result is a ProductCard link named by the product title.
- Focus: the input keeps focus while typing; arrow keys and Tab reach the results; Escape returns to the input.
- Announcements: the status text (`2 results`, `No results`) through `announce()` after each completed request.

| Key | Action |
|---|---|
| ArrowDown, ArrowUp | move between the input and the result links |
| Escape | closes the panel, focuses the input |
| Enter (input) | goes to the search page |
| Enter (link) | follows the link |

### Styling

- File: `components/predictive-search/predictive-search.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-popover`, `--color-popover-foreground`, `--color-border`, `--radius-surface`, `--shadow-lg`, `--rp-z-overlay`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-predictive-search-panel-max-height` | `min(70vh, 32rem)` | maximum block size of the panel |
| `--rp-predictive-search-columns` | `2` | card columns in the list |
| `--rp-predictive-search-gap` | `calc(var(--spacing) * 4)` | panel padding and list gap |

| Modifier selector | Sets |
|---|---|
| `.rp-predictive-search[data-pending]` | nothing; reserved for project CSS |

Required rules: root `position: relative; display: block`; panel `position: absolute; inset-inline: 0; inset-block-start: 100%; z-index: var(--rp-z-overlay); max-block-size: var(--rp-predictive-search-panel-max-height); overflow-y: auto; background: var(--color-popover); color: var(--color-popover-foreground); border: 1px solid var(--color-border); border-radius: var(--radius-surface); box-shadow: var(--shadow-lg); padding: var(--rp-predictive-search-gap)`; `.rp-predictive-search-panel[hidden] { display: none }`; list `list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(var(--rp-predictive-search-columns), minmax(0, 1fr)); gap: var(--rp-predictive-search-gap)`. The panel is positioned with CSS only (no anchor positioning, no JavaScript).

### Host notes

- HTML: copy the `default` contract; the server that answers `<action>?q=` MUST render the same component with the region filled.
- React: `PredictiveSearch(props: { id: string; action?: string; results?: { terms: string; products: RippleProduct[]; total: number } | null; placeholder?: string; limit?: number; locale?: string; className?: string; children?: ReactNode })` and the region part `PredictiveSearchResults` (complete code below). The file starts with `"use client";` because the region part calls a hook, and it exports components only (D-094). On `react` the adapter's strategy for reason `predictive` fetches the URL, takes the inner HTML of the region `rp-predictive-results` from the response and publishes it; `PredictiveSearchResults` reads it with `useRegionHtml("rp-predictive-results")` from `<pkg>/react` (D-090). While the hook returns `null` the part renders its server children from the `results` prop; afterwards it renders the HTML string with `dangerouslySetInnerHTML` on the region root. There is no navigation. UNVERIFIED (SPIKE-10); see `Fallback (SPIKE-10)`.

  `components/predictive-search/react/predictive-search.tsx` MUST contain this region part unchanged (`__PKG__` is replaced by the package name at install):

  ```tsx
  "use client";

  import type { RippleProduct } from "__PKG__";
  import { useRegionHtml } from "__PKG__/react";
  import { ProductCard } from "./product-card";

  export interface PredictiveSearchResultsProps {
    results?: { terms: string; products: RippleProduct[]; total: number } | null;
    action?: string;
    limit?: number;
    locale?: string;
    strings?: {
      resultsOne?: string;
      resultsOther?: string;
      viewOne?: string;
      viewAll?: string;
      empty?: string;
      none?: string;
    };
  }

  export function PredictiveSearchResults(props: PredictiveSearchResultsProps) {
    const { results = null, action = "/search", limit = 6, locale = "en-US", strings = {} } = props;
    const html = useRegionHtml("rp-predictive-results");

    if (html !== null) {
      return (
        <div
          className="rp-predictive-search-results"
          data-rp-region="rp-predictive-results"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    if (results === null) {
      return <div className="rp-predictive-search-results" data-rp-region="rp-predictive-results" />;
    }

    const count = String(results.total);
    if (results.products.length === 0) {
      return (
        <div className="rp-predictive-search-results" data-rp-region="rp-predictive-results">
          <p className="rp-predictive-search-empty">
            {(strings.empty ?? "No results for “{{ terms }}”").replace("{{ terms }}", results.terms)}
          </p>
          <p className="rp-visually-hidden" data-rp-part="status">
            {strings.none ?? "No results"}
          </p>
        </div>
      );
    }

    const status =
      results.total === 1
        ? strings.resultsOne ?? "1 result"
        : (strings.resultsOther ?? "{{ count }} results").replace("{{ count }}", count);
    const all =
      results.total === 1
        ? strings.viewOne ?? "View 1 result"
        : (strings.viewAll ?? "View all {{ count }} results").replace("{{ count }}", count);

    return (
      <div className="rp-predictive-search-results" data-rp-region="rp-predictive-results">
        <ul className="rp-predictive-search-list" role="list">
          {results.products.slice(0, limit).map((product) => (
            <li key={product.id}>
              <ProductCard product={product} level={3} ratio="1/1" sizes="6rem" locale={locale} />
            </li>
          ))}
        </ul>
        <a className="rp-predictive-search-all" href={`${action}?q=${encodeURIComponent(results.terms)}`}>
          {all}
        </a>
        <p className="rp-visually-hidden" data-rp-part="status">
          {status}
        </p>
      </div>
    );
  }
  ```
- Remix: `data-rmx-key="<id>"` on root.
- Liquid: the results snippet prints content only when `search.performed`; it loops `search.results` with `limit: <limit>` and renders `rp-product-card` for items whose `object_type == 'product'`; total `search.results_count`. The LAYOUT MUST wrap the region part in the partial (RS-3), as in the usage below. No schema settings. Locale keys: `ripple.predictive-search.results_one` = `1 result`; `ripple.predictive-search.results_other` = `{{ count }} results`; `ripple.predictive-search.view_one` = `View 1 result`; `ripple.predictive-search.view_all` = `View all {{ count }} results`; `ripple.predictive-search.empty` = `No results for “{{ terms }}”`; `ripple.predictive-search.none` = `No results`.

Hydrogen data: on a request whose URL has a `q` parameter, the loader of the layout that renders the header passes `results`: `terms` = `q`; `products` and `total` from the `predictiveSearch` query of section 0.6, or from the first `limit` nodes and `totalCount` of the page's `search` query. On every other request it passes `null`.

```tsx
<PredictiveSearch id="psearch" results={results} placeholder="Search products" />
```

```liquid
{% block 'predictive-search', id: 'psearch' %}
  {% partial 'rp-predictive-results' %}{% render 'rp-predictive-search-results', search: search, action: routes.search_url, limit: 6 %}{% endpartial %}
{% endblock %}
```

### Commerce

- Store fields read: none.
- Adapter methods called: `refresh`, `usable`.
- Regions refreshed: `rp-predictive-results`; `reason: "predictive"`; no history change; no navigation fallback.
- Pending and error behaviour: root `data-pending` / `aria-busy` while a request runs; errors are silent.

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Request URL | `<action>?type=product&q=<terms>` (document; region extracted) | the same URL through `partials.fetch` |
| Results | `predictiveSearch` or `search` query in the loader | `search.results` |

### Agent surface

`accessibility-tree` (the input and the result links). Bridge: component `rp-predictive-search`, manifest `agent.actions`: `["setQuery", "clear"]` ([08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.2, D-095): `setQuery(query: string): void` sets the input value and starts the request of behaviour item 1; `clear(): void` empties the input and hides the panel. Confirm: none. Secret: none.

### Checker rules

RP104 (`id`), RP114 (`<id>-content`), RP115 (no `role="combobox"`), RP308 (one region `rp-predictive-results`), RP403 (Liquid: partial declared in the layout). Manifest `rules[]`: `predictive-search-input` (`requires-descendant`, selector `:scope`, target `form[method="get"] input[type="search"][name="q"][data-rp-part="input"]`); `predictive-search-panel` (`requires-descendant`, selector `:scope`, target `[data-rp-part="results"][hidden] [data-rp-region="rp-predictive-results"]`; "The results panel must be printed hidden and must contain the region."); `predictive-search-one` (`max-count`, selector `rp-predictive-search`, count 1).

### Acceptance tests

1. Tier 2: `default`, `results`, `no-results`, `placeholder`, `class`, `children`, `escaping` are canonical-equal in all four hosts with the masks above.
2. Tier 5: [05-commerce.md](05-commerce.md) test C-14 (one request 200 ms after typing; panel shown; status announced; arrow keys; Escape; URL unchanged).
3. Tier 5: the request URL contains `type=product` and `q=shirt`.
4. Tier 5: clearing the input hides the panel and sends no request.
5. Tier 3: upgrade produces no mutation outside the allow-list; the panel stays `hidden`.
6. Tier 6: with scripting disabled the panel is not displayed and Enter navigates to `/search?type=product&q=shirt`.

### Evidence and UNVERIFIED

- Evidence: D-048; [05-commerce.md](05-commerce.md) section 7.4; `ripple/docs/research/hydrogen-core.md` (predictive search store not usable on Liquid).
- UNVERIFIED: `useRegionHtml` on the `react` host (SPIKE-10; D-090 item 4); Storefront API `predictiveSearch` arguments and result fields (section 0.6); Liquid `search.results` item member `object_type` and that `type=product` restricts `search.results` to products; that `search.results` without `{% paginate %}` returns at least `limit` items.

### Fallback (SPIKE-10)

Applies only to the `react` host and only when SPIKE-10 fails (`useRegionHtml` cannot publish fetched region HTML into the React tree; D-090 item 4). Nothing changes in the other hosts.

1. `PredictiveSearchResults` does not call `useRegionHtml`; it always renders its `results` prop (the second `return` of the code above).
2. The React app handles `rp:refresh` on `document`: when `event.detail.reason === "predictive"` it calls `event.preventDefault()`, fetches its own results route with `event.detail.url`, and stores the result in state that it passes as the `results` prop of `PredictiveSearch` ([05-commerce.md](05-commerce.md) section 8.2 step 2). The recipe is printed in the `ripple-commerce` skill.
3. The element then opens the panel on the next render in which the region has children (behaviour item 2 is unchanged).

---
