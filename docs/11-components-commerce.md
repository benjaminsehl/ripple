# 11 - Components: commerce

> **Layout of this spec.** Each component (and blueprint) specified by this document lives in its own file under `components/<id>.md` (and `blueprints/<id>.md`). This document keeps the rules shared by the group plus one pointer per component. A reference elsewhere to "doc 11, <Component>" means that component's file.


Status: specification. Law: [00-decisions.md](00-decisions.md). This document owns the 26 components of ledger section 8.3 and uses the component template of ledger section 7 verbatim. This document is normative for the contracts of these 26 components (D-069, D-093). Where this document and the ledger disagree, the ledger wins. Markup of a component owned by another document that is shown here is a copy of the owner's contract (D-069); where a copy differs from the owner, the owner wins.

Not owned here, linked instead: the commerce JavaScript, adapter, dialect tables and refresh strategies ([05-commerce.md](05-commerce.md)); contract rules, masks and fixture format ([02-html-contract.md](02-html-contract.md)); CSS rules and tokens ([03-styling-and-tokens.md](03-styling-and-tokens.md)); `rp-dialog`, `rp-carousel`, `rp-quantity` ([04-elements.md](04-elements.md)); binding rules ([06-bindings.md](06-bindings.md)); manifest and checker ([07-manifest-registry-cli.md](07-manifest-registry-cli.md)); foundation and interactive components ([09-components-foundation.md](09-components-foundation.md), [10-components-interactive.md](10-components-interactive.md)); chrome and blueprints ([12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md)); test harness and resource fixtures ([13-testing.md](13-testing.md)); the assembled theme ([14-liquid-theme.md](14-liquid-theme.md)).

## 0. Rules for every component in this document

### 0.1 Component index

All 26 components are milestone M3 (D-067). Names, ids, kinds, tags and tiers are those of ledger section 8.3.

| # | Component | Id | Kind | Root | Tier | No-JS | Requires `id` | Binding |
|---|---|---|---|---|---|---|---|---|
| 1 | ProductCard | `product-card` | static | `div` | resource | full | no | hand |
| 2 | CollectionCard | `collection-card` | static | `div` | resource | full | no | hand |
| 3 | ArticleCard | `article-card` | static | `div` | resource | full | no | hand |
| 4 | Price | `price` | static | `span` | block | full | no | hand |
| 5 | ProductGallery | `product-gallery` | native | `div` | resource | degraded | yes | hand |
| 6 | ProductForm | `product-form` | commerce | `rp-product-form` | resource | full | yes | hand |
| 7 | VariantPicker | `variant-picker` | commerce | `rp-live` | resource | full | yes | hand |
| 8 | Swatch | `swatch` | static | `span` | block | full | no | generated |
| 9 | AddToCartButton | `add-to-cart-button` | static | `button` | block | full | no | hand |
| 10 | ProductRecommendations | `product-recommendations` | commerce | `rp-recommendations` | resource | degraded | no | hand |
| 11 | CartLink | `cart-link` | commerce | `rp-cart` | block | full | no | hand |
| 12 | CartDrawer | `cart-drawer` | commerce | `rp-dialog` | resource | degraded | yes | hand |
| 13 | CartLines | `cart-lines` | commerce | `rp-cart` | resource | full | yes | hand |
| 14 | CartLine | `cart-line` | static | `li` | resource | full | no | hand |
| 15 | CartSummary | `cart-summary` | commerce | `rp-cart` | resource | full | no | hand |
| 16 | CartNote | `cart-note` | commerce | `rp-cart` | resource | full | yes | hand |
| 17 | DiscountCode | `discount-code` | commerce | `rp-cart` | resource | degraded | yes | hand |
| 18 | CheckoutButton | `checkout-button` | static | `a` or `button` | block | full | no | hand |
| 19 | Filters | `filters` | commerce | `rp-live` | resource | full | yes | hand |
| 20 | FilterGroup | `filter-group` | static | `details` | resource | full | no | hand |
| 21 | FilterChips | `filter-chips` | commerce | `rp-live` | resource | full | no | hand |
| 22 | PriceRange | `price-range` | static | `div` | resource | full | no | hand |
| 23 | SortSelect | `sort-select` | commerce | `rp-live` | resource | full | yes | hand |
| 24 | SearchForm | `search-form` | static | `form` | block | full | no | generated |
| 25 | PredictiveSearch | `predictive-search` | commerce | `rp-predictive-search` | resource | degraded | yes | hand |
| 26 | LiveForm | `live-form` | commerce | `rp-live` | block | full | no | hand |

"Binding" says how the four bindings are produced. `generated`: from the manifest contract template by `pnpm gen` (D-003). `hand`: hand-written in the `react`, `remix` and `liquid` hosts, because the contract needs a loop over data, a value derived from data, or a host-owned region, none of which the contract template language can express (D-072: no loops, no expressions). The `html` binding of a hand-written component is its fixture reference HTML. Hand-written files contain the generated, checked regions of D-072 item (c): Liquid `{% doc %}`, `{% schema %}` and enumeration guards; TSX prop types. A hand-written binding MUST pass fixture conformance (D-063 tier 2). Only Swatch and SearchForm are generated (D-072).

The No-JS column is the manifest value `noJs.level` (D-005). DiscountCode is `degraded` in every host: on the `liquid` backend the form is absent without JavaScript (D-092); on the `hydrogen` backend it posts to the cart route.

### 0.2 Embedded components

Commerce components reuse foundation and interactive components in exactly two ways (D-070).

**Embed.** The embedding binding renders the other component unchanged: in TSX it renders the component; in Liquid it calls `{% render 'rp-<id>' %}` (never a nested `{% block %}`, D-037). The embedded markup MUST equal the owner's contract for the props passed (D-069; rule S-10 of [02-html-contract.md](02-html-contract.md)). The embedded component is listed in the manifest key `dependencies.components`.

**Compose by contract.** The composing component prints the other component's element ITSELF, with the other component's class first and its own class second, and with every attribute the other component's contract prints for the same props. The binding does not call the other component, because the element also carries hook attributes (`data-rp-part`, `data-rp-js`, `form`) that the other component does not print. The pair is recorded in the composing component's manifest (`root.class` when the element is the root, otherwise the part's `class`), and the other component is listed in `dependencies.components`. The composed pairs this document prints are exactly these:

| Class pair | Printed by | Element | Composes |
|---|---|---|---|
| `rp-drawer rp-cart-drawer` | CartDrawer root | `rp-dialog` | Drawer |
| `rp-button rp-add-to-cart-button` | AddToCartButton root | `button` | Button |
| `rp-button rp-checkout-button` | CheckoutButton root | `a` or `button` | Button |
| `rp-button rp-filters-submit` | Filters part `submit` | `button` | Button |
| `rp-button rp-cart-lines-update` | CartLines part `submit` (`liquid` backend) | `button` | Button |
| `rp-button rp-cart-line-update` | CartLine part `update` (`hydrogen` backend) | `button` | Button |
| `rp-input rp-search-form-input` | SearchForm part `input` | `input` | Input |
| `rp-icon-button rp-search-form-submit` | SearchForm part `submit` | `button` | IconButton |
| `rp-icon-button rp-cart-line-remove` | CartLine part `remove` | `button` or `a` | IconButton |
| `rp-badge rp-product-card-badge` | ProductCard part `badge` | `span` | Badge |
| `rp-dialog rp-product-gallery-lightbox` | ProductGallery part `lightbox` | `rp-dialog` | Dialog |
| `rp-dialog-title rp-visually-hidden` | ProductGallery lightbox title | `h2` | Dialog (part `title`), VisuallyHidden |

A foundation control that carries a hook attribute (`data-rp-part` or `data-rp-js`) but no second class is printed the same way: by the commerce binding itself, with exactly the owner's attributes for the props shown, and recorded with the part `class` `rp-button` and the dependency `button`. These are the fallback submit buttons of VariantPicker (`dropdown` layout) and SortSelect, the save button of CartNote and the apply button of DiscountCode. Reason: no foundation prop prints these hook attributes, and a hook attribute other than `data-rp-region` MUST NOT be passed through rest props or `attributes` (D-091 item 2).

Docs 09 and 10 own the contracts below. The fixtures in this document are written with this markup, which is a copy of the owner's reference HTML for the props shown. If doc 09 or doc 10 differs for the same props, doc 09 or doc 10 wins (D-069) and the fixture files of this document MUST be regenerated from the owner's reference HTML, changing nothing else.

| Embedded | Props passed in this document | Markup used in this document's fixtures |
|---|---|---|
| Image | `image` (REQUIRED object: `url`, `altText`, `width`, `height`), `alt`, `sizes`, `loading`, `fetchPriority`, `ratio`, `fit` | `<img class="rp-image" src="U?width=800" srcset="U?width=200 200w, U?width=400 400w, U?width=600 600w, U?width=800 800w, U?width=1200 1200w, U?width=1600 1600w" sizes="S" alt="A" width="W" height="H" loading="lazy" decoding="async" data-ratio="1/1" data-fit="cover" data-radius="none">`. `src` is always width 800 and `srcset` is always these six widths (doc 09); a component in this document MUST NOT choose other widths. `fetchPriority="high"` prints `fetchpriority="high"` between `loading` and `decoding`. |
| Placeholder | `ratio` | `<div class="rp-placeholder" data-ratio="1/1" data-radius="none" aria-hidden="true"></div>` |
| Icon | `name` | `<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">C</svg>` where `C` is the content of the icon (table below) |
| Button | `type`, `variant`, `size`, `fullWidth`, `disabled`, `href`, `name`, `value` | `<button class="rp-button" type="submit" data-variant="primary" data-size="md">` ; with `href`: `<a class="rp-button" href="<href>" data-variant="primary" data-size="md">` ; `fullWidth` adds `data-full-width=""` |
| IconButton | `type`, `variant`, `size`, `ariaLabel`, `commandFor`, `command`, `href` | `<button class="rp-icon-button" type="button" data-variant="ghost" data-size="md" aria-label="<ariaLabel>">` + one Icon |
| Badge | `variant`, `tone`, `size` | `<span class="rp-badge" data-variant="solid" data-tone="sale" data-size="md">` |
| Label | `htmlFor` | `<label class="rp-label" for="<htmlFor>">` |
| Input | `id`, `type`, `name`, `defaultValue`, `placeholder`, `autoComplete`, `min`, `step`, `size`, `ariaLabel`, `describedBy`, `rpField`, `formId` | `<input class="rp-input" type="text" data-size="md">` with the attributes of doc 09 for the props passed |
| Textarea | `id`, `name`, `rows`, `defaultValue`, `rpField`, `formId` | `<textarea class="rp-textarea" rows="4" data-size="md"></textarea>` with the attributes of doc 09 for the props passed |
| Select | `id`, `name`, `size`, `ariaLabel`, `rpField`, `formId` | `<select class="rp-select" data-size="md">` with the attributes of doc 09 for the props passed |
| Checkbox | `name`, `value`, `defaultChecked`, `disabled` | `<input class="rp-checkbox" type="checkbox">` with the attributes of doc 09 for the props passed (`name`, `value`, `checked`, `disabled`) |
| FormMessage (error part) | none | `<p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>` (D-045 item 4; exact) |
| VisuallyHidden | none | `<span class="rp-visually-hidden">` (the class MAY also be put on a `p`) |
| QuantityInput | `name`, `defaultValue`, `min`, `max`, `step`, `ariaLabel`, `formId` | the `rp-quantity` markup below ([10-components-interactive.md](10-components-interactive.md), QuantityInput) |
| Carousel | `id`, `ariaLabel` | the `rp-carousel` markup of [10-components-interactive.md](10-components-interactive.md), Carousel: controls are `<button class="rp-carousel-control">`, viewport `<ul class="rp-carousel-viewport">`, items `<li class="rp-carousel-item">` |
| Dialog, Drawer | `id`, `side`, `size` | the `rp-dialog` markup of [10-components-interactive.md](10-components-interactive.md), Dialog and Drawer (composed by contract, table above) |

Icon content used in this document's fixtures (a copy of the icon data of [09-components-foundation.md](09-components-foundation.md), Icon):

| Icon | Content of the `svg` |
|---|---|
| `cart` | `<path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>` |
| `chevron-left` | `<path d="M15 6l-6 6 6 6"/>` |
| `chevron-right` | `<path d="M9 6l6 6-6 6"/>` |
| `close` | `<path d="M6 6l12 12M18 6L6 18"/>` |
| `minus` | `<path d="M5 12h14"/>` |
| `plus` | `<path d="M12 5v14M5 12h14"/>` |
| `search` | `<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>` |
| `trash` | `<path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>` |

QuantityInput markup (a byte-equal copy of the `default` fixture of [10-components-interactive.md](10-components-interactive.md), QuantityInput):

```html
<rp-quantity class="rp-quantity" data-size="md" data-slot="rp-quantity">
  <button class="rp-quantity-button" type="button" disabled aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
  <input class="rp-quantity-input" type="number" inputmode="numeric" name="quantity" min="1" step="1" value="1" aria-label="Quantity" data-rp-part="input" data-rp-field="quantity">
  <button class="rp-quantity-button" type="button" aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
</rp-quantity>
```

Differences by prop, all from doc 10: the decrement button prints `disabled` only when the value equals `min`; the increment button prints `disabled` only when the value equals `max`; `max` prints `max="<n>"` after `min`; `formId` (Liquid `form_id`) prints the native attribute `form="<value>"` directly after `value`. QuantityInput always prints `data-rp-field="quantity"` on its input; it takes no `rpField` prop.

`data-rp-field` on Input, Textarea and Select is printed ONLY through the prop `rpField` (Liquid `rp_field`; values `merchandise-id`, `quantity`, `line-id`, `selling-plan`, `note`, `discount-code`; an invalid value prints no attribute; doc 09). The native `form` attribute on an embedded control is printed ONLY through the prop `formId` (Liquid `form_id`; D-020). A binding in this document MUST NOT pass either attribute through rest props or `attributes`. The commerce elements find fields by `data-rp-field` ([05-commerce.md](05-commerce.md) section 6.2).

### 0.3 Region slots

Six components own a region (D-046, D-091). The other four regions are owned by blueprints ([12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md)). This table is the one of D-091 item 1 with the TSX export added; docs 12 and 14 copy it.

| Region | Owner | Part | TSX export | Liquid snippet |
|---|---|---|---|---|
| `rp-cart-lines` | CartLines | `list` | `CartLinesList` | `rp-cart-lines-list` |
| `rp-cart-summary` | CartSummary | `totals` | `CartSummaryTotals` | `rp-cart-summary-totals` |
| `rp-product-media` | ProductGallery | `media` | `ProductGalleryMedia` | `rp-product-gallery-media` |
| `rp-product-recommendations` | ProductRecommendations | `list` | `ProductRecommendationsList` | `rp-product-recommendations-list` |
| `rp-collection-filters` | Filters | `groups` | `FiltersGroups` | `rp-filters-groups` |
| `rp-predictive-results` | PredictiveSearch | `results` | `PredictiveSearchResults` | `rp-predictive-search-results` |
| `rp-product-buy` | blueprint `product` | none | none (a layout component, Stack) | none |
| `rp-collection-results`, `rp-collection-toolbar` | blueprint `collection` | none | none (a layout component) | none |
| `rp-search-results` | blueprint `search` | none | none (a layout component) | none |

A blueprint-owned region is a layout component that receives `data-rp-region="<name>"` through rest props (TSX) or `attributes: 'data-rp-region="<name>"'` (Liquid); no other Ripple hook attribute may be passed that way (D-091 item 2).

Rules (D-090, D-091):

- **RS-1** The region root is a part of the component. It is ONE element that carries `data-rp-region="<name>"`. It is printed by a dedicated region part: a TSX export `<Component><Part>` and a Liquid snippet `snippets/rp-<component id>-<part>.liquid` (a snippet, not a block, so that it can be rendered inside `{% partial %}`). A snippet named `rp-<component id>-region` does not exist (D-091 item 3).
- **RS-2** The component's default body renders the region part. In every host the component's children (`{{ content }}` in Liquid) REPLACE the default rendering of the region part, and nothing else. This is the "default body" of D-037 for these six components.
- **RS-3** Liquid: Ripple block and snippet files MUST NOT contain `{% partial %}` ([06-bindings.md](06-bindings.md) rule L-13; checker RP403 reports a `data-rp-refresh` name that has no `{% partial %}` in `layout/` or `templates/`, and a partial name declared twice). For in-place refresh the TEMPLATE or LAYOUT MUST pass the region part inside a partial, exactly like this:

  ```liquid
  {% block 'cart-lines', id: 'cart', cart: cart %}
    {% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-list', cart: cart %}{% endpartial %}
  {% endblock %}
  ```

  The HTML is identical to the default body (no wrapper is assumed, SPIKE-02). A call without the partial renders correctly, but a refresh of that region then fails and ends in the `liquid` failure action of D-090 (`location.reload()` or `location.assign(url)`; nothing for `predictive` and `recommendations`).

  A region-part snippet MUST be rendered with the same params everywhere it is rendered (D-091 item 4): the call inside the partial lists exactly the params that the component's default body passes, with the same values. Each owning component's usage example shows the complete call; a template MUST copy it and change only the values.
- **RS-4** In EVERY host a region name MUST be declared at most once per rendered page (D-091 item 5). Therefore the `layout` blueprint omits CartDrawer on the cart page (TSX layout prop `cartPage`; Liquid `template.name == 'cart'`), the CartLink there has no `drawer`, and `openCart()` navigates to `cartUrl` (owned by doc 12 and doc 14).
- **RS-5** Remix: a region is a plain element with `data-rp-region`; the default body renders the region part inline and the `html` refresh strategy applies (D-090 items 2 and 5; [05-commerce.md](05-commerce.md) section 8.3). No blueprint uses a `<Frame>`. `reloadFrames` and `navigate` are opt-in adapter options (SPIKE-11): an app that configures `reloadFrames` passes `<Frame name="<region name>" src="<its route>" />` as children, and the Frame's route MUST render the region part and nothing else.
- **RS-6** React (D-090): cart regions (`rp-cart-lines`, `rp-cart-summary`) render from the store (D-045 item 2); the strategy does nothing and children are not needed. Regions refreshed with reason `variant` or `filter` (`rp-product-media`, `rp-collection-filters`) re-render through the router: the adapter calls `navigate(url, { replace })` when that option is configured, otherwise `location.assign(url)`. Regions refreshed with reason `predictive` or `recommendations` (`rp-predictive-results`, `rp-product-recommendations`) never navigate: the adapter fetches the URL and publishes the inner HTML of the same-named region, and the region part reads it with `useRegionHtml("<region name>")` from `<pkg>/react`. While the hook returns `null` (on the server, during hydration and until the first publish) the part renders its server children; afterwards it renders the HTML string with `dangerouslySetInnerHTML` on the region root. Only `PredictiveSearchResults` and `ProductRecommendationsList` use the hook; their complete code is in their React host notes. UNVERIFIED (SPIKE-10); each of the two components has a `Fallback (SPIKE-10)` subsection.
- **RS-7** A region part MUST NOT contain a `<dialog>` (the dialog would be replaced while open; checker RP308 on rendered HTML, RP404 on Liquid source). An `rp-cart` root MUST NOT be inside the region it names in `data-rp-refresh` (checker RP308, an error; D-102). VariantPicker, SortSelect and FilterChips inside the region they refresh are legal (D-102). RP308 also reports, in every host, a `data-rp-refresh` that names a region that is not on the page.

### 0.4 Backend-scoped fixtures and masks

- **FX-1** Money text, image URLs, form `action`, dialect field `name` / `value` and backend-specific URLs are masked with the rules of [02-html-contract.md](02-html-contract.md) section 11.6. Each component lists its masks under "Host-owned regions and masks".
- **FX-2** Where D-043 or D-050 makes the two backends print a different TAG or a different form STRUCTURE (CartLines, CartLine actions, CartNote, CheckoutButton, CartSummary, CartDrawer), a mask cannot make the outputs equal. Those components and DiscountCode (whose Liquid form carries `data-rp-js="inflow"`, D-092) have two fixtures per state (D-074): `<name>` with `"hosts": ["html", "react", "remix"]` (hydrogen dialect, in full) and `liquid-<name>` with `"hosts": ["liquid"]` (liquid dialect, in full). The default state is `default` and `liquid-default`. Both are `generated: "hand"`. Parts outside the backend-dependent subtree MUST be identical in the two files. The seven components are CartLines, CartLine, CartSummary, CartNote, CheckoutButton, CartDrawer and DiscountCode; no other component scopes a fixture by host.
- **FX-2a** A mask MUST NOT target a Ripple-owned attribute or class (D-074). Masks have the form `{ "select", "op", "name" }` with `op` one of `attr`, `drop-attr`, `srcset`, `text`, `children`, `remove`. Rule F-19 of [02-html-contract.md](02-html-contract.md) (a mask must match in the reference HTML) does not apply to `drop-attr` and `remove` masks (D-074).
- **FX-3** Every component additionally has the required fixtures of [02-html-contract.md](02-html-contract.md) section 11.5 (`class`, `invalid-enum-falls-back`, `responsive`, `escaping`, one per non-default prop). Where this document does not print such a fixture in full, its HTML is the `default` fixture with exactly the change stated in the component's "Further required fixtures" line.
- **FX-4** Whitespace and line breaks in the fenced contracts are not significant (canonicalisation, D-063).
- **FX-5** A line of the form `<!-- <Component> fixture `<name>` -->` inside a fenced contract of this document is not part of the fixture. The fixture FILE contains, at that position, the complete reference HTML of the named fixture of the named component, with the prop changes stated next to the contract. No fixture file contains an HTML comment.

### 0.5 Resource fixtures

Fixtures reference resources as `{ "$resource": "<type>.<name>" }` (D-074; F-4 of [02-html-contract.md](02-html-contract.md)). The table below is the source of the values in `src/testing/resources.ts` ([13-testing.md](13-testing.md)), which provides every resource for both backends with exactly these values, because the reference HTML in this document shows them. Each resource is named `<type>.<name>`.

| Resource | Values |
|---|---|
| `product.basic` | id `gid://shopify/Product/1` (Liquid `1`); title `Linen Shirt`; handle `linen-shirt`; url `/products/linen-shirt`; vendor `Acme`; available; price 48.00 USD; no compare-at price; featured image `https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg`, alt `Linen shirt on a hanger`, 1200 x 1200; one option `Title` with one value `Default Title`; selected variant id `gid://shopify/ProductVariant/11` (Liquid `11`), title `Default Title`, available; media: the featured image (media id `gid://shopify/MediaImage/101`) and `https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg`, alt `Back of the linen shirt`, 1200 x 1200 (media id `gid://shopify/MediaImage/102`) |
| `product.sale` | as `product.basic` with id 2, title `Wool Socks`, handle `wool-socks`, price 12.00, compare-at price 16.00, image `https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg`, alt `Grey wool socks`, variant id 21 |
| `product.sold-out` | as `product.basic` with id 3, title `Canvas Tote`, handle `canvas-tote`, not available, no featured image, variant id 31 not available |
| `product.options` | as `product.basic`, with options `Color` (`Blue`, swatch colour `#1d4ed8`; `Sand`, swatch colour `#d6c7a1`) and `Size` (`S`, `M`, `L`); variants: Blue / S id 11 available (selected), Blue / M id 12 available, Sand / S id 13 not available; Blue / L does not exist |
| `collection.basic` | id `gid://shopify/Collection/1`; title `Summer`; handle `summer`; url `/collections/summer`; image `https://cdn.shopify.com/s/files/1/0001/summer.jpg`, alt `Beach at noon`, 1600 x 1200 |
| `article.basic` | id `gid://shopify/Article/1`; title `How to wash linen`; url `/blogs/news/how-to-wash-linen`; excerpt `Cold water and patience.`; published `2026-06-01T09:00:00Z`; image `https://cdn.shopify.com/s/files/1/0001/wash.jpg`, alt `Linen in a basin`, 1500 x 1000 |
| `line.basic` | id `gid://shopify/CartLine/1?cart=c1` (Liquid key `11:abc`); quantity 2; title `Linen Shirt`; variant title `Blue / S`; url `/products/linen-shirt?variant=11`; image of `product.basic`; total 96.00 USD; no compare-at total; no attributes |
| `cart.two-lines` | id `gid://shopify/Cart/c1`; total quantity 3; checkout URL `/checkout`; note empty; subtotal 108.00; total 108.00; no discount codes; lines: `line.basic`, and a line id `gid://shopify/CartLine/2?cart=c1` (Liquid key `21:def`), quantity 1, title `Wool Socks`, variant title empty, url `/products/wool-socks?variant=21`, image of `product.sale`, total 12.00, compare-at total 16.00 |
| `cart.empty` | id null; total quantity 0; checkout URL `/checkout`; note empty; subtotal 0.00; total 0.00; no lines |
| `cart.discounted` | as `cart.two-lines` with discount code `SAVE10` (applicable), discount amount 10.80, total 97.20 |
| `filters.basic` | two filters: `Availability` (list; values `In stock` count 8 name `filter.v.availability` value `1` active; `Out of stock` count 2 value `0` not active) and `Price` (price range; names `filter.v.price.gte` / `filter.v.price.lte`; min empty; max `50`); sort options `Featured` (`manual`, selected), `Price, low to high` (`price-ascending`); action `/collections/summer`; current URL `/collections/summer?filter.v.availability=1&filter.v.price.lte=50` |
| `search.shirt` | terms `shirt`; total 2; results: `product.basic`, `product.sale` |

### 0.6 Data: Storefront API fragments and Liquid objects

Every resource prop shape is defined in [05-commerce.md](05-commerce.md) section 11.1 and exported from `<pkg>` (D-094): `RippleProduct`, `RippleVariant`, `RippleCollection`, `RippleArticle`, `RippleCart`, `RippleLine`, `RippleImage`, `RippleMoney`, `RippleMedia`, `RippleFilter`, `RippleFilterValue`, `RippleProductCard`, `RippleProductDetail`, `RippleCollectionCard`, `RippleArticleCard`, and the option, chip and sort-option shapes. This document declares none of them; each component lists the fields it READS, and doc 05 is the definition. This section gives the Storefront API selections that satisfy the types. Ripple ships NO Storefront API client and NO query (ledger section 11 item 13): the fragments below are documentation printed in `docs/guides/` and in the `ripple-commerce` skill; the app's loader runs them with `createStorefrontClient` from `@shopify/hydrogen`.

Verification status: the cart fields were read in `hydrogen/packages/hydrogen/src/core/cart/queries.ts` (`HydrogenCartFragment`). The product option fields (`options.optionValues.firstSelectableVariant`, `selectedOrFirstAvailableVariant`, `adjacentVariants`, `encodedVariantExistence`, `encodedVariantAvailability`) were read as type requirements in `hydrogen/packages/hydrogen/src/core/product/state.ts`. Every other field name below is UNVERIFIED against the Storefront API schema in this session and MUST be checked with the Shopify docs tool before the guide is published.

```graphql
fragment RippleMoney on MoneyV2 { amount currencyCode }

fragment RippleImage on Image { url altText width height }

# ProductCard, ProductRecommendations, PredictiveSearch results
fragment RippleProductCard on Product {
  id
  title
  handle
  vendor
  availableForSale
  featuredImage { ...RippleImage }
  priceRange { minVariantPrice { ...RippleMoney } }
  compareAtPriceRange { minVariantPrice { ...RippleMoney } }
}

# Price, ProductForm, AddToCartButton, VariantPicker
fragment RippleVariant on ProductVariant {
  id
  title
  availableForSale
  price { ...RippleMoney }
  compareAtPrice { ...RippleMoney }
  image { ...RippleImage }
  selectedOptions { name value }
}

# Product page: ProductForm, VariantPicker, ProductGallery
fragment RippleProductDetail on Product {
  ...RippleProductCard
  options {
    name
    optionValues {
      name
      swatch { color image { previewImage { ...RippleImage } } }
      firstSelectableVariant { ...RippleVariant }
    }
  }
  selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) { ...RippleVariant }
  adjacentVariants(selectedOptions: $selectedOptions) { ...RippleVariant }
  media(first: 20) { nodes { __typename id ... on MediaImage { image { ...RippleImage } } } }
  descriptionHtml
}

# CollectionCard
fragment RippleCollectionCard on Collection { id title handle image { ...RippleImage } }

# ArticleCard
fragment RippleArticleCard on Article { id title handle excerpt publishedAt image { ...RippleImage } blog { handle } }

# Filters, FilterGroup, FilterChips, PriceRange (selected on collection.products and on search)
fragment RippleFilter on Filter {
  id
  label
  type
  presentation
  values { id label count input swatch { color image { previewImage { ...RippleImage } } } }
}
```

Queries the loader runs (argument values come from the request URL):

| Page data | Storefront API field | Arguments from the URL |
|---|---|---|
| Product page | `product(handle: $handle) { ...RippleProductDetail }` | `$selectedOptions` = `getSelectedProductOptions({ searchParams, allowedOptionNames })` from `@shopify/hydrogen` (`hydrogen/packages/hydrogen/src/core/product/options.ts`). `?variant=<numeric id>` URLs are redirected to option params by `handleShopifyRoutes` (`hydrogen/packages/hydrogen/skills/hydrogen-variant-form/SKILL.md`). |
| Collection page | `collection(handle: $handle) { ...RippleCollectionCard products(first: 24, after: $after, filters: $filters, sortKey: $sortKey, reverse: $reverse) { filters { ...RippleFilter } nodes { ...RippleProductCard } pageInfo { hasNextPage endCursor hasPreviousPage startCursor } } }` | `const { filters, sortKey, reverse } = parseCollectionParams(searchParams)` from `@shopify/hydrogen` (`hydrogen/packages/hydrogen/src/core/collection/url.ts`) |
| Search page | `search(query: $q, first: 24, after: $after, types: [PRODUCT], productFilters: $filters, sortKey: $sortKey, reverse: $reverse) { totalCount productFilters { ...RippleFilter } nodes { ... on Product { ...RippleProductCard } } pageInfo { hasNextPage endCursor } }` | `q` param; filters as above; unsupported sorts map to `RELEVANCE` (`hydrogen/packages/hydrogen/skills/hydrogen-collection-browser/SKILL.md`) |
| Predictive results | `predictiveSearch(query: $q, limit: 6, types: [PRODUCT]) { products { ...RippleProductCard } }` | `q` param |
| Recommendations | `productRecommendations(productId: $id, intent: RELATED) { ...RippleProductCard }` | product id |
| Cart | none written by the app: `const { data } = await cartHandlers.get({ storefrontClient, request })` returns `{ cart }` selected with `HydrogenCartFragment` ([05-commerce.md](05-commerce.md) section 10.1) | cart cookie |

Liquid equivalents (the expression each Liquid binding reads; nothing else may be read):

| Data | Liquid |
|---|---|
| Product card | `product.title`, `product.url`, `product.vendor`, `product.available`, `product.featured_image`, `product.price`, `product.compare_at_price` |
| Selected variant | `product.selected_or_first_available_variant`: `.id`, `.title`, `.available`, `.price`, `.compare_at_price` |
| Options | `product.options_with_values`: `option.name`, `option.position`, `option.selected_value`, `option.values`; value: `.name`, `.selected`, `.available`, `.variant` (`.id`, `.url`, `.available`), `.swatch` (`.color`, `.image`), `.product_url`; `product.has_only_default_variant` |
| Media | `product.media`: `media.media_type`, `media.preview_image`, `media.alt`, `media.id` |
| Collection | `collection.title`, `collection.url`, `collection.image`, `collection.filters`, `collection.sort_options`, `collection.sort_by`, `collection.default_sort_by`, `collection.products_count` |
| Search | `search.terms`, `search.performed`, `search.results`, `search.results_count`, `search.filters`, `search.sort_options`, `search.sort_by`, `search.default_sort_by` |
| Filter | `filter.label`, `filter.type` (`list`, `boolean`, `price_range`), `filter.param_name`, `filter.presentation`, `filter.values`, `filter.active_values`, `filter.url_to_remove`, `filter.min_value`, `filter.max_value`, `filter.range_max`; value: `.label`, `.value`, `.count`, `.active`, `.param_name`, `.url_to_remove`, `.swatch` |
| Article | `article.title`, `article.url`, `article.excerpt`, `article.published_at`, `article.image` |
| Cart | `cart.item_count`, `cart.items`, `cart.note`, `cart.items_subtotal_price`, `cart.total_price`, `cart.cart_level_discount_applications` (`.title`, `.type`, `.total_allocated_amount`) |
| Cart line | `item.key`, `item.quantity`, `item.product.title`, `item.variant.title`, `item.product.has_only_default_variant`, `item.url`, `item.url_to_remove`, `item.image`, `item.final_line_price`, `item.original_line_price`, `item.properties` |
| Recommendations | `recommendations.performed?`, `recommendations.products`, `recommendations.products_count`; `routes.product_recommendations_url` |
| Routes | `routes.cart_url`, `routes.cart_add_url`, `routes.search_url` |

Liquid drop members confirmed through the Shopify docs tool in this session: `product_option_value` (`available`, `name`, `product_url`, `selected`, `swatch`), `product_option` (`name`, `position`, `selected_value`, `values`), `filter` (`param_name`, `presentation`, `min_value`, `active_values`, `url_to_remove`), `filter_value` (`active`, `count`, `label`, `param_name`, `swatch`, `url_to_add`, `url_to_remove`, `value`), `cart` (`cart_level_discount_applications`, `items_subtotal_price`, `total_price`, `item_count`, `note`), `recommendations` (`performed?`, `products`, `products_count`, `intent`). `product_option_value.variant` and the `discount_application.type` value `discount_code` are used by the base theme (`ripple/theme/blocks/variant-picker.liquid`) or come from general knowledge: UNVERIFIED in the docs tool.

Liquid subset: the components of this document use only the component scope of D-097 ([06-bindings.md](06-bindings.md) rule L-13). That scope includes the filters `divided_by` and `modulo` (PriceRange), `date` (ArticleCard), `url_encode` (FilterChips clear link on search) and `payment_button` (ProductForm accelerated checkout), and the objects `content_for_additional_checkout_buttons` and `additional_checkout_buttons` (CartSummary). The shim of [13-testing.md](13-testing.md) implements the scope. The loop variables `forloop.index` and `forloop.first` are used.

### 0.7 Shared conventions

- **CV-1 Locale and money in TSX hosts.** Components that print money or dates take a `locale` prop (BCP 47 tag, default `"en-US"`, TSX hosts only, manifest `prop.hosts: ["react", "remix"]`). Money text is `formatMoney(money, { locale }).localizedString` with `formatMoney` imported from `@shopify/hydrogen` (`hydrogen/packages/hydrogen/src/core/money/format.ts`; D-049). Liquid prints `{{ cents | money }}`; there is no money snippet (D-049). The `html` host writes the text by hand. `locale` and `strings` are ordinary TSX props (D-094).
- **CV-2 Strings.** Every string a component prints itself is a locale key. The tables under "Host notes" give key and English default. TSX hosts override a string by passing children where the string is the component's text, and otherwise through the prop `strings` (type `object`, a partial map from the key's last segment in camelCase to text, TSX hosts only).
- **CV-3 `refresh` prop.** Components rooted in `rp-live` take `refresh` (Liquid `refresh`): a space-separated list of region names, printed escaped as `data-rp-refresh`. It is a `string` prop, not responsive.
- **CV-4 Ids.** `id` is REQUIRED on ProductGallery, ProductForm, VariantPicker, CartDrawer, CartLines, CartNote, DiscountCode, Filters, SortSelect and PredictiveSearch (D-020). Derived ids use only the suffixes of D-020 (`-title`, `-description`, `-error`, `-trigger`, `-content`, `-tab-<v>`, `-panel-<v>`, `-item-<v>`, `-list`, `-live`, `-form`). `<cart lines id>-form` is the Liquid cart form (D-092).
- **CV-5 Custom element roots** print `data-slot="<tag>"` (D-019). In Remix they also print `data-rmx-key` (D-034): the value is the `id` when the component has a REQUIRED `id`; otherwise it is the prop `rmxKey` (Remix host only), and the attribute is omitted when `rmxKey` is unset. Fixtures do not show `data-rmx-key`.
- **CV-6 Liquid tier `resource`.** The block takes the resource as a param, prints the default body, and prints `{{ content }}` in place of the default body when `content != blank` (D-037). For the six region components "default body" means the region part (RS-2). For the others the component section states what the content replaces.
- **CV-7 Styling sections** list tokens and public custom properties; the CSS file itself MUST follow [03-styling-and-tokens.md](03-styling-and-tokens.md) section 7 (one `@layer rp.components` block, modifiers set custom properties only, logical properties, hover inside `@media (hover: hover)`).
- **CV-8 Upgrade allow-list entries** use the format of [02-html-contract.md](02-html-contract.md) section 7.2 (D-071) and go into the manifest key `upgradeAllow`. An entry has exactly these keys: `select` (REQUIRED), `attrs` (attribute names; `["*"]` is forbidden), `childList`, `text`, `subtree` (booleans, default `false`) and `reason` (REQUIRED). The global entry for `a[data-rp-open]` (`aria-haspopup`, `aria-controls`) is owned by doc 02 and is not repeated per component.
- **CV-9 Value imports of `@shopify/hydrogen`** in scaffolded TSX files are exactly these seven pure functions (D-094): `formatMoney`, `renderShopPayButton`, `buildProductSelectionSearchParams`, `parseCollectionParams`, `serializeCollectionParams`, `isFilterInputActive`, `getFilterRemovalUrl`. Every other import from `@shopify/hydrogen` is `import type`.
- **CV-10 Data helpers.** A pure helper that builds prop values (`toRippleCart`, `toRippleLine`, `variantPickerOptions`, `toRippleFilters`, `toFilterChips`, `sortParams`) lives in `<id>.data.ts` (manifest file key `data`), which has no `"use client"` directive. The binding imports it as `./<id>.data` (Remix: `./<id>.data.ts`); blueprints import it as `@components/<id>.data`. A `"use client"` file exports components only (D-094).
- **CV-11 Composition.** Reuse of another component's markup follows section 0.2 (D-070).
- **CV-12 Analytics.** No component in this document prints `rp-view-event`; only blueprints do (D-089).
- **CV-13 Acceptance tests.** Item `n` of a component's "Acceptance tests" list has the id `AT-<n>` (D-104); a cross-reference is written `<Component> AT-<n>`. "Tier" is a tier of D-063.
- **CV-14 Checker rules.** A component-specific rule is an entry of the manifest key `rules[]` with the keys `id`, `kind` (`requires-ancestor`, `forbids-ancestor`, `requires-descendant`, `forbids-descendant`, `requires-attribute`, `max-count`), `selector`, `target`, `count`, `message`, `fix`. `ripple check` reports a violated rule as RP113 with the rule id in brackets (D-102).
- **CV-16 Remix cart forms.** Every cart `<form>` printed by a component of this document on the `remix` host (ProductForm fields, CartLine actions, the CartSummary remove form, the CartNote form, the DiscountCode form) and the checkout link print `data-rmx-document` (D-034 item 3). Fixtures do not show it; the canonicaliser removes host extra attributes (D-063).
- **CV-15 Liquid attributes.** A Liquid binding prints `{{ attributes }}` last on the root (D-035). A root printed by `{% form %}` accepts only `id` and `class` (D-091 item 6). Schema label keys are `t:ripple.<id>.name`, `t:ripple.<id>.<part>_name` and `t:ripple.props.<prop>` (D-038).

---

## ProductCard

Specified in [components/product-card.md](components/product-card.md).

## CollectionCard

Specified in [components/collection-card.md](components/collection-card.md).

## ArticleCard

Specified in [components/article-card.md](components/article-card.md).

## Price

Specified in [components/price.md](components/price.md).

## ProductGallery

Specified in [components/product-gallery.md](components/product-gallery.md).

## ProductForm

Specified in [components/product-form.md](components/product-form.md).

## VariantPicker

Specified in [components/variant-picker.md](components/variant-picker.md).

## Swatch

Specified in [components/swatch.md](components/swatch.md).

## AddToCartButton

Specified in [components/add-to-cart-button.md](components/add-to-cart-button.md).

## ProductRecommendations

Specified in [components/product-recommendations.md](components/product-recommendations.md).

## CartLink

Specified in [components/cart-link.md](components/cart-link.md).

## CartDrawer

Specified in [components/cart-drawer.md](components/cart-drawer.md).

## CartLines

Specified in [components/cart-lines.md](components/cart-lines.md).

## CartLine

Specified in [components/cart-line.md](components/cart-line.md).

## CartSummary

Specified in [components/cart-summary.md](components/cart-summary.md).

## CartNote

Specified in [components/cart-note.md](components/cart-note.md).

## DiscountCode

Specified in [components/discount-code.md](components/discount-code.md).

## CheckoutButton

Specified in [components/checkout-button.md](components/checkout-button.md).

## Filters

Specified in [components/filters.md](components/filters.md).

## FilterGroup

Specified in [components/filter-group.md](components/filter-group.md).

## FilterChips

Specified in [components/filter-chips.md](components/filter-chips.md).

## PriceRange

Specified in [components/price-range.md](components/price-range.md).

## SortSelect

Specified in [components/sort-select.md](components/sort-select.md).

## SearchForm

Specified in [components/search-form.md](components/search-form.md).

## PredictiveSearch

Specified in [components/predictive-search.md](components/predictive-search.md).

## LiveForm

Specified in [components/live-form.md](components/live-form.md).

## Ledger issues

None open. See `00-decisions.md` sections 13.2 and 13.3 (D-109 to D-113).
