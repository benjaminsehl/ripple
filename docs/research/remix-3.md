# Remix 3 binding: findings for Ripple

Scope: how Ripple components are written for Remix 3, what Remix does to custom elements at render, hydration, frame reload and navigation, how assets and forms work, how Hydrogen core is wired into a Remix 3 app, and the exact binding patterns.

Evidence tags: **[RUN]** observed in this investigation (Node 22.23, headless Chromium via Playwright, published npm packages). **[SRC]** read in the local clone. **UNVERIFIED** not seen in source and not run.

Versions: `remix@3.3.0` (`@remix-run/component@1.3.0`, `@remix-run/ui@0.14.0`), `@ui-sdk/web@0.1.0-beta.14`, `@shopify/hydrogen@2026.10.3`. npm was reachable. Clone commit `275f353c` (2026-11-20). Remix declares `engines.node >= 24.3.0` (`remix/packages/remix/package.json`); the component runtime, server renderer and asset server ran on Node 22 in this spike, the Remix dev server (`remix/node-tsx`) was not run.

Spike: `docs/research/spikes/remix/` (copy of `scratchpad/spikes/remix`). Results: `out/ssr-result.txt`, `out/result.txt`, `out/island-result.txt`, `out/race-result.txt`. Reproduce with `README.md` there.

This report builds on `docs/research/react-and-custom-elements.md` (rules R-1 to R-5) and `docs/research/uisdk-web-elements.md` (contracts, ids, upgrade behaviour). It does not repeat them.

---

## 1. Headline conclusions

1. **A Ripple component in Remix is a plain server component that prints the HTML contract. It needs no `clientEntry`.** `ui-*` and `rp-*` elements upgrade themselves. [RUN] `Button`, `Stack`, `Dialog`, `Tabs`, `AddToCart` rendered with `renderToString`, upgraded and worked in Chromium with no client entry on the page.
2. **Remix never replaces the page on navigation. It morphs the live DOM** (`remix/packages/component/src/runtime/diff-dom.ts`). After `run()` starts, every same-origin link and form becomes a fetch of HTML that is diffed into the current document (Chrome/Edge 135+; other browsers do document navigation). Matched elements keep their node and their custom-element instance; attributes are overwritten with the server's. [RUN]
3. **Without countermeasures the morph breaks `ui-*` elements that are not in their initial state.** [RUN] After a top-frame reload with a dialog open and the second tab selected: dialog content got `hidden=""` back while `el.open === true` and it was still `:popover-open`; tab attributes said "one" while `tabs.value === "two"`. This is the Remix equivalent of risk R1 and it is real.
4. **Remix ships the exact tools to fix it**, and each was verified:
   - `data-rmx-key="<id>"` on every root: stops one component being morphed into a different one. Without it `ui-dialog#dlg` was morphed into `ui-dialog#other` and kept stale ids (`aria-controls="dlg-content"` on page B). [RUN]
   - `data-rmx-preserve-attrs="<names>"` on every part that owns attributes: live state survives reloads while server content inside still updates. [RUN]
   - `data-rmx-preserve-dom` on a root: the whole subtree becomes element-owned; server changes below it are ignored. [RUN]
5. **Native elements need none of this.** `diff-dom.ts` already preserves `details[open]`, `dialog[open]`, `[popover]` open state, `input.value`, `input.checked`, `option.selected`, `textarea` value (`shouldPreserveLiveAttribute`, `shouldPreserveElementChildren`) [SRC]. Every contract that uses a native element instead of a `ui-*` element is free in Remix. This agrees with the base theme's "native browser behavior first" rule (`theme/AGENTS.md`).
6. **Hydrogen cart forms MUST opt out of Remix form interception** with `data-rmx-document`. Remix commits the URL to the form `action` before it fetches, so the request's `Referer` is the action URL; Hydrogen's cart handler redirects a form POST to the referer (`hydrogen/packages/hydrogen/src/core/cart/server-handlers.ts:616`), which sends the browser to `GET /api/cart`. [RUN] reproduced: `referer=http://localhost:4173/api/cart`, then `GET /api/cart`, then "Failed to resolve frame". With `data-rmx-document` the POST is a document navigation, the referer is the page, and the 303 lands back on the page. [RUN]
7. **Interactive Ripple components MUST take a required `id` in Remix.** `handle.id` is `s<random>-<n>` on the server and `c<n>` in the browser (`server/stream.ts` `createServerComponentId`, `runtime/reconcile.ts:1484`) [SRC]. There is no hydration-stable generated id like React's `useId`.
8. **Inside a `clientEntry`, hydration resets element-owned attributes.** [RUN] A dialog opened before hydration got `hidden=""` and `data-closed=""` written back by hydration. `data-rmx-preserve-attrs` does not apply to hydration. Fix: define the elements after `await app.ready()`.
9. **Element JS SHOULD be the prebuilt `ripple.js`, not the Remix asset server.** The asset server serves one module per file: `import "@ui-sdk/web/dialog"` alone became 116 `@ui-sdk` module requests (149 preloads for an entry with run + dialog + cart store). [RUN]
10. **The Remix binding source is the React binding minus hooks, plus three `data-rmx-*` attributes.** Static and commerce bindings differ from React only in the function wrapper and types. Both can be generated from one contract template (section 12).

---

## 2. How Remix components are written

Sources: `remix/.agents/skills/remix/SKILL.md`, `remix/docs/site/app/actions/guides/chapters/04-rendering-ui.md`, `05-interactivity.md`, `remix/packages/component/src/index.ts`, `runtime/component.ts`.

### 2.1 Component shape

A component is a setup function that returns a render function. Setup runs once per instance; render runs on every update. There are no hooks.

```tsx
import type { Handle, RemixNode } from 'remix/component'

export function Card(handle: Handle<{ title: string; children?: RemixNode }>) {
  // setup: once
  return () => (            // render: every update. Read handle.props HERE, not in setup.
    <article class="card">
      <h2>{handle.props.title}</h2>
      {handle.props.children}
    </article>
  )
}
```

`Handle<Props, Context>` members (`runtime/component.ts:103`): `id: string`, `props: Props`, `context`, `update(): Promise<AbortSignal>` (throws on the server), `queueTask(task)` (no-op on the server), `frame: FrameHandle`, `frames: { top; get(name) }`, `signal: AbortSignal`.

Children type is `RemixNode` = `RemixElement | string | number | bigint | boolean | null | undefined | RemixNode[]` (`runtime/core/vnode.ts`).

Components are synchronous. Data loading happens in route actions and is passed as props (`06-streaming-ui-with-frames.md`).

### 2.2 Mixins: `mix`, `on`, `css`, `attrs`, `ref`, `link`

`mix` is a prop on host elements that takes one mixin or a nested array (`05-interactivity.md` "Composing behavior with mix").

| Mixin | Signature | Server behaviour |
|---|---|---|
| `on(type, handler, capture?)` | `handler(event, signal)`; `capture` is a boolean (`runtime/mixins/on-mixin.ts:84`) | not rendered (`ssr: false`); listeners attach only inside a hydrated `clientEntry` or client root |
| `css({...})` | CSS object with nesting | emits a generated class and a `<style data-rmx-style>` rule in `@layer rmx` |
| `attrs({...})` | default attributes | rendered |
| `ref((node, signal) => ...)` | runs on insert | not rendered (`ssr: false`) |
| `link(href, options)` | client navigation on any host | rendered as link semantics |

Consequences for Ripple:

- Ripple bindings MUST NOT use `css()`. It adds generated class names and style tags, so the printed HTML would differ from the contract and the fixtures.
- Ripple bindings MUST NOT use `on()` or `ref()`. They do nothing unless the binding is inside a `clientEntry`, and Ripple behaviour lives in the elements.
- App code MAY listen to element events with `on()` from its own `clientEntry` (section 9.4).

### 2.3 JSX runtime facts

tsconfig: `"jsx": "react-jsx", "jsxImportSource": "remix/component"` (`remix/template/tsconfig.json`).

All of the following were run (`out/ssr-result.txt`) and match source (`runtime/core/props.ts`, `server/stream.ts` `renderAttributes`).

| Input | Server output | Rule in source |
|---|---|---|
| `class="b" className="a"` | `class="b a"` | both accepted and merged (`getMergedClassName`) |
| attribute order | **`class` is always printed last**, others in prop order | [RUN] |
| `hidden` / `hidden={true}` | ` hidden` (bare, no `=""`) | boolean `true` prints a bare attribute |
| `disabled={false}` | omitted | boolean `false` omits |
| `data-x={true}` | `data-x="true"` | `data-*`, `aria-*`, `value` and a short list (`draggable`, `spellcheck`, ...) stringify booleans (`shouldStringifyBooleanAttribute`) |
| `data-y=""` | `data-y=""` | strings print as given. **Use `""` for presence attributes such as `data-closed`, `data-selected`.** |
| `aria-hidden={true}` | `aria-hidden="true"` | |
| `undefined` / `null` | omitted | both mean "absent" |
| `tabIndex={-1}` | `tabindex="-1"` | names are lower-cased; `htmlFor`→`for`, `className`→`class`, `acceptCharset`, `httpEquiv` mapped (`computeAttributeName`) |
| `fooBar="x"` | `foobar="x"` | any non-`data-`/`aria-` name is lower-cased |
| `default-open` on `ui-dialog` | `default-open` | hyphenated names pass through |
| `onclick="..."`, any prop matching `/^on/i` | **dropped** | `UNSAFE_HOST_PROP_NAME` in `props.ts`. No `ui-*`/`rp-*` attribute may start with `on`. None in UI SDK beta.14 do (checked against Appendix A of `uisdk-web-elements.md`). |
| `{'a'}{1}{'<b>'}{null}{false}` | `a1&lt;b&gt;` | adjacent text is concatenated, **no comment separators**; `null`/booleans render nothing |
| `<ui-dialog-backdrop ...></ui-dialog-backdrop>` | explicit close tag | unknown tags are printed as normal elements; only the HTML void list self-closes |
| `innerHTML={unsafeHTML(html)}` | raw HTML | plain strings are rejected for `innerHTML` (`04-rendering-ui.md`). Use this for `RichText` / `ArticleBody`. |
| `href="javascript:..."` | replaced with a throwing URL | `sanitizeUrlAttribute` |

In the browser (client render inside a `clientEntry`), Remix sets a DOM **property** when `name in element`, except for a fallback list (`width`, `height`, `href`, `list`, `form`, `tabIndex`, `download`, `rowSpan`, `colSpan`, `role`, `popover`, `translate`) (`canUseProperty`). For an upgraded custom element this means `open={true}` or `value="x"` assigns the live property. [RUN] A `Tabs` and a `Dialog` created on the client by a `clientEntry` produced the same attributes as the server contract (`hidden=""`, `value="a"`, `data-selected=""`), upgraded on insertion and worked (`out/island-result.txt` step 4).

### 2.4 Fixture comparison consequence

Remix output is DOM-equal to the contract but not byte-equal: `class` is last and booleans are bare. Conformance tests for the Remix binding MUST parse the HTML and compare DOM (tag, attribute set, attribute values, child order, text), not bytes. This matches item 16 of `react-and-custom-elements.md`.

---

## 3. Server rendering and streaming

- `renderToString(node: RemixNode, options?: { nonce?: string }): Promise<string>` and `renderToStream(node, options?: RenderToStreamOptions): ReadableStream<Uint8Array>` from `remix/component/server` (`server/stream.ts:336`, `:2029`). `RenderToStreamOptions`: `frameSrc`, `topFrameSrc`, `signal`, `onError`, `nonce`, `resolveFrame`, `resolveClientEntry`.
- Normal pages use the `render()` middleware from `remix/middleware/render`, which installs `context.render(node, init?: ResponseInit): Response` and streams (`remix/packages/render-middleware/src/lib/render-ui.ts:73`). Options: `{ assets?, onError? }`.
- The response gets `<!DOCTYPE html>` and `Content-Type: text/html; charset=UTF-8` from `createHtmlResponse` (`04-rendering-ui.md`).
- `css()` rules are collected into `<style data-rmx-style>` tags in the head during SSR.
- `<Frame src>` without `fallback` is **blocking**: its HTML is in the first chunk. With `fallback`, the fallback is in the first chunk and the real content is streamed later and swapped in by the browser runtime (`06-streaming-ui-with-frames.md`; `consumeFrameTemplate` in `runtime/frame.ts`). The swap needs `run()`. Not run here.
- `remix/html-template` (`html\`...\``, `html.raw`) renders escaped strings without the component runtime (`04-rendering-ui.md`). A Ripple "plain HTML" binding works with it unchanged; no Remix-specific binding is needed for it.

Progressive-enhancement rule that follows: content that must exist without JavaScript MUST NOT be inside a `<Frame>` that has a `fallback`.

---

## 4. `clientEntry` and hydration

Source: `05-interactivity.md`, `runtime/client-entries.ts`, `packages/component/README.md` ("Hydration adopts the server-rendered DOM. Remix patches mismatched attributes and adds missing ones, but leaves extra attributes alone.").

- `clientEntry(import.meta.url, function Name(handle) {...})` marks a hydration boundary. The server wraps its output in `<!-- rmx:h:ID -->...<!-- /rmx:h -->` comments (no wrapper element) and serializes props into `<script type="application/json" id="rmx-data">`. [RUN]
- Props must be serializable. JSX elements are allowed in props; they may use `css()` but no other mixin.
- The browser entry calls `run({ loadModule, ... })`. `app.ready()` resolves after initial entries hydrate.
- Only components inside a client entry run in the browser. A server-only page ships no component code.

Findings [RUN] (`out/island-result.txt`, `out/race-result.txt`):

1. A Ripple `Dialog` rendered inside a client entry hydrates. Hydration re-writes every JSX attribute with the same value (dozens of same-value attribute mutation records), which is harmless for an element in its initial state.
2. Re-rendering the client entry (`handle.update()`) while the dialog is **open** caused only the text mutation that changed. The dialog stayed open and consistent. Remix patches a prop only when its value changed between renders (`patchHostProps`), so element-owned attributes are safe **as long as the binding passes constant values for them**. This is rule R-3 of the React report and holds automatically for bindings that compute state attributes from props that do not change.
3. **Race:** if an element changed state after upgrade and before hydration, hydration writes the server values back. Observed: open dialog got `hidden=""` on content and `data-closed=""` on the trigger while `el.open` stayed `true`. Mitigation: define elements after hydration (section 8.2).
4. Client-created Ripple components (conditional render inside a client entry) print the contract through DOM APIs, upgrade on insertion and work.

Conclusion: Ripple components that only print HTML plus self-upgrading elements need no `clientEntry` (confirmed). They also work inside one.

---

## 5. Frames, navigation, and what happens to custom elements

Sources: `05-interactivity.md` "Client navigation", `06-streaming-ui-with-frames.md`, `runtime/diff-dom.ts`, `runtime/navigation.ts`, `runtime/frame.ts`, `runtime/run.ts`, `remix/decisions/010-browser-support.md`.

### 5.1 Mechanics [SRC]

- After `run()`, the document is `app.frames.top`. Same-origin links and forms are intercepted through the Navigation API. Interception needs `window.navigation` and `NavigateEvent.sourceElement` (`getInterceptableNavigation`). Per decision 010 that is Chrome/Edge 135+; elsewhere links and forms do native document navigation. So **both lifecycles exist in production** and Ripple must be correct in both.
- A navigation fetches HTML (`fetchFrame`: `Accept: text/html`, `X-Remix-Frame: true`, `X-Remix-Target: <name>` for named frames, `mode: 'same-origin'`, redirects followed) and **reconciles it into the live DOM**. Back/forward refetches and reconciles too. [RUN] `window` identity was unchanged across A→B→back.
- The new HTML is parsed into a disconnected document or `<template>` (`parseDocument`, `createFragmentFromString`). Scripts in it are inert and `<noscript>` content is emptied. **Element definitions therefore must come from the entry script loaded on the first document, never from script tags in page bodies.**
- Diff algorithm (`diffSiblingUnits`): siblings with `data-rmx-key` are matched by key first; the rest are matched **by position among same-tag siblings**; unmatched current nodes are removed, unmatched new nodes are inserted. For a matched element: `diffElementAttributes` removes attributes missing from the new HTML and sets changed ones, then children are diffed recursively.
- Exceptions built in: live state of `details`, `dialog`, popovers, inputs, options, textareas (section 1, item 5); `data-rmx-preserve-dom` (skip element entirely); `data-rmx-preserve-attrs="a b c"` (skip those attribute names; the list is read from the **incoming** HTML).
- Named frames: `<Frame name src>`; reload with `handle.frame.reload()`, `handle.frames.get(name)?.reload()`, `app.frames.get(name)?.reload()`, or declaratively with `data-rmx-target="<name>"` (+ `data-rmx-src`) on a link or form. A named-frame reload diffs only that region.
- Link/form attributes: `data-rmx-target`, `data-rmx-src`, `data-rmx-history="push|replace"`, `data-rmx-reset-scroll="manual"`, `data-rmx-reset-focus="manual"`, `data-rmx-document` (opt out of interception), `data-rmx-prefetch="intent|viewport"`.
- `rmx:navigation` DOM event fires on the submitting form/button for accepted navigations and carries `formData` and a `finished` promise (`09-forms-and-mutations.md`).

### 5.2 Custom-element lifecycle under the morph [RUN]

Probe element `rp-probe` with `observedAttributes = ['data-n']` (`spikes/remix/src/entry.ts`):

| Event | Callbacks observed |
|---|---|
| Top-frame reload, element matched | `attributeChangedCallback` only (`data-n 2->3`). No disconnect, no connect. Same instance. |
| Navigate to a page without the element | `disconnectedCallback` |
| Navigate back | `attributeChangedCallback` then `connectedCallback` on a new node (upgrade on insertion works for nodes parsed in the inert document) |
| Unkeyed `ui-dialog` at the same sibling position on two pages | **same node reused** (`mainDialogSameNode: true`), `id` rewritten under the instance |
| Keyed with different keys | new node (`mainDialogSameNode: false`) |
| Same key on both pages (layout-level dialog) | same node and instance, state kept |

Rules for `rp-*` elements that follow:

- An `rp-*` element MUST NOT cache values read from its attributes or descendants at connect time. Read at event time, or declare `observedAttributes`. Example: a quick-add `rp-cart-form` in a product grid is positionally reused for a different product after pagination; the hidden `merchandiseId` input value is rewritten under it.
- An `rp-*` element MUST tolerate its children being replaced, reordered or having attributes rewritten at any time, and MUST clean up in `disconnectedCallback`.
- Static components need nothing: [RUN] a matched `Stack` had `data-gap` rewritten from `2 md:6` to `4` in place.

### 5.3 Reload with live element state [RUN] (`out/result.txt`, T1)

Setup: page with `Dialog#dlg` and `Tabs#tabs`; select tab two, open the dialog, call `app.frames.top.reload()`.

| Strategy | Dialog after reload | Tabs after reload | Server text inside | Scroll lock / `inert` |
|---|---|---|---|---|
| none | **broken**: content `hidden=""`, trigger `data-closed`, but `el.open === true` and `:popover-open` | **desynced**: attributes "one", `el.value === "two"` | updated | both removed |
| `data-rmx-preserve-attrs` per part | open, consistent | "two", consistent | **updated** | `<html style>` removed, `inert` on outside siblings removed |
| same + `data-rmx-preserve-attrs="style"` on `<html>` | open, consistent | consistent | updated | scroll lock kept; `inert` still removed |
| `data-rmx-preserve-dom` on roots | open, consistent | consistent | **not updated** | `<html style>` removed; `inert` kept only inside preserved roots |

In all strategies Escape closed the dialog afterwards and tabs kept working.

Remaining gap with `preserve-attrs`: UI SDK puts `inert` on arbitrary sibling subtrees outside a modal and a `style` on `<html>`; a **top-frame** reload while a modal is open removes them. Two measures close it:

1. `<html data-rmx-preserve-attrs="style">` in the document shell. [RUN]
2. Close modal overlays when a top-frame navigation starts. [RUN] (T4): a layout-level dialog present on both pages **stays open across navigation** with `preserve-attrs` (it is the same instance); a `navigate` listener that sets `el.open = false` on open `ui-dialog`/`ui-drawer` elements closed it and left `<html>` and `inert` clean. This is also the behaviour a shopper expects from a nav drawer and matches document navigation.

A named-frame reload inside an open drawer (cart lines) touches only that frame's region, so it does not hit this gap. Not run; follows from `diffNodes` being scoped to the frame region.

### 5.4 Which strategy for which component

| Policy | Use for | Printed by the Remix binding |
|---|---|---|
| `key` + `preserve-attrs` (default) | every `ui-*` component whose parts keep their DOM position: Dialog, Drawer, Popover, Tooltip, Menu, Tabs, Accordion, Collapsible, Select, Checkbox/Radio/Switch, NumberInput, Slider | `data-rmx-key` on the root; `data-rmx-preserve-attrs="<owned names>"` on each bound element |
| `key` + `preserve-dom` | element-owned subtrees per item 12 of the React report: Toast region, anything the element restructures (NavigationMenu viewport, Carousel if it clones/moves slides) | `data-rmx-key` + `data-rmx-preserve-dom` on the root |
| `key` only | `rp-*` commerce elements (they reflect store state into attributes they own; list those in `preserve-attrs` only if the server never prints them) | `data-rmx-key` when the element holds per-instance state |
| nothing | static components and native-element contracts | - |

The list of element-owned attribute names per part is the same information React rule R-3 needs ("attributes the element owns"). It MUST live in the manifest once and feed every host. It can be generated: drive each fixture through its states in Chromium and collect every attribute name that changes on each bound element (extend `spike/idem.mjs` from the React report). The names used in this spike for Dialog and Tabs (`spikes/remix/src/dialog.tsx`, `tabs.tsx`) were taken from observed open/closed states and are sufficient for those two components [RUN]; they are not a complete generated list.

---

## 6. Assets: how JS and CSS are served

Source: `11-files-and-assets.md`, `remix/template/app/assets.ts`, `remix/packages/assets`.

- `staticFiles('./public', { index: false })` from `remix/middleware/static` serves files unchanged from `public/`.
- `createAssetServer({ basePath, rootDir, allowFiles, allowPackages, denyFiles, files, scripts, minify, fingerprint, watch, ... })` from `remix/assets` compiles browser modules **one file at a time, on request, with no bundling**. Bare imports resolve through an import map. `assets.getScriptEntry(path)` returns `{ href, importMap, preloads }`; `assets.getHref(path)` returns a URL; `assets.fetch(request)` returns a `Response` or `null`.
- `allowFiles`/`allowPackages` are a security boundary. The convention is that browser-reachable source lives in `public/` directories under `app/` (`allowFiles: ['app/routes.ts', 'app/**/public/**']`). A browser module that imports a non-allowed file fails to compile.
- Packages: each package imported by browser code must be in `allowPackages`; dependencies are allowed automatically, **peer dependencies are not**. [RUN] `@ui-sdk/web` failed with `IMPORT_NOT_ALLOWED` until `@ui-sdk/core` (a peer dependency) was added.
- Browser modules can import only scripts. `import './x.css'` fails with `IMPORT_NOT_SUPPORTED`. Stylesheets are linked by URL: `<link rel="stylesheet" href={await assets.getHref('app/.../app.css')} />`. Relative `@import` and `url()` inside CSS are rewritten.
- [RUN] (`assets-probe.mjs`): an entry importing `run`, `@ui-sdk/web/dialog` and `createCartStore` from `@shopify/hydrogen` produced **149 module preloads: 116 `@ui-sdk`, 9 `@shopify/hydrogen`, 23 `@remix-run`**. It compiled and the import map scopes were generated correctly, so the route works, but the request count is large.

Recommendation:

- CSS: scaffold `ripple.css` (precompiled) and `tokens.css` into `public/ripple/` or an `app/**/public/` directory and link them in the document head. No Tailwind build is needed for Ripple itself. Apps that also use Tailwind utilities need their own Tailwind build; Remix has none built in (nothing under `remix/packages/assets` runs Tailwind; UNVERIFIED whether a loader could).
- JS: serve the prebuilt, bundled `ripple.js` from `public/ripple/` with `staticFiles()` and load it with a dynamic `import()` from the browser entry (section 8.2). The asset-server route (`allowPackages: ['remix', '<ripple package>', '@ui-sdk/web', '@ui-sdk/core', '@shopify/hydrogen']`) MAY be documented as an alternative for apps that want one module graph.
- Single Hydrogen instance: if the prebuilt bundle contains Hydrogen's cart store and an app client entry also imports `@shopify/hydrogen` through the asset server, there are two stores. The spec MUST define one way for app code to reach Ripple's store. Candidate: an authored import map entry mapping the Ripple specifier to `/ripple/ripple.js` plus `scripts.external: ['<ripple specifier>']` in the asset server config, so app modules and the bundle share one module instance. `scripts.external` and authored import-map merging exist in source (`11-files-and-assets.md`; `collectAuthoredImportMap` in `server/stream.ts`); the combination is **UNVERIFIED by run**.

Cascade layers: `css()` rules live in `@layer rmx`; unlayered CSS beats every layer (`04-rendering-ui.md`). UI SDK injects its defaults in `@layer ui-sdk` (`uisdk-web-elements.md` section 6). The Remix document MUST declare the full order once, before any other CSS. Proposed: `@layer theme, base, ui-sdk, ripple, components, rmx, utilities;` so app `css()` overrides Ripple component CSS and Tailwind utilities override both. Ripple CSS MUST be layered; an unlayered Ripple rule could not be overridden by `css()`.

---

## 7. Forms and actions

Sources: `09-forms-and-mutations.md`, `remix/packages/fetch-router/README.md`, `form-data-middleware`.

- Routes: `import { route, get, form } from 'remix/routes'`. `form('/path')` pairs a GET `index` action and a POST `action` at one URL. Hrefs: `routes.x.href(params)`.
- Router: `createRouter({ middleware: [...] })`, `createController(routes, { actions })`, `router.map(routes, controller)` from `remix/router`.
- Middleware type: `(context, next) => Response | Promise<Response>`; it must return a `Response` or the result of `next()`. `context.request` is the original `Request`; `context.url`, `context.params`, `context.method`, `context.headers`, `context.set/get`.
- `formData()` from `remix/middleware/form-data` parses the body into `context.formData`. It **consumes the request body**.
- Mutations follow POST → `redirect(href, 303)` (`remix/response/redirect`). Validation failures re-render with status 400.
- With `run()` active, **every eligible same-origin form is submitted by Remix as a frame navigation** with no client entry: method, body, encoding and submitter overrides are preserved, redirects are followed, the response is reconciled into the page. Native constraint validation and the form's `submit` event run first.

Findings [RUN] (`out/result.txt`, T3):

| Case | Result |
|---|---|
| `rp-cart-form` defined and calls `event.preventDefault()` on `submit` | no navigation, no request by Remix; the element owns the mutation |
| JavaScript disabled | native POST → 303 → page reloads with the new cart count. Dialog content stays hidden. |
| `rp-cart-form` not defined, `run()` active, plain form | Remix intercepts: `POST /api/cart` with `X-Remix-Frame: true` and `Referer: <origin>/api/cart`; a referer-based redirect then goes to `GET /api/cart` and the navigation fails |
| same, form has `data-rmx-document` | native document POST with the page as referer → 303 → page. Works. |

So for any form or link whose target is a Hydrogen request handler:

- Cart forms (`/api/cart`) MUST print `data-rmx-document`.
- Links and forms to `/account/login`, `/account/authorize`, `/account/refresh`, `/account/logout` and to `/checkout` MUST print `data-rmx-document`. The Hydrogen skill requires plain `<a>`/`<form>` for these because the handlers answer with redirects to external Shopify URLs (`hydrogen/packages/hydrogen/skills/hydrogen-request-handlers/SKILL.md`); Remix would otherwise fetch them with `mode: 'same-origin'`.
- Search, filter, sort and newsletter forms that target app routes SHOULD stay interceptable (they benefit from frame navigation) and MAY use `data-rmx-target`.

`data-rmx-document` is inert outside Remix. It MAY be part of the universal HTML contract for these components so all hosts print identical markup.

---

## 8. Wiring Hydrogen core into a Remix 3 app

### 8.1 Server: one router middleware

Assembled from the "single-hook shape" in `hydrogen/packages/hydrogen/skills/hydrogen-request-handlers/references/frameworks.md` and the fetch-router middleware contract. **Not run.** Every Hydrogen call below appears in that skill; the Remix calls appear in `fetch-router/README.md`.

```ts
// app/middleware/shopify.ts
import { createContextKey, type Middleware } from 'remix/router'
import {
  createCartServerHandlers,
  createPredictiveSearchServerHandlers,
  createShopifyRequestContext,
  createStorefrontClient,
  handleShopifyRedirects,
  handleShopifyRoutes,
} from '@shopify/hydrogen'

import { i18n } from '../lib/i18n.ts'                    // defineShopifyI18n(...)
import { routeTemplates } from '../lib/route-templates.ts' // defineShopifyRouteTemplates(...)

export type StorefrontClient = ReturnType<typeof createStorefrontClient>
export const Storefront = createContextKey<StorefrontClient>()

export const cartHandlers = createCartServerHandlers()
const predictiveSearchHandlers = createPredictiveSearchServerHandlers()

export function shopify(): Middleware<{ key: typeof Storefront; value: StorefrontClient; property: 'storefront' }> {
  return async (context, next) => {
    let request = context.request
    let requestContext = createShopifyRequestContext({ request, i18n })
    let storefrontClient = createStorefrontClient({
      type: 'public',
      requestContext,
      config: {
        storeDomain: process.env.PUBLIC_STORE_DOMAIN!,
        publicStorefrontToken: process.env.PUBLIC_STOREFRONT_API_TOKEN, // undefined = tokenless (mock.shop)
      },
    })

    // 1. Hydrogen-owned routes, BEFORE routing and BEFORE formData() reads the body.
    let shopifyRoute = handleShopifyRoutes({
      request,
      requestContext,
      storefrontClient,
      routeTemplates,
      handlers: [cartHandlers, predictiveSearchHandlers],
    })
    if (shopifyRoute) return shopifyRoute

    // 2. App routes.
    context.set(Storefront, storefrontClient, { property: 'storefront' })
    let response = await next()

    // 3. Redirects only after a 404.
    if (response.status === 404) {
      let redirect = await handleShopifyRedirects({ request, routeTemplates, storefrontClient })
      if (redirect) return redirect
    }

    // 4. Cookies / cache safety on app responses.
    storefrontClient.requestContext.applyResponseHeaders(response.headers, response.status)
    return response
  }
}
```

```ts
// app/router.ts
export const router = createRouter({
  middleware: [
    staticFiles('./public', { index: false }),
    shopify(),            // before formData(): Hydrogen handlers read the request body themselves
    formData(),
    render({ assets }),
  ],
})
```

Points the spec must state:

- `shopify()` MUST precede `formData()` and `methodOverride()`.
- The asset route (`/assets/*path`) and static files SHOULD be matched before `shopify()` or be excluded inside it, so asset requests do not create Storefront clients. `staticFiles()` first covers `public/`; the asset route is an app route, so either mount a path check at the top of `shopify()` or accept the cost.
- `render()` resolves `<Frame>` sources by sending internal GET requests back through the same router (`06-streaming-ui-with-frames.md`), so `shopify()` also runs for every server-side frame. Whether the internal request carries cookies: the doc says the middleware "forwards same-origin request headers needed by frame routes". Cart cookie forwarding to a cart frame is **UNVERIFIED**.
- Server cart read for the `/cart` page and cart frames uses `cartHandlers.get(...)` (`hydrogen-cart-ui/SKILL.md`). Its exact call shape was not checked here: **UNVERIFIED**.
- Checking `response.status === 404` after `next()` works only if the app's not-found path returns a 404 `Response` through the middleware chain; fetch-router's default handler returns `new Response('Not Found: ...', { status: 404 })` (`remix/packages/fetch-router/src/lib/router.ts:252`). A URL that matches a route with another method returns 405, not 404 (README "Method Not Allowed Responses"). Not run.

### 8.2 Browser: document shell and entry

```tsx
// app/actions/document.tsx
import type { Handle, RemixNode } from 'remix/component'
import { ImportMap } from 'remix/component/server'
import type { ScriptEntry } from 'remix/assets'

export function Document(handle: Handle<{ title: string; scriptEntry: ScriptEntry; children?: RemixNode }>) {
  return () => {
    let { href, importMap, preloads } = handle.props.scriptEntry
    return (
      <html lang="en" data-rmx-preserve-attrs="style">{/* UI SDK scroll lock writes html[style] */}
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{handle.props.title}</title>
          <link rel="stylesheet" href="/ripple/tokens.css" />
          <link rel="stylesheet" href="/ripple/ripple.css" />
          {/* Hydrogen's cart store needs Standard Actions (hydrogen-cart-ui/SKILL.md, Prerequisites) */}
          <script type="module" src="https://cdn.shopify.com/storefront/standard-actions.js"></script>
          <ImportMap value={importMap} />
          {preloads.map((p) => <link key={p} rel="modulepreload" href={p} />)}
          <script type="module" src={href}></script>
        </head>
        <body>{handle.props.children}</body>
      </html>
    )
  }
}
```

```ts
// app/actions/public/entry.ts
import { run } from 'remix/component'

let app = run({
  async loadModule(moduleUrl, exportName) {
    let mod = await import(moduleUrl)
    return mod[exportName]
  },
})

// Hydrate first, then define elements: hydration rewrites element-owned attributes (section 4, finding 3).
await app.ready().catch(() => {})
await import('/ripple/ripple.js') // defines ui-* and rp-* elements, creates the cart store

// Close modal overlays when a top-frame navigation starts (section 5.3).
window.navigation?.addEventListener('navigate', (event) => {
  if (!event.canIntercept || event.hashChange || event.downloadRequest != null) return
  let source = (event as NavigateEvent & { sourceElement?: Element | null }).sourceElement
  if (source?.closest('[data-rmx-target]')) return // named-frame navigation: keep overlays (filters drawer)
  for (let el of document.querySelectorAll<HTMLElement & { open: boolean }>('ui-dialog, ui-drawer')) {
    if (el.open) el.open = false
  }
})
```

The `navigate` listener was run in its simplest form (no filters) [RUN]. The three filter conditions are a proposal and need a test: **UNVERIFIED**. This listener SHOULD ship inside `ripple.js` (it is harmless in other hosts) rather than be scaffolded into every app.

If a page has no client entries, `app.ready()` resolves immediately, so elements are not delayed. A script failure in `entry.ts` or `ripple.js` leaves server HTML with native forms and links: equal to no script.

### 8.3 Structural updates (risk R4 in Remix)

"Commerce elements reflect state; the host re-renders structure" maps to Remix as: **the structure is a named `<Frame>` and the host reloads it.** This is the direct counterpart of the base theme's `{% partial 'cart-items' %}` + `partials.fetch()`/`partials.apply()` (`theme/AGENTS.md` "Partial rendering").

```tsx
// in the layout
<Frame name="cart-lines" src={routes.cart.lines.href()} />   // blocking: lines are in the first HTML
```

```ts
// in ripple.js or a 5-line adapter in entry.ts: one seam between Ripple and the host
document.addEventListener('rp:cart:settled', () => app.frames.get('cart-lines')?.reload())
```

`rp:cart:settled` is a **proposed Ripple event name, not an existing API**. The `cart-lines` route renders `CartLines` from the server cart. Because the frame is inside the drawer, its reload does not disturb the open drawer (section 5.3). The optimistic gap (a new line appears only after the frame returns) is the same as in Liquid; Hydrogen's optimistic projection is available to `rp-*` elements for counts, pending and totals in the meantime. Not run.

The alternative, a `clientEntry` that subscribes to the cart store and renders lines in the browser, duplicates the server markup path and needs the app to share Ripple's Hydrogen instance (section 6). It SHOULD NOT be the default.

---

## 9. Binding patterns (real code, typechecked and server-rendered)

All code below is in `spikes/remix/src/`, passes `tsc --noEmit` under the Remix JSX runtime, and was rendered with `renderToString` [RUN]. Spike-only props (`preserve`, `keyed`, `documentNav`) are removed here.

### 9.0 Shared helpers (host-independent, same file as the React binding)

```ts
// props.ts
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type Responsive<T extends string | number> =
  | T
  | string // "2 md:6"
  | ({ base?: T } & { [K in Breakpoint]?: T })

/** 2 -> "2"; "2 md:6" -> "2 md:6"; { base: 2, md: 6 } -> "2 md:6"; undefined -> undefined */
export function rv(value: Responsive<string | number> | undefined): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'object') return String(value)
  let out: string[] = []
  if (value.base !== undefined) out.push(String(value.base))
  for (let bp of ['sm', 'md', 'lg', 'xl', '2xl'] as const) {
    if (value[bp] !== undefined) out.push(`${bp}:${value[bp]}`)
  }
  return out.length ? out.join(' ') : undefined
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
```

Note: the `string` arm of `Responsive` defeats literal checking of the string form. The spec should decide whether the string form is public API in TSX hosts or only the object form (the string form is what Liquid and HTML authors write).

### 9.1 Static: Button

```tsx
import type { Handle, RemixNode } from 'remix/component'
import { cx } from './props.ts'

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  tone?: 'neutral' | 'critical'
  /** Renders an <a> when set. */
  href?: string
  type?: 'button' | 'submit' | 'reset'
  name?: string
  value?: string
  disabled?: boolean
  class?: string
  children?: RemixNode
}

export function Button(handle: Handle<ButtonProps>) {
  return () => {
    let { variant = 'primary', size = 'md', tone, href, type = 'button', name, value, disabled, children } = handle.props
    let cls = cx('rp-button', handle.props.class)
    if (href !== undefined) {
      return (
        <a class={cls} data-variant={variant} data-size={size} data-tone={tone} href={href}>
          {children}
        </a>
      )
    }
    return (
      <button class={cls} data-variant={variant} data-size={size} data-tone={tone} type={type} name={name} value={value} disabled={disabled}>
        {children}
      </button>
    )
  }
}
```

Output [RUN]: `<button data-variant="secondary" data-size="lg" type="button" class="rp-button">Shop now</button>`

### 9.2 Static with responsive props: Stack

```tsx
import type { Handle, RemixNode } from 'remix/component'
import { cx, rv, type Responsive } from './props.ts'

type Space = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16

export interface StackProps {
  as?: 'div' | 'section' | 'ul' | 'ol' | 'nav' | 'main' | 'header' | 'footer'
  gap?: Responsive<Space>
  p?: Responsive<Space>
  px?: Responsive<Space>
  py?: Responsive<Space>
  align?: Responsive<'start' | 'center' | 'end' | 'stretch'>
  justify?: Responsive<'start' | 'center' | 'end' | 'between'>
  class?: string
  children?: RemixNode
}

export function Stack(handle: Handle<StackProps>) {
  return () => {
    let { as: Tag = 'div', gap, p, px, py, align, justify, children } = handle.props
    return (
      <Tag
        class={cx('rp-stack', handle.props.class)}
        data-gap={rv(gap)}
        data-p={rv(p)}
        data-px={rv(px)}
        data-py={rv(py)}
        data-align={rv(align)}
        data-justify={rv(justify)}
      >
        {children}
      </Tag>
    )
  }
}
```

`<Stack gap={{ base: 2, md: 6 }} p="4 lg:8" align="center" as="section">` → [RUN] `<section data-gap="2 md:6" data-p="4 lg:8" data-align="center" class="rp-stack">...</section>`. A string-union variable as the JSX tag typechecks.

### 9.3 Interactive: Dialog on `ui-dialog`

```tsx
import type { Handle, RemixNode } from 'remix/component'
import { cx } from './props.ts'

// Element-owned attribute names (from the manifest). Remix must not overwrite them on frame reloads.
const TRIGGER_OWNED = 'aria-controls aria-expanded data-open data-closed'
const BACKDROP_OWNED = 'hidden role data-open data-closed popover style'
const CONTENT_OWNED =
  'hidden role id tabindex aria-modal aria-labelledby aria-describedby data-open data-closed data-presentation popover style'

export interface DialogProps {
  /** Required. Root id; part ids derive from it: <id>-trigger, <id>-title, <id>-description, <id>-content. */
  id: string
  trigger: RemixNode
  title: RemixNode
  description?: RemixNode
  closeLabel?: string
  size?: 'sm' | 'md' | 'lg'
  class?: string
  children?: RemixNode
}

export function Dialog(handle: Handle<DialogProps>) {
  return () => {
    let { id, trigger, title, description, closeLabel = 'Close', size = 'md', children } = handle.props
    return (
      <ui-dialog id={id} class={cx('rp-dialog-root', handle.props.class)} data-rmx-key={id}>
        <ui-dialog-trigger>
          <button type="button" class="rp-button" data-variant="secondary" data-size="md" id={`${id}-trigger`} aria-haspopup="dialog" data-closed="" data-slot="dialog-trigger" data-rmx-preserve-attrs={TRIGGER_OWNED}>
            {trigger}
          </button>
        </ui-dialog-trigger>
        <ui-dialog-backdrop class="rp-dialog-backdrop" hidden data-slot="dialog-backdrop" data-rmx-preserve-attrs={BACKDROP_OWNED}></ui-dialog-backdrop>
        <ui-dialog-content class="rp-dialog" data-size={size} hidden data-slot="dialog-content" data-rmx-preserve-attrs={CONTENT_OWNED}>
          <ui-dialog-title class="rp-dialog-title" id={`${id}-title`} role="heading" aria-level={2} data-slot="dialog-title">
            {title}
          </ui-dialog-title>
          {description != null && (
            <ui-dialog-description class="rp-dialog-description" id={`${id}-description`} role="paragraph" data-slot="dialog-description">
              {description}
            </ui-dialog-description>
          )}
          {children}
          <ui-dialog-close>
            <button type="button" class="rp-button" data-variant="ghost" data-size="md" data-slot="dialog-close">
              {closeLabel}
            </button>
          </ui-dialog-close>
        </ui-dialog-content>
      </ui-dialog>
    )
  }
}
```

Verified [RUN]: zero attribute changes inside the dialog at upgrade; opens, closes, survives top-frame reload while open with updated description text; works when hydrated inside a client entry and when created on the client.

Compared with the React wrapper (`react-and-custom-elements.md` 7.3): no `"use client"`, no `useId`, no `useState`, no `useElement`, no `suppressHydrationWarning`. Added: `data-rmx-key`, `data-rmx-preserve-attrs`.

Note on the no-JS fallback: this contract is dead without JS (`uisdk-web-elements.md` 3.2). Whichever link-based fallback the spec picks (section 4.3 there) applies unchanged in Remix.

### 9.4 Reacting to element events and controlling state (app code, not the binding)

Server-rendered components cannot receive function props. App code that needs `onOpenChange` wraps the binding in its own client entry and listens on an ancestor in the capture phase (UI SDK events do not bubble). Typechecked (`spikes/remix/src/typecheck-probe.tsx`); not run in a browser.

```tsx
import { clientEntry, on, type Handle } from 'remix/component'
import { Dialog } from '../../ui/ripple/dialog.tsx'

export const SizeGuide = clientEntry(import.meta.url, function SizeGuide(handle: Handle<{ label: string }>) {
  let opened = 0
  return () => (
    <div mix={on('openchange', (event) => { if (event.detail.value) { opened++; handle.update() } }, true)}>
      <Dialog id="size-guide" trigger={handle.props.label} title="Size guide" description={`Opened ${opened} times`} />
    </div>
  )
})
```

Programmatic control uses the element: `(document.getElementById('size-guide') as HTMLElement & { open: boolean }).open = true` after `customElements.whenDefined('ui-dialog')`.

V1 recommendation: Remix bindings are **uncontrolled only** (`defaultValue` / `defaultOpen` at most). Controlled `value`/`open` props would require printing a different contract per state on the server and a property hand-off after upgrade; React needs that for idiom reasons, Remix does not.

### 9.5 Commerce: AddToCart

Field names are Hydrogen's cart form contract (`hydrogen/packages/hydrogen/src/core/cart/form.ts`: `merchandiseId`, `quantity`, `sellingPlanId`, submit button `name="intent" value="add"`). The same form posts natively to `createCartServerHandlers()` at `/api/cart`, which answers a form POST with `303` to the referer and sets the cart cookie (`cart/server-handlers.ts`). `rp-cart-form` is Ripple's commerce element; with JS it calls `event.preventDefault()` and `cartStore.handleFormSubmit(event)` (`cart/cart.ts`, `CartStore.handleFormSubmit(event: SubmitEvent)`).

```tsx
import type { Handle, RemixNode } from 'remix/component'
import { cx } from './props.ts'

export interface AddToCartProps {
  /** Storefront API ProductVariant GID. */
  variantId: string
  quantity?: number
  available?: boolean
  /** Route served by Hydrogen's createCartServerHandlers(). */
  action?: string
  sellingPlanId?: string
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  class?: string
  /** Button label. */
  children?: RemixNode
  soldOutLabel?: string
}

export function AddToCart(handle: Handle<AddToCartProps>) {
  return () => {
    let { variantId, quantity = 1, available = true, action = '/api/cart', sellingPlanId, variant = 'primary', size = 'md', children = 'Add to cart', soldOutLabel = 'Sold out' } = handle.props
    return (
      <rp-cart-form class={cx('rp-add-to-cart', handle.props.class)}>
        {/* data-rmx-document: Remix must not intercept this POST (section 7). */}
        <form method="post" action={action} data-rmx-document>
          <input type="hidden" name="merchandiseId" value={variantId} />
          <input type="hidden" name="quantity" value={String(quantity)} />
          {sellingPlanId !== undefined && <input type="hidden" name="sellingPlanId" value={sellingPlanId} />}
          <button class="rp-button" data-variant={variant} data-size={size} type="submit" name="intent" value="add" disabled={!available}>
            {available ? children : soldOutLabel}
          </button>
          <span class="rp-form-message" role="status" data-rp-cart-status=""></span>
        </form>
      </rp-cart-form>
    )
  }
}
```

Output [RUN]:

```html
<rp-cart-form class="rp-add-to-cart"><form method="post" action="/api/cart" data-rmx-document><input type="hidden" name="merchandiseId" value="gid://shopify/ProductVariant/43695710371862" /><input type="hidden" name="quantity" value="1" /><button data-variant="primary" data-size="md" type="submit" name="intent" value="add" class="rp-button">Add to cart</button><span role="status" data-rp-cart-status="" class="rp-form-message"></span></form></rp-cart-form>
```

`data-rmx-document` is listed in Remix's boolean attribute set, so `true` prints it bare (`REMIX_BOOLEAN_ATTRIBUTES` in `props.ts`). The three tiers were run with a stand-in element and a stand-in `/api/cart` (section 7 table). The real Hydrogen store and handler were not run here; see `docs/research/spikes/hydrogen-core/` for that side.

The base theme requires `input[name="id"]` as the variant source of truth for Liquid's native `/cart/add` (`theme/AGENTS.md` "Commerce contracts"). Hydrogen's field is `merchandiseId` (a GID). That is risk R3 and belongs to the Liquid investigation; in Remix there is no conflict because the form posts to Hydrogen's own handler.

---

## 10. TypeScript typing for custom elements

- The runtime declares a **global** `JSX` namespace (`declare global { namespace JSX { ... } }` in `runtime/core/vnode.ts`). Tags are added by augmenting `JSX.IntrinsicElements` globally. Remix's own docs site does this for Pagefind (`remix/docs/shared/search/pagefind.d.ts`).
- TypeScript never checks hyphenated JSX attribute names. `data-*`, `aria-*`, `default-open`, `data-rmx-key` typecheck on any element. Unknown plain names (`nope="1"`) and unknown tags are errors [RUN].
- `remix/component` exports `Props<'tag'>` and `HostProps<T>` but not `HTMLProps`. The practical base type for a custom element is `JSX.IntrinsicElements['span']`.
- `aria-level` is typed `number`: write `aria-level={2}`.
- `commandfor` / `command` are typed on buttons (`runtime/dom.ts:2011`), so invoker commands from the base theme's conventions work in Remix JSX.
- `on('openchange', handler)` is typed once the event is added to `HTMLElementEventMap` (the pattern in `05-interactivity.md` "custom event mixin") [RUN typecheck].

Ripple MUST ship this file (generated from the manifest), and scaffolding MUST add it to the project's `tsconfig` `include`:

```ts
// ripple-elements.d.ts  (Remix 3 JSX runtime)
import type {} from 'remix/component'

type El = JSX.IntrinsicElements['span'] // class, id, hidden, role, aria-*, mix, children, ...

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ui-dialog': El & { open?: boolean; modal?: 'false'; dismissible?: 'false' }
      'ui-dialog-trigger': El & { for?: string }
      'ui-dialog-backdrop': El & { for?: string }
      'ui-dialog-content': El & { for?: string }
      'ui-dialog-title': El & { for?: string }
      'ui-dialog-description': El & { for?: string }
      'ui-dialog-close': El & { for?: string; value?: string }
      'ui-tabs': El
      'ui-tabs-list': El
      'ui-tabs-tab': El & { value: string }
      'ui-tabs-panel': El & { value: string }
      'rp-cart-form': El
      // ... one entry per ui-* and rp-* tag in the manifest
    }
  }
  interface HTMLElementEventMap {
    openchange: CustomEvent<{ value: boolean; reason: string }>
    valuechange: CustomEvent<{ value: string; reason: string }>
    // ... one entry per element event in the manifest
  }
}
```

The React declaration file targets `react/jsx-runtime`'s `JSX` namespace instead; the tag list and attribute types are identical, so both files come from one manifest table. If a project has both React and Remix JSX in one TypeScript program the global `JSX` namespace and React's module-scoped one do not collide (React 19 types use `React.JSX`); UNVERIFIED by run.

---

## 11. `@remix-run/ui` overlap, and why Ripple still uses UI SDK elements

`@remix-run/ui@0.14.0` (`remix/packages/ui/README.md`) provides headless primitives: accordion, anchor, combobox, form, listbox, menu, popover, select, tabs, toast, toggle, plus animation utilities.

Ripple MUST NOT build on it:

1. Its primitives are Remix mixins and components (`popover.surface({ open, onHide })`, `popover.Context`). They work only inside a `clientEntry` under `run()`. They cannot be rendered by Liquid, React or plain HTML, which breaks the one-HTML-contract rule (decision 1) and the fixture model.
2. It is declared unstable and versioned independently: "`@remix-run/ui` is currently unstable ... It is not available through the `remix` package" (`04-rendering-ui.md`).
3. It is not an allowed runtime dependency (decision 3).
4. It has no dialog, drawer, tooltip, carousel, slider, number input or navigation menu.
5. Styling is expected through `css()`, which generates classes and style tags.

They can coexist. An app MAY use `@remix-run/ui` for its own UI. The Remix skill tells agents to "prefer ... existing first-party Remix primitives over custom abstractions" (`remix/.agents/skills/remix/SKILL.md`); Ripple's Remix skill MUST state that for storefront UI the Ripple component wins and `@remix-run/ui` is only for UI Ripple does not cover.

---

## 12. React vs Remix binding source, and generating both

| Aspect | React binding | Remix binding |
|---|---|---|
| Function shape | `function Button(props: ButtonProps) { return <.../> }` | `function Button(handle: Handle<ButtonProps>) { return () => <.../> }`, props read inside the render closure |
| Children type | `ReactNode` | `RemixNode` |
| Class prop | `className` on native elements (`class` works on custom elements) | `class` (also accepts `className`) |
| Absent attribute | `undefined` (or `null` on custom elements per React report) | `undefined` or `null` |
| Presence attribute (`data-closed`) | `""` | `""` |
| `hidden` | `hidden=""` on custom elements, `hidden` on native | `hidden` everywhere |
| `tabindex` | `tabindex` on custom elements, `tabIndex` on native | either |
| Interactive wrapper | `"use client"`, `useId`, `useState` capture, `useElement`, `suppressHydrationWarning` | none of these; `data-rmx-key`, `data-rmx-preserve-attrs` / `data-rmx-preserve-dom` |
| Root id | optional (`useId` fallback) | **required** |
| Events | `onOpenChange` callback props | none on the binding; app listens with `on()` in a client entry |
| Controlled state | `value`/`open` with veto | not in V1 |
| Shared helpers (`rv`, `cx`, prop types) | same file | same file |

For static and commerce components the JSX body is identical after the `class`/`className` substitution. For `ui-*` components the JSX body is identical except for the host-specific attribute decorations, and both sets of decorations derive from manifest data (owned attributes, events, live properties).

Recommendation: keep one **contract template** per component in the manifest source (the HTML contract with prop holes and conditionals) and generate from it: the Remix binding, the React binding's JSX body, the Liquid block body, and the fixtures. Hand-written code is then limited to the React hook wiring (itself generatable from the manifest's event and property tables). Generated files are scaffolded into projects, so the generator MUST emit readable, idiomatic source like sections 9.1 to 9.5, not minified output. If a generator is out of scope for milestone 1, the Remix bindings SHOULD be derived mechanically from the React ones by the substitutions in the table above; they MUST NOT be designed independently.

---

## 13. Base theme conventions versus the Remix binding

| Theme convention (`theme/AGENTS.md`) | Effect on the Remix binding |
|---|---|
| Every block takes `class` and `attributes` (raw attribute passthrough) | Confirms a `class` prop on every binding. The JSX analogue of `attributes` is passing extra props through to the root element. The spec should decide whether bindings accept arbitrary root attributes (`Props<'button'>`-style rest spread) in TSX hosts; if yes, contract attributes MUST be applied after the spread so callers cannot override them. Not in the spike code. |
| Native first: `<details>`, `<dialog>`, popover, `commandfor`/`command` | Confirms and strengthens: native elements are preserved by Remix's diff with zero extra attributes (section 1, item 5) and `commandfor`/`command` are typed. Each `ui-*` element the spec replaces with a native element removes a `preserve-attrs` list. |
| `{% partial %}` regions fetched and applied by JS | Maps one-to-one to named `<Frame>`s (section 8.3). Same model: the server owns structure. |
| `document.startViewTransition()` around `partials.apply()` | Remix has a commit hook: `defaultResolveFrame(src, options, { commit })` with `FrameCommit = (commitFrame, context) => void | Promise<void>` (`runtime/frame.ts:3195`, `runtime/run.ts`). A view-transition wrapper is possible. UNVERIFIED by run. |
| One custom element per JS file, DOM work only in `connectedCallback`, `AbortController` cleanup | Required anyway by the morph lifecycle (section 5.2). Add: do not cache DOM-derived values at connect. |
| Routes passed to JS through `data-*` attributes, never hardcoded | Same in Remix: the binding takes `action` and prints it; `rp-*` elements read the form's `action`. `routes.x.href()` supplies values. |
| Template-owned composition; blocks never call blocks | Conflicts with nothing in Remix, but note the asymmetry: in Remix (and React) composed components such as `ProductCard` naturally render `Price` and `Button` internally. The spec must say whether composed Ripple components exist as components in TSX hosts while being template-composed in Liquid. Out of this report's scope. |
| Button `disabled` renders `aria-disabled` for the theme editor | Liquid-editor specific. Remix prints native `disabled`. The contract must define which is canonical or allow a documented host difference. |
| `variant: 'button-primary'`, `url:` | Naming differs from the proposal (`variant="primary"`, `href`). Ripple's enumerated values and prop names MUST be one set across hosts; pick one and apply it to Liquid too. |

---

## 14. What the spec must say

Binding shape

1. A Remix binding is a function `(handle: Handle<Props>) => () => RemixNode` that reads `handle.props` inside the render closure and prints the HTML contract. It MUST NOT use `clientEntry`, `on()`, `ref()`, `css()`, `handle.update()`, `handle.queueTask()` or any browser global.
2. Bindings MUST use `class` (not `className`), `""` for presence attributes, booleans for HTML boolean attributes, `undefined` for absent attributes, and `aria-level={2}`-style numbers where Remix types require them.
3. No Ripple attribute name on any element may match `/^on/i` (Remix drops it).
4. Raw HTML props (`RichText`, `ArticleBody`) MUST go through `innerHTML={unsafeHTML(html)}`; the prop type is the caller's trusted HTML string and the docs MUST say Ripple does not sanitize.
5. Interactive components (`ui-*`, and `rp-*` that hold state) MUST declare `id: string` as a required prop in the Remix binding. `handle.id` MUST NOT be used.
6. Remix bindings are uncontrolled in V1. No callback props.

Reconciliation attributes

7. Every `ui-*` root and every stateful `rp-*` root MUST print `data-rmx-key="<id>"`.
8. Every element on which a `ui-*` element writes attributes after upgrade MUST print `data-rmx-preserve-attrs` with that part's owned attribute names from the manifest. Components marked element-owned in the manifest MUST print `data-rmx-preserve-dom` on the root instead.
9. The manifest MUST record, per component part: owned attribute names, and the reconcile policy (`attrs` | `dom` | `none`). The owned-attribute list MUST be generated by driving fixtures through their states in a browser, not typed by hand, and regenerated on every UI SDK bump.
10. The spec MUST decide whether `data-rmx-*` attributes are part of the universal contract or Remix-only. Recommended: Remix-only, with the conformance normalizer stripping `data-rmx-*` before comparing against shared fixtures. The checker MUST flag raw `ui-*` roots without `data-rmx-key` in Remix projects.
11. The document shell MUST print `<html data-rmx-preserve-attrs="style">`.
12. `ripple.js` MUST close open modal overlays when a top-frame same-document navigation starts, and MUST NOT close them for named-frame navigations.

Forms and links

13. Forms that post to Hydrogen handlers (cart) MUST print `data-rmx-document`. Links and forms to Customer Account routes and `/checkout` MUST print `data-rmx-document`.
14. Search, filter, sort and pagination use plain GET forms and links with no opt-out; blueprints MAY add `data-rmx-target` to refresh a named frame.

Elements

15. `rp-*` elements MUST read DOM-derived values at event time or via `observedAttributes`, MUST tolerate child replacement and attribute rewrites at any time, and MUST clean up on disconnect. A matched element receives only `attributeChangedCallback` during a morph.
16. Element definitions MUST be loaded by the entry script of the first document. Markup arriving by navigation MUST NOT rely on its own script tags (they are inert).
17. In Remix the entry MUST define elements after `await app.ready()`.

App wiring (scaffolded by `init` for Remix, and encoded in the Remix blueprint)

18. `shopify()` middleware as in 8.1, placed before `formData()`; `staticFiles()` before it.
19. Document shell as in 8.2: layer order declaration, `tokens.css`, `ripple.css`, Standard Actions script, `<ImportMap>`, preloads, entry.
20. `ripple.js` and CSS are served from `public/ripple/` by `staticFiles()`. The asset-server alternative requires `allowPackages` to include `@ui-sdk/core` explicitly.
21. Scaffolded binding files MUST be browser-reachable under the app's asset rules (for example `app/ui/ripple/` plus an `allowFiles` entry, or a `public/` directory), because client entries import them.
22. Structural commerce updates use named blocking `<Frame>`s reloaded on a Ripple DOM event (8.3). The event names are part of the Ripple contract and shared with the Liquid partial-refresh adapter.
23. The cascade layer order MUST be declared once and include `ui-sdk`, Ripple's layer(s), `rmx` and `utilities`. All Ripple CSS MUST be layered.
24. Content needed without JavaScript MUST NOT be placed in a `<Frame>` with a `fallback`.

Types and tests

25. Ship a generated `ripple-elements.d.ts` for the Remix JSX runtime (section 10) and add it to `tsconfig` on `init`.
26. Remix conformance tests MUST compare parsed DOM, not bytes (`class` is printed last, booleans are bare).
27. Mandatory Remix browser tests per interactive component, prototypes in `spikes/remix/run.mjs`, `island.mjs`, `race.mjs`:
    - upgrade causes no attribute value change (same-value writes are tolerated: `ui-tabs-tab` re-writes `role="none"` twice at upgrade [RUN]);
    - put the component in a non-initial state, call `app.frames.top.reload()`, assert element state, attributes and `:popover-open` agree and server text inside updated;
    - navigate A→B→back with the component at the same sibling position as a different instance; assert ids and ARIA references are correct on each page;
    - render inside a `clientEntry`, re-render while non-initial, assert no element-owned attribute changed;
    - submit each commerce form in three modes: element defined, element not defined with `run()` active, JavaScript disabled.
28. Pin `remix` to the tested minor in the Remix example and state the browser split: frame navigation on Chrome/Edge 135+, document navigation elsewhere; both MUST pass the test suite.

Agent kit

29. The Remix skill MUST state: Ripple components need no `clientEntry`; do not wrap them in one unless app code needs element events; use Ripple, not `@remix-run/ui`, for storefront UI; never remove `data-rmx-*` attributes from scaffolded bindings.

---

## 15. Not verified here

- The Remix dev server, HMR and `remix/node-tsx` (Node 24.3+ required; Node 22 available).
- The real Hydrogen cart store, Standard Actions and `/api/cart` handler inside a Remix app (stand-ins used). The middleware in 8.1 is assembled from two documented contracts and was not executed.
- Cookie forwarding on server-side frame sub-requests; `cartHandlers.get()` call shape.
- Streaming frames with `fallback` in a browser.
- Firefox and Safari. All browser runs used Chromium, where frame navigation is active. The document-navigation path was exercised only through `data-rmx-document` and the JavaScript-disabled run.
- Components other than Dialog and Tabs under the morph. Drawer, Menu, Select, Accordion, Carousel, NavigationMenu, Toast need the tests in item 27 before their policy is fixed.
- The refined `navigate` filter (hash change, download, `data-rmx-target`) and whether closing via `el.open = false` always completes before the diff commits on a fast response.
- Sharing one Hydrogen instance between `ripple.js` and app client entries through an import map entry plus `scripts.external`.
- View transitions through the `commit` override.
- Tailwind utilities in a Remix app (R6): Remix has no Tailwind integration; an app that wants utilities runs the Tailwind CLI itself or uses a precompiled utility subset.
