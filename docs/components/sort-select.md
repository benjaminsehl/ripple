# SortSelect

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `sort-select` |
| Kind | `commerce` |
| Category | `discovery` |
| Custom elements | `rp-live` |
| Root element and class | `rp-live` `.rp-sort-select` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes (printed on the select) |
| Depends on | `label`, `select`, `button` |
| Milestone | M3 |

### Purpose

A select that changes the sort order of a collection or search page. It is its own GET form that carries the active filters as hidden inputs, so that it works alone and without JavaScript.

- Use when: in the toolbar above results, inside region `rp-collection-toolbar`.
- Do not use when: a generic select should refresh a region (use LiveForm with a Select).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `SortSelect` | `blocks/sort-select.liquid` + `snippets/rp-sort-select.liquid` | `rp-live` | `rp-sort-select` | `data-slot="rp-live"`, `data-rp-refresh` | yes | none |
| form | printed by root | same | `form` | `rp-sort-select-form` | none | yes | none |
| label | printed by root | same | `label` | `rp-label` | none | yes | none |
| select | printed by root | same | `select` | `rp-select` | none | yes | `<id>` |
| submit | printed by root | same | `button` | `rp-button` | `data-rp-js="fallback"` | yes | none |

Nesting rules: root contains only the form. Form children in order: the carried hidden inputs (one per active filter parameter, then `q` on a search page), label, select, submit. The root MUST NOT be inside another `<form>` (in particular not inside the Filters form). For in-place refresh the root MUST be inside region `rp-collection-toolbar`, so that the hidden inputs are re-rendered after a filter change.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on the select; `for` on the label |
| `options` | none | object | `RippleSortOption[]` | none | yes (TSX) | no | one `<option>` each |
| `value` | none | string | one of the option values | the first option's value | no | no | `selected` on that option |
| `action` | none | url | the page path without query | none | yes (TSX) | no | `action` on the form |
| `params` | none | object | `Array<[name: string, value: string]>`: the active filter parameters and `q` | empty | no | no | hidden inputs, in the given order |
| none | `collection` | object | Liquid `collection` drop | the global `collection` | no | no | options, value, action, params |
| none | `search` | object | Liquid `search` drop | none | no | no | replaces `collection` as the source |
| `refresh` | `refresh` | string | region names | `rp-collection-results rp-collection-filters rp-collection-toolbar` | no | no | `data-rp-refresh` (CV-3) |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` on the select and the submit button |

`rp-collection-filters` is in the default refresh list because the Filters form carries the sort as a hidden input inside that region.

`sortParams(searchParams: URLSearchParams): Array<[string, string]>`, exported from `sort-select.data.ts` (CV-10), returns every pair whose name starts with `filter.` plus the pair `q` when present, in URL order. hydrogen sort values are those produced by `getSortByValue(sortKey, reverse)` of `@shopify/hydrogen` (`hydrogen/packages/hydrogen/src/core/collection/url.ts`): `manual`, `best-selling`, `title-ascending`, `title-descending`, `price-ascending`, `price-descending`, `created-ascending`, `created-descending`, and on search `relevance`. The app supplies the option list (the Storefront API returns none).

### Content model

`text` - the label text. Default `Sort by`.

### HTML contract

Fixture `default` (`id`: `sort`, resource `filters.basic`):

```html
<rp-live class="rp-sort-select" data-slot="rp-live" data-rp-refresh="rp-collection-results rp-collection-filters rp-collection-toolbar">
  <form class="rp-sort-select-form" method="get" action="/collections/summer">
    <input type="hidden" name="filter.v.availability" value="1">
    <input type="hidden" name="filter.v.price.lte" value="50">
    <label class="rp-label" for="sort">Sort by</label>
    <select class="rp-select" data-size="md" id="sort" name="sort_by">
      <option value="manual" selected>Featured</option>
      <option value="price-ascending">Price, low to high</option>
    </select>
    <button class="rp-button" type="submit" data-variant="outline" data-size="md" data-rp-js="fallback">Sort</button>
  </form>
</rp-live>
```

Fixture `search` (`action`: `/search`, `value`: `price-ascending`, `params`: `[["q", "shirt"]]`, `refresh`: `rp-search-results rp-collection-filters rp-collection-toolbar`): the root's `data-rp-refresh` is the given value; the form `action` is `/search`; the only hidden input is `<input type="hidden" name="q" value="shirt">`; `selected` is on the second option.

Further required fixtures: `children` (children `Order`; label text `Order`); `sm` (`size`: `sm`); `class` (root class `rp-sort-select custom-a custom-b`); `invalid-enum-falls-back` (`size`: `huge`; equals `default`); `escaping` (an option label `Say "hi" & <go>`).

Host-owned regions and masks: none. In Remix the root carries `data-rmx-key="<id>"`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-rp-refresh` | root | server | always | the `refresh` value |
| `data-pending` | root | `rp-live` | a refresh it started is running | absent |
| `aria-busy` | root | `rp-live` | same (`"true"`) | absent |
| `selected` | option | server | the option is the current sort | on one option |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-live", "attrs": ["data-pending", "aria-busy"], "reason": "A refresh can be in flight when the element upgrades after a back or forward navigation." }`.

### Behaviour with JavaScript

1. A `change` of the select calls `form.requestSubmit()`; `rp-live` intercepts, pushes the URL (`reason: "filter"`) and refreshes the regions.
2. The toolbar region, which contains this root, is replaced. The select has an `id`, so the adapter restores focus to the new select.
3. The page cursor parameters are not carried: a sort change returns to the first page.
4. The submit button is hidden when the document is ready (`data-rp-js="fallback"`).

### Behaviour without JavaScript

The buyer picks an option and presses `Sort`; the form navigates to the URL with `sort_by` and the carried filters.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: labelled native select; `checkPattern`: none.
- Accessible name: the label; required.
- Focus: restored to the select after the refresh.
- Announcements: None.

| Key | Action |
|---|---|
| ArrowUp, ArrowDown, typing | native select behaviour; the change applies the sort |

### Styling

- File: `components/sort-select/sort-select.css` (layer `rp.components`).
- Tokens used: `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-sort-select-gap` | `calc(var(--spacing) * 2)` | space between label, select and button |

| Modifier selector | Sets |
|---|---|
| None | |

Required rules: root `display: inline-block`; form `display: inline-flex; align-items: center; gap: var(--rp-sort-select-gap)`.

### Host notes

- HTML: copy the contract.
- React: `SortSelect(props: { id: string; options: RippleSortOption[]; value?: string; action: string; params?: Array<[string, string]>; refresh?: string; size?: "sm" | "md" | "lg"; strings?: { submit?: string }; className?: string; children?: ReactNode })`. `sortParams` is in `sort-select.data.ts` (CV-10). The fallback submit button is printed by the binding itself (section 0.2). No hook. Uncontrolled select: `defaultValue={value}` with `key={value}`.
- Remix: `data-rmx-key="<id>"` on root.
- Liquid: options `source.sort_options` (`option.value`, `option.name`); current value `source.sort_by | default: source.default_sort_by`; action `collection.url` or `routes.search_url`; hidden inputs: for each `filter` in `source.filters`, each `value` in `filter.active_values` gives `value.param_name` / `value.value`; a `price_range` filter gives `filter.min_value.param_name` and `filter.max_value.param_name` with the number text of PriceRange when set; on search also `q` = `search.terms`. Schema settings: `size`. Locale keys: `ripple.sort-select.label` = `Sort by`; `ripple.sort-select.submit` = `Sort`.

```tsx
<SortSelect id="sort" action={url.pathname} options={SORT_OPTIONS} value={url.searchParams.get("sort_by") ?? "manual"} params={sortParams(url.searchParams)} />
```

```liquid
{% block 'sort-select', id: 'sort' %}{% endblock %}
```

### Commerce

- Store fields read: none.
- Adapter methods called: `refresh`, `usable` (through `rp-live`).
- Regions refreshed: the names in `data-rp-refresh`; `reason: "filter"`; history push.
- Pending and error behaviour: root flags; a failed refresh ends in `location.assign(url)` (D-090).

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Sort parameter | `sort_by`, parsed by `parseCollectionParams` | `sort_by`, parsed by Shopify |
| Option list | supplied by the app | `collection.sort_options` / `search.sort_options` |

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP101 (`size`), RP104 (`id`, `options`, `action`), RP114, RP301, RP308 (a `data-rp-refresh` name with no region on the page; this root MAY be inside the region it refreshes, D-102), RP403 (Liquid). Manifest `rules[]`: `sort-select-fallback-submit` (`requires-descendant`, selector `form[method="get"]`, target `button[type="submit"][data-rp-js="fallback"]`); `sort-select-name` (`requires-descendant`, selector `:scope`, target `select[name="sort_by"]`); `sort-select-not-in-form` (`forbids-ancestor`, selector `:scope`, target `form`; "A SortSelect is inside another form; nested forms are invalid HTML.").

### Acceptance tests

1. Tier 2: `default`, `search`, `children`, `sm`, `class`, `invalid-enum-falls-back`, `escaping` are canonical-equal in all four hosts.
2. Tier 5: [05-commerce.md](05-commerce.md) test C-13 (sort `change` pushes one history entry and replaces `rp-collection-results`). Additionally the pushed URL keeps `filter.v.availability=1` and `filter.v.price.lte=50`.
3. Tier 5: after the refresh `document.activeElement` is the select with id `sort`.
4. Tier 6: with scripting disabled, choosing `Price, low to high` and pressing `Sort` navigates to a URL containing `sort_by=price-ascending` and both filter parameters.

### Evidence and UNVERIFIED

- Evidence: D-047; `hydrogen/packages/hydrogen/src/core/collection/url.ts` (`getSortByValue`, `SORT_KEY_TO_SORT_BY`, `-ascending` / `-descending` suffixes); `hydrogen/packages/hydrogen/skills/hydrogen-collection-browser/SKILL.md` (keep `q` in the sort form); `ripple/theme/assets/s-live-form.js`.
- UNVERIFIED: Liquid `sort_option` members `value` and `name` (general knowledge; not re-checked in the docs tool).

### Fallback (SPIKE-nn)

None.

---
