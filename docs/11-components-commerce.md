# 11 - Components: commerce

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

| Field | Value |
|---|---|
| Id | `product-card` |
| Kind | `static` |
| Category | `product` |
| Custom elements | none |
| Root element and class | `div` `.rp-product-card` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `image`, `placeholder`, `badge`, `price` |
| Milestone | M3 |

### Purpose

A product summary for grids and carousels: image, optional badge, optional vendor, title link and price.

- Use when: showing a product in a list (collection grid, search results, recommendations, featured collection).
- Do not use when: selling the product on its own page; use ProductGallery, VariantPicker and ProductForm instead.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `ProductCard` | `blocks/product-card.liquid` + `snippets/rp-product-card.liquid` | `div` | `rp-product-card` | none | yes | none |
| media | printed by root | same | `div` | `rp-product-card-media` | none | yes | none |
| badge | printed by root | same | `span` | `rp-badge rp-product-card-badge` | none | no | none |
| body | printed by root | same | `div` | `rp-product-card-body` | none | yes | none |
| vendor | printed by root | same | `p` | `rp-product-card-vendor` | none | no | none |
| title | printed by root | same | `h2` to `h6` | `rp-product-card-title` | none | yes | none |
| link | printed by root | same | `a` | `rp-product-card-link` | none | yes | none |

Nesting rules: media and body are the only children of root, in that order. Inside media: one Image (or one Placeholder when the product has no image), then the badge. Inside body, in order: vendor, title, Price. The link is the only child of title. A ProductCard MUST NOT be placed inside an `<a>` or a `<button>`. The markup lives in `snippets/rp-product-card.liquid` because ProductRecommendations, PredictiveSearch and FeaturedCollection embed it (manifest `liquid.embeddedBy`).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `product` | `product` | object | `RippleProduct` / Liquid `product` drop | none | yes | no | text, `href`, Image, Price, badge |
| `level` | `level` | enum | `2 3 4 5 6` | `3` | no | no | the tag of the title part: `h<level>` |
| `ratio` | `ratio` | enum | `auto 1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9` | `1/1` | no | no | `data-ratio` on the embedded Image or Placeholder |
| `sizes` | `sizes` | string | any `sizes` value | `(min-width: 64rem) 25vw, 50vw` | no | no | `sizes` on the embedded Image |
| `loading` | `loading` | enum | `lazy eager` | `lazy` | no | no | `loading` on the embedded Image |
| `showVendor` | `show_vendor` | boolean | `true false` | `false` | no | no | `data-show-vendor=""` on root, and the vendor part |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | passed to Price (CV-1); TSX hosts only |

### Content model

`none` in TSX hosts. Liquid: `{{ content }}`, when not blank, replaces every child of the root (CV-6); the caller then writes the whole card body.

### HTML contract

Fixture `default` (`product`: `product.basic`):

```html
<div class="rp-product-card">
  <div class="rp-product-card-media">
    <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1600 1600w" sizes="(min-width: 64rem) 25vw, 50vw" alt="Linen shirt on a hanger" width="1200" height="1200" loading="lazy" decoding="async" data-ratio="1/1" data-fit="cover" data-radius="none">
  </div>
  <div class="rp-product-card-body">
    <h3 class="rp-product-card-title"><a class="rp-product-card-link" href="/products/linen-shirt">Linen Shirt</a></h3>
    <span class="rp-price" data-size="base"><span class="rp-price-current"><bdi>$48.00</bdi></span></span>
  </div>
</div>
```

Fixture `sale` (`product`: `product.sale`, `showVendor`: true, `level`: `2`):

```html
<div class="rp-product-card" data-show-vendor="">
  <div class="rp-product-card-media">
    <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=1600 1600w" sizes="(min-width: 64rem) 25vw, 50vw" alt="Grey wool socks" width="1200" height="1200" loading="lazy" decoding="async" data-ratio="1/1" data-fit="cover" data-radius="none">
    <span class="rp-badge rp-product-card-badge" data-variant="solid" data-tone="sale" data-size="md">Sale</span>
  </div>
  <div class="rp-product-card-body">
    <p class="rp-product-card-vendor">Acme</p>
    <h2 class="rp-product-card-title"><a class="rp-product-card-link" href="/products/wool-socks">Wool Socks</a></h2>
    <span class="rp-price" data-size="base" data-sale=""><span class="rp-visually-hidden">Sale price</span><span class="rp-price-current"><bdi>$12.00</bdi></span><span class="rp-visually-hidden">Regular price</span><s class="rp-price-compare"><bdi>$16.00</bdi></s></span>
  </div>
</div>
```

Fixture `sold-out` (`product`: `product.sold-out`, `ratio`: `4/5`):

```html
<div class="rp-product-card">
  <div class="rp-product-card-media">
    <div class="rp-placeholder" data-ratio="4/5" data-radius="none" aria-hidden="true"></div>
    <span class="rp-badge rp-product-card-badge" data-variant="solid" data-tone="neutral" data-size="md">Sold out</span>
  </div>
  <div class="rp-product-card-body">
    <h3 class="rp-product-card-title"><a class="rp-product-card-link" href="/products/canvas-tote">Canvas Tote</a></h3>
    <span class="rp-price" data-size="base"><span class="rp-price-current"><bdi>$48.00</bdi></span></span>
  </div>
</div>
```

Further required fixtures: `class` (root class `rp-product-card custom-a custom-b`); `invalid-enum-falls-back` (`level`: `9`; HTML equals `default`); `escaping` (`sizes`: `Say "hi" & <go>`; the `sizes` attribute is `Say &quot;hi&quot; &amp; &lt;go&gt;`); `eager` (`loading`: `eager`; `loading="eager"` on the image).

Badge rule: when the product is not available the badge is `Sold out` with `data-tone="neutral"`; otherwise, when the compare-at price is greater than the price, the badge is `Sale` with `data-tone="sale"`; otherwise no badge is printed.

Host-owned regions and masks: no host-owned region. Masks: `{ "select": "img", "op": "attr", "name": "src" }`, `{ "select": "img", "op": "srcset", "name": "srcset" }` (fixtures with an image); `{ "select": ".rp-price-current", "op": "text" }`; `{ "select": ".rp-price-compare", "op": "text" }` (fixture `sale`).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-show-vendor` | root | server | `showVendor` is true | `""` or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None. The card is a link; no script touches it.

### Behaviour without JavaScript

Everything works: the title link navigates to the product page. The whole card is clickable through CSS (the link's `::after` covers the card).

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: native link inside a heading; `checkPattern`: none.
- Accessible name: the link text (the product title); required. The image `alt` is the product image's alt text, or the empty string when it has none.
- Focus: one tab stop per card (the link). The focus ring is drawn by the link's `::after` and therefore surrounds the whole card.
- Announcements: None.

| Key | Action |
|---|---|
| Enter | follows the link |

### Styling

- File: `components/product-card/product-card.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--radius-surface`, `--color-foreground`, `--color-muted-foreground`, `--color-ring`, `--text-sm`, `--text-base`, `--rp-duration-base`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-product-card-gap` | `calc(var(--spacing) * 3)` | space between media and body |
| `--rp-product-card-radius` | `var(--radius-surface)` | corner radius of the media |
| `--rp-product-card-badge-inset` | `calc(var(--spacing) * 2)` | distance of the badge from the media's start and top edges |

| Modifier selector | Sets |
|---|---|
| `.rp-product-card[data-show-vendor]` | nothing; reserved for project CSS |

Required rules: root `position: relative; display: flex; flex-direction: column; gap: var(--rp-product-card-gap)`; `.rp-product-card-media { position: relative; overflow: hidden; border-radius: var(--rp-product-card-radius) }`; `.rp-product-card-badge { position: absolute; inset-block-start: var(--rp-product-card-badge-inset); inset-inline-start: var(--rp-product-card-badge-inset) }`; `.rp-product-card-link::after { content: ""; position: absolute; inset: 0 }`; `.rp-product-card-link:focus-visible { outline: none }` together with `.rp-product-card-link:focus-visible::after { outline: 2px solid var(--color-ring); outline-offset: 2px; border-radius: var(--rp-product-card-radius) }`.

### Host notes

- HTML: copy the contract; write the formatted price by hand.
- React: `ProductCard(props: { product: RippleProduct; level?: 2 | 3 | 4 | 5 | 6; ratio?: Ratio; sizes?: string; loading?: "lazy" | "eager"; showVendor?: boolean; locale?: string; className?: string })`. No hook, no `"use client"`. Sale test: `product.compareAtPrice !== null && Number(product.compareAtPrice.amount) > Number(product.price.amount)`. The badge composes Badge by contract (D-070; class pair `rp-badge rp-product-card-badge`, section 0.2): the binding prints the `<span>` itself with Badge's `data-variant`, `data-tone`, `data-size`. Image: the embedded Image, `<Image image={product.featuredImage} sizes={sizes} loading={loading} ratio={ratio} />`; Image prints `src` (width 800) and the six-width `srcset` itself (doc 09). The binding MUST NOT build image URLs.
- Remix: same props with `class`; no `data-rmx-*` attribute.
- Liquid: `snippets/rp-product-card.liquid` holds the markup; `blocks/product-card.liquid` is the thin wrapper (L-3). Sale test: `product.compare_at_price > product.price`. Image: `{% render 'rp-image', image: product.featured_image, sizes: sizes, loading: loading, ratio: ratio %}`; the Image snippet prints `src` (width 800) and the six-width `srcset` (doc 09). The root prints `{{ attributes }}` last (D-035). No schema settings. Locale keys: `ripple.product-card.sale` = `Sale`; `ripple.product-card.sold_out` = `Sold out`.

```tsx
<ProductCard product={product} level={2} showVendor />
```

```liquid
{% block 'product-card', product: product, level: '2', show_vendor: true %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP101 (`level`, `ratio`, `loading` values), RP104 (`product` missing), RP110 (class on a wrong tag), RP203 (embedded Image has `alt`, `width`, `height`). Manifest `rules[]`: `product-card-not-in-link` (`forbids-ancestor`, selector `:scope`, target `a, button`; message: "A ProductCard is inside a link or button; its own link is then nested interactive content.").

### Acceptance tests

1. Tier 2: fixtures `default`, `sale`, `sold-out`, `class`, `invalid-enum-falls-back`, `escaping`, `eager` are canonical-equal in all four hosts with the masks above.
2. Tier 5: in Chromium, a click at the centre of the image navigates to the product URL (the `::after` overlay works), and Tab reaches exactly one element per card.
3. Tier 6: with scripting disabled the same click navigates.
4. Tier 5: the computed `inline-size` of the badge box is inside the media box in both `dir="ltr"` and `dir="rtl"`.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/research/base-theme.md` (product card written six times; card composition); `ripple/theme/templates/collection.liquid`; `hydrogen/packages/hydrogen/skills/hydrogen-image/SKILL.md`.
- UNVERIFIED: Storefront API field names of `RippleProductCard` (section 0.6).

### Fallback (SPIKE-nn)

None.

---

## CollectionCard

| Field | Value |
|---|---|
| Id | `collection-card` |
| Kind | `static` |
| Category | `product` |
| Custom elements | none |
| Root element and class | `div` `.rp-collection-card` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `image`, `placeholder` |
| Milestone | M3 |

### Purpose

A collection summary: image and title link.

- Use when: listing collections (collections list page, home page tiles).
- Do not use when: listing products; use ProductCard.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CollectionCard` | `blocks/collection-card.liquid` | `div` | `rp-collection-card` | none | yes | none |
| media | printed by root | same | `div` | `rp-collection-card-media` | none | yes | none |
| title | printed by root | same | `h2` to `h6` | `rp-collection-card-title` | none | yes | none |
| link | printed by root | same | `a` | `rp-collection-card-link` | none | yes | none |

Nesting rules: media then title are the only children of root. The link is the only child of title. MUST NOT be placed inside an `<a>` or a `<button>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `collection` | `collection` | object | `RippleCollection` / Liquid `collection` drop | none | yes | no | text, `href`, Image |
| `level` | `level` | enum | `2 3 4 5 6` | `3` | no | no | the tag of the title part |
| `ratio` | `ratio` | enum | `auto 1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9` | `1/1` | no | no | `data-ratio` on the embedded Image or Placeholder |
| `sizes` | `sizes` | string | any `sizes` value | `(min-width: 64rem) 33vw, 50vw` | no | no | `sizes` on the embedded Image |
| `loading` | `loading` | enum | `lazy eager` | `lazy` | no | no | `loading` on the embedded Image |

### Content model

`none` in TSX hosts. Liquid: `{{ content }}`, when not blank, replaces every child of the root (CV-6).

### HTML contract

Fixture `default` (`collection`: `collection.basic`):

```html
<div class="rp-collection-card">
  <div class="rp-collection-card-media">
    <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/summer.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/summer.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/summer.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/summer.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/summer.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/summer.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/summer.jpg?width=1600 1600w" sizes="(min-width: 64rem) 33vw, 50vw" alt="Beach at noon" width="1600" height="1200" loading="lazy" decoding="async" data-ratio="1/1" data-fit="cover" data-radius="none">
  </div>
  <h3 class="rp-collection-card-title"><a class="rp-collection-card-link" href="/collections/summer">Summer</a></h3>
</div>
```

Further required fixtures: `class`; `invalid-enum-falls-back` (`level`: `9`; equals `default`); `escaping` (`sizes`: `Say "hi" & <go>`); `props` (`level`: `2`, `ratio`: `3/2`, `loading`: `eager`; title tag `h2`, `data-ratio="3/2"`, `loading="eager"`). A collection without an image prints `<div class="rp-placeholder" data-ratio="1/1" data-radius="none" aria-hidden="true"></div>` in place of the `<img>` (no shared fixture; covered by a host unit test).

Host-owned regions and masks: no host-owned region. Masks: `img` `src` (`attr`) and `srcset` (`srcset`).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| None. | | | | |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None.

### Behaviour without JavaScript

Everything works: the title link navigates to the collection page; the whole card is clickable through the link's `::after`.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: native link inside a heading; `checkPattern`: none.
- Accessible name: the link text (collection title); required.
- Focus: one tab stop per card.
- Announcements: None.

| Key | Action |
|---|---|
| Enter | follows the link |

### Styling

- File: `components/collection-card/collection-card.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--radius-surface`, `--color-foreground`, `--color-ring`, `--text-lg`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-collection-card-gap` | `calc(var(--spacing) * 3)` | space between media and title |
| `--rp-collection-card-radius` | `var(--radius-surface)` | corner radius of the media |

| Modifier selector | Sets |
|---|---|
| None. | |

Required rules: the same overlay-link and focus rules as ProductCard, with the `rp-collection-card-` classes.

### Host notes

- HTML: None.
- React: `CollectionCard(props: { collection: RippleCollection; level?: 2 | 3 | 4 | 5 | 6; ratio?: Ratio; sizes?: string; loading?: "lazy" | "eager"; className?: string })`. No hook.
- Remix: None.
- Liquid: markup in `blocks/collection-card.liquid` (not embedded by another file). Image: `{% render 'rp-image', image: collection.image, sizes: sizes, loading: loading, ratio: ratio %}`; when `collection.image == blank` render Placeholder (`{% render 'rp-placeholder', ratio: ratio %}`). No schema settings. No locale keys.

```tsx
<CollectionCard collection={collection} ratio="3/2" />
```

```liquid
{% block 'collection-card', collection: collection, ratio: '3/2' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP101, RP104 (`collection`), RP110, RP203. Manifest `rules[]`: `collection-card-not-in-link` (`forbids-ancestor`, selector `:scope`, target `a, button`).

### Acceptance tests

1. Tier 2: fixtures `default`, `class`, `invalid-enum-falls-back`, `escaping`, `props` are canonical-equal in all four hosts.
2. Tier 6: with scripting disabled a click on the image navigates to the collection URL.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/templates/list-collections.liquid`; `ripple/docs/research/base-theme.md`.
- UNVERIFIED: Storefront API field names of `RippleCollectionCard` (section 0.6).

### Fallback (SPIKE-nn)

None.

---

## ArticleCard

| Field | Value |
|---|---|
| Id | `article-card` |
| Kind | `static` |
| Category | `product` |
| Custom elements | none |
| Root element and class | `div` `.rp-article-card` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `image`, `placeholder` |
| Milestone | M3 |

### Purpose

A blog article summary: image, date, title link and excerpt.

- Use when: listing articles on a blog page or a home page.
- Do not use when: rendering the article itself; use Heading and RichText.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `ArticleCard` | `blocks/article-card.liquid` | `div` | `rp-article-card` | none | yes | none |
| media | printed by root | same | `div` | `rp-article-card-media` | none | yes | none |
| body | printed by root | same | `div` | `rp-article-card-body` | none | yes | none |
| date | printed by root | same | `time` | `rp-article-card-date` | none | yes | none |
| title | printed by root | same | `h2` to `h6` | `rp-article-card-title` | none | yes | none |
| link | printed by root | same | `a` | `rp-article-card-link` | none | yes | none |
| excerpt | printed by root | same | `p` | `rp-article-card-excerpt` | none | no | none |

Nesting rules: media then body are the only children of root. Inside body, in order: date, title, excerpt. The excerpt part is printed only when the excerpt is not empty. MUST NOT be placed inside an `<a>` or a `<button>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `article` | `article` | object | `RippleArticle` / Liquid `article` drop | none | yes | no | text, `href`, Image, `datetime` |
| `level` | `level` | enum | `2 3 4 5 6` | `3` | no | no | the tag of the title part |
| `ratio` | `ratio` | enum | `auto 1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9` | `3/2` | no | no | `data-ratio` on the embedded Image or Placeholder |
| `sizes` | `sizes` | string | any `sizes` value | `(min-width: 64rem) 33vw, 100vw` | no | no | `sizes` on the embedded Image |
| `loading` | `loading` | enum | `lazy eager` | `lazy` | no | no | `loading` on the embedded Image |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | date text; TSX hosts only |

### Content model

`none` in TSX hosts. Liquid: `{{ content }}`, when not blank, replaces every child of the root (CV-6).

### HTML contract

Fixture `default` (`article`: `article.basic`):

```html
<div class="rp-article-card">
  <div class="rp-article-card-media">
    <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/wash.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/wash.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/wash.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/wash.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/wash.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/wash.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/wash.jpg?width=1600 1600w" sizes="(min-width: 64rem) 33vw, 100vw" alt="Linen in a basin" width="1500" height="1000" loading="lazy" decoding="async" data-ratio="3/2" data-fit="cover" data-radius="none">
  </div>
  <div class="rp-article-card-body">
    <time class="rp-article-card-date" datetime="2026-06-01">Jun 1, 2026</time>
    <h3 class="rp-article-card-title"><a class="rp-article-card-link" href="/blogs/news/how-to-wash-linen">How to wash linen</a></h3>
    <p class="rp-article-card-excerpt">Cold water and patience.</p>
  </div>
</div>
```

Further required fixtures: `class`; `invalid-enum-falls-back` (`level`: `9`; equals `default`); `escaping` (`sizes`: `Say "hi" & <go>`); `props` (`level`: `2`, `ratio`: `16/9`, `loading`: `eager`).

Host-owned regions and masks: no host-owned region. Masks: `img` `src` and `srcset`; `{ "select": ".rp-article-card-date", "op": "text" }` (date text is formatted by the backend's locale rules). The `datetime` attribute is NOT masked: it MUST be the first 10 characters of the ISO 8601 publication time in UTC.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| None. | | | | |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None.

### Behaviour without JavaScript

Everything works: the title link navigates to the article.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: native link inside a heading; `checkPattern`: none.
- Accessible name: the link text (article title); required.
- Focus: one tab stop per card.
- Announcements: None.

| Key | Action |
|---|---|
| Enter | follows the link |

### Styling

- File: `components/article-card/article-card.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--radius-surface`, `--color-foreground`, `--color-muted-foreground`, `--color-ring`, `--text-sm`, `--text-lg`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-article-card-gap` | `calc(var(--spacing) * 3)` | space between media and body |
| `--rp-article-card-radius` | `var(--radius-surface)` | corner radius of the media |

| Modifier selector | Sets |
|---|---|
| None. | |

Required rules: the same overlay-link and focus rules as ProductCard, with the `rp-article-card-` classes; the excerpt is clamped to three lines with `-webkit-line-clamp: 3`.

### Host notes

- HTML: None.
- React: `ArticleCard(props: { article: RippleArticle; level?: 2 | 3 | 4 | 5 | 6; ratio?: Ratio; sizes?: string; loading?: "lazy" | "eager"; locale?: string; className?: string })`. Date text: `new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(article.publishedAt))`. `datetime`: `article.publishedAt.slice(0, 10)`.
- Remix: None.
- Liquid: date text `{{ article.published_at | date: format: 'abbreviated_date' }}`; `datetime="{{ article.published_at | date: '%Y-%m-%d' }}"`. Excerpt: `article.excerpt` printed with `| escape` (plain text; an HTML excerpt is not supported in V1). No schema settings. No locale keys.

```tsx
<ArticleCard article={article} />
```

```liquid
{% block 'article-card', article: article %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP101, RP104 (`article`), RP110, RP203. Manifest `rules[]`: `article-card-not-in-link` (`forbids-ancestor`, selector `:scope`, target `a, button`).

### Acceptance tests

1. Tier 2: fixtures `default`, `class`, `invalid-enum-falls-back`, `escaping`, `props` are canonical-equal in all four hosts with the masks above; the `datetime` value is `2026-06-01` in every host.
2. Tier 6: with scripting disabled a click on the image navigates to the article URL.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/templates/blog.liquid`; `ripple/docs/research/base-theme.md`.
- UNVERIFIED: the Liquid `date` filter argument `format: 'abbreviated_date'` in the shim (the shim MUST implement it as `Jun 1, 2026` for `en`); Storefront API field names of `RippleArticleCard`.

### Fallback (SPIKE-nn)

None.

---

## Price

| Field | Value |
|---|---|
| Id | `price` |
| Kind | `static` |
| Category | `product` |
| Custom elements | none |
| Root element and class | `span` `.rp-price` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `visually-hidden` |
| Milestone | M3 |

### Purpose

Prints a price formatted by the server, with an optional struck-through compare-at price.

- Use when: showing the price of a product, a variant or a cart line.
- Do not use when: showing a cart total; CartSummary prints totals itself.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Price` | `blocks/price.liquid` + `snippets/rp-price.liquid` | `span` | `rp-price` | none | yes | none |
| prefix | printed by root | same | `span` | `rp-price-prefix` | none | no | none |
| current | printed by root | same | `span` | `rp-price-current` | none | yes | none |
| compare | printed by root | same | `s` | `rp-price-compare` | none | no | none |

Nesting rules: children of root in this order: prefix (when `from`), visually hidden "Sale price" label (when on sale), current, visually hidden "Regular price" label (when on sale), compare (when on sale). The formatted amount is the only child of a `<bdi>` inside current and inside compare. "On sale" means: `compareAtPrice` is set and its amount is greater than the amount of `price`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `price` | `price` | object | `RippleMoney` / Liquid number of cents | none | yes | no | text of the current part |
| `compareAtPrice` | `compare_at_price` | object | `RippleMoney` or `null` / Liquid number of cents or blank | none | no | no | compare part, `data-sale=""` on root |
| `size` | `size` | enum | `sm base lg xl 2xl` | `base` | no | no | `data-size` on root |
| `from` | `from` | boolean | `true false` | `false` | no | no | `data-from=""` on root, and the prefix part |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | money formatting (CV-1); TSX hosts only |

### Content model

`none` - no children. The Liquid block has an empty body.

### HTML contract

Fixture `default` (`price`: 48.00 USD):

```html
<span class="rp-price" data-size="base"><span class="rp-price-current"><bdi>$48.00</bdi></span></span>
```

Fixture `sale` (`price`: 12.00 USD, `compareAtPrice`: 16.00 USD, `size`: `lg`):

```html
<span class="rp-price" data-size="lg" data-sale=""><span class="rp-visually-hidden">Sale price</span><span class="rp-price-current"><bdi>$12.00</bdi></span><span class="rp-visually-hidden">Regular price</span><s class="rp-price-compare"><bdi>$16.00</bdi></s></span>
```

Fixture `from` (`price`: 48.00 USD, `from`: true):

```html
<span class="rp-price" data-size="base" data-from=""><span class="rp-price-prefix">From</span><span class="rp-price-current"><bdi>$48.00</bdi></span></span>
```

Fixture `compare-not-higher` (`price`: 48.00 USD, `compareAtPrice`: 48.00 USD): HTML equals `default`.

Further required fixtures: `class`; `invalid-enum-falls-back` (`size`: `huge`; equals `default`).

Host-owned regions and masks: no host-owned region. Masks: `{ "select": ".rp-price-current", "op": "text" }`; `{ "select": ".rp-price-compare", "op": "text" }` (fixture `sale`). Resource references for money props are `{ "$resource": "money.usd-48" }`, `money.usd-12`, `money.usd-16` ([13-testing.md](13-testing.md): hydrogen `{ amount: "48.0", currencyCode: "USD" }`; Liquid `4800`).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-sale` | root | server | on sale | `""` or absent |
| `data-from` | root | server | `from` is true | `""` or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None. There is no money element (D-049). The text changes only when a region that contains the Price is refreshed, or when React re-renders it.

### Behaviour without JavaScript

Identical: the server-formatted text is shown.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: text; `checkPattern`: none.
- Accessible name: not applicable. A screen reader reads `Sale price $12.00 Regular price $16.00`; the `<s>` element alone MUST NOT be relied on to convey "old price".
- Focus: not focusable.
- Announcements: None.

| Key | Action |
|---|---|
| None | |

### Styling

- File: `components/price/price.css` (layer `rp.components`).
- Tokens used: `--color-foreground`, `--color-muted-foreground`, `--color-sale`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl`, `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-price-gap` | `calc(var(--spacing) * 2)` | inline space between parts |
| `--rp-price-font-size` | `var(--text-base)` | font size of the current part |
| `--rp-price-sale-color` | `var(--color-sale)` | colour of the current part when on sale |
| `--rp-price-compare-color` | `var(--color-muted-foreground)` | colour of the compare part |

| Modifier selector | Sets |
|---|---|
| `.rp-price[data-size="sm"]` | `--rp-price-font-size: var(--text-sm)` |
| `.rp-price[data-size="base"]` | `--rp-price-font-size: var(--text-base)` |
| `.rp-price[data-size="lg"]` | `--rp-price-font-size: var(--text-lg)` |
| `.rp-price[data-size="xl"]` | `--rp-price-font-size: var(--text-xl)` |
| `.rp-price[data-size="2xl"]` | `--rp-price-font-size: var(--text-2xl)` |
| `.rp-price[data-sale]` | `--_fg: var(--rp-price-sale-color)` |

Required rules: root `display: inline-flex; flex-wrap: wrap; align-items: baseline; gap: var(--rp-price-gap)`; the compare part is one step smaller than the current part and uses `text-decoration: line-through`; `font-variant-numeric: tabular-nums` on root.

### Host notes

- HTML: write the formatted text by hand.
- React: `Price(props: { price: RippleMoney; compareAtPrice?: RippleMoney | null; size?: "sm" | "base" | "lg" | "xl" | "2xl"; from?: boolean; locale?: string; strings?: { sale?: string; regular?: string; from?: string }; className?: string })`. Imports `formatMoney` from `@shopify/hydrogen` (a value import allowed by D-094, CV-9). Text: `formatMoney(price, { locale }).localizedString`. No hook.
- Remix: None.
- Liquid: markup in `snippets/rp-price.liquid`; `blocks/price.liquid` is the thin wrapper. Text: `{{ price | money }}`. On-sale test: `compare_at_price != blank and compare_at_price > price`. One schema setting: `size` (`select`). Locale keys: `ripple.price.sale` = `Sale price`; `ripple.price.regular` = `Regular price`; `ripple.price.from` = `From`.

```tsx
<Price price={variant.price} compareAtPrice={variant.compareAtPrice} size="lg" locale="en-US" />
```

```liquid
{% block 'price', price: variant.price, compare_at_price: variant.compare_at_price, size: 'lg' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP101 (`size`), RP104 (`price`), RP110. No `rules[]` entry.

### Acceptance tests

1. Tier 2: fixtures `default`, `sale`, `from`, `compare-not-higher`, `class`, `invalid-enum-falls-back` are canonical-equal in all four hosts with the masks above.
2. Tier 5 (unit, TSX hosts): `Price` with `{ amount: "48.0", currencyCode: "USD" }` and `locale: "en-US"` prints `$48.00`; with `locale: "de-DE"` and `EUR` prints `48,00 €`.
3. Tier 5 (Liquid shim): `price: 4800` prints the shim's `money` output inside `<bdi>`.
4. Tier 5: the accessibility tree text of fixture `sale` is `Sale price $12.00 Regular price $16.00`.

### Evidence and UNVERIFIED

- Evidence: `hydrogen/packages/hydrogen/src/core/money/format.ts` (`formatMoney(money, options)`); `ripple/theme/blocks/price.liquid`; `ripple/theme/AGENTS.md` (money filters, `<bdi>`).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---

## ProductGallery

| Field | Value |
|---|---|
| Id | `product-gallery` |
| Kind | `native` |
| Category | `product` |
| Custom elements | `rp-carousel`, `rp-dialog` |
| Root element and class | `div` `.rp-product-gallery` |
| Liquid tier | `resource` |
| No-JS level | `degraded` |
| Requires `id` | yes |
| Depends on | `carousel`, `dialog`, `image`, `placeholder`, `icon-button`, `icon`, `visually-hidden` |
| Milestone | M3 |

### Purpose

The product page image gallery: a scroll-snap Carousel of product images, each of which opens a full-size lightbox Dialog.

- Use when: showing all images of one product on its page.
- Do not use when: showing one image (use Image) or a row of products (use Carousel with ProductCard).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `ProductGallery` | `blocks/product-gallery.liquid` | `div` | `rp-product-gallery` | none | yes | none |
| media (region part) | `ProductGalleryMedia` | `snippets/rp-product-gallery-media.liquid` | `div` | `rp-product-gallery-media` | `data-rp-region="rp-product-media"` | yes | none |
| carousel | printed by media | same | `rp-carousel` | `rp-carousel` | `data-slot="rp-carousel"` | yes | `<id>` |
| viewport | printed by media | same | `ul` | `rp-carousel-viewport` | `data-rp-part="viewport"` | yes | `<id>-list` |
| item | printed by media | same | `li` | `rp-carousel-item` | `data-rp-part="item"` | yes | none |
| zoom | printed by media | same | `a` | `rp-product-gallery-zoom` | `data-rp-open="<id>-content"` | yes (per image) | none |
| lightbox | printed by root | `blocks/product-gallery.liquid` | `rp-dialog` | `rp-dialog rp-product-gallery-lightbox` | `data-slot="rp-dialog"` | when there is at least one image | none |
| lightbox panel | printed by root | same | `dialog` | `rp-dialog-panel` | none | with lightbox | `<id>-content` |
| lightbox title | printed by root | same | `h2` | `rp-dialog-title rp-visually-hidden` | none | with lightbox | `<id>-content-title` |

Nesting rules: root has two children: the media region part, then the lightbox. The lightbox `rp-dialog` MUST be outside the region part (RS-7, D-046 item 5). The `id` prop is printed on the `rp-carousel`, not on root. `prev` and `next` buttons are children of `rp-carousel`, outside the viewport ([04-elements.md](04-elements.md) section 10.9).

### Props

Root (`ProductGallery`) and region part (`ProductGalleryMedia`) take the same props; root passes them on.

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on `rp-carousel`; derives `<id>-list`, `<id>-content`, `<id>-content-title` |
| `media` | `media` | object | `Array<{ id: string; image: RippleImage }>` / Liquid `product.media` | none | yes | no | one item per image |
| `variant` | `variant` | object | `RippleVariant` / Liquid `variant` drop | none | no | no | the item whose image is the variant's image is printed first |
| `ratio` | `ratio` | enum | `auto 1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9` | `1/1` | no | no | `data-ratio` on each carousel Image |
| `ariaLabel` | `aria_label` | string | text | `Product images` (locale key) | no | no | `aria-label` on `rp-carousel`; text of the lightbox title |

Order rule: items are printed in `media` order, except that when `variant` is set and one media image is the variant's image (TSX: `media[i].image.url === variant.image?.url`; Liquid: `media.id == variant.featured_media.id`), that item is moved to the first position. Non-image media are skipped in V1.

### Content model

`parts` - children (`{{ content }}`) replace the default rendering of the media region part (RS-2). Nothing else may be passed.

### HTML contract

Fixture `default` (`id`: `gallery`, `media`: media of `product.basic`):

```html
<div class="rp-product-gallery">
  <div class="rp-product-gallery-media" data-rp-region="rp-product-media">
    <rp-carousel class="rp-carousel" id="gallery" role="group" aria-roledescription="carousel" aria-label="Product images" data-slot="rp-carousel">
      <button class="rp-carousel-control" type="button" disabled aria-controls="gallery-list" aria-label="Previous" data-rp-part="prev" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
      <ul class="rp-carousel-viewport" id="gallery-list" tabindex="0" data-rp-part="viewport">
        <li class="rp-carousel-item" data-rp-part="item">
          <a class="rp-product-gallery-zoom" href="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=2000" data-rp-open="gallery-content"><img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1600 1600w" sizes="(min-width: 64rem) 50vw, 100vw" alt="Linen shirt on a hanger" width="1200" height="1200" loading="eager" fetchpriority="high" decoding="async" data-ratio="1/1" data-fit="cover" data-radius="none"><span class="rp-visually-hidden">View larger image</span></a>
        </li>
        <li class="rp-carousel-item" data-rp-part="item">
          <a class="rp-product-gallery-zoom" href="https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=2000" data-rp-open="gallery-content"><img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=1600 1600w" sizes="(min-width: 64rem) 50vw, 100vw" alt="Back of the linen shirt" width="1200" height="1200" loading="lazy" decoding="async" data-ratio="1/1" data-fit="cover" data-radius="none"><span class="rp-visually-hidden">View larger image</span></a>
        </li>
      </ul>
      <button class="rp-carousel-control" type="button" aria-controls="gallery-list" aria-label="Next" data-rp-part="next" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
    </rp-carousel>
  </div>
  <rp-dialog class="rp-dialog rp-product-gallery-lightbox" data-slot="rp-dialog">
    <dialog class="rp-dialog-panel" id="gallery-content" data-size="full" aria-labelledby="gallery-content-title" closedby="any">
      <h2 class="rp-dialog-title rp-visually-hidden" id="gallery-content-title">Product images</h2>
      <div class="rp-dialog-body">
        <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1600 1600w" sizes="100vw" alt="Linen shirt on a hanger" width="1200" height="1200" loading="lazy" decoding="async" data-ratio="auto" data-fit="contain" data-radius="none">
        <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=1600 1600w" sizes="100vw" alt="Back of the linen shirt" width="1200" height="1200" loading="lazy" decoding="async" data-ratio="auto" data-fit="contain" data-radius="none">
      </div>
      <button class="rp-icon-button" type="button" commandfor="gallery-content" command="close" data-variant="ghost" data-size="md" aria-label="Close"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </dialog>
  </rp-dialog>
</div>
```

Fixture `empty` (`id`: `gallery`, `media`: empty list):

```html
<div class="rp-product-gallery">
  <div class="rp-product-gallery-media" data-rp-region="rp-product-media">
    <div class="rp-placeholder" data-ratio="1/1" data-radius="none" aria-hidden="true"></div>
  </div>
</div>
```

Further required fixtures: `class` (root class `rp-product-gallery custom-a custom-b`); `invalid-enum-falls-back` (`ratio`: `9/9`; equals `default`); `escaping` (`ariaLabel`: `Say "hi" & <go>`; the `aria-label` attribute and the title text are escaped); `variant-first` (`variant` whose image is the second media image; the two `<li>` are swapped, the first printed image has `loading="eager" fetchpriority="high"`, and the lightbox images are swapped the same way).

Image rules: every image is the embedded Image of doc 09 (`src` at width 800 and the six-width `srcset`, printed by Image). Carousel images pass `sizes="(min-width: 64rem) 50vw, 100vw"` and `ratio` from the prop; the first printed image passes `loading="eager"` and `fetchPriority="high"`, the others `loading="lazy"` and no `fetchPriority`. Lightbox images pass `sizes="100vw"`, `ratio="auto"`, `fit="contain"`, `loading="lazy"`. The zoom `href` is the only URL the binding builds itself: `imageUrl(image.url, { width: 2000 })` from `<pkg>` (Liquid: `image | image_url: width: 2000`).

Host-owned regions and masks: no host-owned region. Masks: `{ "select": "img", "op": "attr", "name": "src" }`, `{ "select": "img", "op": "srcset", "name": "srcset" }`, `{ "select": "a.rp-product-gallery-zoom", "op": "attr", "name": "href" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `disabled` | `prev` button | server, then `rp-carousel` | scroll offset is at the start | present |
| `disabled` | `next` button | `rp-carousel` | scroll offset is at the end | absent |
| `open` | lightbox `dialog` | browser | lightbox open | absent |
| `aria-haspopup`, `aria-controls` | zoom links | runtime opener listener (D-009) | after upgrade | absent |
| `aria-busy` | media region part | commerce adapter | while region `rp-product-media` refreshes | absent |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "[data-rp-part=\"next\"]", "attrs": ["disabled"], "reason": "Whether all slides fit depends on layout." }` (from Carousel); the global entry for `a[data-rp-open]`.

### Behaviour with JavaScript

1. Carousel behaviour is that of `rp-carousel` ([04-elements.md](04-elements.md) section 9.2): previous / next buttons page the list; `indexchange` is dispatched on the `rp-carousel`.
2. An unmodified primary click on a zoom link opens the lightbox with `showModal()` and does not navigate (opener listener, [04-elements.md](04-elements.md) section 3.4). A modified click opens the full-size image in a new tab.
3. The lightbox shows every image at full width in one vertically scrolling column, starting at the first image. Scrolling to the clicked image is NOT done in V1.
4. The lightbox closes with the close button, Escape, or a press on the backdrop; `openchange` is dispatched on the `rp-dialog`.
5. When a VariantPicker refreshes region `rp-product-media`, the media region part is replaced; the new `rp-carousel` starts at its first item. The lightbox is not replaced.

### Behaviour without JavaScript

The image list scrolls and snaps by touch, trackpad and keyboard. The previous and next buttons are invisible but keep their space (`rp-carousel:not(:defined) [data-rp-js="inflow"]`). A zoom link navigates to the full-size image file (`noJs.fallbackHref`: the image URL). The lightbox is never shown. Missing: paging buttons, lightbox.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `indexchange` | `rp-carousel` | `{ value: number, reason: "next-press" \| "previous-press" \| "scroll" \| "imperative", source }` | `onIndexChange` |
| event | `openchange` | lightbox `rp-dialog` | `{ value: boolean, reason, source }` | `onOpenChange` |
| command | `close` | lightbox `dialog` | `commandfor="<id>-content"` | none |

### Accessibility

- Pattern: carousel (group with `aria-roledescription="carousel"`) plus native modal dialog; `checkPattern`: none.
- Accessible name: `aria-label` on the `rp-carousel` (prop `ariaLabel`); the lightbox is named by its visually hidden title. Each zoom link is named by the image `alt` followed by `View larger image`.
- Focus: opening the lightbox moves focus into the dialog (browser); closing returns focus to the zoom link that opened it.
- Announcements: None.

| Key | Action |
|---|---|
| ArrowRight / ArrowLeft on the focused viewport | scrolls the list (native) |
| Tab | moves through the zoom links |
| Enter on a zoom link | opens the lightbox |
| Escape in the lightbox | closes it |

### Styling

- File: `components/product-gallery/product-gallery.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--radius-surface`, `--color-background`, `--color-ring`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-product-gallery-gap` | `calc(var(--spacing) * 2)` | gap between slides |
| `--rp-product-gallery-radius` | `var(--radius-surface)` | corner radius of slides |
| `--rp-product-gallery-slide-size` | `100%` | inline size of one slide |
| `--rp-product-gallery-lightbox-max` | `80rem` | maximum inline size of lightbox images |

| Modifier selector | Sets |
|---|---|
| None. | |

Required rules: `.rp-product-gallery .rp-carousel-item { flex: 0 0 var(--rp-product-gallery-slide-size) }`; `.rp-product-gallery-zoom { display: block; cursor: zoom-in }`; `.rp-product-gallery-lightbox .rp-dialog-body { display: grid; gap: var(--rp-product-gallery-gap); justify-items: center; overflow-y: auto }`.

### Host notes

- HTML: None.
- React: `ProductGallery(props: { id: string; media: RippleMedia[]; variant?: RippleVariant | null; ratio?: Ratio; ariaLabel?: string; onIndexChange?: (value: number, detail: object) => void; onOpenChange?: (value: boolean, detail: object) => void; className?: string; children?: ReactNode })` where `RippleMedia` is imported as a type from `<pkg>` ([05-commerce.md](05-commerce.md) section 11.1, D-094); this component reads its fields `id: string` and `image: RippleImage`. The file starts with `"use client"` because it calls `useElement` for the two callbacks (R-4). `ProductGalleryMedia` is exported from the same file. The carousel is the embedded Carousel (controls `rp-carousel-control`, doc 10). The lightbox composes Dialog by contract (D-070; class pairs `rp-dialog rp-product-gallery-lightbox` and `rp-dialog-title rp-visually-hidden`, section 0.2): the binding prints the `rp-dialog`, the `<dialog class="rp-dialog-panel">`, the title and the body itself; the close button is the embedded IconButton. Manifest `dependencies.components`: `carousel`, `dialog`, `image`, `placeholder`, `icon-button`, `icon`, `visually-hidden`.
- Remix: `data-rmx-key="<id>"` on the `rp-carousel` and `data-rmx-key="<id>-content"` on the `rp-dialog`; the `prev` and `next` buttons print `data-rmx-preserve-attrs="disabled"`; the `dialog` prints `data-rmx-preserve-attrs="open"`.
- Liquid: the block prints root and lightbox and renders `rp-product-gallery-media` as its default body. Media loop: `{% for item in media %}{% if item.media_type == 'image' %}` reading `item.preview_image` and `item.alt`. No schema settings. Locale keys: `ripple.product-gallery.label` = `Product images`; `ripple.product-gallery.zoom` = `View larger image`; `ripple.product-gallery.previous` = `Previous`; `ripple.product-gallery.next` = `Next`; `ripple.product-gallery.close` = `Close`.

```tsx
<ProductGallery id="gallery" media={product.media.nodes.filter((m) => m.__typename === "MediaImage")} variant={variant} />
```

```liquid
{% block 'product-gallery', id: 'gallery', media: product.media, variant: product.selected_or_first_available_variant %}
  {% partial 'rp-product-media' %}{% render 'rp-product-gallery-media', id: 'gallery', media: product.media, variant: product.selected_or_first_available_variant %}{% endpartial %}
{% endblock %}
```

### Commerce

None. (The region `rp-product-media` is refreshed by VariantPicker; ProductGallery binds no store.)

### Agent surface

`bridge` for the two elements: `rp-carousel` actions `next`, `previous`, `goTo`; `rp-dialog` actions `open`, `close` ([04-elements.md](04-elements.md) section 12). Confirm: none. Secret: none.

### Checker rules

RP104 (`id`, `media`), RP114 (derived ids), RP203 (every image), RP302 (zoom link has `href`), RP308 and RP404 (the lightbox dialog is not inside a region or a partial), RP403 (Liquid: partial `rp-product-media` declared when a VariantPicker names it). Manifest `rules[]`: `product-gallery-lightbox-outside-region` (`forbids-descendant`, selector `.rp-product-gallery-media`, target `dialog`).

### Acceptance tests

1. Tier 2: fixtures `default`, `empty`, `class`, `invalid-enum-falls-back`, `escaping`, `variant-first` are canonical-equal in all four hosts with the masks above.
2. Tier 3: zero mutations at upgrade outside the allow-list.
3. Tier 5: clicking the second zoom link opens `#gallery-content` (`dialog.open === true`), the URL does not change, and Escape closes it and returns focus to that link.
4. Tier 5: pressing `next` scrolls the viewport and dispatches `indexchange` with `value: 1`.
5. Tier 6: with scripting disabled, a click on a zoom link navigates to a URL ending in `width=2000`.
6. Tier 5: after `getCommerce().refresh(["rp-product-media"], { url })` the lightbox `dialog` element is the same node as before.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/04-elements.md` sections 9.1, 9.2, 10.9; `ripple/theme/assets/s-product-image-zoom.js`; `ripple/theme/templates/product.liquid`; ledger D-016, D-009.
- UNVERIFIED: Liquid `variant.featured_media.id` and `media.preview_image` on the preview store (tier 8); Storefront API `media` selection of `RippleProductDetail`.

### Fallback (SPIKE-nn)

None.

---

## ProductForm

| Field | Value |
|---|---|
| Id | `product-form` |
| Kind | `commerce` |
| Category | `product` |
| Custom elements | `rp-product-form` |
| Root element and class | `rp-product-form` `.rp-product-form` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes |
| Depends on | `add-to-cart-button`, `quantity-input`, `form-message` |
| Milestone | M3 |

### Purpose

The add-to-cart form for one product variant. It posts natively; with JavaScript the cart store handles the submit and the cart opens.

- Use when: selling one product (product page, quick add).
- Do not use when: choosing a variant (use VariantPicker as a sibling, before the form) or changing a line already in the cart (use CartLines).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `ProductForm` | `blocks/product-form.liquid` | `rp-product-form` | `rp-product-form` | `data-slot="rp-product-form"` | yes | none |
| fields | printed by root | same | `form` | `rp-product-form-fields` | none | yes | `<id>` |
| variant field | printed by root | same | `input type="hidden"` | none | `data-rp-field="merchandise-id"` | yes | none |
| quantity | printed by root (default body) | same | `div` | `rp-product-form-quantity` | none | no | none |
| accelerated | printed by root | same | `div` | `rp-product-form-accelerated` | `data-agent-confirm` | when `acceleratedCheckout` | none |
| error | printed by root | same | `p` | `rp-form-message` | `data-rp-part="error"` | yes | none |

Nesting rules: fields is the only child of root. Children of fields in this order: variant field, body (default body or the caller's children), accelerated, error. The body MUST contain exactly one AddToCartButton. A VariantPicker MUST NOT be inside a ProductForm (a GET form cannot be nested in the add form). The `id` prop is printed on the `<form>`, not on root.

Default body (printed when the caller passes no children): the quantity part containing one QuantityInput (`name` from the dialect, `defaultValue` 1, `min` 1, `step` 1, `ariaLabel` from locale key `ripple.product-form.quantity`), then one AddToCartButton with `fullWidth`, `disabled` when the variant is missing or not available.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on the `<form>` |
| `product` | `product` | object | `RippleProduct & { selectedOrFirstAvailableVariant?: RippleVariant \| null }` / Liquid `product` drop | none | yes | no | default variant; Liquid `{% form 'product', product %}` |
| `variant` | `variant` | object | `RippleVariant` / Liquid `variant` drop | TSX: `product.selectedOrFirstAvailableVariant`; Liquid: `product.selected_or_first_available_variant` | no | no | `value` of the variant field; availability of the default body |
| `acceleratedCheckout` | `accelerated_checkout` | boolean | `true false` | `false` | no | no | the accelerated part (opaque platform markup, D-050) |
| `action` | none | url | route of `createCartServerHandlers()` | `/api/cart` | no | no | `action` on the `<form>`; TSX hosts only (Liquid: `routes.cart_add_url`, printed by `{% form %}`) |

### Content model

`flow` - form controls and exactly one AddToCartButton. Children replace the default body. Any named control in the body is posted with the form (line attributes: `attributes.<key>` on the hydrogen backend, `properties[<key>]` on Liquid).

### HTML contract

Fixture `default` (`id`: `pf`, `product`: `product.basic`; no children):

```html
<rp-product-form class="rp-product-form" data-slot="rp-product-form">
  <form class="rp-product-form-fields" id="pf" method="post" action="/api/cart">
    <input type="hidden" name="merchandiseId" value="gid://shopify/ProductVariant/11" data-rp-field="merchandise-id">
    <div class="rp-product-form-quantity">
      <rp-quantity class="rp-quantity" data-size="md" data-slot="rp-quantity">
        <button class="rp-quantity-button" type="button" disabled aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
        <input class="rp-quantity-input" type="number" inputmode="numeric" name="quantity" min="1" step="1" value="1" aria-label="Quantity" data-rp-part="input" data-rp-field="quantity">
        <button class="rp-quantity-button" type="button" aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
      </rp-quantity>
    </div>
    <button class="rp-button rp-add-to-cart-button" type="submit" name="intent" value="add" data-variant="primary" data-size="md" data-full-width="" data-rp-part="submit">Add to cart</button>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  </form>
</rp-product-form>
```

Fixture `children` (`id`: `pf`, `product`: `product.basic`; children: the reference HTML of AddToCartButton `default`):

```html
<rp-product-form class="rp-product-form" data-slot="rp-product-form">
  <form class="rp-product-form-fields" id="pf" method="post" action="/api/cart">
    <input type="hidden" name="merchandiseId" value="gid://shopify/ProductVariant/11" data-rp-field="merchandise-id">
    <button class="rp-button rp-add-to-cart-button" type="submit" name="intent" value="add" data-variant="primary" data-size="md" data-rp-part="submit">Add to cart</button>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  </form>
</rp-product-form>
```

Fixture `sold-out` (`id`: `pf`, `product`: `product.sold-out`; no children): as `default` with `value="gid://shopify/ProductVariant/31"` on the variant field, and the AddToCartButton printed as:

```html
<button class="rp-button rp-add-to-cart-button" type="submit" name="intent" value="add" data-variant="primary" data-size="md" data-full-width="" data-rp-part="submit" disabled>Sold out</button>
```

Fixture `accelerated` (`id`: `pf`, `product`: `product.basic`, `acceleratedCheckout`: true): as `default` with this element between the AddToCartButton and the error part (children shown for the hydrogen backend):

```html
<div class="rp-product-form-accelerated" data-agent-confirm="Buys this product now with an express checkout"><hydrogen-shop-pay-button></hydrogen-shop-pay-button></div>
```

Further required fixtures: `class` (root class `rp-product-form custom-a custom-b`).

What Liquid prints for `default` (shape of `{% form 'product' %}` from `ripple/docs/research/liquid-blocks-partials.md` section 2.6): the `<form>` has `action="/cart/add"`, `accept-charset="UTF-8"`, `enctype="multipart/form-data"` and two extra hidden inputs (`form_type`, `utf8`); the variant field is `<input type="hidden" name="id" value="11" data-rp-field="merchandise-id">`; the AddToCartButton has `name="add"` and no `value`.

Host-owned regions and masks: the form dialect (D-043) and the accelerated part (D-004). Masks, in this order:

```json
[
  { "select": "form.rp-product-form-fields", "op": "attr", "name": "action" },
  { "select": "form.rp-product-form-fields", "op": "drop-attr", "name": "accept-charset" },
  { "select": "form.rp-product-form-fields", "op": "drop-attr", "name": "enctype" },
  { "select": "form.rp-product-form-fields > input[type=\"hidden\"]:not([data-rp-field])", "op": "remove" },
  { "select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "name" },
  { "select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "value" },
  { "select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "name" },
  { "select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "value" }
]
```

Fixture `accelerated` adds `{ "select": ".rp-product-form-accelerated", "op": "children" }`. The two `drop-attr` masks on the form and the `remove` mask match only Liquid output; `drop-attr` and `remove` masks are exempt from rule F-19 of doc 02 (D-074). None of these masks targets a Ripple-owned attribute or class.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-pending` | root | element | from submit until the add settles | absent |
| `aria-busy` | root | element | same | absent |
| `hidden` | error part | element | removed when an add fails; set when a new submit starts | present |
| text | error part | element | the error message | empty |
| `disabled` | AddToCartButton | server | variant missing or not available | per variant |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-product-form [data-rp-part=\"error\"]", "attrs": ["hidden"], "text": true, "reason": "The element fills the error text and removes hidden when an add fails (D-045, D-071 item 3)." }` (the commerce error-part entry fixed by D-071 item 3; the manifest entry in `07-manifest-registry-cli.md` is equal). The element writes nothing at upgrade; the entry covers an add that fails while the element upgrades.

### Behaviour with JavaScript

1. On `submit` of the form, when `getCommerce().usable` is true and the submitter is `null` or matches `[data-rp-part="submit"]`: `preventDefault()`; a second submit while `data-pending` is present is ignored.
2. The root gets `data-pending=""` and `aria-busy="true"`; the error part is emptied and hidden.
3. The form is sent through `getCommerce().submitCart(form, submitter, event)`.
4. On success: `Added to cart` is announced; `action` is dispatched on the root; unless a listener calls `preventDefault()`, `getCommerce().openCart()` opens the CartDrawer (or navigates to the cart page when no drawer exists).
5. On failure: the error part shows the message and loses `hidden`; nothing is announced through `announce()` (the part has `role="alert"`).
6. `data-pending` and `aria-busy` are removed in both cases.
7. A submit by a control without `data-rp-part="submit"` (the accelerated checkout buttons) is NOT intercepted.
8. The full sequence is specified in [05-commerce.md](05-commerce.md) section 7.2.

### Behaviour without JavaScript

The form posts natively: hydrogen backend to `/api/cart` (303 back to the product page); Liquid to `routes.cart_add_url` (the platform's response). The variant sent is the one the server rendered for the current URL (D-047). In the default body the quantity stepper buttons are invisible; the number input works. Nothing else is missing.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `action` | `rp-product-form` (cancelable; cancel to keep the cart closed) | `{ value: "add", reason: "submit", merchandiseId: string, quantity: number }` | `onAction` |
| method | `api.add()` | `rp-product-form` | none; same path as submitting the form | none |
| method | `api.setQuantity(quantity)` | `rp-product-form` | `quantity: number`; writes the `[data-rp-field="quantity"]` control | none |

### Accessibility

- Pattern: native form; `checkPattern`: none.
- Accessible name: none required for the form. Every control in the body MUST have its own name.
- Focus: stays on the submit button after an add; when the CartDrawer opens, the browser moves focus into the dialog.
- Announcements: `Added to cart` (key `ripple.product-form.added`) after a confirmed add; the error text through the `role="alert"` part.

| Key | Action |
|---|---|
| Enter in a field | submits the form (add to cart) |

### Styling

- File: `components/product-form/product-form.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--rp-duration-base`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-product-form-gap` | `calc(var(--spacing) * 4)` | block gap between children of the form |

| Modifier selector | Sets |
|---|---|
| `.rp-product-form[data-pending]` | `--_opacity: 0.7` (consumed by the submit button's `opacity`) |

Required rules: `.rp-product-form-fields { display: flex; flex-direction: column; gap: var(--rp-product-form-gap) }`. The root `rp-product-form` is a block box: `base.css` carries `rp-product-form { display: block }` (generated; D-021, D-080). `product-form.css` MUST NOT set `display: contents` or `display: none` on the root.

### Host notes

- HTML: use the hydrogen dialect of the fixture; `action` MUST be the cart endpoint.
- React: `ProductForm(props: { id: string; product: ProductFormProduct; variant?: RippleVariant | null; acceleratedCheckout?: boolean; action?: string; onAction?: (value: "add", detail: { merchandiseId: string; quantity: number }) => void; className?: string; children?: ReactNode })`. `suppressHydrationWarning` on the root, the form and the error part ([06-bindings.md](06-bindings.md) section 6.7). The accelerated part is `<div className="rp-product-form-accelerated" data-agent-confirm={strings?.agentConfirmAccelerated ?? "Buys this product now with an express checkout"} dangerouslySetInnerHTML={{ __html: renderShopPayButton({ variants: [{ id: variant.id, quantity: 1 }], disabled: !variant.availableForSale }) }} />` with `renderShopPayButton` from `@shopify/hydrogen` (`hydrogen/packages/hydrogen/src/core/shop-pay/shop-pay.ts`; a value import allowed by D-094, CV-9); `strings?: { added?: string; quantity?: string; agentConfirmAccelerated?: string }` is a prop (CV-2); it is not printed when there is no variant.
- Remix: `data-rmx-key="<id>"` on the root; `data-rmx-document` on the `<form>`; `data-rmx-preserve-attrs="hidden"` on the error part; `data-rmx-preserve-attrs="data-pending aria-busy"` on the root ([06-bindings.md](06-bindings.md) section 7.7).
- Liquid: `{% form 'product', product, id: id, class: 'rp-product-form-fields' %}`; variant field `name="id" value="{{ variant.id }}"`; the default body calls `{% render 'rp-quantity-input' %}` and `{% render 'rp-add-to-cart-button' %}`; the accelerated part is `<div class="rp-product-form-accelerated" data-agent-confirm="{{ 'ripple.product-form.agent_confirm_accelerated' | t }}">{{ form | payment_button }}</div>` (the `payment_button` filter is in the component scope of the Liquid subset, D-097). The root `rp-product-form` is printed by the binding and prints `{{ attributes }}` last (D-035); the fields part is printed by `{% form %}` and accepts only `id` and `class` (D-091 item 6). A caller-supplied body is rendered before the block runs and cannot read `form`. No schema settings. Locale keys: `ripple.product-form.added` = `Added to cart`; `ripple.product-form.quantity` = `Quantity`; `ripple.product-form.agent_confirm_accelerated` = `Buys this product now with an express checkout`.

```tsx
<ProductForm id="buy" product={product} acceleratedCheckout />
```

```liquid
{% block 'product-form', id: 'buy', product: product, accelerated_checkout: true %}{% endblock %}
```

### Commerce

- Store fields read: `cart.getState().errors` (through `errorMessage(state, "cart")`).
- Adapter methods called: `submitCart`, `openCart`, `usable`.
- Regions refreshed: none declared by this component. The cart regions named by the `rp-cart` roots on the page are refreshed by the adapter when the store settles ([05-commerce.md](05-commerce.md) section 8.4). The root MUST NOT carry `data-rp-refresh`.
- Pending and error behaviour: as in "State and attributes".

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Form | `<form method="post" action="/api/cart">` | `{% form 'product', product %}` (action `routes.cart_add_url`) |
| Variant | `merchandiseId` = variant gid | `id` = numeric variant id |
| Quantity | `quantity` | `quantity` |
| Selling plan (no V1 UI; pass-through) | `sellingPlanId`, `disabled` when empty | `selling_plan`, `disabled` when empty |
| Line attribute | `attributes.<key>` | `properties[<key>]` |
| Submit | `name="intent" value="add"` | `name="add"` |

### Agent surface

`bridge`; component `rp-product-form`; manifest `agent.actions`: `["setQuantity", "add"]` ([08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.2, D-095): `setQuantity(quantity: number): void` sets the quantity field; `add(): void` submits the form ("Add the selected variant to the cart"). Confirm: none on the root. In fixture `accelerated` the wrapper `.rp-product-form-accelerated` carries `data-agent-confirm="Buys this product now with an express checkout"` (doc 08 section 7.3; locale key `ripple.product-form.agent_confirm_accelerated`). Secret: none.

### Checker rules

RP104 (`id`, `product`), RP301, RP305 (dialect fields), RP110. Manifest `rules[]`: `product-form-one-submit` (`requires-descendant`, selector `:scope`, target `button[type="submit"][data-rp-part="submit"]`; "A ProductForm has no AddToCartButton, so nothing can be added to the cart."); `product-form-single-submit` (`max-count`, selector `[data-rp-part="submit"]`, count 1). The rule `variant-picker-outside-form`, which reports a VariantPicker inside a ProductForm, is defined once, in VariantPicker's manifest.

### Acceptance tests

1. Tier 2: fixtures `default`, `children`, `sold-out`, `accelerated`, `class` are canonical-equal in all four hosts with the masks above.
2. Tier 3: zero mutations at upgrade.
3. Tier 5: tests C-02 and C-07 of [05-commerce.md](05-commerce.md) section 14 (add payload, pending attributes, `action` detail, cart opens, non-submit-part submitter posts natively).
4. Tier 5: a listener that cancels `action` keeps `#cart-drawer` closed.
5. Tier 5: a failing add shows the message in the error part (`hidden` removed) and announces nothing.
6. Tier 6 and 7 (mock.shop): with scripting disabled, submitting the form adds the variant and the next page shows the cart count increased by the quantity.
7. Tier 4 (React): hydration with either script order logs no hydration error.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/05-commerce.md` sections 6.2, 7.2; `ripple/docs/06-bindings.md` sections 6.7, 7.7, 8.7; `ripple/docs/research/spikes/commerce/result.txt` (L2, D1, D2); `hydrogen/packages/hydrogen/src/core/cart/actions.ts` (form intent `add`); `hydrogen/packages/hydrogen/src/core/shop-pay/shop-pay.ts` (`renderShopPayButton`).
- UNVERIFIED: the real Standard Actions runtime (SPIKE-01); `{{ form | payment_button }}` output inside the Liquid developer preview (tier 8).

### Fallback (SPIKE-nn)

None. (SPIKE-01 changes only `adapter-liquid.ts`; this contract is unaffected.)

---

## VariantPicker

| Field | Value |
|---|---|
| Id | `variant-picker` |
| Kind | `commerce` |
| Category | `product` |
| Custom elements | `rp-live` |
| Root element and class | `rp-live` `.rp-variant-picker` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes |
| Depends on | `swatch`, `select`, `label`, `button`, `visually-hidden` |
| Milestone | M3 |

### Purpose

Lets the buyer choose a product variant. Every option value is a link (or a GET form with a select) to the URL of the resulting variant, so selection works without JavaScript; with JavaScript the product regions refresh in place.

- Use when: a product has more than one variant.
- Do not use when: choosing something that is not a product option; use RadioGroup or Select.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `VariantPicker` | `blocks/variant-picker.liquid` | `rp-live` | `rp-variant-picker` | `data-slot="rp-live"`, `data-rp-refresh` | yes | `<id>` |
| option | printed by root | same | `div` (layouts `auto`, `buttons`) or `form` (layout `dropdown`) | `rp-variant-picker-option` | none | one per product option | none |
| legend | printed by root | same | `p` | `rp-variant-picker-legend` | none | layouts `auto`, `buttons` | none |
| selected | printed by root | same | `span` | `rp-variant-picker-selected` | none | inside legend | none |
| values | printed by root | same | `div` | `rp-variant-picker-values` | none | layouts `auto`, `buttons` | none |
| value | printed by root | same | `a` (variant exists) or `span` (variant does not exist) | `rp-variant-picker-value` | none | one per option value | link: `<id>-item-<o>-<v>` |
| label | printed by root | same | `span` | `rp-variant-picker-label` | none | inside value | none |

`<o>` is the 1-based position of the option, `<v>` the 1-based position of the value. In layout `dropdown` the `<select>` has id `<id>-item-<o>`.

Nesting rules: options are the only children of root. A VariantPicker MUST be a sibling of ProductForm, never inside it. For in-place refresh it MUST be inside region `rp-product-buy` (declared by the blueprint), so that the selected state is re-rendered. When the product has only one variant (TSX: every option has exactly one value; Liquid: `product.has_only_default_variant`), the component prints NOTHING.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on root; derives value ids |
| `product` | `product` | object | `RippleProductDetail` ([05-commerce.md](05-commerce.md) 11.1; the fields `url`, `options`, `selectedOrFirstAvailableVariant`, `adjacentVariants` are read) / Liquid `product` drop | none | yes | no | options and values |
| `layout` | `layout` | enum | `auto buttons dropdown` | `auto` | no | no | `data-layout` on root |
| `refresh` | `refresh` | string | region names | `rp-product-buy rp-product-media` | no | no | `data-rp-refresh` on root |
| `search` | none | string | the current query string without `?` | empty string | no | no | base of value URLs (keeps unrelated params); TSX hosts only |

Layout rules: `buttons`: every value is a text button-like link. `auto`: an option whose values ALL have swatch data (a colour or an image) prints Swatches and carries `data-swatch=""` on each value; every other option prints as `buttons`. `dropdown`: every option is a GET form with a select.

### Content model

`none` - the component prints everything from `product`. Liquid: `{{ content }}`, when not blank, replaces every child of the root (CV-6).

### HTML contract

Fixture `default` (`id`: `vp`, `product`: `product.options`; hydrogen backend URLs):

```html
<rp-live class="rp-variant-picker" data-slot="rp-live" id="vp" data-layout="auto" data-rp-refresh="rp-product-buy rp-product-media">
  <div class="rp-variant-picker-option" role="group" aria-label="Color">
    <p class="rp-variant-picker-legend" aria-hidden="true">Color: <span class="rp-variant-picker-selected">Blue</span></p>
    <div class="rp-variant-picker-values">
      <a class="rp-variant-picker-value" id="vp-item-1-1" href="/products/linen-shirt?Color=Blue&amp;Size=S" aria-current="true" data-swatch=""><span class="rp-swatch" data-size="md" data-radius="full" aria-hidden="true" style="--rp-swatch-fill:#1d4ed8"></span><span class="rp-variant-picker-label">Blue</span></a>
      <a class="rp-variant-picker-value" id="vp-item-1-2" href="/products/linen-shirt?Color=Sand&amp;Size=S" data-swatch="" data-sold-out=""><span class="rp-swatch" data-size="md" data-radius="full" aria-hidden="true" style="--rp-swatch-fill:#d6c7a1"></span><span class="rp-variant-picker-label">Sand</span><span class="rp-visually-hidden">(Sold out)</span></a>
    </div>
  </div>
  <div class="rp-variant-picker-option" role="group" aria-label="Size">
    <p class="rp-variant-picker-legend" aria-hidden="true">Size: <span class="rp-variant-picker-selected">S</span></p>
    <div class="rp-variant-picker-values">
      <a class="rp-variant-picker-value" id="vp-item-2-1" href="/products/linen-shirt?Color=Blue&amp;Size=S" aria-current="true"><span class="rp-variant-picker-label">S</span></a>
      <a class="rp-variant-picker-value" id="vp-item-2-2" href="/products/linen-shirt?Color=Blue&amp;Size=M"><span class="rp-variant-picker-label">M</span></a>
      <span class="rp-variant-picker-value" data-disabled=""><span class="rp-variant-picker-label">L</span><span class="rp-visually-hidden">(Unavailable)</span></span>
    </div>
  </div>
</rp-live>
```

Fixture `dropdown` (`id`: `vp`, `product`: `product.options`, `layout`: `dropdown`):

```html
<rp-live class="rp-variant-picker" data-slot="rp-live" id="vp" data-layout="dropdown" data-rp-refresh="rp-product-buy rp-product-media">
  <form class="rp-variant-picker-option" method="get" action="/products/linen-shirt">
    <label class="rp-label" for="vp-item-1">Color</label>
    <select class="rp-select" data-size="md" id="vp-item-1" name="variant">
      <option value="11" selected>Blue</option>
      <option value="13">Sand (Sold out)</option>
    </select>
    <button class="rp-button" type="submit" data-variant="outline" data-size="md" data-rp-js="fallback">Apply</button>
  </form>
  <form class="rp-variant-picker-option" method="get" action="/products/linen-shirt">
    <label class="rp-label" for="vp-item-2">Size</label>
    <select class="rp-select" data-size="md" id="vp-item-2" name="variant">
      <option value="11" selected>S</option>
      <option value="12">M</option>
      <option value="" disabled>L (Unavailable)</option>
    </select>
    <button class="rp-button" type="submit" data-variant="outline" data-size="md" data-rp-js="fallback">Apply</button>
  </form>
</rp-live>
```

Fixture `single-variant` (`id`: `vp`, `product`: `product.basic`): the output is the empty string.

Further required fixtures: `buttons` (`layout`: `buttons`; as `default` but the two Color values have no `data-swatch` attribute and no Swatch child); `class`; `invalid-enum-falls-back` (`layout`: `grid`; equals `default`); `escaping` (`refresh`: `Say "hi" & <go>`; `data-rp-refresh="Say &quot;hi&quot; &amp; &lt;go&gt;"`).

Per-value rules (all layouts):

| Condition | Layouts `auto`, `buttons` | Layout `dropdown` |
|---|---|---|
| value is selected | `aria-current="true"` on the link | `selected` on the `<option>` |
| variant exists and is available | link with `href` | `<option value="<numeric variant id>">` |
| variant exists, not available | link with `href`, `data-sold-out=""`, and `<span class="rp-visually-hidden">(Sold out)</span>` | option text suffixed with ` (Sold out)`; still selectable |
| variant does not exist | `<span>` with `data-disabled=""`, no `id`, no `href`, and `<span class="rp-visually-hidden">(Unavailable)</span>` | `<option value="" disabled>` with text suffixed ` (Unavailable)` |

"The variant" of a value is the variant reached by replacing, in the current selection, this option's value with that value.

Host-owned regions and masks: value URLs differ by backend (hydrogen: option params such as `?Color=Sand&Size=S`; Liquid: `value.variant.url`, such as `?variant=13`). Masks: `{ "select": "a.rp-variant-picker-value", "op": "attr", "name": "href" }`. Nothing else is masked; in layout `dropdown` both backends print the numeric variant id as the option value.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `aria-current` | value link | server | value is selected | `true` or absent |
| `data-sold-out` | value | server | variant exists and is not available | `""` or absent |
| `data-disabled` | value `span` | server | variant does not exist | `""` |
| `data-swatch` | value | server | the option prints Swatches | `""` or absent |
| `data-pending`, `aria-busy` | root | `rp-live` | while the regions refresh | absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. An unmodified primary click on a value link calls `preventDefault()`, sets `data-pending=""` and `aria-busy="true"` on the root, and calls `getCommerce().refresh(["rp-product-buy", "rp-product-media"], { url: link.href, reason: "variant" })`.
2. Because every region name starts with `rp-product-`, the URL is written with `history.replaceState` (no new history entry).
3. In layout `dropdown`, a `change` on a select submits its form through `rp-live`; the URL is the form action plus `?variant=<id>`.
4. After the refresh the VariantPicker (inside `rp-product-buy`) is new markup; focus is restored to the element with the same `id` ([05-commerce.md](05-commerce.md) section 8.2 step 9).
5. When the refresh fails, the browser navigates to the URL.
6. Modified clicks, and every click when `usable` is false, navigate natively.

### Behaviour without JavaScript

Value links navigate to the variant URL; the server renders the page for that variant. In layout `dropdown` each option has an `Apply` submit button (`data-rp-js="fallback"`, hidden once `rp-live` is defined). Nothing is missing.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `rp:refresh` | `document` (dispatched by the adapter) | `{ regions, url, reason: "variant" }` | none |
| event | `rp:refreshed` | `document` | `{ regions, ok }` | none |

### Accessibility

- Pattern: a group of links per option with `aria-current` on the selected link (`hydrogen/packages/hydrogen/skills/hydrogen-variant-form/SKILL.md`: links, not radios); layout `dropdown`: native select with a label. `checkPattern`: none.
- Accessible name: each option group is named by `aria-label` (the option name); each value by its label text, plus `(Sold out)` or `(Unavailable)`. Swatch values keep the label in the DOM; CSS hides it visually.
- Focus: stays on the activated value after the refresh (restored by `id`).
- Announcements: None in V1; the selected value is exposed through `aria-current`.

| Key | Action |
|---|---|
| Tab | moves through the value links |
| Enter | selects the value |

### Styling

- File: `components/variant-picker/variant-picker.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--spacing-control-md`, `--radius-control`, `--color-border`, `--color-foreground`, `--color-background`, `--color-primary`, `--color-primary-foreground`, `--color-muted-foreground`, `--color-accent`, `--color-ring`, `--text-sm`, `--rp-duration-fast`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-variant-picker-gap` | `calc(var(--spacing) * 4)` | block gap between options |
| `--rp-variant-picker-value-gap` | `calc(var(--spacing) * 2)` | gap between values |
| `--rp-variant-picker-value-height` | `var(--spacing-control-md)` | block size of a text value |
| `--rp-variant-picker-radius` | `var(--radius-control)` | corner radius of a text value |

| Modifier selector | Sets |
|---|---|
| `.rp-variant-picker-value[aria-current="true"]` | `--_bg: var(--color-primary); --_fg: var(--color-primary-foreground); --_border: var(--color-primary)` |
| `.rp-variant-picker-value[data-sold-out]` | `--_fg: var(--color-muted-foreground)` and a diagonal line drawn with a background gradient |
| `.rp-variant-picker-value[data-disabled]` | `--_fg: var(--color-muted-foreground); --_border: transparent`; `cursor: not-allowed` |
| `.rp-variant-picker-value[data-swatch]` | `--_bg: transparent; --_border: transparent`; the label is clipped with the VisuallyHidden technique; a selected swatch value gets a 2px ring in `--color-foreground` |

Required rules: `base.css` carries `rp-live { display: block }` (generated). Every value has a minimum target size of 24 by 24 CSS px (D-066). Hover styles inside `@media (hover: hover)`.

### Host notes

- HTML: None.
- React: `VariantPicker(props: { id: string; product: VariantPickerProduct; layout?: "auto" | "buttons" | "dropdown"; refresh?: string; search?: string; className?: string })`. No hook. The component calls the pure function `variantPickerOptions`, which lives with its types in `variant-picker.data.ts` (CV-10; the binding imports `./variant-picker.data`, blueprints import `@components/variant-picker.data`); the app passes a `RippleProductDetail` (mapped from the fragment `RippleProductDetail`; its `url` is computed by the host).
- Remix: `data-rmx-key="<id>"` on the root; `data-rmx-preserve-attrs="data-pending aria-busy"` on the root.
- Liquid: loop `product.options_with_values`; per value: `exists` is `value.variant != blank`; sold out is `value.variant.available == false`; URL is `value.product_url` when not blank, otherwise `value.variant.url`; selected is `value.selected`; swatch is `value.swatch`. `auto` test per option: every value has `value.swatch != blank`. Layout `dropdown`: `action="{{ product.url }}"`, `<option value="{{ value.variant.id }}">`. One schema setting: `layout` (`select`). Locale keys: `ripple.variant-picker.sold_out` = `(Sold out)`; `ripple.variant-picker.unavailable` = `(Unavailable)`; `ripple.variant-picker.apply` = `Apply`. In layout `dropdown` the option text is `<name> <string>`.

`components/variant-picker/react/variant-picker.data.ts` and `components/variant-picker/remix/variant-picker.data.ts` MUST contain exactly this code (manifest file key `data`; no `"use client"`). `buildProductSelectionSearchParams` is one of the seven value imports of D-094. The option shapes are defined once, in [05-commerce.md](05-commerce.md) section 11.1, and imported from `<pkg>` (D-094): the input is the four fields of `RippleProductDetail` that the alias `VariantPickerProduct` picks (`RippleProductOption`, `RippleProductOptionValue` and `RippleVariant` are their member types), and the output is `RippleVariantOption[]` (values `RippleVariantOptionValue`). This file declares no interface of its own.

```ts
import { buildProductSelectionSearchParams } from "@shopify/hydrogen";
import type { RippleProductDetail, RippleVariantOption } from "__PKG__";

/** The fields of RippleProductDetail that the picker reads (05-commerce.md section 11.1). */
export type VariantPickerProduct = Pick<RippleProductDetail, "url" | "options" | "selectedOrFirstAvailableVariant" | "adjacentVariants">;

export function variantPickerOptions(product: VariantPickerProduct, search = ""): RippleVariantOption[] {
  const selected = product.selectedOrFirstAvailableVariant;
  const current = selected ? selected.selectedOptions : [];
  const candidates = selected ? [selected, ...product.adjacentVariants] : product.adjacentVariants;
  const optionNames = product.options.map((option) => option.name);
  return product.options.map((option) => {
    const selectedValue = current.find((entry) => entry.name === option.name)?.value ?? null;
    return {
      name: option.name,
      selectedValue,
      values: option.optionValues.map((value) => {
        const target = optionNames.map((name) => ({
          name,
          value: name === option.name ? value.name : (current.find((entry) => entry.name === name)?.value ?? ""),
        }));
        const variant =
          candidates.find((candidate) =>
            target.every((wanted) =>
              candidate.selectedOptions.some((have) => have.name === wanted.name && have.value === wanted.value),
            ),
          ) ?? null;
        const query = buildProductSelectionSearchParams({
          selectedOptions: target,
          optionNames,
          base: new URLSearchParams(search),
        }).toString();
        return {
          name: value.name,
          selected: value.name === selectedValue,
          exists: variant !== null,
          available: variant !== null && variant.availableForSale,
          url: variant === null ? null : `${product.url}${query ? `?${query}` : ""}`,
          variantId: variant === null ? null : variant.id.slice(variant.id.lastIndexOf("/") + 1),
          swatch: value.swatch
            ? { color: value.swatch.color ?? null, image: value.swatch.image?.previewImage ?? null }
            : null,
        };
      }),
    };
  });
}
```

The component prints nothing when `product.options.every((option) => option.optionValues.length <= 1)`.

```tsx
<VariantPicker id="options" product={product} search={url.searchParams.toString()} />
```

```liquid
{% block 'variant-picker', id: 'options', product: product %}{% endblock %}
```

### Commerce

- Store fields read: none. The Hydrogen product-form store is NOT used (D-047).
- Hydrogen helpers used on the server (pure functions): `buildProductSelectionSearchParams` (in the binding); `getSelectedProductOptions` (in the app's loader).
- Adapter methods called (by `rp-live`): `refresh`, `usable`.
- Regions refreshed: `rp-product-buy`, `rp-product-media` (prop `refresh`). The blueprint MUST declare both: `rp-product-buy` around Price, VariantPicker and ProductForm; `rp-product-media` inside ProductGallery.
- Pending and error behaviour: `data-pending` and `aria-busy` on the root during the refresh; on failure the browser navigates to the URL.

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Value link | `<product url>?<Option>=<Value>&...` (one param per option) | `value.variant.url` (`?variant=<id>`) |
| Dropdown | GET `<product url>?variant=<numeric id>`; `handleShopifyRoutes` redirects it to option params | GET `{{ product.url }}?variant=<id>` |
| Server reads selection | `getSelectedProductOptions({ searchParams })`, then `selectedOrFirstAvailableVariant(selectedOptions:)` | `product.selected_or_first_available_variant` |

### Agent surface

`accessibility-tree` (links and selects). Bridge: component `rp-live`, manifest `agent.actions`: `["submit"]` ([08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.2): `submit()` calls `requestSubmit()` on the first GET form inside the root; it throws `"rp-live: nothing to submit here"` in the `buttons` layout, which prints no form. Confirm: none. Secret: none.

### Checker rules

RP101 (`layout`), RP104 (`id`, `product`), RP114 (value ids), RP308 (a `data-rp-refresh` name with no region on the page; this root MAY be inside the region it refreshes, D-102), RP403 (Liquid: partials `rp-product-buy`, `rp-product-media` declared). Manifest `rules[]`: `variant-picker-outside-form` (kind `forbids-ancestor`, selector `.rp-variant-picker`, target `rp-product-form`; message "A VariantPicker is inside a ProductForm."; fix "Move the VariantPicker out of the ProductForm; it is a GET form or a set of links of its own."; test T08 of [08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) depends on this id, D-061); `variant-picker-fallback-submit` (`requires-descendant`, selector `form.rp-variant-picker-option`, target `button[type="submit"][data-rp-js="fallback"]`).

### Acceptance tests

1. Tier 2: fixtures `default`, `dropdown`, `buttons`, `single-variant`, `class`, `invalid-enum-falls-back`, `escaping` are canonical-equal in all four hosts with the mask above.
2. Tier 5 (unit): `variantPickerOptions` on `product.options` returns, for `Size` / `L`: `exists: false`, `url: null`; for `Color` / `Sand`: `exists: true`, `available: false`, `url: "/products/linen-shirt?Color=Sand&Size=S"`, `variantId: "13"`.
3. Tier 5: test C-13 of [05-commerce.md](05-commerce.md) (a variant link replaces the URL without a new history entry and replaces `rp-product-buy`); after the refresh `document.activeElement.id` equals the id of the clicked link.
4. Tier 6: with scripting disabled, clicking `M` loads a page whose variant field has the id of Blue / M; in layout `dropdown`, choosing `M` and pressing `Apply` does the same.
5. Tier 3: zero mutations at upgrade.
6. Tier 5: a ctrl-click on a value link does not call `refresh`.

### Evidence and UNVERIFIED

- Evidence: `hydrogen/packages/hydrogen/skills/hydrogen-variant-form/SKILL.md` (values are GET links; `aria-current`; never hide values; non-existent values are not interactive; `?variant=` redirected by `handleShopifyRoutes`); `hydrogen/packages/hydrogen/src/core/product/url.ts` (`buildProductSelectionSearchParams`); `hydrogen/packages/hydrogen/src/core/product/state.ts` (`adjacentVariants`: variants that differ from the selected variant by one option value); `ripple/theme/blocks/variant-picker.liquid` (`value.variant`, `value.selected`, `value.swatch`); `ripple/docs/05-commerce.md` section 7.3.
- UNVERIFIED: that `adjacentVariants` always contains every existing one-option-away variant (if it is truncated for a product, a value is shown as "Unavailable" although it exists; the query SHOULD then also select `encodedVariantExistence`, which V1 does not decode); Liquid `value.variant.url` and `value.product_url` on the preview store (tier 8).

### Fallback (SPIKE-nn)

None.

---

## Swatch

| Field | Value |
|---|---|
| Id | `swatch` |
| Kind | `static` |
| Category | `product` |
| Custom elements | none |
| Root element and class | `span` `.rp-swatch` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M3 |

### Purpose

A small decorative sample of a colour or an image, used inside option values and filter values.

- Use when: visualising a colour or pattern next to (or instead of) its text label.
- Do not use when: the sample is the only label; the surrounding control MUST carry the text.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Swatch` | `blocks/swatch.liquid` + `snippets/rp-swatch.liquid` | `span` | `rp-swatch` | none | yes | none |
| image | printed by root | same | `img` | `rp-swatch-image` | none | when `image` is set | none |

Nesting rules: the image is the only possible child. A Swatch has no text and no interactive content.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `fill` | `fill` | string | a CSS colour (for example `#1d4ed8`) | none | no | no | `style="--rp-swatch-fill:<value>"` on root |
| `image` | `image` | object | `RippleImage` / Liquid image drop | none | no | no | the image part |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` |
| `radius` | `radius` | enum | `none md full` | `full` | no | no | `data-radius` |

When both `fill` and `image` are set, both are printed (the image covers the fill). When neither is set, the root is printed with neither `style` nor child. The `style` value MUST be exactly `--rp-swatch-fill:` followed by the escaped value, with no spaces and no trailing semicolon. A `fill` value that contains `;`, `{`, `}`, `<`, `>` or `"` MUST be dropped (treated as unset).

### Content model

`none` - no children.

### HTML contract

Fixture `default` (`fill`: `#1d4ed8`):

```html
<span class="rp-swatch" data-size="md" data-radius="full" aria-hidden="true" style="--rp-swatch-fill:#1d4ed8"></span>
```

Fixture `image` (`image`: image of `product.basic`, `size`: `lg`, `radius`: `md`):

```html
<span class="rp-swatch" data-size="lg" data-radius="md" aria-hidden="true"><img class="rp-swatch-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=96" alt="" width="96" height="96" loading="lazy"></span>
```

Further required fixtures: `class`; `invalid-enum-falls-back` (`size`: `huge`; equals `default`); `unsafe-fill` (`fill`: `red;background:url(x)`; the root has no `style` attribute).

Host-owned regions and masks: no host-owned region. Masks (fixture `image`): `{ "select": "img", "op": "attr", "name": "src" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| None. | | | | |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None.

### Behaviour without JavaScript

Identical.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: decorative image; `checkPattern`: none.
- Accessible name: none; the root has `aria-hidden="true"` and the image has `alt=""`.
- Focus: not focusable.
- Announcements: None.

| Key | Action |
|---|---|
| None | |

### Styling

- File: `components/swatch/swatch.css` (layer `rp.components`).
- Tokens used: `--color-border`, `--color-muted`, `--radius-md`, `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-swatch-fill` | `var(--color-muted)` | background colour; set inline from data |
| `--rp-swatch-size` | `calc(var(--spacing) * 7)` | inline and block size |
| `--rp-swatch-radius` | `9999px` | corner radius |

| Modifier selector | Sets |
|---|---|
| `.rp-swatch[data-size="sm"]` | `--rp-swatch-size: calc(var(--spacing) * 5)` |
| `.rp-swatch[data-size="md"]` | `--rp-swatch-size: calc(var(--spacing) * 7)` |
| `.rp-swatch[data-size="lg"]` | `--rp-swatch-size: calc(var(--spacing) * 9)` |
| `.rp-swatch[data-radius="none"]` | `--rp-swatch-radius: 0` |
| `.rp-swatch[data-radius="md"]` | `--rp-swatch-radius: var(--radius-md)` |
| `.rp-swatch[data-radius="full"]` | `--rp-swatch-radius: 9999px` |

Required rules: root `display: inline-block; overflow: hidden; background-color: var(--rp-swatch-fill); border: 1px solid var(--color-border)`; image `inline-size: 100%; block-size: 100%; object-fit: cover`. The inline custom property is data, not a colour prop; checker RP116 does not apply because the `style` attribute contains no `color`, `background` or `border-color` declaration.

### Host notes

- HTML: None.
- React: generated. `Swatch(props: { fill?: string; image?: RippleImage | null; size?: "sm" | "md" | "lg"; radius?: "none" | "md" | "full"; className?: string })`; the style is passed as `style={{ "--rp-swatch-fill": fill } as CSSProperties}`.
- Remix: None.
- Liquid: markup in `snippets/rp-swatch.liquid` (embedded by VariantPicker and FilterGroup). Image: `image | image_url: width: 96`. Schema settings: `size`, `radius`. No locale keys.

```tsx
<Swatch fill="#1d4ed8" size="lg" />
```

```liquid
{% block 'swatch', fill: value.swatch.color, image: value.swatch.image, size: 'lg' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree` (hidden from it by `aria-hidden`); actions: none; confirm: none; secret: none.

### Checker rules

RP101 (`size`, `radius`), RP110. No `rules[]` entry.

### Acceptance tests

1. Tier 2: fixtures `default`, `image`, `class`, `invalid-enum-falls-back`, `unsafe-fill` are canonical-equal in all four hosts.
2. Tier 5: the computed `background-color` of fixture `default` is `rgb(29, 78, 216)`.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/snippets/swatch.liquid` (colour and image swatches, 96 px image slot).
- UNVERIFIED: that React 19 serialises the custom property style exactly as `--rp-swatch-fill:#1d4ed8` (tier 2 decides; if React adds a trailing semicolon, the canonicaliser rule for `style` in [13-testing.md](13-testing.md) MUST strip it on both sides).

### Fallback (SPIKE-nn)

None.

---

## AddToCartButton

| Field | Value |
|---|---|
| Id | `add-to-cart-button` |
| Kind | `static` |
| Category | `product` |
| Custom elements | none |
| Root element and class | `button` `.rp-button.rp-add-to-cart-button` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `button` |
| Milestone | M3 |

### Purpose

The submit button of a ProductForm. It composes Button by contract (D-070; class pair `rp-button rp-add-to-cart-button`, section 0.2) and adds the dialect's submit attributes and the `submit` part hook that `rp-product-form` looks for.

- Use when: inside a ProductForm body, exactly once.
- Do not use when: outside a ProductForm (it would submit nothing), or for checkout (use CheckoutButton).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `AddToCartButton` | `blocks/add-to-cart-button.liquid` + `snippets/rp-add-to-cart-button.liquid` | `button` | `rp-button rp-add-to-cart-button` | `data-rp-part="submit"` | yes | none |

Nesting rules: MUST be a descendant of the `<form>` of a ProductForm. At most one per ProductForm. The class order is `rp-button` first, then `rp-add-to-cart-button` (rule N-3 of doc 02).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `variant` | `variant` | enum | `primary secondary outline ghost link destructive` | `primary` | no | no | `data-variant` |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` |
| `fullWidth` | `full_width` | boolean | `true false` | `false` | no | no | `data-full-width=""` |
| `disabled` | `disabled` | boolean | `true false` | `false` | no | no | `disabled` |

Fixed attributes (not props): `type="submit"`; `data-rp-part="submit"`; the dialect submit attributes: hydrogen backend `name="intent" value="add"`, liquid backend `name="add"`.

### Content model

`text` - the button label. When there are no children the label is `Add to cart`, or `Sold out` when `disabled` is true.

### HTML contract

Fixture `default` (no props, no children):

```html
<button class="rp-button rp-add-to-cart-button" type="submit" name="intent" value="add" data-variant="primary" data-size="md" data-rp-part="submit">Add to cart</button>
```

Fixture `sold-out` (`disabled`: true, `fullWidth`: true, `size`: `lg`, `variant`: `secondary`):

```html
<button class="rp-button rp-add-to-cart-button" type="submit" name="intent" value="add" data-variant="secondary" data-size="lg" data-full-width="" data-rp-part="submit" disabled>Sold out</button>
```

Fixture `children` (children: `Pre-order`):

```html
<button class="rp-button rp-add-to-cart-button" type="submit" name="intent" value="add" data-variant="primary" data-size="md" data-rp-part="submit">Pre-order</button>
```

Further required fixtures: `class` (class `rp-button rp-add-to-cart-button custom-a custom-b`); `invalid-enum-falls-back` (`variant`: `fancy`; equals `default`).

Host-owned regions and masks: the submit attributes are dialect-owned (D-043). Masks: `{ "select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "name" }`, `{ "select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "value" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `disabled` | root | server | `disabled` is true | present or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. A click submits the form; `rp-product-form` intercepts the submit because the submitter matches `[data-rp-part="submit"]`.
2. The button is NOT disabled while the add is pending (D-045 item 3); a second submit is ignored by the element.

### Behaviour without JavaScript

The button submits the ProductForm natively.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: native button; `checkPattern`: none.
- Accessible name: its text; required (the default label guarantees it).
- Focus: keeps focus after the add.
- Announcements: None (ProductForm announces).

| Key | Action |
|---|---|
| Enter, Space | submits the form |

### Styling

- File: `components/add-to-cart-button/add-to-cart-button.css` (layer `rp.components`).
- Tokens used: none of its own; all visuals come from `button.css`.
- Required rule: `.rp-add-to-cart-button { opacity: var(--rp-add-to-cart-button-opacity) }`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-add-to-cart-button-opacity` | `1` | opacity of the button; lowered while the form is pending |

| Modifier selector | Sets |
|---|---|
| `rp-product-form[data-pending] .rp-add-to-cart-button` | `--rp-add-to-cart-button-opacity: 0.7` |

### Host notes

- HTML: use the hydrogen attributes of the fixture.
- React: `AddToCartButton(props: { variant?: ButtonVariant; size?: "sm" | "md" | "lg"; fullWidth?: boolean; disabled?: boolean; strings?: { label?: string; soldOut?: string }; className?: string; children?: ReactNode })`. Compose by contract (D-070): the binding prints the `<button>` itself, `<button className={cx("rp-button", "rp-add-to-cart-button", className)} type="submit" name="intent" value="add" disabled={disabled} data-variant={variant} data-size={size} data-full-width={fullWidth ? "" : undefined} data-rp-part="submit" {...rest}>`; it does NOT render `<Button>`. Manifest `root.class`: `rp-button rp-add-to-cart-button`; `dependencies.components`: `["button"]`.
- Remix: None.
- Liquid: markup in `snippets/rp-add-to-cart-button.liquid`, which prints the `<button>` itself (compose by contract; it does NOT call `{% render 'rp-button' %}`): `class="rp-button rp-add-to-cart-button{% if class != blank %} {{ class }}{% endif %}" type="submit" name="add"`, `disabled` when set, Button's `data-variant`, `data-size`, `data-full-width`, then `data-rp-part="submit"`, then `{{ attributes }}` last (D-035). Schema settings: `variant`, `size`. Locale keys: `ripple.add-to-cart-button.label` = `Add to cart`; `ripple.add-to-cart-button.sold_out` = `Sold out`.

```tsx
<AddToCartButton fullWidth disabled={!variant.availableForSale} />
```

```liquid
{% block 'add-to-cart-button', full_width: true %}{% endblock %}
```

### Commerce

None. (The form dialect is owned by ProductForm.)

### Agent surface

`accessibility-tree`; actions: none (the bridge action `add` is on `rp-product-form`); confirm: none; secret: none.

### Checker rules

RP101 (`variant`, `size`), RP110. Manifest `rules[]`: `add-to-cart-in-product-form` (`requires-ancestor`, selector `:scope`, target `rp-product-form form`; "An AddToCartButton is outside a ProductForm, so it submits nothing.").

### Acceptance tests

1. Tier 2: fixtures `default`, `sold-out`, `children`, `class`, `invalid-enum-falls-back` are canonical-equal in all four hosts with the masks above.
2. Tier 5: hydrogen hosts print `name="intent"` and `value="add"`; the Liquid shim prints `name="add"` and no `value`.
3. Tier 6: covered by ProductForm AT-6.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/05-commerce.md` section 6.2 (submit attributes, `data-rp-part="submit"`); ledger D-050, section 8.7.
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---

## ProductRecommendations

| Field | Value |
|---|---|
| Id | `product-recommendations` |
| Kind | `commerce` |
| Category | `product` |
| Custom elements | `rp-recommendations` |
| Root element and class | `rp-recommendations` `.rp-product-recommendations` |
| Liquid tier | `resource` |
| No-JS level | `degraded` |
| Requires `id` | no |
| Depends on | `product-card` |
| Milestone | M3 |

### Purpose

A titled grid of recommended products for a product. The products are either rendered by the server or loaded once, when the element nears the viewport, by refreshing region `rp-product-recommendations`.

- Use when: showing "You may also like" on a product page.
- Do not use when: showing a merchant-chosen collection; use FeaturedCollection.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `ProductRecommendations` | `blocks/product-recommendations.liquid` | `rp-recommendations` | `rp-product-recommendations` | `data-slot="rp-recommendations"` | yes | none |
| list (region part) | `ProductRecommendationsList` | `snippets/rp-product-recommendations-list.liquid` | `div` | `rp-product-recommendations-list` | `data-rp-region="rp-product-recommendations"` | yes | none |
| title | printed by list | same | `h2` to `h6` | `rp-product-recommendations-title` | none | when there are products | none |
| items | printed by list | same | `ul` | `rp-product-recommendations-items` | none | when there are products | none |
| item | printed by list | same | `li` | `rp-product-recommendations-item` | none | one per product | none |

Nesting rules: the list is the only child of root. Each item contains exactly one ProductCard. When `products` is empty or unset the list part is printed with no children.

### Props

Root and region part take the same props, except `url` (root only). The Liquid region-part snippet `rp-product-recommendations-list` takes exactly `products` and `level`; every call passes both (D-091 item 4).

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `products` | `products` | object | `RippleProduct[]` / Liquid array of `product` drops | empty | no | no | one item per product |
| `url` | `url` | url | a URL whose response contains region `rp-product-recommendations` | none | no | no | `data-url` on root; omitted when unset |
| `level` | `level` | enum | `2 3 4 5 6` | `2` | no | no | tag of the title; ProductCards get `level` + 1 (maximum 6) |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | passed to ProductCard; TSX hosts only |

### Content model

`parts` - children (`{{ content }}`) replace the default rendering of the list region part (RS-2).

### HTML contract

Fixture `default` (no props; the lazy state before products are loaded):

```html
<rp-recommendations class="rp-product-recommendations" data-slot="rp-recommendations">
  <div class="rp-product-recommendations-list" data-rp-region="rp-product-recommendations"></div>
</rp-recommendations>
```

Fixture `lazy` (`url`: `/recommendations/products?product_id=1&limit=4&intent=related`):

```html
<rp-recommendations class="rp-product-recommendations" data-slot="rp-recommendations" data-url="/recommendations/products?product_id=1&amp;limit=4&amp;intent=related">
  <div class="rp-product-recommendations-list" data-rp-region="rp-product-recommendations"></div>
</rp-recommendations>
```

Fixture `products` (`products`: [`product.sale`]; `level`: `3`):

```html
<rp-recommendations class="rp-product-recommendations" data-slot="rp-recommendations">
  <div class="rp-product-recommendations-list" data-rp-region="rp-product-recommendations">
    <h3 class="rp-product-recommendations-title">You may also like</h3>
    <ul class="rp-product-recommendations-items">
      <li class="rp-product-recommendations-item">
        <div class="rp-product-card">
          <div class="rp-product-card-media">
            <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/wool-socks.jpg?width=1600 1600w" sizes="(min-width: 64rem) 25vw, 50vw" alt="Grey wool socks" width="1200" height="1200" loading="lazy" decoding="async" data-ratio="1/1" data-fit="cover" data-radius="none">
            <span class="rp-badge rp-product-card-badge" data-variant="solid" data-tone="sale" data-size="md">Sale</span>
          </div>
          <div class="rp-product-card-body">
            <h4 class="rp-product-card-title"><a class="rp-product-card-link" href="/products/wool-socks">Wool Socks</a></h4>
            <span class="rp-price" data-size="base" data-sale=""><span class="rp-visually-hidden">Sale price</span><span class="rp-price-current"><bdi>$12.00</bdi></span><span class="rp-visually-hidden">Regular price</span><s class="rp-price-compare"><bdi>$16.00</bdi></s></span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</rp-recommendations>
```

Further required fixtures: `class`; `invalid-enum-falls-back` (`level`: `9`, with `products`; equals `products` with title tag `h2` and card title `h3`); `escaping` (covered by `lazy`: `&` in `url` is printed `&amp;`).

Host-owned regions and masks: product URLs on Liquid carry tracking parameters (`?pr_prod_strat=...`). Masks (fixture `products`): `img` `src` and `srcset`; `.rp-price-current` and `.rp-price-compare` text; `{ "select": "a.rp-product-card-link", "op": "attr", "name": "href" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-pending`, `aria-busy` | root | `rp-recommendations` | while the region loads | absent |
| `aria-busy` | list | commerce adapter | while the region refreshes | absent |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-recommendations", "attrs": ["data-pending", "aria-busy"], "reason": "When the element is already within 400 px of the viewport at upgrade it starts loading at once." }`; `{ "select": "[data-rp-region=\"rp-product-recommendations\"]", "attrs": ["aria-busy"], "childList": true, "text": true, "subtree": true, "reason": "Same case: the region is replaced by loaded products." }`. Both apply only to fixtures with `url`.

### Behaviour with JavaScript

1. With `data-url`: when the root comes within 400 px below the viewport, once, the element sets `data-pending=""` and `aria-busy="true"` and calls `getCommerce().refresh(["rp-product-recommendations"], { url, reason: "recommendations" })`; then it removes both attributes.
2. Without `data-url` the element does nothing.
3. A failed load leaves the page unchanged: no navigation, no error message.
4. The element runs once per connection; a replaced region does not trigger a second load.

### Behaviour without JavaScript

The server-rendered content of the list stays: products when the server rendered them, nothing in the lazy case. Missing: lazy loading. A server that can render recommendations inline (hydrogen backend) SHOULD pass `products` and omit `url`, which makes the component fully functional without JavaScript.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `rp:refresh` | `document` (adapter) | `{ regions: ["rp-product-recommendations"], url, reason: "recommendations" }` | none |
| event | `rp:refreshed` | `document` (adapter) | `{ regions, ok }` | none |

### Accessibility

- Pattern: heading plus list of links; `checkPattern`: none.
- Accessible name: the title heading.
- Focus: never moved.
- Announcements: None.

| Key | Action |
|---|---|
| None | |

### Styling

- File: `components/product-recommendations/product-recommendations.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--text-2xl`, `--breakpoint-md`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-product-recommendations-columns` | `2` (from 48rem: `4`) | number of grid columns |
| `--rp-product-recommendations-gap` | `calc(var(--spacing) * 4)` | grid gap |

| Modifier selector | Sets |
|---|---|
| `.rp-product-recommendations[data-pending]` | nothing; reserved for project CSS |

Required rules: items `display: grid; grid-template-columns: repeat(var(--rp-product-recommendations-columns), minmax(0, 1fr)); gap: var(--rp-product-recommendations-gap); list-style: none; padding: 0; margin: 0`; `.rp-product-recommendations-list:empty { display: none }`. `base.css` carries `rp-recommendations { display: block }` (generated).

### Host notes

- HTML: None.
- React: `ProductRecommendations(props: { products?: RippleProduct[]; url?: string; level?: 2 | 3 | 4 | 5 | 6; locale?: string; strings?: { title?: string }; className?: string; children?: ReactNode })` and the region part `ProductRecommendationsList` (complete code below) are exported from the same file. The file starts with `"use client";` because the region part calls a hook, and it exports components only (D-094). On `react` the adapter's strategy for reason `recommendations` fetches `data-url`, takes the inner HTML of the region `rp-product-recommendations` from the response and publishes it; `ProductRecommendationsList` reads it with `useRegionHtml("rp-product-recommendations")` from `<pkg>/react` (D-090). While the hook returns `null` the part renders its server children from the `products` prop; afterwards it renders the HTML string with `dangerouslySetInnerHTML` on the region root. There is no navigation. UNVERIFIED (SPIKE-10); see `Fallback (SPIKE-10)`.

  `components/product-recommendations/react/product-recommendations.tsx` MUST contain this region part unchanged (`__PKG__` is replaced by the package name at install):

  ```tsx
  "use client";

  import type { RippleProduct } from "__PKG__";
  import { useRegionHtml } from "__PKG__/react";
  import { ProductCard } from "./product-card";

  const LEVELS = [2, 3, 4, 5, 6] as const;
  type Level = (typeof LEVELS)[number];

  export interface ProductRecommendationsListProps {
    products?: RippleProduct[];
    level?: Level;
    locale?: string;
    strings?: { title?: string };
  }

  export function ProductRecommendationsList(props: ProductRecommendationsListProps) {
    const { products = [], locale = "en-US", strings = {} } = props;
    const level: Level = LEVELS.includes(props.level as Level) ? (props.level as Level) : 2;
    const html = useRegionHtml("rp-product-recommendations");

    if (html !== null) {
      return (
        <div
          className="rp-product-recommendations-list"
          data-rp-region="rp-product-recommendations"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    if (products.length === 0) {
      return <div className="rp-product-recommendations-list" data-rp-region="rp-product-recommendations" />;
    }

    const Title = `h${level}` as "h2";
    const cardLevel = Math.min(level + 1, 6) as Level;
    return (
      <div className="rp-product-recommendations-list" data-rp-region="rp-product-recommendations">
        <Title className="rp-product-recommendations-title">{strings.title ?? "You may also like"}</Title>
        <ul className="rp-product-recommendations-items">
          {products.map((product) => (
            <li className="rp-product-recommendations-item" key={product.id}>
              <ProductCard product={product} level={cardLevel} locale={locale} />
            </li>
          ))}
        </ul>
      </div>
    );
  }
  ```
- Remix: prop `rmxKey?: string` prints `data-rmx-key` on the root (omitted when unset; CV-5, D-034); `data-rmx-preserve-attrs="data-pending aria-busy"` on the root.
- Liquid: the block prints the root and renders `rp-product-recommendations-list` as default body. The list snippet prints the title and items only when `products.size > 0`. The template builds the URL and declares the partial (example below). No schema settings. Locale key: `ripple.product-recommendations.title` = `You may also like`.

```tsx
<ProductRecommendations products={recommended} level={2} />
```

```liquid
{% liquid
  assign rec_url = routes.product_recommendations_url | append: '?product_id=' | append: product.id | append: '&limit=4&intent=related'
%}
{% block 'product-recommendations', url: rec_url %}
  {% partial 'rp-product-recommendations' %}{% render 'rp-product-recommendations-list', products: recommendations.products, level: 2 %}{% endpartial %}
{% endblock %}
```

### Commerce

- Store fields read: none.
- Adapter methods called: `refresh`, `usable`.
- Regions refreshed: `rp-product-recommendations` (fixed; this component has no `refresh` prop).
- Pending and error behaviour: `data-pending` / `aria-busy` on the root while loading; failures are silent ([05-commerce.md](05-commerce.md) section 7.5).

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Products | `productRecommendations(productId:, intent: RELATED)` in the page loader; pass `products`, omit `url` | `recommendations.products` inside the partial; populated only for the request to `routes.product_recommendations_url` (SPIKE-09) |
| `url` | omitted (or an app route that renders the region) | `{{ routes.product_recommendations_url }}?product_id={{ product.id }}&limit=4&intent=related` |

### Agent surface

`accessibility-tree` (links). Bridge: component `rp-recommendations`, manifest `agent.actions`: `[]` with `shown: () => false`, so the bridge does not list it ([08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.2). Confirm: none. Secret: none.

### Checker rules

RP101 (`level`), RP308 (the name `rp-product-recommendations` has a region on the page), RP403 (Liquid: partial `rp-product-recommendations` declared). Manifest `rules[]`: `product-recommendations-region` (`requires-descendant`, selector `:scope`, target `[data-rp-region="rp-product-recommendations"]`).

### Acceptance tests

1. Tier 2: fixtures `default`, `lazy`, `products`, `class`, `invalid-enum-falls-back` are canonical-equal in all four hosts with the masks above.
2. Tier 5: test C-15 of [05-commerce.md](05-commerce.md) (one request when scrolled within 400 px; region replaced; a failing request leaves the URL unchanged).
3. Tier 3: fixture `default` and `products` (no `url`): zero mutations at upgrade.
4. Tier 6: fixture `products` with scripting disabled shows one product link that navigates.
5. Tier 8 (blocked until a preview store exists): SPIKE-09 procedure below.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/05-commerce.md` section 7.5; `ripple/docs/research/spikes/commerce/result.txt` (H7); Shopify docs tool, Liquid object `recommendations` ("returns products only when rendered in a section using the Product Recommendations API and the Section Rendering API").
- UNVERIFIED: whether a `{% partial %}` fetched from `routes.product_recommendations_url` populates `recommendations` (SPIKE-09). The docs sentence quoted above suggests it may not. `useRegionHtml` on the `react` host (SPIKE-10; D-090 item 4).

### Fallback (SPIKE-09)

SPIKE-09 procedure (preview store): call `partials.fetch("rp-product-recommendations", { url: "<routes.product_recommendations_url>?product_id=<id>&limit=4&intent=related" })` on a product page of the Ripple theme and apply it. Pass: the region contains at least one ProductCard for a product that has recommendations.

If it fails, the liquid backend changes as follows and nothing changes on the hydrogen backend:

1. The Liquid product blueprint MUST NOT call `product-recommendations`. It calls FeaturedCollection ([12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md)) with a merchant-chosen collection instead (theme setting `rp_related_collection`, type `collection`, owned by doc 14). The section title is the collection's own title, which FeaturedCollection prints; the block is called with `limit: 4` and no children (doc 12 owns the call, section "product" blueprint).
2. `blocks/product-recommendations.liquid` and `snippets/rp-product-recommendations-list.liquid` stay in the registry (they still serve a template that passes `products` explicitly, for example from a metafield list of products); the `url` param is documented as "not supported on Liquid".
3. Fixture `lazy` gets `"hosts": ["html", "react", "remix"]`.

### Fallback (SPIKE-10)

Applies only to the `react` host and only when SPIKE-10 fails (D-090 item 4). Nothing changes in the other hosts.

1. `ProductRecommendationsList` does not call `useRegionHtml`; it always renders its `products` prop.
2. The React app either passes `products` from its loader and omits `url` (preferred; no request is made), or handles `rp:refresh` on `document`: when `event.detail.reason === "recommendations"` it calls `event.preventDefault()`, fetches its own recommendations route, and passes the result as the `products` prop.

---


## CartLink

| Field | Value |
|---|---|
| Id | `cart-link` |
| Kind | `commerce` |
| Category | `cart` |
| Custom elements | `rp-cart` |
| Root element and class | `rp-cart` `.rp-cart-link` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `icon`, `visually-hidden` |
| Milestone | M3 |

### Purpose

The link to the cart with a live item count. With JavaScript and a CartDrawer on the page it opens the drawer; otherwise it navigates to the cart page.

- Use when: the header (or any place) needs a cart entry point with a count.
- Do not use when: you need a button that submits the cart (use CheckoutButton), or a count without a link (print `<span data-rp-part="count">` inside any other `rp-cart` root).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CartLink` | `blocks/cart-link.liquid` + `snippets/rp-cart-link.liquid` | `rp-cart` | `rp-cart-link` | `data-slot="rp-cart"` | yes | none |
| trigger | printed by root | same | `a` | `rp-cart-link-trigger` | `data-rp-open="<drawer>"` when `drawer` is set | yes | none |
| label | printed by root | same | `span` | `rp-visually-hidden` | none | yes, unless children are passed | none |
| count | printed by root | same | `span` | `rp-cart-link-count` | `data-rp-part="count"` | yes | none |

Nesting rules: the trigger is the only child of root. Inside the trigger, in order: one Icon `cart`, the label, the count. Children replace the Icon and the label; the count is always printed last. The root MUST NOT carry `data-rp-refresh` and MUST NOT contain an error part ([05-commerce.md](05-commerce.md) section 9.2). The markup lives in a snippet because Header embeds it.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `href` | `href` | url | a URL | `/cart` (Liquid: `routes.cart_url`) | no | no | `href` on the trigger |
| `drawer` | `drawer` | id | the `id` of a CartDrawer on the page | none | no | no | `data-rp-open="<value>"` on the trigger. CartLink prints this opener attribute itself, from its own prop (the same first-class prop pattern as `dialog` on Link, D-009). The caller MUST omit `drawer` on the cart page, where no CartDrawer is rendered (D-091 item 5); the link then navigates to `href` |
| `count` | `count` | number | integer 0 or greater | `0` (Liquid: `cart.item_count`) | no | no | text of the count part; `hidden` on the count part when `0` |

### Content model

`flow` restricted to phrasing content - replaces the Icon and the visually hidden label. The children MUST contain text (it becomes the link's accessible name). When there are no children the label text is `Cart`.

### HTML contract

Fixture `default` (`count`: `3`, `drawer`: `cart-drawer`):

```html
<rp-cart class="rp-cart-link" data-slot="rp-cart">
  <a class="rp-cart-link-trigger" href="/cart" data-rp-open="cart-drawer">
    <svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg>
    <span class="rp-visually-hidden">Cart</span>
    <span class="rp-cart-link-count" data-rp-part="count">3</span>
  </a>
</rp-cart>
```

Fixture `empty` (no props):

```html
<rp-cart class="rp-cart-link" data-slot="rp-cart">
  <a class="rp-cart-link-trigger" href="/cart">
    <svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg>
    <span class="rp-visually-hidden">Cart</span>
    <span class="rp-cart-link-count" data-rp-part="count" hidden>0</span>
  </a>
</rp-cart>
```

Fixture `children` (`count`: `1`, children: `Bag`):

```html
<rp-cart class="rp-cart-link" data-slot="rp-cart">
  <a class="rp-cart-link-trigger" href="/cart">Bag<span class="rp-cart-link-count" data-rp-part="count">1</span></a>
</rp-cart>
```

Further required fixtures: `class` (root class `rp-cart-link custom-a custom-b`); `escaping` (`href`: `/cart?a="b"&c=<d>`; the attribute is `/cart?a=&quot;b&quot;&amp;c=&lt;d&gt;`).

Host-owned regions and masks: none. In Remix the root also carries `data-rmx-key="<rmxKey>"` when the prop `rmxKey` is set (CV-5); the canonicaliser removes it.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `hidden` | count | server, then `rp-cart` | total quantity is 0 | present when `count` is `0` |
| `data-pending` | root | `rp-cart` | the cart store is busy | absent |
| `aria-busy` | root | `rp-cart` | the cart store is busy (`"true"`) | absent |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "[data-rp-part=\"count\"]", "attrs": ["hidden"], "text": true, "reason": "The server value can be stale on a cached page; the store value replaces it." }` (the count entry fixed by D-071), `{ "select": "rp-cart", "attrs": ["data-pending", "aria-busy"], "reason": "The store may already hold a pending mutation when the element upgrades." }`.

### Behaviour with JavaScript

1. `rp-cart` writes `String(totalQuantity)` into the count part and sets `hidden` when it is `0`, after the store is ready and on every store change ([05-commerce.md](05-commerce.md) section 7.1).
2. A plain primary click on the trigger, when `drawer` names a `<dialog>` that exists and `rp-dialog` is defined, opens that dialog instead of navigating (`data-rp-open`, [04-elements.md](04-elements.md) section 9.1). When the dialog does not exist (cart page) the link navigates.
3. Modified clicks (Ctrl, Meta, Shift, middle button) always navigate.

### Behaviour without JavaScript

The link navigates to the cart page. The count shows the server-rendered value.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: native link; `checkPattern`: none.
- Accessible name: label text followed by the count text (for example `Cart 3`); required. The server MUST NOT print `aria-haspopup`, `aria-controls` or `role` on the trigger (D-009).
- Focus: one tab stop. After the drawer closes, focus returns to the trigger (`rp-dialog`).
- Announcements: None. The count is not a live region; cart changes are announced by the component that made them.

| Key | Action |
|---|---|
| Enter | opens the drawer, or follows the link |

### Styling

- File: `components/cart-link/cart-link.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-foreground`, `--color-primary`, `--color-primary-foreground`, `--color-ring`, `--radius-full`, `--text-xs`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-cart-link-size` | `calc(var(--spacing) * 11)` | minimum inline and block size of the trigger (44 px target) |
| `--rp-cart-link-count-bg` | `var(--color-primary)` | count background |
| `--rp-cart-link-count-fg` | `var(--color-primary-foreground)` | count text colour |

| Modifier selector | Sets |
|---|---|
| `.rp-cart-link[data-pending]` | nothing; reserved for project CSS |

Required rules: root `display: inline-flex`; trigger `position: relative; display: inline-flex; align-items: center; justify-content: center; min-inline-size: var(--rp-cart-link-size); min-block-size: var(--rp-cart-link-size)`; count `position: absolute; inset-block-start: 0; inset-inline-end: 0; min-inline-size: 1.25rem; border-radius: var(--radius-full); font-size: var(--text-xs); text-align: center`; `.rp-cart-link-count[hidden] { display: none }`.

### Host notes

- HTML: copy the contract; the count text is replaced by `rp-cart` at runtime.
- React: `CartLink(props: { href?: string; drawer?: string; count?: number; strings?: { label?: string }; className?: string; children?: ReactNode })`. First line `"use client";`. The count is `useCart((state) => state.data?.totalQuantity ?? 0, count ?? 0)` (`useCart` from `<pkg>/react`, [06-bindings.md](06-bindings.md) section 6.2). The count `<span>` MUST carry `suppressHydrationWarning` ([05-commerce.md](05-commerce.md) section 10.3).
- Remix: prop `rmxKey?: string` prints `data-rmx-key` on root; the attribute is omitted when the prop is unset (CV-5, D-034). The server prints `count`; no hydration.
- Liquid: `count` defaults to `cart.item_count`, `href` to `routes.cart_url`. The layout passes `drawer` only when `template.name != 'cart'` (D-091 item 5). The root prints `{{ attributes }}` last (D-035). No schema settings. Locale key: `ripple.cart-link.label` = `Cart`.

```tsx
<CartLink drawer="cart-drawer" count={cart.totalQuantity} />
```

```liquid
{% block 'cart-link', drawer: 'cart-drawer' %}{% endblock %}
```

### Commerce

- Store fields read: `state.data.totalQuantity`, `state.loading`, `isBusy(state)`.
- Adapter methods called: `ready` (through `rp-cart`).
- Regions refreshed: none; the root has no `data-rp-refresh`.
- Pending and error behaviour: `data-pending` and `aria-busy` on root while the store is busy; no error part.

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Cart page URL | `/cart` (the app's cart route) | `{{ routes.cart_url }}` |
| Count | `cart.totalQuantity` | `{{ cart.item_count }}` |

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP110, RP302 (the element with `data-rp-open` is `a` with a non-empty `href`), RP201 (the trigger has a name). Manifest `rules[]`: `cart-link-count` (`requires-descendant`, selector `:scope`, target `a[href] [data-rp-part="count"]`; "A CartLink has no count part inside its link."); `cart-link-no-error` (`forbids-descendant`, selector `:scope`, target `[data-rp-part="error"]`).

### Acceptance tests

1. Tier 2: fixtures `default`, `empty`, `children`, `class`, `escaping` are canonical-equal in all four hosts.
2. Tier 3: after upgrade with a store whose `totalQuantity` is 5 and server text `3`, the only mutations are the count text and the attributes of the allow-list.
3. Tier 5: with a store at quantity 0 the count has `hidden`; after an add it shows `1` without `hidden` ([05-commerce.md](05-commerce.md) tests C-01 and C-10).
4. Tier 5: click with `#cart-drawer` present opens the dialog and the URL is unchanged; with no such dialog the click navigates to `/cart`.
5. Tier 6: with scripting disabled the click navigates to `/cart`.

### Evidence and UNVERIFIED

- Evidence: [05-commerce.md](05-commerce.md) sections 7.1 and 9.2; [04-elements.md](04-elements.md) section 10.2 (link opener); `ripple/docs/research/base-theme.md` (cart count bubble in the header).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---

## CartDrawer

| Field | Value |
|---|---|
| Id | `cart-drawer` |
| Kind | `commerce` |
| Category | `cart` |
| Custom elements | `rp-dialog`, `rp-cart` (through the embedded CartLines and CartSummary) |
| Root element and class | `rp-dialog` `.rp-drawer.rp-cart-drawer` |
| Liquid tier | `resource` |
| No-JS level | `degraded` (the drawer cannot open; the cart page gives full function) |
| Requires `id` | yes (default `cart-drawer`) |
| Depends on | `drawer`, `icon-button`, `icon`, `cart-lines`, `cart-summary` |
| Milestone | M3 |

### Purpose

The cart in a modal drawer. It is a Drawer whose body holds a CartLines and a CartSummary. It opens from a CartLink and after a successful add to cart.

- Use when: the storefront shows the cart without leaving the page. Render it once, in the layout, outside every region.
- Do not use when: on the cart page itself (Liquid: forbidden, RS-4; other hosts: SHOULD NOT), or when the project wants a cart page only (omit it; CartLink and ProductForm then navigate).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CartDrawer` | `blocks/cart-drawer.liquid` | `rp-dialog` | `rp-drawer rp-cart-drawer` | `data-slot="rp-dialog"` | yes | none |
| panel | printed by root | same | `dialog` | `rp-drawer-panel` | none | yes | `<id>` |
| title | printed by root | same | `h2` | `rp-drawer-title` | none | yes | `<id>-title` |
| body | printed by root | same | `div` | `rp-drawer-body` | none | yes | none |
| close | printed by root | same | `button` | `rp-icon-button` | `commandfor="<id>"`, `command="close"` | yes | none |

Nesting rules: root contains only the panel. The panel contains, in order: title, body, close. The default body is one CartLines with `id` `<id>-list`, then one CartSummary with `cartLines` `<id>-list`. Children (`{{ content }}`) replace the children of body. The `<dialog>` MUST NOT be inside a `[data-rp-region]` element or a `{% partial %}` (D-046 item 5; RP308, RP404). The body MUST contain an `rp-cart` root that owns a `[data-rp-part="status"]` element (the embedded CartLines prints it).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | `cart-drawer` | yes | no | `id` on the panel; `<id>-title`; `<id>-list` on the embedded CartLines |
| `cart` | `cart` | object | `RippleCart` or `null` / Liquid `cart` drop | Liquid: the global `cart`; TSX: `null` | no | no | passed to CartLines and CartSummary. TSX: `null` or unset (the buyer has no cart yet) renders the empty cart, the same output as a cart with zero lines (D-110) |
| `side` | `side` | enum | `start end` | `end` | no | no | `data-side` on the panel |
| `acceleratedCheckout` | `accelerated_checkout` | boolean | `true false` | `false` | no | no | passed to CartSummary |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | passed on (CV-1) |

The value of `id` defaults to `cart-drawer` and MUST equal `CommerceOptions.cartDrawer` (D-087; [05-commerce.md](05-commerce.md) section 4.2; default `cart-drawer`), otherwise the drawer does not open after an add. CartDrawer composes Drawer by contract (D-070, section 0.2): manifest `root.class` is `rp-drawer rp-cart-drawer` and `dependencies.components` contains `drawer`. In EVERY host the `layout` blueprint MUST omit CartDrawer on the cart page (TSX layout prop `cartPage`; Liquid `template.name == 'cart'`), because the regions `rp-cart-lines` and `rp-cart-summary` may be declared only once per page (D-091 item 5, RS-4).

### Content model

`flow` - replaces the children of body. A caller that passes children MUST include one CartLines (which prints the status part) and SHOULD include one CartSummary.

### HTML contract

Fixture `default` (`cart`: `cart.empty`; hosts `html`, `react`, `remix`):

```html
<rp-dialog class="rp-drawer rp-cart-drawer" data-slot="rp-dialog">
  <dialog class="rp-drawer-panel" id="cart-drawer" data-side="end" aria-labelledby="cart-drawer-title" closedby="any">
    <h2 class="rp-drawer-title" id="cart-drawer-title">Cart</h2>
    <div class="rp-drawer-body">
      <rp-cart class="rp-cart-lines" data-slot="rp-cart" id="cart-drawer-list" data-rp-refresh="rp-cart-lines rp-cart-summary">
        <div class="rp-cart-lines-list" data-rp-region="rp-cart-lines">
          <p class="rp-cart-lines-empty">Your cart is empty.</p>
        </div>
        <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
        <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
      </rp-cart>
      <!-- CartSummary fixture `empty` -->
    </div>
    <button class="rp-icon-button" type="button" commandfor="cart-drawer" command="close" data-variant="ghost" data-size="md" aria-label="Close"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  </dialog>
</rp-dialog>
```

The comment stands for the complete reference HTML of the named CartSummary fixture.

Fixture `liquid-default` (same props; host `liquid`): identical except that the first child of body is the `liquid-empty` fixture of CartLines with `id` `cart-drawer-list` (so its form id is `cart-drawer-list-form`). The second child is the same CartSummary `empty` fixture.

Further required fixtures (each in the two backend variants, FX-2): `two-lines` / `liquid-two-lines` (`cart`: `cart.two-lines`; body = CartLines `default` / `liquid-default` with id `cart-drawer-list`, then CartSummary `two-lines` / `liquid-two-lines` with `cartLines` `cart-drawer-list`); `start` (`side`: `start`; `data-side="start"`); `children` (children `<p>Custom</p>`; body contains only that paragraph); `class` (root class `rp-drawer rp-cart-drawer custom-a custom-b`); `invalid-enum-falls-back` (`side`: `top`; equals `default`).

Host-owned regions and masks: the body's default content is the embedded components' contract; the masks of CartLines and CartSummary apply inside it.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `open` | panel | browser (`showModal()`) | the drawer is open | absent (the server MUST NOT print `open`) |
| `data-side` | panel | server | always | `end` |

Other state is that of the embedded CartLines and CartSummary. Upgrade allow-list (mutations permitted when the element upgrades): None for CartDrawer's own parts.

### Behaviour with JavaScript

1. Opening: a click on any `a[data-rp-open="<id>"]` (CartLink), and `openCart()` of the adapter after a successful add ([05-commerce.md](05-commerce.md) section 7.2), call `showModal()` on the panel through `rp-dialog`.
2. Closing: the close button (`command="close"`), Escape and a click on the backdrop (`closedby="any"`), as specified for `rp-dialog` in [04-elements.md](04-elements.md) section 9.1. Focus returns to the opener.
3. While open, cart mutations refresh the regions `rp-cart-lines` and `rp-cart-summary` inside the body; the `<dialog>` element itself is never replaced, so it stays open.
4. Announcements of cart changes are written to the status part of the `rp-cart` root that handled the change (every submitting `rp-cart` root prints one), because the page's live regions are inert under a modal dialog. The channel for `Added to cart` is specified in [05-commerce.md](05-commerce.md) section 9.1.
5. When focus is lost by a refresh (the focused line was removed), the adapter focuses the first focusable element of the region, else the first focusable element of the dialog ([05-commerce.md](05-commerce.md) section 8.2 step 9).

### Behaviour without JavaScript

The drawer never opens (a closed `<dialog>` is not rendered). CartLink navigates to the cart page and ProductForm posts and lands on the cart page or back on the product page, so every cart function stays available. Missing: viewing the cart without leaving the page.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| command | `close` | panel | invoker command of the close button | none |
| event | `openchange` | `rp-dialog` root | `{ value: boolean, reason, source }` ([10-components-interactive.md](10-components-interactive.md), Drawer) | `onOpenChange?: (value: boolean, detail: object) => void` (through `useElement`) |

### Accessibility

- Pattern: modal dialog; `checkPattern`: `dialog`.
- Accessible name: `aria-labelledby="<id>-title"`; required. Close button: `aria-label="Close"`.
- Focus: on open, the dialog's default focus (first focusable element; `rp-dialog` rules); trapped by the browser; returns to the opener on close.
- Announcements: cart changes through the status part inside the dialog.

| Key | Action |
|---|---|
| Escape | closes the drawer |
| Tab, Shift+Tab | cycle inside the dialog |

### Styling

- File: `components/cart-drawer/cart-drawer.css` (layer `rp.components`). All drawer visuals come from `drawer.css`.
- Tokens used: `--spacing`, `--color-border`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-cart-drawer-gap` | `calc(var(--spacing) * 6)` | space between CartLines and CartSummary |

| Modifier selector | Sets |
|---|---|
| None | |

Required rules: `.rp-cart-drawer .rp-drawer-body { display: flex; flex-direction: column; gap: var(--rp-cart-drawer-gap) }`; `.rp-cart-drawer .rp-cart-lines { flex: 1 1 auto; overflow-y: auto }`; `.rp-cart-drawer .rp-cart-summary { border-block-start: 1px solid var(--color-border); padding-block-start: calc(var(--spacing) * 4) }`.

### Host notes

- HTML: copy the contract once per page, as the last child of `<body>`.
- React: `CartDrawer(props: { id?: string; cart?: RippleCart | null; side?: "start" | "end"; acceleratedCheckout?: boolean; locale?: string; onOpenChange?: (value: boolean, detail: object) => void; strings?: { title?: string; close?: string }; className?: string; children?: ReactNode })`. `"use client";` (it uses `useElement` for `onOpenChange`). Compose by contract (D-070): the binding prints `<rp-dialog class="rp-drawer rp-cart-drawer">`, the `<dialog class="rp-drawer-panel">`, the title and the body itself with Drawer's attributes; it does NOT render `<Drawer>`. The close button is the embedded IconButton. It renders `<CartLines id={id + "-list"} cart={cart} />` and `<CartSummary cart={cart} cartLines={id + "-list"} />`, which read the store themselves.
- Remix: `data-rmx-key="<id>"` on root. The default body renders the two region parts inline as plain elements (D-090 item 5). Frames are opt-in: an app that configures `reloadFrames` passes children, CartLines and CartSummary each with a `<Frame>` child (RS-5; SPIKE-11).
- Liquid: `blocks/cart-drawer.liquid` renders `{% render 'rp-cart-lines', id: <id>-list, cart: cart %}` and `{% render 'rp-cart-summary', cart: cart, cart_lines: <id>-list %}` as its default body. For in-place refresh the LAYOUT MUST pass the body with partial-wrapped region parts (RS-3), exactly as in the usage below; without it `ripple check` reports RP403. The layout MUST NOT render the block when `template.name == 'cart'` (RS-4, D-091 item 5). The root is not printed by `{% form %}`; it prints `{{ attributes }}` last (D-035). No schema settings. Locale keys: `ripple.cart-drawer.title` = `Cart`; `ripple.cart-drawer.close` = `Close`.

```tsx
<CartDrawer cart={cart} />
```

```liquid
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
```

### Commerce

- Store fields read: none by CartDrawer itself.
- Adapter methods called: none by CartDrawer itself; the adapter's `openCart()` finds the panel by `CommerceOptions.cartDrawer`.
- Regions refreshed: `rp-cart-lines`, `rp-cart-summary` (declared by the embedded roots).
- Pending and error behaviour: that of CartLines and CartSummary.

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Body content | per-line forms (CartLines `default`) | one cart form (CartLines `liquid-default`) |

### Agent surface

`bridge`: `rp-dialog` actions `open`, `close` ([10-components-interactive.md](10-components-interactive.md), Drawer); the embedded `rp-cart` roots expose the actions of CartLines. No `checkout` action exists (D-050). Confirm: the CheckoutButton inside (`data-agent-confirm`). Secret: none.

### Checker rules

RP104 (`id`), RP114 (`<id>-title`, `<id>-list`), RP201 (dialog name), RP204, RP308 and RP404 (dialog not inside a region or partial), RP403. Manifest `rules[]`: `cart-drawer-status` (`requires-descendant`, selector `dialog`, target `rp-cart [data-rp-part="status"][role="status"]`; "The CartDrawer has no status part; cart changes are not announced inside the modal dialog."); `cart-drawer-one` (`max-count`, selector `.rp-cart-drawer`, count 1).

### Acceptance tests

1. Tier 2: fixtures `default`, `two-lines`, `start`, `children`, `class`, `invalid-enum-falls-back` (hydrogen hosts) and `liquid-default`, `liquid-two-lines` (Liquid shim) are canonical-equal to the reference with the masks of the embedded components.
2. Tier 5: [05-commerce.md](05-commerce.md) test C-02: after an add, `#cart-drawer` is open and the status part contains `Added to cart`.
3. Tier 5: removing the focused line inside the open drawer leaves the dialog open and `document.activeElement` inside the dialog.
4. Tier 5: `checkPattern(root, "dialog")` passes while open.
5. Tier 6: with scripting disabled the panel is not rendered and the CartLink navigates.
6. Tier 5 (checker, Liquid source): `ripple check` on a layout that renders the block inside a `{% partial %}` reports RP404.

### Evidence and UNVERIFIED

- Evidence: [04-elements.md](04-elements.md) sections 9.1 and 10.2; [05-commerce.md](05-commerce.md) sections 7.1, 8.1, 9.1; `ripple/docs/research/liquid-blocks-partials.md` (partials replace DOM; overlay outside the partial).
- UNVERIFIED: that a `{% block %}` call nested in another block's body, each with a `{% partial %}` inside, is accepted by the platform in a layout file (SPIKE-02 owns the proof; if it fails, the layout prints the Drawer markup itself and renders the two snippets inside partials).

### Fallback (SPIKE-nn)

None.

---

## CartLines

| Field | Value |
|---|---|
| Id | `cart-lines` |
| Kind | `commerce` |
| Category | `cart` |
| Custom elements | `rp-cart` |
| Root element and class | `rp-cart` `.rp-cart-lines` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes |
| Depends on | `cart-line`, `button`, `form-message`, `visually-hidden` |
| Milestone | M3 |

### Purpose

The editable list of cart lines, with the cart-level error message and the status region for announcements. It owns the region `rp-cart-lines` and, on the liquid backend, the one cart form.

- Use when: showing the cart on the cart page or inside CartDrawer.
- Do not use when: showing a read-only order summary (print CartLine markup without the actions part in project code).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CartLines` | `blocks/cart-lines.liquid` + `snippets/rp-cart-lines.liquid` | `rp-cart` | `rp-cart-lines` | `data-slot="rp-cart"`, `data-rp-refresh` | yes | `<id>` |
| form (liquid backend only) | printed by root | same | `form` | `rp-cart-lines-form` | none | yes on Liquid | `<id>-form` |
| list (region part) | `CartLinesList` | `snippets/rp-cart-lines-list.liquid` | `div` | `rp-cart-lines-list` | `data-rp-region="rp-cart-lines"` | yes | none |
| items | printed by list | same | `ul` | `rp-cart-lines-items` | none | when the cart has lines | none |
| empty | printed by list | same | `p` | `rp-cart-lines-empty` | none | when the cart has no lines | none |
| update (liquid backend only) | printed by root | same | `button` | `rp-button rp-cart-lines-update` | `data-rp-part="submit"`, `data-rp-js="fallback"` | yes on Liquid | none |
| error | printed by root | same | `p` | `rp-form-message` | `data-rp-part="error"` | yes | none |
| status | printed by root | same | `p` | `rp-visually-hidden` | `data-rp-part="status"` | yes | none |

Nesting rules, hydrogen backend: root children in order: list, error, status. Liquid backend: root children in order: form, status; form children in order: list, update, error. The list contains either items or empty, never both. Items contains only CartLine roots (`li`). Children (`{{ content }}`) replace the default rendering of the list part (RS-2). The root is outside the region it refreshes (RS-7). On Liquid the update button MUST be the first submit button of the form.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on root; `<id>-form` on the Liquid form |
| `cart` | `cart` | object | `RippleCart` or `null` / Liquid `cart` drop | Liquid: the global `cart`; TSX: `null` | no | no | the lines, or the empty text. TSX: `null` or unset (the buyer has no cart yet) prints the empty text, the same output as a cart with zero lines (D-110) |
| `refresh` | `refresh` | string | region names | `rp-cart-lines rp-cart-summary` | no | no | `data-rp-refresh` on root |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | passed to CartLine (CV-1) |

The region part takes `cart` and `locale` only (Liquid: the snippet `rp-cart-lines-list` takes exactly `cart`; D-091 item 4).

### Content model

`parts` - children replace the default rendering of the list part (RS-2): pass `CartLinesList`, a Remix `<Frame>`, or on Liquid the partial-wrapped snippet.

### HTML contract

Fixture `default` (`id`: `cart`, `cart`: `cart.two-lines`; hosts `html`, `react`, `remix`):

```html
<rp-cart class="rp-cart-lines" data-slot="rp-cart" id="cart" data-rp-refresh="rp-cart-lines rp-cart-summary">
  <div class="rp-cart-lines-list" data-rp-region="rp-cart-lines">
    <ul class="rp-cart-lines-items">
      <!-- CartLine fixture `default` (line.basic) -->
      <!-- CartLine fixture `sale` (second line of cart.two-lines) -->
    </ul>
  </div>
  <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

The two comments stand for the complete reference HTML of the named CartLine fixtures; the fixture file contains that HTML, not the comments.

Fixture `liquid-default` (same props; host `liquid`):

```html
<rp-cart class="rp-cart-lines" data-slot="rp-cart" id="cart" data-rp-refresh="rp-cart-lines rp-cart-summary">
  <form class="rp-cart-lines-form" id="cart-form" method="post" action="/cart">
    <div class="rp-cart-lines-list" data-rp-region="rp-cart-lines">
      <ul class="rp-cart-lines-items">
        <!-- CartLine fixture `liquid-default` (line.basic) -->
        <!-- CartLine fixture `liquid-sale` -->
      </ul>
    </div>
    <button class="rp-button rp-cart-lines-update" type="submit" name="update" data-variant="outline" data-size="sm" data-rp-part="submit" data-rp-js="fallback">Update cart</button>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  </form>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

Fixture `empty` (`id`: `cart`, `cart`: `cart.empty`; hosts `html`, `react`, `remix`):

```html
<rp-cart class="rp-cart-lines" data-slot="rp-cart" id="cart" data-rp-refresh="rp-cart-lines rp-cart-summary">
  <div class="rp-cart-lines-list" data-rp-region="rp-cart-lines">
    <p class="rp-cart-lines-empty">Your cart is empty.</p>
  </div>
  <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

Fixture `liquid-empty` (same props; host `liquid`): the `liquid-default` fixture with the `<ul>` replaced by `<p class="rp-cart-lines-empty">Your cart is empty.</p>`. The form and the update button are still printed (the note and checkout controls of other components reference the form by id).

Further required fixtures (both variants): `class` (root class `rp-cart-lines custom-a custom-b`); `refresh` (`refresh`: `rp-cart-lines`; `data-rp-refresh="rp-cart-lines"`); `children` (children `<div data-rp-region="rp-cart-lines"></div>`; that element is printed in place of the list part).

Host-owned regions and masks: the line actions are host-owned through CartLine. Masks: those of CartLine, plus `{ "select": "form.rp-cart-lines-form", "op": "attr", "name": "action" }` in the `liquid-*` fixtures.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-rp-refresh` | root | server | always | `rp-cart-lines rp-cart-summary` |
| `data-pending` | root | `rp-cart` | the cart store is busy | absent |
| `aria-busy` | root | `rp-cart` | the cart store is busy (`"true"`) | absent |
| `aria-busy` | list | commerce adapter | region `rp-cart-lines` is refreshing (`"true"`) | absent |
| `hidden` | error | `rp-cart` | no cart-scope error to show | present |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-cart", "attrs": ["data-pending", "aria-busy"], "reason": "The store may already hold a pending mutation when the element upgrades." }`, `{ "select": "[data-rp-region]", "attrs": ["aria-busy"], "childList": true, "text": true, "subtree": true, "reason": "A refresh that completes during upgrade replaces the region content." }`, `{ "select": "[data-rp-line]", "attrs": ["data-pending", "aria-busy"], "reason": "A line can have a pending mutation when the element upgrades." }`, `{ "select": "[data-rp-part=\"error\"]", "attrs": ["hidden"], "text": true, "reason": "The error part shows the result of a mutation that completed during upgrade." }`, `{ "select": "[data-rp-part=\"status\"]", "text": true, "reason": "The status part announces a mutation that completed during upgrade." }`. This is the commerce allow-list of [05-commerce.md](05-commerce.md) section 7 restricted to the parts this component prints. The element also sets the `value` PROPERTY of a quantity input from the store; a property write is not a DOM mutation and needs no entry.

### Behaviour with JavaScript

1. A change of a line's quantity input (typing then blur, Enter, or the `valuechange` event of `rp-quantity`) is debounced 250 ms per line and sent as `setLineQuantity(<line id>, <quantity>)`. Quantity 0 removes the line.
2. hydrogen backend: the line's remove button submits `intent=remove`; `rp-cart` intercepts the submit and calls `submitCart`. liquid backend: a plain primary click on the remove link is prevented and sent as `setLineQuantity(<key>, 0)`.
3. While a line is pending the line root carries `data-pending` and `aria-busy="true"`; the root carries both while the store is busy. Controls are NOT disabled (D-045 item 3).
4. When the store settles the adapter refreshes the regions named in `data-rp-refresh`; the list part is replaced by the server's rendering. Quantity inputs are reset to their `defaultValue`, except a focused one.
5. Success is announced by writing `Cart updated` or `Item removed` to the status part. A cart-scope error is shown in the error part (`hidden` removed, text set); a line error in that line's error part.
6. React: the list renders from the store (`useCart`); the refresh is a no-op and lines appear, change and disappear by re-render. Optimistic lines (id starting with `optimistic:`) render with their controls `disabled` (React only).

### Behaviour without JavaScript

hydrogen backend: each line has its own form; the Update button of a line posts `intent=set`, the remove button posts `intent=remove`; the server answers 303 back to the page. liquid backend: the buyer edits quantities and presses `Update cart` (`name="update"`), which posts the cart form to `/cart`; the remove link navigates to `item.url_to_remove`. All line functions work.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

`rp-cart` dispatches no events ([05-commerce.md](05-commerce.md) section 7.1); `rp:refresh` and `rp:refreshed` are dispatched on `document` by the adapter.

### Accessibility

- Pattern: list of forms; `checkPattern`: none.
- Accessible name: none on root. Each control is named by CartLine.
- Focus: stays on the control that was used. After a refresh that removed the focused element, the adapter restores focus ([05-commerce.md](05-commerce.md) section 8.2 step 9).
- Announcements: status part (`role="status"`): `Cart updated`, `Item removed`, and `Added to cart` when ProductForm adds while this root is in the open drawer. Errors: error parts with `role="alert"`.

| Key | Action |
|---|---|
| Enter in a quantity input | hydrogen backend: submits `intent=set` for that line (hidden first button); liquid backend: submits `update` |

### Styling

- File: `components/cart-lines/cart-lines.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-border`, `--color-muted-foreground`, `--rp-duration-base`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-cart-lines-gap` | `calc(var(--spacing) * 4)` | space between lines |
| `--rp-cart-lines-divider` | `1px solid var(--color-border)` | border between lines |
| `--rp-cart-lines-busy-opacity` | `0.6` | opacity of the list while it refreshes |

| Modifier selector | Sets |
|---|---|
| `.rp-cart-lines-list[aria-busy="true"]` | `--rp-cart-lines-opacity: var(--rp-cart-lines-busy-opacity)` |

Required rules: root `display: block`; `.rp-cart-lines-items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--rp-cart-lines-gap) }`; `.rp-cart-lines-list { opacity: var(--rp-cart-lines-opacity, 1); transition: opacity var(--rp-duration-base) }`; `.rp-cart-lines-update { margin-block-start: calc(var(--spacing) * 4) }`.

### Host notes

- HTML: copy the `default` contract; per-line forms post to `/api/cart`.
- React: file `cart-lines.tsx`, first line `"use client";`. Exports `CartLines(props: { id: string; cart?: RippleCart | null; refresh?: string; locale?: string; className?: string; children?: ReactNode })`, `CartLinesList(props: { cart?: RippleCart | null; locale?: string })` (`null` or unset is the empty cart, D-110), The pure helpers `toRippleCart(cart: HydrogenCart): RippleCart` and `toRippleLine(line: HydrogenCartLine): RippleLine` (`import type` of the cart types from `@shopify/hydrogen`) are NOT in this file: a `"use client"` file exports components only (D-094). They live in `cart-lines.data.ts` (file key `data`, no directive; CV-10), imported here as `./cart-lines.data` and by blueprints as `@components/cart-lines.data`. `CartLinesList` reads the live cart with `useCart` ([06-bindings.md](06-bindings.md) rule R-12; the exact selector signature is owned by doc 06), using the `cart` prop as the server value, and maps it with `toRippleCart`. Each `<li>` uses `key={line.id}`. Error and status parts carry `suppressHydrationWarning`.
- Remix: `data-rmx-key="<id>"` on root; default body renders `CartLinesList` inline (RS-5).
- Liquid: root, form, update button, error and status are in `snippets/rp-cart-lines.liquid`; the list in `snippets/rp-cart-lines-list.liquid`, which loops `cart.items` and renders `rp-cart-line` with `line: item`. The update button composes Button by contract (D-070; class pair `rp-button rp-cart-lines-update`): the snippet prints the `<button>` itself with `data-rp-part="submit" data-rp-js="fallback"`; it is the FIRST submit button of the cart form (D-092). The cart form is a plain `<form class="rp-cart-lines-form" id="{{ id }}-form" method="post" action="{{ routes.cart_url }}">` (not `{% form %}`); it is the ONE Liquid cart form (D-092). The block's `{{ attributes }}` go on the `rp-cart` root, printed last (D-035). The region-part snippet is always called as `{% render 'rp-cart-lines-list', cart: cart %}` (D-091 item 4). No schema settings. Locale keys: `ripple.cart-lines.empty` = `Your cart is empty.`; `ripple.cart-lines.update` = `Update cart`; `ripple.cart-lines.updated`, `ripple.cart-lines.removed`, `ripple.cart-lines.error` as in [05-commerce.md](05-commerce.md) section 4.3.

`toRippleLine` mapping (fields of `HydrogenCartFragment`, `hydrogen/packages/hydrogen/src/core/cart/queries.ts`):

| `RippleLine` field | Source |
|---|---|
| `id` | `line.id` |
| `quantity` | `line.quantity` |
| `title` | `line.merchandise.product.title` |
| `variantTitle` | `line.merchandise.title`, or `""` when it equals `Default Title` |
| `url` | `/products/<line.merchandise.product.handle>?<buildProductSelectionSearchParams(line.merchandise.selectedOptions)>`; the project MAY replace the path template |
| `image` | `line.merchandise.image` or `null` |
| `totalPrice` | `line.cost.totalAmount` |
| `compareAtTotalPrice` | `line.cost.subtotalAmount` when its amount is greater than `totalAmount`, else `null` (D-049) |
| `attributes` | `line.attributes` |

```tsx
<CartLines id="cart" cart={cart} />
```

```liquid
{% block 'cart-lines', id: 'cart' %}
  {% partial 'rp-cart-lines' %}{% render 'rp-cart-lines-list', cart: cart %}{% endpartial %}
{% endblock %}
```

### Commerce

- Store fields read: `state.data.lines`, `state.pending.lines`, `state.errors`, `isBusy(state)`.
- Adapter methods called: `submitCart`, `setLineQuantity`, `usable`, `ready`; the adapter calls `refresh(["rp-cart-lines", "rp-cart-summary"], { reason: "cart" })`.
- Regions refreshed: the names in `data-rp-refresh` (default `rp-cart-lines rp-cart-summary`).
- Pending and error behaviour: see "State and attributes"; one cart-scope error part here, one line-scope error part per CartLine.

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Forms | one `<form method="post" action="/api/cart">` per line (inside CartLine) | ONE `<form method="post" action="{{ routes.cart_url }}" id="<id>-form">` around the region |
| Line identity | `data-rp-line="<CartLine gid>"`, hidden `lineId` | `data-rp-line="{{ item.key }}"` |
| Set quantity | `quantity` + `intent=set` | `updates[]` in `cart.items` order + `name="update"` |
| Remove | `intent=remove` | `<a href="{{ item.url_to_remove }}" data-rp-part="remove">` |

### Agent surface

`bridge`; component `rp-cart`. The manifest `agent.actions` of every `rp-cart` component is `["setQuantity", "remove"]` ([08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.2, D-095): `setQuantity(line: string, quantity: number): void` and `remove(line: string): void`, where `line` is the value of a `data-rp-line` attribute, and `items: (api) => api.lines()` returns `RippleSortOption[]`. Each label is the line title. There is no `checkout` action and no discount, note or locale action (D-050; doc 08 rule A-5). Confirm: none. Secret: none.

### Checker rules

RP104 (`id`, `cart`), RP114 (`<id>-form`), RP301, RP305 (dialect of every form), RP308 (the `rp-cart` root MUST be outside the region it refreshes: an error, D-102), RP403 (Liquid: partials `rp-cart-lines` and `rp-cart-summary` declared), and the two form-order checks of [05-commerce.md](05-commerce.md) section 13. Manifest `rules[]`: `cart-lines-region` (`requires-descendant`, selector `:scope`, target `[data-rp-region="rp-cart-lines"]`); `cart-lines-error` (`requires-descendant`, selector `:scope`, target `[data-rp-part="error"]`); `cart-lines-status` (`requires-descendant`, selector `:scope`, target `[data-rp-part="status"][role="status"]`); `cart-lines-items-only-lines` (`forbids-descendant`, selector `.rp-cart-lines-items`, target `:scope > :not(li.rp-cart-line)`).

### Acceptance tests

1. Tier 2: `default`, `empty`, `class`, `refresh`, `children` (hydrogen hosts) and `liquid-default`, `liquid-empty` and the Liquid variants (shim) are canonical-equal with the masks above.
2. Tier 3: upgrade produces no mutation outside the allow-list.
3. Tier 5: [05-commerce.md](05-commerce.md) tests C-03 (Liquid quantity, remove link, Enter), C-04 (line error part), C-06 (failed partial fetch reloads), C-10 (hydrogen quantity and remove; focus after refresh).
4. Tier 5 (React): setting a quantity to 0 removes the `<li>` without a network refresh of the document; no hydration warning is logged ([05-commerce.md](05-commerce.md) test C-23).
5. Tier 6: hydrogen dev server: with scripting disabled, changing the quantity and pressing Update yields a 303 and the new quantity in the re-rendered page. Liquid shim: the form posts `updates[]` in line order and `update`.
6. Tier 5: on Liquid the first submit button of `#cart-form` is `name="update"`, and the number of `[name="updates[]"]` controls equals the number of `[data-rp-line]` elements.

### Evidence and UNVERIFIED

- Evidence: [05-commerce.md](05-commerce.md) sections 6.2, 7.1, 8.4, 9; `hydrogen/packages/hydrogen/src/core/cart/queries.ts`; `ripple/docs/research/base-theme.md` (cart form with `updates[]`).
- UNVERIFIED: `selectedOptions` is part of the cart line merchandise selection of `HydrogenCartFragment` (if it is absent, `url` is `/products/<handle>` without a query).

### Fallback (SPIKE-nn)

None. (SPIKE-01 of [05-commerce.md](05-commerce.md) covers `item.key` as line id; its fallback changes the adapter, not this markup.)

---

## CartLine

| Field | Value |
|---|---|
| Id | `cart-line` |
| Kind | `static` |
| Category | `cart` |
| Custom elements | none of its own (it embeds QuantityInput, whose root is `rp-quantity`; the kind stays `static` per ledger section 8.3) |
| Root element and class | `li` `.rp-cart-line` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `image`, `placeholder`, `price`, `quantity-input`, `button`, `icon-button`, `icon`, `form-message` |
| Milestone | M3 |

### Purpose

One line of the cart: image, title link, variant, line attributes, quantity control, remove control, line price and the line's error message.

- Use when: inside the items list of CartLines (CartLines renders it; pages do not call it directly).
- Do not use when: outside an `rp-cart` root; the controls would do nothing with JavaScript.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CartLine` | `blocks/cart-line.liquid` + `snippets/rp-cart-line.liquid` | `li` | `rp-cart-line` | `data-rp-line="<line id>"` | yes | none |
| media | printed by root | same | `div` | `rp-cart-line-media` | none | yes | none |
| details | printed by root | same | `div` | `rp-cart-line-details` | none | yes | none |
| title | printed by root | same | `a` | `rp-cart-line-title` | none | yes | none |
| variant | printed by root | same | `p` | `rp-cart-line-variant` | none | when `variantTitle` is not empty | none |
| attributes | printed by root | same | `dl` | `rp-cart-line-attributes` | none | when a visible attribute exists | none |
| actions | printed by root | same | `div` | `rp-cart-line-actions` | none | yes | none |
| form (hydrogen backend only) | printed by root | same | `form` | `rp-cart-line-form` | none | yes on hydrogen | none |
| remove | printed by root | same | `button` (hydrogen) or `a` (liquid) | `rp-icon-button rp-cart-line-remove` | liquid: `data-rp-part="remove"` | yes | none |
| price | printed by root | same | `div` | `rp-cart-line-price` | none | yes | none |
| error | printed by root | same | `p` | `rp-form-message` | `data-rp-part="error"` | yes | none |

Nesting rules: root children in order: media, details, actions, price, error. Media contains one Image, or one Placeholder when the line has no image. Details contains title, then variant, then attributes. Attributes whose key starts with `_` are not printed; when none remains the `dl` is not printed. The root MUST be a child of the items `ul` of a CartLines.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `line` | `line` | object | `RippleLine` / Liquid `line_item` drop | none | yes | no | every part |
| `disabled` | none | boolean | `true false` | `false` | no | no | `disabled` on the quantity input, the steppers, Update and remove; React host only (optimistic lines) |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | passed to Price (CV-1) |

### Content model

`none`. Liquid `{{ content }}`, when not blank, replaces the children of the details part (CV-6).

### HTML contract

Fixture `default` (`line`: `line.basic`; hosts `html`, `react`, `remix`):

```html
<li class="rp-cart-line" data-rp-line="gid://shopify/CartLine/1?cart=c1">
  <div class="rp-cart-line-media">
    <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1600 1600w" sizes="6rem" alt="Linen shirt on a hanger" width="1200" height="1200" loading="lazy" decoding="async" data-ratio="1/1" data-fit="cover" data-radius="none">
  </div>
  <div class="rp-cart-line-details">
    <a class="rp-cart-line-title" href="/products/linen-shirt?variant=11">Linen Shirt</a>
    <p class="rp-cart-line-variant">Blue / S</p>
  </div>
  <div class="rp-cart-line-actions">
    <form class="rp-cart-line-form" method="post" action="/api/cart">
      <input type="hidden" name="lineId" value="gid://shopify/CartLine/1?cart=c1" data-rp-field="line-id">
      <button type="submit" name="intent" value="set" hidden></button>
      <rp-quantity class="rp-quantity" data-size="md" data-slot="rp-quantity">
        <button class="rp-quantity-button" type="button" aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
        <input class="rp-quantity-input" type="number" inputmode="numeric" name="quantity" min="0" step="1" value="2" aria-label="Quantity for Linen Shirt" data-rp-part="input" data-rp-field="quantity">
        <button class="rp-quantity-button" type="button" aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
      </rp-quantity>
      <button class="rp-button rp-cart-line-update" type="submit" name="intent" value="set" data-variant="outline" data-size="sm" data-rp-part="submit" data-rp-js="fallback">Update</button>
      <button class="rp-icon-button rp-cart-line-remove" type="submit" name="intent" value="remove" data-variant="ghost" data-size="sm" aria-label="Remove Linen Shirt"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button>
    </form>
  </div>
  <div class="rp-cart-line-price">
    <span class="rp-price" data-size="base"><span class="rp-price-current"><bdi>$96.00</bdi></span></span>
  </div>
  <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
</li>
```

Fixture `liquid-default` (same props; host `liquid`): identical to `default` except `data-rp-line="11:abc"` and the actions part:

```html
  <div class="rp-cart-line-actions">
    <rp-quantity class="rp-quantity" data-size="md" data-slot="rp-quantity">
      <button class="rp-quantity-button" type="button" aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
      <input class="rp-quantity-input" type="number" inputmode="numeric" name="updates[]" min="0" step="1" value="2" aria-label="Quantity for Linen Shirt" data-rp-part="input" data-rp-field="quantity">
      <button class="rp-quantity-button" type="button" aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
    </rp-quantity>
    <a class="rp-icon-button rp-cart-line-remove" href="/cart/change?id=11:abc&amp;quantity=0" data-variant="ghost" data-size="sm" data-rp-part="remove" aria-label="Remove Linen Shirt"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></a>
  </div>
```

Fixture `sale` / `liquid-sale` (the second line of `cart.two-lines`): as `default` / `liquid-default` with line id `gid://shopify/CartLine/2?cart=c1` (Liquid `21:def`), the image of `product.sale`, title `Wool Socks` linking to `/products/wool-socks?variant=21`, NO variant part, quantity value `1`, labels `Quantity for Wool Socks` and `Remove Wool Socks`, and the price part:

```html
  <div class="rp-cart-line-price">
    <span class="rp-price" data-size="base" data-sale=""><span class="rp-visually-hidden">Sale price</span><span class="rp-price-current"><bdi>$12.00</bdi></span><span class="rp-visually-hidden">Regular price</span><s class="rp-price-compare"><bdi>$16.00</bdi></s></span>
  </div>
```

Fixture `attributes` / `liquid-attributes` (`line.basic` with attributes `Engraving` = `BEN` and `_bundle` = `7`): as `default` / `liquid-default`, with this element as the last child of details:

```html
    <dl class="rp-cart-line-attributes"><div><dt>Engraving</dt><dd>BEN</dd></div></dl>
```

Further required fixtures: `no-image` (image null; media contains `<div class="rp-placeholder" data-ratio="1/1" data-radius="none" aria-hidden="true"></div>`); `class` (root class `rp-cart-line custom-a custom-b`); `escaping` (title `Say "hi" & <go>`; text `Say "hi" &amp; &lt;go&gt;` and `aria-label="Remove Say &quot;hi&quot; &amp; &lt;go&gt;"`).

Host-owned regions and masks: the actions part is dialect-owned (D-043, D-044), covered by the two fixture variants. Masks: `{ "select": "img", "op": "attr", "name": "src" }`, `{ "select": "img", "op": "srcset", "name": "srcset" }`, `{ "select": ".rp-price-current", "op": "text" }`, `{ "select": ".rp-price-compare", "op": "text" }`, `{ "select": ".rp-cart-line-title", "op": "attr", "name": "href" }`, `{ "select": "[data-rp-field=\"line-id\"]", "op": "attr", "name": "value" }`, `{ "select": ".rp-cart-line-form", "op": "attr", "name": "action" }`, `{ "select": "a.rp-cart-line-remove", "op": "attr", "name": "href" }`. `data-rp-line` is a Ripple-owned attribute and is NOT masked (D-074): each backend-scoped fixture states its own value (`gid://shopify/CartLine/1?cart=c1` on hydrogen hosts, `11:abc` on Liquid), and the resource data of doc 13 provides exactly those ids.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-rp-line` | root | server | always | the line id (hydrogen: cart line gid; liquid: `item.key`) |
| `data-pending` | root | `rp-cart` | `state.pending.lines` has this line | absent |
| `aria-busy` | root | `rp-cart` | same (`"true"`) | absent |
| `hidden` | error | `rp-cart` | no error for this line | present |
| `disabled` | decrement button | `rp-quantity` | value equals `min` | absent (value is at least 1) |

Upgrade allow-list (mutations permitted when the element upgrades): None of its own. The line root flags and the error part are covered by the allow-list of CartLines. The embedded QuantityInput has an empty allow-list ([10-components-interactive.md](10-components-interactive.md), QuantityInput): the server prints `disabled` on a stepper button that is at its limit, so the upgrade writes nothing.

### Behaviour with JavaScript

1. None of its own. `rp-quantity` steps the value and dispatches `valuechange`; the enclosing `rp-cart` reacts as described under CartLines.
2. The Update button (hydrogen) is hidden by `data-rp-js="fallback"` once the document is marked ready (D-021), because quantity changes submit themselves.

### Behaviour without JavaScript

hydrogen backend: the quantity field and the Update button post `intent=set`; the remove button posts `intent=remove`. The steppers are hidden (`data-rp-js="inflow"`); the number input is typed into directly. liquid backend: the quantity input belongs to the cart form of CartLines and is sent by `Update cart`; the remove link navigates to `item.url_to_remove`.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: list item with a form; `checkPattern`: none.
- Accessible name: quantity input `aria-label="Quantity for <title>"`; remove control `aria-label="Remove <title>"`; both required and both contain the product title so that controls of different lines are distinguishable.
- Focus: tab order title, quantity (decrement, input, increment), remove. Nothing moves focus.
- Announcements: line errors through the error part (`role="alert"`).

| Key | Action |
|---|---|
| Enter in the quantity input | submits the set (see CartLines) |
| ArrowUp, ArrowDown in the quantity input | native number stepping; the change is sent after 250 ms |

### Styling

- File: `components/cart-line/cart-line.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-foreground`, `--color-muted-foreground`, `--radius-surface`, `--text-sm`, `--text-base`, `--font-weight-medium`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-cart-line-media-size` | `6rem` | inline size of the media column |
| `--rp-cart-line-gap` | `calc(var(--spacing) * 4)` | column and row gap |
| `--rp-cart-line-pending-opacity` | `0.6` | opacity while the line is pending |

| Modifier selector | Sets |
|---|---|
| `.rp-cart-line[data-pending]` | `--rp-cart-line-opacity: var(--rp-cart-line-pending-opacity)` |

Required rules: root `display: grid; grid-template-columns: var(--rp-cart-line-media-size) minmax(0, 1fr) auto; grid-template-areas: "media details price" "media actions actions" "error error error"; gap: var(--rp-cart-line-gap); opacity: var(--rp-cart-line-opacity, 1)`; each part is assigned its grid area; `.rp-cart-line-form { display: flex; align-items: center; gap: calc(var(--spacing) * 2) }`; `.rp-cart-line-actions { display: flex; align-items: center; gap: calc(var(--spacing) * 2) }`; `.rp-cart-line-attributes > div { display: flex; gap: calc(var(--spacing) * 1) }`.

### Host notes

- HTML: copy the `default` contract per line.
- React: `CartLine(props: { line: RippleLine; disabled?: boolean; locale?: string; className?: string })`. No hook, no directive. Image: the embedded Image, `<Image image={line.image} sizes="6rem" ratio="1/1" />` (Image prints `src` and `srcset`, doc 09). Sale test: `line.compareAtTotalPrice !== null`. The remove control and the update button compose IconButton and Button by contract (D-070; class pairs `rp-icon-button rp-cart-line-remove` and `rp-button rp-cart-line-update`, section 0.2): the binding prints both elements itself. The quantity control is the embedded QuantityInput.
- Remix: no `data-rmx-*` attribute on the `li`; the actions form prints `data-rmx-document` (a cart form, D-034 item 3).
- Liquid: `line` is a `line_item` drop. Title `line.product.title`; variant `line.variant.title` unless `line.product.has_only_default_variant`; attributes `line.properties` (skip a key whose first character is `_` and a blank value); price `line.final_line_price`, compare-at `line.original_line_price` when greater. No schema settings. Locale keys: `ripple.cart-line.remove` = `Remove {{ title }}`; `ripple.cart-line.quantity` = `Quantity for {{ title }}`; `ripple.cart-line.update` = `Update`.

```tsx
<CartLine line={line} />
```

```liquid
{% render 'rp-cart-line', line: item %}
```

### Commerce

None of its own; it has no element. The dialect markup it prints is specified under "HTML contract" and in the CartLines "Commerce" table.

### Agent surface

`accessibility-tree`; actions: none (bridge actions are on the CartLines root); confirm: none; secret: none.

### Checker rules

RP104 (`line`), RP110, RP203 (image), RP301 (every button has a form ancestor or `data-rp-js`), RP305. Manifest `rules[]`: `cart-line-in-cart` (`requires-ancestor`, selector `:scope`, target `rp-cart`; "A CartLine is outside an rp-cart root; its controls do nothing with JavaScript."); `cart-line-error` (`requires-descendant`, selector `:scope`, target `[data-rp-part="error"]`); `cart-line-quantity` (`requires-descendant`, selector `:scope`, target `input[data-rp-field="quantity"]`).

### Acceptance tests

1. Tier 2: `default`, `sale`, `attributes`, `no-image`, `class`, `escaping` (hydrogen hosts) and the `liquid-*` variants (shim) are canonical-equal with the masks above.
2. Tier 5: in the hydrogen fixture the first `button[type="submit"]` of the form is `name="intent" value="set"` with `hidden`.
3. Tier 5: an attribute with key `_bundle` is not in the DOM.
4. Tier 6: hydrogen dev server, scripting disabled: pressing the remove button yields a page without the line.

### Evidence and UNVERIFIED

- Evidence: [05-commerce.md](05-commerce.md) section 6.2 (line forms, hidden first `set` button, `updates[]`, remove link); [10-components-interactive.md](10-components-interactive.md), QuantityInput (the embedded `rp-quantity` contract; D-069); Liquid `line_item` drop members listed in section 0.6.
- UNVERIFIED: the exact URL shape of `item.url_to_remove` (shown as `/cart/change?id=<key>&quantity=0`; masked in the fixture).

### Fallback (SPIKE-nn)

None.

---

## CartSummary

| Field | Value |
|---|---|
| Id | `cart-summary` |
| Kind | `commerce` |
| Category | `cart` |
| Custom elements | `rp-cart` |
| Root element and class | `rp-cart` `.rp-cart-summary` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `checkout-button`, `icon-button`, `icon` |
| Milestone | M3 |

### Purpose

The cart totals: subtotal, applied discount codes (each removable), total, the tax and shipping note, and the checkout button. It owns the region `rp-cart-summary`.

- Use when: next to a CartLines, on the cart page or inside CartDrawer.
- Do not use when: you only need a checkout button (use CheckoutButton), or an order summary after purchase (not a cart).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CartSummary` | `blocks/cart-summary.liquid` + `snippets/rp-cart-summary.liquid` | `rp-cart` | `rp-cart-summary` | `data-slot="rp-cart"`, `data-rp-refresh="rp-cart-summary"` | yes | none |
| totals (region part) | `CartSummaryTotals` | `snippets/rp-cart-summary-totals.liquid` | `div` | `rp-cart-summary-totals` | `data-rp-region="rp-cart-summary"` | yes | none |
| rows | printed by totals | same | `dl` | `rp-cart-summary-rows` | none | when the cart has lines | none |
| row | printed by totals | same | `div` | `rp-cart-summary-row` | `data-row="subtotal \| discount \| total"` | when the cart has lines | none |
| code | printed by totals | same | `span` | `rp-cart-summary-code` | none | one per discount row | none |
| remove form | printed by totals | same | `form` | `rp-cart-summary-remove` | liquid: `data-rp-js="inflow"` | one per discount row | none |
| note | printed by totals | same | `p` | `rp-cart-summary-note` | none | when the cart has lines | none |
| checkout | printed by totals | same | CheckoutButton | `rp-button rp-checkout-button` | see CheckoutButton | when the cart has lines | none |
| accelerated | printed by root | same | `div` | `rp-cart-summary-accelerated` | `data-agent-confirm` | when `acceleratedCheckout` is true and the cart has lines | none |
| status | printed by root | same | `p` | `rp-visually-hidden` | `data-rp-part="status"`, `role="status"` | yes | none |

Nesting rules: root children in order: totals, accelerated, status. Totals children in order: rows, note, checkout. Rows children in order: one `subtotal` row, one `discount` row per applied code, one `total` row. When the cart has no lines (`totalQuantity` is 0) the totals part is printed with NO children and the accelerated part is not printed. The checkout button is INSIDE the region so that a changed checkout URL (first add creates the cart) and the empty state are re-rendered (D-050 item b). For an empty cart CartSummary prints no CheckoutButton at all, so the inert form of D-050 item d (CheckoutButton prop `disabled`) is used only where a caller prints a CheckoutButton directly. The accelerated part is outside the region (its content is injected by Shopify scripts and MUST NOT be replaced; D-050 item b). The root MUST NOT contain an error part ([05-commerce.md](05-commerce.md) section 9.2). Children (`{{ content }}`) replace the default rendering of the totals part (RS-2).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `cart` | `cart` | object | `RippleCart` / Liquid `cart` drop | Liquid: the global `cart` | yes (TSX) | no | rows, checkout URL |
| `cartLines` | `cart_lines` | string | the `id` of the CartLines on the page | none | no | no | passed to CheckoutButton (Liquid: `form="<value>-form"`); ignored on hydrogen hosts |
| `acceleratedCheckout` | `accelerated_checkout` | boolean | `true false` | `false` | no | no | the accelerated part (D-050) |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | money text (CV-1) |

The region part takes `cart`, `cartLines` and `locale` (Liquid: the snippet `rp-cart-summary-totals` takes exactly `cart` and `cart_lines`; EVERY call passes both, D-091 item 4).

### Content model

`parts` - children replace the default rendering of the totals part (RS-2).

### HTML contract

Fixture `default` (`cart`: `cart.discounted`; hosts `html`, `react`, `remix`):

```html
<rp-cart class="rp-cart-summary" data-slot="rp-cart" data-rp-refresh="rp-cart-summary">
  <div class="rp-cart-summary-totals" data-rp-region="rp-cart-summary">
    <dl class="rp-cart-summary-rows">
      <div class="rp-cart-summary-row" data-row="subtotal"><dt>Subtotal</dt><dd><bdi>$108.00</bdi></dd></div>
      <div class="rp-cart-summary-row" data-row="discount">
        <dt>Discount <span class="rp-cart-summary-code">SAVE10</span></dt>
        <dd>
          <form class="rp-cart-summary-remove" method="post" action="/api/cart">
            <input type="hidden" name="discountCode" value="SAVE10" data-rp-field="discount-code">
            <button class="rp-icon-button" type="submit" name="intent" value="discount-remove" data-variant="ghost" data-size="sm" aria-label="Remove discount SAVE10"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
          </form>
        </dd>
      </div>
      <div class="rp-cart-summary-row" data-row="total"><dt>Total</dt><dd><bdi>$97.20</bdi></dd></div>
    </dl>
    <p class="rp-cart-summary-note">Taxes and shipping calculated at checkout.</p>
    <a class="rp-button rp-checkout-button" href="/checkout" data-variant="primary" data-size="lg" data-full-width="" data-agent-confirm="Goes to checkout with this cart">Check out</a>
  </div>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

Fixture `liquid-default` (`cart`: `cart.discounted`, `cart_lines`: `cart`; host `liquid`): identical except (a) the remove form is `<form class="rp-cart-summary-remove" method="post" action="/cart" data-rp-js="inflow">` with the same children, and (b) the checkout part is:

```html
    <button class="rp-button rp-checkout-button" type="submit" name="checkout" form="cart-form" data-variant="primary" data-size="lg" data-full-width="" data-agent-confirm="Goes to checkout with this cart">Check out</button>
```

Fixture `empty` (`cart`: `cart.empty`; all four hosts, one file):

```html
<rp-cart class="rp-cart-summary" data-slot="rp-cart" data-rp-refresh="rp-cart-summary">
  <div class="rp-cart-summary-totals" data-rp-region="rp-cart-summary"></div>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

Fixture `accelerated` / `liquid-accelerated` (`cart`: `cart.two-lines`, `acceleratedCheckout`: true): the `two-lines` HTML with `<div class="rp-cart-summary-accelerated" data-agent-confirm="Pays for this cart now with an express checkout"></div>` between the totals part and the status part; its children are host-owned.

Further required fixtures: `two-lines` / `liquid-two-lines` (`cart`: `cart.two-lines`: no discount row; subtotal `$108.00`; total `$108.00`); `class` (root class `rp-cart-summary custom-a custom-b`); `children` (children `<div data-rp-region="rp-cart-summary"></div>` printed in place of the totals part).

Host-owned regions and masks: the accelerated part's children (`{ "select": ".rp-cart-summary-accelerated", "op": "children" }`). Masks: `{ "select": ".rp-cart-summary-row dd bdi", "op": "text" }`, `{ "select": ".rp-cart-summary-remove", "op": "attr", "name": "action" }`, `{ "select": "a.rp-checkout-button", "op": "attr", "name": "href" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-rp-refresh` | root | server | always | `rp-cart-summary` |
| `data-pending` | root | `rp-cart` | the cart store is busy | absent |
| `aria-busy` | root | `rp-cart` | the cart store is busy (`"true"`) | absent |
| `aria-busy` | totals | commerce adapter | region `rp-cart-summary` is refreshing (`"true"`) | absent |
| `data-row` | row | server | always | `subtotal`, `discount` or `total` |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-cart", "attrs": ["data-pending", "aria-busy"], "reason": "The store may already hold a pending mutation when the element upgrades." }`, `{ "select": "[data-rp-region]", "attrs": ["aria-busy"], "childList": true, "text": true, "subtree": true, "reason": "A refresh that completes during upgrade replaces the region content." }`, `{ "select": ".rp-cart-summary-accelerated", "attrs": ["style", "class"], "childList": true, "text": true, "subtree": true, "reason": "Platform wallet scripts build the express checkout buttons on the client." }`, `{ "select": "[data-rp-part=\"status\"]", "text": true, "reason": "The status part announces a mutation that completed during upgrade." }`.

### Behaviour with JavaScript

1. After every cart mutation the adapter refreshes region `rp-cart-summary`; the totals part is replaced by the server's rendering (React: re-rendered from the store).
2. The remove form of a discount row is intercepted by `rp-cart` and sent as `discount-remove`; on success `Discount removed` is written to the status part of this root.
3. The checkout control is never intercepted: hydrogen backend it is a link; liquid backend its submitter name is `checkout`.
4. The accelerated part is filled by Shopify's scripts; Ripple does not touch it.

### Behaviour without JavaScript

Totals are the server-rendered values. hydrogen backend: the remove form posts `intent=discount-remove` and the page re-renders; the checkout link navigates to `checkoutUrl`. liquid backend: the remove form is hidden (`data-rp-js="inflow"`; there is no no-JS discount removal on Liquid, D-043), the code text stays visible; the checkout button submits the cart form with `name="checkout"`, which also saves edited quantities and the note.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: description list; `checkPattern`: none.
- Accessible name: none on root. Remove button: `aria-label="Remove discount <code>"`; required.
- Focus: after the focused remove button disappears with the refresh, the adapter focuses the first focusable element of the region (the next remove button or the checkout control).
- Announcements: `Discount removed` through the status part (`role="status"`).

| Key | Action |
|---|---|
| Enter, Space on a remove button | removes that code |

### Styling

- File: `components/cart-summary/cart-summary.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-foreground`, `--color-muted-foreground`, `--text-sm`, `--text-lg`, `--font-weight-semibold`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-cart-summary-gap` | `calc(var(--spacing) * 3)` | space between rows, note and checkout |
| `--rp-cart-summary-busy-opacity` | `0.6` | opacity of the totals while refreshing |

| Modifier selector | Sets |
|---|---|
| `.rp-cart-summary-totals[aria-busy="true"]` | `--rp-cart-summary-opacity: var(--rp-cart-summary-busy-opacity)` |
| `.rp-cart-summary-row[data-row="total"]` | `--rp-cart-summary-row-size: var(--text-lg)`, `--rp-cart-summary-row-weight: var(--font-weight-semibold)` |

Required rules: root `display: block`; totals `display: flex; flex-direction: column; gap: var(--rp-cart-summary-gap); opacity: var(--rp-cart-summary-opacity, 1)`; `.rp-cart-summary-rows { margin: 0; display: flex; flex-direction: column; gap: var(--rp-cart-summary-gap) }`; row `display: flex; justify-content: space-between; align-items: center`; `.rp-cart-summary-row dd { margin: 0 }`; `.rp-cart-summary-totals:empty { display: none }`; `.rp-cart-summary-accelerated { margin-block-start: var(--rp-cart-summary-gap) }`.

### Host notes

- HTML: copy the `default` contract.
- React: file `cart-summary.tsx`, `"use client";`. `CartSummary(props: { cart: RippleCart; cartLines?: string; acceleratedCheckout?: boolean; locale?: string; className?: string; children?: ReactNode })` and `CartSummaryTotals(props: { cart: RippleCart; cartLines?: string; locale?: string })`. `CartSummaryTotals` reads the live cart with `useCart` (server value: the `cart` prop) and `toRippleCart` from `./cart-lines.data` (CV-10). Discount rows: `cart.discountCodes.filter((d) => d.applicable)`. Accelerated part: `<div className="rp-cart-summary-accelerated" data-agent-confirm={strings?.agentConfirmAccelerated ?? "Pays for this cart now with an express checkout"} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: renderShopPayButton({}) }} />` with `renderShopPayButton` imported from `@shopify/hydrogen` (`hydrogen/packages/hydrogen/skills/hydrogen-shop-pay/SKILL.md`; a value import allowed by D-094, CV-9). `CartSummary` also takes `strings?: { agentConfirmAccelerated?: string }` (CV-2).
- Remix: prop `rmxKey?: string` prints `data-rmx-key` on root (omitted when unset; CV-5, D-034). The checkout link carries `data-rmx-document` (CheckoutButton).
- Liquid: discount rows: `{% for d in cart.cart_level_discount_applications %}{% if d.type == 'discount_code' %}` with code `d.title`. Subtotal `cart.items_subtotal_price | money`; total `cart.total_price | money`. Empty test: `cart.item_count == 0`. Accelerated part: `{% if additional_checkout_buttons %}<div class="rp-cart-summary-accelerated" data-agent-confirm="{{ 'ripple.cart-summary.agent_confirm_accelerated' | t }}">{{ content_for_additional_checkout_buttons }}</div>{% endif %}` (both objects are in the component scope of the Liquid subset, D-097). The root is not printed by `{% form %}`, so it prints `{{ attributes }}` last (D-035). The region-part snippet `rp-cart-summary-totals` takes exactly the params `cart` and `cart_lines`; EVERY call passes both (D-091 item 4), `cart_lines` being the `cart_lines` param of the block (blank when there is no CartLines on the page). No schema settings. Locale keys: `ripple.cart-summary.subtotal` = `Subtotal`; `ripple.cart-summary.discount` = `Discount`; `ripple.cart-summary.total` = `Total`; `ripple.cart-summary.note` = `Taxes and shipping calculated at checkout.`; `ripple.cart-summary.remove_discount` = `Remove discount {{ code }}`; `ripple.cart-summary.agent_confirm_accelerated` = `Pays for this cart now with an express checkout`.

```tsx
<CartSummary cart={cart} cartLines="cart" />
```

```liquid
{% block 'cart-summary', cart_lines: 'cart' %}
  {% partial 'rp-cart-summary' %}{% render 'rp-cart-summary-totals', cart: cart, cart_lines: 'cart' %}{% endpartial %}
{% endblock %}
```

### Commerce

- Store fields read: `state.data.cost`, `state.data.discountCodes`, `state.data.checkoutUrl`, `state.data.totalQuantity`, `isBusy(state)`.
- Adapter methods called: `submitCart` (discount remove), `usable`; the adapter calls `refresh(["rp-cart-summary"], { reason: "cart" })`.
- Regions refreshed: `rp-cart-summary`.
- Pending and error behaviour: root `data-pending` / `aria-busy`; no error part (a failed removal shows in the cart-scope error part of CartLines).

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Subtotal | `cart.cost.subtotalAmount` | `cart.items_subtotal_price` |
| Total | `cart.cost.totalAmount` | `cart.total_price` |
| Applied codes | `cart.discountCodes` where `applicable` | `cart.cart_level_discount_applications` where `type == 'discount_code'`, code = `title` |
| Remove code | `<form method="post" action="/api/cart">`, hidden `discountCode`, submit `name="intent" value="discount-remove"` | same markup, `action="{{ routes.cart_url }}"`, `data-rp-js="inflow"` on the form |
| Checkout | `<a href="<checkoutUrl>">` | `<button type="submit" name="checkout" form="<cart_lines>-form">` |

### Agent surface

`bridge`; component `rp-cart`. The manifest `agent.actions` of every `rp-cart` component is `["setQuantity", "remove"]` ([08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.2, D-095): `setQuantity(line: string, quantity: number): void` and `remove(line: string): void`, where `line` is the value of a `data-rp-line` attribute, and `items: (api) => api.lines()` returns `RippleSortOption[]`. This root prints no line, so both actions throw `"rp-cart: nothing to setQuantity here"` / `"rp-cart: nothing to remove here"` and `items` is empty. Discount removal has no bridge action (doc 08 rule A-5); an agent uses the remove button through the accessibility tree. Confirm: the CheckoutButton inside (`data-agent-confirm`, REQUIRED); in fixture `accelerated` the wrapper `.rp-cart-summary-accelerated` carries `data-agent-confirm="Pays for this cart now with an express checkout"` (doc 08 section 7.3; locale key `ripple.cart-summary.agent_confirm_accelerated`). The attribute is never on the `rp-cart` root. Secret: none.

### Checker rules

RP104 (`cart`), RP301, RP305, RP306, RP308 (the root is outside the region it refreshes: an error for `rp-cart`, D-102), RP320, RP403 (Liquid: partial `rp-cart-summary`). Manifest `rules[]`: `cart-summary-region` (`requires-descendant`, selector `:scope`, target `[data-rp-region="rp-cart-summary"]`); `cart-summary-no-error` (`forbids-descendant`, selector `:scope`, target `[data-rp-part="error"]`); `cart-summary-accelerated-outside-region` (`forbids-descendant`, selector `[data-rp-region]`, target `.rp-cart-summary-accelerated`).

### Acceptance tests

1. Tier 2: `default`, `two-lines`, `accelerated`, `class`, `children` (hydrogen hosts), the `liquid-*` variants (shim) and `empty` (all hosts) are canonical-equal with the masks above.
2. Tier 5: submitting a remove form produces one store call with intent `discount-remove` and the code, one refresh of `rp-cart-summary`, and the status part text `Discount removed`.
3. Tier 5: starting from `cart.empty`, after an add and the refresh the region contains a checkout control whose `href` (hydrogen) equals the store's `checkoutUrl`.
4. Tier 5: a click on the checkout control is not prevented (`defaultPrevented` is false) in both backends.
5. Tier 6: hydrogen dev server, scripting disabled: the remove form posts and the re-rendered page has no discount row. Liquid shim: the remove form is not displayed.

### Evidence and UNVERIFIED

- Evidence: [05-commerce.md](05-commerce.md) sections 6.2, 7.1, 9.1 (code list inside `rp-cart-summary`); `hydrogen/packages/hydrogen/src/core/cart/queries.ts`; Liquid `cart.cart_level_discount_applications` (Shopify docs tool, this session); `ripple/theme/snippets/cart-discount-list.liquid`.
- UNVERIFIED: the `discount_application.type` value `discount_code`; that discount codes applied at line level appear in `cart.cart_level_discount_applications` (if not, those codes are not listed on Liquid; doc 14 owns the correction); `renderShopPayButton({})` with an empty options object.

### Fallback (SPIKE-nn)

None.

---

## CartNote

| Field | Value |
|---|---|
| Id | `cart-note` |
| Kind | `commerce` |
| Category | `cart` |
| Custom elements | `rp-cart` |
| Root element and class | `rp-cart` `.rp-cart-note` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes (printed on the textarea) |
| Depends on | `label`, `textarea`, `button`, `form-message` |
| Milestone | M3 |

### Purpose

A textarea for the order note, saved to the cart.

- Use when: the merchant wants a free-text note on the order, on the cart page or in CartDrawer.
- Do not use when: collecting structured data (use cart attribute inputs, [05-commerce.md](05-commerce.md) section 6.2) or per-line data (line item properties in ProductForm).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CartNote` | `blocks/cart-note.liquid` + `snippets/rp-cart-note.liquid` | `rp-cart` | `rp-cart-note` | `data-slot="rp-cart"` | yes | none |
| form | printed by root | same | `form` (hydrogen) or `div` (liquid) | `rp-cart-note-form` | none | yes | none |
| label | printed by root | same | `label` | `rp-label` | none | yes | none |
| field | printed by root | same | `textarea` | `rp-textarea` | `data-rp-field="note"` | yes | `<id>` |
| save (hydrogen backend only) | printed by root | same | `button` | `rp-button` | `data-rp-part="submit"`, `data-rp-js="fallback"` | yes on hydrogen | none |
| error | printed by root | same | `p` | `rp-form-message` | `data-rp-part="error"` | yes | none |
| status | printed by root | same | `p` | `rp-visually-hidden` | `data-rp-part="status"`, `role="status"` | yes | none |

Nesting rules: root children in order: the form part, status. Form children in order: label, field, save, error. The root MUST NOT carry `data-rp-refresh`. On Liquid the field joins the cart form of CartLines through `form="<cart_lines>-form"`; the root MUST NOT be inside that form's region.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on the field; `for` on the label |
| `cart` | `cart` | object | `RippleCart` / Liquid `cart` drop | Liquid: the global `cart` | yes (TSX) | no | text content of the field (`cart.note`) |
| `cartLines` | `cart_lines` | string | the `id` of the CartLines on the page | none | yes on Liquid | no | Liquid: `form="<value>-form"` on the field; ignored on hydrogen hosts |
| `rows` | `rows` | number | integer 1 or greater | `3` | no | no | `rows` on the field |

### Content model

`text` - the label text. Default `Order note`.

### HTML contract

Fixture `default` (`id`: `note`, `cart`: `cart.two-lines`; hosts `html`, `react`, `remix`):

```html
<rp-cart class="rp-cart-note" data-slot="rp-cart">
  <form class="rp-cart-note-form" method="post" action="/api/cart">
    <label class="rp-label" for="note">Order note</label>
    <textarea class="rp-textarea" id="note" name="note" rows="3" data-size="md" data-rp-field="note"></textarea>
    <button class="rp-button" type="submit" name="intent" value="note-update" data-variant="outline" data-size="sm" data-rp-part="submit" data-rp-js="fallback">Save note</button>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  </form>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

Fixture `liquid-default` (`id`: `note`, `cart_lines`: `cart`; host `liquid`):

```html
<rp-cart class="rp-cart-note" data-slot="rp-cart">
  <div class="rp-cart-note-form">
    <label class="rp-label" for="note">Order note</label>
    <textarea class="rp-textarea" id="note" name="note" rows="3" form="cart-form" data-size="md" data-rp-field="note"></textarea>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  </div>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

Further required fixtures (both variants): `with-note` (cart note `Leave at the door <3`; textarea content `Leave at the door &lt;3`); `children` (children `Gift message`; label text `Gift message`); `rows` (`rows`: `5`); `class` (root class `rp-cart-note custom-a custom-b`).

Host-owned regions and masks: none beyond the two variants. Mask: `{ "select": "form.rp-cart-note-form", "op": "attr", "name": "action" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-pending` | root | `rp-cart` | the cart store is busy | absent |
| `aria-busy` | root | `rp-cart` | the cart store is busy (`"true"`) | absent |
| `hidden` | error | `rp-cart` | no cart-scope error | present |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-cart", "attrs": ["data-pending", "aria-busy"], "reason": "The store may already hold a pending mutation when the element upgrades." }`, `{ "select": "[data-rp-part=\"error\"]", "attrs": ["hidden"], "text": true, "reason": "The error part shows the result of a mutation that completed during upgrade." }`, `{ "select": "[data-rp-part=\"status\"]", "text": true, "reason": "The status part announces a mutation that completed during upgrade." }`.

### Behaviour with JavaScript

1. On `change` of the field (blur after an edit), `rp-cart` calls `form.requestSubmit(<the submit part of the field's form>)`. hydrogen backend: the form is the CartNote form; its submit is intercepted and sent as `note-update`. liquid backend: the field's form is the cart form in CartLines; the CartLines root intercepts the submit and `translateLiquidForm` yields a `note-update` op because the note differs from its `defaultValue`.
2. On success `Note saved` is written to the status part of the root that handled the submit (hydrogen: this root; liquid: the CartLines root). A failure shows in the error part (cart scope; the same message also appears in the CartLines error part).
3. The Save button (hydrogen) is hidden once the document is ready (`data-rp-js="fallback"`).

### Behaviour without JavaScript

hydrogen backend: `Save note` posts `intent=note-update`; 303 back to the page. liquid backend: the note is sent with the cart form when the buyer presses `Update cart` or the checkout button.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: labelled textarea; `checkPattern`: none.
- Accessible name: the label (`for` = field id); required.
- Focus: nothing moves focus.
- Announcements: `Note saved` through the status part; errors through `role="alert"`.

| Key | Action |
|---|---|
| Tab out of the edited field | saves the note |

### Styling

- File: `components/cart-note/cart-note.css` (layer `rp.components`).
- Tokens used: `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-cart-note-gap` | `calc(var(--spacing) * 2)` | space between label, field, button and message |

| Modifier selector | Sets |
|---|---|
| None | |

Required rules: root `display: block`; `.rp-cart-note-form { display: flex; flex-direction: column; align-items: stretch; gap: var(--rp-cart-note-gap) }`; `.rp-cart-note-form > .rp-button { align-self: flex-start }`.

### Host notes

- HTML: copy the `default` contract.
- React: `CartNote(props: { id: string; cart: RippleCart; cartLines?: string; rows?: number; className?: string; children?: ReactNode })`. No hook, no directive. The field is the embedded Textarea: `<Textarea id={id} name="note" rows={rows} defaultValue={cart.note} rpField="note" />` (uncontrolled; `data-rp-field` through `rpField`, section 0.2). The save button is printed by the binding itself (section 0.2). The error part carries `suppressHydrationWarning`.
- Remix: `data-rmx-key="<id>"` on root.
- Liquid: the field is `{% render 'rp-textarea', id: id, name: 'note', rows: rows, default_value: cart.note, rp_field: 'note', form_id: form_id %}` with `form_id` assigned as `cart_lines | append: '-form'`; `form_id` prints the native `form` attribute (D-020) and `rp_field` prints `data-rp-field`; neither is passed through `attributes`. Field content is `{{ cart.note }}` (escaped by Textarea). The root prints `{{ attributes }}` last (D-035). `cart_lines` is required; when it is blank the binding prints the field without a `form` attribute and `ripple check` reports the rule below. No schema settings. Locale keys: `ripple.cart-note.label` = `Order note`; `ripple.cart-note.save` = `Save note`; `ripple.cart-note.saved` = `Note saved`.

```tsx
<CartNote id="note" cart={cart} />
```

```liquid
{% block 'cart-note', id: 'note', cart_lines: 'cart' %}{% endblock %}
```

### Commerce

- Store fields read: `state.errors`, `isBusy(state)`.
- Adapter methods called: `submitCart`, `usable`.
- Regions refreshed: none declared (the CartLines and CartSummary roots declare theirs; no visible change is expected).
- Pending and error behaviour: root flags; one cart-scope error part.

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Form | own `<form method="post" action="/api/cart">` | none; the field carries `form="<cart_lines>-form"` |
| Field | `name="note"` | `name="note"` |
| Submit | `name="intent" value="note-update"` | the cart form's `name="update"` or `name="checkout"` button |

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP104 (`id`, `cart`), RP301, RP305. Manifest `rules[]`: `cart-note-field` (`requires-descendant`, selector `:scope`, target `textarea[name="note"][data-rp-field="note"]`); `cart-note-error` (`requires-descendant`, selector `:scope`, target `[data-rp-part="error"]`); `cart-note-submit-path` (`requires-descendant`, selector `:scope`, target `form [data-rp-part="submit"], textarea[form]`; "A CartNote has no way to save: on Liquid pass cart_lines; on other hosts keep the Save button."); `cart-note-label` (`requires-descendant`, selector `:scope`, target `label[for]`).

### Acceptance tests

1. Tier 2: `default`, `with-note`, `children`, `rows`, `class` (hydrogen hosts) and the `liquid-*` variants (shim) are canonical-equal with the mask above.
2. Tier 5: [05-commerce.md](05-commerce.md) test C-08 (note `change` sends one call carrying the note); the status part then contains `Note saved`.
3. Tier 5 (Liquid shim): the textarea's `form` property is the element `#cart-form`, and a change of the note leads to exactly one `updateCart` call carrying `note`.
4. Tier 6: hydrogen dev server, scripting disabled: typing a note and pressing `Save note` re-renders the page with the note in the textarea.

### Evidence and UNVERIFIED

- Evidence: [05-commerce.md](05-commerce.md) sections 6.2 (note markup), 7.1 (`change` row), 9.1.
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---

## DiscountCode

| Field | Value |
|---|---|
| Id | `discount-code` |
| Kind | `commerce` |
| Category | `cart` |
| Custom elements | `rp-cart` |
| Root element and class | `rp-cart` `.rp-discount-code` |
| Liquid tier | `resource` |
| No-JS level | `degraded` (manifest `noJs.level`, D-005). On the liquid backend the form is hidden without JavaScript and codes are entered at checkout (D-092); on the hydrogen backend the form posts natively. |
| Requires `id` | yes (printed on the input) |
| Depends on | `label`, `input`, `button`, `form-message` |
| Milestone | M3 |

### Purpose

A form to apply one discount code to the cart. Applied codes are listed, with their remove buttons, by CartSummary.

- Use when: the cart page or drawer should accept a discount code before checkout.
- Do not use when: there is no CartSummary on the page (the buyer would not see the applied code), or for gift cards (not supported in V1).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `DiscountCode` | `blocks/discount-code.liquid` + `snippets/rp-discount-code.liquid` | `rp-cart` | `rp-discount-code` | `data-slot="rp-cart"` | yes | none |
| form | printed by root | same | `form` | `rp-discount-code-form` | liquid: `data-rp-js="inflow"` | yes | none |
| label | printed by root | same | `label` | `rp-label` | none | yes | none |
| row | printed by root | same | `div` | `rp-discount-code-row` | none | yes | none |
| field | printed by root | same | `input` | `rp-input` | `data-rp-field="discount-code"` | yes | `<id>` |
| apply | printed by root | same | `button` | `rp-button` | `data-rp-part="submit"` | yes | none |
| error | printed by root | same | `p` | `rp-form-message` | `data-rp-part="error"` | yes | none |
| status | printed by root | same | `p` | `rp-visually-hidden` | `data-rp-part="status"`, `role="status"` | yes | none |

Nesting rules: root children in order: the form, status. Form children in order: label, row, error. Row children in order: field, apply. The error part MUST be inside the form (that position gives it the discount scope, [05-commerce.md](05-commerce.md) section 9.2). The root MUST NOT carry `data-rp-refresh`. On Liquid the root MUST NOT be inside the cart form of CartLines (nested forms are invalid).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on the field; `for` on the label |
| `placeholder` | `placeholder` | string | any text | none | no | no | `placeholder` on the field |

The component takes no `cart` prop: it prints nothing that depends on the cart.

### Content model

`text` - the label text. Default `Discount code`.

### HTML contract

Fixture `default` (`id`: `discount`; hosts `html`, `react`, `remix`):

```html
<rp-cart class="rp-discount-code" data-slot="rp-cart">
  <form class="rp-discount-code-form" method="post" action="/api/cart">
    <label class="rp-label" for="discount">Discount code</label>
    <div class="rp-discount-code-row">
      <input class="rp-input" id="discount" type="text" name="discountCode" autocomplete="off" required data-size="md" data-rp-field="discount-code" autocapitalize="characters" spellcheck="false">
      <button class="rp-button" type="submit" name="intent" value="discount-apply" data-variant="outline" data-size="md" data-rp-part="submit">Apply</button>
    </div>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  </form>
  <p class="rp-visually-hidden" data-rp-part="status" role="status"></p>
</rp-cart>
```

Fixture `liquid-default` (`id`: `discount`; host `liquid`): identical to `default` except the opening tag of the form, which is:

```html
  <form class="rp-discount-code-form" method="post" action="/cart" data-rp-js="inflow">
```

`data-rp-js` is a Ripple-owned attribute and MUST NOT be masked (D-074); that is why the fixture is backend-scoped (FX-2).

Further required fixtures, each in the two backend variants (`<name>` and `liquid-<name>`): `placeholder` (`placeholder`: `SAVE10`); `children` (children `Promo code`); `class` (root class `rp-discount-code custom-a custom-b`); `escaping` (`placeholder`: `Say "hi" & <go>`).

Host-owned regions and masks: `{ "select": "form.rp-discount-code-form", "op": "attr", "name": "action" }`. No other mask.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-pending` | root | `rp-cart` | the cart store is busy | absent |
| `aria-busy` | root | `rp-cart` | the cart store is busy (`"true"`) | absent |
| `hidden` | error | `rp-cart` | no discount-scope error | present |
| `data-rp-js` | form | server | liquid backend only | `inflow` |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-cart", "attrs": ["data-pending", "aria-busy"], "reason": "The store may already hold a pending mutation when the element upgrades." }`, `{ "select": "[data-rp-part=\"error\"]", "attrs": ["hidden"], "text": true, "reason": "The error part shows the result of a mutation that completed during upgrade." }`, `{ "select": "[data-rp-part=\"status\"]", "text": true, "reason": "The status part announces a mutation that completed during upgrade." }`.

### Behaviour with JavaScript

1. Submitting the form is intercepted by `rp-cart` and sent as `discount-apply` with the trimmed field value. An empty value is blocked by the native `required` validation.
2. On success: `Discount applied` is written to the status part, the regions of the page's `rp-cart` roots refresh (the code appears in CartSummary), and the field is cleared by `form.reset()`.
3. When Shopify does not accept the code, the store records a discount error and the error part shows its message (for example the API's own text), `hidden` removed. The field keeps its value and focus stays on the Apply button.
4. Only one code is sent per submit (the hydrogen intent applies one code; `hydrogen/packages/hydrogen/src/core/cart/queries.ts`).

Step 2's `form.reset()`: UNVERIFIED that `rp-cart` resets the form after `discount-apply`; [05-commerce.md](05-commerce.md) does not state it. If it does not, the field keeps the code until the next navigation; this is acceptable and the test below does not assert the reset.

### Behaviour without JavaScript

hydrogen backend: the form posts `intent=discount-apply` to `/api/cart`; 303 back; the code is listed in CartSummary. liquid backend: the form is not displayed (`data-rp-js="inflow"`, D-021); the buyer enters the code at checkout.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: labelled text field with a submit button; `checkPattern`: none.
- Accessible name: the label; required. Apply button: its text.
- Focus: stays on the Apply button or the field after submit.
- Announcements: `Discount applied` through the status part; errors through `role="alert"`.

| Key | Action |
|---|---|
| Enter in the field | applies the code |

### Styling

- File: `components/discount-code/discount-code.css` (layer `rp.components`).
- Tokens used: `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-discount-code-gap` | `calc(var(--spacing) * 2)` | space between label, row and message, and between field and button |

| Modifier selector | Sets |
|---|---|
| None | |

Required rules: root `display: block`; `.rp-discount-code-form { display: flex; flex-direction: column; gap: var(--rp-discount-code-gap) }`; `.rp-discount-code-row { display: flex; gap: var(--rp-discount-code-gap) }`; `.rp-discount-code-row > .rp-input { flex: 1 1 auto; min-inline-size: 0 }`.

### Host notes

- HTML: copy the contract.
- React: `DiscountCode(props: { id: string; placeholder?: string; strings?: { label?: string; apply?: string }; className?: string; children?: ReactNode })`. No hook, no directive. The field is the embedded Input: `<Input id={id} name="discountCode" autoComplete="off" required rpField="discount-code" placeholder={placeholder} autoCapitalize="characters" spellCheck={false} />` (`data-rp-field` through `rpField`; `autoCapitalize` and `spellCheck` are native attributes passed as rest props). Uncontrolled input. The apply button is printed by the binding itself (section 0.2). Error part with `suppressHydrationWarning`.
- Remix: `data-rmx-key="<id>"` on root.
- Liquid: a plain `<form class="rp-discount-code-form" method="post" action="{{ routes.cart_url }}" data-rp-js="inflow">` (not `{% form %}`); `data-rp-js="inflow"` is on the `<form>` itself and the submitter carries `name="intent"` (D-092, ledger 4.4). The field is `{% render 'rp-input', id: id, name: 'discountCode', auto_complete: 'off', required: true, rp_field: 'discount-code', placeholder: placeholder, attributes: 'autocapitalize="characters" spellcheck="false"' %}`. The root prints `{{ attributes }}` last (D-035). No schema settings. Locale keys: `ripple.discount-code.label` = `Discount code`; `ripple.discount-code.apply` = `Apply`; `ripple.discount-code.applied` = `Discount applied`; `ripple.discount-code.removed` = `Discount removed`.

```tsx
<DiscountCode id="discount" />
```

```liquid
{% block 'discount-code', id: 'discount' %}{% endblock %}
```

### Commerce

- Store fields read: `state.errors` (discount group), `isBusy(state)`.
- Adapter methods called: `submitCart`, `usable`.
- Regions refreshed: none declared; the CartSummary root on the page declares `rp-cart-summary`, where the code list lives.
- Pending and error behaviour: root flags; one discount-scope error part.

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Form | `<form method="post" action="/api/cart">` | `<form method="post" action="{{ routes.cart_url }}" data-rp-js="inflow">` |
| Code field | `name="discountCode"` | `name="discountCode"` (read through `data-rp-field`; never posted to Shopify) |
| Apply | `name="intent" value="discount-apply"` | `name="intent" value="discount-apply"` (tells `translateLiquidForm` to read by hook) |

### Agent surface

`bridge`; component `rp-cart`. The manifest `agent.actions` of every `rp-cart` component is `["setQuantity", "remove"]` ([08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.2, D-095): `setQuantity(line: string, quantity: number): void` and `remove(line: string): void`, where `line` is the value of a `data-rp-line` attribute, and `items: (api) => api.lines()` returns `RippleSortOption[]`. This root prints no line, so both actions throw `"rp-cart: nothing to setQuantity here"` / `"rp-cart: nothing to remove here"` and `items` is empty. Applying a code has no bridge action (doc 08 rule A-5); an agent fills the field and presses Apply through the accessibility tree. Confirm: none. Secret: none.

### Checker rules

RP104 (`id`), RP301, RP305. Manifest `rules[]`: `discount-code-field` (`requires-descendant`, selector `form`, target `input[data-rp-field="discount-code"]`); `discount-code-error-in-form` (`requires-descendant`, selector `form`, target `[data-rp-part="error"]`); `discount-code-not-in-form` (`forbids-ancestor`, selector `:scope`, target `form`; "A DiscountCode is inside another form; nested forms are invalid HTML."); `discount-code-label` (`requires-descendant`, selector `:scope`, target `label[for]`).

### Acceptance tests

1. Tier 2: `default`, `placeholder`, `children`, `class`, `escaping` (hydrogen hosts) and their `liquid-*` variants (shim) are canonical-equal with the mask above.
2. Tier 5: [05-commerce.md](05-commerce.md) test C-03 (Liquid discount form sends `{ discountCodes: ["SAVE10"] }`); the status part then contains `Discount applied`. A rejected code shows its message in this error part and the CartLines cart-scope error part stays hidden.
3. Tier 5 (Liquid shim): the form has `data-rp-js="inflow"`; with scripting disabled its computed `display` is `none`.
4. Tier 6: hydrogen dev server, scripting disabled: applying `SAVE10` re-renders the page with a discount row in CartSummary.

### Evidence and UNVERIFIED

- Evidence: [05-commerce.md](05-commerce.md) sections 6.2 (discount forms), 9.2 (discount scope); D-043, D-092; `ripple/theme/snippets/cart-discount-code.liquid`.
- UNVERIFIED: the form reset after a successful apply (see above); the discount application type on Liquid (SPIKE-02, D-092).

### Fallback (SPIKE-nn)

None.

---

## CheckoutButton

| Field | Value |
|---|---|
| Id | `checkout-button` |
| Kind | `static` |
| Category | `cart` |
| Custom elements | none |
| Root element and class | hydrogen backend: `a` `.rp-button.rp-checkout-button`; liquid backend: `button` `.rp-button.rp-checkout-button` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `button` |
| Milestone | M3 |

### Purpose

The control that takes the buyer to Shopify checkout (D-050). It composes Button by contract (D-070; class pair `rp-button rp-checkout-button`, section 0.2) and adds the backend's checkout semantics and the agent confirmation sentence.

- Use when: leaving the cart for checkout. CartSummary prints it; use it directly only in a custom summary.
- Do not use when: adding to cart (AddToCartButton) or for accelerated wallets (`acceleratedCheckout` on ProductForm and CartSummary).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `CheckoutButton` | `blocks/checkout-button.liquid` + `snippets/rp-checkout-button.liquid` | `a` (hydrogen) or `button` (liquid) | `rp-button rp-checkout-button` | `data-agent-confirm` | yes | none |
| own form (liquid backend, only when `cart_lines` is blank) | printed by root | same | `form` | `rp-checkout-button-form` | none | no | none |

Nesting rules: hydrogen backend: no restriction except that it MUST NOT be inside an `<a>` or `<button>`. liquid backend with `cart_lines`: anywhere in the document, but NOT inside another `<form>` (it joins the cart form by the `form` attribute). liquid backend without `cart_lines`: the binding wraps the button in its own form; that wrapper MUST NOT be inside another form.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `href` | none | url | the cart's `checkoutUrl` | none | yes (hydrogen hosts) | no | `href`; TSX and HTML hosts only |
| none | `cart_lines` | string | the `id` of the CartLines on the page | none | no | no | `form="<value>-form"`; Liquid only |
| `variant` | `variant` | enum | `primary secondary outline ghost link destructive` | `primary` | no | no | `data-variant` |
| `size` | `size` | enum | `sm md lg` | `lg` | no | no | `data-size` |
| `fullWidth` | `full_width` | boolean | `true false` | `true` | no | no | `data-full-width=""` |
| `disabled` | `disabled` | boolean | `true false` | `false` | no | no | the control is inert (D-050 item d). `button`: `disabled`, printed directly before `data-variant`. `a`: NO `href`, and `aria-disabled="true"` printed directly after the class. The caller sets it when the cart is empty (CartSummary prints no CheckoutButton for an empty cart) |

Fixed attributes: `data-agent-confirm="Goes to checkout with this cart"` (REQUIRED in every host and both forms; D-050, D-095), printed last; liquid backend: `type="submit" name="checkout"`; Remix: `data-rmx-document` on the link (D-034; checkout is not an app route).

Attribute order (Button's order, [09-components-foundation.md](09-components-foundation.md), with the additions of this component): link: `class`, `href`, `aria-disabled`, `data-variant`, `data-size`, `data-full-width`, `data-rmx-document`, `data-agent-confirm`. Button: `class`, `type`, `name`, `form`, `disabled`, `data-variant`, `data-size`, `data-full-width`, `data-agent-confirm`.

The inert link differs on purpose from Button's own `disabled` link (which keeps `href` and adds `tabindex="-1"`): a link without `href` is not focusable and cannot navigate, so no `tabindex` is printed (D-050 item d).

### Content model

`text` - the label. Default `Check out`.

### HTML contract

Fixture `default` (`href`: `/checkout`; hosts `html`, `react`, `remix`):

```html
<a class="rp-button rp-checkout-button" href="/checkout" data-variant="primary" data-size="lg" data-full-width="" data-agent-confirm="Goes to checkout with this cart">Check out</a>
```

Fixture `liquid-default` (`cart_lines`: `cart`; host `liquid`):

```html
<button class="rp-button rp-checkout-button" type="submit" name="checkout" form="cart-form" data-variant="primary" data-size="lg" data-full-width="" data-agent-confirm="Goes to checkout with this cart">Check out</button>
```

Fixture `liquid-standalone` (no params; host `liquid`):

```html
<form class="rp-checkout-button-form" method="post" action="/cart">
  <button class="rp-button rp-checkout-button" type="submit" name="checkout" data-variant="primary" data-size="lg" data-full-width="" data-agent-confirm="Goes to checkout with this cart">Check out</button>
</form>
```

Fixture `disabled` (`href`: `/checkout`, `disabled`: true; hosts `html`, `react`, `remix`):

```html
<a class="rp-button rp-checkout-button" aria-disabled="true" data-variant="primary" data-size="lg" data-full-width="" data-agent-confirm="Goes to checkout with this cart">Check out</a>
```

Fixture `liquid-disabled` (`cart_lines`: `cart`, `disabled`: true; host `liquid`):

```html
<button class="rp-button rp-checkout-button" type="submit" name="checkout" form="cart-form" disabled data-variant="primary" data-size="lg" data-full-width="" data-agent-confirm="Goes to checkout with this cart">Check out</button>
```

Further required fixtures (both variants): `children` (children `Pay now`); `inline` (`fullWidth`: false, `size`: `md`, `variant`: `secondary`; no `data-full-width`, `data-size="md"`, `data-variant="secondary"`); `class` (class `rp-button rp-checkout-button custom-a custom-b`); `invalid-enum-falls-back` (`size`: `huge`; equals the default of the variant).

Host-owned regions and masks: `{ "select": "a.rp-checkout-button", "op": "attr", "name": "href" }`; `{ "select": "form.rp-checkout-button-form", "op": "attr", "name": "action" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-agent-confirm` | root | server | always | `Goes to checkout with this cart` |
| `disabled` (button), `aria-disabled` and absent `href` (link) | root | server | prop `disabled` is true | absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None. `rp-cart` never intercepts a submitter named `checkout` and never intercepts links; the navigation is native in every host.
2. A host agent MUST ask the user for confirmation before activating an element with `data-agent-confirm` (D-050, D-095; [08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.3). Whether the UI SDK bridge enforces this is UNVERIFIED (SPIKE-08).
3. With `disabled` the control does nothing: a disabled button does not submit; a link without `href` does not navigate.

### Behaviour without JavaScript

hydrogen backend: the link navigates to `checkoutUrl`. liquid backend: the button submits the cart form with `checkout`; Shopify saves the form's quantities and note and redirects to checkout.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: native link or native submit button; `checkPattern`: none.
- Accessible name: its text; required.
- Focus: one tab stop.
- Announcements: None.

| Key | Action |
|---|---|
| Enter (link); Enter, Space (button) | goes to checkout |

### Styling

- File: `components/checkout-button/checkout-button.css` (layer `rp.components`).
- Tokens used: none of its own; visuals come from `button.css`.

| Custom property | Default | Purpose |
|---|---|---|
| None | | |

| Modifier selector | Sets |
|---|---|
| None | |

Required rule: `.rp-checkout-button-form { display: contents }`. This is allowed by D-080 because a `<form>` is not a custom element root; D-080 forbids `display: contents` only on `rp-*` roots. Inert link: `.rp-checkout-button[aria-disabled="true"]` gets the disabled visuals of `button.css` (`pointer-events: none`).

### Host notes

- HTML: use the `default` contract with the cart's checkout URL.
- React: `CheckoutButton(props: { href: string; variant?: ButtonVariant; size?: "sm" | "md" | "lg"; fullWidth?: boolean; disabled?: boolean; strings?: { label?: string; agentConfirm?: string }; className?: string; children?: ReactNode })`. Compose by contract (D-070): the binding prints the `<a>` itself, `<a className={cx("rp-button", "rp-checkout-button", className)} href={disabled ? undefined : href} aria-disabled={disabled ? "true" : undefined} data-variant={variant} data-size={size} data-full-width={fullWidth ? "" : undefined} data-agent-confirm={agentConfirm} {...rest}>`; it does NOT render `<Button>`. No hook. The app MUST NOT wrap it in a router `<Link>`.
- Remix: the same element, with `data-rmx-document` (D-034).
- Liquid: `snippets/rp-checkout-button.liquid` prints the `<button>` itself (compose by contract, D-070; it does NOT call `{% render 'rp-button' %}`): `type="submit" name="checkout"`, then `form="{{ cart_lines }}-form"` when `cart_lines` is given (D-050 item c, D-092), then `disabled` when `disabled` is true, then Button's `data-*` attributes, then `data-agent-confirm`, then `{{ attributes }}` last (D-035). When `cart_lines` is blank it wraps the button in `<form class="rp-checkout-button-form" method="post" action="{{ routes.cart_url }}">`. Schema settings: `variant`, `size`. Locale keys: `ripple.checkout-button.label` = `Check out`; `ripple.checkout-button.agent_confirm` = `Goes to checkout with this cart`.
- Manifest: `root.class` is `rp-button rp-checkout-button`; `dependencies.components` is `["button"]`; `agent.confirm[]` as under Agent surface.

```tsx
<CheckoutButton href={cart.checkoutUrl} />
```

```liquid
{% block 'checkout-button', cart_lines: 'cart' %}{% endblock %}
```

### Commerce

None. (No element. The backend difference is D-050: link to `checkoutUrl` versus `name="checkout"` submit of the cart form.)

### Agent surface

`accessibility-tree`; actions: none. No bridge action named `checkout` exists (D-050; SPIKE-08). Confirm: REQUIRED. The root carries `data-agent-confirm="Goes to checkout with this cart"` in every host and both forms (locale key `ripple.checkout-button.agent_confirm`; doc 08 section 7.3). Manifest `agent.confirm[]`: `{ "select": "a.rp-checkout-button" }` and `{ "select": "button[name=\"checkout\"]" }`, each with that sentence (checker RP320). Secret: none.

### Checker rules

RP101 (`variant`, `size`), RP104 (`href` on hydrogen hosts), RP110 (class on `a` or `button` only), RP306 (Liquid: `name="checkout"`), RP320 (`data-agent-confirm` non-empty). Manifest `rules[]`: `checkout-button-not-nested` (`forbids-ancestor`, selector `a.rp-checkout-button`, target `a, button`); `checkout-button-form-target` (`requires-attribute`, selector `button.rp-checkout-button:not(form button)`, target `form`; "A Liquid CheckoutButton outside a form needs cart_lines so that it submits the cart form.").

### Acceptance tests

1. Tier 2: `default`, `disabled`, `children`, `inline`, `class`, `invalid-enum-falls-back` (hydrogen hosts) and `liquid-default`, `liquid-standalone`, `liquid-disabled` and the other `liquid-*` variants (shim) are canonical-equal with the masks above.
2. Tier 5: [05-commerce.md](05-commerce.md) test C-07: a click on the Liquid button inside an `rp-cart` page produces a native submit whose submitter name is `checkout` and no `updateCart` call.
3. Tier 5: `ripple check` on HTML with the `data-agent-confirm` attribute removed reports RP320.
4. Tier 6: scripting disabled: hydrogen dev server navigates to the checkout URL; Liquid shim receives a POST to `/cart` containing `checkout`.
5. Tier 2 and tier 5: fixture `disabled` has no `href` and is skipped by Tab; fixture `liquid-disabled` matches `:disabled` and a click sends no request.

### Evidence and UNVERIFIED

- Evidence: D-050; [05-commerce.md](05-commerce.md) section 6.2 (checkout); `ripple/docs/research/base-theme.md` (cart form with `name="checkout"`); `hydrogen/packages/hydrogen/src/core/cart/queries.ts` (`checkoutUrl`).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---

## Filters

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

## FilterGroup

| Field | Value |
|---|---|
| Id | `filter-group` |
| Kind | `static` |
| Category | `discovery` |
| Custom elements | none |
| Root element and class | `details` `.rp-filter-group` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `checkbox`, `swatch`, `price-range`, `visually-hidden` |
| Milestone | M3 |

### Purpose

One filter inside a Filters form: a native disclosure whose content is a list of checkboxes, or a PriceRange for the price filter.

- Use when: inside the groups part of Filters (Filters renders it; call it directly only in a custom groups part).
- Do not use when: outside a GET form inside an `rp-live` root; the controls would submit nothing.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `FilterGroup` | `blocks/filter-group.liquid` + `snippets/rp-filter-group.liquid` | `details` | `rp-filter-group` | none | yes | none |
| trigger | printed by root | same | `summary` | `rp-filter-group-trigger` | none | yes | none |
| count | printed by root | same | `span` | `rp-filter-group-count` | none | when at least one value is active | none |
| content | printed by root | same | `div` | `rp-filter-group-content` | none | yes | none |
| values | printed by root | same | `ul` | `rp-filter-group-values` | none | for type `list` | none |
| value | printed by root | same | `label` | `rp-filter-group-value` | none | one per value | none |
| value label | printed by root | same | `span` | `rp-filter-group-value-label` | none | one per value | none |
| value count | printed by root | same | `span` | `rp-filter-group-value-count` | none | one per value | none |

Nesting rules: root children in order: trigger, content. Trigger: the filter label text, then count. Content: for `list` one values `ul` with one `li` per value, each `li` containing one value `label`; for `price_range` one PriceRange. Value `label` children in order: the Checkbox input, an optional Swatch, value label, value count. The root MUST be inside a `<form method="get">`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `filter` | `filter` | object | `RippleFilter` / Liquid `filter` drop | none | yes | no | every part |
| `open` | `open` | boolean | `true false` | `true` | no | no | `open` on root |

### Content model

`none`.

### HTML contract

Fixture `default` (`filter`: the `Availability` filter of `filters.basic`):

```html
<details class="rp-filter-group" open>
  <summary class="rp-filter-group-trigger">Availability<span class="rp-filter-group-count">1<span class="rp-visually-hidden"> selected</span></span></summary>
  <div class="rp-filter-group-content">
    <ul class="rp-filter-group-values">
      <li><label class="rp-filter-group-value"><input class="rp-checkbox" type="checkbox" name="filter.v.availability" value="1" checked><span class="rp-filter-group-value-label">In stock</span><span class="rp-filter-group-value-count">(8)</span></label></li>
      <li><label class="rp-filter-group-value"><input class="rp-checkbox" type="checkbox" name="filter.v.availability" value="0"><span class="rp-filter-group-value-label">Out of stock</span><span class="rp-filter-group-value-count">(2)</span></label></li>
    </ul>
  </div>
</details>
```

Fixture `price` (`filter`: the `Price` filter of `filters.basic`):

```html
<details class="rp-filter-group" open>
  <summary class="rp-filter-group-trigger">Price<span class="rp-filter-group-count">1<span class="rp-visually-hidden"> selected</span></span></summary>
  <div class="rp-filter-group-content">
    <div class="rp-price-range">
      <label class="rp-price-range-field"><span class="rp-price-range-label">From</span><input class="rp-input" type="number" data-size="md" name="filter.v.price.gte" min="0" step="any" inputmode="decimal"></label>
      <label class="rp-price-range-field"><span class="rp-price-range-label">To</span><input class="rp-input" type="number" data-size="md" name="filter.v.price.lte" min="0" step="any" inputmode="decimal" value="50"></label>
    </div>
  </div>
</details>
```

Fixture `swatch-disabled` (`filter`: label `Color`; values `Blue` name `filter.v.option.color` value `Blue` count 3 not active swatch colour `#1d4ed8`; `Sand` value `Sand` count 0 not active swatch colour `#d6c7a1`; `open`: false):

```html
<details class="rp-filter-group">
  <summary class="rp-filter-group-trigger">Color</summary>
  <div class="rp-filter-group-content">
    <ul class="rp-filter-group-values">
      <li><label class="rp-filter-group-value"><input class="rp-checkbox" type="checkbox" name="filter.v.option.color" value="Blue"><span class="rp-swatch" data-size="md" data-radius="full" aria-hidden="true" style="--rp-swatch-fill:#1d4ed8"></span><span class="rp-filter-group-value-label">Blue</span><span class="rp-filter-group-value-count">(3)</span></label></li>
      <li><label class="rp-filter-group-value"><input class="rp-checkbox" type="checkbox" name="filter.v.option.color" value="Sand" disabled><span class="rp-swatch" data-size="md" data-radius="full" aria-hidden="true" style="--rp-swatch-fill:#d6c7a1"></span><span class="rp-filter-group-value-label">Sand</span><span class="rp-filter-group-value-count">(0)</span></label></li>
    </ul>
  </div>
</details>
```

Rules: the count part shows the number of active values (for a price range: `1` when `min` or `max` is set), and is not printed when that number is 0. A checkbox is `disabled` when its `count` is 0 and it is not active (an active value with count 0 stays enabled so that it can be removed). The value count text is the count in parentheses.

Further required fixtures: `class` (root class `rp-filter-group custom-a custom-b`); `escaping` (filter label `Say "hi" & <go>`).

Host-owned regions and masks: none.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `open` | root | server, then the browser | the disclosure is open | present when `open` is true |
| `checked` | checkbox | server, then the browser | the value is active | present when active |
| `disabled` | checkbox | server | count is 0 and not active | present or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None of its own. The native `<details>` opens and closes. A checkbox `change` is handled by the enclosing `rp-live` (Filters behaviour 1).
2. After a refresh the group is re-rendered with the server's `open` value; a group the buyer closed re-opens when `open` is true. This is accepted in V1.

### Behaviour without JavaScript

The disclosure works natively. Checkboxes are submitted by the form's `Apply filters` button.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: native disclosure containing native checkboxes; `checkPattern`: none.
- Accessible name: summary text (filter label plus `<n> selected`); each checkbox is named by its wrapping label: value label followed by the count text, for example `In stock (8)`. The Swatch is `aria-hidden`.
- Focus: summary, then each enabled checkbox, in DOM order.
- Announcements: None.

| Key | Action |
|---|---|
| Enter, Space on the summary | opens or closes the group |
| Space on a checkbox | toggles the value |

### Styling

- File: `components/filter-group/filter-group.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-border`, `--color-foreground`, `--color-muted-foreground`, `--color-primary`, `--color-primary-foreground`, `--radius-full`, `--text-sm`, `--text-xs`, `--font-weight-medium`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-filter-group-gap` | `calc(var(--spacing) * 2)` | space between values, and between the parts of a value |
| `--rp-filter-group-padding` | `calc(var(--spacing) * 3)` | block padding of trigger and content |

| Modifier selector | Sets |
|---|---|
| `.rp-filter-group[open]` | `--rp-filter-group-chevron-rotate: 180deg` |

Required rules: root `border-block-end: 1px solid var(--color-border)`; trigger `display: flex; align-items: center; justify-content: space-between; cursor: pointer; list-style: none; min-block-size: calc(var(--spacing) * 11)`, with `::-webkit-details-marker { display: none }` and a chevron drawn in `::after` rotated by `var(--rp-filter-group-chevron-rotate, 0deg)`; values `list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--rp-filter-group-gap)`; value `display: flex; align-items: center; gap: var(--rp-filter-group-gap); min-block-size: calc(var(--spacing) * 6)`; `.rp-filter-group-value:has(:disabled) { color: var(--color-muted-foreground) }`; count `min-inline-size: 1.25rem; border-radius: var(--radius-full); background: var(--color-primary); color: var(--color-primary-foreground); font-size: var(--text-xs); text-align: center`.

### Host notes

- HTML: copy the contract.
- React: `FilterGroup(props: { filter: RippleFilter; open?: boolean; strings?: { selected?: string }; className?: string })`. No hook. `defaultChecked={value.active}`; `open={open}` is printed as an initial attribute only (uncontrolled `<details>`).
- Remix: None.
- Liquid: `filter.type == 'price_range'` renders `rp-price-range`; every other type renders the values list from `filter.values` (`value.param_name`, `value.value`, `value.label`, `value.count`, `value.active`, `value.swatch.color`, `value.swatch.image`). Active count: `filter.active_values.size`, or `1` for a price range when `filter.min_value.value != blank or filter.max_value.value != blank`. No schema settings. Locale key: `ripple.filter-group.selected` = `selected`.

```tsx
<FilterGroup filter={filter} />
```

```liquid
{% render 'rp-filter-group', filter: filter, open: true %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP104 (`filter`), RP110. Manifest `rules[]`: `filter-group-in-get-form` (`requires-ancestor`, selector `:scope`, target `form[method="get"]`; "A FilterGroup is outside a GET form; its checkboxes submit nothing."); `filter-group-labelled-values` (`forbids-descendant`, selector `.rp-filter-group-values`, target `input:not(label input)`; "A filter checkbox is not inside a label.").

### Acceptance tests

1. Tier 2: `default`, `price`, `swatch-disabled`, `class`, `escaping` are canonical-equal in all four hosts.
2. Tier 5: the accessible name of the first checkbox of `default` is `In stock (8)`; the summary's is `Availability 1 selected`.
3. Tier 5: in `swatch-disabled` the `Sand` checkbox is disabled and is not part of the form's submitted data.
4. Tier 6: with scripting disabled, clicking the summary toggles the content.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/snippets/filter-group.liquid`, `ripple/theme/snippets/filter-value.liquid` (details per filter, checkbox per value, count, swatch); Liquid `filter_value` drop (Shopify docs tool, this session).
- UNVERIFIED: how a Liquid filter of type `boolean` exposes its value (the binding treats it as a list through `filter.values`; if `filter.values` is empty for `boolean`, doc 14 MUST switch that branch to `filter.true_value`).

### Fallback (SPIKE-nn)

None.

---

## FilterChips

| Field | Value |
|---|---|
| Id | `filter-chips` |
| Kind | `commerce` |
| Category | `discovery` |
| Custom elements | `rp-live` |
| Root element and class | `rp-live` `.rp-filter-chips` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `icon`, `visually-hidden` |
| Milestone | M3 |

### Purpose

The list of active filters as removable chips, with a "Clear all" link. Each chip is a link to the URL without that filter.

- Use when: above the results of a filtered collection or search page, inside region `rp-collection-toolbar`.
- Do not use when: showing tags or statuses (use Badge).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `FilterChips` | `blocks/filter-chips.liquid` + `snippets/rp-filter-chips.liquid` | `rp-live` | `rp-filter-chips` | `data-slot="rp-live"`, `data-rp-refresh` | yes | none |
| list | printed by root | same | `ul` | `rp-filter-chips-list` | `role="list"` (fixed attribute) | when a filter is active | none |
| chip | printed by root | same | `a` | `rp-filter-chips-chip` | none | one per active value | none |
| chip label | printed by root | same | `span` | `rp-filter-chips-label` | none | one per chip | none |
| clear | printed by root | same | `a` | `rp-filter-chips-clear` | none | when a filter is active | none |

Nesting rules: when no filter is active the root is printed with NO children. Otherwise root children in order: list, clear. Each `li` of the list contains one chip. Chip children in order: a VisuallyHidden span with the text `Remove filter: `, the chip label, one Icon `close`. For in-place refresh the root MUST be inside the region `rp-collection-toolbar` (declared by the blueprint), so that the chips are re-rendered after a change.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `chips` | none | object | `RippleFilterChip[]` | none | yes (TSX) | no | one chip each |
| `clearUrl` | none | url | URL without any filter parameter | none | yes (TSX) | no | `href` of clear |
| none | `collection` | object | Liquid `collection` drop | the global `collection` | no | no | chips and clear URL |
| none | `search` | object | Liquid `search` drop | none | no | no | replaces `collection` as the source |
| `refresh` | `refresh` | string | region names | `rp-collection-results rp-collection-filters rp-collection-toolbar` | no | no | `data-rp-refresh` (CV-3) |

`toFilterChips(filters: RippleFilter[], options: { pathname: string; searchParams: URLSearchParams; formatPrice: (amount: string) => string }): { chips: RippleFilterChip[]; clearUrl: string }` is exported from `filter-chips.data.ts` (CV-10). `RippleFilterChip` (`{ label: string; url: string }`) is defined in [05-commerce.md](05-commerce.md) section 11.1 and imported from `<pkg>` (D-094). Per active list value: `label` = the value label, `url` = `pathname` + `getFilterRemovalUrl(searchParams, JSON.parse(<the value's input>))`; because `RippleFilterValue` does not keep `input`, the helper rebuilds the URL by deleting the pair `(name, value)` and the `before` / `after` params from a copy of `searchParams`. For an active price range: one chip with the label of the rule below and `url` = `filter.removeUrl`. `clearUrl` = `pathname` plus only the `sort_by` and `q` params.

Price chip label rule (both backends): both bounds set: `<min> - <max>`; only max: `Up to <max>`; only min: `From <min>`; where `<min>` and `<max>` are money text (TSX: `formatPrice`; Liquid: `filter.min_value.value | money`, `filter.max_value.value | money`).

### Content model

`none`.

### HTML contract

Fixture `default` (resource `filters.basic`):

```html
<rp-live class="rp-filter-chips" data-slot="rp-live" data-rp-refresh="rp-collection-results rp-collection-filters rp-collection-toolbar">
  <ul class="rp-filter-chips-list" role="list">
    <li><a class="rp-filter-chips-chip" href="/collections/summer?filter.v.price.lte=50"><span class="rp-visually-hidden">Remove filter: </span><span class="rp-filter-chips-label">In stock</span><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></a></li>
    <li><a class="rp-filter-chips-chip" href="/collections/summer?filter.v.availability=1"><span class="rp-visually-hidden">Remove filter: </span><span class="rp-filter-chips-label">Up to $50.00</span><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></a></li>
  </ul>
  <a class="rp-filter-chips-clear" href="/collections/summer">Clear all</a>
</rp-live>
```

Fixture `empty` (no active filter):

```html
<rp-live class="rp-filter-chips" data-slot="rp-live" data-rp-refresh="rp-collection-results rp-collection-filters rp-collection-toolbar"></rp-live>
```

Further required fixtures: `refresh` (`refresh`: `rp-search-results rp-collection-filters rp-collection-toolbar`); `class` (root class `rp-filter-chips custom-a custom-b`); `escaping` (a chip label `Say "hi" & <go>`).

Host-owned regions and masks: none host-owned. Masks: `{ "select": ".rp-filter-chips-chip", "op": "attr", "name": "href" }` and `{ "select": ".rp-filter-chips-clear", "op": "attr", "name": "href" }` (parameter order and encoding differ by backend); `{ "select": "li:nth-child(2) .rp-filter-chips-label", "op": "text" }` in `default` (money text).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-rp-refresh` | root | server | always | the `refresh` value |
| `data-pending` | root | `rp-live` | a refresh it started is running | absent |
| `aria-busy` | root | `rp-live` | same (`"true"`) | absent |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-live", "attrs": ["data-pending", "aria-busy"], "reason": "A refresh can be in flight when the element upgrades after a back or forward navigation." }`.

### Behaviour with JavaScript

1. A plain primary click on a chip or on clear is intercepted by `rp-live`: the link's URL is pushed to history and the regions in `data-rp-refresh` are refreshed.
2. The toolbar region, which contains this root, is replaced by the refresh. The clicked chip no longer exists; the adapter moves focus to the first focusable element of the region ([05-commerce.md](05-commerce.md) section 8.2 step 9).
3. Modified clicks navigate natively.

### Behaviour without JavaScript

Chips and the clear link are ordinary links; they navigate to the URL without the filter.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: list of links; `checkPattern`: none.
- Accessible name: each chip: `Remove filter: <label>`; required. Clear: its text.
- Focus: each chip and the clear link are tab stops; see behaviour 2.
- Announcements: None.

| Key | Action |
|---|---|
| Enter on a chip | removes that filter |

### Styling

- File: `components/filter-chips/filter-chips.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-border`, `--color-muted`, `--color-foreground`, `--color-ring`, `--radius-full`, `--text-sm`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-filter-chips-gap` | `calc(var(--spacing) * 2)` | space between chips |
| `--rp-filter-chips-bg` | `var(--color-muted)` | chip background |
| `--rp-filter-chips-radius` | `var(--radius-full)` | chip radius |

| Modifier selector | Sets |
|---|---|
| `.rp-filter-chips[data-pending]` | nothing; reserved for project CSS |

Required rules: root `display: flex; flex-wrap: wrap; align-items: center; gap: var(--rp-filter-chips-gap)`; the root MUST NOT get `display: none` when it is empty (D-080 forbids `display: none` on a custom element root): an empty root is a flex box with no content and zero block size; list `display: contents; list-style: none`; list items `display: contents`; chip `display: inline-flex; align-items: center; gap: calc(var(--spacing) * 1); min-block-size: calc(var(--spacing) * 8); padding-inline: calc(var(--spacing) * 3); border-radius: var(--rp-filter-chips-radius); background: var(--rp-filter-chips-bg); text-decoration: none`. Because `list-style: none` removes list semantics in WebKit, the `ul` carries the fixed attribute `role="list"`.

### Host notes

- HTML: copy the contract; compute each URL by removing the parameter.
- React: `FilterChips(props: { chips: RippleFilterChip[]; clearUrl: string; refresh?: string; strings?: { remove?: string; clear?: string }; className?: string })` plus `toFilterChips`. No hook. `key={chip.url}`.
- Remix: prop `rmxKey?: string` prints `data-rmx-key` on root (omitted when unset; CV-5, D-034); links carry no `data-rmx-*` attribute.
- Liquid: source `search.filters` or `collection.filters`. For each `filter`: for each `value` in `filter.active_values`: chip with `value.label` and `value.url_to_remove`; for `price_range` with a set bound: one chip with `filter.url_to_remove`. Clear URL: collection: `collection.url`, plus `?sort_by=<value>` when the sort is not the default; search: `routes.search_url` + `?q=` + `search.terms | url_encode`, plus `&sort_by=<value>` when not the default. No schema settings. Locale keys: `ripple.filter-chips.remove` = `Remove filter: `; `ripple.filter-chips.clear` = `Clear all`; `ripple.filter-chips.up_to` = `Up to {{ max }}`; `ripple.filter-chips.from` = `From {{ min }}`.

```tsx
<FilterChips {...toFilterChips(filters, { pathname: url.pathname, searchParams: url.searchParams, formatPrice })} />
```

```liquid
{% block 'filter-chips' %}{% endblock %}
```

### Commerce

- Store fields read: none.
- Adapter methods called: `refresh`, `usable` (through `rp-live`).
- Regions refreshed: the names in `data-rp-refresh`; `reason: "filter"`; history push.
- Pending and error behaviour: root flags; a failed refresh ends in `location.assign(url)` (D-090).

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Remove URL | current params minus the filter (`getFilterRemovalUrl` semantics), cursors dropped | `filter_value.url_to_remove`, `filter.url_to_remove` |

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP104 (`chips`, `clearUrl`), RP308 (a `data-rp-refresh` name with no region on the page; this root MAY be inside the region it refreshes, D-102), RP403 (Liquid). Manifest `rules[]`: `filter-chips-links` (`forbids-descendant`, selector `:scope`, target `.rp-filter-chips-chip:not(a[href])`; "A filter chip is not a link; it cannot work without JavaScript.").

### Acceptance tests

1. Tier 2: `default`, `empty`, `refresh`, `class`, `escaping` are canonical-equal in all four hosts with the masks above.
2. Tier 5 (unit test): `toFilterChips` for `filters.basic` returns two chips; the first URL has no `filter.v.availability` parameter and keeps `filter.v.price.lte=50`; `clearUrl` is `/collections/summer`.
3. Tier 5: a click on the first chip yields one `rp:refresh` (`reason: "filter"`), one history entry, and afterwards `document.activeElement` is inside the toolbar region.
4. Tier 6: with scripting disabled the same click navigates to the chip's `href`.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/snippets/filters.liquid` (active values with `url_to_remove`); `hydrogen/packages/hydrogen/src/core/collection/url.ts` (`getFilterRemovalUrl`: query string starting with `?`, cursors dropped); Liquid `filter.active_values`, `filter.url_to_remove`, `filter_value.url_to_remove` (Shopify docs tool, this session).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---

## PriceRange

| Field | Value |
|---|---|
| Id | `price-range` |
| Kind | `static` |
| Category | `discovery` |
| Custom elements | none |
| Root element and class | `div` `.rp-price-range` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `input` |
| Milestone | M3 |

### Purpose

Two number inputs, minimum and maximum price, for the price filter of a Filters form. It is not a slider.

- Use when: inside a FilterGroup of type `price_range` (FilterGroup renders it).
- Do not use when: outside a GET form inside an `rp-live` root, or for a generic numeric range (use two Inputs).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `PriceRange` | `blocks/price-range.liquid` + `snippets/rp-price-range.liquid` | `div` | `rp-price-range` | none | yes | none |
| field | printed by root | same | `label` | `rp-price-range-field` | none | two | none |
| field label | printed by root | same | `span` | `rp-price-range-label` | none | two | none |
| input | printed by root | same | `input` | `rp-input` | none | two | none |

Nesting rules: root contains exactly two fields: minimum first, maximum second. Each field contains the field label, then the input. The inputs are labelled by their wrapping `<label>`; they carry no `id`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `minName` | none | string | parameter name | `filter.v.price.gte` | no | no | `name` of the first input |
| `maxName` | none | string | parameter name | `filter.v.price.lte` | no | no | `name` of the second input |
| `min` | none | string | decimal number in major units, or empty | empty | no | no | `value` of the first input (omitted when empty) |
| `max` | none | string | decimal number in major units, or empty | empty | no | no | `value` of the second input (omitted when empty) |
| `rangeMax` | none | string | decimal number in major units, or empty | empty | no | no | `max` on both inputs and `placeholder` on the second (omitted when empty) |
| none | `filter` | object | Liquid `filter` drop of type `price_range` | none | yes (Liquid) | no | all of the above |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` on both inputs |

Number text rule: the value is the amount in major currency units with `.` as decimal separator and no grouping. TSX hosts print the string they were given (it comes from the URL). Liquid computes it from the drop's value in cents `c`: `cents = c | modulo: 100`, then `whole = c | minus: cents | divided_by: 100` (the subtraction makes the division exact, so Shopify's integer division and the shim's floating-point division print the same digits; `13-testing.md` section 20 item 7); the text is `whole` when `cents` is 0, otherwise `whole`, `.`, and `cents` left-padded to two digits. (`5000` gives `50`; `5005` gives `50.05`.)

### Content model

`none`.

### HTML contract

Fixture `default` (`max`: `50`):

```html
<div class="rp-price-range">
  <label class="rp-price-range-field"><span class="rp-price-range-label">From</span><input class="rp-input" type="number" data-size="md" name="filter.v.price.gte" min="0" step="any" inputmode="decimal"></label>
  <label class="rp-price-range-field"><span class="rp-price-range-label">To</span><input class="rp-input" type="number" data-size="md" name="filter.v.price.lte" min="0" step="any" inputmode="decimal" value="50"></label>
</div>
```

Fixture `bounded` (`min`: `10`, `max`: `50.5`, `rangeMax`: `120`, `size`: `sm`):

```html
<div class="rp-price-range">
  <label class="rp-price-range-field"><span class="rp-price-range-label">From</span><input class="rp-input" type="number" data-size="sm" name="filter.v.price.gte" min="0" max="120" step="any" inputmode="decimal" value="10"></label>
  <label class="rp-price-range-field"><span class="rp-price-range-label">To</span><input class="rp-input" type="number" data-size="sm" name="filter.v.price.lte" min="0" max="120" step="any" inputmode="decimal" placeholder="120" value="50.5"></label>
</div>
```

The Liquid fixture data for `bounded` uses `min_value.value` 1000, `max_value.value` 5050 and `range_max` 12000; the Liquid text for the maximum is `50.50`, so the fixture masks that one attribute.

Further required fixtures: `empty` (no props; neither input has `value`); `class` (root class `rp-price-range custom-a custom-b`); `invalid-enum-falls-back` (`size`: `huge`; equals `empty`).

Host-owned regions and masks: none host-owned. Mask in `bounded` only: `{ "select": "input[name=\"filter.v.price.lte\"]", "op": "attr", "name": "value" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `value` | input | server | the bound is set in the URL | the number text, or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None of its own. A `change` (blur or Enter) is handled by the enclosing `rp-live`; an empty input contributes no parameter.
2. Native validation applies: a value below `0` or above `rangeMax` blocks `requestSubmit()` and shows the browser's message.

### Behaviour without JavaScript

The inputs are submitted with the Filters form.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: two labelled number fields; `checkPattern`: none.
- Accessible name: `From` and `To` through the wrapping labels; required. The group is named by the FilterGroup summary (`Price`).
- Focus: two tab stops.
- Announcements: None.

| Key | Action |
|---|---|
| Enter | applies the range |
| ArrowUp, ArrowDown | native number stepping |

### Styling

- File: `components/price-range/price-range.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-muted-foreground`, `--text-sm`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-price-range-gap` | `calc(var(--spacing) * 3)` | space between the two fields |

| Modifier selector | Sets |
|---|---|
| None | |

Required rules: root `display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--rp-price-range-gap)`; field `display: flex; flex-direction: column; gap: calc(var(--spacing) * 1)`; field label `font-size: var(--text-sm); color: var(--color-muted-foreground)`.

### Host notes

- HTML: copy the contract.
- React: `PriceRange(props: { minName?: string; maxName?: string; min?: string; max?: string; rangeMax?: string; size?: "sm" | "md" | "lg"; strings?: { from?: string; to?: string }; className?: string })`. No hook. Uncontrolled inputs (`defaultValue`), with `key={min + ":" + max}` set by FilterGroup so that navigation resets them.
- Remix: None.
- Liquid: names `filter.min_value.param_name` and `filter.max_value.param_name`; values from `filter.min_value.value` and `filter.max_value.value` (cents; blank when not set); `rangeMax` from `filter.range_max` (cents). Filters `divided_by` and `modulo` are in the component scope of the Liquid subset (D-097). The two inputs are the embedded Input with `inputmode="decimal"` passed through `attributes` (a native attribute, not a hook). No schema settings. Locale keys: `ripple.price-range.from` = `From`; `ripple.price-range.to` = `To`.

```tsx
<PriceRange min={filter.price.min} max={filter.price.max} />
```

```liquid
{% render 'rp-price-range', filter: filter %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP101 (`size`), RP110. Manifest `rules[]`: `price-range-in-get-form` (`requires-ancestor`, selector `:scope`, target `form[method="get"]`); `price-range-two-inputs` (`max-count`, selector `:scope input[type="number"]`, count 2).

### Acceptance tests

1. Tier 2: `default`, `bounded`, `empty`, `class`, `invalid-enum-falls-back` are canonical-equal in all four hosts with the mask above.
2. Tier 2 (Liquid shim, unit): cents `5000` prints `50`, `5005` prints `50.05`, `5050` prints `50.50`, blank prints no `value` attribute.
3. Tier 5: accessible names of the inputs are `From` and `To`.
4. Tier 5: inside a Filters fixture, typing `20` in `From` and pressing Enter produces a URL containing `filter.v.price.gte=20` and no `filter.v.price.lte` when `To` is empty.

### Evidence and UNVERIFIED

- Evidence: `hydrogen/packages/hydrogen/skills/hydrogen-collection-browser/SKILL.md` (price inputs `filter.v.price.gte` / `filter.v.price.lte`, `type="number"`, `min="0"`, `step="any"`); Liquid `filter.min_value`, `filter.max_value`, `filter.range_max` (Shopify docs tool, this session); `ripple/theme/snippets/filter-group.liquid`.
- UNVERIFIED: that `filter.min_value.value` and `filter.range_max` are numbers of cents in every currency (zero-decimal currencies need a different divisor; doc 14 owns the correction with `shop.money_format` knowledge).

### Fallback (SPIKE-nn)

None.

---

## SortSelect

| Field | Value |
|---|---|
| Id | `sort-select` |
| Kind | `commerce` |
| Category | `discovery` |
| Custom elements | `rp-live` |
| Root element and class | `rp-live` `.rp-sort-select` |
| Liquid tier | `resource` |
| No-JS level | `full` |
| Requires `id` | yes (printed on the select) |
| Depends on | `label`, `select`, `button` |
| Milestone | M3 |

### Purpose

A select that changes the sort order of a collection or search page. It is its own GET form that carries the active filters as hidden inputs, so that it works alone and without JavaScript.

- Use when: in the toolbar above results, inside region `rp-collection-toolbar`.
- Do not use when: a generic select should refresh a region (use LiveForm with a Select).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `SortSelect` | `blocks/sort-select.liquid` + `snippets/rp-sort-select.liquid` | `rp-live` | `rp-sort-select` | `data-slot="rp-live"`, `data-rp-refresh` | yes | none |
| form | printed by root | same | `form` | `rp-sort-select-form` | none | yes | none |
| label | printed by root | same | `label` | `rp-label` | none | yes | none |
| select | printed by root | same | `select` | `rp-select` | none | yes | `<id>` |
| submit | printed by root | same | `button` | `rp-button` | `data-rp-js="fallback"` | yes | none |

Nesting rules: root contains only the form. Form children in order: the carried hidden inputs (one per active filter parameter, then `q` on a search page), label, select, submit. The root MUST NOT be inside another `<form>` (in particular not inside the Filters form). For in-place refresh the root MUST be inside region `rp-collection-toolbar`, so that the hidden inputs are re-rendered after a filter change.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on the select; `for` on the label |
| `options` | none | object | `RippleSortOption[]` | none | yes (TSX) | no | one `<option>` each |
| `value` | none | string | one of the option values | the first option's value | no | no | `selected` on that option |
| `action` | none | url | the page path without query | none | yes (TSX) | no | `action` on the form |
| `params` | none | object | `Array<[name: string, value: string]>`: the active filter parameters and `q` | empty | no | no | hidden inputs, in the given order |
| none | `collection` | object | Liquid `collection` drop | the global `collection` | no | no | options, value, action, params |
| none | `search` | object | Liquid `search` drop | none | no | no | replaces `collection` as the source |
| `refresh` | `refresh` | string | region names | `rp-collection-results rp-collection-filters rp-collection-toolbar` | no | no | `data-rp-refresh` (CV-3) |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` on the select and the submit button |

`rp-collection-filters` is in the default refresh list because the Filters form carries the sort as a hidden input inside that region.

`sortParams(searchParams: URLSearchParams): Array<[string, string]>`, exported from `sort-select.data.ts` (CV-10), returns every pair whose name starts with `filter.` plus the pair `q` when present, in URL order. hydrogen sort values are those produced by `getSortByValue(sortKey, reverse)` of `@shopify/hydrogen` (`hydrogen/packages/hydrogen/src/core/collection/url.ts`): `manual`, `best-selling`, `title-ascending`, `title-descending`, `price-ascending`, `price-descending`, `created-ascending`, `created-descending`, and on search `relevance`. The app supplies the option list (the Storefront API returns none).

### Content model

`text` - the label text. Default `Sort by`.

### HTML contract

Fixture `default` (`id`: `sort`, resource `filters.basic`):

```html
<rp-live class="rp-sort-select" data-slot="rp-live" data-rp-refresh="rp-collection-results rp-collection-filters rp-collection-toolbar">
  <form class="rp-sort-select-form" method="get" action="/collections/summer">
    <input type="hidden" name="filter.v.availability" value="1">
    <input type="hidden" name="filter.v.price.lte" value="50">
    <label class="rp-label" for="sort">Sort by</label>
    <select class="rp-select" data-size="md" id="sort" name="sort_by">
      <option value="manual" selected>Featured</option>
      <option value="price-ascending">Price, low to high</option>
    </select>
    <button class="rp-button" type="submit" data-variant="outline" data-size="md" data-rp-js="fallback">Sort</button>
  </form>
</rp-live>
```

Fixture `search` (`action`: `/search`, `value`: `price-ascending`, `params`: `[["q", "shirt"]]`, `refresh`: `rp-search-results rp-collection-filters rp-collection-toolbar`): the root's `data-rp-refresh` is the given value; the form `action` is `/search`; the only hidden input is `<input type="hidden" name="q" value="shirt">`; `selected` is on the second option.

Further required fixtures: `children` (children `Order`; label text `Order`); `sm` (`size`: `sm`); `class` (root class `rp-sort-select custom-a custom-b`); `invalid-enum-falls-back` (`size`: `huge`; equals `default`); `escaping` (an option label `Say "hi" & <go>`).

Host-owned regions and masks: none. In Remix the root carries `data-rmx-key="<id>"`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-rp-refresh` | root | server | always | the `refresh` value |
| `data-pending` | root | `rp-live` | a refresh it started is running | absent |
| `aria-busy` | root | `rp-live` | same (`"true"`) | absent |
| `selected` | option | server | the option is the current sort | on one option |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-live", "attrs": ["data-pending", "aria-busy"], "reason": "A refresh can be in flight when the element upgrades after a back or forward navigation." }`.

### Behaviour with JavaScript

1. A `change` of the select calls `form.requestSubmit()`; `rp-live` intercepts, pushes the URL (`reason: "filter"`) and refreshes the regions.
2. The toolbar region, which contains this root, is replaced. The select has an `id`, so the adapter restores focus to the new select.
3. The page cursor parameters are not carried: a sort change returns to the first page.
4. The submit button is hidden when the document is ready (`data-rp-js="fallback"`).

### Behaviour without JavaScript

The buyer picks an option and presses `Sort`; the form navigates to the URL with `sort_by` and the carried filters.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: labelled native select; `checkPattern`: none.
- Accessible name: the label; required.
- Focus: restored to the select after the refresh.
- Announcements: None.

| Key | Action |
|---|---|
| ArrowUp, ArrowDown, typing | native select behaviour; the change applies the sort |

### Styling

- File: `components/sort-select/sort-select.css` (layer `rp.components`).
- Tokens used: `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-sort-select-gap` | `calc(var(--spacing) * 2)` | space between label, select and button |

| Modifier selector | Sets |
|---|---|
| None | |

Required rules: root `display: inline-block`; form `display: inline-flex; align-items: center; gap: var(--rp-sort-select-gap)`.

### Host notes

- HTML: copy the contract.
- React: `SortSelect(props: { id: string; options: RippleSortOption[]; value?: string; action: string; params?: Array<[string, string]>; refresh?: string; size?: "sm" | "md" | "lg"; strings?: { submit?: string }; className?: string; children?: ReactNode })`. `sortParams` is in `sort-select.data.ts` (CV-10). The fallback submit button is printed by the binding itself (section 0.2). No hook. Uncontrolled select: `defaultValue={value}` with `key={value}`.
- Remix: `data-rmx-key="<id>"` on root.
- Liquid: options `source.sort_options` (`option.value`, `option.name`); current value `source.sort_by | default: source.default_sort_by`; action `collection.url` or `routes.search_url`; hidden inputs: for each `filter` in `source.filters`, each `value` in `filter.active_values` gives `value.param_name` / `value.value`; a `price_range` filter gives `filter.min_value.param_name` and `filter.max_value.param_name` with the number text of PriceRange when set; on search also `q` = `search.terms`. Schema settings: `size`. Locale keys: `ripple.sort-select.label` = `Sort by`; `ripple.sort-select.submit` = `Sort`.

```tsx
<SortSelect id="sort" action={url.pathname} options={SORT_OPTIONS} value={url.searchParams.get("sort_by") ?? "manual"} params={sortParams(url.searchParams)} />
```

```liquid
{% block 'sort-select', id: 'sort' %}{% endblock %}
```

### Commerce

- Store fields read: none.
- Adapter methods called: `refresh`, `usable` (through `rp-live`).
- Regions refreshed: the names in `data-rp-refresh`; `reason: "filter"`; history push.
- Pending and error behaviour: root flags; a failed refresh ends in `location.assign(url)` (D-090).

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Sort parameter | `sort_by`, parsed by `parseCollectionParams` | `sort_by`, parsed by Shopify |
| Option list | supplied by the app | `collection.sort_options` / `search.sort_options` |

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP101 (`size`), RP104 (`id`, `options`, `action`), RP114, RP301, RP308 (a `data-rp-refresh` name with no region on the page; this root MAY be inside the region it refreshes, D-102), RP403 (Liquid). Manifest `rules[]`: `sort-select-fallback-submit` (`requires-descendant`, selector `form[method="get"]`, target `button[type="submit"][data-rp-js="fallback"]`); `sort-select-name` (`requires-descendant`, selector `:scope`, target `select[name="sort_by"]`); `sort-select-not-in-form` (`forbids-ancestor`, selector `:scope`, target `form`; "A SortSelect is inside another form; nested forms are invalid HTML.").

### Acceptance tests

1. Tier 2: `default`, `search`, `children`, `sm`, `class`, `invalid-enum-falls-back`, `escaping` are canonical-equal in all four hosts.
2. Tier 5: [05-commerce.md](05-commerce.md) test C-13 (sort `change` pushes one history entry and replaces `rp-collection-results`). Additionally the pushed URL keeps `filter.v.availability=1` and `filter.v.price.lte=50`.
3. Tier 5: after the refresh `document.activeElement` is the select with id `sort`.
4. Tier 6: with scripting disabled, choosing `Price, low to high` and pressing `Sort` navigates to a URL containing `sort_by=price-ascending` and both filter parameters.

### Evidence and UNVERIFIED

- Evidence: D-047; `hydrogen/packages/hydrogen/src/core/collection/url.ts` (`getSortByValue`, `SORT_KEY_TO_SORT_BY`, `-ascending` / `-descending` suffixes); `hydrogen/packages/hydrogen/skills/hydrogen-collection-browser/SKILL.md` (keep `q` in the sort form); `ripple/theme/assets/s-live-form.js`.
- UNVERIFIED: Liquid `sort_option` members `value` and `name` (general knowledge; not re-checked in the docs tool).

### Fallback (SPIKE-nn)

None.

---

## SearchForm

| Field | Value |
|---|---|
| Id | `search-form` |
| Kind | `static` |
| Category | `discovery` |
| Custom elements | none |
| Root element and class | `form` `.rp-search-form` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `input`, `icon-button`, `icon` |
| Milestone | M3 |

### Purpose

A search form: one search input and a submit button, sending `q` to the search page with GET.

- Use when: the header, the search page, or an empty state needs a search box.
- Do not use when: results should appear while typing (use PredictiveSearch, which embeds this form).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `SearchForm` | `blocks/search-form.liquid` + `snippets/rp-search-form.liquid` | `form` | `rp-search-form` | none | yes | none |
| input | printed by root | same | `input` | `rp-input rp-search-form-input` | `data-rp-part="input"` when `predictive` | yes | none |
| submit | printed by root | same | `button` | `rp-icon-button rp-search-form-submit` | none | yes | none |

Nesting rules: root children in order: children (extra hidden fields), input, submit. The root MUST NOT be inside another `<form>`. The markup lives in a snippet because PredictiveSearch embeds it. The input and the submit button compose Input and IconButton by contract (D-070, section 0.2): the generated binding prints both elements itself; manifest part classes `rp-input rp-search-form-input` and `rp-icon-button rp-search-form-submit`; `dependencies.components` contains `input`, `icon-button`, `icon`. The root is a plain `<form>` (not printed by `{% form %}`), so on Liquid it prints `{{ attributes }}` last (D-035).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `action` | `action` | url | the search route | `/search` (Liquid: `routes.search_url`) | no | no | `action` |
| `defaultValue` | `default_value` | string | the current search terms | none | no | no | `value` on the input (omitted when empty) |
| `placeholder` | `placeholder` | string | any text | none | no | no | `placeholder` on the input |
| `ariaLabel` | `aria_label` | string | any text | `Search` | no | no | `aria-label` on the input |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` on the input and on the submit button |
| `predictive` | `predictive` | boolean | `true false` | `false` | no | no | `data-rp-part="input"` and `autocomplete="off"` on the input; set only by PredictiveSearch |

### Content model

`flow` restricted to `<input type="hidden">` elements (for example `<input type="hidden" name="type" value="product">`). They are printed before the input.

### HTML contract

Fixture `default` (no props):

```html
<form class="rp-search-form" method="get" action="/search" role="search">
  <input class="rp-input rp-search-form-input" type="search" data-size="md" name="q" aria-label="Search">
  <button class="rp-icon-button rp-search-form-submit" type="submit" data-variant="ghost" data-size="md" aria-label="Search"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></button>
</form>
```

Fixture `predictive` (`predictive`: true, `defaultValue`: `shirt`, `placeholder`: `Search products`, children `<input type="hidden" name="type" value="product">`):

```html
<form class="rp-search-form" method="get" action="/search" role="search">
  <input type="hidden" name="type" value="product">
  <input class="rp-input rp-search-form-input" type="search" data-size="md" name="q" value="shirt" placeholder="Search products" aria-label="Search" autocomplete="off" data-rp-part="input">
  <button class="rp-icon-button rp-search-form-submit" type="submit" data-variant="ghost" data-size="md" aria-label="Search"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></button>
</form>
```

Further required fixtures: `action` (`action`: `/en-ca/search`); `sm` (`size`: `sm`); `class` (root class `rp-search-form custom-a custom-b`); `invalid-enum-falls-back` (`size`: `huge`; equals `default`); `escaping` (`defaultValue`: `Say "hi" & <go>`; attribute `Say &quot;hi&quot; &amp; &lt;go&gt;`).

Host-owned regions and masks: none.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `value` | input | server | `defaultValue` is not empty | the terms |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None. The form submits natively. Inside PredictiveSearch the `rp-predictive-search` element listens to the input part; Enter still submits natively.

### Behaviour without JavaScript

Submitting navigates to `<action>?q=<terms>`.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: search landmark (`role="search"` on the form) with a search field; `checkPattern`: none.
- Accessible name: input `aria-label` (default `Search`); submit button `aria-label="Search"`; both required. A page with more than one SearchForm SHOULD pass distinct `ariaLabel` values.
- Focus: input, then submit.
- Announcements: None.

| Key | Action |
|---|---|
| Enter in the input | submits the form |
| Escape in the input | clears it (native `type="search"` behaviour where the browser provides it) |

### Styling

- File: `components/search-form/search-form.css` (layer `rp.components`).
- Tokens used: `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-search-form-gap` | `calc(var(--spacing) * 1)` | space between input and button |

| Modifier selector | Sets |
|---|---|
| None | |

Required rules: root `display: flex; align-items: center; gap: var(--rp-search-form-gap)`; `.rp-search-form-input { flex: 1 1 auto; min-inline-size: 0 }`.

### Host notes

- HTML: copy the contract.
- React: generated. `SearchForm(props: { action?: string; defaultValue?: string; placeholder?: string; ariaLabel?: string; size?: "sm" | "md" | "lg"; predictive?: boolean; className?: string; children?: ReactNode })`. The input is uncontrolled (`defaultValue`).
- Remix: generated; the form carries no `data-rmx-*` attribute (a GET navigation is handled by the router as a document or client navigation; both are correct).
- Liquid: generated snippet; params `action`, `default_value`, `placeholder`, `aria_label`, `size`, `predictive` (the mechanical mapping of ledger section 4.2: TSX `defaultValue` is Liquid `default_value`); the block wrapper applies `action | default: routes.search_url`. Schema settings: `placeholder`, `size` (labels `t:ripple.props.placeholder`, `t:ripple.props.size`; block name `t:ripple.search-form.name`; D-038). Locale key: `ripple.search-form.label` = `Search`.

```tsx
<SearchForm defaultValue={terms} placeholder="Search products" />
```

```liquid
{% block 'search-form', default_value: search.terms, placeholder: 'Search products' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

RP101 (`size`), RP110, RP201 (input and button names). Manifest `rules[]`: `search-form-q` (`requires-descendant`, selector `:scope`, target `input[type="search"][name="q"]`); `search-form-not-in-form` (`forbids-ancestor`, selector `:scope`, target `form`).

### Acceptance tests

1. Tier 2: `default`, `predictive`, `action`, `sm`, `class`, `invalid-enum-falls-back`, `escaping` are canonical-equal in all four hosts.
2. Tier 5: the form is exposed as a `search` landmark and the input's accessible name is `Search`.
3. Tier 6: with scripting disabled, typing `shirt` and pressing Enter navigates to `/search?q=shirt`.

### Evidence and UNVERIFIED

- Evidence: [05-commerce.md](05-commerce.md) section 7.4 (required input markup); `ripple/docs/research/base-theme.md` (search form in header and search template).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---

## PredictiveSearch

| Field | Value |
|---|---|
| Id | `predictive-search` |
| Kind | `commerce` |
| Category | `discovery` |
| Custom elements | `rp-predictive-search` |
| Root element and class | `rp-predictive-search` `.rp-predictive-search` |
| Liquid tier | `resource` |
| No-JS level | `degraded` (a plain search form; no results while typing) |
| Requires `id` | yes |
| Depends on | `search-form`, `product-card` |
| Milestone | M3 |

### Purpose

A search form that shows product results in a panel while the buyer types (D-048). The results are server-rendered: the element fetches the region `rp-predictive-results` for the search URL.

- Use when: the header search should suggest products.
- Do not use when: a plain search box is enough (SearchForm), or a combobox pattern is required (not provided in V1; D-048).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `PredictiveSearch` | `blocks/predictive-search.liquid` + `snippets/rp-predictive-search.liquid` | `rp-predictive-search` | `rp-predictive-search` | `data-slot="rp-predictive-search"` | yes | `<id>` |
| form | printed by root | same | SearchForm (`predictive`) | `rp-search-form` | input: `data-rp-part="input"` | yes | none |
| panel | printed by root | same | `div` | `rp-predictive-search-panel` | `data-rp-part="results"` | yes | `<id>-content` |
| results (region part) | `PredictiveSearchResults` | `snippets/rp-predictive-search-results.liquid` | `div` | `rp-predictive-search-results` | `data-rp-region="rp-predictive-results"` | yes | none |
| list | printed by results | same | `ul` | `rp-predictive-search-list` | `role="list"` (fixed attribute) | when there are results | none |
| all | printed by results | same | `a` | `rp-predictive-search-all` | none | when there are results | none |
| empty | printed by results | same | `p` | `rp-predictive-search-empty` | none | when terms were given and nothing matched | none |
| status | printed by results | same | `p` | `rp-visually-hidden` | `data-rp-part="status"` | when terms were given | none |

Nesting rules: root children in order: form, panel. The panel contains only the results part. Results children: when no terms were searched: none; with results: list, all, status; with terms and no results: empty, status. Each `li` of the list contains one ProductCard (`level` `3`, `ratio` `1/1`, `sizes` `6rem`). The server MUST print `hidden` on the panel in every case. Children (`{{ content }}`) replace the default rendering of the results part (RS-2). At most one PredictiveSearch per page (the region name must be unique, RP308).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on root; `<id>-content` on the panel |
| `action` | `action` | url | the search route | `/search` (Liquid: `routes.search_url`) | no | no | `action` of the form; `href` base of the all link |
| `results` | none | object | `{ terms: string; products: RippleProduct[]; total: number } \| null` | `null` | no | no | the results part |
| none | `search` | object | Liquid `search` drop | the global `search` | no | no | the results part (`search.performed`, `search.terms`, `search.results`, `search.results_count`) |
| `placeholder` | `placeholder` | string | any text | none | no | no | passed to SearchForm |
| `limit` | `limit` | number | integer 1 to 10 | `6` | no | no | maximum number of cards |
| `locale` | none | string | BCP 47 tag | `en-US` | no | no | passed to ProductCard (CV-1) |

The form always contains `<input type="hidden" name="type" value="product">`, so that the fetched URL returns products only. The region part takes `results`, `action`, `limit`, `locale` (Liquid: the snippet `rp-predictive-search-results` takes exactly `search`, `action`, `limit`; every call passes all three, D-091 item 4).

### Content model

`parts` - children replace the default rendering of the results part (RS-2).

### HTML contract

Fixture `default` (`id`: `psearch`; no results):

```html
<rp-predictive-search class="rp-predictive-search" data-slot="rp-predictive-search" id="psearch">
  <form class="rp-search-form" method="get" action="/search" role="search">
    <input type="hidden" name="type" value="product">
    <input class="rp-input rp-search-form-input" type="search" data-size="md" name="q" aria-label="Search" autocomplete="off" data-rp-part="input">
    <button class="rp-icon-button rp-search-form-submit" type="submit" data-variant="ghost" data-size="md" aria-label="Search"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></button>
  </form>
  <div class="rp-predictive-search-panel" id="psearch-content" data-rp-part="results" hidden>
    <div class="rp-predictive-search-results" data-rp-region="rp-predictive-results"></div>
  </div>
</rp-predictive-search>
```

Fixture `results` (`id`: `psearch`, resource `search.shirt`): as `default`, with `value="shirt"` on the search input (placed after `name="q"`), and this results part (each comment stands for the complete ProductCard reference HTML for the stated props):

```html
    <div class="rp-predictive-search-results" data-rp-region="rp-predictive-results">
      <ul class="rp-predictive-search-list" role="list">
        <li><!-- ProductCard for product.basic: default props except sizes `6rem` --></li>
        <li><!-- ProductCard for product.sale: default props except sizes `6rem` --></li>
      </ul>
      <a class="rp-predictive-search-all" href="/search?q=shirt">View all 2 results</a>
      <p class="rp-visually-hidden" data-rp-part="status">2 results</p>
    </div>
```

Fixture `no-results` (terms `zzz`, no products, total 0): as `default`, with `value="zzz"` on the input, and this results part:

```html
    <div class="rp-predictive-search-results" data-rp-region="rp-predictive-results">
      <p class="rp-predictive-search-empty">No results for “zzz”</p>
      <p class="rp-visually-hidden" data-rp-part="status">No results</p>
    </div>
```

Text rules: status and all-link use the total: total 1: `1 result` and `View 1 result`; otherwise `<n> results` and `View all <n> results`. The all link is `<action>?q=<terms, URL-encoded>`.

Further required fixtures: `placeholder` (`placeholder`: `Search products`); `class` (root class `rp-predictive-search custom-a custom-b`); `children` (children `<div data-rp-region="rp-predictive-results"></div>`); `escaping` (terms `Say "hi" & <go>` with no results; empty text `No results for “Say "hi" &amp; &lt;go&gt;”`).

Host-owned regions and masks: none host-owned. Masks: those of ProductCard inside the list; `{ "select": ".rp-predictive-search-all", "op": "attr", "name": "href" }` (URL encoding of the terms differs by backend).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `hidden` | panel | `rp-predictive-search` | the panel is closed | present |
| `data-pending` | root | `rp-predictive-search` | a request is running | absent |
| `aria-busy` | root | `rp-predictive-search` | same (`"true"`) | absent |
| `aria-busy` | results | commerce adapter | the region is refreshing | absent |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "rp-predictive-search", "attrs": ["data-pending", "aria-busy"], "reason": "The browser can restore a typed query, which starts a request at upgrade." }`, `{ "select": "[data-rp-part=\"results\"]", "attrs": ["hidden"], "reason": "The panel opens when a restored query has results." }`, `{ "select": "[data-rp-region]", "attrs": ["aria-busy"], "childList": true, "text": true, "subtree": true, "reason": "A refresh that completes during upgrade replaces the region content." }`.

### Behaviour with JavaScript

1. Typing in the input: after 200 ms without input the element requests the region for the form's URL (`<action>?type=product&q=<terms>`) with `refresh(["rp-predictive-results"], { reason: "predictive" })`. No history entry is made. An empty (trimmed) value hides the panel and sends nothing.
2. When the region for the latest term arrives, the panel's `hidden` is removed and the trimmed text of the status part is announced.
3. ArrowDown from the input moves focus to the first result link; ArrowDown and ArrowUp move between the links in the panel (card links, then the all link); ArrowUp on the first link returns to the input; ArrowDown on the last link stays.
4. Escape hides the panel and focuses the input. Focus leaving the root hides the panel.
5. Enter in the input submits the form natively to the search page.
6. A failed request leaves the page unchanged; no navigation.
7. It is not an ARIA combobox: the server and the element print no `role="combobox"`, no `aria-expanded`, no `aria-activedescendant`.

### Behaviour without JavaScript

A plain search form: the panel stays `hidden`; submitting navigates to the search page. Missing: results while typing.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: search field with a disclosure-like results panel reached by arrow keys or Tab; `checkPattern`: none (D-048).
- Accessible name: the input's `aria-label` (SearchForm). Each result is a ProductCard link named by the product title.
- Focus: the input keeps focus while typing; arrow keys and Tab reach the results; Escape returns to the input.
- Announcements: the status text (`2 results`, `No results`) through `announce()` after each completed request.

| Key | Action |
|---|---|
| ArrowDown, ArrowUp | move between the input and the result links |
| Escape | closes the panel, focuses the input |
| Enter (input) | goes to the search page |
| Enter (link) | follows the link |

### Styling

- File: `components/predictive-search/predictive-search.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-popover`, `--color-popover-foreground`, `--color-border`, `--radius-surface`, `--shadow-lg`, `--rp-z-overlay`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-predictive-search-panel-max-height` | `min(70vh, 32rem)` | maximum block size of the panel |
| `--rp-predictive-search-columns` | `2` | card columns in the list |
| `--rp-predictive-search-gap` | `calc(var(--spacing) * 4)` | panel padding and list gap |

| Modifier selector | Sets |
|---|---|
| `.rp-predictive-search[data-pending]` | nothing; reserved for project CSS |

Required rules: root `position: relative; display: block`; panel `position: absolute; inset-inline: 0; inset-block-start: 100%; z-index: var(--rp-z-overlay); max-block-size: var(--rp-predictive-search-panel-max-height); overflow-y: auto; background: var(--color-popover); color: var(--color-popover-foreground); border: 1px solid var(--color-border); border-radius: var(--radius-surface); box-shadow: var(--shadow-lg); padding: var(--rp-predictive-search-gap)`; `.rp-predictive-search-panel[hidden] { display: none }`; list `list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(var(--rp-predictive-search-columns), minmax(0, 1fr)); gap: var(--rp-predictive-search-gap)`. The panel is positioned with CSS only (no anchor positioning, no JavaScript).

### Host notes

- HTML: copy the `default` contract; the server that answers `<action>?q=` MUST render the same component with the region filled.
- React: `PredictiveSearch(props: { id: string; action?: string; results?: { terms: string; products: RippleProduct[]; total: number } | null; placeholder?: string; limit?: number; locale?: string; className?: string; children?: ReactNode })` and the region part `PredictiveSearchResults` (complete code below). The file starts with `"use client";` because the region part calls a hook, and it exports components only (D-094). On `react` the adapter's strategy for reason `predictive` fetches the URL, takes the inner HTML of the region `rp-predictive-results` from the response and publishes it; `PredictiveSearchResults` reads it with `useRegionHtml("rp-predictive-results")` from `<pkg>/react` (D-090). While the hook returns `null` the part renders its server children from the `results` prop; afterwards it renders the HTML string with `dangerouslySetInnerHTML` on the region root. There is no navigation. UNVERIFIED (SPIKE-10); see `Fallback (SPIKE-10)`.

  `components/predictive-search/react/predictive-search.tsx` MUST contain this region part unchanged (`__PKG__` is replaced by the package name at install):

  ```tsx
  "use client";

  import type { RippleProduct } from "__PKG__";
  import { useRegionHtml } from "__PKG__/react";
  import { ProductCard } from "./product-card";

  export interface PredictiveSearchResultsProps {
    results?: { terms: string; products: RippleProduct[]; total: number } | null;
    action?: string;
    limit?: number;
    locale?: string;
    strings?: {
      resultsOne?: string;
      resultsOther?: string;
      viewOne?: string;
      viewAll?: string;
      empty?: string;
      none?: string;
    };
  }

  export function PredictiveSearchResults(props: PredictiveSearchResultsProps) {
    const { results = null, action = "/search", limit = 6, locale = "en-US", strings = {} } = props;
    const html = useRegionHtml("rp-predictive-results");

    if (html !== null) {
      return (
        <div
          className="rp-predictive-search-results"
          data-rp-region="rp-predictive-results"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    if (results === null) {
      return <div className="rp-predictive-search-results" data-rp-region="rp-predictive-results" />;
    }

    const count = String(results.total);
    if (results.products.length === 0) {
      return (
        <div className="rp-predictive-search-results" data-rp-region="rp-predictive-results">
          <p className="rp-predictive-search-empty">
            {(strings.empty ?? "No results for “{{ terms }}”").replace("{{ terms }}", results.terms)}
          </p>
          <p className="rp-visually-hidden" data-rp-part="status">
            {strings.none ?? "No results"}
          </p>
        </div>
      );
    }

    const status =
      results.total === 1
        ? strings.resultsOne ?? "1 result"
        : (strings.resultsOther ?? "{{ count }} results").replace("{{ count }}", count);
    const all =
      results.total === 1
        ? strings.viewOne ?? "View 1 result"
        : (strings.viewAll ?? "View all {{ count }} results").replace("{{ count }}", count);

    return (
      <div className="rp-predictive-search-results" data-rp-region="rp-predictive-results">
        <ul className="rp-predictive-search-list" role="list">
          {results.products.slice(0, limit).map((product) => (
            <li key={product.id}>
              <ProductCard product={product} level={3} ratio="1/1" sizes="6rem" locale={locale} />
            </li>
          ))}
        </ul>
        <a className="rp-predictive-search-all" href={`${action}?q=${encodeURIComponent(results.terms)}`}>
          {all}
        </a>
        <p className="rp-visually-hidden" data-rp-part="status">
          {status}
        </p>
      </div>
    );
  }
  ```
- Remix: `data-rmx-key="<id>"` on root.
- Liquid: the results snippet prints content only when `search.performed`; it loops `search.results` with `limit: <limit>` and renders `rp-product-card` for items whose `object_type == 'product'`; total `search.results_count`. The LAYOUT MUST wrap the region part in the partial (RS-3), as in the usage below. No schema settings. Locale keys: `ripple.predictive-search.results_one` = `1 result`; `ripple.predictive-search.results_other` = `{{ count }} results`; `ripple.predictive-search.view_one` = `View 1 result`; `ripple.predictive-search.view_all` = `View all {{ count }} results`; `ripple.predictive-search.empty` = `No results for “{{ terms }}”`; `ripple.predictive-search.none` = `No results`.

Hydrogen data: on a request whose URL has a `q` parameter, the loader of the layout that renders the header passes `results`: `terms` = `q`; `products` and `total` from the `predictiveSearch` query of section 0.6, or from the first `limit` nodes and `totalCount` of the page's `search` query. On every other request it passes `null`.

```tsx
<PredictiveSearch id="psearch" results={results} placeholder="Search products" />
```

```liquid
{% block 'predictive-search', id: 'psearch' %}
  {% partial 'rp-predictive-results' %}{% render 'rp-predictive-search-results', search: search, action: routes.search_url, limit: 6 %}{% endpartial %}
{% endblock %}
```

### Commerce

- Store fields read: none.
- Adapter methods called: `refresh`, `usable`.
- Regions refreshed: `rp-predictive-results`; `reason: "predictive"`; no history change; no navigation fallback.
- Pending and error behaviour: root `data-pending` / `aria-busy` while a request runs; errors are silent.

| Meaning | hydrogen backend | liquid backend |
|---|---|---|
| Request URL | `<action>?type=product&q=<terms>` (document; region extracted) | the same URL through `partials.fetch` |
| Results | `predictiveSearch` or `search` query in the loader | `search.results` |

### Agent surface

`accessibility-tree` (the input and the result links). Bridge: component `rp-predictive-search`, manifest `agent.actions`: `["setQuery", "clear"]` ([08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.2, D-095): `setQuery(query: string): void` sets the input value and starts the request of behaviour item 1; `clear(): void` empties the input and hides the panel. Confirm: none. Secret: none.

### Checker rules

RP104 (`id`), RP114 (`<id>-content`), RP115 (no `role="combobox"`), RP308 (one region `rp-predictive-results`), RP403 (Liquid: partial declared in the layout). Manifest `rules[]`: `predictive-search-input` (`requires-descendant`, selector `:scope`, target `form[method="get"] input[type="search"][name="q"][data-rp-part="input"]`); `predictive-search-panel` (`requires-descendant`, selector `:scope`, target `[data-rp-part="results"][hidden] [data-rp-region="rp-predictive-results"]`; "The results panel must be printed hidden and must contain the region."); `predictive-search-one` (`max-count`, selector `rp-predictive-search`, count 1).

### Acceptance tests

1. Tier 2: `default`, `results`, `no-results`, `placeholder`, `class`, `children`, `escaping` are canonical-equal in all four hosts with the masks above.
2. Tier 5: [05-commerce.md](05-commerce.md) test C-14 (one request 200 ms after typing; panel shown; status announced; arrow keys; Escape; URL unchanged).
3. Tier 5: the request URL contains `type=product` and `q=shirt`.
4. Tier 5: clearing the input hides the panel and sends no request.
5. Tier 3: upgrade produces no mutation outside the allow-list; the panel stays `hidden`.
6. Tier 6: with scripting disabled the panel is not displayed and Enter navigates to `/search?type=product&q=shirt`.

### Evidence and UNVERIFIED

- Evidence: D-048; [05-commerce.md](05-commerce.md) section 7.4; `ripple/docs/research/hydrogen-core.md` (predictive search store not usable on Liquid).
- UNVERIFIED: `useRegionHtml` on the `react` host (SPIKE-10; D-090 item 4); Storefront API `predictiveSearch` arguments and result fields (section 0.6); Liquid `search.results` item member `object_type` and that `type=product` restricts `search.results` to products; that `search.results` without `{% paginate %}` returns at least `limit` items.

### Fallback (SPIKE-10)

Applies only to the `react` host and only when SPIKE-10 fails (`useRegionHtml` cannot publish fetched region HTML into the React tree; D-090 item 4). Nothing changes in the other hosts.

1. `PredictiveSearchResults` does not call `useRegionHtml`; it always renders its `results` prop (the second `return` of the code above).
2. The React app handles `rp:refresh` on `document`: when `event.detail.reason === "predictive"` it calls `event.preventDefault()`, fetches its own results route with `event.detail.url`, and stores the result in state that it passes as the `results` prop of `PredictiveSearch` ([05-commerce.md](05-commerce.md) section 8.2 step 2). The recipe is printed in the `ripple-commerce` skill.
3. The element then opens the panel on the next render in which the region has children (behaviour item 2 is unchanged).

---

## LiveForm

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

## Ledger issues

None open. See `00-decisions.md` sections 13.2 and 13.3 (D-109 to D-113).
