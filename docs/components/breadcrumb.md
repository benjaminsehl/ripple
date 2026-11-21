# Breadcrumb

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `breadcrumb` |
| Kind | `static` |
| Category | `navigation` |
| Custom elements | none |
| Root element and class | `nav` `.rp-breadcrumb` |
| Liquid tier | `parts` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `icon` |
| Milestone | M1 |

### Purpose

The trail of links from the home page to the current page.

- Use when: a page sits in a hierarchy the shopper can climb (collection, product reached from a collection, article in a blog).
- Do not use when: listing sibling pages (use LinkList, `12-components-chrome-and-blueprints.md`) or paging through results (use Pagination).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Breadcrumb` | `blocks/breadcrumb.liquid` | `nav` | `rp-breadcrumb` | none | yes | none |
| list | none (printed by the root) | none | `ol` | `rp-breadcrumb-list` | none | yes (always printed) | none |
| item | `BreadcrumbItem` | `blocks/breadcrumb-item.liquid` | `li` | `rp-breadcrumb-item` | none | yes (at least two) | none |
| link | none (printed by the item) | none | `a` | `rp-breadcrumb-link` | none | yes (always printed) | none |
| separator | none (printed by the item unless `current`) | none | `svg` | `rp-icon rp-breadcrumb-separator` | none | no | none |

Nesting rules:

1. The children of the root are BreadcrumbItem parts only; the root places them inside the list part.
2. Exactly one item, the last, has `current`. Every other item MUST NOT have it.
3. The first item SHOULD link to the home page.

### Props

Root (`Breadcrumb`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `ariaLabel` | `aria_label` | string | text | locale key `ripple.breadcrumb.label` (`Breadcrumb`) | no | no | `aria-label` on the root |

Item (`BreadcrumbItem`); it takes `class` and rest props (applied to the `li`), not `span` or `hidden`:

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `href` | `href` | url | any URL | none | yes | no | `href` on the link part |
| `current` | `current` | boolean | `true false` | `false` | no | no | when true: `aria-current="page"` on the link part and NO separator part; when false: the separator part after the link |

The current page is a link with `aria-current="page"` (not plain text), which is the form required by `02-html-contract.md` section 8 (Navigation state).

### Content model

Root: `parts` - BreadcrumbItem only. Item: `text` - the page name, phrasing content with no interactive descendants.

### HTML contract

Fixture `default` (two items: `href="/"` children `Home`; `href="/collections/shirts"`, `current`, children `Shirts`):

```html
<nav class="rp-breadcrumb" aria-label="Breadcrumb"><ol class="rp-breadcrumb-list"><li class="rp-breadcrumb-item"><a class="rp-breadcrumb-link" href="/">Home</a><svg class="rp-icon rp-breadcrumb-separator" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></li><li class="rp-breadcrumb-item"><a class="rp-breadcrumb-link" href="/collections/shirts" aria-current="page">Shirts</a></li></ol></nav>
```

Fixture `three-levels` (root `ariaLabel="You are here"`; three items):

```html
<nav class="rp-breadcrumb" aria-label="You are here"><ol class="rp-breadcrumb-list"><li class="rp-breadcrumb-item"><a class="rp-breadcrumb-link" href="/">Home</a><svg class="rp-icon rp-breadcrumb-separator" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></li><li class="rp-breadcrumb-item"><a class="rp-breadcrumb-link" href="/collections/shirts">Shirts</a><svg class="rp-icon rp-breadcrumb-separator" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></li><li class="rp-breadcrumb-item"><a class="rp-breadcrumb-link" href="/products/linen-shirt" aria-current="page">Linen shirt</a></li></ol></nav>
```

Fixture records (`parts` form):

| Fixture | Root `props` | `parts` (in order) |
|---|---|---|
| `default` | `{}` | `item` `{ "href": "/" }` children `Home`; `item` `{ "href": "/collections/shirts", "current": true }` children `Shirts` |
| `three-levels` | `{ "ariaLabel": "You are here" }` | `item` `{ "href": "/" }` children `Home`; `item` `{ "href": "/collections/shirts" }` children `Shirts`; `item` `{ "href": "/products/linen-shirt", "current": true }` children `Linen shirt` |
| `class` | `{ "class": "custom-a custom-b" }` | as `default` |
| `escaping` | `{ "ariaLabel": "Say \"hi\" & <go>" }` | as `default` |

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `aria-current` | link | server | the item has `current` | `page` |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional: plain links.

### Events, commands and methods

None.

### Accessibility

- Pattern: WAI-ARIA Authoring Practices "Breadcrumb"; `checkPattern`: none (the fixture lint checks below cover it).
- Accessible name: `aria-label` on the `nav`, default `Breadcrumb` (locale key `ripple.breadcrumb.label`), per `02-html-contract.md` A-10.
- Focus: each link is in the tab order, including the current one.
- Announcements: none.
- Separators are decorative (`aria-hidden="true"`) and are inside the `li`, so that a screen reader reads "list, 3 items" with one link per item. In right-to-left the separator is mirrored.

| Key | Action |
|---|---|
| `Tab` | moves to the next link |
| `Enter` | follows the focused link |

### Styling

- File: `components/breadcrumb/breadcrumb.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--spacing-target-min`, `--text-sm`, `--text-sm--line-height`, `--color-muted-foreground`, `--color-foreground`, `--rp-dir`, `--rp-duration-fast`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-breadcrumb-gap` | `calc(var(--spacing) * 1.5)` | gap between link and separator, and between items |

| Modifier selector | Sets |
|---|---|
| none | |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-breadcrumb` | custom properties: `--rp-breadcrumb-gap`. Declarations: `display: block; margin: 0; font-size: var(--text-sm); line-height: var(--text-sm--line-height); color: var(--color-muted-foreground)` |
| PARTS | `.rp-breadcrumb-list` | `display: flex; flex-wrap: wrap; align-items: center; gap: var(--rp-breadcrumb-gap); margin: 0; padding: 0; list-style: none` |
| PARTS | `.rp-breadcrumb-item` | `display: inline-flex; align-items: center; gap: var(--rp-breadcrumb-gap); margin: 0; padding: 0` |
| PARTS | `.rp-breadcrumb-link` | `display: inline-flex; align-items: center; min-block-size: var(--spacing-target-min); color: inherit; text-decoration: none` |
| PARTS | `.rp-breadcrumb-separator` | `flex: none; inline-size: 1em; block-size: 1em; scale: var(--rp-dir) 1` |
| STATES | `.rp-breadcrumb-link:hover` (inside `@media (hover: hover)`) | `color: var(--color-foreground); text-decoration: underline` |
| STATES | `.rp-breadcrumb-link[aria-current="page"]` | `color: var(--color-foreground)` |
| MOTION | `.rp-breadcrumb-link` (inside the motion media query) | `transition: color var(--rp-duration-fast) var(--ease-out)` |

### Host notes

- HTML: None.
- React: `export function Breadcrumb(props: BreadcrumbProps)` and `export function BreadcrumbItem(props: BreadcrumbItemProps)` in `breadcrumb.tsx`; generated; no context. `ariaLabel = "Breadcrumb"` is a default parameter value.
- Remix: None.
- Liquid: two block files. `breadcrumb-item` renders `{% render 'rp-icon', name: 'chevron-right', class: 'rp-breadcrumb-separator' %}` unless `current == true`. Schema settings: none. Locale keys: `ripple.breadcrumb.name`, `ripple.breadcrumb.item_name`, `ripple.breadcrumb.label`.

```tsx
<Breadcrumb>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href={`/collections/${collection.handle}`}>{collection.title}</BreadcrumbItem>
  <BreadcrumbItem href={`/products/${product.handle}`} current>
    {product.title}
  </BreadcrumbItem>
</Breadcrumb>
```

```liquid
{% block 'breadcrumb' %}
  {% block 'breadcrumb-item', href: routes.root_url %}{{ 'general.home' | t }}{% endblock %}
  {% if collection %}
    {% block 'breadcrumb-item', href: collection.url %}{{ collection.title }}{% endblock %}
  {% endif %}
  {% block 'breadcrumb-item', href: product.url, current: true %}{{ product.title }}{% endblock %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4. Manifest `rules[]` (reported by RP113, D-059):

1. `breadcrumb-list-items-only`: kind `max-count`, selector `.rp-breadcrumb-list > *:not(.rp-breadcrumb-item)`, count `0`. Message: "A Breadcrumb list has a child that is not a breadcrumb item." Fix: "Put every entry in a breadcrumb-item part."
2. `breadcrumb-one-current`: kind `max-count`, selector `.rp-breadcrumb-link[aria-current="page"]`, count `1`. Message: "A Breadcrumb has more than one current item." Fix: "Pass current only to the last breadcrumb-item."
3. `breadcrumb-needs-current`: kind `requires-descendant`, selector `:scope`, target `.rp-breadcrumb-link[aria-current="page"]`. Message: "A Breadcrumb has no current item." Fix: "Pass current to the last breadcrumb-item."

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 2: in every fixture, the number of `svg.rp-breadcrumb-separator` elements equals the number of items minus 1; the last `li` contains no `svg`; exactly one `a` has `aria-current="page"` and it is in the last `li`.
3. Tier 3: the accessibility snapshot of fixture `three-levels` is a navigation named `You are here` that contains a list of 3 list items, each with one link.
4. Tier 5: every link computes a block size of at least 24 px; fixture `three-levels` inside a 160 px wide container wraps (the list's block size is greater than one line) with no horizontal overflow.
5. Tier 5: inside `dir="rtl"` the separator's computed `scale` is `-1 1`.
6. Tier 2: the Liquid host with no `aria_label` prints `aria-label="Breadcrumb"`.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` section 8.1 (`nav` + `ol`, tier `parts`), D-038, D-068; `ripple/docs/02-html-contract.md` A-10 (landmark label from a locale key), section 8 "Navigation state" row (`aria-current="page"` on the current page link), S-7 (a part cannot read its parent: hence `current` on the item and the separator inside the item); `ripple/docs/03-styling-and-tokens.md` section 10 (`--rp-dir`).
- UNVERIFIED: the theme translation key `general.home` in the Liquid example (example only).

### Fallback (SPIKE-nn)

None.

---
