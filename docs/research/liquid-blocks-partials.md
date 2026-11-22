# Rendering Ripple from Liquid: blocks, partials, loading and conformance

Status: research finding for the Ripple spec. Date: 2026-11-21.
Scope: how a Ripple component is expressed as a Liquid `{% block %}`, what `{% partial %}` and `@shopify/partial-rendering` do, how `ripple.css` / `ripple.js` load in a theme, how Liquid output is conformance-tested without Shopify, and what Liquid forces on the HTML contract.

Path conventions used below:

- `theme/...` = `ripple/theme/...` (the base theme Ben pushed).
- `spike/...` = `ripple/docs/research/spikes/liquid/...` (code written and run for this report).
- `uisdk-report` = `ripple/docs/research/uisdk-web-elements.md`; `react-report` = `ripple/docs/research/react-and-custom-elements.md`; `base-theme-report` = `ripple/docs/research/base-theme.md`.
- `docs:<path>` = a page on shopify.dev returned by the Shopify docs search tool, for example `docs:/docs/api/liquid/tags/block`.

---

## 0. What was run, what was read, what could not be checked

| Item | Status |
|---|---|
| `{% block %}` and `{% partial %}` reference pages, changelog post, Theme Check check pages, Standard Actions pages, mock.shop page | **Read** through the docs search tool (chunks, not whole pages). |
| The "Partials" guide that documents the full `@shopify/partial-rendering` API | **Not retrievable.** Six differently worded searches returned only the `{% partial %}` tag page, which links to it. Everything in section 2.2 beyond `partials.refresh(...)` comes from the base theme's JavaScript, not from docs. |
| The "developer preview overview" page and the skeleton theme release candidate | **Not retrievable** through search. Only the changelog post that links to them was returned. |
| npm registry | **Reachable.** `liquidjs@10.30.1`, `@shopify/theme-check-node@4.0.2`, `parse5` installed. `@shopify/partial-rendering` is **not on npm** (`npm view` returns E404, `spike/result.txt`). |
| A Shopify store with the Liquid July '26 preview | **Not available.** No block file in this report has been rendered by Shopify. Every statement about what the platform emits is from docs or from the base theme source, and is marked UNVERIFIED where neither covers it. |
| Example block files | **Run** locally: 13 render cases pass (`spike/render.mjs`), Theme Check reports 0 offenses on the example theme (`spike/check.mjs`), and the Liquid-rendered Dialog upgrades in Chromium with real `@ui-sdk/web@0.1.0-beta.14` with **zero DOM mutations** (`spike/upgrade.mjs`). Output: `spike/result.txt`. |
| Base theme | **Read** (`AGENTS.md` in full; `layout/theme.liquid`; product, cart, collection templates; `button`, `container`, `pagination`, `predictive-search` blocks; cart, drawer, filters, import-map, standard-actions snippets; `s-cart.js`, `s-product-form.js`, `s-variant-picker.js`, `s-live-form.js`). **Linted**: Theme Check 4.0.2 reports 0 offenses on it. |

---

## 1. Headline conclusions

1. **A Ripple component maps cleanly to one Liquid block file, and the output can equal the shared HTML contract.** Button, Stack, Accordion, Dialog and ProductForm were written as block files, rendered locally, and matched the expected contract HTML after canonicalisation. The Dialog markup is the zero-diff closed-state markup from `uisdk-report` section 3.2 and produced zero mutations on upgrade.
2. **`{% block %}` may only be used in `templates/` and `layout/`.** A block file or snippet cannot call another block. This is documented (`docs:/docs/api/liquid/tags/block`: "Use `{% block %}` in `layout/` and `templates/` files"), enforced by Theme Check as an **error** (`ValidBlockTagPlacement`), and a non-negotiable of the base theme. Consequence: a Ripple component that contains another Ripple component (DialogTrigger contains Button, ProductCard contains Price) cannot compose blocks. Its inner markup MUST come from a **snippet** that is the single source of that markup.
3. **A block cannot pass anything to its body.** The body is rendered in the caller's scope before the block file runs (`theme/AGENTS.md` "Composition model"). There is no context, no child introspection and no child wrapping. Ids that connect parts (Dialog trigger to title, Tabs tab to panel), group names and indexes MUST be passed explicitly to every part by the template author. The body cannot read `form` either, which decides the shape of ProductForm.
4. **Theme Check validates only part of a call.** It reports unknown arguments, missing required arguments, wrong literal types and bad literals for **LiquidDoc-declared** unions. It does **not** validate a literal against a schema `select` setting, does not report a missing block file, a string passed for a boolean, a variable carrying a bad value, or duplicate partial names (`spike/result.txt`). `ripple check` MUST cover these for Liquid templates, and block files MUST validate enumerations at render time.
5. **`partials.apply()` replaces DOM, it does not morph.** Evidence is the base theme's code, which saves and restores focus and `<details open>` around every apply and treats elements inside the region as new instances. `rp-*` elements inside a partial MUST be safe to destroy and recreate, and overlay roots MUST sit outside the partial they refresh.
6. **`@shopify/partial-rendering` is provided by the platform, not by npm and not by the theme's import map.** How the specifier resolves is UNVERIFIED. `ripple.js` MUST keep it as an external bare import and MUST work when it is absent (non-preview stores, plain HTML hosts).
7. **Cart mutations on a Liquid storefront have a documented, bundler-free API**: `Shopify.actions.updateCart` (Standard Actions) writes to the Storefront API and accepts raw Liquid variant ids and Liquid line keys. Only the **first** `configure()` call wins, so Ripple and a theme cannot both configure it.
8. **No-JS add to cart requires the native field names** (`id`, `quantity`, `selling_plan`, `properties[...]`) and the form internals differ from Hydrogen-server hosts. The HTML contract MUST mark the form element's `action` and hidden fields as host-owned.
9. **mock.shop cannot back a Liquid theme.** It is a Storefront API only. Liquid needs a development store with the `liquid_july_26_changes` feature preview. Ben must provide one (section 12).
10. **Local conformance testing without Shopify works** with `liquidjs` plus a ~200-line shim, but the shim encodes assumptions about the platform. A second tier against a real preview store is required before the Liquid binding is called conformant.
11. **A theme has a hard limit of 300 block files** (`docs:/docs/storefronts/themes/architecture/blocks`). Parts-as-blocks multiplies files (Accordion is 4, Dialog is 4). The spec MUST set a block-file budget and `ripple add` MUST install only what a project uses.

---

## 2. Platform facts

### 2.1 `{% block %}`

Source: `docs:/docs/api/liquid/tags/block` unless another source is given.

- Syntax: `{% block 'name', parameter: value %} content {% endblock %}`. "The block name maps to a file in `blocks/`." Subdirectories are not supported in a theme (`docs:/docs/storefronts/themes/architecture`).
- Where: "Use `{% block %}` in `layout/` and `templates/` files." Theme Check `ValidBlockTagPlacement` (error): "The 'block' tag can only be used in templates/**/*.liquid and layout/*.liquid." (`spike/result.txt`).
- Body: "The content between `{% block 'name' %}` and `{% endblock %}` is the block's body content, and the block prints it with `{{ content }}`. Body content can be plain markup, other blocks, or both." `block.content` is rejected by Theme Check (`BlockContentUsage`, error).
- Body scope: "`content` is rendered in the caller's scope before the block implementation. Moving calls into a body does not expose the callee's settings, local assignments, or `block.id`." (`theme/AGENTS.md`). Not stated in the docs chunks returned; treat the base theme as the authority and re-verify on a preview store.
- Parameters: "Each parameter is available as a variable inside the block." Arguments accept "variables, literals, and property access, not filter chains" (`theme/AGENTS.md` "Liquid parsing rules"). Verified with Theme Check: `aria_label: 'key' | t` is `LiquidSyntaxError: Syntax error in 'block' tag`.
- Arrays: "A block parameter can take a literal array": `badges: ['New', 'Sale']`. "Inline literal arrays are specific to the `{% block %}` tag. Other tags, such as `{% render %}` and `{% partial %}`, don't accept an array written directly in the tag."
- Schema settings: "When a parameter has the same name as a setting that the schema declares, the parameter also sets that setting." Both `{{ variant }}` and `{{ block.settings.variant }}` then return the passed value. The dotted form at the call site is a syntax error: "Use 'variant:' instead of 'block.settings.variant:' when calling a block." (`spike/result.txt`).
- Reading a setting by its bare name when the caller did **not** pass it: used throughout the base theme (`theme/blocks/container.liquid`: `assign bg_color = background`) and accepted by Theme Check (no `UndefinedObject`). The docs chunks only state `block.settings.<id>`. Treated as supported; re-verify on a preview store.
- `{% doc %}`: "is documentation only: it doesn't declare, validate, or bind parameters." "Always document `content` in `{% doc %}`": `@param {string} content` when required, `@param {string} [content]` when optional. Theme Check reads it (section 2.4).
- `{% schema %}`: one per block file, valid JSON, not nested in another tag (`docs:/docs/storefronts/themes/architecture/blocks/theme-blocks/schema`). The base theme forbids `presets`.
- Wrapper element: classic theme blocks are wrapped in `<div id="shopify-block-[id]" class="shopify-block">` unless the schema has `"tag": null`, and then need `{{ block.shopify_attributes }}` on the root (same schema page). For blocks rendered by the `{% block %}` tag the docs example prints `<{{ tag }} class="{{ class }}">` directly, and the base theme has no `"tag"` key and no `block.shopify_attributes` anywhere, while relying on blocks being direct flex/grid children. **Whether Shopify adds a wrapper element, attributes or comment markers around `{% block %}` output is UNVERIFIED.** This decides whether the HTML contract survives on Liquid; it is the first thing to check on a preview store.
- `block.id`: exists inside a block file (`theme/blocks/video.liquid`, `gift-card.liquid`, `quantity-selector.liquid` build element ids from it; `quantity-selector` handles it being blank "in static/test contexts"). Uniqueness inside a `for` loop is UNVERIFIED.
- Limit: "A theme can contain at most 300 theme blocks. Every `.liquid` file in the theme's `/blocks` folder counts toward this limit" (`docs:/docs/storefronts/themes/architecture/blocks`). The base theme has 22.

### 2.2 `{% partial %}` and `@shopify/partial-rendering`

Documented (`docs:/docs/api/liquid/tags/partial`):

- `{% partial 'name' %} content {% endpartial %}`. "A partial is a named region of server-rendered HTML that JavaScript can refresh without a full page reload. Mark the region inline in a template or layout." The content is regular Liquid and renders with the page on first load. Partials are not files.
- `import {partials} from '@shopify/partial-rendering'; await partials.refresh('product-grid', 'product-count');`

From the base theme only (not confirmed by docs, because the Partials guide was not retrievable):

| Call | Evidence |
|---|---|
| `const html = await partials.fetch(...names, { signal })` | `theme/assets/s-cart.js:70` |
| `const html = await partials.fetch(...names, { url, signal })`; `url` is a full URL string and decides which page state is rendered (`?variant=`, filter params, the search action) | `theme/assets/s-variant-picker.js:125`, `theme/assets/s-live-form.js:276` |
| `partials.apply(html)`; called synchronously inside a `document.startViewTransition` callback; return value unused | `theme/assets/s-cart.js:85`, `theme/assets/view-transition.js` |

Behaviour inferred from that code:

- **Replace, not morph.** "Capture UI state before partial rendering replaces the DOM" (`s-cart.js:57`); "Applying product-form disconnects this picker" (`s-variant-picker.js`); `<details open>` state and focus are captured before and restored after every apply (`s-cart.js`, `s-live-form.js`). One exception: "`partials.apply()` preserves form control state" (`s-cart.js:388`), which the theme then has to undo for server-owned quantities (`input.value = input.defaultValue`).
- **No events are used.** The theme dispatches its own (`s-live-form:updated`). Whether the library emits any is UNVERIFIED.
- **One fetch, several partials**; the value passed from `fetch` to `apply` is opaque (named `html`). Its type is UNVERIFIED.
- **Where partials can be declared**: templates and layouts (docs); inside a block's body in a template (`theme/templates/product.liquid`: `{% partial 'product-form' %}` inside a `container` block body); inside captures passed to snippets and inside snippet files (`theme/snippets/filters.liquid`). Inside a **block file**: not seen anywhere; Theme Check does not flag it; UNVERIFIED.
- **A partial can be refreshed from any page** when it is declared in the layout (`cart-count`, `cart-drawer` in `theme/layout/theme.liquid`).
- **Duplicate names** are not flagged by Theme Check. Platform behaviour is UNVERIFIED.
- **What the server emits around a partial** (wrapper element, comment markers, attributes) is UNVERIFIED. The base theme places partials directly inside flex rows and inside `<s-product-form>`, which suggests no layout-affecting wrapper.
- **Module resolution**: `@shopify/partial-rendering` is absent from `theme/snippets/import-map.liquid` and from npm. It must be supplied by the platform (probably through `{{ content_for_header }}`). UNVERIFIED. The base theme's import map comment says "browsers ignore an import map that appears after the first module script", so the mechanism matters for script ordering.

### 2.3 The developer preview

- Changelog, July 21 2026 (`docs:/changelog/posts/developer-preview-liquid-block-and-partial-tags`): the preview adds `{% block %}` and `{% partial %}` and "new Theme Check rules for Liquid-first themes" that "catch syntax errors, excessive complexity, oversized files, invalid schema structure, and mismatches between block arguments, schemas, and `{% doc %}` declarations" (Theme Check 3.28.0). "Existing themes continue to work with sections, theme settings, and JSON templates."
- "To try it, create a development store with the Liquid July '26 developer preview. Start with the skeleton theme release candidate, or add the new tags to your own theme."
- Feature preview handle: `liquid_july_26_changes`, "Liquid July 2026 changes" (`docs:/docs/apps/build/stores/feature-previews`).
- Both tags are preview features (risk R5). Nothing here is guaranteed stable.

### 2.4 Theme Check rules that constrain block files

Versions: `@shopify/theme-check-node@4.0.2`, config `theme-check:recommended` (the package's `configs/recommended.yml`, read; and run).

| Check | Severity | Default | Effect on Ripple |
|---|---|---|---|
| `ValidBlockTagPlacement` | error | on | No `{% block %}` in `blocks/` or `snippets/`. |
| `BlockContentUsage` | error | on | Use `content`, never `block.content`. |
| `ValidBlockContentSettingType` | error | on | A schema setting MUST NOT be named `content` unless it is the string body. |
| `ReservedDocParamNames` | error | on | Param names `true`, `false`, `nil`, `blank`, `empty` are rejected. |
| `MaxFileSize` | error | on | `blocks`, `snippets`, `templates`, `layout`: 256 KB per file; `assets`: 20 MB; `locales`: 1.5 MB. Bytes inside `{% schema %}` are not counted (`docs:/docs/storefronts/themes/tools/theme-check/checks/max-file-size`). |
| `StaticStylesheetAndJavascriptTags` | error | on | No Liquid inside `{% stylesheet %}` / `{% javascript %}`. |
| `LiquidComplexity` | warning | `maxComplexity: 120` | Per file. +1 for each `if`, `unless`, `case`, `for`, `tablerow`, `paginate`, `elsif`, `when`, and each `and`/`or` in a condition (`docs:/docs/storefronts/themes/tools/theme-check/checks/liquid-complexity`). The Button snippet in section 5 scores about 20. |
| `LiquidNestingDepth` | warning | `maxDepth: 10` | Nested `if`/`unless`/`for`/`case`/`tablerow`. |
| `ExcessiveSettingsCount` | warning | `maxSettings: 40` | Far above the base theme's own cap of 3 styling settings. |
| `MissingBlockArguments` | warning | on | A param documented without brackets is required. `content` documented as required makes an empty body a warning. |
| `UnrecognizedBlockArguments` | warning | on | An argument that is neither a doc param nor a schema setting nor `content`. |
| `ValidBlockArgumentTypes` | warning | on | Literal type mismatches; bad literal for a LiquidDoc string union. **Schema type wins when an id is in both schema and doc**, so a `select` setting's options are not checked. `boolean` accepts any scalar. Variables are never checked. |
| `UnusedDocParam` | warning | on | Every documented param must be used in the file. |
| `VariableName` | warning | `snake_case` | Assigned variables are snake_case. Ripple param names in Liquid MUST be snake_case. |
| `MatchingTranslations` | warning | on | Every locale file must have the same keys. The base theme ships 35 storefront locale files and 22 schema locale files. |
| `ImgWidthAndHeight` | error | on | Every `<img>` needs `width` and `height`. |
| `ParserBlockingScript` | error | on | Scripts need `defer`, `async` or `type="module"`. |
| `HardcodedRoutes` | warning | on | Use `routes.*`. |
| `ValidScopedCSSClass` | warning | on | Did not fire in the spike for classes defined nowhere. Do not rely on it. |

Not checked by Theme Check at all (verified by absence, `spike/result.txt`): a `{% block %}` whose file does not exist; duplicate partial names; `{% partial %}` inside a block file.

### 2.5 Assets, modules, CSS

- `{{ 'file.css' | asset_url | stylesheet_tag: preload: true }}` (`theme/layout/theme.liquid`). `asset_url` appends a `?v=` cache key.
- `<script type="module" src="{{ 'file.js' | asset_url }}"></script>`; `script_tag` also accepts attributes: `{{ 'cart.js' | asset_url | script_tag: type: 'module' }}` (`docs:/docs/api/liquid/filters/script_tag`).
- Import maps: the base theme renders one `<script type="importmap">` first in `<head>`, mapping `@theme/*` to `asset_url` values, because "relative resolution drops the importing asset's `?v=` cache key" (`theme/AGENTS.md`, `theme/snippets/import-map.liquid`). A relative import between two assets would load a second copy of a module under a different URL.
- `{% stylesheet %}` / `{% javascript %}`: allowed in section, block and snippet files, one per file, no Liquid inside, concatenated by Shopify into `block-scripts.js` / `snippet-scripts.js` and injected through `content_for_header` with `defer` (`docs:/docs/storefronts/themes/best-practices/javascript-and-stylesheet-tags`). The base theme forbids both. Ripple MUST NOT use them: the code would be invisible to Ripple's versioning and conformance tests.
- Tailwind: the base theme authors `config/styles.css` (`@import "tailwindcss" source(none)` plus `@source` for `assets/*.js`, `blocks`, `snippets`, `templates`, `layout`) and loads the generated `assets/styles.min.css`. "Canvas/Sidekick compiles that source and persists generated `assets/styles.min.css` after theme changes... Classic Edit Code alone does not invoke the compiler." (`theme/AGENTS.md`). So on a Liquid theme, Tailwind utilities passed through `class` exist only if they appear literally in a scanned file and the compiler has run. "Never assemble utility names dynamically."
- Images: `{{ image | image_url: width: 1000 | image_tag: widths: '400, 600, 800, 1000', sizes: '...' }}` generates `srcset`, `width`, `height`. Default candidate widths are 352, 832, 1200, 1920; passing `widths` replaces them; the set is filtered to widths no larger than the `image_url` width; `preload: true` triggers Early Hints (`docs:/docs/storefronts/themes/best-practices/performance/use-filter-chains`). The base theme builds `srcset` by hand in a loop instead (`theme/blocks/container.liquid`).
- Money: `money`, `money_with_currency`, `money_without_trailing_zeros`. "Merchants can define the format of money filters in the Shopify admin" (`docs:/docs/storefronts/themes/pricing-payments/currency-formatting`). Input is in the currency's subunit.

### 2.6 Forms and commerce from Liquid

- `{% form 'product', product %}` prints `<form method="post" action="/cart/add" id="product_form_<id>" accept-charset="UTF-8" class="shopify-product-form" enctype="multipart/form-data">` plus hidden `form_type` and `utf8` inputs; `id:` and `class:` arguments override those attributes (`docs:/docs/api/liquid/tags/form`; the product output shape was copied into `spike/shim.mjs` by the earlier run of this spike and was not re-read in this run). `{{ form | payment_button }}` needs the `form` object and therefore must be inside the `{% form %}` tag in the **same file** (it cannot be in a block body, section 1 item 3).
- Native add to cart fields: `id` (variant id), `quantity`, `selling_plan`, `properties[<key>]`; the submit button is `name="add"` (`theme/templates/product.liquid`, `theme/assets/s-product-form.js`).
- Cart page: `<form action="{{ routes.cart_url }}" method="post">` (or `{% form 'cart', cart %}`); a submitter with `name="checkout"` goes to checkout, any other submitter updates the cart; quantities are `name="updates[]"` inputs in line order; remove is `<a href="{{ item.url_to_remove }}">`; note is `name="note"`; attributes are `name="attributes[<key>]"` (`docs:/docs/storefronts/themes/architecture/templates/cart`).
- Localization: `{% form 'localization' %}` posts to `/localization` with `_method=put` and `return_to`; fields `country_code`, `language_code` (`docs:/docs/api/liquid/tags/form`, `docs:/docs/storefronts/themes/markets/multiple-currencies-languages`; `language_code` is from the base theme's `snippets/localization-form.liquid` naming and general knowledge, not from a returned docs chunk).
- Search: `<form action="{{ routes.search_url }}" method="get">` with `name="q"`. The documented predictive search uses the Section Rendering API (`/search/suggest?section_id=`, `docs:/docs/api/ajax/reference/predictive-search`). The base theme does not: it re-fetches two partials with the search action as `url` (`theme/layout/theme.liquid`, `s-live-form`). Decision 4 (no Section Rendering API) is therefore satisfiable for predictive search with partials.

### 2.7 Standard Actions: the Storefront API from a theme

Source: `docs:/docs/api/storefront-events-and-actions/...` and `docs:/changelog/posts/standard-storefront-events-and-actions` (June 17 2026).

- `Shopify.actions.updateCart`, `getCart`, `openCart` "are available on every Liquid storefront". Default `updateCart` "Writes to the Storefront API, then refreshes the cart in place on a theme it recognizes. If it recognizes none, then it falls back to a full page reload."
- `updateCart(payload, options): Promise<UpdateCartResult>`.
  - `payload`: `{ cartId?: string, lines?: CartLineInput[], note?: string, discountCodes?: string[], attributes?: CartAttributeInput[] }`. `discountCodes` and `attributes` are the complete resulting sets.
  - `CartLineInput`: `{ id?: string, merchandiseId?: string, quantity?: number, attributes?: {key, value}[], sellingPlanId?: string }`. "A line with `merchandiseId` is an add, a line with `id` is an update, and `quantity: 0` removes it." `merchandiseId` is "The product variant GID, or a raw variant ID". `id` is "The existing line ID, from either the Storefront API or the AJAX cart API". So Liquid's `variant.id` and `item.key` can be passed unchanged.
  - `options`: `{ signal?: AbortSignal, event?: { context?: 'product' | 'cart' | 'dialog' | 'standard-action', detail?: Record<string, unknown> } }`.
  - Result: `{ cart: CartSummary, userErrors?: [...], warnings?: [...], detail? }`. "A rejected change resolves with `userErrors` rather than throwing."
- `Shopify.actions.updateCart.configure({ eventTarget: (meta) => EventTarget | null, handler: (defaultHandler, payload, options) => Promise<Result> })`. "Only the first `configure` call on an action takes effect. Later calls return `false`." Register "inside a `DOMContentLoaded` listener. Put it above `{{ content_for_header }}`." `eventTarget` is required for `updateCart`. `getCart` is not configurable.
- `updateCart` emits the cart events itself; a theme MUST NOT dispatch `shopify:cart:*` after calling it (`docs:/docs/api/storefront-events-and-actions/events/dispatch`).
- The base theme uses exactly this: `window.Shopify.actions.updateCart({ lines: [{ merchandiseId, quantity }] }, { event, signal })` from `<s-product-form>`, and a `configure` handler that calls `defaultHandler()` then refreshes cart partials (`theme/assets/s-product-form.js`, `theme/snippets/standard-actions-config.liquid`, `theme/assets/standard-actions-override.js`).
- Relation to Hydrogen (decision 4, risks R2/R3): another investigator's spike (`ripple/docs/research/spikes/hydrogen-core/result.txt`) records that a native Liquid form passed straight to Hydrogen's form handler fails with `Unknown cart form intent: ""` (scenario 2) and has a scenario titled "theme/app configured updateCart first (configure returns false)" (scenario 5). This report does not re-derive those; it only fixes the Liquid-side consequences in sections 6 and 10.

### 2.8 mock.shop and Liquid

- "mock.shop is a public Shopify Storefront API that serves fictional stores... Carts work... checkout is a mock... Shop Pay and the Customer Account API aren't available." (`docs:/docs/storefronts/headless/mock-shop`). It serves `/api` only. It cannot render Liquid, cannot host a theme, and its carts are not the cart of any Liquid storefront.
- A Liquid theme needs a real store. The preview needs "a development store with the Liquid July '26 developer preview".
- This session's tool list contains tools named `find-mock-shop-catalogs` and `import-mock-shop-catalog`. Their names suggest a mock.shop catalog can be imported into a real store. Not exercised here; UNVERIFIED. If it works, it is the way to honour decision 10 on Liquid: same catalog, real store.

---

## 3. The base theme: where it confirms, constrains or conflicts

| Base theme convention | Verdict for Ripple | Resolution |
|---|---|---|
| Blocks only called from templates/layouts; body through `{{ content }}` | **Constrains.** It is also a platform rule. | Ripple parts are blocks nested in the template. Embedded markup comes from snippets (rule L-3). |
| "Don't give blocks content params such as `title`, `body`, `heading`" | **Constrains.** | Every author-content region is the body of some block (rule L-6). The earlier draft's `title:` param on AccordionItem was replaced by an `rp-accordion-summary` part. |
| Every block accepts `class` and `attributes` | **Confirms**, with a safety rule. | Keep both. `class` is escaped; `attributes` is raw and documented as such. First-class params (`aria_label`, `id`) remove most uses of `attributes`. |
| Schema setting read and overridden by bare name | **Confirms.** | Enumerated props that a merchant should edit are `select` settings whose ids and values equal the prop names and tokens (section 4.2). |
| Editor values are literal Tailwind classes (`py-16`, `button-primary`) | **Conflicts** with "props are tokens printed as `data-` attributes". | Schema option values are prop tokens (`md`, `outline`). Same recommendation as `base-theme-report` item 23. |
| Captured block calls passed as slot params (`templates/collection.liquid` builds 5 button captures for one `filters` snippet) | **Conflicts** with "simpler". It is the direct cost of forbidding block calls in snippets while keeping each button merchant-editable. | Ripple components print their own internal buttons through the Button snippet with fixed props. Captured slots are a last resort (rule L-7). |
| Utility-only styling, "no component CSS files", "do not create custom component class names" | **Conflicts** with Ripple's `rp-` classes and per-component CSS. | Out of scope here (styling investigator). For Liquid mechanics: `rp-` classes in a precompiled asset pass Theme Check and need no compiler. |
| `config/styles.css` compiled by Canvas/Sidekick to `assets/styles.min.css` | **Constrains** how tokens reach Tailwind utilities. | Section 7. |
| Native `<dialog>` + `commandfor`/`command`, inline polyfill | **Conflicts** with `ui-dialog` in the current Ripple plan. `base-theme-report` recommends native `<dialog>`. | Not decided here. Both are printable from Liquid; both need the root id passed to the opener. Section 5.4 shows the `ui-dialog` variant because its zero-diff markup was already proven. |
| One custom element per JS file, module tag at the call site, `@theme/*` import map | **Constrains.** | Section 7: no relative imports between Ripple assets. |
| `partials.fetch` + `partials.apply` after `Shopify.actions.updateCart` | **Confirms** "structural re-render belongs to the host". | `rp-*` elements reflect state; a Ripple helper refreshes named partials (section 6). |
| Cart quantity buttons are `type="button"` with `--update-quantity` commands; discount input is outside the form | **Conflicts** with decision 2: neither works without JavaScript. | Ripple cart markup uses `name="updates[]"` inputs and a submit button inside the cart form (section 2.6). |
| Disabled button is `aria-disabled="true"`, not native `disabled`, "so the button remains focusable and selectable in the theme editor" | **Conflicts** with a single contract. | Contract uses native `disabled` for `<button>` (it also blocks no-JS submission). Editor selectability of disabled buttons is an open question for Ben. |
| Every string through `{{ 'key' | t }}`; 35 locale files | **Constrains.** | Ripple strings live under a `ripple.` namespace; `ripple add` writes keys to every locale file present (rule L-10). |
| `block.id` for element ids | **Constrains.** Not available to the body and not available in other hosts. | Ids that are part of the contract are explicit params (rule L-8). |

---

## 4. Design: a Ripple component as a Liquid block

Rules are numbered L-n so the spec can cite them.

### 4.1 Files and names

- **L-1 File per component or part.** Every Ripple component that a template author calls is `blocks/<block-name>.liquid`. A component with parts has one block file per part: `rp-accordion`, `rp-accordion-item`, `rp-accordion-summary`, `rp-accordion-panel`. Part names are `<component>-<part>`, matching the contract class `rp-<component>-<part>`.
- **L-2 Prefix.** Examples here use `rp-` for block and snippet file names. `base-theme-report` recommends unprefixed names in a Ripple-owned base theme with an optional prefix in the scaffolder. The mechanics are identical; the spec MUST pick one default and make the prefix a single manifest-level setting, because block names are hard-coded at every call site.
- **L-3 Snippet as single source of embedded markup.** A component whose markup is printed inside another Ripple block or snippet (Button inside DialogTrigger, Price inside ProductCard, Icon everywhere) has its markup in `snippets/<name>.liquid`, and its block file is a thin wrapper: `{% doc %}`, one `{% render %}` passing every param, `{% schema %}`. A component that is never embedded has its markup directly in the block file. The manifest decides (`embeddedBy` non-empty means snippet). A component's markup MUST exist in exactly one file.
- **L-4 Block-file budget.** The spec MUST state a maximum number of Ripple block files (recommended: 150, half of the platform's 300) and count parts against it. `ripple add` installs block files per component, never all of them.

### 4.2 Params mirror props

- **L-5 Name mapping.** Liquid param name = prop name converted to snake_case (`fullWidth` to `full_width`, `ariaLabel` to `aria_label`). The manifest MUST record the Liquid name and MUST reject: `true`, `false`, `nil`, `blank`, `empty` (Theme Check error), `content`, `block`, `section`, `form`, `settings`, `for`, and any Shopify global object name the block also needs to read.
- **Where a prop is declared.** Per prop, one manifest flag:
  - `setting` (merchant-editable): declared in `{% schema %}` with `id` = Liquid param name. Enumerations are `select` settings whose option values are the prop's tokens; the schema `default` equals the contract default. Listed in the `{% doc %}` description text, **not** as `@param` (base theme rule; and a doc union is ignored by Theme Check once the id is in the schema). Maximum 3 per block.
  - `param` (code-level): declared as `@param` in `{% doc %}` with the tightest type LiquidDoc allows: a string-literal union for enumerations, `boolean`, `string`, `number`, or an object type (`product`, `variant`, `line_item`).
- **Booleans.** A boolean prop is true only when the value is the Liquid boolean `true`: `{% if disabled == true %}`. The string `'false'` is truthy in Liquid (`spike/sem.rb`: `str_false_truthy=[yes]`), so truthiness tests are forbidden for boolean props.
- **Enumerations are validated at render time** with an allow-list and fall back to the default. `contains` on an array made with `split` matches whole elements, not substrings, and is false for `nil` (verified in Ruby Liquid 5.14 and liquidjs, `spike/result.txt`):

  ```liquid
  assign allowed_sizes = 'sm,md,lg' | split: ','
  unless allowed_sizes contains size
    assign size = 'md'
  endunless
  ```

  This is required, not defensive style: Theme Check does not check schema-backed enumerations or variables, and what Shopify does with an out-of-range kwarg for a `select` setting is UNVERIFIED.
- **Responsive prop strings pass through unchanged.** `gap: '2 md:6'` is printed as `data-gap="2 md:6"` after `| escape`. The block does not parse or validate the tokens: doing so in Liquid needs a loop per prop and adds complexity for no rendering benefit, because an unknown token matches no CSS selector. Validation of responsive strings belongs to `ripple check`, which MUST read `{% block %}` arguments in `.liquid` files. Scale props MUST be passed as quoted strings; Theme Check then reports `gap: 4` ("expected string, got number").
- **Element choice** (`tag`, `as`): allow-list, then interpolate `<{{ tag }}`. Never interpolate an unvalidated tag name.
- **Objects.** Resource props take the Liquid drop (`product: product`), as in the base theme.
- **No filters in arguments.** Translated or computed values are assigned on the line before the call.

### 4.3 Regions, slots and parts

- **L-6 One outlet per block.** A block file prints `{{ content }}` at most once. A component with several author-content regions is split into parts, each a block with its own single outlet, nested in the parent's body in contract order. This is the same shape as compound components in React (`<AccordionItem><AccordionSummary/><AccordionPanel/></AccordionItem>`), keeps every region reachable for editor blocks, and needs no captures.
- **L-7 Captured slot params are the exception.** Use `{% capture %}` plus a named param only when the contract forces a region to be printed at a place that cannot be the single outlet and cannot be a part (no case found in the five examples). When used, the param is documented as HTML and printed without `escape`. Blocks inside a capture are legal in templates and layouts (`theme/layout/theme.liquid`; spike case `slot-captured-in-caller`).
- **Markup the author does not write** (Dialog close button, backdrop, Accordion chevron, error message part, live region) is printed by the owning block, using snippets for embedded components, with strings from locale keys.
- **Loops are written by the author**: `{% for product in collection.products %}{% block 'rp-product-card', product: product %}{% endblock %}{% endfor %}`. A parent block cannot iterate or wrap its children.

### 4.4 Ids, ARIA and initial state

- **L-8 Explicit ids.** When the contract links elements by id, the root takes a required `id` param and every linked part takes a param naming that id (`dialog: 'size-guide'`). The part derives its own id with the table in `uisdk-report` section 2.2 (`<id>-trigger`, `<id>-title`). `block.id` MUST NOT be used for contract ids: the body cannot read it and other hosts do not have it.
- **L-9 Server prints the initial state.** The block prints every attribute the element would write for the initial state (`uisdk-report` 9.2): `hidden` on closed content, `data-closed`, `data-slot`, `role`, `aria-*`, `type="button"`. Initial state that is a prop (`open: true` on AccordionItem, selected tab) is printed by each part from its own params; the author passes it to each part that needs it.
- Prefer contracts that need no cross-references: `<details name>` for accordions, `<label>` wrapping its control, native `<dialog>`.

### 4.5 Strings

- **L-10 Locale keys.** Every string a Ripple block prints itself is `{{ 'ripple.<component>.<key>' | t }}`. Schema labels are `t:ripple...` keys in `locales/*.schema.json`. The manifest holds the English default for each key; `ripple add` merges keys into every `locales/*.json` present (Theme Check `MatchingTranslations` warns otherwise). The same English defaults are the default strings in React and Remix, so fixtures match.

### 4.6 Escaping

- **L-11** Every param printed into an attribute value is `| escape`d and the attribute is double-quoted. Validated enumerations may be printed bare. `class` is escaped (spike case `button-class-cannot-break-out`). `attributes` is the only raw attribute input. `content` is HTML by definition. Text that a block prints from data (`product.title`) is `| escape`d; HTML fields (`product.description`) are not.

---

## 5. Example files

All files below are in `spike/theme/`, pass Theme Check with 0 offenses, and are exercised by `spike/render.mjs`.

### 5.1 Button (snippet + block wrapper)

`snippets/rp-button.liquid`:

```liquid
{% doc %}
  Ripple Button markup. Single source of the Button HTML contract for Liquid.
  Templates and layouts call the `rp-button` block. Block and snippet files
  that need a button render this snippet.

  Root element: <a> when `href` is set, otherwise <button>.

  @param {'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'} [variant] - Visual style. Default: 'primary'.
  @param {'sm' | 'md' | 'lg'} [size] - Control size. Default: 'md'.
  @param {'button' | 'submit' | 'reset'} [type] - Native button type. Ignored when `href` is set. Default: 'button'.
  @param {string} [href] - When set, the root element is a link.
  @param {boolean} [disabled] - Pass the boolean `true`. Any other value is ignored.
  @param {boolean} [full_width] - Pass the boolean `true` to stretch to the container width.
  @param {string} [name] - Form field name (button only).
  @param {string} [value] - Form field value (button only).
  @param {string} [aria_label] - Accessible name. Required when the content is only an icon.
  @param {string} [id] - Root element id.
  @param {string} [class] - Extra classes appended after `rp-button`.
  @param {string} [attributes] - RAW, unescaped HTML attributes appended to the root element. Never pass shopper or merchant input.
  @param {string} content - The label, as HTML. Required.

  @example
  {% render 'rp-button', type: 'submit', content: label %}
{% enddoc %}

{%- liquid
  assign allowed_variants = 'primary,secondary,outline,ghost,link,destructive' | split: ','
  unless allowed_variants contains variant
    assign variant = 'primary'
  endunless
  assign allowed_sizes = 'sm,md,lg' | split: ','
  unless allowed_sizes contains size
    assign size = 'md'
  endunless
  assign allowed_types = 'button,submit,reset' | split: ','
  unless allowed_types contains type
    assign type = 'button'
  endunless
-%}
{%- if href != blank -%}
  <a
    class="rp-button {{ class | escape }}"
    {% if id != blank %}id="{{ id | escape }}"{% endif %}
    href="{{ href | escape }}"
    {% if disabled == true %}aria-disabled="true" tabindex="-1"{% endif %}
    data-variant="{{ variant }}"
    data-size="{{ size }}"
    {% if full_width == true %}data-full-width{% endif %}
    {% if aria_label != blank %}aria-label="{{ aria_label | escape }}"{% endif %}
    {{ attributes }}
  >
    {{- content -}}
  </a>
{%- else -%}
  <button
    class="rp-button {{ class | escape }}"
    {% if id != blank %}id="{{ id | escape }}"{% endif %}
    type="{{ type }}"
    {% if name != blank %}name="{{ name | escape }}"{% endif %}
    {% if value != blank %}value="{{ value | escape }}"{% endif %}
    {% if disabled == true %}disabled{% endif %}
    data-variant="{{ variant }}"
    data-size="{{ size }}"
    {% if full_width == true %}data-full-width{% endif %}
    {% if aria_label != blank %}aria-label="{{ aria_label | escape }}"{% endif %}
    {{ attributes }}
  >
    {{- content -}}
  </button>
{%- endif -%}
```

`blocks/rp-button.liquid`:

```liquid
{% doc %}
  Ripple Button. Static component: no JavaScript.
  Renders an <a> when `href` is set, otherwise a <button>.

  `variant` and `size` are schema settings. Override them at the call site
  with bare arguments: `variant: 'outline'`, `size: 'lg'`.
  Allowed `variant`: primary, secondary, outline, ghost, link, destructive.
  Allowed `size`: sm, md, lg.

  @param {'button' | 'submit' | 'reset'} [type] - Native button type. Ignored when `href` is set. Default: 'button'.
  @param {string} [href] - When set, the root element is a link.
  @param {boolean} [disabled] - Pass the boolean `true`. Any other value is ignored.
  @param {boolean} [full_width] - Pass the boolean `true` to stretch to the container width.
  @param {string} [name] - Form field name (button only).
  @param {string} [value] - Form field value (button only).
  @param {string} [aria_label] - Accessible name. Required when the content is only an icon.
  @param {string} [id] - Root element id.
  @param {string} [class] - Extra classes appended after `rp-button`.
  @param {string} [attributes] - RAW, unescaped HTML attributes appended to the root element. Never pass shopper or merchant input.
  @param {string} content - The label. Required.

  @example
  {% block 'rp-button', type: 'submit' %}Add to cart{% endblock %}

  @example
  {% block 'rp-button', variant: 'outline', href: routes.cart_url %}View cart{% endblock %}
{% enddoc %}

{% render 'rp-button',
  variant: variant,
  size: size,
  type: type,
  href: href,
  disabled: disabled,
  full_width: full_width,
  name: name,
  value: value,
  aria_label: aria_label,
  id: id,
  class: class,
  attributes: attributes,
  content: content
%}

{% schema %}
{
  "name": "t:ripple.blocks.button",
  "settings": [
    {
      "type": "select",
      "id": "variant",
      "label": "t:ripple.props.variant",
      "default": "primary",
      "options": [
        { "value": "primary", "label": "t:ripple.props.primary" },
        { "value": "secondary", "label": "t:ripple.props.secondary" },
        { "value": "outline", "label": "t:ripple.props.outline" },
        { "value": "ghost", "label": "t:ripple.props.ghost" },
        { "value": "link", "label": "t:ripple.props.link" },
        { "value": "destructive", "label": "t:ripple.props.destructive" }
      ]
    },
    {
      "type": "select",
      "id": "size",
      "label": "t:ripple.props.size",
      "default": "md",
      "options": [
        { "value": "sm", "label": "t:ripple.props.sm" },
        { "value": "md", "label": "t:ripple.props.md" },
        { "value": "lg", "label": "t:ripple.props.lg" }
      ]
    }
  ]
}
{% endschema %}
```

Call and output:

```liquid
{% block 'rp-button', variant: 'outline', size: 'lg', href: routes.cart_url, class: 'w-full' %}View cart{% endblock %}
```
```html
<a class="rp-button w-full" href="/cart" data-variant="outline" data-size="lg">View cart</a>
```

### 5.2 Stack (layout, responsive props)

`blocks/rp-stack.liquid`:

```liquid
{% doc %}
  Ripple Stack. Vertical flex layout. Static component: no JavaScript.

  Scale props (`gap`, `p`, `px`, `py`) and alignment props (`align`, `justify`)
  take one token, or a responsive list: tokens separated by one space, where
  every token after the first has a Tailwind breakpoint prefix.
  Example: '2 md:6 lg:8'. Always pass these props as quoted strings.

  @param {'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'nav' | 'main' | 'ul' | 'ol'} [tag] - Root element. Default: 'div'.
  @param {string} [gap] - Spacing scale token(s). Example: '4' or '2 md:6'.
  @param {string} [align] - Cross-axis alignment token(s): start, center, end, stretch, baseline.
  @param {string} [justify] - Main-axis alignment token(s): start, center, end, between.
  @param {string} [p] - Padding token(s).
  @param {string} [px] - Inline padding token(s).
  @param {string} [py] - Block padding token(s).
  @param {string} [id] - Root element id.
  @param {string} [class] - Extra classes appended after `rp-stack`.
  @param {string} [attributes] - RAW, unescaped HTML attributes appended to the root element. Never pass shopper or merchant input.
  @param {string} [content] - Children.

  @example
  {% block 'rp-stack', gap: '2 md:6', align: 'start' %}
    <p>One</p>
    <p>Two</p>
  {% endblock %}
{% enddoc %}

{%- liquid
  assign allowed_tags = 'div,section,article,aside,header,footer,nav,main,ul,ol' | split: ','
  unless allowed_tags contains tag
    assign tag = 'div'
  endunless
-%}
<{{ tag }}
  class="rp-stack {{ class | escape }}"
  {% if id != blank %}id="{{ id | escape }}"{% endif %}
  {% if gap != blank %}data-gap="{{ gap | escape }}"{% endif %}
  {% if align != blank %}data-align="{{ align | escape }}"{% endif %}
  {% if justify != blank %}data-justify="{{ justify | escape }}"{% endif %}
  {% if p != blank %}data-p="{{ p | escape }}"{% endif %}
  {% if px != blank %}data-px="{{ px | escape }}"{% endif %}
  {% if py != blank %}data-py="{{ py | escape }}"{% endif %}
  {{ attributes }}
>
  {{ content }}
</{{ tag }}>

{% schema %}
{
  "name": "t:ripple.blocks.stack",
  "settings": []
}
{% endschema %}
```

Call and output:

```liquid
{% block 'rp-stack', tag: 'ul', gap: '2 md:6', align: 'start' %}<li>One</li>{% endblock %}
```
```html
<ul class="rp-stack" data-gap="2 md:6" data-align="start"><li>One</li></ul>
```

### 5.3 Accordion (four part blocks, native `<details>`, zero JavaScript)

`blocks/rp-accordion.liquid`:

```liquid
{% doc %}
  Ripple Accordion. Static component built on native <details>: works with no JavaScript.
  The body MUST contain only `rp-accordion-item` blocks.

  `variant` is a schema setting. Allowed: default, bordered.

  @param {string} [id] - Root element id.
  @param {string} [class] - Extra classes appended after `rp-accordion`.
  @param {string} content - One or more `rp-accordion-item` blocks. Required.

  @example
  {% block 'rp-accordion' %}
    {% block 'rp-accordion-item', name: 'faq', open: true %}
      {% block 'rp-accordion-summary' %}Shipping{% endblock %}
      {% block 'rp-accordion-panel' %}<p>Ships in 2 days.</p>{% endblock %}
    {% endblock %}
  {% endblock %}
{% enddoc %}

{%- liquid
  assign allowed_variants = 'default,bordered' | split: ','
  unless allowed_variants contains variant
    assign variant = 'default'
  endunless
-%}
<div
  class="rp-accordion {{ class | escape }}"
  {% if id != blank %}id="{{ id | escape }}"{% endif %}
  data-variant="{{ variant }}"
>
  {{ content }}
</div>

{% schema %}
{
  "name": "t:ripple.blocks.accordion",
  "settings": [
    {
      "type": "select",
      "id": "variant",
      "label": "t:ripple.props.variant",
      "default": "default",
      "options": [
        { "value": "default", "label": "t:ripple.props.default" },
        { "value": "bordered", "label": "t:ripple.props.bordered" }
      ]
    }
  ]
}
{% endschema %}
```

`blocks/rp-accordion-item.liquid`:

```liquid
{% doc %}
  One item of a Ripple Accordion. Renders a native <details>. The browser owns
  the open state and the accessibility semantics, so this block prints no ARIA.
  The body MUST contain exactly one `rp-accordion-summary` block followed by
  exactly one `rp-accordion-panel` block.

  @param {string} [name] - Group name. Items with the same name close each other (single-open accordion). A parent block cannot pass values to its body, so pass `name` to every item.
  @param {boolean} [open] - Pass the boolean `true` to render the item open.
  @param {string} [id] - Root element id.
  @param {string} [class] - Extra classes appended after `rp-accordion-item`.
  @param {string} content - The summary block, then the panel block. Required.

  @example
  {% block 'rp-accordion-item', name: 'faq', open: true %}
    {% block 'rp-accordion-summary' %}Shipping{% endblock %}
    {% block 'rp-accordion-panel' %}<p>Ships in 2 days.</p>{% endblock %}
  {% endblock %}
{% enddoc %}

<details
  class="rp-accordion-item {{ class | escape }}"
  {% if id != blank %}id="{{ id | escape }}"{% endif %}
  {% if name != blank %}name="{{ name | escape }}"{% endif %}
  {% if open == true %}open{% endif %}
>
  {{ content }}
</details>

{% schema %}
{
  "name": "t:ripple.blocks.accordion_item",
  "settings": []
}
{% endschema %}
```

`blocks/rp-accordion-summary.liquid` (markup only; its `{% doc %}` and `{% schema %}` follow the same pattern, full file in `spike/theme/blocks/`):

```liquid
<summary class="rp-accordion-summary {{ class | escape }}">
  {{- content -}}
</summary>
```

`blocks/rp-accordion-panel.liquid` (same remark):

```liquid
<div class="rp-accordion-panel {{ class | escape }}">
  {{ content }}
</div>
```

Output for two items with `name: 'faq'`, the first with `open: true`:

```html
<div class="rp-accordion" data-variant="default">
  <details class="rp-accordion-item" name="faq" open>
    <summary class="rp-accordion-summary">Shipping</summary>
    <div class="rp-accordion-panel"><p>2 days</p></div>
  </details>
  <details class="rp-accordion-item" name="faq">
    <summary class="rp-accordion-summary">Care</summary>
    <div class="rp-accordion-panel"><p>Wash cold</p></div>
  </details>
</div>
```

### 5.4 Dialog (`ui-dialog` contract, ids passed to parts)

The printed markup is the closed-state markup of `uisdk-report` section 3.2 plus `rp-` classes. Loaded in Chromium with the real `@ui-sdk/web` build, it produced `mutations on upgrade: []`, opened on click (`role="dialog"`, `aria-labelledby="sg-title"`) and closed on Escape (`spike/upgrade.mjs`, `spike/result.txt`).

`blocks/rp-dialog.liquid` (markup only):

```liquid
<ui-dialog id="{{ id | escape }}" class="rp-dialog {{ class | escape }}">
  {{ content }}
</ui-dialog>
```

`blocks/rp-dialog-trigger.liquid`:

```liquid
{% doc %}
  The button that opens a `rp-dialog`. Prints a Ripple Button inside
  <ui-dialog-trigger>, with the ARIA and state attributes of the closed state.

  `variant` and `size` are schema settings with the same values as `rp-button`.

  @param {string} dialog - The `id` passed to the parent `rp-dialog`. Required.
  @param {string} [aria_label] - Accessible name. Required when the content is only an icon.
  @param {string} [class] - Extra classes appended after `rp-button`.
  @param {string} content - The button label. Required.

  @example
  {% block 'rp-dialog-trigger', dialog: 'size-guide', variant: 'link' %}Size guide{% endblock %}
{% enddoc %}

{%- liquid
  assign trigger_id = dialog | append: '-trigger'
  assign trigger_attributes = 'aria-haspopup="dialog" data-closed data-slot="dialog-trigger"'
-%}
<ui-dialog-trigger>
  {%- render 'rp-button', variant: variant, size: size, type: 'button', id: trigger_id, aria_label: aria_label, class: class, attributes: trigger_attributes, content: content -%}
</ui-dialog-trigger>

{% schema %}
{
  "name": "t:ripple.blocks.dialog_trigger",
  "settings": [
    {
      "type": "select",
      "id": "variant",
      "label": "t:ripple.props.variant",
      "default": "primary",
      "options": [
        { "value": "primary", "label": "t:ripple.props.primary" },
        { "value": "secondary", "label": "t:ripple.props.secondary" },
        { "value": "outline", "label": "t:ripple.props.outline" },
        { "value": "ghost", "label": "t:ripple.props.ghost" },
        { "value": "link", "label": "t:ripple.props.link" },
        { "value": "destructive", "label": "t:ripple.props.destructive" }
      ]
    },
    {
      "type": "select",
      "id": "size",
      "label": "t:ripple.props.size",
      "default": "md",
      "options": [
        { "value": "sm", "label": "t:ripple.props.sm" },
        { "value": "md", "label": "t:ripple.props.md" },
        { "value": "lg", "label": "t:ripple.props.lg" }
      ]
    }
  ]
}
{% endschema %}
```

`blocks/rp-dialog-content.liquid`:

```liquid
{% doc %}
  The panel of a `rp-dialog`. Printed with `hidden`, so it is not shown until
  ripple.js opens the dialog. Prints the backdrop and the close button.

  @param {string} [class] - Extra classes appended after `rp-dialog-content`.
  @param {string} content - One `rp-dialog-title` block, then the dialog body. Required.

  @example
  {% block 'rp-dialog-content' %}
    {% block 'rp-dialog-title', dialog: 'size-guide' %}Size guide{% endblock %}
    <p>Measure your chest.</p>
  {% endblock %}
{% enddoc %}

{%- liquid
  assign close_label = 'ripple.dialog.close' | t
  assign close_attributes = 'data-slot="dialog-close"'
-%}
<ui-dialog-backdrop class="rp-dialog-backdrop" hidden data-slot="dialog-backdrop"></ui-dialog-backdrop>
<ui-dialog-content class="rp-dialog-content {{ class | escape }}" hidden data-slot="dialog-content">
  {{ content }}
  <ui-dialog-close>
    {%- render 'rp-button', variant: 'ghost', size: 'sm', type: 'button', class: 'rp-dialog-close', attributes: close_attributes, content: close_label -%}
  </ui-dialog-close>
</ui-dialog-content>

{% schema %}
{
  "name": "t:ripple.blocks.dialog_content",
  "settings": []
}
{% endschema %}
```

`blocks/rp-dialog-title.liquid` (markup only):

```liquid
<ui-dialog-title
  class="rp-dialog-title {{ class | escape }}"
  id="{{ dialog | escape }}-title"
  role="heading"
  aria-level="2"
  data-slot="dialog-title"
>
  {{- content -}}
</ui-dialog-title>
```

Call:

```liquid
{% block 'rp-dialog', id: 'size-guide' %}
  {% block 'rp-dialog-trigger', dialog: 'size-guide', variant: 'link' %}{{ 'ripple.product.size_guide' | t }}{% endblock %}
  {% block 'rp-dialog-content' %}
    {% block 'rp-dialog-title', dialog: 'size-guide' %}{{ 'ripple.product.size_guide' | t }}{% endblock %}
    <p>S, M, L.</p>
  {% endblock %}
{% endblock %}
```

Notes:

- `rp-dialog-trigger` cannot contain a `{% block 'rp-button' %}` call written by Ripple, and asking the author to write the button with the right ARIA would leak the contract. Rendering the Button snippet with extra attributes solves it (rule L-3).
- If the spec chooses native `<dialog>` instead (`base-theme-report`), the Liquid shape stays the same: `id` on the dialog and `dialog:` on the opener, printed as `commandfor`.

### 5.5 ProductForm (commerce, no-JS fallback)

`blocks/rp-product-form.liquid`:

```liquid
{% doc %}
  Ripple ProductForm. Commerce component.

  Server HTML is a native Shopify product form. It posts `id` (the variant id)
  and every named control in the body (`quantity`, `selling_plan`,
  `properties[...]`) to the cart, so add to cart works when JavaScript never loads.
  When ripple.js loads, <rp-product-form> handles the submit: it adds the line
  through the Hydrogen cart store and reflects state on itself
  (`data-pending`, the error part).

  The body is rendered before this block runs. It cannot read `form`.
  To show accelerated checkout buttons, pass `accelerated_checkout: true`;
  this block prints them after the body.

  @param {product} product - The product to sell. Required.
  @param {variant} [variant] - Selected variant. Default: product.selected_or_first_available_variant.
  @param {boolean} [accelerated_checkout] - Pass the boolean `true` to print Shopify accelerated checkout buttons after the body.
  @param {string} [id] - Id of the <form> element. Default: 'rp-product-form-' followed by the product id.
  @param {string} [class] - Extra classes appended after `rp-product-form`.
  @param {string} content - Form controls and one submit `rp-button` with `name: 'add'`. Required.

  @example
  {% block 'rp-product-form', product: product %}
    {% block 'rp-button', type: 'submit', name: 'add' %}Add to cart{% endblock %}
  {% endblock %}
{% enddoc %}

{%- liquid
  assign variant = variant | default: product.selected_or_first_available_variant
  assign form_id = id
  if form_id == blank
    assign form_id = 'rp-product-form-' | append: product.id
  endif
-%}
<rp-product-form
  class="rp-product-form {{ class | escape }}"
  data-product-id="gid://shopify/Product/{{ product.id }}"
  {% unless variant.available %}data-unavailable{% endunless %}
>
  {% form 'product', product, id: form_id, class: 'rp-product-form-fields' %}
    <input type="hidden" name="id" value="{{ variant.id }}" data-rp-field="merchandise-id">
    {{ content }}
    <p class="rp-form-message" data-rp-part="error" data-tone="critical" role="alert" hidden></p>
    {% if accelerated_checkout == true %}
      <div class="rp-product-form-accelerated">{{ form | payment_button }}</div>
    {% endif %}
  {% endform %}
</rp-product-form>

{% schema %}
{
  "name": "t:ripple.blocks.product_form",
  "settings": []
}
{% endschema %}
```

Template usage (`spike/theme/templates/product.liquid`):

```liquid
{% liquid
  assign current_variant = product.selected_or_first_available_variant
  assign sold_out = true
  if current_variant.available
    assign sold_out = false
  endif
%}

{% block 'rp-stack', tag: 'section', gap: '4 md:8', py: '6' %}
  <h1>{{ product.title | escape }}</h1>

  {% comment %} ripple.js refreshes this partial after a variant change. Keep the name. {% endcomment %}
  {% partial 'rp-product-buy' %}
    <p>{{ current_variant.price | money }}</p>
    {% unless sold_out %}
      {% block 'rp-badge', tone: 'success' %}{{ 'ripple.product.in_stock' | t }}{% endblock %}
    {% endunless %}

    {% block 'rp-product-form', product: product, variant: current_variant, accelerated_checkout: true %}
      {% block 'rp-stack', gap: '3' %}
        <label for="rp-quantity">{{ 'ripple.product.quantity' | t }}</label>
        <input id="rp-quantity" class="rp-input" type="number" name="quantity" value="1" min="1" inputmode="numeric">
        {% block 'rp-button', type: 'submit', name: 'add', size: 'lg', full_width: true, disabled: sold_out %}
          {% if sold_out %}
            {{ 'ripple.product.sold_out' | t }}
          {% else %}
            {{ 'ripple.product.add_to_cart' | t }}
          {% endif %}
        {% endblock %}
      {% endblock %}
    {% endblock %}
  {% endpartial %}

  {% block 'rp-dialog', id: 'size-guide' %}
    {% block 'rp-dialog-trigger', dialog: 'size-guide', variant: 'link' %}{{ 'ripple.product.size_guide' | t }}{% endblock %}
    {% block 'rp-dialog-content' %}
      {% block 'rp-dialog-title', dialog: 'size-guide' %}{{ 'ripple.product.size_guide' | t }}{% endblock %}
      <p>S, M, L.</p>
    {% endblock %}
  {% endblock %}

  {% block 'rp-accordion', variant: 'bordered' %}
    {% block 'rp-accordion-item', name: 'product-details', open: true %}
      {% block 'rp-accordion-summary' %}{{ 'ripple.product.shipping' | t }}{% endblock %}
      {% block 'rp-accordion-panel' %}<p>Ships in 2 days.</p>{% endblock %}
    {% endblock %}
    {% block 'rp-accordion-item', name: 'product-details' %}
      {% block 'rp-accordion-summary' %}{{ 'ripple.product.materials' | t }}{% endblock %}
      {% block 'rp-accordion-panel' %}{{ product.description }}{% endblock %}
    {% endblock %}
  {% endblock %}
{% endblock %}
```

Output of the form for product 7, variant 42 (from `spike/render.mjs`; the `{% form %}` output shape is the shim's copy of the Liquid reference, the payment button is a placeholder for platform markup):

```html
<rp-product-form class="rp-product-form" data-product-id="gid://shopify/Product/7">
  <form method="post" action="/cart/add" id="rp-product-form-7" accept-charset="UTF-8" class="rp-product-form-fields" enctype="multipart/form-data">
    <input type="hidden" name="form_type" value="product"><input type="hidden" name="utf8" value="✓">
    <input type="hidden" name="id" value="42" data-rp-field="merchandise-id">
    <button class="rp-button" type="submit" name="add" data-variant="primary" data-size="md">Add to cart</button>
    <p class="rp-form-message" data-rp-part="error" data-tone="critical" role="alert" hidden></p>
    <div class="rp-product-form-accelerated"><!-- output of form | payment_button --></div>
    <input type="hidden" name="product-id" value="7">
  </form>
</rp-product-form>
```

Design points:

- **Without JavaScript** the browser posts `id`, `quantity` and any other named control to `/cart/add`. Nothing in the markup depends on script.
- **With `ripple.js`**, `<rp-product-form>` handles `submit` only when the submitter is `button[name="add"]` (so the accelerated checkout button keeps its native behaviour, as in `theme/assets/s-product-form.js`), reads `id`, `quantity`, `selling_plan` and `properties[...]` from `FormData`, and adds the line through the Hydrogen cart store. If Standard Actions or the store are unavailable it MUST NOT call `preventDefault()`, so the native post still happens ("script failure == no script").
- **The block owns `{% form %}`** because the body cannot read `form`. Accelerated checkout is therefore a boolean prop of ProductForm on Liquid, not a separate block placed in the body. The spec MUST either give ShopPayButton/BuyButtons the same shape in every host (a prop of ProductForm) or record this as a Liquid-only deviation. Recommendation: make it a prop everywhere.
- **Variant changes** are a host re-render: the template wraps price, badge and form in `{% partial 'rp-product-buy' %}`; the variant picker element sets `?variant=` and calls `partials.fetch('rp-product-buy', { url })` then `partials.apply(...)`. `<rp-product-form>` is inside the partial and is recreated, which is why rule 9.6.4 of `uisdk-report` (tolerate destroy and recreate) is mandatory.
- **Ids**: Liquid ids are numbers. `data-product-id` is printed as a GID by string concatenation so the attribute equals other hosts' output. The `name="id"` value must stay numeric for the native post.

---

## 6. Partials and commerce elements on Liquid

- **Template-owned regions.** Ripple block files MUST NOT contain `{% partial %}` (unverified inside block files, and the region boundary is a page-level decision). Blueprints declare partials in templates and layouts around block calls. Names are a contract between the blueprint and `ripple.js`; the manifest lists them (for example `rp-cart-lines`, `rp-cart-count`, `rp-cart-summary`, `rp-product-buy`, `rp-collection-grid`, `rp-search-results`). `ripple check` MUST report a partial name that `ripple.js` refreshes but no template declares, and duplicate declarations.
- **Element configuration, not hard-coded names.** As in the base theme (`data-partials` on `<s-cart>`), each commerce element reads the partial names to refresh from an attribute printed by its block, with the manifest default.
- **Flow for a cart change (R4).** (1) The element sets pending state on itself (`data-pending`, `aria-busy`). (2) It calls the Hydrogen cart store, which on Liquid goes through `Shopify.actions.updateCart`. (3) Counts and totals that are plain text are updated from the store immediately. (4) Structural changes (a new line, a removed line, discount rows) come from `partials.fetch(...)` + `partials.apply(...)`. (5) Pending state is cleared. A new cart line is never built in JavaScript. An optimistic new line is therefore not available on Liquid; only pending indicators and numeric text are optimistic.
- **Apply hygiene the library needs once** (taken from what the base theme re-implements in three elements): abort superseded fetches; ignore a response when a newer request started; save and restore focus by id; save and restore `<details open>`; reset server-owned inputs to `defaultValue` after apply; wrap apply in `document.startViewTransition` when available and motion is allowed; announce through a live region. This belongs in one Ripple helper (`refreshPartials(names, { url, signal })`), not in every element.
- **Overlays.** A partial MUST NOT contain the root of an open overlay. The drawer or dialog root is outside; the partial is inside its content (`theme/layout/theme.liquid`: `{% partial 'cart-drawer' %}` inside the dialog). Combined with `uisdk-report` 9.7.
- **Standard Actions ownership.** Exactly one `configure()` of `updateCart` and of `openCart` can exist. On a Ripple theme it is Ripple's (through Hydrogen core, per the Hydrogen investigator). `ripple init` on an existing theme MUST detect an existing configure snippet (`theme/snippets/standard-actions-config.liquid`) and replace it, not add a second one.
- **When `@shopify/partial-rendering` is missing** (store without the preview, script blocked): the helper MUST fall back to `location.reload()` after a successful mutation. The page is then correct, only slower.

---

## 7. Loading `ripple.css` and `ripple.js` with no build step

### 7.1 What must be true

1. Assets are flat files in `assets/` and are referenced only through `asset_url`.
2. A module MUST NOT import a sibling asset by relative path (section 2.5). Either `ripple.js` is one self-contained file, or every chunk is addressed by an import-map specifier whose target is an `asset_url` value.
3. There must be one import map and it must precede every module script. If the theme already has one (`theme/snippets/import-map.liquid`), Ripple adds entries to it; it does not print a second map.
4. `@shopify/partial-rendering` stays an unresolved bare import supplied by the platform. Because a static import of a missing specifier fails the whole module, `ripple.js` MUST load it with a guarded dynamic `import('@shopify/partial-rendering')` inside the refresh helper.
5. The UI SDK autoloader is not usable in a theme: it derives chunk URLs from its own path (`uisdk-report` section 7) and theme assets are flat with `?v=` keys.
6. Nothing may depend on `{% javascript %}` / `{% stylesheet %}`.

### 7.2 Recommended layout

`snippets/rp-head.liquid`, rendered once in `<head>` of `layout/theme.liquid`, **after** the import map and **before** `{{ content_for_header }}`:

```liquid
{{ 'ripple.css' | asset_url | stylesheet_tag: preload: true }}
{% render 'rp-tokens' %}
<script type="module" src="{{ 'ripple.js' | asset_url }}"></script>
```

- `assets/ripple.css`: precompiled plain CSS (layer order declaration, token defaults, the static `display`/`hidden` rules required by `uisdk-report` 9.4, component rules). No Tailwind compiler is needed to use it.
- `snippets/rp-tokens.liquid`: an inline `<style>` that prints `:root { --...: {{ settings.<id> }}; }` for tokens exposed as theme settings, following `theme/snippets/theme-styles.liquid`. Printed after the stylesheet so setting values win. This is how decision 6 (dials as sliders) reaches CSS with no build.
- `assets/ripple.js`: prebuilt ES module containing `@ui-sdk/core`, the used `@ui-sdk/web` entries, the `rp-*` elements and Hydrogen core. A module script is deferred, so it never blocks first paint.
- Import-map entry added by `ripple init`, only so theme code can import Ripple's API from the same module instance: `"ripple": "{{ 'ripple.js' | asset_url }}"`. The script tag and the map target are the same URL string, so the module is evaluated once.
- Size: if one file is too large, split by group (for example core, overlays, commerce) with import-map specifiers between them and a module tag per group in the blueprint that needs it. `uisdk-report` section 7 has the numbers. No asset-size limit was observed to fire under `theme-check:recommended` in this spike.

This layout has not been run on a store. The spike's `spike/theme/snippets/rp-head.liquid` is an earlier variant (it prints its own import map); the layout above supersedes it.

### 7.3 Tailwind utilities on Liquid (R6)

- Utilities an author passes through `class` are compiled by whatever compiles `config/styles.css` (Canvas/Sidekick today). Ripple cannot make them exist without a compile. Ripple's own styling MUST NOT depend on them: block files print `rp-` classes and `data-` attributes only, styled by `ripple.css`.
- For utilities to use Ripple tokens (`bg-primary`, `gap-4` on Ripple's scale), the theme's `config/styles.css` `@theme` block must declare the same token names. `ripple init` on a theme writes that block. Whether the Canvas/Sidekick compiler can `@import` a file from `assets/` is UNVERIFIED, so the tokens are written inline.
- Ripple block and snippet files are inside the base theme's `@source` globs, so any literal utility in them would be compiled, and any utility-looking text in a `{% doc %}` example is scanned too. Ripple block files SHOULD contain no Tailwind utilities.
- Layer order between `ripple.css` and the compiled Tailwind file is the styling investigator's decision. The Liquid-side requirement is only: `ripple.css` is a separate asset loaded before `styles.min.css`, and its rules live in named layers that the Tailwind output's `utilities` layer outranks.

---

## 8. Constraints Liquid imposes on the HTML contract

1. **Wrapper risk.** If Shopify wraps `{% block %}` or `{% partial %}` output in an element, child combinators, flex/grid children and fixtures all break. UNVERIFIED; check first. The contract SHOULD avoid `>` child selectors between a parent root and block-rendered children where a descendant selector is equivalent.
2. **No class merging.** Liquid has no `twMerge`/`clsx`. The class attribute is always the fixed `rp-` class followed by the caller's `class`. Variants MUST be `data-` attributes, never computed class names, and conflicts between a utility and a component rule MUST be resolved by cascade layers.
3. **Whitespace.** Liquid emits whitespace between tags and around `{{ content }}`. (a) Conformance compares canonical DOM, not bytes. (b) Component CSS MUST NOT use `:empty` or depend on the absence of whitespace text nodes. (c) Inline-level roots (Button, Badge, summary, title) print `{{- content -}}`.
4. **Attribute form.** Liquid prints `disabled`, React prints `disabled=""`; attribute order differs; an empty `class` param leaves a trailing space. The canonicaliser MUST normalise boolean attributes, attribute order and class whitespace (`spike/canon.mjs` does).
5. **No context.** Any attribute on a part that depends on the root (ids, group name, orientation, index, selected value) must be derivable from that part's own params. Contracts SHOULD NOT require `data-index`-style attributes; if they do, the author passes `forloop.index0`.
6. **No child introspection.** A parent cannot count, wrap, reorder or filter children. A contract MUST NOT require the parent to generate per-child wrappers (Grid items, Carousel slides, Tabs list derived from panels). Each such wrapper is its own part block written by the author.
7. **One content outlet per element** (rule L-6).
8. **Enumerated values are strings.** No numbers or booleans as enum tokens (`size: 2`), because Liquid literal typing and `contains` treat `2` and `'2'` differently.
9. **Ids.** Liquid has numeric ids. Contract attributes that carry ids MUST state whether they are GIDs; Liquid builds GIDs by concatenation. Form field values stay numeric.
10. **Host-owned form internals.** `form[action]`, the default `form[id]`, `enctype`, hidden inputs (`form_type`, `utf8`, `product-id`, `return_to`, `_method`) and native field names are host-specific. Fixtures for form components MUST compare the Ripple-owned parts and list host-owned attributes and inputs per host. Ripple-owned hooks on fields are `data-rp-field="<role>"`.
11. **Platform-generated markup is opaque.** `{{ form | payment_button }}`, `{{ content_for_header }}`, `<shopify-account>`, `image_tag` output. The contract wraps each in a Ripple element and the fixture masks its inside.
12. **Money text is not portable.** Liquid `money` uses the shop's admin-defined format; other hosts format in JavaScript. The Price contract MUST fix the element structure and attributes, and fixtures MUST mask or tolerate the formatted text.
13. **Image URLs are not portable.** Hosts produce different CDN URLs and width lists. The Image contract MUST state the exact width list and `sizes`; Liquid MUST then pass `widths:` explicitly or build `srcset` by hand; fixtures compare the width list and mask URL host and version.
14. **Strings.** Text printed by a component is a locale key on Liquid. English defaults MUST be identical across hosts (rule L-10).
15. **Raw attribute passthrough is unescaped.** The contract cannot assume anything about `attributes`. Fixtures do not use it except for one passthrough case.
16. **Custom elements must tolerate replacement.** Anything inside a partial is destroyed and recreated on refresh. State MUST be derivable from attributes plus the stores.
17. **No inline scripts or styles per block instance.** `{% style %}` prints per instance and the base theme limits it to once-per-page blocks. Ripple blocks print none.
18. **Escaping is entity-based.** `escape` turns `"` into `&quot;` (Ruby Liquid) or `&#34;` (liquidjs); both parse to the same DOM. Comparison MUST be on parsed DOM.

---

## 9. Conformance testing Liquid output locally

### 9.1 What was built

`spike/shim.mjs` (about 200 lines) configures `liquidjs@10.30.1` with:

- `{% block 'name', k: v, list: [a, b] %}...{% endblock %}`: renders the body first in the caller's scope, evaluates arguments in the caller's scope, binds schema setting defaults as bare variables and `block.settings.<id>` (a call-site argument overrides), renders `blocks/<name>.liquid` in an isolated scope with globals, rejects the tag when the calling file is under `blocks/` or `snippets/`, rejects dotted argument names.
- `{% partial 'name' %}...{% endpartial %}`: renders its body and logs the name. No marker is printed because the real marker is unknown.
- `{% doc %}`, `{% schema %}`, `{% stylesheet %}`, `{% javascript %}`: swallowed.
- `{% style %}`, `{% form 'product', product, id:, class: %}`; filters `t`, `money`, `asset_url`, `stylesheet_tag`, `payment_button`.
- `strictFilters: true`: a Shopify filter that the shim does not implement fails the test instead of printing nothing.

`spike/canon.mjs` parses HTML with `parse5` and prints one element per line with sorted attributes, normalised class whitespace, boolean attributes without value, collapsed text, no comments. `spike/render.mjs` runs 13 cases (`ok` for all) and renders a whole page (template inside layout).

`spike/check.mjs` runs the real Theme Check programmatically (`themeCheckRun` from `@shopify/theme-check-node`).

The shim implements this report's reading of the platform. It proves the block files are internally correct Liquid that produce the contract under those assumptions. It proves nothing about Shopify's renderer.

### 9.2 Known differences between liquidjs and Shopify's Liquid

| Difference | Handling |
|---|---|
| A top-level lookup of an **unset** variable named `size`, `first` or `last` returns a computed value in liquidjs, `nil` in Ruby Liquid (`spike/result.txt`: `size_unset=[0]` vs `[md]`). `size` is a Ripple prop name. | The shim defines the three names as `null` in block scope. Without this, `size | default: 'md'` silently differs. |
| `escape` prints `&#34;` for `"`; Ruby prints `&quot;`. | Compare parsed DOM. |
| Shopify objects, filters and tags are absent. | Shim only what block files use; `strictFilters` catches the rest. |
| Error handling and strict-parser differences. | Theme Check (real parser) is the gate for syntax. |

All other constructs used by the example blocks (`default`, `contains` on arrays, `== true`, `!= blank`, `append`, `split`, `escape`) gave identical results in Ruby Liquid 5.14.0 and liquidjs (`spike/sem.rb`, `spike/result.txt`).

### 9.3 Test tiers the spec should require

1. **Lint (every commit).** Theme Check `theme-check:recommended` on the scaffolded theme: 0 offenses. Then `ripple check` on templates (enumerations, booleans, required parts, ids, partial names).
2. **Local render conformance (every commit).** For each shared fixture (props to canonical HTML): render the Liquid call with liquidjs + shim, canonicalise, compare with the same canonical HTML used for React, Remix and plain HTML. For `ui`-classified components also run the upgrade-stability test (`react-report` section 8 item 4) on the Liquid output; `spike/upgrade.mjs` is the prototype.
3. **Live render conformance (nightly and before release).** Push the theme to the preview development store, request a fixtures template (for example `templates/page.rp-fixtures.liquid`, each case inside `<section data-rp-fixture="<name>">`), and run the same comparison on Shopify's real output. This is the only tier that can detect a platform wrapper, marker or scoping difference. It also validates the shim: any case where tier 2 passes and tier 3 fails is a shim bug to fix.
4. **Behaviour on the live store (before release).** Playwright with JavaScript disabled: add to cart posts and the cart page shows the line; with JavaScript: add to cart updates count and lines through a partial refresh without navigation.

To keep the shim small, the spec SHOULD define a **Ripple Liquid subset** for block and snippet files: tags `doc`, `schema`, `liquid`, `assign`, `if`/`unless`/`elsif`/`else`, `case`/`when`, `for`, `capture`, `render`, `form`, `comment`, `echo`; and a closed filter list. `ripple check` rejects anything else in Ripple-owned files.

---

## 10. What the spec must say

Blocks and files

1. The Liquid binding of a component is a block file per author-callable component or part, in `blocks/`, flat, named by rule L-1/L-2. State the chosen prefix policy.
2. `{% block %}` MUST NOT appear in any file under `blocks/` or `snippets/`. `{% partial %}`, `{% javascript %}`, `{% stylesheet %}`, `{% style %}` MUST NOT appear in Ripple block or snippet files.
3. A component that is embedded by another component has its markup in `snippets/<name>.liquid`; its block file only renders that snippet (rule L-3). The manifest records `embeddedBy`.
4. Every block file has `{% doc %}` (description, one `@param` per code-level param with the tightest type, `content` documented as required or optional, at least one `@example` that is a valid call) and `{% schema %}` (`name` as a `t:` key, `settings` array, no `presets`, no `tag`).
5. State the block-file budget (recommended 150) and that `ripple add` installs per component.
6. `{{ block.shopify_attributes }}` is not printed in V1. Revisit after the wrapper check in item 30.

Params

7. Param names are snake_case mappings of prop names; list the reserved names (rule L-5).
8. Per prop the manifest says `setting` or `param`. Settings: at most 3 per block, `select` options equal to prop tokens, schema default equal to contract default, read by bare name. Params: LiquidDoc types.
9. Every enumerated prop is validated in Liquid by the allow-list pattern in section 4.2 and falls back to the default. Every boolean prop is tested with `== true`.
10. Responsive prop strings are escaped and printed unchanged; they are always quoted strings; `ripple check` validates their tokens.
11. Element-name props are allow-listed before interpolation.
12. Block and render arguments contain no filters.

Composition

13. One `{{ content }}` per block file. Multi-region components are parts (rule L-6). Captured slot params need an explicit exception in the manifest (rule L-7).
14. Contract ids are explicit: required `id` on the root, a named param on each linked part, derivation table per component (rule L-8). `block.id` is not used for contract ids.
15. Each part prints its own initial ARIA and state attributes from its own params (rule L-9). For `ui-*` components the printed markup is the post-upgrade closed-state markup.
16. Markup the author does not write (close buttons, backdrops, error parts) is printed by the owning block through snippets.
17. Strings printed by blocks are `ripple.*` locale keys; schema labels are `t:ripple.*`; `ripple add` writes keys to every locale file present; English defaults equal other hosts' defaults (rule L-10).
18. Escaping rule L-11, verbatim.

Commerce on Liquid

19. ProductForm: the block owns `{% form 'product', product %}`, prints the hidden `id` input and the error part, takes `accelerated_checkout` as a boolean prop; the submitter is `button[name="add"]`; native field names are `id`, `quantity`, `selling_plan`, `properties[<key>]`. The element maps these to the Hydrogen cart store and never calls `preventDefault()` when it cannot perform the mutation itself.
20. Cart: quantities are `name="updates[]"` inputs inside the cart form with a non-`checkout` submit button; remove is a link to `item.url_to_remove`; checkout is a submitter with `name="checkout"`; note is `name="note"`. All work with JavaScript off.
21. Form internals are host-owned (section 8 item 10). Ripple hooks are `data-rp-field`.
22. Partials are declared only in templates and layouts by blueprints. The manifest lists every partial name, which element refreshes it, and on which event. Elements read names from an attribute.
23. One Ripple helper wraps `partials.fetch`/`partials.apply` with the hygiene list in section 6, loads the module with a guarded dynamic import, and falls back to a reload.
24. Elements inside partials tolerate destroy/recreate; overlay roots are outside partials.
25. Ripple owns the single `Shopify.actions.updateCart.configure()` and `openCart.configure()`, registered above `{{ content_for_header }}`; `ripple init` replaces a theme's existing configuration.

Loading

26. `snippets/rp-head.liquid` as in section 7.2; its position relative to the import map and `content_for_header`; no relative imports between assets; no second import map; `@shopify/partial-rendering` external and optional.
27. `assets/ripple.css` is complete without a compiler; tokens exposed as settings are printed by `snippets/rp-tokens.liquid`; Ripple block files contain no Tailwind utilities.

Contract and testing

28. Section 8 items 2 to 18 as contract rules for all hosts (they are forced by Liquid but apply to the shared contract).
29. The four test tiers of section 9.3, the canonicalisation rules, the fixture masking rules (form internals, payment button, money text, image URLs), and the Ripple Liquid subset.
30. A "preview store verification" milestone task that answers the questions in section 12 before any Liquid component work beyond the five examples.

---

## 11. Assumption check

| Assumption in the proposal | Verdict | Evidence |
|---|---|---|
| Liquid can print the same HTML contract as other hosts through `{% block %}` | Confirmed locally; wrapper behaviour on the platform unverified | 13 render cases; docs example prints the root element directly; base theme relies on it |
| A Ripple component can be composed from other Ripple blocks inside its block file | **Refuted** | Docs, Theme Check error `ValidBlockTagPlacement`, base theme rule |
| Props map one-to-one to block params | Partly: names become snake_case; children-derived and context-derived values need explicit params | Sections 4.2, 4.4 |
| Enumerated props are validated for the author | Partly: only LiquidDoc unions with literal arguments | `spike/result.txt` |
| Responsive strings pass through | Confirmed | Case `stack-responsive` |
| Server writes initial ARIA for `ui-*` from Liquid | Confirmed for Dialog | `spike/upgrade.mjs`: zero mutations |
| "Structural re-render belongs to the host (Liquid `partials.refresh`)" | Confirmed in principle; API details from theme code only | Section 2.2 |
| Partial refresh morphs the DOM | **Refuted** (replace; form control state preserved) | `theme/assets/s-cart.js`, `s-variant-picker.js` |
| No-script cart forms need native field names (R3) | Confirmed | Section 2.6; hydrogen-core spike scenario 2 |
| Storefront API cart from a theme without Hydrogen server routes (R2) | Confirmed that the platform API exists and accepts Liquid ids; the Hydrogen wiring is the Hydrogen investigator's result | Section 2.7 |
| `ripple.js` / `ripple.css` load with no build step | Design with constraints; not run on a store | Section 7 |
| Tailwind utilities with no build step (R6) | **Refuted** for arbitrary author utilities on Liquid: a compile is required and is done by Canvas/Sidekick | `theme/AGENTS.md` |
| mock.shop is the test target for the Liquid host | **Refuted**: Storefront API only | Section 2.8 |
| Liquid output can be conformance-tested without Shopify | Confirmed with a shim; a live tier is still required | Section 9 |
| ShopPayButton is a separate component inside ProductForm | **Refuted on Liquid**: needs `form`, which a body cannot read | Section 5.5 |

---

## 12. UNVERIFIED, and what Ben must set up

Setup needed from Ben:

1. A development store with the `liquid_july_26_changes` feature preview enabled.
2. Theme access for automation (Shopify CLI login or a Theme Access password) and the storefront password, so tests can push a theme and fetch pages.
3. A catalog on that store, ideally imported from mock.shop so product handles match the other hosts' fixtures.
4. Confirmation of whether Canvas/Sidekick compilation of `config/styles.css` is available on that store or whether Ripple must compile the CSS itself during development.

Questions to answer on that store, in this order:

| # | Question | Why it matters |
|---|---|---|
| 1 | Does `{% block %}` output have any wrapper element, attribute or comment? Same for `{% partial %}`. | HTML contract, CSS selectors, fixtures. |
| 2 | Is a schema setting readable by bare name when the caller passes no argument? What value does the block see for a `select` setting when the caller passes a value outside its options? | Rules in 4.2. |
| 3 | Is the body really rendered before the block and in the caller's scope (cannot read block assigns or `form`)? | ProductForm shape, context rules. |
| 4 | How does `@shopify/partial-rendering` resolve (import map in `content_for_header`?), and does it resolve on a store without the preview? | Loading order, fallback. |
| 5 | Exact API of `partials`: `fetch` options and return type, `apply` return value, `refresh` options, emitted events, behaviour for an unknown or duplicate name. Read the Partials guide. | Refresh helper. |
| 6 | Does `{% partial %}` work inside a block file? | Spec item 2 could be relaxed. |
| 7 | `block.id` inside a `for` loop: unique per iteration? | Only if any component wants generated ids. |
| 8 | What `{% form 'product' %}` prints on the preview (extra hidden inputs such as a section id) and what a failed no-JS add to cart shows. | Fixture masks, error UX. |
| 9 | Does the theme editor let a merchant select and edit a block rendered with `{% block %}` without `block.shopify_attributes`? How are per-usage setting values stored? | Whether settings-as-props is worth its cost. |
| 10 | Can the Canvas/Sidekick compiler `@import` CSS from `assets/`? | Token file placement. |
| 11 | Do the mock.shop catalog import tools work on that store? | Decision 10 on Liquid. |

Also unverified, lower priority: browser support for more than one import map; the skeleton theme release candidate's conventions (not retrievable here); whether `size` or any other Ripple param name collides with a Shopify-specific variable in block scope (plain Ruby Liquid does not, `spike/sem.rb`).

---

## 13. Reproducing

```
cd ripple/docs/research/spikes/liquid
npm i liquidjs@10.30.1 @shopify/theme-check-node@4.0.2 parse5
node render.mjs          # 13 x "ok", then the whole-page render, then the nested-block rejection
node check.mjs theme     # offenses: 0
./neg.sh                 # 16 offenses, listed in result.txt
gem install liquid && ruby sem.rb
node upgrade.mjs <dir>   # <dir> = a directory holding the @ui-sdk/web browser build (web.js, web/) and pre-upgrade.css; the uisdk-web spike's site/ directory was used
```

`result.txt` holds the recorded output of each command.
