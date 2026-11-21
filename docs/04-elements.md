# 04 - Elements: the behaviour layer

Status: specification. Law: `00-decisions.md` (D-007 to D-023, D-054, D-064, D-065). Where this document and the ledger disagree, the ledger wins; known disagreements are listed under "Ledger issues" at the end.

Every code block marked "complete" was typechecked, bundled and run in Chromium 157 on 2026-11-21. The sources are in `ripple/docs/research/spikes/elements-runtime/src/` at the same relative paths. An implementer MUST copy them, not rewrite them.

---

## 0. Scope

| This document owns | Owned elsewhere |
|---|---|
| Which mechanism backs each interactive component (section 1) | Component props, classes, parts, fixtures: `09-components-foundation.md`, `10-components-interactive.md`, `11-components-commerce.md`, `12-components-chrome-and-blueprints.md` |
| UI SDK usage rules and the kernel API Ripple relies on (section 2) | Contract rules, allow-list format, canonicalisation: `02-html-contract.md` |
| The runtime: lazy loader, Invoker Commands polyfill, opener listener, announcer (section 3) | CSS, including the generated `display` and `data-rp-js` rules: `03-styling-and-tokens.md` |
| Entry points, registration, loading per host, import map (sections 4 and 5) | Layer rules, package entry points, start order, build steps 1 to 6 and 8 to 10: `01-architecture.md` |
| The browser-bundle build mechanism (section 6) | Commerce elements, adapter, region refresh: `05-commerce.md` |
| `rp-*` authoring rules and the worked example (sections 7 and 8) | React `useElement`, Remix and Liquid binding rules: `06-bindings.md` |
| `rp-dialog`, `rp-carousel`, `rp-navigation-menu` (section 9) | Manifest keys, checker rules: `07-manifest-registry-cli.md` |
| Behaviour-bearing markup and no-JS behaviour per pattern (section 10) | Agent kit, bridge tool surface: `08-agent-kit-and-evals.md` |
| Events, state attributes, agent actions (sections 11 and 12) | Test harnesses: `13-testing.md`; Liquid theme files: `14-liquid-theme.md` |

Terms. "Root" is the custom element. "Part" is a native descendant marked `data-rp-part`. "Upgrade" is the moment a custom element is defined and connected. "Pre-upgrade" is the time before that; when JavaScript never runs it is permanent.

---

## 1. Which mechanism backs each component

This table applies D-007. No other mechanism may be used. "Chunk" names the file that carries the behaviour (section 4).

| Component (id) | Mechanism | Custom element | Chunk | Spec of the element |
|---|---|---|---|---|
| Dialog (`dialog`) | native `<dialog>` + Invoker Commands | `rp-dialog` | main | 9.1 |
| Drawer (`drawer`) | same as Dialog | `rp-dialog` | main | 9.1 |
| MobileNav (`mobile-nav`) | Drawer + nested `<details>` | `rp-dialog` | main | 9.1 |
| CartDrawer (`cart-drawer`) | Drawer + cart | `rp-dialog`, `rp-cart` | main | 9.1, `05-commerce.md` |
| ProductGallery (`product-gallery`) | Carousel + lightbox Dialog | `rp-carousel`, `rp-dialog` | main | 9.2, 9.1 |
| Popover (`popover`) | native `popover` attribute + `popovertarget` | none | none | 10.3 |
| LocaleSelector (`locale-selector`) | Popover + native form | none | none | 10.3 |
| Accordion (`accordion`) | native `<details>` / `<summary>` | none | none | 10.8 |
| Tabs (`tabs`) | UI SDK | `ui-tabs`, `ui-tabs-list`, `ui-tabs-tab`, `ui-tabs-panel` | `tabs` | 10.7 |
| Tooltip (`tooltip`) | UI SDK | `ui-tooltip`, `ui-tooltip-trigger`, `ui-tooltip-content` | `tooltip` | 10.4 |
| Toast (`toast`) | UI SDK + `toast()` helper | `ui-toast-region` | `toast` | 10.6 |
| Carousel (`carousel`) | CSS scroll-snap list + buttons | `rp-carousel` | main | 9.2 |
| FeaturedCollection (`featured-collection`) with `layout="carousel"` | Carousel | `rp-carousel` | main | 9.2 |
| QuantityInput (`quantity-input`) | native `<input type="number">` + buttons | `rp-quantity` | main | 8 |
| NavigationMenu (`navigation-menu`) | `<nav>` + links + `popover` panels | `rp-navigation-menu` | main | 9.3 |
| Input, Textarea, Select, Checkbox, RadioGroup, Switch, Label, Field | native controls | none | none | 10.10, 10.12 |
| CartLink, CartLines, CartSummary, CartNote, DiscountCode, ProductForm, VariantPicker, Filters, FilterChips, SortSelect, LiveForm, PredictiveSearch, ProductRecommendations | Hydrogen store / region refresh | `rp-cart`, `rp-product-form`, `rp-live`, `rp-predictive-search`, `rp-recommendations` | main (`ripple.js` only) | `05-commerce.md` |

Not in V1, with the replacement an implementer MUST use:

| Asked for | V1 answer | Source |
|---|---|---|
| Menu (`role="menu"`) | Popover containing links or buttons (10.5) | D-018 |
| Combobox, autocomplete | Fixed list of options: native `<select>` (10.10). Search suggestions: PredictiveSearch (`11-components-commerce.md`) | D-014, D-048, ledger section 11 item 7 |
| Slider | No slider component. A price filter is PriceRange (`11-components-commerce.md`) | ledger section 11 item 7 |
| Custom select, listbox | native `<select>` | D-014 |

The only custom element tags that may appear in any contract are: `rp-dialog`, `rp-carousel`, `rp-quantity`, `rp-navigation-menu`, `rp-cart`, `rp-product-form`, `rp-live`, `rp-predictive-search`, `rp-recommendations`, `ui-tabs`, `ui-tabs-list`, `ui-tabs-tab`, `ui-tabs-panel`, `ui-tooltip`, `ui-tooltip-trigger`, `ui-tooltip-content`, `ui-toast-region`. The tags `ui-toast`, `ui-toast-title`, `ui-toast-description`, `ui-toast-action`, `ui-toast-close`, `ui-tooltip-arrow`, `ui-tabs-indicator` and `ui-tabs-tab-icon` are created or accepted by UI SDK at runtime; a server MUST NOT print them.

---

## 2. UI SDK usage

### 2.1 Rules

1. `@ui-sdk/core` and `@ui-sdk/web` are pinned to exactly `0.1.0-beta.14` (D-022).
2. Ripple source MUST import only these specifiers, and only from these files:

| Specifier | Names used | Allowed in |
|---|---|---|
| `@ui-sdk/core` | `definePrimitive`, `createChange` | `src/elements/rp-*.ts`, `src/commerce/rp-*.ts` |
| `@ui-sdk/core` | `announce`, `prepareAnnouncements` | `src/runtime/announcer.ts` only |
| `@ui-sdk/web` | `createParts` | `src/elements/rp-*.ts`, `src/commerce/rp-*.ts` |
| `@ui-sdk/web` | `toast` | `src/elements/ui-toast.ts` only |
| `@ui-sdk/web/tabs` | none (side-effect import: defines the Tabs tags) | `src/elements/ui-tabs.ts` only |
| `@ui-sdk/web/tooltip` | none (side-effect import) | `src/elements/ui-tooltip.ts` only |
| `@ui-sdk/web/toast` | none (side-effect import) | `src/elements/ui-toast.ts` only |
| `@ui-sdk/web/agent` | `createAgent`, `agentTools`, `registerTools` | `src/agent/index.ts` only |

3. `@ui-sdk/react`, `@ui-sdk/core/web.css`, `@ui-sdk/core/internal/*` and the upstream autoloader MUST NOT be imported (D-022).
4. A page MUST have exactly one copy of `@ui-sdk/core`. Section 6 specifies how the browser bundles achieve this; test E-20 checks it.
5. A refresh, morph or re-render MUST replace a whole `ui-*` root or change nothing inside it (D-022 item 5). `rp-*` roots have no such restriction (section 7 rule R-5).

### 2.2 Kernel facts Ripple relies on

Each row was read in the pinned source and exercised by the spike unless marked UNVERIFIED.

| Fact | Evidence |
|---|---|
| `definePrimitive({ name, options, state, api, agent, slots })` returns a primitive. `options` maps an option name to `"boolean"`, `"number"`, `"string"` or `"callback"`. `state(options)` returns the initial state object. `api(context)` returns the method object. | `uisdk/apps/docs/content/docs/core/kernel/define-a-primitive.mdx`; spike sources |
| A state key `X` is initialised from the option `defaultX`. The element attribute `default-x` (or the attribute `x` when listed under `state` in `createParts`) feeds that option. | same; `uisdk/packages/web/src/define-element.ts` |
| `createChange(context)` returns `change(key, value, { reason, event })`. It dispatches the event named `<key>change` (lowercase) on the root, non-bubbling and cancelable, calls the `on<Key>Change` option, writes the state when the event was not canceled, and returns `true` when the change was accepted. | spike `results-test.txt` lines "quantity: increment", "quantity: canceled valuechange" |
| `event.detail` of a change event has `value`, `reason` and `source`. `source` is one of `mouse`, `touch`, `pen`, `keyboard`, `virtual`, `programmatic`, `agent`. | `uisdk/packages/core/src/foundation/kernel/details.ts` |
| `context.store.get()` returns the state; `context.store.set(partial)` writes state with no event. `context.element("root")` returns the root element or `undefined`. `context.onDestroy(fn)` registers cleanup. | spike sources |
| A slot is `slot({ on: { <dom event>: (event, { el, api }) => void }, bind: (el, part) => cleanup })`. `on` listeners are attached to the part's element; `bind` runs when the element connects and its return value runs when it disconnects; `part.api` is the method object. | spike sources |
| `createParts(primitive, { root: { tag, display, api: [names], state: { key: { get, set } } } })` defines the custom element. `api` lists the methods exposed as `element.api`; methods not listed are not reachable from outside. Each `state` key becomes a live JavaScript property on the element. | `uisdk/packages/web/src/define-element.ts`; spike line "quantity: api exposes only listed methods" |
| Defining only a `root` part works: upgrade, events, live properties, descendant replacement, disconnect and reconnect, agent bridge. | spike `results-test.txt` (52 checks), `results-dialog2.txt` (5 checks). Chromium only; WebKit and Gecko UNVERIFIED (SPIKE-04) |
| The agent bridge lists a primitive only when its root passes `element.checkVisibility()`. A root with `display: contents` is NOT listed. | `uisdk/packages/core/src/page/agent/agent.ts`; spike README |
| `createParts` injects a `<style id="ui-sdk-web-1">` element into `<head>` holding the `display` values. This write is outside every component root. | spike `results-test.txt` line "mutations outside roots" |
| Behaviour of `createParts` when imported under Node (no `customElements`). | UNVERIFIED. `<pkg>/elements` MUST be imported only by client code (`01-architecture.md`, entry point table). |

---

## 3. The runtime (`src/runtime/`)

The runtime is code that runs once per page. It consists of exactly five files. `src/runtime/**` MUST import only `src/runtime/**`, `src/identity.ts` and `@ui-sdk/core` (`01-architecture.md`, import rules).

| File | Responsibility | Decision |
|---|---|---|
| `index.ts` | Starts the runtime once; exports `guard`, `announce`, `registerLazy`, `loadChunk`, `startLoader` | `01-architecture.md` 3.3 |
| `loader.ts` | Lazy chunk registry and document scan | D-054 item 2 |
| `commands-polyfill.ts` | Invoker Commands fallback | D-008 item 3 |
| `opener.ts` | The one document-level click listener for `a[data-rp-open]` | D-009 |
| `announcer.ts` | `announce()` | D-008 item 7, D-066 item 5 |

### 3.1 `src/runtime/index.ts` (complete)

```ts
// Runtime start (01-architecture.md section 3.3 step 1). Importing this module
// starts the runtime once. It does nothing on a server.
import { startAnnouncer } from "./announcer"
import { installCommandsPolyfill } from "./commands-polyfill"
import { installOpener } from "./opener"

// Runs one start-up step. A step that throws is logged and never stops the others.
function guard(step: string, run: () => void): void {
  try {
    run()
  } catch (error) {
    console.error(`[ripple] ${step} failed`, error)
  }
}

declare global {
  interface Window {
    rpRuntime?: boolean
  }
}

if (typeof document !== "undefined" && !window.rpRuntime) {
  window.rpRuntime = true
  guard("commands polyfill", installCommandsPolyfill)
  guard("opener listener", installOpener)
  guard("announcer", () => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startAnnouncer, { once: true })
    } else {
      startAnnouncer()
    }
  })
}

export { guard }
export { announce, type AnnounceOptions } from "./announcer"
export { loadChunk, registerLazy, startLoader } from "./loader"
```

Rules:

1. Importing the module starts the runtime. There is no `start()` function to call.
2. `window.rpRuntime` makes the start idempotent even if two copies of the module are loaded by mistake.
3. Each step runs inside `guard`, so one failing step never stops another (`01-architecture.md` 3.3).
4. On a server (`typeof document === "undefined"`) the module does nothing.

### 3.2 `src/runtime/loader.ts` (complete)

```ts
// Lazy loader for the ui-* families (00-decisions D-054 item 2).
type LazyChunk = { tag: string; load: () => Promise<unknown>; promise?: Promise<unknown> }

const chunks = new Map<string, LazyChunk>()
let observing = false

// Registers a chunk: `tag` is the root tag whose presence in the document loads it.
function registerLazy(name: string, tag: string, load: () => Promise<unknown>): void {
  if (!chunks.has(name)) chunks.set(name, { tag, load })
}

// Loads a chunk once. Resolves to the chunk's module, or to undefined when it failed.
function loadChunk(name: string): Promise<unknown> {
  const chunk = chunks.get(name)
  if (!chunk) return Promise.resolve(undefined)
  chunk.promise ??= chunk.load().catch((error: unknown) => {
    chunk.promise = undefined
    console.error(`[ripple] chunk "${name}" failed to load`, error)
    return undefined
  })
  return chunk.promise
}

function scan(root: ParentNode): void {
  for (const [name, chunk] of chunks) {
    if (chunk.promise) continue
    const self = root instanceof Element && root.localName === chunk.tag
    if (self || root.querySelector(chunk.tag)) void loadChunk(name)
  }
}

function startLoader(): void {
  if (observing || typeof document === "undefined") return
  observing = true
  const begin = () => {
    scan(document)
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) scan(node)
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true })
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", begin, { once: true })
  } else {
    begin()
  }
}

export { loadChunk, registerLazy, startLoader }
```

Behaviour:

1. `registerLazy(name, tag, load)` records a chunk. The first registration of a name wins.
2. `startLoader()` scans the document at `DOMContentLoaded` (or immediately when the document is already parsed) and then observes `document.documentElement` for added nodes. When an element with a registered tag is present or is inserted, the chunk is imported once.
3. A failed import is logged with `console.error`, resolves to `undefined`, and is retried the next time the chunk is requested. No other element is affected.
4. The loader never removes or changes any node.

### 3.3 `src/runtime/commands-polyfill.ts` (complete)

```ts
// Invoker Commands fallback (00-decisions D-008 item 3). Ported from
// ripple/theme/snippets/command-polyfill.liquid.
type CommandEventLike = Event & { command: string; source: Element }

declare global {
  interface Window {
    rpCommandsPolyfill?: boolean
  }
}

function runCommand(target: HTMLElement, command: string): void {
  if (command === "show-modal") {
    if (target instanceof HTMLDialogElement && !target.open) target.showModal()
  } else if (command === "close") {
    if (target instanceof HTMLDialogElement && target.open) target.close()
  } else if (command === "show-popover") {
    if (target.popover && !target.matches(":popover-open")) target.showPopover()
  } else if (command === "hide-popover") {
    if (target.popover && target.matches(":popover-open")) target.hidePopover()
  } else if (command === "toggle-popover") {
    if (target.popover) target.togglePopover()
  }
}

function installCommandsPolyfill(): void {
  if (typeof document === "undefined") return
  if ("commandForElement" in HTMLButtonElement.prototype) return
  if (window.rpCommandsPolyfill) return
  window.rpCommandsPolyfill = true
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented) return
    const origin = event.target instanceof Element ? event.target : null
    const button = origin?.closest<HTMLButtonElement>("button[commandfor]")
    if (!button || button.disabled) return
    const target = document.getElementById(button.getAttribute("commandfor") ?? "")
    if (!target) return
    const command = button.getAttribute("command") ?? ""
    const commandEvent = Object.assign(new Event("command", { bubbles: false, cancelable: true }), {
      command,
      source: button,
    }) as CommandEventLike
    if (!target.dispatchEvent(commandEvent)) return
    if (!command.startsWith("--")) runCommand(target, command)
  })
}

export { installCommandsPolyfill }
```

Behaviour:

1. No-op when the browser implements Invoker Commands (`"commandForElement" in HTMLButtonElement.prototype`) or when another copy is installed (`window.rpCommandsPolyfill`).
2. One `click` listener on `document`. For a click inside an enabled `button[commandfor]` whose target id exists, it dispatches an event named `command` on the target (not bubbling, cancelable, with properties `command` and `source`), and, unless that event was canceled, performs the built-in command.
3. Supported built-in commands: `show-modal`, `close`, `show-popover`, `hide-popover`, `toggle-popover`. A command that starts with `--` only dispatches the event. Any other value does nothing.
4. `show-modal` on an open dialog and `close` on a closed dialog do nothing (same as native).
5. The polyfill does not set `aria-expanded` and does not implement `request-close`.

Liquid additionally prints this classic inline script in `snippets/rp-head.liquid`, before the module script (D-054 item 7), so that commands work while the module is loading. It is the same logic in ES5 syntax. `14-liquid-theme.md` MUST embed it byte for byte (complete):

```html
<script>
(function () {
  if ("commandForElement" in HTMLButtonElement.prototype || window.rpCommandsPolyfill) return;
  window.rpCommandsPolyfill = true;
  document.addEventListener("click", function (event) {
    if (event.defaultPrevented) return;
    var origin = event.target instanceof Element ? event.target : null;
    var button = origin && origin.closest("button[commandfor]");
    if (!button || button.disabled) return;
    var target = document.getElementById(button.getAttribute("commandfor") || "");
    if (!target) return;
    var command = button.getAttribute("command") || "";
    var commandEvent = new Event("command", { bubbles: false, cancelable: true });
    commandEvent.command = command;
    commandEvent.source = button;
    if (!target.dispatchEvent(commandEvent)) return;
    if (command === "show-modal") { if (target.showModal && !target.open) target.showModal(); }
    else if (command === "close") { if (target.close && target.open) target.close(); }
    else if (command === "show-popover") { if (target.showPopover && !target.matches(":popover-open")) target.showPopover(); }
    else if (command === "hide-popover") { if (target.hidePopover && target.matches(":popover-open")) target.hidePopover(); }
    else if (command === "toggle-popover") { if (target.togglePopover) target.togglePopover(); }
  });
})();
</script>
```

The two copies coordinate through `window.rpCommandsPolyfill`: whichever runs first installs the listener; the other does nothing.

### 3.4 `src/runtime/opener.ts` (complete)

```ts
// Opener pattern for overlays with a page equivalent (00-decisions D-009).
type DialogHost = HTMLElement & { api?: { open: (event?: Event) => boolean } }

const OPENER = "a[data-rp-open]"

function hostOf(link: Element): { dialog: HTMLDialogElement; host: DialogHost } | null {
  const dialog = document.getElementById(link.getAttribute("data-rp-open") ?? "")
  if (!(dialog instanceof HTMLDialogElement)) return null
  const host = dialog.parentElement as DialogHost | null
  if (!host || host.localName !== "rp-dialog" || !host.matches(":defined") || !host.api) return null
  return { dialog, host }
}

// The two attributes on the upgrade allow-list. Written only when the dialog can open.
function markOpeners(root: ParentNode): void {
  for (const link of root.querySelectorAll(OPENER)) {
    const found = hostOf(link)
    if (!found) continue
    if (link.getAttribute("aria-haspopup") !== "dialog") link.setAttribute("aria-haspopup", "dialog")
    if (link.getAttribute("aria-controls") !== found.dialog.id) link.setAttribute("aria-controls", found.dialog.id)
  }
}

let installed = false

function installOpener(): void {
  if (installed || typeof document === "undefined") return
  installed = true
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const origin = event.target instanceof Element ? event.target : null
    const link = origin?.closest(OPENER)
    if (!link) return
    const found = hostOf(link)
    if (!found) return
    event.preventDefault()
    found.host.api!.open(event)
  })
  const mark = () => markOpeners(document)
  customElements.whenDefined("rp-dialog").then(() => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mark, { once: true })
    else mark()
    new MutationObserver((records) => {
      if (records.some((record) => record.addedNodes.length > 0)) mark()
    }).observe(document.documentElement, { childList: true, subtree: true })
  })
}

export { installOpener }
```

Behaviour (D-009):

1. One `click` listener on `document`. It acts only when ALL of these hold: the event is not already canceled; `event.button === 0`; none of Meta, Ctrl, Shift, Alt is held; the click is inside an `a[data-rp-open]`; the attribute value is the id of a `<dialog>` whose parent is a defined `rp-dialog`.
2. When it acts, it calls `event.preventDefault()` and `host.api.open(event)`. `rp-dialog` then dispatches `openchange` with reason `trigger-press` and restores focus to the link when the dialog closes.
3. In every other case the link navigates to its `href`. This is the complete no-JS and failure behaviour.
4. After `rp-dialog` is defined, and after any node insertion, the runtime sets `aria-haspopup="dialog"` and `aria-controls="<dialog id>"` on every such link whose dialog can open. These two attribute writes are the global allow-list entry 1 of `02-html-contract.md` section 7.3. No other attribute is written.

### 3.5 `src/runtime/announcer.ts` (complete)

```ts
// Announcements (00-decisions D-008 item 7, D-066 item 5).
import { announce as kernelAnnounce, prepareAnnouncements } from "@ui-sdk/core"

type AnnounceOptions = { priority?: "polite" | "assertive"; from?: Element | null }

// Content outside an open modal dialog is inert, so the page-level live
// regions are silent while one is open. A caller inside an open modal dialog
// is announced through that dialog's own Announcer part instead.
function announce(text: string, options: AnnounceOptions = {}): void {
  if (typeof document === "undefined" || text === "") return
  const dialog = options.from?.closest("dialog") ?? null
  const region =
    dialog && dialog.matches(":modal") ? dialog.querySelector('[data-rp-part="status"]') : null
  if (!region) {
    kernelAnnounce(text, { priority: options.priority ?? "polite" })
    return
  }
  region.textContent = ""
  setTimeout(() => {
    region.textContent = text
  }, 30)
}

function startAnnouncer(): void {
  if (typeof document !== "undefined") prepareAnnouncements(document)
}

export { announce, startAnnouncer, type AnnounceOptions }
```

Rules:

1. Every Ripple element MUST announce through this function, never by importing `announce` from `@ui-sdk/core` directly, and MUST pass `from` (an element at the place of the change).
2. When `from` is inside an open modal `<dialog>` that contains an element marked `data-rp-part="status"`, the text is written into that element (the dialog's Announcer part, D-008 item 7). The element MUST be printed by the server, empty, as `<div role="status" data-rp-part="status"></div>` (class and visually-hidden styling: Announcer in `09-components-foundation.md`).
3. In every other case the text goes to the kernel's page-level live regions. `startAnnouncer()` creates them at start so that the first announcement is spoken.
4. A dialog whose content can raise announcements (CartDrawer, any Drawer that contains QuantityInput or a commerce form) MUST contain a `data-rp-part="status"` element. Without it, announcements raised inside the open dialog go to the page-level regions, which are inert while the dialog is modal.

---

## 4. Entry points and registration

### 4.1 Source entry points

| Entry | Source | What importing it does | Exports |
|---|---|---|---|
| `<pkg>/elements` | `src/elements/index.ts` | Starts the runtime, defines `rp-dialog`, `rp-carousel`, `rp-quantity`, `rp-navigation-menu`, registers the three lazy chunks, starts the loader | `toast`, `ToastOptions`, `announce`, `AnnounceOptions` |
| (internal chunk) | `src/elements/ui-tabs.ts` | Defines the Tabs tags | none |
| (internal chunk) | `src/elements/ui-tooltip.ts` | Defines the Tooltip tags | none |
| (internal chunk) | `src/elements/ui-toast.ts` | Defines the Toast tags | `toast` (UI SDK's) |
| `<pkg>/agent` | `src/agent/index.ts` | Nothing until the caller invokes `createAgent` | `createAgent`, `agentTools`, `registerTools` |
| `<pkg>/commerce` | `src/commerce/index.ts` | `05-commerce.md` | `05-commerce.md` |

`src/elements/index.ts` (complete):

```ts
// <pkg>/elements. Import order is the start-up order (01-architecture.md 3.3):
// 1. runtime, 2. the four rp-* elements, 3. lazy chunk registration.
import "../runtime/index"
import "./rp-dialog"
import "./rp-carousel"
import "./rp-quantity"
import "./rp-navigation-menu"
import { guard, loadChunk, registerLazy, startLoader } from "../runtime/index"

// The subset of the UI SDK toast options that Ripple supports.
type ToastOptions = {
  id?: string
  description?: string
  type?: "default" | "success" | "error" | "warning" | "info" | "loading"
  duration?: number
  priority?: "polite" | "assertive"
}
type ToastModule = { toast: (title: string, options?: ToastOptions) => unknown }

guard("lazy chunks", () => {
  registerLazy("tabs", "ui-tabs", () => import("./ui-tabs"))
  registerLazy("tooltip", "ui-tooltip", () => import("./ui-tooltip"))
  registerLazy("toast", "ui-toast-region", () => import("./ui-toast"))
  startLoader()
})

// Shows a toast in the page's <ui-toast-region>. Loads the toast chunk on first use.
async function toast(title: string, options?: ToastOptions): Promise<void> {
  const chunk = (await loadChunk("toast")) as ToastModule | undefined
  chunk?.toast(title, options)
}

export { toast, type ToastOptions }
export { announce, type AnnounceOptions } from "../runtime/index"
```

`src/elements/ui-tabs.ts` (complete):

```ts
import "@ui-sdk/web/tabs"
```

`src/elements/ui-tooltip.ts` (complete):

```ts
import "@ui-sdk/web/tooltip"
```

`src/elements/ui-toast.ts` (complete):

```ts
import "@ui-sdk/web/toast"
export { toast } from "@ui-sdk/web"
```

`src/agent/index.ts` (complete):

```ts
export { agentTools, createAgent, registerTools } from "@ui-sdk/web/agent"
```

Registration rules:

1. The order of the import statements in `src/elements/index.ts` IS the start order of `01-architecture.md` 3.3 steps 1 to 3 and MUST NOT be changed.
2. Each `rp-*` module defines its element as a side effect of import, inside its own `try`/`catch` (section 7 rule R-9). One element that fails to define MUST NOT stop the others.
3. The three `import("./ui-*")` expressions MUST stay literal dynamic imports. The bundlers of section 6 and of bundled React apps turn each into a separate file.
4. The package `sideEffects` field MUST list the built files of `src/runtime/index.ts`, `src/elements/*.ts` and `src/commerce/*.ts`, so that a bundler does not drop the side-effect imports (`01-architecture.md` owns `package.json`).
5. A lazy chunk is requested only when its root tag is in the document. A page with no `ui-tabs`, `ui-tooltip` or `ui-toast-region` requests only the main file (verified: spike line "loader: page without ui-* tags loads only the main file").
6. The Toast chunk is also loaded by the first `toast()` call.

### 4.2 Browser files

Built by section 6 into `pkg/browser/`. "Imports" are static imports between files.

| File | Content | Imports |
|---|---|---|
| `ripple.js` | UI SDK kernel, runtime, the four non-commerce `rp-*` elements, commerce (`05-commerce.md`) | platform specifiers only |
| `ripple-tabs.js` | Tabs family | `./ripple.js` |
| `ripple-tooltip.js` | Tooltip family | `./ripple.js`, `./ripple-shared.js` |
| `ripple-toast.js` | Toast family and UI SDK `toast` | `./ripple.js`, `./ripple-shared.js` |
| `ripple-shared.js` | UI SDK code used by both Tooltip and Toast (presence and popup positioning) | `./ripple.js` |
| `ripple-agent.js` | Agent bridge | `./ripple.js` |
| `ripple.elements.js` and `ripple.elements-tabs.js`, `ripple.elements-tooltip.js`, `ripple.elements-toast.js`, `ripple.elements-shared.js`, `ripple.elements-agent.js` | The same set without commerce and Hydrogen | same pattern, with `./ripple.elements.js` |

Rules:

1. A page MUST load exactly one of `ripple.js` or `ripple.elements.js`, exactly once. Loading both, or one of them under two different URLs, creates two kernels and is a defect.
2. The files of one set MUST be deployed in the same directory and MUST keep their names. They import each other by relative path.
3. The public exports of a main file are: every export of `<pkg>/elements`, every export of `<pkg>/commerce` (`ripple.js` only), and `loadAgent`. `loadAgent()` returns a promise of the module `{ createAgent, agentTools, registerTools }`. Exports whose names are one or two characters long are internal links between files and MUST NOT be used.
4. `ripple-shared.js` is not in D-054. It is a ledger issue (L-1).

Measured sizes (gzip level 9, spike build, `ripple.js` built with a stand-in for commerce):

| File | gzip bytes | Budget (D-064) |
|---|---|---|
| `ripple.elements.js` | 22,306 | 30,000 |
| `ripple.elements-tabs.js` | 6,602 | 10,000 |
| `ripple.elements-tooltip.js` | 11,521 | 22,000 |
| `ripple.elements-toast.js` | 10,328 | 15,000 |
| `ripple.elements-shared.js` | 9,171 | none (L-1) |
| `ripple.elements-agent.js` | 12,985 | 13,000 |

---

## 5. Loading per host

### 5.1 `html` host

One tag in `<head>`. The directory is the public directory chosen by `ripple init` (`06-bindings.md`); the examples use `/ripple/`.

```html
<link rel="stylesheet" href="/ripple/ripple.css">
<script type="module" src="/ripple/ripple.js"></script>
```

A page without commerce uses `src="/ripple/ripple.elements.js"`. No import map is needed: chunks resolve relative to the main file.

Page code that calls Ripple functions imports the SAME URL as the script tag:

```html
<script type="module">
  import { toast } from "/ripple/ripple.js"
  document.querySelector("#saved").addEventListener("click", () => toast("Saved"))
</script>
```

Optional import map, only for page code that prefers a bare specifier. The mapped URL MUST be character-for-character identical to the `src` of the script tag, and the map MUST come before any module script:

```html
<script type="importmap">
  { "imports": { "ripple": "/ripple/ripple.js" } }
</script>
<script type="module" src="/ripple/ripple.js"></script>
<script type="module">
  import { toast } from "ripple"
</script>
```

### 5.2 `remix` host

The same files, copied by `ripple init` to `public/ripple/` (D-054 item 4), loaded by the same script tag. Where the tag is placed in the document component, and its order relative to Remix's own scripts, is owned by `06-bindings.md`. Elements need no notification of a morph: they read the DOM at event time (section 7 rule R-5).

### 5.3 `react` host (bundled apps)

In the client entry, once:

```ts
import "<pkg>/elements"
import "<pkg>/commerce"
```

The app's bundler turns the three `import("./ui-*")` expressions into its own chunks, and the single installed copy of `@ui-sdk/core` is shared by all of them. The app MUST NOT also load a file from `browser/`.

### 5.4 `liquid` host

Files are `assets/ripple.js`, `assets/ripple-tabs.js`, `assets/ripple-tooltip.js`, `assets/ripple-toast.js`, `assets/ripple-shared.js`, `assets/ripple-agent.js`. They are the `ripple` set with every cross-file import rewritten to a bare specifier (section 6.3), because the URL of a theme asset is not known at build time.

`snippets/rp-import-map-entries.liquid` MUST add exactly these six entries to the theme's single import map. How the snippet is included in the map, and the comma that joins these entries to the theme's own, are owned by `14-liquid-theme.md`:

```liquid
"ripple": "{{ 'ripple.js' | asset_url }}",
"ripple/tabs": "{{ 'ripple-tabs.js' | asset_url }}",
"ripple/tooltip": "{{ 'ripple-tooltip.js' | asset_url }}",
"ripple/toast": "{{ 'ripple-toast.js' | asset_url }}",
"ripple/shared": "{{ 'ripple-shared.js' | asset_url }}",
"ripple/agent": "{{ 'ripple-agent.js' | asset_url }}"
```

`snippets/rp-head.liquid` prints, in this order (D-054 item 7): the stylesheet tag; `{% render 'rp-tokens' %}`; the inline polyfill of section 3.3; then:

```liquid
<script type="module" src="{{ 'ripple.js' | asset_url }}"></script>
```

Rules:

1. The `src` above and the import-map value of `ripple` are the output of the same filter on the same file name, so they are the same URL and the browser creates one module instance. Verified: `ripple/docs/research/spikes/elements-runtime/results-liquid.txt` (one request per file, one kernel).
2. Theme code that calls Ripple functions MUST use `import { toast } from "ripple"`, never the asset URL.
3. No asset may contain a relative import. Section 6.3 fails the build when one remains.

### 5.5 What each host gets before upgrade

In every host the server response already contains the complete markup of section 10. Until the main file has run, and for ever when it never runs, behaviour is the "Without JavaScript" row of each pattern.

---

## 6. Building the browser files

`01-architecture.md` section 7 step 7 delegates the mechanism to this section. The mechanism is one Rollup build per main file, in `src/gen/browser-bundles.ts`, called by `src/gen/build.ts`.

### 6.1 Why Rollup and not esbuild

esbuild's `splitting: true` moves code shared by the main file and its chunks into hash-named shared chunks and cannot be told to keep the kernel in the main file. D-054 requires that chunks import the kernel from the main file. Rollup places every module that the entry reaches statically in the entry file and lets dynamically imported chunks import from it (`preserveEntrySignatures: "allow-extension"`). This was tried both ways in the spike; only the Rollup build met D-054 and the budgets of D-064.

Dev dependencies added by this section, pinned exactly (versions used by the spike): `rollup` 4.24.0, `@rollup/plugin-node-resolve` 15.3.0, `@rollup/plugin-terser` 0.4.4. They are imported only by `src/gen/browser-bundles.ts`. This extends the import rule for `src/gen/**` in `01-architecture.md` (ledger issue L-3).

Minification uses terser, not esbuild's minifier: with esbuild's minifier the agent file is 13.9 kB gzip, above its 13 kB budget; with terser it is 12.98 kB.

### 6.2 `src/gen/browser-bundles.ts` (complete)

```ts
// Builds the browser bundles (04-elements.md section 7).
// For each main entry it writes <main>.js, <main>-tabs.js, <main>-tooltip.js,
// <main>-toast.js, <main>-agent.js and at most one <main>-shared.js.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { gzipSync } from "node:zlib"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import terser from "@rollup/plugin-terser"
import { transform } from "esbuild"
import { rollup, type OutputChunk, type Plugin } from "rollup"

type BrowserBundleOptions = {
  /** Main bundle base name -> source files whose exports the bundle re-exports, in order. */
  mains: Record<string, string[]>
  /** Source file of the agent entry, reached only by `loadAgent()` or by loading <main>-agent.js. */
  agentEntry: string
  /** Directory for the relative-import form (pkg/browser). */
  outDir: string
  /** Directory for the bare-specifier form (pkg/registry/liquid/assets). */
  liquidDir: string
  /** The main bundle that the Liquid form is made from. */
  liquidMain: string
  /** Specifiers left as imports (platform-provided modules). */
  external?: string[]
  /** Replacement source for src/identity.ts (01-architecture.md section 7 step 3). */
  identity?: { file: string; code: string }
}

type BundleSize = { file: string; raw: number; gzip: number }

// Base name of the source file of each lazy chunk -> output suffix.
const CHUNK_NAMES: Record<string, string> = {
  "ui-tabs": "tabs",
  "ui-tooltip": "tooltip",
  "ui-toast": "toast",
  index: "agent", // src/agent/index.ts
}
const HOIST = "\0ripple-hoist"
const ENTRY = "\0ripple-entry:"

function stripTypes(identity?: { file: string; code: string }): Plugin {
  const identityFile = identity ? resolve(identity.file) : ""
  return {
    name: "ripple-strip-types",
    load(id) {
      return identity && id === identityFile ? identity.code : null
    },
    async transform(code, id) {
      if (!id.endsWith(".ts")) return null
      const out = await transform(code, { loader: "ts", target: "es2022" })
      return { code: out.code, map: null }
    },
  }
}

// The virtual entry of a main bundle. It re-exports every source file of the
// bundle, exports `loadAgent`, and imports every module in `hoisted`, so that
// those modules are emitted in the main file.
function entry(main: string, sources: string[], agentEntry: string, hoisted: Set<string>): Plugin {
  const id = ENTRY + main
  return {
    name: "ripple-entry",
    resolveId(source) {
      return source === id || source === HOIST ? source : null
    },
    load(loaded) {
      if (loaded === HOIST) {
        return [...hoisted].map((module) => `import ${JSON.stringify(module)}`).join("\n")
      }
      if (loaded !== id) return null
      return [
        `import ${JSON.stringify(HOIST)}`,
        ...sources.map((file) => `export * from ${JSON.stringify(resolve(file))}`),
        `export const loadAgent = () => import(${JSON.stringify(resolve(agentEntry))})`,
      ].join("\n")
    },
    transform(code, transformed) {
      return hoisted.has(transformed) ? { code, map: null, moduleSideEffects: "no-treeshake" } : null
    },
  }
}

async function buildMain(main: string, sources: string[], options: BrowserBundleOptions): Promise<void> {
  const hoisted = new Set<string>()
  const named = new Set([main, ...Object.keys(CHUNK_NAMES)])
  for (let pass = 1; pass <= 8; pass++) {
    const build = await rollup({
      input: { [main]: ENTRY + main },
      external: options.external ?? [],
      preserveEntrySignatures: "allow-extension",
      onwarn(warning, warn) {
        if (warning.code !== "CIRCULAR_DEPENDENCY") warn(warning)
      },
      plugins: [entry(main, sources, options.agentEntry, hoisted), stripTypes(options.identity), nodeResolve({ extensions: [".ts", ".js", ".mjs"] }), terser()],
    })
    const output = {
      dir: options.outDir,
      format: "es" as const,
      entryFileNames: "[name].js",
      chunkFileNames: (chunk: { name: string }) =>
        CHUNK_NAMES[chunk.name] ? `${main}-${CHUNK_NAMES[chunk.name]}.js` : `${main}-shared.js`,
    }
    const generated = await build.generate(output)
    const shared = generated.output
      .filter((file): file is OutputChunk => file.type === "chunk" && !named.has(file.name))
      .sort((a, b) => b.code.length - a.code.length)
    if (shared.length <= 1) {
      await build.write(output)
      await build.close()
      return
    }
    // Keep the largest shared chunk as <main>-shared.js; move the others into the main file.
    for (const chunk of shared.slice(1)) for (const id of Object.keys(chunk.modules)) hoisted.add(id)
    await build.close()
  }
  throw new Error(`${main}: more than one shared chunk remains after 8 passes`)
}

// Liquid assets may not import each other by relative path. Rewrites
// "./<main>.js" to "ripple" and "./<main>-<chunk>.js" to "ripple/<chunk>",
// and names the files ripple.js and ripple-<chunk>.js.
function writeLiquidForm(options: BrowserBundleOptions): void {
  const main = options.liquidMain
  mkdirSync(options.liquidDir, { recursive: true })
  const escaped = main.replace(/\./g, "\\.")
  const specifier = new RegExp(`(["'])\\./${escaped}(?:-([a-z]+))?\\.js\\1`, "g")
  for (const file of readdirSync(options.outDir)) {
    if (file !== `${main}.js` && !file.startsWith(`${main}-`)) continue
    const code = readFileSync(join(options.outDir, file), "utf8").replace(
      specifier,
      (_match: string, quote: string, chunk: string | undefined) =>
        chunk ? `${quote}ripple/${chunk}${quote}` : `${quote}ripple${quote}`
    )
    if (/(?:from|import)\s*\(?\s*["']\.{1,2}\//.test(code)) {
      throw new Error(`${file}: a relative import is left after the rewrite`)
    }
    writeFileSync(join(options.liquidDir, file.replace(main, "ripple")), code)
  }
}

async function buildBrowserBundles(options: BrowserBundleOptions): Promise<BundleSize[]> {
  mkdirSync(options.outDir, { recursive: true })
  for (const [main, sources] of Object.entries(options.mains)) await buildMain(main, sources, options)
  writeLiquidForm(options)
  return readdirSync(options.outDir)
    .filter((file) => file.endsWith(".js"))
    .sort()
    .map((file) => {
      const bytes = readFileSync(join(options.outDir, file))
      return { file, raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length }
    })
}

export { buildBrowserBundles, type BrowserBundleOptions, type BundleSize }
```

### 6.3 How it works

1. For each main file the build creates a virtual entry module that re-exports every source of the bundle and exports `loadAgent`, a function that dynamically imports the agent entry. No file is added to `src/` for it.
2. Everything the entry reaches by static import (the kernel, the runtime, every `rp-*` element, commerce) is emitted in `<main>.js`.
3. Each dynamic import becomes a chunk named by `CHUNK_NAMES`: `ui-tabs` to `<main>-tabs.js`, `ui-tooltip` to `<main>-tooltip.js`, `ui-toast` to `<main>-toast.js`, the agent entry to `<main>-agent.js`.
4. Code used by two or more chunks but not by the main file would become extra shared chunks. The build repeats (at most 8 passes): it keeps the largest shared chunk as `<main>-shared.js` and marks the modules of every other shared chunk as "hoisted", which makes the main file import them, so they are emitted in `<main>.js`. With the pinned UI SDK version the result is one shared file, used by Tooltip and Toast.
5. `writeLiquidForm` copies the `liquidMain` set to `liquidDir`, renames `<main>*.js` to `ripple*.js`, rewrites `"./<main>.js"` to `"ripple"` and `"./<main>-<chunk>.js"` to `"ripple/<chunk>"`, and throws when a relative import remains.
6. The function returns the raw and gzip size of every file in `outDir`; `src/gen/build.ts` compares them with `size-budget.json` (`13-testing.md`).

### 6.4 The call in `src/gen/build.ts`

```ts
import { buildBrowserBundles } from "./browser-bundles"

const sizes = await buildBrowserBundles({
  mains: {
    ripple: ["src/elements/index.ts", "src/commerce/index.ts"],
    "ripple.elements": ["src/elements/index.ts"],
  },
  agentEntry: "src/agent/index.ts",
  outDir: "pkg/browser",
  liquidDir: "pkg/registry/liquid/assets",
  liquidMain: "ripple",
  external: ["@shopify/partial-rendering", "@shopify/standard-actions", "@shopify/standard-events"],
  identity: { file: "src/identity.ts", code: identitySource },
})
```

`identitySource` is the replacement text for `src/identity.ts` produced by `01-architecture.md` section 7 step 3. The list `external` is the three platform specifiers of step 7.

### 6.5 Requirements on the output

1. `pkg/browser/` contains exactly the 12 `.js` files of section 4.2 (plus `ripple.css`, owned by `01-architecture.md`). `pkg/registry/liquid/assets/` contains exactly the 6 files of section 5.4.
2. No chunk contains a copy of the kernel. Test E-20 checks at runtime that one kernel instance serves both `rp-*` and `ui-*` elements.
3. `ripple-tabs.js` contains the import specifier `./ripple.js`; `ripple.elements-tabs.js` contains `./ripple.elements.js` (`01-architecture.md` tests A-07, A-08).
4. No main file statically imports a chunk.
5. A UI SDK version bump MUST re-run the build and re-check that exactly one `-shared` file is produced; the build throws when more than one remains after 8 passes.

---

## 7. Rules for writing an `rp-*` element

These rules apply to every element in `src/elements/rp-*.ts` and `src/commerce/rp-*.ts` (D-019). Section 8 is a complete element that follows all of them.

| Rule | Requirement |
|---|---|
| R-1 | One element per file. File name = tag name: `src/elements/<tag>.ts` or `src/commerce/<tag>.ts`. |
| R-2 | Built with `definePrimitive` from `@ui-sdk/core` and `createParts` from `@ui-sdk/web`, with exactly one part, `root`. The primitive `name` equals the tag. The server prints `data-slot="<tag>"` on the root. |
| R-3 | Parts are native descendants marked `data-rp-part="<name>"`. The element finds a part with `root.querySelector` at the moment it needs it. It MUST NOT store a reference to any descendant in a variable that outlives one event handler or one method call. |
| R-4 | Listeners for bubbling events are declared in the root slot's `on` map (one delegated listener per event type). Listeners for events that do not bubble (`scroll`, `command`, `cancel`, `close`, `toggle`) are added in `bind` with `el.addEventListener(type, fn, true)` on the ROOT and removed in the function `bind` returns. No listener is added to a descendant. |
| R-5 | The element MUST work after any descendant is replaced (Liquid partial refresh, Remix morph, React re-render) and after its own disconnect and reconnect. Consequence: before acting on state, re-read the DOM (the `adopt()` pattern of section 8). |
| R-6 | State is written to the DOM only with the attribute names of D-021. The element MUST NOT write, at upgrade, any attribute the server could have printed: after `bind` has run on server-rendered markup, a `MutationObserver` records zero mutations inside the root (allow-listed entries excepted). |
| R-7 | A state change caused by the user or by a public method goes through `change(key, value, { reason, event })` and MUST respect its return value: when it returns `false`, the element restores what the DOM showed before. `reason` MUST be a value of the table in section 11.2. |
| R-8 | Writes through the element's JavaScript property (`element.value = 3`) or its attribute are silent: they use `context.store.set` and dispatch no event (D-023 item 1). |
| R-9 | `createParts` is called at module top level inside `try { ... } catch (error) { console.error("[ripple] <tag> failed to define", error) }`. |
| R-10 | The `display` given to `createParts` MUST be `"block"`. It MUST NOT be `"contents"`: the agent bridge skips roots that fail `checkVisibility()`. A component that needs another layout sets it by class in its CSS file (`.rp-quantity { display: inline-flex }`). The value in the generated display rules of `03-styling-and-tokens.md` section 4.3 MUST equal the value given here. |
| R-11 | The `api` list of `createParts` names the public methods only. Internal methods returned by the `api` function (for use by the slot) are not listed and are therefore not reachable from `element.api`. |
| R-12 | The primitive's `agent` key is `{ actions: [...] }`, listing the public methods an in-page agent may call (section 12). Getter methods are not listed. |
| R-13 | Timers, observers and listeners on objects other than the root are registered with cleanup: in the function returned by `bind`, or with `context.onDestroy`. |
| R-14 | Announcements use `announce(text, { from })` from `src/runtime/announcer.ts` (section 3.5). |
| R-15 | The element writes nothing outside its root, and reads nothing outside its root except through `document.getElementById` for an id the contract names. |
| R-16 | The module exports the primitive (`export { rpQuantity }`) and nothing else. It has no default export. |
| R-17 | The module MUST NOT throw at import time and MUST do nothing visible when its parts are missing: every part lookup is null-checked. |

Checklist for adding a new non-commerce element `rp-<name>`:

1. Confirm with D-007 that a native mechanism or an existing element cannot do the job. A new tag needs a ledger change.
2. Write `src/elements/rp-<name>.ts` following R-1 to R-17.
3. Add `import "./rp-<name>"` to `src/elements/index.ts` after the existing `rp-*` imports.
4. Add the tag with display `block` to the display source of `03-styling-and-tokens.md` section 4.3, and, if it owns `data-rp-js` controls, to the owner list of the generated visibility rules.
5. Write the component contract with `data-slot="rp-<name>"` on the root and the complete initial state on the parts (`02-html-contract.md` section 8).
6. Record the events, methods and `agent` actions in the component's manifest entry (`07-manifest-registry-cli.md`).
7. Write `src/elements/rp-<name>.test.ts` covering, at minimum: zero mutations at upgrade; each event with each reason; cancel restores the DOM; silent property write; descendant replacement; disconnect and reconnect; `element.api` exposes exactly the listed methods.
8. Run `pnpm build` and check `size-budget.json`.

---

## 8. Worked example: `rp-quantity`

`rp-quantity` is the element of QuantityInput (D-015). It is the reference for every other `rp-*` element.

### 8.1 Markup the server prints (complete)

Example with `id="qty"`, `min="1"`, `max="5"`, `step="1"`, `value="1"`. Classes and prop attributes are owned by `10-components-interactive.md`; the attributes listed under "Behaviour-bearing" below are fixed here.

```html
<rp-quantity class="rp-quantity" data-slot="rp-quantity" id="qty">
  <button type="button" class="rp-quantity-button" data-rp-part="decrement" data-rp-js="inflow" aria-label="Decrease quantity" disabled>-</button>
  <input class="rp-quantity-input" data-rp-part="input" type="number" inputmode="numeric" name="quantity" min="1" max="5" step="1" value="1" aria-label="Quantity">
  <button type="button" class="rp-quantity-button" data-rp-part="increment" data-rp-js="inflow" aria-label="Increase quantity">+</button>
</rp-quantity>
```

Behaviour-bearing attributes:

| Element | Attribute | Requirement |
|---|---|---|
| root | `data-slot="rp-quantity"` | REQUIRED |
| input | `data-rp-part="input"`, `type="number"` | REQUIRED |
| input | `min`, `max`, `step`, `value` | Read at event time. Defaults when absent or not a number: `min` 1, `max` unlimited, `step` 1. |
| input | `aria-label`, or a `<label for>` | REQUIRED (accessible name; also the announcement text) |
| buttons | `type="button"`, `data-rp-part="decrement"` / `"increment"`, `data-rp-js="inflow"` | REQUIRED |
| decrement button | `disabled` | Printed by the server when `value <= min` |
| increment button | `disabled` | Printed by the server when `max` is set and `value >= max` |

### 8.2 Behaviour

1. Upgrade: the element adopts the input's value as its state and recomputes the two `disabled` attributes. With correct server markup this writes nothing.
2. A click on a button: re-adopt the input's value (R-5); compute `value + step` (increment) or `value - step` (decrement); clamp to `[min, max]` and snap to the step grid that starts at `min`; call `change("value", next, { reason })`. If accepted: write the input's `value` property, update the `disabled` attributes, announce `"<accessible name> <value>"`, then dispatch bubbling `input` and `change` events on the input so that forms and commerce elements see a native edit.
3. The user types and commits (the input's own trusted `change` event): normalise the typed number the same way and commit with reason `input-commit`. The input is rewritten when normalisation changed the number (typing 99 with `max="5"` shows 5).
4. A listener that calls `preventDefault()` on `valuechange` vetoes the change: the input shows the previous value again.
5. `element.value = n` is a silent write: no `valuechange` event and no veto. The input and the buttons are updated and the new value is announced.
6. A disabled input disables both buttons and ignores steps.
7. The only DOM writes are the input's `value` property and the `disabled` attribute on the two buttons.

Without JavaScript and before upgrade: the number input works and submits with its form; the two buttons are invisible but keep their space (`visibility: hidden` from the generated rule `rp-quantity:not(:defined) [data-rp-js="inflow"]`, `03-styling-and-tokens.md`), so nothing shifts at upgrade.

### 8.3 Public surface

| Kind | Name | Signature / detail |
|---|---|---|
| Event | `valuechange` | `detail: { value: number, reason: "increment-press" \| "decrement-press" \| "input-commit" \| "imperative", source }`. Not bubbling. Cancelable. |
| Method | `api.getValue()` | returns `number` |
| Method | `api.setValue(value)` | Commits with reason `imperative`; fires `valuechange`; returns `false` when vetoed |
| Method | `api.increment()`, `api.decrement()` | Same as a button press; return `false` when vetoed or disabled |
| Property | `value` | Live number. Writing it is silent. |
| Option | `default-value` attribute | Not printed by Ripple bindings: the input's `value` is the source |
| Agent actions | `setValue`, `increment`, `decrement` | section 12 |

### 8.4 `src/elements/rp-quantity.ts` (complete)

```ts
// <rp-quantity>: stepper around a native <input type="number"> (00-decisions D-015).
import { createChange, definePrimitive } from "@ui-sdk/core"
import { createParts } from "@ui-sdk/web"
import { announce } from "../runtime/announcer"

type QuantityChangeDetails = {
  reason: "increment-press" | "decrement-press" | "input-commit" | "imperative"
  event?: Event
  source: string
}

type QuantityOptions = {
  defaultValue?: number
  onValueChange?: (value: number, details: QuantityChangeDetails) => void
}

type Bounds = { min: number; max: number; step: number }

const INPUT = '[data-rp-part="input"]'

// Pure helpers. They read the DOM at call time and keep no references.
function inputOf(root: Element | null | undefined): HTMLInputElement | null {
  return root ? root.querySelector<HTMLInputElement>(INPUT) : null
}

function numberAttr(input: HTMLInputElement, name: string, fallback: number): number {
  const raw = input.getAttribute(name)
  if (raw === null || raw.trim() === "") return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function boundsOf(input: HTMLInputElement): Bounds {
  const step = numberAttr(input, "step", 1)
  return {
    min: numberAttr(input, "min", 1),
    max: numberAttr(input, "max", Number.POSITIVE_INFINITY),
    step: step > 0 ? step : 1,
  }
}

// Clamp to [min, max] and snap down to the step grid that starts at min.
function normalize(value: number, { min, max, step }: Bounds): number {
  if (!Number.isFinite(value)) return min
  const snapped = min + Math.floor((value - min) / step + 1e-9) * step
  let result = Math.max(min, snapped)
  if (result > max) result = min + Math.floor((max - min) / step + 1e-9) * step
  return Math.max(min, result)
}

function readValue(input: HTMLInputElement): number {
  return normalize(Number(input.value), boundsOf(input))
}

// The only writes this element makes: `disabled` on the two buttons.
function syncButtons(root: Element): void {
  const input = inputOf(root)
  if (!input) return
  const { min, max } = boundsOf(input)
  const value = readValue(input)
  const off = input.disabled
  root
    .querySelector('[data-rp-part="decrement"]')
    ?.toggleAttribute("disabled", off || value <= min)
  root
    .querySelector('[data-rp-part="increment"]')
    ?.toggleAttribute("disabled", off || value >= max)
}

function nameOf(input: HTMLInputElement): string {
  return (
    input.getAttribute("aria-label") ??
    input.labels?.[0]?.textContent?.trim() ??
    ""
  )
}

const rpQuantity = definePrimitive({
  name: "rp-quantity",
  options: { defaultValue: "number", onValueChange: "callback" },
  state: (options: QuantityOptions) => ({ value: options.defaultValue ?? 1 }),
  api: (context) => {
    const change = createChange(context)
    const root = () => context.element("root")

    // Moves state to `next`. Returns false when a listener canceled the change.
    const commit = (
      next: number,
      reason: QuantityChangeDetails["reason"],
      event?: Event
    ): boolean => {
      const input = inputOf(root())
      if (!input) return false
      const value = normalize(next, boundsOf(input))
      const previous = context.store.get().value
      const accepted = value === previous || change("value", value, { reason, event })
      // The input always shows the state: the new value, or the old one after a veto.
      const shown = String(context.store.get().value)
      if (input.value !== shown) input.value = shown
      syncButtons(root()!)
      if (accepted && value !== previous) {
        announce(`${nameOf(input)} ${value}`.trim(), { from: input })
      }
      return accepted
    }

    // Adopts what the DOM shows, without an event: the server-rendered value at
    // upgrade, and the value of an input that a refresh replaced.
    const adopt = () => {
      const el = root()
      const input = inputOf(el)
      if (!el || !input) return
      context.store.set({ value: readValue(input) })
      syncButtons(el)
    }

    const step = (direction: 1 | -1, event?: Event): boolean => {
      const input = inputOf(root())
      if (!input || input.disabled) return false
      adopt()
      const before = context.store.get().value
      const accepted = commit(
        readValue(input) + direction * boundsOf(input).step,
        direction === 1 ? "increment-press" : "decrement-press",
        event
      )
      // Forms and commerce elements listen for the native events of the input.
      if (accepted && context.store.get().value !== before) {
        input.dispatchEvent(new Event("input", { bubbles: true }))
        input.dispatchEvent(new Event("change", { bubbles: true }))
      }
      return accepted
    }

    return {
      getValue: () => context.store.get().value,
      setValue: (value: number, event?: Event) => commit(Number(value), "imperative", event),
      increment: (event?: Event) => step(1, event),
      decrement: (event?: Event) => step(-1, event),
      // Internal: adopt what the user typed (the input's own `change` event).
      commitInput: (event: Event) => {
        const input = inputOf(root())
        if (input) commit(Number(input.value), "input-commit", event)
      },
      // Internal.
      adopt,
    }
  },
  agent: { actions: ["setValue", "increment", "decrement"] },
  slots: (slot) => ({
    root: slot({
      // One delegated listener set on the root (D-019 item 3).
      on: {
        click: (event, { el, api }) => {
          const target = event.target instanceof Element ? event.target : null
          const button = target?.closest("[data-rp-part]")
          if (!el || !button || !el.contains(button)) return
          const part = button.getAttribute("data-rp-part")
          if (part === "increment") api.increment(event)
          else if (part === "decrement") api.decrement(event)
        },
        // Focus entering the element: the input may have been replaced since the last event.
        focusin: (_event, { api }) => api.adopt(),
        change: (event, { api }) => {
          const target = event.target instanceof Element ? event.target : null
          // Ignore the synthetic `change` this element dispatches after a step.
          if (target?.matches(INPUT) && event.isTrusted) api.commitInput(event)
        },
      },
      bind: (_el, part) => {
        part.api.adopt()
      },
    }),
  }),
})

try {
  createParts(rpQuantity, {
    root: {
      tag: "rp-quantity",
      display: "block",
      api: ["getValue", "setValue", "increment", "decrement"],
      state: {
        value: {
          get: (api) => api.getValue(),
          set: (api, value: number) => {
            api.setValue(value)
          },
        },
      },
    },
  })
} catch (error) {
  console.error("[ripple] rp-quantity failed to define", error)
}

export { rpQuantity }
```

### 8.5 Reading guide

| Lines of interest | Rule shown |
|---|---|
| `inputOf`, `boundsOf`, `readValue`, `syncButtons` are module functions that take the root | R-3: no stored descendant references |
| `commit()` | R-7: one place calls `change`, and always rewrites the input from the state afterwards, which implements the veto |
| `adopt()` called from `bind`, from `focusin`, and at the start of `step()` | R-5: state follows a replaced input |
| `on: { click, focusin, change }` | R-4: delegated listeners on the root |
| `event.isTrusted` test in the `change` handler | The element's own synthetic `change` MUST NOT be committed a second time |
| `state.value.set` calls `api.setValue` | NOTE: for `rp-quantity` a property write goes through `commit` with reason `imperative`; the kernel suppresses the event for property writes (verified: spike line "quantity: property write is silent") |
| `api: ["getValue", "setValue", "increment", "decrement"]` | R-11: `commitInput` and `adopt` are internal |
| `try { createParts(...) } catch` | R-9 |

### 8.6 Test file

`src/elements/rp-quantity.test.ts` MUST contain these cases (tier 5 of D-063 unless stated). Each was run in the spike (`ripple/docs/research/spikes/elements-runtime/test.mjs`).

| Case | Steps | Expected |
|---|---|---|
| Q-1 (tier 3) | Load the markup of 8.1 with a `MutationObserver` installed before the module script | Zero mutations inside `rp-quantity` |
| Q-2 | Click increment | Input value `"2"`; events in order: `valuechange` (`value: 2`, `reason: "increment-press"`, `bubbles: false`, `cancelable: true`), `input`, `change` on the input; decrement button has no `disabled` |
| Q-3 | Click increment until value 5 | Increment button has `disabled`; a further `api.increment()` leaves the value 5 |
| Q-4 | Type `3`, press Tab | `valuechange` with `reason: "input-commit"`, value 3 |
| Q-5 | Type `99`, press Tab | Input shows `5` |
| Q-6 | Add a `valuechange` listener that calls `preventDefault()`, click decrement | Input value unchanged; `api.getValue()` unchanged |
| Q-7 | `element.value = 2` | No `valuechange`; input shows `2` |
| Q-8 | `Object.keys(element.api)` | Exactly `getValue`, `setValue`, `increment`, `decrement` |
| Q-9 | Replace the input and both buttons with new nodes (same markup, `value="4"`), click increment | Input shows `5` |
| Q-10 | Remove the root from the document, insert it again, click decrement | Value decreases by 1 and `valuechange` fires once |
| Q-11 | Click increment with the element outside any dialog | A kernel live region contains `Quantity <value>` |
| Q-12 | Same inside an open modal `<dialog>` that has a `data-rp-part="status"` element | That element's text is `Quantity <value>` |

---

## 9. The other non-commerce elements

### 9.1 `rp-dialog`

Used by Dialog, Drawer, MobileNav, CartDrawer and the ProductGallery lightbox (D-008). Markup: section 10.1 and 10.2.

Structure requirement: the `<dialog>` MUST be a direct child of `rp-dialog`, and `rp-dialog` MUST contain exactly one `<dialog>` child. The `id` is on the `<dialog>`.

Behaviour:

1. **Source of truth.** The `open` attribute of the `<dialog>` is the only state. The element observes that attribute (one `MutationObserver` on the root, filtered to the direct-child dialog) and therefore sees every way a dialog opens or closes: Invoker Commands (native or polyfilled), `showModal()` and `close()` called by any script, Escape, light dismiss, `<form method="dialog">`.
2. **Event.** Each change dispatches `openchange` on the `rp-dialog` root with `detail.value` (`true` or `false`) and `detail.reason`:

| Cause | `reason` |
|---|---|
| A `commandfor` button with `command="show-modal"`; a link opener (section 3.4); `api.open(event)` with an event | `trigger-press` |
| A `commandfor` button with `command="close"`; `api.close(event)` with an event | `close-press` |
| Escape; a platform close request such as the Android back gesture | `escape-key` |
| A press on the backdrop (`closedby="any"`, or the fallback of item 5) | `outside-press` |
| A link or form started a navigation that the Navigation API reports as interceptable (item 7) | `link-press` |
| `api.open()` / `api.close()` without an event; `dialog.showModal()` or `dialog.close()` called by other code; `<form method="dialog">` | `imperative` |

   A cause is matched to the change only when the change follows it within 1000 ms; otherwise the reason is `imperative`.
3. **Veto.** `openchange` is cancelable. For `api.open()` and `api.close()` a canceled event means nothing happens and the method returns `false`. For a change that the browser already made (command, Escape, light dismiss), a canceled event makes the element put the dialog back (`close()` or `showModal()`); the dialog is in the other state for less than one frame.
4. **Initial open.** When the `<dialog>` has `data-default-open` and is closed at upgrade, the element calls `showModal()` once per dialog node (a reconnect does not reopen it). `openchange` fires with `value: true`, reason `imperative`. The `open` attribute this adds is allow-list entry 3 of `02-html-contract.md` section 7.3. When the dialog is already open at upgrade (opened natively before the module loaded), the element adopts that state without an event.
5. **Light dismiss fallback.** `closedby="any"` gives backdrop dismissal natively. In a browser without `closedby` (`!("closedBy" in HTMLDialogElement.prototype)`), a click whose target is the `<dialog>` itself and whose coordinates are outside the dialog's box closes it with reason `outside-press`. A dialog without `closedby="any"` is never light-dismissed by the element.
6. **Focus.** Opening is `showModal()`, so the browser moves focus into the dialog and makes the rest of the page inert. On close the browser restores focus; the element additionally focuses the opener when focus was lost (opener never focused, or replaced by a node with the same `id`).
7. **Navigation.** When the Navigation API exists, a `navigate` event with `canIntercept === true`, `hashChange === false`, no `downloadRequest`, and a `sourceElement` that is not inside a `[data-rmx-target]` element closes an open dialog with reason `link-press` (D-008 item 6). Navigations without a `sourceElement` (`history.pushState` and `replaceState` called by `rp-live`) do NOT close it, so a filter drawer stays open while results refresh. Without the Navigation API nothing is closed by the element; a full document navigation discards the dialog anyway.
8. **Writes.** The element writes no attribute on its root, in any state. Inside the root it changes only the dialog's open state through `showModal()` and `close()`.
9. **Rule for feedback** (D-008 item 7): while a dialog is open, feedback MUST be rendered inside it (FormMessage with `role="alert"`, or `announce()` with `from` inside the dialog). Code MUST NOT call `toast()` while `document.querySelector("dialog:modal")` is not null.

Public surface:

| Kind | Name | Signature / detail |
|---|---|---|
| Event | `openchange` | `detail: { value: boolean, reason, source }`. Not bubbling. Cancelable. |
| Method | `api.isOpen()` | returns `boolean` |
| Method | `api.open(event?)` | Opens modally; returns `false` when already open or vetoed |
| Method | `api.close(event?)` | Closes; returns `false` when already closed or vetoed |
| Method | `api.setOpen(value)` | Silent open or close (no event) |
| Property | `open` | Live boolean on the `rp-dialog` element. Writing it is silent. |
| Agent actions | `open`, `close` | section 12 |

Static CSS requirement (owned by `03-styling-and-tokens.md`, value fixed here by rule R-10): `rp-dialog { display: block; position: absolute; inline-size: 0; block-size: 0; }`. The root then takes no space in the flow, and still passes `checkVisibility()`. A modal dialog is in the top layer and is not affected by the root's box. The component CSS MUST NOT set `display` on a closed `<dialog>`: `display` values for the panel are written only under `dialog[open]`.

`src/elements/rp-dialog.ts` (complete):

```ts
// <rp-dialog>: wrapper around one native <dialog> (00-decisions D-008).
// Used by Dialog, Drawer, MobileNav, CartDrawer and the ProductGallery lightbox.
import { createChange, definePrimitive } from "@ui-sdk/core"
import { createParts } from "@ui-sdk/web"

type DialogReason = "trigger-press" | "close-press" | "escape-key" | "outside-press" | "link-press" | "imperative"

type DialogOptions = {
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: { reason: DialogReason; event?: Event; source: string }) => void
}

type NavigateEventLike = Event & {
  canIntercept?: boolean
  hashChange?: boolean
  downloadRequest?: string | null
  sourceElement?: Element | null
}

// Dialogs that already honoured data-default-open, so a reconnect does not reopen them.
const autoOpened = new WeakSet<HTMLDialogElement>()

function dialogOf(root: Element | null | undefined): HTMLDialogElement | null {
  const first = root?.querySelector("dialog") ?? null
  return first instanceof HTMLDialogElement && first.parentElement === root ? first : null
}

function canFocus(el: Element | null): el is HTMLElement {
  return el instanceof HTMLElement && el.isConnected && el !== document.body && !el.hidden
}

const rpDialog = definePrimitive({
  name: "rp-dialog",
  options: { defaultOpen: "boolean", onOpenChange: "callback" },
  state: (options: DialogOptions) => ({ open: options.defaultOpen ?? false }),
  api: (context) => {
    const change = createChange(context)
    const root = () => context.element("root")
    // Why the next external change of the dialog's `open` attribute happens.
    let reason: DialogReason = "imperative"
    let cause: Event | undefined
    let notedAt = 0
    let opener: Element | null = null
    let openerId = ""

    const note = (next: DialogReason, event?: Event) => {
      reason = next
      cause = event
      notedAt = Date.now()
    }

    // A note explains only a change that follows it within one second.
    const takeNote = (): { reason: DialogReason; event?: Event } => {
      const fresh = Date.now() - notedAt < 1000
      const taken = { reason: fresh ? reason : "imperative", event: fresh ? cause : undefined }
      notedAt = 0
      return taken
    }

    const rememberOpener = (el: Element | null) => {
      opener = el
      openerId = el?.id ?? ""
    }

    // Native <dialog> restores focus itself. This covers the cases it misses:
    // an opener that never took focus (Safari buttons) or that was replaced.
    const afterClose = (dialog: HTMLDialogElement) => {
      const active = document.activeElement
      if (!active || active === document.body || dialog.contains(active)) {
        const replacement = openerId ? document.getElementById(openerId) : null
        if (canFocus(opener)) opener.focus()
        else if (canFocus(replacement)) replacement.focus()
      }
      rememberOpener(null)
    }

    // The dialog's `open` attribute changed. When the change did not come from
    // this api (native command, Escape, light dismiss, <form method="dialog">),
    // report it; when a listener cancels it, put the dialog back.
    const sync = () => {
      const dialog = dialogOf(root())
      if (!dialog) return
      const open = dialog.open
      if (open === context.store.get().open) return
      const accepted = change("open", open, takeNote())
      if (!accepted) {
        if (open) dialog.close()
        else dialog.showModal()
        return
      }
      if (!open) afterClose(dialog)
    }

    const show = (dialog: HTMLDialogElement, event?: Event) => {
      const source = event?.target instanceof Element ? event.target.closest("a, button") : null
      rememberOpener(source ?? document.activeElement)
      dialog.showModal()
    }

    const open = (event?: Event): boolean => {
      const dialog = dialogOf(root())
      if (!dialog || dialog.open) return false
      if (!change("open", true, { reason: event ? "trigger-press" : "imperative", event })) return false
      show(dialog, event)
      return true
    }

    const close = (event?: Event): boolean => {
      const dialog = dialogOf(root())
      if (!dialog || !dialog.open) return false
      if (!change("open", false, { reason: event ? "close-press" : "imperative", event })) return false
      dialog.close()
      afterClose(dialog)
      return true
    }

    // Property and attribute writes: no event (same rule as every UI SDK element).
    const setOpen = (value: boolean) => {
      const dialog = dialogOf(root())
      if (!dialog || dialog.open === value) return
      context.store.set({ open: value })
      if (value) show(dialog)
      else {
        dialog.close()
        afterClose(dialog)
      }
    }

    // Top-level navigation started by a link or form (Remix keeps the document).
    const onNavigate = (event: Event) => {
      const navigation = event as NavigateEventLike
      if (!navigation.canIntercept || navigation.hashChange || navigation.downloadRequest != null) return
      const source = navigation.sourceElement
      if (!source || source.closest("[data-rmx-target]")) return
      const dialog = dialogOf(root())
      if (dialog?.open) {
        note("link-press", event)
        dialog.close()
      }
    }
    const navigation = (globalThis as { navigation?: EventTarget }).navigation
    navigation?.addEventListener("navigate", onNavigate)
    context.onDestroy(() => navigation?.removeEventListener("navigate", onNavigate))

    return {
      isOpen: () => context.store.get().open,
      open,
      close,
      setOpen,
      // Internal. Not listed in createParts `api`.
      adopt: () => context.store.set({ open: dialogOf(root())?.open ?? false }),
      sync,
      note,
      hasNote: () => Date.now() - notedAt < 1000,
      rememberOpener,
    }
  },
  agent: { actions: ["open", "close"] },
  slots: (slot) => ({
    root: slot({
      on: {
        // Backdrop click fallback for browsers without `closedby`.
        click: (event, { el, api }) => {
          const dialog = dialogOf(el)
          if (!dialog || event.target !== dialog || !dialog.open) return
          if (dialog.getAttribute("closedby") !== "any" || "closedBy" in HTMLDialogElement.prototype) return
          const box = dialog.getBoundingClientRect()
          const mouse = event as MouseEvent
          const inside =
            mouse.clientX >= box.left && mouse.clientX <= box.right && mouse.clientY >= box.top && mouse.clientY <= box.bottom
          if (inside) return
          api.note("outside-press", event)
          dialog.close()
        },
      },
      bind: (el, part) => {
        const api = part.api
        // `command`, `cancel` and `close` do not bubble: listen in the capture phase on the root.
        const onCommand = (event: Event) => {
          if (event.target !== dialogOf(el)) return
          const { command, source } = event as Event & { command?: string; source?: Element | null }
          if (command === "show-modal") {
            api.note("trigger-press", event)
            api.rememberOpener(source ?? null)
          } else if (command === "close") {
            api.note("close-press", event)
          }
        }
        const onKeydown = (event: Event) => {
          if ((event as KeyboardEvent).key === "Escape") api.note("escape-key", event)
        }
        // A press on the backdrop targets the <dialog> element itself.
        const onPointerdown = (event: Event) => {
          if (event.target === dialogOf(el)) api.note("outside-press", event)
        }
        // Another close request (for example the Android back gesture).
        const onCancel = (event: Event) => {
          if (event.target === dialogOf(el) && !api.hasNote()) api.note("escape-key", event)
        }
        el.addEventListener("command", onCommand, true)
        el.addEventListener("keydown", onKeydown, true)
        el.addEventListener("pointerdown", onPointerdown, true)
        el.addEventListener("cancel", onCancel, true)
        // The `open` attribute is the single source of truth for every way a dialog opens or closes.
        const observer = new MutationObserver((records) => {
          if (records.some((record) => record.target === dialogOf(el))) api.sync()
        })
        observer.observe(el, { attributes: true, attributeFilter: ["open"], subtree: true })

        const dialog = dialogOf(el)
        if (dialog?.open) {
          api.adopt()
        } else if (dialog?.hasAttribute("data-default-open") && !autoOpened.has(dialog)) {
          autoOpened.add(dialog)
          dialog.showModal()
        }
        return () => {
          observer.disconnect()
          el.removeEventListener("command", onCommand, true)
          el.removeEventListener("keydown", onKeydown, true)
          el.removeEventListener("pointerdown", onPointerdown, true)
          el.removeEventListener("cancel", onCancel, true)
        }
      },
    }),
  }),
})

try {
  createParts(rpDialog, {
    root: {
      tag: "rp-dialog",
      display: "block",
      api: ["isOpen", "open", "close", "setOpen"],
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, value: boolean) => {
            api.setOpen(Boolean(value))
          },
        },
      },
    },
  })
} catch (error) {
  console.error("[ripple] rp-dialog failed to define", error)
}

export { rpDialog }
```

### 9.2 `rp-carousel`

Used by Carousel, ProductGallery and FeaturedCollection with `layout="carousel"` (D-016). Markup: section 10.9.

Parts: `viewport` (the scroll container, exactly one), `item` (each slide, descendants of the viewport), `prev`, `next` (buttons, outside the viewport).

Behaviour:

1. Scrolling is native: touch, trackpad, keyboard on the focusable viewport, and scroll snapping come from CSS. The element never sets a scroll position except in response to a button press, `api.goTo`, the `index` property, or the `default-index` option.
2. `next` and `previous` scroll the viewport by one viewport width (`scrollBy`), in the inline direction (negated in RTL), with `behavior: "smooth"`, or `"auto"` under `prefers-reduced-motion: reduce`. Scroll snapping decides the final position.
3. The index is the position, in document order among the viewport's `item` parts, of the item whose start edge is nearest the viewport's start edge; at the scroll end it is the first item whose start edge is at or after the viewport's start edge.
4. On every scroll and on every resize of the root, the element recomputes the index and the buttons: `prev` gets `disabled` when the scroll offset is at most 1 px; `next` gets `disabled` when the offset is within 1 px of the maximum.
5. When the index changed, `indexchange` is dispatched with reason `next-press` or `previous-press` (the scroll was started by that button), `imperative` (`api.goTo`), or `scroll` (the user scrolled). A button reason lasts until the scroll has been at rest for 150 ms. Calling `preventDefault()` has no effect: the scroll already happened.
6. Upgrade: when `default-index` is greater than 0 the element jumps there without animation; then it adopts the current index and recomputes the buttons. The server prints `disabled` on `prev` (index 0). The `next` button's `disabled` depends on layout (all slides may fit), so the server MUST NOT print it; when all slides fit, the element adds `disabled` to `next` at upgrade. The Carousel spec MUST carry the allow-list entry `{ "select": "[data-rp-part=\"next\"]", "attrs": ["disabled"] }` (`02-html-contract.md` section 8, Carousel row).
7. The only DOM writes are `disabled` on the two buttons. The element sets no `aria-hidden`, `inert` or `tabindex` on slides.

Public surface:

| Kind | Name | Signature / detail |
|---|---|---|
| Event | `indexchange` | `detail: { value: number, reason: "next-press" \| "previous-press" \| "scroll" \| "imperative", source }`. Not bubbling. |
| Method | `api.getIndex()` | returns `number` (0-based) |
| Method | `api.next()`, `api.previous()` | Scroll one page |
| Method | `api.goTo(index)` | Smooth scroll to the item; `indexchange` reason `imperative` |
| Property | `index` | Live number. Writing it jumps without animation and without an event. |
| Option | `default-index` attribute | Initial item, default 0 |
| Agent actions | `next`, `previous`, `goTo` | section 12 |

`src/elements/rp-carousel.ts` (complete):

```ts
// <rp-carousel>: previous/next buttons for a CSS scroll-snap list (00-decisions D-016).
import { createChange, definePrimitive } from "@ui-sdk/core"
import { createParts } from "@ui-sdk/web"

type CarouselReason = "previous-press" | "next-press" | "scroll" | "imperative"

type CarouselOptions = {
  defaultIndex?: number
  onIndexChange?: (index: number, details: { reason: CarouselReason; event?: Event; source: string }) => void
}

const VIEWPORT = '[data-rp-part="viewport"]'
const ITEM = '[data-rp-part="item"]'

function viewportOf(root: Element | null | undefined): HTMLElement | null {
  return root ? root.querySelector<HTMLElement>(VIEWPORT) : null
}

function itemsOf(viewport: HTMLElement): HTMLElement[] {
  return [...viewport.querySelectorAll<HTMLElement>(ITEM)].filter((item) => item.closest(VIEWPORT) === viewport)
}

function isRtl(el: Element): boolean {
  return getComputedStyle(el).direction === "rtl"
}

// Distance scrolled from the start edge, always >= 0 (scrollLeft is negative in RTL).
function scrolled(viewport: HTMLElement): number {
  return Math.abs(viewport.scrollLeft)
}

function maxScroll(viewport: HTMLElement): number {
  return Math.max(0, viewport.scrollWidth - viewport.clientWidth)
}

// Distance of an item's start edge from the viewport's start edge, in the scroll direction.
function startOffset(viewport: HTMLElement, item: HTMLElement): number {
  const box = viewport.getBoundingClientRect()
  const itemBox = item.getBoundingClientRect()
  return isRtl(viewport) ? box.right - itemBox.right : itemBox.left - box.left
}

// Index of the first item whose start edge is at or after the viewport's start edge.
function currentIndex(viewport: HTMLElement): number {
  const items = itemsOf(viewport)
  if (items.length === 0) return 0
  if (scrolled(viewport) >= maxScroll(viewport) - 1 && maxScroll(viewport) > 0) {
    // At the end the last snapped item may not reach the start edge: report the first fully visible one.
    const first = items.findIndex((item) => startOffset(viewport, item) >= -1)
    return first === -1 ? items.length - 1 : first
  }
  let best = 0
  let bestDistance = Number.POSITIVE_INFINITY
  items.forEach((item, index) => {
    const distance = Math.abs(startOffset(viewport, item))
    if (distance < bestDistance - 0.5) {
      best = index
      bestDistance = distance
    }
  })
  return best
}

function behavior(): ScrollBehavior {
  return matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
}

// The only writes this element makes: `disabled` on the two buttons.
function syncButtons(root: Element): void {
  const viewport = viewportOf(root)
  if (!viewport) return
  const position = scrolled(viewport)
  const max = maxScroll(viewport)
  root.querySelector('[data-rp-part="prev"]')?.toggleAttribute("disabled", position <= 1)
  root.querySelector('[data-rp-part="next"]')?.toggleAttribute("disabled", position >= max - 1)
}

const rpCarousel = definePrimitive({
  name: "rp-carousel",
  options: { defaultIndex: "number", onIndexChange: "callback" },
  state: (options: CarouselOptions) => ({ index: options.defaultIndex ?? 0 }),
  api: (context) => {
    const change = createChange(context)
    const root = () => context.element("root")
    let reason: CarouselReason = "scroll"
    let cause: Event | undefined

    const scrollToIndex = (index: number, smooth: boolean) => {
      const viewport = viewportOf(root())
      if (!viewport) return
      const items = itemsOf(viewport)
      const item = items[Math.min(Math.max(index, 0), items.length - 1)]
      if (!item) return
      const distance = startOffset(viewport, item)
      viewport.scrollBy({ left: isRtl(viewport) ? -distance : distance, behavior: smooth ? behavior() : "auto" })
    }

    const page = (direction: 1 | -1, event?: Event) => {
      const viewport = viewportOf(root())
      if (!viewport) return
      reason = direction === 1 ? "next-press" : "previous-press"
      cause = event
      const distance = direction * viewport.clientWidth
      viewport.scrollBy({ left: isRtl(viewport) ? -distance : distance, behavior: behavior() })
    }

    return {
      getIndex: () => context.store.get().index,
      next: (event?: Event) => page(1, event),
      previous: (event?: Event) => page(-1, event),
      goTo: (index: number) => {
        reason = "imperative"
        cause = undefined
        scrollToIndex(Number(index), true)
      },
      // Property write: jump without animation and without an event.
      setIndex: (index: number) => {
        const viewport = viewportOf(root())
        if (!viewport) return
        const count = itemsOf(viewport).length
        const next = Math.min(Math.max(Number(index) || 0, 0), Math.max(count - 1, 0))
        context.store.set({ index: next })
        scrollToIndex(next, false)
      },
      // Internal: the viewport scrolled or resized.
      sync: () => {
        const el = root()
        const viewport = viewportOf(el)
        if (!el || !viewport) return
        syncButtons(el)
        const index = currentIndex(viewport)
        if (index !== context.store.get().index) {
          // The scroll already happened: canceling `indexchange` has no effect.
          if (!change("index", index, { reason, event: cause })) context.store.set({ index })
        }
      },
      // Internal: the scroll came to rest; later scrolls are the user's unless a button says otherwise.
      settle: () => {
        reason = "scroll"
        cause = undefined
      },
      // Internal: adopt the server-rendered position without an event.
      adopt: () => {
        const el = root()
        const viewport = viewportOf(el)
        if (!el || !viewport) return
        const wanted = context.store.get().index
        if (wanted > 0) scrollToIndex(wanted, false)
        context.store.set({ index: currentIndex(viewport) })
        syncButtons(el)
      },
    }
  },
  agent: { actions: ["next", "previous", "goTo"] },
  slots: (slot) => ({
    root: slot({
      on: {
        click: (event, { el, api }) => {
          const target = event.target instanceof Element ? event.target : null
          const button = target?.closest('[data-rp-part="prev"], [data-rp-part="next"]')
          if (!el || !button || !el.contains(button) || button.closest(VIEWPORT)) return
          if (button.getAttribute("data-rp-part") === "next") api.next(event)
          else api.previous(event)
        },
      },
      bind: (el, part) => {
        const api = part.api
        let timer: ReturnType<typeof setTimeout> | undefined
        // `scroll` does not bubble: listen in the capture phase on the root.
        const onScroll = (event: Event) => {
          if (event.target !== viewportOf(el)) return
          api.sync()
          clearTimeout(timer)
          timer = setTimeout(api.settle, 150)
        }
        el.addEventListener("scroll", onScroll, true)
        const resize = new ResizeObserver(() => api.sync())
        resize.observe(el)
        api.adopt()
        return () => {
          clearTimeout(timer)
          resize.disconnect()
          el.removeEventListener("scroll", onScroll, true)
        }
      },
    }),
  }),
})

try {
  createParts(rpCarousel, {
    root: {
      tag: "rp-carousel",
      display: "block",
      api: ["getIndex", "next", "previous", "goTo"],
      state: {
        index: {
          get: (api) => api.getIndex(),
          set: (api, value: number) => {
            api.setIndex(value)
          },
        },
      },
    },
  })
} catch (error) {
  console.error("[ripple] rp-carousel failed to define", error)
}

export { rpCarousel }
```

### 9.3 `rp-navigation-menu`

Used by NavigationMenu (D-017). Markup: section 10.15.

Parts: `item` (each top-level `<li>`). The panel of an item is the first `[popover]` element inside it. The entry of an item is its first link or enabled button that is not inside the panel.

Behaviour:

1. Opening and closing a panel by its disclosure button, closing by Escape, closing by a press outside, and returning focus to the button are NATIVE (`popovertarget` + `popover`). The element adds only items 2 and 3.
2. **Hover intent** (mouse pointers only; touch and pen are ignored). The pointer resting on an item that has a panel opens that panel after 120 ms (`showPopover()`); opening one auto popover closes the others natively. The pointer moving onto an item without a panel, or leaving every item, closes all panels of this menu after 250 ms. Moving between an item and its own panel cancels the pending close, because the panel is a DOM descendant of the item.
3. **Arrow keys**, when focus is on a top-level entry (not inside a panel): ArrowRight (ArrowLeft in RTL) focuses the entry of the next item, wrapping; ArrowLeft (ArrowRight in RTL) the previous, wrapping; Home the first; End the last; each of these closes open panels first. ArrowDown on an item with a panel opens the panel and focuses its first link or enabled button. Tab order is unchanged: every link and button stays in the tab sequence.
4. The element writes no attribute and dispatches no event. It sets no `aria-expanded` (`02-html-contract.md` rule I-2: the browser exposes the popover state of a `popovertarget` button).
5. In a browser without the popover API (`!("popover" in HTMLElement.prototype)`) the element does nothing. See ledger issue L-8 for what the page shows.

Public surface:

| Kind | Name | Signature / detail |
|---|---|---|
| Method | `api.close()` | Closes every open panel of this menu |
| Agent actions | `close` | section 12 |

`src/elements/rp-navigation-menu.ts` (complete):

```ts
// <rp-navigation-menu>: hover intent and arrow keys for popover submenus (00-decisions D-017).
import { definePrimitive } from "@ui-sdk/core"
import { createParts } from "@ui-sdk/web"

const ITEM = '[data-rp-part="item"]'
const OPEN_DELAY = 120
const CLOSE_DELAY = 250
// Without the popover API (below Chrome 114, Safari 17) panels are static content and this element does nothing.
const SUPPORTED = typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype

function itemOf(root: Element, target: EventTarget | null): HTMLElement | null {
  const item = target instanceof Element ? target.closest<HTMLElement>(ITEM) : null
  return item && root.contains(item) ? item : null
}

function panelOf(item: Element): HTMLElement | null {
  if (!SUPPORTED) return null
  const panel = item.querySelector<HTMLElement>("[popover]")
  return panel && panel.closest(ITEM) === item ? panel : null
}

function isOpen(panel: HTMLElement): boolean {
  return panel.matches(":popover-open")
}

// The first link or button of an item that is not inside its panel.
function entryOf(item: Element): HTMLElement | null {
  for (const el of item.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")) {
    if (!el.closest("[popover]")) return el
  }
  return null
}

function topItems(root: Element): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(ITEM)].filter((item) => item.parentElement?.closest(ITEM) == null)
}

const rpNavigationMenu = definePrimitive({
  name: "rp-navigation-menu",
  state: () => ({}),
  api: (context) => {
    const root = () => context.element("root")
    let openTimer: ReturnType<typeof setTimeout> | undefined
    let closeTimer: ReturnType<typeof setTimeout> | undefined
    const clear = () => {
      clearTimeout(openTimer)
      clearTimeout(closeTimer)
    }
    context.onDestroy(clear)

    const close = () => {
      clear()
      const el = root()
      if (!el || !SUPPORTED) return
      for (const panel of el.querySelectorAll<HTMLElement>("[popover]")) {
        if (isOpen(panel)) panel.hidePopover()
      }
    }

    return {
      close,
      // Internal: the mouse rests on an item.
      hover: (item: HTMLElement) => {
        clear()
        const panel = panelOf(item)
        if (!panel) {
          closeTimer = setTimeout(close, CLOSE_DELAY)
          return
        }
        if (isOpen(panel)) return
        openTimer = setTimeout(() => {
          if (panel.isConnected && !isOpen(panel)) panel.showPopover()
        }, OPEN_DELAY)
      },
      // Internal: the mouse left every item.
      leave: () => {
        clear()
        closeTimer = setTimeout(close, CLOSE_DELAY)
      },
      // Internal: arrow keys.
      key: (event: KeyboardEvent) => {
        const el = root()
        const item = el ? itemOf(el, event.target) : null
        if (!el || !item) return
        const target = event.target as Element
        const inPanel = target.closest("[popover]") !== null
        const rtl = getComputedStyle(el).direction === "rtl"
        const forward = rtl ? "ArrowLeft" : "ArrowRight"
        const backward = rtl ? "ArrowRight" : "ArrowLeft"
        if (inPanel) return
        if (event.key === "ArrowDown") {
          const panel = panelOf(item)
          if (!panel) return
          event.preventDefault()
          if (!isOpen(panel)) panel.showPopover()
          panel.querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus()
          return
        }
        const items = topItems(el)
        const index = items.indexOf(item)
        let next = -1
        if (event.key === forward) next = (index + 1) % items.length
        else if (event.key === backward) next = (index - 1 + items.length) % items.length
        else if (event.key === "Home") next = 0
        else if (event.key === "End") next = items.length - 1
        if (next === -1 || next === index) return
        event.preventDefault()
        close()
        entryOf(items[next])?.focus()
      },
    }
  },
  agent: { actions: ["close"] },
  slots: (slot) => ({
    root: slot({
      on: {
        pointerover: (event, { el, api }) => {
          if (!el || (event as PointerEvent).pointerType !== "mouse") return
          const item = itemOf(el, event.target)
          if (item) api.hover(item)
        },
        pointerout: (event, { el, api }) => {
          if (!el || (event as PointerEvent).pointerType !== "mouse") return
          const to = (event as PointerEvent).relatedTarget
          if (!itemOf(el, to)) api.leave()
        },
        keydown: (event, { api }) => api.key(event as KeyboardEvent),
      },
    }),
  }),
})

try {
  createParts(rpNavigationMenu, {
    root: { tag: "rp-navigation-menu", display: "block", api: ["close"] },
  })
} catch (error) {
  console.error("[ripple] rp-navigation-menu failed to define", error)
}

export { rpNavigationMenu }
```

---

## 10. Required markup and no-JS behaviour, per pattern

How to read this section:

- Each block is the complete markup of one pattern in its initial state, as every host MUST print it.
- Attributes that carry behaviour (tags, `data-slot`, `data-rp-*`, `commandfor`, `command`, `popovertarget`, `popover`, `closedby`, ids and id references, `role`, `aria-*`, `hidden`, `disabled`, `name`, `type`, `value`, `tabindex`) are fixed by this document and by `02-html-contract.md` section 8.
- Class names and `data-<prop>` attributes are copied from the ledger where it fixes them; for the rest the component document named in each subsection is normative, and wins if it differs.
- Visible strings are examples. The real strings are locale keys defined in the component documents (D-066).
- "Before upgrade" describes the time between first paint and the element being defined. "Without JavaScript" is the permanent state when the module never runs.

### 10.1 Dialog

Component document: `10-components-interactive.md`. Element: `rp-dialog` (9.1).

```html
<button type="button" class="rp-button" commandfor="size-guide" command="show-modal">Size guide</button>

<rp-dialog class="rp-dialog" data-slot="rp-dialog">
  <dialog id="size-guide" class="rp-dialog-panel" aria-labelledby="size-guide-title" closedby="any">
    <h2 id="size-guide-title" class="rp-dialog-title">Size guide</h2>
    <div class="rp-dialog-body">
      <p>Measure across the chest.</p>
    </div>
    <button type="button" class="rp-icon-button" commandfor="size-guide" command="close" aria-label="Close">
      <svg class="rp-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
  </dialog>
</rp-dialog>
```

Rules: no `open`, `hidden`, `role`, `aria-modal` or `aria-hidden` on the `<dialog>`; no `aria-expanded`, `aria-controls` or `aria-haspopup` on the buttons. Openers and closers may be anywhere in the document. With `defaultOpen` the `<dialog>` additionally has `data-default-open=""`.

| Situation | Behaviour |
|---|---|
| Without JavaScript, browser with Invoker Commands | Fully working: the buttons open and close the modal dialog; Escape and backdrop press close it (`closedby` where supported). |
| Without JavaScript, browser without Invoker Commands | The dialog stays closed and its content is not reachable. For this reason an overlay whose content has a page equivalent MUST use the link opener of 10.2, and content that must be reachable without JS MUST NOT be placed only in a Dialog (`noJs.level: degraded`). |
| Before upgrade | Same as without JavaScript. On Liquid the inline polyfill (3.3) makes commands work from first paint in every browser. A dialog opened before upgrade is adopted in its open state. |
| After upgrade | Adds: `openchange`, polyfilled commands, light-dismiss fallback, focus repair, `data-default-open`, close on navigation. |

### 10.2 Drawer, with a link opener

Component documents: `10-components-interactive.md` (Drawer), `11-components-commerce.md` (CartDrawer), `12-components-chrome-and-blueprints.md` (MobileNav). Element: `rp-dialog`.

```html
<a class="rp-link" href="/cart" data-rp-open="cart-drawer">Cart</a>

<rp-dialog class="rp-drawer" data-slot="rp-dialog">
  <dialog id="cart-drawer" class="rp-drawer-panel" data-side="end" aria-labelledby="cart-drawer-title" closedby="any">
    <h2 id="cart-drawer-title" class="rp-drawer-title">Cart</h2>
    <div role="status" data-rp-part="status"></div>
    <div class="rp-drawer-body">
      <p>Your cart is empty.</p>
    </div>
    <button type="button" class="rp-icon-button" commandfor="cart-drawer" command="close" aria-label="Close">
      <svg class="rp-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
  </dialog>
</rp-dialog>
```

Rules: a Drawer is a Dialog with root class `rp-drawer`, panel class `rp-drawer-panel` and `data-side` (`start`, `end` or `bottom`). The opener of an overlay that has a page equivalent MUST be `<a href="<page>" data-rp-open="<dialog id>">` (D-009); the server MUST NOT print `aria-haspopup`, `aria-controls`, `role="button"` or `commandfor` on it. A Drawer without a page equivalent uses the button opener of 10.1.

| Situation | Behaviour |
|---|---|
| Without JavaScript | The link navigates to `/cart`. Full function through the page. |
| Before upgrade | The link navigates. |
| After upgrade | An unmodified primary click opens the drawer; modified clicks (new tab, new window) navigate. The runtime adds `aria-haspopup="dialog"` and `aria-controls="cart-drawer"` to the link. |

### 10.3 Popover

Component document: `10-components-interactive.md`. No custom element, no JavaScript.

```html
<button type="button" class="rp-button" popovertarget="shipping-info">Shipping</button>

<div id="shipping-info" popover class="rp-popover" data-side="bottom" data-align="start">
  <p>Free shipping on orders over $50.</p>
  <a class="rp-link" href="/policies/shipping-policy">Shipping policy</a>
</div>
```

Rules: `popover` with no value (auto: light dismiss, Escape, one open at a time). No `hidden` on the panel, no `aria-expanded` on the button, no `popover="manual"`. Position is CSS (`03-styling-and-tokens.md`).

| Situation | Behaviour |
|---|---|
| Without JavaScript | Fully working natively. |
| Before and after upgrade | Identical; Ripple JavaScript does not touch a Popover. The polyfill adds `command="toggle-popover"`, `show-popover`, `hide-popover` for buttons that use `commandfor` instead of `popovertarget`; `popovertarget` is preferred because it needs no polyfill. |
| Browser without the popover API | The panel is ordinary content in the flow and the button does nothing (ledger issue L-8). |

### 10.4 Tooltip

Component document: `10-components-interactive.md`. Elements: `ui-tooltip` family, chunk `tooltip`.

```html
<ui-tooltip id="size-tip" class="rp-tooltip">
  <ui-tooltip-trigger><button type="button" class="rp-icon-button" aria-label="Sizing information" aria-describedby="size-tip-content" data-slot="tooltip-trigger">
    <svg class="rp-icon" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
  </button></ui-tooltip-trigger>
  <ui-tooltip-content class="rp-tooltip-content" hidden id="size-tip-content" role="tooltip" data-closed data-slot="tooltip-content">Runs small</ui-tooltip-content>
</ui-tooltip>
```

Rules: root `id` REQUIRED; content id is `<id>-content`. The trigger is a native `<button type="button">` or `<a href>` inside `ui-tooltip-trigger`, carries `data-slot="tooltip-trigger"`, has its own accessible name, and references the content with `aria-describedby`. The content is printed with `hidden` and `data-closed`. With this markup the upgrade writes nothing (verified, spike line "upgrade: zero mutations").

| Situation | Behaviour |
|---|---|
| Without JavaScript | The tooltip never shows (`noJs.level: none`). The trigger keeps its accessible name, and assistive technology still reads the description through `aria-describedby`. The tooltip MUST NOT be the only place a piece of information appears for sighted users who need it to complete a task. |
| Before upgrade | Same. The trigger works as a button or link. |
| After upgrade | Hover shows the content (verified in the spike); keyboard focus shows it (`uisdk/packages/web/src/tooltip.ts`, reason `trigger-focus`; not exercised by the spike). UI SDK writes `data-open`, `popover="manual"` and an inline `style` on the content while open; these are post-upgrade writes. |

### 10.5 Menu (not in V1): action list in a Popover

There is no `role="menu"` component (D-018). An action list is a Popover (10.3) that contains links and buttons:

```html
<button type="button" class="rp-icon-button" popovertarget="order-actions" aria-label="Order actions">
  <svg class="rp-icon" aria-hidden="true" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
</button>

<div id="order-actions" popover class="rp-popover" data-side="bottom" data-align="end">
  <ul class="rp-link-list">
    <li><a class="rp-link" href="/account/orders/1001">View order</a></li>
    <li><a class="rp-link" href="/account/orders/1001/invoice">Download invoice</a></li>
    <li><button type="button" class="rp-button" popovertarget="order-actions" popovertargetaction="hide">Close</button></li>
  </ul>
</div>
```

Rules: no `role="menu"`, `role="menuitem"` or arrow-key roving; items are reached with Tab. Behaviour is that of 10.3.

### 10.6 Toast

Component document: `10-components-interactive.md`. Element: `ui-toast-region`, chunk `toast`.

One region per page, printed empty by the layout blueprint (`12-components-chrome-and-blueprints.md`):

```html
<ui-toast-region class="rp-toast-region" aria-label="Notifications" data-slot="toast-region" data-side="bottom" data-align="end" popover="manual"></ui-toast-region>
```

Rules:

1. The server prints no toast markup. Messages produced by the server use Banner or FormMessage.
2. At upgrade UI SDK writes inline `style` variables on the region and appends `<ol data-slot="toast-list">`. These writes are allow-list entry 2 of `02-html-contract.md` section 7.3. With the four attributes `data-slot`, `data-side`, `data-align`, `popover` printed as above, they are not written again (verified).
3. A toast is shown only by the helper:

```ts
import { toast } from "<pkg>/elements"   // browser files: from the main file URL; Liquid: from "ripple"

await toast("Added to cart", { description: "Linen shirt, size M", type: "success", duration: 5000 })
```

`toast(title: string, options?: ToastOptions): Promise<void>`. `ToastOptions` is exactly: `id?: string`, `description?: string`, `type?: "default" | "success" | "error" | "warning" | "info" | "loading"`, `duration?: number` (milliseconds), `priority?: "polite" | "assertive"`. The helper loads the chunk on first use and resolves after UI SDK's `toast()` has been called; when the chunk fails to load it resolves without showing anything. Action buttons inside toasts are not supported in V1.

4. `toast()` MUST NOT be called while a modal dialog is open (9.1 item 9).
5. A page with no `ui-toast-region` shows no toasts: UI SDK has no region to render into. UNVERIFIED whether UI SDK creates a region itself in that case; Ripple layouts always print one.

| Situation | Behaviour |
|---|---|
| Without JavaScript | The region is empty and invisible. No toast exists; every flow that would toast reloads a page that shows a Banner or FormMessage (`noJs.level: none`). |
| Before upgrade | Same. |
| After upgrade | `toast()` renders `ui-toast` elements inside the region. |

### 10.7 Tabs

Component document: `10-components-interactive.md`. Elements: `ui-tabs` family, chunk `tabs`.

Example with `id="info"`, two tabs, `details` selected, horizontal:

```html
<ui-tabs id="info" class="rp-tabs" default-value="details" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs">
  <ui-tabs-list class="rp-tabs-list" aria-label="Product information" role="tablist" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-list">
    <ui-tabs-tab value="details" role="none"><button type="button" class="rp-tabs-tab" role="tab" id="info-tab-details" aria-controls="info-panel-details" aria-selected="true" tabindex="0" data-selected data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-tab">Details</button></ui-tabs-tab>
    <ui-tabs-tab value="shipping" role="none"><button type="button" class="rp-tabs-tab" role="tab" id="info-tab-shipping" aria-selected="false" tabindex="-1" data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-tab">Shipping</button></ui-tabs-tab>
  </ui-tabs-list>
  <ui-tabs-panel class="rp-tabs-panel" value="details" role="tabpanel" id="info-panel-details" aria-labelledby="info-tab-details" tabindex="0" data-selected data-activation-direction="none" data-orientation="horizontal" data-slot="tabs-panel">
    <p>100% linen.</p>
  </ui-tabs-panel>
  <ui-tabs-panel class="rp-tabs-panel" value="shipping" hidden data-slot="tabs-panel">
    <p>Ships in two days.</p>
  </ui-tabs-panel>
</ui-tabs>
```

Rules, per element (this is the exact snapshot UI SDK produces; any difference causes attribute writes at upgrade):

| Element | Attributes, in addition to class |
|---|---|
| `ui-tabs` | `id` (REQUIRED), `default-value="<selected value>"`, `data-activation-direction="none"`, `data-orientation="horizontal"` or `"vertical"`, `data-slot="tabs"`. Never the live `value` attribute. |
| `ui-tabs-list` | `aria-label`, `role="tablist"`, `data-activation-direction="none"`, `data-orientation`, `data-slot="tabs-list"` |
| `ui-tabs-tab` (every one) | `value="<value>"`, `role="none"`. Contains exactly one `<button type="button">`. |
| selected tab `<button>` | `role="tab"`, `id="<id>-tab-<value>"`, `aria-controls="<id>-panel-<value>"`, `aria-selected="true"`, `tabindex="0"`, `data-selected`, `data-activation-direction="none"`, `data-orientation`, `data-slot="tabs-tab"` |
| every other tab `<button>` | `role="tab"`, `id="<id>-tab-<value>"`, `aria-selected="false"`, `tabindex="-1"`, `data-activation-direction="none"`, `data-orientation`, `data-slot="tabs-tab"`. NO `aria-controls` (its panel is hidden; UI SDK adds the reference when the panel is shown). |
| selected `ui-tabs-panel` | `value`, `role="tabpanel"`, `id="<id>-panel-<value>"`, `aria-labelledby="<id>-tab-<value>"`, `tabindex="0"`, `data-selected`, `data-activation-direction="none"`, `data-orientation`, `data-slot="tabs-panel"` |
| every other `ui-tabs-panel` | `value`, `hidden`, `data-slot="tabs-panel"` and nothing else |

Exactly one tab is selected. How a `value` becomes part of an id: `02-html-contract.md` section 3.3.

| Situation | Behaviour |
|---|---|
| Without JavaScript | `noJs.level: degraded`. Static CSS under `@media (scripting: none)` shows every panel and hides the tab list (`03-styling-and-tokens.md`; support UNVERIFIED, SPIKE-06). Where that media feature is unsupported only the default panel is readable; content that must be reachable belongs in an Accordion. |
| Before upgrade | The default panel is visible. Tab buttons are focusable and do nothing until the chunk has loaded. |
| After upgrade | UI SDK tabs: click and arrow keys select; `valuechange` (reason `item-press` for a click) is dispatched on `ui-tabs`. |

### 10.8 Accordion

Component document: `10-components-interactive.md`. No custom element, no JavaScript.

Example with `id="faq"` and `type="single"`:

```html
<div class="rp-accordion" id="faq">
  <details class="rp-accordion-item" name="faq" open>
    <summary class="rp-accordion-trigger">Shipping</summary>
    <div class="rp-accordion-content">
      <p>Ships in two days.</p>
    </div>
  </details>
  <details class="rp-accordion-item" name="faq">
    <summary class="rp-accordion-trigger">Returns</summary>
    <div class="rp-accordion-content">
      <p>Thirty days.</p>
    </div>
  </details>
</div>
```

Rules: with `type="single"` every item has `name="<accordion id>"` and at most one has `open`; with `type="multiple"` no item has `name`. No `role` or `aria-expanded` on `<summary>`; no `hidden` on the content.

| Situation | Behaviour |
|---|---|
| Without JavaScript | Fully working natively (`noJs.level: full`). In a browser without `<details name>` support (UNVERIFIED which, SPIKE-06) several items of a `single` accordion can be open at once; nothing else changes. |
| Before and after upgrade | Identical; Ripple JavaScript does not touch an Accordion. |

### 10.9 Carousel

Component document: `10-components-interactive.md`. Element: `rp-carousel` (9.2).

Example with `id="featured"`:

```html
<rp-carousel class="rp-carousel" data-slot="rp-carousel" id="featured" role="group" aria-roledescription="carousel" aria-label="Featured products">
  <button type="button" class="rp-icon-button" data-rp-part="prev" data-rp-js="inflow" aria-controls="featured-list" aria-label="Previous" disabled>
    <svg class="rp-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>
  </button>
  <ul class="rp-carousel-viewport" id="featured-list" data-rp-part="viewport" tabindex="0">
    <li class="rp-carousel-item" data-rp-part="item"><a class="rp-link" href="/products/linen-shirt">Linen shirt</a></li>
    <li class="rp-carousel-item" data-rp-part="item"><a class="rp-link" href="/products/wool-socks">Wool socks</a></li>
    <li class="rp-carousel-item" data-rp-part="item"><a class="rp-link" href="/products/canvas-tote">Canvas tote</a></li>
  </ul>
  <button type="button" class="rp-icon-button" data-rp-part="next" data-rp-js="inflow" aria-controls="featured-list" aria-label="Next">
    <svg class="rp-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>
  </button>
</rp-carousel>
```

Rules: root `id` REQUIRED; the viewport id is `<id>-list`. The viewport is the scroll container (CSS: `overflow-x: auto; scroll-snap-type: x mandatory`; each item `scroll-snap-align: start`; owned by the component CSS) and has `tabindex="0"` so that arrow keys scroll it. `prev` is printed with `disabled`; `next` is printed without it (9.2 item 6). The two buttons MUST be outside the viewport. No `aria-hidden`, `inert` or `hidden` on slides.

| Situation | Behaviour |
|---|---|
| Without JavaScript | The list scrolls and snaps by touch, trackpad, mouse wheel and keyboard. The two buttons are invisible but keep their space (`rp-carousel:not(:defined) [data-rp-js="inflow"]`). `noJs.level: degraded` only because the buttons are missing. |
| Before upgrade | Same. |
| After upgrade | Buttons appear and page the list; `disabled` follows the scroll position; `indexchange` is dispatched. |

### 10.10 Select

Component document: `09-components-foundation.md`. No custom element, no JavaScript.

```html
<label class="rp-label" for="sort">Sort by</label>
<select class="rp-select" id="sort" name="sort_by">
  <option value="manual" selected>Featured</option>
  <option value="price-ascending">Price, low to high</option>
  <option value="price-descending">Price, high to low</option>
</select>
```

Rules: native `<select>` only; state is the native `selected`, `disabled`, `required` attributes; no `aria-selected`, `aria-required` or `aria-disabled`. A select that must apply its value without a submit button is a commerce concern (SortSelect inside `rp-live`, `05-commerce.md`); the Select itself has no behaviour.

| Situation | Behaviour |
|---|---|
| Without JavaScript, before upgrade, after upgrade | Identical and native. |

### 10.11 Combobox (not in V1)

There is no combobox, autocomplete or listbox component, and `ui-combobox` is prohibited (D-014). Use:

- a fixed set of options: Select (10.10);
- search suggestions: PredictiveSearch, a real GET search form inside `rp-predictive-search` whose results are a refreshed region of links (`11-components-commerce.md`, `05-commerce.md`). It prints no `role="combobox"` and no `role="listbox"`.

### 10.12 Checkbox, RadioGroup, Switch

Component document: `09-components-foundation.md`. No custom element, no JavaScript.

```html
<input class="rp-checkbox" type="checkbox" id="gift" name="gift" value="yes">
<label class="rp-label" for="gift">This is a gift</label>

<fieldset class="rp-radio-group">
  <legend class="rp-label">Size</legend>
  <input class="rp-radio" type="radio" id="size-s" name="Size" value="S" checked>
  <label class="rp-label" for="size-s">S</label>
  <input class="rp-radio" type="radio" id="size-m" name="Size" value="M">
  <label class="rp-label" for="size-m">M</label>
</fieldset>

<input class="rp-switch" type="checkbox" role="switch" id="subscribe" name="subscribe" value="1">
<label class="rp-label" for="subscribe">Subscribe and save</label>
```

Rules: native inputs only; Switch is `<input type="checkbox" role="switch">`; state is the native `checked` and `disabled`; no `aria-checked`. Radio buttons of one group share `name`; arrow-key movement inside the group is native.

| Situation | Behaviour |
|---|---|
| Without JavaScript, before upgrade, after upgrade | Identical and native. The controls submit with their form. |

### 10.13 Slider (not in V1)

There is no slider component and `ui-slider` is prohibited. A numeric range filter is PriceRange (`11-components-commerce.md`). A single bounded number is Input with `type="number"` or QuantityInput (10.14).

### 10.14 QuantityInput

Component document: `10-components-interactive.md`. Element: `rp-quantity`. The complete markup, rules and behaviour are in section 8.1 and 8.2.

| Situation | Behaviour |
|---|---|
| Without JavaScript | The number input works and submits. The buttons are invisible but keep their space. `noJs.level: degraded` only because the buttons are missing. |
| Before upgrade | Same. |
| After upgrade | Buttons step the value; `valuechange` is dispatched; changes are announced. |

### 10.15 NavigationMenu

Component document: `12-components-chrome-and-blueprints.md`. Element: `rp-navigation-menu` (9.3).

Example with `id="main-nav"`:

```html
<rp-navigation-menu class="rp-navigation-menu" data-slot="rp-navigation-menu" id="main-nav">
  <nav aria-label="Main">
    <ul class="rp-navigation-menu-list">
      <li class="rp-navigation-menu-item" data-rp-part="item">
        <a class="rp-navigation-menu-link" href="/collections/all" aria-current="page">Shop</a>
        <button type="button" class="rp-navigation-menu-trigger" popovertarget="main-nav-content-shop" aria-label="Shop submenu">
          <svg class="rp-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div id="main-nav-content-shop" popover class="rp-navigation-menu-content">
          <ul class="rp-link-list">
            <li><a class="rp-link" href="/collections/shirts">Shirts</a></li>
            <li><a class="rp-link" href="/collections/socks">Socks</a></li>
          </ul>
        </div>
      </li>
      <li class="rp-navigation-menu-item" data-rp-part="item">
        <a class="rp-navigation-menu-link" href="/pages/about">About</a>
      </li>
    </ul>
  </nav>
</rp-navigation-menu>
```

Rules: root `id` REQUIRED. Every top-level item is an `<li data-rp-part="item">`. An item with a URL has a real `<a href>`. An item with children additionally has, in this order after the link, a disclosure `<button type="button" popovertarget="<panel id>">` with its own accessible name, and the panel `<div id="<panel id>" popover>` INSIDE the same `<li>` (hover intent relies on the panel being a descendant of the item). An item with children and no URL has the button only, with the item's label as its visible text. The panel id MUST be unique in the document; its derivation is defined by `12-components-chrome-and-blueprints.md` (this example uses `<id>-content-<handle>`). The disclosure buttons are NOT marked `data-rp-js`: they work natively. No `aria-expanded` on the buttons. `aria-current="page"` on the link to the current URL.

| Situation | Behaviour |
|---|---|
| Without JavaScript | Every top-level link navigates. Each disclosure button opens its panel natively; Escape and outside press close it. Full function. |
| Before upgrade | Same. |
| After upgrade | Adds hover intent and arrow-key movement between top-level items. |

MobileNav is a Drawer (10.2) whose opener is `<a href="#<footer menu id>" data-rp-open="<id>">` and whose body holds nested `<details>` (10.8 markup without `name`) for sublevels; contract in `12-components-chrome-and-blueprints.md`. It adds no element beyond `rp-dialog`.

### 10.16 Static CSS this section depends on

Owned by `03-styling-and-tokens.md`; listed here as requirements that the behaviour layer relies on. Test E-18 checks each.

| # | Requirement |
|---|---|
| C-1 | `:where([hidden]:not([hidden="until-found"])) { display: none !important }` in the earliest layer (D-021 item 2). |
| C-2 | A static `display` for every tag of section 1: `block` for `rp-dialog`, `rp-carousel`, `rp-quantity`, `rp-navigation-menu`, `ui-tabs`, `ui-tabs-list`, `ui-tabs-panel`, `ui-toast-region`; `contents` for `ui-tabs-tab`, `ui-tooltip-trigger`. |
| C-3 | `rp-dialog { position: absolute; inline-size: 0; block-size: 0; }` (9.1). |
| C-4 | `rp-quantity:not(:defined) [data-rp-js="inflow"]` and `rp-carousel:not(:defined) [data-rp-js="inflow"]` are `visibility: hidden`. No rule hides the disclosure buttons of NavigationMenu. |
| C-5 | Component CSS never sets `display` on `dialog` or `[popover]` except under `[open]` and `:popover-open` respectively. Otherwise a closed dialog or popover becomes visible. |
| C-6 | Under `@media (scripting: none)`: every `ui-tabs-panel` is displayed (overriding C-1 for panels) and `ui-tabs-list` is not displayed (D-012). |

---

## 11. Events and state attributes

### 11.1 Element events

Every element event follows D-023: one lowercase word, dispatched on the component ROOT, `bubbles: false`.

| Event | Dispatched on | `detail.value` | Cancelable | `detail.reason` values |
|---|---|---|---|---|
| `openchange` | `rp-dialog` | `boolean` | yes (9.1 item 3) | `trigger-press`, `close-press`, `escape-key`, `outside-press`, `link-press`, `imperative` |
| `valuechange` | `rp-quantity` | `number` | yes | `increment-press`, `decrement-press`, `input-commit`, `imperative` |
| `indexchange` | `rp-carousel` | `number` | no effect | `next-press`, `previous-press`, `scroll`, `imperative` |
| `valuechange` | `ui-tabs` | `string` (the tab value) | yes (UI SDK) | UI SDK's; `item-press` for a click (verified). Other values: `uisdk/packages/core/src/foundation/kernel/details.ts` |
| `openchange` | `ui-tooltip` | `boolean` | UI SDK's | UI SDK's (`trigger-hover`, `trigger-focus`, `escape-key` in the vocabulary; not exercised by the spike) |
| `action` | commerce elements | `05-commerce.md` | `05-commerce.md` | `05-commerce.md` |

Common rules:

1. `event.detail` is `{ value, reason, source }`. `source` is how the user caused the change: `mouse`, `touch`, `pen`, `keyboard`, `virtual`, `programmatic` or `agent`.
2. Because the events do not bubble, a listener MUST be added on the root itself, or in the capture phase on an ancestor: `document.addEventListener("openchange", handler, true)` (verified). `event.target` is the root.
3. Writes through an element property or attribute fire no event (D-023 item 1).
4. `rp-navigation-menu` dispatches no event. Native elements dispatch their native events only (`toggle` on `<details>` and on popovers, `change` and `input` on form controls, `close` on `<dialog>`).
5. React callback names and signatures (`onOpenChange(value, detail)`): `06-bindings.md`.
6. Document events `rp:refresh` and `rp:refreshed`: `05-commerce.md`. No non-commerce element dispatches or listens to them; non-commerce elements survive a refresh by rule R-5.

Listening example (complete):

```html
<script type="module">
  const host = document.getElementById("cart-drawer").parentElement
  host.addEventListener("openchange", (event) => {
    console.log(event.detail.value, event.detail.reason)
  })
</script>
```

### 11.2 Reason vocabulary used by Ripple elements

A subset of the UI SDK vocabulary (`uisdk/packages/core/src/foundation/kernel/details.ts`). Ripple elements MUST NOT invent a reason outside this table.

| Reason | Meaning in Ripple |
|---|---|
| `trigger-press` | An opener was activated |
| `close-press` | A closer was activated |
| `escape-key` | Escape or a platform close request |
| `outside-press` | A press on the backdrop |
| `link-press` | A navigation started |
| `increment-press`, `decrement-press` | A stepper button |
| `input-commit` | The user committed typed text |
| `next-press`, `previous-press` | A carousel button |
| `scroll` | The user scrolled |
| `imperative` | A public method or other script, with no user event |

### 11.3 State attributes written by the behaviour layer

D-021 item 1 lists the allowed names. This table is the complete list of what the non-commerce behaviour layer actually writes after upgrade.

| Written by | On | Attribute or property |
|---|---|---|
| browser (native) | `<dialog>` | `open` |
| browser (native) | `<details>` | `open` |
| browser (native) | form controls | `checked`, `value`, `selected` (properties) |
| runtime opener | `a[data-rp-open]` | `aria-haspopup="dialog"`, `aria-controls` (once, at upgrade; allow-listed) |
| `rp-quantity` | decrement and increment buttons | `disabled` |
| `rp-quantity` | the input | `value` property |
| `rp-carousel` | `prev` and `next` buttons | `disabled` |
| `rp-dialog` | nothing | The root and the dialog get no attribute from the element |
| `rp-navigation-menu` | nothing | |
| UI SDK Tabs | tab buttons, panels | `aria-selected`, `tabindex`, `data-selected`, `aria-controls`, `hidden`, `role`, `id`, `aria-labelledby`, `data-activation-direction` |
| UI SDK Tooltip | content | `hidden`, `data-open`, `data-closed`, `popover`, `style` |
| UI SDK Toast | region and its children | allow-list entry 2 of `02-html-contract.md` section 7.3 |

CSS selects state through these names only: `dialog[open]`, `details[open]`, `:popover-open`, `:disabled`, `:checked`, `[aria-selected="true"]`, `[data-selected]`, `[data-open]`, `[data-closed]`, `[hidden]`. `data-state` MUST NOT be used (D-021).

### 11.4 Hook attributes read by the behaviour layer

| Attribute | Read by | Values |
|---|---|---|
| `data-slot` | UI SDK kernel | the tag name on an `rp-*` root; UI SDK part names on `ui-*` parts (`tabs`, `tabs-list`, `tabs-tab`, `tabs-panel`, `tooltip-trigger`, `tooltip-content`, `toast-region`) |
| `data-rp-part` | `rp-*` elements | `input`, `increment`, `decrement` (`rp-quantity`); `viewport`, `item`, `prev`, `next` (`rp-carousel`); `item` (`rp-navigation-menu`); `status` (announcer, inside a `<dialog>`) |
| `data-rp-open` | runtime opener | id of a `<dialog>` |
| `data-default-open` | `rp-dialog` | empty |
| `data-rp-js` | CSS only (generated rules) | `inflow` on the buttons of `rp-quantity` and `rp-carousel`. The behaviour layer of this document uses neither `overlay` nor `fallback`. |
| `commandfor`, `command` | browser, polyfill | id; `show-modal`, `close`, `show-popover`, `hide-popover`, `toggle-popover` |
| `popovertarget`, `popovertargetaction`, `popover`, `closedby`, `name` on `<details>` | browser | native |

---

## 12. Agent surface

Two audiences (D-065). The tool surface of the bridge and the agent kit are owned by `08-agent-kit-and-evals.md`; this section fixes what the elements declare.

### 12.1 Any browser agent

Served by the markup of section 10: real links, native buttons, native form controls, native dialogs and popovers, correct roles and names. Nothing in this layer is reachable only through JavaScript, except Tooltip content and toasts.

### 12.2 In-page agent through the UI SDK bridge

The bridge is opt-in and is never loaded by default. Ways to load it:

| Host | Code |
|---|---|
| bundled app | `import { createAgent } from "<pkg>/agent"` |
| `html`, `remix` | `const { createAgent } = await (await import("/ripple/ripple.js")).loadAgent()` |
| `liquid` | `const { createAgent } = await import("ripple/agent")` |

The bridge lists every connected `ui-*` and `rp-*` primitive whose root passes `checkVisibility()`, with the methods named in the primitive's `agent` key. Declared actions (the complete list for this document):

| Element | `agent.actions` | Arguments |
|---|---|---|
| `rp-dialog` | `open`, `close` | none |
| `rp-quantity` | `setValue`, `increment`, `decrement` | `setValue(value: number)` |
| `rp-carousel` | `next`, `previous`, `goTo` | `goTo(index: number)` |
| `rp-navigation-menu` | `close` | none |
| `ui-tabs`, `ui-tooltip`, `ui-toast-region` | defined by UI SDK | `uisdk/packages/web/src/tabs.ts`, `tooltip.ts`, `toast.ts` |
| commerce elements | `05-commerce.md` | |

Verified in the spike: the snapshot lists `rp-dialog` (with `open`, `close` and a generic `press` for the buttons inside it), `rp-quantity`, `rp-carousel` (with its `aria-label` as label) and `rp-navigation-menu`; `act` with action `increment` on `rp-quantity` changed the value from 4 to 5 and reported the change.

Rules:

1. Every public method that changes state MUST be in `agent.actions`. Getters MUST NOT.
2. An action MUST NOT spend money, submit an order or delete data. An element whose action can do so (commerce) follows `05-commerce.md` and `08-agent-kit-and-evals.md`.
3. A root gets a label in the snapshot only from its own accessible name. `rp-carousel` has `aria-label`. `rp-dialog`, `rp-quantity` and `rp-navigation-menu` roots have none and appear by tag name; whether they need one is a decision for `08-agent-kit-and-evals.md` (ledger issue L-11).

### 12.3 `data-agent-confirm`, `data-agent-secret`, `data-agent-hidden`

These are the only `data-agent-*` attributes (D-065).

| Attribute | On | Value | Effect in the bridge |
|---|---|---|---|
| `data-agent-confirm` | a native control (button, link, submit button) | One sentence that says what the control does, in the page language | The bridge refuses to activate the control and answers that a person must do it. Verified: for `<button data-agent-confirm="Closes the size guide">Close</button>` inside `rp-dialog`, `act` returned `Needs a person: "Closes the size guide". Ask them to press "Close" themselves.` and the dialog stayed open (`ripple/docs/research/spikes/elements-runtime/results-agent-confirm.txt`). |
| `data-agent-secret` | a form control | empty | The bridge does not reveal the control's value (`uisdk/apps/docs/content/docs/agents/connect-an-agent/permissions.mdx`; not exercised by the spike) |
| `data-agent-hidden` | any element | empty | The bridge omits the element and its subtree (same source; not exercised by the spike) |

Rules:

1. A control that starts checkout, places an order, submits payment or account data, or deletes something MUST carry `data-agent-confirm`. The list of such controls per component is in the component documents and the manifest key `agent.confirm`.
2. The value MUST be a complete sentence. It is user-visible text to the agent's user and is a locale key (D-066).
3. These attributes do nothing for agents that drive the browser from outside; such agents see the accessibility tree. `08-agent-kit-and-evals.md` states what host agents MUST do with them.
4. Whether the bridge enforces confirmation for a METHOD listed in `agent.actions` (as opposed to a native control) is SPIKE-08, owned by `08-agent-kit-and-evals.md`. No element of this document needs it.

---

## 13. Acceptance tests

Tiers are those of D-063. Every test runs in Chromium; tests marked X also run in WebKit and Gecko (tier 9). "Page P" is one page that contains the markup of sections 8.1, 10.1, 10.2, 10.4, 10.6, 10.7, 10.9 and 10.15, loaded with `browser/ripple.elements.js` and the static CSS of 10.16. The spike page `ripple/docs/research/spikes/elements-runtime/site/index.html` is such a page and `test.mjs` there implements E-01 to E-17 and E-20.

| Id | Tier | Steps | Expected |
|---|---|---|---|
| E-01 X | 3 | Load page P with a `MutationObserver` on `document` installed by a classic script at the end of `<body>`, before modules run. Wait until `rp-dialog`, `ui-tabs`, `ui-tooltip`, `ui-toast-region` are defined. Ignore records whose new value equals the old value. | Zero mutations inside `rp-dialog`, `rp-quantity`, `rp-carousel`, `rp-navigation-menu`, `ui-tabs`, `ui-tooltip`. Inside `ui-toast-region`: only `style` attribute writes and child insertion. On `a[data-rp-open]`: only `aria-haspopup`, `aria-controls`. |
| E-02 | 5 | On page P, record script requests. | Requested: `ripple.elements.js`, `ripple.elements-tabs.js`, `ripple.elements-tooltip.js`, `ripple.elements-toast.js`, `ripple.elements-shared.js`, each once. Not requested: `ripple.elements-agent.js`. |
| E-03 | 5 | Load a page that contains only the markup of 8.1. | Only `ripple.elements.js` is requested. |
| E-04 | 5 | On the page of E-03, insert the Tabs markup of 10.7 with `insertAdjacentHTML`. | `ripple.elements-tabs.js` is requested once; clicking the second tab selects it. |
| E-05 X | 5 | Click the opener button of 10.1; press Escape. | `openchange` `{ value: true, reason: "trigger-press" }`, then `{ value: false, reason: "escape-key" }`; focus is on the opener button. |
| E-06 X | 5 | Open the dialog; click its close button. Open it; click the backdrop at viewport coordinate (2, 2). | Reasons `close-press`, then `outside-press`; the dialog is closed after each. |
| E-07 | 5 | Add an `openchange` listener that calls `preventDefault()` when `detail.value` is `true`; click the opener. | `dialog.open === false` after 50 ms. |
| E-08 | 5 | `host.api.open()`, `host.api.close()`, `host.open = true`. | Two `openchange` events with reason `imperative`; the property write opens the dialog and fires no event. |
| E-09 | 5 | After E-05 to E-08: read the outer HTML of the `rp-dialog` opening tag. | Identical to the server markup (no attribute added). |
| E-10 X | 5 | Click the link of 10.2. Then Ctrl+click it (Meta+click on macOS). | First: the drawer opens, the URL does not change, the link has `aria-haspopup="dialog"` and `aria-controls="cart-drawer"`. Second: no `openchange`; the browser's default action runs. |
| E-11 | 5 | Open a dialog; call `history.pushState({}, "", "?x=1")`; then click a same-origin link inside the dialog (Chromium, Navigation API). | The dialog is open after `pushState`; it is closed, with reason `link-press`, after the link click. |
| E-12 | 5 | Load the Dialog markup with `data-default-open=""` on the `<dialog>`. | After upgrade `dialog.open === true` and `dialog.matches(":modal")`. Remove the `rp-dialog` from the document, close the dialog, re-insert: it stays closed. |
| E-13 X | 5 | Section 8.6 cases Q-2 to Q-12. | As listed there. |
| E-14 X | 5 | Carousel of 10.9 sized so that 3 of 6 items fit: click `next` until it is disabled; call `api.goTo(1)`; set `element.index = 0`; scroll the viewport with the mouse wheel. | `indexchange` with reason `next-press` for each press; `prev` enabled and `next` disabled at the end; `goTo` gives reason `imperative` and index 1; the property write fires no event; the wheel scroll gives reason `scroll`. |
| E-15 X | 5 | NavigationMenu of 10.15: hover the first item with a mouse pointer for 200 ms; move to an item without a panel and wait 300 ms; focus the first link and press ArrowRight, End, Home, ArrowDown, Escape; click a disclosure button. | Panel opens (`:popover-open`); panel closes; focus moves to the second item, the last, the first; the panel opens and its first link has focus; Escape closes the panel; the button toggles the panel. |
| E-16 | 5 | Call `toast("Saved")` imported from the main file. | A `ui-toast` element with the text `Saved` is inside `ui-toast-region`. |
| E-17 | 5 | Load the bridge with `loadAgent()`, call `createAgent().snapshot()`. | Entries exist for `rp-quantity` with actions `setValue`, `increment`, `decrement`; for `rp-dialog` including `open`, `close`; for `rp-carousel` including `next`, `previous`, `goTo`. `act` with `increment` on `rp-quantity` increases the input's value by its step. |
| E-18 | 5 | On page P with scripting enabled, before any click: computed styles. | `display` of each tag equals 10.16 C-2; `rp-dialog` has `position: absolute` and a 0 by 0 box and `checkVisibility() === true`; closed `<dialog>` and closed `[popover]` have `display: none`; with the module blocked, the `data-rp-js="inflow"` buttons have `visibility: hidden` and a non-zero box. |
| E-19 X | 6 | Page P with scripting disabled. | The quantity input accepts typing; the carousel viewport scrolls (`scrollLeft` changes after a wheel event); the link of 10.2 navigates to its `href`; a NavigationMenu disclosure button opens its panel; the Accordion of 10.8 toggles; in Chromium the opener button of 10.1 opens the dialog. |
| E-20 | 5 | Liquid form: a page with the import map of 5.4 pointing at `pkg/registry/liquid/assets/` and the markup of page P. | Each of `ripple.js`, `ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`, `ripple-shared.js` is requested exactly once; tabs select on click; the bridge loaded with `import("ripple/agent")` lists both a `ui-tabs` and an `rp-quantity` entry (one kernel). |
| E-21 | 1 | Search the text of every file in `pkg/registry/liquid/assets/*.js` for `from"./`, `from "./`, `import("./`, `import"./`. | No match. |
| E-22 | 10 | Gzip (level 9) each file of `pkg/browser/`. | Within `size-budget.json` (D-064); `ripple-shared.js` and `ripple.elements-shared.js` each at most 10,000 bytes (L-1). |
| E-23 X | 5 | Page with the inline script of 3.3 and, before it, a script that deletes `HTMLButtonElement.prototype.commandForElement`. Click the opener; click the closer. In WebKit and Gecko builds without Invoker Commands, omit the deleting script. | The dialog opens and closes; the dialog receives a `command` event whose `source` is the pressed button; `window.rpCommandsPolyfill === true`; `openchange` reasons are `trigger-press`, `close-press`. |
| E-24 | 1 | Static check over `src/elements/rp-*.ts` and `src/commerce/rp-*.ts`. | Each file: contains exactly one `definePrimitive(` and one `createParts(`; the `createParts` argument has only the key `root`; `display` is `"block"`; `name` equals the file's base name; contains no `data-state`; imports `announce` only from `../runtime/announcer` or `../runtime/index`. |
| E-25 | 5 | Make `import("./ripple.elements-tabs.js")` fail (block the request). | One `console.error` starting with `[ripple] chunk "tabs" failed to load`; `rp-quantity` and `rp-dialog` still work; the default tab panel is visible. |

---

## 14. Evidence and UNVERIFIED

Evidence:

| Claim | Where |
|---|---|
| Root-only primitives work; zero-mutation upgrade; events; property writes; replacement; reconnect; bridge | `ripple/docs/research/spikes/elements-runtime/results-test.txt` (52 passed), `results-dialog2.txt` (5 passed) |
| One Rollup build per main file gives main + chunks + one shared file; sizes | `ripple/docs/research/spikes/elements-runtime/results-build.txt`, `src/gen/browser-bundles.ts` there |
| Bare-specifier form behind one import map, one instance per file | `ripple/docs/research/spikes/elements-runtime/results-liquid.txt` |
| Inline polyfill and module polyfill coordinate | `ripple/docs/research/spikes/elements-runtime/results-polyfill.txt` |
| `data-agent-confirm` on a native button inside an `rp-*` root is honoured | `ripple/docs/research/spikes/elements-runtime/results-agent-confirm.txt` |
| Zero-diff Tabs and Tooltip markup; Toast region writes | `ripple/docs/research/uisdk-web-elements.md` sections 3, 9; `uisdk/packages/web/src/tabs.ts`, `tooltip.ts`, `toast.ts` |
| Kernel authoring API | `uisdk/apps/docs/content/docs/core/kernel/define-a-primitive.mdx`; `uisdk/packages/web/src/define-element.ts`; `uisdk/apps/docs/content/docs/web-components/custom-parts.mdx` |
| Change details and reasons | `uisdk/packages/core/src/foundation/kernel/details.ts` |
| Bridge visibility test | `uisdk/packages/core/src/page/agent/agent.ts` |
| Polyfill origin; dialog and quantity prior art | `ripple/theme/snippets/command-polyfill.liquid`; `ripple/theme/assets/s-dialog.js`; `ripple/theme/assets/s-quantity-selector.js` |

UNVERIFIED:

1. Everything in WebKit and Gecko: root-only primitives (SPIKE-04), the polyfill in an engine that really lacks Invoker Commands (SPIKE-05; the spike only hid the native feature in Chromium, where native activation still ran), `closedby`, `<details name>`, `@media (scripting: none)` (SPIKE-06).
2. `rp-navigation-menu` as a desktop mega menu with real content, nested popovers and Remix morph (SPIKE-07). The spike covered hover, keys and native toggling on a three-item menu.
3. React 19 and Remix 3 printing `commandfor`, `command`, `popovertarget` unchanged (SPIKE-05, `06-bindings.md`).
4. Importing `<pkg>/elements` under Node.
5. `ripple.js` size with real commerce code. The spike used a stand-in; the 45 kB budget leaves 22.7 kB for commerce and Hydrogen.
6. Tooltip keyboard focus and Escape behaviour, `data-agent-secret`, `data-agent-hidden`: read in source or docs, not exercised.
7. The light-dismiss click fallback of `rp-dialog` (9.1 item 5): Chromium supports `closedby`, so that branch did not run.
8. The Navigation API branch of `rp-dialog` outside Chromium (the API is absent there and the branch is skipped).

---

## 15. Fallbacks

### Fallback (SPIKE-04)

Applies only if root-only primitives fail in WebKit or Gecko. The default path above is what is built first.

1. Create `src/runtime/element.ts` with the base class below (typechecked; never run; file `ripple/docs/research/spikes/elements-runtime/fallback/element.ts`):

```ts
// SPIKE-04 fallback: base class for rp-* elements without the UI SDK kernel.
// Not used on the default path. Typechecked only; never run.
type ChangeDetail<T> = { value: T; reason: string; source: string; event?: Event }

function sourceOf(event?: Event): string {
  if (!event) return "programmatic"
  if (event instanceof KeyboardEvent) return "keyboard"
  const pointerType = (event as PointerEvent).pointerType
  if (pointerType === "touch" || pointerType === "pen") return pointerType
  return event instanceof MouseEvent ? "mouse" : "programmatic"
}

abstract class RippleElement extends HTMLElement {
  // Public methods. Same names as the `api` list the element has on the default path.
  api: Record<string, (...args: any[]) => unknown> = {}
  #cleanup: Array<() => void> = []

  // Runs on every connect. Sets `this.api` and adds listeners with `this.listen`.
  protected abstract start(): void

  connectedCallback(): void {
    try {
      this.start()
    } catch (error) {
      console.error(`[ripple] ${this.localName} failed to start`, error)
    }
  }

  disconnectedCallback(): void {
    for (const stop of this.#cleanup.splice(0)) stop()
  }

  // Adds a listener on the root that is removed on disconnect.
  protected listen(type: string, handler: (event: Event) => void, capture = false): void {
    this.addEventListener(type, handler, capture)
    this.#cleanup.push(() => this.removeEventListener(type, handler, capture))
  }

  protected onDestroy(stop: () => void): void {
    this.#cleanup.push(stop)
  }

  // Dispatches `<key>change` on the root. Returns false when a listener canceled it.
  protected change<T>(key: string, value: T, details: { reason: string; event?: Event }): boolean {
    const detail: ChangeDetail<T> = {
      value,
      reason: details.reason,
      source: sourceOf(details.event),
      event: details.event,
    }
    return this.dispatchEvent(new CustomEvent(`${key}change`, { detail, bubbles: false, cancelable: true }))
  }
}

function defineElement(tag: string, ctor: CustomElementConstructor): void {
  try {
    if (!customElements.get(tag)) customElements.define(tag, ctor)
  } catch (error) {
    console.error(`[ripple] ${tag} failed to define`, error)
  }
}

export { RippleElement, defineElement, type ChangeDetail }
```

2. Each `rp-*` file keeps its module-level helper functions and its behaviour unchanged, and replaces the `definePrimitive` and `createParts` calls with `class Rp<Name> extends RippleElement` plus `defineElement("<tag>", Rp<Name>)`. Mapping:

| Default path | Fallback |
|---|---|
| `context.store.get().x` / `context.store.set({ x })` | a private field `#x` |
| `createChange(context)` then `change(key, value, details)` | `this.change(key, value, details)`; the caller writes `#x` only when it returns `true` |
| root slot `on: { click }` | `this.listen("click", handler)` inside `start()` |
| root slot `bind` and its returned cleanup | body of `start()` and `this.onDestroy(cleanup)` |
| `context.element("root")` | `this` |
| `createParts` `api: [...]` | `this.api = { ... }` assigned in `start()` with exactly the listed methods |
| `createParts` `state: { x: { get, set } }` | a `get x()` / `set x(value)` accessor pair on the class; the setter is silent |
| option `default-x` attribute | read with `this.getAttribute("default-x")` in `start()` |
| `data-slot="<tag>"` on the root | still printed (the contract does not change) |

3. The public surface (tags, markup, events, `detail`, `api` methods, properties, state attributes) is identical. No contract, fixture, binding or CSS changes. `01-architecture.md` gives the import-rule change.
4. Agent bridge: the elements are no longer kernel primitives, so the bridge does not list them. Manual registration is required by the ledger; the API for registering a non-primitive with the bridge is UNVERIFIED (start from `uisdk/packages/core/src/page/observe/registry.ts`). Until it is verified, the `rp-*` elements are reachable by in-page agents only through their native controls, and the manifest key `agent.surface` for the affected components is `accessibility-tree`.
5. Tests E-01 to E-25 apply unchanged, except E-17 (replaced by: the snapshot lists the native buttons inside each root) and E-24 (replaced by: each file contains exactly one `extends RippleElement` and one `defineElement(`).

### Fallback (SPIKE-05)

Applies only if a TSX host does not print `commandfor` / `command` / `popovertarget` unchanged, or the polyfill fails in an engine. The markup change is specified in `02-html-contract.md` ("Fallback (SPIKE-05)"): buttons additionally carry `data-rp-open="<id>"` or `data-rp-close="<id>"`.

Change to `src/runtime/opener.ts` (the only code change):

1. `const OPENER = "a[data-rp-open], button[data-rp-open]"`.
2. In the click listener, before the opener branch, handle closers:

```ts
const closer = origin?.closest("button[data-rp-close]")
if (closer) {
  const dialog = document.getElementById(closer.getAttribute("data-rp-close") ?? "")
  const host = dialog instanceof HTMLDialogElement ? (dialog.parentElement as DialogHost & { api?: { close: (event?: Event) => boolean } }) : null
  if (dialog instanceof HTMLDialogElement && dialog.open && host?.localName === "rp-dialog" && host.api) host.api.close(event)
  return
}
```

3. For a `button[data-rp-open]` the listener calls `host.api.open(event)` only when the dialog is still closed at the time the listener runs (native Invoker Commands or the polyfill may already have opened it; `api.open` returns `false` on an open dialog, so no second event fires).
4. `markOpeners` keeps selecting `a[data-rp-open]` only: buttons get no `aria-haspopup` or `aria-controls`.
5. The modifier-key and `event.button` tests apply to links only.
6. Add test: with `commandfor` and `command` removed from the buttons of 10.1 and the two `data-rp-*` attributes present, E-05 and E-06 pass.

### Fallback (SPIKE-06)

Owned by `03-styling-and-tokens.md` and `13-testing.md`. The behaviour layer already contains the JS side: the `closedby` click fallback (9.1 item 5) and the Invoker Commands polyfill (3.3). No further change to this document's code is needed for any outcome of SPIKE-06, except: if anchor positioning is replaced by a runtime positioning routine, that routine is a new file `src/runtime/position.ts` (at most 1 kB gzip, started from `src/runtime/index.ts` inside `guard`), and its specification is added to this document at that time.

### Fallback (SPIKE-07)

Owned by `12-components-chrome-and-blueprints.md`. If `popover` panels are not usable for the desktop menu, panels become CSS-only dropdowns and each disclosure button toggles `aria-expanded`. Effect on this document: `rp-navigation-menu` keeps its tag, its `item` part and its arrow-key behaviour (9.3 item 3); hover intent is removed (CSS `:hover` does it); the element gains one delegated `click` handler that toggles `aria-expanded` on a pressed disclosure button and sets it to `false` on the others, and `api.close()` sets every `aria-expanded` to `false`. The server then prints `aria-expanded="false"` on those buttons.

---

## Ledger issues

Decisions made here that the ledger does not cover, and places where the ledger or a sibling document needs a change. Each is applied in this document as stated.

| Id | Issue | What this document does |
|---|---|---|
| L-1 | D-054 and ledger 5.2 list three lazy chunks plus the agent file. A fourth file per set is unavoidable without breaking the budgets: UI SDK code shared by Tooltip and Toast (9.2 kB gzip). Putting it in the main file costs every page 9.2 kB; duplicating it breaks the single-copy rule for module state. | Adds `ripple-shared.js` / `ripple.elements-shared.js` and the Liquid specifier `ripple/shared`. Proposes a budget of 10 kB gzip in `size-budget.json`. |
| L-2 | D-054 names chunks only for `ripple.js`. `01-architecture.md` already names `ripple.elements-<chunk>.js`. | Builds a full second set, including `ripple.elements-agent.js` and `ripple.elements-shared.js` (12 files in `browser/`). |
| L-3 | `01-architecture.md` says all bundling uses esbuild and limits `src/gen/**` imports. esbuild cannot keep the kernel in the main file. | Uses Rollup 4.24.0 with `@rollup/plugin-node-resolve` 15.3.0 and `@rollup/plugin-terser` 0.4.4 for step 7 only, in the new file `src/gen/browser-bundles.ts` (not in the ledger tree 5.1). The main files gain the export `loadAgent`. |
| L-4 | `03-styling-and-tokens.md` section 4.3 gives `rp-dialog` (and `rp-live`, `rp-product-form`) `display: contents`. The UI SDK bridge skips roots that fail `checkVisibility()`, so such roots are invisible to in-page agents (D-065). | Rule R-10: every `rp-*` root is `display: block`. `rp-dialog` is additionally `position: absolute` with a 0 by 0 box. `05-commerce.md` must apply R-10 to `rp-live` and `rp-product-form`. |
| L-5 | D-054 item 2 loads a chunk when its tag is in the document. Every layout prints `ui-toast-region`, so every page loads the toast chunk and the shared file (19.5 kB gzip) even if no toast is ever shown. | Follows the ledger. Recommends changing D-054 item 2 so that the Toast chunk loads only on the first `toast()` call. Not applied. |
| L-6 | D-019 item 5 says announcements use `announce()` from `@ui-sdk/core`. D-008 item 7 requires feedback inside an open modal dialog. The kernel's regions are outside the dialog and inert. | Adds the wrapper `announce(text, { from })` in `src/runtime/announcer.ts`, which routes to a `data-rp-part="status"` element inside the open dialog. Elements MUST use the wrapper. `<pkg>/elements` exports `announce` in addition to `toast`. |
| L-7 | D-008 item 3 says the polyfill is "ported". The port differs from `ripple/theme/snippets/command-polyfill.liquid` in two ways that other code relies on. | The polyfill dispatches a `command` event (with `command` and `source`) for built-in commands, which `rp-dialog` uses for reasons and focus restore; and the inline and module copies coordinate through `window.rpCommandsPolyfill`. `window.rpRuntime` guards the runtime start. Both globals are new names. |
| L-8 | The `popover` attribute needs Chrome 114 and Safari 17, above the D-032 floor (Chrome 111, Safari 16.4), and D-032 does not list it among the features that need a fallback. | Behaviour layer: `rp-navigation-menu` and the polyfill do nothing without the popover API. Default for the page: panels are ordinary in-flow content (all links reachable), disclosure buttons do nothing. `03-styling-and-tokens.md` must confirm this or raise the floor. |
| L-9 | D-012 says the Tabs contract includes `aria-controls` without qualification. UI SDK's snapshot has `aria-controls` only on the selected tab. | Section 10.7 prints it on the selected tab only (same as `02-html-contract.md` section 8). |
| L-10 | D-008 item 6 says `rp-dialog` "closes on top-level navigation". Region refreshes by `rp-live` call `history.pushState`, which also raises `navigate`. | Closes only when the `navigate` event has a `sourceElement` (a link or form), so filter drawers stay open during a refresh. Without the Navigation API nothing is closed. |
| L-11 | D-065 does not say how an `rp-*` root is labelled in the bridge snapshot. `rp-dialog`, `rp-quantity`, `rp-navigation-menu` roots have no accessible name. | No label is added (it would change contracts). Left to `08-agent-kit-and-evals.md`. |
| L-12 | D-015 and D-066 do not define the text announced by QuantityInput. | Announces `"<accessible name of the input> <value>"`, for example `Quantity 3`. No new locale key. |
| L-13 | D-016 says the carousel has "disabled state at the ends"; the `next` button's initial state depends on layout. | Server prints `disabled` on `prev` only; Carousel needs the allow-list entry of 9.2 item 6. Cancelling `indexchange` has no effect. |
| L-14 | D-013 does not define the options of `toast()`. | `ToastOptions` is `id`, `description`, `type`, `duration`, `priority`. Toast actions are not supported in V1. `toast()` returns `Promise<void>`. |
| L-15 | D-064 budget for the agent file (13 kB) is met only with terser (12.98 kB); esbuild's minifier gives 13.9 kB. The margin is 15 bytes. | Uses terser. Recommends raising the budget to 14 kB. |
| L-16 | D-017 does not say whether `rp-navigation-menu` dispatches an event or sets `aria-expanded`. | Neither: popover state is native. The element exposes only `api.close()`. |
