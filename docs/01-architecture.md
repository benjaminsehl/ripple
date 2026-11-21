# 01 - Architecture

Status: normative. Subordinate to `00-decisions.md` (the ledger). Date: 2026-11-21.

This document owns: render hosts and commerce backends as a system, the layers and the import rules between them, the page lifecycle (server render, upgrade, interaction, refresh), the repository layout, the published package and its export map, pinned versions, and the browser support floor.

It does NOT own (follow the link, do not restate):

| Topic | Owner |
|---|---|
| Contract rules, ids, state and hook attributes, canonicalisation, fixtures | `02-html-contract.md` |
| Cascade layers, tokens, `props.css`, component CSS rules, feature gating in CSS | `03-styling-and-tokens.md` |
| Runtime internals, `rp-*` authoring, lazy chunk loading mechanism, the Rollup build of the browser files, polyfill, events | `04-elements.md` |
| Adapter, `CommerceOptions`, cart store, dialects, refresh strategies, commerce elements, `rp-view-event`, resource types | `05-commerce.md` |
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
| `html` | any server, by hand or template | `hydrogen` | `createCartServerHandlers()` registered with `handleShopifyRoutes`, which serves `/api/cart` (D-041 item 1) | fetch the document, replace `[data-rp-region]` elements |
| `react` | React 19 server render + hydration | `hydrogen` | same | cart regions: React re-renders from store state; reasons `variant` and `filter`: the app-supplied `navigate(url, { replace })`, or `location.assign(url)` without it; `useRegionHtml` for reasons `predictive` and `recommendations` (D-090) |
| `remix` | Remix 3 server components | `hydrogen` | same | the `html` strategy by default; `reloadFrames` and `navigate` are opt-in `configureCommerce` options (D-090) |
| `liquid` | Shopify Liquid (`{% block %}`, `{% partial %}`) | `liquid` | Hydrogen default handler through Shopify Standard Actions | `@shopify/partial-rendering` (`partials.fetch` / `partials.apply`) |

A host other than these four MUST NOT be added in V1. No code outside `src/commerce/adapter-hydrogen.ts`, `src/commerce/adapter-liquid.ts` and the four `src/commerce/refresh-<host>.ts` files may branch on the host or the backend (D-042). The full strategy table (four hosts by three reason groups) is in section 3.5.

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
  |  L7 scaffolded CSS   layers: ui-sdk, theme, base, rp(tokens, base, components, props), ...    |
  |  ---------------------------------------------------------------------------------------------|
  |  L6 host libraries   <pkg>/react (useElement, useCart, useRegionHtml)   <pkg>/remix (types)   |
  |                      <pkg>/agent (opt-in)                                                     |
  |  L5 commerce         rp-cart rp-product-form rp-live rp-predictive-search rp-recommendations  |
  |                      rp-view-event (infrastructure element, D-089)                            |
  |                      getCommerce() -> adapter-hydrogen | adapter-liquid -> refresh-<host>     |
  |  L4 elements         rp-dialog rp-carousel rp-quantity rp-navigation-menu                     |
  |                      lazy chunks: tabs, tooltip, toast, shared, agent                         |
  |  L3 runtime          lazy loader, Invoker Commands polyfill, opener listener, announcer       |
  |  L2 core helpers     rv, cx, imageUrl, imageSrcSet, Responsive and resource types             |
  |  ---------------------------------------------------------------------------------------------|
  |  L1 external         @ui-sdk/core + @ui-sdk/web (kernel)      @shopify/hydrogen (cart store)  |
  |  L0 platform         DOM, <dialog>, popover, <details>, forms, History API                    |
  |                      liquid only: Shopify.actions, @shopify/partial-rendering,                |
  |                                   @shopify/standard-events                                    |
  +-----------------------------------------------------------------------------------------------+
                         |  form posts / fetch                      ^ region HTML
                         v                                          |
  +-----------------------------------------------------------------------------------------------+
  | COMMERCE BACKEND   hydrogen: /api/cart (createCartServerHandlers) -> Storefront API (mock.shop)|
  |                    liquid:   Standard Actions -> Shopify theme runtime; partial rendering     |
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
| L5 | Commerce | `src/commerce/` | browser | `<pkg>/commerce`, `<pkg>/commerce/<tag>`, `browser/ripple.js`, `registry/liquid/assets/ripple.js` | no |
| L6 | Host libraries | `src/react/`, `src/remix/`, `src/agent/` | browser and Node (`react`, `remix`); browser (`agent`) | `<pkg>/react`, `<pkg>/remix`, `<pkg>/agent`, `browser/ripple-agent.js`, `browser/ripple.elements-agent.js` | no |
| L7 | Scaffolded code | `css/`, `components/`, `blueprints/`, `icons/`, `locales/`, `skills/` | server (bindings) and browser (CSS) | `registry/`, `css/`, `skills/` copied into the project by the CLI | yes |
| T | Tooling | `src/gen/`, `src/check/`, `src/cli/`, `src/testing/` | Node only | `<pkg>/check`, `<pkg>/testing`, `bin/ripple.mjs` | no |

Layers L2 to L6 and T are **library** code; L7 is **scaffolded** code (D-053).

### 2.1 What each layer is responsible for

- **L2 Core helpers.** Pure functions and types: `rv()`, `cx()`, `imageUrl()`, `imageSrcSet()`, the type `Responsive`, the resource types (`RippleProduct`, `RippleVariant`, `RippleLine`, `RippleCart`, `RippleImage`, `RippleMoney`, `RippleCollection`, `RippleArticle`, `RippleMenu`, `RippleShop`, and the further `Ripple*` data types that `05-commerce.md` section 11 defines, D-094), and the manifest loader. Prop types are NOT here: they are generated into each binding file (D-035). `src/types.ts` also holds the tooling types `Manifest` and `ComputedLock`, which `src/check/**` and `src/cli/**` share. L2 MUST have no side effects at import, MUST NOT touch `window`, `document` or `customElements` at module top level, and MUST NOT import any npm package.
- **L3 Runtime.** Code that runs once per page: the lazy chunk loader (`loader.ts`), the Invoker Commands polyfill (`commands-polyfill.ts`), the document-level opener listener (`opener.ts`, D-009), the announcer (`announcer.ts`, which exports Ripple's `announce(text, { from })`, D-079). The runtime owns exactly two globals, `window.rpRuntime` and `window.rpCommandsPolyfill` (D-078). `src/runtime/element.ts` MUST NOT exist on the default path; it is created only if SPIKE-04 fails (see section 9).
- **L4 Elements.** One file per custom element: the four non-commerce `rp-*` elements and the three lazy chunk entries for the UI SDK families (`ui-tabs.ts`, `ui-tooltip.ts`, `ui-toast.ts`). `src/elements/index.ts` starts the runtime, defines the four `rp-*` elements, registers the three lazy chunks (`tabs` and `tooltip` by tag; `toast` WITHOUT a tag, D-083), and exports `toast` and `announce`. In the browser files the lazy chunks are five per main file: `tabs`, `tooltip`, `toast`, `shared` (UI SDK code used by both Tooltip and Toast) and `agent` (D-054 item 2).
- **L5 Commerce.** The adapter (`getCommerce()`, `configureCommerce()`), the two backend adapters, the dialect table, the four refresh strategies, and the five commerce `rp-*` elements. The two backend adapter files also define the infrastructure element `rp-view-event`, which has no file of its own (D-089). `src/commerce/index.ts` queues the commerce start (section 3.3 step 4) and exports `getCommerce` and `configureCommerce`.
- **L6 Host libraries.** `src/react/`: `useElement`, `useCart`, `useRegionHtml` and the generated JSX types `jsx.generated.ts` (D-033, D-096). `src/remix/`: types only (`RestProps`, the generated JSX intrinsic elements in `jsx.generated.ts`); no runtime helpers. `src/remix/**` MUST NOT import `remix` or any `@remix-run/*` module, with one exception: the type-only statement `import type {} from "remix/component"` (Remix is not a declared peer, D-052, D-062, D-077). `src/agent/`: re-export of the UI SDK agent bridge (`createAgent`, `agentTools`, `registerTools` from `@ui-sdk/web/agent`; evidence `uisdk/packages/web/src/agent.ts`).
- **L7 Scaffolded code.** Everything a project owns after install: component CSS, `tokens.css`, `theme.css`, `base.css`, `props.css`, React and Remix bindings and their `<id>.data.ts` helper files, Liquid blocks and snippets, HTML reference files, blueprints, locale entries, skills (D-053).
- **T Tooling.** Generator, package build, checker, CLI, test helpers. Node only.

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
| `src/commerce/refresh-html.ts`, `refresh-react.ts` | `src/commerce/adapter.ts`; L2 files | nothing |
| `src/commerce/refresh-remix.ts` | `src/commerce/adapter.ts`, `refresh-html.ts` (the default Remix strategy IS the `html` strategy, D-090); L2 files | nothing |
| `src/commerce/refresh-liquid.ts` | `src/commerce/adapter.ts`; L2 files | `@shopify/partial-rendering` (dynamic `import()` only) |
| `src/commerce/rp-*.ts` | `src/commerce/adapter.ts`, `dialect.ts`; `src/runtime/**`; L2 files | `@ui-sdk/core`, `@ui-sdk/web` |
| `src/commerce/index.ts` | `src/commerce/**`; `src/runtime/**`; L2 files | `@ui-sdk/core`, `@ui-sdk/web` |
| `src/react/**` | `src/react/**`; `src/commerce/adapter.ts`; `src/commerce/refresh-react.ts` (the region-HTML store behind `useRegionHtml`); L2 files | `react`; `@shopify/hydrogen` (types only) |
| `src/remix/**` | `src/remix/**`; L2 files | `remix/component` (types only, and only as the statement `import type {} from "remix/component"`) |
| `src/agent/**` | L2 files | `@ui-sdk/web/agent` |
| `src/testing/**` | `src/testing/**`; L2 files | `parse5`, `liquidjs`, `node:*`; `playwright` (types only) |
| `src/check/**` | `src/check/**`; `src/testing/canonicalize.ts`; L2 files | `parse5`, `node:*`; `playwright` and `@shopify/theme-check-node` (dynamic `import()` only) |
| `src/cli/**` | `src/cli/**`; `src/check/**`; `src/gen/props-css.ts`, `src/gen/theme-css.ts`, `src/gen/tokens-source.ts` (the CLI regenerates `props.css` and `theme.css` in a project, D-029); L2 files | `node:*` |
| `src/gen/**` | `src/gen/**`; `src/testing/**`; `src/check/**`; `src/cli/**` (trailers and the Liquid composite stylesheet, used by the registry build); L2 files | `parse5`, `liquidjs`, `esbuild`, `typescript`, `rollup`, `@rollup/plugin-node-resolve`, `@rollup/plugin-terser`, `lightningcss`, `node:*` |
| `components/<id>/react/<id>.tsx` (scaffolded) | sibling component bindings as `./<other id>`; its own `./<id>.data` | `<pkg>`, `<pkg>/react`, `react`; from `@shopify/hydrogen` only the seven functions of rule 4 |
| `components/<id>/remix/<id>.tsx` (scaffolded) | sibling component bindings as `./<other id>.tsx`; its own `./<id>.data.ts` | `<pkg>`, `<pkg>/remix`, `remix` (only the subpaths `06-bindings.md` allows); from `@shopify/hydrogen` only the seven functions of rule 4 |
| `components/<id>/{react,remix}/<id>.data.ts` (scaffolded) | nothing | `<pkg>` (types and helpers); from `@shopify/hydrogen` only the seven functions of rule 4, plus `import type` |
| `blueprints/<id>/<host>/**` (scaffolded) | scaffolded bindings through the specifier `@components/<id>` (rewritten by the CLI at install, D-096) | as the host's binding row; plus `<pkg>/elements` and `<pkg>/commerce` in client entries only; plus `@shopify/hydrogen` in server files (server handlers, script tags, D-041, D-088) |

Rules that the table implies, stated outright:

1. Library code (`src/**`) MUST NOT import anything under `components/`, `blueprints/`, `css/`, `icons/`, `locales/`, `skills/`, `guides/`, `examples/`, `evals/` or `test/`. Exception: `src/gen/**`, `src/cli/**`, `src/check/**` and `src/testing/**` READ those directories as data with `node:fs`; they MUST NOT `import` from them.
2. `src/elements/**` MUST NOT import `src/commerce/**`, `@shopify/hydrogen`, or `react`. This is what makes `browser/ripple.elements.js` free of Hydrogen and of every refresh strategy.
3. `src/commerce/**` MUST NOT import `src/elements/**`. A commerce component that needs a dialog (CartDrawer) composes the `rp-dialog` element in markup; the two elements communicate through the DOM (D-019 item 3), never through an import.
4. `@shopify/hydrogen` value imports:
   - Inside `src/`: a value import of `@shopify/hydrogen` MUST appear only in `src/commerce/adapter-hydrogen.ts` and `src/commerce/adapter-liquid.ts` (D-062 item 4). Every other file under `src/` uses `import type`.
   - Scaffolded TSX bindings and `<id>.data.ts` files (under `components/`) MAY value-import from `@shopify/hydrogen` exactly these seven pure functions and nothing else (D-094 item 3): `formatMoney`, `renderShopPayButton`, `buildProductSelectionSearchParams`, `parseCollectionParams`, `serializeCollectionParams`, `isFilterInputActive`, `getFilterRemovalUrl`. Test A-15 enforces this list.
   - Blueprint server files MAY import the Hydrogen server API (`createCartServerHandlers`, `handleShopifyRoutes`, `renderShopifyScriptTags`; D-041 item 1, D-088).
   - Every other use of Hydrogen stays behind the adapter (D-042).
5. `@shopify/partial-rendering`, `@shopify/standard-actions` and `@shopify/standard-events` are platform-provided specifiers, not npm packages (D-046). They MUST appear only in the two files named in the table, only as the argument of a dynamic `import()` inside `try`/`catch`, and MUST NOT appear in any `package.json`.
6. `@ui-sdk/react`, `@ui-sdk/core/web.css`, any `@ui-sdk/core/internal/*` path, the upstream autoloader, `@remix-run/ui`, and `@shopify/hydrogen/react` MUST NOT be imported by any file in the repository except under `docs/research/` (D-022, D-033, D-034).
7. The only `@ui-sdk/web/<entry>` subpaths that may be imported are `tabs`, `tooltip`, `toast`, `agent` (D-022 item 4).
8. `src/react/**` MUST import the commerce accessor from `src/commerce/adapter.ts`, never from `src/commerce/index.ts` (which queues the commerce start).
9. No file under `src/` may read the string `ripple-kit`; the package name is read from `PKG_NAME` in `src/identity.ts` (section 6.3).
10. Tooling (`src/gen`, `src/check`, `src/cli`, `src/testing`) MUST NOT import `src/runtime`, `src/elements`, `src/commerce`, `src/react`, `src/remix` or `src/agent`.
11. `src/check/**` MUST NOT import `src/cli/**` (D-077, D-102 item 7). The types both need (`Manifest`, `ComputedLock`) live in `src/types.ts`; the CLI command passes `host` and the computed lock to `check()`.
12. `src/remix/**` MAY contain the type-only statement `import type {} from "remix/component"` and nothing else from `remix` (D-062 item 6, D-077). It loads Remix's global `JSX` namespace for type-checking and is erased from the JavaScript output. No other file under `src/` may name `remix` in an import.
13. Inside `src/elements/**` and `src/commerce/**`, `announce` MUST be imported from `src/runtime/announcer.ts`, never from `@ui-sdk/core` (D-019 item 5, D-079). Only `src/runtime/announcer.ts` imports `announce` from `@ui-sdk/core`.
14. A scaffolded binding file MUST NOT import `<pkg>/elements` or `<pkg>/commerce` and MUST NOT re-export a library function (D-096 item 3). Blueprint files MUST NOT import components from `<pkg>/react` or `<pkg>/remix`: components are scaffolded files, not package exports (D-096 item 4).

The rule set for `src/**` is also given as data so that test A-03 can enforce it. `src/architecture.test.ts` MUST contain this object verbatim and check every `import` / `export from` / `import()` specifier in `src/**/*.ts` (excluding `*.test.ts`) against it:

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
  "src/commerce/refresh-{html,react}.ts": ["./src/commerce/adapter.ts", "./src/{identity,index,responsive,image,types}.ts"],
  "src/commerce/refresh-remix.ts": ["./src/commerce/{adapter,refresh-html}.ts", "./src/{identity,index,responsive,image,types}.ts"],
  "src/commerce/refresh-liquid.ts": ["./src/commerce/adapter.ts", "./src/{identity,index,responsive,image,types}.ts", "@shopify/partial-rendering"],
  "src/commerce/rp-*.ts": ["./src/commerce/{adapter,dialect}.ts", "./src/runtime/**", "./src/{identity,index,responsive,image,types}.ts", "@ui-sdk/core", "@ui-sdk/web"],
  "src/commerce/index.ts": ["./src/commerce/**", "./src/runtime/**", "./src/{identity,index,responsive,image,types}.ts", "@ui-sdk/core", "@ui-sdk/web"],
  "src/react/**": ["./src/react/**", "./src/commerce/{adapter,refresh-react}.ts", "./src/{identity,index,responsive,image,types}.ts", "react", "@shopify/hydrogen (type)"],
  "src/remix/**": ["./src/remix/**", "./src/{identity,index,responsive,image,types}.ts", "remix/component (type)"],
  "src/agent/**": ["./src/{identity,index,responsive,image,types}.ts", "@ui-sdk/web/agent"],
  "src/testing/**": ["./src/testing/**", "./src/{identity,index,responsive,image,types}.ts", "parse5", "liquidjs", "node:*", "playwright (type)"],
  "src/check/**": ["./src/check/**", "./src/testing/canonicalize.ts", "./src/{identity,index,responsive,image,types}.ts", "parse5", "node:*", "playwright", "@shopify/theme-check-node"],
  "src/cli/**": ["./src/cli/**", "./src/check/**", "./src/gen/{props-css,theme-css,tokens-source}.ts", "./src/{identity,index,responsive,image,types}.ts", "node:*"],
  "src/gen/**": ["./src/gen/**", "./src/testing/**", "./src/check/**", "./src/cli/**", "./src/{identity,index,responsive,image,types}.ts", "parse5", "liquidjs", "esbuild", "typescript", "rollup", "@rollup/plugin-node-resolve", "@rollup/plugin-terser", "lightningcss", "node:*"]
};
```

How test A-03 reads the object:

1. When several keys match a file, the FIRST matching key in the order above applies. A file under `src/` that matches no key is an error.
2. A relative specifier is resolved against the importing file and compared as a repo-root-relative path. It may be written with or without the `.ts` extension (section 5.2); the test adds `.ts` when the extension is missing, and tries `<path>/index.ts` when `<path>.ts` does not exist.
3. JSON files under `src/gen/` (`elements.json`, `schema/*.json`, `liquid-core/*`) are read with `node:fs`, never imported.
4. The "(dynamic `import()` only)" cells of the table are enforced by a second check in the same test: the specifiers `@shopify/partial-rendering`, `@shopify/standard-actions`, `@shopify/standard-events`, and in `src/check/**` the specifiers `playwright` and `@shopify/theme-check-node`, MUST occur only as the argument of `import()`.
5. Because `src/gen/props-css.ts`, `src/gen/theme-css.ts` and `src/gen/tokens-source.ts` are bundled into the CLI, those three files MUST import nothing except each other, L2 files and `node:*` (checked by the same test).

### 2.3 Where each external API is touched

This table is the blast radius of each beta or peer dependency (D-062). An API not in the "Symbols" column is not confirmed by this document; the owning doc confirms the rest.

| Dependency | Symbols confirmed in source | Evidence | Allowed in |
|---|---|---|---|
| `@ui-sdk/core` | `definePrimitive`, `announce` | `uisdk/packages/core/src/index.ts` (lines 3, 167) | `definePrimitive`: `src/elements`, `src/commerce/rp-*.ts`. `announce`: `src/runtime/announcer.ts` only (rule 13). Other kernel symbols: `src/runtime`, `src/elements`, `src/commerce/rp-*.ts`, `src/commerce/index.ts` |
| `@ui-sdk/web` | `createParts`, `toast` | `uisdk/packages/web/src/index.ts` (line 4), `uisdk/packages/web/src/define-element.ts` | `src/elements`, `src/commerce/rp-*.ts`, `src/commerce/index.ts` |
| `@ui-sdk/web/tabs`, `/tooltip`, `/toast` | element-defining entries | `uisdk/packages/web/package.json` (`exports`), `uisdk/packages/web/src/entries/` | the matching `src/elements/ui-*.ts` only |
| `@ui-sdk/web/agent` | `createAgent`, `agentTools`, `registerTools` | `uisdk/packages/web/src/agent.ts` | `src/agent` only |
| `@ui-sdk/core/testing` | `checkPattern` | `uisdk/packages/core/src/testing.ts`; exact signature owned by `13-testing.md` | test files only (`*.test.ts`, `test/**`) |
| `@shopify/hydrogen`, client | `createCartStore`, `configureCartEndpoint`, `initializeShopifyScripts`, `trackCartAnalytics` | `hydrogen/packages/hydrogen/src/core/index.ts` (lines 83, 111, 112, 172); use owned by `05-commerce.md` section 3 | `src/commerce/adapter-hydrogen.ts`, `src/commerce/adapter-liquid.ts` only |
| `@shopify/hydrogen`, server | `createCartServerHandlers`, `handleShopifyRoutes`, `renderShopifyScriptTags`, `getCart`, `getCartId` | `hydrogen/packages/hydrogen/src/core/index.ts` (lines 29, 128, 173) | blueprint server files and app code |
| `@shopify/hydrogen`, pure functions (D-094) | `formatMoney`, `renderShopPayButton`, `buildProductSelectionSearchParams`, `parseCollectionParams`, `serializeCollectionParams`, `isFilterInputActive`, `getFilterRemovalUrl` | `hydrogen/packages/hydrogen/src/core/index.ts` (lines 207, 208, 211, 213, 232, 256, 299) | scaffolded `react` / `remix` bindings and `<id>.data.ts` files |
| `Shopify.actions.*` (global), `@shopify/standard-actions` | UNVERIFIED against the real runtime (SPIKE-01) | `ripple/docs/research/hydrogen-core.md`; types in `hydrogen/packages/hydrogen/vendor/standard-actions.d.ts` | `src/commerce/adapter-liquid.ts` only |
| `@shopify/standard-events` | `createViewEventElement`, `PageViewEvent` (types read; not run; that the class can be registered as `rp-view-event` is UNVERIFIED, SPIKE-01) | `hydrogen/packages/hydrogen/vendor/standard-events.d.ts` (lines 672, 1159) | `src/commerce/adapter-liquid.ts` only (D-089) |
| `@shopify/partial-rendering` | `partials.fetch`, `partials.apply` (UNVERIFIED against a preview store, SPIKE-02) | `ripple/docs/research/liquid-blocks-partials.md`; `ripple/theme/AGENTS.md` | `src/commerce/refresh-liquid.ts` only |
| `react` | React 19 public API | `ripple/docs/research/react-and-custom-elements.md` | `src/react`, scaffolded React bindings |
| `remix` | Remix 3 component API | `ripple/docs/research/remix-3.md` | scaffolded Remix bindings and blueprints; in `src/` only the type-only statement of rule 12 |

`rp-view-event` is an infrastructure element (D-089): it belongs to no component, has no class and no `data-slot`, and is not built on the kernel. It is defined in exactly two places: `src/commerce/adapter-hydrogen.ts` (hydrogen backend) and `src/commerce/adapter-liquid.ts` (`customElements.define("rp-view-event", createViewEventElement())`). It is therefore present in `ripple.js` and absent from `ripple.elements.js`. Only blueprints print it.

---

## 3. Lifecycle of a page

The five phases below apply to every host. Details of each phase are owned by the linked document; the order and the guarantees are owned here.

### 3.1 Phase 1: server render

1. The host's binding prints the HTML contract of each component (I-1). No host generates ids (D-020).
2. The document `<head>` loads CSS before any content: `ripple.css` (or the project's CSS entry that imports it first). CSS delivery per host: D-055; details in `03-styling-and-tokens.md`.
3. The document loads the JavaScript as `<script type="module">` (deferred by definition). JavaScript delivery per host:

| Host | What the page loads, in this order | Where the files come from |
|---|---|---|
| `liquid` | `{% render 'rp-head' %}` in `layout/theme.liquid`, placed after the import map and before `{{ content_for_header }}`. `rp-head` prints exactly (D-054 item 7): (1) the stylesheet tag for `assets/ripple.css`; (2) `{% render 'rp-tokens' %}`; (3) the config element `<script type="application/json" id="rp-commerce">` (D-087); (4) the inline Invoker Commands polyfill, byte-identical to the output generated from `src/runtime/commands-polyfill.ts`; (5) `<script type="module" src="{{ 'ripple.js' \| asset_url }}">`. Cross-file imports are the six bare specifiers `ripple`, `ripple/tabs`, `ripple/tooltip`, `ripple/toast`, `ripple/shared`, `ripple/agent`, resolved by the six entries that `snippets/rp-import-map-entries.liquid` adds to the theme's single import map. The platform provides `window.Shopify.actions`; Ripple prints nothing for it (D-088). | `registry/liquid/assets/` (bare-specifier build, six files) |
| `html` | In `<head>`: (1) the Hydrogen script tags (the output of `renderShopifyScriptTags`, D-088); (2) the config element `<script type="application/json" id="rp-commerce">`, printed by the `layout` blueprint (D-087 item 3; the alternative, a `configureCommerce(options)` call, is specified in `05-commerce.md` section 4); (3) `<script type="module" src="/ripple/ripple.js">`. A page with no commerce element MAY load `ripple.elements.js` instead; it then prints neither (1) nor (2). | `browser/` (relative-import build). `ripple init` copies the six files of the `ripple.js` set to `paths.public` (default `public/ripple/`). The `ripple.elements.js` set is never copied by the CLI: link it from `node_modules/<pkg>/browser/` or copy it by hand (D-054 item 4). |
| `remix` | The same three items as `html`, in the same order. `ripple.js` is served from `public/ripple/`, never through the Remix asset server (D-034 item 5). | `browser/`, copied by `ripple init` |
| `react` | In `<head>`: the Hydrogen script tags (`renderShopifyScriptTags`), then the config element (the alternative is a `configureCommerce(options)` call in the client entry, in the same module evaluation as the two imports; `05-commerce.md` section 4). The app's client entry contains `import "<pkg>/elements"; import "<pkg>/commerce";` exactly once each. | `dist/`, bundled by the app's bundler |

Every page on the hydrogen backend MUST print the Hydrogen script tags in `<head>` before the module script, because the cart store routes mutations through `Shopify.actions.updateCart` on both backends (D-041 item 1, D-088 item 2). Every page that contains a commerce element MUST have commerce configuration: the config element or a `configureCommerce` call (checker RP309).

The exact `rp-head` snippet and import map entries are owned by `14-liquid-theme.md`; the `ripple init` copy targets by `07-manifest-registry-cli.md`; the script-tag call and the server wiring by `05-commerce.md` section 10.

### 3.2 Phase 2: pre-upgrade (also the permanent state when JavaScript never runs)

1. The page is fully usable at the level each component declares in `noJs.level` (D-005).
2. `base.css` gives every `ui-*` and `rp-*` tag its final `display` value and applies the `data-rp-js` visibility rules (D-021), so that phase 3 causes no layout shift. Every `rp-*` tag, including `rp-view-event`, is `display: block` (D-080); `rp-dialog` is additionally `position: absolute; inline-size: 0; block-size: 0`. `ui-*` tags keep the display value UI SDK gives them. The values are data: manifest key `elements.<tag>.display`, source `src/gen/elements.json`. Component CSS MUST NOT set `display: contents` or `display: none` on a custom element root.
3. Native behaviour is live: `<dialog>` with Invoker Commands (or the inline polyfill on Liquid), `popover`, `<details>`, forms, links.

### 3.3 Phase 3: upgrade

Order of execution inside the main bundle (the bodies are owned by `04-elements.md` and `05-commerce.md`; the order is fixed here):

1. Runtime start (`src/runtime/index.ts`), at most once per page (guard: `window.rpRuntime`, D-078): install the Invoker Commands polyfill if `"commandForElement" in HTMLButtonElement.prototype` is false and `window.rpCommandsPolyfill` is not already set by the inline Liquid copy; install the single document-level `click` listener for `[data-rp-open]`; create the announcer.
2. Define the non-commerce `rp-*` elements: `rp-dialog`, `rp-carousel`, `rp-quantity`, `rp-navigation-menu`.
3. Register lazy chunks (D-054 item 2). The runtime imports the `tabs` chunk when a `ui-tabs` element, and the `tooltip` chunk when a `ui-tooltip` element, is in the document at `DOMContentLoaded` or is inserted later. The `toast` chunk is imported on the first `toast()` call only; a `ui-toast-region` in the document does NOT trigger a load (D-083). The `shared` chunk is never requested by the runtime: the `tooltip` and `toast` chunks import it statically. The `agent` chunk is imported only by a `loadAgent()` call.
4. Commerce start (`ripple.js` and `<pkg>/commerce` only). The start is lazy by one microtask, so that a `configureCommerce(options)` call made in the same task still applies (D-042, D-087; the exact trigger and sequence are owned by `05-commerce.md` section 4.5). In this order:
   1. Resolve the options from `configureCommerce` and from the config element `#rp-commerce`.
   2. Feature-test the platform: `typeof AbortSignal.any === "function"`, `typeof crypto.randomUUID === "function"`; on Liquid also Standard Actions. If a test fails, or creating the adapter throws: `usable = false`, define NO commerce element, and stop (I-4). This is the SYNCHRONOUS failure.
   3. Create the adapter and the one cart store.
   4. Define `rp-cart`, `rp-product-form`, `rp-live`, `rp-predictive-search`, `rp-recommendations`. The backend adapter file defines `rp-view-event` (D-089).
   5. Read the cart for the first time. If this read fails, the failure is ASYNCHRONOUS: the elements are already defined and the `data-rp-js="fallback"` controls are already hidden by CSS. `usable` becomes `false`, the elements stay defined, and their controllers submit natively through the hidden fallback button (D-041 amended, D-088 item 3).
5. Nothing in steps 1 to 4 may write inside a component root except allow-listed entries (I-2).

A failure (thrown error) in step 4 MUST NOT prevent steps 1 to 3 from having completed, and a failure in the import of a lazy chunk MUST NOT affect any other element. Each of steps 1, 2, 3, 4 is wrapped in its own `try`/`catch` that logs with `console.error` and continues.

On a server (`typeof document === "undefined"`) steps 1 to 4 do nothing (D-054 item 5).

### 3.4 Phase 4: interaction

1. Non-commerce elements reflect state with the attributes of D-021 and dispatch the events of D-023 on their root.
2. Commerce elements call only `getCommerce()` methods. During a mutation they set `data-pending=""` and `aria-busy="true"`; they never create, remove or reorder markup outside React (D-045).
3. React reads the store through `useCart` from `<pkg>/react`; other hosts listen to DOM events.

### 3.5 Phase 5: region refresh

1. An element (or user code) calls `getCommerce().refresh(regions, { url, reason })`. `reason` is one of `cart`, `variant`, `filter`, `predictive`, `recommendations`, `manual` (D-090).
2. The adapter dispatches `rp:refresh` on `document` (cancelable). If not cancelled, it runs the host strategy from `src/commerce/refresh-<host>.ts`, then dispatches `rp:refreshed` (D-023, D-046).
3. The strategy per host (D-090 item 2; the code is owned by `05-commerce.md` section 8.3):

| Host | No `url` (reasons `cart`, `manual`) | Reasons `variant`, `filter` | Reasons `predictive`, `recommendations` |
|---|---|---|---|
| `liquid` | `partials.fetch` / `partials.apply` for the named partials; on failure `location.reload()` | the same with `url`; on failure `location.assign(url)` | the same with `url`; on failure nothing |
| `html` | fetch the current URL and replace each `[data-rp-region]`; on failure `location.reload()` | fetch `url` and replace; on failure `location.assign(url)` | fetch `url` and replace; on failure nothing |
| `remix` | `reloadFrames(regions, null)` when that option is configured; otherwise the `html` strategy | `navigate(url, { replace })` when that option is configured; otherwise the `html` strategy | the `html` strategy; on failure nothing |
| `react` | nothing: React renders cart regions from the store | `navigate(url, { replace })` when configured; otherwise `location.assign(url)` | fetch `url`, take the inner HTML of the same-named region, publish it to `useRegionHtml(name)`; on failure nothing |

   One-line summary per host: `liquid` uses partial rendering; `html` fetches the document and swaps regions; `remix` is `html` unless the app opts in to `reloadFrames` / `navigate` (SPIKE-11); `react` re-renders from the store and uses `useRegionHtml` for fetched regions (SPIKE-10).
4. A refresh REPLACES DOM (except on `react` with no `url`, where React re-renders). Elements survive because they hold no descendant references (D-019 item 3); a `ui-*` root is replaced whole or left untouched (D-022 item 5).
5. A failed strategy falls back to navigation (`location.assign(url)` or `location.reload()`) for the first two columns. Reasons `predictive` and `recommendations` NEVER fall back to navigation (D-090 item 3).
6. On Remix a region is a plain element with `data-rp-region`, as in `html` and `react`. A named blocking `<Frame>` is an opt-in; no blueprint uses one (D-034 item 4, D-090 item 5).

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
                       host strategy replaces [data-rp-region] markup (react: React re-renders);
                       rp:refreshed fires; announce(text, { from })
```

---

## 4. Repository layout

The tree in `00-decisions.md` section 5.1 is the complete tree, and the lists below MUST equal it. The tables give every directory, its purpose, whether its content is hand-written (H), generated and committed (G), or build output that is not committed (B), and its owning document. A top-level directory or root file not in these tables MUST NOT be created (exceptions: `.git/`, `.gitignore`, `node_modules/`).

### 4.1 Root files

| Path | Kind | Purpose |
|---|---|---|
| `package.json` | H | Private development manifest (section 5.1). It is NOT the published manifest. |
| `pnpm-lock.yaml` | G | Lockfile; committed. |
| `tsconfig.json` | H | TypeScript configuration (section 5.2). |
| `size-budget.json` | H | Budgets of D-064; format owned by `13-testing.md`. |
| `README.md`, `PLAN.md`, `AGENTS.md`, `LICENSE` | H | Project documents. `AGENTS.md` here is for contributors to Ripple; the section generated into projects is owned by `08-agent-kit-and-evals.md`. |
| `.github/` | H | `workflows/ci.yml` and `workflows/nightly.yml` (D-103; content owned by `13-testing.md`). |
| `.gitignore` | H | MUST contain exactly the lines `node_modules/`, `pkg/`, `evals/runs/`. |

### 4.2 Directories

| Path | Kind | Purpose | Owner |
|---|---|---|---|
| `bin/` | H | `ripple.mjs`: a wrapper whose whole body is `#!/usr/bin/env node` followed by `import "../dist/cli/index.mjs";`. It is copied unchanged to `pkg/bin/`; it resolves only inside `pkg/`. | 07 |
| `docs/` | H | The specification: `00-decisions.md` to `14-liquid-theme.md`. NOT shipped. Do not confuse with the package's `docs/` (section 6.1), which is generated. | all |
| `docs/research/` | H | The eight research reports and `spikes/`. Read-only history. New spike reports go in `docs/research/spikes/<name>/`. | 00 |
| `theme/` | H | The Shopify base theme. Reference only: never shipped, never edited, never imported. | 00 |
| `src/` | H | All library and tooling TypeScript. Files directly in `src/`: `identity.ts`, `index.ts`, `responsive.ts`, `image.ts`, `types.ts`, `architecture.test.ts`. | this doc |
| `src/runtime/` | H | L3. `index.ts` (start), `loader.ts` (lazy chunks), `commands-polyfill.ts`, `opener.ts`, `announcer.ts`. `element.ts` exists only on the SPIKE-04 fallback path. | 04 |
| `src/elements/` | H | L4. `index.ts`, `rp-dialog.ts`, `rp-carousel.ts`, `rp-quantity.ts`, `rp-navigation-menu.ts`, `ui-tabs.ts`, `ui-tooltip.ts`, `ui-toast.ts`. | 04 |
| `src/commerce/` | H | L5. `index.ts`, `adapter.ts`, `adapter-hydrogen.ts`, `adapter-liquid.ts`, `dialect.ts`, `refresh-html.ts`, `refresh-liquid.ts`, `refresh-remix.ts`, `refresh-react.ts`, `rp-cart.ts`, `rp-product-form.ts`, `rp-live.ts`, `rp-predictive-search.ts`, `rp-recommendations.ts`. The two backend adapter files also define `rp-view-event`. | 05 |
| `src/react/` | H + G | L6. Hand-written: `index.ts`, `use-element.ts`, `hooks.ts`. Generated and committed: `jsx.generated.ts`. | 06 |
| `src/remix/` | H + G | L6. Hand-written: `index.ts`. Generated and committed: `jsx.generated.ts`. | 06 |
| `src/agent/` | H | L6. `index.ts`. | 08 |
| `src/testing/` | H | T. `index.ts`, `canonicalize.ts`, `fixtures.ts`, `resources.ts`, `upgrade-diff.ts`, `liquid-shim.ts`, `serve-theme.ts`. | 02 (`canonicalize.ts`), 13 |
| `src/check/` | H | T. `index.ts`, `engine.ts`, `report.ts`, `liquid-calls.ts`, `flows.ts`, `rules/<RULE>.ts` (one file per rule id) and `rules/index.ts` (the array of all rules). | 07 |
| `src/cli/` | H | T. `index.ts`, `detect-host.ts`, `trailer.ts`, `merge3.ts`, `plan.ts`, `diff.ts`, `composite.ts`, `config.ts`, `base.ts`, `commands/<command>.ts` (`init`, `add`, `diff`, `upgrade`, `remove`, `status`, `check`, `docs`, `manifest`, `skills`). | 07 |
| `src/gen/` | H | T. The generator: `index.ts`, `html.ts`, `liquid.ts`, `react.ts`, `remix.ts`, `types.ts`, `props-css.ts`, `theme-css.ts`, `display-css.ts`, `tokens-source.ts`, `css-lint.ts`, `size.ts`, `docs.ts`, `registry.ts`, `agents-md.ts`. The package build: `build.ts` (section 7) and `browser-bundles.ts` (the Rollup build of the browser files, `04-elements.md` section 6). Data: `elements.json` (source of the manifest key `elements`), `schema/` (sources of `manifest.schema.json`, `fixture.schema.json`, `config.schema.json`), `liquid-core/` (sources of the Liquid infrastructure files). | 07; `build.ts` this doc; `browser-bundles.ts` 04; `tokens-source.ts`, `css-lint.ts` 03; `size.ts` 13 |
| `css/` | H + G | Global CSS sources. Hand-written: `layers.css`, `tokens.css`, `base.css` (`base.css` has two generated marker regions, `display` and `script-state`). Generated and committed: `theme.css`, `props.css`. | 03 |
| `icons/` | H | `<name>.svg`, one per icon name of ledger section 6.6. | 09 |
| `locales/` | H | `en.default.json`: the source of every `ripple.*` string (`ripple.<component id>.<key>`, `ripple.blueprints.<blueprint id>.<key>`, `ripple.props.*`, `ripple.settings.*`). | 06, 12, 14 |
| `components/<id>/` | H + G | One directory per component (files below). | 07, 09 to 12 |
| `blueprints/<id>/` | H + G | `blueprint.json`, `<id>.test.ts`, and one directory per host: `html/` (G, generated from the blueprint's fixtures, D-101), `react/`, `remix/`, `liquid/` (H). | 12 |
| `skills/<skill>/` | H | `SKILL.md` and `ripple.json` for each of the 14 skills (D-060). No `references/` directory. | 08 |
| `guides/` | H | `<topic>.md`: the 12 hand-written guides; copied to `pkg/docs/guides/`. | 08 |
| `evals/` | H + B | `tasks/T<nn>/`, `adapters/`, `rubric/` (H); `runs/` (B, not committed). Never published. | 08 |
| `examples/` | H | `html/`, `react/`, `remix/`, `liquid/`: one runnable example per host. `liquid/` is the Ripple theme (infrastructure: `14-liquid-theme.md`; layout and templates: `12-components-chrome-and-blueprints.md`, D-099). Each `examples/<host>/.ripple-conformance/` work directory is git-ignored by that example's own `.gitignore`. Never published. | 12, 13, 14 |
| `test/` | H | Cross-cutting tests that are not next to one source file. Files: `run.ts` (the test runner), `run.test.ts`. Directories: `support/`, `fixtures/`, `conformance/`, `upgrade/`, `hydration/`, `nojs/`, `commerce/`, `liquid/`, `a11y/`, `visual/`, `cross-engine/`. | 13 |
| `pkg/` | B | The publishable package, written only by `pnpm build`. Never committed, never edited by hand. | this doc |

Files of one component directory `components/<id>/`:

| Path | Kind | Present |
|---|---|---|
| `<id>.json` | H | always: the manifest entry, the source of truth |
| `<id>.css` | H | always |
| `<id>.test.ts` | H | always |
| `notes.md` | H | optional: hand-written notes appended to the generated component page (D-060) |
| `fixtures/<fixture>.html` | G or snapshot | always: the reference HTML and the fixture source (D-074) |
| `html/<id>.html` | G | always: every fixture, delimited (D-040) |
| `react/<id>.tsx`, `remix/<id>.tsx` | G or H | always; which bindings are generated is decided by D-072 and recorded in the manifest `files.<host>[].generated` flag |
| `react/<id>.data.ts`, `remix/<id>.data.ts` | H | only where the component needs pure data helpers (D-094); a `"use client"` file exports components only |
| `liquid/blocks/<id>.liquid`, `liquid/blocks/<id>-<part>.liquid` | G or H | per the component's Liquid tier (D-037) |
| `liquid/snippets/rp-<id>.liquid` | G or H | when the component has a snippet |
| `liquid/snippets/rp-<id>-<part>.liquid` | H | region-part snippets only (D-091), for example `rp-cart-lines-list.liquid` |

Rules:

1. Unit tests are `<name>.test.ts` next to the source file they test (ledger 4.6). `test/` holds only tests that span components or hosts.
2. The repository is ONE pnpm package, not a pnpm workspace: there MUST NOT be a `pnpm-workspace.yaml`. Each directory under `examples/` and `evals/adapters/` that needs npm packages has its own `package.json` with `"private": true` and depends on the built package as `"<pkg>": "file:../../pkg"` (path adjusted to depth).
3. Generated-and-committed files (kind G) MUST be reproduced byte-for-byte by `pnpm gen`; `pnpm gen --check` fails when they differ (D-003). This includes the generated regions inside hand-written files (D-072).
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
    "typecheck": "tsc --noEmit",
    "examples:install": "pnpm --dir examples/html install && pnpm --dir examples/react install && pnpm --dir examples/remix install",
    "test:run": "esbuild test/run.ts --bundle --platform=node --format=esm --packages=external --log-level=warning --outfile=node_modules/.cache/ripple/test-run.mjs && node node_modules/.cache/ripple/test-run.mjs",
    "test": "pnpm test:run --tiers=1,2,3,4,5,6,10",
    "test:unit": "pnpm test:run --tiers=1",
    "test:conformance": "pnpm test:run --tiers=2",
    "test:upgrade": "pnpm test:run --tiers=3",
    "test:hydration": "pnpm test:run --tiers=4",
    "test:behavior": "pnpm test:run --tiers=5",
    "test:a11y": "pnpm test:run --tiers=5 --files=test/a11y/",
    "test:visual": "pnpm test:run --tiers=5 --files=test/visual/",
    "test:nojs": "pnpm test:run --tiers=6",
    "test:commerce": "pnpm test:run --tiers=7",
    "test:liquid-live": "pnpm test:run --tiers=8",
    "test:webkit": "pnpm test:run --tiers=3,5,6,9 --cross-engine --engine=webkit",
    "test:firefox": "pnpm test:run --tiers=3,5,6,9 --cross-engine --engine=firefox",
    "test:cross-engine": "pnpm test:webkit && pnpm test:firefox",
    "test:size": "pnpm test:run --tiers=10",
    "test:component": "pnpm test:run --tiers=1,2,3,4,5,6",
    "ci": "pnpm typecheck && pnpm gen --check && pnpm build && pnpm examples:install && pnpm test --no-skips",
    "eval": "node evals/adapters/run.ts",
    "release:check": "pnpm gen --release-check"
  },
  "dependencies": {
    "@ui-sdk/core": "0.1.0-beta.14",
    "@ui-sdk/web": "0.1.0-beta.14"
  },
  "devDependencies": {
    "@rollup/plugin-node-resolve": "15.3.0",
    "@rollup/plugin-terser": "0.4.4",
    "@shopify/hydrogen": "2026.10.3",
    "@shopify/theme-check-node": "4.0.2",
    "@tailwindcss/cli": "4.3.5",
    "@types/node": "22.20.5",
    "@types/react": "19.3.0",
    "axe-core": "4.14.1",
    "esbuild": "0.28.2",
    "lightningcss": "1.33.0",
    "liquidjs": "10.30.1",
    "parse5": "8.1.1",
    "playwright": "1.63.0",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "remix": "3.3.0",
    "rollup": "4.24.0",
    "tailwindcss": "4.3.5",
    "typescript": "6.0.3"
  }
}
```

Who owns each script (D-103 item 2):

| Scripts | Owner | What it runs |
|---|---|---|
| `gen`, `build`, `typecheck` | this document | the generator (`07-manifest-registry-cli.md`), the package build (section 7), the type check (section 5.2) |
| `examples:install`, `test:run`, every `test*` script, `ci` | `13-testing.md` section 2.3 | the test runner `test/run.ts`; the text above MUST equal that section |
| `eval` | `08-agent-kit-and-evals.md` section 8 | the eval harness `evals/adapters/run.ts`; not part of `pnpm test` or `pnpm ci` |
| `release:check` | `07-manifest-registry-cli.md` section 11 | the release checklist of that section: `src/gen/index.ts` runs it when it receives the flag `--release-check`, and exits non-zero on the first failed line |

- `pnpm gen --check` and `pnpm gen --release-check` work because pnpm appends extra arguments to the end of the script, so the flag reaches `gen.mjs`.
- Any devDependency added by another document MUST be an exact version (no `^`, no `~`) and MUST be added to the table in section 9.
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
    "allowImportingTsExtensions": true,
    "jsx": "preserve",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["src", "test", "css/**/*.test.ts", "components/**/*.test.ts", "blueprints/**/*.test.ts"],
  "exclude": ["node_modules", "pkg", "theme", "docs", "examples", "evals", "components/**/react", "components/**/remix", "blueprints/**/react", "blueprints/**/remix"]
}
```

- `verbatimModuleSyntax` makes "types only" imports in section 2.2 mechanical: a type-only import MUST be written `import type`.
- Scaffolded TSX (`components/**/react`, `components/**/remix`, `blueprints/**/react`, `blueprints/**/remix`) is type-checked by the conformance harness inside each host's example project, not by the root config, because React and Remix need different JSX settings (`06-bindings.md`).
- Source files import each other by relative path. The specifier MAY be written with the `.ts` extension (`import { rv } from "./responsive.ts"`) or without it (`import { rv } from "./responsive"`); `allowImportingTsExtensions` makes both type-check and esbuild resolves both. Inside one file, use one form.
- `@types/node` types the `node:*` imports of tooling and tests. `@types/react` types `src/react/**`; `src/react/jsx.generated.ts` augments its `ButtonHTMLAttributes` with `commandfor` and `command` (D-033, D-096).

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
    chunks/*.mjs                    # shared code split out by esbuild (section 7 steps 4 and 5)
    testing/index.mjs               # <pkg>/testing   (Node)
    check/index.mjs                 # <pkg>/check     (Node)
    cli/index.mjs                   # the CLI         (Node)
    **/*.d.mts                      # one declaration file next to every entry .mjs above, plus the .d.mts files they reference
  browser/                          # exactly 12 .js files and ripple.css
    ripple.js                       # kernel + runtime + all rp-* elements + commerce layer + rp-view-event + Hydrogen cart subset
    ripple-tabs.js  ripple-tooltip.js  ripple-toast.js  ripple-shared.js  ripple-agent.js
    ripple.elements.js              # kernel + runtime + non-commerce rp-* elements; no commerce, no Hydrogen, no refresh strategy
    ripple.elements-tabs.js  ripple.elements-tooltip.js  ripple.elements-toast.js  ripple.elements-shared.js  ripple.elements-agent.js
    ripple.css                      # layers + tokens + base + props + every component
  css/
    layers.css  tokens.css  theme.css  base.css  props.css
    components/<id>.css
  registry/
    index.json
    css/  react/  remix/  html/
    liquid/blocks/  liquid/snippets/  liquid/assets/  liquid/locales/
    liquid/settings.json
    blueprints/<id>/<host>/
  manifest.json  manifest.schema.json  fixture.schema.json  config.schema.json
  custom-elements.json  html-custom-data.json
  docs/
    INDEX.md  llms.txt  components/<id>.md  guides/<topic>.md  rules/<RULE>.md
  skills/<skill>/SKILL.md  skills/<skill>/ripple.json
```

- The 12 `.js` files of `browser/` are two sets of six (D-054 items 1 and 2). Set `ripple`: `ripple.js`, `ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`, `ripple-shared.js`, `ripple-agent.js`. Set `ripple.elements`: `ripple.elements.js`, `ripple.elements-tabs.js`, `ripple.elements-tooltip.js`, `ripple.elements-toast.js`, `ripple.elements-shared.js`, `ripple.elements-agent.js`. Inside a set, each chunk imports its main file by relative path (`./ripple.js` or `./ripple.elements.js`); the `tooltip` and `toast` chunks also import the set's `shared` chunk. The two sets share no file: a chunk built against `ripple.js` would load a second kernel on a page that uses `ripple.elements.js`.
- `registry/liquid/assets/` holds the Liquid build of the `ripple` set, six files: `ripple.js`, `ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`, `ripple-shared.js`, `ripple-agent.js`. They are the same code as the `ripple` set of `browser/` except that every cross-file import uses one of the six bare specifiers `ripple`, `ripple/tabs`, `ripple/tooltip`, `ripple/toast`, `ripple/shared`, `ripple/agent` instead of a relative path (D-054 item 3). There is no `ripple.elements.js` on Liquid.
- `registry/liquid/settings.json` is the Ripple theme-settings group that the CLI merges into `config/settings_schema.json` (D-098, D-103; content owned by `14-liquid-theme.md` section 6).
- `fixture.schema.json` is the JSON Schema of a fixture record (D-074; owned by `02-html-contract.md` section 11).
- The contents of `registry/`, `manifest*.json`, `fixture.schema.json`, `config.schema.json`, `custom-elements.json`, `html-custom-data.json` are owned by `07-manifest-registry-cli.md`; of `docs/` and `skills/` by `08-agent-kit-and-evals.md`.

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
    "manifest.json", "manifest.schema.json", "fixture.schema.json", "config.schema.json",
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
    "./fixture.schema.json":  "./fixture.schema.json",
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

1. `dependencies` MUST contain exactly the two UI SDK packages at the exact version (D-022, D-052). `parse5` and `liquidjs` are bundled into the Node entries at build time and MUST NOT appear in the published `dependencies` (D-052, ledger Q20). No devDependency of the repository (`rollup`, `lightningcss`, `axe-core`, the `@types/*` packages and the rest of section 5.1) may appear in `pkg/package.json`.
2. `@shopify/hydrogen` is a required peer (not optional). It stays external in `dist/` and is bundled only into `browser/ripple.js` and `registry/liquid/assets/ripple.js` (D-041 item 4).
3. The `license` value `MIT` is a placeholder for Ben's decision (ledger Q18); it MUST equal the SPDX id of the root `LICENSE` file.
4. The research aliases `./ripple.css` and `./ripple.js` do not exist; the browser files are reached through `./browser/*` (D-052).

### 6.3 Package identity

`src/identity.ts`, complete file:

```ts
export const PKG_NAME = "ripple-kit";
export const BIN_NAME = "ripple";
export const VERSION = "0.1.0";
```

1. The string `ripple-kit` MUST NOT appear in any other file under `src/`, `css/`, `components/`, `blueprints/`, `skills/`, `guides/`, `locales/` or `bin/`. Hand-written text files in those directories that need the package name (scaffolded bindings, skills, guides) write the token `__PKG__`.
2. The build resolves the package name as `process.env.RIPPLE_PKG_NAME`, or `PKG_NAME` when the variable is unset. It then (a) replaces the module `src/identity.ts` during bundling with one that exports the resolved name, and (b) replaces every occurrence of `__PKG__` in every text file it copies into `pkg/` (section 7 steps 3 and 8).
3. Rename test (A-10): build with `RIPPLE_PKG_NAME=@acme/storefront-ui`; the string `ripple-kit` MUST NOT occur in any file under `pkg/`, and `__PKG__` MUST NOT occur in any file under `pkg/`.

### 6.4 Export map: what each entry is for

| Specifier | Source | Runs in | Import has side effects | Exports (names fixed by the ledger; full signatures in the owner doc) | Owner |
|---|---|---|---|---|---|
| `<pkg>` | `src/index.ts` | browser, Node | no | `rv`, `cx`, `imageUrl`, `imageSrcSet`, the type `Responsive`, the resource types (`RippleProduct`, `RippleVariant`, `RippleLine`, `RippleCart`, `RippleImage`, `RippleMoney`, `RippleCollection`, `RippleArticle`, `RippleMenu`, `RippleShop`, and the further `Ripple*` data types of `05-commerce.md` section 11), the manifest loader. Prop types are NOT exported: they are generated into each binding file (D-035, D-052) | 05, 06, 07 |
| `<pkg>/elements` | `src/elements/index.ts` | browser (does nothing on a server) | yes: starts the runtime, defines `rp-dialog`, `rp-carousel`, `rp-quantity`, `rp-navigation-menu`, registers the lazy chunks | `toast`, `announce`, types `ToastOptions`, `AnnounceOptions` | 04 |
| `<pkg>/elements/<tag>` | `src/elements/<tag>.ts` | browser | yes: defines only that element (for `ui-*` entries: that UI SDK family) | per element | 04 |
| `<pkg>/commerce` | `src/commerce/index.ts` | browser (does nothing on a server) | yes: phase 3 step 4 | `getCommerce`, `configureCommerce`, types `RippleCommerce`, `CommerceOptions`, `CommerceStrings` | 05 |
| `<pkg>/commerce/<tag>` | `src/commerce/<tag>.ts` | browser | yes: defines only that element | per element | 05 |
| `<pkg>/react` | `src/react/index.ts` | browser, Node (SSR) | no | exactly `useElement`, `useCart`, `useRegionHtml`, and types (`RestProps`, the JSX intrinsic elements for `rp-*`, `ui-*` and `rp-view-event`, the `commandfor` / `command` augmentation) (D-033, D-096) | 06 |
| `<pkg>/remix` | `src/remix/index.ts` | browser, Node | no | types only (`RestProps`, JSX intrinsic elements); no runtime helpers (D-034, D-096) | 06 |
| `<pkg>/agent` | `src/agent/index.ts` | browser | no (the caller invokes `createAgent`) | `createAgent`, `agentTools`, `registerTools` | 08 |
| `<pkg>/testing` | `src/testing/index.ts` | Node | no | `canonicalize`, `loadFixtures`, `upgradeDiff`, `createShim` (the Liquid shim), `serveTheme`, `RESOURCES`, `loadBlueprintSample` (full list: `13-testing.md`) | 02, 13 |
| `<pkg>/check` | `src/check/index.ts` | Node | no | `check` | 07 |
| `<pkg>/browser/<file>` | build output | browser | yes | prebuilt bundles and `ripple.css` (exports of the two main files: below) | this doc, 04 |
| `<pkg>/css/<file>` | `css/`, `components/<id>/<id>.css` | browser | yes (CSS) | CSS sources | 03 |
| `<pkg>/registry/<path>` | build output | read as data by the CLI | no | scaffold sources | 07 |
| `<pkg>/manifest.json`, `<pkg>/manifest.schema.json`, `<pkg>/fixture.schema.json`, `<pkg>/config.schema.json` | build output | data | no | the manifest and the three schemas | 02, 07 |
| `<pkg>/docs/<path>`, `<pkg>/skills/<path>` | build output | data | no | agent documentation and skills | 08 |

Valid `<tag>` values: for `<pkg>/elements/<tag>`: `rp-dialog`, `rp-carousel`, `rp-quantity`, `rp-navigation-menu`, `ui-tabs`, `ui-tooltip`, `ui-toast`. For `<pkg>/commerce/<tag>`: `rp-cart`, `rp-product-form`, `rp-live`, `rp-predictive-search`, `rp-recommendations`. No other subpath resolves (the `dist/chunks/` and adapter files have no public specifier; `rp-view-event` has no entry of its own).

Exports of the prebuilt main files (D-054 item 1, D-042). `<pkg>/commerce` does not resolve on a page with no bundler, so the main files re-export the public functions:

| File | Public exports |
|---|---|
| `browser/ripple.js` (Liquid: the specifier `ripple`) | `toast`, `announce`, `loadAgent`, `getCommerce`, `configureCommerce` |
| `browser/ripple.elements.js` | `toast`, `announce`, `loadAgent` |

`loadAgent()` imports the set's `agent` chunk and returns a promise of the module `{ createAgent, agentTools, registerTools }`. Every other export of a main file is an internal link between the files of its set and MUST NOT be used. `ripple.elements.js` contains no commerce code and therefore no refresh strategy.

Import-safety rules:

1. `<pkg>`, `<pkg>/react`, `<pkg>/remix`, `<pkg>/testing`, `<pkg>/check` MUST be importable in Node with no DOM globals defined and with `@shopify/hydrogen` NOT installed (their Hydrogen imports are type-only and are erased).
2. `<pkg>/elements` and `<pkg>/commerce` MUST do nothing when `document` is undefined, so that importing them on a server does not throw (D-054 item 5). Whether `@ui-sdk/web` can be evaluated without a DOM is UNVERIFIED; the gate is test E-30 of `04-elements.md`. Until E-30 passes, only a client entry may import them. In every case a binding file MUST NOT import them (D-096).
3. `<pkg>/elements/<tag>`, `<pkg>/commerce/<tag>` and `<pkg>/agent` are browser-only. Bindings and server code MUST NOT import them.
4. `src/commerce/adapter.ts` and `src/commerce/refresh-react.ts` MUST be import-safe in Node (they are imported by `<pkg>/react` during SSR): no DOM access and no store creation at module top level.

### 6.5 Which artifact each host uses

| Artifact | `html` | `react` | `remix` | `liquid` |
|---|---|---|---|---|
| Element JS | `browser/ripple.js`, copied by `ripple init` to `paths.public`; or `browser/ripple.elements.js`, linked from `node_modules/<pkg>/browser/` or copied by hand | `<pkg>/elements` + `<pkg>/commerce` through the app bundler | `browser/ripple.js` copied to `public/ripple/` | `registry/liquid/assets/ripple.js` copied to `assets/` |
| Lazy chunks | `browser/ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`, `ripple-shared.js`, `ripple-agent.js` beside the main file (or the five `ripple.elements-*.js` files beside `ripple.elements.js`) | code-split by the app bundler | the same five `browser/ripple-*.js` files in `public/ripple/` | `assets/ripple-tabs.js`, `ripple-tooltip.js`, `ripple-toast.js`, `ripple-shared.js`, `ripple-agent.js` |
| `@ui-sdk/*` copy | inside the main bundle | npm dependency, resolved once by the app bundler | inside the main bundle | inside the main bundle |
| `@shopify/hydrogen` client copy | inside `ripple.js` | peer, resolved once by the app bundler | inside `ripple.js` | inside `ripple.js` |
| `@shopify/hydrogen` server use | app server (`createCartServerHandlers`, `handleShopifyRoutes`, `renderShopifyScriptTags`) | app server | app server | none |
| CSS | scaffolded files, or `browser/ripple.css` with no build | scaffolded files in `paths.styles` | scaffolded files in `paths.styles` | one concatenated `assets/ripple.css` |
| Bindings | `<id>.html` reference files | `<id>.tsx` (and `<id>.data.ts` where the component has one) importing `<pkg>` and `<pkg>/react` | `<id>.tsx` (and `<id>.data.ts`) importing `<pkg>` and `<pkg>/remix` | `blocks/*.liquid`, `snippets/rp-*.liquid` |
| Helpers `rv`, `cx` | not used | `<pkg>` | `<pkg>` | not used (Liquid prints strings) |

Rules:

1. A page MUST load exactly one of: `ripple.js`, `ripple.elements.js`, or the bundled `<pkg>/elements` (+ `<pkg>/commerce`) imports, and MUST load it exactly once. Loading two is checker error RP507 (D-054 item 1, D-102).
2. On the `remix` and `html` hosts, server code imports `@shopify/hydrogen` from npm for the server handlers, while the browser gets Hydrogen from inside `ripple.js`. The app's client code MUST NOT import `@shopify/hydrogen`; it reaches the store through the DOM events or, when it needs the object, through `import { getCommerce } from "/ripple/ripple.js"`.
3. On Liquid, theme code MUST import cart access from the bare specifier `ripple` and MUST NOT load `@shopify/hydrogen` separately (D-041 item 4).
4. The files of one set MUST be deployed in the same directory and MUST keep their names; they import each other by relative path (Liquid: by bare specifier).
5. Library JavaScript copied into a project (`public/ripple/*.js`, Liquid `assets/ripple*.js`) is never merged: `ripple upgrade` overwrites it and prints a warning when the file was modified (D-053). `ripple-agent.js` is always copied and is opt-in by loading.

---

## 7. Build pipeline

`pnpm build` runs `src/gen/build.ts`. It MUST perform these steps in this order and exit non-zero on the first failure. Two bundlers are used (D-054 items 5 and 8, D-077):

- **esbuild** (JavaScript API, `build()` from `esbuild`) builds `dist/` (steps 4 and 5) and bundles the tooling that the `scripts` of section 5.1 run.
- **Rollup** 4.24.0 with `@rollup/plugin-node-resolve` 15.3.0 and `@rollup/plugin-terser` 0.4.4 builds the browser files (`pkg/browser/` and `pkg/registry/liquid/assets/`, step 7), in `src/gen/browser-bundles.ts`. esbuild's code splitting cannot keep the kernel in the main file (measured, `04-elements.md` section 6.1).

1. **Clean.** Delete `pkg/` and recreate it empty.
2. **Generate check.** Run the generator in check mode (same as `pnpm gen --check`). Fail when any generated-and-committed file is stale.
3. **Resolve identity.** `name = process.env.RIPPLE_PKG_NAME ?? PKG_NAME`. Build the replacement source text for `src/identity.ts`: `export const PKG_NAME = <JSON string of name>; export const BIN_NAME = "ripple"; export const VERSION = <JSON string of VERSION>;`. Create one esbuild plugin, used by steps 4 and 5, whose `onLoad` for the file `src/identity.ts` returns that text. Step 7 receives the same text as the option `identity: { file: "src/identity.ts", code: <the text> }`.
4. **Bundle browser-side `dist` entries** in ONE esbuild invocation:
   - `entryPoints`: `src/index.ts`, `src/elements/index.ts`, the seven `src/elements/{rp,ui}-*.ts` files, `src/commerce/index.ts`, the five `src/commerce/rp-*.ts` files, `src/react/index.ts`, `src/remix/index.ts`, `src/agent/index.ts`.
   - `outdir: "pkg/dist"`, `outbase: "src"`, `bundle: true`, `format: "esm"`, `splitting: true`, `platform: "neutral"`, `target: "es2022"`, `outExtension: { ".js": ".mjs" }`, `chunkNames: "chunks/[name]-[hash]"`, `minify: false`.
   - `external`: `@ui-sdk/core`, `@ui-sdk/core/*`, `@ui-sdk/web`, `@ui-sdk/web/*`, `@shopify/hydrogen`, `@shopify/partial-rendering`, `@shopify/standard-actions`, `@shopify/standard-events`, `react`.
   - `splitting: true` in a single invocation is REQUIRED (D-054 item 5): it guarantees that modules with state (`src/commerce/adapter.ts`, `src/commerce/refresh-react.ts`, `src/runtime/**`) exist once and are shared by `dist/commerce`, `dist/react` and `dist/elements` (I-3). Building these entries in separate invocations is a defect.
5. **Bundle Node `dist` entries** in one esbuild invocation: `entryPoints` `src/testing/index.ts`, `src/check/index.ts`, `src/cli/index.ts`; `outdir: "pkg/dist"`, `outbase: "src"`, `bundle: true`, `format: "esm"`, `splitting: true`, `platform: "node"`, `target: "node20"`, `outExtension: { ".js": ".mjs" }`, `chunkNames: "chunks/node-[name]-[hash]"`; `external`: `playwright`, `@shopify/theme-check-node`. `parse5` and `liquidjs` are bundled in.
6. **Declarations.** Run the TypeScript compiler with `emitDeclarationOnly` and `declaration` over `src/` (excluding `*.test.ts`) into a temporary directory under `node_modules/.cache/ripple/dts/`; copy the `.d.ts` file of every entry of steps 4 and 5, and every `.d.ts` it references, into `pkg/dist/` with the extension changed to `.d.mts`, and change every relative import specifier inside them from `./x` or `./x.ts` to `./x.mjs`.
7. **Browser files.** Call `buildBrowserBundles` from `src/gen/browser-bundles.ts` exactly as `04-elements.md` section 6.4 shows. That section owns the mechanism (one Rollup build per main file; a virtual entry per main file; the `shared` chunk; terser minification; the Liquid rewrite). This document fixes the inputs, the outputs and the tests:
   - Main file `ripple.js`: sources `src/elements/index.ts` and `src/commerce/index.ts`. Main file `ripple.elements.js`: source `src/elements/index.ts`. Agent entry: `src/agent/index.ts`.
   - Output directory `pkg/browser`: exactly the 12 `.js` files of section 6.1. Output directory `pkg/registry/liquid/assets`: exactly the six files of section 6.1, made from the `ripple` set (file names unchanged) by rewriting every cross-file import to the bare specifiers `ripple`, `ripple/tabs`, `ripple/tooltip`, `ripple/toast`, `ripple/shared`, `ripple/agent`. The build throws when a relative import remains in a Liquid file, when the returned list is not exactly the 12 names, or when more than one `shared` file per set is produced.
   - `format: "esm"`, minified, syntax no newer than ES2022. Externals: only the three platform specifiers `@shopify/partial-rendering`, `@shopify/standard-actions`, `@shopify/standard-events`.
   - Each chunk contains NO copy of `@ui-sdk/core` and imports the kernel from its main file. Import direction: a chunk imports its main file statically; a main file imports a chunk only with a dynamic `import()`. Tests A-07 and A-08 are the gate (D-077).
   - `buildBrowserBundles` returns the raw and gzip size of every file; step 10 compares them with `size-budget.json`.
   - `ripple.css` (written by `src/gen/build.ts` itself, not by Rollup): concatenation, in this order, of `css/layers.css`, `css/tokens.css`, `css/base.css`, `css/props.css`, then every `components/<id>/<id>.css` in ascending order of `<id>` (byte order). Not minified. Exact layer placement of each file is owned by `03-styling-and-tokens.md`.
8. **Copy and token-replace.** Copy `bin/`, `css/` (plus `components/<id>/<id>.css` to `pkg/css/components/<id>.css`), `skills/`, `README.md`, `LICENSE`; build `registry/` (including `registry/liquid/settings.json`), `manifest.json`, the three schemas (`manifest.schema.json`, `fixture.schema.json`, `config.schema.json`, copied from `src/gen/schema/`), `custom-elements.json`, `html-custom-data.json` and `docs/` through the generator modules (`07-manifest-registry-cli.md`, `08-agent-kit-and-evals.md`). In every copied or generated text file, replace `__PKG__` with the resolved name.
9. **Write `pkg/package.json`** (section 6.2).
10. **Verify.** Run tests A-05, A-06, A-11 of section 11 against `pkg/`; fail when `__PKG__` occurs in any file under `pkg/` (the full rename test A-10 is a separate CI job that runs the build again with `RIPPLE_PKG_NAME` set); check `manifest.pins` (below); check every budget of `size-budget.json` (D-064; the measuring code `src/gen/size.ts` is owned by `13-testing.md`).

Budgets checked in step 10 (D-064; 1 kB is 1000 bytes; JavaScript is gzip level 9 of the shipped file). The values live in `size-budget.json`; this list is a copy for orientation and `size-budget.json` MUST equal it:

| File | Budget |
|---|---|
| `ripple.js` (also the Liquid build `registry/liquid/assets/ripple.js`) | 45 kB |
| `ripple.elements.js` | 30 kB |
| `tabs` chunk, in each of the two sets | 10 kB |
| `tooltip` chunk, in each set | 22 kB |
| `toast` chunk, in each set | 15 kB |
| `shared` chunk, in each set | 10 kB |
| `agent` chunk, in each set | 14 kB |
| CSS: tokens + base; `props.css`; full `ripple.css`; each component CSS file | 2.2 kB; 5.2 kB; 45 kB (all three gzip of a minified copy); 6,000 bytes minified, not gzipped |

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
3. Build-time and test-time tools (`esbuild`, `rollup`, `@rollup/plugin-node-resolve`, `@rollup/plugin-terser`, `lightningcss`, `typescript`, `axe-core`, `@types/node`, `@types/react`, `parse5`, `liquidjs`) are `devDependencies` of the repository. `parse5` and `liquidjs` are bundled into the Node entries (`<pkg>/check`, `<pkg>/testing`, the CLI) only; they never reach a browser and are not `dependencies` (ledger Q20).
4. `@tailwindcss/browser` MUST NOT be used or referenced anywhere (D-030).
5. `remix` is NOT a peer: only scaffolded Remix bindings import it, and those are the project's code. Under `src/` the only mention is the type-only statement `import type {} from "remix/component"` in `src/remix/**`, which is erased from the output (section 2.2 rule 12). The Remix refresh strategy receives `reloadFrames` and `navigate` as `configureCommerce` options (D-062 item 6).
6. Platform-provided specifiers (`@shopify/partial-rendering`, `@shopify/standard-actions`, `@shopify/standard-events`) are not npm dependencies (D-046).

### 8.2 One-copy rules (I-3)

| Thing | Rule | How it is guaranteed |
|---|---|---|
| `@ui-sdk/core` | exactly one copy per page | Prebuilt hosts: only the main file contains it; the five chunks of its set (`tabs`, `tooltip`, `toast`, `shared`, `agent`) import it from that main file, and the two sets (`ripple`, `ripple.elements`) are never mixed. `react` host: it is external in `dist/` and deduplicated by the app bundler. A project MUST NOT load `ripple.js` AND bundle `<pkg>/elements`. |
| `@shopify/hydrogen` | exactly one copy per page | Prebuilt hosts: only `ripple.js` contains it. `react` host: external peer. |
| Cart store | exactly one per page | Created only in phase 3 step 4 by the adapter; reached only through `getCommerce().cart` (React: through `useCart` from `<pkg>/react`). `createCartStore` MUST NOT be called anywhere else in library, scaffolded or blueprint code. `CartProvider` MUST NOT be mounted. |
| `Shopify.actions.updateCart.configure` | exactly one call per page (Liquid) | Hydrogen's own call; Ripple and theme code never call it (D-041 item 5). |
| Ripple runtime (document listeners, polyfill) | started exactly once per page | `src/runtime/index.ts` guards with the global `window.rpRuntime`; the polyfill guards with `window.rpCommandsPolyfill`, so the inline Liquid copy and the module copy install one listener between them. These are the only two globals the runtime owns (D-078). |
| Module state in `dist/` | each stateful module once | step 4 of section 7 (`splitting: true`, one invocation). |

### 8.3 Library versus scaffolded (I-5)

1. Scaffolded files MAY import library entries (`<pkg>`, `<pkg>/react`, `<pkg>/remix`); library code MUST NOT import scaffolded files. A binding file MUST NOT import `<pkg>/elements` or `<pkg>/commerce` (D-096); only a client entry does.
2. A scaffolded binding MUST NOT contain element behaviour (no `customElements.define`, no `definePrimitive`). Behaviour is library code (D-053).
3. Scaffolded CSS MUST NOT be imported by library JavaScript. No library module imports a `.css` file.
4. The registry copy of a scaffolded file and the repository source (`components/<id>/...`) differ only by `__PKG__` replacement and the provenance trailer (D-056; `07-manifest-registry-cli.md`). The further install transforms (Liquid block prefix, `@components/<id>` import specifiers) are applied by the CLI in the project (D-101).
5. `props.css` and `theme.css` are scaffolded but DERIVED: `ripple add` and `ripple upgrade` regenerate them from the project's `tokens.css` (D-029, D-053).

---

## 9. Pinned versions

"Pin" is the version used for development, fixtures and CI. "Published range" is what `pkg/package.json` declares. All devDependencies are exact versions. A version bump of any row marked (F) is a pull request that regenerates upgrade-snapshot fixtures and MUST pass every test tier (D-062).

| Package / tool | Pin | Published range | Used for | Evidence |
|---|---|---|---|---|
| `@ui-sdk/core` (F) | `0.1.0-beta.14` | `0.1.0-beta.14` (exact) | kernel | `uisdk/packages/core/package.json` |
| `@ui-sdk/web` (F) | `0.1.0-beta.14` | `0.1.0-beta.14` (exact) | `createParts`, Tabs, Tooltip, Toast, agent bridge | `uisdk/packages/web/package.json` |
| `@shopify/hydrogen` (F) | `2026.10.3` | `>=2026.10.3 <2027` (peer) | cart store, server handlers, script tags, `formatMoney` and the other pure functions of D-094 | `hydrogen/packages/hydrogen/package.json` |
| `react`, `react-dom` | `19.3.1` | `>=19` (optional peer) | React host | `ripple/docs/research/spikes/react-ce/package.json` |
| `@types/react` | `19.3.0` | none | types for `src/react/**`; `src/react/jsx.generated.ts` augments `ButtonHTMLAttributes` (`commandfor`, `command` are missing from this version) | D-033, D-103 |
| `remix` | `3.3.0` (`@remix-run/component` `1.3.0`) | none | Remix host tests and example; the type-only import in `src/remix/**` | `remix/packages/remix/package.json`, `remix/packages/component/package.json` |
| `tailwindcss`, `@tailwindcss/cli` | `4.3.5` | `^4.0.0` (optional peer) | `theme.css` verification, examples | `ripple/docs/research/spikes/styling/package.json` |
| `playwright` | `1.63.0` | `>=1.45` (optional peer) | browser tests, `ripple check --browser` | preinstalled version on the build machine |
| `@shopify/theme-check-node` | `4.0.2` | `^4.0.0` (optional peer) | `TC:` findings in `ripple check` | `ripple/docs/research/spikes/liquid/package.json` |
| `liquidjs` | `10.30.1` | bundled into `dist/testing` | the Liquid shim | `ripple/docs/research/liquid-blocks-partials.md` |
| `parse5` | `8.1.1` | bundled into `dist/check`, `dist/testing`, `dist/cli` | HTML parsing | `ripple/docs/research/spikes/agent-kit/package.json` |
| `esbuild` | `0.28.2` | none | `dist/` and tooling (bundles each tool and test file before Node runs it) | `ripple/docs/research/spikes/agent-kit/package.json` |
| `rollup` | `4.24.0` | none | the browser files (`browser/`, `registry/liquid/assets/`), in `src/gen/browser-bundles.ts` | D-054 item 8, D-103; `04-elements.md` section 6 (run) |
| `@rollup/plugin-node-resolve` | `15.3.0` | none | resolves npm packages in the Rollup build | same |
| `@rollup/plugin-terser` | `0.4.4` | none | minifies the browser files (the `agent` chunk meets its 14 kB budget only with terser) | same |
| `lightningcss` | `1.33.0` | none | the measuring minifier for CSS budgets, in `src/gen/size.ts` | D-064, D-103; `03-styling-and-tokens.md` section 5.4 |
| `axe-core` | `4.14.1` | none | automated WCAG scan in test tier 5 | D-103; `13-testing.md` |
| `@types/node` | `22.20.5` | none | types for `node:*` in tooling and tests | D-103; `13-testing.md` |
| `typescript` | `6.0.3` | none | type-check, declarations | `ripple/docs/research/spikes/remix/package.json` |
| `pnpm` | `10.28.0` | none | package manager | version on the build machine |
| Node.js | `>=22.18` for the repository | `engines.node: ">=20.18"` for the package (UNVERIFIED) | tooling | spikes ran on Node 22; `remix@3.3.0` declares `engines.node: ">=24.3.0"` (`remix/packages/remix/package.json`) |
| Liquid platform | "Liquid July '26 developer preview" | not an npm package | `{% block %}`, `{% partial %}`, `@shopify/partial-rendering`, Standard Actions, Standard Events | `ripple/theme/AGENTS.md`; UNVERIFIED on a live store (SPIKE-01, SPIKE-02) |
| Storefront data | `mock.shop` | none | hydrogen-backend tests and examples (Ben decision 10) | `ripple/docs/research/hydrogen-core.md` |

Node matrix (D-052, D-103 item 4; the CI jobs are owned by `13-testing.md`):

| Where | Node version | Rule |
|---|---|---|
| Repository (`engines.node` of the root `package.json`) | `>=22.18` | every script of section 5.1 MUST run on Node 22.18 |
| Main CI job | 24 | runs every default tier, including the Remix tests |
| Remix tests (`examples/remix`, tier 4 morph tests, Remix conformance) | 24.3 or later | they SKIP, not fail, below Node 24.3 |
| Separate CI job | 22.18 | runs the tiers that need no Remix |
| Packed-package CI job | 20.18 | installs the packed `pkg/` and starts the CLI; this is the check of the UNVERIFIED `engines.node: ">=20.18"` |

Rules:

1. The two `@ui-sdk/*` versions MUST be identical and exact in every `package.json` in the repository (root, `examples/*`, `evals/*`).
2. The root `package.json` MUST NOT contain a version range character (`^`, `~`, `>`, `<`, `*`, `x`) in `dependencies` or `devDependencies`.
3. Installing a second version of any (F) package anywhere in `node_modules` (check: `pnpm why <name>` lists one version) fails CI.
4. The package's own version (`VERSION` in `src/identity.ts`) starts at `0.1.0`. Every Ripple release that changes a (F) pin MUST change at least the minor version.
5. A published version MUST never be unpublished (D-057): `ripple upgrade` fetches old versions as merge bases.

### Fallback (SPIKE-04)

Default path (implemented now): `src/runtime/element.ts` does not exist; every `rp-*` element is built with `definePrimitive` + `createParts` (D-019). If SPIKE-04 fails: create `src/runtime/element.ts` exporting `class RippleElement extends HTMLElement` (surface owned by `04-elements.md`); the import rules of section 2.2 do not change (`src/runtime/**` is already importable by L4 and L5), and `@ui-sdk/web` remains a dependency for the three `ui-*` families and the agent bridge.

---

## 10. Browser support floor

The floor is D-032; the per-feature CSS and JS gating is owned by `03-styling-and-tokens.md` and `04-elements.md`. This section fixes the floor, the three script tiers, and the capability tiers of D-081 (the stated behaviour of each feature that is newer than the floor). The floor is NOT raised for the `popover` attribute or `<details name>` (ledger Q15).

| Engine | Minimum version | Status |
|---|---|---|
| Chrome, Edge | 111 | Chromium verified in spikes (Chromium 157); the minimum itself is UNVERIFIED (SPIKE-06) |
| Safari (macOS and iOS) | 16.4 | UNVERIFIED (SPIKE-06) |
| Firefox | 128 | UNVERIFIED (SPIKE-06) |

### 10.1 Script tiers

A page MUST behave as stated in each tier; a browser below tier 1 is unsupported.

| Tier | Condition | Behaviour |
|---|---|---|
| 0 No script | scripting disabled, script failed to load, or a browser below the floor that cannot parse the module | Phase 2 forever: every `noJs.level: full` component is fully functional; forms post natively (I-4). |
| 1 Elements | at or above the floor | Phases 1 to 3 steps 1 to 3: all non-commerce elements and lazy `ui-*` chunks work. |
| 2 Commerce | tier 1 AND `typeof AbortSignal.any === "function"` AND `typeof crypto.randomUUID === "function"` (Safari 17.4 or later) AND, on Liquid, Standard Actions present | Phase 3 step 4 and phases 4, 5 for commerce. When the condition is false (synchronous failure): `usable === false`, no commerce element is defined, forms post natively. When the condition is true but the first cart read fails (asynchronous failure): `usable === false`, the commerce elements stay defined, and controllers submit natively through the hidden fallback button (section 3.3 step 4). |

### 10.2 Capability tiers (D-081)

Features above the floor, their mandatory gate, and their behaviour below their first version (D-032, D-081). Each MUST behave as stated; none may be assumed. First-version numbers are from compatibility tables and are UNVERIFIED (SPIKE-06).

| Feature | First version | Gate | Below its first version | Owner |
|---|---|---|---|---|
| Invoker Commands (`commandfor`, `command`) | not in the floor browsers | JS test `"commandForElement" in HTMLButtonElement.prototype` | polyfilled: polyfill in `ripple.js`; inline polyfill on Liquid (D-008) | 04 |
| `popover` attribute | Chrome 114, Safari 17.0, Firefox 125 | none (no polyfill); tests use `"popover" in HTMLElement.prototype` | The panel is ordinary in-flow content, always visible. The opener button is present and does nothing. `rp-navigation-menu` does nothing. | 03, 04, 10 |
| Exclusive `<details name>` | Chrome 120, Safari 17.2 | none | An Accordion with `type="single"` behaves as `multiple`. | 10 |
| `closedby="any"` on `<dialog>` | UNVERIFIED (SPIKE-06) | JS test `"closedBy" in HTMLDialogElement.prototype` | backdrop-click handler in `rp-dialog` (D-008) | 04, 10 |
| CSS anchor positioning | UNVERIFIED (SPIKE-06) | `@supports (anchor-name: --a)` | Popover uses the user-agent position (centred) (D-010) | 03, 10 |
| `pow()` | UNVERIFIED (SPIKE-06) | `@supports (width: calc(1px * pow(2, 2)))` | literal type scale values | 03 |
| Relative colour syntax | UNVERIFIED (SPIKE-06) | `@supports (color: oklch(from red l c h))` | literal derived colours | 03 |
| `@media (scripting: none)` | UNVERIFIED (SPIKE-06) | none needed (an unsupported media query never matches) | Tabs without JS shows only the default panel (D-012) | 03, 10 |
| `AbortSignal.any`, `crypto.randomUUID` | Safari 17.4 for `AbortSignal.any` | the script tier 2 test of section 10.1 | The commerce runtime does not start; forms post natively (D-032) | 05 |
| Navigation API | UNVERIFIED (SPIKE-06) | JS test `"navigation" in window` | `rp-dialog` does not close on navigation (D-008) | 04 |
| Remix morph navigation | Chrome / Edge 135 (`ripple/docs/research/remix-3.md`) | owned by Remix | document navigation | 06 |

The exact `@supports` conditions in the table are the defaults to implement; if `03-styling-and-tokens.md` states a different condition for the same feature, that document wins for CSS.

Rules:

1. JavaScript output targets `es2022` (section 7). Syntax newer than ES2022 MUST NOT appear in `browser/*.js`.
2. CSS features are NEVER polyfilled (D-032).
3. User-agent sniffing MUST NOT be used; only feature tests.
4. Cross-engine verification is test tier 9 of D-063 (`13-testing.md`); until SPIKE-06 reports, the floor above is the target and Chromium is the only verified engine.
5. A test for a feature above the floor MUST feature-detect and SKIP, not fail, on an engine without the feature (D-081).
6. Raising the floor instead of keeping these fallbacks is Ben's choice (ledger Q15); until he decides, the floor of D-032 stands.

---

## 11. Acceptance tests

Each test is pass/fail and automatable. Where each test lives: A-01 to A-04, A-12 and A-15 in `src/architecture.test.ts`; A-05, A-06 and A-11 in step 10 of the build; A-10 in the CI job `rename`; A-07, A-08 and A-13 in `test/upgrade/bundles.test.ts`; A-09 is row E2E-10 and A-14 is row NJ-F1 of `13-testing.md`. Tier numbers refer to D-063.

| Id | Tier | Test | Pass condition |
|---|---|---|---|
| A-01 | 1 | List top-level entries of the repository (excluding `.git`, `.gitignore`, `node_modules`). | Set equals: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `size-budget.json`, `README.md`, `PLAN.md`, `AGENTS.md`, `LICENSE`, `.github`, `bin`, `docs`, `theme`, `src`, `css`, `icons`, `locales`, `components`, `blueprints`, `skills`, `guides`, `evals`, `examples`, `test`, `pkg` (`pkg` optional). No `pnpm-workspace.yaml`. |
| A-02 | 1 | List entries of `src/`. | Directories equal `runtime`, `elements`, `commerce`, `react`, `remix`, `agent`, `testing`, `check`, `cli`, `gen`; files equal `identity.ts`, `index.ts`, `responsive.ts`, `image.ts`, `types.ts` plus `*.test.ts`. `src/runtime/element.ts` does not exist. |
| A-03 | 1 | Parse every specifier of `import`, `export ... from` and `import()` in `src/**/*.ts` (not `*.test.ts`) and check it against `IMPORT_RULES` (section 2.2), with the five reading rules stated below the object. | Zero violations; every file matches a key. In particular: no file under `src/check/` imports `src/cli/`; the only specifier containing `remix` under `src/` is `remix/component` in an `import type` statement under `src/remix/`. |
| A-04 | 1 | Search `src/**/*.ts` for the strings `@ui-sdk/react`, `@ui-sdk/core/internal`, `@ui-sdk/core/web.css`, `@remix-run/ui`, `@shopify/hydrogen/react`, `@tailwindcss/browser`, `CartProvider`, `ripple-kit` (the last one excluding `src/identity.ts`), and for `.css"` / `.css'` import specifiers. | Zero matches. |
| A-05 | build | `node -e "await import('./pkg/dist/index.mjs'); await import('./pkg/dist/react/index.mjs'); await import('./pkg/dist/remix/index.mjs'); await import('./pkg/dist/testing/index.mjs'); await import('./pkg/dist/check/index.mjs')"` run in a directory whose `node_modules` contains `react` but NOT `@shopify/hydrogen` and NOT `playwright`. | Exit code 0. The module `pkg/dist/react/index.mjs` exports exactly the value names `useElement`, `useCart`, `useRegionHtml`; `pkg/dist/remix/index.mjs` exports no value. |
| A-06 | build | For every key of `exports` in `pkg/package.json` without `*`: the target files exist. For every `*` key: at least one file matches, and for `./elements/*` and `./commerce/*` the matched base names equal the tag lists in section 6.4 plus `index`. List `pkg/browser/` and `pkg/registry/liquid/assets/`. | All targets exist. `pkg/browser/` contains exactly the 12 `.js` files of section 6.1 plus `ripple.css`. `pkg/registry/liquid/assets/` contains exactly the six files of section 6.1, and none of them contains an import specifier that starts with `./` or `../`. `pkg/` contains `fixture.schema.json` and `registry/liquid/settings.json`, and no path outside the tree of section 6.1. |
| A-07 | 3 | In Chromium, load a page with `browser/ripple.js` containing one `ui-tabs` (Tabs `default` fixture), one `rp-dialog` (Dialog `default` fixture) and one empty `ui-toast-region` (Toast `default` fixture). After the tabs chunk loads, activate the second tab and open the dialog by its opener. Record the requests. Then call `(await import("/ripple/ripple.js")).toast("Saved")` and record the requests again. | Tab selection changes; dialog opens; exactly one network request each for `ripple.js` and `ripple-tabs.js`; before the `toast()` call there is no request for `ripple-tooltip.js`, `ripple-toast.js` or `ripple-shared.js`, although `ui-toast-region` is in the document; after the call there is exactly one request each for `ripple-toast.js` and `ripple-shared.js`; the text of `ripple-tabs.js` contains the import specifier `./ripple.js`; the console shows no UI SDK duplicate-tag warning; `ripple.js` exports the names `toast`, `announce`, `loadAgent`, `getCommerce`, `configureCommerce`. |
| A-08 | 3 | Same as A-07 with `browser/ripple.elements.js` (served as `/ripple/ripple.elements.js`). | Same, with chunks `ripple.elements-tabs.js`, `ripple.elements-toast.js`, `ripple.elements-shared.js`; no request for `ripple.js` or any `ripple-*.js` file; the text of `ripple.elements.js` does not contain the string `createCartStore`; `ripple.elements.js` exports `toast`, `announce`, `loadAgent` and does NOT export `getCommerce` or `configureCommerce`. |
| A-09 | 7 | React example, built by its bundler: in the browser evaluate that the object returned by `getCommerce()` imported through `<pkg>/commerce` is identical (`===`) to the one the `<pkg>/react` hooks read (exposed by a test-only component that stores it on `window`). Count `createCartStore` calls with a wrapper installed by the test. | Identical object; exactly one call. |
| A-10 | build | Build with `RIPPLE_PKG_NAME=@acme/storefront-ui`, then search every file under `pkg/` for `ripple-kit` and `__PKG__`. | Zero matches; `pkg/package.json` `name` is `@acme/storefront-ui`. |
| A-11 | build | Read `pkg/package.json`. | `dependencies` keys equal exactly `@ui-sdk/core`, `@ui-sdk/web`, both `0.1.0-beta.14`; `peerDependencies` keys equal exactly the five of section 6.2; there is no `devDependencies` key; `pkg/manifest.json` `pins` equals the object in section 7. |
| A-12 | 1 | Read the root `package.json`. | No value in `dependencies` or `devDependencies` contains any of `^ ~ > < * x` as a range character (test: every value matches `/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/`). The `scripts` object has the keys `gen`, `build`, `typecheck`, `test`, `eval`, `release:check`. The `devDependencies` include every tool row of section 9 at the pinned version. |
| A-13 | 3 | In Chromium, load the page of A-07 with a script that makes `crypto.randomUUID` undefined before `ripple.js` runs. | `customElements.get("rp-dialog")` is defined; `customElements.get("rp-cart")` is undefined; `(await import("/ripple/ripple.js")).getCommerce().usable === false`; submitting an add-to-cart form performs a native navigation. (The asynchronous failure, a first cart read that rejects after the elements are defined, is tested by `05-commerce.md` section 14.) |
| A-14 | 6 | Load the layout blueprint of each host with scripting disabled. | No request for any `ripple*.js` chunk is needed for the page to render; every `noJs.level: full` flow passes (`13-testing.md` tier 6). |
| A-15 | 1 | Parse every `import` in `components/*/react/*.{ts,tsx}` and `components/*/remix/*.{ts,tsx}`. | Every value import from `@shopify/hydrogen` names only functions from this list: `formatMoney`, `renderShopPayButton`, `buildProductSelectionSearchParams`, `parseCollectionParams`, `serializeCollectionParams`, `isFilterInputActive`, `getFilterRemovalUrl` (D-094). No file imports `<pkg>/elements`, `<pkg>/commerce` (written `__PKG__/elements`, `__PKG__/commerce` in the repository), `@shopify/hydrogen/react` or `@ui-sdk/react`. A file whose first line is `"use client"` exports components only. |

---

## 12. Evidence and UNVERIFIED

Evidence:

- Layering, one-copy rules, bundle composition: `ripple/docs/research/uisdk-web-elements.md` sections 7, 9.6, 9.8; `ripple/docs/research/hydrogen-core.md` (C2, S2, S3, bundle cost).
- The browser-file build (Rollup, the `shared` chunk, the second chunk set, measured sizes): `04-elements.md` section 6 and its spike `ripple/docs/research/spikes/elements-runtime/` (run).
- Package layout, exports, identity and rename test: `ripple/docs/research/agent-kit-and-distribution.md` 11.1 to 11.4.
- Confirmed symbols: `uisdk/packages/core/src/index.ts`, `uisdk/packages/web/src/index.ts`, `uisdk/packages/web/src/agent.ts`, `uisdk/packages/web/package.json`, `hydrogen/packages/hydrogen/src/core/index.ts`, `hydrogen/packages/hydrogen/vendor/standard-events.d.ts`, `hydrogen/packages/hydrogen/package.json`.
- Versions: the `package.json` files listed in section 9; the seven pins of D-103.

UNVERIFIED:

- Whether `@ui-sdk/web` modules can be evaluated in Node without a DOM (section 6.4 rule 2). Gate: test E-30 of `04-elements.md`.
- esbuild `splitting: true` with `platform: "neutral"` producing a single shared chunk for `src/commerce/adapter.ts` was not run for this document; A-09 is the gate.
- The size of the real `ripple.js` (elements and commerce built together) against its 45 kB budget (D-064); step 10 of the build is the gate.
- Browser floor outside Chromium, and every first-version number in section 10.2 (SPIKE-06). Real Standard Actions runtime and `createViewEventElement` under the tag `rp-view-event` (SPIKE-01). Real partial rendering (SPIKE-02). The Remix opt-in options `reloadFrames` and `navigate` (SPIKE-11). The `html` strategy on `remix` and `useRegionHtml` on `react` (SPIKE-10).
- Node `>=20.18` as the package engine floor comes from the research report's draft `package.json` and was not tested; the CI job that installs the packed package on Node 20.18 (section 9) MUST pass before the first release, or `engines.node` is raised.

---

## Ledger issues

None open from the first pass: its 17 items are settled by D-052, D-054, D-062, D-077, D-102 and D-103. See `00-decisions.md` section 13.2.

Points the amended ledger does not cover, with the option applied in this document:

1. **Command of `release:check`.** D-103 requires the script and `07-manifest-registry-cli.md` section 11 owns the checklist, but neither gives the command or a source file, and the tree of ledger 5.1 has no file for it. Applied: `"release:check": "pnpm gen --release-check"`; `src/gen/index.ts` runs the checklist on that flag (section 5.1). No file was added.
2. **Imports between tooling directories.** The CLI regenerates `props.css` and `theme.css` in a project (D-029), and the registry build stamps trailers and builds the Liquid composite stylesheet, but the ledger states only that `src/check/**` MUST NOT import `src/cli/**`. Applied: `src/cli/**` may import `src/gen/{props-css,theme-css,tokens-source}.ts`; `src/gen/**` may import `src/cli/**` (section 2.2).
3. **Extension of relative imports.** Sibling documents print source with both forms (`"./x"` and `"./x.ts"`). Applied: both are legal (`allowImportingTsExtensions`, section 5.2), and build step 6 rewrites both in declaration files.
4. **`CHANGELOG.md`.** `07-manifest-registry-cli.md` section 11 requires a `CHANGELOG.md` at the repository root; the tree of ledger 5.1 and D-103 item 5 (test A-01) do not list it. Applied: the ledger tree; A-01 does not allow `CHANGELOG.md`. Adding it needs a ledger change.
5. **Trigger of the commerce start.** D-087 item 2 says the start is one microtask after the first element connects; `05-commerce.md` section 4.5 queues it one microtask after the module is evaluated. Applied: this document states only "lazy by one microtask" and leaves the trigger to `05-commerce.md` (section 3.3 step 4).
