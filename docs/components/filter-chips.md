# FilterChips

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `filter-chips` |
| Kind | `commerce` |
| Category | `discovery` |
| Custom elements | `rp-live` |
| Root element and class | `rp-live` `.rp-filter-chips` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `icon`, `visually-hidden` |
| Milestone | M3 |

### Purpose

The list of active filters as removable chips, with a "Clear all" link. Each chip is a link to the URL without that filter.

- Use when: above the results of a filtered collection or search page, inside region `rp-collection-toolbar`.
- Do not use when: showing tags or statuses (use Badge).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `FilterChips` | `blocks/filter-chips.liquid` + `snippets/rp-filter-chips.liquid` | `rp-live` | `rp-filter-chips` | `data-slot="rp-live"`, `data-rp-refresh` | yes | none |
| list | printed by root | same | `ul` | `rp-filter-chips-list` | `role="list"` (fixed attribute) | when a filter is active | none |
| chip | printed by root | same | `a` | `rp-filter-chips-chip` | none | one per active value | none |
| chip label | printed by root | same | `span` | `rp-filter-chips-label` | none | one per chip | none |
| clear | printed by root | same | `a` | `rp-filter-chips-clear` | none | when a filter is active | none |

Nesting rules: when no filter is active the root is printed with NO children. Otherwise root children in order: list, clear. Each `li` of the list contains one chip. Chip children in order: a VisuallyHidden span with the text `Remove filter: `, the chip label, one Icon `close`. For in-place refresh the root MUST be inside the region `rp-collection-toolbar` (declared by the blueprint), so that the chips are re-rendered after a change.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `chips` | none | object | `RippleFilterChip[]` | none | yes (TSX) | no | one chip each |
| `clearUrl` | none | url | URL without any filter parameter | none | yes (TSX) | no | `href` of clear |
| none | `collection` | object | Liquid `collection` drop | the global `collection` | no | no | chips and clear URL |
| none | `search` | object | Liquid `search` drop | none | no | no | replaces `collection` as the source |
| `refresh` | `refresh` | string | region names | `rp-collection-results rp-collection-filters rp-collection-toolbar` | no | no | `data-rp-refresh` (CV-3) |

`toFilterChips(filters: RippleFilter[], options: { pathname: string; searchParams: URLSearchParams; formatPrice: (amount: string) => string }): { chips: RippleFilterChip[]; clearUrl: string }` is exported from `filter-chips.data.ts` (CV-10). `RippleFilterChip` (`{ label: string; url: string }`) is defined in [05-commerce.md](05-commerce.md) section 11.1 and imported from `<pkg>` (D-094). Per active list value: `label` = the value label, `url` = `pathname` + `getFilterRemovalUrl(searchParams, JSON.parse(<the value's input>))`; because `RippleFilterValue` does not keep `input`, the helper rebuilds the URL by deleting the pair `(name, value)` and the `before` / `after` params from a copy of `searchParams`. For an active price range: one chip with the label of the rule below and `url` = `filter.removeUrl`. `clearUrl` = `pathname` plus only the `sort_by` and `q` params.

Price chip label rule (both backends): both bounds set: `<min> - <max>`; only max: `Up to <max>`; only min: `From <min>`; where `<min>` and `<max>` are money text (TSX: `formatPrice`; Liquid: `filter.min_value.value | money`, `filter.max_value.value | money`).

### Content model

`none`.

### HTML contract

Fixture `default` (resource `filters.basic`):

```html
<rp-live class="rp-filter-chips" data-slot="rp-live" data-rp-refresh="rp-collection-results rp-collection-filters rp-collection-toolbar">
  <ul class="rp-filter-chips-list" role="list">
    <li><a class="rp-filter-chips-chip" href="/collections/summer?filter.v.price.lte=50"><span class="rp-visually-hidden">Remove filter: </span><span class="rp-filter-chips-label">In stock</span><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></a></li>
    <li><a class="rp-filter-chips-chip" href="/collections/summer?filter.v.availability=1"><span class="rp-visually-hidden">Remove filter: </span><span class="rp-filter-chips-label">Up to $50.00</span><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></a></li>
  </ul>
  <a class="rp-filter-chips-clear" href="/collections/summer">Clear all</a>
</rp-live>
```

Fixture `empty` (no active filter):

```html
<rp-live class="rp-filter-chips" data-slot="rp-live" data-rp-refresh="rp-collection-results rp-collection-filters rp-collection-toolbar"></rp-live>
```

Further required fixtures: `refresh` (`refresh`: `rp-search-results rp-collection-filters rp-collection-toolbar`); `class` (root class `rp-filter-chips custom-a custom-b`); `escaping` (a chip label `Say "hi" & <go>`).

Host-owned regions and masks: none host-owned. Masks: `{ "select": ".rp-filter-chips-chip", "op": "attr", "name": "href" }` and `{ "select": ".rp-filter-chips-clear", "op": "attr", "name": "href" }` (parameter order and encoding differ by backend); `{ "select": "li:nth-child(2) .rp-filter-chips-label", "op": "text" }` in `default` (money text).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-rp-refresh` | root | server | always | the `refresh` value |
| `data-pending` | root | `rp-live` | a refresh it started is running | absent |
| `aria-busy` | root | `rp-live` | same (`"true"`) | absent |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-live", "attrs": ["data-pending", "aria-busy"], "reason": "A refresh can be in flight when the element upgrades after a back or forward navigation." }`.

### Behaviour with JavaScript

1. A plain primary click on a chip or on clear is intercepted by `rp-live`: the link's URL is pushed to history and the regions in `data-rp-refresh` are refreshed.
2. The toolbar region, which contains this root, is replaced by the refresh. The clicked chip no longer exists; the adapter moves focus to the first focusable element of the region ([05-commerce.md](05-commerce.md) section 8.2 step 9).
3. Modified clicks navigate natively.

### Behaviour without JavaScript

Chips and the clear link are ordinary links; they navigate to the URL without the filter.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: list of links; `checkPattern`: none.
- Accessible name: each chip: `Remove filter: <label>`; required. Clear: its text.
- Focus: each chip and the clear link are tab stops; see behaviour 2.
- Announcements: None.

| Key | Action |
|---|---|
| Enter on a chip | removes that filter |

### Styling

- File: `components/filter-chips/filter-chips.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-border`, `--color-muted`, `--color-foreground`, `--color-ring`, `--radius-full`, `--text-sm`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-filter-chips-gap` | `calc(var(--spacing) * 2)` | space between chips |
| `--rp-filter-chips-bg` | `var(--color-muted)` | chip background |
| `--rp-filter-chips-radius` | `var(--radius-full)` | chip radius |

| Modifier selector | Sets |
|---|---|
| `.rp-filter-chips[data-pending]` | nothing; reserved for project CSS |

Required rules: root `display: flex; flex-wrap: wrap; align-items: center; gap: var(--rp-filter-chips-gap)`; the root MUST NOT get `display: none` when it is empty (D-080 forbids `display: none` on a custom element root): an empty root is a flex box with no content and zero block size; list `display: contents; list-style: none`; list items `display: contents`; chip `display: inline-flex; align-items: center; gap: calc(var(--spacing) * 1); min-block-size: calc(var(--spacing) * 8); padding-inline: calc(var(--spacing) * 3); border-radius: var(--rp-filter-chips-radius); background: var(--rp-filter-chips-bg); text-decoration: none`. Because `list-style: none` removes list semantics in WebKit, the `ul` carries the fixed attribute `role="list"`.

### Host notes

- HTML: copy the contract; compute each URL by removing the parameter.
- React: `FilterChips(props: { chips: RippleFilterChip[]; clearUrl: string; refresh?: string; strings?: { remove?: string; clear?: string }; className?: string })` plus `toFilterChips`. No hook. `key={chip.url}`.
- Remix: prop `rmxKey?: string` prints `data-rmx-key` on root (omitted when unset; CV-5, D-034); links carry no `data-rmx-*` attribute.
- Liquid: source `search.filters` or `collection.filters`. For each `filter`: for each `value` in `filter.active_values`: chip with `value.label` and `value.url_to_remove`; for `price_range` with a set bound: one chip with `filter.url_to_remove`. Clear URL: collection: `collection.url`, plus `?sort_by=<value>` when the sort is not the default; search: `routes.search_url` + `?q=` + `search.terms | url_encode`, plus `&sort_by=<value>` when not the default. No schema settings. Locale keys: `ripple.filter-chips.remove` = `Remove filter: `; `ripple.filter-chips.clear` = `Clear all`; `ripple.filter-chips.up_to` = `Up to {{ max }}`; `ripple.filter-chips.from` = `From {{ min }}`.

```tsx
<FilterChips {...toFilterChips(filters, { pathname: url.pathname, searchParams: url.searchParams, formatPrice })} />
```

```liquid
{% block 'filter-chips' %}{% endblock %}
```

### Commerce

- Store fields read: none.
- Adapter methods called: `refresh`, `usable` (through `rp-live`).
- Regions refreshed: the names in `data-rp-refresh`; `reason: "filter"`; history push.
- Pending and error behaviour: root flags; a failed refresh ends in `location.assign(url)` (D-090).

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Remove URL | current params minus the filter (`getFilterRemovalUrl` semantics), cursors dropped | `filter_value.url_to_remove`, `filter.url_to_remove` |

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP104 (`chips`, `clearUrl`), RP308 (a `data-rp-refresh` name with no region on the page; this root MAY be inside the region it refreshes, D-102), RP403 (Liquid). Manifest `rules[]`: `filter-chips-links` (`forbids-descendant`, selector `:scope`, target `.rp-filter-chips-chip:not(a[href])`; "A filter chip is not a link; it cannot work without JavaScript.").

### Acceptance tests

1. Tier 2: `default`, `empty`, `refresh`, `class`, `escaping` are canonical-equal in all four hosts with the masks above.
2. Tier 5 (unit test): `toFilterChips` for `filters.basic` returns two chips; the first URL has no `filter.v.availability` parameter and keeps `filter.v.price.lte=50`; `clearUrl` is `/collections/summer`.
3. Tier 5: a click on the first chip yields one `rp:refresh` (`reason: "filter"`), one history entry, and afterwards `document.activeElement` is inside the toolbar region.
4. Tier 6: with scripting disabled the same click navigates to the chip's `href`.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/snippets/filters.liquid` (active values with `url_to_remove`); `hydrogen/packages/hydrogen/src/core/collection/url.ts` (`getFilterRemovalUrl`: query string starting with `?`, cursors dropped); Liquid `filter.active_values`, `filter.url_to_remove`, `filter_value.url_to_remove` (Shopify docs tool, this session).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
