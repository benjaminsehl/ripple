# Blueprint: `layout`

> Blueprint spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its sections 1 (shared definitions) and 2 (blueprint conventions) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

### Purpose

The document shell that every storefront page is rendered in: skip link, announcement bar, header, the `<main>` element, footer with newsletter form and locale selector, and the overlays that any page can open (cart drawer, mobile navigation, search dialog, toast region).

### Regions

`rp-cart-lines`, `rp-cart-summary` (inside CartDrawer; absent on the cart page), `rp-predictive-results` (inside the search dialog).

### Components used

`account-link`, `announcement-bar`, `cart-drawer`, `cart-lines`, `cart-link`, `cart-summary`, `dialog`, `footer`, `header`, `icon`, `icon-button` (the search dialog's closer and the Header openers), `link-list`, `locale-selector`, `logo`, `mobile-nav`, `navigation-menu`, `newsletter-form`, `predictive-search`, `skip-link`, `text`, `toast`.

No Announcer (D-079, D-099): the layout prints none; announcements come from the live regions inside dialogs and commerce roots.

### Structure

Order of the children of `<body>`, identical in every host:

```text
body
├─ SkipLink                 href="#main"
├─ AnnouncementBar          only when an announcement text exists
├─ Header                   sticky; default body; mobileNav="mobile-nav"; searchDialog="search-dialog";
│                           cartDrawer="cart-drawer" (omitted on the cart page)
├─ main#main[tabindex=-1]   the page blueprint; on Liquid also data-template="{{ request.page_type }}"
├─ Footer                   custom children:
│   ├─ LinkList             id="footer-menu", vertical, footer menu
│   ├─ NewsletterForm       id="newsletter"
│   ├─ LocaleSelector       id="footer-locale", side="top"   (prints nothing with one locale)
│   ├─ Text                 copyright line
│   └─ LinkList             horizontal, policies            (only when policies exist)
├─ MobileNav                id="mobile-nav"
├─ Dialog                   id="search-dialog"; header (title, IconButton closer); body: PredictiveSearch id="predictive-search"
├─ CartDrawer               id="cart-drawer"                 (omitted on the cart page)
└─ Toast                    the empty toast region
```

Overlays come after the footer so that no `<dialog>` is inside `<header>`, `<main>` or `<footer>`, and none is inside a region. Responsive behaviour is entirely inside the components: Header hides the navigation below `lg` and shows the menu opener (Header, HTML contract).

**React** (`blueprints/layout/react/layout.tsx`, complete):

```tsx
import type { ReactNode } from "react";
import type { RippleCart, RippleMenu, RippleProduct, RippleShop } from "__PKG__";
import { AnnouncementBar } from "@components/announcement-bar";
import { CartDrawer } from "@components/cart-drawer";
import { Dialog, DialogBody, DialogHeader, DialogTitle } from "@components/dialog";
import { Footer } from "@components/footer";
import { Header } from "@components/header";
import { IconButton } from "@components/icon-button";
import { LinkList } from "@components/link-list";
import { LocaleSelector } from "@components/locale-selector";
import { MobileNav } from "@components/mobile-nav";
import { NewsletterForm } from "@components/newsletter-form";
import { PredictiveSearch } from "@components/predictive-search";
import { SkipLink } from "@components/skip-link";
import { Text } from "@components/text";
import { Toast } from "@components/toast";

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
  /** Predictive results for a request whose URL has `q`; null on every other request (doc 11, PredictiveSearch). */
  searchResults: { terms: string; products: RippleProduct[]; total: number } | null;
  /** True on the cart page: the cart drawer is not rendered and the cart link has no drawer (D-091 item 5). */
  cartPage: boolean;
  /** Four-digit year for the copyright line. */
  year: number;
  /** Cart endpoint including the locale path prefix: `${requestContext.locale.pathPrefix}/api/cart` (05-commerce.md 10.1 rule 7). Default "/api/cart". */
  cartAction?: string;
  children: ReactNode;
}

export function Layout(props: LayoutProps) {
  const { shop, menu, footerMenu, policies, cart, locale, path, announcement, newsletterStatus, searchResults, cartPage, year, cartAction = "/api/cart", children } = props;
  const hasFooterMenu = footerMenu.items.length > 0;
  return (
    <>
      <SkipLink>Skip to content</SkipLink>
      {announcement !== null && announcement !== "" ? <AnnouncementBar>{announcement}</AnnouncementBar> : null}
      <Header
        sticky
        menu={menu}
        shop={shop}
        cart={cart}
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
        <DialogHeader>
          <DialogTitle dialog="search-dialog">Search</DialogTitle>
          <IconButton icon="close" ariaLabel="Close" commandFor="search-dialog" command="close" />
        </DialogHeader>
        <DialogBody>
          <PredictiveSearch id="predictive-search" results={searchResults} />
        </DialogBody>
      </Dialog>
      {cartPage ? null : <CartDrawer cart={cart} action={cartAction} />}
      <Toast />
    </>
  );
}
```

Rule **LY-1**: the Header menu opener is a link to the footer menu (`href="#footer-menu"`). When the store's footer menu is empty or missing, the main menu is used as the footer menu (TSX: the route code passes it as `footerMenu`; Liquid: the template does it). When that is empty too, no `#footer-menu` exists and the layout passes `linkList="main"` to Header so that the opener's `href` names an existing id. Test LT-2 checks both cases.

**Remix**: the React file converted by R-1 to R-5 (`tabIndex` becomes `tabindex`). The fragment `<>...</>` stays.

**html**: `layout.html` (target `@pages/layout.html`) is the document produced by H-1 with an empty `<main id="main" tabindex="-1"></main>`.

The TSX layout prints `<main id="main" tabIndex={-1}>` with no `data-template`: the attribute is read only by the Liquid adapter (D-089 item 6). `<CartDrawer>` takes no `id`: it defaults to `cart-drawer` (section 1.5).

**Liquid.** This document owns the complete text of the layout (D-099). `blueprints/layout/liquid/layout/theme.liquid` (complete):

```liquid
<!doctype html>
<html lang="{{ request.locale.iso_code }}" dir="{{ request.locale.direction | default: 'ltr' }}">
  <head>
    {% render 'import-map' %}
    {% render 'meta-tags' %}
    {% render 'rp-head' %}
    {{ 'styles.min.css' | asset_url | stylesheet_tag }}
    {{ content_for_header }}
  </head>
  <body>
    {%- liquid
      assign announcement = 'ripple.blueprints.layout.announcement' | t
      assign search_title = 'ripple.blueprints.layout.search' | t
      assign close_label = 'ripple.blueprints.layout.close' | t
      assign footer_label = 'ripple.blueprints.layout.footer_menu' | t
      assign policies_label = 'ripple.blueprints.layout.policies' | t
      assign shop_name = shop.name | escape
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
    <main id="main" tabindex="-1" data-template="{{ request.page_type }}">
      {{ content_for_layout }}
    </main>
    {% block 'footer' %}
      {%- if footer_menu.links.size > 0 -%}
        {% block 'link-list', id: 'footer-menu', menu: footer_menu, aria_label: footer_label %}{% endblock %}
      {%- endif -%}
      {% block 'newsletter-form', id: 'newsletter' %}{% endblock %}
      {% block 'locale-selector', id: 'footer-locale', side: 'top' %}{% endblock %}
      {% block 'text', size: 'sm', tone: 'muted' %}{{ 'ripple.blueprints.layout.copyright' | t: year: year, name: shop_name }}{% endblock %}
      {%- if shop.policies.size > 0 -%}
        {% block 'link-list', links: shop.policies, aria_label: policies_label, orientation: 'horizontal' %}{% endblock %}
      {%- endif -%}
    {% endblock %}
    {% block 'mobile-nav', id: 'mobile-nav' %}{% endblock %}
    {% block 'dialog', id: 'search-dialog' %}
      {% block 'dialog-header' %}
        {% block 'dialog-title', dialog: 'search-dialog' %}{{ search_title }}{% endblock %}
        {% block 'icon-button', icon: 'close', aria_label: close_label, command_for: 'search-dialog', command: 'close' %}{% endblock %}
      {% endblock %}
      {% block 'dialog-body' %}
        {% block 'predictive-search', id: 'predictive-search' %}
          {% partial 'rp-predictive-results' %}{% render 'rp-predictive-search-results', search: search %}{% endpartial %}
        {% endblock %}
      {% endblock %}
    {% endblock %}
    {% unless template.name == 'cart' %}
      {% block 'cart-drawer', id: 'cart-drawer' %}
        {% block 'cart-lines', id: 'cart-drawer-list' %}
          {% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-list', cart: cart %}{% endpartial %}
        {% endblock %}
        {% block 'cart-summary', cart_lines: 'cart-drawer-list' %}
          {% partial 'rp-cart-summary' %}{% render 'rp-cart-summary-totals', cart: cart, cart_lines: 'cart-drawer-list' %}{% endpartial %}
        {% endblock %}
      {% endblock %}
    {% endunless %}
    {% block 'toast' %}{% endblock %}
  </body>
</html>
```

Normative points of this file (D-099 item 3):

1. `<head>` contains exactly these five lines in this order: `{% render 'import-map' %}`, `{% render 'meta-tags' %}`, `{% render 'rp-head' %}`, the `styles.min.css` stylesheet tag, `{{ content_for_header }}`. The import map is the first element of `<head>` (`14-liquid-theme.md` rule T-6). There is NO `page-view.js` tag: the page view is dispatched by the Liquid adapter (D-089 item 6, D-039).
2. `<html>` carries `lang` and `dir` (`14-liquid-theme.md` rule T-5; evidence `ripple/theme/layout/theme.liquid` line 3).
3. `<main>` carries `data-template="{{ request.page_type }}"` (D-089 item 6).
4. The CartDrawer is omitted on the cart template, and Header receives a blank `cart_drawer` there, so the cart link has no `data-rp-open` (D-091 item 5).
5. No Announcer is printed (D-079). `{% block 'toast' %}` is the last statement before `</body>`.
6. Every `<dialog>` is rendered after the footer, outside `<main>` and outside every partial.

`blueprints/layout/liquid/snippets/import-map.liquid` (complete; theme-owned, file key `import-map`; the same text as `14-liquid-theme.md` section 7.1):

```liquid
{% doc %}
  The theme's single import map. Render it first in <head>, before any module
  script and before content_for_header: browsers ignore an import map that
  appears after the first module script.

  Ripple's entries come from `rp-import-map-entries`. Add theme entries after
  the `@shopify/standard-events` line. Keep at least one entry after the render
  line: the Ripple entries end with a comma.

  @example
  {% render 'import-map' %}
{% enddoc %}
<script type="importmap">
{
  "imports": {
    {% render 'rp-import-map-entries' %}
    "@shopify/standard-events": "https://cdn.shopify.com/storefront/standard-events.js"
  }
}
</script>
```

`blueprints/layout/liquid/snippets/meta-tags.liquid` (theme-owned, file key `meta-tags`): the file `ripple/theme/snippets/meta-tags.liquid` (253 lines: charset and viewport metas, favicon links, Open Graph and Twitter metas, `<title>`, canonical and `hreflang` links, the description meta, the robots meta, and the JSON-LD scripts) with exactly two replacements: `'general.meta.tagged'` becomes `'ripple.blueprints.layout.meta_tagged'` and `'general.meta.page'` becomes `'ripple.blueprints.layout.meta_page'` (D-109; `14-liquid-theme.md` section 7.6 owns this rule and gives the `sed` command). It is not reprinted here. Check: test LT-12.

`core/patch:head` and `core/patch:import-map` report `patch-skipped` when their target file is missing or already contains the line (D-107 item 5); with this blueprint installed both lines are already present.

Notes on the Liquid file:

- `rp-head` is owned by `14-liquid-theme.md` section 7.3 and prints exactly what D-054 item 7 lists (tokens, the config element `#rp-commerce`, the inline polyfill, the stylesheet and module tags of Ripple). It does not print the title, meta tags, the import map or `{{ content_for_header }}` (D-099 item 4).
- `request.locale.iso_code`, `request.locale.direction`, `content_for_layout`, `linklists`, `shop.policies`, `shop.name` are read by `ripple/theme/layout/theme.liquid` and `ripple/theme/blocks/footer.liquid`. `template.name` and `request.page_type` are documented globals; the values of `request.page_type` are UNVERIFIED (SPIKE-02, section 5).
- An empty translation for `ripple.blueprints.layout.announcement` means no bar. The English default is the empty string.
- The Liquid footer menu fallback implements rule LY-1.
- The Header block is called with no body, so its default body renders the two `dialog`-based openers and the CartLink (Header, Host notes).

Locale keys (`ripple.blueprints.layout.*`): `skip` "Skip to content"; `announcement` ""; `search` "Search"; `close` "Close"; `meta_tagged` "tagged \"{{ tags }}\""; `meta_page` "Page {{ number }}" (the last two are read only by `snippets/meta-tags.liquid`, D-109); `footer_menu` "Footer"; `policies` "Policies"; `copyright` "© {{ year }} {{ name }}". The layout uses its OWN three footer keys, not `ripple.footer.*` (T-3, BP-6: every string of a shipped template is a `ripple.blueprints.<blueprint id>.*` key); the Footer component keeps `ripple.footer.*` for its default body. `shop.name` is escaped BEFORE the `t` call (`assign shop_name = shop.name | escape`): a filter written after a `t:` named argument applies to the translated output, not to that argument (`ripple/theme/AGENTS.md`, Liquid parsing rules). UNVERIFIED on a store that the value then renders once-escaped (`14-liquid-theme.md` V-21).

### Data requirements per backend

| Data | hydrogen backend | liquid backend |
|---|---|---|
| Shop name, logo | `shop { name brand { logo { image { url altText width height } } } }` mapped to `RippleShop` (1.3) | `shop.name`, `shop.brand.logo` |
| Main menu | `menu(handle: "main-menu")` with the selection of 1.2, through `toRippleMenu` | `linklists['main-menu']` |
| Footer menu | `menu(handle: "footer")`, through `toRippleMenu` | `linklists.footer` |
| Policies | `shop { privacyPolicy { title handle } refundPolicy { title handle } shippingPolicy { title handle } termsOfService { title handle } }`; each non-null policy becomes an item `{ id: handle, title, url: "/policies/<handle>", current: false, items: [] }` | `shop.policies` |
| Cart | `cartHandlers.get({ storefrontClient, request })` (`05-commerce.md` section 10.1 rule 3), mapped to `RippleCart`; `null` on publicly cached pages | the global `cart` (read inside the cart components) |
| Cart endpoint | `cartAction`: `` `${requestContext.locale.pathPrefix}/api/cart` ``, the same string as `commerce.cartEndpoint` of `DocumentParts` (`05-commerce.md` 10.1 rule 7, D-118) | `routes.cart_url`, `routes.cart_add_url` (printed inside the components) |
| Locales | rule LR-3 | the global `localization` (read inside LocaleSelector) |
| Language tag | `getHtmlLang(requestContext.locale.language)` (`hydrogen/packages/hydrogen/src/core/i18n/locale.ts`) | `request.locale.iso_code` |
| Newsletter status | `newsletterStatus(request)` (2.7) | the `form` object inside NewsletterForm |
| Predictive results | `searchResults`: on a request whose URL has `q`, `{ terms, products, total }` from the `predictiveSearch` query of `11-components-commerce.md` section 0.6; otherwise `null` | the global `search` (read inside `rp-predictive-search-results`) |
| Text direction | `dir` of `DocumentParts` (rule DS-8) | `request.locale.direction` |
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

- **LT-1** (tier 2) The children of `<body>` are, in order, elements matching: `a.rp-skip-link`, optionally `div.rp-announcement-bar`, `header.rp-header`, `main#main`, `footer.rp-footer`, `rp-dialog.rp-drawer.rp-mobile-nav`, `rp-dialog.rp-dialog`, optionally `rp-dialog` containing `dialog#cart-drawer`, `ui-toast-region`. Script and JSON elements appended by the platform are ignored. On Liquid the main element matches `main#main[data-template]`; on the other hosts it has no `data-template`. No host prints an Announcer element outside a dialog or commerce root.
- **LT-2** (tier 2) With a non-empty footer menu, `a[data-rp-open="mobile-nav"]` has `href="#footer-menu"` and `nav#footer-menu` exists. With both menus empty, the same link has `href="#main"` and no `#footer-menu` exists.
- **LT-3** (tier 2) With `cartPage: true` (Liquid: `template.name == 'cart'`): no `#cart-drawer` exists and the cart link has no `data-rp-open` (D-091 item 5).
- **LT-4** (tier 2) No `<dialog>` has an ancestor matching `header, main, footer, [data-rp-region]`.
- **LT-5** (tier 1) `renderDocument` output, parsed by an HTML parser, has `html[lang][dir]`, exactly one `script#rp-commerce` whose text parses as JSON, the stylesheets before the config element and the module scripts after it; a `title` containing `</title><script>` is escaped.
- **LT-6** (tier 1) `handleLocalePost`: with pathname routing `{ defaultLocale: EN/US, locales: [FR/CA] }`, a POST of `country_code=CA&return_to=/products/x` answers 303 with `location: /fr-ca/products/x`; `country_code=ZZ` answers `location: /products/x`; `return_to=//evil.example` answers `location: /`.
- **LT-7** (tier 1) `handleNewsletterPost`: a valid address with a resolving `subscribe` answers 303 with `location` ending `?newsletter=success#newsletter`; an invalid address does not call `subscribe` and answers `?newsletter=error#newsletter`; the address never appears in `location`.
- **LT-8** (tier 5) Activating the menu opener at width 375 opens `#mobile-nav`; activating the search link opens `#search-dialog` and focuses the search input; activating the cart link opens `#cart-drawer`. A middle click on each navigates in a new tab instead.
- **LT-9** (tier 5, Remix) After a client navigation between two pages, the header, the open state of no dialog, and `html[style]` are unchanged, and no element is defined twice (`06-bindings.md` Q-15).
- **LT-10** (tier 5, React) Hydrating `document.body` with the sample layout logs no hydration error, with the Hydrogen script tags present in `<head>`.
- **LT-11** (tier 5) On the cart page, `getCommerce().openCart()` navigates to `cartUrl`, because no dialog with the id `cart-drawer` is on the page. The behaviour and its test are owned by `05-commerce.md` (D-042 amendment b); this entry is a reference, not a second test.
- **LT-13** (tier 2, hydrogen hosts) With `cartAction: "/fr-ca/api/cart"`, every `form[method="post"]` inside `#cart-drawer` has `action="/fr-ca/api/cart"`; without the prop every such form has `action="/api/cart"` (D-118).
- **LT-12** (tier 1) `snippets/meta-tags.liquid` (without its trailer line) is byte-equal to `theme/snippets/meta-tags.liquid` after the two key replacements of D-109 (`general.meta.tagged` to `ripple.blueprints.layout.meta_tagged`, `general.meta.page` to `ripple.blueprints.layout.meta_page`), and contains no other `general.` key; `snippets/import-map.liquid` renders a `<script type="importmap">` whose text parses as JSON in the shim; the rendered `<head>` of `layout/theme.liquid` has the import map before every `script[type="module"]`, and contains no `page-view.js` reference.

---
