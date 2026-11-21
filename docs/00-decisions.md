# 00 - Decision ledger

Status: LAW for every spec document (01 to 14, PLAN.md, README.md). Date: 2026-11-21.

## 0. How to read this document

- Every spec writer MUST follow this ledger. A spec document MUST NOT contradict it, rename anything it names, or reopen a decision. If a writer finds a decision that cannot be implemented, the writer MUST follow the decision anyway, and add an entry under a heading `## Ledger issues` at the end of their own document.
- Normative words: MUST, MUST NOT, SHOULD, MAY.
- "UNVERIFIED" marks a fact nobody ran or read in source. Every UNVERIFIED item that a decision depends on is attached to a named spike (section 3) with a default path and a fallback path. Writers specify the DEFAULT path in full and the fallback path in a subsection titled `Fallback (SPIKE-nn)`.
- Evidence paths are relative to the directory that holds the local clones (`uisdk/`, `hydrogen/`, `remix/`, `tobi/`, `ripple/`). Research reports are under `ripple/docs/research/`; they are cited by file name and section.
- Ben's ten fixed decisions are not repeated as decisions here. Where this ledger changes the base theme's rules or reads one of Ben's decisions narrowly, the item is repeated in section 10 (Open questions for Ben) with the default that work proceeds on.
- Precedence when two sources disagree: this ledger, then the research reports, then the original proposal.

Summary of what changed from the original proposal (details in the decisions):

1. Overlays are native: Dialog and Drawer use `<dialog>` wrapped by one Ripple element `rp-dialog`, not `ui-dialog` / `ui-drawer` (D-008). Popover uses the `popover` attribute (D-010). Accordion uses `<details>` (D-011).
2. UI SDK `ui-*` elements are used for exactly three components: Tabs, Tooltip, Toast. Every `rp-*` element is built on the UI SDK kernel (D-007, D-019).
3. All form controls are native. `ui-checkbox`, `ui-switch`, `ui-radio`, `ui-select`, `ui-slider`, `ui-number-input`, `ui-field`, `ui-menu`, `ui-combobox` are prohibited (D-014, D-022).
4. The React binding renders the custom elements directly and prints the upgrade-stable contract. `@ui-sdk/react` MUST NOT be used (D-033).
5. Two cart form dialects exist and stay (D-043). On Liquid the cart quantity is always sent as an absolute `set` (D-044).
6. No optimistic structural updates anywhere except the React host (D-045).
7. Variant selection, filtering, sorting and search are URL-driven in every host. The Hydrogen product-form store and predictive-search store are not used in V1 (D-047, D-048).
8. Responsive props use one string grammar in every host. The object form is rejected (D-028).
9. Liquid: resource components are self-contained blocks; component CSS ships as an editable theme asset (D-037, D-055). Both change base theme rules.
10. No lockfile: every scaffolded file carries a provenance trailer (D-056).

---

## 1. Decisions

Format of each entry: Decision / Rationale / Evidence / Rejected.

### A. Scope and architecture

#### D-001 Four render hosts, two commerce backends

- Decision: A **render host** is the technology that prints the HTML. There are exactly four: `html`, `react`, `remix`, `liquid`. A **commerce backend** is where cart and catalog data come from. There are exactly two: `hydrogen` (Storefront API through `@shopify/hydrogen` server handlers; used by `html`, `react`, `remix`) and `liquid` (Shopify theme runtime; used by `liquid`). These two words MUST be used with these meanings in every document. "Host" alone means render host.
- Rationale: Reports used "host" for both ideas, which produced tables that cannot be merged.
- Evidence: `ripple/docs/research/hydrogen-core.md` section 4 (adapter `host: "hydrogen" | "liquid"`); `ripple/docs/research/agent-kit-and-distribution.md` 6.4 (host detection `html | react | remix | liquid`).
- Rejected: Vue, Svelte, Solid bindings in V1 (not requested; the `html` contract already serves them).

#### D-002 One HTML contract per component; the server prints the upgrade-stable DOM

- Decision: Each component has exactly one **HTML contract**: the exact DOM (tags, classes, attributes, ids, part order) for its initial state. Every host MUST print this DOM on the server. The contract is the DOM as it is AFTER custom elements upgrade ("upgrade-stable"): when `ripple.js` loads, no attribute, child or text inside a component root may change, except entries on the component's documented allow-list. Two hosts conform when their output is equal after canonicalisation (D-063).
- Rationale: This single rule resolves R1 (React hydration never sees a mismatch), Remix morphing, Liquid partial replacement, no-layout-shift, and progressive enhancement at once. It was verified: zero attribute diff is achievable when the root has an `id` and the markup is fully pre-rendered.
- Evidence: `ripple/docs/research/react-and-custom-elements.md` (rules R-1 to R-5, spike `ripple/docs/research/spikes/react-ce/`); `ripple/docs/research/uisdk-web-elements.md` sections 1 and 3; `ripple/docs/research/remix-3.md` (morph section).
- Rejected: (a) author-minimal markup that the element completes at upgrade (causes hydration mismatch, layout shift, and visible closed content); (b) per-host contracts (makes conformance testing impossible).

#### D-003 The manifest is the single source; bindings are generated where the template language can express them

- Decision: Each component is defined by one hand-written manifest entry, which includes a **contract template** (a JSON node tree with `tag`, `attrs`, `children`, `slot`, `text`, `embed`, `host`; values are literals, `{prop}`, `{t}` or arrays; conditions are `set`, `true`, `eq`, `not`, `all`). The template language MUST NOT gain loops or expressions. One command, `pnpm gen`, generates from the manifest: reference HTML fixtures, TypeScript prop types, JSX `IntrinsicElements`, Liquid `{% doc %}` / `{% schema %}` / enumeration guards, binding bodies for kind `static` in all four hosts, `props.css`, pre-upgrade display rules, component docs, checker tables, the registry index, and the generated section of `AGENTS.md`. CI runs `pnpm gen --check`. Hand-written: manifest entries, component CSS, `tokens.css`, `base.css`, all `rp-*` elements, commerce adapters, bindings for kind `commerce`, React wiring for kinds `ui` and `native`, checker engine, skills prose, blueprints, eval tasks. A hand-written binding MUST still pass fixture conformance.
- Rationale: Generation was verified for static components (one template gave canonical-equal HTML, Liquid and React output, 10 of 10). Weak implementer models make fewer errors when four bindings come from one template.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 5.1 to 5.3; spike `ripple/docs/research/spikes/agent-kit/`.
- Rejected: hand-writing four bindings per component; a richer template language (it becomes a fifth implementation to debug).

#### D-004 Light DOM only

- Decision: No Ripple element attaches a shadow root. The only shadow DOM on a Ripple page is platform-provided: Shop Pay (`hydrogen-shop-pay-button`, Liquid `payment_button`). Such markup is **opaque**: fixtures mask it and component CSS MUST NOT target inside it.
- Evidence: `ripple/docs/research/hydrogen-core.md` S18; `hydrogen/packages/hydrogen/src/core/shop-pay/`.
- Rejected: shadow DOM for style isolation (Ben decision 1).

#### D-005 Progressive-enhancement levels

- Decision: Every component declares `noJs.level` in the manifest: `full` (every function works from server HTML with scripting off), `degraded` (content readable and primary path available; a stated enhancement is missing), `none` (the component is absent or inert without JS and its trigger is hidden until defined). The following MUST be `full`: every link and navigation component, every form control, ProductForm (add to cart by form post), VariantPicker (selection by GET), CartLines quantity change and remove (form post), DiscountCode on the hydrogen backend, CartNote, CheckoutButton, Filters, SortSelect, SearchForm, Pagination, LocaleSelector, Accordion, MobileNav on browsers with Invoker Commands, NewsletterForm. Allowed `degraded`: Dialog, Drawer, Popover (on browsers without the native feature the opener is a link when a page equivalent exists, D-009), Tabs, Carousel, ProductGallery, NavigationMenu, PredictiveSearch (plain search form remains), ProductRecommendations, QuantityInput (stepper buttons hidden; the number input works). Allowed `none`: Tooltip, Toast.
- Rationale: Ben decision 2. The base theme has known no-JS gaps (cart quantity, remove, discount, variant selection, mobile nav sublevels, localization panel); Ripple closes them.
- Evidence: `ripple/docs/research/base-theme.md` (weaknesses, acceptance ideas); `ripple/docs/research/uisdk-web-elements.md` section 1.
- Rejected: one global "works without JS" claim with no per-component level (not testable).

#### D-006 Component kinds are assigned by a mechanical rule

- Decision: Manifest `kind` is one of four values, decided only by the contract's tags:
  - `static`: the contract contains no custom element tag.
  - `native`: at least one `rp-*` tag, no `ui-*` tag, and the element binds no store and requests no region refresh.
  - `ui`: at least one `ui-*` tag.
  - `commerce`: at least one `rp-*` tag that binds a Hydrogen store or requests a region refresh.
  - The rule is applied to the component's `default` fixture, including the markup of components it embeds. A component that must sit inside another component's element (CartLine inside CartLines) is classified by its own markup and names its parent in `partOf`.
- Rationale: Kind decides which generator path, which tests, and which agent surface apply. A mechanical rule prevents arguments.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 4.1, 8.2.
- Rejected: kinds by "category" (layout, commerce and so on); category is a separate manifest key used only for docs grouping.

### B. Elements and UI SDK

#### D-007 Native first; `ui-*` for three components; `rp-*` for the rest

- Decision: The mechanism for each interactive behaviour is fixed by this table. No other mechanism may be used.

| Behaviour | Mechanism | Custom element |
|---|---|---|
| Modal dialog, drawer, lightbox, mobile nav, cart drawer | native `<dialog>` + Invoker Commands | `rp-dialog` wrapper |
| Non-modal popup (locale panel, filter popover, nav panel) | native `popover` attribute + `popovertarget` | none (NavigationMenu adds `rp-navigation-menu`) |
| Disclosure, accordion | native `<details>` / `<summary>` (`name` for exclusive) | none |
| Tabs | UI SDK | `ui-tabs`, `ui-tabs-list`, `ui-tabs-tab`, `ui-tabs-panel` |
| Tooltip | UI SDK | `ui-tooltip`, `ui-tooltip-trigger`, `ui-tooltip-content` |
| Toast | UI SDK | `ui-toast-region` (toasts created by a `toast()` helper) |
| Text input, textarea, select, checkbox, radio, switch | native controls | none |
| Quantity stepper | native `<input type="number">` + buttons | `rp-quantity` |
| Carousel, gallery | CSS scroll-snap list + buttons | `rp-carousel` |
| Cart, product form, live GET form, predictive search, recommendations | Hydrogen store / region refresh | `rp-cart`, `rp-product-form`, `rp-live`, `rp-predictive-search`, `rp-recommendations` |

- Rationale: Ben decision 2 (usable when JS never loads). `ui-checkbox`, `ui-switch`, `ui-radio`, `ui-select`, `ui-slider`, `ui-rating` contain no native control and submit nothing without JS. Native `<dialog>`, `popover` and `<details>` keep their state through Remix morphing for free, need none of the React rules R-3 to R-5, and are upgrade-stable by construction. Weight: `ui-dialog` 33.0 kB gzip and `ui-drawer` 47.6 kB gzip (each including the 12.8 kB kernel) are replaced by one small element.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` sections 1, 9.1 and weight table; `ripple/docs/research/remix-3.md` (native state preserved by the diff); `ripple/theme/AGENTS.md` ("native browser behavior first"); `ripple/docs/research/base-theme.md` (Dialog/Drawer recommendation).
- Rejected: the original proposal's broad use of `ui-*` (dialog, drawer, popover, menu, select, checkbox, number-input, field, accordion, carousel, navigation-menu, combobox). Recorded as the loser of the Dialog conflict in D-008.

#### D-008 Dialog and Drawer: native `<dialog>` inside `rp-dialog`

- Decision:
  1. Contract shape (doc 10 owns the full contract; these points are fixed): `<rp-dialog class="rp-dialog" data-slot="rp-dialog">` contains exactly one `<dialog id="<id>" class="rp-dialog-panel" aria-labelledby="<id>-title">`. Drawer is the same element and tag with root class `rp-drawer`, panel class `rp-drawer-panel`, and prop `side` (`start | end | bottom`, default `end`). The `id` is on the `<dialog>`, not on `rp-dialog`.
  2. Openers and closers are NOT parts. They are Button, IconButton or Link elements anywhere in the document with `commandfor="<id>"` and `command="show-modal"` or `command="close"`. Button and IconButton have first-class props `commandFor` and `command` (section 6).
  3. `ripple.js` includes an Invoker Commands polyfill ported from `ripple/theme/snippets/command-polyfill.liquid` (no-op when `HTMLButtonElement.prototype` has `commandForElement`). Liquid additionally keeps the inline classic-script polyfill in `snippets/rp-head.liquid` so that commands work before the module loads.
  4. Light dismiss: the `<dialog>` carries `closedby="any"`; `rp-dialog` adds a backdrop-click fallback for browsers without `closedby` (support UNVERIFIED, SPIKE-06).
  5. Initial state is always closed. Prop `defaultOpen` prints `data-default-open=""` on the `<dialog>`; `rp-dialog` calls `showModal()` on connect. The server MUST NOT print the `open` attribute.
  6. `rp-dialog` dispatches `openchange` (D-023), exposes `open()` and `close()` through the primitive `api`, closes on top-level navigation (Remix), and writes nothing to the DOM in the closed state.
  7. Because content outside a modal dialog is inert, feedback raised while a dialog is open MUST be rendered inside that dialog (a FormMessage with `role="alert"`, or the dialog's own Announcer part), never through Toast.
- Rationale: see D-007. Also the base theme and the Hydrogen cart-drawer guidance already prescribe native dialog, and agents know the pattern.
- Evidence: `ripple/theme/snippets/command-polyfill.liquid`; `ripple/theme/snippets/drawer.liquid`; `ripple/theme/assets/s-dialog.js`; `ripple/docs/research/base-theme.md`; `ripple/docs/research/remix-3.md` (`commandfor` / `command` are typed on buttons; `dialog[open]` preserved).
- Rejected: `ui-dialog` and `ui-drawer` (used by four of the eight reports as the working example). Reasons: closed content is visible before upgrade unless the server writes `hidden`; the open state writes `inert` on siblings and `style` on `<html>`, which React and Remix must then be told to preserve; drawer creates `ui-drawer-viewport` at upgrade; 33 to 48 kB gzip; beta API. Writers MUST treat every `ui-dialog` example in the research reports as superseded.

#### D-009 Opener pattern for overlays that have a page equivalent

- Decision: When an overlay has a page equivalent (cart drawer and `/cart`, search dialog and `/search`, mobile nav and the footer menu anchor), the opener MUST be `<a href="<page>" data-rp-open="<dialog id>">`. The Ripple runtime installs ONE document-level click listener: on an unmodified primary click on `[data-rp-open]`, if the target id is a `<dialog>` inside a defined `rp-dialog`, it calls `preventDefault()` and `showModal()`. After upgrade the runtime sets `aria-haspopup="dialog"` and `aria-controls` on such links; these two attributes are on the upgrade allow-list. Manifest key: `noJs.fallbackHref`.
- Rationale: A link inside a UI SDK trigger still navigates; a button opener does nothing without JS on browsers without Invoker Commands.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` section 9.2 (link-in-trigger); `ripple/docs/research/base-theme.md` (no-JS acceptance: cart link).
- Rejected: `<button>` openers for cart, search and menu; `commandfor` on `<a>` (not valid).

#### D-010 Popover: native `popover`

- Decision: Popover contract: opener is a Button or IconButton with `popovertarget="<id>"`; panel is `<div id="<id>" popover class="rp-popover" data-side="<side>" data-align="<align>">`. Position uses CSS anchor positioning inside `@supports`; without support the panel uses the user-agent default (centred). Kind `static`. Props `side` (`top | bottom | start | end`, default `bottom`), `align` (`start | center | end`, default `start`).
- Evidence: `ripple/docs/research/base-theme.md` (Popover native); anchor positioning support is UNVERIFIED (`ripple/docs/research/uisdk-web-elements.md` open questions) and is covered by SPIKE-06.
- Rejected: `ui-popover` (34.8 kB gzip, dead without JS); a Ripple positioning element (deferred to the SPIKE-06 fallback).

#### D-011 Accordion: native `<details>`

- Decision: Accordion is `<div class="rp-accordion">` holding `<details class="rp-accordion-item">` items with `<summary class="rp-accordion-trigger">` and `<div class="rp-accordion-content">`. `type="single"` prints `name="<accordion id>"` on every item (exclusive without JS). `defaultOpen` on an item prints `open`. Kind `static`.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (native `<details name>` exclusive accordion works with no JS; UI SDK has no binding to `<details>`); `ripple/docs/research/liquid-blocks-partials.md` (Accordion example).
- Rejected: `ui-accordion`.

#### D-012 Tabs: `ui-tabs`, fully pre-rendered

- Decision: Tabs uses `ui-tabs` with the fully pre-rendered contract (roles, `aria-selected`, `aria-controls`, derived ids `<id>-tab-<value>` and `<id>-panel-<value>`, `hidden` on unselected panels). Root `id` is REQUIRED. `noJs.level` is `degraded`: static CSS under `@media (scripting: none)` shows every panel and hides the tab list (support UNVERIFIED, SPIKE-06; fallback: only the default panel is readable without JS, and docs direct content that must be reachable to Accordion).
- Evidence: `ripple/docs/research/uisdk-web-elements.md` section 3 (tabs contract, zero diff); `ripple/docs/research/react-and-custom-elements.md` (Tabs wrapper template verified); `uisdk/packages/web/src/tabs.ts`.
- Rejected: author-minimal tabs markup ("contract B"); a Ripple-owned tabs element.

#### D-013 Tooltip and Toast: UI SDK, lazy-loaded

- Decision: Tooltip uses `ui-tooltip` (`noJs.level: none`; the trigger MUST have its own accessible name, the tooltip is never the only label). Toast uses one `ui-toast-region` per page, printed empty by the layout blueprint, and a `toast()` helper exported from `<pkg>/elements`. Both are on the upgrade-stability allow-list where the research found them non-idempotent (Toast). Both load as lazy chunks (D-054).
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (weights: tooltip 33.6, toast 26.7 kB gzip including kernel); `ripple/docs/research/react-and-custom-elements.md` (toast not idempotent); `uisdk/packages/web/src/tooltip.ts`, `uisdk/packages/web/src/toast.ts`.
- Rejected: cutting Tooltip (swatch and icon-button hints are common); a Ripple toast element.

#### D-014 Form controls are native; Field is static

- Decision: Input, Textarea, Select, Checkbox, RadioGroup, Switch (`<input type="checkbox" role="switch">`) and Label print native elements with `rp-` classes. Field is a static wrapper that wires `for`, `aria-describedby` and `aria-invalid` by derived ids (`<id>-description`, `<id>-error`) on the server. Validation is native constraint validation; messages are FormMessage elements.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` sections 1 and 9.1 (`ui-checkbox`, `ui-switch`, `ui-radio`, `ui-select` submit nothing without JS; `ui-field` rewrites attributes at upgrade).
- Rejected: `ui-field`, `ui-select`, `ui-checkbox`, `ui-switch`, `ui-radio`, `ui-combobox`.

#### D-015 QuantityInput: native number input + `rp-quantity`

- Decision: `<rp-quantity class="rp-quantity" data-slot="rp-quantity">` contains a decrement `<button type="button" data-rp-part="decrement">`, an `<input type="number" inputmode="numeric" name="quantity" min max step value>`, and an increment button. The input keeps `type="number"` and its raw value. The buttons carry `data-rp-js="inflow"` (hidden until the element is defined, D-021). Kind `native`. It dispatches `valuechange`.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (`ui-number-input` rewrites the input to `type="text"` and a formatted value such as `1,235`); `ripple/theme/assets/s-quantity-selector.js`; `ripple/theme/assets/quantity-rules.js`.
- Rejected: `ui-number-input`.

#### D-016 Carousel: scroll-snap + `rp-carousel`

- Decision: Carousel is a horizontally scrollable, scroll-snapping list that works by touch, trackpad and keyboard with no JS. `rp-carousel` adds previous/next buttons (`data-rp-js="inflow"`), disabled state at the ends, and the `indexchange` event. ProductGallery composes Carousel and a lightbox Dialog. Kind `native`.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (carousel not idempotent at upgrade; 29.0 kB gzip); `ripple/docs/research/base-theme.md` (gallery, zoom).
- Rejected: `ui-carousel`.

#### D-017 NavigationMenu and MobileNav

- Decision: NavigationMenu is a `<nav>` containing links and, for items with children, a disclosure `<button popovertarget>` plus a `popover` panel of links. `rp-navigation-menu` adds hover intent and arrow-key movement between top-level items. Every top-level item that has a URL stays a real link. MobileNav is a Drawer (D-008) containing nested `<details>` for sublevels; its opener follows D-009 with the footer menu anchor as `fallbackHref`. Covered by SPIKE-07.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (`ui-navigation-menu` moves content into a viewport on open; 35.3 kB gzip); `ripple/theme/assets/s-nav-dropdown.js`, `ripple/theme/assets/s-mobile-nav.js`; `ripple/docs/research/base-theme.md` (mobile nav sublevels fail without JS).
- Rejected: `ui-navigation-menu`.

#### D-018 Menu is cut from V1

- Decision: There is no Menu component (`role="menu"`) in V1. Action lists use Popover containing links or buttons.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (menu: non-deterministic item ids, dead without JS, 44.1 kB gzip).
- Rejected: `ui-menu`.

#### D-019 How `rp-*` elements are written

- Decision: Every `rp-*` element MUST follow these rules:
  1. Built with `definePrimitive` (from `@ui-sdk/core`) and `createParts` (from `@ui-sdk/web`), with ROOT ONLY: one custom element tag per component. Parts are native descendants marked `data-rp-part="<part>"`. Root-only runtime behaviour is UNVERIFIED (type-legal per `PartTags` in `uisdk/packages/web/src/define-element.ts`); see SPIKE-04.
  2. The primitive `name` equals the root tag. The contract includes `data-slot="<tag>"` on the root.
  3. One delegated listener set on the root. The element reads DOM values at event time, holds no references to descendants, and tolerates any descendant being replaced (Liquid partial refresh, Remix morph, React re-render) and its own disconnect and reconnect.
  4. It reflects state only through the attribute names in D-021 and never writes an attribute the server could have printed for the initial state.
  5. An option named after state property `X` arrives as `defaultX`. Subscriptions are registered with `context.onDestroy` cleanup. `attrs` functions are pure. Announcements use `announce()` from `@ui-sdk/core`.
  6. The primitive's `agent` key lists the public methods (D-065).
  7. One element per file: `src/elements/<tag>.ts` or `src/commerce/<tag>.ts`.
- Rationale: Using the kernel gives the agent bridge, `checkPattern`, and one event convention for free, and matches Tobi's prior art.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` 9.6; `uisdk/packages/web/src/define-element.ts`; `tobi/src/web/cart.ts`, `tobi/src/web/product.ts`; `ripple/docs/research/remix-3.md` (elements receive only `attributeChangedCallback` on morph).
- Rejected: multi-tag part elements for Ripple components (`rp-dialog-title` and so on: more tags to pre-render and to budget on Liquid); plain `HTMLElement` subclasses as the default (kept as the SPIKE-04 fallback).

#### D-020 Ids are explicit, required, and derived

- Decision: Every component whose parts are linked by id (Dialog, Drawer, Popover, Tabs, Accordion with `type="single"`, Field, Tooltip, Carousel, ProductForm, PredictiveSearch, NavigationMenu, MobileNav, CartDrawer) has a REQUIRED `id` prop in every host. No host generates ids: not `useId`, not `block.id`, not a counter. Part ids are derived with these fixed suffixes: `<id>-title`, `<id>-description`, `<id>-error`, `<id>-trigger`, `<id>-content`, `<id>-tab-<value>`, `<id>-panel-<value>`, `<id>-item-<value>`, `<id>-list`, `<id>-live`. A part that lives in another file receives the root id through a prop named after the root component (`dialog`, `drawer`, `tabs`, `popover`, `field`, `form`), never `for`.
- Rationale: Generated ids differ between hosts and between server and client; Remix has no stable generated id; Liquid blocks cannot pass context to their body; `for` is a reserved word in Liquid.
- Evidence: `ripple/docs/research/react-and-custom-elements.md` R-2; `ripple/docs/research/remix-3.md`; `ripple/docs/research/liquid-blocks-partials.md` L-5, L-8.
- Rejected: `useId` in React; `block.id` in Liquid.

#### D-021 State attributes, `hidden`, and pre-upgrade CSS

- Decision:
  1. State is expressed only by native attributes (`open`, `hidden`, `disabled`, `checked`), ARIA attributes (`aria-expanded`, `aria-selected`, `aria-current`, `aria-invalid`, `aria-busy`, `aria-disabled`), and the UI SDK presence attributes `data-open`, `data-closed`, `data-disabled`, `data-pending`, `data-selected`, `data-checked`, `data-active`, `data-current`. `data-state="..."` MUST NOT be used.
  2. The earliest layer carries `:where([hidden]:not([hidden="until-found"])){display:none !important}`.
  3. `base.css` carries a static `display` rule for every `ui-*` and `rp-*` tag Ripple uses (generated), so layout is identical before and after upgrade.
  4. A control that works only with JS carries `data-rp-js="inflow"` (rendered `visibility:hidden` until its owning custom element is `:defined`) or `data-rp-js="overlay"` (rendered `display:none` until defined). A control needed only WITHOUT JS (for example the cart's "Update" submit button) carries `data-rp-js="fallback"` (rendered `display:none` once the owning element is defined). The generated rules select by the owning tag: `rp-quantity:not(:defined) [data-rp-js="inflow"]`, `rp-cart:defined [data-rp-js="fallback"]`. These generated rules in `base.css` are the only CSS allowed to select a `data-rp-*` attribute.
  5. Fixtures cover the initial state only. Residual attributes after an open and close cycle are not part of the contract.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` sections 1, 9.4; `ripple/docs/research/styling-spike.md` (pre-upgrade section; `ripple/docs/research/spikes/uisdk-web/` `site/pre-upgrade.css`).
- Rejected: `data-state`; hiding with utility classes.

#### D-022 UI SDK usage rules

- Decision:
  1. `@ui-sdk/core` and `@ui-sdk/web` are pinned to the exact version `0.1.0-beta.14` in `dependencies`. No ranges.
  2. `@ui-sdk/react`, `@ui-sdk/core/web.css`, `@ui-sdk/core/internal/*`, and the upstream autoloader (`uisdk/packages/web/src/autoload.ts`) MUST NOT be used.
  3. Exactly one copy of `@ui-sdk/core` per page. Ripple builds its own browser bundles that share one copy.
  4. Allowed `ui-*` tags in contracts: the Tabs, Tooltip and Toast families only. Every other `ui-*` tag is prohibited and is a checker error (RP111).
  5. Partial refresh, morph, or re-render MUST replace a whole `ui-*` root or touch nothing inside it (stripped attributes are not restored until the next state change).
- Evidence: `ripple/docs/research/uisdk-web-elements.md` sections 1, 9 (14 versions in 9 days; two copies of core break ownership; autoloader unusable); `ripple/docs/research/react-and-custom-elements.md` (`@ui-sdk/react` omits closed content and prints different DOM and ids).
- Rejected: semver ranges on beta packages; `@ui-sdk/react` as the React binding.

#### D-023 Events

- Decision:
  1. Element events follow the UI SDK convention: one lowercase word, non-bubbling, dispatched on the component root, `detail` has `value` and, where known, `reason` and `source`. The V1 names are `openchange`, `valuechange`, `indexchange`, `action`. Property and attribute writes fire no event.
  2. Document events are dispatched on `document`, are named `rp:<name>`, and are exactly two: `rp:refresh` (cancelable; `detail: { regions: string[], url: string | null, reason: string }`; a request that the host adapter refresh the named regions) and `rp:refreshed` (`detail: { regions: string[], ok: boolean }`).
  3. React callback names are `on` + the PascalCase split of the event (`openchange` to `onOpenChange`, `valuechange` to `onValueChange`, `indexchange` to `onIndexChange`), with signature `(value, detail)`. The manifest records event name, detail type, and callback name.
  4. No attribute or prop name may match `/^on/i` in the HTML contract.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (events non-bubbling); `uisdk/packages/web/src/events.ts`; `ripple/docs/research/react-and-custom-elements.md` (public callbacks); `ripple/docs/research/remix-3.md` (no `/^on/i` attributes; proposed `rp:cart:settled`).
- Rejected: `rp:cart:settled` as a separate event (it is `rp:refresh` with `reason: "cart"`); bubbling CamelCase events.

### C. Styling and tokens

#### D-024 Styling contract: `rp-` class + `data-` prop attributes; plain CSS

- Decision:
  1. Every component root has class `rp-<component id>`; every styled part has class `rp-<component id>-<part>`. Enumerated and boolean props render as `data-<prop>` attributes (section 4.3). This is the contract in every host, including Liquid.
  2. Component CSS is plain CSS: no `@apply`, no nesting, no preprocessor. One file per component, one `@layer rp.components { ... }` block per file. Modifiers are `.rp-<id>[data-<prop>="<value>"]` rules that set custom properties only; the base rule consumes them.
  3. Public per-component custom properties are `--rp-<component id>-<name>`; private ones are `--_<name>`.
  4. State selectors select the attributes of D-021. Hover styles are inside `@media (hover: hover)`. Motion is inside `@media (prefers-reduced-motion: no-preference)`.
  5. Ripple-authored markup (contracts, registry files, blueprints' component internals) contains NO Tailwind utility classes. Blueprints and user code MAY use utilities through the `class` prop when the project has Tailwind.
  6. Component CSS MUST NOT select any `data-rp-*` attribute or `data-slot` (sole exception: the generated `data-rp-js` rules of D-021). JS MUST NOT select classes. (The base theme's behaviour reads utility class names; that is prohibited.)
- Rationale: Works with no build (R6), identical in four hosts, checkable, and mouldable by editing one CSS file.
- Evidence: `ripple/docs/research/styling-spike.md` (component CSS rules; spike `ripple/docs/research/spikes/styling/`); `ripple/docs/research/base-theme.md` (behaviour reading utility classes; recommendation to use the `rp-` contract in Liquid too).
- Rejected: utility-only components as in the base theme (needs the compiler everywhere, no stable contract to test); CSS-in-JS; `@apply`.

#### D-025 Cascade layers

- Decision: The first statement of the CSS entry in every host MUST be, in this order:

  ```css
  @layer ui-sdk, theme, base, rp, components, rmx, utilities;
  @layer rp.tokens, rp.base, rp.components, rp.props;
  ```

  It MUST precede `@import "tailwindcss"`. Ripple writes only in `ui-sdk` (the `[hidden]` rule of D-021) and in the four `rp.*` sublayers. Utilities therefore always override Ripple; Ripple always overrides Tailwind preflight (`base`).
- Evidence: `ripple/docs/research/styling-spike.md` (layer order verified; failure when the statement follows the Tailwind import); `ripple/docs/research/uisdk-web-elements.md` (UI SDK injects `@layer ui-sdk` at runtime); `ripple/docs/research/remix-3.md` (layer `rmx`).
- Rejected: unlayered component CSS; `!important` (allowed only in the one `[hidden]` rule).

#### D-026 Tokens: one source, Tailwind names where Tailwind has a namespace, `--rp-` otherwise

- Decision:
  1. `tokens.css` is the only place token values are written. `theme.css` is generated from it as an `@theme reference { ... }` block with real values (never `initial`) so that Tailwind utilities can name Ripple tokens without emitting them twice.
  2. A token that falls in a Tailwind v4 theme namespace uses the Tailwind name: `--color-*`, `--spacing` and `--spacing-*`, `--radius-*`, `--text-*`, `--font-*`, `--shadow-*`, `--ease-*`, `--container-*`, `--breakpoint-*`. Every other token is `--rp-*`.
  3. **Dials** are the small set of inputs from which the rest derive: `--rp-background`, `--rp-foreground`, `--rp-brand`, `--rp-brand-foreground` (optional), `--rp-accent` (optional; feeds `--color-link`), `--rp-radius` (default `0.5rem`), `--rp-density` (default `1`), `--rp-text-scale` (default `1.2`), `--rp-font-body`, `--rp-font-heading`.
  4. Derived tokens are declared on `:root, [data-scheme]`. Any element that sets a dial MUST also carry `data-scheme="<name>"`. Built-in scheme names: `light` (default, on `:root`) and `dark`. Projects add schemes by adding `[data-scheme="<name>"]` blocks to `tokens.css`.
  5. Liquid exposes dials as theme settings through `snippets/rp-tokens.liquid`, which prints one inline `:root { ... }` rule. Setting ids: `rp_palette` (type `color_palette`), `rp_radius`, `rp_density`, `rp_text_scale` (type `range`), `rp_font_body`, `rp_font_heading` (type `font_picker`). Palette slot mapping: `surface` to `--rp-background`, `on_surface` to `--rp-foreground`, `interactive` to `--rp-brand`, `surface_2` to `--color-muted`, `accent` to `--rp-accent`.
- Evidence: `ripple/docs/research/styling-spike.md` (tokens, dials, schemes); `ripple/theme/snippets/theme-styles.liquid`; `ripple/theme/config/settings_schema.json`; `ripple/theme/config/styles.css`.
- Rejected: a JS or JSON token source; tokens only as Tailwind `@theme` (fails without a build).

#### D-027 Colour role names: shadcn names, in every host

- Decision: Colour roles are `--color-background`, `--color-foreground`, `--color-card`, `--color-card-foreground`, `--color-popover`, `--color-popover-foreground`, `--color-primary`, `--color-primary-foreground`, `--color-secondary`, `--color-secondary-foreground`, `--color-muted`, `--color-muted-foreground`, `--color-accent`, `--color-accent-foreground`, `--color-border`, `--color-input`, `--color-ring`, `--color-overlay`, `--color-link`, `--color-destructive`, `--color-destructive-foreground`, `--color-success`, `--color-success-foreground`, `--color-warning`, `--color-warning-foreground`, `--color-info`, `--color-info-foreground`, `--color-sale`, `--color-sale-foreground`. The word for the red role is `destructive` everywhere (token, Button variant, tone value); never `critical`, `danger` or `error`. The Liquid research's `data-tone="critical"` example is superseded.
- Rationale: These are the names coding agents already produce without being told; the audience is agents. `--color-accent` keeps its shadcn meaning (a subtle hover surface); the theme's "accent" colour maps to `--rp-accent` and `--color-link`.
- Evidence: `ripple/docs/research/styling-spike.md` (role list, recommendation); `ripple/docs/research/base-theme.md` (theme slot names `surface`, `on_surface`, `surface_2`, `accent`, `interactive`).
- Rejected: the base theme's settings-backed names as token names (`--color-surface`, `--color-on-surface`, ...). They survive only as palette slot names in the Liquid settings bridge (D-026 item 5). Listed in section 10.

#### D-028 Responsive props: attribute tokens, one string grammar

- Decision:
  1. A responsive prop renders as ONE attribute whose value is a space-separated token list, for example `data-gap="2 md:6"`. `props.css` (generated, layer `rp.props`) matches tokens with `[data-gap~="md:6"]` inside the breakpoint's media query.
  2. Grammar (the only one, in every host):

     ```text
     prop-value := token (" " token)*
     token      := value | breakpoint ":" value
     breakpoint := "sm" | "md" | "lg" | "xl" | "2xl"
     ```

     At most one token per breakpoint and at most one unprefixed token. Tokens SHOULD be written in ascending breakpoint order. Mobile-first: an unprefixed token applies from width 0.
  3. In TSX the prop type is `T | (string & {})`; a scale prop additionally accepts a bare number (`gap={4}`). In Liquid the value is ALWAYS a quoted string (`gap: '4'`, `gap: '2 md:6'`). The attribute is printed escaped and otherwise unchanged. The helper `rv()` in the package validates in development.
  4. Generator rules for `props.css`: one block per breakpoint in ascending order; fixed property order `gap, gap-x, gap-y, p, px, py, pt, pb, direction, wrap, align, justify, columns, span, hidden`; every selector has specificity (0,1,0); logical properties only; `direction` and `wrap` scoped `:where(.rp-stack, .rp-inline)`; `align` and `justify` scoped `:where(.rp-stack, .rp-inline, .rp-grid)`; `columns` scoped `:where(.rp-grid)`; `hidden` uses `display: none` and `display: revert-layer`.
  5. There are no margin props.
- Evidence: `ripple/docs/research/styling-spike.md` sections 1 and 8 (942 rules, 4.9 kB gzip, Chromium verified); `ripple/docs/research/liquid-blocks-partials.md` L-5 (responsive strings printed unchanged, always quoted); `ripple/docs/research/remix-3.md` (open question: string or object form).
- Rejected: the object form (`gap={{ base: 2, md: 6 }}`): it cannot be written in Liquid, needs a serialiser in each host, and gives two spellings to check. Per-breakpoint props (`gapMd`). Utility classes as the prop mechanism.

#### D-029 Scales

- Decision: These are the default scales. They are changeable by editing `tokens.css` and re-running the generator; names never change.

| Scale | Values |
|---|---|
| Breakpoints (min-width) | `sm` 40rem, `md` 48rem, `lg` 64rem, `xl` 80rem, `2xl` 96rem |
| Space steps (props `gap`, `p`, ...) | `0 0.5 1 1.5 2 3 4 5 6 8 10 12 16 20 24 32`; one step = `calc(var(--spacing) * n)`; `--spacing: calc(0.25rem * var(--rp-density))` |
| Control heights | `--spacing-control-sm` 2.25rem, `--spacing-control-md` 2.75rem, `--spacing-control-lg` 3.25rem |
| Containers | `--container-page` 80rem, `--container-prose` 42rem; page gutter `--spacing-gutter` |
| Radius | `--radius-xs` to `--radius-3xl` derived from `--rp-radius`; semantic `--radius-control`, `--radius-field`, `--radius-surface` |
| Type | `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl`, `--text-3xl`, `--text-4xl`, `--text-5xl`, `--text-6xl`; ratio `--rp-text-scale`; `pow()` only inside `@supports` with literal fallbacks |
| Motion | `--rp-duration-fast` 100ms, `--rp-duration-base` 200ms, `--rp-duration-slow` 300ms; `--ease-out`, `--ease-in-out`, `--ease-drawer` |
| Layers (z-index) | `--rp-z-raised` 1, `--rp-z-sticky` 20, `--rp-z-overlay` 40, `--rp-z-toast` 50 |
| Shadows | `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg` |

- Evidence: `ripple/docs/research/styling-spike.md` (scales section); `ripple/theme/AGENTS.md` (motion tokens, about 300 ms in and 200 ms out).
- Rejected: three typography scales as in the base theme; a numeric type scale.

#### D-030 Tailwind is optional (resolves R6)

- Decision: Ripple components need no Tailwind and no build: `ripple.css` is complete on its own. Tailwind utilities are available only where the project already compiles Tailwind (a bundler in `react` / `remix`; the Canvas / Sidekick compile of `config/styles.css` in Liquid). `@tailwindcss/browser` MUST NOT be used or documented. Ripple ships no static subset of utilities. Tailwind is an optional peer dependency (v4).
- Evidence: `ripple/docs/research/styling-spike.md` (R6: `@tailwindcss/browser` is 75 kB gzip); `ripple/docs/research/liquid-blocks-partials.md` (R6: utilities on Liquid need the Canvas / Sidekick compile; `ripple/theme/AGENTS.md`: "Classic Edit Code alone does not invoke the compiler").
- Rejected: runtime Tailwind; a precompiled utility subset.

#### D-031 Button variants are one enumeration

- Decision: Button and IconButton have `variant`: `primary | secondary | outline | ghost | link | destructive` (default `primary`; IconButton default `ghost`) and `size`: `sm | md | lg` (default `md`). There is no `tone` prop on Button. The styling spike's `variant` x `tone` split is superseded.
- Rationale: shadcn's vocabulary; one decision instead of two for the calling agent; the Liquid spike already used it.
- Evidence: `ripple/docs/research/liquid-blocks-partials.md` (Button example); `ripple/docs/research/styling-spike.md` (Button example with `solid | soft | outline | ghost | link` and tone).
- Rejected: `variant` (`solid | soft | ...`) x `tone`.

#### D-032 Browser support floor

- Decision: Supported floor: Chrome and Edge 111, Safari 16.4, Firefox 128, all UNVERIFIED outside Chromium (SPIKE-06). Features above the floor MUST sit behind `@supports` or a JS feature test with a working fallback: CSS anchor positioning, `pow()`, relative colour syntax, `@media (scripting: none)`, `closedby`, Invoker Commands (polyfilled). Hydrogen core additionally needs `AbortSignal.any` (Safari 17.4) and `crypto.randomUUID`; on browsers without them the commerce runtime MUST NOT start and forms post natively (D-041 item 7).
- Evidence: `ripple/docs/research/styling-spike.md` (support floor; Chromium only); `ripple/docs/research/hydrogen-core.md` (runtime needs); `ripple/docs/research/remix-3.md` (morph navigation needs Chrome / Edge 135; elsewhere document navigation).
- Rejected: an evergreen-only floor; polyfilling CSS features.

### D. Bindings (React, Remix, Liquid, HTML)

#### D-033 React binding (resolves R1)

- Decision: The React binding is scaffolded TSX that renders the contract's elements directly (`<ui-tabs>`, `<rp-dialog>`, `<dialog>`), with these rules:
  - **R-1** Print the upgrade-stable contract (D-002).
  - **R-2** Root `id` is required (D-020).
  - **R-3** State attributes are printed from the initial state, captured once (`useState(() => initial)`), and never re-rendered by React.
  - **R-4** Listeners and object properties are attached through a ref with the library hook `useElement(ref, { props, events })` from `<pkg>/react`; never as React props on a custom element.
  - **R-5** Controlled props are assigned as element properties; a change is vetoed with `preventDefault()` and re-applied from React state.
  - Supporting rules: `suppressHydrationWarning` on every custom element and on every element a custom element writes to; lowercase attribute spellings on custom elements (`for`, `tabindex`, `class`); a single string as text children (no `{a} {b}` adjacency inside elements a custom element reads); never render `inert` or a `style` on `<html>`; never conditionally render a node that an element moves; never pass `id={undefined}` to a custom element.
  - Native elements (`<dialog>`, `<details>`, `<button>`, `<input>`) are rendered as ordinary React elements with React props and handlers.
  - Hydrogen: Ripple owns one store per page behind a module accessor; React reads it with `useSyncExternalStore` hooks from `<pkg>/react`. `CartProvider` from `@shopify/hydrogen/react` MUST NOT be mounted.
- Evidence: `ripple/docs/research/react-and-custom-elements.md` (verdict A; react 19.3.1; spike `ripple/docs/research/spikes/react-ce/` `src/final.jsx`).
- Rejected: `@ui-sdk/react`; a React-only re-implementation of behaviours; wrapping every element in a client-only component.

#### D-034 Remix 3 binding

- Decision: A Ripple component in Remix is a plain server component that prints the contract. The Remix binding is the React binding without hooks, plus:
  1. It MUST NOT use `clientEntry`, `on()`, `ref()`, `css()`, or `@remix-run/ui`.
  2. Every `ui-*` and `rp-*` root prints `data-rmx-key="<id>"` (or a stable key prop when the component has no id), and every part an element writes to prints `data-rmx-preserve-attrs="<names>"` listing the attribute names in the manifest `state[]` table. `<html>` prints `data-rmx-preserve-attrs="style"`.
  3. Cart forms, and links and forms to account routes and `/checkout`, print `data-rmx-document`.
  4. Structural commerce updates use named blocking `<Frame>`s reloaded by the Remix adapter when `rp:refresh` fires (D-046).
  5. `ripple.js` is served prebuilt from `public/ripple/`; it is not passed through the Remix asset server.
  6. RichText uses `innerHTML={unsafeHTML(html)}`.
  7. Components are uncontrolled and have no callback props in Remix.
  8. `data-rmx-*` attributes are host extras: the canonicaliser removes them before comparison.
- Evidence: `ripple/docs/research/remix-3.md` (spike `ripple/docs/research/spikes/remix/`; 116 module requests through the asset server; Referer problem for cart forms).
- Rejected: `clientEntry` wrappers per component; using Remix's own UI primitives.

#### D-035 TSX API conventions (React and Remix identical unless stated)

- Decision:
  1. Components are named exports in PascalCase. Parts are separate flat named exports `<Component><Part>` (`AccordionItem`, `DialogTitle`, `TabsPanel`). Dot notation (`Dialog.Title`) MUST NOT be used.
  2. File per component: `<id>.tsx` exporting the component and all its parts.
  3. Prop names are camelCase and map mechanically to Liquid snake_case and to `data-<kebab-case>` attributes. The only exceptions: React uses `className` where Remix and the manifest use `class`.
  4. Unknown props are spread onto the root element BEFORE contract attributes, so contract-owned attributes cannot be overridden. This is the TSX equivalent of Liquid's `attributes` param.
  5. Text content is always children. The only string props that carry content are accessible names (`ariaLabel`) and RichText's `html`.
  6. Initial-state props are named `default<X>` (`defaultOpen`, `defaultValue`, `defaultChecked`) in every host (Liquid: `default_open`, `default_value`, `default_checked`). They print the plain HTML attribute (`value`, `checked`, `open`).
  7. Helpers `rv()` (responsive value to attribute string) and `cx()` (class join) come from `<pkg>`; bindings MUST use them and no other class or prop helper.
- Evidence: `ripple/docs/research/remix-3.md` (bindings share one template; `class`; helpers); `ripple/docs/research/react-and-custom-elements.md` (spec items); `ripple/docs/research/base-theme.md` (text is always children).
- Rejected: dot-notation compound components; `asChild`/slot polymorphism (use the `as` and `href` props); a `children`-less "label" prop.

#### D-036 Controlled state is limited

- Decision: All components are uncontrolled in every host. React additionally supports: callbacks from D-023 on every component with an event; controlled `open` on Dialog and Drawer; controlled `value` on Tabs and QuantityInput. Nothing else is controllable in V1. The `html`, `remix` and `liquid` hosts have no callbacks; code listens to DOM events.
- Evidence: `ripple/docs/research/react-and-custom-elements.md` (R-5 verified); `ripple/docs/research/remix-3.md` (uncontrolled only in V1).
- Rejected: controlled props everywhere.

#### D-037 Liquid composition: three tiers

- Decision: Each component maps to Liquid by exactly one of three tiers, recorded in the manifest (`liquid.tier`: `block`, `parts`, `resource`):
  1. **block** (a primitive with children: Button, Stack, Card, Heading ...): one block file with one `{{ content }}` outlet. Its markup lives in `snippets/rp-<id>.liquid` when another Ripple file embeds it; the block is then a thin wrapper (manifest `embeddedBy`).
  2. **parts** (a compound with several regions: Dialog, Tabs, Accordion, Field ...): one block file per part named `<component id>-<part>`, each with one outlet, nested by the author in the template; ids are passed explicitly to each part (D-020).
  3. **resource** (a component that renders a Shopify resource or a fixed commerce structure: ProductCard, CollectionCard, ArticleCard, CartLines, CartLine, CartSummary, CartDrawer, DiscountCode, CartNote, Filters, FilterGroup, FilterChips, SortSelect, PriceRange, VariantPicker, ProductGallery, ProductForm, LocaleSelector, NavigationMenu, MobileNav, FeaturedCollection, Header, Footer, PredictiveSearch): ONE self-contained block that takes the resource as a param, renders a complete default body through `rp-*` snippets, and renders `{{ content }}` instead of the default body when the caller supplies one (`{% if content != blank %}`).
  - A fourth tier value, `snippet`, is used by Icon only (D-068): the component is a snippet with no block file.
  - `{% block %}` appears only in templates and layouts (platform rule). A Ripple block or snippet never contains `{% block %}`; internal reuse is `{% render 'rp-<id>' %}`.
  - No `{% capture %}` may be used to pass markup from one file to another, with one exception: named slot params on tier-3 blocks listed in the manifest.
- Rationale: The base theme writes the product card six times and threads about 85 captures because composition is template-owned everywhere. Tier 3 removes that. It deliberately changes the base theme rule "block-first, template-owned composition" for resource patterns (section 10, Q1).
- Evidence: `ripple/docs/research/liquid-blocks-partials.md` (L-1, L-3, L-6, L-7; `ValidBlockTagPlacement`); `ripple/docs/research/base-theme.md` (weaknesses; composition mapping); `ripple/theme/AGENTS.md`.
- Rejected: template-owned composition for everything (the base theme model); snippets-only components (no `{{ content }}` outlet, no schema); captured slots as the general mechanism.

#### D-038 Liquid rules and naming

- Decision: Rules L-1 to L-11 of the Liquid research are adopted as written, with these fixed choices:
  1. Block file names are UNPREFIXED and equal the component id or `<component id>-<part>` (`blocks/button.liquid`, `blocks/dialog-title.liquid`). The CLI accepts `--prefix rp-` at first install for themes with name collisions; the prefix is then read from trailers.
  2. Snippet names are ALWAYS `rp-<id>` (`snippets/rp-button.liquid`). Partial (region) names are ALWAYS `rp-<region>` (D-046).
  3. Params are snake_case. Reserved names MUST NOT be params: `true false nil blank empty content block section form settings for`.
  4. Booleans are tested with `== true`. Enumerations are validated at render against an allow-list and fall back to the default. Responsive strings are escaped and printed unchanged. Every attribute param is escaped; `attributes` is the only raw input.
  5. Every block has `{% doc %}` and `{% schema %}`, accepts `class` and `attributes`, and has at most three styling settings in its schema. Schema option values are prop tokens, never classes.
  6. Strings are locale keys `ripple.<component id>.<key>`; schema labels are `t:ripple.<...>`; English defaults are identical to the other hosts' defaults.
  7. Ripple-owned block files MUST NOT exceed 150 (platform limit: 300 block files).
  8. Ripple Liquid files use only the "Ripple Liquid subset" of tags and filters defined in the Liquid research, so that the local shim can render them.
- Evidence: `ripple/docs/research/liquid-blocks-partials.md` (rules L-1 to L-11; block limit; shim `ripple/docs/research/spikes/liquid/shim.mjs`); `ripple/theme/AGENTS.md`; `ripple/docs/research/base-theme.md` (recommends unprefixed block names with a scaffolder prefix option).
- Rejected: `rp-` prefixed block names by default (longer call sites for agents; the 300-file limit makes collisions unlikely to be the common case).

#### D-039 What Ripple replaces in the base theme

- Decision: The Ripple Liquid theme (doc 14) is a new theme built from Ripple components that keeps the base theme's platform rules and replaces its component layer. Kept: no sections, no JSON templates, no presets, no `{% javascript %}` / `{% stylesheet %}`; `{% block %}` only in templates and layouts; translated UI only; `routes.*`; logical properties and `<bdi>`; one import map; `@theme/*`-style bare specifiers and no relative imports between assets; `AGENTS.md` at most 50 kB. Replaced: all 22 blocks (mapping in section 8.6); every `s-*` element by `rp-*` elements; `snippets/standard-actions-config.liquid` and `assets/standard-actions-override.js` (removed, D-041); utility-only component markup (D-024); captures as slots (D-037); hand-computed image `sizes` and loading at call sites (Image props). Changed rules: resource blocks are self-contained (D-037); component CSS is an asset, not part of `config/styles.css` (D-055); "one custom element per JS file" becomes "one element per source file, shipped as one bundle" (D-054).
- Evidence: `ripple/theme/AGENTS.md`; `ripple/docs/research/base-theme.md` (inventory: 22 blocks, 22 snippets, 13 templates, 32.6 kB gzip JS, 15.9 kB gzip CSS).
- Rejected: patching the base theme in place.

#### D-040 The `html` host

- Decision: The `html` host is any server that prints HTML by hand or by template. Its "binding" is the reference HTML itself: `ripple add` writes one `<id>.html` reference file per component (every fixture, as copyable markup) plus the CSS. The reference HTML files are the normative fixtures for all hosts.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 4.2 (`files.html`), 5.3 (plain HTML snippet).
- Rejected: a template-engine binding for the html host.

### E. Commerce

#### D-041 One Hydrogen cart store per page, on both backends (resolves R2)

- Decision: The cart is `createCartStore()` from `@shopify/hydrogen` in every host.
  1. hydrogen backend: the server mounts `createCartServerHandlers()` at `/api/cart`; the client calls `configureCartEndpoint("/api/cart")` and `createCartStore({ initialData })`.
  2. liquid backend: the client does NOT call `configureCartEndpoint`; the store uses Hydrogen's default handler, which goes through Shopify Standard Actions (`Shopify.actions.updateCart`, `Shopify.actions.getCart`).
  3. Exactly one store per page, created by Ripple and reached through the module accessor of D-042. User code and React hooks read that store; nothing else creates one.
  4. Exactly one copy of the `@shopify/hydrogen` module per page. On Liquid and in the prebuilt `html` bundle it lives inside `ripple.js`; theme code MUST import cart access from the `ripple` specifier and MUST NOT load `@shopify/hydrogen` separately. In bundled hosts it is a peer dependency resolved once by the app's bundler.
  5. Exactly one `Shopify.actions.updateCart.configure` call per page, and it is Hydrogen's. The base theme's `snippets/standard-actions-config.liquid` and `assets/standard-actions-override.js` MUST NOT exist in a Ripple theme (checker RP307). Ripple configures `Shopify.actions.openCart` to open the CartDrawer.
  6. On Liquid the store's data is a summary: line markup and all money text MUST come from region refresh (D-046), never from store data.
  7. When the runtime cannot start (missing platform API, missing Standard Actions, thrown configure), Ripple MUST leave every form untouched so that native form posts work (`usable === false` in D-042).
- Rationale: Ben decision 4. Verified in a spike against a stand-in for the Standard Actions runtime; two stores from one module copy stay consistent. The real Standard Actions runtime was NOT executed (hosts were blocked): SPIKE-01.
- Evidence: `ripple/docs/research/hydrogen-core.md` (R2 verdict, conditions C1 to C7; spike `ripple/docs/research/spikes/hydrogen-core/`); `hydrogen/packages/hydrogen/src/core/cart/`; `ripple/theme/snippets/standard-actions-config.liquid`; `ripple/theme/assets/standard-actions-override.js`; `ripple/theme/assets/s-cart.js`.
- Rejected: Ajax Cart API and Section Rendering API (Ben decision 4); a Ripple-owned cart store; `CartProvider`.

#### D-042 The commerce adapter

- Decision: All commerce elements talk to ONE object, obtained with `getCommerce()` from `<pkg>/commerce` and configured once per page by `configureCommerce(options)` (both names are Ripple's own API, defined here). Its shape:

  ```ts
  interface RippleCommerce {
    backend: "hydrogen" | "liquid";
    host: "html" | "react" | "remix" | "liquid";
    cart: CartStore;                       // from @shopify/hydrogen
    dialect: FormDialect;                  // field-name table, D-043
    submitCart(form: HTMLFormElement, submitter: HTMLElement | null, event: SubmitEvent): Promise<void>;
    setLineQuantity(lineId: string, quantity: number): Promise<void>;
    refresh(regions: string[], options?: { url?: string; reason?: string }): Promise<void>;
    openCart(): void;
    ready: Promise<void>;
    usable: boolean;
  }
  ```

  Elements MUST NOT branch on `backend` or `host`; only the adapter implementations do (`src/commerce/adapter-hydrogen.ts`, `src/commerce/adapter-liquid.ts`, plus per-host `refresh` strategies, D-046).
- Evidence: `ripple/docs/research/hydrogen-core.md` section 4 (adapter interface, element-to-API table 6.3); `CartStore` in `hydrogen/packages/hydrogen/src/core/cart/`.
- Rejected: elements calling Hydrogen or `Shopify.actions` directly; one adapter per element.

#### D-043 Two cart form dialects (resolves R3)

- Decision: The no-JS form field names differ by backend and stay different. Form internals are **host-owned regions** of the contract: fixtures mask them, and the manifest lists both dialects (`liquid.formDialect`, `hydrogenHost.formDialect`).

| Meaning | hydrogen backend (posts to `/api/cart`) | liquid backend (posts to `routes.cart_add_url` / `routes.cart_url`) |
|---|---|---|
| Variant | `merchandiseId` | `id` |
| Quantity (add) | `quantity` | `quantity` |
| Selling plan | `sellingPlanId` | `selling_plan` |
| Line attribute | `attributes.<key>` | `properties[<key>]` |
| Operation | submit button `name="intent"`, values `add increase decrease remove set discount-apply discount-remove note-update attributes-update` | add: `{% form 'product' %}` submit; cart: `name="update"` / `name="checkout"` |
| Line identity | `lineId` | `updates[]` inputs in line order; `line_item.url_to_remove` link for remove |
| Note | `note` | `note` |
| Cart attribute | `attributes.<key>` | `attributes[<key>]` |
| Discount code | `discountCode` | none (no no-JS discount form on Liquid; with JS it goes through the store) |

  With JS, the Liquid adapter translates Liquid fields to the Hydrogen protocol and calls `store.handleFormSubmit` with a synthetic `SubmitEvent` shim (code in the research report). Ripple hook attributes mark fields so elements do not depend on names: `data-rp-field="merchandise-id | quantity | line-id | selling-plan | note | discount-code"`.
- Evidence: `ripple/docs/research/hydrogen-core.md` (R3 verdict, dialect table, `createCartFormRegister`, `attachQuantityInput`); `ripple/theme/AGENTS.md` (commerce contracts: `name="checkout"`, `input[name="id"]`); `ripple/docs/research/liquid-blocks-partials.md` (ProductForm example, 8.x host-owned form internals).
- Rejected: one dialect by renaming Liquid fields (the platform's form endpoints fix them); a server proxy on Liquid.

#### D-044 Quantity changes on Liquid are absolute

- Decision: On the liquid backend every line quantity change is sent as intent `set` with the absolute quantity read from the DOM at event time and `lineId = item.key`. `increase` and `decrease` MUST NOT be used on Liquid. On the hydrogen backend the cart line form's first submit button is `name="intent" value="set"` with the `hidden` attribute (required by `attachQuantityInput`); visible stepper buttons MAY use `increase` / `decrease`.
- Evidence: `ripple/docs/research/hydrogen-core.md` C4 (increase/decrease compute from a line the summary does not hold and can remove the line); `hydrogen/packages/hydrogen/src/core/cart/` (`attachQuantityInput`).
- Rejected: relative intents on Liquid.

#### D-045 No optimistic structural updates (resolves R4)

- Decision:
  1. In `html`, `remix` and `liquid`, elements never create, remove or reorder commerce markup. During a mutation they set `data-pending=""` and `aria-busy="true"` on the affected line, form or root, and MAY update numeric text marked `data-rp-part="count"` from store state. Structure and money text change only by region refresh after the mutation settles.
  2. In `react`, components MAY render structure from store state (including Hydrogen's optimistic lines), because React owns that DOM.
  3. Controls are NOT disabled while pending, except on lines whose id starts with `optimistic:`.
  4. Errors are shown inline in an element printed by the server as `<p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>`; the element fills the text and removes `hidden`. These two writes are on the allow-list.
- Evidence: `ripple/docs/research/hydrogen-core.md` S13, C3; `ripple/docs/research/liquid-blocks-partials.md` (`partials.apply()` replaces DOM); `ripple/docs/research/remix-3.md` (Frames).
- Rejected: client-side templating of cart lines on Liquid or Remix; disabling controls while pending.

#### D-046 Region refresh

- Decision:
  1. A **region** is a named piece of server-rendered markup that can be re-rendered alone. Region names are fixed: `rp-cart-lines`, `rp-cart-summary`, `rp-product-buy`, `rp-product-media`, `rp-product-recommendations`, `rp-collection-results`, `rp-collection-filters`, `rp-collection-toolbar`, `rp-search-results`, `rp-predictive-results`. Projects MAY add names with the `rp-` prefix reserved for Ripple.
  2. In every host the region's root element carries `data-rp-region="<name>"`. On Liquid the region is additionally a `{% partial '<name>' %}` in the template or layout; on Remix a named blocking `<Frame>`.
  3. A form, link or element declares what it invalidates with `data-rp-refresh="<space-separated region names>"`.
  4. Elements request a refresh by calling `getCommerce().refresh(regions, { url })`, which dispatches `rp:refresh` (cancelable) and, unless cancelled, runs the host strategy, then dispatches `rp:refreshed`:
     - `liquid`: `@shopify/partial-rendering` (`partials.fetch` / `partials.apply`), loaded by guarded dynamic import; on any failure `location.assign(url)` or `location.reload()`. `@shopify/partial-rendering`, `@shopify/standard-actions`, `@shopify/standard-events` are platform-provided specifiers; they are NOT npm dependencies.
     - `remix`: reload the named Frames.
     - `react`: call the app-supplied `navigate(url)` from `configureCommerce`; cart regions re-render from store state and need no refresh.
     - `html`: fetch the document at `url` (default: current URL), and replace each `[data-rp-region="<name>"]` element with the same-named element from the response; on failure `location.assign(url)` (SPIKE-10).
  5. Refresh replaces DOM. Therefore an overlay root (Dialog, Drawer) MUST NOT be inside the region its own content refreshes (the region is INSIDE the dialog body), and a `ui-*` root is replaced whole or not at all (D-022).
- Evidence: `ripple/docs/research/liquid-blocks-partials.md` (partials; replace, not morph; guarded import; names are contracts); `ripple/docs/research/remix-3.md` (named Frames); `ripple/theme/AGENTS.md` (partial names are contracts); checker RP403, RP404 in `ripple/docs/research/agent-kit-and-distribution.md` 7.3.
- Rejected: Section Rendering API (Ben decision 4); morphing on Liquid; per-component ad hoc fetches.

#### D-047 Variant selection, filtering and sorting are URL-driven in every host

- Decision: VariantPicker, Filters, SortSelect, FilterChips, PriceRange and Pagination are GET forms and links whose URL fully describes the state (`?variant=` or option params; `filter.*`, `sort_by`, `page`). Without JS they navigate. With JS, `rp-live` intercepts the submit or click, updates the URL with `history.replaceState` (variant) or `pushState` (filters, sort, page), and calls `refresh` with the regions in `data-rp-refresh`. `createProductFormStore`, `createCollectionStore` and their reconcilers are NOT used in V1 in any host.
- Rationale: The Hydrogen product-form and predictive-search stores cannot work on Liquid; using them only on the hydrogen backend would give one component two behaviours and two test matrices. URL state is the one model that is correct without JS.
- Evidence: `ripple/docs/research/hydrogen-core.md` (NO for product form store and predictive search store on Liquid; collection store optional; URL params `filter.*`, `sort_by`); `ripple/theme/assets/s-live-form.js`, `ripple/theme/assets/s-variant-picker.js`; `ripple/docs/research/base-theme.md` (`rp-live-form` needed on Liquid).
- Rejected: Hydrogen product-form store on hydrogen backends (deferred; noted in section 10, Q9); separate `rp-variant-picker` and `rp-live-form` elements (one `rp-live` covers both).

#### D-048 Predictive search

- Decision: PredictiveSearch is a SearchForm (a real GET form to the search route) wrapped in `rp-predictive-search`, with a results container holding region `rp-predictive-results`. With JS, input is debounced and the element calls `refresh(["rp-predictive-results"], { url })` where `url` is the search route with the form's fields. The a11y pattern is "search field plus a list of links" with ArrowDown / ArrowUp moving focus through result links, Escape closing, and a live result count; it is NOT an ARIA combobox. `createPredictiveSearchStore` is not used.
- Evidence: `ripple/docs/research/hydrogen-core.md` (store needs a JSON endpoint `/api/predictive-search`; NO on Liquid); `ripple/theme/assets/s-predictive-search.js`; `ripple/theme/blocks/predictive-search.liquid`; `ripple/docs/research/uisdk-web-elements.md` (combobox 53.0 kB gzip, not idempotent).
- Rejected: `ui-combobox`; `createPredictiveSearchStore`.

#### D-049 Money and images

- Decision: Money text is formatted on the server: Liquid money filters; `formatMoney` from `@shopify/hydrogen` in TSX servers. There is no `rp-money` element. Price is `static`. Images: Hydrogen core has no image helper, so Ripple ships `imageUrl(src, { width, height, crop })` and `imageSrcSet(src, widths)` in `<pkg>`; Liquid uses `image_url`. Image REQUIRES `alt`, `width`, `height`. Money text and image URLs are not portable between backends, so fixtures mask them.
- Evidence: `ripple/docs/research/hydrogen-core.md` (`formatMoney`; no image helper); `hydrogen/packages/hydrogen/src/core/money/`; `ripple/docs/research/liquid-blocks-partials.md` 8.x (masks); `ripple/theme/AGENTS.md` (money filters).
- Rejected: client-side money formatting outside React; a Ripple image custom element.

#### D-050 Checkout and accelerated checkout

- Decision: CheckoutButton is `<button type="submit" name="checkout">` inside the cart form on Liquid, and `<a href="<checkoutUrl>" data-rmx-document>` on the hydrogen backend. Both carry `data-agent-confirm="<sentence>"`. Accelerated checkout (Shop Pay and wallet buttons) is a boolean prop `acceleratedCheckout` on ProductForm and CartSummary that prints platform markup (opaque, D-004). There is no ShopPayButton or BuyButtons component. The irreversible action is also exposed to the agent bridge as an `rp-cart` action `checkout` flagged for confirmation (SPIKE-08).
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 8.3 (options a and b); `ripple/docs/research/liquid-blocks-partials.md` (`accelerated_checkout` prop because `payment_button` needs `form`); `ripple/docs/research/hydrogen-core.md` S18.
- Rejected: wrapping the checkout control in `ui-button` (option a of the agent-kit report): adds a `ui-*` family for one attribute and its behaviour on `<a>` is UNVERIFIED.

#### D-051 Accounts and consent are links, not components

- Decision: V1 has AccountLink only (a link to the Shopify-hosted customer account). There are no order, address or login components and no account blueprint. There is no consent banner component; the platform's banner is used.
- Evidence: `ripple/docs/research/base-theme.md` (inventory has no account templates); `hydrogen/packages/hydrogen/src/customer-account/` exists but was not researched (UNVERIFIED).
- Rejected: OrderList, OrderDetail, AddressForm, ConsentBanner in V1 (section 10, Q7).

### F. Distribution, tooling, quality

#### D-052 One npm package

- Decision: One package. Placeholder name `ripple-kit`; binary `ripple`. The name appears in source only in `src/identity.ts` (`PKG_NAME`) and as the build token `__PKG__`; CI has a rename test. Documents write `<pkg>` for the package name. Export paths: `<pkg>` (helpers `rv`, `cx`, `imageUrl`, `imageSrcSet`, types, manifest loader; no side effects), `<pkg>/elements`, `<pkg>/elements/<tag>`, `<pkg>/commerce`, `<pkg>/commerce/<tag>`, `<pkg>/react`, `<pkg>/remix`, `<pkg>/agent`, `<pkg>/testing`, `<pkg>/check`, plus `browser/*`, `css/*`, `registry/*`, `manifest.json`. `dependencies`: exactly `@ui-sdk/core` and `@ui-sdk/web`. `peerDependencies`: `@shopify/hydrogen` (`>=2026.10.3 <2027`); optional peers `react` (>=19), `tailwindcss` (v4), `playwright`, `@shopify/theme-check-node`.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 11.1 to 11.4 (`ripple-kit` free on npm on 2026-11-21; `ripple`, `rippleui`, `@ripple-ui` taken).
- Rejected: one package per host; a separate CLI package.

#### D-053 Library versus scaffolded code

- Decision: **Library** (versioned, imported or copied whole, never edited): all element and commerce JavaScript, `useElement`, hooks, helpers, the checker, the CLI, the generator, `tokens` generator, the agent entry. **Scaffolded** (owned by the project after install, editable, upgraded by three-way merge): component CSS, `tokens.css`, `theme.css`, `base.css`, `props.css`, React and Remix bindings, Liquid blocks and snippets, HTML reference files, blueprints, locale entries, skills. Scaffolded files carry no "do not edit" banner.
- Evidence: Ben decision 5; `ripple/docs/research/agent-kit-and-distribution.md` 5.3, 6.1.
- Rejected: scaffolding element JS (behaviour drift breaks the contract and the upgrade path).

#### D-054 JavaScript delivery

- Decision:
  1. `browser/ripple.js` is one prebuilt ES module: UI SDK kernel, Ripple runtime (lazy loader, Invoker Commands polyfill, opener listener, announcer, refresh strategies), every `rp-*` element, and the Hydrogen cart subset. `browser/ripple.elements.js` is the same without commerce and Hydrogen.
  2. Lazy chunks: `ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`. The runtime imports a chunk when a matching `ui-*` tag is in the document at `DOMContentLoaded` or is inserted later. Chunks import the kernel from the main bundle so that one copy of `@ui-sdk/core` exists.
  3. `liquid`: files are `assets/ripple.js` and `assets/ripple-<chunk>.js`; all cross-file imports are bare specifiers (`ripple`, `ripple/tabs`, `ripple/tooltip`, `ripple/toast`, `ripple/agent`) resolved by entries that `snippets/rp-import-map-entries.liquid` adds to the theme's single import map. No relative imports between assets.
  4. `html` and `remix`: the same files with relative imports, copied by `ripple init` to a public directory (`public/ripple/` on Remix).
  5. `react` (bundled apps): import `<pkg>/elements` and `<pkg>/commerce` once in the client entry.
  6. The agent bridge is a separate opt-in entry (`<pkg>/agent`, `ripple-agent.js`).
  7. Loading order on Liquid, in `snippets/rp-head.liquid`, rendered after the import map and before `{{ content_for_header }}`: stylesheet tag for `ripple.css`; `{% render 'rp-tokens' %}`; inline Invoker Commands polyfill; `<script type="module" src="{{ 'ripple.js' | asset_url }}">`.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (own bundle sharing one core copy; weights); `ripple/docs/research/liquid-blocks-partials.md` (loading section; no relative imports; one import map); `ripple/docs/research/remix-3.md` (prebuilt `public/ripple/`); `ripple/theme/snippets/import-map.liquid`.
- Rejected: one JS file per element loaded per template (base theme model: many requests, duplicated kernel risk); bundling through the Remix asset server.

#### D-055 CSS delivery

- Decision:
  1. `react`, `remix`, `html` (project with a CSS entry): scaffold into `paths.styles`: `ripple.css` (the layer statement of D-025 followed by `@import`s inside a marker region), `tokens.css`, `theme.css`, `base.css`, `props.css`, `components/<id>.css`. The project's CSS entry imports `ripple.css` first, then `tailwindcss` if used.
  2. `html` with no build MAY link the prebuilt `browser/ripple.css` (all components).
  3. `liquid`: ONE file `assets/ripple.css`, unminified and editable, built by the CLI by concatenation: layer statement, tokens, base, props, then one marker region per installed component, each region with its own provenance trailer. It is loaded BEFORE `styles.min.css`. `config/styles.css` receives only a marker region containing the generated `@theme reference` block, so that compiled utilities can name Ripple tokens (SPIKE-03). Ripple block and snippet files contain no utilities, so a Ripple theme renders correctly even when the Canvas / Sidekick compiler never runs.
- Rationale: "Classic Edit Code alone does not invoke the compiler"; a component library that silently loses its CSS when a merchant edits code is not acceptable. This changes the base theme rule "single CSS source `config/styles.css`" (section 10, Q2).
- Evidence: `ripple/theme/AGENTS.md` (CSS pipeline); `ripple/docs/research/base-theme.md` (recommends component CSS in `config/styles.css`, fallback precompiled asset); `ripple/docs/research/liquid-blocks-partials.md` (loading: `ripple.css` stylesheet tag); `ripple/docs/research/styling-spike.md` (Canvas `@theme reference` support UNVERIFIED).
- Rejected: installing component CSS into `config/styles.css` (depends on a compiler Ripple does not control); loading both.

#### D-056 Provenance trailers; no lockfile

- Decision: Every scaffolded file ends with a provenance trailer, which is the lock record:
  - `.liquid`: `{% comment %} ripple <id> <pkg>@<version> sha256:<64 hex> {% endcomment %}` (after `{% endschema %}`).
  - `.css`, `.ts`, `.tsx`, `.js`: `/* ripple <id> <pkg>@<version> sha256:<64 hex> */`.
  - `.html`: `<!-- ripple <id> <pkg>@<version> sha256:<64 hex> -->`.
  - `SKILL.md`: frontmatter `metadata: { source, version, hash }`.
  `<id>` is `<component id>/<file key>`. The hash is of the upstream file body with CRLF normalised to LF. "Modified" is computed by re-hashing. `ripple status --json` prints the computed lock. npm hosts have `ripple.json` at the project root for configuration only (`host`, `paths.components`, `paths.styles`, `css`, `prefix`). Liquid themes have no configuration file. Patches to files Ripple does not own are marker regions (`/* ripple:start <name> */ ... /* ripple:end <name> */`, `<!-- ripple:start <name> --> ... <!-- ripple:end <name> -->`), single inserted lines (`{% render 'rp-head' %}`, `{% render 'rp-import-map-entries' %}`), and keyed JSON merges (locales under key `ripple`; settings group `t:ripple.settings.name`).
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 6.2 to 6.5, 6.8 (Shopify stores only theme directories plus `AGENTS.md` and `DESIGN.md`, so a root lockfile would be lost).
- Rejected: `ripple.lock`; `components.json` holding hashes.

#### D-057 CLI

- Decision: Commands: `init`, `add <component...>` (`--all`, `--blueprint <id>`, `--dry-run`, `--diff`, `--prefix`), `diff`, `upgrade` (`--dry-run`, `--ours`, `--theirs`, `--write-conflicts`, `--force`), `remove`, `status` (`--json`), `check` (`--json`, `--url`, `--browser`, `--rule`, `--max-warnings`), `docs <component>`, `manifest`, `skills sync`, `skills check`. Exit codes: 0 success, 1 findings or conflicts, 2 usage or environment error. Every write is plan-then-write with temp file and rename; a collision with an untrailered file aborts. Host detection order: `--host` flag, `ripple.json`, Liquid theme (`layout/theme.liquid` + `templates/` + `config/settings_schema.json`; error when `sections/` or JSON templates exist), `package.json` (remix, react, else html), else error. `upgrade` uses the zero-dependency three-way merge of the research report (regions from hunks that overlap or touch; markers `<<<<<<< yours`, `||||||| installed`, `=======`, `>>>>>>> upstream`; markers are written only with `--write-conflicts`).
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 6.4, 6.6, 6.7.
- Rejected: an interactive-only CLI (agents need flags and JSON); git as a dependency for merging.

#### D-058 Manifest

- Decision: `manifest.json` (schema `manifest.schema.json`) is assembled from per-component JSON files. Key names are fixed in section 4.8. The checker, generator, docs, CLI and skills read only the manifest; no tool has a second table of component facts.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 4.1 to 4.3.
- Rejected: deriving the manifest from source by parsing.

#### D-059 Checker

- Decision: `ripple check` has four layers: S (source), H (rendered HTML, bundled parse5), B (browser, Playwright, optional), P (project state). Rule ids are those of the research report and are stable public API: RP101 to RP117 (usage and structure), RP201 to RP204 (accessibility), RP301 to RP307 and RP320 to RP321 (no-JS, commerce, agent attributes), RP401 to RP406 (Liquid), RP501 to RP512 (project state), RP601 to RP609 (browser), and `TC:<CheckName>` for Theme Check findings. Message format: `<RULE> <severity>  <location>  <component>: <problem>` followed by `found` / `allowed` / `fix` / `why` / `docs` lines; `--json` gives the same fields. Rules that refer to components this ledger cut or changed (Menu in RP204, "drawer viewport" in RP303, "Shop Pay" in RP320) MUST be rewritten by doc 07 to match this ledger; ids do not change. A prohibited `ui-*` tag (D-022) is reported by RP111. Doc 07 adds one rule, RP118 (error, layer H): a `data-state` attribute on or inside a Ripple root, or a `data-rp-*` attribute name that is not listed in section 4.4.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 7.1 to 7.3 (prototype `ripple/docs/research/spikes/agent-kit/`).
- Rejected: relying on Theme Check alone (it validates only LiquidDoc unions with literal arguments).

#### D-060 Agent documentation and skills

- Decision: The package ships `docs/INDEX.md`, `docs/llms.txt`, `docs/components/<id>.md` (generated from the manifest), `docs/guides/`, `docs/rules/<RULE>.md`, and 14 skills: `ripple`, `ripple-setup`, `ripple-compose-page`, `ripple-commerce`, `ripple-discovery`, `ripple-theming`, `ripple-customize-component`, `ripple-new-component`, `ripple-check-and-fix`, `ripple-upgrade`, `ripple-liquid`, `ripple-react`, `ripple-remix`, `ripple-agent-ready`. Each skill is at most 300 lines. `ripple skills sync` writes them to `.claude/skills` and `.agents/skills`. The package is also a pi package (`keywords: ["pi-package"]`, `pi.skills`). `ripple init` writes a generated section into `AGENTS.md` between markers; it is at most 12,000 bytes and MUST be sufficient to use Ripple correctly without any skill.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` section 9; `ripple/theme/AGENTS.md` (50 kB limit).
- Rejected: documentation only on a website; one large skill.

#### D-061 Evals

- Decision: The eval suite is that of the research report: tasks T01 to T17 (T18 is dropped), harness adapters `claude-code`, `pi`, `opencode`; scoring weights 35 / 15 / 20 / 10 / 10 / 10; pass at 80 or more; the "Sidekick bar" thresholds as written there. Liquid tasks have two tiers: local (shim render + checker) and live (preview store). T01, T02 and T08 MUST run by the end of the commerce milestone.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` section 10.
- Rejected: evaluating only by human review.

#### D-062 Beta dependencies (resolves R5)

- Decision: (1) UI SDK packages are pinned exactly (D-022). (2) Only three `ui-*` families are used, so the exposed beta surface is small. (3) The upgrade-stability test (D-063 tier 3) and the generated pre-upgrade display rules are the tripwire: a UI SDK bump is a PR that regenerates upgrade-snapshot fixtures and must pass every tier. (4) `@shopify/hydrogen` is a peer with the range in D-052; all use goes through the adapter (D-042). (5) `@shopify/partial-rendering` and Standard Actions are touched only inside `src/commerce/adapter-liquid.ts` and the Liquid refresh strategy, behind feature tests with the fallbacks of D-041 item 7 and D-046. (6) Remix 3 APIs appear only in scaffolded Remix bindings and the Remix refresh strategy.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (14 versions in 9 days); `ripple/docs/research/hydrogen-core.md` (platform specifiers 404 on npm); `ripple/docs/research/remix-3.md` (`remix@3.3.0`).
- Rejected: vendoring UI SDK source; version ranges.

#### D-063 Testing tiers and targets

- Decision: Doc 13 specifies these tiers; each component spec lists its acceptance tests against them.
  1. Generation check (`pnpm gen --check`).
  2. Fixture conformance: every host renders every fixture; output MUST equal the reference HTML after canonicalisation (sorted attributes; lowercase attribute names; boolean attributes as `name=""`; whitespace collapsed; comments removed, including React's `<!-- -->`; host extras removed: `data-rmx-*`; masks applied). Liquid renders locally through the liquidjs shim.
  3. Upgrade stability: a `MutationObserver` installed before module scripts records zero mutations inside component roots, outside the allow-list.
  4. Hydration (React, both script orders) and morph navigation (Remix).
  5. Behaviour, keyboard and a11y, including `checkPattern` from `@ui-sdk/core/testing` where the manifest names a pattern.
  6. No-JS flows with scripting disabled, for every component with `noJs.level: full`.
  7. Commerce end to end against mock.shop for the hydrogen backend.
  8. Liquid live tiers (render conformance and behaviour) against a preview store with the Liquid July '26 developer preview. Blocked until Ben provides a store (section 10, Q5); until then tiers 2 to 6 on the shim are the gate for Liquid.
  9. Cross-engine runs (WebKit, Gecko) for tiers 3, 5, 6.
  10. Size budgets (D-064).
  11. Evals (D-061).
- Evidence: `ripple/docs/research/liquid-blocks-partials.md` (test tiers; shim `ripple/docs/research/spikes/liquid/shim.mjs`, canonicaliser `canon.mjs`; mock.shop cannot back Liquid); `ripple/docs/research/react-and-custom-elements.md` (conformance normalisation); `ripple/docs/research/hydrogen-core.md` S19.
- Rejected: screenshot comparison as the conformance mechanism (used only in evals).

#### D-064 Size budgets

- Decision: Budgets live in `size-budget.json` and fail CI when exceeded (gzip): `ripple.js` at most 45 kB; `ripple.elements.js` at most 30 kB; lazy chunks: tabs 10 kB, tooltip 22 kB, toast 15 kB; agent entry 13 kB; CSS: tokens + base at most 2.2 kB, `props.css` at most 5.2 kB, full `ripple.css` at most 45 kB. The base-theme research's idea "JS no larger than the base theme (32.6 kB gzip)" is NOT adopted: the UI SDK kernel (12.8 kB) and the Hydrogen cart subset (13.2 kB) are fixed costs of Ben decisions 3 and 4.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (weights); `ripple/docs/research/hydrogen-core.md` (bundle sizes); `ripple/docs/research/styling-spike.md` (CSS budgets); `ripple/docs/research/base-theme.md` (base theme sizes).
- Rejected: no budgets.

#### D-065 Agent surface

- Decision: Two audiences. (1) Any browser agent: served by real links, forms, native controls, correct roles and names (kinds `static` and `native` appear only in the accessibility tree). (2) An in-page agent using the UI SDK bridge (`createAgent` from `@ui-sdk/web/agent`), opt-in, about 12 kB gzip: it sees `ui-*` and `rp-*` primitives and the methods in each primitive's `agent` key. Attributes: `data-agent-confirm="<sentence>"`, `data-agent-secret`, `data-agent-hidden`; no other `data-agent-*`. Manifest key `agent` records `surface` (`accessibility-tree | bridge`), `actions`, `confirm`, `secret`.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` section 8; `uisdk/packages/web/src/agent.ts`.
- Rejected: loading the bridge by default.

#### D-066 Language, direction, motion, accessibility baseline

- Decision: (1) Every user-visible default string is a locale key `ripple.<component id>.<key>` with an English default that is identical in all hosts; TSX hosts take overrides through props, Liquid through `locales/*.json`. (2) CSS uses logical properties only; `start` / `end` everywhere, never `left` / `right`, in prop values too. (3) Motion follows D-029 and is disabled under `prefers-reduced-motion`. (4) Accessibility target is WCAG 2.2 AA; focus is always visible (`--color-ring`); minimum target size 24 by 24 CSS px, controls default to `--spacing-control-md`. (5) Status changes are announced through `announce()` or an Announcer region; cart changes MUST be announced.
- Evidence: `ripple/theme/AGENTS.md` (translated UI only; RTL; motion); `ripple/docs/research/liquid-blocks-partials.md` L-10; `ripple/theme/assets/live-region.js`.
- Rejected: hard-coded English strings; physical direction properties.

#### D-067 Milestones (for PLAN.md)

- Decision: Order of work: M0 spikes that need no store (SPIKE-04, 05, 06, 07, 10); M1 foundations (manifest schema, generator, checker layers S and H, tokens, layers, props, runtime, doc 09 components, fixture conformance in four hosts); M2 interactive (doc 10); M3 commerce (docs 05, 11; eval harness with T01, T02, T08); M4 chrome and blueprints (doc 12); M5 Liquid theme (doc 14) and live tiers (needs SPIKE-01, 02, 03, 09); M6 full evals and the Sidekick bar. Liquid bindings are generated and shim-tested from M1 onward; M5 is the assembled theme, not the first Liquid work.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` (milestone implication: checker, manifest schema, generator in foundations).
- Rejected: Liquid last (Ben's update makes Liquid a first-class host).

#### D-068 Icons

- Decision: Icon prints an inline `<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">` using `currentColor`. Ripple ships its own small icon set (no icon library dependency); names are in section 6.6. Sources are `icons/<name>.svg`. TSX: `<Icon name="cart" />`. Liquid: `{% render 'rp-icon', name: 'cart' %}` (Icon is a snippet, not a block, so that it costs one statement inside any file). An icon is always decorative; the accessible name belongs to the control around it (IconButton REQUIRES `ariaLabel`).
- Evidence: `ripple/docs/research/base-theme.md` (an icon button costs three statements; Icon as snippet); `ripple/theme/assets/icon-*.svg`.
- Rejected: an icon font; a third-party icon package (Ben decision 3); `<img>` icons (cannot take `currentColor`).

---

## 2. Risk register: resolution of R1 to R6

| Risk | Resolution | Decided by | Decisions | Residual spike |
|---|---|---|---|---|
| R1 React hydration versus custom elements mutating attributes | DECIDED. Print the upgrade-stable contract; rules R-1 to R-5; `useElement`; native elements where possible. | Run (react 19.3.1) | D-002, D-033 | none |
| R2 Hydrogen core stores on Liquid through the Standard Actions default handler | DECIDED for the cart store (yes, under D-041 conditions). Product-form and predictive-search stores: NO, replaced by URL + region refresh. | Run against a stand-in runtime; real runtime not executed | D-041, D-047, D-048 | SPIKE-01 |
| R3 No-script cart form field names | DECIDED. Two dialects, host-owned form internals, adapter translates. | Source reading + run | D-043, D-044 | none |
| R4 Optimistic structural updates in Liquid | DECIDED. None outside React; pending state + numeric text; structure by region refresh. | Run (`partials.apply` replaces DOM) | D-045, D-046 | SPIKE-02 (real partial behaviour) |
| R5 Beta dependencies | DECIDED. Exact pins, three `ui-*` families, adapter isolation, tripwire tests. | Evidence of churn | D-022, D-062 | none |
| R6 Tailwind utilities without a build | DECIDED. Ripple needs no Tailwind; utilities need the project's own compile; `@tailwindcss/browser` forbidden. | Run | D-030, D-055 | SPIKE-03 (Canvas compiler) |

---

## 3. Spike tasks

A spike never blocks spec writing or implementation: writers specify the DEFAULT path in full and the FALLBACK in a `Fallback (SPIKE-nn)` subsection. Each spike produces a short report in `docs/research/spikes/<name>/` and a one-line update to this ledger.

| Id | Name | Question | DEFAULT path (specified and built first) | FALLBACK path | Needs | Owner doc |
|---|---|---|---|---|---|---|
| SPIKE-01 | `liquid-standard-actions-runtime` | Does Hydrogen's default cart handler work against the real Standard Actions runtime on a preview store (add, set, remove, note, discount, `getCart`, `openCart`)? | D-041: Hydrogen cart store with no `configureCartEndpoint`. | The Liquid adapter implements `cart` as a thin object with the same `getState` / `subscribe` / `handleFormSubmit` surface that calls `Shopify.actions.updateCart` / `getCart` directly. Needs Ben's sign-off (weakens decision 4). Elements do not change. | Preview store | 05 |
| SPIKE-02 | `liquid-preview-store-rendering` | Does the platform wrap block or partial output in an element? Do `partials.fetch` / `apply` behave as the local shim assumes (the 11 questions in the Liquid research)? | No wrapper; contracts identical to other hosts; region root carries `data-rp-region`. | The canonicaliser unwraps the platform wrapper; `base.css` gives the wrapper `display: contents`; region lookup uses the wrapper. | Preview store | 14 |
| SPIKE-03 | `canvas-theme-reference` | Does the Canvas / Sidekick compiler accept the layer statement and an `@theme reference` block in `config/styles.css`? | D-055: marker region with `@theme reference`. | Omit the region. Utilities name Ripple tokens with arbitrary values (`bg-(--color-primary)`); documented in the `ripple-liquid` skill. | Preview store with Canvas | 03, 14 |
| SPIKE-04 | `rp-root-only-primitive` | Does `definePrimitive` + `createParts` with only a `root` part behave correctly at runtime (upgrade, destroy and recreate, agent bridge)? | D-019 item 1. | A base class `RippleElement extends HTMLElement` in `src/runtime/element.ts` with the same public surface (events, `api` methods, attribute reflection) and manual bridge registration. | Local | 04 |
| SPIKE-05 | `invoker-commands-hosts` | Do React 19 and Remix 3 print `commandfor` / `command` / `popovertarget` unchanged on `<button>`, and does the polyfill work in WebKit and Gecko? | D-008: attributes printed by the binding; polyfill in `ripple.js`. | Bindings also print `data-rp-open="<id>"` / `data-rp-close="<id>"` on the same buttons and the runtime's opener listener handles them (add `data-rp-close` to section 4.4). | Local | 04, 06 |
| SPIKE-06 | `cross-engine-features` | WebKit and Gecko: attribute-token props, `pow()`, relative colour, anchor positioning, `@media (scripting: none)`, `closedby`, `<details name>`, `revert-layer`. Confirm the floor of D-032. | Features behind `@supports` with the stated fallbacks. | Per feature: literal type scale; literal foreground colours; centred popover (or a 1 kB positioning routine in the runtime); Tabs shows only the default panel without JS; raise the floor and record it here. | Local; WebKit and Gecko builds | 03, 13 |
| SPIKE-07 | `navigation-menu-popover` | Are `popover` panels with hover intent usable for a desktop mega menu (focus order, hover gaps, nested popovers, Remix morph)? | D-017. | CSS-only dropdowns opened by `:hover` and `:focus-within`, with a disclosure button toggling `aria-expanded` for touch and keyboard. | Local | 12 |
| SPIKE-08 | `agent-bridge-confirm` | Does the bridge enforce confirmation for an action declared in an `rp-*` primitive's `agent` key, and does it honour `data-agent-confirm` on a native control inside an `rp-*` root? | D-050: `rp-cart` action `checkout` flagged for confirmation + attribute on the control. | Attribute only; the `ripple-agent-ready` skill states that host agents MUST confirm controls carrying `data-agent-confirm`. | Local | 08 |
| SPIKE-09 | `liquid-recommendations-region` | Can a partial be fetched from `routes.product_recommendations_url` (`?product_id=&limit=&intent=`) so that `recommendations` is populated without the Section Rendering API? | `rp-recommendations` calls `refresh(["rp-product-recommendations"], { url })` when it nears the viewport. | On Liquid, ProductRecommendations renders a FeaturedCollection of a merchant-chosen collection (no lazy load). hydrogen backend is unaffected (server-rendered from the Storefront API). | Preview store | 11 |
| SPIKE-10 | `html-region-refresh` | Is document fetch + replacement of `[data-rp-region]` elements robust (focus, scroll, form state, scripts)? | D-046 item 4, `html` strategy. | `location.assign(url)` (full navigation). | Local | 05 |

---

## 4. Naming and conventions

### 4.1 Names and prefixes

| Thing | Rule | Example |
|---|---|---|
| Project name in prose | Ripple | |
| npm package | placeholder `ripple-kit`; written `<pkg>` in documents; only in `src/identity.ts` | `import { rv } from "<pkg>"` |
| CLI binary | `ripple` | `ripple add button` |
| Component name | PascalCase, singular noun | `ProductCard` |
| Component id | kebab-case of the name; unique; used for files, classes, docs, manifest key `name` | `product-card` |
| Part name | kebab-case | `title`, `panel` |
| Part export (TSX) | `<Component><Part>` | `DialogTitle` |
| Ripple custom element tag | `rp-<name>`; one tag per element; primitive name equals tag | `rp-dialog` |
| UI SDK custom element tag | `ui-<name>`; only the families in D-022 | `ui-tabs` |
| CSS class | `rp-<component id>` (root), `rp-<component id>-<part>` (part). No other class is ever printed by Ripple. | `rp-dialog-title` |
| Blueprint id | kebab-case | `collection` |
| Region name | `rp-<area>-<what>` (D-046) | `rp-cart-lines` |
| Locale key | `ripple.<component id>.<key>`; key is snake_case | `ripple.cart-line.remove` |
| Checker rule id | `RP` + three digits | `RP101` |
| Spike id | `SPIKE-nn` | `SPIKE-04` |

The `rp-` prefix for classes and elements is configurable only at library build time (manifest `prefix`); documents always write `rp-`.

### 4.2 Case rules by surface

| Surface | Case | Example for prop "full width" |
|---|---|---|
| Manifest prop `name`, TSX prop | camelCase | `fullWidth` |
| Liquid param, Liquid setting id | snake_case | `full_width` |
| HTML attribute | `data-` + kebab-case | `data-full-width` |
| File names (all hosts) | kebab-case | `product-card.tsx` |

The mapping is mechanical; no component may define an exception. The only cross-host exceptions are global: React `className` for `class`; TSX rest props for Liquid `attributes`.

### 4.3 Prop attributes

- An enumerated prop renders `data-<prop>="<value>"`. The default value MUST still be printed (so CSS and tests never depend on absence), except where the component spec lists the attribute as "omitted at default".
- A boolean prop renders `data-<prop>=""` when true and nothing when false. Exception: the responsive `hidden` prop renders `data-hidden="true"`, `data-hidden="true md:false"`.
- A responsive prop renders the token string of D-028.
- A prop that IS a native attribute renders that attribute, not `data-`: `id`, `href`, `target`, `rel`, `type`, `name`, `value`, `checked`, `disabled`, `required`, `placeholder`, `min`, `max`, `step`, `alt`, `width`, `height`, `loading`, `fetchpriority`, `sizes`, `for`, `commandfor`, `command`, `popovertarget`, `open`, `aria-label`.
- Reserved attribute names written by UI SDK, which Ripple CSS MUST NOT select without a component class in the same selector: `data-align`, `data-side`, `data-orientation`, `data-type`, `data-value`, `data-count`, `data-index`, `data-open`, `data-closed`, `data-disabled`, `data-pending`, `data-selected`, `data-checked`, `data-active`, `data-current`, `data-slot`.

### 4.4 Ripple hook attributes (complete list)

Hook attributes are read by JavaScript and tests. CSS does not select them (exception in D-021).

| Attribute | On | Value | Meaning |
|---|---|---|---|
| `data-slot` | custom element roots only | the tag name | UI SDK kernel part marker |
| `data-rp-part` | native descendants of an `rp-*` root | part name (kebab-case) | Identifies a part to the element. Shared names: `count`, `error`, `status`, `input`, `increment`, `decrement`, `prev`, `next`, `viewport`, `item`, `results`, `submit` |
| `data-rp-field` | form controls in commerce forms | `merchandise-id`, `quantity`, `line-id`, `selling-plan`, `note`, `discount-code` | Dialect-independent field identity (D-043) |
| `data-rp-line` | cart line root | line id (hydrogen) or line key (liquid) | Identifies a cart line |
| `data-rp-open` | `<a href>` openers | dialog id | Opener pattern (D-009) |
| `data-rp-refresh` | forms, links, commerce roots | space-separated region names | Regions to refresh after the action (D-046) |
| `data-rp-region` | region root element | region name | Marks a refreshable region (D-046) |
| `data-rp-js` | controls | `inflow`, `overlay`, `fallback` | Visibility relative to element definition (D-021) |
| `data-default-open` | `<dialog>` | empty | Open on connect (D-008) |
| `data-agent-confirm`, `data-agent-secret`, `data-agent-hidden` | controls | sentence / empty | Agent bridge (D-065) |
| `data-rmx-*` | Remix only | see D-034 | Host extras; removed by the canonicaliser |

### 4.5 CSS custom properties

| Kind | Pattern | Example |
|---|---|---|
| Dial | `--rp-<name>` (list in D-026) | `--rp-radius` |
| Token in a Tailwind namespace | Tailwind's name | `--color-primary`, `--spacing-gutter`, `--radius-control`, `--text-lg` |
| Other global token | `--rp-<group>-<name>` | `--rp-duration-fast`, `--rp-z-overlay` |
| Component public variable | `--rp-<component id>-<name>` | `--rp-button-height` |
| Component private variable | `--_<name>` | `--_bg` |

Tone slots: every component with `tone` or `variant` colours consumes exactly three private slots, `--_bg`, `--_fg`, `--_border`, set by its modifier rules.

### 4.6 Files

- One component = one id = one CSS file `<id>.css`, one TSX file `<id>.tsx` per TSX host, one or more Liquid files (`blocks/<id>.liquid`, `blocks/<id>-<part>.liquid`, `snippets/rp-<id>.liquid`), one HTML reference file `<id>.html`, one manifest file `<id>.json`, one doc `docs/components/<id>.md`.
- Element source: `src/elements/<tag>.ts`, `src/commerce/<tag>.ts`.
- Tests: `<name>.test.ts` next to the source.
- Liquid infrastructure snippets: `rp-head`, `rp-tokens`, `rp-import-map-entries`, `rp-icon`.

### 4.7 Events

See D-023. Summary: element events `openchange`, `valuechange`, `indexchange`, `action` (lowercase, non-bubbling, on the root); document events `rp:refresh`, `rp:refreshed`; React callbacks `onOpenChange`, `onValueChange`, `onIndexChange`, `onAction` with `(value, detail)`.

### 4.8 Manifest key names

Top level: `manifestVersion`, `package`, `prefix` (`css`, `element`, `liquidFile`), `pins`, `scales`, `hosts`, `components`, `blueprints`.

Component: `name` (the id), `title` (PascalCase name), `category`, `kind`, `status`, `since`, `summary`, `useWhen`, `dontUseWhen`, `partOf`, `root` (`elements`, `class`, `requiresId`), `props[]`, `content` (`model`: `none | text | flow | parts`), `parts[]`, `template`, `state[]`, `events[]`, `commands[]`, `fixtures[]`, `noJs` (`level`, `behavior`, `fallbackHref`, `hideUntilDefined`), `a11y` (`pattern`, `checkPattern`, `name`, `keyboard`, `focus`, `announces`), `agent` (`surface`, `component`, `actions`, `confirm`, `secret`), `dependencies` (`components`, `embeds`, `elements`, `uiSdk`, `hydrogen`, `tokens`, `icons`, `locale`), `liquid` (`tier`, `block`, `snippet`, `partials`, `formDialect`, `embeddedBy`), `hydrogenHost` (`formDialect`), `rules[]`, `files` (`shared`, `html`, `react`, `remix`, `liquid`).

Prop: `name`, `type` (`enum | scale | boolean | string | number | id | url | object`), `values`, `scale`, `objectType`, `default`, `required`, `responsive`, `attribute`, `liquid` (`name`, `surface`: `param | setting`, `settingType`), `hosts`, `description`.

Fixture: `name`, `props`, `children`, `parts`, `html`, `hosts`, `mask`, `generated` (`template | upgrade-snapshot | hand`).

File: `source`, `target`, `type` (`css | binding | block | snippet | asset | types | blueprint`), `mode` (`owned | patch`), `generated`.

`category` values: `layout`, `typography`, `media`, `actions`, `forms`, `feedback`, `navigation`, `overlays`, `disclosure`, `product`, `cart`, `discovery`, `chrome`, `utilities`. `status` values: `stable`, `beta`, `planned`.

---

## 5. Directory layout

### 5.1 The Ripple repository (complete tree)

```text
ripple/
  package.json  pnpm-lock.yaml  tsconfig.json  size-budget.json
  README.md  PLAN.md  AGENTS.md  LICENSE
  bin/
    ripple.mjs                       # checked-in wrapper that imports the built CLI
  docs/                              # the specs
    00-decisions.md ... 14-liquid-theme.md
    research/                        # the eight reports and spikes/ (read-only history)
  theme/                             # the base theme: reference only, never shipped, never edited
  src/
    identity.ts                      # PKG_NAME, the only place the package name is written
    index.ts                         # rv, cx, imageUrl, imageSrcSet, types, manifest loader (no side effects)
    responsive.ts  image.ts  types.ts
    runtime/
      index.ts  loader.ts  commands-polyfill.ts  opener.ts  announcer.ts
      element.ts                     # SPIKE-04 fallback base class; absent on the default path
    elements/
      index.ts                       # defines non-commerce rp-* elements and registers lazy ui-* chunks
      rp-dialog.ts  rp-carousel.ts  rp-quantity.ts  rp-navigation-menu.ts
      ui-tabs.ts  ui-tooltip.ts  ui-toast.ts   # lazy chunk entries; ui-toast.ts also exports toast()
    commerce/
      index.ts                       # getCommerce, configureCommerce; defines commerce elements
      adapter.ts  adapter-hydrogen.ts  adapter-liquid.ts  dialect.ts
      refresh-html.ts  refresh-liquid.ts  refresh-remix.ts  refresh-react.ts
      rp-cart.ts  rp-product-form.ts  rp-live.ts  rp-predictive-search.ts  rp-recommendations.ts
    react/
      index.ts  use-element.ts  hooks.ts
    remix/
      index.ts
    agent/
      index.ts
    testing/
      index.ts  canonicalize.ts  fixtures.ts  upgrade-diff.ts  liquid-shim.ts
    check/
      index.ts  engine.ts  report.ts
      rules/<RULE>.ts                # one file per rule id
    cli/
      index.ts  detect-host.ts  trailer.ts  merge3.ts  plan.ts
      commands/<command>.ts          # init add diff upgrade remove status check docs manifest skills
    gen/
      index.ts  html.ts  liquid.ts  react.ts  remix.ts  types.ts
      props-css.ts  theme-css.ts  display-css.ts  docs.ts  registry.ts  agents-md.ts
  css/
    layers.css  tokens.css  base.css           # hand-written
    theme.css  props.css                       # generated, committed
  icons/
    <name>.svg
  locales/
    en.default.json                  # source of every ripple.<component id>.<key> string
  components/
    <id>/
      <id>.json                      # manifest entry: the source of truth
      <id>.css
      <id>.test.ts
      fixtures/<fixture>.html        # reference HTML, generated or snapshot, committed
      html/<id>.html
      react/<id>.tsx
      remix/<id>.tsx
      liquid/blocks/<id>.liquid  liquid/blocks/<id>-<part>.liquid  liquid/snippets/rp-<id>.liquid
  blueprints/
    <id>/
      blueprint.json
      html/  react/  remix/  liquid/
  skills/
    <skill>/SKILL.md  <skill>/ripple.json
  guides/
    <topic>.md                       # hand-written guides copied into the package docs
  evals/
    tasks/T<nn>/  adapters/  rubric/  runs/
  examples/
    html/  react/  remix/  liquid/   # liquid/ is the Ripple theme specified by doc 14
  test/
    conformance/  upgrade/  hydration/  nojs/  commerce/  liquid/  cross-engine/
  pkg/                               # build output: the publishable package (not committed)
```

### 5.2 The published package

As in `ripple/docs/research/agent-kit-and-distribution.md` 11.2: `bin/`, `dist/{index,elements,commerce,react,remix,agent,testing,check,cli}`, `browser/` (`ripple.js`, `ripple.elements.js`, `ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`, `ripple-agent.js`, `ripple.css`), `css/`, `registry/` (`index.json`, `css/`, `react/`, `remix/`, `liquid/{blocks,snippets,assets,locales}/`, `html/`, `blueprints/<id>/<host>/`), `manifest.json`, `manifest.schema.json`, `config.schema.json`, `custom-elements.json`, `html-custom-data.json`, `docs/`, `skills/`.

### 5.3 A project after `ripple init` and `ripple add`

```text
react / remix / html (npm hosts)
  ripple.json
  AGENTS.md                               # generated Ripple section between markers
  <paths.components>/<id>.tsx             # default app/components/ripple/ (html host: <id>.html)
  <paths.styles>/ripple.css  tokens.css  theme.css  base.css  props.css  components/<id>.css
  public/ripple/ripple.js  ripple-*.js    # remix and html only
  .claude/skills/  .agents/skills/

liquid (theme root)
  AGENTS.md                               # generated Ripple section between markers
  layout/theme.liquid                     # patched: {% render 'rp-head' %}
  templates/*.liquid                      # blueprints; compose with {% block %}
  blocks/<id>.liquid  blocks/<id>-<part>.liquid
  snippets/rp-<id>.liquid  rp-head.liquid  rp-tokens.liquid  rp-import-map-entries.liquid  rp-icon.liquid
  assets/ripple.css  ripple.js  ripple-tabs.js  ripple-tooltip.js  ripple-toast.js
  config/styles.css                       # patched: marker region with @theme reference
  config/settings_schema.json             # patched: Ripple settings group
  locales/en.default.json                 # patched: key "ripple"
```

---

## 6. Prop vocabulary

A component MUST use these names and values for these meanings and MUST NOT invent a synonym. A component uses a SUBSET of an enumeration; its spec lists the subset and the default.

### 6.1 Universal props (every component)

| TSX | Liquid | Renders | Notes |
|---|---|---|---|
| `id` | `id` | `id` | REQUIRED where D-020 says so |
| `class` (`className` in React) | `class` | appended after the `rp-` classes | never merged or de-duplicated |
| rest props | `attributes` | extra attributes on the root | printed before contract attributes; cannot override them |
| `span` | `span` | `data-span` | responsive; `1 2 3 4 5 6 full`; grid column span |
| `hidden` | `hidden` | `data-hidden` | responsive; `true false` |

### 6.2 Layout props

| TSX | Liquid | Attribute | Values | Responsive | Accepted by |
|---|---|---|---|---|---|
| `gap`, `gapX`, `gapY` | `gap`, `gap_x`, `gap_y` | `data-gap`, `data-gap-x`, `data-gap-y` | space steps (D-029) | yes | Stack, Inline, Grid |
| `p`, `px`, `py`, `pt`, `pb` | same | `data-p`, `data-px`, `data-py`, `data-pt`, `data-pb` | space steps | yes | Container, Stack, Inline, Grid, Card |
| `direction` | `direction` | `data-direction` | `row column` | yes | Stack (default `column`) |
| `wrap` | `wrap` | `data-wrap` | `wrap nowrap` | yes | Inline (default `wrap`) |
| `align` | `align` | `data-align` | `start center end stretch baseline` | yes | Stack, Inline, Grid |
| `justify` | `justify` | `data-justify` | `start center end between` | yes | Stack, Inline, Grid |
| `columns` | `columns` | `data-columns` | `1 2 3 4 5 6 12` | yes | Grid |
| `width` | `width` | `data-width` | `page prose full` | no | Container (default `page`; Container owns the page gutter) |

### 6.3 Shared enumerations

| Prop | Values | Used for |
|---|---|---|
| `variant` (Button, IconButton) | `primary secondary outline ghost link destructive` | D-031 |
| `variant` (Text) | `body lead caption overline` | Text (default `body`) |
| `variant` (other components) | defined per component from: `solid soft outline plain elevated` | Badge, Card, Banner |
| `size` (controls) | `sm md lg` | Button, IconButton, Input, Select, Textarea, QuantityInput, Badge, Spinner |
| `size` (text) | `xs sm base lg xl 2xl 3xl 4xl 5xl 6xl` | Heading, Text |
| `size` (overlay) | `sm md lg full` | Dialog |
| `tone` | `neutral muted primary info success warning destructive sale` | Text, Badge, Banner, FormMessage, Price parts |
| `level` | `1 2 3 4 5 6` | Heading (the element `h1` to `h6`; visual size is `size`) |
| `as` | an allow-list per component | Text (`p span div`), Stack / Inline / Grid / Container (`div section ul ol nav header footer main aside article form`) |
| `weight` | `normal medium semibold bold` | Heading, Text |
| `textAlign` | `start center end` (responsive) | Heading, Text, Stack |
| `side` | `top bottom start end` | Popover, Tooltip; Drawer uses `start end bottom` |
| `orientation` | `horizontal vertical` | Separator, Tabs, RadioGroup |
| `ratio` | `auto 1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9` | Image, Video, Placeholder, card media |
| `fit` | `cover contain` | Image, Video |
| `radius` | `none sm md lg xl full` | Image, Card, Placeholder |
| `scheme` | `light dark` + project scheme names | Container, Card, Hero, Header, Footer, AnnouncementBar |
| `loading` | `lazy eager` | Image (default `lazy`) |
| `fetchPriority` | `auto high low` | Image |
| `type` | `button submit reset` | Button (default `button`) |
| `command` | `show-modal close show-popover hide-popover toggle-popover` or `--<custom>` | Button, IconButton, with `commandFor` |

### 6.4 Shared boolean and string props

| TSX | Liquid | Renders | Meaning |
|---|---|---|---|
| `disabled` | `disabled` | `disabled` on native controls; `aria-disabled="true" tabindex="-1"` on `<a>` | |
| `pending` | `pending` | `data-pending=""` + `aria-busy="true"` | busy state (never named `loading`) |
| `fullWidth` | `full_width` | `data-full-width=""` | fills the inline size |
| `invalid` | `invalid` | `aria-invalid="true"` | form controls |
| `required` | `required` | `required` | form controls |
| `defaultOpen` / `defaultValue` / `defaultChecked` | `default_open` / `default_value` / `default_checked` | `open` or `data-default-open` / `value` / `checked` | initial state (D-035) |
| `href` | `href` | `href`; switches Button to `<a>` | |
| `ariaLabel` | `aria_label` | `aria-label` | accessible name |
| `htmlFor` | `html_for` | `for` | Label |
| `describedBy` | `described_by` | `aria-describedby` | form controls |
| `commandFor` | `command_for` | `commandfor` | Button, IconButton |
| `popoverTarget` | `popover_target` | `popovertarget` | Button, IconButton |
| `name`, `value`, `placeholder`, `min`, `max`, `step`, `alt`, `width`, `height`, `sizes`, `target`, `rel` | same | same | native meaning |

Resource props (objects): `product`, `variant`, `collection`, `article`, `cart`, `line`, `image`, `media`, `menu`, `price`, `compareAtPrice`. Their shapes differ by backend (Liquid drops versus Storefront API objects); doc 05 defines the minimal shape each component reads.

### 6.5 Prohibited prop names

`loading` for busy state (use `pending`); `color` (use `tone` or `variant`); `kind`, `intent`, `appearance`, `theme` (use `variant`, `tone`, `scheme`); `isOpen`, `isDisabled` (no `is` prefix); `label` or `text` as content props (text is children); `left`, `right` as values (use `start`, `end`); `m`, `mx`, `my`, `mt`, `mb` (no margin props); `asChild`; `for` (Liquid reserved; use the root-named prop of D-020); any name matching `/^on/i` outside React callbacks.

### 6.6 Icon names (V1)

`account`, `arrow-left`, `arrow-right`, `cart`, `check`, `chevron-down`, `chevron-left`, `chevron-right`, `chevron-up`, `close`, `filter`, `globe`, `info`, `menu`, `minus`, `pause`, `play`, `plus`, `search`, `star`, `tag`, `trash`, `warning`, `zoom-in`.

---

## 7. The canonical component spec template

Docs 09, 10, 11 and 12 MUST use this template verbatim for every component: same headings, same order, same table columns. A section that does not apply keeps its heading and contains the single word `None.` Writers MUST NOT add, rename or reorder sections. Everything inside `<...>` is replaced; nothing else changes.

````markdown
## <ComponentName>

| Field | Value |
|---|---|
| Id | `<component-id>` |
| Kind | `static` \| `native` \| `ui` \| `commerce` |
| Category | `<category from 00-decisions 4.8>` |
| Custom elements | `<tags>` or none |
| Root element and class | `<tag>` `.rp-<component-id>` |
| Liquid tier | `block` \| `parts` \| `resource` \| `snippet` |
| No-JS level | `full` \| `degraded` \| `none` |
| Requires `id` | yes \| no |
| Depends on | `<component ids>` or none |
| Milestone | M1 \| M2 \| M3 \| M4 |

### Purpose

<One or two sentences: what it is.>

- Use when: <one line>
- Do not use when: <one line, naming the component to use instead>

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `<ComponentName>` | `blocks/<id>.liquid` | `<tag>` | `rp-<id>` | <`data-slot` / none> | yes | <`<id>` / none> |
| <part> | `<ComponentName><Part>` | `blocks/<id>-<part>.liquid` | `<tag>` | `rp-<id>-<part>` | <`data-rp-part="..."` / none> | yes \| no | <`<id>-<suffix>` / none> |

Nesting rules: <which part must be inside which; what may not contain what>.

### Props

One table per part that has props. Universal props (`id`, `class`, rest / `attributes`, `span`, `hidden`) are not repeated unless `id` is required.

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `<name>` | `<snake_name>` | enum \| scale \| boolean \| string \| number \| id \| url \| object | <exact values> | <value> | yes \| no | yes \| no | <attribute and element> |

### Content model

<`none` \| `text` \| `flow` \| `parts`> - <what children are allowed; what the default body is for a resource component>.

### HTML contract

The exact server-rendered DOM for the initial state. One fenced `html` block per fixture. The first fixture is named `default`.

Fixture `default` (<props used>):

```html
<exact markup>
```

Fixture `<name>` (<props used>):

```html
<exact markup>
```

Host-owned regions and masks: <which subtrees differ by host or backend and are masked in conformance; or None.>

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `<attr>` | <part> | server \| element \| browser | <condition> | <value or absent> |

Upgrade allow-list (mutations permitted when the element upgrades): <list or None.>

### Behaviour with JavaScript

1. <numbered, testable statements: trigger, effect, attribute or event result>

### Behaviour without JavaScript

<Exactly what works, what is missing, which controls are hidden (`data-rp-js`), and the fallback link if any.>

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event \| command \| method | `<name>` | <element> | <shape> | `<onX>` or none |

### Accessibility

- Pattern: <APG pattern name or "native <element>">; `checkPattern`: `<name>` or none.
- Accessible name: <source; required or not>.
- Focus: <where focus goes on open, close, removal>.
- Announcements: <text and when; or None.>

| Key | Action |
|---|---|
| <key> | <action> |

### Styling

- File: `components/<id>/<id>.css` (layer `rp.components`).
- Tokens used: <list>.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-<id>-<name>` | <value> | <purpose> |

| Modifier selector | Sets |
|---|---|
| `.rp-<id>[data-<prop>="<value>"]` | <custom properties> |

### Host notes

- HTML: <anything beyond copying the contract; or None.>
- React: <signature line; controlled props; hooks; or None.>
- Remix: <`data-rmx-*` attributes printed; or None.>
- Liquid: <block call example; schema settings (at most three); locale keys; or None.>

```tsx
<one TSX usage example>
```

```liquid
<one Liquid usage example>
```

### Commerce

<Kind `commerce` only: store fields read, adapter methods called, form dialect table for both backends, regions refreshed, pending and error behaviour. Otherwise `None.`>

### Agent surface

<`accessibility-tree` or `bridge`; actions; confirm; secret.>

### Checker rules

<Rule ids that apply to this component and any manifest `rules[]` entries (structure rules) in words.>

### Acceptance tests

1. <numbered; each names its tier from 00-decisions D-063 and is pass/fail>

### Evidence and UNVERIFIED

- Evidence: <repo-relative paths>
- UNVERIFIED: <items, each with its SPIKE id; or None.>

### Fallback (SPIKE-nn)

<Only when a spike in 00-decisions section 3 names this component: the complete alternative contract or behaviour. Otherwise `None.`>
````

Rules for filling the template:

- The HTML contract is normative; prose never overrides it.
- Every value in a Props table MUST come from section 6 of this ledger.
- Every class, attribute, id suffix, event and region name MUST follow section 4.
- Each example MUST be complete and copyable; no `...` inside contracts.
- Blueprints (doc 12) use a shorter template: Purpose; Regions; Components used; Structure (one outline per host); Data requirements per backend; No-JS behaviour; Acceptance tests.

---

## 8. V1 component list

84 components and 14 blueprints. "Tags" lists custom elements in the component's own contract. "Tier" is the Liquid tier (D-037). Names, ids and kinds in this list are final.

### 8.1 Doc 09 - foundation (37)

| Group | Component | Id | Kind | Tags / root element | Tier |
|---|---|---|---|---|---|
| Layout | Container | `container` | static | `div` | block |
| Layout | Stack | `stack` | static | `div` | block |
| Layout | Inline | `inline` | static | `div` | block |
| Layout | Grid | `grid` | static | `div` | block |
| Layout | Card | `card` | static | `div` | block |
| Layout | Separator | `separator` | static | `hr` | block |
| Typography | Heading | `heading` | static | `h1` to `h6` | block |
| Typography | Text | `text` | static | `p`, `span`, `div` | block |
| Typography | RichText | `rich-text` | static | `div` | block |
| Typography | Link | `link` | static | `a` | block |
| Media | Image | `image` | static | `img` | block |
| Media | Video | `video` | static | `video` | block |
| Media | Icon | `icon` | static | `svg` | snippet |
| Media | Placeholder | `placeholder` | static | `div` | block |
| Actions | Button | `button` | static | `button` or `a` | block |
| Actions | IconButton | `icon-button` | static | `button` or `a` | block |
| Forms | Field | `field` | static | `div` | parts |
| Forms | Label | `label` | static | `label` | block |
| Forms | Input | `input` | static | `input` | block |
| Forms | Textarea | `textarea` | static | `textarea` | block |
| Forms | Select | `select` | static | `select` | block |
| Forms | Checkbox | `checkbox` | static | `input type="checkbox"` | block |
| Forms | RadioGroup | `radio-group` | static | `fieldset` + `input type="radio"` | parts |
| Forms | Switch | `switch` | static | `input type="checkbox" role="switch"` | block |
| Forms | FormMessage | `form-message` | static | `p` | block |
| Feedback | Badge | `badge` | static | `span` | block |
| Feedback | Banner | `banner` | static | `div` | block |
| Feedback | Spinner | `spinner` | static | `span` | block |
| Feedback | Skeleton | `skeleton` | static | `div` | block |
| Feedback | Progress | `progress` | static | `progress` | block |
| Feedback | EmptyState | `empty-state` | static | `div` | block |
| Feedback | Rating | `rating` | static | `span` (display only) | block |
| Utilities | SkipLink | `skip-link` | static | `a` | block |
| Utilities | VisuallyHidden | `visually-hidden` | static | `span` | block |
| Utilities | Announcer | `announcer` | static | `div role="status"` | block |
| Navigation | Breadcrumb | `breadcrumb` | static | `nav` + `ol` | parts |
| Navigation | Pagination | `pagination` | static | `nav` | resource |

### 8.2 Doc 10 - interactive (9)

| Component | Id | Kind | Tags | Tier | No-JS |
|---|---|---|---|---|---|
| Dialog | `dialog` | native | `rp-dialog` + `dialog` | parts | degraded |
| Drawer | `drawer` | native | `rp-dialog` + `dialog` | parts | degraded |
| Popover | `popover` | static | none (`popover` attribute) | parts | degraded |
| Tooltip | `tooltip` | ui | `ui-tooltip`, `ui-tooltip-trigger`, `ui-tooltip-content` | parts | none |
| Toast | `toast` | ui | `ui-toast-region` (+ `toast()` helper) | block | none |
| Tabs | `tabs` | ui | `ui-tabs`, `ui-tabs-list`, `ui-tabs-tab`, `ui-tabs-panel` | parts | degraded |
| Accordion | `accordion` | static | none (`details`) | parts | full |
| Carousel | `carousel` | native | `rp-carousel` | parts | degraded |
| QuantityInput | `quantity-input` | native | `rp-quantity` | block | degraded |

### 8.3 Doc 11 - commerce (26)

| Group | Component | Id | Kind | Tags | Tier |
|---|---|---|---|---|---|
| Cards | ProductCard | `product-card` | static | none | resource |
| Cards | CollectionCard | `collection-card` | static | none | resource |
| Cards | ArticleCard | `article-card` | static | none | resource |
| Product | Price | `price` | static | none | block |
| Product | ProductGallery | `product-gallery` | native | `rp-carousel`, `rp-dialog` | resource |
| Product | ProductForm | `product-form` | commerce | `rp-product-form` | resource |
| Product | VariantPicker | `variant-picker` | commerce | `rp-live` | resource |
| Product | Swatch | `swatch` | static | none | block |
| Product | AddToCartButton | `add-to-cart-button` | static | none (inside ProductForm) | block |
| Product | ProductRecommendations | `product-recommendations` | commerce | `rp-recommendations` | resource |
| Cart | CartLink | `cart-link` | commerce | `rp-cart` | block |
| Cart | CartDrawer | `cart-drawer` | commerce | `rp-dialog`, `rp-cart` | resource |
| Cart | CartLines | `cart-lines` | commerce | `rp-cart` | resource |
| Cart | CartLine | `cart-line` | static | none (inside CartLines) | resource |
| Cart | CartSummary | `cart-summary` | commerce | `rp-cart` | resource |
| Cart | CartNote | `cart-note` | commerce | `rp-cart` | resource |
| Cart | DiscountCode | `discount-code` | commerce | `rp-cart` | resource |
| Cart | CheckoutButton | `checkout-button` | static | none | block |
| Discovery | Filters | `filters` | commerce | `rp-live` | resource |
| Discovery | FilterGroup | `filter-group` | static | none (inside Filters) | resource |
| Discovery | FilterChips | `filter-chips` | commerce | `rp-live` | resource |
| Discovery | PriceRange | `price-range` | static | none (inside Filters) | resource |
| Discovery | SortSelect | `sort-select` | commerce | `rp-live` | resource |
| Discovery | SearchForm | `search-form` | static | none | block |
| Discovery | PredictiveSearch | `predictive-search` | commerce | `rp-predictive-search` | resource |
| Discovery | LiveForm | `live-form` | commerce | `rp-live` | block |

`rp-cart` is one element used as the root tag of five components (with different classes); every instance on a page shares the one store.

### 8.4 Doc 12 - chrome and page sections (12)

| Component | Id | Kind | Tags | Tier |
|---|---|---|---|---|
| Header | `header` | static | none | resource |
| Footer | `footer` | static | none | resource |
| AnnouncementBar | `announcement-bar` | static | none | block |
| NavigationMenu | `navigation-menu` | native | `rp-navigation-menu` | resource |
| MobileNav | `mobile-nav` | native | `rp-dialog` | resource |
| LinkList | `link-list` | static | none | resource |
| Logo | `logo` | static | none | block |
| LocaleSelector | `locale-selector` | static | none (Popover + native form) | resource |
| AccountLink | `account-link` | static | none | block |
| NewsletterForm | `newsletter-form` | static | none | resource |
| Hero | `hero` | static | none | block |
| FeaturedCollection | `featured-collection` | static | none (`rp-carousel` when `layout="carousel"`) | resource |

### 8.5 Blueprints (doc 12)

`layout` (document shell: SkipLink, AnnouncementBar, Header, main, Footer, CartDrawer, MobileNav, toast region, Announcer), `home`, `collection`, `collections-list`, `product`, `search`, `cart`, `blog`, `article`, `page`, `contact`, `not-found`, `password`, `gift-card`. Each blueprint exists for all four hosts.

### 8.6 Base theme blocks to Ripple components

| Base theme block | Ripple |
|---|---|
| `basic-menu` | LinkList |
| `button` | Button |
| `card` | Card |
| `container` | Container |
| `featured-collection` | FeaturedCollection |
| `footer` | Footer |
| `gift-card` | blueprint `gift-card` |
| `header` | Header |
| `heading` | Heading |
| `image` | Image |
| `link` | Link |
| `logo` | Logo |
| `main-menu` | NavigationMenu |
| `overline` | Text (`variant="overline"`) |
| `pagination` | Pagination |
| `predictive-search` | PredictiveSearch |
| `price` | Price |
| `quantity-selector` | QuantityInput |
| `richtext` | RichText |
| `text` | Text |
| `variant-picker` | VariantPicker |
| `video` | Video |

### 8.7 Changes to the proposed inventory

| Change | Component | Reason |
|---|---|---|
| Cut | Section | Merged into Container (`width`, `py`, `scheme`); "section" collides with a Shopify term the theme forbids. |
| Cut | Menu | D-018. |
| Cut | ProductGrid | It is Grid + a loop of ProductCard; FeaturedCollection covers the resource case. |
| Cut | BuyButtons, ShopPayButton | Replaced by AddToCartButton and the `acceleratedCheckout` prop (D-050). |
| Cut | ArticleBody | It is RichText. |
| Cut | Overline | It is Text `variant="overline"`. |
| Cut | OrderList, OrderDetail, AddressForm, account blueprint | D-051. |
| Cut | ConsentBanner | D-051. |
| Cut | `rp-money`, `rp-image` elements | D-049. |
| Merged | `rp-live-form` + `rp-variant-picker` | One element, `rp-live` (D-047). |
| Added | Card, CollectionCard, ArticleCard, Logo, LinkList, Swatch, FilterGroup, FilterChips, PriceRange, Placeholder, SkipLink, VisuallyHidden, Announcer, FormMessage, EmptyState, AddToCartButton, CartLink, CartNote, DiscountCode, LiveForm, AccountLink, Hero, FeaturedCollection, NewsletterForm, Progress, Rating | Found missing by the base-theme inventory or needed to close no-JS gaps and to replace every base theme block and snippet. |
| Added | Lightbox behaviour inside ProductGallery | Replaces `ripple/theme/assets/s-product-image-zoom.js`. |
| Added blueprints | `collections-list`, `contact`, `password`, `gift-card`, `not-found` | Templates present in the base theme. |

---

## 9. Glossary

| Term | Meaning |
|---|---|
| Allow-list (upgrade) | The mutations a component is permitted to make when its element upgrades; everything else fails the upgrade-stability test. |
| Backend (commerce backend) | `hydrogen` or `liquid`: where cart and catalog data come from (D-001). |
| Binding | The per-host code that prints a component's contract: TSX for `react` and `remix`, block and snippet files for `liquid`, the reference file for `html`. |
| Block | A Liquid file in `blocks/` called with `{% block %}` from a template or layout; it has one `{{ content }}` outlet. |
| Blueprint | A scaffolded page or layout built from components, for one host. |
| Canonicalisation | Normalising rendered HTML (attribute order, case, whitespace, comments, host extras, masks) before comparing hosts (D-063). |
| Component | A named unit of UI with one id, one contract, one CSS file and one manifest entry. |
| Contract (HTML contract) | The exact DOM a component's server render must produce for its initial state (D-002). |
| Contract template | The JSON node tree in the manifest from which static bindings and fixtures are generated (D-003). |
| Dial | One of the few custom properties from which the other tokens derive (D-026). |
| Dialect (form dialect) | The set of form field names a backend's cart endpoint accepts (D-043). |
| Element | A custom element: `rp-*` (Ripple) or `ui-*` (UI SDK). |
| Fixture | A named example of a component: props in, reference HTML out. |
| Host (render host) | `html`, `react`, `remix` or `liquid`: what prints the HTML (D-001). |
| Host extras | Attributes one host adds that are not part of the contract (`data-rmx-*`); removed before comparison. |
| Host-owned region | A subtree of a contract that legitimately differs by host or backend (form internals); masked in conformance. |
| Kernel | The shared UI SDK runtime (`@ui-sdk/core` plus `definePrimitive` / `createParts`) that every `ui-*` and `rp-*` element runs on. |
| Kind | `static`, `native`, `ui` or `commerce` (D-006). |
| Library code | Versioned code that is imported or copied whole and never edited (D-053). |
| Manifest | `manifest.json`: every fact about every component, read by all tools (D-058). |
| Mask | A rule that replaces a non-portable value (money text, image URL, platform markup) with a placeholder in conformance tests. |
| Opaque markup | Platform-provided markup Ripple neither styles inside nor tests (Shop Pay). |
| Opener | The control that opens an overlay; a `commandfor` button or a `data-rp-open` link (D-008, D-009). |
| Part | A named sub-element of a component (`title`, `panel`). |
| Partial | A Liquid `{% partial %}`: a named, separately re-renderable piece of a template; the Liquid form of a region. |
| Pre-upgrade | The time between first paint and custom element definition; also the state when JS never loads. |
| Primitive | A behaviour definition made with `definePrimitive`; the unit the agent bridge sees. |
| Provenance trailer | The last-line comment in a scaffolded file recording id, package version and hash (D-056). |
| Region | A named piece of server-rendered markup that can be refreshed alone (D-046). |
| Registry | The files inside the package that `ripple add` copies into a project. |
| Resource component | A component that renders a Shopify resource or a fixed commerce structure; a self-contained block on Liquid (D-037). |
| Scaffold | To copy registry files into a project, where they become the project's own editable code. |
| Scheme | A named set of dial values applied by `data-scheme` (D-026). |
| Shim | The local liquidjs-based renderer that stands in for the Shopify Liquid runtime in tests. |
| State attribute | An attribute that expresses component state (D-021). |
| Tier (Liquid) | `block`, `parts`, `resource` or `snippet`: how a component maps to Liquid files (D-037). |
| Token | A CSS custom property holding a design value. |
| Upgrade | The moment a custom element class is defined and attached to already-parsed markup. |
| Upgrade-stable | Markup that an element does not change when it upgrades (D-002). |
| UNVERIFIED | Not run and not read in source; attached to a spike when a decision depends on it. |

---

## 10. Open questions for Ben

Only items that evidence cannot settle. Work proceeds on the default; none of these blocks a writer.

| # | Question | Default we proceed with | Affects |
|---|---|---|---|
| Q1 | May resource blocks be self-contained (default body + `content` override), which relaxes the base theme rule "template-owned composition"? | Yes (D-037). | 06, 11, 12, 14 |
| Q2 | May component CSS ship as an editable asset `assets/ripple.css`, loaded before `styles.min.css`, instead of living only in `config/styles.css`? | Yes (D-055). | 03, 14 |
| Q3 | Is it acceptable that overlays, accordion and all form controls are native, and that UI SDK elements are used only for Tabs, Tooltip and Toast (the UI SDK kernel still runs every Ripple element)? | Yes (D-007, D-008). | 04, 10 |
| Q4 | Colour role names: shadcn names (`--color-primary`, ...) or the base theme's settings-backed names (`surface`, `on_surface`, ...)? | shadcn names; theme names remain only as palette slot names in Liquid settings (D-027). | 03, 14 |
| Q5 | Liquid cannot be tested against mock.shop. Can you provide a development store with the Liquid July '26 developer preview enabled, theme access, a catalogue (mock.shop import), and Canvas? | Until provided: the local shim tiers gate Liquid; live tiers and SPIKE-01, 02, 03, 09 are open (D-063). | 13, 14 |
| Q6 | Final package name and scope (`ripple-kit` is free today; `@shopify/ripple` is free). | Placeholder `ripple-kit`, isolated in `src/identity.ts` (D-052). | 07 |
| Q7 | Customer account UI (orders, addresses, login) and a consent banner are left to Shopify-hosted pages and the platform banner. Acceptable for "everything needed to build a store"? | Yes: AccountLink only (D-051). | 11, 12 |
| Q8 | Liquid block file names unprefixed (`blocks/button.liquid`) with an opt-in `--prefix rp-`? | Unprefixed (D-038). | 07, 14 |
| Q9 | The Hydrogen product-form, collection and predictive-search stores are unused in V1 because they cannot work on Liquid; state is in the URL in every host. Acceptable reading of "Hydrogen is the reactivity layer everywhere"? | Yes: Hydrogen cart store everywhere; URL + region refresh for the rest (D-047, D-048). | 05, 11 |
| Q10 | If SPIKE-01 shows Hydrogen's default handler fails on the real Standard Actions runtime, may the Liquid adapter call `Shopify.actions` directly behind the same interface? | Assume the default path works; fallback needs your sign-off. | 05 |
| Q11 | On Liquid, Hydrogen must be the only configurer of `Shopify.actions.updateCart` (first `configure` wins). An app or theme code that configures it first breaks the cart runtime. Is "Ripple themes own Standard Actions" acceptable? | Yes; when another configurer is detected Ripple sets `usable = false` and forms post natively (D-041). | 05, 14 |
| Q12 | Out of V1 UI: subscriptions (selling plan picker), B2B and volume pricing tables, bundles, gift-card recipient form, store pickup availability, product reviews. Any of these required for V1? | Out; form fields pass through where the platform needs them (section 11). | 11 |
| Q13 | Budgets and floor: `ripple.js` at most 45 kB gzip (base theme JS is 32.6 kB); browsers Chrome 111, Safari 16.4, Firefox 128. Acceptable? | Yes (D-032, D-064). | 03, 13 |
| Q14 | Who signs off the "one excellent default look"? | The styling spike's default (neutral palette, `--rp-radius: 0.5rem`, schemes `light` and `dark`), judged by the eval visual rubric (D-061). | 03, 08 |

---

## 11. Non-goals for V1

1. No shadow DOM, no CSS-in-JS, no runtime Tailwind, no runtime dependency beyond UI SDK, Tailwind (optional) and `@shopify/hydrogen`.
2. No Ajax Cart API, no Section Rendering API, no sections, no JSON templates, no theme presets, no `{% javascript %}` or `{% stylesheet %}`.
3. No bindings for Vue, Svelte, Solid or other frameworks (they can use the `html` contract).
4. No use of `@ui-sdk/react`, `@remix-run/ui`, or `CartProvider`.
5. No controlled components outside the four listed in D-036; no callback props outside React.
6. No optimistic structural updates outside React; no client-side templating of commerce markup.
7. No ARIA `menu`, `combobox`, `listbox`, custom select, slider, date picker, colour picker, data table, tree, or any other UI SDK widget not listed in D-007.
8. No customer account UI, checkout UI, or consent banner (D-051).
9. No subscriptions UI, B2B UI, bundles, pickup availability, reviews, wishlists, product comparison, store locator, or blog comments.
10. No margin props, no object-form responsive props, no per-component colour props.
11. No theme editor section presets or drag-and-drop merchandising; Liquid settings are limited to the token dials and at most three styling settings per block.
12. No visual page builder, no Figma kit, no documentation website (docs ship in the package).
13. No server framework adapter beyond Hydrogen's own handlers; no Storefront API client of Ripple's own.
14. No automatic migration of existing themes or shadcn projects.
15. No support below the browser floor of D-032; no IE or legacy Edge.
16. No animation library; motion is CSS transitions with the tokens of D-029.
17. No editing of `ripple/theme` or any local clone; the base theme is reference only.

---

## 12. Document ownership

Each fact has one owning document. Other documents link to it (`NN-name.md`, section heading) and MUST NOT restate it.

| Doc | Owns | Must follow |
|---|---|---|
| `01-architecture.md` | Hosts, backends, layers of the system, data flow, package entry points, lifecycle (server render, upgrade, refresh) | D-001 to D-006, D-052 to D-054 |
| `02-html-contract.md` | Contract rules, ids, state attributes, hook attributes, canonicalisation, fixtures, upgrade allow-lists | D-002, D-020, D-021, sections 4.3, 4.4 |
| `03-styling-and-tokens.md` | Layers, tokens, dials, schemes, scales, props.css generation, component CSS rules, pre-upgrade CSS, Tailwind integration, browser floor | D-024 to D-032, sections 4.5, 6.2 |
| `04-elements.md` | Runtime, `rp-*` authoring rules, non-commerce elements, UI SDK usage, lazy loading, Invoker Commands polyfill, opener listener, events | D-007 to D-023 |
| `05-commerce.md` | Adapter, cart store, dialects, regions and refresh strategies, commerce elements, resource prop shapes, money, images | D-041 to D-050 |
| `06-bindings.md` | React rules and `useElement`, Remix rules, TSX conventions, Liquid tiers and rules L-1 to L-11, `html` host | D-033 to D-040 |
| `07-manifest-registry-cli.md` | Manifest schema, contract template language, generator, registry, trailers, CLI, upgrade merge, checker rules | D-003, D-056 to D-059, section 4.8 |
| `08-agent-kit-and-evals.md` | Package docs, skills, `AGENTS.md` section, agent bridge surface, eval suite | D-060, D-061, D-065 |
| `09-components-foundation.md` | The 37 components of 8.1 | section 7 template |
| `10-components-interactive.md` | The 9 components of 8.2 | section 7 template |
| `11-components-commerce.md` | The 26 components of 8.3 | section 7 template |
| `12-components-chrome-and-blueprints.md` | The 12 components of 8.4 and the 14 blueprints of 8.5 | section 7 template |
| `13-testing.md` | Test tiers, harnesses, canonicaliser, shim, size budgets, cross-engine | D-063, D-064 |
| `14-liquid-theme.md` | The Ripple Liquid theme: file tree, layout, templates, settings bridge, import map, partial declarations, what replaces each base theme file | D-037 to D-039, D-054, D-055 |
| `PLAN.md` | Milestones, spike schedule, definition of done per milestone | D-067, section 3 |
| `README.md` | What Ripple is, quick start per host, links | all |
