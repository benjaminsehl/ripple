# 05 - Commerce layer

Status: specification. Law: [00-decisions.md](00-decisions.md) (D-041 to D-051, D-087 to D-095, sections 4.4 and 4.7). Where this document and the ledger disagree, the ledger wins.

This document specifies the JavaScript in `src/commerce/`, the markup hooks it reads, what each host must provide, the infrastructure element `rp-view-event`, page views, and the shared `Ripple*` data types (`src/types.ts`), money and image helpers. It does not specify classes, visual anatomy or props of commerce components (see [11-components-commerce.md](11-components-commerce.md)), the rules for writing an `rp-*` element (`definePrimitive` / `createParts`, see [04-elements.md](04-elements.md) section 7), the TSX / Liquid templates and React hooks (see [06-bindings.md](06-bindings.md)), the blueprints (see [12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md)), or the theme infrastructure (see [14-liquid-theme.md](14-liquid-theme.md)).

## 1. Reference implementation

A working implementation of everything in this document exists and was run in Chromium against the real `@shopify/hydrogen@2026.10.3` package with an emulated Standard Actions runtime:

| Path | Content |
|---|---|
| `ripple/docs/research/spikes/commerce/src/commerce/*.ts` | 15 files: the 14 source files of section 3 as they were before the reconciliation, plus `globals.d.ts`. Typechecks with `tsc --strict`. |
| `ripple/docs/research/spikes/commerce/fake-sa.js` | Emulation of `window.Shopify.actions` (`getCart`, `updateCart`, `openCart`). Test double only. |
| `ripple/docs/research/spikes/commerce/run.cjs`, `run2.cjs`, `run3.cjs` | Playwright scenarios L1 to L7 (liquid backend), D1 to D4 (details), H1 to H7 (hydrogen backend). |
| `ripple/docs/research/spikes/commerce/result.txt` | Recorded output of every scenario. |

The implementer MUST copy `ripple/docs/research/spikes/commerce/src/commerce/*.ts` to `src/commerce/` and then apply exactly these eighteen changes. Changes 3 to 18 were decided after the spike ran (ledger section 13; changes 10 to 18 by the feasibility review, ledger 13.4) and are therefore NOT covered by a scenario in `result.txt`.

| # | File | Change |
|---|---|---|
| 1 | `index.ts`, the five `rp-*.ts` files | Delete the spike function `define(tag, connect)` (a plain `HTMLElement` subclass) from `index.ts`. Add to the end of each `rp-*.ts` file the element shell of section 7.7 (one `definePrimitive` call and one exported `define...()` function that calls `createParts`). `defineElements()` in `index.ts` calls the five `define...()` functions. The controllers (`connectCart` and the other four) do not change except as listed in rows 3 and 7. |
| 2 | `globals.d.ts`, `tsconfig.json`, `stub-ui-sdk.ts` | Do not copy `tsconfig.json` or `stub-ui-sdk.ts` (they map `@ui-sdk/core` to a stub). Delete `globals.d.ts` if the repository already declares `window.Shopify` through `@shopify/hydrogen` types. |
| 3 | `rp-cart.ts`, `rp-product-form.ts`, `rp-predictive-search.ts` | Replace `import { announce } from "@ui-sdk/core";` with `import { announce } from "../runtime/announcer";` and pass `from` on every call, as section 9.1 states (D-019 item 5, D-079). No file under `src/commerce/` imports `announce` from `@ui-sdk/core`. |
| 4 | `refresh-remix.ts` | Replace the whole file with the code of section 8.3 (D-090). |
| 5 | `refresh-react.ts` | Replace the whole file with the code of section 8.3: the React strategy and the region-HTML store (D-090). |
| 6 | `adapter-hydrogen.ts` | In the `STRATEGIES` table replace the `remix` entry with `remix: refreshRemix` (the fallback to `refreshHtml` now lives inside `refreshRemix`). |
| 7 | `rp-product-form.ts` | After a successful add: dispatch `action`, then open the cart, then announce (section 7.2 step 5). The spike announced first. |
| 8 | `adapter.ts` | In `refresh`, the history write of step 4 (section 8.2) is skipped on the `react` host AND on the `remix` host when `options.navigate` is set. The spike skipped it on `react` only. The type of `RefreshStrategy`'s `reason` becomes `RefreshReason` (the value passed is `refreshOptions.reason` when it is one of the six values, otherwise `"manual"`). Add the export `getOptions` (4.6): `export function getOptions(): ResolvedOptions | null { return resolved; }`. |
| 9 | `adapter-liquid.ts`, `index.ts` | Replace `defineViewEvent` with the exported `startStandardEvents` of section 12.3 and remove the `void defineViewEvent();` line from `afterReady`. `create()` in `index.ts` calls `startStandardEvents()` as section 12.3 shows: the `rp-view-event` definition and the new page-view dispatch run only on Liquid and only when `options.analytics` is true (D-089). |
| 10 | `rp-cart.ts` | Empty-quantity guard in the `submit` listener (D-116; 7.1): a `set` submit whose quantity field is empty or not a number is prevented and nothing is sent. |
| 11 | `adapter.ts`, `rp-cart.ts`, `adapter-hydrogen.ts` | Checkout guard (D-117): new exports `registerFlush`, `hasUnsettled`, `settle` in `adapter.ts` (4.6); `rp-cart` registers a flush and records every action promise in `inflight` (7.1, connect row and the code after the table); `afterReady` of the hydrogen adapter adds the `onCheckoutClick` listener (5.1 step 5). |
| 12 | `adapter.ts`, `rp-product-form.ts` | Add errors (D-119): `errorMessage` gains the scope `"add"`, new export `hasUserError` (4.6, 9.2); the product form uses them and treats a warnings-only result as a successful add (7.2 step 4). |
| 13 | `adapter-liquid.ts`, `globals.d.ts` | Liquid connect timing (D-122): delete the synchronous `isDefault()` throw and the `cart.connect()` call from `createLiquidCommerce`; `probe` becomes the code of 5.2 item 4 (awaits `window.rpDomReady`, checks `isDefault()`, then `cart.connect()` and `cart.fetch()`). Declare `rpDomReady?: Promise<void>` on `Window`. |
| 14 | `adapter-hydrogen.ts` | Replace the spike's `rp-view-event` class with the class of 12.2 (observes `view-event-payload`, publishes once per payload value; D-123). |
| 15 | `dialect.ts`, `adapter-liquid.ts`, `adapter.ts`, `rp-cart.ts` | Note and attribute baseline, and "nothing sent" (D-126): `translateLiquidForm` takes `baseline` and `CartOp` gains `sent` (6.3); the Liquid `submit` part is the code of 5.2 item 3; `BackendParts.submit` and `RippleCommerce.submitCart` resolve `boolean` (4.1, 4.6): in `adapter.ts`, `submitCart` returns `false` after `nativeSubmit(...)` (both places) and otherwise `return await parts.submit(form, submitter, event)`; the inert `submitCart` is `() => Promise.resolve(false)`; `rp-cart`'s `run` announces nothing when the action resolved `false` (7.1). |
| 16 | `adapter-hydrogen.ts` | The `submit` part is the code of 5.1 step 3 (D-127): a product form submitted without a submitter is sent as one synthetic `add`; every path returns `true`. |
| 17 | `rp-cart.ts` | The `submit` listener is the code of 7.1 (D-129): with `usable === false`, a form that carries `data-rp-js="inflow"` is prevented and shows `strings.error` instead of posting. |
| 18 | `adapter.ts`, `adapter-hydrogen.ts` | New option `routes` (4.2; passed through `resolveOptions` unchanged). `afterReady` of the hydrogen adapter is the code of 12.1 item 1: `initializeShopifyScripts` is called regardless of `options.analytics`, with `consent`, `routes` and a `navigate` wrapper (D-130). |

Everything below is a description of that code after the eighteen changes. When prose and code disagree, the code in the spike folder is correct for behaviour that a scenario in `result.txt` covers and that rows 3 to 18 do not change; the prose is correct otherwise.

Not run (stated again under [Evidence and UNVERIFIED](#15-evidence-and-unverified)): the real Standard Actions runtime (SPIKE-01), real `@shopify/partial-rendering` (SPIKE-02), the new `refresh-react.ts` and `refresh-remix.ts` (SPIKE-10, SPIKE-11), `rp-view-event` and the Liquid page view, `initializeShopifyScripts` and `trackCartAnalytics` at runtime, the `definePrimitive` shell of section 7.7 (SPIKE-04), WebKit and Gecko.

## 2. Model

1. One page has one `RippleCommerce` object (D-042). It owns the one Hydrogen cart store (D-041), the form dialect (D-043), and the refresh strategy of the host (D-046).
2. Server-rendered HTML is the source of truth for structure and money text. The cart store is the source of truth for: the total quantity, which lines are pending, and errors.
3. Every commerce interaction is a real form or link that works without JavaScript. With JavaScript, an `rp-*` element intercepts the submit, click or change, runs the same operation through the store or the URL, and then asks the host to re-render named regions.
4. Elements never branch on `backend` or `host` (D-042). They call `getCommerce()` and read hook attributes (`data-rp-part`, `data-rp-field`, `data-rp-line`, `data-rp-refresh`, `data-rp-region`, `data-url`; ledger section 4.4).

Terms: **backend** is `hydrogen` (a server using `@shopify/hydrogen` and the Storefront API) or `liquid` (a Shopify theme). **host** is `html`, `react`, `remix` (all three on the hydrogen backend) or `liquid` (liquid backend).

## 3. Files

All in `src/commerce/` (14 files; ledger tree 5.1). Import rules are in [01-architecture.md](01-architecture.md) section 2. The shared data types and image helpers of section 11 live outside this folder, in `src/types.ts` and `src/image.ts`.

| File | Exports | Role |
|---|---|---|
| `index.ts` | `getCommerce`, `configureCommerce`, types `CommerceOptions`, `CommerceStrings`, `RippleCommerce` | Entry `<pkg>/commerce`. Registers the starter and queues the start. Side effects: yes. |
| `adapter.ts` | see 4.6 | Options, accessor, inert object, shared implementation (`createCommerce`), error lookup, synthetic submit. |
| `dialect.ts` | `CartIntent`, `CartOp`, `FormDialect`, `hydrogenDialect`, `liquidDialect`, `FIELD_TO_PROTOCOL`, `isCartIntent`, `translateLiquidForm` | Field-name tables and the Liquid-to-Hydrogen form translation. |
| `adapter-hydrogen.ts` | `createHydrogenCommerce` | hydrogen backend. Also defines `rp-view-event` for this backend (D-089). Value imports from `@shopify/hydrogen`: `configureCartEndpoint`, `createCartStore`, `initializeShopifyScripts`, `trackCartAnalytics`. |
| `adapter-liquid.ts` | `createLiquidCommerce`, `startStandardEvents` | liquid backend. Also defines `rp-view-event` for this backend and dispatches the page view (D-089). Value import from `@shopify/hydrogen`: `createCartStore`. Dynamic import of the platform specifier `@shopify/standard-events`: `createViewEventElement`, `PageViewEvent`. |
| `refresh-html.ts` | `refreshHtml` | `html` strategy. Copied from the spike unchanged. |
| `refresh-liquid.ts` | `refreshLiquid` | `liquid` strategy. Dynamic import of the platform specifier `@shopify/partial-rendering`. |
| `refresh-remix.ts` | `refreshRemix` | `remix` strategy. |
| `refresh-react.ts` | `refreshReact`, `getRegionHtml`, `subscribeRegionHtml` | `react` strategy and the region-HTML store that backs `useRegionHtml` (section 8.3). The two store functions are imported by `src/react/hooks.ts` only. |
| `rp-cart.ts` | `connectCart`, `rpCart`, `defineCart` | Controller, primitive and definition of `rp-cart`. |
| `rp-product-form.ts` | `connectProductForm`, `rpProductForm`, `defineProductForm` | The same for `rp-product-form`. |
| `rp-live.ts` | `connectLive`, `formUrl`, `rpLive`, `defineLive` | The same for `rp-live`. |
| `rp-predictive-search.ts` | `connectPredictiveSearch`, `rpPredictiveSearch`, `definePredictiveSearch` | The same for `rp-predictive-search`. |
| `rp-recommendations.ts` | `connectRecommendations`, `rpRecommendations`, `defineRecommendations` | The same for `rp-recommendations`. |

`rp-view-event` has no file of its own (ledger section 4.6): it is defined inside the two adapter files.

Every controller has the signature `(root: HTMLElement) => () => void`: it attaches delegated listeners to `root` (and `document` where stated), holds no reference to a descendant, and returns its cleanup (D-019 item 3). The shell of section 7.7 calls it when the root connects and calls the returned function when the root disconnects.

Only the two adapter files import values from `@shopify/hydrogen` inside `src/` (section 13).

## 4. The adapter API

### 4.1 `RippleCommerce`

```ts
import type { CartStore } from "@shopify/hydrogen";

export type RippleBackend = "hydrogen" | "liquid";
export type RippleHost = "html" | "react" | "remix" | "liquid";

export interface RippleCommerce {
  backend: RippleBackend;
  host: RippleHost;
  cart: CartStore;
  dialect: FormDialect;
  /** Resolves `true` when at least one cart operation was sent through the store, `false` otherwise (D-126). */
  submitCart(form: HTMLFormElement, submitter: HTMLElement | null, event: SubmitEvent): Promise<boolean>;
  setLineQuantity(lineId: string, quantity: number): Promise<void>;
  refresh(regions: string[], options?: { url?: string; reason?: string }): Promise<void>;
  openCart(): void;
  ready: Promise<void>;
  usable: boolean;
}
```

| Member | Contract |
|---|---|
| `cart` | The Hydrogen store: `connect`, `destroy`, `hydrate`, `getState`, `subscribe`, `fetch`, `refresh`, `reset`, `handleFormSubmit(event)`. Source: `hydrogen/packages/hydrogen/src/core/cart/`. User code MAY read it and subscribe. User code MUST NOT call `destroy`, `connect` or create another store. |
| `submitCart(form, submitter, event)` | The caller MUST have called `event.preventDefault()`. Awaits `ready`. If `usable` is false it calls `form.requestSubmit(submitter)` (native post) and resolves `false`. Otherwise it runs the form through the store (hydrogen: `cart.handleFormSubmit(event)`, or one synthetic `add` for a product form submitted without a submitter, 5.1 step 3; liquid: `translateLiquidForm` then one synthetic submit per operation). Resolves when the mutation has settled, with the value `BackendParts.submit` returned: `true` when at least one operation was sent, `false` when nothing was sent (a Liquid cart form in which nothing differs from its baseline, 6.3) (D-126; change 15 of section 1). User errors do NOT reject; they appear in `cart.getState().errors`. A setup error (message matches `/Standard Actions|could not be configured/`) sets `usable = false` and posts the form natively. Any other thrown error rejects. |
| `setLineQuantity(lineId, quantity)` | Sends intent `set` with `lineId` and `Math.max(0, Math.round(quantity))` through a synthetic submit. `0` removes the line. Rejects when `usable` is false. |
| `refresh(regions, { url, reason })` | Section 8. `reason` is one of the six values of `RefreshReason` (section 8.2); the member is typed `string` to match D-042, and an unknown value is treated as `manual`. Resolves after the regions were replaced or after the fallback navigation was started. Never rejects. |
| `openCart()` | If `document.getElementById(options.cartDrawer)` is an `HTMLDialogElement`: `showModal()` when not open. Otherwise `location.assign(options.cartUrl)` unless the current path already equals the cart path. On the cart page the layout prints no CartDrawer (D-091 item 5), so `openCart()` does nothing there. |
| `ready` | Resolves (never rejects) when the first cart read succeeded or failed. After it resolves, `usable` is final unless a later setup error clears it. |
| `usable` | `false` means: every form and link keeps its native behaviour. Elements MUST check it at event time, not at connect time. |

### 4.2 `CommerceOptions`

```ts
export interface CommerceStrings {
  added: string;
  updated: string;
  removed: string;
  discountApplied: string;
  discountRemoved: string;
  noteSaved: string;
  error: string;
}

export interface CommerceOptions {
  // `ShopifyRouteTemplates`: `import type { CartStore, ShopifyRouteTemplates } from "@shopify/hydrogen";` in adapter.ts
  host?: RippleHost;
  cartEndpoint?: string;
  cartUrl?: string;
  cartAddUrl?: string;
  cartDrawer?: string;
  initialCart?: { cart: unknown | null; errors?: Array<{ message: string }> };
  analytics?: boolean;
  consent?: "no-banner" | "default-banner";
  strings?: Partial<CommerceStrings>;
  /** hydrogen backend. The app's route templates; the same object passed to `handleShopifyRoutes` (D-130). JSON. */
  routes?: ShopifyRouteTemplates;
  navigate?: (url: string, options: { replace: boolean }) => void | Promise<void>;
  reloadFrames?: (names: string[], url: string | null) => void | Promise<void>;
}
```

| Option | Default | Used by | Meaning |
|---|---|---|---|
| `host` | `"html"` | all | Selects the refresh strategy. `backend` is derived: `"liquid"` when `host === "liquid"`, otherwise `"hydrogen"`. |
| `cartEndpoint` | `"/api/cart"` | hydrogen backend | Passed to `configureCartEndpoint`. Also the `action` of every cart form. The value MUST include the page's locale path prefix (D-118): the server computes `` `${requestContext.locale.pathPrefix}/api/cart` `` (for example `/fr-ca/api/cart`; `pathPrefix` is `""` for the default locale) and prints it in the config element AND passes the same string as the `action` prop of every cart component and of ProductForm (10.1 rule 7). Without the prefix Hydrogen's handler resolves the default locale and resets the cart's buyer country (`reconcileBuyerCountry`, `hydrogen/packages/hydrogen/src/core/cart/server-handlers.ts`). |
| `cartUrl` | `"/cart"` | all | Cart page URL. `action` of the Liquid cart form. Target of `openCart()` when no drawer exists. |
| `cartAddUrl` | `"/cart/add"` | liquid backend | `action` of the Liquid product form. |
| `cartDrawer` | `"cart-drawer"` | all | `id` of the CartDrawer `<dialog>`. The CartDrawer `<dialog>` id MUST equal this value (D-087 item 5, D-020); every blueprint uses `cart-drawer`. |
| `initialCart` | `undefined` | hydrogen backend | The `data` value returned by `cartHandlers.get(...)` on the server (section 10.1). When set, the store is seeded and no `GET <cartEndpoint>` is made on load. JSON only. |
| `analytics` | `true` | all | `false` skips `trackCartAnalytics` and the definition of `rp-view-event`. Liquid: also gates the page-view dispatch (section 12). On the hydrogen backend `initializeShopifyScripts` is called REGARDLESS of this option (D-130): it also sets up `Shopify.routes` and the WebMCP tools, and it is the call that publishes Hydrogen's page views, which this option therefore does not switch off on the hydrogen backend. |
| `consent` | `"default-banner"` | hydrogen backend | Passed as `initializeShopifyScripts({ consent: { mode } })`. `custom-banner` is not supported in V1 (D-051). |
| `strings` | English, 4.3 | all | Announcement and generic error texts. |
| `routes` | `undefined` | hydrogen backend | The app's route templates (`ShopifyRouteTemplates`, a type export of `@shopify/hydrogen`; a plain JSON object): the SAME object the server passes as `routeTemplates` to `handleShopifyRoutes` (10.1). Passed as `initializeShopifyScripts({ routes })` (D-130). Omit when the app uses the standard routes. |
| `navigate` | `undefined` | `react`, `remix` | The router's navigation function, called for reasons `variant` and `filter` with `replace: true` for `variant`. `react`: without it the strategy calls `location.assign(url)`. `remix`: opt-in (SPIKE-11); without it the `html` strategy runs. |
| `reloadFrames` | `undefined` | `remix` | Remix only, opt-in (SPIKE-11). Called with `(regions, null)` for refreshes without a URL (reasons `cart`, `manual`). Without it the `html` strategy runs. The second argument is always `null` in V1. |

No option is required on any host: every default is usable. The options object of a page MUST come from one place: the config element or `configureCommerce` (4.4).

### 4.3 Strings

`strings` carries the texts JavaScript announces. It has exactly these seven keys (D-087 item 4). The source of every text is the repository file `locales/en.default.json`; `DEFAULT_STRINGS` in `adapter.ts` MUST equal the English values of the seven locale keys (a unit test compares them). Liquid prints the seven keys into the config element with the `t` filter (10.4). TSX hosts pass `strings` to `configureCommerce` or rely on the English defaults.

| Key in `strings` | English default | Locale key (Liquid `locales/*.json`, D-066 rule `ripple.<component id>.<key>`) | Announced when |
|---|---|---|---|
| `added` | `Added to cart` | `ripple.product-form.added` | add succeeded |
| `updated` | `Cart updated` | `ripple.cart-lines.updated` | quantity set to a value greater than 0; cart form update |
| `removed` | `Item removed` | `ripple.cart-lines.removed` | quantity set to 0; remove |
| `discountApplied` | `Discount applied` | `ripple.discount-code.applied` | intent `discount-apply` succeeded |
| `discountRemoved` | `Discount removed` | `ripple.discount-code.removed` | intent `discount-remove` succeeded |
| `noteSaved` | `Note saved` | `ripple.cart-note.saved` | intent `note-update` succeeded |
| `error` | `Something went wrong. Try again.` | `ripple.cart-lines.error` | a cart action threw and the store holds no message |

Messages returned by Shopify (`userErrors`, `warnings`) are shown as received; they are already localized by the API.

### 4.4 Delivering options

Options come from two sources, merged in this order (later wins): defaults, the config element, `configureCommerce(options)` calls made before the start.

**Config element.** A host that cannot run code before `ripple.js` (Liquid, plain HTML) MUST print exactly one element with the reserved id `rp-commerce` (ledger section 4.4), before the `ripple.js` module script:

```html
<script type="application/json" id="rp-commerce">{"host":"html","cartEndpoint":"/api/cart"}</script>
```

Placement (D-087 item 3):

| Host | Printed by | Where |
|---|---|---|
| `liquid` | `snippets/rp-head.liquid` ([14-liquid-theme.md](14-liquid-theme.md) section 7) | after `{% render 'rp-tokens' %}` and before the inline Invoker Commands polyfill (D-054 item 7). The layout file does not print it. |
| `html`, `react`, `remix` | the `layout` blueprint (`renderDocument`, [12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md) section 2.6) | in `<head>`, after the Hydrogen script tags (10.1) and before the module scripts. The function options `navigate` and `reloadFrames` are added by a `configureCommerce` call in the client entry (10.2, 10.3). |

A page that contains a commerce element and has neither a config element nor a `configureCommerce` call is reported by checker rule RP309.

The body is JSON of the JSON-serialisable keys of `CommerceOptions` (`navigate` and `reloadFrames` cannot be delivered this way). A TSX server MUST serialise it with:

```ts
const body = JSON.stringify(options).replace(/</g, "\\u003c");
```

Liquid MUST print each value with the `json` filter (section 10.4).

**`configureCommerce(options)`.** Hosts with a client entry module call it there: `react` imports it from `<pkg>/commerce`; `remix` and `html` import it from the prebuilt `ripple.js` (for example `import { configureCommerce } from "/ripple/ripple.js"`), which re-exports `getCommerce` and `configureCommerce` because `<pkg>/commerce` does not resolve on a page without a bundler (D-042, D-054). Liquid theme code imports from the specifier `ripple`.

- Called before the start: merged (`strings` merged key by key).
- Called after the start: only `navigate`, `reloadFrames` and `strings` take effect. Every other key logs `[ripple] configureCommerce: "<key>" was set after commerce started and is ignored.` with `console.warn`.

### 4.5 Start sequence

`import "<pkg>/commerce"` (or loading `ripple.js`) does this, in order:

1. `registerStarter(create, defineElements)`, then `queueMicrotask(() => void getCommerce())`. The start is therefore lazy by one microtask: a `configureCommerce` call in the same synchronous module evaluation runs before the start. On a server (`typeof document === "undefined"`) neither call is made (D-054 item 5).
2. First `getCommerce()` call (the microtask, or an earlier call by user code): `resolveOptions()` reads the config element and merges.
3. Feature tests: `typeof AbortSignal.any === "function"` and `typeof crypto.randomUUID === "function"` (D-032). On failure: the inert object; no element is defined.
4. `create()` builds the backend adapter (sections 5.1, 5.2). If it throws: `console.error("[ripple] commerce failed to start; forms post natively.", error)`, the inert object, no element is defined.
5. The new object is stored as the page's object BEFORE elements are defined, because every controller calls `getCommerce()` while it upgrades.
6. `defineElements()` calls `defineCart()`, `defineProductForm()`, `defineLive()`, `definePredictiveSearch()`, `defineRecommendations()` (section 7.7), which define `rp-cart`, `rp-product-form`, `rp-live`, `rp-predictive-search`, `rp-recommendations` (each guarded by `customElements.get`). `rp-view-event` is not defined here: on the hydrogen backend it is defined in `afterReady`, on Liquid by `startStandardEvents()` (section 12).
7. `ready = probe().then(afterReady, disable)`. `probe` is the first cart read. On rejection: `usable = false` and `console.error("[ripple] commerce disabled; forms post natively.", error)`. Elements stay defined and fall through to native behaviour at event time.

Outcomes:

| Failure | `usable` | Commerce elements defined | `[data-rp-js="fallback"]` controls |
|---|---|---|---|
| Server render, or module not loaded | `false` (inert object, not cached) | no | visible |
| Feature test fails, or `create()` throws | `false` | no | visible |
| `probe()` rejects (on Liquid: `updateCart` already configured by another script, D-122; Standard Actions missing, `configure` returned false, first cart read failed) | `false` after `ready` | yes | hidden; controllers call `form.requestSubmit(<fallback submit button>)` instead. A form that carries `data-rp-js="inflow"` (Liquid discount forms) is NOT posted: `rp-cart` prevents the submit and shows `strings.error` (7.1, D-129) |
| None | `true` | yes | hidden |

The inert object has every member of `RippleCommerce`: `cart.getState()` returns an empty cart with `loading: true`, `cart.subscribe` returns a no-op, `submitCart` (value `false`), `setLineQuantity`, `refresh` resolve without effect, `ready` is resolved, `usable` is `false`.

### 4.6 Other exports of `adapter.ts`

Used by the adapters and controllers; not part of the public package API (only `getCommerce` and `configureCommerce` are re-exported by `index.ts`).

| Export | Signature | Purpose |
|---|---|---|
| `DEFAULT_STRINGS` | `CommerceStrings` | 4.3 |
| `resolveOptions` | `() => ResolvedOptions` | 4.4 |
| `getStrings` | `() => CommerceStrings` | Current strings (late changes included) |
| `getOptions` | `() => ResolvedOptions \| null` | The resolved options object (`null` before the start). Returns the module variable that `resolveOptions` assigned; it MUST NOT call `resolveOptions` again. Not in the spike: added by change 8 of section 1. |
| `registerStarter` | `(create: () => RippleCommerce, define: () => void) => void` | 4.5 |
| `createInertCommerce` | `(options: ResolvedOptions \| null) => RippleCommerce` | 4.5 |
| `createCommerce` | `(options: ResolvedOptions, parts: BackendParts) => RippleCommerce` | Shared implementation |
| `beginAction` | `() => number` | Marks the start of a buyer action; returns `Date.now()` |
| `errorMessage` | `(state: CartState, scope: { line: string } \| "discount" \| "cart" \| "add") => string \| null` | Section 9.2. Scope `"add"` is not in the spike: change 12 of section 1 (D-119). |
| `hasUserError` | `(state: CartState, since: number) => boolean` | `true` when a `userErrors` entry or a network error was recorded at or after `since`; `false` when only warnings were recorded (9.2, D-119). Not in the spike: change 12. |
| `isBusy` | `(state: CartState) => boolean` | Section 7.1 |
| `registerFlush` | `(hooks: { pending(): boolean; flush(): Promise<void> }) => () => void` | Each `connectCart` registers its hooks at connect and calls the returned function in its cleanup (7.1, D-117). Not in the spike: change 11 of section 1. |
| `hasUnsettled` | `() => boolean` | `true` when any registered `pending()` returns `true` or `isBusy(cart.getState())` (D-117) |
| `settle` | `() => Promise<void>` | Calls every registered `flush()` and awaits them all (a rejected flush is ignored), then resolves when `isBusy(cart.getState())` is `false` (it subscribes to the store when it is busy). It ALWAYS resolves within 5000 ms: a timer resolves it so that checkout is never blocked (D-117). Code below. |
| `submitOp` | `(cart: CartStore, op: CartOp) => Promise<void>` | Synthetic submit, 6.4 |
| `isSetupError` | `(error: unknown) => boolean` | 4.1 |
| `nativeSubmit` | `(form: HTMLFormElement, submitter: HTMLElement \| null) => void` | `requestSubmit`; call only when `usable` is false |
| `cartRegions` | `() => string[]` | Section 8.4 |
| types | `RippleBackend`, `RippleHost`, `CommerceStrings`, `CommerceOptions`, `ResolvedOptions`, `RippleCommerce`, `RefreshReason`, `RefreshStrategy`, `BackendParts`, `ActionKind`, `ErrorScope` | |

Internal exports of other files, also not public package API:

| File | Export | Signature | Used by |
|---|---|---|---|
| `refresh-react.ts` | `getRegionHtml` | `(name: string) => string \| null` | `src/react/hooks.ts` (`useRegionHtml`) |
| `refresh-react.ts` | `subscribeRegionHtml` | `(name: string, listener: () => void) => () => void` | `src/react/hooks.ts` (`useRegionHtml`) |

`settle`, `registerFlush` and `hasUnsettled` (D-117), complete; added to `adapter.ts`:

```ts
interface FlushHooks {
  pending(): boolean;
  flush(): Promise<void>;
}
const flushHooks = new Set<FlushHooks>();
const SETTLE_TIMEOUT_MS = 5000;

export function registerFlush(hooks: FlushHooks): () => void {
  flushHooks.add(hooks);
  return () => void flushHooks.delete(hooks);
}

export function hasUnsettled(): boolean {
  for (const hooks of flushHooks) if (hooks.pending()) return true;
  return isBusy(getCommerce().cart.getState());
}

export function settle(): Promise<void> {
  const cart = getCommerce().cart;
  const work = Promise.all(Array.from(flushHooks, (hooks) => hooks.flush().catch(() => undefined))).then(
    () =>
      new Promise<void>((resolve) => {
        if (!isBusy(cart.getState())) return resolve();
        const stop = cart.subscribe(() => {
          if (isBusy(cart.getState())) return;
          stop();
          resolve();
        });
      }),
  );
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, SETTLE_TIMEOUT_MS));
  return Promise.race([work, timeout]);
}
```

`ResolvedOptions` is `CommerceOptions` with every default applied plus the derived `backend`: `host`, `backend`, `cartEndpoint`, `cartUrl`, `cartAddUrl`, `cartDrawer`, `analytics`, `consent` and `strings` are never `undefined`; `initialCart`, `routes`, `navigate` and `reloadFrames` keep their optional types.

```ts
export interface BackendParts {
  cart: CartStore;
  dialect: FormDialect;
  strategy: RefreshStrategy;
  /** Resolves `true` when at least one operation was sent, `false` when none was (D-126). */
  submit(form: HTMLFormElement, submitter: HTMLElement | null, event: SubmitEvent): Promise<boolean>;
  probe(): Promise<void>;
  afterReady(commerce: RippleCommerce): void;
}

export type RefreshReason = "cart" | "variant" | "filter" | "predictive" | "recommendations" | "manual";

export type RefreshStrategy = (
  regions: string[],
  context: { url: string | null; reason: RefreshReason; signal: AbortSignal; options: ResolvedOptions },
) => Promise<void>;
```

## 5. Cart store per backend

### 5.1 hydrogen backend (`adapter-hydrogen.ts`)

Hydrogen APIs called, all from `@shopify/hydrogen`: `configureCartEndpoint`, `createCartStore`, `initializeShopifyScripts`, `trackCartAnalytics`; on the store: `connect`, `fetch`, `handleFormSubmit`, `getState`, `subscribe`, `refresh`.

1. `configureCartEndpoint(options.cartEndpoint)`.
2. `createCartStore({ initialData: options.initialCart })` when `initialCart` is set, otherwise `createCartStore()`. Then `cart.connect()`.
3. `submit`: `cart.handleFormSubmit(event)` with the REAL submit event. The form's own field names are already the Hydrogen protocol. One exception (D-127; change 16 of section 1): `handleFormSubmit` throws `TypeError: Expected event.submitter to be an HTMLElement, got null` for a submit without a submitter (`form.requestSubmit()` with no argument; `requireFormEvent` in `hydrogen/packages/hydrogen/src/core/cart/cart.ts`), and 7.2 intercepts exactly that case for the product form. So a submit with `submitter === null` of a form that has a `[data-rp-field="merchandise-id"]` control is sent as one synthetic `add` (6.4). Complete code of the `submit` part:

   ```ts
   async submit(form, submitter, event) {
     const merchandise = form.querySelector<HTMLInputElement>('[data-rp-field="merchandise-id"]');
     if (submitter === null && merchandise) {
       const fields: Record<string, string> = { merchandiseId: merchandise.value };
       for (const [name, value] of new FormData(form)) {
         if (typeof value !== "string" || value === "") continue;
         if (name === "quantity" || name === "sellingPlanId" || name.startsWith("attributes.")) fields[name] = value;
       }
       fields.quantity ??= "1";
       await submitOp(cart, { intent: "add", fields });
       return true;
     }
     await cart.handleFormSubmit(event);
     return true;
   },
   ```

   `submitOp` is imported from `./adapter`. A submit with `submitter === null` of any OTHER form still reaches `handleFormSubmit` and rejects; `rp-cart` never produces one (it always passes the submit part to `requestSubmit`).
4. `probe`: unseeded: `cart.fetch()` (returns the in-flight initial load; one `GET /api/cart`, scenario H1). Seeded: wait for `DOMContentLoaded`, then throw unless `window.Shopify?.actions?.updateCart` exists (scenario H6).
5. `afterReady`: `window.Shopify.actions.openCart.configure({ handler: async () => commerce.openCart() })`; then the checkout guard below; then `initializeShopifyScripts` (always, D-130; code in 12.1 item 1); then analytics (section 12).
   **Checkout guard** (D-117; hydrogen backend only, because the hydrogen checkout control is a plain link and a navigation cancels a quantity or note change that has not been sent or has not finished). `afterReady` adds ONE listener, `document.addEventListener("click", onCheckoutClick)`:

   ```ts
   function onCheckoutClick(event: MouseEvent): void {
     if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
     const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a.rp-checkout-button[href]") : null;
     if (!link || !getCommerce().usable || !hasUnsettled()) return; // nothing pending: the click stays native
     event.preventDefault();
     const href = link.href; // read before a region refresh replaces the link
     void settle().then(() => location.assign(href));
   }
   ```

   A modified click (new tab) and a click with nothing unsettled stay native. On Liquid there is no guard: the checkout button submits the cart form natively with every quantity and the note.
6. Strategy: `html` host `refreshHtml`; `react` host `refreshReact`; `remix` host `refreshRemix`, which falls back to `refreshHtml` per reason (8.3).

The hydrogen backend REQUIRES the Standard Actions script on the page even though it has its own endpoint: the store sends every mutation through `window.Shopify.actions.updateCart`, which it configures once to call the endpoint. The server MUST print the Hydrogen script tags (section 10.1) before `ripple.js` (D-041 item 1, D-088 item 2). Evidence: `hydrogen/packages/hydrogen/src/core/cart/`, scenario H6.

### 5.2 liquid backend (`adapter-liquid.ts`)

Hydrogen APIs called: `createCartStore`; on the store: `connect`, `fetch`, `handleFormSubmit` (synthetic events only), `getState`, `subscribe`, `refresh`. Platform specifier imported dynamically: `@shopify/standard-events` (`createViewEventElement`, `PageViewEvent`; types in `hydrogen/packages/hydrogen/vendor/standard-events.d.ts`). It is platform-provided and is NOT an npm dependency (D-046).

1. `configureCartEndpoint` MUST NOT be called. `createCartStore()` is called synchronously in `createLiquidCommerce`. `cart.connect()` is NOT called there (D-122; change 13 of section 1): it is called by `probe` (item 4), because `connect()` is the call that makes Hydrogen look for `Shopify.actions` and configure `updateCart`, and at module evaluation `Shopify.actions` does not exist yet (Shopify docs: "Actions are ready after DOMContentLoaded fires").
2. Timing of the one `configure` call (D-122). "Only the first configure call on an action takes effect" (Shopify docs), so Ripple must configure before any app. `rp-head` prints, before `{{ content_for_header }}`, an inline classic script whose first line sets `window.rpDomReady`, a promise resolved by the FIRST `DOMContentLoaded` listener of the page (`04-elements.md` 3.3 item 8, `14-liquid-theme.md` 7.3). `probe` awaits it; its continuation runs in the microtask checkpoint directly after that first listener, before every listener registered later (those of `content_for_header` and of apps), with `Shopify.actions.updateCart` present. UNVERIFIED on a store (SPIKE-01 step 1a).
3. `submit` (D-126; change 15 of section 1). The adapter holds one `baseline` map for the page: the last value of each note and cart-attribute control that the store accepted. It is needed because those controls sit OUTSIDE every refreshed region on Liquid, so their `defaultValue` stays the first server value for the lifetime of the page. Complete code:

   ```ts
   const baseline = new WeakMap<Element, string>();

   async submit(form, submitter) {
     const ops = translateLiquidForm(form, submitter, baseline);
     for (const op of ops) {
       const before = cart.getState().errors.lastUpdatedAt;
       await submitOp(cart, op);
       // No error or warning recorded by this operation: the sent values are the new baseline.
       if (cart.getState().errors.lastUpdatedAt === before) {
         for (const [control, value] of op.sent ?? []) baseline.set(control, value);
       }
     }
     return ops.length > 0;
   },
   ```

   `baseline` is declared inside `createLiquidCommerce`, before the `createCommerce` call.
4. `probe` (complete):

   ```ts
   async probe() {
     await (window.rpDomReady ?? Promise.resolve());
     // Another script configured updateCart before Ripple: Hydrogen cannot own it (D-041 item 5).
     if (window.Shopify?.actions?.updateCart?.isDefault() === false) {
       throw new Error("Shopify.actions.updateCart is already configured by another script.");
     }
     cart.connect(); // Hydrogen configures updateCart synchronously here when Shopify.actions exists.
     await cart.fetch();
   },
   ```

   It rejects when another script configured `updateCart` first, when Standard Actions is missing, or when `updateCart.configure` returns `false` (scenario L6). The `isDefault()` check was not exercised by a scenario. `window.rpDomReady` is declared in `globals.d.ts` as `rpDomReady?: Promise<void>`. No element or user code can mutate the cart before this point: `submitCart` awaits `ready`.
5. `afterReady`: configure `openCart` as in 5.1, and nothing else. `trackCartAnalytics` and `initializeShopifyScripts` MUST NOT be called on Liquid (the platform reports cart events and handles consent). `rp-view-event` and the page view are started by `startStandardEvents()`, which `index.ts` calls before the adapter is created and only when `options.analytics` is true (section 12.3).
6. Strategy: `refreshLiquid`.

The store data on Liquid is the Standard Actions cart summary. Only `totalQuantity`, line ids and quantities are relied on. Line markup and money MUST come from region refresh (D-041 item 6).

## 6. Form dialects

### 6.1 `FormDialect`

```ts
export interface FormDialect {
  backend: "hydrogen" | "liquid";
  addAction: string;
  cartAction: string;
  fields: {
    merchandiseId: string;
    quantity: string;
    sellingPlanId: string;
    lineId: string | null;
    lineQuantity: string;
    note: string;
    discountCode: string | null;
  };
  intentName: string | null;
  lineAttribute(key: string): string;
  cartAttribute(key: string): string;
}
```

| Member | `hydrogenDialect(cartEndpoint)` | `liquidDialect(cartUrl, cartAddUrl)` |
|---|---|---|
| `addAction` | `cartEndpoint` | `cartAddUrl` |
| `cartAction` | `cartEndpoint` | `cartUrl` |
| `fields.merchandiseId` | `merchandiseId` | `id` |
| `fields.quantity` | `quantity` | `quantity` |
| `fields.sellingPlanId` | `sellingPlanId` | `selling_plan` |
| `fields.lineId` | `lineId` | `null` |
| `fields.lineQuantity` | `quantity` | `updates[]` |
| `fields.note` | `note` | `note` |
| `fields.discountCode` | `discountCode` | `null` |
| `intentName` | `intent` | `null` |
| `lineAttribute("Engraving")` | `attributes.Engraving` | `properties[Engraving]` |
| `cartAttribute("Gift")` | `attributes.Gift` | `attributes[Gift]` |

The `html`, `react` and `remix` bindings hard-code the hydrogen column; Liquid files hard-code the liquid column. A binding file MUST NOT import `<pkg>/commerce` (D-096 item 3), so it never reads `getCommerce().dialect`; that member exists for the elements and for user code. The manifest records both columns (`hydrogenHost.formDialect`, `liquid.formDialect`; see [07-manifest-registry-cli.md](07-manifest-registry-cli.md)).

### 6.2 Required form markup

The markup below shows hooks and form semantics only; it is NOT a fixture. Classes, wrappers, labels, icons, part order, locale keys and the complete fixtures belong to [11-components-commerce.md](11-components-commerce.md), which is normative for the contract (D-069). Attributes shown here are REQUIRED. `data-rmx-document` is printed by the Remix binding only, on every cart form and on the checkout link (D-034 item 3), and is removed by the canonicaliser. Form internals are host-owned regions; the cart components have backend-scoped fixtures (D-043, D-074 item 7).

Hook rules that hold for every form:

- A field the element must find carries `data-rp-field` with one of `merchandise-id`, `quantity`, `line-id`, `selling-plan`, `note`, `discount-code`. Bindings print it with the prop `rpField` (Liquid `rp_field`) of Input, Textarea and Select; QuantityInput always prints `data-rp-field="quantity"` (ledger section 4.4). It MUST NOT be passed through rest props or `attributes`.
- Each cart line root carries `data-rp-line="<id>"`: the Storefront API cart line id on the hydrogen backend, `item.key` on Liquid (D-044).
- The error element is exactly `<p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>` (D-045 item 4), written below as `<ERROR/>`.
- A submit button needed only without JavaScript carries `data-rp-part="submit" data-rp-js="fallback"` (hidden once `rp-cart` is defined, D-021).
- The root of `rp-product-form` carries no `data-rp-refresh` (ledger section 4.4).

**Add to cart, hydrogen backend** (inside `rp-product-form`):

```html
<form method="post" action="/api/cart">
  <input type="hidden" name="merchandiseId" value="gid://shopify/ProductVariant/1" data-rp-field="merchandise-id">
  <input type="hidden" name="sellingPlanId" value="" data-rp-field="selling-plan" disabled>
  <input type="number" name="quantity" value="1" min="1" data-rp-field="quantity">
  <input type="text" name="attributes.Engraving">
  <button type="submit" name="intent" value="add" data-rp-part="submit">Add to cart</button>
  <ERROR/>
</form>
```

**Add to cart, liquid backend** (inside `rp-product-form`; `{% form 'product' %}` prints the `<form>` tag with `action="{{ routes.cart_add_url }}"`):

```liquid
{% form 'product', product %}
  <input type="hidden" name="id" value="{{ variant.id }}" data-rp-field="merchandise-id">
  <input type="hidden" name="selling_plan" value="" data-rp-field="selling-plan" disabled>
  <input type="number" name="quantity" value="1" min="1" data-rp-field="quantity">
  <input type="text" name="properties[Engraving]">
  <button type="submit" name="add" data-rp-part="submit">{{ 'ripple.add-to-cart-button.label' | t }}</button>
  <ERROR/>
{% endform %}
```

Rules for both: the selling-plan input is `disabled` when no plan is selected (a disabled control is not sent and is ignored by the translation). The quantity input MAY be absent (quantity 1). Accelerated checkout markup (`acceleratedCheckout`, D-050) is inside the same form; its buttons MUST NOT carry `data-rp-part="submit"`, so the element leaves them native (scenario D2).

**Cart lines, hydrogen backend** (one form per line, inside `rp-cart`, inside region `rp-cart-lines`):

```html
<li data-rp-line="gid://shopify/CartLine/9?cart=c1">
  <form method="post" action="/api/cart">
    <input type="hidden" name="lineId" value="gid://shopify/CartLine/9?cart=c1" data-rp-field="line-id">
    <button type="submit" name="intent" value="set" hidden></button>
    <input type="number" name="quantity" value="2" min="0" required data-rp-field="quantity">
    <button type="submit" name="intent" value="set" data-rp-part="submit" data-rp-js="fallback">Update</button>
    <button type="submit" name="intent" value="remove" formnovalidate>Remove</button>
    <ERROR/>
  </form>
</li>
```

The first submit button MUST be the hidden `set` button (D-044): it is the form's default button, so Enter in the quantity input sends `set`. On the hydrogen backend the quantity input of a cart line MUST carry `required` (CartLine passes `required` to the embedded QuantityInput) and the `remove` button MUST carry `formnovalidate` (D-116): Hydrogen's handler reads an empty `quantity` as `0` and removes the line (`hydrogen/packages/hydrogen/src/core/cart/cart.ts`, `getLineQuantityPayload`: `Number("")` is `0`), so native validation must stop an empty `set`, and an invalid quantity must not block the removal (Hydrogen's own `register("remove")` returns `formNoValidate: true`). Neither attribute is printed on Liquid. The quantity input is the input of an embedded QuantityInput (`rp-quantity`, [10-components-interactive.md](10-components-interactive.md)); its `type="button"` steppers are not part of this contract. Visible stepper submit buttons with `value="increase"` / `value="decrease"` MAY be added on the hydrogen backend only (D-044).

**Cart lines, liquid backend** (ONE form for all lines, printed by CartLines, inside `rp-cart`; the region is inside the form):

```liquid
<form method="post" action="{{ routes.cart_url }}" id="{{ id }}-form">
  <ul data-rp-region="rp-cart-lines">
    {% for item in cart.items %}
      <li data-rp-line="{{ item.key }}">
        <input type="number" name="updates[]" value="{{ item.quantity }}" min="0" data-rp-field="quantity">
        <a href="{{ item.url_to_remove }}" data-rp-part="remove">{{ 'ripple.cart-line.remove' | t }}</a>
        <ERROR/>
      </li>
    {% endfor %}
  </ul>
  <button type="submit" name="update" data-rp-part="submit" data-rp-js="fallback">{{ 'ripple.cart-lines.update' | t }}</button>
  <ERROR/>
</form>
```

Rules (D-092): this is the ONE cart form on Liquid; its id is `<cart lines id>-form`. `updates[]` inputs MUST be in `cart.items` order and there MUST be exactly one per line. The `update` button MUST be the first submit button of the form (it is the default button; a `checkout` button first would send the buyer to checkout on Enter). On Liquid, the note textarea, cart attribute inputs and the checkout button that live in other components join this form with the native attribute `form="<cart lines id>-form"`; they receive the CartLines id through the param `cart_lines` (TSX prop `cartLines`) and print the attribute through the prop `formId` / `form_id` of the embedded control (D-020). `increase` and `decrease` MUST NOT be used on Liquid (D-044).

**Note.** hydrogen backend, own form inside `rp-cart`:

```html
<form method="post" action="/api/cart">
  <textarea name="note" data-rp-field="note"></textarea>
  <button type="submit" name="intent" value="note-update" data-rp-part="submit" data-rp-js="fallback">Save</button>
  <ERROR/>
</form>
```

liquid backend, inside `rp-cart`, associated with the cart form:

```liquid
<textarea name="note" form="{{ cart_lines }}-form" data-rp-field="note">{{ cart.note }}</textarea>
<ERROR/>
```

**Cart attributes.** hydrogen backend: inputs named `attributes.<key>` in a form whose submit button is `name="intent" value="attributes-update"`. liquid backend: inputs named `attributes[<key>]` with `form="{{ cart_lines }}-form"`. With JavaScript on Liquid, when any attribute control differs from its baseline value (6.3), ALL attribute controls of the form are sent in one `attributes-update`.

`attributes-update` REPLACES the cart's attribute set on both backends with JavaScript (D-128). Evidence: Shopify docs, `UpdateCartPayload.attributes`: "The complete set of cart attributes the cart should end up with, replacing the existing set"; Hydrogen sends only the form's fields (`updateCart({ attributes: payload.attributes })`). Without JavaScript the Liquid post of `attributes[<key>]` sets only the named keys. Therefore a form that edits cart attributes MUST print every attribute that must survive, as a visible control or as `<input type="hidden">` (hydrogen: `name="attributes.<key>"` for each entry of `cart.attributes`; Liquid: `name="attributes[<key>]"` for each pair of `cart.attributes`, with `form="{{ cart_lines }}-form"`). An attribute that is not a control of the form is DELETED by the JavaScript path. No shipped component prints cart attribute controls; this rule is for project code. It is not statically checkable (section 13) and is documented only.

**Discount code.** hydrogen backend, inside `rp-cart`:

```html
<form method="post" action="/api/cart">
  <input type="text" name="discountCode" data-rp-field="discount-code" autocomplete="off">
  <button type="submit" name="intent" value="discount-apply" data-rp-part="submit">Apply</button>
  <ERROR/>
</form>
<form method="post" action="/api/cart">
  <input type="hidden" name="discountCode" value="SAVE10" data-rp-field="discount-code">
  <button type="submit" name="intent" value="discount-remove">Remove SAVE10</button>
</form>
```

liquid backend: the SAME markup with `action="{{ routes.cart_url }}"`, and each `<form>` additionally carries `data-rp-js="inflow"` (there is no no-JS discount form on Liquid, D-043). The submitter `name="intent"` tells `translateLiquidForm` to read the fields by `data-rp-field`. The field name `discountCode` is not sent to Shopify on Liquid.

**Checkout** (D-050; the contract is CheckoutButton in doc 11). hydrogen backend: `<a href="<cart.checkoutUrl>" data-agent-confirm="<sentence>">` (Remix adds `data-rmx-document`). liquid backend: `<button type="submit" name="checkout" form="<cart lines id>-form" data-agent-confirm="<sentence>">`; when `cart_lines` is blank (the page has no CartLines), the button is wrapped in its own `<form method="post" action="{{ routes.cart_url }}">` and prints no `form` attribute. `data-agent-confirm` is REQUIRED (D-095). With an empty cart the control is inert: `disabled` on the button; `aria-disabled="true"` and no `href` on the link. The control is printed inside region `rp-cart-summary`; accelerated checkout markup is printed outside the region. `rp-cart` never intercepts a submitter whose `name` is `checkout` (scenario D3). On the hydrogen backend a plain click on the checkout LINK is delayed by the adapter's checkout guard while a cart change is unsent or in flight (5.1 step 5, D-117); otherwise the navigation is native.

### 6.3 `translateLiquidForm(form, submitter, baseline): CartOp[]`

Signature (D-126): `translateLiquidForm(form: HTMLFormElement, submitter: HTMLElement | null, baseline: WeakMap<Element, string> = new WeakMap()): CartOp[]`. `CartOp` gains one optional member: `export interface CartOp { intent: CartIntent; fields: Record<string, string>; sent?: Array<[Element, string]> }`. `sent` lists the note or attribute controls an operation carries with the value sent; `submitOp` ignores it; the Liquid adapter writes it to `baseline` after the operation settles without an error (5.2 item 3). Below, **the baseline value of a control** is `baseline.get(control) ?? control.defaultValue`.

Input: the submitted form and its submitter. Only successful controls count (not `disabled`; checkboxes and radios only when checked). Output: zero or more operations in the Hydrogen protocol, sent in order.

| Step | Condition | Result |
|---|---|---|
| 1 | Submitter has `name="intent"` and a valid intent value | One op with that intent. Fields: for each control with a `data-rp-field` hook, `FIELD_TO_PROTOCOL[hook] = control.value`. |
| 2 | Else: the form has a control with `data-rp-field="merchandise-id"` | One `add` op: `merchandiseId`; `quantity` from the `quantity` hook or `"1"`; `sellingPlanId` when the `selling-plan` hook has a non-empty value; `attributes.<k>` for each non-empty control named `properties[<k>]`. |
| 3 | Else (cart form) | For each `[data-rp-line]` in the form whose `input[data-rp-field="quantity"]` has `value !== defaultValue` and a numeric value: a `set` op `{ lineId: <data-rp-line>, quantity: <rounded, min 0> }`. Then `note-update` when the value of the `note` hook differs from its baseline value; the op carries `sent: [[note, note.value]]`. Then `attributes-update` as described in 6.2 (comparison against the baseline value; the op carries `sent` with one `[control, control.value]` pair per attribute control). An unchanged form yields `[]`, nothing is sent, `submitCart` resolves `false` and `rp-cart` announces nothing (7.1). The quantity comparison stays `value !== defaultValue`: quantity inputs are inside region `rp-cart-lines` and are re-rendered after every mutation. |

```ts
export const FIELD_TO_PROTOCOL: Record<string, string> = {
  "merchandise-id": "merchandiseId",
  quantity: "quantity",
  "line-id": "lineId",
  "selling-plan": "sellingPlanId",
  note: "note",
  "discount-code": "discountCode",
};
```

Verified payloads received by `Shopify.actions.updateCart` (scenarios L2, L3, D4): add `{"lines":[{"merchandiseId":"123","quantity":2,"sellingPlanId":"77","attributes":[{"key":"Engraving","value":"Hi"}]}]}`; set `{"lines":[{"id":"40123:abc","quantity":5}]}`; remove `{"lines":[{"id":"40123:abc","quantity":0}]}`; discount `{"discountCodes":["SAVE10"]}`; note `{"note":"hello"}`.

The two changed comparisons of step 3 in `dialect.ts` (the rest of the spike function is unchanged):

```ts
const base = (control: Control) => baseline.get(control) ?? (control instanceof HTMLSelectElement ? "" : control.defaultValue);

const note = hooked("note");
if (note && !(note instanceof HTMLSelectElement) && note.value !== base(note)) {
  ops.push({ intent: "note-update", fields: { note: note.value }, sent: [[note, note.value]] });
}
const attributes = all.filter((control) => /^attributes\[(.+)\]$/.test(control.name));
const changed = attributes.some((control) => !(control instanceof HTMLSelectElement) && control.value !== base(control));
if (changed) {
  const fields: Record<string, string> = {};
  const sent: Array<[Element, string]> = [];
  for (const control of attributes) {
    const key = /^attributes\[(.+)\]$/.exec(control.name)![1];
    fields[`attributes.${key}`] = control.value;
    sent.push([control, control.value]);
  }
  ops.push({ intent: "attributes-update", fields, sent });
}
```

Why: without the baseline, after saving the note `gift` and then clearing it back to the first server value, `value === defaultValue`, no operation is sent and the cart keeps `gift`; and after any note save every later cart-form submit re-sends `note-update`.

### 6.4 The synthetic submit

`createCartStore` exposes mutations only through `handleFormSubmit(event)`. Code-driven changes (`setLineQuantity`, every Liquid operation) build a detached form:

```ts
export function submitOp(cart: CartStore, op: CartOp): Promise<void> {
  const form = document.createElement("form");
  for (const [name, value] of Object.entries(op.fields)) {
    const input = document.createElement("input");
    input.name = name;
    input.value = value;
    form.append(input);
  }
  const button = document.createElement("button");
  button.name = "intent";
  button.value = op.intent;
  form.append(button);
  const event = new SubmitEvent("submit", { submitter: button, cancelable: true });
  Object.defineProperty(event, "target", { value: form });
  return cart.handleFormSubmit(event);
}
```

`attachQuantityInput` and `createCartFormRegister` from `@shopify/hydrogen` are NOT called: both hold references to descendants, which D-019 item 3 forbids, and region refresh would orphan them (D-044 as amended). The hidden first `set` button stays in the hydrogen markup because it makes Enter send `set` without JavaScript.

## 7. Elements

Common rules:

- Each tag is root-only: `<rp-x class="..." data-slot="rp-x">` with native descendants (D-019). The class comes from the component (doc 11).
- Every commerce root is `display: block` (D-080). The value is data (`elements.<tag>.display` in the manifest, source `src/gen/elements.json`) and is printed by the generated display region of `base.css` ([03-styling-and-tokens.md](03-styling-and-tokens.md)); the `createParts` call passes `display: "block"`. No CSS may set `display: contents` or `display: none` on an `rp-*` root. Where a component needs its children laid out by an outer grid, the root is the grid item.
- Manifest key `elements`: each of the five tags has `{ "display": "block", "chunk": "main", "commerce": true }`; so does `rp-view-event` (section 12).
- Nearest-root rule: a controller handles a node only when `node.closest("<its tag>") === root`.
- The writes a commerce element or the adapter may make after upgrade are exactly: `data-pending` and `aria-busy` on the root, on `[data-rp-line]` elements and on `[data-rp-region]` roots; text and `hidden` of `[data-rp-part="count"]`; text and `hidden` of `[data-rp-part="error"]`; text of `[data-rp-part="status"]`; `hidden` of `[data-rp-part="results"]`; replacement of `[data-rp-region]` elements; `value` of `input[data-rp-field="quantity"]` reset to `defaultValue` after a refresh. The allow-list itself is manifest data: the `upgradeAllow[]` entries of each component in doc 11 (D-071), which MUST permit no write outside this list. Tier 3 and checker rule RP601 read the manifest.
- No element creates, removes or reorders markup (D-045 item 1). Region replacement is done by the adapter.
- No commerce element observes attributes. All attributes are read at event time.
- Announcements go through `announce(text, { from })` from `src/runtime/announcer.ts` (D-079; [04-elements.md](04-elements.md) section 3.5), never through `@ui-sdk/core` directly. The channel per element is in section 9.1.
- Each element declares its agent bridge actions in the primitive's `agent` key, copied verbatim from [08-agent-kit-and-evals.md](08-agent-kit-and-evals.md) section 7.2 (D-095). An action MUST go through the same DOM event or form submission as the buyer's control. When the root does not contain the markup an action needs, the method throws `new Error("<tag>: nothing to <action> here")`. No element declares a `checkout` action (D-050).

### 7.1 `rp-cart`

Root of CartLink, CartLines, CartSummary, CartNote and DiscountCode, and used inside CartDrawer (whose own root is `rp-dialog`; the `rp-cart` roots are those of the CartLines and CartSummary in the dialog body). Every instance shares the one store.

| | |
|---|---|
| Tag | `rp-cart` |
| Attributes | `data-rp-refresh="<region names>"` (optional): regions to refresh after any cart mutation settles. CartLines: `rp-cart-lines rp-cart-summary`. CartSummary: `rp-cart-summary`. Others: omit. |
| Inner markup read | `[data-rp-part="count"]` (0 or more); `[data-rp-line]` with `input[data-rp-field="quantity"]`; `a[data-rp-part="remove"]`; POST forms of 6.2; `[data-rp-field="note"]`; `[data-rp-part="submit"]`; `[data-rp-part="error"]`; `[data-rp-part="status"]`. CartLines, CartSummary, CartNote and DiscountCode each ALWAYS print exactly one status part, `<p class="rp-visually-hidden" data-rp-part="status" role="status"></p>`, because each can sit inside the modal CartDrawer (D-045, D-079). CartLink prints none. |
| Hydrogen APIs | `cart.getState()`, `cart.subscribe()`; through the adapter: `handleFormSubmit` |
| Adapter calls | `submitCart`, `setLineQuantity`, `ready`, `usable` |
| Agent | `agent.actions`: `["setQuantity", "remove"]`; `agent.items`: `(api) => api.lines()` |

State reflected (repainted on every store change, after `ready`, and on `rp:refreshed`; each write happens only when the value differs):

| Target | Write | Source |
|---|---|---|
| root | `data-pending=""` and `aria-busy="true"` while busy | `isBusy(state)`: `pending.lines.size > 0 \|\| pending.note \|\| pending.attributes \|\| pending.discountCodes.size > 0 \|\| pending.cost === true \|\| revalidating === true` |
| each `[data-rp-part="count"]` | `textContent = String(totalQuantity)`; `hidden = totalQuantity === 0` | `state.data.totalQuantity`, only when `state.loading` is false |
| each `[data-rp-line]` | `data-pending=""` and `aria-busy="true"` | `state.pending.lines.has(<data-rp-line>)` |
| each `[data-rp-part="error"]` | text and `hidden` | `errorMessage(state, scope)`, section 9.2 |

Behaviour:

| Trigger | Condition | Action |
|---|---|---|
| `submit` | form is `method="post"`, owned by this root, `usable`, submitter name is not `checkout` | `preventDefault()`. Empty-quantity guard (D-116): when the submitter is `name="intent" value="set"` and the value of the form's `input[data-rp-field="quantity"]` is empty or not a number (`value.trim() === "" \|\| !Number.isFinite(Number(value))`), stop here: no `submitCart`, no announcement (Hydrogen reads an empty quantity as `0` and would REMOVE the line). Otherwise `const sent = await submitCart(form, submitter, event)`; announce (9.1) only when `sent` is `true` (D-126: a Liquid cart form with nothing to send announces nothing) |
| `submit` | form is `method="post"`, owned by this root, `commerce.usable` is `false`, and the form carries `data-rp-js="inflow"` (the Liquid discount forms, which have no no-JS counterpart) | `preventDefault()`; write `strings.error` to the form's own `[data-rp-part="error"]` when it has one (DiscountCode), else to the root's first cart-scope error part, and remove its `hidden`; do NOT post (D-129). Reason: the form's fields `discountCode` and `intent` are Hydrogen names that the platform's `/cart` route ignores; a native post would reload the page, apply nothing and show nothing. Every other `method="post"` form is left alone when `usable` is `false` (native post, as before). |
| `change`, and `valuechange` (captured; from `rp-quantity`) | target is or contains `input[data-rp-field="quantity"]` inside an owned `[data-rp-line]` | Debounce 250 ms per line. Then read the input: skip when empty, not a number, or equal to the last sent value (initially `defaultValue`). `usable`: `setLineQuantity(id, quantity)`. Not usable: `form.requestSubmit(<[data-rp-part="submit"] of that form>)`. |
| `change` | target matches `[data-rp-field="note"]` | `form.requestSubmit(<[data-rp-part="submit"] of target.form>)`, which re-enters the `submit` row (on Liquid the form is the cart form in the CartLines root, which handles it) |
| `click` | plain primary click on owned `a[data-rp-part="remove"]`, `usable` | `preventDefault()`; `setLineQuantity(<data-rp-line>, 0)` |
| connect (D-117) | always | `registerFlush({ pending, flush })`; the returned function is called in the cleanup. `pending()`: `timers.size > 0 \|\| inflight.size > 0`. `flush()`: for every pending quantity timer, `clearTimeout`, delete it and call `commitQuantity(line)` now; then `await Promise.allSettled([...inflight])`. `inflight` is a `Set<Promise<void>>` to which `run()` adds its own promise and from which it removes it when it settles. The checkout link is NOT handled by `rp-cart`; the adapter's checkout guard (5.1 step 5) calls `settle()`. |


Code of the `submit` listener and of `run` after changes 10, 11, 15 and 17 of section 1 (the empty-quantity guard is the `isEmptySet` line):

```ts
async function runAction(kind: ActionKind, action: () => Promise<boolean | void>): Promise<void> {
  const started = beginAction();
  let sent: boolean | void;
  try {
    sent = await action();
  } catch (error) {
    console.error("[ripple] cart action failed.", error);
    const part = own<HTMLElement>('[data-rp-part="error"]').find((el) => !el.closest("[data-rp-line]"));
    if (part) showError(part, getStrings().error);
    return;
  }
  if (sent === false) return; // nothing was sent (D-126): no announcement
  if (commerce.usable && commerce.cart.getState().errors.lastUpdatedAt < started) say(kind);
}

// Every cart action goes through `run`, which records the promise for the checkout guard (D-117).
function run(kind: ActionKind, action: () => Promise<boolean | void>): Promise<void> {
  const promise = runAction(kind, action);
  inflight.add(promise);
  void promise.finally(() => inflight.delete(promise));
  return promise;
}

const onSubmit = (event: Event): void => {
  const form = event.target;
  if (!(event instanceof SubmitEvent) || !(form instanceof HTMLFormElement) || !owns(form)) return;
  if (form.method !== "post") return;
  const submitter = event.submitter;
  if (submitter?.getAttribute("name") === "checkout") return;
  if (!commerce.usable) {
    if (!form.matches('[data-rp-js="inflow"]')) return; // native post
    event.preventDefault(); // D-129: a JS-only form must not post Hydrogen field names to the platform
    const part =
      form.querySelector<HTMLElement>('[data-rp-part="error"]') ??
      own<HTMLElement>('[data-rp-part="error"]').find((el) => !el.closest("[data-rp-line]"));
    if (part) showError(part, getStrings().error);
    return;
  }
  event.preventDefault();
  if (isEmptySet(form, submitter)) return; // D-116
  void run(kindOf(form, submitter), () => commerce.submitCart(form, submitter, event));
};
```

`isEmptySet(form, submitter)` is `true` when the submitter is `name="intent" value="set"` and the form's `input[data-rp-field="quantity"]` value is empty or not a number. `inflight` is the `Set<Promise<void>>` of the connect row. `setLineQuantity` resolves `void`, which `run` treats as sent.

Events dispatched: none.

Agent methods (signatures and implementation are those of doc 08 section 7.2):

| Method | Signature | Implementation |
|---|---|---|
| `setQuantity` | `(line: string, quantity: number): void` | Find `[data-rp-line="<line>"]` owned by the root; set the `value` of its `input[data-rp-field="quantity"]` to `String(quantity)`; dispatch `new Event("change", { bubbles: true })` on the input. No such line or input: throw `new Error("rp-cart: nothing to setQuantity here")`. |
| `remove` | `(line: string): void` | `click()` on that line's `a[data-rp-part="remove"]` (liquid backend). When the line has no such link (hydrogen backend): `form.requestSubmit(button)` with the line form's `button[name="intent"][value="remove"]`. Neither found: throw `new Error("rp-cart: nothing to remove here")`. |
| `lines` | `(): Array<{ value: string; label: string }>` | Built at call time from the owned `[data-rp-line]` elements: `value` is the attribute value; `label` is the text content of the line's first `a` or heading element (`h1` to `h6`), with whitespace runs collapsed to one space and trimmed. It is a getter: it is NOT listed in `agent.actions`. |

There is NO `checkout` action on the default path (D-050): confirmation rests on `data-agent-confirm` on the checkout control. The action is added by doc 08 only when SPIKE-08 passes.

No-JS behaviour: hydrogen backend: every form posts to `/api/cart`; the server answers 303 to the same-origin `Referer`; the page re-renders. Liquid: quantity edits need the Update button (`name="update"`); remove is the `url_to_remove` link; the note is saved with Update or Checkout; no discount form (the `<form>` carries `data-rp-js="inflow"` and is not rendered until `rp-cart` is defined, D-021, D-043). The count is the server-rendered value.

Optimistic lines (ids starting with `optimistic:`) never appear in server markup, so the "disable controls on optimistic lines" rule of D-045 item 3 is implemented only by the React binding ([06-bindings.md](06-bindings.md)).

### 7.2 `rp-product-form`

| | |
|---|---|
| Tag | `rp-product-form` |
| Attributes | none. The root carries NO `data-rp-refresh` (ledger section 4.4): the cart regions to refresh are declared by the `rp-cart` roots (8.4). |
| Inner markup read | one add form of 6.2 with `[data-rp-part="submit"]`; `[data-rp-field="merchandise-id"]`; `[data-rp-field="quantity"]` (optional); `[data-rp-part="error"]` |
| Adapter calls | `submitCart`, `openCart`, `usable` |
| Agent | `agent.actions`: `["setQuantity", "add"]` |

Behaviour on `submit` of an owned form when `usable` and (`event.submitter === null` or the submitter matches `[data-rp-part="submit"]`):

1. If the root has `data-pending`: `preventDefault()` and stop (double submit).
2. `preventDefault()`; clear the error part; set `data-pending=""` and `aria-busy="true"` on the root.
3. `await submitCart(form, submitter, event)`.
4. If the store recorded an error or a warning at or after step 2 (`state.errors.lastUpdatedAt >= started`): show `errorMessage(state, "add") ?? strings.error` in the error part (scope `"add"`, 9.2: Hydrogen keys an add error to the EXISTING cart line when the variant is already in the cart, and that line is rendered in the CartDrawer of every page, so scope `"cart"` would miss it). Then:
   - `hasUserError(state, started)` is `true` (a `userErrors` entry or a network error): stop. Nothing was added.
   - otherwise only warnings were recorded: the cart DID change (a warning accompanies a successful mutation, for example a quantity reduced to the available stock). Continue with step 5 (a) and (b), and skip (c): the message stays in the error part and `strings.added` is NOT announced.
5. Otherwise, in this order: (a) dispatch `action` on the root; (b) unless a listener called `preventDefault()`, call `commerce.openCart()`; (c) announce `strings.added` (channel: section 9.1).
6. Always: remove `data-pending` and `aria-busy`.

Code of step 5 (replaces the `announce(...)`, `dispatchEvent` and `openCart` lines of the spike's `.then` callback):

```ts
const proceed = root.dispatchEvent(
  new CustomEvent("action", {
    cancelable: true,
    detail: { value: "add", reason: "submit", merchandiseId, quantity },
  }),
);
if (proceed) commerce.openCart();
const drawer = document.getElementById(getOptions()?.cartDrawer ?? "cart-drawer");
const from = drawer instanceof HTMLDialogElement && drawer.matches(":modal") ? drawer : root;
announce(getStrings().added, { from });
```

`getOptions` is imported from `./adapter` (4.6).

Event (D-023):

| Name | Bubbles | Cancelable | `detail` | React callback |
|---|---|---|---|---|
| `action` | no | yes (cancel to keep the cart closed) | `{ value: "add", reason: "submit", merchandiseId: string, quantity: number }` | `onAction(value, detail)` |

Agent methods:

| Method | Signature | Implementation |
|---|---|---|
| `setQuantity` | `(quantity: number): void` | Set the `value` of `input[data-rp-field="quantity"]` in the root to `String(quantity)` and dispatch `new Event("change", { bubbles: true })` on it. No such input: throw `new Error("rp-product-form: nothing to setQuantity here")`. |
| `add` | `(): void` | `form.requestSubmit(button)` with the root's `[data-rp-part="submit"]` button and its form. No such button: throw `new Error("rp-product-form: nothing to add here")`. |

No-JS behaviour: the form posts natively (hydrogen: 303 back to the product page; Liquid: the platform's `/cart/add` response). The variant in the hidden input is the one the server rendered for the current URL (D-047).

V1 passes no product detail to the store, so Hydrogen creates no optimistic line; the add shows as `pending.cost` only (scenario D1).

### 7.3 `rp-live`

Root of VariantPicker, Filters, FilterChips, SortSelect, LiveForm, and Pagination when it refreshes in place (D-047).

| | |
|---|---|
| Tag | `rp-live` |
| Attributes | `data-rp-refresh="<region names>"` (REQUIRED for in-place refresh; when absent or empty the element navigates with `location.assign(url)`) |
| Inner markup read | `<form method="get">`; `<input>` and `<select>` controls in such a form; `<a href>` |
| Adapter calls | `refresh`, `usable` |
| Agent | `agent.actions`: `["submit"]` |

VariantPicker option values are links with `aria-current` (D-047); VariantPicker, SortSelect and FilterChips MAY sit inside a region they refresh.

Behaviour (all only when `usable`):

| Trigger | Condition | URL |
|---|---|---|
| `submit` | owned form with `method="get"` | `formUrl(form, submitter)`: the form action with the form's successful controls as query parameters; parameters with an empty value are omitted; the action's own query string is dropped |
| `change` | owned `<input>` or `<select>` whose form is an owned GET form | `form.requestSubmit()`, then the `submit` row |
| `click` | plain primary click on an owned `<a href>`, same origin, no `target`, no `download`, not `aria-disabled="true"` | `link.href` |

Then: `reason = regions.every((name) => name.startsWith("rp-product-")) ? "variant" : "filter"`; set `data-pending=""` and `aria-busy="true"` on the root; `await refresh(regions, { url, reason })`; remove both attributes.

History (done inside `refresh`, section 8.2): `variant` uses `history.replaceState`; `filter` uses `history.pushState`.

Events dispatched: none (`rp:refresh` and `rp:refreshed` come from the adapter).

Agent method: `submit(): void` calls `requestSubmit()` on the first `form[method="get" i]` in the root. A root with no such form (VariantPicker, FilterChips: links only) throws `new Error("rp-live: nothing to submit here")`; agents follow its links through the accessibility tree. There is no per-field action in V1.

No-JS behaviour: forms and links navigate. A GET form whose controls submit on change MUST contain a submit button marked `data-rp-js="fallback"`.

Text inputs (PriceRange) fire `change` on blur or Enter; there is no per-keystroke refresh.

### 7.4 `rp-predictive-search`

| | |
|---|---|
| Tag | `rp-predictive-search` |
| Attributes | none |
| Required inner markup | A GET form to the search route containing `<input type="search" name="q" data-rp-part="input" autocomplete="off">`; a panel `<div data-rp-part="results" hidden>` that contains the element `[data-rp-region="rp-predictive-results"]`; inside the region, result links `<a href>` and one `<p data-rp-part="status">` whose text is the localized result count (for example `2 results`) |
| Adapter calls | `refresh`, `usable` |
| Agent | `agent.actions`: `["setQuery", "clear"]` |

Server requirement: the document (or partial) rendered for the search URL MUST contain the region `rp-predictive-results` filled with results for the request's `q`. The form MAY carry extra hidden fields (for example `type=product`); they are part of the URL.

Behaviour:

| Trigger | Action |
|---|---|
| `input` on the input part | Debounce 200 ms. Empty trimmed value: set `hidden` on the panel. Otherwise: root `data-pending=""`, `aria-busy="true"`; `refresh(["rp-predictive-results"], { url: formUrl(form, null), reason: "predictive" })`; clear the flags when the answer belongs to the latest term. |
| `rp:refreshed` including `rp-predictive-results` with `ok: true` | Remove `hidden` from the panel; `announce(<trimmed text of the status part>, { from: root })`. |
| `keydown` ArrowDown / ArrowUp, panel open, focus on the input or a result link | Move focus to the next / previous `<a href>` in the panel; ArrowUp on the first link returns to the input; ArrowDown on the last link stays. `preventDefault()`. |
| `keydown` Escape, panel open | `preventDefault()`; hide the panel; focus the input. |
| `focusout` leaving the root while the document has focus | Hide the panel. |

It is not an ARIA combobox (D-048): no `role="combobox"`, no `aria-activedescendant`. A failed refresh leaves the page unchanged (no navigation). Enter submits the form natively to the search page.

Events dispatched: none.

Agent methods: `setQuery(query: string): void` sets the `value` of the root's search input (the first `input` that is not `type="hidden"` in the root's GET form) and dispatches `new Event("input", { bubbles: true })` on it. `clear(): void` is `setQuery("")`, which also hides the results panel. No such input: throw `new Error("rp-predictive-search: nothing to setQuery here")` (or `... nothing to clear here`).

`react` host: the region part reads the refreshed HTML through `useRegionHtml("rp-predictive-results")` (8.3, 10.3).

No-JS behaviour: a plain search form; the panel stays `hidden`.

### 7.5 `rp-recommendations`

| | |
|---|---|
| Tag | `rp-recommendations` |
| Attributes | `data-url="<URL>"` (optional): a URL whose response contains region `rp-product-recommendations`. Absent: the element does nothing. |
| Required inner markup | `[data-rp-region="rp-product-recommendations"]` (server-rendered: empty, a skeleton, or final content) |
| Adapter calls | `refresh`, `usable` |
| Agent | `agent.actions`: `[]` with `shown: () => false` (display only; hidden from the bridge) |

Behaviour: one `IntersectionObserver` on the root with `rootMargin: "0px 0px 400px 0px"`. On first intersection: disconnect; when `usable`: root `data-pending=""`, `aria-busy="true"`; `refresh(["rp-product-recommendations"], { url, reason: "recommendations" })`; clear the flags. Runs once per connection. A failed refresh leaves the page unchanged.

`data-url` values: Liquid `{{ routes.product_recommendations_url }}?product_id={{ product.id }}&limit=4&intent=related` (UNVERIFIED that a partial can be fetched from this URL: SPIKE-09, owned by doc 11, whose fallback renders a FeaturedCollection without lazy load); hydrogen backend: a route of the app that renders the region. A server that can render recommendations inline SHOULD omit `data-url`.

Events dispatched: none. Agent methods: none.

`react` host: the region part reads the refreshed HTML through `useRegionHtml("rp-product-recommendations")` (8.3, 10.3).

No-JS behaviour: the server-rendered content of the region stays as is.

### 7.6 `rp-view-event`

An infrastructure element (D-089): it belongs to no component, has no class and no `data-slot`, is not built on the kernel, declares no agent actions, dispatches no Ripple event, and is listed in the manifest key `elements` as `{ "display": "block", "chunk": "main", "commerce": true }`. It is printed only by the `product`, `collection`, `search` and `cart` blueprints; no component prints it. Markup, payload and definition: section 12.2.

### 7.7 Element shell

Each of the five `rp-*.ts` files ends with one primitive definition and one exported definition function, following the rules of [04-elements.md](04-elements.md) section 7 (root only; `display: "block"`; primitive `name` equals the tag; `createParts` inside `try` / `catch`). The definition function is called by `defineElements()` during the start (4.5 step 6), NOT at module evaluation, because every controller calls `getCommerce()` while its root upgrades.

UNVERIFIED (SPIKE-04): a root-only primitive whose behaviour lives in the root slot's `bind` was not run. `bind(el, part)` returning a cleanup function, and the `agent` keys `actions`, `items` and `shown`, were read in `uisdk/packages/core/src/foundation/kernel/primitive-types.ts` and `uisdk/packages/core/src/foundation/kernel/primitive.ts`. The spelling of every other `definePrimitive` / `createParts` key below is copied from the worked example in [04-elements.md](04-elements.md) section 8.4; when that section differs, it wins.

`rp-cart.ts`, complete shell (appended after `connectCart`):

```ts
import { definePrimitive } from "@ui-sdk/core";
import { createParts } from "@ui-sdk/web";

function ownedLine(root: Element, line: string): HTMLElement | null {
  const found = root.querySelector<HTMLElement>(`[data-rp-line="${CSS.escape(line)}"]`);
  return found !== null && found.closest("rp-cart") === root ? found : null;
}

function nothing(action: string): never {
  throw new Error(`rp-cart: nothing to ${action} here`);
}

export const rpCart = definePrimitive({
  name: "rp-cart",
  options: {},
  state: () => ({}),
  api: (context) => {
    const root = (): HTMLElement | null => context.element("root");
    return {
      setQuantity(line: string, quantity: number): void {
        const el = root();
        const input = el ? ownedLine(el, line)?.querySelector<HTMLInputElement>('input[data-rp-field="quantity"]') : null;
        if (!input) nothing("setQuantity");
        input.value = String(quantity);
        input.dispatchEvent(new Event("change", { bubbles: true }));
      },
      remove(line: string): void {
        const el = root();
        const row = el ? ownedLine(el, line) : null;
        if (!row) nothing("remove");
        const link = row.querySelector<HTMLAnchorElement>('a[data-rp-part="remove"]');
        if (link) {
          link.click();
          return;
        }
        const button = row.querySelector<HTMLButtonElement>('button[name="intent"][value="remove"]');
        if (!button || !button.form) nothing("remove");
        button.form.requestSubmit(button);
      },
      lines(): Array<{ value: string; label: string }> {
        const el = root();
        if (!el) return [];
        return Array.from(el.querySelectorAll<HTMLElement>("[data-rp-line]"))
          .filter((row) => row.closest("rp-cart") === el)
          .map((row) => ({
            value: row.getAttribute("data-rp-line") ?? "",
            label: (row.querySelector("a, h1, h2, h3, h4, h5, h6")?.textContent ?? "").replace(/\s+/g, " ").trim(),
          }));
      },
    };
  },
  agent: { actions: ["setQuantity", "remove"], items: (api) => api.lines() },
  slots: (slot) => ({
    root: slot({
      // The controller attaches the delegated listeners and returns its cleanup (D-019 item 3).
      bind: (el) => connectCart(el),
    }),
  }),
});

export function defineCart(): void {
  if (customElements.get("rp-cart")) return;
  try {
    createParts(rpCart, { root: { tag: "rp-cart", display: "block", api: ["setQuantity", "remove", "lines"] } });
  } catch (error) {
    console.error("[ripple] rp-cart failed to define", error);
  }
}
```

The other four files use the same shell with these differences only:

| File | `name` and `tag` | `api` methods (implementations: sections 7.2 to 7.5) | `agent` | `bind` | Exports |
|---|---|---|---|---|---|
| `rp-product-form.ts` | `rp-product-form` | `setQuantity(quantity: number): void`, `add(): void` | `{ actions: ["setQuantity", "add"] }` | `(el) => connectProductForm(el)` | `rpProductForm`, `defineProductForm` |
| `rp-live.ts` | `rp-live` | `submit(): void` | `{ actions: ["submit"] }` | `(el) => connectLive(el)` | `rpLive`, `defineLive` |
| `rp-predictive-search.ts` | `rp-predictive-search` | `setQuery(query: string): void`, `clear(): void` | `{ actions: ["setQuery", "clear"] }` | `(el) => connectPredictiveSearch(el)` | `rpPredictiveSearch`, `definePredictiveSearch` |
| `rp-recommendations.ts` | `rp-recommendations` | none (`api: () => ({})`) | `{ actions: [], shown: () => false }` | `(el) => connectRecommendations(el)` | `rpRecommendations`, `defineRecommendations` |

In each file the `createParts` root entry lists every `api` method name in its `api` array (an empty array for `rp-recommendations`), and the thrown message uses that file's tag.

`defineElements()` in `index.ts`:

```ts
function defineElements(): void {
  defineCart();
  defineProductForm();
  defineLive();
  definePredictiveSearch();
  defineRecommendations();
}
```

### Fallback (SPIKE-04)

When SPIKE-04 fails, each file keeps its controller and its `define...()` export, and the primitive is replaced by a class that extends `RippleElement` from `src/runtime/element.ts` ([04-elements.md](04-elements.md) section 15): `connectedCallback` stores the result of `connectX(this)`, `disconnectedCallback` calls and clears it, the agent methods of sections 7.1 to 7.5 are public methods of the class, and the bridge registration is the manual one that doc 04 specifies for the fallback. Controllers, adapter and markup do not change.

## 8. Regions and refresh

### 8.1 Markup

- Region root: `data-rp-region="<name>"`, in every host. The fixed names (D-046 item 1): `rp-cart-lines`, `rp-cart-summary`, `rp-product-buy`, `rp-product-media`, `rp-product-recommendations`, `rp-collection-results`, `rp-collection-filters`, `rp-collection-toolbar`, `rp-search-results`, `rp-predictive-results`. Projects MAY add names; the prefix `rp-` is reserved for Ripple.
- Owners (D-091). Component-owned regions are region parts (a TSX export and a Liquid snippet `rp-<component id>-<part>`): `rp-cart-lines` (CartLines part `list`), `rp-cart-summary` (CartSummary part `totals`), `rp-product-media` (ProductGallery part `media`), `rp-product-recommendations` (ProductRecommendations part `list`), `rp-collection-filters` (Filters part `groups`), `rp-predictive-results` (PredictiveSearch part `results`). Blueprint-owned regions are layout components that receive `data-rp-region` through rest props or `attributes`: `rp-product-buy`, `rp-collection-results`, `rp-collection-toolbar`, `rp-search-results`. The region-part pattern is owned by doc 11 section 0.
- Per host: on Liquid the region is additionally a `{% partial '<name>' %}` that the template or layout writes around the region part. On Remix a region is a plain element; no blueprint uses a `<Frame>` (D-090 item 5).
- A region name is declared at most once per rendered page (D-091 item 5). Therefore the `layout` blueprint omits CartDrawer on the cart page in every host. The `html` strategy still pairs same-named elements by index, so a hand-written page that repeats a name works when the response has the same number of instances in the same order; Ripple blueprints never rely on it.
- A region root MUST NOT be, or contain, a `<dialog>` (the region is INSIDE the dialog body), and MUST NOT contain an `rp-cart` root whose `data-rp-refresh` names it (D-046 item 5; checker RP308). `rp-live` roots MAY sit inside a region they refresh (D-047). A `ui-*` root inside a region is replaced whole (D-022).

### 8.2 `refresh(regions, { url, reason })`

Steps, in order:

1. De-duplicate `regions`, drop empty strings. Empty list: return.
2. Dispatch `rp:refresh` on `document`: `new CustomEvent("rp:refresh", { cancelable: true, detail: { regions, url, reason } })` with `url: string | null` and `reason` defaulting to `"manual"`. If a listener calls `preventDefault()`: return (the listener has taken over rendering).
3. Abort a running refresh for the same sorted region set.
4. History, when `url` is set, the host is not `react`, and not (the host is `remix` and `options.navigate` is set): reason `variant`: `history.replaceState(history.state, "", url)`; reason `filter`: `history.pushState(history.state, "", url)`; other reasons: no change. On the two excluded cases the router's `navigate` writes history.
5. Set `aria-busy="true"` on every region root. Remember focus when the active element is inside one of the regions: its `id`, its line (`data-rp-line`), its hook (`data-rp-part` or `data-rp-field`).
6. Run the host strategy with an `AbortSignal`.
7. If aborted meanwhile: return without events.
8. Remove `aria-busy`. Reset every `input[data-rp-field="quantity"]` inside the regions, except the focused one, to its `defaultValue`.
9. On success restore focus, only when focus was lost (`document.activeElement` is `body`): by `id`; else the same hook in the same line; else the first focusable element of the region; else the first focusable element of the closest `<dialog>`.
10. Dispatch `rp:refreshed` on `document`: `detail: { regions, ok }`.
11. On failure (the strategy threw and the refresh was not aborted), unless `reason` is `predictive` or `recommendations`: `location.assign(url)` when `url` is set, otherwise `location.reload()`. This step is the same code in every host; the table below shows what it amounts to per host (D-090). Reasons `predictive` and `recommendations` NEVER fall back to navigation: a failure leaves the page as it is.

Reasons (`RefreshReason`; the complete set, D-023):

| `reason` | Set by | History (step 4) | On failure (step 11) |
|---|---|---|---|
| `cart` | the adapter after a cart mutation (8.4) | none | `location.reload()` |
| `variant` | `rp-live` when every region name starts with `rp-product-` | replace | `location.assign(url)` |
| `filter` | `rp-live` otherwise | push | `location.assign(url)` |
| `predictive` | `rp-predictive-search` | none | nothing |
| `recommendations` | `rp-recommendations` | none | nothing |
| `manual` | default for user code | none | `location.assign(url)` when `url` is set, otherwise `location.reload()` |

Failure per host (D-090 item 2):

| Host | No `url` (`cart`, `manual`) | `variant`, `filter` | `predictive`, `recommendations` |
|---|---|---|---|
| `liquid` | `location.reload()` | `location.assign(url)` | nothing |
| `html` | `location.reload()` | `location.assign(url)` | nothing |
| `remix` | `location.reload()` | `location.assign(url)` | nothing |
| `react` | cannot fail (the strategy does nothing) | `location.assign(url)` when `navigate` rejects; without `navigate` the strategy itself is `location.assign(url)` | nothing |

Back and forward: after at least one `filter` push, a `popstate` event calls `location.reload()` (the URL is the state). The listener is not installed on `react`, nor on `remix` when `"navigation" in window` (the Remix router handles history there; UNVERIFIED on the default `html` strategy, SPIKE-10).

### 8.3 Strategies

One strategy per host (D-046 item 4, D-090 item 2). A strategy replaces the regions or throws; the fallback of step 11 belongs to `refresh`, not to the strategy.

| Host | File | No `url` (reasons `cart`, `manual`) | Reasons `variant`, `filter` | Reasons `predictive`, `recommendations` |
|---|---|---|---|---|
| `liquid` | `refresh-liquid.ts` | `partials.fetch(...regions, { signal })`, then `partials.apply(payload)` | the same with `{ url: <absolute url>, signal }` | the same with `url` |
| `html` | `refresh-html.ts` | fetch `location.href`, replace each `[data-rp-region]` | fetch `url`, replace | fetch `url`, replace |
| `remix` | `refresh-remix.ts` | `await options.reloadFrames(regions, null)` when `reloadFrames` is configured; otherwise the `html` strategy | `await options.navigate(url, { replace: reason === "variant" })` when `navigate` is configured; otherwise the `html` strategy | the `html` strategy |
| `react` | `refresh-react.ts` | nothing (React renders cart regions from the store) | `await options.navigate(url, { replace: reason === "variant" })` when configured; otherwise `location.assign(url)` | fetch `url`, take the `innerHTML` of the response's `[data-rp-region="<name>"]` element for each name, publish it to the region-HTML store read by `useRegionHtml(name)` |

A `manual` refresh WITH a `url` follows the `variant`, `filter` column in every host, with `replace: false`.

**`html`** (`refresh-html.ts`, copied from the spike unchanged; scenarios H1, H2, H4, H5, H7): `fetch(url ?? location.href, { headers: { accept: "text/html" }, credentials: "same-origin", signal })`; non-2xx throws; parse with `DOMParser`; for each name pair the page's and the response's `[data-rp-region="<name>"]` elements by index; a count mismatch throws; `stale.replaceWith(document.adoptNode(fresh))`. Scripts inside a region are not executed. Robustness outside Chromium: SPIKE-10.

**`liquid`** (`refresh-liquid.ts`, copied from the spike unchanged): `const { partials } = await import("@shopify/partial-rendering")` (cached; retried after a failed load); `payload = await partials.fetch(...regions, { signal })` or `partials.fetch(...regions, { url: <absolute url>, signal })`; `await partials.apply(payload)`. Each region is a `{% partial '<name>' %}` whose output root carries `data-rp-region="<name>"` (D-046 item 2). `@shopify/partial-rendering` is a platform-provided specifier, not an npm dependency. UNVERIFIED on a store (SPIKE-02).

**`remix`** (`refresh-remix.ts`, complete file). On Remix a region is a plain element with `data-rp-region`; the default is the `html` strategy. `reloadFrames` and `navigate` are opt-in options that the app passes to `configureCommerce` (SPIKE-11); the file imports nothing from `remix` (D-062 item 6).

```ts
import type { RefreshStrategy } from "./adapter";
import { refreshHtml } from "./refresh-html";

/**
 * Remix 3. Default: the `html` strategy (a region is a plain `[data-rp-region]` element).
 * Opt-in: `reloadFrames` for refreshes without a URL, `navigate` for reasons `variant` and `filter`.
 */
export const refreshRemix: RefreshStrategy = async (regions, context) => {
  const { url, reason, signal, options } = context;
  if (url === null) {
    if (!options.reloadFrames) return refreshHtml(regions, context);
    await options.reloadFrames(regions, null);
    signal.throwIfAborted();
    return;
  }
  if ((reason === "variant" || reason === "filter") && options.navigate) {
    await options.navigate(url, { replace: reason === "variant" });
    signal.throwIfAborted();
    return;
  }
  return refreshHtml(regions, context);
};
```

Reference `reloadFrames` for an app that opted in (the frame API `app.frames.get(name)?.reload()` is from `ripple/docs/research/remix-3.md`; not run: SPIKE-11). The adapter always passes `null` as the second argument:

```ts
configureCommerce({
  host: "remix",
  reloadFrames: async (names, url) => {
    await Promise.all(names.map((name) => app.frames.get(name)?.reload()));
  },
});
```

An app that passes `reloadFrames` MUST also pass a named blocking `<Frame>` as the children of each cart region part, with the Frame name equal to the region name (D-034 item 4; [06-bindings.md](06-bindings.md)).

**`react`** (`refresh-react.ts`, complete file). UNVERIFIED (SPIKE-10): the `predictive` / `recommendations` branch and the store were not run.

```ts
import type { RefreshStrategy } from "./adapter";

/* Region-HTML store: backs `useRegionHtml(name)` in `src/react/hooks.ts` (D-090 item 4). */

const regionHtml = new Map<string, string>();
const regionListeners = new Map<string, Set<() => void>>();

/** The inner HTML last published for the region `name`, or `null` when nothing was published. */
export function getRegionHtml(name: string): string | null {
  return regionHtml.get(name) ?? null;
}

/** Calls `listener` after each publish for the region `name`. Returns the unsubscribe function. */
export function subscribeRegionHtml(name: string, listener: () => void): () => void {
  let set = regionListeners.get(name);
  if (!set) {
    set = new Set();
    regionListeners.set(name, set);
  }
  set.add(listener);
  return () => {
    regionListeners.get(name)?.delete(listener);
  };
}

function publishRegionHtml(name: string, html: string): void {
  if (regionHtml.get(name) === html) return;
  regionHtml.set(name, html);
  for (const listener of Array.from(regionListeners.get(name) ?? [])) listener();
}

/**
 * React. Cart regions render from store state. `variant` and `filter` are re-rendered by the
 * app's router. `predictive` and `recommendations` publish fetched region HTML to the store.
 */
export const refreshReact: RefreshStrategy = async (regions, { url, reason, signal, options }) => {
  if (url === null) return;
  if (reason === "predictive" || reason === "recommendations") {
    const response = await fetch(url, {
      headers: { accept: "text/html" },
      credentials: "same-origin",
      signal,
    });
    if (!response.ok) throw new Error(`[ripple] region refresh: HTTP ${response.status}`);
    const next = new DOMParser().parseFromString(await response.text(), "text/html");
    signal.throwIfAborted();
    for (const name of regions) {
      const fresh = next.querySelector(`[data-rp-region="${CSS.escape(name)}"]`);
      if (!fresh) throw new Error(`[ripple] region "${name}" is not in the response`);
      publishRegionHtml(name, fresh.innerHTML);
    }
    return;
  }
  if (options.navigate) await options.navigate(url, { replace: reason === "variant" });
  else location.assign(url);
};
```

Store contract:

| Function | Signature | Contract |
|---|---|---|
| `getRegionHtml` | `(name: string) => string \| null` | `null` until the first publish for `name`; then the published string. It returns the SAME string value until a different HTML is published for that name, so it is a valid `useSyncExternalStore` snapshot. |
| `subscribeRegionHtml` | `(name: string, listener: () => void) => () => void` | `listener` runs synchronously after each publish for `name` that changed the value. |
| `publishRegionHtml` | not exported | Called only by `refreshReact`. |

`useRegionHtml(name)` in `src/react/hooks.ts` (owned by [06-bindings.md](06-bindings.md) section 6.2) MUST subscribe per name, because `subscribeRegionHtml` takes the name first:

```ts
import { useCallback, useSyncExternalStore } from "react";
import { getRegionHtml, subscribeRegionHtml } from "../commerce/refresh-react.ts";

const noRegionHtml = (): string | null => null;

export function useRegionHtml(name: string): string | null {
  const subscribe = useCallback((listener: () => void) => subscribeRegionHtml(name, listener), [name]);
  return useSyncExternalStore(subscribe, () => getRegionHtml(name), noRegionHtml);
}
```

It returns `null` on the server, during hydration and until the first publish; then the HTML string. The React region parts of PredictiveSearch (`results`) and ProductRecommendations (`list`) render their server children while the value is `null` and `dangerouslySetInnerHTML` on the same region root afterwards (D-090 item 4; code in doc 11). After a publish the `[data-rp-region]` root in the page is the element React renders, so steps 5 to 10 of 8.2 (busy flag, focus, `rp:refreshed`) apply to it unchanged.

### 8.4 Cart refresh

The adapter subscribes to the store once. Each time `isBusy` goes from true to false it calls `refresh(cartRegions(), { reason: "cart" })`. `cartRegions()` is the union of the `data-rp-refresh` names of every `rp-cart[data-rp-refresh]` root, limited to names that have a `[data-rp-region]` element in the document. No such element: no refresh (for example a page with only a CartLink).

On `pageshow` with `event.persisted` (back-forward cache) the adapter calls `cart.refresh()`.

## 9. Mutations: who renders what

### 9.1 After each mutation

Sequence for every cart mutation with JavaScript: (a) the element sets pending flags; (b) the store sends the mutation; (c) the store settles: the count parts repaint from `totalQuantity`; error parts repaint; (d) the adapter refreshes cart regions; (e) the element announces success.

| Mutation | Element | Store call | Painted by element from store | Re-rendered by host (regions) | Announcement |
|---|---|---|---|---|---|
| Add | `rp-product-form` | `handleFormSubmit` (`add`) | count in every `rp-cart`; product form error | `rp-cart-lines`, `rp-cart-summary` (as declared by `rp-cart` roots) | `added`, then cart opens |
| Set quantity | `rp-cart` | `set` | count; line pending; line error | same | `updated` |
| Remove | `rp-cart` | `remove` (hydrogen form) or `set` 0 | count; line pending | same | `removed` |
| Note | `rp-cart` | `note-update` | cart error | same (no visible change expected) | `noteSaved` |
| Cart attributes | `rp-cart` | `attributes-update` | cart error | same | `updated` |
| Discount apply / remove | `rp-cart` | `discount-apply` / `discount-remove` | discount error | same; DiscountCode's code list MUST be inside `rp-cart-summary` | `discountApplied` / `discountRemoved` |
| Variant change | `rp-live` | none | none | `rp-product-buy`, `rp-product-media` | none (focus stays on the control) |
| Filter, sort, page | `rp-live` | none | none | `rp-collection-results`, `rp-collection-filters`, `rp-collection-toolbar` or `rp-search-results` | none in V1; the results region SHOULD contain a `role="status"` count |
| Predictive search | `rp-predictive-search` | none | panel `hidden` | `rp-predictive-results` | status part text |
| Recommendations | `rp-recommendations` | none | none | `rp-product-recommendations` | none |

Who performs the re-render:

| Host | Cart regions | URL-driven regions |
|---|---|---|
| `liquid` | `partials.fetch` + `partials.apply` | same, with `url` |
| `html` | document fetch + element replacement | same, with `url` |
| `remix` | default: document fetch + element replacement (the `html` strategy). Opt-in: `reloadFrames(names, null)` | default: the `html` strategy with `url`. Opt-in for `variant` and `filter`: `navigate(url, { replace })` |
| `react` | React components subscribed to the store (`useCart` in [06-bindings.md](06-bindings.md)); the refresh is a no-op | `variant`, `filter`: the app router through `navigate`. `predictive`, `recommendations`: the region parts through `useRegionHtml` |

Announcement channel (D-079). Every call is `announce(text, { from })` from `src/runtime/announcer.ts`, which writes into the first `[data-rp-part="status"]` element of the open modal `<dialog>` that contains `from`, and otherwise into the page-level live region.

| Element | Text | Channel |
|---|---|---|
| `rp-cart` | `updated`, `removed`, `discountApplied`, `discountRemoved`, `noteSaved` | When the handling root owns a `[data-rp-part="status"]` element: `status.textContent = text` (the part has `role="status"`, and it is inside the dialog when the root is). Otherwise (CartLink): `announce(text, { from: root })`. |
| `rp-product-form` | `added` | After `openCart()`: `announce(text, { from })` with `from` = the cart drawer `<dialog>` when it is open as a modal, else the root (code in 7.2). With the drawer open the text therefore lands in the status part of the CartLines inside it. |
| `rp-predictive-search` | the result count text | `announce(text, { from: root })` |

A success is announced only when no error was recorded since the action began. Toast is never used for cart feedback (D-008 item 7).

### 9.2 Errors

`beginAction()` stores the time a buyer action starts. Error parts show only errors recorded at or after the latest `beginAction()`; starting any new cart action therefore clears older messages.

Scope of an `rp-cart` error part, decided by position:

| Position of `[data-rp-part="error"]` | Scope | Message |
|---|---|---|
| inside a `[data-rp-line]` | that line | first `userErrors` message, else first `warnings` message, of `errors.lines.get(<line id>)` |
| inside a form that contains `[data-rp-field="discount-code"]` | discount | the last discount code group's first message |
| anywhere else in the root | cart | first of: `errors.cart`; `errors.note`; `errors.attributes`; line errors whose line is not rendered on the page; the latest `errors.network` message |
| the error part of an `rp-product-form` | add (D-119) | first of: `errors.cart`; the first message of ANY `errors.lines` group, rendered on the page or not, when `errors.linesUpdatedAt >= since`; the latest `errors.network` message. `errors.note`, `errors.attributes` and discount errors are not shown here. |

Code added to `errorMessage` in `adapter.ts` (the `"add"` branch goes directly after the `"discount"` branch) and the new export `hasUserError`:

```ts
export type ErrorScope = { line: string } | "discount" | "cart" | "add";

// inside errorMessage(), after the "discount" branch:
if (scope === "add") {
  if (errors.cartUpdatedAt >= since) {
    const cart = first(errors.cart);
    if (cart) return cart;
  }
  if (errors.linesUpdatedAt >= since) {
    for (const group of errors.lines.values()) {
      const message = first(group);
      if (message) return message;
    }
  }
  if (errors.networkUpdatedAt >= since && errors.network.length > 0) {
    return errors.network[errors.network.length - 1]!.message;
  }
  return null;
}

/** True when a userError or a network error (not only warnings) was recorded at or after `since`. */
export function hasUserError(state: CartState, since: number): boolean {
  const { errors } = state;
  const has = (group: { userErrors: unknown[] } | undefined): boolean => (group?.userErrors.length ?? 0) > 0;
  if (errors.networkUpdatedAt >= since && errors.network.length > 0) return true;
  if (errors.cartUpdatedAt >= since && has(errors.cart)) return true;
  if (errors.noteUpdatedAt >= since && has(errors.note)) return true;
  if (errors.linesUpdatedAt >= since) for (const group of errors.lines.values()) if (has(group)) return true;
  if (errors.attributesUpdatedAt >= since) for (const group of errors.attributes.values()) if (has(group)) return true;
  if (errors.discountCodesUpdatedAt >= since) for (const group of errors.discountCodes.values()) if (has(group)) return true;
  return false;
}
```

Rules:

- Error parts: CartLines MUST print one line-scope error part per line (inside each CartLine) and one cart-scope error part. CartNote and DiscountCode MUST print one each. CartLink and CartSummary MUST NOT print one.
- Status parts: CartLines, CartSummary, CartNote and DiscountCode MUST each print exactly one `<p class="rp-visually-hidden" data-rp-part="status" role="status"></p>` (D-045 as amended, D-079), not only CartDrawer: CartDrawer gets its status part from the CartLines it contains. CartLink prints none.
- An error stays visible until the next buyer cart action begins (D-045).
- A cart-scope message is shown by every cart-scope part on the page (a note error appears in CartLines and in CartNote). This duplication is accepted in V1.
- When `submitCart` or `setLineQuantity` rejects (network failure not recorded by the store), `rp-cart` writes `strings.error` to its first cart-scope error part and logs `[ripple] cart action failed.` with `console.error`.
- `rp-product-form` shows `errorMessage(state, "add") ?? strings.error` in its own error part (7.2 step 4). When only warnings were recorded it still opens the cart (D-119).
- After an error the server state may still have changed (partial success); the cart regions are refreshed in every case, so quantities return to the server's values (step 8 of 8.2).
- Errors use `role="alert"` on the error part; they are not also sent through `announce`.
- The two writes on an error part (text, `hidden`) and the two on a count part (text, `hidden`) are `upgradeAllow` entries fixed by D-071 item 3.

### 9.3 Optimistic rules

1. `html`, `remix`, `liquid`: no structure is created from store data. Pending is shown with `data-pending` / `aria-busy` only; the only store-driven text is the count.
2. The quantity input keeps the buyer's typed value while pending. It is reset to the server value by the refresh.
3. Controls are not disabled while pending. A second quantity change on the same line during a pending change is sent after its own 250 ms debounce; the store serialises requests.
4. `react`: components MAY render lines, quantities and (non-money) structure from the store through `useCart` ([06-bindings.md](06-bindings.md)), including lines whose id starts with `optimistic:`; controls on such lines MUST be `disabled`. Money text for optimistic lines MUST NOT be invented: render the server-formatted value or nothing. One writer per node (D-033): `rp-cart` writes the count text, error text and pending attributes; React renders those nodes with constant props and `suppressHydrationWarning`.
5. The count is hidden (`hidden`) when the total quantity is 0 and shown otherwise.

## 10. Host adapters

### 10.1 Hydrogen server (all of `html`, `react`, `remix`)

This section is D-041 item 1 as corrected and D-088. Server APIs, all from `@shopify/hydrogen` (evidence: `hydrogen/packages/hydrogen/src/core/cart/server-handlers.ts`, `hydrogen/packages/hydrogen/skills/hydrogen-request-handlers/SKILL.md`, `hydrogen/packages/hydrogen/src/core/shopify-scripts/index.ts`). In the code below `i18nDefinition` (the value returned by `defineShopifyI18n`), `routeTemplates`, `storefrontClientType` and `storefrontClientConfig` are the app's own values, described in the Hydrogen skills `hydrogen-markets`, `hydrogen-request-handlers` and `hydrogen-storefront-client` (`hydrogen/packages/hydrogen/skills/`); Ripple adds nothing to them.

```ts
import {
  createCartServerHandlers,
  createShopifyRequestContext,
  createStorefrontClient,
  handleShopifyRedirects,
  handleShopifyRoutes,
  renderShopifyScriptTags,
} from "@shopify/hydrogen";

const cartHandlers = createCartServerHandlers();

export async function handle(request: Request): Promise<Response> {
  const requestContext = createShopifyRequestContext({ request, i18n: i18nDefinition });
  // `requestContext` MUST be the object created on the line above; handleShopifyRoutes throws otherwise.
  const storefrontClient = createStorefrontClient({ type: storefrontClientType, requestContext, config: storefrontClientConfig });

  // 1. Hydrogen routes first. Returns null synchronously when no route matches.
  const shopifyRoute = handleShopifyRoutes({
    request,
    requestContext,
    storefrontClient,
    routeTemplates,
    handlers: [cartHandlers],
  });
  if (shopifyRoute) return await shopifyRoute;

  // 2. The app's own routing renders the page (below).
  // 3. After a 404 only: handleShopifyRedirects({ request, storefrontClient, routeTemplates }).
}
```

`createStorefrontClient` takes ONE object `{ type, requestContext, config }` (`hydrogen/packages/hydrogen/src/client/client.ts`) and MUST receive the per-request `requestContext` created in the same function: `handleShopifyRoutes` throws `handleShopifyRoutes must receive the same requestContext used by storefrontClient.` otherwise (`hydrogen/packages/hydrogen/src/core/request-routing/handle-shopify-routes.ts`). A module-level client cannot satisfy this.

Rules:

1. `handlers: [cartHandlers]` mounts `GET /api/cart` (JSON) and `POST /api/cart`. A JSON POST (from the store) answers JSON. A form POST (no JavaScript) answers `303` to the same-origin `Referer`. The handlers object has lowercase members `get` and `post`.
2. Every page MUST print the Hydrogen script tags in `<head>` before the config element and the `ripple.js` module script (D-088 item 2): `renderShopifyScriptTags({ shop, i18n: requestContext.locale, consent: { mode: "default-banner" } }).join("")`. Here `i18n` is the RESOLVED locale of the request (`{ country, language, pathPrefix?, currency? }`), NOT the `defineShopifyI18n` definition passed to `createShopifyRequestContext` (`hydrogen/packages/hydrogen/skills/hydrogen-setup/steps/7-shopify-runtime-scripts.md`). They load Standard Actions (required, 5.1), consent and analytics. `shop` is `{ shopId, storefrontId, myshopifyDomain }` (shape from `hydrogen/packages/hydrogen/src/core/shopify-scripts/static-scripts.test.ts`). The `consent.mode` printed here MUST equal the `consent` option of section 4.2.
3. Cart markup is rendered from a server cart read: `const { data } = await cartHandlers.get({ storefrontClient, request });` where `data` is `{ cart, errors? }`. This read marks the response as personalized: a page that prints cart lines or a non-zero count from it MUST NOT be cached publicly.
4. Seeding: a server that made the read of rule 3 SHOULD pass it to the client as `initialCart` in the config element (then no `GET /api/cart` happens on load, scenario H3). A publicly cached page MUST NOT seed; it prints the count part with `hidden` and the text `0` (hook attributes: `data-rp-part="count" hidden`; classes in doc 11, CartLink) and the element fills it after load (D-041 as amended).
5. The response for a region refresh on the `html` host, and on the `remix` host by default, is the full page; no special route is needed.
6. Config element for the `html` host (printed by the `layout` blueprint, 4.4), for a request in the default locale (`pathPrefix` is `""`):

```html
<script type="application/json" id="rp-commerce">{"host":"html","cartEndpoint":"/api/cart","cartUrl":"/cart","initialCart":{"cart":null}}</script>
```

   An app that passes its own `routeTemplates` to `handleShopifyRoutes` MUST add the same object to the config element as `"routes": <routeTemplates>` (option `routes`, 4.2, D-130); an app on the standard routes omits the key.

7. Locale path prefix (D-118). `handleShopifyRoutes` serves the cart handlers under every locale prefix (`/fr-ca/api/cart`) and the handler takes the locale from the request URL. The route code computes ONE string per request, `const cartAction = `${requestContext.locale.pathPrefix}/api/cart`;`, and uses it in exactly three places: (a) `cartEndpoint` of the config element (and `cartUrl` is `` `${requestContext.locale.pathPrefix}/cart` ``); (b) the `cartAction` prop of the `layout`, `cart` and `product` blueprints, which pass it as the `action` prop of CartDrawer, CartLines, CartSummary, CartNote, DiscountCode and ProductForm (`11-components-commerce.md` CV-17); (c) nowhere else: no component reads the config element on the server. For a request to `/fr-ca/...` the config element is `{"host":"html","cartEndpoint":"/fr-ca/api/cart","cartUrl":"/fr-ca/cart",...}` and every cart form has `action="/fr-ca/api/cart"`. Hydrogen's own statement (`configureCartEndpoint` doc comment, `hydrogen/packages/hydrogen/src/core/cart/cart.ts`): "Without those providers, call the function in the browser only and include the page's locale path prefix in the endpoint, such as `/fr-ca/api/cart`."


### 10.2 Remix 3

Everything in 10.1, plus (evidence: `ripple/docs/research/remix-3.md`; details and scaffolded code in [06-bindings.md](06-bindings.md)):

1. The Shopify middleware that calls `handleShopifyRoutes` MUST run before any middleware that reads the request body (`formData()`), because the cart POST handler reads it.
2. Cart forms, and links and forms to `/checkout` and account routes, print `data-rmx-document` so the Remix router does not intercept them (D-034 item 3). The checkout link is `<a href="<checkoutUrl>" data-rmx-document data-agent-confirm="<sentence>">`.
3. Default (D-034 item 4, D-090 item 5): a region is a plain element with `data-rp-region="<name>"`, the same markup as on the `html` host. There is no `<Frame>`. The refresh strategy is the `html` strategy: the config element says `"host": "remix"` and no `configureCommerce` call is needed. UNVERIFIED under the Remix router (SPIKE-10).
4. `ripple.js` is served prebuilt from `public/ripple/` (D-034 item 5); `configureCommerce`, when used, is imported from that file (4.4).
5. Opt-in options (both UNVERIFIED, SPIKE-11). The client entry passes them with one `configureCommerce` call, evaluated in the same task as the `ripple.js` module:

| Option | Effect | What the app must also do |
|---|---|---|
| `reloadFrames` | Refreshes without a URL (reasons `cart`, `manual`) call `reloadFrames(regions, null)` instead of the `html` strategy. | Pass a named blocking `<Frame>` as the children of each cart region part (`CartLinesList`, `CartSummaryTotals`); the Frame name equals the region name. Reference callback: 8.3. |
| `navigate` | Reasons `variant` and `filter` call `navigate(url, { replace: reason === "variant" })` instead of the `html` strategy; the adapter then writes no history entry (8.2 step 4). | Pass the router's navigation function; it MUST re-render the route for `url`. |

Reasons `predictive` and `recommendations` always use the `html` strategy on Remix.

#### Fallback (SPIKE-11)

When SPIKE-11 fails, the two options are removed from the Remix documentation and skills, `refreshRemix` is reduced to `export const refreshRemix: RefreshStrategy = (regions, context) => refreshHtml(regions, context);`, and Remix uses the `html` strategy only. Markup does not change.

### 10.3 React

Everything in 10.1, plus:

1. The client entry MUST `import "<pkg>/commerce"` (and `import "<pkg>/elements"`) once and call `configureCommerce({ host: "react", navigate })` before `hydrateRoot`. `navigate` is optional; `initialCart` and the other JSON options come from the config element that the `layout` blueprint prints (4.4), or from the same `configureCommerce` call when the app prints no config element.
2. Hooks in `<pkg>/react` read the same store. `<pkg>/react` exports exactly `useElement`, `useCart(selector, serverValue)`, `useRegionHtml(name)` and types (D-033, D-096); their code is owned by [06-bindings.md](06-bindings.md) section 6.2. `useCart` is built on `useSyncExternalStore(getCommerce().cart.subscribe, ...)` and returns `serverValue` on the server, during hydration and when the store is unusable. No `CartProvider` (D-033, D-041).
3. Cart components render from the store, so `refresh` with reason `cart` does nothing. `rp-cart` still handles submits and paints `data-pending`, the count and errors; one writer per node (D-033): React components render those nodes with constant props and MUST set `suppressHydrationWarning` on `[data-rp-part="count"]` and `[data-rp-part="error"]` elements.
4. `navigate(url, { replace })` MUST re-render the route for `url`; the adapter does not touch history on this host. Without `navigate`, reasons `variant` and `filter` are document navigations (`location.assign(url)`).
5. Predictive search and lazy recommendations work on the default path with no app code: for reasons `predictive` and `recommendations` the strategy publishes the fetched region HTML, and the region parts `PredictiveSearchResults` and `ProductRecommendationsList` read it with `useRegionHtml(name)` (8.3). The app MUST NOT cancel `rp:refresh` on the default path. UNVERIFIED (SPIKE-10); the fallback is in section 16.
6. A binding file MUST NOT import `<pkg>/commerce` or `<pkg>/elements` (D-096 item 3); only the client entry does.

### 10.4 Liquid theme

1. The theme MUST NOT contain `snippets/standard-actions-config.liquid` or `assets/standard-actions-override.js`, and MUST NOT call `Shopify.actions.updateCart.configure` (RP307). Hydrogen inside `ripple.js` makes the one `configure` call, at the time fixed by 5.2 item 2 (inside the page's first `DOMContentLoaded` listener, D-122).
2. Standard Actions, Standard Events and partial rendering are provided by the platform; `ripple.js` imports `@shopify/partial-rendering` and `@shopify/standard-events` dynamically and reads `window.Shopify.actions`. Ripple prints nothing for them (D-088 item 2). How the developer-preview theme enables these (import map) is specified in [14-liquid-theme.md](14-liquid-theme.md); it is UNVERIFIED here (SPIKE-01, SPIKE-02).
3. The config element is printed by `snippets/rp-head.liquid` (owned by [14-liquid-theme.md](14-liquid-theme.md) section 7), after `{% render 'rp-tokens' %}` and before the inline Invoker Commands polyfill (D-054 item 7, D-087 item 3). The layout does not print it. Its text (the snippet file is owned by doc 14; the JSON keys and values are owned here, and the two MUST be equal):

```liquid
<script type="application/json" id="rp-commerce">
{
  "host": "liquid",
  "cartUrl": {{ routes.cart_url | json }},
  "cartAddUrl": {{ routes.cart_add_url | json }},
  "cartDrawer": "cart-drawer",
  "strings": {
    "added": {{ 'ripple.product-form.added' | t | json }},
    "updated": {{ 'ripple.cart-lines.updated' | t | json }},
    "removed": {{ 'ripple.cart-lines.removed' | t | json }},
    "discountApplied": {{ 'ripple.discount-code.applied' | t | json }},
    "discountRemoved": {{ 'ripple.discount-code.removed' | t | json }},
    "noteSaved": {{ 'ripple.cart-note.saved' | t | json }},
    "error": {{ 'ripple.cart-lines.error' | t | json }}
  }
}
</script>
```

4. Each region is `{% partial '<name>' %}`, written in a template or layout (never in a block or snippet, D-037), whose output root carries `data-rp-region="<name>"`. A partial name is declared at most once per rendered page (D-091 item 5).
5. Form field names are the liquid column of 6.1; forms of 6.2.
6. Theme code that needs the cart MUST `import { getCommerce } from "ripple"` and MUST NOT load `@shopify/hydrogen` (D-041 item 4). The Ripple theme itself contains no theme-owned JavaScript module (D-039).
7. The layout prints `<main id="main" data-template="{{ request.page_type }}">` (D-099); the page-view dispatch reads `data-template` (section 12.1).

### 10.5 Form field names per host (summary)

| Operation | `html`, `react`, `remix` (POST `/api/cart`) | `liquid` |
|---|---|---|
| Add | `merchandiseId`, `quantity`, `sellingPlanId`, `attributes.<k>`; submit `name="intent" value="add"` | POST `routes.cart_add_url`: `id`, `quantity`, `selling_plan`, `properties[<k>]`; submit `name="add"` |
| Set quantity | `lineId`, `quantity`; submit `intent=set` | POST `routes.cart_url`: `updates[]` per line in order; submit `name="update"` |
| Remove | `lineId`; submit `intent=remove` | GET link `item.url_to_remove` |
| Note | `note`; submit `intent=note-update` | `note` in the cart form |
| Cart attribute | `attributes.<k>`; submit `intent=attributes-update` | `attributes[<k>]` in the cart form |
| Discount | `discountCode`; submit `intent=discount-apply` / `discount-remove` | JavaScript only: same markup, hooks read by `data-rp-field` |
| Checkout | link to `cart.checkoutUrl` | submit `name="checkout"` in the cart form |

## 11. Resources, money and images

### 11.1 Shared data types

This section is the single definition of every shared `Ripple*` data type (D-094). All of them are declared in `src/types.ts` and exported from `<pkg>` as types (no runtime code). A component document, a blueprint or a `.data.ts` file MUST import them (`import type { RippleProduct } from "<pkg>"`) and MUST NOT declare a type with one of these names or a copy of one of these shapes under another name. Blueprint page-data types (`RippleLayout`, `RippleHome` and the like) are NOT here: they are local to the blueprints' `types.ts` (doc 12) and are not exported.

TSX hosts pass plain objects with the shapes below. Liquid passes drops; the tables after the code give the expression the Liquid binding reads. Components MUST NOT read any other field.

Verification status of field names. Read in source: the cart fields (`HydrogenCartFragment`, `hydrogen/packages/hydrogen/src/core/cart/queries.ts`); the product option fields `options.optionValues`, `selectedOrFirstAvailableVariant`, `adjacentVariants` (`hydrogen/packages/hydrogen/src/core/product/state.ts`, as cited by doc 11 section 0.6); `Menu` and `MenuItem` (`id`, `items`, `title`, `url`; checked with the Shopify docs tool by doc 12 section 1.2). Every other Storefront API field name in this section is UNVERIFIED and MUST be checked with the Shopify docs tool before the types are frozen (acceptance test C-24).

The ten resource types named by D-094 item 1 (`RippleProduct`, `RippleVariant`, `RippleLine`, `RippleCart`, `RippleImage`, `RippleMoney`, `RippleCollection`, `RippleArticle`, `RippleMenu`, `RippleShop`):

```ts
export interface RippleMoney { amount: string; currencyCode: string }

export interface RippleImage { url: string; altText: string | null; width: number; height: number }

export interface RippleSelectedOption { name: string; value: string }

export interface RippleVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: RippleMoney;
  compareAtPrice: RippleMoney | null;
  image: RippleImage | null;
  selectedOptions: RippleSelectedOption[];
}

export interface RippleProduct {
  id: string;
  title: string;
  handle: string;
  /** Path of the product page, computed by the host from its route templates, for example "/products/linen-shirt". */
  url: string;
  vendor: string;
  availableForSale: boolean;
  featuredImage: RippleImage | null;
  /** `priceRange.minVariantPrice`. */
  price: RippleMoney;
  /** `compareAtPriceRange.minVariantPrice` when its amount is greater than `price.amount`, otherwise `null`. */
  compareAtPrice: RippleMoney | null;
}

export interface RippleCollection {
  id: string;
  title: string;
  handle: string;
  url: string;
  image: RippleImage | null;
}

export interface RippleArticle {
  id: string;
  title: string;
  /** `/blogs/<blog handle>/<article handle>`, computed by the host. */
  url: string;
  /** `""` when the API returns `null`. */
  excerpt: string;
  /** ISO 8601 date-time. */
  publishedAt: string;
  image: RippleImage | null;
}

export interface RippleLine {
  /** Storefront API cart line id (hydrogen backend). On Liquid the binding reads `item.key`. */
  id: string;
  quantity: number;
  title: string;
  /** `""` when the variant is the default variant. */
  variantTitle: string;
  url: string;
  image: RippleImage | null;
  /** `cost.totalAmount`. */
  totalPrice: RippleMoney;
  /** `cost.subtotalAmount` when its amount is greater than `cost.totalAmount`, otherwise `null` (D-049). */
  compareAtTotalPrice: RippleMoney | null;
  attributes: Array<{ key: string; value: string }>;
}

export interface RippleCart {
  id: string | null;
  totalQuantity: number;
  checkoutUrl: string;
  /** `""` when there is no note. */
  note: string;
  subtotal: RippleMoney;
  total: RippleMoney;
  discountCodes: Array<{ code: string; applicable: boolean }>;
  lines: RippleLine[];
}

export interface RippleMenuItem {
  /** List key only. */
  id: string;
  title: string;
  /** `null` for an item that only groups children. */
  url: string | null;
  /** True when `url` is the URL of the page being rendered; computed by the server. */
  current: boolean;
  /** Empty array when the item has no children. Components read three levels. */
  items: RippleMenuItem[];
}

export interface RippleMenu { id: string; items: RippleMenuItem[] }

export interface RippleShop {
  name: string;
  /** Home URL, for example "/" or "/fr-ca". */
  url: string;
  logo: RippleImage | null;
}
```

The further types that D-094 item 1 assigns to this document:

```ts
/** One image of a product gallery. V1: images only. */
export interface RippleMedia { id: string; image: RippleImage }

/** Swatch data after mapping: used by filter values and by picker values. */
export interface RippleSwatch { color: string | null; image: RippleImage | null }

/** One value of a product option, in the Storefront API nesting (`swatch.image.previewImage`). */
export interface RippleProductOptionValue {
  name: string;
  swatch: { color: string | null; image: { previewImage: RippleImage | null } | null } | null;
}

/** One product option with its values. */
export interface RippleProductOption { name: string; optionValues: RippleProductOptionValue[] }

/** The product page shape: what ProductForm, VariantPicker and ProductGallery read. */
export interface RippleProductDetail extends RippleProduct {
  options: RippleProductOption[];
  /** The variant selected by the URL, or the first available one; `null` when the product has no variant. */
  selectedOrFirstAvailableVariant: RippleVariant | null;
  /** Variants that differ from the selected one by one option value. */
  adjacentVariants: RippleVariant[];
  /** Nodes without an image are dropped by the host. */
  media: RippleMedia[];
  /** The product description as HTML (`descriptionHtml`; Liquid `product.description`); `""` when empty. Read by the `product` blueprint, printed with RichText. */
  descriptionHtml: string;
}

/** One value of a picker option: the OUTPUT of `variantPickerOptions` (doc 11, VariantPicker). */
export interface RippleVariantOptionValue {
  name: string;
  selected: boolean;
  /** False when no variant has this value together with the other selected values. */
  exists: boolean;
  available: boolean;
  /** `null` when `exists` is false. */
  url: string | null;
  /** `null` when `exists` is false. */
  variantId: string | null;
  swatch: RippleSwatch | null;
}

/** One picker option with its values: the OUTPUT of `variantPickerOptions`. */
export interface RippleVariantOption {
  name: string;
  selectedValue: string | null;
  values: RippleVariantOptionValue[];
}

export interface RippleFilterValue {
  label: string;
  /** URL parameter name, for example "filter.v.availability". */
  name: string;
  /** URL parameter value, for example "1". */
  value: string;
  count: number;
  active: boolean;
  swatch: RippleSwatch | null;
}

export interface RippleFilter {
  label: string;
  type: "list" | "price_range";
  /** Empty for `price_range`. */
  values: RippleFilterValue[];
  /** `null` for `list`. A member with the value `""` means "not set". */
  price: { minName: string; maxName: string; min: string; max: string; rangeMax: string } | null;
  /** URL that removes every value of this filter. */
  removeUrl: string;
}

/** One active-filter chip of FilterChips. */
export interface RippleFilterChip { label: string; url: string }

/** One option of SortSelect. */
export interface RippleSortOption { value: string; label: string }

/** Aliases: the card components take the base resource types. */
export type RippleProductCard = RippleProduct;
export type RippleCollectionCard = RippleCollection;
export type RippleArticleCard = RippleArticle;
```

Notes on names:

1. `RippleProductCard`, `RippleCollectionCard` and `RippleArticleCard` are aliases of `RippleProduct`, `RippleCollection` and `RippleArticle`. The GraphQL fragments with the same names in doc 11 section 0.6 are the Storefront API selections that a host MAPS to these types (`price` from `priceRange.minVariantPrice`, `url` from the route templates); the fragment result itself does not satisfy the type.
2. There is no type named `RippleFilters`. `toRippleFilters` (doc 11, `filters.data.ts`) is a function that returns `RippleFilter[]`.
3. `RippleProductDetail` is the `product` prop type of VariantPicker (doc 11 reads `url`, `options`, `selectedOrFirstAvailableVariant`, `adjacentVariants` through the alias `VariantPickerProduct = Pick<RippleProductDetail, ...>` in `variant-picker.data.ts`) and is structurally assignable to ProductForm's `RippleProduct & { selectedOrFirstAvailableVariant?: RippleVariant | null }`.
4. The sort-param shape `Array<[string, string]>` (SortSelect prop `params`) has no name.

Which component reads which type, and the Liquid expression each Liquid binding reads:

| Prop | Read by | TSX type | Storefront API source | Liquid |
|---|---|---|---|---|
| `product` | ProductCard, ProductRecommendations (`products`), PredictiveSearch results | `RippleProduct` | `Product`: `id`, `title`, `handle`, `vendor`, `availableForSale`, `featuredImage`, `priceRange.minVariantPrice`, `compareAtPriceRange.minVariantPrice` | `product.id`, `.title`, `.handle`, `.url`, `.vendor`, `.available`, `.featured_image`, `.price`, `.compare_at_price` |
| `product` | ProductForm, VariantPicker; `product.media` for ProductGallery | `RippleProductDetail` | the fields above plus `options { name optionValues { name swatch { color image { previewImage } } } }`, `selectedOrFirstAvailableVariant`, `adjacentVariants`, `media.nodes` of type `MediaImage` (`id`, `image`), `descriptionHtml` | `product.options_with_values` (`option.name`, `.position`, `.selected_value`, `.values`; value: `.name`, `.selected`, `.available`, `.variant`, `.swatch`, `.product_url`), `product.selected_or_first_available_variant`, `product.has_only_default_variant`, `product.media` |
| `variant` | ProductForm, Price, AddToCartButton, ProductGallery | `RippleVariant` | `ProductVariant`: `id`, `title`, `availableForSale`, `price`, `compareAtPrice`, `image`, `selectedOptions` | `variant.id`, `.title`, `.available`, `.price`, `.compare_at_price`, `.image`; default `product.selected_or_first_available_variant` |
| `collection` | CollectionCard, FeaturedCollection | `RippleCollection` | `Collection`: `id`, `title`, `handle`, `image` | `collection.id`, `.title`, `.handle`, `.url`, `.image` |
| `article` | ArticleCard | `RippleArticle` | `Article`: `id`, `title`, `handle`, `excerpt`, `publishedAt`, `image`, `blog.handle` | `article.id`, `.title`, `.url`, `.excerpt`, `.published_at`, `.image` |
| `cart` | CartDrawer, CartLines, CartSummary, CartNote | `RippleCart` | `Cart`: `id`, `totalQuantity`, `checkoutUrl`, `note`, `cost.subtotalAmount`, `cost.totalAmount`, `discountCodes`, `lines.nodes` | `cart.item_count`, `cart.note`, `cart.items_subtotal_price`, `cart.total_price`, `cart.items`; applied discount codes: the unique titles of `cart.cart_level_discount_applications` where `type == 'discount_code'` and of every `item.line_level_discount_allocations[].discount_application` where `type == 'discount_code'` (D-120; code in `components/cart-summary.md` Host notes) |
| `line` | CartLine | `RippleLine` | `CartLine`: `id`, `quantity`, `merchandise.product.title`, `merchandise.title`, `merchandise.image`, `cost.totalAmount`, `cost.subtotalAmount`, `attributes` | `item.key`, `.quantity`, `.product.title`, `.variant.title`, `.url`, `.image`, `.final_line_price`, `.original_line_price`, `.properties` |
| `image` | Image and every card | `RippleImage` | `Image`: `url`, `altText`, `width`, `height` | image drop: `image_url` filter, `.alt`, `.width`, `.height` |
| `media` | ProductGallery | `RippleMedia[]` | `product.media.nodes` of type `MediaImage`: `id`, `image` | `product.media` where `media_type == 'image'`: `.id`, `.preview_image`, `.alt` |
| `price`, `compareAtPrice` | Price | `RippleMoney` | `MoneyV2` | a number of cents (money drop value) |
| `filters` (TSX only) | Filters, FilterGroup (`filter`), PriceRange | `RippleFilter[]` built by `toRippleFilters` | `Filter`: `id`, `label`, `type`, `values { id label count input swatch }` | `collection.filters` / `search.filters`: `filter.label`, `.type`, `.param_name`, `.values`, `.active_values`, `.url_to_remove`, `.min_value`, `.max_value`, `.range_max`; value: `.label`, `.value`, `.count`, `.active`, `.param_name`, `.url_to_remove`, `.swatch` |
| `chips` (TSX only) | FilterChips | `RippleFilterChip[]` built by `toFilterChips` | derived from `RippleFilter[]` | `filter.active_values`, `.url_to_remove` |
| `options` (TSX only) | SortSelect | `RippleSortOption[]` | none: the app supplies the list | `collection.sort_options` / `search.sort_options` |
| `menu` | Header, Footer, NavigationMenu, MobileNav, LinkList | `RippleMenu` built by `toRippleMenu` (doc 12 section 1.2) | `Menu`: `id`, `items`; `MenuItem`: `id`, `title`, `url`, `items` | a linklist drop: `menu.links`; `link.title`, `.url`, `.current`, `.links` |
| `shop` (TSX only) | Header, Footer, blueprints | `RippleShop` | `shop.name`; `shop.brand.logo.image { url altText width height }` (UNVERIFIED); `url` from `requestContext.locale.pathPrefix \|\| "/"` | no param: the files read the globals `shop.name`, `shop.brand.logo`, `routes.root_url` |

Rules:

1. The compare-at total of a line is `cost.subtotalAmount` when its amount is greater than `cost.totalAmount`, otherwise `null`. `cost.compareAtAmountPerQuantity` is NOT used (D-049 as amended; mapping code in doc 11, `toRippleLine`).
2. CartLink takes `count` (a number), not a `cart` object. DiscountCode takes no resource (the applied codes are printed by CartSummary). The props of each component are owned by doc 11.
3. Fixture resource values (`product.basic`, `cart.two-lines` and the like) are owned by doc 11 section 0.5 and doc 12 section 1.6, and implemented in `src/testing/resources.ts` (doc 13) with the shapes of this section (D-074 item 6).

### 11.2 Money

- No element formats money. Money text is printed by the server and replaced only by region refresh (D-049).
- TSX servers: `formatMoney(money, { locale }).localizedString` from `@shopify/hydrogen` (`hydrogen/packages/hydrogen/src/core/money/format.ts`); `locale` is a BCP 47 tag such as `en-US`. A price range: `formatMoney([min, max], { locale })`; the returned object converts to a string in a template literal.
- Liquid: components call the `money` filter directly (`{{ price | money }}`); there is no money snippet (D-049 as amended).
- `html` host: the text is written by hand or by the server's own template.
- React (D-045 item 2): money for server-known lines comes from the server-formatted strings passed as props or from `formatMoney` over store data on the hydrogen backend. Client and server MUST pass the same `locale`. `locale` (a BCP 47 string, default `"en-US"`) is an ordinary prop of the TSX commerce components (D-094 item 4).
- `formatMoney` is one of the seven pure functions a TSX binding or `.data.ts` file may value-import from `@shopify/hydrogen` (section 13).
- Fixtures mask money text (D-049).

### 11.3 Images

File `src/image.ts`, exported from `<pkg>` (no side effects):

```ts
const SHOPIFY_IMAGE_HOSTS: ReadonlySet<string> = new Set(["cdn.shopify.com", "mock.shop"]);

export interface ImageUrlOptions {
  width?: number;
  height?: number;
  crop?: "center" | "top" | "bottom" | "left" | "right";
}

/** Adds Shopify CDN size parameters. Returns `src` unchanged for other hosts and for unparsable URLs. */
export function imageUrl(src: string, options: ImageUrlOptions = {}): string {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }
  if (!SHOPIFY_IMAGE_HOSTS.has(url.hostname)) return src;
  if (options.width !== undefined) url.searchParams.set("width", String(Math.round(options.width)));
  if (options.height !== undefined) url.searchParams.set("height", String(Math.round(options.height)));
  if (options.crop !== undefined) url.searchParams.set("crop", options.crop);
  return url.href;
}

/** `srcset` value with one width descriptor per entry, in the given order. */
export function imageSrcSet(src: string, widths: readonly number[]): string {
  return widths.map((width) => `${imageUrl(src, { width })} ${width}w`).join(", ");
}
```

- The host allowlist and the use of `URL.searchParams` follow `hydrogen/packages/hydrogen/skills/hydrogen-image/SKILL.md`. The accepted `crop` values are the Shopify CDN's; UNVERIFIED against that skill for values other than `center`.
- The Image component ([09-components-foundation.md](09-components-foundation.md), `## Image`) takes ONE required `image` object of type `RippleImage` (`url`, `altText`, `width`, `height`); `alt`, `width` and `height` are derived from it and are always printed, `alt` even when empty (D-049 as amended). `width` and `height` are the intrinsic dimensions (aspect ratio), not the requested size. Bindings of other components embed Image and MUST NOT build image URLs themselves.
- Widths are fixed by doc 09: `src` is `imageUrl(image.url, { width: 800 })`; `srcset` is `imageSrcSet(image.url, [200, 400, 600, 800, 1200, 1600])`.
- Liquid: `{{ image | image_url: width: 800 }}` and one `image_url` call per width for `srcset`.
- Fixtures mask `src` and `srcset` (D-049).

## 12. Analytics and consent

### 12.1 Consent, page views, cart events

1. There is no consent banner component (D-051). hydrogen backend: the platform banner is loaded by the script tags of 10.1 with `consent: { mode: "default-banner" }` (or `"no-banner"`); the client calls `initializeShopifyScripts` once, in `afterReady`, REGARDLESS of `options.analytics` (D-130; change 18 of section 1). The call is more than analytics: it assigns `Shopify.routes.match / resolve / navigate` from `routes` and `navigate`, starts Hydrogen's page-view events and loads the WebMCP tools (`hydrogen/packages/hydrogen/src/core/shopify-scripts/initialize.ts`, `global.ts`); Hydrogen's routing skill requires the same route templates on the server and in this call. Liquid: the platform handles consent and routing; Ripple calls nothing. Code of the hydrogen `afterReady` (complete; replaces the spike's):

   ```ts
   afterReady(commerce) {
     window.Shopify?.actions?.openCart?.configure({ handler: async () => commerce.openCart() });
     document.addEventListener("click", onCheckoutClick); // 5.1 step 5
     try {
       void initializeShopifyScripts({
         consent: { mode: options.consent },
         routes: options.routes,
         // Read at call time: `navigate` may be set by configureCommerce after the start (4.4).
         navigate: (url) => {
           const navigate = getOptions()?.navigate;
           if (navigate) return void navigate(url, { replace: false });
           window.location.assign(url);
         },
       });
     } catch (error) {
       console.error("[ripple] Shopify scripts not initialised.", error);
     }
     if (!options.analytics || !window.Shopify?.analytics) return;
     try {
       trackCartAnalytics(cart);
       defineViewEvent();
     } catch (error) {
       console.error("[ripple] analytics not started.", error);
     }
   },
   ```

   `getOptions` is imported from `./adapter`. An app MUST NOT call `initializeShopifyScripts` itself: Ripple owns the call (a second call overwrites `Shopify.routes`).
2. Page views.
   - hydrogen backend: published by `initializeShopifyScripts`, also when `options.analytics` is `false` (item 1; it calls Hydrogen's page-view initialiser; `hydrogen/packages/hydrogen/src/core/shopify-scripts/initialize.ts`).
   - Liquid (D-089 item 6): the Liquid adapter dispatches ONE `PageViewEvent` from `@shopify/standard-events` per document load when `options.analytics` is true. Target: `document`. Payload: `page: { template, title: document.title, url: location.href }`, where `template` is `document.querySelector("main[data-template]")?.dataset.template ?? ""` (the layout prints `<main id="main" data-template="{{ request.page_type }}">`). Timing: at `DOMContentLoaded`, or immediately when the document is already parsed. Code: 12.3. This is a port of `ripple/theme/assets/page-view-event.js` and `ripple/theme/assets/page-view-event-init.js`; the Ripple theme contains no page-view asset (D-039). UNVERIFIED: whether the platform also publishes a page view by itself (SPIKE-01); when it does, the adapter's dispatch is removed.
3. Cart events: hydrogen backend: `trackCartAnalytics(cart)` once, in `afterReady` (`hydrogen/packages/hydrogen/src/core/analytics/cart-tracker.ts`). Liquid: published by the platform through Standard Actions; `trackCartAnalytics` MUST NOT be called.
4. Cart events and `rp-view-event` start only when `options.analytics` is true and, on the hydrogen backend, `window.Shopify.analytics` exists. A thrown error is logged (`[ripple] analytics not started.` on the hydrogen backend; the message of 12.3 on Liquid) and does not change `usable`.

### 12.2 `rp-view-event`

View events (product, collection, search and cart viewed) are declared in markup with the infrastructure element `rp-view-event` (D-089).

| | |
|---|---|
| Tag | `rp-view-event`. An infrastructure element, not a component: no class, no `data-slot`, not built on the kernel, no agent actions, no Ripple event. Listed in the manifest key `elements` as `{ "display": "block", "chunk": "main", "commerce": true }`; the generated display region of `base.css` therefore contains `rp-view-event { display: block; }` ([03-styling-and-tokens.md](03-styling-and-tokens.md)). The closed tag lists of docs 02 and 04 and the JSX intrinsic types (`src/react/jsx.generated.ts`, `src/remix/jsx.generated.ts`) include it. |
| Attributes | `view-event-trigger`: `connect` or `intersect`; blueprints use `connect` only in V1 and always print it. `view-event-payload`: the payload JSON as an attribute. The names are fixed by `@shopify/standard-events` and are not `data-` attributes (ledger section 4.4). |
| Child form | `<script type="application/json" data-view-event-payload>` holding the payload JSON, instead of the attribute. |
| Where | Printed only by the `product`, `collection`, `search` (only when search terms exist) and `cart` blueprints ([12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md)). No component prints it: not ProductForm, not CartDrawer. |
| Which form | Attribute form for the product, collection and search views. Child-script form for the cart view, because the payload is large. The same form in every host for the same view. |
| Not in V1 | Per-card impression events (`view-event-trigger="intersect"` around each product card) and a cart view inside the CartDrawer (D-089 item 7). |
| Fixtures | The payload is masked as a whole: `{ "select": "rp-view-event", "op": "attr", "name": "view-event-payload" }` for the attribute form; a `text` mask on the child script for the cart view. |
| No-JS | Nothing is sent. |

Attribute form (product view). Liquid, where the payload is ALWAYS the output of the `standard_event_data` filter, escaped (hand-built JSON on Liquid is prohibited):

```liquid
<rp-view-event view-event-trigger="connect" view-event-payload="{{ product | standard_event_data: 'view', context: 'page' | escape }}"></rp-view-event>
```

The same view on the hydrogen backend (`html` host; the attribute value is the JSON `{ "event": ..., "payload": ... }`, HTML-escaped):

```html
<rp-view-event view-event-trigger="connect" view-event-payload="{&quot;event&quot;:&quot;product_viewed&quot;,&quot;payload&quot;:{&quot;products&quot;:[{&quot;id&quot;:&quot;gid://shopify/Product/1&quot;,&quot;title&quot;:&quot;Linen Shirt&quot;,&quot;price&quot;:&quot;48.0&quot;,&quot;vendor&quot;:&quot;Acme&quot;,&quot;variantId&quot;:&quot;gid://shopify/ProductVariant/11&quot;,&quot;variantTitle&quot;:&quot;Default Title&quot;,&quot;quantity&quot;:1}]}}"></rp-view-event>
```

TSX hosts pass the JSON text as the attribute value and let the renderer escape it: `<rp-view-event view-event-trigger="connect" view-event-payload={viewEvent} />`.

Child-script form (cart view). Liquid, where the filter output is printed UNESCAPED inside the script (the filter encodes the less-than character itself; `ripple/theme/templates/cart.liquid`):

```liquid
<rp-view-event view-event-trigger="connect">
  <script type="application/json" data-view-event-payload>{{ cart | standard_event_data: 'view', context: 'page' }}</script>
</rp-view-event>
```

The same view on the hydrogen backend; `cart` is the `data.cart` object of the server cart read (10.1 rule 3), serialised with `JSON.stringify(value).replace(/</g, "\\u003c")`:

```html
<rp-view-event view-event-trigger="connect">
  <script type="application/json" data-view-event-payload>{"event":"cart_viewed","payload":{"cart":{"id":"gid://shopify/Cart/c1","totalQuantity":3}}}</script>
</rp-view-event>
```

(The example shows two of the cart's fields; the real payload carries the whole `data.cart` object.)

Filter arguments on Liquid, as the base theme prints them: product `{{ product | standard_event_data: 'view', context: 'page' | escape }}`; collection `{{ collection | standard_event_data: 'view' | escape }}` (no `context`: the base theme passes none, and the Liquid reference says the `context` parameter is ignored for collections); cart `{{ cart | standard_event_data: 'view', context: 'page' }}`. The search view expression is owned by doc 12 (`search` blueprint). `standard_event_data` is in the blueprint scope of the Liquid subset (D-097).

Payloads on the hydrogen backend, `{ "event": <name>, "payload": <object> }` (shapes from `hydrogen/packages/hydrogen/src/core/analytics/`):

| View | `event` | `payload` |
|---|---|---|
| product | `product_viewed` | `{ products: [{ id, title, price, vendor, variantId, variantTitle, quantity, sku?, productType? }] }` |
| collection | `collection_viewed` | `{ collection: { id, handle } }` |
| search | `search_viewed` | `{ searchTerm, searchResults? }` |
| cart | `cart_viewed` | `{ cart }` |

Definition per backend (D-089 item 5):

| Backend | Where | Behaviour |
|---|---|---|
| hydrogen | `adapter-hydrogen.ts`, function `defineViewEvent()` (the spike's function with change 14 of section 1: the class below), called in `afterReady` when analytics starts | A plain `HTMLElement` subclass. On connect (`connect`) or first intersection (`intersect`) it reads `view-event-payload`, or else the text of the child `script[type="application/json"][data-view-event-payload]`, parses `{ event, payload }` and calls `window.Shopify.analytics.publish(event, payload)` once per PAYLOAD VALUE (D-123): the element observes `view-event-payload`, and when the attribute changes to a value that differs from the last published one while the element is connected, it publishes again (trigger `connect`) or re-arms its IntersectionObserver (trigger `intersect`). This is what makes client-side navigation work on the `remix` and `react` hosts, where the unkeyed element is REUSED between two pages and only its attribute is rewritten. Invalid JSON: `console.error("[ripple] rp-view-event: invalid payload.", error)`. |
| liquid | `adapter-liquid.ts`, function `startStandardEvents()` (12.3) | `customElements.define("rp-view-event", createViewEventElement())` with `createViewEventElement` from `@shopify/standard-events` (types: `hydrogen/packages/hydrogen/vendor/standard-events.d.ts`; that API also supports the triggers `dialog` and `manual`, which Ripple does not use). |

The hydrogen class, complete (replaces the class body of the spike's `defineViewEvent`; D-123):

```ts
class extends HTMLElement {
  static observedAttributes = ["view-event-payload"];
  #published: string | null = null; // the raw payload text last published; null before the first publish
  #observer: IntersectionObserver | null = null;

  connectedCallback(): void {
    this.#arm();
  }

  disconnectedCallback(): void {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  // Runs when a host (Remix morph, React re-render) rewrites the attribute on the reused element.
  // It also runs once at upgrade, before connectedCallback: #published is null then and nothing happens.
  attributeChangedCallback(_name: string, _old: string | null, value: string | null): void {
    if (!this.isConnected || this.#published === null || value === null || value === this.#published) return;
    this.#arm();
  }

  #raw(): string {
    return (
      this.getAttribute("view-event-payload") ??
      this.querySelector('script[type="application/json"][data-view-event-payload]')?.textContent ??
      ""
    );
  }

  #arm(): void {
    this.#observer?.disconnect();
    this.#observer = null;
    if (this.#raw() === this.#published) return;
    if (this.getAttribute("view-event-trigger") !== "intersect" || !("IntersectionObserver" in window)) {
      this.dispatchViewEvent();
      return;
    }
    this.#observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) this.dispatchViewEvent();
    });
    this.#observer.observe(this);
  }

  dispatchViewEvent(): void {
    const raw = this.#raw();
    if (raw === this.#published) return;
    this.#published = raw;
    this.#observer?.disconnect();
    try {
      const { event, payload } = JSON.parse(raw) as { event: AnalyticsEventName; payload: never };
      window.Shopify?.analytics?.publish(event, payload);
    } catch (error) {
      console.error("[ripple] rp-view-event: invalid payload.", error);
    }
  }
}
```

The child-script form (cart view) is read at connect only: a changed child script does not re-publish (there is no client-side navigation from one cart page to another). The rule "no commerce element observes attributes" (section 7) does not cover `rp-view-event`, which is an infrastructure element. On Liquid the element is the platform's (`createViewEventElement()`), and every navigation is a document load, so the question does not arise.

UNVERIFIED (SPIKE-01, preview store): that `createViewEventElement()` accepts this markup under the tag name `rp-view-event` (the base theme registers it as `s-view-event`), and that the element dispatches for the output of `standard_event_data`. Neither backend implementation of `rp-view-event` was run.

### 12.3 Liquid: `startStandardEvents`

`adapter-liquid.ts` exports `startStandardEvents`. It replaces the spike's `defineViewEvent`; `afterReady` of the Liquid adapter then only configures `openCart`. `create()` in `index.ts` calls it BEFORE the feature tests of 4.5 step 3, so that view events and the page view do not depend on the cart runtime:

```ts
// index.ts
function create(): RippleCommerce {
  const options = resolveOptions();
  if (options.backend === "liquid" && options.analytics) void startStandardEvents();
  if (typeof AbortSignal.any !== "function" || typeof crypto?.randomUUID !== "function") {
    return createInertCommerce(options);
  }
  return options.backend === "liquid" ? createLiquidCommerce(options) : createHydrogenCommerce(options);
}
```

```ts
// adapter-liquid.ts
let standardEventsStarted = false;

/** Liquid only: defines `rp-view-event` and dispatches the one page view of this document load (D-089). */
export async function startStandardEvents(): Promise<void> {
  if (standardEventsStarted) return;
  standardEventsStarted = true;
  try {
    // @ts-expect-error platform-provided specifier, resolved by the storefront (D-046)
    const { createViewEventElement, PageViewEvent } = await import("@shopify/standard-events");
    if (!customElements.get("rp-view-event")) {
      customElements.define("rp-view-event", createViewEventElement());
    }
    const dispatchPageView = (): void => {
      const template = document.querySelector<HTMLElement>("main[data-template]")?.dataset.template ?? "";
      document.dispatchEvent(
        new PageViewEvent({ page: { template, title: document.title, url: location.href } }),
      );
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", dispatchPageView, { once: true });
    } else {
      dispatchPageView();
    }
  } catch (error) {
    console.error("[ripple] Standard Events not available; view events and the page view are not sent.", error);
  }
}
```

Rules:

1. Exactly one page view per document load: the module flag makes a second call a no-op. A region refresh or a `pushState` from `rp-live` dispatches no page view.
2. With `"analytics": false` in the config element, `rp-view-event` stays undefined and no page view is dispatched.
3. The event class and its constructor argument were read in `hydrogen/packages/hydrogen/vendor/standard-events.d.ts` (`new PageViewEvent(payload: PageViewPayload)`, event name `shopify:page:view`). Dispatching it on `document` follows the base theme. Not run.

## 13. Checker rules

Rule ids, severity, layer and detection are owned by [07-manifest-registry-cli.md](07-manifest-registry-cli.md) (D-059, D-102). This document states what MUST be checkable and names the rule that checks it. Layer H is rendered HTML, layer S is source.

| Check | Layer | Rule |
|---|---|---|
| Every `data-rp-field` value is one of the six values of 6.2. | H | RP305 |
| An `rp-product-form` contains exactly one form with `[data-rp-field="merchandise-id"]` and one `[data-rp-part="submit"]`. | H | RP305 (required field), RP113 (structure) |
| In a hydrogen cart line form, the first `button[type="submit"]` is `name="intent" value="set" hidden`. | H | RP305 |
| In a Liquid cart form, the first submit button is `name="update"`, and the number of `[name="updates[]"]` controls equals the number of `[data-rp-line]` elements. | H | RP305 |
| Every `data-rp-refresh` name has a `[data-rp-region="<name>"]` element in the document (warning). | H | RP308 |
| No `[data-rp-region]` element contains an `rp-cart` whose `data-rp-refresh` names that region. This containment check applies to `rp-cart` only; an `rp-live` root MAY sit inside a region it refreshes (D-047, D-102). | H | RP308 |
| No `<dialog>` is a descendant of, or the same element as, a `[data-rp-region]` root. | H | RP308 |
| No two `[data-rp-region]` elements in one document have the same name. | H | RP308 |
| A document with a commerce element (a tag with `commerce: true` in the manifest key `elements`) has an `#rp-commerce` element or a `configureCommerce(` call. At most one `#rp-commerce` element; it is `script[type="application/json"]` and its body parses as JSON. | H | RP309 |
| Liquid theme: no `Shopify.actions.updateCart.configure` call outside `assets/ripple*.js` and none of the two base-theme files of 10.4. | S | RP307 |
| Inside the Ripple repository, under `src/`: no value import of `@shopify/hydrogen` outside `src/commerce/adapter-hydrogen.ts` and `src/commerce/adapter-liquid.ts`. | S | import-boundary lint of `01-architecture.md` section 8 (not a checker rule) |
| Scaffolded TSX bindings and `.data.ts` files (in the repository: `registry/`; in a project: files under `paths.components` and `paths.pages`): the only value imports from `@shopify/hydrogen` are these seven functions (D-094 item 3): `formatMoney`, `renderShopPayButton`, `buildProductSelectionSearchParams`, `parseCollectionParams`, `serializeCollectionParams`, `isFilterInputActive`, `getFilterRemovalUrl`. Type-only imports are allowed. A namespace or default import is reported. | S | RP117 item (b) in a project; the import-boundary lint in the repository |
| A scaffolded binding does not import `<pkg>/commerce` or `<pkg>/elements` (6.1). | S | RP117 item (c) |

Not checkable, documented only (D-128): a cart form that prints some but not all keys of `cart.attributes` loses the missing keys on an `attributes-update` with JavaScript (6.2). The checker cannot know the cart's keys statically; there is no rule.

## 14. Acceptance tests

Tiers are those of D-063. "Spike" names the scenario in `ripple/docs/research/spikes/commerce/` that already passes; the test in `test/commerce/` MUST assert the same observations. Tests marked E run against the Standard Actions emulation `fake-sa.js`; tests marked M run against mock.shop (tier 7); tests marked P need the preview store (tier 8).

| Id | Tier | Assertion | Spike |
|---|---|---|---|
| C-01 | 5 E | Liquid start: `updateCart.configure` called once, `getCart` once, `openCart.configure` once; `getCommerce().usable === true`; count part shows the cart quantity; `customElements.get(tag)` is defined for each of `rp-cart`, `rp-product-form`, `rp-live`, `rp-predictive-search`, `rp-recommendations`, and for `rp-view-event` (config `analytics` is `true`). | L1 |
| C-02 | 5 E | Liquid add: one `updateCart` call with `lines[0] = { merchandiseId, quantity, sellingPlanId, attributes }`; root has `data-pending` and `aria-busy="true"` during the call and neither after; `action` event detail equals `{ value: "add", reason: "submit", merchandiseId, quantity }`; `#cart-drawer` is open; the `added` string from the config element is the text of the CartDrawer's `[data-rp-part="status"]` (7.1), written after the drawer opened; one `rp:refresh` with `reason: "cart"`; `partials.fetch` called with the declared regions. | L2 |
| C-03 | 5 E | Liquid quantity: no call before 250 ms; then `{ lines: [{ id: <item.key>, quantity: 5 }] }`; status text `Cart updated`. Remove link: quantity 0, status `Item removed`, no navigation. Enter in a quantity input: one `set`. Discount form: `{ discountCodes: ["SAVE10"] }`. | L3 |
| C-04 | 5 E | `userErrors` on a line: the line's error part shows the message without `hidden`; the cart-scope part stays hidden; no success announcement. | L4 |
| C-05 | 5 E | `updateCart` configured by another script before `ripple.js`: `usable === false` after `ready`; a cart form submit produces a native POST. Separate case (D-122), `updateCart.isDefault()` is `false` when `window.rpDomReady` resolves: `usable === false` after `ready`, the commerce elements ARE defined, forms post natively (not run in the spike). Third case (D-122): a classic inline script placed AFTER `rp-head` (the position of `content_for_header`) that calls `updateCart.configure` in its own `DOMContentLoaded` listener LOSES: its `configure` returns `false` and `getCommerce().usable === true`. Fourth case (D-129): with `usable === false`, submitting a discount form (`data-rp-js="inflow"`) produces NO navigation and no request, and the form's error part shows `Something went wrong. Try again.` (not run in the spike). | L5, L6 |
| C-06 | 5 E | `partials.fetch` rejects after a cart mutation: the page reloads. | L7 |
| C-07 | 5 E | A submitter without `data-rp-part="submit"` in a product form, and a `name="checkout"` submitter in a cart form, produce a native POST with the Liquid field names. | D2, D3 |
| C-08 | 5 E | Note `change`: one `updateCart` call with `{ note }`. | D4 |
| C-09 | 5, 7 M | hydrogen add: `POST /api/cart` with a JSON body, then one `GET` of the current document, regions replaced; with no `#cart-drawer` the browser navigates to `/cart`. | H1 |
| C-10 | 5, 7 M | hydrogen quantity change and remove: `POST /api/cart` bodies `{ lines: [{ id, quantity }] }`; focus is on the same line's quantity input after the refresh; at quantity 0 the count part is `hidden`. | H2 |
| C-11 | 5 | Seeded `initialCart`: zero `GET /api/cart` requests; `cart.getState().loading === false`. | H3 |
| C-12 | 5 | hydrogen backend without the Standard Actions script: `usable === false` after `ready`. | H6 |
| C-13 | 5 | `rp-live`: sort `change` pushes one history entry and replaces `rp-collection-results`; a variant link replaces the URL without a new entry and replaces `rp-product-buy`; Back reloads. | H4 |
| C-14 | 5 | `rp-predictive-search`: one request 200 ms after typing; panel shown; status text announced; ArrowDown moves input to first link to second link; Escape hides the panel and focuses the input; URL unchanged. | H5 |
| C-15 | 5 | `rp-recommendations`: one request when scrolled within 400 px; region replaced; a failing request leaves the URL unchanged. | H7 |
| C-16 | 3 | Upgrade stability for every commerce fixture: every mutation inside a component root matches an `upgradeAllow` entry of that component in the manifest (D-071; the writes are listed in section 7). | not run |
| C-17 | 6 | No-JS, hydrogen backend (mock.shop): add, set quantity with the Update button, remove, note, discount apply, checkout link each complete with scripting disabled. | not run |
| C-18 | 6 | No-JS, Liquid shim: the rendered forms have the field names of 10.5 and `[data-rp-js="inflow"]` on both discount forms. | not run |
| C-19 | 9 | C-02, C-03, C-09, C-13, C-14 in WebKit and Gecko. | not run |
| C-20 | 10 | `ripple.js` (kernel, elements and commerce layer together) and the Liquid build `registry/liquid/assets/ripple.js` are each at most 45 kB gzip level 9 (D-064, `size-budget.json`). Measured in the spike: the commerce layer alone, including the `@shopify/hydrogen` cart and analytics code, is 22.5 kB. The size of the complete file is UNVERIFIED until it is built. | commerce layer measured |
| C-21 | 8 P | SPIKE-01 checklist (section 16). | blocked |
| C-22 | 1 | `imageUrl("https://cdn.shopify.com/a.jpg", { width: 400 })` ends with `?width=400`; `imageUrl("https://example.com/a.jpg", { width: 400 })` returns the input; `imageSrcSet(src, [200, 400])` has two comma-separated entries ending `200w` and `400w`. | unit |
| C-23 | 4 | React: hydrating a page with CartLink and CartLines with either script order logs no hydration error. | not run |
| C-24 | 1 | Types: every Storefront API field name and Liquid expression in the tables of 11.1 that is marked UNVERIFIED there was looked up with the Shopify docs tool; the test file lists each name with the documentation page that defines it. `tsc` compiles a fixture that assigns a Storefront API response type to each `Ripple*` type through the `.data.ts` mappers. | not run |
| C-25 | 5 | `remix` host, no `reloadFrames`, no `navigate`: a cart mutation and a sort `change` each produce one `GET` of the document and replace the regions; `location.assign` and `location.reload` are not called (same observations as C-09 and C-13). | not run (SPIKE-10) |
| C-26 | 5 | `remix` host with stub callbacks: reason `cart` calls `reloadFrames(regions, null)` once and performs no document fetch; reasons `variant` and `filter` call `navigate(url, { replace })` once with `replace === true` only for `variant`, and `rp-live` makes no `history.pushState` or `replaceState` call; reasons `predictive` and `recommendations` call neither callback and fetch the document; a rejecting `reloadFrames` falls back to the 8.2 failure handling. | not run (SPIKE-11 for a real Remix app) |
| C-27 | 5 | `react` host: reason `predictive` fetches the document at `url` once and `getRegionHtml("rp-predictive-results")` returns the `innerHTML` of that region in the response; a subscriber registered with `subscribeRegionHtml("rp-predictive-results", fn)` is called once; a failing fetch leaves `getRegionHtml` unchanged and the URL unchanged; reason `cart` with `url: null` makes no request; reason `filter` calls `navigate` when configured and `location.assign(url)` otherwise. | not run (SPIKE-10) |
| C-28 | 4 | React: a component that renders `useRegionHtml("rp-predictive-results")` hydrates without a hydration error and shows the fetched results after typing. | not run (SPIKE-10) |
| C-29 | 5 E | Liquid page view: exactly one page view per document load, counted as the `["pageView", init]` entries of `window.__log` (`13-testing.md` ST-6; the test never listens for the event type, D-134 item 26), with `page.template` equal to `main[data-template]`'s `data-template` value, `page.title === document.title`, `page.url === location.href`; a region refresh and a `pushState` from `rp-live` add none. With `"analytics": false`: zero entries and `customElements.get("rp-view-event") === undefined`. | not run |
| C-30 | 5 E | `rp-view-event`: the product, collection, search and cart blueprints each print exactly one; no component fixture prints one; the element has computed `display: block`; the attribute form carries `view-event-payload` and the cart view carries one child `script[type="application/json"][data-view-event-payload]` (12.2). | not run |
| C-31 | 5 | Agent: for each commerce element, the snapshot of `08-agent-kit-and-evals.md` section 7.2 lists exactly the actions of the element's Agent row in section 7; no element lists an action named `checkout`; `rp-recommendations` is not shown. | not run |
| C-32 | 1 | `DEFAULT_STRINGS` in `src/commerce/adapter.ts` has exactly the seven keys of 4.3 and each value equals the value of the matching locale key (4.3) in the repository file `locales/en.default.json`. | not run |
| C-34 | 5 | hydrogen host, checkout guard (D-117): type a new quantity into a cart line, then click `a.rp-checkout-button` within 100 ms: exactly one `POST /api/cart` carrying the new quantity completes BEFORE the navigation to the checkout URL starts. Same with a changed note (`note-update` completes first). With nothing changed, the click navigates without any `POST`. A Ctrl/Meta click is never prevented. | not run |
| C-35 | 2, 5 | Locale prefix (D-118): for a request to `/fr-ca/cart` and to `/fr-ca/products/<handle>` on a hydrogen host (the `react` and `remix` examples, `13-testing.md` 12.1 item 3), the config element has `"cartEndpoint":"/fr-ca/api/cart"`, EVERY `form[method="post"]` inside an `rp-cart` or `rp-product-form` root has `action="/fr-ca/api/cart"`, and the store's first read is `GET /fr-ca/api/cart` (when not seeded). For a request without a prefix all three are `/api/cart`. | not run |
| C-36 | 5 E | Add with a line-keyed message (D-119): the variant is already in the cart and `[data-rp-line]` for it is rendered in the closed CartDrawer. (a) `updateCart` answers with a `userErrors` entry whose field targets that line: the PRODUCT FORM error part shows the API message (not `Something went wrong. Try again.`), no `action` event, the cart stays closed. (b) `updateCart` answers with only a `warnings` entry targeting that line: the product form error part shows the warning text, `action` IS dispatched, the cart opens, and `Added to cart` is not announced. | not run |
| C-37 | 5 | `rp-view-event` re-publish (D-123), hydrogen backend, with a stub `window.Shopify.analytics.publish`: an element connected with payload A publishes once; `setAttribute("view-event-payload", B)` on the SAME element publishes exactly once more with B's event and payload; setting B again publishes nothing; removing and re-inserting the element with B publishes nothing more for that element instance (same value) while a NEW element with B publishes once. | not run |
| C-33 | 5 | hydrogen host, JavaScript on (D-116): clear a cart line's quantity input and press Enter (the test removes the `required` attribute first, so that the script guard and not native validation is under test): zero `POST /api/cart` requests, the line stays in the DOM, the status part stays empty. Second case with `required` in place: same observations. | not run |
| C-38 | 5 E | Liquid note baseline (D-126), emulated Standard Actions: the cart renders with note `""`. Type `gift` and blur: one `updateCart` call with `{"note":"gift"}`. Clear the field and blur: one more call with `{"note":""}`. Then change a line quantity through the Update button path (`form.requestSubmit(<submit part>)`): the calls made carry NO `note`. A cart-form submit with nothing changed makes no call and the status part stays empty. | not run |
| C-39 | 5 | hydrogen host (D-127): `document.querySelector("rp-product-form form").requestSubmit()` (no argument) produces exactly one `POST /api/cart` whose body adds the form's `merchandiseId` with its quantity; the `action` event fires; the error part stays hidden. | not run |

## 15. Evidence and UNVERIFIED

Evidence (paths relative to the local clones root):

- `hydrogen/packages/hydrogen/src/core/cart/` (`cart.ts`, `actions.ts`, `form.ts`, `server-handlers.ts`, `get-cart.ts`): store surface, intents, handler shape `{ get, post }`.
- `hydrogen/packages/hydrogen/src/core/shopify-scripts/` (`index.ts`, `initialize.ts`, `types.ts`): script tags, `initializeShopifyScripts`, consent modes.
- `hydrogen/packages/hydrogen/src/core/analytics/cart-tracker.ts`: `trackCartAnalytics(store)`.
- `hydrogen/packages/hydrogen/src/core/money/format.ts`: `formatMoney`.
- `hydrogen/packages/hydrogen/vendor/standard-actions.d.ts`, `vendor/standard-events.d.ts`: `updateCart.configure`, `isDefault`, `openCart.configure`, `createViewEventElement`.
- `hydrogen/packages/hydrogen/skills/hydrogen-request-handlers/SKILL.md`, `skills/hydrogen-image/SKILL.md`.
- `uisdk/packages/core/src/foundation/platform/announce.ts`: `announce(text, { priority?, doc? })`, used only through the wrapper `src/runtime/announcer.ts` (`announce(text, { from })`, D-079, `04-elements.md` section 3.5).
- `uisdk/packages/core/src/foundation/kernel/primitive-types.ts`, `primitive.ts`: `definePrimitive` keys and `bind(el, part)` (7.7).
- `ripple/theme/assets/page-view-event.js`, `ripple/theme/assets/page-view-event-init.js`: the base theme's page-view dispatch (12.1, 12.3).
- `ripple/docs/research/hydrogen-core.md`, `liquid-blocks-partials.md`, `remix-3.md`, `base-theme.md`.
- `ripple/docs/research/spikes/commerce/` (this document's spike).

UNVERIFIED:

1. The real Standard Actions runtime with Hydrogen's default handler (SPIKE-01). Everything Liquid in this document ran against `fake-sa.js`.
2. `@shopify/partial-rendering` on a preview store, including `partials.fetch` with a `url` for the search and product-recommendations routes (SPIKE-02, SPIKE-09 owned by doc 11).
3. The `html` strategy on the `remix` host (the default of D-090), including Back and Forward under Remix's own router (SPIKE-10).
4. The React strategy `refresh-react.ts` with the region-HTML store and `useRegionHtml`: hydration without a mismatch, and whether `rp:refreshed` (dispatched when the store is written) precedes or follows React's re-render (SPIKE-10). Code that needs the new DOM MUST NOT rely on `rp:refreshed` on the `react` host.
5. The opt-in Remix options: `reloadFrames(regions, null)` with named blocking `<Frame>`s and `app.frames.get(name)?.reload()`, and `navigate(url, { replace })` for reasons `variant` and `filter`; whether the morph keeps `rp-*` and `ui-*` state (SPIKE-11).
6. The tag name `rp-view-event` defined with `createViewEventElement()` from `@shopify/standard-events`: that the returned class can be registered under a name other than the base theme's, the attribute names `data-payload` and `data-triggers`, the child-script form, and the output shape of the Liquid `standard_event_data` filter. Read in `hydrogen/packages/hydrogen/vendor/standard-events.d.ts` and the base theme; not run.
7. The page-view question: whether the platform publishes `shopify:page:view` on a theme by itself. If it does, the adapter's dispatch (12.3) produces a duplicate and is removed (SPIKE-01).
8. `initializeShopifyScripts` and `trackCartAnalytics` at runtime; the Standard Events payload shape.
9. Controllers inside the `definePrimitive` shell of 7.7 (SPIKE-04); the spike used a plain `HTMLElement`. In particular `options: {}` and a primitive with no slots were not run.
10. WebKit and Gecko. In particular: implicit submission through a `hidden` first submit button (6.2) was exercised in Chromium only.
11. Storefront API and Liquid drop field names of 11.1 not read in source (see the verification paragraph of 11.1; C-24).
12. Behaviour of a native POST of the Liquid discount form when `usable` became false after start (assumed: the platform ignores the unknown field).
13. Exact required members of `ShopifyScriptTagsOptions` beyond `shop`, `i18n`, `consent`.
14. The size of the complete `ripple.js` against the 45 kB budget (C-20).

Differences with sibling documents that the closing pass settled (kept as a record; none is open):

| Document | Difference | Resolution |
|---|---|---|
| `11-components-commerce.md` | None open. `variant-picker.data.ts` imports `RippleProductDetail` and `RippleVariantOption` from `<pkg>`; chips and sort options are `RippleFilterChip[]` and `RippleSortOption[]`; there is no `RippleFilters` type. | Closed (D-110). |
| `12-components-chrome-and-blueprints.md` | None open. The product blueprint reads `product.descriptionHtml`; `RippleProductDetail` (11.1) has the field. | Closed (D-110). |
| `06-bindings.md` | None open. Section 6.2 prints the same `useRegionHtml` as 8.3 (`subscribeRegionHtml(name, listener)`). | Closed (D-110). |
| `00-decisions.md` D-087 item 2 | None open. The ledger now says the start is one microtask after the commerce module is evaluated (section 4.5). | Closed (D-087 as amended). |

## 16. Spikes owned by this document

### SPIKE-01 `liquid-standard-actions-runtime`

Default path (specified above): `adapter-liquid.ts` uses `createCartStore()` with no endpoint.

Procedure on the preview store (C-21). Load a product page and a cart page of the Ripple theme and record `Shopify.actions.updateCart` / `getCart` calls and network requests:

1. Start: `getCommerce().usable === true` after `await getCommerce().ready`; `cart.getState().data.totalQuantity` equals `{{ cart.item_count }}`.
   1a. Configure race (D-122): record whether `window.Shopify.actions.updateCart` exists inside the first `DOMContentLoaded` listener (a `console.log` added to the inline script of `rp-head`). Then add, in the position of `{{ content_for_header }}`, a classic inline script that calls `Shopify.actions.updateCart.configure(...)` in a `DOMContentLoaded` listener: its call MUST return `false` and step 1 MUST still pass. If `Shopify.actions` does not exist at that point, D-122 is wrong for the real platform: report it; the fallback is Hydrogen's own waiting (`cart.connect()` at `createLiquidCommerce`, the spike's order).
2. Add with quantity 2, a selling plan and one line property: the cart contains the line with all three.
3. Set a line to 5 using `data-rp-line="{{ item.key }}"` as the id: quantity is 5. This verifies that `item.key` is accepted as the line `id`.
4. Set a line to 0: the line is gone.
5. Note update, discount apply with a valid and an invalid code (the invalid code yields a message in `errors.discountCodes` or `errors.cart`), discount remove.
6. `Shopify.actions.openCart()` from the console opens `#cart-drawer`.
7. After each step the regions `rp-cart-lines` and `rp-cart-summary` show the new state without a navigation.
   7a. After each mutation `performance.getEntriesByType("navigation").length` is still `1` and a marker set on `window` before the mutation (`window.__rpNoReload = true`) is still present: the platform did not reload the page (D-121).
8. Page view: temporarily set `"analytics": false` in the config element (the adapter then dispatches nothing), load a page, and record `shopify:page:view` events on `document` with a listener installed by an inline script at the top of `<head>`. Zero events: the platform does not publish it; the default of 12.3 stays. One event: the platform publishes it.
9. With `analytics` back to `true`, load a product page: one product view is recorded for the `rp-view-event` of the product blueprint (observed in the Shopify analytics debugger or as the event the element dispatches).

Pass for the cart path: steps 1 to 7. Any failure there: apply the cart fallback. Step 8 selects the page-view fallback. A failure of step 9 leaves `rp-view-event` UNVERIFIED and blocks C-30 on the preview store only.

### Fallback (SPIKE-01)

Page view (step 8 recorded one event): delete the `dispatchPageView` function and the `if (document.readyState === "loading") ... else ...` block from `startStandardEvents` (12.3), and remove `PageViewEvent` from the destructured import; KEEP the `standardEventsStarted` flag and the `rp-view-event` definition. C-29 then asserts exactly one event with the adapter dispatching none. No sign-off needed.

Cart (any of steps 1 to 7 failed): needs Ben's sign-off (ledger section 10, Q10). Only `adapter-liquid.ts` changes; `dialect.ts`, the controllers and every other file stay as they are.

`adapter-liquid.ts` replaces `createCartStore()` with a local function `createActionsCartStore(): CartStore` that implements the same surface on `window.Shopify.actions` directly:

- `getState()` / `subscribe(listener)`: a state object with the `CartState` fields the controllers read: `data.totalQuantity`, `loading`, `revalidating`, `pending` (`lines: Set<string>`, `note`, `attributes`, `discountCodes: Set<string>`, `cost`), and `errors` with the groups and `*UpdatedAt` timestamps listed in `createInertCommerce` (`adapter.ts`).
- `fetch()` / `refresh()`: `const { cart } = await Shopify.actions.getCart()`; store `cart.totalQuantity`; `loading = false`.
- `handleFormSubmit(event)`: read `event.submitter.value` (intent) and `new FormData(event.target)`; map to one `Shopify.actions.updateCart(input)` call with the payloads of 6.3 (`add`: `{ lines: [{ merchandiseId, quantity, sellingPlanId?, attributes? }] }`; `set` and `remove`: `{ lines: [{ id, quantity }] }`; `note-update`: `{ note }`; `discount-apply` / `discount-remove`: `{ discountCodes: <current codes plus or minus the code> }`; `attributes-update`: `{ attributes: [{ key, value }] }`); set the matching `pending` field before the call and clear it after; copy `userErrors` of the result into `errors.cart` (or `errors.lines` when the error names a line) and set the timestamps with `Date.now()`.
- `connect`, `destroy`, `hydrate`, `reset`: no-ops.
- `configure` (D-121): the fallback store MUST call `Shopify.actions.updateCart.configure({ eventTarget: () => document, handler: (defaultHandler) => defaultHandler() })` exactly once, inside `fetch()` before the first `getCart`, and throw `new Error("Standard Actions updateCart could not be configured.")` when the call returns `false` (so that `isSetupError` matches and forms post natively). Reason: an UNCONFIGURED `updateCart` falls back to a full page reload on a theme whose cart rendering the platform does not recognise (Shopify docs, storefront events and actions: "If it recognizes none, then it falls back to a full page reload"), which would destroy the region refresh, the open drawer and the announcements. The configured handler runs the platform's default write and suppresses that reload. The option names are those Hydrogen itself passes (`configureUpdateCartOnce` in `hydrogen/packages/hydrogen/src/core/cart/cart.ts`).

The result shape `{ cart, userErrors? }` of `updateCart` and the `attributes` payload are taken from `hydrogen/packages/hydrogen/vendor/standard-actions.d.ts` and MUST be re-read there when the fallback is implemented. Tests C-01 to C-08 apply unchanged; C-01 still expects exactly one `updateCart.configure` call. Step 7a of the SPIKE-01 procedure (no reload after a mutation) MUST also pass with the fallback store.

### SPIKE-10 `html-region-refresh`

Default path (specified above): `refresh-html.ts` on the `html` host and, by default, on the `remix` host (8.3); `refresh-react.ts` with `useRegionHtml` on the `react` host for reasons `predictive` and `recommendations`. Chromium results on the `html` host: H1, H2, H4, H5, H7 pass (regions replaced, focus restored, quantity inputs reset).

Remaining procedure, local, no store.

Part (a), `html` strategy. Run C-09, C-10, C-13 in WebKit and Gecko on the `html` host, and add these three checks in all engines:

1. Scroll position of the window and of a scrolled CartDrawer body is unchanged after a `cart` refresh (difference at most 1 px).
2. A `ui-*` or `rp-*` element inside a replaced region upgrades (its `:defined` state is true and its behaviour works) without a second `ripple.js` load.
3. Text typed in an input outside the refreshed regions is unchanged.

Then repeat C-09, C-10, C-13 and the three checks in a Remix 3 app (Node 24.3 or later) set up for the `remix` host as `06-bindings.md` describes, with neither `reloadFrames` nor `navigate` configured (C-25), and add:

4. After a region replacement, a Remix client navigation to another route and Back shows the server state of the page (no stale region, no script error).
5. A Remix interactive component outside the replaced regions keeps its state.

Part (b), React `useRegionHtml`. In a React app with server rendering (the `react` host template), render PredictiveSearch and ProductRecommendations with the bindings of doc 11:

6. Hydration logs no error with the results region empty (C-28).
7. Typing shows results; the results region's DOM equals the `innerHTML` of the same region in the fetched document.
8. A second query replaces the first results; Escape hides the panel; the URL is unchanged.
9. A failing fetch leaves the previous results and logs no uncaught error.

Pass: all checks of part (a) in all three engines and on both hosts; all checks of part (b) in Chromium.

### Fallback (SPIKE-10)

`html` and `remix` hosts (part (a) fails): `refresh-html.ts` becomes:

```ts
import type { RefreshStrategy } from "./adapter";

/** Full navigation: the document at `url` (or the current one) replaces the page. */
export const refreshHtml: RefreshStrategy = async (_regions, { url, reason }) => {
  if (reason === "predictive" || reason === "recommendations") {
    throw new Error("[ripple] in-place refresh is not available");
  }
  if (url !== null) location.assign(url);
  else location.reload();
  await new Promise<never>(() => {});
};
```

Consequences: after a cart mutation the page reloads, so a CartDrawer does not stay open. A host on this fallback SHOULD NOT render a CartDrawer; `openCart()` then navigates to `cartUrl`, and the cart page is the confirmation of an add. Predictive search and lazy recommendations do nothing on these hosts. Because `refresh-remix.ts` delegates to `refreshHtml`, the `remix` host gets the same behaviour for every reason for which its opt-in callback is not configured. No other file changes. When part (a) fails on one host only, the other host still gets this fallback: there is one `refresh-html.ts`.

`react` host (part (b) fails): `refresh-react.ts` does nothing for reasons `predictive` and `recommendations` (delete the fetch, the store and its two exports), `useRegionHtml` is removed from `src/react/hooks.ts`, and the React bindings of PredictiveSearch and ProductRecommendations document that the app cancels `rp:refresh` for those two reasons (`event.preventDefault()` in a listener on `document`) and renders the results itself from its own data source. Sections 8.3 and 10.3 and tests C-27 and C-28 are rewritten to that.

### SPIKE-11 `remix-opt-in-refresh` (pointer)

Owned by this document together with `06-bindings.md`; defined in ledger section 3. Question: do the two opt-in `configureCommerce` options work under Remix 3, namely `reloadFrames(regions, null)` with named blocking `<Frame>`s, and `navigate(url, { replace })` for reasons `variant` and `filter`, with `rp-*` and `ui-*` state preserved by the morph? Local, Node 24.3 or later. Procedure: the Remix app of SPIKE-10 with both callbacks configured as in 10.2; run C-26 against the real app, then C-10 (focus stays on the same line's quantity input) and C-13 (history entries) with the callbacks active, and check that an open CartDrawer stays open across `reloadFrames`.

Fallback (SPIKE-11): the two options are removed from the Remix documentation and skills, the two opt-in rows of 10.2 and the `reloadFrames` example of 8.3 are deleted, `STRATEGIES.remix` becomes `refreshHtml`, `refresh-remix.ts` and C-26 are deleted, and row `reloadFrames` leaves the `CommerceOptions` table (4.2). `navigate` stays for the `react` host. Remix uses the `html` strategy only.

### Other spikes this document depends on

- SPIKE-02 (`liquid-preview-store-rendering`, doc 14): `partials.fetch`, the rendered discount code list (cart-level applications plus line-level allocations, D-120).
- SPIKE-04 (`rp-root-only-primitive`, doc 04): the shell of 7.7 and its fallback.
- SPIKE-09 (`liquid-recommendations-region`, doc 11): the Liquid recommendations URL used by `rp-recommendations`.

## Ledger issues

None open. See `00-decisions.md` sections 13.2 and 13.3 (D-109 to D-113).
