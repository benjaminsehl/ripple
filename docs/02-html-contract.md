# 02 - HTML contract

Status: normative. Date: 2026-11-21. Governed by `00-decisions.md` (the ledger). Where this document and the ledger disagree, the ledger wins. Component markup shown here is a copy of the owning component document (D-069); where a copy differs from its source, the source wins and the copy is the defect.

## 0. Scope and how to read this document

This document owns the rules that every component contract obeys:

1. the three kinds of markup (section 2);
2. naming of classes, elements, parts, ids, state attributes and hook attributes (section 3);
3. how a prop becomes an attribute (section 4);
4. the responsive value grammar (section 5);
5. slots, parts and content models (section 6);
6. upgrade stability and upgrade allow-lists (section 7);
7. the initial state the server writes, per interactive pattern (section 8);
8. progressive enhancement rules with testable criteria (section 9);
9. accessibility requirements with testable criteria (section 10);
10. the fixture format (section 11);
11. the canonicalisation algorithm used to compare hosts (section 12).

It does NOT own, and links to instead:

| Topic | Owner |
|---|---|
| The exact contract of each component | `09-components-foundation.md`, `10-components-interactive.md`, `11-components-commerce.md`, `12-components-chrome-and-blueprints.md` |
| CSS, tokens, `props.css`, pre-upgrade CSS | `03-styling-and-tokens.md` |
| Element behaviour, runtime, Invoker Commands polyfill, opener listener | `04-elements.md` |
| Cart store, form dialects, regions, refresh | `05-commerce.md` |
| Binding code per host, `rv()`, `cx()`, `useElement` | `06-bindings.md` |
| Manifest schema, contract template language, generator, checker rule definitions | `07-manifest-registry-cli.md` |
| Test harnesses that run the fixtures | `13-testing.md` |

Normative words: MUST, MUST NOT, SHOULD, MAY. Every rule has an id (for example `C-1`, `N-3`) so that other documents, tests and checker messages can cite it. Rule id prefixes used here: `C` contract, `N` naming, `M` prop mapping, `G` responsive grammar, `S` slots and parts, `U` upgrade stability, `I` initial state, `PE` progressive enhancement, `A` accessibility, `F` fixtures, `K` canonicalisation. (The prefixes `R-` and `L-` belong to the React and Liquid rules in `06-bindings.md`.)

Terms (render host, backend, binding, contract, fixture, mask, part, region, upgrade, upgrade-stable, allow-list) have the meanings of the ledger glossary (`00-decisions.md` section 9).

Evidence paths are relative to the directory that holds the local clones (`uisdk/`, `hydrogen/`, `remix/`, `tobi/`, `ripple/`).

---

## 1. The contract in one page

- **C-1** Each component has exactly one HTML contract: the exact light-DOM markup (tags, classes, attributes, ids, part order, text) for its initial state. (D-002)
- **C-2** Every render host (`html`, `react`, `remix`, `liquid`) MUST print that markup on the server. Two outputs conform when their canonical forms (section 12) are byte-equal.
- **C-3** The contract is upgrade-stable: it is the DOM as it is AFTER custom elements upgrade. When `ripple.js` loads, nothing inside a component root may change except entries on the upgrade allow-list (section 7).
- **C-4** The contract is normative HTML, not a description. In a component spec the fenced `html` block of a fixture is the contract; prose never overrides it.
- **C-5** Contract markup MUST be valid HTML that parses to the same tree in every browser: lowercase tag and attribute names; double-quoted attribute values; no self-closing syntax on non-void elements; no duplicate attributes; no element nested where the HTML parser would move it (no `<div>` inside `<p>`, no interactive element inside `<a>` or `<button>`, no `<form>` inside `<form>`).
- **C-6** Contract markup MUST NOT contain: a shadow root or `<template shadowrootmode>` (D-004); `<script>` (the two JSON `<script>` elements Ripple defines, the config element `#rp-commerce` and the payload child of `rp-view-event`, are printed by blueprints and by `snippets/rp-head.liquid`, never by a component contract; C-20); `<style>`; an inline `style` attribute (sole exception: a `style` value that a `ui-*` element writes for the initial state and that the component spec lists); any attribute whose name matches `/^on/i` (D-023); a Tailwind utility class (D-024 item 5); `data-state` (D-021); a comment that carries meaning.
- **C-7** Contract markup MUST NOT depend on whitespace text nodes. Two contracts that differ only in whitespace between tags are the same contract (section 12). Spacing between inline parts is done with CSS, never with a literal space between elements.
- **C-8** The only classes Ripple prints are the root class `rp-<component id>` and part classes `rp-<component id>-<part>` (section 3.1; the one exception to the pattern is QuantityInput, N-1). Two `rp-` classes appear on one element only for composition by contract (N-3). The caller's `class` value is appended after them, unchanged.
- **C-9** Fixtures describe the initial state only. DOM after an interaction (open, close, select) is asserted by behaviour tests, never by HTML equality (D-021 item 5).

Acceptance for this section: `pnpm gen --check` passes and the fixture lint of section 11.8 reports zero findings for every fixture.

---

## 2. The three kinds of markup

A contract is built from exactly three kinds of markup. No fourth kind exists. (`rp-view-event`, C-20, is an infrastructure element printed by blueprints; it is not part of any component contract.)

| Kind | What it is | JavaScript needed | Who gives it behaviour | Example |
|---|---|---|---|---|
| **Static markup** | Native HTML elements with `rp-` classes, `data-<prop>` attributes, native state attributes and ARIA | none | the browser | `<button class="rp-button" type="button" data-variant="primary" data-size="md">` |
| **`ui-*` elements** | UI SDK custom elements from `@ui-sdk/web` | yes, for behaviour; markup is complete without it | UI SDK | `<ui-tabs class="rp-tabs" id="t" default-value="account" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs">` |
| **`rp-*` elements** | Ripple custom elements built on the UI SDK kernel | yes, for enhancement; markup works without it | Ripple (`04-elements.md`, `05-commerce.md`) | `<rp-quantity class="rp-quantity" data-slot="rp-quantity">` |

### 2.1 Static markup

- **C-10** Static markup is the default. A component MUST use only static markup unless `00-decisions.md` D-007 assigns it a custom element.
- **C-11** Native interactive behaviour MUST come from native elements and attributes: `<a href>`, `<button>`, `<form>`, `<input>`, `<select>`, `<textarea>`, `<label>`, `<details>` / `<summary>`, `<dialog>`, the `popover` attribute, `popovertarget`, `commandfor` / `command`.

### 2.2 `ui-*` elements

- **C-12** The only `ui-*` tags allowed in any contract are the Tabs, Tooltip and Toast families (D-022 item 4):

  | Family | Tags |
  |---|---|
  | Tabs | `ui-tabs`, `ui-tabs-list`, `ui-tabs-tab`, `ui-tabs-panel` |
  | Tooltip | `ui-tooltip`, `ui-tooltip-trigger`, `ui-tooltip-content` |
  | Toast | `ui-toast-region` (and what the `toast()` helper creates inside it at runtime) |

  Any other tag that starts with `ui-` is a checker error (RP111).
- **C-13** A `ui-*` contract is the post-upgrade DOM of the element for the initial state, plus Ripple's `rp-` classes. It is produced by upgrade snapshot (section 11.4), never typed from the UI SDK documentation, because the documentation snippets omit attributes the element writes (`hidden`, `role`, `data-slot`, ids). Evidence: `ripple/docs/research/uisdk-web-elements.md` sections 2.3 and 3; `ripple/docs/research/spikes/uisdk-web/site/pe-body.html`.
- **C-14** A UI SDK wrapper part (`ui-tabs-tab`, `ui-tooltip-trigger`) MUST contain the native `<button>` it binds as its first element child. The `rp-` class, the accessible name and all ARIA go on the `<button>`, not on the wrapper. In V1 the bound element is always a `<button>`: a link (`<a href>`, or a Button with `href`) MUST NOT be a tooltip trigger, because UI SDK writes `type="button"` on it (D-082). The Tooltip trigger is the caller's own Button or IconButton, wired by the prop `tooltip` (M-4 row 20). Evidence: `boundElement` / `wrappedButton` in `uisdk/packages/web/src/define-element.ts`; `10-components-interactive.md` (Tooltip).
- **C-15** The roots `ui-tabs` and `ui-tooltip` MUST have an `id` (D-020). Without it UI SDK generates `ui-sdk-<name>-<counter>`, which a server cannot predict. `ui-toast-region` has no `id` prop: nothing in its server markup is linked by id (`10-components-interactive.md`, Toast). Evidence: `uisdk/packages/web/src/define-element.ts` (`connectedCallback`); `ripple/docs/research/uisdk-web-elements.md` section 2.2.

### 2.3 `rp-*` elements

- **C-16** An `rp-*` element is ONE custom element tag per component: the root. Its parts are native descendants marked with `data-rp-part="<part>"` (D-019). There are no `rp-*` part tags.
- **C-17** The complete list of `rp-*` component tags in V1 is: `rp-dialog`, `rp-quantity`, `rp-carousel`, `rp-navigation-menu`, `rp-cart`, `rp-product-form`, `rp-live`, `rp-predictive-search`, `rp-recommendations` (D-007). The only other `rp-*` tag is the infrastructure element `rp-view-event` (C-20). Any other tag that starts with `rp-` is a checker error (RP111).
- **C-18** An `rp-*` component root (a tag of C-17) MUST carry `data-slot="<its own tag name>"` and its manifest root class: `<rp-dialog class="rp-dialog" data-slot="rp-dialog">`. One tag MAY serve several components with different classes: `rp-dialog` for Dialog, Drawer, MobileNav, CartDrawer and the lightbox of ProductGallery; `rp-cart` for CartLink, CartLines, CartSummary, CartNote and DiscountCode, and inside CartDrawer; `rp-live` for VariantPicker, Filters, FilterChips, SortSelect and LiveForm. `data-slot` is always the tag name, never the component id.
- **C-19** Everything an `rp-*` element needs MUST be readable from the DOM at event time (attributes and form values). The contract MUST NOT require the element to create, remove or reorder nodes (D-045), with one exception: the text of elements marked `data-rp-part="count"`, `data-rp-part="error"` and `data-rp-part="status"`, and the `hidden` attribute of the `count` and `error` parts (D-045).
- **C-20** `rp-view-event` is an infrastructure element (D-089). It belongs to no component, has NO class and NO `data-slot`, and is not built on the UI SDK kernel. It is allowed ONLY in blueprint files (`product`, `collection`, `search`, `cart`); a component contract, a component fixture and a registry component file MUST NOT contain it (fixture lint `c-12`). It has exactly two forms, the same in every host:
  - attribute form (product, collection and search views): `<rp-view-event view-event-trigger="connect" view-event-payload="<JSON text>"></rp-view-event>`;
  - child form (cart view, because the payload is large): `<rp-view-event view-event-trigger="connect"><script type="application/json" data-view-event-payload><JSON text></script></rp-view-event>`.

  The payload differs by backend and is masked in blueprint conformance tests. Its content is owned by `05-commerce.md`; its placement by `12-components-chrome-and-blueprints.md`.
- **C-21** Every `rp-*` tag, including `rp-view-event`, is `display: block` (D-080). `rp-dialog` is additionally `position: absolute; inline-size: 0; block-size: 0`. A contract MUST NOT rely on an `rp-*` root being `display: contents` or having no box: where children must be laid out by an outer grid or flex container, the `rp-*` root is the grid or flex item. `ui-*` tags keep the display value UI SDK gives them. The rules are generated into `base.css` from the manifest key `elements` (`03-styling-and-tokens.md`).

### 2.4 Decision procedure: which kind does a new piece of markup use?

Apply in order; stop at the first match.

1. Is the behaviour in the D-007 table of `00-decisions.md`? Use the mechanism in that row. No other mechanism is allowed.
2. Does it work with a native element or attribute and no script? Static markup.
3. Does it bind a Hydrogen store or request a region refresh? It belongs inside one of the commerce `rp-*` elements of C-17 (`05-commerce.md`).
4. Otherwise it is not a V1 component: write it as static markup and document the missing behaviour, or raise a ledger issue. A new custom element MUST NOT be added without a ledger change.

---

## 3. Naming

### 3.1 Classes

- **N-1** Root class: `rp-<component id>`. Part class: `rp-<component id>-<part>`. Component ids and part names are kebab-case (`00-decisions.md` section 4.1). Examples: `rp-button`, `rp-product-card`, `rp-dialog-title`, `rp-product-card-media`. The manifest key `root.class` (and a part's `class` key) is authoritative: tools read the class from the manifest and never compute it from the id. There is ONE exception to the pattern `rp-<component id>`: QuantityInput (id `quantity-input`) has the root class `rp-quantity` and the part classes `rp-quantity-<part>` (`rp-quantity-button`, `rp-quantity-input`) (D-015). Its CSS file is still `quantity-input.css`.
- **N-2** The `class` attribute of a root is printed as: the manifest `root.class` value, one space, the caller's `class` value. The caller's value is never merged, reordered, de-duplicated or validated. When the caller passes no class, the attribute value is exactly the `root.class` value (a trailing space is tolerated by canonicalisation, K-7).
- **N-3** Composition by contract (D-070). When a component's root, or one of its parts, IS another component's element (the base), printed by the composing binding itself and following the base contract exactly, the element carries the base class FIRST, then the added class: `class="rp-drawer rp-cart-drawer"`, `class="rp-drawer rp-mobile-nav"`, `class="rp-button rp-add-to-cart-button"`, `class="rp-button rp-checkout-button"`, `class="rp-input rp-search-form-input"`, `class="rp-icon-button rp-cart-line-remove"`, `class="rp-badge rp-product-card-badge"`, `class="rp-dialog-title rp-visually-hidden"`. The manifest `root.class` (or the part's `class`) holds both classes in that order, and `dependencies.components` lists the base component. Two `rp-` classes on one element are legal ONLY when the manifest lists exactly that pair, in that order (fixture lint `c-8`). This is different from embedding (S-10), where the binding calls the other component and the embedded markup carries only the embedded component's classes.
- **N-4** No state, variant, size or responsive information is ever expressed as a class. There is no `rp-button--primary`, no `is-open`, no `rp-hidden`.
- **N-5** CSS selects classes and the attributes of sections 3.4 and 4. JavaScript MUST NOT select classes (D-024 item 6); it selects the hook attributes of section 3.5.

### 3.2 Custom element tags

- **N-6** Ripple tags are `rp-<name>` (list in C-17). UI SDK tags are `ui-<name>` (list in C-12). The primitive `name` of an `rp-*` element equals its tag (D-019).
- **N-7** A custom element tag MUST be written with an explicit end tag and MUST NOT be self-closed.

### 3.3 Ids

- **N-8** Components whose parts are linked by id have a REQUIRED `id` prop in every host: Dialog, Drawer, Popover, Tabs, Accordion with `type="single"`, Field, Tooltip, Carousel, ProductGallery, ProductForm, VariantPicker, CartDrawer, CartLines, CartNote, DiscountCode, Filters, SortSelect, PredictiveSearch, NavigationMenu, MobileNav, LocaleSelector, NewsletterForm (D-020). No host generates an id (no `useId`, no `block.id`, no counter). The `id` of a CartDrawer defaults to `cart-drawer` and MUST equal the commerce option `cartDrawer` (D-087).
- **N-9** Part ids are derived from the root id with these suffixes and no others:

  | Suffix | Used for |
  |---|---|
  | `<id>-title` | title of a dialog or drawer (Popover's optional title part has NO id, D-010) |
  | `<id>-description` | description of a dialog, drawer or field |
  | `<id>-error` | error message of a field |
  | `<id>-trigger` | the single trigger of a component |
  | `<id>-content` | the single content element (tooltip content) |
  | `<id>-tab-<value>` | a tab |
  | `<id>-panel-<value>` | a tab panel |
  | `<id>-item-<value>` | an item of a list-like component. For NavigationMenu the panel id is `<id>-item-<n>`, where `n` is the 1-based position of the top-level item (D-017) |
  | `<id>-list` | a list container |
  | `<id>-live` | a live region owned by the component |
  | `<id>-form` | the Liquid cart form printed by CartLines (`<cart lines id>-form`, D-092) |

- **N-10** `<value>` in a derived id is the part's `value` prop; for NavigationMenu it is the number `n` of N-9. A `value` used in an id MUST match `^[a-z0-9][a-z0-9_-]*$`.
- **N-11** A root `id` MUST match `^[a-zA-Z][a-zA-Z0-9_-]*$` and MUST be unique in the document. Every derived id MUST be unique in the document. (Checker RP114.)
- **N-12** Where the ledger or the owning component document fixes which element carries the root id, that is followed: for Dialog and Drawer the `id` is on the `<dialog>`, not on `rp-dialog` (D-008); for Field the `id` prop is the id of the CONTROL and is NOT printed on the Field root (D-014); for ProductForm the `id` is on the `<form>` (`11-components-commerce.md`).
- **N-13** A part or component rendered by a different file receives the root id through a prop named after the root component, in camelCase: `dialog`, `drawer`, `tabs`, `popover`, `field`, `tooltip`, `accordion`, `cartLines` (D-020). Liquid uses the snake_case form (`cart_lines`). The prop is never named `for` and never `form` (both are reserved in Liquid). The native `form` attribute, which associates a control with a form elsewhere in the document, is printed by the prop `formId` (Liquid `form_id`; M-4 row 16).

### 3.4 State attributes

State is expressed ONLY with the attributes in this table (D-021). `data-state` MUST NOT be used.

| Attribute | Form | Meaning | Written by |
|---|---|---|---|
| `open` | boolean | `<details>` is expanded; `<dialog>` is open | server (`<details>` only) / browser |
| `hidden` | boolean, or `hidden="until-found"` | not rendered (unselected tab panels, tooltip content, an empty error part, a count part whose quantity is 0) | server / element |
| `disabled` | boolean | native control is disabled | server / element |
| `checked` | boolean | checkbox, radio or switch initial state | server |
| `selected` | boolean | `<option>` initial state | server |
| `aria-expanded` | `"true"` or `"false"` | disclosure state of a script-driven trigger. No V1 contract prints it on the default path (I-2); it appears only in the SPIKE-07 fallback contract of NavigationMenu (`12-components-chrome-and-blueprints.md`) | server and element |
| `aria-selected` | `"true"` or `"false"` | tab selection | server and UI SDK |
| `aria-current` | `"page"` or `"true"` | current page link; current item of a set | server |
| `aria-invalid` | `"true"` (absent when valid) | control has an error | server / element |
| `aria-busy` | `"true"` (absent when idle) | mutation in flight | server (`pending` prop) / element |
| `aria-disabled` | `"true"` (absent when enabled) | disabled link | server |
| `data-open`, `data-closed` | presence (`=""`) | UI SDK popup state | UI SDK / server snapshot |
| `data-selected`, `data-checked`, `data-active`, `data-current` | presence (`=""`) | UI SDK item state | UI SDK / server snapshot |
| `data-disabled` | presence (`=""`) | UI SDK disabled state | UI SDK / server snapshot |
| `data-pending` | presence (`=""`) | mutation in flight (always together with `aria-busy="true"`) | server (`pending` prop) / element |

- **N-14** A presence attribute is printed with an empty value: `data-pending=""` (HTML shorthand `data-pending` is equivalent; canonicalisation makes them equal, K-8). It is absent when false. It MUST NOT be printed as `data-pending="true"` or `data-pending="false"`.
- **N-15** An ARIA state attribute MUST be printed with the literal string value shown in the table, never as a boolean attribute.
- **N-16** Attributes that UI SDK writes and Ripple reserves (`data-align`, `data-side`, `data-orientation`, `data-type`, `data-value`, `data-count`, `data-index`, `data-open`, `data-closed`, `data-disabled`, `data-pending`, `data-selected`, `data-checked`, `data-active`, `data-current`, `data-slot`) MUST NOT be selected by Ripple CSS without a component class in the same selector (`00-decisions.md` section 4.3). A component MAY select its own manifest prop attribute even when the name is on this list (`data-side`, `data-align`, `data-columns`, `data-type`, `data-value`), always together with its own class (D-024). `data-starting-style` and `data-ending-style`, which UI SDK writes for animation, MAY be selected in Tabs, Tooltip and Toast CSS with the component class in the selector (D-021); they are never printed by a server.

### 3.5 Hook attributes (complete list)

Hook attributes are read by JavaScript and by tests. CSS MUST NOT select them; the only exception is the generated `data-rp-js` rules, which are written in the file `base.css` inside `@layer rp.props` (D-021; `03-styling-and-tokens.md`). Any `data-rp-*` attribute name not in this table is a checker error (RP118). The table is the one of `00-decisions.md` section 4.4.

| Attribute | Allowed on | Value | Meaning |
|---|---|---|---|
| `data-slot` | `rp-*` component roots (C-18) | the tag name | UI SDK kernel part marker (D-019) |
| `data-slot` | elements bound by UI SDK inside the Tabs, Tooltip and Toast families | the value UI SDK writes: `tabs`, `tabs-list`, `tabs-tab`, `tabs-panel`, `tooltip-trigger`, `tooltip-content`, `toast-region` (N-17) | Printed by the server because it is part of the upgrade snapshot. `ui-tooltip` itself carries none. The Tooltip trigger button gets `data-slot="tooltip-trigger"` from the `tooltip` prop (D-082) |
| `data-rp-part` | native descendants of an `rp-*` root | part name, kebab-case | Identifies a part to the element. Shared names: `count`, `error`, `status`, `input`, `increment`, `decrement`, `prev`, `next`, `viewport`, `item`, `results`, `submit`, `remove`, `trigger` |
| `data-rp-field` | form controls in commerce forms | `merchandise-id`, `quantity`, `line-id`, `selling-plan`, `note`, `discount-code` | Dialect-independent field identity (D-043). Printed by the prop `rpField` (Liquid `rp_field`) on Input, Textarea and Select; always printed as `quantity` by QuantityInput |
| `data-rp-line` | cart line root | line id (hydrogen backend) or line key (liquid backend) | Identifies a cart line |
| `data-rp-open` | `<a href>` openers | id of a `<dialog>` | Opener pattern (D-009). Printed only by the prop `dialog` of Link, Button and IconButton. On the SPIKE-05 fallback path also on `<button>` openers (section 15) |
| `data-rp-close` | `<button>` closers | id of a `<dialog>` | SPIKE-05 fallback path ONLY (section 15); never printed on the default path |
| `data-rp-refresh` | forms and links inside an `rp-live` or `rp-cart` root; `rp-live`, `rp-cart`, `rp-predictive-search`, `rp-recommendations` roots. NOT on `rp-product-form` | space-separated region names | Regions to refresh after the action (D-046) |
| `data-rp-region` | region root element | one region name | Marks a refreshable region (D-046, D-091) |
| `data-rp-js` | controls that are descendants of an `rp-*` root; also a `<form>` that is a descendant of an `rp-*` root (the Liquid discount form, D-092) | `inflow`, `overlay`, `fallback` | Visibility relative to element definition (D-021, PE-4) |
| `data-default-open` | `<dialog>` | empty | Open on connect (D-008) |
| `data-url` | `rp-recommendations` root | URL | The document to fetch the recommendations region from (D-046) |
| `view-event-trigger`, `view-event-payload` | `rp-view-event` | `view-event-trigger`: `connect` (the only trigger blueprints use in V1) or `intersect`. `view-event-payload`: JSON text | View analytics (D-089, C-20). Not `data-` attributes: the names are fixed by `@shopify/standard-events` |
| `data-view-event-payload` | the `<script type="application/json">` child of `rp-view-event` | empty | The child form of the payload, used for the cart view (D-089, C-20) |
| `data-template` | `<main>` in the Liquid layout only | page type | Read by the Liquid page-view dispatch (D-089) |
| `data-agent-confirm` | controls | one sentence | Agent bridge: needs confirmation (D-065). REQUIRED on CheckoutButton (D-095) |
| `data-agent-secret`, `data-agent-hidden` | controls | empty | Agent bridge (D-065) |
| `data-rmx-*` | Remix output only | see `06-bindings.md` | Host extras; never in a contract; removed by canonicalisation (K-4) |
| `data-rp-case`, `data-rp-fixture`, `data-rp-test-raw` | test pages built by the harness of `13-testing.md` | harness-defined | Test harness only; MUST NOT appear in a component, blueprint or registry file |

One element id is reserved: `rp-commerce`, the id of the config element `<script type="application/json" id="rp-commerce">` (D-087). No component, blueprint or caller may use it for another element.

- **N-20** A hook attribute that has a prop MUST be printed through that prop and MUST NOT be passed through TSX rest props or the Liquid `attributes` param: `data-rp-open` (prop `dialog`), `data-rp-field` (prop `rpField`), and the Tooltip trigger pair `aria-describedby` + `data-slot="tooltip-trigger"` (prop `tooltip`). `data-rp-region` is the ONLY Ripple hook attribute that may be passed through rest props or `attributes`; it is used that way for blueprint-owned regions (D-091; M-14).

- **N-17** `data-slot` values inside the three `ui-*` families are written by UI SDK and are part of the snapshot. The values observed for `@ui-sdk/web@0.1.0-beta.14` are:

  | Element | `data-slot` |
  |---|---|
  | `ui-tabs` | `tabs` |
  | `ui-tabs-list` | `tabs-list` |
  | the `<button>` inside `ui-tabs-tab` | `tabs-tab` |
  | `ui-tabs-panel` | `tabs-panel` |
  | `ui-tooltip` | none |
  | the `<button>` inside `ui-tooltip-trigger` | `tooltip-trigger` |
  | `ui-tooltip-content` | `tooltip-content` |
  | `ui-toast-region` | `toast-region` |

  All of these are printed by the server. Evidence: `ripple/docs/research/spikes/uisdk-web/out/all-bare.diff.txt` (sections `c-tabs`, `c-tooltip`, `c-toast`); `10-components-interactive.md` (fixtures of Tabs, Tooltip, Toast).
- **N-18** A `data-rp-part` value MUST be unique within its `rp-*` root unless the component spec declares the part `multiple` (for example `item`). The nearest `rp-*` ancestor owns the part.
- **N-19** A hook attribute is never the only carrier of meaning for assistive technology or CSS. Removing every hook attribute from a page MUST leave the no-JS rendering unchanged, except `data-rp-js` (which exists to change pre-upgrade rendering).

---

## 4. Prop-to-attribute mapping

### 4.1 Name conversion

- **M-1** `kebab(name)`: insert `-` before every ASCII uppercase letter, then lowercase the string. `fullWidth` gives `full-width`; `gapX` gives `gap-x`; `textAlign` gives `text-align`.
- **M-2** `snake(name)`: the same with `_` instead of `-`. `fullWidth` gives `full_width`.
- **M-3** Surfaces: manifest and TSX use the camelCase name; Liquid params use `snake(name)`; HTML uses the attribute decided by M-4. No component may define an exception (`00-decisions.md` section 4.2).

### 4.2 Which attribute a prop becomes

- **M-4** Apply the first matching row. The result for every prop is recorded in the manifest key `prop.attribute` and in the "Renders as" column of the owning component spec; tools read the manifest key and never re-derive it from this table.

| # | Prop | Rendered as |
|---|---|---|
| 1 | `class` (`className` in React) | appended to the `class` attribute (N-2) |
| 2 | `as` (allow-listed tag), `level` (Heading) | selects the element tag; prints no attribute. (Stack, Inline and Grid additionally print `role="list"` when `as` is `ul` or `ol`, D-086.) |
| 3 | A prop that IS a native attribute of the element: `id`, `href`, `target`, `rel`, `type`, `name`, `value`, `checked`, `disabled`, `required`, `placeholder`, `min`, `max`, `step`, `pattern`, `rows`, `alt`, `width`, `height`, `loading`, `sizes`, `poster`, `autoplay`, `muted`, `loop`, `open` | the attribute with the same name. The boolean ones (`checked`, `disabled`, `required`, `autoplay`, `muted`, `loop`, `open`) are printed as a boolean attribute when true and omitted when false. Not matched here: the React-only controlled props `value` and `open` (row 25), and the three name clashes of M-4a |
| 4 | `ariaLabel` | `aria-label` |
| 5 | `describedBy` (form controls only; Dialog and Drawer have no such prop) | `aria-describedby` |
| 6 | `htmlFor` | `for` |
| 7 | `commandFor` / `command` | `commandfor` / `command` |
| 8 | `popoverTarget` | `popovertarget` |
| 9 | `fetchPriority` | `fetchpriority` |
| 10 | `invalid` | `aria-invalid="true"` when true; nothing when false |
| 11 | `pending` | `data-pending=""` and `aria-busy="true"` when true; nothing when false |
| 12 | `disabled` on a root that is `<a>` | `aria-disabled="true"` and `tabindex="-1"`; `href` stays |
| 13 | `defaultValue` | `value` (on `ui-tabs`: `default-value`; on Textarea: the text content of the element; on Select: as stated in `09-components-foundation.md`) |
| 14 | `defaultChecked` | `checked` |
| 15 | `defaultOpen` | `open` on `<details>`; `data-default-open=""` on `<dialog>` (never `open` on `<dialog>`, D-008) |
| 16 | `formId` (Input, Textarea, Select, QuantityInput, Button, IconButton) | the native attribute `form`. The prop is never named `form` (N-13) |
| 17 | `autoComplete` | `autocomplete` |
| 18 | `current` (Link, Breadcrumb item) | `aria-current="page"` when true; nothing when false |
| 19 | `dialog` on Link, and on Button and IconButton when `href` is set | `data-rp-open="<dialog id>"` (D-009). On a Button or IconButton without `href` the prop prints nothing |
| 20 | `tooltip` on Button and IconButton without `href` | `aria-describedby="<tooltip id>-content"` and `data-slot="tooltip-trigger"` (D-082). With `href` the prop prints nothing |
| 21 | `rpField` (Input, Textarea, Select) | `data-rp-field="<value>"` (D-043). QuantityInput has no such prop and always prints `data-rp-field="quantity"` on its input |
| 22 | `side`, `align` on Tooltip | the UI SDK option attributes `side` and `align` (NOT `data-side` / `data-align`, which UI SDK writes as state there), omitted at the default (D-082). The element that carries them is stated by the Tooltip contract in `10-components-interactive.md`. This is the only case where an enumerated prop does not print `data-<prop>` and does not print its default |
| 23 | `previousLabel`, `nextLabel` (Carousel, Pagination); `decreaseLabel`, `increaseLabel` (QuantityInput) | the accessible name of the control the component prints: `aria-label` on the Carousel and QuantityInput buttons; the link text in Pagination |
| 24 | A root-named id prop on a part or dependent component (`dialog`, `drawer`, `tabs`, `popover`, `field`, `tooltip`, `accordion`, `cartLines`; N-13) | no attribute of its own name; the part builds its derived ids and id references from it (N-9), for example `id="<tabs>-tab-<value>"`, `name="<accordion>"`, `form="<cartLines>-form"` |
| 25 | `selected` on TabsTab and TabsPanel; `icon` (IconButton, EmptyState); `strings` (TSX only); `html` (RichText); React-only `value`, `open` and `on<Event>` callback props | no attribute named after the prop. `selected` chooses the selected or unselected attribute set of the Tabs contract; `icon` prints an embedded Icon; `strings` replaces strings the component prints (D-066); `html` is printed raw as the element's content; the React-only props become element properties and listeners attached through `useElement` (`06-bindings.md`) |
| 26 | `rmxKey` (Remix only; components with an `rp-*` or `ui-*` root and no required `id`) | `data-rmx-key`, a host extra that is not part of the contract and is removed by canonicalisation (K-4); omitted when unset (D-034) |
| 27 | A prop of type `object` (`product`, `line`, `image`, `menu`, and every other resource prop of ledger 6.4) | never an attribute; the component reads fields from it. Image derives `alt`, `width` and `height` from its `image` object and always prints them, `alt` even when empty (D-049) |
| 28 | Every other prop | `data-` + `kebab(name)`, with the value rules of 4.3 |

- **M-4a** Name clashes with row 3. A name in row 3 is a native attribute only on a component whose printed element has that attribute. Three props of the shared vocabulary reuse a row 3 name with another meaning and fall to row 28: Container `width` prints `data-width`; Accordion `type` prints `data-type`; Rating `value` prints `data-value` (ledger 6.2 and 6.3).
- **M-4b** Rows 2 to 27 are the complete list of exceptions to row 28 for the shared vocabulary of ledger sections 6.1 to 6.4. The commerce and chrome props named in the last paragraph of ledger 6.4 (`refresh`, `layout`, `count`, and the others listed there) are mapped by `11-components-commerce.md` and `12-components-chrome-and-blueprints.md`, which state the attribute in "Renders as". Such a prop MUST follow row 28 unless it prints a hook attribute of section 3.5 (`refresh` prints `data-rp-refresh`) or a native attribute.

### 4.3 Value rules by prop type

| Type (manifest `type`) | True / set | False / unset |
|---|---|---|
| `enum` | `data-<prop>="<value>"`. The DEFAULT value MUST be printed when the prop is not passed, unless the component spec lists the attribute as "omitted at default". | (an `enum` with no default and no value prints nothing) |
| `enum`, value not in the enumeration | the default value is printed (M-6) | |
| `boolean` | `data-<prop>=""` | attribute absent |
| `scale`, not responsive | `data-<prop>="<step>"` | attribute absent |
| `enum` or `scale`, responsive | `data-<prop>="<token string>"`, printed unchanged (section 5) | the default value when the manifest has one; otherwise absent |
| `string`, `number`, `id`, `url` | the attribute with the value as text | attribute absent |

- **M-5** "Unset" means: not passed, `undefined`, `null`, Liquid `nil`, or the empty string. An empty string never prints an empty attribute. (Liquid tests `!= blank`; TSX bindings MUST omit the attribute for `undefined`, `null` and `""`.)
- **M-6** Enumerations are validated in every host at render time (D-073). A value that is not in the manifest `values` list is replaced by the default; when there is no default the attribute is omitted. Liquid uses the allow-list guard of `06-bindings.md`. TSX uses an inline `includes` guard on the generated `const` array of allowed values, of the form `ALLOWED.includes(value) ? value : DEFAULT` (`06-bindings.md`); no helper other than `rv()` and `cx()` is involved, and `rv(value, allowed, label)` only warns in development and never changes output. Fixture `invalid-enum-falls-back` (F-13) proves it in all four hosts.
- **M-7** A boolean prop is true only for the boolean `true`. The strings `"true"` and `"false"`, the number `1`, and any other truthy value are treated as false in every host. (In Liquid: `{% if x == true %}`.)
- **M-8** The responsive `hidden` prop is the one boolean-like prop with values: it renders `data-hidden="true"`, `data-hidden="true md:false"` (`00-decisions.md` section 4.3). Its allowed values are `true` and `false`.
- **M-9** Numbers are printed with `String(n)` semantics: no thousands separator, no trailing zeros (`4`, `0.5`, `1.5`).
- **M-10** Text content is always children. The only string props that carry content are accessible names (`ariaLabel`, and the control names of M-4 row 23) and RichText's `html` (D-035 item 5). The TSX-only `strings` prop overrides default strings a component prints itself; it is not a content prop (D-066).

### 4.4 Escaping

- **M-11** Every prop value printed into an attribute MUST be HTML-escaped (`&`, `<`, `>`, `"`, and in Liquid also `'`) and the attribute MUST be double-quoted. The only raw input is the Liquid `attributes` param.
- **M-12** Text printed from data (a product title) MUST be HTML-escaped. HTML fields (a product description, RichText `html`) are printed raw and are documented as HTML.
- **M-13** A tag name is interpolated only after validation against the component's allow-list (`as`, `level`). An invalid value falls back to the default tag.

### 4.5 Attribute order and caller-supplied attributes

Attribute order is not part of the contract (canonicalisation sorts attributes, K-6). For readable reference HTML, generators and hand-written bindings SHOULD print attributes in this order:

1. `class`
2. `id`
3. native attributes of M-4 rows 3, 6 to 9, 16 and 17, in manifest prop order
4. `data-<prop>` attributes, in manifest prop order
5. state attributes (section 3.4)
6. `role`, then `aria-*`
7. hook attributes (section 3.5)

- **M-14** Caller-supplied attributes (TSX rest props, Liquid `attributes`) MUST NOT be able to override a contract attribute. The mechanism differs by host because the two languages resolve duplicates in opposite directions:
  - TSX (`react`, `remix`): rest props are spread onto the root element BEFORE the contract attributes (`<button {...rest} className="rp-button" type="button">`); in JSX the later prop wins, so the contract wins.
  - Liquid and hand-written HTML: `{{ attributes }}` MUST be printed AFTER every contract attribute, as the last thing inside the start tag. The HTML parser keeps the FIRST occurrence of a duplicate attribute and drops later ones, so the contract wins. Verified with `parse5@8.1.1`: `<div class="a" class="b">` parses to `class="a"`. (D-035 item 4.)
  - A Ripple hook attribute that has a prop MUST NOT be passed through rest props or `attributes`; `data-rp-region` is the only hook attribute that may be (N-20, D-091).
  - A root printed by Liquid `{% form %}` accepts only `id` and `class`: it takes no `attributes`, no `span` and no `hidden` on Liquid (D-091 item 6). The TSX bindings of the same component accept no rest props on that element either, so that the hosts stay equal.
  - Icon accepts only `name` and `class`: no rest props, no `attributes`, no `span`, no `hidden` (D-068). `span` and `hidden` are also not accepted by SkipLink, VisuallyHidden and Announcer (ledger 6.1).
- **M-15** Caller-supplied attributes are applied to the root element only. Parts take extra attributes only through their own part component.
- **M-16** A caller-supplied attribute MUST NOT be `style` with a colour (checker RP116, warning), MUST NOT match `/^on/i`, MUST NOT be a `data-rp-*` name that is not in section 3.5 (RP118), and MUST NOT be one of the hook attributes that N-20 reserves for a prop.

### 4.6 Worked mapping

Two fixtures of Button, copied byte for byte from `09-components-foundation.md` (section "Button", "HTML contract"), which owns them.

Fixture `submit-pending` (`type="submit"`, `name="intent"`, `value="add"`, `size="lg"`, `fullWidth`, `pending`; `variant` not passed):

```html
<button class="rp-button" type="submit" name="intent" value="add" data-variant="primary" data-size="lg" data-full-width="" data-pending="" aria-busy="true">Add to cart</button>
```

What it shows: `type`, `name` and `value` are native attributes (row 3); `variant` is not passed, so its default `primary` is printed (4.3); `fullWidth` is a boolean and prints `data-full-width=""` (row 28, 4.3); `pending` prints two attributes (row 11).

Fixture `link-disabled` (`href="/cart"`, `variant="outline"`, `disabled`):

```html
<a class="rp-button" href="/cart" data-variant="outline" data-size="md" aria-disabled="true" tabindex="-1">View cart</a>
```

What it shows: `href` switches the element to `<a>`; `disabled` on an `<a>` prints `aria-disabled="true"` and `tabindex="-1"` and keeps `href` (row 12).

---

## 5. Responsive value grammar

One string grammar, identical in every host (D-028). There is no object form and there are no per-breakpoint props.

### 5.1 Grammar (ABNF, RFC 5234)

```abnf
prop-value  = token *( SP token )
token       = value / breakpoint ":" value
breakpoint  = "sm" / "md" / "lg" / "xl" / "2xl"
value       = segment *( separator segment )
segment     = 1*( %x61-7A / DIGIT )        ; a-z and 0-9
separator   = "." / "-" / "/"
SP          = %x20                          ; exactly one space
```

Equivalent regular expressions (anchored):

```text
token      ^(?:(sm|md|lg|xl|2xl):)?[a-z0-9]+(?:[./-][a-z0-9]+)*$
prop-value ^TOKEN(?: TOKEN)*$
```

### 5.2 Constraints beyond the grammar

- **G-1** `value` MUST be a member of the prop's allowed set: the manifest `values` list for an `enum` prop, or the manifest scale for a `scale` prop (space steps: `0 0.5 1 1.5 2 3 4 5 6 8 10 12 16 20 24 32`, D-029).
- **G-2** At most one unprefixed token, and at most one token per breakpoint.
- **G-3** Tokens SHOULD appear in ascending order: unprefixed, `sm`, `md`, `lg`, `xl`, `2xl`. Wrong order is a warning, not an error; rendering is unaffected.
- **G-4** No leading or trailing space; tokens are separated by exactly one U+0020. Tabs and newlines are errors.
- **G-5** The empty string is not a prop value. An unset prop prints no attribute (M-5).
- **G-6** Breakpoint prefixes are lowercase and are exactly the five names above. Their min-widths are `sm` 40rem, `md` 48rem, `lg` 64rem, `xl` 80rem, `2xl` 96rem (D-029). The names never change; the widths are changeable in `tokens.css` (`03-styling-and-tokens.md`).

### 5.3 Semantics

- **G-7** Mobile-first. An unprefixed token applies from width 0. A token `bp:value` applies at viewport widths greater than or equal to the min-width of `bp`.
- **G-8** At a given width the effective value is the value of the applicable token with the LARGEST breakpoint; when no token applies (for example `data-gap="md:6"` below `md`), the component's CSS default applies.
- **G-9** The attribute is matched by `props.css` with the whitespace-list selector `[data-<prop>~="<token>"]` inside the breakpoint's media query (`03-styling-and-tokens.md`). An unknown token matches no selector and has no effect; it is still an error for the checker (RP101, RP103).

### 5.4 Printing

- **G-10** Every host prints the value into the attribute escaped and otherwise UNCHANGED: no reordering, no whitespace normalisation, no de-duplication.
- **G-11** TSX: the prop type is `T | (string & {})`; a `scale` prop also accepts a bare number (`gap={4}`), which is printed as `"4"`. Liquid: the value is ALWAYS a quoted string (`gap: '4'`, `gap: '2 md:6'`); an unquoted number is a checker error (RP103).
- **G-12** Examples:

  | Call (TSX) | Call (Liquid) | Attribute |
  |---|---|---|
  | `gap={4}` | `gap: '4'` | `data-gap="4"` |
  | `gap="2 md:6"` | `gap: '2 md:6'` | `data-gap="2 md:6"` |
  | `columns="1 sm:2 lg:4"` | `columns: '1 sm:2 lg:4'` | `data-columns="1 sm:2 lg:4"` |
  | `direction="column md:row"` | `direction: 'column md:row'` | `data-direction="column md:row"` |
  | `hidden="true md:false"` | `hidden: 'true md:false'` | `data-hidden="true md:false"` |
  | `gap` not passed | `gap` not passed | no `data-gap` attribute |

### 5.5 Reference validator

`parseResponsive` is the single validator. `rv()` (development mode), the checker (RP101, RP103) and the fixture lint MUST call it; no other code may re-implement the grammar. It lives in `src/responsive.ts`; `rv()` (`src/index.ts`), the checker and the generator import it from that file. Strictness (D-028): tokens out of ascending order are a warning; extra whitespace, an empty string, an unknown value, an unknown breakpoint and a duplicate breakpoint are errors. This code was run against the cases in 5.6.

```ts
export const BREAKPOINTS = ["sm", "md", "lg", "xl", "2xl"] as const;
export type Breakpoint = (typeof BREAKPOINTS)[number];
export type ResponsiveErrorCode =
  | "empty"
  | "whitespace"
  | "bad-token"
  | "unknown-breakpoint"
  | "unknown-value"
  | "duplicate-breakpoint"
  | "order";
export interface ResponsiveError { code: ResponsiveErrorCode; token: string; message: string }
export interface ResponsiveToken { breakpoint: Breakpoint | null; value: string }
export interface ResponsiveResult { tokens: ResponsiveToken[]; errors: ResponsiveError[]; warnings: ResponsiveError[] }

const RE_VALUE = /^[a-z0-9]+(?:[./-][a-z0-9]+)*$/;

export function parseResponsive(input: string, allowed: readonly string[]): ResponsiveResult {
  const tokens: ResponsiveToken[] = [];
  const errors: ResponsiveError[] = [];
  const warnings: ResponsiveError[] = [];
  if (input === "") {
    errors.push({ code: "empty", token: "", message: "The value is empty. Omit the prop instead." });
    return { tokens, errors, warnings };
  }
  if (input !== input.trim() || /[\t\n\f\r]/.test(input) || input.includes("  ")) {
    errors.push({ code: "whitespace", token: input, message: "Tokens are separated by exactly one space, with no leading or trailing space." });
  }
  const seen = new Set<string>();
  let lastRank = -2;
  for (const raw of input.split(/[\t\n\f\r ]+/).filter(Boolean)) {
    const colon = raw.indexOf(":");
    const prefix = colon === -1 ? null : raw.slice(0, colon);
    const value = colon === -1 ? raw : raw.slice(colon + 1);
    if (prefix !== null && !(BREAKPOINTS as readonly string[]).includes(prefix)) {
      errors.push({ code: "unknown-breakpoint", token: raw, message: `"${prefix}" is not a breakpoint. Allowed: ${BREAKPOINTS.join(", ")}.` });
      continue;
    }
    if (!RE_VALUE.test(value)) {
      errors.push({ code: "bad-token", token: raw, message: `"${raw}" is not a token of the form value or breakpoint:value.` });
      continue;
    }
    if (!allowed.includes(value)) {
      errors.push({ code: "unknown-value", token: raw, message: `"${value}" is not allowed. Allowed: ${allowed.join(", ")}.` });
      continue;
    }
    const key = prefix ?? "";
    if (seen.has(key)) {
      errors.push({ code: "duplicate-breakpoint", token: raw, message: prefix === null ? "More than one unprefixed token." : `More than one token for breakpoint "${prefix}".` });
      continue;
    }
    seen.add(key);
    const rank = prefix === null ? -1 : (BREAKPOINTS as readonly string[]).indexOf(prefix);
    if (rank < lastRank) {
      warnings.push({ code: "order", token: raw, message: "Tokens should be in ascending breakpoint order: unprefixed, sm, md, lg, xl, 2xl." });
    }
    lastRank = Math.max(lastRank, rank);
    tokens.push({ breakpoint: prefix as Breakpoint | null, value });
  }
  return { tokens, errors, warnings };
}

/** The effective value when the breakpoints in `active` match (G-8). Returns null when no token applies. */
export function resolveResponsive(tokens: ResponsiveToken[], active: readonly Breakpoint[]): string | null {
  let result: string | null = null;
  let best = -2;
  for (const token of tokens) {
    const rank = token.breakpoint === null ? -1 : BREAKPOINTS.indexOf(token.breakpoint);
    if (token.breakpoint !== null && !active.includes(token.breakpoint)) continue;
    if (rank > best) {
      best = rank;
      result = token.value;
    }
  }
  return result;
}
```

### 5.6 Acceptance table

A unit test (`src/responsive.test.ts`) MUST assert exactly these results, with `allowed` = the space steps of G-1.

| Input | Tokens | Error codes | Warning codes |
|---|---|---|---|
| `4` | `4` | none | none |
| `2 md:6` | `2`, `md:6` | none | none |
| `sm:0.5 2xl:32` | `sm:0.5`, `2xl:32` | none | none |
| `md:6 2` | `md:6`, `2` | none | `order` |
| `2 md:6 md:8` | `2`, `md:6` | `duplicate-breakpoint` | none |
| `2 3` | `2` | `duplicate-breakpoint` | none |
| `2 tablet:6` | `2` | `unknown-breakpoint` | none |
| `2 MD:6` | `2` | `unknown-breakpoint` | none |
| `7` | none | `unknown-value` | none |
| `md:` | none | `bad-token` | none |
| ` 2` (leading space) | `2` | `whitespace` | none |
| `2  md:6` (two spaces) | `2`, `md:6` | `whitespace` | none |
| empty string | none | `empty` | none |

And for `resolveResponsive` on `2 md:6 xl:8`: active `[]` gives `2`; `["sm"]` gives `2`; `["sm","md","lg"]` gives `6`; `["sm","md","lg","xl","2xl"]` gives `8`. On `md:6` with active `[]` it gives `null`.

---

## 6. Slots, parts and content models

### 6.1 Content models

Every component declares one content model in the manifest (`content.model`).

| Model | Children allowed | Example |
|---|---|---|
| `none` | no children; the element is void or its content comes only from props | Image, Input, Separator, Icon |
| `text` | phrasing content: text, and inline elements such as Icon, `<span>`, `<strong>`, `<bdi>` | Button, Badge, Heading, Label |
| `flow` | any flow content, including other components | Stack, Card, Container |
| `parts` | only the component's own part components, in the order of the Anatomy table | Dialog, Tabs, Accordion, Field |

- **S-1** A component has exactly ONE content outlet per element it prints. A component with several author-content regions is split into parts; each part is a component with its own single outlet (Liquid rule L-6 in `06-bindings.md`; this is why TSX uses flat part exports and never named slot props).
- **S-2** The default outlet is called `children` in the manifest, in TSX and in fixtures; in Liquid it is `{{ content }}`.
- **S-3** Text is always children. No `label`, `text` or `title` content prop exists (D-035, `00-decisions.md` section 6.5).

### 6.2 Parts

- **S-4** A part is a named sub-element of a component. Each part has: a kebab-case name; a class `rp-<component id>-<part>`; a TSX export `<Component><Part>`; on Liquid tier `parts`, a block file `blocks/<component id>-<part>.liquid`.
- **S-5** Parts are of two sorts, recorded per part in the manifest (`authoredBy`):
  - `author`: the caller writes the part (DialogTitle, TabsPanel, AccordionItem).
  - `component`: the owning component prints the part itself and the caller cannot omit it (the error message of ProductForm, the stepper buttons of QuantityInput).
- **S-6** Part order in the DOM is the order of the Anatomy table in the component spec. A binding MUST NOT reorder author-written parts, and MUST NOT require a parent to wrap, count, filter or reorder its children (Liquid cannot introspect children; `ripple/docs/research/liquid-blocks-partials.md` section 8 item 6).
- **S-7** A part's attributes MUST be derivable from that part's own props. A part never reads context from its parent. Anything the root knows that the part needs (root id, selected value, group name) is passed to the part as a prop (N-13). This holds in TSX too: React context MUST NOT be used to complete a contract.
- **S-8** Inside an `rp-*` root, each part the element reads or writes carries `data-rp-part="<part>"` in addition to its class. Inside a `ui-*` root, parts are the UI SDK part elements and carry no `data-rp-part`. In static components, parts carry only the class.
- **S-9** Markup the author does not write (stepper buttons, chevron icon, error message, live region) is printed by the owning component, with strings from locale keys `ripple.<component id>.<key>` whose English defaults are identical in every host (D-066).

### 6.3 Embedding

- **S-10** When a component's contract contains another component (ProductCard contains Image and Price), the embedded markup MUST be exactly the embedded component's own contract for the props passed. An embedding component MUST NOT print a variation of the embedded contract.
- **S-11** Embedding is expressed in the contract template with an `embed` node (`07-manifest-registry-cli.md`), in TSX by rendering the embedded component, and in Liquid by `{% render 'rp-<id>' %}` (never `{% block %}` inside a block or snippet, D-037). The manifest records it in `dependencies.embeds`.
- **S-11a** There are exactly two ways for one component to use another (D-070): embedding (S-10, S-11), and composition by contract (N-3), where the composing binding prints the base component's element itself with an added class. No other mechanism exists: no nested `{% block %}`, no captured markup passed between files, no CSS copied from another component.

### 6.4 Regions

- **S-12** A refreshable region is one element carrying `data-rp-region="<name>"` with a name from D-046. The attribute is on the outermost element of the region's markup. A region root MUST NOT be a `ui-*` element's internal part, and an overlay root (`rp-dialog`) MUST NOT be inside the region its own content refreshes (D-046 item 5).
- **S-12a** Region parts (D-091). A component whose content is refreshed exposes the region as a part: a TSX export `<Component><Part>` and a Liquid snippet `rp-<component id>-<part>`. The six component-owned regions are: `rp-cart-lines` (CartLines part `list`), `rp-cart-summary` (CartSummary part `totals`), `rp-product-media` (ProductGallery part `media`), `rp-product-recommendations` (ProductRecommendations part `list`), `rp-collection-filters` (Filters part `groups`), `rp-predictive-results` (PredictiveSearch part `results`). The four blueprint-owned regions (`rp-product-buy`, `rp-collection-results`, `rp-collection-toolbar`, `rp-search-results`) are layout components that receive `data-rp-region="<name>"` through rest props or `attributes` (N-20). In every host, including Remix, a region root is a plain element with `data-rp-region` (D-090). A region name appears at most once per rendered page. The pattern is owned by `11-components-commerce.md` section 0.
- **S-13** Everything inside a region can be replaced at any time. Markup inside a region MUST NOT carry state that exists only in the DOM, other than native form control values that the server re-prints.

### 6.5 Host-owned regions and opaque markup

- **S-14** A host-owned region is a subtree that legitimately differs by host or backend: cart and product form internals (D-043). The component spec lists each one under "Host-owned regions and masks", and fixtures mask them (section 11.6).
- **S-15** Opaque markup is platform-provided markup (Shop Pay, Liquid `payment_button`). The contract wraps it in ONE Ripple-owned element with a part class; the fixture masks the wrapper's children; CSS MUST NOT select inside it (D-004).

---

## 7. Upgrade stability and allow-lists

### 7.1 The rule

- **U-1** A **component root** is any element whose tag starts with `ui-` or `rp-`, or whose class list contains a manifest root class.
- **U-2** From the moment the server HTML is parsed until every used custom element is defined and one animation frame has passed, a `MutationObserver` (`attributes`, `attributeOldValue`, `childList`, `characterData`, `characterDataOldValue`, `subtree`) MUST record zero mutations whose target is a component root or a descendant of one, other than mutations permitted by an allow-list entry (7.2).
  - A **mutation** is exactly one of: an attribute write that CHANGES the value (including adding or removing the attribute); the addition or removal of a child node; a text change (D-002).
  - A write that sets an attribute to the value it already has is NOT a mutation. A `MutationObserver` still delivers a record for it; the judge reports that record as information, does not fail on it, and it MUST NOT have an allow-list entry. Measured example: `ui-tabs-tab` re-writes `role="none"` at upgrade (`10-components-interactive.md`, Tabs).
- **U-3** Mutations outside component roots are not covered by U-2. UI SDK is known to prepend `<style id="ui-sdk-...">` elements to `<head>` and append two `div[data-ui-sdk-announcer]` elements to `<body>` (`ripple/docs/research/uisdk-web-elements.md` section 2.3). Hosts that morph whole documents MUST preserve them (`06-bindings.md`).
- **U-4** The server MUST print every attribute an element would otherwise write at upgrade for the initial state. An `rp-*` element MUST NOT write, at upgrade, any attribute or text the server could have printed (D-019 item 4). If the value depends only on props, the server prints it. If it depends on layout, on the viewport or on client-only data, it goes on the allow-list.
- **U-5** The test harness for U-2 is owned by `13-testing.md` (tier 3). The same check is checker rule RP601 (`07-manifest-registry-cli.md`).

### 7.2 Allow-list entry format

An allow-list is a list of entries. Each entry permits a class of mutation on elements matching a selector.

```ts
interface UpgradeAllowEntry {
  /** Selector in the subset of section 12.4. Matched against the mutation's element (see below). */
  select: string;
  /** Attribute names whose change is permitted on a matching element. Lowercase. Default: []. */
  attrs?: string[];
  /** Permit adding or removing child ELEMENTS of a matching element. Default: false. */
  childList?: boolean;
  /** Permit changing the text of a matching element (text node added, removed or changed). Default: false. */
  text?: boolean;
  /** Apply the entry to every descendant of a matching element too. Default: false. */
  subtree?: boolean;
  /** Why the server cannot print this. One sentence. Required. */
  reason: string;
}
```

How the records are judged. Records are processed in delivery order; `r` is one `MutationRecord`.

1. Let `E` be `r.target` when it is an element, otherwise `r.target.parentElement`.
2. Same-value attribute writes. For `r.type === "attributes"`, the **new value** of `r` is the `oldValue` of the next record for the same element and the same `attributeName`, or, when `r` is the last such record, the element's current value of that attribute (`null` when absent). When `r.oldValue === new value`, `r` is a same-value write: it is added to the report list `info`, it never fails the test, and steps 3 to 7 are skipped for it.
3. An entry **applies** when `E` matches `select`, or when `subtree` is true and an ancestor of `E` matches `select`.
4. `r.type === "attributes"`: permitted when an applying entry lists `r.attributeName` in `attrs`.
5. `r.type === "characterData"`: permitted when an applying entry has `text: true`.
6. `r.type === "childList"`: when every added and removed node is a text node, permitted when an applying entry has `text: true`; otherwise permitted when an applying entry has `childList: true`.
7. A record that no entry permits fails the test. The failure message MUST print the component id, the canonical path of `E`, the record type, the attribute name, the old value and the new value.

The result of the judge is `{ failures: Record[], info: Record[] }`; the test passes when `failures` is empty. `info` is printed and never asserted.

Where allow-lists are recorded:

- In prose, on the line "Upgrade allow-list" of each component spec (`00-decisions.md` section 7).
- In data, in the manifest component key `upgradeAllow` (an array of `UpgradeAllowEntry`; absent means empty). The key and its sub-keys (`select`, `attrs[]`, `childList`, `text`, `subtree`, `reason`) are listed in `00-decisions.md` section 4.8 (D-071). Checker rule RP601 and tier 3 read this key; neither has a second table.
- The JSON block under "Upgrade allow-list" in a component spec IS the value of `upgradeAllow`. `reason` is REQUIRED in every entry.

Rules:

- **U-6** An entry MUST be as narrow as possible: one selector, the exact attribute names. `attrs: ["*"]` is not allowed. `subtree: true` is allowed only for element-owned subtrees (7.3 entry 2) and for region roots, whose content a refresh can replace during upgrade (`11-components-commerce.md`).
- **U-7** An attribute MUST NOT be allow-listed when the server can compute it from props. A reviewer rejects such an entry; the generator check `pnpm gen --check` fails when an `upgradeAllow` entry without `subtree: true` lists an attribute that also appears in the component's contract template for the same selector with a literal or prop value. The entries of 7.3 are exempt from this check: for them the value at upgrade comes from layout or from client data (the cart store), which can differ from what the server printed.
- **U-8** A same-value attribute write MUST NOT be given an entry (U-2). There is therefore NO Tabs entry: the Tabs allow-list is `[]`.
- **U-9** React hydration is judged against a separate list, `REACT_HYDRATION_ALLOW` in `test/hydration/react-allow.ts` (content owned by `06-bindings.md`): same-value `type` / `value` / `name` / `checked` writes on `<input>` and the `<textarea>` text reset (D-071 item 5). It is used by tier 4 only and MUST NOT be merged into `upgradeAllow`.

### 7.3 Entries fixed by the ledger

These entries exist in V1 (D-071 item 3). Component specs MAY add entries under rule U-4; they MUST NOT remove or widen these. Each JSON object is shown complete, with its `reason`.

| # | Applies to | Entry | Source |
|---|---|---|---|
| 1 | every page (global) | `{ "select": "a[data-rp-open]", "attrs": ["aria-haspopup", "aria-controls"], "reason": "The runtime adds them only when the target is a dialog inside a defined rp-dialog; without JS the link is a plain link and must not claim a popup." }` | D-009 |
| 2 | Toast | `{ "select": "ui-toast-region", "attrs": ["data-slot", "data-side", "data-align", "popover", "style", "role", "aria-label", "aria-keyshortcuts", "data-expanded"], "childList": true, "text": true, "subtree": true, "reason": "UI SDK writes viewport-dependent inline variables and appends <ol data-slot=\"toast-list\">; the region is element-owned." }` | D-013, D-083; `ripple/docs/research/spikes/uisdk-web/out/all-bare.diff.txt` (`c-toast`) |
| 3 | Dialog, Drawer and components composed from them, in fixtures that use `defaultOpen` | `{ "select": "dialog[data-default-open]", "attrs": ["open"], "reason": "rp-dialog calls showModal() on connect; the server must not print open on a modal dialog." }` | D-008 item 5 |
| 4 | Carousel and components composed from it (ProductGallery, FeaturedCollection with `layout="carousel"`) | `{ "select": "[data-rp-part=\"next\"]", "attrs": ["disabled"], "reason": "Whether all items fit depends on layout, which the server cannot know; rp-carousel adds disabled to the next button at upgrade when nothing can be scrolled." }` | D-016 |
| 5 | every commerce component that prints an error part | `{ "select": "[data-rp-part=\"error\"]", "attrs": ["hidden"], "text": true, "reason": "The error part shows the result of a mutation that completed during upgrade." }` | D-045 item 4 |
| 6 | every commerce component that prints a count part | `{ "select": "[data-rp-part=\"count\"]", "attrs": ["hidden"], "text": true, "reason": "The server value can be stale on a cached page; the store value replaces it." }` | D-045 |

- Entry 1 is global. It is defined in `src/testing/upgrade-diff.ts` as the exported constant `GLOBAL_UPGRADE_ALLOW` and is always applied in addition to the component's `upgradeAllow`. It is not repeated in any manifest entry.
- Entries 2 to 6 are manifest data: each component they apply to lists the entry in its own `upgradeAllow`.
- Entry 2 MUST be equal, key for key and value for value, to the allow-list printed in `10-components-interactive.md` (section "Toast", "State and attributes"). Entries 3 and 4 equal the ones in the same document (sections "Dialog" and "Carousel"). When the two documents differ, `10-components-interactive.md` is the owner (D-069) and this table is the defect.
- There is NO Tabs entry. The measured Tabs upgrade makes only same-value `role` writes on `ui-tabs-tab`, which are not mutations (U-2, U-8).
- `ripple/docs/research/spikes/uisdk-web/out/all-bare.diff.txt` is the measured evidence for entry 2; in the Toast contract the server prints `data-slot`, `data-side`, `data-align` and `popover`, so their writes on the root at upgrade are same-value writes. They are listed in the entry for the element-owned subtree and for run-time changes.

Writes that happen AFTER upgrade in response to a user action or a store change (setting `data-pending`, filling the `data-rp-part="error"` element and removing its `hidden`, updating `data-rp-part="count"` text) are not upgrade mutations. They are constrained by D-019 and D-045 and tested as behaviour (`13-testing.md` tier 5). Entries 5 and 6 exist for the case where the store already differs from the server HTML at the moment of upgrade. Further commerce entries of the same kind (`data-pending` and `aria-busy` on a root or line, a region root whose content a refresh replaces, the text of a status part) are stated per component in `11-components-commerce.md`.

---

## 8. Initial server-written state, per interactive pattern

General rules:

- **I-1** The server prints the complete initial state. No attribute that expresses state is left for the element to add at upgrade (U-4).
- **I-2** Native state is expressed with the native attribute ONLY. The server MUST NOT duplicate native state in ARIA: no `aria-expanded` on `<summary>`, on a `popovertarget` button or on a `commandfor` button; no `aria-checked` on a native checkbox; no `aria-hidden` on a closed `<dialog>`; no `aria-modal`. Reason: without JS nothing would keep the copy in sync, and the browser already exposes the native state.
- **I-3** An ARIA state attribute is printed only on an element whose state is maintained by a custom element after upgrade (Tabs), or whose state cannot change without a navigation (`aria-current`, `aria-invalid`, `aria-disabled`).
- **I-4** Initial-state props are named `default<X>` and print the plain HTML attribute (M-4 rows 13 to 15). Components are uncontrolled in every host (D-036).
- **I-5** Every `id` reference the server prints (`for`, `aria-labelledby`, `aria-describedby`, `aria-controls`, `commandfor`, `popovertarget`, `form`, `data-rp-open`) MUST point to an element that exists in the same server response.
- **I-6** The server MUST NOT print `inert`, a `style` on `<html>` or `<body>`, or `open` on `<dialog>`.

Per pattern. "MUST print" lists the state-bearing attributes only; the full contract is in the component document named in the last column.

| Pattern | The server MUST print | The server MUST NOT print | Full contract |
|---|---|---|---|
| **Dialog, Drawer** (`rp-dialog` + `<dialog>`) | `<rp-dialog class="rp-dialog" data-slot="rp-dialog">` (Drawer: class `rp-drawer`; a component composed from Drawer: `rp-drawer rp-<component id>`, N-3) containing exactly one `<dialog id="<id>" class="rp-dialog-panel" aria-labelledby="<id>-title" closedby="any">` (Dialog: plus `data-size`; Drawer: class `rp-drawer-panel`, plus `data-side`). A title element with `id="<id>-title"`. With `defaultOpen`: `data-default-open=""` on the `<dialog>`. The parts are `panel`, `header`, `title`, `description`, `body`, `footer`; there is no close part (closers are Buttons, next row). | `open`, `hidden`, `aria-hidden`, `aria-modal`, `role="dialog"`, `inert` on siblings, `aria-describedby` from a prop (there is no `describedBy` prop) | `10-components-interactive.md` |
| **Button opener / closer of a dialog** | `<button type="button" commandfor="<id>" command="show-modal">` or `command="close"`, printed by the Button and IconButton props `commandFor` and `command` | `aria-expanded`, `aria-controls`, `aria-haspopup`, `data-rp-open`, `data-rp-close` (the last two are printed on buttons only on the SPIKE-05 fallback path, section 15) | `09-components-foundation.md` (Button), `04-elements.md` (polyfill) |
| **Link opener** (overlay with a page equivalent) | `<a href="<page>" data-rp-open="<id>">`, printed by the prop `dialog` of Link, or of Button and IconButton with `href` (M-4 row 19). When the target dialog is not on the page (CartDrawer on the cart page, D-091) the prop is omitted and the link is a plain link. | `aria-haspopup`, `aria-controls` (the runtime adds them; 7.3 entry 1), `role="button"`, `commandfor`; `data-rp-open` passed through rest props or `attributes` (N-20) | `09-components-foundation.md` (Link, Button), `04-elements.md`, D-009 |
| **Popover** (native) | Panel: `<div class="rp-popover" id="<id>" popover="" data-side="<side>" data-align="<align>">` (the empty value `popover=""`, written `popover` in HTML shorthand, in every host; SPIKE-05 fallback: `popover="auto"` in all four hosts, section 15). Opener: `<button type="button" popovertarget="<id>">`. The optional title part has class `rp-popover-title` and NO id. | `hidden` on the panel, `aria-expanded` on the opener, `popover="manual"`, `aria-labelledby`, an element with `id="<id>-title"` | `10-components-interactive.md` |
| **Accordion** (`<details>`) | Root `<div class="rp-accordion" data-type="<type>">` (default `multiple` printed; `id` only with `type="single"`). Items `<details class="rp-accordion-item">` with `open` only on items that have `defaultOpen`; with `type="single"`, `name="<accordion id>"` on every item | `aria-expanded` on `<summary>`, `hidden` on content, `role` on `<summary>`, `name` on an item of a `multiple` accordion | `10-components-interactive.md` |
| **Tabs** (`ui-tabs`) | The measured upgrade snapshot (C-13, D-012). Root: `id`, `default-value="<value>"`, `data-activation-direction="none"`, `data-orientation="horizontal"` (always; V1 has no `orientation` prop), `data-slot="tabs"`. List: `role="tablist"`, `aria-label`, `data-activation-direction="none"`, `data-orientation="horizontal"`, `data-slot="tabs-list"`. Every `ui-tabs-tab`: `value`, `role="none"`. Selected tab button: `type="button"`, `role="tab"`, `id="<id>-tab-<value>"`, `aria-controls="<id>-panel-<value>"`, `aria-selected="true"`, `tabindex="0"`, `data-selected=""`, `data-activation-direction="none"`, `data-orientation="horizontal"`, `data-slot="tabs-tab"`. Every other tab button: the same without `aria-controls` and without `data-selected`, with `aria-selected="false"` and `tabindex="-1"`. Selected panel: `value`, `role="tabpanel"`, `id="<id>-panel-<value>"`, `aria-labelledby="<id>-tab-<value>"`, `tabindex="0"`, `data-selected=""`, `data-activation-direction="none"`, `data-orientation="horizontal"`, `data-slot="tabs-panel"`. Every other panel: `value`, `hidden`, `data-slot="tabs-panel"` and nothing else. Exactly one tab is selected. | the attribute `value` on `ui-tabs`; `aria-controls` on an unselected tab; `role`, `id`, `aria-labelledby` or `tabindex` on an unselected panel; a panel without `hidden` that is not selected; `data-orientation="vertical"` | `10-components-interactive.md` |
| **Tooltip** (`ui-tooltip`) | Root `<ui-tooltip class="rp-tooltip" id="<id>">` (no `data-slot`). Trigger: a native `<button type="button">` ONLY, which is the caller's Button or IconButton with the prop `tooltip="<id>"`; that prop prints `aria-describedby="<id>-content"` and `data-slot="tooltip-trigger"`; the button has its own accessible name. Content: `<ui-tooltip-content class="rp-tooltip-content" hidden id="<id>-content" role="tooltip" data-closed="" data-slot="tooltip-content">`. `side` and `align`: M-4 row 22. | an `<a>` trigger (never; D-082); content without `hidden`; a trigger whose only name is the tooltip; `data-side`, `data-align`, `data-open`, `popover` or `style` on the content; `title` on the trigger | `10-components-interactive.md` |
| **Toast** (`ui-toast-region`) | One empty region per page, printed by the `layout` blueprint, with root class `rp-toast`: `<ui-toast-region class="rp-toast" aria-label="<label>" data-close-label="<close label>" data-slot="toast-region" data-side="<side>" data-align="<align>" popover="manual"></ui-toast-region>` | any child node; any toast markup; `style`, `role`, `aria-live`, `hidden`. Server messages use Banner or FormMessage (PE-11) | `10-components-interactive.md` |
| **Field** (static) | Parts `label`, `control` (a wrapper `div` around the caller's control), `description`, `error`. `for="<id>"` on the label. The Field root does NOT carry the `id`. The CALLER passes to the control (which is another component): `id="<id>"`; `describedBy` listing `<id>-description` and `<id>-error` only when those elements are printed; `invalid` (prints `aria-invalid="true"`) only when the server has an error (D-014) | `aria-describedby` pointing at an element that is not printed; `aria-invalid="false"`; `id="<id>"` on the Field root | `09-components-foundation.md` |
| **Checkbox, Switch, RadioGroup, Select, Input, Textarea** | Native `checked`, `selected`, `value`, `disabled`, `required` from `default<X>` and the props | `aria-checked`, `aria-selected`, `aria-required`, `aria-disabled` on native controls | `09-components-foundation.md` |
| **QuantityInput** (`rp-quantity`) | Root `<rp-quantity class="rp-quantity" data-size="<size>" data-slot="rp-quantity">`. `<input class="rp-quantity-input" type="number" inputmode="numeric" name="quantity" min max step value data-rp-part="input" data-rp-field="quantity">` with the real value; `data-rp-field="quantity"` is ALWAYS printed. Decrement and increment `<button class="rp-quantity-button" type="button" data-rp-part="decrement \| increment" data-rp-js="inflow">`, each containing an Icon (`minus`, `plus`), not text, and named by `aria-label` (`decreaseLabel`, `increaseLabel`); `disabled` on decrement when `value <= min`, on increment when `max` is set and `value >= max` (computable from props, U-4) | `type="text"`; a formatted value (`1,235`); `hidden` on the buttons; text content in the buttons; the class `rp-quantity-input` on the root | `10-components-interactive.md` |
| **Carousel** (`rp-carousel`) | A scroll-snap list that scrolls natively; previous and next buttons with class `rp-carousel-control`, `data-rp-part="prev"` / `data-rp-part="next"` and `data-rp-js="inflow"`; `disabled` on the `prev` button ONLY (the initial index is 0) | `disabled` on the `next` button (it depends on layout; the element adds it at upgrade, 7.3 entry 4); `aria-hidden` or `inert` on slides; the class `rp-icon-button` on the controls | `10-components-interactive.md` |
| **NavigationMenu, MobileNav** | Real links for every item with a URL; for a top-level item with children a `<button type="button" popovertarget="<id>-item-<n>">` and a panel `<div id="<id>-item-<n>" popover="">`, with `n` the 1-based position of the top-level item (I-2 applies); nested `<details>` in MobileNav, whose root is `<rp-dialog class="rp-drawer rp-mobile-nav">` (composes Drawer, N-3); `aria-current="page"` on the link to the current URL | `aria-expanded` on native disclosure controls; `hidden` or `popover="manual"` on a panel; panel ids built from a handle | `12-components-chrome-and-blueprints.md` |
| **Navigation state** (Pagination, Breadcrumb, Link) | Link: `aria-current="page"` when the prop `current` is true. Breadcrumb: the current item is a LINK with `aria-current="page"`. Pagination: the default body is a previous link and a next link built from URL props and prints no `aria-current`; in an override body the current page is `<span class="rp-pagination-current" aria-current="page">`, not a link (D-086) | in a Pagination override body, a link (`<a>`) for the current page; numbered page links in the Pagination default body | `09-components-foundation.md` |
| **Pending** (`pending` prop on any component) | `data-pending=""` and `aria-busy="true"` | `disabled` as a substitute for pending (D-045 item 3) | component spec |
| **Commerce roots** (`rp-cart`, `rp-product-form`, `rp-live`, `rp-predictive-search`, `rp-recommendations`) | Real forms and links for every action (PE-2); counts and money text from the server's cart: the text of `data-rp-part="count"` is the real count, and the count part carries `hidden` when the quantity is 0 (D-045); each cart line with `data-rp-line`; region roots with `data-rp-region`; an error element `<p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>` (empty, hidden); in CartLines, CartSummary, CartNote and DiscountCode one empty status part (`data-rp-part="status"`, D-079); `data-rp-refresh` on the roots and forms that refresh regions, never on `rp-product-form`; `data-url` on `rp-recommendations` | `data-pending`, `aria-busy`, placeholder counts, skeletons in place of server data, `disabled` on a control as a substitute for pending (a sold-out AddToCartButton and an empty-cart CheckoutButton ARE `disabled` by the server, D-050) | `11-components-commerce.md`, `05-commerce.md` |
| **Controls that need JS** | `data-rp-js="inflow"` or `data-rp-js="overlay"` on the control, or on a `<form>` that works only with JS (the Liquid discount form, D-092) (PE-4) | the `hidden` attribute or an inline style to hide them | `03-styling-and-tokens.md` |
| **Controls needed only without JS** | `data-rp-js="fallback"` on the control (for example the Liquid cart form's Update button, `data-rp-part="submit" data-rp-js="fallback"`, D-092) | the `hidden` attribute on a `fallback` control | `03-styling-and-tokens.md` |
| **View events** (`rp-view-event`, blueprints only) | Product, collection and search (search only when terms exist): the attribute form `<rp-view-event view-event-trigger="connect" view-event-payload="<JSON text>"></rp-view-event>`. Cart: the child form `<rp-view-event view-event-trigger="connect"><script type="application/json" data-view-event-payload><JSON text></script></rp-view-event>` (C-20, D-089). On Liquid the payload is ALWAYS the output of the `standard_event_data` filter | a class or `data-slot` on `rp-view-event`; the element inside a component (not in ProductForm, not in CartDrawer); hand-built JSON on Liquid; `view-event-trigger="intersect"` in a V1 blueprint | `12-components-chrome-and-blueprints.md`, `05-commerce.md` |

Acceptance for this section: for every row, the named component document has at least one fixture that shows the "MUST print" attributes, and checker rule RP303 (`07-manifest-registry-cli.md`) passes on every blueprint rendered with JavaScript disabled.

---

## 9. Progressive enhancement rules

Each rule has a test. "Tier n" refers to the test tiers of D-063 (`13-testing.md`). "Lint" refers to the fixture lint of section 11.8. `RPnnn` refers to checker rules (`07-manifest-registry-cli.md`).

- **PE-1 Content is in the server HTML.** Every text node, link, image and form control of a contract is present in the server response. No component fetches or builds its initial content on the client. Exceptions: toasts (created by `toast()`), and predictive search results and lazily loaded recommendations (their containers are printed; D-048, SPIKE-09).
  - Test: tier 2 (the server output of every host equals the reference HTML).

- **PE-2 Every action is a real link, a real form submission, or a native invoker.** In a contract, every `<button>` MUST satisfy at least one of:
  1. it is inside a `<form>` (or has a `form` attribute) and its `type` is `submit` or `reset`;
  2. it has `commandfor` and `command`;
  3. it has `popovertarget`;
  4. it has `data-rp-js="inflow"` or `data-rp-js="overlay"` (a JS-only enhancement, hidden until its element is defined);
  5. it is the native element bound by a `ui-*` part (a tab, a tooltip trigger).

  Every `<a>` that performs an action MUST have an `href` that performs the same action or shows the same content without JS. Every `<form>` MUST have `action` and `method` (host-owned values allowed, D-043).

  Exemption for the lint only: check `pe-2` is skipped on the ROOT element of a fixture whose component id is `button` or `icon-button` (D-074 item 8). A Button fixture with only required props is by necessity a `type="button"` button with no invoker. Rendered pages are still checked by RP301.
  - Test: lint check `pe-2`; RP301 on rendered pages; tier 6.

- **PE-3 Native first.** Interactive behaviour uses the mechanism in the D-007 table. A contract MUST NOT contain a hand-rolled ARIA widget: `role` of `dialog`, `alertdialog`, `tablist`, `menu`, `listbox`, `switch` (except on `<input type="checkbox">`), `slider`, `radiogroup`, `toolbar`, `tree` or `combobox` outside a `ui-*` root.
  - Test: RP115, RP111; lint check `pe-3`.

- **PE-4 Controls that only work with JS are marked, not hidden by the server.** Such a control carries one of:

  | Value | Before the owning element is defined (and when JS never loads) | After |
  |---|---|---|
  | `data-rp-js="inflow"` | `visibility: hidden` (space is reserved, so no layout shift) | visible |
  | `data-rp-js="overlay"` | `display: none` (the control is out of flow) | shown |
  | `data-rp-js="fallback"` | shown | `display: none` |

  The owning element is the nearest `rp-*` ancestor. A `data-rp-js` attribute on an element with no `rp-*` ancestor is an error. The CSS rules are generated per owning tag into the file `base.css`, in layer `rp.props` (D-021; `03-styling-and-tokens.md`), and each generated selector matches only elements whose NEAREST owner is that tag (D-125; `03-styling-and-tokens.md` 4.2 rule 7a): owners nest with different defined states (in the CartDrawer `rp-dialog > rp-cart > rp-quantity`, where `rp-cart` can be undefined while the other two are defined). An `rp-*` tag MUST NOT be nested inside the same `rp-*` tag when the inner one contains a `data-rp-js` element (the generated selectors cannot tell the two apart). A `data-rp-js` attribute MUST NOT be put on content, on a link, or on a form submit button that works without JS, except `fallback`. It MAY sit on a `<form>` that works only with JS: the Liquid DiscountCode form carries `data-rp-js="inflow"` on the `<form>` itself (D-092).
  - Test: lint check `pe-4` (ancestor exists; value is one of three). Tier 6: with JavaScript disabled, every `[data-rp-js="inflow"]` has computed `visibility: hidden`, every `[data-rp-js="overlay"]` has computed `display: none`, every `[data-rp-js="fallback"]` is visible. Tier 5: with JavaScript enabled the opposite holds. Tier 5, nested owners in different states: test CSS-NEAR of `03-styling-and-tokens.md` section 4.3.

- **PE-5 No layout shift on upgrade.** The bounding box of every component root and of every visible part is the same before and after upgrade.
  - Test: tier 3 compares `getBoundingClientRect()` of each root between a JavaScript-off and a JavaScript-on render at 375 px and 1280 px wide; a difference greater than 0.5 CSS px on any edge fails. Excluded from the comparison: `data-rp-js="fallback"` controls (they are shown only without JS) and Tabs (without JS every panel is shown, D-012) (D-063). RP602 (cumulative layout shift above 0.01 fails).

- **PE-6 Script failure equals no script.** When `ripple.js` fails to load, throws while evaluating, or a custom element never becomes defined, the page behaves exactly as with scripting disabled. No contract may rely on an inline script. Content MUST NOT be hidden until an element is defined (only `data-rp-js="overlay"` and `inflow` controls are).
  - Test: every tier 6 flow runs twice: once with `javaScriptEnabled: false`, once with JavaScript enabled and every request matching `**/ripple*.js` aborted. Both runs MUST pass the same assertions.

- **PE-7 Overlays with a page equivalent open from a link.** The opener of the cart drawer, the search dialog and the mobile nav is `<a href="<page>" data-rp-open="<dialog id>">` (D-009), printed by the prop `dialog` of Link, Button (with `href`) or IconButton (with `href`). It MUST NOT be a `<button>`. When the target dialog is not on the page (the CartDrawer is omitted on the cart page, D-091), the `dialog` prop is omitted and the link navigates.
  - Test: RP302; tier 6 (clicking the opener with JavaScript disabled navigates to `<page>` with a 2xx response).

- **PE-8 Content that must be reachable without JS is not placed only inside a JS-dependent container.** Tooltip content and Toast are JS-dependent. Tabs panels other than the default are readable without JS only in browsers that support `@media (scripting: none)` (D-012; support UNVERIFIED, SPIKE-06), so they count as JS-dependent too. Product description, price, add to cart, shipping and returns information MUST NOT exist only there; use Accordion, which is `full`.
  - Test: RP304 (warning) on rendered pages.

- **PE-9 Forms post natively.** Every form control that participates in submission has a `name`; quantity is a real `<input type="number">`; validation uses native constraint attributes (`required`, `min`, `max`, `step`, `pattern`, `type`). State that lives in the URL (variant, filters, sort, page, search) uses `method="get"` forms and links (D-047). Cart mutations use `method="post"` forms with the backend's dialect (D-043).
  - Test: RP305, RP306; tier 6 flows for every component with `noJs.level: full`.

- **PE-10 Every component declares its level, and the level is tested.**

  | `noJs.level` | Requirement with JavaScript disabled | Test |
  |---|---|---|
  | `full` | Every function works: the tier 6 flow recorded for the component completes (a navigation or form post with a 2xx or 3xx response and the expected resulting content). | tier 6, RP606 |
  | `degraded` | Content is readable and the primary path is available; the manifest `noJs.behavior` sentence names exactly what is missing. The fixture renders with no hidden content other than what the component spec lists. | tier 6 assertion per component spec |
  | `none` | The component is absent or inert; its trigger stays usable and has its own accessible name; nothing visible is broken. | tier 6: no visible element of the component has a zero-size or overflowing box; trigger is focusable |

  The assignment of levels to components is fixed by D-005 and section 8 of the ledger. Three points of D-005 as amended: DiscountCode has the manifest level `degraded` (it is `full` on the hydrogen backend and JS-only on Liquid); Filters is `full` only when rendered inline, never inside a Drawer; Tabs without JS shows every panel and is exempt from the generic tier 6 "renders the same without scripts" comparison.

- **PE-11 Feedback survives without JS.** The outcome of a form post MUST be representable by server-rendered markup: a Banner or a FormMessage in the response. Toast is an enhancement only. While a modal dialog is open, feedback is rendered inside that dialog (D-008 item 7).
  - Test: tier 6 flow for ProductForm and NewsletterForm asserts a visible success or error element in the response page.

- **PE-12 When the commerce runtime cannot start, forms are left untouched.** Missing platform APIs, missing Standard Actions, or a thrown configure call set `usable` to false and no submit handler is attached (D-041 item 7; `05-commerce.md`).
  - Test: tier 6 variant: JavaScript enabled with `AbortSignal.any` deleted before scripts run; the add-to-cart form posts natively.

---

## 10. Accessibility requirements

Target: WCAG 2.2 AA (D-066). Each rule has a test. The component spec's "Accessibility" section gives the pattern, name source, focus behaviour, announcements and keys for that component; the rules here apply to all of them.

- **A-1 Native semantics first.** Use the element that has the semantics: `<button>` for actions, `<a href>` for navigation, `<nav>`, `<h1>` to `<h6>`, `<ul>` / `<ol>`, `<label>`, `<fieldset>` / `<legend>`, `<dialog>`, `<details>`. `role` appears in a contract only where the component spec lists it. `role="button"`, `role="link"` and `tabindex="0"` on `<div>` or `<span>` are prohibited.
  - Test: lint check `a-1`; RP115.

- **A-2 Every interactive element has an accessible name.** Sources, in order: text content; `aria-label` (prop `ariaLabel`); `aria-labelledby`; an associated `<label>`. IconButton REQUIRES `ariaLabel` (and `icon`); Rating REQUIRES `ariaLabel`. A `title` attribute is never a name source. A Tooltip is never the only name (D-013).
  - Test: RP201; lint check `a-2` (every `<button>`, `<a href>`, `<input>` not of type `hidden`, `<select>`, `<textarea>`, `<dialog>` and `[role="tablist"]` in a fixture has a name by these sources, or the fixture's component is listed as receiving its label from Field).

- **A-3 Id references resolve and ids are unique.** Within a fixture, every `aria-labelledby`, `aria-describedby`, `aria-controls` and `for` value whose target is a part of the same component resolves to an element in that fixture. Within a document, every id is unique and every reference of I-5 resolves.
  - Test: lint check `a-3` (fixture scope); RP114 (document scope).

- **A-4 State is exposed as in section 3.4 and section 8.** No stale ARIA: an ARIA state attribute that nothing updates MUST NOT be printed (I-2, I-3).
  - Test: lint check `a-4` (no `aria-expanded` on `<summary>`, `[popovertarget]` or `[commandfor]`; no `aria-checked` on native inputs; no `aria-hidden="true"` on `<dialog>`).

- **A-5 Focus.** `tabindex` values are only `0` and `-1`, and only where the component spec lists them. `aria-hidden="true"` MUST NOT be on a focusable element or on an ancestor of one; the standard use is `<svg class="rp-icon" aria-hidden="true" focusable="false">` (D-068). Focus is always visible (CSS: `03-styling-and-tokens.md`). Focus movement on open, close and removal is stated per component.
  - Test: lint check `a-5`; tier 5 keyboard tests per component.

- **A-6 Disabled.** Native controls use `disabled`. A disabled link keeps `href` and adds `aria-disabled="true"` and `tabindex="-1"` (M-4 row 12). Controls are not disabled while pending (D-045 item 3).
  - Test: fixture `link-disabled` of Button (tier 2); lint check `a-6` (no `aria-disabled` on an element that also has `disabled`).

- **A-7 Images and icons.** Every `<img>` has `alt` (empty string for decorative images), `width` and `height`. Icons are decorative: `aria-hidden="true" focusable="false"`; the name belongs to the control around the icon.
  - Test: RP203; lint check `a-7`.

- **A-8 Forms.** Every control has a label (`<label for>` or a wrapping `<label>`, or `aria-label` for controls with no visible label such as a search field). Errors are FormMessage elements with `role="alert"`, linked from the control by `aria-describedby`; the control has `aria-invalid="true"`. Required controls use `required`. Groups of radios or checkboxes are in `<fieldset>` with `<legend>`.
  - Test: RP202; lint check `a-8`.

- **A-9 Headings and titles.** Heading `level` selects `h1` to `h6` and is independent of visual `size`. Dialog and Drawer REQUIRE a title part with `id="<id>-title"`, referenced by `aria-labelledby` on the `<dialog>`.
  - Test: RP113 structure rule `dialog-needs-title`; lint check `a-3`.

- **A-10 Landmarks.** A component that prints `<nav>` prints an `aria-label` on it from a locale key (Breadcrumb, Pagination, NavigationMenu, LinkList). MobileNav prints no `<nav>`; its modal `<dialog>` is named by its title (`components/mobile-nav.md`). SkipLink targets the `id` of `<main>`: its `href` defaults to `#main`, and the layout prints `<main id="main" tabindex="-1">`; on Liquid only, additionally `data-template="<page type>"` (D-086, D-089 item 6, D-099).
  - Test: lint check `a-10` (every `<nav>` in a fixture has `aria-label` or `aria-labelledby`).

- **A-11 Live regions exist before they are used.** An element that will receive announced text (`role="status"`, `role="alert"`, the Announcer component, the `data-rp-part="error"` and `data-rp-part="status"` parts) is printed by the server, empty. The Announcer component (`<div class="rp-announcer" role="status" data-rp-part="status">`) MUST be placed inside a `<dialog>` or inside an `rp-*` root, and nowhere else; the `layout` blueprint prints NO Announcer, because the page-level live regions are created by the runtime (D-079). CartLines, CartSummary, CartNote and DiscountCode each always print one status part, because each can sit inside the modal CartDrawer. Cart changes MUST be announced (D-066 item 5; `04-elements.md`, `05-commerce.md`).
  - Test: tier 5 (after add to cart, the live region text is non-empty within 2 s); lint check `a-11` (the error part of a commerce root is present, empty and `hidden`); the placement of Announcer is a manifest `rules[]` entry of Announcer in `09-components-foundation.md`, reported by RP113.

- **A-12 Direction and language.** No prop value and no attribute value is `left` or `right`; use `start` and `end` (D-066). Every user-visible default string comes from a locale key with the same English default in every host.
  - Test: lint check `a-12` (no `data-*` attribute value token equal to `left` or `right`); tier 2 proves string equality across hosts.

- **A-13 Target size.** Every interactive element in a fixture is at least 24 by 24 CSS px, except links inside a sentence of text.
  - Test: tier 5 measures `getBoundingClientRect()` of every `button`, `a[href]`, `input`, `select`, `summary` in every fixture rendered with `ripple.css`; elements inside `.rp-rich-text` and `.rp-text` are exempt.

- **A-14 Popups are not nested in links or clickable cards, and forms are not nested.**
  - Test: RP204; lint check `c-5` (HTML nesting).

- **A-15 Keyboard.** Every action is reachable with Tab and operable with Enter or Space through native behaviour. Components with a composite pattern (Tabs) follow the APG pattern and pass `checkPattern` from `@ui-sdk/core/testing` where the manifest names one.
  - Test: tier 5; RP605.

---

## 11. Fixtures

A fixture is a named example of a component: props in, reference HTML out. Fixtures are the normative statement of the contract and the input of tiers 2, 3, 4 and 6.

### 11.1 Files

For a component with id `<id>` (paths relative to the Ripple repository, `00-decisions.md` section 5.1):

| File | Content | Written by |
|---|---|---|
| `components/<id>/<id>.json` | The manifest entry. Its `fixtures` array holds one **fixture record** (11.2) per fixture, WITHOUT the `html` key. | hand |
| `components/<id>/fixtures/<name>.html` | The **reference HTML** of fixture `<name>`: an HTML fragment, UTF-8, LF line endings, one trailing newline, no provenance trailer. | `pnpm gen` (`generated: "template"`), the snapshot command (`"upgrade-snapshot"`), or hand (`"hand"`) |
| `components/<id>/html/<id>.html` | The **reference file** for the `html` host (11.7): every fixture as copyable markup. | `pnpm gen` |
| built `manifest.json` | Every fixture record WITH `html` inlined: the exact content of the fixture file minus the trailing newline. | build |

- **F-1** The fixture file is the single source of the reference HTML. The `html` key MUST NOT appear in `components/<id>/<id>.json`; the build fails if it does. The build fails when a fixture record has no file or a file has no record.
- **F-2** Fixture files are committed. `pnpm gen --check` fails when a `generated: "template"` fixture file differs from what the reference renderer produces (so nobody hand-edits it).

### 11.2 Fixture record schema

The exact schema (JSON Schema draft 2020-12), stored as `fixture.schema.json` and referenced by `manifest.schema.json` for the items of `fixtures` (`07-manifest-registry-cli.md`). It was validated with `jsonschema` 4.26 against the four worked fixtures of 11.9 and against the eight invalid records of section 13 item 3.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://ripple.invalid/fixture.schema.json",
  "title": "Ripple fixture record",
  "type": "object",
  "additionalProperties": false,
  "required": ["name", "props", "generated"],
  "properties": {
    "name": { "type": "string", "pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$", "maxLength": 48 },
    "props": { "$ref": "#/$defs/props" },
    "children": { "type": "string" },
    "parts": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/partInstance" } },
    "html": { "type": "string", "minLength": 1 },
    "hosts": {
      "type": "array",
      "minItems": 1,
      "uniqueItems": true,
      "items": { "enum": ["html", "react", "remix", "liquid"] }
    },
    "mask": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/maskRule" } },
    "generated": { "enum": ["template", "upgrade-snapshot", "hand"] }
  },
  "not": { "required": ["children", "parts"] },
  "$defs": {
    "props": {
      "type": "object",
      "propertyNames": { "pattern": "^[a-z][A-Za-z0-9]*$" },
      "additionalProperties": { "$ref": "#/$defs/propValue" }
    },
    "propValue": {
      "oneOf": [
        { "type": "string" },
        { "type": "number" },
        { "type": "boolean" },
        { "$ref": "#/$defs/resourceRef" }
      ]
    },
    "resourceRef": {
      "type": "object",
      "additionalProperties": false,
      "required": ["$resource"],
      "properties": {
        "$resource": { "type": "string", "pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*\\.[a-z][a-z0-9]*(-[a-z0-9]+)*$" }
      }
    },
    "partInstance": {
      "type": "object",
      "additionalProperties": false,
      "required": ["part"],
      "properties": {
        "part": { "type": "string", "pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$" },
        "props": { "$ref": "#/$defs/props" },
        "children": { "type": "string" },
        "parts": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/partInstance" } }
      },
      "not": { "required": ["children", "parts"] }
    },
    "maskRule": {
      "type": "object",
      "additionalProperties": false,
      "required": ["select", "op"],
      "properties": {
        "select": { "type": "string", "minLength": 1 },
        "op": { "enum": ["attr", "drop-attr", "srcset", "text", "children", "remove"] },
        "name": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" }
      },
      "allOf": [
        {
          "if": { "properties": { "op": { "enum": ["attr", "drop-attr", "srcset"] } } },
          "then": { "required": ["name"] },
          "else": { "not": { "required": ["name"] } }
        }
      ]
    }
  }
}
```

### 11.3 Meaning of each key

| Key | Required | Meaning |
|---|---|---|
| `name` | yes | Kebab-case, unique within the component. The first fixture MUST be `default`. |
| `props` | yes (may be `{}`) | Props passed to the ROOT component. Keys are manifest prop names (camelCase); `class` is written `class`. Values: string, number, boolean, or a resource reference. A key that is not a manifest prop of the component (or `class`) fails the build. |
| `children` | no | An HTML fragment placed in the root's default outlet. Mutually exclusive with `parts`. For content model `none` neither key is present. |
| `parts` | no | An ordered list of part instances placed in the root's outlet. Each instance: `part` (a part name from the manifest), `props` (that part's props), and either `children` (HTML fragment in the part's outlet) or nested `parts`. Only parts with `authoredBy: "author"` may appear; parts printed by the component itself never appear. A fixture that needs an author part followed by free content (Popover fixture `title`) writes the whole content, the part's markup included, as one `children` string and stays `generated: "template"` (D-149 item 16). |
| `html` | only in built `manifest.json` | The reference HTML (F-1). |
| `hosts` | no | The hosts in which the fixture is rendered and compared. Absent means all four. Allowed in exactly two cases: a prop of the fixture does not exist in a host (manifest `prop.hosts`); or the fixture is one of a backend-scoped pair (F-24). |
| `mask` | no | Mask rules applied to BOTH sides before comparison (11.6). |
| `generated` | yes | How the fixture file is produced: `template` (by the reference renderer from the contract template), `upgrade-snapshot` (11.4), `hand` (written by a person; required for components with host-owned regions). |

Prop values:

- **F-3** A `scale` or responsive prop SHOULD be given as a string (`"4"`, `"2 md:6"`). A JSON number is allowed for a `scale` prop and means: TSX hosts pass the number, Liquid passes the quoted string of it.
- **F-4** A prop of manifest type `object` MUST be given as `{ "$resource": "<type>.<name>" }`, for example `{ "$resource": "product.basic" }`. A fixture MUST NOT inline resource data. The resource set lives in `src/testing/resources.ts` and is owned by `13-testing.md`, which also owns how each host harness resolves a reference; the shapes come from `05-commerce.md` and the values from the owning component document (D-074 item 6). `13-testing.md` MUST supply at least: `image.basic`; `image.no-alt`; every resource named in `11-components-commerce.md` section 0; every resource named in `12-components-chrome-and-blueprints.md` section 1. The build fails when a fixture references a resource that `src/testing/resources.ts` does not define.
- **F-5** String prop values MUST NOT contain both `'` and `"` (a Liquid string literal cannot escape its own delimiter).

`children` fragments:

- **F-6** A `children` string MUST be an HTML fragment that is already canonical-stable: no comments, no `<script>`, no `<style>`, no custom elements that are not part of the component under test. Text or a few native elements is enough (`"Add to cart"`, `"<p>One</p><p>Two</p>"`). When the fragment contains another component's markup it MUST be that component's reference HTML, literally.
- **F-7** `children` are the same string in every host. How each host harness passes them (literal block body in Liquid; a placeholder token replaced after rendering in TSX hosts) is owned by `13-testing.md`. The requirement here: the children fragment MUST appear in the output byte-for-byte before canonicalisation changes it, and a harness MUST NOT escape it.

### 11.4 How each `generated` value is produced

| Value | Producer | Used by |
|---|---|---|
| `template` | The reference renderer `renderHtml(component, props, children)` in `src/gen/html.ts` walks the manifest contract template. | every component whose contract the template language can express and that has no host-owned region (D-072): kind `static` without loops or derived values, and kind `native` |
| `upgrade-snapshot` | 1. Render the fixture with the reference renderer or a hand-written seed. 2. Load it in headless Chromium with `ripple.css`. 3. Load the elements, wait for `customElements.whenDefined` of every tag used and one animation frame. 4. Serialise `outerHTML` of the root. 5. Write the file. 6. Reload the written file and assert the upgrade-stability rule U-2: zero mutations outside the allow-list (same-value attribute writes are reported and do not fail). The snapshot is taken at viewport 1280 by 720. | kind `ui` (Tabs, Tooltip, Toast) |
| `hand` | A person writes the file from the component spec. | components with host-owned regions or opaque markup, and components whose markup needs a loop, a derived value or backend-dependent tags (kind `commerce`, and most `static` components of `11-components-commerce.md`; D-072) |

- **F-8** An `upgrade-snapshot` fixture is regenerated only by the snapshot command, and only in a pull request that changes the UI SDK pin or the component's contract (D-062).
- **F-9** For the `html` host the reference HTML is hydrogen-backend markup: host-owned regions in a `hand` fixture are written in the hydrogen dialect, in full, so that the file is copyable (D-040). Masks make the Liquid output comparable to it; where masks cannot (different tags per backend), the fixture is a backend-scoped pair (F-24) and the `liquid-<name>` fixture, which the `html` reference file omits, holds the liquid-dialect markup.

### 11.5 Required fixtures per component

The build (`pnpm gen --check`) fails when a component lacks any of these.

- **F-10** `default`: first in the array; `props` holds only required props; children are the minimal valid content.
- **F-11** Every prop of the component appears with a non-default value in at least one fixture.
- **F-12** Every condition in the contract template (`when`, and both branches of an `if` tag) is taken by at least one fixture and not taken by at least one fixture.
- **F-13** `invalid-enum-falls-back`: for a component with at least one `enum` prop that has a default. Passes a value that is not in the enumeration to the first such prop; the reference HTML shows the default (M-6).
- **F-14** `responsive`: for a component with at least one responsive prop. Passes a value with at least two tokens to the first such prop.
- **F-15** `escaping`: for a component that has, on its root or on one of its parts, at least one prop of type `string`, `id` or `url` that is printed as an attribute. The fixture passes the text `Say "hi" & <go>` (alone, or as part of the value where the attribute needs a prefix such as a path) to ONE such prop; the reference HTML contains the escaped form `Say &quot;hi&quot; &amp; &lt;go&gt;`. The owning component document names the target prop. The target is a prop whose value is not constrained by a pattern: for Tabs it is the list's `ariaLabel`, not the root's `defaultValue`, because a tab value is restricted by N-10 (D-012, D-074 item 3). A component with no such prop (RichText: `html` is not an attribute) has no `escaping` fixture.
- **F-16** `class`: passes `"class": "custom-a custom-b"`; the reference HTML shows `class="<root.class> custom-a custom-b"`, for example `class="rp-button custom-a custom-b"`, or `class="rp-drawer rp-cart-drawer custom-a custom-b"` for a composed root (N-3).
- **F-17** For a component with an initial-state prop (`defaultOpen`, `defaultValue`, `defaultChecked`): one fixture per such prop showing the non-default initial state.
- **F-24** Backend-scoped fixtures (D-074 item 7). Where the form dialect forces different TAGS per backend, so that masks cannot make the outputs equal, one state has two fixtures: `<name>` with `"hosts": ["html", "react", "remix"]` (hydrogen dialect) and `liquid-<name>` with `"hosts": ["liquid"]` (liquid dialect). This is allowed ONLY for CartLines, CartLine, CartSummary, CartNote, CheckoutButton, CartDrawer and DiscountCode. The build fails when any other component has a fixture whose name starts with `liquid-`, or uses `hosts` to hide a difference between hosts. For these seven components the required fixtures F-10 to F-17 exist once per backend (`default` and `liquid-default`, `class` and `liquid-class`, and likewise for every other fixture name); "the first fixture is `default`" still holds. Both fixtures of a pair are `generated: "hand"`, and the markup outside the backend-dependent subtree MUST be identical in the two files (`11-components-commerce.md` section 0).

The names `default`, `invalid-enum-falls-back`, `responsive`, `escaping` and `class`, and the prefix `liquid-`, are reserved for these meanings. Caller-supplied attributes (rest props, `attributes`) are not covered by shared fixtures; each host tests rule M-14 itself (`13-testing.md`).

### 11.6 Masks

A mask replaces or removes a non-portable value on BOTH sides (reference HTML and host output) before the canonical forms are compared. Masks are applied by `canonicalize(html, { mask })` (section 12). A fixture's `mask` applies in every host; there is no per-host mask. A difference that only some hosts produce is masked for all hosts, and an acceptance test asserts the masked value where it matters (D-149 item 14).

| `op` | `name` | Effect on every element matching `select` |
|---|---|---|
| `attr` | attribute name | If the attribute is present, its value becomes `MASKED`. Presence is still compared. |
| `drop-attr` | attribute name | The attribute is removed. Presence is not compared. |
| `srcset` | attribute name (normally `srcset`) | Each candidate URL becomes `MASKED`; descriptors are kept: `MASKED 400w, MASKED 800w`. The width list is still compared. |
| `text` | none | All children are replaced by the single text `MASKED`. |
| `children` | none | All children are removed. The element and its attributes are still compared. |
| `remove` | none | The element is removed. |

`select` uses the selector subset of 12.4. Rules are applied in array order.

What MUST be masked (ledger D-004, D-043, D-049), with the rule to copy:

| Non-portable value | Rule |
|---|---|
| Money text | `{ "select": "<the element holding the formatted amount>", "op": "text" }` |
| Image URL in `src` | `{ "select": "img", "op": "attr", "name": "src" }` |
| Image URLs in `srcset` | `{ "select": "img", "op": "srcset", "name": "srcset" }` (and the same for `source` inside Video) |
| Form `action` | `{ "select": "form.<part class>", "op": "attr", "name": "action" }` |
| Form attributes only one host prints (`accept-charset`, `enctype`) | `{ "select": "form.<part class>", "op": "drop-attr", "name": "<attribute>" }` |
| Hidden inputs the platform adds (`form_type`, `utf8`) | `{ "select": "form.<part class> > input[type=\"hidden\"]:not([data-rp-field])", "op": "remove" }` |
| Dialect field name and value of a Ripple-marked field | `{ "select": "[data-rp-field=\"<role>\"]", "op": "attr", "name": "name" }` and the same with `"name": "value"` |
| Cart line identity | `{ "select": "[data-rp-line]", "op": "attr", "name": "data-rp-line" }` |
| Opaque platform markup | `{ "select": ".<wrapper part class>", "op": "children" }` |
| A URL that differs by backend (checkout URL) | `{ "select": "<element>", "op": "attr", "name": "href" }` |
| Dialect attributes of a submit button (`name`, `value`; D-043) | `{ "select": ".<button part class>", "op": "drop-attr", "name": "name" }` and the same with `"name": "value"` |

- **F-18** A mask MUST NOT hide Ripple-owned contract. The build rejects a mask rule with `op` `attr` or `drop-attr` whose `name` is `class`, `id`, `role`, `type`, starts with `aria-`, or starts with `data-` other than `data-rp-line`. The build rejects `op` `remove`, `text` or `children` whose `select` consists of a single compound selector that is only a tag name (for example `"select": "div"`).
- **F-19** A mask rule with `op` `attr`, `srcset`, `text` or `children` that matches no element in the reference HTML fails the build (it is dead or mistyped). Rules with `op` `drop-attr` or `remove` are EXEMPT: they exist to delete platform-only markup that the reference HTML never has (D-074 item 5).
- **F-20** A fixture with `generated: "template"` or `"upgrade-snapshot"` SHOULD have no mask other than the money and image rules. Any other mask means the component has a host-owned region and its fixture is `hand`.

### 11.7 The `html` host reference file

`components/<id>/html/<id>.html` is generated by `pnpm gen` and scaffolded by `ripple add` for the `html` host (D-040). Format:

```html
<!-- ripple:fixture default -->
<button class="rp-button" type="button" data-variant="primary" data-size="md">Add to cart</button>

<!-- ripple:fixture link -->
<a class="rp-button" href="/cart" data-variant="primary" data-size="md">View cart</a>

<!-- ripple button/html <pkg>@<version> sha256:<64 hex> -->
```

- **F-21** Each fixture starts with a line that matches `^<!-- ripple:fixture ([a-z][a-z0-9]*(?:-[a-z0-9]+)*) -->$`. Its body runs to the next such line, to the provenance trailer, or to the end of the file. Fixtures appear in manifest order. A fixture whose `hosts` excludes `html` is omitted. One blank line separates fixtures.
- **F-22** The body of each fixture is the content of the fixture file, unchanged. The last line is the provenance trailer of D-056; its id is `<owner>/<key>`, here `<component id>/html`.
- **F-23** Conformance for the `html` host: for each fixture, the canonical form of the body in the reference file MUST equal the canonical form of the fixture file. (Comments, and therefore the markers and the trailer, are removed by canonicalisation.)

### 11.8 Fixture lint

`pnpm gen --check` runs these checks on every fixture file with `parse5`. Each failure prints `<component id>/<fixture name>: <check id>: <message>`.

| Check id | Fails when |
|---|---|
| `c-5` | Re-serialising the parsed fragment and parsing it again yields a different tree (the parser moved or dropped a node); or a `<form>` is inside a `<form>`; or an `<a>` or `<button>` contains an `<a>`, `<button>`, `<input>`, `<select>`, `<textarea>`, `<details>` or `<label>` |
| `c-6` | The fragment contains `<script>`, `<style>`, an attribute matching `/^on/i`, `data-state`, a `style` attribute not listed by the component spec, or a comment |
| `c-8` | A class token starting with `rp-` is not a root or part class in the manifest; or the class tokens of the root do not begin with the tokens of the manifest `root.class`, in order; or an element carries two `rp-` classes that are not exactly a `root.class` or part `class` value of the manifest (N-3) |
| `c-12` | A tag starting with `ui-` or `rp-` is not in C-12 or C-17. `rp-view-event` fails this check: it is allowed only in blueprint files (C-20) |
| `c-18` | An `rp-*` element lacks `data-slot` equal to its tag name, or lacks a manifest root class |
| `n-9` | An `id` inside the root is neither the root id nor a derived id of N-9 built from the root id. Skipped in a fixture named `escaping` (the test text is not a valid id) |
| `n-14` | A presence attribute of section 3.4 has a non-empty value; or an ARIA state attribute has a value outside the table |
| `n-hook` | A `data-rp-*` attribute name is not in section 3.5, or its value is outside the allowed set; or one of the test-harness attributes (`data-rp-case`, `data-rp-fixture`, `data-rp-test-raw`) or `data-rp-close` appears (the latter is accepted only on the SPIKE-05 fallback path) |
| `m-4` | A `data-<prop>` attribute on a root or part does not correspond to a manifest prop of that component, or its value fails the prop's enumeration, scale or the responsive grammar (`parseResponsive` returns an error) |
| `pe-2` | A `<button>` satisfies none of the five conditions of PE-2; or a `<form>` lacks `action` or `method`. Skipped on the root element of a fixture whose component id is `button` or `icon-button` (D-074 item 8) |
| `pe-3` | A prohibited `role` of PE-3 appears outside a `ui-*` root |
| `pe-4` | A `data-rp-js` element has no `rp-*` ancestor |
| `a-1` | `role="button"`, `role="link"`, or `tabindex` on a `<div>` or `<span>`; a `tabindex` value other than `0` or `-1` |
| `a-2` | An interactive element has no accessible name by the sources of A-2 |
| `a-3` | An `aria-labelledby`, `aria-describedby`, `aria-controls` or `for` value that has the form of a derived id of this fixture's root does not resolve inside the fixture. Skipped in a fixture named `escaping` |
| `a-4` | `aria-expanded` on `<summary>`, `[popovertarget]` or `[commandfor]`; `aria-checked` on a native input; `aria-hidden` on `<dialog>`; `open` on `<dialog>` |
| `a-5` | `aria-hidden="true"` on, or on an ancestor of, an `<a href>`, `<button>`, `<input>`, `<select>`, `<textarea>` or `<summary>` |
| `a-6` | `aria-disabled` on an element that also has `disabled` |
| `a-7` | An `<img>` without `alt`, `width` or `height`; an `<svg class="rp-icon">` without `aria-hidden="true"` and `focusable="false"` |
| `a-8` | An `<input>` (not `hidden`, `submit`, `button`, `reset`), `<select>` or `<textarea>` with no `<label for>`, no wrapping `<label>`, no `aria-label` and no `aria-labelledby`, in a fixture of Field or of a component whose spec says it prints its own label |
| `a-10` | A `<nav>` without `aria-label` or `aria-labelledby` |
| `a-11` | A commerce root (`rp-cart`, `rp-product-form`) whose fixture contains a `<form method="post">` but no `[data-rp-part="error"][role="alert"][hidden]` element with no text |
| `a-12` | A `data-*` attribute value containing the token `left` or `right` |
| `f-19` | A mask rule with `op` `attr`, `srcset`, `text` or `children` matches no element in the reference HTML (`drop-attr` and `remove` are exempt, F-19) |

### 11.9 Four worked fixtures

These four show the format for each `generated` value and for `children`, `parts`, a resource reference and masks. Each reference HTML block is a byte-equal copy of a fixture in the owning component document, which is linked under each heading (D-069). Each record validates against the schema of 11.2, and each canonical form shown was produced by the code in 12.5.

#### Fixture 1: Stack `responsive` (static, `template`, `children`, a responsive prop)

Source: [09-components-foundation.md](09-components-foundation.md), section "Stack", "HTML contract", fixture `responsive`.

Record in `components/stack/stack.json`:

```json
{
  "name": "responsive",
  "props": { "gap": "2 md:6", "align": "start" },
  "children": "<p>One</p><p>Two</p>",
  "generated": "template"
}
```

File `components/stack/fixtures/responsive.html`:

```html
<div class="rp-stack" data-direction="column" data-gap="2 md:6" data-align="start"><p>One</p><p>Two</p></div>
```

What it shows: `direction` is not passed, so its default `column` is printed (M-4 row 28, section 4.3); `gap` is printed unchanged (G-10); `justify`, `gapX`, `gapY` and `textAlign`, which have no default, print nothing.

Calls that MUST produce it:

```tsx
<Stack gap="2 md:6" align="start"><p>One</p><p>Two</p></Stack>
```

```liquid
{% block 'stack', gap: '2 md:6', align: 'start' %}<p>One</p><p>Two</p>{% endblock %}
```

Canonical form:

```text
<div class="rp-stack" data-align="start" data-direction="column" data-gap="2 md:6">
  <p>
    One
  </p>
  <p>
    Two
  </p>
</div>
```

#### Fixture 2: Accordion `single` (static, `template`, `parts`)

Source: [10-components-interactive.md](10-components-interactive.md), section "Accordion", "HTML contract", fixture `single`.

Record in `components/accordion/accordion.json`. The part prop names (`accordion`, `defaultOpen`) follow N-13 and D-035; `10-components-interactive.md` owns them. The root `id` is REQUIRED only because `type` is `single` (D-011).

```json
{
  "name": "single",
  "props": { "id": "faq", "type": "single" },
  "parts": [
    {
      "part": "item",
      "props": { "accordion": "faq", "defaultOpen": true },
      "parts": [
        { "part": "trigger", "children": "Shipping" },
        { "part": "content", "children": "<p>Ships in two days.</p>" }
      ]
    },
    {
      "part": "item",
      "props": { "accordion": "faq" },
      "parts": [
        { "part": "trigger", "children": "Returns" },
        { "part": "content", "children": "<p>Thirty days.</p>" }
      ]
    }
  ],
  "generated": "template"
}
```

File `components/accordion/fixtures/single.html`:

```html
<div class="rp-accordion" id="faq" data-type="single">
  <details class="rp-accordion-item" name="faq" open>
    <summary class="rp-accordion-trigger">Shipping</summary>
    <div class="rp-accordion-content"><p>Ships in two days.</p></div>
  </details>
  <details class="rp-accordion-item" name="faq">
    <summary class="rp-accordion-trigger">Returns</summary>
    <div class="rp-accordion-content"><p>Thirty days.</p></div>
  </details>
</div>
```

What it shows: nested `parts`; `type` prints `data-type` (M-4a); each item derives `name="faq"` from its own `accordion` prop (S-7, M-4 row 24); `defaultOpen` prints `open` (M-4 row 15); no `aria-expanded` anywhere (I-2). The line breaks between elements are not significant (C-7, K-12).

Canonical form:

```text
<div class="rp-accordion" data-type="single" id="faq">
  <details class="rp-accordion-item" name="faq" open="">
    <summary class="rp-accordion-trigger">
      Shipping
    </summary>
    <div class="rp-accordion-content">
      <p>
        Ships in two days.
      </p>
    </div>
  </details>
  <details class="rp-accordion-item" name="faq">
    <summary class="rp-accordion-trigger">
      Returns
    </summary>
    <div class="rp-accordion-content">
      <p>
        Thirty days.
      </p>
    </div>
  </details>
</div>
```

#### Fixture 3: Tabs `default` (kind `ui`, `upgrade-snapshot`)

Source: [10-components-interactive.md](10-components-interactive.md), section "Tabs", "HTML contract", fixture `default`.

Record in `components/tabs/tabs.json`. The part prop names (`tabs`, `value`, `selected`) are owned by `10-components-interactive.md`. There is no `orientation` prop (D-012).

```json
{
  "name": "default",
  "props": { "id": "t", "defaultValue": "account" },
  "parts": [
    {
      "part": "list",
      "props": { "ariaLabel": "Settings" },
      "parts": [
        { "part": "tab", "props": { "tabs": "t", "value": "account", "selected": true }, "children": "Account" },
        { "part": "tab", "props": { "tabs": "t", "value": "password" }, "children": "Password" }
      ]
    },
    { "part": "panel", "props": { "tabs": "t", "value": "account", "selected": true }, "children": "<p>Manage your profile.</p>" },
    { "part": "panel", "props": { "tabs": "t", "value": "password" }, "children": "<p>Choose a new password.</p>" }
  ],
  "generated": "upgrade-snapshot"
}
```

File `components/tabs/fixtures/default.html` (written by the snapshot command; line breaks added by the serialiser are not significant):

```html
<ui-tabs class="rp-tabs" id="t" default-value="account" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs">
  <ui-tabs-list class="rp-tabs-list" aria-label="Settings" role="tablist" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-list">
    <ui-tabs-tab value="account" role="none"><button class="rp-tabs-tab" type="button" role="tab" id="t-tab-account" aria-controls="t-panel-account" aria-selected="true" tabindex="0" data-selected data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-tab">Account</button></ui-tabs-tab>
    <ui-tabs-tab value="password" role="none"><button class="rp-tabs-tab" type="button" role="tab" id="t-tab-password" aria-selected="false" tabindex="-1" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-tab">Password</button></ui-tabs-tab>
  </ui-tabs-list>
  <ui-tabs-panel class="rp-tabs-panel" value="account" role="tabpanel" id="t-panel-account" aria-labelledby="t-tab-account" tabindex="0" data-selected data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-panel"><p>Manage your profile.</p></ui-tabs-panel>
  <ui-tabs-panel class="rp-tabs-panel" value="password" hidden data-slot="tabs-panel"><p>Choose a new password.</p></ui-tabs-panel>
</ui-tabs>
```

What it shows: the contract is the post-upgrade DOM (C-13). Without the `rp-` classes this markup produced zero attribute changes at upgrade with `@ui-sdk/web@0.1.0-beta.14` (`ripple/docs/research/spikes/uisdk-web/site/pe-body.html`, section `c-tabs-pre`; `ripple/docs/research/uisdk-web-elements.md` section 3.8). Note what the snapshot does NOT contain: the unselected tab has no `aria-controls`, and the unselected panel has no `role`, no `id` and no `aria-labelledby`; UI SDK writes those when the panel is first shown. Adding them by hand would break U-2. With the `rp-` classes added, the upgrade was measured again and makes only two same-value `role="none"` writes on the `ui-tabs-tab` elements, which are not mutations (U-2; `10-components-interactive.md`, Tabs, "State and attributes"; `ripple/docs/research/spikes/components-interactive/`). The Tabs allow-list is empty. `data-orientation="horizontal"` is always printed.

Canonical form (first lines):

```text
<ui-tabs class="rp-tabs" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs" default-value="account" id="t">
  <ui-tabs-list aria-label="Settings" class="rp-tabs-list" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-list" role="tablist">
    <ui-tabs-tab role="none" value="account">
      <button aria-controls="t-panel-account" aria-selected="true" class="rp-tabs-tab" data-activation-direction="none" data-orientation="horizontal" data-selected="" data-slot="tabs-tab" id="t-tab-account" role="tab" tabindex="0" type="button">
        Account
      </button>
    </ui-tabs-tab>
```

#### Fixture 4: ProductForm `children` (kind `commerce`, `hand`, resource reference, masks)

Source: [11-components-commerce.md](11-components-commerce.md), section "ProductForm", "HTML contract", fixture `children`, and the mask list under "Host-owned regions and masks" of the same section. The `children` string is the reference HTML of AddToCartButton `default` (same document, section "AddToCartButton"), as F-6 requires.

Record in `components/product-form/product-form.json`:

```json
{
  "name": "children",
  "props": { "id": "pf", "product": { "$resource": "product.basic" } },
  "children": "<button class=\"rp-button rp-add-to-cart-button\" type=\"submit\" name=\"intent\" value=\"add\" data-variant=\"primary\" data-size=\"md\" data-rp-part=\"submit\">Add to cart</button>",
  "mask": [
    { "select": "form.rp-product-form-fields", "op": "attr", "name": "action" },
    { "select": "form.rp-product-form-fields", "op": "drop-attr", "name": "accept-charset" },
    { "select": "form.rp-product-form-fields", "op": "drop-attr", "name": "enctype" },
    { "select": "form.rp-product-form-fields > input[type=\"hidden\"]:not([data-rp-field])", "op": "remove" },
    { "select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "name" },
    { "select": "[data-rp-field=\"merchandise-id\"]", "op": "attr", "name": "value" },
    { "select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "name" },
    { "select": ".rp-add-to-cart-button", "op": "drop-attr", "name": "value" }
  ],
  "generated": "hand"
}
```

File `components/product-form/fixtures/children.html` (hydrogen dialect, in full, F-9):

```html
<rp-product-form class="rp-product-form" data-slot="rp-product-form">
  <form class="rp-product-form-fields" id="pf" method="post" action="/api/cart">
    <input type="hidden" name="merchandiseId" value="gid://shopify/ProductVariant/11" data-rp-field="merchandise-id">
    <button class="rp-button rp-add-to-cart-button" type="submit" name="intent" value="add" data-variant="primary" data-size="md" data-rp-part="submit">Add to cart</button>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  </form>
</rp-product-form>
```

Points fixed by the owning document that this copy shows: the root carries NO `data-rp-refresh` (section 3.5); the `id` is on the `<form>` (N-12); the submit button is an AddToCartButton composed from Button (`class="rp-button rp-add-to-cart-button"`, N-3) and carries the dialect attributes `name="intent" value="add"` and the hook `data-rp-part="submit"`.

What the Liquid host prints for the same fixture. This block is host output, not a fixture; its shape follows the description in `11-components-commerce.md` (section "ProductForm": `{% form 'product' %}` adds `action="/cart/add"`, `accept-charset`, `enctype` and two hidden inputs; the variant field is `name="id"` with the numeric id). The children are the fixture's literal `children` string (F-7):

```html
<rp-product-form
  class="rp-product-form "
  data-slot="rp-product-form"
>
  <form method="post" action="/cart/add" id="pf" accept-charset="UTF-8" class="rp-product-form-fields" enctype="multipart/form-data"><input type="hidden" name="form_type" value="product"><input type="hidden" name="utf8" value="✓">
    <input type="hidden" name="id" value="11" data-rp-field="merchandise-id">
    <button class="rp-button rp-add-to-cart-button" type="submit" name="intent" value="add" data-variant="primary" data-size="md" data-rp-part="submit">Add to cart</button>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>
  </form>
</rp-product-form>
```

Both canonicalise, with the fixture's masks, to exactly this (verified with the code of 12.5: equal with masks, different without):

```text
<rp-product-form class="rp-product-form" data-slot="rp-product-form">
  <form action="MASKED" class="rp-product-form-fields" id="pf" method="post">
    <input data-rp-field="merchandise-id" name="MASKED" type="hidden" value="MASKED">
    <button class="rp-button rp-add-to-cart-button" data-rp-part="submit" data-size="md" data-variant="primary" type="submit">
      Add to cart
    </button>
    <p class="rp-form-message" data-rp-part="error" data-tone="destructive" hidden="" role="alert">
    </p>
  </form>
</rp-product-form>
```

What it shows: the Ripple-owned parts (root, form class and id, the `data-rp-field` and `data-rp-part` hooks, the composed button classes, the error part) are compared exactly; the host-owned values (`action`, field `name` and `value`, the submit button's dialect `name` and `value`, platform inputs and attributes) are masked. The two `drop-attr` rules on the form and the `remove` rule match nothing in the reference HTML; that is allowed (F-19). The two `drop-attr` rules on `.rp-add-to-cart-button` matter in the fixture `default` of the same component, where the Liquid binding itself prints the button with `name="add"` and no `value`.

---

## 12. Canonicalisation

Canonicalisation turns an HTML fragment into a canonical text form. Two fragments conform when their canonical forms are byte-equal. It is the only comparison used for fixture conformance (D-063 tier 2).

Ownership (D-075): this section owns the algorithm (the 11 steps K-1 to K-11), the selector subset (12.4) and the reference code. The file `src/testing/canonicalize.ts` IS the reference code of 12.5; there is no second implementation. `13-testing.md` owns the harnesses that call it and does not restate the algorithm.

### 12.1 Where it lives

- Source: `src/testing/canonicalize.ts`, exported from `<pkg>/testing` as `canonicalize`, `selectAll`, `parseSelector`, `MASKED`.
- Parser: `parse5` version 8, `parseFragment`. `parse5` is a build-time dependency bundled into `dist/testing` and `dist/check`; it is NOT a runtime `dependency` of the package (D-052).
- Prior art: `ripple/docs/research/spikes/liquid/canon.mjs`. Differences from it: boolean attributes print as `name=""` (D-063), adjacent text nodes are merged, host extras are removed, masks and unwrap are applied, `pre` and `textarea` text is kept verbatim.

### 12.2 Signature

```ts
export type MaskOp = "attr" | "drop-attr" | "srcset" | "text" | "children" | "remove";
export interface MaskRule { select: string; op: MaskOp; name?: string }
export interface CanonicalizeOptions {
  /** Fixture masks (11.6). Applied in order. */
  mask?: MaskRule[];
  /** Selectors of wrapper elements to replace by their children. Default []. Used only by the SPIKE-02 fallback (section 15). */
  unwrap?: string[];
}
export function canonicalize(html: string, options?: CanonicalizeOptions): string;
```

### 12.3 Algorithm

The steps run in this order.

- **K-1 Parse.** Parse the input as an HTML fragment with the standard HTML parsing algorithm (`parseFragment(html)`, no context element). Entity forms (`&quot;` and `&#34;`), attribute quoting style, attribute order, duplicate attributes (first wins) and tag-name case are thereby already normalised. The content of a `<template>` element is its template contents.
- **K-2 Remove comments.** Remove every comment node and doctype node at every depth. This removes React's comment nodes (the `<!-- -->` text separators and every other comment React prints, which are host extras of the `react` host), Liquid comments that reach the output, fixture markers (F-21) and provenance trailers.
- **K-3 Unwrap.** For each selector in `options.unwrap`, replace every matching element by its children.
- **K-4 Remove host extras.** Remove every attribute whose name starts with `data-rmx-` (D-034 item 8). This list of prefixes is the constant `HOST_EXTRA_PREFIXES`; adding a prefix needs a ledger change. The complete set of host extras that canonicalisation removes is (D-075): `data-rmx-*` attributes (this step); React comment nodes (step K-2); and, on the SPIKE-02 fallback path only, the platform wrapper element (step K-3).
- **K-5 Apply masks.** For each rule in `options.mask`, in order, apply its effect (11.6) to every element matching `select` at that moment.
- **K-6 Attributes.** For each element: lowercase every attribute name (this also lowercases SVG names such as `viewBox`); sort attributes by name in ascending UTF-16 code unit order.
- **K-7 Class.** The value of `class` is split on ASCII whitespace, empty tokens are dropped, and the tokens are joined with one space. Token ORDER is kept (it is part of the contract, N-2). No other attribute value is changed: `data-gap="2  md:6"` stays as written.
- **K-8 Boolean attributes.** An attribute with an empty value is printed as `name=""`. Therefore `disabled`, `disabled=""` are equal; `disabled="disabled"` is NOT equal to them and bindings MUST NOT print that form.
- **K-9 Text.** Merge adjacent text nodes. Then, outside verbatim elements, collapse every run of ASCII whitespace (tab, LF, FF, CR, space) to one space, trim the result, and drop the node when it is empty. Inside the verbatim elements `pre`, `textarea`, `script` and `style` (at any depth below them) text is kept exactly as parsed.
- **K-10 Serialise.** Depth-first, one line per node, indentation of two spaces per depth:
  - element start: `<tag` + for each attribute ` name="value"` + `>`; the tag name is lowercased; attribute values escape `&` as `&amp;` and `"` as `&quot;`;
  - void elements (`area base br col embed hr img input link meta source track wbr`) have no children and no end line;
  - text: the text with `&`, `<`, `>` escaped as `&amp;`, `&lt;`, `&gt;`;
  - a line feed inside an attribute value or inside verbatim text is written `&#10;` so that one node is always one line;
  - element end: `</tag>` at the element's indentation;
  - the output ends with one line feed.
- **K-11 Compare.** Conformance holds when `canonicalize(hostOutput, { mask }) === canonicalize(referenceHtml, { mask })`, with the same `mask` (the fixture's) on both sides. On failure the test prints the fixture id (`<component id>/<fixture name>`), the host, and a unified line diff of the two canonical forms.

Consequences that authors must know:

- **K-12** Whitespace between elements, and leading or trailing whitespace of a text node, is not compared (D-063, D-075: adjacent text nodes merge; whitespace runs collapse to one space; text is trimmed; empty text nodes are dropped; `pre`, `textarea`, `script` and `style` content is verbatim). `<b>a</b> <i>b</i>` and `<b>a</b><i>b</i>` are canonically equal. This is why contracts MUST NOT depend on whitespace (C-7) and why component CSS MUST NOT use `:empty` (`03-styling-and-tokens.md`).
- **K-13** Attribute VALUES are compared exactly, apart from `class` whitespace. `tabindex="0"` and `tabindex="00"` differ; `data-full-width=""` and `data-full-width="true"` differ; `aria-busy="true"` and `aria-busy=""` differ.
- **K-14** A fragment whose first element can only exist inside a table (`<tr>`, `<td>`, `<th>`, `<tbody>`, `<thead>`, `<tfoot>`, `<caption>`, `<colgroup>`, `<col>`) is dropped by the fragment parser. No V1 contract has such a root. A fixture or `children` string MUST NOT start with one of these elements. `<li>` and `<option>` at the top level parse correctly.
- **K-15** Canonicalisation never validates. Lint (11.8) validates; canonicalisation only compares.

### 12.4 Selector subset

Mask rules, `unwrap` and upgrade allow-list entries use this subset. Nothing else is supported; an unsupported selector throws.

```abnf
selector   = compound *( combinator compound )
combinator = 1*SP                       ; descendant
           / *SP ">" *SP                ; child
compound   = ( tag / "*" ) *filter
           / 1*filter
filter     = class / attr / negation
tag        = ALPHA-LOWER *( ALPHA-LOWER / DIGIT / "-" )
class      = "." 1*( ALPHA / DIGIT / "_" / "-" )
attr       = "[" attr-name "]"
           / "[" attr-name "=" DQUOTE *attr-char DQUOTE "]"
attr-name  = ALPHA-LOWER *( ALPHA-LOWER / DIGIT / "-" )
attr-char  = any character except DQUOTE and ")"
negation   = ":not(" ( tag / class / attr ) ")"
```

- Matching is case-sensitive on values; tag and attribute names are lowercase.
- `[name]` matches when the attribute is present; `[name="v"]` when its value equals `v` exactly.
- `.x` matches when `x` is one of the whitespace-separated tokens of `class`.
- No selector lists (`,`), no sibling combinators, no pseudo-classes other than `:not()` with one simple selector, no unquoted attribute values.
- An element directly under the fragment root has no parent element; `a > b` cannot match such a `b`.

### 12.5 Reference implementation

This is the complete file `src/testing/canonicalize.ts`. It was run with Node 22.23 and `parse5@8.1.1` against: Liquid-style and React-style output of the same button (equal); `<span>Lines <!-- -->3</span>` against `<span>Lines 3</span>` (equal); `data-rmx-*` removal; `&#34;` against `&quot;` (equal); an SVG icon; `<template>` contents; `pre` and `textarea`; the masks of fixture 4 (equal with masks, different without); `unwrap`; and six invalid selectors (all throw). The implementer MUST copy it as written and port those cases to `src/testing/canonicalize.test.ts`.

```ts
import { parseFragment } from "parse5";

export type MaskOp = "attr" | "drop-attr" | "srcset" | "text" | "children" | "remove";
export interface MaskRule {
  select: string;
  op: MaskOp;
  name?: string;
}
export interface CanonicalizeOptions {
  mask?: MaskRule[];
  unwrap?: string[];
}

interface Attr { name: string; value: string }
interface Node {
  nodeName: string;
  tagName?: string;
  value?: string;
  attrs?: Attr[];
  childNodes?: Node[];
  content?: Node;
  parentNode?: Node | null;
}

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const VERBATIM = new Set(["pre", "textarea", "script", "style"]);
const HOST_EXTRA_PREFIXES = ["data-rmx-"];
export const MASKED = "MASKED";

// ---------- tree helpers ----------

const isElement = (n: Node): boolean => typeof n.tagName === "string";
const tagOf = (n: Node): string => (n.tagName as string).toLowerCase();
const kids = (n: Node): Node[] => (n.nodeName === "template" && n.content ? n.content.childNodes ?? [] : n.childNodes ?? []);
const setKids = (n: Node, list: Node[]): void => {
  const holder = n.nodeName === "template" && n.content ? n.content : n;
  holder.childNodes = list;
  for (const c of list) c.parentNode = n;
};
const getAttr = (n: Node, name: string): string | undefined => n.attrs?.find((a) => a.name.toLowerCase() === name)?.value;

function link(node: Node, parent: Node | null): void {
  node.parentNode = parent;
  for (const c of kids(node)) link(c, node);
}
function elements(root: Node, out: Node[] = []): Node[] {
  for (const c of kids(root)) {
    if (isElement(c)) {
      out.push(c);
      elements(c, out);
    }
  }
  return out;
}

// ---------- selector subset (12.4) ----------

interface Simple { kind: "tag" | "class" | "attr"; name: string; value?: string }
interface Compound { must: Simple[]; not: Simple[] }
interface Step { compound: Compound; combinator: " " | ">" | null } // relation to the step on its left

const RE_SIMPLE = /^(?:([a-z][a-z0-9-]*|\*)|\.([A-Za-z0-9_-]+)|\[([a-z][a-z0-9-]*)(?:="([^"]*)")?\])/;

function parseSimple(src: string): { simple: Simple | null; rest: string } {
  const m = RE_SIMPLE.exec(src);
  if (!m) throw new Error(`canonicalize: bad selector near "${src}"`);
  const rest = src.slice(m[0].length);
  if (m[1] !== undefined) return { simple: m[1] === "*" ? null : { kind: "tag", name: m[1] }, rest };
  if (m[2] !== undefined) return { simple: { kind: "class", name: m[2] }, rest };
  return { simple: { kind: "attr", name: m[3], value: m[4] }, rest };
}

export function parseSelector(selector: string): Step[] {
  const steps: Step[] = [];
  let src = selector.trim();
  let combinator: " " | ">" | null = null;
  if (src === "") throw new Error("canonicalize: empty selector");
  while (src !== "") {
    const compound: Compound = { must: [], not: [] };
    let consumed = false;
    while (src !== "" && !/^[\s>]/.test(src)) {
      if (src.startsWith(":not(")) {
        const end = src.indexOf(")");
        if (end === -1) throw new Error(`canonicalize: bad selector "${selector}"`);
        const inner = parseSimple(src.slice(5, end));
        if (inner.rest !== "" || inner.simple === null) throw new Error(`canonicalize: bad :not() in "${selector}"`);
        compound.not.push(inner.simple);
        src = src.slice(end + 1);
      } else {
        const parsed = parseSimple(src);
        if (parsed.simple) compound.must.push(parsed.simple);
        src = parsed.rest;
      }
      consumed = true;
    }
    if (!consumed) throw new Error(`canonicalize: bad selector "${selector}"`);
    steps.push({ compound, combinator });
    const gap = /^\s*(>?)\s*/.exec(src) as RegExpExecArray;
    if (gap[0] === "") break;
    combinator = gap[1] === ">" ? ">" : " ";
    src = src.slice(gap[0].length);
    if (src === "") throw new Error(`canonicalize: selector ends with a combinator: "${selector}"`);
  }
  return steps;
}

function matchesSimple(el: Node, s: Simple): boolean {
  if (s.kind === "tag") return tagOf(el) === s.name;
  if (s.kind === "class") return (getAttr(el, "class") ?? "").split(/[\t\n\f\r ]+/).includes(s.name);
  const value = getAttr(el, s.name);
  return value !== undefined && (s.value === undefined || value === s.value);
}
function matchesCompound(el: Node, c: Compound): boolean {
  return c.must.every((s) => matchesSimple(el, s)) && !c.not.some((s) => matchesSimple(el, s));
}
function parentElement(el: Node): Node | null {
  const p = el.parentNode ?? null;
  return p && isElement(p) ? p : null;
}
function matchesFrom(el: Node, steps: Step[], index: number): boolean {
  if (!matchesCompound(el, steps[index].compound)) return false;
  if (index === 0) return true;
  const combinator = steps[index].combinator;
  let p = parentElement(el);
  if (combinator === ">") return p !== null && matchesFrom(p, steps, index - 1);
  while (p !== null) {
    if (matchesFrom(p, steps, index - 1)) return true;
    p = parentElement(p);
  }
  return false;
}
export function selectAll(root: Node, selector: string): Node[] {
  const steps = parseSelector(selector);
  return elements(root).filter((el) => matchesFrom(el, steps, steps.length - 1));
}

// ---------- passes ----------

function removeComments(node: Node): void {
  setKids(node, kids(node).filter((c) => c.nodeName !== "#comment" && c.nodeName !== "#documentType"));
  for (const c of kids(node)) removeComments(c);
}

function detach(el: Node, replacement: Node[]): void {
  const parent = el.parentNode as Node;
  const list = kids(parent);
  const at = list.indexOf(el);
  setKids(parent, [...list.slice(0, at), ...replacement, ...list.slice(at + 1)]);
}

function removeHostExtras(root: Node): void {
  for (const el of elements(root)) {
    el.attrs = (el.attrs ?? []).filter((a) => !HOST_EXTRA_PREFIXES.some((p) => a.name.toLowerCase().startsWith(p)));
  }
}

function maskSrcset(value: string): string {
  return value
    .split(",")
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate !== "")
    .map((candidate) => {
      const parts = candidate.split(/[\t\n\f\r ]+/);
      const last = parts[parts.length - 1];
      return parts.length > 1 && /^[0-9]+(\.[0-9]+)?[wx]$/.test(last) ? `${MASKED} ${last}` : MASKED;
    })
    .join(", ");
}

function applyMask(root: Node, rule: MaskRule): void {
  const needsName = rule.op === "attr" || rule.op === "drop-attr" || rule.op === "srcset";
  if (needsName && !rule.name) throw new Error(`canonicalize: mask op "${rule.op}" needs "name"`);
  if (!needsName && rule.name !== undefined) throw new Error(`canonicalize: mask op "${rule.op}" takes no "name"`);
  const name = (rule.name ?? "").toLowerCase();
  for (const el of selectAll(root, rule.select)) {
    if (el.parentNode === undefined) continue; // already removed by this rule
    switch (rule.op) {
      case "attr":
        for (const a of el.attrs ?? []) if (a.name.toLowerCase() === name) a.value = MASKED;
        break;
      case "srcset":
        for (const a of el.attrs ?? []) if (a.name.toLowerCase() === name) a.value = maskSrcset(a.value);
        break;
      case "drop-attr":
        el.attrs = (el.attrs ?? []).filter((a) => a.name.toLowerCase() !== name);
        break;
      case "text":
        setKids(el, [{ nodeName: "#text", value: MASKED }]);
        break;
      case "children":
        setKids(el, []);
        break;
      case "remove":
        detach(el, []);
        el.parentNode = undefined;
        break;
      default:
        throw new Error(`canonicalize: unknown mask op "${String(rule.op)}"`);
    }
  }
}

const escText = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string): string => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

function serialize(node: Node, depth: number, verbatim: boolean, out: string[]): void {
  const pad = "  ".repeat(depth);
  // K-9: merge adjacent text nodes (comment removal can leave two side by side).
  const merged: Node[] = [];
  for (const c of kids(node)) {
    const prev = merged[merged.length - 1];
    if (c.nodeName === "#text" && prev && prev.nodeName === "#text") prev.value = (prev.value ?? "") + (c.value ?? "");
    else merged.push(c.nodeName === "#text" ? { nodeName: "#text", value: c.value ?? "" } : c);
  }
  for (const c of merged) {
    if (c.nodeName === "#text") {
      const text = verbatim ? (c.value as string) : (c.value as string).replace(/[\t\n\f\r ]+/g, " ").trim();
      if (text !== "") out.push(pad + escText(text).replace(/\n/g, "&#10;"));
      continue;
    }
    if (!isElement(c)) continue;
    const tag = tagOf(c);
    const attrs = (c.attrs ?? [])
      .map((a): [string, string] => {
        const name = a.name.toLowerCase();
        const value = name === "class" ? a.value.split(/[\t\n\f\r ]+/).filter(Boolean).join(" ") : a.value;
        return [name, value];
      })
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([name, value]) => ` ${name}="${escAttr(value).replace(/\n/g, "&#10;")}"`)
      .join("");
    out.push(`${pad}<${tag}${attrs}>`);
    if (VOID.has(tag)) continue;
    serialize(c, depth + 1, verbatim || VERBATIM.has(tag), out);
    out.push(`${pad}</${tag}>`);
  }
}

// ---------- entry ----------

export function canonicalize(html: string, options: CanonicalizeOptions = {}): string {
  const root = parseFragment(html) as unknown as Node;
  link(root, null);
  removeComments(root);                                   // K-2
  for (const selector of options.unwrap ?? []) {          // K-3
    for (const el of selectAll(root, selector)) detach(el, kids(el));
  }
  removeHostExtras(root);                                 // K-4
  for (const rule of options.mask ?? []) applyMask(root, rule); // K-5
  const out: string[] = [];
  serialize(root, 0, false, out);                         // K-6 to K-10
  return out.join("\n") + "\n";
}
```

### 12.6 Acceptance table

`src/testing/canonicalize.test.ts` MUST assert at least these. "Equal" means the two canonical forms are byte-equal.

| # | Input A | Input B | Options | Expected |
|---|---|---|---|---|
| 1 | `<button class="rp-button " type="button" disabled data-variant="primary" data-size="md">\n  Add to cart\n</button>` | `<button data-size="md" data-variant="primary" disabled="" type="button" class="rp-button">Add to cart</button>` | none | equal |
| 2 | `<span>Lines <!-- -->3</span>` | `<span>Lines 3</span>` | none | equal |
| 3 | `<ui-tabs id="t" data-rmx-key="t"><button data-rmx-preserve-attrs="aria-selected tabindex">A</button></ui-tabs>` | `<ui-tabs id="t"><button>A</button></ui-tabs>` | none | equal |
| 4 | `<a aria-label="Say &#34;hi&#34;" href="/a?b=1&amp;c=2">x</a>` | `<a aria-label="Say &quot;hi&quot;" href="/a?b=1&c=2">x</a>` | none | equal |
| 5 | `<div class="a" class="b"></div>` | `<div class="a"></div>` | none | equal |
| 6 | `<div data-full-width></div>` | `<div data-full-width="true"></div>` | none | NOT equal |
| 7 | `<div class="rp-a rp-b"></div>` | `<div class="rp-b rp-a"></div>` | none | NOT equal |
| 8 | `<pre>a  b</pre>` | `<pre>a b</pre>` | none | NOT equal |
| 9 | `<p>a  b</p>` | `<p> a b </p>` | none | equal |
| 10 | fixture 4 reference HTML | fixture 4 Liquid output (11.9) | fixture 4 `mask` | equal |
| 11 | fixture 4 reference HTML | fixture 4 Liquid output | none | NOT equal |
| 12 | `<div class="shopify-block" id="x"><p class="rp-text">a</p></div>` | `<p class="rp-text">a</p>` | `unwrap: ["div.shopify-block"]` | equal |
| 13 | `<img src="https://a/x.jpg?width=400" srcset="https://a/x.jpg?width=400 400w, https://a/x.jpg?width=800 800w">` | `<img src="//cdn/x.jpg?v=1&width=400" srcset="//cdn/x.jpg?v=1&width=400 400w, //cdn/x.jpg?v=1&width=800 800w">` | `mask: [{select:"img",op:"attr",name:"src"},{select:"img",op:"srcset",name:"srcset"}]` | equal; canonical form is `<img src="MASKED" srcset="MASKED 400w, MASKED 800w">` |
| 14 | `<svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M0 0"/></svg>` | (single input) | none | first line is `<svg aria-hidden="true" class="rp-icon" focusable="false" viewbox="0 0 24 24">` |
| 15 | `parseSelector` on each of: empty string, `a >`, `a:hover`, `a, b`, `[x=1]`, `a + b` | | | each throws |

---

## 13. Acceptance criteria for this document

The work this document specifies is done when all of the following hold. Each is checkable by a script.

1. `src/responsive.ts` exists with `parseResponsive` and `resolveResponsive` as in 5.5, and `src/responsive.test.ts` asserts every row of 5.6.
2. `src/testing/canonicalize.ts` exists as in 12.5, and `src/testing/canonicalize.test.ts` asserts every row of 12.6.
3. `fixture.schema.json` equals the schema of 11.2 and `manifest.schema.json` references it for fixture items. The four records of 11.9 validate. Each of these eight is rejected: a record with `name: "Default"`, a record with both `children` and `parts`, a mask rule `{ "select": "x", "op": "attr" }`, a mask rule `{ "select": "x", "op": "text", "name": "y" }`, a prop key `full_width`, a prop value `{ "x": 1 }`, `generated: "auto"`, and `hosts: ["vue"]`.
4. `pnpm gen --check` runs the fixture lint of 11.8 and the required-fixture checks F-10 to F-17 on every component and exits non-zero on any finding.
5. `pnpm gen --check` fails when a `generated: "template"` fixture file differs from the reference renderer's output (F-2), when a fixture record contains `html` (F-1), when a mask violates F-18 or F-19, when a fixture named `liquid-<name>` or a host-scoped pair exists outside the seven components of F-24, and when a fixture references an undefined resource (F-4).
6. For every component and every fixture, in every host listed for the fixture, tier 2 holds: `canonicalize(hostOutput, { mask }) === canonicalize(referenceHtml, { mask })`.
7. For every fixture, tier 3 holds: rule U-2 with the component's `upgradeAllow` plus `GLOBAL_UPGRADE_ALLOW`; same-value attribute writes are reported and do not fail. A unit test of the judge in `src/testing/upgrade-diff.ts` asserts: a record `role: "none" -> "none"` yields zero failures and one `info` entry; a record `disabled: null -> ""` on `[data-rp-part="next"]` fails with an empty allow-list and passes with 7.3 entry 4.
8. Every component's `html/<id>.html` reference file parses by F-21 into the same fixture names, in the same order, as the manifest (minus fixtures that exclude `html`), and F-23 holds.
9. Checker rule RP118 reports any `data-rp-*` attribute name outside section 3.5 and any `data-state` (`07-manifest-registry-cli.md`).
10. The fixture lint rejects `rp-view-event` in a component fixture (`c-12`), accepts `class="rp-drawer rp-cart-drawer"` only because the manifest of CartDrawer lists that pair (`c-8`), and skips `pe-2` on the root of Button and IconButton fixtures.
11. Every worked fixture of 11.9 and both Button fixtures of 4.6 are byte-equal to the fixture of the same name in the owning component document. A script extracts the fenced `html` block that follows each "File `components/...`" line (11.9) and each "Fixture `<name>`" line (4.6) and compares it with the block of the same fixture in `09-components-foundation.md`, `10-components-interactive.md` or `11-components-commerce.md`.

---

## 14. Evidence and UNVERIFIED

Evidence:

- Upgrade-stable contract, zero attribute diff for Tabs with an authored root id: `ripple/docs/research/uisdk-web-elements.md` sections 2.2, 2.3, 3.8; `ripple/docs/research/spikes/uisdk-web/site/pe-body.html`; `ripple/docs/research/spikes/uisdk-web/out/all-bare.diff.txt`. With the `rp-` classes added: two same-value `role` writes and no mutation (`10-components-interactive.md`, Tabs; `ripple/docs/research/spikes/components-interactive/`).
- UI SDK id generation and bound elements: `uisdk/packages/web/src/define-element.ts`.
- React serialisation differences that canonicalisation removes (`<!-- -->`, boolean attribute form, attribute order): `ripple/docs/research/react-and-custom-elements.md` sections 2.1 and 8 item 16.
- Liquid constraints on the contract (no child introspection, one outlet, whitespace, entity forms, host-owned form internals, opaque markup, money text, image URLs): `ripple/docs/research/liquid-blocks-partials.md` section 8.
- Canonicaliser prior art: `ripple/docs/research/spikes/liquid/canon.mjs`.
- Fixture keys and worked manifest entries: `ripple/docs/research/agent-kit-and-distribution.md` sections 4.2, 4.3, 5.1.
- Duplicate attribute resolution (first occurrence wins), the canonical forms in 11.9 (including fixture 4 with its eight masks) and every row of 5.6 and 12.6: run for this document with Node 22.23 and `parse5@8.1.1`.
- Fixture schema: validated with Python `jsonschema` 4.26 (Draft 2020-12), four valid records and eight invalid records.

UNVERIFIED:

- That React 19 and Remix 3 print `commandfor`, `command` and `popovertarget` unchanged on `<button>`, and `popover=""` (the empty value) on a `<div>`. SPIKE-05; fallback in section 15.
- That the platform element created by `createViewEventElement()` from `@shopify/standard-events` accepts the markup of C-20 under the tag name `rp-view-event`. SPIKE-01 (D-089); owned by `05-commerce.md`.
- Browser support of the `popover` attribute and of exclusive `<details name>` below their first versions (Chrome 114 / Safari 17.0 / Firefox 125, and Chrome 120 / Safari 17.2; numbers from compatibility tables, not run). The contracts do not change; the behaviour on such browsers is the capability tier of D-081.
- Whether Shopify wraps `{% block %}` or `{% partial %}` output in an element. SPIKE-02; fallback in section 15.
- Cross-engine behaviour (WebKit, Gecko) of `<details name>`, `closedby` and Invoker Commands, on which rows of section 8 depend. SPIKE-06; fallbacks are owned by `03-styling-and-tokens.md`, `04-elements.md` and `10-components-interactive.md`.
- The exact attribute UI SDK writes when a tooltip trigger has no accessible name of its own. Not needed: the contract requires the trigger to have its own name (section 8, A-2).

---

## 15. Fallbacks

### Fallback (SPIKE-02)

Applies only if the preview store shows that the platform wraps `{% block %}` or `{% partial %}` output in an element.

1. Contracts do not change. The wrapper is a host extra of the `liquid` host.
2. The Liquid conformance harness passes `unwrap: ["<wrapper selector>"]` to `canonicalize` for host output only (the reference HTML has no wrapper). The selector is recorded once, in `src/testing/liquid-shim.ts`, as the constant `LIQUID_WRAPPERS: string[]` (the name of `13-testing.md` section 21, D-134 item 16). Example for a wrapper of the classic form: `["div.shopify-block"]`.
3. If the wrapper carries attributes that vary per instance, nothing more is needed: an unwrapped element's attributes are discarded.
4. `base.css` gives the wrapper `display: contents` and region lookup uses the wrapper (`03-styling-and-tokens.md`, `05-commerce.md`, `14-liquid-theme.md`).
5. Acceptance: row 12 of 12.6.

### Fallback (SPIKE-05)

Applies only if a TSX host does not print `commandfor` / `command` / `popovertarget` unchanged, or does not print `popover=""`, or the polyfill fails in an engine. The two parts are independent; each is taken only for the attribute that failed.

Part A, invoker attributes:

1. Button and IconButton bindings additionally print `data-rp-open="<id>"` on a button that has `command="show-modal"` and `data-rp-close="<id>"` on a button that has `command="close"`, in all four hosts. The native attributes stay.
2. The rows `data-rp-open` and `data-rp-close` of section 3.5 already describe this path: `data-rp-open` is then allowed on `<button>` openers too, and `data-rp-close` is printed on `<button>` closers. On the default path `data-rp-close` is never printed.
3. The section 8 row "Button opener / closer of a dialog" gains the two attributes in "MUST print" and loses them in "MUST NOT print". Every affected fixture is regenerated.
4. The runtime's opener listener handles both attributes (`04-elements.md`).
5. The lint check `n-hook` and checker rule RP118 accept `data-rp-close`.

Part B, the Popover panel:

1. Popover prints `popover="auto"` instead of `popover=""`, in ALL FOUR hosts (D-010). The same applies to every other panel that uses the `popover` attribute (the NavigationMenu panels).
2. The section 8 rows "Popover" and "NavigationMenu, MobileNav" change `popover=""` to `popover="auto"`. Every affected fixture is regenerated. `popover="manual"` stays prohibited on these panels.

---

## Ledger issues

None open. See `00-decisions.md` sections 13.2 and 13.3 (D-109 to D-113).
