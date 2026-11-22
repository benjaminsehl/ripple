# Footer

> Component spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `footer` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none |
| Root element and class | `footer` `.rp-footer` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `link-list` |
| Milestone | M4 |

### Purpose

The site footer: a `<footer>` landmark with a width-limited inner column. With no children it renders a default body: the footer menu, a copyright line and the policy links.

- Use when: a page needs the store's footer. Render it once per page, in the `layout` blueprint.
- Do not use when: you need the bottom area of a card or dialog (use that component's own parts).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Footer` | `blocks/footer.liquid` | `footer` | `rp-footer` | none | yes | none |
| inner | none (printed by root) | same file | `div` | `rp-footer-inner` | none | yes | none |
| bottom | none (default body only) | same file | `div` | `rp-footer-bottom` | none | no | none |
| copyright | none (default body only) | same file | `p` | `rp-footer-copyright` | none | no | none |

Nesting rules: `inner` is the only child of root. A page MUST NOT contain more than one Footer. Footer MUST NOT be inside `<main>`. A page that has a MobileNav MUST contain a LinkList whose `id` equals the Header's `linkList` value; the Footer default body provides it.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `scheme` | `scheme` | enum | `light`, `dark`, project scheme names | none | no | no | `data-scheme` on root; omitted when unset |
| `menu` | `menu` | object | `RippleMenu`; Liquid: a linklist drop | TSX: none. Liquid: `linklists.footer` | no | no | default body: LinkList `menu` |
| `policies` | none (reads `shop.policies`) | object | `RippleMenu` | none | no | no | default body: second LinkList |
| `shop` | none (reads `shop`) | object | `RippleShop` | none | TSX: yes when there are no children | no | default body: name in the copyright line |
| `year` | `year` | number | four-digit year | TSX: `new Date().getFullYear()`. Liquid: `'now' \| date: '%Y'` | no | no | default body: year in the copyright line |
| `linkList` | `link_list` | id | any id | `footer-menu` | no | no | default body: `id` of the menu LinkList |
| `strings` | none | object | keys `menu`, `policies`, `copyright` | English defaults | no | no | TSX hosts only |

### Content model

`flow` - any flow content. Children replace the default body. The default body is, in order: a LinkList (`id` = `linkList`, `menu`, `orientation="vertical"`, `ariaLabel` = `ripple.footer.menu`), printed only when `menu` has at least one item; then `bottom`, which holds `copyright` and, when `policies` has at least one item, a LinkList (`menu` = `policies`, `orientation="horizontal"`, `ariaLabel` = `ripple.footer.policies`).

### HTML contract

Fixture `default` (children: one paragraph):

```html
<footer class="rp-footer"><div class="rp-footer-inner"><p>Contact us</p></div></footer>
```

Fixture `default-body` (`menu: menu.footer`, `shop: shop.basic`, `year: 2026`; no children):

```html
<footer class="rp-footer">
  <div class="rp-footer-inner">
    <nav class="rp-link-list" id="footer-menu" aria-label="Footer" data-orientation="vertical">
      <ul class="rp-link-list-list">
        <li class="rp-link-list-item"><a class="rp-link-list-link" href="/search">Search</a></li>
        <li class="rp-link-list-item"><a class="rp-link-list-link" href="/pages/contact">Contact</a></li>
      </ul>
    </nav>
    <div class="rp-footer-bottom">
      <p class="rp-footer-copyright">© 2026 Mock Shop</p>
    </div>
  </div>
</footer>
```

Fixture `policies` (as `default-body` plus `policies` = a menu with one item `{ "title": "Privacy policy", "url": "/policies/privacy-policy" }`): `bottom` additionally contains, after `copyright`:

```html
<nav class="rp-link-list" aria-label="Policies" data-orientation="horizontal">
  <ul class="rp-link-list-list">
    <li class="rp-link-list-item"><a class="rp-link-list-link" href="/policies/privacy-policy">Privacy policy</a></li>
  </ul>
</nav>
```

Fixture `scheme` (`scheme: "dark"`, children as `default`): root is `<footer class="rp-footer" data-scheme="dark">`.

Fixture `class` (`class: "custom-a custom-b"`): root is `<footer class="rp-footer custom-a custom-b">`.

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-scheme` | root | server | prop `scheme` is set to a known scheme | the scheme name or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None. Footer has no behaviour and no custom element.

### Behaviour without JavaScript

Identical to the behaviour with JavaScript. The LinkList with id `footer-menu` is the no-JS destination of the Header's menu opener.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| none | none | none | none | none |

### Accessibility

- Pattern: native `<footer>` (contentinfo landmark when it is a child of `<body>`); `checkPattern`: none.
- Accessible name: none on the root. Each LinkList `<nav>` has its own `aria-label`.
- Focus: no focus management. The menu LinkList `<nav>` is a link target (`#footer-menu`); it MUST NOT have `tabindex`.
- Announcements: None.

| Key | Action |
|---|---|
| Tab | Moves through the links in DOM order |

### Styling

- File: `components/footer/footer.css` (layer `rp.components`).
- Tokens used: `--color-background`, `--color-foreground`, `--color-muted-foreground`, `--color-border`, `--container-page`, `--spacing-gutter`, `--spacing`, `--text-sm`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-footer-padding-block` | `calc(var(--spacing) * 12)` | Block padding of `inner` |
| `--rp-footer-gap` | `calc(var(--spacing) * 8)` | Gap between direct children of `inner` |
| `--rp-footer-border` | `1px solid var(--color-border)` | Block-start border of the root and of `bottom` |

| Modifier selector | Sets |
|---|---|
| none | none |

Required rules: `.rp-footer` sets background, colour and `border-block-start`; `.rp-footer-inner` is `display: flex; flex-direction: column; gap: var(--rp-footer-gap); max-inline-size: var(--container-page); margin-inline: auto; padding-inline: var(--spacing-gutter); padding-block: var(--rp-footer-padding-block)`; `.rp-footer-bottom` is `display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: calc(var(--spacing) * 4); padding-block-start: calc(var(--spacing) * 6); border-block-start: var(--rp-footer-border); font-size: var(--text-sm); color: var(--color-muted-foreground)`; `.rp-footer-copyright` has `margin: 0`.

### Host notes

- HTML: copy the `default-body` fixture.
- React: `export function Footer(props: FooterProps): JSX.Element`. No hook.
- Remix: same tree; no `data-rmx-*`.
- Liquid: block `footer`; default body in `snippets/rp-footer.liquid`, which renders `rp-link-list`. The policies menu is built from `shop.policies` by passing `links: shop.policies` to `rp-link-list` (see LinkList, Host notes: its loop reads `.title` and `.url` of each entry, which both a link drop and a policy drop have). `{{ attributes }}` is printed LAST in the root's opening tag (D-035). Schema settings: `scheme` (select; label `t:ripple.props.scheme`, block name `t:ripple.footer.name`, D-038). Locale keys: `ripple.footer.name`, `ripple.footer.menu` ("Footer"), `ripple.footer.policies` ("Policies"), `ripple.footer.copyright` ("© {{ year }} {{ name }}"). The snippet uses the filter `date` once (`'now' | date: '%Y'`); `date` is in the component scope of `06-bindings.md` rule L-13 (D-097).

```tsx
<Footer menu={footerMenu} policies={policiesMenu} shop={shop} />
```

```liquid
{% block 'footer' %}{% endblock %}
```

Default body of `components/footer/liquid/snippets/rp-footer.liquid` (inside `<div class="rp-footer-inner">`, in the `{% else %}` branch of `{% if content != blank %}`):

```liquid
{%- liquid
  if menu == blank
    assign menu = linklists.footer
  endif
  if link_list == blank
    assign link_list = 'footer-menu'
  endif
  if year == blank
    assign year = 'now' | date: '%Y'
  endif
  assign menu_label = 'ripple.footer.menu' | t
  assign policies_label = 'ripple.footer.policies' | t
  # Escape before `t`: a filter after a `t:` named argument applies to the translated output.
  assign shop_name = shop.name | escape
-%}
{%- if menu.links.size > 0 -%}
  {% render 'rp-link-list', id: link_list, menu: menu, aria_label: menu_label, orientation: 'vertical' %}
{%- endif -%}
<div class="rp-footer-bottom">
  <p class="rp-footer-copyright">{{ 'ripple.footer.copyright' | t: year: year, name: shop_name }}</p>
  {%- if shop.policies.size > 0 -%}
    {% render 'rp-link-list', links: shop.policies, aria_label: policies_label, orientation: 'horizontal' %}
  {%- endif -%}
</div>
```

### Commerce

None.

### Agent surface

`accessibility-tree`. Actions: none. Confirm: none. Secret: none.

### Checker rules

- RP113 structure rules: `footer-once` (at most one `.rp-footer` per document); `footer-outside-main`.
- RP114: when the document contains `a[data-rp-open][href^="#"]`, the fragment id resolves to an element in the document (the footer menu).

### Acceptance tests

- **AT-1** Tier 2: fixtures `default`, `default-body`, `policies`, `scheme`, `class` conform in all four hosts.
- **AT-2** Tier 3: zero mutations inside `.rp-footer` when `ripple.js` loads.
- **AT-3** Tier 6: with JavaScript disabled, on the `layout` blueprint, following the Header's menu opener scrolls `#footer-menu` into the viewport, and every top-level item of the main menu that has a URL is present as a link in the document.
- **AT-4** Tier 5: `.rp-footer-inner` has the same inline offsets as a `Container width="page"` (difference at most 0.5 CSS px).

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/layout/theme.liquid` lines 351 to 387 (footer body: menu, copyright with `'now' | date: '%Y'`, `shop.policies`); `ripple/theme/blocks/footer.liquid`; ledger D-009 (footer menu anchor), D-017.
- UNVERIFIED: that a policy drop exposes `.title` and `.url` exactly as a link drop does on the live platform (the base theme reads `policy.url` and `policy.title` in `ripple/theme/layout/theme.liquid`, lines 366 to 376; tier 8 confirms).

### Fallback (SPIKE-nn)

None.

---
