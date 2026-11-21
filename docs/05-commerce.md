# 05 - Commerce layer

Status: specification. Law: [00-decisions.md](00-decisions.md) (D-041 to D-051 and section 4.4). Where this document and the ledger disagree, the ledger wins; known disagreements are listed under [Ledger issues](#ledger-issues).

This document specifies the JavaScript in `src/commerce/`, the markup hooks it reads, and what each host must provide. It does not specify classes, visual anatomy or props of commerce components (see [11-components-commerce.md](11-components-commerce.md)), the element shell (`definePrimitive` / `createParts`, see [04-elements.md](04-elements.md)), the TSX / Liquid templates (see [06-bindings.md](06-bindings.md)), or the assembled theme (see [14-liquid-theme.md](14-liquid-theme.md)).

## 1. Reference implementation

A working implementation of everything in this document exists and was run in Chromium against the real `@shopify/hydrogen@2026.10.3` package with an emulated Standard Actions runtime:

| Path | Content |
|---|---|
| `ripple/docs/research/spikes/commerce/src/commerce/*.ts` | The 15 source files of section 3. Typechecks with `tsc --strict`. |
| `ripple/docs/research/spikes/commerce/fake-sa.js` | Emulation of `window.Shopify.actions` (`getCart`, `updateCart`, `openCart`). Test double only. |
| `ripple/docs/research/spikes/commerce/run.cjs`, `run2.cjs`, `run3.cjs` | Playwright scenarios L1 to L7 (liquid backend), D1 to D4 (details), H1 to H7 (hydrogen backend). |
| `ripple/docs/research/spikes/commerce/result.txt` | Recorded output of every scenario. |

The implementer MUST copy `ripple/docs/research/spikes/commerce/src/commerce/*.ts` to `src/commerce/` and then apply exactly these three changes:

1. In `index.ts`, replace the spike function `define(tag, connect)` (a plain `HTMLElement` subclass) with the element shell of [04-elements.md](04-elements.md). The shell MUST call `connectX(root)` when the element connects and MUST call the returned function when it disconnects. Nothing else in the controllers changes.
2. Delete `globals.d.ts` if the repository already declares `window.Shopify` through `@shopify/hydrogen` types.
3. Do not copy the spike's `tsconfig.json` or `stub-ui-sdk.ts`: they map `@ui-sdk/core` to a stub. The shipped code imports `announce` from the real `@ui-sdk/core`.

Everything below is a description of that code. When prose and code disagree, the code in the spike folder is correct for behaviour that a scenario in `result.txt` covers, and the prose is correct otherwise.

Not run (stated again under [Evidence and UNVERIFIED](#15-evidence-and-unverified)): the real Standard Actions runtime (SPIKE-01), real `@shopify/partial-rendering` (SPIKE-02), `refresh-react.ts`, `refresh-remix.ts` with a real Remix app, `rp-view-event`, `initializeShopifyScripts` and `trackCartAnalytics` at runtime, the `definePrimitive` shell (SPIKE-04), WebKit and Gecko.

## 2. Model

1. One page has one `RippleCommerce` object (D-042). It owns the one Hydrogen cart store (D-041), the form dialect (D-043), and the refresh strategy of the host (D-046).
2. Server-rendered HTML is the source of truth for structure and money text. The cart store is the source of truth for: the total quantity, which lines are pending, and errors.
3. Every commerce interaction is a real form or link that works without JavaScript. With JavaScript, an `rp-*` element intercepts the submit, click or change, runs the same operation through the store or the URL, and then asks the host to re-render named regions.
4. Elements never branch on `backend` or `host`. They call `getCommerce()` and read hook attributes (`data-rp-part`, `data-rp-field`, `data-rp-line`, `data-rp-refresh`, `data-rp-region`).

Terms: **backend** is `hydrogen` (a server using `@shopify/hydrogen` and the Storefront API) or `liquid` (a Shopify theme). **host** is `html`, `react`, `remix` (all three on the hydrogen backend) or `liquid` (liquid backend).

## 3. Files

All in `src/commerce/`. Import rules are in [01-architecture.md](01-architecture.md) section 2.

| File | Exports | Role |
|---|---|---|
| `index.ts` | `getCommerce`, `configureCommerce`, types `CommerceOptions`, `CommerceStrings`, `RippleCommerce` | Entry `<pkg>/commerce`. Registers the starter and queues the start. Side effects: yes. |
| `adapter.ts` | see 4.6 | Options, accessor, inert object, shared implementation (`createCommerce`), error lookup, synthetic submit. |
| `dialect.ts` | `CartIntent`, `CartOp`, `FormDialect`, `hydrogenDialect`, `liquidDialect`, `FIELD_TO_PROTOCOL`, `isCartIntent`, `translateLiquidForm` | Field-name tables and the Liquid-to-Hydrogen form translation. |
| `adapter-hydrogen.ts` | `createHydrogenCommerce` | hydrogen backend. |
| `adapter-liquid.ts` | `createLiquidCommerce` | liquid backend. |
| `refresh-html.ts` | `refreshHtml` | `html` strategy. |
| `refresh-liquid.ts` | `refreshLiquid` | `liquid` strategy. |
| `refresh-remix.ts` | `refreshRemix` | `remix` strategy. |
| `refresh-react.ts` | `refreshReact` | `react` strategy. |
| `rp-cart.ts` | `connectCart` | Controller of `rp-cart`. |
| `rp-product-form.ts` | `connectProductForm` | Controller of `rp-product-form`. |
| `rp-live.ts` | `connectLive`, `formUrl` | Controller of `rp-live`. |
| `rp-predictive-search.ts` | `connectPredictiveSearch` | Controller of `rp-predictive-search`. |
| `rp-recommendations.ts` | `connectRecommendations` | Controller of `rp-recommendations`. |

Every controller has the signature `(root: HTMLElement) => () => void`: it attaches delegated listeners to `root` (and `document` where stated), holds no reference to a descendant, and returns its cleanup (D-019).

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
  submitCart(form: HTMLFormElement, submitter: HTMLElement | null, event: SubmitEvent): Promise<void>;
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
| `submitCart(form, submitter, event)` | The caller MUST have called `event.preventDefault()`. Awaits `ready`. If `usable` is false it calls `form.requestSubmit(submitter)` (native post) and resolves. Otherwise it runs the form through the store (hydrogen: `cart.handleFormSubmit(event)`; liquid: `translateLiquidForm` then one synthetic submit per operation). Resolves when the mutation has settled. User errors do NOT reject; they appear in `cart.getState().errors`. A setup error (message matches `/Standard Actions|could not be configured/`) sets `usable = false` and posts the form natively. Any other thrown error rejects. |
| `setLineQuantity(lineId, quantity)` | Sends intent `set` with `lineId` and `Math.max(0, Math.round(quantity))` through a synthetic submit. `0` removes the line. Rejects when `usable` is false. |
| `refresh(regions, { url, reason })` | Section 8. Resolves after the regions were replaced or after the fallback navigation was started. Never rejects. |
| `openCart()` | If `document.getElementById(options.cartDrawer)` is an `HTMLDialogElement`: `showModal()` when not open. Otherwise `location.assign(options.cartUrl)` unless the current path already equals the cart path. |
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
  host?: RippleHost;
  cartEndpoint?: string;
  cartUrl?: string;
  cartAddUrl?: string;
  cartDrawer?: string;
  initialCart?: { cart: unknown | null; errors?: Array<{ message: string }> };
  analytics?: boolean;
  consent?: "no-banner" | "default-banner";
  strings?: Partial<CommerceStrings>;
  navigate?: (url: string, options: { replace: boolean }) => void | Promise<void>;
  reloadFrames?: (names: string[], url: string | null) => void | Promise<void>;
}
```

| Option | Default | Used by | Meaning |
|---|---|---|---|
| `host` | `"html"` | all | Selects the refresh strategy. `backend` is derived: `"liquid"` when `host === "liquid"`, otherwise `"hydrogen"`. |
| `cartEndpoint` | `"/api/cart"` | hydrogen backend | Passed to `configureCartEndpoint`. Also the `action` of every cart form. |
| `cartUrl` | `"/cart"` | all | Cart page URL. `action` of the Liquid cart form. Target of `openCart()` when no drawer exists. |
| `cartAddUrl` | `"/cart/add"` | liquid backend | `action` of the Liquid product form. |
| `cartDrawer` | `"cart-drawer"` | all | `id` of the CartDrawer `<dialog>`. |
| `initialCart` | `undefined` | hydrogen backend | The `data` value returned by `cartHandlers.get(...)` on the server (section 10.1). When set, the store is seeded and no `GET <cartEndpoint>` is made on load. JSON only. |
| `analytics` | `true` | all | `false` skips `initializeShopifyScripts`, `trackCartAnalytics` and `rp-view-event`. |
| `consent` | `"default-banner"` | hydrogen backend | Passed as `initializeShopifyScripts({ consent: { mode } })`. `custom-banner` is not supported in V1 (D-051). |
| `strings` | English, 4.3 | all | Announcement and generic error texts. |
| `navigate` | `undefined` | `react` | The router's navigation function. Without it the `react` strategy calls `location.assign(url)`. |
| `reloadFrames` | `undefined` | `remix` | Reloads the named Frames. Without it the `remix` host uses the `html` strategy. |

### 4.3 Strings

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

**Config element.** A host that cannot run code before `ripple.js` (Liquid, plain HTML) MUST print exactly one element, anywhere in the document before the `ripple.js` module script:

```html
<script type="application/json" id="rp-commerce">{"host":"html","cartEndpoint":"/api/cart"}</script>
```

The body is JSON of the JSON-serialisable keys of `CommerceOptions` (`navigate` and `reloadFrames` cannot be delivered this way). A TSX server MUST serialise it with:

```ts
const body = JSON.stringify(options).replace(/</g, "\\u003c");
```

Liquid MUST print each value with the `json` filter (section 10.4).

**`configureCommerce(options)`.** Bundled hosts (`react`, `remix`, and `html` when the app has its own entry module) call it from their client entry.

- Called before the start: merged (`strings` merged key by key).
- Called after the start: only `navigate`, `reloadFrames` and `strings` take effect. Every other key logs `[ripple] configureCommerce: "<key>" was set after commerce started and is ignored.` with `console.warn`.

### 4.5 Start sequence

`import "<pkg>/commerce"` (or loading `ripple.js`) does this, in order:

1. `registerStarter(create, defineElements)`, then `queueMicrotask(() => void getCommerce())`. A `configureCommerce` call in the same synchronous module evaluation therefore runs before the start.
2. First `getCommerce()` call (the microtask, or an earlier call by user code): `resolveOptions()` reads the config element and merges.
3. Feature tests: `typeof AbortSignal.any === "function"` and `typeof crypto.randomUUID === "function"` (D-032). On failure: the inert object; no element is defined.
4. `create()` builds the backend adapter (sections 5.1, 5.2). If it throws: `console.error("[ripple] commerce failed to start; forms post natively.", error)`, the inert object, no element is defined.
5. The new object is stored as the page's object BEFORE elements are defined, because every controller calls `getCommerce()` while it upgrades.
6. `defineElements()` defines `rp-cart`, `rp-product-form`, `rp-live`, `rp-predictive-search`, `rp-recommendations` (each guarded by `customElements.get`).
7. `ready = probe().then(afterReady, disable)`. `probe` is the first cart read. On rejection: `usable = false` and `console.error("[ripple] commerce disabled; forms post natively.", error)`. Elements stay defined and fall through to native behaviour at event time.

Outcomes:

| Failure | `usable` | Commerce elements defined | `[data-rp-js="fallback"]` controls |
|---|---|---|---|
| Server render, or module not loaded | `false` (inert object, not cached) | no | visible |
| Feature test fails, or `create()` throws (for example `updateCart` already configured by another script on Liquid) | `false` | no | visible |
| `probe()` rejects (Standard Actions missing, `configure` returned false, first cart read failed) | `false` after `ready` | yes | hidden; controllers call `form.requestSubmit(<fallback submit button>)` instead |
| None | `true` | yes | hidden |

The inert object has every member of `RippleCommerce`: `cart.getState()` returns an empty cart with `loading: true`, `cart.subscribe` returns a no-op, `submitCart`, `setLineQuantity`, `refresh` resolve without effect, `ready` is resolved, `usable` is `false`.

### 4.6 Other exports of `adapter.ts`

Used by the adapters and controllers; not part of the public package API (only `getCommerce` and `configureCommerce` are re-exported by `index.ts`).

| Export | Signature | Purpose |
|---|---|---|
| `DEFAULT_STRINGS` | `CommerceStrings` | 4.3 |
| `resolveOptions` | `() => ResolvedOptions` | 4.4 |
| `getStrings` | `() => CommerceStrings` | Current strings (late changes included) |
| `registerStarter` | `(create: () => RippleCommerce, define: () => void) => void` | 4.5 |
| `createInertCommerce` | `(options: ResolvedOptions \| null) => RippleCommerce` | 4.5 |
| `createCommerce` | `(options: ResolvedOptions, parts: BackendParts) => RippleCommerce` | Shared implementation |
| `beginAction` | `() => number` | Marks the start of a buyer action; returns `Date.now()` |
| `errorMessage` | `(state: CartState, scope: { line: string } \| "discount" \| "cart") => string \| null` | Section 9.2 |
| `isBusy` | `(state: CartState) => boolean` | Section 7.1 |
| `submitOp` | `(cart: CartStore, op: CartOp) => Promise<void>` | Synthetic submit, 6.4 |
| `isSetupError` | `(error: unknown) => boolean` | 4.1 |
| `nativeSubmit` | `(form: HTMLFormElement, submitter: HTMLElement \| null) => void` | `requestSubmit`; call only when `usable` is false |
| `cartRegions` | `() => string[]` | Section 8.4 |
| types | `RippleBackend`, `RippleHost`, `CommerceStrings`, `CommerceOptions`, `ResolvedOptions`, `RippleCommerce`, `RefreshReason`, `RefreshStrategy`, `BackendParts`, `ActionKind`, `ErrorScope` | |

```ts
export interface BackendParts {
  cart: CartStore;
  dialect: FormDialect;
  strategy: RefreshStrategy;
  submit(form: HTMLFormElement, submitter: HTMLElement | null, event: SubmitEvent): Promise<void>;
  probe(): Promise<void>;
  afterReady(commerce: RippleCommerce): void;
}

export type RefreshStrategy = (
  regions: string[],
  context: { url: string | null; reason: string; signal: AbortSignal; options: ResolvedOptions },
) => Promise<void>;
```

## 5. Cart store per backend

### 5.1 hydrogen backend (`adapter-hydrogen.ts`)

Hydrogen APIs called, all from `@shopify/hydrogen`: `configureCartEndpoint`, `createCartStore`, `initializeShopifyScripts`, `trackCartAnalytics`; on the store: `connect`, `fetch`, `handleFormSubmit`, `getState`, `subscribe`, `refresh`.

1. `configureCartEndpoint(options.cartEndpoint)`.
2. `createCartStore({ initialData: options.initialCart })` when `initialCart` is set, otherwise `createCartStore()`. Then `cart.connect()`.
3. `submit`: `cart.handleFormSubmit(event)` with the REAL submit event. The form's own field names are already the Hydrogen protocol.
4. `probe`: unseeded: `cart.fetch()` (returns the in-flight initial load; one `GET /api/cart`, scenario H1). Seeded: wait for `DOMContentLoaded`, then throw unless `window.Shopify?.actions?.updateCart` exists (scenario H6).
5. `afterReady`: `window.Shopify.actions.openCart.configure({ handler: async () => commerce.openCart() })`; then analytics (section 12).
6. Strategy: `html` host `refreshHtml`; `react` host `refreshReact`; `remix` host `refreshRemix` when `options.reloadFrames` is set, otherwise `refreshHtml`.

The hydrogen backend REQUIRES the Standard Actions script on the page even though it has its own endpoint: the store sends every mutation through `window.Shopify.actions.updateCart`, which it configures once to call the endpoint. The server MUST print the Hydrogen script tags (section 10.1) before `ripple.js`. Evidence: `hydrogen/packages/hydrogen/src/core/cart/`, scenario H6.

### 5.2 liquid backend (`adapter-liquid.ts`)

Hydrogen APIs called: `createCartStore`; on the store: `connect`, `fetch`, `handleFormSubmit` (synthetic events only), `getState`, `subscribe`, `refresh`.

1. If `window.Shopify?.actions?.updateCart?.isDefault() === false`, throw `Shopify.actions.updateCart is already configured by another script.` (D-041 item 5). This synchronous check was not exercised by a scenario; L5 and L6 cover the case where `configure` fails during the first cart read.
2. `configureCartEndpoint` MUST NOT be called. `createCartStore()`, `cart.connect()`.
3. `submit`: `for (const op of translateLiquidForm(form, submitter)) await submitOp(cart, op);` (section 6.3).
4. `probe`: `cart.fetch()`. It rejects when Standard Actions is missing or `updateCart.configure` returns `false` (scenario L6).
5. `afterReady`: configure `openCart` as in 5.1; define `rp-view-event` (section 12). `trackCartAnalytics` MUST NOT be called on Liquid (the platform reports cart events).
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

`React` and `Remix` bindings read names from `getCommerce().dialect` or hard-code the hydrogen column; Liquid templates hard-code the liquid column. The manifest records both columns (`hydrogenHost.formDialect`, `liquid.formDialect`; see [07-manifest-registry-cli.md](07-manifest-registry-cli.md)).

### 6.2 Required form markup

The markup below shows hooks and form semantics only. Classes, wrappers, labels, icons and part order belong to [11-components-commerce.md](11-components-commerce.md). Attributes shown here are REQUIRED. `data-rmx-document` is printed by the Remix binding only (D-034) and is removed by the canonicaliser.

Hook rules that hold for every form:

- A field the element must find carries `data-rp-field` with one of `merchandise-id`, `quantity`, `line-id`, `selling-plan`, `note`, `discount-code`.
- Each cart line root carries `data-rp-line="<id>"`: the Storefront API cart line id on the hydrogen backend, `item.key` on Liquid (D-044).
- The error element is exactly `<p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>` (D-045 item 4), written below as `<ERROR/>`.
- A submit button needed only without JavaScript carries `data-rp-part="submit" data-rp-js="fallback"`.

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
    <input type="number" name="quantity" value="2" min="0" data-rp-field="quantity">
    <button type="submit" name="intent" value="set" data-rp-part="submit" data-rp-js="fallback">Update</button>
    <button type="submit" name="intent" value="remove">Remove</button>
    <ERROR/>
  </form>
</li>
```

The first submit button MUST be the hidden `set` button (D-044): it is the form's default button, so Enter in the quantity input sends `set`. The quantity input is normally the input of a Quantity component (`rp-quantity`, [10-components-interactive.md](10-components-interactive.md)); its `type="button"` steppers are not part of this contract.

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

Rules: `updates[]` inputs MUST be in `cart.items` order and there MUST be exactly one per line. The `update` button MUST be the first submit button of the form (it is the default button; a `checkout` button first would send the buyer to checkout on Enter). On Liquid, the note textarea, cart attribute inputs and the checkout button that live in other components join this form with the `form="<CartLines id>-form"` attribute.

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
<textarea name="note" form="{{ cart_form }}" data-rp-field="note">{{ cart.note }}</textarea>
<ERROR/>
```

**Cart attributes.** hydrogen backend: inputs named `attributes.<key>` in a form whose submit button is `name="intent" value="attributes-update"`. liquid backend: inputs named `attributes[<key>]` with `form="{{ cart_form }}"`. With JavaScript on Liquid, when any attribute control differs from its `defaultValue`, ALL attribute controls of the form are sent in one `attributes-update`.

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

**Checkout** (D-050). hydrogen backend: `<a href="<cart.checkoutUrl>" data-agent-confirm="<sentence>">`. liquid backend: `<button type="submit" name="checkout" form="<CartLines id>-form" data-agent-confirm="<sentence>">`; when the page has no CartLines, the button is wrapped in its own `<form method="post" action="{{ routes.cart_url }}">`. `rp-cart` never intercepts a submitter whose `name` is `checkout` (scenario D3).

### 6.3 `translateLiquidForm(form, submitter): CartOp[]`

Input: the submitted form and its submitter. Only successful controls count (not `disabled`; checkboxes and radios only when checked). Output: zero or more operations in the Hydrogen protocol, sent in order.

| Step | Condition | Result |
|---|---|---|
| 1 | Submitter has `name="intent"` and a valid intent value | One op with that intent. Fields: for each control with a `data-rp-field` hook, `FIELD_TO_PROTOCOL[hook] = control.value`. |
| 2 | Else: the form has a control with `data-rp-field="merchandise-id"` | One `add` op: `merchandiseId`; `quantity` from the `quantity` hook or `"1"`; `sellingPlanId` when the `selling-plan` hook has a non-empty value; `attributes.<k>` for each non-empty control named `properties[<k>]`. |
| 3 | Else (cart form) | For each `[data-rp-line]` in the form whose `input[data-rp-field="quantity"]` has `value !== defaultValue` and a numeric value: a `set` op `{ lineId: <data-rp-line>, quantity: <rounded, min 0> }`. Then `note-update` when the `note` hook differs from its `defaultValue`. Then `attributes-update` as described in 6.2. An unchanged form yields `[]` and nothing is sent. |

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

`attachQuantityInput` and `createCartFormRegister` from `@shopify/hydrogen` are NOT called: both hold references to descendants, which D-019 forbids, and region refresh would orphan them.

## 7. Elements

Common rules:

- Each tag is root-only: `<rp-x class="..." data-slot="rp-x">` with native descendants. The class comes from the component (doc 11).
- Nearest-root rule: a controller handles a node only when `node.closest("<its tag>") === root`.
- The allow-list of post-upgrade writes (D-002, tier 3) for commerce elements is exactly: `data-pending` and `aria-busy` on the root, on `[data-rp-line]` elements and on `[data-rp-region]` roots; text and `hidden` of `[data-rp-part="count"]`; text and `hidden` of `[data-rp-part="error"]`; text of `[data-rp-part="status"]`; `hidden` of `[data-rp-part="results"]`; replacement of `[data-rp-region]` elements; `value` of `input[data-rp-field="quantity"]` reset to `defaultValue` after a refresh.
- No element creates, removes or reorders markup (D-045 item 1). Region replacement is done by the adapter.
- No commerce element observes attributes. All attributes are read at event time.

### 7.1 `rp-cart`

Root of CartLink, CartDrawer (inside the dialog body), CartLines, CartSummary, CartNote, DiscountCode. Every instance shares the one store.

| | |
|---|---|
| Tag | `rp-cart` |
| Attributes | `data-rp-refresh="<region names>"` (optional): regions to refresh after any cart mutation settles. CartLines: `rp-cart-lines rp-cart-summary`. CartSummary: `rp-cart-summary`. Others: omit. |
| Inner markup read | `[data-rp-part="count"]` (0 or more); `[data-rp-line]` with `input[data-rp-field="quantity"]`; `a[data-rp-part="remove"]`; POST forms of 6.2; `[data-rp-field="note"]`; `[data-rp-part="submit"]`; `[data-rp-part="error"]`; `[data-rp-part="status"]` (REQUIRED in CartDrawer, D-008 item 7: `<p data-rp-part="status" role="status" class="rp-visually-hidden"></p>` inside the dialog; the class is the VisuallyHidden class of [09-components-foundation.md](09-components-foundation.md)) |
| Hydrogen APIs | `cart.getState()`, `cart.subscribe()`; through the adapter: `handleFormSubmit` |
| Adapter calls | `submitCart`, `setLineQuantity`, `ready`, `usable` |

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
| `submit` | form is `method="post"`, owned by this root, `usable`, submitter name is not `checkout` | `preventDefault()`; `submitCart(form, submitter, event)`; announce (9.1) |
| `change`, and `valuechange` (captured; from `rp-quantity`) | target is or contains `input[data-rp-field="quantity"]` inside an owned `[data-rp-line]` | Debounce 250 ms per line. Then read the input: skip when empty, not a number, or equal to the last sent value (initially `defaultValue`). `usable`: `setLineQuantity(id, quantity)`. Not usable: `form.requestSubmit(<[data-rp-part="submit"] of that form>)`. |
| `change` | target matches `[data-rp-field="note"]` | `form.requestSubmit(<[data-rp-part="submit"] of target.form>)`, which re-enters the `submit` row (on Liquid the form is the cart form in the CartLines root, which handles it) |
| `click` | plain primary click on owned `a[data-rp-part="remove"]`, `usable` | `preventDefault()`; `setLineQuantity(<data-rp-line>, 0)` |

Events dispatched: none. The agent action `checkout` (D-050) is registered by the shell; see [04-elements.md](04-elements.md).

No-JS behaviour: hydrogen backend: every form posts to `/api/cart`; the server answers 303 to the same-origin `Referer`; the page re-renders. Liquid: quantity edits need the Update button (`name="update"`); remove is the `url_to_remove` link; the note is saved with Update or Checkout; no discount form (hidden by `data-rp-js="inflow"`). The count is the server-rendered value.

Optimistic lines (ids starting with `optimistic:`) never appear in server markup, so the "disable controls on optimistic lines" rule of D-045 item 3 is implemented only by the React binding ([06-bindings.md](06-bindings.md)).

### 7.2 `rp-product-form`

| | |
|---|---|
| Tag | `rp-product-form` |
| Attributes | none |
| Inner markup read | one add form of 6.2 with `[data-rp-part="submit"]`; `[data-rp-field="merchandise-id"]`; `[data-rp-field="quantity"]` (optional); `[data-rp-part="error"]` |
| Adapter calls | `submitCart`, `openCart`, `usable` |

Behaviour on `submit` of an owned form when `usable` and (`event.submitter === null` or the submitter matches `[data-rp-part="submit"]`):

1. If the root has `data-pending`: `preventDefault()` and stop (double submit).
2. `preventDefault()`; clear the error part; set `data-pending=""` and `aria-busy="true"` on the root.
3. `await submitCart(form, submitter, event)`.
4. If the store recorded an error at or after step 2 (`state.errors.lastUpdatedAt >= started`): show `errorMessage(state, "cart") ?? strings.error` in the error part. Stop.
5. Otherwise: `announce(strings.added)`; dispatch `action` on the root; unless a listener called `preventDefault()`, call `commerce.openCart()`.
6. Always: remove `data-pending` and `aria-busy`.

Event:

| Name | Bubbles | Cancelable | `detail` |
|---|---|---|---|
| `action` | no | yes (cancel to keep the cart closed) | `{ value: "add", reason: "submit", merchandiseId: string, quantity: number }` |

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

Behaviour (all only when `usable`):

| Trigger | Condition | URL |
|---|---|---|
| `submit` | owned form with `method="get"` | `formUrl(form, submitter)`: the form action with the form's successful controls as query parameters; parameters with an empty value are omitted; the action's own query string is dropped |
| `change` | owned `<input>` or `<select>` whose form is an owned GET form | `form.requestSubmit()`, then the `submit` row |
| `click` | plain primary click on an owned `<a href>`, same origin, no `target`, no `download`, not `aria-disabled="true"` | `link.href` |

Then: `reason = regions.every((name) => name.startsWith("rp-product-")) ? "variant" : "filter"`; set `data-pending=""` and `aria-busy="true"` on the root; `await refresh(regions, { url, reason })`; remove both attributes.

History (done inside `refresh`, section 8.2): `variant` uses `history.replaceState`; `filter` uses `history.pushState`.

Events dispatched: none (`rp:refresh` and `rp:refreshed` come from the adapter).

No-JS behaviour: forms and links navigate. A GET form whose controls submit on change MUST contain a submit button marked `data-rp-js="fallback"`.

Text inputs (PriceRange) fire `change` on blur or Enter; there is no per-keystroke refresh.

### 7.4 `rp-predictive-search`

| | |
|---|---|
| Tag | `rp-predictive-search` |
| Attributes | none |
| Required inner markup | A GET form to the search route containing `<input type="search" name="q" data-rp-part="input" autocomplete="off">`; a panel `<div data-rp-part="results" hidden>` that contains the element `[data-rp-region="rp-predictive-results"]`; inside the region, result links `<a href>` and one `<p data-rp-part="status">` whose text is the localized result count (for example `2 results`) |
| Adapter calls | `refresh`, `usable` |

Server requirement: the document (or partial) rendered for the search URL MUST contain the region `rp-predictive-results` filled with results for the request's `q`. The form MAY carry extra hidden fields (for example `type=product`); they are part of the URL.

Behaviour:

| Trigger | Action |
|---|---|
| `input` on the input part | Debounce 200 ms. Empty trimmed value: set `hidden` on the panel. Otherwise: root `data-pending=""`, `aria-busy="true"`; `refresh(["rp-predictive-results"], { url: formUrl(form, null), reason: "predictive" })`; clear the flags when the answer belongs to the latest term. |
| `rp:refreshed` including `rp-predictive-results` with `ok: true` | Remove `hidden` from the panel; `announce(<trimmed text of the status part>)`. |
| `keydown` ArrowDown / ArrowUp, panel open, focus on the input or a result link | Move focus to the next / previous `<a href>` in the panel; ArrowUp on the first link returns to the input; ArrowDown on the last link stays. `preventDefault()`. |
| `keydown` Escape, panel open | `preventDefault()`; hide the panel; focus the input. |
| `focusout` leaving the root while the document has focus | Hide the panel. |

It is not an ARIA combobox (D-048): no `role="combobox"`, no `aria-activedescendant`. A failed refresh leaves the page unchanged (no navigation). Enter submits the form natively to the search page.

No-JS behaviour: a plain search form; the panel stays `hidden`.

### 7.5 `rp-recommendations`

| | |
|---|---|
| Tag | `rp-recommendations` |
| Attributes | `data-url="<URL>"` (optional): a URL whose response contains region `rp-product-recommendations`. Absent: the element does nothing. |
| Required inner markup | `[data-rp-region="rp-product-recommendations"]` (server-rendered: empty, a skeleton, or final content) |
| Adapter calls | `refresh`, `usable` |

Behaviour: one `IntersectionObserver` on the root with `rootMargin: "0px 0px 400px 0px"`. On first intersection: disconnect; when `usable`: root `data-pending=""`, `aria-busy="true"`; `refresh(["rp-product-recommendations"], { url, reason: "recommendations" })`; clear the flags. Runs once per connection. A failed refresh leaves the page unchanged.

`data-url` values: Liquid `{{ routes.product_recommendations_url }}?product_id={{ product.id }}&limit=4&intent=related`; hydrogen backend: a route of the app that renders the region. A server that can render recommendations inline SHOULD omit `data-url`.

No-JS behaviour: the server-rendered content of the region stays as is.

### 7.6 `rp-view-event`

Analytics element; not built with the kernel and not a component root. Section 12.

## 8. Regions and refresh

### 8.1 Markup

- Region root: `data-rp-region="<name>"`. Names: D-046 item 1.
- A page MAY contain the same region name more than once (cart page plus drawer). All instances are refreshed together; the response MUST contain the same number of instances in the same order.
- A region root MUST NOT be, or contain, an open `<dialog>` or an `rp-cart` root that owns it (D-046 item 5). `rp-cart` roots are OUTSIDE the regions they refresh, except that a region MAY contain whole nested components.

### 8.2 `refresh(regions, { url, reason })`

Steps, in order:

1. De-duplicate `regions`, drop empty strings. Empty list: return.
2. Dispatch `rp:refresh` on `document`: `new CustomEvent("rp:refresh", { cancelable: true, detail: { regions, url, reason } })` with `url: string | null` and `reason` defaulting to `"manual"`. If a listener calls `preventDefault()`: return (the listener has taken over rendering).
3. Abort a running refresh for the same sorted region set.
4. History, when `url` is set and the host is not `react`: reason `variant`: `history.replaceState(history.state, "", url)`; reason `filter`: `history.pushState(history.state, "", url)`; other reasons: no change.
5. Set `aria-busy="true"` on every region root. Remember focus when the active element is inside one of the regions: its `id`, its line (`data-rp-line`), its hook (`data-rp-part` or `data-rp-field`).
6. Run the host strategy with an `AbortSignal`.
7. If aborted meanwhile: return without events.
8. Remove `aria-busy`. Reset every `input[data-rp-field="quantity"]` inside the regions, except the focused one, to its `defaultValue`.
9. On success restore focus, only when focus was lost (`document.activeElement` is `body`): by `id`; else the same hook in the same line; else the first focusable element of the region; else the first focusable element of the closest `<dialog>`.
10. Dispatch `rp:refreshed` on `document`: `detail: { regions, ok }`.
11. On failure, unless `reason` is `predictive` or `recommendations`: `location.assign(url)` when `url` is set, otherwise `location.reload()`.

Reasons:

| `reason` | Set by | History | Navigation fallback |
|---|---|---|---|
| `cart` | the adapter after a cart mutation | none | `location.reload()` |
| `variant` | `rp-live` when every region name starts with `rp-product-` | replace | `location.assign(url)` |
| `filter` | `rp-live` otherwise | push | `location.assign(url)` |
| `predictive` | `rp-predictive-search` | none | none |
| `recommendations` | `rp-recommendations` | none | none |
| `manual` | default for user code | none | as `cart` / `variant` by `url` |

Back and forward: after at least one `filter` push, a `popstate` event calls `location.reload()` (the URL is the state). Not installed on `react`, nor on `remix` when `"navigation" in window` (the Remix router handles history).

### 8.3 Strategies

| Host | File | Behaviour |
|---|---|---|
| `html` | `refresh-html.ts` | `fetch(url ?? location.href, { headers: { accept: "text/html" }, credentials: "same-origin", signal })`; non-2xx throws; parse with `DOMParser`; for each name pair the page's and the response's `[data-rp-region="<name>"]` elements by index; a count mismatch throws; `stale.replaceWith(document.adoptNode(fresh))`. Scripts inside a region are not executed. Full code: `ripple/docs/research/spikes/commerce/src/commerce/refresh-html.ts`. SPIKE-10. |
| `liquid` | `refresh-liquid.ts` | `const { partials } = await import("@shopify/partial-rendering")` (cached; retried after a failed load); `payload = await partials.fetch(...regions, { signal })` or `partials.fetch(...regions, { url: <absolute url>, signal })`; `await partials.apply(payload)`. Each region is also a `{% partial '<name>' %}` (D-046 item 2). |
| `remix` | `refresh-remix.ts` | `await options.reloadFrames(regions, url)`. Each region is also a named blocking `<Frame>`. |
| `react` | `refresh-react.ts` | `url === null`: nothing (cart regions render from the store). Otherwise `await options.navigate(url, { replace: reason === "variant" })`, or `location.assign(url)` without `navigate`. |

Reference `reloadFrames` for Remix (the frame API `app.frames.get(name)?.reload()` is from `ripple/docs/research/remix-3.md`; not run here):

```ts
configureCommerce({
  host: "remix",
  reloadFrames: async (names, url) => {
    if (url !== null) {
      location.assign(url);
      return;
    }
    await Promise.all(names.map((name) => app.frames.get(name)?.reload()));
  },
});
```

With this callback, URL-driven refreshes (variant, filters) are document navigations on Remix; the pushState of step 4 is then redundant but harmless. An app whose Frames take their `src` from the URL MAY navigate with its router instead.

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
| `remix` | Frame reload through `reloadFrames` | `reloadFrames(names, url)` (reference: document navigation) |
| `react` | React components subscribed to the store (`useCart` in [06-bindings.md](06-bindings.md)); the refresh is a no-op | the app router through `navigate` |

Announcement channel: when the handling `rp-cart` root owns a `[data-rp-part="status"]` element, the text is written there (required inside a modal dialog, where the page's live regions are inert). Otherwise `announce(text)` from `@ui-sdk/core` (`uisdk/packages/core/src/foundation/platform/announce.ts`). A success is announced only when no error was recorded since the action began.

### 9.2 Errors

`beginAction()` stores the time a buyer action starts. Error parts show only errors recorded at or after the latest `beginAction()`; starting any new cart action therefore clears older messages.

Scope of an `rp-cart` error part, decided by position:

| Position of `[data-rp-part="error"]` | Scope | Message |
|---|---|---|
| inside a `[data-rp-line]` | that line | first `userErrors` message, else first `warnings` message, of `errors.lines.get(<line id>)` |
| inside a form that contains `[data-rp-field="discount-code"]` | discount | the last discount code group's first message |
| anywhere else in the root | cart | first of: `errors.cart`; `errors.note`; `errors.attributes`; line errors whose line is not rendered on the page; the latest `errors.network` message |

Rules:

- CartLines MUST print one line-scope error part per line and one cart-scope error part. CartNote and DiscountCode MUST print one each. CartLink and CartSummary MUST NOT print one.
- A cart-scope message is shown by every cart-scope part on the page (a note error appears in CartLines and in CartNote). This duplication is accepted in V1.
- When `submitCart` or `setLineQuantity` rejects (network failure not recorded by the store), `rp-cart` writes `strings.error` to its first cart-scope error part and logs `[ripple] cart action failed.` with `console.error`.
- `rp-product-form` shows `errorMessage(state, "cart") ?? strings.error` in its own error part.
- After an error the server state may still have changed (partial success); the cart regions are refreshed in every case, so quantities return to the server's values (step 8 of 8.2).
- Errors use `role="alert"` on the error part; they are not also sent through `announce`.

### 9.3 Optimistic rules

1. `html`, `remix`, `liquid`: no structure is created from store data. Pending is shown with `data-pending` / `aria-busy` only; the only store-driven text is the count.
2. The quantity input keeps the buyer's typed value while pending. It is reset to the server value by the refresh.
3. Controls are not disabled while pending. A second quantity change on the same line during a pending change is sent after its own 250 ms debounce; the store serialises requests.
4. `react`: components MAY render lines, quantities and (non-money) structure from `cart.getState()`, including lines whose id starts with `optimistic:`; controls on such lines MUST be `disabled`. Money text for optimistic lines MUST NOT be invented: render the server-formatted value or nothing.
5. The count is hidden (`hidden`) when the total quantity is 0 and shown otherwise.

## 10. Host adapters

### 10.1 Hydrogen server (all of `html`, `react`, `remix`)

Server APIs, all from `@shopify/hydrogen` (evidence: `hydrogen/packages/hydrogen/src/core/cart/server-handlers.ts`, `hydrogen/packages/hydrogen/skills/hydrogen-request-handlers/SKILL.md`, `hydrogen/packages/hydrogen/src/core/shopify-scripts/index.ts`):

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
  const requestContext = createShopifyRequestContext({ request, i18n });
  const storefrontClient = createStorefrontClient(/* see the hydrogen-storefront-client skill */);

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

Rules:

1. `handlers: [cartHandlers]` mounts `GET /api/cart` (JSON) and `POST /api/cart`. A JSON POST (from the store) answers JSON. A form POST (no JavaScript) answers `303` to the same-origin `Referer`. The handlers object has lowercase members `get` and `post`.
2. Every page MUST print the Hydrogen script tags in `<head>` before the `ripple.js` module script: `renderShopifyScriptTags({ shop, i18n, consent: { mode: "default-banner" } }).join("")`. They load Standard Actions (required, 5.1), consent and analytics. `shop` is `{ shopId, storefrontId, myshopifyDomain }` (shape from `hydrogen/packages/hydrogen/src/core/shopify-scripts/static-scripts.test.ts`). The `consent.mode` printed here MUST equal the `consent` option of section 4.2.
3. Cart markup is rendered from a server cart read: `const { data } = await cartHandlers.get({ storefrontClient, request });` where `data` is `{ cart, errors? }`. This read marks the response as personalized: a page that prints cart lines or a non-zero count from it MUST NOT be cached publicly.
4. Seeding: a server that made the read of rule 3 SHOULD pass it to the client as `initialCart` in the config element (then no `GET /api/cart` happens on load, scenario H3). A publicly cached page MUST NOT seed; it prints the count part as `<span data-rp-part="count" hidden>0</span>` and the element fills it after load.
5. The response for a region refresh on the `html` host is the full page; no special route is needed.
6. Config element for the `html` host:

```html
<script type="application/json" id="rp-commerce">{"host":"html","cartEndpoint":"/api/cart","cartUrl":"/cart","initialCart":{"cart":null}}</script>
```

### 10.2 Remix 3

Everything in 10.1, plus (evidence: `ripple/docs/research/remix-3.md`; details and scaffolded code in [06-bindings.md](06-bindings.md)):

1. The Shopify middleware that calls `handleShopifyRoutes` MUST run before any middleware that reads the request body (`formData()`), because the cart POST handler reads it.
2. Cart forms, and links and forms to `/checkout` and account routes, print `data-rmx-document` so the Remix router does not intercept them (D-034). The checkout link is `<a href="<checkoutUrl>" data-rmx-document data-agent-confirm="...">`.
3. Each region is a named blocking `<Frame>` whose root element carries `data-rp-region`.
4. The client entry calls `configureCommerce({ host: "remix", reloadFrames })` (8.3) in the same module that imports `<pkg>/commerce`. Without `reloadFrames` the host behaves as `html`.

### 10.3 React

Everything in 10.1, plus:

1. The client entry MUST `import "<pkg>/commerce"` and call `configureCommerce({ host: "react", navigate, initialCart })` before `hydrateRoot`.
2. Hooks in `<pkg>/react` read the same store: `useSyncExternalStore(getCommerce().cart.subscribe, getCommerce().cart.getState, getServerSnapshot)`. The hook surface is owned by [06-bindings.md](06-bindings.md). No `CartProvider` (D-041).
3. Cart components render from the store, so `refresh` with reason `cart` does nothing. `rp-cart` still handles submits and paints `data-pending`, the count and errors; React components MUST render the same values for those attributes and texts (both derive from the same store) and MUST set `suppressHydrationWarning` on `[data-rp-part="count"]` and `[data-rp-part="error"]` elements.
4. `navigate(url, { replace })` MUST re-render the route for `url`; `rp-live` does not touch history on this host.

### 10.4 Liquid theme

1. The theme MUST NOT contain `snippets/standard-actions-config.liquid` or `assets/standard-actions-override.js`, and MUST NOT call `Shopify.actions.updateCart.configure` (RP307). Hydrogen inside `ripple.js` makes the one `configure` call.
2. Standard Actions, Standard Events and partial rendering are provided by the platform; `ripple.js` imports `@shopify/partial-rendering` and `@shopify/standard-events` dynamically and reads `window.Shopify.actions`. How the developer-preview theme enables these (import map, script tags) is specified in [14-liquid-theme.md](14-liquid-theme.md); it is UNVERIFIED here (SPIKE-01, SPIKE-02).
3. Config element in `layout/theme.liquid`, before the `ripple.js` module script:

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

4. Each region is `{% partial '<name>' %}` whose output root carries `data-rp-region="<name>"`.
5. Form field names are the liquid column of 6.1; forms of 6.2.
6. Theme code that needs the cart MUST `import { getCommerce } from "ripple"` and MUST NOT load `@shopify/hydrogen` (D-041 item 4).

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

### 11.1 Minimal resource shapes

TSX hosts pass plain objects with the shapes below (types exported from `<pkg>`, file `src/types.ts`). A Storefront API selection with these fields satisfies them structurally; `url` is computed by the host from its route templates. Liquid passes drops; the column "Liquid" gives the expression the Liquid binding reads. Components MUST NOT read any other field. Storefront API field names in this table were not re-checked against the schema in this session, except the cart fields used by the store (`id`, `totalQuantity`, `cost.subtotalAmount`, `cost.totalAmount`, `lines.nodes`, `attributes`, `discountCodes`): the rest are UNVERIFIED and MUST be checked with the Shopify docs tool before the types are frozen.

```ts
export interface RippleMoney { amount: string; currencyCode: string }
export interface RippleImage { url: string; altText: string | null; width: number; height: number }
export interface RippleVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: RippleMoney;
  compareAtPrice: RippleMoney | null;
  image: RippleImage | null;
}
export interface RippleProduct {
  id: string;
  title: string;
  handle: string;
  url: string;
  vendor: string;
  availableForSale: boolean;
  featuredImage: RippleImage | null;
  price: RippleMoney;
  compareAtPrice: RippleMoney | null;
}
export interface RippleCollection { id: string; title: string; handle: string; url: string; image: RippleImage | null }
export interface RippleArticle {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  publishedAt: string;
  image: RippleImage | null;
}
export interface RippleLine {
  id: string;
  quantity: number;
  title: string;
  variantTitle: string;
  url: string;
  image: RippleImage | null;
  totalPrice: RippleMoney;
  compareAtTotalPrice: RippleMoney | null;
  attributes: Array<{ key: string; value: string }>;
}
export interface RippleCart {
  id: string | null;
  totalQuantity: number;
  checkoutUrl: string;
  note: string;
  subtotal: RippleMoney;
  total: RippleMoney;
  discountCodes: Array<{ code: string; applicable: boolean }>;
  lines: RippleLine[];
}
```

| Prop | Read by | TSX type | Storefront API source | Liquid |
|---|---|---|---|---|
| `product` | ProductCard, ProductForm, VariantPicker, ProductGallery, ProductRecommendations | `RippleProduct` | `Product`: `id`, `title`, `handle`, `vendor`, `availableForSale`, `featuredImage`, `priceRange.minVariantPrice`, `compareAtPriceRange.minVariantPrice` | `product.id`, `.title`, `.handle`, `.url`, `.vendor`, `.available`, `.featured_image`, `.price`, `.compare_at_price` |
| `variant` | ProductForm, Price, AddToCartButton | `RippleVariant` | `ProductVariant`: `id`, `title`, `availableForSale`, `price`, `compareAtPrice`, `image` | `variant.id`, `.title`, `.available`, `.price`, `.compare_at_price`, `.image`; default `product.selected_or_first_available_variant` |
| `collection` | CollectionCard, Filters, SortSelect | `RippleCollection` | `Collection`: `id`, `title`, `handle`, `image` | `collection.id`, `.title`, `.handle`, `.url`, `.image` |
| `article` | ArticleCard | `RippleArticle` | `Article`: `id`, `title`, `excerpt`, `publishedAt`, `image` | `article.id`, `.title`, `.url`, `.excerpt`, `.published_at`, `.image` |
| `cart` | CartLink, CartDrawer, CartLines, CartSummary, CartNote, DiscountCode | `RippleCart` | `Cart`: `id`, `totalQuantity`, `checkoutUrl`, `note`, `cost.subtotalAmount`, `cost.totalAmount`, `discountCodes`, `lines.nodes` | `cart.item_count`, `cart.note`, `cart.items_subtotal_price`, `cart.total_price`, `cart.items`; applied discount codes: UNVERIFIED which drop lists them (`cart.discount_applications` is the candidate), owned by [14-liquid-theme.md](14-liquid-theme.md) |
| `line` | CartLine | `RippleLine` | `CartLine`: `id`, `quantity`, `merchandise.product.title`, `merchandise.title`, `merchandise.image`, `cost.totalAmount`, `cost.compareAtAmountPerQuantity` (times quantity is NOT computed; pass `null` when absent), `attributes` | `item.key`, `.quantity`, `.product.title`, `.variant.title`, `.url`, `.image`, `.final_line_price`, `.original_line_price`, `.properties` |
| `image` | Image and every card | `RippleImage` | `Image`: `url`, `altText`, `width`, `height` | image drop: `image_url` filter, `.alt`, `.width`, `.height` |
| `media` | ProductGallery | `Array<{ id: string; image: RippleImage }>` (V1: images only) | `product.media.nodes` of type `MediaImage`: `id`, `image` | `product.media` where `media_type == 'image'` |
| `price`, `compareAtPrice` | Price | `RippleMoney` | `MoneyV2` | a number of cents (money drop value) |
| `menu` | chrome components | owned by [12-components-chrome-and-blueprints.md](12-components-chrome-and-blueprints.md) | | |

### 11.2 Money

- No element formats money. Money text is printed by the server and replaced only by region refresh (D-049).
- TSX servers: `formatMoney(money, { locale }).localizedString` from `@shopify/hydrogen` (`hydrogen/packages/hydrogen/src/core/money/format.ts`); `locale` is a BCP 47 tag such as `en-US`. A price range: `formatMoney([min, max], { locale })`; the returned object converts to a string in a template literal.
- Liquid: `{{ price | money }}`; the theme decides between `money` and `money_with_currency` in one snippet owned by [14-liquid-theme.md](14-liquid-theme.md).
- React (D-045 item 2): money for server-known lines comes from the server-formatted strings passed as props or from `formatMoney` over store data on the hydrogen backend. Client and server MUST pass the same `locale`.
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
- Default widths for `imageSrcSet` when a component gives none: `[200, 400, 600, 800, 1200, 1600]`.
- Liquid: `{{ image | image_url: width: 800 }}` and one `image_url` call per width for `srcset`.
- Image REQUIRES `alt`, `width`, `height` (D-049). `width` and `height` are the intrinsic dimensions (aspect ratio), not the requested size.
- Fixtures mask `src` and `srcset` (D-049).

## 12. Analytics and consent

1. There is no consent banner component (D-051). hydrogen backend: the platform banner is loaded by the script tags of 10.1 with `consent: { mode: "default-banner" }` (or `"no-banner"`); the client calls `initializeShopifyScripts({ consent: { mode: options.consent } })` once, in `afterReady`. Liquid: the platform handles consent; Ripple calls nothing.
2. Page views: hydrogen backend: published by `initializeShopifyScripts` (it calls Hydrogen's page-view initialiser; `hydrogen/packages/hydrogen/src/core/shopify-scripts/initialize.ts`). Liquid: published by the platform.
3. Cart events: hydrogen backend: `trackCartAnalytics(cart)` once, in `afterReady` (`hydrogen/packages/hydrogen/src/core/analytics/cart-tracker.ts`). Liquid: published by the platform through Standard Actions; `trackCartAnalytics` MUST NOT be called.
4. Analytics starts only when `options.analytics` is true and, on the hydrogen backend, `window.Shopify.analytics` exists. A thrown error is logged (`[ripple] analytics not started.`) and does not change `usable`.
5. View events (product, collection, search, cart viewed) are declared in markup with `rp-view-event`:

```html
<rp-view-event view-event-trigger="connect">
  <script type="application/json" data-view-event-payload>{"event":"product_viewed","payload":{"products":[{"id":"gid://shopify/Product/1","title":"Tee","price":"20.0","vendor":"Acme","variantId":"gid://shopify/ProductVariant/1","variantTitle":"S","quantity":1}]}}</script>
</rp-view-event>
```

| | |
|---|---|
| Tag | `rp-view-event` (no class, no `data-slot`; `base.css` MUST contain `rp-view-event { display: block; }` so `intersect` has a box; see [03-styling-and-tokens.md](03-styling-and-tokens.md)) |
| Attributes | `view-event-trigger`: `connect` (default) or `intersect`. `view-event-payload`: the JSON as an attribute, alternative to the child script. |
| hydrogen backend | Defined in `adapter-hydrogen.ts`. Parses `{ event, payload }` and calls `window.Shopify.analytics.publish(event, payload)` once per element. Invalid JSON: `console.error("[ripple] rp-view-event: invalid payload.", error)`. |
| liquid backend | `customElements.define("rp-view-event", createViewEventElement())` with `createViewEventElement` from `@shopify/standard-events` (types: `hydrogen/packages/hydrogen/vendor/standard-events.d.ts`; that API also supports triggers `dialog` and `manual`, not used in V1). |
| Where | ProductForm (product viewed), collection and search blueprints, cart page and CartDrawer (`cart_viewed`): placement is owned by docs 11 and 12. |
| No-JS | Nothing is sent. |

Payloads on the hydrogen backend (from `hydrogen/packages/hydrogen/src/core/analytics/`): `product_viewed` `{ products: [{ id, title, price, vendor, variantId, variantTitle, quantity, sku?, productType? }] }`; `collection_viewed` `{ collection: { id, handle } }`; `search_viewed` `{ searchTerm, searchResults? }`; `cart_viewed` `{ cart }`.

UNVERIFIED: that the Standard Events element reads the same `{ event, payload }` JSON shape as the hydrogen implementation. If it differs, the Liquid binding prints the Standard Events shape, the fixture masks the script body, and the hydrogen implementation does not change.

## 13. Checker rules

Rule ids are assigned in [07-manifest-registry-cli.md](07-manifest-registry-cli.md); this document only states what must be checkable from rendered HTML.

| Check | Layer |
|---|---|
| Every `data-rp-field` value is one of the six values of 6.2. | H |
| An `rp-product-form` contains exactly one form with `[data-rp-field="merchandise-id"]` and one `[data-rp-part="submit"]`. | H |
| In a hydrogen cart line form, the first `button[type="submit"]` is `name="intent" value="set" hidden`. | H |
| In a Liquid cart form, the first submit button is `name="update"`, and the number of `[name="updates[]"]` controls equals the number of `[data-rp-line]` elements. | H |
| Every `data-rp-refresh` name has a `[data-rp-region]` element on a page that renders that region's component (warning only on other pages). | H |
| No `[data-rp-region]` element contains an `rp-cart` whose `data-rp-refresh` names that region. | H |
| No `<dialog>` is a descendant of, or the same element as, a `[data-rp-region]` root. | H |
| At most one `#rp-commerce` element; its body parses as JSON. | H |
| Liquid theme: no `Shopify.actions.updateCart.configure` call and none of the two base-theme files of 10.4 (RP307). | S |
| No value import of `@shopify/hydrogen` outside `adapter-hydrogen.ts` and `adapter-liquid.ts`. | S |

## 14. Acceptance tests

Tiers are those of D-063. "Spike" names the scenario in `ripple/docs/research/spikes/commerce/` that already passes; the test in `test/commerce/` MUST assert the same observations. Tests marked E run against the Standard Actions emulation `fake-sa.js`; tests marked M run against mock.shop (tier 7); tests marked P need the preview store (tier 8).

| Id | Tier | Assertion | Spike |
|---|---|---|---|
| C-01 | 5 E | Liquid start: `updateCart.configure` called once, `getCart` once, `openCart.configure` once; `getCommerce().usable === true`; count part shows the cart quantity; the five tags are defined. | L1 |
| C-02 | 5 E | Liquid add: one `updateCart` call with `lines[0] = { merchandiseId, quantity, sellingPlanId, attributes }`; root has `data-pending` and `aria-busy="true"` during the call and neither after; `action` event detail equals `{ value: "add", reason: "submit", merchandiseId, quantity }`; `#cart-drawer` is open; the `added` string from the config element is announced; one `rp:refresh` with `reason: "cart"`; `partials.fetch` called with the declared regions. | L2 |
| C-03 | 5 E | Liquid quantity: no call before 250 ms; then `{ lines: [{ id: <item.key>, quantity: 5 }] }`; status text `Cart updated`. Remove link: quantity 0, status `Item removed`, no navigation. Enter in a quantity input: one `set`. Discount form: `{ discountCodes: ["SAVE10"] }`. | L3 |
| C-04 | 5 E | `userErrors` on a line: the line's error part shows the message without `hidden`; the cart-scope part stays hidden; no success announcement. | L4 |
| C-05 | 5 E | `updateCart` configured by another script before `ripple.js`: `usable === false` after `ready`; a cart form submit produces a native POST. Separate case, `updateCart.isDefault()` already `false` at start: no commerce element is defined (not run in the spike). | L5, L6 |
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
| C-16 | 3 | Upgrade stability for every commerce fixture: mutations inside component roots are a subset of the allow-list in section 7. | not run |
| C-17 | 6 | No-JS, hydrogen backend (mock.shop): add, set quantity with the Update button, remove, note, discount apply, checkout link each complete with scripting disabled. | not run |
| C-18 | 6 | No-JS, Liquid shim: the rendered forms have the field names of 10.5 and `[data-rp-js="inflow"]` on both discount forms. | not run |
| C-19 | 9 | C-02, C-03, C-09, C-13, C-14 in WebKit and Gecko. | not run |
| C-20 | 10 | `ripple.js` commerce layer including `@shopify/hydrogen` cart and analytics code is at most the budget of D-064; measured in the spike: 22.5 kB gzip minified. | measured |
| C-21 | 8 P | SPIKE-01 checklist (section 16). | blocked |
| C-22 | 1 | `imageUrl("https://cdn.shopify.com/a.jpg", { width: 400 })` ends with `?width=400`; `imageUrl("https://example.com/a.jpg", { width: 400 })` returns the input; `imageSrcSet(src, [200, 400])` has two comma-separated entries ending `200w` and `400w`. | unit |
| C-23 | 4 | React: hydrating a page with CartLink and CartLines with either script order logs no hydration error. | not run |

## 15. Evidence and UNVERIFIED

Evidence (paths relative to the local clones root):

- `hydrogen/packages/hydrogen/src/core/cart/` (`cart.ts`, `actions.ts`, `form.ts`, `server-handlers.ts`, `get-cart.ts`): store surface, intents, handler shape `{ get, post }`.
- `hydrogen/packages/hydrogen/src/core/shopify-scripts/` (`index.ts`, `initialize.ts`, `types.ts`): script tags, `initializeShopifyScripts`, consent modes.
- `hydrogen/packages/hydrogen/src/core/analytics/cart-tracker.ts`: `trackCartAnalytics(store)`.
- `hydrogen/packages/hydrogen/src/core/money/format.ts`: `formatMoney`.
- `hydrogen/packages/hydrogen/vendor/standard-actions.d.ts`, `vendor/standard-events.d.ts`: `updateCart.configure`, `isDefault`, `openCart.configure`, `createViewEventElement`.
- `hydrogen/packages/hydrogen/skills/hydrogen-request-handlers/SKILL.md`, `skills/hydrogen-image/SKILL.md`.
- `uisdk/packages/core/src/foundation/platform/announce.ts`: `announce(text, { priority?, doc? })`.
- `ripple/docs/research/hydrogen-core.md`, `liquid-blocks-partials.md`, `remix-3.md`, `base-theme.md`.
- `ripple/docs/research/spikes/commerce/` (this document's spike).

UNVERIFIED:

1. The real Standard Actions runtime with Hydrogen's default handler (SPIKE-01). Everything Liquid in this document ran against `fake-sa.js`.
2. `@shopify/partial-rendering` on a preview store, including `partials.fetch` with a `url` for the search and product-recommendations routes (SPIKE-02).
3. `refresh-remix.ts` and the `app.frames.get(name)?.reload()` callback with a real Remix 3 app; `refresh-react.ts` with a real router.
4. `rp-view-event`, `initializeShopifyScripts` and `trackCartAnalytics` at runtime; the Standard Events payload shape.
5. Controllers inside the `definePrimitive` shell (SPIKE-04); the spike used a plain `HTMLElement`.
6. WebKit and Gecko. In particular: implicit submission through a `hidden` first submit button (6.2) was exercised in Chromium only.
7. Storefront API and Liquid drop field names of 11.1 not used by the store.
8. Behaviour of a native POST of the Liquid discount form when `usable` became false after start (the platform ignores the unknown field is assumed).
9. Exact required members of `ShopifyScriptTagsOptions` beyond `shop`, `i18n`, `consent`.

## 16. Spikes owned by this document

### SPIKE-01 `liquid-standard-actions-runtime`

Default path (specified above): `adapter-liquid.ts` uses `createCartStore()` with no endpoint.

Procedure on the preview store (C-21). Load a product page and a cart page of the Ripple theme and record `Shopify.actions.updateCart` / `getCart` calls and network requests:

1. Start: `getCommerce().usable === true` after `await getCommerce().ready`; `cart.getState().data.totalQuantity` equals `{{ cart.item_count }}`.
2. Add with quantity 2, a selling plan and one line property: the cart contains the line with all three.
3. Set a line to 5 using `data-rp-line="{{ item.key }}"` as the id: quantity is 5. This verifies that `item.key` is accepted as the line `id`.
4. Set a line to 0: the line is gone.
5. Note update, discount apply with a valid and an invalid code (the invalid code yields a message in `errors.discountCodes` or `errors.cart`), discount remove.
6. `Shopify.actions.openCart()` from the console opens `#cart-drawer`.
7. After each step the regions `rp-cart-lines` and `rp-cart-summary` show the new state without a navigation.

Pass: all seven. Any failure: apply the fallback.

### Fallback (SPIKE-01)

Needs Ben's sign-off (ledger section 10, Q10). Only `adapter-liquid.ts` changes; `dialect.ts`, the controllers and every other file stay as they are.

`adapter-liquid.ts` replaces `createCartStore()` with a local function `createActionsCartStore(): CartStore` that implements the same surface on `window.Shopify.actions` directly:

- `getState()` / `subscribe(listener)`: a state object with the `CartState` fields the controllers read: `data.totalQuantity`, `loading`, `revalidating`, `pending` (`lines: Set<string>`, `note`, `attributes`, `discountCodes: Set<string>`, `cost`), and `errors` with the groups and `*UpdatedAt` timestamps listed in `createInertCommerce` (`adapter.ts`).
- `fetch()` / `refresh()`: `const { cart } = await Shopify.actions.getCart()`; store `cart.totalQuantity`; `loading = false`.
- `handleFormSubmit(event)`: read `event.submitter.value` (intent) and `new FormData(event.target)`; map to one `Shopify.actions.updateCart(input)` call with the payloads of 6.3 (`add`: `{ lines: [{ merchandiseId, quantity, sellingPlanId?, attributes? }] }`; `set` and `remove`: `{ lines: [{ id, quantity }] }`; `note-update`: `{ note }`; `discount-apply` / `discount-remove`: `{ discountCodes: <current codes plus or minus the code> }`; `attributes-update`: `{ attributes: [{ key, value }] }`); set the matching `pending` field before the call and clear it after; copy `userErrors` of the result into `errors.cart` (or `errors.lines` when the error names a line) and set the timestamps with `Date.now()`.
- `connect`, `destroy`, `hydrate`, `reset`: no-ops.
- `Shopify.actions.updateCart.configure` is NOT called in this fallback.

The result shape `{ cart, userErrors? }` of `updateCart` and the `attributes` payload are taken from `hydrogen/packages/hydrogen/vendor/standard-actions.d.ts` and MUST be re-read there when the fallback is implemented. Tests C-01 to C-08 apply unchanged, except that C-01 expects zero `configure` calls.

### SPIKE-10 `html-region-refresh`

Default path (specified above): `refresh-html.ts`. Chromium results: H1, H2, H4, H5, H7 pass (regions replaced, focus restored, quantity inputs reset).

Remaining procedure, local, no store: run C-09, C-10, C-13 in WebKit and Gecko, and add these three checks in all engines:

1. Scroll position of the window and of a scrolled CartDrawer body is unchanged after a `cart` refresh (difference at most 1 px).
2. A `ui-*` or `rp-*` element inside a replaced region upgrades (its `:defined` state is true and its behaviour works) without a second `ripple.js` load.
3. Text typed in an input outside the refreshed regions is unchanged.

Pass: all checks in all three engines.

### Fallback (SPIKE-10)

`refresh-html.ts` becomes:

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

Consequences: after a cart mutation the page reloads, so a CartDrawer does not stay open. A host on this fallback SHOULD NOT render a CartDrawer; `openCart()` then navigates to `cartUrl`, and the cart page is the confirmation of an add. Predictive search and lazy recommendations do nothing on the `html` host. `remix` without `reloadFrames` inherits the same behaviour. No other file changes.

## Ledger issues

Decisions made here because the ledger was silent or wrong. Each is applied in this document.

1. **Options delivery (D-042 names `configureCommerce` only).** Added: the `CommerceOptions` shape (4.2), the config element `<script type="application/json" id="rp-commerce">`, lazy start in a microtask, and the rule that only `navigate`, `reloadFrames`, `strings` apply after the start.
2. **`rp-view-event`.** A sixth commerce tag for view analytics; not kernel-built; needs `rp-view-event { display: block; }` in `base.css`. The ledger's tag list (8.3) does not contain it.
3. **JavaScript strings.** Announcements need localized text in JavaScript; delivered through `strings` with the locale keys of 4.3. The ledger defines locale keys for Liquid templates only (D-038, D-066).
4. **Part names.** `remove` is a new `data-rp-part` value (Liquid remove link). The count part is hidden with `hidden` at quantity 0. Both are additions to section 4.4 and to the allow-list.
5. **Refresh reasons.** D-046 has `reason?: string` without values. Defined: `cart`, `variant`, `filter`, `predictive`, `recommendations`, `manual`; history mapping; `rp-live` derives `variant` from the `rp-product-` region prefix; no navigation fallback for `predictive` and `recommendations`; `popstate` reloads.
6. **`attachQuantityInput` is not called** although D-044 cites it. The hidden first `set` button is kept in markup (it makes Enter send `set` without JavaScript). Quantity changes go through `setLineQuantity`.
7. **Liquid cart form structure.** One form printed by CartLines with id `<CartLines id>-form`; CartNote, cart attributes and CheckoutButton join it with the `form` attribute; the Update button is the first submit button and carries `data-rp-part="submit" data-rp-js="fallback"`. The Liquid discount forms use a Hydrogen-style `name="intent"` submitter and `data-rp-js="inflow"` on the `<form>` (section 4.4 says `data-rp-js` is "on controls").
8. **`rp-recommendations` attribute `data-url`** and its one-shot lazy load are defined here; the ledger names the element only.
9. **Evidence error.** `ripple/docs/research/hydrogen-core.md` describes the server handlers as `GET(request)` / `POST(request)`. The source has `createCartServerHandlers()` returning `{ get, post }`, registered through `handleShopifyRoutes({ handlers: [cartHandlers] })`, with the server read `cartHandlers.get({ storefrontClient, request })`. D-041 item 1 ("mounts at `/api/cart`") is correct in effect.
10. **Standard Actions on the hydrogen backend.** D-041 item 2 implies only Liquid uses Standard Actions. The Hydrogen store routes mutations through `Shopify.actions.updateCart` on both backends, so the Hydrogen script tags are REQUIRED on the hydrogen backend (verified, scenario H6).
11. **Error lifetime.** Errors are shown until the next buyer cart action begins (`beginAction`). Cart-scope messages can appear in more than one cart-scope error part.
12. **`openCart()` without a drawer** navigates to `cartUrl`. The `action` event of `rp-product-form` is cancelable to veto opening the cart. `cartDrawer` defaults to the id `cart-drawer`, which doc 11 or 12 MUST give the CartDrawer dialog by default.
13. **Internal exports of `adapter.ts`** beyond the two public names (4.6).
14. **Caching.** Pages that print cart markup from a server cart read on the hydrogen backend are personalized; publicly cached pages print a hidden zero count and do not seed `initialCart`.
15. **Resource shapes** (11.1) are new Ripple types (`RippleProduct`, `RippleVariant`, `RippleLine`, `RippleCart`, `RippleImage`, `RippleMoney`, `RippleCollection`, `RippleArticle`); section 6.4 of the ledger delegates them to this document.
16. **React hydration.** `rp-cart` writes count and error text before or after hydration; React bindings need `suppressHydrationWarning` on those parts (10.3). The ledger does not mention it.
17. **Async start failure.** D-041 item 7 says forms are left untouched when the runtime cannot start. When the failure is detected only after elements are defined (first cart read fails), fallback controls are already hidden by CSS; the controllers submit the form natively through the hidden fallback button instead.
