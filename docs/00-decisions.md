# 00 - Decision ledger

Status: LAW for every spec document (01 to 14, PLAN.md, README.md). Date: 2026-11-21.

## 0. How to read this document

- Every spec writer MUST follow this ledger. A spec document MUST NOT contradict it, rename anything it names, or reopen a decision. If a writer finds a decision that cannot be implemented, the writer MUST follow the decision anyway, and add an entry under a heading `## Ledger issues` at the end of their own document.
- Normative words: MUST, MUST NOT, SHOULD, MAY.
- "UNVERIFIED" marks a fact nobody ran or read in source. Every UNVERIFIED item that a decision depends on is attached to a named spike (section 3) with a default path and a fallback path. Writers specify the DEFAULT path in full and the fallback path in a subsection titled `Fallback (SPIKE-nn)`.
- Evidence paths are relative to the directory that holds the local clones (`uisdk/`, `hydrogen/`, `remix/`, `tobi/`, `ripple/`). Research reports are under `ripple/docs/research/`; they are cited by file name and section.
- Ben's ten fixed decisions are not repeated as decisions here. Where this ledger changes the base theme's rules or reads one of Ben's decisions narrowly, the item is repeated in section 10 (Open questions for Ben) with the default that work proceeds on.
- Precedence when two sources disagree: this ledger, then the owning spec document (section 12), then the research reports, then the original proposal.
- A bullet that starts with `Amended:` inside a decision is part of that decision. It was added by the reconciliation pass after docs 01 to 14 were written, and it wins over older sentences of the same decision. Section 13 holds the reconciliation decisions (D-069 onward) and the disposition of every gap the writers reported. Where the decision text itself was proven wrong it was corrected in place and the `Amended:` bullet says what changed and why.

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
11. Reconciliation (section 13): the Tabs contract is the measured upgrade snapshot (D-012); every `rp-*` root is `display: block` (D-080); the Toast chunk loads on the first `toast()` call (D-083); regions on Remix are plain elements by default, Frames are opt-in (D-090); Liquid prints `{{ attributes }}` last (D-035); the browser bundles are 12 files built with Rollup plus a shared chunk (D-054); the checker has 55 rule ids (D-059).

---

### File layout of the component specs

The per-component specs that docs 09 to 12 own are stored one file per component in `docs/components/<id>.md` (84 files) and one file per blueprint in `docs/blueprints/<id>.md` (14 files). Docs 09 to 12 keep the rules shared by their group and a pointer per component. Wherever this ledger or another doc says "doc 09/10/11/12, <Component>", read that component's file. Ownership is unchanged: the group doc's section 0 plus the component file together are the owning text.

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
- Amended: A mutation is an attribute write that changes the value, the addition or removal of a child, or a text change. A write that sets an attribute to the value it already has (measured: `ui-tabs-tab` re-writes `role="none"` at upgrade) is NOT a mutation: the tier 3 judge reports it as information, does not fail on it, and it MUST NOT be allow-listed. Docs 02 (U-2), 10 and 13 disagreed; nothing observable changes on such a write. The allow-list is manifest data, `upgradeAllow[]` (D-071).

#### D-003 The manifest is the single source; bindings are generated where the template language can express them

- Decision: Each component is defined by one hand-written manifest entry, which includes a **contract template** (a JSON node tree with `tag`, `attrs`, `children`, `slot`, `text`, `embed`, `host`; values are literals, `{prop}`, `{t}` or arrays; conditions are `set`, `true`, `eq`, `not`, `all`). The template language MUST NOT gain loops or expressions. One command, `pnpm gen`, generates from the manifest: reference HTML fixtures, TypeScript prop types, JSX `IntrinsicElements`, Liquid `{% doc %}` / `{% schema %}` / enumeration guards, binding bodies for kind `static` in all four hosts, `props.css`, pre-upgrade display rules, component docs, checker tables, the registry index, and the generated section of `AGENTS.md`. CI runs `pnpm gen --check`. Hand-written: manifest entries, component CSS, `tokens.css`, `base.css`, all `rp-*` elements, commerce adapters, bindings for kind `commerce`, React wiring for kinds `ui` and `native`, checker engine, skills prose, blueprints, eval tasks. A hand-written binding MUST still pass fixture conformance.
- Rationale: Generation was verified for static components (one template gave canonical-equal HTML, Liquid and React output, 10 of 10). Weak implementer models make fewer errors when four bindings come from one template.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 5.1 to 5.3; spike `ripple/docs/research/spikes/agent-kit/`.
- Rejected: hand-writing four bindings per component; a richer template language (it becomes a fifth implementation to debug).
- Amended: Generation scope is narrowed to what the template language can express (D-072). (a) A kind `static` component whose markup needs a loop, a derived value or backend-dependent tags is hand-written in every host; in doc 11 only Swatch and SearchForm are generated. (b) Kinds `native` and `ui`: the `html`, `remix` and `liquid` bindings are generated; the `react` binding is hand-written below a generated header region. (c) Hand-written files contain generated, checked regions (Liquid `{% doc %}`, `{% schema %}`, enumeration guards; TSX prop types). (d) Template language additions, owned by doc 07: `prefix` on values, `{t}` as a prop default, `embed` takes `text`, `not` wraps only `set` / `true` / `eq`, and there is no `any`. Why: doc 11 found that most commerce markup cannot be expressed without loops, and doc 06 found that React wiring for elements needs hooks.

#### D-004 Light DOM only

- Decision: No Ripple element attaches a shadow root. The only shadow DOM on a Ripple page is platform-provided: Shop Pay (`hydrogen-shop-pay-button`, Liquid `payment_button`). Such markup is **opaque**: fixtures mask it and component CSS MUST NOT target inside it.
- Evidence: `ripple/docs/research/hydrogen-core.md` S18; `hydrogen/packages/hydrogen/src/core/shop-pay/`.
- Rejected: shadow DOM for style isolation (Ben decision 1).

#### D-005 Progressive-enhancement levels

- Decision: Every component declares `noJs.level` in the manifest: `full` (every function works from server HTML with scripting off), `degraded` (content readable and primary path available; a stated enhancement is missing), `none` (the component is absent or inert without JS and its trigger is hidden until defined). The following MUST be `full`: every link and navigation component, every form control, ProductForm (add to cart by form post), VariantPicker (selection by GET), CartLines quantity change and remove (form post), DiscountCode on the hydrogen backend, CartNote, CheckoutButton, Filters, SortSelect, SearchForm, Pagination, LocaleSelector, Accordion, MobileNav on browsers with Invoker Commands, NewsletterForm. Allowed `degraded`: Dialog, Drawer, Popover (on browsers without the native feature the opener is a link when a page equivalent exists, D-009), Tabs, Carousel, ProductGallery, NavigationMenu, PredictiveSearch (plain search form remains), ProductRecommendations, QuantityInput (stepper buttons hidden; the number input works). Allowed `none`: Tooltip, Toast.
- Rationale: Ben decision 2. The base theme has known no-JS gaps (cart quantity, remove, discount, variant selection, mobile nav sublevels, localization panel); Ripple closes them.
- Evidence: `ripple/docs/research/base-theme.md` (weaknesses, acceptance ideas); `ripple/docs/research/uisdk-web-elements.md` section 1.
- Rejected: one global "works without JS" claim with no per-component level (not testable).
- Amended: (a) DiscountCode has manifest `noJs.level: degraded`, because the manifest holds one value per component: it is `full` on the hydrogen backend and JS-only on Liquid (D-043). (b) Filters is `full` only when rendered inline; the `collection` blueprint renders Filters inline in every host and never inside a Drawer (docs 12 and 14). (c) Popover, and Accordion with `type="single"`, on browsers inside the floor that lack the feature follow D-081. (d) Tabs without JS shows every panel (D-012) and is exempt from the tier 6 "same rendering" test.

#### D-006 Component kinds are assigned by a mechanical rule

- Decision: Manifest `kind` is one of four values, decided only by the contract's tags:
  - `static`: the contract contains no custom element tag.
  - `native`: at least one `rp-*` tag, no `ui-*` tag, and the element binds no store and requests no region refresh.
  - `ui`: at least one `ui-*` tag.
  - `commerce`: at least one `rp-*` tag that binds a Hydrogen store or requests a region refresh.
  - The rule is applied to the component's OWN markup in its `default` fixture: what its own binding file prints, including markup it composes by contract (D-070). Markup printed by components listed in `dependencies.embeds`, and by default-body children, is excluded. A component that must sit inside another component's element (CartLine inside CartLines) is classified by its own markup and names its parent in `partOf`. Where this rule and section 8 differ, section 8 wins.
- Rationale: Kind decides which generator path, which tests, and which agent surface apply. A mechanical rule prevents arguments.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 4.1, 8.2.
- Rejected: kinds by "category" (layout, commerce and so on); category is a separate manifest key used only for docs grouping.
- Amended: The last bullet was corrected in place. It used to say the rule covers embedded markup, which contradicted section 8 (CartLine embeds `rp-quantity` and is `static`; Header, Footer and FeaturedCollection embed native and commerce components and are `static`). Header, Footer and FeaturedCollection keep kind `static`; their `default` fixtures pass children so that no embedded element appears (doc 12). CartDrawer is `commerce`. ProductGallery is `native`; its root is a `div` holding the Carousel and the lightbox Dialog markup it composes by contract.

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
- Amended: (a) Toast row: the `toast` chunk loads on the first `toast()` call, not on tag presence (D-083). (b) New row: view analytics use `rp-view-event`, an infrastructure element that belongs to no component and is not built on the kernel (D-089). (c) `rp-navigation-menu` dispatches no event and writes no `aria-expanded`; it exposes `api.close()` only (doc 04 L-16).

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
- Amended: (a) Item 3: the polyfill is a port, not a copy. It dispatches a `command` event that carries `source`, and it uses the globals `window.rpCommandsPolyfill` and `window.rpRuntime` (D-078). The inline Liquid script MUST be byte-identical to the generated output of `src/runtime/commands-polyfill.ts`. (b) Item 6 is narrowed: `rp-dialog` closes only on a Navigation API `navigate` event that has a `sourceElement`. A `pushState` from `rp-live` therefore does not close a filter drawer. Without the Navigation API nothing is closed (doc 04 L-10). (c) Item 7: element feedback goes through `announce(text, { from })`, which writes into a `data-rp-part="status"` element inside the open dialog (D-079). (d) Parts of Dialog and Drawer: `panel`, `header`, `title`, `description`, `body`, `footer`. There is no `describedBy` prop (doc 10). (e) Item 5 needs one allow-list entry: selector `dialog[data-default-open]`, attribute `open` (doc 02). (f) Item 2: Link is an opener only through its `dialog` prop (D-009), never through `commandFor`. (g) The root `rp-dialog` is `display: block; position: absolute; inline-size: 0; block-size: 0` (D-080).

#### D-009 Opener pattern for overlays that have a page equivalent

- Decision: When an overlay has a page equivalent (cart drawer and `/cart`, search dialog and `/search`, mobile nav and the footer menu anchor), the opener MUST be `<a href="<page>" data-rp-open="<dialog id>">`. The Ripple runtime installs ONE document-level click listener: on an unmodified primary click on `[data-rp-open]`, if the target id is a `<dialog>` inside a defined `rp-dialog`, it calls `preventDefault()` and `showModal()`. After upgrade the runtime sets `aria-haspopup="dialog"` and `aria-controls` on such links; these two attributes are on the upgrade allow-list. Manifest key: `noJs.fallbackHref`.
- Rationale: A link inside a UI SDK trigger still navigates; a button opener does nothing without JS on browsers without Invoker Commands.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` section 9.2 (link-in-trigger); `ripple/docs/research/base-theme.md` (no-JS acceptance: cart link).
- Rejected: `<button>` openers for cart, search and menu; `commandfor` on `<a>` (not valid).
- Amended: The pattern has a first-class prop: `dialog` (Liquid `dialog`) on Link, and on Button and IconButton when `href` is set. It prints `data-rp-open="<dialog id>"` (doc 09). Callers MUST NOT pass `data-rp-open` through rest props or `attributes`; docs 10, 12 and 14 examples that do so are replaced by the prop. When the target dialog is not on the page (CartDrawer on the cart page, D-091) the prop is omitted and the link navigates.

#### D-010 Popover: native `popover`

- Decision: Popover contract: opener is a Button or IconButton with `popovertarget="<id>"`; panel is `<div id="<id>" popover="" class="rp-popover" data-side="<side>" data-align="<align>">`. Position uses CSS anchor positioning inside `@supports`; without support the panel uses the user-agent default (centred). Kind `static`. Props `side` (`top | bottom | start | end`, default `bottom`), `align` (`start | center | end`, default `start`).
- Evidence: `ripple/docs/research/base-theme.md` (Popover native); anchor positioning support is UNVERIFIED (`ripple/docs/research/uisdk-web-elements.md` open questions) and is covered by SPIKE-06.
- Rejected: `ui-popover` (34.8 kB gzip, dead without JS); a Ripple positioning element (deferred to the SPIKE-06 fallback).
- Amended: (a) The only part is an optional `title` (class `rp-popover-title`, no id); the derived id `<id>-title` is not used by Popover. (b) The panel prints `popover=""` in every host. Whether React 19 and Remix 3 print the empty value is UNVERIFIED (SPIKE-05); the fallback is `popover="auto"` in all four hosts. (c) The `popover` attribute needs Chrome 114, Safari 17.0, Firefox 125, which is above the D-032 floor for Chrome and Safari. Below it the behaviour is D-081 (panel is in-flow content, opener inert). (d) Popover and Carousel CSS select their own props (`data-side`, `data-align`, `data-columns`) with the component class in the same selector; doc 03 rule 7.7 gets that exemption (D-105).

#### D-011 Accordion: native `<details>`

- Decision: Accordion is `<div class="rp-accordion">` holding `<details class="rp-accordion-item">` items with `<summary class="rp-accordion-trigger">` and `<div class="rp-accordion-content">`. `type="single"` prints `name="<accordion id>"` on every item (exclusive without JS). `defaultOpen` on an item prints `open`. Kind `static`.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (native `<details name>` exclusive accordion works with no JS; UI SDK has no binding to `<details>`); `ripple/docs/research/liquid-blocks-partials.md` (Accordion example).
- Rejected: `ui-accordion`.
- Amended: (a) The prop is `type`: `single | multiple`, default `multiple`, printed as `data-type` on the root (section 6.3). (b) Root `id` is REQUIRED only for `type="single"`; items then receive the root id through the prop `accordion` and print `name="<accordion id>"`. (c) There is no height animation in V1 (doc 03's mention is removed). (d) Exclusive `<details name>` is above the floor in Chrome (120) and Safari (17.2): below it a `single` accordion behaves as `multiple` (D-081).

#### D-012 Tabs: `ui-tabs`, fully pre-rendered

- Decision: Tabs uses `ui-tabs` with the fully pre-rendered contract, which is exactly the zero-mutation upgrade snapshot of the pinned UI SDK: `role` on list, tabs and the selected panel; `aria-selected` and `tabindex` on every tab; derived id `<id>-tab-<value>` on every tab button; `aria-controls`, and the panel attributes `role`, `id="<id>-panel-<value>"`, `aria-labelledby`, ONLY for the selected pair; `hidden` on unselected panels. Root `id` is REQUIRED. `noJs.level` is `degraded`: static CSS under `@media (scripting: none)` shows every panel and hides the tab list (support UNVERIFIED, SPIKE-06; fallback: only the default panel is readable without JS, and docs direct content that must be reachable to Accordion).
- Evidence: `ripple/docs/research/uisdk-web-elements.md` section 3 (tabs contract, zero diff); `ripple/docs/research/react-and-custom-elements.md` (Tabs wrapper template verified); `uisdk/packages/web/src/tabs.ts`.
- Rejected: author-minimal tabs markup ("contract B"); a Ripple-owned tabs element.
- Amended: The first sentence was corrected in place. D-012 used to list `aria-controls` and panel ids for every tab; the measured snapshot (docs 02, 04 and 10; `ripple/docs/research/spikes/elements-runtime/`, `ripple/docs/research/spikes/components-interactive/`) has them only on the selected pair. V1 Tabs is horizontal only: there is no `orientation` prop and `data-orientation="horizontal"` is printed. `TabsTab` and `TabsPanel` each receive `tabs` (the root id), `value`, and `selected` on the selected pair, because a part cannot read the root's state (D-020). The no-JS rule cannot live in component CSS (the `[hidden]` rule in layer `ui-sdk` is `!important`): it is the second `!important` block of D-021. Tier 6 exempts Tabs from the generic "renders the same without scripts" test. The `escaping` fixture of Tabs targets the list's `ariaLabel`.

#### D-013 Tooltip and Toast: UI SDK, lazy-loaded

- Decision: Tooltip uses `ui-tooltip` (`noJs.level: none`; the trigger MUST have its own accessible name, the tooltip is never the only label). Toast uses one `ui-toast-region` per page, printed empty by the layout blueprint, and a `toast()` helper exported from `<pkg>/elements`. Both are on the upgrade-stability allow-list where the research found them non-idempotent (Toast). Both load as lazy chunks (D-054).
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (weights: tooltip 33.6, toast 26.7 kB gzip including kernel); `ripple/docs/research/react-and-custom-elements.md` (toast not idempotent); `uisdk/packages/web/src/tooltip.ts`, `uisdk/packages/web/src/toast.ts`.
- Rejected: cutting Tooltip (swatch and icon-button hints are common); a Ripple toast element.
- Amended: Tooltip trigger wiring, option attributes and the ban on link triggers are D-082. Toast root class, the `toast()` signature and its loading rule are D-083. The sentence "Both load as lazy chunks" stands, with the Toast chunk loaded on the first `toast()` call.

#### D-014 Form controls are native; Field is static

- Decision: Input, Textarea, Select, Checkbox, RadioGroup, Switch (`<input type="checkbox" role="switch">`) and Label print native elements with `rp-` classes. Field is a static wrapper that wires `for`, `aria-describedby` and `aria-invalid` by derived ids (`<id>-description`, `<id>-error`) on the server. Validation is native constraint validation; messages are FormMessage elements.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` sections 1 and 9.1 (`ui-checkbox`, `ui-switch`, `ui-radio`, `ui-select` submit nothing without JS; `ui-field` rewrites attributes at upgrade).
- Rejected: `ui-field`, `ui-select`, `ui-checkbox`, `ui-switch`, `ui-radio`, `ui-combobox`.
- Amended: (a) Field parts are `label`, `control` (TSX export `FieldControl`), `description`, `error`. The `control` part is a wrapper `div` around the caller's control. (b) Field cannot write attributes on a control that lives in another component, so the CALLER passes `id`, `describedBy` and `invalid` to the control; the derived ids are fixed (`<id>-description`, `<id>-error`). Field's `id` prop is the control's id and is not printed on the Field root (RP104 and the fixture lint do not require it there). (c) Checkbox and Switch are bare inputs. (d) RadioGroup part classes are `rp-radio-group-item`, `rp-radio-group-input`, `rp-radio-group-label` (the `rp-radio` / `rp-label` sketch in doc 04 broke the class rule). (e) Input, Textarea and Select take `rpField` and `formId` (section 6.4).

#### D-015 QuantityInput: native number input + `rp-quantity`

- Decision: `<rp-quantity class="rp-quantity" data-slot="rp-quantity">` contains a decrement `<button type="button" data-rp-part="decrement">`, an `<input type="number" inputmode="numeric" name="quantity" min max step value>`, and an increment button. The input keeps `type="number"` and its raw value. The buttons carry `data-rp-js="inflow"` (hidden until the element is defined, D-021). Kind `native`. It dispatches `valuechange`.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (`ui-number-input` rewrites the input to `type="text"` and a formatted value such as `1,235`); `ripple/theme/assets/s-quantity-selector.js`; `ripple/theme/assets/quantity-rules.js`.
- Rejected: `ui-number-input`.
- Amended: (a) Root class `rp-quantity` is the ONE exception to the class rule of section 4.1: the manifest `root.class` is authoritative, part classes are `rp-quantity-button` and `rp-quantity-input`, and the CSS file is `quantity-input.css`. (b) The buttons contain Icons `minus` and `plus`, not text. (c) The input always prints `data-rp-field="quantity"`. (d) Added props: `formId` (prints the native `form` attribute; the name `form` is reserved in Liquid), `decreaseLabel`, `increaseLabel`; Remix-only `rmxKey` when there is no `id`. (e) The announcement after a step is "<accessible name> <value>", with no new locale key (doc 04 L-12). (f) `valuechange` is cancelable (D-036); doc 04 adds the veto test. Doc 04 section 8.1 MUST show the markup of doc 10 byte for byte (D-069).

#### D-016 Carousel: scroll-snap + `rp-carousel`

- Decision: Carousel is a horizontally scrollable, scroll-snapping list that works by touch, trackpad and keyboard with no JS. `rp-carousel` adds previous/next buttons (`data-rp-js="inflow"`), disabled state at the ends, and the `indexchange` event. ProductGallery composes Carousel and a lightbox Dialog. Kind `native`.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (carousel not idempotent at upgrade; 29.0 kB gzip); `ripple/docs/research/base-theme.md` (gallery, zoom).
- Rejected: `ui-carousel`.
- Amended: (a) The server prints `disabled` on the `prev` button only; `disabled` on `next` depends on layout and is an allow-list entry. (b) The buttons have class `rp-carousel-control` (not `rp-icon-button`). (c) Props: `columns` (values `1` to `6`, reused from Grid), `ariaLabel`, `previousLabel`, `nextLabel`; there is no `defaultIndex`. (d) Cancelling `indexchange` has no effect.

#### D-017 NavigationMenu and MobileNav

- Decision: NavigationMenu is a `<nav>` containing links and, for items with children, a disclosure `<button popovertarget>` plus a `popover` panel of links. `rp-navigation-menu` adds hover intent and arrow-key movement between top-level items. Every top-level item that has a URL stays a real link. MobileNav is a Drawer (D-008) containing nested `<details>` for sublevels; its opener follows D-009 with the footer menu anchor as `fallbackHref`. Covered by SPIKE-07.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (`ui-navigation-menu` moves content into a viewport on open; 35.3 kB gzip); `ripple/theme/assets/s-nav-dropdown.js`, `ripple/theme/assets/s-mobile-nav.js`; `ripple/docs/research/base-theme.md` (mobile nav sublevels fail without JS).
- Rejected: `ui-navigation-menu`.
- Amended: (a) Panel ids are `<id>-item-<n>`, with `n` the 1-based position of the top-level item (D-020). Doc 04's `-content-<handle>` is replaced. (b) `rp-navigation-menu` dispatches no event and exposes `api.close()` only. (c) MobileNav composes Drawer by contract (D-070): its root is `<rp-dialog class="rp-drawer rp-mobile-nav">` with Drawer's part classes, and Drawer's CSS styles the panel. MobileNav's own classes are for its own parts only. Doc 12's separate panel CSS is removed.

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
  5. An option named after state property `X` arrives as `defaultX`. Subscriptions are registered with `context.onDestroy` cleanup. `attrs` functions are pure. Announcements use Ripple's wrapper `announce(text, { from })` from `src/runtime/announcer.ts` (D-079), never `announce()` from `@ui-sdk/core` directly.
  6. The primitive's `agent` key lists the public methods (D-065).
  7. One element per file: `src/elements/<tag>.ts` or `src/commerce/<tag>.ts`.
- Rationale: Using the kernel gives the agent bridge, `checkPattern`, and one event convention for free, and matches Tobi's prior art.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` 9.6; `uisdk/packages/web/src/define-element.ts`; `tobi/src/web/cart.ts`, `tobi/src/web/product.ts`; `ripple/docs/research/remix-3.md` (elements receive only `attributeChangedCallback` on morph).
- Rejected: multi-tag part elements for Ripple components (`rp-dialog-title` and so on: more tags to pre-render and to budget on Liquid); plain `HTMLElement` subclasses as the default (kept as the SPIKE-04 fallback).
- Amended: Item 5 was corrected in place: announcements use Ripple's `announce(text, { from })` wrapper, because the UI SDK announcer writes to a page-level region that is inert while a modal dialog is open (D-079). New item 8: every `rp-*` root is `display: block` (D-080); the agent bridge skips roots that have no box (doc 04 L-4). Item 3 forbids `attachQuantityInput` (it holds descendant references); see D-044.

#### D-020 Ids are explicit, required, and derived

- Decision: Every component whose parts are linked by id has a REQUIRED `id` prop in every host: Dialog, Drawer, Popover, Tabs, Accordion with `type="single"`, Field, Tooltip, Carousel, ProductGallery, ProductForm, VariantPicker, CartDrawer, CartLines, CartNote, DiscountCode, Filters, SortSelect, PredictiveSearch, NavigationMenu, MobileNav, LocaleSelector, NewsletterForm. No host generates ids: not `useId`, not `block.id`, not a counter. Part ids are derived with these fixed suffixes and no others: `<id>-title`, `<id>-description`, `<id>-error`, `<id>-trigger`, `<id>-content`, `<id>-tab-<value>`, `<id>-panel-<value>`, `<id>-item-<value>`, `<id>-list`, `<id>-live`, `<id>-form`. A part or component that lives in another file receives the root id through a prop named after the root component, in camelCase (`dialog`, `drawer`, `tabs`, `popover`, `field`, `tooltip`, `accordion`, `cartLines`), never `for` and never `form`.
- Rationale: Generated ids differ between hosts and between server and client; Remix has no stable generated id; Liquid blocks cannot pass context to their body; `for` is a reserved word in Liquid.
- Evidence: `ripple/docs/research/react-and-custom-elements.md` R-2; `ripple/docs/research/remix-3.md`; `ripple/docs/research/liquid-blocks-partials.md` L-5, L-8.
- Rejected: `useId` in React; `block.id` in Liquid.
- Amended: The list and the root-named props were corrected in place. Added required ids: ProductGallery, VariantPicker, CartLines, CartNote, DiscountCode, Filters, SortSelect (doc 11), LocaleSelector, NewsletterForm (doc 12). Field's required `id` is the id of the control and is NOT printed on the Field root. The suffix `-form` is the Liquid cart form of D-092. `form` was removed from the root-named props because D-038 reserves it in Liquid: cart components take `cartLines` / `cart_lines`, and the native `form` attribute is printed by the prop `formId` / `form_id` (section 6.4). NavigationMenu panels use `<id>-item-<n>` with `n` the 1-based position of the top-level item. A CartDrawer's `id` defaults to `cart-drawer` and MUST equal `CommerceOptions.cartDrawer` (D-087).

#### D-021 State attributes, `hidden`, and pre-upgrade CSS

- Decision:
  1. State is expressed only by native attributes (`open`, `hidden`, `disabled`, `checked`), ARIA attributes (`aria-expanded`, `aria-selected`, `aria-current`, `aria-invalid`, `aria-busy`, `aria-disabled`), and the UI SDK presence attributes `data-open`, `data-closed`, `data-disabled`, `data-pending`, `data-selected`, `data-checked`, `data-active`, `data-current`. `data-state="..."` MUST NOT be used.
  2. The earliest layer carries `:where([hidden]:not([hidden="until-found"])){display:none !important}`.
  3. `base.css` carries a static `display` rule for every `ui-*` and `rp-*` tag Ripple uses (generated from the manifest key `elements`, D-080), so layout is identical before and after upgrade. Every `rp-*` tag is `display: block`.
  4. A control that works only with JS carries `data-rp-js="inflow"` (rendered `visibility:hidden` until its owning custom element is `:defined`) or `data-rp-js="overlay"` (rendered `display:none` until defined). A control needed only WITHOUT JS (for example the cart's "Update" submit button) carries `data-rp-js="fallback"` (rendered `display:none` once the owning element is defined). The generated rules select by the owning tag: `rp-quantity:not(:defined) [data-rp-js="inflow"]`, `rp-cart:defined [data-rp-js="fallback"]`. These generated rules are written in the file `base.css` inside `@layer rp.props` and are the only CSS allowed to select a `data-rp-*` attribute. `data-rp-js` MAY also sit on a `<form>` (D-092).
  5. Fixtures cover the initial state only. Residual attributes after an open and close cycle are not part of the contract.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` sections 1, 9.4; `ripple/docs/research/styling-spike.md` (pre-upgrade section; `ripple/docs/research/spikes/uisdk-web/` `site/pre-upgrade.css`).
- Rejected: `data-state`; hiding with utility classes.
- Amended: (a) Item 3: the display value comes from the manifest key `elements` and is `block` for every `rp-*` tag (D-080); `rp-dialog` is additionally absolutely positioned with zero size; `rp-view-event` is `display: block`. (b) Item 4 was corrected in place: the generated `data-rp-js` rules are in the file `base.css` but in layer `rp.props`. In `rp.base` they lose to any component `display` rule, and `!important` is not allowed (doc 03, measured). (c) `data-rp-js` MAY sit on a `<form>` (the Liquid discount form, D-092). (d) There are exactly two `!important` rules, both in `@layer ui-sdk`: the `[hidden]` rule, and the Tabs `@media (scripting: none)` block that shows every panel and hides the tab list (D-012). (e) `data-starting-style` and `data-ending-style` (written by UI SDK for animation) MAY be selected in Tabs, Tooltip and Toast CSS, with the component class in the selector.

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
- Amended: (a) `action` on `rp-product-form` is cancelable: cancelling it stops the cart from opening after a successful add. (b) `valuechange` on `rp-quantity` and `ui-tabs`, and `openchange` on `rp-dialog`, are cancelable (D-036). `indexchange` is not. (c) The `reason` of `rp:refresh` is typed: `cart | variant | filter | predictive | recommendations | manual` (D-090). (d) `rp-navigation-menu` and `rp-view-event` dispatch no Ripple event.

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
- Amended: (a) Item 2 stands literally: modifier rules set custom properties only, and boolean props work through private variables; the selector form `.rp-<id>[data-<prop>]` is allowed. (b) A component MAY select its own manifest props even when the attribute name is on the reserved list of section 4.3 (`data-side`, `data-align`, `data-columns`, `data-type`, `data-value`), always with its own class in the selector. (c) The root class is the manifest `root.class`; it equals `rp-<component id>` for every component except QuantityInput (D-015). (d) Each component CSS file is at most 6,000 bytes minified (D-064).

#### D-025 Cascade layers

- Decision: The first statement of the CSS entry in every host MUST be, in this order:

  ```css
  @layer ui-sdk, theme, base, rp, components, rmx, utilities;
  @layer rp.tokens, rp.base, rp.components, rp.props;
  ```

  It MUST precede `@import "tailwindcss"`. Ripple writes only in `ui-sdk` (the two `!important` rules: the `[hidden]` rule of D-021 and the Tabs `@media (scripting: none)` block of D-012) and in the four `rp.*` sublayers. Utilities therefore always override Ripple; Ripple always overrides Tailwind preflight (`base`).
- Evidence: `ripple/docs/research/styling-spike.md` (layer order verified; failure when the statement follows the Tailwind import); `ripple/docs/research/uisdk-web-elements.md` (UI SDK injects `@layer ui-sdk` at runtime); `ripple/docs/research/remix-3.md` (layer `rmx`).
- Rejected: unlayered component CSS; `!important` (allowed only in the two rules Ripple writes in layer `ui-sdk`).
- Amended: The text was corrected in place: Ripple writes TWO `!important` rules, both in layer `ui-sdk` (D-021). The Tabs no-JS override cannot live in `rp.components` because the `[hidden]` rule in `ui-sdk` is `!important` and wins (measured, `ripple/docs/research/spikes/components-interactive/`).

#### D-026 Tokens: one source, Tailwind names where Tailwind has a namespace, `--rp-` otherwise

- Decision:
  1. `tokens.css` is the only place token values are written. `theme.css` is generated from it as an `@theme reference { ... }` block with real values (never `initial`) so that Tailwind utilities can name Ripple tokens without emitting them twice.
  2. A token that falls in a Tailwind v4 theme namespace uses the Tailwind name: `--color-*`, `--spacing` and `--spacing-*`, `--radius-*`, `--text-*`, `--font-*`, `--shadow-*`, `--ease-*`, `--container-*`, `--breakpoint-*`. Every other token is `--rp-*`.
  3. **Dials** are the small set of inputs from which the rest derive: `--rp-background`, `--rp-foreground`, `--rp-brand`, `--rp-brand-foreground` (optional), `--rp-accent` (optional; feeds `--color-link`), `--rp-radius` (default `0.5rem`), `--rp-density` (default `1`), `--rp-text-scale` (default `1.2`), `--rp-font-body`, `--rp-font-heading`.
  4. Derived tokens are declared on `:root, [data-scheme]`. Any element that sets a dial MUST also carry `data-scheme="<name>"`. Built-in scheme names: `light` (default, on `:root`) and `dark`. Projects add schemes by adding `[data-scheme="<name>"]` blocks to `tokens.css`.
  5. Liquid exposes dials as theme settings through `snippets/rp-tokens.liquid`, which prints two inline rules: the non-colour dials on `:root`, the colour dials on `:root, [data-scheme="light"]`. Setting ids: `rp_palette` (type `color_palette`), `rp_radius`, `rp_density`, `rp_text_scale` (type `range`), `rp_font_body`, `rp_font_heading` (type `font_picker`). Palette slot mapping: `surface` to `--rp-background`, `on_surface` to `--rp-foreground`, `interactive` to `--rp-brand`, `surface_2` to `--color-muted`, `accent` to `--rp-accent`.
- Evidence: `ripple/docs/research/styling-spike.md` (tokens, dials, schemes); `ripple/theme/snippets/theme-styles.liquid`; `ripple/theme/config/settings_schema.json`; `ripple/theme/config/styles.css`.
- Rejected: a JS or JSON token source; tokens only as Tailwind `@theme` (fails without a build).
- Amended: (a) Item 5 was corrected in place from "one `:root` rule" to two rules: with one rule a `scheme="light"` component inside a dark section showed stock colours instead of the merchant's (doc 03). (b) Every scheme block sets `--rp-brand-foreground` (`initial` in `light`, a literal in `dark`), and a static block gives the dark status colours; otherwise Chrome 111 to 118 shows white text on the dark scheme's near-white brand. (c) There is no built-in scheme that follows the operating system; doc 03 shows the block a project adds. (d) Tokens added by doc 03 and now part of the ledger: `--color-link`, `--color-sale-foreground`, `--spacing-target-min`, `--font-weight-normal`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`, `--rp-heading-weight`, `--rp-ring-width`, `--rp-ring-offset`, `--rp-dir`, `--rp-space-steps`, and `--breakpoint-*` declared in `tokens.css`. `--shadow-xl` does not exist. (e) Liquid range settings, font defaults and the palette rule are D-098.

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
  4. Generator rules for `props.css`: one block per breakpoint in ascending order; fixed property order `gap, gap-x, gap-y, p, px, py, pt, pb, direction, wrap, align, justify, columns, text-align, span, hidden`; every selector has specificity (0,1,0); logical properties only; `direction` and `wrap` scoped `:where(.rp-stack, .rp-inline)`; `align` and `justify` scoped `:where(.rp-stack, .rp-inline, .rp-grid)`; `columns` scoped `:where(.rp-grid)`; `text-align` (attribute `data-text-align`) scoped `:where(.rp-heading, .rp-text, .rp-stack)`; `hidden` uses `display: none` and `display: revert-layer`.
  5. There are no margin props.
- Evidence: `ripple/docs/research/styling-spike.md` sections 1 and 8 (942 rules, 4.9 kB gzip, Chromium verified); `ripple/docs/research/liquid-blocks-partials.md` L-5 (responsive strings printed unchanged, always quoted); `ripple/docs/research/remix-3.md` (open question: string or object form).
- Rejected: the object form (`gap={{ base: 2, md: 6 }}`): it cannot be written in Liquid, needs a serialiser in each host, and gives two spellings to check. Per-breakpoint props (`gapMd`). Utility classes as the prop mechanism.
- Amended: (a) Item 4 was corrected in place: `text-align` (attribute `data-text-align`, prop `textAlign`) was missing from the fixed order although section 6.3 makes it responsive. (b) Validation strictness: tokens out of ascending order are a warning; extra whitespace, an empty string passed as a token list, an unknown value and a duplicate breakpoint are errors (doc 02 section 5). (c) An empty string prop value counts as unset. (d) An invalid enumerated value falls back to the default in EVERY host, not only Liquid (D-073).

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
- Amended: "Re-running the generator" in a project means `ripple add` or `ripple upgrade`: both regenerate `props.css` and `theme.css` from the project's `tokens.css`. After a token edit the instruction is `ripple upgrade`. Checker rule RP508 reports stale derived CSS (D-102).

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
- Amended: (a) Two more features are above the floor and were missing from the list: the `popover` attribute (Chrome 114, Safari 17.0, Firefox 125) and exclusive `<details name>` (Chrome 120, Safari 17.2). Version numbers are from compatibility tables, not run. Their fallbacks are D-081. The floor is NOT raised (section 10, Q15). (b) The citation "D-027" for the floor in doc 10 is wrong; the floor is this decision. (c) Node versions are D-103.

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
- Amended: (a) `<pkg>/react` exports exactly: `useElement`, `useCart(selector, serverValue)`, `useRegionHtml(name)`, and types (`RestProps`). `useCart` returns `serverValue` on the server, during hydration and when the store is unusable. (b) `"use client"` is the first line of a React binding file if and only if the file calls a hook. A file with `"use client"` exports components only (D-094). (c) One writer per node: elements write counts, errors and pending state; React renders those nodes with constant props and `suppressHydrationWarning`, and renders only structure from the store. (d) React hydration re-writes same-value `type` / `value` / `name` / `checked` on `<input>` and re-sets `<textarea>` text; tier 4 uses the list `REACT_HYDRATION_ALLOW` (owned by doc 06). (e) `commandfor` and `command` are missing from `@types/react` 19.3.0; `src/react/jsx.generated.ts` augments `ButtonHTMLAttributes`. Details: D-096.

#### D-034 Remix 3 binding

- Decision: A Ripple component in Remix is a plain server component that prints the contract. The Remix binding is the React binding without hooks, plus:
  1. It MUST NOT use `clientEntry`, `on()`, `ref()`, `css()`, or `@remix-run/ui`.
  2. Every `ui-*` and `rp-*` root prints `data-rmx-key="<id>"` (or the value of the Remix-only prop `rmxKey` when the component has no required id; the attribute is omitted when `rmxKey` is unset), and every element that an element or the browser writes to prints `data-rmx-preserve-attrs="<names>"`: the `reflects` names of the manifest `state[]` rows whose `on` is that element and whose `writer` is `element` or `browser`. `<html>` prints `data-rmx-preserve-attrs="style"`.
  3. Cart forms, and links and forms to account routes and `/checkout`, print `data-rmx-document`.
  4. Structural commerce updates use region refresh (D-046, D-090). By default a region on Remix is a plain element with `data-rp-region` and the `html` refresh strategy applies. Named blocking `<Frame>`s are an opt-in: the app passes `reloadFrames` to `configureCommerce` and passes a `<Frame>` as the children of the region part.
  5. `ripple.js` is served prebuilt from `public/ripple/`; it is not passed through the Remix asset server.
  6. RichText uses `innerHTML={unsafeHTML(html)}`.
  7. Components are uncontrolled and have no callback props in Remix.
  8. `data-rmx-*` attributes are host extras: the canonicaliser removes them before comparison.
- Evidence: `ripple/docs/research/remix-3.md` (spike `ripple/docs/research/spikes/remix/`; 116 module requests through the asset server; Referer problem for cart forms).
- Rejected: `clientEntry` wrappers per component; using Remix's own UI primitives.
- Amended: Items 2 and 4 were corrected in place. Item 2: the "stable key prop" had no name; it is `rmxKey` (Remix only). The preserve list is derived from manifest `state[]` rows (`on`, `writer`, `reflects`), which doc 07 defines. Item 4 used to say every region is a named blocking Frame. That forced a Frame into every blueprint and gave Remix a different region markup; regions are plain `data-rp-region` elements and Frames are opt-in (D-090). Doc 12 found the same for blueprint-owned regions. `<pkg>/remix` has no runtime helpers; it exports types only (`RestProps` omits `mix` and `role`).

#### D-035 TSX API conventions (React and Remix identical unless stated)

- Decision:
  1. Components are named exports in PascalCase. Parts are separate flat named exports `<Component><Part>` (`AccordionItem`, `DialogTitle`, `TabsPanel`). Dot notation (`Dialog.Title`) MUST NOT be used.
  2. File per component: `<id>.tsx` exporting the component and all its parts.
  3. Prop names are camelCase and map mechanically to Liquid snake_case and to `data-<kebab-case>` attributes. The only exceptions: React uses `className` where Remix and the manifest use `class`.
  4. Caller attributes MUST NOT be able to override a contract attribute. TSX: unknown props are spread onto the root element BEFORE contract attributes (in JSX the later prop wins). Liquid: `{{ attributes }}` is printed LAST in the root's opening tag (in HTML text the first duplicate attribute wins).
  5. Text content is always children. The only string props that carry content are accessible names (`ariaLabel`) and RichText's `html`.
  6. Initial-state props are named `default<X>` (`defaultOpen`, `defaultValue`, `defaultChecked`) in every host (Liquid: `default_open`, `default_value`, `default_checked`). They print the plain HTML attribute (`value`, `checked`, `open`).
  7. Helpers `rv()` (responsive value to attribute string) and `cx()` (class join) come from `<pkg>`; bindings MUST use them and no other class or prop helper.
- Evidence: `ripple/docs/research/remix-3.md` (bindings share one template; `class`; helpers); `ripple/docs/research/react-and-custom-elements.md` (spec items); `ripple/docs/research/base-theme.md` (text is always children).
- Rejected: dot-notation compound components; `asChild`/slot polymorphism (use the `as` and `href` props); a `children`-less "label" prop.
- Amended: (a) Item 4 was corrected in place. The old text ("printed before contract attributes; cannot override them") is true for JSX spread and false for HTML text, where the parser keeps the FIRST duplicate attribute (confirmed with parse5, doc 02). Liquid therefore prints `{{ attributes }}` last. (b) `rv` has the signature `rv(value, allowed?, label?)`; it normalises unset values and warns in development only, never changing output. (c) Item 7 gains one allowed construct: the enum fallback of D-073 is an inline `includes` guard on a generated `const` array. (d) Prop types and value arrays are generated INTO each binding file; `<pkg>` exports `Responsive` and the resource types only. (e) Sibling imports are `./<id>` in React and `./<id>.tsx` in Remix; the CLI never rewrites them. (f) A root printed by Liquid `{% form %}` accepts only `id` and `class` (D-091).

#### D-036 Controlled state is limited

- Decision: All components are uncontrolled in every host. React additionally supports: callbacks from D-023 on every component with an event; controlled `open` on Dialog and Drawer; controlled `value` on Tabs and QuantityInput. Nothing else is controllable in V1. The `html`, `remix` and `liquid` hosts have no callbacks; code listens to DOM events.
- Evidence: `ripple/docs/research/react-and-custom-elements.md` (R-5 verified); `ripple/docs/research/remix-3.md` (uncontrolled only in V1).
- Rejected: controlled props everywhere.
- Amended: Controlled props require the element to expose a settable property and a cancelable event. Verified for `rp-dialog` (`open`, `openchange`) and `ui-tabs` (`value`, `valuechange`); for `rp-quantity` (`value`, `valuechange`) doc 04 adds the veto acceptance test. The `valuechange` veto on Tabs is UNVERIFIED in a browser (doc 10).

#### D-037 Liquid composition: three tiers

- Decision: Each component maps to Liquid by exactly one of three tiers, recorded in the manifest (`liquid.tier`: `block`, `parts`, `resource`):
  1. **block** (a primitive with children: Button, Stack, Card, Heading ...): one block file with one `{{ content }}` outlet. Its markup lives in `snippets/rp-<id>.liquid` when another Ripple file embeds it; the block is then a thin wrapper (manifest `embeddedBy`).
  2. **parts** (a compound with several regions: Dialog, Tabs, Accordion, Field ...): one block file per part named `<component id>-<part>`, each with one outlet, nested by the author in the template; ids are passed explicitly to each part (D-020).
  3. **resource** (a component that renders a Shopify resource or a fixed commerce structure: ProductCard, CollectionCard, ArticleCard, CartLines, CartLine, CartSummary, CartDrawer, DiscountCode, CartNote, Filters, FilterGroup, FilterChips, SortSelect, PriceRange, VariantPicker, ProductGallery, ProductForm, LocaleSelector, NavigationMenu, MobileNav, FeaturedCollection, Header, Footer, PredictiveSearch): ONE self-contained block that takes the resource as a param, renders a complete default body through `rp-*` snippets, and renders `{{ content }}` instead of the default body when the caller supplies one (`{% if content != blank %}`).
  - A fourth tier value, `snippet`, is used by Icon only (D-068): the component is a snippet with no block file.
  - `{% block %}` appears only in templates and layouts (platform rule). A Ripple block or snippet never contains `{% block %}`; internal reuse is `{% render 'rp-<id>' %}`.
  - No `{% capture %}` may be used to pass markup from one file to another, with one exception: named slot params on tier-3 blocks listed in the manifest. (The `content` argument of an embedded snippet, built in the embedding file, is allowed: D-097 as amended, D-110.)
- Rationale: The base theme writes the product card six times and threads about 85 captures because composition is template-owned everywhere. Tier 3 removes that. It deliberately changes the base theme rule "block-first, template-owned composition" for resource patterns (section 10, Q1).
- Evidence: `ripple/docs/research/liquid-blocks-partials.md` (L-1, L-3, L-6, L-7; `ValidBlockTagPlacement`); `ripple/docs/research/base-theme.md` (weaknesses; composition mapping); `ripple/theme/AGENTS.md`.
- Rejected: template-owned composition for everything (the base theme model); snippets-only components (no `{{ content }}` outlet, no schema); captured slots as the general mechanism.
- Amended: (a) A resource block cannot contain a `{% partial %}` (partials are allowed only in templates and layouts). A component whose content is a region therefore exposes a REGION PART: a TSX export and a Liquid snippet `rp-<component id>-<part>`, which the template wraps in `{% partial '<region>' %}` (D-091). (b) A component reuses another component's markup by contract, never by a nested `{% block %}` (D-070). (c) A root printed by `{% form %}` accepts only `id` and `class`; it takes no `attributes`, `span` or `hidden` on Liquid. (d) Pagination is tier `resource` but takes URL props, not a resource object (doc 09).

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
- Amended: (a) Item 6: schema label keys are exactly `t:ripple.<id>.name` (block name), `t:ripple.<id>.<part>_name` (part block name) and the shared `t:ripple.props.<prop name>` / `t:ripple.props.<value>` (setting and option labels; a character outside `[a-z0-9_]` in a value becomes `_`). English text is humanised from the prop name by the generator. Doc 07's per-component `settings.<name>.label` keys are dropped: they multiplied locale entries by the number of components. (b) Item 5: a schema setting exists only for a non-responsive enumerated prop with a default, at most three per block (doc 09). (c) Item 8: the subset is defined in D-097, in three scopes. (d) Item 3: `as` is not reserved by Liquid as far as the docs show, but its use as a block argument is UNVERIFIED on a store (SPIKE-02); the fallback is the Liquid name `tag` through `prop.liquid.name`. (e) Item 4: a silent fallback hides invalid values in rendered HTML, so RP101 checks literal arguments at the source layer; values that come from variables are not detectable. (f) Locale patches write the English text into every locale file of the theme (Theme Check `MatchingTranslations` errors otherwise); Ripple ships English only (D-098, Q16).

#### D-039 What Ripple replaces in the base theme

- Decision: The Ripple Liquid theme (doc 14) is a new theme built from Ripple components that keeps the base theme's platform rules and replaces its component layer. Kept: no sections, no JSON templates, no presets, no `{% javascript %}` / `{% stylesheet %}`; `{% block %}` only in templates and layouts; translated UI only; `routes.*`; logical properties and `<bdi>`; one import map; `@theme/*`-style bare specifiers and no relative imports between assets; `AGENTS.md` at most 50 kB. Replaced: all 22 blocks (mapping in section 8.6); every `s-*` element by `rp-*` elements; `snippets/standard-actions-config.liquid` and `assets/standard-actions-override.js` (removed, D-041); utility-only component markup (D-024); captures as slots (D-037); hand-computed image `sizes` and loading at call sites (Image props). Changed rules: resource blocks are self-contained (D-037); component CSS is an asset, not part of `config/styles.css` (D-055); "one custom element per JS file" becomes "one element per source file, shipped as one bundle" (D-054).
- Evidence: `ripple/theme/AGENTS.md`; `ripple/docs/research/base-theme.md` (inventory: 22 blocks, 22 snippets, 13 templates, 32.6 kB gzip JS, 15.9 kB gzip CSS).
- Rejected: patching the base theme in place.
- Amended: (a) The Ripple theme contains no theme-owned JavaScript module. The base theme's page-view dispatch (`ripple/theme/assets/page-view-event.js`) moves into the Liquid adapter (D-089); doc 14's `assets/page-view.js` is removed. (b) Base-theme features that are NOT carried over in V1: external click-to-load video, gift-card copy and tilt, View Transitions, per-variant quantity rules, sticky product column, per-kind radius selects, LCP preload (D-107, Q19). (c) Templates and layouts are blueprint files owned by doc 12 (D-099).

#### D-040 The `html` host

- Decision: The `html` host is any server that prints HTML by hand or by template. Its "binding" is the reference HTML itself: `ripple add` writes one `<id>.html` reference file per component (every fixture, as copyable markup) plus the CSS. The reference HTML files are the normative fixtures for all hosts.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 4.2 (`files.html`), 5.3 (plain HTML snippet).
- Rejected: a template-engine binding for the html host.
- Amended: One `<id>.html` file holds every fixture, each introduced by the delimiter line `<!-- ripple:fixture <name> -->`, and ends with the provenance trailer. In the repository the fixture files `components/<id>/fixtures/<fixture>.html` are the source; the manifest key `fixtures[].html` exists only in the built `manifest.json` (D-074).

### E. Commerce

#### D-041 One Hydrogen cart store per page, on both backends (resolves R2)

- Decision: The cart is `createCartStore()` from `@shopify/hydrogen` in every host.
  1. hydrogen backend: the server creates `const cartHandlers = createCartServerHandlers()` (it returns `{ get, post }`) and registers it with `handleShopifyRoutes({ handlers: [cartHandlers] })`, which serves `/api/cart`; a server render reads the cart with `cartHandlers.get({ storefrontClient, request })`. The client calls `configureCartEndpoint("/api/cart")` and `createCartStore({ initialData })`. The Hydrogen script tags (`renderShopifyScriptTags`) are REQUIRED on this backend too, because the store routes mutations through `Shopify.actions.updateCart` on both backends (D-088).
  2. liquid backend: the client does NOT call `configureCartEndpoint`; the store uses Hydrogen's default handler, which goes through Shopify Standard Actions (`Shopify.actions.updateCart`, `Shopify.actions.getCart`).
  3. Exactly one store per page, created by Ripple and reached through the module accessor of D-042. User code and React hooks read that store; nothing else creates one.
  4. Exactly one copy of the `@shopify/hydrogen` module per page. On Liquid and in the prebuilt `html` bundle it lives inside `ripple.js`; theme code MUST import cart access from the `ripple` specifier and MUST NOT load `@shopify/hydrogen` separately. In bundled hosts it is a peer dependency resolved once by the app's bundler.
  5. Exactly one `Shopify.actions.updateCart.configure` call per page, and it is Hydrogen's. The base theme's `snippets/standard-actions-config.liquid` and `assets/standard-actions-override.js` MUST NOT exist in a Ripple theme (checker RP307). Ripple configures `Shopify.actions.openCart` to open the CartDrawer.
  6. On Liquid the store's data is a summary: line markup and all money text MUST come from region refresh (D-046), never from store data.
  7. When the runtime cannot start (missing platform API, missing Standard Actions, thrown configure), Ripple MUST leave every form untouched so that native form posts work (`usable === false` in D-042).
- Rationale: Ben decision 4. Verified in a spike against a stand-in for the Standard Actions runtime; two stores from one module copy stay consistent. The real Standard Actions runtime was NOT executed (hosts were blocked): SPIKE-01.
- Evidence: `ripple/docs/research/hydrogen-core.md` (R2 verdict, conditions C1 to C7; spike `ripple/docs/research/spikes/hydrogen-core/`); `hydrogen/packages/hydrogen/src/core/cart/`; `ripple/theme/snippets/standard-actions-config.liquid`; `ripple/theme/assets/standard-actions-override.js`; `ripple/theme/assets/s-cart.js`.
- Rejected: Ajax Cart API and Section Rendering API (Ben decision 4); a Ripple-owned cart store; `CartProvider`.
- Amended: (a) Item 1 was corrected in place. The research report gave the server handlers as `GET(request)` / `POST(request)`; the source has `createCartServerHandlers()` returning `{ get, post }` (doc 05, read in `hydrogen/packages/hydrogen/src/core/cart/`). (b) The Hydrogen script tags are required on the hydrogen backend too (verified in the commerce spike, D-088). (c) Item 7 is refined: when the first cart read fails AFTER the elements are defined, fallback controls are already hidden by CSS; controllers then submit natively through the hidden fallback button. (d) Caching: on the hydrogen backend a page that prints cart markup from a server cart read is personalised. A publicly cached page prints a hidden zero count and MUST NOT seed `initialCart`.

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
- Amended: (a) Options are delivered by `configureCommerce(options)` or by a config element `<script type="application/json" id="rp-commerce">` read at a microtask-delayed lazy start; after start only `navigate`, `reloadFrames` and `strings` may change. The `CommerceOptions` shape is owned by doc 05 and summarised in D-087. (b) `openCart()` opens the dialog whose id is `options.cartDrawer` (default `cart-drawer`); when no such dialog is on the page it navigates to `cartUrl`. (c) `adapter.ts` has further internal exports (doc 05); only `getCommerce` and `configureCommerce` are public. (d) `ripple.js` re-exports `getCommerce`, `configureCommerce`, `toast`, `announce` and `loadAgent`, because `<pkg>/commerce` does not resolve on prebuilt pages (D-054).

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
- Amended: (a) The table row "Discount code / liquid: none" stands for no-JS. With JS, the Liquid DiscountCode prints a form that carries `data-rp-js="inflow"` on the `<form>` itself and a submitter with `name="intent"`; `rp-cart` handles it through the store. (b) The Liquid cart is ONE form (D-092). (c) Because tags and form structure differ by backend beyond what masks can equalise, the cart components have backend-scoped fixtures (D-074). (d) `data-rp-field` is printed by the prop `rpField` on Input, Textarea, Select and always by QuantityInput (section 6.4).

#### D-044 Quantity changes on Liquid are absolute

- Decision: On the liquid backend every line quantity change is sent as intent `set` with the absolute quantity read from the DOM at event time and `lineId = item.key`. `increase` and `decrease` MUST NOT be used on Liquid. On the hydrogen backend the cart line form's first submit button is `name="intent" value="set"` with the `hidden` attribute (required by `attachQuantityInput`); visible stepper buttons MAY use `increase` / `decrease`.
- Evidence: `ripple/docs/research/hydrogen-core.md` C4 (increase/decrease compute from a line the summary does not hold and can remove the line); `hydrogen/packages/hydrogen/src/core/cart/` (`attachQuantityInput`).
- Rejected: relative intents on Liquid.
- Amended: `attachQuantityInput` is NOT called, although the decision cites it: it holds references to descendants, which D-019 item 3 forbids. The hidden first `set` button stays in the markup; quantity changes go through `setLineQuantity` and a synthetic submit (doc 05).

#### D-045 No optimistic structural updates (resolves R4)

- Decision:
  1. In `html`, `remix` and `liquid`, elements never create, remove or reorder commerce markup. During a mutation they set `data-pending=""` and `aria-busy="true"` on the affected line, form or root, and MAY update numeric text marked `data-rp-part="count"` from store state. Structure and money text change only by region refresh after the mutation settles.
  2. In `react`, components MAY render structure from store state (including Hydrogen's optimistic lines), because React owns that DOM.
  3. Controls are NOT disabled while pending, except on lines whose id starts with `optimistic:`.
  4. Errors are shown inline in an element printed by the server as `<p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>`; the element fills the text and removes `hidden`. These two writes are on the allow-list.
- Evidence: `ripple/docs/research/hydrogen-core.md` S13, C3; `ripple/docs/research/liquid-blocks-partials.md` (`partials.apply()` replaces DOM); `ripple/docs/research/remix-3.md` (Frames).
- Rejected: client-side templating of cart lines on Liquid or Remix; disabling controls while pending.
- Amended: (a) The count part (`data-rp-part="count"`) carries `hidden` when the quantity is 0; that write is on the allow-list. (b) An error stays visible until the next buyer cart action begins. Its scope is decided by where the error part sits (line, discount form, cart root); a cart-scope message MAY appear in more than one part. (c) CartLines, CartSummary, CartNote and DiscountCode each always print one `data-rp-part="status"` element, because any of them can sit inside the modal CartDrawer (D-079). (d) New shared part name: `remove` (section 4.4). (e) React: `rp-cart` writes count and error text, so those nodes carry `suppressHydrationWarning` (D-033).

#### D-046 Region refresh

- Decision:
  1. A **region** is a named piece of server-rendered markup that can be re-rendered alone. Region names are fixed: `rp-cart-lines`, `rp-cart-summary`, `rp-product-buy`, `rp-product-media`, `rp-product-recommendations`, `rp-collection-results`, `rp-collection-filters`, `rp-collection-toolbar`, `rp-search-results`, `rp-predictive-results`. Projects MAY add names with the `rp-` prefix reserved for Ripple.
  2. In every host the region's root element carries `data-rp-region="<name>"`. On Liquid the region is additionally a `{% partial '<name>' %}` in the template or layout, declared at most once per rendered page. On Remix the region is a plain element by default and MAY be a named blocking `<Frame>` (D-034 item 4).
  3. A form, link or element declares what it invalidates with `data-rp-refresh="<space-separated region names>"`.
  4. Elements request a refresh by calling `getCommerce().refresh(regions, { url })`, which dispatches `rp:refresh` (cancelable) and, unless cancelled, runs the host strategy, then dispatches `rp:refreshed`:
     - `liquid`: `@shopify/partial-rendering` (`partials.fetch` / `partials.apply`), loaded by guarded dynamic import; on any failure `location.assign(url)` or `location.reload()`. `@shopify/partial-rendering`, `@shopify/standard-actions`, `@shopify/standard-events` are platform-provided specifiers; they are NOT npm dependencies.
     - `remix`: when `reloadFrames` is configured and `url` is null, `reloadFrames(regions)`; when `navigate` is configured and the reason is `variant` or `filter`, `navigate(url, { replace })`; otherwise the `html` strategy.
     - `react`: `url` null: nothing (cart regions re-render from store state). Reason `predictive` or `recommendations`: fetch the document at `url` and publish the region's inner HTML to `useRegionHtml(name)` (D-090). Otherwise the app-supplied `navigate(url, { replace })` from `configureCommerce`, or `location.assign(url)` without it.
     - `html`: fetch the document at `url` (default: current URL), and replace each `[data-rp-region="<name>"]` element with the same-named element from the response; on failure `location.assign(url)` (SPIKE-10).
  5. Refresh replaces DOM. Therefore an overlay root (Dialog, Drawer) MUST NOT be inside the region its own content refreshes (the region is INSIDE the dialog body), and a `ui-*` root is replaced whole or not at all (D-022).
- Evidence: `ripple/docs/research/liquid-blocks-partials.md` (partials; replace, not morph; guarded import; names are contracts); `ripple/docs/research/remix-3.md` (named Frames); `ripple/theme/AGENTS.md` (partial names are contracts); checker RP403, RP404 in `ripple/docs/research/agent-kit-and-distribution.md` 7.3.
- Rejected: Section Rendering API (Ben decision 4); morphing on Liquid; per-component ad hoc fetches.
- Amended: Items 2 and 4 were corrected in place: Remix regions are plain elements by default (was: always a Frame), and the `remix` and `react` strategies are those of D-090 (was: Frame reload only; React "nothing or navigate" only). Reasons: doc 12 could not make blueprint-owned regions Frames; the React `navigate` strategy would leave the page for predictive search and recommendations (doc 11). The fixed region names stand. Blueprint-owned regions are `rp-product-buy`, `rp-collection-results`, `rp-collection-toolbar`, `rp-search-results`; component-owned regions are `rp-cart-lines`, `rp-cart-summary`, `rp-product-media`, `rp-product-recommendations`, `rp-collection-filters`, `rp-predictive-results` (D-091). `rp-recommendations` reads its URL from the attribute `data-url` and loads once, when within 400 px of the viewport (doc 05).

#### D-047 Variant selection, filtering and sorting are URL-driven in every host

- Decision: VariantPicker, Filters, SortSelect, FilterChips, PriceRange and Pagination are GET forms and links whose URL fully describes the state (`?variant=` or option params; `filter.*`, `sort_by`, `page`). Without JS they navigate. With JS, `rp-live` intercepts the submit or click, updates the URL with `history.replaceState` (variant) or `pushState` (filters, sort, page), and calls `refresh` with the regions in `data-rp-refresh`. `createProductFormStore`, `createCollectionStore` and their reconcilers are NOT used in V1 in any host.
- Rationale: The Hydrogen product-form and predictive-search stores cannot work on Liquid; using them only on the hydrogen backend would give one component two behaviours and two test matrices. URL state is the one model that is correct without JS.
- Evidence: `ripple/docs/research/hydrogen-core.md` (NO for product form store and predictive search store on Liquid; collection store optional; URL params `filter.*`, `sort_by`); `ripple/theme/assets/s-live-form.js`, `ripple/theme/assets/s-variant-picker.js`; `ripple/docs/research/base-theme.md` (`rp-live-form` needed on Liquid).
- Rejected: Hydrogen product-form store on hydrogen backends (deferred; noted in section 10, Q9); separate `rp-variant-picker` and `rp-live-form` elements (one `rp-live` covers both).
- Amended: (a) VariantPicker option values are LINKS with `aria-current`, not radio inputs (doc 11); the component stays kind `commerce` with root `rp-live`. (b) `rp-live` infers reason `variant` from a region name that starts with `rp-product-`; other reasons are `filter`; a `popstate` after a push reloads the regions. (c) VariantPicker, SortSelect and FilterChips MAY sit inside the region they refresh. The checker's containment rule RP308 therefore applies only to `rp-cart` roots (D-102).

#### D-048 Predictive search

- Decision: PredictiveSearch is a SearchForm (a real GET form to the search route) wrapped in `rp-predictive-search`, with a results container holding region `rp-predictive-results`. With JS, input is debounced and the element calls `refresh(["rp-predictive-results"], { url })` where `url` is the search route with the form's fields. The a11y pattern is "search field plus a list of links" with ArrowDown / ArrowUp moving focus through result links, Escape closing, and a live result count; it is NOT an ARIA combobox. `createPredictiveSearchStore` is not used.
- Evidence: `ripple/docs/research/hydrogen-core.md` (store needs a JSON endpoint `/api/predictive-search`; NO on Liquid); `ripple/theme/assets/s-predictive-search.js`; `ripple/theme/blocks/predictive-search.liquid`; `ripple/docs/research/uisdk-web-elements.md` (combobox 53.0 kB gzip, not idempotent).
- Rejected: `ui-combobox`; `createPredictiveSearchStore`.
- Amended: On the `react` host the `navigate` strategy would leave the page. For reasons `predictive` and `recommendations` the React strategy fetches the document and publishes the region's inner HTML to `useRegionHtml(name)` (D-090). UNVERIFIED (SPIKE-10); the fallback is that the app cancels `rp:refresh` and renders results itself (doc 11).

#### D-049 Money and images

- Decision: Money text is formatted on the server: Liquid money filters; `formatMoney` from `@shopify/hydrogen` in TSX servers. There is no `rp-money` element. Price is `static`. Images: Hydrogen core has no image helper, so Ripple ships `imageUrl(src, { width, height, crop })` and `imageSrcSet(src, widths)` in `<pkg>`; Liquid uses `image_url`. Image REQUIRES `alt`, `width`, `height`. Money text and image URLs are not portable between backends, so fixtures mask them.
- Evidence: `ripple/docs/research/hydrogen-core.md` (`formatMoney`; no image helper); `hydrogen/packages/hydrogen/src/core/money/`; `ripple/docs/research/liquid-blocks-partials.md` 8.x (masks); `ripple/theme/AGENTS.md` (money filters).
- Rejected: client-side money formatting outside React; a Ripple image custom element.
- Amended: (a) There is no money snippet: Liquid components call the `money` filter directly (docs 11 and 14); doc 05's snippet is dropped. (b) Image takes one REQUIRED `image` object (`RippleImage`: `url`, `altText`, `width`, `height`); `alt`, `width` and `height` are derived from it and are always printed. `alt` is printed even when empty (exception to the "unset prints nothing" rule), and an empty `alt` cannot be forced on an image that has alt text. Srcset widths are fixed (doc 09). (c) TSX commerce bindings MAY value-import from `@shopify/hydrogen` exactly the pure functions listed in D-094; everything else stays behind the adapter. (d) The compare-at total of a cart line uses `cost.subtotalAmount` when it is greater than `cost.totalAmount`; `cost.compareAtAmountPerQuantity` is not used (doc 11).

#### D-050 Checkout and accelerated checkout

- Decision: CheckoutButton is `<button type="submit" name="checkout">` inside the cart form on Liquid, and `<a href="<checkoutUrl>" data-rmx-document>` on the hydrogen backend. Both carry `data-agent-confirm="<sentence>"`. Accelerated checkout (Shop Pay and wallet buttons) is a boolean prop `acceleratedCheckout` on ProductForm and CartSummary that prints platform markup (opaque, D-004). There is no ShopPayButton or BuyButtons component. `rp-cart` exposes NO `checkout` action to the agent bridge on the default path: the UI SDK `agent` key has no per-action confirmation option (`uisdk/packages/core/src/primitive.ts`), so confirmation rests on `data-agent-confirm` on the control. The action is added only when SPIKE-08 shows that the bridge refuses it without approval.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 8.3 (options a and b); `ripple/docs/research/liquid-blocks-partials.md` (`accelerated_checkout` prop because `payment_button` needs `form`); `ripple/docs/research/hydrogen-core.md` S18.
- Rejected: wrapping the checkout control in `ui-button` (option a of the agent-kit report): adds a `ui-*` family for one attribute and its behaviour on `<a>` is UNVERIFIED.
- Amended: (a) The last sentence was corrected in place: no `checkout` bridge action on the default path (doc 08, read in `uisdk/packages/core/src/foundation/kernel/primitive.ts`). SPIKE-08 decides whether it is added. (b) CheckoutButton is printed inside region `rp-cart-summary`; accelerated checkout markup is printed outside the region (doc 11). (c) On Liquid the button joins the cart form with `form="<cart lines id>-form"` (D-092). (d) With an empty cart the control is inert: `disabled` on the button, `aria-disabled="true"` and no `href` on the link.

#### D-051 Accounts and consent are links, not components

- Decision: V1 has AccountLink only (a link to the Shopify-hosted customer account). There are no order, address or login components and no account blueprint. There is no consent banner component; the platform's banner is used.
- Evidence: `ripple/docs/research/base-theme.md` (inventory has no account templates); `hydrogen/packages/hydrogen/src/customer-account/` exists but was not researched (UNVERIFIED).
- Rejected: OrderList, OrderDetail, AddressForm, ConsentBanner in V1 (section 10, Q7).

### F. Distribution, tooling, quality

#### D-052 One npm package

- Decision: One package. Placeholder name `ripple-kit`; binary `ripple`. The name appears in source only in `src/identity.ts` (`PKG_NAME`) and as the build token `__PKG__`; CI has a rename test. Documents write `<pkg>` for the package name. Export paths: `<pkg>` (helpers `rv`, `cx`, `imageUrl`, `imageSrcSet`, the type `Responsive`, the resource types of D-094, manifest loader; no side effects), `<pkg>/elements`, `<pkg>/elements/<tag>`, `<pkg>/commerce`, `<pkg>/commerce/<tag>`, `<pkg>/react`, `<pkg>/remix`, `<pkg>/agent`, `<pkg>/testing`, `<pkg>/check`, plus `browser/*`, `css/*`, `registry/*`, `manifest.json`. `dependencies`: exactly `@ui-sdk/core` and `@ui-sdk/web`. `peerDependencies`: `@shopify/hydrogen` (`>=2026.10.3 <2027`); optional peers `react` (>=19), `tailwindcss` (v4), `playwright`, `@shopify/theme-check-node`.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 11.1 to 11.4 (`ripple-kit` free on npm on 2026-11-21; `ripple`, `rippleui`, `@ripple-ui` taken).
- Rejected: one package per host; a separate CLI package.
- Amended: (a) The export sentence was corrected in place: `<pkg>` exports the type `Responsive` and the resource types, not "prop types" (prop types are generated into each binding file, D-035). (b) The repository root `package.json` is private (`name: "ripple-repo"`); the published manifest is `pkg/package.json`, generated by `src/gen/build.ts`. (c) The research aliases `./ripple.css` and `./ripple.js` are dropped in favour of `./browser/*`. (d) `parse5` and `liquidjs` are bundled into the Node-only entries (`check`, `testing`, `cli`) and are NOT `dependencies` (Q20). (e) `src/identity.ts` exports `PKG_NAME`, `BIN_NAME` and `VERSION`. (f) Node: repository `>=22.18`; package `engines.node >=20.18` (UNVERIFIED, from the research draft); Remix tiers need Node `>=24.3.0` (declared by `remix@3.3.0`). (g) `license` is the placeholder `MIT` (Q18). (h) `sideEffects` covers `dist/elements/*.mjs`, `dist/commerce/index.mjs`, `dist/commerce/rp-*.mjs`, `dist/chunks/*.mjs`, `browser/*`, `*.css`.

#### D-053 Library versus scaffolded code

- Decision: **Library** (versioned, imported or copied whole, never edited): all element and commerce JavaScript, `useElement`, hooks, helpers, the checker, the CLI, the generator, `tokens` generator, the agent entry. **Scaffolded** (owned by the project after install, editable, upgraded by three-way merge): component CSS, `tokens.css`, `theme.css`, `base.css`, `props.css`, React and Remix bindings, Liquid blocks and snippets, HTML reference files, blueprints, locale entries, skills. Scaffolded files carry no "do not edit" banner.
- Evidence: Ben decision 5; `ripple/docs/research/agent-kit-and-distribution.md` 5.3, 6.1.
- Rejected: scaffolding element JS (behaviour drift breaks the contract and the upgrade path).
- Amended: (a) Library JavaScript copied into a project (`public/ripple/*.js`, Liquid `assets/ripple*.js`) is never merged: `upgrade` overwrites it and prints a warning when the file was modified. (b) A scaffolded TSX helper file `<id>.data.ts` (file key `data`) holds the pure data helpers of a commerce or chrome component (D-094); it is scaffolded code. (c) `props.css` and `theme.css` are scaffolded but DERIVED: they are regenerated from the project's `tokens.css` (D-029).

#### D-054 JavaScript delivery

- Decision:
  1. `browser/ripple.js` is one prebuilt ES module: UI SDK kernel, Ripple runtime (lazy loader, Invoker Commands polyfill, opener listener, announcer), every `rp-*` element, the commerce layer (adapters, refresh strategies, commerce elements, `rp-view-event`) and the Hydrogen cart subset. `browser/ripple.elements.js` is the same without commerce and Hydrogen (it therefore contains no refresh strategy). Both export `toast`, `announce` and `loadAgent`; `ripple.js` additionally exports `getCommerce` and `configureCommerce`. A page loads exactly one of `ripple.js`, `ripple.elements.js`, or the bundled `<pkg>/elements` (checker RP507).
  2. Lazy chunks, one set per main file: `tabs`, `tooltip`, `toast`, `shared` (UI SDK code used by both Tooltip and Toast), `agent`. File names: `ripple-<chunk>.js` next to `ripple.js` and `ripple.elements-<chunk>.js` next to `ripple.elements.js`; `browser/` holds exactly 12 `.js` files. The runtime imports the `tabs` or `tooltip` chunk when a matching `ui-*` tag is in the document at `DOMContentLoaded` or is inserted later. The `toast` chunk is imported on the first `toast()` call only; a `ui-toast-region` in the document does NOT trigger a load. Chunks import the kernel from their main file so that one copy of `@ui-sdk/core` exists.
  3. `liquid`: a second build of the `ripple.js` set with bare specifiers: `assets/ripple.js`, `assets/ripple-tabs.js`, `assets/ripple-tooltip.js`, `assets/ripple-toast.js`, `assets/ripple-shared.js`, `assets/ripple-agent.js` (six files; there is no `ripple.elements.js` on Liquid). All cross-file imports are bare specifiers (`ripple`, `ripple/tabs`, `ripple/tooltip`, `ripple/toast`, `ripple/shared`, `ripple/agent`) resolved by the six entries that `snippets/rp-import-map-entries.liquid` adds to the theme's single import map. No relative imports between assets.
  4. `html` and `remix`: the six files of the `ripple.js` set from `browser/` (relative imports), copied by `ripple init` to `paths.public` (`public/ripple/` by default). The `ripple.elements.js` set is never copied by the CLI; a project without commerce links it from `node_modules/<pkg>/browser/` or copies it by hand.
  5. `react` (bundled apps): import `<pkg>/elements` and `<pkg>/commerce` once in the client entry. Both entries are safe to import on a server (they do nothing when `document` is undefined). `dist/` is built in ONE esbuild invocation with `splitting: true`, so stateful modules exist once across `<pkg>/react`, `<pkg>/elements` and `<pkg>/commerce`.
  6. The agent bridge is a separate opt-in entry (`<pkg>/agent`; browser files `ripple-agent.js` / `ripple.elements-agent.js`, loaded with the main file's `loadAgent()` export).
  7. Loading order on Liquid, in `snippets/rp-head.liquid`, rendered after the import map and before `{{ content_for_header }}`: stylesheet tag for `ripple.css`; `{% render 'rp-tokens' %}`; the config element `<script type="application/json" id="rp-commerce">` (D-087); inline Invoker Commands polyfill (byte-identical to the output generated from `src/runtime/commands-polyfill.ts`); `<script type="module" src="{{ 'ripple.js' | asset_url }}">`.
  8. The browser files (`browser/` and `registry/liquid/assets/`) are built with Rollup 4.24.0 plus `@rollup/plugin-node-resolve` 15.3.0 and `@rollup/plugin-terser` 0.4.4, in `src/gen/browser-bundles.ts`; esbuild is used for `dist/` and for running tooling. esbuild's code splitting cannot keep the kernel in the main file (measured, doc 04).
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (own bundle sharing one core copy; weights); `ripple/docs/research/liquid-blocks-partials.md` (loading section; no relative imports; one import map); `ripple/docs/research/remix-3.md` (prebuilt `public/ripple/`); `ripple/theme/snippets/import-map.liquid`.
- Rejected: one JS file per element loaded per template (base theme model: many requests, duplicated kernel risk); bundling through the Remix asset server.
- Amended: Items 1 to 8 were corrected in place. What changed and why: (a) a fifth chunk `shared` (9.2 kB gzip of UI SDK code used by Tooltip and Toast; putting it in the main file costs every page 9.2 kB, duplicating it breaks the one-copy rule; measured in doc 04); (b) a full second chunk set `ripple.elements-<chunk>.js` (two main files cannot share chunks); (c) refresh strategies live under `src/commerce/` (tree 5.1) and are therefore absent from `ripple.elements.js`; (d) the Toast chunk loads on the first `toast()` call, not on tag presence, because every layout prints `ui-toast-region` and the old rule cost every page 19.5 kB gzip (measured, doc 04 L-5; doc 10 already specifies and tests this); (e) Rollup for browser files (doc 04 L-3, run); (f) six import-map entries on Liquid; (g) the config element in `rp-head`; (h) re-exports from the main files, because `<pkg>/commerce` does not resolve on prebuilt pages. `ripple.elements.js` and its chunks are never scaffolded by the CLI in any host (doc 07); `ripple-agent.js` is always copied and is opt-in by loading. Library JavaScript files in a project are never merged: `upgrade` overwrites them with a warning.

#### D-055 CSS delivery

- Decision:
  1. `react`, `remix`, `html` (project with a CSS entry): scaffold into `paths.styles`: `ripple.css` (the layer statement of D-025 followed by `@import`s of `tokens.css`, `base.css`, `props.css` and the installed `components/<id>.css` inside a marker region), `tokens.css`, `theme.css`, `base.css`, `props.css`, `components/<id>.css`. The project's CSS entry imports `ripple.css` first, then `tailwindcss` if used, then Ripple's `theme.css` (the `@theme reference` block needs Tailwind to be loaded). `ripple.css` does NOT import `theme.css`.
  2. `html` with no build MAY link the prebuilt `browser/ripple.css` (all components).
  3. `liquid`: ONE file `assets/ripple.css`, unminified and editable, built by the CLI by concatenation: layer statement, tokens, base, props, then one marker region per installed component, each region with its own provenance trailer. It is loaded BEFORE `styles.min.css`. `config/styles.css` receives only a marker region containing the generated `@theme reference` block, so that compiled utilities can name Ripple tokens (SPIKE-03). Ripple block and snippet files contain no utilities, so a Ripple theme renders correctly even when the Canvas / Sidekick compiler never runs.
- Rationale: "Classic Edit Code alone does not invoke the compiler"; a component library that silently loses its CSS when a merchant edits code is not acceptable. This changes the base theme rule "single CSS source `config/styles.css`" (section 10, Q2).
- Evidence: `ripple/theme/AGENTS.md` (CSS pipeline); `ripple/docs/research/base-theme.md` (recommends component CSS in `config/styles.css`, fallback precompiled asset); `ripple/docs/research/liquid-blocks-partials.md` (loading: `ripple.css` stylesheet tag); `ripple/docs/research/styling-spike.md` (Canvas `@theme reference` support UNVERIFIED).
- Rejected: installing component CSS into `config/styles.css` (depends on a compiler Ripple does not control); loading both.
- Amended: (a) Item 1 was corrected in place: `theme.css` is imported by the project's CSS entry after `tailwindcss`, not from `ripple.css`, because an `@theme reference` block is meaningless before Tailwind loads (doc 03). (b) Item 3: in the Liquid `assets/ripple.css` the tokens, base and props parts are also trailer-bearing marker regions, with ids `core/tokens`, `core/base`, `core/props`, so that they can be upgraded by three-way merge like component regions (doc 07). (c) Liquid has exactly one CSS mode; the research's "compiled CSS mode" is dropped. (d) `base.css` is hand-written with two generated marker regions, `display` and `script-state`. (e) Doc 14's `config/styles.css` is the theme's own Tailwind entry and holds no Ripple component CSS.

#### D-056 Provenance trailers; no lockfile

- Decision: Every scaffolded file ends with a provenance trailer, which is the lock record:
  - `.liquid`: `{% comment %} ripple <id> <pkg>@<version> sha256:<64 hex> {% endcomment %}` (after `{% endschema %}`).
  - `.css`, `.ts`, `.tsx`, `.js`: `/* ripple <id> <pkg>@<version> sha256:<64 hex> */`.
  - `.html`: `<!-- ripple <id> <pkg>@<version> sha256:<64 hex> -->`.
  - `SKILL.md`: frontmatter `metadata: { source, version, hash }`.
  `<id>` is `<owner>/<file key>`, where `<owner>` is a component id, `core` (files that belong to no component) or `blueprint.<blueprint id>`. The hash is of the upstream file body, after the install transforms (block prefix, package name) and with CRLF normalised to LF. "Modified" is computed by re-hashing. `ripple status --json` prints the computed lock. npm hosts have `ripple.json` at the project root for configuration only (`host`, `paths.components`, `paths.styles`, `paths.public`, `paths.pages`, `css`, `prefix`). Liquid themes have no configuration file. Patches to files Ripple does not own are marker regions (`/* ripple:start <name> */ ... /* ripple:end <name> */`, `<!-- ripple:start <name> --> ... <!-- ripple:end <name> -->`), single inserted lines (`{% render 'rp-head' %}`, `{% render 'rp-import-map-entries' %}`), and keyed JSON merges (locales under key `ripple`; settings group `t:ripple.settings.name`).
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 6.2 to 6.5, 6.8 (Shopify stores only theme directories plus `AGENTS.md` and `DESIGN.md`, so a root lockfile would be lost).
- Rejected: `ripple.lock`; `components.json` holding hashes.
- Amended: (a) Two sentences were corrected in place: the trailer id is `<owner>/<key>` (owners: a component id, `core`, `blueprint.<id>`), and `ripple.json` gains `paths.public` (default `public/ripple`) and `paths.pages` (D-101). (b) Every manifest `files.<host>[]` entry has a stable `key`. (c) `ripple status --json` prints the computed lock with `lockVersion: 1`; nothing is written to disk. (d) Install transforms (Liquid block prefix, package name) are applied before hashing, and the merge base re-applies the project's prefix. (e) The `AGENTS.md` markers are `<!-- ripple:start agents -->` and `<!-- ripple:end agents -->`.

#### D-057 CLI

- Decision: Commands: `init`, `add <component...>` (`--all`, `--blueprint <id>`, `--dry-run`, `--diff`, `--prefix`), `diff`, `upgrade` (`--dry-run`, `--ours`, `--theirs`, `--write-conflicts`, `--force`), `remove`, `status` (`--json`), `check [paths...]` (`--json`, `--url`, `--browser`, `--rule`, `--max-warnings`), `docs` (no argument: the index; `docs <component>`; `docs <RULE>`; `docs guide <topic>`; it has no flags of its own), `manifest`, `skills sync`, `skills check`. Exit codes: 0 success, 1 findings or conflicts, 2 usage or environment error. Every write is plan-then-write with temp file and rename; a collision with an untrailered file aborts. Host detection order: `--host` flag, `ripple.json`, Liquid theme (`layout/theme.liquid` + `templates/` + `config/settings_schema.json`; error when `sections/` or JSON templates exist), `package.json` (remix, react, else html), else error. `upgrade` uses the zero-dependency three-way merge of the research report (regions from hunks that overlap or touch; markers `<<<<<<< yours`, `||||||| installed`, `=======`, `>>>>>>> upstream`; markers are written only with `--write-conflicts`).
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 6.4, 6.6, 6.7.
- Rejected: an interactive-only CLI (agents need flags and JSON); git as a dependency for merging.
- Amended: (a) The command list was corrected in place for `check [paths...]` and `docs`. `docs` takes positionals only; doc 07's `--rule` flag on `docs` is removed in favour of `ripple docs <RULE>` (doc 08), and `ripple docs guide <topic>` is added. (b) Further flags, owned by doc 07: global `--host`, `--cwd`, `--help`, `--version`, `--yes`; `init` path, prefix, css and `--dry-run` flags; `remove --force --dry-run`; `skills sync --force`; `skills check --mode`. The CLI never prompts. (c) `ripple diff` exits 1 when there are differences. (d) Merge-base retrieval order: the running registry, the project's `node_modules`, the cache (`RIPPLE_CACHE_DIR`), then `npm pack`; `RIPPLE_OFFLINE=1` disables the last. A published version MUST never be unpublished. (e) `check` has no suppression mechanism in V1. (f) `add` and `upgrade` regenerate `props.css` and `theme.css` (D-029).

#### D-058 Manifest

- Decision: `manifest.json` (schema `manifest.schema.json`) is assembled from per-component JSON files. Key names are fixed in section 4.8. The checker, generator, docs, CLI and skills read only the manifest; no tool has a second table of component facts.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 4.1 to 4.3.
- Rejected: deriving the manifest from source by parsing.
- Amended: Key additions are in section 4.8 and D-100: top-level `elements`; component `upgradeAllow`, `deprecated`; `files.<host>[].key`; the shapes of `state[]`, `parts[]`, `rules[]`, `agent`. Parts live inside their component entry; `partOf` is only for a full component nested in another.

#### D-059 Checker

- Decision: `ripple check` has four layers: S (source), H (rendered HTML, bundled parse5), B (browser, Playwright, optional), P (project state). Rule ids are stable public API. The V1 set is exactly these 55 ids: RP101 to RP105 and RP110 to RP118 (usage and structure), RP201 to RP204 (accessibility), RP301 to RP309 and RP320 to RP321 (no-JS, commerce, agent attributes), RP401 to RP406 (Liquid), RP501 to RP508 and RP510 to RP512 (project state), RP601 to RP609 (browser), plus `TC:<CheckName>` for Theme Check findings. Every other number is reserved (RP000 and RP509 are reserved by doc 07). Message format: `<RULE> <severity>  <location>  <component>: <problem>` followed by `found` / `allowed` / `fix` / `why` / `docs` lines; `--json` gives the same fields. Rules that refer to components this ledger cut or changed (Menu in RP204, "drawer viewport" in RP303, "Shop Pay" in RP320) MUST be rewritten by doc 07 to match this ledger; ids do not change. A prohibited `ui-*` tag (D-022) is reported by RP111. Doc 07 adds one rule, RP118 (error, layer H): a `data-state` attribute on or inside a Ripple root, or a `data-rp-*` attribute name that is not listed in section 4.4.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` 7.1 to 7.3 (prototype `ripple/docs/research/spikes/agent-kit/`).
- Rejected: relying on Theme Check alone (it validates only LiquidDoc unions with literal arguments).
- Amended: (a) The id list was corrected in place: D-059 said "RP101 to RP117" and "RP501 to RP512", but 51 ids were defined; doc 07 added RP118 (mandated), RP308 (regions in rendered HTML), RP309 (`#rp-commerce` config element), RP507 (two runtimes on one page), RP508 (stale derived CSS). Total 55. (b) Ownership split (section 12): doc 07 owns ids, severity, layer, detection, `fix` computation, and the text and JSON output FORMAT. Doc 08 owns each rule's `problem`, `fix` and `why` text and the rule pages, and MUST cover all 55 ids. (c) In the message format, `<component>: ` is omitted when the finding has no component (doc 08's literal `project` is removed). The `docs:` line is `<command form> docs <RULE>`, with the command form of doc 07 section 7.1 rule 12. (d) Component-specific rules are manifest `rules[]` entries with kebab-case ids (`dialog-needs-title`, `variant-picker-outside-form`), reported by RP113 as `[<rule id>]`. No component document may invent an `RPnnn` id; doc 09's `RP120` becomes a `rules[]` entry of Spinner. (e) RP308's containment check applies only to `rp-cart` roots (D-047). RP502 is defined by file state `outdated`, not by the trailer's version text. Doc 03's gamut warning is folded into RP609. Details: D-102.

#### D-060 Agent documentation and skills

- Decision: The package ships `docs/INDEX.md`, `docs/llms.txt`, `docs/components/<id>.md` (generated from the manifest), `docs/guides/`, `docs/rules/<RULE>.md`, and 14 skills: `ripple`, `ripple-setup`, `ripple-compose-page`, `ripple-commerce`, `ripple-discovery`, `ripple-theming`, `ripple-customize-component`, `ripple-new-component`, `ripple-check-and-fix`, `ripple-upgrade`, `ripple-liquid`, `ripple-react`, `ripple-remix`, `ripple-agent-ready`. Each skill is at most 300 lines. `ripple skills sync` writes them to `.claude/skills` and `.agents/skills`. The package is also a pi package (`keywords: ["pi-package"]`, `pi.skills`). `ripple init` writes a generated section into `AGENTS.md` between markers; it is at most 12,000 bytes and MUST be sufficient to use Ripple correctly without any skill.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` section 9; `ripple/theme/AGENTS.md` (50 kB limit).
- Rejected: documentation only on a website; one large skill.
- Amended: (a) Skills have no `references/` directory: the package tree closes at `SKILL.md` and `ripple.json`. Detail lives in 12 guides under `docs/guides/`. (b) The `AGENTS.md` section is truncated by the deterministic steps of doc 08 when 84 component summaries exceed 12,000 bytes. (c) There is no in-page development overlay; the `html` and `liquid` hosts have no development-only warnings and the checker is their feedback loop. (d) An optional hand-written `components/<id>/notes.md` is appended to the generated component page. (e) `ripple docs` serves the index, component pages, rule pages and guides (D-057).

#### D-061 Evals

- Decision: The eval suite is that of the research report: tasks T01 to T17 (T18 is dropped), harness adapters `claude-code`, `pi`, `opencode`; scoring weights 35 / 15 / 20 / 10 / 10 / 10; pass at 80 or more; the "Sidekick bar" thresholds as written there. Liquid tasks have two tiers: local (shim render + checker) and live (preview store). T01, T02 and T08 MUST run by the end of the commerce milestone.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` section 10.
- Rejected: evaluating only by human review.
- Amended: (a) Tasks that contradicted later decisions were rewritten by doc 08 (T05 combobox, T10 `ui-dialog`, T03 Shop Pay); the core set T01, T02, T08 is unchanged. (b) `evals/` layout: harness code and templates under `adapters/`; thresholds, golden set and decision log under `rubric/`. The root `package.json` has an `eval` script. (c) Budgets are provisional until the freeze script runs; Ripple-only checks are skipped in the control arm. (d) Model ids: the agent model defaults to `anthropic/claude-opus-4-6` (the Hydrogen harness default); weak and judge models are `null` in `bar.json` and the bar run refuses to start until Ben names them (Q17). (e) Rules G-1 to G-7 of doc 08 gate API changes on eval results; no aliases are ever added; a rename of a ledger-fixed name goes to Ben. (f) T08 depends on the manifest rule ids `variant-picker-outside-form` (doc 11) and `dialog-needs-title` (doc 10).

#### D-062 Beta dependencies (resolves R5)

- Decision: (1) UI SDK packages are pinned exactly (D-022). (2) Only three `ui-*` families are used, so the exposed beta surface is small. (3) The upgrade-stability test (D-063 tier 3) and the generated pre-upgrade display rules are the tripwire: a UI SDK bump is a PR that regenerates upgrade-snapshot fixtures and must pass every tier. (4) `@shopify/hydrogen` is a peer with the range in D-052; all use goes through the adapter (D-042). (5) `@shopify/partial-rendering` and Standard Actions are touched only inside `src/commerce/adapter-liquid.ts` and the Liquid refresh strategy, behind feature tests with the fallbacks of D-041 item 7 and D-046. (6) Remix 3 APIs appear only in scaffolded Remix bindings and in app code; no file under `src/` imports `remix` (the only exception is the type-only `import type {} from "remix/component"` in `src/remix/**`). The Remix refresh strategy receives `reloadFrames` and `navigate` as `configureCommerce` options.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (14 versions in 9 days); `ripple/docs/research/hydrogen-core.md` (platform specifiers 404 on npm); `ripple/docs/research/remix-3.md` (`remix@3.3.0`).
- Rejected: vendoring UI SDK source; version ranges.
- Amended: Item 6 was corrected in place: doc 01 found that D-052 declares no Remix peer, so no file under `src/` may import `remix`; the strategy gets its functions through `configureCommerce`.

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
- Amended: (a) "Whitespace collapsed" in tier 2 means: adjacent text nodes are merged, runs of whitespace collapse to one space and are trimmed, empty text nodes are dropped, and `pre`, `textarea`, `script`, `style` are kept verbatim. Inter-element whitespace is therefore NOT compared and no contract may depend on it (D-075). (b) Doc 02 owns the canonicalisation algorithm and its reference code; doc 13 owns the harnesses. (c) "Visual regression" is computed-style JSON snapshots; screenshots are unread artifacts. (d) The runner is `node:test` driven by `test/run.ts`. Default tiers: 1, 2, 3, 4, 5, 6, 10. Tier 6 on the hydrogen backend and tier 7 need the network and run only with `RIPPLE_NETWORK=1`. Cross-engine tests carry the `[chromium]` tag when Chromium-only and the job is non-blocking until SPIKE-06 reports. (e) Acceptance tests are identified `AT-<n>` per component with a coverage check. The no-JS layout comparison excludes `data-rp-js="fallback"` controls and exempts Tabs. Details: D-104.

#### D-064 Size budgets

- Decision: Budgets live in `size-budget.json` and fail CI when exceeded. 1 kB is 1000 bytes. JavaScript is measured as gzip (level 9) of the shipped file. CSS ships unminified and is measured as gzip (level 9) of a copy minified with the fixed lightningcss options of doc 03. Budgets: `ripple.js` at most 45 kB (the same limit applies to the Liquid build `registry/liquid/assets/ripple.js`); `ripple.elements.js` at most 30 kB; lazy chunks, in each of the two sets: tabs 10 kB, tooltip 22 kB, toast 15 kB, shared 10 kB, agent 14 kB; CSS: tokens + base at most 2.2 kB, `props.css` at most 5.2 kB, full `ripple.css` at most 45 kB; each component CSS file at most 6,000 bytes minified (not gzipped). The base-theme research's idea "JS no larger than the base theme (32.6 kB gzip)" is NOT adopted: the UI SDK kernel (12.8 kB) and the Hydrogen cart subset (13.2 kB) are fixed costs of Ben decisions 3 and 4.
- Evidence: `ripple/docs/research/uisdk-web-elements.md` (weights); `ripple/docs/research/hydrogen-core.md` (bundle sizes); `ripple/docs/research/styling-spike.md` (CSS budgets); `ripple/docs/research/base-theme.md` (base theme sizes).
- Rejected: no budgets.
- Amended: The budget sentence was corrected in place: the agent chunk is 14 kB, not 13 kB (measured 12.98 kB with terser, 15 bytes of margin; 13.9 kB with esbuild's minifier; doc 04 L-15); a 10 kB budget exists for the `shared` chunk (measured 9.2 kB); every chunk budget applies to both sets; the Liquid `ripple.js` has the `ripple.js` budget; the unit and the measuring method are fixed (docs 03 and 13); the per-component CSS cap of 6,000 bytes is new (doc 03). Measured today (doc 04): `ripple.elements.js` 22.3 kB, tabs 6.6, tooltip 11.5, toast 10.3; the commerce layer alone 22.5 kB (doc 05); the size of the real `ripple.js` is UNVERIFIED until both are built together.

#### D-065 Agent surface

- Decision: Two audiences. (1) Any browser agent: served by real links, forms, native controls, correct roles and names (kind `static` appears only in the accessibility tree; an `rp-*` element of kind `native` is built on the kernel and MAY also declare `agent.surface: "bridge"`, as `rp-dialog` does). (2) An in-page agent using the UI SDK bridge (`createAgent` from `@ui-sdk/web/agent`), opt-in, about 12 kB gzip: it sees `ui-*` and `rp-*` primitives and the methods in each primitive's `agent` key. Attributes: `data-agent-confirm="<sentence>"`, `data-agent-secret`, `data-agent-hidden`; no other `data-agent-*`. Manifest key `agent` records `surface` (`accessibility-tree | bridge`), `actions`, `confirm`, `secret`.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` section 8; `uisdk/packages/web/src/agent.ts`.
- Rejected: loading the bridge by default.
- Amended: (a) The parenthetical was corrected in place: `agent.surface: "bridge"` is allowed for kind `native` (`rp-dialog`), which D-008 and D-019 already required. (b) Commerce agent actions are defined by doc 08 and adopted by docs 05 and 11, including `api.lines()` on `rp-cart` (D-095). (c) `rp-dialog`, `rp-quantity` and `rp-navigation-menu` roots have no bridge label; no contract change is made, and RP607 is narrowed accordingly. (d) The manifest key is `agent.actions[]` with an optional `confirm` sentence per action; `agent.confirm[]` lists controls that carry `data-agent-confirm`.

#### D-066 Language, direction, motion, accessibility baseline

- Decision: (1) Every user-visible default string is a locale key `ripple.<component id>.<key>` with an English default that is identical in all hosts; TSX hosts take overrides through props, Liquid through `locales/*.json`. (2) CSS uses logical properties only; `start` / `end` everywhere, never `left` / `right`, in prop values too. (3) Motion follows D-029 and is disabled under `prefers-reduced-motion`. (4) Accessibility target is WCAG 2.2 AA; focus is always visible (`--color-ring`); minimum target size 24 by 24 CSS px, controls default to `--spacing-control-md`. (5) Status changes are announced through `announce()` or an Announcer region; cart changes MUST be announced.
- Evidence: `ripple/theme/AGENTS.md` (translated UI only; RTL; motion); `ripple/docs/research/liquid-blocks-partials.md` L-10; `ripple/theme/assets/live-region.js`.
- Rejected: hard-coded English strings; physical direction properties.
- Amended: (a) TSX hosts override printed strings through an optional `strings` prop (an object keyed by the component's locale key suffixes); a11y names keep their own props (`ariaLabel`, `previousLabel`, ...). (b) Blueprint strings use the namespace `ripple.blueprints.<blueprint id>.<key>`; schema labels use `ripple.props.*` (D-038); JavaScript announcements use the `strings` option of D-087. (c) "Focus is always visible" is implemented by ONE global `:where(:focus-visible)` ring in `base.css`; the outline is removed only for `dialog` and `main` (doc 03). (d) FormMessage and Banner derive `role` from `tone`: `alert` for `destructive`, `status` otherwise (doc 09).

#### D-067 Milestones (for PLAN.md)

- Decision: Order of work: M0 spikes that need no store (SPIKE-04, 05, 06, 07, 10); M1 foundations (manifest schema, generator, checker layers S and H, tokens, layers, props, runtime, doc 09 components, fixture conformance in four hosts); M2 interactive (doc 10); M3 commerce (docs 05, 11; eval harness with T01, T02, T08); M4 chrome and blueprints (doc 12); M5 Liquid theme (doc 14) and live tiers (needs SPIKE-01, 02, 03, 09); M6 full evals and the Sidekick bar. Liquid bindings are generated and shim-tested from M1 onward; M5 is the assembled theme, not the first Liquid work.
- Evidence: `ripple/docs/research/agent-kit-and-distribution.md` (milestone implication: checker, manifest schema, generator in foundations).
- Rejected: Liquid last (Ben's update makes Liquid a first-class host).
- Amended: SPIKE-08 and the new SPIKE-11 need no store and belong to M0. The reconciliation worklists (`worklist/<doc>.md`) are applied to docs 01 to 14 before M1 starts.

#### D-068 Icons

- Decision: Icon prints an inline `<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">` using `currentColor`. Ripple ships its own small icon set (no icon library dependency); names are in section 6.6. Sources are `icons/<name>.svg`. TSX: `<Icon name="cart" />`. Liquid: `{% render 'rp-icon', name: 'cart' %}` (Icon is a snippet, not a block, so that it costs one statement inside any file). An icon is always decorative; the accessible name belongs to the control around it (IconButton REQUIRES `ariaLabel`).
- Evidence: `ripple/docs/research/base-theme.md` (an icon button costs three statements; Icon as snippet); `ripple/theme/assets/icon-*.svg`.
- Rejected: an icon font; a third-party icon package (Ben decision 3); `<img>` icons (cannot take `currentColor`).
- Amended: Icon takes only `name` and `class` (no `span`, `hidden`, rest props or `attributes`). An unknown name prints nothing. The path data of the 24 icons is defined in doc 09. IconButton REQUIRES `icon` and `ariaLabel`; EmptyState takes an optional `icon`.

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
| SPIKE-01 | `liquid-standard-actions-runtime` | Does Hydrogen's default cart handler work against the real Standard Actions runtime on a preview store (add, set, remove, note, discount, `getCart`, `openCart`)? Does the platform publish the Standard Events page view on a theme by itself (the base theme dispatches it in `ripple/theme/assets/page-view-event.js`)? | D-041: Hydrogen cart store with no `configureCartEndpoint`. The Liquid adapter dispatches the page view (D-089). | The Liquid adapter implements `cart` as a thin object with the same `getState` / `subscribe` / `handleFormSubmit` surface that calls `Shopify.actions.updateCart` / `getCart` directly. Needs Ben's sign-off (weakens decision 4). Elements do not change. Page view: when the platform publishes it, the adapter's dispatch is removed. | Preview store | 05 |
| SPIKE-02 | `liquid-preview-store-rendering` | Does the platform wrap block or partial output in an element? Do `partials.fetch` / `apply` behave as the local shim assumes? Is `as` a legal block argument? Is a bare schema setting accepted? What is the `type` value of a discount-code `discount_application`? (Doc 14 lists the full set, V-1 to V-20.) | No wrapper; contracts identical to other hosts; region root carries `data-rp-region`; param `as`. | The canonicaliser unwraps the platform wrapper; `base.css` gives the wrapper `display: contents`; region lookup uses the wrapper. Param `as` becomes `tag` (D-038). | Preview store | 14 |
| SPIKE-03 | `canvas-theme-reference` | Does the Canvas / Sidekick compiler accept the layer statement and an `@theme reference` block in `config/styles.css`? | D-055: marker region with `@theme reference`. | Omit the region. Utilities name Ripple tokens with arbitrary values (`bg-(--color-primary)`); documented in the `ripple-liquid` skill. | Preview store with Canvas | 03, 14 |
| SPIKE-04 | `rp-root-only-primitive` | Does `definePrimitive` + `createParts` with only a `root` part behave correctly at runtime (upgrade, destroy and recreate, agent bridge)? | D-019 item 1. | A base class `RippleElement extends HTMLElement` in `src/runtime/element.ts` with the same public surface (events, `api` methods, attribute reflection) and manual bridge registration. | Local | 04 |
| SPIKE-05 | `invoker-commands-hosts` | Do React 19 and Remix 3 print `commandfor` / `command` / `popovertarget` unchanged on `<button>` and `popover=""` on a `<div>`, and does the polyfill work in WebKit and Gecko? | D-008: attributes printed by the binding; polyfill in `ripple.js`. D-010: `popover=""`. | Bindings also print `data-rp-open="<id>"` / `data-rp-close="<id>"` on the same buttons and the runtime's opener listener handles them (`data-rp-close` is listed in section 4.4 for this path only). Popover prints `popover="auto"` in all four hosts. | Local | 04, 06 |
| SPIKE-06 | `cross-engine-features` | WebKit and Gecko: attribute-token props, `pow()`, relative colour, anchor positioning, `@media (scripting: none)`, `closedby`, the `popover` attribute, `<details name>`, `revert-layer`, `::backdrop` custom-property inheritance. Confirm the floor of D-032 and the tiers of D-081. | Features behind `@supports` or a JS feature test with the stated fallbacks. | Per feature: literal type scale; literal foreground colours; centred popover (or a 1 kB positioning routine in the runtime); Tabs shows only the default panel without JS; raise the floor and record it here. | Local; WebKit and Gecko builds | 03, 13 |
| SPIKE-07 | `navigation-menu-popover` | Are `popover` panels with hover intent usable for a desktop mega menu (focus order, hover gaps, nested popovers, Remix morph)? | D-017. | CSS-only dropdowns opened by `:hover` and `:focus-within`, with a disclosure button toggling `aria-expanded` for touch and keyboard. | Local | 12 |
| SPIKE-08 | `agent-bridge-confirm` | Does the bridge refuse, without approval, an action declared in an `rp-*` primitive's `agent` key, and does it honour `data-agent-confirm` on a native control inside an `rp-*` root? | D-050 as amended: `data-agent-confirm` on the checkout control ONLY; `rp-cart` declares no `checkout` action. The `ripple-agent-ready` skill states that host agents MUST confirm controls carrying `data-agent-confirm`. | Not a fallback but an addition: when the spike shows the bridge enforces confirmation for a declared action, doc 08 adds the `rp-cart` action `checkout` with a `confirm` sentence (manifest `agent.actions[].confirm`). | Local | 08 |
| SPIKE-09 | `liquid-recommendations-region` | Can a partial be fetched from `routes.product_recommendations_url` (`?product_id=&limit=&intent=`) so that `recommendations` is populated without the Section Rendering API? | `rp-recommendations` calls `refresh(["rp-product-recommendations"], { url })` when it nears the viewport. | On Liquid, ProductRecommendations renders a FeaturedCollection of a merchant-chosen collection (no lazy load). hydrogen backend is unaffected (server-rendered from the Storefront API). | Preview store | 11 |
| SPIKE-10 | `html-region-refresh` | Is document fetch + replacement of `[data-rp-region]` elements robust (focus, scroll, form state, scripts) on the `html` host AND on the `remix` host, where it is the default strategy? Does the React strategy for reasons `predictive` and `recommendations` (`useRegionHtml`, D-090) hydrate and update without a mismatch? | D-046 item 4 and D-090: `html` strategy on `html` and `remix`; `useRegionHtml` on `react`. | `html` and `remix`: `location.assign(url)` (full navigation). `react`: the app cancels `rp:refresh` for those reasons and renders the results itself. | Local | 05 |
| SPIKE-11 | `remix-opt-in-refresh` | Do the two opt-in `configureCommerce` options work under Remix 3: `reloadFrames(regions)` with named blocking `<Frame>`s, and `navigate(url, { replace })` for reasons `variant` and `filter`, with `rp-*` and `ui-*` state preserved by the morph? | D-090: both options are documented as opt-in; without them the `html` strategy runs. | The two options are removed from the Remix documentation and skills; Remix uses the `html` strategy only. | Local, Node 24.3 or later | 05, 06 |

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
| CSS class | `rp-<component id>` (root), `rp-<component id>-<part>` (part). No other class is ever printed by Ripple. The manifest `root.class` is authoritative; the ONE exception to the pattern is QuantityInput, whose root class is `rp-quantity` and whose part classes are `rp-quantity-<part>` (D-015). A component that composes another by contract prints the composed component's class first, then its own (D-070): `class="rp-drawer rp-cart-drawer"`. | `rp-dialog-title` |
| Blueprint id | kebab-case | `collection` |
| Region name | `rp-<area>-<what>` (D-046) | `rp-cart-lines` |
| Locale key | `ripple.<component id>.<key>`; key is snake_case. Other namespaces: `ripple.blueprints.<blueprint id>.<key>` (blueprint strings), `ripple.props.<prop name or value>` (Liquid schema labels, D-038), `ripple.settings.<key>` (theme settings group). | `ripple.cart-line.remove` |
| Checker rule id | `RP` + three digits; assigned only by doc 07 (D-059) | `RP101` |
| Component rule id | kebab-case, starts with the component id; lives in manifest `rules[].id`; reported by RP113 | `dialog-needs-title` |
| Region part snippet (Liquid) | `rp-<component id>-<part>` (D-091) | `rp-cart-lines-list` |
| Acceptance test id | `AT-<n>` inside a component spec (D-104) | `AT-3` |
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
- A prop that IS a native attribute renders that attribute, not `data-`: `id`, `href`, `target`, `rel`, `type`, `name`, `value`, `checked`, `disabled`, `required`, `placeholder`, `min`, `max`, `step`, `pattern`, `autocomplete`, `rows`, `alt`, `width`, `height`, `loading`, `fetchpriority`, `sizes`, `poster`, `autoplay`, `muted`, `loop`, `for`, `form` (prop `formId`), `commandfor`, `command`, `popovertarget`, `open`, `aria-label`, `aria-describedby`, `aria-current` (prop `current`), `aria-invalid`.
- A prop that selects the element prints no attribute: `as` and `level`.
- An unset prop prints nothing. An empty string counts as unset. An enumerated prop with an invalid value prints its default, in every host (D-073).
- UI SDK option attributes: Tooltip `side` and `align` are printed as the attribute names UI SDK reads (`side`, `align`) on `ui-tooltip-content` (the element UI SDK reads them from; doc 10, measured snapshot), and are omitted at the default, because `data-side` / `data-align` are UI SDK state attributes there (D-082). The Toast region (`ui-toast-region`) prints `data-side` / `data-align` with the default printed, as the first bullet says, and ADDITIONALLY the option attributes `side` / `align` when the value is not the default (`bottom`, `end`), because UI SDK reads its options from them (doc 10). These two are the only exceptions to the first bullet. (Amended by the closing pass: the text said `ui-tooltip` and did not mention Toast.)
- A component MAY select its own prop attribute in CSS even when the name is on the reserved list below, always together with its own class (D-024).
- Reserved attribute names written by UI SDK, which Ripple CSS MUST NOT select without a component class in the same selector: `data-align`, `data-side`, `data-orientation`, `data-type`, `data-value`, `data-count`, `data-index`, `data-open`, `data-closed`, `data-disabled`, `data-pending`, `data-selected`, `data-checked`, `data-active`, `data-current`, `data-slot`.

### 4.4 Ripple hook attributes (complete list)

Hook attributes are read by JavaScript and tests. CSS does not select them (exception in D-021). A `data-rp-*` attribute name that is not in this table is a checker error (RP118).

| Attribute | On | Value | Meaning |
|---|---|---|---|
| `data-slot` | `rp-*` roots | the tag name | UI SDK kernel part marker (D-019) |
| `data-slot` | elements bound by UI SDK inside the Tabs, Tooltip and Toast families | the value UI SDK writes: `tabs`, `tabs-list`, `tabs-tab`, `tabs-panel`, `tooltip-trigger`, `tooltip-content`, `toast-region` | Printed by the server because it is part of the upgrade snapshot. `ui-tooltip` itself carries none. The Tooltip trigger button gets `data-slot="tooltip-trigger"` from the `tooltip` prop (D-082) |
| `data-rp-part` | native descendants of an `rp-*` root | part name (kebab-case) | Identifies a part to the element. Shared names: `count`, `error`, `status`, `input`, `increment`, `decrement`, `prev`, `next`, `viewport`, `item`, `results`, `submit`, `remove`, `trigger` |
| `data-rp-field` | form controls in commerce forms | `merchandise-id`, `quantity`, `line-id`, `selling-plan`, `note`, `discount-code` | Dialect-independent field identity (D-043). Printed by the prop `rpField` (Liquid `rp_field`) on Input, Textarea and Select; always printed as `quantity` by QuantityInput |
| `data-rp-line` | cart line root | line id (hydrogen) or line key (liquid) | Identifies a cart line |
| `data-rp-open` | `<a href>` openers | dialog id | Opener pattern (D-009). Printed only by the prop `dialog` of Link, Button and IconButton, and by a component whose own contract prints an opener link: CartLink (prop `drawer`), the ProductGallery zoom link, and the Header default body through the components it embeds (D-110 row 9). On the SPIKE-05 fallback path also on `<button>` openers |
| `data-rp-close` | `<button>` closers | dialog id | SPIKE-05 fallback path ONLY; never printed on the default path |
| `data-rp-refresh` | forms and links inside an `rp-live` or `rp-cart` root; `rp-live`, `rp-cart`, `rp-predictive-search`, `rp-recommendations` roots. NOT on `rp-product-form` | space-separated region names | Regions to refresh after the action (D-046) |
| `data-rp-region` | region root element | region name | Marks a refreshable region (D-046, D-091) |
| `data-rp-js` | controls; also a `<form>` | `inflow`, `overlay`, `fallback` | Visibility relative to element definition (D-021) |
| `data-default-open` | `<dialog>` | empty | Open on connect (D-008) |
| `data-url` | `rp-recommendations` root | URL | The document to fetch the recommendations region from (D-046) |
| `view-event-trigger`, `view-event-payload` | `rp-view-event` | `connect` (the only trigger blueprints use in V1) or `intersect`; JSON text | View analytics (D-089). Not `data-` attributes: the names are fixed by `@shopify/standard-events` |
| `data-view-event-payload` | `<script type="application/json">` child of `rp-view-event` | empty | The child form of the payload, used for the cart view (D-089) |
| `data-template` | `<main>` in the Liquid layout only | page type | Read by the Liquid page-view dispatch (D-089) |
| `data-agent-confirm`, `data-agent-secret`, `data-agent-hidden` | controls | sentence / empty | Agent bridge (D-065) |
| `data-rmx-*` | Remix only | see D-034 | Host extras; removed by the canonicaliser |
| `data-rp-case`, `data-rp-fixture`, `data-rp-test-raw` | test pages built by doc 13's harness | harness-defined | Test harness only; MUST NOT appear in a component, blueprint or registry file |

One element id is reserved: `rp-commerce`, the config element `<script type="application/json" id="rp-commerce">` (D-087).

### 4.5 CSS custom properties

| Kind | Pattern | Example |
|---|---|---|
| Dial | `--rp-<name>` (list in D-026) | `--rp-radius` |
| Token in a Tailwind namespace | Tailwind's name | `--color-primary`, `--spacing-gutter`, `--radius-control`, `--text-lg` |
| Other global token | `--rp-<group>-<name>` | `--rp-duration-fast`, `--rp-z-overlay` |
| Component public variable | `--rp-<component id>-<name>` | `--rp-button-height` |
| Component private variable | `--_<name>` | `--_bg` |

Tone slots: every component with `tone` or `variant` colours consumes the three private slots `--_bg`, `--_fg`, `--_border`, set by its modifier rules. A component that has BOTH `tone` and `variant` additionally uses `--_tone`, `--_on-tone` and `--_tone-text` (the tone table and the variant formulas are in doc 03). Non-colour private variables are allowed: `--_hover`, `--_display`, `--_decoration`, `--_shadow`, and others a component needs. A private slot MAY have the value `initial`.

### 4.6 Files

- One component = one id = one CSS file `<id>.css`, one TSX file `<id>.tsx` per TSX host, one or more Liquid files (`blocks/<id>.liquid`, `blocks/<id>-<part>.liquid`, `snippets/rp-<id>.liquid`, region-part snippets `snippets/rp-<id>-<part>.liquid`), one HTML reference file `<id>.html`, one manifest file `<id>.json`, one doc `docs/components/<id>.md`.
- Optional per component: `<id>.data.ts` for TSX hosts (pure data helpers, file key `data`, D-094); `notes.md` (hand-written notes appended to the component doc, D-060).
- Every manifest file entry has a `key` that is unique inside its owner; the trailer id is `<owner>/<key>` (D-056).
- Element source: `src/elements/<tag>.ts`, `src/commerce/<tag>.ts`. `rp-view-event` has no file of its own; it is defined inside the two adapter files (D-089).
- Tests: `<name>.test.ts` next to the source; harness tests under `test/` (doc 13).
- Liquid infrastructure snippets: `rp-head`, `rp-tokens`, `rp-import-map-entries`, `rp-icon`. Their owner in trailers is `core`.
- Browser files: `ripple.js`, `ripple.elements.js`, and per chunk `ripple-<chunk>.js` / `ripple.elements-<chunk>.js` with chunks `tabs`, `tooltip`, `toast`, `shared`, `agent` (D-054).

### 4.7 Events

See D-023. Summary: element events `openchange`, `valuechange`, `indexchange`, `action` (lowercase, non-bubbling, on the root); document events `rp:refresh`, `rp:refreshed`; React callbacks `onOpenChange`, `onValueChange`, `onIndexChange`, `onAction` with `(value, detail)`. Cancelable: `openchange` (`rp-dialog`), `valuechange` (`ui-tabs`, `rp-quantity`), `action` (`rp-product-form`), `rp:refresh`. `rp:refresh` reasons: `cart`, `variant`, `filter`, `predictive`, `recommendations`, `manual`. The polyfill's `command` event (D-078) is internal and not public API.

### 4.8 Manifest key names

Doc 07 owns the JSON Schema; this list is the complete set of key names. A key that is not listed here MUST NOT be added by a component document.

Top level: `manifestVersion`, `package`, `prefix` (`css`, `element`, `liquidFile`), `pins`, `scales`, `hosts`, `elements`, `components`, `blueprints`.

`elements` (object keyed by custom element tag; source `src/gen/elements.json`): `display` (the static display value printed in `base.css`; `block` for every `rp-*` tag, D-080), `chunk` (`main | tabs | tooltip | toast`), `commerce` (boolean). `rp-view-event` is listed (`display: block`, `chunk: main`, `commerce: true`).

Component: `name` (the id), `title` (PascalCase name), `category`, `kind`, `status`, `since`, `deprecated`, `summary`, `useWhen`, `dontUseWhen`, `partOf`, `root` (`elements`, `class`, `requiresId`), `props[]`, `content` (`model`: `none | text | flow | parts`), `parts[]`, `template`, `state[]`, `events[]`, `commands[]`, `upgradeAllow[]`, `fixtures[]`, `noJs` (`level`, `behavior`, `fallbackHref`, `hideUntilDefined`), `a11y` (`pattern`, `checkPattern`, `name`, `keyboard`, `focus`, `announces`), `agent` (`surface`, `component`, `actions[]`, `confirm[]`, `secret`), `dependencies` (`components`, `embeds`, `elements`, `uiSdk`, `hydrogen`, `tokens`, `icons`, `locale`), `liquid` (`tier`, `block`, `snippet`, `partials`, `formDialect`, `embeddedBy`), `hydrogenHost` (`formDialect`), `rules[]`, `files` (`shared`, `html`, `react`, `remix`, `liquid`).

Prop: `name`, `type` (`enum | scale | boolean | string | number | id | url | object`), `values`, `scale`, `objectType`, `default`, `required`, `responsive`, `attribute`, `liquid` (`name`, `surface`: `param | setting`, `settingType`), `hosts`, `description`.

Part (`parts[]`; parts live inside their component entry, `partOf` is only for a full component nested in another): `name`, `elements`, `class`, `required`, `multiple`, `authoredBy`, `parent`, `props[]`, `content`, `template`, `description`.

State (`state[]`): `name`, `type`, `on` (the element or part that carries the attribute), `writer` (`server | element | browser`; added by the reconciliation), `defaultProp`, `property`, `reflects` (attribute names). Remix `data-rmx-preserve-attrs` is derived from rows whose `writer` is `element` or `browser` (D-034).

Upgrade allow-list entry (`upgradeAllow[]`, D-071; type `UpgradeAllowEntry` of doc 02 section 7.2): `select`, `attrs[]`, `childList`, `text`, `subtree`, `reason`.

Fixture: `name`, `props`, `children`, `parts`, `html` (present only in the built `manifest.json`; the source is `fixtures/<fixture>.html`), `hosts`, `mask[]` (`select`, `op`, `name`), `generated` (`template | upgrade-snapshot | hand`; REQUIRED).

Rule (`rules[]`, D-059): `id` (kebab-case), `kind` (`requires-ancestor | forbids-ancestor | requires-descendant | forbids-descendant | requires-attribute | max-count | custom`), `selector`, `target`, `count`, `message`, `fix`. Kind `custom` has no `selector`, `target` or `count`: its detection is the function stored under the rule id in `CUSTOM_RULES` of `src/check/rules/RP113.ts` (D-111).

Agent action (`agent.actions[]`): `name`, `description`, `confirm` (sentence, optional).

File: `key`, `source`, `target`, `type` (`css | binding | block | snippet | asset | types | blueprint | data`), `mode` (`owned | patch`), `generated`.

`category` values: `layout`, `typography`, `media`, `actions`, `forms`, `feedback`, `navigation`, `overlays`, `disclosure`, `product`, `cart`, `discovery`, `chrome`, `utilities`. `status` values: `stable`, `beta`, `planned` (`beta` is not protected by semver).

The sub-key lists above were read from doc 07's schema (`part`, `stateEntry`, `structureRule`, `upgradeAllowEntry`, `file`). Doc 07 MUST add `state[].writer`, the file type `data`, and `rp-view-event` in `elements`; nothing else in its schema changes because of this list.

---

## 5. Directory layout

### 5.1 The Ripple repository (complete tree)

```text
ripple/
  package.json  pnpm-lock.yaml  tsconfig.json  size-budget.json   # package.json is private, name "ripple-repo" (D-052)
  README.md  PLAN.md  AGENTS.md  CHANGELOG.md  LICENSE   # CHANGELOG.md: one section per version (doc 07 section 11)
  .github/
    workflows/ci.yml  workflows/nightly.yml    # doc 13
  bin/
    ripple.mjs                       # checked-in wrapper that imports the built CLI
  docs/                              # the specs
    00-decisions.md ... 14-liquid-theme.md
    research/                        # the eight reports and spikes/ (read-only history)
  theme/                             # the base theme: reference only, never shipped, never edited
  src/
    identity.ts                      # PKG_NAME, BIN_NAME, VERSION: the only place the package name is written
    index.ts                         # rv, cx, imageUrl, imageSrcSet, types, manifest loader (no side effects)
    responsive.ts  image.ts
    types.ts                         # Responsive, resource types (D-094), Manifest, ComputedLock
    architecture.test.ts             # import rules of doc 01
    runtime/
      index.ts  loader.ts  commands-polyfill.ts  opener.ts  announcer.ts
      element.ts                     # SPIKE-04 fallback base class; absent on the default path
    elements/
      index.ts                       # defines non-commerce rp-* elements and registers lazy ui-* chunks
      rp-dialog.ts  rp-carousel.ts  rp-quantity.ts  rp-navigation-menu.ts
      ui-tabs.ts  ui-tooltip.ts  ui-toast.ts   # lazy chunk entries; ui-toast.ts also exports toast()
    commerce/
      index.ts                       # getCommerce, configureCommerce; defines commerce elements
      adapter.ts  adapter-hydrogen.ts  adapter-liquid.ts  dialect.ts   # the two adapter files also define rp-view-event (D-089)
      refresh-html.ts  refresh-liquid.ts  refresh-remix.ts  refresh-react.ts
      rp-cart.ts  rp-product-form.ts  rp-live.ts  rp-predictive-search.ts  rp-recommendations.ts
    react/
      index.ts  use-element.ts  hooks.ts  jsx.generated.ts
    remix/
      index.ts  jsx.generated.ts
    agent/
      index.ts
    testing/
      index.ts  canonicalize.ts  fixtures.ts  resources.ts  upgrade-diff.ts  liquid-shim.ts  serve-theme.ts
    check/
      index.ts  engine.ts  report.ts  liquid-calls.ts  flows.ts
      rules/<RULE>.ts                # one file per rule id
    cli/
      index.ts  detect-host.ts  trailer.ts  merge3.ts  plan.ts  diff.ts  composite.ts  config.ts  base.ts
      commands/<command>.ts          # init add diff upgrade remove status check docs manifest skills
    gen/
      index.ts  build.ts  browser-bundles.ts
      html.ts  liquid.ts  react.ts  remix.ts  types.ts
      props-css.ts  theme-css.ts  display-css.ts  tokens-source.ts  css-lint.ts  size.ts
      docs.ts  registry.ts  agents-md.ts
      elements.json                  # source of the manifest key `elements`
      schema/                        # sources of manifest.schema.json, fixture.schema.json, config.schema.json
      liquid-core/                   # sources of the Liquid infrastructure files (doc 07)
  css/
    layers.css  tokens.css  base.css           # hand-written; base.css has two generated marker regions
    theme.css  props.css                       # generated, committed
  icons/
    <name>.svg
  locales/
    en.default.json                  # source of every ripple.* string
  components/
    <id>/
      <id>.json                      # manifest entry: the source of truth
      <id>.css
      <id>.test.ts
      notes.md                       # optional, hand-written (D-060)
      fixtures/<fixture>.html        # reference HTML, generated or snapshot, committed; the fixture source
      html/<id>.html
      react/<id>.tsx  react/<id>.data.ts       # .data.ts only where D-094 needs it
      remix/<id>.tsx  remix/<id>.data.ts
      liquid/blocks/<id>.liquid  liquid/blocks/<id>-<part>.liquid
      liquid/snippets/rp-<id>.liquid  liquid/snippets/rp-<id>-<part>.liquid
  blueprints/
    <id>/
      blueprint.json  <id>.test.ts
      html/  react/  remix/  liquid/
  skills/
    <skill>/SKILL.md  <skill>/ripple.json      # no references/ directory (D-060)
  guides/
    <topic>.md                       # the 12 hand-written guides copied into the package docs
  evals/
    tasks/T<nn>/  adapters/  rubric/  runs/
  examples/
    html/  react/  remix/  liquid/   # liquid/ is the Ripple theme specified by doc 14; .ripple-conformance/ work dirs are git-ignored
  test/
    run.ts  run.test.ts
    support/  fixtures/
    conformance/  upgrade/  hydration/  nojs/  commerce/  liquid/  a11y/  visual/  cross-engine/
  pkg/                               # build output: the publishable package (not committed)
```

Tooling runs from TypeScript sources: esbuild bundles each tool to `node_modules/.cache/ripple/` and Node runs it. There is no pnpm workspace; `examples/*` and `evals/*` reach the package through `file:` links to `pkg/`.

### 5.2 The published package

Doc 01 section 6.1 owns the exact tree of `pkg/`. Summary: `package.json` (generated), `README.md`, `LICENSE`, `bin/`, `dist/{index,elements,commerce,react,remix,agent,testing,check,cli}` plus `dist/chunks/`, `browser/` (exactly 12 `.js` files: `ripple.js`, `ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`, `ripple-shared.js`, `ripple-agent.js`, `ripple.elements.js`, `ripple.elements-tabs.js`, `ripple.elements-tooltip.js`, `ripple.elements-toast.js`, `ripple.elements-shared.js`, `ripple.elements-agent.js`; plus `ripple.css`), `css/`, `registry/` (`index.json`, `css/`, `react/`, `remix/`, `html/`, `liquid/{blocks,snippets,assets,locales}/`, `liquid/settings.json`, `blueprints/<id>/<host>/`), `manifest.json`, `manifest.schema.json`, `fixture.schema.json`, `config.schema.json`, `custom-elements.json`, `html-custom-data.json`, `docs/` (`INDEX.md`, `llms.txt`, `components/`, `guides/`, `rules/`), `skills/`. `registry/liquid/assets/` holds the six files of the Liquid build: `ripple.js`, `ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`, `ripple-shared.js`, `ripple-agent.js`.

### 5.3 A project after `ripple init` and `ripple add`

```text
react / remix / html (npm hosts)
  ripple.json                             # host, paths.components, paths.styles, paths.public, paths.pages, css, prefix
  AGENTS.md                               # generated Ripple section between <!-- ripple:start agents --> markers
  <paths.components>/<id>.tsx             # default app/components/ripple/ (html host: <id>.html)
  <paths.components>/<id>.data.ts         # only for components that have one (D-094)
  <paths.pages>/...                       # blueprint files (D-101)
  <paths.styles>/ripple.css  tokens.css  theme.css  base.css  props.css  components/<id>.css
  <paths.public>/ripple.js  ripple-*.js   # remix and html only; default public/ripple/; six files; ripple.elements*.js is never copied by the CLI
  .claude/skills/  .agents/skills/

liquid (theme root)
  AGENTS.md                               # generated Ripple section between markers
  layout/theme.liquid                     # blueprint `layout` (D-099), or patched: {% render 'rp-head' %}
  layout/password.liquid                  # blueprint `password`
  templates/*.liquid                      # blueprints; compose with {% block %}
  blocks/<id>.liquid  blocks/<id>-<part>.liquid
  snippets/rp-<id>.liquid  rp-<id>-<part>.liquid
  snippets/rp-head.liquid  rp-tokens.liquid  rp-import-map-entries.liquid  rp-icon.liquid
  assets/ripple.css
  assets/ripple.js  ripple-tabs.js  ripple-tooltip.js  ripple-toast.js  ripple-shared.js  ripple-agent.js
  config/styles.css                       # patched: marker region with @theme reference
  config/settings_schema.json             # patched: Ripple settings group
  locales/*.json                          # patched: key "ripple" (English text in every locale file)
```

---

## 6. Prop vocabulary

A component MUST use these names and values for these meanings and MUST NOT invent a synonym. A component uses a SUBSET of an enumeration; its spec lists the subset and the default.

### 6.1 Universal props (every component)

| TSX | Liquid | Renders | Notes |
|---|---|---|---|
| `id` | `id` | `id` | REQUIRED where D-020 says so |
| `class` (`className` in React) | `class` | appended after the `rp-` classes | never merged or de-duplicated |
| rest props | `attributes` | extra attributes on the root | cannot override a contract attribute: TSX spreads rest props first, Liquid prints `{{ attributes }}` last (D-035). MUST NOT be used for a Ripple hook attribute that has a prop (`data-rp-open`, `data-rp-field`, `aria-describedby` on a tooltip trigger). Not accepted by Icon, nor by roots printed by `{% form %}` |
| `span` | `span` | `data-span` | responsive; `1 2 3 4 5 6 full`; grid column span |
| `hidden` | `hidden` | `data-hidden` | responsive; `true false` |
| `rmxKey` (Remix only) | none | `data-rmx-key` | only on components with an `rp-*` or `ui-*` root and no required `id` (D-034) |
| `strings` (TSX only) | none | nothing | overrides the strings a component prints (D-066); Liquid uses `locales/*.json` |

`span` and `hidden` are not accepted by Icon, SkipLink, VisuallyHidden, Announcer, nor by a root printed by `{% form %}`.

### 6.2 Layout props

| TSX | Liquid | Attribute | Values | Responsive | Accepted by |
|---|---|---|---|---|---|
| `gap`, `gapX`, `gapY` | `gap`, `gap_x`, `gap_y` | `data-gap`, `data-gap-x`, `data-gap-y` | space steps (D-029) | yes | Stack, Inline, Grid (all three props on all three components) |
| `p`, `px`, `py`, `pt`, `pb` | same | `data-p`, `data-px`, `data-py`, `data-pt`, `data-pb` | space steps | yes | Container, Stack, Inline, Grid, Card |
| `direction` | `direction` | `data-direction` | `row column` | yes | Stack (default `column`) |
| `wrap` | `wrap` | `data-wrap` | `wrap nowrap` | yes | Inline (default `wrap`) |
| `align` | `align` | `data-align` | `start center end stretch baseline` | yes | Stack, Inline, Grid |
| `justify` | `justify` | `data-justify` | `start center end between` | yes | Stack, Inline, Grid |
| `columns` | `columns` | `data-columns` | `1 2 3 4 5 6 12` | yes | Grid. Carousel reuses the name with values `1` to `6` and its own CSS (D-016) |
| `width` | `width` | `data-width` | `page prose full` | no | Container (default `page`; Container owns the page gutter) |

### 6.3 Shared enumerations

| Prop | Values | Used for |
|---|---|---|
| `variant` (Button, IconButton) | `primary secondary outline ghost link destructive` | D-031 |
| `variant` (Text) | `body lead caption overline` | Text (default `body`) |
| `variant` (other components) | defined per component from: `solid soft outline plain elevated` | Badge and Banner: `solid soft outline`; Card: per doc 09 |
| `variant` (Link) | `inline plain` | Link (default `inline`) |
| `size` (controls) | `sm md lg` | Button, IconButton, Input, Select, Textarea, QuantityInput, Badge, Spinner |
| `size` (text) | `xs sm base lg xl 2xl 3xl 4xl 5xl 6xl` | Heading, Text |
| `size` (overlay) | `sm md lg full` | Dialog |
| `tone` | `neutral muted primary info success warning destructive sale` | Text, Badge, Banner, FormMessage, Progress, Price parts (each uses a subset stated in its spec) |
| `level` | `1 2 3 4 5 6` | Heading (the element `h1` to `h6`; visual size is `size`) |
| `as` | an allow-list per component | Text (`p span div`), Stack / Inline / Grid / Container (`div section ul ol nav header footer main aside article form`) |
| `weight` | `normal medium semibold bold` | Heading, Text |
| `textAlign` | `start center end` (responsive) | Heading, Text, Stack |
| `side` | `top bottom start end` | Popover, Tooltip; Drawer uses `start end bottom` |
| `align` (overlay) | `start center end` | Popover, Tooltip |
| `type` (Accordion) | `single multiple` | Accordion (default `multiple`; prints `data-type`) |
| `type` (Input) | `text email tel url password search number date` | Input (default `text`) |
| `status` (NewsletterForm) | `idle success error` | NewsletterForm (default `idle`) |
| `value` (Rating) | `0` to `5` in half steps | Rating (prints `data-value`; default `0`) |
| `orientation` | `horizontal vertical` | Separator, RadioGroup. Tabs has NO `orientation` prop in V1 and always prints `data-orientation="horizontal"` (D-012) |
| `ratio` | `auto 1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9` | Image, Video, Placeholder, card media |
| `fit` | `cover contain` | Image, Video |
| `radius` | `none sm md lg xl full` | Image, Card, Placeholder, Skeleton |
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
| `formId` | `form_id` | `form` | Input, Textarea, Select, QuantityInput, Button: associates the control with a form elsewhere in the document. The name `form` is reserved in Liquid |
| `rpField` | `rp_field` | `data-rp-field` | Input, Textarea, Select (D-043) |
| `dialog` | `dialog` | `data-rp-open` | Link; Button and IconButton when `href` is set (D-009) |
| `tooltip` | `tooltip` | `aria-describedby="<id>-content"` + `data-slot="tooltip-trigger"` | Button, IconButton inside a Tooltip (D-082) |
| `current` | `current` | `aria-current="page"` | Link, Breadcrumb item |
| `icon` | `icon` | an embedded Icon | IconButton (required), EmptyState |
| `autoComplete`, `pattern`, `rows` | `auto_complete`, `pattern`, `rows` | `autocomplete`, `pattern`, `rows` | Input; Textarea (`rows`) |
| `previousLabel`, `nextLabel` | `previous_label`, `next_label` | accessible names of previous / next controls | Carousel, Pagination |
| `decreaseLabel`, `increaseLabel` | `decrease_label`, `increase_label` | accessible names of the stepper buttons | QuantityInput |
| `poster`, `autoplay` | same | same | Video (`controls`, `playsinline`, `preload="metadata"` are always printed; `autoplay` prints the three attributes `autoplay muted loop`; there is no `muted` or `loop` prop, D-110 row 14) |
| `describedBy` | `described_by` | `aria-describedby` | form controls |
| `commandFor` | `command_for` | `commandfor` | Button, IconButton |
| `popoverTarget` | `popover_target` | `popovertarget` | Button, IconButton |
| `name`, `value`, `placeholder`, `min`, `max`, `step`, `alt`, `width`, `height`, `sizes`, `target`, `rel` | same | same | native meaning |

Resource props (objects): `product`, `variant`, `collection`, `article`, `cart`, `line`, `image`, `media`, `menu`, `shop`, `price`, `compareAtPrice`. Their shapes differ by backend (Liquid drops versus Storefront API objects); doc 05 defines the minimal shape each component reads, as the TypeScript types `RippleProduct`, `RippleVariant`, `RippleLine`, `RippleCart`, `RippleImage`, `RippleMoney`, `RippleCollection`, `RippleArticle`, `RippleMenu`, `RippleShop`, and the further types listed in D-094. `shop` is a TSX-only prop; Liquid reads globals. Liquid params that carry a root id are named after the root component in snake_case (`cart_lines`), D-020.

Commerce and chrome props (owned by docs 11 and 12; no other component may reuse these names with another meaning): `refresh`, `layout`, `fill`, `showVendor`, `from`, `locale`, `search`, `cartLines`, `drawer`, `count`, `action`, `predictive`, `open`, `params`, `chips`, `clearUrl`, `sortBy`, `query`, `limit`, `rows`, `acceleratedCheckout`, `links`, `status`. Their attributes: `data-sold-out`, `data-swatch`, `data-layout`, `data-show-vendor`, `data-row`.

### 6.5 Prohibited prop names

`loading` for busy state (use `pending`); `color` (use `tone` or `variant`); `kind`, `intent`, `appearance`, `theme` (use `variant`, `tone`, `scheme`); `isOpen`, `isDisabled` (no `is` prefix); `label` or `text` as content props (text is children); `left`, `right` as values (use `start`, `end`); `m`, `mx`, `my`, `mt`, `mb` (no margin props); `asChild`; `for` and `form` (Liquid reserved; use the root-named prop of D-020, or `formId` for the native `form` attribute); `describedBy` on Dialog and Drawer (the description part is linked by derived id); `defaultIndex` (Carousel has none in V1); any name matching `/^on/i` outside React callbacks.

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

84 components and 14 blueprints. "Tags" lists custom elements in the component's own contract. "Tier" is the Liquid tier (D-037). Names, ids and kinds in this list are final; where the mechanical rule of D-006 and this list differ, this list wins. `rp-view-event` is an infrastructure element printed by blueprints; it is not a component and is not counted (D-089).

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
| Forms | Field | `field` | static | `div` (parts `label`, `control`, `description`, `error`) | parts |
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
| Utilities | Announcer | `announcer` | static | `div role="status" data-rp-part="status"` (only inside a `<dialog>` or an `rp-*` root, D-079) | block |
| Navigation | Breadcrumb | `breadcrumb` | static | `nav` + `ol` | parts |
| Navigation | Pagination | `pagination` | static | `nav` (previous / next links by default; takes URL props, not a resource object) | resource |

### 8.2 Doc 10 - interactive (9)

| Component | Id | Kind | Tags | Tier | No-JS |
|---|---|---|---|---|---|
| Dialog | `dialog` | native | `rp-dialog` + `dialog` | parts | degraded |
| Drawer | `drawer` | native | `rp-dialog` + `dialog` | parts | degraded |
| Popover | `popover` | static | none (`popover` attribute) | parts | degraded |
| Tooltip | `tooltip` | ui | `ui-tooltip`, `ui-tooltip-trigger`, `ui-tooltip-content` | parts | none |
| Toast | `toast` | ui | `ui-toast-region` with class `rp-toast` (+ `toast()` helper; chunk loads on the first call, D-083) | block | none |
| Tabs | `tabs` | ui | `ui-tabs`, `ui-tabs-list`, `ui-tabs-tab`, `ui-tabs-panel` | parts | degraded |
| Accordion | `accordion` | static | none (`details`) | parts | full |
| Carousel | `carousel` | native | `rp-carousel` | parts | degraded |
| QuantityInput | `quantity-input` | native | `rp-quantity` (root class `rp-quantity`, D-015) | block | degraded |

### 8.3 Doc 11 - commerce (26)

| Group | Component | Id | Kind | Tags | Tier |
|---|---|---|---|---|---|
| Cards | ProductCard | `product-card` | static | none | resource |
| Cards | CollectionCard | `collection-card` | static | none | resource |
| Cards | ArticleCard | `article-card` | static | none | resource |
| Product | Price | `price` | static | none | block |
| Product | ProductGallery | `product-gallery` | native | `rp-carousel`, `rp-dialog` | resource |
| Product | ProductForm | `product-form` | commerce | `rp-product-form` | resource |
| Product | VariantPicker | `variant-picker` | commerce | `rp-live` (option values are links) | resource |
| Product | Swatch | `swatch` | static | none | block |
| Product | AddToCartButton | `add-to-cart-button` | static | none (inside ProductForm) | block |
| Product | ProductRecommendations | `product-recommendations` | commerce | `rp-recommendations` | resource |
| Cart | CartLink | `cart-link` | commerce | `rp-cart` | block |
| Cart | CartDrawer | `cart-drawer` | commerce | `rp-dialog`, `rp-cart` (composes Drawer by contract; `id` defaults to `cart-drawer`) | resource |
| Cart | CartLines | `cart-lines` | commerce | `rp-cart` | resource |
| Cart | CartLine | `cart-line` | static | none (inside CartLines) | resource |
| Cart | CartSummary | `cart-summary` | commerce | `rp-cart` | resource |
| Cart | CartNote | `cart-note` | commerce | `rp-cart` | resource |
| Cart | DiscountCode | `discount-code` | commerce | `rp-cart` (`noJs.level: degraded`, D-005) | resource |
| Cart | CheckoutButton | `checkout-button` | static | none | block |
| Discovery | Filters | `filters` | commerce | `rp-live` | resource |
| Discovery | FilterGroup | `filter-group` | static | none (inside Filters) | resource |
| Discovery | FilterChips | `filter-chips` | commerce | `rp-live` | resource |
| Discovery | PriceRange | `price-range` | static | none (inside Filters) | resource |
| Discovery | SortSelect | `sort-select` | commerce | `rp-live` | resource |
| Discovery | SearchForm | `search-form` | static | none | block |
| Discovery | PredictiveSearch | `predictive-search` | commerce | `rp-predictive-search` | resource |
| Discovery | LiveForm | `live-form` | commerce | `rp-live` | block |

`rp-cart` is one element used as the root tag of CartLink, CartLines, CartSummary, CartNote and DiscountCode, and inside CartDrawer (with different classes); every instance on a page shares the one store. Of the 26, only Swatch and SearchForm have generated bindings (D-003). Region parts: CartLines `list`, CartSummary `totals`, ProductGallery `media`, ProductRecommendations `list`, Filters `groups`, PredictiveSearch `results` (D-091).

### 8.4 Doc 12 - chrome and page sections (12)

| Component | Id | Kind | Tags | Tier |
|---|---|---|---|---|
| Header | `header` | static | none | resource |
| Footer | `footer` | static | none | resource |
| AnnouncementBar | `announcement-bar` | static | none | block |
| NavigationMenu | `navigation-menu` | native | `rp-navigation-menu` | resource |
| MobileNav | `mobile-nav` | native | `rp-dialog` (composes Drawer by contract, D-017) | resource |
| LinkList | `link-list` | static | none | resource |
| Logo | `logo` | static | none | block |
| LocaleSelector | `locale-selector` | static | none (Popover + native form) | resource |
| AccountLink | `account-link` | static | none | block |
| NewsletterForm | `newsletter-form` | static | none | resource |
| Hero | `hero` | static | none | block |
| FeaturedCollection | `featured-collection` | static | none (`rp-carousel` when `layout="carousel"`) | resource |

### 8.5 Blueprints (doc 12)

`layout` (document shell: SkipLink, AnnouncementBar, Header, `<main id="main" tabindex="-1">` (Liquid adds `data-template`, D-089), Footer, CartDrawer (omitted on the cart page), MobileNav, the search Dialog holding PredictiveSearch, toast region; NO Announcer, D-079), `home`, `collection`, `collections-list`, `product`, `search`, `cart`, `blog`, `article`, `page`, `contact`, `not-found`, `password`, `gift-card`. Each blueprint exists for all four hosts. On Liquid the blueprint files ARE the theme's `layout/*.liquid` and `templates/*.liquid`; doc 12 owns them (D-099). The `product`, `collection`, `search` and `cart` blueprints print `rp-view-event` (D-089). `password` and `gift-card` are presentational on the hydrogen backend (D-107).

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
| Added (not a component) | `rp-view-event` infrastructure element | View analytics; replaces `s-view-event` of the base theme (D-089). |
| Changed | Tabs `orientation`, Toast loading, Tooltip trigger wiring, MobileNav classes | D-012, D-083, D-082, D-017. |

---

## 9. Glossary

| Term | Meaning |
|---|---|
| Allow-list (upgrade) | The mutations a component is permitted to make when its element upgrades; everything else fails the upgrade-stability test. |
| Backend (commerce backend) | `hydrogen` or `liquid`: where cart and catalog data come from (D-001). |
| Binding | The per-host code that prints a component's contract: TSX for `react` and `remix`, block and snippet files for `liquid`, the reference file for `html`. |
| Block | A Liquid file in `blocks/` called with `{% block %}` from a template or layout; it has one `{{ content }}` outlet. |
| Blueprint | A scaffolded page or layout built from components, for one host. |
| Canonicalisation | Normalising rendered HTML (attribute order, case, whitespace, comments, host extras, masks) before comparing hosts (D-063, D-075). |
| Capability tier | The stated behaviour of a feature on a browser inside the floor that lacks it (D-081). |
| Component | A named unit of UI with one id, one contract, one CSS file and one manifest entry. |
| Composition by contract | A component printing another component's element itself, following that contract, with an added class (D-070). Contrast: embed. |
| Config element | `<script type="application/json" id="rp-commerce">`: the commerce options of a page (D-087). |
| Contract (HTML contract) | The exact DOM a component's server render must produce for its initial state (D-002). |
| Contract template | The JSON node tree in the manifest from which static bindings and fixtures are generated (D-003). |
| Dial | One of the few custom properties from which the other tokens derive (D-026). |
| Dialect (form dialect) | The set of form field names a backend's cart endpoint accepts (D-043). |
| Element | A custom element: `rp-*` (Ripple) or `ui-*` (UI SDK). |
| Embed | A component's binding calling another component; the embedded markup belongs to the other component (D-070). |
| Fixture | A named example of a component: props in, reference HTML out. |
| Host (render host) | `html`, `react`, `remix` or `liquid`: what prints the HTML (D-001). |
| Host extras | Attributes one host adds that are not part of the contract (`data-rmx-*`); removed before comparison. |
| Infrastructure element | A custom element that belongs to no component: `rp-view-event` (D-089). |
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
| Region part | The part of a component that is a region: a TSX export and a Liquid snippet `rp-<component id>-<part>` that the template wraps in `{% partial %}` (D-091). |
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
| Q15 | The `popover` attribute (Chrome 114, Safari 17.0) and exclusive `<details name>` (Chrome 120, Safari 17.2) are newer than the floor of Q13. Raise the floor to Chrome 120 / Safari 17.2, or keep it and accept that on older browsers popover panels are always-visible in-flow content and a single accordion behaves as multiple? | Keep the floor; fallbacks of D-081. | 03, 04, 10 |
| Q16 | The base theme ships 35 storefront and 22 schema locales. Ripple ships English only and writes the English text into every locale file a theme has. Are translations of the `ripple.*` keys required for V1? | English only (D-098). | 07, 14 |
| Q17 | Which model does Sidekick use, and which models are the "weak" implementer and the judge for the Sidekick bar? | Agent model `anthropic/claude-opus-4-6` (Hydrogen's harness default); weak and judge ids are `null` and the bar run refuses to start until named (D-061). | 08 |
| Q18 | Licence of the package. | Placeholder `MIT` in the generated `pkg/package.json` (D-052). | 01 |
| Q19 | Base-theme features not carried into V1: external click-to-load video, gift-card copy and tilt, View Transitions, per-variant quantity rules, sticky product column, per-kind radius selects, LCP preload. Is any of them required? | All dropped (D-107). | 12, 14 |
| Q20 | The Node-only entries (`<pkg>/check`, `<pkg>/testing`, the CLI) contain bundled copies of `parse5` and `liquidjs`. They never reach a browser and are not `dependencies`. Acceptable under your decision 3 (no runtime dependency beyond UI SDK, Tailwind, Hydrogen)? | Yes (D-052). | 01, 13 |
| Q21 | Tooltip: the trigger is the caller's own Button or IconButton, wired with one prop (`tooltip="<id>"`). The alternative is a Tooltip that owns and prints its trigger button, which removes the wiring step but stops any Button from being a trigger. Which? | The `tooltip` prop (D-082). | 09, 10 |
| Q22 | On the hydrogen backend `password` and `gift-card` have no data source, and newsletter and contact have no server operation. The blueprints are presentational there and call project-supplied `subscribe` / `send` functions. Acceptable? | Yes (D-107). | 12 |
| Q23 | The Liquid theme keeps the base theme's whole `snippets/meta-tags.liquid` (JSON-LD, `og:price`, `hreflang` links, title suffixes), which widens the Liquid subset for infrastructure snippets by seven filters. The alternative is a reduced file that stays in the old subset and loses that SEO output. Which? | Keep the base file with two locale-key renames (D-109). | 12, 13, 14 |
| Q24 | Tier 7 runs against mock.shop, whose data for menus, blogs, pages, localization and the `frontpage` collection is unverified. When mock.shop lacks one of them the test is skipped, and a skip fails the nightly run under `--no-skips`. Should that also block merges? | No: tier 7 is nightly only and never a merge gate; the nightly failure is the report (D-110 row 27). | 13 |
| Q25 | Tokens plus base CSS measure 2,174 bytes of the 2,200 byte budget (D-064). Any further base rule needs the budget raised. Raise it now? | No: keep 2,200; a change that exceeds it must amend D-064 in the same commit (D-110 row 28). | 03 |

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
15. No support below the browser floor of D-032; no IE or legacy Edge. Inside the floor, the capability tiers of D-081 apply.
16. No animation library; motion is CSS transitions with the tokens of D-029.
17. No editing of `ripple/theme` or any local clone; the base theme is reference only.
18. No Tabs `orientation="vertical"`, no toast actions, no Carousel `defaultIndex`, no Accordion height animation, no numbered Pagination in the default body, no tooltip on a link, no lightbox that opens at the clicked image (it opens at the first image), no article comments.
19. No `checkout` agent bridge action unless SPIKE-08 passes (D-050); no checker suppression comments (D-057); no in-page development overlay (D-060); no translations beyond English (D-098).
20. No theme-owned JavaScript module in the Ripple theme (D-039), and none of the base-theme features listed in D-107.

---

## 12. Document ownership

Each fact has one owning document. Other documents link to it (`NN-name.md`, section heading) and MUST NOT restate it.

| Doc | Owns | Must follow |
|---|---|---|
| `01-architecture.md` | Hosts, backends, layers of the system, data flow, package entry points, lifecycle (server render, upgrade, refresh) | D-001 to D-006, D-052 to D-054 |
| `02-html-contract.md` | Contract rules, ids, state attributes, hook attributes, prop-to-attribute mapping, responsive grammar, fixture format and masks, the canonicalisation ALGORITHM and its reference code, upgrade allow-list format. Its worked fixtures are copies of the owning component documents (D-069) | D-002, D-020, D-021, D-071 to D-076, sections 4.3, 4.4 |
| `03-styling-and-tokens.md` | Layers, tokens, dials, schemes, scales, props.css generation, component CSS rules and the CSS linter, pre-upgrade CSS, display rules, Tailwind integration, browser floor for CSS, CSS size measurement | D-024 to D-032, D-080, D-081, D-105, sections 4.5, 6.2 |
| `04-elements.md` | Runtime, `rp-*` authoring rules, non-commerce elements, UI SDK usage, lazy loading, the browser-bundle build, Invoker Commands polyfill, opener listener, `announce`, events. Its per-pattern markup is a copy of docs 09 to 12 (D-069) | D-007 to D-023, D-054, D-077 to D-083 |
| `05-commerce.md` | Adapter, `CommerceOptions`, cart store, dialects, regions and refresh strategies, commerce elements, `rp-view-event`, page views, resource types, money, images | D-041 to D-050, D-087 to D-095 |
| `06-bindings.md` | React rules, `useElement`, `useCart`, `useRegionHtml`, Remix rules, TSX conventions, Liquid tiers, rules L-1 to L-21 and the Liquid subset (L-13), schema label keys, `html` host. Its example bindings are copies of docs 09 to 11 (D-069) | D-033 to D-040, D-072, D-096, D-097 |
| `07-manifest-registry-cli.md` | Manifest schema, contract template language, generator, registry, trailers, CLI, upgrade merge. Checker: rule ids, severity, layer, detection, `fix` computation, text and JSON output format | D-003, D-056 to D-059, D-100 to D-102, section 4.8 |
| `08-agent-kit-and-evals.md` | Package docs, guides, skills, `AGENTS.md` section, agent bridge surface and actions, eval suite. Checker: the `problem` / `fix` / `why` text of every rule and the rule pages (it MUST NOT restate the output format) | D-059 to D-061, D-065, D-095, D-106 |
| `09-components-foundation.md` | The 37 components of 8.1 (contracts, fixtures, CSS), the common foundation rules, the icon path data | section 7 template, D-069, D-086 |
| `10-components-interactive.md` | The 9 components of 8.2 (contracts, fixtures, CSS, allow-lists) | section 7 template, D-069, D-082 to D-084 |
| `11-components-commerce.md` | The 26 components of 8.3, the region-part pattern, backend-scoped fixtures, commerce resource fixture values | section 7 template, D-069, D-091 to D-094 |
| `12-components-chrome-and-blueprints.md` | The 12 components of 8.4 and the 14 blueprints of 8.5 in all four hosts, INCLUDING the complete text of every Liquid `layout/*.liquid` and `templates/*.liquid` file | section 7 template, D-069, D-085, D-099, D-107 |
| `13-testing.md` | Test tiers, harnesses, the Liquid shim, `serveTheme`, resource fixtures, `size-budget.json`, CI, cross-engine, example-project contracts. It uses doc 02's canonicaliser and does not restate it | D-063, D-064, D-104 |
| `14-liquid-theme.md` | The Ripple Liquid theme's infrastructure: theme rules, file tree, `rp-head`, `rp-tokens`, import map, settings bridge, `config/`, locales, partial declaration rules, what replaces each base theme file. Layout and template bodies are doc 12's (D-099) | D-037 to D-039, D-054, D-055, D-097 to D-099 |
| `PLAN.md` | Milestones, spike schedule, definition of done per milestone | D-067, section 3 |
| `README.md` | What Ripple is, quick start per host, links | all |

---

## 13. Reconciliation decisions

These decisions were made after docs 01 to 14 were written, from the gaps, errors and conflicts their writers reported. They have the same force as section 1. Where a section 1 decision was wrong it was corrected in place and carries an `Amended:` bullet; the decisions below add what section 1 did not cover. Section 13.2 lists the outcome of every reported gap.

Evidence rule used throughout: a result that was RUN beats a source reading; a source reading beats a research report; where two writers chose differently with no evidence either way, the owning document of section 12 wins.

### 13.1 Decisions

#### D-069 The owning document wins; examples elsewhere are copies

- Decision:
  1. For a component's contract (tags, classes, parts, props, fixtures, CSS, binding code) the owning component document is normative: doc 09, 10, 11 or 12 as listed in section 8.
  2. Docs 02, 04, 06, 07, 08, 13 and 14 MAY show a component's markup, manifest entry or binding only as an illustration. Such an illustration MUST be a byte-equal copy of the owning document's fixture or code and MUST link to the section it was copied from. An illustration that differs is a defect of the copying document.
  3. Markup of an embedded component shown inside another component's fixture MUST equal the embedded component's own contract for those props.
  4. The other direction also holds: cross-cutting rules (docs 01 to 08 and 13, and this ledger) are normative for component documents. A component document that needs an exception asks for it here; it MUST NOT write one locally.
- Copies to replace now: doc 02 worked fixtures (Stack, Accordion, Tabs, ProductForm); doc 04 section 8.1 and the pattern markup of section 10; doc 06 example bindings (Button, Stack, Dialog, Tabs, ProductForm, CartLines); doc 07 worked manifest entries (Button, Dialog, ProductForm); doc 11 embedded QuantityInput markup; doc 14 layout and template bodies (D-099).
- Rationale: the writers worked in parallel and each drew the same components slightly differently; an implementer cannot tell which drawing is right.

#### D-070 Embedding and composition by contract

- Decision: There are exactly two ways for one component to use another.
  1. **Embed**: the binding CALLS the other component (TSX: renders it; Liquid: `{% render 'rp-<id>' %}`). The embedded markup belongs to the other component. Manifest: `dependencies.embeds`. Embedded markup does not count toward `kind` (D-006).
  2. **Compose by contract**: the component's own root, or one of its parts, IS another component's element (the BASE), printed by the composing binding itself, following the base contract exactly, with added classes. The base class comes first, then the added classes: `class="rp-drawer rp-cart-drawer"`, `class="rp-drawer rp-mobile-nav"`, `class="rp-button rp-add-to-cart-button"`, `class="rp-button rp-checkout-button"`, `class="rp-input rp-search-form-input"`, `class="rp-icon-button rp-cart-line-remove"`, `class="rp-badge rp-product-card-badge"`, `class="rp-dialog-title rp-visually-hidden"`. Manifest: `root.class` (or the part's `class`) holds the classes in that order, and `dependencies.components` lists the base component so that its CSS is installed. The composing component's CSS styles only its own class and MUST NOT repeat the base component's rules. The checker accepts two `rp-` classes on one element only when the manifest lists exactly that pair.
  3. No other mechanism exists: no nested `{% block %}` inside a block or snippet (D-037), no captured markup, no CSS copied from another component.
- Composition is used, for example, by: CartDrawer and MobileNav (Drawer), AddToCartButton and CheckoutButton (Button), SearchForm's input (Input), ProductGallery (Carousel and Dialog markup inside its `div` root). Doc 11 section 0 lists every composed part of the commerce components.
- Rationale: doc 12 gave MobileNav its own panel classes and CSS because "a root has one class"; doc 11 composed. Two answers to one question. Composition keeps one Drawer CSS.

#### D-071 Upgrade allow-list is data

- Decision:
  1. Component key `upgradeAllow[]` (section 4.8). An entry is an `UpgradeAllowEntry` (doc 02 section 7.2): `select`, the permitted attribute names `attrs[]`, `childList`, `text`, `subtree`, and a required `reason`. `attrs: ["*"]` is not allowed.
  2. Doc 02 owns the entry format and the judging algorithm. Global entries that apply to every page live in `GLOBAL_UPGRADE_ALLOW` in `src/testing/upgrade-diff.ts`: `aria-haspopup` and `aria-controls` on `a[data-rp-open]` (D-009).
  3. Entries fixed by this ledger: `dialog[data-default-open]` attrs `open` (D-008); Carousel `next` button attrs `disabled` (D-016); commerce error part `text` and attrs `hidden`, count part `text` and attrs `hidden` (D-045); the Toast region entry of doc 02 section 7.3 (`ui-toast-region`, `subtree: true`), kept equal to the one in doc 10.
  4. A same-value attribute write is not a mutation and has no entry (D-002). Doc 10 removes its Tabs `role` entry.
  5. React hydration is judged against a separate list, `REACT_HYDRATION_ALLOW` (`test/hydration/react-allow.ts`, content owned by doc 06): same-value `type` / `value` / `name` / `checked` writes on `<input>` and the `<textarea>` text reset.
  6. Checker rule RP601 and tier 3 read `upgradeAllow` from the manifest; neither has a second table.

#### D-072 Which bindings are generated

- Decision:

| Kind | `html` | `remix` | `liquid` | `react` |
|---|---|---|---|---|
| `static`, expressible in the template language | generated | generated | generated | generated |
| `static`, needs a loop, a derived value or backend-dependent tags | generated from fixtures | hand-written | hand-written | hand-written |
| `native`, `ui` | generated | generated | generated | hand-written below a generated header region |
| `commerce` | generated from fixtures | hand-written | hand-written | hand-written |

  - A hand-written file contains generated regions that `pnpm gen --check` verifies: TSX prop types and value arrays; Liquid `{% doc %}`, `{% schema %}` and enumeration guards.
  - The manifest `files.<host>[].generated` flag records the choice per file. Each component document states it in "Host notes".
  - The source lint `bindings-lint` of doc 06 runs on generated and hand-written files alike.
- Evidence: doc 06 (spike `ripple/docs/research/spikes/bindings/`, 100 ok); doc 11 item 1.

#### D-073 Prop-to-attribute mapping, final rules

- Decision (doc 02 section 4 owns the table; these points are fixed):
  1. An enumerated prop with an invalid value prints the DEFAULT value in every host. TSX: an inline `ALLOWED.includes(value) ? value : DEFAULT` guard on the generated `const` array. Liquid: the allow-list guard of D-038. Development builds additionally warn through `rv(value, allowed, label)`; the warning never changes output.
  2. An unset prop prints nothing. An empty string is unset. `false` for a boolean prints nothing.
  3. `as` and `level` choose the element and print no attribute.
  4. The default value of an enumerated prop IS printed (section 4.3), unless the component spec lists the attribute as "omitted at default".
  5. Responsive values: D-028 as amended.
  6. Caller attributes: D-035 item 4. A hook attribute that has a prop MUST be set through the prop (section 6.1).
- Every component with an enumerated prop that has a default has the fixture `invalid-enum-falls-back` (D-074), which is how item 1 is tested in four hosts.

#### D-074 Fixtures

- Decision (doc 02 section 11 owns the JSON Schema `fixture.schema.json`):
  1. The fixture source is the file `components/<id>/fixtures/<name>.html` plus a record in the manifest entry (`name`, `props`, `children`, `parts`, `hosts`, `mask`, `generated`). The key `html` exists only in the built `manifest.json`.
  2. `generated` is REQUIRED (`template | upgrade-snapshot | hand`). The first fixture is named `default`.
  3. Reserved fixture names and when they are required: `default` (always); `class` (always; passes two classes); `invalid-enum-falls-back` (any enumerated prop that has a default; doc 02 F-13); `responsive` (any responsive prop); `escaping` (any prop of type `string`, `id` or `url` that is printed as an attribute; it targets one such prop; for Tabs the list's `ariaLabel`; doc 02 F-15). Children are passed raw and are not an escaping target. (Narrowed by D-110 row 12.)
  4. A mask is `{ select, op, name }` with `op` one of `attr`, `drop-attr`, `srcset`, `text`, `children`, `remove`, and the selector subset of doc 02. A mask MUST NOT target a Ripple-owned attribute or class (build guard).
  5. A mask MUST match something in the reference HTML (doc 02 rule F-19), EXCEPT ops `drop-attr` and `remove`, which exist to delete platform-only markup that the reference never has.
  6. A resource prop value in a fixture is `{ "$resource": "<type>.<name>" }`. The resource set lives in `src/testing/resources.ts` (doc 13), with shapes from doc 05 and values from the owning component document. Doc 13 MUST supply at least `image.basic`, `image.no-alt` and every resource doc 11 section 0 and doc 12 section 1 name.
  7. Backend-scoped fixtures: where the form dialect forces different tags per backend, a state has two fixtures: `<name>` with `hosts: ["html", "react", "remix"]` and `liquid-<name>` with `hosts: ["liquid"]`. Used by CartLines, CartLine, CartSummary, CartNote, CheckoutButton, CartDrawer and DiscountCode. No other component may scope a fixture by host to hide a difference. One further exception (D-110 row 13): Select has `sort` (`hosts: ["html", "remix", "liquid"]`) and `sort-react` (`hosts: ["react"]`), because React needs `defaultValue` where the others print `selected` (D-086).
  8. Fixture lint check `pe-2` of doc 02 is skipped on the root element of Button and IconButton fixtures.
  9. The `html` host reference file: D-040 as amended.

#### D-075 Canonicalisation

- Decision: Doc 02 section 12 owns the algorithm (11 steps), the selector subset and the reference code, which is the file `src/testing/canonicalize.ts`. Doc 13 owns the harnesses and MUST NOT restate the algorithm. Whitespace: adjacent text nodes merge; whitespace runs collapse to one space; text is trimmed; empty text nodes are dropped; `pre`, `textarea`, `script` and `style` content is verbatim. Inter-element whitespace is not compared; a contract MUST NOT depend on it. Host extras removed: `data-rmx-*`, React comment nodes, and (SPIKE-02 fallback) the platform wrapper.

#### D-076 Hook attributes, `data-slot` and part names

- Decision: Section 4.4 was rewritten and is complete. `data-slot` on a `ui-*` family is the value UI SDK writes, not the tag name. Shared part names gained `remove` and `trigger`. `data-rp-close` exists only on the SPIKE-05 fallback path. Three test-harness attributes are listed so that RP118 can tell them from typos; they never ship.

#### D-077 Build of the browser files and of `dist/`

- Decision: D-054 items 5 and 8 hold the facts. Additional rules for doc 01: the import rule for `src/gen/**` allows `rollup`, `@rollup/plugin-node-resolve` and `@rollup/plugin-terser`; `src/remix/**` may contain the type-only import `import type {} from "remix/component"`; `src/check/**` MUST NOT import `src/cli/**` (shared types live in `src/types.ts`). The build script is `src/gen/build.ts`. Tests A-07 and A-08 of doc 01 (one kernel copy; chunk import direction) are the gate.

#### D-078 Runtime globals and the polyfill

- Decision: The runtime owns exactly two globals. `window.rpRuntime` (boolean) makes the runtime start idempotent when two copies load. `window.rpCommandsPolyfill` (boolean) lets the inline Liquid copy and the module copy of the polyfill coordinate: the first to run installs the listener, the other does nothing. The polyfill dispatches a `command` event (with `command` and `source`) on the target, as the native feature does. No other global may be added. Doc 14 embeds the inline script byte for byte from the generator output.
- Evidence: doc 04 sections 3.1 and 3.3 (run in Chromium with native support hidden).

#### D-079 Announcements

- Decision:
  1. Elements announce through `announce(text, { from })` from `src/runtime/announcer.ts`. When `from` is inside an open modal `<dialog>`, the text is written to the first `[data-rp-part="status"]` element inside that dialog; otherwise it goes to the UI SDK page-level region. `<pkg>/elements` and both main browser files export `announce`.
  2. The Announcer component prints `<div class="rp-announcer" role="status" data-rp-part="status">` and MUST be placed inside a `<dialog>` or an `rp-*` root. The `layout` blueprint prints NO Announcer: page-level regions are created by the runtime.
  3. CartLines, CartSummary, CartNote and DiscountCode each always print one status part, because each can be placed inside the modal CartDrawer.
  4. Toast is never used for feedback raised while a modal dialog is open (D-008 item 7).

#### D-080 Display of custom elements

- Decision:
  1. Every `rp-*` tag has `display: block` in the generated display region of `base.css`. `rp-dialog` additionally has `position: absolute; inline-size: 0; block-size: 0`. `rp-view-event` is `display: block`.
  2. `ui-*` tags keep the display value UI SDK gives them (doc 07 `src/gen/elements.json`).
  3. Component CSS MUST NOT set `display: contents` or `display: none` on a custom element root (CSS linter, doc 03). A wrapper such as `rp-live` or `rp-product-form` is a block box; where a component needs its children laid out by an outer grid, the component root is the grid item.
  4. The value is data: manifest key `elements.<tag>.display`.
- Rationale: doc 03 gave `rp-dialog`, `rp-live` and `rp-product-form` `display: contents`. The agent bridge skips a root that has no box (run, doc 04 L-4), and `intersect` triggers need a box.
- Affects: docs 03 (4.1, 4.3), 05, 07 (`elements.json`), 11 (`.rp-live-form`, ProductForm root).

#### D-081 Capability tiers inside the browser floor

- Decision: The floor of D-032 is kept. A feature that is newer than the floor has a stated behaviour on floor browsers. Doc 01 section 10 owns the table; these rows are fixed:

| Feature | Below its first version |
|---|---|
| Invoker Commands | Polyfilled (D-008). |
| `popover` attribute (Chrome 114, Safari 17.0, Firefox 125; from compatibility tables, UNVERIFIED) | The panel is ordinary in-flow content, always visible. The opener button is present and does nothing. `rp-navigation-menu` does nothing. No polyfill. |
| Exclusive `<details name>` (Chrome 120, Safari 17.2; UNVERIFIED) | An Accordion with `type="single"` behaves as `multiple`. |
| CSS anchor positioning | Popover uses the user-agent position (D-010). |
| `@media (scripting: none)` | Tabs without JS shows only the default panel (D-012). |
| `closedby` | `rp-dialog` backdrop-click fallback (D-008). |
| `AbortSignal.any`, `crypto.randomUUID` | The commerce runtime does not start; forms post natively (D-032). |
| Navigation API | `rp-dialog` does not close on navigation (D-008). |

  - Tests for a feature above the floor MUST feature-detect and skip, not fail, on an engine without it.
  - Amended (closing pass): further rows, owned by doc 03 section 12 (all version numbers UNVERIFIED, SPIKE-06): `:dir(rtl)` (the rule is dropped; the left-to-right form stays); `:has()` (the one `header.css` rule is dropped; `scroll-padding` stays `0px`); unprefixed `mask-image` and `::backdrop` custom-property inheritance (fallbacks in docs 09 and 10); exclusive `<details name>` also on Firefox below 130 (behaves as `multiple`).
  - Raising the floor instead is Ben's choice (Q15).

#### D-082 Tooltip

- Decision (doc 10 owns the contract):
  1. The trigger is the caller's Button or IconButton. It is wired by ONE prop on that button: `tooltip="<tooltip id>"`, which prints `aria-describedby="<tooltip id>-content"` and `data-slot="tooltip-trigger"`. Doc 09 adds the prop to Button and IconButton. Passing those two attributes through rest props or `attributes` is prohibited.
  2. A link (`<a href>`, or a Button with `href`) MUST NOT be a tooltip trigger: UI SDK writes `type="button"` on it (measured, doc 10).
  3. `side` and `align` are printed as UI SDK option attributes and omitted at the default (section 4.3).
  4. The trigger MUST have its own accessible name (D-013).
  5. Tooltip's manifest `rules[]` has `tooltip-needs-trigger`: a `ui-tooltip` MUST contain an element with `data-slot="tooltip-trigger"`.
- Rationale: doc 10 required two hand-written attributes on the button; weak models forget hand wiring. A prop is checkable (RP101, RP104) and documented.
- Alternative for Ben: a Tooltip that prints its own trigger button (Q21).

#### D-083 Toast

- Decision (doc 10 owns the contract):
  1. One region per page, printed by the `layout` blueprint: `ui-toast-region` with root class `rp-toast`. Toast items are created by UI SDK and carry no Ripple class; CSS reaches them with `.rp-toast :where(...)` selectors.
  2. `toast(message, options?)` returns `Promise<void>`. Options: `id`, `description`, `type`, `duration`, `priority`. Toast actions are not supported in V1.
  3. The `toast` chunk (and `shared`) is imported on the first `toast()` call. A `ui-toast-region` in the document does not trigger a load, so the loader MUST NOT register the toast chunk by tag.
  4. `toast` is exported by `<pkg>/elements`, `ripple.js` and `ripple.elements.js` (Liquid: specifier `ripple`). A binding file MUST NOT re-export `toast` and MUST NOT import `<pkg>/elements`; the Toast binding prints the region and nothing else.
- Evidence: doc 04 L-5 (19.5 kB gzip per page under the old rule), doc 10 Toast spec.

#### D-084 Interactive components: settled points

Doc 10 is normative. Points that other documents must follow:

| Component | Settled |
|---|---|
| Dialog, Drawer | Parts `panel`, `header`, `title`, `description`, `body`, `footer`. No `describedBy`. Closers are Buttons with `commandFor` + `command="close"`; there is no `DialogClose` part. Manifest rule `dialog-needs-title`. |
| Popover | D-010 as amended. |
| Tooltip | D-082. |
| Toast | D-083. |
| Tabs | D-012 as amended: horizontal only; parts receive `tabs`, `value`, `selected`. |
| Accordion | D-011 as amended. |
| Carousel | D-016 as amended. |
| QuantityInput | D-015 as amended. |

#### D-085 Chrome components: settled points

Doc 12 is normative. Points that other documents must follow, and points doc 12 must change:

| Component | Settled |
|---|---|
| Header | Kind `static`; `default` fixture passes children. Prop names for the overlays it opens follow the root-named rule of D-020: `mobileNav`, `searchDialog`, `cartDrawer` (ids). A sticky Header sets `--rp-header-block-size` on `:root` scope so that `scroll-padding` works (D-105). |
| Footer, FeaturedCollection | Kind `static`; `default` fixture passes children. |
| NavigationMenu | Panel ids `<id>-item-<n>`. |
| MobileNav | Composes Drawer (D-070); no panel CSS of its own. |
| LinkList | Liquid-only param `links` (for `shop.policies`). |
| LocaleSelector | `id` REQUIRED; tier `resource`; ignores `content`. |
| NewsletterForm | `id` REQUIRED; prop `status`: `idle success error`. |
| All | Strings through locale keys and the `strings` prop (D-066). A root printed by `{% form %}` takes only `id` and `class`. |

#### D-086 Foundation components: settled points

Doc 09 is normative. Points that other documents must follow, and points doc 09 must add:

| Component | Settled |
|---|---|
| Stack, Inline, Grid | All take `gap`, `gapX`, `gapY`; Stack takes `textAlign`. `role="list"` is printed when `as` is `ul` or `ol`. |
| Container | A full-width band: `padding-inline: max(gutter, (100% - max) / 2)`; `px` and `p` replace the gutter. |
| Link | `variant`: `inline plain`; `current`; `dialog` (D-009). |
| Button, IconButton | ADD props `dialog` (only with `href`; D-009), `tooltip` (D-082), `formId`. IconButton requires `icon`. |
| Input, Textarea, Select | ADD props `rpField` and `formId`. Input `type`, `autoComplete`, `pattern`; Textarea `rows`, `defaultValue` as text content; Select `defaultValue` (React). |
| Image | D-049 as amended. |
| Video | `poster`, `autoplay` (prints `autoplay muted loop`); `controls`, `playsinline`, `preload="metadata"` always printed. |
| Field, RadioGroup, Checkbox, Switch | D-014 as amended. |
| FormMessage, Banner | `role` from `tone` (D-066). Badge and Banner `variant`: `solid soft outline`. |
| Rating | `value` in half steps printed as `data-value`, default `0`; `ariaLabel` REQUIRED. |
| Pagination | Default body: previous and next links from URL props; in an override body the current page is `span.rp-pagination-current`. `previousLabel`, `nextLabel`. |
| Breadcrumb | The current item is a link with `aria-current="page"`. |
| SkipLink | `href` defaults to `#main`; the layout's `<main>` has `id="main"`. |
| Skeleton, Spinner, EmptyState, Progress | Skeleton `ratio`, `radius`; Spinner `size`, `ariaLabel`; EmptyState `icon`; Progress a tone subset. |
| Announcer | D-079. |
| Icon | D-068 as amended. |
| Spinner, Announcer, Breadcrumb, Pagination rules | Manifest `rules[]` with kebab-case ids; `RP120` is removed (D-059). |

#### D-087 Commerce options and the config element

- Decision (doc 05 owns the `CommerceOptions` type):
  1. Options: `host`, `cartEndpoint`, `cartUrl`, `cartAddUrl`, `cartDrawer` (default `"cart-drawer"`), `initialCart`, `analytics` (default `true`), `consent`, `strings`, `navigate`, `reloadFrames`.
  2. They arrive through `configureCommerce(options)` or through the config element `<script type="application/json" id="rp-commerce">`, which carries the JSON-serialisable options. The runtime starts lazily one microtask after the commerce module (`ripple.js`, or `<pkg>/commerce`) is evaluated, so that a `configureCommerce` call in the same task still applies; after start only `navigate`, `reloadFrames` and `strings` may change. (Amended by the closing pass: the text said "after the first element connects"; the spike and doc 05 section 4.5 start after module evaluation. The observable rule is unchanged: options are read once, before any commerce element upgrades.)
  3. Placement of the config element: Liquid: inside `snippets/rp-head.liquid` (D-054 item 7), NOT in the layout file. hydrogen backend: in `<head>` before the module script, printed by the `layout` blueprint. Checker RP309 reports commerce elements on a page with no config element and no `configureCommerce` call.
  4. `strings` carries the texts JavaScript announces. It has exactly seven keys, each sourced from one locale key: `added` (`ripple.product-form.added`), `updated` (`ripple.cart-lines.updated`), `removed` (`ripple.cart-lines.removed`), `discountApplied` (`ripple.discount-code.applied`), `discountRemoved` (`ripple.discount-code.removed`), `noteSaved` (`ripple.cart-note.saved`), `error` (`ripple.cart-lines.error`). Source: `locales/en.default.json`. Liquid prints them into the config element with `| t`; TSX hosts pass them or rely on the English defaults built into the adapter.
  5. The CartDrawer `<dialog>` id MUST equal `cartDrawer`; every blueprint uses `cart-drawer`.

#### D-088 Hydrogen wiring on both backends

- Decision:
  1. hydrogen backend, server: D-041 item 1 as corrected.
  2. hydrogen backend, document: every page prints the Hydrogen script tags (`renderShopifyScriptTags`) in `<head>` before the `ripple.js` module script. Liquid: the platform provides `window.Shopify.actions`; Ripple prints nothing for it.
  3. Start failure: when the runtime cannot start synchronously, `usable` is `false`, no commerce element is defined, and forms post natively. When the first cart read fails after elements are defined, controllers submit natively through the hidden fallback button (D-041).
  4. Caching: D-041 as amended.
  5. Consent and cart analytics: doc 05 section 12.
- Evidence: doc 05 (18 Chromium scenarios against `@shopify/hydrogen@2026.10.3` with an emulated Standard Actions runtime; real runtime UNVERIFIED, SPIKE-01).

#### D-089 `rp-view-event` and page views

- Decision:
  1. `rp-view-event` is an infrastructure element: it belongs to no component, has no class and no `data-slot`, is not built on the kernel, and is listed in the manifest key `elements`. The component count stays 84. The closed tag lists of docs 02 and 04, and the JSX intrinsic types of doc 06, include it.
  2. It is printed ONLY by blueprints: `product` (product viewed), `collection`, `search` (only when terms exist) and `cart`. No component prints it (not ProductForm, not CartDrawer).
  3. Markup, the same shape in every host for the same view. Product, collection and search views use the attribute form: `<rp-view-event view-event-trigger="connect" view-event-payload="..."></rp-view-event>`. The cart view uses the child form, because the payload is large: `<rp-view-event view-event-trigger="connect"><script type="application/json" data-view-event-payload>...</script></rp-view-event>`. Fixtures mask the payload.
  4. Payload. Liquid: ALWAYS the output of the `standard_event_data` filter, as the base theme prints it (`{{ product | standard_event_data: 'view', context: 'page' | escape }}` in the attribute form; unescaped in the child script). Hand-built JSON on Liquid is prohibited. hydrogen backend: the JSON `{ "event": ..., "payload": ... }` of doc 05 section 12.
  5. Definition: hydrogen backend in `adapter-hydrogen.ts`; Liquid `customElements.define("rp-view-event", createViewEventElement())` from `@shopify/standard-events` in `adapter-liquid.ts`.
  6. Page view on Liquid: the Liquid adapter dispatches one `PageViewEvent` (from `@shopify/standard-events`) per document load when `options.analytics` is true, with `page: { template, title, url }`; `template` is read from `main[data-template]`, which the layout prints from `request.page_type`. This is a port of `ripple/theme/assets/page-view-event.js`. The theme contains no page-view asset. hydrogen backend: `initializeShopifyScripts` publishes it (doc 05).
  7. Not in V1: per-card impression events (`view-event-trigger="intersect"` around each product card) and the cart view inside the CartDrawer.
- Evidence: `ripple/theme/templates/product.liquid`, `ripple/theme/templates/collection.liquid`, `ripple/theme/templates/cart.liquid` (both forms, `standard_event_data`); `ripple/theme/assets/page-view-event.js`, `ripple/theme/assets/page-view-event-init.js`. UNVERIFIED: that `createViewEventElement()` accepts the same markup under the tag name `rp-view-event`, and whether the platform also publishes a page view (SPIKE-01).
- Rejected: doc 05's "published by the platform" for Liquid page views (contradicted by the base theme); doc 14's theme-owned `assets/page-view.js` (D-039); hand-built JSON payloads in doc 12's Liquid blueprints (UNVERIFIED against the platform element).

#### D-090 Refresh reasons and strategies

- Decision:
  1. `reason` is one of `cart`, `variant`, `filter`, `predictive`, `recommendations`, `manual`. `rp-live` uses `history.replaceState` for `variant` and `pushState` for `filter`.
  2. Strategy per host:

| Host | No `url` (reason `cart`, `manual`) | `variant`, `filter` | `predictive`, `recommendations` |
|---|---|---|---|
| `liquid` | `partials.fetch` / `apply` for the named partials; on failure `location.reload()` | the same with `url`; on failure `location.assign(url)` | the same with `url`; on failure nothing |
| `html` | fetch the current URL and replace each `[data-rp-region]`; on failure `location.reload()` | fetch `url` and replace; on failure `location.assign(url)` | fetch `url` and replace; on failure nothing |
| `remix` | `reloadFrames(regions, null)` when that option is configured; otherwise the `html` strategy | `navigate(url, { replace })` when that option is configured; otherwise the `html` strategy | the `html` strategy; on failure nothing |
| `react` | nothing: React renders cart regions from the store | `navigate(url, { replace })` when configured; otherwise `location.assign(url)` | fetch `url`, take the inner HTML of the same-named region, publish it to `useRegionHtml(name)`; on failure nothing |

  3. `predictive` and `recommendations` never fall back to navigation.
  4. `useRegionHtml(name)` (from `<pkg>/react`) returns `null` on the server, during hydration and until the first publish; then the HTML string. The React region part renders its server children while the value is `null` and `dangerouslySetInnerHTML` afterwards. UNVERIFIED (SPIKE-10); fallback: the app cancels `rp:refresh` for those reasons and renders results itself.
  5. On Remix, a region is a plain element with `data-rp-region`. `reloadFrames` and `navigate` are opt-in (SPIKE-11). No blueprint uses a `<Frame>`.
- Rationale: one default that is the same markup in `html`, `remix` and `react`; the Frame path was never run (doc 05).

#### D-091 Region parts, blueprint-owned regions, one declaration per page

- Decision:
  1. A component whose content is refreshed exposes a **region part**: a TSX export `<Component><Part>` and a Liquid snippet `rp-<component id>-<part>`. On Liquid the TEMPLATE writes `{% partial '<region>' %}` around the rendered snippet inside the component's block body. Doc 11 section 0 owns the exact pattern.

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

  2. A blueprint-owned region is a layout component that receives `data-rp-region="<name>"` through rest props (TSX) or `attributes: 'data-rp-region="<name>"'` (Liquid). `data-rp-region` is the only Ripple hook attribute that may be passed this way.
  3. The snippet name pattern `rp-<component id>-region` assumed by doc 12 does not exist.
  4. A region-part snippet is rendered with the same params everywhere it is rendered (the partial re-render uses the same call).
  5. A region name is declared at most once per rendered page. Therefore the `layout` blueprint omits CartDrawer on the cart page in EVERY host (TSX layout prop `cartPage`; Liquid `template.name == 'cart'`), the CartLink there has no `drawer`, and `openCart()` navigates to `cartUrl`.
  6. Roots printed by Liquid `{% form %}` accept only `id` and `class`.

#### D-092 The Liquid cart form and cart parts

- Decision:
  1. On Liquid the cart is ONE `<form>` printed by CartLines, with id `<cart lines id>-form`. CartNote, cart attribute inputs and CheckoutButton join it with the native `form` attribute; they receive the CartLines id through the param `cart_lines`.
  2. The form's FIRST submit button is the Update button, `data-rp-part="submit" data-rp-js="fallback"`, so that Enter in a quantity field updates the cart without JS.
  3. The Liquid DiscountCode form carries `data-rp-js="inflow"` on the `<form>` and a `name="intent"` submitter; it is JS-only (D-043).
  4. Applied discount codes on Liquid are read from `cart.cart_level_discount_applications` filtered by `type == 'discount_code'`; the type value is UNVERIFIED (SPIKE-02).
  5. hydrogen backend forms: D-043 and D-044 as amended.
  6. Error, status and count parts: D-045 as amended.

#### D-093 Commerce components: settled points

Doc 11 is normative. Points that other documents must follow, and points doc 11 must change:

| Point | Settled |
|---|---|
| Call forms | The props and params of doc 11 are the API. Doc 12's "assumed signatures" (its section 2.4) are replaced by them. |
| ProductForm | No `data-rp-refresh` on the root; the submit button carries the dialect attributes; locale keys and default body as in doc 11 (which follows doc 05). Docs 06 and 07 copy it. |
| VariantPicker | Links with `aria-current`. ADD manifest rule `variant-picker-outside-form` (kind `forbids-ancestor`, target `rp-product-form`). |
| ProductGallery | Root `div`; the lightbox opens at the first image (V1 limit); its opener is a D-009 link with the image URL as fallback `href`. |
| CheckoutButton | D-050 as amended. |
| SearchForm | Liquid param `default_value` for TSX `defaultValue` (mechanical mapping; `value` is removed). |
| LiveForm, ProductForm | Root is a block box; `.rp-live-form { display: contents }` is removed (D-080). |
| Embedded QuantityInput | Markup equals doc 10's (Icons, `data-rp-field="quantity"`). |
| Helpers | `toRippleCart` and similar pure functions live in `<id>.data.ts`, not in a `"use client"` file (D-094). |
| PredictiveSearch on React | D-090 item 4. |
| Fixtures | D-074 item 7 naming. |
| Kinds | Section 8.3 (CartLine `static`, CartDrawer `commerce`, DiscountCode `noJs.level: degraded`). |

#### D-094 Resource types, data helpers, Hydrogen imports

- Decision:
  1. `<pkg>` exports the resource types: `RippleProduct`, `RippleVariant`, `RippleLine`, `RippleCart`, `RippleImage`, `RippleMoney`, `RippleCollection`, `RippleArticle`, `RippleMenu`, `RippleShop`. Doc 05 section 11 defines each with its Liquid drop mapping. Doc 05 also becomes the one place that DEFINES every other `Ripple*` data type that docs 11 and 12 use today without a shared definition: `RippleMedia`, `RippleFilter`, `RippleFilterValue`, `RippleProductCard`, `RippleProductDetail`, `RippleCollectionCard`, `RippleArticleCard`, `RippleMenuItem`, and the option, chip and sort-option shapes of VariantPicker, FilterChips and SortSelect. The field lists come from docs 11 and 12; a type name is defined once, in doc 05, and exported from `<pkg>`. Blueprint page-data types (`RippleLayout`, `RippleHome`, ...) are local to the blueprints' `types.ts` and are not exported.
  2. Pure functions that map Storefront API objects to these types (`toRippleCart`, `toRippleMenu`, ...) are scaffolded code in `<id>.data.ts` next to the binding (file key `data`, type `data`). A file that starts with `"use client"` exports components only: a server module that imports a function from a client module gets a reference, not the function.
  3. TSX bindings and `.data.ts` files MAY value-import from `@shopify/hydrogen` exactly these pure functions: `formatMoney`, `renderShopPayButton`, `buildProductSelectionSearchParams`, `parseCollectionParams`, `serializeCollectionParams`, `isFilterInputActive`, `getFilterRemovalUrl`. Every other use of Hydrogen stays behind the adapter (D-042). The checker rule and the architecture test that guard Hydrogen imports use this list.
  4. `locale` (a BCP 47 string, for `formatMoney`) and `strings` are ordinary props of the TSX commerce components.
- Evidence: the seven names are exported by `hydrogen/packages/hydrogen/src/core/index.ts` (read).

#### D-095 Agent surface: settled points

- Decision: Doc 08 section 7 owns the list of commerce `agent.actions` per element; docs 05 and 11 adopt it verbatim, including `api.lines()` on `rp-cart`. No `checkout` action (D-050). `rp-dialog`, `rp-quantity` and `rp-navigation-menu` roots get no label; doc 08's recommendation of `role="group"` plus a required `ariaLabel` on commerce roots is NOT applied in V1; RP607 is narrowed to roots that declare actions. `data-agent-confirm` is REQUIRED on CheckoutButton.

#### D-096 TSX bindings: settled points

- Decision:
  1. `<pkg>/react` exports `useElement`, `useCart`, `useRegionHtml` and types; `<pkg>/remix` exports types only. Both export `RestProps`.
  2. `src/react/jsx.generated.ts` and `src/remix/jsx.generated.ts` declare the intrinsic elements (`rp-*`, `ui-*`, `rp-view-event` with `view-event-trigger` and `view-event-payload`) and the `commandfor` / `command` augmentation.
  3. A binding file prints markup. It imports only: `react` (React host), `<pkg>` (helpers, types), `<pkg>/react` (hooks), sibling bindings (`./<id>`, Remix `./<id>.tsx`), its own `./<id>.data`, and the D-094 Hydrogen functions. It MUST NOT import `<pkg>/elements` or `<pkg>/commerce`, and MUST NOT re-export library functions.
  4. Blueprint TSX source files import each component from the specifier `@components/<id>`. At install the CLI rewrites it to the relative path from the installed file to `<paths.components>/<id>` (Remix: with `.tsx`). Blueprints MUST NOT import components from `<pkg>/react` or `<pkg>/remix`: components are scaffolded files, not package exports.
  5. Per-host conformance work directories are `examples/<host>/.ripple-conformance/` (git-ignored).
  6. Controlled props: D-036.

#### D-097 The Ripple Liquid subset, in three scopes

- Decision: Doc 06 rule L-13 owns the lists and is rewritten as three scopes. The local shim (doc 13) implements the union. A file that uses a tag or filter outside its scope is a checker error (layer S).

| Scope | Files | Tags | Filters and objects |
|---|---|---|---|
| Component | `blocks/*.liquid`, `snippets/rp-<id>*.liquid` of components | `doc schema liquid assign if unless elsif else case when for capture render form comment echo` | `escape split t default append prepend strip plus minus times size money image_url json divided_by modulo round remove date url_encode payment_button`; objects `content_for_additional_checkout_buttons`, `additional_checkout_buttons` |
| Blueprint | `layout/*.liquid`, `templates/*.liquid` | the component tags plus `block partial paginate layout` | the component filters plus `standard_event_data asset_url stylesheet_tag`; the globals doc 12 lists (rule L-D) |
| Infrastructure | `rp-head`, `rp-tokens`, `rp-import-map-entries`, `rp-icon`, and the theme-owned `import-map` and `meta-tags` snippets | the component tags | the component filters plus `asset_url stylesheet_tag font_face first join remove_first slice strip_html money_without_currency structured_data`, and the font object members doc 14 section 6 uses |

  - `{% capture %}` is in the subset only for building attribute strings and for the named slot params of D-037; never to pass markup between files. A file MAY also capture markup it renders ITSELF (an Icon, an Icon plus text) into a variable and pass it as the `content` argument of an embedded component's snippet in the same file (`{% render 'rp-button', content: opener_content %}`), or print that variable more than once: that is how a snippet embeds a component whose content is not plain text (LocaleSelector's opener, MobileNav's chevron; D-110). What stays prohibited is a capture in a template or layout that is passed to a block as a slot.
  - `as` as a param name: D-038 item (d).
  - Amended: (a) The Blueprint scope gained `asset_url` and `stylesheet_tag`: D-099 item 3 requires the `{{ 'styles.min.css' | asset_url | stylesheet_tag }}` line in both layout files and the scope did not allow it. (b) The Infrastructure scope gained `first join remove_first slice strip_html money_without_currency structured_data`: these are exactly the filters that `theme/snippets/meta-tags.liquid` uses beyond the old list, and `snippets/meta-tags.liquid` is that file (D-109), so that SEO markup (JSON-LD, `og:price`, `hreflang`) does not regress against the base theme. No component or blueprint file may use them. The shim implements them (doc 13).

#### D-098 Liquid theme settings, fonts and locales

- Decision (doc 14 section 6 owns `config/settings_schema.json` and `rp-tokens`):
  1. Range settings are integers divided in `rp-tokens`: `rp_radius` 0 to 24, unit px, default 8; `rp_density` 75 to 125, percent, default 100; `rp_text_scale` 113 to 133, hundredths, default 120.
  2. Font settings `rp_font_body` and `rp_font_heading` default to `system_ui_n4`. When the chosen font's `system?` is true, `rp-tokens` prints NO font dial and no `font_face`, so `tokens.css` supplies its system stack. The default Liquid look therefore equals the other hosts.
  3. A theme may have only one `color_palette` setting. When the theme already has one with another id, the CLI settings patch writes the Ripple group WITHOUT `rp_palette` and prints a note (doc 14 section 6.2 rule 4; doc 07 implements it).
  4. Ripple ships English strings only. The locale patch writes the English text under key `ripple` into every locale file the theme has, never changes an existing value, and `remove` keeps keys (Q16).
- Evidence: Shopify theme docs, `font_picker` setting (default handle `system_ui_n4`) and the `font` object's `system?` member, read through the Shopify docs tool. Doc 14's `inter_n4` made the Liquid default differ from the other hosts.

#### D-099 Liquid layout and templates are blueprint files; doc 12 owns them

- Decision:
  1. Every `layout/*.liquid` and `templates/*.liquid` file of the Ripple theme is the Liquid file of a blueprint of section 8.5. Doc 12 owns their complete text. `examples/liquid/` is those files plus the registry files, installed.
  2. Doc 14 owns the theme's infrastructure: theme rules, file tree, `snippets/rp-head.liquid`, `snippets/rp-tokens.liquid`, `snippets/rp-import-map-entries.liquid`, the theme-owned `snippets/import-map.liquid` and `snippets/meta-tags.liquid` (which are files of the `layout` blueprint's Liquid list, keys `import-map` and `meta-tags`), settings, `config/`, locales, the partial declaration rules, and the base-theme replacement map. Doc 14 MUST NOT print a second version of a layout or template; where it needs an excerpt it copies from doc 12 (D-069).
  3. Constraints doc 12's `layout/theme.liquid` MUST satisfy: the import map is printed before `{% render 'rp-head' %}`; `rp-head` is before the `styles.min.css` stylesheet tag and before `{{ content_for_header }}`; `<main id="main" tabindex="-1" data-template="{{ request.page_type }}">` (`tabindex="-1"` makes the SkipLink target focusable in every host; `data-template` is Liquid-only and blueprint comparison compares the children of `<main>`, D-110); the body is the 8.5 list (SkipLink, AnnouncementBar, Header with its default body, main, Footer, CartDrawer unless the cart template, MobileNav, search Dialog with PredictiveSearch, Toast region); no Announcer; strings from `ripple.blueprints.layout.*` keys (the announcement text is `ripple.blueprints.layout.announcement`); overlay openers through the `dialog` prop.
  4. `rp-head` prints exactly what D-054 item 7 lists. It does not print the title, meta tags, the import map or `{{ content_for_header }}`.
- Rationale: docs 12 and 14 each wrote a complete, different `layout/theme.liquid` (one composes the header by hand, omits AnnouncementBar, prints an Announcer block and uses `theme.*` keys).

#### D-100 Manifest keys

- Decision: Section 4.8 is the complete key list. Additions made by the reconciliation: top-level `elements`; component `upgradeAllow`, `deprecated`; `files.<host>[].key`; file type `data`; `state[].on`, `state[].writer`, `state[].defaultProp`, `state[].property`, `state[].reflects`; `parts[].props`, `parts[].content`, `parts[].template`; `rules[].id`, `rules[].kind` (six kinds), `rules[].count`; `agent.actions[].confirm`; `a11y.name`; fixture `mask[]` entries. Doc 07 adds `writer` to `stateEntry` (doc 06 needs it for `data-rmx-preserve-attrs`).

#### D-101 Registry and CLI: settled points

- Decision:
  1. `ripple.json` `paths`: `components`, `styles`, `public` (default `public/ripple`), `pages` (default `app/pages` on `remix`, `src/pages` on `react`, `pages` on `html`). Target aliases: `@components/`, `@styles/`, `@public/`, `@pages/`. Blueprint files target `@pages/`.
  2. Install transforms, applied before hashing and re-applied to the merge base: Liquid block prefix; package name (`__PKG__`); component import specifiers (`@components/<id>`, D-096).
  3. Liquid assets copied: the six files of D-054 item 3. Import-map entries: six. `ripple.elements.js` and its chunks are never scaffolded by the CLI; a project without commerce links them from `node_modules/<pkg>/browser/` or copies them by hand. `ripple-agent.js` is always copied.
  4. The `html` blueprint files are generated by a `pnpm gen` step from the blueprint's fixtures (doc 12 rules H-1 and H-2; doc 07 adds the step).
  5. Settings patch: D-098. Locale patch: D-098.
  6. Release: `status: beta` components are not protected by semver; `deprecated` marks a component for removal; `pnpm release:check` runs the checklist of doc 07 section 11; a published version is never unpublished.
  7. `ripple docs`: D-057.

#### D-102 Checker: settled points

- Decision:
  1. Ids: the 55 of D-059. Doc 08's table gains RP308, RP309, RP507, RP508 and its "51" becomes 55.
  2. Output format (doc 07 section 9.4): first line `<RULE> <severity>  <location>  <component>: <problem>`, with `<component>: ` omitted when the finding has no component; then `found`, `allowed`, `fix`, `why`, `docs` lines; `docs` is `<command form> docs <RULE>` (command form: doc 07 section 7.1 rule 12). Doc 08 deletes its restatement.
  3. Component-specific structure rules are manifest `rules[]` and are reported by RP113 with the rule id in brackets.
  4. RP308: `data-rp-refresh` names a region that is not on the page (every host, warning); the containment check (a root inside the region it refreshes) applies only to `rp-cart`; a `<dialog>` that is, or is inside, a region (D-046 item 5); two regions with the same name on one page (D-091 item 5).
  5. RP309: commerce elements without commerce configuration (D-087). RP502: file state `outdated`. RP507: more than one Ripple runtime on a page. RP508: `props.css` or `theme.css` older than `tokens.css`. RP607: narrowed (D-095). RP609 includes doc 03's gamut warning.
  6. The rule that guards `@shopify/hydrogen` value imports allows the D-094 list. It is RP117 case (b) (warning); RP117 case (c) reports `<pkg>/elements` or `<pkg>/commerce` imported by a binding file (D-096). The Liquid subset rule of D-097 is RP401 case (b), applied to files that carry a Ripple trailer. RP320 is data-driven from `agent.confirm[]`: the CheckoutButton control and the two accelerated-checkout wrappers `div.rp-product-form-accelerated` and `div.rp-cart-summary-accelerated` (docs 08 section 7.3 and 11). No new rule id was needed (closing pass).
  7. `check()` takes `host` and an optional computed lock from the CLI command; `src/check` does not import `src/cli`.
  8. No suppression mechanism.

#### D-103 Repository, package and versions

- Decision:
  1. One package, no pnpm workspace; the root `package.json` is private; `pkg/package.json` is generated.
  2. Root scripts include `gen`, `build`, `test`, `eval`, `release:check`. `release:check` is `pnpm gen --release-check`: `src/gen/index.ts` runs the checklist of doc 07 section 11 on that flag (D-110).
  3. Pinned devDependencies added to doc 01's table: `rollup` 4.24.0, `@rollup/plugin-node-resolve` 15.3.0, `@rollup/plugin-terser` 0.4.4, `lightningcss` 1.33.0, `axe-core` 4.14.1, `@types/node` 22.20.5, `@types/react` 19.3.0.
  4. Node: repository `>=22.18`; the main CI job runs Node 24; Remix tests skip below 24.3; a separate job runs Node 22.18; a job installs the packed package on Node 20.18.
  5. Doc 01 test A-01 (closed root file list) includes `.github/` and `CHANGELOG.md`.
  6. `pkg/` additionally contains `fixture.schema.json` and `registry/liquid/settings.json`.

#### D-104 Testing: settled points

- Decision (doc 13 owns the harnesses):
  1. Runner, default tiers, network gate, cross-engine tag, AT ids, exemptions: D-063 as amended. A component spec numbers its acceptance tests; item `n` is `AT-<n>`; prefixed ids already used by infrastructure documents (`E-05`, `C-02`, `A-07`, `LT-3`, ...) are kept. One collision is removed: the `cart` blueprint's tests are `CR-<n>` (doc 12), because `CA-<n>` names the common component tests of doc 09.
  2. `size-budget.json` follows D-064 exactly: agent chunks 14,000 bytes; shared 10,000; Liquid `ripple.js` 45,000.
  3. Example projects (`examples/<host>/`) have the contract doc 13 section 12.1 states: `build` and `start` scripts, the `PORT` variable, the route list, the dialog id `cart-drawer`, `RIPPLE_TEST_ROUTES`.
  4. The Liquid shim implements the subset of D-097, including `{% form %}` types, `{% layout %}`, `{% paginate %}`, `{% partial %}`, `standard_event_data` (returning a fixed JSON) and the globals doc 12 lists. `serveTheme` emulates Standard Actions and partial rendering and is exported from `<pkg>/testing` (the Liquid eval tier uses it).
  5. mock.shop data for `menu`, `blog`, `page`, `localization` and `frontpage` is UNVERIFIED (not reachable when doc 12 was written); tier 7 is the check.

#### D-105 CSS: settled points

- Decision (doc 03 owns the rules and the linter):
  1. The linter reads the root class from the manifest `root.class`, not from the id.
  2. The linter accepts, in addition to its current list: `:popover-open`; `::-webkit-inner-spin-button`; `[data-starting-style]`, `[data-ending-style]`; `.rp-toast :where(tag[attr])`; `.rp-heading:where(h1)` compound selectors; `:dir(rtl)`; a `:checked` rule that sets a private variable; `:indeterminate`; the vendor progress pseudo-elements; private slots with the value `initial`; a data-URI `mask-image`; `calc(1px * -1)`; one `transition` on `inline-size`.
  3. Rule 7.7 (reserved UI SDK attribute names) exempts a component's own manifest props (D-024).
  4. New linter rule: no `display: contents` or `display: none` on a custom element root (D-080).
  5. `base.css` contains: the Tabs `@media (scripting: none)` `!important` block in `@layer ui-sdk`; `rp-view-event` in the display region; `html { scroll-padding-block-start: var(--rp-header-block-size, 0px); }`; `*, ::before, ::after { box-sizing: border-box; }` (the `:where()` form never matched pseudo-elements).
  6. Private variables: section 4.5. Tokens: D-026 as amended. One global focus ring: D-066.
  7. Tailwind's `--z-index-*` and `--transition-duration-*` aliases are kept and pinned by doc 03 test A-10; removal is the fallback.
  8. No height animation for Accordion.
  9. Amended (closing pass): the linter also accepts exactly ONE selector that does not begin with an own class: `:root:has(.rp-header[data-sticky])` in `header.css`, declaring only `--rp-header-block-size` (doc 03 row L-15). `.rp-header[data-sticky]` itself sets custom properties only (`--_position`, `--_z`), as D-024 item 2 requires. `:has()`, `:dir(rtl)`, unprefixed `mask-image`, `::backdrop` custom-property inheritance and (Firefox) `<details name>` are features above the floor whose capability tiers are in doc 03 section 12 (D-081 as amended).

#### D-106 Agent kit and evals: settled points

- Decision: D-060 and D-061 as amended. In addition: doc 08's rule pages and rule text cover all 55 ids; the positional `ripple docs` forms are the only ones documented; the four spacing values of the `ripple-compose-page` skill are normative for blueprints (band padding `py="12 md:20"`; gap between areas in a band `gap="8 md:12"`; gap inside a group `gap="2"` to `gap="4"`; grid gap `gap="4 md:6"`); the Liquid eval tier uses `serveTheme` from `<pkg>/testing`.

#### D-107 Blueprints: settled points

- Decision (doc 12 owns the blueprints):
  1. TSX document shell: `renderDocument` returns the document as a string around the rendered body; React does not hydrate `document.body`'s parent. Fallback and test: doc 12 LT-10.
  2. hydrogen backend: `password` and `gift-card` are presentational (project-supplied data and routes); newsletter and contact use scaffolded handlers (`handleNewsletterPost`, `handleContactPost`) that call a project-supplied `subscribe` or `send`; `handleLocalePost` handles the locale form (Q22).
  3. The `collection` blueprint renders Filters inline (D-005). CartDrawer is omitted on the cart page (D-091). The layout prints the search Dialog and PredictiveSearch, and no Announcer.
  4. Blueprint files use the spacing values of D-106, the component APIs of docs 09 to 11 (D-093), the import specifier of D-096, and the targets of D-101. Ids fixed in every host's blueprint files (doc 12 section 1.5 owns the list; doc 14 rule T-24 copies it): `main`, `main-nav`, `mobile-nav`, `footer-menu`, `search-dialog`, `predictive-search`, `footer-locale`, `newsletter`, `cart-drawer`, `cart-drawer-list`, `cart`, `cart-discount`, `cart-note`, `product-gallery`, `product-options`, `product-form`, `collection-filters`, `collection-sort`.
  5. Liquid blueprint strings: keys `ripple.blueprints.<id>.*` live in the repository's `locales/en.default.json`; the registry build generates one locale patch per blueprint (`registry/liquid/locales/blueprint.<id>.json`, file key `locale`), merged by `ripple add --blueprint <id>` like a component's keys. The `layout` blueprint's Liquid files are `layout/theme.liquid`, `snippets/import-map.liquid` and `snippets/meta-tags.liquid`; `core/patch:head` and `core/patch:import-map` report `patch-skipped` when their target file is missing or already contains the line.
  6. Base-theme features NOT carried into V1: external click-to-load video; gift-card copy and tilt; View Transitions; per-variant quantity rules; sticky product column; per-kind radius selects; LCP preload; per-card impression events; article comments (Q19).

#### D-108 Spikes

- Decision: Section 3 was updated: SPIKE-01 gained the page-view question; SPIKE-02 gained `as`, bare schema settings and the discount type (doc 14's question list is V-1 to V-20: the closing pass added V-17 `as`, V-18 `request.page_type`, V-19 `font.system?`, V-20 `standard_event_data` in both forms); SPIKE-05 gained `popover=""`; SPIKE-06 gained `popover` and `::backdrop`; SPIKE-08's default is now the attribute alone; SPIKE-10 covers the `remix` default strategy and `useRegionHtml`; SPIKE-11 `remix-opt-in-refresh` is new. Items the writers left UNVERIFIED and that gate tests, not contracts (doc 10 item 18): `checkPattern("dialog")` on a native `<dialog>`; Escape on a tooltip inside a modal dialog; the accessible name of UI SDK's toast close button; the DOM of a live toast. Each stays UNVERIFIED in its document with the test that settles it.

### 13.2 Disposition of every reported gap

One row per item of each writer's gap list (261 numbered items and 7 un-numbered notes). Outcomes: **Accepted** = the writer's resolution is now ledger text; **Extended** = accepted and widened; **Changed** = decided differently from the writer; **Overruled** = another document's choice wins; **Open** = stays UNVERIFIED behind a named spike or question. The edits each document needs are in its worklist.

#### Doc 02 (15)

| # | Reported | Outcome | Decision |
|---|---|---|---|
| 1 | `data-slot` wording wrong for `ui-*` | Accepted | 4.4, D-076 |
| 2 | Liquid `attributes` placement wrong | Accepted | D-035 |
| 3 | No manifest key for the upgrade allow-list | Accepted | 4.8, D-071 |
| 4 | Fixture HTML storage ambiguous | Accepted: the file is the source | D-074 |
| 5 | Mask format undefined | Accepted | D-074 |
| 6 | `html` reference file format undefined | Accepted | D-040 |
| 7 | Resource props in fixtures undefined | Accepted | D-074 |
| 8 | "Whitespace collapsed" underspecified | Accepted | D-075 |
| 9 | Mapping details (`as`, `level`, empty string, enum fallback) | Accepted | D-073 |
| 10 | Fixture requirements are new | Accepted | D-074 |
| 11 | Responsive grammar strictness | Accepted | D-028 |
| 12 | D-012 conflicts with the measured Tabs markup | Accepted; D-012 corrected. Classes on the Tabs markup add no mutation (doc 10 spike) | D-012 |
| 13 | Allow-list entry for `defaultOpen` dialogs | Accepted | D-008, D-071 |
| 14 | Scope overlap with doc 13 | Accepted: 02 owns the algorithm, 13 the harness | D-075 |
| 15 | SPIKE-05 fallback attribute `data-rp-close` | Accepted | 4.4, D-076 |

#### Doc 04 (16 and 2 notes)

| # | Reported | Outcome | Decision |
|---|---|---|---|
| L-1 | Shared chunk | Accepted | D-054 |
| L-2 | Second chunk set | Accepted | D-054 |
| L-3 | Bundler (Rollup) | Accepted | D-054, D-077 |
| L-4 | Display of `rp-*` roots | Accepted: all `block` | D-080 |
| L-5 | Toast loading | Changed: the writer followed the ledger; the ledger now takes the writer's recommendation (load on first `toast()`) | D-054, D-083 |
| L-6 | Announcer wrapper | Accepted | D-079 |
| L-7 | Polyfill differs from the base theme | Accepted | D-078 |
| L-8 | Popover above the floor | Accepted fallback; floor kept | D-081, Q15 |
| L-9 | Tabs `aria-controls` | Accepted | D-012 |
| L-10 | Close on navigation narrowed | Accepted | D-008 |
| L-11 | Bridge labels | Accepted: no labels | D-095 |
| L-12 | Quantity announcement | Accepted | D-015 |
| L-13 | Carousel `disabled` and events | Accepted | D-016 |
| L-14 | Toast options | Accepted | D-083 |
| L-15 | Agent budget 14 kB | Accepted | D-064 |
| L-16 | Navigation menu has no event | Accepted | D-017 |
| note | `sideEffects` must cover runtime, elements, commerce | Accepted | D-052 |
| note | Import rule for `src/gen/**` must allow Rollup | Accepted | D-077 |

#### Doc 06 (21)

| # | Reported | Outcome | Decision |
|---|---|---|---|
| 1 | Enum fallback in TSX | Accepted | D-035, D-073 |
| 2 | `rv` signature | Accepted | D-035 |
| 3 | Prop types location | Accepted; doc 01 corrected | D-052 |
| 4 | `RestProps`; `<pkg>/remix` type-only import | Accepted | D-096, D-077 |
| 5 | Generated JSX type files; `ButtonHTMLAttributes` | Accepted | D-096, 5.1 |
| 6 | Remix key prop `rmxKey` | Accepted | D-034 |
| 7 | `data-rmx-preserve-attrs` from `state[]` | Accepted; doc 07 adds `writer` | D-034, D-100 |
| 8 | Liquid `attributes` last | Accepted | D-035 |
| 9 | Store hook `useCart` | Extended with `useRegionHtml` | D-033, D-090 |
| 10 | One writer per node in React | Accepted | D-033 |
| 11 | `REACT_HYDRATION_ALLOW` | Accepted | D-071 |
| 12 | `"use client"` rule | Extended: such a file exports components only | D-033, D-094 |
| 13 | Generated versus hand-written | Accepted | D-072 |
| 14 | Schema label keys | Accepted; doc 07's keys overruled | D-038 |
| 15 | Liquid subset filters | Extended to three scopes | D-097 |
| 16 | Liquid param `as` | Open (SPIKE-02), fallback `tag` | D-038 |
| 17 | Sibling imports | Accepted | D-035 |
| 18 | Controlled props depend on doc 04 | Settled: doc 04 adds the `rp-quantity` veto test | D-036 |
| 19 | Parts cannot learn initial state | Accepted | D-012 |
| 20 | Conformance work directories | Accepted | D-096 |
| 21 | Extra required fixtures | Accepted | D-074 |

#### Doc 08 (19)

| # | Reported | Outcome | Decision |
|---|---|---|---|
| 1 | Checker ownership | Changed: 07 owns the output format, 08 owns rule text | D-059, 12 |
| 2 | Rule rewrites written in 08 | Accepted as text; ids and detection are 07's | D-059 |
| 3 | Rule id ranges, 51 ids | Changed: 55 ids | D-059, D-102 |
| 4 | `docs` command forms | Accepted; 07's `--rule` flag removed | D-057 |
| 5 | Skill `references/` | Accepted: none; 12 guides | D-060 |
| 6 | `AGENTS.md` markers | Accepted | D-056 |
| 7 | `AGENTS.md` size truncation | Accepted | D-060 |
| 8 | Dev-mode warnings | Accepted: no overlay | D-060 |
| 9 | Liquid silent fallback hides errors | Accepted as a stated limit | D-038 |
| 10 | Commerce agent actions | Accepted; docs 05 and 11 adopt | D-095 |
| 11 | Checkout confirmation | Accepted; D-050 corrected | D-050, SPIKE-08 |
| 12 | Bridge labels | Accepted; the recommended `role="group"` is not applied | D-095 |
| 13 | Eval tasks rewritten | Accepted | D-061 |
| 14 | `evals/` layout; `eval` script | Accepted | D-061, D-103 |
| 15 | Budgets and control arm | Accepted | D-061 |
| 16 | Model ids | Open | Q17 |
| 17 | API gating G-1 to G-7 | Accepted | D-061 |
| 18 | `components/<id>/notes.md` | Accepted | D-060, 5.1 |
| 19 | Cross-document requirements (rule ids; spacing values; `serveTheme`) | Accepted: doc 10 has `dialog-needs-title`; doc 11 adds `variant-picker-outside-form`; blueprints use the four values; doc 13 exports `serveTheme` | D-093, D-104, D-106 |

#### Doc 10 (18)

| # | Reported | Outcome | Decision |
|---|---|---|---|
| 1 | Tabs no-JS override must be in layer `ui-sdk` | Accepted | D-021, D-025 |
| 2 | `rp-dialog` display | Doc 04 wins | D-080 |
| 3 | QuantityInput root class; linter acceptances | Accepted | D-015, D-105 |
| 4 | Doc 03 rule 7.7 exemption | Accepted | D-024, D-105 |
| 5 | Tabs `orientation` dropped | Accepted | D-012, 6.3 |
| 6 | Tabs same-value `role` write allow-listed | Overruled: not a mutation, entry removed | D-002, D-071 |
| 7 | Tooltip `side` / `align` as option attributes | Accepted | D-082, 4.3 |
| 8 | Tooltip link triggers prohibited | Accepted | D-082 |
| 9 | Tooltip trigger wired by rest props | Changed: prop `tooltip` on Button and IconButton | D-082, Q21 |
| 10 | Toast root class `rp-toast` | Accepted | D-083 |
| 11 | Dialog / Drawer parts `header`, `footer` | Accepted | D-008, D-084 |
| 12 | Popover: `title` part, `popover=""`, floor | Accepted; floor kept | D-010, D-081, Q15 |
| 13 | Accordion `type`, no animation, `id` only for single | Accepted | D-011 |
| 14 | Carousel props and classes | Accepted | D-016 |
| 15 | QuantityInput additions | Accepted; prop `form` renamed `formId` | D-015 |
| 16 | Schema label keys deferred | Settled: doc 06's keys | D-038 |
| 17 | `escaping` fixture on Tabs | Accepted | D-074 |
| 18 | Unverified items that gate tests | Open | D-108 |

#### Doc 12 (17 and 5 open items)

| # | Reported | Outcome | Decision |
|---|---|---|---|
| 1 | Header, Footer, FeaturedCollection kind | Accepted | D-006 |
| 2 | `shop` resource | Accepted | D-094, 6.4 |
| 3 | `strings` prop | Accepted | D-066 |
| 4 | NavigationMenu panel ids; LinkList `links` | Accepted | D-017, D-085 |
| 5 | MobileNav owns its own panel classes | Overruled: composes Drawer | D-017, D-070 |
| 6 | LocaleSelector tier and required `id` | Accepted | D-020, D-085 |
| 7 | NewsletterForm `status` and `id` | Accepted | D-020, 6.3 |
| 8 | `{% form %}` roots take no `attributes` | Accepted | D-037, D-091 |
| 9 | Blueprint locale namespace | Accepted | D-066 |
| 10 | Blueprint regions are plain elements on Remix | Extended to every region | D-090, D-091 |
| 11 | No Announcer in layout; search dialog added | Accepted | 8.5, D-079 |
| 12 | String `renderDocument` | Accepted | D-107 |
| 13 | Scope follows the ledger; article comments omitted | Accepted | D-107 |
| 14 | `password`, `gift-card` presentational on hydrogen | Accepted | D-107, Q22 |
| 15 | CartDrawer omitted on the cart page | Accepted | D-091 |
| 16 | Newsletter and contact handlers | Accepted | D-107, Q22 |
| 17 | Liquid subset for blueprint files | Accepted | D-097 |
| open | Assumed signatures and `rp-<component id>-region` snippets | Overruled by docs 10 and 11 | D-091, D-093 |
| open | Doc 13 must implement shim tags and globals | Accepted | D-104 |
| open | Doc 07 must add the html-blueprint generation step | Accepted | D-101 |
| open | Doc 03 sticky-header `scroll-padding` | Accepted | D-105 |
| open | mock.shop data UNVERIFIED | Open | D-104 |

#### Doc 14 (18)

| # | Reported | Outcome | Decision |
|---|---|---|---|
| 1 | Chrome components given a minimum interface; header composed by hand | Overruled: doc 12 owns components and layout | D-099 |
| 2 | CSS location | Accepted | D-055 |
| 3 | Six import-map entries | Accepted | D-054 |
| 4 | Two token rules | Accepted | D-026 |
| 5 | `form` reserved; `cart_lines` | Accepted | D-020 |
| 6 | Range setting bounds | Accepted | D-098 |
| 7 | Font default `inter_n4` | Overruled: `system_ui_n4`, no font dial for system fonts | D-098 |
| 8 | One palette per theme | Accepted | D-098 |
| 9 | Config element in `rp-head` | Accepted; doc 05 follows | D-087 |
| 10 | Template region root through `attributes` | Accepted; the allowed list is `data-rp-region` only | D-091 |
| 11 | Duplicate partial names; CartDrawer on cart | Accepted | D-091 |
| 12 | Filters inline | Accepted | D-005 |
| 13 | Infrastructure filters outside L-13 | Accepted | D-097 |
| 14 | Theme-owned page view | Changed: the Liquid adapter dispatches it | D-089, SPIKE-01 |
| 15 | No money snippet | Accepted | D-049 |
| 16 | English only | Open | D-098, Q16 |
| 17 | AnnouncementBar omitted from the layout | Overruled: the layout prints it | D-099 |
| 18 | Base-theme features not carried over | Dropped | D-107, Q19 |

#### Doc 01 (17)

| # | Reported | Outcome | Decision |
|---|---|---|---|
| 1 | Which `package.json` is published | Accepted | D-052 |
| 2 | Build script location | Accepted | 5.1 |
| 3 | How tooling runs | Accepted | 5.1, D-103 |
| 4 | Single package, no workspace | Accepted | D-103 |
| 5 | Second chunk set | Extended with `shared`: 12 files | D-054 |
| 6 | Two builds of the browser files | Accepted | D-054 |
| 7 | Export paths; aliases dropped | Accepted | D-052 |
| 8 | Re-exports from `ripple.js` | Accepted | D-042, D-054 |
| 9 | No file under `src/` imports `remix` | Accepted | D-062 |
| 10 | Refresh strategies live in `src/commerce/` | Accepted | D-054 |
| 11 | `liquidjs` and `parse5` bundled | Accepted | D-052, Q20 |
| 12 | One esbuild invocation for `dist` | Accepted | D-054 |
| 13 | Node versions | Accepted | D-052, D-103 |
| 14 | Exact pins; licence placeholder | Extended with seven pins | D-103, Q18 |
| 15 | `BIN_NAME`, `VERSION` | Accepted | D-052 |
| 16 | No rule id for "one runtime per page" | Settled: RP507 | D-102 |
| 17 | Kernel-sharing mechanism had no spike | Settled by doc 04's build (run) | D-054 |

#### Doc 03 (18)

| # | Reported | Outcome | Decision |
|---|---|---|---|
| 1 | `data-rp-js` rules in layer `rp.props` | Accepted | D-021 |
| 2 | `data-text-align` in `props.css` | Accepted | D-028 |
| 3 | D-024 item 2 read literally | Extended: own-prop selectors allowed | D-024 |
| 4 | More private slots | Accepted | 4.5 |
| 5 | Added tokens; no `--shadow-xl` | Accepted | D-026 |
| 6 | Scheme blocks set `--rp-brand-foreground` | Accepted | D-026 |
| 7 | Two bridge rules | Accepted | D-026 |
| 8 | No OS-following scheme | Accepted | D-026 |
| 9 | Regeneration command | Accepted | D-029 |
| 10 | Tree additions; `base.css` regions | Accepted | 5.1, D-055 |
| 11 | Manifest key for display | Accepted; values changed to `block` | D-080 |
| 12 | `theme.css` import place | Accepted | D-055 |
| 13 | Per-component CSS cap | Accepted | D-064 |
| 14 | `data-starting-style`, `data-ending-style` | Accepted | D-021 |
| 15 | One global focus ring | Accepted | D-066 |
| 16 | `box-sizing` selector fix | Accepted | D-105 |
| 17 | CSS budgets on a minified copy | Accepted | D-064 |
| 18 | Undocumented Tailwind theme keys | Accepted with test A-10 | D-105 |

#### Doc 05 (17)

| # | Reported | Outcome | Decision |
|---|---|---|---|
| 1 | Options delivery and config element | Accepted | D-042, D-087 |
| 2 | `rp-view-event` | Extended: blueprint-only, payload rules, Liquid page view | D-089 |
| 3 | Localized JS strings | Accepted | D-087 |
| 4 | Part `remove`; count `hidden` | Accepted | D-045, 4.4 |
| 5 | Refresh reasons | Accepted; strategies revised | D-090 |
| 6 | `attachQuantityInput` not called | Accepted | D-044 |
| 7 | Liquid cart form structure | Accepted | D-092 |
| 8 | `rp-recommendations` `data-url` | Accepted | D-046, 4.4 |
| 9 | Server handler evidence error | Accepted; D-041 corrected | D-041 |
| 10 | Script tags on the hydrogen backend | Accepted | D-088 |
| 11 | Error lifetime and scope | Accepted | D-045 |
| 12 | `openCart()`; cancelable `action`; `cartDrawer` | Accepted | D-042, D-023 |
| 13 | Internal `adapter.ts` exports | Accepted | D-042 |
| 14 | Caching | Accepted | D-041 |
| 15 | Resource shapes | Extended (`RippleMenu`, `RippleShop`, option and filter shapes) | D-094 |
| 16 | React `suppressHydrationWarning` on written parts | Accepted | D-033 |
| 17 | Async start failure | Accepted | D-041, D-088 |

#### Doc 07 (27)

| # | Reported | Outcome | Decision |
|---|---|---|---|
| 1 | Lock format versus "no lockfile" | Accepted | D-056 |
| 2 | Top-level `elements` | Accepted; display values changed | D-080, D-100 |
| 3 | `upgradeAllow` | Accepted | D-071 |
| 4 | File `key`; trailer id | Accepted | D-056 |
| 5 | Parts inside the component entry | Accepted | D-058 |
| 6 | Sub-key shapes | Extended: `state[].writer` | D-100 |
| 7 | Template language additions | Accepted | D-003 |
| 8 | Bridge surface for kind `native` | Accepted | D-065 |
| 9 | File locations | Accepted | 5.1, 5.2 |
| 10 | `paths.public` | Extended with `paths.pages` | D-101 |
| 11 | CLI flags | Accepted except `docs --rule` | D-057 |
| 12 | New rule ids | Accepted | D-059 |
| 13 | `add` / `upgrade` regenerate derived CSS | Accepted | D-029 |
| 14 | Core regions in Liquid `ripple.css` | Accepted | D-055 |
| 15 | Agent file always copied; elements file never scaffolded | Accepted | D-101 |
| 16 | Prefix transform before hashing | Accepted | D-056 |
| 17 | Library JS overwritten, not merged | Accepted | D-053 |
| 18 | Locale patches in every locale file | Accepted | D-098, Q16 |
| 19 | Generated regions; humanised labels | Accepted; label KEYS are doc 06's | D-038, D-072 |
| 20 | `diff` exit code | Accepted | D-057 |
| 21 | Compiled CSS mode dropped | Accepted | D-055 |
| 22 | Merge-base retrieval | Accepted | D-057 |
| 23 | Rule rewrites; RP308 | Accepted; RP308 containment narrowed | D-059, D-102 |
| 24 | No suppression | Accepted | D-057 |
| 25 | `deprecated`; beta; release checklist | Accepted | D-101 |
| 26 | RP502 by file state | Accepted; doc 08's text follows | D-102 |
| 27 | `src/check` must not import `src/cli` | Accepted | D-077, D-102 |

#### Doc 09 (20)

| # | Reported | Outcome | Decision |
|---|---|---|---|
| 1 | `gapX`, `gapY`, `textAlign`; `role="list"` | Accepted | D-086 |
| 2 | Container box model | Accepted | D-086 |
| 3 | Link `variant`, `current`, `dialog` | Extended: `dialog` also on Button and IconButton with `href` | D-009 |
| 4 | Image contract | Accepted | D-049 |
| 5 | Video attributes | Accepted | 4.3, D-086 |
| 6 | Lint `pe-2` on Button fixtures | Accepted | D-074 |
| 7 | Icon props; unknown name | Accepted | D-068 |
| 8 | Field `id`; `FieldControl` | Accepted | D-014 |
| 9 | CSS linter acceptances | Accepted | D-105 |
| 10 | Form native attributes | Accepted | 4.3, 6.3, 6.4 |
| 11 | RadioGroup class names | Accepted | D-014 |
| 12 | `role` from tone | Accepted | D-066 |
| 13 | Rating value and name | Accepted | D-086 |
| 14 | Pagination default body | Accepted | D-086 |
| 15 | Announcer placement | Accepted | D-079 |
| 16 | Liquid schema settings limits | Accepted | D-038 |
| 17 | `form` as a prop name | Settled: `cartLines`, `formId` | D-020 |
| 18 | Liquid param `as` | Open (SPIKE-02) | D-038 |
| 19 | Vocabulary subsets | Accepted | D-086, 6.3 |
| 20 | Component-specific rule ids; `RP120` | Changed: manifest `rules[]`, no `RP120` | D-059 |

#### Doc 11 (23)

| # | Reported | Outcome | Decision |
|---|---|---|---|
| 1 | Hand-written static bindings | Accepted | D-003, D-072 |
| 2 | `rpField` prop | Accepted; docs 09 and 10 add it | D-043, D-086 |
| 3 | Backend-scoped fixtures | Accepted | D-074 |
| 4 | Value imports of `@shopify/hydrogen` | Accepted as a closed list (verified in source) | D-094 |
| 5 | Mask rule F-19 | Accepted | D-074 |
| 6 | Resource blocks versus partials | Accepted: region parts | D-091 |
| 7 | Required ids; `-form` suffix | Accepted | D-020 |
| 8 | New props and attributes | Accepted | 6.4 |
| 9 | Shapes missing from doc 05 | Accepted; doc 05 adds them | D-094 |
| 10 | ProductForm examples in docs 06 and 07 | Doc 11 wins | D-069, D-093 |
| 11 | Kinds and roots | Accepted | D-006 |
| 12 | `rp-view-event` placement | Blueprints only | D-089 |
| 13 | Lightbox opens at the first image | Accepted as a V1 limit | D-093 |
| 14 | Liquid subset additions | Accepted | D-097 |
| 15 | DiscountCode `degraded` | Accepted | D-005 |
| 16 | Status parts in four components | Accepted | D-045, D-079 |
| 17 | Compare-at total of a line | Accepted; doc 05 follows | D-049 |
| 18 | SPIKE-09 | Open | section 3 |
| 19 | `form` as a prop name | Settled | D-020 |
| 20 | RP308 too broad | Accepted: only `rp-cart` | D-047, D-102 |
| 21 | CheckoutButton position | Accepted | D-050 |
| 22 | Applied discount codes on Liquid | Open (SPIKE-02) | D-092 |
| 23 | Predictive search on React | Changed: `useRegionHtml`; app-side rendering is the fallback | D-090 |

#### Doc 13 (15)

| # | Reported | Outcome | Decision |
|---|---|---|---|
| 1 | Same-value writes at upgrade | Accepted: not failures | D-002 |
| 2 | "Visual regression" | Accepted: computed-style snapshots | D-063 |
| 3 | Tree additions | Accepted | 5.1 |
| 4 | `.github/` | Accepted | D-103 |
| 5 | Three unpinned devDependencies | Accepted | D-103 |
| 6 | Example-project contracts | Accepted: doc 13 owns them | D-104 |
| 7 | Network gate | Accepted | D-063 |
| 8 | Node versions in CI | Accepted | D-103 |
| 9 | Cross-engine scope and tag | Accepted | D-063 |
| 10 | `serveTheme` emulation | Accepted | D-104 |
| 11 | No-JS comparison excludes fallback controls | Accepted | D-063 |
| 12 | Tabs no-JS exemption | Accepted | D-012 |
| 13 | Budgets for `shared` and the Liquid `ripple.js` | Accepted | D-064 |
| 14 | kB unit | Accepted | D-064 |
| 15 | Acceptance-test id scheme | Accepted | D-104 |

### 13.3 Closing decisions

These decisions were made by the closing pass, after the per-document worklists were applied, from the "Remaining issues" the 14 appliers reported. They have the same force as sections 1 and 13.1. Each one was applied to every affected document in the same pass.

#### D-109 `snippets/meta-tags.liquid` is the base theme file

- Decision: `snippets/meta-tags.liquid` (file key `meta-tags` of the `layout` blueprint) is `theme/snippets/meta-tags.liquid` with exactly two replacements: the locale key `general.meta.tagged` becomes `ripple.blueprints.layout.meta_tagged` and `general.meta.page` becomes `ripple.blueprints.layout.meta_page` (same English text). Nothing else changes. Doc 14 section 7.6 owns this rule; neither doc 12 nor doc 14 reprints the 253 lines. The Infrastructure scope of D-097 is widened by the seven filters the file needs (`first join remove_first slice strip_html money_without_currency structured_data`), and the shim implements them and the globals the file reads (doc 13). Test: doc 12 LT-12.
- Rationale: doc 14 had written a reduced file to stay inside the old scope, which dropped JSON-LD, `og:price`, `hreflang` links and title suffixes (an SEO regression); doc 12 required a byte copy, which reads two `general.*` keys a Ripple theme does not have. A copy with two key renames keeps the SEO output and keeps the rule that a Ripple theme's storefront locale has only the key `ripple`.
- Rejected: the reduced file (SEO regression); an unmodified byte copy (missing translations).

#### D-110 Closing: settled small points

- Decision: the rows below settle every point the appliers reported as "ledger silent" or as a difference between two documents, where no larger decision was needed. Each row names the owning document; that document carries the full text.

| # | Point | Decision | Owner |
|---|---|---|---|
| 1 | `<command form>` in static files (skills, guides, `INDEX.md`, `AGENTS.md`, `DESIGN.md`, generated pages) | Always `npx <pkg>` with the real package name and NO version. CLI output keeps the form of doc 07 section 7.1 rule 12. | 08, 14 |
| 2 | `<main>` | `<main id="main" tabindex="-1">` in every host. `data-template` is printed by the Liquid layout only (D-089). Test BT-3 compares the children of `<main>`. | 12, 13 |
| 3 | `cart` on CartDrawer, CartLines and Header (TSX) | Optional, `RippleCart \| null`; `null` or unset renders the empty cart. Callers pass `cart={cart}`. | 11, 12 |
| 4 | `{% capture %}` | A file may capture markup it renders ITSELF and pass it as the `content` argument of a snippet it embeds (LocaleSelector to `rp-button`). Passing captured markup to another author's file stays forbidden (D-037, D-097, L-7). | 06 |
| 5 | Resource types | `RippleVariantOption`, `RippleVariantOptionValue`, `RippleFilterChip`, `RippleSortOption` are exported by `<pkg>` (doc 05 section 11.1); `RippleProductDetail` has `descriptionHtml: string`. `variant-picker.data.ts` imports them; no local copies. | 05, 11 |
| 6 | Repository | `CHANGELOG.md` is a root file. `release:check` is `pnpm gen --release-check`. `theme:css` builds `examples/liquid/assets/styles.min.css`. `src/cli/**` may import `src/gen/{props-css,theme-css,tokens-source}.ts`; `src/gen/**` may import `src/cli/**`. Relative imports may be written `./x` or `./x.ts`. `tsconfig.json` type-checks `blueprints/**/*.test.ts` and `css/**/*.test.ts`. `.ripple-conformance/` is ignored by per-example `.gitignore` files. | 01, 07, 13 |
| 7 | Sticky Header | `header.css` has the one accepted rule `:root:has(.rp-header[data-sticky])` (linter row L-15) and the modifier `.rp-header[data-sticky]` sets only `--_position` and `--_z` (D-105 item 9, D-024). | 03, 12 |
| 8 | Inline Invoker Commands polyfill | The exported constant is `INLINE_COMMANDS_POLYFILL` in `src/runtime/commands-polyfill.ts`. `rp-head.liquid` prints its text; test E-28 compares them. | 04, 14 |
| 9 | `data-rp-open` | Also printed by components whose own contract prints an opener link (section 4.4 as amended). Hook attributes that have NO prop (`data-rp-js`, `data-rp-part`) are printed by a component binding on markup it prints itself; a caller may pass `data-rp-js="fallback"` through rest props or `attributes` (LiveForm's submit button). The four plain hook buttons of VariantPicker, SortSelect, CartNote and DiscountCode are printed by those bindings with the single class `rp-button` (D-070 composition by contract). | 11 |
| 10 | Checker placements | Out-of-scope Liquid tag or filter: RP401 case (b). Hydrogen value import outside the D-094 list: RP117 case (b), warning. `<pkg>/elements` or `<pkg>/commerce` imported by a binding: RP117 case (c). RP320 reads `agent.confirm[]`, which includes the two accelerated-checkout wrappers. RP308 has the four cases of D-102 item 4. No rule id covers a hook attribute passed through rest props, nor `dialog` without `href` at source level: both are stated normatively (doc 09) and are not checked in V1; the 55 ids stay fixed. | 07, 08 |
| 11 | Checker text | `FIX_SYNONYMS` (doc 08 section 5.3) is applied first by doc 07 section 9.5.1. A rule file exports `meta` and `text: RuleText`. The agents section is produced by `renderAgentsSection(input)`. Doc 08 owns every `fix` text; doc 07's "Fix given" column is a summary. | 07, 08 |
| 12 | Fixture requirements | `invalid-enum-falls-back` only for an enum with a default; `escaping` only for a string, id or url prop printed as an attribute (D-074 item 3 as amended). An invalid token in a responsive value is printed unchanged (L-16) and matches no CSS rule, which is the fallback D-028 means. A component with no qualifying prop has no such fixture (Carousel; Header names its case `unknown-scheme`). | 02 |
| 13 | Select fixtures `sort` and `sort-react` | Allowed host-scoped pair (D-074 item 7 as amended). | 09 |
| 14 | Video | One prop `autoplay` prints `autoplay muted loop`. No `muted` or `loop` prop (section 6.4 rows corrected). | 09 |
| 15 | Toast and Tooltip | Tooltip `side` and `align` are on `ui-tooltip-content`. Toast prints `data-side` / `data-align` and, at non-default values, the option attributes (section 4.3). The Toast allow-list entry of doc 02 section 7.3 stands as written; entries fixed by D-071 item 3 and `subtree` entries are exempt from doc 02 U-7, and doc 07's generator check applies the same exemption. The four Tooltip fixtures stay `upgrade-snapshot` until SPIKE re-capture with the Button trigger. | 02, 10 |
| 16 | ProductForm allow-list | The error-part entry of D-071 item 3, equal in docs 07 and 11. | 11 |
| 17 | `indexchange` | "Not cancelable" means cancelling has no effect. The kernel sets `event.cancelable` to `true`; no test asserts the flag. Carousel's kernel option `default-index` exists and is never printed by a server. | 04 |
| 18 | Upgrade measurement | Zero mutations for `ui-toast-region` holds until the first `toast()` call (test E-01). Same-value writes are not mutations in every document (D-002). Page P of doc 04 composes fixtures by inserting one fixture's HTML into another's content part; only doc 04 uses that. A composed fixture may contain a plain native `<button commandfor command>` as caller content. | 04, 10 |
| 19 | Name clashes in section 4.3 | The manifest key `prop.attribute` is authoritative (doc 02 M-4a): Container `width`, Accordion `type` and Rating `value` print `data-*`. `parseResponsive` is not a `<pkg>` export. `selected` on `<option>` is a native state attribute. Pagination's current page is `<span class="rp-pagination-current" aria-current="page">`. | 02, 09 |
| 20 | Morph keys | Toast and QuantityInput print `data-rmx-key` only when `rmxKey` is passed (D-034). Docs 11 and 12 do not pass it; position-based morph is enough for the cart and the toast region. | 10 |
| 21 | Template fields | A component with no spike keeps the literal heading `### Fallback (SPIKE-nn)` with the body "None." Accordion's "Requires id" reads "no (yes when `type="single"`)". Opener attributes written by the runtime listener have writer `element` in the manifest (D-100 has no other value). | 09 to 12 |
| 22 | Blueprint details | IconButton embeds pass `icon: '<name>'`. The cart blueprint has no CheckoutButton of its own (CartSummary prints it). CartSummary prints no CheckoutButton for an empty cart; an inert CheckoutButton (D-050 item d) has no `href` and no `tabindex`, unlike Button `link-disabled`. The SPIKE-09 Liquid fallback is `{% block 'featured-collection', collection: settings.rp_related_collection, limit: 4 %}{% endblock %}`, titled by the collection's own title. `toRippleMenu` lives in the layout blueprint's `lib/menu.ts`. `lib/locale-route.ts` is project route code and may import `getLocalizedHref`, `getSupportedLocales`, `matchLocale` from `@shopify/hydrogen` (added to the D-094 list for that file only; UNVERIFIED until tier 2 type-checks it). HTML blueprints are written unchanged by step G10 (no pretty-printer). | 11, 12, 14 |
| 23 | Fixture resources | `{ "$resource": "<type>.<name>" }` names a whole resource. A prop whose value is PART of a resource ("the media of `product.basic`") is written as literal JSON in the fixture record, copied from the resource. `product.basic` and `product.options` share an identity on purpose; `serveTheme` serves `product.options` at `/products/linen-shirt`, and `line.basic` is built from it. A prop that exists in some hosts only declares manifest `prop.hosts` (section 4.8); the fixture loader skips it elsewhere (FX-4) and binds Liquid globals (RS-3). | 11, 13 |
| 24 | Shim | `default_errors` appears only in a caller example of doc 09 and is not a Ripple file; it is outside the subset and the shim does not implement it. `liquidjs` always divides as floating point and Shopify divides integers when both operands are integers, so a Ripple file MUST either write a float divisor (Rating, doc 14) or make the division exact first: PriceRange computes `cents = c | modulo: 100`, then `whole = c | minus: cents | divided_by: 100`. The shim accepts `return_to` on `{% form %}`; no Ripple file passes it. `current_page`, `current_query`, `form_state` and `ShimOptions.pageSize` are shim-only and unreadable by Ripple files (SH-5). | 13 |
| 25 | Commerce | The adapter starts one microtask after the commerce module is evaluated (D-087 item 2 as amended). `rp-cart` announces through its own status part when present, otherwise `announce(text, { from: root })`. `rp:refreshed` MUST NOT be relied on in the `react` host. The page view is dispatched by `startStandardEvents()` whenever `options.analytics` is true, independent of `usable`. Server import of `<pkg>/elements` and `<pkg>/commerce` is gated by test E-30. | 05 |
| 26 | Manifest and CLI | MB-8 enforces `full` for the 12 ids D-005 names; other components state their level in their own document. The `__PKG__` install transform is a no-op on a built registry. `generateBlueprintHtml` (G10) is a function in `src/gen/index.ts`; `installTransform` is in `src/cli/plan.ts`. `rp-icon` is installed as `core/snippet:icon`. RP309 detection is the text search of doc 07. `agent.actions[]` entries are objects with `name`, `description`, `confirm` (doc 11 names them; doc 08 owns descriptions). `settingType` is `select`. `:scope` is doc 07's extension for `rules[]` and means the root. The `.data` specifier is written with `.ts` on Remix. RP118 accepts the three test attributes only under `test/` or `.ripple-conformance/`. A locale patch creates `locales/en.default.json` or `en.default.schema.json` when absent; the storefront file has the single top-level key `ripple`. `span` and `hidden` are listed in manifest `props[]` (doc 09 FC-4); doc 07 adds them at emission when a component file omits them. The fixture theme `test/fixtures/theme-min/layout/theme.liquid` contains a `{{ content_for_header }}` line, the anchor that `core/patch:head` needs. | 07 |
| 27 | Tier 7 skips | A `mock.shop has no <thing>` skip fails the nightly run under `--no-skips` and is never a merge gate (Q24). | 13 |
| 28 | CSS | Tokens plus base stay within 2,200 bytes (Q25). A class token is owned by the component whose manifest lists it; `rp-visually-hidden` is owned by `base.css`. `rp-view-event` stays in the generated script-state selector lists (no effect). The spike files under `research/spikes/styling-doc03/` are historical and MUST NOT be copied. | 03 |
| 29 | Evals | Start states use the overlays of doc 08 that remove the pre-solved pieces of the layout blueprint. Reference solutions exist for the npm hosts by M4 and for Liquid by M5 (D-067). T16 "payment icons" is an escape-hatch task (no component). The nightly `evals` job of doc 08 section 8.14 is part of `nightly.yml`; its secret is `RIPPLE_EVAL_API_KEY`. | 08, 13 |
| 30 | Bindings lint | `dangerouslySetInnerHTML` is allowed in exactly three React files: `predictive-search.tsx`, `product-recommendations.tsx`, `rich-text.tsx`. | 06 |

- Rationale: each row is the simplest rule that matches what was run or read in source, or the text of the owning document under D-069.
- Rejected: leaving any of these to the implementer.
- Evidence: the appliers' reports; the documents named in the Owner column.

#### D-111 Rule kind `custom`

- Decision: manifest `rules[].kind` gains a seventh value, `custom`. Such an entry has only `id`, `kind`, `message`, `fix`. Its detection is a function stored under the rule id in `CUSTOM_RULES`, exported by `src/check/rules/RP113.ts`, with the signature `(root: Element) => Element[]` (the violating elements). RP113 reports it like any other structure rule. The detection sentence in the component document is normative. `pnpm gen --check` fails when a `custom` rule has no function or a function has no rule. The first nine are in doc 09: `field-one-control`, `field-label-for`, `field-describedby`, `field-invalid`, `radio-group-legend`, `radio-group-one-name`, `radio-group-one-checked`, `rich-text-plain-html`, `video-needs-source`.
- Rationale: these rules compare attribute values or count across parts, which the six selector kinds cannot express; the component documents already state them as sentences and Field's acceptance test expects one RP113 finding per rule.
- Rejected: a richer declarative rule language (larger than the nine functions); new `RPnnn` ids (D-059 forbids component-specific ids).
- Owner: doc 07 section 9.5.3 (schema and evaluation); the component documents (sentences).

#### D-112 Delta fixtures of doc 12 are written with the component

- Decision: in doc 12, a fixture printed as one complete fenced HTML block is a reference file as written. Every other fixture is a DELTA fixture: the document gives its props and one sentence stating what its HTML shows. The file `components/<id>/fixtures/<name>.html` of a delta fixture is written by the implementation task of that component, from the component's HTML contract and the stated props, and MUST satisfy the sentence. It is then held to the same gates as every fixture (contract lint tier 1, four-host conformance tier 2). Where the sentence says "equal to `default`" or "the empty string", the file is exactly that. The 34 delta fixtures are:
  - Header: `default-body-plain`, `class`, `unknown-scheme`.
  - Footer: `policies`, `scheme`, `class`.
  - AnnouncementBar: `class`.
  - NavigationMenu: `escaping`, `class`.
  - MobileNav: `deep`, `empty`, `invalid-enum-falls-back`, `class`.
  - LinkList: `invalid-enum-falls-back`, `escaping`, `class`.
  - Logo: `invalid-enum-falls-back`, `class`.
  - LocaleSelector: `countries-only`, `single-locale`, `invalid-enum-falls-back`, `class`.
  - AccountLink: `class`.
  - NewsletterForm: `success`, `error`, `class`.
  - Hero: `invalid-enum-falls-back`, `escaping`, `class`.
  - FeaturedCollection: `carousel`, `empty`, `invalid-enum-falls-back`, `responsive`, `class`.
- Rationale: each delta differs from a printed fixture by one attribute or one part; printing 34 more blocks by hand, unrendered, would add copies that nothing has checked, while the conformance tier checks the written files in four hosts.
- Rejected: converting them in the document without rendering them.
- Owner: doc 12 section 0 (rule and list).

#### D-113 Status of code that was not run, and of doc 06's example bindings

- Decision:
  1. Doc 13 code marked NOT RUN is the required starting text of that file. The behaviour tables and the named gate tests next to it are normative. When the printed code fails its gate, the code is changed and the gate is not weakened; such a change needs no ledger entry. The blocks concerned: `fixtures.ts` (`hostHasProp`, `resolveSample`, `loadBlueprintSample`), `liquid-shim.ts`, `serve-theme.ts`, `server.ts`, `collect.ts`, `conformance.test.ts`, `hosts/index.ts`, `hosts/html.ts`, the FX-4 and RS-3 additions of `hosts/liquid.ts` and `hosts/tsx.ts`, `createLiquidRenderer`, `hosts/react.ts`, `hosts/remix.ts`, `upgrade.test.ts`, `axe.test.ts`, `render.test.ts`, and tier 7 (E-1).
  2. Doc 06 sections 6.4 to 6.7, 7.4 to 7.7 and 8.4 to 8.7 illustrate the binding PATTERN of each host. They are not the binding files. Each opens with a "Copy rule" notice that lists how the code differs from the owning component document. The binding file of a component is written (or generated) from its component document, and the conformance tier is the gate.
- Rationale: the code could not be executed in the writing environment (no browsers for every tier, no mock.shop access); naming the gate and the direction of repair removes the ambiguity. Rewriting twelve example bindings by hand would create unchecked copies of docs 09 to 11.
- Rejected: marking the code as illustrative only (the harness would then have no starting text).
- Owner: doc 13 section 0; doc 06 sections named above.
