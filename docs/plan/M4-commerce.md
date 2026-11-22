# M4 Commerce components: task detail

Status: detail file for the 24 rows of milestone M4 in `docs/PLAN.md` section 6. `docs/00-decisions.md` (the ledger) wins over every spec; a spec wins over this file. This file adds no API. Where it fixes a process choice the specs leave open, the choice is marked "Plan reading" and is listed in section 0.8.

How to use: read `AGENTS.md`, `docs/CONVENTIONS.md`, `docs/PLAN.md` sections 1 to 3 and the recipe of your task's kind (PLAN section 5), then section 0 of this file, then ONLY your task's section `## <task id>`. Do not read other task sections. Do not read `docs/plan/M1-golden-path.md`, `M2-foundations.md` or `M3-interactive.md`: every rule you need from them is restated in section 0.

Contents: 0 Rules for every M4 task. Then M4-T01 to M4-T24 in table order.

---

## 0. Rules for every M4 task

### 0.1 Finding what to read

- **M4-R1** Spec files are large and are edited between sessions. Never use a line number. Find a section by searching for its heading text exactly as this file prints it (for example search `### 7.4 ` in `docs/05-commerce.md`) and read up to the next heading of the same or a higher level.
- **M4-R2** "Read first" lists are complete. Sizes are approximate. Read nothing else unless a failing command names another file.
- **M4-R3** "the spec" in a component task is `docs/components/<id>.md`. Its section order is fixed (PLAN 5.1 item 2). The spec's "HTML contract" section is the oracle for every fixture. If this file and the spec list different fixtures, props, parts or rules, the spec wins; note it in the pull request.
- **M4-R4** `docs/11-components-commerce.md` section 0 is 43 kB. Read only the subsections a task lists. Their sizes: `### 0.2 Embedded components` 9 kB (read only the rows of the components your task embeds or composes), `### 0.3 Region slots` 6 kB (region owners only), `### 0.4 Backend-scoped fixtures and masks` 2 kB, `### 0.5 Resource fixtures` 4 kB (only the rows of the resources your fixtures name), `### 0.7 Shared conventions` 9 kB.

### 0.2 Values every M4 task uses

| Thing | Value | Source |
|---|---|---|
| Manifest `since` | `"0.1.0"` | `docs/07-manifest-registry-cli.md` section 1.7 |
| Manifest `status` | `"stable"` for kinds `static` and `native`; `"beta"` for kind `commerce` | PLAN 3.2 |
| Render hosts | `html`, `react`, `remix`, `liquid` (Liquid means the shim of `src/testing/liquid-shim.ts`) | CONVENTIONS 1 |
| Bring-up mode | `BRINGUP_SUBSET` is `true`; `pnpm gen --check` accepts a subset of the 84 ids | PLAN 4.4 |
| Branch | `task/<task id>-<slug>`; the slug is given in each task's Steps | PLAN 2 |
| Test name | `[T<tier>] <subject>: <ID> <statement>`; flat `test()` from `node:test`; no `describe`. `<subject>` and `<ID>` are given by this file; `<statement>` is a short fragment the implementer writes | `docs/13-testing.md` section 2.4 |
| Test style | `openPage()` per test, closed in `finally`; no fixed delay except a duration a spec states; last assertion `assert.deepEqual(opened.errors, [])` | `docs/13-testing.md` section 2.5 |
| `[chromium]` tag | allowed only for a Chromium-only API or a computed-style snapshot, with the comment line `// [chromium]: <reason>` above the test | `docs/13-testing.md` N-2 |

The 26 components of `docs/11-components-commerce.md`: nine exist since M1 (`price add-to-cart-button checkout-button product-form cart-link cart-line cart-summary cart-lines cart-drawer`). M4 adds seventeen: `swatch search-form product-card collection-card article-card price-range filter-group live-form filters filter-chips sort-select variant-picker product-gallery cart-note discount-code predictive-search product-recommendations`.

### 0.3 Component tasks

A component task says "Recipe: S" (or C, C+R). Do every step of that recipe in `docs/PLAN.md` section 5, in order. The task section lists only what is specific.

- **M4-R5 Manifest.** Copy every value from the spec: field table, Props (a prop whose "Liquid param" cell is `none` gets `hosts: ["react", "remix"]`; a row whose "Prop (TSX)" cell is `none` gets `hosts: ["liquid"]`), Anatomy (`parts[]`, with the composed class pairs as the part `class`), Content model, State and attributes (`state[]`), the upgrade allow-list (the JSON objects are the items of `upgradeAllow`), Behaviour without JavaScript (`noJs.*`), Accessibility (`a11y.*`), Agent surface (`agent.*`), Checker rules (`rules[]`), fixtures with their masks. Use only the manifest key names of ledger section 4.8 (search `### 4.8 Manifest key names` in `docs/00-decisions.md`; 3 kB). For the JSON SHAPE of each key copy the same key of an entry that exists in the repository since M1:

  | Need | Copy the shape from |
  |---|---|
  | kind `commerce`, tier `resource`, `liquid.formDialect`, `hydrogenHost.formDialect`, `agent`, `upgradeAllow[]`, hand fixtures with masks | `components/product-form/product-form.json` |
  | region part, `files` with a `data` entry, two Liquid snippets, backend-scoped fixtures with `hosts` | `components/cart-lines/cart-lines.json` |
  | kind `static`, hand-written, tier `resource`, embedded and composed components | `components/cart-line/cart-line.json` |
  | kind `static`, hand-written, tier `block`, snippet with `liquid.embeddedBy` | `components/price/price.json` |
  | kind `commerce`, tier `block` | `components/cart-link/cart-link.json` |

  When the spec gives no value for a REQUIRED manifest key, stop: record it under `## Ledger issues` of `docs/11-components-commerce.md`, mention it in the pull request, take the smallest value that keeps `pnpm gen --check` green.
- **M4-R6 Fixtures.** For a hand-written component every fixture is `generated: "hand"` (recipe C step 2). Write `components/<id>/fixtures/<name>.html` with the HTML of the spec. Where the spec prints a fenced block, copy it. Where it lists a fixture under "Further required fixtures", the HTML is the `default` fixture with exactly the stated change (FX-3). A line `<!-- <Component> fixture `<name>` -->` inside a fenced block stands for the complete file `components/<that id>/fixtures/<name>.html` with the prop changes stated next to the block; paste that file's content; no fixture file contains an HTML comment (FX-5). Only CartNote and DiscountCode have backend-scoped fixtures in M4: `<name>` with `"hosts": ["html", "react", "remix"]` and `liquid-<name>` with `"hosts": ["liquid"]` (FX-2). Every other M4 component has one fixture per name, rendered by all four hosts, made equal by the masks the spec lists. Add no mask the spec does not list; report instead.
- **M4-R7 Fixture data that the resource set cannot express (Plan reading PR-M4-1; an open spec gap).** A fixture prop value is a string, a number, a boolean or `{ "$resource": "<type>.<name>" }` (`docs/02-html-contract.md` section 11, schema `propValue`), and the loader passes the WHOLE resource: its `hydrogen` side to `react` and `remix`, its `liquid` side to `liquid` (`docs/13-testing.md` rule RS-3). Several M4 fixtures name a member of a resource, an array, or data in no resource. Procedure, in this order:
  1. Read the keys of `RESOURCES` in `src/testing/resources.ts` and the table of `docs/11-components-commerce.md` `### 0.5 `. When a resource exists whose side already IS the value, use it. When section 0.5 now names a resource for your fixture, use that name (it was added after this file was written).
  2. Otherwise add a resource, by `docs/13-testing.md` rule RS-2, in the same pull request: one entry in `RESOURCES`, one row in the table of `docs/13-testing.md` `### 4.2 `, one row in the table of `docs/11-components-commerce.md` `### 0.5 `, and one line under `## Ledger issues` of `docs/11-components-commerce.md` (`resource <name> added by <task id> (PLAN M4-R7)`). When a `[T1] resources:` test pins the list of names, add the name there.
  3. Name: `<component id>.<fixture name>`. Its `hydrogen` side is the value of the TSX object prop of that fixture; its `liquid` side is the value of the Liquid object param of that fixture (the drop stand-in the Liquid binding reads). The fixture then passes the SAME reference to both props (the TSX prop has `hosts: ["react", "remix"]`, the Liquid param has `hosts: ["liquid"]`, so each host receives one of them). When one fixture needs a SECOND TSX object prop, that one is `<component id>-<prop in kebab-case>.<fixture name>` with both sides equal.
  4. Values: exactly what the spec's fixture line and reference HTML show; shapes: `docs/05-commerce.md` section 11.1 (hydrogen side) and the Liquid members the component's Host notes name (liquid side). Copy members from the existing resource the fixture line refers to (for example "the `Availability` filter of `filters.basic`" is `RESOURCES["filters.basic"].hydrogen.filters[0]` and the first filter of its `liquid` side). Never change an existing resource (RS-5).
  5. A fixture whose data equals another fixture's (`class`, `invalid-enum-falls-back`, `children`) references that fixture's resource.
  Each task section lists the resources this rule yields under "Names and values". The `html` host needs nothing: its fixture file is written by hand.
- **M4-R8 Embedding and composition (D-070).** Embed: TSX imports the sibling binding (`../../<other id>/react/<other id>` in React, `../../<other id>/remix/<other id>.tsx` in Remix; copy the path form of `components/cart-line/react/cart-line.tsx`); Liquid prints `{% render 'rp-<other id>', ... %}`. Never copy another component's markup. Compose by contract: the binding prints the element ITSELF with the base class first and its own class second, with every attribute the base contract prints for the same props (`docs/11-components-commerce.md` section 0.2, first table). Manifest: every embedded or composed component is in `dependencies.components`; an embedded one is also in `dependencies.embeds`, and THIS component's id is added to `liquid.embeddedBy` in `components/<embedded id>/<embedded id>.json` when it is not there yet (build check MB-1: the two lists are inverses). Then `pnpm gen` regenerates the embedded component's files; commit them; change nothing else in the embedded component. A hook attribute (`data-rp-part`, `data-rp-js`, `data-rp-field`, `form`) is never passed through rest props or `attributes`: `data-rp-field` only through the prop `rpField` (Liquid `rp_field`), `form` only through `formId` (Liquid `form_id`).
- **M4-R9 Region parts (D-091).** A region owner exports the region part from the same TSX file and prints it on Liquid through the snippet named in the spec's Anatomy table. The region part is ONE element with `data-rp-region="<name>"`. The default body renders the region part; children (`{{ content }}` when `content != blank`) replace the region part and nothing else (RS-2, CV-6). A Ripple block or snippet file never contains `{% partial %}` (RS-3). The Liquid region-part snippet is rendered with exactly the params the spec's Props section lists, everywhere (D-091 item 4).
- **M4-R10 Data helpers (D-094, CV-10).** A pure helper lives in `components/<id>/react/<id>.data.ts` AND `components/<id>/remix/<id>.data.ts` (ledger tree 5.1), with the same text except the import specifier form each host uses (React `./<id>.data`, Remix `./<id>.data.ts`). No `"use client"`. Manifest file key `data` (copy the `files` shape of `components/cart-lines/cart-lines.json`). Value imports from `@shopify/hydrogen` are only the seven of CONVENTIONS section 11; every other import from it is `import type`. Types come from `<pkg>` (`import type { ... } from "<pkg>"`, written the way `components/cart-lines/react/cart-lines.data.ts` writes it); declare no copy of a `Ripple*` type.
- **M4-R11 Locale keys.** Add to `locales/en.default.json` only the keys the task section lists, with the English text given. For the schema name keys (`ripple.<id>.name`, `ripple.<id>.<part>_name`) do what M1 did: when the file contains `ripple.product-form.name`, add `ripple.<id>.name` with the component's title as text (for example `Product card`); when it does not, add none. Keys that exist since M1-T20 (`ripple.discount-code.applied`, `ripple.discount-code.removed`, `ripple.cart-note.saved`) are not added again. Never add `ripple.props.*` keys.
- **M4-R12 Acceptance coverage.** `components/<id>/<id>.test.ts` MUST contain, for every numbered item `n` of the spec's "Acceptance tests", either a test whose name contains `AT-<n> ` or one comment line (`docs/13-testing.md` sections 10.1 and 18.2). The task section says which. Comment forms, exact:

  | Case | Line |
  |---|---|
  | generic tier 2, 3, 4 or 6 matrix | `// AT-<n>: generic (<files>)` with the files that apply out of `test/conformance/conformance.test.ts`, `test/upgrade/upgrade.test.ts`, `test/hydration/react.test.ts`, `test/hydration/remix.test.ts`, `test/nojs/render.test.ts` |
  | a `C-nn` test of `docs/05-commerce.md` | `// AT-<n>: generic (test/commerce/hydrogen.test.ts C-<nn>)` or `(test/commerce/liquid.test.ts C-<nn>)` |
  | the hydrogen dev server with scripting disabled | `// AT-<n>: generic (test/nojs/blueprints.test.ts NJ-F<k>, added by M7-T25)` with the NJ-F number the task section gives |
  | tier 7 or mock.shop | `// AT-<n>: generic (test/commerce/e2e.test.ts, added by M7-T26)` |
  | tier 8 | `// AT-<n>: generic (test/liquid/live.test.ts, added by M10-T01)` |
  | a test in another component's file | `// AT-<n>: generic (components/<other id>/<other id>.test.ts AT-<m>, added by <task id>)` |

  When one item has two halves, write the real test and put the comment for the other half on the line above it. Every other item is a real test, never skipped, never `todo`.
- **M4-R13 Component rules.** For every manifest `rules[]` entry one test `[T1] <id>: rule <rule id> reports RP113`: run the checker (`src/check/index.ts`, layer H; copy the call from `components/product-form/product-form.test.ts`) on a failing HTML string and assert exactly one diagnostic `RP113` whose message contains `[<rule id>]`. Plus one test `[T1] <id>: default fixture reports no RP113`; when the component has a `requires-ancestor` rule, this test wraps the `default` fixture HTML in the ancestor the rule names (for example `<form method="get" action="/x">…</form>`).
- **M4-R14 Behaviour tests (`[T5]`).** Two kinds of page:
  1. `fixturePageUrl("<id>/<fixture>")` (`test/support/server.ts`). For a commerce component the fixture page loads `/__test/fake-sa.js` and a config element with host `html` (`docs/13-testing.md` section 5.2).
  2. A page built in the test, for anything that needs more than one fixture (a region next to an `rp-live` root, a cart form next to a CartNote, `dir="rtl"`). After `const opened = await openPage(...)` call `opened.page.route("**/*", handler)`. Reuse the handler and the page constants of `test/commerce/pages.ts` (M1-T29, M1-T30): `GET /` answers with the page HTML string; `/ripple.css` and any `/ripple*.js` with the files of `pkg/browser/`; `/sa.js` with `test/support/fake-sa.js`; everything else is recorded and answered by a per-test route table or `404`. The page markup comes from fixture files read at test time (`components/<id>/fixtures/<name>.html`, relative to `process.cwd()`) or from a block of a spec the task names; never invent component markup. A plain native element with no `rp-` class (a `<form>`, a `<div data-rp-region="...">`, an `<a href>`) MAY be added where the acceptance test describes it. Script: `<script type="module" src="/ripple.js"></script>` with the config element of the hydrogen page of `test/commerce/pages.ts`.
  - The hydrogen cart endpoint is stubbed with `opened.page.route("**/api/cart", ...)` registered before navigation, answering with the cart JSON of `test/commerce/pages.ts`.
  - A refresh by `rp-live`, `rp-predictive-search` or `rp-recommendations` fetches a document: the route table answers that `GET` with a page HTML that contains the named `[data-rp-region]` elements with a visible difference (a changed text), and the test records the request URL. Copy the pattern of test `C-13` in `test/commerce/hydrogen.test.ts`.
  - Wait with `page.waitForFunction` on the observed condition. Fixed waits only for durations a spec states (200 ms predictive debounce).
  - History assertions read `history.length` before and after, and `location.href`.
- **M4-R15 No-JS tests (`[T6]`).** `openPage({ scripts: "disabled" })` on the fixture page or an M4-R14 page; act with a click or the keyboard; read the navigation or form request in a `page.route` handler and fulfil it with an empty HTML page. Assert the URL path, the query, and for a POST the field names of `docs/05-commerce.md` `### 10.5 `. For `noJs.level: "full"` write one test per function of the spec's "Behaviour without JavaScript" and one with `scripts: "blocked"` for the primary function; for `degraded` one test that the stated content is visible and the primary path works (`docs/13-testing.md` section 10.2).
- **M4-R16 Other tests required by `docs/13-testing.md` section 10.2** (no `AT-` id): one `[T5]` test per numbered statement of the spec's "Behaviour with JavaScript" that no acceptance item covers; for a region owner `[T5] <id>: a refresh replaces the region root once` on an M4-R14 page (one `childList` record on the region root's parent; an element outside the region keeps its identity); for the Focus and Announcements statements one `[T5]` test each. The task section names them.
- **M4-R17 Proof commands for a component**, in this order, all exit 0:

  ```bash
  pnpm gen && pnpm typecheck && pnpm gen --check
  pnpm build && pnpm examples:install
  pnpm test:visual --component=<id> --update      # first time only; look at the snapshots, commit them
  pnpm test:component --component=<id> --no-skips
  pnpm test:size
  pnpm ci
  ```

- **M4-R18 The hand-written path for a component the spec calls generated** (ledger D-072; `docs/07-manifest-registry-cli.md` section 2.1). It applies when the task says "Path: hand-written", or when the contract needs something the template language does not have (an `object` prop, a string test, a loop, a host-only default). Then: the manifest has NO `template` key; every fixture has `"generated": "hand"`; every entry of `files.react`, `files.remix`, `files.liquid` has `"generated": false`; write the fixture files by hand (M4-R6); run `pnpm gen` (it writes `html/<id>.html` and the generated regions); write the bindings BELOW the generated regions as recipe C steps 4 and 5 say, without the commerce keys; `status` stays `"stable"`. Extra reading: `docs/07-manifest-registry-cli.md` `### 3.3 Generated regions inside hand-written files` (4 kB) and the repository files `components/price/react/price.tsx`, `components/price/remix/price.tsx`, `components/price/liquid/snippets/rp-price.liquid`. Say in the pull request, under "Deviations and ledger issues", that the component is hand-written and why (one sentence naming the missing template form).
- **M4-R19 Generated output that differs from the spec.** A generated file that differs from HTML or code a spec prints is a defect of the manifest first: fix the manifest. An M4 component task MUST NOT change `src/gen/**` or `test/**` (except the files its section lists). When the generator is wrong: stop, open a draft pull request, name the generator file and the smallest failing manifest. Never edit generated output by hand.

### 0.4 Element, runtime and test tasks

- **M4-R20** An element task follows PLAN recipe E. The controller is copied from `docs/research/spikes/commerce/src/commerce/<tag>.ts`; the shell is appended as `docs/05-commerce.md` `### 7.7 Element shell` states. Markup for tests comes from the spike page (`docs/research/spikes/commerce/run3.cjs`, function `HPAGE`) or from a spec block; never invent markup.
- **M4-R21** Tests of `docs/05-commerce.md` section 14 live in `test/commerce/`: liquid backend tests (marked E) in `test/commerce/liquid.test.ts` as `[T5] commerce-liquid: C-<nn> ...`; hydrogen backend tests in `test/commerce/hydrogen.test.ts` as `[T5] commerce-hydrogen: C-<nn> ...` (`docs/13-testing.md` section 3.1 tree; Plan reading PR-M4-3 for ids the tree does not place). They use the helpers of `test/commerce/pages.ts`. Replace every `sleep` of a spike scenario by `page.waitForFunction`.
- **M4-R22** `src/commerce/**` import rules are enforced by `src/architecture.test.ts`: only `adapter-hydrogen.ts` and `adapter-liquid.ts` import values from `@shopify/hydrogen`; no file imports `announce` from `@ui-sdk/core` (use `../runtime/announcer`).

### 0.5 Spike task (M4-T22)

- **M4-R23** A spike task measures and reports (PLAN 3.4). It MUST NOT apply a fallback. Report headings: `## Question`, `## Procedure`, `## Commands`, `## Results` (one row per check: check, engine, expected, observed, pass or fail), `## Verdict` (`DEFAULT holds` or `FALLBACK required`), `## Not run`.
- **M4-R24** Ledger update: append to the spike's row in the table of `docs/00-decisions.md` section `## 3. Spike tasks` (last cell) exactly one sentence: `Result (<YYYY-MM-DD>): <verdict>; report docs/research/spikes/<name>/README.md.` Change nothing else in the ledger. When the verdict is `FALLBACK required`, write in the done file `FOLLOW-UP NEEDED: apply "Fallback (SPIKE-nn)" of <owning doc>` and stop (PLAN 7.2).

### 0.6 Shared files that several M4 tasks edit

Edit only the lines your task names. When `git rebase origin/main` conflicts in one of them, keep both sides' lines, run `pnpm gen`, re-run the proof commands.

| File | Rule |
|---|---|
| `locales/en.default.json` | add your keys only; keep the file's key order; run `pnpm gen` |
| `src/testing/resources.ts`, the tables of `docs/13-testing.md` 4.2 and `docs/11-components-commerce.md` 0.5 | add entries only (M4-R7); never change an existing entry |
| `components/<other id>/<other id>.json` | only the `liquid.embeddedBy` list (M4-R8) |
| `src/commerce/index.ts` | M4-T16 and M4-T18 each add one import and one `define...()` call; M4-T21 changes `create()` |
| `test/commerce/hydrogen.test.ts` | M4-T16 adds C-14, M4-T18 adds C-15, M4-T20 adds C-27 |
| `test/commerce/liquid.test.ts` | M4-T16, M4-T18, M4-T21 each add their tag to the list of test C-01; M4-T21 adds C-29 |
| `src/check/rules/index.ts` | only M4-T23 |
| generated files (`src/types.generated.ts`, `src/*/jsx.generated.ts`, `css/props.css`, `css/base.css` regions, `components/*/html`, generated regions) | never edited by hand; run `pnpm gen` |

A bring-up line in a source file carries the comment `// PLAN 4.4: <what replaces it and which task>`. M9-T05 fails while that string exists under `src/`.

### 0.7 Definition of done reminder

Every task ends with PLAN section 5.0 (commit, push, pull request in the five-heading form, done file `docs/plan/done/<task id>.md`). "Acceptance" in a task section lists what is specific; PLAN section 3.1 (and 3.2 for components) always applies.

### 0.8 Plan readings made by this file

| # | Topic | Reading |
|---|---|---|
| PR-M4-1 | Fixtures whose prop data is a member of a resource, an array or data in no resource (the fixture schema allows only whole `$resource` references) | M4-R7: new resources named `<component id>.<fixture name>`, added by the component task under RS-2 |
| PR-M4-2 | Swatch is "generated" in `docs/11-components-commerce.md` 0.1 and ledger D-072, but has an `object` prop and a string test, which the template language excludes (`docs/07-manifest-registry-cli.md` 2.2, 2.3) | M4-T01 uses the hand-written path M4-R18. SearchForm (M4-T02) stays generated and switches only for a reason M4-R18 names |
| PR-M4-3 | `docs/13-testing.md` 10.6 says the file of each `C-nn` test is stated in `docs/05-commerce.md` 14; it is not | C-14, C-15, C-27 in `test/commerce/hydrogen.test.ts`; C-29 in `test/commerce/liquid.test.ts`; C-24 in `src/types.test.ts`; C-28 is the test `[T4] react: useRegionHtml returns null during hydration and the HTML after the first publish` of `docs/13-testing.md` 9.1 in `test/hydration/react.test.ts` |
| PR-M4-4 | Content of `src/commerce/rp-*.test.ts` (the specs name only the agent test of `docs/08-agent-kit-and-evals.md` 7.6, which is M8-T03) | one `[T1]` shape test and one `[T5]` smoke test per element, as M1 did |
| PR-M4-5 | C-27 reads `getRegionHtml`, which no browser bundle exports | M4-T20 bundles `src/commerce/refresh-react.ts` with esbuild inside the test and calls the strategy and the store directly |
| PR-M4-6 | C-29 says "one `shopify:page:view` event"; `docs/13-testing.md` ST-6 forbids listening for the event type | M4-T21 counts the `["pageView", init]` entries the emulation `STANDARD_EVENTS_EMULATION` writes to `window.__log` |
| PR-M4-7 | C-24 needs the Shopify docs tool and `.data.ts` mappers that M4-T09 to M4-T12 create | M4-T20 has extra dependencies and a BLOCKED-ON-ENV path (its section) |
| PR-M4-8 | CollectionCard: "a collection without an image ... no shared fixture; covered by a host unit test" names no test form | M4-T04 adds a fixture `no-image` (resource `collection-card.no-image`) so that every host is covered by tier 2 |
| PR-M4-9 | Acceptance items that need a server-rendered page with scripting disabled (PriceRange AT-4, VariantPicker AT-4, CartNote AT-4, DiscountCode AT-4) | comment forms of M4-R12 naming the test that covers them; the component-level half is a real `[T6]` test |
| PR-M4-10 | Tests C-33 to C-39 of `docs/05-commerce.md` 14 have no PLAN row (C-37 concerns the code of M4-T21) | not written in M4; listed in the M4-T24 done file |

---

## M4-T01 Swatch (`swatch`)

- **Goal:** Ship Swatch, the decorative colour or image sample used by VariantPicker and FilterGroup.
- **Depends on:** M1-T46.
- **Kind / recipe:** `static`, tier `block`. PLAN's table says recipe S. Path: hand-written (M4-R18), Plan reading PR-M4-2. Reason: the prop `image` is an `object` and the `fill` value needs a string test (drop a value that contains `;`, `{`, `}`, `<`, `>` or `"`); the template language has neither. `status: "stable"`.

### Read first

`docs/components/swatch.md` (whole, 7 kB). `docs/11-components-commerce.md`: `### 0.4 `, `### 0.7 ` (11 kB). `docs/07-manifest-registry-cli.md` `### 3.3 ` (4 kB). Repository: `components/price/price.json`, `components/price/react/price.tsx`, `components/price/remix/price.tsx`, `components/price/liquid/snippets/rp-price.liquid`, `components/price/liquid/blocks/price.liquid`.

### Files

Create: `components/swatch/swatch.json`, `swatch.css`, `swatch.test.ts`, `fixtures/{default,image,class,invalid-enum-falls-back,unsafe-fill}.html`, `react/swatch.tsx`, `remix/swatch.tsx`, `liquid/blocks/swatch.liquid`, `liquid/snippets/rp-swatch.liquid`. Generated: `html/swatch.html`, generated regions. Change: `locales/en.default.json` (M4-R11: `ripple.swatch.name` = `Swatch` only when the M1 convention applies).

### Steps

1. `git fetch origin && git switch -c task/M4-T01-swatch origin/main && pnpm install --frozen-lockfile`.
2. Manifest (M4-R5), no `template`. Fixtures by hand (M4-R6) from the two fenced blocks and the "Further required fixtures" line of the spec.
3. `pnpm gen`. Write the three bindings below the generated regions. The style attribute is exactly `--rp-swatch-fill:<escaped value>`: no space, no trailing semicolon. React passes it as the spec's Host notes show (`style={{ "--rp-swatch-fill": fill } as CSSProperties}`). An unsafe `fill` is treated as unset in every host; Liquid tests it with the `contains` operator once per forbidden character.
4. CSS from the spec's Styling section (three custom properties, six modifier selectors, the "Required rules" line).
5. Tests, then M4-R17 with `<id>` = `swatch`, then PLAN 5.0.

### Names and values

- Root `span.rp-swatch` with `data-size`, `data-radius`, `aria-hidden="true"`; image part `img.rp-swatch-image` with `alt=""`, `width="96"`, `height="96"`, `loading="lazy"`; Liquid image URL `image | image_url: width: 96`; TSX `imageUrl(image.url, { width: 96 })` from `<pkg>`.
- Props: `fill`, `image`, `size` (`sm md lg`, default `md`), `radius` (`none md full`, default `full`). Schema settings: `size`, `radius`.
- Fixture `image`: prop `image` = `{ "$resource": "image.basic" }`; mask `{ "select": "img", "op": "attr", "name": "src" }`. (The spec says "image of `product.basic`"; the printed attributes other than the masked `src` do not depend on which image it is.)
- No `rules[]` entry. No locale key of its own.

### Tests (`components/swatch/swatch.test.ts`)

`// AT-1: generic (test/conformance/conformance.test.ts)`. `[T5] swatch: AT-2 ...` (fixture `default`; computed `background-color` is `rgb(29, 78, 216)`). `[T1] swatch: default fixture reports no RP113`.

### Acceptance

M4-R17. `grep -c "style=" components/swatch/fixtures/unsafe-fill.html` prints `0`. `grep -c 'style="--rp-swatch-fill:#1d4ed8"' components/swatch/fixtures/default.html` prints `1`.

### Out of scope

VariantPicker, FilterGroup. A text label. Any colour prop other than `fill`.

### If blocked

- React serialises the style with a trailing semicolon or a space and tier 2 fails: the spec's "Evidence and UNVERIFIED" section says the canonicaliser rule for `style` MUST strip it on both sides. Do not edit `src/testing/canonicalize.ts` here: draft pull request naming the difference (owner: `docs/13-testing.md`, `docs/02-html-contract.md` section 12).
- `pnpm gen` writes no generated regions for a hand-written `static` component: draft pull request naming `src/gen/react.ts`, `src/gen/remix.ts` or `src/gen/liquid.ts`.

---

## M4-T02 SearchForm (`search-form`)

- **Goal:** Ship SearchForm, the GET form to the search route that PredictiveSearch and the header embed.
- **Depends on:** M1-T03, M1-T04, M1-T46, M2-T11.
- **Kind / recipe:** `static`, tier `block`; recipe S (the spec's Host notes say the bindings are generated). `status: "stable"`.

### Read first

`docs/components/search-form.md` (whole, 9 kB). `docs/11-components-commerce.md`: `### 0.2 ` (first table, rows `rp-input rp-search-form-input` and `rp-icon-button rp-search-form-submit`; second table, rows Input, IconButton, Icon; the icon table row `search`), `### 0.7 ` (13 kB). `docs/07-manifest-registry-cli.md`: `### 2.3 Nodes` (5 kB). Repository: `components/icon-button/icon-button.json` (a template with an embedded Icon), `components/input/input.json` (the attributes Input prints).

### Files

Create: `components/search-form/search-form.json`, `search-form.css`, `search-form.test.ts`. Generated by `pnpm gen`: `fixtures/{default,predictive,action,sm,class,invalid-enum-falls-back,escaping}.html`, `html/search-form.html`, `react/search-form.tsx`, `remix/search-form.tsx`, `liquid/blocks/search-form.liquid`, `liquid/snippets/rp-search-form.liquid`. Change: `locales/en.default.json`; `components/icon/icon.json` (`liquid.embeddedBy`, M4-R8).

### Steps

1. Branch `task/M4-T02-search-form`.
2. Manifest with a root `template` (recipe S step 1). The input and the submit button are composed by contract: the template prints both elements itself, with part classes `rp-input rp-search-form-input` and `rp-icon-button rp-search-form-submit`; the Icon inside the button is an `embed` node (`"embed": "icon"`, prop `name`: `search`). The slot (`{ "slot": "children" }`) is the FIRST child of the form. `dependencies.components`: `input`, `icon-button`, `icon`; `dependencies.embeds`: `icon`.
3. `liquid.snippet` is present (the markup lives in `snippets/rp-search-form.liquid` because PredictiveSearch embeds it); `liquid.embeddedBy` starts empty and M4-T17 adds `predictive-search`.
4. `pnpm gen`; compare every generated fixture with the spec HTML (recipe S step 5). The attribute order of the input is exactly: `class`, `type="search"`, `data-size`, `name="q"`, `value`, `placeholder`, `aria-label`, `autocomplete="off"`, `data-rp-part="input"`.
5. CSS, tests, M4-R17 with `<id>` = `search-form`, PLAN 5.0.

### Names and values

- Root `form.rp-search-form` with `method="get"`, `action` (default `/search`), `role="search"`.
- Props: `action`, `defaultValue` (Liquid `default_value`), `placeholder`, `ariaLabel` (default the locale string), `size` (`sm md lg`, default `md`; printed as `data-size` on the input AND on the button), `predictive` (boolean; prints `autocomplete="off"` and `data-rp-part="input"` on the input).
- Button: `type="submit"`, `data-variant="ghost"`, `data-size`, `aria-label` = the same string as the input's.
- Locale: `ripple.search-form.label` = `Search`. Schema settings: `placeholder`, `size`.
- Fixture `predictive`: children string `<input type="hidden" name="type" value="product">`.
- Rules: `search-form-q` (`requires-descendant`, selector `:scope`, target `input[type="search"][name="q"]`); `search-form-not-in-form` (`forbids-ancestor`, selector `:scope`, target `form`).

### Tests (`components/search-form/search-form.test.ts`)

| Id | Form |
|---|---|
| AT-1 | `// AT-1: generic (test/conformance/conformance.test.ts)` |
| AT-2 | `[T5] search-form: AT-2 ...` (fixture `default`: the form has role `search` in the accessibility tree; the input's accessible name is `Search`) |
| AT-3 | `[T6] search-form: AT-3 ...` (M4-R15: type `shirt`, press Enter; the navigation request is `/search?q=shirt`) and the same with `scripts: "blocked"` as `[T6] search-form: submits with scripts blocked` |
| rules | M4-R13, two rule tests and the default test |

### Acceptance

M4-R17. `ls components/search-form/fixtures | wc -l` prints `7`.

### Out of scope

PredictiveSearch, `rp-predictive-search`, the search blueprint, Header.

### If blocked

- The Liquid default `action | default: routes.search_url` cannot be generated (the template language has no host-only default; the spec says "the block wrapper applies" it): this is a reason M4-R18 names. Switch to the hand-written path, keep every name above, and record it in the pull request.
- The generator prints the slot or the composed class pair differently from the spec HTML: M4-R19.

---

## M4-T03 ProductCard (`product-card`)

- **Goal:** Ship ProductCard: image, badge, vendor, title link and Price for one product.
- **Depends on:** M1-T08, M1-T09, M1-T10, M1-T46, M2-T18.
- **Kind / recipe:** `static`, tier `resource`; recipes C and R (hand-written). `status: "stable"`.

### Read first

`docs/components/product-card.md` (whole, 13 kB). `docs/11-components-commerce.md`: `### 0.2 ` (first table row `rp-badge rp-product-card-badge`; second table rows Image, Placeholder, Badge), `### 0.4 `, `### 0.5 ` (rows `product.basic`, `product.sale`, `product.sold-out`), `### 0.7 ` (CV-1, CV-2, CV-15) (16 kB). Repository: `components/cart-line/cart-line.json`, `components/cart-line/react/cart-line.tsx`, `components/cart-line/liquid/snippets/rp-cart-line.liquid` (a hand-written static component that embeds Image, Placeholder and Price), `components/price/fixtures/default.html`.

### Files

Create: `components/product-card/product-card.json`, `product-card.css`, `product-card.test.ts`, `fixtures/{default,sale,sold-out,class,invalid-enum-falls-back,escaping,eager}.html`, `react/product-card.tsx`, `remix/product-card.tsx`, `liquid/blocks/product-card.liquid`, `liquid/snippets/rp-product-card.liquid`. Change: `locales/en.default.json`; `liquid.embeddedBy` of `components/image/image.json`, `components/placeholder/placeholder.json`, `components/price/price.json` (M4-R8).

### Steps

1. Branch `task/M4-T03-product-card`. Recipe C steps 1 to 5 (step 6 does not apply: kind `static`), then recipe R.
2. The Liquid markup lives in `snippets/rp-product-card.liquid`; `blocks/product-card.liquid` is the thin wrapper that renders it. `liquid.embeddedBy` starts empty; M4-T17, M4-T19 and M5-T09 add themselves.
3. Embed Image (or Placeholder when the product has no featured image) and Price; compose Badge by contract (the binding prints `<span class="rp-badge rp-product-card-badge" data-variant data-tone data-size>` itself).
4. Tests, M4-R17 with `<id>` = `product-card`, PLAN 5.0.

### Names and values

- Root `div.rp-product-card`; parts `media`, `badge`, `body`, `vendor`, `title` (`h2` to `h6` from prop `level`), `link` (the only child of the title).
- Badge rule: not available: text `Sold out`, `data-tone="neutral"`; else compare-at price greater than price: `Sale`, `data-tone="sale"`; else no badge. TSX sale test: `product.compareAtPrice !== null && Number(product.compareAtPrice.amount) > Number(product.price.amount)`. Liquid: `product.compare_at_price > product.price`.
- The binding MUST NOT build image URLs: Image prints `src` (width 800) and the six-width `srcset`.
- Props in fixtures: `sale` has `showVendor: true`, `level: "2"`; `sold-out` has `ratio: "4/5"`; `invalid-enum-falls-back` has `level: "9"`; `escaping` has `sizes: 'Say "hi" & <go>'`; `eager` has `loading: "eager"`. Resources exist (M4-R7 step 1).
- Masks: `img` `src` (`attr`) and `srcset` (`srcset`) on fixtures with an image; `.rp-price-current` (`text`); `.rp-price-compare` (`text`, fixture `sale`).
- Locale: `ripple.product-card.sale` = `Sale`; `ripple.product-card.sold_out` = `Sold out`. No schema settings. TSX prop `locale` (CV-1).
- Rule: `product-card-not-in-link` (`forbids-ancestor`, selector `:scope`, target `a, button`; message in the spec).

### Tests (`components/product-card/product-card.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `[T5] product-card: AT-2 ...` (fixture `default`; route the product URL; a click at the centre of the image starts a navigation to `/products/linen-shirt`; pressing Tab from the page start reaches exactly one element inside the card) |
| AT-3 | `[T6] product-card: AT-3 ...` (the same click with scripting disabled) |
| AT-4 | `[T5] product-card: AT-4 ...` (fixture `sale` on an M4-R14 page, once with `<html dir="ltr">`, once with `dir="rtl"`: the badge box lies inside the media box) |
| rules | M4-R13 |

### Acceptance

M4-R17. `ls components/product-card/fixtures | wc -l` prints `7`.

### Out of scope

Quick add, swatches on cards, ratings, a second image on hover. ProductRecommendations, PredictiveSearch, FeaturedCollection.

### If blocked

`pnpm gen --check` rejects `liquid.snippet` with an empty `liquid.embeddedBy`: list the three ids the spec names (`product-recommendations`, `predictive-search`, `featured-collection`) only if the check then passes in bring-up mode; otherwise draft pull request naming build check MB-1.

---

## M4-T04 CollectionCard (`collection-card`)

- **Goal:** Ship CollectionCard: image and title link for one collection.
- **Depends on:** M1-T08, M1-T09, M1-T46.
- **Kind / recipe:** `static`, tier `resource`; recipes C and R. `status: "stable"`.

### Read first

`docs/components/collection-card.md` (whole, 7 kB). `docs/11-components-commerce.md`: `### 0.2 ` (rows Image, Placeholder), `### 0.4 `, `### 0.5 ` (row `collection.basic`), `### 0.7 ` (15 kB). Repository: `components/cart-line/react/cart-line.tsx`, `components/cart-line/liquid/snippets/rp-cart-line.liquid`.

### Files

Create: `components/collection-card/collection-card.json`, `.css`, `.test.ts`, `fixtures/{default,class,invalid-enum-falls-back,escaping,props,no-image}.html`, `react/collection-card.tsx`, `remix/collection-card.tsx`, `liquid/blocks/collection-card.liquid` (the markup is in the block; there is no snippet). Change: `locales/en.default.json` (M4-R11); `liquid.embeddedBy` of `components/image/image.json` and `components/placeholder/placeholder.json`; `src/testing/resources.ts` and the two resource tables (M4-R7).

### Steps

1. Branch `task/M4-T04-collection-card`. Recipes C and R.
2. Image: embed with `image`, `sizes`, `loading`, `ratio`; when the collection has no image render Placeholder with `ratio`.
3. Tests, M4-R17 with `<id>` = `collection-card`, PLAN 5.0.

### Names and values

- Root `div.rp-collection-card`; parts `media`, `title` (`h2` to `h6`), `link`.
- Fixture `props`: `level: "2"`, `ratio: "3/2"`, `loading: "eager"`. Masks: `img` `src` (`attr`), `srcset` (`srcset`).
- Fixture `no-image` (Plan reading PR-M4-8): prop `collection` = `{ "$resource": "collection-card.no-image" }`; new resource: `collection.basic` with no image on both sides (hydrogen `image: null`; liquid `image` nil). HTML: the `default` fixture with `<div class="rp-placeholder" data-ratio="1/1" data-radius="none" aria-hidden="true"></div>` in place of the `<img>`; no mask.
- No schema settings. No locale key of its own.
- Rule: `collection-card-not-in-link` (`forbids-ancestor`, selector `:scope`, target `a, button`).

### Tests (`components/collection-card/collection-card.test.ts`)

`// AT-1: generic (test/conformance/conformance.test.ts)`. `[T6] collection-card: AT-2 ...` (scripting disabled; a click on the image starts a navigation to `/collections/summer`). Rule tests (M4-R13).

### Acceptance

M4-R17. `grep -c "rp-placeholder" components/collection-card/fixtures/no-image.html` prints `1`.

### Out of scope

Product counts, descriptions. The `collections-list` blueprint.

### If blocked

Default path only. If the fixture lint rejects a fixture the spec does not list (`no-image`), remove it and write instead `[T2] collection-card: a collection without an image prints the Placeholder` in the test file, rendering the Liquid block through the shim the way `components/add-to-cart-button/add-to-cart-button.test.ts` (AT-2) does; say so in the pull request.

---

## M4-T05 ArticleCard (`article-card`)

- **Goal:** Ship ArticleCard: image, date, title link and excerpt for one blog article.
- **Depends on:** M1-T08, M1-T09, M1-T46.
- **Kind / recipe:** `static`, tier `resource`; recipes C and R. `status: "stable"`.

### Read first

`docs/components/article-card.md` (whole, 8 kB). `docs/11-components-commerce.md`: `### 0.2 ` (rows Image, Placeholder), `### 0.4 `, `### 0.5 ` (row `article.basic`), `### 0.7 ` (15 kB). Repository: `components/cart-line/react/cart-line.tsx`, `components/cart-line/liquid/snippets/rp-cart-line.liquid`.

### Files

Create: `components/article-card/article-card.json`, `.css`, `.test.ts`, `fixtures/{default,class,invalid-enum-falls-back,escaping,props}.html`, `react/article-card.tsx`, `remix/article-card.tsx`, `liquid/blocks/article-card.liquid`. Change: `locales/en.default.json` (M4-R11); `liquid.embeddedBy` of `components/image/image.json` and `components/placeholder/placeholder.json`.

### Steps

1. Branch `task/M4-T05-article-card`. Recipes C and R.
2. Date: TSX text `new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(article.publishedAt))`, attribute `datetime` = `article.publishedAt.slice(0, 10)`. Liquid text `{{ article.published_at | date: format: 'abbreviated_date' }}`, attribute `datetime="{{ article.published_at | date: '%Y-%m-%d' }}"`.
3. Excerpt: plain text, escaped; the part is printed only when the excerpt is not empty.
4. Tests, M4-R17 with `<id>` = `article-card`, PLAN 5.0.

### Names and values

- Root `div.rp-article-card`; parts `media`, `body`, `date` (`time.rp-article-card-date`), `title` (`h2` to `h6`), `link`, `excerpt`.
- Fixture `props`: `level: "2"`, `ratio: "16/9"`, `loading: "eager"`.
- Masks: `img` `src` and `srcset`; `{ "select": ".rp-article-card-date", "op": "text" }`. The `datetime` attribute is NOT masked and is `2026-06-01` in every host.
- TSX prop `locale` (CV-1). No schema settings. No locale key of its own.
- Rule: `article-card-not-in-link` (`forbids-ancestor`, selector `:scope`, target `a, button`).

### Tests (`components/article-card/article-card.test.ts`)

`// AT-1: generic (test/conformance/conformance.test.ts)` (the unmasked `datetime` is part of the compared HTML). `[T6] article-card: AT-2 ...` (scripting disabled; a click on the image starts a navigation to `/blogs/news/how-to-wash-linen`). Rule tests.

### Acceptance

M4-R17. `grep -c 'datetime="2026-06-01"' components/article-card/fixtures/default.html` prints `1`.

### Out of scope

Author, tags, comment counts, HTML excerpts. The `blog` and `article` blueprints.

### If blocked

The shim's `date` filter does not implement `format: 'abbreviated_date'` (the spec marks it UNVERIFIED; expected text `Jun 1, 2026` for `en`): the date text is masked, so tier 2 still passes when the filter returns any text; when the filter throws, draft pull request naming `src/testing/liquid-shim.ts` (owner M0-T12). Do not edit the shim.

---

## M4-T06 PriceRange (`price-range`)

- **Goal:** Ship PriceRange: the two number inputs of a price filter.
- **Depends on:** M1-T46, M2-T11.
- **Kind / recipe:** `static`, tier `resource`; recipes C and R. `status: "stable"`.

### Read first

`docs/components/price-range.md` (whole, 9 kB). `docs/11-components-commerce.md`: `### 0.2 ` (row Input), `### 0.4 `, `### 0.5 ` (row `filters.basic`), `### 0.7 ` (15 kB). Repository: `components/input/fixtures/default.html`, `components/input/liquid/snippets/rp-input.liquid` (its params), `components/add-to-cart-button/add-to-cart-button.test.ts` (how a test renders a Liquid snippet through the shim).

### Files

Create: `components/price-range/price-range.json`, `.css`, `.test.ts`, `fixtures/{default,bounded,empty,class,invalid-enum-falls-back}.html`, `react/price-range.tsx`, `remix/price-range.tsx`, `liquid/blocks/price-range.liquid`, `liquid/snippets/rp-price-range.liquid`. Change: `locales/en.default.json`; `liquid.embeddedBy` of `components/input/input.json`; `src/testing/resources.ts` and the two resource tables (M4-R7).

### Steps

1. Branch `task/M4-T06-price-range`. Recipes C and R.
2. The two inputs are the embedded Input (`type="number"`, `min="0"`, `step="any"`, `name`, `value`, `size`), with `inputmode="decimal"` passed as a native attribute (TSX rest prop; Liquid `attributes`). They carry no `id`; each is labelled by its wrapping `<label class="rp-price-range-field">`.
3. Liquid number text from cents `c`, exactly as the spec's "Number text rule" states: `cents = c | modulo: 100`, `whole = c | minus: cents | divided_by: 100`; text is `whole` when `cents` is 0, otherwise `whole`, `.`, `cents` left-padded to two digits. Blank value: no `value` attribute.
4. Tests, M4-R17 with `<id>` = `price-range`, PLAN 5.0.

### Names and values

- Root `div.rp-price-range`; parts `field` (two), `field label` (`span.rp-price-range-label`), `input` (class `rp-input`).
- TSX props: `minName` (default `filter.v.price.gte`), `maxName` (default `filter.v.price.lte`), `min`, `max`, `rangeMax`, `size`, `strings`. Liquid params: `filter` (required), `size`.
- Resources to add (M4-R7), liquid side used, hydrogen side the matching `RippleFilter`: `price-range.default` (the `Price` filter of `filters.basic`: max 5000 cents, no min), `price-range.bounded` (`min_value.value` 1000, `max_value.value` 5050, `range_max` 12000; hydrogen price `min: "10"`, `max: "50.5"`, `rangeMax: "120"`), `price-range.empty` (no bound set). The TSX fixtures pass the scalar props of the spec's fixture lines; the Liquid param `filter` passes the resource.
- Mask, fixture `bounded` only: `{ "select": "input[name=\"filter.v.price.lte\"]", "op": "attr", "name": "value" }`.
- Locale: `ripple.price-range.from` = `From`; `ripple.price-range.to` = `To`. No schema settings.
- Rules: `price-range-in-get-form` (`requires-ancestor`, selector `:scope`, target `form[method="get"]`); `price-range-two-inputs` (`max-count`, selector `:scope input[type="number"]`, count 2).

### Tests (`components/price-range/price-range.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `[T2] price-range: AT-2 ...` (render `snippets/rp-price-range.liquid` through the shim with four `filter` values: max 5000 prints `value="50"`, 5005 prints `50.05`, 5050 prints `50.50`, blank prints no `value` attribute) |
| AT-3 | `[T5] price-range: AT-3 ...` (accessible names `From` and `To`) |
| AT-4 | `// AT-4: generic (components/filters/filters.test.ts AT-4, added by M4-T09)` |
| no-JS | `[T6] price-range: the inputs are submitted with the enclosing GET form` (M4-R14 page: fixture `default` inside `<form method="get" action="/collections/summer">` with a submit button; the request query contains `filter.v.price.lte=50`) |
| rules | M4-R13 (the default test wraps the fixture in `<form method="get" action="/x">`) |

### Acceptance

M4-R17. `ls components/price-range/fixtures | wc -l` prints `5`.

### Out of scope

A range slider (ledger section 11 item 7). Currency symbols. Zero-decimal currencies (the spec marks the divisor UNVERIFIED; `docs/14-liquid-theme.md` owns it). FilterGroup, Filters.

### If blocked

The shim does not implement `modulo`, `minus` or `divided_by`: draft pull request naming `src/testing/liquid-shim.ts`; do not edit it.

---

## M4-T07 FilterGroup (`filter-group`)

- **Goal:** Ship FilterGroup: one `<details>` per filter with checkboxes (and Swatches) or a PriceRange.
- **Depends on:** M1-T07, M1-T46, M2-T14, M4-T01, M4-T06.
- **Kind / recipe:** `static`, tier `resource`; recipes C and R. `status: "stable"`.

### Read first

`docs/components/filter-group.md` (whole, 12 kB). `docs/11-components-commerce.md`: `### 0.2 ` (rows Checkbox, VisuallyHidden), `### 0.4 `, `### 0.5 ` (row `filters.basic`), `### 0.7 ` (15 kB). Repository: `components/checkbox/fixtures/default.html`, `components/swatch/fixtures/default.html`, `components/price-range/fixtures/default.html`, `components/price-range/react/price-range.tsx`.

### Files

Create: `components/filter-group/filter-group.json`, `.css`, `.test.ts`, `fixtures/{default,price,swatch-disabled,class,escaping}.html`, `react/filter-group.tsx`, `remix/filter-group.tsx`, `liquid/blocks/filter-group.liquid`, `liquid/snippets/rp-filter-group.liquid`. Change: `locales/en.default.json`; `liquid.embeddedBy` of `components/checkbox/checkbox.json`, `components/swatch/swatch.json`, `components/price-range/price-range.json`, `components/visually-hidden/visually-hidden.json` (only those whose snippet the Liquid binding renders); `src/testing/resources.ts` and the two resource tables.

### Steps

1. Branch `task/M4-T07-filter-group`. Recipes C and R.
2. Body: `filter.type == 'price_range'` renders PriceRange; every other type renders the values list. Value `label` children in order: Checkbox input, optional Swatch, value label, value count (the count in parentheses).
3. A checkbox is `disabled` when its count is 0 and it is not active. The count part of the trigger shows the number of active values (price range: `1` when min or max is set) and is not printed when 0.
4. React: `defaultChecked={value.active}`; `open={open}` as an initial attribute only; the PriceRange gets `key={min + ":" + max}`.
5. Tests, M4-R17 with `<id>` = `filter-group`, PLAN 5.0.

### Names and values

- Root `details.rp-filter-group`; parts `trigger` (`summary`), `count`, `content`, `values` (`ul`), `value` (`label`), `value label`, `value count`; classes in the spec's Anatomy table.
- Props: `filter` (required), `open` (boolean; fixture `swatch-disabled` passes `false`), TSX `strings`.
- Resources (M4-R7): `filter-group.default` (the `Availability` filter of `filters.basic`); fixture `price` uses `price-range.default` (exists since M4-T06; its hydrogen side is the `Price` `RippleFilter`); `filter-group.swatch-disabled` (label `Color`; values `Blue` name `filter.v.option.color` value `Blue` count 3 not active swatch colour `#1d4ed8`; `Sand` value `Sand` count 0 not active swatch colour `#d6c7a1`); `filter-group.escaping` (`filter-group.default` with label `Say "hi" & <go>`).
- Liquid members read: `filter.type`, `filter.label`, `filter.values`, `filter.active_values.size`, `filter.min_value.value`, `filter.max_value.value`; value `.param_name`, `.value`, `.label`, `.count`, `.active`, `.swatch.color`, `.swatch.image`.
- Locale: `ripple.filter-group.selected` = `selected`. No schema settings. No masks.
- Rules: `filter-group-in-get-form` (`requires-ancestor`, selector `:scope`, target `form[method="get"]`); `filter-group-labelled-values` (`forbids-descendant`, selector `.rp-filter-group-values`, target `input:not(label input)`); messages in the spec.

### Tests (`components/filter-group/filter-group.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `[T5] filter-group: AT-2 ...` (fixture `default`: first checkbox name `In stock (8)`; summary name `Availability 1 selected`) |
| AT-3 | `[T5] filter-group: AT-3 ...` (M4-R14 page: fixture `swatch-disabled` inside `<form method="get">`; the `Sand` checkbox matches `:disabled`; after checking `Blue`, `new FormData(form)` has no entry with value `Sand`) |
| AT-4 | `[T6] filter-group: AT-4 ...` (scripting disabled: clicking the summary toggles the `open` property and the content's visibility) |
| rules | M4-R13 (the default test wraps the fixture in a GET form) |

### Acceptance

M4-R17. `ls components/filter-group/fixtures | wc -l` prints `5`.

### Out of scope

Filters (the form and the region). "Show more" for long value lists. A Liquid filter of type `boolean` through `filter.true_value` (the spec marks it UNVERIFIED and gives it to `docs/14-liquid-theme.md`).

### If blocked

`components/price-range/` or `components/swatch/` is missing: the dependency is not done; do not start.

---

## M4-T08 LiveForm (`live-form`)

- **Goal:** Ship LiveForm: the `rp-live` wrapper that turns the GET forms and links inside it into in-place region refreshes.
- **Depends on:** M1-T46.
- **Kind / recipe:** `commerce`, tier `block`; recipe C. `status: "beta"`.

### Read first

`docs/components/live-form.md` (whole, 9 kB). `docs/11-components-commerce.md`: `### 0.3 ` (rules RS-3 and RS-7 only), `### 0.7 ` (CV-3, CV-5, CV-8) (12 kB). `docs/05-commerce.md` `### 7.3 ` (2 kB) and `### 8.2 ` (3 kB). Repository: `components/cart-link/cart-link.json`, `components/cart-link/react/cart-link.tsx`, `components/cart-link/remix/cart-link.tsx`, `components/cart-link/liquid/blocks/cart-link.liquid`; test `C-13` in `test/commerce/hydrogen.test.ts`.

### Files

Create: `components/live-form/live-form.json`, `.css`, `.test.ts`, `fixtures/{default,form,class,escaping}.html`, `react/live-form.tsx`, `remix/live-form.tsx`, `liquid/blocks/live-form.liquid`. Change: `locales/en.default.json` (M4-R11).

### Steps

1. Branch `task/M4-T08-live-form`. Recipe C.
2. The root is `<rp-live class="rp-live-form" data-slot="rp-live" data-rp-refresh="<refresh>">` around the children. No hook, no `"use client"`. Remix: prop `rmxKey` prints `data-rmx-key`, omitted when unset.
3. `dependencies.elements` contains `rp-live`. `dependencies.components` is empty (the Label, Select and Button markup inside fixture `form` is the caller's children).
4. Tests, M4-R17 with `<id>` = `live-form`, PLAN 5.0.

### Names and values

- Prop `refresh` (string, required, not responsive, printed escaped). Fixture `escaping`: `refresh` = `a"b`, attribute `a&quot;b`.
- State: `data-pending` and `aria-busy` on the root, writer `rp-live`. `upgradeAllow`: the one entry of the spec.
- No locale key of its own. No schema settings. No masks. Agent: `accessibility-tree`, no actions.
- Rules: `live-form-not-nested` (`forbids-ancestor`, selector `:scope`, target `rp-live`); `live-form-no-post` (`forbids-descendant`, selector `:scope`, target `form[method="post" i]`; message in the spec).

### Tests (`components/live-form/live-form.test.ts`)

All `[T5]` tests use an M4-R14 page: the fixture plus `<div data-rp-region="rp-collection-results">A</div>` (and the other regions the fixture names); the document route answers with the same page where the region text is `B`.

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `[T5] live-form: AT-2 ...` (fixture `default`: a click on the link dispatches one `rp:refresh` on `document` with `detail.regions` `["rp-collection-results"]` and `detail.reason` `"filter"`; `history.length` grows by 1; a Ctrl+click dispatches none) |
| AT-3 | `[T5] live-form: AT-3 ...` (fixture `form`: selecting `48` yields a refresh whose URL contains `limit=48`) |
| AT-4 | `[T5] live-form: AT-4 ...` (page with `refresh` `rp-product-buy` and a region of that name: `history.length` does not change; `location.href` is the new URL) |
| AT-5 | `[T6] live-form: AT-5 ...` (scripting disabled: the link navigates; in fixture `form` the Apply button has a non-`none` computed `display`) |
| behaviour 3 | `[T5] live-form: an empty refresh list navigates` (page with `data-rp-refresh=""`: a click starts a document navigation to the link's `href`) |
| behaviour 4 | `[T5] live-form: a failed refresh navigates to the URL` (the document route answers `500` to the fetch; a navigation to the URL follows) |
| rules | M4-R13 |

### Acceptance

M4-R17. `grep -c 'data-slot="rp-live"' components/live-form/fixtures/default.html` prints `1`.

### Out of scope

`src/commerce/rp-live.ts` (M1-T28). Filters, SortSelect, VariantPicker. A `<Frame>`. POST forms.

### If blocked

A `[T5]` test fails because `rp-live` behaves differently from `docs/05-commerce.md` section 7.3: that is a defect of M1-T28; fix it in this branch only when the fix is under 20 lines (commit `M4-T08: fix rp-live: <defect>`), otherwise draft pull request.

---

## M4-T09 Filters (`filters`)

- **Goal:** Ship Filters: the GET form of FilterGroups with the region `rp-collection-filters` and the no-JS Apply button.
- **Depends on:** M1-T01, M1-T46, M4-T06, M4-T07.
- **Kind / recipe:** `commerce`, tier `resource`; recipes C and R. `status: "beta"`.

### Read first

`docs/components/filters.md` (whole, 18 kB). `docs/11-components-commerce.md`: `### 0.2 ` (first table row `rp-button rp-filters-submit`; second table row Button), `### 0.3 `, `### 0.4 `, `### 0.5 ` (row `filters.basic`), `### 0.7 ` (CV-3, CV-5, CV-8, CV-9, CV-10) (22 kB). In `### 0.6 ` only the fragment `RippleFilter` (search `fragment RippleFilter`; 1 kB). Repository: `components/cart-lines/cart-lines.json`, `components/cart-lines/react/cart-lines.tsx` (region part export), `components/cart-lines/react/cart-lines.data.ts`, `components/cart-lines/liquid/snippets/rp-cart-lines-list.liquid`, `components/filter-group/fixtures/{default,price}.html`.

### Files

Create: `components/filters/filters.json`, `.css`, `.test.ts`, `fixtures/{default,search-sorted,empty,closed,class,children,escaping}.html`, `react/filters.tsx`, `react/filters.data.ts`, `remix/filters.tsx`, `remix/filters.data.ts`, `liquid/blocks/filters.liquid`, `liquid/snippets/rp-filters.liquid`, `liquid/snippets/rp-filters-groups.liquid`. Change: `locales/en.default.json`; `liquid.embeddedBy` of `components/filter-group/filter-group.json`; `src/testing/resources.ts` and the two resource tables.

### Steps

1. Branch `task/M4-T09-filters`. Recipes C and R.
2. Region part `FiltersGroups` (Liquid `snippets/rp-filters-groups.liquid`, params exactly `collection`, `search`, `open`) prints `<div class="rp-filters-groups" data-rp-region="rp-collection-filters">`: first the carried hidden inputs (`sort_by` when the current sort is not the default; `q` on a search page), then one FilterGroup per filter. A filter with no values that is not a price range is skipped.
3. Submit: composed by contract, printed by the binding: `<button class="rp-button rp-filters-submit" type="submit" ... data-rp-js="fallback">` with the Button attributes of the spec's fixture.
4. `react/filters.data.ts`: `toRippleFilters(filters, searchParams, pathname)` exactly as the numbered steps of the spec's Props section state; value imports from `@shopify/hydrogen`: `parseCollectionParams`, `serializeCollectionParams`, `isFilterInputActive` (the spec's list wins). Same file under `remix/` (M4-R10).
5. React keys: each FilterGroup `key={filter.label}`; each input `key={name + "=" + value + ":" + active}`. Remix: `data-rmx-key="<id>"` on the root; the form carries no `data-rmx-*` attribute.
6. Tests, M4-R17 with `<id>` = `filters`, PLAN 5.0.

### Names and values

- Root `rp-live.rp-filters` with `data-slot="rp-live"`, `data-rp-refresh` (default `rp-collection-results rp-collection-filters rp-collection-toolbar`). Form `form.rp-filters-form`, `method="get"`, `id` = the prop `id` (fixtures use `filters`).
- Resources (M4-R7): `filters.default` (hydrogen: the `filters` array of `filters.basic`; liquid: the liquid side of `filters.basic`, a collection stand-in); `filters.search-sorted` (hydrogen: the same array; liquid: a `search` drop stand-in with the same filters, `sort_by` `price-ascending`, a different `default_sort_by`, `terms` `shirt`); `filters.empty` (hydrogen `[]`; liquid: a collection stand-in with no filters); `filters.escaping` (hydrogen: the same array; liquid: a `search` drop stand-in with `terms` `Say "hi" & <go>`). Fixtures `closed`, `class`, `children` use `filters.default`. Scalar TSX props per fixture (`action`, `sortBy`, `query`, `refresh`, `open`) are those of the spec's fixture lines.
- Liquid: source `search.filters` when `search` is given, else `collection.filters`; action `routes.search_url` or `collection.url`.
- Locale: `ripple.filters.apply` = `Apply filters`. No schema settings. No masks.
- `upgradeAllow`: the two entries of the spec. Agent: `accessibility-tree`, no actions.
- Rules: `filters-get-form`, `filters-fallback-submit`, `filters-region`, `filters-not-in-form` (kinds, selectors, targets, messages in the spec's Checker rules section).

### Tests (`components/filters/filters.test.ts`)

`[T5]` tests use an M4-R14 page: fixture `default` plus `<div data-rp-region="rp-collection-results">A</div>` and `<div data-rp-region="rp-collection-toolbar"></div>`.

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `[T5] filters: AT-2 ...` (no browser: import `toRippleFilters` from `components/filters/react/filters.data.ts`; input: a Storefront API `filters` array written in the test in the shape of the fragment `RippleFilter` of section 0.6 for the two filters of `filters.basic`, with `new URLSearchParams("filter.v.availability=1&filter.v.price.lte=50")` and pathname `/collections/summer`; the result deep-equals `RESOURCES["filters.basic"].hydrogen.filters`) |
| AT-3 | `[T5] filters: AT-3 ...` (check `Out of stock`: one `rp:refresh` with `reason` `"filter"`; `history.length` grows by 1; the URL contains `filter.v.availability=0` and none of `page=`, `before=`, `after=`) |
| AT-4 | `[T5] filters: AT-4 ...` (clear the `To` input and submit: the URL has no `filter.v.price.lte`; then type `20` into `From` and press Enter: the URL contains `filter.v.price.gte=20` and no `filter.v.price.lte`; this also covers PriceRange AT-4) |
| AT-5 | `[T6] filters: AT-5 ...` (scripting disabled: the submit button is displayed; checking `Out of stock` and pressing it navigates to a URL with `filter.v.availability=0`) |
| AT-6 | `[T5] filters: AT-6 ...` (after AT-3's change, `page.goBack()` loads the previous URL) |
| region | `[T5] filters: a refresh replaces the region root once` (M4-R16) |
| rules | M4-R13, four rule tests |

### Acceptance

M4-R17. `grep -c 'data-rp-region="rp-collection-filters"' components/filters/fixtures/default.html` prints `1`. `cmp <(sed 's#\./filters\.data\.ts#./filters.data#' components/filters/remix/filters.data.ts) components/filters/react/filters.data.ts` prints nothing when the two files differ only in import specifiers.

### Out of scope

FilterChips, SortSelect, the `collection` and `search` blueprints, a Drawer around the filters, `createCollectionStore` (prohibited, CONVENTIONS 15).

### If blocked

- The Storefront API filter `input` strings and `type` values needed for AT-2 are UNVERIFIED in the spec: write the input the fragment shows (`type: "LIST"` / `"PRICE_RANGE"`, `values[].input` as a JSON string such as `{"available":true}`) and list the test under "Deviations and ledger issues" as resting on UNVERIFIED names (C-24, M4-T20).
- AT-2 does not deep-equal because `removeUrl` parameter order differs: compare `removeUrl` after parsing both sides with `URLSearchParams` and sorting; say so in the pull request.

---

## M4-T10 FilterChips (`filter-chips`)

- **Goal:** Ship FilterChips: one remove link per active filter value and a clear-all link, enhanced by `rp-live`.
- **Depends on:** M1-T03, M1-T07, M1-T46.
- **Kind / recipe:** `commerce`, tier `resource`; recipes C and R. `status: "beta"`.

### Read first

`docs/components/filter-chips.md` (whole, 12 kB). `docs/11-components-commerce.md`: `### 0.2 ` (rows Icon, VisuallyHidden; icon table row `close`), `### 0.4 `, `### 0.5 ` (row `filters.basic`), `### 0.7 ` (20 kB). Repository: `components/cart-link/cart-link.json`, `components/cart-lines/react/cart-lines.data.ts`.

### Files

Create: `components/filter-chips/filter-chips.json`, `.css`, `.test.ts`, `fixtures/{default,empty,refresh,class,escaping}.html`, `react/filter-chips.tsx`, `react/filter-chips.data.ts`, `remix/filter-chips.tsx`, `remix/filter-chips.data.ts`, `liquid/blocks/filter-chips.liquid`, `liquid/snippets/rp-filter-chips.liquid`. Change: `locales/en.default.json`; `liquid.embeddedBy` of `components/icon/icon.json` (and `visually-hidden` when its snippet is rendered); `src/testing/resources.ts` and the two resource tables.

### Steps

1. Branch `task/M4-T10-filter-chips`. Recipes C and R.
2. No active filter: the root is printed with NO children. Otherwise: `ul.rp-filter-chips-list` (with `role="list"`), then the clear link. Chip children in order: VisuallyHidden span with the remove string, chip label, Icon `close`.
3. `react/filter-chips.data.ts`: `toFilterChips(filters, { pathname, searchParams, formatPrice })` as the spec's Props section states (`getFilterRemovalUrl` is the allowed value import). Price chip label: both bounds `<min> - <max>`; only max `Up to <max>`; only min `From <min>`.
4. Liquid: chips from `filter.active_values` (`value.label`, `value.url_to_remove`) and, for a `price_range` with a set bound, one chip with `filter.url_to_remove`; clear URL as the spec's Host notes state (`url_encode` for the search terms).
5. React `key={chip.url}`. Remix `rmxKey` prints `data-rmx-key`, omitted when unset.
6. Tests, M4-R17 with `<id>` = `filter-chips`, PLAN 5.0.

### Names and values

- Root `rp-live.rp-filter-chips` with `data-slot="rp-live"`, `data-rp-refresh` (default `rp-collection-results rp-collection-filters rp-collection-toolbar`).
- TSX props `chips`, `clearUrl`, `refresh`, `strings`; Liquid params `collection`, `search`, `refresh`.
- Resources (M4-R7): `filter-chips.default` (hydrogen: the two chips `toFilterChips` returns for `filters.basic`; liquid: the liquid side of `filters.basic`); `filter-chips.empty` (hydrogen `[]`; liquid: a collection stand-in with no active value); `filter-chips.escaping` (one chip with label `Say "hi" & <go>` on both sides). Fixtures `refresh` and `class` use `filter-chips.default`. `clearUrl` is a scalar prop (`/collections/summer`).
- Masks: `.rp-filter-chips-chip` `href` (`attr`); `.rp-filter-chips-clear` `href` (`attr`); in `default` `{ "select": "li:nth-child(2) .rp-filter-chips-label", "op": "text" }`.
- Locale: `ripple.filter-chips.remove` = `Remove filter: ` (with the trailing space); `ripple.filter-chips.clear` = `Clear all`; `ripple.filter-chips.up_to` = `Up to {{ max }}`; `ripple.filter-chips.from` = `From {{ min }}`. No schema settings.
- Rule: `filter-chips-links` (`forbids-descendant`, selector `:scope`, target `.rp-filter-chips-chip:not(a[href])`).

### Tests (`components/filter-chips/filter-chips.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `[T5] filter-chips: AT-2 ...` (no browser: `toFilterChips(RESOURCES["filters.basic"].hydrogen.filters, { pathname: "/collections/summer", searchParams: new URLSearchParams("filter.v.availability=1&filter.v.price.lte=50"), formatPrice: (amount) => "$" + amount })` returns two chips; the first `url` has no `filter.v.availability` and keeps `filter.v.price.lte=50`; `clearUrl` is `/collections/summer`) |
| AT-3 | `[T5] filter-chips: AT-3 ...` (M4-R14 page: `<div data-rp-region="rp-collection-toolbar">` + fixture `default` + `</div>`, plus the two other regions; a click on the first chip yields one `rp:refresh` with `reason` `"filter"`, one history entry, and afterwards `document.activeElement` is inside the toolbar region) |
| AT-4 | `[T6] filter-chips: AT-4 ...` (scripting disabled: the same click navigates to the chip's `href`) |
| rules | M4-R13 |

### Acceptance

M4-R17. `components/filter-chips/fixtures/empty.html` contains one element and no `<ul`: `grep -c "<ul" components/filter-chips/fixtures/empty.html` prints `0`.

### Out of scope

Filters, SortSelect, the toolbar region (blueprint-owned).

### If blocked

`toFilterChips` needs the Storefront filter `input` of each value to call `getFilterRemovalUrl`, and `RippleFilterValue` (`docs/05-commerce.md` 11.1) may not carry it: use what the spec's Props section says (search `getFilterRemovalUrl` there); when the type lacks the field the spec reads, stop and record it under `## Ledger issues` of `docs/11-components-commerce.md`; do not edit `src/types.ts`.

---

## M4-T11 SortSelect (`sort-select`)

- **Goal:** Ship SortSelect: the GET form with the `sort_by` select that keeps the active filters.
- **Depends on:** M1-T01, M1-T46, M2-T10, M2-T13.
- **Kind / recipe:** `commerce`, tier `resource`; recipes C and R. `status: "beta"`.

### Read first

`docs/components/sort-select.md` (whole, 12 kB). `docs/11-components-commerce.md`: `### 0.2 ` (rows Label, Select, Button, and the paragraph that starts "A foundation control that carries a hook attribute"), `### 0.4 `, `### 0.5 ` (row `filters.basic`), `### 0.7 ` (20 kB). Repository: `components/select/fixtures/default.html`, `components/label/fixtures/default.html`, `components/cart-link/cart-link.json`, `components/cart-lines/react/cart-lines.data.ts`; test `C-13` in `test/commerce/hydrogen.test.ts`.

### Files

Create: `components/sort-select/sort-select.json`, `.css`, `.test.ts`, `fixtures/{default,search,children,sm,class,invalid-enum-falls-back,escaping}.html`, `react/sort-select.tsx`, `react/sort-select.data.ts`, `remix/sort-select.tsx`, `remix/sort-select.data.ts`, `liquid/blocks/sort-select.liquid`, `liquid/snippets/rp-sort-select.liquid`. Change: `locales/en.default.json`; `liquid.embeddedBy` of the components whose snippet the Liquid binding renders (`label`, `select`); `src/testing/resources.ts` and the two resource tables.

### Steps

1. Branch `task/M4-T11-sort-select`. Recipes C and R.
2. Form children in order: carried hidden inputs (one per active filter parameter, then `q` on a search page), label (`label.rp-label`, `for` = `<id>`), select (`select.rp-select`, `id` = `<id>`, `name="sort_by"`), submit. The submit button is printed by the binding itself with class `rp-button`, Button's attributes for the props of the fixture, and `data-rp-js="fallback"` (section 0.2 paragraph named above).
3. `react/sort-select.data.ts`: `sortParams(searchParams)` returns every pair whose name starts with `filter.` plus the pair `q` when present, in URL order.
4. React: uncontrolled select, `defaultValue={value}` with `key={value}`. Remix: `data-rmx-key="<id>"` on the root.
5. Tests, M4-R17 with `<id>` = `sort-select`, PLAN 5.0.

### Names and values

- Root `rp-live.rp-sort-select` with `data-slot="rp-live"`, `data-rp-refresh` (default `rp-collection-results rp-collection-filters rp-collection-toolbar`). Form `form.rp-sort-select-form`, `method="get"`.
- TSX props `id`, `options`, `value`, `action`, `params`, `refresh`, `size`, `strings`; Liquid params `id`, `collection`, `search`, `refresh`, `size`. `size` prints `data-size` on the select AND the submit button.
- Resources (M4-R7): `sort-select.default` (hydrogen: the `sortOptions` of `filters.basic` as `RippleSortOption[]`; liquid: the liquid side of `filters.basic`); `sort-select-params.default` (both sides `[["filter.v.availability", "1"], ["filter.v.price.lte", "50"]]`); `sort-select.search` (hydrogen: the same options; liquid: a `search` drop stand-in with the same `sort_options`, `sort_by` `price-ascending`, `terms` `shirt`, no active filter); `sort-select-params.search` (`[["q", "shirt"]]`); `sort-select.escaping` (the options with one label `Say "hi" & <go>` on both sides). Fixtures `children`, `sm`, `class`, `invalid-enum-falls-back` use the `default` resources.
- Locale: `ripple.sort-select.label` = `Sort by`; `ripple.sort-select.submit` = `Sort`. Schema setting: `size`. No masks.
- Rules: `sort-select-fallback-submit`, `sort-select-name`, `sort-select-not-in-form` (kinds, selectors, targets, message in the spec).

### Tests (`components/sort-select/sort-select.test.ts`)

`[T5]` tests use an M4-R14 page: `<div data-rp-region="rp-collection-toolbar">` + fixture `default` + `</div>`, plus `<div data-rp-region="rp-collection-results">A</div>` and an empty `rp-collection-filters` region; the document route returns the same page with the second option `selected`.

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `// AT-2: generic (test/commerce/hydrogen.test.ts C-13)` and `[T5] sort-select: AT-2 ...` (choosing `Price, low to high` pushes a URL that contains `sort_by=price-ascending`, `filter.v.availability=1` and `filter.v.price.lte=50`) |
| AT-3 | `[T5] sort-select: AT-3 ...` (after the refresh `document.activeElement.id` is `sort`) |
| AT-4 | `[T6] sort-select: AT-4 ...` (scripting disabled: choose the option, press `Sort`; the navigation URL contains `sort_by=price-ascending` and both filter parameters) |
| unit | `[T1] sort-select: sortParams keeps filter pairs and q in URL order` |
| rules | M4-R13 |

### Acceptance

M4-R17. `grep -c 'name="sort_by"' components/sort-select/fixtures/default.html` prints `1`.

### Out of scope

Filters, FilterChips, a custom listbox (prohibited). Sort keys other than those the data gives.

### If blocked

Liquid `sort_option` members `value` and `name` are UNVERIFIED in the spec: use them as written; the shim side of the resource defines them.

---

## M4-T12 VariantPicker (`variant-picker`)

- **Goal:** Ship VariantPicker: option values as GET links (or a select per option) that `rp-live` turns into an in-place variant change.
- **Depends on:** M1-T01, M1-T07, M1-T46, M2-T10, M2-T13, M4-T01.
- **Kind / recipe:** `commerce`, tier `resource`; recipes C and R. `status: "beta"`.

### Read first

`docs/components/variant-picker.md` (whole, 22 kB; the code block of `variant-picker.data.ts` is complete and is copied unchanged). `docs/11-components-commerce.md`: `### 0.2 ` (rows Label, Select, Button, VisuallyHidden, and the paragraph "A foundation control that carries a hook attribute"), `### 0.4 `, `### 0.5 ` (rows `product.basic`, `product.options`), `### 0.7 ` (CV-3 to CV-5, CV-9, CV-10) (20 kB). Repository: `components/swatch/fixtures/default.html`, `components/cart-link/cart-link.json`.

### Files

Create: `components/variant-picker/variant-picker.json`, `.css`, `.test.ts`, `fixtures/{default,dropdown,single-variant,buttons,class,invalid-enum-falls-back,escaping}.html`, `react/variant-picker.tsx`, `react/variant-picker.data.ts`, `remix/variant-picker.tsx`, `remix/variant-picker.data.ts`, `liquid/blocks/variant-picker.liquid` (the markup is in the block; no snippet). Change: `locales/en.default.json`; `liquid.embeddedBy` of `components/swatch/swatch.json` (and of `select`, `label`, `visually-hidden` when their snippets are rendered).

### Steps

1. Branch `task/M4-T12-variant-picker`. Recipes C and R.
2. Copy the spec's `variant-picker.data.ts` code block into BOTH `react/variant-picker.data.ts` and `remix/variant-picker.data.ts` unchanged (the spec states both paths).
3. Print NOTHING when the product has one variant (TSX: `product.options.every((option) => option.optionValues.length <= 1)`; Liquid: `product.has_only_default_variant`). Fixture `single-variant` is an empty file.
4. Per-value rules: implement the table "Per-value rules (all layouts)" of the spec literally. Link ids `<id>-item-<o>-<v>` (1-based positions); in layout `dropdown` the select id is `<id>-item-<o>` and each option form has an `Apply` submit button with `data-rp-js="fallback"`, printed by the binding itself with class `rp-button`.
5. Layout `auto` prints Swatches for an option when every value of the option has a swatch; layout `buttons` never prints them.
6. Remix: `data-rmx-key="<id>"` and `data-rmx-preserve-attrs="data-pending aria-busy"` on the root.
7. Tests, M4-R17 with `<id>` = `variant-picker`, PLAN 5.0.

### Names and values

- Root `rp-live.rp-variant-picker` with `id`, `data-slot="rp-live"`, `data-rp-refresh`; parts `option`, `legend`, `selected`, `values`, `value`, `label` (classes in the Anatomy table). Fixtures use `id` `vp`.
- Props: `id`, `product`, `layout` (`auto buttons dropdown`; fixture `invalid-enum-falls-back` passes `grid`), `refresh`, TSX `search`. Schema setting: `layout`. The default of `refresh` is the value the spec's Props table gives.
- Resources exist: `product.options`, `product.basic`.
- Mask: `{ "select": "a.rp-variant-picker-value", "op": "attr", "name": "href" }`. Nothing else is masked.
- Locale: `ripple.variant-picker.sold_out` = `(Sold out)`; `ripple.variant-picker.unavailable` = `(Unavailable)`; `ripple.variant-picker.apply` = `Apply`.
- Agent: bridge component `rp-live`, `agent.actions` `["submit"]`. `upgradeAllow`: empty (the spec says None).
- Rules: `variant-picker-outside-form` (`forbids-ancestor`, selector `.rp-variant-picker`, target `rp-product-form`; message `A VariantPicker is inside a ProductForm.`; fix text in the spec; eval task T08 depends on this id); `variant-picker-fallback-submit` (`requires-descendant`, selector `form.rp-variant-picker-option`, target `button[type="submit"][data-rp-js="fallback"]`).

### Tests (`components/variant-picker/variant-picker.test.ts`)

`[T5]` tests use an M4-R14 page: `<div data-rp-region="rp-product-buy">` + fixture `default` + `</div>` and an empty `<div data-rp-region="rp-product-media"></div>` when the fixture's `data-rp-refresh` names it; the document route returns the same page.

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `[T5] variant-picker: AT-2 ...` (no browser: `variantPickerOptions` on `RESOURCES["product.options"].hydrogen` returns for `Size` / `L` `exists: false`, `url: null`; for `Color` / `Sand` `exists: true`, `available: false`, `url: "/products/linen-shirt?Color=Sand&Size=S"`, `variantId: "13"`) |
| AT-3 | `// AT-3: generic (test/commerce/hydrogen.test.ts C-13)` and `[T5] variant-picker: AT-3 ...` (a click on the `M` link: `history.length` unchanged, the region replaced, and `document.activeElement.id` equals the clicked link's id) |
| AT-4 | `// AT-4: generic (test/nojs/blueprints.test.ts NJ-F3, added by M7-T25)` and `[T6] variant-picker: AT-4 ...` (scripting disabled: a click on `M` starts a navigation to the link's `href`; in fixture `dropdown`, choosing `M` and pressing `Apply` starts a GET to the product URL whose query carries the option value of Blue / M, the numeric variant id `12`) |
| AT-5 | `// AT-5: generic (test/upgrade/upgrade.test.ts)` |
| AT-6 | `[T5] variant-picker: AT-6 ...` (a Ctrl+click on a value link dispatches no `rp:refresh`) |
| rules | M4-R13 |

### Acceptance

M4-R17. `wc -c < components/variant-picker/fixtures/single-variant.html` prints `0`. `cmp components/variant-picker/react/variant-picker.data.ts components/variant-picker/remix/variant-picker.data.ts` prints nothing, or only the import specifier differs (M4-R10).

### Out of scope

ProductForm (the selected variant id is printed by the server into the ProductForm's hidden input after the refresh). Decoding `encodedVariantExistence`. Combined listings. `createProductFormStore` (prohibited).

### If blocked

- The fixture loader or a host adapter cannot render a fixture whose reference HTML is empty (`single-variant`): draft pull request naming the failing file under `test/support/` or `src/testing/`; do not drop the fixture.
- The `hydrogen` side of `product.options` lacks a field `variantPickerOptions` reads (`adjacentVariants`, `selectedOrFirstAvailableVariant`): that is a defect of `src/testing/resources.ts` against `docs/13-testing.md` rule RS-1; add the field in this branch (adding a field to a resource is allowed by RS-1) and say so in the pull request.

---

## M4-T13 ProductGallery (`product-gallery`)

- **Goal:** Ship ProductGallery: a Carousel of product images in the region `rp-product-media`, with a lightbox Dialog.
- **Depends on:** M1-T03, M1-T04, M1-T07, M1-T08, M1-T09, M1-T17, M1-T46, M3-T09.
- **Kind / recipe:** `native`, tier `resource`; recipes C and R (every binding is hand-written, `docs/11-components-commerce.md` 0.1). `status: "stable"`.

### Read first

`docs/components/product-gallery.md` (whole, 21 kB). `docs/11-components-commerce.md`: `### 0.2 ` (first table rows `rp-dialog rp-product-gallery-lightbox` and `rp-dialog-title rp-visually-hidden`; second table rows Image, Placeholder, IconButton, Carousel, Dialog), `### 0.3 `, `### 0.4 `, `### 0.5 ` (row `product.basic`) (17 kB). Repository: `components/carousel/fixtures/default.html`, `components/carousel/react/carousel.tsx` (`useElement` with `onIndexChange`), `components/dialog/fixtures/default.html`, `components/dialog/react/dialog.tsx`, `components/cart-lines/react/cart-lines.tsx` (region part export).

### Files

Create: `components/product-gallery/product-gallery.json`, `.css`, `.test.ts`, `fixtures/{default,empty,class,invalid-enum-falls-back,escaping,variant-first}.html`, `react/product-gallery.tsx`, `remix/product-gallery.tsx`, `liquid/blocks/product-gallery.liquid`, `liquid/snippets/rp-product-gallery-media.liquid`. Change: `locales/en.default.json`; `liquid.embeddedBy` of the components whose snippet is rendered (`image`, `placeholder`, `icon`, and the others the Liquid binding renders); `src/testing/resources.ts` and the two resource tables.

### Steps

1. Branch `task/M4-T13-product-gallery`. Recipes C and R.
2. Root `div.rp-product-gallery` has two children: the media region part, then the lightbox. The lightbox `rp-dialog` is OUTSIDE the region part. The `id` prop is printed on the `rp-carousel`, not on the root.
3. Lightbox: composed by contract. The children of the `<dialog id="<id>-content" class="rp-dialog-panel">` are exactly `div.rp-dialog-header` (the `h2.rp-dialog-title.rp-visually-hidden` with id `<id>-content-title`, then the close IconButton) and `div.rp-dialog-body` (the images). The lightbox is printed only when there is at least one image.
4. Images: the embedded Image. Carousel images: `sizes="(min-width: 64rem) 50vw, 100vw"`, `ratio` from the prop; the first printed image `loading="eager"` and `fetchPriority="high"`, the others `loading="lazy"`. Lightbox images: `sizes="100vw"`, `ratio="auto"`, `fit="contain"`, `loading="lazy"`. The zoom `href` is the only URL the binding builds: `imageUrl(image.url, { width: 2000 })` from `<pkg>` (Liquid `image | image_url: width: 2000`). Zoom links carry `data-rp-open="<id>-content"`.
5. Order rule: when `variant` is set and one media image is the variant's image (TSX `media[i].image.url === variant.image?.url`; Liquid `media.id == variant.featured_media.id`), that item is printed first, in the carousel and in the lightbox.
6. React: first line `"use client";` (the file calls `useElement` for `onIndexChange` and `onOpenChange`); it exports `ProductGallery` and `ProductGalleryMedia` only. Remix: `data-rmx-key="<id>"` on the `rp-carousel`, `data-rmx-key="<id>-content"` on the `rp-dialog`, `data-rmx-preserve-attrs="disabled"` on the `prev` and `next` buttons, `data-rmx-preserve-attrs="open"` on the `dialog`.
7. Tests, M4-R17 with `<id>` = `product-gallery`, PLAN 5.0.

### Names and values

- Fixtures use `id` `gallery`. Props: `id`, `media`, `variant`, `ratio` (default `1/1`; `invalid-enum-falls-back` passes `9/9`), `ariaLabel` (default the locale string), React `onIndexChange`, `onOpenChange`.
- Resources (M4-R7): `product-gallery.default` (hydrogen: the two media of `product.basic` as `RippleMedia[]`; liquid: the `media` array of the liquid side of `product.basic`); `product-gallery.empty` (`[]` on both sides); `product-gallery-variant.variant-first` (hydrogen: a `RippleVariant` whose `image.url` is the second media image; liquid: a variant drop whose `featured_media.id` is the id of the second media). Fixtures `class`, `invalid-enum-falls-back`, `escaping`, `variant-first` pass `media` = `product-gallery.default`.
- Masks: `img` `src` (`attr`), `img` `srcset` (`srcset`), `a.rp-product-gallery-zoom` `href` (`attr`).
- `upgradeAllow`: the entry for `[data-rp-part="next"]` `disabled` (from Carousel). `noJs.level`: `degraded`; `noJs.fallbackHref`: the image URL (zoom links).
- Locale: `ripple.product-gallery.label` = `Product images`; `ripple.product-gallery.zoom` = `View larger image`; `ripple.product-gallery.previous` = `Previous`; `ripple.product-gallery.next` = `Next`; `ripple.product-gallery.close` = `Close`. No schema settings.
- `dependencies.components`: `carousel`, `dialog`, `image`, `placeholder`, `icon-button`, `icon`, `visually-hidden`; `dependencies.elements`: `rp-carousel`, `rp-dialog`. Agent: bridge for the two elements, as the spec's Agent surface states.
- Rule: `product-gallery-lightbox-outside-region` (`forbids-descendant`, selector `.rp-product-gallery-media`, target `dialog`).

### Tests (`components/product-gallery/product-gallery.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `// AT-2: generic (test/upgrade/upgrade.test.ts)` |
| AT-3 | `[T5] product-gallery: AT-3 ...` (fixture `default`: a click on the second zoom link sets `dialog.open` on `#gallery-content`; `location.href` unchanged; Escape closes it and focus returns to that link) |
| AT-4 | `[T5] product-gallery: AT-4 ...` (press `next`: the viewport's `scrollLeft` changes and one `indexchange` with `detail.value` 1 is dispatched on the `rp-carousel`) |
| AT-5 | `[T6] product-gallery: AT-5 ...` (scripting disabled: a click on a zoom link starts a navigation whose URL ends in `width=2000`) |
| AT-6 | `[T5] product-gallery: AT-6 ...` (M4-R14 page with `/ripple.js`; keep a reference to the lightbox `dialog`; `getCommerce().refresh(["rp-product-media"], { url })` with the document route returning the same page; afterwards the `dialog` is the same node and the media region root is a new node) |
| AT-7 | `[T2] product-gallery: AT-7 ...` (parse `fixtures/default.html`: the element children of `#gallery-content` are `div.rp-dialog-header` then `div.rp-dialog-body`; the header's children are `h2.rp-dialog-title` then a `button`) and `[T5] product-gallery: AT-7 first Tab stop is the close button` |
| React | `[T5] product-gallery: react onIndexChange and onOpenChange receive (value, detail)` only if `components/carousel/carousel.test.ts` has such a test to copy; otherwise the generic `[T4]` hydration cases are the React proof |
| rules | M4-R13 |

No test carries `[chromium]` except where the Carousel tests it copies do.

### Acceptance

M4-R17. `grep -c 'data-rp-region="rp-product-media"' components/product-gallery/fixtures/default.html` prints `1`. In `fixtures/default.html` the string `<dialog` occurs after the closing tag of the region part.

### Out of scope

Video and 3D media (skipped in V1). Thumbnails. Scrolling the lightbox to the clicked image. `src/elements/rp-carousel.ts`, `src/elements/rp-dialog.ts`.

### If blocked

- `components/carousel/` is missing: M3-T09 is not done; do not start.
- AT-6: the fixture page has no commerce runtime: use an M4-R14 page (script `/ripple.js`), not `fixturePageUrl`.
- `checkPattern` or axe reports the lightbox title as empty-name: the title text is the `ariaLabel` string inside the visually hidden `h2`; check the fixture against the spec before changing anything.

---

## M4-T14 CartNote (`cart-note`)

- **Goal:** Ship CartNote: the order note textarea, saved through `rp-cart` with JavaScript and through a form without.
- **Depends on:** M1-T01, M1-T06, M1-T46, M2-T10, M2-T12.
- **Kind / recipe:** `commerce`, tier `resource`; recipes C and R. `status: "beta"`.

### Read first

`docs/components/cart-note.md` (whole, 11 kB). `docs/11-components-commerce.md`: `### 0.2 ` (rows Label, Textarea, Button, FormMessage, VisuallyHidden; the paragraph "A foundation control that carries a hook attribute"; the last paragraph about `rpField` and `formId`), `### 0.4 `, `### 0.5 ` (row `cart.two-lines`), `### 0.7 ` (CV-4, CV-5, CV-8, CV-15 to CV-17) (20 kB). `docs/05-commerce.md` `### 10.5 ` (1 kB) and in `### 6.2 ` only the note markup (search `data-rp-field="note"`). Repository: `components/cart-summary/cart-summary.json` (backend-scoped fixtures of an `rp-cart` component), `components/textarea/liquid/snippets/rp-textarea.liquid`, `components/cart-lines/fixtures/liquid-default.html`.

### Files

Create: `components/cart-note/cart-note.json`, `.css`, `.test.ts`, the ten fixture files `fixtures/{default,with-note,children,rows,class}.html` and `fixtures/liquid-{default,with-note,children,rows,class}.html`, `react/cart-note.tsx`, `remix/cart-note.tsx`, `liquid/blocks/cart-note.liquid`, `liquid/snippets/rp-cart-note.liquid`. Change: `locales/en.default.json`; `liquid.embeddedBy` of `components/textarea/textarea.json` and `components/label/label.json` (those rendered); `src/testing/resources.ts` and the two resource tables.

### Steps

1. Branch `task/M4-T14-cart-note`. Recipes C and R.
2. hydrogen hosts: the form part is `<form class="rp-cart-note-form" method="post" action="<action>">`; the save button is printed by the binding itself (class `rp-button`, `data-rp-part="submit"`, `data-rp-js="fallback"`, the `name` and `value` the spec's fixture shows for intent `note-update`). TSX-only prop `action` (default `/api/cart`, CV-17). Remix: `data-rmx-key="<id>"` on the root and `data-rmx-document` on the form (CV-16).
3. Liquid: the form part is a `div`; no save button; the field is `{% render 'rp-textarea', id: id, name: 'note', rows: rows, default_value: cart.note, rp_field: 'note', form_id: form_id %}` with `form_id` assigned as `cart_lines | append: '-form'`. When `cart_lines` is blank the field has no `form` attribute.
4. Field: the embedded Textarea with `rpField="note"`; uncontrolled (`defaultValue={cart.note}`). React: the error part carries `suppressHydrationWarning`; no hook, no directive.
5. Tests, M4-R17 with `<id>` = `cart-note`, PLAN 5.0.

### Names and values

- Root `rp-cart.rp-cart-note` with `data-slot="rp-cart"`; it MUST NOT carry `data-rp-refresh`. Parts: `form`, `label` (`for` = `<id>`), `field` (`textarea#<id>`, `name="note"`, `data-rp-field="note"`), `save`, `error` (the exact error part of CONVENTIONS section 11), `status` (`p.rp-visually-hidden`, `data-rp-part="status"`, `role="status"`).
- Fixtures: `id` `note`; hydrogen fixtures pass `cart` = `cart.two-lines`; Liquid fixtures pass `cart_lines` = `cart`. `with-note`: new resource `cart-note.with-note` (`cart.two-lines` with note `Leave at the door <3` on both sides); textarea content `Leave at the door &lt;3`. `children`: `Gift message`. `rows`: `5`.
- Mask: `{ "select": "form.rp-cart-note-form", "op": "attr", "name": "action" }`.
- `upgradeAllow`: the three entries of the spec. Manifest `liquid.formDialect` and `hydrogenHost.formDialect`: the dialect names `components/cart-summary/cart-summary.json` uses.
- Locale: `ripple.cart-note.label` = `Order note`; `ripple.cart-note.save` = `Save note`; (`ripple.cart-note.saved` exists). No schema settings.
- Agent: the `rp-cart` row of the spec's Agent surface section (`agent.actions` as that section states).
- Rules: `cart-note-field`, `cart-note-error`, `cart-note-submit-path`, `cart-note-label` (kinds, selectors, targets, message in the spec).

### Tests (`components/cart-note/cart-note.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `// AT-2: generic (test/commerce/liquid.test.ts C-08)` and `[T5] cart-note: AT-2 ...` (fixture `default`, `**/api/cart` stubbed: type a note and blur; one POST carries the note; the status part then contains `Note saved`) |
| AT-3 | `[T5] cart-note: AT-3 ...` (M4-R14 page, host `liquid` config and `/sa.js`: `components/cart-lines/fixtures/liquid-default.html` plus `fixtures/liquid-default.html`; the textarea's `form` property is the cart form (`<cart lines id>-form`); changing the note leads to exactly one `updateCart` call carrying `note`) |
| AT-4 | `// AT-4: generic (test/nojs/blueprints.test.ts NJ-F7, added by M7-T25)` |
| no-JS | `[T6] cart-note: liquid note posts with the cart form` (the AT-3 page with scripting disabled: submit the cart form; the POST body has the field `note`) and `[T6] cart-note: hydrogen save button posts intent note-update` (fixture `default`; the POST to `/api/cart` has `intent=note-update` and `note`) |
| rules | M4-R13, four rule tests |

### Acceptance

M4-R17. `ls components/cart-note/fixtures | wc -l` prints `10`. `grep -L 'data-rp-field="note"' components/cart-note/fixtures/*.html` prints nothing.

### Out of scope

`src/commerce/rp-cart.ts`. Cart attributes. Gift messages as a separate field. The `cart` blueprint.

### If blocked

- The spec's AT-3 says `#cart-form`; the form id is `<cart lines id>-form`, which is `cart-form` when the CartLines id is `cart`. Use the id the CartLines fixture prints.
- C-38 (note baseline, D-126) has no owning PLAN row: do not write it; list it in the done file.

---

## M4-T15 DiscountCode (`discount-code`)

- **Goal:** Ship DiscountCode: the discount code form of the cart.
- **Depends on:** M1-T01, M1-T06, M1-T46, M2-T10, M2-T11.
- **Kind / recipe:** `commerce`, tier `resource`; recipes C and R. `status: "beta"`.

### Read first

`docs/components/discount-code.md` (whole, 13 kB). `docs/11-components-commerce.md`: `### 0.2 ` (rows Label, Input, Button, FormMessage, VisuallyHidden; the paragraph "A foundation control that carries a hook attribute"), `### 0.4 `, `### 0.7 ` (CV-4, CV-5, CV-8, CV-15 to CV-17) (18 kB). `docs/05-commerce.md` `### 10.5 ` (1 kB) and `### 9.2 Errors` (4 kB; the discount scope). Repository: `components/cart-summary/cart-summary.json`, `components/input/liquid/snippets/rp-input.liquid`, `components/cart-lines/fixtures/default.html`.

### Files

Create: `components/discount-code/discount-code.json`, `.css`, `.test.ts`, the ten fixture files `fixtures/{default,placeholder,children,class,escaping}.html` and `fixtures/liquid-{default,placeholder,children,class,escaping}.html`, `react/discount-code.tsx`, `remix/discount-code.tsx`, `liquid/blocks/discount-code.liquid`, `liquid/snippets/rp-discount-code.liquid`. Change: `locales/en.default.json`; `liquid.embeddedBy` of `components/input/input.json` and `components/label/label.json` (those rendered).

### Steps

1. Branch `task/M4-T15-discount-code`. Recipes C and R.
2. The form is a plain `<form class="rp-discount-code-form" method="post" action="...">` in every host (Liquid: NOT `{% form %}`; `action="{{ routes.cart_url }}"`). The ONLY difference between `<name>` and `liquid-<name>` fixtures is the form's opening tag: Liquid adds `data-rp-js="inflow"`.
3. Field: the embedded Input with the props the spec's Host notes list (`name="discountCode"`, `autoComplete="off"`, `required`, `rpField="discount-code"`, `placeholder`; `autocapitalize="characters"` and `spellcheck="false"` as native attributes through rest props or Liquid `attributes`). The apply button is printed by the binding itself (class `rp-button`, `data-rp-part="submit"`, `name="intent"` and the `value` the spec's fixture shows).
4. The error part is INSIDE the form (that position gives it the discount scope). The status part is a child of the root after the form.
5. React: error part with `suppressHydrationWarning`; no hook, no directive. Remix: `data-rmx-key="<id>"` on the root; `data-rmx-document` on the form (CV-16). TSX-only prop `action` (CV-17).
6. Tests, M4-R17 with `<id>` = `discount-code`, PLAN 5.0.

### Names and values

- Root `rp-cart.rp-discount-code` with `data-slot="rp-cart"`; no `data-rp-refresh`. Parts `form`, `label`, `row` (`div.rp-discount-code-row`), `field` (`input#<id>`, `data-rp-field="discount-code"`), `apply`, `error`, `status`. Fixtures use `id` `discount`.
- `noJs.level`: `degraded`. Mask: `{ "select": "form.rp-discount-code-form", "op": "attr", "name": "action" }`. `data-rp-js` MUST NOT be masked.
- `upgradeAllow`: the three entries of the spec. No object prop: M4-R7 does not apply.
- Locale: `ripple.discount-code.label` = `Discount code`; `ripple.discount-code.apply` = `Apply`; (`applied`, `removed` exist). No schema settings.
- Agent: the `rp-cart` row of the spec's Agent surface section.
- Rules: `discount-code-field`, `discount-code-error-in-form`, `discount-code-not-in-form`, `discount-code-label` (kinds, selectors, targets, message in the spec).

### Tests (`components/discount-code/discount-code.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `// AT-2: generic (test/commerce/liquid.test.ts C-03)` and `[T5] discount-code: AT-2 ...` (two cases on an M4-R14 page that holds `components/cart-lines/fixtures/default.html` and fixture `default`, `**/api/cart` stubbed: applying `SAVE10` puts `Discount applied` into this status part; a response with a discount `userErrors` entry shows its message in THIS error part while the CartLines cart-scope error part keeps `hidden`) |
| AT-3 | `[T5] discount-code: AT-3 ...` (fixture `liquid-default`: the form has `data-rp-js="inflow"`) and `[T6] discount-code: AT-3 hidden without scripts` (the same fixture with scripting disabled: the form's computed `display` is `none`) |
| AT-4 | `// AT-4: generic (test/nojs/blueprints.test.ts NJ-F8, added by M7-T25)` |
| no-JS | `[T6] discount-code: hydrogen form posts intent discount-apply` (fixture `default`, scripting disabled: the POST to `/api/cart` has `intent=discount-apply` and `discountCode`) |
| rules | M4-R13, four rule tests |

### Acceptance

M4-R17. `ls components/discount-code/fixtures | wc -l` prints `10`. `grep -c 'data-rp-js="inflow"' components/discount-code/fixtures/liquid-default.html` prints `1`; the same grep on `fixtures/default.html` prints `0`.

### Out of scope

The list of applied codes and their remove forms (CartSummary). Gift cards. A bridge action for applying a code. `src/commerce/rp-cart.ts`.

### If blocked

- The form reset after a successful apply is UNVERIFIED in the spec: do not assert it.
- C-05 fourth case (D-129, `usable === false` with an `inflow` form) has no owning PLAN row here: do not write it.

---

## M4-T16 Element `rp-predictive-search` (`src/commerce/rp-predictive-search.ts` and test, C-14)

- **Goal:** Add the element `rp-predictive-search`, which refreshes the region `rp-predictive-results` 200 ms after the visitor stops typing, and its commerce test C-14.
- **Depends on:** M1-T46.
- **Kind / recipe:** `element`; recipe E. Size M.

### Read first

`docs/05-commerce.md`: `### 7.4 ` (2 kB), `### 7.7 Element shell` (5 kB), `### 8.2 ` (2 kB), rows 1 and 3 of the change table in `## 1. Reference implementation`, row C-14 of the table in `## 14. Acceptance tests`. `docs/04-runtime-and-elements.md`: `## 7. Rules for writing an ` and `### 3.5 `. Spike: `docs/research/spikes/commerce/src/commerce/rp-predictive-search.ts` (whole, 3.5 kB); in `docs/research/spikes/commerce/run3.cjs` the function `HPAGE`, the function `routes()` and scenario H5; in `docs/research/spikes/commerce/result.txt` the lines of H5. Repository: `src/commerce/rp-live.ts` and `src/commerce/rp-live.test.ts` (the shell and test shape to copy), `src/commerce/index.ts`, test `C-13` in `test/commerce/hydrogen.test.ts`, test `C-01` in `test/commerce/liquid.test.ts`.

### Files

Create: `src/commerce/rp-predictive-search.ts`, `src/commerce/rp-predictive-search.test.ts`. Change: `src/commerce/index.ts`, `test/commerce/hydrogen.test.ts` (add C-14), `test/commerce/liquid.test.ts` (the tag list of C-01 only).

### Steps

1. Branch `task/M4-T16-rp-predictive-search`.
2. `cp docs/research/spikes/commerce/src/commerce/rp-predictive-search.ts src/commerce/rp-predictive-search.ts`.
3. Apply change-table row 3: import `announce` with `import { announce } from "../runtime/announcer";` and pass `{ from: root }` as the options argument of every `announce(` call. Apply row 1 (the shell, next step). Change nothing else in the controller.
4. Append the shell exactly as `### 7.7 Element shell` states for this tag (copy the form of `src/commerce/rp-live.ts`). Values are under "Names and values".
5. `src/commerce/index.ts`: add `import { definePredictiveSearch } from "./rp-predictive-search";` and the call `definePredictiveSearch();` on the line after `defineLive();`. In the comment `// PLAN 4.4: ...` that names the missing elements remove the text `M4-T16, `; when the comment then names no task, delete the whole comment line.
6. `test/commerce/liquid.test.ts`: add `"rp-predictive-search"` to the list of tags test C-01 asserts as defined; when a `// PLAN 4.4:` comment next to that list names M4-T16, remove that name the same way.
7. Write the tests (below). Proof: `pnpm typecheck && pnpm build && pnpm test:run --tiers=1,5 --files=src/commerce/rp-predictive-search --no-skips && pnpm test:commerce --no-skips && pnpm test:size && pnpm ci`. PLAN 5.0.

### Names and values

- Shell (7.7 table row `rp-predictive-search`): `name` and tag `rp-predictive-search`; `createParts("rp-predictive-search", { root: { tag: "rp-predictive-search", display: "block", api: ["setQuery", "clear"] } })`; `bind: (el) => connectPredictiveSearch(el)`; `agent: { actions: ["setQuery", "clear"] }`. Exports: `connectPredictiveSearch`, `rpPredictiveSearch`, `definePredictiveSearch`.
- API (7.4 "Agent methods"): `setQuery(query: string): void` sets `value` of the first non-hidden input of the root's GET form and dispatches `new Event("input", { bubbles: true })` on it; `clear(): void` is `setQuery("")`. When the root has no such input: `throw new Error("rp-predictive-search: nothing to setQuery here")`.
- Behaviour (7.4 table; do not restate differently in code comments): debounce 200 ms; one `refresh(["rp-predictive-results"], { url, reason: "predictive" })`; on `rp:refreshed` the panel loses `hidden` and the status part's text is announced; an empty query hides the panel and sends no request; `Escape` hides the panel and focuses the input; `focusout` leaving the root hides the panel; the URL never changes.
- The element sets no `data-state`.

### Tests

| File | Name | Asserts |
|---|---|---|
| `src/commerce/rp-predictive-search.test.ts` | `[T1] rp-predictive-search: shell shape` | the source text has exactly one `definePrimitive(` and one `createParts(`; the parts object has the single key `root`; `display: "block"`; no `data-state`; `announce` is imported only from `../runtime/announcer` |
| same | `[T5] rp-predictive-search: defines the element and exposes setQuery and clear` | on the page of `test/commerce/pages.ts` with the predictive markup of `HPAGE`: `customElements.get("rp-predictive-search")` is defined; `typeof el.setQuery === "function"`; `el.setQuery("shirt")` leads to one document request |
| `test/commerce/hydrogen.test.ts` | `[T5] commerce-hydrogen: C-14 ...` | port of spike scenario H5 (M4-R21): typing `shirt` sends exactly one request, not earlier than 200 ms after the last key; the panel is shown; the status text is in the announcer region; `ArrowDown` moves focus input, first link, second link; `Escape` hides the panel and focuses the input; `location.href` is unchanged. No `[chromium]` tag |

Markup: the predictive part of `HPAGE`. The document route answers with a page whose `[data-rp-region="rp-predictive-results"]` holds two links and a status element (M4-R14). The 200 ms wait is the only fixed duration allowed.

### Acceptance

The proof commands of step 7 exit 0. `pnpm test:commerce --no-skips 2>&1 | grep -c 'C-14'` prints at least `1` and the line is a pass. `grep -c 'definePredictiveSearch' src/commerce/index.ts` prints `2`. `grep -rn '@ui-sdk/core' src/commerce/rp-predictive-search.ts | grep -c announce` prints `0`.

### Out of scope

The component PredictiveSearch (M4-T17). The `react` strategy and `useRegionHtml` (exist since M1; tested by M4-T20, M4-T22). The agent snapshot test C-31 (M8-T03). The Liquid backend region fetch (`sections` strategy details stay as M1 left them).

### If blocked

- `pnpm test:size` fails for the commerce entry: do not raise a budget. Draft pull request with the measured bytes; the budget owner is `docs/09-distribution-and-size.md` (record under its `## Ledger issues`).
- Arrow-key movement fails in WebKit or Firefox while Chromium passes: this is the SPIKE-04 question. Do NOT apply `### Fallback (SPIKE-04)` of `docs/05-commerce.md`; write `FOLLOW-UP NEEDED: apply "Fallback (SPIKE-04)" of docs/05-commerce.md` in the done file and stop with a draft pull request; do not skip or tag the failing test.
- `src/commerce/index.ts` has no `defineLive();` line: add the call as the last `define...()` call and note the difference in the pull request.

---

## M4-T17 PredictiveSearch (`predictive-search`)

- **Goal:** Ship PredictiveSearch: a search form whose results panel is filled by a region refresh while the visitor types.
- **Depends on:** M4-T02, M4-T03, M4-T16.
- **Kind / recipe:** `commerce`, tier `resource`; recipes C and R. `status: "beta"`.

### Read first

`docs/components/predictive-search.md` (whole, 21 kB; the React and Remix region-part code blocks in "Host notes" are complete and are copied unchanged; do NOT apply its last section `### Fallback (SPIKE-10)`). `docs/11-components-commerce.md`: `### 0.2 ` (rows SearchForm, ProductCard, VisuallyHidden), `### 0.3 ` (the row of region `rp-predictive-results`), `### 0.4 `, `### 0.5 ` (row `search.shirt`), `### 0.7 ` (CV-6, CV-12) (16 kB). Repository: `components/cart-lines/cart-lines.json`, `components/cart-lines/react/cart-lines.tsx` (region part export, `useRegionHtml` use), `components/search-form/fixtures/predictive.html`, `components/product-card/fixtures/default.html`.

### Files

Create: `components/predictive-search/predictive-search.json`, `.css`, `.test.ts`, `fixtures/{default,results,no-results,placeholder,class,children,escaping}.html`, `react/predictive-search.tsx`, `remix/predictive-search.tsx`, `liquid/blocks/predictive-search.liquid`, `liquid/snippets/rp-predictive-search.liquid`, `liquid/snippets/rp-predictive-search-results.liquid`. Change: `locales/en.default.json`; `src/testing/resources.ts` and the two resource tables (M4-R7); `liquid.embeddedBy` of `components/search-form/search-form.json` and `components/product-card/product-card.json` (add `predictive-search`).

### Steps

1. Branch `task/M4-T17-predictive-search`. Recipes C and R.
2. React file: first line `"use client";`. Export the root component and the region part `PredictiveSearchResults` from the same file. The region part reads `useRegionHtml("rp-predictive-results")`; copy the spec's code. Import the hook from `__PKG__` the way `components/cart-lines/react/cart-lines.tsx` writes it.
3. Remix: `data-rmx-key="<id>"` on the root; region part as the spec's Remix block.
4. Liquid: the block renders `rp-predictive-search`; the results snippet is rendered with exactly the params `search`, `action`, `limit`, everywhere (M4-R9).
5. The form is the embedded SearchForm with its `predictive` variant plus the hidden input `type=product` the spec shows (M4-R8). Each result is an embedded ProductCard with `level` 3, `ratio` `1/1`, `sizes` `6rem`.
6. Text rules: one result prints `1 result` and `View 1 result`; `n` results print `<n> results` and `View all <n> results`; no result prints the empty part.
7. Tests, M4-R17 with `<id>` = `predictive-search`, PLAN 5.0.

### Names and values

- Root `rp-predictive-search.rp-predictive-search` with `data-slot`, `id` (fixtures use `psearch`). Parts: `form`; panel `div.rp-predictive-search-panel` with `data-rp-part="results"`, `hidden`, id `<id>-content`; region part `PredictiveSearchResults` / `snippets/rp-predictive-search-results.liquid` with `data-rp-region="rp-predictive-results"`; `list` (`ul` with `role="list"`); `all` (link); `empty`; `status`.
- Fixtures: `default`; `results` (`{ "$resource": "search.shirt" }`); `no-results` (terms `zzz`); `placeholder`; `class`; `children`; `escaping`. New resources by M4-R7: `predictive-search.no-results`, `predictive-search.escaping`.
- Masks: the masks ProductCard's spec lists (image `src`/`srcset`, price texts, card link `href`) plus `{ "select": ".rp-predictive-search-all", "op": "attr", "name": "href" }`.
- Locale (`ripple.predictive-search.*`): `results_one` = `1 result`; `results_other` = `{{ count }} results`; `view_one` = `View 1 result`; `view_all` = `View all {{ count }} results`; `empty` = `No results for “{{ terms }}”`; `none` = `No results`.
- `upgradeAllow`: the three entries of the spec. Agent: `actions` `["setQuery", "clear"]`.
- Rules: `predictive-search-input`, `predictive-search-panel`, `predictive-search-one` (kinds, selectors, targets and messages in the spec).

### Tests (`components/predictive-search/predictive-search.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `// AT-2: generic (test/commerce/hydrogen.test.ts C-14)` |
| AT-3 | `[T5] predictive-search: AT-3 ...` (M4-R14 page with fixture `default`; typing `shirt`: the one document request URL has `type=product` and `q=shirt`) |
| AT-4 | `[T5] predictive-search: AT-4 ...` (after results are shown, clearing the input hides the panel and sends no further request) |
| AT-5 | `// AT-5: generic (test/upgrade/upgrade.test.ts)` |
| AT-6 | `[T6] predictive-search: AT-6 ...` (scripting disabled: the panel's computed `display` is `none`; typing `shirt` and Enter starts a GET to `/search?type=product&q=shirt`) |
| region | `[T5] predictive-search: a refresh replaces the region root once` (M4-R16) |
| rules | M4-R13, three rule tests |

### Acceptance

M4-R17. `grep -c '"use client"' components/predictive-search/react/predictive-search.tsx` prints `1`. `grep -c 'partial' components/predictive-search/liquid/snippets/*.liquid components/predictive-search/liquid/blocks/*.liquid` prints `0` for every file. `grep -c 'predictive-search' components/search-form/search-form.json components/product-card/product-card.json` prints at least `1` for each.

### Out of scope

`src/commerce/rp-predictive-search.ts`. Result types other than products (articles, pages, collections, query suggestions). The header search dialog (M5 chrome). The fallback section of the spec.

### If blocked

- `search.shirt` (hydrogen side) is not the shape the TSX `search` prop takes: M4-R7 step 2 (resource `predictive-search.results`); never change `search.shirt`.
- The `[T4]` hydration matrix reports a mismatch on the region part: stop with a draft pull request; this is the question of M4-T22 (SPIKE-10 part b). Do not apply the fallback.
- The Liquid `predictive_search` object members named by the spec are marked UNVERIFIED there: write the snippet as the spec prints it; the shim stand-in is the `liquid` side of the resource.

---

## M4-T18 Element `rp-recommendations` (`src/commerce/rp-recommendations.ts` and test, C-15)

- **Goal:** Add the element `rp-recommendations`, which refreshes the region `rp-product-recommendations` once when it comes within 400 px of the viewport, and its commerce test C-15.
- **Depends on:** M1-T46.
- **Kind / recipe:** `element`; recipe E. Size S.

### Read first

`docs/05-commerce.md`: `### 7.5 ` (1 kB), `### 7.7 Element shell` (5 kB), row 1 of the change table in `## 1. Reference implementation`, row C-15 of `## 14. Acceptance tests`. Spike: `docs/research/spikes/commerce/src/commerce/rp-recommendations.ts` (1 kB); `docs/research/spikes/commerce/run3.cjs` function `HPAGE` and scenario H7. Repository: `src/commerce/rp-live.ts`, `src/commerce/rp-live.test.ts`, `src/commerce/index.ts`, test `C-13` in `test/commerce/hydrogen.test.ts`, test `C-01` in `test/commerce/liquid.test.ts`.

### Files

Create: `src/commerce/rp-recommendations.ts`, `src/commerce/rp-recommendations.test.ts`. Change: `src/commerce/index.ts`, `test/commerce/hydrogen.test.ts` (add C-15), `test/commerce/liquid.test.ts` (the tag list of C-01 only).

### Steps

1. Branch `task/M4-T18-rp-recommendations`.
2. `cp docs/research/spikes/commerce/src/commerce/rp-recommendations.ts src/commerce/rp-recommendations.ts`. Append the shell of `### 7.7 Element shell` (change-table row 1). Change nothing else.
3. `src/commerce/index.ts`: add `import { defineRecommendations } from "./rp-recommendations";` and `defineRecommendations();` as the LAST `define...()` call (final order when M4-T16 has merged: `defineCart(); defineProductForm(); defineLive(); definePredictiveSearch(); defineRecommendations();`). Remove `M4-T18` from the `// PLAN 4.4:` comment as M4-T16 step 5 describes.
4. `test/commerce/liquid.test.ts`: add `"rp-recommendations"` to the tag list of C-01.
5. Tests; proof `pnpm typecheck && pnpm build && pnpm test:run --tiers=1,5 --files=src/commerce/rp-recommendations --no-skips && pnpm test:commerce --no-skips && pnpm test:size && pnpm ci`. PLAN 5.0.

### Names and values

- Shell: tag `rp-recommendations`; parts `{ root: { tag: "rp-recommendations", display: "block", api: [] } }`; `api: () => ({})`; `agent: { actions: [], shown: () => false }`; `bind: (el) => connectRecommendations(el)`. Exports `connectRecommendations`, `rpRecommendations`, `defineRecommendations`.
- Behaviour (7.5): one `IntersectionObserver` with `rootMargin: "0px 0px 400px 0px"`; on the first intersection `refresh(["rp-product-recommendations"], { url, reason: "recommendations" })` with `url` = the root's `data-url`; once per connection; `data-url` absent: nothing happens.

### Tests

| File | Name | Asserts |
|---|---|---|
| `src/commerce/rp-recommendations.test.ts` | `[T1] rp-recommendations: shell shape` | as M4-T16; the api list is empty |
| same | `[T5] rp-recommendations: does nothing without data-url` | element in view, no `data-url`: zero document requests |
| `test/commerce/hydrogen.test.ts` | `[T5] commerce-hydrogen: C-15 ...` | port of H7: the element is below the fold, zero requests; scrolling it within 400 px sends exactly one request to the `data-url`; the region is replaced; scrolling away and back sends none; a second case with the route answering `500`: `location.href` unchanged, the region unchanged, `opened.errors` empty |

`IntersectionObserver` exists in all three engines: no `[chromium]` tag.

### Acceptance

Proof commands exit 0. `pnpm test:commerce --no-skips 2>&1 | grep -c 'C-15'` prints at least `1`, passing. `grep -c 'defineRecommendations' src/commerce/index.ts` prints `2`. After both M4-T16 and M4-T18 merged: `grep -c 'PLAN 4.4: M4-T1' src/commerce/index.ts` prints `0`.

### Out of scope

ProductRecommendations (M4-T19). The real `routes.product_recommendations_url` fetch (SPIKE-09, M10-T05).

### If blocked

- The spike file observes with a different margin than 7.5 states: 7.5 wins; note it in the pull request.
- A failing request raises an unhandled rejection: that is a defect of `refresh()` (M1), not of this element; draft pull request naming `src/commerce/refresh.ts`.

---

## M4-T19 ProductRecommendations (`product-recommendations`)

- **Goal:** Ship ProductRecommendations: a titled list of product cards that is server-rendered when products are passed and lazily refreshed otherwise.
- **Depends on:** M4-T03, M4-T18.
- **Kind / recipe:** `commerce`, tier `resource`; recipes C and R. `status: "beta"`.

### Read first

`docs/components/product-recommendations.md` (whole, 18 kB; the host code blocks are copied unchanged; do NOT apply `### Fallback (SPIKE-09)` or `### Fallback (SPIKE-10)`). `docs/11-components-commerce.md`: `### 0.2 ` (rows ProductCard, Heading), `### 0.3 ` (row `rp-product-recommendations`), `### 0.4 `, `### 0.5 ` (row `product.sale`), `### 0.7 ` (CV-6) (14 kB). Repository: `components/cart-lines/cart-lines.json`, `components/cart-lines/react/cart-lines.tsx`, `components/product-card/fixtures/default.html`.

### Files

Create: `components/product-recommendations/product-recommendations.json`, `.css`, `.test.ts`, `fixtures/{default,lazy,products,class,invalid-enum-falls-back}.html`, `react/product-recommendations.tsx`, `remix/product-recommendations.tsx`, `liquid/blocks/product-recommendations.liquid`, `liquid/snippets/rp-product-recommendations-list.liquid`. Change: `locales/en.default.json`; `src/testing/resources.ts` and the two resource tables (M4-R7); `liquid.embeddedBy` of `components/product-card/product-card.json`.

### Steps

1. Branch `task/M4-T19-product-recommendations`. Recipes C and R.
2. React: first line `"use client";`; region part `ProductRecommendationsList` in the same file with `useRegionHtml("rp-product-recommendations")`; code copied from the spec.
3. Remix: `rmxKey` handling as the spec's block; `data-rmx-preserve-attrs="data-pending aria-busy"` on the root.
4. Liquid: the list snippet is rendered with exactly the params `products`, `level` (M4-R9).
5. `url` prints `data-url` on the root. `level` is 2 to 6, default 2; an invalid value falls back to 2; cards get `level + 1`, at most 6.
6. Tests, M4-R17 with `<id>` = `product-recommendations`, PLAN 5.0.

### Names and values

- Root `rp-recommendations.rp-product-recommendations`; region part with `data-rp-region="rp-product-recommendations"`. Props: `products`, `url`, `level`; TSX-only `locale`, `strings`.
- Fixtures: `default`; `lazy` (`url` = `/recommendations/products?product_id=1&limit=4&intent=related`; this fixture also covers escaping, the `&` is printed as `&amp;`); `products` (the list `[product.sale]`, `level` 3; new resource `product-recommendations.products` by M4-R7); `class`; `invalid-enum-falls-back` (`level` 9 with the same products resource).
- Masks, on the fixtures that print cards: `img` `src` and `srcset`, the price texts, `a.rp-product-card-link` `href`, exactly as ProductCard's spec lists them.
- Locale: `ripple.product-recommendations.title` = `You may also like`.
- Agent: `actions: []`, `shown: () => false`. `noJs.level`: `degraded`. Rule: `product-recommendations-region`.

### Tests (`components/product-recommendations/product-recommendations.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `// AT-2: generic (test/commerce/hydrogen.test.ts C-15)` |
| AT-3 | `// AT-3: generic (test/upgrade/upgrade.test.ts)` |
| AT-4 | `[T6] product-recommendations: AT-4 ...` (scripting disabled: fixture `products` shows its cards; fixture `lazy` shows what the spec's "Behaviour without JavaScript" states and sends no request) |
| AT-5 | `// AT-5: generic (test/liquid/live.test.ts, added by M10-T01)` |
| region | `[T5] product-recommendations: a refresh replaces the region root once` (M4-R16; fixture `lazy` on an M4-R14 page) |
| rules | M4-R13, one rule test |

### Acceptance

M4-R17. `ls components/product-recommendations/fixtures | wc -l` prints `5`. `grep -c 'data-url="/recommendations/products?product_id=1&amp;limit=4&amp;intent=related"' components/product-recommendations/fixtures/lazy.html` prints `1`.

### Out of scope

`src/commerce/rp-recommendations.ts`. The product blueprint that passes `url` (M6/M7). The Storefront API `productRecommendations` query and the route that serves the document (example apps, M7). Both fallback sections.

### If blocked

- The heading's level and the cards' level disagree with the spec's reference HTML: the reference HTML wins (M4-R3).
- The fixture loader cannot pass an array through a `$resource`: the resource's side IS the array (M4-R7 step 3); when the loader rejects a non-object side, draft pull request naming `src/testing/resources.ts` or the loader file.

---

## M4-T20 Commerce tests C-24 (field names looked up) and C-27 (`react` strategy region store)

- **Goal:** Add test C-24 (every UNVERIFIED Storefront API field name and Liquid expression of the shared data types is looked up and the mappers type-check against the Storefront API types) and test C-27 (the `react` refresh strategy and its region store).
- **Depends on:** M4-T16, M4-T18 (table). C-24 ALSO needs M1-T37 and M4-T09, M4-T10, M4-T11, M4-T12 (their `.data.ts` mappers; Plan reading PR-M4-7). Do the C-27 half when only the table dependencies are done; do the C-24 half when the others are too.
- **Kind:** `harness`. Size M.

### Read first

`docs/05-commerce.md`: rows C-24 and C-27 of `## 14. Acceptance tests`; `### 8.3 Strategies` (only the `react` strategy code and the region store, about 4 kB); for C-24 `### 11.1 Shared data types` (14 kB). Repository: `src/commerce/refresh-react.ts`, `src/types.ts` (or the file `### 11.1 ` names for the `Ripple*` types), `components/cart-lines/react/cart-lines.data.ts`, the `.data.ts` files of `filters`, `filter-chips`, `sort-select`, `variant-picker` (React copies only), test `C-13` in `test/commerce/hydrogen.test.ts`.

### Files

Create: `src/types.test.ts` (C-24; when the file exists, add to it). Change: `test/commerce/hydrogen.test.ts` (add C-27). No source file under `src/commerce/` changes.

### Steps

1. Branch `task/M4-T20-c24-c27`.
2. **C-27** `[T5] commerce-hydrogen: C-27 ...` (PR-M4-5). In the test, bundle `src/commerce/refresh-react.ts` with `build` from `esbuild` (`bundle: true`, `format: "iife"`, a global name, `write: false`), add the output with `page.addScriptTag`, and call the exports directly with `page.evaluate`. Cases, one test each or one test with five blocks:
   1. `refreshReact(["rp-predictive-results"], { url, reason: "predictive", signal, options })` fetches the document once; afterwards `getRegionHtml("rp-predictive-results")` equals the `innerHTML` of that region in the fetched document.
   2. A subscriber added with `subscribeRegionHtml` before the call is called exactly once.
   3. With the route answering `500`: the store value is unchanged and `location.href` is unchanged.
   4. `reason: "cart"` with `url: null`: zero requests.
   5. `reason: "filter"`: with `options.navigate` set, `navigate` is called once with the URL; without it, `location.assign(url)` is called (observe a `framenavigated` to that URL; fulfil it with an empty page).
   Take the exact export names and the argument shape from `src/commerce/refresh-react.ts`; when they differ from the names above, the source wins.
3. **C-24, part 1 (lookup).** List every Storefront API field name and every Liquid expression that `### 11.1 ` marks `UNVERIFIED`. Look each one up with the Shopify documentation tool (`mcp__Shopify__search_docs_chunks`). Write in `src/types.test.ts` one constant `LOOKED_UP: ReadonlyArray<{ name: string; kind: "storefront" | "liquid"; page: string }>` with one entry per name; `page` is the documentation page URL the tool returned. A name the documentation contradicts is NOT silently corrected: record it under `## Ledger issues` of `docs/05-commerce.md` with the page, and leave the mapper as is.
4. **C-24, part 2 (types).** In the same file write, per `.data.ts` mapper, a compile-time fixture: a value declared with the Storefront API response type (`import type { ... } from "@shopify/hydrogen/storefront-api-types"`) passed to the mapper, the result assigned to a variable of the `Ripple*` type. The test `[T1] types: C-24 ...` asserts `LOOKED_UP.length` equals the number of UNVERIFIED names counted in step 3 and that every `page` starts with `https://shopify.dev/`. The type half is proven by `pnpm typecheck`.
5. Proof: `pnpm typecheck && pnpm test:unit --files=src/types.test.ts --no-skips && pnpm test:commerce --no-skips && pnpm ci`. PLAN 5.0.

### Acceptance

`pnpm test:commerce --no-skips 2>&1 | grep 'C-27'` shows passing lines. `pnpm test:unit --files=src/types.test.ts 2>&1 | grep 'C-24'` shows a passing line. `pnpm typecheck` exits 0. `grep -c 'UNVERIFIED' src/types.test.ts` prints `0`.

### Out of scope

Changing any type of `### 11.1 ` or any mapper. Chrome mappers (menus, localization: M5). C-28 (M4-T22). Running a query against a store.

### If blocked

- The Shopify documentation tool is not available in the session: BLOCKED-ON-ENV for the C-24 half. Never write `LOOKED_UP` from memory. Ship C-27 alone in this pull request; write `BLOCKED-ON-ENV: C-24 needs the Shopify docs tool` in the done file; the M4 gate then fails on C-24 until a session with the tool finishes it.
- A mapper does not type-check against the Storefront API type: do not cast. Record the field under `## Ledger issues` of `docs/05-commerce.md`, add the compile fixture with `// @ts-expect-error <field>: ledger issue` on the failing line, and report it in the pull request.
- `esbuild` is not a dependency of the root package: use the bundler call the build script of the package already uses (search `scripts/` for `esbuild`); add no dependency.

---

## M4-T21 `rp-view-event` in both adapters and the Liquid page view (`startStandardEvents`); test C-29

- **Goal:** Define the element `rp-view-event` inside the two adapter files and publish one page view per document load on the Liquid backend, proven by test C-29.
- **Depends on:** M1-T46.
- **Kind:** `runtime`. Size M.

### Read first

`docs/05-commerce.md`: `### 12.1 `, `### 12.2 `, `### 12.3 ` (whole, 9 kB; the code blocks are complete), `### 7.6 `, rows 9 and 14 of the change table in `## 1. Reference implementation`, row C-29 of `## 14. Acceptance tests`. `docs/00-decisions.md`: entry D-089. `docs/13-testing.md`: rule ST-6 and the paragraph around it. Repository: `src/commerce/adapter-hydrogen.ts`, `src/commerce/adapter-liquid.ts`, `src/commerce/index.ts` (function `create`), `src/testing/serve-theme.ts` (export `STANDARD_EVENTS_EMULATION`), `test/commerce/pages.ts`, test `C-01` in `test/commerce/liquid.test.ts`.

### Files

Change: `src/commerce/adapter-hydrogen.ts`, `src/commerce/adapter-liquid.ts`, `src/commerce/index.ts`, `test/commerce/liquid.test.ts` (add C-29; add `"rp-view-event"` to the tag list of C-01). Create nothing.

### Steps

1. Branch `task/M4-T21-view-event`.
2. `src/commerce/adapter-hydrogen.ts`: replace the line `// PLAN 4.4: M4-T21 defines rp-view-event here ...` by the function `defineViewEvent()` with the complete class of `### 12.2 ` (`observedAttributes` is `["view-event-payload"]`; it publishes once per payload value). `afterReady` is exactly the code of `### 12.1 `.
3. `src/commerce/adapter-liquid.ts`: replace the line `// PLAN 4.4: M4-T21 adds startStandardEvents here` by the exported function `startStandardEvents` of `### 12.3 `, copied unchanged.
4. `src/commerce/index.ts`, function `create()`: add `if (options.backend === "liquid" && options.analytics) void startStandardEvents();` at the place `### 12.3 ` states (before the feature tests). Import `startStandardEvents` from `./adapter-liquid`.
5. C-29 in `test/commerce/liquid.test.ts`, `[T5] commerce-liquid: C-29 ...`. The page of `test/commerce/pages.ts` for the liquid backend; the route `/events.js` answers with `STANDARD_EVENTS_EMULATION` (the spike's `/events.js` stub has no `PageViewEvent`; do not use it). Count the entries of `window.__log` whose first item is `"pageView"` (PR-M4-6). Cases:
   1. After load: exactly one entry; its `init.page.template` equals the value of `main[data-template]`; `init.page.title === document.title`; `init.page.url === location.href`.
   2. After a region refresh and after an `rp-live` `pushState` navigation: still one entry.
   3. With `"analytics": false` in the config element: zero entries and `customElements.get("rp-view-event") === undefined`.
6. Proof: `pnpm typecheck && pnpm build && pnpm test:unit --files=src/commerce/adapter --no-skips && pnpm test:behavior --files=test/commerce/liquid --no-skips && pnpm test:commerce --no-skips && pnpm test:size && pnpm ci`. `grep -rn 'PLAN 4.4: M4-T21' src/` prints nothing. PLAN 5.0.

### Acceptance

Proof commands exit 0. `pnpm test:behavior --files=test/commerce/liquid --no-skips 2>&1 | grep 'C-29'` shows passing lines. `grep -c 'startStandardEvents' src/commerce/index.ts` prints at least `2`. `grep -rc 'shopify:page:view' test/commerce/liquid.test.ts` prints `0` (ST-6).

### Out of scope

C-30 and the serve-theme page-view test (M7-T27). C-37 (no PLAN row; PR-M4-10). Blueprints or sections that print `<rp-view-event>`. Consent UI. Cart events (exist since M1).

### If blocked

- `STANDARD_EVENTS_EMULATION` is not exported by `src/testing/serve-theme.ts`: stop with a draft pull request naming M1-T39; do not write an emulation in the test.
- `src/architecture.test.ts` fails because a new value import from `@shopify/hydrogen` appears: the import belongs in `adapter-hydrogen.ts` only (M4-R22); move it.
- Whether the platform publishes the page view by itself is the SPIKE-01 question (M10-T03). Default now: the adapter publishes it. Do not add detection code.
- The config element has no `analytics` key: the key and its default are defined by `docs/05-commerce.md` section 3 (search `analytics`); when the M1 code lacks it, add only the read of the key in `create()` and report it.

---

## M4-T22 SPIKE-10 part (b): React `useRegionHtml` checks 6 to 9 (C-28); complete the report

- **Goal:** Measure checks 6 to 9 of SPIKE-10 (React `useRegionHtml` with PredictiveSearch and ProductRecommendations), add test C-28, and complete the spike report.
- **Depends on:** M1-T44, M4-T17, M4-T19.
- **Kind:** `spike` (M4-R23, M4-R24).

### Read first

`docs/05-commerce.md`: `### SPIKE-10 ` (2 kB; checks 6 to 9 and the pass condition) and row C-28 of `## 14. Acceptance tests`; `### Fallback (SPIKE-10)` (read, do NOT apply). `docs/13-testing.md` `### 9.1 ` (the test `[T4] react: useRegionHtml returns null during hydration and the HTML after the first publish`). `docs/00-decisions.md` section `## 3. Spike tasks`, row SPIKE-10. Repository: `docs/research/spikes/html-region-refresh/README.md` (part (a), written by M1-T44), `test/hydration/react.test.ts`, `examples/react/.ripple-conformance/` (the tier-4 app), `components/predictive-search/react/predictive-search.tsx`.

### Files

Change: `test/hydration/react.test.ts` (replace the placeholder comment for the `useRegionHtml` test by the test), `docs/research/spikes/html-region-refresh/README.md` (complete `## Part (b)`), `docs/00-decisions.md` (one sentence, M4-R24). Create only what the tier-4 app needs to render PredictiveSearch with an empty region, in the place the existing tier-4 tests put their pages.

### Steps

1. Branch `task/M4-T22-spike-10b`.
2. Write `[T4] react: useRegionHtml returns null during hydration and the HTML after the first publish` (this is C-28 and check 6): server-render fixture `default` of `predictive-search` in the tier-4 React app, hydrate, assert no hydration error or warning in `opened.errors` and the console, and that the region is empty until the first publish.
3. Checks 7 to 9, in the same file as `[T4] react: SPIKE-10 check <n> ...` tests, Chromium: (7) typing shows results whose HTML equals the `innerHTML` of the region in the fetched document; (8) a second query replaces the results, `Escape` hides the panel, `location.href` unchanged; (9) a failing fetch leaves the previous results and raises no uncaught error.
4. Run `pnpm build && pnpm examples:install && pnpm test:run --tiers=4 --files=test/hydration/react --no-skips`. Record the observed result of each check per engine that ran.
5. Complete `## Part (b)` of the report with the headings of M4-R23. Pass condition: checks 6 to 9 all pass in Chromium.
6. Ledger: append to the SPIKE-10 row the sentence `Result (<YYYY-MM-DD>): part (b) <verdict>; report docs/research/spikes/html-region-refresh/README.md.`
7. `pnpm ci`. PLAN 5.0. Done file states the verdict.

### Acceptance

`pnpm test:run --tiers=4 --files=test/hydration/react 2>&1 | grep -c 'useRegionHtml returns null during hydration'` prints at least `1`. `grep -c '^## Part (b)' docs/research/spikes/html-region-refresh/README.md` prints `1` and the part contains a `Verdict` line with `DEFAULT holds` or `FALLBACK required`. `git diff --stat origin/main -- docs/00-decisions.md` shows one changed line.

### Out of scope

Applying any fallback. ProductRecommendations checks beyond what SPIKE-10 lists. Remix (part (a)). Changing `useRegionHtml` or `refresh-react.ts`.

### If blocked

- A check fails: that is a result, not a blocker. Keep the failing test in the file marked with the exact failure in the report, verdict `FALLBACK required`, write `FOLLOW-UP NEEDED: apply "Fallback (SPIKE-10)" of docs/05-commerce.md (react paragraph) and of docs/components/predictive-search.md, docs/components/product-recommendations.md`, open a draft pull request. M4-T24 is then blocked until the fallback task exists and is done (PLAN 7.2). A failing test MUST NOT be merged into `main`: the pull request stays a draft.
- The report file has no `## Part (b)` heading: add it after part (a).
- Node is older than the tier-4 app needs: BLOCKED-ON-ENV; record `node --version` in the done file.

---

## M4-T23 Checker family "progressive enhancement, commerce, agent": RP301 to RP309, RP320, RP321

- **Goal:** Add the eleven checker rules RP301 to RP309, RP320 and RP321, each with a bad and a good example and tests.
- **Depends on:** M0-T43, M1-T46.
- **Kind:** `checker`. Size M.

### Read first

`docs/07-manifest-registry-cli.md`: `### 9.3 API and rule modules` (the rule module shape and `RuleContext`), in `### 9.6 Rules (complete list)` only the rows RP301 to RP309, RP320, RP321, `### 9.7 ` (6 kB together). `docs/05-commerce.md` `## 13. Checker rules` (3 kB). `docs/08-agent-kit-and-evals.md`: `### 5.4 `, and in `### 5.5 Rule registry` only the same eleven rows (4 kB). Repository: `src/check/rules/RP113.ts`, `src/check/rules/RP113.test.ts`, `src/check/rules/index.ts`.

### Files

Create: `src/check/rules/RP301.ts` to `RP309.ts`, `RP320.ts`, `RP321.ts`, and one `.test.ts` beside each (22 files). Change: `src/check/rules/index.ts` (add the eleven rules, ascending id order).

### Steps

1. Branch `task/M4-T23-rules-rp3xx`.
2. Per rule, copy the module shape of `src/check/rules/RP113.ts`. `meta`: `id`, `severity`, `layers`, `hosts` from the 9.6 row; `title` = the first sentence of the row's "Detects" cell; `why` from the 5.5 row of doc 08. `text`: `problem` and `fix` from the 5.5 row; `bad` and `good` example strings that the rule itself must classify correctly.
3. Detection: implement the 9.6 "Detects" cell and the matching paragraph of doc 05 section 13 literally. Summary to check your reading against (the specs win):

   | Rule | Sev. | Layer | Notes |
   |---|---|---|---|
   | RP301 | error | H | |
   | RP302 | error | H | |
   | RP303 | error | H | server HTML documents; four lettered cases a to d |
   | RP304 | warning | H | |
   | RP305 | error | H | form dialect, read from the manifest (`liquid.formDialect`, `hydrogenHost.formDialect`) through the context's component table |
   | RP306 | error | H | host `liquid` only |
   | RP307 | error | S | host `liquid`; text `updateCart.configure` outside `assets/ripple*.js`; existence of `snippets/standard-actions-config.liquid` or `assets/standard-actions-override.js` |
   | RP308 | error (first case warning) | H | four cases; the containment case applies only to `rp-cart` |
   | RP309 | error | H | three lettered cases a to c |
   | RP320 | error | H | data-driven from the manifests' `agent.confirm[]` |
   | RP321 | warning | H | |

4. Register in `src/check/rules/index.ts`.
5. Proof: `pnpm typecheck && pnpm test:unit --files=src/check/rules/ --no-skips && pnpm ci`. PLAN 5.0.

### Tests (each `src/check/rules/<N>.test.ts`)

`[T1] <N>: bad example reports exactly one <N> diagnostic`; `[T1] <N>: good example reports nothing`; `[T1] <N>: meta matches the 9.6 row`; and for a rule with lettered cases one `[T1] <N>: case <letter> ...` per case.

### Acceptance

`ls src/check/rules/RP30[1-9].ts src/check/rules/RP32[01].ts | wc -l` prints `11`; the same with `.test.ts` prints `11`. `pnpm test:unit --files=src/check/rules/ --no-skips` exits 0. `pnpm ci` exits 0 (it runs the checker over the fixtures and examples: no existing fixture may trigger a new rule).

### Out of scope

Rules RP310 to RP319 and RP322 onward (other milestones; see `### 9.7 `). The fixer. Changing `RuleContext`. Changing any component manifest to make a rule pass.

### If blocked

- `RuleContext` has no project file list or paths (needed by RP307's file-existence clause and any layer-S clause of RP309): implement the clauses the context supports and leave the other clause out. Do NOT mark the gap with a `// PLAN 4.4:` comment (that marker is for bring-up lines only); record `RP307 partial: file-existence clause needs project paths` under `## Ledger issues` of `docs/07-manifest-registry-cli.md` and in the pull request, the same way M2 recorded RP112 and RP117.
- An existing fixture or example triggers a new rule: the fixture or the rule reading is wrong. Do not weaken the rule and do not edit the fixture; draft pull request naming the fixture and the rule.
- The 9.6 row and doc 05 section 13 disagree: doc 07 9.6 wins for id, severity, layer; doc 05 wins for the detection detail; record the difference under `## Ledger issues` of `docs/07-manifest-registry-cli.md`.

---

## M4-T24 M4 gate

- **Goal:** Prove that milestone M4 is complete by running the gate checks of the M4 gate row of `docs/PLAN.md` and recording the result.
- **Depends on:** M4-T01 to M4-T23.
- **Kind:** `gate`. No source, test or spec file changes.

### Read first

`docs/PLAN.md`: section 4.2 (the gate rules) and the M4 row of the gate table (search `| M4 | M4-T24 |`). This file: sections 0.2 and 0.8.

### Files

Create: `docs/plan/done/M4-T24.md`. Change nothing else.

### Steps

1. Branch `task/M4-T24-gate`, from an up-to-date `main`.
2. Done files: `ls docs/plan/done/ | grep -c '^M4-T\(0[1-9]\|1[0-9]\|2[0-3]\)\.md$'` MUST print `23`. No done file of M4 contains `BLOCKED` or `FOLLOW-UP NEEDED` (`grep -l 'BLOCKED\|FOLLOW-UP NEEDED' docs/plan/done/M4-T*.md` prints nothing).
3. `pnpm install --frozen-lockfile && pnpm ci` exits 0.
4. The 26 components:

   ```bash
   for id in price add-to-cart-button checkout-button product-form cart-link cart-line cart-summary cart-lines cart-drawer swatch search-form product-card collection-card article-card price-range filter-group live-form filters filter-chips sort-select variant-picker product-gallery cart-note discount-code predictive-search product-recommendations; do
     test -f components/$id/$id.json || echo "MISSING $id"
   done
   ```

   prints nothing. Every entry of kind `commerce` has `"status": "beta"`; every `static` or `native` one `"stable"`.
5. Commerce tests: the output of `pnpm test --no-skips` contains a passing line for each of C-01 to C-16, C-18, C-22 to C-25, C-27, C-29, C-32 (grep each id; C-24 is in `src/types.test.ts`).
6. SPIKE-10 part (b): `grep -c '^## Part (b)' docs/research/spikes/html-region-refresh/README.md` prints `1`; the verdict is `DEFAULT holds`, or the fallback follow-up task is done.
7. Rules: `for n in 301 302 303 304 305 306 307 308 309 320 321; do test -f src/check/rules/RP$n.ts && test -f src/check/rules/RP$n.test.ts || echo "MISSING RP$n"; done` prints nothing.
8. `grep -rn 'PLAN 4.4: M4-' src/` prints nothing.
9. Write `docs/plan/done/M4-T24.md`: the commands above with their observed output, the commit hash checked, and a section `## Open notes` listing: tests C-33 to C-39 have no owning task (PR-M4-10); every line added under `## Ledger issues` of docs 05, 07, 11 by M4 tasks; every resource added under M4-R7. Commit only this file; PLAN 5.0.

### Acceptance

Every command of steps 2 to 8 gives the stated output. The done file exists and its first line is `M4 gate: PASS`.

### Out of scope

Fixing anything. Changing statuses to `stable` (M7-T28). Deleting `BRINGUP_SUBSET` (M5-T14).

### If blocked

- Any check fails: write `M4 gate: FAIL` as the first line of the done file with the failing command and output, name the task id that owns the failing item, open a draft pull request, stop. Never fix inside the gate task.
- C-24 is missing because M4-T20 recorded `BLOCKED-ON-ENV`: the gate fails; the owner is M4-T20.
