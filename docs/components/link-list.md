# LinkList

> Component spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `link-list` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none |
| Root element and class | `nav` `.rp-link-list` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M4 |

### Purpose

A one-level list of links from a menu, inside a named `<nav>` landmark. Replaces the base theme's `basic-menu` block (ledger 8.6).

- Use when: rendering footer menus, policy links, or any flat menu.
- Do not use when: the menu has dropdowns (use NavigationMenu), or the links are a trail (use Breadcrumb) or pages of results (use Pagination).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `LinkList` | `blocks/link-list.liquid` | `nav` | `rp-link-list` | none | yes | `<id>` when `id` is passed |
| list | none (printed by root) | same file | `ul` | `rp-link-list-list` | none | yes | none |
| item | none (default body) | same file | `li` | `rp-link-list-item` | none | one per menu item with a URL | none |
| link | none (default body) | same file | `a` | `rp-link-list-link` | none | one per `item` | none |

Nesting rules: root contains exactly one `list`. Only top-level menu items are rendered; children of items are ignored. Items without a URL are skipped. LinkList MUST NOT be nested inside another `<nav>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | no | no | `id` on root |
| `menu` | `menu` | object | `RippleMenu`; Liquid: a linklist drop (its `.links` are rendered) | none | yes (unless children are supplied; Liquid: unless `links` is passed) | no | default body |
| none | `links` | object | Liquid only: an array of objects with `.title` and `.url` (for example `shop.policies`) | none | no | no | default body, used instead of `menu.links` |
| `ariaLabel` | `aria_label` | string | any text | `{ "t": "ripple.link-list.label" }` ("Links") | no | no | `aria-label` on root |
| `orientation` | `orientation` | enum | `vertical`, `horizontal` | `vertical` | no | no | `data-orientation` on root |

A page with more than one LinkList MUST pass a distinct `ariaLabel` to each (landmarks need unique names).

### Content model

`flow`, restricted - the default body is one `item` per top-level menu entry that has a URL. Children, when supplied, replace the default body and MUST be `<li class="rp-link-list-item">` elements. With no renderable item and no children the component prints the root with an empty `list`.

### HTML contract

Fixture `default` (`menu: menu.footer`):

```html
<nav class="rp-link-list" aria-label="Links" data-orientation="vertical"><ul class="rp-link-list-list"><li class="rp-link-list-item"><a class="rp-link-list-link" href="/search">Search</a></li><li class="rp-link-list-item"><a class="rp-link-list-link" href="/pages/contact">Contact</a></li></ul></nav>
```

Fixture `current` (`menu: menu.main`, `id: "footer-menu"`, `ariaLabel: "Footer"`, `orientation: "horizontal"`):

```html
<nav class="rp-link-list" id="footer-menu" aria-label="Footer" data-orientation="horizontal"><ul class="rp-link-list-list"><li class="rp-link-list-item"><a class="rp-link-list-link" href="/collections/all" aria-current="page">Shop</a></li><li class="rp-link-list-item"><a class="rp-link-list-link" href="/pages/about">About</a></li></ul></nav>
```

Fixture `skips-items-without-url` (`menu: menu.deep`):

```html
<nav class="rp-link-list" aria-label="Links" data-orientation="vertical"><ul class="rp-link-list-list"></ul></nav>
```

Fixture `invalid-enum-falls-back` (`orientation: "diagonal"`, `menu: menu.footer`): `data-orientation="vertical"`; otherwise equal to `default`.

Fixture `escaping` (`ariaLabel: "Say \"hi\" & <go>"`, `menu: menu.empty`): `aria-label="Say &quot;hi&quot; &amp; &lt;go&gt;"`.

Fixture `class` (`class: "custom-a custom-b"`, `menu: menu.empty`): root class is `rp-link-list custom-a custom-b`.

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `aria-current="page"` | `link` | server | the item's `current` is true | `page` or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None.

### Behaviour without JavaScript

Identical: every link navigates.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| none | none | none | none | none |

### Accessibility

- Pattern: native `<nav>` with a list of links; `checkPattern`: none.
- Accessible name: `aria-label` from `ariaLabel`; always printed (rule A-10).
- Focus: none.
- Announcements: None.

| Key | Action |
|---|---|
| Tab | Next link |

### Styling

- File: `components/link-list/link-list.css` (layer `rp.components`).
- Tokens used: `--color-foreground`, `--color-muted-foreground`, `--color-ring`, `--spacing`, `--text-sm`, `--rp-duration-fast`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-link-list-gap` | `calc(var(--spacing) * 2)` | Gap between items |
| `--_direction` | `column` | Flex direction of `list` |
| `--_gap-inline` | `0` | Inline gap of `list` |

| Modifier selector | Sets |
|---|---|
| `.rp-link-list[data-orientation="vertical"]` | `--_direction: column; --_gap-inline: 0` |
| `.rp-link-list[data-orientation="horizontal"]` | `--_direction: row; --_gap-inline: calc(var(--spacing) * 6)` |

Required rules: `list` is `display: flex; flex-direction: var(--_direction); flex-wrap: wrap; gap: var(--rp-link-list-gap) var(--_gap-inline); margin: 0; padding: 0; list-style: none`. `link` is `display: inline-flex; align-items: center; min-block-size: 1.5rem; color: var(--color-muted-foreground); text-decoration: none`; hover (inside `@media (hover: hover)`) and `[aria-current="page"]` use `--color-foreground`. `data-orientation` is a UI SDK reserved attribute name; every selector that uses it includes `.rp-link-list` (ledger 4.3).

### Host notes

- HTML: None.
- React: `export function LinkList(props: LinkListProps): JSX.Element`. No hook. Hand-written (the template language has no loops).
- Remix: None.
- Liquid: block `link-list`; markup in `snippets/rp-link-list.liquid` (embedded by Footer). Schema settings: `orientation` (select). Locale keys: `ripple.link-list.name`, `ripple.link-list.label` ("Links"). `{{ attributes }}` is printed LAST in the root's opening tag (D-035). Block name `t:ripple.link-list.name`; setting labels `t:ripple.props.<prop name>`, option labels `t:ripple.props.<value>` (D-038).

```tsx
<LinkList menu={footerMenu} ariaLabel="Footer" />
```

```liquid
{% block 'link-list', menu: linklists.footer, aria_label: 'Footer' %}{% endblock %}
```

`components/link-list/liquid/snippets/rp-link-list.liquid` (complete body after the `{% doc %}` header):

```liquid
{%- liquid
  if aria_label == blank
    assign aria_label = 'ripple.link-list.label' | t
  endif
  assign allowed_orientation = 'vertical,horizontal' | split: ','
  unless allowed_orientation contains orientation
    assign orientation = 'vertical'
  endunless
  if links == blank
    assign links = menu.links
  endif
-%}
<nav
  class="rp-link-list {{ class | escape }}"
  {% if id != blank %}id="{{ id | escape }}"{% endif %}
  aria-label="{{ aria_label | escape }}"
  data-orientation="{{ orientation }}"
  {% if span != blank %}data-span="{{ span | escape }}"{% endif %}
  {% if hidden != blank %}data-hidden="{{ hidden | escape }}"{% endif %}
  {{ attributes }}
>
  <ul class="rp-link-list-list">
    {%- if content != blank -%}
      {{ content }}
    {%- else -%}
      {%- for link in links -%}
        {%- if link.url != blank and link.url != '#' -%}
          <li class="rp-link-list-item"><a class="rp-link-list-link" href="{{ link.url | escape }}"{% if link.current == true %} aria-current="page"{% endif %}>{{ link.title | escape }}</a></li>
        {%- endif -%}
      {%- endfor -%}
    {%- endif -%}
  </ul>
</nav>
```

### Commerce

None.

### Agent surface

`accessibility-tree`. Actions: none. Confirm: none. Secret: none.

### Checker rules

- RP113 structure rule `link-list-not-in-nav`: `.rp-link-list` MUST NOT have a `nav` ancestor.
- RP201 / lint `a-10`: the `<nav>` has `aria-label`.

### Acceptance tests

- **AT-1** Tier 2: fixtures `default`, `current`, `skips-items-without-url`, `invalid-enum-falls-back`, `escaping`, `class` conform in all four hosts.
- **AT-2** Tier 3: zero mutations when `ripple.js` loads.
- **AT-3** Tier 5: with `orientation="horizontal"` and a 1280 px viewport, the two links of fixture `current` have equal `top`; with `vertical` they have equal `left`.
- **AT-4** Tier 5: every link box is at least 24 by 24 CSS px.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/blocks/basic-menu.liquid` (the block being replaced: `menu.links`, `link.url`, `link.title`, `link.current`); ledger 8.6; `02-html-contract.md` A-10.
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
