# M2 Foundations breadth: task detail

Status: detail file for the 32 rows of milestone M2 in `docs/PLAN.md` section 6. `docs/00-decisions.md` (the ledger) wins over every spec; a spec wins over this file. This file adds no API. Where it fixes a process choice the specs leave open, the choice is marked "Plan reading" and is listed in section 0.9. Ledger section 13.5 (D-134 to D-148) ratified, replaced or overturned these readings (D-146); section 0.9 gives the disposition of each. Where this file and a decision of ledger section 13.5 disagree, the decision wins.

How to use: read `AGENTS.md`, `docs/CONVENTIONS.md`, `docs/PLAN.md` sections 1 to 3 and the recipe of your task's kind (PLAN section 5), then section 0 of this file, then ONLY your task's section `## <task id>`. Do not read other task sections. Do not read `docs/plan/M1-golden-path.md`: every rule of it that M2 needs is repeated in section 0.

Contents: 0 Rules for every M2 task. Then one section per task, M2-T01 to M2-T32, in table order.

---

## 0. Rules for every M2 task

### 0.1 Finding what to read

- **M2-R1** The spec files are large and are edited between sessions. Never use a line number. Find a section by searching for its heading text exactly as this file prints it (for example search `### 7.2 File skeleton` in `docs/03-styling-and-tokens.md`) and read up to the next heading of the same or a higher level.
- **M2-R2** "Read first" lists are complete. Sizes are approximate. Read nothing else unless a command fails and its message names another file.
- **M2-R3** A component id maps to its spec `docs/components/<id>.md` ("the spec"). Its section order is fixed (PLAN 5.1 item 2).
- **M2-R4 The standard read list.** A component task that says "Read first: standard list" reads exactly:

  | File | Section | Size |
  |---|---|---|
  | `docs/components/<id>.md` | whole file | size in the task |
  | `docs/09-components-foundation.md` | `### 0.1 ` to `### 0.5 ` (stop before `### 0.6 Icon set`), and `### 0.8 ` | 13 kB |
  | `docs/07-manifest-registry-cli.md` | `### 2.2 Scope and normalisation`, `### 2.3 Nodes` (the contract template language) | 4.5 kB |
  | `docs/03-styling-and-tokens.md` | `### 7.2 File skeleton` | 3.5 kB |
  | `docs/13-testing.md` | `### 10.1 ` (the test-file template) | 2.3 kB |
  | repository files `components/stack/stack.json`, `components/stack/stack.css`, `components/stack/stack.test.ts` (done by M1-T02) | whole files, as the shape to copy | 8 kB |

  Without the spec the list is about 31 kB. It replaces items 2 to 5 of PLAN section 5.1 (PLAN 5.1 item 6): do not read a worked entry of `docs/07-manifest-registry-cli.md` section 1.7 or `docs/13-testing.md` section 10.2; the rules of 10.2 that M2 needs are M2-R17 and M2-R19. A task adds to this list only what its own "Read first" line names. A task on the hand-written path (M2-R12) replaces the `docs/07-manifest-registry-cli.md` row and the stack row by the rows M2-R12 names.

  Read two more sections only when a command sends you there: `docs/03-styling-and-tokens.md` `### 7.3 Rules` (9 kB) when `pnpm gen --check` reports a CSS lint error for your `<id>.css`; `docs/07-manifest-registry-cli.md` `### 2.4 Emission rules per host` (6.5 kB) when a generated file differs from the spec and you must decide between a manifest defect and a generator defect (M2-R11).

### 0.2 Values every M2 task uses

| Thing | Value | Source |
|---|---|---|
| Manifest `since` | `"0.1.0"` | `docs/07-manifest-registry-cli.md` section 1.7.1; `VERSION` in `src/identity.ts` |
| Manifest `status` | `"stable"` (every M2 component is kind `static`) | PLAN 3.2 |
| Manifest `kind`, `noJs.level` | `"static"`, `"full"` | `docs/09-components-foundation.md` FC-1 |
| Manifest `agent.surface` | `"accessibility-tree"` | each spec, "Agent surface" |
| Render hosts | `html`, `react`, `remix`, `liquid` (Liquid means the shim `src/testing/liquid-shim.ts`) | CONVENTIONS 1 |
| Bring-up mode | `BRINGUP_SUBSET` is `true`; `pnpm gen --check` accepts a subset of the 84 ids, and build check MB-1 ignores a `liquid.embeddedBy` entry that names a ledger component not present yet | PLAN 4.4; ledger D-135 |
| Branch | `task/<task id>-<slug>`; the slug is given in each task | PLAN 2 |
| Test name | `[T<tier>] <subject>: <ID> <statement>`; `<subject>` is the component id (or the rule id for checker tasks). When this file writes a name as a prefix followed by `...` (for example `` `[T5] container: AT-2 ...` ``), the name starts with that prefix and the rest is one sentence stating the acceptance item; a name written in full is used exactly | `docs/13-testing.md` section 2.4; ledger D-141 (2) |
| Test style | flat `test()` from `node:test`; `openPage()` per test, closed in `finally`; no fixed delays; last assertion `assert.deepEqual(opened.errors, [])` | `docs/13-testing.md` sections 2.5 and 10.1 |
| Fixture page | `fixturePageUrl("<id>/<fixture>", { js?, css?, dir?, scheme? })`; the fixture HTML is the only child of `<main id="rp-test-root">` | `docs/13-testing.md` sections 5.2, 5.3 |
| `openPage` options | `scripts: "on" | "disabled" | "blocked"`, `viewport: { width, height }` (default 1280 by 720), `reducedMotion: "reduce" | "no-preference"` (default `"reduce"`) | `docs/13-testing.md` section 5.1 |

The 28 components of M2: `container inline grid card separator heading text rich-text video label input textarea select checkbox radio-group switch field badge banner spinner skeleton progress empty-state rating skip-link announcer breadcrumb pagination`. Together with the 9 foundation components of M1 (`button stack icon icon-button link form-message visually-hidden image placeholder`) they are the 37 components of `docs/09-components-foundation.md`.

### 0.3 Component tasks: what "Recipe S" means here

Do every step of PLAN section 5.2 in order. This file then lists only the facts of the task. Rules:

- **M2-R5** The spec's "HTML contract" section is the oracle. Every fixture name this file lists MUST exist as a manifest `fixtures[]` record, `default` first, with the `props` and `children` (or `parts`) of the spec's fixture table. If this file and the spec list different fixtures, the spec wins; say so in the pull request.
- **M2-R6** Manifest values are copied from the spec: field table (`name`, `title`, `category`, `kind`, `root.elements`, `root.class`, `root.requiresId`, `liquid.tier`, `noJs`), Purpose (`summary`, `useWhen`, `dontUseWhen`), Props (`props[]`, in Props-table order, then `id` when the root prints it; `span`, `hidden`, `class` are NOT listed), Anatomy (`parts[]`), Content model (`content`), HTML contract (`template`, `fixtures[]`), Accessibility (`a11y`), Agent surface (`agent`), Checker rules (`rules[]`), Host notes (`liquid`, `dependencies.locale`, schema settings). Key names: only those of ledger section 4.8. The shape is `components/stack/stack.json`. When the spec does not give a value a REQUIRED manifest key needs, follow PLAN section 1 ("never invent"): record it under `## Ledger issues` at the end of `docs/09-components-foundation.md`, name it in the pull request, and take the smallest choice that keeps the gate green.
- **M2-R7 Schema settings.** For each prop the spec's Host notes list under "Schema settings", set `"liquid": {"name": "<snake name>", "surface": "setting", "settingType": "select"}`. Every other prop that exists on Liquid has `"surface": "param"`. At most three settings per block (MB-3).
- **M2-R8 Locale keys.** Never add the schema name keys `ripple.<id>.name` and `ripple.<id>.<part>_name` to `locales/en.default.json`: `pnpm gen` (step G5) writes them into `components/<id>/liquid/locales/<id>.json`; commit that generated file (ledger D-134 item 29; PLAN 5.2 step 3). Do not add `ripple.props.*` keys either: the generator writes them. Only three M2 tasks change `locales/en.default.json`: they add, under the top-level key `ripple`, exactly the keys of `docs/09-components-foundation.md` section 0.5 that their task section lists (M2-T20 Spinner, M2-T27 Breadcrumb, M2-T28 Pagination). Keep the file's existing key order. List every `{ "t": ... }` key the template or binding uses in `dependencies.locale`.
- **M2-R9 Embedding.** When the component embeds another (Icon, Button, Label, FormMessage): add the embedded id to this component's `dependencies.embeds` and `dependencies.components`. The embedded component's task already wrote its `liquid.embeddedBy` with the initial value of `docs/09-components-foundation.md` section 0.7 (Icon: `icon-button`, `banner`, `empty-state`, `breadcrumb`; Button: `pagination`; Label and FormMessage: `field`); under bring-up, build check MB-1 ignores the entries whose component is not present yet (ledger D-135). So open `components/<embedded id>/<embedded id>.json` and check that its `liquid.embeddedBy` lists THIS component's id. Only when it does not, add the id (that is the one change allowed in the embedded component), run `pnpm gen` and commit the regenerated Liquid files of the embedded component.
- **M2-R10 Fixture families.** Where a spec says "the generator MUST emit one fixture per ..." (Badge, Rating), there is no generator feature for it. Plan reading: write one `fixtures[]` record per family member in the manifest by hand, after the fixtures of the spec's table, each with `"generated": "template"`; `pnpm gen` then writes their files.
- **M2-R11** A generated file that differs from the HTML or the Host notes of the spec is a defect of the manifest `template` first. Fix the manifest. An M2 task MUST NOT change `src/gen/**`, `src/testing/**` or `test/**` (the pilots M1-T01 and M1-T02 owned that). If the generator is wrong for a form the template language defines (`docs/07-manifest-registry-cli.md` section 2.3): stop, open a draft pull request, name the generator file and the smallest failing manifest.
- **M2-R12 The hand-written path** (ledger D-139, which amends D-072 row 2; `docs/09-components-foundation.md` section 0 item 3; `docs/07-manifest-registry-cli.md` section 2.1; PLAN recipe C, kind cell `C`). It applies when the task says "Path: hand-written" (RichText, Field, Pagination: their specs' Host notes start with the line "Binding paths (D-139)"), or when the contract needs something the template language does not have (raw HTML, a condition on the children, an embed that passes markup children, a loop, a host-only pass-through). Then:
  1. The manifest has NO `template` key (root and parts); every fixture has `"generated": "hand"`; every entry of `files.react`, `files.remix`, `files.liquid` has `"generated": false`.
  2. Write each `components/<id>/fixtures/<name>.html` by hand. Where the spec prints a fenced block for the fixture, copy it. Where it does not, build the HTML from the Props table column "Renders as", in the attribute order of `docs/09-components-foundation.md` FC-3.
  3. Run `pnpm gen` (it writes `html/<id>.html` from the fixture files and the generated regions of the binding files), then write the bindings BELOW the generated regions: PLAN recipe C (section 5.6) steps 2 to 5, without the commerce keys. `status` stays `"stable"`.
  4. Reading, replacing the `docs/07-manifest-registry-cli.md` row and the stack row of M2-R4: `docs/07-manifest-registry-cli.md` `### 3.3 Generated regions inside hand-written files` (4.5 kB); as the code pattern and the manifest shape, the repository files `components/price/price.json`, `components/price/react/price.tsx`, `components/price/remix/price.tsx`, `components/price/liquid/snippets/rp-price.liquid` (task M1-T10, a dependency of every hand-written M2 task; about 12 kB).
  5. TSX rules that still hold: rest props spread FIRST on the root; helpers `rv()` and `cx()` only; an embedded component is rendered by importing the sibling binding (`./<id>` in React, `./<id>.tsx` in Remix), never by copying its markup; no hook, so no `"use client"`. Liquid: `{{ attributes }}` LAST in the root's opening tag; embedded components through `{% render 'rp-<id>' %}`; only the Liquid subset of D-097.
  6. Say in the pull request that the component follows ledger D-139 (its spec's Host notes start with the line "Binding paths (D-139)").
- **M2-R13a Enum props without a default** (Heading `size` and `weight`; `rpField` on Input, Textarea, Select; EmptyState `icon`). Declare the prop as the spec does: `type: "enum"`, `values`, no `default`, not `required`. Build check MB-5 allows this (ledger D-134 item 4): an unset or invalid value prints no attribute (`docs/02-html-contract.md` M-6). No M2 task changes `src/gen/`. If `pnpm gen --check` nevertheless reports MB-5 for such a prop, that is a generator defect: M2-R11 (draft pull request naming the module of `src/gen/` that implements MB-5).
- **M2-R13** A task whose default path is generated switches to M2-R12 only for a reason M2-R12 names, never because a test fails for another reason. Before switching, the task records the reason in the pull request.

### 0.4 Component rules (`rules[]`) and `CUSTOM_RULES`

- **M2-R14** A rule the spec states with a kind, selector, target, count, Message and Fix is copied into manifest `rules[]` unchanged.
- **M2-R15** A rule the spec states only as a sentence is kind `custom` (ledger D-111): the manifest entry has only `id`, `kind: "custom"`, `message`, `fix`; its detection is a function `(root: Element) => Element[]` (the violating elements; empty array passes) stored under the rule id in `CUSTOM_RULES` of `src/check/rules/RP113.ts`. The task that ships the component writes the function: open `src/check/rules/RP113.ts`; when the key already exists (as a stub that throws), replace its body; otherwise add the key. `pnpm gen --check` fails when a manifest `custom` rule has no function. Implement exactly the detection sentence of the spec's "Checker rules" section. Use only the element API the other functions in that file use. Every finding of a component rule is reported as RP113 at severity error (ledger D-143).
- **M2-R16 Message and fix texts.** The specs give no `message` and `fix` text for the nine `custom` rules. The task sections of M2-T08, M2-T09, M2-T15 and M2-T17 print the texts; ledger D-143 adopts them as written. Copy them exactly. Add no ledger-issue line for them.
- **M2-R17 Rule tests.** For every manifest `rules[]` entry write one test `[T1] <id>: rule <rule id> reports RP113` that runs the checker (`src/check/index.ts`, layer H) on a failing HTML string and asserts exactly one diagnostic with `rule === "RP113"`, `severity === "error"` and a `problem` that ends with `[<rule id>]`; plus one test `[T1] <id>: default fixture reports no RP113`. The failing HTML string is written in the test file; manifests have no example key (ledger D-134 item 23). For a `requires-ancestor` rule, or a `custom` rule that reads the document, the default-fixture test first wraps the `default` fixture in the context the rule needs (for example inside `<dialog>`), then asserts no RP113 (D-134 item 23, `docs/13-testing.md` section 10.2). A root-matching selector (`:scope` or a selector that matches the root itself) fires on the root (D-134 item 3); `:scope > <selector>` selects the children of the root (D-134 item 5). The pattern is `src/check/rules/RP113.test.ts` (read it only in a task that has rules).
- **M2-R18** `src/check/rules/RP113.ts` is edited by four M2 tasks of group A. Ledger D-147 allows this: each task adds only its own keys of `CUSTOM_RULES` (one function per rule). On a rebase conflict keep both sides' keys and re-run the proof commands.

### 0.5 Tests in `components/<id>/<id>.test.ts`

- **M2-R19 Acceptance coverage.** For every numbered item `n` of the spec's "Acceptance tests" the file contains either a test whose name contains `AT-<n> ` or a comment line `// AT-<n>: generic (<file>)`. Each task section says which form each item takes. The comment forms:

  | The item needs | Line to write |
  |---|---|
  | only generic tiers ("CA-1 to CA-9 pass"; a fixture is canonical-equal in the four hosts) | `// AT-<n>: generic (test/conformance/conformance.test.ts, test/upgrade/upgrade.test.ts, test/hydration/react.test.ts, test/nojs/render.test.ts)` listing only the files that apply |
  | the component's own rule tests | `// AT-<n>: generic (the [T1] rule tests in this file)` |
  | a later task proves it (ledger D-141 (3)) | `// AT-<n>: covered by <task id> (<file>: <test name or id>)` |

  No M2 task uses the third form unless its section says so. Every other item is a real test. A real test is never skipped and never `todo`.
- **M2-R20 Tier of a real test.** Use the tier the spec item names: "Tier 1" `[T1]`, "Tier 2" `[T2]`, "Tier 3" `[T3]`, "Tier 4" `[T4]`, "Tier 5" `[T5]`, "Tier 6" `[T6]`.
  - `[T1]` and `[T2]` tests that only inspect fixture output read `components/<id>/fixtures/<name>.html` with `node:fs` (path relative to `process.cwd()`) and parse it with the helper `components/stack/stack.test.ts` or `src/testing/canonicalize.ts` already uses. They do not open a browser.
  - A `[T2]` item about one host's output for an existing fixture is proven by the generic conformance test; use the comment form.
  - `[T3]` "accessibility snapshot" tests open the fixture page and read `page.locator("#rp-test-root").ariaSnapshot()` (Playwright); assert the roles and names the item states.
  - `[T5]` tests open `fixturePageUrl(...)`; computed values are read with `page.evaluate(() => getComputedStyle(...))`. "the computed `--color-x`" means: resolve the token by reading the computed `color` of a temporary element styled `color: var(--color-x)` inside the same scheme, then compare the two computed strings.
  - `[T6]` tests use `openPage({ scripts: "disabled" })` and interact only through `page.click`, `page.fill`, `page.keyboard.press`.
- **M2-R21 A fixture in a parent the item describes** ("in a 400 px parent", "inside `dir="rtl"`", "inside `<div style=...>`"). Plan reading: `dir` and `scheme` come from the `fixturePageUrl` options; a viewport width comes from `openPage({ viewport })`; a parent width or style is set in a `[T5]` test with `page.evaluate` on `#rp-test-root` (`style.inlineSize`, `style.fontSize`, `style.display`, `style.blockSize`, `style.color` only; `style.color` is used by M2-T07 Text AT-2). A page that needs other markup around the fixture (a `<form>`, a `<main id="main">`, a `<dialog>`, an `<input id>` next to a label) is built by M2-R22.
- **M2-R22 Custom test page** (the M1 technique, repeated here). After `const opened = await openPage(...)`, call `opened.page.route("**/*", handler)`. The handler fulfils `GET /` with the page HTML string; `GET /ripple.css` with the file `pkg/browser/ripple.css`; any `GET /ripple*.js` with the file of the same name in `pkg/browser/`; every other request is pushed to an array and answered `200` with an empty HTML body (so a form submission or link navigation can be asserted from `page.url()` and the array). Then `await opened.page.goto("http://localhost/")`. The page HTML is `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="/ripple.css"><script type="module" src="/ripple.elements.js"></script></head><body>...</body></html>`; the body is the markup the spec item prints, with the fixture file's content inserted where the item names a fixture. Never invent component markup: take it from a fixture file.
- **M2-R23 No-JS tests beyond the acceptance list.** Every M2 component is `noJs.level: "full"`. Where the spec's "Behaviour without JavaScript" says the behaviour is identical (static markup), the generic `test/nojs/render.test.ts` is the proof and no `[T6]` test is written. Where it lists functions, each acceptance item labelled "Tier 6" is the `[T6]` test.
- **M2-R24 Cross-engine.** Do not tag any test `[chromium]`. Do not run `pnpm exec playwright install`. `pnpm test:webkit` and `pnpm test:firefox` are optional (PLAN 3.2 line 17).

### 0.6 Proof commands for a component (PLAN 3.2)

Start every session with the first block of PLAN section 5.0 (the `export PNPM_HOME`, `export PATH` and `export RIPPLE_NETWORK=1` lines, the branch, `pnpm install --frozen-lockfile`).

Node 24 (ledger D-136, `docs/PLAN.md` section 3.1). `pnpm test --no-skips` needs Node 24.3 or later, because Remix needs it (rule T-7). Install once per machine, and repeat the two `export` lines in every new shell:

```bash
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"
pnpm env use --global 24.22.3
node --version   # prints v24.22.3
```

When that install fails, run each `--no-skips` command without `--no-skips`, check that every skip reason starts with `Remix needs Node 24.3 or later`, list the skip lines in the pull request; the `verify` CI job (Node 24) is the proof. Because the `ci` script itself contains `--no-skips`, replace `pnpm ci` in that case by `pnpm typecheck && pnpm gen --check && pnpm build && pnpm examples:install && pnpm test`.

Every M2 task runs after M1-T15, so export `RIPPLE_NETWORK=1` before `pnpm ci`: the Remix morph tests start the npm example `examples/remix` with `startExample` and skip otherwise (doc 13 rule T-5). Without network access, run without `--no-skips`, list the skips (reason `RIPPLE_NETWORK is not 1`), and `verify` is the proof.

In this order, all exit 0:

```bash
pnpm gen && pnpm typecheck && pnpm gen --check
pnpm build && pnpm examples:install
pnpm test:visual --component=<id> --update      # first time only; open the written files, check them, commit them
pnpm test:component --component=<id> --no-skips
pnpm test:size
pnpm ci
```

`pnpm test:component --component=<id> --no-skips` MUST end with `0 failed, 0 skipped` (under the Node fallback above: `0 failed`, and every skip reason starts with `Remix needs Node 24.3 or later` or is `RIPPLE_NETWORK is not 1`). The style snapshots are `test/visual/snapshots/<id>/<fixture>.json`.

### 0.7 Shared files that several M2 tasks edit

Edit only the lines your task names. Tasks of the same group may edit the same registration file when each adds only its own lines or its own named slot (ledger D-147). On a `git rebase origin/main` conflict keep both sides' lines, run `pnpm gen`, re-run the proof commands. Never hand-merge a generated file.

| File | Rule |
|---|---|
| `locales/en.default.json` | M2-T20, M2-T27, M2-T28 only: add your keys only (M2-R8); run `pnpm gen` |
| `src/check/rules/RP113.ts` | M2-R15, M2-R18 (tasks M2-T08, M2-T09, M2-T15, M2-T17) |
| `src/check/rules/index.ts` | M2-T29, M2-T30, M2-T31 each insert their rules; the array stays in ascending id order |
| `components/icon/icon.json`, `components/button/button.json`, `components/label/label.json`, `components/form-message/form-message.json` | only the `liquid.embeddedBy` array, and only when your id is missing from it (M2-R9) |
| generated files (`src/types.generated.ts`, `src/*/jsx.generated.ts`, `css/props.css`, generated bindings, `components/*/html/*.html`, `components/*/liquid/locales/*.json`) | never edited by hand |

### 0.8 Spikes that touch M2 components

No M2 task runs a spike. Every M2 task implements the DEFAULT path and MUST NOT apply a fallback:

| Spike | Default path in M2 | Fallback (do NOT apply) |
|---|---|---|
| SPIKE-02 (Liquid param `as`) | the Liquid param is `as` (Container, Inline, Grid, Text) | rename to `tag` through `prop.liquid.name` |
| SPIKE-06 (cross-engine CSS) | `::after` on checkbox inputs (Checkbox, Switch); unprefixed `mask-image` (Rating) | the "Fallback (SPIKE-06)" section of each spec |

### 0.9 Plan readings made by this file

| # | Topic | Reading | Disposition (ledger D-146) |
|---|---|---|---|
| PR-1 | Fixture families ("the generator MUST emit one fixture per ...") | M2-R10: hand-written `fixtures[]` records with `generated: "template"` | ratified |
| PR-2 | `message` and `fix` of the nine `custom` rules | M2-R16 and the texts in M2-T08, M2-T09, M2-T15, M2-T17 | ratified as D-143 |
| PR-3 | Who writes the `CUSTOM_RULES` functions | M2-R15: the component task | ratified |
| PR-4 | Parent and wrapper markup in component tests | M2-R21, M2-R22 | ratified |
| PR-5 | RichText, Field and Pagination cannot be expressed in the template language | hand-written path M2-R12 in M2-T08, M2-T17, M2-T28 | ratified as D-139 (PLAN kind cell `C`) |
| PR-7 | Acceptance items whose props no fixture carries (Heading AT-2, Rating AT-5) | the task sections state the reduced form, the done-file note and the `## Ledger issues` line | ratified |
| PR-8 | Layer S of RP101 to RP105 needs `src/check/liquid-calls.ts` (M6-T28) | M2-T29 depends on M6-T28 | ratified; the dependency is now in the PLAN table |

Replaced readings (do not apply them): PR-6 (`:scope >` selectors) is replaced by D-134 item 5: `rules[].selector` and `rules[].target` accept `:scope > <selector>`. PR-10 (MB-5 and optional enums) is replaced by D-134 item 4 (M2-R13a): no `src/gen/` change in M2. PR-9 (partial RP112 and RP117) is replaced by D-142: `RuleContext.cwd` exists and M2-T30 implements every case.

Spec gaps this file keeps as readings and records as ledger issues in the task: Video's React `muted` mask (the fixture schema of `docs/02-html-contract.md` section 11.2 has no per-host mask; M2-T09); SkipLink and the generic box tests CA-5, CA-8, CA-9 (M2-T25).

---

## M2-T01 Container (`container`)

- **Goal:** Ship Container, the full-width band that centres its content.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 8 kB), plus `docs/03-styling-and-tokens.md` `### 7.7 Layout defaults and layout props` (2 kB).

### Files

Create: `components/container/container.json`, `components/container/container.css`, `components/container/container.test.ts`, `test/visual/snapshots/container/*.json` (written by the test run). Generated (commit): `components/container/fixtures/*.html`, `html/container.html`, `react/container.tsx`, `remix/container.tsx`, `liquid/blocks/container.liquid`, `liquid/locales/container.json` (the schema name key, M2-R8), regenerated shared files. Every later component task commits the same generated locale file `components/<id>/liquid/locales/<id>.json`.

### Steps

1. The first block of PLAN 5.0 (exports, then branch `task/M2-T01-container`, then `pnpm install --frozen-lockfile`).
2. Recipe S (PLAN 5.2) with the values below.
3. Proof commands of section 0.6 with `<id>` = `container`; then PLAN 5.0.

### Names and values

- Root class `rp-container`; root tag `{ "prop": "as" }` with values `div section ul ol nav header footer main aside article form`, default `div`; `as` prints no attribute.
- `role="list"` is printed when `as` is `ul` or `ol`: two `role` attributes in the template with `when` `{ "eq": ["as", "ul"] }` and `{ "eq": ["as", "ol"] }` (there is no "or" form).
- `width` prints `data-width` (default `page`, always printed). `scheme` is a string printed as `data-scheme` when set. `p px py pt pb` are responsive scale props printed as `data-p` and so on when set.
- Fixtures (8): `default`, `band`, `list`, `padding`, `class`, `invalid-enum-falls-back`, `responsive`, `escaping`. All `generated: "template"`.
- Rule (1): `container-no-nesting` (kind `forbids-ancestor`, selector `:scope`, target `.rp-container`; Message and Fix in the spec).
- Schema settings: `width`. Locale keys in `locales/en.default.json`: none (M2-R8).
- CSS: custom properties `--rp-container-max`, `--rp-container-gutter`; the two modifier rules and the ROOT rule of the spec's Styling tables.

### Tests (`components/container/container.test.ts`)

AT-1 comment (generic). `[T5] container: AT-2 ...` (parent widths 375 and 1600 through `openPage({ viewport })`; content box widths 1280, 672, 1568 at 1600 and 343 at 375, using fixtures `default`, `band`, `list`). `[T5] container: AT-3 ...` (fixture `band`). `[T5] container: AT-4 ...` (fixture `responsive`, viewports 375 and 1280). `[T2] container: AT-5 ...` (reads `fixtures/invalid-enum-falls-back.html`: root tag `div`; the four-host half is generic conformance). Rule tests of M2-R17 (2 tests).

### Acceptance

Section 0.6 commands exit 0. `ls components/container/fixtures | wc -l` prints `8`. `grep -c 'role="list"' components/container/fixtures/list.html` prints `1`.

### Out of scope

A Section component (cut). Margin props. The SPIKE-02 rename of `as`.

### If blocked

SPIKE-02 is not run: keep the Liquid param `as`. A generator defect: M2-R11.

---

## M2-T02 Inline (`inline`)

- **Goal:** Ship Inline, the wrapping horizontal row.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 6 kB), plus `docs/03-styling-and-tokens.md` `### 7.7 Layout defaults and layout props` (2 kB).

### Files

Create: `components/inline/inline.json`, `inline.css`, `inline.test.ts`, style snapshots. Generated: fixtures, `html/inline.html`, `react/inline.tsx`, `remix/inline.tsx`, `liquid/blocks/inline.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T02-inline`. Recipe S. `components/stack/stack.json` is the closest shape (same `as` list, same layout props); copy its structure and change the values to the spec's Props table.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root class `rp-inline`; root tag from `as` (same list and default as Stack); `role="list"` when `as` is `ul` or `ol` (two `when` attributes, as in M2-T01).
- Fixtures (6): `default`, `toolbar`, `list`, `class`, `invalid-enum-falls-back`, `responsive`.
- No manifest rules. No schema settings. Locale keys in `locales/en.default.json`: none (M2-R8).
- Trap: a responsive value is printed unchanged (`data-wrap="nowrap md:wrap"`), never repaired (FC-6).

### Tests

AT-1 comment. `[T5] inline: AT-2 ...` (fixture `default`). `[T5] inline: AT-3 ...` (fixture `toolbar`, viewports 375 and 1280).

### Acceptance

Section 0.6 with `<id>` = `inline`. `ls components/inline/fixtures | wc -l` prints `6`.

### Out of scope

Stack, Grid. The SPIKE-02 rename.

### If blocked

Default path only; generator defect: M2-R11.

---

## M2-T03 Grid (`grid`)

- **Goal:** Ship Grid, the equal-column grid with `columns` and child `span`.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 7 kB), plus `docs/03-styling-and-tokens.md` `### 7.7 Layout defaults and layout props` (2 kB).

### Files

Create: `components/grid/grid.json`, `grid.css`, `grid.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/grid.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T03-grid`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root class `rp-grid`; root tag from `as`; `ul` or `ol` also prints `role="list"` (two `when` attributes, as in Container: `{ "eq": ["as", "ul"] }` and `{ "eq": ["as", "ol"] }`). The spec's `product-list` fenced block is the oracle.
- Fixtures (6): `default`, `responsive`, `product-list`, `alignment-padding`, `class`, `invalid-enum-falls-back`. The children of `product-list` contain `data-span="2"` written by hand on an `<li>`; it is children markup, not a prop.
- No manifest rules. No schema settings. Locale keys in `locales/en.default.json`: none (M2-R8).
- CSS ROOT rule: the spec's Styling "Rules" table (`display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); ...`). The `columns` and `span` selectors live in the generated `css/props.css`; do not repeat them in `grid.css`.

### Tests

AT-1 comment. `[T5] grid: AT-2 ...` (fixture `responsive`, viewports 1280 and 375). `[T5] grid: AT-3 ...` (fixture `product-list` at 1280). `[T5] grid: AT-4 ...` (fixture `default`).

### Acceptance

Section 0.6 with `<id>` = `grid`. `ls components/grid/fixtures | wc -l` prints `6`.

### Out of scope

ProductGrid (M4). Changing `css/props.css` by hand.

### If blocked

Default path only; generator defect: M2-R11.

---

## M2-T04 Card (`card`)

- **Goal:** Ship Card, the bordered or elevated surface.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 8 kB), plus `docs/03-styling-and-tokens.md` `### 7.5 Components with ` (4 kB; the `elevated` formula).

### Files

Create: `components/card/card.json`, `card.css`, `card.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/card.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T04-card`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `div.rp-card`. Default `variant` is `outline` (fixture `invalid-enum-falls-back` prints `data-variant="outline"`). Other defaults: the spec's Props table.
- Fixtures (8): `default`, `elevated`, `scheme`, `plain-padding`, `class`, `invalid-enum-falls-back`, `responsive`, `escaping`.
- Rule (1): `card-not-interactive` (kind `forbids-ancestor`, selector `:scope`, target `a, button`).
- Schema settings: `variant`. Locale keys in `locales/en.default.json`: none (M2-R8).

### Tests

AT-1 comment. `[T5] card: AT-2 ...` (fixture `default`). `[T5] card: AT-3 ...` (fixture `elevated`, viewports 375 and 1280). `[T5] card: AT-4 ...` (fixtures `scheme` and `default`). Rule tests (2).

### Acceptance

Section 0.6 with `<id>` = `card`. `ls components/card/fixtures | wc -l` prints `8`.

### Out of scope

ProductCard (M4). A clickable card. Checker rule RP204 (M2-T31).

### If blocked

Default path only; generator defect: M2-R11.

---

## M2-T05 Separator (`separator`)

- **Goal:** Ship Separator, the horizontal or vertical rule.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 5 kB).

### Files

Create: `components/separator/separator.json`, `separator.css`, `separator.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/separator.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T05-separator`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `hr.rp-separator` (void element; content model `none`; fixtures have no `children` key; the React binding has no `children` prop).
- Fixtures (4): `default`, `vertical`, `class`, `invalid-enum-falls-back` (equals `default`).
- No manifest rules. Schema settings: `orientation`. Locale keys in `locales/en.default.json`: none (M2-R8).
- Trap: `data-orientation` is also a UI SDK attribute name. Every CSS selector MUST include the class: `.rp-separator[data-orientation="vertical"]`.

### Tests

AT-1 comment. `[T5] separator: AT-2 ...` (fixture `default`; set `#rp-test-root` inline size to 400 px, M2-R21). `[T5] separator: AT-3 ...` (fixture `vertical`; set `#rp-test-root` to `display: flex` and block size 40 px, M2-R21).

### Acceptance

Section 0.6 with `<id>` = `separator`. `ls components/separator/fixtures | wc -l` prints `4`.

### Out of scope

A labelled separator; any text content.

### If blocked

Default path only; generator defect: M2-R11.

---

## M2-T06 Heading (`heading`)

- **Goal:** Ship Heading, `h1` to `h6` with the type scale.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 8 kB).

### Files

Create: `components/heading/heading.json`, `heading.css`, `heading.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/heading.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T06-heading`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `h1` to `h6`, class `rp-heading`. Tag form `{ "prop": "level", "prefix": "h" }`; `level` is an enum of `1 2 3 4 5 6` with default `2` and prints no attribute.
- `size` and `weight` are enums WITHOUT a default (M2-R13a; MB-5 allows it, ledger D-134 item 4): an invalid value prints nothing (FC-6); they are not schema settings.
- Fixtures (6): `default`, `display`, `level-6`, `class`, `invalid-enum-falls-back` (`level: "bogus"`, output tag `h2`), `responsive`.
- No manifest rules (the "one `h1` per page" rule is not a component rule). Schema settings: none. Locale keys in `locales/en.default.json`: none (M2-R8).

### Tests

AT-1 comment. AT-2 (Plan reading PR-7): `[T2] heading: AT-2 ...` reads the fixture files `default` (tag `h2`), `display` (`h1`), `level-6` (`h6`), `invalid-enum-falls-back` (`h2`); the four-host half for these four fixtures is generic conformance. Levels 3, 4, 5, 7 and 0 have no fixture: write in the done file `Heading AT-2: levels 3, 4, 5, 7, 0 are not rendered in four hosts (no fixture)` and add the same sentence under `## Ledger issues` of `docs/09-components-foundation.md`. `[T5] heading: AT-3 ...` (font sizes 36.3, 30.3, 24.1, 20.1, 18, 16 px with 0.2 px tolerance: only `h1`, `h2`, `h6` have a fixture without `size`; for the other levels build an M2-R22 page from the `default` fixture file with the tag name replaced). `[T5] heading: AT-4 ...` (fixture `display`, viewports 375 and 1280). `[T5] heading: AT-5 ...` (every fixture: margin 0).

### Acceptance

Section 0.6 with `<id>` = `heading`. `ls components/heading/fixtures | wc -l` prints `6`. `grep -c "^<h6" components/heading/fixtures/level-6.html` prints `1`.

### Out of scope

Adding fixtures the spec does not list. A page-outline checker rule.

### If blocked

When AT-3 fails because `pow()` is unsupported in the test browser: the spec item says "where `pow()` is supported"; assert only when `CSS.supports("font-size", "calc(1px * pow(2, 2))")` is true and record the result in the pull request.

---

## M2-T07 Text (`text`)

- **Goal:** Ship Text, body copy with `variant`, `tone`, `size` and `weight`.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 9 kB), plus `docs/03-styling-and-tokens.md` `### 7.5 Components with ` (4 kB; tone as text colour).

### Files

Create: `components/text/text.json`, `text.css`, `text.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/text.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T07-text`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `p`, `span` or `div` from `as` (default `p`), class `rp-text`. Defaults printed: `data-variant="body"`, `data-tone="neutral"` (see the Text markup quoted in other specs: `<p class="rp-text" data-variant="body" data-tone="neutral">`).
- `variant` values `body lead caption overline`; `tone` values from CONVENTIONS section 6; `size` wins over `variant` (AT-5).
- Fixtures (8): `default`, `overline`, `inline-strong`, `lead-centered`, `caption`, `class`, `invalid-enum-falls-back` (`as: "bogus"`, output tag `p`), `responsive`.
- No manifest rules. Schema settings: `variant`, `tone`. Locale keys in `locales/en.default.json`: none (M2-R8).

### Tests

AT-1 comment. `[T5] text: AT-2 ...` (fixture `default`; set `#rp-test-root` `style.color` to `rgb(1, 2, 3)` with `page.evaluate`). `[T5] text: AT-3 ...` (`overline`). `[T5] text: AT-4 ...` (`inline-strong`). `[T5] text: AT-5 ...` (M2-R22 page: the `caption` fixture file with `data-size="xl"` added to the root).

### Acceptance

Section 0.6 with `<id>` = `text`. `ls components/text/fixtures | wc -l` prints `8`.

### Out of scope

An Overline component (it is `variant="overline"`). The SPIKE-02 rename.

### If blocked

Default path only; generator defect: M2-R11.

---

## M2-T08 RichText (`rich-text`)

- **Goal:** Ship RichText, the styled container for trusted HTML (children, or the raw `html` prop).
- **Depends on:** M1-T01, M1-T02, M1-T46, M1-T10.
- **Kind / recipe:** `static`, tier `block`; recipe C (PLAN kind `static/block; C`). Path: hand-written (M2-R12, ledger D-139). Reason: the `html` prop is printed RAW and the template language only has escaped text nodes (`docs/07-manifest-registry-cli.md` section 2.3); the spec's Host notes start with the line "Binding paths (D-139)".
- **Read first:** the standard list with the M2-R12 replacement (spec 9 kB); `src/check/rules/RP113.ts` and `src/check/rules/RP113.test.ts` (repository). About 51 kB.

### Files

Create: `components/rich-text/rich-text.json`, `rich-text.css`, `rich-text.test.ts`, `components/rich-text/fixtures/{default,html,large,class,invalid-enum-falls-back}.html`, `components/rich-text/react/rich-text.tsx`, `components/rich-text/remix/rich-text.tsx`, `components/rich-text/liquid/blocks/rich-text.liquid`, style snapshots. Generated: `html/rich-text.html`, the generated regions of the three binding files. Change: `src/check/rules/RP113.ts` (key `rich-text-plain-html`).

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T08-rich-text`.
2. Manifest without `template`; five fixtures `generated: "hand"`. Fixture files: `default` and `html` are the spec's fenced blocks; `large` is `<div class="rp-rich-text" data-size="lg"><p>Soft linen.</p><p>Made in Portugal.</p></div>`; `class` is the `default` HTML with `class="rp-rich-text custom-a custom-b"`; `invalid-enum-falls-back` equals `default`.
3. `pnpm gen`, then write the three bindings below the generated regions (values below).
4. CSS from the spec's Styling section; add the `CUSTOM_RULES` function; tests; section 0.6; PLAN 5.0.

### Names and values

- Root `div.rp-rich-text`, always `data-size` (`sm base lg`, default `base`).
- React: when `html` is set (not `null`, `undefined`, `""`) render the root with `dangerouslySetInnerHTML={{ __html: html }}` and no children; otherwise render `children`. The bindings lint allows `dangerouslySetInnerHTML` in exactly this file (`docs/06-bindings.md` section 1.2).
- Remix: when `html` is set render the root with `innerHTML={unsafeHTML(html)}`; `unsafeHTML` is a value import from `remix/component` (`docs/06-bindings.md` rule X-9); otherwise `children`.
- Liquid: `{% if html != blank %}{{ html }}{% else %}{{ content }}{% endif %}` inside the root; `{{ html }}` is printed WITHOUT `escape`.
- No `escaping` fixture (the spec says it does not apply).
- Rule (1), kind `custom`: `rich-text-plain-html`. Detection (spec): an element with a class token starting `rp-` MUST NOT be a descendant of `.rp-rich-text`; the function returns those descendants. Texts (ledger D-143, M2-R16): message `A RichText contains an element with an rp- class.`; fix `Move the Ripple component out of the RichText and keep only plain HTML inside.`
- Schema settings: `size`. Locale keys in `locales/en.default.json`: none (M2-R8).

### Tests

AT-1 comment. `[T2] rich-text: AT-2 ...` (reads `fixtures/html.html`: it contains an `h2` element and not the text `&lt;h2&gt;`; the four-host half is generic conformance). `[T5] rich-text: AT-3 ...` (fixture `large`). `[T5] rich-text: AT-4 ...` (M2-R22 page: the `default` fixture file with `<p><a href="/x">Link</a></p>` as the root's content). `// AT-5: generic (test/a11y/keyboard.test.ts)` (the A-13 exemption is in the generic target-size test). Rule tests (2).

### Acceptance

Section 0.6 with `<id>` = `rich-text`. `ls components/rich-text/fixtures | wc -l` prints `5`. `grep -c 'rich-text-plain-html' src/check/rules/RP113.ts` prints at least `1`. `grep -c dangerouslySetInnerHTML components/rich-text/react/rich-text.tsx` prints `1`. `grep -c '"template"' components/rich-text/rich-text.json` prints `0`.

### Out of scope

Sanitising HTML. ArticleBody (cut; it is RichText). Any `style=` inside the binding.

### If blocked

- `pnpm gen` does not write generated regions for a hand-written `static` component: draft pull request naming `src/gen/react.ts`, `src/gen/remix.ts` or `src/gen/liquid.ts`.
- The Remix import `unsafeHTML` does not resolve: check `docs/06-bindings.md` rule X-9 once more, then draft pull request; do not use another API.

---

## M2-T09 Video (`video`)

- **Goal:** Ship Video, the native `<video>` with controls, or muted autoplay.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 9 kB); `src/check/rules/RP113.ts` and `src/check/rules/RP113.test.ts` (repository).

### Files

Create: `components/video/video.json`, `video.css`, `video.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/video.liquid`. Change: `src/check/rules/RP113.ts` (key `video-needs-source`).

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T09-video`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `video.rp-video`. Always printed with no prop: `controls`, `playsinline`, `preload="metadata"`. `autoplay: true` prints the three attributes `autoplay`, `muted`, `loop` (three presence attributes with `when` `{ "true": "autoplay" }`). There is no `muted` or `loop` prop.
- `ratio` (default `auto`), `fit` (default `cover`), `radius` (default `none`) print `data-ratio`, `data-fit`, `data-radius`. `width`, `height` are numbers printed as native attributes.
- Children are `<source>` and `<track>` elements written by the caller.
- Fixtures (6): `default`, `background`, `contain`, `class`, `invalid-enum-falls-back`, `escaping`.
- Rules (2): `video-children` (kind `max-count`, selector `:scope > *:not(source):not(track)`, count `0`; Message and Fix in the spec; the `:scope >` form is allowed by MB-17, ledger D-134 item 5); `video-needs-source`, kind `custom`: detection (spec) "a `.rp-video` element has a `src` attribute or at least one `source` child"; the function returns `[root]` when neither holds. Texts (ledger D-143, M2-R16): message `A Video has no src attribute and no source child.`; fix `Pass src, or put at least one source element inside Video.`
- Schema settings: `ratio`, `fit`, `radius`. Locale keys in `locales/en.default.json`: none (M2-R8).
- Trap (spec, UNVERIFIED): React server rendering may omit the `muted` attribute. If `[T2] video/background: react output equals the reference HTML` fails only on `muted`, add `"mask": [{ "select": "video", "op": "drop-attr", "name": "muted" }]` to the `background` fixture record (a mask applies to both sides in every host; the schema has no per-host mask) and keep AT-3, which asserts the `muted` property. In that case add one line under `## Ledger issues` at the end of `docs/02-html-contract.md`: `Video fixture background: the React muted difference needs a mask for the react and remix hosts only; section 11.2 has no per-host mask, so the mask applies to every host.` and name it in the pull request (the spec gap is still open).

### Tests

AT-1 comment. `[T2] video: AT-2 ...` (reads fixture files `background` and `default`; attribute presence as the item lists; when the mask above was added, assert `muted` only in the fixture file, which the mask does not change). `[T5] video: AT-3 ...` (fixture `background`; `#rp-test-root` 640 px wide; box 640 by 360; `muted` property `true`). `[T6] video: AT-4 ...` (fixture `default`, scripts disabled; `controls` property read with `page.evaluate`, which is allowed for reading). Rule tests (3).

### Acceptance

Section 0.6 with `<id>` = `video`. `ls components/video/fixtures | wc -l` prints `6`. `grep -c 'video-needs-source' src/check/rules/RP113.ts` prints at least `1`.

Test note: no network request for a video file may fail a test; the last assertion on `opened.errors` MUST pass. If the fixture URLs produce load errors, abort `**/*.mp4`, `**/*.webm`, `**/*.jpg` with `page.route` before `goto`.

### Out of scope

`<iframe>` embeds. Props `muted`, `loop`, `controls`. Custom player controls.

### If blocked

`pnpm gen --check` rejects the selector of `video-children`: MB-17 accepts `:scope > <selector>` (ledger D-134 item 5), so this is a generator defect: M2-R11.

---

## M2-T10 Label (`label`)

- **Goal:** Ship Label, the native `<label>`.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 5 kB).

### Files

Create: `components/label/label.json`, `label.css`, `label.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/snippets/rp-label.liquid` (the markup, because `liquid.embeddedBy` is non-empty) and the thin `liquid/blocks/label.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T10-label`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `label.rp-label`. Prop `htmlFor` (Liquid `html_for`) prints the native attribute `for` (React JSX prop `htmlFor`; Remix prints `for`).
- Fixtures (4): `default`, `wrapping`, `class`, `escaping`. There is no `invalid-enum-falls-back` fixture (no enum prop with a default).
- `liquid.embeddedBy`: `["field"]`, the initial value of `docs/09-components-foundation.md` section 0.7. Field does not exist yet; under bring-up build check MB-1 ignores that entry (ledger D-135). The generator therefore writes the markup to `snippets/rp-label.liquid` now, and M2-T17 does not change `label.json`.
- No manifest rules. Schema settings: none. Locale keys in `locales/en.default.json`: none (M2-R8).

### Tests

AT-1 comment. `[T5] label: AT-2 ...` (M2-R22 page: the `default` fixture file followed by `<input id="email">`; click the label; the input has focus; its accessible name is `Email`). `[T5] label: AT-3 ...` (fixture `wrapping`). `[T5] label: AT-4 ...` (fixture `default`: font size 14 px, weight 500).

### Acceptance

Section 0.6 with `<id>` = `label`. `ls components/label/fixtures | wc -l` prints `4`. `grep -c 'for="email"' components/label/fixtures/default.html` prints `1`. `test -f components/label/liquid/snippets/rp-label.liquid` succeeds.

### Out of scope

Field (M2-T17). Checker rule RP114 (M2-T30).

### If blocked

Default path only; generator defect: M2-R11.

---

## M2-T11 Input (`input`)

- **Goal:** Ship Input, the native single-line text control.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 12 kB).

### Files

Create: `components/input/input.json`, `input.css`, `input.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/input.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T11-input`. Recipe S.
2. After `pnpm gen`, open `components/input/react/input.tsx` and check the two points under "Traps". Section 0.6, PLAN 5.0.

### Names and values

- Root `input.rp-input` (void; content model `none`). `type` enum `text email tel url password search number date`, default `text`, always printed. `size` prints `data-size` (default `md`).
- Prop to attribute: `defaultValue` prints `value`; `autoComplete` prints `autocomplete`; `invalid` prints `aria-invalid="true"`; `describedBy` prints `aria-describedby`; `ariaLabel` prints `aria-label`; `formId` (Liquid `form_id`) prints the native `form`; `rpField` (Liquid `rp_field`) prints `data-rp-field`.
- `rpField` is an enum of `merchandise-id quantity line-id selling-plan note discount-code` with NO default: an invalid value prints no attribute (M2-R13a; MB-5 allows it, ledger D-134 item 4). In the reference HTML `form` comes after the other native attributes and `data-rp-field` is last.
- Fixtures (9): `default`, `email-invalid`, `search`, `number-disabled`, `class`, `invalid-enum-falls-back` (`type: "bogus"`, output `type="text"`), `commerce-field`, `invalid-rp-field` (equals `default`), `escaping`.
- No manifest rules. Schema settings: `size`. Locale keys in `locales/en.default.json`: none (M2-R8).
- Traps: (1) React MUST receive `defaultValue`, not `value` (`docs/06-bindings.md` rule R-16: uncontrolled controls print `defaultValue` / `defaultChecked`). (2) `{{ attributes }}` is LAST in the Liquid opening tag.

### Tests

AT-1 comment. `[T5] input: AT-2 ...` (fixtures `number-disabled` (sm, 36 px), `default` (md, 44 px), `search` (lg, 52 px); font size 16 px each; `#rp-test-root` 300 px wide gives width 300 px). `[T5] input: AT-3 ...` (fixtures `email-invalid` and `default`). `[T2] input: AT-4 ...` (reads the fixture files `default` and `invalid-rp-field`: the listed attributes are absent; the two files are equal after canonicalisation). `[T6] input: AT-5 ...` (M2-R22 page, scripts disabled: `<form method="get" action="/x">` + the `email-invalid` fixture file + `<button type="submit">Go</button></form>`; fill `ada@example.com`; submit; `page.url()` ends with `/x?email=ada%40example.com`).

### Acceptance

Section 0.6 with `<id>` = `input`. `ls components/input/fixtures | wc -l` prints `9`. `grep -c "data-rp-field" components/input/fixtures/invalid-rp-field.html` prints `0`.

### Out of scope

Field (M2-T17). Checker rules RP101, RP114, RP202. Input masks, date pickers.

### If blocked

- The generated React file prints `value=` for `defaultValue`: this is a generator defect for a defined mapping (M2-R11). Draft pull request naming `src/gen/react.ts`.
- MB-5 rejects `rpField`: generator defect (M2-R13a).

---

## M2-T12 Textarea (`textarea`)

- **Goal:** Ship Textarea, the native multi-line text control.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 10 kB).

### Files

Create: `components/textarea/textarea.json`, `textarea.css`, `textarea.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/textarea.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T12-textarea`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `textarea.rp-textarea`. Content model `none`: the caller passes no children; the text content is `defaultValue`, HTML-escaped (a text node `{ "text": { "prop": "defaultValue" } }` as the only child; no slot).
- `rows` is a number with default `4`, always printed. `size` default `md`. `rpField` and `formId` as Input (M2-T11).
- Fixtures (8): `default`, `note`, `invalid-disabled`, `class`, `invalid-enum-falls-back`, `commerce-field`, `invalid-rp-field` (equals `default`), `escaping`.
- No manifest rules. Schema settings: `size`. Locale keys in `locales/en.default.json`: none (M2-R8).
- Trap: NO whitespace between the start tag, the value and the end tag in any host (`<textarea ...>{{ default_value | escape }}</textarea>`): whitespace inside `<textarea>` is content and is compared verbatim.
- Trap: the spec's Host notes say React receives `defaultValue` as the prop `defaultValue` (React prints it as text content). If the generated React file prints the value as a child and `[T2] textarea/note: react output equals the reference HTML` or the tier 4 hydration test fails, that is a reason for M2-R12 (host-only pass-through); record it.

### Tests

AT-1 comment. `[T2] textarea: AT-2 ...` (reads fixture files `note` and `default`: the element's text content is exactly `Leave at the door & ring <twice>` after HTML decoding, with no leading or trailing whitespace; `default` is empty; the four-host half is generic conformance). `[T5] textarea: AT-3 ...` (fixture `default`). `[T6] textarea: AT-4 ...` (M2-R22 page, scripts disabled: the `note` fixture file inside `<form method="get" action="/x">` with a submit button; `page.url()` ends with `note=Leave+at+the+door+%26+ring+%3Ctwice%3E`).

### Acceptance

Section 0.6 with `<id>` = `textarea`. `ls components/textarea/fixtures | wc -l` prints `8`. `grep -c "></textarea>" components/textarea/fixtures/default.html` prints `1`.

### Out of scope

Auto-growing height. Character counters.

### If blocked

Default path; the switch to M2-R12 only for the reason in the second trap. MB-5 rejects `rpField`: generator defect (M2-R13a).

---

## M2-T13 Select (`select`)

- **Goal:** Ship Select, the native `<select>` with the React-only `defaultValue` prop.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated. Size M: first component with a host-scoped prop and host-scoped fixtures.
- **Read first:** standard list (spec 12 kB), plus `docs/02-html-contract.md` `### 11.3 Meaning of each key` (3 kB; the `hosts` key).

### Files

Create: `components/select/select.json`, `select.css`, `select.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/select.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T13-select`. Recipe S.
2. After `pnpm gen` and `pnpm build`, run `pnpm test:conformance --component=select` first and read the result for `select/sort-react` (trap 2).
3. Section 0.6, PLAN 5.0.

### Names and values

- Root `select.rp-select`. Children are `<option>` and `<optgroup>` elements written by the caller. The initial selection is the `selected` attribute on one `<option>` (children markup). No host prints `aria-selected`.
- Props as Input where the names match (`name`, `autoComplete`, `required`, `disabled`, `size`, `invalid`, `describedBy`, `ariaLabel`, `rpField`, `formId`), plus `defaultValue`: manifest `"hosts": ["react"]`, no `liquid` key (build check MB-4), no attribute in the reference HTML.
- Fixtures (10): `default`, `sort` (`"hosts": ["html", "remix", "liquid"]`), `sort-react` (`"hosts": ["react"]`; reference HTML identical to `sort`), `required-invalid`, `disabled`, `class`, `invalid-enum-falls-back`, `commerce-field`, `invalid-rp-field` (equals `default`), `escaping`. This host-scoped pair is allowed (ledger section 13.3, row "Select fixtures `sort` and `sort-react`").
- Rule (1): `select-children` (kind `max-count`, selector `:scope > *:not(option):not(optgroup)`, count `0`; Message and Fix in the spec; the `:scope >` form is allowed by MB-17, ledger D-134 item 5).
- Schema settings: `size`. Locale keys in `locales/en.default.json`: none (M2-R8).
- Trap 1: the `sort-react` fixture file is produced by the reference renderer, which has no `selected` for a React-only prop. If `pnpm gen` writes `fixtures/sort-react.html` WITHOUT `selected` on the second option, set that one record to `"generated": "hand"` and write the file with the same content as `fixtures/sort.html`.
- Trap 2: in React, `defaultValue` MUST reach `<select defaultValue>`. If `[T2] select/sort-react: react output equals the reference HTML` fails because the generated binding drops the prop, that is a reason for M2-R12 (host-only pass-through); record it and hand-write the three bindings.
- Trap 3 (spec, UNVERIFIED): Remix prints `selected` on `<option>` unchanged; `[T2] select/sort: remix output equals the reference HTML` decides. If it fails, draft pull request with the Remix output; do not add a mask.

### Tests

AT-1 comment. `[T2] select: AT-2 ...` (reads `fixtures/sort.html` and `fixtures/sort-react.html`: canonically equal; `selected` on the second option; the host half is generic conformance). `[T5] select: AT-3 ...` (fixtures `sort` (sm, 36), `default` (md, 44), `required-invalid` (lg, 52); `appearance: none`; `background-image` contains two gradients). `[T5] select: AT-4 ...` (fixture `sort`: `value` property `price-ascending`). `[T6] select: AT-5 ...` (M2-R22 page, scripts disabled: the `sort` fixture file in a GET form; submit; `page.url()` contains `sort_by=price-ascending`). Rule tests (2).

### Acceptance

Section 0.6 with `<id>` = `select`. `ls components/select/fixtures | wc -l` prints `10`. `diff components/select/fixtures/sort.html components/select/fixtures/sort-react.html` prints nothing.

### Out of scope

`multiple`. A custom listbox (prohibited). SortSelect (M4).

### If blocked

`pnpm gen --check` rejects the rule selector: generator defect (MB-17 accepts `:scope > <selector>`, ledger D-134 item 5), M2-R11. MB-5 rejects `rpField`: generator defect (M2-R13a). Otherwise the traps above.

---

## M2-T14 Checkbox (`checkbox`)

- **Goal:** Ship Checkbox, the native checkbox input drawn by CSS.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 9 kB).

### Files

Create: `components/checkbox/checkbox.json`, `checkbox.css`, `checkbox.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/checkbox.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T14-checkbox`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `input.rp-checkbox` with the literal attribute `type="checkbox"` (always printed; not a prop). `defaultChecked` prints `checked` (React receives `defaultChecked`, rule R-16). No `aria-checked` in any host.
- Fixtures (6): `default`, `checked`, `required-invalid`, `disabled`, `class`, `escaping`. No `invalid-enum-falls-back` (no enum prop).
- No manifest rules. Schema settings: none. Locale keys in `locales/en.default.json`: none (M2-R8).
- CSS: the check mark is `:checked::after` (spec Styling). Do NOT apply "Fallback (SPIKE-06)".

### Tests

AT-1 comment. `[T5] checkbox: AT-2 ...` (fixtures `default` and `checked`; the `::after` values are read with `getComputedStyle(el, "::after")`). `[T5] checkbox: AT-3 ...` (Space toggles `checked` on fixture `default`; the label half uses an M2-R22 page: `<label>` wrapping the `default` fixture file and the text `Gift`). `[T2] checkbox: AT-4 ...` (no fixture file contains `aria-checked`). `[T6] checkbox: AT-5 ...` (M2-R22 page, scripts disabled: the `checked` fixture file in a GET form; `page.url()` contains `gift=yes`).

### Acceptance

Section 0.6 with `<id>` = `checkbox`. `ls components/checkbox/fixtures | wc -l` prints `6`.

### Out of scope

An indeterminate state. `ui-checkbox` (rejected). The SPIKE-06 fallback.

### If blocked

Default path; generator defect: M2-R11.

---

## M2-T15 RadioGroup (`radio-group`)

- **Goal:** Ship RadioGroup, a `<fieldset>` of native radios, with its legend and item parts.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `parts`; recipe S. Path: generated. Size M: first `static` component with author parts and part templates.
- **Read first:** standard list (spec 12 kB), plus `docs/02-html-contract.md` `### 11.3 Meaning of each key` (3 kB; the `parts` key); `src/check/rules/RP113.ts` and `src/check/rules/RP113.test.ts` (repository).

### Files

Create: `components/radio-group/radio-group.json`, `radio-group.css`, `radio-group.test.ts`, style snapshots. Generated: fixtures, `html/radio-group.html`, `react/radio-group.tsx` (exports `RadioGroup`, `RadioGroupLegend`, `RadioGroupItem`), `remix/radio-group.tsx`, `liquid/blocks/radio-group.liquid`, `liquid/blocks/radio-group-legend.liquid`, `liquid/blocks/radio-group-item.liquid`. Change: `src/check/rules/RP113.ts` (three keys).

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T15-radio-group`. Recipe S. The manifest has a root `template` (the `fieldset` with one slot) and `parts[]` with a `template` on each author part.
2. Section 0.6, PLAN 5.0.

### Names and values

- Parts (ledger section 4.8 keys `name`, `elements`, `class`, `required`, `multiple`, `authoredBy`, `parent`, `props[]`, `content`, `template`, `description`):

  | Part | `authoredBy` | Element | Class | Props |
  |---|---|---|---|---|
  | `legend` | `author` | `legend` | `rp-radio-group-legend` | none |
  | `item` | `author` (`multiple: true`) | `label` | `rp-radio-group-item` | `name` (required), `value` (required), `defaultChecked`, `required`, `disabled` |
  | `input` | `component`, `parent: "item"` | `input` | `rp-radio-group-input` | (printed by the item template; `type="radio"` literal) |
  | `label` | `component`, `parent: "item"` | `span` | `rp-radio-group-label` | (printed by the item template; holds the item's slot) |

- Root `fieldset.rp-radio-group`: `disabled` (native, on the fieldset), `data-orientation` (default `vertical`), `aria-describedby` from `describedBy`.
- Item template, in this order: `<label class="rp-radio-group-item"><input class="rp-radio-group-input" type="radio" name value [checked] [required] [disabled]><span class="rp-radio-group-label">SLOT</span></label>`. `class`, `id` and rest props of an item go on the `<label>`.
- Fixtures (5), in the `parts` form (`"parts": [{ "part": "legend", "children": "Size" }, { "part": "item", "props": {...}, "children": "Small" }, ...]`): `default`, `horizontal-disabled`, `class`, `invalid-enum-falls-back`, `escaping`.
- Rules (3), all kind `custom` (M2-R15). Detection sentences are the spec's; the texts are adopted by ledger D-143 (M2-R16):

  | Rule id | Detection (spec) | Function returns | `message` | `fix` |
  |---|---|---|---|---|
  | `radio-group-legend` | the first child of `.rp-radio-group` is `legend.rp-radio-group-legend` | `[root]` when the first element child is not that | `The first child of a RadioGroup is not its legend.` | `Put the radio-group-legend part first inside RadioGroup.` |
  | `radio-group-one-name` | all `.rp-radio-group-input` elements inside one `.rp-radio-group` have the same `name` | every input whose `name` differs from the first input's | `The radios of a RadioGroup have different names.` | `Pass the same name to every radio-group-item.` |
  | `radio-group-one-checked` | at most one of them has `checked` | every checked input after the first checked one | `A RadioGroup has more than one checked radio.` | `Pass defaultChecked to at most one radio-group-item.` |

- Schema settings: `orientation` on `radio-group`; none on the parts. Locale keys in `locales/en.default.json`: none (M2-R8; the schema name keys `ripple.radio-group.name`, `ripple.radio-group.legend_name`, `ripple.radio-group.item_name` are generated).
- Trap: the classes are `rp-radio-group-item`, `rp-radio-group-input`, `rp-radio-group-label`. `rp-radio` and `rp-label` MUST NOT appear inside a RadioGroup.

### Tests

AT-1 comment. `[T5] radio-group: AT-2 ...` (fixture `default`: `ariaSnapshot` shows a group named `Size` with radios `Small` (checked) and `Medium`; focus `Small`, press ArrowDown, `Medium` is checked). `[T5] radio-group: AT-3 ...`. `[T5] radio-group: AT-4 ...` (fixture `horizontal-disabled`, viewport 1280). `[T6] radio-group: AT-5 ...` (M2-R22 page, scripts disabled: the `default` fixture file in a GET form; `page.url()` contains `size=s`). Rule tests (4: three failing, one default).

### Acceptance

Section 0.6 with `<id>` = `radio-group`. `ls components/radio-group/fixtures | wc -l` prints `5`. `ls components/radio-group/liquid/blocks | wc -l` prints `3`. `grep -o "rp-radio-group-input" components/radio-group/fixtures/default.html | wc -l` prints `2`; `grep -c 'class="rp-label' components/radio-group/fixtures/default.html` prints `0`. `grep -c 'radio-group-one-checked' src/check/rules/RP113.ts` prints at least `1`.

### Out of scope

`role="radiogroup"`. Roving-tabindex JavaScript (native radios do it). Checker rule RP115 (M2-T30).

### If blocked

The generator cannot emit part templates for a `static` component: this form is defined (`docs/07-manifest-registry-cli.md` section 1.3, `parts[]`), so M2-R11 applies: draft pull request naming the generator file.

---

## M2-T16 Switch (`switch`)

- **Goal:** Ship Switch, a native checkbox with `role="switch"` drawn as a track and thumb.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 9 kB), plus `docs/03-styling-and-tokens.md` `## 10. Logical properties and right-to-left` (3 kB).

### Files

Create: `components/switch/switch.json`, `switch.css`, `switch.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/switch.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T16-switch`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `input.rp-switch` with the literal attributes `type="checkbox"` and `role="switch"` (always printed; not props). `defaultChecked` prints `checked`. Other props: the spec's Props table.
- Fixtures (5): `default`, `on`, `disabled-labelled`, `class`, `escaping`.
- No manifest rules. Schema settings: none. Locale keys in `locales/en.default.json`: none (M2-R8).
- CSS: the thumb is `::after` (spec Styling). Do NOT apply "Fallback (SPIKE-06)".

### Tests

AT-1 comment. `[T5] switch: AT-2 ...` (fixtures `default` and `on`; role and state from `ariaSnapshot`). `[T5] switch: AT-3 ...` (Space toggles; the right-to-left half opens fixture `on` with `{ dir: "rtl" }` and applies the item's 3 px condition). `[T6] switch: AT-4 ...` (M2-R22 page, scripts disabled: the `on` fixture file in a GET form; `page.url()` contains `subscribe=1`).

### Acceptance

Section 0.6 with `<id>` = `switch`. `ls components/switch/fixtures | wc -l` prints `5`. `grep -c 'role="switch"' components/switch/fixtures/default.html` prints `1`.

### Out of scope

`ui-switch`. `aria-checked`. The SPIKE-06 fallback.

### If blocked

Default path; generator defect: M2-R11.

---

## M2-T17 Field (`field`)

- **Goal:** Ship Field: the wrapper that lays out a label, one control, a description and an error, with its four author parts.
- **Depends on:** M1-T01, M1-T02, M1-T06, M2-T10, M1-T46, M1-T10.
- **Kind / recipe:** `static`, tier `parts`; recipe C (PLAN kind `static/parts; C`). Path: hand-written (M2-R12, ledger D-139). Reason: `FieldLabel` embeds Label and `FieldError` embeds FormMessage WITH the caller's children, and an embed node cannot pass markup children (`docs/07-manifest-registry-cli.md` section 2.3, row "Embed"); the spec's Host notes start with the line "Binding paths (D-139)", which wins over a later "generated". Size M.
- **Read first** (this list replaces the standard list; about 57 kB):

  | File | Section | Size |
  |---|---|---|
  | `docs/components/field.md` | whole file | 14.6 kB |
  | `docs/09-components-foundation.md` | `### 0.1 ` to `### 0.4 ` (stop before `### 0.5 Locale keys`), and `### 0.8 ` | 10.7 kB |
  | `docs/03-styling-and-tokens.md` | `### 7.2 File skeleton` | 3.5 kB |
  | `docs/13-testing.md` | `### 10.1 ` | 2.3 kB |
  | `docs/07-manifest-registry-cli.md` | `### 3.3 Generated regions inside hand-written files` | 4.5 kB |
  | repository (M1-T10) | `components/price/price.json`, `components/price/react/price.tsx`, `components/price/remix/price.tsx`, `components/price/liquid/snippets/rp-price.liquid` | about 12 kB |
  | repository | `components/label/label.json`, `components/form-message/form-message.json`, `components/form-message/fixtures/default.html` | about 5 kB |
  | repository | `src/check/rules/RP113.ts`, `src/check/rules/RP113.test.ts` | about 6 kB |

  The fixture `parts` form is given in step 2, so `docs/02-html-contract.md` section 11.3 is not needed.

### Files

Create: `components/field/field.json`, `field.css`, `field.test.ts`, `components/field/fixtures/{default,invalid,horizontal,class,invalid-enum-falls-back,escaping}.html`, `components/field/react/field.tsx` (exports `Field`, `FieldLabel`, `FieldControl`, `FieldDescription`, `FieldError`), `components/field/remix/field.tsx`, `components/field/liquid/blocks/{field,field-label,field-control,field-description,field-error}.liquid`, style snapshots. Generated: `html/field.html`, `liquid/locales/field.json`, the generated regions of the binding files. Change: `src/check/rules/RP113.ts` (four keys); `components/label/label.json` and `components/form-message/form-message.json` ONLY when their `liquid.embeddedBy` does not list `field` yet (M2-R9; M2-T10 and M1-T06 normally wrote it already).

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T17-field`.
2. Manifest without `template`; `dependencies.embeds` and `dependencies.components` are `["label", "form-message"]`; `root.requiresId: true`; six fixtures `generated: "hand"` in the `parts` form of `docs/02-html-contract.md` section 11.3: `"parts": [{ "part": "label", "props": { "field": "email" }, "children": "Email" }, { "part": "control", "children": "<input ...>" }, ...]`; each instance has `part`, `props` (that part's props) and either `children` (an HTML fragment) or nested `parts`; only author parts appear. Take every value from the spec's fixture table.
3. Write the six fixture files. `default`, `invalid`, `horizontal`: the spec's fenced blocks. `class`: `default` with `class="rp-field custom-a custom-b"`. `invalid-enum-falls-back`: equals `default`. `escaping`: `<div class="rp-field" data-orientation="vertical"><label class="rp-label rp-field-label" for="Say &quot;hi&quot; &amp; &lt;go&gt;">Email</label><div class="rp-field-control"><input class="rp-input" type="email" name="email" data-size="md" aria-label="Email"></div></div>`.
4. Check that `liquid.embeddedBy` of Label and of FormMessage lists `field` (M2-R9; add it only when missing); `pnpm gen`; write the bindings below the generated regions; CSS; `CUSTOM_RULES`; tests; section 0.6; PLAN 5.0.

### Names and values

- Root `div.rp-field`, `data-orientation` (`vertical horizontal`, default `vertical`). The root prints NO `id` attribute; the `id` prop is required and names the control.
- Parts, all `authoredBy: "author"`, all direct children of the root, never reordered by the binding:

  | Part | TSX export | Liquid block | Markup |
  |---|---|---|---|
  | `label` | `FieldLabel` | `field-label` | the Label contract with `for="<field>"` and class `rp-label rp-field-label` (then the caller's classes) |
  | `control` | `FieldControl` | `field-control` | `<div class="rp-field-control">SLOT</div>` |
  | `description` | `FieldDescription` | `field-description` | `<p class="rp-field-description" id="<field>-description">SLOT</p>` |
  | `error` | `FieldError` | `field-error` | the FormMessage contract with `id="<field>-error"`, `data-tone="destructive"`, `role="alert"` and class `rp-form-message rp-field-error` |

  Parts `label`, `description`, `error` take the required prop `field` (type `id`). `control` takes only `class` and rest props. Parts do not take `span` or `hidden`.
- React and Remix: `FieldLabel` renders `Label` (import `./label`, Remix `./label.tsx`) with `htmlFor={field}` and the class `rp-field-label` before the caller's class; `FieldError` renders `FormMessage` (import `./form-message`) with `tone="destructive"`, `id` equal to `field + "-error"` and the class `rp-field-error`. No hook, no React context, no `"use client"`.
- Liquid (spec, Host notes): `field-label` is `{% render 'rp-label', html_for: field, class: 'rp-field-label', content: content %}`; `field-error` assigns `error_id` as `field | append: '-error'` and is `{% render 'rp-form-message', id: error_id, tone: 'destructive', class: 'rp-field-error', content: content %}`. Passing `content: content` to an embedded snippet is the allowed exception of ledger D-110.
- Fixture lint: checks `n-9` and `a-3` are skipped automatically in a fixture named `escaping`.
- Rules (4), all kind `custom` (M2-R15). Detection sentences are the four numbered items of the spec's "Checker rules"; copy each into a comment above its function. Texts (adopted by ledger D-143, M2-R16):

  | Rule id | Function returns | `message` | `fix` |
  |---|---|---|---|
  | `field-one-control` | `[root]` unless the root has exactly one `.rp-field-control` holding exactly one `input` (not `type="hidden"`), `select` or `textarea`, and that control has an `id` | `A Field does not contain exactly one control with an id.` | `Put exactly one form control with an id inside the field-control part.` |
  | `field-label-for` | `[root]` unless the root has exactly one `label.rp-field-label` whose `for` equals the control's `id` | `The label of a Field does not point at its control.` | `Pass the Field id as field to the field-label part.` |
  | `field-describedby` | the control, when a `#<control id>-description` or `#<control id>-error` inside the root is missing from its `aria-describedby`, or an id in its `aria-describedby` does not resolve in the document | `The control of a Field does not reference its description or error.` | `Pass describedBy with the description id and the error id to the control.` |
  | `field-invalid` | the control, unless it has `aria-invalid="true"` if and only if the root contains `.rp-field-error` | `The control of a Field and its error part disagree about the invalid state.` | `Pass invalid to the control exactly when a field-error part is rendered.` |

  Each function MUST report at most one element, and the four failing samples of the tests MUST each trigger exactly one rule (spec AT-4).
- Schema settings: `orientation` on `field`; none on the parts. Locale keys in `locales/en.default.json`: none (M2-R8; `ripple.field.name` and the four `<part>_name` keys are generated).

### Tests

AT-1 comment. `[T5] field: AT-2 ...` (fixture `invalid`: accessible name `Email` and description `We only use it for order updates. Enter a valid email address.` from `ariaSnapshot`; clicking the label focuses the input). `[T5] field: AT-3 ...` (fixture `horizontal`, and again with `{ dir: "rtl" }`). `// AT-4: generic (the [T1] rule tests in this file)` plus the five rule tests (four failing samples, one default). `[T6] field: AT-5 ...` (M2-R22 page, scripts disabled: the `invalid` fixture file inside `<form method="get" action="/x">` with a submit button; empty value; click submit; the request array holds no `/x` request and `page.url()` is unchanged).

### Acceptance

Section 0.6 with `<id>` = `field`. `ls components/field/fixtures | wc -l` prints `6`. `ls components/field/liquid/blocks | wc -l` prints `5`. `grep -c ' id=' components/field/fixtures/default.html` prints `1`; `grep -c '<input[^>]* id=' components/field/fixtures/default.html` prints `1` (the id is on the `<input>`, not on the root). `test -f components/label/liquid/snippets/rp-label.liquid` succeeds. `grep -c 'field-one-control' src/check/rules/RP113.ts` prints at least `1`. `pnpm test:component --component=label --no-skips` and `pnpm test:component --component=form-message --no-skips` still pass.

### Out of scope

Wiring the control automatically (the caller passes `id`, `describedBy`, `invalid`). `ui-field`. Checker rules RP202 and RP114. QuantityInput inside a Field (works by contract; no test here).

### If blocked

- `components/label/liquid/snippets/rp-label.liquid` is missing although `components/label/label.json` lists `field` in `liquid.embeddedBy` after `pnpm gen`: draft pull request naming `src/gen/liquid.ts`.
- The Liquid shim rejects `content: content` in a `render` tag: draft pull request naming `src/testing/liquid-shim.ts` and ledger D-110.

---

## M2-T18 Badge (`badge`)

- **Goal:** Ship Badge, the small status label, with its 24 variant and tone fixtures.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 10 kB), plus `docs/03-styling-and-tokens.md` `### 7.5 Components with ` (4 kB).

### Files

Create: `components/badge/badge.json`, `badge.css`, `badge.test.ts`, style snapshots. Generated: fixtures (28 files), html, react, remix, `liquid/blocks/badge.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T18-badge`. Recipe S.
2. `components/badge/badge.css`: copy the complete file printed in the spec's Styling section ("The complete, normative file is below and MUST be copied as written") unchanged.
3. Section 0.6, PLAN 5.0.

### Names and values

- Root `span.rp-badge`; `data-variant` (`solid soft outline`, default `solid`), `data-tone` (`neutral muted primary info success warning destructive sale`, default `neutral`), `data-size` (`sm md`, default `md`); all three always printed.
- Fixtures: the 4 of the table (`default`, `small`, `class`, `invalid-enum-falls-back`), then 24 family fixtures (M2-R10) named `<variant>-<tone>` for every pair, in the order variant-major (`solid-neutral`, `solid-muted`, ..., `solid-sale`, `soft-neutral`, ..., `outline-sale`), each `{ "name": "<variant>-<tone>", "props": { "variant": "<variant>", "tone": "<tone>" }, "children": "Label", "generated": "template" }`. Total 28.
- No manifest rules. Schema settings: `variant`, `tone`, `size`. Locale keys in `locales/en.default.json`: none (M2-R8).

### Tests

AT-1 comment. `[T1] badge: AT-2 ...` (extract the fenced `css` block of the Styling section of `docs/components/badge.md` at test time with `node:fs`; compare with `components/badge/badge.css` after removing one trailing newline from each side and removing the provenance trailer if the file has one). `[T5] badge: AT-3 ...` (the 24 family fixtures, each with `{ scheme: "light" }` and `{ scheme: "dark" }`; contrast ratio of computed `color` against the computed `background-color` composited over the page background, at least 4.5; compute the WCAG ratio in the test from the sRGB values the browser returns after drawing both colours on a 1 px canvas). `[T5] badge: AT-4 ...`. `[T5] badge: AT-5 ...` (fixtures `outline-muted` and `default`).

### Acceptance

Section 0.6 with `<id>` = `badge`. `ls components/badge/fixtures | wc -l` prints `28`.

### Out of scope

A dismissible badge. Changing the CSS file to make AT-3 pass: a failing pair is a token defect; stop and report it (draft pull request naming the pair, the scheme and the measured ratio).

### If blocked

Default path; generator defect: M2-R11.

---

## M2-T19 Banner (`banner`)

- **Goal:** Ship Banner, the inline message with a tone icon and a live-region role.
- **Depends on:** M1-T01, M1-T02, M1-T03, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 11 kB), plus `docs/03-styling-and-tokens.md` `### 7.5 Components with ` (4 kB); repository file `components/icon-button/icon-button.json` (an `embed` node of Icon; task M1-T04, done before M1-T46).

### Files

Create: `components/banner/banner.json`, `banner.css`, `banner.test.ts`, style snapshots. Generated: fixtures, html, `react/banner.tsx` (imports `Icon` from `./icon`), `remix/banner.tsx` (imports from `./icon.tsx`), `liquid/blocks/banner.liquid`. Change: `components/icon/icon.json` ONLY when its `liquid.embeddedBy` does not list `banner` yet (M2-R9; M1-T03 normally wrote it).

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T19-banner`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `div.rp-banner`; `data-variant` (`soft solid outline`, default `soft`); `data-tone` (`info success warning destructive neutral`, default `info`).
- `role`: `alert` when the tone is `destructive`, `status` otherwise. Icon name by tone: `info` gives `info`, `success` gives `check`, `warning` gives `warning`, `destructive` gives `warning`, `neutral` gives `info`. The template has no derived values: write one `role` attribute per case and one Icon `embed` node per tone, each with `when` `{ "eq": ["tone", "<tone>"] }` (for `role="status"` four attributes, one per non-destructive tone; the conditions are mutually exclusive). Each embed passes `"props": { "name": "<icon name>", "class": "rp-banner-icon" }`, so the output class is `rp-icon rp-banner-icon`.
- Children of the root, in this order and always printed: the icon (part `icon`, `authoredBy: "component"`, class `rp-icon rp-banner-icon`), then `<div class="rp-banner-content">SLOT</div>` (part `content`, `authoredBy: "component"`).
- Fixtures (8): `default`, `destructive`, `success-solid`, `warning-outline`, `neutral`, `class`, `invalid-enum-falls-back` (equals `default`), `invalid-tone-falls-back` (equals `default`).
- No manifest rules. Schema settings: `variant`, `tone`. Locale keys in `locales/en.default.json`: none (M2-R8).

### Tests

AT-1 comment. `[T2] banner: AT-2 ...` (reads the five tone fixtures `default`, `success-solid`, `warning-outline`, `destructive`, `neutral`: root `role` and the `d` attributes of the icon equal the table above and the same icon's file `icons/<name>.svg`). `[T2] banner: AT-3 ...` (every fixture file: exactly one `svg.rp-icon.rp-banner-icon` then exactly one `div.rp-banner-content` as the only children of the root). `[T5] banner: AT-4 ...` (15 pairs of `variant` and `tone` in schemes `light` and `dark`: open fixture `default` with the scheme option and set `data-variant` and `data-tone` on the root with `page.evaluate` before measuring; contrast at least 4.5, computed as in M2-T18). `[T5] banner: AT-5 ...` (fixture `default`, viewport 375).

### Acceptance

Section 0.6 with `<id>` = `banner`. `ls components/banner/fixtures | wc -l` prints `8`. `grep -c 'role="alert"' components/banner/fixtures/destructive.html` prints `1`. `pnpm test:component --component=icon --no-skips` still passes.

### Out of scope

A dismiss button. Toast (M3). AnnouncementBar (M5).

### If blocked

- The generator rejects several `embed` nodes of the same component or several attributes of the same name with exclusive `when`: both forms are defined in section 2.3 ("duplicates the attribute with two `when` conditions"), so M2-R11 applies.
- AT-4 fails for a pair: token defect; draft pull request naming the pair, scheme and ratio. Do not change contrast by editing the test.

---

## M2-T20 Spinner (`spinner`)

- **Goal:** Ship Spinner, the standalone loading indicator.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 7 kB), plus `docs/03-styling-and-tokens.md` `## 8. Motion and reduced motion` (3 kB); `src/check/rules/RP113.test.ts` (repository).

### Files

Create: `components/spinner/spinner.json`, `spinner.css`, `spinner.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/spinner.liquid`. Change: `locales/en.default.json` (`ripple.spinner.label` = `Loading`).

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T20-spinner`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `span.rp-spinner`, empty; `data-size` (`sm md lg`, default `md`); literal `role="status"`; `aria-label` from `ariaLabel`, whose default is `{ "t": "ripple.spinner.label" }` (English `Loading`; Liquid prints the `t` filter). List the key in `dependencies.locale`.
- Fixtures (6): `default`, `large-labelled`, `small`, `class`, `invalid-enum-falls-back` (equals `default`), `escaping`.
- Rule (1): `spinner-not-in-button` (kind `forbids-ancestor`, selector `:scope`, target `.rp-button, .rp-icon-button`; Message and Fix in the spec).
- Schema settings: `size`. Locale keys in `locales/en.default.json`: `ripple.spinner.label` = `Loading` only (doc 09 section 0.5; M2-R8).
- CSS: the keyframes `rp-spin` already exist in `css/base.css`; do not redefine them. The animation rule goes in the MOTION section inside `@media (prefers-reduced-motion: no-preference)`.

### Tests

AT-1 comment. `[T5] spinner: AT-2 ...` (fixtures `small` 16, `default` 24, `large-labelled` 32 px). `[T5] spinner: AT-3 ...` (two pages: `openPage({ reducedMotion: "no-preference" })` gives `animationName` `rp-spin`; the default `"reduce"` gives `none`). `// AT-4: generic (test/conformance/conformance.test.ts)` (fixture `default` rendered by the Liquid host prints `aria-label="Loading"`). `// AT-5: generic (the [T1] rule tests in this file)`; the failing sample of the rule test is exactly `<button class="rp-button" type="submit" data-variant="primary" data-size="md">` + the `default` fixture file + `</button>`. Rule tests (2).

### Acceptance

Section 0.6 with `<id>` = `spinner`. `ls components/spinner/fixtures | wc -l` prints `6`. `grep -c 'aria-label="Loading"' components/spinner/fixtures/default.html` prints `1`.

### Out of scope

The pending state of Button (it has its own indicator). A full-page loader.

### If blocked

The `{ "t": ... }` default is not emitted correctly in one host: the form is defined (section 2.3), so M2-R11 applies.

---

## M2-T21 Skeleton (`skeleton`)

- **Goal:** Ship Skeleton, the pulsing placeholder for loading content.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 8 kB), plus `docs/03-styling-and-tokens.md` `## 8. Motion and reduced motion` (3 kB).

### Files

Create: `components/skeleton/skeleton.json`, `skeleton.css`, `skeleton.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/skeleton.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T21-skeleton`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `div.rp-skeleton`, empty; `data-ratio` (default `auto`), `data-radius` (default `md`); literal `aria-hidden="true"`.
- Public custom property `--rp-skeleton-width`. Keyframes `rp-pulse` exist in `css/base.css`.
- Fixtures (5): `default`, `media`, `avatar`, `class`, `invalid-enum-falls-back` (equals `default`).
- No manifest rules. Schema settings: `ratio`, `radius`. Locale keys in `locales/en.default.json`: none (M2-R8).

### Tests

AT-1 comment. `[T5] skeleton: AT-2 ...` (`#rp-test-root` 320 px wide with `font-size: 16px`, M2-R21; fixtures `default`, `media`, `avatar`). `[T5] skeleton: AT-3 ...` (set the root's `style` attribute to `--rp-skeleton-width: 50%` with `page.evaluate`; this `style` is test-page markup, as the item says). `[T5] skeleton: AT-4 ...` (`reducedMotion: "no-preference"` gives `rp-pulse`; default gives `none`). `[T2] skeleton: AT-5 ...` (every fixture file: `aria-hidden="true"` on the root, no child nodes).

### Acceptance

Section 0.6 with `<id>` = `skeleton`. `ls components/skeleton/fixtures | wc -l` prints `5`.

### Out of scope

Skeleton variants per component. A width prop.

### If blocked

Default path; generator defect: M2-R11.

---

## M2-T22 Progress (`progress`)

- **Goal:** Ship Progress, the native `<progress>` bar.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 10 kB), plus `docs/03-styling-and-tokens.md` `### 7.5 Components with ` (4 kB).

### Files

Create: `components/progress/progress.json`, `progress.css`, `progress.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/progress.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T22-progress`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `progress.rp-progress`, no content. `value` (number; unset means indeterminate: no attribute; `0` IS set and prints `value="0"`); `max` (number, default `100`, always printed); `ariaLabel` REQUIRED, printed as `aria-label`; `data-tone` (`primary success warning destructive`, default `primary`); `data-size` (`sm md`, default `md`).
- Hosts MUST NOT clamp `value`.
- Fixtures (7): `default`, `indeterminate`, `steps`, `zero`, `class`, `invalid-enum-falls-back` (equals `default`), `escaping`.
- No manifest rules. Schema settings: `tone`, `size`. Locale keys in `locales/en.default.json`: none (M2-R8).
- CSS: the selectors `::-webkit-progress-bar`, `::-webkit-progress-value`, `::-moz-progress-bar`, `:indeterminate` and one `transition` on `inline-size` are accepted by the CSS linter (ledger D-105 item 2).
- Trap: number `0`. In the TSX hosts the "set" test is `value != null && value !== ""`; `0` passes. In Liquid `0 != blank` is true. Fixture `zero` proves it in every host.

### Tests

AT-1 comment. `[T2] progress: AT-2 ...` (fixture files: `indeterminate` has no `value`; `zero` has `value="0"`; every file has `max`). `[T5] progress: AT-3 ...` (`#rp-test-root` 200 px wide; block sizes 8 and 4 px; `position` 0.4, 0.5, -1). `[T5] progress: AT-4 ...` (screenshot of fixture `default` in a 200 px container; sample the pixel colours at x = 40 and x = 160 on the vertical centre line; compare with the computed `--color-primary` and `--color-muted` drawn on a canvas as in M2-T18; no `[chromium]` tag). `[T3] progress: AT-5 ...` (`ariaSnapshot` of fixture `default`: role `progressbar`, name `Progress to free shipping`).

### Acceptance

Section 0.6 with `<id>` = `progress`. `ls components/progress/fixtures | wc -l` prints `7`. `grep -c 'value="0"' components/progress/fixtures/zero.html` prints `1`. `grep -c "value=" components/progress/fixtures/indeterminate.html` prints `0`.

### Out of scope

A text label inside the bar. Writing `value` from JavaScript (a commerce element replaces the region that contains the bar instead).

### If blocked

A host drops `value="0"`: generator defect for a defined form (`{ "set": ... }`), M2-R11.

---

## M2-T23 EmptyState (`empty-state`)

- **Goal:** Ship EmptyState, the centred "nothing here" block with an optional icon.
- **Depends on:** M1-T01, M1-T02, M1-T03, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 7 kB); repository file `components/icon-button/icon-button.json` (an `embed` node of Icon; task M1-T04).

### Files

Create: `components/empty-state/empty-state.json`, `empty-state.css`, `empty-state.test.ts`, style snapshots. Generated: fixtures, html, `react/empty-state.tsx` (imports `Icon` from `./icon`), `remix/empty-state.tsx`, `liquid/blocks/empty-state.liquid`. Change: `components/icon/icon.json` ONLY when its `liquid.embeddedBy` does not list `empty-state` yet (M2-R9; M1-T03 normally wrote it).

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T23-empty-state`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `div.rp-empty-state`; no data attribute.
- `icon`: enum of the 24 icon names, NO default (M2-R13a). When set to a known name the root's first child is the embedded Icon with class `rp-icon rp-empty-state-icon` (embed node with `"props": { "name": { "prop": "icon" }, "class": "rp-empty-state-icon" }` and `when` `{ "set": "icon" }`). Unset or unknown: nothing. The 24 names: `account arrow-left arrow-right cart check chevron-down chevron-left chevron-right chevron-up close filter globe info menu minus pause play plus search star tag trash warning zoom-in`.
- Then the slot (children: Heading, Text, Button, Link).
- Fixtures (4): `default`, `with-icon-and-action`, `unknown-icon` (equals `default`), `class`. No `invalid-enum-falls-back` (the enum has no default); no `escaping`.
- No manifest rules. Schema settings: none. Locale keys in `locales/en.default.json`: none (M2-R8).

### Tests

AT-1 comment. `[T2] empty-state: AT-2 ...` (fixture files: `unknown-icon` contains no `svg`; in `with-icon-and-action` the `svg` is the first child of the root). `[T5] empty-state: AT-3 ...` (fixture `with-icon-and-action`, viewport 1280). `[T5] empty-state: AT-4 ...`.

### Acceptance

Section 0.6 with `<id>` = `empty-state`. `ls components/empty-state/fixtures | wc -l` prints `4`. `grep -c "<svg" components/empty-state/fixtures/unknown-icon.html` prints `0`. `pnpm test:component --component=icon --no-skips` still passes.

### Out of scope

Empty states of specific components (cart, search); they compose this one later.

### If blocked

MB-5 rejects `icon`: generator defect (M2-R13a). An embed whose prop value is an enum without default prints an icon for an unknown name: generator defect, M2-R11.

---

## M2-T24 Rating (`rating`)

- **Goal:** Ship Rating, the read-only star display with half steps.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 11 kB), plus `docs/03-styling-and-tokens.md` `## 10. Logical properties and right-to-left` (3 kB).

### Files

Create: `components/rating/rating.json`, `rating.css`, `rating.test.ts`, style snapshots. Generated: fixtures (17 files), html, react, remix, `liquid/blocks/rating.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T24-rating`. Recipe S.
2. After `pnpm gen`, open `components/rating/react/rating.tsx` and read how `value` is typed and normalised (trap). Section 0.6, PLAN 5.0.

### Names and values

- Root `span.rp-rating` with `data-value` and `data-size`; first child `<span class="rp-rating-stars" role="img" aria-label="...">` (part `stars`, `authoredBy: "component"`, always printed, empty); then the slot (optional count text).
- `value`: ENUM of the strings `0 0.5 1 1.5 2 2.5 3 3.5 4 4.5 5`, default `0`, attribute `data-value`. A value outside the list prints `data-value="0"`. `value` is NOT a schema setting although it is an enum with a default: give it `"surface": "param"`.
- `size` (`sm md lg`, default `md`). `ariaLabel` REQUIRED; it is printed on the stars part, not on the root.
- Fixtures: the 6 of the table (`default`, `with-count`, `small-whole`, `class`, `invalid-enum-falls-back`, `escaping`), then 11 family fixtures (M2-R10): `value-0`, `value-0-5`, `value-1`, `value-1-5`, `value-2`, `value-2-5`, `value-3`, `value-3-5`, `value-4`, `value-4-5`, `value-5`, each `{ "props": { "value": "<value>", "ariaLabel": "<value> out of 5 stars" }, "generated": "template" }` with no `children`. Total 17. Prop values are strings.
- No manifest rules. Schema settings: `size`. Locale keys in `locales/en.default.json`: none (M2-R8).
- CSS: the fill is selected by attribute selectors on `data-value`; the data-URI `mask-image` is accepted by the CSS linter (ledger D-105 item 2). Do NOT apply "Fallback (SPIKE-06)".
- Trap (Plan reading PR-7): the spec's Host notes say the React prop is `value?: number | RatingValue` and the binding prints `String(value)`. Fixture props cannot carry the number form. When the generated React binding does not accept a number (the guard compares the raw value with the string list), do NOT hand-write the binding: add one line under `## Ledger issues` of `docs/09-components-foundation.md` (`Rating: the generated React binding does not accept value as a number`) and the same sentence in the done file.

### Tests

AT-1 comment. `[T5] rating: AT-2 ...` (the 11 `value-*` fixtures: computed `--_fill` equals `value * 20` percent; stars part 80 by 16 px for `size="md"`). `[T5] rating: AT-3 ...` (screenshot of fixture `with-count`, and again with `{ dir: "rtl" }`). `[T3] rating: AT-4 ...` (`ariaSnapshot` of `with-count`: an image named `4.5 out of 5 stars` followed by the text `(128)`). `[T2] rating: AT-5 ...` (reads fixture files `with-count`: `data-value="4.5"`, and `invalid-enum-falls-back`: `data-value="0"`; the React and Liquid halves for these string values are generic conformance; the React NUMBER form is covered only when the trap above did not fire: then add `[T2] rating: AT-5 react accepts a number` using `react-dom/server` `renderToString` on the binding imported from `components/rating/react/rating.tsx`).

### Acceptance

Section 0.6 with `<id>` = `rating`. `ls components/rating/fixtures | wc -l` prints `17`. `grep -c 'data-value="0"' components/rating/fixtures/invalid-enum-falls-back.html` prints `1`.

### Out of scope

An interactive rating input. Reviews (non-goal). Rounding inside the binding (the caller rounds).

### If blocked

Default path; the trap above is recorded, not fixed.

---

## M2-T25 SkipLink (`skip-link`)

- **Goal:** Ship SkipLink, the first focusable link that jumps to `<main id="main">`.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 8 kB), plus `docs/03-styling-and-tokens.md` `## 10. Logical properties and right-to-left` (3 kB).

### Files

Create: `components/skip-link/skip-link.json`, `skip-link.css`, `skip-link.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/skip-link.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T25-skip-link`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `a.rp-skip-link`; prop `href` (url) with default `#main`, always printed. The link text is children (required); the component ships NO locale key for the text.
- SkipLink does NOT take `span` or `hidden` (exception to FC-2).
- Fixtures (4): `default`, `custom-target`, `class`, `escaping` (`href` is `#Say "hi" & <go>`).
- No manifest rules. Schema settings: none. Locale keys in `locales/en.default.json`: none (M2-R8).
- Generic test note: the link is off-screen until focused. If a generic box test (CA-5, CA-8 or CA-9 of `docs/09-components-foundation.md` section 0.3) fails for this reason, do not change the harness: add one line under `## Ledger issues` at the end of `docs/13-testing.md` (`SkipLink: generic test <test name> fails because the link is off-screen until focused; the spec lists no exception`), open a draft pull request that names the failing test, and stop (the spec gap is still open).

### Tests

All four on M2-R22 pages whose body is the `default` fixture file followed by `<main id="main" tabindex="-1"><p>Content</p></main>`. AT-1 comment. `[T5] skip-link: AT-2 ...` (before any key: bounding box bottom is at most 0; after one `Tab`: the link has focus, is inside the viewport, top and inline-start offsets 8 px). `[T5] skip-link: AT-3 ...` (`Tab`, `Enter`: `location.hash` is `#main`; `document.activeElement` is the `main` element). `[T5] skip-link: AT-4 ...` (same page with `<html lang="en" dir="rtl">`: the right edge is 8 px from the viewport's right edge). `[T5] skip-link: AT-5 ...` (`scrollWidth` equals `clientWidth` before and after focus).

### Acceptance

Section 0.6 with `<id>` = `skip-link`. `ls components/skip-link/fixtures | wc -l` prints `4`. `grep -c 'href="#main"' components/skip-link/fixtures/default.html` prints `1`.

### Out of scope

The `layout` blueprint and its key `ripple.blueprints.layout.skip` (M7). A checker rule for the target id.

### If blocked

See "Generic test note".

---

## M2-T26 Announcer (`announcer`)

- **Goal:** Ship Announcer, the empty live region placed inside a dialog or an `rp-*` root.
- **Depends on:** M1-T01, M1-T02, M1-T46.
- **Kind / recipe:** `static`, tier `block`; recipe S. Path: generated.
- **Read first:** standard list (spec 8 kB), plus `docs/04-elements.md` `### 3.5 ` (the complete `src/runtime/announcer.ts`, 3 kB); `docs/13-testing.md` `### 9.1 ` (how a `[T4]` test renders React, 3 kB); `src/check/rules/RP113.test.ts` (repository).

### Files

Create: `components/announcer/announcer.json`, `announcer.css`, `announcer.test.ts`, style snapshots. Generated: fixtures, html, react, remix, `liquid/blocks/announcer.liquid`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T26-announcer`. Recipe S.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root `<div class="rp-announcer" role="status" data-rp-part="status"></div>`: literal `role` and literal hook attribute, printed empty. Content model `none`; the React binding has no `children`.
- Announcer does NOT take `span` or `hidden`.
- Fixtures (2): `default`, `class`.
- Rule (1): `announcer-needs-container` (kind `requires-ancestor`, selector `:scope`, target `dialog, rp-dialog, rp-cart, rp-product-form, rp-live, rp-predictive-search, rp-recommendations, rp-quantity, rp-carousel, rp-navigation-menu`; Message and Fix in the spec).
- Schema settings: none. Locale keys in `locales/en.default.json`: none (M2-R8).
- CSS: visually hidden but rendered (1 by 1 px, `display` not `none`). The selector is `.rp-announcer` only: CSS MUST NOT select `data-rp-part`.
- `kind` stays `static` and `agent.surface` stays `accessibility-tree`: the component has no custom element. The runtime (`announce()`) writes the text after load; no attribute is written.

### Tests

AT-1 comment. `[T2] announcer: AT-2 ...` (fixture files: `role="status"`, `data-rp-part="status"`, no child nodes). `[T5] announcer: AT-3 ...` (box 1 by 1 px; `display` not `none`). `[T3] announcer: AT-4 ...` (M2-R22 page: `<dialog id="d"><button id="b" type="button">x</button>` + the `default` fixture file + `</dialog>`; open with `showModal()`; in `page.evaluate` import `announce` from `/ripple.elements.js` (it is re-exported by `src/elements/index.ts`; confirm with `grep -n announce src/elements/index.ts`) and call `announce("Added to cart", { from: document.getElementById("b") })`; wait with `page.waitForFunction` until the fixture root's `textContent` is `Added to cart`; no other element with `role="status"` or `aria-live` contains that text). `[T4] announcer: AT-5 ...` (mechanics of `docs/13-testing.md` section 9.1: React server render of `<Announcer />` inside a parent component, hydrate, write text into the element as `announce()` does, re-render the parent; the text remains and no hydration warning is logged). `// AT-6: generic (the [T1] rule tests in this file)`; rule tests: one failing sample (the `default` fixture as a direct child of `<body>`), and passing samples inside `<dialog>` and inside `<rp-cart>` (3 tests plus the default-fixture test; the default fixture alone VIOLATES the rule, so the test `[T1] announcer: default fixture reports no RP113` wraps it in `<dialog>`, as ledger D-134 item 23 requires for a `requires-ancestor` rule).

### Acceptance

Section 0.6 with `<id>` = `announcer`. `ls components/announcer/fixtures | wc -l` prints `2`. `grep -c "data-rp-part" components/announcer/announcer.css` prints `0`.

### Out of scope

Page-level live regions (created by the runtime). Changing `src/runtime/announcer.ts`. Checker rule RP303 (M4; its case (b) does not report an empty `rp-announcer` or `role="status"` element, ledger D-134 item 27).

### If blocked

- `announce` is not exported by the browser file: draft pull request naming `src/elements/index.ts` (`docs/04-elements.md` section 4.1 fixes its text).
- The generic checker run over fixtures reports `announcer-needs-container` for the bare fixture: the fixture is a fragment; record it in the pull request and do not change the fixture.

---

## M2-T27 Breadcrumb (`breadcrumb`)

- **Goal:** Ship Breadcrumb, the `nav` with an ordered list of links and chevron separators.
- **Depends on:** M1-T01, M1-T02, M1-T03, M1-T46.
- **Kind / recipe:** `static`, tier `parts`; recipe S. Path: generated. Size M.
- **Read first:** standard list (spec 11 kB), plus `docs/02-html-contract.md` `### 11.3 Meaning of each key` (3 kB); `docs/03-styling-and-tokens.md` `## 10. Logical properties and right-to-left` (3 kB); `src/check/rules/RP113.test.ts` (repository).

### Files

Create: `components/breadcrumb/breadcrumb.json`, `breadcrumb.css`, `breadcrumb.test.ts`, style snapshots. Generated: fixtures, html, `react/breadcrumb.tsx` (exports `Breadcrumb`, `BreadcrumbItem`; imports `Icon` from `./icon`), `remix/breadcrumb.tsx`, `liquid/blocks/breadcrumb.liquid`, `liquid/blocks/breadcrumb-item.liquid`. Change: `locales/en.default.json` (`ripple.breadcrumb.label` = `Breadcrumb`); `components/icon/icon.json` ONLY when its `liquid.embeddedBy` does not list `breadcrumb` yet (M2-R9; M1-T03 normally wrote it).

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T27-breadcrumb`. Recipe S with a root template and one author part template.
2. Section 0.6, PLAN 5.0.

### Names and values

- Root template: `<nav class="rp-breadcrumb" aria-label="..."><ol class="rp-breadcrumb-list">SLOT</ol></nav>`. `ariaLabel` default `{ "t": "ripple.breadcrumb.label" }` (English `Breadcrumb`).
- Parts:

  | Part | `authoredBy` | Element | Class | Props |
  |---|---|---|---|---|
  | `list` | `component` | `ol` | `rp-breadcrumb-list` | |
  | `item` | `author` (`multiple: true`, `parent: "list"`) | `li` | `rp-breadcrumb-item` | `href` (the spec's Props table gives type and required), `current` (boolean) |
  | `link` | `component`, `parent: "item"` | `a` | `rp-breadcrumb-link` | |
  | `separator` | `component`, `parent: "item"` | `svg` | `rp-icon rp-breadcrumb-separator` | |

- Item template: `<li class="rp-breadcrumb-item"><a class="rp-breadcrumb-link" href [aria-current="page" when current]>SLOT</a>` then, when `current` is NOT true, the embedded Icon `chevron-right` with class `rp-breadcrumb-separator` (`{ "embed": "icon", "props": { "name": "chevron-right", "class": "rp-breadcrumb-separator" }, "when": { "not": { "true": "current" } } }`), then `</li>`.
- Fixtures (4), `parts` form: `default`, `three-levels`, `class`, `escaping`.
- Rules (3), copied from the spec with their Message and Fix: `breadcrumb-list-items-only` (kind `max-count`, selector `.rp-breadcrumb-list > *:not(.rp-breadcrumb-item)`, count `0`), `breadcrumb-one-current` (kind `max-count`, selector `.rp-breadcrumb-link[aria-current="page"]`, count `1`), `breadcrumb-needs-current` (kind `requires-descendant`, selector `:scope`, target `.rp-breadcrumb-link[aria-current="page"]`).
- Schema settings: none. Locale keys in `locales/en.default.json`: `ripple.breadcrumb.label` = `Breadcrumb` only (doc 09 section 0.5; M2-R8; `ripple.breadcrumb.name` and `ripple.breadcrumb.item_name` are generated); `dependencies.locale` lists `ripple.breadcrumb.label`.

### Tests

AT-1 comment. `[T2] breadcrumb: AT-2 ...` (every fixture file: separators equal items minus 1; the last `li` has no `svg`; exactly one `a[aria-current="page"]`, in the last `li`). `[T3] breadcrumb: AT-3 ...` (`ariaSnapshot` of `three-levels`: navigation `You are here`, a list of 3 items, each with one link). `[T5] breadcrumb: AT-4 ...` (links at least 24 px high; `three-levels` with `#rp-test-root` 160 px wide wraps, `scrollWidth` equals `clientWidth`). `[T5] breadcrumb: AT-5 ...` (`{ dir: "rtl" }`: the separator's computed `scale` is `-1 1`). `// AT-6: generic (test/conformance/conformance.test.ts)` (fixture `default` on the Liquid host prints `aria-label="Breadcrumb"`). Rule tests (4).

### Acceptance

Section 0.6 with `<id>` = `breadcrumb`. `ls components/breadcrumb/fixtures | wc -l` prints `4`. `ls components/breadcrumb/liquid/blocks | wc -l` prints `2`. `grep -o "rp-breadcrumb-separator" components/breadcrumb/fixtures/three-levels.html | wc -l` prints `2`.

### Out of scope

Deriving the trail from a Shopify resource. A current item that is not a link (the current item IS a link with `aria-current="page"`).

### If blocked

The generator cannot place an author part's markup inside a component-printed part (`ol`): the slot of the root template is inside the `ol` tag node; this is a defined form, M2-R11.

---

## M2-T28 Pagination (`pagination`)

- **Goal:** Ship Pagination: previous and next links built from URL props, or an override body.
- **Depends on:** M1-T01, M1-T02, M1-T46, M1-T10.
- **Kind / recipe:** `static`, tier `resource`; recipe C+R (PLAN kind `static/resource; C+R`): hand-written path (M2-R12, ledger D-139) plus recipe R (PLAN 5.7). Reason: "children, when not blank, replace the default body" is a condition on the children, which the template language does not have; the spec's Host notes start with the line "Binding paths (D-139)". Size M.
- **Read first** (this list replaces the standard list; about 58 kB):

  | File | Section | Size |
  |---|---|---|
  | `docs/components/pagination.md` | whole file | 14.3 kB |
  | `docs/09-components-foundation.md` | `### 0.1 ` to `### 0.5 ` (stop before `### 0.6 Icon set`), and `### 0.8 ` | 13.2 kB |
  | `docs/03-styling-and-tokens.md` | `### 7.2 File skeleton` | 3.5 kB |
  | `docs/13-testing.md` | `### 10.1 ` | 2.3 kB |
  | `docs/07-manifest-registry-cli.md` | `### 3.3 Generated regions inside hand-written files` | 4.5 kB |
  | repository (M1-T10) | `components/price/price.json`, `components/price/react/price.tsx`, `components/price/remix/price.tsx`, `components/price/liquid/snippets/rp-price.liquid` | about 12 kB |
  | repository | `components/button/button.json` (only its `liquid` key and `fixtures`), `components/button/fixtures/link.html`, `src/check/rules/RP113.test.ts` | about 8 kB |

  Do NOT read `docs/05-commerce.md` section 11.1: Pagination takes URL props, not a resource object (ledger section 8.1 row Pagination).

### Files

Create: `components/pagination/pagination.json`, `pagination.css`, `pagination.test.ts`, `components/pagination/fixtures/{default,both,labels,override,class,escaping}.html`, `components/pagination/react/pagination.tsx`, `components/pagination/remix/pagination.tsx`, `components/pagination/liquid/blocks/pagination.liquid`, style snapshots. Generated: `html/pagination.html`, the generated regions. Change: `locales/en.default.json` (`ripple.pagination.label` = `Pagination`, `ripple.pagination.previous` = `Previous`, `ripple.pagination.next` = `Next`); `components/button/button.json` only if its `liquid.embeddedBy` does not yet list `pagination` (M2-R9).

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T28-pagination`.
2. Manifest without `template`; `dependencies.embeds` and `dependencies.components`: `["button"]`; six fixtures `generated: "hand"`.
3. Fixture files: `default`, `both`, `labels`, `override` are the spec's fenced blocks. `class`: `default` with `class="rp-pagination custom-a custom-b"`. `escaping`: `default` with `aria-label="Say &quot;hi&quot; &amp; &lt;go&gt;"`.
4. `pnpm gen`; bindings below the generated regions; CSS; tests; section 0.6; PLAN 5.0.

### Names and values

- Root `nav.rp-pagination` with `aria-label` (prop `ariaLabel`, default locale key `ripple.pagination.label`).
- Props: `previousUrl`, `nextUrl` (type `url`), `ariaLabel`, `previousLabel` (default key `ripple.pagination.previous`), `nextLabel` (default key `ripple.pagination.next`). No resource object.
- Default body (children blank): when `previousUrl` is set, the previous part: the Button contract with `href`, `rel="prev"`, `variant="outline"`, `size="md"`, class `rp-button rp-pagination-previous`, text `previousLabel`; when `nextUrl` is set, the next part in the same way with `rel="next"` and class `rp-button rp-pagination-next`. Previous comes before next.
- Override body (children not blank): the root prints the children and neither part.
- Parts in the manifest: `previous` and `next` (`authoredBy: "component"`, element `a`, class `rp-button rp-pagination-previous` / `rp-button rp-pagination-next`), `current` (author-written inside an override body: element `span`, class `rp-pagination-current`; the spec's Anatomy row decides `authoredBy`; it has no TSX export and no Liquid file).
- React: `children` not `null`, `undefined`, `false` or `""` selects the override body. Defaults `previousLabel = "Previous"`, `nextLabel = "Next"`, `ariaLabel = "Pagination"` as default parameter values. The parts render `Button` imported from `./button` with `className="rp-pagination-previous"` (Remix: `./button.tsx`, `class`).
- Liquid (one file, no child blocks): `{% if content != blank %}{{ content }}{% else %}` default body `{% endif %}`; the default body is `{% render 'rp-button', href: previous_url, rel: 'prev', variant: 'outline', class: 'rp-pagination-previous', content: previous_label %}` when `previous_url != blank`, and the same for next. Label defaults use the `t` filter with the three keys.
- Rule (1): `pagination-current-not-link` (kind `max-count`, selector `a[aria-current]`, count `0`; Message and Fix in the spec).
- Schema settings: none. Locale keys in `locales/en.default.json`: the three of the Files line (doc 09 section 0.5; M2-R8; `ripple.pagination.name` is generated).
- `noJs.level` is `full` (build check MB-8 names `pagination`).

### Tests

AT-1 comment. `[T2] pagination: AT-2 ...` (fixture files `default`, `both`, `override`). `[T2] pagination: AT-3 ...` (fixture files `default`, `both`, `labels`: each `a`, after removing its part class token, equals after canonicalisation the literal `<a class="rp-button" href="<href>" rel="<rel>" data-variant="outline" data-size="md"><text></a>`, which is the shape of `components/button/fixtures/link.html` with these values). `// AT-4: generic (test/conformance/conformance.test.ts)` (fixtures `default` and `both` on the Liquid host print `Previous`, `Next` and `aria-label="Pagination"`). `[T3] pagination: AT-5 ...` (`ariaSnapshot` of `both`). `[T6] pagination: AT-6 ...` (M2-R22 page with the `both` fixture file, scripts disabled; click the next link; `page.url()` ends with `/collections/all?page=3`). `[T5] pagination: AT-7 ...` (fixture `override`: the current part is at least 44 by 44 px; `tabIndex` is `-1`). Rule tests (2).

### Acceptance

Section 0.6 with `<id>` = `pagination`. `ls components/pagination/fixtures | wc -l` prints `6`. `ls components/pagination/liquid/blocks | wc -l` prints `1`. `grep -c '"template"' components/pagination/pagination.json` prints `0`. `pnpm test:component --component=button --no-skips` still passes.

### Out of scope

Numbered pages in the default body (non-goal). In-place refresh (`rp-live`, M1-T28 and M4). The `paginate` Liquid object and the blueprints that pass it (M7). Hydrogen's `<Pagination>` render prop.

### If blocked

- The Liquid shim treats an empty block body as not blank: draft pull request naming `src/testing/liquid-shim.ts`.
- `pnpm gen` does not write generated regions for a hand-written `static` component: draft pull request naming the generator file.

---

## M2-T29 Checker family "usage": RP101 to RP105 (`src/check/rules/<RULE>.ts` and tests)

- **Goal:** Add the five usage rules RP101, RP102, RP103, RP104, RP105, each with a passing and a failing example.
- **Depends on:** M0-T43, M1-T01, M1-T46, M6-T28. M6-T28 provides `src/check/liquid-calls.ts`: RP102 and RP105 run only on layer S for Liquid, and the layer S half of RP101, RP103, RP104 reads `LiquidCall` records.
- **Kind:** `checker` (PLAN recipe 5.0; definition of done 3.1).

### Read first

| File | Section | Size |
|---|---|---|
| `docs/07-manifest-registry-cli.md` | `### 9.3 API and rule modules` | 6 kB |
| `docs/07-manifest-registry-cli.md` | `#### 9.5.1 Computing ` | 2 kB |
| `docs/07-manifest-registry-cli.md` | `### 9.6 Rules (complete list)`: the intro paragraphs and the rows RP101 to RP105 only | 3 kB |
| `docs/07-manifest-registry-cli.md` | `### 9.7 Implementation order and status` | 1 kB |
| `docs/08-agent-kit-and-evals.md` | `### 5.3 `, `### 5.4 Placeholders`, `### 5.5 Rule registry`: the text before the table, the rows RP101 to RP105, and the last note ("`bad` and `good` examples") | 6 kB |
| repository | `src/check/rules/RP113.ts`, `src/check/rules/RP113.test.ts`, `src/check/rules/index.ts`, `src/check/liquid-calls.ts` (exported types and function signatures only), `src/responsive.ts` (`parseResponsive`), `src/check/report.ts` (the signature of `computeFix` only) | 16 kB |

### Files

Create: `src/check/rules/RP101.ts`, `RP102.ts`, `RP103.ts`, `RP104.ts`, `RP105.ts` and `src/check/rules/RP101.test.ts`, `RP102.test.ts`, `RP103.test.ts`, `RP104.test.ts`, `RP105.test.ts`. Change: `src/check/rules/index.ts` (insert the five rules; ascending id order). MUST NOT change: `src/check/engine.ts`, `src/check/report.ts`, `src/check/index.ts`, `src/check/liquid-calls.ts`, any manifest.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T29-checker-usage`. Then `test -f src/check/liquid-calls.ts` (dependency M6-T28) and `grep -c "export function computeFix" src/check/report.ts` (prints `1`, task M0-T42) must both succeed.
2. Read the files of "Read first".
3. For each rule write `src/check/rules/<RULE>.ts` in the shape of `src/check/rules/RP113.ts`: the `Rule` object with `meta` (`id`; `severity`, `layers`, `hosts` from the row of 9.6; `title` = the first sentence of the "Detects" cell of 9.6; `why` = the `why` cell of doc 08 section 5.5), and the export `text: RuleText` (`problem` and `fix` copied from the row of doc 08 section 5.5; `bad` and `good` written by you: the smallest example that triggers the rule and the same example fixed).
4. Implement the functions per the table below. Diagnostics are built by filling the placeholders of doc 08 section 5.4 into `text.problem`; never print other wording. `fix` values come from section 9.5.1: call `computeFix` of `src/check/report.ts` (signature in `docs/plan/M0-bootstrap.md` section 0.5); do not re-implement Levenshtein or `FIX_SYNONYMS`.
5. Add the rules to `src/check/rules/index.ts`.
6. Tests, then PLAN 5.0.

### Names and values

| Rule | Sev | Functions | Detects (copy of `docs/07-manifest-registry-cli.md` 9.6; that table wins) |
|---|---|---|---|
| RP101 | error | `source` (Liquid), `html` (all hosts) | a value not in the prop's enumeration or scale. S: a literal `string` or `number` argument of a component call. H: the attribute named by `prop.attribute` on the element the template puts it on. Responsive values are tokenised with `parseResponsive` and each token's value is checked. Fix: 9.5.1 rules 1 to 3 |
| RP102 | error | `source` (Liquid) | an argument of a component call that is not a prop of that component and not `class`, `attributes`, `content`, `id`. Fix: the nearest prop name (Levenshtein at most 2), else `remove the argument` |
| RP103 | error | `source` (Liquid), `html` | responsive grammar errors reported by `parseResponsive` (two tokens for one breakpoint, an unknown breakpoint prefix, an empty token value); and in Liquid a scale prop passed as a `number` literal (`gap: 4`). Fix: 9.5.1 rules 4 and 5; `gap: '4'` |
| RP104 | error | `source` (Liquid), `html` | a prop with `required: true` is missing; or a root of a component with `root.requiresId` has no `id`; or an `id` that does not match `^[a-zA-Z][a-zA-Z0-9_-]*$`. Fix: `add <name>: '<example value from the first fixture>'` |
| RP105 | error | `source` (Liquid) | a boolean prop given a `string` literal. Fix: 9.5.1 rule 6 |

- Engine rules that bind every rule (9.3): scale steps come from `context.scales`, enumerations from `context.manifest`; responsive values are validated ONLY through `parseResponsive`; "root of component C" is an element whose class token list contains `C.root.class`.
- RP104 at layer H MUST NOT require an `id` attribute on a `.rp-field` root (the Field `id` is on the control; `docs/components/field.md`, "Checker rules"); at layer S it requires the `id` argument. Implement the exception by component id `field`.
- RP101 at layer H checks only attributes the manifest names through `prop.attribute`; props without `attribute` (`as`, `level`) are not checked.
- The "TC" marks of 9.6 (Theme Check) are M6-T30; ignore them here.

### Tests

Each `src/check/rules/<RULE>.test.ts` calls the rule's functions directly with a hand-built `RuleContext` and a hand-built manifest object defined in the test (the way `src/check/rules/RP113.test.ts` does), or with the Button entry loaded from `components/button/button.json` when a real component is simpler. Test names (N is the rule id):

- `[T1] N: bad example reports exactly one N diagnostic` (input: `text.bad`)
- `[T1] N: good example reports nothing` (input: `text.good`)
- one test per layer the rule has and per case of its "Detects" cell, named `[T1] N: <layer> <statement>`. Minimum set: RP101 `S enum`, `S scale`, `H enum`, `H responsive token`, `fix uses the synonym table` (`variant: 'outlined'` gives `variant: 'outline'`); RP102 `S unknown argument`, `S class attributes content id are accepted`; RP103 `S two tokens for one breakpoint`, `S unknown breakpoint`, `S number literal for a scale prop`, `H two tokens for one breakpoint`; RP104 `S missing required prop`, `H missing required id`, `H malformed id`, `H field root needs no id`; RP105 `S string for a boolean`, `fix for 'false'`.
- `[T1] N: meta matches the 9.6 row` (id, severity, layers, hosts literal in the test).

### Acceptance

- `pnpm test:unit --files=src/check/rules/RP101.test.ts` (and the same for RP102 to RP105) each report `0 failed`.
- `grep -c "RP10[1-5]" src/check/rules/index.ts` prints at least `5`.
- `pnpm ci` exits 0.

### Out of scope

The CLI command `ripple check` (M6-T23). Theme Check (M6-T30). The file `src/check/rules/meta.expected.json` and the K-31 test (M8-T01). Rule pages. Changing the tokeniser. Layers P and B.

### If blocked

- `src/check/liquid-calls.ts` or `computeFix` is missing although M6-T28 and M0-T42 are done: draft pull request naming the missing file or export.
- The engine does not fill `SourceFile.liquid`: not needed here; the tests pass `liquid: findLiquidCalls(text)` themselves. Note it in the done file for M6-T23.
- 9.6 and doc 08 section 5.5 disagree on severity or layers: 9.6 wins (stated in 5.5).

---

## M2-T30 Checker family "structure": RP110 to RP112, RP114 to RP118

- **Goal:** Add the eight structure rules RP110, RP111, RP112, RP114, RP115, RP116, RP117, RP118, each with a passing and a failing example.
- **Depends on:** M0-T43, M1-T17, M1-T46.
- **Kind:** `checker`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/07-manifest-registry-cli.md` | `### 9.3 API and rule modules` | 6 kB |
| `docs/07-manifest-registry-cli.md` | `### 9.6 Rules (complete list)`: the intro paragraphs and the rows RP110, RP111, RP112, RP114 to RP118 | 6 kB |
| `docs/07-manifest-registry-cli.md` | `### 9.7 Implementation order and status` | 1 kB |
| `docs/08-agent-kit-and-evals.md` | `### 5.4 Placeholders`, `### 5.5 Rule registry`: the text before the table, the same eight rows, the last note | 6 kB |
| `docs/07-manifest-registry-cli.md` | `### 5.1 Trailer format`: the table and the numbered rules only, not the `src/cli/trailer.ts` code block (RP117 case (c)) | 2 kB |
| `docs/07-manifest-registry-cli.md` | `### 6.1 ` (`ripple.json`, the `paths` keys; RP117 cases (b), (c)) | 2 kB |
| `docs/CONVENTIONS.md` | section 4 (the hook attribute list) | (already read) |
| repository | `src/check/rules/RP113.ts`, `RP113.test.ts`, `src/check/rules/index.ts`, `components/dialog/dialog.json` (only `root`, `parts[].class`, `parts[].elements`) | 12 kB |

### Files

Create: `src/check/rules/RP110.ts`, `RP111.ts`, `RP112.ts`, `RP114.ts`, `RP115.ts`, `RP116.ts`, `RP117.ts`, `RP118.ts` and the eight `src/check/rules/<RULE>.test.ts` files. Change: `src/check/rules/index.ts`. MUST NOT change: the engine, the report module, RP113, any manifest.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T30-checker-structure`.
2. One file per rule, in the shape of `src/check/rules/RP113.ts` (step 3 of M2-T29 describes `meta` and `text`).
3. Implement per the table below; add the rules to `src/check/rules/index.ts` in ascending id order (RP113 stays between RP112 and RP114).
4. Tests, then PLAN 5.0.

### Names and values

The "Detects" cells are those of `docs/07-manifest-registry-cli.md` section 9.6; read each row there and implement it literally. Facts a rule file needs in addition:

| Rule | Sev | Functions | Notes |
|---|---|---|---|
| RP110 | error | `html` | root class or part class on an element whose tag is not in `root.elements` (or the part's `elements`) |
| RP111 | error | `source`, `html` | (a) a class token or tag name that starts with `manifest.prefix.css` / `manifest.prefix.element` and is not in the manifest; (b) any tag starting with `ui-` that is not a key of `manifest.elements`. Layer S scans `.liquid`, `.html`, `.tsx`, `.jsx`, `.css` files for `class="..."`, `className="..."` literals, tag names and CSS class selectors. Fix: nearest manifest name (Levenshtein at most 2) |
| RP112 | error | `html`, `project` | see "RP112" below |
| RP114 | error | `html` | per document: a duplicate `id` among Ripple roots and their derived part ids; or a part id that is not the derived id the template defines. Derived suffixes: CONVENTIONS section 5 |
| RP115 | error | `html` | `role` of `dialog alertdialog tablist menu menubar listbox slider radiogroup toolbar tree combobox` on an element not inside a Ripple root. `role="switch"` on `input[type=checkbox]` is allowed everywhere and MUST NOT be reported (`docs/components/switch.md`). The role-to-component mapping of the `fix` is in the RP115 row of doc 08 section 5.5 |
| RP116 | warning | `source`, `html` | inside a Ripple root: an inline `style` containing `color`, `background` or `border-color` with a literal colour; or a class token matching `/^(bg|text|border|fill|stroke)-\[(#|rgb|hsl|oklch)/` |
| RP117 | warning | `source` (hosts `html`, `react`, `remix`) | see "RP117" below |
| RP118 | error | `html` | (a) `data-state` inside a Ripple root; (b) an attribute starting `data-rp-` that is not allowed; (c) a `data-rp-field` value outside `merchandise-id quantity line-id selling-plan note discount-code`, a `data-rp-js` value outside `inflow overlay fallback` |

- RP118: export the constant `HOOK_ATTRIBUTES` from `src/check/rules/RP118.ts` with exactly `data-rp-part`, `data-rp-field`, `data-rp-line`, `data-rp-open`, `data-rp-close`, `data-rp-refresh`, `data-rp-region`, `data-rp-js`. The three names `data-rp-case`, `data-rp-fixture`, `data-rp-test-raw` are accepted ONLY in a file whose project-relative path has a directory segment named `test` or `.ripple-conformance`; in every other file and in every `--url` document they are reported.
- "Ripple root" and "inside a Ripple root": the vocabulary at the end of section 9.3.
- Project files (ledger D-142): `RuleContext.cwd` (a `string`, added by M0-T42; doc 07 section 9.3) is the project root. RP112 and RP117 resolve every path against it with `node:path` `join` and read files with `node:fs` (`existsSync`, `readFileSync`). Implement every case of both rows in full.
- RP112. (1) Hosts `html`, `react`, `remix` (layer H): for each element whose tag is a key of `manifest.elements`, find the component whose `dependencies.elements` contains the tag; when `context.lock` is not `null` and `context.lock.components` has no key for that component, report. When `context.lock` is `null`, the case reports nothing. (2) Host `liquid` (layer H): for each element whose tag is a key of `manifest.elements`, take `chunk` = `manifest.elements[tag].chunk`; the asset file is `assets/ripple.js` for chunk `main` and `assets/ripple-<chunk>.js` for `tabs`, `tooltip`, `toast` (`docs/07-manifest-registry-cli.md` section 4.4, Liquid table, rows `core/js` and `core/js:<chunk>`); report when `existsSync(join(context.cwd, "assets", <file>))` is false. Report each missing tag once per document. (3) When the type `ComputedLock` in `src/types.ts` does not expose `components`, cast inside the rule to `{ components: Record<string, unknown> }` and note it in the done file; do not edit `src/types.ts`.
- RP117. Case (a) (any scanned `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` file: an `import` or `from` specifier that is `@ui-sdk/react`, starts with `@ui-sdk/core/internal/`, or starts with `<pkg>/dist/`, where `<pkg>` is `PKG_NAME` from `src/identity.ts`): a regular expression for import specifiers (layer S does not parse JSX). Cases (b) and (c): read `join(context.cwd, "ripple.json")` once per check run and take `paths.components` and `paths.pages` (doc 07 section 6.1). When `ripple.json` does not exist (a Liquid theme has none; the rule's hosts are `html`, `react`, `remix`), cases (b) and (c) report nothing; the spec is silent on this case (owning doc: doc 07 section 9.6), so name it in the done file. A file is "under" a path when its project-relative path starts with that path followed by `/`. Case (b): the seven allowed value imports and the `import type` exceptions are in the 9.6 row; copy the list from there. Case (c): a file "carries a Ripple trailer" when its last non-empty line matches the `.ts`, `.tsx`, `.js` trailer form of doc 07 section 5.1, `/* ripple <id> <pkg>@<version> sha256:<64 hex> */`; write that regular expression in the rule (`src/check` MUST NOT import `src/cli/trailer.ts`; doc 07 section 9.3).

### Tests

Same convention as M2-T29 (hand-built context and manifest, or the Button and Dialog entries loaded from `components/`). For each rule N: `[T1] N: bad example reports exactly one N diagnostic`, `[T1] N: good example reports nothing`, `[T1] N: meta matches the 9.6 row`, plus one test per lettered case of the row. Minimum extra tests: RP111 `H rp-buton suggests rp-button`, `H unknown ui- tag`, `S class literal in a liquid file`; RP112 `H tag of a component missing from the lock`, `H null lock reports nothing`, `H liquid chunk asset missing from assets`, `H liquid chunk asset present is accepted`; RP114 `duplicate root id`, `part id that is not the derived id`; RP115 `role dialog outside a Ripple root`, `role switch on a checkbox is accepted`, `role tablist inside a Ripple root is accepted`; RP116 `inline colour inside a Ripple root`, `arbitrary colour utility class`, `the same outside a Ripple root is accepted`; RP117 `@ui-sdk/react`, `@ui-sdk/core/internal/x`, `import type from @shopify/hydrogen is accepted`, `value import from @shopify/hydrogen under paths.components`, `allowed value import formatMoney is accepted`, `elements import in a file with a Ripple trailer`, `no ripple.json reports nothing for cases b and c`. Tests that need project files write them to a directory made with `mkdtempSync(join(tmpdir(), "rp-check-"))` and pass it as `cwd`; RP118 `data-state inside a Ripple root`, `unknown data-rp- attribute`, `data-rp-js value`, `data-rp-fixture under a test directory is accepted`, `data-rp-fixture elsewhere is reported`.

### Acceptance

- `pnpm test:unit --files=src/check/rules/RP110.test.ts` (and the same for the other seven) each report `0 failed`.
- `grep -c "RP11[0-8]" src/check/rules/index.ts` prints at least `9` (the eight new rules and RP113).
- `grep -c "HOOK_ATTRIBUTES" src/check/rules/RP118.ts` prints at least `1`.
- `pnpm ci` exits 0.

### Out of scope

RP113 (M0-T43; do not edit it). The CLI command, `scanProject` and the computed lock (M6). `meta.expected.json` (M8-T01). Layer B.

### If blocked

- `RuleContext` in `src/check/index.ts` has no `cwd` field: M0-T42 did not add it (ledger D-142). Draft pull request naming `src/check/index.ts` and D-142; do not add the field in this task.
- `components/dialog/` does not exist: the dependency M1-T17 is not done; do not start.

---

## M2-T31 Checker family "accessibility": RP201 to RP204

- **Goal:** Add the four static accessibility rules RP201, RP202, RP203, RP204, each with a passing and a failing example.
- **Depends on:** M0-T43, M1-T17, M1-T46.
- **Kind:** `checker`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/07-manifest-registry-cli.md` | `### 9.3 API and rule modules` | 6 kB |
| `docs/07-manifest-registry-cli.md` | `### 9.6 Rules (complete list)`: the intro paragraphs and the table "Accessibility (static)" (rows RP201 to RP204) | 3 kB |
| `docs/07-manifest-registry-cli.md` | `### 9.7 Implementation order and status` | 1 kB |
| `docs/08-agent-kit-and-evals.md` | `### 5.4 Placeholders`, `### 5.5 Rule registry`: the text before the table, the rows RP201 to RP204, the last note | 5 kB |
| repository | `src/check/rules/RP113.ts`, `RP113.test.ts`, `src/check/rules/index.ts`, `components/icon-button/icon-button.json` and `components/image/image.json` (only the `a11y` and `root` keys) | 10 kB |

### Files

Create: `src/check/rules/RP201.ts`, `RP202.ts`, `RP203.ts`, `RP204.ts` and the four `src/check/rules/<RULE>.test.ts` files. Change: `src/check/rules/index.ts`.

### Steps

1. The first block of PLAN 5.0 with the branch `task/M2-T31-checker-a11y`.
2. One file per rule in the shape of `src/check/rules/RP113.ts` (`meta`, `text`, the `html` function). All four are severity error, layer H, all hosts.
3. Add them to `src/check/rules/index.ts` after RP118, ascending.
4. Tests, then PLAN 5.0.

### Names and values

| Rule | Detects (copy of 9.6; that table wins) | Fix |
|---|---|---|
| RP201 | a root of a component whose `a11y.name.required` is `always` has no accessible name; or is `when-no-text` and has neither text content nor a name. Name sources, in order: `aria-labelledby` pointing at an existing non-empty element, non-empty `aria-label`, the part named in `a11y.name.sources`, non-whitespace text content, `alt` of a descendant `img`, `title` of a descendant `svg` | `add ariaLabel (Liquid: aria_label), or visible text` |
| RP202 | inside a root of `field`: an `input` (not `type="hidden"`), `select` or `textarea` with no `label[for=<its id>]` in the document and no ancestor `label` | `add a Label part with for="<id>"` |
| RP203 | a root of `image` without an `alt` attribute (empty `alt=""` is allowed), or without both `width` and `height` | the missing attributes |
| RP204 | an element that is `rp-dialog`, `dialog`, `ui-tooltip`, or carries the `popover` attribute, with an ancestor `a[href]` or `button` | `move the overlay outside the link or button; keep only the opener inside` |

- The printed `problem` and `fix` wording is that of doc 08 section 5.5 (it wins over the "Fix" column above for wording).
- RP202 reads the component id `field`. The rule MUST work when the manifest has no `field` component yet (M2-T17 may not be merged): then it finds no root and reports nothing. Its tests use a hand-built manifest that contains a `field` entry with `root.class` `rp-field`.
- RP201 reads `a11y.name` from the manifest of each component; a component without that key is skipped.

### Tests

For each rule N: `[T1] N: bad example reports exactly one N diagnostic`, `[T1] N: good example reports nothing`, `[T1] N: meta matches the 9.6 row`. Minimum extra tests: RP201 `always: no name`, `always: aria-label is a name`, `always: aria-labelledby to an empty element is not a name`, `when-no-text: text content is enough`; RP202 `input without label`, `label for is accepted`, `ancestor label is accepted`, `hidden input is ignored`; RP203 `no alt`, `empty alt is accepted`, `width without height`; RP204 `dialog inside a link`, `popover element inside a button`, `dialog next to its opener is accepted`.

### Acceptance

- `pnpm test:unit --files=src/check/rules/RP201.test.ts` (and RP202, RP203, RP204) each report `0 failed`.
- `grep -c "RP20[1-4]" src/check/rules/index.ts` prints at least `4`.
- `pnpm ci` exits 0.

### Out of scope

Layer B accessibility (RP605, RP609; M6). The axe scan (`test/a11y/axe.test.ts`). Any accessibility rule that is not one of the four ids.

### If blocked

- The manifest type has no `a11y.name.sources` or `a11y.name.required`: read `src/gen/schema/manifest.schema.json` (search `"a11y"`); the schema wins over this file. If the schema lacks them, draft pull request naming `docs/07-manifest-registry-cli.md` section 1.2.
- `components/dialog/` does not exist: the dependency M1-T17 is not done; do not start.

---

## M2-T32 M2 gate

- **Goal:** Prove the M2 gate row of `docs/PLAN.md` section 4.2 on `main` and record the result.
- **Depends on:** M2-T01 to M2-T31 (every `docs/plan/done/M2-T<nn>.md` exists).
- **Kind:** `gate` (PLAN 3.5). No source change.
- **Read first:** `docs/PLAN.md` section 4.2 (row M2), section 3.5, section 4.4.

### Files

Create: `docs/plan/done/M2-T32.md`. Nothing else.

### Steps

1. `ls docs/plan/done/ | grep -c "^M2-T"` MUST print `31` before this task writes its own file.
2. On a clean checkout of `main` (`git status --porcelain` prints nothing), after the export lines of PLAN 5.0 (Node 24.22.3 and `RIPPLE_NETWORK=1`, section 0.6): `pnpm install --frozen-lockfile`, then `pnpm ci`. It MUST exit 0 and its last runner line MUST report `0 failed, 0 skipped`. Record the last line.
3. The 37 components of `docs/09-components-foundation.md` are present and `stable`. Run:

```bash
for id in container stack inline grid card separator heading text rich-text link image video icon placeholder button icon-button field label input textarea select checkbox radio-group switch form-message badge banner spinner skeleton progress empty-state rating skip-link visually-hidden announcer breadcrumb pagination; do
  test -f "components/$id/$id.json" || echo "MISSING $id"
  grep -q '"status": *"stable"' "components/$id/$id.json" || echo "NOT STABLE $id"
  test -f "components/$id/$id.test.ts" || echo "NO TEST $id"
done
```

   It MUST print nothing. (The list has 37 ids.)
4. The 18 rule ids each have a rule file, a test file with a passing and a failing example, and an entry in the index. Run:

```bash
for r in RP101 RP102 RP103 RP104 RP105 RP110 RP111 RP112 RP113 RP114 RP115 RP116 RP117 RP118 RP201 RP202 RP203 RP204; do
  test -f "src/check/rules/$r.ts" || echo "MISSING $r"
  grep -q "bad example reports exactly one $r diagnostic" "src/check/rules/$r.test.ts" 2>/dev/null || test "$r" = RP113 || echo "NO FAILING EXAMPLE $r"
  grep -q "good example reports nothing" "src/check/rules/$r.test.ts" 2>/dev/null || test "$r" = RP113 || echo "NO PASSING EXAMPLE $r"
  grep -q "$r" src/check/rules/index.ts || echo "NOT IN INDEX $r"
done
pnpm test:unit --files=src/check/rules/
```

   The loop MUST print nothing and the test command MUST report `0 failed`. (RP113 is M0-T43; its test names differ, which the loop allows.)
5. The nine custom rules exist. Run:

```bash
grep -c "CUSTOM_RULES" src/check/rules/RP113.ts
for r in field-one-control field-label-for field-describedby field-invalid radio-group-legend radio-group-one-name radio-group-one-checked rich-text-plain-html video-needs-source; do
  grep -q "$r" src/check/rules/RP113.ts || echo "NO FUNCTION $r"
  test "$(grep -l "\"$r\"" components/*/*.json | wc -l)" -eq 1 || echo "NOT IN EXACTLY ONE MANIFEST $r"
done
```

   The first command prints at least `1`; the loop MUST print nothing.
6. Write `docs/plan/done/M2-T32.md`: the output summary of steps 2 to 5; every M2 task with its pull request number (from each `docs/plan/done/M2-T<nn>.md`); every "pending" or "Ledger issues" note found in those done files, copied verbatim (for example Heading AT-2, Rating number form, Video mask, the RP117 no-`ripple.json` note, the D-139 hand-written components).
7. Commit `M2-T32: M2 gate` on branch `task/M2-T32-gate`, pull request in the form of PLAN section 2.

### Acceptance

Steps 1 to 5 print what they require. `test -f docs/plan/done/M2-T32.md` succeeds. `grep -o 'M2-T[0-3][0-9]' docs/plan/done/M2-T32.md | sort -u | grep -vc 'M2-T32'` prints `31`.

### Out of scope

Fixing anything. A gate fails when any command fails: name the failing task in a draft pull request and stop (PLAN 3.5).

### If blocked

- Node 24.22.3 cannot be installed on this machine (section 0.6): run `pnpm typecheck && pnpm gen --check && pnpm build && pnpm examples:install && pnpm test` instead of `pnpm ci`; it MUST report `0 failed` and every skip reason MUST start with `Remix needs Node 24.3 or later` or be `RIPPLE_NETWORK is not 1`. Copy the skip lines into the done file and give the run of the `verify` CI job on `main` (Node 24) as the proof of `0 skipped` (ledger D-136).
- Any other failure: the gate fails (PLAN 3.5).
