# Filters

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `filters` |
| Kind | `commerce` |
| Category | `discovery` |
| Custom elements | `rp-live` |
| Root element and class | `rp-live` `.rp-filters` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes (printed on the form) |
| Depends on | `filter-group`, `price-range`, `button` |
| Milestone | M3 |

### Purpose

The filter form of a collection or search page: one GET form whose controls are the storefront filters. The URL is the state (D-047). It owns the region `rp-collection-filters`.

- Use when: a collection or search page offers filtering. Place it in a sidebar, or inside a Drawer on small screens (placement is the blueprint's job, [12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md)).
- Do not use when: a single GET control refreshes a region (use LiveForm), or for sorting (SortSelect).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Filters` | `blocks/filters.liquid` + `snippets/rp-filters.liquid` | `rp-live` | `rp-filters` | `data-slot="rp-live"`, `data-rp-refresh` | yes | none |
| form | printed by root | same | `form` | `rp-filters-form` | none | yes | `<id>` |
| groups (region part) | `FiltersGroups` | `snippets/rp-filters-groups.liquid` | `div` | `rp-filters-groups` | `data-rp-region="rp-collection-filters"` | yes | none |
| submit | printed by root | same | `button` | `rp-button rp-filters-submit` | `data-rp-js="fallback"` | yes | none |

Nesting rules: root contains only the form. Form children in order: groups, submit. Groups children in order: the carried hidden inputs (`sort_by` when the current sort is not the default; `q` on a search page), then one FilterGroup per filter. A filter with no values (and not a price range) is skipped. The carried hidden inputs are INSIDE the region so that a sort change (which refreshes `rp-collection-filters`) updates them. Children (`{{ content }}`) replace the default rendering of the groups part (RS-2). A Filters root MUST NOT be inside another `<form>`. When Filters is placed in a Drawer, the Drawer's `<dialog>` MUST be outside every region and the whole Filters root is inside the dialog body.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on the form |
| `filters` | none | object | `RippleFilter[]` (below) | none | yes (TSX) | no | one FilterGroup each |
| `action` | none | url | the page path without query (`/collections/summer`, `/search`) | none | yes (TSX) | no | `action` on the form |
| `sortBy` | none | string | the current `sort_by` value, or empty for the default sort | empty | no | no | hidden input `sort_by` |
| `query` | none | string | the search terms, on a search page | empty | no | no | hidden input `q` |
| none | `collection` | object | Liquid `collection` drop | the global `collection` | no | no | filters, action, sort |
| none | `search` | object | Liquid `search` drop | none | no | no | when given it replaces `collection` as the source; adds `q` |
| `refresh` | `refresh` | string | region names | `rp-collection-results rp-collection-filters rp-collection-toolbar` | no | no | `data-rp-refresh` on root (CV-3) |
| `open` | `open` | boolean | `true false` | `true` | no | no | passed to every FilterGroup |

The region part takes `filters`, `sortBy`, `query`, `open` (Liquid: the snippet `rp-filters-groups` takes exactly `collection`, `search`, `open`; every call passes all three, D-091 item 4). A search page MUST pass `refresh` = `rp-search-results rp-collection-filters rp-collection-toolbar`.

`RippleFilter` and `RippleFilterValue` are defined in [05-commerce.md](05-commerce.md) section 11.1 and imported as `import type { RippleFilter, RippleFilterValue } from "<pkg>"` (D-094). This component declares no type. Fields read:

| Type | Field | TS type | Meaning |
|---|---|---|---|
| `RippleFilter` | `label` | `string` | group label |
| `RippleFilter` | `type` | `"list" \| "price_range"` | which body the FilterGroup prints |
| `RippleFilter` | `values` | `RippleFilterValue[]` | empty for `price_range` |
| `RippleFilter` | `price` | `{ minName: string; maxName: string; min: string; max: string; rangeMax: string } \| null` | `null` for `list`; `""` means not set |
| `RippleFilter` | `removeUrl` | `string` | URL that removes every value of this filter |
| `RippleFilterValue` | `label` | `string` | value label |
| `RippleFilterValue` | `name` | `string` | URL parameter name, for example `filter.v.availability` |
| `RippleFilterValue` | `value` | `string` | URL parameter value, for example `1` |
| `RippleFilterValue` | `count` | `number` | number of results |
| `RippleFilterValue` | `active` | `boolean` | the value is applied |
| `RippleFilterValue` | `swatch` | `{ color: string \| null; image: RippleImage \| null } \| null` | swatch data |

`toRippleFilters(filters: Filter[], searchParams: URLSearchParams, pathname: string): RippleFilter[]`, exported from `filters.data.ts` (CV-10; imported by the binding as `./filters.data` and by blueprints as `@components/filters.data`), builds them from the Storefront API `filters` field (fragment `RippleFilter`, section 0.6). It is a pure function and uses these `@shopify/hydrogen` exports (`hydrogen/packages/hydrogen/src/core/collection/url.ts`; value imports allowed by D-094, CV-9): `parseCollectionParams`, `serializeCollectionParams`, `isFilterInputActive`, `getFilterRemovalUrl`. Algorithm, per Storefront filter `f`:

1. `const active = parseCollectionParams(searchParams).filters`.
2. If `f.type === "PRICE_RANGE"`: `type: "price_range"`, `values: []`, `price: { minName: "filter.v.price.gte", maxName: "filter.v.price.lte", min: searchParams.get("filter.v.price.gte") ?? "", max: searchParams.get("filter.v.price.lte") ?? "", rangeMax: "" }`. `removeUrl` is `pathname` plus the current params without the two price params and without `before` and `after`.
3. Otherwise `type: "list"`, and per value `v`: `const [name, value] = [...serializeCollectionParams({ filters: [JSON.parse(v.input)], sortKey: undefined, reverse: false })][0]`; `active: isFilterInputActive(active, v.input)`; `count: v.count`; `label: v.label`; `swatch` from `v.swatch` (`color`, and `image.previewImage` mapped to `RippleImage`) or `null`. A value whose `input` does not parse or yields no parameter is skipped. `removeUrl` is `pathname` plus the current params without every `(name, value)` pair of this filter's values and without `before` and `after`.

### Content model

`parts` - children replace the default rendering of the groups part (RS-2).

### HTML contract

Fixture `default` (`id`: `filters`, resource `filters.basic`):

```html
<rp-live class="rp-filters" data-slot="rp-live" data-rp-refresh="rp-collection-results rp-collection-filters rp-collection-toolbar">
  <form class="rp-filters-form" id="filters" method="get" action="/collections/summer">
    <div class="rp-filters-groups" data-rp-region="rp-collection-filters">
      <!-- FilterGroup fixture `default` (filter Availability) -->
      <!-- FilterGroup fixture `price` (filter Price) -->
    </div>
    <button class="rp-button rp-filters-submit" type="submit" data-variant="outline" data-size="md" data-rp-js="fallback">Apply filters</button>
  </form>
</rp-live>
```

The comments stand for the complete reference HTML of the named FilterGroup fixtures.

Fixture `search-sorted` (as `default` with `action`: `/search`, `sortBy`: `price-ascending`, `query`: `shirt`, `refresh`: `rp-search-results rp-collection-filters rp-collection-toolbar`): the root's `data-rp-refresh` is the given value, the form `action` is `/search`, and the groups part starts with:

```html
      <input type="hidden" name="sort_by" value="price-ascending">
      <input type="hidden" name="q" value="shirt">
```

Fixture `empty` (`filters`: empty list):

```html
<rp-live class="rp-filters" data-slot="rp-live" data-rp-refresh="rp-collection-results rp-collection-filters rp-collection-toolbar">
  <form class="rp-filters-form" id="filters" method="get" action="/collections/summer">
    <div class="rp-filters-groups" data-rp-region="rp-collection-filters"></div>
    <button class="rp-button rp-filters-submit" type="submit" data-variant="outline" data-size="md" data-rp-js="fallback">Apply filters</button>
  </form>
</rp-live>
```

Further required fixtures: `closed` (`open`: false; no `open` attribute on any `details`); `class` (root class `rp-filters custom-a custom-b`); `children` (children `<div data-rp-region="rp-collection-filters"></div>` printed in place of the groups part); `escaping` (`query`: `Say "hi" & <go>`; the hidden input value is `Say &quot;hi&quot; &amp; &lt;go&gt;`).

Host-owned regions and masks: none. In Remix the root carries `data-rmx-key="<id>"`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-rp-refresh` | root | server | always | the `refresh` value |
| `data-pending` | root | `rp-live` | a refresh it started is running | absent |
| `aria-busy` | root | `rp-live` | same (`"true"`) | absent |
| `aria-busy` | groups | commerce adapter | region `rp-collection-filters` is refreshing | absent |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-live", "attrs": ["data-pending", "aria-busy"], "reason": "A refresh can be in flight when the element upgrades after a back or forward navigation." }`, `{ "select": "[data-rp-region]", "attrs": ["aria-busy"], "childList": true, "text": true, "subtree": true, "reason": "A refresh that completes during upgrade replaces the region content." }`.

### Behaviour with JavaScript

1. A `change` on any checkbox or price input calls `form.requestSubmit()`; `rp-live` intercepts the submit, builds the URL from the form's successful controls (empty values omitted), pushes it with `history.pushState`, and refreshes the regions in `data-rp-refresh` ([05-commerce.md](05-commerce.md) section 7.3).
2. Price inputs fire `change` on blur or Enter; there is no per-keystroke refresh.
3. The groups part is replaced by the refresh; the adapter restores focus to the control with the same position when focus was lost (step 9 of [05-commerce.md](05-commerce.md) section 8.2). Because checkboxes have no `id`, restoration falls to the first focusable element of the region; to keep focus on the changed control a project MAY give controls ids in a custom groups part.
4. The submit button is hidden when the document is ready (`data-rp-js="fallback"`).
5. The page parameter is not carried: a filter change returns to the first page.
6. React host (D-090): for reason `filter` the adapter calls the app's `navigate(url, { replace: false })` when `navigate` is configured, and the router re-renders the page; otherwise it calls `location.assign(url)`.

### Behaviour without JavaScript

The buyer checks boxes, types prices and presses `Apply filters`; the form navigates to the filtered URL with a full page load. Every filter works.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

`rp:refresh` and `rp:refreshed` are dispatched on `document` by the adapter with `reason: "filter"`.

### Accessibility

- Pattern: form with grouped checkboxes; `checkPattern`: none.
- Accessible name: none on root or form (an unnamed form is not a landmark); the blueprint gives the section a heading. Each control is named by its wrapping label (FilterGroup, PriceRange).
- Focus: nothing moves focus on change; see behaviour 3.
- Announcements: none from this component. The results region SHOULD contain a `role="status"` product count ([05-commerce.md](05-commerce.md) section 9.1), owned by the blueprint.

| Key | Action |
|---|---|
| Space on a checkbox | toggles it and refreshes |
| Enter in a price input | refreshes |

### Styling

- File: `components/filters/filters.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-border`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-filters-gap` | `calc(var(--spacing) * 4)` | space between groups, and before the submit button |
| `--rp-filters-busy-opacity` | `0.6` | opacity of the groups while refreshing |

| Modifier selector | Sets |
|---|---|
| `.rp-filters-groups[aria-busy="true"]` | `--rp-filters-opacity: var(--rp-filters-busy-opacity)` |

Required rules: root `display: block`; form and groups `display: flex; flex-direction: column; gap: var(--rp-filters-gap)`; groups `opacity: var(--rp-filters-opacity, 1)`.

### Host notes

- HTML: copy the contract; write names and values from the URL scheme `filter.v.*` / `filter.p.*`.
- React: `Filters(props: { id: string; filters: RippleFilter[]; action: string; sortBy?: string; query?: string; refresh?: string; open?: boolean; strings?: { apply?: string }; className?: string; children?: ReactNode })`, `FiltersGroups(props: { filters: RippleFilter[]; sortBy?: string; query?: string; open?: boolean })`. `toRippleFilters` is in `filters.data.ts` (CV-10) and the two types come from `<pkg>` (D-094). No hook, no directive. The submit button composes Button by contract (D-070; class pair `rp-button rp-filters-submit`, section 0.2): the binding prints the `<button>` itself. Checkboxes are uncontrolled (`defaultChecked`); the loader's data is the truth after each navigation, so each FilterGroup uses `key={filter.label}` and each input `key={name + "=" + value + ":" + active}` to reset on navigation.
- Remix: `data-rmx-key="<id>"` on root; the form carries no `data-rmx-*` attribute (the element intercepts it).
- Liquid: source `search.filters` when `search` is given, else `collection.filters`. Action: `routes.search_url` or `collection.url`. `sort_by` hidden input when `source.sort_by != blank and source.sort_by != source.default_sort_by`. `q` hidden input `search.terms` on search. No schema settings. Locale key: `ripple.filters.apply` = `Apply filters`. The submit button is printed by the snippet itself (compose by contract, D-070). The root prints `{{ attributes }}` last (D-035).

```tsx
<Filters id="filters" filters={toRippleFilters(collection.products.filters, url.searchParams, url.pathname)} action={url.pathname} sortBy={url.searchParams.get("sort_by") ?? ""} />
```

```liquid
{% block 'filters', id: 'filters' %}
  {% partial 'rp-collection-filters' %}{% render 'rp-filters-groups', collection: collection, search: search, open: true %}{% endpartial %}
{% endblock %}
```

### Commerce

- Store fields read: none.
- Adapter methods called: `refresh`, `usable` (through `rp-live`).
- Regions refreshed: the names in `data-rp-refresh`; `reason: "filter"`; history push.
- Pending and error behaviour: root `data-pending` / `aria-busy`; a failed refresh navigates to the URL (`location.assign`).

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Filter parameters | `filter.v.*` / `filter.p.*` built with `serializeCollectionParams`; parsed by `parseCollectionParams` in the loader | `filter_value.param_name` / `filter_value.value`; parsed by Shopify |
| Price parameters | `filter.v.price.gte`, `filter.v.price.lte` (major units) | `filter.min_value.param_name`, `filter.max_value.param_name` (major units) |
| Sort | `sort_by` | `sort_by` |
| Search terms | `q` | `q` |

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP104 (`id`, `filters`, `action`), RP114, RP301 (the submit button is in a form), RP308 (a `data-rp-refresh` name with no region on the page; this root MAY be inside the region it refreshes, D-102), RP403 (Liquid: partials for every name in `refresh`). Manifest `rules[]`: `filters-get-form` (`requires-descendant`, selector `:scope`, target `form[method="get"]`); `filters-fallback-submit` (`requires-descendant`, selector `form`, target `button[type="submit"][data-rp-js="fallback"]`; "The filter form has no submit button for use without JavaScript."); `filters-region` (`requires-descendant`, selector `form`, target `[data-rp-region="rp-collection-filters"]`); `filters-not-in-form` (`forbids-ancestor`, selector `:scope`, target `form`).

### Acceptance tests

1. Tier 2: `default`, `search-sorted`, `empty`, `closed`, `class`, `children`, `escaping` are canonical-equal in all four hosts.
2. Tier 5 (unit test): `toRippleFilters` with the `filters.basic` Storefront data and `?filter.v.availability=1&filter.v.price.lte=50` returns names, values, `active` flags and price fields equal to the resource table of section 0.5.
3. Tier 5: checking `Out of stock` produces exactly one `rp:refresh` with `reason: "filter"`, one new history entry whose URL contains `filter.v.availability=0`, and no `page`, `before` or `after` parameter ([05-commerce.md](05-commerce.md) test C-13 covers the sort variant).
4. Tier 5: a price input with an empty value contributes no parameter to the URL.
5. Tier 6: with scripting disabled the submit button is displayed and submitting navigates to the same URL as AT-3.
6. Tier 5: Back after a filter change reloads the previous URL.

### Evidence and UNVERIFIED

- Evidence: D-047; [05-commerce.md](05-commerce.md) section 7.3; `hydrogen/packages/hydrogen/src/core/collection/url.ts` (`parseCollectionParams`, `serializeCollectionParams`, `isFilterInputActive`, `getFilterRemovalUrl`); `hydrogen/packages/hydrogen/skills/hydrogen-collection-browser/SKILL.md`; `ripple/theme/snippets/filters.liquid`, `ripple/theme/snippets/filter-group.liquid`; Liquid `filter` and `filter_value` drops (Shopify docs tool, this session).
- UNVERIFIED: the Storefront API `Filter.type` enum value `PRICE_RANGE` and the `values.swatch` selection of section 0.6; that the Storefront API reports no maximum price for the range (hence `rangeMax: ""` on hydrogen).

### Fallback (SPIKE-nn)

None.

---
