# M7 Blueprints and example storefronts: task detail

Status: detail file for the 29 rows of milestone M7 in `docs/PLAN.md` section 6. `docs/00-decisions.md` (the ledger) wins over every spec; a spec wins over this file. This file adds no public API. Where it fixes a choice the specs leave open, the choice is marked "Plan reading" and listed in section 0.9.

How to use: read `AGENTS.md`, `docs/CONVENTIONS.md`, `docs/PLAN.md` sections 1 to 3, 5.0 and 5.8, then section 0 of this file (about 33 kB), then ONLY your task's section `## <task id>`. Do not read other task sections and do not read the other `docs/plan/M*.md` files: every rule you need from them is restated in section 0.

Contents: 0 Rules for every M7 task. Then M7-T01 to M7-T29 in table order.

---

## 0. Rules for every M7 task

### 0.1 Finding what to read

- **M7-R1** Spec files are large and are edited between sessions. Never use a line number. Find a section by searching for its heading text exactly as this file prints it (for example search `### 2.6 ` in `docs/12-components-chrome-and-blueprints.md`) and read up to the next heading of the same or a higher level.
- **M7-R2** "Read first" lists are complete. Sizes are approximate. Read nothing else unless a failing command names another file. Short names: "doc 04" `docs/04-elements.md`; "doc 05" `docs/05-commerce.md`; "doc 06" `docs/06-bindings.md`; "doc 07" `docs/07-manifest-registry-cli.md`; "doc 12" `docs/12-components-chrome-and-blueprints.md`; "doc 13" `docs/13-testing.md`; "doc 14" `docs/14-liquid-theme.md`; "spec `<id>`" `docs/blueprints/<id>.md`.
- **M7-R3** A code block that a spec prints complete is the required starting text (D-113). Extract it with the extractor (0.3); do not retype it and do not read it into your context. Change it only where a named test fails, and then change the code, never the test. List every change in the pull request under "Deviations".
- **M7-R4** The Liquid text of every `layout/*.liquid` and `templates/*.liquid` file is owned by doc 12 and the blueprint specs (D-099). It is copied unchanged (PLAN 5.8 step 4). A Liquid file that fails a test is a spec defect: draft pull request, never a silent edit.

### 0.2 Values every M7 task uses

| Thing | Value | Source |
|---|---|---|
| Package placeholder | `ripple-kit`, read only from `PKG_NAME` in `src/identity.ts`; binary `ripple`; blueprint sources write `__PKG__`, which the registry build replaces | CONVENTIONS, D-052, doc 12 2.3 R-1 |
| Blueprint ids, install order | `layout`, `home`, `collection`, `collections-list`, `product`, `search`, `cart`, `blog`, `article`, `page`, `contact`, `not-found`, `password`, `gift-card` | doc 14 4.1 step 4, ledger 8.5 |
| Hosts | `html`, `react`, `remix`, `liquid`; backends `hydrogen` (the first three) and `liquid` | doc 07 4.4 |
| Page function names | `Layout` (blueprint `layout`), and `<Name>Page` with `<Name>` the PascalCase id: `HomePage`, `CollectionPage`, `CollectionsListPage`, `ProductPage`, `SearchPage`, `CartPage`, `BlogPage`, `ArticlePage`, `PagePage`, `ContactPage`, `NotFoundPage`, `PasswordPage`, `GiftCardPage`; props type `<Name>PageProps` (layout: `LayoutProps`) | doc 12 2.3, 2.5; the specs' Structure blocks |
| Query constants | `LAYOUT_QUERY`, `HOME_QUERY`, `COLLECTION_QUERY`, `COLLECTIONS_LIST_QUERY`, `PRODUCT_QUERY`, `SEARCH_QUERY`, `BLOG_QUERY`, `ARTICLE_QUERY`, `PAGE_QUERY`; `cart`, `not-found`, `password`, `gift-card` have no Storefront query; `contact` see PR-M7-9 | doc 12 2.5 first bullet |
| CLI invocation | `node <repository root>/pkg/bin/ripple.mjs <command>` with the example or theme directory as the working directory; from the repository root: `(cd examples/<host> && node ../../pkg/bin/ripple.mjs <command>)` | PR-M7-1 |
| Test names | `[T<n>] <subject>: <statement>`; blueprint tests use `<subject>` = the blueprint id (`[T2] cart: BT-3 ...`, `[T5] cart: CR-2 ...`); flat `test()` of `node:test`; `node:assert/strict`; no `describe` | doc 13 2.4 |
| Blueprint test file | `blueprints/<id>/<id>.test.ts` | doc 13 3.1 last paragraph |
| Tiers | `[T1]` no `pkg/`, no browser, no network; `[T2]` render comparison (uses `pkg/`); `[T5]` browser; `[T6]` browser with scripting disabled; `[T7]` mock.shop (`RIPPLE_NETWORK=1`) | doc 13 6.2, PR-M7-4 |
| Network | tiers 6 (hydrogen examples) and 7 need `RIPPLE_NETWORK=1` and `https://mock.shop/api`. Without it the tests skip with reason `RIPPLE_NETWORK is not 1` and `--no-skips` fails; a session without network runs `pnpm test`, lists the skips in the pull request, and the `verify` CI job is the proof | PLAN section 3 (paragraph after the checklist), doc 13 12.1 step 2 |
| Node below 24.3 | Remix cases skip with `Remix needs Node 24.3 or later (running <version>)`; run without `--no-skips`, confirm every skip reason, list them in the pull request | doc 13 T-7 |
| Proof commands | `pnpm typecheck && pnpm gen --check && pnpm build && pnpm examples:install && pnpm test --no-skips` (`pnpm ci`); while working: `pnpm test:unit --files=<path prefix>` | PLAN 5.0 |
| Blueprint definition of done | PLAN 3.3: `blueprint.json` validates; BT-1 to BT-7, BT-9 and the spec's acceptance tests pass in every host; the html file is generated; no CSS, no `style=`, no class outside `rp-` | PLAN 3.3 |

### 0.3 The extractor

Create once per session (not committed; `node_modules/` is git-ignored):

```bash
mkdir -p node_modules/.cache/ripple && cat > node_modules/.cache/ripple/extract.mjs <<'EOF'
import fs from "node:fs"; import path from "node:path"
const [file, heading, lang, n, out] = process.argv.slice(2)
const t = fs.readFileSync(file, "utf8")
const i = t.indexOf("\n" + heading)
if (i < 0) throw new Error("heading not found: " + heading)
let p = i
for (let k = 0; k <= Number(n); k++) { p = t.indexOf("\n```" + lang + "\n", p + 1); if (p < 0) throw new Error("code block not found") }
const s = p + lang.length + 5
const e = t.indexOf("\n```", s)
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, t.slice(s, e) + "\n")
console.log(out, e - s + 1, "bytes")
EOF
```

Usage: `node node_modules/.cache/ripple/extract.mjs <doc file> '<heading prefix>' <language> <index> <output path>`. "Bytes" is what the script prints; "First line" is the first line of the output (cut at 70 characters, shown with `…`). Both were checked on 2026-11-22. When either differs, the doc changed: stop and report; do not guess another block. The extractor finds only code fences that start at column 0. The index counts blocks of that language from the heading onwards, so index 1 under one heading may be in a later subsection; the rows below were checked with exactly these arguments.

Every extraction of this milestone is in this table. A task names rows by their key (`X-<n>`). Write outputs under `node_modules/.cache/ripple/m7/`, then copy to the target named by the task.

| Key | Output (under `node_modules/.cache/ripple/m7/`) | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|---|
| X-1 | `layout.tsx` | `docs/blueprints/layout.md` | `### Structure` | `tsx` | 0 | 4110 | `import type { ReactNode } from "react";` |
| X-2 | `theme.liquid` | `docs/blueprints/layout.md` | `### Structure` | `liquid` | 0 | 3597 | `<!doctype html>` |
| X-3 | `import-map.liquid` | `docs/blueprints/layout.md` | `### Structure` | `liquid` | 1 | 649 | `{% doc %}` |
| X-4 | `layout.graphql` | `docs/blueprints/layout.md` | `### Data requirements per backend` | `graphql` | 0 | 869 | `fragment RippleMenuItemFields on MenuItem { id title url }` |
| X-5 | `types.ts` | doc 12 | `### 2.4 ` | `ts` | 0 | 123 | `// blueprints/layout/<host>/types.ts` |
| X-6 | `menu.ts` | doc 12 | `### 1.2 ` | `ts` | 0 | 1925 | `// blueprints/layout/<host>/lib/menu.ts` |
| X-7 | `document.ts` | doc 12 | `### 2.6 ` | `ts` | 0 | 2018 | `// blueprints/layout/<host>/lib/document.ts` |
| X-8 | `locale-route.ts` | doc 12 | `#### Fallback for DS-5` | `ts` | 0 | 1682 | `// blueprints/layout/<host>/lib/locale-route.ts` |
| X-9 | `newsletter-route.ts` | doc 12 | `### 2.7 ` | `ts` | 0 | 2020 | `// blueprints/layout/<host>/lib/newsletter-route.ts` |
| X-10 | `product.blueprint.json` | doc 12 | `### 2.1 ` | `json` | 0 | 1414 | `{` |
| X-11 | `import-map.doc14.liquid` | doc 14 | `### 7.1 ` | `liquid` | 0 | 649 | `{% doc %}` |
| X-12 | `AGENTS.md` | doc 14 | `### 4.2 ` | `markdown` | 0 | 1885 | `# Ripple base theme` |
| X-13 | `DESIGN.md` | doc 14 | `### 4.3 ` | `markdown` | 0 | 909 | `# Design` |
| X-14 | `styles.css` | doc 14 | `### 5.2 ` | `css` | 0 | 395 | `@layer ui-sdk, theme, base, rp, components, rmx, utilities;` |
| X-15 | `settings_schema.json` | doc 14 | `### 6.1 ` | `json` | 0 | 1580 | `[` |
| X-20 | `home.tsx` | spec `home` | `### Structure` | `tsx` | 0 | 2040 | `import type { RippleCollection, RippleImage, RippleProduct } from "__P…` |
| X-21 | `home.liquid` | spec `home` | `### Structure` | `liquid` | 0 | 1473 | `{%- liquid` |
| X-22 | `home.graphql` | spec `home` | `### Data requirements per backend` | `graphql` | 0 | 687 | `fragment RippleProductCard on Product {` |
| X-23 | `collection.tsx` | spec `collection` | `### Structure` | `tsx` | 0 | 4028 | `import type { RippleCollection, RippleFilter, RippleFilterChip, Ripple…` |
| X-24 | `collection.liquid` | spec `collection` | `### Structure` | `liquid` | 0 | 2596 | `{% block 'container', py: '12 md:20' %}` |
| X-25 | `collection.graphql` | spec `collection` | `### Data requirements per backend` | `graphql` | 0 | 686 | `query RippleCollection(` |
| X-26 | `collections-list.tsx` | spec `collections-list` | `### Structure` | `tsx` | 0 | 1447 | `import type { RippleCollection } from "__PKG__";` |
| X-27 | `collections-list.liquid` | spec `collections-list` | `### Structure` | `liquid` | 0 | 959 | `{% block 'container', py: '12 md:20' %}` |
| X-28 | `collections-list.graphql` | spec `collections-list` | `### Data requirements per backend` | `graphql` | 0 | 374 | `query RippleCollectionsList($first: Int, $last: Int, $after: String, $…` |
| X-29 | `product.tsx` | spec `product` | `### Structure` | `tsx` | 0 | 2582 | `import type { RippleProduct, RippleProductDetail, RippleVariant } from…` |
| X-30 | `product.liquid` | spec `product` | `### Structure` | `liquid` | 0 | 1982 | `{%- liquid` |
| X-31 | `product.graphql` | spec `product` | `### Data requirements per backend` | `graphql` | 0 | 848 | `fragment RippleVariantFields on ProductVariant {` |
| X-32 | `search.tsx` | spec `search` | `### Structure` | `tsx` | 0 | 2367 | `import type { RippleProduct } from "__PKG__";` |
| X-33 | `search.liquid` | spec `search` | `### Structure` | `liquid` | 0 | 2012 | `{%- liquid` |
| X-34 | `search.graphql` | spec `search` | `### Data requirements per backend` | `graphql` | 0 | 439 | `query RippleSearch($terms: String!, $first: Int, $last: Int, $after: S…` |
| X-35 | `cart.tsx` | spec `cart` | `### Structure` | `tsx` | 0 | 1867 | `import type { RippleCart } from "__PKG__";` |
| X-36 | `cart.liquid` | spec `cart` | `### Structure` | `liquid` | 0 | 1130 | `{% block 'container', py: '12 md:20' %}` |
| X-37 | `blog.tsx` | spec `blog` | `### Structure` | `tsx` | 0 | 1406 | `import type { RippleArticle } from "__PKG__";` |
| X-38 | `blog.liquid` | spec `blog` | `### Structure` | `liquid` | 0 | 914 | `{% block 'container', py: '12 md:20' %}` |
| X-39 | `blog.graphql` | spec `blog` | `### Data requirements per backend` | `graphql` | 0 | 518 | `query RippleBlog($blog: String!, $first: Int, $last: Int, $after: Stri…` |
| X-40 | `article.tsx` | spec `article` | `### Structure` | `tsx` | 0 | 1557 | `import type { RippleImage } from "__PKG__";` |
| X-41 | `article.liquid` | spec `article` | `### Structure` | `liquid` | 0 | 1143 | `{%- liquid` |
| X-42 | `article.graphql` | spec `article` | `### Data requirements per backend` | `graphql` | 0 | 357 | `query RippleArticle($blog: String!, $article: String!, $country: Count…` |
| X-43 | `page.tsx` | spec `page` | `### Structure` | `tsx` | 0 | 594 | `import { Container } from "@components/container";` |
| X-44 | `page.liquid` | spec `page` | `### Structure` | `liquid` | 0 | 320 | `{% block 'container', width: 'prose', py: '12 md:20' %}` |
| X-45 | `page.graphql` | spec `page` | `### Data requirements per backend` | `graphql` | 0 | 180 | `query RipplePage($handle: String!, $country: CountryCode, $language: L…` |
| X-46 | `contact.tsx` | spec `contact` | `### Structure` | `tsx` | 0 | 2034 | `import { Banner } from "@components/banner";` |
| X-47 | `page.contact.liquid` | spec `contact` | `### Structure` | `liquid` | 0 | 2052 | `{%- liquid` |
| X-48 | `contact-route.ts` | spec `contact` | `### Structure` | `ts` | 0 | 1563 | `const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;` |
| X-49 | `not-found.tsx` | spec `not-found` | `### Structure` | `tsx` | 0 | 978 | `import { Button } from "@components/button";` |
| X-50 | `404.liquid` | spec `not-found` | `### Structure` | `liquid` | 0 | 522 | `{% block 'container', py: '12 md:20' %}` |
| X-51 | `password.tsx` | spec `password` | `### Structure` | `tsx` | 0 | 1898 | `import { Button } from "@components/button";` |
| X-52 | `layout.password.liquid` | spec `password` | `### Structure` | `liquid` | 0 | 532 | `<!doctype html>` |
| X-53 | `templates.password.liquid` | spec `password` | `### Structure` | `liquid` | 1 | 1383 | `{% layout 'password' %}` |
| X-54 | `gift-card.tsx` | spec `gift-card` | `### Structure` | `tsx` | 0 | 1861 | `import { Banner } from "@components/banner";` |
| X-55 | `gift_card.liquid` | spec `gift-card` | `### Structure` | `liquid` | 0 | 1677 | `{%- liquid` |

`snippets/meta-tags.liquid` has no code block: doc 14 `### 7.6 ` (D-109) defines it as `theme/snippets/meta-tags.liquid` with two key renames and prints the one command that produces it (M7-T06 step 3). `theme/` is read, never edited. X-3 and X-11 are the same file printed twice (doc 14 owns it, D-099 item 2): M7-T06 uses X-11 and checks `cmp` against X-3.

### 0.4 What exists before M7 and what each task replaces

| Thing | State before M7 | Replaced by |
|---|---|---|
| `blueprints/` | does not exist (PLAN 4.4; M6 works with zero blueprints, `buildRegistryIndex` writes `blueprints: {}`) | M7-T01 (`_sample/`), M7-T05 to M7-T19 |
| `loadBlueprintSample(id, root = "blueprints")` | in `src/testing/fixtures.ts` since M0-T10 (doc 13 4.1 text), NOT RUN; its gate is `[T1] fixtures: blueprint samples resolve` | M7-T01 makes the gate run against real files |
| `const BRINGUP = true // PLAN 4.4: set false and delete in M7-T29` | in `src/testing/fixtures.test.ts` and `src/testing/resources.test.ts` (M0-T10): guards "every key of `RESOURCES` is referenced" and the `layout` sample assertion | M7-T28 (PR-M7-3) |
| `src/gen/index.ts` marker | `// PLAN 4.4: G9 added by M6-T01, G10 added by M7-T02` (text fixed by M5) | M7-T02 removes the G10 half |
| `examples/{html,react,remix}/` | M0-T31 skeletons: `package.json` (`private`, `type: module`, scripts `build` = `node -e ""` and `start` = `node server.mjs`, dependency `ripple-kit: file:../../pkg`, `@shopify/hydrogen 2026.10.3`, react `react`/`react-dom` 19.3.1, remix `remix` 3.3.0), `server.mjs` (`GET /` 200, else 404; remix: `/__rp/morph/a` and `/b` under `RIPPLE_TEST_ROUTES=1`, rendering since M1-T01), committed lockfiles, `examples/.gitignore` | M7-T04 (components), M7-T20 to M7-T22 (apps) |
| `examples/react/.ripple-conformance/`, `examples/remix/.ripple-conformance/` | conformance work directories, git-ignored (doc 13 X-1) | unchanged |
| `examples/liquid/` | does not exist | M7-T04 (steps 1 to 3 of doc 14 4.1), M7-T23 (steps 4 to 6) |
| `test/support/examples.ts` | `startExample(host)` (doc 13 12.1 steps 1 to 6); `liquid` returns `serveTheme({ themeRoot: "examples/liquid" })` | unchanged |
| `test/support/golden-theme.ts` | `buildGoldenTheme(): string` (M1-T39, PLAN P-3) used by three theme-server tests in `test/liquid/shim.test.ts` | M7-T27 deletes it |
| `test/support/hosts/liquid.ts` | `LIQUID_WORK_DIR`, `buildLiquidWorkDir()` (doc 13 7.x) | unchanged; M7-T03 reuses it |
| `src/testing/liquid-shim.ts`, `src/testing/serve-theme.ts` | `createShim(themeRoot, options).renderPage(template, scope)`; `serveTheme(options)` with `DEFAULT_THEME_ROUTES`, catalogue ST-3 (`/products/linen-shirt` serves `product.options`) | unchanged |
| `test/commerce/liquid.test.ts` | C-01 to C-08, C-18, C-29 | M7-T27 adds C-30 |
| CLI | every command of D-057 (M6 gate); `pkg/bin/ripple.mjs` is the built CLI; `bin/ripple.mjs` imports `../dist/cli/index.mjs`, which exists only inside `pkg/` | unchanged |
| Comments `// AT-<n>: generic (test/nojs/blueprints.test.ts NJ-F<k>, added by M7-T25)` and `// AT-<n>: generic (test/commerce/e2e.test.ts, added by M7-T26)` | in component test files (M1, M4, M5) | M7-T25 and M7-T26 make every such reference true (step "references") |

### 0.5 Names chosen by this plan (the specs are silent)

Separate sessions must agree on these. Each is PLAN-CHOSEN and internal (none is a package export). When a spec section you read names the same thing differently, the spec wins; use its name and record it in the done file.

| Identifier | File | Signature and meaning | Created by |
|---|---|---|---|
| `generateBlueprintHtml` | `src/gen/index.ts` | spec name (doc 07 3.2 row G10); signature `(id: string, root?: string) => Promise<string>`, `root` default `"."`; returns the file text (document plus `\n`); the step G10 loop calls it for every directory `blueprints/<id>/` except `_sample` | M7-T02 |
| `G10_DOCUMENT` | `src/gen/index.ts` | the constant parts of 0.6 | M7-T02 |
| `test/support/blueprints.ts` | new file | the blueprint test helper of 0.7 | M7-T03 |
| `installBlueprint`, `renderBlueprint`, `blueprintSharedTests`, `RenderedPage` | `test/support/blueprints.ts` | 0.7 | M7-T03 |
| `.ripple-blueprints/` | `examples/<host>/.ripple-blueprints/` (npm hosts) and `node_modules/.cache/ripple/test/blueprints/liquid/` | temporary install copies of 0.7; the npm ones are git-ignored by a line in `examples/<host>/.gitignore` | M7-T03 |
| Example source layout | 0.8 | `src/server.tsx`, `src/client.tsx`, `src/data.ts`, `src/routes.ts`, `build.mjs`, `server.mjs` | M7-T20 to M7-T22 |
| `test/liquid/theme.test.ts` | new file | the theme acceptance tests A-1 to A-19, A-24, A-25 (doc 14 14: "Tests live in `test/liquid/`"; doc 13 3.1 lists no such file) | M7-T24 |
| `test/conformance/blueprints.test.ts` | new file | `[T1]`/`[T2]` cross-blueprint checks: every `blueprint.json` validates and lists the components and regions of its spec | M7-T03 (created empty with one test), each blueprint task appends nothing (the test iterates the directory) |

### 0.6 G10 document parts (Plan reading PR-M7-2)

doc 07 row G10 calls `renderDocument` but does not say what `DocumentParts` it passes. The html file MUST be the document an `html` host serves (doc 12 DS-1 to DS-8), so:

| Field | Value |
|---|---|
| `lang` | `"en"` (English only, D-098 item 4) |
| `dir` | `"ltr"` |
| `title` | the `title` of `blueprints/<id>/blueprint.json` |
| `description` | omitted |
| `stylesheets` | `["/ripple/tokens.css", "/ripple/ripple.css"]` (DS-1) |
| `head` | `""` (the html host has no Hydrogen script tags in a static file; UNVERIFIED that `ripple check` layer H accepts that) |
| `commerce` | `{ "host": "html", "cartEndpoint": "/api/cart", "cartUrl": "/cart" }` (DS-3 with an empty path prefix; no `initialCart`, H-2) |
| `scripts` | `["/ripple/ripple.js"]` (DS-2, html) |
| `body` | `renderToString(<Layout {...layout}><XPage {...page} /></Layout>)` with `layout` = the props of `blueprints/_sample/layout.json` with `cart: null` and `cartPage: id === "cart"` (L-B, H-2); for `layout` itself the child is empty; for `password` the page is rendered without `Layout` (the spec: PasswordPage prints its own SkipLink and `<main>`) |

### 0.7 Blueprint test helper (Plan reading PR-M7-4)

doc 12 2.8 defines BT-1 to BT-9 but no harness; doc 13 owns none for blueprints. Every blueprint task uses this one, created by M7-T03. "Examples produced by the CLI" (gate M7) is met because every rendered page is the CLI's install output.

- `installBlueprint(host: Host, id: string): string`. Copies `examples/<host>` (without `node_modules`, `.ripple-conformance`, `.ripple-blueprints`) to `examples/<host>/.ripple-blueprints/<id>/` (liquid: `node_modules/.cache/ripple/test/blueprints/liquid/<id>/`), recreating it; runs, with that directory as working directory, `node <abs>/pkg/bin/ripple.mjs add --blueprint layout` and then `... add --blueprint <id>` (skip the second for `layout`); fails with the captured output when either exits non-zero; returns the absolute directory. Because the CLI reads `pkg/registry/`, a changed blueprint source needs `pnpm build` before the test (write this in the file header).
- `renderBlueprint(host, id): Promise<RenderedPage>` with `RenderedPage = { html: string; dir: string }`:
  - `react`: esbuild bundle (platform node, format esm, `jsx: "automatic"`, `nodePaths: [<abs>/examples/react/node_modules]`) of a generated entry that imports `Layout` from `<pages>/layout.tsx`, the page from `<pages>/<id>.tsx` and `renderDocument` from `<pages>/lib/document.ts`, renders with `react-dom/server` `renderToString`, and returns `renderDocument(parts)` with the parts of 0.6 except `commerce.host` = `"react"` and `scripts` = `[]`. Props from `loadBlueprintSample("layout").props` and `loadBlueprintSample(id).props`; the layout gets `cart: null`, `cartPage: id === "cart"`.
  - `remix`: the same with `jsxImportSource: "remix/component"`, `external: ["remix", "remix/*"]`, `renderToString` from `remix/component/server` (awaited) and `commerce.host` `"remix"`; availability as `test/support/hosts/remix.ts` (T-7 skip reason).
  - `password` on `react` and `remix`: the page is rendered without `Layout` (0.6); `renderBlueprint` checks `id === "password"`.
  - `html`: the text of `<pages>/<id>.html` from the install directory.
  - `liquid`: `createShim(dir).renderPage(<template>, scope)` where `<template>` is the blueprint's template file name without `templates/` and `.liquid` (`index`, `collection`, `list-collections`, `product`, `search`, `cart`, `blog`, `article`, `page`, `page.contact`, `404`, `password`, `gift_card`) and `scope` = `{ ...loadBlueprintSample("layout").liquid, ...loadBlueprintSample(id).liquid }`. For `layout` render `templates/page.liquid` from the page sample only when that blueprint exists; otherwise render a template written by the helper containing `{{ '' }}` (UNVERIFIED that the shim accepts a template outside the theme's file set; fallback: write it into `templates/rp-empty.liquid` of the install copy).
- `blueprintSharedTests(id, options?: { masks?: string[]; skip?: Array<"BT-4" | "BT-5"> })` registers, in the calling file:
  - `[T2] <id>: BT-1 tsx type-checks against the installed bindings` (react and remix install copies: `tsc --noEmit -p <generated tsconfig>` with `paths` `{ "__PKG__": ["<abs>/src/index.ts"] }`, `jsx` per host; exit 0) and `[T2] <id>: BT-1 liquid passes Theme Check and renders` (`themeCheckRun` of `@shopify/theme-check-node` with the Ripple configuration of doc 06 section 8 on the liquid install copy: zero offenses in the blueprint's files; `renderBlueprint("liquid", id)` resolves). Tier 2, not 1: both need `pkg/` (PR-M7-4).
  - `[T2] <id>: BT-2 every host passes ripple check` (for each host: `check` of `<pkg>/check` on the rendered document, layers S and H, zero errors) and the fixture-contract lint (PR-M7-5).
  - `[T2] <id>: BT-3 main children are equal in every host` (canonicalise with `src/testing/canonicalize.ts` and the masks of the embedded components; compare the children of `<main>` of react, remix and html; liquid with `options.masks` added).
  - `[T2] <id>: BT-4 landmarks and id references` and `[T2] <id>: BT-5 regions` (both per host; omitted when listed in `skip`).
  - `[T6] <id>: BT-6 no-JS axe and steps` (axe on each rendered document served by `getFixtureServer()` with `scripts: "disabled"`; the spec's "No-JS behaviour" steps are written as separate tests by the blueprint task).
  - `[T5] <id>: BT-7 no console error and every element defined` (scripts on; the rendered document served with `/ripple/*` mapped to `pkg/browser/` and `pkg/css/`; liquid through `serveTheme({ themeRoot: <install copy> })`).
  - `[T1] <id>: BT-9 source files have no style and only rp- classes` (scan `blueprints/<id>/{react,remix,liquid}/**`: no `style=`, no `<style`, every `class`/`className` token starts with `rp-`).
- Pure checkers exported for reuse and unit-tested by M7-T03: `checkLandmarks(html): string[]` (BT-4), `checkRegions(html, regions, liquidSources?): string[]` (BT-5), `checkSourceClasses(files): string[]` (BT-9); each returns the list of violations.

### 0.8 Example application layout (Plan reading PR-M7-6)

doc 13 12.1 fixes the contract (scripts, routes, mock.shop through `@shopify/hydrogen`, `cart-drawer`, `RIPPLE_TEST_ROUTES`), not the source tree. The three npm examples use one shape:

| Path | Meaning |
|---|---|
| `ripple.json` | written by `ripple init` (M7-T04) |
| `server.mjs` | the `start` script (kept from M0-T31): imports the built `dist/server.mjs` and listens on `127.0.0.1:${PORT}` |
| `build.mjs` | the `build` script: esbuild bundles `src/server.tsx` to `dist/server.mjs` (node) and, react and remix only, `src/client.tsx` to `public/client.js` (browser); devDependency `esbuild` at the repository's exact version (`0.28.2`, root `package.json`) |
| `src/data.ts` | Storefront client and loaders: one function per route that runs the blueprint's `<X>_QUERY` with `$country`/`$language` and maps the result to the page props; mock.shop through `@shopify/hydrogen` (doc 05 10.1). Framework-neutral; M7-T21 and M7-T22 copy it unchanged |
| `src/routes.ts` | route table: the routes of doc 12 2.1 column `route`, plus `/api/cart` (doc 05 10.3), `/api/locale` (doc 12 2.6 locale route), `/api/newsletter` (doc 12 2.7), `/api/contact` (spec `contact`, `lib/contact-route.ts`); an unknown handle renders `not-found` with status 404 (doc 12 2.5 fourth bullet) |
| `src/server.tsx` | request handler: route, load, render `renderDocument` (doc 12 2.6, DS-1 to DS-8), serve `public/` at `/` (so `public/ripple/*` is `/ripple/*`) |
| `src/client.tsx` | react: `configureCommerce` then `hydrateRoot(document.body, ...)` (DS-5 or its fallback); remix: the Remix client entry (DS-6) |
| `.gitignore` | `dist/`, `public/client.js`, `.ripple-blueprints/` (and `.ripple-conformance/`, already there) |

`ripple init` paths (M7-T04): react `--components src/components/ripple --styles public/ripple --pages src/pages --css none`; remix `--components app/components/ripple --styles public/ripple --public public/ripple --pages app/pages --css none`; html `--components components/ripple --styles public/ripple --public public/ripple --pages pages --css none`. `--styles public/ripple` puts `tokens.css` and `ripple.css` where DS-1's `/ripple/` URLs find them. On remix, `src/` holds the server code and `app/` the installed files; this is allowed (6.1 paths are free).

### 0.9 Plan readings made by this file

Each is the smallest choice that keeps the gates green where two specs conflict or all are silent. The task that first applies one adds one line under `## Ledger issues` of the named owning doc (text: `<PR id>: <topic> (docs/plan/M7-blueprints-examples.md 0.9)`) and mentions it in the pull request.

| # | Topic | The specs | Reading | Owning doc | Applied by |
|---|---|---|---|---|---|
| PR-M7-1 | CLI path in the theme build | doc 14 4.1: "run `node bin/ripple.mjs` with `examples/liquid` as the working directory". No `bin/` exists there, and the repository's `bin/ripple.mjs` imports `../dist/cli/index.mjs`, which exists only in `pkg/` | Run `node ../../pkg/bin/ripple.mjs` from `examples/liquid` (0.2) | doc 14 | M7-T04 |
| PR-M7-2 | `DocumentParts` of G10 | doc 07 G10 calls `renderDocument`; nothing fixes title, head, lang, commerce | 0.6 | doc 07 | M7-T02 |
| PR-M7-3 | Who flips `BRINGUP` | M0: "set false and delete in M7-T29"; PLAN 3.5: a gate task changes no source | M7-T28 deletes both constants and their guards | PLAN | M7-T28 |
| PR-M7-4 | Blueprint test harness and BT-1 tier | doc 12 2.8: BT-1 "(tier 1)", but it type-checks against installed bindings (needs `pkg/` and the examples); no harness | 0.7; BT-1 is `[T2]` | doc 12 | M7-T03 |
| PR-M7-5 | "contract lint of `02-html-contract.md` section 14" in BT-2 | doc 02 section 14 is the evidence section; the fixture lint is doc 02 11.8 | BT-2 runs the lint of 11.8 that applies to documents (UNVERIFIED which rules apply to a whole page; when 11.8 is per-fixture only, BT-2 runs `ripple check` only and the done file says so) | doc 12 | M7-T03 |
| PR-M7-6 | Example source tree, `ripple init` paths | doc 13 12.1 contract only | 0.8 | doc 13 | M7-T04, M7-T20 |
| PR-M7-7 | html example rendering | doc 12 2.3: the html host's page files are generated documents with the sample data; doc 13 12.1: the html example serves mock.shop data | `examples/html` serves the installed `pages/*.html` unchanged for every route except `/api/*` (the CLI output, which uses the sample data); its `/api/cart` uses the hydrogen cart handler. Tier 7 on html then tests the sample-data page with a live cart (UNVERIFIED that E2E-2 finds a variant id that mock.shop accepts: the sample ids are fixture ids; when E2E-2 fails for this reason, the fallback is the react render path with host `html`, which M7-T22 chooses and reports) | doc 13 | M7-T22 |
| PR-M7-8 | Fragments in query constants | the specs print each fragment once (`RippleProductCard`, `RippleCollectionCard` in `home`; `RippleVariantFields` in `product`; `RippleMenuItemFields` in `layout`) and say the tsx files are complete except the constant | Each `<X>_QUERY` is the blueprint's graphql block followed, after one blank line, by every fragment block it spreads that the block itself does not define, copied from the spec that defines it | doc 12 | first blueprint task that needs it |
| PR-M7-9 | Query of `contact` | doc 12 2.5: "`<BLUEPRINT>_QUERY`"; spec `contact` loads the page with handle `contact` through the `page` query | `contact.tsx` exports no query constant; `src/data.ts` runs `PAGE_QUERY` with `handle: "contact"`. When `contact.tsx` (X-46) references a constant, follow the file | spec `contact` | M7-T16 |
| PR-M7-10 | Client navigation tests (CL-7, PR-7, LT-9 where they say "client navigation" on react/remix) | the React file has no router (2.3); BP-11 | Run them against the example app in tier 7 (`test/commerce/e2e.test.ts` style, `startExample`), name them `[T7] <id>: <ACC-ID> ...` in the blueprint test file; without network they skip | doc 12 | M7-T08, M7-T10 |
| PR-M7-11 | Route-code tests (CL-5 = CO-R1 to CO-R3, NF-1 hydrogen 404) | they test route code, which lives in the examples (M7-T20) | Written by the blueprint task against the route code it can call: CL-5 against the filter/sort URL helpers named in spec `collection`; NF-1 as `[T7] not-found: NF-1 ...` with `startExample("react")` | spec `collection`, spec `not-found` | M7-T08, M7-T17 |
| PR-M7-12 | Password layout reads `ripple.blueprints.layout.skip` | BP-6 / doc 07 generation check: every key a file reads is in its owner's locale file | Leave the key in the `layout` table; `password` depends on `layout` being installed first (order of 0.2). Record the ledger issue; no code change | doc 12 | M7-T18 |
| PR-M7-13 | Locale patch entry for blueprints without keys | doc 12 2.1 example `product` lists a `locale` entry; spec `product` has no locale keys; M6 keeps a `locale` entry only when the owner has a generated locale file | `blueprint.json` of a blueprint with no key table (`product`, `page`) has no `locale` entry | doc 12 | M7-T10 |
| PR-M7-14 | `title` and `summary` of `blueprint.json` | doc 12 2.1 gives them only for `product` (`Product page`; one sentence) | `title`: the id in words, capitalised, plus ` page` (`Home page`, `Collections list page`, `Not found page`, `Gift card page`; `layout`: `Layout`); `summary`: the first sentence of the spec's `### Purpose` | doc 12 | M7-T05 |

### 0.10 Order constraints the task table does not show

| Task | Also needs | Why |
|---|---|---|
| M7-T03 | none to start; its first real use is M7-T05 | the helper's own tests are pure |
| M7-T06 | M7-T01 | `layout.json` sample |
| M7-T07 to M7-T19 | M7-T01, M7-T03 (through M7-T06) | 0.7 installs `layout` first and reads the samples |
| M7-T21, M7-T22 | M7-T20 | they copy `src/data.ts` and the route table (recommendation: add the dependency to the table) |
| M7-T25 | M7-T24 is not needed | separate files |
| M7-T27 | M7-T23 | `examples/liquid` |

### 0.11 Shared files that several M7 tasks edit

Edit only what your task names. On a `git rebase origin/main` conflict keep both sides' lines, then re-run the proof commands.

| File | Rule |
|---|---|
| `locales/en.default.json` | each blueprint task adds only its own `ripple.blueprints.<id>` object; keys sorted as the spec's key table |
| `blueprints/_sample/<id>.json` | M7-T01 creates every file; a blueprint task edits only its own file and `layout.json` only in M7-T05/M7-T06 |
| `test/support/blueprints.ts` | M7-T03 creates; a blueprint task MUST NOT change it; a defect is fixed in a separate commit `M7-T03 fix: <defect>` when under 20 lines |
| `examples/<host>/` | M7-T04 installs; M7-T20 to M7-T23 add the apps; no blueprint task writes there except through 0.7 temporary copies |
| `src/gen/index.ts` | M7-T02 only |
| `components/*/` manifests | M7-T28 only (`status`) |

### 0.12 Definition of done reminder

Every task ends with PLAN section 5.0 (commit, push, pull request in the five-heading form, done file `docs/plan/done/<task id>.md`). Blueprint tasks also satisfy PLAN 3.3. "Acceptance" lists what is specific; PLAN section 3.1 always applies. A task that cannot finish opens a draft pull request and writes no done file (PLAN 1 item 7).

---

## M7-T01 Blueprint sample data `blueprints/_sample/<id>.json` and `layout.json` skeletons; `loadBlueprintSample`

- **Goal:** Create the 15 sample files that G10 and the blueprint tests read, each holding every prop key of its page function with empty or fixture values, and make the gate test of `loadBlueprintSample` run on them.
- **Depends on:** M5-T15.
- **Kind:** `blueprint`. Size M. Group A.

### Read first

doc 12: `### 2.5 ` (4 kB, the last bullet "Sample data for H-1 ..." in full), `### 1.6 ` (fixture resources; 3 kB). doc 13: `### 4.1 ` only the `BlueprintSample` interface, `loadBlueprintSample` and rule FX-5 (search `export interface BlueprintSample`; 1.5 kB). Repository: `src/testing/resources.ts` (the export list and the keys of `RESOURCES`: `grep -n '^  "' src/testing/resources.ts | head -80`), `src/testing/fixtures.test.ts` (the test `[T1] fixtures: blueprint samples resolve` and the `BRINGUP` constant). This file 0.4, 0.5. For the prop keys: the `export interface <Name>PageProps` lines of each spec's `### Structure` tsx block (`grep -n -A 25 'export interface' docs/blueprints/<id>.md`, about 1 kB each; read only the interfaces).

### Files

Create: `blueprints/_sample/layout.json` and `blueprints/_sample/<id>.json` for the 13 page blueprints (`home`, `collection`, `collections-list`, `product`, `search`, `cart`, `blog`, `article`, `page`, `contact`, `not-found`, `password`, `gift-card`). Change: `src/testing/fixtures.test.ts` (one test added). Must not change: `src/testing/fixtures.ts`, `src/testing/resources.ts`, the `BRINGUP` constant.

### Steps

1. Branch `task/M7-T01-blueprint-samples`. Create the extractor (0.3) for later tasks; this task extracts nothing.
2. For each of the 14 ids write one JSON object (2-space indent, final newline) whose top-level keys are exactly the props of the page function, in the interface's order, plus `"$liquid"`. Prop keys (from the specs' interfaces; re-check each against the spec and follow the spec where it differs):

   | File | Prop keys |
   |---|---|
   | `layout.json` | `shop`, `menu`, `footerMenu`, `policies`, `cart`, `locale`, `path`, `announcement`, `newsletterStatus`, `searchResults`, `cartPage`, `year` (not `children`, not `cartAction`) |
   | `home.json` | `hero`, `featured`, `collections` |
   | `collection.json` | `collection`, `products`, `count`, `filters`, `chips`, `pathname`, `sortOptions`, `sort`, `sortBy`, `params`, `pageInfo`, `viewEvent` |
   | `collections-list.json` | `collections`, `pageInfo` |
   | `product.json` | `product`, `variant`, `search`, `recommended`, `viewEvent` |
   | `search.json` | `terms`, `results`, `count`, `pageInfo`, `viewEvent` |
   | `cart.json` | `cart`, `viewEvent` |
   | `blog.json` | `blog`, `articles`, `pageInfo` |
   | `article.json` | `article`, `blog` |
   | `page.json` | `page` |
   | `contact.json` | `page`, `status` (value `"idle"`) |
   | `not-found.json` | `homeUrl` (`"/"`), `searchUrl` (`"/search"`) |
   | `password.json` | `shopName`, `message`, `action`, `error` |
   | `gift-card.json` | `balance`, `code`, `state`, `expiresLabel`, `passUrl`, `homeUrl` |

3. Values: every product, collection, cart, image, article or menu value is a `{ "$resource": "<type>.<name>" }` reference to a key of `RESOURCES` (doc 12 2.5: the fixture resources of 1.6 and the commerce fixtures of doc 11); lists that the blueprint task will fill are `[]`; text values are short English strings; `cart` in `layout.json` is `{ "$resource": "cart.<name>" }` (G10 replaces it with `null`, 0.6). The `$liquid` object holds only globals the Liquid templates read that have no TSX prop (doc 12 L-D list); in this task it is `{}` except `layout.json`, which gets `"template": { "name": "index" }`. The blueprint tasks complete both halves (PLAN 5.8 step 6).
4. Add to `src/testing/fixtures.test.ts`: `[T1] fixtures: every blueprint sample loads and has the keys of its page` (for each of the 14 ids: `loadBlueprintSample(id)` does not throw; `Object.keys(props)` equals the table of step 2, written as a constant in the test). The table is the test's own copy; a later blueprint task that finds a spec key missing changes both the file and this constant.
5. Run `pnpm test:unit --files=src/testing/fixtures`. The existing test `[T1] fixtures: blueprint samples resolve` now asserts `layout` (the file exists).
6. Proof: PLAN 5.0.

### Acceptance

`ls blueprints/_sample/*.json | wc -l` prints `14`. `pnpm test:unit --files=src/testing/fixtures --no-skips` passes, including the new test. `node -e "for (const f of require('fs').readdirSync('blueprints/_sample')) JSON.parse(require('fs').readFileSync('blueprints/_sample/'+f,'utf8'))"` exits 0.

### Out of scope

Blueprint sources, `blueprint.json` files, G10, the Liquid scope of each template beyond `{}` (blueprint tasks). Changing `loadBlueprintSample` (its text is doc 13 4.1). Deleting `BRINGUP` (M7-T28).

### If blocked

- A resource the spec's data needs is not in `RESOURCES`: use the closest existing one, list the gap in the done file under "notes for later tasks" for the blueprint task; adding resources is owned by doc 13 4.x and is not this task.
- The `resources` test "every key of `RESOURCES` is referenced" fails once samples exist: it is guarded by `BRINGUP` (true); leave it.

---

## M7-T02 Generator step G10 `generateBlueprintHtml` in `src/gen/index.ts`

- **Goal:** Implement step G10 so that `pnpm gen` writes `blueprints/<id>/html/<id>.html` for every blueprint that exists and `pnpm gen --check` reports a stale or hand-edited one.
- **Depends on:** M5-T15.
- **Kind:** `gen`. Size M. Group A.

### Read first

doc 07: row G10 of the generator table in `### 3.2 ` (1.5 kB; search `G10 HTML blueprints`), the two rows `pnpm gen` and `pnpm gen --check` of the same section. doc 12: `### 2.3 ` rules H-1 and H-2 only (1 kB), `### 2.6 ` the `DocumentParts` interface and DS-1 to DS-3, DS-7, DS-8 (3 kB). doc 05: `### 10.1 ` rule 4 (0.5 kB). This file 0.5, 0.6. Repository: `src/gen/index.ts` (the step list, the `PLAN 4.4` marker, how G1 to G9 report written and stale files: `grep -n 'stale\|wrote\|PLAN 4.4' src/gen/index.ts`).

### Files

Change: `src/gen/index.ts`. Create: `src/gen/blueprint-html.test.ts`. Must not change: any `blueprints/**` file, `src/gen/build.ts`.

### Steps

1. Branch `task/M7-T02-g10`.
2. In `src/gen/index.ts` add `export async function generateBlueprintHtml(id: string, root = "."): Promise<string>` implementing the five-step procedure of row G10, with these specifics:
   - Step (1): one esbuild `build` with `write: false`, `bundle: true`, `platform: "node"`, `format: "esm"`, `jsx: "automatic"`, an entry written to `stdin` that imports `Layout` from `blueprints/layout/react/layout.tsx`, the page function (0.2 names) from `blueprints/<id>/react/<id>.tsx`, `renderDocument` from `blueprints/layout/react/lib/document.ts`, and `renderToString` from `react-dom/server`; a plugin resolves `@components/<c>` (and `@components/<c>.data`) to `<root>/components/<c>/react/<c>.tsx` (`.data.ts`) and `__PKG__` (and `__PKG__/<sub>`) to `<root>/src/index.ts` (`<root>/src/<sub>/index.ts`). Load the bundle with `import("data:text/javascript;base64,...")` or a file under `node_modules/.cache/ripple/gen/`.
   - Step (2): before bundling, check that `blueprints/_sample/<id>.json` and `blueprints/_sample/layout.json` exist; a missing one throws `gen: blueprints/_sample/<file>.json: missing` (the message of G10; do not rely on the different message of `loadBlueprintSample`). Read props with `loadBlueprintSample` (`.props`).
   - Steps (3) and (4): the parts of 0.6. H-2 is met by `cart: null` in the layout props; do not post-process the string.
   - Step (5): return the document plus `"\n"`.
3. Wire G10 into the step list: for each directory under `blueprints/` except `_sample`, in ascending order, when `blueprints/<id>/react/<id>.tsx` exists, compute the file and treat `blueprints/<id>/html/<id>.html` like every other committed output (written by `pnpm gen`, compared by `--check`). With zero blueprints G10 does nothing. Replace the marker with `// PLAN 4.4: G9 added by M6-T01` (or delete it when G9 is already done and the G9 half is gone).
4. Tests in `src/gen/blueprint-html.test.ts`:
   - `[T1] gen: G10 does nothing without blueprints` (temporary root with `components/`, `src/` symlinked or absent and no `blueprints/`: the G10 output list is empty).
   - `[T1] gen: G10 fails on a missing sample` (temporary root with `blueprints/demo/react/demo.tsx` and no sample: rejects with `gen: blueprints/_sample/demo.json: missing`).
   - The comparison with a committed file is added by M7-T06 (`[T1] gen: G10 output equals the committed layout.html`), when `layout` exists.
5. Proof: PLAN 5.0.

### Acceptance

`pnpm gen --check` exits 0 on the tree (no blueprint yet). `pnpm test:unit --files=src/gen/blueprint-html --no-skips` reports 2 passed. `grep -c 'G10 added by M7-T02' src/gen/index.ts` prints `0`. `grep -c 'export async function generateBlueprintHtml' src/gen/index.ts` prints `1`.

### Out of scope

The blueprint sources and their html files (M7-T05 onwards). Copying html files into `pkg/registry/` (M6-T01 `buildRegistry` already copies `blueprints/<id>/<host>/**`). The Remix extras of doc 07 2.4.

### If blocked

- `react-dom/server` is not a root dev dependency: doc 07 row G10 says it must be; add `react` and `react-dom` at the exact versions of doc 01 section 5.1 (19.3.1) to the root `devDependencies` and say so in the pull request.
- An `@components/<c>.data` file does not exist for a helper import: resolve to `components/<c>/<c>.data.ts` after `grep -rn "\.data\"" blueprints/` shows the import; report the path used.

---

## M7-T03 Blueprint test support: shared tests BT-1 to BT-7, BT-9 as a helper used by every `blueprints/<id>/<id>.test.ts`

- **Goal:** Create `test/support/blueprints.ts` (0.7), so that each blueprint task adds its shared tests with one call and its own acceptance tests with the same rendered pages.
- **Depends on:** M6-T35, M7-T01.
- **Kind:** `harness`. Size M. Group B.

### Read first

doc 12: `### 2.2 ` (rules BP-1 to BP-11; 4 kB), `### 2.8 ` (whole; 2.5 kB), `### 1.5 ` (fixed ids; 1.5 kB). doc 13: in the host adapters section the files `test/support/hosts/liquid.ts` (function `buildLiquidWorkDir`) and the table of `test/support/hosts/remix.ts` differences (search `is the same file with these differences`; 2 kB), `### 12.1 ` (1.5 kB). This file 0.2, 0.7. Repository: `test/support/hosts/react.ts` (how it bundles with esbuild), `test/support/server.ts` (exports), `test/support/browser.ts` (exports), `src/testing/canonicalize.ts` (exports), the export list of `pkg/check/index.d.ts` after `pnpm build`.

### Files

Create: `test/support/blueprints.ts`, `test/support/blueprints.test.ts`, `test/conformance/blueprints.test.ts`. Change: `examples/react/.gitignore`, `examples/remix/.gitignore`, `examples/html/.gitignore` (create when absent; one line `.ripple-blueprints/`). Must not change: `test/support/hosts/*`, `test/support/examples.ts`.

### Steps

1. Branch `task/M7-T03-blueprint-tests`.
2. Write `test/support/blueprints.ts` with the four functions and three checkers of 0.7. File header comment: `// Blueprint test helper (docs/plan/M7-blueprints-examples.md 0.7). Run pnpm build after changing a blueprint file: installs read pkg/registry/.`
3. `checkLandmarks(html)`: parse with the parser the canonicaliser uses; violations for: not exactly one `main`, one `h1`, one `header.rp-header`, one `footer.rp-footer`; a duplicate `id`; an `href="#x"`, `data-rp-open`, `commandfor`, `popovertarget`, `for`, `aria-labelledby` (each token), `aria-describedby` (each token), `form` value naming no id (BT-4 wording). `checkRegions(html, regions, liquidSources?)`: every `data-rp-refresh` token has a `[data-rp-region]` of that name; every listed region is present; with `liquidSources` (the template and layout texts) every region name occurs as `{% partial '<name>' %}` exactly once across them (BT-5). `checkSourceClasses(files)`: BT-9.
4. `blueprintSharedTests(id, options)` registers the tests of 0.7 with exactly those names. Tests that need Remix use the availability rule of `test/support/hosts/remix.ts`; tests that need a browser use `openPage()`/`settled()`; BT-6 uses the axe rule set of doc 13 10.3 (`test/a11y/` helper exports; read the export list only).
5. `test/support/blueprints.test.ts` (pure, no `pkg/`):
   - `[T1] blueprints: checkLandmarks reports a missing h1 and a dangling for`.
   - `[T1] blueprints: checkRegions reports a refresh name with no region and a duplicate partial`.
   - `[T1] blueprints: checkSourceClasses reports style= and a non-rp class`.
6. `test/conformance/blueprints.test.ts`: `[T1] blueprints: every blueprint.json validates and matches its directory` (for each `blueprints/<id>/blueprint.json`: `name` equals `<id>`; every `files.<host>[].source` exists, except the html source before `pnpm gen`; with zero blueprints the test passes and asserts nothing more).
7. Proof: PLAN 5.0.

### Acceptance

`pnpm test:unit --files=test/support/blueprints --no-skips` reports 3 passed. `pnpm test:unit --files=test/conformance/blueprints --no-skips` passes. `grep -c '^export function blueprintSharedTests\|^export async function renderBlueprint\|^export function installBlueprint' test/support/blueprints.ts` prints `3` (or the async variant of each). `grep -x '.ripple-blueprints/' examples/react/.gitignore` matches.

### Out of scope

Any blueprint. BT-8 (tier 8, M10). Each spec's own acceptance tests (blueprint tasks). Changes to `ripple check` rules.

### If blocked

- `<pkg>/check` has no in-memory API for one HTML string: write the rendered document to a temporary directory and run `node pkg/bin/ripple.mjs check --json` there (doc 07 9.2/9.3); report it.
- BT-2's "contract lint of doc 02 section 14" cannot be identified: PR-M7-5.

---

## M7-T04 Install components with the CLI: `ripple init` and `ripple add --all` in `examples/{html,react,remix}`; for `examples/liquid` the first steps of doc 14 §4.1

- **Goal:** Produce the component installs of the four examples with the CLI only, so that every later example and blueprint task builds on CLI output.
- **Depends on:** M5-T15, M6-T35.
- **Kind:** `example`. Size M. Group A.

### Read first

doc 13: `### 12.1 ` (1.5 kB). doc 14: `## 4. ` (the tree and the forbidden list; 4 kB), `### 4.1 ` (2 kB). doc 07: `### 7.4 ` (4 kB), `### 7.5 ` (3 kB), `### 6.1 ` (1.5 kB), `### 7.3 ` (host detection; 1 kB). This file 0.2, 0.3 rows X-12 to X-15, 0.8, PR-M7-1.

### Files

Create: `examples/liquid/` (the seven hand-made files, then CLI output), `examples/{html,react,remix}/ripple.json` and every file `init` and `add --all` write there. Change: `examples/{html,react,remix}/package.json` only through `core/patch:package-json`, lockfiles after `pnpm examples:install`. Must not change: `examples/*/server.mjs`, anything under `theme/`.

### Steps

1. Branch `task/M7-T04-examples-install`. `pnpm build` (the CLI is `pkg/bin/ripple.mjs`).
2. npm hosts, for each `<host>` with the flags of 0.8:

   ```bash
   (cd examples/react && node ../../pkg/bin/ripple.mjs init --host react --components src/components/ripple --styles public/ripple --pages src/pages --css none)
   (cd examples/react && node ../../pkg/bin/ripple.mjs add --all)
   (cd examples/remix && node ../../pkg/bin/ripple.mjs init --host remix --components app/components/ripple --styles public/ripple --public public/ripple --pages app/pages --css none)
   (cd examples/remix && node ../../pkg/bin/ripple.mjs add --all)
   (cd examples/html && node ../../pkg/bin/ripple.mjs init --host html --components components/ripple --styles public/ripple --public public/ripple --pages pages --css none)
   (cd examples/html && node ../../pkg/bin/ripple.mjs add --all)
   ```

   Each command exits 0. Keep the printed plans; paste them into the done file.
3. Liquid, step 1 of doc 14 4.1 (the seven hand-made files): extract X-12 to `examples/liquid/AGENTS.md`, X-13 to `examples/liquid/DESIGN.md`; `config/styles.css` = the first eight lines of X-14 (`head -n 8`); `config/settings_schema.json` = a JSON array holding only the `theme_info` object of X-15 (`node -e` that parses X-15, keeps the element whose `name` is `theme_info`, writes `JSON.stringify([obj], null, 2) + "\n"`); `config/settings_data.json` = `{"current": {}}` plus newline; `locales/en.default.json` and `locales/en.default.schema.json` = `{}` plus newline. `find examples/liquid -type f | wc -l` prints `7`.
4. Liquid, steps 2 and 3 (PR-M7-1):

   ```bash
   (cd examples/liquid && node ../../pkg/bin/ripple.mjs init --host liquid)
   (cd examples/liquid && node ../../pkg/bin/ripple.mjs add --all)
   ```

   Compare the plan of `init` with the expectation of doc 14 4.1 step 2 (three `assets/ripple.css` regions, six JavaScript assets, the four core snippets, four patches applied, `core/patch:head` and `core/patch:import-map` `patch-skipped`). Record the real plan output in the done file (the UNVERIFIED note of 4.1 asks for it; M7-T24 writes it into the A-2 test).
5. `pnpm examples:install`; commit the changed lockfiles.
6. Proof: PLAN 5.0.

### Acceptance

`test -f examples/react/ripple.json && test -f examples/remix/ripple.json && test -f examples/html/ripple.json`. `ls examples/react/src/components/ripple | wc -l` is greater than 80. `ls examples/liquid/blocks | wc -l` prints `110` (doc 14 A-3). `(cd examples/liquid && node ../../pkg/bin/ripple.mjs init --host liquid)` prints only `unchanged` and `patch-skipped` lines. `test ! -e examples/liquid/sections`. `git status --porcelain examples/` after a second run of every step-2 and step-4 command shows no change.

### Out of scope

Blueprints (`add --blueprint`: M7-T20 to M7-T23). `pnpm theme:css`, `ripple check` in the theme (M7-T23). The applications, routes and data (M7-T20 to M7-T22). Editing any CLI output by hand.

### If blocked

- `init` refuses because of an existing file or a host mismatch: the flags of 0.8 are wrong for the CLI as built; do not hand-edit. Re-run with the flag the error names, record the deviation, and report (PR-M7-6 is a plan reading, not a spec).
- `add --all` fails on one component: that component's registry entry is the defect (M6-T01 or the component task); draft pull request naming it.
- No network for `pnpm examples:install`: BLOCKED-ON-ENV; commit everything except lockfiles.

---

## M7-T05 Blueprint `layout`, TSX hosts: `layout.tsx` (react, remix), `types.ts`, `lib/document.ts`, `lib/menu.ts`, `lib/locale-route.ts`, `lib/newsletter-route.ts`

- **Goal:** Add the React and Remix files of the `layout` blueprint, its `blueprint.json` with the TSX file records, its locale keys and its complete sample, and pass the TSX halves of BT-1 to BT-7, BT-9 and LT-1 to LT-13.
- **Depends on:** M7-T03, M7-T04.
- **Kind:** `blueprint`. Size M. Group -.

### Read first

Spec `layout` (`docs/blueprints/layout.md`, 22 kB) complete except the Liquid block and the Liquid notes (the tsx block is extracted, not read). doc 12: `### 2.1 ` (3 kB), `### 2.2 ` (4 kB), `### 2.3 ` (3 kB), `### 2.4 ` (1 kB), `### 2.6 ` the prose rules DS-1 to DS-8 and "Fallback for DS-5" prose (3 kB; the code is extracted), `### 2.7 ` prose rules NR-1 to NR-3 (1 kB). This file 0.3 rows X-1, X-4 to X-10, 0.7, PR-M7-8.

### Files

Create: `blueprints/layout/blueprint.json`; `blueprints/layout/react/layout.tsx`, `types.ts`, `lib/document.ts`, `lib/menu.ts`, `lib/locale-route.ts`, `lib/newsletter-route.ts`; the same six under `blueprints/layout/remix/`; `blueprints/layout/layout.test.ts`. Change: `blueprints/_sample/layout.json`, `locales/en.default.json` (`ripple.blueprints.layout`), the constant of M7-T01's test when a key differs.

### Steps

1. Branch `task/M7-T05-layout-tsx`. Extract X-1 and X-4 to X-10.
2. `blueprint.json`: shape of X-10. `name` `layout`; `title` and `summary` by PR-M7-14. `route` is omitted (doc 12 2.1: none) — UNVERIFIED that the manifest schema allows omission; when it does not, use `null`. `components`: account-link, announcement-bar, cart-drawer, cart-lines, cart-link, cart-summary, dialog, footer, header, icon, icon-button, link-list, locale-selector, logo, mobile-nav, navigation-menu, newsletter-form, predictive-search, skip-link, text, toast (the spec's "Components used"; re-check). `regions`: `rp-cart-lines`, `rp-cart-summary`, `rp-predictive-results`. `files.react` and `files.remix`: keys `template` (`layout.tsx`), `types`, `document`, `menu`, `locale-route`, `newsletter-route`, targets `@pages/<file>`, mode `owned`, `generated: false`. `files.html` and `files.liquid` are added by M7-T06.
3. `react/layout.tsx` = X-1 plus `export const LAYOUT_QUERY = \`<X-4 text>\`;` appended (PR-M7-8; X-4 defines its own fragment). `react/types.ts` = X-5; `react/lib/document.ts` = X-7; `react/lib/menu.ts` = X-6; `react/lib/locale-route.ts` = X-8; `react/lib/newsletter-route.ts` = X-9. Keep the first comment line of each `lib/` file.
4. Remix files: apply R-1 to R-6 of doc 12 2.3, in order, to `layout.tsx`; nothing else changes. The five `.ts` files are copied unchanged (they hold no JSX) unless one imports `react`; then apply R-1.
5. Locale keys (the spec's key table): add `ripple.blueprints.layout` with `skip`, `announcement` (`""`), `search`, `close`, `meta_tagged`, `meta_page`, `footer_menu`, `policies`, `copyright` (`© {{ year }} {{ name }}`) and the spec's English values. Run `pnpm gen`.
6. Sample `layout.json`: fill `menu`, `footerMenu` (non-empty, so A-14 and NJ-F2 have links), `policies`, `shop`, `locale` (`countries`, `languages`: at least two entries each so the LocaleSelector form renders; UNVERIFIED that the spec requires two), `path` `"/"`, `year` `2026`, and the `$liquid` globals the Liquid layout reads (`shop`, `linklists`, `localization`, `routes` from `SHIM_GLOBALS` defaults where the shim already provides them; add only what is missing).
7. `layout.test.ts`: `blueprintSharedTests("layout")`, plus one test per acceptance item LT-1 to LT-13 of the spec named `[T<tier>] layout: LT-<n> <statement>` with the tier the item states; LT-11 is a reference to another test: write `// LT-11: <the test it names>` instead. In this task the Liquid and html cases of the shared tests skip with the reason `layout liquid and html files are M7-T06` (remove the skip in M7-T06). LT-9 when it needs client navigation: PR-M7-10.
8. `pnpm build`, then `pnpm test --files=blueprints/layout` (all tiers of that file).
9. Proof: PLAN 5.0.

### Acceptance

`pnpm gen --check` exits 0. `pnpm test --files=blueprints/layout` shows passing lines for BT-1, BT-2, BT-3 (react and remix compared), BT-4, BT-5, BT-7, BT-9 and each LT id, and the only skips are the M7-T06 reason and T-7. `grep -rn 'className\|style=' blueprints/layout/remix/ | grep -v 'class="rp-'` prints nothing.

### Out of scope

`layout/theme.liquid`, the two snippets, `layout.html` (M7-T06). Routes that call `lib/locale-route.ts` and `lib/newsletter-route.ts` (M7-T20 to M7-T22). Any component change.

### If blocked

- X-1 does not type-check against the installed bindings (BT-1): the spec text or a component's props are wrong; change the blueprint code only where the error names a prop, list it under "Deviations", and add a ledger-issue line to the spec.
- DS-5 hydration fails: the spec's "Fallback for DS-5" is the default (`lib/locale-route.ts` is already the fallback form, X-8 is extracted from that heading).

---

## M7-T06 Blueprint `layout`, Liquid and html: `layout/theme.liquid`, `snippets/import-map.liquid`, `snippets/meta-tags.liquid`, generated `layout.html`

- **Goal:** Add the Liquid files and the generated html file of the `layout` blueprint and pass BT-1 to BT-7, BT-9 and LT-1 to LT-13 in every host.
- **Depends on:** M7-T02, M7-T05.
- **Kind:** `blueprint`. Size M. Group -.

### Read first

Spec `layout`: the Liquid notes after the Liquid block (`### Structure` from the line `blueprints/layout/liquid/snippets/meta-tags.liquid` to the end of the section; 3 kB) and `### Acceptance tests` (4 kB). doc 14: `### 7.2 ` (1 kB), `### 7.6 ` (1 kB), `## 10. ` (layout rules; 3 kB). Ledger D-109. This file 0.3 rows X-2, X-3, X-11, 0.6.

### Files

Create: `blueprints/layout/liquid/layout/theme.liquid`, `blueprints/layout/liquid/snippets/import-map.liquid`, `blueprints/layout/liquid/snippets/meta-tags.liquid`, `blueprints/layout/html/layout.html` (by `pnpm gen` only). Change: `blueprints/layout/blueprint.json` (`files.html`, `files.liquid`), `blueprints/layout/layout.test.ts` (remove the M7-T06 skips), `src/gen/blueprint-html.test.ts` (one test). Must not change: `theme/**`, the TSX files of M7-T05 (except a defect the new tests show, in a separate commit).

### Steps

1. Branch `task/M7-T06-layout-liquid`. Extract X-2, X-3, X-11. `cmp X-3 X-11` MUST report no difference; when it does, use X-11 (doc 14 owns the file, D-099 item 2) and add a ledger-issue line to spec `layout`.
2. `liquid/layout/theme.liquid` = X-2. `liquid/snippets/import-map.liquid` = X-11.
3. `liquid/snippets/meta-tags.liquid`: run the command of doc 14 7.6 exactly:

   ```bash
   sed -e "s/'general\.meta\.tagged'/'ripple.blueprints.layout.meta_tagged'/" -e "s/'general\.meta\.page'/'ripple.blueprints.layout.meta_page'/" theme/snippets/meta-tags.liquid > blueprints/layout/liquid/snippets/meta-tags.liquid
   ```

4. `blueprint.json`: `files.liquid` = `template` (`layout/theme.liquid`), `import-map` (`snippets/import-map.liquid`), `meta-tags` (`snippets/meta-tags.liquid`), each `type: blueprint`, `mode: owned`, `generated: false`, plus the `locale` entry of the X-10 shape with source `liquid/locales/blueprint.layout.json`; `files.html` = `template`, source `blueprints/layout/html/layout.html`, target `@pages/layout.html`, `generated: true`.
5. `pnpm gen` writes `blueprints/layout/html/layout.html` (G10 with an empty page, 0.6). Never edit it.
6. Add `[T1] gen: G10 output equals the committed layout.html` to `src/gen/blueprint-html.test.ts` (`await generateBlueprintHtml("layout")` equals the file text).
7. Remove the M7-T06 skips from `layout.test.ts`; write the Liquid halves of LT items the spec assigns to Liquid (for LT-12: the byte comparison with `theme/snippets/meta-tags.liquid` after the two replacements).
8. `pnpm build && pnpm test --files=blueprints/layout`.
9. Proof: PLAN 5.0.

### Acceptance

`pnpm gen --check` exits 0; after `echo x >> blueprints/layout/html/layout.html` it exits 1 (then `git checkout` the file). `pnpm test --files=blueprints/layout --no-skips` passes (Remix skips only per T-7). `pnpm test:unit --files=src/gen/blueprint-html` reports 3 passed. `git diff --stat origin/main -- theme/` is empty.

### Out of scope

Rendering the layout in `examples/liquid` (M7-T23). `rp-head`, `rp-tokens`, `rp-import-map-entries` (core snippets, M6-T05). Page templates.

### If blocked

- Theme Check reports offenses in `meta-tags.liquid` (BT-1): the file is the base theme's text by D-109; record the offense ids, do not edit the file, and draft pull request (a ledger decision is needed).
- The shim cannot render a layout without a template (0.7 liquid case for `layout`): use the fallback named in 0.7 and report it.

---

## M7-T07 Blueprint `home`

- **Goal:** Add the `home` blueprint in the four hosts with its sample data and locale keys, and pass BT-1 to BT-7, BT-9 and HO-1, HO-2 of spec `home`.
- **Depends on:** M7-T06.
- **Kind:** `blueprint` (PLAN 5.8). Size S. Group C.

### Read first

Spec `home` (`docs/blueprints/home.md`, 7 kB) complete; the code blocks are extracted, so skip their bodies. doc 12: `### 2.1 ` (3 kB), `### 2.2 ` (4 kB), `### 2.3 ` (3 kB), `### 2.4 ` (1 kB), `### 2.8 ` (2.5 kB). doc 14 `## 3. ` only when a Liquid test fails. This file 0.2, 0.3 rows X-20, X-21, X-22, 0.6, 0.7, the readings named below. Repository: `blueprints/layout/blueprint.json` (shape), `blueprints/_sample/home.json`, `blueprints/layout/layout.test.ts` (how the helper is called).

### Files

Create: `blueprints/home/blueprint.json`, `blueprints/home/react/home.tsx`, `blueprints/home/remix/home.tsx`, `blueprints/home/liquid/templates/index.liquid`, `blueprints/home/html/home.html` (by `pnpm gen` only), `blueprints/home/home.test.ts`. Change: `blueprints/_sample/home.json`, `locales/en.default.json` (only `ripple.blueprints.home`, when the blueprint has keys). Must not change: `blueprints/layout/**`, `test/support/blueprints.ts`, any `components/**` file, `theme/**`.

### Steps

1. Branch `task/M7-T07-home`. Extract X-20, X-21, X-22 (0.3).
2. `blueprint.json` (PLAN 5.8 step 2, shape X-10): `name` `home`; `title` and `summary` PR-M7-14; `route` `"/"`; `components`: button, collection-card, container, featured-collection, grid, heading, hero, stack, text; `regions`: none (`[]`). File records: html `template` (`@pages/home.html`, `generated: true`), react and remix `template` (`@pages/home.tsx`), liquid as in step 4, and a liquid `locale` entry (`liquid/locales/blueprint.home.json`) only when the blueprint has keys.
3. React: `home.tsx` = X-20 with the line `export const HOME_QUERY = `...`;` appended at the end, whose template text is X-22 plus the fragments it spreads (PR-M7-8). Remix: apply R-1 to R-6 of doc 12 2.3 to the React file, in order; nothing else changes.
4. Liquid: `liquid/templates/index.liquid` = X-21 (file key `template`). Copy unchanged (M7-R4).
5. Locale keys `ripple.blueprints.home`: `text` (`""`), `cta`, `collections`; English values from the spec's key table. Then `pnpm gen` (writes the locale file and `blueprints/home/html/home.html`, step G10).
6. Sample `blueprints/_sample/home.json`: fill every prop with the data the spec's "Data requirements per backend" names, using `RESOURCES` references; add to `$liquid` the globals the template reads that have no prop (doc 12 L-D list, shim template name `index`). Every list the template prints is non-empty, so that BT-3 compares real content.
7. `blueprints/home/home.test.ts`: `blueprintSharedTests("home")`; then one test per acceptance id HO-1, HO-2 named `[T<tier>] home: <ID> <statement>` with the tier and wording of the spec; the spec's "No-JS behaviour" steps as `[T6] home: no-JS <step>` tests on the rendered pages (BT-6).
8. `pnpm build && pnpm test --files=blueprints/home`.
9. Proof: PLAN 5.0 and PLAN 3.3.

Specifics: X-22 defines the fragments `RippleProductCard` and `RippleCollectionCard` that later query constants reuse (PR-M7-8).

### Acceptance

`pnpm gen --check` exits 0. `test -f blueprints/home/html/home.html`. `pnpm test --files=blueprints/home --no-skips` passes (Remix skips only per T-7; tier 6/7 skips only per the network rule of 0.2); the output has a passing line for each of BT-1, BT-2, BT-3, BT-4, BT-5, BT-6, BT-7, BT-9 and each of HO-1, HO-2. `grep -rn 'style=' blueprints/home/react blueprints/home/remix blueprints/home/liquid` prints nothing.

### Out of scope

Route code and data loading in the examples (M7-T20 to M7-T22), except what PR-M7-10 and PR-M7-11 assign here. Installing into `examples/` (M7-T20 to M7-T23). BT-8 (M10). Changing a component to make the blueprint pass (draft pull request instead). Spike fallbacks.

### If blocked

- An extraction row does not match: the spec changed; stop and report (0.3).
- A spec text fails BT-1 or BT-3 because a component prop or a Liquid block param differs from the spec: change only the blueprint code the error names, list it under "Deviations", add a ledger-issue line to spec `home`; Liquid text is never edited (M7-R4): draft pull request.
- The layout renders differently from M7-T06 for this page (BT-4 duplicate id, BT-5 duplicate partial): the sample `cartPage` or the layout props are wrong; fix the sample, never the layout files.

---

## M7-T08 Blueprint `collection`

- **Goal:** Add the `collection` blueprint in the four hosts with its sample data and locale keys, and pass BT-1 to BT-7, BT-9 and CL-1 to CL-7 of spec `collection`.
- **Depends on:** M7-T06.
- **Kind:** `blueprint` (PLAN 5.8). Size M. Group C.

### Read first

Spec `collection` (`docs/blueprints/collection.md`, 17 kB) complete; the code blocks are extracted, so skip their bodies. doc 12: `### 2.1 ` (3 kB), `### 2.2 ` (4 kB), `### 2.3 ` (3 kB), `### 2.4 ` (1 kB), `### 2.8 ` (2.5 kB). doc 14 `## 3. ` only when a Liquid test fails. This file 0.2, 0.3 rows X-23, X-24, X-25, 0.6, 0.7, the readings named below. Repository: `blueprints/layout/blueprint.json` (shape), `blueprints/_sample/collection.json`, `blueprints/layout/layout.test.ts` (how the helper is called).

### Files

Create: `blueprints/collection/blueprint.json`, `blueprints/collection/react/collection.tsx`, `blueprints/collection/remix/collection.tsx`, `blueprints/collection/liquid/templates/collection.liquid`, `blueprints/collection/html/collection.html` (by `pnpm gen` only), `blueprints/collection/collection.test.ts`. Change: `blueprints/_sample/collection.json`, `locales/en.default.json` (only `ripple.blueprints.collection`, when the blueprint has keys). Must not change: `blueprints/layout/**`, `test/support/blueprints.ts`, any `components/**` file, `theme/**`.

### Steps

1. Branch `task/M7-T08-collection`. Extract X-23, X-24, X-25 (0.3).
2. `blueprint.json` (PLAN 5.8 step 2, shape X-10): `name` `collection`; `title` and `summary` PR-M7-14; `route` `"/collections/:handle"`; `components`: button, container, empty-state, filter-chips, filters, grid, heading, inline, pagination, product-card, rich-text, sort-select, stack, text; `regions`: `rp-collection-filters`, `rp-collection-results`, `rp-collection-toolbar`. File records: html `template` (`@pages/collection.html`, `generated: true`), react and remix `template` (`@pages/collection.tsx`), liquid as in step 4, and a liquid `locale` entry (`liquid/locales/blueprint.collection.json`) only when the blueprint has keys.
3. React: `collection.tsx` = X-23 with the line `export const COLLECTION_QUERY = `...`;` appended at the end, whose template text is X-25 plus the fragments it spreads (PR-M7-8). Remix: apply R-1 to R-6 of doc 12 2.3 to the React file, in order; nothing else changes.
4. Liquid: `liquid/templates/collection.liquid` = X-24 (file key `template`). Copy unchanged (M7-R4).
5. Locale keys `ripple.blueprints.collection`: `count.one`, `count.other`, `empty`, `clear`; English values from the spec's key table. Then `pnpm gen` (writes the locale file and `blueprints/collection/html/collection.html`, step G10).
6. Sample `blueprints/_sample/collection.json`: fill every prop with the data the spec's "Data requirements per backend" names, using `RESOURCES` references; add to `$liquid` the globals the template reads that have no prop (doc 12 L-D list, shim template name `collection`). Every list the template prints is non-empty, so that BT-3 compares real content.
7. `blueprints/collection/collection.test.ts`: `blueprintSharedTests("collection", { masks })`, with `masks` = the count text and the whole view-event payload (the paragraph "Differences between backends, masked for BT-3"); then one test per acceptance id CL-1 to CL-7 named `[T<tier>] collection: <ID> <statement>` with the tier and wording of the spec; the spec's "No-JS behaviour" steps as `[T6] collection: no-JS <step>` tests on the rendered pages (BT-6).
8. `pnpm build && pnpm test --files=blueprints/collection`.
9. Proof: PLAN 5.0 and PLAN 3.3.

Specifics: CL-5 tests the route-code rules CO-R1 to CO-R3 and CL-7 is a client navigation on react and remix: PR-M7-11 and PR-M7-10. The sample must hold at least one filter with two values and two sort options so that NJ-F10 has something to choose.

### Acceptance

`pnpm gen --check` exits 0. `test -f blueprints/collection/html/collection.html`. `pnpm test --files=blueprints/collection --no-skips` passes (Remix skips only per T-7; tier 6/7 skips only per the network rule of 0.2); the output has a passing line for each of BT-1, BT-2, BT-3, BT-4, BT-5, BT-6, BT-7, BT-9 and each of CL-1 to CL-7. `grep -rn 'style=' blueprints/collection/react blueprints/collection/remix blueprints/collection/liquid` prints nothing.

### Out of scope

Route code and data loading in the examples (M7-T20 to M7-T22), except what PR-M7-10 and PR-M7-11 assign here. Installing into `examples/` (M7-T20 to M7-T23). BT-8 (M10). Changing a component to make the blueprint pass (draft pull request instead). Spike fallbacks.

### If blocked

- An extraction row does not match: the spec changed; stop and report (0.3).
- A spec text fails BT-1 or BT-3 because a component prop or a Liquid block param differs from the spec: change only the blueprint code the error names, list it under "Deviations", add a ledger-issue line to spec `collection`; Liquid text is never edited (M7-R4): draft pull request.
- The layout renders differently from M7-T06 for this page (BT-4 duplicate id, BT-5 duplicate partial): the sample `cartPage` or the layout props are wrong; fix the sample, never the layout files.

---

## M7-T09 Blueprint `collections-list`

- **Goal:** Add the `collections-list` blueprint in the four hosts with its sample data and locale keys, and pass BT-1 to BT-7, BT-9 and CS-1 of spec `collections-list`.
- **Depends on:** M7-T06.
- **Kind:** `blueprint` (PLAN 5.8). Size S. Group C.

### Read first

Spec `collections-list` (`docs/blueprints/collections-list.md`, 5 kB) complete; the code blocks are extracted, so skip their bodies. doc 12: `### 2.1 ` (3 kB), `### 2.2 ` (4 kB), `### 2.3 ` (3 kB), `### 2.4 ` (1 kB), `### 2.8 ` (2.5 kB). doc 14 `## 3. ` only when a Liquid test fails. This file 0.2, 0.3 rows X-26, X-27, X-28, 0.6, 0.7, the readings named below. Repository: `blueprints/layout/blueprint.json` (shape), `blueprints/_sample/collections-list.json`, `blueprints/layout/layout.test.ts` (how the helper is called).

### Files

Create: `blueprints/collections-list/blueprint.json`, `blueprints/collections-list/react/collections-list.tsx`, `blueprints/collections-list/remix/collections-list.tsx`, `blueprints/collections-list/liquid/templates/list-collections.liquid`, `blueprints/collections-list/html/collections-list.html` (by `pnpm gen` only), `blueprints/collections-list/collections-list.test.ts`. Change: `blueprints/_sample/collections-list.json`, `locales/en.default.json` (only `ripple.blueprints.collections-list`, when the blueprint has keys). Must not change: `blueprints/layout/**`, `test/support/blueprints.ts`, any `components/**` file, `theme/**`.

### Steps

1. Branch `task/M7-T09-collections-list`. Extract X-26, X-27, X-28 (0.3).
2. `blueprint.json` (PLAN 5.8 step 2, shape X-10): `name` `collections-list`; `title` and `summary` PR-M7-14; `route` `"/collections"`; `components`: collection-card, container, empty-state, grid, heading, pagination, stack; `regions`: none (`[]`). File records: html `template` (`@pages/collections-list.html`, `generated: true`), react and remix `template` (`@pages/collections-list.tsx`), liquid as in step 4, and a liquid `locale` entry (`liquid/locales/blueprint.collections-list.json`) only when the blueprint has keys.
3. React: `collections-list.tsx` = X-26 with the line `export const COLLECTIONS_LIST_QUERY = `...`;` appended at the end, whose template text is X-28 plus the fragments it spreads (PR-M7-8). Remix: apply R-1 to R-6 of doc 12 2.3 to the React file, in order; nothing else changes.
4. Liquid: `liquid/templates/list-collections.liquid` = X-27 (file key `template`). Copy unchanged (M7-R4).
5. Locale keys `ripple.blueprints.collections-list`: `title`, `empty`; English values from the spec's key table. Then `pnpm gen` (writes the locale file and `blueprints/collections-list/html/collections-list.html`, step G10).
6. Sample `blueprints/_sample/collections-list.json`: fill every prop with the data the spec's "Data requirements per backend" names, using `RESOURCES` references; add to `$liquid` the globals the template reads that have no prop (doc 12 L-D list, shim template name `list-collections`). Every list the template prints is non-empty, so that BT-3 compares real content.
7. `blueprints/collections-list/collections-list.test.ts`: `blueprintSharedTests("collections-list")`; then one test per acceptance id CS-1 named `[T<tier>] collections-list: <ID> <statement>` with the tier and wording of the spec; the spec's "No-JS behaviour" steps as `[T6] collections-list: no-JS <step>` tests on the rendered pages (BT-6).
8. `pnpm build && pnpm test --files=blueprints/collections-list`.
9. Proof: PLAN 5.0 and PLAN 3.3.

Specifics: none beyond the recipe.

### Acceptance

`pnpm gen --check` exits 0. `test -f blueprints/collections-list/html/collections-list.html`. `pnpm test --files=blueprints/collections-list --no-skips` passes (Remix skips only per T-7; tier 6/7 skips only per the network rule of 0.2); the output has a passing line for each of BT-1, BT-2, BT-3, BT-4, BT-5, BT-6, BT-7, BT-9 and each of CS-1. `grep -rn 'style=' blueprints/collections-list/react blueprints/collections-list/remix blueprints/collections-list/liquid` prints nothing.

### Out of scope

Route code and data loading in the examples (M7-T20 to M7-T22), except what PR-M7-10 and PR-M7-11 assign here. Installing into `examples/` (M7-T20 to M7-T23). BT-8 (M10). Changing a component to make the blueprint pass (draft pull request instead). Spike fallbacks.

### If blocked

- An extraction row does not match: the spec changed; stop and report (0.3).
- A spec text fails BT-1 or BT-3 because a component prop or a Liquid block param differs from the spec: change only the blueprint code the error names, list it under "Deviations", add a ledger-issue line to spec `collections-list`; Liquid text is never edited (M7-R4): draft pull request.
- The layout renders differently from M7-T06 for this page (BT-4 duplicate id, BT-5 duplicate partial): the sample `cartPage` or the layout props are wrong; fix the sample, never the layout files.

---

## M7-T10 Blueprint `product`

- **Goal:** Add the `product` blueprint in the four hosts with its sample data and locale keys, and pass BT-1 to BT-7, BT-9 and PR-1 to PR-7 of spec `product`.
- **Depends on:** M7-T06.
- **Kind:** `blueprint` (PLAN 5.8). Size M. Group C.

### Read first

Spec `product` (`docs/blueprints/product.md`, 13 kB) complete; the code blocks are extracted, so skip their bodies. doc 12: `### 2.1 ` (3 kB), `### 2.2 ` (4 kB), `### 2.3 ` (3 kB), `### 2.4 ` (1 kB), `### 2.8 ` (2.5 kB). doc 14 `## 3. ` only when a Liquid test fails. This file 0.2, 0.3 rows X-29, X-30, X-31, 0.6, 0.7, the readings named below. Repository: `blueprints/layout/blueprint.json` (shape), `blueprints/_sample/product.json`, `blueprints/layout/layout.test.ts` (how the helper is called).

### Files

Create: `blueprints/product/blueprint.json`, `blueprints/product/react/product.tsx`, `blueprints/product/remix/product.tsx`, `blueprints/product/liquid/templates/product.liquid`, `blueprints/product/html/product.html` (by `pnpm gen` only), `blueprints/product/product.test.ts`. Change: `blueprints/_sample/product.json`, `locales/en.default.json` (only `ripple.blueprints.product`, when the blueprint has keys). Must not change: `blueprints/layout/**`, `test/support/blueprints.ts`, any `components/**` file, `theme/**`.

### Steps

1. Branch `task/M7-T10-product`. Extract X-29, X-30, X-31 (0.3).
2. `blueprint.json` (PLAN 5.8 step 2, shape X-10): `name` `product`; `title` and `summary` `Product page` (X-10); `route` `"/products/:handle"`; `components`: the list of X-10 (`add-to-cart-button`, `container`, `grid`, `heading`, `price`, `product-form`, `product-gallery`, `product-recommendations`, `rich-text`, `stack`, `text`, `variant-picker`); re-check against "Components used"; `regions`: `rp-product-buy`, `rp-product-media`, `rp-product-recommendations`. File records: html `template` (`@pages/product.html`, `generated: true`), react and remix `template` (`@pages/product.tsx`), liquid as in step 4, and a liquid `locale` entry (`liquid/locales/blueprint.product.json`) only when the blueprint has keys.
3. React: `product.tsx` = X-29 with the line `export const PRODUCT_QUERY = `...`;` appended at the end, whose template text is X-31 plus the fragments it spreads (PR-M7-8). Remix: apply R-1 to R-6 of doc 12 2.3 to the React file, in order; nothing else changes.
4. Liquid: `liquid/templates/product.liquid` = X-30 (file key `template`). Copy unchanged (M7-R4).
5. Locale keys `ripple.blueprints.product`: none (no locale entry in `blueprint.json`, PR-M7-13); English values from the spec's key table. Then `pnpm gen` (writes the locale file and `blueprints/product/html/product.html`, step G10).
6. Sample `blueprints/_sample/product.json`: fill every prop with the data the spec's "Data requirements per backend" names, using `RESOURCES` references; add to `$liquid` the globals the template reads that have no prop (doc 12 L-D list, shim template name `product`). Every list the template prints is non-empty, so that BT-3 compares real content.
7. `blueprints/product/product.test.ts`: `blueprintSharedTests("product", { masks })`, with `masks` = `{ "select": "rp-view-event", "op": "attr", "name": "view-event-payload" }` and any other mask the spec lists; then one test per acceptance id PR-1 to PR-7 named `[T<tier>] product: <ID> <statement>` with the tier and wording of the spec; the spec's "No-JS behaviour" steps as `[T6] product: no-JS <step>` tests on the rendered pages (BT-6).
8. `pnpm build && pnpm test --files=blueprints/product`.
9. Proof: PLAN 5.0 and PLAN 3.3.

Specifics: `blueprint.json` is X-10 itself, minus the `locale` entry (PR-M7-13). `title` `Product page` and `summary` come from X-10. PR-7 is a client navigation: PR-M7-10. Section `### Fallback (SPIKE-09)` is NOT applied (the spike is M10-T05); the default template text of X-30 is used. The sample uses `product.options` so that NJ-F3 has a non-current option.

### Acceptance

`pnpm gen --check` exits 0. `test -f blueprints/product/html/product.html`. `pnpm test --files=blueprints/product --no-skips` passes (Remix skips only per T-7; tier 6/7 skips only per the network rule of 0.2); the output has a passing line for each of BT-1, BT-2, BT-3, BT-4, BT-5, BT-6, BT-7, BT-9 and each of PR-1 to PR-7. `grep -rn 'style=' blueprints/product/react blueprints/product/remix blueprints/product/liquid` prints nothing.

### Out of scope

Route code and data loading in the examples (M7-T20 to M7-T22), except what PR-M7-10 and PR-M7-11 assign here. Installing into `examples/` (M7-T20 to M7-T23). BT-8 (M10). Changing a component to make the blueprint pass (draft pull request instead). Spike fallbacks.

### If blocked

- An extraction row does not match: the spec changed; stop and report (0.3).
- A spec text fails BT-1 or BT-3 because a component prop or a Liquid block param differs from the spec: change only the blueprint code the error names, list it under "Deviations", add a ledger-issue line to spec `product`; Liquid text is never edited (M7-R4): draft pull request.
- The layout renders differently from M7-T06 for this page (BT-4 duplicate id, BT-5 duplicate partial): the sample `cartPage` or the layout props are wrong; fix the sample, never the layout files.

---

## M7-T11 Blueprint `search`

- **Goal:** Add the `search` blueprint in the four hosts with its sample data and locale keys, and pass BT-1 to BT-7, BT-9 and SE-1 to SE-4 of spec `search`.
- **Depends on:** M7-T06.
- **Kind:** `blueprint` (PLAN 5.8). Size M. Group C.

### Read first

Spec `search` (`docs/blueprints/search.md`, 10 kB) complete; the code blocks are extracted, so skip their bodies. doc 12: `### 2.1 ` (3 kB), `### 2.2 ` (4 kB), `### 2.3 ` (3 kB), `### 2.4 ` (1 kB), `### 2.8 ` (2.5 kB). doc 14 `## 3. ` only when a Liquid test fails. This file 0.2, 0.3 rows X-32, X-33, X-34, 0.6, 0.7, the readings named below. Repository: `blueprints/layout/blueprint.json` (shape), `blueprints/_sample/search.json`, `blueprints/layout/layout.test.ts` (how the helper is called).

### Files

Create: `blueprints/search/blueprint.json`, `blueprints/search/react/search.tsx`, `blueprints/search/remix/search.tsx`, `blueprints/search/liquid/templates/search.liquid`, `blueprints/search/html/search.html` (by `pnpm gen` only), `blueprints/search/search.test.ts`. Change: `blueprints/_sample/search.json`, `locales/en.default.json` (only `ripple.blueprints.search`, when the blueprint has keys). Must not change: `blueprints/layout/**`, `test/support/blueprints.ts`, any `components/**` file, `theme/**`.

### Steps

1. Branch `task/M7-T11-search`. Extract X-32, X-33, X-34 (0.3).
2. `blueprint.json` (PLAN 5.8 step 2, shape X-10): `name` `search`; `title` and `summary` PR-M7-14; `route` `"/search"`; `components`: container, empty-state, grid, heading, pagination, product-card, search-form, stack, text; `regions`: `rp-search-results`. File records: html `template` (`@pages/search.html`, `generated: true`), react and remix `template` (`@pages/search.tsx`), liquid as in step 4, and a liquid `locale` entry (`liquid/locales/blueprint.search.json`) only when the blueprint has keys.
3. React: `search.tsx` = X-32 with the line `export const SEARCH_QUERY = `...`;` appended at the end, whose template text is X-34 plus the fragments it spreads (PR-M7-8). Remix: apply R-1 to R-6 of doc 12 2.3 to the React file, in order; nothing else changes.
4. Liquid: `liquid/templates/search.liquid` = X-33 (file key `template`). Copy unchanged (M7-R4).
5. Locale keys `ripple.blueprints.search`: `title`, `count.one`, `count.other`, `empty`; English values from the spec's key table. Then `pnpm gen` (writes the locale file and `blueprints/search/html/search.html`, step G10).
6. Sample `blueprints/_sample/search.json`: fill every prop with the data the spec's "Data requirements per backend" names, using `RESOURCES` references; add to `$liquid` the globals the template reads that have no prop (doc 12 L-D list, shim template name `search`). Every list the template prints is non-empty, so that BT-3 compares real content.
7. `blueprints/search/search.test.ts`: `blueprintSharedTests("search")`; then one test per acceptance id SE-1 to SE-4 named `[T<tier>] search: <ID> <statement>` with the tier and wording of the spec; the spec's "No-JS behaviour" steps as `[T6] search: no-JS <step>` tests on the rendered pages (BT-6).
8. `pnpm build && pnpm test --files=blueprints/search`.
9. Proof: PLAN 5.0 and PLAN 3.3.

Specifics: Section `#### Fallback (SPIKE-02, search view event)` is NOT applied (SPIKE-02 is M10-T02). Keep the escaping order of the spec's Notes paragraph (`terms_escaped` before `t`).

### Acceptance

`pnpm gen --check` exits 0. `test -f blueprints/search/html/search.html`. `pnpm test --files=blueprints/search --no-skips` passes (Remix skips only per T-7; tier 6/7 skips only per the network rule of 0.2); the output has a passing line for each of BT-1, BT-2, BT-3, BT-4, BT-5, BT-6, BT-7, BT-9 and each of SE-1 to SE-4. `grep -rn 'style=' blueprints/search/react blueprints/search/remix blueprints/search/liquid` prints nothing.

### Out of scope

Route code and data loading in the examples (M7-T20 to M7-T22), except what PR-M7-10 and PR-M7-11 assign here. Installing into `examples/` (M7-T20 to M7-T23). BT-8 (M10). Changing a component to make the blueprint pass (draft pull request instead). Spike fallbacks.

### If blocked

- An extraction row does not match: the spec changed; stop and report (0.3).
- A spec text fails BT-1 or BT-3 because a component prop or a Liquid block param differs from the spec: change only the blueprint code the error names, list it under "Deviations", add a ledger-issue line to spec `search`; Liquid text is never edited (M7-R4): draft pull request.
- The layout renders differently from M7-T06 for this page (BT-4 duplicate id, BT-5 duplicate partial): the sample `cartPage` or the layout props are wrong; fix the sample, never the layout files.

---

## M7-T12 Blueprint `cart`

- **Goal:** Add the `cart` blueprint in the four hosts with its sample data and locale keys, and pass BT-1 to BT-7, BT-9 and CR-1 to CR-6 of spec `cart`.
- **Depends on:** M7-T06.
- **Kind:** `blueprint` (PLAN 5.8). Size M. Group C.

### Read first

Spec `cart` (`docs/blueprints/cart.md`, 9 kB) complete; the code blocks are extracted, so skip their bodies. doc 12: `### 2.1 ` (3 kB), `### 2.2 ` (4 kB), `### 2.3 ` (3 kB), `### 2.4 ` (1 kB), `### 2.8 ` (2.5 kB). doc 14 `## 3. ` only when a Liquid test fails. This file 0.2, 0.3 rows X-35, X-36, 0.6, 0.7, the readings named below. Repository: `blueprints/layout/blueprint.json` (shape), `blueprints/_sample/cart.json`, `blueprints/layout/layout.test.ts` (how the helper is called).

### Files

Create: `blueprints/cart/blueprint.json`, `blueprints/cart/react/cart.tsx`, `blueprints/cart/remix/cart.tsx`, `blueprints/cart/liquid/templates/cart.liquid`, `blueprints/cart/html/cart.html` (by `pnpm gen` only), `blueprints/cart/cart.test.ts`. Change: `blueprints/_sample/cart.json`, `locales/en.default.json` (only `ripple.blueprints.cart`, when the blueprint has keys). Must not change: `blueprints/layout/**`, `test/support/blueprints.ts`, any `components/**` file, `theme/**`.

### Steps

1. Branch `task/M7-T12-cart`. Extract X-35, X-36 (0.3).
2. `blueprint.json` (PLAN 5.8 step 2, shape X-10): `name` `cart`; `title` and `summary` PR-M7-14; `route` `"/cart"`; `components`: cart-line, cart-lines, cart-note, cart-summary, checkout-button, container, discount-code, grid, heading, stack; `regions`: `rp-cart-lines`, `rp-cart-summary`. File records: html `template` (`@pages/cart.html`, `generated: true`), react and remix `template` (`@pages/cart.tsx`), liquid as in step 4, and a liquid `locale` entry (`liquid/locales/blueprint.cart.json`) only when the blueprint has keys.
3. React: `cart.tsx` = X-35 unchanged (no query constant). Remix: apply R-1 to R-6 of doc 12 2.3 to the React file, in order; nothing else changes.
4. Liquid: `liquid/templates/cart.liquid` = X-36 (file key `template`). Copy unchanged (M7-R4).
5. Locale keys `ripple.blueprints.cart`: `title`; English values from the spec's key table. Then `pnpm gen` (writes the locale file and `blueprints/cart/html/cart.html`, step G10).
6. Sample `blueprints/_sample/cart.json`: fill every prop with the data the spec's "Data requirements per backend" names, using `RESOURCES` references; add to `$liquid` the globals the template reads that have no prop (doc 12 L-D list, shim template name `cart`). Every list the template prints is non-empty, so that BT-3 compares real content.
7. `blueprints/cart/cart.test.ts`: `blueprintSharedTests("cart", { masks })`, with `masks` = the masks the spec lists (view-event payload, D-089); then one test per acceptance id CR-1 to CR-6 named `[T<tier>] cart: <ID> <statement>` with the tier and wording of the spec; the spec's "No-JS behaviour" steps as `[T6] cart: no-JS <step>` tests on the rendered pages (BT-6).
8. `pnpm build && pnpm test --files=blueprints/cart`.
9. Proof: PLAN 5.0 and PLAN 3.3.

Specifics: No Storefront query: the cart comes from the cart handler (doc 05 10.3). The layout is rendered with `cartPage: true` (L-B): no CartDrawer, and BT-5 finds `rp-cart-lines` and `rp-cart-summary` declared once (in the template). The Liquid cart form id is `cart-form` (D-092). The sample uses a cart fixture with at least one line (`cart.two-lines` for A-15).

### Acceptance

`pnpm gen --check` exits 0. `test -f blueprints/cart/html/cart.html`. `pnpm test --files=blueprints/cart --no-skips` passes (Remix skips only per T-7; tier 6/7 skips only per the network rule of 0.2); the output has a passing line for each of BT-1, BT-2, BT-3, BT-4, BT-5, BT-6, BT-7, BT-9 and each of CR-1 to CR-6. `grep -rn 'style=' blueprints/cart/react blueprints/cart/remix blueprints/cart/liquid` prints nothing.

### Out of scope

Route code and data loading in the examples (M7-T20 to M7-T22), except what PR-M7-10 and PR-M7-11 assign here. Installing into `examples/` (M7-T20 to M7-T23). BT-8 (M10). Changing a component to make the blueprint pass (draft pull request instead). Spike fallbacks.

### If blocked

- An extraction row does not match: the spec changed; stop and report (0.3).
- A spec text fails BT-1 or BT-3 because a component prop or a Liquid block param differs from the spec: change only the blueprint code the error names, list it under "Deviations", add a ledger-issue line to spec `cart`; Liquid text is never edited (M7-R4): draft pull request.
- The layout renders differently from M7-T06 for this page (BT-4 duplicate id, BT-5 duplicate partial): the sample `cartPage` or the layout props are wrong; fix the sample, never the layout files.

---

## M7-T13 Blueprint `blog`

- **Goal:** Add the `blog` blueprint in the four hosts with its sample data and locale keys, and pass BT-1 to BT-7, BT-9 and BL-1 of spec `blog`.
- **Depends on:** M7-T06.
- **Kind:** `blueprint` (PLAN 5.8). Size S. Group C.

### Read first

Spec `blog` (`docs/blueprints/blog.md`, 5 kB) complete; the code blocks are extracted, so skip their bodies. doc 12: `### 2.1 ` (3 kB), `### 2.2 ` (4 kB), `### 2.3 ` (3 kB), `### 2.4 ` (1 kB), `### 2.8 ` (2.5 kB). doc 14 `## 3. ` only when a Liquid test fails. This file 0.2, 0.3 rows X-37, X-38, X-39, 0.6, 0.7, the readings named below. Repository: `blueprints/layout/blueprint.json` (shape), `blueprints/_sample/blog.json`, `blueprints/layout/layout.test.ts` (how the helper is called).

### Files

Create: `blueprints/blog/blueprint.json`, `blueprints/blog/react/blog.tsx`, `blueprints/blog/remix/blog.tsx`, `blueprints/blog/liquid/templates/blog.liquid`, `blueprints/blog/html/blog.html` (by `pnpm gen` only), `blueprints/blog/blog.test.ts`. Change: `blueprints/_sample/blog.json`, `locales/en.default.json` (only `ripple.blueprints.blog`, when the blueprint has keys). Must not change: `blueprints/layout/**`, `test/support/blueprints.ts`, any `components/**` file, `theme/**`.

### Steps

1. Branch `task/M7-T13-blog`. Extract X-37, X-38, X-39 (0.3).
2. `blueprint.json` (PLAN 5.8 step 2, shape X-10): `name` `blog`; `title` and `summary` PR-M7-14; `route` `"/blogs/:blog"`; `components`: article-card, container, empty-state, grid, heading, pagination, stack; `regions`: none (`[]`). File records: html `template` (`@pages/blog.html`, `generated: true`), react and remix `template` (`@pages/blog.tsx`), liquid as in step 4, and a liquid `locale` entry (`liquid/locales/blueprint.blog.json`) only when the blueprint has keys.
3. React: `blog.tsx` = X-37 with the line `export const BLOG_QUERY = `...`;` appended at the end, whose template text is X-39 plus the fragments it spreads (PR-M7-8). Remix: apply R-1 to R-6 of doc 12 2.3 to the React file, in order; nothing else changes.
4. Liquid: `liquid/templates/blog.liquid` = X-38 (file key `template`). Copy unchanged (M7-R4).
5. Locale keys `ripple.blueprints.blog`: `empty`; English values from the spec's key table. Then `pnpm gen` (writes the locale file and `blueprints/blog/html/blog.html`, step G10).
6. Sample `blueprints/_sample/blog.json`: fill every prop with the data the spec's "Data requirements per backend" names, using `RESOURCES` references; add to `$liquid` the globals the template reads that have no prop (doc 12 L-D list, shim template name `blog`). Every list the template prints is non-empty, so that BT-3 compares real content.
7. `blueprints/blog/blog.test.ts`: `blueprintSharedTests("blog")`; then one test per acceptance id BL-1 named `[T<tier>] blog: <ID> <statement>` with the tier and wording of the spec; the spec's "No-JS behaviour" steps as `[T6] blog: no-JS <step>` tests on the rendered pages (BT-6).
8. `pnpm build && pnpm test --files=blueprints/blog`.
9. Proof: PLAN 5.0 and PLAN 3.3.

Specifics: none beyond the recipe.

### Acceptance

`pnpm gen --check` exits 0. `test -f blueprints/blog/html/blog.html`. `pnpm test --files=blueprints/blog --no-skips` passes (Remix skips only per T-7; tier 6/7 skips only per the network rule of 0.2); the output has a passing line for each of BT-1, BT-2, BT-3, BT-4, BT-5, BT-6, BT-7, BT-9 and each of BL-1. `grep -rn 'style=' blueprints/blog/react blueprints/blog/remix blueprints/blog/liquid` prints nothing.

### Out of scope

Route code and data loading in the examples (M7-T20 to M7-T22), except what PR-M7-10 and PR-M7-11 assign here. Installing into `examples/` (M7-T20 to M7-T23). BT-8 (M10). Changing a component to make the blueprint pass (draft pull request instead). Spike fallbacks.

### If blocked

- An extraction row does not match: the spec changed; stop and report (0.3).
- A spec text fails BT-1 or BT-3 because a component prop or a Liquid block param differs from the spec: change only the blueprint code the error names, list it under "Deviations", add a ledger-issue line to spec `blog`; Liquid text is never edited (M7-R4): draft pull request.
- The layout renders differently from M7-T06 for this page (BT-4 duplicate id, BT-5 duplicate partial): the sample `cartPage` or the layout props are wrong; fix the sample, never the layout files.

---

## M7-T14 Blueprint `article`

- **Goal:** Add the `article` blueprint in the four hosts with its sample data and locale keys, and pass BT-1 to BT-7, BT-9 and AR-1, AR-2 of spec `article`.
- **Depends on:** M7-T06.
- **Kind:** `blueprint` (PLAN 5.8). Size S. Group C.

### Read first

Spec `article` (`docs/blueprints/article.md`, 6 kB) complete; the code blocks are extracted, so skip their bodies. doc 12: `### 2.1 ` (3 kB), `### 2.2 ` (4 kB), `### 2.3 ` (3 kB), `### 2.4 ` (1 kB), `### 2.8 ` (2.5 kB). doc 14 `## 3. ` only when a Liquid test fails. This file 0.2, 0.3 rows X-40, X-41, X-42, 0.6, 0.7, the readings named below. Repository: `blueprints/layout/blueprint.json` (shape), `blueprints/_sample/article.json`, `blueprints/layout/layout.test.ts` (how the helper is called).

### Files

Create: `blueprints/article/blueprint.json`, `blueprints/article/react/article.tsx`, `blueprints/article/remix/article.tsx`, `blueprints/article/liquid/templates/article.liquid`, `blueprints/article/html/article.html` (by `pnpm gen` only), `blueprints/article/article.test.ts`. Change: `blueprints/_sample/article.json`, `locales/en.default.json` (only `ripple.blueprints.article`, when the blueprint has keys). Must not change: `blueprints/layout/**`, `test/support/blueprints.ts`, any `components/**` file, `theme/**`.

### Steps

1. Branch `task/M7-T14-article`. Extract X-40, X-41, X-42 (0.3).
2. `blueprint.json` (PLAN 5.8 step 2, shape X-10): `name` `article`; `title` and `summary` PR-M7-14; `route` `"/blogs/:blog/:article"`; `components`: container, heading, image, link, rich-text, stack, text; `regions`: none (`[]`). File records: html `template` (`@pages/article.html`, `generated: true`), react and remix `template` (`@pages/article.tsx`), liquid as in step 4, and a liquid `locale` entry (`liquid/locales/blueprint.article.json`) only when the blueprint has keys.
3. React: `article.tsx` = X-40 with the line `export const ARTICLE_QUERY = `...`;` appended at the end, whose template text is X-42 plus the fragments it spreads (PR-M7-8). Remix: apply R-1 to R-6 of doc 12 2.3 to the React file, in order; nothing else changes.
4. Liquid: `liquid/templates/article.liquid` = X-41 (file key `template`). Copy unchanged (M7-R4).
5. Locale keys `ripple.blueprints.article`: `meta` (`{{ date }} · {{ author }}`), `back` (`Back to {{ title }}`); English values from the spec's key table. Then `pnpm gen` (writes the locale file and `blueprints/article/html/article.html`, step G10).
6. Sample `blueprints/_sample/article.json`: fill every prop with the data the spec's "Data requirements per backend" names, using `RESOURCES` references; add to `$liquid` the globals the template reads that have no prop (doc 12 L-D list, shim template name `article`). Every list the template prints is non-empty, so that BT-3 compares real content.
7. `blueprints/article/article.test.ts`: `blueprintSharedTests("article", { masks })`, with `masks` = `{ "select": "header > .rp-text", "op": "text" }`; then one test per acceptance id AR-1, AR-2 named `[T<tier>] article: <ID> <statement>` with the tier and wording of the spec; the spec's "No-JS behaviour" steps as `[T6] article: no-JS <step>` tests on the rendered pages (BT-6).
8. `pnpm build && pnpm test --files=blueprints/article`.
9. Proof: PLAN 5.0 and PLAN 3.3.

Specifics: none beyond the recipe.

### Acceptance

`pnpm gen --check` exits 0. `test -f blueprints/article/html/article.html`. `pnpm test --files=blueprints/article --no-skips` passes (Remix skips only per T-7; tier 6/7 skips only per the network rule of 0.2); the output has a passing line for each of BT-1, BT-2, BT-3, BT-4, BT-5, BT-6, BT-7, BT-9 and each of AR-1, AR-2. `grep -rn 'style=' blueprints/article/react blueprints/article/remix blueprints/article/liquid` prints nothing.

### Out of scope

Route code and data loading in the examples (M7-T20 to M7-T22), except what PR-M7-10 and PR-M7-11 assign here. Installing into `examples/` (M7-T20 to M7-T23). BT-8 (M10). Changing a component to make the blueprint pass (draft pull request instead). Spike fallbacks.

### If blocked

- An extraction row does not match: the spec changed; stop and report (0.3).
- A spec text fails BT-1 or BT-3 because a component prop or a Liquid block param differs from the spec: change only the blueprint code the error names, list it under "Deviations", add a ledger-issue line to spec `article`; Liquid text is never edited (M7-R4): draft pull request.
- The layout renders differently from M7-T06 for this page (BT-4 duplicate id, BT-5 duplicate partial): the sample `cartPage` or the layout props are wrong; fix the sample, never the layout files.

---

## M7-T15 Blueprint `page`

- **Goal:** Add the `page` blueprint in the four hosts with its sample data and locale keys, and pass BT-1 to BT-7, BT-9 and PG-1 of spec `page`.
- **Depends on:** M7-T06.
- **Kind:** `blueprint` (PLAN 5.8). Size S. Group C.

### Read first

Spec `page` (`docs/blueprints/page.md`, 2 kB) complete; the code blocks are extracted, so skip their bodies. doc 12: `### 2.1 ` (3 kB), `### 2.2 ` (4 kB), `### 2.3 ` (3 kB), `### 2.4 ` (1 kB), `### 2.8 ` (2.5 kB). doc 14 `## 3. ` only when a Liquid test fails. This file 0.2, 0.3 rows X-43, X-44, X-45, 0.6, 0.7, the readings named below. Repository: `blueprints/layout/blueprint.json` (shape), `blueprints/_sample/page.json`, `blueprints/layout/layout.test.ts` (how the helper is called).

### Files

Create: `blueprints/page/blueprint.json`, `blueprints/page/react/page.tsx`, `blueprints/page/remix/page.tsx`, `blueprints/page/liquid/templates/page.liquid`, `blueprints/page/html/page.html` (by `pnpm gen` only), `blueprints/page/page.test.ts`. Change: `blueprints/_sample/page.json`, `locales/en.default.json` (only `ripple.blueprints.page`, when the blueprint has keys). Must not change: `blueprints/layout/**`, `test/support/blueprints.ts`, any `components/**` file, `theme/**`.

### Steps

1. Branch `task/M7-T15-page`. Extract X-43, X-44, X-45 (0.3).
2. `blueprint.json` (PLAN 5.8 step 2, shape X-10): `name` `page`; `title` and `summary` PR-M7-14; `route` `"/pages/:handle"`; `components`: container, heading, rich-text, stack; `regions`: none (`[]`). File records: html `template` (`@pages/page.html`, `generated: true`), react and remix `template` (`@pages/page.tsx`), liquid as in step 4, and a liquid `locale` entry (`liquid/locales/blueprint.page.json`) only when the blueprint has keys.
3. React: `page.tsx` = X-43 with the line `export const PAGE_QUERY = `...`;` appended at the end, whose template text is X-45 plus the fragments it spreads (PR-M7-8). Remix: apply R-1 to R-6 of doc 12 2.3 to the React file, in order; nothing else changes.
4. Liquid: `liquid/templates/page.liquid` = X-44 (file key `template`). Copy unchanged (M7-R4).
5. Locale keys `ripple.blueprints.page`: none (no locale entry, PR-M7-13); English values from the spec's key table. Then `pnpm gen` (writes the locale file and `blueprints/page/html/page.html`, step G10).
6. Sample `blueprints/_sample/page.json`: fill every prop with the data the spec's "Data requirements per backend" names, using `RESOURCES` references; add to `$liquid` the globals the template reads that have no prop (doc 12 L-D list, shim template name `page`). Every list the template prints is non-empty, so that BT-3 compares real content.
7. `blueprints/page/page.test.ts`: `blueprintSharedTests("page")`; then one test per acceptance id PG-1 named `[T<tier>] page: <ID> <statement>` with the tier and wording of the spec; the spec's "No-JS behaviour" steps as `[T6] page: no-JS <step>` tests on the rendered pages (BT-6).
8. `pnpm build && pnpm test --files=blueprints/page`.
9. Proof: PLAN 5.0 and PLAN 3.3.

Specifics: none beyond the recipe.

### Acceptance

`pnpm gen --check` exits 0. `test -f blueprints/page/html/page.html`. `pnpm test --files=blueprints/page --no-skips` passes (Remix skips only per T-7; tier 6/7 skips only per the network rule of 0.2); the output has a passing line for each of BT-1, BT-2, BT-3, BT-4, BT-5, BT-6, BT-7, BT-9 and each of PG-1. `grep -rn 'style=' blueprints/page/react blueprints/page/remix blueprints/page/liquid` prints nothing.

### Out of scope

Route code and data loading in the examples (M7-T20 to M7-T22), except what PR-M7-10 and PR-M7-11 assign here. Installing into `examples/` (M7-T20 to M7-T23). BT-8 (M10). Changing a component to make the blueprint pass (draft pull request instead). Spike fallbacks.

### If blocked

- An extraction row does not match: the spec changed; stop and report (0.3).
- A spec text fails BT-1 or BT-3 because a component prop or a Liquid block param differs from the spec: change only the blueprint code the error names, list it under "Deviations", add a ledger-issue line to spec `page`; Liquid text is never edited (M7-R4): draft pull request.
- The layout renders differently from M7-T06 for this page (BT-4 duplicate id, BT-5 duplicate partial): the sample `cartPage` or the layout props are wrong; fix the sample, never the layout files.

---

## M7-T16 Blueprint `contact`

- **Goal:** Add the `contact` blueprint in the four hosts with its sample data and locale keys, and pass BT-1 to BT-7, BT-9 and CT-1 to CT-4 of spec `contact`.
- **Depends on:** M7-T06.
- **Kind:** `blueprint` (PLAN 5.8). Size M. Group C.

### Read first

Spec `contact` (`docs/blueprints/contact.md`, 11 kB) complete; the code blocks are extracted, so skip their bodies. doc 12: `### 2.1 ` (3 kB), `### 2.2 ` (4 kB), `### 2.3 ` (3 kB), `### 2.4 ` (1 kB), `### 2.8 ` (2.5 kB). doc 14 `## 3. ` only when a Liquid test fails. This file 0.2, 0.3 rows X-46, X-47, X-48, 0.6, 0.7, the readings named below. Repository: `blueprints/layout/blueprint.json` (shape), `blueprints/_sample/contact.json`, `blueprints/layout/layout.test.ts` (how the helper is called).

### Files

Create: `blueprints/contact/blueprint.json`, `blueprints/contact/react/contact.tsx`, `blueprints/contact/remix/contact.tsx`, `blueprints/contact/react/lib/contact-route.ts`, `blueprints/contact/remix/lib/contact-route.ts`, `blueprints/contact/liquid/templates/page.contact.liquid`, `blueprints/contact/html/contact.html` (by `pnpm gen` only), `blueprints/contact/contact.test.ts`. Change: `blueprints/_sample/contact.json`, `locales/en.default.json` (only `ripple.blueprints.contact`, when the blueprint has keys). Must not change: `blueprints/layout/**`, `test/support/blueprints.ts`, any `components/**` file, `theme/**`.

### Steps

1. Branch `task/M7-T16-contact`. Extract X-46, X-47, X-48 (0.3).
2. `blueprint.json` (PLAN 5.8 step 2, shape X-10): `name` `contact`; `title` and `summary` PR-M7-14; `route` `"/pages/contact"`; `components`: banner, button, container, heading, input, label, rich-text, stack, textarea; `regions`: none (`[]`). File records: html `template` (`@pages/contact.html`, `generated: true`), react and remix `template` (`@pages/contact.tsx`), liquid as in step 4, and a liquid `locale` entry (`liquid/locales/blueprint.contact.json`) only when the blueprint has keys.
3. React: `contact.tsx` = X-46 unchanged (no query constant, PR-M7-9). Remix: apply R-1 to R-6 of doc 12 2.3 to the React file, in order; nothing else changes.
4. Liquid: `liquid/templates/page.contact.liquid` = X-47 (file key `template`). Copy unchanged (M7-R4).
5. Locale keys `ripple.blueprints.contact`: `name`, `email`, `message`, `send`, `success`, `error`; English values from the spec's key table. Then `pnpm gen` (writes the locale file and `blueprints/contact/html/contact.html`, step G10).
6. Sample `blueprints/_sample/contact.json`: fill every prop with the data the spec's "Data requirements per backend" names, using `RESOURCES` references; add to `$liquid` the globals the template reads that have no prop (doc 12 L-D list, shim template name `page.contact`). Every list the template prints is non-empty, so that BT-3 compares real content.
7. `blueprints/contact/contact.test.ts`: `blueprintSharedTests("contact", { masks })`, with `masks` = the four form masks the spec lists (`#contact-form` `action`, `accept-charset`, `class`, and the fourth); then one test per acceptance id CT-1 to CT-4 named `[T<tier>] contact: <ID> <statement>` with the tier and wording of the spec; the spec's "No-JS behaviour" steps as `[T6] contact: no-JS <step>` tests on the rendered pages (BT-6).
8. `pnpm build && pnpm test --files=blueprints/contact`.
9. Proof: PLAN 5.0 and PLAN 3.3.

Specifics: Extra file `react/lib/contact-route.ts` and `remix/lib/contact-route.ts` = X-48 (key `contact-route`, target `@pages/lib/contact-route.ts`). The one raw `<form>` carries `data-rmx-document` in the Remix file (R-5). Data: PR-M7-9.

### Acceptance

`pnpm gen --check` exits 0. `test -f blueprints/contact/html/contact.html`. `pnpm test --files=blueprints/contact --no-skips` passes (Remix skips only per T-7; tier 6/7 skips only per the network rule of 0.2); the output has a passing line for each of BT-1, BT-2, BT-3, BT-4, BT-5, BT-6, BT-7, BT-9 and each of CT-1 to CT-4. `grep -rn 'style=' blueprints/contact/react blueprints/contact/remix blueprints/contact/liquid` prints nothing.

### Out of scope

Route code and data loading in the examples (M7-T20 to M7-T22), except what PR-M7-10 and PR-M7-11 assign here. Installing into `examples/` (M7-T20 to M7-T23). BT-8 (M10). Changing a component to make the blueprint pass (draft pull request instead). Spike fallbacks.

### If blocked

- An extraction row does not match: the spec changed; stop and report (0.3).
- A spec text fails BT-1 or BT-3 because a component prop or a Liquid block param differs from the spec: change only the blueprint code the error names, list it under "Deviations", add a ledger-issue line to spec `contact`; Liquid text is never edited (M7-R4): draft pull request.
- The layout renders differently from M7-T06 for this page (BT-4 duplicate id, BT-5 duplicate partial): the sample `cartPage` or the layout props are wrong; fix the sample, never the layout files.

---

## M7-T17 Blueprint `not-found`

- **Goal:** Add the `not-found` blueprint in the four hosts with its sample data and locale keys, and pass BT-1 to BT-7, BT-9 and NF-1 of spec `not-found`.
- **Depends on:** M7-T06.
- **Kind:** `blueprint` (PLAN 5.8). Size S. Group C.

### Read first

Spec `not-found` (`docs/blueprints/not-found.md`, 3 kB) complete; the code blocks are extracted, so skip their bodies. doc 12: `### 2.1 ` (3 kB), `### 2.2 ` (4 kB), `### 2.3 ` (3 kB), `### 2.4 ` (1 kB), `### 2.8 ` (2.5 kB). doc 14 `## 3. ` only when a Liquid test fails. This file 0.2, 0.3 rows X-49, X-50, 0.6, 0.7, the readings named below. Repository: `blueprints/layout/blueprint.json` (shape), `blueprints/_sample/not-found.json`, `blueprints/layout/layout.test.ts` (how the helper is called).

### Files

Create: `blueprints/not-found/blueprint.json`, `blueprints/not-found/react/not-found.tsx`, `blueprints/not-found/remix/not-found.tsx`, `blueprints/not-found/liquid/templates/404.liquid`, `blueprints/not-found/html/not-found.html` (by `pnpm gen` only), `blueprints/not-found/not-found.test.ts`. Change: `blueprints/_sample/not-found.json`, `locales/en.default.json` (only `ripple.blueprints.not-found`, when the blueprint has keys). Must not change: `blueprints/layout/**`, `test/support/blueprints.ts`, any `components/**` file, `theme/**`.

### Steps

1. Branch `task/M7-T17-not-found`. Extract X-49, X-50 (0.3).
2. `blueprint.json` (PLAN 5.8 step 2, shape X-10): `name` `not-found`; `title` and `summary` PR-M7-14; `route` omitted (doc 12 2.1: none; use `null` when the schema requires the key); `components`: button, container, empty-state, heading, search-form, stack, text; `regions`: none (`[]`). File records: html `template` (`@pages/not-found.html`, `generated: true`), react and remix `template` (`@pages/not-found.tsx`), liquid as in step 4, and a liquid `locale` entry (`liquid/locales/blueprint.not-found.json`) only when the blueprint has keys.
3. React: `not-found.tsx` = X-49 unchanged (no query constant). Remix: apply R-1 to R-6 of doc 12 2.3 to the React file, in order; nothing else changes.
4. Liquid: `liquid/templates/404.liquid` = X-50 (file key `template`). Copy unchanged (M7-R4).
5. Locale keys `ripple.blueprints.not-found`: `title`, `text`, `cta`; English values from the spec's key table. Then `pnpm gen` (writes the locale file and `blueprints/not-found/html/not-found.html`, step G10).
6. Sample `blueprints/_sample/not-found.json`: fill every prop with the data the spec's "Data requirements per backend" names, using `RESOURCES` references; add to `$liquid` the globals the template reads that have no prop (doc 12 L-D list, shim template name `404`). Every list the template prints is non-empty, so that BT-3 compares real content.
7. `blueprints/not-found/not-found.test.ts`: `blueprintSharedTests("not-found")`; then one test per acceptance id NF-1 named `[T<tier>] not-found: <ID> <statement>` with the tier and wording of the spec; the spec's "No-JS behaviour" steps as `[T6] not-found: no-JS <step>` tests on the rendered pages (BT-6).
8. `pnpm build && pnpm test --files=blueprints/not-found`.
9. Proof: PLAN 5.0 and PLAN 3.3.

Specifics: No query. NF-1 (hydrogen 404 for an unknown handle) tests route code: PR-M7-11.

### Acceptance

`pnpm gen --check` exits 0. `test -f blueprints/not-found/html/not-found.html`. `pnpm test --files=blueprints/not-found --no-skips` passes (Remix skips only per T-7; tier 6/7 skips only per the network rule of 0.2); the output has a passing line for each of BT-1, BT-2, BT-3, BT-4, BT-5, BT-6, BT-7, BT-9 and each of NF-1. `grep -rn 'style=' blueprints/not-found/react blueprints/not-found/remix blueprints/not-found/liquid` prints nothing.

### Out of scope

Route code and data loading in the examples (M7-T20 to M7-T22), except what PR-M7-10 and PR-M7-11 assign here. Installing into `examples/` (M7-T20 to M7-T23). BT-8 (M10). Changing a component to make the blueprint pass (draft pull request instead). Spike fallbacks.

### If blocked

- An extraction row does not match: the spec changed; stop and report (0.3).
- A spec text fails BT-1 or BT-3 because a component prop or a Liquid block param differs from the spec: change only the blueprint code the error names, list it under "Deviations", add a ledger-issue line to spec `not-found`; Liquid text is never edited (M7-R4): draft pull request.
- The layout renders differently from M7-T06 for this page (BT-4 duplicate id, BT-5 duplicate partial): the sample `cartPage` or the layout props are wrong; fix the sample, never the layout files.

---

## M7-T18 Blueprint `password`

- **Goal:** Add the `password` blueprint in the four hosts with its sample data and locale keys, and pass BT-1 to BT-7, BT-9 and PW-1 to PW-3 of spec `password`.
- **Depends on:** M7-T06.
- **Kind:** `blueprint` (PLAN 5.8). Size M. Group C.

### Read first

Spec `password` (`docs/blueprints/password.md`, 8 kB) complete; the code blocks are extracted, so skip their bodies. doc 12: `### 2.1 ` (3 kB), `### 2.2 ` (4 kB), `### 2.3 ` (3 kB), `### 2.4 ` (1 kB), `### 2.8 ` (2.5 kB). doc 14 `## 3. ` only when a Liquid test fails. This file 0.2, 0.3 rows X-51, X-53, X-52, 0.6, 0.7, the readings named below. Repository: `blueprints/layout/blueprint.json` (shape), `blueprints/_sample/password.json`, `blueprints/layout/layout.test.ts` (how the helper is called).

### Files

Create: `blueprints/password/blueprint.json`, `blueprints/password/react/password.tsx`, `blueprints/password/remix/password.tsx`, `blueprints/password/liquid/templates/password.liquid`, `blueprints/password/liquid/layout/password.liquid`, `blueprints/password/html/password.html` (by `pnpm gen` only), `blueprints/password/password.test.ts`. Change: `blueprints/_sample/password.json`, `locales/en.default.json` (only `ripple.blueprints.password`, when the blueprint has keys). Must not change: `blueprints/layout/**`, `test/support/blueprints.ts`, any `components/**` file, `theme/**`.

### Steps

1. Branch `task/M7-T18-password`. Extract X-51, X-53, X-52 (0.3).
2. `blueprint.json` (PLAN 5.8 step 2, shape X-10): `name` `password`; `title` and `summary` PR-M7-14; `route` `"/password"`; `components`: button, container, form-message, heading, input, label, skip-link, stack, text; `regions`: none (`[]`). File records: html `template` (`@pages/password.html`, `generated: true`), react and remix `template` (`@pages/password.tsx`), liquid as in step 4, and a liquid `locale` entry (`liquid/locales/blueprint.password.json`) only when the blueprint has keys.
3. React: `password.tsx` = X-51 unchanged (no query constant). Remix: apply R-1 to R-6 of doc 12 2.3 to the React file, in order; nothing else changes.
4. Liquid: `liquid/templates/password.liquid` = X-53 (file key `template`); `liquid/layout/password.liquid` = X-52 (file key `layout`). Copy unchanged (M7-R4).
5. Locale keys `ripple.blueprints.password`: `label`, `error`, `submit` (the password layout also reads `ripple.blueprints.layout.skip`: PR-M7-12); English values from the spec's key table. Then `pnpm gen` (writes the locale file and `blueprints/password/html/password.html`, step G10).
6. Sample `blueprints/_sample/password.json`: fill every prop with the data the spec's "Data requirements per backend" names, using `RESOURCES` references; add to `$liquid` the globals the template reads that have no prop (doc 12 L-D list, shim template name `password`). Every list the template prints is non-empty, so that BT-3 compares real content.
7. `blueprints/password/password.test.ts`: `blueprintSharedTests("password", { skip: ["BT-4", "BT-5"], masks })`, with `masks` = the form masks of `contact` with `#password-form`; then one test per acceptance id PW-1 to PW-3 named `[T<tier>] password: <ID> <statement>` with the tier and wording of the spec; the spec's "No-JS behaviour" steps as `[T6] password: no-JS <step>` tests on the rendered pages (BT-6).
8. `pnpm build && pnpm test --files=blueprints/password`.
9. Proof: PLAN 5.0 and PLAN 3.3.

Specifics: `PasswordPage` renders its own SkipLink and `<main>` and is NOT wrapped in `Layout` (0.6); the Liquid template uses `{% layout 'password' %}`. Call `blueprintSharedTests("password", { skip: ["BT-4", "BT-5"], masks })` (the spec excludes BT-4 and BT-5). The raw `<form>` carries `data-rmx-document` in the Remix file (R-5).

### Acceptance

`pnpm gen --check` exits 0. `test -f blueprints/password/html/password.html`. `pnpm test --files=blueprints/password --no-skips` passes (Remix skips only per T-7; tier 6/7 skips only per the network rule of 0.2); the output has a passing line for each of BT-1, BT-2, BT-3, BT-4, BT-5, BT-6, BT-7, BT-9 (BT-4 and BT-5 excluded by the spec) and each of PW-1 to PW-3. `grep -rn 'style=' blueprints/password/react blueprints/password/remix blueprints/password/liquid` prints nothing.

### Out of scope

Route code and data loading in the examples (M7-T20 to M7-T22), except what PR-M7-10 and PR-M7-11 assign here. Installing into `examples/` (M7-T20 to M7-T23). BT-8 (M10). Changing a component to make the blueprint pass (draft pull request instead). Spike fallbacks.

### If blocked

- An extraction row does not match: the spec changed; stop and report (0.3).
- A spec text fails BT-1 or BT-3 because a component prop or a Liquid block param differs from the spec: change only the blueprint code the error names, list it under "Deviations", add a ledger-issue line to spec `password`; Liquid text is never edited (M7-R4): draft pull request.
- The layout renders differently from M7-T06 for this page (BT-4 duplicate id, BT-5 duplicate partial): the sample `cartPage` or the layout props are wrong; fix the sample, never the layout files.

---

## M7-T19 Blueprint `gift-card`

- **Goal:** Add the `gift-card` blueprint in the four hosts with its sample data and locale keys, and pass BT-1 to BT-7, BT-9 and GC-1, GC-2 of spec `gift-card`.
- **Depends on:** M7-T06.
- **Kind:** `blueprint` (PLAN 5.8). Size S. Group C.

### Read first

Spec `gift-card` (`docs/blueprints/gift-card.md`, 7 kB) complete; the code blocks are extracted, so skip their bodies. doc 12: `### 2.1 ` (3 kB), `### 2.2 ` (4 kB), `### 2.3 ` (3 kB), `### 2.4 ` (1 kB), `### 2.8 ` (2.5 kB). doc 14 `## 3. ` only when a Liquid test fails. This file 0.2, 0.3 rows X-54, X-55, 0.6, 0.7, the readings named below. Repository: `blueprints/layout/blueprint.json` (shape), `blueprints/_sample/gift-card.json`, `blueprints/layout/layout.test.ts` (how the helper is called).

### Files

Create: `blueprints/gift-card/blueprint.json`, `blueprints/gift-card/react/gift-card.tsx`, `blueprints/gift-card/remix/gift-card.tsx`, `blueprints/gift-card/liquid/templates/gift_card.liquid`, `blueprints/gift-card/html/gift-card.html` (by `pnpm gen` only), `blueprints/gift-card/gift-card.test.ts`. Change: `blueprints/_sample/gift-card.json`, `locales/en.default.json` (only `ripple.blueprints.gift-card`, when the blueprint has keys). Must not change: `blueprints/layout/**`, `test/support/blueprints.ts`, any `components/**` file, `theme/**`.

### Steps

1. Branch `task/M7-T19-gift-card`. Extract X-54, X-55 (0.3).
2. `blueprint.json` (PLAN 5.8 step 2, shape X-10): `name` `gift-card`; `title` and `summary` PR-M7-14; `route` omitted (doc 12 2.1: none; use `null` when the schema requires the key); `components`: banner, button, card, container, heading, link, stack, text; `regions`: none (`[]`). File records: html `template` (`@pages/gift-card.html`, `generated: true`), react and remix `template` (`@pages/gift-card.tsx`), liquid as in step 4, and a liquid `locale` entry (`liquid/locales/blueprint.gift-card.json`) only when the blueprint has keys.
3. React: `gift-card.tsx` = X-54 unchanged (no query constant). Remix: apply R-1 to R-6 of doc 12 2.3 to the React file, in order; nothing else changes.
4. Liquid: `liquid/templates/gift_card.liquid` = X-55 (file key `template`). Copy unchanged (M7-R4).
5. Locale keys `ripple.blueprints.gift-card`: `title`, `expired`, `disabled`, `balance`, `code`, `expires`, `cta`, `wallet`; English values from the spec's key table. Then `pnpm gen` (writes the locale file and `blueprints/gift-card/html/gift-card.html`, step G10).
6. Sample `blueprints/_sample/gift-card.json`: fill every prop with the data the spec's "Data requirements per backend" names, using `RESOURCES` references; add to `$liquid` the globals the template reads that have no prop (doc 12 L-D list, shim template name `gift_card`). Every list the template prints is non-empty, so that BT-3 compares real content.
7. `blueprints/gift-card/gift-card.test.ts`: `blueprintSharedTests("gift-card", { masks })`, with `masks` = `{ "select": ".rp-card .rp-text", "op": "text" }`; then one test per acceptance id GC-1, GC-2 named `[T<tier>] gift-card: <ID> <statement>` with the tier and wording of the spec; the spec's "No-JS behaviour" steps as `[T6] gift-card: no-JS <step>` tests on the rendered pages (BT-6).
8. `pnpm build && pnpm test --files=blueprints/gift-card`.
9. Proof: PLAN 5.0 and PLAN 3.3.

Specifics: none beyond the recipe.

### Acceptance

`pnpm gen --check` exits 0. `test -f blueprints/gift-card/html/gift-card.html`. `pnpm test --files=blueprints/gift-card --no-skips` passes (Remix skips only per T-7; tier 6/7 skips only per the network rule of 0.2); the output has a passing line for each of BT-1, BT-2, BT-3, BT-4, BT-5, BT-6, BT-7, BT-9 and each of GC-1, GC-2. `grep -rn 'style=' blueprints/gift-card/react blueprints/gift-card/remix blueprints/gift-card/liquid` prints nothing.

### Out of scope

Route code and data loading in the examples (M7-T20 to M7-T22), except what PR-M7-10 and PR-M7-11 assign here. Installing into `examples/` (M7-T20 to M7-T23). BT-8 (M10). Changing a component to make the blueprint pass (draft pull request instead). Spike fallbacks.

### If blocked

- An extraction row does not match: the spec changed; stop and report (0.3).
- A spec text fails BT-1 or BT-3 because a component prop or a Liquid block param differs from the spec: change only the blueprint code the error names, list it under "Deviations", add a ledger-issue line to spec `gift-card`; Liquid text is never edited (M7-R4): draft pull request.
- The layout renders differently from M7-T06 for this page (BT-4 duplicate id, BT-5 duplicate partial): the sample `cartPage` or the layout props are wrong; fix the sample, never the layout files.

---

## M7-T20 Example `examples/react`: server, routes, data loading from mock.shop, `/api/cart`, `ripple add --blueprint` for the 14 blueprints

- **Goal:** Turn `examples/react` into a running storefront: the 14 blueprints installed by the CLI, data from mock.shop through `@shopify/hydrogen`, the cart, locale and newsletter handlers, satisfying doc 13 12.1 items 1 to 4.
- **Depends on:** M7-T07 to M7-T19.
- **Kind:** `example`. Size M (large; see "If blocked"). Group D.

### Read first

doc 13: `### 12.1 ` (1.5 kB). doc 12: `### 2.5 ` (4 kB), `### 2.6 ` prose DS-1 to DS-8 and "Fallback for DS-5" prose (3 kB), `### 2.7 ` prose (1 kB). doc 05: `### 10.1 ` (4 kB), `### 10.3 ` (1 kB). Ledger D-041, D-087, D-091 item 5, D-118. Hydrogen skill on the Storefront client and i18n: `examples/react/node_modules/@shopify/hydrogen/skills/` (list the directory; read only the skill that covers creating a Storefront client and `defineShopifyI18n`, about 6 kB). This file 0.2, 0.8, PR-M7-6. Repository: `examples/react/ripple.json`, `examples/react/src/pages/` after step 2 (export lists only).

### Files

Create: `examples/react/build.mjs`, `examples/react/src/server.tsx`, `examples/react/src/client.tsx`, `examples/react/src/data.ts`, `examples/react/src/routes.ts`, the CLI output of step 2. Change: `examples/react/package.json` (scripts `build` = `node build.mjs`; devDependency `esbuild` 0.28.2), `examples/react/server.mjs`, `examples/react/.gitignore`, `examples/react/pnpm-lock.yaml`. Must not change: any file the CLI wrote (`src/components/ripple/**`, `src/pages/**`, `public/ripple/**`).

### Steps

1. Branch `task/M7-T20-example-react`. `pnpm build`.
2. Install the blueprints, in the order of 0.2:

   ```bash
   for id in layout home collection collections-list product search cart blog article page contact not-found password gift-card; do (cd examples/react && node ../../pkg/bin/ripple.mjs add --blueprint $id) || break; done
   ```

3. `src/data.ts`: create the Storefront client the Hydrogen skill shows for a tokenless public store, with store domain `mock.shop` (UNVERIFIED: the exact option names; take them from the skill, not from memory); one loader per route that runs the installed page file's `<X>_QUERY` with `$country`/`$language` from the request locale (doc 12 2.5 second bullet) and maps the result to `<Name>PageProps`, computing `url` fields from the route templates (2.5 third bullet); a `null` root field returns `{ status: 404 }` and the not-found props. Loaders for the layout props (`LAYOUT_QUERY`, menu mapping with `lib/menu.ts`).
4. `src/routes.ts`: the table of 0.8 with `RegExp` patterns for the `route` column of doc 12 2.1; `/api/cart` uses the hydrogen cart handler of doc 05 10.1/10.3; `/api/locale` calls `handleLocalePost` of `src/pages/lib/locale-route.ts`; `/api/newsletter` the function of `lib/newsletter-route.ts`; `/api/contact` the function of `lib/contact-route.ts`. Test-only route for E2E-10 (A-09 of doc 01): `/__rp/commerce-identity` exists only when `RIPPLE_TEST_ROUTES=1` and renders a page whose client entry stores the two objects on `window` (PLAN-CHOSEN path).
5. `src/server.tsx`: `renderDocument` with DS-1 to DS-8 (react: `scripts` = `["/client.js"]`, `commerce.host` `"react"`, `cartEndpoint` and `cartUrl` per DS-3, `cartAction` passed to `layout`, `cart`, `product`); the layout's `cartPage` is `true` on `/cart` (doc 13 12.1 item 4). `src/client.tsx`: imports `<pkg>/elements` and `<pkg>/commerce`, calls `configureCommerce` from the config element, then hydrates per DS-5 (or its fallback when DS-5 fails, as the spec says).
6. `build.mjs` and `server.mjs` per 0.8.
7. Smoke: run `pnpm --dir examples/react build && PORT=4999 pnpm --dir examples/react start &`; then `curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4999/` prints `200`; `/cart` contains no `id="cart-drawer"`; a random handle under `/products/` answers `404`.
8. Proof: PLAN 5.0.

### Acceptance

The commands of step 7. `grep -c 'cart-drawer' <(curl -s http://127.0.0.1:4999/)` is at least `1`. A second run of the loop of step 2 prints only `unchanged` lines. `pnpm test --files=test/support/examples` passes.

### Out of scope

Remix and html examples (M7-T21, M7-T22). The tests NJ-F and E2E (M7-T25, M7-T26). Editing installed files. SPIKE-11 options.

### If blocked

- No network: BLOCKED-ON-ENV for steps 3 and 7; commit the code; the `verify` CI job is the proof.
- mock.shop lacks a resource (doc 12 2.5 UNVERIFIED list): the loader returns the empty-list props (every blueprint renders with empty lists); record the gap.
- The task does not fit in one session: split along step 3 (data) and steps 4 to 6 (routes and server), each its own draft pull request; tell the coordinator the table row is too large.

---

## M7-T21 Example `examples/remix`: the same, plus the morph test routes

- **Goal:** Turn `examples/remix` into the same storefront on Remix 3, keeping the morph test routes of doc 13 9.2 and the rule that regions are plain elements.
- **Depends on:** M7-T07 to M7-T19 (and M7-T20, 0.10).
- **Kind:** `example`. Size M. Group D.

### Read first

doc 13: `### 12.1 ` items 6 and 7 (0.5 kB), `### 9.2 ` (2 kB). doc 05: `### 10.2 ` (1 kB). doc 12: `### 2.6 ` DS-2, DS-6 (1 kB), `### 2.3 ` R-5, R-6 (0.5 kB). This file 0.8. Repository: `examples/react/src/{data,routes,server}.ts*` (from M7-T20), `examples/remix/server.mjs` (the morph routes of M1-T01).

### Files

Create: `examples/remix/build.mjs`, `examples/remix/src/server.tsx`, `examples/remix/src/client.tsx`, `examples/remix/src/data.ts` (copy of the react file), `examples/remix/src/routes.ts`, the CLI output. Change: `examples/remix/package.json`, `examples/remix/server.mjs` (keep the morph routes), `.gitignore`, lockfile. Must not change: installed files; the morph route behaviour.

### Steps

1. Branch `task/M7-T21-example-remix`. `pnpm build`. Install the 14 blueprints with the loop of M7-T20 step 2 in `examples/remix`.
2. `src/data.ts` = the react file unchanged; `src/routes.ts` = the react table with imports from `app/pages/`.
3. `src/server.tsx`: `body` = `await renderToString(<Layout ...>)` from `remix/component/server` (DS-6); `scripts` = `["/ripple/ripple.js", "/client.js"]` (DS-2); no `reloadFrames`, no `navigate` (12.1 item 7). When DS-6's UNVERIFIED point fails, apply the spec's stated alternative (shell as a Remix component, order of DS-6).
4. The morph routes `/__rp/morph/a` and `/b` behave as before, only under `RIPPLE_TEST_ROUTES=1`.
5. Smoke as M7-T20 step 7 on port 4998; also `curl -s -o /dev/null -w '%{http_code}' 'http://127.0.0.1:4998/__rp/morph/a?c=button'` prints `404` without `RIPPLE_TEST_ROUTES=1` and `200` with it.
6. Proof: PLAN 5.0 (Node 24.3 or later; otherwise T-7).

### Acceptance

Step 5. `pnpm test --files=test/hydration/remix` still passes (Q-15). `grep -rn '<Frame' examples/remix/src examples/remix/app/pages` prints nothing.

### Out of scope

SPIKE-11. NJ-F and E2E tests. Changes to `test/hydration/remix.test.ts`.

### If blocked

- Node below 24.3 in the session: write the code, run no smoke, list the T-7 skips; the `verify` CI job is the proof.
- M7-T20 not merged: wait (0.10).

---

## M7-T22 Example `examples/html`: the same on the `html` host

- **Goal:** Turn `examples/html` into a storefront that serves the installed html pages and the hydrogen cart handlers, so that the html host is covered by NJ-F and E2E tests.
- **Depends on:** M7-T07 to M7-T19 (and M7-T20, 0.10).
- **Kind:** `example`. Size M. Group D.

### Read first

doc 13 `### 12.1 ` (1.5 kB). doc 12 `### 2.3 ` H-1, H-2 (0.5 kB), `### 2.5 ` (4 kB). doc 04 `### 5.1 ` (`html` host; 2 kB). doc 05 `### 10.1 ` (4 kB). This file 0.8, PR-M7-7. Repository: `examples/react/src/{data,routes}.ts` (M7-T20).

### Files

Create: `examples/html/build.mjs`, `examples/html/src/server.ts`, `examples/html/src/routes.ts`, `examples/html/src/data.ts` (copy, used by `/api/cart` only), the CLI output. Change: `examples/html/package.json`, `server.mjs`, `.gitignore`, lockfile. Must not change: installed files.

### Steps

1. Branch `task/M7-T22-example-html`. `pnpm build`. Install the 14 blueprints with the loop of M7-T20 step 2 in `examples/html`.
2. Routes (PR-M7-7): each route of doc 12 2.1 answers the installed `pages/<id>.html` unchanged; `/` is `pages/home.html`; an unknown path answers `pages/not-found.html` with 404; `public/` is served at `/`. `/api/cart` is the hydrogen cart handler of doc 05 10.1 (mock.shop); `/api/locale`, `/api/newsletter`, `/api/contact` answer `303` to the `Referer` (no TSX route code exists on html; UNVERIFIED that NJ-F15/NJ-F16 accept this: they assert status below 500 and a request carrying the value).
3. Smoke as M7-T20 step 7 on port 4997.
4. Run E2E-2 by hand once (`RIPPLE_NETWORK=1 pnpm test:commerce --files=test/commerce/e2e --grep='html: E2E-2'` once M7-T26 exists, otherwise a manual add to cart in a browser). When mock.shop rejects the fixture variant id of the sample page, apply the fallback of PR-M7-7 (render the installed react page files with host `html` through the react server code) and report it.
5. Proof: PLAN 5.0.

### Acceptance

Step 3. `curl -s http://127.0.0.1:4997/ | cmp - examples/html/pages/home.html` reports no difference (default path of PR-M7-7).

### Out of scope

Rendering TSX on the html host except as the PR-M7-7 fallback. NJ-F, E2E tests.

### If blocked

- No network: BLOCKED-ON-ENV for the cart handler; commit the rest.

---

## M7-T23 Example `examples/liquid`: finish the Ripple theme by the remaining steps of doc 14 §4.1; theme `AGENTS.md` and `DESIGN.md`

- **Goal:** Finish the Ripple theme with steps 4 to 6 of doc 14 4.1, so that `examples/liquid` is the committed, reproducible theme that `ripple check` accepts.
- **Depends on:** M7-T07 to M7-T19.
- **Kind:** `example`. Size M. Group D.

### Read first

doc 14: `## 2. ` (rules T-1 to T-25; 6 kB), `## 4. ` (the tree; 4 kB), `### 4.1 ` (2 kB), `## 6. ` (settings; 5 kB), `## 11. ` (locales; 3 kB). This file 0.2, PR-M7-1.

### Files

Create: the CLI output of step 2, `examples/liquid/assets/styles.min.css`. Change: `examples/liquid/locales/*.json`, `examples/liquid/config/settings_schema.json`, `examples/liquid/AGENTS.md` (only by the CLI). Must not change: the seven hand-made files except through the CLI's patches; nothing is written by hand.

### Steps

1. Branch `task/M7-T23-example-liquid`. `pnpm build`.
2. Step 4 of doc 14 4.1:

   ```bash
   for id in layout home collection collections-list product search cart blog article page contact not-found password gift-card; do (cd examples/liquid && node ../../pkg/bin/ripple.mjs add --blueprint $id) || break; done
   (cd examples/liquid && node ../../pkg/bin/ripple.mjs init --host liquid)
   ```

   The `init` prints only `unchanged` and `patch-skipped` lines and writes nothing (4.1 step 4 last sentence). Paste the plans into the done file (they are the "real plan output" A-2 records).
3. Step 5: `pnpm theme:css`.
4. Step 6: `(cd examples/liquid && node ../../pkg/bin/ripple.mjs check)` exits 0.
5. `AGENTS.md` and `DESIGN.md` were created in M7-T04 (step 1 of 4.1); `core/patch:agents` keeps the generated region current. Check that `examples/liquid/AGENTS.md` starts with the text of X-12 and `DESIGN.md` equals X-13. Nothing else is done for them (the table row names them, PLAN table error reported).
6. Compare with the tree of doc 14 section 4: every T and R path exists; none of the forbidden paths exists (`test ! -e examples/liquid/sections`; `ls examples/liquid/templates/*.json` finds nothing).
7. Proof: PLAN 5.0.

### Acceptance

Step 2's `init` output; step 4 exits 0; `ls examples/liquid/templates | wc -l` prints `13` and `ls examples/liquid/layout` prints `password.liquid` and `theme.liquid`; `git status --porcelain examples/liquid` is empty after re-running steps 2 to 4.

### Out of scope

The A-tests (M7-T24). The theme-server tests (M7-T27). Live store checks (M10). Any hand edit.

### If blocked

- `ripple check` reports findings: each finding is a defect of the file's owner (component, blueprint, core); do not edit the theme; draft pull request listing the findings and their owners.
- `pnpm theme:css` fails (Tailwind CLI 4.3.5): report the error verbatim.

---

## M7-T24 Ripple theme acceptance A-1 to A-19, A-24, A-25

- **Goal:** Write the theme acceptance tests of doc 14 section 14 that do not need a live store, and make them pass on `examples/liquid`.
- **Depends on:** M7-T23.
- **Kind:** `harness`. Size M. Group E.

### Read first

doc 14: `## 14. ` (whole, 9 kB; A-20 to A-23 are tier 8 and only read), `## 12. ` (removed base-theme files; 3 kB), `### 9.1 ` (partials per template; 1 kB), `### 5.3 ` (1 kB). doc 01: rows A-14 of the acceptance table (search `| A-14 `). doc 13: `### 4.5 ` the `ServeThemeOptions` interface only (1 kB). The done file of M7-T23 (plan output). This file 0.5.

### Files

Create: `test/liquid/theme.test.ts` (0.5). Must not change: `examples/liquid/**`, `src/testing/**`.

### Steps

1. Branch `task/M7-T24-theme-acceptance`.
2. One test per criterion, names `[T<n>] theme: A-<n> <statement>`; tiers: A-1, A-2, A-3, A-4, A-5, A-9, A-10 `[T1]` when they read only files, `[T2]` when they need `pnpm build` output (A-1 runs `ripple check`; A-2 runs the CLI from `pkg/`); A-6, A-7, A-8, A-12 to A-17 render with `createShim("examples/liquid").renderPage` (`[T2]`); A-18 `[T3]`; A-19, A-24 `[T5]`; A-25 `[T5]` with `serveTheme({ themeRoot: "examples/liquid" })`. A-11 is withdrawn: write `// A-11: withdrawn (doc 14 section 14)`.
3. A-2: copy the seven hand-made files of 4.1 step 1 to a temporary directory, run steps 2 to 5 there (CLI from `pkg/bin/ripple.mjs`, `tailwindcss` with the theme's paths replaced), compare every file byte for byte with `examples/liquid` (excluding the trailer differences the doc allows: none), and assert the plan lines recorded by M7-T23 (the UNVERIFIED note of 4.1).
4. A-8 cases 2 and 3 set `rp_font_body`/`rp_font_heading` through `createShim(..., { settings })` (read `ShimOptions`).
5. `pnpm build && pnpm test --files=test/liquid/theme --no-skips`.
6. Proof: PLAN 5.0.

### Acceptance

`pnpm test --files=test/liquid/theme --no-skips` reports a passing line for each of A-1 to A-10, A-12 to A-19, A-24, A-25 (21 criteria, A-8 possibly as three tests).

### Out of scope

A-20 to A-23 (tier 8, M10). Fixing the theme (owners per M7-T23 "If blocked").

### If blocked

- A criterion fails on a CLI-produced file: the producer is defective; draft pull request naming it, never an edit under `examples/liquid/`.
- A-5 needs `@shopify/theme-check-node` and it is not a dev dependency: report; the root `package.json` is owned by doc 13 2.3.

---

## M7-T25 No-JS flows `test/nojs/blueprints.test.ts`: NJ-F1 to NJ-F16 on the four examples

- **Goal:** Write the whole-page flows of doc 13 11.2 for the four examples with scripting disabled and make them pass.
- **Depends on:** M7-T20, M7-T21, M7-T22, M7-T23.
- **Kind:** `harness`. Size M. Group E.

### Read first

doc 13: `### 11.2 ` (whole, 4 kB; rules NJ-5, NJ-6), `### 12.1 ` (1.5 kB), the options of `openPage` (`### 5.1 `, 1 kB). This file 0.2. Repository: `grep -rn 'test/nojs/blueprints.test.ts NJ-F' components/ src/ test/` (the references earlier tasks left).

### Files

Create: `test/nojs/blueprints.test.ts`. Must not change: the examples (a failing flow is reported to the example's task owner).

### Steps

1. Branch `task/M7-T25-nojs-flows`.
2. For each host in `["html", "react", "remix", "liquid"]` and each row NJ-F1 to NJ-F16 (rows say when a host is excluded: NJ-F8 hydrogen only), one test `[T6] <host>: NJ-F<n> <statement>`; `startExample(host)` once per host (shared across its tests, `stop()` in `after`); `openPage(url, { scripts: "disabled" })`; selectors only those of the table (NJ-5). Product and collection handles: the discovery query of 12.1 (hydrogen) or the ST-3 catalogue (liquid).
3. NJ-F11 needs a collection with more than one page: on liquid pass `pageSize` (serveTheme option) small enough; on hydrogen, when the discovered collection has one page only, the test skips with `mock.shop collection has one page` (UNVERIFIED that mock.shop has a collection with more than 24 products). NJ-F16 runs only when the example offers more than one locale (the row says so); otherwise it skips with `one locale` (report: under `--no-skips` this fails, see problems).
4. References: every comment `// AT-<n>: generic (test/nojs/blueprints.test.ts NJ-F<k>, added by M7-T25)` found in step "Read first" names an NJ-F id that now has a test; list them in the done file.
5. `RIPPLE_NETWORK=1 pnpm test:nojs --files=test/nojs/blueprints --no-skips`.
6. Proof: PLAN 5.0.

### Acceptance

Step 5 exits 0 with 16 flows times the hosts each row names (63 tests when NJ-F8 is hydrogen only). Without network: the liquid tests pass and every hydrogen test skips with `RIPPLE_NETWORK is not 1`.

### Out of scope

Component-level `[T6]` tests (component tasks). C-17/C-18 duplicates (NJ-6). Fixing example code.

### If blocked

- No network: BLOCKED-ON-ENV for the hydrogen hosts (0.2 network rule).
- A flow fails on one host because of example code: draft pull request naming the example task (M7-T20 to M7-T23).

---

## M7-T26 Tier 7 `test/commerce/e2e.test.ts`: E2E-1 to E2E-11 against mock.shop

- **Goal:** Write the tier 7 tests of doc 13 12.2 and make them pass against mock.shop on the three npm examples.
- **Depends on:** M7-T20, M7-T21, M7-T22.
- **Kind:** `harness`. Size M. Group E. **BLOCKED-ON-ENV without network access to mock.shop.**

### Read first

doc 13: `### 12.2 ` (whole, 3 kB; E-1 to E-4), `### 12.1 ` (1.5 kB), `### 10.5 ` (announcements; 1 kB). doc 01: row A-09 (search `| A-09 `). This file 0.2. Repository: `grep -rn 'test/commerce/e2e.test.ts' components/ src/ test/` (references), `examples/react/src/routes.ts` (the A-09 route of M7-T20 step 4).

### Files

Create: `test/commerce/e2e.test.ts`. Must not change: the examples.

### Steps

1. Branch `task/M7-T26-e2e`.
2. Tests `[T7] <host>: E2E-<n> <statement>` for `html`, `react`, `remix`, E2E-1 to E2E-9 each host, E2E-10 react only (`/__rp/commerce-identity`). Each ends with `assert.deepEqual(errors, [])`; one browser context per test (E-2); the runner sets concurrency 1 (E-3).
3. E2E-11 (E-4): before the first test one query for `menu(handle: "main-menu")`, `blogs(first: 1)`, `pages(first: 1)`, `localization { availableCountries { isoCode } }`, `collection(handle: "frontpage")`; one test per host and thing `[T7] <host>: E2E-11 mock.shop has <thing>`; skip `mock.shop has no <thing>` when empty (under `--no-skips` this fails by design, E-4).
4. References: every `// AT-<n>: generic (test/commerce/e2e.test.ts, added by M7-T26)` names an assertion one of these tests makes; list each with the E2E id in the done file; an item no E2E row covers is listed as "not covered" (no new test: the scope is the doc's table).
5. `RIPPLE_NETWORK=1 pnpm test:commerce --no-skips`.
6. Proof: PLAN 5.0.

### Acceptance

Step 5 exits 0. The output has 9 times 3 plus 1 plus 15 (E2E-11) passing lines.

### Out of scope

The Liquid backend (tiers 5 and 8). Changing mock.shop expectations (a ledger change, E-4).

### If blocked

- No network: BLOCKED-ON-ENV (PLAN section 4 environment limits); draft pull request with the file; the `verify` job is the proof.
- E2E-11 skips for one thing: the gate's `--no-skips` cannot pass; record it and hand it to the coordinator (it needs a ledger change, E-4).

---

## M7-T27 Page-view tests: `[T5] serve-theme: one page view per document load` and C-30; re-point the theme-server tests of M1-T39 at `examples/liquid`

- **Goal:** Add the page-view test and C-30 on the Ripple theme and move the three golden-path theme-server tests from the assembled M1 theme to `examples/liquid`.
- **Depends on:** M4-T21, M7-T23.
- **Kind:** `harness`. Size S. Group E.

### Read first

doc 13: `### 4.6 ` the rows `[T5] serve-theme: one page view per document load` and the three theme-server rows (2 kB), rule ST-3 and ST-6 (0.5 kB). doc 05: rows C-29, C-30 of `## 14. ` (1 kB). PLAN section 8 note P-3. Repository: `test/support/golden-theme.ts`, `test/liquid/shim.test.ts` (the tests that call `buildGoldenTheme`), `test/commerce/liquid.test.ts` (C-29, as the model).

### Files

Change: `test/liquid/shim.test.ts`, `test/commerce/liquid.test.ts`. Delete: `test/support/golden-theme.ts`. Must not change: `src/testing/serve-theme.ts`, `examples/liquid/**`.

### Steps

1. Branch `task/M7-T27-page-view`.
2. In `test/liquid/shim.test.ts` replace every `buildGoldenTheme()` by `"examples/liquid"`; delete the import; delete `test/support/golden-theme.ts`. The three tests keep their names.
3. Add `[T5] serve-theme: one page view per document load` exactly as the row: for `/`, `/products/linen-shirt`, `/collections/summer`, `/cart` on `serveTheme({ themeRoot: "examples/liquid" })` (default routes, ST-3), count `window.__log` entries whose first item is `"pageView"` after `settled(page)` (PR-M4-6: never listen for the event type, ST-6): exactly one; with the config element's `analytics` set to `false` (UNVERIFIED how: through the theme setting that `rp-head` reads; read `snippets/rp-head.liquid` in the theme) none; `init.page.template` equals `main[data-template]` up to its first dot.
4. Add `[T5] commerce-liquid: C-30 rp-view-event is printed once by the product, collection, search and cart templates` to `test/commerce/liquid.test.ts`: render the four templates with the shim on `examples/liquid`; exactly one `rp-view-event` each; computed `display: block` in the browser; the attribute form carries `view-event-payload`; the cart's element has one child `script[type="application/json"][data-view-event-payload]`; and "no component fixture prints one" (`grep -l 'rp-view-event' components/*/fixtures/*.html` is empty, asserted in the test).
5. `pnpm build && pnpm test --files=test/liquid/shim --files=test/commerce/liquid --no-skips`.
6. Proof: PLAN 5.0.

### Acceptance

Step 5 passes. `test ! -e test/support/golden-theme.ts`. `grep -c buildGoldenTheme -r test/` prints `0`.

### Out of scope

`[T8] liquid: one page view per load` (M10). C-33 to C-39 (no owning row). Changes to the emulation.

### If blocked

- `/collections/summer` is not a route of `DEFAULT_THEME_ROUTES`: pass `routes` with that pattern and the scope the M1 test used; report it.

---

## M7-T28 Set every `commerce` component to `status: "stable"` after tier 7 passes (checklist line 16)

- **Goal:** Promote every component of kind `commerce` from `beta` to `stable` once tier 7 has passed, and end the bring-up guard `BRINGUP` of the fixture tests.
- **Depends on:** M7-T26.
- **Kind:** `infra`. Size S. Group F.

### Read first

doc 13 `### 18.1 ` (the checklist, line 16; 2 kB). PLAN section 3 row 16 and section 8 note P-8. This file PR-M7-3. Repository: `grep -l '"kind": "commerce"' components/*/*.json`, the `BRINGUP` lines of `src/testing/fixtures.test.ts` and `src/testing/resources.test.ts`.

### Files

Change: each `components/<id>/<id>.json` of kind `commerce` (the `status` value only), `src/testing/fixtures.test.ts`, `src/testing/resources.test.ts`, generated files `pnpm gen` rewrites. Must not change: any other manifest field.

### Steps

1. Branch `task/M7-T28-commerce-stable`. Check that the M7-T26 done file shows `RIPPLE_NETWORK=1 pnpm test:commerce --no-skips` exit 0 (or the `verify` job of its merge commit is green); otherwise stop.
2. For each manifest of kind `commerce`: `"status": "beta"` becomes `"status": "stable"`.
3. PR-M7-3: delete `const BRINGUP = true // PLAN 4.4: set false and delete in M7-T29` from both test files and make the guarded assertions unconditional. Add the ledger-issue line of PR-M7-3 to `docs/PLAN.md` section 8 (the owning doc is PLAN).
4. `pnpm gen`, then PLAN 5.0.

### Acceptance

`grep -l '"kind": "commerce"' components/*/*.json | xargs grep -l '"status": "beta"'` prints nothing. `grep -rn 'BRINGUP\b' src/testing/` prints nothing (`BRINGUP_SUBSET` is already gone, M5-T14). `pnpm test:unit --files=src/testing --no-skips` passes.

### Out of scope

Any other status change. Tier 7 itself.

### If blocked

- "every key of `RESOURCES` is referenced" fails once unguarded: list the unreferenced keys; draft pull request (adding references belongs to the blueprint samples or the resource owner, not here).

---

## M7-T29 M7 gate

- **Goal:** Prove the M7 gate of PLAN 4.2 and record the result; change no source.
- **Depends on:** M7-T01 to M7-T28.
- **Kind:** `gate`. Size S.

### Read first

PLAN `### 3.5 ` and the M7 row of `### 4.2 `. The done files of M7-T01 to M7-T28.

### Files

Create: `docs/plan/done/M7-T29.md`. Nothing else.

### Steps

1. Branch `task/M7-T29-gate`. `pnpm ci` (PLAN 5.0 proof commands) with `RIPPLE_NETWORK=1`.
2. Run each gate command and record its output summary:
   - `pnpm test --files=blueprints --no-skips`: every `BT-1` to `BT-7`, `BT-9` line passes for the 14 blueprints in every host (password without BT-4, BT-5).
   - The examples were produced by the CLI: for each npm host, `(cd examples/<host> && node ../../pkg/bin/ripple.mjs status --json)` lists the 14 blueprints and no modified file; for liquid, the A-2 test passes.
   - `RIPPLE_NETWORK=1 pnpm test:commerce --no-skips` exits 0.
   - `RIPPLE_NETWORK=1 pnpm test:nojs --no-skips` exits 0 and shows NJ-F1 to NJ-F16.
   - `pnpm test --files=test/liquid/theme --no-skips` passes A-1 to A-19 (except the withdrawn A-11), A-24, A-25.
   - `grep -l '"kind": "commerce"' components/*/*.json | xargs grep -L '"status": "stable"'` prints nothing.
3. Write the done file: the commands, their summarised output, every M7 task with its pull request, and every ledger-issue line added by M7 tasks.

### Acceptance

Every command of step 2 exits 0. The done file exists.

### Out of scope

Fixing anything (PLAN 3.5: a failing command names the failing task and the gate stops).

### If blocked

- No network: the gate cannot pass in the session; record BLOCKED-ON-ENV and the commands that did pass; the `verify` CI job of `main` is the proof.
- E2E-11 or NJ-F16 skips make `--no-skips` fail: name M7-T26 or M7-T25 and stop (see their "If blocked").
