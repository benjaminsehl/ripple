# 12 - Components: store chrome, page sections, and blueprints

> **Layout of this spec.** Each component (and blueprint) specified by this document lives in its own file under `components/<id>.md` (and `blueprints/<id>.md`). This document keeps the rules shared by the group plus one pointer per component. A reference elsewhere to "doc 12, <Component>" means that component's file.


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
| Commerce adapter, regions, refresh, form dialects, every `Ripple*` resource type including `RippleMenu` and `RippleShop` (D-094) | `05-commerce.md` |
| Binding rules for React, Remix, Liquid, `html` | `06-bindings.md` |
| Manifest schema, registry, CLI, checker rule texts | `07-manifest-registry-cli.md` |
| Foundation, interactive and commerce components | `09-components-foundation.md`, `10-components-interactive.md`, `11-components-commerce.md` |
| Test harness and tiers | `13-testing.md` |
| The assembled Liquid theme (settings bridge, tokens, `rp-head`, `rp-import-map-entries`, theme rules) | `14-liquid-theme.md` |

This document DOES own the complete text of every Liquid layout and template file (`layout/*.liquid`, `templates/*.liquid`) (D-099). The two theme-owned snippets `import-map` and `meta-tags` are files of the `layout` blueprint (D-107 item 5) whose text is owned by `14-liquid-theme.md` (sections 7.2 and 7.6, D-099 item 2, D-109); this document copies `import-map` and refers to `meta-tags`.

Fixtures in this document (D-112). A fixture printed as one complete fenced HTML block is the reference file as written. Every other fixture is a DELTA fixture: its line gives the props and one sentence stating what its HTML shows (for example "root class is `rp-logo custom-a custom-b`", "equal to `default`", "the reference HTML is the empty string", or a fenced block that shows only the part that differs). The file `components/<id>/fixtures/<name>.html` of a delta fixture is written by the implementation task of that component, from the component's HTML contract and the stated props; it MUST satisfy the sentence, and it is held to the same gates as every fixture (contract lint, tier 1; four-host conformance, tier 2). The 34 delta fixtures, by component:

| Component | Delta fixtures |
|---|---|
| Header | `default-body-plain`, `class`, `unknown-scheme` |
| Footer | `policies`, `scheme`, `class` |
| AnnouncementBar | `class` |
| NavigationMenu | `escaping`, `class` |
| MobileNav | `deep`, `empty`, `invalid-enum-falls-back`, `class` |
| LinkList | `invalid-enum-falls-back`, `escaping`, `class` |
| Logo | `invalid-enum-falls-back`, `class` |
| LocaleSelector | `countries-only`, `single-locale`, `invalid-enum-falls-back`, `class` |
| AccountLink | `class` |
| NewsletterForm | `success`, `error`, `class` |
| Hero | `invalid-enum-falls-back`, `escaping`, `class` |
| FeaturedCollection | `carousel`, `empty`, `invalid-enum-falls-back`, `responsive`, `class` |

Normative words: MUST, MUST NOT, SHOULD, MAY. "UNVERIFIED" marks a fact nobody ran or read in source. Evidence paths are relative to the directory that holds the local clones.

Milestone for everything in this document: M4 (D-067).

---

## 1. Shared definitions

### 1.1 Markup of components owned by other documents

Contracts in this document embed components owned by docs 09, 10 and 11 (`02-html-contract.md` rule S-10 and D-069: the embedded markup MUST be exactly the embedded component's own contract for the props used). The table is a copy of those contracts. The owning document wins: when it changes, the fixture files of this document are regenerated (`pnpm gen`) and the text here is updated. Implementers MUST build these embeds with `embed` nodes (TSX: by rendering the component; Liquid: `{% render 'rp-<id>' %}`), never by copying the markup below. The manifest records each embed in `dependencies.embeds` (D-070).

`ICON` in this document stands for the Icon markup of the first row with the inner markup of the named icon.

| Embedded component | Markup |
|---|---|
| Icon (`09`) | `<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><inner markup></svg>` |
| IconButton as link (`09`) | `<a class="rp-icon-button" href="<url>" data-variant="ghost" data-size="md" aria-label="<name>">ICON</a>` |
| IconButton as link and overlay opener (`09`, props `href` and `dialog="<id>"`, fixture `link-opener`) | `<a class="rp-icon-button" href="<url>" data-variant="ghost" data-size="md" aria-label="<name>" data-rp-open="<id>">ICON</a>` |
| IconButton as button (`09`) | `<button class="rp-icon-button" type="button" data-variant="ghost" data-size="md" aria-label="<name>">ICON</button>` |
| IconButton as closer (`09`, props `commandFor="<id>"`, `command="close"`) | `<button class="rp-icon-button" type="button" commandfor="<id>" command="close" data-variant="ghost" data-size="md" aria-label="<name>">ICON</button>` |
| Button (`09`) | `<button class="rp-button" type="<type>" data-variant="<variant>" data-size="<size>">text</button>` |
| Input (`09`) | `<input class="rp-input" type="<type>" name="<name>" data-size="md">` plus the native attributes and `aria-*` attributes passed (attribute order is not part of the contract, `02-html-contract.md` section 4.5) |
| FormMessage (`09`) | `<p class="rp-form-message" data-tone="<tone>" role="<status or alert>">text</p>`, with `id="<id>"` when an id is passed |
| VisuallyHidden (`09`) | `<span class="rp-visually-hidden">text</span>` |
| Grid (`09`) | `<div class="rp-grid" data-columns="<tokens>" data-gap="<tokens>">` |
| Popover panel (`10`) | `<div class="rp-popover" id="<id>" popover="" data-side="<side>" data-align="<align>">` (D-010) |
| Drawer (`10`), composed by MobileNav | `<rp-dialog class="rp-drawer" data-slot="rp-dialog"><dialog class="rp-drawer-panel" id="<id>" data-side="<side>" aria-labelledby="<id>-title" closedby="any"><div class="rp-drawer-header"><h2 class="rp-drawer-title" id="<id>-title">text</h2>CLOSER</div><div class="rp-drawer-body">content</div></dialog></rp-dialog>`; `CLOSER` is the IconButton-as-closer row |
| Carousel (`10`) | the `default` fixture of `10-components-interactive.md` `## Carousel`: `<rp-carousel class="rp-carousel" id="<id>" role="group" aria-roledescription="carousel" aria-label="<label>" data-slot="rp-carousel">`, a `button.rp-carousel-control` with `data-rp-part="prev"`, the `ul.rp-carousel-viewport` with `id="<id>-list"`, a `button.rp-carousel-control` with `data-rp-part="next"` |
| CartLink (`11`) | `<rp-cart class="rp-cart-link" data-slot="rp-cart"><a class="rp-cart-link-trigger" href="<cart url>">ICON<span class="rp-visually-hidden">Cart</span><span class="rp-cart-link-count" data-rp-part="count" hidden>0</span></a></rp-cart>`; the prop `drawer="<id>"` (TSX and Liquid) adds `data-rp-open="<id>"` after `href` |
| ProductCard (`11`) | the `default` fixture of `11-components-commerce.md` `## ProductCard`: `<div class="rp-product-card">` holding `div.rp-product-card-media` (Image) and `div.rp-product-card-body` (title heading with `a.rp-product-card-link`, Price) |

Icon inner markup used in this document's fixtures (a copy of `09-components-foundation.md` section 0.6, which is normative):

| Icon name | Inner markup |
|---|---|
| `menu` | `<path d="M4 7h16M4 12h16M4 17h16"/>` |
| `close` | `<path d="M6 6l12 12M18 6L6 18"/>` |
| `chevron-down` | `<path d="M6 9l6 6 6-6"/>` |
| `chevron-left` | `<path d="M15 6l-6 6 6 6"/>` |
| `chevron-right` | `<path d="M9 6l6 6-6 6"/>` |
| `search` | `<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>` |
| `account` | `<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/>` |
| `cart` | `<path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>` |
| `globe` | `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>` |

### 1.2 The `menu` resource

TSX hosts pass a plain object of type `RippleMenu` (items: `RippleMenuItem`). Type: `05-commerce.md` section 11.1; both are exported from `<pkg>` (D-094). Fields of `RippleMenu`: `id: string`, `items: RippleMenuItem[]`. Fields of `RippleMenuItem`: `id: string` (list key only), `title: string`, `url: string | null` (`null` for an item that only groups children), `current: boolean` (true when `url` is the URL of the page being rendered; computed by the server), `items: RippleMenuItem[]` (empty array when none).

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
- **MN-3** TSX hosts build the object with the function below. It is NOT a library export: it is a file of the `layout` blueprint, written to `<blueprint dir>/lib/menu.ts` and owned by the project.

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

Header, Footer and the blueprints need the shop name, home URL and logo. TSX hosts pass a plain object of type `RippleShop`: fields `name: string`, `url: string` (home URL, for example `/` or `/fr-ca`), `logo: RippleImage | null`. Type: `05-commerce.md` section 11.1; exported from `<pkg>` (D-094).

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

The prop is defined by ledger section 6 (D-066).

### 1.5 Ids fixed by convention

These ids are fixed for V1 (D-107 item 4). They are used by the blueprints and by `CommerceOptions` (`05-commerce.md` section 4.2). `14-liquid-theme.md` rule T-24 copies this table. A project MAY change one, and MUST then pass the new value to every prop that references it.

| Id | Element | Referenced by |
|---|---|---|
| `main` | `<main>` of the layout | SkipLink `href="#main"` |
| `main-nav` | NavigationMenu root | Header prop `navigationMenu` |
| `mobile-nav` | MobileNav `<dialog>` | Header prop `mobileNav` |
| `footer-menu` | the Footer's LinkList `<nav>` | Header prop `linkList` (the no-JS target of the menu opener, D-009) |
| `search-dialog` | the search Dialog `<dialog>` | Header prop `searchDialog` |
| `predictive-search` | PredictiveSearch root | none |
| `footer-locale` | LocaleSelector popover panel in the footer | none |
| `newsletter` | NewsletterForm `<form>` | none |
| `cart-drawer` | CartDrawer `<dialog>`. MUST equal `CommerceOptions.cartDrawer` (D-087); CartDrawer's `id` defaults to it | Header prop `cartDrawer` (which passes it to CartLink's `drawer`); `CommerceOptions.cartDrawer` |
| `cart-drawer-list` | CartLines inside the drawer; its Liquid form id is `cart-drawer-list-form` | CartSummary `cartLines` / `cart_lines` in the drawer |
| `cart` | CartLines on the cart page; its Liquid form id is `cart-form` (D-092) | `cartLines` / `cart_lines` of CartSummary, CartNote and CheckoutButton on the cart page |
| `cart-discount` | DiscountCode on the cart page | none |
| `cart-note` | CartNote on the cart page | none |
| `product-gallery` | ProductGallery | none |
| `product-options` | VariantPicker | none |
| `product-form` | ProductForm | none |
| `collection-filters` | Filters | none |
| `collection-sort` | SortSelect | none |

### 1.6 Fixture resources

Fixture records reference shared resources by name (`{ "$resource": "<type>.<name>" }`, `02-html-contract.md` section 11.2). This document adds the resources below, each named `<type>.<name>`. These values are the source for `src/testing/resources.ts` (`13-testing.md` owns that file and the loader, D-074). Each exists there in two forms with equal content: a JSON object for TSX hosts and a drop stand-in for the Liquid shim.

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

Specified in [components/header.md](components/header.md).

## Footer

Specified in [components/footer.md](components/footer.md).

## AnnouncementBar

Specified in [components/announcement-bar.md](components/announcement-bar.md).

## NavigationMenu

Specified in [components/navigation-menu.md](components/navigation-menu.md).

## MobileNav

Specified in [components/mobile-nav.md](components/mobile-nav.md).

## LinkList

Specified in [components/link-list.md](components/link-list.md).

## Logo

Specified in [components/logo.md](components/logo.md).

## LocaleSelector

Specified in [components/locale-selector.md](components/locale-selector.md).

## AccountLink

Specified in [components/account-link.md](components/account-link.md).

## NewsletterForm

Specified in [components/newsletter-form.md](components/newsletter-form.md).

## Hero

Specified in [components/hero.md](components/hero.md).

## FeaturedCollection

Specified in [components/featured-collection.md](components/featured-collection.md).

## 2. Blueprints: conventions

A blueprint is a set of starting files for one page type. `ripple add --blueprint <id>` copies them into the project (`07-manifest-registry-cli.md` section 4.4). After the copy the project owns them: `ripple upgrade` never changes an edited blueprint file. A blueprint contains no CSS and no custom element code; it only composes components.

### 2.1 Files and targets

Source directory: `blueprints/<id>/`. It holds `blueprint.json` and one directory per host. `<blueprint dir>` in this document means `paths.pages` of `ripple.json` (D-101): default `src/pages` on `react`, `app/pages` on `remix`, `pages` on `html`. A stored target uses the alias `@pages/`, which the CLI resolves to `<blueprint dir>`. Liquid targets are relative to the theme root.

| Blueprint | `route` | liquid target (relative to the theme root) | react and remix target (after `@pages/`) | html target (after `@pages/`) |
|---|---|---|---|---|
| `layout` | none | `layout/theme.liquid`, `snippets/import-map.liquid`, `snippets/meta-tags.liquid` | `layout.tsx`, `types.ts`, `lib/document.ts`, `lib/menu.ts`, `lib/locale-route.ts`, `lib/newsletter-route.ts` | `layout.html` |
| `home` | `/` | `templates/index.liquid` | `home.tsx` | `home.html` |
| `collection` | `/collections/:handle` | `templates/collection.liquid` | `collection.tsx` | `collection.html` |
| `collections-list` | `/collections` | `templates/list-collections.liquid` | `collections-list.tsx` | `collections-list.html` |
| `product` | `/products/:handle` | `templates/product.liquid` | `product.tsx` | `product.html` |
| `search` | `/search` | `templates/search.liquid` | `search.tsx` | `search.html` |
| `cart` | `/cart` | `templates/cart.liquid` | `cart.tsx` | `cart.html` |
| `blog` | `/blogs/:blog` | `templates/blog.liquid` | `blog.tsx` | `blog.html` |
| `article` | `/blogs/:blog/:article` | `templates/article.liquid` | `article.tsx` | `article.html` |
| `page` | `/pages/:handle` | `templates/page.liquid` | `page.tsx` | `page.html` |
| `contact` | `/pages/contact` | `templates/page.contact.liquid` | `contact.tsx`, `lib/contact-route.ts` | `contact.html` |
| `not-found` | none | `templates/404.liquid` | `not-found.tsx` | `not-found.html` |
| `password` | `/password` | `templates/password.liquid`, `layout/password.liquid` | `password.tsx` | `password.html` |
| `gift-card` | none | `templates/gift_card.liquid` | `gift-card.tsx` | `gift-card.html` |

Liquid template file names are the names the platform resolves (`ripple/theme/templates/` contains `index.liquid`, `collection.liquid`, `list-collections.liquid`, `product.liquid`, `search.liquid`, `cart.liquid`, `blog.liquid`, `article.liquid`, `page.liquid`, `404.liquid`, `password.liquid`, `gift_card.liquid`). `templates/page.contact.liquid` is an alternate template; the merchant assigns it to the contact page in the admin. On Liquid these files ARE the theme's layouts and templates; this document owns their complete text (D-099). `snippets/import-map.liquid` and `snippets/meta-tags.liquid` are theme-owned files of the `layout` blueprint (D-107 item 5); their text is under `layout`.

`types.ts` (react and remix, `layout` blueprint) holds only page-data types that no component takes as a prop (2.4).

File records in `blueprint.json` (`07-manifest-registry-cli.md`, `#/$defs/file`): `type` is `blueprint`, `mode` is `owned`, `generated` is `false` for liquid, react and remix and `true` for html (2.3, rule H-1). `key` is `template` for the page file (for `layout`: `layout.tsx`, `layout.html`, `layout/theme.liquid`), `layout` for `layout/password.liquid`, `import-map` and `meta-tags` for the two snippets, the file's base name without extension for `lib/` files (`document`, `menu`, `locale-route`, `newsletter-route`, `contact-route`), `types` for `types.ts`, and `locale` for the generated locale patch.

Locale keys (D-107 item 5): the key tables of the blueprints below are the source for `ripple.blueprints.<blueprint id>.*` in the repository's `locales/en.default.json`. The registry build generates one locale patch per blueprint that has keys (`registry/liquid/locales/blueprint.<id>.json`), and `ripple add --blueprint <id>` merges it into every locale file of the theme (`07-manifest-registry-cli.md` sections 4.1 and 7.6). English only (D-098 item 4).

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
      { "key": "template", "source": "blueprints/product/html/product.html", "target": "@pages/product.html", "type": "blueprint", "mode": "owned", "generated": true }
    ],
    "react": [
      { "key": "template", "source": "blueprints/product/react/product.tsx", "target": "@pages/product.tsx", "type": "blueprint", "mode": "owned", "generated": false }
    ],
    "remix": [
      { "key": "template", "source": "blueprints/product/remix/product.tsx", "target": "@pages/product.tsx", "type": "blueprint", "mode": "owned", "generated": false }
    ],
    "liquid": [
      { "key": "template", "source": "blueprints/product/liquid/templates/product.liquid", "target": "templates/product.liquid", "type": "blueprint", "mode": "owned", "generated": false },
      { "key": "locale", "source": "liquid/locales/blueprint.product.json", "target": "locales/*.json", "type": "asset", "mode": "patch", "generated": true }
    ]
  }
}
```

### 2.2 Rules for every blueprint

- **BP-1** A blueprint file contains only: Ripple component calls; the raw elements `html`, `head`, `body`, `main`, `li` (child of a Grid or Stack with `as` `ul` or `ol`), `bdi`, `rp-view-event`, `script type="application/json"`; in TSX and html files only, also the raw elements `form` and `input type="hidden"`; and elements carrying `data-rp-region`. A Liquid blueprint file never writes a raw `<form>` or `<input>`: it uses the Liquid tag `{% form %}`, which prints the form and its hidden inputs (`14-liquid-theme.md` rule T-23 is the Liquid statement of this rule). It contains no `class` attribute with a value that does not start with `rp-`, no `style` attribute, and no `<style>` element. `data-rp-region` is the only Ripple hook attribute a blueprint passes through rest props or `attributes` (D-091 item 2). Overlay openers are written with the `dialog` prop; a tooltip trigger with the `tooltip` prop (D-009, D-082).
- **BP-2** Exactly one `<main>` exists per document. It is printed by `layout`: TSX hosts print `<main id="main" tabindex="-1">`; Liquid prints `<main id="main" tabindex="-1" data-template="{{ request.page_type }}">` (D-089 item 6; `data-template` is read only by the Liquid adapter and is removed before the hosts are compared, see `layout`). Page blueprints MUST NOT print `<main>`.
- **BP-3** Each page blueprint prints exactly one Heading with `level` 1. Heading levels never skip (after `1` comes `2`).
- **BP-4** Spacing uses only the four values of D-106: a page band is `Container` with `py="12 md:20"`; the gap between areas in a band is `gap="8 md:12"`; the gap inside a group is `gap="2"` to `gap="4"`; a card grid uses `gap="4 md:6"`.
- **BP-5** Card grids use `Grid` with `as="ul"` and one `<li>` per card, `columns="2 lg:4"` for products, `columns="1 sm:2 lg:3"` for collections and articles. (`<li>` is the one raw element allowed in addition to BP-1; it carries no attribute.)
- **BP-6** Every string a Liquid blueprint prints is a locale key `ripple.blueprints.<blueprint id>.<key>` in `locales/en.default.json` (ledger section 4.1, D-066). TSX blueprints print the English text as a literal. The key tables in each blueprint are complete.
- **BP-7** A blueprint MUST work with JavaScript disabled to the level stated in its "No-JS behaviour". Nothing a buyer needs to read or submit may exist only inside a Dialog, Drawer or Popover.
- **BP-8** A region element (`data-rp-region`) MUST NOT be, or contain, a `<dialog>`, and MUST NOT contain the `rp-cart` root whose `data-rp-refresh` names it (`05-commerce.md` section 8.1; checker RP308, D-102). The containment check applies to `rp-cart` only. VariantPicker, SortSelect and FilterChips are kept outside the region they refresh by the blueprint, so that focus survives the refresh; the checker does not enforce that.
- **BP-9** A page blueprint MUST NOT read the cart, the menus or the shop. Those belong to `layout`. Exception: `cart`, which reads the cart.
- **BP-10** Images above the fold (Hero image, the first ProductGallery image) are `loading="eager"` with `fetchPriority="high"`; every other image keeps the default `lazy`.
- **BP-11** View events (D-089): `product` prints the product view; `collection` the collection view; `search` the search view, only when terms exist; `cart` the cart view. No component prints one. The element is the last child the page blueprint prints. Product, collection and search use the attribute form `<rp-view-event view-event-trigger="connect" view-event-payload="..."></rp-view-event>`; cart uses the child form `<rp-view-event view-event-trigger="connect"><script type="application/json" data-view-event-payload>...</script></rp-view-event>`. Liquid payload: ALWAYS the `standard_event_data` filter. hydrogen backend payload: the JSON `{ "event": ..., "payload": ... }` of `05-commerce.md` section 12, passed to the page function as the string prop `viewEvent`. Trigger `connect` only; no per-card impressions in V1.

### 2.3 Host forms

The **React file is the reference TSX**. It is a set of pure functions from props to markup: no hooks, no data fetching, no router import. The project's route code loads the data (2.5) and renders `<Layout {...layout}><XPage {...page} /></Layout>`.

The **Remix file** is derived from the React file by these rules, applied in order. Nothing else changes.

- **R-1** Component imports use the specifier `@components/<id>`, one import per component file, in both the React and the Remix source (`import { Stack } from "@components/stack";`). A part export comes from its component's file (`import { Dialog, DialogBody, DialogHeader, DialogTitle } from "@components/dialog";`); a helper comes from `@components/<id>.data` (D-094). The CLI rewrites the specifier at install (D-096 item 4). Type imports from `__PKG__` stay. `import type { ReactNode } from "react"` becomes `import type { Handle, RemixNode } from "remix/component"`; the type `ReactNode` becomes `RemixNode`. Blueprints MUST NOT import a component from `__PKG__/react` or `__PKG__/remix`.
- **R-2** `export function XPage(props: XPageProps) { const { a, b } = props; return (...); }` becomes `export function XPage(handle: Handle<XPageProps>) { return () => { const { a, b } = handle.props; return (...); }; }` (`06-bindings.md` rules X-1, X-2).
- **R-3** On raw elements, `className` becomes `class`, `htmlFor` becomes `for`, `tabIndex` becomes `tabindex` (`06-bindings.md` rule X-12). Ripple component props keep their names.
- **R-4** `key={...}` on list items stays.
- **R-5** Blueprint files print no `data-rmx-*` attribute. `data-rmx-document` (`06-bindings.md` rule X-5) is printed inside the Remix bindings of CheckoutButton, AccountLink, the cart components, LocaleSelector and NewsletterForm. The one raw `<form>` a blueprint prints (`contact`, `password`) carries `data-rmx-document` in the Remix file; this is stated in those blueprints.
- **R-6** On Remix every region is a plain element with `data-rp-region`; no blueprint prints a `<Frame>`. `reloadFrames` and `navigate` are opt-in options of the project (D-090 item 5, SPIKE-11).

The **html file** is generated:

- **H-1** `blueprints/<id>/html/<id>.html` is the output of rendering the React file with the sample data of 2.5 through `renderDocument` (2.6), written unchanged with one trailing newline (no re-formatting; step G10 of `07-manifest-registry-cli.md`). `pnpm gen` writes it (the generating step is owned by `07-manifest-registry-cli.md`, D-101 item 4); a hand edit fails the generation check (`07-manifest-registry-cli.md`, G-rules). Page files contain the full document, so each one opens in a browser by itself.
- **H-2** In the html file, `initialCart` is omitted from the config element and the cart count part is printed as `hidden` with text `0` (`05-commerce.md` section 10.1 rule 4).

The **Liquid file** is hand-written and is given in full in each blueprint. Rules:

- **L-A** Blueprint Liquid files are templates and layouts, so they MAY use `{% block %}` and `{% partial %}` (`06-bindings.md`; `ripple/docs/research/liquid-blocks-partials.md` section 2.2). They MUST NOT use `{% section %}`, `{% sections %}`, `{% content_for %}`, `{% include %}` or JSON templates.
- **L-B** Partial names are exactly the region names (`06-bindings.md` rule L-2). A partial name is declared at most once per rendered page. Because `layout/theme.liquid` declares `rp-cart-lines` and `rp-cart-summary` inside the CartDrawer and `templates/cart.liquid` declares the same two names, the layout MUST NOT render the CartDrawer when `template.name == 'cart'` (see `layout`, Structure; D-091 item 5). The same rule is applied on TSX hosts through the `cartPage` prop so that all hosts print the same page. The CartLink on the cart page has no `drawer`, and `openCart()` there navigates to `cartUrl` (`05-commerce.md`).
- **L-C** Liquid objects are passed to blocks unchanged. A block param that takes text receives it already translated: `{% block 'heading', level: 1 %}{{ 'ripple.blueprints.cart.title' | t }}{% endblock %}`.
- **L-D** Blueprint files use the Blueprint scope of `06-bindings.md` rule L-13 (D-097): the component tags plus `block partial paginate layout`; the component filters plus `standard_event_data`, `asset_url` and `stylesheet_tag`; and exactly these globals: `content_for_header`, `content_for_layout`, `template` (`name`), `request` (`locale.iso_code`, `locale.direction`, `page_type`), `routes` (`root_url`, `cart_url`, `search_url`, `all_products_collection_url`, `product_recommendations_url`, `account_url`, `account_login_url`), `shop` (`name`, `policies`, `brand.logo`, `password_message`), `linklists`, `localization`, `customer`, `collections`, `collection`, `product`, `cart`, `search`, `blog`, `article`, `page`, `paginate` (`previous`, `next`), `form`, `gift_card`, `recommendations`, and `settings` (only in the SPIKE-09 fallback of `product`). `asset_url` and `stylesheet_tag` are used only by the two layout files, for the one `styles.min.css` line that D-099 item 3 requires. The shim (`13-testing.md`) implements all of them, including `standard_event_data` (it returns a fixed JSON) and `request.page_type` (D-104 item 4).

### 2.4 Calls into documents 09, 10 and 11

Blueprints call components with the forms below. Each form is a copy of the owning document's "Host notes" usage example (D-069, D-093); the owning document wins. An implementer who finds a difference MUST change the blueprint file, not the component.

| Component | TSX call | Liquid call |
|---|---|---|
| Dialog | `<Dialog id="x"><DialogHeader><DialogTitle dialog="x">...</DialogTitle><IconButton icon="close" ariaLabel="Close" commandFor="x" command="close" /></DialogHeader><DialogBody>...</DialogBody></Dialog>`; a closer is a `<Button commandFor="x" command="close">` or that IconButton; there is no `DialogClose` | `{% block 'dialog', id: 'x' %}{% block 'dialog-header' %}{% block 'dialog-title', dialog: 'x' %}...{% endblock %}{% block 'icon-button', icon: 'close', aria_label: close_label, command_for: 'x', command: 'close' %}{% endblock %}{% endblock %}{% block 'dialog-body' %}...{% endblock %}{% endblock %}`; there is no `dialog-close` block |
| Toast | `<Toast />` (prints the region and nothing else, D-083) | `{% block 'toast' %}{% endblock %}` |
| ProductCard | `<ProductCard product={product} />` | `{% block 'product-card', product: product %}{% endblock %}` |
| CollectionCard | `<CollectionCard collection={collection} />` | `{% block 'collection-card', collection: collection %}{% endblock %}` |
| ArticleCard | `<ArticleCard article={article} />` | `{% block 'article-card', article: article %}{% endblock %}` |
| Price | `<Price price={variant.price} compareAtPrice={variant.compareAtPrice} />` | `{% block 'price', price: variant.price, compare_at_price: variant.compare_at_price %}{% endblock %}` |
| ProductGallery | `<ProductGallery id="product-gallery" media={product.media} variant={variant} />` | `{% block 'product-gallery', id: 'product-gallery', media: product.media, variant: variant %}{% partial 'rp-product-media' %}{% render 'rp-product-gallery-media', id: 'product-gallery', media: product.media, variant: variant %}{% endpartial %}{% endblock %}` |
| VariantPicker | `<VariantPicker id="product-options" product={product} search={search} />` | `{% block 'variant-picker', id: 'product-options', product: product %}{% endblock %}` |
| ProductForm | `<ProductForm id="product-form" product={product} />` | `{% block 'product-form', id: 'product-form', product: product %}{% endblock %}` |
| ProductRecommendations | `<ProductRecommendations products={recommended} level={2} />` | `{% block 'product-recommendations', url: rec_url %}{% partial 'rp-product-recommendations' %}{% render 'rp-product-recommendations-list', products: recommendations.products %}{% endpartial %}{% endblock %}` |
| CartDrawer | `<CartDrawer cart={cart} />` (`id` defaults to `cart-drawer`) | `{% block 'cart-drawer', id: 'cart-drawer' %}{% block 'cart-lines', id: 'cart-drawer-list' %}{% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-list', cart: cart %}{% endpartial %}{% endblock %}{% block 'cart-summary', cart_lines: 'cart-drawer-list' %}{% partial 'rp-cart-summary' %}{% render 'rp-cart-summary-totals', cart: cart, cart_lines: 'cart-drawer-list' %}{% endpartial %}{% endblock %}{% endblock %}` |
| CartLines | `<CartLines id="cart" cart={cart} />` | `{% block 'cart-lines', id: 'cart' %}{% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-list', cart: cart %}{% endpartial %}{% endblock %}` |
| CartSummary | `<CartSummary cart={cart} cartLines="cart" />` | `{% block 'cart-summary', cart_lines: 'cart' %}{% partial 'rp-cart-summary' %}{% render 'rp-cart-summary-totals', cart: cart, cart_lines: 'cart' %}{% endpartial %}{% endblock %}` |
| CartNote | `<CartNote id="cart-note" cart={cart} />` | `{% block 'cart-note', id: 'cart-note', cart_lines: 'cart' %}{% endblock %}` |
| DiscountCode | `<DiscountCode id="cart-discount" />` | `{% block 'discount-code', id: 'cart-discount' %}{% endblock %}` |
| CheckoutButton | `<CheckoutButton href={cart.checkoutUrl} />` | `{% block 'checkout-button', cart_lines: 'cart' %}{% endblock %}` |
| CartLink | `<CartLink drawer="cart-drawer" count={cart?.totalQuantity ?? 0} />` | `{% block 'cart-link', drawer: 'cart-drawer' %}{% endblock %}` |
| Filters | `<Filters id="collection-filters" filters={filters} action={pathname} sortBy={sortBy} />` | `{% block 'filters', id: 'collection-filters' %}{% partial 'rp-collection-filters' %}{% render 'rp-filters-groups', collection: collection %}{% endpartial %}{% endblock %}` |
| FilterChips | `<FilterChips {...chips} />` with `chips` from `toFilterChips` (`@components/filter-chips.data`) | `{% block 'filter-chips' %}{% endblock %}` |
| SortSelect | `<SortSelect id="collection-sort" action={pathname} options={sortOptions} value={sort} params={params} />` | `{% block 'sort-select', id: 'collection-sort' %}{% endblock %}` |
| SearchForm | `<SearchForm defaultValue={terms} />` | `{% block 'search-form', default_value: search.terms %}{% endblock %}` |
| PredictiveSearch | `<PredictiveSearch id="predictive-search" results={results} />` | `{% block 'predictive-search', id: 'predictive-search' %}{% partial 'rp-predictive-results' %}{% render 'rp-predictive-search-results', search: search %}{% endpartial %}{% endblock %}` |
| Overlay opener (Link, Button or IconButton with `href`) | `<IconButton icon="search" href="/search" dialog="search-dialog" ariaLabel="Search" />` | `{% block 'icon-button', icon: 'search', href: routes.search_url, dialog: 'search-dialog', aria_label: search_label %}{% endblock %}` |

**Regions (D-091).** A component whose content is refreshed exposes a region part: a TSX export and a Liquid snippet. On Liquid a block file cannot contain `{% partial %}`, so the TEMPLATE writes `{% partial '<region>' %}` around the rendered snippet inside the component's block body, exactly as in the table above (`11-components-commerce.md` section 0.3 owns the pattern). On TSX hosts the component prints its region part itself; the blueprint passes data only.

| Region | Owner | Part | Liquid snippet |
|---|---|---|---|
| `rp-cart-lines` | CartLines | `list` | `rp-cart-lines-list` |
| `rp-cart-summary` | CartSummary | `totals` | `rp-cart-summary-totals` |
| `rp-product-media` | ProductGallery | `media` | `rp-product-gallery-media` |
| `rp-product-recommendations` | ProductRecommendations | `list` | `rp-product-recommendations-list` |
| `rp-collection-filters` | Filters | `groups` | `rp-filters-groups` |
| `rp-predictive-results` | PredictiveSearch | `results` | `rp-predictive-search-results` |
| `rp-product-buy` | blueprint `product` | none | a layout component (Stack) |
| `rp-collection-results`, `rp-collection-toolbar` | blueprint `collection` | none | a layout component |
| `rp-search-results` | blueprint `search` | none | a layout component |

The snippet names `rp-<component id>-region` do not exist (D-091 item 3). A region-part snippet is rendered with the same params everywhere (D-091 item 4): `rp-cart-summary-totals` always receives `cart_lines`. A blueprint-owned region is a layout component that receives `data-rp-region="<name>"` through rest props (TSX) or `attributes: 'data-rp-region="<name>"'` (Liquid) (D-091 item 2).

**Types (D-094).** Blueprints import resource types from `__PKG__`; they are defined in `05-commerce.md` section 11.1: `RippleProduct`, `RippleProductDetail`, `RippleProductCard`, `RippleCollection`, `RippleCollectionCard`, `RippleArticle`, `RippleArticleCard`, `RippleMedia`, `RippleVariant`, `RippleFilter`, `RippleFilterValue`, `RippleFilterChip`, `RippleSortOption`, `RippleMenu`, `RippleShop`, `RippleCart`, `RippleImage`. A page prop that is passed to a component has exactly the type that component's Props table names (ProductCard: `RippleProduct`; CollectionCard: `RippleCollection`; ArticleCard: `RippleArticle`; Filters: `RippleFilter[]`; the product page: `RippleProductDetail`). A blueprint MUST NOT declare its own copy of one of them; the former local types `ProductDetail` and `FilterData` do not exist. The sort-option and chip types are `RippleSortOption` and `RippleFilterChip` (`05-commerce.md` section 11.1, imported from `__PKG__`); page props use `RippleSortOption[]` and `{ chips: RippleFilterChip[]; clearUrl: string }`. The sort-param shape `Array<[string, string]>` has no name and is written inline (`05-commerce.md` 11.1 note 4).

`<blueprint dir>/types.ts` (file key `types`, `layout` blueprint; complete) holds only the page-data types that no component takes as a prop:

```ts
// blueprints/layout/<host>/types.ts
export interface PageInfo {
  previousUrl: string | null;
  nextUrl: string | null;
}
```

Per-page props (`<Name>PageProps`) and `LayoutProps` are declared in the page files.

### 2.5 Data loading on the hydrogen backend

- Each blueprint's "Data requirements" gives one GraphQL document for the Storefront API. The React and Remix files export it as a string constant named `<BLUEPRINT>_QUERY` (for example `PRODUCT_QUERY`) next to the page function, plus the type `<Name>PageProps`. The project's route code runs the query with its Storefront client and maps the result to the props. How the client is created is owned by `05-commerce.md` section 10; the method that runs a query is `storefrontClient.query(document, { variables })` in the Hydrogen skills (`hydrogen/packages/hydrogen/skills/`), UNVERIFIED in source in this session.
- Every query takes `$country: CountryCode` and `$language: LanguageCode` and carries `@inContext(country: $country, language: $language)`; the values come from `requestContext.locale` (`hydrogen/packages/hydrogen/skills/hydrogen-markets/SKILL.md`).
- `url` fields of resources are computed by the route code from its route templates (`05-commerce.md` section 11.1). With no locale prefix: `/products/<handle>`, `/collections/<handle>`, `/blogs/<blog handle>/<article handle>`, `/pages/<handle>`.
- A root field that returns `null` (unknown handle) MUST produce a 404 response that renders the `not-found` blueprint inside `layout`.
- UNVERIFIED: that mock.shop serves `menu`, `blog`, `articles`, `page`, `localization` and `predictiveSearch`. Each blueprint states what it prints when its data is empty, and every TSX blueprint MUST render without throwing when a list is empty.
- Sample data for H-1 and for tests is `blueprints/_sample/<id>.json` (one object per blueprint: the props of the page function) and `blueprints/_sample/layout.json`. `13-testing.md` owns the loader. The sample MUST use the fixture resources of section 1.6 and the product, collection and cart fixtures of `11-components-commerce.md`. `13-testing.md` also owns the Liquid-drop form of each sample (D-074, D-104). File form (read by `loadBlueprintSample`, `13-testing.md` 4.1): one JSON object; every top-level key other than `"$liquid"` is a prop of the TSX page function; a value `{ "$resource": "<type>.<name>" }` anywhere inside is replaced by that resource (hydrogen side for TSX, Liquid side for the Liquid scope); the optional top-level key `"$liquid"` holds an object that is merged over the Liquid render scope only (for globals a template reads that have no TSX prop) and never reaches the TSX props.

### 2.6 Document shell and locale route (hydrogen backend)

The document shell on TSX hosts is a string function, not a component (D-107 item 1: `renderDocument` returns the document as a string around the rendered body; React hydrates the body content and never the parent of `document.body`'s content), because the Hydrogen script tags are HTML strings (`renderShopifyScriptTags(...).join("")`, `05-commerce.md` section 10.1 rule 2) and neither React nor Remix can print raw sibling tags into `<head>`. `<blueprint dir>/lib/document.ts` (complete; identical for react, remix and html):

```ts
// blueprints/layout/<host>/lib/document.ts
export interface DocumentParts {
  /** BCP 47 language tag, for example "en" or "fr-CA". */
  lang: string;
  /** Text direction of the locale. Default "ltr". */
  dir?: "ltr" | "rtl";
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
    `<html lang="${escapeHtml(parts.lang)}" dir="${parts.dir === "rtl" ? "rtl" : "ltr"}" data-rmx-preserve-attrs="style">` +
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

- **DS-1** `stylesheets` is `["/ripple/tokens.css", "/ripple/ripple.css"]` unless the project bundles CSS itself (`03-styling-and-tokens.md`). The URL prefix `/ripple/` is where `paths.public` (default `public/ripple`, D-101) is served; a project that changes `paths.public` changes the prefix. The tokens stylesheet is first, so the tokens precede the config element.
- **DS-2** `scripts` per host (the browser files are those of ledger section 5 and D-054: `ripple.js` plus its lazy chunks, which `ripple.js` imports itself; `ripple-toast.js` is loaded lazily, D-083, and MUST NOT be listed): html `["/ripple/ripple.js"]`; remix `["/ripple/ripple.js", <client entry URL>]` (`06-bindings.md` rule X-11); react `[<client entry URL>]` (the entry imports `<pkg>/commerce` and calls `configureCommerce` before `hydrateRoot`, `05-commerce.md` section 10.3).
- **DS-3** `commerce.host` MUST equal the host. `commerce.initialCart` is set only on responses that are not publicly cached (`05-commerce.md` section 10.1 rules 3 and 4).
- **DS-4** `data-rmx-preserve-attrs="style"` on `<html>` is printed on every TSX host (`06-bindings.md` rule X-6). It is inert outside Remix and is removed by the canonicaliser.
- **DS-5** React: the client entry hydrates the body: `hydrateRoot(document.body, <Layout {...layout}><XPage {...page} /></Layout>)`. The server renders the same tree with `renderToString` and passes the string as `body`. UNVERIFIED: hydration of `document.body` when scripts append nodes to `<body>` before hydration; see "Fallback for DS-5" below.
- **DS-7** `commerce` is printed into the config element `<script type="application/json" id="rp-commerce">` (D-087). Its `strings` member, when passed, has exactly the seven keys of D-087 item 4: `added`, `updated`, `removed`, `discountApplied`, `discountRemoved`, `noteSaved`, `error`. A TSX host that omits `strings` gets the English defaults built into the adapter. `commerce.cartDrawer` defaults to `cart-drawer` (section 1.5).
- **DS-8** `lang` and `dir` come from the request locale, as on Liquid (`<html lang="{{ request.locale.iso_code }}" dir="{{ request.locale.direction | default: 'ltr' }}">`).
- **DS-6** Remix: `body` is `await renderToString(<Layout .../>)` from `remix/component/server` (`ripple/docs/research/remix-3.md` section 5). UNVERIFIED: that the Remix client runtime (`run()`) accepts a document whose shell was not produced by a Remix component. If it does not, the project writes the shell as a Remix component following `ripple/docs/research/remix-3.md` section 8.2 and MUST still print, in this order: the stylesheets, the Hydrogen script tags, the config element, the module scripts.

#### Fallback for DS-5

The ledger fixes this fallback and its test (D-107 item 1). The check is test LT-10. If hydrating `document.body` logs hydration errors, `renderDocument` prints `<body><div id="rp-root">${parts.body}</div></body>` and the entry calls `hydrateRoot(document.getElementById("rp-root")!, ...)`. No other file changes; SkipLink remains the first focusable element.

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

UNVERIFIED against the ledger's import list: `getLocalizedHref`, `getSupportedLocales` and `matchLocale` are value imports from `@shopify/hydrogen` that are NOT in the D-094 item 3 list. D-094 restricts bindings and `.data.ts` files; `lib/locale-route.ts` is project-owned route code, not a binding, so this document keeps the imports and lists the point in section 5. If the architecture test of doc 01 or the checker rule of D-102 item 6 is applied to `lib/*.ts`, these three names MUST be added to its allow-list for this one file.

Evidence: `hydrogen/packages/hydrogen/src/core/i18n/href.ts` (`getLocalizedHref(href, { i18n, locale })`; pathname routing returns a path, domain routing an absolute URL; throws for an unsupported locale, which cannot happen here because `target` comes from `getSupportedLocales` or from `matchLocale`), `match.ts` (`matchLocale(source, i18n)` accepts a pathname string), `define.ts` (`getSupportedLocales(i18n)`), `types.ts` (`ShopifyLocale = { language, country }`). The four names are exported from the package root (`hydrogen/packages/hydrogen/src/core/index.ts`). Not run.

Rules:

- **LR-1** The response is a full page load (303 then GET). The route MUST NOT answer JSON (`hydrogen/packages/hydrogen/skills/hydrogen-markets/SKILL.md`: a locale change needs a new request context).
- **LR-2** The route MUST be mounted before any middleware that reads the body, or MUST receive a request whose body is unread.
- **LR-3** The lists passed to LocaleSelector are built from `getSupportedLocales(i18n)`: one `countries` entry per distinct `country` and one `languages` entry per distinct `language`; `current` is true for the values of `requestContext.locale`. Display names come from the Storefront API `localization { availableCountries { isoCode name currency { isoCode symbol } } availableLanguages { isoCode endonymName } }`, filtered to the supported codes (field names UNVERIFIED against the schema in this session). `currency` text is `<isoCode> <symbol>`.

### 2.7 Newsletter and contact routes (hydrogen backend)

The Storefront API has no newsletter-subscription or contact-form mutation that is verified in this session. The default path is:

- NewsletterForm posts `email` to `/api/newsletter`. `<blueprint dir>/lib/newsletter-route.ts` exports `handleNewsletterPost`, which validates the address and calls the project-supplied `subscribe` (D-107 item 2).
- The contact form posts `name`, `email`, `message` to `/api/contact`. `<blueprint dir>/lib/contact-route.ts` exports `handleContactPost`, which validates the fields and calls the project-supplied `send`.

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

- **BT-1** (tier 1) Type-check plus Theme Check: the react and remix files type-check (`tsc --noEmit`, exit code 0) against the generated bindings after the `@components/<id>` specifiers are resolved to the example app's component directory; the Liquid file passes Theme Check with the Ripple configuration (`06-bindings.md` section 8) with zero offenses and renders in the shim without an error.
- **BT-2** (tier 2) For each host, `<page>` passes `ripple check` with zero errors and the contract lint of `02-html-contract.md` section 14 with zero errors.
- **BT-3** (tier 2) After canonicalisation with the masks of the embedded components, the children of `<main>` in the react, remix and html outputs are equal (the `<main>` start tag is not compared: Liquid adds `data-template`); the Liquid output is equal after additionally applying the masks listed in the blueprint.
- **BT-4** (tier 2) The document contains exactly one `main`, one `h1`, one `header.rp-header`, one `footer.rp-footer`; every `id` is unique; every `href="#x"`, `data-rp-open`, `commandfor`, `popovertarget`, `for`, `aria-labelledby`, `aria-describedby` and `form` attribute names an existing id.
- **BT-5** (tier 2) Every `data-rp-refresh` name has a `[data-rp-region]` element with that name in the document; every region name listed in the blueprint's "Regions" is present; on Liquid every such name is also a `{% partial %}` in the template or the layout and is declared once. On Remix no `<Frame>` is expected: every region is a plain element (rule R-6).
- **BT-6** (tier 6, JavaScript disabled) axe reports zero violations of the rule set of `13-testing.md`; each step of the blueprint's "No-JS behaviour" list succeeds.
- **BT-7** (tier 5) With JavaScript enabled, no console error or warning is logged during load, and no element matching `:not(:defined)` remains 2 seconds after `load`.
- **BT-8** (tier 8) Visual snapshots at widths 375, 768 and 1280 match the reference; no horizontal scroll bar at any of the three widths.
- **BT-9** (tier 1) A script confirms rule BP-1 on the source files: no `style=`, no `<style`, no `class` or `className` value outside `rp-`.

---

## Blueprint: `layout`

Specified in [blueprints/layout.md](blueprints/layout.md).

## Blueprint: `home`

Specified in [blueprints/home.md](blueprints/home.md).

## Blueprint: `collection`

Specified in [blueprints/collection.md](blueprints/collection.md).

## Blueprint: `collections-list`

Specified in [blueprints/collections-list.md](blueprints/collections-list.md).

## Blueprint: `product`

Specified in [blueprints/product.md](blueprints/product.md).

## Blueprint: `search`

Specified in [blueprints/search.md](blueprints/search.md).

## Blueprint: `cart`

Specified in [blueprints/cart.md](blueprints/cart.md).

## Blueprint: `blog`

Specified in [blueprints/blog.md](blueprints/blog.md).

## Blueprint: `article`

Specified in [blueprints/article.md](blueprints/article.md).

## Blueprint: `page`

Specified in [blueprints/page.md](blueprints/page.md).

## Blueprint: `contact`

Specified in [blueprints/contact.md](blueprints/contact.md).

## Blueprint: `not-found`

Specified in [blueprints/not-found.md](blueprints/not-found.md).

## Blueprint: `password`

Specified in [blueprints/password.md](blueprints/password.md).

## Blueprint: `gift-card`

Specified in [blueprints/gift-card.md](blueprints/gift-card.md).

## 3. Cross-document requirements

Decided; kept as an index. Each row names where the point is now settled.

| Id | Owner | Status |
|---|---|---|
| X-1 | `07`, `09`, `10`, `11` | Decided: this is the `liquid.embeddedBy` data of `07-manifest-registry-cli.md` (rule MB-1). Components of this document render these components from a block or snippet file, so each has a snippet file `snippets/rp-<id>.liquid`: `icon` (by `mobile-nav`, `navigation-menu`, `locale-selector`, `account-link`), `icon-button` (by `header`, `mobile-nav`), `button` (by `newsletter-form`, `locale-selector`), `input` (by `newsletter-form`), `logo`, `navigation-menu`, `account-link`, `cart-link` (by `header`), `link-list` (by `footer`), `product-card` and `carousel` (by `featured-collection`). |
| X-2 | `11` | Decided: the CartLink prop that names the drawer is `drawer` in TSX AND in Liquid; `href` defaults to `/cart` (Liquid: `routes.cart_url`) (`11-components-commerce.md` `## CartLink`). Header's own props stay `cartDrawer` / `cart_drawer` and `cartUrl` / `cart_url`. |
| X-3 | `10`, `11` | Signatures: section 2.4, copied from docs 10 and 11. Region parts: D-091. SearchForm on Liquid prints `<input type="hidden" name="type" value="product">` (`11-components-commerce.md` `## SearchForm`). CartDrawer's `id` defaults to `cart-drawer`. |
| X-4 | `11` | Reference: CheckoutButton is inert when the cart is empty; owned by `11-components-commerce.md` `## CheckoutButton`. |
| X-5 | `13` | Decided (D-097, D-104 item 4). The Liquid shim implements `{% form %}` for the types `localization`, `customer`, `contact`, `storefront_password` (and `product`, `cart` for doc 11): it prints `<form method="post" action="<route>" id="<id>" class="<class>" accept-charset="UTF-8">`, the hidden inputs `form_type` and `utf8`, for `localization` also `_method` and `return_to`, and exposes a `form` object with `posted_successfully?`, `errors`, `email`, `name`, `body` taken from the test's input. It also implements `{% layout %}`, `{% paginate %}` with `paginate.previous`, `paginate.next`, and `{% partial %}` (prints its body). |
| X-6 | `06`, `13` | Decided (D-097, D-104 item 4). `date` is in the component scope of rule L-13; the shim implements `date: '%Y'` and `date: format: 'date'` (with `format: 'date'` it prints the ISO date `YYYY-MM-DD`; date text is masked in every comparison that contains it). The shim provides the globals of rule L-D, `t` with named arguments and `count` pluralisation (`one`, `other`), the filter `standard_event_data` (returns a fixed JSON) and `request.page_type`. |
| X-7 | `07` | Decided (D-101 item 4): `pnpm gen` renders each blueprint's react file with the sample data of 2.5 into `blueprints/<id>/html/<id>.html` (rule H-1) and verifies it in the generation check. File keys: section 2.1. |
| X-8 | `03` | Decided (D-105 item 5): `base.css` contains `html { scroll-padding-block-start: var(--rp-header-block-size, 0px); }`; Header sets `--rp-header-block-size` on `:root:has(.rp-header[data-sticky])`; `rp-view-event` is in the display region of `base.css`. |
| X-9 | `06` | Decided (D-096 item 2): the generated intrinsic-element declarations include `rp-view-event` with `view-event-trigger` and `view-event-payload`. |
| X-10 | `06` | Kept, narrowed. Rule X-9 of `06-bindings.md` ("no other binding uses `innerHTML`") applies to bindings. Only the `cart` blueprint uses `dangerouslySetInnerHTML` (React) / `innerHTML={unsafeHTML(...)}` (Remix), for exactly one purpose: the JSON body of the one `<script type="application/json" data-view-event-payload>` element, with `<` escaped as `\u003c`. No other blueprint file uses either. |
| X-11 | `13` | Decided (D-074, D-104): sample data files `blueprints/_sample/<id>.json` and the fixture resources of section 1.6 exist in both forms (JSON, Liquid drops). Tests BT-1 to BT-9 run for every blueprint in every host. |
| X-12 | `14` | `rp-head`: D-099 item 4. Locale keys: this document lists every `ripple.blueprints.<id>.*` key in the "Locale keys" line of its blueprint; the CLI writes them from the blueprint's locale patch (D-107 item 5). `14-liquid-theme.md` section 11.1 prints none of them and points here. `templates/page.contact.liquid` is an alternate template the merchant assigns. |
| X-13 | `08` | Decided (D-106): the agent kit's blueprint index lists the 14 blueprints with the `route` values of 2.1 and states rule BP-9; the four spacing values of BP-4 are the ones of the `ripple-compose-page` skill. |

---

## 4. Acceptance criteria for this document's deliverables

A script can check each line.

1. `manifest.json` contains exactly these component ids from this document: `account-link`, `announcement-bar`, `featured-collection`, `footer`, `header`, `hero`, `link-list`, `locale-selector`, `logo`, `mobile-nav`, `navigation-menu`, `newsletter-form`; each with the kind, tags and Liquid tier of ledger 8.4 and `milestone: "M4"`.
2. `manifest.json` `blueprints` has exactly the 14 keys of ledger 8.5; each has four host file lists, each non-empty, with the targets of 2.1; every html, react and remix target starts with `@pages/`; the `layout` Liquid list has the keys `template`, `import-map`, `meta-tags`, `locale`.
3. Every fixture named in a component section exists as `components/<id>/fixtures/<name>.html` and passes tier 2 in all four hosts (`02-html-contract.md` section 11).
4. Every "Acceptance tests" item of every component and blueprint exists as a test whose title starts with the item's id (for example `LT-6`, `CL-3`) or, for component items, with `AT-<n>` (D-104; the test file is the component's, so `AT-<n>` is unique within it).
5. Tests BT-1 to BT-9 pass for all 14 blueprints in all four hosts (BT-1's Theme Check part and BT-5's partial part on Liquid only).
6. `grep -R "TODO\|FIXME" blueprints/ components/{header,footer,announcement-bar,navigation-menu,mobile-nav,link-list,logo,locale-selector,account-link,newsletter-form,hero,featured-collection}` prints nothing.
7. `locales/en.default.json` contains every locale key named in this document, and no blueprint Liquid file contains a string literal between `>` and `<` other than whitespace and Liquid output.
8. No file under `blueprints/*/liquid/layout/` or `blueprints/*/liquid/templates/` contains `{% section`, `{% sections`, `{% content_for`, `{% include`, `{% javascript`, `{% stylesheet`, `{% style`, `page-view.js`, `-region'`, `cart_form`, `dialog-close`, or a `<script` element other than `type="application/json"`. (The two theme-owned snippets of `layout` are exempt: `import-map.liquid` prints `<script type="importmap">` and `meta-tags.liquid` prints JSON-LD scripts.)
9. `blueprints/*/react/*.tsx` and `blueprints/*/remix/*.tsx` import only from `__PKG__` (types and helpers), `@components/<id>` and `@components/<id>.data`, `react` (type only), `remix/component`, and relative files of the same blueprint or of `layout`; no import from `__PKG__/react` or `__PKG__/remix` except the hooks `useCart` and `useRegionHtml` (D-096). `lib/locale-route.ts` imports only from `@shopify/hydrogen`.
10. `grep -R "rp-mobile-nav-panel\|rp-mobile-nav-header\|rp-mobile-nav-title\|rp-mobile-nav-body" components/ blueprints/` prints nothing, and `components/mobile-nav/mobile-nav.css` contains no selector with `dialog`, `::backdrop` or `rp-drawer`.
11. Each of the four blueprints `product`, `collection`, `search`, `cart` prints exactly one `rp-view-event` in every host (for `search`: with terms), and no file under `components/` contains the string `rp-view-event` (D-089). The `layout` blueprint files contain no Announcer call (D-079).
12. No blueprint file and no chrome component binding passes `data-rp-open` through rest props or `attributes`: `grep -R "data-rp-open" blueprints/` prints nothing outside `html/` files.

---

## 5. Evidence and UNVERIFIED

Evidence (read in the local clones or verified with the Shopify docs tool in the session that wrote this document):

- Ledger: `ripple/docs/00-decisions.md` D-006, D-008, D-009, D-010, D-017, D-019 to D-024, D-028, D-033 to D-038, D-041 to D-051, D-063, D-066, D-068 to D-070, D-079, D-083, D-085, D-087, D-089 to D-094, D-096, D-097, D-099, D-101, D-104 to D-107; sections 6, 7, 8.4, 8.5, 8.6, 13.2.
- Sibling documents: `02-html-contract.md` (fixtures, masks, id rules), `04-elements.md` sections 9.3, 10.1, 10.2, 10.6, 10.9, 10.15, `05-commerce.md` sections 4, 6, 7.5, 8, 10, 11, 12, `06-bindings.md` sections 7 and 8, `07-manifest-registry-cli.md` (`#/$defs/blueprint`, `#/$defs/file`), `08-agent-kit-and-evals.md` (spacing rhythm), `09-components-foundation.md` (props of every foundation component called here; IconButton `icon`, `dialog`; icon set of section 0.6; Pagination; Announcer placement), `10-components-interactive.md` (Dialog, Drawer, Popover, Carousel contracts and usage), `11-components-commerce.md` (sections 0.3 and 0.6; usage examples of every commerce component called here), `14-liquid-theme.md` (rules T-5, T-6; `import-map` snippet).
- Base theme: `ripple/theme/layout/theme.liquid`, `layout/password.liquid`, `snippets/meta-tags.liquid`, `snippets/import-map.liquid`, `templates/*.liquid` (file names; `product`, `collection`, `cart` for the `standard_event_data` view events; `search`, `article`, `password`, `gift_card` read), `blocks/header.liquid`, `footer.liquid`, `basic-menu.liquid`, `main-menu.liquid`, `logo.liquid`, `gift-card.liquid`, `featured-collection.liquid`, `snippets/localization-form.liquid`.
- Hydrogen: `hydrogen/packages/hydrogen/src/core/i18n/href.ts`, `match.ts`, `define.ts`, `locale.ts`, `types.ts`, `index.ts`; `hydrogen/packages/hydrogen/skills/hydrogen-markets/SKILL.md`.
- Remix: `ripple/docs/research/remix-3.md` sections 5 and 8.
- Liquid tags: `ripple/docs/research/liquid-blocks-partials.md` sections 2.1, 2.2, 7.
- Shopify docs tool: `{% form 'localization' %}` output; `form.posted_successfully?`; Storefront API `Menu` and `MenuItem` fields.

UNVERIFIED (nobody ran or read these; each has a stated default):

1. mock.shop content: `menu`, `blog`, `page`, `localization`, the `frontpage` collection. mock.shop was not reachable. Default: every blueprint renders its empty form (D-104 item 5).
2. Storefront API fields not re-checked: `shop.brand.logo.image`, the four policy fields, `localization.availableLanguages`, `search.totalCount`, `articleByHandle`, `authorV2`, `optionValues`, `selectedOrFirstAvailableVariant` and its arguments, `Collection.products.filters`.
3. `storefrontClient.query(document, { variables })` as the call that runs a query.
4. Liquid: `template.name`, `collection.filters`, `collection.sort_options`, `collection.sort_by`, `collection.default_sort_by`, `collection.products_count`, `result.object_type`, `paginate.previous`, the form types `contact`, `customer`, `storefront_password` and their field names, `blog.url` on the article template.
5. hydrogen-backend payload shapes for the collection, search and cart views (`05-commerce.md` section 12); the Liquid payload is the platform filter's output.
6. That the filter `standard_event_data` accepts the `search` object (blueprint `search`). Check: SPIKE-02. Fallback: omit the element on Liquid (stated in `search`).
7. The values of `request.page_type` printed into `main[data-template]` (SPIKE-02).
8. How the platform treats a partial name declared in both the layout and a template (avoided by rule L-B), and whether partials may be nested inside `{% paginate %}` in the other order (this document always puts `paginate` inside the partial, as the base theme does).
9. React hydration of `document.body` (rule DS-5, test LT-10) and the Remix client runtime with a string document shell (rule DS-6).
10. `lib/locale-route.ts` value-imports `getLocalizedHref`, `getSupportedLocales` and `matchLocale` from `@shopify/hydrogen`. They are exported from the package root (read) but are not in the D-094 item 3 list, which covers bindings and `.data.ts` files. Default: the file keeps the imports as project-owned route code (section 2.6).
11. No code in this document was executed. The TypeScript in 1.2, 2.6, 2.7 and `contact` was written against the signatures in the cited Hydrogen files and the web platform types only.

---

## Ledger issues

None open. See `00-decisions.md` sections 13.2 and 13.3 (D-109 to D-113).
