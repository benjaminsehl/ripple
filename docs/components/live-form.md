# LiveForm

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `live-form` |
| Kind | `commerce` |
| Category | `discovery` |
| Custom elements | `rp-live` |
| Root element and class | `rp-live` `.rp-live-form` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M3 |

### Purpose

A wrapper that turns the GET forms and links inside it into in-place refreshes of named regions (D-047). It prints only the `rp-live` root; the caller writes the form or links.

- Use when: project markup (a custom filter, a view switcher, Pagination links, a per-page select) should refresh a region instead of loading a page.
- Do not use when: a Ripple component already has an `rp-live` root (VariantPicker, Filters, FilterChips, SortSelect), or for POST forms and cart changes (use the cart components).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `LiveForm` | `blocks/live-form.liquid` | `rp-live` | `rp-live-form` | `data-slot="rp-live"`, `data-rp-refresh` | yes | none |

Nesting rules: the root MUST NOT be inside another `rp-live` root. Its content MUST work without JavaScript: only `<form method="get">` elements and `<a href>` links are enhanced. A GET form whose controls submit on change MUST contain a submit button with `data-rp-js="fallback"`. The root is a block box (`display: block` from `base.css`, D-080). When a layout needs the form's children as grid or flex items, the caller places the grid or flex container INSIDE the LiveForm, never around it.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `refresh` | `refresh` | string | region names, space-separated | none | yes | no | `data-rp-refresh` (CV-3) |

### Content model

`flow` - GET forms and links, and any markup around them.

### HTML contract

Fixture `default` (`refresh`: `rp-collection-results`; children as shown):

```html
<rp-live class="rp-live-form" data-slot="rp-live" data-rp-refresh="rp-collection-results">
  <a href="/collections/summer?page=2">Next page</a>
</rp-live>
```

Fixture `form` (`refresh`: `rp-collection-results rp-collection-toolbar`; children as shown):

```html
<rp-live class="rp-live-form" data-slot="rp-live" data-rp-refresh="rp-collection-results rp-collection-toolbar">
  <form method="get" action="/collections/summer">
    <label class="rp-label" for="per-page">Per page</label>
    <select class="rp-select" data-size="md" id="per-page" name="limit">
      <option value="24" selected>24</option>
      <option value="48">48</option>
    </select>
    <button class="rp-button" type="submit" data-variant="outline" data-size="md" data-rp-js="fallback">Apply</button>
  </form>
</rp-live>
```

Further required fixtures: `class` (root class `rp-live-form custom-a custom-b`); `escaping` (`refresh`: `a"b`; attribute `a&quot;b`).

Host-owned regions and masks: none. In Remix the root also carries `data-rmx-key="<rmxKey>"` when the prop `rmxKey` is set (CV-5); the canonicaliser removes it.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-rp-refresh` | root | server | always | the `refresh` value |
| `data-pending` | root | `rp-live` | a refresh it started is running | absent |
| `aria-busy` | root | `rp-live` | same (`"true"`) | absent |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-live", "attrs": ["data-pending", "aria-busy"], "reason": "A refresh can be in flight when the element upgrades after a back or forward navigation." }`.

### Behaviour with JavaScript

1. Submit of an owned GET form, `change` of an owned `<input>` or `<select>` in such a form, and a plain primary click on an owned same-origin `<a href>` (without `target`, without `download`, not `aria-disabled="true"`) are intercepted; the URL is computed as in [05-commerce.md](05-commerce.md) section 7.3 and the regions in `data-rp-refresh` are refreshed.
2. History: when every region name starts with `rp-product-` the URL is replaced (`reason: "variant"`); otherwise it is pushed (`reason: "filter"`).
3. When `data-rp-refresh` is empty the element navigates with `location.assign(url)`.
4. A failed refresh navigates to the URL.

### Behaviour without JavaScript

Forms and links navigate natively.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: none of its own; `checkPattern`: none.
- Accessible name: none.
- Focus: the adapter restores focus after a refresh when the focused element was inside a refreshed region and has an `id` ([05-commerce.md](05-commerce.md) section 8.2 step 9). Controls inside a LiveForm that is itself inside a refreshed region SHOULD have an `id`.
- Announcements: none. The refreshed region SHOULD contain a `role="status"` summary of the new content.

| Key | Action |
|---|---|
| None beyond the native keys of the contained controls | |

### Styling

- File: `components/live-form/live-form.css` (layer `rp.components`).
- Tokens used: none.

| Custom property | Default | Purpose |
|---|---|---|
| None | | |

| Modifier selector | Sets |
|---|---|
| None | |

Required rules: none. `live-form.css` MUST NOT set `display` on the root: every `rp-*` root is `display: block` from `base.css`, and `display: contents` is forbidden on a custom element root (D-080). The file exists with an empty `@layer rp.components` block so that the manifest file key `css` resolves.

### Host notes

- HTML: copy the contract.
- React: `LiveForm(props: { refresh: string; className?: string; children?: ReactNode })`. No hook. On `react` the adapter's strategy for reasons `variant` and `filter` is `navigate(url, { replace })` when the app configured `navigate`, otherwise `location.assign(url)` (D-090).
- Remix: prop `rmxKey?: string` prints `data-rmx-key` on root; the attribute is omitted when the prop is unset (CV-5, D-034). A page with several LiveForms that are reordered between renders MUST give each a distinct `rmxKey` ([06-bindings.md](06-bindings.md)).
- Liquid: `blocks/live-form.liquid` prints the root around `{{ content }}`. No schema settings. No locale keys. Every name in `refresh` MUST have a `{% partial %}` in the template or layout (RP403).

```tsx
<LiveForm refresh="rp-collection-results">
  <a href={nextUrl}>Next page</a>
</LiveForm>
```

```liquid
{% block 'live-form', refresh: 'rp-collection-results' %}
  <a href="{{ paginate.next.url }}">{{ 'ripple.pagination.next' | t }}</a>
{% endblock %}
```

### Commerce

- Store fields read: none.
- Adapter methods called: `refresh`, `usable` (through `rp-live`).
- Regions refreshed: the names in `data-rp-refresh`.
- Pending and error behaviour: root flags; a failed refresh ends in `location.assign(url)` (D-090).

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Region markup | `[data-rp-region="<name>"]` in the page | the same, wrapped in `{% partial '<name>' %}` |

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP104 (`refresh`), RP301 (buttons inside need a form), RP308 (a `data-rp-refresh` name with no region on the page; this root MAY be inside the region it refreshes, D-102), RP403 (Liquid). Manifest `rules[]`: `live-form-not-nested` (`forbids-ancestor`, selector `:scope`, target `rp-live`); `live-form-no-post` (`forbids-descendant`, selector `:scope`, target `form[method="post" i]`; "A LiveForm contains a POST form; rp-live only enhances GET forms and links.").

### Acceptance tests

1. Tier 2: `default`, `form`, `class`, `escaping` are canonical-equal in all four hosts.
2. Tier 5: clicking the link of `default` yields one `rp:refresh` with `regions: ["rp-collection-results"]`, `reason: "filter"` and one new history entry; Ctrl+click yields none.
3. Tier 5: changing the select of `form` yields a URL with `limit=48`.
4. Tier 5: with `refresh` `rp-product-buy` the history length does not change.
5. Tier 6: with scripting disabled the link navigates and the Apply button is displayed.

### Evidence and UNVERIFIED

- Evidence: D-047; [05-commerce.md](05-commerce.md) section 7.3; `ripple/theme/assets/s-live-form.js`; `ripple/docs/research/base-theme.md` (`rp-live-form` needed on Liquid).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
