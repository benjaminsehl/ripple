# Ripple implementation plan

Status: master plan for building Ripple from the specs in `docs/`. The decision ledger `docs/00-decisions.md` wins on any conflict with this file (ledger section 0). This file adds only process: milestones, tasks, order, recipes, gates. It defines no API.

An implementer reads sections 1 to 3, the recipe for the task's kind in section 5, and the ONE row of section 6 for the task. Do not read the whole task table. Then read the task's detail section in the milestone file under `docs/plan/`.

Contents: 1 How to use. 2 Branch, pull request, commit. 3 Definition of done. 4 Milestones and gates. 5 Recipes. 6 Task table. 7 Risk register. 8 Plan notes and ledger issues.

---

## 1. How to use this plan

1. Read `AGENTS.md` (repo root), then `docs/CONVENTIONS.md`, then sections 1 to 3 of this file.
2. Pick the task: the lowest task id (milestone number first, then task number) for which all of these hold:
   - no file `docs/plan/done/<task id>.md` exists on `main`;
   - no remote branch `task/<task id>-*` exists (`git ls-remote --heads origin 'task/<task id>-*'` prints nothing);
   - every id in its "Depends on" column has a file in `docs/plan/done/`;
   - it is not marked BLOCKED-ON-BEN, or the thing it waits for is present (section 4.3).
3. A task MAY start as soon as its dependencies are done, whatever its milestone number. Milestone numbers order the work; they are not locks. Tasks with the same group letter inside one milestone touch different files and MAY run at the same time.
4. Read the task's detail: file `docs/plan/<milestone file>`, section `## <task id>`. Read only the files and sections that detail names. Budget: `docs/CONVENTIONS.md` plus at most about 60 kB of other material. Never read a numbered doc (`docs/01-*.md` to `docs/14-*.md`) in full; open the named section by searching for its heading.
5. Do the task on one branch, open one pull request (section 2), prove the definition of done (section 3).
6. One task is one branch is one pull request. Do not start a second task in the same session. Do not fix unrelated files; note the defect in the done file instead.
7. If the task cannot be finished: push the branch, open the pull request as a draft, and write in its description what is done, what is not, and the exact failing command with its last 20 lines of output. Do not write a done file.

Rules that hold for every task:

- The spec is the source. Code blocks in a spec marked "complete" MUST be copied unchanged, then fixed only where a named gate fails (D-113). Do not redesign.
- Never invent a name, prop, attribute, file path, rule id or API. If the spec lacks something the task needs, stop and record it under `## Ledger issues` at the end of the owning doc (ledger section 0), mention it in the pull request, and take the smallest choice that keeps the gate green.
- Never edit `docs/00-decisions.md` except the one-line update a spike task makes to its row in ledger section 3.
- Never edit `theme/` or `docs/research/` (reference material), except that a spike task adds its report directory `docs/research/spikes/<spike name>/`.
- A generated file is never edited by hand. Change its source and run `pnpm gen`.

## 2. Branch, pull request, commit

| Thing | Convention |
|---|---|
| Branch | `task/<task id>-<slug>`, from the current `main`. Example: `task/M2-T07-text` |
| Commit subject | `<task id>: <imperative summary>`, at most 72 characters. Example: `M2-T07: add Text component` |
| Commits | Small and buildable. Generated files are committed in the same commit as the source change that produced them |
| Pull request title | `<task id> <task title from the table>` |
| Pull request body | The five headings below, in this order |
| Merge | Squash merge after the `verify` CI job is green. Never merge with a red or skipped check |
| Done file | `docs/plan/done/<task id>.md`, added in the same pull request |

Pull request body:

```text
## Task
<task id> and title. Link to the detail section.

## What changed
Files added or changed, grouped by directory. One line each.

## Proof
Each command of the definition of done, with the last line of its output.

## Deviations and ledger issues
"None", or each deviation from the spec with the reason and the `## Ledger issues` entry added.

## Notes for later tasks
Anything a later task must know. For a component: the intended look in two sentences (doc 13 section 18.1 line 14).
```

Done file `docs/plan/done/<task id>.md` (at most 15 lines): the task id and title; the pull request number; the list of files created; the final line printed by `pnpm ci`; deviations; notes for later tasks. Later sessions have no memory: this file is the only handover.

Conflicts with `main`: rebase, then run `pnpm gen`, then commit the regenerated files. Never resolve a conflict inside a generated file by hand.

## 3. Definition of done

### 3.1 Every task

1. Every file the detail section lists exists, and nothing outside the task's listed paths changed (except generated files and `docs/plan/done/<task id>.md`).
2. `pnpm typecheck` exits 0.
3. `pnpm gen --check` exits 0 (bring-up mode of section 4.4 relaxes rule MB-20 until task M5-T14).
4. `pnpm build` exits 0.
5. `pnpm examples:install` exits 0.
6. `pnpm test --no-skips` exits 0 on Node 24 and the last runner line reports `0 failed, 0 skipped`. Steps 2 to 6 are what `pnpm ci` runs.
7. Every test the detail section names exists with exactly that name and passes.
8. No test is skipped, marked `todo` or `only`. Test names follow `docs/13-testing.md` section 2.4.
9. The pull request and the done file exist in the form of section 2.

Before task M0-T28 is done, steps 4 to 6 are replaced by the commands the M0 detail section names for the task.

From task M7-T25 on, the no-JS flows on the hydrogen backend need `RIPPLE_NETWORK=1` and network access to `https://mock.shop/api`; without it they skip and `--no-skips` fails. A session without network runs `pnpm test`, lists the skipped tests in the pull request, and the `verify` CI job (which sets `RIPPLE_NETWORK=1`) is the proof.

### 3.2 Component tasks (in addition)

The 24 lines of `docs/13-testing.md` section 18.1 apply, with these readings:

| Line | Reading in this plan |
|---|---|
| 1 | The spec is `docs/components/<id>.md` (ledger, "File layout of the component specs") |
| 2 to 15, 18, 19, 21 to 24 | Required as written. Proof commands: `pnpm test:component --component=<id> --no-skips`, `pnpm test:visual --component=<id>`, `pnpm test:size`, `pnpm ci` |
| 16 (tier 7) | Not required in the component task. Components of kind `commerce` are merged with manifest `status: "beta"`; task M7-T28 sets `stable` after tier 7 passes |
| 17 (cross-engine) | Run `pnpm test:webkit --component=<id>` and `pnpm test:firefox --component=<id>` only when the engines are installed; attach the output. It blocks the merge only after task M9-T06 |
| 20 (tier 8) | Not required. Milestone M10 |

Components of kind `static`, `native` and `ui` are merged with `status: "stable"`.

### 3.3 Blueprint tasks (in addition)

1. `blueprints/<id>/blueprint.json` validates (`pnpm gen --check`).
2. Tests BT-1 to BT-7 and BT-9 of `docs/12-components-chrome-and-blueprints.md` section 2.8 pass for the blueprint in every host, plus every acceptance test of `docs/blueprints/<id>.md`. BT-8 is tier 8 (M10).
3. The html file is generated (`pnpm gen`), not written.
4. The blueprint contains no CSS, no `style=`, and no class outside `rp-` (rule BP-1).

### 3.4 Spike tasks

1. A report `docs/research/spikes/<spike name>/README.md` exists with: the question, the procedure run, the commands, the observed result per check, and the verdict `DEFAULT holds` or `FALLBACK required`.
2. The code that produced the result is in the same directory or is a test in the repository that the report names.
3. The row of the spike in ledger section 3 gets one appended sentence: `Result (<date>): <verdict>; report docs/research/spikes/<name>/README.md.`
4. When the verdict is `FALLBACK required`, the task does NOT apply the fallback. It adds a done-file note; the next session opens the follow-up described in section 7.

### 3.5 Gate tasks

A gate task changes no source. It runs the commands of the gate (section 4.2), writes their output summary into its done file, and lists every task of the milestone with its pull request. A gate fails when any command fails; the gate task then names the failing task and stops.

---

## 4. Milestones and gates

### 4.1 Order and mapping to the ledger

Milestone numbers in this plan differ from D-067. The "Milestone" field of a component spec and the tier table of `docs/13-testing.md` section 1 use D-067 numbers. The mapping:

| Plan | Title | Detail file | D-067 milestone it implements |
|---|---|---|---|
| M0 | Repository bootstrap: build, generator, test harness in four hosts | `docs/plan/M0-bootstrap.md` | M1 (infrastructure part) |
| M1 | Golden path vertical slice and local spikes | `docs/plan/M1-golden-path.md` | M0 (spikes 04, 05, 06, 07, 08, 10, 11), parts of M1, M2, M3 |
| M2 | Foundations breadth | `docs/plan/M2-foundations.md` | M1 (doc 09 components, checker layers S and H) |
| M3 | Interactive components | `docs/plan/M3-interactive.md` | M2 |
| M4 | Commerce components | `docs/plan/M4-commerce.md` | M3 |
| M5 | Chrome components | `docs/plan/M5-chrome.md` | M4 (components) |
| M6 | Registry, CLI, checker | `docs/plan/M6-cli-registry-checker.md` | M1 (checker), D-056 to D-059 |
| M7 | Blueprints and the four example storefronts | `docs/plan/M7-blueprints-examples.md` | M4 (blueprints), M5 (Ripple theme, local tiers) |
| M8 | Agent kit and evals | `docs/plan/M8-agent-kit-evals.md` | M3 (eval baseline), M6 |
| M9 | Release | `docs/plan/M9-release.md` | none (D-103, doc 07 section 11) |
| M10 | Liquid live track (BLOCKED-ON-BEN) | `docs/plan/M10-liquid-live.md` | M5 (live tiers, SPIKE-01, 02, 03, 09) |

M6 comes before M7 because the example storefronts are produced only by the CLI (D-099, D-107; `docs/13-testing.md` section 12.1). M6 tasks depend only on M1 and MAY run in parallel with M2 to M5.

### 4.2 The gate that ends each milestone

| Milestone | Gate task | The gate passes when |
|---|---|---|
| M0 | M0-T45 | On a tree with zero components: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm gen --check`, `pnpm build`, `pnpm examples:install`, `pnpm test` all exit 0; `pkg/browser/` holds exactly the 12 `.js` files of D-054; the `verify` CI job is green; `ripple check` is not required yet |
| M1 | M1-T46 | `pnpm ci` exits 0 with the 21 slice components. For each of them tiers 1, 2, 3, 4, 5, 6 and 10 pass in `html`, `react`, `remix` and `liquid` (shim) with no skip. Commerce tests C-01 to C-13, C-16, C-18, C-23, C-25 pass. The theme-server golden path of M1-T39 passes (add to cart with scripts, and with scripting disabled). Reports exist for SPIKE-04, 05, 07, 08, 10 part (a) and 11; SPIKE-06 has a report or is recorded as waiting for WebKit and Gecko builds |
| M2 | M2-T32 | The 37 components of doc 09 are present and `stable`; `pnpm ci` exits 0; checker rules RP101 to RP105, RP110 to RP118, RP201 to RP204 each have a passing and a failing example |
| M3 | M3-T11 | The 9 components of doc 10 are present and `stable`; tier 4 passes for every `native` and `ui` component; every row of `docs/04-elements.md` section 13 has a passing test except rows about `rp-navigation-menu` |
| M4 | M4-T24 | The 26 components of doc 11 are present; commerce tests C-01 to C-16, C-18, C-22 to C-25, C-27, C-29, C-32 pass; SPIKE-10 part (b) has a report; checker rules RP301 to RP309, RP320, RP321 have examples |
| M5 | M5-T15 | All 84 components are present; the constant `BRINGUP_SUBSET` is deleted (M5-T14) and `pnpm gen --check` exits 0 with rule MB-20 strict |
| M6 | M6-T35 | Every CLI command of D-057 exists and passes its acceptance rows of `docs/07-manifest-registry-cli.md` section 12, including RB-8 and RB-9; all 55 checker rule ids of D-059 are implemented and listed in `src/check/rules/index.ts` |
| M7 | M7-T29 | The 14 blueprints pass BT-1 to BT-7 and BT-9 in every host; the four examples exist and were produced by the CLI; `RIPPLE_NETWORK=1 pnpm test:commerce --no-skips` exits 0 (tier 7); `pnpm test:nojs --no-skips` with `RIPPLE_NETWORK=1` passes NJ-F1 to NJ-F16; the Ripple theme passes A-1 to A-19, A-24 and A-25 of `docs/14-liquid-theme.md` section 14; every commerce component is `stable` |
| M8 | M8-T43 | The 14 skills, 12 guides and the `AGENTS.md` section pass the acceptance lists of `docs/08-agent-kit-and-evals.md` sections 2.8, 3.4 and 4.6; eval gate E2 passed (M8-T40); eval gates E1 and E3 passed or are recorded as BLOCKED-ON-BEN with the missing input named |
| M9 | M9-T08 | `pnpm release:check` exits 0; CI jobs `verify`, `node22`, `rename`, `package-node20` are green; the hand-off note for Ben exists |
| M10 | M10-T08 | `RIPPLE_STORE_URL=<store> pnpm test:liquid-live` exits 0, the four store spikes have reports, and every required fallback is applied (M10-T06) |

Eval gates (explicit, D-061, `docs/08-agent-kit-and-evals.md` section 8.14):

| Gate | Task | Passes when | Needs from Ben |
|---|---|---|---|
| E1 baseline | M8-T39 | T01, T02 and T08 ran once on `react` and on `liquid` (local tier) with the `pi` adapter and one more adapter; scores without the judge are in `docs/research/spikes/evals-baseline/README.md` | model access (`RIPPLE_EVAL_API_KEY`) |
| E2 references | M8-T40 | Every reference solution of T01 to T17 scores at least 95 (K-62) | nothing |
| E3 Sidekick bar | M8-T42 | The judge is calibrated, budgets are frozen, `pnpm eval -- --bar` reports B-1 to B-7 passed | `weakModel` and `judgeModel` ids (ledger Q17) |
| E4 release | M9-T07 | Core set, 5 runs per cell; pass rate not more than 5 points below the previous release | model access |
| E5 live | M10-T09 | B-8 passes on the preview store | preview store (ledger Q5) |

### 4.3 BLOCKED-ON-BEN

A task marked BLOCKED-ON-BEN waits for something only Ben can provide. It never appears in another task's "Depends on" column unless that task is blocked on the same thing. Skip it when picking a task.

| Waiting for | Present when | Tasks |
|---|---|---|
| Liquid preview store (ledger Q5) | CI secret `RIPPLE_STORE_URL` (and `RIPPLE_STORE_PASSWORD`) is set, and `docs/plan/done/BEN-store.md` exists | M10-T02 to M10-T09 |
| Model access for evals | CI secret `RIPPLE_EVAL_API_KEY` is set, and `docs/plan/done/BEN-eval-access.md` exists | M8-T39, M8-T41, M9-T07 |
| Model ids for the bar (ledger Q17) | `evals/rubric/bar.json` has non-null `weakModel` and `judgeModel` | M8-T42, M10-T09 |

The final package name (the placeholder is `ripple-kit`, D-052) and publishing are Ben's actions after M9; no task waits for them.

Environment limits that are not Ben's: SPIKE-06 (M1-T42) and line 17 of the component checklist need Playwright WebKit and Firefox builds; tier 7 (M7-T26) needs network access to `https://mock.shop/api`. A session without them records `BLOCKED-ON-ENV` in a draft pull request and picks another task.

### 4.4 Bring-up mode (plan rule, temporary)

`docs/07-manifest-registry-cli.md` rule MB-20 requires all 84 components and says `pnpm build` MUST NOT pass `--subset`. That cannot hold while components are being added. Until task M5-T14:

- `src/gen/index.ts` exports one constant: `export const BRINGUP_SUBSET = true; // PLAN 4.4: remove in M5-T14`. While it is true, `pnpm gen --check` behaves as `pnpm gen --check --subset` (the relaxation of MB-20: every present id is one of the 84 ledger ids).
- `src/gen/build.ts` imports the constant. While it is true, build step 2 uses the relaxed check, and the entry-point lists of build steps 4, 5 and 7 are filtered to files that exist.
- The `scripts` of the root `package.json` are never changed for bring-up; they stay byte-equal to `docs/13-testing.md` section 2.3.
- A build sub-step whose module does not exist yet (registry, docs, skills copy) is skipped with one printed line `build: skipped <step> (PLAN 4.4)`. The task that adds the module removes the skip.
- M5-T14 deletes the constant. M9-T05 fails when the string `PLAN 4.4` occurs anywhere under `src/`.

This is the only mechanism this plan adds to the specs. It is listed in section 8 as a ledger issue.

---

## 5. Recipes

Each recipe is a fixed sequence. `<id>` is the component id, `<Title>` its PascalCase name, `<tag>` an element tag. Run every command from the repository root. Commands marked (proof) go into the pull request.

### 5.0 Steps common to every code task

```bash
git fetch origin && git switch -c task/<task id>-<slug> origin/main
pnpm install --frozen-lockfile
```

Work. Then, in this order:

```bash
pnpm gen                    # only when a manifest, css/tokens.css, an icon or a locale string changed
pnpm typecheck              # (proof)
pnpm gen --check            # (proof)
pnpm build                  # (proof)
pnpm examples:install       # (proof) needed after every build
pnpm test --no-skips        # (proof) or `pnpm ci`, which runs the five commands above
git add -A && git commit -m "<task id>: <summary>"
git push -u origin task/<task id>-<slug>
```

Do not run `pnpm exec playwright install` with any browser other than `chromium` unless the task detail says so.

### 5.1 What to read for a component

1. `docs/CONVENTIONS.md`.
2. The spec `docs/components/<id>.md`, complete. Its sections are, in order: Purpose, Anatomy, Props, Content model, HTML contract, State and attributes, Behaviour with JavaScript, Behaviour without JavaScript, Events commands and methods, Accessibility, Styling, Host notes, Commerce, Agent surface, Checker rules, Acceptance tests, Evidence and UNVERIFIED, optional Fallback.
3. Section 0 of the group doc the spec's first line names (`docs/09-components-foundation.md`, `docs/10-components-interactive.md`, `docs/11-components-commerce.md`, or sections 0 and 1 of `docs/12-components-chrome-and-blueprints.md`).
4. One worked manifest entry of `docs/07-manifest-registry-cli.md` section 1.7 as the shape to copy: 1.7.1 Button (`static`), 1.7.2 Dialog (`native`), 1.7.3 ProductForm (`commerce`).
5. `docs/13-testing.md` section 10.2 (what the component's test file MUST cover).
6. Nothing else, unless the task detail names it.

### 5.2 Recipe S: component of kind `static` whose bindings are generated

Applies when the spec's Host notes say the React, Remix and Liquid files are generated.

1. Create `components/<id>/<id>.json`. Fill every key from the spec: field table (`name`, `title`, `category`, `kind`, `root`, `liquid.tier`, `noJs`, `dependencies`), Props (`props[]`), Anatomy (`parts[]`), Content model (`content`), HTML contract (`template`), State (`state[]`), Checker rules (`rules[]`), fixtures list (`fixtures[]`, each with `generated`). Use only the manifest keys of ledger section 4.8. Set `status` to `stable`, `since` to the value the M0 detail fixes.
2. Create `components/<id>/<id>.css` from the spec's Styling section. Where the spec gives the complete file, copy it unchanged. Otherwise follow the skeleton of `docs/03-styling-and-tokens.md` section 7.2 and the rules of 7.3.
3. Add the component's locale keys (spec, Host notes or Accessibility) to `locales/en.default.json` under `ripple.<id>.*`.
4. Run `pnpm gen`. It writes `fixtures/*.html` for fixtures with `generated: "template"`, `html/<id>.html`, `react/<id>.tsx`, `remix/<id>.tsx`, the Liquid files, the locale file and the types. For a fixture with `generated: "hand"`, create `components/<id>/fixtures/<name>.html` with the exact HTML of the spec's HTML contract section, then run `pnpm gen` again.
5. Compare each generated fixture with the HTML printed in the spec. They MUST be equal after whitespace. A difference is a defect in the manifest `template` (fix it) or in the generator (stop; report; do not hand-edit output).
6. Create `components/<id>/<id>.test.ts`: one test per row of `docs/13-testing.md` section 10.2 that applies; one test per numbered acceptance test named `[T<n>] <id>: AT-<n> <statement>`, or the line `// AT-<n>: generic` when the generic matrix already proves it; one failing example per manifest rule that asserts `RP113` with the rule id in brackets.
7. Record style snapshots, look at them, and commit them:

```bash
pnpm build && pnpm examples:install
pnpm test:visual --component=<id> --update
pnpm test:component --component=<id> --no-skips   # (proof)
pnpm test:size                                     # (proof)
```

8. Finish with section 5.0.

### 5.3 Recipe N: component of kind `native`

Everything of recipe S, plus:

1. The element task for the component's `rp-*` tag MUST be done first (table column "Depends on").
2. The manifest has `state[]` with `writer`, `events[]`, `commands[]`, `upgradeAllow[]` (each entry with a `reason`), `noJs` with `hideUntilDefined` where the spec says so.
3. The Remix file, the Liquid files and the html file are generated. The React file `components/<id>/react/<id>.tsx` is hand-written BELOW the generated header region: run `pnpm gen` first (it writes the header), then add the component functions. Patterns: `docs/06-bindings.md` section 6.6 (Dialog). Rules: `"use client"` first line because the file calls `useElement`; exports are components only; no helper is exported.
4. Tests add: tier 3 (zero unpermitted mutations) and tier 4 (React hydration in both script orders, Remix morph) come from the generic test files; write per-component `[T4]` tests only for props that D-036 makes controllable. Tier 5 covers keyboard, focus and every event of the spec. Tier 6 covers the "Behaviour without JavaScript" section.
5. Verify the React header region is still byte-identical: `pnpm gen --check`.

### 5.4 Recipe U: component of kind `ui` (Tabs, Tooltip, Toast)

Everything of recipe N, with these differences:

1. No `rp-*` element task. The UI SDK chunk entry exists since M0-T26. Do not import any `@ui-sdk` module other than those the spec names.
2. Fixtures have `generated: "upgrade-snapshot"`. They are produced by the browser, not written: after the manifest and CSS exist, run

```bash
pnpm build
pnpm gen --snapshot <id>
```

   The command fails when the stability re-check records a mutation; then the manifest template is wrong, not the snapshot. Task M3-T03 MUST be done first.
3. The server prints every attribute the element would write at upgrade (the snapshot is the contract, D-012). Compare the snapshot with the HTML in the spec; report any difference in the pull request.
4. React pattern: `docs/06-bindings.md` section 6.6 (Tabs).

### 5.5 Recipe E: an `rp-*` element

1. Read `docs/04-elements.md` section 7 (rules for writing an element) and the element's own section named in the task row. For a commerce element read `docs/05-commerce.md` section 7.7 (element shell) and the element's subsection of section 7.
2. Create `src/elements/<tag>.ts` (or `src/commerce/<tag>.ts`). Where the spec gives the complete file, copy it unchanged. Commerce elements start from the spike file `docs/research/spikes/commerce/src/commerce/<tag>.ts` and apply the changes listed in `docs/05-commerce.md` section 1.
3. Register the tag: confirm its row exists in `src/gen/elements.json` (`display: "block"`, `chunk`, `commerce`; the file is complete since M0-T06), add the source file to the entry point the spec names (`docs/04-elements.md` section 4.1), and remove the element's bring-up stub if M0-T26 created one.
4. Create `src/elements/<tag>.test.ts` (or `src/commerce/<tag>.test.ts`) with the tests the element's section and `docs/04-elements.md` section 13 (or `docs/05-commerce.md` section 14) list for it, using the ids as written (`E-05`, `C-02`).
5. Markup for the tests comes from the spec's "Markup the server prints" block; do not invent markup.
6. Run `pnpm gen` (types and display rules change), then section 5.0. `pnpm test:size` MUST still pass: the element counts toward the `ripple.js` and `ripple.elements.js` budgets.

### 5.6 Recipe C: component of kind `commerce` (and any component the spec marks hand-written)

1. Manifest as in recipe S, plus `liquid.formDialect`, `hydrogenHost.formDialect`, `agent`, `upgradeAllow[]`, and backend-scoped fixtures (`<name>` for hydrogen hosts, `liquid-<name>` for Liquid) exactly as the spec lists them. Fixture props reference resources as `{ "$resource": "<type>.<name>" }`; the resource values are in `src/testing/resources.ts`.
2. Every fixture is `generated: "hand"`: create each `components/<id>/fixtures/<name>.html` with the exact HTML of the spec.
3. Run `pnpm gen`. It writes `html/<id>.html` from the fixture files, and the generated regions of the three hand-written bindings (TSX header; Liquid `{% doc %}`, `{% schema %}`, enum guards).
4. Write `react/<id>.tsx` and `remix/<id>.tsx` below the header. Patterns: `docs/06-bindings.md` sections 6.7 and 7.7. Pure data helpers go to `react/<id>.data.ts` (D-094). The only `@shopify/hydrogen` value imports allowed are the seven of D-094. Embedded components are rendered by importing the sibling binding, never by copying markup (D-070).
5. Write the Liquid files. Pattern: `docs/06-bindings.md` section 8.7. Use only the Liquid subset of D-097. Embedded components are printed with `{% render 'rp-<id>' %}`.
6. Set `status` to `beta` when the kind is `commerce` (section 3.2).
7. Tests as in recipe N. The `[T5]` behaviour tests run against the emulations (`test/support/fake-sa.js` for Liquid, the stub `/api/cart` server of `test/commerce/hydrogen.test.ts` for hydrogen); the `[T6]` tests prove each form posts with the field names of `docs/05-commerce.md` section 10.5.

### 5.7 Recipe R: additions for Liquid tier `resource` (self-contained block)

Applies in addition to S, N or C when the spec's field table says Liquid tier `resource`.

1. The block file `liquid/blocks/<id>.liquid` takes a Shopify resource (product, collection, cart, linklist, ...) and prints the whole component; it has no child blocks (D-037). The spec's Anatomy table names every Liquid file. Where it lists `snippets/rp-<id>.liquid` too, the markup lives in the snippet and the block calls `{% render 'rp-<id>', ... %}`.
2. A component that owns a region prints the region part through a region-part snippet `liquid/snippets/rp-<id>-<part>.liquid` (D-091); the names are in the spec's Anatomy table. Do not create any other snippet.
3. Fixtures for Liquid render through the shim with the drops of `src/testing/resources.ts`; the TSX hosts receive the same resource as a typed object from `src/types.ts`. The canonical HTML MUST be equal across hosts except for the masks the spec lists.
4. Schema settings: at most three, only those the spec lists; label keys `t:ripple.<id>.*`.

### 5.8 Blueprint recipe

1. Read `docs/CONVENTIONS.md`; the spec `docs/blueprints/<id>.md`, complete; `docs/12-components-chrome-and-blueprints.md` sections 2.1 to 2.4 and 2.8; for Liquid `docs/14-liquid-theme.md` section 3.
2. Create `blueprints/<id>/blueprint.json` in the shape of the complete example in `docs/12-components-chrome-and-blueprints.md` section 2.1; `components` and `regions` are the lists of the spec's "Components used" and "Regions".
3. Create `blueprints/<id>/react/<id>.tsx` and `blueprints/<id>/remix/<id>.tsx` from the spec's Structure section. Import components as `@components/<component id>`. Use the fixed ids of D-107 and the spacing values of D-106. No CSS, no class outside `rp-`.
4. Create the Liquid target files named in section 2.1 of doc 12 under `blueprints/<id>/liquid/`. The complete text of every `layout/*.liquid` and `templates/*.liquid` file is in the spec: copy it unchanged.
5. Add the blueprint's locale keys to `locales/en.default.json` under `ripple.blueprints.<id>.*`.
6. Add or extend the sample data `blueprints/_sample/<id>.json` as the spec's "Data requirements per backend" says.
7. Run `pnpm gen`. It writes `blueprints/<id>/html/<id>.html` (step G10). Never write the html file by hand.
8. Create `blueprints/<id>/<id>.test.ts` with BT-1 to BT-7, BT-9 and the spec's own acceptance tests, ids as written (`CR-2`, `BP-11`).
9. Finish with section 5.0.

---

## 6. Task table

297 tasks. Find your row by searching for the task id; do not read the whole table.

Columns:

- **Id**: `M<milestone>-T<nn>`. Lower ids are picked first (section 1).
- **Kind** selects the recipe and the definition of done:

| Kind | Meaning | Recipe, definition of done |
|---|---|---|
| `infra` | repository, build, CI plumbing | 5.0; 3.1 |
| `harness` | test runner, test library, test files | 5.0; 3.1 |
| `gen` | a generator module under `src/gen/` | 5.0; 3.1 |
| `css` | core CSS under `css/` | 5.0; 3.1 |
| `runtime` | a non-element source module (`src/runtime/`, `src/commerce/` adapters, `src/react/`, `src/remix/`, `src/agent/`) | 5.0; 3.1 |
| `element` | one `rp-*` custom element | 5.5; 3.1 |
| `<kind>/<tier>; <recipes>` | one component: manifest kind, Liquid tier, then the recipes to apply (`S` 5.2, `N` 5.3, `U` 5.4, `C` 5.6, `+R` adds 5.7). `S or C`: recipe S when the spec's Host notes say the bindings are generated, otherwise C | 3.1 and 3.2 |
| `blueprint` | one blueprint or blueprint support | 5.8; 3.1 and 3.3 |
| `cli` | one CLI command or CLI module under `src/cli/` | 5.0; 3.1 |
| `checker` | one checker module or rule family under `src/check/` | 5.0; 3.1; every rule has a passing and a failing example test in `src/check/rules/<RULE>.test.ts` |
| `example` | an example storefront under `examples/` | 5.0; 3.1 |
| `docs`, `guide`, `skill` | shipped documentation: `guides/`, `skills/`, generated docs | 5.0; 3.1; the acceptance list the row names |
| `eval` | eval harness or eval tasks under `evals/` | 5.0; 3.1 |
| `spike` | run a spike and report | 3.4 |
| `gate` | milestone or eval gate | 3.5 |
| `release` | release checks | 5.0; 3.1 |

- **Depends on**: task ids that MUST be done first. `A to B` means every id in the range. For a component the list contains the tasks of every component its spec lists under "Depends on".
- **Grp**: parallel group inside the milestone. Tasks with the same letter have no dependency on each other and touch different source files; they MAY run at the same time once their dependencies are done. `-` means run it alone (it touches shared files or is a gate).
- **Size**: `S` is at most half a session (mostly copying complete code from the spec, or one small file with tests). `M` is one full session. Nothing is larger; a task that proves larger is split by adding a follow-up row, never by widening scope.
- **Read**: the material beyond `docs/CONVENTIONS.md`. `doc 07 §9.6` means the section 9.6 of `docs/07-manifest-registry-cli.md` (numbered docs are `docs/NN-*.md`). `components/x.md` is `docs/components/x.md`; `blueprints/x.md` is `docs/blueprints/x.md`. Sizes in kB are the spec file sizes. Component rows also read `docs/13-testing.md` section 10.2 and one worked manifest entry (recipe 5.1).

Rules for the authors of the detail files (`docs/plan/M*.md`): one section `## <task id>` per row, in table order, each with these headings: Goal (two sentences); Files (exact paths to create or change, and paths that MUST NOT change); Read (file, section heading, approximate size; total at most 60 kB beyond CONVENTIONS); Steps (numbered, with the exact commands); Names and values (every identifier, attribute, path and literal the task needs, copied from the spec, or the exact section to copy from); Tests (exact test names and the file each lives in); Proof (the commands of section 3 that apply); Out of scope. A detail section MUST NOT add scope to its row and MUST NOT contradict a spec; where the spec is silent it says so and names the owning doc. When a row's Read list would exceed 60 kB, the detail section MUST narrow it to subsections by heading and carry the needed shape inline (for example the manifest key skeleton for the component's kind) instead of sending the reader to a whole worked entry. Material quoted inline is copied from the spec byte for byte, with its source section named.

### M0 Repository bootstrap

Detail file for every row: `docs/plan/M0-bootstrap.md`, section `## <task id>`. 45 tasks.

| Id | Title | Kind | Depends on | Grp | Size | Read |
|---|---|---|---|---|---|---|
| M0-T01 | Root `package.json`, `tsconfig.json`, `.gitignore`, `LICENSE`, `CHANGELOG.md`, root `README.md` and root `PLAN.md` pointer stubs, `docs/plan/done/`; `pnpm install` writes `pnpm-lock.yaml` | infra | none | - | S | doc 01 §4.1, §5.1, §5.2, §9; doc 13 §2.2, §2.3 |
| M0-T02 | Test runner `test/run.ts` and `test/run.test.ts` (options, test-name rule) | harness | M0-T01 | - | S | doc 13 §2.4 to §2.7, §6.3, §18.3 |
| M0-T03 | `src/identity.ts`, `src/index.ts`, `src/responsive.ts` (`rv`, `cx`, `Responsive`) with tests | runtime | M0-T02 | A | S | doc 01 §6.3; doc 06 §4 |
| M0-T04 | `src/architecture.test.ts`: import rules (`IMPORT_RULES`) and repository layout tests that need no `pkg/` | harness | M0-T02 | A | S | doc 01 §2.2, §4, §11 |
| M0-T05 | Canonicaliser `src/testing/canonicalize.ts` with tests | harness | M0-T02 | A | M | doc 02 §12 |
| M0-T06 | Manifest schema `src/gen/schema/manifest.schema.json`, `src/gen/elements.json`, manifest types and loader (generator step G1) | gen | M0-T02 | A | M | doc 07 §1.1 to §1.5 |
| M0-T07 | Manifest build checks MB-1 to MB-24 (with `LEDGER_COMPONENTS`, the 84 ids) | gen | M0-T06 | B | M | doc 07 §1.6; ledger §8 |
| M0-T08 | Shared data types `src/types.ts` and image helpers `src/image.ts` (test C-22) | runtime | M0-T02 | A | M | doc 05 §11 |
| M0-T09 | Resource fixtures `src/testing/resources.ts` (the 21 references) | harness | M0-T08 | B | M | doc 13 §4.2; doc 11 §0.5 |
| M0-T10 | Fixture loader `src/testing/fixtures.ts` | harness | M0-T05, M0-T06, M0-T09 | C | M | doc 13 §4.1; doc 02 §11.1 to §11.6 |
| M0-T11 | Upgrade recorder `src/testing/upgrade-diff.ts` | harness | M0-T02 | A | S | doc 13 §4.3; doc 02 §7 |
| M0-T12 | Liquid shim `src/testing/liquid-shim.ts` | harness | M0-T09 | C | M | doc 13 §4.4; doc 06 rule L-13 |
| M0-T13 | Theme server `src/testing/serve-theme.ts`, `src/testing/index.ts`, `test/fixtures/theme-min/`, `test/liquid/shim.test.ts` (the `[T1]` rows) | harness | M0-T12 | D | M | doc 13 §4.5 to §4.7; doc 07 rule RB-8 (fixture content) |
| M0-T14 | Contract template language and reference renderer `src/gen/html.ts` | gen | M0-T06 | B | M | doc 07 §2 |
| M0-T15 | Generator command `src/gen/index.ts`: steps G1, G3, G4, G8 wiring; `--check`, `--subset`, unknown-argument exit 2; `BRINGUP_SUBSET` (PLAN 4.4) | gen | M0-T07, M0-T14 | C | M | doc 07 §3.1, §3.2; doc 02 §11.7 |
| M0-T16 | Generator `src/gen/react.ts` (step G6, React): whole static bindings and header regions | gen | M0-T03, M0-T15 | D | M | doc 06 §5, §6.1, §6.4, §6.5; doc 07 §3.3 |
| M0-T17 | Generator `src/gen/remix.ts` (step G6, Remix): static bindings, host extras | gen | M0-T03, M0-T15 | D | M | doc 06 §5, §7.1, §7.3 to §7.5; doc 07 §3.3 |
| M0-T18 | Generator `src/gen/liquid.ts` (step G5): block and snippet files, generated regions, locale outputs | gen | M0-T15 | D | M | doc 06 §8.1 to §8.5; doc 07 §3.2 row G5, §3.3 |
| M0-T19 | Generator `src/gen/types.ts` (step G7): `src/types.generated.ts`, `jsx.generated.ts` for React and Remix | gen | M0-T15 | D | S | doc 07 §3.2 row G7; doc 06 §6.3, §7.2 |
| M0-T20 | Source lint `bindings-lint` and fixture lint (part of step G8) | gen | M0-T15 | D | M | doc 06 §1.2; doc 02 §11.8 |
| M0-T21 | Core CSS: `css/layers.css`, `css/tokens.css`, `css/base.css` | css | M0-T02 | A | M | doc 03 §1, §2, §3.3, §4.1, §4.2 |
| M0-T22 | Generator step G2: `src/gen/props-css.ts` (`css/props.css`) and `src/gen/display-css.ts` (marker regions of `css/base.css`) | gen | M0-T15, M0-T21 | D | S | doc 03 §4.3, §6 |
| M0-T23 | Generator step G2: `src/gen/theme-css.ts` (`css/theme.css`), `src/gen/tokens-source.ts`, CSS entry files | gen | M0-T15, M0-T21 | D | M | doc 03 §5.1, §5.2, §5.5 |
| M0-T24 | CSS linter `src/gen/css-lint.ts` (part of step G8) | gen | M0-T15, M0-T21 | D | M | doc 03 §7.1 to §7.3, §7.9 |
| M0-T25 | Runtime `src/runtime/{index,loader,commands-polyfill,opener,announcer}.ts` | runtime | M0-T02 | A | S | doc 04 §3 |
| M0-T26 | Source entry points, UI SDK chunk entries (`tabs`, `tooltip`, `toast`), bring-up stubs for `src/commerce/index.ts`, `src/agent/index.ts`, `src/cli/index.ts`, `src/react/index.ts`, `src/remix/index.ts` | runtime | M0-T03, M0-T25 | B | S | doc 04 §2, §4.1, §4.2; doc 01 §6.4 |
| M0-T27 | Browser bundles `src/gen/browser-bundles.ts` (Rollup; 12 files; Liquid rewrite) | gen | M0-T26 | C | M | doc 04 §6 |
| M0-T28 | Build pipeline `src/gen/build.ts` (10 steps, bring-up skips of PLAN 4.4) and generated `pkg/package.json` | infra | M0-T15, M0-T27 | - | M | doc 01 §6.1, §6.2, §7 |
| M0-T29 | Size budgets: `size-budget.json`, `src/gen/size.ts`, `src/gen/size.test.ts` | harness | M0-T28 | E | S | doc 13 §15 |
| M0-T30 | Browser support code `test/support/{browser,server,collect,in-page}.ts`, `tailwind-entry.css`, the fixture page | harness | M0-T10, M0-T28 | E | M | doc 13 §5 |
| M0-T31 | Example package skeletons `examples/{html,react,remix}/package.json` with `build` and `start`, Remix morph test routes, `test/support/examples.ts` | example | M0-T28 | E | M | doc 13 §12.1, §9.2, §7.4 (work directories) |
| M0-T32 | Tier 2: `test/conformance/conformance.test.ts`, `test/support/hosts/index.ts`, `html.ts`, `test/conformance/acceptance-coverage.test.ts` (reads `docs/components/<id>.md`) | harness | M0-T30 | F | M | doc 13 §7.1, §7.2, §18.2; doc 06 §11.1, §11.5 |
| M0-T33 | Tier 2: Liquid host adapter `test/support/hosts/liquid.ts` | harness | M0-T13, M0-T18, M0-T32 | G | S | doc 13 §7.3; doc 06 §11.4 |
| M0-T34 | Tier 2: React and Remix host adapters `test/support/hosts/{tsx,react,remix}.ts` | harness | M0-T16, M0-T17, M0-T31, M0-T32 | G | M | doc 13 §7.4; doc 06 §11.2, §11.3 |
| M0-T35 | Tier 2: per-host extras `test/conformance/hosts.test.ts` (Q-7, Q-9, Q-12, Q-14, Q-19, Q-20, Q-22) | harness | M0-T33, M0-T34 | H | M | doc 13 §7.5; doc 06 §11 |
| M0-T36 | Tier 3: `test/upgrade/upgrade.test.ts` and `test/upgrade/bundles.test.ts` (A-07, A-08, A-13) | harness | M0-T11, M0-T30 | F | M | doc 13 §8; doc 01 §11 |
| M0-T37 | Tier 4: `test/hydration/react.test.ts`, `test/hydration/react-allow.ts` | harness | M0-T34 | H | M | doc 13 §9.1; doc 06 §11.2 (Q-10) |
| M0-T38 | Tier 4: `test/hydration/remix.test.ts` | harness | M0-T34 | H | S | doc 13 §9.2; doc 06 §11.3 (Q-15) |
| M0-T39 | Tier 5: `test/a11y/axe.test.ts`, `test/a11y/axe-exceptions.ts`, `test/a11y/keyboard.test.ts` | harness | M0-T30 | F | M | doc 13 §10.3 to §10.5 |
| M0-T40 | Tier 5: `test/visual/style.test.ts` (computed-style snapshots) | harness | M0-T30 | F | S | doc 13 §14 |
| M0-T41 | Tier 6: `test/nojs/render.test.ts` (scripts disabled and scripts blocked) | harness | M0-T30 | F | S | doc 13 §11.1 |
| M0-T42 | Checker core `src/check/{index,engine,report}.ts`: API, layers S and H, text and JSON output, `fix` computation | checker | M0-T10 | D | M | doc 07 §9.1, §9.3, §9.4, §9.5.1 |
| M0-T43 | Checker rule RP113: structure rule kinds and `CUSTOM_RULES` in `src/check/rules/RP113.ts` | checker | M0-T42 | E | S | doc 07 §9.5.3, §9.6 (row RP113); ledger D-111; doc 08 §5.5 (row RP113) |
| M0-T44 | CI workflows `.github/workflows/ci.yml` and `nightly.yml` | infra | M0-T28 | E | S | doc 13 §17 |
| M0-T45 | M0 gate | gate | M0-T01 to M0-T44 | - | S | PLAN §4.2 |

### M1 Golden path vertical slice and local spikes

Detail file for every row: `docs/plan/M1-golden-path.md`, section `## <task id>`. 46 tasks.

| Id | Title | Kind | Depends on | Grp | Size | Read |
|---|---|---|---|---|---|---|
| M1-T01 | Button (`button`) | static/block; S | M0-T45 | - | M | `components/button.md` (24 kB); doc 09 §0; doc 07 §1.7.1; doc 06 §6.4, §7.4, §8.4; doc 03 §7.4. Pilot: first component through every tier and host; fixes harness defects it exposes |
| M1-T02 | Stack (`stack`) | static/block; S | M1-T01 | A | S | `components/stack.md` (7 kB); doc 09 §0; doc 06 §6.5, §7.5, §8.5. Pilot for responsive props |
| M1-T03 | Icon (`icon`) | static/snippet; S | M1-T01 | A | S | `components/icon.md` (7 kB); doc 09 §0; icon path data in doc 09 (search `icon path data`) |
| M1-T04 | IconButton (`icon-button`) | static/block; S | M1-T01, M1-T03 | B | M | `components/icon-button.md` (19 kB); doc 09 §0 |
| M1-T05 | Link (`link`) | static/block; S | M1-T01 | A | S | `components/link.md` (10 kB); doc 09 §0 |
| M1-T06 | FormMessage (`form-message`) | static/block; S | M1-T01 | A | S | `components/form-message.md` (7 kB); doc 09 §0 |
| M1-T07 | VisuallyHidden (`visually-hidden`) | static/block; S | M1-T01 | A | S | `components/visually-hidden.md` (5 kB); doc 09 §0 |
| M1-T08 | Image (`image`) | static/block; S | M1-T01 | A | S | `components/image.md` (12 kB); doc 09 §0; doc 05 §11.3 |
| M1-T09 | Placeholder (`placeholder`) | static/block; S | M1-T01 | A | S | `components/placeholder.md` (6 kB); doc 09 §0 |
| M1-T10 | Price (`price`) | static/block; C | M1-T01, M1-T07 | B | S | `components/price.md` (8 kB); doc 11 §0; doc 05 §11.2 |
| M1-T11 | `<pkg>/react`: `src/react/` with `useElement`, `RestProps`, JSX types for custom elements and Invoker attributes | runtime | M1-T01 | A | M | doc 06 §6.1 to §6.3 |
| M1-T12 | `<pkg>/remix`: `src/remix/` types and host extras | runtime | M1-T01 | A | S | doc 06 §7.1 to §7.3 |
| M1-T13 | Element `rp-quantity` (`src/elements/rp-quantity.ts` and test) | element | M0-T45 | A | M | doc 04 §7, §8 |
| M1-T14 | SPIKE-04 `rp-root-only-primitive`: run and report | spike | M1-T13 | B | S | ledger §3 row SPIKE-04; doc 04 §13, §15 Fallback (SPIKE-04) |
| M1-T15 | QuantityInput (`quantity-input`) | native/block; N | M1-T03, M1-T11, M1-T12, M1-T13 | C | M | `components/quantity-input.md` (36 kB); doc 10 §0; doc 04 §10.14 |
| M1-T16 | Element `rp-dialog` (`src/elements/rp-dialog.ts` and test) | element | M1-T14 | C | M | doc 04 §7, §9.1, §3.3, §3.4 |
| M1-T17 | Dialog (`dialog`) | native/parts; N | M1-T01, M1-T03, M1-T04, M1-T11, M1-T12, M1-T16 | D | M | `components/dialog.md` (32 kB); doc 10 §0; doc 07 §1.7.2; doc 06 §6.6, §7.6, §8.6 (Dialog parts only) |
| M1-T18 | Drawer (`drawer`) | native/parts; N | M1-T01, M1-T03, M1-T04, M1-T05, M1-T17 | E | M | `components/drawer.md` (27 kB); doc 10 §0; doc 04 §10.2 |
| M1-T19 | SPIKE-05 `invoker-commands-hosts`: run and report | spike | M1-T17 | E | S | ledger §3 row SPIKE-05; doc 04 §15 Fallback (SPIKE-05); doc 06 §14 |
| M1-T20 | Commerce adapter core `src/commerce/adapter.ts`, `src/commerce/index.ts`, `DEFAULT_STRINGS` (test C-32) | runtime | M0-T45 | A | M | doc 05 §1 to §4; spike `docs/research/spikes/commerce/src/commerce/adapter.ts` |
| M1-T21 | Form dialects `src/commerce/dialect.ts` | runtime | M1-T20 | B | S | doc 05 §6 |
| M1-T22 | Refresh strategies `src/commerce/refresh-{html,liquid,remix,react}.ts` | runtime | M1-T20 | B | M | doc 05 §8 |
| M1-T23 | hydrogen backend `src/commerce/adapter-hydrogen.ts` (without `rp-view-event`) | runtime | M1-T21, M1-T22 | C | M | doc 05 §5.1, §10.1 to §10.3, §12.1 |
| M1-T24 | liquid backend `src/commerce/adapter-liquid.ts` (without `rp-view-event` and page view), `test/support/fake-sa.js` | runtime | M1-T21, M1-T22 | C | M | doc 05 §5.2, §10.4 |
| M1-T25 | `useCart` and `useRegionHtml` in `src/react/hooks.ts` | runtime | M1-T11, M1-T22 | C | S | doc 06 §6.2; doc 05 §10.3 |
| M1-T26 | Element `rp-cart` (`src/commerce/rp-cart.ts` and test) | element | M1-T14, M1-T23, M1-T24 | D | M | doc 05 §7.1, §7.7, §9 |
| M1-T27 | Element `rp-product-form` (`src/commerce/rp-product-form.ts` and test) | element | M1-T14, M1-T23, M1-T24 | D | M | doc 05 §7.2, §7.7, §6.4 |
| M1-T28 | Element `rp-live` (`src/commerce/rp-live.ts` and test) | element | M1-T14, M1-T23, M1-T24 | D | S | doc 05 §7.3, §7.7 |
| M1-T29 | Emulated commerce tests, liquid backend: `test/commerce/liquid.test.ts` C-01 to C-08 | harness | M1-T26, M1-T27 | E | M | doc 05 §14; spike `docs/research/spikes/commerce/` |
| M1-T30 | Emulated commerce tests, hydrogen backend: `test/commerce/hydrogen.test.ts` C-09 to C-13, C-25 with the stub `/api/cart` server | harness | M1-T26, M1-T27, M1-T28 | E | M | doc 05 §14; spike `docs/research/spikes/commerce/` |
| M1-T31 | AddToCartButton (`add-to-cart-button`) | static/block; C | M1-T01 | B | S | `components/add-to-cart-button.md` (8 kB); doc 11 §0 |
| M1-T32 | CheckoutButton (`checkout-button`) | static/block; C | M1-T01 | B | S | `components/checkout-button.md` (12 kB); doc 11 §0 |
| M1-T33 | ProductForm (`product-form`) | commerce/resource; C+R | M1-T06, M1-T15, M1-T25, M1-T27, M1-T31 | E | M | `components/product-form.md` (19 kB); doc 11 §0; doc 07 §1.7.3; doc 06 §6.7, §7.7, §8.7 (ProductForm parts) |
| M1-T34 | CartLink (`cart-link`) | commerce/block; C | M1-T03, M1-T07, M1-T25, M1-T26 | E | M | `components/cart-link.md` (11 kB); doc 11 §0 |
| M1-T35 | CartLine (`cart-line`) | static/resource; C+R | M0-T45, M1-T01, M1-T03, M1-T04, M1-T06, M1-T08, M1-T09, M1-T10, M1-T15 | D | M | `components/cart-line.md` (17 kB); doc 11 §0 |
| M1-T36 | CartSummary (`cart-summary`) | commerce/resource; C+R | M1-T03, M1-T04, M1-T25, M1-T26, M1-T32 | E | M | `components/cart-summary.md` (19 kB); doc 11 §0 |
| M1-T37 | CartLines (`cart-lines`) | commerce/resource; C+R | M1-T01, M1-T06, M1-T07, M1-T25, M1-T26, M1-T35 | E | M | `components/cart-lines.md` (19 kB); doc 11 §0; doc 06 §6.7 (CartLines part) |
| M1-T38 | CartDrawer (`cart-drawer`) | commerce/resource; C+R | M1-T03, M1-T04, M1-T18, M1-T36, M1-T37 | F | M | `components/cart-drawer.md` (15 kB); doc 11 §0 |
| M1-T39 | Golden path on the theme server: gate ST-5 (`[T5] cart: theme server add-to-cart updates the count and the lines region`), `[T6] serve-theme: add by form post then remove by link with scripting disabled`, `[T5] serve-theme: emulated Standard Actions and partial rendering`; C-16, C-18, C-23 for the slice | harness | M1-T29, M1-T33, M1-T34, M1-T38 | G | M | doc 13 §4.5, §4.6, §9.3; doc 05 §14; PLAN §8 note P-3 |
| M1-T40 | Agent bridge entry `src/agent/` (replaces the bring-up stub) | runtime | M1-T26, M1-T27 | E | S | doc 04 §12; doc 08 §7.1 to §7.5 |
| M1-T41 | SPIKE-08 `agent-bridge-confirm`: run and report | spike | M1-T36, M1-T40 | F | S | ledger §3 row SPIKE-08; doc 08 §7.7 |
| M1-T42 | SPIKE-06 `cross-engine-features`: `test/cross-engine/features.test.ts`, run in WebKit and Gecko, report `docs/research/spikes/cross-engine-features/README.md`. **BLOCKED-ON-ENV without WebKit and Gecko builds** | spike | M1-T15, M1-T17 | F | M | ledger §3 row SPIKE-06; doc 13 §11.3, §17.3, §21 Fallback (SPIKE-06); doc 03 §12 |
| M1-T43 | SPIKE-07 `navigation-menu-popover`: prototype from the spec code and markup, run, report | spike | M1-T14 | C | M | ledger §3 row SPIKE-07; doc 04 §9.3, §10.15, §15 Fallback (SPIKE-07) |
| M1-T44 | SPIKE-10 part (a) `html-region-refresh`: checks 1 to 5 on the `html` and `remix` hosts, report | spike | M1-T30, M1-T38 | G | M | ledger §3 row SPIKE-10; doc 05 §16 (SPIKE-10 and its fallback) |
| M1-T45 | SPIKE-11 `remix-opt-in-refresh`: test C-26 against the real app, report | spike | M1-T44 | H | M | ledger §3 row SPIKE-11; doc 05 §16, §10.2, §14 (C-26) |
| M1-T46 | M1 gate | gate | M1-T01 to M1-T45 (M1-T42 may be BLOCKED-ON-ENV) | - | S | PLAN §4.2 |

### M2 Foundations breadth

Detail file for every row: `docs/plan/M2-foundations.md`, section `## <task id>`. 32 tasks.

| Id | Title | Kind | Depends on | Grp | Size | Read |
|---|---|---|---|---|---|---|
| M2-T01 | Container (`container`) | static/block; S | M1-T01, M1-T02 | A | S | `components/container.md` (8 kB); doc 09 §0 |
| M2-T02 | Inline (`inline`) | static/block; S | M1-T01, M1-T02 | A | S | `components/inline.md` (6 kB); doc 09 §0 |
| M2-T03 | Grid (`grid`) | static/block; S | M1-T01, M1-T02 | A | S | `components/grid.md` (7 kB); doc 09 §0 |
| M2-T04 | Card (`card`) | static/block; S | M1-T01, M1-T02 | A | S | `components/card.md` (8 kB); doc 09 §0 |
| M2-T05 | Separator (`separator`) | static/block; S | M1-T01, M1-T02 | A | S | `components/separator.md` (5 kB); doc 09 §0 |
| M2-T06 | Heading (`heading`) | static/block; S | M1-T01, M1-T02 | A | S | `components/heading.md` (8 kB); doc 09 §0 |
| M2-T07 | Text (`text`) | static/block; S | M1-T01, M1-T02 | A | S | `components/text.md` (9 kB); doc 09 §0 |
| M2-T08 | RichText (`rich-text`) | static/block; S | M1-T01, M1-T02 | A | S | `components/rich-text.md` (9 kB); doc 09 §0 |
| M2-T09 | Video (`video`) | static/block; S | M1-T01, M1-T02 | A | S | `components/video.md` (9 kB); doc 09 §0 |
| M2-T10 | Label (`label`) | static/block; S | M1-T01, M1-T02 | A | S | `components/label.md` (5 kB); doc 09 §0 |
| M2-T11 | Input (`input`) | static/block; S | M1-T01, M1-T02 | A | S | `components/input.md` (12 kB); doc 09 §0 |
| M2-T12 | Textarea (`textarea`) | static/block; S | M1-T01, M1-T02 | A | S | `components/textarea.md` (10 kB); doc 09 §0 |
| M2-T13 | Select (`select`) | static/block; S | M1-T01, M1-T02 | A | M | `components/select.md` (12 kB); doc 09 §0 |
| M2-T14 | Checkbox (`checkbox`) | static/block; S | M1-T01, M1-T02 | A | S | `components/checkbox.md` (9 kB); doc 09 §0 |
| M2-T15 | RadioGroup (`radio-group`) | static/parts; S | M1-T01, M1-T02 | A | M | `components/radio-group.md` (12 kB); doc 09 §0 |
| M2-T16 | Switch (`switch`) | static/block; S | M1-T01, M1-T02 | A | S | `components/switch.md` (9 kB); doc 09 §0 |
| M2-T17 | Field (`field`) | static/parts; S | M1-T01, M1-T02, M1-T06, M2-T10 | B | M | `components/field.md` (14 kB); doc 09 §0 |
| M2-T18 | Badge (`badge`) | static/block; S | M1-T01, M1-T02 | A | S | `components/badge.md` (10 kB); doc 09 §0 |
| M2-T19 | Banner (`banner`) | static/block; S | M1-T01, M1-T02, M1-T03 | A | S | `components/banner.md` (11 kB); doc 09 §0 |
| M2-T20 | Spinner (`spinner`) | static/block; S | M1-T01, M1-T02 | A | S | `components/spinner.md` (7 kB); doc 09 §0 |
| M2-T21 | Skeleton (`skeleton`) | static/block; S | M1-T01, M1-T02 | A | S | `components/skeleton.md` (8 kB); doc 09 §0 |
| M2-T22 | Progress (`progress`) | static/block; S | M1-T01, M1-T02 | A | S | `components/progress.md` (10 kB); doc 09 §0 |
| M2-T23 | EmptyState (`empty-state`) | static/block; S | M1-T01, M1-T02, M1-T03 | A | S | `components/empty-state.md` (7 kB); doc 09 §0 |
| M2-T24 | Rating (`rating`) | static/block; S | M1-T01, M1-T02 | A | S | `components/rating.md` (11 kB); doc 09 §0 |
| M2-T25 | SkipLink (`skip-link`) | static/block; S | M1-T01, M1-T02 | A | S | `components/skip-link.md` (8 kB); doc 09 §0 |
| M2-T26 | Announcer (`announcer`) | static/block; S | M1-T01, M1-T02 | A | S | `components/announcer.md` (8 kB); doc 09 §0; doc 04 §3.5 |
| M2-T27 | Breadcrumb (`breadcrumb`) | static/parts; S | M1-T01, M1-T02, M1-T03 | A | M | `components/breadcrumb.md` (11 kB); doc 09 §0 |
| M2-T28 | Pagination (`pagination`) | static/resource; S+R | M1-T01, M1-T02 | A | M | `components/pagination.md` (14 kB); doc 09 §0; doc 05 §11.1 (pagination type) |
| M2-T29 | Checker family "usage": RP101 to RP105 (`src/check/rules/<RULE>.ts` and tests) | checker | M0-T43, M1-T01 | A | M | doc 07 §9.3, §9.6 (rows RP101 to RP105), §9.7; doc 08 §5.5 (same rows) |
| M2-T30 | Checker family "structure": RP110 to RP112, RP114 to RP118 | checker | M0-T43, M1-T17 | A | M | doc 07 §9.6 (rows RP110 to RP118); doc 08 §5.5 (same rows) |
| M2-T31 | Checker family "accessibility": RP201 to RP204 | checker | M0-T43, M1-T17 | A | M | doc 07 §9.6 (rows RP201 to RP204); doc 08 §5.5 (same rows) |
| M2-T32 | M2 gate | gate | M2-T01 to M2-T31 | - | S | PLAN §4.2 |

### M3 Interactive components

Detail file for every row: `docs/plan/M3-interactive.md`, section `## <task id>`. 11 tasks.

| Id | Title | Kind | Depends on | Grp | Size | Read |
|---|---|---|---|---|---|---|
| M3-T01 | Popover (`popover`) | static/parts; S | M1-T01, M1-T04, M1-T19 | A | M | `components/popover.md` (25 kB); doc 10 §0; doc 04 §10.3 |
| M3-T02 | Accordion (`accordion`) | static/parts; S | M1-T11 | A | M | `components/accordion.md` (22 kB); doc 10 §0; doc 04 §10.8 |
| M3-T03 | Generator `pnpm gen --snapshot <id>` (upgrade-snapshot fixtures) | gen | M1-T01 | A | M | doc 07 §3.1; doc 02 §11.4; doc 13 §8.3 |
| M3-T04 | Tabs (`tabs`) | ui/parts; U | M1-T11, M1-T12, M3-T03 | B | M | `components/tabs.md` (35 kB); doc 10 §0; doc 06 §6.6, §7.6, §8.6 (Tabs parts); doc 04 §10.7 |
| M3-T05 | Tooltip (`tooltip`) | ui/parts; U | M1-T01, M1-T03, M1-T04, M1-T11, M1-T12, M3-T03 | B | M | `components/tooltip.md` (27 kB); doc 10 §0; doc 04 §10.4 |
| M3-T06 | `toast()` function and lazy Toast chunk load on first call | runtime | M1-T01 | A | S | doc 04 §10.6, §3.2; ledger D-083 |
| M3-T07 | Toast (`toast`) | ui/block; U | M1-T11, M1-T12, M3-T03, M3-T06 | B | M | `components/toast.md` (27 kB); doc 10 §0 |
| M3-T08 | Element `rp-carousel` (`src/elements/rp-carousel.ts` and test) | element | M1-T14 | A | M | doc 04 §7, §9.2 |
| M3-T09 | Carousel (`carousel`) | native/parts; N | M1-T03, M1-T11, M1-T12, M3-T08 | B | M | `components/carousel.md` (34 kB); doc 10 §0; doc 04 §10.9 |
| M3-T10 | Element acceptance completion: every row of doc 04 §13 not yet covered (loader, chunks, polyfill, opener) has a test | harness | M3-T04, M3-T05, M3-T07, M3-T09 | C | S | doc 04 §13 |
| M3-T11 | M3 gate | gate | M3-T01 to M3-T10 | - | S | PLAN §4.2 |

### M4 Commerce components

Detail file for every row: `docs/plan/M4-commerce.md`, section `## <task id>`. 24 tasks.

| Id | Title | Kind | Depends on | Grp | Size | Read |
|---|---|---|---|---|---|---|
| M4-T01 | Swatch (`swatch`) | static/block; S | M1-T46 | A | S | `components/swatch.md` (7 kB); doc 11 §0 |
| M4-T02 | SearchForm (`search-form`) | static/block; S | M1-T03, M1-T04, M1-T46, M2-T11 | A | S | `components/search-form.md` (9 kB); doc 11 §0 |
| M4-T03 | ProductCard (`product-card`) | static/resource; C+R | M1-T08, M1-T09, M1-T10, M1-T46, M2-T18 | A | M | `components/product-card.md` (13 kB); doc 11 §0 |
| M4-T04 | CollectionCard (`collection-card`) | static/resource; C+R | M1-T08, M1-T09, M1-T46 | A | S | `components/collection-card.md` (7 kB); doc 11 §0 |
| M4-T05 | ArticleCard (`article-card`) | static/resource; C+R | M1-T08, M1-T09, M1-T46 | A | S | `components/article-card.md` (8 kB); doc 11 §0 |
| M4-T06 | PriceRange (`price-range`) | static/resource; C+R | M1-T46, M2-T11 | A | S | `components/price-range.md` (9 kB); doc 11 §0 |
| M4-T07 | FilterGroup (`filter-group`) | static/resource; C+R | M1-T07, M1-T46, M2-T14, M4-T01, M4-T06 | B | M | `components/filter-group.md` (12 kB); doc 11 §0 |
| M4-T08 | LiveForm (`live-form`) | commerce/block; C | M1-T46 | A | S | `components/live-form.md` (9 kB); doc 11 §0 |
| M4-T09 | Filters (`filters`) | commerce/resource; C+R | M1-T01, M1-T46, M4-T06, M4-T07 | C | M | `components/filters.md` (18 kB); doc 11 §0 |
| M4-T10 | FilterChips (`filter-chips`) | commerce/resource; C+R | M1-T03, M1-T07, M1-T46 | A | M | `components/filter-chips.md` (12 kB); doc 11 §0 |
| M4-T11 | SortSelect (`sort-select`) | commerce/resource; C+R | M1-T01, M1-T46, M2-T10, M2-T13 | A | M | `components/sort-select.md` (12 kB); doc 11 §0 |
| M4-T12 | VariantPicker (`variant-picker`) | commerce/resource; C+R | M1-T01, M1-T07, M1-T46, M2-T10, M2-T13, M4-T01 | B | M | `components/variant-picker.md` (22 kB); doc 11 §0 |
| M4-T13 | ProductGallery (`product-gallery`) | native/resource; C+R | M1-T03, M1-T04, M1-T07, M1-T08, M1-T09, M1-T17, M1-T46, M3-T09 | A | M | `components/product-gallery.md` (19 kB); doc 11 §0 |
| M4-T14 | CartNote (`cart-note`) | commerce/resource; C+R | M1-T01, M1-T06, M1-T46, M2-T10, M2-T12 | A | M | `components/cart-note.md` (11 kB); doc 11 §0 |
| M4-T15 | DiscountCode (`discount-code`) | commerce/resource; C+R | M1-T01, M1-T06, M1-T46, M2-T10, M2-T11 | A | M | `components/discount-code.md` (13 kB); doc 11 §0 |
| M4-T16 | Element `rp-predictive-search` (`src/commerce/rp-predictive-search.ts` and test, C-14) | element | M1-T46 | A | M | doc 05 §7.4, §7.7, §14 (C-14) |
| M4-T17 | PredictiveSearch (`predictive-search`) | commerce/resource; C+R | M4-T02, M4-T03, M4-T16 | B | M | `components/predictive-search.md` (21 kB); doc 11 §0 |
| M4-T18 | Element `rp-recommendations` (`src/commerce/rp-recommendations.ts` and test, C-15) | element | M1-T46 | A | S | doc 05 §7.5, §7.7, §14 (C-15) |
| M4-T19 | ProductRecommendations (`product-recommendations`) | commerce/resource; C+R | M4-T03, M4-T18 | B | M | `components/product-recommendations.md` (18 kB); doc 11 §0 |
| M4-T20 | Commerce tests C-24 (field names looked up) and C-27 (`react` strategy region store) | harness | M4-T16, M4-T18 | B | M | doc 05 §11.1, §14 |
| M4-T21 | `rp-view-event` in both adapters and the Liquid page view (`startStandardEvents`); test C-29 | runtime | M1-T46 | A | M | doc 05 §12; ledger D-089 |
| M4-T22 | SPIKE-10 part (b): React `useRegionHtml` checks 6 to 9 (C-28); complete the report | spike | M1-T44, M4-T17, M4-T19 | C | M | ledger §3 row SPIKE-10; doc 05 §16 |
| M4-T23 | Checker family "progressive enhancement, commerce, agent": RP301 to RP309, RP320, RP321 | checker | M0-T43, M1-T46 | A | M | doc 07 §9.6 (rows RP301 to RP321); doc 05 §13; doc 08 §5.5 (same rows) |
| M4-T24 | M4 gate | gate | M4-T01 to M4-T23 | - | S | PLAN §4.2 |

### M5 Chrome components

Detail file for every row: `docs/plan/M5-chrome.md`, section `## <task id>`. 15 tasks.

| Id | Title | Kind | Depends on | Grp | Size | Read |
|---|---|---|---|---|---|---|
| M5-T01 | Logo (`logo`) | static/block; S or C | M1-T07, M2-T32 | A | S | `components/logo.md` (7 kB); doc 12 §0, §1 |
| M5-T02 | AccountLink (`account-link`) | static/block; S or C | M1-T03, M2-T32 | A | S | `components/account-link.md` (7 kB); doc 12 §0, §1 |
| M5-T03 | LinkList (`link-list`) | static/resource; S or C+R | M2-T32 | A | S | `components/link-list.md` (9 kB); doc 12 §0, §1 |
| M5-T04 | AnnouncementBar (`announcement-bar`) | static/block; S or C | M2-T32 | A | S | `components/announcement-bar.md` (6 kB); doc 12 §0, §1 |
| M5-T05 | Hero (`hero`) | static/block; S or C | M2-T32 | A | S | `components/hero.md` (10 kB); doc 12 §0, §1 |
| M5-T06 | Footer (`footer`) | static/resource; S or C+R | M2-T32, M5-T03 | B | M | `components/footer.md` (11 kB); doc 12 §0, §1 |
| M5-T07 | NewsletterForm (`newsletter-form`) | static/resource; S or C+R | M1-T01, M1-T06, M2-T11, M2-T32 | A | M | `components/newsletter-form.md` (12 kB); doc 12 §0, §1 |
| M5-T08 | LocaleSelector (`locale-selector`) | static/resource; S or C+R | M1-T01, M1-T03, M2-T32, M3-T01 | A | M | `components/locale-selector.md` (18 kB); doc 12 §0, §1 |
| M5-T09 | FeaturedCollection (`featured-collection`) | static/resource; S or C+R | M1-T05, M2-T03, M2-T32, M3-T09, M4-T03 | A | M | `components/featured-collection.md` (15 kB); doc 12 §0, §1 |
| M5-T10 | Element `rp-navigation-menu` (`src/elements/rp-navigation-menu.ts` and test) | element | M1-T43 | A | M | doc 04 §7, §9.3; SPIKE-07 report |
| M5-T11 | NavigationMenu (`navigation-menu`) | native/resource; N+R | M1-T03, M2-T32, M5-T10 | B | M | `components/navigation-menu.md` (24 kB); doc 12 §0, §1; doc 04 §10.15 |
| M5-T12 | MobileNav (`mobile-nav`) | native/resource; N+R | M1-T03, M1-T04, M1-T18, M2-T32 | A | M | `components/mobile-nav.md` (22 kB); doc 12 §0, §1 |
| M5-T13 | Header (`header`) | static/resource; S or C+R | M1-T03, M1-T04, M1-T34, M2-T32, M5-T01, M5-T02, M5-T11 | C | M | `components/header.md` (21 kB); doc 12 §0, §1 |
| M5-T14 | Strict generator check: all 84 components present; delete `BRINGUP_SUBSET` and the entry-point filters (PLAN 4.4) | infra | M2-T32, M3-T11, M4-T24, M5-T01 to M5-T13 | - | S | doc 07 §1.6 (MB-20); doc 01 §7; PLAN §4.4 |
| M5-T15 | M5 gate | gate | M5-T14 | - | S | PLAN §4.2 |

### M6 Registry, CLI, checker

Detail file for every row: `docs/plan/M6-cli-registry-checker.md`, section `## <task id>`. 35 tasks.

| Id | Title | Kind | Depends on | Grp | Size | Read |
|---|---|---|---|---|---|---|
| M6-T01 | Generator `src/gen/registry.ts` (step G9 and build step 8): `registry/index.json`, file keys and targets, `manifest.json`, schemas, `custom-elements.json`, `html-custom-data.json` | gen | M1-T46 | A | M | doc 07 §3.4, §4.1 to §4.3 |
| M6-T02 | Install transform (specifier, alias and prefix rewriting) | cli | M6-T01 | B | S | doc 07 §4.6 |
| M6-T03 | Core registry files and derived files (`core/tokens`, `core/base`, `core/props`, `core/theme`, `core/entry`, `core/js*`) | gen | M6-T01 | B | M | doc 07 §4.4, §7.6.1; doc 03 §5.2, §5.3 |
| M6-T04 | Liquid composite stylesheet `assets/ripple.css` (marker regions) and the prebuilt `ripple.css` outputs | gen | M6-T01 | B | M | doc 07 §4.5, §10 |
| M6-T05 | Liquid infrastructure snippets `rp-head`, `rp-tokens`, `rp-import-map-entries`; `registry/liquid/settings.json`; locale sources | gen | M6-T01 | B | M | doc 14 §5 to §7, §11 |
| M6-T06 | Provenance trailers `src/cli/trailer.ts` and finding installed files | cli | M1-T46 | A | M | doc 07 §5.1, §5.2 |
| M6-T07 | Project configuration `src/cli/config.ts`, `src/gen/schema/config.schema.json` | cli | M1-T46 | A | S | doc 07 §6 |
| M6-T08 | Host detection `src/cli/detect-host.ts` | cli | M1-T46 | A | M | doc 07 §7.3 |
| M6-T09 | CLI entry `bin/`, `src/cli/index.ts`: general rules, argument parsing, command table, exit codes 0/1/2, no prompts | cli | M1-T46 | A | S | doc 07 §7.1, §7.2 |
| M6-T10 | Install plan `src/cli/plan.ts` and `src/cli/composite.ts` | cli | M6-T02, M6-T04, M6-T06, M6-T07 | C | M | doc 07 §7.5, §4.5, §5.1 |
| M6-T11 | Patches for npm hosts: `core/patch:css-entry`, `core/patch:agents`, `core/patch:package-json` | cli | M6-T10 | D | S | doc 07 §7.6.2, §7.6.5, §7.6.6 |
| M6-T12 | Patches for Liquid: `core/patch:head`, `core/patch:import-map`, `core/patch:theme-reference`, `core/patch:settings`, `core/patch:locale` | cli | M6-T05, M6-T10 | D | M | doc 07 §7.6.3, §7.6.4; doc 14 §6 |
| M6-T13 | Generator `src/gen/agents-md.ts` (the `AGENTS.md` section) | gen | M6-T01 | B | S | doc 08 §3 |
| M6-T14 | Generator `src/gen/docs.ts`: `docs/components/<id>.md`, `docs/INDEX.md`, `docs/llms.txt`, `docs/rules/<RULE>.md` in `pkg/` | gen | M6-T01 | B | M | doc 08 §2.1 to §2.4, §2.6, §2.8 |
| M6-T15 | Command `ripple init` | cli | M6-T03, M6-T08, M6-T09, M6-T11, M6-T12, M6-T13 | E | M | doc 07 §7.4 |
| M6-T16 | Command `ripple add` (`--all`, `--blueprint`, `--dry-run`, `--diff`, `--prefix`) | cli | M6-T15 | F | M | doc 07 §7.5 |
| M6-T17 | Command `ripple diff` (`src/cli/diff.ts`) | cli | M6-T16 | G | M | doc 07 §7.7 |
| M6-T18 | Three-way merge `src/cli/merge3.ts` | cli | M1-T46 | A | M | doc 07 §8.2; spike `docs/research/spikes/agent-kit/` |
| M6-T19 | Base retrieval `src/cli/base.ts` | cli | M6-T06 | B | S | doc 07 §8.3 |
| M6-T20 | Command `ripple upgrade` (`--dry-run`, `--ours`, `--theirs`, `--write-conflicts`, `--force`) | cli | M6-T16, M6-T18, M6-T19 | G | M | doc 07 §7.8, §8.1, §8.4 |
| M6-T21 | Command `ripple remove` | cli | M6-T16 | G | S | doc 07 §7.9 |
| M6-T22 | Command `ripple status` (`--json`, the computed lock) | cli | M6-T16 | G | S | doc 07 §7.10, §5.3 |
| M6-T23 | Command `ripple check` (`--json`, `--url`, `--browser`, `--rule`, `--max-warnings`) | cli | M6-T09 | B | S | doc 07 §9.2, §9.4 |
| M6-T24 | Command `ripple docs` | cli | M6-T09, M6-T14 | C | S | doc 07 §7.11; doc 08 §2.7 |
| M6-T25 | Command `ripple manifest` | cli | M6-T01, M6-T09 | B | S | doc 07 §7.12 |
| M6-T26 | Command `ripple skills sync` | cli | M6-T09 | B | S | doc 07 §7.13; doc 08 §4.1 |
| M6-T27 | Command `ripple skills check` | cli | M6-T26 | C | S | doc 07 §7.13 |
| M6-T28 | Checker Liquid call tokeniser `src/check/liquid-calls.ts` | checker | M1-T46 | A | M | doc 07 §9.5.2 |
| M6-T29 | Checker family "Liquid": RP401 to RP406 | checker | M6-T28 | B | M | doc 07 §9.6 (rows RP401 to RP406); doc 08 §5.5 (same rows) |
| M6-T30 | Checker Theme Check sub-step (`TC:<CheckName>`) | checker | M6-T29 | C | S | doc 07 §9.5.4 |
| M6-T31 | Checker family "project state" (layer P): RP501 to RP508, RP510 to RP512 | checker | M6-T06, M6-T22 | H | M | doc 07 §9.6 (rows RP501 to RP512), §5.3; doc 08 §5.5 (same rows) |
| M6-T32 | Checker layer B procedure and `src/check/flows.ts` | checker | M1-T46 | A | M | doc 07 §9.5.5 |
| M6-T33 | Checker family "browser" (layer B): RP601 to RP609 | checker | M6-T32 | B | M | doc 07 §9.6 (rows RP601 to RP609); doc 08 §5.5 (same rows) |
| M6-T34 | Registry and CLI acceptance: RB-8, RB-9 and the remaining rows of doc 07 §12 | harness | M6-T15 to M6-T27 | I | M | doc 07 §10.2, §12 |
| M6-T35 | M6 gate | gate | M4-T23, M6-T01 to M6-T34, M2-T29 to M2-T31 | - | S | PLAN §4.2 |

### M7 Blueprints and the four example storefronts

Detail file for every row: `docs/plan/M7-blueprints-examples.md`, section `## <task id>`. 29 tasks.

| Id | Title | Kind | Depends on | Grp | Size | Read |
|---|---|---|---|---|---|---|
| M7-T01 | Blueprint sample data `blueprints/_sample/<id>.json` and `layout.json` skeletons; `loadBlueprintSample` | blueprint | M5-T15 | A | M | doc 12 §2.5; doc 13 §4.1 |
| M7-T02 | Generator step G10 `generateBlueprintHtml` in `src/gen/index.ts` | gen | M5-T15 | A | M | doc 07 §3.2 row G10; doc 12 §2.3 (rules H-1, H-2) |
| M7-T03 | Blueprint test support: shared tests BT-1 to BT-7, BT-9 as a helper used by every `blueprints/<id>/<id>.test.ts` | harness | M6-T35, M7-T01 | B | M | doc 12 §2.2, §2.8 |
| M7-T04 | Install components with the CLI: `ripple init` and `ripple add --all` in `examples/{html,react,remix}`; for `examples/liquid` the first steps of doc 14 §4.1 (the hand-made files, `ripple init --host liquid`, `ripple add --all`) | example | M5-T15, M6-T35 | A | M | doc 13 §12.1; doc 14 §4, §4.1; doc 07 §7.4, §7.5 |
| M7-T05 | Blueprint `layout`, TSX hosts: `layout.tsx` (react, remix), `types.ts`, `lib/document.ts`, `lib/menu.ts`, `lib/locale-route.ts`, `lib/newsletter-route.ts` | blueprint | M7-T03, M7-T04 | - | M | `blueprints/layout.md` (22 kB); doc 12 §2.3 to §2.6 |
| M7-T06 | Blueprint `layout`, Liquid and html: `layout/theme.liquid`, `snippets/import-map.liquid`, `snippets/meta-tags.liquid`, generated `layout.html` | blueprint | M7-T02, M7-T05 | - | M | `blueprints/layout.md`; doc 14 §7.2, §7.6, §10; ledger D-109 |
| M7-T07 | Blueprint `home` | blueprint | M7-T06 | C | S | `blueprints/home.md` (7 kB); doc 12 §2.1 to §2.4, §2.8 |
| M7-T08 | Blueprint `collection` | blueprint | M7-T06 | C | M | `blueprints/collection.md` (17 kB); doc 12 §2.1 to §2.4, §2.8 |
| M7-T09 | Blueprint `collections-list` | blueprint | M7-T06 | C | S | `blueprints/collections-list.md` (5 kB); doc 12 §2.1 to §2.4, §2.8 |
| M7-T10 | Blueprint `product` | blueprint | M7-T06 | C | M | `blueprints/product.md` (13 kB); doc 12 §2.1 to §2.4, §2.8 |
| M7-T11 | Blueprint `search` | blueprint | M7-T06 | C | M | `blueprints/search.md` (10 kB); doc 12 §2.1 to §2.4, §2.8 |
| M7-T12 | Blueprint `cart` | blueprint | M7-T06 | C | M | `blueprints/cart.md` (9 kB); doc 12 §2.1 to §2.4, §2.8 |
| M7-T13 | Blueprint `blog` | blueprint | M7-T06 | C | S | `blueprints/blog.md` (5 kB); doc 12 §2.1 to §2.4, §2.8 |
| M7-T14 | Blueprint `article` | blueprint | M7-T06 | C | S | `blueprints/article.md` (6 kB); doc 12 §2.1 to §2.4, §2.8 |
| M7-T15 | Blueprint `page` | blueprint | M7-T06 | C | S | `blueprints/page.md` (2 kB); doc 12 §2.1 to §2.4, §2.8 |
| M7-T16 | Blueprint `contact` | blueprint | M7-T06 | C | M | `blueprints/contact.md` (11 kB); doc 12 §2.1 to §2.4, §2.8 |
| M7-T17 | Blueprint `not-found` | blueprint | M7-T06 | C | S | `blueprints/not-found.md` (3 kB); doc 12 §2.1 to §2.4, §2.8 |
| M7-T18 | Blueprint `password` | blueprint | M7-T06 | C | M | `blueprints/password.md` (8 kB); doc 12 §2.1 to §2.4, §2.8 |
| M7-T19 | Blueprint `gift-card` | blueprint | M7-T06 | C | S | `blueprints/gift-card.md` (7 kB); doc 12 §2.1 to §2.4, §2.8 |
| M7-T20 | Example `examples/react`: server, routes, data loading from mock.shop, `/api/cart`, `ripple add --blueprint` for the 14 blueprints | example | M7-T07 to M7-T19 | D | M | doc 13 §12.1; doc 12 §2.5 to §2.7; doc 05 §10.1, §10.3 |
| M7-T21 | Example `examples/remix`: the same, plus the morph test routes | example | M7-T07 to M7-T19 | D | M | doc 13 §12.1, §9.2; doc 12 §2.5 to §2.7; doc 05 §10.1, §10.2 |
| M7-T22 | Example `examples/html`: the same on the `html` host | example | M7-T07 to M7-T19 | D | M | doc 13 §12.1; doc 12 §2.3, §2.5 to §2.7; doc 04 §5.1; doc 05 §10.1 |
| M7-T23 | Example `examples/liquid`: finish the Ripple theme by the remaining steps of doc 14 §4.1 (`ripple add --blueprint` for the 14 blueprints in order, `pnpm theme:css`, `ripple check`); theme `AGENTS.md` and `DESIGN.md` | example | M7-T07 to M7-T19 | D | M | doc 14 §2, §4, §6, §11 |
| M7-T24 | Ripple theme acceptance A-1 to A-19, A-24, A-25 | harness | M7-T23 | E | M | doc 14 §14, §12 |
| M7-T25 | No-JS flows `test/nojs/blueprints.test.ts`: NJ-F1 to NJ-F16 on the four examples | harness | M7-T20, M7-T21, M7-T22, M7-T23 | E | M | doc 13 §11.2 |
| M7-T26 | Tier 7 `test/commerce/e2e.test.ts`: E2E-1 to E2E-11 against mock.shop. **BLOCKED-ON-ENV without network access to mock.shop** | harness | M7-T20, M7-T21, M7-T22 | E | M | doc 13 §12.2 |
| M7-T27 | Page-view tests: `[T5] serve-theme: one page view per document load` and C-30; re-point the theme-server tests of M1-T39 at `examples/liquid` | harness | M4-T21, M7-T23 | E | S | doc 13 §4.6; doc 05 §14 (C-29, C-30); PLAN §8 note P-3 |
| M7-T28 | Set every `commerce` component to `status: "stable"` after tier 7 passes (checklist line 16) | infra | M7-T26 | F | S | doc 13 §18.1 |
| M7-T29 | M7 gate | gate | M7-T01 to M7-T28 | - | S | PLAN §4.2 |

### M8 Agent kit and evals

Detail file for every row: `docs/plan/M8-agent-kit-evals.md`, section `## <task id>`. 43 tasks.

| Id | Title | Kind | Depends on | Grp | Size | Read |
|---|---|---|---|---|---|---|
| M8-T01 | Checker rule text audit: every rule file exports `meta` and `text`; every rule page builds; acceptance of doc 08 §5.6 | docs | M6-T35 | A | S | doc 08 §5 |
| M8-T02 | Development-mode warnings: the catalogue and its invariants | runtime | M5-T15 | A | S | doc 08 §6 |
| M8-T03 | Agent surface tests: snapshot per commerce element (C-31), confirmation, labels, acceptance of doc 08 §7.8 | harness | M1-T41, M4-T24 | A | M | doc 08 §7; doc 05 §14 (C-31) |
| M8-T04 | Guides `getting-started`, `layout-props`, `tokens-and-dials`, `progressive-enhancement` | guide | M7-T29 | B | M | doc 08 §2.5 |
| M8-T05 | Guides `commerce`, `overlays-and-ids`, `customize-and-upgrade`, `agent-ready` | guide | M7-T29 | B | M | doc 08 §2.5 |
| M8-T06 | Guides `hosts-liquid`, `hosts-react`, `hosts-remix`, `hosts-html` | guide | M7-T29 | B | M | doc 08 §2.5 |
| M8-T07 | Skill `ripple` (`skills/ripple/SKILL.md`, `ripple.json`) | skill | M7-T29 | C | S | doc 08 §4.1, §4.3, §4.4, §4.5 (outline of `ripple`) |
| M8-T08 | Skill `ripple-setup` (`skills/ripple-setup/SKILL.md`, `ripple.json`) | skill | M7-T29 | C | S | doc 08 §4.1, §4.3, §4.4, §4.5 (outline of `ripple-setup`) |
| M8-T09 | Skill `ripple-compose-page` (`skills/ripple-compose-page/SKILL.md`, `ripple.json`) | skill | M7-T29 | C | S | doc 08 §4.1, §4.3, §4.4, §4.5 (outline of `ripple-compose-page`) |
| M8-T10 | Skill `ripple-commerce` (`skills/ripple-commerce/SKILL.md`, `ripple.json`) | skill | M7-T29 | C | S | doc 08 §4.1, §4.3, §4.4, §4.5 (outline of `ripple-commerce`) |
| M8-T11 | Skill `ripple-discovery` (`skills/ripple-discovery/SKILL.md`, `ripple.json`) | skill | M7-T29 | C | S | doc 08 §4.1, §4.3, §4.4, §4.5 (outline of `ripple-discovery`) |
| M8-T12 | Skill `ripple-theming` (`skills/ripple-theming/SKILL.md`, `ripple.json`) | skill | M7-T29 | C | S | doc 08 §4.1, §4.3, §4.4, §4.5 (outline of `ripple-theming`) |
| M8-T13 | Skill `ripple-customize-component` (`skills/ripple-customize-component/SKILL.md`, `ripple.json`) | skill | M7-T29 | C | S | doc 08 §4.1, §4.3, §4.4, §4.5 (outline of `ripple-customize-component`) |
| M8-T14 | Skill `ripple-new-component` (`skills/ripple-new-component/SKILL.md`, `ripple.json`) | skill | M7-T29 | C | S | doc 08 §4.1, §4.3, §4.4, §4.5 (outline of `ripple-new-component`) |
| M8-T15 | Skill `ripple-check-and-fix` (`skills/ripple-check-and-fix/SKILL.md`, `ripple.json`) | skill | M7-T29 | C | S | doc 08 §4.1, §4.3, §4.4, §4.5 (outline of `ripple-check-and-fix`) |
| M8-T16 | Skill `ripple-upgrade` (`skills/ripple-upgrade/SKILL.md`, `ripple.json`) | skill | M7-T29 | C | S | doc 08 §4.1, §4.3, §4.4, §4.5 (outline of `ripple-upgrade`) |
| M8-T17 | Skill `ripple-liquid` (`skills/ripple-liquid/SKILL.md`, `ripple.json`) | skill | M7-T29 | C | S | doc 08 §4.1, §4.3, §4.4, §4.5 (outline of `ripple-liquid`) |
| M8-T18 | Skill `ripple-react` (`skills/ripple-react/SKILL.md`, `ripple.json`) | skill | M7-T29 | C | S | doc 08 §4.1, §4.3, §4.4, §4.5 (outline of `ripple-react`) |
| M8-T19 | Skill `ripple-remix` (`skills/ripple-remix/SKILL.md`, `ripple.json`) | skill | M7-T29 | C | S | doc 08 §4.1, §4.3, §4.4, §4.5 (outline of `ripple-remix`) |
| M8-T20 | Skill `ripple-agent-ready` (`skills/ripple-agent-ready/SKILL.md`, `ripple.json`) | skill | M7-T29 | C | S | doc 08 §4.1, §4.3, §4.4, §4.5 (outline of `ripple-agent-ready`) |
| M8-T21 | Skills acceptance (doc 08 §4.6) and `AGENTS.md` section acceptance (§3.3, §3.4) | harness | M6-T13, M8-T07 to M8-T20 | D | S | doc 08 §3.3, §3.4, §4.6 |
| M8-T22 | Eval harness: `evals/adapters/{package.json,run.ts,workspace.ts,Dockerfile,entrypoint.sh}`, `task.json` schema, start states, `templates/<host>/` | eval | M0-T45 | A | M | doc 08 §8.1 to §8.5 |
| M8-T23 | Eval harness: `serve.ts`, `mockshop.ts`, `checks.ts` | eval | M8-T22 | B | M | doc 08 §8.3, §8.4 |
| M8-T24 | Eval scoring: `score.ts`, `outside.ts`, `friction.ts`, `report.ts` (weights 35/15/20/10/10/10, pass at 80) | eval | M8-T22 | B | M | doc 08 §8.8, §8.10 |
| M8-T25 | Eval adapter `pi` | eval | M8-T22 | B | S | doc 08 §8.7 |
| M8-T26 | Eval adapter `claude-code` | eval | M8-T22 | B | S | doc 08 §8.7 |
| M8-T27 | Eval adapter `opencode` | eval | M8-T22 | B | S | doc 08 §8.7 |
| M8-T28 | Eval judge and visual rubric: `judge.ts`, `rubric/visual.md`, `rubric/golden/` | eval | M8-T24 | C | M | doc 08 §8.9 |
| M8-T29 | Eval budgets and bar: `freeze-budgets.ts`, `rubric/bar.json`, the `--bar` run | eval | M8-T24 | C | S | doc 08 §8.11, §8.12 |
| M8-T30 | Eval canary skill `evals/adapters/canary/SKILL.md` and `rubric/api-decisions.md` (gates G-1 to G-7) | eval | M8-T24 | C | S | doc 08 §8.13 |
| M8-T31 | Eval task group T01 (home), T02 (product page): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/` | eval | M7-T29, M8-T23 | D | M | doc 08 §8.2, §8.5, §8.6 (rows of these tasks) |
| M8-T32 | Eval task group T08 (fix), T09 (upgrade): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/` | eval | M7-T29, M8-T23 | D | M | doc 08 §8.2, §8.5, §8.6 (rows of these tasks) |
| M8-T33 | Eval task group T03 (cart), T04 (collection): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/` | eval | M7-T29, M8-T23 | D | M | doc 08 §8.2, §8.5, §8.6 (rows of these tasks) |
| M8-T34 | Eval task group T05 (search), T16 (chrome): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/` | eval | M7-T29, M8-T23 | D | M | doc 08 §8.2, §8.5, §8.6 (rows of these tasks) |
| M8-T35 | Eval task group T06 (restyle), T07 (new section), T15 (escape hatch): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/` | eval | M7-T29, M8-T23 | D | M | doc 08 §8.2, §8.5, §8.6 (rows of these tasks) |
| M8-T36 | Eval task group T10 (dialog and accordion), T17 (agent ready): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/` | eval | M7-T29, M8-T23 | D | M | doc 08 §8.2, §8.5, §8.6 (rows of these tasks) |
| M8-T37 | Eval task group T11 (Liquid dialect), T12 (Liquid cart): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/` | eval | M7-T29, M8-T23 | D | M | doc 08 §8.2, §8.5, §8.6 (rows of these tasks) |
| M8-T38 | Eval task group T13 (plain HTML), T14 (markets): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/` | eval | M7-T29, M8-T23 | D | M | doc 08 §8.2, §8.5, §8.6 (rows of these tasks) |
| M8-T39 | Eval gate E1: baseline run of T01, T02, T08 on `react` and `liquid` (local tier); results in `docs/research/spikes/evals-baseline/README.md`. **BLOCKED-ON-BEN (model access)** | gate | M8-T24, M8-T25, M8-T26, M8-T31, M8-T32 | - | S | doc 08 §8.14 |
| M8-T40 | Eval gate E2: every reference solution passes with at least 95 (K-62) | gate | M8-T24, M8-T31 to M8-T38 | - | S | doc 08 §8.15 |
| M8-T41 | Nightly CI job `evals`. **BLOCKED-ON-BEN (model access)** | infra | M8-T39 | - | S | doc 08 §8.14; doc 13 §17.4 (CI-8) |
| M8-T42 | Eval gate E3: judge calibrated, budgets frozen, Sidekick bar B-1 to B-7. **BLOCKED-ON-BEN (model ids, ledger Q17)** | gate | M8-T28, M8-T29, M8-T40 | - | M | doc 08 §8.9, §8.11, §8.12 |
| M8-T43 | M8 gate | gate | M8-T40, M8-T01 to M8-T38 | - | S | PLAN §4.2 |

### M9 Release

Detail file for every row: `docs/plan/M9-release.md`, section `## <task id>`. 8 tasks.

| Id | Title | Kind | Depends on | Grp | Size | Read |
|---|---|---|---|---|---|---|
| M9-T01 | `pnpm release:check` (`pnpm gen --release-check`) | release | M8-T43 | A | M | doc 07 §11 |
| M9-T02 | CI job `rename` green: build with `RIPPLE_PKG_NAME` set, test A-10 | release | M6-T35 | A | S | doc 01 §6.3, §11 (A-10); doc 13 §17.1, §17.2 |
| M9-T03 | CI jobs `node22` and `package-node20` green | release | M6-T35 | A | S | doc 13 §17.2; doc 01 §9 |
| M9-T04 | Root `README.md` (what Ripple is, quick start per host, links) and `CHANGELOG.md`; version numbers applied | docs | M8-T43 | A | S | ledger §12 (row `README.md`); doc 07 §11.1 to §11.3 |
| M9-T05 | Strict audit: no `PLAN 4.4` string under `src/`; acceptance lists of doc 01 §11, doc 07 §12, doc 13 §19 all pass | release | M8-T43 | B | M | doc 01 §11; doc 07 §12; doc 13 §19 |
| M9-T06 | Make the `cross-engine` CI job blocking (requires the SPIKE-06 report) | release | M1-T42 | A | S | doc 13 §17.3 |
| M9-T07 | Eval gate E4: release gate on the core set. **BLOCKED-ON-BEN (model access)** | gate | M8-T42 | - | S | doc 08 §8.14 |
| M9-T08 | M9 gate: release candidate; hand-off note `docs/plan/done/M9-handoff.md` listing what only Ben does (final package name, publish, eval gate E4) | gate | M9-T01 to M9-T06 | - | S | doc 07 §11.4 |

### M10 Liquid live track (BLOCKED-ON-BEN)

Detail file for every row: `docs/plan/M10-liquid-live.md`, section `## <task id>`. 9 tasks.

| Id | Title | Kind | Depends on | Grp | Size | Read |
|---|---|---|---|---|---|---|
| M10-T01 | Tier 8 test file `test/liquid/live.test.ts` (tests skip while `RIPPLE_STORE_URL` is unset) | harness | M7-T23 | A | M | doc 13 §13 |
| M10-T02 | SPIKE-02 `liquid-preview-store-rendering`: checks V-1 to V-20, report. **BLOCKED-ON-BEN (store)** | spike | M7-T23 | B | M | ledger §3 row SPIKE-02; doc 14 §15; doc 13 §21 Fallback (SPIKE-02) |
| M10-T03 | SPIKE-01 `liquid-standard-actions-runtime`: checklist C-21, report. **BLOCKED-ON-BEN (store)** | spike | M7-T23 | B | M | ledger §3 row SPIKE-01; doc 05 §16 |
| M10-T04 | SPIKE-03 `canvas-theme-reference`: report. **BLOCKED-ON-BEN (store with Canvas)** | spike | M7-T23 | B | S | ledger §3 row SPIKE-03; doc 03 §5.3; doc 14 §5 |
| M10-T05 | SPIKE-09 `liquid-recommendations-region`: report. **BLOCKED-ON-BEN (store)** | spike | M7-T23 | B | S | ledger §3 row SPIKE-09; `components/product-recommendations.md` and `blueprints/product.md`, Fallback (SPIKE-09) |
| M10-T06 | Apply spike outcomes: for each store spike with verdict FALLBACK, implement the `Fallback (SPIKE-nn)` section of its owning doc. **BLOCKED-ON-BEN (store)** | infra | M10-T02, M10-T03, M10-T04, M10-T05 | - | M | the `Fallback (SPIKE-nn)` sections named in PLAN §7 |
| M10-T07 | Ripple theme store acceptance A-20 to A-23. **BLOCKED-ON-BEN (store)** | harness | M10-T02 | C | S | doc 14 §14 |
| M10-T08 | M10 gate: tier 8 green on the store; nightly job `liquid-live` enabled. **BLOCKED-ON-BEN (store)** | gate | M10-T01 to M10-T07 | - | S | doc 13 §13, §17.4 |
| M10-T09 | Eval gate E5: live tier, bar B-8. **BLOCKED-ON-BEN (store, model ids)** | gate | M8-T42, M10-T08 | - | S | doc 08 §8.12 |

---

## 7. Risk register

### 7.1 Risks R1 to R6 (ledger section 2)

All six are decided. The plan retires what is left of each as follows.

| Risk | Decision | Retired by | Residual |
|---|---|---|---|
| R1 React hydration versus elements mutating attributes | D-002, D-033: print the upgrade-stable contract; `useElement` | M0-T37 (tier 4 harness), M1-T01 (pilot), M1-T17 (first `native` component hydrates in both script orders), M3-T04 (first `ui` component) | none |
| R2 Hydrogen cart store on Liquid through Standard Actions | D-041, D-047, D-048 | M1-T24, M1-T29 (emulation `fake-sa.js`), M1-T39 (theme server) | SPIKE-01, M10-T03 |
| R3 No-script cart form field names | D-043, D-044: two dialects | M1-T21, M1-T33, M1-T37, M1-T39 (`[T6]` form post), M7-T25 (NJ-F4 to NJ-F9) | none |
| R4 Optimistic structural updates in Liquid | D-045, D-046: none outside React; region refresh | M1-T22, M1-T26, M1-T29 (C-03, C-04, C-06) | SPIKE-02, M10-T02 |
| R5 Beta dependencies | D-022, D-062: exact pins, three `ui-*` families, tripwire tests | M0-T01 (exact pins), M0-T28 (`manifest.pins` check), M0-T36 (A-07, A-08), M3-T03 (snapshot re-check fails when UI SDK output changes) | none |
| R6 Tailwind utilities without a build | D-030, D-055 | M0-T23 (`theme.css`, entry files), M7-T23 (`pnpm theme:css`) | SPIKE-03, M10-T04 |

### 7.2 Spikes

The DEFAULT path is always built first and is what every task implements. A spike task only measures (section 3.4). When a spike's verdict is `FALLBACK required`, the next free session creates one follow-up row at the end of the spike's milestone table (`M<m>-T<next number>`, kind of the code it changes, size M), with the detail "apply the section `Fallback (SPIKE-nn)` of <owning doc>", and adds its id to the "Depends on" of the tasks listed under "Then blocks" below. For store spikes that follow-up is M10-T06.

| Spike | Question (short) | Task | Needs | Default path (built by) | Fallback path (specified in) | Then blocks |
|---|---|---|---|---|---|---|
| SPIKE-01 `liquid-standard-actions-runtime` | Hydrogen cart handler against the real Standard Actions runtime; does the platform publish the page view itself | M10-T03 | Ben's store | D-041 cart store without `configureCartEndpoint`; adapter dispatches the page view (M1-T24, M4-T21) | `docs/05-commerce.md` "Fallback (SPIKE-01)": thin cart object calling `Shopify.actions.*`; needs Ben's sign-off | M10-T08 |
| SPIKE-02 `liquid-preview-store-rendering` | Platform wrappers, `partials.fetch`/`apply`, param `as`, bare settings (V-1 to V-20) | M10-T02 | Ben's store | No wrapper; region root carries `data-rp-region` (M0-T12, M0-T13, M7-T23) | `docs/13-testing.md` "Fallback (SPIKE-02)" and `docs/14-liquid-theme.md` section 15: canonicaliser unwraps; wrapper `display: contents`; param `as` becomes `tag` | M10-T07, M10-T08 |
| SPIKE-03 `canvas-theme-reference` | Does the Canvas compiler accept the layer statement and `@theme reference` | M10-T04 | Ben's store with Canvas | D-055 marker region with `@theme reference` (M6-T04, M6-T12) | `docs/03-styling-and-tokens.md` section 5.3 and `docs/14-liquid-theme.md` section 5: omit the region; utilities use arbitrary values | M10-T08 |
| SPIKE-04 `rp-root-only-primitive` | `definePrimitive` + `createParts` with only a root part | M1-T14 | local | D-019 item 1 (M1-T13) | `docs/04-elements.md` "Fallback (SPIKE-04)": base class `RippleElement` in `src/runtime/element.ts` | M1-T16, M1-T26, M1-T27, M1-T28, M3-T08, M5-T10 |
| SPIKE-05 `invoker-commands-hosts` | React 19 and Remix 3 print `commandfor`, `command`, `popovertarget`, `popover=""`; polyfill in WebKit and Gecko | M1-T19 | local | D-008, D-010 (M1-T16, M1-T17) | `docs/04-elements.md` "Fallback (SPIKE-05)": also print `data-rp-open` / `data-rp-close` on buttons; `popover="auto"` | M3-T01 |
| SPIKE-06 `cross-engine-features` | CSS and platform features in WebKit and Gecko; confirm the floor of D-032 | M1-T42 | local; WebKit and Gecko builds | Features behind `@supports` or a feature test (M0-T21, M0-T22) | `docs/13-testing.md` "Fallback (SPIKE-06)" and `docs/04-elements.md` "Fallback (SPIKE-06)": per-feature literal fallbacks, or raise the floor | M9-T06 |
| SPIKE-07 `navigation-menu-popover` | `popover` panels with hover intent for a mega menu | M1-T43 | local | D-017 (M5-T10, M5-T11) | `docs/04-elements.md` "Fallback (SPIKE-07)": CSS-only dropdowns with a disclosure button | M5-T10 |
| SPIKE-08 `agent-bridge-confirm` | Does the bridge refuse an unapproved declared action and honour `data-agent-confirm` | M1-T41 | local | D-050: `data-agent-confirm` on the checkout control only (M1-T32, M1-T36) | Not a fallback, an addition: `docs/08-agent-kit-and-evals.md` section 7.7 adds the `rp-cart` action `checkout` | M8-T03 |
| SPIKE-09 `liquid-recommendations-region` | Fetch a partial from `routes.product_recommendations_url` | M10-T05 | Ben's store | `rp-recommendations` refreshes `rp-product-recommendations` (M4-T18, M4-T19) | `docs/components/product-recommendations.md` and `docs/blueprints/product.md` "Fallback (SPIKE-09)": FeaturedCollection of `settings.rp_related_collection` | M10-T08 |
| SPIKE-10 `html-region-refresh` | Document fetch + region replacement on `html` and `remix`; React `useRegionHtml` | M1-T44 (part a), M4-T22 (part b) | local; Node 24.3 or later for Remix | D-046, D-090 (M1-T22, M1-T25) | `docs/05-commerce.md` "Fallback (SPIKE-10)": `location.assign`; React app cancels `rp:refresh` | part a: M7-T21, M7-T22; part b: M4-T24 |
| SPIKE-11 `remix-opt-in-refresh` | `reloadFrames` and `navigate` options under Remix 3 | M1-T45 | local; Node 24.3 or later | D-090: both options are opt-in (M1-T22) | `docs/05-commerce.md` "Fallback (SPIKE-11)": remove the two options, `refresh-remix.ts` and C-26 | M8-T06 (guide `hosts-remix`), M8-T19 (skill `ripple-remix`) |

### 7.3 Other open risks

| Risk | Where it bites | Mitigation in this plan |
|---|---|---|
| Spec code marked NOT RUN (D-113) does not work as written | M0 harness tasks (shim, theme server, host adapters) | Each such task names its gate test; the code is fixed until the gate passes. M1-T01 (Button pilot) is sized M to absorb harness defects |
| mock.shop is unreachable or lacks `menu`, `blog`, `page`, `localization`, `frontpage` data | M7-T26 | Tests E2E-11 probe each thing first (`docs/13-testing.md` section 12.2, E-4). Without network the task is BLOCKED-ON-ENV; tier 7 never gates M1 to M6 |
| Remix needs Node 24.3 or later | every tier 2 and tier 4 Remix case | Definition of done requires Node 24; below it the Remix cases skip and `--no-skips` fails, so the defect is visible |
| Size budgets (D-064) are exceeded late | `ripple.js` 45 kB after the commerce layer lands | `pnpm test:size` is in every element and component proof; M1-T46 records the measured sizes; the first task that exceeds a budget stops and reports |
| Weak or judge model not named (ledger Q17) | M8-T42, M9-T07 | Gates E1 to E5 are separate tasks; the harness and E2 need no model |
| Parallel component tasks conflict in generated shared files (`src/types.generated.ts`, locale files, docs) | M2 to M5 | Section 2: rebase, run `pnpm gen`, commit; never hand-merge generated files |
| The `examples/` skeletons of M0-T31 are replaced by CLI output in M7 | M7-T04 | M7-T04 keeps `package.json` scripts and the morph test routes and re-runs tiers 2 and 4 before merging |

---

## 8. Plan notes and ledger issues

These are the places where this plan had to read the specs narrowly or add process. Each is a candidate for a one-line ledger amendment by Ben. None changes a decided API.

| # | Topic | What the specs say | What this plan does |
|---|---|---|---|
| P-1 | Milestone numbers | D-067 orders M0 spikes, M1 foundations, M2 interactive, M3 commerce, M4 chrome and blueprints, M5 Liquid theme, M6 evals | Plan milestones M0 to M10 with the mapping of section 4.1. A buildable repository and a golden-path slice come first; spikes run as soon as their code exists |
| P-2 | Bring-up mode | `docs/07-manifest-registry-cli.md` MB-20: `pnpm build` and CI on `main` MUST NOT pass `--subset` | Section 4.4: one constant relaxes MB-20 until M5-T14. Strict from then on |
| P-3 | Golden-path theme in M1 | `docs/13-testing.md` ST-5 and two `serve-theme` cart tests need a theme with a product form and a cart; the Ripple theme (`examples/liquid`) is built by the CLI, which exists only after M6 | M1-T39 assembles a theme root in a temporary directory from `test/fixtures/theme-min/`, the slice's `components/*/liquid/` files, `pkg/registry/liquid/assets/`, and two minimal templates written in the test. M7-T27 re-points the same tests at `examples/liquid` |
| P-4 | Eval baseline timing | D-061 and `docs/08-agent-kit-and-evals.md` section 8.14: T01, T02, T08 MUST run by the end of the commerce milestone | The start states of T02 and T08 need the blueprints and the CLI (M6, M7). The baseline is gate E1 (M8-T39), run as soon as those exist. The eval harness tasks M8-T22 to M8-T30 depend only on M0 and MAY start early |
| P-5 | Checker schedule | `docs/07-manifest-registry-cli.md` section 9.7: layers S, H and P ship with the foundations | Engine, layer H and RP113 in M0; usage, structure, accessibility families in M2; commerce family in M4; Liquid, project-state and browser families in M6. A rule that is not implemented is absent from `src/check/rules/index.ts` |
| P-6 | Root `README.md` and `PLAN.md` | `docs/01-architecture.md` test A-01 requires both at the repository root; ledger section 12 lists `PLAN.md` and `README.md` as documents | The plan and the doc index live in `docs/PLAN.md` and `docs/README.md`. M0-T01 creates a root `PLAN.md` that contains one line pointing to `docs/PLAN.md`, and a root `README.md` stub that M9-T04 completes |
| P-7 | Acceptance-coverage test | `docs/13-testing.md` section 18.2 reads the `## <title>` sections of docs 09 to 12 | The specs are one file per component (ledger, "File layout of the component specs"). M0-T32 reads `docs/components/<id>.md` and its `### Acceptance tests` heading |
| P-8 | Commerce component status | `docs/13-testing.md` section 18.1 line 16 needs tier 7, which needs the example storefronts | Commerce components merge as `beta`; M7-T28 promotes them (section 3.2) |
| P-9 | SPIKE-10 split | Ledger section 3 lists SPIKE-10 as one local spike | Part (a) (cart and `rp-live` on `html` and `remix`) runs in M1; part (b) (React `useRegionHtml` with PredictiveSearch and ProductRecommendations) runs in M4 when those bindings exist. `rp-live` is built in M1 for this reason |
| P-10 | Task tracking | Not specified | `docs/plan/done/<task id>.md` files and `task/<task id>-*` branches (sections 1 and 2) |
| P-11 | `rp-view-event` | D-089: defined inside the two adapter files | The adapters land in M1 without it (M1-T23, M1-T24); M4-T21 adds it and the Liquid page view, so the M1 tasks stay size M |

When Ben answers an open question of ledger section 10 or a spike changes a decision, the ledger is updated first, then the affected rows of section 6 and their detail sections.
