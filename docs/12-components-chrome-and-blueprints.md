# 12 - Components: store chrome, page sections, and blueprints

Status: specification. Law: `00-decisions.md` (the ledger). Date: 2026-11-21.

## 0. Scope and how to read this document

This document specifies:

1. The 12 components of ledger section 8.4, each with the canonical component template of ledger section 7: Header, Footer, AnnouncementBar, NavigationMenu, MobileNav, LinkList, Logo, LocaleSelector, AccountLink, NewsletterForm, Hero, FeaturedCollection.
2. The 14 blueprints of ledger section 8.5, each with the blueprint template of ledger section 7 (Purpose; Regions; Components used; Structure; Data requirements per backend; No-JS behaviour; Acceptance tests): `layout`, `home`, `collection`, `collections-list`, `product`, `search`, `cart`, `blog`, `article`, `page`, `contact`, `not-found`, `password`, `gift-card`.

The task brief that started this document named "Account/content components" and "nine blueprints". The ledger supersedes it: account UI is AccountLink only (D-051), content components are in `09-components-foundation.md` and `11-components-commerce.md`, and there are 14 blueprints (8.5).

What this document does NOT own (link, do not restate):

| Topic | Owner |
|---|---|
| Contract rules, ids, fixtures, masks, canonicalisation | `02-html-contract.md` |
| Tokens, layers, `props.css`, component CSS rules | `03-styling-and-tokens.md` |
| `rp-dialog`, `rp-navigation-menu`, `rp-carousel`, the opener listener, Invoker Commands polyfill | `04-elements.md` |
| Commerce adapter, regions, refresh, form dialects, resource shapes other than `menu` and `shop` | `05-commerce.md` |
| Binding rules for React, Remix, Liquid, `html` | `06-bindings.md` |
| Manifest schema, registry, CLI, checker rule texts | `07-manifest-registry-cli.md` |
| Foundation, interactive and commerce components | `09-components-foundation.md`, `10-components-interactive.md`, `11-components-commerce.md` |
| Test harness and tiers | `13-testing.md` |
| The assembled Liquid theme (head, import map, settings bridge, `rp-head`) | `14-liquid-theme.md` |

Normative words: MUST, MUST NOT, SHOULD, MAY. "UNVERIFIED" marks a fact nobody ran or read in source. Evidence paths are relative to the directory that holds the local clones.

Milestone for everything in this document: M4 (D-067).

---

## 1. Shared definitions

### 1.1 Markup of components owned by other documents

Contracts in this document embed components owned by docs 09, 10 and 11 (`02-html-contract.md` rule S-10: the embedded markup MUST be exactly the embedded component's own contract). The shapes below are what this document prints for them. They follow the ledger and the examples in `02-html-contract.md` and `04-elements.md`. If the owning document differs, the owning document wins, the fixture files of this document are regenerated (`pnpm gen`), and the text here is updated. Implementers MUST build these embeds with `embed` nodes (TSX: by rendering the component; Liquid: `{% render 'rp-<id>' %}`), never by copying the markup below.

| Embedded component | Shape printed in this document |
|---|---|
| Icon (`09`) | `<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="<path data>"/></svg>` |
| IconButton as link (`09`) | `<a class="rp-icon-button" href="<url>" data-variant="ghost" data-size="md" aria-label="<name>">ICON</a>` |
| IconButton as button (`09`) | `<button class="rp-icon-button" type="button" data-variant="ghost" data-size="md" aria-label="<name>">ICON</button>` |
| Button (`09`) | `<button class="rp-button" type="<type>" data-variant="<variant>" data-size="<size>">text</button>` |
| Input (`09`) | `<input class="rp-input" type="<type>" name="<name>" data-size="md">` plus the native attributes passed |
| FormMessage (`09`) | `<p class="rp-form-message" data-tone="<tone>" role="<status or alert>">text</p>` |
| VisuallyHidden (`09`) | `<span class="rp-visually-hidden">text</span>` |
| Grid (`09`) | `<div class="rp-grid" data-columns="<tokens>" data-gap="<tokens>">` |
| Popover panel (`10`) | `<div id="<id>" popover class="rp-popover" data-side="<side>" data-align="<align>">` (D-010) |
| Carousel (`10`) | the markup of `04-elements.md` section 10.9 |
| CartLink (`11`) | `<rp-cart class="rp-cart-link" data-slot="rp-cart"><a class="rp-icon-button" href="<cart url>" data-variant="ghost" data-size="md" aria-label="Cart">ICON<span class="rp-cart-link-count" data-rp-part="count" hidden>0</span></a></rp-cart>`, with `data-rp-open="<drawer id>"` on the link when a drawer id is passed |
| ProductCard (`11`) | `<article class="rp-product-card">` containing a link, an image, a title and a Price |

Icon path data used in this document's examples (illustrative; `icons/<name>.svg` in `09-components-foundation.md` is normative):

| Icon name | Path data |
|---|---|
| `menu` | `M4 7h16M4 12h16M4 17h16` |
| `close` | `M6 6l12 12M18 6L6 18` |
| `chevron-down` | `M6 9l6 6 6-6` |
| `search` | `M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5` |
| `account` | `M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0` |
| `cart` | `M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2` |
| `globe` | `M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18` |

### 1.2 The `menu` resource

`05-commerce.md` section 11.1 assigns the `menu` shape to this document. TSX hosts pass this plain object (types exported from `<pkg>`, file `src/types.ts`):

```ts
export interface RippleMenuItem {
  /** Stable identifier of the item. Used only as a list key. */
  id: string;
  title: string;
  /** Site-relative or absolute URL. `null` for an item that only groups children. */
  url: string | null;
  /** True when `url` is the URL of the page being rendered. Computed by the server. */
  current: boolean;
  /** Children. Empty array when none. Components read at most three levels. */
  items: RippleMenuItem[];
}

export interface RippleMenu {
  id: string;
  items: RippleMenuItem[];
}
```

| Field | Storefront API source (`menu(handle:)`) | Liquid (a linklist drop, for example `linklists['main-menu']`) |
|---|---|---|
| `menu.id` | `Menu.id` | not read |
| `menu.items` | `Menu.items` | `menu.links` |
| `item.id` | `MenuItem.id` | not read |
| `item.title` | `MenuItem.title` | `link.title` |
| `item.url` | `MenuItem.url` (absolute; the host converts it, see below) | `link.url` |
| `item.current` | computed by the host | `link.current` |
| `item.items` | `MenuItem.items` | `link.links` |

Storefront API field names verified with the Shopify docs tool (`MenuItem`: `id`, `items`, `title`, `url`; `Menu`: `id`, `items`, `title`, `handle`). Liquid `link.current`, `link.links`, `link.title`, `link.url` are used by `ripple/theme/blocks/basic-menu.liquid` and `ripple/theme/blocks/main-menu.liquid`.

Rules:

- **MN-1** A Liquid link whose `url` is blank or equals `#` is treated as `url: null`.
- **MN-2** Components read three levels: top level, children, grandchildren. Deeper levels MUST be ignored.
- **MN-3** TSX hosts build the object with the function below. It is NOT a library export: it is scaffolded by the `layout` blueprint to `<blueprint dir>/lib/menu.ts` and owned by the project.

```ts
// blueprints/layout/<host>/lib/menu.ts
import type { RippleMenu, RippleMenuItem } from "__PKG__";

interface ApiMenuItem {
  id: string;
  title: string;
  url?: string | null;
  items?: ApiMenuItem[];
}

interface ApiMenu {
  id: string;
  items: ApiMenuItem[];
}

interface MenuOptions {
  /** Pathname of the request being rendered, for example "/collections/all". */
  pathname: string;
  /** Locale path prefix from `requestContext.locale.pathPrefix`, for example "/fr-ca". Default "". */
  pathPrefix?: string;
}

function toPath(url: string | null | undefined, pathPrefix: string): string | null {
  if (url === null || url === undefined || url === "" || url === "#") return null;
  let parsed: URL;
  try {
    parsed = new URL(url, "https://shop.invalid");
  } catch {
    return null;
  }
  // Storefront API menu URLs are absolute URLs on the shop's primary domain. Keep path, query and hash.
  const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  if (pathPrefix === "") return path;
  return path === "/" ? pathPrefix : `${pathPrefix}${path}`;
}

function toItem(item: ApiMenuItem, options: Required<MenuOptions>, depth: number): RippleMenuItem {
  const url = toPath(item.url, options.pathPrefix);
  return {
    id: item.id,
    title: item.title,
    url,
    current: url !== null && url.split(/[?#]/)[0] === options.pathname,
    items: depth >= 3 ? [] : (item.items ?? []).map((child) => toItem(child, options, depth + 1)),
  };
}

/** Converts a Storefront API `menu` selection (or null) into the shape Ripple chrome components read. */
export function toRippleMenu(menu: ApiMenu | null | undefined, options: MenuOptions): RippleMenu {
  const resolved = { pathname: options.pathname, pathPrefix: options.pathPrefix ?? "" };
  if (menu === null || menu === undefined) return { id: "empty", items: [] };
  return { id: menu.id, items: menu.items.map((item) => toItem(item, resolved, 1)) };
}
```

The GraphQL selection that feeds it (three levels):

```graphql
fragment RippleMenuItemFields on MenuItem { id title url }
query RippleMenu($handle: String!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  menu(handle: $handle) {
    id
    items {
      ...RippleMenuItemFields
      items {
        ...RippleMenuItemFields
        items { ...RippleMenuItemFields }
      }
    }
  }
}
```

UNVERIFIED: that mock.shop serves the `menu` query (mock.shop is blocked from the environment this document was written in). `toRippleMenu(null, ...)` returns an empty menu, and every chrome component renders a valid empty state for it (stated per component).

### 1.3 The `shop` resource

Header, Footer and the blueprints need the shop name, home URL and logo. This is an addition to the resource props of ledger section 6.4 (Ledger issues, item 2).

```ts
export interface RippleShop {
  name: string;
  /** Home URL, for example "/" or "/fr-ca". */
  url: string;
  logo: RippleImage | null; // RippleImage: 05-commerce.md section 11.1
}
```

| Field | Storefront API source | Liquid |
|---|---|---|
| `name` | `shop.name` | `shop.name` |
| `url` | `requestContext.locale.pathPrefix \|\| "/"` (`hydrogen/packages/hydrogen/skills/hydrogen-markets/SKILL.md`) | `routes.root_url` |
| `logo` | `shop.brand.logo.image { url altText width height }` (UNVERIFIED against the schema in this session) | `shop.brand.logo` (`ripple/theme/blocks/logo.liquid`) |

On Liquid there is no `shop` param: block and snippet files read the global `shop` and `routes` objects (rule L-5 of `06-bindings.md` forbids a param named after a global the file reads). The `shop` prop therefore has `hosts: ["html", "react", "remix"]` in the manifest.

### 1.4 The `strings` prop

Components in this document print strings themselves (labels of controls they author). Every such string is a locale key `ripple.<component id>.<key>` (D-066).

- Liquid: `{{ 'ripple.<component id>.<key>' | t }}`.
- TSX hosts: the English default is a literal in the binding. A component that prints MORE than one string of its own takes one optional prop `strings` (type `object`, hosts `react` and `remix`): a partial map from the camelCase form of `<key>` to the replacement text. A component that prints exactly one string, and that string is the root's accessible name, uses `ariaLabel` instead and has no `strings` prop.
- A string with a placeholder is written `{{ name }}` in the locale file. TSX bindings replace placeholders with `text.replace("{{ name }}", value)`.

This prop is an addition to ledger section 6 (Ledger issues, item 3).

### 1.5 Ids fixed by convention

These ids are the defaults used by the `layout` blueprint and by `CommerceOptions` (`05-commerce.md` section 4.2). A project MAY change them, and MUST then pass the new value to every prop that references it.

| Id | Element | Referenced by |
|---|---|---|
| `main` | `<main>` of the layout | SkipLink `href="#main"` |
| `main-nav` | NavigationMenu root | Header prop `navigationMenu` |
| `mobile-nav` | MobileNav `<dialog>` | Header prop `mobileNav` |
| `footer-menu` | the Footer's LinkList `<nav>` | Header prop `linkList` (the no-JS target of the menu opener, D-009) |
| `cart-drawer` | CartDrawer `<dialog>` | Header prop `cartDrawer`; `CommerceOptions.cartDrawer` |
| `search-dialog` | the search Dialog `<dialog>` | Header prop `searchDialog` |
| `predictive-search` | PredictiveSearch root | none |
| `footer-locale` | LocaleSelector popover panel in the footer | none |
| `newsletter` | NewsletterForm `<form>` | none |

### 1.6 Fixture resources

Fixture records reference shared resources by name (`{ "$resource": "<name>" }`, `02-html-contract.md` section 11.2). This document adds these; `13-testing.md` owns the loader. Each exists in two forms with equal content: a JSON object for TSX hosts and a drop stand-in for the Liquid shim.

`menu.main`:

```json
{
  "id": "gid://shopify/Menu/1",
  "items": [
    {
      "id": "gid://shopify/MenuItem/1", "title": "Shop", "url": "/collections/all", "current": true,
      "items": [
        { "id": "gid://shopify/MenuItem/11", "title": "Shirts", "url": "/collections/shirts", "current": false, "items": [] },
        { "id": "gid://shopify/MenuItem/12", "title": "Socks", "url": "/collections/socks", "current": false, "items": [] }
      ]
    },
    { "id": "gid://shopify/MenuItem/2", "title": "About", "url": "/pages/about", "current": false, "items": [] }
  ]
}
```

`menu.deep` (three levels and a group item without URL):

```json
{
  "id": "gid://shopify/Menu/2",
  "items": [
    {
      "id": "gid://shopify/MenuItem/3", "title": "Clothing", "url": null, "current": false,
      "items": [
        {
          "id": "gid://shopify/MenuItem/31", "title": "Tops", "url": "/collections/tops", "current": false,
          "items": [
            { "id": "gid://shopify/MenuItem/311", "title": "Shirts", "url": "/collections/shirts", "current": true, "items": [] }
          ]
        }
      ]
    }
  ]
}
```

`menu.footer`:

```json
{
  "id": "gid://shopify/Menu/3",
  "items": [
    { "id": "gid://shopify/MenuItem/4", "title": "Search", "url": "/search", "current": false, "items": [] },
    { "id": "gid://shopify/MenuItem/5", "title": "Contact", "url": "/pages/contact", "current": false, "items": [] }
  ]
}
```

`menu.empty`: `{ "id": "empty", "items": [] }`.

`shop.basic`: `{ "name": "Mock Shop", "url": "/", "logo": null }`.

`shop.logo`: `{ "name": "Mock Shop", "url": "/", "logo": { "url": "https://cdn.shopify.com/s/files/1/0000/0001/files/logo.png", "altText": null, "width": 400, "height": 100 } }`.

`locale.multi` (TSX form; the Liquid form is a `localization` drop stand-in with the same data, language codes in the Liquid spelling `en`, `fr`):

```json
{
  "countries": [
    { "code": "CA", "name": "Canada", "currency": "CAD $", "current": true },
    { "code": "US", "name": "United States", "currency": "USD $", "current": false }
  ],
  "languages": [
    { "code": "EN", "name": "English", "current": true },
    { "code": "FR", "name": "français", "current": false }
  ]
}
```

---

## Header

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
| `cart` | none (reads `cart`) | object | `RippleCart` (`05-commerce.md` 11.1) | none | no | no | default body: passed to CartLink |
| `navigationMenu` | `navigation_menu` | id | any id | `main-nav` | no | no | default body: `id` of the NavigationMenu |
| `linkList` | `link_list` | id | any id | `footer-menu` | no | no | default body: `href="#<value>"` on the menu opener |
| `mobileNav` | `mobile_nav` | id | id of a MobileNav | none | no | no | default body: `data-rp-open` on the menu opener; omitted when unset |
| `cartDrawer` | `cart_drawer` | id | id of a CartDrawer | none | no | no | default body: passed to CartLink; omitted when unset |
| `searchDialog` | `search_dialog` | id | id of a Dialog | none | no | no | default body: `data-rp-open` on the search link; omitted when unset |
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
      <a class="rp-icon-button" href="#footer-menu" data-rp-open="mobile-nav" data-variant="ghost" data-size="md" data-hidden="lg:true" aria-label="Menu"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></a>
      <a class="rp-logo" href="/" data-size="md">Mock Shop</a>
    </div>
    <div class="rp-header-center" data-hidden="true lg:false">
      <rp-navigation-menu class="rp-navigation-menu" data-slot="rp-navigation-menu" id="main-nav">
        <nav aria-label="Main">
          <ul class="rp-navigation-menu-list">
            <li class="rp-navigation-menu-item" data-rp-part="item">
              <a class="rp-navigation-menu-link" href="/collections/all" aria-current="page">Shop</a>
              <button type="button" class="rp-navigation-menu-trigger" popovertarget="main-nav-item-1" aria-label="Shop submenu"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
              <div id="main-nav-item-1" popover class="rp-navigation-menu-content">
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
      <a class="rp-icon-button" href="/search" data-rp-open="search-dialog" data-variant="ghost" data-size="md" aria-label="Search"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5"/></svg></a>
      <a class="rp-account-link" href="/account" data-icon-only=""><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0"/></svg><span class="rp-account-link-label">Account</span></a>
      <rp-cart class="rp-cart-link" data-slot="rp-cart"><a class="rp-icon-button" href="/cart" data-rp-open="cart-drawer" data-variant="ghost" data-size="md" aria-label="Cart"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2"/></svg><span class="rp-cart-link-count" data-rp-part="count" hidden>0</span></a></rp-cart>
    </div>
  </div>
</header>
```

Fixture `default-body-plain` (`menu: menu.empty`, `shop: shop.basic`; no overlay ids): as `default-body` without the three `data-rp-open` attributes and without the `center` part.

Fixture `class` (`class: "custom-a custom-b"`, children as `default`): root is `<header class="rp-header custom-a custom-b">`.

Fixture `invalid-enum-falls-back`: not applicable (`scheme` has no default; an unknown value prints no `data-scheme`). The fixture is named `unknown-scheme` and its reference HTML equals `default`.

Host-owned regions and masks: none of Header's own. The CartLink subtree carries the masks of `11-components-commerce.md` (the `href` of the cart link). The fixtures `default-body` and `default-body-plain` are `generated: "hand"`; `default`, `sticky-scheme`, `class`, `unknown-scheme` are `generated: "hand"` as well, because Header has no contract template (the default body embeds components of kinds `native` and `commerce`).

Kind note: D-006 is applied to the `default` fixture, which has no custom element, so `kind` is `static` as ledger 8.4 states. `dependencies.elements` is empty; `rp-navigation-menu` and `rp-cart` belong to the embedded components (Ledger issues, item 1).

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
- Focus: no focus management. With `sticky`, `base.css` MUST set `scroll-padding-block-start: var(--rp-header-height)` on `html` when a `.rp-header[data-sticky]` exists (`html:has(.rp-header[data-sticky])`), so focused and targeted elements are not hidden under the bar (WCAG 2.2 SC 2.4.11).
- Announcements: None.

| Key | Action |
|---|---|
| Tab | Moves through the links and buttons in DOM order |

### Styling

- File: `components/header/header.css` (layer `rp.components`).
- Tokens used: `--color-background`, `--color-foreground`, `--color-border`, `--container-page`, `--spacing-gutter`, `--spacing`, `--rp-z-sticky`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-header-height` | `4rem` | Minimum block size of the inner row |
| `--rp-header-gap` | `calc(var(--spacing) * 4)` | Gap between direct children of `inner` and inside `start`, `end` |
| `--rp-header-border` | `1px solid var(--color-border)` | Block-end border of the root |

| Modifier selector | Sets |
|---|---|
| `.rp-header[data-sticky]` | `position: sticky; inset-block-start: 0; z-index: var(--rp-z-sticky)` (the one modifier that sets properties directly, because position cannot be driven by a custom property) |

Required rules (complete list of declarations the file MUST contain; values MAY be tuned):

```css
@layer rp.components {
  .rp-header {
    --rp-header-height: 4rem;
    --rp-header-gap: calc(var(--spacing) * 4);
    --rp-header-border: 1px solid var(--color-border);
    background: var(--color-background);
    color: var(--color-foreground);
    border-block-end: var(--rp-header-border);
  }
  .rp-header[data-sticky] {
    position: sticky;
    inset-block-start: 0;
    z-index: var(--rp-z-sticky);
  }
  .rp-header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--rp-header-gap);
    min-block-size: var(--rp-header-height);
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

- HTML: copy the `default-body` fixture and replace the embedded subtrees with real data.
- React: `export function Header(props: HeaderProps): JSX.Element`. No hook. `HeaderProps` is the Props table plus `children?: ReactNode`, `className?: string` and rest props (`RestProps<HeaderOwnProps>`). The default body renders `IconButton`, `Icon`, `Logo`, `NavigationMenu`, `AccountLink`, `CartLink` from their own files.
- Remix: same tree; no `data-rmx-*` of its own.
- Liquid: block `header`; the default body lives in `snippets/rp-header.liquid` (file key `snippet`), which renders `rp-icon-button`, `rp-icon`, `rp-logo`, `rp-navigation-menu`, `rp-account-link`, `rp-cart-link`. Schema settings: `scheme` (select). Locale keys: `ripple.header.name`, `ripple.header.menu` ("Menu"), `ripple.header.search` ("Search").

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
  assign menu_icon = ''
  assign search_icon = ''
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
        {%- capture menu_icon -%}{% render 'rp-icon', name: 'menu' %}{%- endcapture -%}
        {%- if mobile_nav != blank -%}
          {%- capture menu_attributes -%}data-rp-open="{{ mobile_nav | escape }}"{%- endcapture -%}
        {%- endif -%}
        {% render 'rp-icon-button', href: menu_href, aria_label: menu_label, hidden: 'lg:true', attributes: menu_attributes, content: menu_icon %}
        {% render 'rp-logo', content: shop.name %}
      </div>
      {%- if menu.links.size > 0 -%}
        <div class="rp-header-center" data-hidden="true lg:false">
          {% render 'rp-navigation-menu', id: navigation_menu, menu: menu %}
        </div>
      {%- endif -%}
      <div class="rp-header-end">
        {%- capture search_icon -%}{% render 'rp-icon', name: 'search' %}{%- endcapture -%}
        {%- if search_dialog != blank -%}
          {%- capture search_attributes -%}data-rp-open="{{ search_dialog | escape }}"{%- endcapture -%}
        {%- endif -%}
        {% render 'rp-icon-button', href: search_url, aria_label: search_label, attributes: search_attributes, content: search_icon %}
        {% render 'rp-account-link', href: account_url, icon_only: true, content: account_label %}
        {% render 'rp-cart-link', drawer: cart_drawer, href: cart_url %}
      </div>
    {%- endif -%}
  </div>
</header>
```

Notes on this snippet: the two `capture` tags that build `menu_attributes` and `search_attributes` and the two that build icon markup stay inside one file and pass a value to a snippet's `attributes` or `content` param; this is the pattern of `06-bindings.md` section 8.7 (a default body renders `rp-*` snippets) and is not a cross-file slot under rule L-7. `data-rp-open` goes through `attributes` because IconButton has no prop for it; the value is escaped here. `shop.name` is escaped by `rp-logo` (Logo's content is text; see Logo, Host notes). The CartLink param names `drawer` and `href` are owned by `11-components-commerce.md`.

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

1. Tier 2: fixtures `default`, `sticky-scheme`, `default-body`, `default-body-plain`, `class`, `unknown-scheme` conform in all four hosts.
2. Tier 3: with `ripple.js` loaded, zero mutations inside `.rp-header` other than `aria-haspopup` and `aria-controls` on `a[data-rp-open]`.
3. Tier 5: at 375 px wide the menu opener is visible and `.rp-header-center` has computed `display: none`; at 1280 px the opposite.
4. Tier 5: with `sticky`, after `window.scrollTo(0, 2000)` the header's `getBoundingClientRect().top` is `0`.
5. Tier 6: with JavaScript disabled, clicking the menu opener changes `location.hash` to `#footer-menu`; clicking the search link navigates to `/search`; clicking the cart link navigates to `/cart`.
6. Tier 5: `.rp-header-inner` has the same inline start and end offsets as a `Container width="page"` on the same page (difference at most 0.5 CSS px).

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/layout/theme.liquid` lines 22 to 122 (header composed with captures; no cart or search link without JS); `ripple/docs/research/base-theme.md` 3.1 items 1, 2, 7 and 3.4; ledger D-009, D-037, D-006.
- UNVERIFIED: `:has()` support at the browser floor for the `scroll-padding` rule (Chrome 105, Safari 15.4, Firefox 121 by general knowledge; Firefox 128 is the floor, so it holds if that knowledge is right). SPIKE-06.

### Fallback (SPIKE-nn)

None.

---

## Footer

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
- Liquid: block `footer`; default body in `snippets/rp-footer.liquid`, which renders `rp-link-list`. The policies menu is built from `shop.policies` by passing `links: shop.policies` to `rp-link-list` (see LinkList, Host notes: its loop reads `.title` and `.url` of each entry, which both a link drop and a policy drop have). Schema settings: `scheme` (select). Locale keys: `ripple.footer.name`, `ripple.footer.menu` ("Footer"), `ripple.footer.policies` ("Policies"), `ripple.footer.copyright` ("© {{ year }} {{ name }}"). This component adds the filter `date` to the Liquid subset of `06-bindings.md` rule L-13 (used once: `'now' | date: '%Y'`); the shim MUST implement it (section 3, X-6).

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
-%}
{%- if menu.links.size > 0 -%}
  {% render 'rp-link-list', id: link_list, menu: menu, aria_label: menu_label, orientation: 'vertical' %}
{%- endif -%}
<div class="rp-footer-bottom">
  <p class="rp-footer-copyright">{{ 'ripple.footer.copyright' | t: year: year, name: shop.name | escape }}</p>
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

1. Tier 2: fixtures `default`, `default-body`, `policies`, `scheme`, `class` conform in all four hosts.
2. Tier 3: zero mutations inside `.rp-footer` when `ripple.js` loads.
3. Tier 6: with JavaScript disabled, on the `layout` blueprint, following the Header's menu opener scrolls `#footer-menu` into the viewport, and every top-level item of the main menu that has a URL is present as a link in the document.
4. Tier 5: `.rp-footer-inner` has the same inline offsets as a `Container width="page"` (difference at most 0.5 CSS px).

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/layout/theme.liquid` lines 351 to 387 (footer body: menu, copyright with `'now' | date: '%Y'`, `shop.policies`); `ripple/theme/blocks/footer.liquid`; ledger D-009 (footer menu anchor), D-017.
- UNVERIFIED: that a policy drop exposes `.title` and `.url` exactly as a link drop does on the live platform (the base theme reads `policy.url` and `policy.title` in `ripple/theme/layout/theme.liquid`, lines 366 to 376; tier 8 confirms).

### Fallback (SPIKE-nn)

None.

---
## AnnouncementBar

| Field | Value |
|---|---|
| Id | `announcement-bar` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none |
| Root element and class | `div` `.rp-announcement-bar` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M4 |

### Purpose

A full-width band above the Header for one short message (shipping threshold, sale notice), optionally containing a Link.

- Use when: one short site-wide message must be visible on every page.
- Do not use when: the message is the result of an action (use Banner or FormMessage) or is transient (use Toast).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `AnnouncementBar` | `blocks/announcement-bar.liquid` | `div` | `rp-announcement-bar` | none | yes | none |
| inner | none (printed by root) | same file | `p` | `rp-announcement-bar-inner` | none | yes | none |

Nesting rules: `inner` is the only child of root. Children MUST be phrasing content (text, Link, `<strong>`, `<bdi>`); they MUST NOT contain block elements, because `inner` is a `<p>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `scheme` | `scheme` | enum | `light`, `dark`, project scheme names | none | no | no | `data-scheme` on root; omitted when unset |
| `ariaLabel` | `aria_label` | string | any text | `{ "t": "ripple.announcement-bar.label" }` ("Announcement") | no | no | `aria-label` on root |

### Content model

`text` - phrasing content; REQUIRED (an empty bar MUST NOT be rendered; the caller omits the component when there is no message).

### HTML contract

Fixture `default` (children: `Free shipping over $50`):

```html
<div class="rp-announcement-bar" role="region" aria-label="Announcement"><p class="rp-announcement-bar-inner">Free shipping over $50</p></div>
```

Fixture `scheme` (`scheme: "dark"`):

```html
<div class="rp-announcement-bar" role="region" aria-label="Announcement" data-scheme="dark"><p class="rp-announcement-bar-inner">Free shipping over $50</p></div>
```

Fixture `escaping` (`ariaLabel: "Say \"hi\" & <go>"`):

```html
<div class="rp-announcement-bar" role="region" aria-label="Say &quot;hi&quot; &amp; &lt;go&gt;"><p class="rp-announcement-bar-inner">Free shipping over $50</p></div>
```

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-announcement-bar custom-a custom-b`.

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-scheme` | root | server | prop `scheme` is set | the scheme name or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None. There is no dismiss control in V1 (a dismiss button would do nothing without JS and its state would need storage).

### Behaviour without JavaScript

Identical.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| none | none | none | none | none |

### Accessibility

- Pattern: a named `region` landmark (`role="region"` with `aria-label`); `checkPattern`: none. `role="region"` is listed here as required by rule A-1 of `02-html-contract.md`.
- Accessible name: `aria-label` from `ariaLabel`; always printed.
- Focus: none.
- Announcements: None. It is not a live region.

| Key | Action |
|---|---|
| Tab | Moves to a Link inside the message, when there is one |

### Styling

- File: `components/announcement-bar/announcement-bar.css` (layer `rp.components`).
- Tokens used: `--color-primary`, `--color-primary-foreground`, `--spacing`, `--spacing-gutter`, `--text-sm`, `--container-page`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-announcement-bar-padding-block` | `calc(var(--spacing) * 2)` | Block padding |
| `--_bg` | `var(--color-primary)` | Background (tone slot) |
| `--_fg` | `var(--color-primary-foreground)` | Text colour (tone slot) |
| `--_border` | `transparent` | Border colour (tone slot) |

| Modifier selector | Sets |
|---|---|
| `.rp-announcement-bar[data-scheme]` | `--_bg: var(--color-background); --_fg: var(--color-foreground)` (a scheme supplies its own surface) |

Required rules: root `background: var(--_bg); color: var(--_fg); border-block-end: 1px solid var(--_border)`; `inner` `margin: 0 auto; max-inline-size: var(--container-page); padding: var(--rp-announcement-bar-padding-block) var(--spacing-gutter); text-align: center; font-size: var(--text-sm)`. Links inside inherit colour and are underlined.

### Host notes

- HTML: None.
- React: `export function AnnouncementBar(props: AnnouncementBarProps): JSX.Element`. Generated from the contract template (kind `static`).
- Remix: None.
- Liquid: block `announcement-bar`. Schema settings: `scheme` (select). Locale keys: `ripple.announcement-bar.name`, `ripple.announcement-bar.label`.

```tsx
<AnnouncementBar>Free shipping over $50</AnnouncementBar>
```

```liquid
{% block 'announcement-bar' %}{{ 'announcement.message' | t }}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`. Actions: none. Confirm: none. Secret: none.

### Checker rules

- RP113 structure rule `announcement-bar-not-empty`: `.rp-announcement-bar-inner` MUST have non-whitespace text.

### Acceptance tests

1. Tier 2: fixtures `default`, `scheme`, `escaping`, `class` conform in all four hosts.
2. Tier 1: `pnpm gen --check` regenerates the four bindings from the template with no diff.
3. Tier 5: the root spans the full viewport width at 375 px and 1280 px; text is centred.

### Evidence and UNVERIFIED

- Evidence: ledger 8.4 and 6.3 (`scheme` accepted by AnnouncementBar); `02-html-contract.md` A-1.
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---

## NavigationMenu

| Field | Value |
|---|---|
| Id | `navigation-menu` |
| Kind | `native` |
| Category | `chrome` |
| Custom elements | `rp-navigation-menu` |
| Root element and class | `rp-navigation-menu` `.rp-navigation-menu` |
| Liquid tier | `resource` |
| No-JS level | `degraded` |
| Requires `id` | yes |
| Depends on | `icon` |
| Milestone | M4 |

### Purpose

The desktop primary navigation: a row of top-level links; an item with children also has a disclosure button that opens a native `popover` panel listing the children (and grandchildren).

- Use when: rendering the store's main menu in the Header at widths of `lg` and above.
- Do not use when: rendering a simple list of links (use LinkList) or the small-screen menu (use MobileNav).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `NavigationMenu` | `blocks/navigation-menu.liquid` | `rp-navigation-menu` | `rp-navigation-menu` | `data-slot="rp-navigation-menu"` | yes | `<id>` |
| nav | none (printed by root) | same file | `nav` | none | none | yes | none |
| list | none (printed by root) | same file | `ul` | `rp-navigation-menu-list` | none | yes | none |
| item | none (default body) | same file | `li` | `rp-navigation-menu-item` | `data-rp-part="item"` | one per top-level menu item | none |
| link | none (default body) | same file | `a` | `rp-navigation-menu-link` | none | when the item has a URL | none |
| trigger | none (default body) | same file | `button` | `rp-navigation-menu-trigger` | none | when the item has children | none |
| content | none (default body) | same file | `div` | `rp-navigation-menu-content` | none | when the item has children | `<id>-item-<n>` |
| sublist | none (default body) | same file | `ul` | `rp-navigation-menu-sublist` | none | inside `content`; nested once for grandchildren | none |
| subitem | none (default body) | same file | `li` | `rp-navigation-menu-subitem` | none | one per child and per grandchild | none |
| sublink | none (default body) | same file | `a` or `span` | `rp-navigation-menu-sublink` | none | one per subitem | none |

Nesting rules: root contains exactly one `nav`, which contains exactly one `list`. Each `item` is a direct child of `list`. Inside an `item` the order is: `link` (if any), `trigger` (if any), `content` (if any). `content` MUST be inside its `item` (hover intent depends on it, `04-elements.md` 9.3). `<n>` is the 1-based position of the item among the top-level items (it satisfies rule N-10 of `02-html-contract.md`). The `item` part is `multiple`. A `subitem` whose menu item has no URL prints `<span class="rp-navigation-menu-sublink">` instead of `<a>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | yes | no | `id` on root; prefix of panel ids |
| `menu` | `menu` | object | `RippleMenu` (1.2); Liquid: a linklist drop | none | yes (unless children are supplied) | no | default body |
| `ariaLabel` | `aria_label` | string | any text | `{ "t": "ripple.navigation-menu.label" }` ("Main") | no | no | `aria-label` on `nav` |
| `strings` | none | object | key `submenu` | `"{{ title }} submenu"` | no | no | TSX hosts only |

### Content model

`flow`, restricted - the default body is one `item` per top-level entry of `menu`. Children, when supplied, replace the default body and MUST be `<li class="rp-navigation-menu-item" data-rp-part="item">` elements written to this contract (escape hatch; plain HTML). With an empty `menu` and no children the component prints the root, `nav` and an empty `list`.

### HTML contract

Fixture `default` (`id: "main-nav"`, `menu: menu.main`):

```html
<rp-navigation-menu class="rp-navigation-menu" data-slot="rp-navigation-menu" id="main-nav">
  <nav aria-label="Main">
    <ul class="rp-navigation-menu-list">
      <li class="rp-navigation-menu-item" data-rp-part="item">
        <a class="rp-navigation-menu-link" href="/collections/all" aria-current="page">Shop</a>
        <button type="button" class="rp-navigation-menu-trigger" popovertarget="main-nav-item-1" aria-label="Shop submenu"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
        <div id="main-nav-item-1" popover class="rp-navigation-menu-content">
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
```

Fixture `deep` (`id: "main-nav"`, `menu: menu.deep`): a group item without URL (the trigger carries the visible title and no `aria-label`) and a nested `sublist` for grandchildren:

```html
<rp-navigation-menu class="rp-navigation-menu" data-slot="rp-navigation-menu" id="main-nav">
  <nav aria-label="Main">
    <ul class="rp-navigation-menu-list">
      <li class="rp-navigation-menu-item" data-rp-part="item">
        <button type="button" class="rp-navigation-menu-trigger" popovertarget="main-nav-item-1">Clothing<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
        <div id="main-nav-item-1" popover class="rp-navigation-menu-content">
          <ul class="rp-navigation-menu-sublist">
            <li class="rp-navigation-menu-subitem">
              <a class="rp-navigation-menu-sublink" href="/collections/tops">Tops</a>
              <ul class="rp-navigation-menu-sublist">
                <li class="rp-navigation-menu-subitem"><a class="rp-navigation-menu-sublink" href="/collections/shirts" aria-current="page">Shirts</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </nav>
</rp-navigation-menu>
```

Fixture `empty` (`id: "main-nav"`, `menu: menu.empty`):

```html
<rp-navigation-menu class="rp-navigation-menu" data-slot="rp-navigation-menu" id="main-nav"><nav aria-label="Main"><ul class="rp-navigation-menu-list"></ul></nav></rp-navigation-menu>
```

Fixture `escaping` (`ariaLabel: "Say \"hi\" & <go>"`, `menu: menu.empty`): `nav` has `aria-label="Say &quot;hi&quot; &amp; &lt;go&gt;"`.

Fixture `class` (`class: "custom-a custom-b"`, `menu: menu.empty`): root class is `rp-navigation-menu custom-a custom-b`.

Host-owned regions and masks: None.

This contract replaces the example of `04-elements.md` section 10.15 in two points, as that section allows: panel ids are `<id>-item-<n>` (not `<id>-content-<handle>`), and the panel's list uses NavigationMenu's own part classes (not `rp-link-list` / `rp-link`). The element code of `04-elements.md` 9.3 depends on neither.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `aria-current="page"` | `link`, `sublink` | server | the item's `current` is true | `page` or absent |
| popover open state (no attribute; `:popover-open`) | `content` | browser | the trigger is pressed, or `rp-navigation-menu` calls `showPopover()` / `hidePopover()` | closed |

The element writes no attribute (`04-elements.md` 9.3 item 4). The server MUST NOT print `aria-expanded`, `hidden` or `popover="manual"`.

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

Owned by `04-elements.md` section 9.3; summary of the testable statements:

1. Pressing a `trigger` toggles its `content` panel (native). Opening one panel closes any other open panel of the page's auto popovers (native).
2. A mouse pointer resting on an `item` that has a `content` opens it after 120 ms; leaving every item closes all panels of this menu after 250 ms. Touch and pen pointers do not open on hover.
3. With focus on a top-level `link` or `trigger`: ArrowRight (ArrowLeft in RTL) focuses the next item's first link or button, wrapping; ArrowLeft (ArrowRight in RTL) the previous; Home the first; End the last; each closes open panels first. ArrowDown on an item with a panel opens it and focuses its first link.
4. Escape closes the open panel and returns focus to its trigger (native).
5. No event is dispatched.

### Behaviour without JavaScript

Every top-level link navigates. Every `trigger` opens its panel natively; Escape and an outside press close it. Missing without JavaScript: hover intent and arrow-key movement between top-level items. That is why the level is `degraded` (D-005 lists NavigationMenu under allowed `degraded`). No control is hidden; the triggers carry no `data-rp-js`. In a browser without the popover API the panels are in-flow content and the triggers do nothing (`04-elements.md` ledger issue L-8); all links stay reachable.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| method | `close` | `rp-navigation-menu` (primitive `api`) | none; closes every open panel of this menu | none |

### Accessibility

- Pattern: APG "Disclosure Navigation Menu" (links plus disclosure buttons; NOT `role="menubar"`); `checkPattern`: none.
- Accessible name: `nav` is named by `ariaLabel`. A `trigger` next to a `link` is named by `ripple.navigation-menu.submenu` with `{{ title }}` replaced by the item title ("Shop submenu"). A `trigger` of an item without URL is named by its text.
- Focus: opening by button keeps focus on the button (native); the panel's links follow the button in tab order because `content` follows `trigger` in the DOM. Closing by Escape returns focus to the trigger (native).
- Announcements: None.

| Key | Action |
|---|---|
| Tab / Shift+Tab | Next / previous link or button; all stay in the tab sequence |
| Enter, Space on a trigger | Toggle its panel (native) |
| Escape | Close the open panel (native) |
| ArrowRight / ArrowLeft | Next / previous top-level item (reversed in RTL); with JavaScript |
| Home / End | First / last top-level item; with JavaScript |
| ArrowDown | Open the panel and focus its first link; with JavaScript |

### Styling

- File: `components/navigation-menu/navigation-menu.css` (layer `rp.components`).
- Tokens used: `--color-foreground`, `--color-muted-foreground`, `--color-popover`, `--color-popover-foreground`, `--color-border`, `--color-accent`, `--color-ring`, `--radius-surface`, `--radius-control`, `--shadow-md`, `--spacing`, `--spacing-control-md`, `--text-sm`, `--rp-duration-fast`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-navigation-menu-gap` | `calc(var(--spacing) * 6)` | Gap between top-level items |
| `--rp-navigation-menu-content-padding` | `calc(var(--spacing) * 4)` | Padding of a panel |
| `--rp-navigation-menu-content-min-width` | `14rem` | Minimum inline size of a panel |
| `--rp-navigation-menu-columns` | `1` | Number of columns of the first-level `sublist` in a panel |

| Modifier selector | Sets |
|---|---|
| `.rp-navigation-menu-link[aria-current="page"]`, `.rp-navigation-menu-sublink[aria-current="page"]` | `--_fg: var(--color-foreground)`; adds an underline through `text-decoration-line` driven by `--_decoration` |

Required rules:

1. `list`: `display: flex; align-items: center; gap: var(--rp-navigation-menu-gap); margin: 0; padding: 0; list-style: none`.
2. `item`: `display: flex; align-items: center; gap: calc(var(--spacing) * 1); position: relative`.
3. `link`, `trigger`: `min-block-size: var(--spacing-control-md)`; `trigger` with only an icon has `min-inline-size: 1.5rem` (target size 24 px, D-066). Focus ring `outline: 2px solid var(--color-ring)` on `:focus-visible`.
4. `content`: MUST NOT set `display` except under `:popover-open` (`04-elements.md` requirement C-5). Under `:popover-open`: `display: block`. Always: `margin: 0; inset: auto; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-popover); color: var(--color-popover-foreground); box-shadow: var(--shadow-md); padding: var(--rp-navigation-menu-content-padding); min-inline-size: var(--rp-navigation-menu-content-min-width)`.
5. Position, inside `@supports (inset-block-start: anchor(end))`: `position: fixed; inset-block-start: anchor(end); inset-inline-start: anchor(start); position-try-fallbacks: flip-inline`. The implicit anchor of a popover opened by `popovertarget` is its invoker button. Outside `@supports`: `position: fixed; inset-block-start: var(--rp-header-height, 4rem); inset-inline: var(--spacing-gutter); ` (a panel spanning the page width under the header).
6. First-level `sublist` inside `content`: `display: grid; grid-template-columns: repeat(var(--rp-navigation-menu-columns), minmax(0, 1fr)); gap: calc(var(--spacing) * 2) calc(var(--spacing) * 6); margin: 0; padding: 0; list-style: none`. Nested `sublist`: `display: block; padding-inline-start: 0; margin-block-start: calc(var(--spacing) * 1)`; its `sublink`s use `--color-muted-foreground` and `--text-sm`.
7. Hover styles inside `@media (hover: hover)`; the open and close transition inside `@media (prefers-reduced-motion: no-preference)` using `--rp-duration-fast`.

### Host notes

- HTML: copy the fixture; one `<li>` per item.
- React: `export function NavigationMenu(props: NavigationMenuProps): JSX.Element`. No hook (the element has no event and no property). `suppressHydrationWarning` on `<rp-navigation-menu>` (D-033). Attributes on the custom element are lowercase (`class`).
- Remix: prints `data-rmx-key={id}` on the root. No `data-rmx-preserve-attrs` (the element writes no attribute; popover open state is preserved by the Remix diff natively, `ripple/docs/research/remix-3.md`).
- Liquid: block `navigation-menu`; markup in `snippets/rp-navigation-menu.liquid` (embedded by Header). No schema settings. Locale keys: `ripple.navigation-menu.name`, `ripple.navigation-menu.label` ("Main"), `ripple.navigation-menu.submenu` ("{{ title }} submenu").

```tsx
<NavigationMenu id="main-nav" menu={menu} />
```

```liquid
{% block 'navigation-menu', id: 'main-nav', menu: linklists['main-menu'] %}{% endblock %}
```

`components/navigation-menu/liquid/snippets/rp-navigation-menu.liquid` (complete body after the `{% doc %}` header):

```liquid
{%- liquid
  if aria_label == blank
    assign aria_label = 'ripple.navigation-menu.label' | t
  endif
-%}
<rp-navigation-menu
  class="rp-navigation-menu {{ class | escape }}"
  data-slot="rp-navigation-menu"
  id="{{ id | escape }}"
  {% if span != blank %}data-span="{{ span | escape }}"{% endif %}
  {% if hidden != blank %}data-hidden="{{ hidden | escape }}"{% endif %}
  {{ attributes }}
>
  <nav aria-label="{{ aria_label | escape }}">
    <ul class="rp-navigation-menu-list">
      {%- if content != blank -%}
        {{ content }}
      {%- else -%}
        {%- for link in menu.links -%}
          {%- liquid
            assign panel_id = id | append: '-item-' | append: forloop.index
            assign has_url = true
            if link.url == blank or link.url == '#'
              assign has_url = false
            endif
          -%}
          <li class="rp-navigation-menu-item" data-rp-part="item">
            {%- if has_url == true -%}
              <a class="rp-navigation-menu-link" href="{{ link.url | escape }}"{% if link.current == true %} aria-current="page"{% endif %}>{{ link.title | escape }}</a>
            {%- endif -%}
            {%- if link.links.size > 0 -%}
              {%- if has_url == true -%}
                {%- assign submenu_label = 'ripple.navigation-menu.submenu' | t: title: link.title -%}
                <button type="button" class="rp-navigation-menu-trigger" popovertarget="{{ panel_id | escape }}" aria-label="{{ submenu_label | escape }}">{% render 'rp-icon', name: 'chevron-down' %}</button>
              {%- else -%}
                <button type="button" class="rp-navigation-menu-trigger" popovertarget="{{ panel_id | escape }}">{{ link.title | escape }}{% render 'rp-icon', name: 'chevron-down' %}</button>
              {%- endif -%}
              <div id="{{ panel_id | escape }}" popover class="rp-navigation-menu-content">
                <ul class="rp-navigation-menu-sublist">
                  {%- for child in link.links -%}
                    <li class="rp-navigation-menu-subitem">
                      {%- if child.url == blank or child.url == '#' -%}
                        <span class="rp-navigation-menu-sublink">{{ child.title | escape }}</span>
                      {%- else -%}
                        <a class="rp-navigation-menu-sublink" href="{{ child.url | escape }}"{% if child.current == true %} aria-current="page"{% endif %}>{{ child.title | escape }}</a>
                      {%- endif -%}
                      {%- if child.links.size > 0 -%}
                        <ul class="rp-navigation-menu-sublist">
                          {%- for grandchild in child.links -%}
                            <li class="rp-navigation-menu-subitem">
                              {%- if grandchild.url == blank or grandchild.url == '#' -%}
                                <span class="rp-navigation-menu-sublink">{{ grandchild.title | escape }}</span>
                              {%- else -%}
                                <a class="rp-navigation-menu-sublink" href="{{ grandchild.url | escape }}"{% if grandchild.current == true %} aria-current="page"{% endif %}>{{ grandchild.title | escape }}</a>
                              {%- endif -%}
                            </li>
                          {%- endfor -%}
                        </ul>
                      {%- endif -%}
                    </li>
                  {%- endfor -%}
                </ul>
              </div>
            {%- endif -%}
          </li>
        {%- endfor -%}
      {%- endif -%}
    </ul>
  </nav>
</rp-navigation-menu>
```

An item with no URL and no children prints an empty `<li>`; menus SHOULD NOT contain such items, and TSX bindings MUST skip them (the Liquid snippet prints them to keep `<n>` equal to `forloop.index`; TSX bindings compute `<n>` from the item's index in `menu.items`, counting skipped items, so both hosts derive the same ids).

### Commerce

None.

### Agent surface

`bridge`; `agent.component`: `rp-navigation-menu`. Actions: `close`. Confirm: none. Secret: none. Links and triggers are also in the accessibility tree.

### Checker rules

- RP113 structure rules: `navigation-menu-item-in-list` (every `[data-rp-part="item"]` inside the root is a child of `.rp-navigation-menu-list`); `navigation-menu-content-in-item` (every `.rp-navigation-menu-content` has an ancestor `.rp-navigation-menu-item`); `navigation-menu-trigger-targets-content` (every `.rp-navigation-menu-trigger[popovertarget]` names the id of a `.rp-navigation-menu-content` in the same item).
- RP114 (ids unique and resolving), RP118 (no `aria-expanded` stand-ins such as `data-state`), RP201 (trigger names), RP204 (no popover inside a link or button).

### Acceptance tests

1. Tier 2: fixtures `default`, `deep`, `empty`, `escaping`, `class` conform in all four hosts.
2. Tier 3: zero mutations inside the root when `ripple.js` loads.
3. Tier 5: hovering the first item with a mouse for 200 ms makes `#main-nav-item-1` match `:popover-open`; moving the pointer out of the menu for 400 ms closes it.
4. Tier 5: with focus on the first top-level link, ArrowRight moves focus to the second item's link; End moves to the last; Home to the first; in a `dir="rtl"` document ArrowLeft moves forward.
5. Tier 5: ArrowDown on the first item opens its panel and focuses `a[href="/collections/shirts"]`; Escape closes the panel and focus is on the trigger.
6. Tier 6: with JavaScript disabled, pressing the trigger opens the panel (Chromium), and clicking `Shop` navigates to `/collections/all`.
7. Tier 4: Remix morph navigation between two pages that both render the menu keeps an open panel open and reports no console error.
8. Tier 5: every `trigger` and `link` box is at least 24 by 24 CSS px.
9. Tier 9: tests 3 to 6 pass in WebKit and Gecko, or the SPIKE-07 fallback is activated.

### Evidence and UNVERIFIED

- Evidence: `04-elements.md` sections 9.3 and 10.15 (element code and markup rules); ledger D-017; `ripple/theme/blocks/main-menu.liquid`, `ripple/theme/assets/s-nav-dropdown.js` (the behaviour being replaced); `uisdk/packages/web/src/define-element.ts` (root-only parts, SPIKE-04).
- UNVERIFIED: usability of `popover` panels with hover intent for a mega menu, nested focus order, hover gaps, Remix morph (SPIKE-07); CSS anchor positioning with the implicit invoker anchor outside Chromium (SPIKE-06); the `popover` attribute below Chrome 114 and Safari 17 (`04-elements.md` L-8).

### Fallback (SPIKE-07)

Activated only if SPIKE-07 rejects the popover design. The complete alternative:

Contract changes (everything not listed is unchanged): `content` loses the `popover` attribute; `trigger` loses `popovertarget` and gains `aria-expanded="false"`, `aria-controls="<id>-item-<n>"` and `data-rp-part="trigger"`.

```html
<li class="rp-navigation-menu-item" data-rp-part="item">
  <a class="rp-navigation-menu-link" href="/collections/all" aria-current="page">Shop</a>
  <button type="button" class="rp-navigation-menu-trigger" data-rp-part="trigger" data-rp-js="inflow" aria-expanded="false" aria-controls="main-nav-item-1" aria-label="Shop submenu"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
  <div id="main-nav-item-1" class="rp-navigation-menu-content">
    <ul class="rp-navigation-menu-sublist">
      <li class="rp-navigation-menu-subitem"><a class="rp-navigation-menu-sublink" href="/collections/shirts">Shirts</a></li>
    </ul>
  </div>
</li>
```

CSS: `.rp-navigation-menu-content { display: none; position: absolute; inset-block-start: 100%; inset-inline-start: 0; z-index: var(--rp-z-overlay); }` and it is `display: block` when any of these match: `.rp-navigation-menu-item:hover > .rp-navigation-menu-content` (inside `@media (hover: hover)`), `.rp-navigation-menu-item:focus-within > .rp-navigation-menu-content`, `.rp-navigation-menu-trigger[aria-expanded="true"] + .rp-navigation-menu-content`.

Behaviour: `rp-navigation-menu` toggles `aria-expanded` between `"true"` and `"false"` on a `click` of a `[data-rp-part="trigger"]`, sets every other trigger of the menu to `"false"`, sets all to `"false"` on Escape (and focuses the trigger that was expanded) and on `focusout` leaving the root. Arrow keys as in the default path. `state[]` gains `{ on: "trigger", reflects: ["aria-expanded"] }`; Remix prints `data-rmx-preserve-attrs="aria-expanded"` on triggers; React prints `aria-expanded="false"` once and `suppressHydrationWarning`. The pe-2 lint is satisfied by adding `data-rp-js="inflow"` to the trigger (it is JS-only in this variant); without JavaScript the panel still opens on hover and on focus inside the item. Fixture lint `a-4` does not apply (the button has no `popovertarget`).

---

## MobileNav

| Field | Value |
|---|---|
| Id | `mobile-nav` |
| Kind | `native` |
| Category | `chrome` |
| Custom elements | `rp-dialog` |
| Root element and class | `rp-dialog` `.rp-mobile-nav` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes |
| Depends on | `icon-button`, `icon` |
| Milestone | M4 |

### Purpose

The small-screen navigation: a drawer (native modal `<dialog>` inside `rp-dialog`, D-008) that lists the whole menu, with nested `<details>` for sublevels. Its opener is a link to the footer menu (D-009), so the menu is reachable when JavaScript never loads.

- Use when: rendering the store's main menu for widths below `lg`. Render it once, in the `layout` blueprint, outside Header.
- Do not use when: rendering desktop navigation (use NavigationMenu) or any other drawer (use Drawer).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `MobileNav` | `blocks/mobile-nav.liquid` | `rp-dialog` | `rp-mobile-nav` | `data-slot="rp-dialog"` | yes | none (D-008: the id is on `panel`) |
| panel | none (printed by root) | same file | `dialog` | `rp-mobile-nav-panel` | none | yes | `<id>` |
| header | none (printed by root) | same file | `div` | `rp-mobile-nav-header` | none | yes | none |
| title | none (printed by root) | same file | `h2` | `rp-mobile-nav-title` | none | yes | `<id>-title` |
| close | none (printed by root) | same file | `button` (IconButton) | `rp-icon-button` | none | yes | none |
| body | none (printed by root) | same file | `nav` | `rp-mobile-nav-body` | none | yes | none |
| list | none (default body) | same file | `ul` | `rp-mobile-nav-list` | none | yes; nested once per level | none |
| item | none (default body) | same file | `li` | `rp-mobile-nav-item` | none | one per menu item | none |
| link | none (default body) | same file | `a` | `rp-mobile-nav-link` | none | per item with URL | none |
| group | none (default body) | same file | `details` | `rp-mobile-nav-group` | none | per item with children | none |
| trigger | none (default body) | same file | `summary` | `rp-mobile-nav-trigger` | none | one per `group` | none |

Nesting rules: root contains exactly one `panel`. `panel` contains `header` then `body`. `header` contains `title` then `close`. `body` contains one `list`. An item without children is `<li><a class="rp-mobile-nav-link">`. An item with children is `<li><details class="rp-mobile-nav-group"><summary>title + chevron Icon</summary><ul class="rp-mobile-nav-list">...</ul></details></li>`; when that item has a URL, the nested list starts with one extra `item` whose `link` goes to the item's own URL and repeats its title. MobileNav MUST be outside every region (D-046 item 5) and outside Header, `<main>` and Footer. The opener is not a part (D-008 item 2): it is the Header's menu opener, `<a href="#<footer menu id>" data-rp-open="<id>">`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | yes | no | `id` on `panel`; `<id>-title` on `title`; `commandfor` on `close` |
| `menu` | `menu` | object | `RippleMenu`; Liquid: a linklist drop | TSX: none. Liquid: `linklists['main-menu']` | yes in TSX (unless children are supplied) | no | default body |
| `side` | `side` | enum | `start`, `end` | `start` | no | no | `data-side` on `panel` |
| `strings` | none | object | keys `title`, `close` | `"Menu"`, `"Close"` | no | no | TSX hosts only |

### Content model

`flow` - the default body is the menu as nested lists inside `body`. Children, when supplied, replace the content of `body` (the `<nav>` element and its `aria-label` stay). `title` and `close` are always printed by the component.

### HTML contract

Fixture `default` (`id: "mobile-nav"`, `menu: menu.main`):

```html
<rp-dialog class="rp-mobile-nav" data-slot="rp-dialog">
  <dialog id="mobile-nav" class="rp-mobile-nav-panel" data-side="start" aria-labelledby="mobile-nav-title" closedby="any">
    <div class="rp-mobile-nav-header">
      <h2 id="mobile-nav-title" class="rp-mobile-nav-title">Menu</h2>
      <button class="rp-icon-button" type="button" commandfor="mobile-nav" command="close" data-variant="ghost" data-size="md" aria-label="Close"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <nav class="rp-mobile-nav-body" aria-label="Menu">
      <ul class="rp-mobile-nav-list">
        <li class="rp-mobile-nav-item">
          <details class="rp-mobile-nav-group" open>
            <summary class="rp-mobile-nav-trigger">Shop<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></summary>
            <ul class="rp-mobile-nav-list">
              <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="/collections/all" aria-current="page">Shop</a></li>
              <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="/collections/shirts">Shirts</a></li>
              <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="/collections/socks">Socks</a></li>
            </ul>
          </details>
        </li>
        <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="/pages/about">About</a></li>
      </ul>
    </nav>
  </dialog>
</rp-dialog>
```

Rule for `open` on a `group`: printed when the item itself is `current` or any descendant is `current` (Liquid: `link.current == true or link.child_current == true`). In `default` the first group is open because `Shop` is current.

Fixture `deep` (`id: "mobile-nav"`, `menu: menu.deep`, `side: "end"`): `panel` has `data-side="end"`; `body` contains:

```html
<ul class="rp-mobile-nav-list">
  <li class="rp-mobile-nav-item">
    <details class="rp-mobile-nav-group" open>
      <summary class="rp-mobile-nav-trigger">Clothing<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></summary>
      <ul class="rp-mobile-nav-list">
        <li class="rp-mobile-nav-item">
          <details class="rp-mobile-nav-group" open>
            <summary class="rp-mobile-nav-trigger">Tops<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></summary>
            <ul class="rp-mobile-nav-list">
              <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="/collections/tops">Tops</a></li>
              <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="/collections/shirts" aria-current="page">Shirts</a></li>
            </ul>
          </details>
        </li>
      </ul>
    </details>
  </li>
</ul>
```

Fixture `empty` (`id: "mobile-nav"`, `menu: menu.empty`): `body` contains `<ul class="rp-mobile-nav-list"></ul>`.

Fixture `invalid-enum-falls-back` (`side: "left"`): `data-side="start"`.

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-mobile-nav custom-a custom-b`.

There is no `defaultOpen` prop: a navigation drawer that opens on load would hide the page.

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `open` | `panel` | browser (`showModal()` / `close()`) | opened by the opener listener; closed by the close command, Escape, backdrop press, or navigation | absent (the server MUST NOT print it) |
| `open` | `group` | server, then browser | initial: current trail; then the shopper toggles it | present on groups in the current trail |
| `aria-current="page"` | `link` | server | the item's `current` is true | `page` or absent |
| `aria-haspopup`, `aria-controls` | the opener link (outside this component) | runtime | after upgrade | absent |

Upgrade allow-list (mutations permitted when the element upgrades): None of its own (global entry 1 covers the opener).

### Behaviour with JavaScript

Owned by `04-elements.md` section 9.1 (`rp-dialog`) and 3.4 (opener listener); summary:

1. An unmodified primary click on `a[data-rp-open="<id>"]` calls `preventDefault()` and `showModal()` on `panel`. A modified click (new tab) follows the `href`.
2. `close` (Invoker Command `close`, polyfilled), Escape and a press on the backdrop close the dialog. `rp-dialog` dispatches `openchange` on the root with `detail.value` `true` or `false`.
3. Focus moves into the dialog on open (first focusable element: `close`) and returns to the opener on close.
4. A link inside the drawer navigates; `rp-dialog` closes the dialog when a navigation with a source element starts (`04-elements.md` ledger issue L-10).
5. Toggling a `group` is native; several groups MAY be open at once (no `name` attribute).

### Behaviour without JavaScript

The opener link scrolls to the footer menu (`#footer-menu`), which lists the top-level links; every menu level is reachable from there by navigation. The drawer never opens. Nothing is hidden with `data-rp-js`. The level is `full` because the primary function (reaching every destination) completes through the fallback link (`noJs.fallbackHref`: `footer menu anchor`). In a browser with Invoker Commands the `close` button works natively, which matters only if the dialog was opened.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `openchange` | `rp-dialog` root | `{ value: boolean, reason: string }` (`04-elements.md` 11.1) | `onOpenChange` |
| command | `close` | `panel` (from the `close` button) | none | none |
| method | `open`, `close` | `rp-dialog` (primitive `api`) | none | none |

`open` is NOT controllable in React (D-036 limits controlled `open` to Dialog and Drawer).

### Accessibility

- Pattern: native modal `<dialog>` containing a navigation landmark with native disclosures; `checkPattern`: none.
- Accessible name: `panel` by `aria-labelledby="<id>-title"`; `body` by `aria-label` equal to the title text (`ripple.mobile-nav.title`, "Menu"); `close` by `ripple.mobile-nav.close` ("Close").
- Focus: on open, the first focusable element in the dialog; on close, the opener link.
- Announcements: None.

| Key | Action |
|---|---|
| Escape | Close the drawer |
| Tab / Shift+Tab | Cycle within the drawer (native modal dialog) |
| Enter, Space on a `trigger` | Toggle the group (native) |

### Styling

- File: `components/mobile-nav/mobile-nav.css` (layer `rp.components`).
- Tokens used: `--color-background`, `--color-foreground`, `--color-border`, `--color-overlay`, `--color-accent`, `--color-ring`, `--shadow-lg`, `--spacing`, `--spacing-control-md`, `--text-lg`, `--text-base`, `--rp-duration-slow`, `--rp-duration-base`, `--ease-drawer`, `--rp-z-overlay`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-mobile-nav-width` | `min(22rem, 85vw)` | Inline size of the panel |
| `--rp-mobile-nav-padding` | `calc(var(--spacing) * 4)` | Padding of `header` and `body` |
| `--rp-mobile-nav-indent` | `calc(var(--spacing) * 4)` | Inline-start indent of each nested `list` |
| `--_translate` | `-100%` | Closed-state translation on the inline axis |

| Modifier selector | Sets |
|---|---|
| `.rp-mobile-nav-panel[data-side="start"]` | `--_translate: -100%`; `inset-inline: 0 auto` |
| `.rp-mobile-nav-panel[data-side="end"]` | `--_translate: 100%`; `inset-inline: auto 0` |

Required rules:

1. `panel` MUST NOT set `display` except under `[open]` (`04-elements.md` C-5). Under `[open]`: `display: flex; flex-direction: column`. Always: `position: fixed; inset-block: 0; margin: 0; padding: 0; border: 0; inline-size: var(--rp-mobile-nav-width); max-inline-size: none; block-size: 100dvh; max-block-size: none; background: var(--color-background); color: var(--color-foreground); box-shadow: var(--shadow-lg)`.
2. `panel::backdrop`: `background: var(--color-overlay)`.
3. Slide transition inside `@media (prefers-reduced-motion: no-preference)`: `transition: translate var(--rp-duration-slow) var(--ease-drawer), overlay var(--rp-duration-slow) allow-discrete, display var(--rp-duration-slow) allow-discrete`; `@starting-style { .rp-mobile-nav-panel[open] { translate: var(--_translate) 0; } }`; closed state `translate: var(--_translate) 0`. In a `dir="rtl"` document the translation sign MUST flip: `:dir(rtl) .rp-mobile-nav-panel { --_translate: 100%; }` for `start` and `-100%` for `end`.
4. `header`: `display: flex; align-items: center; justify-content: space-between; padding: var(--rp-mobile-nav-padding); border-block-end: 1px solid var(--color-border)`. `title`: `margin: 0; font-size: var(--text-lg)`.
5. `body`: `flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: var(--rp-mobile-nav-padding)`.
6. `list`: `margin: 0; padding: 0; list-style: none`; a `list` inside a `group` has `padding-inline-start: var(--rp-mobile-nav-indent)`.
7. `link`, `trigger`: `display: flex; align-items: center; justify-content: space-between; min-block-size: var(--spacing-control-md); font-size: var(--text-base)`; `trigger` hides the native marker (`list-style: none` and `::-webkit-details-marker { display: none }`); the chevron Icon rotates 180 degrees under `.rp-mobile-nav-group[open] > .rp-mobile-nav-trigger`.

MobileNav owns these rules itself and does not reuse Drawer's classes, because its root class MUST be `rp-mobile-nav` (`02-html-contract.md` rules N-1 and C-18; Ledger issues, item 5).

### Host notes

- HTML: copy the fixture.
- React: `export function MobileNav(props: MobileNavProps): JSX.Element`, hand-written after the Dialog binding of `06-bindings.md` section 6.6: `useElement(ref, { events: { openchange: onOpenChange } })`; `<dialog>` is an ordinary React element; `suppressHydrationWarning` on `<rp-dialog>` and on `<dialog>`.
- Remix: `data-rmx-key={id}` on `<rp-dialog>`; `data-rmx-preserve-attrs="open"` on `<dialog>` and on every `<details class="rp-mobile-nav-group">`.
- Liquid: block `mobile-nav`; markup in the block file (not embedded by another file). Schema settings: `side` (select). Locale keys: `ripple.mobile-nav.name`, `ripple.mobile-nav.title` ("Menu"), `ripple.mobile-nav.close` ("Close").

```tsx
<MobileNav id="mobile-nav" menu={menu} />
```

```liquid
{% block 'mobile-nav', id: 'mobile-nav' %}{% endblock %}
```

Body of `components/mobile-nav/liquid/blocks/mobile-nav.liquid` between `{% doc %}` and `{% schema %}` (complete):

```liquid
{%- liquid
  if menu == blank
    assign menu = linklists['main-menu']
  endif
  assign allowed_side = 'start,end' | split: ','
  unless allowed_side contains side
    assign side = 'start'
  endunless
  assign title_text = 'ripple.mobile-nav.title' | t
  assign close_label = 'ripple.mobile-nav.close' | t
  assign title_id = id | append: '-title'
-%}
{%- capture close_icon -%}{% render 'rp-icon', name: 'close' %}{%- endcapture -%}
{%- capture chevron -%}{% render 'rp-icon', name: 'chevron-down' %}{%- endcapture -%}
<rp-dialog
  class="rp-mobile-nav {{ class | escape }}"
  data-slot="rp-dialog"
  {% if span != blank %}data-span="{{ span | escape }}"{% endif %}
  {% if hidden != blank %}data-hidden="{{ hidden | escape }}"{% endif %}
  {{ attributes }}
>
  <dialog id="{{ id | escape }}" class="rp-mobile-nav-panel" data-side="{{ side }}" aria-labelledby="{{ title_id | escape }}" closedby="any">
    <div class="rp-mobile-nav-header">
      <h2 id="{{ title_id | escape }}" class="rp-mobile-nav-title">{{ title_text | escape }}</h2>
      {% render 'rp-icon-button', command_for: id, command: 'close', aria_label: close_label, content: close_icon %}
    </div>
    <nav class="rp-mobile-nav-body" aria-label="{{ title_text | escape }}">
      {%- if content != blank -%}
        {{ content }}
      {%- else -%}
        <ul class="rp-mobile-nav-list">
          {%- for link in menu.links -%}
            <li class="rp-mobile-nav-item">
              {%- if link.links.size > 0 -%}
                <details class="rp-mobile-nav-group"{% if link.current == true or link.child_current == true %} open{% endif %}>
                  <summary class="rp-mobile-nav-trigger">{{ link.title | escape }}{{ chevron }}</summary>
                  <ul class="rp-mobile-nav-list">
                    {%- if link.url != blank and link.url != '#' -%}
                      <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="{{ link.url | escape }}"{% if link.current == true %} aria-current="page"{% endif %}>{{ link.title | escape }}</a></li>
                    {%- endif -%}
                    {%- for child in link.links -%}
                      <li class="rp-mobile-nav-item">
                        {%- if child.links.size > 0 -%}
                          <details class="rp-mobile-nav-group"{% if child.current == true or child.child_current == true %} open{% endif %}>
                            <summary class="rp-mobile-nav-trigger">{{ child.title | escape }}{{ chevron }}</summary>
                            <ul class="rp-mobile-nav-list">
                              {%- if child.url != blank and child.url != '#' -%}
                                <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="{{ child.url | escape }}"{% if child.current == true %} aria-current="page"{% endif %}>{{ child.title | escape }}</a></li>
                              {%- endif -%}
                              {%- for grandchild in child.links -%}
                                {%- if grandchild.url != blank and grandchild.url != '#' -%}
                                  <li class="rp-mobile-nav-item"><a class="rp-mobile-nav-link" href="{{ grandchild.url | escape }}"{% if grandchild.current == true %} aria-current="page"{% endif %}>{{ grandchild.title | escape }}</a></li>
                                {%- endif -%}
                              {%- endfor -%}
                            </ul>
                          </details>
                        {%- elsif child.url != blank and child.url != '#' -%}
                          <a class="rp-mobile-nav-link" href="{{ child.url | escape }}"{% if child.current == true %} aria-current="page"{% endif %}>{{ child.title | escape }}</a>
                        {%- endif -%}
                      </li>
                    {%- endfor -%}
                  </ul>
                </details>
              {%- elsif link.url != blank and link.url != '#' -%}
                <a class="rp-mobile-nav-link" href="{{ link.url | escape }}"{% if link.current == true %} aria-current="page"{% endif %}>{{ link.title | escape }}</a>
              {%- endif -%}
            </li>
          {%- endfor -%}
        </ul>
      {%- endif -%}
    </nav>
  </dialog>
</rp-dialog>
```

`link.child_current` is the Liquid field for "a descendant is current"; TSX bindings compute it by walking `items`.

### Commerce

None.

### Agent surface

`bridge`; `agent.component`: `rp-dialog`. Actions: `open`, `close` (the actions of the `rp-dialog` primitive, `04-elements.md` section 12). Confirm: none. Secret: none.

### Checker rules

- RP113 structure rules: `mobile-nav-once` (at most one `.rp-mobile-nav` per document); `mobile-nav-needs-opener` (a document that contains `.rp-mobile-nav-panel#X` contains `a[data-rp-open="X"][href^="#"]`); `dialog-needs-title` applies (the `title` part is always printed).
- RP302 (opener is a link), RP303 (no `open`, `hidden`, `aria-hidden`, `aria-modal` on the dialog), RP404 (Liquid: not between `{% partial %}` and `{% endpartial %}`), RP114, RP201.

### Acceptance tests

1. Tier 2: fixtures `default`, `deep`, `empty`, `invalid-enum-falls-back`, `class` conform in all four hosts.
2. Tier 3: zero mutations inside the root when `ripple.js` loads.
3. Tier 5: clicking the opener makes `dialog#mobile-nav` match `[open]` and `:modal`; `document.activeElement` is the close button; Escape closes it and focus returns to the opener.
4. Tier 5: `openchange` fires once on open with `detail.value === true` and once on close with `false`.
5. Tier 5: at `data-side="start"` in an LTR document the open panel's `getBoundingClientRect().left` is `0`; in an RTL document its `right` equals the viewport width.
6. Tier 6: with JavaScript disabled, clicking the opener sets `location.hash` to `#footer-menu`, the dialog is not open, and the footer menu is in the viewport.
7. Tier 6 (script failure): the same assertions with every `**/ripple*.js` request aborted.
8. Tier 4: React hydration in both script orders reports no hydration warning; Remix morph navigation with the drawer open closes it and leaves no `open` attribute.
9. Tier 5: every `link` and `trigger` box is at least 44 px high (the `--spacing-control-md` default).

### Evidence and UNVERIFIED

- Evidence: `04-elements.md` sections 9.1, 10.2, 10.15 (last paragraph); ledger D-008, D-009, D-017; `ripple/theme/snippets/mobile-nav-drawer.liquid`, `ripple/theme/assets/s-mobile-nav.js` (push panels that need JavaScript, replaced by `<details>`); `ripple/docs/research/base-theme.md` 3.4.
- UNVERIFIED: `closedby` support outside Chromium (SPIKE-06; `rp-dialog` has the backdrop-click fallback); `@starting-style` and `allow-discrete` transitions below the browser floor (without them the drawer opens without animation, which is acceptable); `commandfor` printing in React 19 and Remix 3 (SPIKE-05).

### Fallback (SPIKE-05)

If SPIKE-05 shows that a host does not print `commandfor` / `command` unchanged, the `close` button additionally carries `data-rp-close="<id>"` (printed through the IconButton rest props / `attributes`), as defined in `02-html-contract.md` section 15 and `04-elements.md` section 15. Nothing else in this contract changes.

---

## LinkList

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
- Liquid: block `link-list`; markup in `snippets/rp-link-list.liquid` (embedded by Footer). Schema settings: `orientation` (select). Locale keys: `ripple.link-list.name`, `ripple.link-list.label` ("Links").

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

1. Tier 2: fixtures `default`, `current`, `skips-items-without-url`, `invalid-enum-falls-back`, `escaping`, `class` conform in all four hosts.
2. Tier 3: zero mutations when `ripple.js` loads.
3. Tier 5: with `orientation="horizontal"` and a 1280 px viewport, the two links of fixture `current` have equal `top`; with `vertical` they have equal `left`.
4. Tier 5: every link box is at least 24 by 24 CSS px.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/blocks/basic-menu.liquid` (the block being replaced: `menu.links`, `link.url`, `link.title`, `link.current`); ledger 8.6; `02-html-contract.md` A-10.
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
## Logo

| Field | Value |
|---|---|
| Id | `logo` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none |
| Root element and class | `a` `.rp-logo` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `visually-hidden` |
| Milestone | M4 |

### Purpose

The shop's brand mark as a link to the home page: the logo image when one exists, otherwise the shop name as text.

- Use when: showing the brand in the Header, the Footer or a minimal layout (password, gift card).
- Do not use when: showing a content image (use Image) or a text link (use Link).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Logo` | `blocks/logo.liquid` | `a` | `rp-logo` | none | yes | none |
| image | none (printed by root) | same file | `img` | `rp-logo-image` | none | when `image` is set | none |

Nesting rules: with `image`, root contains `image` followed by one VisuallyHidden holding the children. Without `image`, root contains the children directly.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `href` | `href` | url | any URL | TSX: `/`. Liquid: `routes.root_url` | no | no | `href` on root |
| `image` | `image` | object | `RippleImage`; Liquid: an image drop | TSX: none. Liquid: `shop.brand.logo` | no | no | the `image` part |
| `size` | `size` | enum | `sm`, `md`, `lg` | `md` | no | no | `data-size` on root |

### Content model

`text` - the shop name; REQUIRED. It is the visible text when there is no image and the accessible name in both cases.

### HTML contract

Fixture `default` (children: `Mock Shop`):

```html
<a class="rp-logo" href="/" data-size="md">Mock Shop</a>
```

Fixture `image` (`image`: the logo of `shop.logo`, `size: "lg"`, `href: "/fr-ca"`, children: `Mock Shop`):

```html
<a class="rp-logo" href="/fr-ca" data-size="lg"><img class="rp-logo-image" src="https://cdn.shopify.com/s/files/1/0000/0001/files/logo.png?width=400" alt="" width="400" height="100"><span class="rp-visually-hidden">Mock Shop</span></a>
```

Fixture `invalid-enum-falls-back` (`size: "huge"`): equal to `default`.

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-logo custom-a custom-b`.

Rules for the `image` part: `src` is `imageUrl(image.url, { width: 400 })` in TSX and `{{ image | image_url: width: 400 }}` in Liquid; `width` and `height` are the image's intrinsic dimensions; `alt` is always the empty string (the name comes from the VisuallyHidden text); no `loading` attribute (the logo is above the fold; the browser default is eager).

Host-owned regions and masks: `{ "select": "img", "op": "attr", "name": "src" }` (D-049).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| none | none | none | none | none |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None.

### Behaviour without JavaScript

Identical: the link navigates to `href`.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| none | none | none | none | none |

### Accessibility

- Pattern: native `<a>`; `checkPattern`: none.
- Accessible name: the children text (directly, or through VisuallyHidden when the image is shown); required.
- Focus: none.
- Announcements: None.

| Key | Action |
|---|---|
| Enter | Follow the link |

### Styling

- File: `components/logo/logo.css` (layer `rp.components`).
- Tokens used: `--color-foreground`, `--color-ring`, `--font-heading`, `--text-lg`, `--text-xl`, `--text-2xl`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-logo-height` | `2rem` | Block size of the image |
| `--rp-logo-font-size` | `var(--text-xl)` | Font size of the text form |

| Modifier selector | Sets |
|---|---|
| `.rp-logo[data-size="sm"]` | `--rp-logo-height: 1.5rem; --rp-logo-font-size: var(--text-lg)` |
| `.rp-logo[data-size="md"]` | `--rp-logo-height: 2rem; --rp-logo-font-size: var(--text-xl)` |
| `.rp-logo[data-size="lg"]` | `--rp-logo-height: 2.5rem; --rp-logo-font-size: var(--text-2xl)` |

Required rules: root `display: inline-flex; align-items: center; min-block-size: 1.5rem; color: var(--color-foreground); font-family: var(--font-heading); font-size: var(--rp-logo-font-size); font-weight: 600; text-decoration: none`; `image` `block-size: var(--rp-logo-height); inline-size: auto; max-inline-size: 100%`.

### Host notes

- HTML: None.
- React: `export function Logo(props: LogoProps): JSX.Element`. Generated from the contract template.
- Remix: None.
- Liquid: block `logo`; markup in `snippets/rp-logo.liquid` (embedded by Header). In the snippet, `content` is the shop name as TEXT and is printed with `| escape` (an exception to "content is HTML" of rule L-11, needed because Header passes `shop.name`); the block wrapper passes its `{{ content }}` through unchanged, so a template author MUST write only text between the block tags. Schema settings: `size` (select). Locale keys: `ripple.logo.name`.

```tsx
<Logo href={shop.url} image={shop.logo ?? undefined}>{shop.name}</Logo>
```

```liquid
{% block 'logo' %}{{ shop.name }}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`. Actions: none. Confirm: none. Secret: none.

### Checker rules

- RP201: the link has an accessible name (children are required). RP203: the image has `alt`, `width`, `height`.

### Acceptance tests

1. Tier 2: fixtures `default`, `image`, `invalid-enum-falls-back`, `class` conform in all four hosts (image `src` masked).
2. Tier 5: for fixture `image` with `size="lg"` the rendered image height is 40 CSS px and its width keeps the 4:1 ratio.
3. Tier 5: the accessible name computed by the browser for fixture `image` is `Mock Shop`.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/blocks/logo.liquid` (image from `shop.brand.logo`, text fallback, `image_url: width: 400`); `05-commerce.md` 11.3 (`imageUrl`).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---

## LocaleSelector

| Field | Value |
|---|---|
| Id | `locale-selector` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none |
| Root element and class | `div` `.rp-locale-selector` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes |
| Depends on | `button`, `popover`, `icon` |
| Milestone | M4 |

### Purpose

Lets the shopper change country (and with it currency) and language. A Button opens a native Popover that contains one native form; every option is a submit button, so a choice is one press and works without JavaScript.

- Use when: the store sells in more than one country or language.
- Do not use when: there is exactly one country and one language (the component prints nothing in that case).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `LocaleSelector` | `blocks/locale-selector.liquid` | `div` | `rp-locale-selector` | none | yes | none |
| opener | none (printed by root) | same file | `button` (Button) | `rp-button` | none | yes | none |
| panel | none (printed by root) | same file | `div` (Popover panel) | `rp-popover` | none | yes | `<id>` |
| form | none (printed by root) | same file | `form` | `rp-locale-selector-form` | none | yes | `<id>-content` |
| heading | none (printed by root) | same file | `p` | `rp-locale-selector-heading` | none | one per printed group | none |
| list | none (printed by root) | same file | `ul` | `rp-locale-selector-list` | none | one per printed group | none |
| item | none (printed by root) | same file | `li` | `rp-locale-selector-item` | none | one per option | none |
| option | none (printed by root) | same file | `button` | `rp-locale-selector-option` | none | one per `item` | none |

Nesting rules: root contains `opener` then `panel`. `panel` contains exactly one `form`. `form` contains, for each printed group, `heading` then `list`. The country group is printed when there are at least two countries; the language group when there are at least two languages; countries first. When neither group would be printed, the component prints NOTHING (empty output). LocaleSelector MUST NOT be inside a `<form>`, an `<a>` or a `<button>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | yes | no | `id` on `panel`; `popovertarget` on `opener`; `<id>-content` on `form` |
| `countries` | none (reads `localization`) | object | `Array<{ code: string; name: string; currency: string; current: boolean }>` | `[]` | no | no | country group |
| `languages` | none (reads `localization`) | object | `Array<{ code: string; name: string; current: boolean }>` | `[]` | no | no | language group |
| `action` | none (`{% form 'localization' %}`) | url | any URL | `/api/locale` | no | no | `action` on `form` |
| `returnTo` | none (the form tag prints it) | url | site-relative path | none | yes in TSX | no | hidden input `return_to` |
| `side` | `side` | enum | `top`, `bottom`, `start`, `end` | `bottom` | no | no | `data-side` on `panel` |
| `align` | `align` | enum | `start`, `center`, `end` | `start` | no | no | `data-align` on `panel` |
| `strings` | none | object | keys `country`, `language` | `"Country/region"`, `"Language"` | no | no | TSX hosts only |

`countries`, `languages`, `action`, `returnTo` have `hosts: ["html", "react", "remix"]`. `currency` is display text such as `CAD $` (ISO code, a space, the symbol).

### Content model

`none` - no children. Ledger D-037 lists LocaleSelector as tier `resource`; its body is fully determined by the data, so the Liquid block ignores `content` (Ledger issues, item 6).

### HTML contract

Fixture `default` (`id: "footer-locale"`, `locale.multi`, `returnTo: "/"`):

```html
<div class="rp-locale-selector">
  <button class="rp-button" type="button" popovertarget="footer-locale" data-variant="ghost" data-size="sm"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18"/></svg>Canada (CAD $) / English</button>
  <div id="footer-locale" popover class="rp-popover" data-side="bottom" data-align="start">
    <form class="rp-locale-selector-form" id="footer-locale-content" method="post" action="/api/locale">
      <input type="hidden" name="return_to" value="/">
      <p class="rp-locale-selector-heading">Country/region</p>
      <ul class="rp-locale-selector-list" aria-label="Country/region">
        <li class="rp-locale-selector-item"><button class="rp-locale-selector-option" type="submit" name="country_code" value="CA" aria-current="true">Canada (CAD $)</button></li>
        <li class="rp-locale-selector-item"><button class="rp-locale-selector-option" type="submit" name="country_code" value="US">United States (USD $)</button></li>
      </ul>
      <p class="rp-locale-selector-heading">Language</p>
      <ul class="rp-locale-selector-list" aria-label="Language">
        <li class="rp-locale-selector-item"><button class="rp-locale-selector-option" type="submit" name="locale_code" value="EN" aria-current="true">English</button></li>
        <li class="rp-locale-selector-item"><button class="rp-locale-selector-option" type="submit" name="locale_code" value="FR">français</button></li>
      </ul>
    </form>
  </div>
</div>
```

Opener text rule: the current country's option text when the country group is printed; the current language's name when the language group is printed; joined by ` / ` (space, slash, space) when both are printed.

Fixture `countries-only` (`languages` has one entry; `side: "top"`, `align: "end"`): `panel` has `data-side="top" data-align="end"`; the opener text is `Canada (CAD $)`; the form contains only the country heading and list.

Fixture `single-locale` (one country, one language): the reference HTML is the empty string.

Fixture `invalid-enum-falls-back` (`side: "left"`): `data-side="bottom"`.

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-locale-selector custom-a custom-b`.

Host-owned regions and masks (the form internals differ by backend, following the precedent of D-043):

```json
[
  { "select": "form.rp-locale-selector-form", "op": "attr", "name": "action" },
  { "select": "form.rp-locale-selector-form", "op": "drop-attr", "name": "accept-charset" },
  { "select": "form.rp-locale-selector-form", "op": "drop-attr", "name": "enctype" },
  { "select": "form.rp-locale-selector-form > input[type=\"hidden\"]", "op": "remove" },
  { "select": "button.rp-locale-selector-option", "op": "attr", "name": "value" }
]
```

| | hydrogen backend (`html`, `react`, `remix`) | liquid backend |
|---|---|---|
| Form | `<form method="post" action="<action>">` | `{% form 'localization', id: <id>-content, class: 'rp-locale-selector-form' %}`; the platform prints `method="post" action="/localization"` and hidden inputs `form_type`, `utf8`, `_method`, `return_to` |
| Country field | `country_code` = `countries[].code` (`CA`) | `country_code` = `country.iso_code` |
| Language field | `locale_code` = `languages[].code` (Hydrogen language code, `FR`, `PT_BR`) | `locale_code` = `language.iso_code` (`fr`, `pt-BR`) |
| Return path | hidden `return_to` = `returnTo` | hidden `return_to`, printed by the form tag |
| Handler | the app route of the `layout` blueprint (section 2.6) | the platform |

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `aria-current="true"` | `option` | server | the option is the current country or language | `true` or absent |
| popover open state (`:popover-open`) | `panel` | browser | the opener is pressed | closed |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None of Ripple's. The popover and the form are native. Pressing an `option` submits the form; the server answers with a redirect; the page loads in the new country or language.

### Behaviour without JavaScript

Identical. In a browser without the popover API the panel is in-flow content below the opener and the opener does nothing; the options still work.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| none | none | none | none | none |

### Accessibility

- Pattern: disclosure (native `popover`) containing a native form of submit buttons; `checkPattern`: none.
- Accessible name: the opener by its text (the current selection); each `list` by `aria-label` (`ripple.locale-selector.country`, `ripple.locale-selector.language`); each option by its text.
- Focus: native popover behaviour; after the form post the page reloads.
- Announcements: None.

| Key | Action |
|---|---|
| Enter, Space on the opener | Toggle the panel (native) |
| Escape | Close the panel (native) |
| Tab | Through the options in DOM order |
| Enter, Space on an option | Submit that choice |

### Styling

- File: `components/locale-selector/locale-selector.css` (layer `rp.components`).
- Tokens used: `--color-foreground`, `--color-muted-foreground`, `--color-accent`, `--color-accent-foreground`, `--color-ring`, `--radius-control`, `--spacing`, `--spacing-control-sm`, `--text-sm`, `--text-xs`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-locale-selector-max-height` | `20rem` | Maximum block size of each `list` (it scrolls) |
| `--rp-locale-selector-min-width` | `16rem` | Minimum inline size of `form` |

| Modifier selector | Sets |
|---|---|
| `.rp-locale-selector-option[aria-current="true"]` | `--_bg: var(--color-accent); --_fg: var(--color-accent-foreground)`; `font-weight: 600` through `--_weight` |

Required rules: root `display: inline-block`; `form` `display: flex; flex-direction: column; gap: calc(var(--spacing) * 2); min-inline-size: var(--rp-locale-selector-min-width)`; `heading` `margin: 0; font-size: var(--text-xs); color: var(--color-muted-foreground)`; `list` `margin: 0; padding: 0; list-style: none; max-block-size: var(--rp-locale-selector-max-height); overflow-y: auto`; `option` `display: flex; inline-size: 100%; align-items: center; min-block-size: var(--spacing-control-sm); padding-inline: calc(var(--spacing) * 2); border: 0; border-radius: var(--radius-control); background: var(--_bg, transparent); color: var(--_fg, inherit); font: inherit; font-size: var(--text-sm); text-align: start; cursor: pointer`. The panel's own look comes from `popover.css`.

### Host notes

- HTML: copy the fixture; the server needs the route of section 2.6.
- React: `export function LocaleSelector(props: LocaleSelectorProps): JSX.Element | null`. Returns `null` when no group would be printed. No hook.
- Remix: the `form` prints `data-rmx-document` (a locale change MUST be a full document load: `hydrogen/packages/hydrogen/skills/hydrogen-markets/SKILL.md`, "One locale per page load").
- Liquid: block `locale-selector`. Schema settings: `side`, `align` (select). Locale keys: `ripple.locale-selector.name`, `ripple.locale-selector.country` ("Country/region"), `ripple.locale-selector.language` ("Language").

```tsx
<LocaleSelector id="footer-locale" countries={locale.countries} languages={locale.languages} returnTo={pathname} side="top" />
```

```liquid
{% block 'locale-selector', id: 'footer-locale', side: 'top' %}{% endblock %}
```

Body of `components/locale-selector/liquid/blocks/locale-selector.liquid` between `{% doc %}` and `{% schema %}` (complete):

```liquid
{%- liquid
  assign allowed_side = 'top,bottom,start,end' | split: ','
  unless allowed_side contains side
    assign side = 'bottom'
  endunless
  assign allowed_align = 'start,center,end' | split: ','
  unless allowed_align contains align
    assign align = 'start'
  endunless
  assign show_countries = false
  if localization.available_countries.size > 1
    assign show_countries = true
  endif
  assign show_languages = false
  if localization.available_languages.size > 1
    assign show_languages = true
  endif
  assign country_label = 'ripple.locale-selector.country' | t
  assign language_label = 'ripple.locale-selector.language' | t
  assign form_id = id | append: '-content'
-%}
{%- if show_countries == true or show_languages == true -%}
  {%- capture opener_content -%}
    {%- render 'rp-icon', name: 'globe' -%}
    {%- if show_countries == true -%}{{ localization.country.name | escape }} ({{ localization.country.currency.iso_code | escape }} {{ localization.country.currency.symbol | escape }}){%- endif -%}
    {%- if show_countries == true and show_languages == true %} / {% endif -%}
    {%- if show_languages == true -%}{{ localization.language.endonym_name | escape }}{%- endif -%}
  {%- endcapture -%}
  <div
    class="rp-locale-selector {{ class | escape }}"
    {% if span != blank %}data-span="{{ span | escape }}"{% endif %}
    {% if hidden != blank %}data-hidden="{{ hidden | escape }}"{% endif %}
    {{ attributes }}
  >
    {% render 'rp-button', variant: 'ghost', size: 'sm', popover_target: id, content: opener_content %}
    <div id="{{ id | escape }}" popover class="rp-popover" data-side="{{ side }}" data-align="{{ align }}">
      {%- form 'localization', id: form_id, class: 'rp-locale-selector-form' -%}
        {%- if show_countries == true -%}
          <p class="rp-locale-selector-heading">{{ country_label | escape }}</p>
          <ul class="rp-locale-selector-list" aria-label="{{ country_label | escape }}">
            {%- for country in localization.available_countries -%}
              <li class="rp-locale-selector-item"><button class="rp-locale-selector-option" type="submit" name="country_code" value="{{ country.iso_code | escape }}"{% if country.iso_code == localization.country.iso_code %} aria-current="true"{% endif %}>{{ country.name | escape }} ({{ country.currency.iso_code | escape }} {{ country.currency.symbol | escape }})</button></li>
            {%- endfor -%}
          </ul>
        {%- endif -%}
        {%- if show_languages == true -%}
          <p class="rp-locale-selector-heading">{{ language_label | escape }}</p>
          <ul class="rp-locale-selector-list" aria-label="{{ language_label | escape }}">
            {%- for language in localization.available_languages -%}
              <li class="rp-locale-selector-item"><button class="rp-locale-selector-option" type="submit" name="locale_code" value="{{ language.iso_code | escape }}"{% if language.iso_code == localization.language.iso_code %} aria-current="true"{% endif %}>{{ language.endonym_name | escape }}</button></li>
            {%- endfor -%}
          </ul>
        {%- endif -%}
      {%- endform -%}
    </div>
  </div>
{%- endif -%}
```

The panel markup is printed inline, following the Popover contract of D-010, because the Popover panel is a part block on Liquid and a block cannot be called from a block file (rule L-12). If `10-components-interactive.md` provides a snippet for the panel, this file MUST render that snippet instead.

### Commerce

None. (Country and language are not cart state. After the redirect the page is rendered in the new market and the cart is priced by the backend for that market.)

### Agent surface

`accessibility-tree`. Actions: none. Confirm: none. Secret: none.

### Checker rules

- RP113 structure rule `locale-selector-not-in-form`: `.rp-locale-selector` MUST NOT have a `form` ancestor.
- RP301 / lint `pe-2`: every `option` is a submit button inside a form with `action` and `method`. RP114: `popovertarget` resolves. RP204: the popover is not inside a link or button.

### Acceptance tests

1. Tier 2: fixtures `default`, `countries-only`, `single-locale`, `invalid-enum-falls-back`, `class` conform in all four hosts with the masks above.
2. Tier 3: zero mutations when `ripple.js` loads.
3. Tier 6 (hydrogen backend, JavaScript disabled): open the panel, press `United States (USD $)`; the browser POSTs `country_code=US` and `return_to` to the action and lands, after a 303, on a URL whose locale is the US locale (route of section 2.6).
4. Tier 8 (Liquid live): the same flow against `/localization`; the page reloads with `localization.country.iso_code == 'US'`.
5. Tier 5: the opener's accessible name equals the opener text rule; the current option has `aria-current="true"`.
6. Tier 5: every option box is at least 24 CSS px high.

### Evidence and UNVERIFIED

- Evidence: Shopify docs (`https://shopify.dev/docs/api/liquid/tags/form`, form `localization`: output `method="post" action="/localization"` with hidden `form_type`, `utf8`, `_method`, `return_to`; `https://shopify.dev/docs/storefronts/themes/markets/multiple-currencies-languages`: `localization.available_countries`, `country.iso_code`, `country.name`, `country.currency.iso_code`, `country.currency.symbol`, field `country_code`); `ripple/theme/snippets/localization-form.liquid` (submit buttons `name="country_code"`; `localization.available_languages`, `localization.language.iso_code`); `ripple/theme/assets/s-localization-dropdown.js` (the script this component removes); `hydrogen/packages/hydrogen/src/core/i18n/href.ts` (`getLocalizedHref`).
- UNVERIFIED: the field name `locale_code` and `language.endonym_name` were not re-read in source in this session (they are the documented localization form fields by general knowledge; the base theme file was read only to line 80); that passing `class:` to `{% form 'localization' %}` replaces the default class; the shim's `form 'localization'` output (section 3, X-5). Tier 8 confirms all three.

### Fallback (SPIKE-nn)

None. (SPIKE-06 covers Popover positioning in `10-components-interactive.md`.)

---

## AccountLink

| Field | Value |
|---|---|
| Id | `account-link` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none |
| Root element and class | `a` `.rp-account-link` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `icon` |
| Milestone | M4 |

### Purpose

A link to the Shopify-hosted customer account (D-051): an account icon and a text label. It is the only account UI in V1.

- Use when: linking to the customer account from the Header, MobileNav or Footer.
- Do not use when: you need login, order or address UI (not in V1; those pages are hosted by Shopify).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `AccountLink` | `blocks/account-link.liquid` | `a` | `rp-account-link` | none | yes | none |
| icon | none (printed by root) | same file | `svg` (Icon `account`) | `rp-icon` | none | yes | none |
| label | none (printed by root) | same file | `span` | `rp-account-link-label` | none | yes | none |

Nesting rules: root contains `icon` then `label`. Children are the content of `label`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `href` | `href` | url | any URL | TSX: `/account`. Liquid: `routes.account_url` when `customer` is set, otherwise `routes.account_login_url` | no | no | `href` on root |
| `iconOnly` | `icon_only` | boolean | `true`, `false` | `false` | no | no | `data-icon-only=""` on root |

### Content model

`text` - the label; REQUIRED. English default used by Header: `ripple.account-link.label` ("Account"). With `iconOnly` the label is visually hidden by CSS and remains the accessible name.

### HTML contract

Fixture `default` (children: `Account`):

```html
<a class="rp-account-link" href="/account"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0"/></svg><span class="rp-account-link-label">Account</span></a>
```

Fixture `icon-only` (`iconOnly: true`, `href: "/account/login"`):

```html
<a class="rp-account-link" href="/account/login" data-icon-only=""><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0"/></svg><span class="rp-account-link-label">Account</span></a>
```

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-account-link custom-a custom-b`.

Host-owned regions and masks: `{ "select": "a.rp-account-link", "op": "attr", "name": "href" }` (the account URL differs by backend).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| none | none | none | none | none |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None. The link is a full document navigation in every host.

### Behaviour without JavaScript

Identical.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| none | none | none | none | none |

### Accessibility

- Pattern: native `<a>`; `checkPattern`: none.
- Accessible name: the label text (required), also when `iconOnly`.
- Focus: none.
- Announcements: None.

| Key | Action |
|---|---|
| Enter | Follow the link |

### Styling

- File: `components/account-link/account-link.css` (layer `rp.components`).
- Tokens used: `--color-foreground`, `--color-accent`, `--color-ring`, `--radius-control`, `--spacing`, `--spacing-control-md`, `--text-sm`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-account-link-size` | `var(--spacing-control-md)` | Minimum block size; also the inline size when `iconOnly` |

| Modifier selector | Sets |
|---|---|
| `.rp-account-link[data-icon-only]` | `--_inline: var(--rp-account-link-size); --_padding: 0; --_justify: center` |

Required rules: root `display: inline-flex; align-items: center; justify-content: var(--_justify, flex-start); gap: calc(var(--spacing) * 2); min-block-size: var(--rp-account-link-size); min-inline-size: var(--_inline, auto); padding-inline: var(--_padding, calc(var(--spacing) * 2)); border-radius: var(--radius-control); color: var(--color-foreground); text-decoration: none; font-size: var(--text-sm)`. `.rp-account-link[data-icon-only] .rp-account-link-label` uses the visually-hidden declarations (`position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap`). Hover background `--color-accent` inside `@media (hover: hover)`.

### Host notes

- HTML: None.
- React: `export function AccountLink(props: AccountLinkProps): JSX.Element`. Generated from the contract template.
- Remix: prints `data-rmx-document` on the root (links to account routes MUST be document navigations, D-034 item 3).
- Liquid: block `account-link`; markup in `snippets/rp-account-link.liquid` (embedded by Header). No schema settings. Locale keys: `ripple.account-link.name`, `ripple.account-link.label` ("Account").

```tsx
<AccountLink href="/account" iconOnly>Account</AccountLink>
```

```liquid
{% block 'account-link', icon_only: true %}{{ 'ripple.account-link.label' | t }}{% endblock %}
```

Liquid default for `href` (in the snippet's `{% liquid %}` block):

```liquid
if href == blank
  if customer
    assign href = routes.account_url
  else
    assign href = routes.account_login_url
  endif
endif
```

The snippet reads the global `customer`; it has no param of that name (rule L-5).

### Commerce

None.

### Agent surface

`accessibility-tree`. Actions: none. Confirm: none. Secret: none.

### Checker rules

- RP201: the link has a non-empty label.

### Acceptance tests

1. Tier 2: fixtures `default`, `icon-only`, `class` conform in all four hosts (`href` masked).
2. Tier 5: with `iconOnly` the link box is 44 by 44 CSS px, the label's box is 1 by 1 CSS px, and the computed accessible name is `Account`.
3. Tier 4 (Remix): the rendered link has `data-rmx-document`; clicking it causes a document navigation (no `X-Remix-Frame` request).

### Evidence and UNVERIFIED

- Evidence: ledger D-051, D-034 item 3; `ripple/docs/research/remix-3.md` (links to `/account/*` need `data-rmx-document`); `ripple/theme/assets/icon-account.svg`.
- UNVERIFIED: the hydrogen-backend account URL. `hydrogen/packages/hydrogen/src/customer-account/` exists but was not researched (D-051); the default `/account` is a placeholder path the app MUST route to the Shopify-hosted account (for example by redirect).

### Fallback (SPIKE-nn)

None.

---

## NewsletterForm

| Field | Value |
|---|---|
| Id | `newsletter-form` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none |
| Root element and class | `form` `.rp-newsletter-form` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes |
| Depends on | `input`, `button`, `form-message` |
| Milestone | M4 |

### Purpose

An email sign-up form: one email field and a submit button, with a server-rendered success or error message after the post.

- Use when: collecting marketing sign-ups in the Footer, the home page or the password page.
- Do not use when: building a contact form (compose Label, Input, Textarea, Button; see blueprint `contact`).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `NewsletterForm` | `blocks/newsletter-form.liquid` | `form` | `rp-newsletter-form` | none | yes | `<id>` |
| row | none (printed by root) | same file | `div` | `rp-newsletter-form-row` | none | yes | none |
| input | none (default body) | same file | `input` (Input) | `rp-input` | none | yes | none |
| submit | none (default body) | same file | `button` (Button) | `rp-button` | none | yes | none |
| message | none (printed by root) | same file | `p` (FormMessage) | `rp-form-message` | none | when `status` is `success` or `error` | `<id>-error` when `status` is `error`; none when `success` |

Nesting rules: root contains `row`, then `message` when printed. `row` contains `input` then `submit` (or the children that replace them). NewsletterForm MUST NOT be inside another `<form>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | yes | no | `id` on root; `<id>-error` on the error message |
| `action` | none (`{% form 'customer' %}`) | url | any URL | none | yes in TSX | no | `action` on root |
| `status` | none (derived from the `form` object) | enum | `idle`, `success`, `error` | `idle` | no | no | which `message` is printed; no attribute |
| `defaultValue` | none (reads `form.email`) | string | an email address | none | no | no | `value` on `input` |
| `strings` | none | object | keys `email`, `submit`, `success`, `error` | `"Email address"`, `"Subscribe"`, `"Thanks for subscribing."`, `"Enter a valid email address."` | no | no | TSX hosts only |

`action`, `status`, `defaultValue` have `hosts: ["html", "react", "remix"]`. `status` values are not in ledger section 6 (Ledger issues, item 7).

### Content model

`flow`, restricted - the default body of `row` is `input` and `submit`. Children, when supplied, replace the content of `row` and MUST contain one email field with the host's field name (table below) and one submit Button.

### HTML contract

Fixture `default` (`id: "newsletter"`, `action: "/api/newsletter"`):

```html
<form class="rp-newsletter-form" id="newsletter" method="post" action="/api/newsletter">
  <div class="rp-newsletter-form-row">
    <input class="rp-input" type="email" name="email" required autocomplete="email" placeholder="Email address" aria-label="Email address" data-size="md">
    <button class="rp-button" type="submit" data-variant="primary" data-size="md">Subscribe</button>
  </div>
</form>
```

Fixture `success` (`status: "success"`): after `row`:

```html
<p class="rp-form-message" data-tone="success" role="status">Thanks for subscribing.</p>
```

Fixture `error` (`status: "error"`, `defaultValue: "not-an-email"`): the input additionally has `value="not-an-email" aria-invalid="true" aria-describedby="newsletter-error"`; after `row`:

```html
<p class="rp-form-message" id="newsletter-error" data-tone="destructive" role="alert">Enter a valid email address.</p>
```

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-newsletter-form custom-a custom-b`.

Host-owned regions and masks:

```json
[
  { "select": "form.rp-newsletter-form", "op": "attr", "name": "action" },
  { "select": "form.rp-newsletter-form", "op": "drop-attr", "name": "accept-charset" },
  { "select": "form.rp-newsletter-form", "op": "drop-attr", "name": "enctype" },
  { "select": "form.rp-newsletter-form > input[type=\"hidden\"]", "op": "remove" },
  { "select": "input.rp-input", "op": "attr", "name": "name" }
]
```

| | hydrogen backend | liquid backend |
|---|---|---|
| Form | `<form method="post" action="<action>">` | `{% form 'customer', id: id, class: 'rp-newsletter-form' %}`; platform hidden inputs `form_type`, `utf8` |
| Email field name | `email` | `contact[email]` |
| Tag | none | `<input type="hidden" name="contact[tags]" value="newsletter">` as the first child of the form |
| `status` | passed by the server that handled the post (section 2.7) | `success` when `form.posted_successfully?`; `error` when `form.errors`; otherwise `idle` |
| Refill | `defaultValue` | `form.email` |

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `aria-invalid="true"` | `input` | server | `status` is `error` | `true` or absent |
| `aria-describedby` | `input` | server | `status` is `error` | `<id>-error` or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None of Ripple's. Native validation (`required`, `type="email"`) blocks an empty or malformed submit. The form posts; the response page shows the `message`.

### Behaviour without JavaScript

Identical (D-005 requires `full`). The outcome is a server-rendered FormMessage (`02-html-contract.md` rule PE-11); no Toast is used.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| none | none | none | none | none |

### Accessibility

- Pattern: native form; `checkPattern`: none.
- Accessible name: the input by `aria-label` (`ripple.newsletter-form.email`); the button by its text (`ripple.newsletter-form.submit`).
- Focus: after the post the server redirects to `<page>#<id>`, so the form is scrolled into view; no script moves focus.
- Announcements: the success message has `role="status"`, the error message `role="alert"`; both are in the server response.

| Key | Action |
|---|---|
| Enter in the field | Submit |

### Styling

- File: `components/newsletter-form/newsletter-form.css` (layer `rp.components`).
- Tokens used: `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-newsletter-form-max-width` | `28rem` | Maximum inline size of the form |
| `--rp-newsletter-form-gap` | `calc(var(--spacing) * 2)` | Gap between field and button, and between row and message |

| Modifier selector | Sets |
|---|---|
| none | none |

Required rules: root `display: flex; flex-direction: column; gap: var(--rp-newsletter-form-gap); max-inline-size: var(--rp-newsletter-form-max-width); inline-size: 100%`; `row` `display: flex; flex-wrap: wrap; gap: var(--rp-newsletter-form-gap)`; `.rp-newsletter-form-row > .rp-input` `flex: 1 1 12rem; min-inline-size: 0`.

### Host notes

- HTML: copy the fixture; the server needs the route of section 2.7.
- React: `export function NewsletterForm(props: NewsletterFormProps): JSX.Element`. No hook; the form is uncontrolled (`defaultValue`).
- Remix: no `data-rmx-document` (Remix may submit it as a frame navigation; the route answers with a redirect to the page).
- Liquid: block `newsletter-form`. No schema settings. Locale keys: `ripple.newsletter-form.name`, `.email` ("Email address"), `.submit` ("Subscribe"), `.success` ("Thanks for subscribing."), `.error` ("Enter a valid email address.").

```tsx
<NewsletterForm id="newsletter" action="/api/newsletter" status={newsletterStatus} />
```

```liquid
{% block 'newsletter-form', id: 'newsletter' %}{% endblock %}
```

Body of `components/newsletter-form/liquid/blocks/newsletter-form.liquid` between `{% doc %}` and `{% schema %}` (complete):

```liquid
{%- liquid
  assign email_label = 'ripple.newsletter-form.email' | t
  assign submit_label = 'ripple.newsletter-form.submit' | t
  assign success_text = 'ripple.newsletter-form.success' | t
  assign error_text = 'ripple.newsletter-form.error' | t
  assign error_id = id | append: '-error'
  assign form_class = 'rp-newsletter-form ' | append: class | strip
-%}
{%- form 'customer', id: id, class: form_class -%}
  <input type="hidden" name="contact[tags]" value="newsletter">
  <div class="rp-newsletter-form-row">
    {%- if content != blank -%}
      {{ content }}
    {%- else -%}
      {%- if form.errors -%}
        {% render 'rp-input', type: 'email', name: 'contact[email]', required: true, autocomplete: 'email', placeholder: email_label, aria_label: email_label, default_value: form.email, invalid: true, described_by: error_id %}
      {%- else -%}
        {% render 'rp-input', type: 'email', name: 'contact[email]', required: true, autocomplete: 'email', placeholder: email_label, aria_label: email_label %}
      {%- endif -%}
      {% render 'rp-button', type: 'submit', content: submit_label %}
    {%- endif -%}
  </div>
  {%- if form.posted_successfully? -%}
    <p class="rp-form-message" data-tone="success" role="status">{{ success_text | escape }}</p>
  {%- elsif form.errors -%}
    <p class="rp-form-message" id="{{ error_id | escape }}" data-tone="destructive" role="alert">{{ error_text | escape }}</p>
  {%- endif -%}
{%- endform -%}
```

Notes: the root element is printed by the `{% form %}` tag, so `attributes`, `span` and `hidden` cannot be printed on it; this block accepts `class` only (the `{% doc %}` MUST say so; Ledger issues, item 8). The two FormMessage elements are written inline with FormMessage's contract; if `09-components-foundation.md` gives FormMessage a snippet, render `rp-form-message` instead. The Input param names (`default_value`, `invalid`, `described_by`, `aria_label`, `autocomplete`) follow ledger 6.4 and are owned by `09-components-foundation.md`.

### Commerce

None. NewsletterForm does not touch the cart store or the commerce adapter.

### Agent surface

`accessibility-tree`. Actions: none. Confirm: none. Secret: none. (An email address is not marked `data-agent-secret`.)

### Checker rules

- RP301 / lint `pe-2`: the form has `action` and `method`; the button is a submit button. RP202 / lint `a-8`: the input has `aria-label`. RP305 does not apply (not a cart form).
- RP113 structure rule `newsletter-form-not-in-form`: `.rp-newsletter-form` MUST NOT have a `form` ancestor.

### Acceptance tests

1. Tier 2: fixtures `default`, `success`, `error`, `class` conform in all four hosts with the masks above.
2. Tier 3: zero mutations when `ripple.js` loads.
3. Tier 6 (hydrogen backend, JavaScript disabled): submit `shopper@example.com`; the response page (after the redirect) contains `.rp-newsletter-form .rp-form-message[data-tone="success"][role="status"]` and the URL ends with `#newsletter`.
4. Tier 6: submit with the route forced to fail; the response contains the `error` markup, the input has `aria-invalid="true"`, and `aria-describedby` resolves.
5. Tier 6: pressing the button with an empty field sends no request (native validation).
6. Tier 8 (Liquid live): the same success flow through `{% form 'customer' %}`.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/templates/password.liquid` lines 93 and 187 (`{% form 'customer' %}` used for email sign-up); Shopify docs (`https://shopify.dev/docs/api/liquid/objects/form`: `posted_successfully?`); ledger D-005 (NewsletterForm MUST be `full`), `02-html-contract.md` PE-11.
- UNVERIFIED: the Liquid field names `contact[email]` and `contact[tags]` and the `form.email` refill (standard theme practice; not re-read in docs in this session); the shim's `form 'customer'` output (section 3, X-5); the hydrogen-backend sign-up mutation (section 2.7). Tier 8 confirms the Liquid items.

### Fallback (SPIKE-nn)

None.

---

## Hero

| Field | Value |
|---|---|
| Id | `hero` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none |
| Root element and class | `section` `.rp-hero` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M4 |

### Purpose

A large introductory band: optional full-bleed background image with content (heading, text, buttons) laid over it.

- Use when: opening a home or landing page with one dominant message.
- Do not use when: you need an ordinary content band (use Container) or a product image (use Image or ProductGallery).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Hero` | `blocks/hero.liquid` | `section` | `rp-hero` | none | yes | none |
| media | none (printed by root) | same file | `div` | `rp-hero-media` | none | when `image` is set | none |
| image | none (printed by root) | same file | `img` | `rp-hero-image` | none | when `image` is set | none |
| content | none (printed by root) | same file | `div` | `rp-hero-content` | none | yes | none |

Nesting rules: root contains `media` (when printed) then `content`. `media` contains exactly `image`. Children are the content of `content`. A page SHOULD contain at most one Hero, and it SHOULD be the first element of `<main>` (its image is printed as the page's priority image).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `image` | `image` | object | `RippleImage`; Liquid: an image drop | none | no | no | the `media` and `image` parts |
| `alt` | `alt` | string | any text | `""` | no | no | `alt` on `image` |
| `size` | `size` | enum | `sm`, `md`, `lg`, `full` | `md` | no | no | `data-size` on root |
| `align` | `align` | enum | `start`, `center`, `end` | `start` | no | no | `data-align` on root |
| `scheme` | `scheme` | enum | `light`, `dark`, project scheme names | none | no | no | `data-scheme` on root; omitted when unset |

When `image` is set the caller SHOULD pass `scheme="dark"` so that text over the image has contrast (the image is darkened by an overlay of `--color-overlay`).

### Content model

`flow` - REQUIRED. Typically a Stack with a Heading (`level` 1), a Text and one or two Buttons.

### HTML contract

Fixture `default` (children: `<h1>Welcome</h1>`):

```html
<section class="rp-hero" data-size="md" data-align="start"><div class="rp-hero-content"><h1>Welcome</h1></div></section>
```

Fixture `image` (`image: { url: "https://cdn.shopify.com/s/files/1/0000/0001/files/hero.jpg", altText: null, width: 2400, height: 1200 }`, `alt: "Model wearing a linen shirt"`, `size: "lg"`, `align: "center"`, `scheme: "dark"`):

```html
<section class="rp-hero" data-size="lg" data-align="center" data-scheme="dark"><div class="rp-hero-media"><img class="rp-hero-image" src="https://cdn.shopify.com/s/files/1/0000/0001/files/hero.jpg?width=1600" srcset="https://cdn.shopify.com/s/files/1/0000/0001/files/hero.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0000/0001/files/hero.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0000/0001/files/hero.jpg?width=1600 1600w, https://cdn.shopify.com/s/files/1/0000/0001/files/hero.jpg?width=2400 2400w" sizes="100vw" alt="Model wearing a linen shirt" width="2400" height="1200" loading="eager" fetchpriority="high"></div><div class="rp-hero-content"><h1>Welcome</h1></div></section>
```

Rules for the `image` part: `src` is `imageUrl(image.url, { width: 1600 })`; `srcset` is `imageSrcSet(image.url, [800, 1200, 1600, 2400])`; `sizes` is the literal `100vw`; `width` and `height` are intrinsic; `loading="eager"` and `fetchpriority="high"` are always printed. Liquid prints the same with `image_url: width: N`.

Fixture `invalid-enum-falls-back` (`size: "huge"`): equal to `default`.

Fixture `escaping` (`alt: "Say \"hi\" & <go>"` with the image above): `alt="Say &quot;hi&quot; &amp; &lt;go&gt;"`.

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-hero custom-a custom-b`.

Host-owned regions and masks: `{ "select": "img", "op": "attr", "name": "src" }`, `{ "select": "img", "op": "srcset", "name": "srcset" }` (D-049).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-scheme` | root | server | prop `scheme` is set | the scheme name or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None.

### Behaviour without JavaScript

Identical.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| none | none | none | none | none |

### Accessibility

- Pattern: native `<section>` (not a landmark: it has no accessible name); `checkPattern`: none.
- Accessible name: none. The image's `alt` describes it; pass `alt=""` (the default) when the image is decorative.
- Focus: none.
- Announcements: None.

| Key | Action |
|---|---|
| none | none |

Contrast: text over the image MUST meet WCAG 2.2 AA (4.5:1). The overlay guarantees it only together with a dark scheme; the eval visual rubric checks it (`08-agent-kit-and-evals.md`).

### Styling

- File: `components/hero/hero.css` (layer `rp.components`).
- Tokens used: `--color-background`, `--color-foreground`, `--color-overlay`, `--container-page`, `--spacing-gutter`, `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-hero-min-height` | `28rem` | Minimum block size of the root |
| `--rp-hero-padding-block` | `calc(var(--spacing) * 16)` | Block padding of `content` |
| `--rp-hero-content-max-width` | `42rem` | Maximum inline size of the children column |
| `--_align` | `start` | `align-items` and `text-align` of `content` |

| Modifier selector | Sets |
|---|---|
| `.rp-hero[data-size="sm"]` | `--rp-hero-min-height: 20rem` |
| `.rp-hero[data-size="md"]` | `--rp-hero-min-height: 28rem` |
| `.rp-hero[data-size="lg"]` | `--rp-hero-min-height: 36rem` |
| `.rp-hero[data-size="full"]` | `--rp-hero-min-height: 100svh` |
| `.rp-hero[data-align="start"]` | `--_align: start` |
| `.rp-hero[data-align="center"]` | `--_align: center` |
| `.rp-hero[data-align="end"]` | `--_align: end` |

Required rules: root `position: relative; display: grid; min-block-size: var(--rp-hero-min-height); background: var(--color-background); color: var(--color-foreground); overflow: clip`; `media` `position: absolute; inset: 0`; `media::after` `content: ""; position: absolute; inset: 0; background: var(--color-overlay)`; `image` `inline-size: 100%; block-size: 100%; object-fit: cover`; `content` `position: relative; display: flex; flex-direction: column; justify-content: center; align-items: var(--_align); text-align: var(--_align); inline-size: 100%; max-inline-size: var(--container-page); margin-inline: auto; padding: var(--rp-hero-padding-block) var(--spacing-gutter)`; `.rp-hero-content > *` `max-inline-size: var(--rp-hero-content-max-width)`. `data-align` is a UI SDK reserved name; every selector that uses it includes `.rp-hero`. The generated `props.css` rules for `align` are scoped to Stack, Inline and Grid (D-028) and do not match Hero.

### Host notes

- HTML: None.
- React: `export function Hero(props: HeroProps): JSX.Element`. Generated from the contract template, with the `srcset` computed by `imageSrcSet` from `<pkg>` (if the template language cannot express the `srcset` value, the binding is hand-written and MUST pass the fixtures).
- Remix: None.
- Liquid: block `hero`. Schema settings: `size`, `align`, `scheme` (select; three, the maximum of D-038 item 5). Locale keys: `ripple.hero.name`.

```tsx
<Hero image={heroImage} size="lg" align="center" scheme="dark">
  <Stack gap="4" align="center">
    <Heading level={1} size="5xl">New season</Heading>
    <Button href="/collections/all" size="lg">Shop now</Button>
  </Stack>
</Hero>
```

```liquid
{% block 'hero', image: collections.frontpage.image, size: 'lg', align: 'center', scheme: 'dark' %}
  {% block 'stack', gap: '4', align: 'center' %}
    {% block 'heading', level: 1, size: '5xl' %}{{ shop.name }}{% endblock %}
    {% block 'button', href: routes.all_products_collection_url, size: 'lg' %}{{ 'home.shop_now' | t }}{% endblock %}
  {% endblock %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`. Actions: none. Confirm: none. Secret: none.

### Checker rules

- RP203: the image has `alt`, `width`, `height`. RP113 structure rule `hero-once` (warning, not error): more than one `.rp-hero` with an image in a document means two images with `fetchpriority="high"`.

### Acceptance tests

1. Tier 2: fixtures `default`, `image`, `invalid-enum-falls-back`, `escaping`, `class` conform in all four hosts with the masks above.
2. Tier 5: `size="full"` gives a root height equal to the viewport height (within 1 px) at 375 by 667 and 1280 by 800.
3. Tier 5: with `align="center"` the children column is horizontally centred (left and right offsets differ by at most 1 px).
4. Tier 5: the image covers the root box exactly (its bounding box equals the root's, within 0.5 px).
5. Tier 3: zero mutations when `ripple.js` loads.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/templates/index.liquid` (hero container with background image and LCP preload); `ripple/docs/research/base-theme.md` 3.1 item 5 (image loading decided at call sites; Hero fixes eager loading and priority itself); ledger 6.3 (`scheme` accepted by Hero), D-049, `05-commerce.md` 11.3.
- UNVERIFIED: `100svh` at the browser floor (Chrome 108, Safari 15.4, Firefox 101 by general knowledge; inside the floor if correct). SPIKE-06.

### Fallback (SPIKE-nn)

None.

---

## FeaturedCollection

| Field | Value |
|---|---|
| Id | `featured-collection` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none (`rp-carousel` when `layout="carousel"`) |
| Root element and class | `section` `.rp-featured-collection` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `grid`, `product-card`, `carousel`, `link` |
| Milestone | M4 |

### Purpose

A titled band of products from one collection, as a grid or as a carousel, with a "View all" link to the collection.

- Use when: merchandising a collection on the home page or any content page.
- Do not use when: rendering the collection page itself with filters and pagination (use blueprint `collection`: Grid and ProductCard inside the results region).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `FeaturedCollection` | `blocks/featured-collection.liquid` | `section` | `rp-featured-collection` | none | yes | none |
| header | none (printed by root) | same file | `div` | `rp-featured-collection-header` | none | yes | none |
| title | none (printed by root) | same file | `h2` (or `h1` to `h6` by `level`) | `rp-featured-collection-title` | none | yes | none |
| link | none (printed by root) | same file | `a` | `rp-featured-collection-link` | none | yes | none |
| items | none (printed by root) | same file | `div` (Grid) or `rp-carousel` (Carousel) | `rp-grid` or `rp-carousel` | per the embedded component | yes | Carousel: `<carousel>` and `<carousel>-list` |

Nesting rules: root contains `header` then `items`. `header` contains `title` then `link`. With `layout="grid"`, `items` is a Grid whose children are ProductCards (or the caller's children). With `layout="carousel"`, `items` is a Carousel (`10-components-interactive.md`) with one carousel item per product; children cannot replace the items in this layout.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `collection` | `collection` | object | `RippleCollection` (`05-commerce.md` 11.1); Liquid: a collection drop | none | yes | no | `title` text; `href` of `link` |
| `products` | none (reads `collection.products`) | object | `RippleProduct[]` | `[]` | no | no | default body: one ProductCard per product |
| `limit` | `limit` | number | integer 1 to 12 | `4` | no | no | number of products rendered (TSX: `products.slice(0, limit)`; Liquid: `for ... limit: limit`) |
| `layout` | `layout` | enum | `grid`, `carousel` | `grid` | no | no | `data-layout` on root; chooses the `items` component |
| `columns` | `columns` | scale | `1 2 3 4 5 6 12` | `2 lg:4` | no | yes | `data-columns` on the Grid (ignored for `carousel`) |
| `carousel` | `carousel` | id | any id | none | yes when `layout="carousel"` | no | `id` of the embedded Carousel |
| `level` | `level` | enum | `1 2 3 4 5 6` | `2` | no | no | the tag of `title` |
| `strings` | none | object | key `viewAll` | `"View all"` | no | no | TSX hosts only |

`products` has `hosts: ["html", "react", "remix"]`.

### Content model

`flow`, restricted - the default body of `items` is one ProductCard per product. With `layout="grid"`, children replace the ProductCards inside the Grid. With an empty product list and no children the component prints NOTHING (an empty merchandising band MUST NOT be shown).

### HTML contract

Fixture `default` (`collection: { title: "Featured", url: "/collections/featured" }`, children: `<p>Item</p>`):

```html
<section class="rp-featured-collection" data-layout="grid">
  <div class="rp-featured-collection-header">
    <h2 class="rp-featured-collection-title">Featured</h2>
    <a class="rp-featured-collection-link" href="/collections/featured">View all</a>
  </div>
  <div class="rp-grid" data-columns="2 lg:4" data-gap="4 md:6"><p>Item</p></div>
</section>
```

Fixture `default-body` (same collection, `products: [product.basic]`, `level: 3`, `columns: "2 md:3"`). The ProductCard subtree is the `default` fixture of ProductCard in `11-components-commerce.md` for `product.basic`; the shape printed here is the one of section 1.1:

```html
<section class="rp-featured-collection" data-layout="grid">
  <div class="rp-featured-collection-header">
    <h3 class="rp-featured-collection-title">Featured</h3>
    <a class="rp-featured-collection-link" href="/collections/featured">View all</a>
  </div>
  <div class="rp-grid" data-columns="2 md:3" data-gap="4 md:6">
    <article class="rp-product-card"><a class="rp-product-card-media" href="/products/tee"><img class="rp-image" src="https://cdn.shopify.com/s/files/1/0000/0001/files/tee.jpg?width=800" alt="Tee" width="800" height="1000" loading="lazy"></a><a class="rp-product-card-title" href="/products/tee">Tee</a><div class="rp-price"><span class="rp-price-current">$20.00</span></div></article>
  </div>
</section>
```

Fixture `carousel` (`layout: "carousel"`, `carousel: "featured"`, `products: [product.basic]`): root has `data-layout="carousel"`; `items` is:

```html
<rp-carousel class="rp-carousel" data-slot="rp-carousel" id="featured" role="group" aria-roledescription="carousel" aria-label="Featured">
  <button class="rp-icon-button" type="button" data-rp-part="prev" data-rp-js="inflow" aria-controls="featured-list" data-variant="ghost" data-size="md" aria-label="Previous" disabled><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
  <ul class="rp-carousel-viewport" id="featured-list" data-rp-part="viewport" tabindex="0">
    <li class="rp-carousel-item" data-rp-part="item"><article class="rp-product-card"><a class="rp-product-card-media" href="/products/tee"><img class="rp-image" src="https://cdn.shopify.com/s/files/1/0000/0001/files/tee.jpg?width=800" alt="Tee" width="800" height="1000" loading="lazy"></a><a class="rp-product-card-title" href="/products/tee">Tee</a><div class="rp-price"><span class="rp-price-current">$20.00</span></div></article></li>
  </ul>
  <button class="rp-icon-button" type="button" data-rp-part="next" data-rp-js="inflow" aria-controls="featured-list" data-variant="ghost" data-size="md" aria-label="Next"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
</rp-carousel>
```

The Carousel's `aria-label` is the collection title.

Fixture `empty` (`products: []`, no children): the reference HTML is the empty string.

Fixture `invalid-enum-falls-back` (`layout: "masonry"`, children as `default`): equal to `default`.

Fixture `responsive` (`columns: "1 sm:2 lg:4"`, children as `default`): the Grid has `data-columns="1 sm:2 lg:4"`.

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-featured-collection custom-a custom-b`.

Host-owned regions and masks: those of ProductCard (image `src`, `srcset`, money text) as defined in `11-components-commerce.md`; the Carousel upgrade allow-list of `10-components-interactive.md` applies to fixture `carousel`.

Kind note: the `default` fixture has no custom element, so `kind` is `static` (ledger 8.4). `dependencies.elements` is `["rp-carousel"]`, which makes the CLI install the Carousel component and the runtime define the element.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| none of its own | none | none | none | none |

Carousel state (`disabled` on the buttons) is owned by Carousel.

Upgrade allow-list (mutations permitted when the element upgrades): none of its own; Carousel's entry for the `next` button applies in fixture `carousel`.

### Behaviour with JavaScript

1. `layout="grid"`: none.
2. `layout="carousel"`: the behaviour of Carousel (`04-elements.md` 9.2): previous and next buttons page the list; `indexchange` is dispatched on the `rp-carousel` root.

### Behaviour without JavaScript

`grid`: identical. `carousel`: the list scrolls and snaps natively; the two buttons are invisible (`data-rp-js="inflow"`) and keep their space. Every product link and the "View all" link work. The component's level is `full` because every function of FeaturedCollection itself (seeing the products, following links) works; the embedded Carousel keeps its own level `degraded`.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `indexchange` | the embedded `rp-carousel` (carousel layout only) | per Carousel | none on FeaturedCollection; listen on the element |

### Accessibility

- Pattern: native `<section>` with a heading; `checkPattern`: none.
- Accessible name: none on the root. The text of `link` is the locale key `ripple.featured-collection.view_all` ("View all"); the heading that precedes it in reading order says which collection it belongs to. No `aria-label` is printed.
- Focus: none.
- Announcements: None.

| Key | Action |
|---|---|
| Tab | Through the links (and, in carousel layout, the viewport and buttons per Carousel) |

### Styling

- File: `components/featured-collection/featured-collection.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--text-2xl`, `--text-sm`, `--font-heading`, `--color-foreground`, `--color-link`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-featured-collection-gap` | `calc(var(--spacing) * 6)` | Gap between `header` and `items` |

| Modifier selector | Sets |
|---|---|
| none | none (`data-layout` only selects the embedded component; it has no CSS of its own) |

Required rules: root `display: flex; flex-direction: column; gap: var(--rp-featured-collection-gap)`; `header` `display: flex; align-items: baseline; justify-content: space-between; gap: calc(var(--spacing) * 4)`; `title` `margin: 0; font-family: var(--font-heading); font-size: var(--text-2xl)`; `link` `font-size: var(--text-sm); color: var(--color-link); white-space: nowrap; min-block-size: 1.5rem; display: inline-flex; align-items: center`. The root has no inline padding: place it inside a Container.

### Host notes

- HTML: copy the fixture.
- React: `export function FeaturedCollection(props: FeaturedCollectionProps): JSX.Element | null`. No hook. Returns `null` for the empty case.
- Remix: none of its own (Carousel prints its own `data-rmx-*`).
- Liquid: block `featured-collection`; renders `rp-product-card` (and, for the carousel layout, the Carousel markup through the snippets `10-components-interactive.md` provides). Schema settings: `layout` (select). Locale keys: `ripple.featured-collection.name`, `ripple.featured-collection.view_all` ("View all").

```tsx
<FeaturedCollection collection={collection} products={products} limit={4} />
```

```liquid
{% block 'featured-collection', collection: collections.frontpage, limit: 4 %}{% endblock %}
```

Liquid default body for the grid layout (inside the block file, in the `{% else %}` branch of `{% if content != blank %}`):

```liquid
{%- for product in collection.products limit: limit -%}
  {% render 'rp-product-card', product: product %}
{%- endfor -%}
```

Liquid `limit` guard (before first use): `assign limit = limit | default: 4`.

### Commerce

None. (ProductCard is static; FeaturedCollection binds no store and requests no refresh.)

### Agent surface

`accessibility-tree` for the grid layout. In carousel layout the bridge additionally sees the `rp-carousel` primitive through the Carousel component. Actions: none of its own. Confirm: none. Secret: none.

### Checker rules

- RP113 structure rule `featured-collection-carousel-needs-id` (source layer): `layout="carousel"` without `carousel` is an error.
- RP101 (unknown `layout` value, invalid `columns` token), RP114 (the Carousel id is unique in the document).

### Acceptance tests

1. Tier 2: fixtures `default`, `default-body`, `carousel`, `empty`, `invalid-enum-falls-back`, `responsive`, `class` conform in all four hosts (ProductCard masks applied).
2. Tier 3: fixture `carousel`: zero mutations outside the Carousel allow-list; other fixtures: zero mutations.
3. Tier 5: grid layout shows 2 columns at 375 px and 4 columns at 1280 px with the default `columns`.
4. Tier 6: with JavaScript disabled, in carousel layout the viewport scrolls horizontally (`scrollWidth > clientWidth` with 6 products at 375 px) and both buttons have computed `visibility: hidden`.
5. Tier 6: clicking the "View all" link navigates to the collection URL.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/blocks/featured-collection.liquid`; `ripple/theme/templates/index.liquid` (featured collection grid written out at the call site); `ripple/docs/research/base-theme.md` 3.1 item 3 (product card written six times); ledger 8.4 (`layout="carousel"`), 8.7 (ProductGrid cut in favour of Grid and FeaturedCollection); `04-elements.md` 10.9.
- UNVERIFIED: the ProductCard and Carousel markup printed above (owned by docs 11 and 10; section 1.1).

### Fallback (SPIKE-nn)

None.

---

---

## 2. Blueprints: conventions

A blueprint is a set of starting files for one page type. `ripple add --blueprint <id>` copies them into the project (`07-manifest-registry-cli.md` section 4.4). After the copy the project owns them: `ripple upgrade` never changes an edited blueprint file. A blueprint contains no CSS and no custom element code; it only composes components.

### 2.1 Files and targets

Source directory: `blueprints/<id>/`. It holds `blueprint.json` and one directory per host. `<blueprint dir>` in this document means the target directory of the host: `src/pages` (react), `app/pages` (remix), `pages` (html). Liquid files go to the theme root.

| Blueprint | `route` | liquid target | react and remix target (under `<blueprint dir>`) | html target |
|---|---|---|---|---|
| `layout` | none | `layout/theme.liquid` | `layout.tsx`, `types.ts`, `lib/document.ts`, `lib/menu.ts`, `lib/locale-route.ts`, `lib/newsletter-route.ts` | `pages/layout.html` |
| `home` | `/` | `templates/index.liquid` | `home.tsx` | `pages/home.html` |
| `collection` | `/collections/:handle` | `templates/collection.liquid` | `collection.tsx` | `pages/collection.html` |
| `collections-list` | `/collections` | `templates/list-collections.liquid` | `collections-list.tsx` | `pages/collections-list.html` |
| `product` | `/products/:handle` | `templates/product.liquid` | `product.tsx` | `pages/product.html` |
| `search` | `/search` | `templates/search.liquid` | `search.tsx` | `pages/search.html` |
| `cart` | `/cart` | `templates/cart.liquid` | `cart.tsx` | `pages/cart.html` |
| `blog` | `/blogs/:blog` | `templates/blog.liquid` | `blog.tsx` | `pages/blog.html` |
| `article` | `/blogs/:blog/:article` | `templates/article.liquid` | `article.tsx` | `pages/article.html` |
| `page` | `/pages/:handle` | `templates/page.liquid` | `page.tsx` | `pages/page.html` |
| `contact` | `/pages/contact` | `templates/page.contact.liquid` | `contact.tsx`, `lib/contact-route.ts` | `pages/contact.html` |
| `not-found` | none | `templates/404.liquid` | `not-found.tsx` | `pages/not-found.html` |
| `password` | `/password` | `templates/password.liquid`, `layout/password.liquid` | `password.tsx` | `pages/password.html` |
| `gift-card` | none | `templates/gift_card.liquid` | `gift-card.tsx` | `pages/gift-card.html` |

Liquid template file names are the names the platform resolves (`ripple/theme/templates/` contains `index.liquid`, `collection.liquid`, `list-collections.liquid`, `product.liquid`, `search.liquid`, `cart.liquid`, `blog.liquid`, `article.liquid`, `page.liquid`, `404.liquid`, `password.liquid`, `gift_card.liquid`). `templates/page.contact.liquid` is an alternate template; the merchant assigns it to the contact page in the admin.

File records in `blueprint.json` (`07-manifest-registry-cli.md`, `#/$defs/file`): `type` is `blueprint`, `mode` is `owned`, `generated` is `false` for liquid, react and remix and `true` for html (2.3, rule H-1). `key` is `template` for the page file, `layout` for `layout/password.liquid`, and the file's base name without extension for `lib/` files (`document`, `menu`, `locale-route`, `newsletter-route`, `contact-route`) and `types` for `types.ts`.

Complete `blueprints/product/blueprint.json` (every other blueprint follows this shape; `components` and `regions` are the lists given in that blueprint's "Components used" and "Regions"):

```json
{
  "name": "product",
  "title": "Product page",
  "summary": "Gallery, title, price, variant picker, add to cart, description and recommendations.",
  "route": "/products/:handle",
  "components": ["add-to-cart-button", "container", "grid", "heading", "price", "product-form", "product-gallery", "product-recommendations", "rich-text", "stack", "text", "variant-picker"],
  "regions": ["rp-product-buy", "rp-product-media", "rp-product-recommendations"],
  "files": {
    "html": [
      { "key": "template", "source": "blueprints/product/html/product.html", "target": "pages/product.html", "type": "blueprint", "mode": "owned", "generated": true }
    ],
    "react": [
      { "key": "template", "source": "blueprints/product/react/product.tsx", "target": "src/pages/product.tsx", "type": "blueprint", "mode": "owned", "generated": false }
    ],
    "remix": [
      { "key": "template", "source": "blueprints/product/remix/product.tsx", "target": "app/pages/product.tsx", "type": "blueprint", "mode": "owned", "generated": false }
    ],
    "liquid": [
      { "key": "template", "source": "blueprints/product/liquid/templates/product.liquid", "target": "templates/product.liquid", "type": "blueprint", "mode": "owned", "generated": false }
    ]
  }
}
```

### 2.2 Rules for every blueprint

- **BP-1** A blueprint file contains only: Ripple component calls; the raw elements `html`, `head`, `body`, `main`, `form`, `input type="hidden"`, `rp-view-event`, `script type="application/json"`; and elements carrying `data-rp-region`. It contains no `class` attribute with a value that does not start with `rp-`, no `style` attribute, and no `<style>` element.
- **BP-2** Exactly one `<main>` exists per document. It is printed by `layout` with `id="main"` and `tabindex="-1"`. Page blueprints MUST NOT print `<main>`.
- **BP-3** Each page blueprint prints exactly one Heading with `level` 1. Heading levels never skip (after `1` comes `2`).
- **BP-4** Spacing uses only the rhythm of `08-agent-kit-and-evals.md`: a page band is `Container` with `py="12 md:20"`; the gap between areas of a page is `gap="8 md:12"`; the gap inside a group is `2`, `3` or `4`; a card grid uses `gap="4 md:6"`.
- **BP-5** Card grids use `Grid` with `as="ul"` and one `<li>` per card, `columns="2 lg:4"` for products, `columns="1 sm:2 lg:3"` for collections and articles. (`<li>` is the one raw element allowed in addition to BP-1; it carries no attribute.)
- **BP-6** Every string a Liquid blueprint prints is a locale key `ripple.blueprints.<blueprint id>.<key>` in `locales/en.default.json` (Ledger issues, item 9). TSX blueprints print the English text as a literal. The key tables in each blueprint are complete.
- **BP-7** A blueprint MUST work with JavaScript disabled to the level stated in its "No-JS behaviour". Nothing a buyer needs to read or submit may exist only inside a Dialog, Drawer or Popover.
- **BP-8** A region element (`data-rp-region`) MUST NOT be, or contain, a `<dialog>`, and MUST NOT contain the commerce root whose `data-rp-refresh` names it (`05-commerce.md` section 8.1).
- **BP-9** A page blueprint MUST NOT read the cart, the menus or the shop. Those belong to `layout`. Exception: `cart`, which reads the cart.
- **BP-10** Images above the fold (Hero image, the first ProductGallery image) are `loading="eager"` with `fetchPriority="high"`; every other image keeps the default `lazy`.
- **BP-11** View events (`05-commerce.md` section 12): `product` prints none (ProductForm prints `product_viewed`); `collection` prints `collection_viewed`; `search` prints `search_viewed` when terms are present; `cart` prints `cart_viewed`. The element is the last child the page blueprint prints. Payload field names are owned by `05-commerce.md`; where that document does not list them they are marked UNVERIFIED in the blueprint.

### 2.3 Host forms

The **React file is the reference TSX**. It is a set of pure functions from props to markup: no hooks, no data fetching, no router import. The project's route code loads the data (2.5) and renders `<Layout {...layout}><XPage {...page} /></Layout>`.

The **Remix file** is derived from the React file by these rules, applied in order. Nothing else changes.

- **R-1** `import { A, B } from "__PKG__/react"` becomes `import { A, B } from "__PKG__/remix"`. `import type { ReactNode } from "react"` becomes `import type { Handle, RemixNode } from "remix/component"`; the type `ReactNode` becomes `RemixNode`.
- **R-2** `export function XPage(props: XPageProps) { const { a, b } = props; return (...); }` becomes `export function XPage(handle: Handle<XPageProps>) { return () => { const { a, b } = handle.props; return (...); }; }` (`06-bindings.md` rules X-1, X-2).
- **R-3** On raw elements, `className` becomes `class`, `htmlFor` becomes `for`, `tabIndex` becomes `tabindex` (`06-bindings.md` rule X-12). Ripple component props keep their names.
- **R-4** `key={...}` on list items stays.
- **R-5** Blueprint files print no `data-rmx-*` attribute. `data-rmx-document` (`06-bindings.md` rule X-5) is printed inside the Remix bindings of CheckoutButton, AccountLink, the cart components, LocaleSelector and NewsletterForm. The one raw `<form>` a blueprint prints (`contact`, `password`) carries `data-rmx-document` in the Remix file; this is stated in those blueprints.
- **R-6** A region owned by a component (cart, product buy area, filters, recommendations, predictive results) is a named blocking `<Frame>` printed by that component's Remix binding (`06-bindings.md` rule X-10). A region owned by a blueprint (`rp-collection-results`, `rp-collection-toolbar`, `rp-search-results`, `rp-product-buy`) is a plain element with `data-rp-region`; with the reference `reloadFrames` of `05-commerce.md` section 8.3, a URL-driven refresh on Remix is a document navigation that Remix reconciles into the page, so no Frame route is needed (Ledger issues, item 10).

The **html file** is generated:

- **H-1** `blueprints/<id>/html/<id>.html` is the output of rendering the React file with the sample data of 2.5 through `renderDocument` (2.6), pretty-printed by the fixture printer of `02-html-contract.md`. `pnpm gen` writes it; a hand edit fails the generation check (`07-manifest-registry-cli.md`, G-rules). Page files contain the full document, so each one opens in a browser by itself.
- **H-2** In the html file, `initialCart` is omitted from the config element and the cart count part is printed as `hidden` with text `0` (`05-commerce.md` section 10.1 rule 4).

The **Liquid file** is hand-written and is given in full in each blueprint. Rules:

- **L-A** Blueprint Liquid files are templates and layouts, so they MAY use `{% block %}` and `{% partial %}` (`06-bindings.md`; `ripple/docs/research/liquid-blocks-partials.md` section 2.2). They MUST NOT use `{% section %}`, `{% sections %}`, `{% content_for %}`, `{% include %}` or JSON templates.
- **L-B** Partial names are exactly the region names (`06-bindings.md` rule L-2). A partial name is declared at most once per rendered page. Because `layout/theme.liquid` declares `rp-cart-lines` and `rp-cart-summary` inside the CartDrawer and `templates/cart.liquid` declares the same two names, the layout MUST NOT render the CartDrawer when `template.name == 'cart'` (see `layout`, Structure). The same rule is applied on TSX hosts through the `cartPage` prop so that all hosts print the same page.
- **L-C** Liquid objects are passed to blocks unchanged. A block param that takes text receives it already translated: `{% block 'heading', level: 1 %}{{ 'ripple.blueprints.cart.title' | t }}{% endblock %}`.
- **L-D** Blueprint files use the tag and filter subset of `06-bindings.md` rule L-13 plus exactly these: tags `block`, `partial`, `paginate`, `form`, `layout`; objects `content_for_layout`, `template`, `request`, `paginate`, `form`; filters `date`, `json`, `money`, `strip`. The shim (`13-testing.md`) MUST implement them (section 3, X-5 and X-6).

### 2.4 Calls into documents 10 and 11

`10-components-interactive.md` and `11-components-commerce.md` did not exist when this document was written. Blueprints call their components with the signatures below. These are assumptions: the owning document wins, and test BT-1 (2.8) fails until blueprint files match the real signatures. An implementer who finds a difference MUST change the blueprint file, not the component.

| Component | TSX call | Liquid call |
|---|---|---|
| Dialog | `<Dialog id="x"><DialogTitle>...</DialogTitle><DialogBody>...</DialogBody><DialogClose /></Dialog>` | `{% block 'dialog', id: 'x' %}{% block 'dialog-title', dialog: 'x' %}...{% endblock %}{% block 'dialog-body' %}...{% endblock %}{% block 'dialog-close', dialog: 'x' %}{% endblock %}{% endblock %}` |
| Toast | `<Toast />` (prints the empty `ui-toast-region` of `04-elements.md` section 10.6) | `{% block 'toast' %}{% endblock %}` |
| ProductCard | `<ProductCard product={product} />` | `{% block 'product-card', product: product %}{% endblock %}` |
| CollectionCard | `<CollectionCard collection={collection} />` | `{% block 'collection-card', collection: collection %}{% endblock %}` |
| ArticleCard | `<ArticleCard article={article} />` | `{% block 'article-card', article: article %}{% endblock %}` |
| Price | `<Price price={variant.price} compareAtPrice={variant.compareAtPrice} />` | `{% block 'price', price: variant.price, compare_at_price: variant.compare_at_price %}{% endblock %}` |
| ProductGallery | `<ProductGallery id="product-gallery" media={product.media} />` | `{% block 'product-gallery', id: 'product-gallery', product: product %}...{% endblock %}` |
| VariantPicker | `<VariantPicker product={product} variant={variant} />` | `{% block 'variant-picker', product: product, variant: variant %}{% endblock %}` |
| ProductForm | `<ProductForm id="product-form" product={product} variant={variant} />` (default body: QuantityInput and AddToCartButton) | `{% block 'product-form', id: 'product-form', product: product, variant: variant %}{% endblock %}` |
| ProductRecommendations | `<ProductRecommendations id="recommendations" product={product} />` | `{% block 'product-recommendations', id: 'recommendations', product: product %}...{% endblock %}` |
| CartDrawer | `<CartDrawer id="cart-drawer" cart={cart} />` | `{% block 'cart-drawer', id: 'cart-drawer' %}...{% endblock %}` |
| CartLines | `<CartLines id="cart" cart={cart} />` | `{% block 'cart-lines', id: 'cart' %}...{% endblock %}` |
| CartSummary | `<CartSummary cart={cart} />` | `{% block 'cart-summary' %}...{% endblock %}` |
| CartNote | `<CartNote cart={cart} />` | `{% block 'cart-note', cart_form: 'cart-form' %}{% endblock %}` |
| DiscountCode | `<DiscountCode cart={cart} />` | `{% block 'discount-code' %}{% endblock %}` |
| CheckoutButton | `<CheckoutButton href={cart.checkoutUrl}>Check out</CheckoutButton>` | `{% block 'checkout-button', cart_form: 'cart-form' %}...{% endblock %}` |
| Filters | `<Filters id="filters" filters={filters} action={url} />` | `{% block 'filters', id: 'filters', filters: collection.filters, action: collection.url %}...{% endblock %}` |
| FilterChips | `<FilterChips filters={filters} clearUrl={url} />` | `{% block 'filter-chips', filters: collection.filters, clear_url: collection.url %}{% endblock %}` |
| SortSelect | `<SortSelect options={sortOptions} value={sort} action={url} />` | `{% block 'sort-select', options: collection.sort_options, value: sort_by, action: collection.url %}{% endblock %}` |
| SearchForm | `<SearchForm action="/search" defaultValue={terms} />` | `{% block 'search-form', default_value: search.terms %}{% endblock %}` |
| PredictiveSearch | `<PredictiveSearch id="predictive-search" action="/search" />` | `{% block 'predictive-search', id: 'predictive-search' %}...{% endblock %}` |

Assumption **A-1** (Liquid regions). A block file cannot contain `{% partial %}` (ledger D-037; `06-bindings.md`). Therefore a commerce block that owns a region prints `{{ content }}` at the position of the region, and `11-components-commerce.md` ships one snippet per owned region, named `rp-<component id>-region`, that prints the region root (the element with `data-rp-region`) and its contents. The template passes the partial as the block's content:

```liquid
{% block 'cart-lines', id: 'cart' %}
  {% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-region', id: 'cart' %}{% endpartial %}
{% endblock %}
```

The component-owned region snippets assumed are: `rp-cart-lines-region` (`rp-cart-lines`), `rp-cart-summary-region` (`rp-cart-summary`), `rp-product-gallery-region` (`rp-product-media`), `rp-product-recommendations-region` (`rp-product-recommendations`), `rp-filters-region` (`rp-collection-filters`), `rp-predictive-search-region` (`rp-predictive-results`). CartDrawer contains both cart regions; its content is the two partials in order (see `layout`).

Assumption **A-2**. On TSX hosts the same components print their regions themselves; the blueprint passes data only.

Assumption **A-3**. `ProductDetail`, `FilterData`, `SortOption` below are the prop types this document assumes for `product`, `filters` and `sortOptions`. They are declared in the blueprint files (not exported by the package) so that a mismatch with doc 11 is a type error in one place:

```ts
import type { RippleImage, RippleProduct, RippleVariant } from "__PKG__";

export interface ProductDetail extends RippleProduct {
  descriptionHtml: string;
  media: Array<{ id: string; image: RippleImage }>;
  options: Array<{ name: string; values: string[] }>;
  variants: Array<RippleVariant & { selectedOptions: Array<{ name: string; value: string }> }>;
}
export interface FilterData {
  id: string;
  label: string;
  type: "LIST" | "PRICE_RANGE" | "BOOLEAN";
  values: Array<{ id: string; label: string; count: number; input: string; active: boolean }>;
}
export interface SortOption { value: string; label: string }
export interface PageInfo { previousUrl: string | null; nextUrl: string | null }
```

### 2.5 Data loading on the hydrogen backend

- Each blueprint's "Data requirements" gives one GraphQL document for the Storefront API. The React and Remix files export it as a string constant named `<BLUEPRINT>_QUERY` (for example `PRODUCT_QUERY`) next to the page function, plus the type `<Name>PageProps`. The project's route code runs the query with its Storefront client and maps the result to the props. How the client is created is owned by `05-commerce.md` section 10; the method that runs a query is `storefrontClient.query(document, { variables })` in the Hydrogen skills (`hydrogen/packages/hydrogen/skills/`), UNVERIFIED in source in this session.
- Every query takes `$country: CountryCode` and `$language: LanguageCode` and carries `@inContext(country: $country, language: $language)`; the values come from `requestContext.locale` (`hydrogen/packages/hydrogen/skills/hydrogen-markets/SKILL.md`).
- `url` fields of resources are computed by the route code from its route templates (`05-commerce.md` section 11.1). With no locale prefix: `/products/<handle>`, `/collections/<handle>`, `/blogs/<blog handle>/<article handle>`, `/pages/<handle>`.
- A root field that returns `null` (unknown handle) MUST produce a 404 response that renders the `not-found` blueprint inside `layout`.
- UNVERIFIED: that mock.shop serves `menu`, `blog`, `articles`, `page`, `localization` and `predictiveSearch`. Each blueprint states what it prints when its data is empty, and every TSX blueprint MUST render without throwing when a list is empty.
- Sample data for H-1 and for tests is `blueprints/_sample/<id>.json` (one object per blueprint: the props of the page function) and `blueprints/_sample/layout.json`. `13-testing.md` owns the loader. The sample MUST use the fixture resources of section 1.6 and the product, collection and cart fixtures of `11-components-commerce.md`.

### 2.6 Document shell and locale route (hydrogen backend)

The document shell on TSX hosts is a string function, not a component, because the Hydrogen script tags are HTML strings (`renderShopifyScriptTags(...).join("")`, `05-commerce.md` section 10.1 rule 2) and neither React nor Remix can print raw sibling tags into `<head>`. `<blueprint dir>/lib/document.ts` (complete; identical for react, remix and html):

```ts
// blueprints/layout/<host>/lib/document.ts
export interface DocumentParts {
  /** BCP 47 language tag, for example "en" or "fr-CA". */
  lang: string;
  title: string;
  description?: string;
  /** Stylesheet URLs, in order. */
  stylesheets: string[];
  /** Raw HTML placed in <head>: the Hydrogen script tags, then anything the host needs (import map, preloads). */
  head: string;
  /** JSON-serialisable CommerceOptions (05-commerce.md section 4.2). */
  commerce: Record<string, unknown>;
  /** Module script URLs, in order. Printed after the config element. */
  scripts: string[];
  /** The rendered <Layout> markup. */
  body: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderDocument(parts: DocumentParts): string {
  const commerce = JSON.stringify(parts.commerce).replace(/</g, "\\u003c");
  const description =
    parts.description === undefined || parts.description === ""
      ? ""
      : `<meta name="description" content="${escapeHtml(parts.description)}">`;
  const stylesheets = parts.stylesheets
    .map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}">`)
    .join("");
  const scripts = parts.scripts
    .map((src) => `<script type="module" src="${escapeHtml(src)}"></script>`)
    .join("");
  return (
    `<!doctype html>` +
    `<html lang="${escapeHtml(parts.lang)}" data-rmx-preserve-attrs="style">` +
    `<head>` +
    `<meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${escapeHtml(parts.title)}</title>` +
    description +
    stylesheets +
    parts.head +
    `<script type="application/json" id="rp-commerce">${commerce}</script>` +
    scripts +
    `</head>` +
    `<body>${parts.body}</body>` +
    `</html>`
  );
}
```

Rules:

- **DS-1** `stylesheets` is `["/ripple/tokens.css", "/ripple/ripple.css"]` unless the project bundles CSS itself (`03-styling-and-tokens.md`).
- **DS-2** `scripts` per host: html `["/ripple/ripple.js"]`; remix `["/ripple/ripple.js", <client entry URL>]` (`06-bindings.md` rule X-11); react `[<client entry URL>]` (the entry imports `<pkg>/commerce` and calls `configureCommerce` before `hydrateRoot`, `05-commerce.md` section 10.3).
- **DS-3** `commerce.host` MUST equal the host. `commerce.initialCart` is set only on responses that are not publicly cached (`05-commerce.md` section 10.1 rules 3 and 4).
- **DS-4** `data-rmx-preserve-attrs="style"` on `<html>` is printed on every TSX host (`06-bindings.md` rule X-6). It is inert outside Remix and is removed by the canonicaliser.
- **DS-5** React: the client entry hydrates the body: `hydrateRoot(document.body, <Layout {...layout}><XPage {...page} /></Layout>)`. The server renders the same tree with `renderToString` and passes the string as `body`. UNVERIFIED: hydration of `document.body` when scripts append nodes to `<body>` before hydration; see "Fallback for DS-5" below.
- **DS-6** Remix: `body` is `await renderToString(<Layout .../>)` from `remix/component/server` (`ripple/docs/research/remix-3.md` section 5). UNVERIFIED: that the Remix client runtime (`run()`) accepts a document whose shell was not produced by a Remix component. If it does not, the project writes the shell as a Remix component following `ripple/docs/research/remix-3.md` section 8.2 and MUST still print, in this order: the stylesheets, the Hydrogen script tags, the config element, the module scripts.

#### Fallback for DS-5

No ledger spike covers this (Ledger issues, item 12). The check is test LT-10. If hydrating `document.body` logs hydration errors, `renderDocument` prints `<body><div id="rp-root">${parts.body}</div></body>` and the entry calls `hydrateRoot(document.getElementById("rp-root")!, ...)`. No other file changes; SkipLink remains the first focusable element.

**Locale route.** LocaleSelector posts `country_code`, `locale_code` and `return_to` to `/api/locale` (LocaleSelector, HTML contract). `<blueprint dir>/lib/locale-route.ts` (complete; react and remix; framework-neutral):

```ts
// blueprints/layout/<host>/lib/locale-route.ts
import {
  getLocalizedHref,
  getSupportedLocales,
  matchLocale,
  type ShopifyI18n,
  type ShopifyLocale,
} from "@shopify/hydrogen";

function safePath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  return value;
}

function field(form: FormData, name: string): string | null {
  const value = form.get(name);
  return typeof value === "string" && value !== "" ? value.toUpperCase() : null;
}

/**
 * Handles POST /api/locale. Answers 303 to the page named by `return_to`, in the chosen locale.
 * Mount it for the POST method only. It never throws for bad input: unknown values keep the current locale.
 */
export async function handleLocalePost(request: Request, i18n: ShopifyI18n): Promise<Response> {
  const form = await request.formData();
  const returnTo = safePath(form.get("return_to"));
  const current = matchLocale(returnTo, i18n);
  const country = field(form, "country_code") ?? current.country;
  const language = field(form, "locale_code") ?? current.language;
  const supported: readonly ShopifyLocale[] = getSupportedLocales(i18n);
  const target =
    supported.find((locale) => locale.country === country && locale.language === language) ??
    supported.find((locale) => locale.country === country) ??
    supported.find((locale) => locale.language === language) ??
    { country: current.country, language: current.language };
  const location = getLocalizedHref(returnTo, { i18n, locale: target });
  return new Response(null, { status: 303, headers: { location } });
}
```

Evidence: `hydrogen/packages/hydrogen/src/core/i18n/href.ts` (`getLocalizedHref(href, { i18n, locale })`; pathname routing returns a path, domain routing an absolute URL; throws for an unsupported locale, which cannot happen here because `target` comes from `getSupportedLocales` or from `matchLocale`), `match.ts` (`matchLocale(source, i18n)` accepts a pathname string), `define.ts` (`getSupportedLocales(i18n)`), `types.ts` (`ShopifyLocale = { language, country }`). The four names are exported from the package root (`hydrogen/packages/hydrogen/src/core/index.ts`). Not run.

Rules:

- **LR-1** The response is a full page load (303 then GET). The route MUST NOT answer JSON (`hydrogen/packages/hydrogen/skills/hydrogen-markets/SKILL.md`: a locale change needs a new request context).
- **LR-2** The route MUST be mounted before any middleware that reads the body, or MUST receive a request whose body is unread.
- **LR-3** The lists passed to LocaleSelector are built from `getSupportedLocales(i18n)`: one `countries` entry per distinct `country` and one `languages` entry per distinct `language`; `current` is true for the values of `requestContext.locale`. Display names come from the Storefront API `localization { availableCountries { isoCode name currency { isoCode symbol } } availableLanguages { isoCode endonymName } }`, filtered to the supported codes (field names UNVERIFIED against the schema in this session). `currency` text is `<isoCode> <symbol>`.

### 2.7 Newsletter and contact routes (hydrogen backend)

The Storefront API has no newsletter-subscription or contact-form mutation that is verified in this session. The default path is:

- NewsletterForm posts `email` to `/api/newsletter`. `<blueprint dir>/lib/newsletter-route.ts` validates the address and calls a function the project supplies.
- The contact form posts `name`, `email`, `message` to `/api/contact`. `<blueprint dir>/lib/contact-route.ts` does the same.

`<blueprint dir>/lib/newsletter-route.ts` (complete):

```ts
// blueprints/layout/<host>/lib/newsletter-route.ts
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Same-origin path of the Referer header, without the newsletter status param. Falls back to "/". */
function returnPath(request: Request): URL {
  const origin = new URL(request.url).origin;
  const referer = request.headers.get("referer");
  let url = new URL("/", origin);
  if (referer !== null) {
    try {
      const parsed = new URL(referer);
      if (parsed.origin === origin) url = parsed;
    } catch {
      // keep "/"
    }
  }
  url.searchParams.delete("newsletter");
  return url;
}

/**
 * Handles POST /api/newsletter. `subscribe` is supplied by the project and stores the address
 * (for example with the Storefront API `customerCreate` mutation with `acceptsMarketing: true`, or an email service).
 * It MUST throw when the address was not stored.
 * Answers 303 to the referring page with `?newsletter=success` or `?newsletter=error` and the fragment `#<formId>`.
 */
export async function handleNewsletterPost(
  request: Request,
  subscribe: (email: string) => Promise<void>,
  formId = "newsletter",
): Promise<Response> {
  const form = await request.formData();
  const raw = form.get("email");
  const email = typeof raw === "string" ? raw.trim() : "";
  let status: "success" | "error" = "error";
  if (EMAIL.test(email) && email.length <= 254) {
    try {
      await subscribe(email);
      status = "success";
    } catch {
      status = "error";
    }
  }
  const url = returnPath(request);
  url.searchParams.set("newsletter", status);
  url.hash = formId;
  return new Response(null, {
    status: 303,
    headers: { location: `${url.pathname}${url.search}${url.hash}` },
  });
}

/** Reads the status for <NewsletterForm status={...}> from the request URL. */
export function newsletterStatus(request: Request): "idle" | "success" | "error" {
  const value = new URL(request.url).searchParams.get("newsletter");
  return value === "success" || value === "error" ? value : "idle";
}
```

Rules:

- **NR-1** The address MUST NOT be put in the redirect URL. After an error the field is empty (`defaultValue` is not passed).
- **NR-2** `subscribe` is project code. This document does not specify it. UNVERIFIED: that `customerCreate` with `acceptsMarketing` subscribes a buyer without creating a usable account password flow; the project decides.
- **NR-3** A project that does not supply `subscribe` MUST remove NewsletterForm from its `layout` file.

`<blueprint dir>/lib/contact-route.ts` is specified with the `contact` blueprint.

### 2.8 Acceptance tests shared by every blueprint

Each blueprint's "Acceptance tests" lists only what it adds to these. `<page>` is the blueprint rendered inside `layout` with the sample data of 2.5; on Liquid, rendered by the shim of `13-testing.md` with the matching drops.

- **BT-1** (tier 1) The react and remix files type-check (`tsc --noEmit`) against the generated bindings; the Liquid file passes Theme Check with the Ripple configuration (`06-bindings.md` section 8) and renders in the shim without an error.
- **BT-2** (tier 2) For each host, `<page>` passes `ripple check` with zero errors and the contract lint of `02-html-contract.md` section 14 with zero errors.
- **BT-3** (tier 2) After canonicalisation with the masks of the embedded components, the `<main>` subtree of the react, remix and html outputs is equal; the Liquid output is equal after additionally applying the masks listed in the blueprint.
- **BT-4** (tier 2) The document contains exactly one `main`, one `h1`, one `header.rp-header`, one `footer.rp-footer`; every `id` is unique; every `href="#x"`, `data-rp-open`, `commandfor`, `popovertarget`, `for`, `aria-labelledby`, `aria-describedby` and `form` attribute names an existing id.
- **BT-5** (tier 2) Every `data-rp-refresh` name has a `[data-rp-region]` element with that name in the document; every region name listed in the blueprint's "Regions" is present; on Liquid every such name is also a `{% partial %}` in the template or the layout and is declared once.
- **BT-6** (tier 6, JavaScript disabled) axe reports zero violations of the rule set of `13-testing.md`; each step of the blueprint's "No-JS behaviour" list succeeds.
- **BT-7** (tier 5) With JavaScript enabled, no console error or warning is logged during load, and no element matching `:not(:defined)` remains 2 seconds after `load`.
- **BT-8** (tier 8) Visual snapshots at widths 375, 768 and 1280 match the reference; no horizontal scroll bar at any of the three widths.
- **BT-9** (tier 1) A script confirms rule BP-1 on the source files: no `style=`, no `<style`, no `class` or `className` value outside `rp-`.

---

## Blueprint: `layout`

### Purpose

The document shell that every storefront page is rendered in: skip link, announcement bar, header, the `<main>` element, footer with newsletter form and locale selector, and the overlays that any page can open (cart drawer, mobile navigation, search dialog, toast region).

### Regions

`rp-cart-lines`, `rp-cart-summary` (inside CartDrawer; absent on the cart page), `rp-predictive-results` (inside the search dialog).

### Components used

`account-link`, `announcement-bar`, `cart-drawer`, `cart-link`, `dialog`, `footer`, `header`, `icon`, `icon-button`, `link-list`, `locale-selector`, `logo`, `mobile-nav`, `navigation-menu`, `newsletter-form`, `predictive-search`, `skip-link`, `text`, `toast`.

Ledger 8.5 also lists Announcer. `09-components-foundation.md` (Ledger issues there, item 15) fixed that Announcer exists only inside dialogs and commerce roots and that the layout prints none; this blueprint follows it (Ledger issues, item 11).

### Structure

Order of the children of `<body>`, identical in every host:

```text
body
├─ SkipLink                 href="#main"
├─ AnnouncementBar          only when an announcement text exists
├─ Header                   sticky; default body; mobileNav="mobile-nav"; searchDialog="search-dialog";
│                           cartDrawer="cart-drawer" (omitted on the cart page)
├─ main#main[tabindex=-1]   the page blueprint
├─ Footer                   custom children:
│   ├─ LinkList             id="footer-menu", vertical, footer menu
│   ├─ NewsletterForm       id="newsletter"
│   ├─ LocaleSelector       id="footer-locale", side="top"   (prints nothing with one locale)
│   ├─ Text                 copyright line
│   └─ LinkList             horizontal, policies            (only when policies exist)
├─ MobileNav                id="mobile-nav"
├─ Dialog                   id="search-dialog"; title; PredictiveSearch id="predictive-search"; close
├─ CartDrawer               id="cart-drawer"                 (omitted on the cart page)
└─ Toast                    the empty toast region
```

Overlays come after the footer so that no `<dialog>` is inside `<header>`, `<main>` or `<footer>`, and none is inside a region. Responsive behaviour is entirely inside the components: Header hides the navigation below `lg` and shows the menu opener (Header, HTML contract).

**React** (`blueprints/layout/react/layout.tsx`, complete):

```tsx
import type { ReactNode } from "react";
import type { RippleCart, RippleMenu, RippleShop } from "__PKG__";
import {
  AnnouncementBar,
  CartDrawer,
  Dialog,
  DialogBody,
  DialogClose,
  DialogTitle,
  Footer,
  Header,
  LinkList,
  LocaleSelector,
  MobileNav,
  NewsletterForm,
  PredictiveSearch,
  SkipLink,
  Text,
  Toast,
} from "__PKG__/react";

export interface LayoutProps {
  shop: RippleShop;
  /** Main menu. Use toRippleMenu (lib/menu.ts). */
  menu: RippleMenu;
  footerMenu: RippleMenu;
  /** Policy links as a menu; items may be empty. */
  policies: RippleMenu;
  /** Server cart read, or null on publicly cached responses. */
  cart: RippleCart | null;
  locale: {
    countries: Array<{ code: string; name: string; currency: string; current: boolean }>;
    languages: Array<{ code: string; name: string; current: boolean }>;
  };
  /** Pathname and query of the current request; the return target of the locale form. */
  path: string;
  /** Announcement text, or null for no bar. */
  announcement: string | null;
  newsletterStatus: "idle" | "success" | "error";
  /** True on the cart page: the cart drawer is not rendered. */
  cartPage: boolean;
  /** Four-digit year for the copyright line. */
  year: number;
  children: ReactNode;
}

export function Layout(props: LayoutProps) {
  const { shop, menu, footerMenu, policies, cart, locale, path, announcement, newsletterStatus, cartPage, year, children } = props;
  const hasFooterMenu = footerMenu.items.length > 0;
  return (
    <>
      <SkipLink>Skip to content</SkipLink>
      {announcement !== null && announcement !== "" ? <AnnouncementBar>{announcement}</AnnouncementBar> : null}
      <Header
        sticky
        menu={menu}
        shop={shop}
        cart={cart ?? undefined}
        linkList={hasFooterMenu ? "footer-menu" : "main"}
        mobileNav="mobile-nav"
        searchDialog="search-dialog"
        cartDrawer={cartPage ? undefined : "cart-drawer"}
      />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer>
        {hasFooterMenu ? <LinkList id="footer-menu" menu={footerMenu} ariaLabel="Footer" /> : null}
        <NewsletterForm id="newsletter" action="/api/newsletter" status={newsletterStatus} />
        <LocaleSelector id="footer-locale" countries={locale.countries} languages={locale.languages} returnTo={path} side="top" />
        <Text size="sm" tone="muted">{`© ${year} ${shop.name}`}</Text>
        {policies.items.length > 0 ? <LinkList menu={policies} ariaLabel="Policies" orientation="horizontal" /> : null}
      </Footer>
      <MobileNav id="mobile-nav" menu={menu} />
      <Dialog id="search-dialog">
        <DialogTitle>Search</DialogTitle>
        <DialogBody>
          <PredictiveSearch id="predictive-search" action="/search" />
        </DialogBody>
        <DialogClose />
      </Dialog>
      {cartPage ? null : <CartDrawer id="cart-drawer" cart={cart ?? undefined} />}
      <Toast />
    </>
  );
}
```

Rule **LY-1**: the Header menu opener is a link to the footer menu (`href="#footer-menu"`). When the store's footer menu is empty or missing, the main menu is used as the footer menu (TSX: the route code passes it as `footerMenu`; Liquid: the template does it). When that is empty too, no `#footer-menu` exists and the layout passes `linkList="main"` to Header so that the opener's `href` names an existing id. Test LT-2 checks both cases.

**Remix**: the React file converted by R-1 to R-5 (`tabIndex` becomes `tabindex`). The fragment `<>...</>` stays.

**html**: `pages/layout.html` is the document produced by H-1 with an empty `<main id="main" tabindex="-1"></main>`.

**Liquid** (`blueprints/layout/liquid/layout/theme.liquid`, complete):

```liquid
<!doctype html>
<html lang="{{ request.locale.iso_code }}">
  <head>
    {% render 'rp-head' %}
  </head>
  <body>
    {%- liquid
      assign announcement = 'ripple.blueprints.layout.announcement' | t
      assign search_title = 'ripple.blueprints.layout.search' | t
      assign footer_label = 'ripple.footer.menu' | t
      assign policies_label = 'ripple.footer.policies' | t
      assign year = 'now' | date: '%Y'
      assign footer_menu = linklists.footer
      if footer_menu.links.size == 0
        assign footer_menu = linklists['main-menu']
      endif
      assign link_list = 'footer-menu'
      if footer_menu.links.size == 0
        assign link_list = 'main'
      endif
      assign cart_drawer = 'cart-drawer'
      if template.name == 'cart'
        assign cart_drawer = ''
      endif
    -%}
    {% block 'skip-link' %}{{ 'ripple.blueprints.layout.skip' | t }}{% endblock %}
    {%- if announcement != blank -%}
      {% block 'announcement-bar' %}{{ announcement }}{% endblock %}
    {%- endif -%}
    {% block 'header', sticky: true, link_list: link_list, mobile_nav: 'mobile-nav', search_dialog: 'search-dialog', cart_drawer: cart_drawer %}{% endblock %}
    <main id="main" tabindex="-1">
      {{ content_for_layout }}
    </main>
    {% block 'footer' %}
      {%- if footer_menu.links.size > 0 -%}
        {% block 'link-list', id: 'footer-menu', menu: footer_menu, aria_label: footer_label %}{% endblock %}
      {%- endif -%}
      {% block 'newsletter-form', id: 'newsletter' %}{% endblock %}
      {% block 'locale-selector', id: 'footer-locale', side: 'top' %}{% endblock %}
      {% block 'text', size: 'sm', tone: 'muted' %}{{ 'ripple.footer.copyright' | t: year: year, name: shop.name | escape }}{% endblock %}
      {%- if shop.policies.size > 0 -%}
        {% block 'link-list', links: shop.policies, aria_label: policies_label, orientation: 'horizontal' %}{% endblock %}
      {%- endif -%}
    {% endblock %}
    {% block 'mobile-nav', id: 'mobile-nav' %}{% endblock %}
    {% block 'dialog', id: 'search-dialog' %}
      {% block 'dialog-title', dialog: 'search-dialog' %}{{ search_title }}{% endblock %}
      {% block 'dialog-body' %}
        {% block 'predictive-search', id: 'predictive-search' %}
          {% partial 'rp-predictive-results' %}{% render 'rp-predictive-search-region', id: 'predictive-search' %}{% endpartial %}
        {% endblock %}
      {% endblock %}
      {% block 'dialog-close', dialog: 'search-dialog' %}{% endblock %}
    {% endblock %}
    {%- if cart_drawer != blank -%}
      {% block 'cart-drawer', id: 'cart-drawer' %}
        {% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-region', id: 'cart-drawer' %}{% endpartial %}
        {% partial 'rp-cart-summary' %}{% render 'rp-cart-summary-region' %}{% endpartial %}
      {% endblock %}
    {%- endif -%}
    {% block 'toast' %}{% endblock %}
  </body>
</html>
```

Notes on the Liquid file:

- `snippets/rp-head.liquid` is owned by `14-liquid-theme.md`. It MUST print, in this order: charset and viewport metas, `<title>`, the stylesheets, `{{ content_for_header }}`, the import map, the config element `#rp-commerce` of `05-commerce.md` section 10.4, the Invoker Commands polyfill of `04-elements.md` section 3.3, the `ripple.js` module script.
- `request.locale.iso_code`, `template.name`, `content_for_layout`, `linklists`, `shop.policies`, `shop.name` are read by `ripple/theme/layout/theme.liquid` and `ripple/theme/blocks/footer.liquid` (`template.name` UNVERIFIED in those two files; it is a documented global).
- An empty translation for `ripple.blueprints.layout.announcement` means no bar. The English default is the empty string.
- The Liquid footer menu fallback implements rule LY-1.

Locale keys (`ripple.blueprints.layout.*`): `skip` "Skip to content"; `announcement` ""; `search` "Search".

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Shop name, logo | `shop { name brand { logo { image { url altText width height } } } }` mapped to `RippleShop` (1.3) | `shop.name`, `shop.brand.logo` |
| Main menu | `menu(handle: "main-menu")` with the selection of 1.2, through `toRippleMenu` | `linklists['main-menu']` |
| Footer menu | `menu(handle: "footer")`, through `toRippleMenu` | `linklists.footer` |
| Policies | `shop { privacyPolicy { title handle } refundPolicy { title handle } shippingPolicy { title handle } termsOfService { title handle } }`; each non-null policy becomes an item `{ id: handle, title, url: "/policies/<handle>", current: false, items: [] }` | `shop.policies` |
| Cart | `cartHandlers.get({ storefrontClient, request })` (`05-commerce.md` section 10.1 rule 3), mapped to `RippleCart`; `null` on publicly cached pages | the global `cart` (read inside the cart components) |
| Locales | rule LR-3 | the global `localization` (read inside LocaleSelector) |
| Language tag | `getHtmlLang(requestContext.locale.language)` (`hydrogen/packages/hydrogen/src/core/i18n/locale.ts`) | `request.locale.iso_code` |
| Newsletter status | `newsletterStatus(request)` (2.7) | the `form` object inside NewsletterForm |
| Announcement | project-defined (a constant or a metaobject); `null` for none | locale key `ripple.blueprints.layout.announcement` |

Complete query for the hydrogen backend, exported as `LAYOUT_QUERY` from `layout.tsx`:

```graphql
fragment RippleMenuItemFields on MenuItem { id title url }
fragment RippleMenuFields on Menu {
  id
  items {
    ...RippleMenuItemFields
    items {
      ...RippleMenuItemFields
      items { ...RippleMenuItemFields }
    }
  }
}
query RippleLayout($mainMenu: String!, $footerMenu: String!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  shop {
    name
    brand { logo { image { url altText width height } } }
    privacyPolicy { title handle }
    refundPolicy { title handle }
    shippingPolicy { title handle }
    termsOfService { title handle }
  }
  main: menu(handle: $mainMenu) { ...RippleMenuFields }
  footer: menu(handle: $footerMenu) { ...RippleMenuFields }
  localization {
    availableCountries { isoCode name currency { isoCode symbol } }
    availableLanguages { isoCode endonymName }
  }
}
```

UNVERIFIED against the schema in this session: `shop.brand.logo.image`, the four policy fields, `localization.availableLanguages`. `Menu` and `MenuItem` fields are verified (1.2).

### No-JS behaviour

1. Tab from the top of the page: the first focus is the skip link; Enter moves focus to `<main>`.
2. The menu opener (shown below `lg`) is a link to `#footer-menu`; activating it scrolls to the footer menu, which lists the same top-level destinations.
3. The search icon is a link to `/search` (the `search` blueprint).
4. The cart icon is a link to `/cart` (the `cart` blueprint). The count shows the server value when the response is not cached, otherwise it is hidden.
5. The newsletter form posts and the page reloads with a success or error message next to the form (fragment `#newsletter`).
6. The locale selector panel opens (native `popover`), and its buttons post the form; the page reloads in the chosen locale.
7. MobileNav, the search dialog and the CartDrawer stay closed and are never needed.
8. The toast region is empty and invisible.

### Acceptance tests

BT-1 to BT-9, plus:

- **LT-1** (tier 2) The children of `<body>` are, in order, elements matching: `a.rp-skip-link`, optionally `div.rp-announcement-bar`, `header.rp-header`, `main#main`, `footer.rp-footer`, `rp-dialog.rp-mobile-nav`, `rp-dialog.rp-dialog`, optionally `rp-dialog` containing `dialog#cart-drawer`, `ui-toast-region`. Script and JSON elements appended by the platform are ignored.
- **LT-2** (tier 2) With a non-empty footer menu, `a[data-rp-open="mobile-nav"]` has `href="#footer-menu"` and `nav#footer-menu` exists. With both menus empty, the same link has `href="#main"` and no `#footer-menu` exists.
- **LT-3** (tier 2) With `cartPage: true` (Liquid: `template.name == 'cart'`): no `#cart-drawer` exists and the cart link has no `data-rp-open`.
- **LT-4** (tier 2) No `<dialog>` has an ancestor matching `header, main, footer, [data-rp-region]`.
- **LT-5** (tier 1) `renderDocument` output, parsed by an HTML parser, has `html[lang]`, exactly one `script#rp-commerce` whose text parses as JSON, the stylesheets before the config element and the module scripts after it; a `title` containing `</title><script>` is escaped.
- **LT-6** (tier 1) `handleLocalePost`: with pathname routing `{ defaultLocale: EN/US, locales: [FR/CA] }`, a POST of `country_code=CA&return_to=/products/x` answers 303 with `location: /fr-ca/products/x`; `country_code=ZZ` answers `location: /products/x`; `return_to=//evil.example` answers `location: /`.
- **LT-7** (tier 1) `handleNewsletterPost`: a valid address with a resolving `subscribe` answers 303 with `location` ending `?newsletter=success#newsletter`; an invalid address does not call `subscribe` and answers `?newsletter=error#newsletter`; the address never appears in `location`.
- **LT-8** (tier 5) Activating the menu opener at width 375 opens `#mobile-nav`; activating the search link opens `#search-dialog` and focuses the search input; activating the cart link opens `#cart-drawer`. A middle click on each navigates in a new tab instead.
- **LT-10** (tier 5, React) Hydrating `document.body` with the sample layout logs no hydration error, with the Hydrogen script tags present in `<head>`.
- **LT-9** (tier 5, Remix) After a client navigation between two pages, the header, the open state of no dialog, and `html[style]` are unchanged, and no element is defined twice (`06-bindings.md` Q-15).

---

## Blueprint: `home`

### Purpose

The storefront home page: a hero, one featured collection, and a short list of collections.

### Regions

None.

### Components used

`button`, `collection-card`, `container`, `featured-collection`, `grid`, `heading`, `hero`, `stack`, `text`.

### Structure

```text
Hero                      size="lg" align="center"; scheme="dark" when it has an image
├─ Heading level 1        shop name (or hero title)
├─ Text variant="lead"    only when text exists
└─ Button href            link to all products
Container py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ FeaturedCollection  limit 4; grid 2 columns, 4 from lg          (omitted when the collection is missing)
   └─ Stack as="section" gap="4"                                      (omitted when there are no collections)
      ├─ Heading level 2
      └─ Grid as="ul" columns="1 sm:2 lg:3" gap="4 md:6"  →  li > CollectionCard
```

**React** (`blueprints/home/react/home.tsx`, complete except the `HOME_QUERY` constant, whose text is the query under "Data requirements"):

```tsx
import type { RippleCollection, RippleImage, RippleProduct } from "__PKG__";
import { Button, CollectionCard, Container, FeaturedCollection, Grid, Heading, Hero, Stack, Text } from "__PKG__/react";

export interface HomePageProps {
  hero: { title: string; text: string; image: RippleImage | null; cta: { label: string; href: string } };
  featured: { collection: RippleCollection; products: RippleProduct[] } | null;
  collections: RippleCollection[];
}

export function HomePage(props: HomePageProps) {
  const { hero, featured, collections } = props;
  return (
    <>
      <Hero image={hero.image ?? undefined} size="lg" align="center" scheme={hero.image !== null ? "dark" : undefined}>
        <Stack gap="4" align="center">
          <Heading level={1} size="5xl">{hero.title}</Heading>
          {hero.text !== "" ? <Text variant="lead">{hero.text}</Text> : null}
          <Button href={hero.cta.href} size="lg">{hero.cta.label}</Button>
        </Stack>
      </Hero>
      <Container py="12 md:20">
        <Stack gap="8 md:12">
          {featured !== null ? (
            <FeaturedCollection collection={featured.collection} products={featured.products} limit={4} />
          ) : null}
          {collections.length > 0 ? (
            <Stack as="section" gap="4">
              <Heading level={2}>Shop by collection</Heading>
              <Grid as="ul" columns="1 sm:2 lg:3" gap="4 md:6">
                {collections.map((collection) => (
                  <li key={collection.id}>
                    <CollectionCard collection={collection} />
                  </li>
                ))}
              </Grid>
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </>
  );
}
```

**Remix**: rules R-1 to R-4. **html**: rule H-1.

**Liquid** (`blueprints/home/liquid/templates/index.liquid`, complete):

```liquid
{%- liquid
  assign featured = collections.frontpage
  assign hero_text = 'ripple.blueprints.home.text' | t
  assign hero_scheme = ''
  if featured.image != blank
    assign hero_scheme = 'dark'
  endif
-%}
{% block 'hero', image: featured.image, size: 'lg', align: 'center', scheme: hero_scheme %}
  {% block 'stack', gap: '4', align: 'center' %}
    {% block 'heading', level: 1, size: '5xl' %}{{ shop.name | escape }}{% endblock %}
    {%- if hero_text != blank -%}
      {% block 'text', variant: 'lead' %}{{ hero_text }}{% endblock %}
    {%- endif -%}
    {% block 'button', href: routes.all_products_collection_url, size: 'lg' %}{{ 'ripple.blueprints.home.cta' | t }}{% endblock %}
  {% endblock %}
{% endblock %}
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {%- if featured.products.size > 0 -%}
      {% block 'featured-collection', collection: featured, limit: 4 %}{% endblock %}
    {%- endif -%}
    {%- if collections.size > 0 -%}
      {% block 'stack', as: 'section', gap: '4' %}
        {% block 'heading', level: 2 %}{{ 'ripple.blueprints.home.collections' | t }}{% endblock %}
        {% block 'grid', as: 'ul', columns: '1 sm:2 lg:3', gap: '4 md:6' %}
          {%- for collection in collections limit: 3 -%}
            <li>{% block 'collection-card', collection: collection %}{% endblock %}</li>
          {%- endfor -%}
        {% endblock %}
      {% endblock %}
    {%- endif -%}
  {% endblock %}
{% endblock %}
```

Locale keys (`ripple.blueprints.home.*`): `text` ""; `cta` "Shop now"; `collections` "Shop by collection". `collections.frontpage` and `routes.all_products_collection_url` are used by `ripple/theme/templates/index.liquid` and by the Hero example of this document.

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Hero title | `shop.name` (from the layout query) or a project constant | `shop.name` |
| Hero image | `featured.collection.image` | `collections.frontpage.image` |
| Featured collection | `collection(handle: $featured)` with 4 products | `collections.frontpage` |
| Collections | `collections(first: 3)` | `collections`, first 3 |

```graphql
fragment RippleProductCard on Product {
  id title handle vendor availableForSale
  featuredImage { url altText width height }
  priceRange { minVariantPrice { amount currencyCode } }
  compareAtPriceRange { minVariantPrice { amount currencyCode } }
}
fragment RippleCollectionCard on Collection { id title handle image { url altText width height } }
query RippleHome($featured: String!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  featured: collection(handle: $featured) {
    ...RippleCollectionCard
    products(first: 4) { nodes { ...RippleProductCard } }
  }
  collections(first: 3) { nodes { ...RippleCollectionCard } }
}
```

The fragments `RippleProductCard` and `RippleCollectionCard` are reused by name in the other blueprints; each query file repeats their text. Mapping to `RippleProduct`: `price` is `priceRange.minVariantPrice`; `compareAtPrice` is `compareAtPriceRange.minVariantPrice` when its `amount` is greater than `price.amount`, otherwise `null`; `url` per 2.5. Field names follow `05-commerce.md` section 11.1 and were not re-checked against the schema in this session. `$featured` defaults to `"frontpage"`; UNVERIFIED that mock.shop has that handle, so a `null` result renders the page without the featured area.

### No-JS behaviour

1. Every link (hero button, product cards, collection cards, "View all") navigates.
2. Nothing on this page needs script.

### Acceptance tests

BT-1 to BT-9, plus:

- **HO-1** (tier 2) With `featured: null` and `collections: []` the page still contains exactly one `h1` and no empty `ul`.
- **HO-2** (tier 2) The hero image has `loading="eager"` and `fetchpriority="high"`; every other `img` has `loading="lazy"`.

---

## Blueprint: `collection`

### Purpose

A collection page: title and description, filters, sort, active filter chips, a product grid and pagination. Filter, sort and page state lives in the URL (ledger D-047).

### Regions

`rp-collection-filters` (inside Filters, owned by that component), `rp-collection-toolbar` and `rp-collection-results` (owned by this blueprint).

### Components used

`button`, `container`, `empty-state`, `filter-chips`, `filters`, `grid`, `heading`, `inline`, `pagination`, `product-card`, `rich-text`, `sort-select`, `stack`, `text`.

### Structure

```text
Container py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Stack as="header" gap="2":  Heading level 1 (title); RichText (description, when present)
   └─ Grid columns="1 lg:4" gap="8 md:12"
      ├─ Filters id="filters"                     1 column; contains region rp-collection-filters
      └─ Stack gap="4" span="1 lg:3"
         ├─ SortSelect                            outside every region (it keeps focus while results change)
         ├─ Inline [data-rp-region="rp-collection-toolbar"]:  Text (product count); FilterChips
         └─ Stack gap="8 md:12" [data-rp-region="rp-collection-results"]
            ├─ Grid as="ul" columns="2 lg:3" gap="4 md:6"  →  li > ProductCard     (when products exist)
            ├─ Pagination                                                         (when a previous or next page exists)
            └─ EmptyState: Heading level 2; Button "Clear filters"                 (when no products)
rp-view-event (collection_viewed)
```

Below `lg` the filters are above the results in one column; from `lg` they are the first of four columns. The product grid uses 3 columns from `lg` (not the 4 of BP-5) because it sits beside the filters. Filters, FilterChips and SortSelect MUST carry `data-rp-refresh="rp-collection-filters rp-collection-toolbar rp-collection-results"`; that attribute is printed by those components (`11-components-commerce.md`), not by the blueprint.

**React** (`blueprints/collection/react/collection.tsx`, complete except the `COLLECTION_QUERY` constant):

```tsx
import type { RippleCollection, RippleProduct } from "__PKG__";
import {
  Button, Container, EmptyState, FilterChips, Filters, Grid, Heading, Inline, Pagination, ProductCard, RichText, SortSelect, Stack, Text,
} from "__PKG__/react";
import type { FilterData, PageInfo, SortOption } from "./types";

export interface CollectionPageProps {
  collection: RippleCollection & { descriptionHtml: string };
  products: RippleProduct[];
  /** Number of products shown on this page (cursor pagination has no total). */
  count: number;
  filters: FilterData[];
  sortOptions: SortOption[];
  sort: string;
  pageInfo: PageInfo;
}

export function CollectionPage(props: CollectionPageProps) {
  const { collection, products, count, filters, sortOptions, sort, pageInfo } = props;
  const viewEvent = JSON.stringify({
    event: "collection_viewed",
    payload: { collection: { id: collection.id, title: collection.title } },
  }).replace(/</g, "\\u003c");
  return (
    <>
      <Container py="12 md:20">
        <Stack gap="8 md:12">
          <Stack as="header" gap="2">
            <Heading level={1}>{collection.title}</Heading>
            {collection.descriptionHtml !== "" ? <RichText html={collection.descriptionHtml} /> : null}
          </Stack>
          <Grid columns="1 lg:4" gap="8 md:12">
            <Filters id="filters" filters={filters} action={collection.url} />
            <Stack gap="4" span="1 lg:3">
              <SortSelect options={sortOptions} value={sort} action={collection.url} />
              <Inline gap="4" justify="between" data-rp-region="rp-collection-toolbar">
                <Text tone="muted">{count === 1 ? "1 product" : `${count} products`}</Text>
                <FilterChips filters={filters} clearUrl={collection.url} />
              </Inline>
              <Stack gap="8 md:12" data-rp-region="rp-collection-results">
                {products.length > 0 ? (
                  <Grid as="ul" columns="2 lg:3" gap="4 md:6">
                    {products.map((product) => (
                      <li key={product.id}>
                        <ProductCard product={product} />
                      </li>
                    ))}
                  </Grid>
                ) : (
                  <EmptyState icon="search">
                    <Heading level={2}>No products found</Heading>
                    <Button href={collection.url} variant="outline">Clear filters</Button>
                  </EmptyState>
                )}
                {products.length > 0 && (pageInfo.previousUrl !== null || pageInfo.nextUrl !== null) ? (
                  <Pagination previousUrl={pageInfo.previousUrl ?? undefined} nextUrl={pageInfo.nextUrl ?? undefined} />
                ) : null}
              </Stack>
            </Stack>
          </Grid>
        </Stack>
      </Container>
      <rp-view-event view-event-trigger="connect">
        <script type="application/json" data-view-event-payload="" dangerouslySetInnerHTML={{ __html: viewEvent }} />
      </rp-view-event>
    </>
  );
}
```

`./types` is `<blueprint dir>/types.ts`, a file of the `layout` blueprint (key `types`) that holds the declarations of 2.4, assumption A-3. The JSX type of `rp-view-event` comes from the generated intrinsic-element declarations of `06-bindings.md` section 6; if that file does not declare it, section 3, X-9 applies.

**Remix**: rules R-1 to R-6; the payload script is written `<script type="application/json" data-view-event-payload innerHTML={unsafeHTML(viewEvent)} />` with `unsafeHTML` from `remix/component` (this is the second permitted use of `innerHTML`; section 3, X-10). **html**: rule H-1.

**Liquid** (`blueprints/collection/liquid/templates/collection.liquid`, complete):

```liquid
{%- liquid
  assign sort_by = collection.sort_by | default: collection.default_sort_by
-%}
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'stack', as: 'header', gap: '2' %}
      {% block 'heading', level: 1 %}{{ collection.title | escape }}{% endblock %}
      {%- if collection.description != blank -%}
        {% block 'rich-text', html: collection.description %}{% endblock %}
      {%- endif -%}
    {% endblock %}
    {% block 'grid', columns: '1 lg:4', gap: '8 md:12' %}
      {% block 'filters', id: 'filters', filters: collection.filters, action: collection.url %}
        {% partial 'rp-collection-filters' %}{% render 'rp-filters-region', id: 'filters', filters: collection.filters %}{% endpartial %}
      {% endblock %}
      {% block 'stack', gap: '4', span: '1 lg:3' %}
        {% block 'sort-select', options: collection.sort_options, value: sort_by, action: collection.url %}{% endblock %}
        {% partial 'rp-collection-toolbar' %}
          {% block 'inline', gap: '4', justify: 'between', attributes: 'data-rp-region="rp-collection-toolbar"' %}
            {% block 'text', tone: 'muted' %}{{ 'ripple.blueprints.collection.count' | t: count: collection.products_count }}{% endblock %}
            {% block 'filter-chips', filters: collection.filters, clear_url: collection.url %}{% endblock %}
          {% endblock %}
        {% endpartial %}
        {% partial 'rp-collection-results' %}
          {% paginate collection.products by 24 %}
            {% block 'stack', gap: '8 md:12', attributes: 'data-rp-region="rp-collection-results"' %}
              {%- if collection.products.size > 0 -%}
                {% block 'grid', as: 'ul', columns: '2 lg:3', gap: '4 md:6' %}
                  {%- for product in collection.products -%}
                    <li>{% block 'product-card', product: product %}{% endblock %}</li>
                  {%- endfor -%}
                {% endblock %}
                {%- if paginate.previous or paginate.next -%}
                  {% block 'pagination', previous_url: paginate.previous.url, next_url: paginate.next.url %}{% endblock %}
                {%- endif -%}
              {%- else -%}
                {% block 'empty-state', icon: 'search' %}
                  {% block 'heading', level: 2 %}{{ 'ripple.blueprints.collection.empty' | t }}{% endblock %}
                  {% block 'button', href: collection.url, variant: 'outline' %}{{ 'ripple.blueprints.collection.clear' | t }}{% endblock %}
                {% endblock %}
              {%- endif -%}
            {% endblock %}
          {% endpaginate %}
        {% endpartial %}
      {% endblock %}
    {% endblock %}
  {% endblock %}
{% endblock %}
<rp-view-event view-event-trigger="connect">
  <script type="application/json" data-view-event-payload>{"event":"collection_viewed","payload":{"collection":{"id":{{ collection.id | json }},"title":{{ collection.title | json }}}}}</script>
</rp-view-event>
```

Locale keys (`ripple.blueprints.collection.*`): `count.one` "{{ count }} product"; `count.other` "{{ count }} products"; `empty` "No products found"; `clear` "Clear filters".

Differences between backends, masked for BT-3: the count text (Liquid prints the collection total, `collection.products_count`; the hydrogen backend prints the number on the page) and the collection id in the view-event payload (Liquid: a number; hydrogen: a GID). Mask list: `{ "select": "[data-rp-region=\"rp-collection-toolbar\"] > .rp-text", "op": "text" }`, `{ "select": "rp-view-event > script", "op": "text" }`.

Evidence: `ripple/theme/templates/collection.liquid` (`collection.title`, `collection.description`, `collection.url`, `{% paginate collection.products by 20 %}` inside `{% partial 'collection-grid' %}`, a block call inside the product loop). `paginate.previous`, `paginate.next`: see `09-components-foundation.md`, Pagination, Evidence. UNVERIFIED: `collection.filters`, `collection.sort_options`, `collection.sort_by`, `collection.default_sort_by`, `collection.products_count` were not re-read in this session (they are documented Liquid drops by general knowledge); the `collection_viewed` payload shape (`05-commerce.md` section 15 lists the Standard Events payload shape as not run).

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Collection | `collection(handle:)`: `id`, `title`, `handle`, `descriptionHtml`, `image` | `collection` |
| Products | `collection.products(first: 24, after:, before:, last:, filters:, sortKey:, reverse:)` | `collection.products` inside `{% paginate ... by 24 %}` |
| Filters | `collection.products.filters { id label type values { id label count input } }`; `active` computed from the URL | `collection.filters` |
| Sort | URL param `sort_by`; options are a constant list in the route code | `collection.sort_options`, `collection.sort_by` |
| Pagination | `pageInfo`; URLs carry `after=<endCursor>` or `before=<startCursor>` with every other param kept | `paginate.previous.url`, `paginate.next.url` |

```graphql
query RippleCollection(
  $handle: String!, $first: Int, $last: Int, $after: String, $before: String,
  $filters: [ProductFilter!], $sortKey: ProductCollectionSortKeys, $reverse: Boolean,
  $country: CountryCode, $language: LanguageCode
) @inContext(country: $country, language: $language) {
  collection(handle: $handle) {
    ...RippleCollectionCard
    descriptionHtml
    products(first: $first, last: $last, after: $after, before: $before, filters: $filters, sortKey: $sortKey, reverse: $reverse) {
      filters { id label type values { id label count input } }
      nodes { ...RippleProductCard }
      pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    }
  }
}
```

Route code rules (hydrogen backend):

- **CO-R1** URL to variables. `sort_by` values and their variables: `manual` (`MANUAL`, false), `best-selling` (`BEST_SELLING`, false), `title-ascending` (`TITLE`, false), `title-descending` (`TITLE`, true), `price-ascending` (`PRICE`, false), `price-descending` (`PRICE`, true), `created-descending` (`CREATED`, true). An unknown or missing value is `manual`. These seven value strings are the Liquid `sort_by` values, so URLs are the same on both backends. `sortOptions` is that list with English labels `Featured`, `Best selling`, `Alphabetically, A-Z`, `Alphabetically, Z-A`, `Price, low to high`, `Price, high to low`, `Date, new to old`.
- **CO-R2** `filter.*` URL params to `$filters`, one `ProductFilter` each: `filter.v.availability=1` gives `{ available: true }` and `filter.v.availability=0` gives `{ available: false }`; `filter.v.price.gte=<n>` and `filter.v.price.lte=<n>` together give one `{ price: { min, max } }` (a missing bound is omitted); `filter.p.vendor=<v>` gives `{ productVendor: v }`; `filter.p.product_type=<v>` gives `{ productType: v }`; `filter.v.option.<name>=<v>` gives `{ variantOption: { name, value: v } }`. Any other `filter.*` param is ignored. A filter value is `active` when its param is in the URL. The param names are the Liquid storefront filter params, so URLs are the same on both backends. Filters (`11-components-commerce.md`) owns the names its form submits; if they differ, that document wins and this rule is updated.
- **CO-R3** With `before` set: `last: 24, before`; otherwise `first: 24, after`. `pageInfo.nextUrl` is the current URL with `before` removed and `after=<endCursor>` when `hasNextPage`; `previousUrl` is the current URL with `after` removed and `before=<startCursor>` when `hasPreviousPage`; otherwise `null`.

### No-JS behaviour

1. Filters is a GET form with a submit button (hidden by `data-rp-js="fallback"` once script runs); submitting reloads the page with the `filter.*` params.
2. SortSelect is a GET form with a submit button; submitting reloads with `sort_by`.
3. Filter chips and the "Clear filters" button are links.
4. Pagination links navigate.
5. With script, the same controls refresh the three regions in place and update the URL; a failed refresh navigates (`05-commerce.md` section 8.2).

### Acceptance tests

BT-1 to BT-9, plus:

- **CL-1** (tier 2) With `products: []` the results region contains `.rp-empty-state` with a link to the collection URL, no `ul.rp-grid` and no `.rp-pagination`.
- **CL-2** (tier 2) `[data-rp-region="rp-collection-results"]` and `[data-rp-region="rp-collection-toolbar"]` do not contain `.rp-sort-select` or `.rp-filters`.
- **CL-3** (tier 5 and tier 7) Choosing a sort option changes the URL to contain `sort_by=price-ascending` without a document navigation, and the first product card changes; focus stays on the sort control.
- **CL-4** (tier 6) With JavaScript disabled, submitting the filter form navigates to a URL containing the chosen `filter.` param, and the chosen value is checked in the response.
- **CL-5** (tier 1) Route helper tests for CO-R1 to CO-R3 with the seven sort values, an unknown value, and both pagination directions.

---

## Blueprint: `collections-list`

### Purpose

The list of all collections.

### Regions

None.

### Components used

`collection-card`, `container`, `empty-state`, `grid`, `heading`, `pagination`, `stack`.

### Structure

```text
Container py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Heading level 1
   ├─ Grid as="ul" columns="1 sm:2 lg:3" gap="4 md:6"  →  li > CollectionCard   (when collections exist)
   ├─ Pagination                                                               (when a previous or next page exists)
   └─ EmptyState: Heading level 2                                               (when none)
```

**React** (`blueprints/collections-list/react/collections-list.tsx`, complete except `COLLECTIONS_LIST_QUERY`):

```tsx
import type { RippleCollection } from "__PKG__";
import { CollectionCard, Container, EmptyState, Grid, Heading, Pagination, Stack } from "__PKG__/react";
import type { PageInfo } from "./types";

export interface CollectionsListPageProps {
  collections: RippleCollection[];
  pageInfo: PageInfo;
}

export function CollectionsListPage(props: CollectionsListPageProps) {
  const { collections, pageInfo } = props;
  return (
    <Container py="12 md:20">
      <Stack gap="8 md:12">
        <Heading level={1}>Collections</Heading>
        {collections.length > 0 ? (
          <Grid as="ul" columns="1 sm:2 lg:3" gap="4 md:6">
            {collections.map((collection) => (
              <li key={collection.id}>
                <CollectionCard collection={collection} />
              </li>
            ))}
          </Grid>
        ) : (
          <EmptyState>
            <Heading level={2}>No collections yet</Heading>
          </EmptyState>
        )}
        {pageInfo.previousUrl !== null || pageInfo.nextUrl !== null ? (
          <Pagination previousUrl={pageInfo.previousUrl ?? undefined} nextUrl={pageInfo.nextUrl ?? undefined} />
        ) : null}
      </Stack>
    </Container>
  );
}
```

**Remix**: rules R-1 to R-4. **html**: rule H-1.

**Liquid** (`blueprints/collections-list/liquid/templates/list-collections.liquid`, complete):

```liquid
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'heading', level: 1 %}{{ 'ripple.blueprints.collections-list.title' | t }}{% endblock %}
    {% paginate collections by 24 %}
      {%- if collections.size > 0 -%}
        {% block 'grid', as: 'ul', columns: '1 sm:2 lg:3', gap: '4 md:6' %}
          {%- for collection in collections -%}
            <li>{% block 'collection-card', collection: collection %}{% endblock %}</li>
          {%- endfor -%}
        {% endblock %}
      {%- else -%}
        {% block 'empty-state' %}
          {% block 'heading', level: 2 %}{{ 'ripple.blueprints.collections-list.empty' | t }}{% endblock %}
        {% endblock %}
      {%- endif -%}
      {%- if paginate.previous or paginate.next -%}
        {% block 'pagination', previous_url: paginate.previous.url, next_url: paginate.next.url %}{% endblock %}
      {%- endif -%}
    {% endpaginate %}
  {% endblock %}
{% endblock %}
```

Locale keys (`ripple.blueprints.collections-list.*`): `title` "Collections"; `empty` "No collections yet".

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Collections | `collections(first: 24, after:, before:, last:)` | `collections` inside `{% paginate collections by 24 %}` |

```graphql
query RippleCollectionsList($first: Int, $last: Int, $after: String, $before: String, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  collections(first: $first, last: $last, after: $after, before: $before) {
    nodes { ...RippleCollectionCard }
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
  }
}
```

Pagination URLs: rule CO-R3.

### No-JS behaviour

1. Cards and pagination are links. Nothing needs script.

### Acceptance tests

BT-1 to BT-9, plus:

- **CS-1** (tier 2) With `collections: []`: one `.rp-empty-state`, no `ul`, no `.rp-pagination`.

---

## Blueprint: `product`

### Purpose

A product page: gallery, vendor, title, variant picker, price, add-to-cart form, description and recommendations. The selected variant lives in the URL (ledger D-047).

### Regions

`rp-product-media` (inside ProductGallery), `rp-product-buy` (owned by this blueprint: price and form), `rp-product-recommendations` (inside ProductRecommendations).

### Components used

`add-to-cart-button`, `container`, `grid`, `heading`, `price`, `product-form`, `product-gallery`, `product-recommendations`, `rich-text`, `stack`, `text`, `variant-picker`. (`add-to-cart-button` is listed because ProductForm's default body renders it and the CLI installs listed components.)

### Structure

```text
Container py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Grid columns="1 md:2" gap="8 md:12"
   │  ├─ ProductGallery id="product-gallery"             contains region rp-product-media; first image eager
   │  └─ Stack gap="4"
   │     ├─ Text variant="overline" tone="muted"         vendor (when present)
   │     ├─ Heading level 1                              title
   │     ├─ VariantPicker                                outside every region; data-rp-refresh="rp-product-buy rp-product-media"
   │     ├─ Stack gap="4" [data-rp-region="rp-product-buy"]
   │     │  ├─ Price                                     selected variant
   │     │  └─ ProductForm id="product-form"             quantity, add to cart; prints the product_viewed view event
   │     └─ RichText                                     description (when present)
   └─ ProductRecommendations id="recommendations"        contains region rp-product-recommendations
```

Below `md` the gallery is above the details. The description is outside the buy region because it does not change with the variant. VariantPicker is outside `rp-product-buy` so that it keeps focus when the region is replaced.

**React** (`blueprints/product/react/product.tsx`, complete except `PRODUCT_QUERY`):

```tsx
import type { RippleVariant } from "__PKG__";
import {
  Container, Grid, Heading, Price, ProductForm, ProductGallery, ProductRecommendations, RichText, Stack, Text, VariantPicker,
} from "__PKG__/react";
import type { ProductDetail } from "./types";

export interface ProductPageProps {
  product: ProductDetail;
  /** The variant selected by the URL, or the first available one. */
  variant: RippleVariant;
}

export function ProductPage(props: ProductPageProps) {
  const { product, variant } = props;
  return (
    <Container py="12 md:20">
      <Stack gap="8 md:12">
        <Grid columns="1 md:2" gap="8 md:12">
          <ProductGallery id="product-gallery" media={product.media} />
          <Stack gap="4">
            {product.vendor !== "" ? <Text variant="overline" tone="muted">{product.vendor}</Text> : null}
            <Heading level={1}>{product.title}</Heading>
            <VariantPicker product={product} variant={variant} />
            <Stack gap="4" data-rp-region="rp-product-buy">
              <Price price={variant.price} compareAtPrice={variant.compareAtPrice ?? undefined} />
              <ProductForm id="product-form" product={product} variant={variant} />
            </Stack>
            {product.descriptionHtml !== "" ? <RichText html={product.descriptionHtml} /> : null}
          </Stack>
        </Grid>
        <ProductRecommendations id="recommendations" product={product} />
      </Stack>
    </Container>
  );
}
```

**Remix**: rules R-1 to R-6. **html**: rule H-1.

**Liquid** (`blueprints/product/liquid/templates/product.liquid`, complete):

```liquid
{%- liquid
  assign variant = product.selected_or_first_available_variant
-%}
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'grid', columns: '1 md:2', gap: '8 md:12' %}
      {% block 'product-gallery', id: 'product-gallery', product: product %}
        {% partial 'rp-product-media' %}{% render 'rp-product-gallery-region', id: 'product-gallery', product: product, variant: variant %}{% endpartial %}
      {% endblock %}
      {% block 'stack', gap: '4' %}
        {%- if product.vendor != blank -%}
          {% block 'text', variant: 'overline', tone: 'muted' %}{{ product.vendor | escape }}{% endblock %}
        {%- endif -%}
        {% block 'heading', level: 1 %}{{ product.title | escape }}{% endblock %}
        {% block 'variant-picker', product: product, variant: variant %}{% endblock %}
        {% partial 'rp-product-buy' %}
          {% block 'stack', gap: '4', attributes: 'data-rp-region="rp-product-buy"' %}
            {% block 'price', price: variant.price, compare_at_price: variant.compare_at_price %}{% endblock %}
            {% block 'product-form', id: 'product-form', product: product, variant: variant %}{% endblock %}
          {% endblock %}
        {% endpartial %}
        {%- if product.description != blank -%}
          {% block 'rich-text', html: product.description %}{% endblock %}
        {%- endif -%}
      {% endblock %}
    {% endblock %}
    {% block 'product-recommendations', id: 'recommendations', product: product %}
      {% partial 'rp-product-recommendations' %}{% render 'rp-product-recommendations-region', product: product %}{% endpartial %}
    {% endblock %}
  {% endblock %}
{% endblock %}
```

No locale keys (every string comes from the product or from the embedded components).

Evidence: `ripple/docs/research/liquid-blocks-partials.md` section 7 (a template that places `{% partial 'rp-product-buy' %}` inside a block body, around a price and a product form; `product.selected_or_first_available_variant`); `ripple/theme/templates/product.liquid` (`{% partial 'product-form' %}` inside a container block).

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Product | `product(handle:)` with the selection below | `product` |
| Selected variant | `selectedOrFirstAvailableVariant(selectedOptions:)` from URL option params (the param names are owned by VariantPicker, `11-components-commerce.md`) | `product.selected_or_first_available_variant` (the platform reads `?variant=`) |
| Media | `media(first: 20)`, `MediaImage` nodes only | `product.media` (read by the gallery snippet) |
| Recommendations | `productRecommendations(productId:)`, rendered by ProductRecommendations; inline or through its `data-url` route (`05-commerce.md` section 7.5) | `routes.product_recommendations_url` through region refresh (SPIKE-09) |

```graphql
fragment RippleVariantFields on ProductVariant {
  id title availableForSale
  price { amount currencyCode }
  compareAtPrice { amount currencyCode }
  image { url altText width height }
  selectedOptions { name value }
}
query RippleProduct($handle: String!, $selectedOptions: [SelectedOptionInput!]!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  product(handle: $handle) {
    ...RippleProductCard
    descriptionHtml
    options { name optionValues { name } }
    media(first: 20) { nodes { ... on MediaImage { id image { url altText width height } } } }
    variants(first: 100) { nodes { ...RippleVariantFields } }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...RippleVariantFields
    }
  }
}
```

Mapping: `ProductDetail.options[n].values` is `optionValues[].name`; `media` drops nodes without `image`. UNVERIFIED against the schema in this session: `optionValues`, `selectedOrFirstAvailableVariant` and its two boolean arguments (they are the fields the Hydrogen product skills use; if absent, select `variants` and choose in route code: the first variant whose `selectedOptions` all match, else the first with `availableForSale`, else the first).

### No-JS behaviour

1. VariantPicker is a GET form of radio inputs (or links) with a submit button; choosing a variant reloads the page with that variant selected (D-047).
2. The add-to-cart form posts; the response is a redirect back (hydrogen: 303 to the referring page; Liquid: the cart page), and the header count shows the new total.
3. The gallery shows the first image and its thumbnails as a scrollable list (Carousel without script, `04-elements.md` section 10.9).
4. Recommendations: empty unless the server rendered them inline (`rp-recommendations` needs script to load them).

### Fallback (SPIKE-09)

If a partial cannot be fetched from `routes.product_recommendations_url` on Liquid, the Liquid template removes the `product-recommendations` block and its partial (five lines), and test BT-5 skips `rp-product-recommendations` on Liquid. `blueprint.json` and the other hosts do not change.

### Acceptance tests

BT-1 to BT-9, plus:

- **PR-1** (tier 2) `[data-rp-region="rp-product-buy"]` contains `.rp-price` and `rp-product-form`, and does not contain `.rp-variant-picker` or `.rp-rich-text`.
- **PR-2** (tier 2) The first gallery `img` has `loading="eager"` and `fetchpriority="high"`.
- **PR-3** (tier 5 and tier 7) Choosing another variant updates the URL with `history.replaceState`, replaces the price text and keeps focus on the chosen option.
- **PR-4** (tier 6) With JavaScript disabled, submitting the add-to-cart form ends on a page whose cart count is 1.
- **PR-5** (tier 2) A product with one variant and no description renders with no empty `.rp-rich-text`.

---

## Blueprint: `search`

### Purpose

The search results page: a search form, the result count, product results and pagination. It is also the no-JS target of the header's search link.

### Regions

`rp-search-results` (owned by this blueprint).

### Components used

`container`, `empty-state`, `grid`, `heading`, `pagination`, `product-card`, `search-form`, `stack`, `text`.

### Structure

```text
Container py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Heading level 1
   ├─ SearchForm                         GET /search, field q, current terms as value
   └─ Stack gap="8 md:12" [data-rp-region="rp-search-results"]
      ├─ Text tone="muted"               "N results for "terms""          (when terms exist)
      ├─ Grid as="ul" columns="2 lg:4" gap="4 md:6"  →  li > ProductCard  (when results exist)
      ├─ Pagination                                                      (when a previous or next page exists)
      └─ EmptyState icon="search": Heading level 2                        (terms exist, no results)
rp-view-event (search_viewed)            only when terms exist
```

Results are products only in V1: the hydrogen query passes `types: PRODUCT`, and the Liquid template skips results whose `object_type` is not `product`. A search with no terms shows the form and an empty region.

**React** (`blueprints/search/react/search.tsx`, complete except `SEARCH_QUERY`):

```tsx
import type { RippleProduct } from "__PKG__";
import { Container, EmptyState, Grid, Heading, Pagination, ProductCard, SearchForm, Stack, Text } from "__PKG__/react";
import type { PageInfo } from "./types";

export interface SearchPageProps {
  /** The trimmed value of the q param; "" when absent. */
  terms: string;
  results: RippleProduct[];
  /** Total number of results. */
  count: number;
  pageInfo: PageInfo;
}

export function SearchPage(props: SearchPageProps) {
  const { terms, results, count, pageInfo } = props;
  const viewEvent = JSON.stringify({ event: "search_viewed", payload: { searchTerm: terms } }).replace(/</g, "\\u003c");
  return (
    <>
      <Container py="12 md:20">
        <Stack gap="8 md:12">
          <Heading level={1}>Search</Heading>
          <SearchForm action="/search" defaultValue={terms} />
          <Stack gap="8 md:12" data-rp-region="rp-search-results">
            {terms !== "" ? (
              <Text tone="muted">{count === 1 ? `1 result for "${terms}"` : `${count} results for "${terms}"`}</Text>
            ) : null}
            {results.length > 0 ? (
              <Grid as="ul" columns="2 lg:4" gap="4 md:6">
                {results.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </Grid>
            ) : null}
            {terms !== "" && results.length === 0 ? (
              <EmptyState icon="search">
                <Heading level={2}>No results</Heading>
              </EmptyState>
            ) : null}
            {results.length > 0 && (pageInfo.previousUrl !== null || pageInfo.nextUrl !== null) ? (
              <Pagination previousUrl={pageInfo.previousUrl ?? undefined} nextUrl={pageInfo.nextUrl ?? undefined} />
            ) : null}
          </Stack>
        </Stack>
      </Container>
      {terms !== "" ? (
        <rp-view-event view-event-trigger="connect">
          <script type="application/json" data-view-event-payload="" dangerouslySetInnerHTML={{ __html: viewEvent }} />
        </rp-view-event>
      ) : null}
    </>
  );
}
```

**Remix**: rules R-1 to R-6 and the `innerHTML={unsafeHTML(viewEvent)}` form given in `collection`. **html**: rule H-1.

**Liquid** (`blueprints/search/liquid/templates/search.liquid`, complete):

```liquid
{%- liquid
  assign terms = search.terms | strip
-%}
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'heading', level: 1 %}{{ 'ripple.blueprints.search.title' | t }}{% endblock %}
    {% block 'search-form', default_value: terms %}{% endblock %}
    {% partial 'rp-search-results' %}
      {% paginate search.results by 24 %}
        {% block 'stack', gap: '8 md:12', attributes: 'data-rp-region="rp-search-results"' %}
          {%- if search.performed and terms != blank -%}
            {% block 'text', tone: 'muted' %}{{ 'ripple.blueprints.search.count' | t: count: search.results_count, terms: terms | escape }}{% endblock %}
            {%- if search.results_count > 0 -%}
              {% block 'grid', as: 'ul', columns: '2 lg:4', gap: '4 md:6' %}
                {%- for result in search.results -%}
                  {%- if result.object_type == 'product' -%}
                    <li>{% block 'product-card', product: result %}{% endblock %}</li>
                  {%- endif -%}
                {%- endfor -%}
              {% endblock %}
              {%- if paginate.previous or paginate.next -%}
                {% block 'pagination', previous_url: paginate.previous.url, next_url: paginate.next.url %}{% endblock %}
              {%- endif -%}
            {%- else -%}
              {% block 'empty-state', icon: 'search' %}
                {% block 'heading', level: 2 %}{{ 'ripple.blueprints.search.empty' | t }}{% endblock %}
              {% endblock %}
            {%- endif -%}
          {%- endif -%}
        {% endblock %}
      {% endpaginate %}
    {% endpartial %}
  {% endblock %}
{% endblock %}
{%- if search.performed and terms != blank -%}
  <rp-view-event view-event-trigger="connect">
    <script type="application/json" data-view-event-payload>{"event":"search_viewed","payload":{"searchTerm":{{ terms | json }}}}</script>
  </rp-view-event>
{%- endif -%}
```

Locale keys (`ripple.blueprints.search.*`): `title` "Search"; `count.one` "{{ count }} result for "{{ terms }}""; `count.other` "{{ count }} results for "{{ terms }}""; `empty` "No results".

Notes: the `t` filter does not escape its arguments, so `terms` is escaped at the call (the translated string is printed unescaped). SearchForm on Liquid MUST add `<input type="hidden" name="type" value="product">` so that the platform returns products only; that input is part of the SearchForm contract in `11-components-commerce.md` (section 3, X-3). Evidence: `ripple/theme/templates/search.liquid` (`search.terms`, `search.performed`, `search.results_count`, `{% paginate search.results by 20 %}`, `routes.search_url`). UNVERIFIED: `result.object_type`; the `search_viewed` payload shape.

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Terms | URL param `q`, trimmed | `search.terms` |
| Results | `search(query:, types: PRODUCT, first: 24, after:, before:, last:)` | `search.results` inside `{% paginate search.results by 24 %}` |
| Count | `search.totalCount` | `search.results_count` |

```graphql
query RippleSearch($terms: String!, $first: Int, $last: Int, $after: String, $before: String, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  search(query: $terms, types: PRODUCT, first: $first, last: $last, after: $after, before: $before) {
    totalCount
    nodes { ... on Product { ...RippleProductCard } }
    pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
  }
}
```

The route code MUST NOT run the query when `terms` is `""`; it passes `results: []`, `count: 0`. Pagination URLs: rule CO-R3. UNVERIFIED against the schema in this session: `search.totalCount`.

### No-JS behaviour

1. The search form is a GET form; submitting navigates to `/search?q=<terms>`.
2. Result cards and pagination are links.

### Acceptance tests

BT-1 to BT-9, plus:

- **SE-1** (tier 2) With `terms: ""`: the region `rp-search-results` exists and has no element children; no `rp-view-event` exists.
- **SE-2** (tier 2) With terms `<b>x</b>` and no results: the count text contains the literal characters `<b>x</b>` as text (no `b` element in the region), and the view-event script text parses as JSON.
- **SE-3** (tier 6) Submitting the form with JavaScript disabled lands on `/search?q=shirt` (plus `type=product` on Liquid) and the input value is `shirt`.

---

## Blueprint: `cart`

### Purpose

The cart page: lines with quantity controls, summary, discount code, note and checkout. It is the no-JS target of the cart link and the confirmation page of an add when no drawer exists.

### Regions

`rp-cart-lines` (inside CartLines), `rp-cart-summary` (inside CartSummary).

### Components used

`cart-line`, `cart-lines`, `cart-note`, `cart-summary`, `checkout-button`, `container`, `discount-code`, `grid`, `heading`, `stack`. (`cart-line` is listed because CartLines renders it.)

### Structure

```text
Container py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Heading level 1
   └─ Grid columns="1 lg:3" gap="8 md:12"
      ├─ CartLines id="cart" span="1 lg:2"      contains region rp-cart-lines; prints the empty state when the cart is empty
      └─ Stack gap="4"                          only when the cart has lines at render time
         ├─ CartSummary                         contains region rp-cart-summary
         ├─ DiscountCode
         ├─ CartNote
         └─ CheckoutButton
rp-view-event (cart_viewed)
```

Below `lg` the summary column is under the lines. The layout does not render the CartDrawer on this page (rule L-B, `cartPage`).

Limit, stated so that nobody "fixes" it in the blueprint: the right column is decided on the server. When script removes the last line, `rp-cart-lines` is refreshed to the empty state but the right column stays until the next page load. `11-components-commerce.md` MUST make CheckoutButton inert for an empty cart (section 3, X-4).

**React** (`blueprints/cart/react/cart.tsx`, complete):

```tsx
import type { RippleCart } from "__PKG__";
import { CartLines, CartNote, CartSummary, CheckoutButton, Container, DiscountCode, Grid, Heading, Stack } from "__PKG__/react";

export interface CartPageProps {
  /** Server cart read; null when the buyer has no cart yet. */
  cart: RippleCart | null;
}

export function CartPage(props: CartPageProps) {
  const { cart } = props;
  return (
    <>
      <Container py="12 md:20">
        <Stack gap="8 md:12">
          <Heading level={1}>Cart</Heading>
          <Grid columns="1 lg:3" gap="8 md:12">
            <CartLines id="cart" cart={cart ?? undefined} span="1 lg:2" />
            {cart !== null && cart.lines.length > 0 ? (
              <Stack gap="4">
                <CartSummary cart={cart} />
                <DiscountCode cart={cart} />
                <CartNote cart={cart} />
                <CheckoutButton href={cart.checkoutUrl}>Check out</CheckoutButton>
              </Stack>
            ) : null}
          </Grid>
        </Stack>
      </Container>
      <rp-view-event view-event-trigger="connect">
        <script type="application/json" data-view-event-payload="" dangerouslySetInnerHTML={{ __html: '{"event":"cart_viewed","payload":{}}' }} />
      </rp-view-event>
    </>
  );
}
```

There is no query constant: the cart comes from `cartHandlers.get({ storefrontClient, request })` (`05-commerce.md` section 10.1 rule 3), mapped to `RippleCart`. The response MUST NOT be cached publicly.

**Remix**: rules R-1 to R-6. **html**: rule H-1 with the sample cart of two lines.

**Liquid** (`blueprints/cart/liquid/templates/cart.liquid`, complete):

```liquid
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'heading', level: 1 %}{{ 'ripple.blueprints.cart.title' | t }}{% endblock %}
    {% block 'grid', columns: '1 lg:3', gap: '8 md:12' %}
      {% block 'cart-lines', id: 'cart', span: '1 lg:2' %}
        {% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-region', id: 'cart' %}{% endpartial %}
      {% endblock %}
      {%- if cart.item_count > 0 -%}
        {% block 'stack', gap: '4' %}
          {% block 'cart-summary' %}
            {% partial 'rp-cart-summary' %}{% render 'rp-cart-summary-region' %}{% endpartial %}
          {% endblock %}
          {% block 'discount-code' %}{% endblock %}
          {% block 'cart-note', cart_form: 'cart-form' %}{% endblock %}
          {% block 'checkout-button', cart_form: 'cart-form' %}{{ 'ripple.blueprints.cart.checkout' | t }}{% endblock %}
        {% endblock %}
      {%- endif -%}
    {% endblock %}
  {% endblock %}
{% endblock %}
<rp-view-event view-event-trigger="connect">
  <script type="application/json" data-view-event-payload>{"event":"cart_viewed","payload":{}}</script>
</rp-view-event>
```

Locale keys (`ripple.blueprints.cart.*`): `title` "Cart"; `checkout` "Check out".

`cart-form` is the id of the one Liquid cart form: CartLines with `id: 'cart'` prints `<form id="cart-form">` (`05-commerce.md` section 6.2: the form id is `<CartLines id>-form`), and the note and the checkout button join it with `form="cart-form"`. UNVERIFIED: the `cart_viewed` payload (printed empty; the Standard Events element may fill cart data itself or require fields, `05-commerce.md` section 15).

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Cart | `cartHandlers.get(...)` result mapped to `RippleCart` (`05-commerce.md` section 11.1) | the global `cart`, read inside the cart components |

### No-JS behaviour

1. hydrogen backend: each line has its own form; "Update" sets the quantity, "Remove" removes the line; each posts to `/api/cart` and returns with a 303 to this page.
2. Liquid: one form; the "Update" button posts all quantities; "Remove" is a link (`item.url_to_remove`); the checkout button submits the same form with `name="checkout"`.
3. The note is saved by its "Save" button (hydrogen) or with the cart form (Liquid).
4. The discount form posts on the hydrogen backend. On Liquid the discount control needs script (`05-commerce.md` section 10.5); what it shows without script is owned by DiscountCode (`11-components-commerce.md`).
5. Checkout is a link (hydrogen) or a submit button (Liquid).

### Acceptance tests

BT-1 to BT-9, plus:

- **CA-1** (tier 2) With an empty cart: no `.rp-cart-summary`, no `.rp-checkout-button`; the lines region contains `.rp-empty-state`.
- **CA-2** (tier 2) No `#cart-drawer` exists in the document, and the header cart link has no `data-rp-open`.
- **CA-3** (tier 5) Raising a quantity changes the line total text and the summary subtotal text without a document navigation, and each region root is replaced exactly once per mutation.
- **CA-4** (tier 6) With JavaScript disabled: update a quantity to 3 and submit; the reloaded page shows quantity 3. Remove a line; the reloaded page has one line fewer.
- **CA-5** (tier 2, Liquid) The template declares `rp-cart-lines` and `rp-cart-summary` exactly once each, and `layout/theme.liquid` rendered with `template.name == 'cart'` prints no `#cart-drawer`.

---

## Blueprint: `blog`

### Purpose

A blog index: the blog title and a paginated grid of article cards.

### Regions

None.

### Components used

`article-card`, `container`, `empty-state`, `grid`, `heading`, `pagination`, `stack`.

### Structure

```text
Container py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Heading level 1                    blog title
   ├─ Grid as="ul" columns="1 sm:2 lg:3" gap="4 md:6"  →  li > ArticleCard    (when articles exist)
   ├─ EmptyState: Heading level 2                                              (when none)
   └─ Pagination                                                              (when a previous or next page exists)
```

**React** (`blueprints/blog/react/blog.tsx`, complete except `BLOG_QUERY`):

```tsx
import type { RippleArticle } from "__PKG__";
import { ArticleCard, Container, EmptyState, Grid, Heading, Pagination, Stack } from "__PKG__/react";
import type { PageInfo } from "./types";

export interface BlogPageProps {
  blog: { title: string };
  articles: RippleArticle[];
  pageInfo: PageInfo;
}

export function BlogPage(props: BlogPageProps) {
  const { blog, articles, pageInfo } = props;
  return (
    <Container py="12 md:20">
      <Stack gap="8 md:12">
        <Heading level={1}>{blog.title}</Heading>
        {articles.length > 0 ? (
          <Grid as="ul" columns="1 sm:2 lg:3" gap="4 md:6">
            {articles.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} />
              </li>
            ))}
          </Grid>
        ) : (
          <EmptyState>
            <Heading level={2}>No articles yet</Heading>
          </EmptyState>
        )}
        {pageInfo.previousUrl !== null || pageInfo.nextUrl !== null ? (
          <Pagination previousUrl={pageInfo.previousUrl ?? undefined} nextUrl={pageInfo.nextUrl ?? undefined} />
        ) : null}
      </Stack>
    </Container>
  );
}
```

**Remix**: rules R-1 to R-4. **html**: rule H-1.

**Liquid** (`blueprints/blog/liquid/templates/blog.liquid`, complete):

```liquid
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'heading', level: 1 %}{{ blog.title | escape }}{% endblock %}
    {% paginate blog.articles by 12 %}
      {%- if blog.articles.size > 0 -%}
        {% block 'grid', as: 'ul', columns: '1 sm:2 lg:3', gap: '4 md:6' %}
          {%- for article in blog.articles -%}
            <li>{% block 'article-card', article: article %}{% endblock %}</li>
          {%- endfor -%}
        {% endblock %}
      {%- else -%}
        {% block 'empty-state' %}
          {% block 'heading', level: 2 %}{{ 'ripple.blueprints.blog.empty' | t }}{% endblock %}
        {% endblock %}
      {%- endif -%}
      {%- if paginate.previous or paginate.next -%}
        {% block 'pagination', previous_url: paginate.previous.url, next_url: paginate.next.url %}{% endblock %}
      {%- endif -%}
    {% endpaginate %}
  {% endblock %}
{% endblock %}
```

Locale keys (`ripple.blueprints.blog.*`): `empty` "No articles yet".

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Blog | `blog(handle:)`: `title` | `blog.title` |
| Articles | `blog.articles(first: 12, after:, before:, last:, sortKey: PUBLISHED_AT, reverse: true)` | `blog.articles` inside `{% paginate blog.articles by 12 %}` |

```graphql
query RippleBlog($blog: String!, $first: Int, $last: Int, $after: String, $before: String, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  blog(handle: $blog) {
    title
    handle
    articles(first: $first, last: $last, after: $after, before: $before, sortKey: PUBLISHED_AT, reverse: true) {
      nodes { id title handle excerpt publishedAt image { url altText width height } }
      pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
    }
  }
}
```

`RippleArticle.url` is `/blogs/<blog handle>/<article handle>`; `excerpt` is `""` when the API returns `null`. Pagination URLs: rule CO-R3 with page size 12. UNVERIFIED: that mock.shop has a blog.

### No-JS behaviour

1. Cards and pagination are links. Nothing needs script.

### Acceptance tests

BT-1 to BT-9, plus:

- **BL-1** (tier 2) With `articles: []`: one `.rp-empty-state`, no `ul`.

---

## Blueprint: `article`

### Purpose

One blog article: title, date and author, lead image, body, and a link back to the blog. Comments are not part of V1 (the base theme's comment list and `new_comment` form in `ripple/theme/templates/article.liquid` are not ported; Ledger issues, item 13).

### Regions

None.

### Components used

`container`, `heading`, `image`, `link`, `rich-text`, `stack`, `text`.

### Structure

```text
Container width="prose" py="12 md:20"
└─ Stack as="article" gap="8 md:12"
   ├─ Stack as="header" gap="2":  Heading level 1 (title); Text tone="muted" size="sm" (date, author)
   ├─ Image ratio="16/9" eager, fetchPriority high, sizes="(min-width: 48rem) 65ch, 100vw"   (when the article has an image)
   ├─ RichText                                                                           (when the body is not empty)
   └─ Link                                    back to the blog
```

**React** (`blueprints/article/react/article.tsx`, complete except `ARTICLE_QUERY`):

```tsx
import type { RippleImage } from "__PKG__";
import { Container, Heading, Image, Link, RichText, Stack, Text } from "__PKG__/react";

export interface ArticlePageProps {
  article: {
    title: string;
    contentHtml: string;
    /** Publication date already formatted for the request locale, for example "March 4, 2026". */
    publishedLabel: string;
    /** Author name, or "" when unknown. */
    author: string;
    image: RippleImage | null;
  };
  blog: { title: string; url: string };
}

export function ArticlePage(props: ArticlePageProps) {
  const { article, blog } = props;
  const meta = article.author !== "" ? `${article.publishedLabel} · ${article.author}` : article.publishedLabel;
  return (
    <Container width="prose" py="12 md:20">
      <Stack as="article" gap="8 md:12">
        <Stack as="header" gap="2">
          <Heading level={1}>{article.title}</Heading>
          <Text tone="muted" size="sm">{meta}</Text>
        </Stack>
        {article.image !== null ? (
          <Image image={article.image} ratio="16/9" loading="eager" fetchPriority="high" sizes="(min-width: 48rem) 65ch, 100vw" />
        ) : null}
        {article.contentHtml !== "" ? <RichText html={article.contentHtml} /> : null}
        <Link href={blog.url}>{`Back to ${blog.title}`}</Link>
      </Stack>
    </Container>
  );
}
```

**Remix**: rules R-1 to R-4. **html**: rule H-1.

**Liquid** (`blueprints/article/liquid/templates/article.liquid`, complete):

```liquid
{%- liquid
  assign article_date = article.published_at | date: format: 'date'
  assign author = article.author | escape
  if article.author != blank
    assign meta = 'ripple.blueprints.article.meta' | t: date: article_date, author: author
  else
    assign meta = article_date
  endif
  assign blog_title = blog.title | escape
-%}
{% block 'container', width: 'prose', py: '12 md:20' %}
  {% block 'stack', as: 'article', gap: '8 md:12' %}
    {% block 'stack', as: 'header', gap: '2' %}
      {% block 'heading', level: 1 %}{{ article.title | escape }}{% endblock %}
      {% block 'text', tone: 'muted', size: 'sm' %}{{ meta }}{% endblock %}
    {% endblock %}
    {%- if article.image -%}
      {% block 'image', image: article.image, ratio: '16/9', loading: 'eager', fetch_priority: 'high', sizes: '(min-width: 48rem) 65ch, 100vw' %}{% endblock %}
    {%- endif -%}
    {%- if article.content != blank -%}
      {% block 'rich-text', html: article.content %}{% endblock %}
    {%- endif -%}
    {% block 'link', href: blog.url %}{{ 'ripple.blueprints.article.back' | t: title: blog_title }}{% endblock %}
  {% endblock %}
{% endblock %}
```

Locale keys (`ripple.blueprints.article.*`): `meta` "{{ date }} · {{ author }}"; `back` "Back to {{ title }}". Mask for BT-3: `{ "select": "header > .rp-text", "op": "text" }` (date formatting is host-owned). Evidence: `ripple/theme/templates/article.liquid` (`article.title`, `article.published_at | date: format: 'date'`, `article.author`, `article.image`, `article.content`). UNVERIFIED: `blog.url`, `blog.title` on the article template (documented globals, not re-read).

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Article | `blog(handle:) { articleByHandle(handle:) }` | `article` |
| Blog title and URL | `blog.title`; URL `/blogs/<blog handle>` | `blog.title`, `blog.url` |
| Date text | `new Intl.DateTimeFormat(<BCP 47 tag>, { dateStyle: "long" }).format(new Date(publishedAt))` | `article.published_at \| date: format: 'date'` |

```graphql
query RippleArticle($blog: String!, $article: String!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  blog(handle: $blog) {
    title
    handle
    articleByHandle(handle: $article) {
      id title contentHtml publishedAt
      image { url altText width height }
      authorV2 { name }
    }
  }
}
```

`author` is `authorV2.name` or `""`. A `null` blog or article is a 404 (2.5). UNVERIFIED against the schema in this session: `articleByHandle`, `authorV2`.

### No-JS behaviour

1. The page is static content and one link.

### Acceptance tests

BT-1 to BT-9, plus:

- **AR-1** (tier 2) Without an image and with an empty body: no `img`, no `.rp-rich-text`; the `h1` and the back link exist.
- **AR-2** (tier 2) With an image: it has `loading="eager"` and `fetchpriority="high"`.

---

## Blueprint: `page`

### Purpose

A content page (About, FAQ, policies written as pages): title and rich text body in a reading-width column.

### Regions

None.

### Components used

`container`, `heading`, `rich-text`, `stack`.

### Structure

```text
Container width="prose" py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Heading level 1          page title
   └─ RichText                 page body (when not empty)
```

**React** (`blueprints/page/react/page.tsx`, complete except `PAGE_QUERY`):

```tsx
import { Container, Heading, RichText, Stack } from "__PKG__/react";

export interface PagePageProps {
  page: { title: string; bodyHtml: string };
}

export function PagePage(props: PagePageProps) {
  const { page } = props;
  return (
    <Container width="prose" py="12 md:20">
      <Stack gap="8 md:12">
        <Heading level={1}>{page.title}</Heading>
        {page.bodyHtml !== "" ? <RichText html={page.bodyHtml} /> : null}
      </Stack>
    </Container>
  );
}
```

**Remix**: rules R-1 to R-4. **html**: rule H-1.

**Liquid** (`blueprints/page/liquid/templates/page.liquid`, complete):

```liquid
{% block 'container', width: 'prose', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'heading', level: 1 %}{{ page.title | escape }}{% endblock %}
    {%- if page.content != blank -%}
      {% block 'rich-text', html: page.content %}{% endblock %}
    {%- endif -%}
  {% endblock %}
{% endblock %}
```

No locale keys.

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Page | `page(handle:) { id title body }`; `bodyHtml` is `body` | `page.title`, `page.content` |

```graphql
query RipplePage($handle: String!, $country: CountryCode, $language: LanguageCode)
@inContext(country: $country, language: $language) {
  page(handle: $handle) { id title body }
}
```

A `null` page is a 404 (2.5). UNVERIFIED: that mock.shop has pages.

### No-JS behaviour

1. The page is static content.

### Acceptance tests

BT-1 to BT-9, plus:

- **PG-1** (tier 2) With an empty body: no `.rp-rich-text`.

---

## Blueprint: `contact`

### Purpose

A contact page: the page's title and body, then a form with name, email and message. The form works as a plain POST.

### Regions

None.

### Components used

`banner`, `button`, `container`, `heading`, `input`, `label`, `rich-text`, `stack`, `textarea`.

Field (`09-components-foundation.md`) is not used: Label, Input and Textarea in a Stack give the same markup with fewer parts for an agent to get wrong, and this form has no per-field error text.

### Structure

```text
Container width="prose" py="12 md:20"
└─ Stack gap="8 md:12"
   ├─ Stack as="header" gap="2":  Heading level 1 (page title); RichText (page body, when not empty)
   └─ form#contact-form  method="post"
      └─ Stack gap="4"
         ├─ Banner tone="success"       after a successful post
         ├─ Banner tone="destructive"   after a failed post
         ├─ Stack gap="2":  Label for contact-name;    Input id="contact-name"    autocomplete name
         ├─ Stack gap="2":  Label for contact-email;   Input id="contact-email"   type email, required, autocomplete email
         ├─ Stack gap="2":  Label for contact-message; Textarea id="contact-message" required, rows 6
         └─ Button type="submit"
```

Field names per backend:

| Field | hydrogen backend (POST `/api/contact`) | liquid backend (`{% form 'contact' %}`) |
|---|---|---|
| Name | `name` | `contact[name]` |
| Email | `email` | `contact[email]` |
| Message | `message` | `contact[body]` |

Masks for BT-3: `{ "select": "#contact-form", "op": "attr", "name": "action" }`, `{ "select": "#contact-form", "op": "drop-attr", "name": "accept-charset" }`, `{ "select": "#contact-form", "op": "drop-attr", "name": "class" }`, `{ "select": "#contact-form > input[type=\"hidden\"]", "op": "remove" }`, `{ "select": "#contact-form .rp-input, #contact-form .rp-textarea", "op": "attr", "name": "name" }`.

**React** (`blueprints/contact/react/contact.tsx`, complete):

```tsx
import { Banner, Button, Container, Heading, Input, Label, RichText, Stack, Textarea } from "__PKG__/react";

export interface ContactPageProps {
  page: { title: string; bodyHtml: string };
  /** From contactStatus(request) (lib/contact-route.ts). */
  status: "idle" | "success" | "error";
  action?: string;
}

export function ContactPage(props: ContactPageProps) {
  const { page, status, action = "/api/contact" } = props;
  return (
    <Container width="prose" py="12 md:20">
      <Stack gap="8 md:12">
        <Stack as="header" gap="2">
          <Heading level={1}>{page.title}</Heading>
          {page.bodyHtml !== "" ? <RichText html={page.bodyHtml} /> : null}
        </Stack>
        <form id="contact-form" method="post" action={action}>
          <Stack gap="4">
            {status === "success" ? <Banner tone="success">Thanks. We will reply by email.</Banner> : null}
            {status === "error" ? <Banner tone="destructive">The message was not sent. Check the fields and try again.</Banner> : null}
            <Stack gap="2">
              <Label htmlFor="contact-name">Name</Label>
              <Input id="contact-name" name="name" autoComplete="name" />
            </Stack>
            <Stack gap="2">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" type="email" name="email" autoComplete="email" required />
            </Stack>
            <Stack gap="2">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea id="contact-message" name="message" rows={6} required />
            </Stack>
            <Button type="submit">Send</Button>
          </Stack>
        </form>
      </Stack>
    </Container>
  );
}
```

The page data uses `PAGE_QUERY` of the `page` blueprint with the handle `contact`; when the page does not exist the route code passes `{ title: "Contact", bodyHtml: "" }` instead of answering 404.

`blueprints/contact/react/lib/contact-route.ts` (complete; the remix file is identical):

```ts
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactMessage { name: string; email: string; message: string }

function text(form: FormData, name: string, max: number): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Handles POST /api/contact. `send` is supplied by the project (an email service or a helpdesk API)
 * and MUST throw when the message was not accepted.
 * Answers 303 to `<returnPath>?contact=success#contact-form` or `?contact=error#contact-form`.
 */
export async function handleContactPost(
  request: Request,
  send: (message: ContactMessage) => Promise<void>,
  returnPath = "/pages/contact",
): Promise<Response> {
  const form = await request.formData();
  const message: ContactMessage = {
    name: text(form, "name", 200),
    email: text(form, "email", 254),
    message: text(form, "message", 5000),
  };
  let status: "success" | "error" = "error";
  if (EMAIL.test(message.email) && message.message !== "") {
    try {
      await send(message);
      status = "success";
    } catch {
      status = "error";
    }
  }
  return new Response(null, {
    status: 303,
    headers: { location: `${returnPath}?contact=${status}#contact-form` },
  });
}

/** Reads the status for <ContactPage status={...}> from the request URL. */
export function contactStatus(request: Request): "idle" | "success" | "error" {
  const value = new URL(request.url).searchParams.get("contact");
  return value === "success" || value === "error" ? value : "idle";
}
```

`returnPath` is a constant chosen by the project (with its locale prefix), never a value from the request. After an error the fields are empty; values are not echoed through the URL.

**Remix**: rules R-1 to R-4; the `<form>` additionally carries the bare attribute `data-rmx-document` so that the Remix router does not intercept the POST. **html**: rule H-1 with `status: "idle"`.

**Liquid** (`blueprints/contact/liquid/templates/page.contact.liquid`, complete):

```liquid
{%- liquid
  assign name_label = 'ripple.blueprints.contact.name' | t
  assign email_label = 'ripple.blueprints.contact.email' | t
  assign message_label = 'ripple.blueprints.contact.message' | t
-%}
{% block 'container', width: 'prose', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12' %}
    {% block 'stack', as: 'header', gap: '2' %}
      {% block 'heading', level: 1 %}{{ page.title | escape }}{% endblock %}
      {%- if page.content != blank -%}
        {% block 'rich-text', html: page.content %}{% endblock %}
      {%- endif -%}
    {% endblock %}
    {% form 'contact', id: 'contact-form' %}
      {% block 'stack', gap: '4' %}
        {%- if form.posted_successfully? -%}
          {% block 'banner', tone: 'success' %}{{ 'ripple.blueprints.contact.success' | t }}{% endblock %}
        {%- endif -%}
        {%- if form.errors -%}
          {% block 'banner', tone: 'destructive' %}{{ 'ripple.blueprints.contact.error' | t }}{% endblock %}
        {%- endif -%}
        {% block 'stack', gap: '2' %}
          {% block 'label', html_for: 'contact-name' %}{{ name_label }}{% endblock %}
          {% block 'input', id: 'contact-name', name: 'contact[name]', auto_complete: 'name', default_value: form.name %}{% endblock %}
        {% endblock %}
        {% block 'stack', gap: '2' %}
          {% block 'label', html_for: 'contact-email' %}{{ email_label }}{% endblock %}
          {% block 'input', id: 'contact-email', type: 'email', name: 'contact[email]', auto_complete: 'email', required: true, default_value: form.email %}{% endblock %}
        {% endblock %}
        {% block 'stack', gap: '2' %}
          {% block 'label', html_for: 'contact-message' %}{{ message_label }}{% endblock %}
          {% block 'textarea', id: 'contact-message', name: 'contact[body]', rows: 6, required: true, default_value: form.body %}{% endblock %}
        {% endblock %}
        {% block 'button', type: 'submit' %}{{ 'ripple.blueprints.contact.send' | t }}{% endblock %}
      {% endblock %}
    {% endform %}
  {% endblock %}
{% endblock %}
```

Locale keys (`ripple.blueprints.contact.*`): `name` "Name"; `email` "Email"; `message` "Message"; `send` "Send"; `success` "Thanks. We will reply by email."; `error` "The message was not sent. Check the fields and try again.".

On Liquid the platform refills fields after an error (`form.name`, `form.email`, `form.body`); on the hydrogen backend they are empty. The fixture comparison of BT-3 uses `status: "idle"`, where both are empty. Evidence: `ripple/theme/templates/page.contact.liquid` exists in the base theme (not re-read line by line in this session); `{% form %}` output shape verified for `localization` only (LocaleSelector, Evidence). UNVERIFIED: the field names `contact[name]`, `contact[email]`, `contact[body]` and the refill properties `form.name`, `form.email`, `form.body` (standard theme practice); whether the platform shows a captcha challenge page after the POST.

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Page | `page(handle: "contact")` (`PAGE_QUERY`) | `page` |
| Post result | `contactStatus(request)` | `form.posted_successfully?`, `form.errors` |
| Delivery | project function `send` | the platform emails the store |

### No-JS behaviour

1. The form posts; the browser validates `required` and `type="email"` first.
2. The page reloads at `#contact-form` with a success or error Banner.
3. Nothing on this page needs script.

### Acceptance tests

BT-1 to BT-9, plus:

- **CT-1** (tier 2) Each of the three controls has exactly one `label[for]` naming it; the email input and the textarea have `required`.
- **CT-2** (tier 2) `status: "success"` prints one `.rp-banner[data-tone="success"]`; `status: "error"` prints one `.rp-banner[data-tone="destructive"]`; `idle` prints no Banner.
- **CT-3** (tier 1) `handleContactPost`: a valid post calls `send` once with trimmed values and answers 303 to `/pages/contact?contact=success#contact-form`; an invalid email or an empty message does not call `send` and answers `?contact=error#contact-form`; a `send` that throws answers `error`.
- **CT-4** (tier 6) With JavaScript disabled, a valid post ends on a page that shows the success Banner.

---

## Blueprint: `not-found`

### Purpose

The page shown for an unknown URL (HTTP 404): a message and ways forward.

### Regions

None.

### Components used

`button`, `container`, `empty-state`, `heading`, `search-form`, `stack`, `text`.

### Structure

```text
Container py="12 md:20"
└─ Stack gap="8 md:12" align="center"
   ├─ EmptyState
   │  ├─ Heading level 1
   │  ├─ Text tone="muted"
   │  └─ Button href (home)
   └─ SearchForm
```

**React** (`blueprints/not-found/react/not-found.tsx`, complete):

```tsx
import { Button, Container, EmptyState, Heading, SearchForm, Stack, Text } from "__PKG__/react";

export interface NotFoundPageProps {
  /** Home URL, for example "/" or "/fr-ca". */
  homeUrl: string;
  searchUrl?: string;
}

export function NotFoundPage(props: NotFoundPageProps) {
  const { homeUrl, searchUrl = "/search" } = props;
  return (
    <Container py="12 md:20">
      <Stack gap="8 md:12" align="center">
        <EmptyState>
          <Heading level={1}>Page not found</Heading>
          <Text tone="muted">The page you were looking for does not exist.</Text>
          <Button href={homeUrl}>Continue shopping</Button>
        </EmptyState>
        <SearchForm action={searchUrl} />
      </Stack>
    </Container>
  );
}
```

**Remix**: rules R-1 to R-4. **html**: rule H-1.

**Liquid** (`blueprints/not-found/liquid/templates/404.liquid`, complete):

```liquid
{% block 'container', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12', align: 'center' %}
    {% block 'empty-state' %}
      {% block 'heading', level: 1 %}{{ 'ripple.blueprints.not-found.title' | t }}{% endblock %}
      {% block 'text', tone: 'muted' %}{{ 'ripple.blueprints.not-found.text' | t }}{% endblock %}
      {% block 'button', href: routes.root_url %}{{ 'ripple.blueprints.not-found.cta' | t }}{% endblock %}
    {% endblock %}
    {% block 'search-form' %}{% endblock %}
  {% endblock %}
{% endblock %}
```

Locale keys (`ripple.blueprints.not-found.*`): `title` "Page not found"; `text` "The page you were looking for does not exist."; `cta` "Continue shopping".

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Home URL | `requestContext.locale.pathPrefix \|\| "/"` | `routes.root_url` |
| Status | the response status MUST be 404. The app's not-found path MUST return a 404 `Response` through the middleware chain so that `handleShopifyRedirects` can run first (`ripple/docs/research/remix-3.md` section 8.1) | the platform sets 404 |

No query.

### No-JS behaviour

1. The button is a link; the search form is a GET form.

### Acceptance tests

BT-1 to BT-9, plus:

- **NF-1** (tier 5, hydrogen backend) A request for `/no-such-page` answers status 404 and the body contains the `h1` of this blueprint inside `main#main`.

---

## Blueprint: `password`

### Purpose

The page a visitor sees when the storefront is password protected: the shop name, a message, and a password form.

Scope per backend: on Liquid this is the platform's password page (`templates/password.liquid` with its own layout). The hydrogen backend has no storefront-password feature; there the blueprint is a presentational page for projects that gate a storefront themselves, and the route that checks the password is project code that this document does not specify (Ledger issues, item 14).

### Regions

None.

### Components used

`button`, `container`, `form-message`, `heading`, `input`, `label`, `skip-link`, `stack`, `text`.

### Structure

This blueprint does NOT render inside `layout`: no header, footer or overlays. It prints its own `<main>` (the one exception to rule BP-2); tests BT-4 and LT-1 do not require a header or footer here.

```text
SkipLink href="#main"
main#main[tabindex=-1]
└─ Container width="prose" py="12 md:20"
   └─ Stack gap="8 md:12" align="center" textAlign="center"
      ├─ Heading level 1                 shop name
      ├─ Text variant="lead"             message (when present)
      └─ form#password-form  method="post"
         └─ Stack gap="2" align="stretch" textAlign="start"
            ├─ Label for password-input
            ├─ Input id="password-input" type="password" name="password" required autocomplete="off"
            ├─ FormMessage id="password-error"     after a wrong password; the input then has invalid + describedBy
            └─ Button type="submit"
```

**React** (`blueprints/password/react/password.tsx`, complete):

```tsx
import { Button, Container, FormMessage, Heading, Input, Label, SkipLink, Stack, Text } from "__PKG__/react";

export interface PasswordPageProps {
  shopName: string;
  /** Message from the merchant, or "". */
  message: string;
  /** URL the form posts to. Project route. */
  action: string;
  /** True after a wrong password. */
  error: boolean;
}

export function PasswordPage(props: PasswordPageProps) {
  const { shopName, message, action, error } = props;
  return (
    <>
      <SkipLink>Skip to content</SkipLink>
      <main id="main" tabIndex={-1}>
        <Container width="prose" py="12 md:20">
          <Stack gap="8 md:12" align="center" textAlign="center">
            <Heading level={1}>{shopName}</Heading>
            {message !== "" ? <Text variant="lead">{message}</Text> : null}
            <form id="password-form" method="post" action={action}>
              <Stack gap="2" align="stretch" textAlign="start">
                <Label htmlFor="password-input">Password</Label>
                <Input
                  id="password-input"
                  type="password"
                  name="password"
                  autoComplete="off"
                  required
                  invalid={error}
                  describedBy={error ? "password-error" : undefined}
                />
                {error ? <FormMessage id="password-error">Wrong password. Try again.</FormMessage> : null}
                <Button type="submit">Enter</Button>
              </Stack>
            </form>
          </Stack>
        </Container>
      </main>
    </>
  );
}
```

The document is produced with `renderDocument` (2.6) with `body` set to this component's markup, `commerce: { host, analytics: false }`.

**Remix**: rules R-1 to R-4; the `<form>` carries `data-rmx-document`. **html**: rule H-1 with `error: false`.

**Liquid**, two files. `blueprints/password/liquid/layout/password.liquid` (complete):

```liquid
<!doctype html>
<html lang="{{ request.locale.iso_code }}">
  <head>
    {% render 'rp-head' %}
  </head>
  <body>
    {% block 'skip-link' %}{{ 'ripple.blueprints.layout.skip' | t }}{% endblock %}
    <main id="main" tabindex="-1">
      {{ content_for_layout }}
    </main>
  </body>
</html>
```

`blueprints/password/liquid/templates/password.liquid` (complete):

```liquid
{% layout 'password' %}
{%- liquid
  assign password_label = 'ripple.blueprints.password.label' | t
-%}
{% block 'container', width: 'prose', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12', align: 'center', text_align: 'center' %}
    {% block 'heading', level: 1 %}{{ shop.name | escape }}{% endblock %}
    {%- if shop.password_message != blank -%}
      {% block 'text', variant: 'lead' %}{{ shop.password_message | escape }}{% endblock %}
    {%- endif -%}
    {% form 'storefront_password', id: 'password-form' %}
      {% block 'stack', gap: '2', align: 'stretch', text_align: 'start' %}
        {% block 'label', html_for: 'password-input' %}{{ password_label }}{% endblock %}
        {%- if form.errors -%}
          {% block 'input', id: 'password-input', type: 'password', name: 'password', auto_complete: 'off', required: true, invalid: true, described_by: 'password-error' %}{% endblock %}
          {% block 'form-message', id: 'password-error' %}{{ 'ripple.blueprints.password.error' | t }}{% endblock %}
        {%- else -%}
          {% block 'input', id: 'password-input', type: 'password', name: 'password', auto_complete: 'off', required: true %}{% endblock %}
        {%- endif -%}
        {% block 'button', type: 'submit' %}{{ 'ripple.blueprints.password.submit' | t }}{% endblock %}
      {% endblock %}
    {% endform %}
  {% endblock %}
{% endblock %}
```

Locale keys (`ripple.blueprints.password.*`): `label` "Password"; `error` "Wrong password. Try again."; `submit` "Enter".

Masks for BT-3: the form masks of `contact` with `#password-form`. Evidence: `ripple/theme/templates/password.liquid` (`{% layout 'password' %}`, `shop.password_message`), `ripple/theme/layout/password.liquid` (`content_for_header`, `content_for_layout`). UNVERIFIED: the form type name `storefront_password` and its field name `password` (standard theme practice; not re-read in docs in this session).

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Shop name | `shop.name` | `shop.name` |
| Message | project-defined; `""` for none | `shop.password_message` |
| Post result | project route; passes `error` | `form.errors` |

### No-JS behaviour

1. The form posts; a wrong password reloads the page with the error message linked to the input by `aria-describedby`.
2. Nothing on this page needs script.

### Acceptance tests

BT-1 to BT-3, BT-6 to BT-9, plus:

- **PW-1** (tier 2) The document has one `main#main`, one `h1`, no `header.rp-header`, no `footer.rp-footer`, no `dialog`.
- **PW-2** (tier 2) With `error: true`: the input has `aria-invalid="true"` and `aria-describedby="password-error"`, and `#password-error` exists with `role="alert"`.
- **PW-3** (tier 2, Liquid) `templates/password.liquid` starts with `{% layout 'password' %}` and `layout/password.liquid` contains `content_for_layout` exactly once.

---

## Blueprint: `gift-card`

### Purpose

The page a buyer opens from a gift card email: the balance, the code, its state, and a link to start shopping.

Scope per backend: on Liquid this is the platform's `gift_card` template. The Storefront API does not expose a gift card by URL, so on the hydrogen backend the blueprint is a presentational page whose data the project supplies (Ledger issues, item 14).

V1 has no copy-to-clipboard button and no QR code. The base theme implements both with theme JavaScript (`ripple/theme/blocks/gift-card.liquid`, command `--copy-code`); neither has a Ripple element (ledger section 8.6 maps the block to this blueprint only). The code is printed as selectable text.

### Regions

None.

### Components used

`banner`, `button`, `card`, `container`, `heading`, `link`, `stack`, `text`.

### Structure

```text
Container width="prose" py="12 md:20"
└─ Stack gap="8 md:12" align="center" textAlign="center"
   ├─ Heading level 1
   ├─ Banner tone="warning"                    when the card is expired or disabled
   ├─ Card p="4 md:8"
   │  └─ Stack gap="2"
   │     ├─ Text variant="overline" tone="muted"     "Balance"
   │     ├─ Text size="3xl" weight="semibold"        formatted balance
   │     ├─ Text variant="overline" tone="muted"     "Code"
   │     ├─ Text size="xl" weight="semibold"         the code
   │     └─ Text tone="muted" size="sm"              expiry date (when the card expires)
   ├─ Button href (home)
   └─ Link href (wallet pass)                   when a pass URL exists
```

**React** (`blueprints/gift-card/react/gift-card.tsx`, complete):

```tsx
import { Banner, Button, Card, Container, Heading, Link, Stack, Text } from "__PKG__/react";

export interface GiftCardPageProps {
  /** Balance already formatted as money, for example "$25.00". */
  balance: string;
  code: string;
  state: "active" | "expired" | "disabled";
  /** Expiry date already formatted, or null when the card does not expire. */
  expiresLabel: string | null;
  /** Apple Wallet pass URL, or null. */
  passUrl: string | null;
  homeUrl: string;
}

export function GiftCardPage(props: GiftCardPageProps) {
  const { balance, code, state, expiresLabel, passUrl, homeUrl } = props;
  return (
    <Container width="prose" py="12 md:20">
      <Stack gap="8 md:12" align="center" textAlign="center">
        <Heading level={1}>Your gift card</Heading>
        {state === "expired" ? <Banner tone="warning">This gift card has expired.</Banner> : null}
        {state === "disabled" ? <Banner tone="warning">This gift card is disabled.</Banner> : null}
        <Card p="4 md:8">
          <Stack gap="2">
            <Text variant="overline" tone="muted">Balance</Text>
            <Text size="3xl" weight="semibold">{balance}</Text>
            <Text variant="overline" tone="muted">Code</Text>
            <Text size="xl" weight="semibold">{code}</Text>
            {expiresLabel !== null ? <Text tone="muted" size="sm">{`Expires ${expiresLabel}`}</Text> : null}
          </Stack>
        </Card>
        <Button href={homeUrl}>Start shopping</Button>
        {passUrl !== null ? <Link href={passUrl}>Add to Apple Wallet</Link> : null}
      </Stack>
    </Container>
  );
}
```

**Remix**: rules R-1 to R-4. **html**: rule H-1.

**Liquid** (`blueprints/gift-card/liquid/templates/gift_card.liquid`, complete):

```liquid
{%- liquid
  assign expires_on = gift_card.expires_on | date: format: 'date'
-%}
{% block 'container', width: 'prose', py: '12 md:20' %}
  {% block 'stack', gap: '8 md:12', align: 'center', text_align: 'center' %}
    {% block 'heading', level: 1 %}{{ 'ripple.blueprints.gift-card.title' | t }}{% endblock %}
    {%- if gift_card.expired -%}
      {% block 'banner', tone: 'warning' %}{{ 'ripple.blueprints.gift-card.expired' | t }}{% endblock %}
    {%- elsif gift_card.enabled == false -%}
      {% block 'banner', tone: 'warning' %}{{ 'ripple.blueprints.gift-card.disabled' | t }}{% endblock %}
    {%- endif -%}
    {% block 'card', p: '4 md:8' %}
      {% block 'stack', gap: '2' %}
        {% block 'text', variant: 'overline', tone: 'muted' %}{{ 'ripple.blueprints.gift-card.balance' | t }}{% endblock %}
        {% block 'text', size: '3xl', weight: 'semibold' %}{{ gift_card.balance | money }}{% endblock %}
        {% block 'text', variant: 'overline', tone: 'muted' %}{{ 'ripple.blueprints.gift-card.code' | t }}{% endblock %}
        {% block 'text', size: 'xl', weight: 'semibold' %}{{ gift_card.code | escape }}{% endblock %}
        {%- if gift_card.expires_on -%}
          {% block 'text', tone: 'muted', size: 'sm' %}{{ 'ripple.blueprints.gift-card.expires' | t: date: expires_on }}{% endblock %}
        {%- endif -%}
      {% endblock %}
    {% endblock %}
    {% block 'button', href: routes.root_url %}{{ 'ripple.blueprints.gift-card.cta' | t }}{% endblock %}
    {%- if gift_card.pass_url -%}
      {% block 'link', href: gift_card.pass_url %}{{ 'ripple.blueprints.gift-card.wallet' | t }}{% endblock %}
    {%- endif -%}
  {% endblock %}
{% endblock %}
```

The template renders in `layout/theme.liquid` (header and footer present), so the buyer can continue to the store.

Locale keys (`ripple.blueprints.gift-card.*`): `title` "Your gift card"; `expired` "This gift card has expired."; `disabled` "This gift card is disabled."; `balance` "Balance"; `code` "Code"; `expires` "Expires {{ date }}"; `cta` "Start shopping"; `wallet` "Add to Apple Wallet".

Masks for BT-3: `{ "select": ".rp-card .rp-text", "op": "text" }` (money and date formatting are host-owned). Evidence: `ripple/theme/blocks/gift-card.liquid` (`gift_card.balance`, `gift_card.code`, `gift_card.expired`, `gift_card.enabled`, `gift_card.expires_on | date: format: 'date'`, `gift_card.pass_url`), `ripple/theme/templates/gift_card.liquid`.

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Gift card | none in the Storefront API; project-supplied props | the global `gift_card` |
| Money text | `formatMoney(money, { locale }).localizedString` (`05-commerce.md` section 11.2) | `gift_card.balance \| money` |

### No-JS behaviour

1. The page is static text and two links. The code is selectable text.

### Acceptance tests

BT-1 to BT-9, plus:

- **GC-1** (tier 2) `state: "expired"` prints exactly one `.rp-banner[data-tone="warning"]`; `state: "active"` prints none.
- **GC-2** (tier 2) With `passUrl: null` and `expiresLabel: null`: no `.rp-link` in `main`, and four `.rp-text` elements inside `.rp-card`.

---

## 3. Cross-document requirements

Each item is a requirement this document places on another document. Until the owning document adopts it, the implementer of this document MUST treat the item as the specification.

| Id | On | Requirement |
|---|---|---|
| X-1 | `09`, `11` | These components need a Liquid snippet file (`snippets/rp-<id>.liquid`, the `embeddedBy` mechanism of `07-manifest-registry-cli.md` rule MB-1) because a component of this document renders them from a block or snippet file: `icon` (by `header`, `mobile-nav`, `navigation-menu`, `locale-selector`, `account-link`), `icon-button` (by `header`, `mobile-nav`), `button` (by `newsletter-form`, `locale-selector`), `input` (by `newsletter-form`), `logo`, `navigation-menu`, `account-link`, `link-list` (by `header`, `footer`), `cart-link` (by `header`), `product-card` (by `featured-collection`). Their manifests MUST list the embedding components in `liquid.embeddedBy`. |
| X-2 | `11` | CartLink accepts `drawer` (Liquid) / `cartDrawer` (TSX): the id of a CartDrawer, printed as `data-rp-open` on its link, omitted when unset; and `href` (Liquid, default `routes.cart_url`) / `cartUrl` (TSX, default `/cart`). |
| X-3 | `11` | The components called in section 2.4 accept those signatures, and region-owning Liquid blocks follow assumption A-1 (region through `content`, one `rp-<component id>-region` snippet per owned region). SearchForm on Liquid prints `<input type="hidden" name="type" value="product">`. CartDrawer's dialog id defaults to `cart-drawer`. |
| X-4 | `11` | CheckoutButton is inert when the cart is empty (hydrogen: the link is not printed or has `aria-disabled="true"`; Liquid: the submit button is `disabled`), and `rp-cart` keeps that state in sync after a mutation. |
| X-5 | `13` | The Liquid shim implements `{% form %}` for the types `localization`, `customer`, `contact`, `storefront_password` (and `product`, `cart` for doc 11): it prints `<form method="post" action="<route>" id="<id>" class="<class>" accept-charset="UTF-8">`, the hidden inputs `form_type` and `utf8`, for `localization` also `_method` and `return_to`, and exposes a `form` object with `posted_successfully?`, `errors`, `email`, `name`, `body` taken from the test's input. It also implements `{% layout %}`, `{% paginate %}` with `paginate.previous`, `paginate.next`, and `{% partial %}` (prints its body). |
| X-6 | `06`, `13` | The filter `date` joins the Liquid subset of rule L-13 with two forms: `date: '%Y'` and `date: format: 'date'`. The shim implements both; with `format: 'date'` it prints the ISO date `YYYY-MM-DD` (date text is masked in every comparison that contains it). The shim also provides the globals `shop` (`name`, `policies`, `brand.logo`, `password_message`), `routes` (`root_url`, `cart_url`, `search_url`, `all_products_collection_url`, `account_url`, `account_login_url`), `linklists`, `localization`, `request.locale.iso_code`, `template.name`, `customer`, `collections`, `search`, `gift_card`, and `t` with named arguments and `count` pluralisation (`one`, `other`). |
| X-7 | `07` | `pnpm gen` renders each blueprint's react file with the sample data of 2.5 into `blueprints/<id>/html/<id>.html` (rule H-1) and verifies it in the generation check. The `layout` blueprint has a file with key `types`. `blueprint.json` file keys follow 2.1. |
| X-8 | `03` | `base.css` contains `html { scroll-padding-block-start: var(--rp-header-block-size, 0px); }` and Header sets `--rp-header-block-size` on `:root:has(.rp-header[data-sticky])` so that in-page targets (`#main`, `#footer-menu`, `#newsletter`, `#contact-form`) are not covered by the sticky header. It also contains `rp-view-event { display: block; }` (`05-commerce.md` section 12). |
| X-9 | `06` | The generated intrinsic-element type declarations for React and Remix include `rp-view-event` with the attributes `view-event-trigger` and `view-event-payload`. |
| X-10 | `06` | Rule X-9 of `06-bindings.md` ("no other binding uses `innerHTML`") applies to bindings. Blueprint files MAY use `dangerouslySetInnerHTML` (React) or `innerHTML={unsafeHTML(...)}` (Remix) for exactly one purpose: the JSON body of a `<script type="application/json">` element, with `<` escaped as `<`. The import lint of `06-bindings.md` section 2 does not run on blueprint files. |
| X-11 | `13` | Sample data files `blueprints/_sample/<id>.json` and the fixture resources of section 1.6 exist in both forms (JSON, Liquid drops). Tests BT-1 to BT-9 run for every blueprint in every host. |
| X-12 | `14` | `snippets/rp-head.liquid` prints the head described under `layout`, Structure. `locales/en.default.json` contains every `ripple.blueprints.*` key listed in this document. `templates/page.contact.liquid` is an alternate template the merchant assigns. |
| X-13 | `08` | The agent kit's blueprint index (`llms.txt`, skill references) lists the 14 blueprints with the `route` values of 2.1 and states rule BP-9 (page blueprints never read cart, menus or shop). |

---

## 4. Acceptance criteria for this document's deliverables

A script can check each line.

1. `manifest.json` contains exactly these component ids from this document: `account-link`, `announcement-bar`, `featured-collection`, `footer`, `header`, `hero`, `link-list`, `locale-selector`, `logo`, `mobile-nav`, `navigation-menu`, `newsletter-form`; each with the kind, tags and Liquid tier of ledger 8.4 and `milestone: "M4"`.
2. `manifest.json` `blueprints` has exactly the 14 keys of ledger 8.5; each has four host file lists, each non-empty, with the targets of 2.1.
3. Every fixture named in a component section exists as `components/<id>/fixtures/<name>.html` and passes tier 2 in all four hosts (`02-html-contract.md` section 11).
4. Every "Acceptance tests" item of every component and blueprint exists as a test whose title starts with the item's id (for example `LT-6`, `CL-3`) or, for component items, with `<component id> #<n>`.
5. Tests BT-1 to BT-9 pass for all 14 blueprints in all four hosts (BT-1's Theme Check part and BT-5's partial part on Liquid only).
6. `grep -R "TODO\|FIXME" blueprints/ components/{header,footer,announcement-bar,navigation-menu,mobile-nav,link-list,logo,locale-selector,account-link,newsletter-form,hero,featured-collection}` prints nothing.
7. `locales/en.default.json` contains every locale key named in this document, and no blueprint Liquid file contains a string literal between `>` and `<` other than whitespace and Liquid output.
8. No file under `blueprints/*/liquid/` contains `{% section`, `{% sections`, `{% content_for`, `{% include`, `{% javascript`, `{% stylesheet`, `{% style`, or a `<script` element other than `type="application/json"`.
9. `blueprints/*/react/*.tsx` and `blueprints/*/remix/*.tsx` import only from `__PKG__`, `__PKG__/react` or `__PKG__/remix`, `react` (type only), `remix/component`, and relative files of the same blueprint or of `layout`; `lib/locale-route.ts` imports only from `@shopify/hydrogen`.

---

## 5. Evidence and UNVERIFIED

Evidence (read in the local clones or verified with the Shopify docs tool in the session that wrote this document):

- Ledger: `ripple/docs/00-decisions.md` D-006, D-008, D-009, D-010, D-017, D-019 to D-024, D-028, D-033 to D-038, D-041 to D-051, D-063, D-066, D-068; sections 6, 7, 8.4, 8.5, 8.6.
- Sibling documents: `02-html-contract.md` (fixtures, masks, id rules), `04-elements.md` sections 9.3, 10.1, 10.2, 10.6, 10.9, 10.15, `05-commerce.md` sections 4, 6, 7.5, 8, 10, 11, 12, `06-bindings.md` sections 7 and 8, `07-manifest-registry-cli.md` (`#/$defs/blueprint`, `#/$defs/file`), `08-agent-kit-and-evals.md` (spacing rhythm), `09-components-foundation.md` (props of every foundation component called here; Pagination; Announcer placement).
- Base theme: `ripple/theme/layout/theme.liquid`, `layout/password.liquid`, `templates/*.liquid` (file names; `collection`, `search`, `article`, `password`, `gift_card` read), `blocks/header.liquid`, `footer.liquid`, `basic-menu.liquid`, `main-menu.liquid`, `logo.liquid`, `gift-card.liquid`, `featured-collection.liquid`, `snippets/localization-form.liquid`.
- Hydrogen: `hydrogen/packages/hydrogen/src/core/i18n/href.ts`, `match.ts`, `define.ts`, `locale.ts`, `types.ts`, `index.ts`; `hydrogen/packages/hydrogen/skills/hydrogen-markets/SKILL.md`.
- Remix: `ripple/docs/research/remix-3.md` sections 5 and 8.
- Liquid tags: `ripple/docs/research/liquid-blocks-partials.md` sections 2.1, 2.2, 7.
- Shopify docs tool: `{% form 'localization' %}` output; `form.posted_successfully?`; Storefront API `Menu` and `MenuItem` fields.

UNVERIFIED (nobody ran or read these; each has a stated default):

1. Everything about `10-components-interactive.md` and `11-components-commerce.md` signatures (2.4). Default: the table of 2.4; the owning document wins.
2. mock.shop content: `menu`, `blog`, `page`, `localization`, the `frontpage` collection. mock.shop was not reachable. Default: every blueprint renders its empty form.
3. Storefront API fields not re-checked: `shop.brand.logo.image`, the four policy fields, `localization.availableLanguages`, `search.totalCount`, `articleByHandle`, `authorV2`, `optionValues`, `selectedOrFirstAvailableVariant` and its arguments, `Collection.products.filters`.
4. `storefrontClient.query(document, { variables })` as the call that runs a query.
5. Liquid: `template.name`, `collection.filters`, `collection.sort_options`, `collection.sort_by`, `collection.default_sort_by`, `collection.products_count`, `result.object_type`, `paginate.previous`, the form types `contact`, `customer`, `storefront_password` and their field names, `blog.url` on the article template.
6. Standard Events payload shapes for `collection_viewed`, `search_viewed`, `cart_viewed`.
7. How the platform treats a partial name declared in both the layout and a template (avoided by rule L-B), and whether partials may be nested inside `{% paginate %}` in the other order (this document always puts `paginate` inside the partial, as the base theme does).
8. React hydration of `document.body` (rule DS-5, test LT-10) and the Remix client runtime with a string document shell (rule DS-6).
9. No code in this document was executed. The TypeScript in 1.2, 2.6, 2.7 and `contact` was written against the signatures in the cited Hydrogen files and the web platform types only.

---

## Ledger issues

Each item: what the ledger says or omits, and what this document applied.

1. **Kind of Header, Footer and FeaturedCollection (8.4: `static`).** Their default bodies embed `native` and `commerce` components (NavigationMenu, CartLink, Carousel). D-006 derives kind from the `default` fixture. Applied: the `default` fixture of Header and Footer uses children, and FeaturedCollection's uses `layout="grid"`, so the kind is `static` as listed; the default bodies are in separate fixtures and their custom elements belong to the embedded components' manifests.
2. **No `shop` resource in section 6.4.** Header, Footer and Logo need the shop name, URL and logo. Applied: the object prop `shop` (`RippleShop`, section 1.3), TSX hosts only; Liquid reads the globals.
3. **No way to override strings a TSX component prints (D-066 covers Liquid keys only).** Applied: the optional `strings` prop of section 1.4.
4. **NavigationMenu panel ids.** D-020 lists the suffix `-item-<v>`; `04-elements.md` section 10.15 writes panels as `<id>-content-<handle>`. Menu items have no stable handle on Liquid. Applied: panel id `<id>-item-<n>` with `n` the 1-based position of the top-level item; and the Liquid-only `links` param of LinkList (an array with `.title` and `.url`) so that `shop.policies` can be listed without building a menu.
5. **MobileNav and Drawer classes.** 8.4 says MobileNav uses `rp-dialog`; D-008 gives Drawer the classes `rp-drawer`, `rp-drawer-panel`. A component's root class must be its own (`02-html-contract.md` N-1). Applied: MobileNav prints `rp-mobile-nav` and `rp-mobile-nav-panel` and ships its own panel CSS; it does not embed Drawer.
6. **LocaleSelector tier `resource` and ids.** Its body is fully determined by data, and it needs an id although D-020 does not list it among components that require one. Applied: `id` is required (it names the popover panel and, with the suffix `-content`, the form); the Liquid block ignores `content`.
7. **NewsletterForm `status`.** Section 6 has no vocabulary for a form's server result. Applied: enum `idle`, `success`, `error`; `id` is required (it names the error message `<id>-error` and the redirect fragment).
8. **Universal props on a root printed by `{% form %}`.** The Liquid roots of NewsletterForm and of LocaleSelector's form are printed by the form tag, which accepts `id` and `class` only. Applied: NewsletterForm on Liquid does not accept `attributes`, `span` or `hidden`; its `{% doc %}` says so.
9. **Locale keys for blueprints.** D-066 defines `ripple.<component id>.<key>` only. Applied: `ripple.blueprints.<blueprint id>.<key>`.
10. **Blueprint-owned regions on Remix.** D-046 item 2 says a region is a named blocking `<Frame>` on Remix. A Frame needs a route that returns only the region; the regions owned by blueprints (`rp-collection-results`, `rp-collection-toolbar`, `rp-search-results`, `rp-product-buy`) are refreshed only by URL change, which the reference `reloadFrames` of `05-commerce.md` handles as a document navigation. Applied: those four are plain elements with `data-rp-region` on Remix (rule R-6). Component-owned regions stay Frames.
11. **Announcer in `layout` (8.5).** `09-components-foundation.md` fixed that Announcer exists only inside dialogs and commerce roots. Applied: `layout` prints no Announcer. 8.5 also omits the search dialog and PredictiveSearch, which the Header's search link needs as its overlay; applied: `layout` prints a Dialog `search-dialog` containing PredictiveSearch.
12. **Document shell on TSX hosts.** The ledger gives the shell to this document (D-034 item 2) but not its form, and no spike covers hydrating `document.body`. Applied: a string function `renderDocument` shared by html, react and remix (section 2.6), with a stated fallback and test LT-10.
13. **Scope of the brief versus the ledger.** The brief named account and content components and nine blueprints. Applied: the ledger's 12 components and 14 blueprints. Article comments (present in the base theme) are not in V1 because no component in section 8 covers a comment form; the `article` blueprint omits them.
14. **`password` and `gift-card` on the hydrogen backend.** 8.5 requires every blueprint for all four hosts, but the Storefront API has neither a storefront password nor a gift card page. Applied: presentational pages whose data and POST route the project supplies; full behaviour on Liquid only.
15. **Cart drawer on the cart page.** The ledger does not say whether `layout` renders the CartDrawer on the cart page. On Liquid that would declare the partials `rp-cart-lines` and `rp-cart-summary` twice in one response. Applied: no CartDrawer on the cart page, in every host (rule L-B, prop `cartPage`).
16. **Newsletter and contact on the hydrogen backend.** The ledger lists NewsletterForm and the `contact` blueprint but no server operation for them. Applied: scaffolded route handlers that validate, call a project-supplied function and redirect with a status param (sections 2.7 and `contact`).
17. **Liquid subset additions.** Rule L-13 of `06-bindings.md` does not include `date`, `paginate`, `form`, `layout`, `money`, `json` for blueprint files. Applied: rule L-D and requirement X-6.
