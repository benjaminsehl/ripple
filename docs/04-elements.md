# 04 - Elements: the behaviour layer

Status: specification. Law: `00-decisions.md` (D-007 to D-023, D-054, D-064, D-065, D-069, D-077 to D-083, D-089). Where this document and the ledger disagree, the ledger wins.

Every code block marked "complete" was typechecked, bundled and run in Chromium 157 on 2026-11-21, with the three exceptions listed below. The sources are in `ripple/docs/research/spikes/elements-runtime/src/` at the same relative paths. An implementer MUST copy the code blocks of THIS document, not rewrite them; where a block of this document differs from the spike source, this document wins.

Changes made to the code after the spike run, by the reconciliation of the ledger. The spike directory still holds the earlier code. The changed blocks were typechecked (`tsc`, exit 0), bundled (file sizes unchanged) and, for the first two rows, run in Chromium on 2026-11-21 in a copy of the spike that is not kept in the repository; the inline-script equality of the third row (E-28) was not run. The named tests gate all three:

| File | Change | Decision | Test |
|---|---|---|---|
| `src/runtime/loader.ts` | `registerLazy` accepts `tag: null`; `scan` skips such a chunk | D-054 item 2, D-083 | E-27 |
| `src/elements/index.ts` | The `toast` chunk is registered with `tag: null`; the parameter `title` of `toast()` is renamed `message` | D-083 | E-16, E-27 |
| `src/runtime/commands-polyfill.ts` | New exported constant `INLINE_COMMANDS_POLYFILL` (the text of the inline Liquid script) | D-008, D-054 item 7, D-078 | E-28 |

The markup the spike ran against predates the reconciliation. The markup in sections 8.1 and 10 is now a copy of the owning component documents (D-069). The zero-mutation upgrade (E-01), the chunk requests (E-02, E-16, E-27), the quantity veto (Q-13, Q-14), the carousel paging (E-14) and the navigation keys (E-15) were re-run on that markup in the same throwaway copy on 2026-11-21 and passed; tests E-01 and Q-1 MUST re-check it in the repository, because the owning documents can still change.

---

## 0. Scope

| This document owns | Owned elsewhere |
|---|---|
| Which mechanism backs each interactive component (section 1) | Component props, classes, parts, fixtures: `09-components-foundation.md`, `10-components-interactive.md`, `11-components-commerce.md`, `12-components-chrome-and-blueprints.md` |
| UI SDK usage rules and the kernel API Ripple relies on (section 2) | Contract rules, allow-list format, canonicalisation: `02-html-contract.md` |
| The runtime: lazy loader, Invoker Commands polyfill, opener listener, announcer (section 3) | CSS, including the generated `display` and `data-rp-js` rules: `03-styling-and-tokens.md` |
| Entry points, registration, loading per host, import map (sections 4 and 5) | Layer rules, package entry points, start order, build steps 1 to 6 and 8 to 10: `01-architecture.md` |
| The browser-bundle build mechanism (section 6) | Commerce elements, the infrastructure element `rp-view-event`, adapter, region refresh: `05-commerce.md` |
| `rp-*` authoring rules and the worked example (sections 7 and 8) | React `useElement`, Remix and Liquid binding rules: `06-bindings.md` |
| `rp-dialog`, `rp-carousel`, `rp-navigation-menu` (section 9) | Manifest keys, checker rules: `07-manifest-registry-cli.md` |
| No-JS behaviour per pattern, with the markup copied from the owning component documents (section 10, D-069) | Agent kit, bridge tool surface: `08-agent-kit-and-evals.md` |
| Events, state attributes, agent actions (sections 11 and 12) | Test harnesses: `13-testing.md`; Liquid theme files: `14-liquid-theme.md` |

Terms. "Root" is the custom element. "Part" is a native descendant marked `data-rp-part`. "Upgrade" is the moment a custom element is defined and connected. "Pre-upgrade" is the time before that; when JavaScript never runs it is permanent.

---

## 1. Which mechanism backs each component

This table applies D-007. No other mechanism may be used. "Chunk" names the file that carries the behaviour (section 4).

| Component (id) | Mechanism | Custom element | Chunk | Spec of the element |
|---|---|---|---|---|
| Dialog (`dialog`) | native `<dialog>` + Invoker Commands | `rp-dialog` | main | 9.1 |
| Drawer (`drawer`) | same as Dialog | `rp-dialog` | main | 9.1 |
| MobileNav (`mobile-nav`) | Drawer (composed by contract, D-070) + nested `<details>` | `rp-dialog` | main | 9.1 |
| CartDrawer (`cart-drawer`) | Drawer (composed by contract, D-070) + cart | `rp-dialog`, `rp-cart` | main (`ripple.js` only) | 9.1, `05-commerce.md` |
| ProductGallery (`product-gallery`) | Carousel + lightbox Dialog | `rp-carousel`, `rp-dialog` | main | 9.2, 9.1 |
| Popover (`popover`) | native `popover` attribute + `popovertarget` | none | none | 10.3 |
| LocaleSelector (`locale-selector`) | Popover + native form | none | none | 10.3 |
| Accordion (`accordion`) | native `<details>` / `<summary>` | none | none | 10.8 |
| Tabs (`tabs`) | UI SDK | `ui-tabs`, `ui-tabs-list`, `ui-tabs-tab`, `ui-tabs-panel` | `tabs` | 10.7 |
| Tooltip (`tooltip`) | UI SDK | `ui-tooltip`, `ui-tooltip-trigger`, `ui-tooltip-content` | `tooltip` (and `shared`) | 10.4 |
| Toast (`toast`) | UI SDK + `toast()` helper | `ui-toast-region` | `toast` (and `shared`); imported on the first `toast()` call, not on tag presence (D-083) | 10.6 |
| Carousel (`carousel`) | CSS scroll-snap list + buttons | `rp-carousel` | main | 9.2 |
| FeaturedCollection (`featured-collection`) with `layout="carousel"` | Carousel | `rp-carousel` | main | 9.2 |
| QuantityInput (`quantity-input`) | native `<input type="number">` + buttons | `rp-quantity` | main | 8 |
| NavigationMenu (`navigation-menu`) | `<nav>` + links + `popover` panels | `rp-navigation-menu` | main | 9.3 |
| Input, Textarea, Select, Checkbox, RadioGroup, Switch, Label, Field | native controls | none | none | 10.10, 10.12 |
| CartLink, CartLines, CartSummary, CartNote, DiscountCode, ProductForm, VariantPicker, Filters, FilterChips, SortSelect, LiveForm, PredictiveSearch, ProductRecommendations | Hydrogen store / region refresh | `rp-cart`, `rp-product-form`, `rp-live`, `rp-predictive-search`, `rp-recommendations` | main (`ripple.js` only) | `05-commerce.md` |
| No component. View analytics, printed only by the blueprints `product`, `collection`, `search`, `cart` (D-089) | Defined by the commerce adapters (D-089 item 5); not built on the kernel | `rp-view-event` (infrastructure element) | main (`ripple.js` only) | `05-commerce.md` |

`rp-view-event` is an infrastructure element (D-007 as amended, D-089). It belongs to no component, has no class and no `data-slot`, is NOT built on the kernel, and is defined by the two commerce adapter files (`src/commerce/adapter-hydrogen.ts`, `src/commerce/adapter-liquid.ts`), not by this document. The rules of section 7 do not apply to it. It dispatches no Ripple event. It has no file of its own under `src/elements/` or `src/commerce/`.

Not in V1, with the replacement an implementer MUST use:

| Asked for | V1 answer | Source |
|---|---|---|
| Menu (`role="menu"`) | Popover containing links or buttons (10.5) | D-018 |
| Combobox, autocomplete | Fixed list of options: native `<select>` (10.10). Search suggestions: PredictiveSearch (`11-components-commerce.md`) | D-014, D-048, ledger section 11 item 7 |
| Slider | No slider component. A price filter is PriceRange (`11-components-commerce.md`) | ledger section 11 item 7 |
| Custom select, listbox | native `<select>` | D-014 |

The only custom element tags that may appear in any contract or blueprint are: `rp-dialog`, `rp-carousel`, `rp-quantity`, `rp-navigation-menu`, `rp-cart`, `rp-product-form`, `rp-live`, `rp-predictive-search`, `rp-recommendations`, `rp-view-event` (blueprints only, D-089), `ui-tabs`, `ui-tabs-list`, `ui-tabs-tab`, `ui-tabs-panel`, `ui-tooltip`, `ui-tooltip-trigger`, `ui-tooltip-content`, `ui-toast-region`. The tags `ui-toast`, `ui-toast-title`, `ui-toast-description`, `ui-toast-action`, `ui-toast-close`, `ui-tooltip-arrow`, `ui-tabs-indicator` and `ui-tabs-tab-icon` are created or accepted by UI SDK at runtime; a server MUST NOT print them. Every other `ui-*` tag is prohibited and is checker error RP111 (D-022).

---

## 2. UI SDK usage

### 2.1 Rules

1. `@ui-sdk/core` and `@ui-sdk/web` are pinned to exactly `0.1.0-beta.14` (D-022).
2. Ripple source MUST import only these specifiers, and only from these files:

| Specifier | Names used | Allowed in |
|---|---|---|
| `@ui-sdk/core` | `definePrimitive`, `createChange` | `src/elements/rp-*.ts`, `src/commerce/rp-*.ts` |
| `@ui-sdk/core` | `announce`, `prepareAnnouncements` | `src/runtime/announcer.ts` only (D-079) |
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
| Behaviour of `createParts` when imported under Node (no `customElements`). | UNVERIFIED. D-054 item 5 requires that `<pkg>/elements` and `<pkg>/commerce` do nothing when `document` is undefined. The runtime (3.1), the loader and the opener are guarded with `typeof document`. Each `rp-*` module calls `createParts` inside `try`/`catch` (rule R-9), so an import does not throw. Whether evaluating `@ui-sdk/web` without a DOM has other effects was not run; until test E-30 passes, `<pkg>/elements` MUST be imported only by client code (`01-architecture.md`, entry point table). |

---

## 3. The runtime (`src/runtime/`)

The runtime is code that runs once per page. It consists of exactly five files (a sixth, `element.ts`, exists only on the SPIKE-04 fallback path, section 15). `src/runtime/**` MUST import only `src/runtime/**`, `src/identity.ts` and `@ui-sdk/core` (`01-architecture.md`, import rules).

| File | Responsibility | Decision |
|---|---|---|
| `index.ts` | Starts the runtime once; exports `guard`, `announce`, `registerLazy`, `loadChunk`, `startLoader` | `01-architecture.md` 3.3, D-078 |
| `loader.ts` | Lazy chunk registry and document scan | D-054 item 2 |
| `commands-polyfill.ts` | Invoker Commands fallback; the text of the inline Liquid copy | D-008 item 3, D-078 |
| `opener.ts` | The one document-level click listener for `a[data-rp-open]` | D-009 |
| `announcer.ts` | `announce()` | D-079, D-008 item 7, D-066 item 5 |

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
5. The runtime owns exactly two globals, both booleans (D-078): `window.rpRuntime` (this file) and `window.rpCommandsPolyfill` (3.3). No other global may be added by any Ripple code.

### 3.2 `src/runtime/loader.ts` (complete)

```ts
// Lazy loader for the ui-* families (00-decisions D-054 item 2).
type LazyChunk = { tag: string | null; load: () => Promise<unknown>; promise?: Promise<unknown> }

const chunks = new Map<string, LazyChunk>()
let observing = false

// Registers a chunk. `tag` is the root tag whose presence in the document loads it.
// With `tag: null` the document never loads the chunk; only loadChunk(name) does.
function registerLazy(name: string, tag: string | null, load: () => Promise<unknown>): void {
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
    if (chunk.promise || chunk.tag === null) continue
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

1. `registerLazy(name: string, tag: string | null, load: () => Promise<unknown>): void` records a chunk. The first registration of a name wins. `tag` is the root tag whose presence in the document loads the chunk. With `tag: null` no element in the document ever loads the chunk; it is loaded only by `loadChunk(name)`.
2. `startLoader()` scans the document at `DOMContentLoaded` (or immediately when the document is already parsed) and then observes `document.documentElement` for added nodes. When an element with a registered tag is present or is inserted, the chunk is imported once. Chunks registered with `tag: null` are skipped by the scan.
3. A failed import is logged with `console.error`, resolves to `undefined`, and is retried the next time the chunk is requested. No other element is affected.
4. The loader never removes or changes any node.
5. `loadChunk(name: string): Promise<unknown>` imports a registered chunk once and resolves to its module, or to `undefined` when the name is not registered or the import failed.
6. The `toast` chunk is registered with `tag: null` (4.1). The rule (D-054 item 2, D-083 item 3): the `toast` chunk (and `shared`, which it imports) is imported on the first `toast()` call; a `ui-toast-region` in the document does not trigger a load.

### 3.3 `src/runtime/commands-polyfill.ts` (complete)

```ts
// Invoker Commands fallback (00-decisions D-008 item 3, D-078). Ported from
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

// The classic-script copy that Liquid prints inline in snippets/rp-head.liquid
// (00-decisions D-054 item 7). Same logic in ES5 syntax. This constant is the
// single source of that script: the inline script MUST equal it byte for byte.
const INLINE_COMMANDS_POLYFILL = `(function () {
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
})();`

export { INLINE_COMMANDS_POLYFILL, installCommandsPolyfill }
```

Behaviour:

1. No-op when the browser implements Invoker Commands (`"commandForElement" in HTMLButtonElement.prototype`) or when another copy is installed (`window.rpCommandsPolyfill`).
2. One `click` listener on `document`. For a click inside an enabled `button[commandfor]` whose target id exists, it dispatches an event named `command` on the target (not bubbling, cancelable, with properties `command` and `source`), and, unless that event was canceled, performs the built-in command.
3. Supported built-in commands: `show-modal`, `close`, `show-popover`, `hide-popover`, `toggle-popover`. A command that starts with `--` only dispatches the event. Any other value does nothing.
4. `show-modal` on an open dialog and `close` on a closed dialog do nothing (same as native).
5. The polyfill does not set `aria-expanded` and does not implement `request-close`.
6. The `command` event the polyfill dispatches is internal. `rp-dialog` reads it for reasons and focus restore (9.1); it is not public API (ledger section 4.7).
7. Differences from the base theme's `ripple/theme/snippets/command-polyfill.liquid` (the polyfill is a port, not a copy, D-008 as amended): it dispatches the `command` event with `command` and `source`, and it uses the global `window.rpCommandsPolyfill`.

Liquid additionally prints the same logic as a classic inline script in `snippets/rp-head.liquid`, after the config element `#rp-commerce` and before the module script (D-054 item 7), so that commands work while the module is loading. The text between `<script>` and `</script>` is the value of `INLINE_COMMANDS_POLYFILL` above, with one line break after `<script>` and one before `</script>`. The source of `rp-head` (`src/gen/liquid-core/rp-head.liquid`, owned by `07-manifest-registry-cli.md` and `14-liquid-theme.md`) MUST contain exactly this element; `14-liquid-theme.md` embeds it byte for byte; test E-28 compares the built snippet with the constant. The element as printed (complete):

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

The two copies coordinate through `window.rpCommandsPolyfill`: whichever runs first installs the listener; the other does nothing. `window.rpRuntime` (3.1) and `window.rpCommandsPolyfill` are the only two globals Ripple owns (D-078). `INLINE_COMMANDS_POLYFILL` is not exported by `src/runtime/index.ts` and is in no public entry; because nothing in a browser bundle uses it, Rollup and esbuild drop it from every browser file (checked by E-28).

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
4. After `rp-dialog` is defined, and after any node insertion, the runtime sets `aria-haspopup="dialog"` and `aria-controls="<dialog id>"` on every such link whose dialog can open. These two attribute writes are the global allow-list entry 1 of `02-html-contract.md` section 7.3 (constant `GLOBAL_UPGRADE_ALLOW` in `src/testing/upgrade-diff.ts`, D-071). No other attribute is written.
5. `data-rp-open` is printed only by the prop `dialog` of Link, and of Button and IconButton when `href` is set (D-009 as amended). The listener handles `<a>` elements only. `button[data-rp-open]` exists only on the SPIKE-05 fallback path (section 15).
6. When the target dialog is not on the page, a binding omits the prop, the link has no `data-rp-open`, and it navigates (CartDrawer on the cart page, D-091).

### 3.5 `src/runtime/announcer.ts` (complete)

```ts
// Announcements (00-decisions D-079, D-008 item 7, D-066 item 5).
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
2. When `from` is inside an open modal `<dialog>` that contains an element marked `data-rp-part="status"`, the text is written into the FIRST such element inside that dialog (D-079 item 1). The element MUST be printed by the server, empty. It is the Announcer component, or the status part of a commerce component. Source: `09-components-foundation.md`, Announcer, fixture `default` (no props):

```html
<div class="rp-announcer" role="status" data-rp-part="status"></div>
```

   An Announcer MUST be placed inside a `<dialog>` or an `rp-*` root. The `layout` blueprint prints NO Announcer: the page-level regions are created by the runtime (D-079 item 2).
3. In every other case the text goes to the kernel's page-level live regions. `startAnnouncer()` creates them at start so that the first announcement is spoken.
4. A dialog whose content can raise announcements (CartDrawer, any Drawer that contains QuantityInput or a commerce form) MUST contain a `data-rp-part="status"` element. Without it, announcements raised inside the open dialog go to the page-level regions, which are inert while the dialog is modal. CartLines, CartSummary, CartNote and DiscountCode each always print one status part for this reason (D-079 item 3, `11-components-commerce.md`).
5. `announce` is exported by `<pkg>/elements` and by both main browser files (D-079 item 1, D-054 item 1). Signature: `announce(text: string, options?: { priority?: "polite" | "assertive"; from?: Element | null }): void`.
6. Toast MUST NOT be used for feedback raised while a modal dialog is open (D-079 item 4, 9.1 item 9).

---

## 4. Entry points and registration

### 4.1 Source entry points

| Entry | Source | What importing it does | Exports |
|---|---|---|---|
| `<pkg>/elements` | `src/elements/index.ts` | Starts the runtime, defines `rp-dialog`, `rp-carousel`, `rp-quantity`, `rp-navigation-menu`, registers the three lazy chunks (`tabs` and `tooltip` by tag, `toast` without a tag), starts the loader | `toast`, `ToastOptions`, `announce`, `AnnounceOptions` |
| `<pkg>/elements/<tag>` | `src/elements/<tag>.ts` | Defines only that element (for `ui-tabs`, `ui-tooltip`, `ui-toast`: that UI SDK family). Valid `<tag>` values and the export map: `01-architecture.md` section 6 | the primitive (`rp-*` files); `toast` (UI SDK's, `ui-toast` file) |
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
type ToastModule = { toast: (message: string, options?: ToastOptions) => unknown }

guard("lazy chunks", () => {
  registerLazy("tabs", "ui-tabs", () => import("./ui-tabs"))
  registerLazy("tooltip", "ui-tooltip", () => import("./ui-tooltip"))
  // No tag: a <ui-toast-region> in the document does not load the chunk (D-083).
  registerLazy("toast", null, () => import("./ui-toast"))
  startLoader()
})

// Shows a toast in the page's <ui-toast-region>. The first call imports the
// toast chunk (and the shared chunk it imports); the region upgrades then.
async function toast(message: string, options?: ToastOptions): Promise<void> {
  const chunk = (await loadChunk("toast")) as ToastModule | undefined
  chunk?.toast(message, options)
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
4. The package `sideEffects` field MUST cover the built files of the runtime, the elements and commerce, so that a bundler does not drop the side-effect imports. The value is fixed by D-052 item (h): `dist/elements/*.mjs`, `dist/commerce/index.mjs`, `dist/commerce/rp-*.mjs`, `dist/chunks/*.mjs`, `browser/*`, `*.css` (`01-architecture.md` owns `package.json`).
5. The `tabs` chunk is requested only when a `ui-tabs` element is in the document, and the `tooltip` chunk only when a `ui-tooltip` element is. A page with neither requests only the main file (verified: spike line "loader: page without ui-* tags loads only the main file").
6. The `toast` chunk MUST NOT be registered by tag (D-083 item 3). The `toast` chunk (and `shared`) is imported on the first `toast()` call; a `ui-toast-region` in the document does not trigger a load. Reason: every layout prints `ui-toast-region`, and loading on tag presence cost every page the toast chunk and the shared chunk (19.5 kB gzip together, measured) even when no toast was ever shown.
7. `toast` and `announce` are the only functions `<pkg>/elements` exports. A binding file MUST NOT import `<pkg>/elements` and MUST NOT re-export `toast` (D-083 item 4, D-096).

### 4.2 Browser files

Built by section 6 into `pkg/browser/`. "Imports" are static imports between files.

| File | Content | Imports |
|---|---|---|
| `ripple.js` | UI SDK kernel, runtime, the four non-commerce `rp-*` elements, the commerce layer (adapters, refresh strategies, commerce elements, `rp-view-event`; `05-commerce.md`) and the Hydrogen cart subset | platform specifiers only |
| `ripple-tabs.js` | Tabs family | `./ripple.js` |
| `ripple-tooltip.js` | Tooltip family | `./ripple.js`, `./ripple-shared.js` |
| `ripple-toast.js` | Toast family and UI SDK `toast` | `./ripple.js`, `./ripple-shared.js` |
| `ripple-shared.js` | UI SDK code used by both Tooltip and Toast (presence and popup positioning) | `./ripple.js` |
| `ripple-agent.js` | Agent bridge | `./ripple.js` |
| `ripple.elements.js` and `ripple.elements-tabs.js`, `ripple.elements-tooltip.js`, `ripple.elements-toast.js`, `ripple.elements-shared.js`, `ripple.elements-agent.js` | The same set without commerce and Hydrogen (it therefore contains no refresh strategy and no `rp-view-event`) | same pattern, with `./ripple.elements.js` |

Rules:

1. A page MUST load exactly one of `ripple.js`, `ripple.elements.js`, or the bundled `<pkg>/elements`, exactly once (D-054 item 1; checker RP507). Loading two of them, or one of them under two different URLs, creates two kernels and is a defect.
2. The files of one set MUST be deployed in the same directory and MUST keep their names. They import each other by relative path.
3. The public exports of both main files are `toast`, `announce` and `loadAgent`. `ripple.js` additionally exports `getCommerce` and `configureCommerce` (D-054 item 1, D-042), because `<pkg>/commerce` does not resolve on prebuilt pages. `loadAgent()` returns a promise of the module `{ createAgent, agentTools, registerTools }`. Every other export of a main file (other names that `src/commerce/index.ts` exports, and exports whose names are one or two characters long) is an internal link between files and MUST NOT be used.
4. The file list is D-054 item 2 as amended: five chunks per set (`tabs`, `tooltip`, `toast`, `shared`, `agent`), two sets, so `browser/` holds exactly 12 `.js` files. The `shared` chunk exists because Tooltip and Toast share 9.2 kB gzip of UI SDK code: putting it in the main file would cost every page 9.2 kB, and duplicating it would break the one-copy rule for module state.
5. `ripple-agent.js` / `ripple.elements-agent.js` is always shipped and copied, and is opt-in by loading (`loadAgent()`, section 12.2).

Budgets are those of D-064; `size-budget.json` (`13-testing.md`) holds them and each chunk budget applies to both sets: `ripple.js` 45 kB (the same limit for the Liquid build `registry/liquid/assets/ripple.js`), `ripple.elements.js` 30 kB, tabs 10 kB, tooltip 22 kB, toast 15 kB, shared 10 kB, agent 14 kB. 1 kB is 1000 bytes; JavaScript is measured as gzip level 9 of the shipped file.

Measured sizes (gzip level 9, spike build, `ripple.js` built with a stand-in for commerce):

| File | gzip bytes | Budget in bytes (D-064) |
|---|---|---|
| `ripple.elements.js` | 22,306 | 30,000 |
| `ripple.elements-tabs.js` | 6,602 | 10,000 |
| `ripple.elements-tooltip.js` | 11,521 | 22,000 |
| `ripple.elements-toast.js` | 10,328 | 15,000 |
| `ripple.elements-shared.js` | 9,171 | 10,000 |
| `ripple.elements-agent.js` | 12,985 | 14,000 |

---

## 5. Loading per host

### 5.1 `html` host

One tag in `<head>`. `ripple init` copies the six files of the `ripple.js` set (`ripple.js`, `ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`, `ripple-shared.js`, `ripple-agent.js`) from the package's `browser/` directory to `paths.public` (default `public/ripple/`; D-054 item 4, D-101, `07-manifest-registry-cli.md`). The examples serve that directory at `/ripple/`.

```html
<link rel="stylesheet" href="/ripple/ripple.css">
<script type="module" src="/ripple/ripple.js"></script>
```

A page without commerce MAY use `ripple.elements.js` instead. The `ripple.elements.js` set (six files) is never copied by the CLI, in any host (D-101): such a project links it from `node_modules/<pkg>/browser/` or copies the six files by hand into one directory, and uses that URL in `src`. No import map is needed: chunks resolve relative to the main file.

A page that uses commerce additionally prints, in `<head>` before this script tag, the Hydrogen script tags and the config element `<script type="application/json" id="rp-commerce">`. Both are owned by `05-commerce.md` (D-087, D-088).

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

The same six files of the `ripple.js` set, copied by `ripple init` to `paths.public` (default `public/ripple/`; D-054 item 4), loaded by the same script tag. They are served prebuilt and are not passed through the Remix asset server (D-034 item 5). As on the `html` host, the `ripple.elements.js` set is never copied by the CLI (D-101). Where the tag is placed in the document component, and its order relative to Remix's own scripts, is owned by `06-bindings.md`. Elements need no notification of a morph: they read the DOM at event time (section 7 rule R-5).

### 5.3 `react` host (bundled apps)

In the client entry, once:

```ts
import "<pkg>/elements"
import "<pkg>/commerce"
```

The app's bundler turns the three `import("./ui-*")` expressions into its own chunks, and the single installed copy of `@ui-sdk/core` is shared by all of them. The app MUST NOT also load a file from `browser/` (RP507). A React app without commerce omits the second import. The CLI copies no browser file on the `react` host.

### 5.4 `liquid` host

Files are `assets/ripple.js`, `assets/ripple-tabs.js`, `assets/ripple-tooltip.js`, `assets/ripple-toast.js`, `assets/ripple-shared.js`, `assets/ripple-agent.js` (six files, copied by the CLI from `registry/liquid/assets/`; D-054 item 3). They are the `ripple` set with every cross-file import rewritten to a bare specifier (section 6.3), because the URL of a theme asset is not known at build time. There is no `ripple.elements.js` on Liquid.

`snippets/rp-import-map-entries.liquid` MUST add exactly these six entries to the theme's single import map. How the snippet is included in the map, and the comma that joins these entries to the theme's own, are owned by `14-liquid-theme.md`:

```liquid
"ripple": "{{ 'ripple.js' | asset_url }}",
"ripple/tabs": "{{ 'ripple-tabs.js' | asset_url }}",
"ripple/tooltip": "{{ 'ripple-tooltip.js' | asset_url }}",
"ripple/toast": "{{ 'ripple-toast.js' | asset_url }}",
"ripple/shared": "{{ 'ripple-shared.js' | asset_url }}",
"ripple/agent": "{{ 'ripple-agent.js' | asset_url }}"
```

`snippets/rp-head.liquid` is rendered after the import map and before `{{ content_for_header }}`. It prints, in this order (D-054 item 7): the stylesheet tag for `ripple.css`; `{% render 'rp-tokens' %}`; the config element `<script type="application/json" id="rp-commerce">` (D-087; content owned by `05-commerce.md` and `14-liquid-theme.md`); the inline polyfill of section 3.3; then:

```liquid
<script type="module" src="{{ 'ripple.js' | asset_url }}"></script>
```

Rules:

1. The `src` above and the import-map value of `ripple` are the output of the same filter on the same file name, so they are the same URL and the browser creates one module instance. Verified: `ripple/docs/research/spikes/elements-runtime/results-liquid.txt` (one request per file, one kernel).
2. Theme code that calls Ripple functions MUST use `import { toast } from "ripple"`, never the asset URL.
3. No asset may contain a relative import. Section 6.3 fails the build when one remains.
4. The config element is printed BEFORE the inline polyfill and the module script, so that it is in the document when the commerce runtime starts. It is printed by `rp-head`, not by the layout file (D-087 item 3).
5. The complete text of `rp-head` and of `rp-import-map-entries` is owned by `14-liquid-theme.md`; this section fixes the six entries, the order, and the inline polyfill.

### 5.5 What each host gets before upgrade

In every host the server response already contains the complete markup of section 10. Until the main file has run, and for ever when it never runs, behaviour is the "Without JavaScript" row of each pattern.

---

## 6. Building the browser files

`01-architecture.md` section 7 step 7 delegates the mechanism to this section. The mechanism is one Rollup build per main file, in `src/gen/browser-bundles.ts`, called by `src/gen/build.ts`. It is ledger text: D-054 item 8 (Rollup for the browser files), D-054 item 2 (the 12 files and the `shared` chunk), D-077 (import rule for `src/gen/**`). esbuild is used for `dist/` and for running tooling (D-054 item 5), not for the browser files.

### 6.1 Why Rollup and not esbuild

esbuild's `splitting: true` moves code shared by the main file and its chunks into hash-named shared chunks and cannot be told to keep the kernel in the main file. D-054 requires that chunks import the kernel from the main file. Rollup places every module that the entry reaches statically in the entry file and lets dynamically imported chunks import from it (`preserveEntrySignatures: "allow-extension"`). This was tried both ways in the spike; only the Rollup build met D-054 and the budgets of D-064.

Dev dependencies used by this section, pinned exactly (D-054 item 8, D-103; versions used by the spike): `rollup` 4.24.0, `@rollup/plugin-node-resolve` 15.3.0, `@rollup/plugin-terser` 0.4.4. They are imported only by `src/gen/browser-bundles.ts`. The import rule for `src/gen/**` in `01-architecture.md` allows them (D-077).

Minification uses terser, not esbuild's minifier: with esbuild's minifier the agent file is 13.9 kB gzip; with terser it is 12.98 kB. The agent budget is 14 kB (D-064).

### 6.2 `src/gen/browser-bundles.ts` (complete)

```ts
// Builds the browser bundles (04-elements.md section 6; 00-decisions D-054).
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
6. The function returns the raw and gzip size of every file in `outDir`; `src/gen/build.ts` compares them with `size-budget.json` (`13-testing.md`; values: D-064). The Liquid files differ from their `outDir` sources only in import specifiers; `13-testing.md` measures `registry/liquid/assets/ripple.js` against the `ripple.js` budget.

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

1. `pkg/browser/` contains exactly the 12 `.js` files of section 4.2 (plus `ripple.css`, owned by `01-architecture.md`). `pkg/registry/liquid/assets/` contains exactly the 6 files of section 5.4 (D-054 items 2 and 3; ledger section 5.2). The file list is a contract with the CLI and the Liquid import map (item 5).
2. No chunk contains a copy of the kernel. Test E-20 checks at runtime that one kernel instance serves both `rp-*` and `ui-*` elements.
3. `ripple-tabs.js` contains the import specifier `./ripple.js`; `ripple.elements-tabs.js` contains `./ripple.elements.js` (`01-architecture.md` tests A-07, A-08).
4. No main file statically imports a chunk.
5. A UI SDK version bump MUST re-run the build and re-check that exactly one `-shared` file is produced; the build throws when more than one remains after 8 passes. `src/gen/build.ts` additionally checks, after `buildBrowserBundles` returns, that the returned list has exactly the 12 file names of section 4.2 and throws otherwise.
6. Every file is within its budget in `size-budget.json` (D-064): `shared` 10 kB and `agent` 14 kB in each set, among the others listed in 4.2.

---

## 7. Rules for writing an `rp-*` element

These rules apply to every element in `src/elements/rp-*.ts` and `src/commerce/rp-*.ts` (D-019). Section 8 is a complete element that follows all of them.

| Rule | Requirement |
|---|---|
| R-1 | One element per file. File name = tag name: `src/elements/<tag>.ts` or `src/commerce/<tag>.ts`. |
| R-2 | Built with `definePrimitive` from `@ui-sdk/core` and `createParts` from `@ui-sdk/web`, with exactly one part, `root`. The primitive `name` equals the tag. The server prints `data-slot="<tag>"` on the root. |
| R-3 | Parts are native descendants marked `data-rp-part="<name>"`. The element finds a part with `root.querySelector` at the moment it needs it. It MUST NOT store a reference to any descendant in a variable that outlives one event handler or one method call. For this reason Hydrogen's `attachQuantityInput` MUST NOT be called (D-019, D-044). JavaScript MUST NOT select by class (D-024 item 6). |
| R-4 | Listeners for bubbling events are declared in the root slot's `on` map (one delegated listener per event type). Listeners for events that do not bubble (`scroll`, `command`, `cancel`, `close`, `toggle`) are added in `bind` with `el.addEventListener(type, fn, true)` on the ROOT and removed in the function `bind` returns. No listener is added to a descendant. |
| R-5 | The element MUST work after any descendant is replaced (Liquid partial refresh, Remix morph, React re-render) and after its own disconnect and reconnect. Consequence: before acting on state, re-read the DOM (the `adopt()` pattern of section 8). |
| R-6 | State is written to the DOM only with the attribute names of D-021. The element MUST NOT write, at upgrade, any attribute the server could have printed: after `bind` has run on server-rendered markup, a `MutationObserver` records zero mutations inside the root (allow-listed entries excepted). |
| R-7 | A state change caused by the user or by a public method goes through `change(key, value, { reason, event })` and MUST respect its return value: when it returns `false`, the element restores what the DOM showed before. `reason` MUST be a value of the table in section 11.2. |
| R-8 | Writes through the element's JavaScript property (`element.value = 3`) or its attribute are silent: they use `context.store.set` and dispatch no event (D-023 item 1). |
| R-9 | `createParts` is called at module top level inside `try { ... } catch (error) { console.error("[ripple] <tag> failed to define", error) }`. |
| R-10 | Every `rp-*` root is `display: block` (D-080; D-019 item 8). The `display` given to `createParts` MUST be `"block"`. It MUST NOT be `"contents"`: the agent bridge skips roots that fail `checkVisibility()`. A component that needs another layout sets it by class in its CSS file (`.rp-quantity { display: inline-flex }`); component CSS MUST NOT set `display: contents` or `display: none` on a custom element root (D-080 item 3). The value is data: the manifest key `elements.<tag>.display` (source `src/gen/elements.json`, `07-manifest-registry-cli.md`) MUST be `block` for every `rp-*` tag, and the generated display region of `base.css` (`03-styling-and-tokens.md` section 4.3) is printed from it. `rp-dialog` is additionally absolutely positioned with zero size (9.1). |
| R-11 | The `api` list of `createParts` names the public methods only. Internal methods returned by the `api` function (for use by the slot) are not listed and are therefore not reachable from `element.api`. |
| R-12 | The primitive's `agent` key is `{ actions: [...] }`, listing the public methods an in-page agent may call (section 12). Getter methods are not listed. |
| R-13 | Timers, observers and listeners on objects other than the root are registered with cleanup: in the function returned by `bind`, or with `context.onDestroy`. |
| R-14 | Announcements use `announce(text, { from })` from `src/runtime/announcer.ts` (section 3.5; D-079, D-019 item 5), never `announce()` from `@ui-sdk/core` directly. |
| R-15 | The element writes nothing outside its root, and reads nothing outside its root except through `document.getElementById` for an id the contract names. |
| R-16 | The module exports the primitive (`export { rpQuantity }`) and nothing else. It has no default export. |
| R-17 | The module MUST NOT throw at import time and MUST do nothing visible when its parts are missing: every part lookup is null-checked. |

Checklist for adding a new non-commerce element `rp-<name>`:

1. Confirm with D-007 that a native mechanism or an existing element cannot do the job. A new tag needs a ledger change.
2. Write `src/elements/rp-<name>.ts` following R-1 to R-17.
3. Add `import "./rp-<name>"` to `src/elements/index.ts` after the existing `rp-*` imports.
4. Add the tag to `src/gen/elements.json` as `{"display": "block", "chunk": "main", "commerce": false}` (`07-manifest-registry-cli.md` section 1.5). The generated display rule and, if the element owns `data-rp-js` controls, the generated visibility rules of `base.css` follow from the manifest (`03-styling-and-tokens.md` section 4.3).
5. Write the component contract with `data-slot="rp-<name>"` on the root and the complete initial state on the parts (`02-html-contract.md` section 8).
6. Record the events, methods and `agent` actions in the component's manifest entry (`07-manifest-registry-cli.md`).
7. Write `src/elements/rp-<name>.test.ts` covering, at minimum: zero mutations at upgrade; each event with each reason; cancel restores the DOM; silent property write; descendant replacement; disconnect and reconnect; `element.api` exposes exactly the listed methods.
8. Run `pnpm build`; it fails when a file exceeds its budget in `size-budget.json`.

---

## 8. Worked example: `rp-quantity`

`rp-quantity` is the element of QuantityInput (D-015). It is the reference for every other `rp-*` element. The component (props, classes, fixtures, CSS, bindings) is owned by `10-components-interactive.md`; this section owns the element.

### 8.1 Markup the server prints (copy)

Source: `10-components-interactive.md`, QuantityInput, fixture `default` (no props). This block is a byte-equal copy (D-069, D-015); when it and the source differ, the source wins.

```html
<rp-quantity class="rp-quantity" data-size="md" data-slot="rp-quantity">
  <button class="rp-quantity-button" type="button" disabled aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
  <input class="rp-quantity-input" type="number" inputmode="numeric" name="quantity" min="1" step="1" value="1" aria-label="Quantity" data-rp-part="input" data-rp-field="quantity">
  <button class="rp-quantity-button" type="button" aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
</rp-quantity>
```

Facts of the contract that other documents get wrong most often (all from D-015 as amended):

- The root class is `rp-quantity`, the one exception to the class rule of ledger section 4.1. Part classes are `rp-quantity-button` and `rp-quantity-input`. The CSS file is `quantity-input.css`.
- The buttons contain the Icons `minus` and `plus`, not the text `-` and `+`. Their accessible names are `aria-label` attributes printed from the props `decreaseLabel` and `increaseLabel`.
- The input always prints `data-rp-field="quantity"`.
- The prop `formId` (Liquid `form_id`) prints the native `form` attribute on the input. The prop is not named `form` because that name is reserved in Liquid.
- The root has an `id` only when the caller passes one. Remix prints `data-rmx-key` from the Remix-only prop `rmxKey` when there is no `id` (host extra, absent from fixtures).

Behaviour-bearing attributes (what the element and the pre-upgrade CSS read):

| Element | Attribute | Requirement |
|---|---|---|
| root | `data-slot="rp-quantity"` | REQUIRED |
| input | `data-rp-part="input"`, `type="number"` | REQUIRED |
| input | `data-rp-field="quantity"` | REQUIRED in the contract (D-015, D-043). Not read by `rp-quantity`; read by commerce elements (`05-commerce.md`) |
| input | `min`, `max`, `step`, `value` | Read at event time. Defaults when absent or not a number: `min` 1, `max` unlimited, `step` 1. |
| input | `aria-label`, or a `<label for>` | REQUIRED (accessible name; also the announcement text) |
| input | `disabled` | When present the element ignores steps and disables both buttons |
| input | `form` (prop `formId`) | Optional. Not read by `rp-quantity`; the browser associates the input with that form |
| buttons | `type="button"`, `data-rp-part="decrement"` / `"increment"`, `data-rp-js="inflow"` | REQUIRED |
| decrement button | `disabled` | Printed by the server when `value <= min`, or when the input is disabled |
| increment button | `disabled` | Printed by the server when `max` is set and `value >= max`, or when the input is disabled |

The element reads no class and no `data-size`.

### 8.2 Behaviour

1. Upgrade: the element adopts the input's value as its state and recomputes the two `disabled` attributes. With correct server markup this writes nothing.
2. A click on a button: re-adopt the input's value (R-5); compute `value + step` (increment) or `value - step` (decrement); clamp to `[min, max]` and snap to the step grid that starts at `min`; call `change("value", next, { reason })`. If accepted: write the input's `value` property, update the `disabled` attributes, announce `"<accessible name> <value>"` (for example `Quantity 3`; there is no locale key for this text, D-015), then dispatch bubbling `input` and `change` events on the input so that forms and commerce elements see a native edit.
3. The user types and commits (the input's own trusted `change` event): normalise the typed number the same way and commit with reason `input-commit`. The input is rewritten when normalisation changed the number (typing 99 with `max="5"` shows 5).
4. A listener that calls `preventDefault()` on `valuechange` vetoes the change (`valuechange` is cancelable, D-023, D-036): the input shows the previous value again, and `element.value` and `api.getValue()` still return the previous value. This holds for a button press, a typed commit, `api.setValue`, `api.increment` and `api.decrement`.
5. `element.value = n` is a silent write: no `valuechange` event and no veto. The input and the buttons are updated and the new value is announced. The settable `value` property together with the cancelable `valuechange` event is what the React controlled `value` prop of QuantityInput uses (D-036, `06-bindings.md` rule R-5): React vetoes the change and re-applies its own state through the property.
6. A disabled input disables both buttons and ignores steps.
7. The only DOM writes are the input's `value` property and the `disabled` attribute on the two buttons.

Without JavaScript and before upgrade: the number input works and submits with its form; the two buttons are invisible but keep their space (`visibility: hidden` from the generated rule `rp-quantity:not(:defined) [data-rp-js="inflow"]`, `03-styling-and-tokens.md`), so nothing shifts at upgrade.

### 8.3 Public surface

| Kind | Name | Signature / detail |
|---|---|---|
| Event | `valuechange` | `detail: { value: number, reason: "increment-press" \| "decrement-press" \| "input-commit" \| "imperative", source }`. Not bubbling. Cancelable (D-023, D-036): `preventDefault()` keeps the previous value. React callback: `onValueChange(value, detail)`. |
| Method | `api.getValue()` | returns `number` |
| Method | `api.setValue(value)` | Commits with reason `imperative`; fires `valuechange`; returns `false` when vetoed |
| Method | `api.increment()`, `api.decrement()` | Same as a button press; return `false` when vetoed or disabled |
| Property | `value` | Live number on the `rp-quantity` element, readable and settable. Reading returns the current value. Writing it updates the input and the buttons, fires no `valuechange` and cannot be vetoed. |
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

`src/elements/rp-quantity.test.ts` MUST contain these cases (tier 5 of D-063 unless stated). Q-1 to Q-12 were run in the spike (`ripple/docs/research/spikes/elements-runtime/test.mjs`) on the pre-reconciliation markup, which had the same behaviour-bearing attributes; Q-13 and Q-14 were not run. Fixture names are those of QuantityInput in `10-components-interactive.md`: `default` (value 1, min 1, no max) and `default-value` (value 3, min 1, max 5). "The element" is the `rp-quantity` root; "the input" is its `data-rp-part="input"` descendant.

| Case | Steps | Expected |
|---|---|---|
| Q-1 (tier 3) | Load fixture `default` with a `MutationObserver` installed before the module script | Zero mutations inside `rp-quantity` |
| Q-2 | Fixture `default`. Click increment | `input.value === "2"`; events in order: `valuechange` on the element (`detail.value === 2`, `detail.reason === "increment-press"`, `bubbles === false`, `cancelable === true`), then `input`, then `change` on the input; the decrement button has no `disabled` attribute |
| Q-3 | Fixture `default-value`. Click increment twice | `input.value === "5"`; the increment button has `disabled`; a further `element.api.increment()` returns `false` and leaves `input.value === "5"` |
| Q-4 | Fixture `default`. Type `3` into the input, press Tab | One `valuechange` with `detail.reason === "input-commit"` and `detail.value === 3` |
| Q-5 | Fixture `default-value`. Type `99` into the input, press Tab | `input.value === "5"` |
| Q-6 | Fixture `default-value`. Add a `valuechange` listener on the element that calls `event.preventDefault()`. Click decrement | The listener ran once; `input.value === "3"`; `element.value === 3`; `element.api.getValue() === 3`; no `input` or `change` event was dispatched on the input by the element; neither button has `disabled` |
| Q-7 | Fixture `default`. Set `element.value = 2` | No `valuechange` event; `input.value === "2"`; `element.value === 2` |
| Q-8 | `Object.keys(element.api)` | Exactly `getValue`, `setValue`, `increment`, `decrement` |
| Q-9 | Fixture `default-value`. Replace the input and both buttons with new nodes (same markup, input `value="4"`), click the new increment button | `input.value === "5"` on the new input |
| Q-10 | Fixture `default-value`. Remove the element from the document, insert it again, click decrement | `input.value === "2"` and `valuechange` fired exactly once |
| Q-11 | Fixture `default`, outside any dialog. Click increment | Within 500 ms a UI SDK live region outside the element contains the text `Quantity 2` |
| Q-12 | Fixture `default` inside an open modal `<dialog>` (opened with `showModal()`) that also contains the Announcer of 3.5 | Within 500 ms the text of the `data-rp-part="status"` element is `Quantity 2` |
| Q-13 | Fixture `default-value` with the vetoing listener of Q-6. In order: (a) click increment; (b) type `4` into the input and press Tab; (c) call `element.api.setValue(5)`; (d) call `element.api.decrement()` | After each step: `input.value === "3"`, `element.value === 3`, `element.api.getValue() === 3`. Steps (c) and (d) return `false`. The listener ran four times |
| Q-14 | Continue Q-13 with the listener still attached: set `element.value = 4` | The listener did not run again; `input.value === "4"`; `element.value === 4` (a property write is silent and cannot be vetoed; this is how a controlled React `value` is applied, D-036) |

---

## 9. The other non-commerce elements

### 9.1 `rp-dialog`

Used by Dialog, Drawer, MobileNav, CartDrawer and the ProductGallery lightbox (D-008). Markup: section 10.1 and 10.2. The element reads no class: the root class is `rp-dialog`, `rp-drawer`, or a composed pair such as `rp-drawer rp-cart-drawer` (D-070).

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
4. **Initial open.** When the `<dialog>` has `data-default-open` and is closed at upgrade, the element calls `showModal()` once per dialog node (a reconnect does not reopen it). `openchange` fires with `value: true`, reason `imperative`. The server MUST NOT print `open` (D-008 item 5). The `open` attribute this adds is the `upgradeAllow` entry `{ "select": "dialog[data-default-open]", "attrs": ["open"] }` (D-071; entry 3 of `02-html-contract.md` section 7.3). When the dialog is already open at upgrade (opened natively before the module loaded), the element adopts that state without an event.
5. **Light dismiss fallback.** `closedby="any"` gives backdrop dismissal natively. In a browser without `closedby` (`!("closedBy" in HTMLDialogElement.prototype)`), a click whose target is the `<dialog>` itself and whose coordinates are outside the dialog's box closes it with reason `outside-press`. A dialog without `closedby="any"` is never light-dismissed by the element.
6. **Focus.** Opening is `showModal()`, so the browser moves focus into the dialog and makes the rest of the page inert. On close the browser restores focus; the element additionally focuses the opener when focus was lost (opener never focused, or replaced by a node with the same `id`).
7. **Navigation.** `rp-dialog` closes on navigation ONLY on a Navigation API `navigate` event that has a `sourceElement` (D-008 item 6 as amended). Exactly: when the Navigation API exists, a `navigate` event with `canIntercept === true`, `hashChange === false`, no `downloadRequest`, and a `sourceElement` that is not inside a `[data-rmx-target]` element closes an open dialog with reason `link-press`. Navigations without a `sourceElement` (`history.pushState` and `replaceState` called by `rp-live`) do NOT close it, so a filter drawer stays open while results refresh. Without the Navigation API nothing is closed by the element (D-081); a full document navigation discards the dialog anyway.
8. **Writes.** The element writes no attribute on its root, in any state. Inside the root it changes only the dialog's open state through `showModal()` and `close()`.
9. **Rule for feedback** (D-008 item 7, D-079): while a dialog is open, feedback MUST be rendered inside it (FormMessage with `role="alert"`, or `announce(text, { from })` with `from` inside the dialog, which writes into the dialog's `data-rp-part="status"` element). Code MUST NOT call `toast()` while `document.querySelector("dialog:modal")` is not null.

Public surface:

| Kind | Name | Signature / detail |
|---|---|---|
| Event | `openchange` | `detail: { value: boolean, reason, source }`. Not bubbling. Cancelable (item 3; D-023, D-036). React callback: `onOpenChange(value, detail)`. |
| Method | `api.isOpen()` | returns `boolean` |
| Method | `api.open(event?)` | Opens modally; returns `false` when already open or vetoed |
| Method | `api.close(event?)` | Closes; returns `false` when already closed or vetoed |
| Method | `api.setOpen(value)` | Silent open or close (no event) |
| Property | `open` | Live boolean on the `rp-dialog` element, readable and settable. Writing it opens or closes the dialog, fires no event and cannot be vetoed. With the cancelable `openchange` it carries the React controlled `open` prop of Dialog and Drawer (D-036). |
| Agent actions | `open`, `close` | section 12 |

Static CSS requirement (D-080 item 1, D-008 item (g); printed in the generated display region of `base.css`, `03-styling-and-tokens.md`): `rp-dialog { display: block; position: absolute; inline-size: 0; block-size: 0; }`. The root then takes no space in the flow, and still passes `checkVisibility()`. A modal dialog is in the top layer and is not affected by the root's box. The component CSS MUST NOT set `display` on a closed `<dialog>`: `display` values for the panel are written only under `dialog[open]`.

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

Parts: `viewport` (the scroll container, exactly one), `item` (each slide, descendants of the viewport), `prev`, `next` (buttons, outside the viewport; class `rp-carousel-control`, not `rp-icon-button`, D-016). The element finds them by `data-rp-part`, never by class.

Behaviour:

1. Scrolling is native: touch, trackpad, keyboard on the focusable viewport, and scroll snapping come from CSS. The element never sets a scroll position except in response to a button press, `api.goTo` or the `index` property. (The kernel also gives the element a `default-index` option, because every state key has one; no Ripple binding prints it and the Carousel component has no `defaultIndex` prop, D-016. With the attribute absent the option is 0 and the element does not scroll at upgrade.)
2. `next` and `previous` scroll the viewport by one viewport width (`scrollBy`), in the inline direction (negated in RTL), with `behavior: "smooth"`, or `"auto"` under `prefers-reduced-motion: reduce`. Scroll snapping decides the final position.
3. The index is the position, in document order among the viewport's `item` parts, of the item whose start edge is nearest the viewport's start edge; at the scroll end it is the first item whose start edge is at or after the viewport's start edge.
4. On every scroll and on every resize of the root, the element recomputes the index and the buttons: `prev` gets `disabled` when the scroll offset is at most 1 px; `next` gets `disabled` when the offset is within 1 px of the maximum.
5. When the index changed, `indexchange` is dispatched with reason `next-press` or `previous-press` (the scroll was started by that button), `imperative` (`api.goTo`), or `scroll` (the user scrolled). A button reason lasts until the scroll has been at rest for 150 ms. Cancelling `indexchange` has no effect (D-016): the scroll already happened, and the element then stores the new index anyway. `indexchange` is therefore documented as NOT cancelable (D-023), although the DOM event object reports `cancelable === true` because the kernel creates every change event that way.
6. Upgrade: the element adopts the current index (0 for server markup) and recomputes the buttons. The server prints `disabled` on the `prev` button ONLY (D-016). The `next` button's `disabled` depends on layout (all slides may fit), so the server MUST NOT print it; when all slides fit, the element adds `disabled` to `next` at upgrade. Carousel's manifest `upgradeAllow` carries the entry `{ "select": "[data-rp-part=\"next\"]", "attrs": ["disabled"], "reason": "depends on layout" }` (D-071; `10-components-interactive.md` owns the entry text).
7. The only DOM writes are `disabled` on the two buttons. The element sets no `aria-hidden`, `inert` or `tabindex` on slides.

Public surface:

| Kind | Name | Signature / detail |
|---|---|---|
| Event | `indexchange` | `detail: { value: number, reason: "next-press" \| "previous-press" \| "scroll" \| "imperative", source }`. Not bubbling. Not cancelable: cancelling has no effect (item 5). React callback: `onIndexChange(value, detail)`. |
| Method | `api.getIndex()` | returns `number` (0-based) |
| Method | `api.next()`, `api.previous()` | Scroll one page |
| Method | `api.goTo(index)` | Smooth scroll to the item; `indexchange` reason `imperative` |
| Property | `index` | Live number. Writing it jumps without animation and without an event. |
| Option | `default-index` attribute | Kernel option only. NOT part of any contract: bindings MUST NOT print it and there is no `defaultIndex` prop (D-016, ledger section 6.5) |
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

Parts: `item` (each top-level `<li>`). The panel of an item is the first `[popover]` element inside it (its id is `<id>-item-<n>`, D-017; the element never reads the id). The entry of an item is its first link or enabled button that is not inside the panel.

Behaviour:

1. Opening and closing a panel by its disclosure button, closing by Escape, closing by a press outside, and returning focus to the button are NATIVE (`popovertarget` + `popover`). The element adds only items 2 and 3.
2. **Hover intent** (mouse pointers only; touch and pen are ignored). The pointer resting on an item that has a panel opens that panel after 120 ms (`showPopover()`); opening one auto popover closes the others natively. The pointer moving onto an item without a panel, or leaving every item, closes all panels of this menu after 250 ms. Moving between an item and its own panel cancels the pending close, because the panel is a DOM descendant of the item.
3. **Arrow keys**, when focus is on a top-level entry (not inside a panel): ArrowRight (ArrowLeft in RTL) focuses the entry of the next item, wrapping; ArrowLeft (ArrowRight in RTL) the previous, wrapping; Home the first; End the last; each of these closes open panels first. ArrowDown on an item with a panel opens the panel and focuses its first link or enabled button. Tab order is unchanged: every link and button stays in the tab sequence.
4. The element writes no attribute and dispatches no event. It sets no `aria-expanded` (`02-html-contract.md` rule I-2: the browser exposes the popover state of a `popovertarget` button). Its whole public surface is `api.close()` (D-017 as amended, D-023).
5. In a browser without the popover API (`!("popover" in HTMLElement.prototype)`) the element does nothing. This is decided (D-081, ledger Q15): the floor of D-032 is kept; below Chrome 114 / Safari 17.0 the popover panels are ordinary in-flow content, always visible, every link in them is reachable, the disclosure buttons do nothing, and there is no polyfill.

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

- The owning component documents are normative for markup (D-069): `09-components-foundation.md`, `10-components-interactive.md`, `12-components-chrome-and-blueprints.md`. Every `html` block below, except the one in 10.5, is a byte-equal copy of a fixture of the owning document, and the line above it names the source. When a block and its source differ, the source wins and the difference is a defect of this document.
- This document fixes only what the behaviour layer reads or relies on: tags, `data-slot`, `data-rp-*`, `commandfor`, `command`, `popovertarget`, `popover`, `closedby`, ids and id references, `role`, `aria-*`, `hidden`, `disabled`, `name`, `type`, `value`, `tabindex`. The "Rules" line of each subsection states those requirements; `02-html-contract.md` section 8 states the same requirements as contract rules.
- Visible strings are examples. The real strings are locale keys defined in the component documents (D-066).
- "Before upgrade" describes the time between first paint and the element being defined. "Without JavaScript" is the permanent state when the module never runs.
- "Below the feature's first version" rows apply the capability tiers of D-081: the browser floor of D-032 is kept, and a floor browser that lacks a newer feature gets the stated behaviour.

### 10.1 Dialog

Component document: `10-components-interactive.md`. Element: `rp-dialog` (9.1).

Source: `10-components-interactive.md`, Dialog, fixture `default` (`id="size-guide"`; title "Size guide"):

```html
<rp-dialog class="rp-dialog" data-slot="rp-dialog">
  <dialog class="rp-dialog-panel" id="size-guide" data-size="md" aria-labelledby="size-guide-title" closedby="any">
    <h2 class="rp-dialog-title" id="size-guide-title">Size guide</h2>
  </dialog>
</rp-dialog>
```

An opener. Source: `09-components-foundation.md`, Button, fixture `dialog-opener` (`variant="link"`, `commandFor="size-guide"`, `command="show-modal"`):

```html
<button class="rp-button" type="button" commandfor="size-guide" command="show-modal" data-variant="link" data-size="md">Size guide</button>
```

A closer. Source: `09-components-foundation.md`, IconButton, fixture `dialog-closer` (`icon="close"`, `ariaLabel="Close"`, `size="sm"`, `commandFor="size-guide"`, `command="close"`):

```html
<button class="rp-icon-button" type="button" commandfor="size-guide" command="close" data-variant="ghost" data-size="sm" aria-label="Close"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
```

Rules:

1. No `open`, `hidden`, `role`, `aria-modal` or `aria-hidden` on the `<dialog>`. With `defaultOpen` the `<dialog>` additionally has `data-default-open=""` (fixture `default-open` of the source).
2. Parts of Dialog and Drawer are `panel`, `header`, `title`, `description`, `body`, `footer` (D-084). There is no close part and no `describedBy` prop.
3. Openers and closers are NOT parts (D-008 item 2). They are Button or IconButton elements with the props `commandFor` and `command`, anywhere in the document. A closer that must be usable while the dialog is open MUST be inside the `<dialog>`, because the rest of the page is inert.
4. No `aria-expanded`, `aria-controls` or `aria-haspopup` on the buttons.
5. A Link is an opener only through its `dialog` prop (10.2), never through `commandFor` (D-008, D-009).

| Situation | Behaviour |
|---|---|
| Without JavaScript, browser with Invoker Commands | Fully working: the buttons open and close the modal dialog; Escape and backdrop press close it (`closedby` where supported). |
| Without JavaScript, browser without Invoker Commands | The dialog stays closed and its content is not reachable. For this reason an overlay whose content has a page equivalent MUST use the link opener of 10.2, and content that must be reachable without JS MUST NOT be placed only in a Dialog (`noJs.level: degraded`). |
| Before upgrade | Same as without JavaScript. On Liquid the inline polyfill (3.3) makes commands work from first paint in every browser. A dialog opened before upgrade is adopted in its open state. |
| After upgrade | Adds: `openchange`, polyfilled commands, light-dismiss fallback, focus repair, `data-default-open`, close on navigation. |

### 10.2 Drawer, with a link opener

Component documents: `10-components-interactive.md` (Drawer), `11-components-commerce.md` (CartDrawer), `12-components-chrome-and-blueprints.md` (MobileNav). Element: `rp-dialog`.

Source: `10-components-interactive.md`, Drawer, fixture `default` (`id="filters"`; title "Filters"):

```html
<rp-dialog class="rp-drawer" data-slot="rp-dialog">
  <dialog class="rp-drawer-panel" id="filters" data-side="end" aria-labelledby="filters-title" closedby="any">
    <h2 class="rp-drawer-title" id="filters-title">Filters</h2>
  </dialog>
</rp-dialog>
```

The link opener of that drawer. Source: `10-components-interactive.md`, Drawer, section "HTML contract", the opener shown after the fixtures. It is a Link (`09-components-foundation.md`) with `href="/collections/all"` and the prop `dialog="filters"`:

```html
<a class="rp-link" href="/collections/all" data-variant="inline" data-rp-open="filters">Filters</a>
```

Rules:

1. A Drawer is a Dialog with root class `rp-drawer`, panel class `rp-drawer-panel` and `data-side` (`start`, `end` or `bottom`; default `end`). Parts and closers are those of 10.1.
2. The opener of an overlay that has a page equivalent MUST be `<a href="<page>" data-rp-open="<dialog id>">` (D-009). It is written with the prop `dialog` (Liquid `dialog`) of Link, or of Button or IconButton when `href` is set. That prop is the only thing that prints `data-rp-open`; callers MUST NOT pass `data-rp-open` through rest props or `attributes`.
3. The server MUST NOT print `aria-haspopup`, `aria-controls`, `role="button"` or `commandfor` on the link.
4. When the target dialog is not on the page (CartDrawer on the cart page, D-091), the `dialog` prop is omitted and the link navigates.
5. A Drawer without a page equivalent uses the button opener of 10.1.
6. A Drawer whose content can raise announcements contains a status part (3.5 rule 4).
7. CartDrawer and MobileNav compose Drawer by contract (D-070): their root is `<rp-dialog class="rp-drawer rp-cart-drawer">` and `<rp-dialog class="rp-drawer rp-mobile-nav">`. `rp-dialog` does not read classes; its behaviour is the same.

| Situation | Behaviour |
|---|---|
| Without JavaScript | The link navigates to `/collections/all`. Full function through the page. |
| Before upgrade | The link navigates. |
| After upgrade | An unmodified primary click opens the drawer; modified clicks (new tab, new window) navigate. The runtime adds `aria-haspopup="dialog"` and `aria-controls="filters"` to the link. |

### 10.3 Popover

Component document: `10-components-interactive.md`. No custom element, no JavaScript.

Source: `10-components-interactive.md`, Popover, fixture `default` (`id="shipping-info"`; one paragraph):

```html
<div class="rp-popover" id="shipping-info" popover="" data-side="bottom" data-align="start">
  <p>Free shipping on orders over $50.</p>
</div>
```

Rules:

1. The opener is a Button or IconButton with the prop `popoverTarget="<id>"`, which prints `popovertarget="<id>"` on a `<button>` (`09-components-foundation.md`).
2. The panel carries the `popover` attribute with the empty value (D-010): auto behaviour (light dismiss, Escape, one open at a time). In HTML text `popover` and `popover=""` are the same attribute. Whether React 19 and Remix 3 print the empty value is UNVERIFIED (SPIKE-05); the fallback is `popover="auto"` in all four hosts. `popover="manual"` MUST NOT be printed by a Popover.
3. No `hidden` on the panel, no `aria-expanded` on the button.
4. The only part is an optional `title` (class `rp-popover-title`, no id).
5. Position is CSS (`03-styling-and-tokens.md`).

| Situation | Behaviour |
|---|---|
| Without JavaScript | Fully working natively. |
| Before and after upgrade | Identical; Ripple JavaScript does not touch a Popover. The polyfill adds `command="toggle-popover"`, `show-popover`, `hide-popover` for buttons that use `commandfor` instead of `popovertarget`; `popovertarget` is preferred because it needs no polyfill. |
| Below the feature's first version (the `popover` attribute needs Chrome 114, Safari 17.0, Firefox 125; version numbers UNVERIFIED) | The floor is kept (D-081, ledger Q15). The panel is ordinary in-flow content, always visible. The opener button is present and does nothing. The polyfill and `rp-navigation-menu` do nothing. There is no popover polyfill. |

### 10.4 Tooltip

Component document: `10-components-interactive.md`. Elements: `ui-tooltip` family, chunk `tooltip`.

Source: `10-components-interactive.md`, Tooltip, fixture `default` (`id="size-tip"`; trigger IconButton with `icon="info"`, `ariaLabel="Sizing information"`, `tooltip="size-tip"`; content text "Runs small"):

```html
<ui-tooltip class="rp-tooltip" id="size-tip">
  <ui-tooltip-trigger><button class="rp-icon-button" type="button" data-variant="ghost" data-size="md" aria-label="Sizing information" aria-describedby="size-tip-content" data-slot="tooltip-trigger"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg></button></ui-tooltip-trigger>
  <ui-tooltip-content class="rp-tooltip-content" hidden id="size-tip-content" role="tooltip" data-closed data-slot="tooltip-content">Runs small</ui-tooltip-content>
</ui-tooltip>
```

Rules:

1. Root `id` REQUIRED; the content id is `<id>-content`.
2. The trigger is the caller's Button or IconButton, a native `<button type="button">`, inside `ui-tooltip-trigger`. A link (`<a href>`, or a Button or IconButton with `href`) MUST NOT be a tooltip trigger: UI SDK writes `type="button"` on it (D-082).
3. The trigger's `aria-describedby="<id>-content"` and `data-slot="tooltip-trigger"` are printed by the Button / IconButton prop `tooltip="<tooltip id>"` (D-082). Passing those two attributes through rest props or `attributes` is prohibited.
4. The trigger has its own accessible name; the tooltip is never the only label (D-013).
5. `ui-tooltip` itself carries no `data-slot`. `side` and `align` are printed on `ui-tooltip-content` as the attribute names UI SDK reads (`side`, `align`) and are omitted at the default (ledger section 4.3).
6. The content is printed with `hidden` and `data-closed`.
7. With markup that follows rules 1 to 6 the upgrade writes nothing. Verified in the spike (line "upgrade: zero mutations") on a trigger button without the `rp-icon-button` class and `data-variant` / `data-size` attributes; the fixture above adds only those and an Icon, none of which UI SDK reads. Test E-01 re-checks the fixture as printed.

| Situation | Behaviour |
|---|---|
| Without JavaScript | The tooltip never shows (`noJs.level: none`). The trigger keeps its accessible name, and assistive technology still reads the description through `aria-describedby`. The tooltip MUST NOT be the only place a piece of information appears for sighted users who need it to complete a task. |
| Before upgrade | Same. The trigger works as a button. |
| After upgrade | Hover shows the content (verified in the spike); keyboard focus shows it (`uisdk/packages/web/src/tooltip.ts`, reason `trigger-focus`; not exercised by the spike). UI SDK writes `data-open`, `popover="manual"` and an inline `style` on the content while open; these are post-upgrade writes. |

### 10.5 Menu (not in V1): action list in a Popover

There is no `role="menu"` component (D-018). An action list is a Popover (10.3) that contains Link and Button elements.

The panel. Source: `10-components-interactive.md`, Popover, fixture `placement` (`id="order-actions"`, `side="top"`, `align="end"`):

```html
<div class="rp-popover" id="order-actions" popover="" data-side="top" data-align="end">
  <p>Actions</p>
</div>
```

The opener is an IconButton with `icon="menu"`, `ariaLabel="Order actions"`, `popoverTarget="order-actions"`. This block is this document's own example; it MUST equal what the IconButton contract of `09-components-foundation.md` prints for those props:

```html
<button class="rp-icon-button" type="button" popovertarget="order-actions" data-variant="ghost" data-size="md" aria-label="Order actions"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
```

Rules: no `role="menu"`, `role="menuitem"` or arrow-key roving. The panel's children are Link elements (navigation) and Button elements (actions); they are reached with Tab. Behaviour is that of 10.3.

### 10.6 Toast

Component document: `10-components-interactive.md`. Element: `ui-toast-region`, chunk `toast`.

One region per page, printed empty by the `layout` blueprint (`12-components-chrome-and-blueprints.md`). Its root class is `rp-toast` (D-083).

Source: `10-components-interactive.md`, Toast, fixture `default` (no props):

```html
<ui-toast-region class="rp-toast" aria-label="Notifications" data-slot="toast-region" data-side="bottom" data-align="end" popover="manual"></ui-toast-region>
```

Rules:

1. The server prints no toast markup. Messages produced by the server use Banner or FormMessage.
2. The `toast` chunk, and the `shared` chunk it imports, are imported on the first `toast()` call. A `ui-toast-region` in the document does not trigger a load (D-054 item 2, D-083). Until that call the region is not upgraded and nothing writes to it.
3. When the chunk has loaded, UI SDK upgrades the region: it writes inline `style` variables on it and appends `<ol data-slot="toast-list">`. These writes are covered by Toast's `upgradeAllow` entry, which is entry 2 of `02-html-contract.md` section 7.3. With the four attributes `data-slot`, `data-side`, `data-align`, `popover` printed as above, they are not written again (verified).
4. A toast is shown only by the helper:

```ts
import { toast } from "<pkg>/elements"   // html and remix: from the URL of the main browser file; Liquid: from "ripple"

await toast("Added to cart", { description: "Linen shirt, size M", type: "success", duration: 5000 })
```

`toast(message: string, options?: ToastOptions): Promise<void>` (D-083 item 2). `message` is the toast's title text. `ToastOptions` is exactly: `id?: string`, `description?: string`, `type?: "default" | "success" | "error" | "warning" | "info" | "loading"`, `duration?: number` (milliseconds), `priority?: "polite" | "assertive"`. The helper loads the chunk on first use and resolves after UI SDK's `toast()` has been called; when the chunk fails to load it resolves without showing anything. Action buttons inside toasts are not supported in V1.

5. `toast()` MUST NOT be called while a modal dialog is open (9.1 item 9).
6. A page with no `ui-toast-region` shows no toasts: UI SDK has no region to render into. UNVERIFIED whether UI SDK creates a region itself in that case; Ripple layouts always print one.
7. `toast` is exported by `<pkg>/elements`, `ripple.js` and `ripple.elements.js` (Liquid: specifier `ripple`). A binding file MUST NOT re-export `toast` and MUST NOT import `<pkg>/elements`; the Toast binding prints the region and nothing else (D-083 item 4).
8. Toast items are created by UI SDK and carry no Ripple class; CSS reaches them with `.rp-toast :where(...)` selectors (`10-components-interactive.md`).

| Situation | Behaviour |
|---|---|
| Without JavaScript | The region is empty and invisible. No toast exists; every flow that would toast reloads a page that shows a Banner or FormMessage (`noJs.level: none`). |
| Before upgrade | Same. |
| After the main file has run, before the first `toast()` call | Same. No request for the `toast` or `shared` chunk has been made. |
| After the first `toast()` call | The chunk loads, the region upgrades, and `toast()` renders `ui-toast` elements inside the region. |

### 10.7 Tabs

Component document: `10-components-interactive.md`. Elements: `ui-tabs` family, chunk `tabs`.

Source: `10-components-interactive.md`, Tabs, fixture `default` (`id="t"`, `defaultValue="account"`; list `ariaLabel="Settings"`; tabs `account` (selected) and `password`):

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

Rules, per element (this is the exact snapshot UI SDK produces, D-012; any difference causes attribute writes at upgrade). V1 Tabs is horizontal only: there is no `orientation` prop and `data-orientation="horizontal"` is always printed.

| Element | Attributes, in addition to class |
|---|---|
| `ui-tabs` | `id` (REQUIRED), `default-value="<selected value>"`, `data-activation-direction="none"`, `data-orientation="horizontal"`, `data-slot="tabs"`. Never the live `value` attribute. |
| `ui-tabs-list` | `aria-label`, `role="tablist"`, `data-activation-direction="none"`, `data-orientation="horizontal"`, `data-slot="tabs-list"` |
| `ui-tabs-tab` (every one) | `value="<value>"`, `role="none"`. Contains exactly one `<button type="button">`. |
| selected tab `<button>` | `role="tab"`, `id="<id>-tab-<value>"`, `aria-controls="<id>-panel-<value>"`, `aria-selected="true"`, `tabindex="0"`, `data-selected`, `data-activation-direction="none"`, `data-orientation="horizontal"`, `data-slot="tabs-tab"` |
| every other tab `<button>` | `role="tab"`, `id="<id>-tab-<value>"`, `aria-selected="false"`, `tabindex="-1"`, `data-activation-direction="none"`, `data-orientation="horizontal"`, `data-slot="tabs-tab"`. NO `aria-controls` (its panel is hidden; UI SDK adds the reference when the panel is shown). |
| selected `ui-tabs-panel` | `value`, `role="tabpanel"`, `id="<id>-panel-<value>"`, `aria-labelledby="<id>-tab-<value>"`, `tabindex="0"`, `data-selected`, `data-activation-direction="none"`, `data-orientation="horizontal"`, `data-slot="tabs-panel"` |
| every other `ui-tabs-panel` | `value`, `hidden`, `data-slot="tabs-panel"` and nothing else |

Exactly one tab is selected. How a `value` becomes part of an id: `02-html-contract.md` section 3.3. At upgrade UI SDK re-writes `role="none"` on each `ui-tabs-tab` with the value it already has; a same-value write is not a mutation and has no allow-list entry (D-002).

| Situation | Behaviour |
|---|---|
| Without JavaScript | `noJs.level: degraded`. Static CSS under `@media (scripting: none)` shows every panel and hides the tab list (10.16 C-6; support UNVERIFIED, SPIKE-06). Where that media feature is unsupported only the default panel is readable; content that must be reachable belongs in an Accordion. |
| Before upgrade | The default panel is visible. Tab buttons are focusable and do nothing until the chunk has loaded. |
| After upgrade | UI SDK tabs: click and arrow keys select; `valuechange` (reason `item-press` for a click) is dispatched on `ui-tabs`. |

### 10.8 Accordion

Component document: `10-components-interactive.md`. No custom element, no JavaScript.

Source: `10-components-interactive.md`, Accordion, fixture `default` (no props; two items):

```html
<div class="rp-accordion" data-type="multiple">
  <details class="rp-accordion-item">
    <summary class="rp-accordion-trigger">Shipping</summary>
    <div class="rp-accordion-content"><p>Ships in two days.</p></div>
  </details>
  <details class="rp-accordion-item">
    <summary class="rp-accordion-trigger">Returns</summary>
    <div class="rp-accordion-content"><p>Thirty days.</p></div>
  </details>
</div>
```

Source: `10-components-interactive.md`, Accordion, fixture `single` (`id="faq"`, `type="single"`; both items with `accordion="faq"`, the first with `defaultOpen`):

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

Rules:

1. The root prints `data-type` (`single` or `multiple`; default `multiple`).
2. With `type="single"` the root `id` is REQUIRED, every item has `name="<accordion id>"` and at most one has `open`. With `type="multiple"` no item has `name` and the root needs no `id` (D-011).
3. No `role` or `aria-expanded` on `<summary>`; no `hidden` on the content.
4. There is no height animation in V1.

| Situation | Behaviour |
|---|---|
| Without JavaScript | Fully working natively (`noJs.level: full`). |
| Before and after upgrade | Identical; Ripple JavaScript does not touch an Accordion. |
| Below the feature's first version (exclusive `<details name>` needs Chrome 120, Safari 17.2; version numbers UNVERIFIED) | An Accordion with `type="single"` behaves as `multiple`: several items can be open at once. Nothing else changes (D-081). |

### 10.9 Carousel

Component document: `10-components-interactive.md`. Element: `rp-carousel` (9.2).

Source: `10-components-interactive.md`, Carousel, fixture `default` (`id="featured"`, `ariaLabel="Featured products"`; three items):

```html
<rp-carousel class="rp-carousel" id="featured" role="group" aria-roledescription="carousel" aria-label="Featured products" data-slot="rp-carousel">
  <button class="rp-carousel-control" type="button" disabled aria-controls="featured-list" aria-label="Previous" data-rp-part="prev" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
  <ul class="rp-carousel-viewport" id="featured-list" tabindex="0" data-rp-part="viewport">
    <li class="rp-carousel-item" data-rp-part="item"><p>One</p></li>
    <li class="rp-carousel-item" data-rp-part="item"><p>Two</p></li>
    <li class="rp-carousel-item" data-rp-part="item"><p>Three</p></li>
  </ul>
  <button class="rp-carousel-control" type="button" aria-controls="featured-list" aria-label="Next" data-rp-part="next" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
</rp-carousel>
```

Rules:

1. Root `id` REQUIRED; the viewport id is `<id>-list`.
2. The viewport is the scroll container (CSS: `overflow-x: auto; scroll-snap-type: x mandatory`; each item `scroll-snap-align: start`; owned by the component CSS) and has `tabindex="0"` so that arrow keys scroll it.
3. The previous and next buttons have class `rp-carousel-control` (D-016), carry `data-rp-part="prev"` / `"next"` and `data-rp-js="inflow"`, and MUST be outside the viewport. Their accessible names come from the props `previousLabel` and `nextLabel`.
4. `prev` is printed with `disabled`; `next` is printed without it (9.2 item 6).
5. No `aria-hidden`, `inert` or `hidden` on slides.
6. Props (D-016): `columns` (values `1` to `6`), `ariaLabel`, `previousLabel`, `nextLabel`. There is no `defaultIndex` prop, and a binding MUST NOT print a `default-index` or `index` attribute.

| Situation | Behaviour |
|---|---|
| Without JavaScript | The list scrolls and snaps by touch, trackpad, mouse wheel and keyboard. The two buttons are invisible but keep their space (`rp-carousel:not(:defined) [data-rp-js="inflow"]`). `noJs.level: degraded` only because the buttons are missing. |
| Before upgrade | Same. |
| After upgrade | Buttons appear and page the list; `disabled` follows the scroll position; `indexchange` is dispatched. |

### 10.10 Select

Component document: `09-components-foundation.md`. No custom element, no JavaScript.

Source: `09-components-foundation.md`, Select, fixture `default` (no props; children two options):

```html
<select class="rp-select" data-size="md"><option value="ca">Canada</option><option value="us">United States</option></select>
```

A Select gets its accessible name from the prop `ariaLabel` or from a Label whose `htmlFor` is the Select's `id`. Source: `09-components-foundation.md`, Label, fixture `default` (`htmlFor="email"`; children `Email`):

```html
<label class="rp-label" for="email">Email</label>
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

Source: `09-components-foundation.md`, Checkbox, fixture `default` (no props):

```html
<input class="rp-checkbox" type="checkbox">
```

Source: `09-components-foundation.md`, RadioGroup, fixture `default` (legend `Size`; items `s` (checked) and `m`, `name="size"`):

```html
<fieldset class="rp-radio-group" data-orientation="vertical"><legend class="rp-radio-group-legend">Size</legend><label class="rp-radio-group-item"><input class="rp-radio-group-input" type="radio" name="size" value="s" checked><span class="rp-radio-group-label">Small</span></label><label class="rp-radio-group-item"><input class="rp-radio-group-input" type="radio" name="size" value="m"><span class="rp-radio-group-label">Medium</span></label></fieldset>
```

Source: `09-components-foundation.md`, Switch, fixture `default` (no props):

```html
<input class="rp-switch" type="checkbox" role="switch">
```

Checkbox and Switch are bare inputs (D-014). Their label is a Label: either one with `htmlFor`, or one that wraps the control. Source: `09-components-foundation.md`, Label, fixture `wrapping` (no props; children a Checkbox then text):

```html
<label class="rp-label"><input class="rp-checkbox" type="checkbox" name="terms" value="1">I agree to the terms</label>
```

Rules:

1. Native inputs only; Switch is `<input type="checkbox" role="switch">`; state is the native `checked` and `disabled`; no `aria-checked`.
2. RadioGroup part classes are `rp-radio-group-item`, `rp-radio-group-input`, `rp-radio-group-label` (D-014). The classes `rp-radio` and `rp-label` MUST NOT appear inside a RadioGroup.
3. Radio buttons of one group share `name`; arrow-key movement inside the group is native.

| Situation | Behaviour |
|---|---|
| Without JavaScript, before upgrade, after upgrade | Identical and native. The controls submit with their form. |

### 10.13 Slider (not in V1)

There is no slider component and `ui-slider` is prohibited. A numeric range filter is PriceRange (`11-components-commerce.md`). A single bounded number is Input with `type="number"` or QuantityInput (10.14).

### 10.14 QuantityInput

Component document: `10-components-interactive.md`. Element: `rp-quantity`. The markup (a copy of fixture `default` of the component document), the rules and the behaviour are in sections 8.1 and 8.2.

| Situation | Behaviour |
|---|---|
| Without JavaScript | The number input works and submits. The buttons are invisible but keep their space. `noJs.level: degraded` only because the buttons are missing. |
| Before upgrade | Same. |
| After upgrade | Buttons step the value; `valuechange` is dispatched; changes are announced. |

### 10.15 NavigationMenu

Component document: `12-components-chrome-and-blueprints.md`. Element: `rp-navigation-menu` (9.3).

Source: `12-components-chrome-and-blueprints.md`, NavigationMenu, fixture `default` (`id: "main-nav"`, `menu: menu.main`):

```html
<rp-navigation-menu class="rp-navigation-menu" data-slot="rp-navigation-menu" id="main-nav">
  <nav aria-label="Main">
    <ul class="rp-navigation-menu-list">
      <li class="rp-navigation-menu-item" data-rp-part="item">
        <a class="rp-navigation-menu-link" href="/collections/all" aria-current="page">Shop</a>
        <button type="button" class="rp-navigation-menu-trigger" popovertarget="main-nav-item-1" aria-label="Shop submenu"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
        <div id="main-nav-item-1" popover="" class="rp-navigation-menu-content">
          <ul class="rp-navigation-menu-sublist">
            <li class="rp-navigation-menu-subitem"><a class="rp-navigation-menu-sublink" href="/collections/shirts">Shirts</a></li>
            <li class="rp-navigation-menu-subitem"><a class="rp-navigation-menu-sublink" href="/collections/socks">Socks</a></li>
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

Rules:

1. Root `id` REQUIRED.
2. Every top-level item is an `<li data-rp-part="item">`. An item with a URL has a real `<a href>`.
3. An item with children additionally has, in this order after the link, a disclosure `<button type="button" popovertarget="<panel id>">` with its own accessible name, and the panel `<div id="<panel id>" popover="">` INSIDE the same `<li>` (hover intent relies on the panel being a descendant of the item). An item with children and no URL has the button only, with the item's label as its visible text.
4. The panel id is `<id>-item-<n>`, where `n` is the 1-based position of the top-level item among all top-level items (D-017, D-020). In the fixture the first item's panel is `main-nav-item-1`.
5. The disclosure buttons are NOT marked `data-rp-js`: they work natively. No `aria-expanded` on the buttons.
6. `aria-current="page"` on the link to the current URL.

| Situation | Behaviour |
|---|---|
| Without JavaScript | Every top-level link navigates. Each disclosure button opens its panel natively; Escape and outside press close it. Full function. |
| Before upgrade | Same. |
| After upgrade | Adds hover intent and arrow-key movement between top-level items. |
| Below the feature's first version (`popover` attribute, 10.3) | Panels are in-flow content, always visible; every link is reachable; the disclosure buttons and `rp-navigation-menu` do nothing (D-081). |

MobileNav composes Drawer by contract (D-017, D-070): its root is `<rp-dialog class="rp-drawer rp-mobile-nav">` with Drawer's part classes. Its opener is a link written with the `dialog` prop, which prints `<a href="#<footer menu id>" data-rp-open="<id>">` (10.2), and its body holds nested `<details>` for sublevels. The contract is in `12-components-chrome-and-blueprints.md`. It adds no element beyond `rp-dialog`.

### 10.16 Static CSS this section depends on

Owned by `03-styling-and-tokens.md`; listed here as requirements that the behaviour layer relies on. Test E-18 checks each.

| # | Requirement |
|---|---|
| C-1 | `:where([hidden]:not([hidden="until-found"])) { display: none !important }` in the earliest layer, `ui-sdk` (D-021 item 2, D-025). |
| C-2 | A static `display` for every tag of section 1, generated from the manifest key `elements` (D-080): `block` for every `rp-*` tag (`rp-dialog`, `rp-carousel`, `rp-quantity`, `rp-navigation-menu`, the commerce tags and `rp-view-event`) and for `ui-tabs`, `ui-tabs-list`, `ui-tabs-panel`, `ui-toast-region`; `contents` for `ui-tabs-tab`, `ui-tooltip-trigger`. `ui-tooltip` and `ui-tooltip-content` have no static display rule (UI SDK gives them none). |
| C-3 | `rp-dialog { position: absolute; inline-size: 0; block-size: 0; }` (9.1, D-080). |
| C-4 | `rp-quantity:not(:defined) [data-rp-js="inflow"]` and `rp-carousel:not(:defined) [data-rp-js="inflow"]` are `visibility: hidden`. These generated rules are in the file `base.css`, in layer `rp.props` (D-021 item 4). No rule hides the disclosure buttons of NavigationMenu. |
| C-5 | Component CSS never sets `display` on `dialog` or `[popover]` except under `[open]` and `:popover-open` respectively. Otherwise a closed dialog or popover becomes visible. |
| C-6 | Under `@media (scripting: none)`: every `ui-tabs-panel` is displayed (overriding C-1 for panels) and `ui-tabs-list` is not displayed (D-012). This block is in `@layer ui-sdk` and is `!important`; it and C-1 are the only two `!important` rules Ripple writes (D-021, D-025). |
| C-7 | Component CSS never sets `display: contents` or `display: none` on a custom element root (D-080 item 3). |

---

## 11. Events and state attributes

### 11.1 Element events

Every element event follows D-023: one lowercase word, dispatched on the component ROOT, `bubbles: false`.

| Event | Dispatched on | `detail.value` | Cancelable | `detail.reason` values |
|---|---|---|---|---|
| `openchange` | `rp-dialog` | `boolean` | yes (9.1 item 3; D-023, D-036) | `trigger-press`, `close-press`, `escape-key`, `outside-press`, `link-press`, `imperative` |
| `valuechange` | `rp-quantity` | `number` | yes (8.2 item 4; D-023, D-036) | `increment-press`, `decrement-press`, `input-commit`, `imperative` |
| `indexchange` | `rp-carousel` | `number` | no: cancelling has no effect (9.2 item 5; D-016, D-023) | `next-press`, `previous-press`, `scroll`, `imperative` |
| `valuechange` | `ui-tabs` | `string` (the tab value) | yes (UI SDK; D-023, D-036). The veto on Tabs is UNVERIFIED in a browser (`10-components-interactive.md`) | UI SDK's; `item-press` for a click (verified). Other values: `uisdk/packages/core/src/foundation/kernel/details.ts` |
| `openchange` | `ui-tooltip` | `boolean` | UI SDK's; not part of Ripple's API (Tooltip has no callback and no controlled prop) | UI SDK's (`trigger-hover`, `trigger-focus`, `escape-key` in the vocabulary; not exercised by the spike) |
| `action` | `rp-product-form` | `05-commerce.md` | yes (D-023): cancelling stops the cart from opening after a successful add | `05-commerce.md` |

Cancelable events of the element layer, complete list (ledger section 4.7): `openchange` on `rp-dialog`; `valuechange` on `ui-tabs` and on `rp-quantity`; `action` on `rp-product-form`. `indexchange` is NOT cancelable. A controlled React prop exists only where an element has both a settable property and a cancelable event (D-036): `open` on Dialog and Drawer, `value` on Tabs and QuantityInput.

Common rules:

1. `event.detail` is `{ value, reason, source }`. `source` is how the user caused the change: `mouse`, `touch`, `pen`, `keyboard`, `virtual`, `programmatic` or `agent`.
2. Because the events do not bubble, a listener MUST be added on the root itself, or in the capture phase on an ancestor: `document.addEventListener("openchange", handler, true)` (verified). `event.target` is the root.
3. Writes through an element property or attribute fire no event (D-023 item 1).
4. `rp-navigation-menu` and `rp-view-event` dispatch no Ripple event (D-023). Native elements dispatch their native events only (`toggle` on `<details>` and on popovers, `change` and `input` on form controls, `close` on `<dialog>`).
5. React callback names are `on` + the PascalCase split of the event, with signature `(value, detail)` (D-023 item 3): `onOpenChange`, `onValueChange`, `onIndexChange`, `onAction`. Details: `06-bindings.md`. The `html`, `remix` and `liquid` hosts have no callbacks; code listens to the DOM events.
6. Document events `rp:refresh` (cancelable) and `rp:refreshed`: `05-commerce.md`. No non-commerce element dispatches or listens to them; non-commerce elements survive a refresh by rule R-5.

Listening example (complete):

```html
<script type="module">
  // The id is on the <dialog>; the event is dispatched on its parent, the rp-dialog root.
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
| `rp-carousel` | `prev` and `next` buttons | `disabled` (on `next` it MAY be written at upgrade; allow-listed, 9.2 item 6) |
| `rp-dialog` | nothing | The root and the dialog get no attribute from the element |
| `rp-navigation-menu` | nothing | |
| UI SDK Tabs | tab buttons, panels | `aria-selected`, `tabindex`, `data-selected`, `aria-controls`, `hidden`, `role`, `id`, `aria-labelledby`, `data-activation-direction` |
| UI SDK Tooltip | content | `hidden`, `data-open`, `data-closed`, `popover`, `style` |
| UI SDK Toast | region and its children, from the first `toast()` call on | allow-list entry 2 of `02-html-contract.md` section 7.3 |

CSS selects state through these names only: `dialog[open]`, `details[open]`, `:popover-open`, `:disabled`, `:checked`, `[aria-selected="true"]`, `[data-selected]`, `[data-open]`, `[data-closed]`, `[hidden]`. `data-state` MUST NOT be used (D-021).

### 11.4 Hook attributes read by the behaviour layer

| Attribute | Read by | Values |
|---|---|---|
| `data-slot` | UI SDK kernel | the tag name on an `rp-*` root; the value UI SDK writes on elements of the `ui-*` families (`tabs`, `tabs-list`, `tabs-tab`, `tabs-panel`, `tooltip-trigger`, `tooltip-content`, `toast-region`). `ui-tooltip` itself carries none. The Tooltip trigger button gets `data-slot="tooltip-trigger"` from the `tooltip` prop (D-082). `rp-view-event` carries none (D-089) |
| `data-rp-part` | `rp-*` elements | `input`, `increment`, `decrement` (`rp-quantity`); `viewport`, `item`, `prev`, `next` (`rp-carousel`); `item` (`rp-navigation-menu`); `status` (announcer, inside a `<dialog>`) |
| `data-rp-open` | runtime opener | id of a `<dialog>`; printed only by the prop `dialog` (D-009) |
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
| `html`, `remix` | `const { createAgent } = await (await import("/ripple/ripple.js")).loadAgent()` (the URL MUST be the one in the page's script tag) |
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
3. A root gets a label in the snapshot only from its own accessible name. `rp-carousel` has `aria-label`. `rp-dialog`, `rp-quantity` and `rp-navigation-menu` roots have none and appear by tag name. This is decided (D-065 item (c), D-095): no label is added, no contract changes, and checker rule RP607 applies only to roots that declare actions as narrowed there.
4. A root is listed only when it has a box. Every `rp-*` root is `display: block` for this reason (R-10, D-080).
5. The manifest records these declarations: `agent.surface: "bridge"` is allowed for kind `native` (`rp-dialog`), and `agent.actions[]` lists the names above (D-065).

### 12.3 `data-agent-confirm`, `data-agent-secret`, `data-agent-hidden`

These are the only `data-agent-*` attributes (D-065).

| Attribute | On | Value | Effect in the bridge |
|---|---|---|---|
| `data-agent-confirm` | a native control (button, link, submit button) | One sentence that says what the control does, in the page language | The bridge refuses to activate the control and answers that a person must do it. Verified: for `<button data-agent-confirm="Closes the size guide">Close</button>` inside `rp-dialog`, `act` returned `Needs a person: "Closes the size guide". Ask them to press "Close" themselves.` and the dialog stayed open (`ripple/docs/research/spikes/elements-runtime/results-agent-confirm.txt`). |
| `data-agent-secret` | a form control | empty | The bridge does not reveal the control's value (`uisdk/apps/docs/content/docs/agents/connect-an-agent/permissions.mdx`; not exercised by the spike) |
| `data-agent-hidden` | any element | empty | The bridge omits the element and its subtree (same source; not exercised by the spike) |

Rules:

1. A control that starts checkout, places an order, submits payment or account data, or deletes something MUST carry `data-agent-confirm`. The list of such controls per component is in the component documents and the manifest key `agent.confirm[]`. `data-agent-confirm` is REQUIRED on CheckoutButton (D-095).
2. The value MUST be a complete sentence. It is user-visible text to the agent's user and is a locale key (D-066).
3. These attributes do nothing for agents that drive the browser from outside; such agents see the accessibility tree. `08-agent-kit-and-evals.md` states what host agents MUST do with them.
4. Whether the bridge enforces confirmation for a METHOD listed in `agent.actions` (as opposed to a native control) is SPIKE-08, owned by `08-agent-kit-and-evals.md`. No element of this document needs it. On the default path `rp-cart` declares no `checkout` action (D-050).

---

## 13. Acceptance tests

Tiers are those of D-063. Every test runs in Chromium; tests marked X also run in WebKit and Gecko (tier 9). A test of a feature that is above the browser floor (the `popover` attribute, `<details name>`, `closedby`, the Navigation API, `@media (scripting: none)`) MUST feature-detect and skip, not fail, on an engine without it (D-081).

"Page P" is one page, loaded with `browser/ripple.elements.js` and the static CSS of 10.16, whose `<body>` contains these fixtures in this order. Each is the byte-equal markup of the named fixture of the owning document (the copies in sections 8.1 and 10):

| # | Markup | Source |
|---|---|---|
| 1 | Button `dialog-opener` | `09-components-foundation.md` (10.1) |
| 2 | Dialog `default` (`id="size-guide"`), with IconButton `dialog-closer` inserted as the last child of its `<dialog>` | `10-components-interactive.md`, `09-components-foundation.md` (10.1) |
| 3 | The Drawer link opener, then Drawer `default` (`id="filters"`) | `10-components-interactive.md` (10.2) |
| 4 | Tooltip `default` | `10-components-interactive.md` (10.4) |
| 5 | Toast `default` | `10-components-interactive.md` (10.6) |
| 6 | Tabs `default` | `10-components-interactive.md` (10.7) |
| 7 | Accordion `single` | `10-components-interactive.md` (10.8) |
| 8 | Carousel `default` (`id="featured"`), with the test-only style `#featured-list { inline-size: 200px; } #featured-list > li { flex: 0 0 200px; }` so that exactly one of the three items fits | `10-components-interactive.md` (10.9) |
| 9 | QuantityInput `default-value` | `10-components-interactive.md` (8.6) |
| 10 | NavigationMenu `default` (`id="main-nav"`) | `12-components-chrome-and-blueprints.md` (10.15) |

In the steps below, "the opener button" is item 1, "the close button" is the IconButton inside item 2, "the link" is the `<a data-rp-open="filters">` of item 3, and "host" is the `rp-dialog` parent of `<dialog id="size-guide">`.

The spike page `ripple/docs/research/spikes/elements-runtime/site/index.html` is an earlier form of page P with pre-reconciliation markup; `test.mjs` there implements E-01 to E-17 and E-20 against it. The implementer MUST port those tests to page P as defined here.

| Id | Tier | Steps | Expected |
|---|---|---|---|
| E-01 X | 3 | Load page P with a `MutationObserver` on `document` installed by a classic script at the end of `<body>`, before modules run. Wait until `rp-dialog`, `ui-tabs` and `ui-tooltip` are defined. Ignore records whose new value equals the old value (a same-value write is not a mutation, D-002). Then call `toast("x")` and wait until `ui-toast-region` is defined. | Before the `toast()` call: zero mutations inside `rp-dialog`, `rp-quantity`, `rp-carousel`, `rp-navigation-menu`, `ui-tabs`, `ui-tooltip` and `ui-toast-region`; on `a[data-rp-open]` only `aria-haspopup` and `aria-controls` were added. After the `toast()` call: inside `ui-toast-region` only writes covered by entry 2 of `02-html-contract.md` section 7.3 (`style` attribute writes and child insertion). |
| E-02 | 5 | On page P, record script requests for 1000 ms after `load`. Do not call `toast()`. | Requested, each exactly once: `ripple.elements.js`, `ripple.elements-tabs.js`, `ripple.elements-tooltip.js`, `ripple.elements-shared.js` (imported by the tooltip chunk). Not requested: `ripple.elements-toast.js`, `ripple.elements-agent.js`. |
| E-03 | 5 | Load a page that contains only the markup of 8.1 and the Toast `default` fixture of 10.6. | Only `ripple.elements.js` is requested. |
| E-04 | 5 | On the page of E-03, insert the Tabs markup of 10.7 with `insertAdjacentHTML`. | `ripple.elements-tabs.js` is requested once; clicking the second tab selects it. |
| E-05 X | 5 | Click the opener button of 10.1; press Escape. | `openchange` `{ value: true, reason: "trigger-press" }`, then `{ value: false, reason: "escape-key" }`; focus is on the opener button. |
| E-06 X | 5 | Open the dialog with the opener button; click the close button. Open it again; click the backdrop at viewport coordinate (2, 2). | Reasons `close-press`, then `outside-press`; the dialog is closed after each. |
| E-07 | 5 | Add an `openchange` listener that calls `preventDefault()` when `detail.value` is `true`; click the opener. | `dialog.open === false` after 50 ms. |
| E-08 | 5 | `host.api.open()`, `host.api.close()`, `host.open = true`. | Two `openchange` events with reason `imperative`; the property write opens the dialog and fires no event. |
| E-09 | 5 | After E-05 to E-08: read the outer HTML of the `rp-dialog` opening tag. | Identical to the server markup (no attribute added). |
| E-10 X | 5 | Click the link. Close the drawer with Escape. Then Ctrl+click the link (Meta+click on macOS). | First: the drawer opens (`openchange` with reason `trigger-press`), the URL does not change, the link has `aria-haspopup="dialog"` and `aria-controls="filters"`. Second: no `openchange`; the browser's default action runs. |
| E-11 | 5 | Insert `<a href="?y=1">go</a>` as a child of `<dialog id="size-guide">`. Open the dialog; call `history.pushState({}, "", "?x=1")`; then click the inserted link (Chromium, Navigation API; skip where `window.navigation` is undefined). | The dialog is open after `pushState`; it is closed, with reason `link-press`, after the link click. |
| E-12 | 5 | Load a page with Dialog fixture `default-open` of `10-components-interactive.md` (`id="promo"`, `data-default-open=""` on the `<dialog>`). | After upgrade `dialog.open === true` and `dialog.matches(":modal")`. Remove the `rp-dialog` from the document, close the dialog, re-insert: it stays closed. |
| E-13 X | 5 | Section 8.6 cases Q-2 to Q-14. | As listed there. |
| E-14 X | 5 | Carousel of page P (one of three items fits). Wait for each scroll to come to rest (no `scroll` event for 200 ms) between steps: click `next` twice; call `api.goTo(1)`; set `element.index = 0`; scroll the viewport with the mouse wheel by 200 px; add an `indexchange` listener that calls `preventDefault()` and click `next`. | At load `prev` has `disabled` and `next` has none. Each `next` click dispatches one `indexchange` with reason `next-press` (values 1, then 2); after the second, `prev` has no `disabled` and `next` has `disabled`. `goTo(1)` dispatches `indexchange` with reason `imperative` and value 1. The property write dispatches no event and `api.getIndex() === 0`. The wheel scroll dispatches `indexchange` with reason `scroll`. With the cancelling listener the viewport still scrolls and `api.getIndex()` returns the new index (cancelling has no effect). |
| E-15 X | 5 | NavigationMenu of page P (item 1 "Shop" has the panel `main-nav-item-1`; item 2 "About" has none). Skip where `HTMLElement.prototype` has no `popover`. Hover item 1 with a mouse pointer for 200 ms; move the pointer to item 2 and wait 300 ms; focus the "Shop" link and press ArrowRight, End, Home, ArrowDown, Escape; click the disclosure button twice; open the panel and call `element.api.close()`. | The panel matches `:popover-open`; the panel no longer matches it; focus is on the "About" link after ArrowRight, still on it after End, on the "Shop" link after Home; after ArrowDown the panel is open and the "Shirts" link has focus; Escape closes the panel; the first click opens the panel and the second closes it; `api.close()` closes it. During the whole test no attribute inside `rp-navigation-menu` changed and no `openchange`, `valuechange` or `indexchange` event was dispatched on it. |
| E-16 | 5 | On page P call `await toast("Saved")`, with `toast` imported from the main file URL. | `ripple.elements-toast.js` has been requested exactly once; a `ui-toast` element whose text contains `Saved` is inside `ui-toast-region`. A second `toast("Again")` makes no further script request. |
| E-17 | 5 | Load the bridge with `loadAgent()`, call `createAgent().snapshot()`. | Entries exist for `rp-quantity` with actions `setValue`, `increment`, `decrement`; for `rp-dialog` including `open`, `close`; for `rp-carousel` including `next`, `previous`, `goTo`. `act` with `increment` on `rp-quantity` increases the input's value by its step. |
| E-18 | 5 | On page P with scripting enabled, before any click: computed styles. | `display` of each tag equals 10.16 C-2; `rp-dialog` has `position: absolute` and a 0 by 0 box and `checkVisibility() === true`; closed `<dialog>` and closed `[popover]` have `display: none`; with the module blocked, the `data-rp-js="inflow"` buttons have `visibility: hidden` and a non-zero box. |
| E-19 X | 6 | Page P with scripting disabled. | The quantity input accepts typing; the carousel viewport scrolls (`scrollLeft` changes after a wheel event); the link navigates to `/collections/all`; the NavigationMenu disclosure button opens its panel (skip without the `popover` attribute); clicking the second `<summary>` of the Accordion opens it and closes the first (skip the "closes the first" assertion without `<details name>` support); in Chromium the opener button opens the dialog. |
| E-20 | 5 | Liquid form: a page with the import map of 5.4 (six entries) pointing at `pkg/registry/liquid/assets/` and the markup of page P. After `load`, call `await toast("Saved")` imported from `"ripple"`. | Before the `toast()` call each of `ripple.js`, `ripple-tabs.js`, `ripple-tooltip.js`, `ripple-shared.js` has been requested exactly once and `ripple-toast.js` not at all; after it `ripple-toast.js` has been requested exactly once and a `ui-toast` is shown; tabs select on click; the bridge loaded with `import("ripple/agent")` lists both a `ui-tabs` and an `rp-quantity` entry (one kernel). |
| E-21 | 1 | Search the text of every file in `pkg/registry/liquid/assets/*.js` for `from"./`, `from "./`, `import("./`, `import"./`. | No match. |
| E-22 | 10 | Gzip (level 9) each `.js` file of `pkg/browser/` and of `pkg/registry/liquid/assets/`. | The gzip size of every file is at most the budget that `size-budget.json` gives for it. The test reads every limit from `size-budget.json` (owned by `13-testing.md`; values fixed by D-064, among them `shared` 10 kB and `agent` 14 kB in each set) and contains no number of its own. `pkg/browser/` holds exactly the 12 `.js` files of 4.2 and `pkg/registry/liquid/assets/` exactly the 6 of 5.4. |
| E-23 X | 5 | Page with the inline script of 3.3 and, before it, a script that deletes `HTMLButtonElement.prototype.commandForElement`. Click the opener; click the closer. In WebKit and Gecko builds without Invoker Commands, omit the deleting script. | The dialog opens and closes; the dialog receives a `command` event whose `source` is the pressed button; `window.rpCommandsPolyfill === true`; `openchange` reasons are `trigger-press`, `close-press`. |
| E-24 | 1 | Static check over `src/elements/rp-*.ts` and `src/commerce/rp-*.ts`. | Each file: contains exactly one `definePrimitive(` and one `createParts(`; the `createParts` argument has only the key `root`; `display` is `"block"` (D-080); `name` equals the file's base name; contains no `data-state`; contains no `attachQuantityInput`; imports `announce` only from `../runtime/announcer` or `../runtime/index`. Every `rp-*` key of `src/gen/elements.json` has `display` equal to `block`. |
| E-25 | 5 | Make `import("./ripple.elements-tabs.js")` fail (block the request). | One `console.error` starting with `[ripple] chunk "tabs" failed to load`; `rp-quantity` and `rp-dialog` still work; the default tab panel is visible. |
| E-26 X | 5 | `valuechange` veto on `rp-quantity` (D-036): section 8.6 cases Q-6, Q-13 and Q-14. | A `valuechange` listener that calls `preventDefault()` leaves `input.value` unchanged and the element's `value` property equal to the previous value, for a button press, a typed commit, `api.setValue` and `api.decrement`; a later write to the `value` property still applies. |
| E-27 | 5 | Toast loading (D-054 item 2, D-083). Load a page whose `<body>` contains only the Toast `default` fixture (an empty `ui-toast-region`), with `browser/ripple.elements.js`. Record script requests for 1000 ms after `load` without calling `toast()`. Then call `await toast("Saved")`. Repeat the whole test with `browser/ripple.js`. | Before the call: no request whose file name is `ripple.elements-toast.js` or `ripple.elements-shared.js` (second run: `ripple-toast.js`, `ripple-shared.js`); `customElements.get("ui-toast-region")` is `undefined`; zero mutations inside the region. After the call: the `toast` chunk and the `shared` chunk of the loaded set have each been requested exactly once, and a `ui-toast` element whose text contains `Saved` is inside the region. |
| E-28 | 1 | Inline polyfill (D-008, D-054 item 7, D-078). Read `pkg/registry/liquid/snippets/rp-head.liquid`; take the text of its one classic `<script>` element that contains `rpCommandsPolyfill`. Search every `.js` file of `pkg/browser/` and `pkg/registry/liquid/assets/` for the string `button[commandfor]`. | The script text equals `"\n" + INLINE_COMMANDS_POLYFILL + "\n"` (the constant of `src/runtime/commands-polyfill.ts`) byte for byte. The string `button[commandfor]` occurs exactly once in each main file (`ripple.js`, `ripple.elements.js`, and the Liquid `ripple.js`) and in no chunk: the constant is not shipped to browsers. |
| E-29 | 5 | Globals (D-078). On page P after upgrade, compare `Object.keys(window)` with the same list taken in an identical page that loads no Ripple script. | The only added keys that start with `rp` are `rpRuntime`, and `rpCommandsPolyfill` when the browser lacks Invoker Commands. Ripple adds no other global. |
| E-30 | 1 | Server import (D-054 item 5). Under Node, with no DOM globals defined, run `await import()` on the built `dist/elements/index.mjs` and on `dist/commerce/index.mjs`. | Neither import rejects, nothing is written to stderr, and no global is added to `globalThis`. If this test fails, the fix is to wrap every `createParts(...)` call and the `guard("lazy chunks", ...)` call in `if (typeof document !== "undefined") { ... }`; no contract changes. UNVERIFIED until run (section 14 item 4). |

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
3. React 19 and Remix 3 printing `commandfor`, `command`, `popovertarget` unchanged, and `popover=""` on a `<div>` (SPIKE-05, `06-bindings.md`).
4. Importing `<pkg>/elements` and `<pkg>/commerce` under Node (D-054 item 5 requires that they do nothing there; test E-30 settles it).
5. `ripple.js` size with real commerce code. The spike used a stand-in; the 45 kB budget leaves 22.7 kB for commerce and Hydrogen, and `05-commerce.md` measured the commerce layer alone at 22.5 kB. The size of the real `ripple.js` is UNVERIFIED until both are built together (D-064); E-22 settles it.
6. Tooltip keyboard focus and Escape behaviour, `data-agent-secret`, `data-agent-hidden`: read in source or docs, not exercised.
7. The light-dismiss click fallback of `rp-dialog` (9.1 item 5): Chromium supports `closedby`, so that branch did not run.
8. The Navigation API branch of `rp-dialog` outside Chromium (the API is absent there and the branch is skipped).
9. The three post-spike code changes listed at the top of this document (loader `tag: null`, `toast` registration and parameter name, `INLINE_COMMANDS_POLYFILL`): typechecked, bundled and (loader and toast) run only in a throwaway copy of the spike, not in the spike directory; the equality of the inline Liquid script with `INLINE_COMMANDS_POLYFILL` was not run. Tests E-16, E-27, E-28.
10. The zero-mutation upgrade on the reconciled markup (copies of the owning documents in 8.1 and 10): the spike directory ran on earlier markup; a re-run on the copies as of 2026-11-21 passed with zero mutations, outside the repository; tests E-01 and Q-1 settle it for the final fixtures. Doc 10 marks the Tooltip fixture for re-capture for the same reason.
11. The `valuechange` veto on `ui-tabs` in a browser (D-036; owned by `10-components-interactive.md`). The veto on `rp-quantity` for a button press was run (spike line "quantity: canceled valuechange"); for a typed commit and for `api.setValue` it follows from the same `commit()` function and is tested by Q-13.
12. The minimum versions of the `popover` attribute and of exclusive `<details name>` (from compatibility tables, not run; D-081, SPIKE-06).

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
5. Tests E-01 to E-30 apply unchanged, except E-17 (replaced by: the snapshot lists the native buttons inside each root) and E-24 (replaced by: each file contains exactly one `extends RippleElement` and one `defineElement(`).

### Fallback (SPIKE-05)

Applies only if a TSX host does not print `commandfor` / `command` / `popovertarget` unchanged, or the polyfill fails in an engine. `data-rp-close`, and `data-rp-open` on a `<button>`, exist on this path ONLY and are never printed on the default path (ledger section 4.4). The second part of this fallback, Popover printing `popover="auto"` in all four hosts when a host cannot print `popover=""`, needs no change in this document: the browser, the polyfill (`target.popover`) and `rp-navigation-menu` (`[popover]`) treat both values the same. The markup change is specified in `02-html-contract.md` ("Fallback (SPIKE-05)"): buttons additionally carry `data-rp-open="<id>"` or `data-rp-close="<id>"`.

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

### Capability tiers inside the browser floor (D-081)

This is not a spike fallback but decided behaviour. The floor of D-032 (Chrome and Edge 111, Safari 16.4, Firefox 128) is kept (ledger Q15). `01-architecture.md` section 10 owns the table; the rows this document implements:

| Feature | Below its first version | Where |
|---|---|---|
| Invoker Commands | Polyfilled | 3.3 |
| `popover` attribute (Chrome 114, Safari 17.0, Firefox 125; UNVERIFIED) | The panel is ordinary in-flow content, always visible. The opener button is present and does nothing. `rp-navigation-menu` does nothing. No polyfill | 9.3 item 5, 10.3, 10.15 |
| Exclusive `<details name>` (Chrome 120, Safari 17.2; UNVERIFIED) | An Accordion with `type="single"` behaves as `multiple` | 10.8 |
| `@media (scripting: none)` | Tabs without JS shows only the default panel | 10.7 |
| `closedby` | `rp-dialog` backdrop-click fallback | 9.1 item 5 |
| Navigation API | `rp-dialog` does not close on navigation | 9.1 item 7 |

### Fallback (SPIKE-07)

Owned by `12-components-chrome-and-blueprints.md`. If `popover` panels are not usable for the desktop menu, panels become CSS-only dropdowns and each disclosure button toggles `aria-expanded`. Effect on this document: `rp-navigation-menu` keeps its tag, its `item` part and its arrow-key behaviour (9.3 item 3); hover intent is removed (CSS `:hover` does it); the element gains one delegated `click` handler that toggles `aria-expanded` on a pressed disclosure button and sets it to `false` on the others, and `api.close()` sets every `aria-expanded` to `false`. The server then prints `aria-expanded="false"` on those buttons.

---

## Ledger issues

None open. See `00-decisions.md` sections 13.2 and 13.3 (D-109 to D-113).
