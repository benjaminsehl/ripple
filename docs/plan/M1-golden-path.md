# M1 Golden path vertical slice and local spikes: task detail

Status: detail file for the 47 rows of milestone M1 in `docs/PLAN.md` section 6 (M1-T01 to M1-T47). `docs/00-decisions.md` (the ledger) wins over every spec; a spec wins over this file. This file adds no API. Where it fixes a process choice the specs leave open, the choice is marked "Plan reading" and is repeated in section 0.8; ledger D-146 ratified these readings, and where a decision of ledger section 13.5 now states the rule, this file cites the decision id. The task table of PLAN section 6 is the only source of task order: this file never tells a session to do another task first.

How to use: read `AGENTS.md`, `docs/CONVENTIONS.md`, `docs/PLAN.md` sections 1 to 3 and the recipe of your task's kind (PLAN section 5), then section 0 of this file, then ONLY your task's section `## <task id>`. Tasks M1-T31 to M1-T38 also read the short section `## Rules for the commerce component tasks M1-T31 to M1-T38`. Do not read other task sections.

Contents: 0 Rules for every M1 task. Then one section per task, M1-T01 to M1-T47, in table order. One extra rules section (M1-R20 to M1-R24) stands before M1-T31.

---

## 0. Rules for every M1 task

### 0.1 Finding what to read

- **M1-R1** The spec files are large and are edited between sessions. Never use a line number. Find a section by searching for its heading text exactly as this file prints it (for example search `### 8.4 ` in `docs/04-elements.md`), and read up to the next heading of the same or a higher level.
- **M1-R2** "Read first" lists are complete. Read nothing else unless a command fails and its message names another file. Budget (PLAN section 1 item 4): a task's "Read first" list is at most about 60 kB; `AGENTS.md`, `docs/CONVENTIONS.md`, PLAN sections 1 to 3 and 5, and section 0 of this file are not counted. A size is in kB of 1,000 bytes, measured on 2026-11-22 from the heading line to the next heading of the same or a higher level (or the whole file).
- **M1-R3** A component id maps to its spec `docs/components/<id>.md`. Its section order is fixed (PLAN 5.1 item 2). "the spec" in a component task means that file.

### 0.2 Values every M1 task uses

| Thing | Value | Source |
|---|---|---|
| Manifest `since` | `"0.1.0"` | `docs/07-manifest-registry-cli.md` sections 1.7.1 to 1.7.3; `VERSION` in `src/identity.ts` |
| Manifest `status` | `"stable"` for kinds `static` and `native`; `"beta"` for kind `commerce` | PLAN 3.2 |
| Render hosts | `html`, `react`, `remix`, `liquid` (Liquid means the shim of `src/testing/liquid-shim.ts`) | CONVENTIONS 1 |
| Bring-up mode | `BRINGUP_SUBSET` is `true`; `pnpm gen --check` accepts a subset of the 84 ids; MB-1 ignores entries that name a component not present yet | PLAN 4.4, ledger D-135 |
| Branch | `task/<task id>-<slug>`; the slug is given in each task's Steps | PLAN 2 |
| Test name | `[T<tier>] <subject>: <ID> <statement>`. When this file writes a name as a prefix followed by `...`, the name starts with that prefix and the rest is one sentence that states the acceptance item; a full name is used exactly | `docs/13-testing.md` section 2.4 (N-1); ledger D-141 (2) |
| Test style | flat `test()` from `node:test`; `openPage()` per test, closed in `finally`; no fixed delays except where a spec states a duration; last assertion `assert.deepEqual(opened.errors, [])` | `docs/13-testing.md` section 2.5 (W-1 to W-8) |

The slice is 21 components: `button stack icon icon-button link form-message visually-hidden image placeholder price quantity-input dialog drawer add-to-cart-button checkout-button product-form cart-link cart-line cart-summary cart-lines cart-drawer`.

Node and network (every M1 task; `docs/PLAN.md` section 3.1). Node 24 (ledger D-136, `docs/PLAN.md` section 3.1). `pnpm test --no-skips` needs Node 24.3 or later, because Remix needs it (rule T-7). Install once per machine, and repeat the two `export` lines in every new shell:

```bash
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"
pnpm env use --global 24.22.3
node --version   # prints v24.22.3
```

When that install fails, run each `--no-skips` command without `--no-skips`, check that every skip reason starts with `Remix needs Node 24.3 or later`, list the skip lines in the pull request; the `verify` CI job (Node 24) is the proof.

From task M1-T15 on, export `RIPPLE_NETWORK=1` before `pnpm ci`: the Remix morph tests start the npm example `examples/remix` with `startExample` and skip otherwise (doc 13 rule T-5). Without network access, run without `--no-skips`, list the skips (reason `RIPPLE_NETWORK is not 1`), and `verify` is the proof.

### 0.3 Component tasks: what "apply recipe X" means here

A component task says "Recipe: S" (or N, C, C+R). Do every step of that recipe in `docs/PLAN.md` section 5, in order. This file then lists only: the facts of the spec's field table, the files, the fixture names, the test ids, and the traps. Rules:

- **M1-R4** The spec's "HTML contract" section is the oracle. Every fixture name this file lists MUST exist as a manifest `fixtures[]` record with a file `components/<id>/fixtures/<name>.html`, `default` first. If this file and the spec list different fixtures, the spec wins; note it in the pull request.
- **M1-R5** Manifest values (`props[]`, `parts[]`, `state[]`, `rules[]`, `upgradeAllow[]`, `noJs`, `a11y`, `agent`, `dependencies`, `liquid`) are copied from the spec sections Props, Anatomy, State and attributes, Checker rules, Behaviour without JavaScript, Accessibility, Agent surface, Host notes. Use only key names of CONVENTIONS section 15 last-but-one bullet (ledger section 4.8). When the spec does not give a value a REQUIRED manifest key needs, stop and follow PLAN section 1 ("never invent"): record it under `## Ledger issues` of the owning group doc.
- **M1-R6** Locale keys: add to `locales/en.default.json` only the `ripple.<id>.*` keys of strings a binding prints, as the spec's Props table (default column), Host notes or Accessibility section names them. Never add the schema name keys `ripple.<id>.name` and `ripple.<id>.<part>_name`, even when a Host notes line says "Locale keys: `ripple.<id>.name`": `pnpm gen` (step G5) writes them into `components/<id>/liquid/locales/<id>.json` (ledger D-134 item 29, `docs/09-components-foundation.md` section 0.5). Do not add `ripple.props.*` keys: the generator writes them. A component whose bindings print no string of their own adds no key.
- **M1-R7 Acceptance coverage (ledger D-141 (3)).** `components/<id>/<id>.test.ts` MUST contain, for every numbered item `n` of the spec's "Acceptance tests", a test whose name contains `AT-<n> `, or a line `// AT-<n>: generic (<files>)` when the generic matrix proves the item, or a line `// AT-<n>: covered by <task id> (<file>: <test name or id>)` when a test in another file (written by an earlier or a later task) proves it (`docs/13-testing.md` sections 10.1 and 18.2). Use the comment forms in exactly these cases, with exactly these file names:

  | The item needs | Line to write |
  |---|---|
  | only generic tiers (CA-1 to CA-9; "T2 fixtures are canonical-equal"; "T3 zero mutations"; hydration in both script orders) | `// AT-<n>: generic (test/conformance/conformance.test.ts, test/upgrade/upgrade.test.ts, test/hydration/react.test.ts, test/nojs/render.test.ts)` listing only the files that apply |
  | tier 9 ("T9: tests a, b pass in WebKit and Gecko") | `// AT-<n>: generic (pnpm test:webkit and pnpm test:firefox re-run AT-<a>, AT-<b>)`; and the named `[T5]`/`[T6]` tests MUST NOT carry `[chromium]` |
  | tier 7 or mock.shop | `// AT-<n>: covered by M7-T26 (test/commerce/e2e.test.ts: E2E-<k>)` with the E2E id the task section gives; when the same item also names tier 5 or tier 6 against the local stub server or the Liquid shim, write that part as a real test |
  | a `C-nn` test of `docs/05-commerce.md` section 14 | `// AT-<n>: covered by <owner> (<file>: C-<nn>)`. Owners: C-01 to C-08 `M1-T29 (test/commerce/liquid.test.ts: ...)`; C-09 to C-13 and C-25 `M1-T30 (test/commerce/hydrogen.test.ts: ...)`; C-23 `M1-T39 (test/hydration/react.test.ts: ...)`; C-05 cases 2 to 4, C-33, C-34, C-36, C-37, C-38, C-39 `M4-T25`, in `test/commerce/liquid.test.ts` for a Liquid row (C-36, C-38) and `test/commerce/hydrogen.test.ts` for a hydrogen row (C-33, C-34, C-37, C-39); C-35 `M7-T30`; C-18 `M7-T25` (ledger D-145, D-141 (1)) |
  | the hydrogen dev server with scripting disabled ("Tier 6: hydrogen dev server ...") | `// AT-<n>: covered by M7-T25 (test/nojs/blueprints.test.ts: NJ-F<k>)` with the NJ-F number the task section gives; a Liquid shim half of the same item is a real `[T6]` test |
  | a checker rule other than RP113 (`ripple check` reports `RP104`, `RP320`, `RP404`, ...) | `// AT-<n>: covered by <task> (src/check/rules/<RULE>.test.ts: <RULE>)` where `<task>` is M2-T29 for RP101 to RP105, M4-T23 for RP301 to RP321, M6-T29 for RP401 to RP406 |
  | a test that another component task writes in its own test file | `// AT-<n>: covered by <task id> (<file>: <test name prefix>)` exactly as the task section prints it |

  Every other item is a real test in the component's test file. A real test is never skipped and never `todo`. `docs/13-testing.md` section 18.2 step 4 names only the `generic` form; ledger D-141 (3) adds the `covered by` form and wins. When `test/conformance/acceptance-coverage.test.ts` rejects a `// AT-<n>: covered by` line, that is a harness defect: M1-T01 fixes it (M1-R10); a later task stops and reports it (draft pull request).
- **M1-R8 Component rules.** For every manifest `rules[]` entry write one `[T1]` test named `[T1] <id>: rule <rule id> reports RP113` that runs the checker (`src/check/index.ts`, layer H) on a failing HTML string and asserts exactly one diagnostic `RP113` whose message contains `[<rule id>]`, plus one test `[T1] <id>: default fixture reports no RP113` (`docs/13-testing.md` section 10.2, row "component rules").
- **M1-R9 Proof commands for a component** (PLAN 3.2), in this order, all exit 0:

  ```bash
  export RIPPLE_NETWORK=1                         # from M1-T15 on (section 0.2, PLAN 3.1)
  pnpm gen && pnpm typecheck && pnpm gen --check
  pnpm build && pnpm examples:install
  pnpm test:visual --component=<id> --update      # first time only; look at the snapshots, commit them
  pnpm test:component --component=<id> --no-skips
  pnpm test:size
  pnpm ci
  ```

- **M1-R10** A generated file that differs from the HTML or code printed in a spec (compared after `canonicalize()` of `src/testing/canonicalize.ts`) is a defect of the manifest `template` or of the generator. Fix the manifest first. If the generator is wrong, only M1-T01 and M1-T02 (the pilots) may fix `src/gen/**` and `test/**` (M1-T01 also `src/testing/**` and `src/check/rules/RP113.ts`); every other task stops, opens a draft pull request and names the generator defect.

### 0.4 Test pages that are not a fixture page (Plan reading)

Element tasks and commerce test tasks run before the components exist, so `fixturePageUrl("<id>/<fixture>")` is not available to them. They build their page the way the spikes did (`docs/research/spikes/commerce/run.cjs`, function `scenario`):

- **M1-R11** Inside the test, after `const opened = await openPage()`, call `opened.page.route("**/*", handler)`. The handler fulfils: `GET /` with the page HTML string; `GET /ripple.css` with the file `pkg/browser/ripple.css`; any `GET /ripple*.js` with the file of the same name in `pkg/browser/`; `GET /sa.js` with `test/support/fake-sa.js` (optionally prefixed by a seed script, as the spike's `pre`); the two platform modules the spike serves (`/partials.js`, `/events.js`) with the spike's strings; everything else is recorded in an array and answered by a per-test route table or `404`. Then `await opened.page.goto("http://localhost/")`.
- **M1-R12** The page HTML is built from markup that a spec prints (the block the task names). Never invent markup. The script tag is `<script type="module" src="/ripple.elements.js"></script>` for element tests and `<script type="module" src="/ripple.js"></script>` for commerce tests; the stylesheet is `<link rel="stylesheet" href="/ripple.css">`.
- **M1-R13** Replace every `sleep` of a spike scenario with `page.waitForFunction(...)` on the observed condition. The only fixed waits allowed are the durations a spec states (250 ms quantity debounce in C-03; 1000 ms request-recording windows; 500 ms announcement window in Q-11, Q-12).
- **M1-R14** Read files with paths relative to `process.cwd()`.

### 0.5 Shared files that several M1 tasks edit

These files are touched by more than one task. Edit only the lines your task names. Tasks of the same group letter MAY edit the same registration file when each adds only its own lines (ledger D-147). When `git rebase origin/main` conflicts in one of them, keep both sides' lines, then re-run the proof commands.

| File | Rule |
|---|---|
| `locales/en.default.json` | add your keys only (M1-R6); keep keys sorted as the file already is; run `pnpm gen` |
| `src/check/rules/RP113.ts` | `CUSTOM_RULES`: a component task whose spec gives a rule of kind `custom` adds one function for it (in M1: `cart-drawer-one`, M1-T38); `pnpm gen --check` fails while a manifest `custom` rule has no function (doc 07 section 9.5.3) |
| `src/elements/index.ts` | its final text is `docs/04-elements.md` section 4.1. The element tasks M1-T13 and M1-T16 each add their one line `import "./<tag>"` at the position section 4.1 prints it and remove only the bring-up line M0-T26 left for that tag, if any (ledger D-134 item 28, PLAN recipe 5.5 step 3). A shared `// PLAN 4.4` comment that still names other tags stays |
| `src/commerce/index.ts` | created by M1-T20 with marked bring-up lines; M1-T23, M1-T24, M1-T26, M1-T27, M1-T28 each change the one line their section names |
| `src/react/index.ts` | created by M1-T11; M1-T25 adds one export line |
| `src/gen/elements.json` | complete since M0-T06; never edited in M1 |
| generated files (`src/types.generated.ts`, `src/*/jsx.generated.ts`, `css/props.css`, `css/base.css` regions, `components/*/html`, generated bindings) | never edited by hand; run `pnpm gen` |

A bring-up line in a source file carries the comment `// PLAN 4.4: <what replaces it and which task>`. M9-T05 fails while that string exists under `src/`.

### 0.6 Spike tasks

- **M1-R15** A spike task measures and reports (PLAN 3.4). It MUST NOT apply a fallback and MUST NOT apply an "addition". It changes no shipped contract.
- **M1-R16** Report path: `docs/research/spikes/<spike name>/README.md` with the headings `## Question`, `## Procedure`, `## Commands`, `## Results` (one row per check: check, engine, expected, observed, pass or fail), `## Verdict` (`DEFAULT holds` or `FALLBACK required`; SPIKE-08 only: `ADDITION possible` or `DEFAULT stays`, PLAN 3.4), `## Not run`. Code that produced the result is in the same directory, or is a repository test the report names.
- **M1-R17** Ledger update: append to the spike's row in the table of `docs/00-decisions.md` section "## 3. Spike tasks" (last cell) exactly one sentence: `Result (<YYYY-MM-DD>): <verdict>; report docs/research/spikes/<name>/README.md.` Change nothing else in the ledger.
- **M1-R18 Engines (Plan reading).** SPIKE-04, SPIKE-05 and SPIKE-10 ask about WebKit and Gecko too. Run once: `pnpm exec playwright install webkit firefox`. If it fails, do not retry: run the Chromium part, list every WebKit and Gecko check under `## Not run` with the reason `BLOCKED-ON-ENV: no WebKit or Gecko build`, and write the verdict for what was run, followed by the words `(Chromium only)`. The ledger sentence then ends `... ; WebKit and Gecko not run.` The done file gets the status line `BLOCKED-ON-ENV: <the checks not run>`; the pull request is NOT a draft, and the done file satisfies the dependencies of later tasks (PLAN section 1 item 7, section 4.3; ledger D-146). The `cross-engine` CI job runs the WebKit and Gecko checks later; no M1 task waits for them.
- **M1-R19** When the verdict is `FALLBACK required`, write in the done file the line `FOLLOW-UP NEEDED: apply "Fallback (SPIKE-nn)" of <owning doc>` and stop (PLAN 7.2).

### 0.7 Definition of done reminder

Every task ends with PLAN section 5.0 (commit, push, pull request in the five-heading form, done file `docs/plan/done/<task id>.md`). "Acceptance" in a task section lists what is specific to the task; PLAN section 3.1 always applies in addition.

### 0.8 Plan readings made by this file

Ledger D-146 ratified PR-1 to PR-10 (PR-1 and PR-10 in the form of D-141 (3)) and replaced PR-11 by D-145.

| # | Topic | Reading |
|---|---|---|
| PR-1 | Acceptance items that need tier 7, tier 9 or a checker rule that does not exist yet | M1-R7: a `// AT-<n>: covered by <task id> (<file>: <test name or id>)` line (ledger D-141 (3)); `generic` only for the generic matrix and tier 9 |
| PR-2 | Pages for element and commerce tests before components exist | M1-R11 to M1-R14 |
| PR-3 | `src/commerce/index.ts` while backends and elements are added one task at a time | section 0.5 and the task sections M1-T20, M1-T23, M1-T24, M1-T26 to M1-T28 |
| PR-4 | Spikes that need WebKit and Gecko | M1-R18 |
| PR-5 | The golden-path theme of M1-T39 | the scaffold printed in M1-T39 (PLAN section 8, note P-3) |
| PR-6 | `src/commerce/dialect.ts` is needed by `adapter.ts` one task early | M1-T20 copies the spike file unchanged; M1-T21 owns its checks and tests |
| PR-7 | C-01 names elements that M1 does not build | M1-T29: the M1 form of C-01 asserts the three M1 tags |
| PR-8 | Content of `src/commerce/rp-*.test.ts` in M1 (the specs name only the agent test of `docs/08-agent-kit-and-evals.md` section 7.6, which needs the full agent surface) | Each file holds one `[T1]` shape test and one `[T5]` smoke test, as its task section lists; M8-T03 adds the agent test |
| PR-9 | Files of the `E-nn` tests of `docs/04-elements.md` section 13 | Placement rule of ledger D-141 (1). E-13 and E-26 are Q-2 to Q-14 in `src/elements/rp-quantity.test.ts`; E-05 to E-09, E-11, E-12, E-31, E-32 are in `src/elements/rp-dialog.test.ts` (E-31, E-32: D-145); the other rows have the owners of D-145 (M3-T10, M3-T13, M3-T14, M5-T10, M5-T11) |
| PR-10 | Acceptance items that need the hydrogen dev server with scripting disabled (tier 6 on the hydrogen backend needs the network, D-063) | `// AT-<n>: covered by M7-T25 (test/nojs/blueprints.test.ts: NJ-F<k>)` (ledger D-141 (3)); the Liquid shim half of the same item is a real `[T6]` test |
| PR-11 | (replaced by ledger D-145) | C-05 cases 2 to 4, C-33, C-34, C-36 to C-39 are owned by M4-T25, C-35 by M7-T30, C-18 by M7-T25. Component tasks write the `covered by` line of M1-R7 |

---

## M1-T01 Button (`button`)

- **Goal:** Ship Button, the first component, through every tier and all four hosts. Fix any harness or generator defect it exposes.
- **Depends on:** M0-T45.
- **Kind / recipe:** `static`, Liquid tier `block`; recipe S. Pilot task (size M).

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/button.md` | whole file | 24 kB |
| `docs/07-manifest-registry-cli.md` | in `#### 1.7.1 `, the `json` block only (the key shape of `components/button/button.json`; the values come from the spec, ledger D-134 item 6) | 14 kB |
| `docs/03-styling-and-tokens.md` | `### 7.4 Complete example: ` (the complete `button.css` and the table "Values a test can assert") | 8 kB |
| `docs/09-components-foundation.md` | `### 0.1 ` to `### 0.3 ` | 9 kB |
| `docs/13-testing.md` | `### 10.1 ` and `### 10.2 ` | 6 kB |

Total 61 kB. Only when a tier 2 conformance case of a host fails, open the matching complete file: `docs/06-bindings.md` `### 6.4 ` (React, 4 kB), `### 7.4 ` (Remix, 4 kB), `### 8.4 ` (Liquid, 9 kB). Each starts with a "Copy rule (D-069)" note that lists the props its printed code lacks.

### Files

Create: `components/button/button.json`, `components/button/button.css`, `components/button/button.test.ts`, `test/visual/snapshots/button/<fixture>.json` (written by the test run).
Generated by `pnpm gen` (commit them): `components/button/fixtures/*.html`, `components/button/html/button.html`, `components/button/react/button.tsx`, `components/button/remix/button.tsx`, `components/button/liquid/blocks/button.liquid`, `components/button/liquid/snippets/rp-button.liquid`, `components/button/liquid/locales/button.json` (it holds the generated schema name key `ripple.button.name`), regenerated shared files.
No change to `locales/en.default.json`: Button's bindings print no string of their own (M1-R6).
May change (pilot only): files under `src/gen/`, `src/testing/`, `test/`, and `src/check/rules/RP113.ts`, when a gate below fails because of a defect in them (for RP113: a rule whose selector matches the root itself MUST fire on the root, ledger D-134 item 3). Each such change gets its own commit `M1-T01: fix <file>: <defect>` and a line in the done file.
MUST NOT change: any `docs/` spec, `css/tokens.css`, `package.json` scripts.

### Steps

1. `git fetch origin && git switch -c task/M1-T01-button origin/main && pnpm install --frozen-lockfile`.
2. Copy the key shape of the `json` block of `docs/07-manifest-registry-cli.md` section 1.7.1 into `components/button/button.json`, then: set `status` to `stable`; set `props[]` from the spec's Props table (prop order and the props `formId`, `dialog`, `tooltip` as the spec prints them, D-069); replace `fixtures[]` with the 17 records of the spec's fixture table (props and children exactly as that table prints them, each with `"generated": "template"`); replace `rules[]` with the four rules of the spec's Checker rules section (selector, target, message and fix from the spec). The spec wins (doc 07 section 1.7, ledger D-134 item 6); no ledger issue is needed for the differences.
3. Copy the CSS of `docs/03-styling-and-tokens.md` section 7.4 unchanged into `components/button/button.css`.
4. (No locale step: M1-R6.)
5. `pnpm gen`. Compare each of the ten fenced fixtures of the spec's "HTML contract" with `components/button/fixtures/<name>.html`: they MUST be equal after `canonicalize()` of `src/testing/canonicalize.ts` (the spec prints `disabled`, the generator writes `disabled=""`; the canonical forms are equal). The bindings `react/button.tsx`, `remix/button.tsx`, `liquid/snippets/rp-button.liquid`, `liquid/blocks/button.liquid` are proven by the tier 2 cases `[T2] button/<fixture>: <host> output equals the reference HTML`. A difference in a generated file is fixed in `src/gen/**` (pilot), never in the output.
6. Write `components/button/button.test.ts` (template: `docs/13-testing.md` section 10.1) with the tests listed under Tests.
7. Run the proof commands of M1-R9 with `<id>` = `button`. For each failing generic test decide: manifest wrong (fix manifest), CSS wrong (it is a copy; re-copy), or harness wrong (fix the harness file; the gate named in the harness spec section is normative, D-113).
8. PLAN 5.0. In the pull request "Notes for later tasks" state the intended look in two sentences and list every harness fix.

### Names and values

- Fixtures (17): `default`, `link`, `link-disabled`, `link-external`, `submit-pending`, `disabled`, `dialog-opener`, `with-icon`, `destructive`, `link-opener`, `tooltip-trigger`, `form-associated`, `link-ignores-button-props`, `button-ignores-dialog`, `class`, `invalid-enum-falls-back`, `escaping`. Props and children: the fixture table of the spec.
- Root class `rp-button`; root element `button`, or `a` when `href` is set. No custom element. `noJs.level` `full`. `liquid.tier` `block`; `liquid.embeddedBy` as printed in section 1.7.1.
- Rules (4): `button-no-interactive-content`, `button-command-pair`, `button-command-needs-target`, `button-dialog-needs-href`.
- Fixture lint: check `pe-2` is skipped for the root of a `button` or `icon-button` fixture (spec, "Fixture lint note").

### Tests (`components/button/button.test.ts`)

| Id | Tier | Form |
|---|---|---|
| AT-1 | generic | comment (M1-R7) |
| AT-2 | 5 | `[T5] button: AT-2 ...` the 11 rows of "Values a test can assert" |
| AT-3 | 5 | `[T5] button: AT-3 ...` contrast at least 4.5:1 for 6 variants in schemes `light` and `dark` (`fixturePageUrl(id, { scheme })`) |
| AT-4 | 5 | `[T5] button: AT-4 ...` |
| AT-5 | 5 | `[T5] button: AT-5 ...` |
| AT-6 | 5, 9 | Needs a Dialog with id `size-guide`. Dialog does not exist yet: build the page with M1-R11 from the Button fixture `dialog-opener` plus a bare `<dialog id="size-guide"><p>x</p></dialog>` and assert `dialog.open` after Enter in Chromium (native Invoker Commands). Name `[T5] button: AT-6 ...`, no `[chromium]` tag |
| AT-7 | 6 | `[T6] button: AT-7 ...` with `openPage({ scripts: "disabled" })` and an M1-R11 page |
| AT-8 | 5, 6 | tier 6 part now: `[T6] button: AT-8 link opener navigates to href with scripting disabled`. The tier 5 part needs `rp-dialog`: add the line `// AT-8: covered by M1-T17 (components/dialog/dialog.test.ts: [T5] dialog: button AT-8 link opener opens the dialog with scripts on)` |
| AT-9 | 2 | comment: `// AT-9: covered by M3-T05 (components/tooltip/tooltip.test.ts: [T2] tooltip: button AT-9 the Button tooltip-trigger fixture equals the trigger of fixture placement)` |
| AT-10 | 2 | `[T2] button: AT-10 ...` reading the two fixture files |
| AT-11 | 6 | `[T6] button: AT-11 ...` |
| AT-12 | 1 | the four M1-R8 rule tests plus the default-fixture test; add the line `// AT-12: generic (the [T1] rule tests in this file)` |

### Acceptance

- M1-R9 commands exit 0; `pnpm test:component --component=button --no-skips` ends with `0 failed, 0 skipped`.
- `[T2] button/default: liquid output equals the reference HTML` (and the same for `react`, `remix`, `html`) pass for all 17 fixtures.
- `ls components/button/fixtures | wc -l` prints `17`.
- `node -e 'const m=require("./components/button/button.json"); console.log(m.status, m.fixtures.length, m.rules.length)'` prints `stable 17 4`.
- `git diff --name-only origin/main -- locales/en.default.json` prints nothing.

### Out of scope

IconButton, Dialog, Tooltip. The SPIKE-05 fallback attributes (`data-rp-open` or `data-rp-close` on a `<button>`). Any checker rule other than RP113.

### If blocked

- A harness defect that cannot be fixed inside this session: push, open a draft pull request, name the failing test and the harness file (PLAN section 1 item 7). No other M1 component task may start before this task is done.
- SPIKE-05 is not run yet: implement the default path (no `data-rp-open` on buttons).

---

## M1-T02 Stack (`stack`)

- **Goal:** Ship Stack, the pilot for layout props and the responsive grammar.
- **Depends on:** M1-T01.
- **Kind / recipe:** `static`, tier `block`; recipe S. Pilot for responsive props: may fix `src/gen/props-css.ts`, `src/gen/react.ts`, `src/gen/remix.ts`, `src/gen/liquid.ts` and `test/**` when a gate fails because of them (M1-R10).

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/stack.md` | whole file | 7 kB |
| `docs/09-components-foundation.md` | `### 0.1 ` to `### 0.3 ` | 9 kB |
| `docs/07-manifest-registry-cli.md` | `#### 1.7.1 ` (shape to copy) | 16 kB |
| `docs/03-styling-and-tokens.md` | `### 7.2 File skeleton`, `### 7.7 Layout defaults and layout props` | 6 kB |
| `docs/06-bindings.md` | `### 6.5 `, `### 7.5 `, `### 8.5 ` (the complete generated files, for comparison) | 10 kB |

### Files

Create: `components/stack/stack.json`, `components/stack/stack.css`, `components/stack/stack.test.ts`. Generated: fixtures, `html/stack.html`, `react/stack.tsx`, `remix/stack.tsx`, `liquid/blocks/stack.liquid`, locale output. No change to `locales/en.default.json` (M1-R6).

### Steps

1. Branch `task/M1-T02-stack`. Apply recipe S.
2. Compare the generated React, Remix and Liquid files with `docs/06-bindings.md` sections 6.5, 7.5, 8.5.

### Names and values

- Root class `rp-stack`; element `div` or the `as` tag (`div section ul ol nav header footer main aside article form`); `as` prints no attribute.
- Fixtures (6): `default`, `responsive`, `row-list`, `axis-gaps-padding`, `class`, `invalid-enum-falls-back` (props in the spec's fixture table). All `generated: "template"`.
- No manifest rules. No schema settings.
- Trap: the Liquid param is `as`. Its rename to `tag` happens only on the SPIKE-02 fallback (spec, "Fallback (SPIKE-02)"); do not apply it.
- Trap: a responsive value is printed unchanged and never repaired (`docs/09-components-foundation.md` FC-6).

### Tests (`components/stack/stack.test.ts`)

AT-1 comment (generic). `[T5] stack: AT-2 ...`, `[T5] stack: AT-3 ...` (viewport widths 375 and 1280), `[T5] stack: AT-4 ...`.

### Acceptance

M1-R9 with `<id>` = `stack`. `data-gap="2 md:6"` appears in `components/stack/fixtures/responsive.html`.

### Out of scope

Inline, Grid, Container (M2). Margin props. Object-form responsive values.

### If blocked

Generator defect outside the four files named above: draft pull request naming it.

---

## M1-T03 Icon (`icon`)

- **Goal:** Ship Icon with the 24 icon source files.
- **Depends on:** M1-T01.
- **Kind / recipe:** `static`, tier `snippet` (the only one); recipe S.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/icon.md` | whole file | 7 kB |
| `docs/09-components-foundation.md` | `### 0.1 ` to `### 0.3 `, `### 0.6 Icon set` (the 24 names and inner markup) | 12 kB |
| `docs/07-manifest-registry-cli.md` | `#### 1.7.1 ` (shape) | 16 kB |

### Files

Create: `icons/<name>.svg` for the 24 names; `components/icon/icon.json`, `components/icon/icon.css`, `components/icon/icon.test.ts`. Generated: `fixtures/*.html` (including 24 fixtures `icon-<name>`), `html/icon.html`, `react/icon.tsx`, `remix/icon.tsx`, `liquid/snippets/rp-icon.liquid`. There is NO `liquid/blocks/icon.liquid`.

### Steps

1. Branch `task/M1-T03-icon`.
2. Write the 24 files. Each is exactly one line: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><INNER></svg>` with `<INNER>` copied from the table of section 0.6. No `fill`, `stroke`, `style`, `class`, `id` attribute.
3. Apply recipe S. CSS: the "Rules" table of the spec's Styling section.

### Names and values

- Names (24): `account arrow-left arrow-right cart check chevron-down chevron-left chevron-right chevron-up close filter globe info menu minus pause play plus search star tag trash warning zoom-in`.
- Root `svg.rp-icon` with `aria-hidden="true" focusable="false" viewBox="0 0 24 24"`. Props: `name`, `class` only.
- Fixtures: `default` (`name: cart`), `close`, `class`, `unknown-name` (renders the empty string in every host), plus the 24 generated `icon-<name>` fixtures (spec, HTML contract). There is no `invalid-enum-falls-back` fixture: `name` has no default.
- The Liquid snippet is a generated `{% case name %}` with one `{% when %}` per icon and no `{% else %}`.
- Locale keys: none.

### Tests (`components/icon/icon.test.ts`)

AT-1 comment. `[T1] icon: AT-2 ...` (file names in `icons/` equal the 24 names; each file matches the regular expression printed in AT-2). AT-3 comment (generic, conformance). `[T5] icon: AT-4 ...`.

### Acceptance

M1-R9 with `<id>` = `icon`. `ls icons | wc -l` prints `24`. `ls components/icon/fixtures | wc -l` prints `28`.

### Out of scope

Any icon not in the list; icon props other than `name` and `class`.

### If blocked

If the generator cannot emit the `icon-<name>` fixtures or a `snippet` tier component: draft pull request naming `src/gen/html.ts` or `src/gen/liquid.ts` (M1-R10).

---

## M1-T04 IconButton (`icon-button`)

- **Goal:** Ship IconButton, the first component that embeds another (Icon).
- **Depends on:** M1-T01, M1-T03.
- **Kind / recipe:** `static`, tier `block`; recipe S.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/icon-button.md` | whole file | 19 kB |
| `docs/09-components-foundation.md` | `### 0.1 ` to `### 0.3 ` | 9 kB |
| `components/button/button.json`, `components/button/button.css` (repository, done by M1-T01) | whole files, as the pattern | 12 kB |

### Files

Create: `components/icon-button/icon-button.json`, `.css`, `.test.ts`. Generated: fixtures, html, `react/icon-button.tsx` (imports `Icon` from `./icon`), `remix/icon-button.tsx` (imports from `./icon.tsx`), `liquid/blocks/icon-button.liquid` (calls `{% render 'rp-icon', name: icon %}`). Change: `components/icon/icon.json` only if `liquid.embeddedBy` of Icon does not yet list `icon-button`.

### Names and values

- Root class `rp-icon-button`; `button`, or `a` with `href`. Required props `icon`, `ariaLabel`. Default `variant` is `ghost`.
- Fixtures (12): `default`, `link-opener`, `tooltip-trigger`, `form-associated`, `dialog-closer`, `link`, `link-disabled`, `submit-pending`, `disabled`, `class`, `invalid-enum-falls-back`, `escaping`.
- Rules (6): `icon-button-needs-icon`, `icon-button-single-icon`, `icon-button-needs-name`, `icon-button-command-pair`, `icon-button-command-needs-target`, `icon-button-dialog-needs-href`.
- The contract template uses an `embed` node for Icon (`docs/09-components-foundation.md` FC-10). The embedded `<svg>` MUST equal the Icon fixture for the same name.
- Schema settings: `variant`, `size`.

### Tests (`components/icon-button/icon-button.test.ts`)

AT-1 comment. `[T5] icon-button: AT-2 ...`, `[T5] icon-button: AT-3 ...`. AT-4: the TypeScript half is `// AT-4: generic (test/conformance/hosts.test.ts)`; the `RP104` half is the next line `// AT-4: covered by M2-T29 (src/check/rules/RP104.test.ts: RP104)`. AT-5: page built with M1-R11 from fixture `dialog-closer` inside `<dialog id="size-guide" open>`; assert the click closes it in Chromium: `[T5] icon-button: AT-5 ...`. AT-6: tier 6 half as a real `[T6] icon-button: AT-6 ...` test; tier 5 half `// AT-6: covered by M1-T17 (components/dialog/dialog.test.ts: [T5] dialog: icon-button AT-6 ...)`. AT-7: `// AT-7: covered by M3-T05 (components/tooltip/tooltip.test.ts: [T2] tooltip: icon-button AT-7 the IconButton tooltip-trigger fixture equals the trigger of fixture default)`. `[T2] icon-button: AT-8 ...` by rendering through the host adapters of `test/support/hosts/`. AT-9: the six M1-R8 rule tests.

### Acceptance

M1-R9 with `<id>` = `icon-button`.

### Out of scope

The SPIKE-05 fallback. Tooltip.

### If blocked

Default path as written; no fallback.

---

## M1-T05 Link (`link`)

- **Goal:** Ship Link, including the `dialog` opener prop.
- **Depends on:** M1-T01.
- **Kind / recipe:** `static`, tier `block`; recipe S.

### Read first

`docs/components/link.md` (10 kB); `docs/09-components-foundation.md` `### 0.1 ` to `### 0.3 ` (9 kB); `components/button/button.json` (pattern).

### Files

Create `components/link/link.json`, `.css`, `.test.ts`; generated fixtures, html, react, remix, `liquid/blocks/link.liquid`. No change to `locales/en.default.json` (M1-R6).

### Names and values

- Root `a.rp-link`. `variant` values `inline plain`, default `inline`. Prop `dialog` prints `data-rp-open`; `current` prints `aria-current`.
- Fixtures (8): `default`, `plain-current`, `opener`, `disabled`, `external`, `class`, `invalid-enum-falls-back`, `escaping`.
- Rule (1): `link-no-interactive-content`.
- Schema setting: `variant`.

### Tests (`components/link/link.test.ts`)

AT-1 comment. `[T5] link: AT-2 ...`, `[T5] link: AT-3 ...`. AT-4 needs `rp-dialog`: write `// AT-4: covered by M1-T18 (components/drawer/drawer.test.ts: [T5] drawer: link AT-4 ...)` (M1-R7). `[T6] link: AT-5 ...` (M1-R11 page with the `opener` fixture and a `GET /cart` route; scripting disabled). One M1-R8 rule test.

### Acceptance

M1-R9 with `<id>` = `link`.

### Out of scope / If blocked

No router wrapper. Default path only.

---

## M1-T06 FormMessage (`form-message`)

- **Goal:** Ship FormMessage, the markup every commerce error part reuses.
- **Depends on:** M1-T01.
- **Kind / recipe:** `static`, tier `block`; recipe S.

### Read first

`docs/components/form-message.md` (7 kB); `docs/09-components-foundation.md` `### 0.1 ` to `### 0.3 ` (9 kB); `docs/03-styling-and-tokens.md` `### 7.5 Components with ` (4 kB).

### Files

Create `components/form-message/form-message.json`, `.css`, `.test.ts`; generated fixtures, html, react, remix, `liquid/blocks/form-message.liquid`, `liquid/snippets/rp-form-message.liquid`. No change to `locales/en.default.json` (M1-R6).

### Names and values

- Root `p.rp-form-message`. `tone` default `destructive` prints `role="alert"`; `success`, `info`, `warning`, `muted` print `role="status"`.
- Fixtures (5): `default`, `success`, `muted`, `class`, `invalid-enum-falls-back`.
- The commerce error part is exactly `<p class="rp-form-message" data-rp-part="error" data-tone="destructive" role="alert" hidden></p>` (CONVENTIONS 11). The CSS MUST make it `display: none` while `hidden`.
- `liquid.embeddedBy` is non-empty (markup in the snippet): the list is the one the spec and `docs/09-components-foundation.md` section 0.7 give.

### Tests

AT-1 comment. `[T2] form-message: AT-2 ...`. `[T5] form-message: AT-3 ...`. `[T5] form-message: AT-4 ...` (M1-R11 page with the commerce error markup above).

### Acceptance

M1-R9 with `<id>` = `form-message`.

### Out of scope / If blocked

Field (M2-T17). Default path only.

---

## M1-T07 VisuallyHidden (`visually-hidden`)

- **Goal:** Ship VisuallyHidden.
- **Depends on:** M1-T01.
- **Kind / recipe:** `static`, tier `block`; recipe S.

### Read first

`docs/components/visually-hidden.md` (5 kB); `docs/09-components-foundation.md` `### 0.1 ` to `### 0.3 ` (9 kB).

### Files

Create `components/visually-hidden/visually-hidden.json`, `.css`, `.test.ts`; generated fixtures, html, react, remix, `liquid/blocks/visually-hidden.liquid`. No change to `locales/en.default.json` (M1-R6).

### Names and values

- Root `span.rp-visually-hidden`. Fixtures (3): `default`, `with-id`, `class`. No rules, no settings.
- The class is also printed on `p` and `h2` by other components; the CSS selects `.rp-visually-hidden` only (spec, Styling: the RP110 exception).

### Tests

AT-1 comment (note in the comment: for CA-5 the compared box is 1 by 1 px). `[T5] visually-hidden: AT-2 ...`. `[T3] visually-hidden: AT-3 ...` (accessibility snapshot of the markup printed in AT-3; M1-R11 page). `[T5] visually-hidden: AT-4 ...`.

### Acceptance

M1-R9 with `<id>` = `visually-hidden`.

### Out of scope / If blocked

Nothing else. Default path only.

---

## M1-T08 Image (`image`)

- **Goal:** Ship Image with the fixed six-width `srcset`.
- **Depends on:** M1-T01.
- **Kind / recipe:** `static`, tier `block`; recipe C (ledger D-139: the spec's Host notes start with a "Binding paths (D-139)" line; no `template`, every fixture `generated: "hand"`, hand-written bindings below their generated regions). `status: "stable"`.

### Read first

`docs/components/image.md` (13 kB); `docs/09-components-foundation.md` `### 0.1 ` to `### 0.3 ` (9 kB); `docs/05-commerce.md` `### 11.3 Images` (2 kB); `docs/07-manifest-registry-cli.md` `### 3.3 Generated regions inside hand-written files` (4 kB); `src/image.ts` (repository, M0-T08).

### Files

Create `components/image/image.json`, `.css`, `.test.ts`, `fixtures/{default,hero,alt-override,no-alt,class,invalid-enum-falls-back,escaping}.html` (hand-written from the spec's HTML contract), `react/image.tsx`, `remix/image.tsx`, `liquid/blocks/image.liquid` (hand-written below the generated regions). Generated by `pnpm gen`: `html/image.html`, the generated regions of the three binding files, `liquid/locales/image.json`. No change to `locales/en.default.json` (M1-R6).

### Steps

1. Branch `task/M1-T08-image`. Recipe C steps 1 to 5 (PLAN 5.6; step 6 does not apply, the kind is `static`).
2. Write each fixture file with the exact HTML of the spec's HTML contract. `pnpm gen`, then write the three bindings below their generated regions. The `srcset` candidates come from `imageUrl` of `src/image.ts` (spec, Host notes).

### Names and values

- Root `img.rp-image`. Required prop `image` (object). `src` is always width 800; `srcset` widths are `200 400 600 800 1200 1600`.
- Fixtures (7): `default`, `hero`, `alt-override`, `no-alt`, `class`, `invalid-enum-falls-back`, `escaping`. Props reference `{ "$resource": "image.basic" }` and `{ "$resource": "image.no-alt" }` (values in `src/testing/resources.ts`).
- Every fixture has the mask `[{ "select": "img", "op": "attr", "name": "src" }, { "select": "img", "op": "srcset", "name": "srcset" }]`.
- React: `fetchPriority` is passed as `fetchPriority` and printed `fetchpriority`. Schema settings: `ratio`, `fit`, `radius`.
- The Host notes line "Binding paths (D-139)" wins over the later words "generated" in the same Host notes.

### Tests

AT-1 comment. AT-2 comment (generic, conformance with masks). `[T2] image: AT-3 ...`. `[T5] image: AT-4 ...` (abort the image request with `page.route`). `[T5] image: AT-5 ...`. `// AT-6: covered by M0-T08 (src/image.test.ts: C-22)`.

### Acceptance

M1-R9 with `<id>` = `image`. `grep -c '"template"' components/image/image.json` prints `0`. `ls components/image/fixtures | wc -l` prints `7`.

### Out of scope / If blocked

Video. `<picture>`. Other widths. Default path only.

---

## M1-T09 Placeholder (`placeholder`)

- **Goal:** Ship Placeholder, used wherever an image is missing.
- **Depends on:** M1-T01.
- **Kind / recipe:** `static`, tier `block`; recipe S.

### Read first

`docs/components/placeholder.md` (6 kB); `docs/09-components-foundation.md` `### 0.1 ` to `### 0.3 ` (9 kB).

### Files

Create `components/placeholder/placeholder.json`, `.css`, `.test.ts`; generated fixtures, html, react, remix, `liquid/blocks/placeholder.liquid`. No change to `locales/en.default.json` (M1-R6).

### Names and values

- Root `div.rp-placeholder`. Default `ratio` `1/1`, default `radius` `none`. Without `ariaLabel`: `aria-hidden="true"`, no `role`. With `ariaLabel`: `role="img"`, `aria-label`, no `aria-hidden`.
- Fixtures (5): `default`, `labelled`, `class`, `invalid-enum-falls-back`, `escaping`. Schema settings: `ratio`, `radius`.

### Tests

AT-1 comment. `[T5] placeholder: AT-2 ...`. `[T2] placeholder: AT-3 ...`.

### Acceptance

M1-R9 with `<id>` = `placeholder`.

### Out of scope / If blocked

Nothing else. Default path only.

---

## M1-T10 Price (`price`)

- **Goal:** Ship Price, the first hand-written (recipe C) static component and the first use of money resources.
- **Depends on:** M1-T01, M1-T07.
- **Kind / recipe:** `static`, tier `block`; recipe C (bindings hand-written, fixtures `generated: "hand"`). `status: "stable"` (the kind is `static`).

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/price.md` | whole file | 8 kB |
| `docs/11-components-commerce.md` | `### 0.2 Embedded components` (rows VisuallyHidden only), `### 0.4 `, `### 0.5 ` | 8 kB |
| `docs/05-commerce.md` | `### 11.2 Money` | 1 kB |
| `docs/07-manifest-registry-cli.md` | `#### 1.7.3 ` (shape for hand fixtures and masks) and `### 3.3 Generated regions inside hand-written files` | 20 kB |
| `docs/06-bindings.md` | `## 3. Generated versus hand-written` | 3 kB |

### Files

Create: `components/price/price.json`, `price.css`, `price.test.ts`, `fixtures/{default,sale,from,compare-not-higher,class,invalid-enum-falls-back}.html`, `react/price.tsx`, `remix/price.tsx`, `liquid/blocks/price.liquid`, `liquid/snippets/rp-price.liquid`. Generated: `html/price.html`, the generated regions of the four binding files. Change: `locales/en.default.json` (`ripple.price.sale` = `Sale price`, `ripple.price.regular` = `Regular price`, `ripple.price.from` = `From`).

### Steps

1. Branch `task/M1-T10-price`. Recipe C steps 1 to 5.
2. Write each fixture file with the exact HTML of the spec. `compare-not-higher` equals `default`; `invalid-enum-falls-back` (`size: "huge"`) equals `default`.
3. `pnpm gen`, then write the bindings BELOW the generated regions.

### Names and values

- Root `span.rp-price`; parts `rp-price-prefix`, `rp-price-current`, `rp-price-compare` (an `<s>`). Child order and the "on sale" test: spec, Anatomy.
- Money props are `{ "$resource": "money.usd-48" }`, `money.usd-12`, `money.usd-16`. Masks: `{ "select": ".rp-price-current", "op": "text" }`, `{ "select": ".rp-price-compare", "op": "text" }`.
- React and Remix: `formatMoney(price, { locale }).localizedString`; `formatMoney` is a value import from `@shopify/hydrogen` allowed by D-094. No hook, so no `"use client"`.
- Liquid: `{{ price | money }}`; on-sale test `compare_at_price != blank and compare_at_price > price`. The block file is the thin wrapper; the markup is in the snippet. One schema setting: `size`.
- Embedded VisuallyHidden labels: TSX renders `VisuallyHidden` from `./visually-hidden` (Remix: `./visually-hidden.tsx`); Liquid prints the `<span class="rp-visually-hidden">` as the spec's snippet shows.

### Tests (`components/price/price.test.ts`)

AT-1 comment (generic, conformance with masks). `[T5] price: AT-2 ...` (unit, call the React binding through `renderToString`: `$48.00` for `en-US`; `48,00 €` for `de-DE` and `EUR`). `[T5] price: AT-3 ...` (shim: `price: 4800`). `[T5] price: AT-4 ...` (accessibility tree text of fixture `sale`).

### Acceptance

M1-R9 with `<id>` = `price`. `grep -c "use client" components/price/react/price.tsx` prints `0`.

### Out of scope

PriceRange, unit prices, client-side money formatting, any Hydrogen import other than `formatMoney`.

### If blocked

Default path only. If `pnpm gen` does not write the generated regions for a hand-written component: draft pull request naming `src/gen/react.ts`, `remix.ts` or `liquid.ts`.

---

## M1-T11 `<pkg>/react`: `src/react/` with `useElement`, `RestProps`, JSX types for custom elements and Invoker attributes

- **Goal:** Provide `useElement`, `RestProps` and the React entry so hand-written React bindings can be written.
- **Depends on:** M1-T01.
- **Kind:** `runtime`.

### Read first

`docs/06-bindings.md`: `### 6.1 Rules` (5 kB), `### 6.2 ` (6 kB; stop at `#### Fallback (SPIKE-10)`, then read the numbered list "Semantics an implementer MUST keep"), `### 6.3 ` (2 kB). `docs/01-architecture.md`: search `src/react/**` in section 2 (the import rule row).

### Files

Create: `src/react/use-element.ts`. Replace the bring-up stub: `src/react/index.ts`. Generated, do not edit: `src/react/jsx.generated.ts` (written by `pnpm gen`, M0-T19). MUST NOT create `src/react/hooks.ts` (M1-T25).

### Steps

1. Branch `task/M1-T11-react-entry`.
2. Copy the code block `// src/react/use-element.ts` of section 6.2 unchanged.
3. Write `src/react/index.ts` as the block `// src/react/index.ts` of section 6.2 WITHOUT its one line that exports from `"./hooks.ts"`, and put in that place the line `// PLAN 4.4: M1-T25 adds the hooks export here.`
4. `pnpm gen` (the JSX file lists the element tags present in the manifest; in bring-up it is a subset of the list printed in section 6.3; that is expected).
5. `pnpm typecheck && pnpm gen --check && pnpm build && pnpm examples:install && pnpm test --no-skips`.

### Names and values

Exports of `src/react/index.ts` after this task: `useElement`, type `UseElementOptions`, type `RestProps`, and the side-effect import `./jsx.generated.ts`. Semantics 1 to 4 of the list in section 6.2 are normative.

### Tests

The specs name no unit-test file for `src/react/`. Its gates are tier 4 (`test/hydration/react.test.ts`), which first exercises `useElement` in M1-T15 and M1-T17, and `src/architecture.test.ts` (import rules). Do not invent a test file. Record in the done file: "no unit test specified for src/react (docs/06-bindings.md is silent)".

### Acceptance

`pnpm typecheck` exits 0; `pnpm ci` exits 0; `grep -c "useLayoutEffect" src/react/use-element.ts` is at least `1`; `grep -c "@ui-sdk/react" -r src/react` prints `0` for every file.

### Out of scope

`useCart`, `useRegionHtml` (M1-T25). Any React component. `@ui-sdk/react`.

### If blocked

None expected.

---

## M1-T12 `<pkg>/remix`: `src/remix/` types and host extras

- **Goal:** Provide the Remix entry: types only.
- **Depends on:** M1-T01.
- **Kind:** `runtime`.

### Read first

`docs/06-bindings.md`: `### 7.1 Rules` (3 kB), `### 7.2 ` (2 kB), `### 7.3 Host extras, complete table` (1 kB).

### Files

Replace the bring-up stub: `src/remix/index.ts`. Generated: `src/remix/jsx.generated.ts`.

### Steps

1. Branch `task/M1-T12-remix-entry`.
2. Copy the block `// src/remix/index.ts` of section 7.2 unchanged.
3. `pnpm gen`, then the commands of PLAN 5.0.

### Names and values

`src/remix/**` contains types only. Exactly one external import, type-only: `import type {} from "remix/component";`. Export: type `RestProps` (omits `class`, `className`, `children`, `mix`, `role`).

### Tests

None named by the specs. Gates: `pnpm typecheck`; `[T2]` Remix conformance cases of the existing components still pass.

### Acceptance

`pnpm ci` exits 0. `grep -v "^import type\|^import \"./jsx.generated.ts\"\|^export type\|^/\*\*\|^ \*\|^$\|^//" src/remix/index.ts` prints nothing that is a runtime statement.

### Out of scope

Any runtime helper; `@remix-run/ui`; `Frame`.

### If blocked

Node below 24.3: the Remix cases skip and `--no-skips` fails. Use Node 24.

---

## M1-T13 Element `rp-quantity` (`src/elements/rp-quantity.ts` and test)

- **Goal:** Ship the `rp-quantity` custom element from the spec's complete source, with its 14 test cases.
- **Depends on:** M0-T45.
- **Kind / recipe:** `element`; recipe E.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/04-elements.md` | `## 7. Rules for writing an ` | 6 kB |
| `docs/04-elements.md` | `## 8. Worked example: ` (8.1 to 8.6, whole) | 18 kB |
| `docs/04-elements.md` | `### 3.5 ` (the Announcer; needed for Q-11, Q-12) | 3 kB |
| `docs/components/quantity-input.md` | in `### HTML contract`, only the fenced HTML of fixtures `default` and `default-value` | 2 kB |
| `docs/research/spikes/elements-runtime/test.mjs` | search `quantity` (the spike form of Q-1 to Q-12; port, do not copy the page) | 5 kB of 19 kB |
| `docs/13-testing.md` | `### 2.5 ` and `### 5.1 ` (`openPage`) | 6 kB |

### Files

Create: `src/elements/rp-quantity.ts` (M0-T26 creates no file at this path), `src/elements/rp-quantity.test.ts`. Change: `src/elements/index.ts` (one line, section 0.5). MUST NOT change: `src/gen/elements.json`, `src/runtime/**`.

### Steps

1. `git fetch origin && git switch -c task/M1-T13-rp-quantity origin/main && pnpm install --frozen-lockfile`.
2. Copy the code block of section `### 8.4 ` unchanged into `src/elements/rp-quantity.ts`.
3. In `src/elements/index.ts` add the line `import "./rp-quantity"` at the position `docs/04-elements.md` section 4.1 prints it (after `import "./rp-carousel"` when that line is present, otherwise after `import "./rp-dialog"` when present, otherwise directly after `import "../runtime/index"`), and remove the bring-up line M0-T26 left for `rp-quantity`, if any (section 0.5; ledger D-134 item 28). `pnpm typecheck && pnpm build`. `pkg/browser/ripple.elements.js` now defines `rp-quantity`.
4. Write `src/elements/rp-quantity.test.ts`: one test per row of the table in section 8.6. Pages are built with M1-R11 and M1-R12: body = the fixture HTML named by the row (from `docs/components/quantity-input.md`), script `/ripple.elements.js`. Q-1 installs the `MutationObserver` in a classic script at the end of `<body>`. Q-12 wraps the fixture in `<dialog>` together with the Announcer markup of section 3.5 and opens it with `showModal()` through `page.evaluate`.
5. Proof commands (Acceptance). Then PLAN 5.0.

### Names and values

- Tag `rp-quantity`; events `valuechange` (`detail.value`, `detail.reason`; reasons `increment-press`, `decrement-press`, `input-commit`, `imperative`: the list of section 8.3 wins); `api` keys exactly `getValue`, `setValue`, `increment`, `decrement`; property `value`.
- Fixture `default`: value 1, min 1. Fixture `default-value`: value 3, min 1, max 5.

### Tests (`src/elements/rp-quantity.test.ts`)

`[T3] rp-quantity: Q-1 ...`; `[T5] rp-quantity: Q-2 ...` to `[T5] rp-quantity: Q-14 ...` (13 tests). None carries `[chromium]` (E-13 and E-26 of section 13 are these cases and are marked X). The only fixed wait: the 500 ms window of Q-11 and Q-12, written as `waitForFunction` with `timeout: 500`.

### Acceptance

```bash
pnpm typecheck && pnpm build
pnpm test:run --tiers=3,5 --files=src/elements/rp-quantity --no-skips   # 14 passed, 0 failed, 0 skipped
grep -c "definePrimitive(" src/elements/rp-quantity.ts                  # 1
grep -c "createParts(" src/elements/rp-quantity.ts                      # 1
grep -c '^import "./rp-quantity"' src/elements/index.ts                  # 1
pnpm test:size && pnpm ci
```

### Out of scope

The QuantityInput component (M1-T15). The agent test E-17 (M1-T40). `src/runtime/element.ts` (SPIKE-04 fallback). Any change to the code of section 8.4: when it does not compile or a Q case fails, fix the smallest thing, and list the difference from the spec in the pull request under "Notes for later tasks".

### If blocked

SPIKE-04 is not run yet (it is M1-T14, which uses this task's test file): build the default path. A size budget failure: stop, draft pull request with the measured sizes (PLAN 7.3).

---

## M1-T14 SPIKE-04 `rp-root-only-primitive`: run and report

- **Goal:** Measure whether a root-only `definePrimitive` + `createParts` element works in Chromium, WebKit and Gecko, and write the report.
- **Depends on:** M1-T13.
- **Kind:** `spike` (PLAN 3.4; M1-R15 to M1-R19).

### Read first

`docs/00-decisions.md`: the row `SPIKE-04` of the table in `## 3. Spike tasks` (1 kB). `docs/04-elements.md`: `### 2.2 Kernel facts Ripple relies on` (3 kB), the first paragraph and item 5 of `### Fallback (SPIKE-04)` (do not read the fallback code), section `### 8.6 ` (4 kB). `docs/research/spikes/elements-runtime/README.md` (what was already run in Chromium).

### Files

Create: `docs/research/spikes/rp-root-only-primitive/README.md`. Change: `docs/00-decisions.md` (one sentence, M1-R17). No file under `src/`, `test/`, `components/`.

### Steps

1. Branch `task/M1-T14-spike-04`. `pnpm build`.
2. Chromium: `pnpm test:run --tiers=3,5 --files=src/elements/rp-quantity --no-skips`. Record each test name and result.
3. Engines: M1-R18. Then `pnpm test:webkit --files=src/elements/rp-quantity` and `pnpm test:firefox --files=src/elements/rp-quantity`. Record each test name and result, and the browser versions Playwright prints (`pnpm exec playwright --version`).
4. Write the report (M1-R16). The check rows are: upgrade without mutation (Q-1); events and veto (Q-2 to Q-6, Q-13); live property (Q-7, Q-14); `api` keys (Q-8); descendant replacement (Q-9); disconnect and reconnect (Q-10); announcements (Q-11, Q-12); agent bridge.
5. The agent-bridge row cannot be run in this task: `src/agent/index.ts` is a bring-up stub until M1-T40. Write it under `## Not run` with the text `agent bridge: run by M1-T40 (test E-17 for rp-quantity); M1-T40 appends the result here`. Chromium evidence from before exists in `docs/research/spikes/elements-runtime/results-test.txt`; cite it, do not count it as a result of this run.
6. Verdict: `FALLBACK required` when any Q case fails in any engine that was run and the failure is in the element (not in the test). Otherwise `DEFAULT holds`, with `(Chromium only)` per M1-R18 when the engines were not available.
7. Ledger sentence (M1-R17). PLAN 5.0.

### Acceptance

The report exists with the six headings of M1-R16 and one result row per (check, engine). `git diff --stat origin/main` lists only the report and `docs/00-decisions.md`. `pnpm ci` exits 0.

### Out of scope

Applying "Fallback (SPIKE-04)". Changing `src/elements/rp-quantity.ts` or its test: a test defect found here is reported in the pull request and fixed by a follow-up, except a wrong `[chromium]` tag, which this task may remove.

### If blocked

No WebKit or Gecko build: M1-R18 (report Chromium, list the rest under `## Not run`). M1-T16, M1-T26, M1-T27, M1-T28 and M1-T43 then proceed on the default path. Verdict `FALLBACK required`: M1-R19; those five tasks wait for the follow-up row (PLAN 7.2).

---

## M1-T15 QuantityInput (`quantity-input`)

- **Goal:** Ship QuantityInput, the first `native` component: server markup that works without JavaScript, upgraded by `rp-quantity`.
- **Depends on:** M1-T03, M1-T11, M1-T12, M1-T13, M1-T47.
- **Kind / recipe:** `native`, Liquid tier `block`; recipe N. `status: "stable"`. First `native` component: from this task on, every proof exports `RIPPLE_NETWORK=1` (section 0.2).

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/quantity-input.md` | whole file | 37 kB |
| `docs/10-components-interactive.md` | `### 0.2 Rules that apply to every component in this document`, `### 0.3 ` | 10 kB |
| `docs/04-elements.md` | `### 10.14 QuantityInput` | 1 kB |
| `docs/13-testing.md` | `### 9.1 ` items 1 to 6 (how a `[T4]` test renders React), `### 10.1 ` | 7 kB |

Do not read `docs/04-elements.md` section 8 (the element exists). Read `docs/06-bindings.md` `### 6.2 ` (`useElement`) only when the React binding does not typecheck.

### Files

Create: `components/quantity-input/quantity-input.json`, `quantity-input.css`, `quantity-input.test.ts`, `react/quantity-input.tsx` (hand-written below the generated header region). Generated (commit): `fixtures/*.html` (8 files, `generated: "template"`), `html/quantity-input.html`, `remix/quantity-input.tsx`, `liquid/blocks/quantity-input.liquid`, `liquid/snippets/rp-quantity-input.liquid`, `liquid/locales/quantity-input.json`, `test/visual/snapshots/quantity-input/*.json`. Change: `locales/en.default.json`.

### Steps

1. Branch `task/M1-T15-quantity-input`. Recipe N, all steps.
2. Manifest from the spec (M1-R5). `element` is `rp-quantity`; `liquid.tier` `block`; `liquid.embeddedBy` `["product-form", "cart-line"]`; `noJs.level` `degraded`; `dependencies` contains `icon`.
3. CSS: copy the spec's `### Styling` block unchanged.
4. `pnpm gen`. Compare the generated Liquid snippet with the complete `snippets/rp-quantity-input.liquid` printed in the spec's `### Host notes`, and the generated Remix binding with the Remix note there.
5. Write `react/quantity-input.tsx` below the generated header: first line of the hand part is `"use client"`; `useElement(ref, { props: { value }, events: { valuechange } })`; uncontrolled initial value through `useState`; the exact code is in the spec's `### Host notes` (React). Copy it.
6. Tests, then M1-R9 with `<id>` = `quantity-input`.

### Names and values

- Fixtures (8): `default`, `default-value`, `at-max`, `line`, `disabled`, `escaping`, `invalid-enum-falls-back`, `class`. No fixture passes `required` (spec AT-16).
- Prop `required` (boolean, default `false`; ledger D-116): prints `required` on the input directly after `value` (after `form` when `formId` is passed) and before `disabled`; absent when false. It is in `props[]` like every other prop of the Props table.
- Root `rp-quantity.rp-quantity`; parts `rp-quantity-button` (two buttons, each embeds Icon), `rp-quantity-input`. `id` is optional.
- Locale keys in `locales/en.default.json` (M1-R6): `ripple.quantity-input.label` = `Quantity`, `ripple.quantity-input.decrease`, `ripple.quantity-input.increase` (values: the spec; the accessible names asserted by AT-9 are `Decrease quantity` and `Increase quantity`).
- Remix: prop `rmxKey`; both buttons carry `data-rmx-preserve-attrs="disabled"`.
- One Liquid schema setting: `size`.
- Rules (5): `quantity-needs-input`, `quantity-one-input`, `quantity-needs-decrement`, `quantity-needs-increment`, `quantity-not-in-control`.
- Trap: before upgrade both buttons compute `visibility: hidden` (they keep their box); do not use `display: none`.

### Tests (`components/quantity-input/quantity-input.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance) |
| AT-2 | `[T3] quantity-input: AT-2 ...` (boxes and `visibility` before and after upgrade; the zero-mutation half is generic) |
| AT-3 to AT-11 | nine `[T5] quantity-input: AT-<n> ...` tests on `fixturePageUrl("quantity-input/<fixture>")`; AT-11 with `{ dir: "rtl" }`. AT-3, AT-5 without `[chromium]` |
| AT-12 | `[T6] quantity-input: AT-12 ...`, `openPage({ scripts: "disabled" })`, the fixture wrapped in a `<form>` by an M1-R11 page; no `[chromium]` |
| AT-13 | `[T4] quantity-input: AT-13 ...` (controlled `value`; the mechanics of `docs/13-testing.md` section 9.1 items 1 to 3; the "logs no warning in both script orders" half is generic) |
| AT-14 | `[T4] quantity-input: AT-14 ...` on the routes `/__rp/morph/a?c=quantity-input` and `/__rp/morph/b?c=quantity-input` of `examples/remix` (M1-T47; `docs/13-testing.md` section 9.2), started with `startExample("remix")` of `test/support/examples.ts`. The spec asks for fixture `default-value` with `rmxKey="qty"`; the routes render the `default` fixture props. When the route cannot render `default-value`, assert the same observations starting from `default` (value 1, two clicks give 3) and state it in the pull request |
| AT-15 | comment, tier 9 form of M1-R7 naming AT-3, AT-5, AT-12 |
| AT-16 | `[T2] quantity-input: AT-16 ...` (the spec marks it T2; no fixture, a unit test of each binding): render each binding with `required` true and assert the input prints `required` directly after `value` (React and Remix through the host adapters; Liquid through the shim) |
| rules | five M1-R8 tests plus the default-fixture test |

### Acceptance

M1-R9. `ls components/quantity-input/fixtures | wc -l` prints `8`. `grep -c '"use client"' components/quantity-input/react/quantity-input.tsx` prints `1`.

### Out of scope

ProductForm and CartLine (they embed this snippet later). `src/elements/rp-quantity.ts`. The spec's `### Fallback (SPIKE-04)`.

### If blocked

`pnpm gen` writes a Liquid snippet that differs from the spec: M1-R10 (draft pull request; do not edit generated output). SPIKE-04 verdict unknown: default path.

---

## M1-T16 Element `rp-dialog` (`src/elements/rp-dialog.ts` and test, including E-31 and E-32 of D-131)

- **Goal:** Ship the `rp-dialog` element (host of a native `<dialog>`) from the spec's complete source, with tests E-05 to E-09, E-11, E-12, E-31 and E-32 (E-31 and E-32: ledger D-131, owner D-145).
- **Depends on:** M1-T14.
- **Kind / recipe:** `element`; recipe E.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/04-elements.md` | `## 7. Rules for writing an ` | 6 kB |
| `docs/04-elements.md` | `### 9.1 ` | 17 kB |
| `docs/04-elements.md` | `### 3.3 ` items list only (not the code; 2 kB), `### 3.4 ` (4 kB) | 6 kB |
| `docs/04-elements.md` | `### 10.1 Dialog` (the markup to put on the page) | 3 kB |
| `docs/04-elements.md` | in `## 13. Acceptance tests`: the "Page P" table rows 1 and 2, and rows E-05 to E-09, E-11, E-12, E-31, E-32 | 5 kB |
| `docs/research/spikes/elements-runtime/test-dialog2.mjs` and, in `test.mjs`, search `dialog` | 5 kB |
| `docs/research/spikes/rp-root-only-primitive/README.md` | `## Verdict` | 1 kB |

### Files

Create: `src/elements/rp-dialog.ts` (M0-T26 creates no file at this path), `src/elements/rp-dialog.test.ts`. Change: `src/elements/index.ts` (one line, section 0.5). MUST NOT change `src/runtime/opener.ts`, `src/runtime/commands-polyfill.ts`.

### Steps

1. Branch `task/M1-T16-rp-dialog`.
2. Copy the complete source of section 9.1 unchanged into `src/elements/rp-dialog.ts`. In `src/elements/index.ts` add the line `import "./rp-dialog"` directly after `import "../runtime/index"` (its position in section 4.1) and remove the bring-up line M0-T26 left for `rp-dialog`, if any (section 0.5; ledger D-134 item 28). `pnpm typecheck && pnpm build`.
3. Write the tests. Page (M1-R11, M1-R12): the opener of section 10.1 (Button `dialog-opener`), then the Dialog of section 10.1 (dialog id `size-guide`). Insert the closer of section 10.1 (IconButton `dialog-closer`) as the last child of the `<dialog>` of section 10.1 (this placement is the plan's instruction; 10.1 rule 3 requires the closer inside the `<dialog>`). Script `/ripple.elements.js`. E-31: the same page with `<input type="text" name="q">` inserted into the `<dialog>` directly after its `h2` (the row requires a text input inside the dialog; 10.1 prints none). E-12 uses the `default-open` markup: the section 10.1 dialog with id `promo` and `data-default-open=""` on the `<dialog>` (the Dialog component spec does not exist in the repository tree as a fixture yet; build the markup from section 10.1 and the E-12 row).
4. Proof commands. PLAN 5.0.

### Names and values

- Event `openchange`, `detail.value` boolean, `detail.reason` one of `trigger-press`, `close-press`, `escape-key`, `outside-press`, `link-press`, `imperative`.
- `api`: `isOpen`, `open`, `close`, `setOpen`. Property `open` (a write is silent). Agent actions `open`, `close`.
- The host `rp-dialog` writes no attribute on itself (E-09).

### Tests (`src/elements/rp-dialog.test.ts`)

`[T5] rp-dialog: E-05 ...`, `E-06`, `E-07`, `E-08`, `E-09`, `E-11` (returns early with a passing assertion `window.navigation === undefined` where the Navigation API is missing; it is not a skip), `E-12`, `[T5] rp-dialog: E-31 ...` (both steps (a) and (b) of the row in one test), `[T5] rp-dialog: E-32 ...` (two tests are allowed: names `[T5] rp-dialog: E-32 persisted pagehide closes the dialog ...` and `[T5] rp-dialog: E-32 non-persisted pagehide keeps it open ...`). E-05 and E-06 carry no `[chromium]` tag. E-07 uses the 50 ms the spec states. E-10 (link opener) and E-01 are M3-T10, E-23 is M3-T14 (ledger D-145); Drawer AT-3 (M1-T18) also exercises the link opener.

### Acceptance

```bash
pnpm typecheck && pnpm build
pnpm test:run --tiers=5 --files=src/elements/rp-dialog --no-skips   # 9 or 10 passed (E-32 as one or two tests), 0 failed, 0 skipped
grep -c '^import "./rp-dialog"' src/elements/index.ts             # 1
pnpm test:size && pnpm ci
```

### Out of scope

The Dialog and Drawer components. `rp-carousel`, `rp-navigation-menu`. The SPIKE-05 fallback (`button[data-rp-open]`, `data-rp-close`).

### If blocked

SPIKE-04 verdict `FALLBACK required`: do not start; wait for the follow-up row (PLAN 7.2). Verdict `DEFAULT holds (Chromium only)`: build the default path.

---

## M1-T17 Dialog (`dialog`)

- **Goal:** Ship Dialog with its five part components in all four hosts.
- **Depends on:** M1-T01, M1-T03, M1-T04, M1-T11, M1-T12, M1-T16, M1-T47.
- **Kind / recipe:** `native`, Liquid tier `parts`; recipe N. `status: "stable"`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/dialog.md` | whole file | 32 kB |
| `docs/10-components-interactive.md` | `### 0.2 ` | 7 kB |
| `docs/06-bindings.md` | in `### 6.6 `, the Dialog code only (stop at the Tabs code) | 4 kB |
| `docs/07-manifest-registry-cli.md` | in `#### 1.7.2 `, the `json` block only (the key shape of a `native` `parts` component; values come from the spec, ledger D-134 item 6). The whole section is 15.8 kB | 13 kB |
| `docs/13-testing.md` | `### 5.5 ` (`checkPattern` in the page), `### 9.1 ` items 1 to 6 | 4 kB |

Total about 60 kB.

Open `docs/06-bindings.md` `### 7.6 ` (Remix) or `### 8.6 ` (Liquid) only when a generated file looks wrong; read the Dialog part only.

### Files

Create: `components/dialog/dialog.json`, `dialog.css`, `dialog.test.ts`, `react/dialog.tsx` (hand-written below the generated header; code of section 6.6; it exports the six components and their props types `OpenChangeDetail` and `<Component>Props` as section 6.6 prints them, ledger D-134 item 10). Generated (commit): `fixtures/*.html` (5), `html/dialog.html`, `remix/dialog.tsx`, six files in `liquid/blocks/` (the root block and one per part; names as `pnpm gen` writes them), `liquid/locales/dialog.json`, visual snapshots. No change to `locales/en.default.json`: the schema name keys `ripple.dialog.name` and `ripple.dialog.<part>_name` are generated into `liquid/locales/dialog.json` (M1-R6, ledger D-134 item 29). `components/button/button.test.ts` and `components/icon-button/icon-button.test.ts` are NOT changed; the owed tier 5 halves are written here (Tests).

### Steps

1. Branch `task/M1-T17-dialog`. Recipe N.
2. Manifest from the spec; compare its shape with section 1.7.2. Root `id` is required. `noJs.level` `degraded`.
3. CSS from the spec's `### Styling`.
4. `pnpm gen`; write `react/dialog.tsx` from section 6.6 (controlled `open`, `onOpenChange`).
5. Tests; M1-R9 with `<id>` = `dialog`.

### Names and values

- Fixtures (5): `default` (id `size-guide`), `composed` (id `remove-item`, size `lg`), `default-open` (id `promo`), `invalid-enum-falls-back` (id `d1`), `class` (id `d2`).
- Root `rp-dialog.rp-dialog` wrapping one `<dialog>` (panel, class `rp-dialog-panel`); parts header, title (an `h2` with id `<id>-title`), description, body, footer. Exports: `Dialog`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogBody`, `DialogFooter`.
- Remix: `data-rmx-key` on the root and `data-rmx-preserve-attrs="open"` on the `<dialog>`, as the spec's Host notes print.
- One schema setting: `size`.
- Rules (4): `dialog-needs-title`, `dialog-not-open-in-server-html`, `dialog-one-title`, `dialog-not-nested`.
- Trap: `rp-dialog` has a 0 by 0 box and MUST still pass `checkVisibility()`; the server never prints `open` on the `<dialog>` (fixture `default-open` prints `data-default-open=""`).

### Tests (`components/dialog/dialog.test.ts`)

| Id | Form |
|---|---|
| AT-1 | comment, generic |
| AT-2, AT-3 | `[T3] dialog: AT-2 ...`, `[T3] dialog: AT-3 ...` |
| AT-4 to AT-9 | six `[T5]` tests on M1-R11 pages, script `/ripple.elements.js`. AT-4 to AT-7: `components/button/fixtures/dialog-opener.html`, then `components/dialog/fixtures/default.html`. AT-8: the same page; for its `size="full"` half, the test replaces `data-size="md"` by `data-size="full"` in the `default.html` string before building the page (this edit is allowed: no fixture has `size="full"`). AT-9: `components/dialog/fixtures/composed.html`, preceded by `components/button/fixtures/dialog-opener.html` with `size-guide` replaced by `remove-item` (the `composed` dialog id). AT-4, AT-5, AT-6 carry no `[chromium]` |
| AT-10 | `[T4] dialog: AT-10 ...` |
| AT-11 | Two lines (this task does not depend on the commerce runtime). First sentence (a region refresh inside the open dialog keeps it open): `// AT-11: covered by M1-T38 (components/cart-drawer/cart-drawer.test.ts: [T5] cart-drawer: AT-3 ...)`; it runs the `html` strategy, which is the Remix default (D-090). Second sentence (a navigation from a link inside the open dialog closes it with reason `link-press`): `// AT-11: covered by M1-T16 (src/elements/rp-dialog.test.ts: E-11)` |
| AT-12 | `[T6] dialog: AT-12 ...` |
| AT-13 | comment, tier 9 form naming AT-4, AT-5, AT-6 |
| AT-14 | `[T5] dialog: AT-14 ...` with `checkPattern` of `test/support/in-page.ts` |
| owed | `[T5] dialog: button AT-8 link opener opens the dialog with scripts on` and `[T5] dialog: icon-button AT-6 ...` (the tier 5 halves the Button and IconButton tasks deferred to this file; statement text from those two specs). Pages (M1-R11): `components/button/fixtures/link-opener.html` (respectively `components/icon-button/fixtures/link-opener.html`), then `components/dialog/fixtures/default.html` with every `size-guide` replaced by `cart-drawer` (the opener targets `cart-drawer`) |
| rules | four M1-R8 tests plus the default-fixture test |

### Acceptance

M1-R9. `ls components/dialog/liquid/blocks | wc -l` prints `6`. `ls components/dialog/fixtures | wc -l` prints `5`.

### Out of scope

Drawer, CartDrawer, Popover. `src/elements/rp-dialog.ts`. The SPIKE-05 fallback attributes.

### If blocked

`checkPattern("dialog")` on a native `<dialog>` is UNVERIFIED (spec, "Evidence and UNVERIFIED"; D-108). If AT-14 fails inside `checkPattern` and not because of the markup: set `a11y.checkPattern` to `null` in `components/dialog/dialog.json`, replace the test with `// AT-14: removed (docs/components/dialog.md UNVERIFIED, D-108)`, and paste the checker message into the pull request. The numbers of the other tests do not change; the pull request is not a draft.

---

## M1-T18 Drawer (`drawer`)

- **Goal:** Ship Drawer: the Dialog pattern as an edge panel, including the link opener.
- **Depends on:** M1-T01, M1-T03, M1-T04, M1-T05, M1-T17.
- **Kind / recipe:** `native`, Liquid tier `parts`; recipe N. `status: "stable"`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/drawer.md` | whole file | 27 kB |
| `docs/10-components-interactive.md` | `### 0.2 `, `### 0.3 ` | 9 kB |
| `docs/06-bindings.md` | in `### 6.6 `, the Dialog code only (the file `drawer.tsx` copies; stop at the Tabs code) | 4 kB |
| `docs/04-elements.md` | `### 10.2 Drawer, with a link opener` | 3 kB |
| repository: `components/dialog/dialog.json`, `components/dialog/react/dialog.tsx`, `components/dialog/dialog.test.ts` | whole files (the model to follow) | 12 kB |

### Files

Create: `components/drawer/drawer.json`, `drawer.css`, `drawer.test.ts`, `react/drawer.tsx`. Generated: `fixtures/*.html` (6), `html/drawer.html`, `remix/drawer.tsx`, six files in `liquid/blocks/`, `liquid/locales/drawer.json`, visual snapshots. Change: `locales/en.default.json`.

### Steps

1. Branch `task/M1-T18-drawer`. Recipe N.
2. Manifest: start from `components/dialog/dialog.json`, then apply every difference the spec lists (class prefix `rp-drawer`, prop `side`, part names, fixtures, rules). `element` stays `rp-dialog`.
3. `react/drawer.tsx`: `components/dialog/react/dialog.tsx` (the code of `docs/06-bindings.md` section 6.6) with the substitutions the spec's Host notes list. Nothing else changes; the file exports the six components and their props types (ledger D-134 item 10).
4. Tests; M1-R9 with `<id>` = `drawer`.

### Names and values

- Root class `rp-drawer` (root `rp-dialog.rp-drawer`), panel class `rp-drawer-panel` (CONVENTIONS section 10).
- Fixtures (6): `default` (id `filters`), `composed`, `bottom` (id `sheet`), `default-open` (id `welcome`), `invalid-enum-falls-back` (id `w1`), `class` (id `w2`).
- Prop `side`: `start`, `end`, `bottom`; default `end`; printed as `data-side`.
- Rules (3 own): `drawer-needs-title`, `drawer-one-title`, `drawer-not-nested`. The spec also applies `dialog-not-open-in-server-html`; add it to `rules[]` only if the spec's Checker rules table lists it as a rule of this manifest.
- Link opener markup for AT-3, AT-7, AT-8: the exact `<a>` printed in AT-3 of the spec.

### Tests (`components/drawer/drawer.test.ts`)

AT-1 comment. `[T3] drawer: AT-2 ...`. `[T5] drawer: AT-3 ...` to `AT-7` (AT-3 and AT-7 on an M1-R11 page: the link, then fixture `default`; no `[chromium]`; AT-5 with `dir: "rtl"`). `[T6] drawer: AT-8 ...`: the M1-R11 route table answers `GET /x` with status 200. `[T4] drawer: AT-9 ...`. AT-10 comment, tier 9 form naming AT-3, AT-7. Owed: `[T5] drawer: link AT-4 ...` (the Link spec's item 4, deferred by M1-T05). Rule tests per M1-R8.

### Acceptance

M1-R9. `ls components/drawer/fixtures | wc -l` prints `6`.

### Out of scope

CartDrawer, MobileNav, FilterDrawer. Any change to `components/dialog/**` or `src/runtime/opener.ts`.

### If blocked

Default path only. When the link opener does not open the drawer, the defect is in `src/runtime/opener.ts` (M0-T25): draft pull request naming E-10 of `docs/04-elements.md` section 13.

---

## M1-T19 SPIKE-05 `invoker-commands-hosts`: run and report

- **Goal:** Measure that React 19 and Remix 3 print `commandfor`, `command`, `popovertarget` and `popover=""` unchanged, and that the Invoker Commands polyfill works in WebKit and Gecko.
- **Depends on:** M1-T17.
- **Kind:** `spike`.

### Read first

`docs/00-decisions.md` row `SPIKE-05` (1 kB). `docs/04-elements.md`: `### 3.3 ` item list (3 kB), row E-23 of section 13, first paragraph of `### Fallback (SPIKE-05)`. `docs/06-bindings.md`: first paragraph of `### Fallback (SPIKE-05)` in `## 14. Fallbacks`. `docs/research/spikes/elements-runtime/test-polyfill.mjs` (1.5 kB).

### Files

Create: `docs/research/spikes/invoker-commands-hosts/README.md`, `docs/research/spikes/invoker-commands-hosts/print.test.ts` (the host-printing check, run by hand; not picked up by `test/run.ts`). Change: `docs/00-decisions.md` (one sentence).

### Steps

1. Branch `task/M1-T19-spike-05`. `pnpm build && pnpm examples:install`.
2. Check A (hosts print the attributes). The tier 2 cases already prove part of it: run `pnpm test:conformance --grep="button/dialog-opener|icon-button/"` and record the `react` and `remix` results (the reference HTML carries `commandfor` and `command`). For `popovertarget` and `popover=""` no slice component prints them: write `print.test.ts` that renders, with `react-dom/server` `renderToString` and with the Remix render function the Remix host adapter uses (`test/support/hosts/remix.ts`; import it, do not re-implement it), the two elements `<button popovertarget="p">x</button>` and `<div id="p" popover="">y</div>`, and asserts the output contains `popovertarget="p"` and `popover=""`. Run it with `node --experimental-strip-types --test docs/research/spikes/invoker-commands-hosts/print.test.ts` (Node 24).
3. Check B (polyfill in an engine without Invoker Commands). M1-R18. Run `pnpm test:webkit --files=components/dialog --grep="AT-4|AT-5|AT-6"` and the same with `test:firefox`; these are the Dialog tests with `ripple.elements.js` loaded. In the report record for each engine whether `"commandForElement" in HTMLButtonElement.prototype` is true (evaluate it once with `page.evaluate` in a scratch script and paste the value): when it is true the engine has the native feature and the polyfill was not exercised; say so.
4. Report (M1-R16). Verdict `FALLBACK required` when check A fails for a host, or check B fails in an engine where the polyfill was exercised.
5. Ledger sentence; PLAN 5.0.

### Acceptance

Report exists with one row per (check, host or engine). `git diff --stat origin/main` lists only the spike directory and the ledger. `pnpm ci` exits 0.

### Out of scope

Applying the fallback (`data-rp-open` / `data-rp-close` on buttons, `popover="auto"`). The Popover component (M3-T01).

### If blocked

No WebKit or Gecko build: M1-R18; check A is still complete. When `test/support/hosts/remix.ts` exports no function that renders an arbitrary element, record check A for `popovertarget` and `popover=""` on Remix under `## Not run` with that reason; M3-T01 (Popover) then settles it through tier 2.

---

## M1-T20 Commerce adapter core `src/commerce/adapter.ts`, `src/commerce/index.ts`, `DEFAULT_STRINGS` (test C-32)

- **Goal:** Land the backend-neutral commerce adapter and the `<pkg>/commerce` entry, inert until a backend task adds its line.
- **Depends on:** M0-T45.
- **Kind:** `runtime`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/05-commerce.md` | `## 1. Reference implementation` (with the change table of 18 rows) | 7 kB |
| `docs/05-commerce.md` | `## 3. Files` | 3 kB |
| `docs/05-commerce.md` | `## 4. The adapter API` (4.1 to 4.6) | 19 kB |
| `docs/05-commerce.md` | `### 8.2 ` (only for change row 8) | 3 kB |
| `docs/05-commerce.md` | `### 9.2 ` (only the code added to `errorMessage` and `hasUserError`, change row 12) | 4 kB |
| `docs/research/spikes/commerce/src/commerce/adapter.ts` | whole (the file to copy) | 21 kB |
| `docs/research/spikes/commerce/src/commerce/index.ts` | whole | 2 kB |

Total about 60 kB. Do not read `## 2. Model` or the other parts of sections 5 to 16.

### Files

Create: `src/commerce/adapter.ts`, `src/commerce/dialect.ts`, `src/commerce/adapter.test.ts`. Replace the bring-up stub `src/commerce/index.ts` (M0-T26 wrote it as the two lines `// PLAN 4.4: stub, replaced by M1-T20` and `export {}`). Change: `locales/en.default.json` (seven keys). MUST NOT create any other file of `docs/05-commerce.md` section 3.

### Steps

1. Branch `task/M1-T20-commerce-adapter`.
2. `cp docs/research/spikes/commerce/src/commerce/adapter.ts src/commerce/adapter.ts` and `cp docs/research/spikes/commerce/src/commerce/dialect.ts src/commerce/dialect.ts`. `dialect.ts` is copied unchanged and only because `adapter.ts` imports its types (PR-6); M1-T21 owns it.
3. In `src/commerce/adapter.ts` apply the `adapter.ts` part of every row of the change table of section 1 whose "File" cell names `adapter.ts`: rows 8 (refresh history and `getOptions`), 11 (exports `registerFlush`, `hasUnsettled`, `settle`), 12 (`errorMessage` scope `"add"`, export `hasUserError`), 15 (`BackendParts.submit` and `RippleCommerce.submitCart` resolve `boolean`: `submitCart` returns `false` after `nativeSubmit(...)` in both places and otherwise `return await parts.submit(form, submitter, event)`; the inert `submitCart` is `() => Promise.resolve(false)`; ledger D-126) and 18 (option `routes`, passed through `resolveOptions` unchanged). The parts of these rows that name other files belong to the tasks of those files. Then compare the file with section 4.6: every export in its table MUST exist with the stated signature. Where a section 4 code block marked complete differs from the spike after the table rows are applied, the section 4 block wins (section 1, last paragraph before "Not run"); list each such difference in the pull request.
4. `DEFAULT_STRINGS`: the seven keys and English values of the table in section 4.3.
5. Add to `locales/en.default.json` the seven locale keys of section 4.3 with the same English values: `ripple.product-form.added`, `ripple.cart-lines.updated`, `ripple.cart-lines.removed`, `ripple.discount-code.applied`, `ripple.discount-code.removed`, `ripple.cart-note.saved`, `ripple.cart-lines.error`. (Later component tasks find them present and do not add them again.)
6. Write `src/commerce/index.ts`: the spike `index.ts` with these changes. (a) Delete the function `define(tag, connect)` and the five `connect...` imports and the two adapter imports. (b) `create()` and `defineElements()` are exactly:

   ```ts
   function create(): RippleCommerce {
     const options = resolveOptions();
     if (typeof AbortSignal.any !== "function" || typeof crypto?.randomUUID !== "function") {
       return createInertCommerce(options);
     }
     // PLAN 4.4 (hydrogen): M1-T23 replaces this line.
     // PLAN 4.4 (liquid): M1-T24 replaces this line.
     return createInertCommerce(options); // PLAN 4.4: M1-T26 restores the create() of docs/05-commerce.md.
   }

   function defineElements(): void {
     // PLAN 4.4: M1-T26, M1-T27, M1-T28, M4-T16, M4-T18 each add one define...() call here, in the order of docs/05-commerce.md section 4.5 item 6.
   }
   ```

   (c) Keep unchanged: the import from `./adapter`, the two `export` lines, and the final `if (typeof document !== "undefined") { registerStarter(create, defineElements); queueMicrotask(() => void getCommerce()); }`.
7. Write the test (Tests). Proof commands. PLAN 5.0.

### Names and values

Exports of `index.ts`: `getCommerce`, `configureCommerce`, types `CommerceOptions`, `CommerceStrings`, `RippleCommerce`. `src/commerce/**` import rules: `docs/01-architecture.md` section 2 (enforced by `src/architecture.test.ts`); `adapter.ts` imports only types from `@shopify/hydrogen`.

### Tests (`src/commerce/adapter.test.ts`)

`[T1] commerce: C-32 DEFAULT_STRINGS equals the seven locale values` (file placement: ledger D-141 (1), a row about one module): `Object.keys(DEFAULT_STRINGS)` has exactly the seven keys of section 4.3 and each value equals `locales/en.default.json` at the matching key. No other test is specified for this file; do not invent one.

### Acceptance

```bash
pnpm typecheck && pnpm gen --check && pnpm build
pnpm test:unit --files=src/commerce/adapter --no-skips
node -e 'import("./dist/commerce/index.mjs").then(()=>console.log("ok"))'   # prints ok, nothing on stderr (E-30)
pnpm test:size && pnpm ci
grep -c "export function registerFlush\|export function hasUnsettled\|export function settle\|export function hasUserError\|export function getOptions" src/commerce/adapter.ts   # 5
```

### Out of scope

Both backends, the refresh strategies, every `rp-*.ts` file, `globals.d.ts` (create it only if `pnpm typecheck` reports `window.Shopify` or `window.rpDomReady` as unknown; then it contains only the declarations section 5.2 item 4 names), `startStandardEvents` and change row 9 (M4-T21).

### If blocked

`adapter.ts` does not typecheck because a type it imports from `@shopify/hydrogen` is missing in the installed version: stop, draft pull request naming the type and the installed version (`pnpm why @shopify/hydrogen`). Do not write a local copy of the type.

---

## M1-T21 Form dialects `src/commerce/dialect.ts`

- **Goal:** Make `src/commerce/dialect.ts` equal to the spec's field tables and prove it with a unit test.
- **Depends on:** M1-T20.
- **Kind:** `runtime`.

### Read first

`docs/05-commerce.md`: `## 6. Form dialects` (6.1 to 6.4; 17 kB), `### 10.5 ` (1 kB), row 15 of the change table in `## 1. ` (1 kB). Repository: `src/commerce/dialect.ts` (6 kB).

### Files

Change: `src/commerce/dialect.ts` (already present, copied by M1-T20). Create: `src/commerce/dialect.test.ts`.

### Steps

1. Branch `task/M1-T21-dialect`.
2. Apply the `dialect.ts` part of change row 15 (ledger D-126): `translateLiquidForm` takes the third parameter `baseline` and `CartOp` gains `sent`, as section 6.3 prints them. Compare the file with section 6.1 (the `FormDialect` type and both tables, cell by cell), with section 6.3 (`translateLiquidForm(form, submitter, baseline)`) and with the Exports cell of the `dialect.ts` row in section 3: `CartIntent`, `CartOp`, `FormDialect`, `hydrogenDialect`, `liquidDialect`, `FIELD_TO_PROTOCOL`, `isCartIntent`, `translateLiquidForm`. Change the file only where it differs from the spec; list each change in the pull request. `dialect.ts` imports nothing.
3. Write the test. `pnpm typecheck && pnpm test:unit --files=src/commerce/dialect --no-skips && pnpm ci`.

### Tests (`src/commerce/dialect.test.ts`)

The specs name no test for this file (Plan reading; data only, no DOM):

- `[T1] dialect: hydrogen and liquid field names equal section 6.1`: assert each property of `hydrogenDialect` and `liquidDialect` against literals copied from the two columns of the 6.1 table.
- `[T1] dialect: isCartIntent accepts exactly the CartIntent values`: every value of the `CartIntent` union of 6.1 returns `true`; `"checkout"` and `""` return `false`.

`translateLiquidForm` needs a DOM form; it is covered by C-02, C-03, C-07 and C-08 (M1-T29).

### Acceptance

The commands of step 3 exit 0. `grep -c "^import" src/commerce/dialect.ts` prints `0`. `grep -c "baseline" src/commerce/dialect.ts` prints at least `1`.

### Out of scope

Form markup (section 6.2 is printed by components), the synthetic submit (6.4 lives in `adapter.ts`), both backends.

### If blocked

None expected.

---

## M1-T22 Refresh strategies `src/commerce/refresh-{html,liquid,remix,react}.ts`

- **Goal:** Add the four region refresh strategies.
- **Depends on:** M1-T20.
- **Kind:** `runtime`.

### Read first

`docs/05-commerce.md`: `## 8. Regions and refresh` (8.1 to 8.4; 14 kB); rows 4 and 5 of the change table in `## 1. ` (1 kB). Spike files `docs/research/spikes/commerce/src/commerce/refresh-html.ts` and `refresh-liquid.ts` (2 kB).

### Files

Create: `src/commerce/refresh-html.ts`, `src/commerce/refresh-liquid.ts`, `src/commerce/refresh-remix.ts`, `src/commerce/refresh-react.ts`. No other file.

### Steps

1. Branch `task/M1-T22-refresh`.
2. `cp` the spike `refresh-html.ts` and `refresh-liquid.ts` unchanged.
3. `refresh-remix.ts` and `refresh-react.ts`: copy the two complete files printed in section 8.3 (the code blocks after the bold labels **`remix`** and **`react`**). Do not copy the spike versions of these two files (change rows 4 and 5).
4. `pnpm typecheck`. When `RefreshStrategy` or `RefreshReason` is not exported by `src/commerce/adapter.ts` with the shape section 8.2 states, the defect is in M1-T20's file: fix `adapter.ts` in this branch with its own commit `M1-T22: fix src/commerce/adapter.ts: <what>`.
5. `pnpm build && pnpm test --no-skips && pnpm ci`. PLAN 5.0.

### Names and values

Exports: `refreshHtml`; `refreshLiquid`; `refreshRemix`; `refreshReact`, `getRegionHtml`, `subscribeRegionHtml`. `refresh-liquid.ts` imports the platform specifier `@shopify/partial-rendering` dynamically; it MUST stay a dynamic `import()` of that bare specifier (the bundler marks it external; `docs/04-elements.md` section 6).

### Tests

No unit test is specified for these files. Their gates: C-02, C-06 (M1-T29), C-09, C-10, C-13, C-25 (M1-T30), C-26 (M1-T45), C-27 (M4-T20). Record in the done file: "no unit test specified for src/commerce/refresh-*.ts".

### Acceptance

`pnpm typecheck` and `pnpm ci` exit 0. `ls src/commerce/refresh-*.ts | wc -l` prints `4`. The files are not yet imported by anything, so the size report does not change.

### Out of scope

`useRegionHtml` (M1-T25). The `STRATEGIES` table (M1-T23). "Fallback (SPIKE-10)" and "Fallback (SPIKE-11)".

### If blocked

None expected.

---

## M1-T23 hydrogen backend `src/commerce/adapter-hydrogen.ts` (without `rp-view-event`)

- **Goal:** Add the hydrogen backend and switch `create()` to it for the hosts `html`, `react`, `remix`.
- **Depends on:** M1-T21, M1-T22.
- **Kind:** `runtime`.

### Read first

`docs/05-commerce.md`: `### 5.1 ` (4 kB), `### 10.1 ` to `### 10.3 ` (10 kB), `### 12.1 ` (4 kB), rows 6, 11, 14, 16 and 18 of the change table in `## 1. ` (2 kB). Spike file `docs/research/spikes/commerce/src/commerce/adapter-hydrogen.ts` (4 kB). Repository: `src/commerce/index.ts`.

### Files

Create: `src/commerce/adapter-hydrogen.ts`. Change: `src/commerce/index.ts` (one import, one line).

### Steps

1. Branch `task/M1-T23-adapter-hydrogen`.
2. `cp` the spike file. Apply change row 6 (`remix: refreshRemix` in `STRATEGIES`).
3. Make the file equal to section 5.1 items 1 to 6: the checkout guard `onCheckoutClick` of item 5 (change row 11; code printed there; it needs `hasUnsettled` and `settle` from `./adapter`), the `submit` part of step 3 (change row 16, ledger D-127: a product form submitted without a submitter is sent as one synthetic `add`; every path returns `true`), and `afterReady` as the code of section 12.1 item 1 (change row 18, D-130: `initializeShopifyScripts` is called regardless of `options.analytics`, with `consent`, `routes` and a `navigate` wrapper). Change row 14 (`rp-view-event`) is M4-T21 (step 4).
4. `rp-view-event`: this task does NOT define it (PLAN note P-11). Where the spike or section 12 puts the definition into `afterReady`, write instead the single line `// PLAN 4.4: M4-T21 defines rp-view-event here (docs/05-commerce.md section 12.2).` Keep consent and cart analytics (`initializeShopifyScripts`, `trackCartAnalytics`) as section 12.1 states.
5. In `src/commerce/index.ts`: add `import { createHydrogenCommerce } from "./adapter-hydrogen";` and replace the line `// PLAN 4.4 (hydrogen): M1-T23 replaces this line.` with `if (options.backend === "hydrogen") return createHydrogenCommerce(options);`.
6. `pnpm typecheck && pnpm build && pnpm test --no-skips && pnpm test:size && pnpm ci`.

### Names and values

Value imports from `@shopify/hydrogen` allowed in this file only: `configureCartEndpoint`, `createCartStore`, `initializeShopifyScripts`, `trackCartAnalytics`. Export: `createHydrogenCommerce`. `options.backend` values: the `ResolvedOptions` type of `src/commerce/adapter.ts` (use the literal that type declares; `"hydrogen"` is the name the spec uses).

### Tests

None in this task. Gate: M1-T30 (C-09 to C-13, C-25). The size test is the proof here: `ripple.js` now contains the Hydrogen cart code.

### Acceptance

The commands of step 6 exit 0. `grep -c "PLAN 4.4 (hydrogen)" src/commerce/index.ts` prints `0`. Write the gzip size of `pkg/browser/ripple.js` that `pnpm test:size` prints into the done file.

### Out of scope

`rp-view-event`, the liquid backend, elements, C tests.

### If blocked

Size budget for `ripple.js` exceeded: stop and report the numbers (PLAN 7.3). A rebase conflict in `src/commerce/index.ts` with M1-T24: keep both `if` lines, hydrogen first.

---

## M1-T24 liquid backend `src/commerce/adapter-liquid.ts` (without `rp-view-event` and page view), `test/support/fake-sa.js`

- **Goal:** Add the liquid backend, switch `create()` to it for host `liquid`, and add the Standard Actions test double.
- **Depends on:** M1-T21, M1-T22.
- **Kind:** `runtime`.

### Read first

`docs/05-commerce.md`: `### 5.2 ` (4 kB), `### 10.4 ` (3 kB), `### 6.3 ` (4 kB), rows 9, 13 and 15 of the change table in `## 1. ` (2 kB). Spike files `docs/research/spikes/commerce/src/commerce/adapter-liquid.ts` (2 kB) and `docs/research/spikes/commerce/fake-sa.js` (3 kB). `docs/13-testing.md`: search `fake-sa.js` in `### 3.1 ` and rule `ST-2`.

### Files

Create: `src/commerce/adapter-liquid.ts`, `test/support/fake-sa.js`. May create: `src/commerce/globals.d.ts` (step 3). Change: `src/commerce/index.ts` (one import, one line).

### Steps

1. Branch `task/M1-T24-adapter-liquid`.
2. `cp docs/research/spikes/commerce/fake-sa.js test/support/fake-sa.js` (byte for byte; check with `cmp`). If the fixture page route `GET /__test/fake-sa.js` of `test/support/server.ts` already served a placeholder, the real file now replaces it.
3. `cp` the spike `adapter-liquid.ts`, then make it equal to section 5.2 items 1 to 6: `createCartStore()` synchronously, `cart.connect()` only inside `probe`, and `probe` exactly as the complete block of item 4 (change row 13, ledger D-122: it awaits `window.rpDomReady ?? Promise.resolve()` and checks `updateCart.isDefault()`); the Liquid `submit` part is the code of item 3 (change row 15, D-126: it passes the note and attribute `baseline` to `translateLiquidForm` and resolves `boolean`). When `pnpm typecheck` reports `window.rpDomReady` as unknown, declare `rpDomReady?: Promise<void>` on `Window` in `src/commerce/globals.d.ts` (change row 13; create the file with only the declarations section 5.2 item 4 names).
4. Remove `defineViewEvent` and its call (change row 9, first half). Do NOT add `startStandardEvents` (M4-T21). In its place write `// PLAN 4.4: M4-T21 adds startStandardEvents here (docs/05-commerce.md section 12.3).`
5. In `src/commerce/index.ts`: add `import { createLiquidCommerce } from "./adapter-liquid";` and replace the line `// PLAN 4.4 (liquid): M1-T24 replaces this line.` with `if (options.backend === "liquid") return createLiquidCommerce(options);`.
6. `pnpm typecheck && pnpm build && pnpm test --no-skips && pnpm test:size && pnpm ci`.

### Names and values

Value import from `@shopify/hydrogen`: `createCartStore` only. `configureCartEndpoint`, `trackCartAnalytics`, `initializeShopifyScripts` MUST NOT appear in this file. Export in M1: `createLiquidCommerce` (the second export `startStandardEvents` arrives with M4-T21).

### Tests

None in this task. Gate: M1-T29 (C-01 to C-08).

### Acceptance

Step 6 exits 0. `cmp docs/research/spikes/commerce/fake-sa.js test/support/fake-sa.js` prints nothing. `grep -c "configureCartEndpoint" src/commerce/adapter-liquid.ts` prints `0`. The gzip size of `pkg/registry/liquid/assets/ripple.js` is in the done file.

### Out of scope

`rp-view-event`, the page view, `rp-head` and the script that defines `window.rpDomReady` (owned by `src/runtime/commands-polyfill.ts` and doc 14; ledger D-122), real Standard Actions (SPIKE-01).

### If blocked

`test/support/fake-sa.js` is "byte for byte" the spike file; when C-05's `isDefault` case later needs behaviour the file lacks, that is M1-T29's finding, not a reason to edit the file here.

---

## M1-T25 `useCart` and `useRegionHtml` in `src/react/hooks.ts`

- **Goal:** Add the two React store hooks and export them from `<pkg>/react`.
- **Depends on:** M1-T11, M1-T22.
- **Kind:** `runtime`.

### Read first

`docs/06-bindings.md` `### 6.2 `: the code block `// src/react/hooks.ts`, the paragraph and block that start "`useRegionHtml`, in the same file", and items 5 to 8 of the numbered list "Semantics an implementer MUST keep" (5 kB). `docs/05-commerce.md` `### 10.3 React` (2 kB).

### Files

Create: `src/react/hooks.ts`. Change: `src/react/index.ts` (one line).

### Steps

1. Branch `task/M1-T25-react-hooks`.
2. Copy both code blocks of section 6.2 into `src/react/hooks.ts` (one file: `useCart`, then `useRegionHtml`), unchanged.
3. In `src/react/index.ts` replace the line `// PLAN 4.4: M1-T25 adds the hooks export here.` with the hooks export line of the `// src/react/index.ts` block of section 6.2 (`export { useCart, useRegionHtml } from "./hooks.ts";`). The file now equals the spec block.
4. `pnpm typecheck && pnpm gen --check && pnpm build && pnpm examples:install && pnpm test --no-skips && pnpm ci`.

### Names and values

`useCart<T>(selector: (state: CartState) => T, serverValue: T): T`. `useRegionHtml(name: string): string | null`. `hooks.ts` is the only file allowed to import `getRegionHtml` and `subscribeRegionHtml` from `src/commerce/refresh-react.ts`.

### Tests

None specified for this task. `[T4] react: useRegionHtml returns null during hydration and the HTML after the first publish` (`docs/13-testing.md` section 9.1) needs a `predictive` refresh; it is owned by M4-T22 (ledger D-145); do not write it here. First use of `useCart`: M1-T34.

### Acceptance

Step 4 exits 0. `grep -c "PLAN 4.4" src/react/index.ts` prints `0`. `diff <(sed -n '/^\/\/ src\/react\/index.ts/,/^```/p' docs/06-bindings.md | sed '1d;$d') src/react/index.ts` prints nothing (or only blank-line differences).

### Out of scope

Any component binding. `CartProvider` (does not exist in V1). "Fallback (SPIKE-10)".

### If blocked

`src/architecture.test.ts` rejects the import from `src/commerce/refresh-react.ts`: the import rule table of `docs/01-architecture.md` section 2 names this one exception; when the test does not allow it, the test is wrong: draft pull request naming the rule row.

---

## M1-T26 Element `rp-cart` (`src/commerce/rp-cart.ts` and test)

- **Goal:** Ship the `rp-cart` element (controller plus root-only shell) and restore `create()` to its final form.
- **Depends on:** M1-T14, M1-T23, M1-T24.
- **Kind / recipe:** `element`; recipe E.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/05-commerce.md` | `### 7.1 ` | 9 kB |
| `docs/05-commerce.md` | `### 7.7 Element shell` (the `rp-cart.ts` complete shell) | 5 kB |
| `docs/05-commerce.md` | `## 9. Mutations: who renders what` | 9 kB |
| `docs/05-commerce.md` | rows 1, 3, 10, 11, 15 and 17 of the change table in `## 1. ` | 2 kB |
| `docs/04-elements.md` | `## 7. Rules for writing an ` and `### 3.5 ` | 9 kB |
| `docs/research/spikes/commerce/src/commerce/rp-cart.ts` | whole | 7 kB |
| `docs/research/spikes/commerce/run.cjs` | lines of the constant that builds the Liquid page (search `const page`) and scenario `L1` | 3 kB |

### Files

Create: `src/commerce/rp-cart.ts`, `src/commerce/rp-cart.test.ts`. Change: `src/commerce/index.ts`.

### Steps

1. Branch `task/M1-T26-rp-cart`.
2. `cp` the spike `rp-cart.ts`. Apply change row 3 (import `announce` from `"../runtime/announcer"`; pass `from` on every call as section 9.1 states). Make the controller equal to section 7.1 where it differs; the spike predates these rows: row 10 (D-116 empty-quantity guard in the `submit` listener), row 11 (D-117: register a flush with `registerFlush` and record every action promise in `inflight`), row 15 (D-126: `run` announces nothing when the action resolved `false`, because `submitCart` resolves `boolean`), row 17 (D-129: the `submit` listener is the code of 7.1; with `usable === false` a form that carries `data-rp-js="inflow"` is prevented and shows `strings.error`).
3. Append the complete shell of section 7.7 (`rpCart`, `defineCart`) unchanged.
4. `src/commerce/index.ts`: (a) add `import { defineCart } from "./rp-cart";`; (b) in `defineElements()` add the line `defineCart();` above the `// PLAN 4.4:` comment and remove `M1-T26, ` from that comment; (c) replace the last line of `create()` (`return createInertCommerce(options); // PLAN 4.4: M1-T26 restores ...`): after this step the two backend lines and that line together read exactly `return options.backend === "liquid" ? createLiquidCommerce(options) : createHydrogenCommerce(options);` as in the spike `index.ts`.
5. Tests. `pnpm typecheck && pnpm build && pnpm test --no-skips && pnpm test:size && pnpm ci`.

### Names and values

Tag `rp-cart`; exports `connectCart`, `rpCart`, `defineCart`. Shell: `createParts(rpCart, { root: { tag: "rp-cart", display: "block", api: ["setQuantity", "remove", "lines"] } })`; `agent.actions` `["setQuantity", "remove"]`. No `checkout` action and no `checkout()` method (rule A-7 of `docs/08-agent-kit-and-evals.md`).

### Tests (`src/commerce/rp-cart.test.ts`; PR-8)

- `[T1] rp-cart: shell shape`: the file text contains exactly one `definePrimitive(` and one `createParts(`; the `createParts` argument has only the key `root`; contains `display: "block"`; contains no `data-state`; imports `announce` only from `../runtime/announcer` (the E-24 assertions of `docs/04-elements.md` section 13, for this file).
- `[T5] rp-cart: defines the element and shows the cart quantity`: an M1-R11 page with the Liquid page markup of the spike (`run.cjs`, the `page` constant, seeded cart as scenario L1), script `/ripple.js`, config element `"host": "liquid"`; after `getCommerce().ready`: `customElements.get("rp-cart")` is defined and the `[data-rp-part="count"]` text equals the seeded quantity.

### Acceptance

Step 5 exits 0. `grep -c "createInertCommerce(options); // PLAN" src/commerce/index.ts` prints `0`. `grep -c "checkout" src/commerce/rp-cart.ts` counts only occurrences inside selectors or comments about the checkout control, none in `agent` or `api`.

### Out of scope

C-01 to C-13 (M1-T29, M1-T30). The agent test of `docs/08-agent-kit-and-evals.md` section 7.6 (M8-T03). CartLink, CartLines, CartSummary, CartDrawer.

### If blocked

SPIKE-04 verdict `FALLBACK required`: wait for the follow-up row; the fallback form is `docs/05-commerce.md` `### Fallback (SPIKE-04)`. Rebase conflict in `index.ts` with M1-T27 or M1-T28: keep every `define...()` line, in the order `defineCart(); defineProductForm(); defineLive();`.

---

## M1-T27 Element `rp-product-form` (`src/commerce/rp-product-form.ts` and test)

- **Goal:** Ship the `rp-product-form` element.
- **Depends on:** M1-T14, M1-T23, M1-T24.
- **Kind / recipe:** `element`; recipe E.

### Read first

`docs/05-commerce.md`: `### 7.2 ` (4 kB), `### 7.7 Element shell` (first two paragraphs and the sentence that describes the `rp-product-form` shell; the `rp-cart` block is the pattern; 5 kB), `### 6.4 The synthetic submit` (2 kB), `### 9.1 ` and `### 9.2 ` (8 kB), rows 1, 3, 7 and 12 of the change table in `## 1. `. `docs/04-elements.md` `## 7. ` (6 kB). Spike `docs/research/spikes/commerce/src/commerce/rp-product-form.ts` (3 kB).

### Files

Create: `src/commerce/rp-product-form.ts`, `src/commerce/rp-product-form.test.ts`. Change: `src/commerce/index.ts` (one import, one line).

### Steps

1. Branch `task/M1-T27-rp-product-form`.
2. `cp` the spike file. Apply row 3 (announcer import, `from`), row 7 (after a successful add: dispatch `action`, then open the cart, then announce; section 7.2 step 5) and row 12 (ledger D-119: use `errorMessage(..., "add")` and `hasUserError` from `./adapter`; a warnings-only result is a successful add, section 7.2 step 4).
3. Append the shell. Section 7.7 prints the `rp-cart.ts` shell in full and, below it, a table with one row per other file. Write the same structure as the `rp-cart` shell with the values of the row `rp-product-form.ts`: methods `setQuantity(quantity: number): void` and `add(): void` (bodies: section 7.2, Agent row and the prose under the 7.7 table), `agent: { actions: ["setQuantity", "add"] }`, `bind: (el) => connectProductForm(el)`, exports `rpProductForm`, `defineProductForm`. Add nothing the row does not list.
4. `src/commerce/index.ts`: add `import { defineProductForm } from "./rp-product-form";` and the line `defineProductForm();` in `defineElements()` (order: after `defineCart();` when present); remove `M1-T27, ` from the `// PLAN 4.4:` comment.
5. Tests; `pnpm typecheck && pnpm build && pnpm test --no-skips && pnpm test:size && pnpm ci`.

### Names and values

Tag `rp-product-form`; exports `connectProductForm`, `rpProductForm`, `defineProductForm`. Event `action` with `detail` `{ value: "add", reason: "submit", merchandiseId, quantity }` (C-02). Agent actions include `setQuantity` and `add` (K-52 of `docs/08-agent-kit-and-evals.md`); the full list is the Agent row of section 7.2.

### Tests (`src/commerce/rp-product-form.test.ts`; PR-8)

- `[T1] rp-product-form: shell shape` (as in M1-T26, for this file).
- `[T5] rp-product-form: defines the element and intercepts the submit`: the spike Liquid page (M1-R11, `/ripple.js`, `/sa.js`); click the `[data-rp-part="submit"]` button; assert exactly one `updateCart` call was recorded by `fake-sa.js` and the page did not navigate.

### Acceptance

Step 5 exits 0.

### Out of scope

C-02, C-07 (M1-T29), the ProductForm component (M1-T33), the agent test (M8-T03).

### If blocked

As M1-T26.

---

## M1-T28 Element `rp-live` (`src/commerce/rp-live.ts` and test)

- **Goal:** Ship the `rp-live` element (URL-driven region refresh for sort, filter and variant controls).
- **Depends on:** M1-T14, M1-T23, M1-T24.
- **Kind / recipe:** `element`; recipe E.

### Read first

`docs/05-commerce.md`: `### 7.3 ` (2 kB), `### 7.7 Element shell` (5 kB), `### 8.2 ` (3 kB), row 1 of the change table in `## 1. `. `docs/04-elements.md` `## 7. ` (6 kB). Spike `docs/research/spikes/commerce/src/commerce/rp-live.ts` (3 kB); `docs/research/spikes/commerce/run3.cjs` scenario `H4` and the function `HPAGE` (3 kB).

### Files

Create: `src/commerce/rp-live.ts`, `src/commerce/rp-live.test.ts`. Change: `src/commerce/index.ts` (one import, one line).

### Steps

1. Branch `task/M1-T28-rp-live`.
2. `cp` the spike file (the controller and `formUrl` do not change, row 1). Append the shell per section 7.7 (same rule as M1-T27 step 3): values of the 7.7 table row `rp-live.ts`: method `submit(): void`, `agent: { actions: ["submit"] }`, `bind: (el) => connectLive(el)`, exports `rpLive`, `defineLive`.
3. `src/commerce/index.ts`: add `import { defineLive } from "./rp-live";` and `defineLive();` in `defineElements()` (after `defineProductForm();` when present); remove `M1-T28, ` from the comment.
4. Tests; `pnpm typecheck && pnpm build && pnpm test --no-skips && pnpm test:size && pnpm ci`.

### Names and values

Tag `rp-live`; exports `connectLive`, `formUrl`, `rpLive`, `defineLive`. The reason of a refresh comes from the markup as section 7.3 states (`variant`, `filter`, ...); `rp-live` writes history itself except where section 8.2 step 4 says the adapter skips it.

### Tests (`src/commerce/rp-live.test.ts`; PR-8)

- `[T1] rp-live: shell shape`.
- `[T5] rp-live: defines the element and refreshes the region on change`: the hydrogen page of the spike (`HPAGE`, host `html`) on an M1-R11 page with the route table of scenario H4; change the sort select; assert one `GET` of the document URL with the new query and that `[data-rp-region="rp-collection-results"]` was replaced.

### Acceptance

Step 4 exits 0. After M1-T26, M1-T27 and M1-T28 are merged, `defineElements()` reads `defineCart(); defineProductForm(); defineLive();` followed by the comment `// PLAN 4.4: M4-T16, M4-T18 each add one define...() call here, ...`.

### Out of scope

C-13 and C-25 (M1-T30). Any collection or product component. `rp-predictive-search`, `rp-recommendations`.

### If blocked

As M1-T26.

---

## M1-T29 Emulated commerce tests, liquid backend: `test/commerce/liquid.test.ts` C-01 to C-08

- **Goal:** Port the spike's Liquid scenarios into tier 5 tests C-01 to C-08 that run against the built `ripple.js` and `test/support/fake-sa.js`.
- **Depends on:** M1-T26, M1-T27.
- **Kind:** `harness`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/05-commerce.md` | in `## 14. Acceptance tests`: the intro and rows C-01 to C-08 | 4 kB |
| `docs/research/spikes/commerce/run.cjs` | whole (page, helpers, L1 to L7) | 11 kB |
| `docs/research/spikes/commerce/run2.cjs` | whole (D1 to D4) | 2 kB |
| `docs/research/spikes/commerce/result.txt` | lines of L1 to L7, D2 to D4 (the observations to assert) | 4 kB |
| `docs/05-commerce.md` | `### 6.2 Required form markup` (only when a spike page markup and the spec disagree; the spec wins) | 6 kB |
| `docs/13-testing.md` | `### 2.5 `, `### 5.1 ` | 6 kB |

### Files

Create: `test/commerce/liquid.test.ts`. May create: `test/commerce/pages.ts` (the page HTML constants and the M1-R11 route handler, shared with M1-T30; whichever of the two tasks merges second imports it). No file under `src/`.

### Steps

1. Branch `task/M1-T29-commerce-liquid-tests`. `pnpm build`.
2. Port the helper `scenario()` of `run.cjs` to a function `openLiquidPage(opened, { pre, routes })` built on M1-R11: `/` serves the spike's `page` HTML; `/sa.js` serves `pre + test/support/fake-sa.js`; `/partials.js` and `/events.js` serve the spike's module strings; `/ripple.js` and its chunks serve `pkg/browser/`; the import map of the spike page maps `@shopify/partial-rendering` and `@shopify/standard-events` to `/partials.js` and `/events.js`.
3. One test per row, asserting the observations of the row and of the named scenario: C-01 (L1), C-02 (L2), C-03 (L3), C-04 (L4), C-05 (L5, L6), C-06 (L7), C-07 (D2, D3), C-08 (D4). Replace every `sleep` (M1-R13).
4. Bring-up forms (each with the comment shown, on the line above the assertion):
   - C-01 asserts `customElements.get` for `rp-cart`, `rp-product-form`, `rp-live` only: `// PLAN 4.4: M4-T16 adds rp-predictive-search, M4-T18 adds rp-recommendations, M4-T21 adds rp-view-event to this list.` Test files are not under `src/`, so M9-T05 does not see this marker; M4-T24's gate list (C-01 to C-16) is where the full form is checked.
   - C-02 "status part of the CartDrawer": the spike page has the drawer markup; keep it.
   - C-03 "Discount form" and C-08 "Note" use the markup the spike page prints for them (the DiscountCode and CartNote components arrive in M4; the forms are plain markup here).
   - C-05: write its first case only (`updateCart` configured by another script before `ripple.js`). Cases 2 to 4 (D-122, D-129) are owned by M4-T25 (ledger D-145); do not write them. Do not edit `fake-sa.js`.
5. `pnpm test:behavior --files=test/commerce/liquid --no-skips`, then `pnpm ci`.

### Tests (`test/commerce/liquid.test.ts`)

`[T5] commerce-liquid: C-01 ...` to `[T5] commerce-liquid: C-08 ...`, one test per row; C-05 is one test (its first case); C-07 two (`C-07 product form ...`, `C-07 checkout ...`). C-02 and C-03 carry no `[chromium]` tag (C-19). Fixed waits allowed: the 250 ms debounce of C-03 (assert no call before 250 ms with a recorded timestamp, not a sleep).

### Acceptance

`pnpm test:behavior --files=test/commerce/liquid --no-skips` reports 0 failed, 0 skipped, and 9 tests (C-01 to C-08, C-07 as two). `pnpm ci` exits 0.

### Out of scope

C-14, C-15, C-29, C-30. C-05 cases 2 to 4, C-36, C-38 (M4-T25). C-18 (M7-T25, doc 13 NJ-6). Real Standard Actions. Any change under `src/commerce/`: a failing observation that the spike's `result.txt` records as passing is a defect of the M1-T20 to M1-T27 code; fix it in this branch with a commit `M1-T29: fix <file>: <defect>` only when the fix is under 20 lines, otherwise draft pull request.

### If blocked

The spike page markup differs from `docs/05-commerce.md` section 6.2 in a hook attribute the controller reads: use the section 6.2 markup and say so in the pull request.

---

## M1-T30 Emulated commerce tests, hydrogen backend: `test/commerce/hydrogen.test.ts` C-09 to C-13, C-25 with the stub `/api/cart` server

- **Goal:** Port the spike's hydrogen scenarios into tier 5 tests C-09 to C-13 and add C-25 (the same observations with host `remix`).
- **Depends on:** M1-T26, M1-T27, M1-T28.
- **Kind:** `harness`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/05-commerce.md` | in `## 14. `: rows C-09 to C-13 and C-25 | 2 kB |
| `docs/research/spikes/commerce/run3.cjs` | whole (`HPAGE`, `routes()`, H1 to H7) | 10 kB |
| `docs/research/spikes/commerce/result.txt` | lines of H1, H2, H3, H4, H6 | 3 kB |
| `docs/05-commerce.md` | `### 10.1 ` (script tags and config element of a hydrogen page), `### 8.2 ` | 7 kB |

### Files

Create: `test/commerce/hydrogen.test.ts`. May create or extend: `test/commerce/pages.ts` (see M1-T29).

### Steps

1. Branch `task/M1-T30-commerce-hydrogen-tests`. `pnpm build`.
2. The "stub `/api/cart` server" is the route table of the spike's `routes()` function, served by the M1-R11 handler: `GET` and `POST /api/cart` answer with the spike's cart JSON and record method, URL and body. It is not a separate process.
3. One test per row: C-09 (H1; both halves: with `#cart-drawer`, and without it the browser navigates to `/cart`), C-10 (H2), C-11 (H3), C-12 (H6), C-13 (H4). The tier 7 halves of C-09 and C-10 (mock.shop) are not written here (M7-T26).
4. C-25: run the C-09 and C-13 observations again with the config element `"host": "remix"` and no `configureCommerce` call. Before the page script runs, wrap `location.assign` and `location.reload` (`page.addInitScript`) so the test can assert neither was called. Two tests.
5. `pnpm test:behavior --files=test/commerce/hydrogen --no-skips`, then `pnpm ci`.

### Tests (`test/commerce/hydrogen.test.ts`)

`[T5] commerce-hydrogen: C-09 ...` (two tests), `C-10 ...`, `C-11 ...`, `C-12 ...`, `C-13 ...`, `C-25 cart ...`, `C-25 sort ...`. C-09 and C-13 carry no `[chromium]` tag (C-19).

### Acceptance

The command of step 5 reports 0 failed, 0 skipped, at least 8 tests. `pnpm ci` exits 0.

### Out of scope

C-14, C-15 (M4), C-26 (M1-T45), C-27 (M4-T20), C-33, C-34, C-37, C-39 (M4-T25), C-35 (M7-T30); ledger D-145. A Remix app.

### If blocked

`Location.prototype.assign` cannot be wrapped in Chromium: assert instead that no navigation request for the document was made after the refresh `GET` (`page.on("framenavigated")` count stays 1) and say so in the pull request.

---

## Rules for the commerce component tasks M1-T31 to M1-T38

These add to section 0.3 and are read by the eight tasks below.

- **M1-R20 Read list.** `docs/11-components-commerce.md` section 0 is 43 kB. Read only the subsections the task lists: `### 0.2 Embedded components` (9 kB; only the rows of the components the task embeds), `### 0.3 Region slots` (6 kB; region owners only), `### 0.4 Backend-scoped fixtures and masks` (2 kB), `### 0.5 Resource fixtures` (4 kB), `### 0.7 Shared conventions` (9 kB).
- **M1-R21 Fixtures.** Every fixture is `generated: "hand"` (recipe C step 2). A fixture named `<name>` is rendered by the hosts `html`, `react`, `remix`; a fixture named `liquid-<name>` by the host `liquid` (FX-2 of section 0.4); a fixture the spec marks "all hosts" by all four. The fixture lists below are what the specs named when this file was written; the spec's `### HTML contract` wins (M1-R4).
- **M1-R22 Behaviour tests.** A `[T5]` test of a commerce component opens either `fixturePageUrl("<id>/<fixture>")` (the commerce fixture page loads `/__test/fake-sa.js` and a config element with host `html`, `docs/13-testing.md` section 5.2) or an M1-R11 page that reuses the page constants of `test/commerce/pages.ts`. The hydrogen endpoint is stubbed in the test with `opened.page.route("**/api/cart", ...)` registered before navigation, answering with the cart JSON shape of the spike's `routes()` (`docs/research/spikes/commerce/run3.cjs`).
- **M1-R23 No-JS tests.** A `[T6]` test renders the Liquid fixture through the fixture page with `openPage({ scripts: "disabled" })`, submits the form with a click, and reads the request in a `page.route` handler: it asserts the URL path and the field names of `docs/05-commerce.md` section 10.5. A component without a `liquid-` fixture (FX-2 of `docs/11-components-commerce.md` section 0.4 names the seven that have them; ProductForm has none) renders its Liquid block file through the Liquid host adapter `test/support/hosts/liquid.ts` with the resource the task names, and puts the output on an M1-R11 page opened with `openPage({ scripts: "disabled" })`; the route table answers the form's POST. The hydrogen half of a no-JS item is the `covered by M7-T25` line of M1-R7 (PR-10).
- **M1-R25 TSX-only prop `action`.** ProductForm, CartLine, CartLines, CartSummary and CartDrawer have the prop `action` (url, default `/api/cart`, TSX hosts only, no Liquid param; ledger D-118, CV-17 of `docs/11-components-commerce.md`). Copy its Props table row into `props[]` with `hosts: ["react", "remix"]` (the TSX-only form of CV-1). A blueprint passes the value `cartAction` to it (CONVENTIONS section 6); no M1 task writes a blueprint.
- **M1-R24 Embedding.** TSX bindings import the sibling binding file (`../../<other id>/react/<other id>.tsx`; Remix the same under `remix/`); Liquid prints `{% render 'rp-<other id>', ... %}`. Never copy another component's markup (D-070). The import path form is the one `components/price/react/price.tsx` (M1-T10) already uses.

---

## M1-T31 AddToCartButton (`add-to-cart-button`)

- **Goal:** Ship the submit button of a product form.
- **Depends on:** M1-T01.
- **Kind / recipe:** `static`, tier `block`; recipe C. `status: "stable"`.

### Read first

`docs/components/add-to-cart-button.md` (whole, 8 kB). `docs/11-components-commerce.md`: `### 0.2 ` (rows Button only), `### 0.4 `, `### 0.7 ` (15 kB). `docs/05-commerce.md` `### 10.5 ` (1 kB). Repository: `components/price/price.json` and `components/price/react/price.tsx` (the hand-written pattern).

### Files

Create: `components/add-to-cart-button/add-to-cart-button.json`, `.css`, `.test.ts`, `fixtures/{default,sold-out,children,class,invalid-enum-falls-back}.html`, `react/add-to-cart-button.tsx`, `remix/add-to-cart-button.tsx`, `liquid/blocks/add-to-cart-button.liquid`, `liquid/snippets/rp-add-to-cart-button.liquid`. Generated: `html/add-to-cart-button.html`, generated regions. Change: `locales/en.default.json`.

### Steps

1. Branch `task/M1-T31-add-to-cart-button`. Recipe C steps 1 to 5 (step 6 does not apply: the kind is `static`).
2. Fixture HTML from the spec, byte for byte. Masks: the two `drop-attr` masks the spec lists (`name`, `value`), because hosts differ in those attributes.
3. Bindings embed Button (M1-R24).

### Names and values

- Root `button.rp-button.rp-add-to-cart-button` with `data-rp-part="submit"` and `type="submit"`.
- hydrogen hosts print `name="intent" value="add"`; Liquid prints `name="add"` and no `value`.
- Locale keys in `locales/en.default.json` (M1-R6): `ripple.add-to-cart-button.label` and `ripple.add-to-cart-button.sold_out`, English values from the spec.
- Rule (1): `add-to-cart-in-product-form`.

### Tests

AT-1 comment (generic). `[T5] add-to-cart-button: AT-2 ...`: read the reference HTML of `default` for a hydrogen host and render the Liquid snippet through the shim (`test/support/hosts/liquid.ts`); assert the attributes above. AT-3: `// AT-3: covered by M1-T33 (components/product-form/product-form.test.ts: [T6] product-form: AT-6 ...)`. Rule tests per M1-R8.

### Acceptance

M1-R9 with `<id>` = `add-to-cart-button`. `ls components/add-to-cart-button/fixtures | wc -l` prints `5`.

### Out of scope

ProductForm; the pending state (written by `rp-product-form` on the form root, not on this button); BuyButtons (does not exist).

### If blocked

Default path only.

---

## M1-T32 CheckoutButton (`checkout-button`)

- **Goal:** Ship the checkout control: a link on the hydrogen backend, a submit button on Liquid, both carrying `data-agent-confirm`.
- **Depends on:** M1-T01.
- **Kind / recipe:** `static`, tier `block`; recipe C. `status: "stable"`.

### Read first

`docs/components/checkout-button.md` (whole, 13 kB). `docs/11-components-commerce.md`: `### 0.2 ` (rows Button), `### 0.4 `, `### 0.7 ` (15 kB). `docs/05-commerce.md`: `### 10.5 `, and item 2 of `### 10.2 ` (the Remix checkout link). `docs/04-elements.md` `### 12.3 ` (`data-agent-confirm`; 2 kB).

### Files

Create: `components/checkout-button/checkout-button.json`, `.css`, `.test.ts`, `react/checkout-button.tsx`, `remix/checkout-button.tsx`, `liquid/blocks/checkout-button.liquid`, `liquid/snippets/rp-checkout-button.liquid`, and one fixture file per fixture name below. Change: `locales/en.default.json`.

### Steps

1. Branch `task/M1-T32-checkout-button`. Recipe C steps 1 to 5.
2. Masks: the `href` and `action` masks the spec lists.

### Names and values

- Fixtures, hydrogen hosts: `default`, `disabled`, `children`, `inline`, `class`, `invalid-enum-falls-back`. Liquid: `liquid-default`, `liquid-standalone`, `liquid-disabled`, and every other `liquid-*` variant the spec's HTML contract lists.
- hydrogen: `<a class="rp-button rp-checkout-button" href="<checkoutUrl>" data-rmx-document data-agent-confirm="<sentence>">`; disabled form: no `href`, `aria-disabled="true"`. Liquid: `<button type="submit" name="checkout" ...>`; joins the cart form with `form="<cart lines id>-form"` (D-092); disabled form: `disabled`.
- Default confirm sentence: the spec (`Goes to checkout with this cart` is the text `docs/08-agent-kit-and-evals.md` section 7.7 quotes).
- Rules: `checkout-button-not-nested`, `checkout-button-form-target` (the spec's Checker rules table is the list).

### Tests

AT-1 comment (generic). AT-2: `// AT-2: covered by M1-T29 (test/commerce/liquid.test.ts: C-07)`. AT-3: `// AT-3: covered by M4-T23 (src/check/rules/RP320.test.ts: RP320)`. AT-4: hydrogen half `// AT-4: covered by M7-T25 (test/nojs/blueprints.test.ts: NJ-F9)`; Liquid half `[T6] checkout-button: AT-4 ...` (M1-R23: a POST to `/cart` whose body contains the field `checkout`; use the fixture whose button is inside or associated with a form, `liquid-standalone` when the spec gives it its own form). `[T5] checkout-button: AT-5 ...` (fixture `disabled`: no `href`, skipped by Tab; fixture `liquid-disabled`: matches `:disabled`, a click sends no request). AT-6: `// AT-6: covered by M4-T25 (test/commerce/hydrogen.test.ts: C-34)`. Rule tests per M1-R8.

### Acceptance

M1-R9 with `<id>` = `checkout-button`. `grep -L "data-agent-confirm" components/checkout-button/fixtures/*.html` prints nothing.

### Out of scope

Accelerated checkout (a prop of ProductForm and CartSummary). The checkout guard (`src/commerce/adapter-hydrogen.ts`, M1-T23). An agent action `checkout` (SPIKE-08).

### If blocked

Default path only.

---

## M1-T33 ProductForm (`product-form`)

- **Goal:** Ship ProductForm: the add-to-cart form around QuantityInput and AddToCartButton, upgraded by `rp-product-form`.
- **Depends on:** M1-T06, M1-T15, M1-T25, M1-T27, M1-T31.
- **Kind / recipe:** `commerce`, tier `resource`; recipes C and R. `status: "beta"`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/components/product-form.md` | whole | 20 kB |
| `docs/11-components-commerce.md` | `### 0.2 ` (rows QuantityInput, AddToCartButton, FormMessage), `### 0.4 `, `### 0.5 `, `### 0.7 ` | 20 kB |
| `docs/06-bindings.md` | `### 6.7 ` (ProductForm part only) | 3 kB |
| `docs/07-manifest-registry-cli.md` | in `#### 1.7.3 `, the `json` block only (the key shape of a `commerce` manifest; the values come from the spec, ledger D-134 item 6). The whole section is 15.3 kB | 13 kB |
| `docs/05-commerce.md` | `### 10.5 ` | 1 kB |

Open `docs/06-bindings.md` `### 7.7 ` (Remix) and `### 8.7 ` (Liquid) only while writing that binding (3 kB each).

### Files

Create: `components/product-form/product-form.json`, `.css`, `.test.ts`, `fixtures/{default,children,sold-out,accelerated,class}.html` plus any `liquid-*` variant the spec lists, `react/product-form.tsx`, `remix/product-form.tsx`, `liquid/blocks/product-form.liquid`. Change: `locales/en.default.json` (the keys the spec names other than `ripple.product-form.name` (M1-R6); `ripple.product-form.added` exists since M1-T20).

### Steps

1. Branch `task/M1-T33-product-form`. Recipe C, then recipe R.
2. Manifest: copy the key shape of the `json` block of section 1.7.3, then take every value from the spec's Props, Anatomy, State, HTML contract and Checker rules sections (the spec wins; doc 07 section 1.7, ledger D-134 item 6). Prop `action`: M1-R25.
3. React: start from section 6.7 and apply its copy-rule differences. Add the props of the spec's React Host notes (`variant`, `acceleratedCheckout` rendered with `renderShopPayButton`, `strings`, `onAction`, `action`). Render the default body with `../../quantity-input/react/quantity-input.tsx` and `../../add-to-cart-button/react/add-to-cart-button.tsx` (M1-R24). Wire `onAction` with `useElement(ref, { events: { action } })`, which makes the first line `"use client"`. Put `suppressHydrationWarning` on the root, the form and the error part (spec Host notes). Remix: section 7.7 and the spec's Remix host extras. Liquid: `{% form 'product', product, id: id, class: 'rp-product-form-fields' %}` as section 8.7 shows.
4. Tests; M1-R9 with `<id>` = `product-form`.

### Names and values

- Root `rp-product-form.rp-product-form`, `id` required (fixtures use `pf`). Parts: fields (the `<form>`, class `rp-product-form-fields`), hidden input `data-rp-field="merchandise-id"`, quantity (QuantityInput), submit (AddToCartButton), accelerated, error (FormMessage; `hidden` until a failure).
- Resources: `product.basic`, `product.sold-out` (`src/testing/resources.ts`).
- Field names: hydrogen and Liquid columns of `docs/05-commerce.md` section 10.5.
- Rules (2): `product-form-one-submit` (`requires-descendant`), `product-form-single-submit` (`max-count`); selectors, targets, messages and fixes from the spec's Checker rules section.
- Trap: the variant id travels in the hidden input; the server prints it; JavaScript never invents it. `acceleratedCheckout` markup is platform-owned and masked.

### Tests

| Id | Form |
|---|---|
| AT-1 | comment, generic (conformance with masks) |
| AT-2 | comment, generic (`test/upgrade/upgrade.test.ts`) |
| AT-3 | two lines: `// AT-3: covered by M1-T29 (test/commerce/liquid.test.ts: C-02)` and `// AT-3: covered by M1-T29 (test/commerce/liquid.test.ts: C-07)` |
| AT-4 | `[T5] product-form: AT-4 ...` (M1-R22: page with fixture `default` plus an empty `<dialog id="cart-drawer">`; a listener calls `preventDefault()` on `action`; the dialog stays closed) |
| AT-5 | `[T5] product-form: AT-5 ...` (the `/api/cart` stub answers with a failure; the error part loses `hidden`; no live-region text) |
| AT-6 | Liquid half: `[T6] product-form: AT-6 ...`. ProductForm has no `liquid-` fixture (M1-R23): render `components/product-form/liquid/blocks/product-form.liquid` through `test/support/hosts/liquid.ts` with the resource `product.basic`, put the output on an M1-R11 page opened with `openPage({ scripts: "disabled" })`, answer `POST /cart/add` in the route table, click the submit part, and assert the request path `/cart/add` and the field names `id` and `quantity`. hydrogen half and tier 7 half (both are NJ-F4 on the examples): `// AT-6: covered by M7-T25 (test/nojs/blueprints.test.ts: NJ-F4)` |
| AT-7 | comment, generic (`test/hydration/react.test.ts`) |
| AT-8 | `// AT-8: covered by M4-T25 (test/commerce/liquid.test.ts: C-36)` |
| rules | M1-R8 |

When one item needs two forms (AT-6), write the real test and put the comment for the other half on the line above it.

### Acceptance

M1-R9. `[T3]` for all fixtures reports zero mutations outside `upgradeAllow`.

### Out of scope

VariantPicker, BuyButtons, selling plans UI, `rp-product-form` source.

### If blocked

`{% form 'product' %}` output of the shim differs from the reference HTML in the hidden inputs `form_type` and `utf8`: those are the spec's masks; add no mask the spec does not list, report instead.

---

## M1-T34 CartLink (`cart-link`)

- **Goal:** Ship CartLink: the header link to the cart with a live count, opening the cart drawer when one exists.
- **Depends on:** M1-T03, M1-T07, M1-T25, M1-T26.
- **Kind / recipe:** `commerce`, tier `block`; recipe C. `status: "beta"`.

### Read first

`docs/components/cart-link.md` (whole, 11 kB). `docs/11-components-commerce.md`: `### 0.2 ` (rows Icon, VisuallyHidden), `### 0.4 `, `### 0.7 ` (15 kB). `docs/05-commerce.md`: `### 7.1 ` (the count part and `upgradeAllow` writes; 6 kB), item 3 of `### 10.3 React`. `docs/06-bindings.md` `### 6.2 ` item 5 (`useCart` semantics).

### Files

Create: `components/cart-link/cart-link.json`, `.css`, `.test.ts`, `fixtures/{default,empty,children,class,escaping}.html`, `react/cart-link.tsx`, `remix/cart-link.tsx`, `liquid/blocks/cart-link.liquid`, `liquid/snippets/rp-cart-link.liquid`. Change: `locales/en.default.json` (`ripple.cart-link.label` = `Cart` and the other keys the spec names, never `ripple.cart-link.name`; M1-R6).

### Steps

1. Branch `task/M1-T34-cart-link`. Recipe C.
2. React: first hand-written line `"use client"`; the count is `useCart((state) => ..., serverValue)` exactly as the spec's Host notes print; `suppressHydrationWarning` on `[data-rp-part="count"]`. Remix: prop `rmxKey` as the spec states.
3. Tests; M1-R9 with `<id>` = `cart-link`.

### Names and values

- Root `rp-cart.rp-cart-link`; parts trigger (`a.rp-cart-link-trigger`, `href` = cart URL; with prop `drawer` it carries `data-rp-open="<drawer id>"`), count (`.rp-cart-link-count`, `data-rp-part="count"`, `hidden` at quantity 0).
- Rules: `cart-link-count`, `cart-link-no-error`.
- `upgradeAllow`: the count text and the attributes the spec's State table lists.

### Tests

AT-1 comment. `[T3] cart-link: AT-2 ...` (seed the store with `totalQuantity` 5 while the server text is `3`; use an M1-R11 page with the spike's seed as `pre`). `[T5] cart-link: AT-3 ...`. `[T5] cart-link: AT-4 ...` (two cases: with `<dialog id="cart-drawer">` inside an `rp-dialog`, and without). `[T6] cart-link: AT-5 ...` (route `GET /cart` answers 200). Rule tests.

### Acceptance

M1-R9. `grep -c '"use client"' components/cart-link/react/cart-link.tsx` prints `1`.

### Out of scope

CartDrawer, Header. C-23 (M1-T39).

### If blocked

Default path only.

---

## M1-T35 CartLine (`cart-line`)

- **Goal:** Ship CartLine: one cart row with image, title, price, quantity control and remove control, in both form dialects.
- **Depends on:** M0-T45, M1-T01, M1-T03, M1-T04, M1-T06, M1-T08, M1-T09, M1-T10, M1-T15.
- **Kind / recipe:** `static`, tier `resource`; recipes C and R. `status: "stable"`.

### Read first

`docs/components/cart-line.md` (whole, 18 kB). `docs/11-components-commerce.md`: `### 0.2 ` (rows Image, Placeholder, Price, QuantityInput, IconButton, Button, FormMessage), `### 0.4 `, `### 0.5 `, `### 0.7 ` (24 kB). `docs/05-commerce.md`: in `### 6.2 Required form markup`, the cart line markup for both dialects (3 kB).

### Files

Create: `components/cart-line/cart-line.json`, `.css`, `.test.ts`, the fixture files, `react/cart-line.tsx`, `remix/cart-line.tsx`, and the Liquid files the spec's Anatomy table names (expected `liquid/snippets/rp-cart-line.liquid`; a block file only if the table lists one). Change: `locales/en.default.json`.

### Steps

1. Branch `task/M1-T35-cart-line`. Recipes C and R.
2. Fixtures: write hydrogen and Liquid variants separately; they differ in the form dialect (hydrogen: a per-line `<form>` with `button[name="intent"]`; Liquid: `updates[]` input and a remove link `a[data-rp-part="remove"]`).
3. Tests; M1-R9 with `<id>` = `cart-line`.

### Names and values

- Fixtures, hydrogen: `default`, `sale`, `attributes`, `no-image`, `class`, `escaping`. Liquid: `liquid-default`, `liquid-sale`, `liquid-attributes` and the other `liquid-*` variants of the spec.
- Root `li.rp-cart-line` with `data-rp-line="<line id>"`. Resources `line.basic` and the others the fixture table names.
- hydrogen fixtures: the first `button[type="submit"]` of the form is `name="intent" value="set"` with `hidden`; the quantity input has `required`; the `value="remove"` button has `formnovalidate`. Liquid fixtures have neither `required` nor `formnovalidate`.
- Attributes whose key starts with `_` are not printed.
- Prop `action`: M1-R25 (the `action` of the hydrogen actions form).
- Locale keys in `locales/en.default.json` (M1-R6): `ripple.cart-line.remove`, `ripple.cart-line.quantity`, `ripple.cart-line.update`.
- Rules: `cart-line-in-cart`, `cart-line-quantity`, `cart-line-error` (the spec's table is the list).

### Tests

AT-1 comment. `[T5] cart-line: AT-2 ...`. `[T5] cart-line: AT-3 ...` (fixture `attributes`). AT-4: `// AT-4: covered by M7-T25 (test/nojs/blueprints.test.ts: NJ-F6)`. `[T2] cart-line: AT-5 ...` (read every fixture file; assert the attribute presence rules above). AT-6: `// AT-6: covered by M4-T25 (test/commerce/hydrogen.test.ts: C-33)`. Rule tests.

### Acceptance

M1-R9. `grep -L "data-rp-line" components/cart-line/fixtures/*.html` prints nothing.

### Out of scope

CartLines (the list and the cart form), line-level discounts UI beyond what the spec prints, `rp-cart`.

### If blocked

A resource the fixtures name is missing from `src/testing/resources.ts` and from the table of `docs/13-testing.md` section 4.2: add it in this task's commit under ledger D-140 (the `RESOURCES` entry, the doc 13 section 4.2 row, the doc 11 section 0.5 entry, the name in the `[T1] resources:` list; name `<type>.<name>`) with the values the spec prints, and list it in the pull request.

---

## M1-T36 CartSummary (`cart-summary`)

- **Goal:** Ship CartSummary: totals region, discounts, checkout control.
- **Depends on:** M1-T03, M1-T04, M1-T25, M1-T26, M1-T32, M1-T37.
- **Kind / recipe:** `commerce`, tier `resource`; recipes C and R. `status: "beta"`.

### Read first

`docs/components/cart-summary.md` (whole, 22 kB). `docs/11-components-commerce.md`: `### 0.2 ` (rows CheckoutButton, Icon, IconButton), `### 0.3 Region slots`, `### 0.4 `, `### 0.5 `, `### 0.7 ` (30 kB). `docs/05-commerce.md` `### 8.1 Markup` (1 kB).

### Files

Create: `components/cart-summary/cart-summary.json`, `.css`, `.test.ts`, fixture files, `react/cart-summary.tsx`, `remix/cart-summary.tsx`, `liquid/blocks/cart-summary.liquid`, `liquid/snippets/rp-cart-summary.liquid`, `liquid/snippets/rp-cart-summary-totals.liquid`. Change: `locales/en.default.json`.

### Steps

1. Branch `task/M1-T36-cart-summary`. Recipes C and R.
2. Region: the part `CartSummaryTotals` (Liquid: `snippets/rp-cart-summary-totals.liquid`) prints the element with `data-rp-region="rp-cart-summary"`; the root carries `data-rp-refresh="rp-cart-summary"`. CheckoutButton is inside the region; accelerated checkout markup is outside it.
3. React: import `toRippleCart` from `../../cart-lines/react/cart-lines.data` (the file M1-T37 created; this task depends on M1-T37). Do not change that file.
4. Tests; M1-R9 with `<id>` = `cart-summary`.

### Names and values

- Fixtures, hydrogen: `default` (`cart.discounted`), `line-discount`, `two-lines` (`cart.two-lines`: subtotal `$108.00`, total `$108.00`, no discount row), `accelerated`, `class`, `children`. Liquid: `liquid-default`, `liquid-line-discount`, `liquid-two-lines`, `liquid-accelerated`. All hosts: `empty`.
- Root `rp-cart.rp-cart-summary`. Status part text after a discount removal: `Discount removed`.
- Rules: `cart-summary-region`, `cart-summary-no-error`, `cart-summary-accelerated-outside-region`.
- Prop `action`: M1-R25 (the `action` of each remove-code form).
- With an empty cart the checkout control is inert (CheckoutButton `disabled` form).

### Tests

AT-1 comment. `[T5] cart-summary: AT-2 ...` (M1-R22: one store call with intent `discount-remove` and the code; one refresh of `rp-cart-summary`; status text). `[T5] cart-summary: AT-3 ...` (start from `cart.empty`). `[T5] cart-summary: AT-4 ...` (two cases, one per backend; the click handler records `defaultPrevented` and then cancels navigation itself). AT-5: Liquid half `[T6] cart-summary: AT-5 ...` (the remove form computes `display: none` with scripting disabled). Hydrogen half (hydrogen dev server, scripting disabled, discount remove form): no NJ-F row of `docs/13-testing.md` section 11.2 and no E2E row covers it. Write `// AT-5: covered by M7-T25 (test/nojs/blueprints.test.ts: no NJ-F row yet for the discount remove form)` above the `[T6]` test, add an entry under `## Ledger issues` of `docs/13-testing.md` naming the missing NJ-F row, and list it in the pull request. Rule tests.

### Acceptance

M1-R9. `grep -c 'data-rp-region="rp-cart-summary"' components/cart-summary/fixtures/two-lines.html` prints `1`.

### Out of scope

DiscountCode and CartNote components (M4). An agent action `checkout`. `rp-cart` source.

### If blocked

Default path only. SPIKE-08 has no effect on this task (M1-R15).

---

## M1-T37 CartLines (`cart-lines`)

- **Goal:** Ship CartLines: the list of CartLine rows as a refreshable region, with the Liquid cart form.
- **Depends on:** M1-T01, M1-T06, M1-T07, M1-T25, M1-T26, M1-T35.
- **Kind / recipe:** `commerce`, tier `resource`; recipes C and R. `status: "beta"`.

### Read first

`docs/components/cart-lines.md` (whole, 22 kB). `docs/11-components-commerce.md`: `### 0.2 ` (rows CartLine, Button, FormMessage, VisuallyHidden), `### 0.3 `, `### 0.4 `, `### 0.5 ` (21 kB). `docs/06-bindings.md` `### 6.7 ` (CartLines part only; 2 kB). `docs/05-commerce.md` `### 10.3 React` item 3.

### Files

Create: `components/cart-lines/cart-lines.json`, `.css`, `.test.ts`, fixture files, `react/cart-lines.tsx`, `react/cart-lines.data.ts` (keep it unchanged when M1-T36 already created it), `remix/cart-lines.tsx`, `liquid/blocks/cart-lines.liquid`, `liquid/snippets/rp-cart-lines.liquid`, `liquid/snippets/rp-cart-lines-list.liquid`. Change: `locales/en.default.json` (the keys the spec names, never `ripple.cart-lines.name` (M1-R6); `updated`, `removed`, `error` exist since M1-T20).

### Steps

1. Branch `task/M1-T37-cart-lines`. Recipes C and R.
2. Region part `CartLinesList` (Liquid `snippets/rp-cart-lines-list.liquid`) prints `data-rp-region="rp-cart-lines"`.
3. Liquid: the cart form has class `rp-cart-lines-form` and id `<id>-form`; its first submit button is the Update button `button.rp-button.rp-cart-lines-update` with `name="update"`, `data-rp-part="submit"`, `data-rp-js="fallback"`.
4. React: `react/cart-lines.data.ts` exports `toRippleCart` and `toRippleLine` (pure data; D-094); the component renders lines from `useCart`, so a `cart` refresh does nothing on this host.
5. Tests; M1-R9 with `<id>` = `cart-lines`.

### Names and values

- Fixtures, hydrogen: `default`, `empty`, `class`, `refresh`, `children`. Liquid: `liquid-default`, `liquid-empty` and the other Liquid variants of the spec.
- Root `rp-cart.rp-cart-lines`, `id` required. Status part `data-rp-part="status"`; cart-scope error part.
- Rules: `cart-lines-region`, `cart-lines-status`, `cart-lines-error`, `cart-lines-items-only-lines`.
- Prop `action`: M1-R25 (passed to every CartLine).

### Tests

AT-1 comment. AT-2 comment (generic, `test/upgrade/upgrade.test.ts`). AT-3: two lines, `// AT-3: covered by M1-T29 (test/commerce/liquid.test.ts: C-03, C-04, C-06)` and `// AT-3: covered by M1-T30 (test/commerce/hydrogen.test.ts: C-10)`. `[T4] cart-lines: AT-4 ...` (mechanics of `docs/13-testing.md` section 9.1; stub `**/api/cart` per M1-R22; set a quantity to 0; the `<li>` is gone and no document `GET` happened; the "no hydration warning" half is the line `// AT-4: covered by M1-T39 (test/hydration/react.test.ts: C-23)`). AT-5: hydrogen half `// AT-5: covered by M7-T25 (test/nojs/blueprints.test.ts: NJ-F5)`; Liquid half `[T6] cart-lines: AT-5 ...` (M1-R23: the POST carries `updates[]` once per line, in line order, and `update`). `[T5] cart-lines: AT-6 ...` (Liquid fixture `liquid-default`: the first submit button of the form `#<id>-form`, which is `#cart-form` in that fixture, is `name="update"`; count of `[name="updates[]"]` equals count of `[data-rp-line]`; ledger D-134 item 12). Rule tests.

### Acceptance

M1-R9. `grep -c 'data-rp-region="rp-cart-lines"' components/cart-lines/fixtures/default.html` prints `1`.

### Out of scope

CartNote, DiscountCode, the cart blueprint, `rp-cart` source.

### If blocked

Default path only.

---

## M1-T38 CartDrawer (`cart-drawer`)

- **Goal:** Ship CartDrawer: a Drawer that contains CartLines and CartSummary and announces cart changes.
- **Depends on:** M1-T03, M1-T04, M1-T18, M1-T36, M1-T37, M1-T02, M1-T31, M1-T33, M1-T34.
- **Kind / recipe:** `commerce`, tier `resource`; recipes C and R. `status: "beta"`.

### Read first

`docs/components/cart-drawer.md` (whole, 15 kB). `docs/11-components-commerce.md`: `### 0.2 ` (rows Drawer parts, CartLines, CartSummary, IconButton), `### 0.3 `, `### 0.4 ` (12 kB). `docs/05-commerce.md`: `### 7.1 ` (the status part of the drawer and `openCart`; 9 kB). `docs/07-manifest-registry-cli.md`: in `#### 9.5.3 Structure rules`, the paragraph on kind `custom` (1 kB). Repository: `components/drawer/react/drawer.tsx`, `src/check/rules/RP113.ts`.

### Files

Create: `components/cart-drawer/cart-drawer.json`, `.css`, `.test.ts`, fixture files, `react/cart-drawer.tsx`, `remix/cart-drawer.tsx`, `liquid/blocks/cart-drawer.liquid`. Change: `locales/en.default.json` (`ripple.cart-drawer.title`, `ripple.cart-drawer.close` with the spec's English values; M1-R6), `src/check/rules/RP113.ts` (one `CUSTOM_RULES` entry, `cart-drawer-one`; section 0.5, ledger D-147).

### Steps

1. Branch `task/M1-T38-cart-drawer`. Recipes C and R.
2. Default body: CartLines with id `<id>-list`, then CartSummary with `cartLines` = `<id>-list` (M1-R24). Fixture bodies are the embedded components' fixtures the spec names (`two-lines`: CartLines `default` with id `cart-drawer-list`, then CartSummary `two-lines`).
3. Liquid: the block is rendered by the layout, outside any `{% partial %}`; the two regions inside it are the region parts of CartLines and CartSummary.
4. Tests; M1-R9 with `<id>` = `cart-drawer`.

### Names and values

- Root `rp-dialog.rp-drawer.rp-cart-drawer`; `id` default `cart-drawer` (the value of `cartDrawer` in the commerce config element). Prop `side` as Drawer.
- Fixtures (8), hydrogen hosts: `default`, `two-lines`, `start`, `children`, `class`, `invalid-enum-falls-back`; Liquid: `liquid-default`, `liquid-two-lines`. Only `two-lines` has a `liquid-` variant; `start`, `children`, `class`, `invalid-enum-falls-back` are hydrogen-host fixtures only (ledger D-134 item 9).
- Status part `[data-rp-part="status"]`: text `Added to cart` after an add (C-02).
- Rules (2): `cart-drawer-status` (`requires-descendant`, selector `dialog`, target `rp-cart [data-rp-part="status"][role="status"]`; message "The CartDrawer has no status part; cart changes are not announced inside the modal dialog.", fix "Keep the default body, or include one CartLines in the children."). `cart-drawer-one` (kind `custom`; manifest entry has only `id`, `kind`, `message` "A page has more than one CartDrawer.", `fix` "Render CartDrawer once, in the layout."). Its `CUSTOM_RULES` function in `src/check/rules/RP113.ts` walks from R to its document and returns `[R]` when an element with class `rp-cart-drawer` comes before R in document order, otherwise `[]` (ledger D-143, D-134 item 9).
- Prop `action`: M1-R25 (passed to the embedded CartLines and CartSummary).
- Masks: those of the embedded components only.

### Tests

AT-1 comment. AT-2: `// AT-2: covered by M1-T29 (test/commerce/liquid.test.ts: C-02)`. `[T5] cart-drawer: AT-3 ...` (fixture `two-lines`, M1-R22; open the drawer, focus a line's remove control, activate it; after the refresh `dialog.open` is true and `document.activeElement` is inside the dialog). `[T5] cart-drawer: AT-4 ...` (`checkPattern(root, "dialog")` while open). `[T6] cart-drawer: AT-5 ...` (scripting disabled: the dialog is not open and has `display: none`; a CartLink placed on an M1-R11 page navigates to `/cart`). AT-6: `// AT-6: covered by M6-T29 (src/check/rules/RP404.test.ts: RP404)`. Rule tests (M1-R8): the failing example of `cart-drawer-one` is an HTML string with two CartDrawer `default` roots in one document (doc 13 section 10.2, ledger D-134 item 23).

### Acceptance

M1-R9. `ls components/cart-drawer/fixtures | wc -l` prints `8`. All 21 slice components now exist: `ls components | wc -l` prints `21`. `grep -c '"cart-drawer-one"' src/check/rules/RP113.ts` prints at least `1`.

### Out of scope

The `layout` blueprint, Header, the cart page. An agent action `checkout`.

### If blocked

If AT-4 fails inside `checkPattern` and not because of the markup: set `a11y.checkPattern` to `null` in `components/cart-drawer/cart-drawer.json`, replace the test with `// AT-4: removed (docs/components/dialog.md UNVERIFIED, D-108)`, and paste the checker message into the pull request (the rule of M1-T17).

---

## M1-T39 Golden path on the theme server: gate ST-5 (`[T5] cart: theme server add-to-cart updates the count and the lines region`), `[T6] serve-theme: add by form post then remove by link with scripting disabled`, `[T5] serve-theme: emulated Standard Actions and partial rendering`; C-16, C-23 for the slice (C-18 is proven by M7-T25, D-145)

- **Goal:** Prove the whole slice end to end on the local theme server: add to cart with scripts on (count and lines region update) and with scripting disabled (form post, then remove by link).
- **Depends on:** M1-T29, M1-T33, M1-T34, M1-T38.
- **Kind:** `harness`.

### Read first

| File | Section | Size |
|---|---|---|
| `docs/13-testing.md` | in `### 4.5 `: the `ServeThemeOptions` interface, the behaviour table (search `GET /products/<handle>`), rules ST-1 to ST-6. Do not read the server code | 6 kB |
| `docs/13-testing.md` | `### 4.6 ` rows `[T6] serve-theme: add by form post ...` and `[T5] serve-theme: emulated Standard Actions ...`; `### 9.3 Commerce`; `### 9.1 ` items 1 to 3 | 6 kB |
| `docs/13-testing.md` | in `### 7.3 `: the function `buildLiquidWorkDir` | 2 kB |
| `docs/05-commerce.md` | `### 10.4 Liquid theme` (config element text, items 3, 4, 7); rows C-16, C-23 of `## 14. ` | 4 kB |
| `docs/04-elements.md` | `### 5.4 ` (the six import-map entries and the module script tag) | 3 kB |
| `docs/components/cart-drawer.md`, `cart-lines.md`, `cart-summary.md`, `product-form.md`, `cart-link.md` | in each, only the Liquid usage example in `### Host notes` (search `{% block '`) | 5 kB |
| `docs/PLAN.md` | section 8, note P-3 | 1 kB |

### Files

Create: `test/support/golden-theme.ts` (Plan reading PR-5: one exported function `buildGoldenTheme(): string` that returns the path of the assembled theme root). Change: `test/liquid/shim.test.ts` (add the three theme-server tests; M0-T13 wrote only the `[T1]` rows of that file), `test/hydration/react.test.ts` (add C-23). No file under `src/`, `components/`, `examples/`.

### Steps

1. Branch `task/M1-T39-golden-path`. `pnpm build`.
2. `buildGoldenTheme()`:
   1. Start from the directory `buildLiquidWorkDir()` returns (it already holds every component's `blocks/` and `snippets/` and the locale file). Copy it to a new directory under `node_modules/.cache/ripple/golden-theme/` (remove the directory first).
   2. Copy `test/fixtures/theme-min/` into it without overwriting files that exist.
   3. Copy every file of `pkg/registry/liquid/assets/` to `assets/`, and `pkg/browser/ripple.css` to `assets/ripple.css`.
   4. Write `layout/theme.liquid`, `templates/product.liquid`, `templates/cart.liquid` with the texts below.
3. `layout/theme.liquid` (the `rp-head` snippet does not exist until M6-T05). This layout prints the stylesheet, the config element and the module script of `rp-head` (`docs/04-elements.md` section 5.4), plus the import map; `{% render 'rp-tokens' %}` and the inline Invoker Commands polyfill are omitted until M6-T05. Write exactly this text:

   ```liquid
   <!doctype html>
   <html lang="{{ request.locale.iso_code }}">
   <head>
     <meta charset="utf-8">
     <title>{{ page_title }}</title>
     <script type="importmap">
     { "imports": {
       "ripple": "{{ 'ripple.js' | asset_url }}",
       "ripple/tabs": "{{ 'ripple-tabs.js' | asset_url }}",
       "ripple/tooltip": "{{ 'ripple-tooltip.js' | asset_url }}",
       "ripple/toast": "{{ 'ripple-toast.js' | asset_url }}",
       "ripple/shared": "{{ 'ripple-shared.js' | asset_url }}",
       "ripple/agent": "{{ 'ripple-agent.js' | asset_url }}"
     } }
     </script>
     {{ 'ripple.css' | asset_url | stylesheet_tag }}
     <!-- config element: paste here, unchanged, the fenced block of docs/05-commerce.md section 10.4 item 3 -->
     <script type="module" src="{{ 'ripple.js' | asset_url }}"></script>
     {{ content_for_header }}
   </head>
   <body>
     <header>
       {% if request.page_type == 'cart' %}
         {% block 'cart-link' %}{% endblock %}
       {% else %}
         {% block 'cart-link', drawer: 'cart-drawer' %}{% endblock %}
       {% endif %}
     </header>
     <main id="main" data-template="{{ request.page_type }}">{{ content_for_layout }}</main>
     {% unless request.page_type == 'cart' %}
       <!-- cart drawer: paste here, unchanged, the Liquid usage example of docs/components/cart-drawer.md "Host notes" (the block 'cart-drawer' with its two nested blocks and two partials) -->
     {% endunless %}
   </body>
   </html>
   ```

   The drawer is not printed on the cart page because a partial name may be declared once per page (`docs/05-commerce.md` section 10.4 item 4). When the shim rejects `request.locale.iso_code`, `page_title`, `content_for_header` or `request.page_type`, delete only that expression, keep the rest, and name it in the pull request (for `request.page_type`: use the template name test the theme-min layout uses, if it has one).
4. `templates/product.liquid`: the usage line of `docs/components/product-form.md` Host notes with `id: 'buy'`, `product: product` and WITHOUT `accelerated_checkout`. `templates/cart.liquid`: the CartLines usage example (id `cart`, with its partial) followed by the CartSummary usage example (`cart_lines: 'cart'`, with its partial), both pasted from the two specs.
5. Tests (names are fixed by the specs):
   - In `test/liquid/shim.test.ts`: `[T6] serve-theme: add by form post then remove by link with scripting disabled` and `[T5] serve-theme: emulated Standard Actions and partial rendering`, with `serveTheme({ themeRoot: buildGoldenTheme() })`, asserting exactly the Assertion cells of section 4.6. M0-T13 did not write these two rows (its step 4); add them.
   - In the same file (Plan reading; ST-5 names no file): `[T5] cart: theme server add-to-cart updates the count and the lines region`: open `/products/linen-shirt` on the served theme; wait for `getCommerce().ready` (`import("ripple")` in `page.evaluate`); click `[data-rp-part="submit"]`; assert the CartLink `[data-rp-part="count"]` text is `1` and has no `hidden`; `dialog#cart-drawer` is open; `[data-rp-region="rp-cart-lines"]` contains exactly one `[data-rp-line]`; `opened.errors` is empty.
   - In `test/hydration/react.test.ts`: `[T4] cart-link: C-23 hydrating CartLink and CartLines logs no hydration error`, both script orders inside the one test, using the mechanics of section 9.1 items 1 to 3 with one page that renders CartLink `default` and CartLines `default`.
6. C-16 needs no new test: it is `test/upgrade/upgrade.test.ts` over the commerce fixtures. Run `pnpm test:upgrade --grep="product-form|cart-link|cart-lines|cart-summary|cart-drawer" --no-skips` and paste the pass count into the done file.
7. `pnpm test --no-skips && pnpm ci`. PLAN 5.0.

### Acceptance

```bash
pnpm build
pnpm test:run --tiers=5,6 --files=test/liquid/shim --grep="serve-theme|theme server" --no-skips   # 3 passed
pnpm test:hydration --grep="C-23" --no-skips                                                      # 1 passed
pnpm test:upgrade --grep="product-form|cart-" --no-skips                                          # 0 failed
pnpm ci
```

### Out of scope

`examples/liquid`, the `rp-head` snippet, C-18 (it is the Liquid NJ-F rows of M7-T25, doc 13 NJ-6, ledger D-145), `[T5] serve-theme: one page view per document load` (M7-T27, which also re-points these tests at `examples/liquid` and deletes `test/support/golden-theme.ts`). Any change to `src/testing/serve-theme.ts` beyond a defect fix: ST-5 makes this task the gate of that file, so a defect found here is fixed here with a commit `M1-T39: fix src/testing/serve-theme.ts: <defect>` when under 30 lines, otherwise draft pull request.

### If blocked

The shim rejects a nested `{% block %}` with `{% partial %}` inside the layout (the cart-drawer spec marks platform acceptance UNVERIFIED, SPIKE-02): move the drawer usage block into `templates/product.liquid` after the product form, and say so in the pull request. Real platform behaviour is not this task's question.

---

## M1-T40 Agent bridge entry `src/agent/` (replaces the bring-up stub)

- **Goal:** Replace the stub of `<pkg>/agent` with the real entry and prove the bridge lists and drives `rp-quantity`.
- **Depends on:** M1-T26, M1-T27.
- **Kind:** `runtime`.

### Read first

`docs/04-elements.md`: in `### 4.1 Source entry points` the block for `src/agent/index.ts` (search `src/agent/index.ts`; 1 kB); `## 12. Agent surface` (5 kB); row E-17 of section 13. `docs/08-agent-kit-and-evals.md`: `## 7. In-page agent surface` up to and including `### 7.5 Labels` (12 kB). `docs/research/spikes/elements-runtime/probe-agent.mjs` (1 kB).

### Files

Replace: `src/agent/index.ts`. Change: `src/elements/rp-quantity.test.ts` (one test), `docs/research/spikes/rp-root-only-primitive/README.md` (the agent-bridge row).

### Steps

1. Branch `task/M1-T40-agent-entry`.
2. `src/agent/index.ts` is exactly the block of section 4.1; at the time of writing its one statement is `export { agentTools, createAgent, registerTools } from "@ui-sdk/web/agent"`. Remove every `// PLAN 4.4` line from the file.
3. `pnpm typecheck && pnpm build`. `pkg/browser/ripple.elements-agent.js` and `pkg/registry/liquid/assets/ripple-agent.js` now contain the bridge. `pnpm test:size` (budget `agent` 14 kB in each set, `size-budget.json`).
4. Add to `src/elements/rp-quantity.test.ts`: `[T5] rp-quantity: E-17 the agent bridge lists and drives the element`: M1-R11 page with fixture `default-value`; in the page `const { createAgent } = await (await import("/ripple.elements.js")).loadAgent()`; `createAgent().snapshot()` has an entry for `rp-quantity` whose actions include `setValue`, `increment`, `decrement`; `act` with `increment` raises the input value by its step (3 to 4). The `act` argument shape is the one `docs/08-agent-kit-and-evals.md` section 7.6 step 4 prints.
5. In the SPIKE-04 report: move the agent-bridge line from `## Not run` to `## Results` with the Chromium result of step 4. Do not change the verdict unless this row fails; if it fails, set `FALLBACK required` and follow M1-R19.
6. `pnpm test --no-skips && pnpm ci`. PLAN 5.0.

### Tests

The one test of step 4. The per-element agent tests of `docs/08-agent-kit-and-evals.md` section 7.6 for the commerce elements, and K-50 to K-56, are M8-T03. E-17 for `rp-dialog` and `rp-carousel`: M3-T10.

### Acceptance

`grep -c "PLAN 4.4" src/agent/index.ts` prints `0`. `pnpm test:run --tiers=5 --files=src/elements/rp-quantity --grep="E-17" --no-skips` passes. `grep -c "Needs a person" pkg/browser/ripple.js pkg/browser/ripple.elements.js` prints `0` for both files (K-53). `pnpm ci` exits 0.

### Out of scope

The agent kit (`AGENTS.md` block, skills, guides: M8). A `checkout` action. Loading the bridge by default.

### If blocked

Size budget `agent` exceeded: stop and report the numbers. `@ui-sdk/web/agent` does not export one of the three names: stop; do not write a wrapper (PLAN section 1, "never invent").

---

## M1-T41 SPIKE-08 `agent-bridge-confirm`: run and report

- **Goal:** Measure whether the bridge refuses an unapproved declared action and honours approval, using a test-only `checkout` action on `rp-cart`.
- **Depends on:** M1-T36, M1-T40.
- **Kind:** `spike`.

### Read first

`docs/08-agent-kit-and-evals.md`: `### 7.6 The agent test` (2 kB), `### 7.7 SPIKE-08 ` and `### Fallback (SPIKE-08)` (4 kB), rows K-55 and K-56 of `### 7.8 `. `docs/00-decisions.md` row `SPIKE-08`. `docs/05-commerce.md` `### 7.7 Element shell` (the `rp-cart` shell to vary; 5 kB). `docs/research/spikes/elements-runtime/probe-agent.mjs` and `results-agent-confirm.txt`.

### Files

Create: `src/commerce/rp-cart.agent-confirm.test.ts` (it stays in the repository in both outcomes, K-55), `docs/research/spikes/agent-bridge-confirm/README.md`. Change: `docs/00-decisions.md` (one sentence). MUST NOT change `src/commerce/rp-cart.ts` or any manifest.

### Steps

1. Branch `task/M1-T41-spike-08`. `pnpm build`.
2. The test defines, in the page, a test-only variant of the `rp-cart` primitive: the shell of `docs/05-commerce.md` section 7.7 plus the method `checkout(): void` (body: `click()` on the root's `button[name="checkout"]` or `a.rp-checkout-button`) and `"checkout"` added to `agent.actions` and to the `createParts` `api` list. Plan reading for how the variant reaches the page (section 7.7 does not say): bundle an entry with `esbuild` (`build({ stdin, bundle: true, format: "esm", write: false })`, as `test/hydration/react.test.ts` builds its client entry) that imports `definePrimitive` from `@ui-sdk/core`, `createParts` from `@ui-sdk/web`, `connectCart` from `src/commerce/rp-cart.ts` and `createAgent` from `src/agent/index.ts`, defines the variant under the tag `rp-cart`, and assigns `createAgent` to `window.__agent`. Serve that bundle as `/variant.js` on an M1-R11 page that does NOT load `ripple.js` (so the tag `rp-cart` is free) and whose body is `components/cart-summary/fixtures/two-lines.html`.
3. Three tests, with the page recording navigations and form submissions:
   - `[T5] rp-cart: SPIKE-08 (a) checkout without allow is refused`: `act({ steps: [{ ref, action: "checkout" }] })` resolves `ok: false`; `error.message` starts with `Needs a person:`; no navigation and no submission.
   - `[T5] rp-cart: SPIKE-08 (b) allow returning false is refused`: `ok: false`; message starts with `The person said no to`.
   - `[T5] rp-cart: SPIKE-08 (c) allow returning true activates the control once`.
4. Run `pnpm test:run --tiers=5 --files=src/commerce/rp-cart.agent-confirm`. Record the three results and the observed messages.
5. When a case fails: do not delete it. Section 7.7 (ledger D-134 item 20): the failing case asserts the observed outcome and carries the observed message in its test name; there is no expected-failure mark. Change the failing test so that it asserts the OBSERVED outcome, rename it `[T5] rp-cart: SPIKE-08 (<letter>) observed: <short statement>`, and put the comment `// SPIKE-08: default-path expectation not met; see docs/research/spikes/agent-bridge-confirm/README.md` above it.
6. Report (M1-R16). Verdict words for this spike (PLAN 3.4, ledger D-146): `ADDITION possible` when (a), (b) and (c) all pass, otherwise `DEFAULT stays`. In both cases this task applies nothing (M1-R15): the "Addition when the spike passes" list of section 7.7 is a follow-up row. When the verdict is `ADDITION possible`, write in the done file `FOLLOW-UP NEEDED: apply "Addition when the spike passes" of docs/08-agent-kit-and-evals.md section 7.7`.
7. Ledger sentence (M1-R17). `pnpm ci`. PLAN 5.0.

### Acceptance

The test file exists and `pnpm test:run --tiers=5 --files=src/commerce/rp-cart.agent-confirm --no-skips` exits 0. `grep -rn '"checkout"' src/commerce/rp-cart.ts components/*/*.json` finds no entry in an `agent.actions` list (rule A-7). The report exists. `pnpm ci` exits 0.

### Out of scope

Adding `checkout` to the shipped primitive or to any manifest; editing doc 08 tables; `data-agent-confirm` on any other control.

### If blocked

The variant cannot be bundled because `src/commerce/rp-cart.ts` pulls in a module that needs the commerce start: stub nothing in `src/`; instead write the variant with a `bind` that returns `() => {}` (the controller is not what is measured) and state that in the report.

---

## M1-T42 SPIKE-06 `cross-engine-features`: `test/cross-engine/features.test.ts`, run in WebKit and Gecko, report `docs/research/spikes/cross-engine-features/README.md`. Three probes need Popover, Tabs and Accordion and are completed by M3-T12. BLOCKED-ON-ENV without WebKit and Gecko builds; writes its done file in any case (PLAN §4.3)

- **Goal:** Write the seven feature probes that need only slice components, run them with tier 9 in WebKit and Gecko when the builds exist, and record the results for M3-T12, which adds the three probes that need Popover, Tabs and Accordion and writes the report.
- **Depends on:** M1-T15, M1-T17.
- **Kind:** `spike`.

### Read first

`docs/13-testing.md`: `### 11.3 Tier 9: cross-engine` (5 kB), `### 17.3 ` (1 kB), `### Fallback (SPIKE-06)` in `## 21. Fallbacks` (the list of fallbacks to name; do not apply them). `docs/00-decisions.md` row `SPIKE-06`. `docs/03-styling-and-tokens.md` section 12 (search `## 12`; the support table). `docs/04-elements.md` `### Capability tiers inside the browser floor (D-081)` (1 kB).

### Files

Create: `test/cross-engine/features.test.ts` (seven probes), `docs/research/spikes/cross-engine-features/partial-results.md`. MUST NOT create `docs/research/spikes/cross-engine-features/README.md`: its existence makes tier 9 blocking (XE-4), and M3-T12 writes it. MUST NOT change `.github/workflows/ci.yml` (removing `continue-on-error` is M9-T06), any CSS, any component, `docs/00-decisions.md` (M3-T12 writes the ledger sentence with the report).

### Steps

1. Branch `task/M1-T42-spike-06`. `pnpm build`.
2. Write `test/cross-engine/features.test.ts` with the seven probes of the table in section 11.3 that need only slice components, with exactly the names of its first column: `[T9] features: attribute-token props match`, `[T9] features: pow() or literal type scale`, `[T9] features: relative colour or literal colours`, `[T9] features: closedby or backdrop click`, `[T9] features: Invoker Commands or polyfill`, `[T9] features: revert-layer`, `[T9] features: hydrogen runtime needs`. Each builds its page with `page.setContent` (XE-3) from fixture HTML read from `components/<id>/fixtures/` plus `pkg/browser/ripple.css` inlined in a `<style>`, and, where the row needs scripts, `pkg/browser/ripple.js` served by `page.route`. Do not write the three probes `anchor positioning or centred popover`, `scripting none or default panel`, `details name is exclusive` (they need Popover, Tabs and Accordion; M3-T12 adds them).
3. Run `pnpm exec playwright install webkit firefox` once (no retry).
   - When it succeeds: run `pnpm test:webkit` and `pnpm test:firefox` (the whole tier 9 run, not only the probes) and save both outputs.
   - When it fails: run nothing in WebKit or Gecko.
4. Write `partial-results.md`: per engine and version, each of the seven probes with its result and whether the feature or its fallback was in effect; every other tier 9 failure with its test name; or, when step 3 failed, the line `BLOCKED-ON-ENV: no WebKit or Gecko build` and the seven probe names under `Not run`. Do NOT apply a fallback and do NOT raise the floor (PLAN 3.4; ledger D-134 item 15: the spike only reports, each fallback is a follow-up task).
5. `pnpm ci` (tier 9 is not part of it). PLAN 5.0.
6. Done file `docs/plan/done/M1-T42.md`: the status line of PLAN section 2, then, when step 3 failed, the line `BLOCKED-ON-ENV: WebKit and Gecko runs of the seven probes not run`, and always the line `REMAINING: probes anchor positioning, scripting none, details name; report README.md; completed by M3-T12`. The pull request is not a draft (PLAN section 1 item 7). This done file satisfies the dependencies of M1-T46 and M3-T12 (PLAN 4.3).

### Acceptance

`grep -c "^test(\"\[T9\] features: \|test(\"\[T9\] features: " test/cross-engine/features.test.ts` prints `7`. `test -f docs/research/spikes/cross-engine-features/partial-results.md && ! test -f docs/research/spikes/cross-engine-features/README.md` exits 0. `grep -c "REMAINING:" docs/plan/done/M1-T42.md` prints `1`. `pnpm ci` exits 0.

### Out of scope

Fixing a tier 9 failure. The three probes of M3-T12, the report `README.md` and the ledger sentence (M3-T12). Editing `[chromium]` tags of other tasks' tests (list wrong tags in `partial-results.md`).

### If blocked

No WebKit or Gecko build: steps 3 and 6 say what to do; this is not a reason for a draft pull request. A probe cannot be written from slice fixtures: write it as M3-T12's, name it in `partial-results.md` and in the `REMAINING:` line.

---

## M1-T43 SPIKE-07 `navigation-menu-popover`: prototype from the spec code and markup, run, report

- **Goal:** Measure whether `popover` panels with hover intent are usable for a desktop mega menu.
- **Depends on:** M1-T14.
- **Kind:** `spike`.

### Read first

`docs/00-decisions.md` row `SPIKE-07` and decision D-017 (search `NavigationMenu is a`). `docs/04-elements.md`: `### 9.3 ` (9 kB; the complete element source), `### 10.15 NavigationMenu` (3 kB; markup), row E-15 of section 13, `### Fallback (SPIKE-07)` (1 kB).

### Files

Create, all under `docs/research/spikes/navigation-menu-popover/`: `README.md`, `rp-navigation-menu.ts` (copy of the section 9.3 source), `page.html`, `run.test.ts`. Change: `docs/00-decisions.md` (one sentence). Nothing under `src/` (the element is M5-T10).

### Steps

1. Branch `task/M1-T43-spike-07`. `pnpm build`.
2. Copy the complete source of section 9.3 into the spike directory. Bundle it for the browser with `pnpm exec esbuild docs/research/spikes/navigation-menu-popover/rp-navigation-menu.ts --bundle --format=esm --outfile=node_modules/.cache/ripple/spike-07/nav.js`. When an import of the source resolves only inside `src/` (for example `../runtime/...`), change the import path in the copy to the repository file; change nothing else.
3. `page.html`: the markup of section 10.15 (id `main-nav`), extended to a mega menu: three top-level items with panels, each panel holding at least twelve links in three columns and one nested `popover` inside the first panel; one item without a panel. Style sheet: `pkg/browser/ripple.css`. No NavigationMenu CSS exists yet: write only the layout CSS the test needs (panel position below its item) in a `<style>` block and say so in the report.
4. `run.test.ts` (run with `node --experimental-strip-types --test docs/research/spikes/navigation-menu-popover/run.test.ts`; it imports `chromium` from `playwright` directly): the steps of row E-15, plus the four questions of the ledger row:
   - focus order: Tab from the first top-level link visits the disclosure button, then (panel open) the panel links in DOM order, then the next top-level item;
   - hover gap: moving the pointer from the item to its panel across a 8 px gap within 150 ms keeps the panel open; resting outside for 300 ms closes it;
   - nested popover: opening the nested popover keeps its parent open; Escape closes the nested one first;
   - Remix morph: not runnable in this spike (no Remix route renders this markup before M5-T11). Write it under `## Not run` with the text `Remix morph: settled by [T4] navigation-menu: remix morph keeps state, instance and listeners (M5-T11)`.
   The timing numbers of the hover checks MUST be the ones section 9.3 states for hover intent; where 9.3 states different delays, use those and correct the two numbers above in the report.
5. Engines: M1-R18 (run the same file with `webkit` and `firefox` from `playwright` when installed).
6. Report (M1-R16), verdict, ledger sentence, `pnpm ci`, PLAN 5.0.

### Acceptance

The report exists with one row per (check, engine). `git diff --stat origin/main` lists only the spike directory and the ledger.

### Out of scope

The fallback (CSS-only dropdowns), the NavigationMenu component and its CSS, MobileNav.

### If blocked

SPIKE-04 verdict `FALLBACK required`: the section 9.3 source is on the default path; still run this spike with it (the question is about `popover` panels, not about the primitive) and say so under `## Procedure`.

---

## M1-T44 SPIKE-10 part (a) `html-region-refresh`: checks 1 to 5 on the `html` and `remix` hosts, report

- **Goal:** Measure whether document fetch plus `[data-rp-region]` replacement is robust on the `html` host and under the Remix 3 router.
- **Depends on:** M1-T30, M1-T38.
- **Kind:** `spike`. Needs Node 24.3 or later.

### Read first

`docs/05-commerce.md`: `### SPIKE-10 ` (3 kB; part (a) only) and the first paragraph of `### Fallback (SPIKE-10)`; `### 8.2 ` (3 kB); item 3 of `### 10.2 Remix 3`. `docs/00-decisions.md` row `SPIKE-10`. `docs/PLAN.md` section 8 note P-9. `docs/13-testing.md` `### 9.2 ` (how `examples/remix` is started; 2 kB). Repository: `test/commerce/hydrogen.test.ts`, `examples/remix/package.json`, `examples/remix/server.mjs` (the morph test routes of M1-T47).

### Files

Create: `docs/research/spikes/html-region-refresh/README.md`, `docs/research/spikes/html-region-refresh/remix-app/` (the Remix app of step 4), `docs/research/spikes/html-region-refresh/remix.test.ts`. Change: `test/commerce/hydrogen.test.ts` (three tests), `docs/00-decisions.md` (one sentence).

### Steps

1. Branch `task/M1-T44-spike-10a`. `pnpm build && pnpm examples:install`.
2. Checks 1 to 3 on the `html` host, as permanent tests in `test/commerce/hydrogen.test.ts` (they assert the default path and stay):
   - `[T5] commerce-hydrogen: SPIKE-10 check 1 scroll positions survive a cart refresh` (window and a scrolled CartDrawer body; difference at most 1 px);
   - `[T5] commerce-hydrogen: SPIKE-10 check 2 an element inside a replaced region upgrades without a second ripple.js load` (`:defined` is true, the `rp-quantity` inside the new region increments, the request log holds one `ripple.js`);
   - `[T5] commerce-hydrogen: SPIKE-10 check 3 text typed outside the regions is unchanged`.
   Page: the hydrogen page of `test/commerce/pages.ts` with the CartDrawer fixture `two-lines` HTML (`components/cart-drawer/fixtures/two-lines.html`). None carries `[chromium]`.
3. Engines: M1-R18. `pnpm test:webkit --files=test/commerce/hydrogen` and `pnpm test:firefox --files=test/commerce/hydrogen` (C-09, C-10, C-13 and the three checks).
4. Remix part. Copy `examples/remix/` to `docs/research/spikes/html-region-refresh/remix-app/` (without `node_modules`), and add two routes that render, with the Remix bindings of the slice (`components/*/remix/*.tsx`): `/spike/cart` (CartLink, CartDrawer `two-lines` data, one Remix interactive counter component outside the regions, a text input outside the regions, a link to `/spike/other`) and `/spike/other` (a link back). The page prints the commerce config element with `"host": "remix"` and no `configureCommerce` call (C-25). The cart endpoint is not implemented in the app: the test answers `**/api/cart` with `page.route` (M1-R22). How a route and a client entry are written in this app: follow the morph test routes that M1-T47 added to `examples/remix/server.mjs` exactly (the server bundle and the client entry with `run` from `remix/component`); add no dependency.
5. `remix.test.ts` (run with `node --experimental-strip-types --test docs/research/spikes/html-region-refresh/remix.test.ts`; starts the app with its `start` script on a free port): the C-09, C-10 observations and checks 1 to 3 on `/spike/cart`; check 4 (after a region replacement, client navigation to `/spike/other` and Back shows the server state; no console error); check 5 (the counter keeps its value across a region replacement). C-13 needs a collection page with a sort control: render the minimal `rp-live` markup of the spike's `HPAGE` on a third route `/spike/collection`.
6. Report (M1-R16): one row per (check or C test, host, engine). Pass rule (section 16): all checks in all three engines on both hosts. Verdict `FALLBACK required` when a check fails on either host in an engine that was run. Head the report "Part (a)"; leave a heading `## Part (b)` with the line `Run by M4-T22.`
7. Ledger sentence (say `part (a)` in it). `pnpm ci`. PLAN 5.0.

### Acceptance

`pnpm test:behavior --files=test/commerce/hydrogen --grep="SPIKE-10" --no-skips` reports 3 passed (or the report explains each failure and the verdict is `FALLBACK required`; a failing permanent test is then changed per the follow-up row, not in this task: mark the pull request draft). The report exists. `pnpm ci` exits 0 when the verdict is `DEFAULT holds`.

### Out of scope

Part (b) (React `useRegionHtml`). `reloadFrames` and `navigate` (SPIKE-11). Applying the fallback `refresh-html.ts`. Any change to `examples/remix`.

### If blocked

- Node below 24.3: BLOCKED-ON-ENV for the Remix part; report the `html` host, list checks 4, 5 and the Remix repeats under `## Not run`.
- The copied Remix app cannot render the slice bindings within the session: report what failed (file, error), list the Remix rows under `## Not run`, verdict for the `html` host only with the words `(html host only)`. M7-T21 (`examples/remix`) then completes the report before it relies on the strategy.

---

## M1-T45 SPIKE-11 `remix-opt-in-refresh`: test C-26 against the real app, report

- **Goal:** Measure whether the opt-in `reloadFrames` and `navigate` options work under Remix 3 with element state preserved.
- **Depends on:** M1-T44.
- **Kind:** `spike`. Needs Node 24.3 or later.

### Read first

`docs/05-commerce.md`: `### SPIKE-11 ` (2 kB), `### 10.2 Remix 3` item 5 and `#### Fallback (SPIKE-11)` (3 kB), in `### 8.3 Strategies` the **`remix`** part with the `reloadFrames` reference callback (3 kB), row C-26 of section 14. `docs/00-decisions.md` row `SPIKE-11`. Repository: `docs/research/spikes/html-region-refresh/README.md` and `remix-app/`.

### Files

Create: `docs/research/spikes/remix-opt-in-refresh/README.md`, `docs/research/spikes/remix-opt-in-refresh/remix.test.ts`, and, as a copy of the SPIKE-10 app with the two callbacks added, `docs/research/spikes/remix-opt-in-refresh/remix-app/`. Change: `test/commerce/hydrogen.test.ts` (C-26 with stub callbacks), `docs/00-decisions.md` (one sentence).

### Steps

1. Branch `task/M1-T45-spike-11`. `pnpm build`.
2. C-26 with stub callbacks (the row's own form; permanent test; this task owns C-26 in this form, ledger D-145): in `test/commerce/hydrogen.test.ts` add `[T5] commerce-hydrogen: C-26 ...` (split into `cart`, `variant and filter`, `predictive and recommendations`, `rejecting reloadFrames` when one test would be long). The page calls `configureCommerce({ host: "remix", reloadFrames, navigate })` with recording stubs in the same module evaluation as `ripple.js` (import both from `/ripple.js`). Reasons `predictive` and `recommendations` are raised with `getCommerce().refresh(regions, { url, reason })` because their elements do not exist in M1.
3. Real app: copy `docs/research/spikes/html-region-refresh/remix-app/` and change only: (a) the client entry passes `reloadFrames` (the reference callback of section 8.3) and `navigate` (the router's navigation function) in one `configureCommerce` call, as section 10.2 item 5 states; (b) each cart region part (`CartLinesList`, `CartSummaryTotals`) receives a named blocking `<Frame>` as children, the Frame name equal to the region name.
4. `remix.test.ts`: C-26 observations against the real app (`reloadFrames(regions, null)` called once for reason `cart`, no document fetch; `navigate(url, { replace })` once for `variant` and `filter`, `replace === true` only for `variant`; no `history.pushState` or `replaceState` call by `rp-live`); then C-10 (focus stays on the same line's quantity input) and C-13 (history entries) with the callbacks active; then: an open CartDrawer stays open across `reloadFrames`.
5. Report (M1-R16). Verdict `FALLBACK required` when any observation of step 4 fails. Ledger sentence. `pnpm ci`. PLAN 5.0.

### Acceptance

`pnpm test:behavior --files=test/commerce/hydrogen --grep="C-26" --no-skips` passes. The report exists with one row per observation. `pnpm ci` exits 0.

### Out of scope

Removing the two options, `refresh-remix.ts` or C-26 (that is the fallback; follow-up row). Guides and skills for Remix (M8-T06, M8-T19). `examples/remix`.

### If blocked

- SPIKE-10 part (a) reported the Remix rows under `## Not run` (no working app): this spike's real-app part is blocked for the same reason. Do step 2 (the stub-callback C-26), write the report with the real-app rows under `## Not run`, verdict `DEFAULT holds (stub callbacks only)`, and done-file status `BLOCKED: needs the Remix app of SPIKE-10`.
- How a named blocking `<Frame>` is written is not in the files this task reads: read `docs/06-bindings.md` by searching `<Frame` (the Remix section) and `docs/research/remix-3.md` by the same search; use only what they print.

---

## M1-T46 M1 gate

- **Goal:** Prove milestone M1 is complete and record the measured bundle sizes.
- **Depends on:** M1-T01 to M1-T45, M1-T47.
- **Kind:** `gate`.

### Read first

`docs/PLAN.md`: section 4.2 row M1, section 4.3 (the M1-T42 done file satisfies the dependency), section 4.4 (bring-up mode), section 3.5. This file: sections 0.2 and 0.5. Every `docs/plan/done/M1-T*.md` (status line and `FOLLOW-UP NEEDED` lines only).

### Files

Create: `docs/plan/done/M1-T46.md`. Change nothing else. A failure found here is fixed by a new task row, not in this branch, except a one-line fix of a test name or tag.

### Steps

1. `git switch -c task/M1-T46-gate origin/main && pnpm install --frozen-lockfile`. Node 24.3 or later and `export RIPPLE_NETWORK=1` (section 0.2).
2. Done files: `ls docs/plan/done/ | grep -c "^M1-T"` is 46 before this task (M1-T01 to M1-T45 and M1-T47). For each, the status is done. The done file of M1-T42 also carries one `REMAINING:` line and may carry a `BLOCKED-ON-ENV:` line (M1-T42 step 6; M3-T12 completes that spike); neither fails the gate. Collect every `FOLLOW-UP NEEDED` line; for each, check that a follow-up row exists at the end of the M1 table of `docs/PLAN.md` (PLAN 7.2). A missing row fails the gate.
3. Slice: `ls components | sort | tr '\n' ' '` prints exactly `add-to-cart-button button cart-drawer cart-line cart-lines cart-link cart-summary checkout-button dialog drawer form-message icon icon-button image link placeholder price product-form quantity-input stack visually-hidden`.
4. `pnpm ci` exits 0.
5. `pnpm test --no-skips` exits 0 with `0 skipped` (tiers 1, 2, 3, 4, 5, 6, 10; four hosts; Remix cases need Node 24.3 or later).
6. Commerce tests: `pnpm test:run --tiers=3,4,5,6 --grep="C-(0[1-9]|1[0-3]|16|23|25) " --no-skips` runs C-01 to C-13, C-23, C-25 with 0 failed. In M1, C-01, C-03 and C-08 are the slice subset of PR-7 (PLAN 4.2 row M1), and C-05 is its first case only (cases 2 to 4: M4-T25). C-18 is not an M1 test (M7-T25, ledger D-145); C-16 is `pnpm test:upgrade --grep="product-form|cart-" --no-skips`.
7. Golden path: `pnpm test:run --tiers=5,6 --files=test/liquid/shim --grep="serve-theme|theme server" --no-skips` reports 3 passed.
8. Spike reports: these files exist: `docs/research/spikes/rp-root-only-primitive/README.md`, `invoker-commands-hosts/README.md`, `navigation-menu-popover/README.md`, `agent-bridge-confirm/README.md`, `html-region-refresh/README.md`, `remix-opt-in-refresh/README.md`. For SPIKE-06: `docs/research/spikes/cross-engine-features/partial-results.md` exists and the done file of M1-T42 has its `REMAINING:` line (the report `README.md` is written by M3-T12); write whether that done file also has a `BLOCKED-ON-ENV:` line.
9. Ledger: each of the rows SPIKE-04, 05, 07, 08, 10, 11 in `docs/00-decisions.md` section 3 ends with a `Result (` sentence. The row SPIKE-06 has none yet (M3-T12 writes it).
10. Bring-up markers: `grep -rn "PLAN 4.4" src/ | sort` — paste the list into the done file. Expected remaining markers after M1: the `defineElements()` comment in `src/commerce/index.ts` (M4-T16, M4-T18), the two `rp-view-event` / `startStandardEvents` comments in the adapter files (M4-T21), `BRINGUP_SUBSET` and the build skips of PLAN 4.4. Any marker that names an M1 task fails the gate.
11. Sizes: run `pnpm test:size` and copy into the done file a table of every `.js` file of `pkg/browser/` and `pkg/registry/liquid/assets/` with its gzip size and its budget from `size-budget.json` (PLAN 7.3).
12. Write `docs/plan/done/M1-T46.md` with: the commands above and their exit codes, the SPIKE-06 state, the verdict of every spike, the follow-up rows, the marker list, the size table. Commit, push, pull request (PLAN 5.0).

### Acceptance

Every step above holds. The gate text of PLAN 4.2 row M1 is the authority; when a step here and that row differ, the row wins.

### Out of scope

Fixing failures. Starting M2.

### If blocked

Any step fails: the gate does not pass. Write the done file with status `FAILED: <step number> <reason>`, open the pull request as draft, and name the task whose output is wrong. A spike with verdict `FALLBACK required` does not fail the gate when its follow-up row exists.

---

## M1-T47 Remix morph test routes `/__rp/morph/a?c=<id>` and `/__rp/morph/b?c=<id>` in `examples/remix/server.mjs`, served under `RIPPLE_TEST_ROUTES=1` for any component

- **Goal:** Give the `[T4] <component id>: remix morph keeps state, instance and listeners` tests (M0-T38) and the Remix AT rows of M1-T15 and M1-T17 the two routes that item 6 of `docs/13-testing.md` section 12.1 requires.
- **Depends on:** M1-T01, M1-T12.
- **Kind:** `example`. Needs Node 24.3 or later.

### Read first

`docs/13-testing.md`: `### 9.2 ` (1 kB), `### 12.1 ` (3 kB), `### 7.4 React and Remix adapters` (9 kB; `caseJsx`, `writeTsxWorkDir`, `caseModuleSource` and the Remix differences table). `docs/06-bindings.md`: `### 7.3 Host extras, complete table` (1 kB), `### 11.3 Remix adapter` (2 kB; Q-13 and Q-15). The Remix spike `docs/research/spikes/remix/`: `README.md` (the esbuild commands), `server.mjs`, `src/pages.tsx`, `src/entry.ts` (the client entry calls `run` from `remix/component`) (8 kB together). Repository: `examples/remix/server.mjs`, `examples/remix/package.json`, `examples/.gitignore` (M0-T31), `test/support/hosts/react.ts`, `test/support/hosts/remix.ts`, `test/support/hosts/tsx.ts`. Total about 25 kB.

### Files

Change: `examples/remix/server.mjs`; `examples/.gitignore` (one line `.ripple-morph/`). Create: the done file. Nothing else: M7-T21 replaces the whole example and keeps the routes.

### Steps

1. Branch `task/M1-T47-remix-morph-routes`. `pnpm build && pnpm examples:install` (network needed; section 0.2).
2. In `examples/remix/server.mjs`, replace the comment line `// the routes /__rp/morph/a and /__rp/morph/b (docs/13-testing.md 12.1 item 6, 9.2) are added by M1-T47` (M0-T31 step 4) by the two routes. They exist only when `process.env.RIPPLE_TEST_ROUTES === "1"`; otherwise the paths answer `404` like any other path (12.1 item 6). `GET /` keeps answering 200.
3. Start-up work (once, before `listen`, only when `RIPPLE_TEST_ROUTES` is `1`). The spec prints no example source (M0-T31 step 2), so the mechanism below is a plan reading; it reuses the Remix conformance adapter instead of writing a second renderer:
   - Work directory `examples/remix/.ripple-morph/` (not `.ripple-conformance/`, which tier 2 recreates on every run, doc 13 X-1). Resolve the repository root from `import.meta.url` and `process.chdir` to it, because the adapter functions read `components/` relative to the working directory.
   - Bundle the adapter helpers with esbuild (a root dev dependency) through the `stdin` option (`resolveDir` the repository root, `loader: "ts"`, `bundle: true`, `platform: "node"`, `format: "esm"`, `external: ["esbuild"]`, `outfile` `.ripple-morph/support.mjs`), with the contents `export { loadFixtures, restoreChildren } from "./src/testing/index"; export { writeTsxWorkDir } from "./test/support/hosts/react"; export { caseJsx, caseModuleSource } from "./test/support/hosts/tsx";`, and import the output file.
   - Take the cases of `loadFixtures()` whose `hosts` include `remix` and whose id ends in `/default`. Call `writeTsxWorkDir("examples/remix/.ripple-morph", "remix", cases)`, write `entry.tsx` with the Remix `entry.tsx` text of the doc 13 section 7.4 differences table, and bundle it with the Q-13 options of that table (`jsx: "automatic"`, `jsxImportSource: "remix/component"`, `external: ["remix", "remix/*"]`) to `.ripple-morph/entry.mjs`. Import its `render`.
   - Bundle the client entry `client.ts` (text: `import { run } from "remix/component"; const app = run({ async loadModule(_url, name) { throw new Error("unknown " + name) } }); await app.ready();`, the form of `src/entry.ts` of the spike) with `bundle: true`, `format: "esm"`, `target: "es2022"`, the same `jsx` options, and remix NOT external, to `.ripple-morph/client.js`.
4. Routes `GET /__rp/morph/a?c=<id>` and `GET /__rp/morph/b?c=<id>`: when no case `<id>/default` exists, answer 404 with body `unknown component <id>`. Otherwise answer 200 with an HTML document whose head links `/ripple.css` and loads `/ripple.js` (served from `pkg/browser/ripple.css` and `pkg/browser/ripple.js`) and `/__rp/morph/client.js` (the client bundle) as module scripts, and whose body holds `restoreChildren(await render(id), caseJsx(case, "remix").fragments, id)` followed by `<a href="/__rp/morph/b?c=<id>">b</a>` on route `a` and `<a href="/__rp/morph/a?c=<id>">a</a>` on route `b`. Both routes render the same fixture, so the same `id` and `data-rmx-key` (doc 06 section 7.3) are on both. The server also answers `GET /ripple.css`, `GET /ripple.js` and `GET /__rp/morph/client.js` under the same switch. No `<Frame>`, no `reloadFrames`, no `navigate` (doc 13 section 9.2, 12.1 item 7).
5. No morph test runs in this task: M0-T38 registers one only for components of kind `native`, `ui` or `commerce`, and the first one in the slice is QuantityInput (M1-T15, which depends on this task). The proof here is the curl checks of Acceptance on `button` (M1-T01, kind `static`).
6. `pnpm ci`. Commit, push, pull request (PLAN 5.0).

### Acceptance

`pnpm build && RIPPLE_TEST_ROUTES=1 PORT=4998 pnpm --dir examples/remix start & sleep 5; curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:4998/__rp/morph/a?c=button"; curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:4998/__rp/morph/b?c=button"; curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:4998/__rp/morph/a?c=no-such-id"; kill %1` prints `200`, `200`, `404`. The same first curl with `PORT=4997 pnpm --dir examples/remix start` (no `RIPPLE_TEST_ROUTES`) prints `404`. `curl -s "http://127.0.0.1:4998/__rp/morph/a?c=button" | grep -c 'href="/__rp/morph/b?c=button"'` prints `1`. `git check-ignore -q examples/remix/.ripple-morph/entry.mjs` exits 0. `pnpm ci` exits 0.

### Out of scope

The morph tests themselves (M0-T38) and the AT rows that use the routes (M1-T15, M1-T17 and later). `<Frame>`, `reloadFrames`, `navigate` (SPIKE-11, M1-T45). The storefront routes of 12.1 item 3 and mock.shop data (M7-T21, which replaces this example).

### If blocked

- Node below 24.3: `examples/remix` cannot install or run. Write the routes, run only `pnpm ci` (the Remix cases skip with the T-7 reason), list the skip lines in the pull request; the `verify` job is the proof (section 0.2).
- No network: as section 0.2.
- A slice component's `default` fixture does not render with the Remix binding: the route answers 500 with the error text; record the component id in the done file as `FOLLOW-UP NEEDED: <id> default does not render in examples/remix`.
