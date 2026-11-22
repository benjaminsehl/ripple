# Hydrogen core: what Ripple's commerce layer binds to

Status: research complete. Package studied: `@shopify/hydrogen` 2026.10.3 (source tree `hydrogen/packages/hydrogen`, plus the npm tarball, which was installable).

This report builds on `react-and-custom-elements.md` and `uisdk-web-elements.md`. It does not repeat them. Where it narrows one of their open points, it says so.

## 0. Method and limits

Read: `hydrogen/packages/hydrogen/src/core/**`, `src/react/cart.tsx`, `vendor/standard-actions.d.ts`, `vendor/standard-events.d.ts`, `examples/sveltekit`, the Hydrogen skills (cart-ui, cart-drawer, variant-form, collection-browser, predictive-search, request-handlers, image, money, markets, shop-pay, analytics), and the base theme (`ripple/theme`, including `AGENTS.md` in full). Shopify docs were queried only through the Shopify docs search tool.

Ran: jsdom spikes against the real npm build of `@shopify/hydrogen@2026.10.3`, bundled with esbuild. Files: `ripple/docs/research/spikes/hydrogen-core/` (`run*.cjs`, `result*.txt`).

Limits, stated plainly:

- `cdn.shopify.com`, `mock.shop`, `unpkg.com` and `jsdelivr.net` were blocked by the network proxy. The npm registry was reachable.
- The real Standard Actions runtime (`https://cdn.shopify.com/storefront/standard-actions.js`) was therefore NOT executed. The spikes use `fake-sa.js`, an emulation written from the vendored type declarations (`configure` first-call-wins, `isDefault()`, `defaultHandler`, `shopify:cart:*` events with a `promise`). Every spike result about Standard Actions is "Hydrogen's side of the contract verified, Shopify's side emulated".
- No real Liquid storefront and no mock.shop request was exercised.
- `@shopify/partial-rendering`, `@shopify/standard-actions`, `@shopify/standard-events` return 404 on npm. They are platform-provided module specifiers, not installable packages.

Anything marked UNVERIFIED was not seen in source, docs or a spike and MUST be checked on a real store that has the Liquid July '26 preview before the spec treats it as fact.

## 1. Public API reference

All names below are exported from `@shopify/hydrogen` (`hydrogen/packages/hydrogen/src/core/index.ts`) unless marked internal.

### 1.1 Cart store

Source: `hydrogen/packages/hydrogen/src/core/cart/cart.ts`.

```ts
function createCartStore<TData = CartData>(options?: {
  initialData?:
    | { cart: TData | null; errors?: unknown }
    | PromiseLike<{ cart: TData | null; errors?: unknown }>;
}): CartStore;

type CartStore = {
  connect(): void;          // attach document listeners, configure updateCart once, load cart if no initialData
  destroy(): void;
  hydrate(data: CartData): void;
  getState(): CartState;
  subscribe(listener: (state: CartState) => void): () => void;   // no selector overload publicly
  fetch(): Promise<void>;
  refresh(): void;
  reset(): void;
  handleFormSubmit(event: SubmitEvent, eventDetail?: Record<string, unknown>): Promise<void>;
};

function configureCartEndpoint(endpoint: string): void;   // module-level; see 1.3
class CartNetworkError extends Error { status: number }
const STANDARD_ACTION_TIMEOUT_IN_MS: number;              // 30 s
```

Facts that shape Ripple:

- There is NO imperative mutation method (`addLine`, `updateLine`, ...). Mutations enter the store only through `handleFormSubmit(event)` or by any code calling `Shopify.actions.updateCart(...)`, which the store observes through `shopify:cart:lines-update | discount-update | note-update | attributes-update` events on `document`.
- `handleFormSubmit` requires `event.target instanceof HTMLFormElement` and `event.submitter instanceof HTMLElement`. The intent is `submitter.getAttribute("value")`. A form submitted with no submitter (for example bare `form.submit()`) is rejected.
- `createObservable` (`src/core/observable.ts`) has a selector overload but is internal. Ripple MUST do its own selection inside the listener.
- State is module-singleton in three places: the configured endpoint, the "updateCart configured" flag, and the Standard Actions handle. Consequence in section 3.3.
- Runtime requirements: `AbortSignal.any` (Safari 17.4+) and `crypto.randomUUID`.

`CartState` (`src/core/cart/state.ts`):

```ts
type CartState<TData = CartData> = {
  data: TData;                    // EMPTY_CART_DATA before load
  loading: boolean;
  readyPromise?: Promise<void>;
  revalidating?: boolean;
  pending: {
    lines: Set<string>;           // line ids as submitted
    note: boolean;
    attributes: boolean;
    discountCodes: Set<string>;
    cost?: boolean;
  };
  errors: {
    cart: ErrorGroup; lines: Map<string, ErrorGroup>;
    note: ErrorGroup; attributes: Map<string, ErrorGroup>;
    discountCodes: Map<string, ErrorGroup>;
    network: CartNetworkEntry[];
    lastUpdatedAt: number; /* plus per-group *UpdatedAt stamps */
  };
};

type CartData = {
  id: string | null; updatedAt?: string; checkoutUrl?: string;
  totalQuantity: number;
  cost: { subtotalAmount; totalAmount; checkoutChargeAmount };
  note?: string; attributes: { key; value }[];
  lines: { nodes: CartLine[] };
  discountCodes: { code: string; applicable: boolean }[];
  buyerIdentity?: unknown;
};
```

Helpers: `EMPTY_CART_DATA`, `EMPTY_CART_STATE`, `createEmptyCartErrors`, `createEmptyErrorGroup`, `sanitizeQuantity(raw, {min?, max?}): number`, `DEFAULT_MINIMUM_QUANTITY`, `NO_QUANTITY_LIMIT`.

Optimistic behaviour: an add projects an optimistic line (id prefix `optimistic:`) only when `eventDetail.products[]` contains `{ id: merchandiseId, price, ... }`. Without it the store only bumps `totalQuantity`. The first add with no cart id is serialized; later adds carry `cartId` (spike G).

### 1.2 Form field protocol ("Hydrogen dialect")

Source: `src/core/cart/form.ts`, `src/core/cart/cart.ts` (`handleFormSubmitInStore`), `src/core/cart/actions.ts`.

```ts
function createCartFormRegister(): CartFormRegister;
```

| Call | Returns |
| --- | --- |
| `register("merchandiseId", {value})` | `{name:"merchandiseId", value}` |
| `register("sellingPlanId", {value})` | `{name:"sellingPlanId", value}` |
| `register("lineId", {value})` | `{name:"lineId", value, readOnly:true}` |
| `register("quantity", {value})` | `{name:"quantity", value}` |
| `register("quantity", {value, interactive:true})` | `{name:"quantity", value, type:"text", inputMode:"numeric", pattern:"\\d+", autoComplete:"off", autoCorrect:"off"}` |
| `register("discountCode" \| "note", {value})` | `{name, value}` |
| `register("attributeValue", {key, value})` | `{name:"attributes.<key>", value}` |
| `register("add" \| "increase" \| "decrease" \| "discount-apply" \| "discount-remove" \| "note-update" \| "attributes-update")` | `{name:"intent", value:<intent>}` |
| `register("remove")` | `{name:"intent", value:"remove", formNoValidate:true}` |
| `register("set")` | `{name:"intent", value:"set", type:"submit", hidden:true}` |

Intent semantics in the client store:

- add: `intent === "add"`, or no intent and the form has `merchandiseId`. Reads `merchandiseId`, `quantity` (default 1, min 1), `sellingPlanId`, `attributes.<key>`.
- `increase` / `decrease` / `remove` / `set`: need `lineId`. `increase` and `decrease` are computed from the store's own copy of the line (`line?.quantity ?? 0`). `set` reads `quantity`; `<= 0` removes; a positive value clamps to `merchandise.quantityAvailable` when known.
- `discount-apply` / `discount-remove`: read `discountCode`; the store sends the full resulting code list.
- `note-update` reads `note`. `attributes-update` sends every `attributes.*` field.
- Anything else throws `Unknown cart form intent: "<x>"`.

```ts
function attachQuantityInput(inputEl: HTMLInputElement, formEl: HTMLFormElement): () => void;
```

Throws unless the form's first `button:not([type=button])` is `name="intent" value="set"`. On the input's `change` it calls `formEl.requestSubmit(thatButton)`. This is why the hidden `set` button MUST be the first submit button of each line form: it also makes Enter in the quantity field submit `set` with JS disabled.

Canonical line form (Hydrogen dialect):

```html
<form method="post" action="/api/cart">
  <button name="intent" value="set" type="submit" hidden></button>
  <input name="lineId" value="gid://shopify/CartLine/..." readonly hidden>
  <button name="intent" value="decrease">-</button>
  <input name="quantity" value="2" type="text" inputmode="numeric" pattern="\d+" autocomplete="off">
  <button name="intent" value="increase">+</button>
  <button name="intent" value="remove" formnovalidate>Remove</button>
</form>
```

With an endpoint configured, the store writes the confirmed quantity back into `form[action="<endpoint>"] input[name="quantity"]` for the changed line (skipping focused or hidden inputs). With no endpoint (Liquid) this sync does not run.

### 1.3 Server handlers and `/api/cart`

Source: `src/core/cart/server-handlers.ts`, `actions.ts`, `cookie.ts`.

```ts
function createCartServerHandlers(options?): { GET(request): Promise<Response>; POST(request): Promise<Response> };
function parseCartRequest(request: Request): Promise<{ action: CartAction; cartId: string | null }>;
function getCartId(request: Request): string | null;
function getCart(cartId, storefront, cartQuery?): Promise<...>;
function createCartCookie(...): string;      // cart=<token>; Path=/; SameSite=Lax; Max-Age=1209600
const cartQueries: {...};
```

- `GET /api/cart` returns `{cart, errors?}`, private cache.
- `POST` with JSON body (`UpdateCartPayload`: exactly one of `lines | discountCodes | attributes | note`, optional `cartId`) returns JSON `{cart, userErrors, warnings}`.
- `POST` with a form body (the no-JS path) applies the intent and answers `303` to the same-origin `Referer` (else `/`), setting the `cart` cookie when a cart is created. Server-side `increase`/`decrease` use the posted `quantity`. User errors are NOT surfaced on this path; the buyer just lands back on the page.
- `configureCartEndpoint("/api/cart")` switches the client store to this endpoint: load is `GET endpoint`, mutations are `POST endpoint` JSON, issued from inside the store's `updateCart` handler. `/api/cart` is the conventional path, applied automatically only by framework providers; a framework-less host MUST call `configureCartEndpoint` itself (as `examples/sveltekit/src/lib/cart.ts` does).
- Without `configureCartEndpoint`, the same handler calls Standard Actions `defaultHandler()` and loads through `Shopify.actions.getCart(...)`. This is the Liquid path (section 3).
- `handleShopifyRoutes` also proxies the Online Store AJAX cart paths (`/cart/add|update|change|clear`, with or without `.js`) and handles `GET /checkout` and `GET /cart/<variant>:<qty>` (`src/core/request-routing/interceptors/*`). Ripple MUST NOT use those AJAX paths (decision: no Ajax Cart API); they are noted only so nobody mistakes them for the cart API.

### 1.4 Standard Actions and events

Source: `hydrogen/packages/hydrogen/vendor/standard-actions.d.ts`, `vendor/standard-events.d.ts`, Shopify docs.

```ts
window.Shopify.actions.getCart(input?: {cartId?: string}, options?: {signal?}): Promise<...>   // not configurable
window.Shopify.actions.updateCart(payload: UpdateCartPayload, options?: UpdateCartOptions): Promise<UpdateCartResult>
window.Shopify.actions.openCart(...)
// each configurable action:
action.configure(options: { eventTarget?, handler? }): boolean   // first call wins; later calls return false
action.isDefault(): boolean

type UpdateCartPayload = {
  cartId?: string;
  lines?: { id?: string; merchandiseId?: string; quantity: number; attributes?; sellingPlanId? }[];
  note?: string; discountCodes?: string[]; attributes?: {key; value}[];
};
type UpdateCartOptions = { signal?: AbortSignal; event?: { detail?: unknown; context?: "product" | "cart" | "dialog" | "standard-action" } };
type UpdateCartResult = { cart: StorefrontCartSummary; userErrors?; warnings?; detail? };
// StorefrontCartSummary = { id, totalQuantity, cost:{totalAmount}, lines:{nodes:[{id, quantity, cost:{totalAmount}}]}, discountCodes }
```

- Line `id` is documented as "Existing-line id from SFAPI or the AJAX cart API". `merchandiseId` accepts "ProductVariant GID or raw variant id".
- Events dispatched on the configured `eventTarget` (Hydrogen sets `document`): `shopify:cart:lines-update`, `shopify:cart:discount-update`, `shopify:cart:note-update`, `shopify:cart:attributes-update`, `shopify:cart:error`, plus `shopify:product:select`, `shopify:collection:update`, `shopify:search:update` and view events. Cart events carry a `promise` that settles with the result.
- Docs: the actions exist on every Liquid storefront by default and are ready after `DOMContentLoaded`. Configuring any handler disables the default page-reload fallback.
- Hydrogen configures `updateCart` only. It never configures `openCart`.
- On a Hydrogen server app the runtime arrives through `getShopifyScriptTags(...)` / `renderShopifyScriptTags(...)` / `initializeShopifyScripts({consent, navigate, nonce, routes, webMcp})` (`src/core/shopify-scripts/*`), which emit `<script id="shopify-standard-actions" type="module" src="https://cdn.shopify.com/storefront/standard-actions.js">` plus the analytics bus and consent bootstrap. The store itself only needs `window.Shopify.actions` to exist; it does not require Hydrogen's script tags.

Hydrogen's guidance for code-driven changes (cart-ui skill): call `Shopify.actions.updateCart` directly only when `isDefault() === false`, the cart has finished loading, and a cart exists; one kind of change per call.

### 1.5 Product form

Source: `src/core/product/*`.

```ts
function createProductFormStore(product: ProductInput, cartStore: CartStore,
  options?: { selectedOptions?: SelectedOption[] }): ProductFormStore;
// getState(): { options, selectedOptions, selectedVariant, errors:{userErrors, warnings, networkErrors}, matchedLineItem }
// subscribe, connect, destroy, reset, hydrate(product, opts?)
// selectOption(name, value): { status: "resolved" | "unresolved" | "invalid", selectedOptions, selectedVariant, reason? }
// handleFormSubmit(event): passes {products:[{id,title,product,selectedOptions,image,price}]} so the cart store can project an optimistic line

function createProductFormRegister(selectedVariant, selectOption): ...
//  "merchandiseId" -> {name:"merchandiseId", value}
//  "quantity"      -> {name:"quantity", ...}
//  "optionValue"   -> {name:<optionName>, value, onChange, onClick}
//  "attributeValue"-> {name:"attributes.<key>", ...}
//  "addToCart"     -> {name:"add-to-cart", type:"submit"}      (no value: bare merchandiseId means add)

function canAddToCart(product, options): boolean;
function getSelectedVariant(options): Variant | null;
function findCartLineByMerchandiseId(lines, id): CartLine | undefined;
function getSelectedProductOptions({ searchParams, allowedOptionNames? }): SelectedOption[];   // skips "variant"
function buildProductSelectionSearchParams({ style?: "options" | "variant", selectedOptions, variant?, optionNames, base? }): URLSearchParams;
```

`ProductInput` is the Storefront API shape: `id, title, handle, options[].optionValues[].{name, firstSelectableVariant, swatch}, selectedOrFirstAvailableVariant, adjacentVariants, encodedVariantExistence?, encodedVariantAvailability?, requiresSellingPlan?`. A Liquid template does not have this object, so the product form store is a Hydrogen-host tool only.

No-JS contract (variant-form skill): option values are GET links (`?Color=Red&Size=M`) with `aria-current`; a value that does not exist is a disabled button; sold-out values stay selectable; values are never hidden; variant selection lives outside the add form; the add form posts `merchandiseId` to `/api/cart`. Server: `handleShopifyRoutes` redirects `?variant=<numeric>` to option params.

### 1.6 Collection store

Source: `src/core/collection/*`.

```ts
function createCollectionStore(input: { data: { handle: string; dataSearch: string }; urlSearch?: string; onBrowseChange?: () => void }): CollectionStore;
// getState(): { handle, filters: ProductFilter[], sortKey, reverse, status: "idle" | "loading" }
// subscribe, setFilters, toggleFilter, toggleFilterInput(inputJson), setSortKey, setSortByValue, reset,
// matchesParams, syncFromParams, settle, serializeToParams, getFilterRemovalUrl, handleFormSubmit(event), setOnBrowseChange
function createCollectionReconciler({ getStore, readUrlSearch, emitChange }, initialPrevUrlSearch?): { reconcile(urlSearch, dataSearch); handleBrowseChange(); reset() };
// pure helpers: parseCollectionParams, serializeCollectionParams, normalizeCollectionSearch, parseSortByValue, getSortByValue,
// getFilterRemovalUrl, filterEquals, isFilterInputActive, createInitialCollectionState
```

The store holds filter and sort state only. It owns no products; the host re-renders the grid.

URL parameters are the Liquid storefront's own: `filter.v.price.gte`, `filter.v.price.lte`, `filter.v.availability`, `filter.p.product_type`, `filter.p.vendor`, `filter.p.tag`, `filter.v.option.<name>`, `filter.p.m.<ns>.<key>`, `filter.v.m...`, `filter.v.t...`, `filter.p.category`, and `sort_by` (`price-ascending`, `best-selling`, ...). Cursors `before`/`after` are cleared on change. One GET form therefore works unchanged on both hosts.

No-JS contract (collection-browser skill): a GET form with an explicit `action`, a `<noscript>` submit button, price inputs `type="number"`, load-more as a GET link, `q` preserved as a hidden field on search pages.

### 1.7 Predictive search

Source: `src/core/predictive-search/*`.

```ts
function createPredictiveSearchStore(options?: {
  predictiveSearchEndpoint?: string;   // default "/api/predictive-search"
  debounceInMs?: number;               // 150
  minTermLength?: number;              // 1
  fetch?; limit?; limitScope?; types?; searchableFields?; unavailableProducts?;
}): { connect(); destroy(); clear(); search(term: string): Promise<void>; subscribe(fn);
      getState(): { term, status: "idle" | "loading" | "success" | "error", result: { term, total, items }, error } };

function createPredictiveSearchFormRegister(): (field: "query") => { name: "q"; type: "search"; autoComplete: "off"; autoCapitalize: "off"; spellCheck: false };
function getPredictiveSearchFormAttributes(action = "/search"): { action; method: "get"; role: "search" };
function readPredictiveSearchFormTerm(formData: FormData): string;
function getPredictiveSearchItemUrl(item, { routes, term, pathPrefix? }): string;
function getSearchResultUrl({ baseUrl, term, trackingParameters?, params? }): string;
function createPredictiveSearchServerHandlers(...); queryPredictiveSearch(...); makePredictiveSearchQueries(...);
```

The store fetches `GET <endpoint>?q=...` and expects Hydrogen's JSON. No such JSON endpoint exists on a Liquid storefront, so this store is Hydrogen-host only. No-JS contract on both hosts: `<form action="/search" method="get" role="search"><input name="q" type="search">`.

### 1.8 Money

```ts
function formatMoney(money: MoneyV2, options: {
  locale: string; withoutCurrency?; withoutTrailingZeros?; minimumFractionDigits?; maximumFractionDigits?; currencyDisplay?;
}): FormattedMoney;   // localizedString, amount, currencySymbol, currencyNarrowSymbol, currencyName, numericAmount, parts,
                      // withoutTrailingZeros, withoutTrailingZerosAndCurrency, toString()
function formatMoney(range: [MoneyV2, MoneyV2], options): FormattedMoneyRange;
```

`Intl.NumberFormat`-based. Its output is not guaranteed to match the Liquid `money` filter (shop money format settings). Hydrogen's rule: never compute money on the client.

### 1.9 Image

Hydrogen core exports NO image helper and no image component (confirmed in `src/core/index.ts`; the hydrogen-image skill says so and prescribes a local `shopifyImageUrl` / `srcSetFor` helper using `width`, `height`, `crop` query params on `cdn.shopify.com` and `mock.shop` URLs). Ripple MUST ship its own.

### 1.10 Markets and i18n

`defineShopifyI18n`, `getSupportedLocales`, `resolveSupportedLocale`, `matchLocale`, `isSameLocale`, `getHtmlLang`, `getLocalePathSegment`, `getLocalizedHref`. Server-side configuration for pathname or domain routing and `@inContext`. On Liquid the platform owns this (`routes.*`, `localization`, `{% form 'localization' %}`). Ripple elements need only a locale string (for `formatMoney`) and a path prefix for hrefs.

### 1.11 Analytics and consent

`AnalyticsEvent`, `trackCartAnalytics(store)` (client only), and the script-tag functions in 1.4, which install the bus at `window.Shopify.analytics` and the consent bootstrap. On Liquid the platform emits its own analytics; the base theme uses view events and the `standard_event_data` filter. Ripple MUST NOT call `trackCartAnalytics` on Liquid (double counting risk; UNVERIFIED which events the platform already emits from Standard Actions).

### 1.12 Shop Pay

`defineShopPayButton`, `createShopPayButton`, `renderShopPayButton(options)`, `getShopPayButtonUrl` (returns `/cart/<id>:<qty>?...` or `/checkout?...`), `SHOP_PAY_BUTTON_TAG_NAME` (`hydrogen-shop-pay-button`). The element uses a declarative shadow root, and the URLs need `handleShopifyRoutes`. On Liquid the equivalent is `{{ form | payment_button }}`.

### 1.13 Customer account, routing, misc

`createShopifyRouteHandler`, `handleShopifyRoutes`, `handleShopifyRedirects`, `createShopifyRouteTemplates` / `defineShopifyRouteTemplates`, `createStorefrontClient`, `createShopifyRequestContext`, `createContentSecurityPolicy`, `flattenConnection`, `configureLogging`. All server-side. Customer account handling is server routes plus links; nothing for an element to bind to beyond an `<a href>`. Not applicable on Liquid.

## 2. What works with JavaScript disabled

| Area | Hydrogen server app | Liquid theme |
| --- | --- | --- |
| Add to cart | `<form method=post action=/api/cart>` + `merchandiseId` (+`quantity`, `sellingPlanId`, `attributes.<k>`); 303 back | `{% form 'product', product %}` + `id` (+`quantity`, `selling_plan`, `properties[k]`) to `/cart/add`; platform redirects to cart |
| Line quantity | per-line form, `lineId` + `quantity` + intent buttons | one cart form to `routes.cart_url` with `updates[]` per line and an update submit |
| Remove line | `intent=remove` button | link `item.url_to_remove` |
| Note / attributes | `intent=note-update` + `note`; `intent=attributes-update` + `attributes.<k>` | `note`, `attributes[k]` in the cart form |
| Discount code | `intent=discount-apply` + `discountCode` | none found (UNVERIFIED that any no-JS path exists) |
| Checkout | `<a href="/checkout">` via `handleShopifyRoutes` | submit `name="checkout"` in `{% form 'cart', cart %}` |
| Variant pick | GET links with option params | GET links (`?variant=<id>`) |
| Filters / sort | GET form, shared param names | same GET form |
| Search | `GET /search?q=` | `GET routes.search_url?q=` |
| Cart open | `<a href="/cart">` | `<a href="{{ routes.cart_url }}">` |
| Error display | none (303 only) | platform cart page |

## 3. R2: can the core stores run on a Liquid storefront with no Hydrogen server routes?

Verdict: YES for the cart store, under conditions. NO for the product form store and the predictive search store. OPTIONAL for the collection store.

### 3.1 Why the cart store works

Evidence in `src/core/cart/cart.ts`:

```ts
actions.updateCart.configure({
  eventTarget: () => document,
  handler: (defaultHandler, payload, options) => {
    const url = getCartRequestUrl();
    if (!url || !payload) return defaultHandler();
    return postCartUpdateToEndpoint(url, payload, options);
  },
});
```

With no `configureCartEndpoint` call, `getCartRequestUrl()` is null, mutations go through Shopify's `defaultHandler()`, and the load goes through `Shopify.actions.getCart`. Spike scenario 1: `connect()` issued `configure` + `getCart` and zero requests to `/api/cart`. Scenario 8 (endpoint set): `GET /api/cart`. Docs confirm the actions exist on every Liquid storefront.

### 3.2 Conditions

C1. Exactly one `updateCart.configure` per page, and it MUST be Hydrogen's. `configure` is first-call-wins. If anything configures first, Hydrogen throws `Standard Actions updateCart could not be configured.`; the store then never loads and cannot submit (spikes 5 and F). The base theme's `snippets/standard-actions-config.liquid` + `assets/standard-actions-override.js` does exactly that today. See section 5.

C2. Exactly one copy of the `@shopify/hydrogen` module per page. The configured flag and endpoint are module state. A second bundled copy fails configure (spike I) and does not see the first copy's endpoint (spike J). Two stores created from ONE copy stay consistent: store B observed store A's add through the document events (spike H). This closes the "two stores" question left open in `react-and-custom-elements.md` section 6: consistency holds per module copy, not per page.

C3. Store data on Liquid is a summary only. `UpdateCartResult.cart` is `{id, totalQuantity, cost.totalAmount, lines[{id, quantity, cost.totalAmount}], discountCodes}`. No titles, images, merchandise, subtotal, `checkoutUrl`, note or attributes. Whether `getCart` returns more on Liquid is UNVERIFIED. Therefore on Liquid the store is authoritative only for: count, pending flags, errors, and "something changed". Line markup and all money MUST come from server-rendered `{% partial %}` output.

C4. Line ids. Liquid renders `item.key`; the store holds whatever `getCart` returns (GIDs in the emulation). `increase` / `decrease` compute from the store's line, so an unknown id yields `0`: spike B sent `quantity: 1` for increase and `quantity: 0` for decrease, which REMOVES the line. On Liquid the adapter MUST always submit `set` with the absolute quantity taken from the DOM (spike C works; `pending.lines` contains the submitted id). Which id form the real runtime returns after a mutation is UNVERIFIED; docs warn "A storefront on the AJAX cart API passes its own line keys through, so don't assume a GID".

C5. `openCart` is not configured by Hydrogen. Ripple configures it on both hosts.

C6. Timing. If `document.readyState` is `loading`, the store waits for `DOMContentLoaded` before configuring; otherwise it configures immediately. To win C1 against apps, Ripple's module SHOULD be loaded so that `connect()` runs before other `DOMContentLoaded` listeners. The exact moment Shopify's runtime defines `window.Shopify.actions` on a Liquid page is UNVERIFIED.

C7. Failure fallback. If `connect()` throws or `window.Shopify.actions` is missing, Ripple MUST leave forms alone so the native Liquid submit happens. The base theme's `s-product-form.js` already has this fallback shape.

### 3.3 Other stores on Liquid

- Product form store: needs the Storefront API product object. Not available in Liquid without a Storefront API call, which would duplicate what the template already rendered. On Liquid, variant change is a `{% partial %}` refresh keyed by URL, as the base theme does (`partials.fetch('product-form', 'product-title', {url})`).
- Predictive search store: needs a JSON endpoint that Liquid does not have. On Liquid, predictive results are a partial refresh of a GET form (the base theme's `s-live-form` pattern).
- Collection store: usable (pure URL state), but adds nothing on Liquid beyond `parseCollectionParams` / `getFilterRemovalUrl`. Liquid already renders `filter.active_values[].url_to_remove`.

## 4. R3: no-JS cart form field names

Verdict: the two hosts need different field names, and that cannot be unified, because with JS disabled the names are dictated by whoever receives the POST: `/cart/add` wants `id`; `/api/cart` wants `merchandiseId` or `intent`. "One HTML contract" survives only at the element level (same `rp-*` tags, same `data-*` hooks, same button semantics), with a declared form dialect per host.

| Meaning | Hydrogen dialect (`/api/cart`) | Liquid dialect |
| --- | --- | --- |
| variant | `merchandiseId` (GID) | `id` (numeric) |
| quantity (add) | `quantity` | `quantity` |
| selling plan | `sellingPlanId` | `selling_plan` |
| line item property | `attributes.<key>` | `properties[<key>]` |
| action | submitter `name="intent" value=...` | form action URL; submit `name="add"` / `name="checkout"` |
| line identity | `lineId` (CartLine GID) | position in `updates[]`; JS uses `item.key` |
| line quantity | `quantity` + intent | `updates[]` |
| note | `note` | `note` |
| cart attribute | `attributes.<key>` | `attributes[<key>]` |
| discount | `discountCode` | none without JS |

Spike evidence:

- Spike 2: a native Liquid product form handed straight to `handleFormSubmit` throws `Unknown cart form intent: ""`. The Liquid form cannot be passed through untranslated.
- Spike 3 and A: building a detached Hydrogen-dialect form (or mirroring hidden inputs) and dispatching a real `SubmitEvent` with a submitter works. Raw numeric variant ids are accepted as `merchandiseId` per the type declarations (real runtime UNVERIFIED).
- Spike G: going through `handleFormSubmit` keeps the store's serialization of the first add. Calling `updateCart` directly skips the store's "loaded, cart exists, not default" preconditions.

Decision for the Liquid adapter: translate, then call `store.handleFormSubmit`. Do not call `Shopify.actions.updateCart` directly for buyer form submits.

```js
// Liquid adapter, illustrative
function submitThroughStore(store, nativeForm, submitter, intent, fields, detail) {
  const f = document.createElement('form');
  for (const [name, value] of Object.entries(fields)) {
    const i = document.createElement('input'); i.name = name; i.value = value; f.append(i);
  }
  const b = document.createElement('button'); b.name = 'intent'; b.value = intent; f.append(b);
  const ev = new SubmitEvent('submit', { submitter: b, cancelable: true });
  Object.defineProperty(ev, 'target', { value: f });
  return store.handleFormSubmit(ev, detail);
}
```

The spec SHOULD ask Hydrogen for a supported imperative entry point instead of this synthetic-event shim (see section 8).

## 5. Base theme: confirms, constrains, conflicts

Confirms:

- Native forms first, JS enhances. `s-product-form.js` intercepts `{% form 'product' %}` and falls back to native submit. Same shape as Ripple's progressive enhancement.
- Standard Actions are the mutation transport on Liquid; no Ajax Cart API. Matches the fixed decision and matches how the Hydrogen store works without an endpoint.
- Partials for re-render. `s-cart.js` calls `partials.fetch(...names)` then `partials.apply(html)`. Matches condition C3: the store signals, the server renders.
- Native `<dialog>` cart drawer with a link trigger to the cart page; both the theme and Hydrogen's cart-drawer skill prescribe it.
- Collection and search are GET forms with Liquid filter param names, identical to Hydrogen's.
- Checkout through `name="checkout"` in the cart form; dynamic checkout through `payment_button`.

Constrains:

- Line identity on Liquid is `item.key` (`data-line-key`), quantities are absolute, read from the DOM. Ripple's Liquid adapter MUST do the same (C4).
- Partial names are a theme-level contract (`cart-items`, `cart-count`, `cart-drawer`, `cart-drawer-footer`, `product-form`, `product-title`, `predictive-results`, `collection-grid`, ...). Ripple elements MUST take the partial names to refresh as attributes (the theme uses `data-partials`); they MUST NOT hard-code them.
- `@shopify/partial-rendering` is a platform specifier resolved by the storefront, not an npm dependency. Ripple's Liquid bundle MUST import it as an external and MUST NOT list it in `package.json`.
- The theme's cart quantity inputs have no `name` and the discount input is `form=""`: with JS off, the theme cannot change quantity or apply a discount. Ripple's Liquid markup SHOULD name quantity inputs `updates[]` inside the cart form to restore the no-JS path. No-JS discount stays unavailable on Liquid.
- The theme applies one discount code by sending `{discountCodes: [code]}`, replacing the list. Hydrogen's `discount-apply` sends the full list from store state. On Liquid the store's code list comes from the summary (`discountCodes` is present), so the Hydrogen behaviour is the safer one.

Conflicts and resolutions:

1. Who configures `updateCart`. Theme: `standard-actions-config.liquid` configures `updateCart` and `openCart` itself. Hydrogen store: must be the configurer (C1). They cannot coexist. Resolution: a Ripple Liquid theme MUST NOT include a theme-side `updateCart.configure`. Ripple's bundle creates the Hydrogen store (which configures `updateCart`), configures `openCart` itself, and moves the theme handler's after-effects (partial refresh, live-region announcement) into a store subscriber and `shopify:cart:*` listeners. This follows "base theme is reference, not a model to copy".
2. Direct `updateCart` calls from elements. Theme elements call `Shopify.actions.updateCart` directly. With the Hydrogen store as configurer this still works (the store observes the events), but bypasses the store's serialization. Resolution: Ripple elements go through the adapter (section 6); third-party code calling `updateCart` remains supported and is reflected through events.
3. Variant picker. Theme: partial refresh. Hydrogen: `createProductFormStore`. Resolution: per-host adapter; the element contract (option value links, `aria-current`, disabled for non-existent) is shared.
4. `ui-drawer` vs native `<dialog>`. Both Hydrogen and the theme prescribe native dialog for the cart. If `rp-cart-drawer` wraps the UI SDK drawer, it MUST preserve: link trigger to the cart page, `openCart` handler opening it, focus return. This is a UI-layer decision for the spec; flagged, not decided here.

## 6. Adapter design per host

One interface, two implementations, chosen at boot. `rp-*` elements talk only to the interface.

```ts
interface RippleCommerce {
  host: "hydrogen" | "liquid";
  cart: CartStore;                                  // Hydrogen core store on both hosts
  dialect: FormDialect;                             // field names for markup helpers and readers
  submitCart(form: HTMLFormElement, submitter: HTMLElement | null, event: SubmitEvent): Promise<void>;
  setLineQuantity(lineId: string, quantity: number): Promise<void>;
  refresh(scopes: string[]): Promise<void>;         // liquid: partials; hydrogen: no-op or host callback
  openCart(): void;
  money(m: MoneyV2): string;
  ready: Promise<void>; usable: boolean;            // false -> elements leave native forms alone
}
```

Store ownership (both hosts): Ripple owns one cart store per page behind a module accessor, as `react-and-custom-elements.md` section 6 recommends. The React binding reads it with `useSyncExternalStore` and MUST NOT mount Hydrogen's `CartProvider` (it creates its own store and its context is not exported).

### 6.1 Hydrogen server app

- Server (app code, documented by Ripple, not shipped as elements): `createCartServerHandlers()` mounted at `/api/cart`; `handleShopifyRoutes`; `renderShopifyScriptTags` in the document head; predictive search handlers at `/api/predictive-search`.
- Client boot: `configureCartEndpoint("/api/cart")`, `createCartStore({ initialData })`, `connect()`. Configure `openCart`.
- Markup: Hydrogen dialect, `action="/api/cart" method="post"`, per-line forms with hidden `set` button first.
- `submitCart`: `store.handleFormSubmit(event, detail)` unchanged. Product forms pass `{products:[...]}` from `createProductFormStore` for optimistic lines.
- `setLineQuantity`: `attachQuantityInput(input, form)`.
- Rendering: full `CartData` is available. In React the host renders from state. In a non-React server host, line markup is server-rendered and Ripple updates text and attributes it owns (count, quantity value, pending, errors); structural changes need a host re-render callback.
- Packaging: `@shopify/hydrogen` MUST be a peer dependency and external in Ripple's library build so the app and Ripple share one module copy (C2).

### 6.2 Liquid theme

- Server: none. Templates render native Liquid forms and `{% partial %}` regions.
- Client boot: do NOT call `configureCartEndpoint`. `createCartStore()` (optionally seeded; see below), `connect()` inside try/catch; on failure set `usable = false`. Configure `openCart`. The prebuilt `ripple.js` is the only copy of Hydrogen on the page (C2). No theme-side `updateCart.configure` (section 5, conflict 1).
- Markup: Liquid dialect.
- `submitCart`: `preventDefault`, read Liquid fields, translate (`id` -> `merchandiseId`, `selling_plan` -> `sellingPlanId`, `properties[k]` -> `attributes.k`), call `handleFormSubmit` through the shim in section 4. If `usable` is false, do nothing and let the native submit proceed.
- `setLineQuantity`: always intent `set` with the absolute DOM quantity and `lineId = item.key`. NEVER `increase` / `decrease` (C4).
- After a mutation settles: `partials.fetch(...names)` + `partials.apply(html)` for the names declared on the element. Money and line markup come only from partials (C3). `formatMoney` MUST NOT be used to overwrite Liquid-rendered money.
- Pending and errors: from `store.getState().pending.lines` / `.errors`, looked up by the id the element rendered.
- Seeding: `{{ cart | standard_event_data: 'view', context }}` outputs `{context, cart}`; it is a candidate for `initialData` to avoid a `getCart` per page. Whether its line ids are keys or GIDs is UNVERIFIED; until checked, do not seed, and let `connect()` load.
- Variant change, predictive search, filters: partial refresh over GET, no Hydrogen store.

### 6.3 Which Hydrogen API each element uses

Element names follow the proposal; "none" means the element uses no Hydrogen API on that host.

| Element | Hydrogen server app | Liquid theme |
| --- | --- | --- |
| `rp-cart` (root, count, pending, errors) | `createCartStore`, `configureCartEndpoint`, `subscribe`, `getState` | `createCartStore` (no endpoint), `subscribe`, `getState` (summary only) + partials |
| `rp-cart-line` | `handleFormSubmit`; `createCartFormRegister` names; quantity sync by store | `handleFormSubmit` via translation, `set` only; partial refresh |
| `rp-quantity` (in a line) | `attachQuantityInput`, `sanitizeQuantity` | `sanitizeQuantity`; adapter `setLineQuantity` |
| `rp-cart-discount` | intents `discount-apply` / `discount-remove`, `errors.discountCodes` | same intents via translation; JS only |
| `rp-cart-note` | intent `note-update` | intent `note-update` via translation; no-JS through cart form `note` |
| `rp-cart-drawer` / opener | `Shopify.actions.openCart.configure` (Ripple) | same |
| `rp-product-form` | `createProductFormStore`, `createProductFormRegister`, `canAddToCart` | none for variants; add goes through cart adapter |
| `rp-variant-picker` | `selectOption`, `buildProductSelectionSearchParams`, `getSelectedProductOptions` | none; partial refresh by URL |
| `rp-add-to-cart` button state | `canAddToCart`, `pending`, `matchedLineItem` | `pending` from cart store; availability from Liquid |
| `rp-collection-filters` / sort | `createCollectionStore`, `createCollectionReconciler`, `getFilterRemovalUrl` | optional `parseCollectionParams`; partial refresh |
| `rp-predictive-search` | `createPredictiveSearchStore`, form register, `getPredictiveSearchItemUrl`, `getSearchResultUrl` | none; GET form + partial |
| `rp-money` | `formatMoney` | none (Liquid `money`) |
| `rp-image` | none (Ripple helper) | none (Liquid `image_url` / `image_tag`) |
| `rp-checkout-button` | link to `/checkout` (`handleShopifyRoutes`) | submit `name="checkout"` |
| Shop Pay | `renderShopPayButton` / `hydrogen-shop-pay-button` (shadow DOM) | `payment_button` |
| locale selector | `getLocalizedHref`, `getSupportedLocales` | `{% form 'localization' %}` |
| analytics | `trackCartAnalytics(store)` | none |

Bundle cost (esbuild, minified, gzip): cart store + form register + `attachQuantityInput` + `configureCartEndpoint` + `formatMoney` = 42.4 kB raw / 13.2 kB gz. All client stores = 65.3 kB / 20.2 kB gz. `formatMoney` alone = 4.8 kB / 1.6 kB gz. The Liquid bundle needs only the cart subset.

## 7. What Ripple needs that Hydrogen core does not provide

1. Image URL / srcset helper and an image element.
2. An imperative cart mutation API on the store (today: forms or raw `updateCart` with preconditions).
3. A Liquid form dialect or any mapping from `id` / `selling_plan` / `properties[...]` / `updates[]`.
4. Public selector-based subscribe.
5. A way to hand an existing store to `CartProvider`, or an exported cart context.
6. `openCart` configuration and the drawer behaviour.
7. Partial-refresh orchestration after mutations on Liquid.
8. Full cart data on Liquid (summary only; C3).
9. Quantity input sync when no endpoint is configured.
10. Safe relative quantity changes when the store does not know the line (C4).
11. Quantity rules (min, max, increment) beyond `sanitizeQuantity` bounds.
12. Live-region announcements for cart changes.
13. A typed error for "could not configure", and a supported recovery when another script configured first.
14. Product form state from Liquid data; predictive search without a JSON endpoint.
15. No-JS error display on the Hydrogen form path (303 only).
16. A light-DOM Shop Pay button (the shipped one uses shadow DOM).
17. Dispatch helpers for `shopify:product:select`, `shopify:collection:update`, `shopify:search:update`.
18. A polyfill or guard for `AbortSignal.any` on Safari before 17.4.

## 8. What the spec must say

Hosts and store

- S1. Ripple MUST use the Hydrogen core cart store on both hosts. On a Hydrogen server app it MUST call `configureCartEndpoint`. On Liquid it MUST NOT.
- S2. There MUST be exactly one copy of `@shopify/hydrogen` per page. The npm package MUST declare it as a peer dependency and keep it external. The prebuilt Liquid bundle MUST be the only copy on a Liquid page.
- S3. Ripple MUST own one cart store per page behind a module accessor. The React binding MUST read that store and MUST NOT mount Hydrogen's `CartProvider`.
- S4. On a page using Ripple, nothing else may call `Shopify.actions.updateCart.configure`. A Ripple Liquid theme MUST NOT ship the base theme's `standard-actions-config` for `updateCart`. Ripple MUST configure `openCart`.
- S5. If `window.Shopify.actions` is missing or store setup throws, Ripple MUST NOT intercept form submits. Native submission MUST proceed.

Forms

- S6. The spec MUST define two form dialects (table in section 4) and MUST state that field names differ by host by necessity. The shared contract is element tags, parts, `data-*` hooks and button semantics.
- S7. Hydrogen dialect: each cart line MUST be its own form whose first submit button is `name="intent" value="set" hidden`, with `lineId` and `quantity` fields. Forms MUST have `method="post"` and `action` equal to the configured endpoint.
- S8. Liquid dialect: product forms MUST be `{% form 'product' %}` with `id`; cart quantity inputs SHOULD be named `updates[]` inside a form posting to `routes.cart_url`; remove MUST be a link to `item.url_to_remove`; checkout MUST be a submit named `checkout`.
- S9. On Liquid, enhanced submits MUST be translated to Hydrogen field names and passed to `store.handleFormSubmit`. Elements MUST NOT call `Shopify.actions.updateCart` directly for buyer form submits.
- S10. On Liquid, line quantity changes MUST use intent `set` with an absolute quantity. `increase` and `decrease` intents MUST NOT be used on Liquid.

Rendering

- S11. On Liquid, cart line markup and all money MUST come from `{% partial %}` refresh. Elements MUST NOT render money from store data on Liquid. Elements MUST take partial names as attributes.
- S12. `@shopify/partial-rendering` MUST be treated as a platform-provided external, never an npm dependency.
- S13. Pending state MUST be shown without disabling controls, except controls on `optimistic:` lines. Errors MUST be rendered inline with `role="alert"` and associated to their control.
- S14. `rp-product-form` / `rp-variant-picker` MUST bind to `createProductFormStore` on Hydrogen and to partial refresh on Liquid. Option values MUST be GET links on both.
- S15. Collection filters and sort MUST be one GET form using the shared `filter.*` / `sort_by` names on both hosts.
- S16. Predictive search MUST degrade to `GET /search?q=`. It binds to `createPredictiveSearchStore` on Hydrogen only.
- S17. Ripple MUST ship its own image helper. `rp-money` uses `formatMoney` on Hydrogen only.
- S18. The Shop Pay button is an explicit exception to the light-DOM rule on Hydrogen; Liquid uses `payment_button`.

Testing

- S19. mock.shop can back the Hydrogen host tests only. It cannot serve a Liquid theme or the Standard Actions default handler. The Liquid host needs a real store with the Liquid July '26 preview. The spec MUST name that as a separate test target. (This does not change the mock.shop decision for the Hydrogen host.)
- S20. The spec MUST list the UNVERIFIED items below as gating checks for the Liquid host.

Requests to Hydrogen (non-blocking, SHOULD be filed): an imperative `store.update(payload, {detail})`; a store prop on `CartProvider`; a public selector subscribe; a typed configure-failure error.

## 9. UNVERIFIED, needs a real preview store

1. The real Standard Actions runtime behaves as the type declarations and the emulation say (first-call-wins `configure`, `defaultHandler`, event `promise`).
2. When `window.Shopify.actions` becomes defined on a Liquid page relative to module scripts and `DOMContentLoaded`.
3. What `getCart()` returns on Liquid (summary or more) and which line id form it uses.
4. Which line id form the default handler returns after a mutation, and whether it accepts `item.key` as `lines[].id` (docs say AJAX line keys are accepted).
5. Raw numeric variant id accepted as `merchandiseId` by the default handler.
6. Line id form in `{{ cart | standard_event_data }}` (decides whether seeding `initialData` is safe).
7. Any no-JS discount code path on a Liquid cart.
8. Which analytics events the platform already emits for Standard Actions mutations on Liquid.
9. Behaviour when an app embed configures `updateCart` before Ripple.
