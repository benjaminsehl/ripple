# Header

> Component spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `header` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none |
| Root element and class | `header` `.rp-header` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `logo`, `navigation-menu`, `icon-button`, `icon`, `account-link`, `cart-link` |
| Milestone | M4 |

### Purpose

The site header bar: a `<header>` landmark with a width-limited inner row. With no children it renders a complete default body (menu opener, logo, navigation, search link, account link, cart link).

- Use when: a page needs the store's top bar. Render it once per page, in the `layout` blueprint.
- Do not use when: you need a heading for a page area (use Heading) or a full-width band of content (use Container).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Header` | `blocks/header.liquid` | `header` | `rp-header` | none | yes | none |
| inner | none (printed by root) | same file | `div` | `rp-header-inner` | none | yes | none |
| start | none (default body only) | same file | `div` | `rp-header-start` | none | no | none |
| center | none (default body only) | same file | `div` | `rp-header-center` | none | no | none |
| end | none (default body only) | same file | `div` | `rp-header-end` | none | no | none |

Nesting rules: `inner` is the only child of root. Children (or the default body) are the only content of `inner`. `start`, `center`, `end` exist only in the default body, in that order. A page MUST NOT contain more than one Header. Header MUST NOT be inside `<main>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `scheme` | `scheme` | enum | `light`, `dark`, project scheme names | none | no | no | `data-scheme` on root; omitted when unset |
| `sticky` | `sticky` | boolean | `true`, `false` | `false` | no | no | `data-sticky=""` on root |
| `menu` | `menu` | object | `RippleMenu` (1.2); Liquid: a linklist drop | TSX: none. Liquid: `linklists['main-menu']` | no | no | default body: passed to NavigationMenu |
| `shop` | none (reads `shop`, `routes`) | object | `RippleShop` (1.3) | none | TSX: yes when there are no children | no | default body: Logo |
| `cart` | none (reads `cart`) | object | `RippleCart` or `null` (`05-commerce.md` 11.1) | `null` | no | no | default body: `count={cart?.totalQuantity ?? 0}` on CartLink |
| `navigationMenu` | `navigation_menu` | id | any id | `main-nav` | no | no | default body: `id` of the NavigationMenu |
| `linkList` | `link_list` | id | any id | `footer-menu` | no | no | default body: `href="#<value>"` on the menu opener |
| `mobileNav` | `mobile_nav` | id | id of a MobileNav | none | no | no | default body: passed to the menu opener's IconButton prop `dialog`, which prints `data-rp-open` (D-009); omitted when unset |
| `cartDrawer` | `cart_drawer` | id | id of a CartDrawer | none | no | no | default body: passed to CartLink's prop `drawer`; when unset the cart link has no `data-rp-open` (D-091 item 5: the cart page) |
| `searchDialog` | `search_dialog` | id | id of a Dialog | none | no | no | default body: passed to the search link's IconButton prop `dialog`, which prints `data-rp-open`; omitted when unset |
| `searchUrl` | `search_url` | url | any URL | TSX: `/search`. Liquid: `routes.search_url` | no | no | default body: `href` of the search link |
| `accountUrl` | `account_url` | url | any URL | TSX: `/account`. Liquid: see AccountLink | no | no | default body: passed to AccountLink `href` |
| `cartUrl` | `cart_url` | url | any URL | TSX: `/cart`. Liquid: `routes.cart_url` | no | no | default body: passed to CartLink |
| `strings` | none | object | keys `menu`, `search`, `account` | English defaults | no | no | TSX hosts only (1.4) |

When `mobileNav`, `cartDrawer` or `searchDialog` is set, an element with that id MUST exist in the same response (`02-html-contract.md` rule I-5).

### Content model

`flow` - any flow content. When children are supplied they replace the default body and are the only content of `inner`. When no children are supplied (Liquid: `content == blank`), the default body is rendered: `start` (menu opener IconButton, Logo), `center` (NavigationMenu, only when `menu` has at least one item), `end` (search IconButton link, AccountLink, CartLink).

### HTML contract

Fixture `default` (children: one link; no props):

```html
<header class="rp-header"><div class="rp-header-inner"><a class="rp-logo" href="/" data-size="md">Mock Shop</a></div></header>
```

Fixture `sticky-scheme` (`sticky: true`, `scheme: "dark"`, same children):

```html
<header class="rp-header" data-scheme="dark" data-sticky=""><div class="rp-header-inner"><a class="rp-logo" href="/" data-size="md">Mock Shop</a></div></header>
```

Fixture `default-body` (`menu: menu.main`, `shop: shop.basic`, `cart: null`, `mobileNav: "mobile-nav"`, `cartDrawer: "cart-drawer"`, `searchDialog: "search-dialog"`; no children). The NavigationMenu, Logo, AccountLink and CartLink subtrees are those components' own contracts for the props shown:

```html
<header class="rp-header">
  <div class="rp-header-inner">
    <div class="rp-header-start">
      <a class="rp-icon-button" href="#footer-menu" data-variant="ghost" data-size="md" data-hidden="lg:true" aria-label="Menu" data-rp-open="mobile-nav"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></a>
      <a class="rp-logo" href="/" data-size="md">Mock Shop</a>
    </div>
    <div class="rp-header-center" data-hidden="true lg:false">
      <rp-navigation-menu class="rp-navigation-menu" data-slot="rp-navigation-menu" id="main-nav">
        <nav aria-label="Main">
          <ul class="rp-navigation-menu-list">
            <li class="rp-navigation-menu-item" data-rp-part="item">
              <a class="rp-navigation-menu-link" href="/collections/all" aria-current="page">Shop</a>
              <button type="button" class="rp-navigation-menu-trigger" popovertarget="main-nav-item-1" aria-label="Shop submenu"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
              <div id="main-nav-item-1" popover="" class="rp-navigation-menu-content">
                <ul class="rp-navigation-menu-sublist">
                  <li class="rp-navigation-menu-subitem"><a class="rp-navigation-menu-sublink" href="/collections/shirts">Shirts</a></li>
                  <li class="rp-navigation-menu-subitem"><a class="rp-navigation-menu-sublink" href="/collections/socks">Socks</a></li>
                </ul>
              </div>
            </li>
            <li class="rp-navigation-menu-item" data-rp-part="item">
              <a class="rp-navigation-menu-link" href="/pages/about">About</a>
            </li>
          </ul>
        </nav>
      </rp-navigation-menu>
    </div>
    <div class="rp-header-end">
      <a class="rp-icon-button" href="/search" data-variant="ghost" data-size="md" aria-label="Search" data-rp-open="search-dialog"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></a>
      <a class="rp-account-link" href="/account" data-icon-only=""><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg><span class="rp-account-link-label">Account</span></a>
      <rp-cart class="rp-cart-link" data-slot="rp-cart"><a class="rp-cart-link-trigger" href="/cart" data-rp-open="cart-drawer"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg><span class="rp-visually-hidden">Cart</span><span class="rp-cart-link-count" data-rp-part="count" hidden>0</span></a></rp-cart>
    </div>
  </div>
</header>
```

Fixture `default-body-plain` (`menu: menu.empty`, `shop: shop.basic`; no overlay ids): as `default-body` without the three `data-rp-open` attributes and without the `center` part.

Fixture `class` (`class: "custom-a custom-b"`, children as `default`): root is `<header class="rp-header custom-a custom-b">`.

Fixture `invalid-enum-falls-back`: not applicable (`scheme` has no default; an unknown value prints no `data-scheme`). The fixture is named `unknown-scheme` and its reference HTML equals `default`.

Host-owned regions and masks: none of Header's own. The CartLink subtree carries the masks of `11-components-commerce.md` (the `href` of the cart link). The fixtures `default-body` and `default-body-plain` are `generated: "hand"`; `default`, `sticky-scheme`, `class`, `unknown-scheme` are `generated: "hand"` as well, because Header has no contract template (the default body embeds components of kinds `native` and `commerce`).

Kind note (D-085): `kind` is `static` and the `default` fixture passes children, so it contains no custom element. `dependencies.elements` is empty; `rp-navigation-menu` and `rp-cart` belong to the embedded components, which the manifest lists in `dependencies.embeds` (D-070).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-sticky` | root | server | prop `sticky` is true | `""` or absent |
| `data-scheme` | root | server | prop `scheme` is set to a known scheme | the scheme name or absent |
| `aria-haspopup`, `aria-controls` | the menu opener and the search link (`a[data-rp-open]`) | runtime opener listener (`04-elements.md` 3.4) | after upgrade, when the target dialog exists | absent |

Upgrade allow-list (mutations permitted when the element upgrades): none of its own; the global entry 1 of `02-html-contract.md` section 7.3 covers `a[data-rp-open]`.

### Behaviour with JavaScript

1. Header has no behaviour of its own. No custom element is defined for it.
2. A primary click on the menu opener opens the MobileNav dialog whose id is `mobileNav` (opener listener, D-009).
3. A primary click on the search link opens the Dialog whose id is `searchDialog` (opener listener).
4. With `sticky`, the header stays at the block-start edge of the viewport while the page scrolls (CSS only).

### Behaviour without JavaScript

Everything works. The menu opener is a link to `#<linkList>`: it scrolls to the footer menu, which lists every top-level menu link. The search link navigates to `searchUrl`. The account link and the cart link navigate. NavigationMenu disclosure buttons open their panels natively (`popover`). No control is hidden; Header prints no `data-rp-js`.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| none | none | none | none | none |

### Accessibility

- Pattern: native `<header>` (banner landmark when it is a child of `<body>`); `checkPattern`: none.
- Accessible name: none on the root (a banner landmark needs none). The menu opener is named by `ripple.header.menu` ("Menu"); the search link by `ripple.header.search` ("Search").
- Focus: no focus management. A sticky Header sets `--rp-header-block-size` on `:root:has(.rp-header[data-sticky])` (Styling). `base.css` owns `html { scroll-padding-block-start: var(--rp-header-block-size, 0px); }` (D-085, D-105), so focused and targeted elements are not hidden under the bar (WCAG 2.2 SC 2.4.11).
- Announcements: None.

| Key | Action |
|---|---|
| Tab | Moves through the links and buttons in DOM order |

### Styling

- File: `components/header/header.css` (layer `rp.components`).
- Tokens used: `--color-background`, `--color-foreground`, `--color-border`, `--container-page`, `--spacing-gutter`, `--spacing`, `--rp-z-sticky`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-header-block-size` | `4rem` | Minimum block size of the inner row. Set on `:root:has(.rp-header[data-sticky])`, not on `.rp-header`, so that `base.css` can read it for `scroll-padding-block-start`. Without a sticky Header it is unset and the inner row uses the `4rem` fallback |
| `--rp-header-gap` | `calc(var(--spacing) * 4)` | Gap between direct children of `inner` and inside `start`, `end` |
| `--rp-header-border` | `1px solid var(--color-border)` | Block-end border of the root |

| Modifier selector | Sets |
|---|---|
| `.rp-header[data-sticky]` | `--_position: sticky; --_z: var(--rp-z-sticky)` (custom properties only, D-024 item 2; the base rule consumes them) |

Required rules (complete list of declarations the file MUST contain; values MAY be tuned):

```css
@layer rp.components {
  :root:has(.rp-header[data-sticky]) {
    --rp-header-block-size: 4rem;
  }
  .rp-header {
    --rp-header-gap: calc(var(--spacing) * 4);
    --rp-header-border: 1px solid var(--color-border);
    background: var(--color-background);
    color: var(--color-foreground);
    border-block-end: var(--rp-header-border);
    position: var(--_position, static);
    inset-block-start: 0;
    z-index: var(--_z, auto);
  }
  .rp-header[data-sticky] {
    --_position: sticky;
    --_z: var(--rp-z-sticky);
  }
  .rp-header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--rp-header-gap);
    min-block-size: var(--rp-header-block-size, 4rem);
    max-inline-size: var(--container-page);
    margin-inline: auto;
    padding-inline: var(--spacing-gutter);
  }
  .rp-header-start,
  .rp-header-end {
    display: flex;
    align-items: center;
    gap: calc(var(--rp-header-gap) / 2);
    flex: 1 1 0;
    min-inline-size: 0;
  }
  .rp-header-end {
    justify-content: flex-end;
  }
  .rp-header-center {
    display: flex;
    flex: 0 1 auto;
    justify-content: center;
  }
}
```

The `data-hidden` attributes in the default body are matched by `props.css` (universal `hidden` prop, D-028), not by this file.

### Host notes

- Binding paths (D-139): `static` that the template language of `07-manifest-registry-cli.md` 2.3 cannot express (D-072 row 2): no `template`; every fixture is `generated: "hand"`; `html` is generated from the fixture files; the `react`, `remix` and `liquid` files are hand-written with their generated regions. Where a line below says a binding is "generated", this line wins.
- HTML: copy the `default-body` fixture and replace the embedded subtrees with real data.
- React: `export function Header(props: HeaderProps): JSX.Element`. No hook. `HeaderProps` is the Props table plus `children?: ReactNode`, `className?: string` and rest props (`RestProps<HeaderOwnProps>`). The default body renders `IconButton`, `Logo`, `NavigationMenu`, `AccountLink`, `CartLink` from their own files. The two openers are `<IconButton icon="menu" href={`#${linkList}`} dialog={mobileNav} ariaLabel={strings.menu} hidden="lg:true" />` and `<IconButton icon="search" href={searchUrl} dialog={searchDialog} ariaLabel={strings.search} />`; the cart link is `<CartLink drawer={cartDrawer} href={cartUrl} count={cart?.totalQuantity ?? 0} />`. `data-rp-open` is never passed through rest props (D-009).
- Remix: same tree; no `data-rmx-*` of its own.
- Liquid: block `header`; the default body lives in `snippets/rp-header.liquid` (file key `snippet`), which renders `rp-icon-button`, `rp-logo`, `rp-navigation-menu`, `rp-account-link`, `rp-cart-link`. `{{ attributes }}` is printed LAST in the root's opening tag (D-035). Schema settings: `scheme` (select; label `t:ripple.props.scheme`, block name `t:ripple.header.name`, D-038). Locale keys: `ripple.header.name`, `ripple.header.menu` ("Menu"), `ripple.header.search` ("Search").

```tsx
<Header
  sticky
  menu={menu}
  shop={shop}
  cart={cart}
  mobileNav="mobile-nav"
  cartDrawer="cart-drawer"
  searchDialog="search-dialog"
/>
```

```liquid
{% block 'header', sticky: true, mobile_nav: 'mobile-nav', cart_drawer: 'cart-drawer', search_dialog: 'search-dialog' %}{% endblock %}
```

`components/header/liquid/snippets/rp-header.liquid` (complete body after the `{% doc %}` header; the `{% doc %}` lists the params of the Props table, then `class`, `attributes`, `content`):

```liquid
{%- liquid
  if menu == blank
    assign menu = linklists['main-menu']
  endif
  if navigation_menu == blank
    assign navigation_menu = 'main-nav'
  endif
  if link_list == blank
    assign link_list = 'footer-menu'
  endif
  if search_url == blank
    assign search_url = routes.search_url
  endif
  assign menu_label = 'ripple.header.menu' | t
  assign search_label = 'ripple.header.search' | t
  assign account_label = 'ripple.account-link.label' | t
  assign menu_href = '#' | append: link_list
-%}
<header
  class="rp-header {{ class | escape }}"
  {% if scheme != blank %}data-scheme="{{ scheme | escape }}"{% endif %}
  {% if sticky == true %}data-sticky=""{% endif %}
  {% if span != blank %}data-span="{{ span | escape }}"{% endif %}
  {% if hidden != blank %}data-hidden="{{ hidden | escape }}"{% endif %}
  {{ attributes }}
>
  <div class="rp-header-inner">
    {%- if content != blank -%}
      {{ content }}
    {%- else -%}
      <div class="rp-header-start">
        {% render 'rp-icon-button', icon: 'menu', href: menu_href, dialog: mobile_nav, aria_label: menu_label, hidden: 'lg:true' %}
        {% render 'rp-logo', content: shop.name %}
      </div>
      {%- if menu.links.size > 0 -%}
        <div class="rp-header-center" data-hidden="true lg:false">
          {% render 'rp-navigation-menu', id: navigation_menu, menu: menu %}
        </div>
      {%- endif -%}
      <div class="rp-header-end">
        {% render 'rp-icon-button', icon: 'search', href: search_url, dialog: search_dialog, aria_label: search_label %}
        {% render 'rp-account-link', href: account_url, icon_only: true, content: account_label %}
        {% render 'rp-cart-link', drawer: cart_drawer, href: cart_url %}
      </div>
    {%- endif -%}
  </div>
</header>
```

Notes on this snippet: the openers pass the id to IconButton's `dialog` param (D-009); a blank `dialog` prints no `data-rp-open`. IconButton's `icon` param renders the Icon (`09-components-foundation.md` `## IconButton`). Rendering `rp-*` snippets from a default body is the pattern of `06-bindings.md` section 8.7. `shop.name` is escaped by `rp-logo` (Logo's content is text; see Logo, Host notes). The CartLink params `drawer` and `href` are those of `11-components-commerce.md` `## CartLink`; a blank `drawer` prints no `data-rp-open`, and a blank `href` falls back to `routes.cart_url`.

### Commerce

None.

### Agent surface

`accessibility-tree`. Actions: none. Confirm: none. Secret: none. The links are reachable as links; the bridge sees the embedded `rp-navigation-menu` and `rp-cart` primitives through their own components.

### Checker rules

- RP113 structure rules (manifest `rules[]`): `header-once` (at most one `.rp-header` per document, `count` max 1); `header-outside-main` (`.rp-header` MUST NOT have a `main` ancestor).
- RP114: every `data-rp-open` id resolves in the document.
- RP302: the menu opener, the search link and the cart link are `<a href>` elements, never buttons.
- RP201: the icon-only links have accessible names.

### Acceptance tests

- **AT-1** Tier 2: fixtures `default`, `sticky-scheme`, `default-body`, `default-body-plain`, `class`, `unknown-scheme` conform in all four hosts.
- **AT-2** Tier 3: with `ripple.js` loaded, zero mutations inside `.rp-header` other than `aria-haspopup` and `aria-controls` on `a[data-rp-open]`.
- **AT-3** Tier 5: at 375 px wide the menu opener is visible and `.rp-header-center` has computed `display: none`; at 1280 px the opposite.
- **AT-4** Tier 5: with `sticky`, after `window.scrollTo(0, 2000)` the header's `getBoundingClientRect().top` is `0`.
- **AT-5** Tier 6: with JavaScript disabled, clicking the menu opener changes `location.hash` to `#footer-menu`; clicking the search link navigates to `/search`; clicking the cart link navigates to `/cart`.
- **AT-6** Tier 5: `.rp-header-inner` has the same inline start and end offsets as a `Container width="page"` on the same page (difference at most 0.5 CSS px).

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/layout/theme.liquid` lines 22 to 122 (header composed with captures; no cart or search link without JS); `ripple/docs/research/base-theme.md` 3.1 items 1, 2, 7 and 3.4; ledger D-009, D-037, D-006.
- UNVERIFIED: `:has()` support at the browser floor for the `scroll-padding` rule (Chrome 105, Safari 15.4, Firefox 121 by general knowledge; Firefox 128 is the floor, so it holds if that knowledge is right). SPIKE-06.

### Fallback (SPIKE-nn)

None.

---
