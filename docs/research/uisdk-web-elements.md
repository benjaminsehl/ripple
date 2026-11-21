# UI SDK web-components adapter (`@ui-sdk/web`): findings for Ripple

Status: research input for the Ripple spec. Investigated version: `@ui-sdk/web` and `@ui-sdk/core` **0.1.0-beta.14** (local clone `uisdk/`, and the npm tarballs of the same version).

Path conventions: `uisdk/...` is the local clone of vercel-labs/ui. `npm:@ui-sdk/web/...` is a file inside the published 0.1.0-beta.14 tarball (it is generated at publish time and is not in the clone). `spike/...` is `docs/research/spikes/uisdk-web/...` in this repo.

## 0. What was run and what was only read

| Evidence | How obtained |
|---|---|
| DOM before and after upgrade for 25 component entries, injected styles, network requests | **Run.** Playwright (Chromium), page loaded once with JavaScript disabled and once enabled, element-by-element attribute diff. Output: `spike/out/all-bare.diff.txt`. |
| Fully pre-rendered markup produces zero attribute diff (tabs, dialog, accordion, field) | **Run.** `spike/out/pe-bare.diff.txt`, `spike/out/t2.txt`. |
| Form submission with and without JavaScript (checkbox, select, number input, field, button) | **Run.** `spike/out/interact.live.txt`, `spike/out/t2.txt`. |
| Link inside a trigger, tabs as links, open-state attributes, `inert`, top layer, scroll lock | **Run.** Same files. |
| Custom element built with `definePrimitive` + `createParts` from the browser build `web/core.js` | **Run.** `spike/site/custom.js`, results in `spike/out/interact.live.txt`. |
| Attributes stripped after upgrade (simulated DOM morph), node replacement, `innerHTML` replacement | **Run.** `spike/out/t2.txt`. |
| `hidden` versus author `display` rules before and after upgrade, position of injected `<style>` | **Run.** `spike/t3.mjs` (output quoted in section 6). |
| npm registry reachable; version list and publish times | **Run.** `npm view @ui-sdk/web versions/time/dist-tags`. |
| Adapter internals, `createParts` types, per-component definitions | **Read.** `uisdk/packages/web/src/*.ts`. |
| Docs guides and component pages | **Read.** `uisdk/apps/docs/content/docs/web-components/*.mdx` and the rendered copies `npm:@ui-sdk/web/docs/**`. |
| Attribute, event and CSS-variable tables in the appendices | **Generated** from `npm:@ui-sdk/web/custom-elements.json` and `npm:@ui-sdk/web/docs/components/*.md` (not hand-typed). |
| Firefox and Safari behaviour | **Not run.** Chromium only. Upstream runs its `web` specs in WebKit and Firefox too (`uisdk/tests/README.md`, "Projects" table). |
| React hydration, Tailwind build integration, Liquid partial refresh | **Not run here.** Out of this investigation's area; only the facts those areas depend on are recorded. |

## 1. Headline conclusions

1. **The architecture's use of `ui-*` elements for interactive behaviour is workable, and "server writes initial ARIA" is achievable exactly.** When the server prints every attribute the element would write for the initial state and gives the root an `id`, the upgrade changes **zero attributes** (verified for tabs, dialog, accordion, field). This makes one HTML contract with byte-comparable fixtures realistic.
2. **`ui-*` form controls have no native control inside them and are dead without JavaScript.** `ui-checkbox`, `ui-switch`, `ui-radio-group`/`ui-radio`, `ui-select`, `ui-slider`, `ui-rating` submit nothing and cannot be operated before upgrade (verified: `terms` and `role` missing from the query string with JS off). The docs sentence that promises "fallback markup shown on its component page" (`uisdk/apps/docs/content/docs/web-components/server-rendering.mdx`) points at content that does not exist on any component page. **Ripple MUST use native `<input type="checkbox|radio|range">` and `<select>` for these, not the `ui-*` controls.**
3. **`ui-number-input` breaks progressive enhancement of quantity fields in one specific way:** after upgrade it rewrites the wrapped input to `type="text"` and writes a locale-formatted string into it (`1,235`). If the `name` is on the native input, the form then submits `quantity=1%2C235`. The `name` must be on the host after upgrade and on the native input before it. Ripple needs its own handling (section 4.6).
4. **Closed popup content is visible before upgrade unless the server writes `hidden`, and `hidden` is defeated by any author `display` rule until JavaScript runs.** The rule that keeps `[hidden]` parts hidden is injected at runtime. Ripple's static CSS MUST carry its own copy (section 6).
5. **The default `display` of every `ui-*` tag is injected at runtime too.** Before upgrade every custom element is `display: inline`. Without a static copy of those rules, 18 of 25 test sections changed size or position on upgrade. Ripple's static CSS MUST set `display` for every `ui-*` and `rp-*` tag it uses.
6. **Some elements restructure the DOM on upgrade** (drawer wraps its content in a new `ui-drawer-viewport`; slider, rating, pagination and toast generate children; two live-region `<div>`s are appended to `<body>`). The server can pre-render the drawer viewport to avoid the move. Generated children cannot be avoided for slider, rating and template-driven pagination.
7. **A link inside a trigger still navigates after upgrade.** `ui-dialog-trigger > a[href]` and `ui-drawer-trigger > a[href]` follow the link with JS on. "Link to `/cart` without JS, drawer with JS" needs Ripple code that calls `preventDefault()` and opens the drawer through its API.
8. **`definePrimitive` + `createParts` work for custom `rp-*` elements from both the npm package and the no-build browser file `web/core.js`** (verified). One trap: an attribute with the same name as a live `state` property reaches the primitive as `default<Name>`, not `<name>`.
9. **Attributes ui-sdk wrote are not restored when something strips them.** They come back only on the next state change. A DOM morph that resets an upgraded `ui-*` subtree to bare server HTML leaves it without roles and ARIA; a morph to fully pre-rendered closed-state HTML desynchronises it from internal state. Partial refresh MUST either replace a whole `ui-*` root or not touch inside it.
10. **Stability risk is high.** 14 versions were published in 9 days (first publish 2026-11-12, beta.14 on 2026-11-21). beta.6, beta.8 and beta.14 carry 46, 52 and 26 core changes. Ripple MUST pin exact versions and gate upgrades on the DOM-diff fixtures.
11. **Weight is significant.** The 16 entries a storefront would plausibly use total about 156 kB gzip across 74 files in the browser build; upstream's own bundled "perf pages" row is 108 kB gzip. Prefer native elements wherever they are sufficient, and load `ui-*` entries per component.

## 2. How the adapter works

### 2.1 Tags, wrappers and binding targets

- Each component is a set of light-DOM custom elements: a **root** that owns the primitive instance (`ui-tabs`) and **parts** that find the root above them in the DOM (`ui-tabs-tab`) or by `for="<root id>"` from anywhere (`uisdk/apps/docs/content/docs/web-components/parts-and-composition.mdx`, `controllers.mdx`).
- A part binds its behaviour and attributes to one **target element**:
  - the part element itself (default);
  - its first child, when the part has the `as-child` attribute (`boundElement` in `uisdk/packages/web/src/define-element.ts`);
  - a native child chosen by the part definition. `wrappedButton` picks `:scope > button, :scope > a, :scope > ui-button > button, :scope > ui-button > a`, else the first element child. `wrappedChild(selector)` picks `:scope > selector`, else the first element child (same file).
- Triggers, Close parts, tabs, step buttons and similar are **wrappers with `display: contents`**; the role, id, ARIA and `data-*` state land on the native `<button>` or `<a>` inside, not on the wrapper. Classes and accessible names go on the native element.
- Every bound element gets `data-slot="<primitive name>[-<slot>]"`. The docs' "Data Attributes" sections name the wrapper tag (`<ui-dialog-trigger>`) but the attribute is on the bound native element when the part is a wrapper (verified: `button[data-slot="dialog-trigger"]`).
- Importing an entry (`import "@ui-sdk/web/dialog"`) defines its tags. The root entry `@ui-sdk/web` defines nothing. On a server (no `customElements`) the import is a no-op (`claimTag` in `define-element.ts`). A tag already defined by another copy keeps the first definition and logs a warning.

### 2.2 Ids

- A root's instance id is `this.id || "ui-sdk-<tag without ui->-<counter>"` (`define-element.ts`, `connectedCallback`). The counter is page-global and depends on upgrade order (observed `ui-sdk-tabs-14`, `ui-sdk-dialog-48`). **It is not predictable by a server.**
- With an authored root `id`, part ids are deterministic (all verified in the spike):

| Root | Generated ids |
|---|---|
| `ui-tabs#T` | `T-tab-<value>`, `T-panel-<value>` |
| `ui-accordion#A` | `A-trigger-<value>`, `A-panel-<value>` |
| `ui-dialog#D`, `ui-drawer#D`, `ui-popover#D` | `D-trigger`, `D-title`, `D-description`, `D-content` |
| `ui-menu#M` | `M-trigger`, `M-content`; items `M-item-auto-<n>` (**not deterministic**) |
| `ui-tooltip#T` | `T-content` |
| `ui-select#S` | `S-label`, `S-trigger`, `S-value`, `S-content`, `S-option-<value>` |
| `ui-combobox#C` | `C-label`, `C-input`, `C-list`, `C-option-<value>` |
| `ui-number-input#Q` | `Q-control` |
| `ui-field#F` | `F-control`; label, description, error get `auto-<n>` (**not deterministic**) |
| `ui-slider#S` | `S-thumb-<index>` |
| `ui-progress#P` | `P-label` |
| `ui-navigation-menu#N` | `N-trigger-<value>`, `N-viewport` |
| `ui-carousel#C` | `C-content`; slides `C-slide-auto-<n>` (**not deterministic**) |
| `ui-collapsible#C` | `C-trigger`; `C-panel` once the panel has been shown (`uisdk/packages/core/src/components/collapsible/collapsible.ts`, read not run) |
| labels around `ui-checkbox`/`ui-radio`/`ui-switch`, and `ui-label` | `ui-sdk-label-<n>` written on the `<label>` (**not deterministic**) |

- "An id the author writes on a part's element wins over the one its slot makes ... `aria-controls`, `aria-labelledby`, `aria-describedby`, `aria-activedescendant`, `for` ... point at it" (`uisdk/apps/docs/content/docs/core/kernel/define-a-primitive.mdx`). Verified for a field label and description (`fe-label`, `fe-description`) and a tabs panel.

### 2.3 What upgrade writes, in general

Observed across all 25 entries (`spike/out/all-bare.diff.txt`):

- `data-slot` on every bound element.
- `type="button"` on a wrapped `<button>` that has no `type`. An authored `type="submit"` is kept and still submits (verified). Oddity: `type="button"` is also written on wrapped `<a>` elements and on `ui-checkbox`, `ui-radio`, `ui-switch`, `ui-rating-radio` hosts. Harmless, but it is part of the DOM contract.
- Roles and ARIA state for the current state only. A part that is not present (closed content, unselected panel) gets only `data-slot` and `hidden`. Its role, id and ARIA are written when it first shows. Consequently a tab whose panel is hidden has no `aria-controls` until selected.
- `role="none"` on wrapper elements that sit between a composite and its items (`ui-tabs-tab`, `ui-menu`, `ui-menu-trigger`).
- `role="heading" aria-level="2"` on `ui-*-title`, and `role="paragraph"` on `ui-*-description`, unless they contain a heading, have a `role`, or use `as-child` (`uisdk/packages/web/src/popup.ts`, `dialog.ts`).
- State as presence attributes (`data-open`, `data-closed`, `data-selected`, `data-checked`, `data-unchecked`, `data-disabled`, ...) and valued attributes (`data-orientation`, `data-side`, `data-activation-direction`, ...).
- Inline `style` on some parts (accordion panel size variables, carousel layout, slider positions, popup placement). These are part of the contract when comparing DOM.
- `hidden` on parts whose visibility the primitive controls. "A part whose visibility the primitive controls owns its `hidden`, so one the server wrote goes when it shows" (`define-element.ts`, `#sync`).
- Three or more `<style>` elements **prepended to `<head>`** (`ui-sdk-web-1`, `ui-sdk-popover-reset`, `ui-sdk-hidden`, per-component ones such as `ui-sdk-toast-defaults`), all inside `@layer ui-sdk` (section 6).
- Two visually hidden live regions appended to `<body>`: `div[role=status][data-ui-sdk-announcer]` and `div[role=alert][data-ui-sdk-announcer="assertive"]`.

### 2.4 Open popups

Observed on a modal `ui-dialog#d` after pressing the trigger (`spike/out/interact.live.txt`):

- Content: `role="dialog" id="d-content" tabindex="-1" aria-modal="true" aria-labelledby="d-title" aria-describedby="d-description" data-open data-presentation="dialog" popover="manual"`, plus `style="--dialog-stack: 0; --keyboard-inset: 0px; --visual-viewport-height: 720px;"`. It is in the top layer (`:popover-open`) and stays where it is in the DOM (no portal).
- Backdrop: `role="presentation" data-open popover="manual"`, also top layer.
- Trigger: gains `aria-controls="d-content"` and `data-open`, loses `data-closed`.
- `<html style="overflow: hidden; scroll-behavior: auto;">` (scroll lock).
- Every sibling subtree outside the dialog gets `inert` (all other `<section>`s and the dialog's own trigger wrapper).
- Focus moves to the first focusable element in the content.
- After Escape: content keeps `role`, `id`, `aria-*`, `popover="manual"`, gets `data-closed` and `hidden`, and an empty `style` attribute remains. **A closed-after-open element is not attribute-identical to a never-opened one.**

Non-modal popups (`ui-popover`, `ui-menu`, `ui-tooltip`, `ui-select`) use `popover="manual"` plus CSS anchor positioning written inline (`position-anchor`, `anchor()`, `position-try-fallbacks`, `round()`), and `anchor-name` on the trigger. Browser support floor for these CSS features is **UNVERIFIED** from the docs; `define-element.ts` says "Without top layer support they move to the body".

`ui-drawer` open: `ui-drawer-viewport` is the top-layer element (`popover="manual"`, inline fixed full-screen flex styles); content has `role="dialog" aria-modal="true" data-side="bottom" data-snap-point="content" data-driver="pointer" data-expanded` and `translate`/`--drawer-*` inline styles.

### 2.5 State, properties and events

- Initial state comes from attributes: `default-open`, `default-value`, `default-checked`, `default-pressed`. A boolean option that is on by default turns off with `="false"`; `disabled` and `required` are on whenever present (`state-and-events.mdx`).
- Live state is a property (`el.open`, `el.value`, `el.checked`). Setting the property or the same-named attribute changes state **without firing an event**. User input, `el.api.*()` calls and agents fire events.
- Callbacks become lowercase DOM events (`onOpenChange` → `openchange`). Events **do not bubble**, are `composed`, and are cancelable when the change can be refused (`withEvents` in `define-element.ts`). `event.detail` = `{ value, reason, event?, source }`. `event.preventDefault()` cancels the change. To hear many elements use a capture listener on an ancestor.
- `action` events (`ui-button`, menu, Close parts with an `action` attribute) add `detail.waitUntil(promise)`; the part shows `data-pending` / `aria-busy` until it settles (`uisdk/packages/web/src/action.ts`).
- `el.api` exposes the controller methods listed per component (for popups: `isOpen`, `setOpen`, `open`, `close`, `toggle`, `getPayload`, `focus`; `popup.ts`). `api.open()` returns a promise that settles **when the popup closes**; do not `await` it to mean "is open" (the spike hung doing this).
- Code that reads properties MUST first `await customElements.whenDefined(tag)` (`server-rendering.mdx`).

### 2.6 Lifecycle and DOM changes after upgrade

- Parts register as they upgrade and sync together one microtask later in document order (`define-element.ts`, `register`/`#flush`).
- Removing a root destroys its instance after a microtask; moving it within one task keeps it. Putting it back creates a new instance that starts from the previous state (`disconnectedCallback`, `connectedCallback`).
- Verified in the spike (`spike/out/t2.txt`):
  - Replacing the wrapped `<button>` node inside `ui-tabs-tab` rebinds the new node (all managed attributes return).
  - Appending a new `ui-tabs-tab` + `ui-tabs-panel` to an upgraded root works.
  - **Stripping the managed attributes from a bound element is not repaired** until the next state change of that instance.
  - Replacing a whole root with `innerHTML` creates a new instance in its default state (selection and open state are lost).

## 3. Per-component contract

For each component: canonical markup (from the component page's Composition/Usage sections), what the spike saw upgrade write for the initial state, what the server MUST pre-render, and the no-JavaScript verdict. `R` stands for the root's authored `id`.

Legend for "No-JS": **Works** = usable from server HTML; **Degrades** = content visible/usable but enhanced behaviour absent; **Dead** = control cannot be used or submits nothing.

### 3.1 Button (`@ui-sdk/web/button`)

```html
<ui-button><button type="submit">Save</button></ui-button>
<ui-button><a href="/docs">Docs</a></ui-button>
```

- Upgrade: host `display: contents`; inner element gets `data-slot="button"`, and `type="button"` when a `<button>` has no type. Fires `action` (with `waitUntil`) on the host.
- Pre-render: `type` explicitly on the button; `data-slot="button"`.
- No-JS: **Works** (native button or link; submit verified with and without JS).
- Verdict: only needed for pending state (`data-pending`, `aria-busy`) or `focusable-when-disabled`. A plain `<button class="rp-button">` is sufficient otherwise.

### 3.2 Dialog (`@ui-sdk/web/dialog`)

```html
<ui-dialog id="R">
  <ui-dialog-trigger><button type="button" id="R-trigger" aria-haspopup="dialog" data-closed data-slot="dialog-trigger">Open</button></ui-dialog-trigger>
  <ui-dialog-backdrop hidden data-slot="dialog-backdrop"></ui-dialog-backdrop>
  <ui-dialog-content hidden data-slot="dialog-content">
    <ui-dialog-title id="R-title" role="heading" aria-level="2" data-slot="dialog-title">Title</ui-dialog-title>
    <ui-dialog-description id="R-description" role="paragraph" data-slot="dialog-description">Text</ui-dialog-description>
    <ui-dialog-close><button type="button" data-slot="dialog-close">Close</button></ui-dialog-close>
  </ui-dialog-content>
</ui-dialog>
```

- This exact markup produced **zero attribute changes** on upgrade (`spike/out/pe-bare.diff.txt`, section `c-dialog-pre`).
- The docs require `hidden` on content and backdrop "to keep them hidden before the elements upgrade" (`npm:@ui-sdk/web/docs/components/dialog.md`). Backdrop is optional (`::backdrop` on the content otherwise).
- Root attributes: `open`, `default-open`, `modal` (default true), `dismissible`, `close-on-outside-press`, `presentation` (`dialog` | `sheet` | `auto`), `container`. Content: `initial-focus`, `final-focus`, `keep-mounted`, `inline`, `container`. Close: `value` (becomes `returnValue`), `action`. External trigger: `<ui-dialog-trigger for="R">`.
- A `<form method="dialog">` inside closes the dialog on valid submit.
- No-JS: **Dead** as an overlay (trigger button does nothing; content stays hidden). See section 4.3 for the link pattern.

### 3.3 Drawer (`@ui-sdk/web/drawer`)

```html
<ui-drawer id="R" side="right">
  <ui-drawer-trigger><button type="button">Filters</button></ui-drawer-trigger>
  <ui-drawer-backdrop hidden></ui-drawer-backdrop>
  <ui-drawer-viewport hidden>
    <ui-drawer-content hidden>
      <ui-drawer-title>Filters</ui-drawer-title>
      <ui-drawer-description>Narrow down the results.</ui-drawer-description>
      <ui-drawer-close><button type="button">Done</button></ui-drawer-close>
    </ui-drawer-content>
  </ui-drawer-viewport>
</ui-drawer>
```

- The docs' markup omits `ui-drawer-viewport`. Without it, upgrade **creates a `ui-drawer-viewport` and moves the content into it** (`render` of the `content` part in `uisdk/packages/web/src/drawer.ts`; verified as "CHILDREN CHANGED"). With the viewport pre-rendered, no node moves (verified, section `c-drawer-pre`). **The server MUST print the viewport.**
- Attribute writes for the closed state mirror the dialog (`aria-haspopup="dialog" data-closed data-slot="drawer-trigger"` on the trigger, `data-slot` on backdrop, viewport, content, `role="heading" aria-level="2" id="R-title"` on the title, `role="paragraph" id="R-description"` on the description).
- Root attributes include `side` (`top|right|bottom|left`, default `bottom`), `snap-points`, `modal`, `dismissible`, `expand-on-scroll`, `prevent-edge-swipe`. Optional parts: `ui-drawer-handle > button`, `ui-drawer-outlet`.
- The drawer positions and translates the content itself; give the content size and surface only (`npm:@ui-sdk/web/docs/components/drawer.md`).
- No-JS: **Dead** as an overlay.

### 3.4 Popover (`@ui-sdk/web/popover`)

```html
<ui-popover id="R">
  <ui-popover-trigger><button type="button" id="R-trigger" aria-haspopup="dialog" aria-expanded="false" data-closed data-slot="popover-trigger">Share</button></ui-popover-trigger>
  <ui-popover-content hidden data-slot="popover-content">
    <ui-popover-title id="R-title" role="heading" aria-level="2" data-slot="popover-title">Share</ui-popover-title>
    <ui-popover-description id="R-description" role="paragraph" data-slot="popover-description">...</ui-popover-description>
    <ui-popover-close><button type="button" data-slot="popover-close">Done</button></ui-popover-close>
  </ui-popover-content>
</ui-popover>
```

- **The docs' Usage markup has no `hidden` on `ui-popover-content`.** Without it the content is rendered inline and visible until upgrade (verified: 399 px wide box collapses to 0 on upgrade). With authored `hidden` it stays hidden and ui-sdk removes `hidden` when it opens (verified). **The server MUST write `hidden`.**
- Content attributes: `side`, `align`, `side-offset`, `align-offset`, `collision-padding`, `anchor`, `inline`. Optional `ui-popover-arrow`.
- No-JS: **Dead** (content unreachable). Do not put content that must be reachable without JS only in a popover.

### 3.5 Tooltip (`@ui-sdk/web/tooltip`)

```html
<ui-tooltip id="R">
  <ui-tooltip-trigger><button type="button" aria-describedby="R-content" data-slot="tooltip-trigger">Info</button></ui-tooltip-trigger>
  <ui-tooltip-content hidden id="R-content" role="tooltip" data-closed data-slot="tooltip-content">Helpful</ui-tooltip-content>
</ui-tooltip>
```

- Upgrade writes exactly the attributes shown (the content is always bound so it can name or describe its trigger). Docs markup again omits `hidden`; without it the text is visible inline before upgrade. **Server MUST write `hidden`.**
- A trigger without its own accessible name is *named* by the tooltip instead of described (the exact attribute written in that case was not captured; UNVERIFIED); `type="label|description"` on the root overrides (`npm:@ui-sdk/web/docs/components/tooltip.md`). The spec MUST fix one: Ripple icon buttons carry their own `aria-label`, so the tooltip is always a description.
- No-JS: **Degrades** to nothing visible. With the pre-rendered `aria-describedby` and a `hidden` target, assistive technology still gets the description (a `hidden` element referenced by `aria-describedby` is included in the description computation; ARIA accessible-description rule, general knowledge, not tested with a screen reader).

### 3.6 Menu (`@ui-sdk/web/menu`)

```html
<ui-menu id="R" role="none">
  <ui-menu-trigger role="none"><button type="button" id="R-trigger" aria-haspopup="menu" aria-expanded="false" data-closed data-slot="menu-trigger">Actions</button></ui-menu-trigger>
  <ui-menu-content hidden data-slot="menu-content">
    <ui-menu-item value="rename">Rename</ui-menu-item>
    <ui-menu-item as-child><a href="/settings">Settings</a></ui-menu-item>
  </ui-menu-content>
</ui-menu>
```

- Upgrade: `role="none"` on `ui-menu` and `ui-menu-trigger`; items get `data-slot="menu-item" role="menuitem" tabindex="-1" id="R-item-auto-<n>"` (id not deterministic, so items cannot be made zero-diff). Docs markup omits `hidden` on the content; **server MUST write it**.
- Root fires `action` with `detail.value` (the item's `value`). Items can also be data: `menu.items = [...]` with a `<template>` for styling (`lists-and-menus.mdx`).
- No-JS: **Dead**. A menu is for actions; navigation MUST use plain links or NavigationMenu.

### 3.7 Toast (`@ui-sdk/web/toast`)

```html
<ui-toast-region>
  <template>
    <ui-toast>
      <ui-toast-title></ui-toast-title>
      <ui-toast-description></ui-toast-description>
      <ui-toast-close><button type="button">Dismiss</button></ui-toast-close>
    </ui-toast>
  </template>
</ui-toast-region>
```

```ts
import "@ui-sdk/web/toast"
import { toast } from "@ui-sdk/web"
toast("Added to cart", { description: "Linen shirt" })   // also toast.success(...)
```

- Upgrade: region gets `data-slot="toast-region" data-side="bottom" data-align="end" popover="manual"` and inline CSS variables, and an `<ol data-slot="toast-list">` child is appended. Each toast is a clone of the template's `ui-toast`.
- No-JS: nothing renders (the region is empty; no layout impact). Toasts are JS-only by nature. Any message that must survive no-JS MUST also be server-rendered (for example a Banner after a form post).

### 3.8 Tabs (`@ui-sdk/web/tabs`)

```html
<ui-tabs id="R" default-value="account" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs">
  <ui-tabs-list aria-label="Settings" role="tablist" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-list">
    <ui-tabs-tab value="account" role="none"><button type="button" role="tab" id="R-tab-account" aria-controls="R-panel-account" aria-selected="true" tabindex="0" data-selected data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-tab">Account</button></ui-tabs-tab>
    <ui-tabs-tab value="password" role="none"><button type="button" role="tab" id="R-tab-password" aria-selected="false" tabindex="-1" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-tab">Password</button></ui-tabs-tab>
  </ui-tabs-list>
  <ui-tabs-panel value="account" role="tabpanel" id="R-panel-account" aria-labelledby="R-tab-account" tabindex="0" data-selected data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-panel">...</ui-tabs-panel>
  <ui-tabs-panel value="password" hidden data-slot="tabs-panel">...</ui-tabs-panel>
</ui-tabs>
```

- This markup produced **zero attribute changes** (`c-tabs-pre`). Note the unselected tab has no `aria-controls` and the hidden panel has no role or id until first shown.
- Root attributes: `value`, `default-value`, `orientation`, `activation` (`automatic|manual`), `loop`, `hidden-until-found`, `keep-mounted`. Event `valuechange`. Optional `ui-tabs-indicator`, `ui-tabs-tab-icon`.
- Docs markup has no `hidden` on unselected panels; without it all panels are visible before upgrade. **Server MUST write `hidden` on every unselected panel.**
- Tabs may wrap `<a href="#panel-id">` instead of buttons (verified: with JS the click selects the tab and sets the hash; without JS it scrolls to the panel).
- No-JS: **Degrades.** With `hidden` on unselected panels, their content is unreachable without JS. With no `hidden`, everything is shown stacked (good no-JS, layout shift on upgrade). The spec MUST choose per use; see section 4.2.

### 3.9 Accordion (`@ui-sdk/web/accordion`)

```html
<ui-accordion id="R" default-value="shipping" data-slot="accordion">
  <ui-accordion-item value="shipping" data-index="0" data-open data-slot="accordion-item">
    <ui-accordion-header><h3 data-open data-slot="accordion-header"><ui-accordion-trigger><button type="button" id="R-trigger-shipping" aria-controls="R-panel-shipping" aria-expanded="true" data-open data-slot="accordion-trigger">Shipping</button></ui-accordion-trigger></h3></ui-accordion-header>
    <ui-accordion-panel id="R-panel-shipping" role="region" aria-labelledby="R-trigger-shipping" data-open data-slot="accordion-panel" style="--accordion-panel-height: auto; --accordion-panel-width: auto;">...</ui-accordion-panel>
  </ui-accordion-item>
  <ui-accordion-item value="returns" data-index="1" data-closed data-slot="accordion-item">
    <ui-accordion-header><h3 data-closed data-slot="accordion-header"><ui-accordion-trigger><button type="button" id="R-trigger-returns" aria-expanded="false" data-closed data-slot="accordion-trigger">Returns</button></ui-accordion-trigger></h3></ui-accordion-header>
    <ui-accordion-panel hidden data-slot="accordion-panel">...</ui-accordion-panel>
  </ui-accordion-item>
</ui-accordion>
```

- Zero attribute changes with this markup, including the inline `style` on the open panel (`spike/out/t2.txt`, `ZERO-DIFF c-acc: 0`).
- `ui-accordion-header` binds the heading inside it (`h1`-`h6`); without one the element itself becomes `role="heading" aria-level="3"` (`uisdk/packages/web/src/accordion.ts`).
- The value is always an array; `default-value="a,b"`. Verified default behaviour: opening a second item **closes the first** (single-open is the default; attribute `multiple` exists in Appendix A).
- `hidden="until-found"` on closed panels with root `hidden-until-found` keeps text findable (`npm:@ui-sdk/web/docs/components/accordion.md`).
- No-JS: **Degrades** badly: closed panels with `hidden` cannot be opened. Native `<details>` is the correct no-JS accordion (section 4.1).

### 3.10 Collapsible (`@ui-sdk/web/collapsible`)

```html
<ui-collapsible id="R" data-closed data-slot="collapsible">
  <ui-collapsible-trigger><button type="button" id="R-trigger" aria-expanded="false" data-closed data-slot="collapsible-trigger">Order details</button></ui-collapsible-trigger>
  <ui-collapsible-panel hidden data-slot="collapsible-panel">2 × Linen shirt</ui-collapsible-panel>
</ui-collapsible>
```

- Upgrade writes the attributes shown. Root is `display: block`, trigger wrapper `contents`, panel `block`.
- No-JS: same as accordion. Prefer `<details>`.

### 3.11 Carousel (`@ui-sdk/web/carousel`)

```html
<ui-carousel id="R" aria-label="Featured products">
  <ui-carousel-viewport>
    <ui-carousel-content>
      <ui-carousel-item>...</ui-carousel-item>
      <ui-carousel-item>...</ui-carousel-item>
    </ui-carousel-content>
  </ui-carousel-viewport>
  <ui-carousel-previous><button type="button" aria-label="Previous">‹</button></ui-carousel-previous>
  <ui-carousel-next><button type="button" aria-label="Next">›</button></ui-carousel-next>
</ui-carousel>
```

- Upgrade writes layout as **inline styles**: viewport `position: relative; overflow: auto hidden; scroll-snap-type: x mandatory; overscroll-behavior-x: contain;` and `tabindex="0"`; content `display: flex;`, `aria-live="polite" aria-atomic="false" id="R-content"`; each item `flex-shrink: 0; scroll-snap-align: start; scroll-snap-stop: always;` plus `role="group" aria-roledescription="slide" aria-label="1 of 2" id="R-slide-auto-<n>" data-active data-in-view`; root `role="region" aria-roledescription="carousel"` and `--carousel-*` variables; previous/next buttons `aria-controls`, and `aria-disabled="true" data-disabled` at an end.
- "Native scrolling and snapping also work before JavaScript loads" (`npm:@ui-sdk/web/docs/components/carousel.md`) is only true if the page's CSS supplies the same overflow, flex and snap rules, because ui-sdk's are inline styles applied at upgrade. **Ripple's static CSS MUST set them.**
- Slide ids are not deterministic, so slides cannot be zero-diff. Optional parts: `ui-carousel-indicator-group`, `ui-carousel-indicator`, `ui-carousel-play-toggle`.
- No-JS: **Works** as a scroll-snap row when the static CSS is present; previous/next buttons are dead and SHOULD be hidden until upgrade (`ui-carousel:not(:defined) ui-carousel-previous { display: none }`).

### 3.12 Select (`@ui-sdk/web/select`)

```html
<ui-select id="R" name="role" default-value="editor" placeholder="Select a role">
  <ui-select-label>Role</ui-select-label>
  <ui-select-trigger><button type="button"><ui-select-value></ui-select-value></button></ui-select-trigger>
  <ui-select-content hidden>
    <ui-select-item value="viewer">Viewer</ui-select-item>
    <ui-select-item value="editor">Editor</ui-select-item>
  </ui-select-content>
</ui-select>
```

- Upgrade: host `display: contents`, `data-closed data-slot="select"`; trigger button `role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="R-label" id="R-trigger"`; `ui-select-value` gets its text (**empty before upgrade**, so the button is an empty 16×6 px box without JS); items `role="option" aria-selected id="R-option-<value>" tabindex="-1"`.
- Form-associated through `ElementInternals`: with JS it submitted `role=editor`; **without JS it submitted nothing** (verified).
- No-JS: **Dead.** Ripple MUST use native `<select>` (section 4.5).

### 3.13 Combobox (`@ui-sdk/web/combobox`)

```html
<ui-combobox id="R">
  <ui-combobox-label>Fruit</ui-combobox-label>
  <ui-combobox-input><input placeholder="Search fruits…" /></ui-combobox-input>
  <ui-combobox-content hidden>
    <ui-combobox-list>
      <ui-combobox-item value="apple">Apple</ui-combobox-item>
    </ui-combobox-list>
  </ui-combobox-content>
</ui-combobox>
```

- Upgrade: input gets `role="combobox" aria-autocomplete="list" aria-expanded="false" aria-labelledby="R-label" autocomplete="off" autocapitalize="none" spellcheck="false" type="text" id="R-input"`; label gets `for="R-input" id="R-label"`; list `role="listbox"`; items `role="option" aria-selected="false" id="R-option-<value>"`.
- The docs markup does include `hidden` on the content here.
- Submits the selected **value** under `name` on the host, not the typed text (`npm:@ui-sdk/web/docs/components/combobox.md`). Without JS the wrapped native input is a plain text field; if it carries a `name` it submits the typed text.
- No-JS: **Degrades** to a text input. For PredictiveSearch this is the right shape: a native search form that works without JS, with suggestions as enhancement. Whether Ripple uses `ui-combobox` or `ui-autocomplete` for it is out of this investigation's scope; **UNVERIFIED** which fits better.

### 3.14 Checkbox, Radio, Switch (`@ui-sdk/web/checkbox`, `/radio`, `/switch`)

```html
<label><ui-checkbox name="terms" value="yes" default-checked><ui-checkbox-indicator aria-hidden="true">✓</ui-checkbox-indicator></ui-checkbox> Accept</label>

<ui-radio-group name="speed" default-value="standard" aria-label="Shipping speed">
  <label><ui-radio value="standard"><ui-radio-indicator></ui-radio-indicator></ui-radio> Standard</label>
</ui-radio-group>

<label>Airplane mode <ui-switch name="airplane"><ui-switch-thumb></ui-switch-thumb></ui-switch></label>
```

- These are the controls themselves: "takes part in forms through `ElementInternals`, without a hidden input" (`npm:@ui-sdk/web/docs/components/checkbox.md`, `radio.md`, `switch.md`; `uisdk/packages/web/src/checkbox.ts`, `radio.ts`).
- Upgrade writes on the host: `role="checkbox|radio|switch" aria-checked tabindex data-checked|data-unchecked data-slot type="button" aria-labelledby="ui-sdk-label-<n>"`, and an `id="ui-sdk-label-<n>"` on the wrapping `<label>`. Unchecked indicators get `hidden`.
- Verified: with JS off the form submitted only the native checkbox next to it (`/submit?native=yes`); with JS on `terms=yes&native=yes`.
- No-JS: **Dead** (not focusable, not operable, not submitted, no role). Ripple MUST NOT use them.

### 3.15 Slider (`@ui-sdk/web/slider`)

```html
<ui-slider id="R" name="vol" default-value="50">
  <ui-slider-value></ui-slider-value>
  <ui-slider-control><ui-slider-track>
    <ui-slider-indicator></ui-slider-indicator>
    <ui-slider-thumb aria-label="Volume"></ui-slider-thumb>
  </ui-slider-track></ui-slider-control>
</ui-slider>
```

- Upgrade **generates** `ui-slider-thumb-input > input[type=range]` inside each thumb (visually hidden, `role="slider"`, `id="R-thumb-0"`), moves the thumb's `aria-label` onto that input, writes positions as inline styles, and fills `ui-slider-value` text.
- No-JS: **Dead** (zero-size, no control). Ripple MUST use native `<input type="range">`; a two-thumb price range filter needs two native number inputs as the no-JS base.

### 3.16 Number input (`@ui-sdk/web/number-input`)

```html
<ui-number-input id="R" name="quantity" default-value="1" min="1">
  <ui-number-input-group>
    <ui-number-input-decrement><button type="button" aria-label="Decrease">−</button></ui-number-input-decrement>
    <ui-number-input-control><input aria-label="Quantity" /></ui-number-input-control>
    <ui-number-input-increment><button type="button" aria-label="Increase">+</button></ui-number-input-increment>
  </ui-number-input-group>
</ui-number-input>
```

- Upgrade on the input: `type` forced to `"text"` (an authored `type="number"` is **changed**), `inputmode="numeric" autocomplete="off" autocorrect="off" spellcheck="false" id="R-control" data-slot="number-input-control"`, and `value` set to the **formatted** number. Step buttons: `tabindex="-1" aria-controls="R-control"` and inline `style="user-select: none; touch-action: manipulation; --hold-delay: 400ms;"`. Group: `role="group"`.
- The host is form-associated and submits the raw number under its `name`.
- Verified matrix (`spike/out/interact.live.txt`, `spike/out/t2.txt`):

| `name` on | No JS submits | With JS submits |
|---|---|---|
| host only | nothing | `quantity=2` |
| native input only | `quantity=2` | `quantity=2`, **but `quantity=1%2C235` for 1235** (formatted text) |
| both | `quantity=2` | `quantity=2&quantity=2` (duplicate) |

- No-JS: **Degrades** to a text or number input with dead step buttons, and only if the native input has the `name`. No combination of static attributes is correct in both modes. See section 4.6.

### 3.17 Navigation menu (`@ui-sdk/web/navigation-menu`)

```html
<ui-navigation-menu id="R" aria-label="Main">
  <ui-navigation-menu-list>
    <ui-navigation-menu-item value="shop">
      <ui-navigation-menu-trigger><button type="button">Shop</button></ui-navigation-menu-trigger>
      <ui-navigation-menu-content hidden>
        <ui-navigation-menu-link><a href="/collections/all">All</a></ui-navigation-menu-link>
      </ui-navigation-menu-content>
    </ui-navigation-menu-item>
    <ui-navigation-menu-item>
      <ui-navigation-menu-link><a href="/about">About</a></ui-navigation-menu-link>
    </ui-navigation-menu-item>
  </ui-navigation-menu-list>
  <ui-navigation-menu-viewport hidden></ui-navigation-menu-viewport>
</ui-navigation-menu>
```

- Upgrade: root `role="navigation" data-orientation`; list `role="list"`; items `role="listitem" data-closed`; trigger button `aria-expanded="false" id="R-trigger-<value>" data-closed`; content `hidden`; links `data-slot="navigation-menu-link"`; viewport `hidden id="R-viewport" tabindex="-1" data-closed`. Open content moves into the viewport when one exists (`portal` in `uisdk/packages/web/src/navigation-menu.ts`, read not run).
- Docs markup has no `hidden` on content or viewport: without it every submenu's links are visible inline before upgrade. That is a legitimate **no-JS fallback** (all links reachable) but shifts layout on upgrade.
- No-JS: top-level links **work**; submenu triggers are dead buttons. The spec MUST decide between (a) `hidden` on content with the top-level label also being a link to a landing page, or (b) the native `<details>` pattern. See section 4.4.

### 3.18 Pagination (`@ui-sdk/web/pagination`)

Two modes.

Template mode (JS renders the page links; **nothing but Previous/Next exists before upgrade**):

```html
<ui-pagination aria-label="Pagination" page-count="10">
  <ui-pagination-list>
    <ui-pagination-item><ui-pagination-previous><button>Previous</button></ui-pagination-previous></ui-pagination-item>
    <template><ui-pagination-item><ui-pagination-link><button></button></ui-pagination-link></ui-pagination-item></template>
    <ui-pagination-item><ui-pagination-next><button>Next</button></ui-pagination-next></ui-pagination-item>
  </ui-pagination-list>
</ui-pagination>
```

Server-links mode (verified to bind without generating children):

```html
<ui-pagination aria-label="Pagination" page-count="3" default-page="2">
  <ui-pagination-list>
    <ui-pagination-item><ui-pagination-previous><a href="?page=1">Previous</a></ui-pagination-previous></ui-pagination-item>
    <ui-pagination-item><ui-pagination-link page="1"><a href="?page=1">1</a></ui-pagination-link></ui-pagination-item>
    <ui-pagination-item><ui-pagination-link page="2"><a href="?page=2" aria-current="page">2</a></ui-pagination-link></ui-pagination-item>
    <ui-pagination-item><ui-pagination-next><a href="?page=3">Next</a></ui-pagination-next></ui-pagination-item>
  </ui-pagination-list>
</ui-pagination>
```

- Upgrade (links mode): root `role="navigation"`, list `role="list"`, items `role="listitem"`, links `data-slot` (+ `data-current` on the current page) and a stray `type="button"` on each `<a>`.
- "Server-rendered anchors work before JavaScript loads" (`npm:@ui-sdk/web/docs/components/pagination.md`).
- No-JS: links mode **Works**. Template mode is **Dead**.
- Verdict: storefront pagination is URL navigation. A plain `<nav aria-label><ul><li><a>` needs no ui-sdk at all. Ripple SHOULD ship Pagination as static markup (kind 1) and not depend on `ui-pagination`.

### 3.19 Rating (`@ui-sdk/web/rating`)

```html
<ui-rating aria-label="Rating" default-value="3" name="rating">
  <template><ui-rating-item><svg aria-hidden="true">…</svg></ui-rating-item></template>
</ui-rating>
```

- Upgrade **generates all stars** from the template, each with a `ui-rating-radio` (`role="radio"`). Before upgrade the element is empty (0×0).
- No-JS: **Dead** as an input and invisible as a display.
- Verdict: a storefront Rating is display-only ("4.5 out of 5"). Ripple MUST render it as static markup (`role="img"` with an `aria-label`, CSS-filled stars) and not use `ui-rating`. A review-submission star input, if ever needed, MUST be native radios.

### 3.20 Progress (`@ui-sdk/web/progress`)

```html
<ui-progress id="R" value="40">
  <ui-progress-label>Free shipping</ui-progress-label>
  <ui-progress-value></ui-progress-value>
  <ui-progress-track><ui-progress-indicator></ui-progress-indicator></ui-progress-track>
</ui-progress>
```

- Upgrade: root `role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40" aria-valuetext="40%" aria-labelledby="R-label" data-progressing style="--progress-value: 40%;"`; value text filled (`40%`) and `aria-hidden="true"`; indicator `style="inset-inline-start: 0px; width: 40%;"`.
- No-JS: bar has no width and no role unless the server writes them.
- Verdict: no interaction, so ui-sdk adds nothing the server cannot print. Ripple SHOULD render Progress and FreeShippingProgress as static markup: native `<progress>` or a `div[role=progressbar]` with server-written ARIA and a `--rp-progress` variable, updated by the `rp-*` commerce element when the cart changes.

### 3.21 Field, Label, Input (`@ui-sdk/web/field`, `/label`, `/input`)

```html
<ui-field id="R" data-required data-slot="field">
  <ui-field-label as-child><label for="R-control" id="R-label" data-required data-slot="field-label">Email</label></ui-field-label>
  <input type="email" name="email" id="R-control" required aria-labelledby="R-label" aria-describedby="R-description" data-required />
  <ui-field-description id="R-description" data-required data-slot="field-description">We never share it.</ui-field-description>
  <ui-field-error hidden data-slot="field-error"></ui-field-error>
</ui-field>
```

- The docs say the control must be "one of ours" (`ui-input`, `ui-textarea`, ...), but the source comment says "any form control: a native input" (`uisdk/packages/web/src/field.ts`), and the spike confirms a bare native `<input>` and a bare native `<select>` inside `ui-field` are found, given `id="R-control"`, and wired with `aria-labelledby` / `aria-describedby`. `name` on `ui-field` is copied to the control when the control has none.
- `ui-field-label` is **not** a `<label>`: without JS it labels nothing. With `as-child` around a native `<label for>`, the label works before upgrade (`label.control` resolved with JS off) and ui-sdk binds the same element after (verified). **Ripple MUST use the `as-child` + native `<label for>` form.**
- The markup above was zero-diff except `ui-field-error`, which gets `data-message` and the browser's validation message as text while still hidden.
- On an invalid submit with JS: error shows the browser message, gets `id="auto-<n>"`, input gets `aria-invalid="true" data-invalid` and the error id appended to `aria-describedby`. Server-side errors: set `field.invalid = true` and the error text (`forms.mdx`). An error rendered by the server (non-empty `ui-field-error` without `data-message`) is left as authored (`render` in `field.ts`).
- `ui-input` wraps `:scope > input` and adds `data-filled`, `valuechange`, and clear-button support via `ui-input-group`/`ui-input-clear`. It is optional inside a field.
- `ui-label for="id"` names a `ui-*` control. Not needed when controls are native.
- No-JS: **Works** with native label + native control. Client-side inline error text is enhancement; browser validation bubbles still appear.

## 4. Progressive enhancement: patterns that work

### 4.1 Disclosure (Accordion, Collapsible, FAQ, Filters groups): native `<details>`

- ui-sdk has no binding to `<details>`/`<summary>` (no occurrence in `uisdk/packages/core/src/components/accordion`, `collapsible`, or `uisdk/packages/web/src`).
- Native exclusive accordion works with no JS: `<details name="faq">` siblings; opening one closed the other with JavaScript disabled (verified in Chromium, `spike/out/t2.txt`). `name` on `<details>` is Baseline 2024 (general knowledge, not from the clones).
- Recommendation: **Accordion and Collapsible in Ripple are static markup built on `<details>`**, with no `ui-*` element. This removes two ui-sdk entries (accordion 18.8 kB, collapsible 16.7 kB gzip each including core) and is the only variant that satisfies decision 2 (usable when JS never loads). Animation uses CSS (`::details-content`, `interpolate-size`) as enhancement.
- If the spec nevertheless wants `ui-accordion` (for example for controlled state), the server MUST print closed panels with `hidden` and accept that they cannot be opened without JS. There is no way to combine `<details>` with `ui-accordion` without double behaviour.

### 4.2 Tabs

- No native equivalent. Two acceptable contracts:
  - **A (content-critical, e.g. product description/specs/reviews):** do not use tabs; use the `<details>` accordion, or stacked sections.
  - **B (tabs are acceptable only as enhancement):** server prints all panels visible with headings, without `hidden`; a class on `<html>` set by an inline script (`<html class="js">`) or `:defined` hides unselected panels. This shifts layout at upgrade unless the hiding CSS is keyed to something known at first paint. UNVERIFIED in the spike; flagged as a design decision.
- With pre-rendered `hidden` panels (section 3.8 markup) tabs are zero-diff but unselected content is unreachable without JS. The spec MUST state this limitation on the Tabs component page and the checker SHOULD warn when Tabs wrap forms or primary product content.

### 4.3 Overlays opened from a link (CartDrawer, MobileNav, size guide dialog)

Verified behaviour (`spike/out/t2.txt`):

| Setup | Navigates | Opens |
|---|---|---|
| `<ui-drawer-trigger><a href="/cart">` and nothing else | yes | irrelevant |
| same, plus a bubble-phase `click` listener on the `<a>` calling `preventDefault()` | no | yes (`openchange` reason `trigger-press`) |
| same, but the listener is capture-phase | no | **no** (ui-sdk skips a press whose event is already `defaultPrevented`) |
| plain `<a href="/cart">` outside any trigger; listener calls `preventDefault()` then `drawer.api.open({})` | no | yes (reason `imperative`); Escape closes and focus returns to the link |

- The trigger-wrapped variant depends on listener order and phase. **The robust contract is the last row:** the opener is a plain link to the full page (`/cart`, a menu page, a size-guide page). A Ripple element (`rp-cart-drawer` or a small generic `rp-open`) intercepts unmodified primary clicks (`!metaKey && !ctrlKey && !shiftKey && !altKey && button === 0`), calls `preventDefault()`, and calls `api.open({})` on the target `ui-drawer`/`ui-dialog` found by id.
- The link is not bound as a ui-sdk trigger, so ui-sdk does not write `aria-haspopup`, `aria-expanded` or `aria-controls` on it. The Ripple element MUST write `aria-haspopup="dialog"` and `aria-controls` after upgrade (not in server HTML, because without JS it is a plain link).
- The drawer/dialog content is in server HTML with `hidden`. Without JS it stays hidden and the link navigates. `script failure == no script` holds.

### 4.4 Navigation with submenus (Header, NavigationMenu, MobileNav)

- Every top-level item MUST be reachable without JS. Options, in order of preference:
  1. Top-level label is an `<a href>` to a real landing page, with a separate disclosure button for the submenu (button dead without JS; hide it with `:not(:defined)`).
  2. `<details>`-based submenu (works without JS, no hover intent, no viewport animation).
- `ui-navigation-menu` implements the disclosure-navigation pattern with buttons and hover intent. It is enhancement only. Its content panels MUST be printed with `hidden`; its viewport MUST be printed (with `hidden`) if used.

### 4.5 Form controls: native first

| Ripple component | Markup the spec SHOULD mandate | ui-sdk involvement |
|---|---|---|
| Checkbox, Radio, Switch | native `<input type="checkbox|radio">` inside/with `<label>`; Switch is a checkbox with `role="switch"` | none (static CSS styles `:checked`, `:focus-visible`, `:disabled`) |
| Select, SortSelect, LocaleSelector | native `<select>` | none. `ui-select` only as an optional, explicitly JS-only "rich select" outside V1 |
| Slider | native `<input type="range">` | none |
| Input, Textarea | native element | optional `ui-input`/`ui-textarea` only for clear button or auto-resize |
| Field, Label, messages | `ui-field` + `ui-field-label as-child` around native `<label for>` + native control + `ui-field-description` + `ui-field-error` (section 3.21) | `@ui-sdk/web/field` (17.0 kB gzip incl. core) for inline validation messages. A static variant without `ui-field` (server-written `aria-describedby`) MUST also be valid. |
| VariantPicker | native radios in a `<fieldset>` (or links for URL-driven variants) | none |
| Rating (display) | static | none |

`ui-field` wires a native `<input type="checkbox">` or `<select>` the same way as a text input (select verified; checkbox inside `ui-field` UNVERIFIED but uses the same control lookup).

### 4.6 Quantity input

Facts: section 3.16. Requirements for a correct QuantityInput:

- Server HTML: `<input type="number" name="quantity" value="1" min="1" inputmode="numeric">` plus decrement/increment `<button type="button">`s. Without JS the native input works and submits; the buttons do nothing and SHOULD be hidden until upgrade.
- Two viable enhancements. The spec MUST pick one:
  - **(Recommended) Ripple-owned stepper, no `ui-number-input`.** A small `rp-quantity` element keeps the input `type="number"` and its `name`, and wires the buttons to `stepUp()`/`stepDown()` + `input`/`change` events. Submission is identical in both modes. No locale-formatting hazard. No 22.5 kB entry.
  - **`ui-number-input` with a name hand-off.** A Ripple wrapper MUST, at upgrade and before the first possible submit, move `name` from the native input to the `ui-number-input` host (so the host submits the raw number and the formatted text field submits nothing). This MUST be covered by a test with a value ≥ 1000.
- UNVERIFIED: whether a `format` property that disables grouping would make the native input's text safe to submit. `format` is property-only (`uisdk/packages/web/src/number-input.ts` comment), so it cannot be set from server HTML.

### 4.7 Hiding JS-only affordances before upgrade

- `:not(:defined)` matches a custom element until its entry has run. It is the correct hook for "hide the dead button until it works" and needs no script: `ui-carousel:not(:defined) :is(ui-carousel-previous, ui-carousel-next) { display: none }`.
- It never becomes defined if the script fails, which satisfies "script failure == no script".

## 5. Building custom `rp-*` elements

### 5.1 Imports

| Use | Import |
|---|---|
| Define a primitive | `import { definePrimitive, createChange, createCommit, dispatch, elements, openAttrs, checkedAttrs, idPart, announce } from "@ui-sdk/core"` (all exported from `uisdk/packages/core/src/index.ts`; `elements` is documented in `uisdk/apps/docs/content/docs/core/kernel/define-a-primitive.mdx`) |
| Turn it into elements | `import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web"` (`uisdk/packages/web/src/index.ts`). This root entry has no side effects and defines no `ui-*` tags. |
| Reuse a shipped primitive under Ripple tag names | `import { dialog } from "@ui-sdk/core/dialog"` then `createParts(dialog, { root: "rp-...", ... })` ("Build Your Own" section on every component page) |
| No-build page | `import { definePrimitive, createParts, createChange } from ".../web/core.js"` (`uisdk/packages/web/src/browser-core.ts` re-exports all of `@ui-sdk/core` plus `createParts`, `wrappedButton`, `wrappedChild`). Verified working. |

`definePart` exists in `define-element.ts` but is **not exported** from `@ui-sdk/web`. Do not use it.

`definePrimitive`, `createParts`, `wrappedButton`, `wrappedChild`, `AttributeType`, `PartOptions`, `RootOptions`, `Parts`, `announce`, `prepareAnnouncements` carry an `@stable` tag in source.

### 5.2 `definePrimitive` (from `uisdk/apps/docs/content/docs/core/kernel/define-a-primitive.mdx`)

```ts
const cartCount = definePrimitive({
  name: "rp-cart-count",                       // prefixes data-slot: root = "rp-cart-count", slot x = "rp-cart-count-x"
  options: {                                   // every option needs a kind
    count: "number",
    defaultCount: "number",
    onCountChange: "callback",
  },
  state: (options) => ({ count: options.defaultCount ?? options.count ?? 0, pending: false }),
  api: (context) => {                          // runs once per instance
    const change = createChange(context)
    return {
      getCount: () => context.store.get().count,
      setCount: (n, event) => change("count", n, { reason: "programmatic", event }),
      setPending: (pending) => context.store.set({ pending }),   // internal state, no event
    }
  },
  agent: { actions: ["setCount"] },            // which api methods an agent may call; put after `api`
  slots: (slot) => ({
    root: slot({
      attrs: (state) => ({                     // pure; undefined removes the attribute
        "data-count": String(state.count),
        "data-empty": state.count === 0 ? "" : undefined,
        "data-pending": state.pending ? "" : undefined,
        "aria-busy": state.pending ? "true" : undefined,
      }),
    }),
    value: slot({
      bind: (el, part) => {                    // DOM work; returns cleanup
        const write = () => { const t = String(part.store.get().count); if (el.textContent !== t) el.textContent = t }
        write()
        return part.store.subscribe(write)
      },
    }),
  }),
})
```

Definition fields: `name`, `label`, `options` (kinds: `"string" | "number" | "boolean" | "list" | "value" | "callback" | "action" | "id" | "key"`, or `(attribute) => value`), `state`, `sync`, `controlled`, `live`, `commits`, `api`, `agent`, `slots`.

Slot fields: `role` / `roles`, `focus`, `keys`, `present`, `attrs`, `state`, `props`, `press`, `on`, `bind`, `connect`. A slot with an interactive `role` MUST declare `focus`/`press`/`keys` as the role requires (TypeScript enforces it). `attrs` and slot `state` MUST be pure (they also run on servers); DOM work goes in `bind` (while present) or `connect` (while in the page).

Context in `api`: `context.options()`, `context.onOptions(fn)`, `context.store.get() / set() / subscribe()`, `context.onDestroy(fn)`, `context.element(slot, key)`, `context.props(slot, key)`.

Changes: `createChange(context)` returns `change(key, value, { reason, event })`. It calls `on<Key>Change` first, writes state unless canceled or controlled, and returns whether it was accepted. `dispatch(context, "onDelete", value, details)` fires a callback that is not a state change. `"action"`-kind options receive `detail.waitUntil()` on the web.

### 5.3 `createParts` (from `uisdk/packages/web/src/define-element.ts`)

```ts
function createParts<P extends Primitive, Tags extends PartTags<P>>(primitive: P, tags: Tags): Parts<Tags>

type PartTags<P> = { root: string | RootOptions<P> } & { [slot]?: string | PartOptions<P> }
```

```ts
const { Root, Value } = createParts(cartCount, {
  root: {
    tag: "rp-cart-count",
    display: "contents",                         // "block" | "contents" | table values; inline if omitted
    api: ["getCount", "setCount", "setPending"], // exposed as element.api.*
    state: {                                     // live property + same-named attribute
      count: { get: (api) => api.getCount(), set: (api, v) => api.setCount(v) },
    },
  },
  value: "rp-cart-count-value",
})
```

`RootOptions`: `tag`, `self`, `kinds`, `properties`, `state`, `api`, `display`, `target`, `children`, `optionalChildren`, `childProps`, `options(el)`, `render(el, instance)` (runs once the instance exists and after a property is set; may return a cleanup, "like a store subscription's"), `host` (attributes for the element itself), `portal`, `formAssociated`, `defaults`, `silent`, `events`.

`PartOptions`: `tag`, `slot`, `owners`, `kinds`, `properties`, `display`, `target`, `context(el)`, `render(el)`, `changed(el)`, `formAssociated`, `defaults`, `rebind`.

Rules verified in the spike or stated in source:

- `createParts` returns element classes keyed in PascalCase (`Root`, `Value`); each is `undefined` on a server.
- Options whose kind is string/number/boolean/list become kebab-case attributes, each reflected by a property. `"value"` kinds are properties only. `"callback"` kinds become events named by dropping `on` and lowercasing (`onCountChange` → `countchange`).
- **A `state` entry named `X` captures the attribute `X`: the primitive receives it as option `defaultX`** (`optionsOf` in `define-element.ts`). First spike run: `count="3"` gave state `0` because the primitive read only `options.count`. The primitive MUST declare and read `defaultX`.
- Setting the property or the attribute after connect calls the `state.set` function **quietly** (no event). `element.api.setCount(5)` fired `countchange` with `detail = { value: 5, reason: "programmatic", source: "programmatic" }`, `bubbles: false`, `cancelable: true`.
- Parts find their root by ancestry, or by `for="<root id>"`.
- The root MUST be defined before its parts (handled by `createParts` order).
- The instance is destroyed when the root leaves the page and recreated when it returns. Subscriptions to external stores (Hydrogen) MUST be created in `api` with `context.onDestroy(unsubscribe)`, or in root `render` returning a cleanup. They MUST NOT be module-level per element.
- Attributes the server pre-rendered and the slot also renders (`data-count="3"`) are simply kept when equal (zero diff).

### 5.4 Announcements

`announce(text, { priority = "polite" })` from `@ui-sdk/core` writes to the shared live regions (creating them on first use). `prepareAnnouncements(document)` creates both regions ahead of time (`uisdk/packages/core/src/foundation/platform/announce.ts`). Commerce elements SHOULD use this for "Added to cart" announcements instead of creating their own live regions.

### 5.5 When not to use `createParts`

The kernel is the floor cost: the smallest entry (`@ui-sdk/web/separator`) is 12.8 kB gzip and `button` 14.7 kB, almost all of it shared kernel. A page that already loads any `ui-*` entry pays it once. A page with only static components and one commerce element pays ~13 kB for it. The spec SHOULD state one rule for implementers; recommendation: all `rp-*` elements use `definePrimitive` + `createParts` (one authoring model, uniform events, agent bridge), accepting the floor cost.

## 6. CSS: the `ui-sdk` layer

Facts:

- At runtime ui-sdk writes `<style>` elements **prepended to `<head>`**, each wrapped in `@layer ui-sdk { ... }` (`writeStyle`/`appendStyle` in `uisdk/packages/core/src/foundation/platform/style.ts`; verified head order `style#ui-sdk-web-1 > style#ui-sdk-popover-reset > style#ui-sdk-hidden > (page head)`).
- Contents (verified, full text in `spike/out/all-bare.diff.txt`):
  - `:where([data-slot][hidden]:not([hidden="until-found"])) { display: none !important }`
  - one `:where(<tag>:not([hidden]), <tag>[hidden="until-found"]) { display: block | contents }` per defined tag that has a default display;
  - `:where(<content tag>[align]) { text-align: inherit }`;
  - `:where([as-child]) { display: contents }`;
  - a popover reset for dialog/drawer/popover/toast/navigation-menu content (`inset: auto; width: auto; height: auto; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; overflow: visible; color: inherit; background: none`). Menu, Select, Combobox content keep the browser's popover border/padding/background and need their own (`styling-and-animation.mdx`);
  - toast region defaults (`position: fixed; z-index: 2147483000; display: flex; ...`).
- All selectors are `:where()` (zero specificity) and the layer is meant to be the lowest: "Declare that layer at the top of the stylesheet your page links ... With Tailwind, put it above `@import "tailwindcss"`" (`styling-and-animation.mdx`).
- With a CSP that forbids inline styles: add `<meta property="csp-nonce" nonce="...">`, or the tag without a nonce to make ui-sdk use constructed stylesheets (`styling-and-animation.mdx`).
- `@ui-sdk/core/web.css` (identical to `npm:@ui-sdk/web/browser/web.css`, 86.6 kB) is the optional default look. It is one `@layer ui-sdk { ... }` block defining `--ui-*` tokens and styling by `[data-slot=...]`. **Ripple does not need it and MUST NOT load it**; Ripple ships its own look. Its recommended Tailwind wiring is `@layer ui-sdk; @import "tailwindcss"; @import "@ui-sdk/core/web.css" layer(components);` (`installation.mdx`).

Verified hazard (`spike/t3.mjs`):

```
js=false { c1: 'flex', c2: 'flex' }   // hidden dialog content and hidden panel are VISIBLE
js=true  { c1: 'none', c2: 'none' }
```

where `c1` is `<ui-dialog-content hidden>` styled `display: flex` by tag in a `components` layer and `c2` is `<ui-collapsible-panel hidden class="flex">`. Before upgrade only the user-agent `[hidden] { display: none }` applies, and any author `display` beats it.

Layer order Ripple needs (Tailwind v4 declares `theme, base, components, utilities`):

```css
@layer ui-sdk, theme, base, rp, utilities;
/* or, if Ripple's component CSS lives in Tailwind's components layer: */
@layer ui-sdk, theme, base, components, utilities;
```

- `ui-sdk` first, so everything else wins over ui-sdk's non-important defaults.
- Because `!important` reverses layer order, ui-sdk's `display: none !important` in the first layer beats every later layer's important and normal declarations after upgrade. Ripple's static copy of the hidden rule MUST therefore also be important and live in the **earliest** layer it controls (or reuse the name `ui-sdk`).
- Tailwind v4's preflight contains `[hidden]:where(:not([hidden="until-found"])) { display: none !important }` in `base` (general knowledge of Tailwind v4, not from the clones; UNVERIFIED here). The prebuilt `ripple.css` cannot rely on a project having preflight, so it MUST include its own rule.

## 7. Browser build, entries and size

- Per-component npm entries: `@ui-sdk/web/<name>` for every name in section 3 plus `overlays`, `alert-dialog`, `hover-card`, `toggle`, `textarea`, `separator`, etc. (`uisdk/packages/web/package.json` exports). `sideEffects` is limited to the entries, so the helper root tree-shakes.
- Browser build shipped in the tarball at `npm:@ui-sdk/web/browser/`: `web.js` (1.4 kB autoloader), `web.css`, and `web/` with one file per entry, `core.js`, and 88 shared chunks. Hosted copies: `https://ui-sdk.dev/web@0.js`, `web@<exact>.js`, `web@0/<entry>.js`, `web@0/core.js` (`installation.mdx`; ui-sdk.dev was not fetched).
- The autoloader (`uisdk/packages/web/src/autoload.ts`) imports an entry the first time a matching undefined `ui-*` tag appears, also for nodes added later. Entry names are matched by tag prefix (`ui-tabs-tab` → `tabs.js`, `ui-overlay-host` → `overlays.js`). It only handles `ui-` tags.
- Measured in the spike: a page using 25 entries made **97 JavaScript requests, 507 kB raw / 200 kB gzip** (per-file gzip sum), all as a module-import waterfall. Static import closures from the browser build:

| Entries | Files | Raw | Gzip (sum of files) |
|---|---|---|---|
| button | 5 | 57 kB | 21 kB |
| accordion | 10 | 69 kB | 26 kB |
| tabs | 16 | 82 kB | 32 kB |
| dialog | 26 | 136 kB | 55 kB |
| drawer | 28 | 181 kB | 72 kB |
| dialog, drawer, popover, tooltip, menu, tabs, accordion, collapsible, carousel, toast, field, input, number-input, navigation-menu, pagination, progress | 74 | 392 kB | 156 kB |
| core.js (for custom elements) | 43 | 243 kB | 96 kB |

- Upstream budgets (`uisdk/size-budget.json`; gzip, minified, core included, one bundle per row, measured by `uisdk/scripts/size.mjs` as described in `uisdk/tests/README.md` "Bundle size"). Rows are not additive because each includes the shared kernel:

| Entry | gzip bytes | Entry | gzip bytes |
|---|---|---|---|
| `@ui-sdk/web/separator` | 12 786 | `@ui-sdk/web/popover` | 34 840 (+13 891 lazy) |
| `@ui-sdk/web/label` | 13 586 | `@ui-sdk/web/navigation-menu` | 35 321 |
| `@ui-sdk/web/progress` | 13 928 | `@ui-sdk/web/overlays` | 41 933 |
| `@ui-sdk/web/button` | 14 733 | `@ui-sdk/web/menu` | 44 134 (+13 806 lazy) |
| `@ui-sdk/web/switch` | 16 169 | `@ui-sdk/web/drawer` | 47 612 |
| `@ui-sdk/web/pagination` | 16 288 | `@ui-sdk/web/select` | 49 475 (+13 891 lazy) |
| `@ui-sdk/web/collapsible` | 16 665 | `@ui-sdk/web/combobox` | 52 965 (+13 948 lazy) |
| `@ui-sdk/web/field` | 16 960 | `@ui-sdk/web/agent` | 12 086 |
| `@ui-sdk/web/input` | 16 991 | `@ui-sdk/web (perf pages)` | 108 369 (+13 395 lazy) |
| `@ui-sdk/web/accordion` | 18 817 | `@ui-sdk/web/checkbox` | 18 980 |
| `@ui-sdk/web/radio` | 20 571 | `@ui-sdk/web/rating` | 21 127 |
| `@ui-sdk/web/tabs` | 21 476 | `@ui-sdk/web/slider` | 22 370 |
| `@ui-sdk/web/number-input` | 22 499 | `@ui-sdk/web/toast` | 26 738 |
| `@ui-sdk/web/carousel` | 28 957 | `@ui-sdk/web/dialog` | 32 993 (+13 827 lazy) |
| `@ui-sdk/web/tooltip` | 33 595 | | |

Implications:

- The upstream browser build is unsuitable as Ripple's `ripple.js` delivery as-is: it only autoloads `ui-*`, makes many small requests, and cannot include `rp-*` elements that must share the same kernel instance. Ripple MUST build its own browser bundle from the npm packages: a small loader plus one chunk per Ripple component group, sharing one copy of `@ui-sdk/core`.
- Two copies of `@ui-sdk/core` on a page break ownership (parts cannot find roots across copies; tags defined twice are skipped with a warning, `claimTag`). Ripple's prebuilt bundle and a project's own bundler MUST NOT both include ui-sdk for the same tags.
- `peerDependencies` of `@ui-sdk/web@0.1.0-beta.14` is `"@ui-sdk/core": "^0.1.0-beta.14"`.

## 8. Stability and pinning

Facts (`npm view @ui-sdk/web time`, `uisdk/packages/core/CHANGELOG.md`, `uisdk/packages/web/CHANGELOG.md`):

| Version | Published (UTC) | Core changelog entries |
|---|---|---|
| 0.1.0-beta.1 | 2026-11-12 | 1 |
| beta.2 | 2026-11-13 | 2 |
| beta.3, beta.4, beta.5 | 2026-11-15 | 3, 1, 5 |
| beta.6 | 2026-11-16 | 46 |
| beta.7 | 2026-11-17 | 14 |
| beta.8, beta.9, beta.10 | 2026-11-18 | 52, 8, 7 |
| beta.11 | not on npm (changelog only) | 2 |
| beta.12, beta.13 | 2026-11-19 | 6, 8 |
| beta.14 | 2026-11-21 17:12 | 26 |

- dist-tags at investigation time: `latest` = 0.1.0-beta.13, `beta` = 0.1.0-beta.14. `npm install @ui-sdk/web` without a version does **not** install the newest.
- All entries since beta.5 are labelled "Patch Changes". The changelog has no "breaking" entries, but many change observable DOM, focus or event behaviour. Examples between beta.5 and beta.14:
  - beta.6: "A menu trigger rendered as something other than a button ... is now a button people can tab to"; popups that mount open return focus differently; NumberInput commit/step fixes.
  - beta.8: "a dialog or menu trigger around a `<ui-button>` binds the button inside it" (changes which element gets attributes); Segmented Control indicator gets `data-activation-direction`.
  - beta.9: new `inline` on Dialog/Popover content; Select `virtualFocus`; Listbox/Combobox controller additions.
  - beta.10 to beta.14 (core): "Popover, Dialog, Drawer, Select and Date Picker handle Escape on their content, before it bubbles"; "A form reset leaves a controlled control with no default value alone"; "A drawer now styles and lays out its content once as it opens ... A top drawer in a right-to-left layout now opens at the top"; "Uncontrolled Tabs keep their `defaultValue` selected while that tab's server markup waits for its boundary to hydrate"; "A composed Command group renders shown on the server ... instead of `hidden`".
- The exact attribute set written at upgrade is not a documented contract. Section 3 is an observation of beta.14.
- The API is new (first publish nine days before this investigation). The docs contain at least two inconsistencies found here: the dangling "fallback markup" reference, and Field's "control is one of ours" versus source and behaviour.

Implications: see section 9.8.

## 9. What the spec must say

Normative statements the Ripple spec SHOULD adopt. Each follows from evidence above.

### 9.1 Which Ripple components use `ui-*` elements

- The spec MUST classify every V1 component as **static** (native elements + CSS, zero JS), **ui** (wraps `ui-*`), or **commerce** (`rp-*`), and MUST apply these corrections to the proposed architecture:

| Component | Classification | Reason |
|---|---|---|
| Checkbox, Radio, Switch, Select, Slider, SortSelect, LocaleSelector, VariantPicker | static, native controls | `ui-*` equivalents are dead without JS (3.12, 3.14, 3.15) |
| Accordion, Collapsible | static, `<details>` | only no-JS-capable form (4.1) |
| Pagination, Breadcrumb | static links | URL navigation; `ui-pagination` adds nothing required (3.18) |
| Rating, Progress, Skeleton, Spinner, Badge | static | no interaction (3.19, 3.20) |
| Button, IconButton, Link | static; `ui-button` only when a pending state is needed | 3.1 |
| QuantityInput | native number input + Ripple stepper (recommended) | 4.6 |
| Field, Label, form messages | `ui-field` with `as-child` native label; static variant also valid | 3.21 |
| Dialog, Drawer, Popover, Tooltip, Menu, Toast, Tabs, Carousel, NavigationMenu, PredictiveSearch | ui | no native equivalent with adequate behaviour |

- The spec MUST NOT use `ui-checkbox`, `ui-checkbox-group`, `ui-radio-group`, `ui-radio`, `ui-switch`, `ui-select`, `ui-slider`, `ui-rating`, or template-mode `ui-pagination` in any V1 contract.

### 9.2 HTML contract rules for `ui-*` markup

1. Every `ui-*` root MUST have an `id` that is unique in the document and stable across server renders. Bindings MUST generate it deterministically (prop, or the host framework's stable id such as React `useId`, or a Liquid-provided unique id). Part ids then follow the table in 2.2.
2. The server MUST print, for the **initial state**, every attribute listed in section 3 for that component, including `data-slot`, `type="button"`, `role`, `id`, `aria-*`, `tabindex`, state `data-*`, and the listed inline `style` values. The fixture for a component is this exact markup.
3. The server MUST print `hidden` on every part that is not shown in the initial state: dialog/drawer content and backdrop, drawer viewport, popover/menu/tooltip/combobox content, unselected tab panels, navigation-menu content and viewport, `ui-field-error` when there is no server error. The upstream docs' Usage snippets omit `hidden` for popover, tooltip, menu, tabs and navigation menu; Ripple MUST NOT copy that omission.
4. The server MUST print `<ui-drawer-viewport hidden>` around `<ui-drawer-content>`.
5. Parts that ui-sdk gives non-deterministic ids (menu items, carousel slides, field label/description/error, labels of `ui-*` controls) MUST carry an author id in the contract when the id is referenced by another attribute; otherwise they are listed in the fixture's "ignored attributes" set.
6. Wrapper parts MUST contain the native element they bind as a direct child: `<button>` or `<a>` for triggers/close/tabs/steps; `<input>` for `ui-combobox-input`, `ui-number-input-control`, `ui-input`; a heading for `ui-accordion-header`. Classes, accessible names and `rp-` styling hooks go on the native element or are selected through `[data-slot]`.
7. Initial state MUST be expressed with `default-*` attributes (`default-value`, `default-open`), not with the live attribute, unless the binding intends to control state.
8. Accessible names: icon-only buttons MUST have `aria-label` on the native button. Tabs lists, carousels and navigation menus MUST have `aria-label` on the element shown in section 3.
9. Popups MUST NOT be nested inside clickable cards or links ("Keep popups outside clickable cards and links", `popups.mdx`), and a dialog containing a form MUST NOT sit inside another form.

### 9.3 Conformance tests

- The spec MUST require, per `ui`-classified component, an **upgrade-diff test**: load the fixture HTML with JavaScript disabled and enabled, wait for all custom elements to be defined, and assert (a) no attribute or text differences outside the component's documented ignore list, (b) no element added, removed or moved outside the documented list (toast `<ol>`, body announcer `<div>`s), (c) identical bounding boxes for the component root and its visible parts. `spike/run.mjs` and `spike/t2.mjs` are a working starting point.
- The same test is the gate for ui-sdk version bumps (9.8).
- Fixtures MUST include the closed/initial state only. Open-state DOM is asserted by behaviour tests (role, focus, `inert`, Escape), not by string equality, because ui-sdk writes viewport-dependent inline styles and leaves residual attributes after closing (2.4).

### 9.4 Static CSS Ripple MUST ship

In `ripple.css`, before any JavaScript runs:

1. `@layer` order declaration with `ui-sdk` first (section 6).
2. A hidden rule equivalent to ui-sdk's, important, in the earliest layer, covering parts before they have `data-slot`: for example `:where([hidden]:not([hidden="until-found"])) { display: none !important }` scoped to `ui-*`/`rp-*` tags or applied globally.
3. `display` for **every** `ui-*` and `rp-*` tag used, matching the runtime values. `spike/site/pre-upgrade.css` is the verbatim beta.14 rule set for the 25 entries. The build SHOULD generate this file from the installed ui-sdk version (by loading the entries in a headless browser and reading `style#ui-sdk-web-1`) and the upgrade-diff test MUST fail if it drifts.
4. The popover reset for content parts, so open popups do not show the user-agent popover border/padding/background for one frame.
5. Carousel layout that ui-sdk otherwise applies inline (3.11).
6. `:not(:defined)` rules that hide JS-only affordances (carousel arrows, quantity steppers, submenu disclosure buttons) until upgrade.
7. Ripple MUST NOT load `@ui-sdk/core/web.css`.

### 9.5 Progressive-enhancement rules

1. Overlay openers that have a meaningful page equivalent (cart, menu, search, size guide, account) MUST be plain `<a href>` links in server HTML, intercepted after upgrade by a Ripple element that calls `event.preventDefault()` for unmodified primary clicks and then `api.open({})` on the target (4.3). They MUST NOT be `ui-*-trigger > a`.
2. Overlay openers with no page equivalent MAY be `ui-*-trigger > button`; the spec MUST mark those components "requires JavaScript" in the manifest.
3. Content that must be reachable without JavaScript MUST NOT be placed only inside Tabs panels, Popover, Menu or Tooltip.
4. Forms MUST submit correctly with JavaScript disabled using only native controls. Any control whose `name` handling differs between modes (QuantityInput if built on `ui-number-input`) MUST have a test submitting a value ≥ 1000 in both modes.
5. Toasts are enhancement only. Outcomes of form posts MUST also be representable as server-rendered Banner/inline messages.

### 9.6 Rules for `rp-*` elements

1. Author with `definePrimitive` (from `@ui-sdk/core`) and `createParts` (from `@ui-sdk/web`). Tag names start with `rp-`; the primitive `name` equals the root tag so `data-slot` values are `rp-<name>` and `rp-<name>-<slot>`.
2. For every live state property `x` exposed through `RootOptions.state`, the primitive MUST declare option `defaultX` and initialise from `options.defaultX`. The HTML attribute is `x` (or `default-x`).
3. State that the server knows (counts, totals, pending=false) MUST be printed as the same `data-*` attributes and text the slot's `attrs`/`bind` will write, so upgrade is zero-diff.
4. External subscriptions (Hydrogen stores) MUST be set up inside `api` with `context.onDestroy`, or in root `render` returning a cleanup. Elements MUST tolerate destroy/recreate on disconnect/reconnect.
5. Events: non-bubbling, named `<state>change` or a verb (`action`). Documentation MUST tell consumers to listen on the element or with `{ capture: true }` on an ancestor. Property and attribute writes fire no event.
6. `attrs` MUST be pure. Text updates happen in `bind` via `part.store.subscribe`.
7. Announcements use `announce()` from `@ui-sdk/core`.
8. `rp-*` elements reflect state only. They MUST NOT create, remove or reorder host-rendered elements (consistent with the proposed architecture), and MUST NOT strip attributes from `ui-*` descendants.
9. The `agent` key SHOULD list the api methods an agent may call.

### 9.7 Rules for hosts that re-render (React, Remix 3, Liquid partials)

1. A host re-render or DOM morph MUST NOT remove attributes ui-sdk wrote on elements inside an upgraded `ui-*` root (2.6). In practice: a partial refresh either replaces the **whole** `ui-*` root (accepting state reset to the server-rendered initial state) or targets regions that contain no upgraded `ui-*` internals.
2. Structural updates inside a ui root are safe when they add or replace whole parts (`ui-tabs-tab` + panel, a wrapped `<button>` node), which rebind automatically.
3. Elements ui-sdk adds outside component roots (`body > div[data-ui-sdk-announcer]`, `head > style[id^="ui-sdk-"]`) MUST be preserved by any whole-document morph.
4. Open overlays apply `inert` to sibling subtrees and `overflow: hidden` to `<html>`. A refresh that replaces an open overlay's root while open MUST close it first (`el.open = false`) or the page can be left inert. UNVERIFIED by test; derived from 2.4 and the root lifecycle in 2.6.

### 9.8 Dependency policy

1. `@ui-sdk/web` and `@ui-sdk/core` MUST be pinned to the same exact version (no `^`, no dist-tag) in Ripple's package, and Ripple's prebuilt bundle MUST embed that version.
2. Because Ripple's scaffolded CSS and fixtures encode ui-sdk's upgrade output, **Ripple's npm package version determines the ui-sdk version**; projects MUST NOT install a different ui-sdk version alongside. The CLI `check` command SHOULD detect a second copy.
3. A ui-sdk bump is a Ripple release task: regenerate `pre-upgrade` display CSS, run all upgrade-diff tests, review the upstream changelog for the components in use, update fixtures, and record changed attributes in Ripple's changelog as potentially breaking for scaffolded CSS.
4. The spec SHOULD keep the list of ui-sdk entries Ripple depends on as short as section 9.1 allows; each removed entry removes exposure to beta churn.
5. Ripple MUST only use ui-sdk APIs observed here or marked `@stable` in source, and MUST NOT rely on undocumented internals (`@ui-sdk/core/renderer`, `definePart`, `instanceOf`).

### 9.9 Open questions for the spec author

- Tabs contract A versus B (4.2).
- QuantityInput: Ripple stepper versus `ui-number-input` with name hand-off (4.6).
- Whether Field's inline client validation (`ui-field`) is in V1 or the static variant is the only contract.
- NavigationMenu fallback shape (4.4).
- Minimum browser versions, given `popover`, CSS anchor positioning and `inert` in ui-sdk's popups. UNVERIFIED which fallbacks ui-sdk ships for browsers without anchor positioning.

## 10. Assumption check

| Proposed-architecture assumption | Verdict | Evidence |
|---|---|---|
| UI SDK `ui-*` elements can supply interactive behaviour on light-DOM server markup | Confirmed | sections 2, 3 |
| "Server writes initial ARIA/state because UI SDK web elements don't compute ARIA until upgrade" | Confirmed, and exact zero-diff is achievable with a root `id` | 3.2, 3.8, 3.9 |
| "Native-first (details, select, number input)" can be combined with the ui element | Refuted for the same element: ui-sdk does not wrap `<details>`, `<select>`, checkbox, radio or range. Native-first means **not using** the ui element. Number input wraps a native input but breaks `type` and submitted value. | 3.9, 3.12, 3.14-3.16, 4 |
| "No layout shift on upgrade" | Only with Ripple-shipped static CSS for `display`, `hidden`, carousel layout, and pre-rendered `hidden`; not by default | 2.3, 6, layout results in `spike/out/interact.live.txt` |
| "Actions are real forms/links" compatible with ui triggers | Partly: buttons/submit keep working; a link inside a trigger still navigates after upgrade | 4.3 |
| Docs recommend fallback markup for forms before upgrade | Refuted: referenced but absent | section 1 item 2 |
| `rp-*` elements can be built with `definePrimitive` + `createParts` | Confirmed, with the `defaultX` rule | 5 |
| "All CSS precompiled so no build step is needed" is compatible with ui-sdk | Partly: ui-sdk injects its own layer at runtime; Ripple must precompile the equivalent and order layers | 6 |
| One prebuilt `ripple.js` | Feasible only as a Ripple-built bundle sharing one core copy; the upstream browser build cannot host `rp-*` | 7 |
| Beta dependency risk (R5) is manageable by pinning | Partly: pinning is necessary; DOM output is undocumented and has changed between betas, so fixtures must gate every bump | 8 |

## 11. Reproducing the spike

Sources are in `docs/research/spikes/uisdk-web/` (see its `README.md`). Pages are assembled from body fragments:

```bash
cd docs/research/spikes/uisdk-web && npm install
cp -r node_modules/@ui-sdk/web/browser/* site/
head='<!doctype html><html lang="en"><head><meta charset="utf-8"><title>spike</title>'
{ echo "$head"'<script type="module" src="/web.js"></script></head><body>'; cat site/body.html; echo '</body></html>'; } > site/all-bare.html
{ echo "$head"'<link rel="stylesheet" href="/pre-upgrade.css"><script type="module" src="/web.js"></script></head><body>'; cat site/body.html; echo '</body></html>'; } > site/all-pre.html
{ echo "$head"'<script type="module" src="/web.js"></script><script type="module" src="/custom.js"></script></head><body>'; cat site/pe-body.html; echo '</body></html>'; } > site/pe-bare.html
{ echo "$head"'<link rel="stylesheet" href="/pre-upgrade.css"><script type="module" src="/web.js"></script><script type="module" src="/custom.js"></script></head><body>'; cat site/pe-body.html; echo '</body></html>'; } > site/pe-pre.html
node run.mjs all-bare.html && node run.mjs pe-bare.html && node interact.mjs && node t2.mjs && node t3.mjs
```

Note on a measurement artefact: the "LAYOUT SHIFT all-pre.html" block in `out/interact.live.txt` still reports shifts because `site/body.html` uses the upstream docs' markup (no `hidden`, template-generated children). The correctly pre-rendered page `site/t2.html` shows identical section boxes with and without JS (`out/t2.txt`, lines `LAYOUT nojs` / `LAYOUT js`).

## Appendix A. Tags, attributes, events and CSS custom properties (generated)

Generated from `npm:@ui-sdk/web/custom-elements.json` (0.1.0-beta.14) for the entries in scope. `name=default` shows the documented default. Every root also accepts `debug`. Properties that are not attributes (for example `items`, `toaster`, `format`, `controller`, `persistentElements`) are not listed; see `custom-elements.json` `members`. Events do not bubble (section 2.5).

#### `@ui-sdk/web/button`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-button` | `disabled`=false, `focusable-when-disabled`=false, `pending-announcement`=Loading, `debug` | - | - |

#### `@ui-sdk/web/dialog`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-dialog` | `container`, `open`, `default-open`=false, `dismissible`=true, `persistent-elements`, `pending-announcement`=Loading, `modal`=true, `close-on-outside-press`=true, or false when `modal` is false, `presentation`=dialog, `debug` | `openchangecomplete`, `dismissattempt`, `openchange`, `payloadchange` | `--keyboard-inset`, `--visual-viewport-width`, `--visual-viewport-height`, `--visual-viewport-top` |
| `ui-dialog-trigger` | `disabled`=false, `focusable-when-disabled`=false, `shortcut`, `for` | - | - |
| `ui-dialog-close` | `value`, `for` | `action` | - |
| `ui-dialog-shortcut` | `shortcut`, `for`, `as-child` | - | - |
| `ui-dialog-backdrop` | `for`, `as-child` | - | - |
| `ui-dialog-content` | `container`, `initial-focus`=auto, `final-focus`=trigger, `keep-mounted`=false, `inline`=false, `for`, `as-child` | - | `--dialog-stack`, `--keyboard-inset`, `--visual-viewport-width`, `--visual-viewport-height`, `--visual-viewport-top`, `--drawer-progress`, `--drawer-dim`, `--drawer-expand`, `--drawer-stack`, `--sheet-backdrop` |
| `ui-dialog-title` | `for`, `as-child` | - | - |
| `ui-dialog-description` | `for`, `as-child` | - | - |

#### `@ui-sdk/web/drawer`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-drawer` | `container`, `open`, `default-open`=false, `dismissible`=true, `persistent-elements`, `pending-announcement`=Loading, `modal`=true, `close-on-outside-press`=true, or false while the drawer isn't modal, `snap-points`=[content], `snap-point`, `default-snap-point`=the first of `snapPoints, `side`=bottom, `modal-above`, `driver`=auto, `expand-on-scroll`=true, `theme-color`=false, `prevent-edge-swipe`=false, `debug` | `openchangecomplete`, `openchange`, `payloadchange`, `dismissattempt`, `snappointchange` | - |
| `ui-drawer-trigger` | `disabled`=false, `focusable-when-disabled`=false, `shortcut`, `for` | - | - |
| `ui-drawer-close` | `value`, `for` | `action` | - |
| `ui-drawer-shortcut` | `shortcut`, `for`, `as-child` | - | - |
| `ui-drawer-backdrop` | `for`, `as-child` | - | - |
| `ui-drawer-viewport` | `for`, `as-child` | - | `--keyboard-inset`, `--visual-viewport-width`, `--visual-viewport-height`, `--visual-viewport-top` |
| `ui-drawer-content` | `container`, `initial-focus`=auto, `final-focus`=trigger, `keep-mounted`=false, `for`, `as-child` | - | `--drawer-progress`, `--drawer-dim`, `--drawer-expand`, `--drawer-stack` |
| `ui-drawer-handle` | `for` | - | - |
| `ui-drawer-outlet` | `for`, `as-child` | - | `--drawer-progress`, `--drawer-dim`, `--drawer-expand` |
| `ui-drawer-title` | `for`, `as-child` | - | - |
| `ui-drawer-description` | `for`, `as-child` | - | - |

#### `@ui-sdk/web/popover`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-popover` | `container`, `open`, `default-open`=false, `modal`=false, or true while it presents as a sheet, `open-on-hover`=false, `delay`=300, `close-delay`=0, `presentation`=popover, `dismissible`=true, `debug` | `openchange`, `openchangecomplete`, `payloadchange`, `dismissattempt` | `--keyboard-inset`, `--visual-viewport-width`, `--visual-viewport-height`, `--visual-viewport-top` |
| `ui-popover-trigger` | `disabled`=false, `focusable-when-disabled`=false, `shortcut`, `for` | - | - |
| `ui-popover-close` | `for` | - | - |
| `ui-popover-shortcut` | `shortcut`, `for`, `as-child` | - | - |
| `ui-popover-content` | `side`=bottom, `align`=center, `side-offset`=4, `align-offset`=0, `collision-padding`=8, `container`, `arrow-padding`=6, `anchor`, `initial-focus`=auto, `final-focus`=trigger, `keep-mounted`=false, `inline`=false, `for`, `as-child` | - | `--anchor-width`, `--anchor-height`, `--available-width`, `--available-height`, `--transform-origin`, `--arrow-offset`, `--drawer-progress`, `--drawer-dim`, `--drawer-expand`, `--drawer-stack`, `--sheet-backdrop` |
| `ui-popover-title` | `for`, `as-child` | - | - |
| `ui-popover-description` | `for`, `as-child` | - | - |
| `ui-popover-arrow` | `for`, `as-child` | - | - |

#### `@ui-sdk/web/tooltip`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-tooltip` | `container`, `open`, `default-open`=false, `delay`=600, `close-delay`=0, `disabled`=false, `toggleable`=false, `close-on-press`=true, `type`, `shortcut`, `debug` | `openchange`, `openchangecomplete`, `payloadchange` | - |
| `ui-tooltip-trigger` | `for` | - | - |
| `ui-tooltip-content` | `side`=top, `align`=center, `side-offset`=4, `align-offset`=0, `collision-padding`=8, `container`, `arrow-padding`=6, `anchor`, `for`, `as-child` | - | `--anchor-width`, `--anchor-height`, `--available-width`, `--available-height`, `--transform-origin`, `--arrow-offset` |
| `ui-tooltip-arrow` | `for`, `as-child` | - | - |
| `ui-tooltip-shortcut` | `shortcut`, `for`, `as-child` | - | - |

#### `@ui-sdk/web/menu`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-menu` | `container`, `open`, `default-open`=false, `pending-announcement`=Loading, `item-shortcuts`=true, `loop`=true, `delay`=100, `presentation`=popover, `modal`=pointer, or true while it presents as a sheet, `dismissible`=true, `debug` | `openchange`, `openchangecomplete`, `payloadchange`, `action`, `dismissattempt` | `--keyboard-inset`, `--visual-viewport-width`, `--visual-viewport-height`, `--visual-viewport-top` |
| `ui-menu-sub` | `open`, `default-open`=false, `pending-announcement`=Loading, `loop`=true, `delay`=100, `debug` | `openchange`, `openchangecomplete`, `payloadchange`, `action`, `checkedchange`, `valuechange`, `dismissattempt` | - |
| `ui-menu-trigger` | `disabled`=false, `focusable-when-disabled`=false, `shortcut`, `for` | - | - |
| `ui-menu-context-trigger` | `disabled`=false, `for`, `as-child` | - | - |
| `ui-menu-content` | `side`=bottom, `align`=start, `side-offset`=4, `align-offset`, `collision-padding`=8, `arrow-padding`=6, `container`, `anchor`, `final-focus`=trigger, `keep-mounted`=false, `for`, `as-child` | - | `--anchor-width`, `--anchor-height`, `--available-width`, `--available-height`, `--transform-origin`, `--arrow-offset`, `--drawer-progress`, `--drawer-dim`, `--drawer-expand`, `--drawer-stack`, `--sheet-backdrop` |
| `ui-menu-sub-content` | `side`=bottom, `align`=start, `side-offset`=4, `align-offset`, `collision-padding`=8, `arrow-padding`=6, `anchor`, `final-focus`=trigger, `keep-mounted`=false, `for`, `as-child` | - | - |
| `ui-menu-sub-trigger` | `disabled`=false, `focusable-when-disabled`=false, `shortcut`, `for`, `as-child` | - | - |
| `ui-menu-item` | `value`, `label`, `disabled`, `destructive`, `shortcut`, `close-on-select`=true, `for`, `as-child` | `select` | - |
| `ui-menu-checkbox-item` | `value`, `label`, `disabled`, `checked`, `default-checked`=false, `close-on-select`=false, `for`, `as-child` | `checkedchange` | - |
| `ui-menu-radio-group` | `value`, `default-value`, `for`, `as-child` | `valuechange` | - |
| `ui-menu-radio-item` | `value`, `label`, `disabled`, `close-on-select`=false, `for`, `as-child` | - | - |
| `ui-menu-item-indicator` | `keep-mounted`=false, `for`, `as-child` | - | - |
| `ui-menu-group` | `for`, `as-child` | - | - |
| `ui-menu-group-label` | `for`, `as-child` | - | - |
| `ui-menu-separator` | `for`, `as-child` | - | - |
| `ui-menu-shortcut` | `for`, `as-child` | - | - |
| `ui-menu-item-icon` | `mirror`=false, `for`, `as-child` | - | - |

#### `@ui-sdk/web/toast`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-toast-region` | `side`=bottom, `align`=end, `max-visible`=3, `expanded`=false, `shortcut`=F6, `pending-announcement`=Loading, `debug` | - | `--toast-front-height`, `--toast-stack-height`, `--toast-count`, `--keyboard-inset`, `--visual-viewport-width`, `--visual-viewport-height`, `--visual-viewport-top` |
| `ui-toast` | `for`, `as-child` | - | `--toast-index`, `--toast-offset`, `--toast-height`, `--toast-swipe-x`, `--toast-swipe-y` |
| `ui-toast-title` | `for`, `as-child` | - | - |
| `ui-toast-description` | `for`, `as-child` | - | - |
| `ui-toast-action` | `dismiss`=the toast's `action.dismiss`, else true, `for` | `action` | - |
| `ui-toast-close` | `for` | `action` | - |

#### `@ui-sdk/web/tabs`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-tabs` | `value`, `default-value`, `orientation`=horizontal, `activation`=automatic, `loop`=true, `hidden-until-found`=false, `debug` | `valuechange` | - |
| `ui-tabs-list` | `for`, `as-child` | - | - |
| `ui-tabs-tab` | `value`, `disabled`, `for` | - | - |
| `ui-tabs-tab-icon` | `mirror`=false, `for`, `as-child` | - | - |
| `ui-tabs-indicator` | `for`, `as-child` | - | `--active-tab-left`, `--active-tab-right`, `--active-tab-top`, `--active-tab-bottom`, `--active-tab-width`, `--active-tab-height` |
| `ui-tabs-panel` | `value`, `keep-mounted`=false, `hidden-until-found`, `for`, `as-child` | - | - |

#### `@ui-sdk/web/accordion`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-accordion` | `value`, `default-value`=[], `multiple`=false, `collapsible`=true, `disabled`=false, `keep-mounted`=false, `hidden-until-found`=false, `debug` | `valuechange` | - |
| `ui-accordion-item` | `value`, `disabled`=false, `for`, `as-child` | `openchange`, `openchangecomplete` | - |
| `ui-accordion-header` | `for` | - | - |
| `ui-accordion-trigger` | `disabled`=false, `for` | - | - |
| `ui-accordion-panel` | `keep-mounted`, `hidden-until-found`, `for`, `as-child` | - | `--accordion-panel-height`, `--accordion-panel-width` |

#### `@ui-sdk/web/collapsible`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-collapsible` | `open`, `default-open`=false, `disabled`=false, `debug` | `openchange`, `openchangecomplete` | - |
| `ui-collapsible-trigger` | `for` | - | - |
| `ui-collapsible-panel` | `keep-mounted`=false, `hidden-until-found`=false, `for`, `as-child` | - | `--collapsible-panel-height`, `--collapsible-panel-width` |

#### `@ui-sdk/web/carousel`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-carousel` | `page`, `default-page`=1, `playing`, `default-playing`=false, `interval`=5000, `orientation`=horizontal, `align`=start, `slides-per-page`=1, `loop`=false, `skip-snaps`=false, `drag-free`=false, `drag`=true, `debug` | `pagechange`, `pagechangecomplete`, `playingchange` | `--carousel-interval`, `--carousel-progress` |
| `ui-carousel-viewport` | `for`, `as-child` | - | - |
| `ui-carousel-content` | `for`, `as-child` | - | - |
| `ui-carousel-item` | `for`, `as-child` | - | - |
| `ui-carousel-previous` | `for` | - | - |
| `ui-carousel-next` | `for` | - | - |
| `ui-carousel-play-toggle` | `for` | - | - |
| `ui-carousel-indicator-group` | `for`, `as-child` | - | - |
| `ui-carousel-indicator` | `page`, `for` | - | - |

#### `@ui-sdk/web/select`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-select` | `container`, `value`, `default-value`, `open`, `default-open`=false, `multiple`=false, `query`, `default-query`, `filter`=contains, `status`=idle, `placeholder`, `loop`=true, `virtual-focus`=false, `modal`=pointer, or true while it presents as a sheet, `presentation`=popover, `disabled`, `read-only`, `required`, `name`, `form`, `auto-complete`, `dismissible`=true, `debug` | `openchange`, `openchangecomplete`, `querychange`, `loadmore`, `highlight`, `dismissattempt`, `valuechange` | `--keyboard-inset`, `--visual-viewport-width`, `--visual-viewport-height`, `--visual-viewport-top` |
| `ui-select-label` | `for`, `as-child` | - | - |
| `ui-select-trigger` | `disabled`=false, `for` | - | - |
| `ui-select-value` | `placeholder`, `max-labels`, `for`, `as-child` | - | - |
| `ui-select-clear` | `keep-mounted`=false, `for` | - | - |
| `ui-select-content` | `side`=bottom, `align`=start, `side-offset`=4, `align-offset`=0, `collision-padding`=8, `arrow-padding`=6, `container`, `anchor`, `align-item-with-trigger`=false, `keep-mounted`=false, `for`, `as-child` | - | `--anchor-width`, `--anchor-height`, `--available-width`, `--available-height`, `--transform-origin`, `--arrow-offset`, `--drawer-progress`, `--drawer-dim`, `--drawer-expand`, `--drawer-stack`, `--sheet-backdrop` |
| `ui-select-list` | `for`, `as-child` | - | - |
| `ui-select-input` | `for` | - | - |
| `ui-select-empty` | `for`, `as-child` | - | - |
| `ui-select-status` | `for`, `as-child` | - | - |
| `ui-select-item-text` | `for`, `as-child` | - | - |
| `ui-select-select-all` | `for`, `as-child` | - | - |
| `ui-select-item` | `label`, `disabled`, `index`, `value`, `for`, `as-child` | - | - |
| `ui-select-item-indicator` | `keep-mounted`=false, `for`, `as-child` | - | - |
| `ui-select-item-icon` | `mirror`=false, `for`, `as-child` | - | - |
| `ui-select-value-icon` | `for`, `as-child` | - | - |
| `ui-select-group` | `for`, `as-child` | - | - |
| `ui-select-group-label` | `for`, `as-child` | - | - |
| `ui-select-separator` | `for`, `as-child` | - | - |
| `ui-select-arrow` | `for`, `as-child` | - | - |

#### `@ui-sdk/web/combobox`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-combobox` | `container`, `value`, `default-value`, `query`, `default-query`, `open`, `default-open`=false, `multiple`=false, `max-selected`, `pending-announcement`=Loading, `filter`=contains, `auto-highlight`=false, `keep-query`=false, `allow-custom-value`=false, `status`=idle, `loop`=true, `modal`=false, or true while it presents as a sheet, `presentation`=popover, `disabled`, `read-only`, `required`, `name`, `form`, `dismissible`=true, `debug` | `querychange`, `openchange`, `openchangecomplete`, `highlight`, `loadmore`, `dismissattempt`, `valuechange` | `--keyboard-inset`, `--visual-viewport-width`, `--visual-viewport-height`, `--visual-viewport-top` |
| `ui-combobox-label` | `for`, `as-child` | - | - |
| `ui-combobox-input` | `for` | - | - |
| `ui-combobox-trigger` | `for` | - | - |
| `ui-combobox-clear` | `keep-mounted`=false, `for` | - | - |
| `ui-combobox-content` | `side`=bottom, `align`=start, `side-offset`=4, `align-offset`=0, `collision-padding`=8, `arrow-padding`=6, `container`, `anchor`, `keep-mounted`=false, `for`, `as-child` | - | `--anchor-width`, `--anchor-height`, `--available-width`, `--available-height`, `--transform-origin`, `--arrow-offset`, `--drawer-progress`, `--drawer-dim`, `--drawer-expand`, `--drawer-stack`, `--sheet-backdrop` |
| `ui-combobox-list` | `for`, `as-child` | - | - |
| `ui-combobox-item` | `label`, `keywords`, `disabled`, `index`, `value`, `for`, `as-child` | - | - |
| `ui-combobox-item-indicator` | `keep-mounted`=false, `for`, `as-child` | - | - |
| `ui-combobox-item-icon` | `mirror`=false, `for`, `as-child` | - | - |
| `ui-combobox-value-icon` | `for`, `as-child` | - | - |
| `ui-combobox-group` | `for`, `as-child` | - | - |
| `ui-combobox-group-label` | `for`, `as-child` | - | - |
| `ui-combobox-separator` | `for`, `as-child` | - | - |
| `ui-combobox-create` | `min-length`=1, `for`, `as-child` | - | - |
| `ui-combobox-empty` | `for`, `as-child` | - | - |
| `ui-combobox-status` | `for`, `as-child` | - | - |
| `ui-combobox-chips` | `for`, `as-child` | - | - |
| `ui-combobox-chip` | `value`, `for`, `as-child` | - | - |
| `ui-combobox-chips-overflow` | `for`, `as-child` | - | - |
| `ui-combobox-item-text` | `for`, `as-child` | - | - |
| `ui-combobox-select-all` | `for`, `as-child` | - | - |
| `ui-combobox-chip-remove` | `for` | - | - |
| `ui-combobox-arrow` | `for`, `as-child` | - | - |

#### `@ui-sdk/web/checkbox`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-checkbox` | `checked`, `default-checked`=false, `disabled`, `read-only`, `required`, `name`, `value`=on, `form`, `parent`=false, `debug` | `checkedchange` | - |
| `ui-checkbox-indicator` | `keep-mounted`=false, `for`, `as-child` | - | - |
| `ui-checkbox-group` | `value`, `default-value`=[], `all-values`, `disabled`, `read-only`, `required`, `name`, `form`, `debug` | `valuechange` | - |

#### `@ui-sdk/web/radio`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-radio-group` | `value`, `default-value`, `disabled`, `read-only`, `required`, `name`, `form`, `loop`=true, `debug` | `valuechange` | - |
| `ui-radio` | `value`, `disabled`, `for`, `as-child` | - | - |
| `ui-radio-indicator` | `keep-mounted`=false, `for`, `as-child` | - | - |

#### `@ui-sdk/web/switch`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-switch` | `checked`, `default-checked`=false, `disabled`, `read-only`, `required`, `name`, `value`=on, `form`, `debug` | `checkedchange` | - |
| `ui-switch-thumb` | `for`, `as-child` | - | - |

#### `@ui-sdk/web/slider`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-slider` | `value`, `default-value`=min, `min`=0, `max`=100, `step`=1, `large-step`=10 steps, `min-steps-between-thumbs`=0, `orientation`=horizontal, `disabled`, `read-only`, `required`, `name`, `form`, `locale`, `debug` | `valuechange`, `valuecommit` | - |
| `ui-slider-control` | `for`, `as-child` | - | - |
| `ui-slider-track` | `for`, `as-child` | - | - |
| `ui-slider-indicator` | `for`, `as-child` | - | `--slider-indicator-start`, `--slider-indicator-size` |
| `ui-slider-thumb` | `index`=0, `for`, `as-child` | - | `--slider-thumb-position` |
| `ui-slider-thumb-input` | `for` | - | - |
| `ui-slider-value` | `for`, `as-child` | - | - |

#### `@ui-sdk/web/number-input`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-number-input` | `value`, `default-value`=null, `min`, `max`, `step`=1, or the smallest percent a percent format shows, like 0.01, `large-step`=10 steps, `small-step`=a tenth of a step, `locale`, `wheel`=false, `disabled`, `read-only`, `required`, `name`, `form`, `debug` | `valuechange`, `valuecommit` | - |
| `ui-number-input-group` | `for`, `as-child` | - | - |
| `ui-number-input-control` | `for` | - | - |
| `ui-number-input-increment` | `disabled`, `for` | - | - |
| `ui-number-input-decrement` | `disabled`, `for` | - | - |
| `ui-number-input-scrub-area` | `orientation`=horizontal, `pixels-per-step`=2, `for`, `as-child` | - | - |
| `ui-number-input-scrub-area-cursor` | `for`, `as-child` | - | - |

#### `@ui-sdk/web/navigation-menu`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-navigation-menu` | `container`, `value`, `default-value`=null, `delay`=50, `close-delay`=50, `open-on-hover`=true, `close-on-select`=true, `orientation`=horizontal, `debug` | `valuechange`, `openchangecomplete` | - |
| `ui-navigation-menu-list` | `for`, `as-child` | - | - |
| `ui-navigation-menu-item` | `value`, `for`, `as-child` | - | - |
| `ui-navigation-menu-trigger` | `disabled`=false, `for` | - | - |
| `ui-navigation-menu-content` | `side`=bottom, `align`=start, `side-offset`=4, `align-offset`=0, `collision-padding`=8, `arrow-padding`=6, `anchor`, `keep-mounted`=false, `hidden-until-found`=false, `for`, `as-child` | - | `--anchor-width`, `--anchor-height`, `--available-width`, `--available-height`, `--transform-origin`, `--arrow-offset` |
| `ui-navigation-menu-link` | `current`=false, `close-on-select`, `for` | - | - |
| `ui-navigation-menu-link-icon` | `mirror`=false, `for`, `as-child` | - | - |
| `ui-navigation-menu-viewport` | `side`=bottom, `align`=start, `side-offset`=4, `align-offset`=0, `collision-padding`=8, `arrow-padding`=6, `anchor`, `for`, `as-child` | - | `--anchor-width`, `--anchor-height`, `--available-width`, `--available-height`, `--transform-origin`, `--arrow-offset`, `--viewport-width`, `--viewport-height` |
| `ui-navigation-menu-indicator` | `for`, `as-child` | - | `--active-item-left`, `--active-item-right`, `--active-item-top`, `--active-item-bottom`, `--active-item-width`, `--active-item-height` |

#### `@ui-sdk/web/pagination`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-pagination` | `page`, `default-page`=1, `page-count`, `total`, `page-size`=10, `siblings`=1, `boundaries`=1, `disabled`=false, `debug` | `pagechange` | - |
| `ui-pagination-list` | `for`, `as-child` | - | - |
| `ui-pagination-item` | `for`, `as-child` | - | - |
| `ui-pagination-link` | `page`, `for` | - | - |
| `ui-pagination-previous` | `for` | - | - |
| `ui-pagination-next` | `for` | - | - |
| `ui-pagination-first` | `for` | - | - |
| `ui-pagination-last` | `for` | - | - |
| `ui-pagination-ellipsis` | `for`, `as-child` | - | - |

#### `@ui-sdk/web/rating`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-rating` | `value`, `default-value`, `max`=5, `step`=1, `deselectable`, `disabled`, `read-only`, `required`, `name`, `form`, `loop`=false, `debug` | `valuechange` | - |
| `ui-rating-item` | `index`, `for`, `as-child` | - | `--rating-fill` |
| `ui-rating-radio` | `value`, `disabled`, `for`, `as-child` | - | - |

#### `@ui-sdk/web/progress`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-progress` | `min`=0, `max`=100, `locale`, `value`=null, `debug` | - | `--progress-value` |
| `ui-progress-track` | `for`, `as-child` | - | - |
| `ui-progress-indicator` | `for`, `as-child` | - | - |
| `ui-progress-label` | `for`, `as-child` | - | - |
| `ui-progress-value` | `for`, `as-child` | - | - |

#### `@ui-sdk/web/field`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-field` | `name`, `disabled`, `invalid`, `debug` | - | - |
| `ui-field-label` | `for`, `as-child` | - | - |
| `ui-field-description` | `for`, `as-child` | - | - |
| `ui-field-error` | `match`, `for`, `as-child` | - | - |
| `ui-field-set` | `disabled`, `debug` | - | - |
| `ui-field-legend` | `for`, `as-child` | - | - |
| `ui-field-group` | `debug` | - | - |

#### `@ui-sdk/web/label`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-label` | `debug` | - | - |

#### `@ui-sdk/web/input`

| Tag | Attributes | Events | CSS custom properties |
|---|---|---|---|
| `ui-input` | `value`, `default-value`, `debug` | `valuechange` | - |
| `ui-input-group` | `debug` | - | - |
| `ui-input-clear` | `for` | - | - |

## Appendix B. State data attributes per part (generated)

Generated from the "Data Attributes" sections of `npm:@ui-sdk/web/docs/components/*.md` (0.1.0-beta.14). The tag shown is the part's custom element; when the part is a wrapper (trigger, close, tab, step button, `ui-button`, `ui-input`), the `data-slot` and state attributes are written on the wrapped native element (section 2.1). Value lists are examples from the docs, not always exhaustive (for example `data-snap-point`).

**button**

- `<ui-button>` `[data-slot="button"]`: `data-pending`, `data-disabled`

**dialog**

- `<ui-dialog-trigger>` `[data-slot="dialog-trigger"]`: `data-closed`, `data-disabled`, `data-open`
- `<ui-dialog-backdrop>` `[data-slot="dialog-backdrop"]`: `data-closed`, `data-open`, `data-starting-style`, `data-ending-style`
- `<ui-dialog-content>` `[data-slot="dialog-content"]`: `data-closed`, `data-presentation=dialog\|sheet`, `data-open`, `data-starting-style`, `data-ending-style`, `data-keyboard`
- `<ui-dialog-close>` `[data-slot="dialog-close"]`: `data-disabled`, `data-pending`

**drawer**

- `<ui-drawer-trigger>` `[data-slot="drawer-trigger"]`: `data-closed`, `data-disabled`, `data-open`
- `<ui-drawer-backdrop>` `[data-slot="drawer-backdrop"]`: `data-closed`, `data-open`, `data-interactive`, `data-starting-style`, `data-ending-style`, `data-dragging`
- `<ui-drawer-viewport>` `[data-slot="drawer-viewport"]`: `data-side=top\|right\|bottom\|left`, `data-closed`, `data-open`, `data-keyboard`
- `<ui-drawer-content>` `[data-slot="drawer-content"]`: `data-closed`, `data-side=top\|right\|bottom\|left`, `data-open`, `data-snap-point=content\|0.2`, `data-interactive`, `data-starting-style`, `data-ending-style`, `data-driver=pointer\|scroll-snap`, `data-expanded`, `data-dragging`
- `<ui-drawer-handle>` `[data-slot="drawer-handle"]`: `data-snap-point=content\|0.2`, `data-expanded`
- `<ui-drawer-close>` `[data-slot="drawer-close"]`: `data-disabled`, `data-pending`
- `<ui-drawer-outlet>` `[data-slot="drawer-outlet"]`: `data-closed`, `data-open`

**popover**

- `<ui-popover-trigger>` `[data-slot="popover-trigger"]`: `data-closed`, `data-disabled`, `data-open`
- `<ui-popover-content>` `[data-slot="popover-content"]`: `data-closed`, `data-presentation=popover\|sheet`, `data-open`, `data-starting-style`, `data-ending-style`, `data-side=top\|right\|bottom\|left`, `data-align=start\|center\|end`
- `<ui-popover-arrow>` `[data-slot="popover-arrow"]`: `data-closed`, `data-open`, `data-side=top\|right\|bottom\|left`, `data-align=start\|center\|end`, `data-arrow-clamped`

**tooltip**

- `<ui-tooltip-content>` `[data-slot="tooltip-content"]`: `data-closed`, `data-open`, `data-starting-style`, `data-ending-style`, `data-side=top\|right\|bottom\|left`, `data-align=start\|center\|end`
- `<ui-tooltip-arrow>` `[data-slot="tooltip-arrow"]`: `data-closed`, `data-open`, `data-side=top\|right\|bottom\|left`, `data-align=start\|center\|end`, `data-arrow-clamped`

**menu**

- `<ui-menu-trigger>` `[data-slot="menu-trigger"]`: `data-closed`, `data-open`
- `<ui-menu-context-trigger>` `[data-slot="menu-context-trigger"]`: `data-closed`, `data-disabled`, `data-open`
- `<ui-menu-content>` `[data-slot="menu-content"]`: `data-closed`, `data-presentation=popover\|sheet`, `data-nested`, `data-open`, `data-starting-style`, `data-ending-style`, `data-side=top\|right\|bottom\|left`, `data-align=start\|center\|end`, `data-has-icons`
- `<ui-menu-item>` `[data-slot="menu-item"]`: `data-disabled`, `data-highlighted`, `data-has-icon`
- `<ui-menu-checkbox-item>` `[data-slot="menu-checkbox-item"]`: `data-checked`, `data-unchecked`, `data-highlighted`
- `<ui-menu-item-indicator>` `[data-slot="menu-item-indicator"]`: `data-checked`, `data-unchecked`
- `<ui-menu-radio-item>` `[data-slot="menu-radio-item"]`: `data-checked`, `data-unchecked`, `data-highlighted`
- `<ui-menu-item-icon>` `[data-slot="menu-item-icon"]`: `data-mirror`

**toast**

- `<ui-toast-region>` `[data-slot="toast-region"]`: `data-side=top\|bottom`, `data-align=start\|center\|end`, `data-expanded`, `data-keyboard`
- `<ui-toast>` `[data-slot="toast"]`: `data-type=default\|success\|error\|info\|warning\|loading`, `data-front`, `data-expanded`, `data-starting-style`, `data-ending-style`
- `<ui-toast-action>` `[data-slot="toast-action"]`: `data-pending`

**tabs**

- `<ui-tabs>` `[data-slot="tabs"]`: `data-orientation=horizontal\|vertical`, `data-activation-direction=none\|left\|right\|up\|down`
- `<ui-tabs-list>` `[data-slot="tabs-list"]`: `data-orientation=horizontal\|vertical`, `data-activation-direction=none\|left\|right\|up\|down`, `data-has-icons`
- `<ui-tabs-tab>` `[data-slot="tabs-tab"]`: `data-selected`, `data-orientation=horizontal\|vertical`, `data-activation-direction=none\|left\|right\|up\|down`, `data-disabled`, `data-has-icon`
- `<ui-tabs-tab-icon>` `[data-slot="tabs-tab-icon"]`: `data-mirror`
- `<ui-tabs-indicator>` `[data-slot="tabs-indicator"]`: `data-orientation=horizontal\|vertical`, `data-activation-direction=none\|left\|right\|up\|down`
- `<ui-tabs-panel>` `[data-slot="tabs-panel"]`: `data-selected`, `data-orientation=horizontal\|vertical`, `data-activation-direction=none\|left\|right\|up\|down`, `data-starting-style`, `data-ending-style`

**accordion**

- `<ui-accordion>` `[data-slot="accordion"]`: `data-disabled`
- `<ui-accordion-item>` `[data-slot="accordion-item"]`: `data-open`, `data-closed`, `data-disabled`
- `<ui-accordion-header>` `[data-slot="accordion-header"]`: `data-open`, `data-closed`, `data-disabled`
- `<ui-accordion-trigger>` `[data-slot="accordion-trigger"]`: `data-open`, `data-closed`, `data-disabled`
- `<ui-accordion-panel>` `[data-slot="accordion-panel"]`: `data-open`, `data-closed`, `data-disabled`, `data-starting-style`, `data-ending-style`

**collapsible**

- `<ui-collapsible>` `[data-slot="collapsible"]`: `data-open`, `data-closed`, `data-disabled`
- `<ui-collapsible-trigger>` `[data-slot="collapsible-trigger"]`: `data-open`, `data-closed`, `data-disabled`
- `<ui-collapsible-panel>` `[data-slot="collapsible-panel"]`: `data-open`, `data-closed`, `data-disabled`, `data-starting-style`, `data-ending-style`

**carousel**

- `<ui-carousel>` `[data-slot="carousel"]`: `data-orientation=horizontal\|vertical`, `data-playing`, `data-paused`
- `<ui-carousel-viewport>` `[data-slot="carousel-viewport"]`: `data-orientation=horizontal\|vertical`, `data-dragging`
- `<ui-carousel-content>` `[data-slot="carousel-content"]`: `data-orientation=horizontal\|vertical`
- `<ui-carousel-item>` `[data-slot="carousel-item"]`: `data-orientation=horizontal\|vertical`, `data-active`, `data-in-view`
- `<ui-carousel-previous>` `[data-slot="carousel-previous"]`: `data-disabled`
- `<ui-carousel-indicator>` `[data-slot="carousel-indicator"]`: `data-selected`
- `<ui-carousel-play-toggle>` `[data-slot="carousel-play-toggle"]`: `data-playing`, `data-paused`

**select**

- `<ui-select-label>` `[data-slot="select-label"]`: `data-disabled`, `data-readonly`, `data-required`
- `<ui-select-trigger>` `[data-slot="select-trigger"]`: `data-closed`, `data-disabled`, `data-open`, `data-placeholder`, `data-readonly`, `data-required`
- `<ui-select-value>` `[data-slot="select-value"]`: `data-placeholder`
- `<ui-select-clear>` `[data-slot="select-clear"]`: `data-disabled`
- `<ui-select-content>` `[data-slot="select-content"]`: `data-closed`, `data-presentation=popover\|sheet`, `data-open`, `data-starting-style`, `data-ending-style`, `data-side=top\|right\|bottom\|left`, `data-align=start\|center\|end`, `data-modality=keyboard\|pointer`, `data-has-icons`
- `<ui-select-item>` `[data-slot="select-item"]`: `data-selected`, `data-disabled`, `data-highlighted`, `data-has-icon`
- `<ui-select-item-text>` `[data-slot="select-item-text"]`: `data-matched`
- `<ui-select-item-indicator>` `[data-slot="select-item-indicator"]`: `data-selected`
- `<ui-select-select-all>` `[data-slot="select-select-all"]`: `data-disabled`, `data-unchecked`, `data-highlighted`
- `<ui-select-empty>` `[data-slot="select-empty"]`: `data-loading`, `data-empty`
- `<ui-select-status>` `[data-slot="select-status"]`: `data-loading`
- `<ui-select-arrow>` `[data-slot="select-arrow"]`: `data-closed`, `data-open`, `data-side=top\|right\|bottom\|left`, `data-align=start\|center\|end`, `data-arrow-clamped`
- `<ui-select-item-icon>` `[data-slot="select-item-icon"]`: `data-mirror`

**combobox**

- `<ui-combobox-label>` `[data-slot="combobox-label"]`: `data-disabled`, `data-readonly`, `data-required`
- `<ui-combobox-input>` `[data-slot="combobox-input"]`: `data-closed`, `data-open`, `data-disabled`, `data-readonly`, `data-required`
- `<ui-combobox-trigger>` `[data-slot="combobox-trigger"]`: `data-closed`, `data-open`, `data-disabled`, `data-readonly`, `data-required`
- `<ui-combobox-clear>` `[data-slot="combobox-clear"]`: `data-disabled`
- `<ui-combobox-chips>` `[data-slot="combobox-chips"]`: `data-disabled`, `data-readonly`, `data-required`
- `<ui-combobox-content>` `[data-slot="combobox-content"]`: `data-closed`, `data-presentation=popover\|sheet`, `data-open`, `data-starting-style`, `data-ending-style`, `data-side=top\|right\|bottom\|left`, `data-align=start\|center\|end`, `data-modality=keyboard\|pointer`, `data-has-icons`
- `<ui-combobox-item>` `[data-slot="combobox-item"]`: `data-selected`, `data-disabled`, `data-highlighted`, `data-has-icon`
- `<ui-combobox-item-text>` `[data-slot="combobox-item-text"]`: `data-matched`
- `<ui-combobox-item-indicator>` `[data-slot="combobox-item-indicator"]`: `data-selected`
- `<ui-combobox-empty>` `[data-slot="combobox-empty"]`: `data-loading`, `data-empty`
- `<ui-combobox-status>` `[data-slot="combobox-status"]`: `data-loading`
- `<ui-combobox-arrow>` `[data-slot="combobox-arrow"]`: `data-closed`, `data-open`, `data-side=top\|right\|bottom\|left`, `data-align=start\|center\|end`, `data-arrow-clamped`
- `<ui-combobox-item-icon>` `[data-slot="combobox-item-icon"]`: `data-mirror`
- `<ui-combobox-chip>` `[data-slot="combobox-chip"]`: `data-value=a`, `data-disabled`
- `<ui-combobox-chip-remove>` `[data-slot="combobox-chip-remove"]`: `data-disabled`
- `<ui-combobox-select-all>` `[data-slot="combobox-select-all"]`: `data-disabled`, `data-unchecked`, `data-highlighted`
- `<ui-combobox-create>` `[data-slot="combobox-create"]`: `data-highlighted`, `data-pending`

**checkbox**

- `<ui-checkbox>` `[data-slot="checkbox"]`: `data-checked`, `data-disabled`, `data-readonly`, `data-required`, `data-unchecked`, `data-indeterminate`
- `<ui-checkbox-indicator>` `[data-slot="checkbox-indicator"]`: `data-checked`, `data-disabled`, `data-readonly`, `data-required`, `data-unchecked`, `data-indeterminate`, `data-starting-style`, `data-ending-style`
- `<ui-checkbox-group>` `[data-slot="checkbox-group"]`: `data-disabled`, `data-required`

**radio**

- `<ui-radio-group>` `[data-slot="radio-group"]`: `data-readonly`, `data-required`, `data-disabled`
- `<ui-radio>` `[data-slot="radio"]`: `data-checked`, `data-readonly`, `data-required`, `data-unchecked`, `data-disabled`
- `<ui-radio-indicator>` `[data-slot="radio-indicator"]`: `data-checked`, `data-readonly`, `data-required`, `data-unchecked`, `data-disabled`, `data-starting-style`, `data-ending-style`

**switch**

- `<ui-switch>` `[data-slot="switch"]`: `data-checked`, `data-disabled`, `data-readonly`, `data-required`, `data-unchecked`, `data-invalid`
- `<ui-switch-thumb>` `[data-slot="switch-thumb"]`: `data-checked`, `data-disabled`, `data-readonly`, `data-required`, `data-unchecked`

**slider**

- `<ui-slider>` `[data-slot="slider"]`: `data-orientation=horizontal\|vertical`, `data-disabled`, `data-dragging`
- `<ui-slider-value>` `[data-slot="slider-value"]`: `data-orientation=horizontal\|vertical`, `data-disabled`, `data-dragging`
- `<ui-slider-control>` `[data-slot="slider-control"]`: `data-orientation=horizontal\|vertical`, `data-disabled`, `data-dragging`
- `<ui-slider-track>` `[data-slot="slider-track"]`: `data-orientation=horizontal\|vertical`, `data-disabled`, `data-dragging`
- `<ui-slider-indicator>` `[data-slot="slider-indicator"]`: `data-orientation=horizontal\|vertical`, `data-disabled`, `data-dragging`
- `<ui-slider-thumb>` `[data-slot="slider-thumb"]`: `data-orientation=horizontal\|vertical`, `data-disabled`, `data-index=0\|1`, `data-dragging`

**number-input**

- `<ui-number-input>` `[data-slot="number-input"]`: `data-disabled`, `data-readonly`, `data-required`, `data-scrubbing`
- `<ui-number-input-scrub-area>` `[data-slot="number-input-scrub-area"]`: `data-disabled`, `data-readonly`, `data-required`, `data-orientation=horizontal\|vertical`, `data-scrubbing`
- `<ui-number-input-scrub-area-cursor>` `[data-slot="number-input-scrub-area-cursor"]`: `data-disabled`, `data-readonly`, `data-required`, `data-scrubbing`
- `<ui-number-input-group>` `[data-slot="number-input-group"]`: `data-disabled`, `data-readonly`, `data-required`, `data-scrubbing`
- `<ui-number-input-decrement>` `[data-slot="number-input-decrement"]`: `data-disabled`, `data-readonly`, `data-required`, `data-at-bound`, `data-scrubbing`
- `<ui-number-input-control>` `[data-slot="number-input-control"]`: `data-disabled`, `data-readonly`, `data-required`, `data-scrubbing`
- `<ui-number-input-increment>` `[data-slot="number-input-increment"]`: `data-disabled`, `data-readonly`, `data-required`, `data-scrubbing`

**navigation-menu**

- `<ui-navigation-menu>` `[data-slot="navigation-menu"]`: `data-orientation=horizontal\|vertical`, `data-nested`
- `<ui-navigation-menu-list>` `[data-slot="navigation-menu-list"]`: `data-orientation=horizontal\|vertical`, `data-has-icons`
- `<ui-navigation-menu-item>` `[data-slot="navigation-menu-item"]`: `data-closed`, `data-open`
- `<ui-navigation-menu-trigger>` `[data-slot="navigation-menu-trigger"]`: `data-closed`, `data-disabled`, `data-open`
- `<ui-navigation-menu-content>` `[data-slot="navigation-menu-content"]`: `data-orientation=horizontal\|vertical`, `data-closed`, `data-open`, `data-starting-style`, `data-ending-style`, `data-motion=from-start\|from-end\|to-start\|to-end`, `data-side=top\|right\|bottom\|left`, `data-align=start\|center\|end`
- `<ui-navigation-menu-link>` `[data-slot="navigation-menu-link"]`: `data-has-icon`
- `<ui-navigation-menu-link-icon>` `[data-slot="navigation-menu-link-icon"]`: `data-mirror`
- `<ui-navigation-menu-viewport>` `[data-slot="navigation-menu-viewport"]`: `data-orientation=horizontal\|vertical`, `data-closed`, `data-open`, `data-starting-style`, `data-ending-style`, `data-side=top\|right\|bottom\|left`, `data-align=start\|center\|end`
- `<ui-navigation-menu-indicator>` `[data-slot="navigation-menu-indicator"]`: `data-orientation=horizontal\|vertical`, `data-closed`, `data-open`, `data-visible`

**pagination**

- `<ui-pagination-link>` `[data-slot="pagination-link"]`: `data-current`
- `<ui-pagination-previous>` `[data-slot="pagination-previous"]`: `data-disabled`
- `<ui-pagination-next>` `[data-slot="pagination-next"]`: `data-disabled`
- `<ui-pagination-first>` `[data-slot="pagination-first"]`: `data-disabled`
- `<ui-pagination-last>` `[data-slot="pagination-last"]`: `data-disabled`

**rating**

- ui-rating `[data-slot="rating"]`: `data-required`, `data-readonly`, `data-disabled`
- ui-rating-item `[data-slot="rating-item"]`: `data-filled`, `data-partial`, `data-checked`, `data-disabled`, `data-readonly`, `data-highlighted`

**progress**

- `<ui-progress>` `[data-slot="progress"]`: `data-indeterminate`, `data-progressing`, `data-complete`
- `<ui-progress-label>` `[data-slot="progress-label"]`: `data-indeterminate`, `data-progressing`, `data-complete`
- `<ui-progress-value>` `[data-slot="progress-value"]`: `data-indeterminate`, `data-progressing`, `data-complete`
- `<ui-progress-track>` `[data-slot="progress-track"]`: `data-indeterminate`, `data-progressing`, `data-complete`
- `<ui-progress-indicator>` `[data-slot="progress-indicator"]`: `data-indeterminate`, `data-progressing`, `data-complete`

**field**

- `<ui-field>` `[data-slot="field"]`: `data-disabled`, `data-invalid`
- `<ui-field-label>` `[data-slot="field-label"]`: `data-disabled`, `data-invalid`
- `<input>` `[data-slot="field-control"]`: `data-disabled`, `data-invalid`
- `<ui-field-description>` `[data-slot="field-description"]`: `data-disabled`, `data-invalid`
- `<ui-field-error>` `[data-slot="field-error"]`: `data-disabled`, `data-invalid`
- `<fieldset>` `[data-slot="field-set"]`: `data-disabled`
- `<legend>` `[data-slot="field-legend"]`: `data-disabled`
- `<ui-field-description>` in a `<ui-field-set>` `[data-slot="field-description"]`: `data-disabled`

**label**

- (no Data Attributes section in docs)

**input**

- `<ui-input>` `[data-slot="input"]`: `data-filled`, `data-disabled`, `data-readonly`, `data-required`
- `<ui-input-group>` `[data-slot="input-group"]`: `data-filled`, `data-disabled`, `data-readonly`
- `<ui-input-clear>` `[data-slot="input-clear"]`: `data-filled`, `data-disabled`, `data-readonly`

