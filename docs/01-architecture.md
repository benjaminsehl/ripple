# 01 - Architecture

Status: normative. Subordinate to `00-decisions.md` (the ledger). Date: 2026-11-21.

This document owns: render hosts and commerce backends as a system, the layers and the import rules between them, the page lifecycle (server render, upgrade, interaction, refresh), the repository layout, the published package and its export map, pinned versions, and the browser support floor.

It does NOT own (follow the link, do not restate):

| Topic | Owner |
|---|---|
| Contract rules, ids, state and hook attributes, canonicalisation, fixtures | `02-html-contract.md` |
| Cascade layers, tokens, `props.css`, component CSS rules, feature gating in CSS | `03-styling-and-tokens.md` |
| Runtime internals, `rp-*` authoring, lazy chunk loading mechanism, polyfill, events | `04-elements.md` |
| Adapter, cart store, dialects, refresh strategies, commerce elements | `05-commerce.md` |
| React, Remix, Liquid and `html` binding rules | `06-bindings.md` |
| Manifest schema, generator, registry contents, trailers, CLI, checker rules | `07-manifest-registry-cli.md` |
| Package docs, skills, agent bridge, evals | `08-agent-kit-and-evals.md` |
| Component specs | `09-components-foundation.md`, `10-components-interactive.md`, `11-components-commerce.md`, `12-components-chrome-and-blueprints.md` |
| Test tiers, harnesses, test runner, size budget check | `13-testing.md` |
| The Ripple Liquid theme | `14-liquid-theme.md` |

Glossary: `00-decisions.md` section 9. Every term used here (host, backend, binding, contract, kernel, region, registry, scaffold, upgrade) has the meaning given there. This document defines no new terms except the layer ids in section 2.

Conventions: `<pkg>` is the npm package name (placeholder `ripple-kit`, D-052). Paths starting with `src/`, `css/`, `components/` are relative to the Ripple repository root. Evidence paths are relative to the directory holding the local clones.

---

## 1. System overview

### 1.1 Hosts and backends

There are exactly four render hosts and exactly two commerce backends (D-001). The pairing is fixed:

| Render host | Prints HTML with | Commerce backend | Cart transport | Structural re-render (region refresh) |
|---|---|---|---|---|
| `html` | any server, by hand or template | `hydrogen` | `createCartServerHandlers()` mounted at `/api/cart` | fetch document, replace `[data-rp-region]` elements |
| `react` | React 19 server render + hydration | `hydrogen` | same | React re-render from store state; app-supplied `navigate(url)` |
| `remix` | Remix 3 server components | `hydrogen` | same | reload named blocking `<Frame>`s |
| `liquid` | Shopify Liquid (`{% block %}`, `{% partial %}`) | `liquid` | Hydrogen default handler through Shopify Standard Actions | `@shopify/partial-rendering` |

A host other than these four MUST NOT be added in V1. No code outside `src/commerce/adapter-hydrogen.ts`, `src/commerce/adapter-liquid.ts` and the four `src/commerce/refresh-<host>.ts` files may branch on the host or the backend (D-042).

### 1.2 Diagram

```text
                         AUTHORING TIME (repo)                                  PROJECT (after `ripple add`)
  components/<id>/<id>.json  --pnpm gen-->  fixtures, bindings (static),        scaffolded, editable:
  (manifest entry, source     types, props.css, theme.css, docs,                 bindings, CSS, blueprints,
   of truth, D-003)           registry index, checker tables                     locale entries, skills
                                     |
                                pnpm build  -->  pkg/  (the npm package)  --ripple CLI-->  project files
                                                   |
                                                   +-- library JS (never edited): dist/*, browser/*

  REQUEST TIME
  +-----------------------------------------------------------------------------------------------+
  | SERVER                                                                                        |
  |   html: template        react: TSX binding     remix: TSX binding     liquid: block/snippet   |
  |        \                     |                       |                      /                 |
  |         +----------- all four print the SAME HTML contract (D-002) --------+                  |
  +-----------------------------------------------------------------------------------------------+
                                           |  HTML + ripple.css (+ ripple.js as type="module")
                                           v
  +-----------------------------------------------------------------------------------------------+
  | BROWSER                                                                                       |
  |  L7 scaffolded CSS   layers: ui-sdk, theme, base, rp(tokens, base, components, props), ...     |
  |  --------------------------------------------------------------------------------------------- |
  |  L6 host libraries   <pkg>/react (useElement, hooks)   <pkg>/remix   <pkg>/agent (opt-in)       |
  |  L5 commerce         rp-cart rp-product-form rp-live rp-predictive-search rp-recommendations   |
  |                      getCommerce() -> adapter-hydrogen | adapter-liquid -> refresh-<host>      |
  |  L4 elements         rp-dialog rp-carousel rp-quantity rp-navigation-menu                      |
  |                      lazy chunks: ui-tabs, ui-tooltip, ui-toast                                |
  |  L3 runtime          lazy loader, Invoker Commands polyfill, opener listener, announcer        |
  |  L2 core helpers     rv, cx, imageUrl, imageSrcSet, types (no side effects)                    |
  |  --------------------------------------------------------------------------------------------- |
  |  L1 external         @ui-sdk/core + @ui-sdk/web (kernel)      @shopify/hydrogen (cart store)   |
  |  L0 platform         DOM, <dialog>, popover, <details>, forms, History API                     |
  |                      liquid only: Shopify.actions, @shopify/partial-rendering                  |
  +-----------------------------------------------------------------------------------------------+
                         |  form posts / fetch                      ^ region HTML
                         v                                          |
  +-----------------------------------------------------------------------------------------------+
  | COMMERCE BACKEND   hydrogen: /api/cart (createCartServerHandlers) -> Storefront API (mock.shop)|
  |                    liquid:   Standard Actions -> Shopify theme runtime; partial rendering      |
  +-----------------------------------------------------------------------------------------------+
```

### 1.3 The five invariants

Every other rule in this document follows from these. Each has a test owner.

| # | Invariant | Source | Tested by |
|---|---|---|---|
| I-1 | All four hosts print canonically equal HTML for the same fixture. | D-002, D-063 tier 2 | `13-testing.md` |
| I-2 | Loading `ripple.js` mutates nothing inside a component root except allow-listed entries. | D-002, D-063 tier 3 | `13-testing.md` |
| I-3 | A page has exactly one copy of `@ui-sdk/core`, exactly one copy of `@shopify/hydrogen`, and exactly one cart store. | D-022, D-041 | section 8, tests A-07 to A-09 |
| I-4 | If no script runs, or the runtime cannot start, every form and link still works natively. | D-005, D-041 item 7 | `13-testing.md` tier 6 |
| I-5 | Library JavaScript is never scaffolded; scaffolded files are never imported by library JavaScript. | D-053 | section 8, test A-04 |

---

## 2. Layers

A **layer** here is a set of source directories with one import rule. (CSS cascade layers are a different thing; see `03-styling-and-tokens.md`.)

| Layer id | Name | Source | Runs in | Shipped as | Edited by projects |
|---|---|---|---|---|---|
| L0 | Platform | none (browser, Shopify storefront) | browser | not shipped | no |
| L1 | External libraries | `@ui-sdk/core`, `@ui-sdk/web`, `@shopify/hydrogen` (npm) | browser; Hydrogen also on the server | dependency, peer dependency, or bundled into `browser/*.js` | no |
| L2 | Core helpers | `src/identity.ts`, `src/index.ts`, `src/responsive.ts`, `src/image.ts`, `src/types.ts` | browser and Node | `<pkg>` | no |
| L3 | Runtime | `src/runtime/` | browser | inside `<pkg>/elements`, `<pkg>/commerce`, `browser/*.js` | no |
| L4 | Elements | `src/elements/` | browser | `<pkg>/elements`, `<pkg>/elements/<tag>`, `browser/*.js` | no |
| L5 | Commerce | `src/commerce/` | browser | `<pkg>/commerce`, `<pkg>/commerce/<tag>`, `browser/ripple.js` | no |
| L6 | Host libraries | `src/react/`, `src/remix/`, `src/agent/` | browser and Node (`react`, `remix`); browser (`agent`) | `<pkg>/react`, `<pkg>/remix`, `<pkg>/agent`, `browser/ripple-agent.js` | no |
| L7 | Scaffolded code | `css/`, `components/`, `blueprints/`, `icons/`, `locales/`, `skills/` | server (bindings) and browser (CSS) | `registry/`, `css/`, `skills/` copied into the project by the CLI | yes |
| T | Tooling | `src/gen/`, `src/check/`, `src/cli/`, `src/testing/` | Node only | `<pkg>/check`, `<pkg>/testing`, `bin/ripple.mjs` | no |

Layers L2 to L6 and T are **library** code; L7 is **scaffolded** code (D-053).

### 2.1 What each layer is responsible for

- **L2 Core helpers.** Pure functions and types: `rv()`, `cx()`, `imageUrl()`, `imageSrcSet()`, prop types, the manifest loader. MUST have no side effects at import, MUST NOT touch `window`, `document` or `customElements` at module top level, and MUST NOT import any npm package.
- **L3 Runtime.** Code that runs once per page: the lazy chunk loader (`loader.ts`), the Invoker Commands polyfill (`commands-polyfill.ts`), the document-level opener listener (`opener.ts`, D-009), the announcer (`announcer.ts`). `src/runtime/element.ts` MUST NOT exist on the default path; it is created only if SPIKE-04 fails (see section 9).
- **L4 Elements.** One file per custom element: the four non-commerce `rp-*` elements and the three lazy chunk entries for UI SDK families. `src/elements/index.ts` starts the runtime, defines the four `rp-*` elements, registers the three lazy chunks, and exports `toast()` (D-013).
- **L5 Commerce.** The adapter (`getCommerce()`, `configureCommerce()`), the two backend adapters, the dialect table, the four refresh strategies, and the five commerce `rp-*` elements. `src/commerce/index.ts` defines the five commerce elements and exports `getCommerce` and `configureCommerce`.
- **L6 Host libraries.** `src/react/`: `useElement` and the `useSyncExternalStore` hooks (D-033). `src/remix/`: types and helpers for Remix bindings; it MUST NOT import `remix` or any `@remix-run/*` module (Remix is not a declared peer, D-052). `src/agent/`: re-export of the UI SDK agent bridge (`createAgent`, `agentTools`, `registerTools` from `@ui-sdk/web/agent`; evidence `uisdk/packages/web/src/agent.ts`).
- **L7 Scaffolded code.** Everything a project owns after install: component CSS, `tokens.css`, `theme.css`, `base.css`, `props.css`, bindings, blueprints, locale entries, skills.
- **T Tooling.** Generator, checker, CLI, test helpers. Node only.

### 2.2 Import rules

"May import" means a static `import`, a dynamic `import()`, or an `export ... from`. `import type` counts unless the cell says "types only". A cell lists everything allowed; anything not listed is forbidden.

| Importer | May import (Ripple source) | May import (npm / platform) |
|---|---|---|
| `src/identity.ts` | nothing | nothing |
| `src/index.ts`, `src/responsive.ts`, `src/image.ts`, `src/types.ts` | each other; `src/identity.ts` | nothing |
| `src/runtime/**` | `src/runtime/**`; `src/identity.ts` | `@ui-sdk/core` |
| `src/elements/rp-*.ts`, `src/elements/index.ts` | `src/elements/**`; `src/runtime/**`; L2 files | `@ui-sdk/core`, `@ui-sdk/web` |
| `src/elements/ui-tabs.ts` | `src/runtime/**`; L2 files | `@ui-sdk/core`, `@ui-sdk/web`, `@ui-sdk/web/tabs` |
| `src/elements/ui-tooltip.ts` | `src/runtime/**`; L2 files | `@ui-sdk/core`, `@ui-sdk/web`, `@ui-sdk/web/tooltip` |
| `src/elements/ui-toast.ts` | `src/runtime/**`; L2 files | `@ui-sdk/core`, `@ui-sdk/web`, `@ui-sdk/web/toast` |
| `src/commerce/adapter.ts`, `src/commerce/dialect.ts` | each other; L2 files | `@shopify/hydrogen` (types only) |
| `src/commerce/adapter-hydrogen.ts` | `src/commerce/adapter.ts`, `dialect.ts`, `refresh-html.ts`, `refresh-remix.ts`, `refresh-react.ts`; L2 files | `@shopify/hydrogen` |
| `src/commerce/adapter-liquid.ts` | `src/commerce/adapter.ts`, `dialect.ts`, `refresh-liquid.ts`; L2 files | `@shopify/hydrogen`; `@shopify/standard-actions`, `@shopify/standard-events` (dynamic `import()` only) |
| `src/commerce/refresh-html.ts`, `refresh-remix.ts`, `refresh-react.ts` | `src/commerce/adapter.ts`; L2 files | nothing |
| `src/commerce/refresh-liquid.ts` | `src/commerce/adapter.ts`; L2 files | `@shopify/partial-rendering` (dynamic `import()` only) |
| `src/commerce/rp-*.ts` | `src/commerce/adapter.ts`, `dialect.ts`; `src/runtime/**`; L2 files | `@ui-sdk/core`, `@ui-sdk/web` |
| `src/commerce/index.ts` | `src/commerce/**`; `src/runtime/**`; L2 files | `@ui-sdk/core`, `@ui-sdk/web` |
| `src/react/**` | `src/react/**`; `src/commerce/adapter.ts`; L2 files | `react`; `@shopify/hydrogen` (types only) |
| `src/remix/**` | `src/remix/**`; L2 files | nothing |
| `src/agent/**` | L2 files | `@ui-sdk/web/agent` |
| `src/testing/**` | `src/testing/**`; L2 files | `parse5`, `liquidjs`, `node:*`; `playwright` (types only) |
| `src/check/**` | `src/check/**`; `src/testing/canonicalize.ts`; L2 files | `parse5`, `node:*`; `playwright` and `@shopify/theme-check-node` (dynamic `import()` only) |
| `src/cli/**` | `src/cli/**`; `src/check/**`; L2 files | `node:*` |
| `src/gen/**` | `src/gen/**`; `src/testing/**`; `src/check/**`; L2 files | `parse5`, `liquidjs`, `esbuild`, `typescript`, `node:*` |
| `components/<id>/react/*.tsx` (scaffolded) | sibling component bindings by relative path | `<pkg>`, `<pkg>/react`, `react` |
| `components/<id>/remix/*.tsx` (scaffolded) | sibling component bindings by relative path | `<pkg>`, `<pkg>/remix`, `remix` (subpaths allowed by `06-bindings.md` only), `@shopify/hydrogen` |
| `blueprints/<id>/<host>/**` (scaffolded) | scaffolded bindings | as the host's binding row, plus `<pkg>/elements`, `<pkg>/commerce` in client entries |

Rules that the table implies, stated outright:

1. Library code (`src/**`) MUST NOT import anything under `components/`, `blueprints/`, `css/`, `icons/`, `locales/`, `skills/`, `examples/`, `evals/` or `test/`. Exception: `src/gen/**`, `src/cli/**` and `src/check/**` READ those directories as data with `node:fs`; they MUST NOT `import` from them.
2. `src/elements/**` MUST NOT import `src/commerce/**`, `@shopify/hydrogen`, or `react`. This is what makes `browser/ripple.elements.js` free of Hydrogen.
3. `src/commerce/**` MUST NOT import `src/elements/**`. A commerce component that needs a dialog (CartDrawer) composes the `rp-dialog` element in markup; the two elements communicate through the DOM (D-019 item 3), never through an import.
4. A value import of `@shopify/hydrogen` MUST appear only in `src/commerce/adapter-hydrogen.ts` and `src/commerce/adapter-liquid.ts` (D-062 item 4). Every other file uses `import type`.
5. `@shopify/partial-rendering`, `@shopify/standard-actions` and `@shopify/standard-events` are platform-provided specifiers, not npm packages (D-046). They MUST appear only in the two files named in the table, only as the argument of a dynamic `import()` inside `try`/`catch`, and MUST NOT appear in any `package.json`.
6. `@ui-sdk/react`, `@ui-sdk/core/web.css`, any `@ui-sdk/core/internal/*` path, the upstream autoloader, `@remix-run/ui`, and `@shopify/hydrogen/react` MUST NOT be imported by any file in the repository except under `docs/research/` (D-022, D-033, D-034).
7. The only `@ui-sdk/web/<entry>` subpaths that may be imported are `tabs`, `tooltip`, `toast`, `agent` (D-022 item 4).
8. `src/react/**` MUST import the commerce accessor from `src/commerce/adapter.ts`, never from `src/commerce/index.ts` (which defines elements and needs a DOM).
9. No file under `src/` may read the string `ripple-kit`; the package name is read from `PKG_NAME` in `src/identity.ts` (section 6.3).
10. Tooling (`src/gen`, `src/check`, `src/cli`, `src/testing`) MUST NOT import `src/runtime`, `src/elements`, `src/commerce`, `src/react`, `src/remix` or `src/agent`.

The complete rule set above is also given as data so that test A-03 can enforce it. `src/architecture.test.ts` MUST contain this object verbatim and check every `import` / `export from` / `import()` specifier in `src/**/*.ts` (excluding `*.test.ts`) against it:

```ts
// key: glob of importer, relative to repo root. value: allowed specifiers.
// "./x" entries are repo-root-relative globs for Ripple source; bare entries are npm or platform specifiers.
// A trailing " (type)" means only `import type` / `export type` is allowed.
export const IMPORT_RULES: Record<string, string[]> = {
  "src/identity.ts": [],
  "src/{index,responsive,image,types}.ts": ["./src/{identity,index,responsive,image,types}.ts"],
  "src/runtime/**": ["./src/runtime/**", "./src/identity.ts", "@ui-sdk/core"],
  "src/elements/{index,rp-*}.ts": ["./src/elements/**", "./src/runtime/**", "./src/{identity,index,responsive,image,types}.ts", "@ui-sdk/core", "@ui-sdk/web"],
  "src/elements/ui-tabs.ts": ["./src/runtime/**", "./src/{identity,index,responsive,image,types}.ts", "@ui-sdk/core", "@ui-sdk/web", "@ui-sdk/web/tabs"],
  "src/elements/ui-tooltip.ts": ["./src/runtime/**", "./src/{identity,index,responsive,image,types}.ts", "@ui-sdk/core", "@ui-sdk/web", "@ui-sdk/web/tooltip"],
  "src/elements/ui-toast.ts": ["./src/runtime/**", "./src/{identity,index,responsive,image,types}.ts", "@ui-sdk/core", "@ui-sdk/web", "@ui-sdk/web/toast"],
  "src/commerce/{adapter,dialect}.ts": ["./src/commerce/{adapter,dialect}.ts", "./src/{identity,index,responsive,image,types}.ts", "@shopify/hydrogen (type)"],
  "src/commerce/adapter-hydrogen.ts": ["./src/commerce/{adapter,dialect,refresh-html,refresh-remix,refresh-react}.ts", "./src/{identity,index,responsive,image,types}.ts", "@shopify/hydrogen"],
  "src/commerce/adapter-liquid.ts": ["./src/commerce/{adapter,dialect,refresh-liquid}.ts", "./src/{identity,index,responsive,image,types}.ts", "@shopify/hydrogen", "@shopify/standard-actions", "@shopify/standard-events"],
  "src/commerce/refresh-{html,remix,react}.ts": ["./src/commerce/adapter.ts", "./src/{identity,index,responsive,image,types}.ts"],
  "src/commerce/refresh-liquid.ts": ["./src/commerce/adapter.ts", "./src/{identity,index,responsive,image,types}.ts", "@shopify/partial-rendering"],
  "src/commerce/rp-*.ts": ["./src/commerce/{adapter,dialect}.ts", "./src/runtime/**", "./src/{identity,index,responsive,image,types}.ts", "@ui-sdk/core", "@ui-sdk/web"],
  "src/commerce/index.ts": ["./src/commerce/**", "./src/runtime/**", "./src/{identity,index,responsive,image,types}.ts", "@ui-sdk/core", "@ui-sdk/web"],
  "src/react/**": ["./src/react/**", "./src/commerce/adapter.ts", "./src/{identity,index,responsive,image,types}.ts", "react", "@shopify/hydrogen (type)"],
  "src/remix/**": ["./src/remix/**", "./src/{identity,index,responsive,image,types}.ts"],
  "src/agent/**": ["./src/{identity,index,responsive,image,types}.ts", "@ui-sdk/web/agent"],
  "src/testing/**": ["./src/testing/**", "./src/{identity,index,responsive,image,types}.ts", "parse5", "liquidjs", "node:*", "playwright (type)"],
  "src/check/**": ["./src/check/**", "./src/testing/canonicalize.ts", "./src/{identity,index,responsive,image,types}.ts", "parse5", "node:*", "playwright", "@shopify/theme-check-node"],
  "src/cli/**": ["./src/cli/**", "./src/check/**", "./src/{identity,index,responsive,image,types}.ts", "node:*"],
  "src/gen/**": ["./src/gen/**", "./src/testing/**", "./src/check/**", "./src/{identity,index,responsive,image,types}.ts", "parse5", "liquidjs", "esbuild", "typescript", "node:*"]
};
```

When several keys match a file, the FIRST matching key in the order above applies. A file under `src/` that matches no key is an error.

### 2.3 Where each external API is touched

This table is the blast radius of each beta or peer dependency (D-062). An API not in the "Symbols" column is not confirmed by this document; the owning doc confirms the rest.

| Dependency | Symbols confirmed in source | Evidence | Allowed in |
|---|---|---|---|
| `@ui-sdk/core` | `definePrimitive`, `announce` | `uisdk/packages/core/src/index.ts` (lines 3, 167) | `src/runtime`, `src/elements`, `src/commerce/rp-*.ts`, `src/commerce/index.ts` |
| `@ui-sdk/web` | `createParts` | `uisdk/packages/web/src/index.ts` (line 4), `uisdk/packages/web/src/define-element.ts` | `src/elements`, `src/commerce/rp-*.ts`, `src/commerce/index.ts` |
| `@ui-sdk/web/tabs`, `/tooltip`, `/toast` | element-defining entries; `toast` from `@ui-sdk/web` | `uisdk/packages/web/package.json` (`exports`), `uisdk/packages/web/src/entries/` | the matching `src/elements/ui-*.ts` only |
| `@ui-sdk/web/agent` | `createAgent`, `agentTools`, `registerTools` | `uisdk/packages/web/src/agent.ts` | `src/agent` only |
| `@ui-sdk/core/testing` | `checkPattern` | `uisdk/packages/core/src/testing.ts`; exact signature owned by `13-testing.md` | test files only (`*.test.ts`, `test/**`) |
| `@shopify/hydrogen` | `createCartStore`, `configureCartEndpoint`, `createCartServerHandlers`, `getCart`, `getCartId`, `formatMoney` | `hydrogen/packages/hydrogen/src/core/index.ts` (lines 111, 112, 128, 299) | client: the two adapter files. Server: scaffolded `react` / `remix` bindings and blueprints. |
| `Shopify.actions.*` (global), `@shopify/standard-actions`, `@shopify/standard-events` | UNVERIFIED against the real runtime (SPIKE-01) | `ripple/docs/research/hydrogen-core.md` | `src/commerce/adapter-liquid.ts` only |
| `@shopify/partial-rendering` | `partials.fetch`, `partials.apply` (UNVERIFIED against a preview store, SPIKE-02) | `ripple/docs/research/liquid-blocks-partials.md`; `ripple/theme/AGENTS.md` | `src/commerce/refresh-liquid.ts` only |
| `react` | React 19 public API | `ripple/docs/research/react-and-custom-elements.md` | `src/react`, scaffolded React bindings |
| `remix` | Remix 3 component API | `ripple/docs/research/remix-3.md` | scaffolded Remix bindings and blueprints only |

---

## 3. Lifecycle of a page

The five phases below apply to every host. Details of each phase are owned by the linked document; the order and the guarantees are owned here.

### 3.1 Phase 1: server render

1. The host's binding prints the HTML contract of each component (I-1). No host generates ids (D-020).
2. The document `<head>` loads CSS before any content: `ripple.css` (or the project's CSS entry that imports it first). CSS delivery per host: D-055; details in `03-styling-and-tokens.md`.
3. The document loads the JavaScript as `<script type="module">` (deferred by definition). JavaScript delivery per host:

| Host | What the page loads | Where the files come from |
|---|---|---|
| `liquid` | `{% render 'rp-head' %}` in `layout/theme.liquid`: stylesheet for `assets/ripple.css`, `{% render 'rp-tokens' %}`, inline Invoker Commands polyfill, `<script type="module" src="{{ 'ripple.js' | asset_url }}">`. Cross-file imports are the bare specifiers `ripple`, `ripple/tabs`, `ripple/tooltip`, `ripple/toast`, `ripple/agent`, resolved by `snippets/rp-import-map-entries.liquid`. | `registry/liquid/assets/` (bare-specifier build) |
| `html` | `<script type="module" src="/ripple/ripple.js">` (or `ripple.elements.js` when the page has no commerce) | `browser/` (relative-import build), copied by `ripple init` |
| `remix` | `<script type="module" src="/ripple/ripple.js">`, served from `public/ripple/`, never through the Remix asset server | `browser/`, copied by `ripple init` |
| `react` | the app's client entry contains `import "<pkg>/elements"; import "<pkg>/commerce";` exactly once each | `dist/`, bundled by the app's bundler |

The exact `rp-head` snippet, import map entries and `ripple init` copy targets are owned by `14-liquid-theme.md` and `07-manifest-registry-cli.md`.

### 3.2 Phase 2: pre-upgrade (also the permanent state when JavaScript never runs)

1. The page is fully usable at the level each component declares in `noJs.level` (D-005).
2. `base.css` gives every `ui-*` and `rp-*` tag its final `display` value and applies the `data-rp-js` visibility rules (D-021), so that phase 3 causes no layout shift.
3. Native behaviour is live: `<dialog>` with Invoker Commands (or the inline polyfill on Liquid), `popover`, `<details>`, forms, links.

### 3.3 Phase 3: upgrade

Order of execution inside the main bundle (the bodies are owned by `04-elements.md` and `05-commerce.md`; the order is fixed here):

1. Runtime start (`src/runtime/index.ts`): install the Invoker Commands polyfill if `"commandForElement" in HTMLButtonElement.prototype` is false; install the single document-level `click` listener for `[data-rp-open]`; create the announcer.
2. Define the non-commerce `rp-*` elements: `rp-dialog`, `rp-carousel`, `rp-quantity`, `rp-navigation-menu`.
3. Register lazy chunks. For each of `ui-tabs`, `ui-tooltip`, `ui-toast-region`: if a matching tag is in the document at `DOMContentLoaded`, or is inserted later, import the chunk (D-054 item 2).
4. Commerce start (`ripple.js` and `<pkg>/commerce` only): feature-test the platform (`AbortSignal.any`, `crypto.randomUUID`; on Liquid also Standard Actions). If any test fails, set `usable = false`, define NO commerce element, and stop (I-4). Otherwise create the adapter, create the one cart store, then define `rp-cart`, `rp-product-form`, `rp-live`, `rp-predictive-search`, `rp-recommendations`.
5. Nothing in steps 1 to 4 may write inside a component root except allow-listed entries (I-2).

A failure (thrown error) in step 4 MUST NOT prevent steps 1 to 3 from having completed, and a failure in the import of a lazy chunk MUST NOT affect any other element. Each of steps 1, 2, 3, 4 is wrapped in its own `try`/`catch` that logs with `console.error` and continues.

### 3.4 Phase 4: interaction

1. Non-commerce elements reflect state with the attributes of D-021 and dispatch the events of D-023 on their root.
2. Commerce elements call only `getCommerce()` methods. During a mutation they set `data-pending=""` and `aria-busy="true"`; they never create, remove or reorder markup outside React (D-045).
3. React reads the store through hooks from `<pkg>/react`; other hosts listen to DOM events.

### 3.5 Phase 5: region refresh

1. An element (or user code) calls `getCommerce().refresh(regions, { url, reason })`.
2. The adapter dispatches `rp:refresh` on `document` (cancelable). If not cancelled, it runs the host strategy from `src/commerce/refresh-<host>.ts`, then dispatches `rp:refreshed` (D-023, D-046).
3. A refresh REPLACES DOM. Elements survive because they hold no descendant references (D-019 item 3); a `ui-*` root is replaced whole or left untouched (D-022 item 5).
4. Any failure of the strategy falls back to navigation (`location.assign(url)` or `location.reload()`).

Data-flow summary of a cart mutation, all hosts:

```text
user submits <form> ──(no JS)──────────────────────────────► server endpoint ─► full page response
        │
        └─(JS, usable)─► rp-cart / rp-product-form
                              │ getCommerce().submitCart(form, submitter, event)
                              ▼
                         adapter (dialect translation on liquid) ─► Hydrogen cart store
                              │                                          │ hydrogen: POST /api/cart
                              │                                          │ liquid:  Shopify.actions.updateCart
                              ▼                                          ▼
                    data-pending / aria-busy on the line        store state settles
                              │                                          │
                              └──────────── refresh(regions in data-rp-refresh) ◄──┘
                                                 │
                                                 ▼
                       host strategy replaces [data-rp-region] markup; rp:refreshed fires; announce()
```

---

## 4. Repository layout

The tree in `00-decisions.md` section 5.1 is the complete tree. The table below gives every directory, its purpose, whether its content is hand-written (H), generated and committed (G), or build output that is not committed (B), and its owning document. A top-level directory or root file not in this table MUST NOT be created (exceptions: `.git/`, `.gitignore`, `node_modules/`).

### 4.1 Root files

| Path | Kind | Purpose |
|---|---|---|
| `package.json` | H | Private development manifest (section 5.1). It is NOT the published manifest. |
| `pnpm-lock.yaml` | G | Lockfile; committed. |
| `tsconfig.json` | H | TypeScript configuration (section 5.2). |
| `size-budget.json` | H | Gzip budgets of D-064; format owned by `13-testing.md`. |
| `README.md`, `PLAN.md`, `AGENTS.md`, `LICENSE` | H | Project documents. `AGENTS.md` here is for contributors to Ripple; the section generated into projects is owned by `08-agent-kit-and-evals.md`. |
| `.gitignore` | H | MUST contain exactly the lines `node_modules/`, `pkg/`, `evals/runs/`. |

### 4.2 Directories

| Path | Kind | Purpose | Owner |
|---|---|---|---|
| `bin/` | H | `ripple.mjs`: a wrapper whose whole body is `#!/usr/bin/env node` followed by `import "../dist/cli/index.mjs";`. It is copied unchanged to `pkg/bin/`; it resolves only inside `pkg/`. | 07 |
| `docs/` | H | The specification: `00-decisions.md` to `14-liquid-theme.md`. NOT shipped. Do not confuse with the package's `docs/` (section 6.1), which is generated. | all |
| `docs/research/` | H | The eight research reports and `spikes/`. Read-only history. New spike reports go in `docs/research/spikes/<name>/`. | 00 |
| `theme/` | H | The Shopify base theme. Reference only: never shipped, never edited, never imported. | 00 |
| `src/` | H | All library and tooling TypeScript. | this doc |
| `src/runtime/` | H | L3. `index.ts` (start), `loader.ts` (lazy chunks), `commands-polyfill.ts`, `opener.ts`, `announcer.ts`. | 04 |
| `src/elements/` | H | L4. `index.ts`, `rp-dialog.ts`, `rp-carousel.ts`, `rp-quantity.ts`, `rp-navigation-menu.ts`, `ui-tabs.ts`, `ui-tooltip.ts`, `ui-toast.ts`. | 04 |
| `src/commerce/` | H | L5. `index.ts`, `adapter.ts`, `adapter-hydrogen.ts`, `adapter-liquid.ts`, `dialect.ts`, `refresh-html.ts`, `refresh-liquid.ts`, `refresh-remix.ts`, `refresh-react.ts`, `rp-cart.ts`, `rp-product-form.ts`, `rp-live.ts`, `rp-predictive-search.ts`, `rp-recommendations.ts`. | 05 |
| `src/react/` | H | L6. `index.ts`, `use-element.ts`, `hooks.ts`. | 06 |
| `src/remix/` | H | L6. `index.ts`. | 06 |
| `src/agent/` | H | L6. `index.ts`. | 08 |
| `src/testing/` | H | T. `index.ts`, `canonicalize.ts`, `fixtures.ts`, `upgrade-diff.ts`, `liquid-shim.ts`. | 13 |
| `src/check/` | H | T. `index.ts`, `engine.ts`, `report.ts`, `rules/<RULE>.ts` (one file per rule id). | 07 |
| `src/cli/` | H | T. `index.ts`, `detect-host.ts`, `trailer.ts`, `merge3.ts`, `plan.ts`, `commands/<command>.ts`. | 07 |
| `src/gen/` | H | T. The generator (`index.ts`, `html.ts`, `liquid.ts`, `react.ts`, `remix.ts`, `types.ts`, `props-css.ts`, `theme-css.ts`, `display-css.ts`, `docs.ts`, `registry.ts`, `agents-md.ts`) and the package build (`build.ts`, section 7). | 07; `build.ts` this doc |
| `css/` | H + G | Global CSS sources. Hand-written: `layers.css`, `tokens.css`, `base.css`. Generated and committed: `theme.css`, `props.css`. | 03 |
| `icons/` | H | `<name>.svg`, one per icon name of ledger section 6.6. | 09 |
| `locales/` | H | `en.default.json`: every `ripple.<component id>.<key>` string. | 06 |
| `components/<id>/` | H + G | One directory per component: `<id>.json` (H, manifest entry), `<id>.css` (H), `<id>.test.ts` (H), `fixtures/` (G), `html/` (G), `react/`, `remix/`, `liquid/` (G for kind `static`; H otherwise, D-003). | 07, 09 to 12 |
| `blueprints/<id>/` | H | `blueprint.json` and one directory per host: `html/`, `react/`, `remix/`, `liquid/`. | 12 |
| `skills/<skill>/` | H | `SKILL.md` and `ripple.json` for each of the 14 skills (D-060). | 08 |
| `guides/` | H | `<topic>.md` hand-written guides; copied to `pkg/docs/guides/`. | 08 |
| `evals/` | H + B | `tasks/T<nn>/`, `adapters/`, `rubric/` (H); `runs/` (B, not committed). Never published. | 08 |
| `examples/` | H | `html/`, `react/`, `remix/`, `liquid/`: one runnable example per host. `liquid/` is the Ripple theme of `14-liquid-theme.md`. Never published. | 12, 14 |
| `test/` | H | Cross-cutting tests that are not next to one source file: `conformance/`, `upgrade/`, `hydration/`, `nojs/`, `commerce/`, `liquid/`, `cross-engine/`. | 13 |
| `pkg/` | B | The publishable package, written only by `pnpm build`. Never committed, never edited by hand. | this doc |

Rules:

1. Unit tests are `<name>.test.ts` next to the source file they test (ledger 4.6). `test/` holds only tests that span components or hosts.
2. The repository is ONE pnpm package, not a pnpm workspace: there MUST NOT be a `pnpm-workspace.yaml`. Each directory under `examples/` and `evals/adapters/` that needs npm packages has its own `package.json` with `"private": true` and depends on the built package as `"<pkg>": "file:../../pkg"` (path adjusted to depth).
3. Generated-and-committed files (kind G) MUST be reproduced byte-for-byte by `pnpm gen`; `pnpm gen --check` fails when they differ (D-003).
4. Tooling scripts resolve every path from `process.cwd()` and MUST be run from the repository root. They MUST NOT use `import.meta.url` to locate repository files.

---

## 5. Development manifest and TypeScript configuration

### 5.1 Root `package.json`

The root manifest is private. It lists the runtime dependencies and peers so that pnpm installs them for development, plus the build tools. The published manifest is generated (section 6.2). Complete file:

```json
{
  "name": "ripple-repo",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.28.0",
  "engines": { "node": ">=22.18" },
  "scripts": {
    "gen": "esbuild src/gen/index.ts --bundle --platform=node --format=esm --packages=external --log-level=warning --outfile=node_modules/.cache/ripple/gen.mjs && node node_modules/.cache/ripple/gen.mjs",
    "build": "esbuild src/gen/build.ts --bundle --platform=node --format=esm --packages=external --log-level=warning --outfile=node_modules/.cache/ripple/build.mjs && node node_modules/.cache/ripple/build.mjs",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@ui-sdk/core": "0.1.0-beta.14",
    "@ui-sdk/web": "0.1.0-beta.14"
  },
  "devDependencies": {
    "@shopify/hydrogen": "2026.10.3",
    "@shopify/theme-check-node": "4.0.2",
    "@tailwindcss/cli": "4.3.5",
    "esbuild": "0.28.2",
    "liquidjs": "10.30.1",
    "parse5": "8.1.1",
    "playwright": "1.63.0",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "remix": "3.3.0",
    "tailwindcss": "4.3.5",
    "typescript": "6.0.3"
  }
}
```

- `pnpm gen --check` works because pnpm appends extra arguments to the end of the script, so `--check` reaches `gen.mjs`.
- `13-testing.md` adds the `test` scripts and any test-runner devDependency. Any devDependency added by another document MUST be an exact version (no `^`, no `~`) and MUST be added to the table in section 9.
- The name `ripple-repo` is not the package name and is not subject to the rename test.

### 5.2 `tsconfig.json`

Complete file:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["src", "test", "components/**/*.test.ts"],
  "exclude": ["node_modules", "pkg", "theme", "docs", "examples", "evals", "components/**/react", "components/**/remix", "blueprints"]
}
```

- `verbatimModuleSyntax` makes "types only" imports in section 2.2 mechanical: a type-only import MUST be written `import type`.
- Scaffolded TSX (`components/**/react`, `components/**/remix`, `blueprints/`) is type-checked by the conformance harness inside each host's example project, not by the root config, because React and Remix need different JSX settings (`06-bindings.md`).
- Source files import each other WITHOUT a file extension (`import { rv } from "./responsive"`); esbuild resolves them.

---

## 6. The published package

### 6.1 Tree of `pkg/`

`pnpm build` writes exactly this tree. A file or directory not listed MUST NOT be in `pkg/`.

```text
pkg/
  package.json                      # generated, section 6.2
  README.md  LICENSE                # copied from the repo root
  bin/ripple.mjs                    # copied from bin/
  dist/
    index.mjs                       # <pkg>
    elements/index.mjs              # <pkg>/elements
    elements/rp-dialog.mjs  rp-carousel.mjs  rp-quantity.mjs  rp-navigation-menu.mjs
    elements/ui-tabs.mjs  ui-tooltip.mjs  ui-toast.mjs          # <pkg>/elements/<tag>
    commerce/index.mjs              # <pkg>/commerce
    commerce/rp-cart.mjs  rp-product-form.mjs  rp-live.mjs  rp-predictive-search.mjs  rp-recommendations.mjs
    react/index.mjs                 # <pkg>/react
    remix/index.mjs                 # <pkg>/remix
    agent/index.mjs                 # <pkg>/agent
    chunks/*.mjs                    # shared code split out by the bundler (section 7 step 4)
    testing/index.mjs               # <pkg>/testing   (Node)
    check/index.mjs                 # <pkg>/check     (Node)
    cli/index.mjs                   # the CLI         (Node)
    **/*.d.mts                      # one declaration file next to every entry .mjs above
  browser/
    ripple.js                       # kernel + runtime + all rp-* elements + Hydrogen cart subset
    ripple-tabs.js  ripple-tooltip.js  ripple-toast.js  ripple-agent.js            # import "./ripple.js"
    ripple.elements.js              # kernel + runtime + non-commerce rp-* elements; no Hydrogen
    ripple.elements-tabs.js  ripple.elements-tooltip.js  ripple.elements-toast.js  ripple.elements-agent.js   # import "./ripple.elements.js"
    ripple.css                      # layers + tokens + base + props + every component
  css/
    layers.css  tokens.css  theme.css  base.css  props.css
    components/<id>.css
  registry/
    index.json
    css/  react/  remix/  html/
    liquid/blocks/  liquid/snippets/  liquid/assets/  liquid/locales/
    blueprints/<id>/<host>/
  manifest.json  manifest.schema.json  config.schema.json
  custom-elements.json  html-custom-data.json
  docs/
    INDEX.md  llms.txt  components/<id>.md  guides/<topic>.md  rules/<RULE>.md
  skills/<skill>/SKILL.md  skills/<skill>/ripple.json
```

- `registry/liquid/assets/` holds the Liquid build of the browser files: `ripple.js`, `ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`, `ripple-agent.js`. They are the same code as `browser/ripple*.js` except that every cross-file import uses a bare specifier (`ripple`, `ripple/tabs`, `ripple/tooltip`, `ripple/toast`, `ripple/agent`) instead of a relative path (D-054 item 3). There is no `ripple.elements.js` on Liquid.
- The contents of `registry/`, `manifest*.json`, `config.schema.json`, `custom-elements.json`, `html-custom-data.json` are owned by `07-manifest-registry-cli.md`; of `docs/` and `skills/` by `08-agent-kit-and-evals.md`.

### 6.2 Generated `pkg/package.json`

`src/gen/build.ts` writes this object, with `name` taken from the resolved package name (section 6.3) and `version` from the constant `VERSION` exported by `src/identity.ts`. Complete content for name `ripple-kit`, version `0.1.0`:

```json
{
  "name": "ripple-kit",
  "version": "0.1.0",
  "type": "module",
  "license": "MIT",
  "bin": { "ripple": "./bin/ripple.mjs" },
  "files": [
    "bin", "dist", "browser", "css", "registry", "docs", "skills",
    "manifest.json", "manifest.schema.json", "config.schema.json",
    "custom-elements.json", "html-custom-data.json", "README.md", "LICENSE"
  ],
  "sideEffects": [
    "./dist/elements/*.mjs",
    "./dist/commerce/index.mjs",
    "./dist/commerce/rp-*.mjs",
    "./dist/chunks/*.mjs",
    "./browser/*",
    "*.css"
  ],
  "exports": {
    ".":                      { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
    "./elements":             { "types": "./dist/elements/index.d.mts", "default": "./dist/elements/index.mjs" },
    "./elements/*":           { "types": "./dist/elements/*.d.mts", "default": "./dist/elements/*.mjs" },
    "./commerce":             { "types": "./dist/commerce/index.d.mts", "default": "./dist/commerce/index.mjs" },
    "./commerce/*":           { "types": "./dist/commerce/*.d.mts", "default": "./dist/commerce/*.mjs" },
    "./react":                { "types": "./dist/react/index.d.mts", "default": "./dist/react/index.mjs" },
    "./remix":                { "types": "./dist/remix/index.d.mts", "default": "./dist/remix/index.mjs" },
    "./agent":                { "types": "./dist/agent/index.d.mts", "default": "./dist/agent/index.mjs" },
    "./testing":              { "types": "./dist/testing/index.d.mts", "default": "./dist/testing/index.mjs" },
    "./check":                { "types": "./dist/check/index.d.mts", "default": "./dist/check/index.mjs" },
    "./browser/*":            "./browser/*",
    "./css/*":                "./css/*",
    "./registry/*":           "./registry/*",
    "./docs/*":               "./docs/*",
    "./skills/*":             "./skills/*",
    "./manifest.json":        "./manifest.json",
    "./manifest.schema.json": "./manifest.schema.json",
    "./config.schema.json":   "./config.schema.json",
    "./custom-elements.json": "./custom-elements.json",
    "./html-custom-data.json": "./html-custom-data.json",
    "./package.json":         "./package.json"
  },
  "customElements": "custom-elements.json",
  "keywords": ["pi-package"],
  "pi": { "skills": ["./skills"] },
  "dependencies": {
    "@ui-sdk/core": "0.1.0-beta.14",
    "@ui-sdk/web": "0.1.0-beta.14"
  },
  "peerDependencies": {
    "@shopify/hydrogen": ">=2026.10.3 <2027",
    "react": ">=19",
    "tailwindcss": "^4.0.0",
    "playwright": ">=1.45",
    "@shopify/theme-check-node": "^4.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "tailwindcss": { "optional": true },
    "playwright": { "optional": true },
    "@shopify/theme-check-node": { "optional": true }
  },
  "engines": { "node": ">=20.18" }
}
```

Rules:

1. `dependencies` MUST contain exactly the two UI SDK packages at the exact version (D-022, D-052). `parse5` and `liquidjs` are bundled into the Node entries at build time and MUST NOT appear in the published `dependencies`.
2. `@shopify/hydrogen` is a required peer (not optional). It stays external in `dist/` and is bundled only into `browser/ripple.js` and `registry/liquid/assets/ripple.js` (D-041 item 4).
3. The `license` value is a placeholder for Ben's decision; it MUST equal the SPDX id of the root `LICENSE` file.

### 6.3 Package identity

`src/identity.ts`, complete file:

```ts
export const PKG_NAME = "ripple-kit";
export const BIN_NAME = "ripple";
export const VERSION = "0.1.0";
```

1. The string `ripple-kit` MUST NOT appear in any other file under `src/`, `css/`, `components/`, `blueprints/`, `skills/`, `guides/`, `locales/` or `bin/`. Hand-written text files in those directories that need the package name (scaffolded bindings, skills, guides) write the token `__PKG__`.
2. The build resolves the package name as `process.env.RIPPLE_PKG_NAME`, or `PKG_NAME` when the variable is unset. It then (a) replaces the module `src/identity.ts` during bundling with one that exports the resolved name, and (b) replaces every occurrence of `__PKG__` in every text file it copies into `pkg/` (section 7 steps 3 and 6).
3. Rename test (A-10): build with `RIPPLE_PKG_NAME=@acme/storefront-ui`; the string `ripple-kit` MUST NOT occur in any file under `pkg/`, and `__PKG__` MUST NOT occur in any file under `pkg/`.

### 6.4 Export map: what each entry is for

| Specifier | Source | Runs in | Import has side effects | Exports (names fixed by the ledger; full signatures in the owner doc) | Owner |
|---|---|---|---|---|---|
| `<pkg>` | `src/index.ts` | browser, Node | no | `rv`, `cx`, `imageUrl`, `imageSrcSet`, prop types, the manifest loader, `PKG_NAME`, `VERSION` | 06, 07 |
| `<pkg>/elements` | `src/elements/index.ts` | browser | yes: starts the runtime, defines `rp-dialog`, `rp-carousel`, `rp-quantity`, `rp-navigation-menu`, registers lazy chunks | `toast` | 04 |
| `<pkg>/elements/<tag>` | `src/elements/<tag>.ts` | browser | yes: defines only that element (for `ui-*` entries: that UI SDK family) | per element | 04 |
| `<pkg>/commerce` | `src/commerce/index.ts` | browser | yes: phase 3 step 4 | `getCommerce`, `configureCommerce`, type `RippleCommerce` | 05 |
| `<pkg>/commerce/<tag>` | `src/commerce/<tag>.ts` | browser | yes: defines only that element | per element | 05 |
| `<pkg>/react` | `src/react/index.ts` | browser, Node (SSR) | no | `useElement`, the store hooks, JSX `IntrinsicElements` types | 06 |
| `<pkg>/remix` | `src/remix/index.ts` | browser, Node | no | Remix binding helpers and JSX types | 06 |
| `<pkg>/agent` | `src/agent/index.ts` | browser | no (the caller invokes `createAgent`) | `createAgent`, `agentTools`, `registerTools` | 08 |
| `<pkg>/testing` | `src/testing/index.ts` | Node | no | `canonicalize`, `loadFixtures`, `upgradeDiff`, the Liquid shim | 13 |
| `<pkg>/check` | `src/check/index.ts` | Node | no | `check` | 07 |
| `<pkg>/browser/<file>` | build output | browser | yes | prebuilt bundles and `ripple.css` | this doc, 04 |
| `<pkg>/css/<file>` | `css/`, `components/<id>/<id>.css` | browser | yes (CSS) | CSS sources | 03 |
| `<pkg>/registry/<path>` | build output | read as data by the CLI | no | scaffold sources | 07 |
| `<pkg>/manifest.json` | build output | data | no | the manifest | 07 |
| `<pkg>/docs/<path>`, `<pkg>/skills/<path>` | build output | data | no | agent documentation and skills | 08 |

Valid `<tag>` values: for `<pkg>/elements/<tag>`: `rp-dialog`, `rp-carousel`, `rp-quantity`, `rp-navigation-menu`, `ui-tabs`, `ui-tooltip`, `ui-toast`. For `<pkg>/commerce/<tag>`: `rp-cart`, `rp-product-form`, `rp-live`, `rp-predictive-search`, `rp-recommendations`. No other subpath resolves (the `dist/chunks/` and adapter files have no public specifier).

Import-safety rules:

1. `<pkg>`, `<pkg>/react`, `<pkg>/remix`, `<pkg>/testing`, `<pkg>/check` MUST be importable in Node with no DOM globals defined and with `@shopify/hydrogen` NOT installed (their Hydrogen imports are type-only and are erased).
2. `<pkg>/elements`, `<pkg>/elements/<tag>`, `<pkg>/commerce`, `<pkg>/commerce/<tag>`, `<pkg>/agent` are browser-only. Bindings and server code MUST NOT import them; only a client entry may. (Whether `@ui-sdk/web` can be evaluated without a DOM is UNVERIFIED, so no Ripple code may depend on it.)
3. `src/commerce/adapter.ts` MUST be import-safe in Node (it is imported by `<pkg>/react` during SSR): no DOM access and no store creation at module top level.

### 6.5 Which artifact each host uses

| Artifact | `html` | `react` | `remix` | `liquid` |
|---|---|---|---|---|
| Element JS | `browser/ripple.js` or `browser/ripple.elements.js`, copied to a public directory | `<pkg>/elements` + `<pkg>/commerce` through the app bundler | `browser/ripple.js` copied to `public/ripple/` | `registry/liquid/assets/ripple.js` copied to `assets/` |
| Lazy chunks | `browser/ripple-*.js` (or `ripple.elements-*.js`) beside the main file | code-split by the app bundler | `browser/ripple-*.js` in `public/ripple/` | `assets/ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js` |
| `@ui-sdk/*` copy | inside the main bundle | npm dependency, resolved once by the app bundler | inside the main bundle | inside the main bundle |
| `@shopify/hydrogen` client copy | inside `ripple.js` | peer, resolved once by the app bundler | inside `ripple.js` | inside `ripple.js` |
| `@shopify/hydrogen` server use | app server (`createCartServerHandlers`) | app server | app server | none |
| CSS | scaffolded files, or `browser/ripple.css` with no build | scaffolded files in `paths.styles` | scaffolded files in `paths.styles` | one concatenated `assets/ripple.css` |
| Bindings | `<id>.html` reference files | `<id>.tsx` importing `<pkg>` and `<pkg>/react` | `<id>.tsx` importing `<pkg>` and `<pkg>/remix` | `blocks/*.liquid`, `snippets/rp-*.liquid` |
| Helpers `rv`, `cx` | not used | `<pkg>` | `<pkg>` | not used (Liquid prints strings) |

Rules:

1. A page MUST load exactly one of: `ripple.js`, `ripple.elements.js`, or the bundled `<pkg>/elements` (+ `<pkg>/commerce`) imports. Loading two is a checker error (rule id assigned by `07-manifest-registry-cli.md`).
2. On the `remix` and `html` hosts, server code imports `@shopify/hydrogen` from npm for the server handlers, while the browser gets Hydrogen from inside `ripple.js`. The app's client code MUST NOT import `@shopify/hydrogen`; it reaches the store through the DOM events or, when it needs the object, through `import { getCommerce } from "/ripple/ripple.js"` (`ripple.js` re-exports `getCommerce`, `configureCommerce` and `toast`).
3. On Liquid, theme code MUST import cart access from the bare specifier `ripple` and MUST NOT load `@shopify/hydrogen` separately (D-041 item 4).

---

## 7. Build pipeline

`pnpm build` runs `src/gen/build.ts`. It MUST perform these steps in this order and exit non-zero on the first failure. All bundling uses the esbuild JavaScript API (`build()` from `esbuild`).

1. **Clean.** Delete `pkg/` and recreate it empty.
2. **Generate check.** Run the generator in check mode (same as `pnpm gen --check`). Fail when any generated-and-committed file is stale.
3. **Resolve identity.** `name = process.env.RIPPLE_PKG_NAME ?? PKG_NAME`. Create one esbuild plugin, used by every bundling step, whose `onLoad` for the file `src/identity.ts` returns the contents `export const PKG_NAME = <JSON string of name>; export const BIN_NAME = "ripple"; export const VERSION = <JSON string of VERSION>;`.
4. **Bundle browser-side `dist` entries** in ONE esbuild invocation:
   - `entryPoints`: `src/index.ts`, `src/elements/index.ts`, the seven `src/elements/{rp,ui}-*.ts` files, `src/commerce/index.ts`, the five `src/commerce/rp-*.ts` files, `src/react/index.ts`, `src/remix/index.ts`, `src/agent/index.ts`.
   - `outdir: "pkg/dist"`, `outbase: "src"`, `bundle: true`, `format: "esm"`, `splitting: true`, `platform: "neutral"`, `target: "es2022"`, `outExtension: { ".js": ".mjs" }`, `chunkNames: "chunks/[name]-[hash]"`, `minify: false`.
   - `external`: `@ui-sdk/core`, `@ui-sdk/core/*`, `@ui-sdk/web`, `@ui-sdk/web/*`, `@shopify/hydrogen`, `@shopify/partial-rendering`, `@shopify/standard-actions`, `@shopify/standard-events`, `react`.
   - `splitting: true` in a single invocation is REQUIRED: it guarantees that modules with state (`src/commerce/adapter.ts`, `src/runtime/**`) exist once and are shared by `dist/commerce`, `dist/react` and `dist/elements` (I-3). Building these entries in separate invocations is a defect.
5. **Bundle Node `dist` entries** in one esbuild invocation: `entryPoints` `src/testing/index.ts`, `src/check/index.ts`, `src/cli/index.ts`; `outdir: "pkg/dist"`, `outbase: "src"`, `bundle: true`, `format: "esm"`, `splitting: true`, `platform: "node"`, `target: "node20"`, `outExtension: { ".js": ".mjs" }`, `chunkNames: "chunks/node-[name]-[hash]"`; `external`: `playwright`, `@shopify/theme-check-node`. `parse5` and `liquidjs` are bundled in.
6. **Declarations.** Run the TypeScript compiler with `emitDeclarationOnly` and `declaration` over `src/` (excluding `*.test.ts`) into a temporary directory under `node_modules/.cache/ripple/dts/`; copy the `.d.ts` file of every entry of steps 4 and 5, and every `.d.ts` it references, into `pkg/dist/` with the extension changed to `.d.mts` and relative import specifiers inside them changed from `./x` to `./x.mjs`.
7. **Browser bundles.** Produce the files of `pkg/browser/` and `pkg/registry/liquid/assets/` (minified, `format: "esm"`, `platform: "browser"`, `target: "es2022"`, no externals except the three platform specifiers `@shopify/partial-rendering`, `@shopify/standard-actions`, `@shopify/standard-events`):
   - `ripple.js`: entry equivalent to `export * from "<elements index>"; export * from "<commerce index>";`.
   - `ripple.elements.js`: entry equivalent to `export * from "<elements index>";`.
   - Each lazy chunk and the agent entry: built so that it contains NO copy of `@ui-sdk/core` and instead imports the kernel from its main bundle. The chunk file name is `<main bundle base name>-<chunk>.js` (`ripple-tabs.js`, `ripple.elements-tabs.js`). The bundling mechanism that achieves the shared kernel (which symbols the main bundle re-exports and how chunk imports are redirected) is owned by `04-elements.md`; this document fixes only the file names, the import direction (chunk imports main, never the reverse statically) and tests A-07 and A-08.
   - Liquid variant: the same build with cross-file imports written as bare specifiers (`ripple`, `ripple/tabs`, `ripple/tooltip`, `ripple/toast`, `ripple/agent`) and the dynamic chunk imports in the loader written with those specifiers.
   - `ripple.css`: concatenation, in this order, of `css/layers.css`, `css/tokens.css`, `css/base.css`, `css/props.css`, then every `components/<id>/<id>.css` in ascending order of `<id>` (byte order). Not minified. Exact layer placement of each file is owned by `03-styling-and-tokens.md`.
8. **Copy and token-replace.** Copy `bin/`, `css/` (plus `components/<id>/<id>.css` to `pkg/css/components/<id>.css`), `skills/`, `README.md`, `LICENSE`; build `registry/`, `manifest.json`, the schemas, `custom-elements.json`, `html-custom-data.json` and `docs/` through the generator modules (`07-manifest-registry-cli.md`, `08-agent-kit-and-evals.md`). In every copied or generated text file, replace `__PKG__` with the resolved name.
9. **Write `pkg/package.json`** (section 6.2).
10. **Verify.** Run tests A-05, A-06, A-11 of section 11 against `pkg/`; fail when `__PKG__` occurs in any file under `pkg/` (the full rename test A-10 is a separate CI job that runs the build again with `RIPPLE_PKG_NAME` set); check `manifest.pins` (below); check `size-budget.json` (`13-testing.md`).

`manifest.pins` (ledger 4.8) MUST be exactly this object, with the values read at build time from `node_modules/<name>/package.json` `version`:

```json
{ "@ui-sdk/core": "0.1.0-beta.14", "@ui-sdk/web": "0.1.0-beta.14", "@shopify/hydrogen": "2026.10.3" }
```

The build fails when the two `@ui-sdk/*` values differ from each other or from the `dependencies` entries of section 6.2, or when the `@shopify/hydrogen` value is outside the peer range.

---

## 8. Dependency rules

### 8.1 Allowed runtime dependencies

Ben's decision 3 as it is implemented (D-052, D-030):

| Package | Relationship | Version | Reaches the browser as |
|---|---|---|---|
| `@ui-sdk/core` | `dependencies` | exactly `0.1.0-beta.14` | bundled in `browser/*.js`; npm module in `react` apps |
| `@ui-sdk/web` | `dependencies` | exactly `0.1.0-beta.14` | same |
| `@shopify/hydrogen` | `peerDependencies` (required) | `>=2026.10.3 <2027` | bundled cart subset in `ripple.js`; npm module in `react` apps |
| `tailwindcss` | `peerDependencies` (optional) | `^4.0.0` | never (build-time only) |
| `react` | `peerDependencies` (optional) | `>=19` | only on the `react` host |
| `playwright` | `peerDependencies` (optional) | `>=1.45` | never (`ripple check --browser`, tests) |
| `@shopify/theme-check-node` | `peerDependencies` (optional) | `^4.0.0` | never (`ripple check` on Liquid) |

Rules:

1. No other package may appear in the published `dependencies` or `peerDependencies`.
2. No file shipped to a browser may contain code from any npm package other than `@ui-sdk/core`, `@ui-sdk/web` and `@shopify/hydrogen`.
3. Build-time tools (`esbuild`, `typescript`, `parse5`, `liquidjs`) are `devDependencies` of the repository. `parse5` and `liquidjs` are bundled into Node entries only.
4. `@tailwindcss/browser` MUST NOT be used or referenced anywhere (D-030).
5. `remix` is NOT a peer: only scaffolded Remix bindings import it, and those are the project's code.
6. Platform-provided specifiers (`@shopify/partial-rendering`, `@shopify/standard-actions`, `@shopify/standard-events`) are not npm dependencies (D-046).

### 8.2 One-copy rules (I-3)

| Thing | Rule | How it is guaranteed |
|---|---|---|
| `@ui-sdk/core` | exactly one copy per page | Prebuilt hosts: only the main bundle contains it; chunks import it from the main bundle. `react` host: it is external in `dist/` and deduplicated by the app bundler. A project MUST NOT load `ripple.js` AND bundle `<pkg>/elements`. |
| `@shopify/hydrogen` | exactly one copy per page | Prebuilt hosts: only `ripple.js` contains it. `react` host: external peer. |
| Cart store | exactly one per page | Created only in phase 3 step 4 by the adapter; reached only through `getCommerce().cart`. `createCartStore` MUST NOT be called anywhere else in library, scaffolded or blueprint code. `CartProvider` MUST NOT be mounted. |
| `Shopify.actions.updateCart.configure` | exactly one call per page (Liquid) | Hydrogen's own call; Ripple and theme code never call it (D-041 item 5). |
| Ripple runtime (document listeners, polyfill) | started exactly once per page | `src/runtime/index.ts` guards with a module-level flag; the single-copy rule of the bundle makes that flag sufficient. |
| Module state in `dist/` | each stateful module once | step 4 of section 7 (`splitting: true`, one invocation). |

### 8.3 Library versus scaffolded (I-5)

1. Scaffolded files MAY import library entries (`<pkg>`, `<pkg>/react`, `<pkg>/remix`); library code MUST NOT import scaffolded files.
2. A scaffolded binding MUST NOT contain element behaviour (no `customElements.define`, no `definePrimitive`). Behaviour is library code (D-053).
3. Scaffolded CSS MUST NOT be imported by library JavaScript. No library module imports a `.css` file.
4. The registry copy of a scaffolded file and the repository source (`components/<id>/...`) differ only by `__PKG__` replacement and the provenance trailer (D-056; `07-manifest-registry-cli.md`).

---

## 9. Pinned versions

"Pin" is the version used for development, fixtures and CI. "Published range" is what `pkg/package.json` declares. All devDependencies are exact versions. A version bump of any row marked (F) is a pull request that regenerates upgrade-snapshot fixtures and MUST pass every test tier (D-062).

| Package / tool | Pin | Published range | Used for | Evidence |
|---|---|---|---|---|
| `@ui-sdk/core` (F) | `0.1.0-beta.14` | `0.1.0-beta.14` (exact) | kernel | `uisdk/packages/core/package.json` |
| `@ui-sdk/web` (F) | `0.1.0-beta.14` | `0.1.0-beta.14` (exact) | `createParts`, Tabs, Tooltip, Toast, agent bridge | `uisdk/packages/web/package.json` |
| `@shopify/hydrogen` (F) | `2026.10.3` | `>=2026.10.3 <2027` (peer) | cart store, server handlers, `formatMoney` | `hydrogen/packages/hydrogen/package.json` |
| `react`, `react-dom` | `19.3.1` | `>=19` (optional peer) | React host | `ripple/docs/research/spikes/react-ce/package.json` |
| `remix` | `3.3.0` (`@remix-run/component` `1.3.0`) | none | Remix host tests and example | `remix/packages/remix/package.json`, `remix/packages/component/package.json` |
| `tailwindcss`, `@tailwindcss/cli` | `4.3.5` | `^4.0.0` (optional peer) | `theme.css` verification, examples | `ripple/docs/research/spikes/styling/package.json` |
| `playwright` | `1.63.0` | `>=1.45` (optional peer) | browser tests, `ripple check --browser` | preinstalled version on the build machine |
| `@shopify/theme-check-node` | `4.0.2` | `^4.0.0` (optional peer) | `TC:` findings in `ripple check` | `ripple/docs/research/spikes/liquid/package.json` |
| `liquidjs` | `10.30.1` | bundled into `dist/testing` | the Liquid shim | `ripple/docs/research/liquid-blocks-partials.md` |
| `parse5` | `8.1.1` | bundled into `dist/check`, `dist/testing`, `dist/cli` | HTML parsing | `ripple/docs/research/spikes/agent-kit/package.json` |
| `esbuild` | `0.28.2` | none | all bundling | `ripple/docs/research/spikes/agent-kit/package.json` |
| `typescript` | `6.0.3` | none | type-check, declarations | `ripple/docs/research/spikes/remix/package.json` |
| `pnpm` | `10.28.0` | none | package manager | version on the build machine |
| Node.js | `>=22.18` for the repository | `engines.node: ">=20.18"` for the package | tooling | spikes ran on Node 22; `remix@3.3.0` declares `engines.node: ">=24.3.0"` (`remix/packages/remix/package.json`), so `examples/remix` and Remix test tiers need Node 24.3 or later |
| Liquid platform | "Liquid July '26 developer preview" | not an npm package | `{% block %}`, `{% partial %}`, `@shopify/partial-rendering`, Standard Actions | `ripple/theme/AGENTS.md`; UNVERIFIED on a live store (SPIKE-01, SPIKE-02) |
| Storefront data | `mock.shop` | none | hydrogen-backend tests and examples (Ben decision 10) | `ripple/docs/research/hydrogen-core.md` |

Rules:

1. The two `@ui-sdk/*` versions MUST be identical and exact in every `package.json` in the repository (root, `examples/*`, `evals/*`).
2. The root `package.json` MUST NOT contain a version range character (`^`, `~`, `>`, `<`, `*`, `x`) in `dependencies` or `devDependencies`.
3. Installing a second version of any (F) package anywhere in `node_modules` (check: `pnpm why <name>` lists one version) fails CI.
4. The package's own version (`VERSION` in `src/identity.ts`) starts at `0.1.0`. Every Ripple release that changes a (F) pin MUST change at least the minor version.

### Fallback (SPIKE-04)

Default path (implemented now): `src/runtime/element.ts` does not exist; every `rp-*` element is built with `definePrimitive` + `createParts` (D-019). If SPIKE-04 fails: create `src/runtime/element.ts` exporting `class RippleElement extends HTMLElement` (surface owned by `04-elements.md`); the import rules of section 2.2 do not change (`src/runtime/**` is already importable by L4 and L5), and `@ui-sdk/web` remains a dependency for the three `ui-*` families and the agent bridge.

---

## 10. Browser support floor

The floor is D-032; the per-feature CSS and JS gating is owned by `03-styling-and-tokens.md` and `04-elements.md`. This section fixes the floor and the three capability tiers.

| Engine | Minimum version | Status |
|---|---|---|
| Chrome, Edge | 111 | Chromium verified in spikes (Chromium 157); the minimum itself is UNVERIFIED (SPIKE-06) |
| Safari (macOS and iOS) | 16.4 | UNVERIFIED (SPIKE-06) |
| Firefox | 128 | UNVERIFIED (SPIKE-06) |

Capability tiers. A page MUST behave as stated in each tier; a browser below tier 1 is unsupported.

| Tier | Condition | Behaviour |
|---|---|---|
| 0 No script | scripting disabled, script failed to load, or a browser below the floor that cannot parse the module | Phase 2 forever: every `noJs.level: full` component is fully functional; forms post natively (I-4). |
| 1 Elements | at or above the floor | Phases 1 to 3 steps 1 to 3: all non-commerce elements and lazy `ui-*` chunks work. |
| 2 Commerce | tier 1 AND `typeof AbortSignal.any === "function"` AND `typeof crypto.randomUUID === "function"` (Safari 17.4 or later) AND, on Liquid, Standard Actions present | Phase 3 step 4 and phases 4, 5 for commerce. When the condition is false: `usable === false`, no commerce element is defined, forms post natively. |

Features above the floor and their mandatory gate (D-032). Each MUST have a working fallback; none may be assumed:

| Feature | Gate | Fallback | Owner |
|---|---|---|---|
| Invoker Commands (`commandfor`, `command`) | JS test `"commandForElement" in HTMLButtonElement.prototype` | polyfill in `ripple.js`; inline polyfill on Liquid | 04 |
| `closedby="any"` on `<dialog>` | JS test `"closedBy" in HTMLDialogElement.prototype` | backdrop-click handler in `rp-dialog` | 04, 10 |
| CSS anchor positioning | `@supports (anchor-name: --a)` | user-agent centred popover | 03, 10 |
| `pow()` | `@supports (width: calc(1px * pow(2, 2)))` | literal type scale values | 03 |
| Relative colour syntax | `@supports (color: oklch(from red l c h))` | literal derived colours | 03 |
| `@media (scripting: none)` | none needed (an unsupported media query never matches) | Tabs shows only the default panel without JS | 03, 10 |
| Remix morph navigation | Chrome / Edge 135 (`ripple/docs/research/remix-3.md`) | document navigation | 06 |
| `AbortSignal.any`, `crypto.randomUUID` | tier 2 test above | native form posts | 05 |

The exact `@supports` conditions in the table are the defaults to implement; if `03-styling-and-tokens.md` states a different condition for the same feature, that document wins for CSS.

Rules:

1. JavaScript output targets `es2022` (section 7). Syntax newer than ES2022 MUST NOT appear in `browser/*.js`.
2. CSS features are NEVER polyfilled (D-032).
3. User-agent sniffing MUST NOT be used; only feature tests.
4. Cross-engine verification is test tier 9 of D-063 (`13-testing.md`); until SPIKE-06 reports, the floor above is the target and Chromium is the only verified engine.

---

## 11. Acceptance tests

Each test is pass/fail and automatable. Tests A-01 to A-04 and A-12 live in `src/architecture.test.ts`; A-05 to A-11 run in step 10 of the build or in `test/` as noted. Tier numbers refer to D-063.

| Id | Tier | Test | Pass condition |
|---|---|---|---|
| A-01 | 1 | List top-level entries of the repository (excluding `.git`, `.gitignore`, `node_modules`). | Set equals: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `size-budget.json`, `README.md`, `PLAN.md`, `AGENTS.md`, `LICENSE`, `bin`, `docs`, `theme`, `src`, `css`, `icons`, `locales`, `components`, `blueprints`, `skills`, `guides`, `evals`, `examples`, `test`, `pkg` (`pkg` optional). No `pnpm-workspace.yaml`. |
| A-02 | 1 | List entries of `src/`. | Directories equal `runtime`, `elements`, `commerce`, `react`, `remix`, `agent`, `testing`, `check`, `cli`, `gen`; files equal `identity.ts`, `index.ts`, `responsive.ts`, `image.ts`, `types.ts` plus `*.test.ts`. `src/runtime/element.ts` does not exist. |
| A-03 | 1 | Parse every specifier of `import`, `export ... from` and `import()` in `src/**/*.ts` (not `*.test.ts`) and check it against `IMPORT_RULES` (section 2.2). | Zero violations; every file matches a key. |
| A-04 | 1 | Search `src/**/*.ts` for the strings `@ui-sdk/react`, `@ui-sdk/core/internal`, `@ui-sdk/core/web.css`, `@remix-run/ui`, `@shopify/hydrogen/react`, `@tailwindcss/browser`, `CartProvider`, `ripple-kit` (the last one excluding `src/identity.ts`), and for `.css"` / `.css'` import specifiers. | Zero matches. |
| A-05 | build | `node -e "await import('./pkg/dist/index.mjs'); await import('./pkg/dist/react/index.mjs'); await import('./pkg/dist/remix/index.mjs'); await import('./pkg/dist/testing/index.mjs'); await import('./pkg/dist/check/index.mjs')"` run in a directory whose `node_modules` contains `react` but NOT `@shopify/hydrogen`. | Exit code 0. |
| A-06 | build | For every key of `exports` in `pkg/package.json` without `*`: the target files exist. For every `*` key: at least one file matches, and for `./elements/*` and `./commerce/*` the matched base names equal the tag lists in section 6.4 plus `index`. `pkg/` contains no path outside the tree of section 6.1. | All true. |
| A-07 | 3 | In Chromium, load a page with `browser/ripple.js` containing one `ui-tabs` (Tabs `default` fixture) and one `rp-dialog` (Dialog `default` fixture). After the tabs chunk loads, activate the second tab and open the dialog by its opener. | Tab selection changes; dialog opens; exactly one network request each for `ripple.js` and `ripple-tabs.js`; no request for `ripple-tooltip.js` or `ripple-toast.js`; the text of `ripple-tabs.js` contains the import specifier `./ripple.js`; the console shows no UI SDK duplicate-tag warning. |
| A-08 | 3 | Same as A-07 with `browser/ripple.elements.js`. | Same, with chunk `ripple.elements-tabs.js`; no request for `ripple.js`; the text of `ripple.elements.js` does not contain the string `createCartStore`. |
| A-09 | 7 | React example, built by its bundler: in the browser evaluate that the object returned by `getCommerce()` imported through `<pkg>/commerce` is identical (`===`) to the one the `<pkg>/react` hooks read (exposed by a test-only component that stores it on `window`). Count `createCartStore` calls with a wrapper installed by the test. | Identical object; exactly one call. |
| A-10 | build | Build with `RIPPLE_PKG_NAME=@acme/storefront-ui`, then search every file under `pkg/` for `ripple-kit` and `__PKG__`. | Zero matches; `pkg/package.json` `name` is `@acme/storefront-ui`. |
| A-11 | build | Read `pkg/package.json`. | `dependencies` keys equal exactly `@ui-sdk/core`, `@ui-sdk/web`, both `0.1.0-beta.14`; `peerDependencies` keys equal exactly the five of section 6.2; `pkg/manifest.json` `pins` equals the object in section 7. |
| A-12 | 1 | Read the root `package.json`. | No value in `dependencies` or `devDependencies` contains any of `^ ~ > < * x` as a range character (test: every value matches `/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/`). |
| A-13 | 3 | In Chromium, load the page of A-07 with a script that makes `crypto.randomUUID` undefined before `ripple.js` runs. | `customElements.get("rp-dialog")` is defined; `customElements.get("rp-cart")` is undefined; `(await import("/ripple/ripple.js")).getCommerce().usable === false`; submitting an add-to-cart form performs a native navigation. |
| A-14 | 6 | Load the layout blueprint of each host with scripting disabled. | No request for any `ripple*.js` chunk is needed for the page to render; every `noJs.level: full` flow passes (`13-testing.md` tier 6). |

---

## 12. Evidence and UNVERIFIED

Evidence:

- Layering, one-copy rules, bundle composition: `ripple/docs/research/uisdk-web-elements.md` sections 7, 9.6, 9.8; `ripple/docs/research/hydrogen-core.md` (C2, S2, S3, bundle cost).
- Package layout, exports, identity and rename test: `ripple/docs/research/agent-kit-and-distribution.md` 11.1 to 11.4.
- Confirmed symbols: `uisdk/packages/core/src/index.ts`, `uisdk/packages/web/src/index.ts`, `uisdk/packages/web/src/agent.ts`, `uisdk/packages/web/package.json`, `hydrogen/packages/hydrogen/src/core/index.ts`, `hydrogen/packages/hydrogen/package.json`.
- Versions: the `package.json` files listed in section 9.

UNVERIFIED:

- Whether `@ui-sdk/web` modules can be evaluated in Node without a DOM. Not relied upon (section 6.4 rule 2).
- The mechanism by which lazy chunks share the kernel of the main bundle has no spike result; it is owned by `04-elements.md` and gated by A-07 and A-08.
- esbuild `splitting: true` with `platform: "neutral"` producing a single shared chunk for `src/commerce/adapter.ts` was not run for this document; A-09 is the gate.
- Browser floor outside Chromium (SPIKE-06). Real Standard Actions runtime (SPIKE-01). Real partial rendering (SPIKE-02).
- Node `>=20.18` as the package engine floor comes from the research report's draft `package.json` and was not tested; CI MUST run the CLI tests on Node 20.18 before the first release, or raise `engines.node`.

---

## Ledger issues

Items the ledger did not cover or where it is inconsistent. Each states the option applied in this document.

1. **Root `package.json` versus published `package.json`.** The ledger's tree has one root `package.json` and a build output `pkg/`, but does not say which is published. Applied: the root manifest is private (`ripple-repo`); `pkg/package.json` is generated by the build (sections 5.1, 6.2).
2. **Location of the build script.** The ledger's "complete tree" has no build script. Applied: `src/gen/build.ts`, plus `src/architecture.test.ts` for the architecture tests. No new directory was added.
3. **How TypeScript tooling is executed.** Not stated. Applied: esbuild bundles the tool to `node_modules/.cache/ripple/` and Node runs it (section 5.1); tooling resolves paths from `process.cwd()`.
4. **Workspace or single package.** The research report mentions a private workspace package for evals; the ledger's tree has no `pnpm-workspace.yaml`. Applied: single package, no workspace; `examples/*` and `evals/*` consume `file:` links to `pkg/`.
5. **Lazy chunks for `ripple.elements.js`.** D-054 says chunks import the kernel from "the main bundle" but there are two main bundles; a chunk built against `ripple.js` would load a second kernel (and Hydrogen) on a page that uses `ripple.elements.js`. Applied: a second chunk set named `ripple.elements-<chunk>.js` (four more files in `browser/` than ledger 5.2 lists). No `ripple.elements.js` on Liquid.
6. **Liquid build of the browser files.** D-054 item 3 needs bare-specifier imports, item 4 relative imports; the ledger does not say there are two builds. Applied: `browser/` holds the relative build, `registry/liquid/assets/` the bare-specifier build.
7. **Export map details.** D-052 lists `browser/*`, `css/*`, `registry/*`, `manifest.json`; ledger 5.2 lists more files without saying whether they are exported. Applied: every data file of 5.2 is exported (section 6.2). The research report's aliases `./ripple.css` and `./ripple.js` are dropped in favour of `./browser/*`.
8. **`getCommerce` reachability on prebuilt hosts.** On `html` and `remix` the client gets Hydrogen and the adapter only inside `ripple.js`; the ledger names `<pkg>/commerce` as the accessor's home but that specifier does not resolve in a page with no bundler. Applied: `ripple.js` re-exports `getCommerce`, `configureCommerce` and `toast`; client code imports them from the bundle URL (Liquid: from the `ripple` specifier, as D-041 item 4 already says).
9. **`src/remix` and the Remix refresh strategy cannot import `remix`.** D-052 declares no Remix peer, while D-062 item 6 says Remix APIs appear in "the Remix refresh strategy". Applied: no file under `src/` imports `remix`; `refresh-remix.ts` receives what it needs through `configureCommerce` options (owned by `05-commerce.md`).
10. **D-054 item 1 lists "refresh strategies" inside the Ripple runtime, while ledger 5.1 places `refresh-*.ts` under `src/commerce/`.** Applied: the tree wins; refresh strategies are L5 and are absent from `ripple.elements.js`.
11. **`liquidjs` in a published entry.** `src/testing/liquid-shim.ts` ships in `<pkg>/testing`, and Ben's decision 3 forbids further runtime dependencies. Applied: `liquidjs` and `parse5` are bundled into the Node entries at build time and are not `dependencies`.
12. **`sideEffects`.** The research draft marks all of `dist/commerce/*.mjs` as side-effectful; with code splitting the shared chunks carry the stateful modules. Applied: `dist/chunks/*.mjs` added; commerce limited to `index.mjs` and `rp-*.mjs`.
13. **Node versions.** Not in the ledger. Applied: repository `>=22.18`, package `engines.node >=20.18` (research draft), Remix tiers need Node `>=24.3.0` per `remix@3.3.0`.
14. **Tooling pins.** The ledger pins only UI SDK and the Hydrogen range. Applied: exact pins for every devDependency from the versions the spikes ran (section 9); `license` is a placeholder (`MIT`) pending Ben.
15. **`VERSION` and `BIN_NAME` in `src/identity.ts`.** The ledger names only `PKG_NAME`. Applied: `BIN_NAME` (from the research report) and `VERSION` added so that the generated manifest has one source.
16. **Double-loading rule.** "A page loads exactly one of `ripple.js`, `ripple.elements.js`, or bundled `<pkg>/elements`" needs a checker rule id; none exists in D-059. Left for `07-manifest-registry-cli.md` to assign.
