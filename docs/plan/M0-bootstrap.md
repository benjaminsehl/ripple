# M0 Repository bootstrap: task details

Milestone M0 of `docs/PLAN.md` (section 6, table "M0 Repository bootstrap"): 45 tasks, `M0-T01` to `M0-T45`. Each section below is the detail of one row. The ledger `docs/00-decisions.md` wins over this file; `docs/PLAN.md` wins over this file on process.

Read section 0 of this file once (about 9 kB), then only the section `## <task id>` of your task.

Every "Read first" list is in addition to `docs/CONVENTIONS.md`. Numbered docs are never read in full: open the named heading by searching for it. "kB" figures are the size of the named section.

---

## 0. Rules for every M0 task

### 0.1 Environment facts (checked 2026-11-21)

- Every version pinned in `docs/01-architecture.md` section 5.1 exists on the npm registry (checked with `npm view <name>@<version> version` for all 22 pins and `pnpm@10.28.0`).
- Chromium for Playwright 1.63.0 is preinstalled on the build machine. Never run `pnpm exec playwright install` for another browser in M0.
- The build machine has Node 22.23.5. Remix tests need Node 24.3 or later and SKIP below it (rule T-7 of `docs/13-testing.md` section 1). On Node below 24.3, wherever this file says `--no-skips`, run the command without `--no-skips`, confirm that every skip line has the reason `Remix needs Node 24.3 or later`, and write the skip lines into the pull request. The CI job `verify` (Node 24) is then the proof.
- All commands run from the repository root. Tools resolve paths from `process.cwd()`; never use `import.meta.url` to find repository files.

### 0.2 Copying complete code from a spec (the extractor)

Many M0 files are printed complete in a spec. Do NOT retype them and do NOT read the code block into your context. Extract the block with this script, then read only the prose rules around it.

Create the script once per session (it is not committed; `node_modules/` is git-ignored):

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

Before M0-T01 has run there is no `node_modules/`; `mkdir -p` creates it.

Usage: `node node_modules/.cache/ripple/extract.mjs <doc file> '<heading prefix>' <language> <index> <output path>`. It writes the code block number `<index>` (0 is the first) with the fence language `<language>` that follows the first line starting with `<heading prefix>`. In this file an extraction is written as a table row:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|

"Bytes" is what the script prints; "First line" is the first line of the output. Both were checked against the docs on 2026-11-21. When either differs, the doc changed: stop and report, do not guess another block.

After extraction: the file is the required starting text (D-113). Change it only (a) where this file lists a change, or (b) where a named gate test fails, and then change the code, never the gate. List every change in the pull request under "Deviations".

Import specifiers inside `src/` and `test/` may be written with or without `.ts` (`docs/01-architecture.md` section 5.2); keep what the extracted block uses.

### 0.3 Proof commands per phase

`docs/PLAN.md` section 3.1 lets M0 replace steps 3 to 6 of the definition of done until the build exists. Use the HIGHEST phase whose condition holds on `main` when you start (look in `docs/plan/done/`):

| Phase | Condition | Commands that MUST exit 0 |
|---|---|---|
| P1 | task is M0-T01 | the commands in the task's Acceptance |
| P2 | `docs/plan/done/M0-T02.md` exists | `pnpm typecheck` and `pnpm test:unit --no-skips` |
| P3 | `docs/plan/done/M0-T15.md` exists | P2 plus `pnpm gen --check` |
| P4 | `docs/plan/done/M0-T28.md` exists | `pnpm typecheck && pnpm gen --check && pnpm build && pnpm test --no-skips` |
| P5 | `docs/plan/done/M0-T31.md` exists | `pnpm ci` |

A task that creates the thing a phase needs proves that phase itself (M0-T15 proves P3, M0-T28 proves P4, M0-T31 proves P5). The last line of every runner invocation MUST read `<p> passed, 0 failed, 0 skipped` (see 0.1 for Node below 24.3).

### 0.4 Bring-up markers

The repository is built in pieces, so some spec checks cannot hold yet. Every such relaxation in code MUST carry a comment that contains the exact string `PLAN 4.4` and the task that removes it, for example `// PLAN 4.4: stub, replaced by M1-T20`. Task M9-T05 fails while that string occurs under `src/`. Do not relax anything this file does not list.

Component manifests written later set `"since": "0.1.0"` (the value of `VERSION` in `src/identity.ts`; the worked entries of `docs/07-manifest-registry-cli.md` section 1.7 use it).

### 0.5 Names chosen by this plan (the specs are silent)

The specs name the files below but not these identifiers. They are fixed here so that separate sessions agree. Each is a PLAN-CHOSEN name: if a spec section you read names the same thing differently, the spec wins; use its name, and record it in your done file.

| Identifier | File | Signature and meaning | Created by |
|---|---|---|---|
| `MANIFEST_VERSION`, `PREFIX`, `HOSTS` | `src/gen/registry.ts` | the constants `1`, `{ css: "rp-", element: "rp-", liquidFile: "" }`, `["html", "react", "remix", "liquid"]` of doc 07 section 1.1 | M0-T06 |
| `validateSchema` | `src/gen/registry.ts` | `(schema: unknown, value: unknown, registry: Record<string, unknown>) => string[]`; returns error texts, empty when valid; `registry` maps a schema `$id` to its schema | M0-T06 |
| `loadSources` | `src/gen/registry.ts` | `(root?: string) => Sources`; reads the inputs of generator step G1 | M0-T06 |
| `assembleManifest` | `src/gen/registry.ts` | `(sources: Sources) => Manifest`; doc 07 section 1.1 | M0-T06 |
| `checkManifest` | `src/gen/registry.ts` | `(manifest: Manifest, options: { subset: boolean }) => string[]`; the MB checks; each text is `manifest: <component id>: MB-<n>: <text>` | M0-T07 |
| `LEDGER_ENUMS`, `PROHIBITED_PROP_NAMES` | `src/gen/registry.ts` | data for MB-7 and MB-6, copied from ledger sections 6.2, 6.3 and 6.5 | M0-T07 |
| `GenContext`, `StepResult`, `runGen` | `src/gen/index.ts` | see M0-T15 | M0-T15 |
| `generateReactFiles`, `generateRemixFiles`, `generateLiquidFiles`, `generateTypeFiles` | `src/gen/react.ts`, `remix.ts`, `liquid.ts`, `types.ts` | each `(context: GenContext) => StepResult` | M0-T16 to M0-T19 |
| `lintBinding` | `src/gen/bindings-lint.ts` | `(file: { path: string; host: "react" \| "remix" \| "liquid" \| "html"; text: string }) => Array<{ path: string; rule: string; message: string }>` | M0-T20 |
| `lintFixtures` | `src/gen/index.ts` | `(manifest: Manifest) => string[]`; each text is `<component id>/<fixture name>: <check id>: <message>` | M0-T20 |

### 0.6 Order constraints the task table does not show

The table gives these tasks the same group letter, but they edit the same file. Obey this order in addition to "Depends on":

- M0-T08 starts only after M0-T03 is done (both edit `src/index.ts` and `src/types.ts`).
- M0-T06 starts only after M0-T08 is done (both edit `src/types.ts`).
- M0-T16 to M0-T20 and M0-T22 to M0-T24 each edit ONLY their own slot of `src/gen/index.ts` (M0-T15 creates the slots). Never touch another slot. On a rebase conflict in that file keep both sides.
- M0-T20 needs `src/testing/resources.ts` (M0-T09) and `src/testing/canonicalize.ts` (M0-T05); both are done before M0-T15 can be, except M0-T09: check `docs/plan/done/M0-T09.md` first.

### 0.7 What M0 cannot prove

M0 ends with ZERO components (gate, `docs/PLAN.md` section 4.2). The generic test files of tiers 2 to 6 loop over `loadFixtures()` and therefore create zero tests in M0. Their functional gate is task M1-T01 (Button pilot), as `docs/PLAN.md` section 7.3 says. For those tasks "Acceptance" in M0 means: the file exists with the spec text, type-checks, and the suite still passes with zero cases. Do not add a sample component to make them run.

---

## M0-T01 Root files and first install

- **Goal:** Create the root files so that `pnpm install` works and writes the lockfile.
- **Depends on:** none.
- **Read first:** `docs/01-architecture.md` sections "### 4.1 Root files" (0.9 kB), "### 5.1 Root `package.json`" prose below the code block (1.5 kB), "## 9. Pinned versions" rules 1 to 4 (0.6 kB). `docs/PLAN.md` section 8 row P-6.
- **Files (create):** `package.json`, `tsconfig.json`, `.gitignore`, `LICENSE`, `CHANGELOG.md`, `README.md`, `PLAN.md`, `AGENTS.md`, `pnpm-lock.yaml` (written by pnpm), `docs/plan/done/M0-T01.md`.
- **Must not change:** anything under `docs/` except the done file; `theme/`.

Steps:

1. `git fetch origin && git switch -c task/M0-T01-root-files origin/main`
2. Create the extractor (section 0.2). Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `package.json` | `docs/01-architecture.md` | `### 5.1 ` | `json` | 0 | 2869 | `{` |
| `tsconfig.json` | `docs/01-architecture.md` | `### 5.2 ` | `json` | 0 | 692 | `{` |

3. `.gitignore`: exactly three lines, in this order: `node_modules/`, `pkg/`, `evals/runs/`.
4. `LICENSE`: the standard MIT License text (SPDX id `MIT`; placeholder for ledger Q18). Copyright line: `Copyright (c) 2026 Ripple contributors`.
5. `CHANGELOG.md`: the three lines `# Changelog`, an empty line, `## 0.1.0`, then an empty line and `- Development version. Not released.`
6. `README.md`: the lines `# Ripple`, empty line, `Design system and component library for Shopify storefronts. The specification is in [docs/README.md](docs/README.md).`, empty line, `Status: under construction. This file is completed by task M9-T04.`
7. `PLAN.md`: one line: `The implementation plan is [docs/PLAN.md](docs/PLAN.md).`
8. `AGENTS.md`: the lines `# Ripple: instructions for contributors`, empty line, `1. Read docs/CONVENTIONS.md.`, `2. Read docs/PLAN.md sections 1 to 3, then the one row of your task and its detail section under docs/plan/.`, `3. Never edit theme/ or docs/research/. Never edit a generated file; change its source and run pnpm gen.`
9. `pnpm install` (no `--frozen-lockfile` this one time). It writes `pnpm-lock.yaml`. Do not add `pnpm-workspace.yaml`, `.npmrc`, or a `pnpm` key to `package.json`. Warnings about ignored build scripts and unmet optional peers are expected; do not act on them.
10. Write the done file, commit `M0-T01: add root files and lockfile`, push, open the pull request.

Acceptance:

- `pnpm install --frozen-lockfile` exits 0.
- `node -e "const p=require('./package.json');const bad=Object.entries({...p.dependencies,...p.devDependencies}).filter(([,v])=>!/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(v));if(bad.length||p.name!=='ripple-repo'||p.private!==true)throw new Error(JSON.stringify(bad))"` exits 0.
- `git ls-files` lists exactly the ten files above plus what was already on `main`. `pnpm-workspace.yaml` does not exist.
- `node -e "require('./node_modules/@ui-sdk/core/package.json').version==='0.1.0-beta.14'||process.exit(1)"` exits 0.

- **Out of scope:** any file under `src/`, `test/`, `css/`; `size-budget.json` (M0-T29); `.github/` (M0-T44); `bin/` (M0-T28). `pnpm typecheck` is NOT run here: with no `.ts` file `tsc` fails with TS18003.
- **If blocked:** when the registry rejects a pinned version, do not change the pin; open a draft pull request with the failing `pnpm install` output (the pins are ledger text, D-103).

## M0-T02 Test runner

- **Goal:** Add the runner behind every `pnpm test*` script and its own tests.
- **Depends on:** M0-T01.
- **Read first:** `docs/13-testing.md` sections "### 2.4 Test names and tags", "### 2.5 Rules for writing a test file", the table and exit codes BELOW the code block of "### 2.6", "### 2.7", "### 6.3 `test/run.test.ts`", "### 18.3", and item 1 of "## 19." (about 7 kB without the code block).
- **Files (create):** `test/run.ts`, `test/run.test.ts`, `docs/plan/done/M0-T02.md`.

Steps:

1. Branch `task/M0-T02-test-runner`; `pnpm install --frozen-lockfile`.
2. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `test/run.ts` | `docs/13-testing.md` | `### 2.6 ` | `ts` | 0 | 5121 | `// The test runner behind every \`pnpm test*\` script. Bundles each *.test.ts with esbuild and runs` |

3. Write `test/run.test.ts` with flat `test()` calls from `node:test` and `node:assert/strict`. Each runner test spawns `process.execPath` with `["node_modules/.cache/ripple/test-run.mjs", ...args]` (`spawnSync`, `encoding: "utf8"`) and asserts the exit code and standard error.

Tests (exact names, all in `test/run.test.ts`):

| Name | Arguments | Expected |
|---|---|---|
| `[T1] run: unknown argument exits 2` | `--bogus` | exit 2; stderr ends with `test: unknown argument --bogus` |
| `[T1] run: unknown tier exits 2` | `--tiers=11` | exit 2; stderr contains `unknown tier 11` |
| `[T1] run: invalid component id exits 2` | `--tiers=1 --component=Bad` | exit 2; stderr contains `--component is not a component id: Bad` |
| `[T1] run: unknown engine exits 2` | `--tiers=1 --engine=ie` | exit 2; stderr contains `unknown engine ie` |
| `[T1] run: package.json scripts equal docs/13-testing.md 2.3` | none | `JSON.parse(readFileSync("package.json")).scripts` deep-equals a constant copy of the object of doc 13 section 2.3, written in the test file (copy it from `package.json`, which M0-T01 extracted from the identical object) |
| `[T1] test-names: every test name matches N-1 and every [chromium] tag has a reason` | none | the rule of doc 13 section 18.3, over the five `TEST_GLOBS` of `test/run.ts` (use `globSync` from `node:fs`) |

4. Prove with the commands below; commit `M0-T02: add test runner`.

Acceptance:

- `pnpm typecheck` exits 0.
- `pnpm test:unit --no-skips` exits 0; last line `test: tiers 1 engine chromium: 6 passed, 0 failed, 0 skipped`.
- `pnpm test:run --bogus; echo $?` prints `test: unknown argument --bogus` and `2`.
- `pnpm test:conformance; echo $?` prints ``test: pkg/ is missing; run `pnpm build` first`` and `2`.

- **Out of scope:** `test/support/**`; any change to `package.json`.
- **If blocked:** `test/run.ts` was RUN as printed. When it fails, the Node or esbuild version differs from the pins; report, do not rewrite the runner.

## M0-T03 Identity, `rv`, `cx`, `parseResponsive`

- **Goal:** Add the package identity file and the core helpers with their unit tests.
- **Depends on:** M0-T02.
- **Read first:** `docs/01-architecture.md` "### 6.3 Package identity" (1 kB); `docs/06-bindings.md` "## 4. Helpers `rv` and `cx`, and the type `Responsive`" rules V-1 to V-4 and the acceptance table (2.5 kB); `docs/02-html-contract.md` "### 5.6 Acceptance table" (1.5 kB). (The task table omits doc 02; `src/responsive.ts` is defined there in section 5.5.)
- **Files (create):** `src/identity.ts`, `src/index.ts`, `src/responsive.ts`, `src/types.ts`, `src/index.test.ts`, `src/responsive.test.ts`, done file.

Steps:

1. Branch `task/M0-T03-core-helpers`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `src/identity.ts` | `docs/01-architecture.md` | `### 6.3 ` | `ts` | 0 | 104 | `export const PKG_NAME = "ripple-kit";` |
| `src/types.ts` | `docs/06-bindings.md` | `## 4. ` | `ts` | 0 | 217 | `// src/types.ts (the part owned by this document)` |
| `src/index.ts` | `docs/06-bindings.md` | `## 4. ` | `ts` | 1 | 1796 | `// src/index.ts (the part owned by this document)` |
| `src/responsive.ts` | `docs/02-html-contract.md` | `### 5.5 ` | `ts` | 0 | 3433 | `export const BREAKPOINTS = ["sm", "md", "lg", "xl", "2xl"] as const;` |

2. `src/index.test.ts`: one test per row of the acceptance table of doc 06 section 4. Names: `[T1] index: rv returns undefined for undefined, null and the empty string`, `[T1] index: rv prints 0 and false`, `[T1] index: rv accepts a valid responsive value without a warning`, `[T1] index: rv warns once in development for an invalid value`, `[T1] index: rv does not warn in production`, `[T1] index: cx joins and skips empty parts`, `[T1] index: cx with no argument is the empty string`. Capture `console.warn` by replacing it inside the test and restoring it in `finally`; set and restore `process.env.NODE_ENV`.
3. `src/responsive.test.ts`: `[T1] responsive: parseResponsive gives the tokens, errors and warnings of the acceptance table` (all 13 rows of doc 02 section 5.6, `allowed` = the space steps `0 0.5 1 1.5 2 3 4 5 6 8 10 12 16 20 24 32`) and `[T1] responsive: resolveResponsive picks the widest active breakpoint` (the five results printed under the table).

Acceptance: phase P2 of section 0.3; `grep -rn "ripple-kit" src | grep -v "src/identity.ts"` prints nothing.

- **Out of scope:** `src/image.ts` and the `Ripple*` types (M0-T08); `src/types.generated.ts` (M0-T19); the manifest types (M0-T06).
- **If blocked:** none expected. `Breakpoint` is exported by `src/responsive.ts`; do not also declare it in `src/types.ts`.

## M0-T04 Architecture tests

- **Goal:** Enforce the import rules and the repository layout with tier 1 tests that need no `pkg/`.
- **Depends on:** M0-T02.
- **Read first:** `docs/01-architecture.md`: the five reading rules under the code block of "### 2.2 Import rules" (1.5 kB), rules 1 to 14 above that block (5 kB), "## 11. Acceptance tests" rows A-01 to A-04, A-12, A-15 (3 kB).
- **Files (create):** `src/architecture.test.ts`, done file.

Steps:

1. Branch `task/M0-T04-architecture-tests`. Extract the rule object to a scratch file and paste it VERBATIM into the test file:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `node_modules/.cache/ripple/import-rules.ts` | `docs/01-architecture.md` | `### 2.2 ` | `ts` | 0 | 3616 | `// key: glob of importer, relative to repo root. value: allowed specifiers.` |

2. Write a small glob matcher inside the test file for the forms the object uses: `*` (no `/`), `**` (any depth), `{a,b}`. Collect specifiers with one regular expression per form over each file's text after removing `//` and `/* */` comments: `import ... from "x"`, `import "x"`, `export ... from "x"`, `import("x")`; record whether the statement is `import type` / `export type`.
3. Write these tests:

| Name | Assertion |
|---|---|
| `[T1] architecture: A-01 top-level entries are allowed` | every top-level entry except `.git`, `.gitignore`, `node_modules` is in the set of row A-01; `pnpm-workspace.yaml` is absent |
| `[T1] architecture: A-02 entries of src are allowed` | every directory of `src/` is in the directory set of row A-02; every file is one of `identity.ts`, `index.ts`, `responsive.ts`, `image.ts`, `types.ts`, `types.generated.ts`, or ends with `.test.ts`; `src/runtime/element.ts` does not exist |
| `[T1] architecture: A-03 every import in src follows IMPORT_RULES` | row A-03 with the five reading rules; `*.test.ts` files are not checked |
| `[T1] architecture: A-04 forbidden strings are absent from src` | row A-04; `*.test.ts` files are not searched |
| `[T1] architecture: A-12 root package.json pins every tool` | row A-12; the expected devDependency versions are a constant copy of the object in `package.json` |
| `[T1] architecture: A-15 bindings import only the allowed Hydrogen functions` | row A-15 over `components/*/react/*.{ts,tsx}` and `components/*/remix/*.{ts,tsx}`; passes with zero files |

Bring-up relaxations (each with a `PLAN 4.4` comment, section 0.4):

- A-01 and A-02 are "every entry is allowed" (subset), not set equality, because directories appear task by task. Comment: `// PLAN 4.4: subset until every directory exists; set equality is restored by M9-T05`.
- `src/types.generated.ts` (written by M0-T19, `docs/07-manifest-registry-cli.md` section 3.2 row G7) is not in the ledger tree. Accept it in A-02, and in A-03 check it with the rule of key `src/{index,responsive,image,types}.ts`. Comment: `// PLAN 4.4: ledger tree lacks src/types.generated.ts; see docs/plan/M0-bootstrap.md problems`.

Acceptance: phase P2. Then prove the test bites: temporarily add `import "react"` to `src/responsive.ts`, run `pnpm test:unit --grep=A-03`, see it fail naming `src/responsive.ts`, revert.

- **Out of scope:** tests A-05 to A-11, A-13, A-14 (build and browser tiers).
- **If blocked:** when a later task's file violates a rule, that task is wrong, not this test. Never edit `IMPORT_RULES`.

## M0-T05 Canonicaliser

- **Goal:** Add the single HTML canonicaliser and its acceptance tests.
- **Depends on:** M0-T02.
- **Read first:** `docs/02-html-contract.md` "### 11.6 Masks" (3.3 kB), "### 12.2" to "### 12.4" (7 kB), "### 12.6 Acceptance table" (2.5 kB); in "### 11.9 Four worked fixtures" only the fourth fixture (search `fixture 4` / the ProductForm record: its reference HTML, its Liquid output and its `mask`).
- **Files (create):** `src/testing/canonicalize.ts`, `src/testing/canonicalize.test.ts`, done file.

Steps:

1. Branch `task/M0-T05-canonicalize`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `src/testing/canonicalize.ts` | `docs/02-html-contract.md` | `### 12.5 ` | `ts` | 0 | 9952 | `import { parseFragment } from "parse5";` |

2. `src/testing/canonicalize.test.ts`: one test per row of the table of section 12.6, named `[T1] canonicalize: row <n> <short statement>` (15 tests; for example `[T1] canonicalize: row 1 attribute order, quoting and whitespace do not matter`). Rows 10 and 11 use the strings of worked fixture 4 copied into the test file.

Acceptance: phase P2; `pnpm test:unit --grep=canonicalize` reports 15 passed.

- **Out of scope:** `src/testing/index.ts` (M0-T13); any second implementation of canonicalisation anywhere (D-075).
- **If blocked:** the file was RUN as printed with `parse5@8.1.1`. When a row fails, report the row; do not change the algorithm.

## M0-T06 Manifest schema, element table, types, loader

- **Goal:** Add the manifest schemas, the element table, the manifest TypeScript types and the loader that generator step G1 uses.
- **Depends on:** M0-T02 (and M0-T08, section 0.6).
- **Read first:** `docs/07-manifest-registry-cli.md` "### 1.1 Source files and assembly" (2.5 kB), the one paragraph after the code block of "### 1.2" (0.3 kB), "### 1.3 Key reference" (10 kB), "### 1.4 What the schema rejects" (1.1 kB), the paragraph above and below the block of "### 1.5" (1 kB), row G1 of "### 3.2 Steps and outputs" (0.6 kB); ledger "### 4.8 Manifest key names" (4 kB). Do not read the 26 kB schema; extract it.
- **Files (create):** `src/gen/schema/manifest.schema.json`, `src/gen/schema/fixture.schema.json`, `src/gen/elements.json`, `src/gen/registry.ts`, `src/gen/manifest.test.ts`, done file. **Modify:** `src/types.ts` (append).

Steps:

1. Branch `task/M0-T06-manifest-schema`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `src/gen/schema/manifest.schema.json` | `docs/07-manifest-registry-cli.md` | `### 1.2 ` | `json` | 0 | 26303 | `{` |
| `src/gen/schema/fixture.schema.json` | `docs/02-html-contract.md` | `### 11.2 ` | `json` | 0 | 2664 | `{` |
| `src/gen/elements.json` | `docs/07-manifest-registry-cli.md` | `### 1.5 ` | `json` | 0 | 2044 | `{` |

2. `src/gen/registry.ts` (part; M0-T07 and M6 add to it). Imports allowed: `node:*`, `src/types.ts`, other `src/gen/**` files. JSON files are read with `node:fs`, never imported. Write:
   - `MANIFEST_VERSION`, `PREFIX`, `HOSTS` (section 0.5).
   - `validateSchema`: a hand-written JSON Schema validator. The repository has NO JSON Schema library and none may be added (root `package.json` is fixed). It MUST support exactly the keywords the two schemas use: `$ref` (local `#/$defs/<name>` and an absolute `$id` looked up in `registry`), `$defs`, `type` (string or array), `properties`, `required`, `additionalProperties` (boolean or schema), `propertyNames`, `items`, `prefixItems`, `minItems`, `maxItems`, `uniqueItems`, `enum`, `const`, `pattern`, `minLength`, `maxLength`, `minimum`, `allOf`, `anyOf`, `oneOf`, `not`, `if` / `then` / `else`. `title`, `description`, `default`, `$schema`, `$id` are annotations. An unknown keyword MUST throw `validateSchema: unsupported keyword <name>`. It MUST NOT fetch anything.
   - `loadSources(root = ".")`: reads `src/gen/elements.json`; every `components/<id>/<id>.json` (a missing `components/` directory means zero components); every `blueprints/<id>/blueprint.json` except the directory `blueprints/_sample/`; `locales/en.default.json` (missing: `{}`); `css/tokens.css` (missing: empty string). Returns them as one object `Sources`. It validates each component against `#/$defs/component` and each blueprint against `#/$defs/blueprint`, checks that a component's `name` equals its directory name, and fails when a source fixture has the key `html`. Failures are thrown as one `Error` whose message lists every problem, one per line.
   - `assembleManifest(sources)`: the object of doc 07 section 1.1 in the key order of rule 3 there; `package` from `PKG_NAME` and `VERSION`; `pins` read from the three `node_modules/<name>/package.json` files; `scales` is `{ breakpoint: [], space: [] }` until M0-T23 provides `readScales` (comment `// PLAN 4.4: scales come from readScales, wired by M0-T23`); every fixture gets `html` = the content of `components/<id>/fixtures/<name>.html` minus the trailing newline (a missing file is an error).
3. `src/types.ts`: append the type-only declarations `Manifest`, `ManifestComponent`, `ManifestBlueprint` and the sub-types they need (`ManifestProp`, `ManifestPart`, `ManifestFixture`, `ManifestRule`, `ManifestFile`, `ManifestElement`). No spec prints them: derive every key and enum from `$defs` of `manifest.schema.json` and ledger section 4.8; keys the schema marks optional are optional. No runtime code. Do NOT add `ComputedLock` (M6).
4. `src/gen/manifest.test.ts`. The valid base is built at test time: extract the three worked entries from `docs/07-manifest-registry-cli.md` (the first `json` block under `#### 1.7.1 `, `#### 1.7.2 `, `#### 1.7.3 `; the same logic as the extractor, inlined in the test), put them under `components`, give every fixture an `html` string, add `elements` from `src/gen/elements.json`, valid `pins`, `scales: { breakpoint: ["sm","md","lg","xl","2xl"], space: [<the 16 space steps>] }`, `blueprints: {}`. Tests:
   - `[T1] manifest: the three worked entries validate with zero errors`
   - `[T1] manifest: mutation <n> is rejected` for n = 1 to 23, one test each, in the order of doc 07 section 1.4 (apply the one mutation to a deep copy; expect at least one error).
   - `[T1] manifest: validateSchema throws on an unsupported keyword`
   - `[T1] manifest: loadSources returns zero components on an empty tree`

Acceptance: phase P2; `pnpm test:unit --grep=manifest` reports 26 passed; `node -e "JSON.parse(require('fs').readFileSync('src/gen/schema/manifest.schema.json','utf8'))"` exits 0.

- **Out of scope:** `config.schema.json` (M6); `LEDGER_COMPONENTS` and the MB checks (M0-T07); `src/gen/index.ts` (M0-T15).
- **If blocked:** when a worked entry fails validation with your validator, the validator is wrong (the entries validated with Python `jsonschema` 4.26, doc 07 section 1.2). When a mutation of 1.4 is NOT rejected, first check that you applied it to the right key; if the schema truly accepts it, record it under `## Ledger issues` of doc 07 and keep the test failing in a draft pull request.

## M0-T07 Manifest build checks MB-1 to MB-24

- **Goal:** Implement the build checks of the assembled manifest and the ledger component table.
- **Depends on:** M0-T06.
- **Read first:** `docs/07-manifest-registry-cli.md` "### 1.6 Build checks beyond the schema": the table and the last paragraph (8 kB; extract the `LEDGER_COMPONENTS` block, do not read it); ledger sections "### 6.2", "### 6.3", "### 6.5" (5 kB) and "## 8. V1 component list" only when a count test fails.
- **Files (modify):** `src/gen/registry.ts`. **Create:** `src/gen/registry.test.ts`, done file.

Steps:

1. Branch `task/M0-T07-manifest-checks`. Extract to a scratch file and paste into `src/gen/registry.ts`:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `node_modules/.cache/ripple/ledger-components.ts` | `docs/07-manifest-registry-cli.md` | `### 1.6 ` | `ts` | 0 | 4558 | `// src/gen/registry.ts (part)` |

2. Add `NO_JS_FULL` (the twelve ids of row MB-8), `LEDGER_ENUMS` (prop name to allowed values, from ledger 6.2 and 6.3; `docs/CONVENTIONS.md` section 6 has the same lists), `PROHIBITED_PROP_NAMES` (ledger 6.5).
3. Add `checkManifest(manifest, { subset })`. One private function per check, named `mb1` to `mb24`, called in numeric order; each returns texts in the form `manifest: <component id>: MB-<n>: <text>`. With `subset: true`, MB-20 is "every present id is a key of `LEDGER_COMPONENTS`".
4. Checks that need code which does not exist yet are written as far as possible and marked (section 0.4):
   - MB-13 (fixture checks): only "a component without `template` has only `hand` or `upgrade-snapshot` fixtures". The rest is `lintFixtures`, M0-T20. Comment `// PLAN 4.4: F-checks and fixture lint are M0-T20`.
   - MB-15: key uniqueness, the `icon` rule and the `data` rule. "source exists in the registry build" and "target follows table 4.3" are M6-T01. Comment `// PLAN 4.4: registry part of MB-15 is M6-T01`.
   - MB-10 locale lookup reads `sources.locale`; MB-17 uses `parseSelector` from `src/testing/canonicalize.ts` (allowed import for `src/gen/**`).
5. `src/gen/registry.test.ts`:
   - `[T1] registry: LEDGER_COMPONENTS has the 84 ledger rows` (84 keys; 60 `static`, 7 `native`, 3 `ui`, 14 `commerce`; 45 `block`, 10 `parts`, 28 `resource`, 1 `snippet`).
   - `[T1] registry: MB-<n> <statement>` for each n from 1 to 24: a valid in-memory manifest (the Button entry of doc 07 section 1.7.1, loaded as in M0-T06) passes with `subset: true`; one mutation makes exactly that check report. For MB-20 also: `subset: false` reports the 83 missing ids.

Acceptance: phase P2; `pnpm test:unit --grep=registry` reports 25 passed.

- **Out of scope:** `RegistryIndex`, `CORE_FILES`, `buildRegistry` (M6); calling `checkManifest` from a command (M0-T15).
- **If blocked:** this task is large. When it does not fit one session, finish MB-1 to MB-12 with tests, open the pull request as a draft, and state in it that a follow-up row `M0-T46` (MB-13 to MB-24) is needed (`docs/PLAN.md` "Size": split by adding a row, never widen).

## M0-T08 Shared data types and image helpers

- **Goal:** Add the `Ripple*` data types and the two image functions, exported from the package root.
- **Depends on:** M0-T02 (and M0-T03, section 0.6).
- **Read first:** `docs/05-commerce.md` "### 11.1 Shared data types": the prose and rules, not the block (3 kB); "### 11.3 Images" (2.5 kB); row C-22 of "## 14." (search `| C-22 |`).
- **Files (create):** `src/image.ts`, `src/image.test.ts`, done file. **Modify:** `src/types.ts` (append), `src/index.ts` (append exports).

Steps:

1. Branch `task/M0-T08-types-image`. Extract to scratch files, then append/paste:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `node_modules/.cache/ripple/ripple-types.ts` (append its content to `src/types.ts`) | `docs/05-commerce.md` | `### 11.1 ` | `ts` | 0 | 2862 | `export interface RippleMoney { amount: string; currencyCode: string }` |
| `src/image.ts` | `docs/05-commerce.md` | `### 11.3 ` | `ts` | 0 | 1096 | `const SHOPIFY_IMAGE_HOSTS: ReadonlySet<string> = new Set(["cdn.shopify.com", "mock.shop"])` |

2. Section 11.1 lists further `Ripple*` types below its first block (it says which are declared in `src/types.ts`). Add every type that section declares; do not invent fields.
3. `src/index.ts`: append `export { imageUrl, imageSrcSet } from "./image.ts";` and `export type * from "./types.ts";` (keep the existing `export type { Responsive }` line or let the second line cover it; not both if `tsc` reports a duplicate).
4. `src/image.test.ts`: `[T1] image: C-22 imageUrl adds width on Shopify hosts only and imageSrcSet lists the widths` (the three assertions of row C-22).

Acceptance: phase P2; `pnpm test:unit --grep=C-22` reports 1 passed.

- **Out of scope:** `src/testing/resources.ts` (M0-T09); `formatMoney` (never re-implemented: D-094).
- **If blocked:** none expected.

## M0-T09 Resource fixtures

- **Goal:** Add the 21 resource fixtures that fixtures and blueprint samples reference.
- **Depends on:** M0-T08.
- **Read first:** `docs/13-testing.md` "### 4.2 `resources.ts`": the table above the block and rules RS-1 to RS-5 (3.5 kB, not the 22 kB block); the three `resources` rows of the table in "### 6.2" that this task implements (1 kB). `docs/11-components-commerce.md` section 0.5 only when a value test fails.
- **Files (create):** `src/testing/resources.ts`, `src/testing/resources.test.ts`, done file.

Steps:

1. Branch `task/M0-T09-resources`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `src/testing/resources.ts` | `docs/13-testing.md` | `### 4.2 ` | `ts` | 0 | 22045 | `// Resource fixtures: the only commerce and chrome data a fixture may reference` |

2. Tests in `src/testing/resources.test.ts` (names exact, assertions in doc 13 section 6.2):
   - `[T1] resources: both sides exist and clones are independent`
   - `[T1] resources: the set is the documented set` (the 21 references, in the order of the table of 4.2)
   - `[T1] resources: values the worked fixtures depend on`

Acceptance: phase P2; `pnpm test:unit --grep=resources` reports 3 passed.

- **Out of scope:** the fourth test `[T1] resources: every $resource reference resolves and every resource is referenced` needs `loadFixtures` and is written by M0-T10.
- **If blocked:** the module was bundled and loaded but its tests are NOT RUN (the gate, D-113). When a value test fails, the owning document (doc 11 section 0.5, doc 12 section 1.6) wins: fix the value in `resources.ts`.

## M0-T10 Fixture loader

- **Goal:** Add the only loader through which tests obtain components, fixtures and blueprint samples.
- **Depends on:** M0-T05, M0-T06, M0-T09.
- **Read first:** `docs/13-testing.md` "### 4.1 `fixtures.ts`": heading line and rules FX-1 to FX-5 (2 kB, not the block); the `fixtures` rows and the remaining `resources` row of "### 6.2" (3.5 kB); `docs/02-html-contract.md` "### 11.1" to "### 11.3" (5 kB); in "### 11.9" only the Tabs record (needed by the round-trip test).
- **Files (create):** `src/testing/fixtures.ts`, `src/testing/fixtures.test.ts`, done file. **Modify:** `src/testing/resources.test.ts` (add one test).

Steps:

1. Branch `task/M0-T10-fixture-loader`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `src/testing/fixtures.ts` | `docs/13-testing.md` | `### 4.1 ` | `ts` | 0 | 8945 | `// Loads components and fixtures from the repository, and prepares fixture inputs for host` |

2. Required behaviour on the M0 tree: `loadComponents()` and `loadFixtures()` return `[]` when the directory `components/` does not exist. When the extracted code throws there, guard the directory read with `existsSync` (allowed fix: the gate is the test below).
3. Tests in `src/testing/fixtures.test.ts` (names exact; assertions in doc 13 section 6.2):
   - `[T1] fixtures: tokenizeChildren and restoreChildren round-trip`
   - `[T1] fixtures: every fixture file has a record and every record a file`
   - `[T1] fixtures: host-scoped fixtures are the allowed pairs`
   - `[T1] fixtures: host-scoped props are skipped` (the `hostHasProp` assertions; the `liquidCaseSource` assertion is added by M0-T33)
   - `[T1] fixtures: blueprint samples resolve`
4. Add to `src/testing/resources.test.ts`: `[T1] resources: every $resource reference resolves and every resource is referenced`.
5. Bring-up relaxations in the two tests that need content which does not exist in M0, each guarded by one constant in the test file `const BRINGUP = true // PLAN 4.4: set false and delete in M7-T29`:
   - "every key of `RESOURCES` is referenced" is asserted only when `BRINGUP` is false (the subset half is always asserted).
   - `loadBlueprintSample("layout")` is asserted only when `blueprints/_sample/layout.json` exists or `BRINGUP` is false.

Acceptance: phase P2; `pnpm test:unit --grep="fixtures|resources"` reports 9 passed.

- **Out of scope:** host adapters (`test/support/hosts/`); fixture lint (M0-T20).
- **If blocked:** `hostHasProp`, `resolveSample`, `loadBlueprintSample` are NOT RUN; their gates are the tests above. Fix the code until the gates pass.

## M0-T11 Upgrade recorder

- **Goal:** Add the mutation recorder and judge used by tier 3, tier 4 and checker rule RP601.
- **Depends on:** M0-T02.
- **Read first:** `docs/13-testing.md` "### 4.3": rules UD-1 to UD-7 (2.5 kB, not the block); `docs/02-html-contract.md` "### 7.1 The rule", "### 7.2 Allow-list entry format", "### 7.3 Entries fixed by the ledger" (9 kB).
- **Files (create):** `src/testing/upgrade-diff.ts`, done file.

Steps:

1. Branch `task/M0-T11-upgrade-diff`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `src/testing/upgrade-diff.ts` | `docs/13-testing.md` | `### 4.3 ` | `ts` | 0 | 7459 | `// Tier 3: upgrade stability (docs/02-html-contract.md section 7). Node side takes a Playw` |

2. Check by reading the file: the only `playwright` import is `import type`; `installUpgradeRecorder` references no imported symbol and no module-level constant (UD-5); `GLOBAL_UPGRADE_ALLOW` has exactly one entry (`a[data-rp-open]`, attributes `aria-haspopup`, `aria-controls`).

Acceptance: phase P2 (the file adds no test; M0-T04's A-03 test checks its imports). The functional gate is `[T3] <fixture>: zero unpermitted mutations at upgrade` in M0-T36 / M1-T01.

- **Out of scope:** `test/upgrade/**` (M0-T36); `REACT_HYDRATION_ALLOW` (M0-T37).
- **If blocked:** the file was RUN as printed; report instead of changing it.

## M0-T12 Liquid shim

- **Goal:** Add the local stand-in for Shopify's Liquid renderer that the Liquid host adapter and the theme server use.
- **Depends on:** M0-T09.
- **Read first:** `docs/13-testing.md` "### 4.4 `liquid-shim.ts`": the prose before and after the code block only (rules SH-1 to SH-5; do not read the 24 kB block); `docs/06-bindings.md` "### 8.2 Rules": rule L-13 only.
- **Files (create):** `src/testing/liquid-shim.ts`, done file.

Steps:

1. Branch `task/M0-T12-liquid-shim`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `src/testing/liquid-shim.ts` | `docs/13-testing.md` | `### 4.4 ` | `ts` | 0 | 23866 | `// Local stand-in for Shopify's Liquid renderer. It implements only the tags, filters and` |

2. Run `pnpm typecheck`. Fix type errors in the extracted file with the smallest change (the block is NOT RUN in this form); never change an exported name or signature. List each change under "Deviations".
3. Check with `grep -n "from \"" src/testing/liquid-shim.ts`: every import is `node:*`, `liquidjs`, or a relative path inside `src/testing/`. The file MUST NOT import `playwright`.

Acceptance: phase P2. The behaviour tests are written by M0-T13 (`test/liquid/shim.test.ts`); this task adds none.

- **Out of scope:** `serve-theme.ts`, `test/liquid/shim.test.ts`, `test/fixtures/theme-min/` (all M0-T13); any tag or filter outside the union the spec lists (SH rules).
- **If blocked:** when a type error cannot be fixed without changing behaviour that an SH rule fixes, stop and report the rule and the error text. Fallback for a missing `liquidjs` API: read `node_modules/liquidjs/dist/` type declarations for the pinned version; never upgrade the pin.

## M0-T13 Theme server, testing index, theme-min, shim tests

- **Goal:** Add the theme server, the public index of `src/testing/`, the minimal theme fixture, and the tier 1 tests of shim and server.
- **Depends on:** M0-T12 (and, for the index, M0-T05, M0-T09, M0-T10, M0-T11: check their done files; when one is missing, wait).
- **Read first:** `docs/13-testing.md` "### 4.5 `serve-theme.ts`" prose only (not the 19 kB block), "### 4.6 Tests of the shim and the server" (whole), "### 4.7 `index.ts`"; `docs/07-manifest-registry-cli.md`: search for `RB-8` and read that one rule.
- **Files (create):** `src/testing/serve-theme.ts`, `src/testing/index.ts`, `test/liquid/shim.test.ts`, `test/fixtures/theme-min/layout/theme.liquid`, `test/fixtures/theme-min/templates/.gitkeep`, `test/fixtures/theme-min/config/settings_schema.json`, `test/fixtures/theme-min/locales/en.default.json`, done file.

Steps:

1. Branch `task/M0-T13-serve-theme`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `src/testing/serve-theme.ts` | `docs/13-testing.md` | `### 4.5 ` | `ts` | 0 | 18702 | `// Serves a Liquid theme directory through the shim, with the platform stand-ins a storef` |
| `src/testing/index.ts` | `docs/13-testing.md` | `### 4.7 ` | `ts` | 0 | 177 | `export * from "./canonicalize"` |

2. Create the fixture theme exactly as RB-8 states it: `config/settings_schema.json` is `[]` plus newline; `locales/en.default.json` is `{}` plus newline; `templates/` is empty (commit `.gitkeep`); `layout/theme.liquid` is a minimal HTML document whose `<head>` holds a line with `{{ content_for_header }}` and whose `<body>` holds `{{ content_for_layout }}`. The spec fixes only the `content_for_header` line; keep the rest to: doctype, `<html lang="en">`, `<head>`, `<meta charset="utf-8">`, `<title>theme-min</title>`, the two Liquid outputs.
3. Write `test/liquid/shim.test.ts` with one test per `[T1]` row of the table in section 4.6, names exact:
   - `[T1] liquid-shim: filters`
   - `[T1] liquid-shim: tags outside the union throw`
   - `[T1] liquid-shim: partial renders its body and records the name`
   - `[T1] liquid-shim: block tag is rejected inside blocks and snippets`
   - `[T1] liquid-shim: renderPage wraps the template in the layout`
   - `[T1] liquid-shim: layout tag selects the layout`
   - `[T1] liquid-shim: paginate exposes previous and next`
   - `[T1] liquid-shim: form types print hidden inputs`
   - `[T1] liquid-shim: members ending in a question mark`
   - `[T1] liquid-shim: standard_event_data returns the fixed JSON`
   - `[T1] serve-theme: injectPlatformImports merges into the single import map`
   - `[T1] serve-theme: routes`
   Take each assertion from the same table row. When the table's wording of a name differs from this list, the table wins. For `serve-theme: routes`, copy `test/fixtures/theme-min/` into `fs.mkdtempSync(path.join(os.tmpdir(), "rp-theme-"))`, add the one-line templates the row names, serve the copy; never write into `test/fixtures/`.
4. Do NOT write the `[T5]` and `[T6]` rows of that table; they are M1-T39.
5. Check: `grep -n "playwright" src/testing/*.ts` shows only `import type` lines (A-03; nothing in `src/testing/` value-imports `playwright`).

Acceptance: phase P2; `pnpm test:unit --files=test/liquid/` ends with `12 passed, 0 failed, 0 skipped`.

- **Out of scope:** `examples/liquid`; `[T5]`/`[T6]` server rows; the Liquid host adapter (M0-T33).
- **If blocked:** shim and server are NOT RUN; a failing test of step 3 means: fix `liquid-shim.ts` or `serve-theme.ts`, not the test. When the index re-exports a file that does not exist yet, the dependency is not done: stop, do not stub.

## M0-T14 Contract template renderer `src/gen/html.ts`

- **Goal:** Add the reference renderer that turns a component's contract template plus props into HTML.
- **Depends on:** M0-T06.
- **Read first:** `docs/07-manifest-registry-cli.md` "### 2.1 Purpose and limits", "### 2.2 Scope and normalisation", "### 2.3 Nodes" (5 kB; skip 2.4 and the block of 2.5); in "#### 1.7.1" only the ```text block with the Button reference HTML.
- **Files (create):** `src/gen/html.ts`, `src/gen/html.test.ts`, done file.

Steps:

1. Branch `task/M0-T14-gen-html`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `src/gen/html.ts` | `docs/07-manifest-registry-cli.md` | `### 2.5 ` | `ts` | 0 | 7201 | `// src/gen/html.ts - the reference renderer for the contract template language (section 2` |

   The file exports `escapeHtml`, `normalizeProps`, `renderHtml`. Do not rename them.
2. Test data: extract the three worked manifest entries into a temp dir (not committed), then embed the Button entry in the test as a literal:

```bash
for n in 1 2 3; do node node_modules/.cache/ripple/extract.mjs docs/07-manifest-registry-cli.md "#### 1.7.$n " json 0 node_modules/.cache/ripple/worked/1.7.$n.json; done
```

   Expected sizes: `1.7.2.json` is 13405 bytes. The test file MUST NOT read `docs/` or `node_modules/.cache/` at run time; paste what it needs.
3. Tests in `src/gen/html.test.ts`:
   - `[T1] gen-html: Button default fixture renders the reference HTML` - `renderHtml` of the Button entry of 1.7.1 with its `default` fixture props equals, after `canonicalize` from `src/testing/canonicalize.ts`, the canonical form of the Button reference HTML printed in the ```text block of 1.7.1.
   - `[T1] gen-html: escapeHtml escapes text and attribute values` - `&`, `<`, `>`, `"` map as section 2.3 states.
   - `[T1] gen-html: normalizeProps applies defaults and drops unknown keys` - as section 2.2 states. When 2.2 states a different behaviour for unknown keys, assert what 2.2 states and rename the test accordingly.
   - one test per node kind of the table in 2.3 that Button does not use, named `[T1] gen-html: node <kind>`, each with a hand-written five-line template.

Acceptance: phase P2; `pnpm test:unit --files=src/gen/html.test.ts` has 0 failed and at least 4 passed.

- **Out of scope:** emission for other hosts (section 2.4; M0-T16 to M0-T18); writing `components/<id>/<id>.html` (M0-T15).
- **If blocked:** when the rendered Button HTML differs from the printed reference only in whitespace or attribute order, the canonicaliser is the judge (compare canonical forms). When it differs in content, report both strings; do not edit the reference.

## M0-T15 Generator command

- **Goal:** Add `pnpm gen` with steps G1, G3, G4 and G8 (manifest checks only), the options `--check` and `--subset`, and one slot per later generator step.
- **Depends on:** M0-T07, M0-T14.
- **Read first:** `docs/07-manifest-registry-cli.md` "### 3.1 Command", "### 3.2 Steps and outputs" (whole table); `docs/02-html-contract.md` "### 11.7 The `html` host reference file"; `docs/PLAN.md` section 4.4; this file sections 0.4, 0.5.
- **Files (create):** `src/gen/index.ts`, `src/gen/index.test.ts`, `locales/en.default.json` (content `{}` plus newline, only when absent), done file.

Steps:

1. Branch `task/M0-T15-gen-command`.
2. Write `src/gen/index.ts` with these exports (plan-chosen, section 0.5):

```ts
export const BRINGUP_SUBSET = true // PLAN 4.4: remove in M5-T14
export interface GenContext { root: string; manifest: Manifest; subset: boolean; read(path: string): string | undefined }
export interface StepResult { files: Map<string, string>; problems: string[] }
export async function runGen(args: string[]): Promise<number>
```

   `files` maps a repository-relative path to the full text the step wants on disk. `read` returns the current text of a repository file or `undefined`. `runGen` returns the exit code and never calls `process.exit`.
3. Entry guard (the same file is the CLI entry of the `gen` script and is imported by `src/gen/build.ts` and by tests): the last statement is

```ts
if (process.argv[1]?.endsWith("gen.mjs")) process.exitCode = await runGen(process.argv.slice(2))
```

4. Arguments: `--check`, `--subset`. Any other argument: print `gen: unknown argument <arg>` to stderr and return 2. `--snapshot` and `--release-check` (section 3.1) are not implemented in M0 and therefore take the unknown-argument path; mark the argument parser with `// PLAN 4.4: --snapshot added by M3-T03, --release-check by M9`. `subset` is `true` when `--subset` is given OR `BRINGUP_SUBSET` is `true`.
5. `runGen` order (section 3.2): G1 `assembleManifest(loadSources(root))`; G2 slots; G3 and G4 as section 3.2 states them, using `renderHtml` for each fixture of each component whose hosts include `html`, written to the reference file in the format of doc 02 section 11.7 (marker line `<!-- ripple:fixture <name> -->` before each fixture; no trailer); G5 to G7 slots; G8 `checkManifest(manifest, { subset })` plus the lint slots; G9 and G10 are skipped with `// PLAN 4.4: G9 and G10 added by M5-T14`. With zero components every loop runs zero times.
6. Slots. For each name below write one function with an empty result, called from `runGen` at the step shown, and above it the comment line `// slot <name> (<task>)`. Separate slots by at least three unchanged lines so that parallel tasks merge without conflict:

| Slot name | Step | Filled by |
|---|---|---|
| `g2Props` | G2 | M0-T22 |
| `g2Display` | G2 | M0-T22 |
| `g2Theme` | G2 | M0-T23 |
| `g5Liquid` | G5 | M0-T18 |
| `g6React` | G6 | M0-T16 |
| `g6Remix` | G6 | M0-T17 |
| `g7Types` | G7 | M0-T19 |
| `g8CssLint` | G8 | M0-T24 |
| `g8BindingsLint` | G8 | M0-T20 |
| `g8FixtureLint` | G8 | M0-T20 |

   Each is `function <name>(context: GenContext): StepResult { return { files: new Map(), problems: [] } } // PLAN 4.4: filled by <task>`.
7. Writing and output lines. Merge all `files`. Without `--check`: write each file whose content differs, print `wrote <path>` per written file, then `gen: <n> files written, <m> unchanged.`. With `--check`: write nothing; print `stale <path>` for a file that differs and `missing <path>` for one that does not exist; return 1 when any line was printed. Every text of `problems` is printed to stderr; any problem returns 1. Use the exact line formats of section 3.1 where it prints them; the formats here apply only where 3.1 is silent.
8. Tests in `src/gen/index.test.ts` (call `runGen` in-process; capture output by replacing `console.log`/`console.error` inside the test):
   - `[T1] gen: an unknown argument exits 2`
   - `[T1] gen: --check on a generated tree exits 0 and writes nothing`
   - `[T1] gen: running twice writes nothing the second time`

Acceptance: phase P3 (this task proves it): `pnpm gen` exits 0; a second `pnpm gen` prints `gen: 0 files written, 0 unchanged.` or the same line with a non-zero unchanged count and exits 0; `pnpm gen --check` exits 0; `pnpm gen --bogus; echo $?` prints `gen: unknown argument --bogus` and `2`; `git status --porcelain` after `pnpm gen` lists no file outside this task's Files.

- **Out of scope:** every slot body; `custom-elements.json`, `html-custom-data.json`, `registry/` (G9, G10); `--snapshot`.
- **If blocked:** when section 3.2 names an output for G3 or G4 whose input does not exist with zero components, emit nothing for it. When `loadSources` throws on the missing `components/` directory, fix `loadSources` (M0-T06 file) to return an empty list and record it as a deviation.

## M0-T16 Generator `src/gen/react.ts`

- **Goal:** Generate the whole React binding file of every `static` component and the generated header region of hand-written React bindings.
- **Depends on:** M0-T03, M0-T15.
- **Read first:** `docs/06-bindings.md` "## 5. TSX conventions" (5.1, 5.2), "### 6.1 Rules", "### 6.4 Static pattern: Button (generated)", "### 6.5 Static pattern with responsive props: Stack (generated)"; `docs/07-manifest-registry-cli.md` "### 2.4 Emission rules per host" (React column), "### 3.2" row G6, "### 3.3 Generated regions inside hand-written files"; worked entries "#### 1.7.1" (Button) and the Stack entry when 1.7 prints one.
- **Files (create):** `src/gen/react.ts`, `src/gen/react.test.ts`, done file. **Modify:** `src/gen/index.ts` (slot `g6React` only).

Steps:

1. Branch `task/M0-T16-gen-react`.
2. Export `generateReactFiles(context: GenContext): StepResult`. For each component whose manifest entry has kind `static` and whose hosts include `react`: produce the path section 3.2 row G6 names (`components/<id>/react/<id>.tsx`) with the text that sections 6.4 and 6.5 print for Button and Stack. For other kinds: when the hand-written file exists (`context.read`), replace only the generated region between the markers of section 3.3; when the file or the markers are missing, add a problem `<path>: generated region markers missing`.
3. The generator walks the contract template nodes (the same node kinds `src/gen/html.ts` handles) and applies the React column of section 2.4. Do not build the output by string-replacing the HTML.
4. Fill the slot: in `src/gen/index.ts` add `import { generateReactFiles } from "./react"` directly above the slot comment and change the slot body to `return generateReactFiles(context)`; delete the slot's `PLAN 4.4` comment.
5. Tests in `src/gen/react.test.ts` (inputs pasted as literals; extract them first as in M0-T14 step 2, and the expected outputs with the extractor from `docs/06-bindings.md` heading prefixes `### 6.4 ` and `### 6.5 `, language `tsx`, index 0):
   - `[T1] gen-react: Button output equals the printed file`
   - `[T1] gen-react: Stack output equals the printed file`
   - `[T1] gen-react: a hand-written file keeps everything outside the generated region`
   - `[T1] gen-react: missing markers are reported`
   Comparison is exact text. When the printed file and the output differ only in trailing whitespace, normalise trailing whitespace in the test and record it.

Acceptance: phase P3; `pnpm test:unit --files=src/gen/react.test.ts` reports 4 passed; `pnpm gen --check` exits 0 on the zero-component tree.

- **Out of scope:** `src/react/index.ts` (`useElement`, `useCart`, `useRegionHtml`; later milestone); hand-written interactive bindings (6.6, 6.7); JSX types (M0-T19).
- **If blocked:** the printed files are `tsx` blocks (`components/button/react/button.tsx`, `components/stack/react/stack.tsx`; the path is printed on the line above each block). See also the Copy-rule note under M0-T18 "If blocked". When a rule of 6.1 and the printed Button file disagree, the ledger decides; when the ledger is silent, match the printed file and report the disagreement.

## M0-T17 Generator `src/gen/remix.ts`

- **Goal:** Generate the Remix binding file of every component that `docs/06-bindings.md` marks as generated for Remix, including the host extras.
- **Depends on:** M0-T03, M0-T15.
- **Read first:** `docs/06-bindings.md` "## 5." (5.1, 5.2), "### 7.1 Rules", "### 7.3 Host extras, complete table", "### 7.4 Static pattern: Button (generated)", "### 7.5 Static pattern with responsive props: Stack (generated)"; `docs/07-manifest-registry-cli.md` "### 2.4" (Remix column), "### 3.2" row G6, "### 3.3".
- **Files (create):** `src/gen/remix.ts`, `src/gen/remix.test.ts`, done file. **Modify:** `src/gen/index.ts` (slot `g6Remix` only).

Steps:

1. Branch `task/M0-T17-gen-remix`.
2. Export `generateRemixFiles(context: GenContext): StepResult`, same shape and region handling as M0-T16 step 2, output path per section 3.2 row G6 (`components/<id>/remix/<id>.tsx`). Row G6 also makes the WHOLE Remix file generated for kind `native` or `ui` with a template (see step 4).
3. Apply every row of the host extras table 7.3 (for example `data-rmx-key`, `data-rmx-preserve-attrs`) exactly where the table says; never print `className` or an `on*` attribute (test Q-14 in M0-T35 checks it).
4. In M0 implement the static pattern (7.4, 7.5). Section 7.6 says interactive Remix bindings are generated too: implement that part only as far as the contract template drives it without component-specific code; where it needs more, leave `// PLAN 4.4: interactive Remix emission completed by M1-T17` and return a problem only when such a component exists.
5. Fill slot `g6Remix` as in M0-T16 step 4.
6. Tests in `src/gen/remix.test.ts` (expected outputs extracted from heading prefixes `### 7.4 ` and `### 7.5 `):
   - `[T1] gen-remix: Button output equals the printed file`
   - `[T1] gen-remix: Stack output equals the printed file`
   - `[T1] gen-remix: output has no className and no on* attribute`
   - `[T1] gen-remix: a hand-written file keeps everything outside the generated region`

Acceptance: phase P3; `pnpm test:unit --files=src/gen/remix.test.ts` reports 4 passed; `pnpm gen --check` exits 0.

- **Out of scope:** `src/remix/index.ts` (7.2); ProductForm (7.7); running Remix (needs Node 24.3).
- **If blocked:** same as M0-T16. The tests of this task do not import `remix` and therefore run on Node 22.

## M0-T18 Generator `src/gen/liquid.ts`

- **Goal:** Generate Liquid block and snippet files, the generated regions of hand-written Liquid files, and the locale outputs.
- **Depends on:** M0-T15.
- **Read first:** `docs/06-bindings.md` "### 8.1 Tiers", "### 8.2 Rules", "### 8.3 Anatomy of a block file", "### 8.4 Static pattern: Button" (prose and the first printed file; the section is long, stop after the block file), "### 8.5 Static pattern with responsive params: Stack"; `docs/07-manifest-registry-cli.md` "### 2.4" (Liquid column), "### 3.2" row G5, "### 3.3".
- **Files (create):** `src/gen/liquid.ts`, `src/gen/liquid.test.ts`, done file. **Modify:** `src/gen/index.ts` (slot `g5Liquid` only).

Steps:

1. Branch `task/M0-T18-gen-liquid`.
2. Export `generateLiquidFiles(context: GenContext): StepResult`. Output paths are those of section 3.2 row G5: `components/<id>/liquid/blocks/<id>.liquid`, `components/<id>/liquid/blocks/<id>-<part>.liquid`, `components/<id>/liquid/snippets/rp-<id>.liquid`, `components/<id>/liquid/locales/<id>.json`, `locales/core.json`, `locales/blueprint.<id>.json`. Which files a tier (`block`, `parts`, `resource`) has: section 8.1. Do not choose a path those two sections do not name; when they are silent for a case, add a problem and report it.
3. Emit by walking the contract template with the Liquid column of section 2.4 and rules L-1 to the last L rule of 8.2. The `attributes` param MUST NOT be able to override a contract attribute (test Q-20 in M0-T35). Read the "read first" paragraph of 8.3 on `{% doc %}`: the doc header is part of the printed file.
4. Locale outputs: derive the per-component and `core` locale files from `locales/en.default.json` (an INPUT of G1, never written by the generator) by rule 2 of doc 07 section 4.1, which row G5 cites; read that one rule. With zero components write only what the rule requires for `locales/core.json`; when the rule yields an empty object, write no file and record it.
5. In M0 implement tier `block` (8.4, 8.5). For tier `parts` (8.6) and `resource` generated regions leave `// PLAN 4.4: tier parts emission completed by M1-T17` and return a problem only when such a component exists.
6. Fill slot `g5Liquid` as in M0-T16 step 4.
7. Tests in `src/gen/liquid.test.ts`. Expected files, extracted with language `liquid`: heading prefix `### 8.4 ` index 0 is `components/button/liquid/snippets/rp-button.liquid`, index 1 is `components/button/liquid/blocks/button.liquid`; heading prefix `### 8.5 ` index 0 is `components/stack/liquid/blocks/stack.liquid` (the path is printed on the line above each block; check it):
   - `[T1] gen-liquid: Button snippet equals the printed file`
   - `[T1] gen-liquid: Button block equals the printed file`
   - `[T1] gen-liquid: Stack block equals the printed file`
   - `[T1] gen-liquid: locale files follow rule 2 of doc 07 section 4.1`
   - `[T1] gen-liquid: a hand-written file keeps everything outside the generated region`

Acceptance: phase P3; `pnpm test:unit --files=src/gen/liquid.test.ts` reports 5 passed; `pnpm gen --check` exits 0.

- **Out of scope:** `theme/` (never edit); `examples/liquid`; Theme Check (M0-T35); the shim.
- **If blocked:** each of 6.4, 7.4, 8.4 starts with a "Copy rule (D-069)" note listing props the printed code does not yet print. The printed file is the expected output for the pasted manifest entry of doc 07 section 1.7 only when that entry lacks those props; when the entry has them, compare after removing those props from the pasted entry and record it. Same rule for M0-T16 and M0-T17.

## M0-T19 Generator `src/gen/types.ts`

- **Goal:** Generate the shared type file and the JSX type files for React and Remix (step G7).
- **Depends on:** M0-T15. Order: after M0-T08 (it declares the hand-written types).
- **Read first:** `docs/07-manifest-registry-cli.md` "### 3.2" row G7; `docs/06-bindings.md` "### 6.3 JSX types for custom elements and Invoker attributes", "### 7.2 `<pkg>/remix`" (only the JSX types part).
- **Files (create):** `src/gen/types.ts`, `src/gen/types.test.ts`, generated and committed: `src/types.generated.ts`, `src/react/jsx.generated.ts`, `src/remix/jsx.generated.ts`, done file. **Modify:** `src/gen/index.ts` (slot `g7Types` only); `src/index.ts` (one export line, step 3); `src/architecture.test.ts` when its layout test rejects `src/types.generated.ts` (add the path to the allowed set with a comment citing doc 07 section 3.2 row G7).

Steps:

1. Branch `task/M0-T19-gen-types`.
2. Export `generateTypeFiles(context: GenContext): StepResult` producing the three files. `src/types.generated.ts` declares exactly the names row G7 lists: `Breakpoint`, `SpaceStep`, `Responsive<T>`, `ComponentId`, `IconName`, `RegionName`, `RuleId`. A union with zero members is emitted as `never`.
3. Row G7 says the file is "exported from `src/index.ts`". `Responsive` (hand-written in `src/types.ts`, doc 06 section 4) and `Breakpoint` (`src/responsive.ts`, doc 02 section 5.5) already exist since M0-T03, so `export *` would collide. Do this: in `src/index.ts` add `export type { SpaceStep, ComponentId, IconName, RegionName, RuleId } from "./types.generated"` and keep the two hand-written declarations. The generated `Breakpoint` and `Responsive<T>` MUST be textually the same types as the hand-written ones; the test of step 7 asserts assignability both ways. The triple declaration is reported as a spec problem.
4. JSX files: the text of sections 6.3 and 7.2, with the element list taken from `src/gen/elements.json` (complete since M0-T06).
5. First line of every generated file: the generated-file header that section 3.3 or row G7 states. When neither states one, use `// Generated by pnpm gen. Do not edit.` and record it.
6. Fill slot `g7Types`. Run `pnpm gen` and commit the three generated files.
7. Tests in `src/gen/types.test.ts`:
   - `[T1] gen-types: an empty manifest yields never for ComponentId`
   - `[T1] gen-types: jsx files declare every tag of elements.json`
   - `[T1] gen-types: generated Breakpoint and Responsive equal the hand-written types` (a type-level check: two assignments in each direction that `pnpm typecheck` compiles)

Acceptance: phase P3; `pnpm gen --check` exits 0 with the three files committed; `pnpm typecheck` exits 0.

- **Out of scope:** `.d.ts` emission for `pkg/` (M0-T28).
- **If blocked:** when `src/react/` or `src/remix/` does not exist yet (M0-T26 not done), the generator creates the directories; that is allowed.

## M0-T20 bindings-lint and fixture lint

- **Goal:** Add the source lint of binding files and the fixture lint, both run by generator step G8.
- **Depends on:** M0-T15; also M0-T05 and M0-T09 (rule RS-4 needs `src/testing/resources.ts`; check `docs/plan/done/M0-T09.md`).
- **Read first:** `docs/06-bindings.md` "### 1.1 Behaviour-free rules", "### 1.2 Source lint `bindings-lint`"; `docs/02-html-contract.md` "### 11.8 Fixture lint" and the rules F-10 to F-20 it cites (in 11.1 to 11.6).
- **Files (create):** `src/gen/bindings-lint.ts`, `src/gen/bindings-lint.test.ts`, `src/gen/fixture-lint.test.ts`, done file. **Modify:** `src/gen/index.ts` (slots `g8BindingsLint`, `g8FixtureLint`; `lintFixtures` lives in this file, section 0.5).

Steps:

1. Branch `task/M0-T20-lints`.
2. `src/gen/bindings-lint.ts` exports `lintBinding` (signature in section 0.5). One finding per violated row of the table in 1.2; `rule` is the row's id as the table prints it.
3. Slot `g8BindingsLint`: for every binding file of every component (`components/<id>/react/<id>.tsx`, `components/<id>/remix/<id>.tsx`, every file under `components/<id>/liquid/`) call `lintBinding`; each finding becomes the problem `<path>: <rule>: <message>`.
4. `lintFixtures(manifest)` in `src/gen/index.ts`: one check per check id of the table in 11.8 (ids as printed, `c-5` to `f-19`). Notes that 11.8 states and that are easy to miss: pe-2 is skipped on the root of Button and IconButton; `drop-attr` and `remove` entries are exempt from F-19; a `$resource` reference resolves through `resolveResource` of `src/testing/resources.ts` (RS-4). Slot `g8FixtureLint` returns its texts as problems.
5. Tests: `src/gen/bindings-lint.test.ts` has, per row of the table in 1.2, two tests `[T1] bindings-lint: <rule> rejects <short description>` and `[T1] bindings-lint: <rule> accepts <short description>`, each with a pasted sample of at most ten lines. `src/gen/fixture-lint.test.ts` has per check id one test `[T1] fixture-lint: <check id> reports <short description>` on a hand-built manifest object, plus `[T1] fixture-lint: a valid fixture has no finding`.

Acceptance: phase P3; `pnpm test:unit --grep="bindings-lint|fixture-lint"` has 0 failed and at least as many tests as (2 x rows of 1.2) + (check ids of 11.8) + 1; write the three numbers into the done file.

- **Out of scope:** CSS lint (M0-T24); checker rules (`src/check/`).
- **If blocked:** when a check of 11.8 needs data that exists only after a later task (for example a component's `.html` reference file), implement the check and test it on a hand-built object; do not skip it. This task is at the upper end of size M; when the context runs short, finish `bindings-lint` first, open the pull request with the fixture lint slot still carrying its `PLAN 4.4` comment, and report that the task needs a second session.

## M0-T21 Core CSS

- **Goal:** Add the three hand-written core style sheets.
- **Depends on:** M0-T02.
- **Read first:** `docs/03-styling-and-tokens.md` "## 1. Files", "### 2.1 The layer statement", "### 2.2 Who writes where", "### 4.2 Rules" (do not read the blocks of 3.3 and 4.1).
- **Files (create):** `css/layers.css`, `css/tokens.css`, `css/base.css`, done file.

Steps:

1. Branch `task/M0-T21-core-css`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `css/layers.css` | `docs/03-styling-and-tokens.md` | `### 2.1 ` | `css` | 0 | 112 | (the `@layer` statement; print the file and compare with section 2.1) |
| `css/tokens.css` | `docs/03-styling-and-tokens.md` | `### 3.3 ` | `css` | 0 | 7546 | `/* tokens.css` (line starts so) |
| `css/base.css` | `docs/03-styling-and-tokens.md` | `### 4.1 ` | `css` | 0 | 2872 | `/* base.css` (line starts so) |

2. Do not edit the three files. `css/base.css` contains marker regions that M0-T22 fills; leave them as extracted.
3. Check: `grep -c "PLAN 4.4" css/*.css` prints 0 for each file.

Acceptance: phase P2 (no test is added). `wc -c css/layers.css css/tokens.css css/base.css` prints 112, 7546, 2872.

- **Out of scope:** `css/props.css`, `css/theme.css` (generated; M0-T22, M0-T23); `css/styling.test.ts` (tests A-02 to A-22 of doc 03 section 15: NO M0 task owns that file; reported as a plan table error); component CSS.
- **If blocked:** a byte count that differs means the doc changed: stop and report.

## M0-T22 props-css and display-css

- **Goal:** Generate `css/props.css` and the marker regions of `css/base.css` (generator step G2).
- **Depends on:** M0-T15, M0-T21. Order: after M0-T23 when M0-T23 is already in review (both read `css/tokens.css`; `props-css.ts` imports `tokens-source.ts`, see step 2).
- **Read first:** `docs/03-styling-and-tokens.md` "### 4.3 Display values and the generator" (prose), "### 6.1 Grammar and attributes", "### 6.2 Generator rules", "### 6.4 Output shape" (do not read the block of 6.3).
- **Files (create):** `src/gen/props-css.ts`, `src/gen/display-css.ts`, `src/gen/props-css.test.ts`, `src/gen/display-css.test.ts`, generated and committed `css/props.css`, done file. **Modify:** `css/base.css` (regions, by `pnpm gen` only), `src/gen/index.ts` (slots `g2Props`, `g2Display`).

Steps:

1. Branch `task/M0-T22-gen-props-display`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `src/gen/props-css.ts` | `docs/03-styling-and-tokens.md` | `### 6.3 ` | `ts` | 0 | 4363 | (exports `propRules`, `generatePropsCss(tokensCss)`) |
| `src/gen/display-css.ts` | `docs/03-styling-and-tokens.md` | `### 4.3 ` | `ts` | 0 | 3468 | (exports `generateDisplayRegion`, `generateScriptStateRegion`, `replaceRegion`, `generateBaseCss(baseCss, elements)`) |

2. `props-css.ts` imports from `./tokens-source` (file of M0-T23). When `src/gen/tokens-source.ts` does not exist on `main`, extract it yourself with the row given in M0-T23 step 1 and say so in the pull request; M0-T23 then finds the identical file.
3. Slot `g2Props`: `files` gets `css/props.css` = `generatePropsCss(context.read("css/tokens.css"))`. Slot `g2Display`: `files` gets `css/base.css` = `generateBaseCss(context.read("css/base.css"), <the element table of src/gen/elements.json>)`. Pass the element data in the shape the extracted function's parameter type declares.
4. Run `pnpm gen`; commit `css/props.css` and the changed `css/base.css`. Run `pnpm gen` again: it MUST write nothing.
5. Tests:
   - `[T1] props-css: output has the shape of section 6.4` - the generated text contains every rule of the abbreviated block of 6.4 (extract it: heading prefix `### 6.4 `, `css`, index 0, 849 bytes; paste the rules it shows, skipping its elision lines).
   - `[T1] props-css: generation is deterministic`
   - `[T1] display-css: replaceRegion keeps text outside the markers`
   - `[T1] display-css: every element of elements.json gets its display value`

Acceptance: phase P3; `pnpm gen --check` exits 0; `pnpm test:unit --grep="props-css|display-css"` reports 4 passed.

- **Out of scope:** `css/theme.css` (M0-T23); `ripple.css` concatenation (M0-T28).
- **If blocked:** when `generateBaseCss` throws because a marker is missing in `css/base.css`, the extraction of M0-T21 is wrong: re-extract `css/base.css`, never add markers by hand.

## M0-T23 theme-css, tokens-source, CSS entry files

- **Goal:** Generate `css/theme.css` from `css/tokens.css` and provide the token reader used by other generator steps.
- **Depends on:** M0-T15, M0-T21.
- **Read first:** `docs/03-styling-and-tokens.md` "### 5.1 `theme.css`" (prose, not the blocks), "### 5.2 Entry files for projects with a CSS entry", "### 5.5 Tailwind is optional".
- **Files (create):** `src/gen/tokens-source.ts`, `src/gen/theme-css.ts`, `src/gen/theme-css.test.ts`, generated and committed `css/theme.css`, done file. **Modify:** `src/gen/index.ts` (slot `g2Theme`), `src/gen/registry.ts` (`scales`, step 4).

Steps:

1. Branch `task/M0-T23-gen-theme`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `src/gen/tokens-source.ts` | `docs/03-styling-and-tokens.md` | `### 5.1 ` | `ts` | 0 | 2540 | (exports `stripComments`, `readScales`, `readStaticDeclarations`) |
| `src/gen/theme-css.ts` | `docs/03-styling-and-tokens.md` | `### 5.1 ` | `ts` | 1 | 1416 | (exports `generateThemeCss(tokensCss)`) |
| `node_modules/.cache/ripple/theme.expected.css` | `docs/03-styling-and-tokens.md` | `### 5.1 ` | `css` | 0 | 4196 | (the expected `css/theme.css`) |

   When `src/gen/tokens-source.ts` already exists (M0-T22 step 2), run `git diff --exit-code src/gen/tokens-source.ts` after extraction; it MUST show no change.
2. Slot `g2Theme`: `files` gets `css/theme.css` = `generateThemeCss(context.read("css/tokens.css"))`.
3. Run `pnpm gen`; then `diff css/theme.css node_modules/.cache/ripple/theme.expected.css` MUST print nothing. Commit `css/theme.css`.
4. In `assembleManifest` (`src/gen/registry.ts`) set the manifest field `scales` from `readScales(<text of css/tokens.css>)` when doc 07 section 1.1 defines that field so (search `scales` in doc 07 section 1.1); when M0-T06 hard-coded it, replace the hard-coded value.
5. "CSS entry files" in the task title: section 5.2 describes files a PROJECT receives (written by the CLI's `init`, later milestone). No repository file is created for them in M0. Reported as a plan table problem.
6. Test in `src/gen/theme-css.test.ts`: `[T1] theme-css: output equals the file printed in section 5.1` (paste the expected text as a literal), `[T1] tokens-source: readScales returns the scales of tokens.css` (assert the scale names and step counts that "### 3.3" declares; read them from `css/tokens.css`, do not invent).

Acceptance: phase P3; `pnpm gen --check` exits 0; step 3 diff is empty; `pnpm test:unit --files=src/gen/theme-css.test.ts` reports 2 passed.

- **Out of scope:** Liquid CSS delivery (5.3); `browser/ripple.css` (5.4; M0-T28).
- **If blocked:** a non-empty diff in step 3 means generator and printed file disagree: report the diff; the printed `css/theme.css` is the expected text, so fix the generator.

## M0-T24 CSS linter

- **Goal:** Add the component CSS linter (rules CSS-01 to CSS-31 as listed) and wire it into step G8.
- **Depends on:** M0-T15, M0-T21.
- **Read first:** `docs/03-styling-and-tokens.md` "### 7.1 The styling contract", "### 7.2 File skeleton", "### 7.3 Rules", "### 7.9 The linter" (whole; not the 4.7 kB block of 7.4).
- **Files (create):** `src/gen/css-lint.ts`, `src/gen/css-lint.test.ts`, done file. **Modify:** `src/gen/index.ts` (slot `g8CssLint`).

Steps:

1. Branch `task/M0-T24-css-lint`. Extract the interfaces, then write the implementation below them in the same file:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `src/gen/css-lint.ts` | `docs/03-styling-and-tokens.md` | `### 7.9 ` | `ts` | 0 | 1099 | (declares `CssLintContext`, `CssLintFinding`, `lintComponentCss(css, context)`) |
| `node_modules/.cache/ripple/button.css` | `docs/03-styling-and-tokens.md` | `### 7.4 ` | `css` | 0 | 4713 | (the Button file; test input only) |

2. Implement `lintComponentCss` with the parser section 7.9 names (it states which pinned package parses CSS; use that one, add no dependency). One finding per violation; the `rule` value is the rule id of 7.3.
3. Slot `g8CssLint`: for every `components/<id>/<id>.css`, build the `CssLintContext` from the manifest entry as 7.9 describes and turn each finding into the problem `<path>: <rule>: <message>`.
4. Tests in `src/gen/css-lint.test.ts`, exactly the list of item 5 of section 7.9: the Button file with the context 7.9 gives has zero findings; one failing sample per rule CSS-01 to CSS-21, CSS-27, CSS-29, CSS-30, CSS-31; the fifteen `accepts L-<n>` tests; the quantity-input root class case; the cart-drawer composition case; the L-3, L-4 and L-15 restrictions. Name each `[T1] css-lint: <statement>` with the statement 7.9 gives. Paste the Button CSS into the test as a literal.

Acceptance: phase P3; `pnpm test:unit --files=src/gen/css-lint.test.ts` has 0 failed; the done file states the test count and that it equals the count required by item 5 of 7.9.

- **Out of scope:** `css/styling.test.ts`; fixing component CSS (none exists).
- **If blocked:** when 7.9 names no parser, tokenise by hand (comments, strings, braces, at-rules; no dependency) and report the silence. Rules whose check needs a browser are not linter rules; 7.9 lists which rules the linter owns.

## M0-T25 Runtime

- **Goal:** Add the five runtime modules that every browser file shares.
- **Depends on:** M0-T02.
- **Read first:** `docs/04-elements.md` "## 3. The runtime (`src/runtime/`)": the text before 3.1 and the prose (not the blocks) of 3.1 to 3.5.
- **Files (create):** `src/runtime/index.ts`, `src/runtime/loader.ts`, `src/runtime/commands-polyfill.ts`, `src/runtime/opener.ts`, `src/runtime/announcer.ts`, done file.

Steps:

1. Branch `task/M0-T25-runtime`. Extract (doc `docs/04-elements.md`, language `ts`, index 0 for every row):

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `src/runtime/index.ts` | `docs/04-elements.md` | `### 3.1 ` | `ts` | 0 | 1122 | (print and compare with 3.1) |
| `src/runtime/loader.ts` | `docs/04-elements.md` | `### 3.2 ` | `ts` | 0 | 1889 | (same) |
| `src/runtime/commands-polyfill.ts` | `docs/04-elements.md` | `### 3.3 ` | `ts` | 0 | 3940 | (same) |
| `src/runtime/opener.ts` | `docs/04-elements.md` | `### 3.4 ` | `ts` | 0 | 2104 | (same) |
| `src/runtime/announcer.ts` | `docs/04-elements.md` | `### 3.5 ` | `ts` | 0 | 1107 | (same) |

2. Run `pnpm typecheck`. The files use DOM types; `tsconfig.json` of M0-T01 already includes the `DOM` lib (doc 01 section 5.2). Fix only type errors.
3. Check: the page globals are `window.rpRuntime` and `window.rpCommandsPolyfill` exactly; `grep -n "rpRuntime\|rpCommandsPolyfill" src/runtime/*.ts` shows both.

Acceptance: phase P2 (no test added; behaviour tests of the runtime are the tier 3 and tier 5 tests listed in doc 04 section 13, owned by M1 tasks). M0-T04's import-rule test MUST still pass (`src/runtime/` imports only what `IMPORT_RULES` allows).

- **Out of scope:** any `rp-*` element; `src/elements/index.ts` (M0-T26).
- **If blocked:** when an import-rule test fails for an extracted file, report the rule and the import; do not edit `IMPORT_RULES`.

## M0-T26 Source entry points and stubs

- **Goal:** Add the source entry points of the browser files, with bring-up stubs for the modules later milestones write.
- **Depends on:** M0-T03, M0-T25.
- **Read first:** `docs/04-elements.md` "### 2.1 Rules", "### 4.1 Source entry points", "### 4.2 Browser files"; `docs/01-architecture.md` "### 6.4 Export map: what each entry is for".
- **Files (create):** `src/elements/index.ts`, `src/elements/ui-tabs.ts`, `src/elements/ui-tooltip.ts`, `src/elements/ui-toast.ts`, `src/agent/index.ts`, `src/commerce/index.ts`, `src/cli/index.ts`, `src/react/index.ts`, `src/remix/index.ts`, done file.

Steps:

1. Branch `task/M0-T26-entry-points`. Extract (doc `docs/04-elements.md`, heading prefix `### 4.1 `, language `ts`):

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `src/elements/index.ts` | `docs/04-elements.md` | `### 4.1 ` | `ts` | 0 | 1452 | (print and compare) |
| `src/elements/ui-tabs.ts` | `docs/04-elements.md` | `### 4.1 ` | `ts` | 1 | - | `import "@ui-sdk/web/tabs"` |
| `src/elements/ui-tooltip.ts` | `docs/04-elements.md` | `### 4.1 ` | `ts` | 2 | - | (the tooltip import) |
| `src/elements/ui-toast.ts` | `docs/04-elements.md` | `### 4.1 ` | `ts` | 3 | 63 | (the toast import) |
| `src/agent/index.ts` | `docs/04-elements.md` | `### 4.1 ` | `ts` | 4 | 75 | (the one-line agent entry) |

   The file name of each block is printed on the line above it in 4.1; when a name there differs from this table, 4.1 wins.
2. In `src/elements/index.ts` DELETE every line `import "./rp-<name>"` (four lines; the element files do not exist) and put in their place the single line `// PLAN 4.4: each rp-* element task adds its import "./rp-<name>" line here (docs/04-elements.md 4.1)`. Change nothing else.
3. Stubs. Each of `src/commerce/index.ts`, `src/react/index.ts`, `src/remix/index.ts` is exactly:

```ts
// PLAN 4.4: stub, replaced by <task>
export {}
```

   with `<task>` = `M1-T20` for commerce; for react and remix the first task of `docs/PLAN.md` that writes a file under `src/react/` / `src/remix/` (find it with `grep -n "src/react/\|src/remix/" docs/PLAN.md`; for React the candidates are M1-T11 and M1-T25: read their rows and name the one that creates `src/react/index.ts`).
4. `src/cli/index.ts` is a stub that MUST exit 0 for any arguments and print nothing (the CI job `package-node20` runs `node pkg/bin/ripple.mjs manifest`, doc 13 section 17.1): the same two lines, with `<task>` = `M6-T09`.
5. M0-T19 may already have created `src/react/jsx.generated.ts` and `src/remix/jsx.generated.ts`; leave them.

Acceptance: phase P2 or P3; `pnpm typecheck` exits 0; `grep -c "PLAN 4.4" src/elements/index.ts src/commerce/index.ts src/cli/index.ts src/react/index.ts src/remix/index.ts` prints 1 for each.

- **Out of scope:** `bin/ripple.mjs` (M0-T28); bundling (M0-T27); `useElement` and friends.
- **If blocked:** when `tsc` cannot resolve `@ui-sdk/web/tabs` types, check `node_modules/@ui-sdk/web/package.json` `exports` for the subpath; when it is absent there, stop and report (rule of 2.1: import only the modules the spec names).

## M0-T27 Browser bundles

- **Goal:** Add the Rollup build that writes the 12 browser files and the Liquid import rewrite.
- **Depends on:** M0-T26.
- **Read first:** `docs/04-elements.md` "### 6.1 Why Rollup and not esbuild", "### 6.3 How it works", "### 6.4 The call in `src/gen/build.ts`", "### 6.5 Requirements on the output", "### 4.2 Browser files" (the table of the 12 files).
- **Files (create):** `src/gen/browser-bundles.ts`, `src/gen/browser-bundles.test.ts`, done file.

Steps:

1. Branch `task/M0-T27-browser-bundles`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `src/gen/browser-bundles.ts` | `docs/04-elements.md` | `### 6.2 ` | `ts` | 0 | 6516 | (exports `buildBrowserBundles`, `BrowserBundleOptions`, `BundleSize`) |

2. Test `src/gen/browser-bundles.test.ts`: one test `[T1] browser-bundles: the 12 files of D-054 are written and the Liquid copies use bare specifiers`. It calls `buildBrowserBundles` with the options of the call printed in 6.4 (extract it for reference: heading prefix `### 6.4 `, `ts`, index 0, 524 bytes), with the output directory replaced by `fs.mkdtempSync(path.join(os.tmpdir(), "rp-bundles-"))`, and asserts: (a) the set of `.js` file names equals the 12 names of the table in 4.2; (b) requirement rows of 6.5 that can be checked by reading files (no `__PKG__` string; the Liquid rewrite produces the bare specifiers `ripple`, `ripple/tabs` and the others 6.3 lists).
3. The stubs of M0-T26 (`export {}`) are valid entries; a chunk built from a stub is an empty module. That is expected in M0.

Acceptance: phase P2 or P3; `pnpm test:unit --files=src/gen/browser-bundles.test.ts` reports 1 passed.

- **Out of scope:** calling it from the build (M0-T28); size checks (M0-T29).
- **If blocked:** when Rollup rejects an empty entry, do not add code to the stub; report the Rollup message. Fallback allowed: a stub body `export const __stub = true // PLAN 4.4` when and only when Rollup drops the empty chunk and (a) fails.

## M0-T28 Build pipeline

- **Goal:** Add `pnpm build`, which writes the complete `pkg/` tree in the 10 steps of the architecture document, with the bring-up skips of PLAN 4.4.
- **Depends on:** M0-T15, M0-T27 (and every other task of groups A to D that is done; the build must work with whatever exists).
- **Read first:** `docs/01-architecture.md` "### 6.1 Tree of `pkg/`", "### 6.2 Generated `pkg/package.json`" (prose; not the block), "## 7. Build pipeline" (whole), in "## 11. Acceptance tests" the rows A-05, A-06, A-11; `docs/03-styling-and-tokens.md` "### 5.4 The prebuilt `browser/ripple.css` and the measuring minifier"; `docs/PLAN.md` section 4.4.
- **Files (create):** `src/gen/build.ts`, `bin/ripple.mjs`, done file. **Modify:** `src/architecture.test.ts` (tests that need `pkg/`: A-05, A-06, A-11).

Steps:

1. Branch `task/M0-T28-build`.
2. `bin/ripple.mjs` (no M0 table row names it; M6-T09 owns the CLI entry and may replace it) is exactly two lines: `#!/usr/bin/env node` and `import "../dist/cli/index.mjs";`. Run `chmod +x bin/ripple.mjs`.
3. `src/gen/build.ts` runs the 10 steps of doc 01 section 7 in order, printing the step line that section prints for each. Bring-up rules (each marked `// PLAN 4.4: <what>, removed by M5-T14` unless another task is named):
   1. Step 2 (generator check): call `runGen(["--check"])` imported from `./index`, in-process; non-zero aborts the build with exit 1.
   2. Entry lists (TS entries, CSS files, component directories) are filtered to files that exist.
   3. A sub-step whose module does not exist yet (`src/gen/docs.ts`, the registry outputs of step 8, `custom-elements.json`, `html-custom-data.json`, `skills/`, `guides/`) prints `build: skipped <step name> (PLAN 4.4)` and continues. `pkg/manifest.json` and the three schema files ARE written (the modules exist since M0-T06).
   4. Browser files: the call printed in doc 04 section 6.4 (extract: `docs/04-elements.md`, `### 6.4 `, `ts`, index 0, 524 bytes) and paste it.
   5. `pkg/browser/ripple.css`: the concatenation doc 03 section 5.4 defines, over the CSS files that exist.
   6. Copy `bin/`, `css/`, `README.md`, `LICENSE` as section 6.1 shows.
   7. `pkg/package.json`: generate from the block of 6.2 (extract to `node_modules/.cache/ripple/pkg-package.json`: `docs/01-architecture.md`, `### 6.2 `, `json`, index 0, 2893 bytes, and embed it in `build.ts` as an object literal); `name` comes from the package identity (`src/identity.ts`; the environment variable `RIPPLE_PKG_NAME` overrides it, section 6.3) and the `__PKG__` replacement of step 7 uses the same name.
   8. Step 10 (self-checks): A-05 runs on a copy of `pkg/` under `os.tmpdir()`; its export-name assertions for entries that are stubs are skipped under a marker naming the task that replaces the stub. A-06 is relaxed to the files that exist. The `manifest.pins` check (A-11) compares with exactly `{ "@ui-sdk/core": "0.1.0-beta.14", "@ui-sdk/web": "0.1.0-beta.14", "@shopify/hydrogen": "2026.10.3" }`. The scan "no `__PKG__` in `pkg/`" is strict. The size check prints `build: skipped size check (PLAN 4.4)` with the marker `removed by M0-T29`.
4. Declarations (`.d.ts`): produce them the way section 7 states (it names the tool and the step). Do not add a dependency.
5. Add to `src/architecture.test.ts` the tests of doc 01 section 11 that need `pkg/` and can hold in M0: A-05, A-06, A-11, with the names that section prints. Each skips with the reason `pkg/ is missing; run pnpm build` when `pkg/package.json` does not exist (doc 13 rule T-5 style; the skip never happens under `pnpm ci`, which builds first).
6. `pkg/` and `dist/` are git-ignored (M0-T01). Do not commit them.

Acceptance: phase P4 (this task proves it): `pnpm build` exits 0 and its last line is the final line section 7 prints; `ls pkg/browser/*.js | wc -l` prints `12`; `node pkg/bin/ripple.mjs manifest; echo $?` prints `0`; `grep -rl "__PKG__" pkg | wc -l` prints `0`; `pnpm test --no-skips` exits 0; `git status --porcelain` lists no generated file.

- **Out of scope:** registry (M6-T01), docs generation, `size-budget.json` (M0-T29), examples (M0-T31), publishing.
- **If blocked:** this task is large (10 steps plus declarations plus three tests). When the context runs short: finish steps 1 to 9 of the pipeline and `pkg/package.json` first, open the pull request with step 10 printing `build: skipped self-checks (PLAN 4.4)` (marker `removed by M0-T28b`), and report that the M0 table needs a follow-up task before M0-T29. Never reorder the 10 steps.

## M0-T29 Size budgets

- **Goal:** Add the size budget file, the measuring module, its tests, and the build's size check.
- **Depends on:** M0-T28.
- **Read first:** `docs/13-testing.md` "## 15. Tier 10: size budgets": 15.1 prose, 15.2 prose, 15.3 (not the blocks).
- **Files (create):** `size-budget.json`, `src/gen/size.ts`, `src/gen/size.test.ts`, done file. **Modify:** `src/gen/build.ts` (replace the skipped size check).

Steps:

1. Branch `task/M0-T29-size`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `size-budget.json` | `docs/13-testing.md` | `### 15.1 ` | `json` | 0 | 2207 | `{` |
| `src/gen/size.ts` | `docs/13-testing.md` | `### 15.2 ` | `ts` | 0 | 4029 | (exports `measureSizes` among others) |

2. In `src/gen/build.ts` replace the line that prints `build: skipped size check (PLAN 4.4)` by the call section 15.3 describes; it writes `node_modules/.cache/ripple/report/size-report.json`. Delete that `PLAN 4.4` marker.
3. A budget whose file does not exist in M0 (a component CSS file, a chunk of a later milestone): `measureSizes` reports `missing`. Follow 15.3 on whether `missing` fails; when 15.3 makes it fail and the file cannot exist yet, treat `missing` as a pass only inside `if (BRINGUP_SUBSET)` (import from `./index`) with the marker `// PLAN 4.4: missing budgets fail again, removed by M5-T14`.
4. Tests in `src/gen/size.test.ts`, names exact:
   - `[T10] size: every budget of size-budget.json holds for pkg/`
   - `[T10] size: ledger budgets are not raised`
   - `[T10] size: measureSizes reports ok, over and missing`
   - `[T10] size: the median component CSS is at most 2500 bytes minified` (with zero components the list is empty: guard with `if (files.length === 0) return` and the marker `// PLAN 4.4: empty-list guard, removed by M5-T14`).

Acceptance: phase P4; `pnpm build && pnpm test:size --no-skips` ends with `4 passed, 0 failed, 0 skipped`; `test -f node_modules/.cache/ripple/report/size-report.json`.

- **Out of scope:** raising any budget (forbidden: the second test); tier 10 in CI wiring (M0-T44).
- **If blocked:** a budget that is exceeded by a UI SDK chunk at zero components is a real finding: report file, measured bytes and budget; do not edit `size-budget.json`.

## M0-T30 Browser support code

- **Goal:** Add the shared browser, fixture server, collection and in-page helpers that tiers 3, 5 and 6 use.
- **Depends on:** M0-T10, M0-T28.
- **Read first:** `docs/13-testing.md` "## 5. Browser support code": intro, 5.1 prose, "### 5.2 The fixture page" (whole), "### 5.3 `server.ts`" (whole), 5.4 prose, 5.5 prose.
- **Files (create):** `test/support/browser.ts`, `test/support/server.ts`, `test/support/collect.ts`, `test/support/in-page.ts`, `test/support/tailwind-entry.css`, `test/support/server.test.ts`, done file.

Steps:

1. Branch `task/M0-T30-browser-support`. Extract (doc `docs/13-testing.md`):

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `test/support/browser.ts` | `docs/13-testing.md` | `### 5.1 ` | `ts` | 0 | 2761 | `import { after } from "node:test"` |
| `test/support/collect.ts` | `docs/13-testing.md` | `### 5.4 ` | `ts` | 0 | 4600 | (print and compare) |
| `test/support/in-page.ts` | `docs/13-testing.md` | `### 5.5 ` | `ts` | 0 | 104 | `import { checkPattern } from "@ui-sdk/core/testing"` |
| `test/support/tailwind-entry.css` | `docs/13-testing.md` | `### 5.3 ` | `css` | 0 | 98 | `@import "../../pkg/browser/ripple.css";` |
| `node_modules/.cache/ripple/fixture-page.html` | `docs/13-testing.md` | `### 5.2 ` | `html` | 0 | 347 | `<!doctype html>` |

2. Write `test/support/server.ts` by hand (the spec prints no code). Exports exactly `getFixtureServer(): Promise<{ url: string }>` and `fixturePageUrl(id, options?)` with the signature printed in 5.3. Implement every row of the routes table of 5.3; every response has `cache-control: no-store`; port 0 on `127.0.0.1`; lazy start, closed in an `after()` hook the same way `getBrowser()` does it in `browser.ts`. The fixture page is the template of 5.2 (paste the extracted HTML as a string and fill its placeholders as 5.2 states). `/__test/fake-sa.js` serves `test/support/fake-sa.js`; that file arrives in M1-T24, so the route answers 404 until then (no marker needed: `test/` is not under `src/`, but add the comment `// file added by M1-T24`). `/__test/in-page.js` serves `node_modules/.cache/ripple/test/in-page.js`: build it on first request with esbuild (`bundle: true`, `format: "iife"`, `platform: "browser"`, entry `test/support/in-page.ts`) unless 5.5 states another way; when it does, follow 5.5. Path traversal guard: `normalize(...).replace(/^(\.\.[/\\])+/, "")`. Tailwind build: once per process, the command printed in 5.3.
3. Because no component exists, add `test/support/server.test.ts` so the server runs in M0 (tier tag T3; one browser-free test per route group, using `fetch`):
   - `[T3] fixture-server: unknown fixture is 404 and unknown path is 404`
   - `[T3] fixture-server: pkg files are served with the content type of the table`
   - `[T3] fixture-server: cart stand-ins answer as the routes table says` (GET, JSON POST, form POST with and without `Referer`, `GET /cart`)
   - `[T3] fixture-server: every response has cache-control no-store`
   - `[T3] browser: getBrowser launches chromium and a page evaluates 1 + 1 [chromium]` (line above it: `// [chromium]: launch check of the pinned browser`)
   Confirm with doc 13 section 2.4 that a file under `test/support/` may hold tests and that the tier tag is legal there; when the test-name test (`[T1] test-names`, section 18.3) rejects the location, move the file to `test/upgrade/support.test.ts`.

Acceptance: phase P4; `pnpm build && pnpm test:upgrade --no-skips` ends with `5 passed, 0 failed, 0 skipped`.

- **Out of scope:** `test/support/hosts/` (M0-T32 to M0-T34), `examples.ts` (M0-T31), `fake-sa.js` (M1-T24), running the Tailwind route (first used in M1).
- **If blocked:** when Chromium cannot launch on the machine, the last test fails: report the Playwright error text verbatim; never run `playwright install`. `collect.ts` is NOT RUN; its gate is M1-T01.

## M0-T31 Example skeletons

- **Goal:** Add the three example package skeletons with `build` and `start`, the Remix morph test routes, and `startExample`.
- **Depends on:** M0-T28.
- **Read first:** `docs/13-testing.md` "### 12.1 `test/support/examples.ts`" (whole), "### 9.2 `test/hydration/remix.test.ts`", in "### 7.4 React and Remix adapters" only the paragraph on work directories; `docs/01-architecture.md` section 5.1 rows for `react`, `react-dom`, `remix`, `@shopify/hydrogen` (versions).
- **Files (create):** `examples/html/package.json`, `examples/html/server.mjs`, `examples/react/package.json`, `examples/react/server.mjs`, `examples/remix/package.json`, `examples/remix/server.mjs`, `examples/.gitignore`, `test/support/examples.ts`, `test/support/examples.test.ts`, done file.

Steps:

1. Branch `task/M0-T31-example-skeletons`.
2. The spec fixes the contract of 12.1 but prints no skeleton content; the content below is plan-chosen and is REPLACED by the CLI-produced examples in M7. Each `package.json`: `"private": true`, `"type": "module"`, scripts `"build": "node -e \"\""` and `"start": "node server.mjs"`, dependency `"ripple-kit": "file:../../pkg"` (use the package name of `src/identity.ts` as the key when it differs), `"@shopify/hydrogen": "2026.10.3"`; `examples/react` adds `react` and `react-dom` at the exact version of doc 01 section 5.1; `examples/remix` adds `remix` at the exact version of doc 01 section 5.1. Exact versions only, no ranges.
3. Each `server.mjs`: `node:http` server on `127.0.0.1`, port `Number(process.env.PORT)`, `GET /` answers 200 with `<!doctype html><title>examples/<host></title>`; anything else 404.
4. `examples/remix/server.mjs` additionally: when `process.env.RIPPLE_TEST_ROUTES === "1"`, the routes `/__rp/morph/a?c=<component id>` and `/__rp/morph/b?c=<component id>` exist; otherwise 404 (item 6 of 12.1). In M0 no component exists and Remix rendering needs Node 24.3: the two routes answer 404 for an unknown component id and carry the comment `// replaced in M1-T01: render the component's default fixture with remix and a link to the other route (docs/13-testing.md 9.2)`.
5. `examples/.gitignore`: lines `node_modules/`, `.ripple-conformance/`, `pnpm-lock.yaml` is NOT ignored (commit each example's lockfile after step 7).
6. `test/support/examples.ts`: export `startExample(host)` implementing steps 1 to 6 of the function description in 12.1 literally (errors `RIPPLE_NETWORK is not 1` and the T-7 reason; build once per process; free port; spawn with `PORT` and `RIPPLE_TEST_ROUTES=1`; poll every 250 ms up to 60 s; `stop()` kills the process group; one `after()` hook).
7. Run `pnpm build && pnpm examples:install` (network needed). On Node below 24.3 `pnpm --dir examples/remix install` may fail on the `engines` field of `remix`; then see "If blocked".
8. `test/support/examples.test.ts`: `[T1] examples: startExample throws when RIPPLE_NETWORK is not 1` (delete the variable inside the test, restore after) and `[T1] examples: each example package has build and start scripts and exact versions`.

Acceptance: phase P5 (this task proves it): `pnpm ci` exits 0 (see section 0.1 for Node below 24.3); `PORT=4999 pnpm --dir examples/html start & sleep 2; curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4999/; kill %1` prints `200`.

- **Out of scope:** blueprint files, mock.shop data, real routes (`/products/<handle>` and the others of item 3: M7); `examples/liquid` (M7).
- **If blocked:** registry or network unavailable: mark `BLOCKED-ON-ENV`, commit everything except lockfiles, and report. `remix` install failing on Node 22: run the install with the environment's Node 24 when one exists (`ls ~/.nvm/versions/node 2>/dev/null`); otherwise report and leave the proof to the `verify` CI job. Never loosen a version pin.

## M0-T32 Tier 2 conformance, html adapter, acceptance coverage

- **Goal:** Add the tier 2 test file, the host adapter registry, the `html` adapter, and the acceptance-coverage test.
- **Depends on:** M0-T30.
- **Read first:** `docs/13-testing.md` "## 7." intro, 7.1 prose, 7.2 prose, "### 18.2 `test/conformance/acceptance-coverage.test.ts`"; `docs/06-bindings.md` "### 11.1 Common rules", "### 11.5 `html` adapter".
- **Files (create):** `test/conformance/conformance.test.ts`, `test/support/hosts/index.ts`, `test/support/hosts/html.ts`, `test/conformance/acceptance-coverage.test.ts`, done file.

Steps:

1. Branch `task/M0-T32-tier2-html`. Extract (doc `docs/13-testing.md`):

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `test/conformance/conformance.test.ts` | `docs/13-testing.md` | `### 7.1 ` | `ts` | 0 | 814 | (print and compare) |
| `test/support/hosts/index.ts` | `docs/13-testing.md` | `### 7.2 ` | `ts` | 0 | 1111 | (print and compare) |
| `test/support/hosts/html.ts` | `docs/13-testing.md` | `### 7.2 ` | `ts` | 1 | 1667 | (print and compare) |

2. `hosts/index.ts` imports the adapters `./liquid`, `./react`, `./remix` (M0-T33, M0-T34), which do not exist yet. Until they do, create each missing file as a three-line placeholder exporting the adapter name `index.ts` imports, with `unavailable: "adapter not written yet (M0-T33)"` (or `M0-T34`) and `render: async () => ""`, in the shape of the adapter interface `index.ts` declares. M0-T33 and M0-T34 overwrite them. List the placeholders in the pull request.
3. `test/conformance/acceptance-coverage.test.ts`: one test per component, named `[T1] <id>: every acceptance test of the spec is covered`, implementing 18.2: read `docs/components/<id>.md`, section `### Acceptance tests` (rule P-7 of `docs/PLAN.md`), and assert what 18.2 states about each listed test name. The loop is over `loadComponents()`; zero components give zero tests.
4. With zero tests in both files the runner must still exit 0 under `--tiers=2`; when `test/run.ts` exits 2 with "no test matched" for a tier that has files but no tests, do not change the runner: check that `pnpm test` (tiers 1,2,3,4,5,6,10 together) exits 0, which is what the gate needs.

Acceptance: phase P4 or P5; `pnpm typecheck` exits 0; `pnpm test --no-skips` exits 0.

- **Out of scope:** the other adapters; `hosts.test.ts` (M0-T35). Do not add a sample component.
- **If blocked:** all three extracted files are NOT RUN; they are first run by M1-T01. Type errors: smallest fix, recorded.

## M0-T33 Liquid host adapter

- **Goal:** Add the Liquid adapter that renders a fixture case through the generated block files and the shim.
- **Depends on:** M0-T13, M0-T18, M0-T32.
- **Read first:** `docs/13-testing.md` "### 7.3 Liquid adapter" (prose); `docs/06-bindings.md` "### 11.4 Liquid adapter".
- **Files (create or overwrite):** `test/support/hosts/liquid.ts`, done file. **Modify:** `src/testing/fixtures.test.ts` (one assertion).

Steps:

1. Branch `task/M0-T33-liquid-adapter`. Build the file from two blocks, in this order:

```bash
node node_modules/.cache/ripple/extract.mjs docs/13-testing.md '### 7.3 ' ts 0 node_modules/.cache/ripple/liquid-a.ts
node node_modules/.cache/ripple/extract.mjs docs/13-testing.md '### 7.3 ' ts 1 node_modules/.cache/ripple/liquid-b.ts
cat node_modules/.cache/ripple/liquid-a.ts node_modules/.cache/ripple/liquid-b.ts > test/support/hosts/liquid.ts
```

   Expected sizes 3238 and 1492 bytes. Block 0 defines `liquidCaseSource` and `renderLiquidCase`; block 1 defines `createLiquidRenderer`. Merge duplicate import lines by hand. When 7.3 says the two blocks belong to different files, follow 7.3 and record it.
2. The work directory constant MUST be `LIQUID_WORK_DIR = "node_modules/.cache/ripple/test/liquid-theme"`.
3. The export name MUST be the one `test/support/hosts/index.ts` imports.
4. In `src/testing/fixtures.test.ts`, test `[T1] fixtures: host-scoped props are skipped`: add the `liquidCaseSource` assertion that the `fixtures` row of doc 13 section 6.2 states (M0-T10 left it out). `src/` must not import from `test/` under the import rules: when M0-T04's rule rejects the import, put the assertion in a new test `[T1] fixtures: liquidCaseSource skips host-scoped props` in `test/liquid/shim.test.ts` instead and record it.

Acceptance: phase P4 or P5; `pnpm typecheck` and `pnpm test --no-skips` exit 0.

- **Out of scope:** Theme Check (M0-T35); `examples/liquid`.
- **If blocked:** NOT RUN code; gate is M1-T01. Only type fixes.

## M0-T34 React and Remix host adapters

- **Goal:** Add the shared TSX helper and the React and Remix adapters.
- **Depends on:** M0-T16, M0-T17, M0-T31, M0-T32.
- **Read first:** `docs/13-testing.md` "### 7.4 React and Remix adapters" (prose and the differences table; not the blocks); `docs/06-bindings.md` "### 11.2 React adapter", "### 11.3 Remix adapter".
- **Files (create or overwrite):** `test/support/hosts/tsx.ts`, `test/support/hosts/react.ts`, `test/support/hosts/remix.ts`, done file.

Steps:

1. Branch `task/M0-T34-tsx-adapters`. Extract (doc `docs/13-testing.md`):

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `test/support/hosts/tsx.ts` | `docs/13-testing.md` | `### 7.4 ` | `ts` | 0 | 3117 | (print and compare) |
| `test/support/hosts/react.ts` | `docs/13-testing.md` | `### 7.4 ` | `ts` | 1 | 2725 | (print and compare) |

2. `test/support/hosts/remix.ts`: copy `react.ts` and apply every row of the differences table of 7.4 (React value to Remix value), nothing else. The Remix adapter returns `unavailable` with the T-7 reason below Node 24.3 (the table or the prose of 7.4 states the exact text; use it).
3. Work directories: `examples/react/.ripple-conformance` and `examples/remix/.ripple-conformance` (git-ignored by M0-T31).
4. The React adapter returns `unavailable: "examples/react/node_modules is missing; run pnpm examples:install"` when that directory is absent (the text is in the extracted block; keep it).

Acceptance: phase P5; `pnpm typecheck` exits 0; `pnpm ci` exits 0.

- **Out of scope:** hydration tests (M0-T37, M0-T38); `hosts.test.ts`.
- **If blocked:** NOT RUN code; gate is M1-T01. When the differences table leaves a line of `react.ts` without a Remix counterpart, keep the line and report it.

## M0-T35 Per-host extras `test/conformance/hosts.test.ts`

- **Goal:** Add the nine per-host tier 2 tests (Q-7, Q-9, Q-12, Q-14, Q-19, Q-20, Q-22 and two structural ones).
- **Depends on:** M0-T33, M0-T34.
- **Read first:** `docs/13-testing.md` "### 7.5 Per-host extras" (whole table); `docs/06-bindings.md` "## 11." rules Q-7, Q-9, Q-12, Q-14, Q-19, Q-20, Q-22 (search each id); `docs/02-html-contract.md`: search `F-21` and `F-23`.
- **Files (create):** `test/conformance/hosts.test.ts`, done file.

Steps:

1. Branch `task/M0-T35-hosts-extras`.
2. One test per row of the table in 7.5, names exact:
   - `[T2] conformance: one test per case and host`
   - `[T2] html: reference files parse into the manifest fixture names in order`
   - `[T2] react: bindings type-check and every ts-expect-error is used`
   - `[T2] react: client render equals the reference for every case [chromium]`
   - `[T2] remix: bindings type-check and every ts-expect-error is used`
   - `[T2] remix: raw output carries data-rmx-key and data-rmx-preserve-attrs, no on* attribute, no className`
   - `[T2] liquid: Theme Check reports no error and no warning`
   - `[T2] liquid: attributes param cannot override contract attributes`
   - `[T2] liquid: Ripple block files number at most 150`
3. Skips exactly as the column "Skips when": rows 3 and 4 when `examples/react/node_modules` is missing; rows 5 and 6 by T-7; the others never.
4. Each assertion is the rule named in the column "Rule". Every test loops over components or files; with zero components each passes with zero iterations. Theme Check (Q-19) runs the pinned `@shopify/theme-check-node` (doc 01 section 5.1) on the Liquid work directory; with zero block files assert that the run reports zero offenses on the empty theme, or, when Theme Check rejects an empty directory, run it on a copy of `test/fixtures/theme-min/`.
5. The line above a `[chromium]` test MUST be the comment that states why (doc 13 section 2.4 rule on engine tags).

Acceptance: phase P5; `pnpm test:conformance` reports 9 tests, 0 failed (on Node below 24.3: 7 passed, 2 skipped with the T-7 reason; under `--no-skips` on Node 24: `9 passed, 0 failed, 0 skipped`).

- **Out of scope:** per-component conformance (that is `conformance.test.ts`).
- **If blocked:** Q-9 needs a client render in Chromium through the React adapter; with zero cases it must not launch a browser. When a rule's text cannot be asserted without a component, write the loop and leave the body complete; do not write `assert.ok(true)` placeholders.

## M0-T36 Tier 3 tests

- **Goal:** Add the generic upgrade-stability test and the bundle tests A-07, A-08, A-13.
- **Depends on:** M0-T11, M0-T30.
- **Read first:** `docs/13-testing.md` "## 8." intro, 8.1 prose, 8.2, 8.3; `docs/01-architecture.md` "## 11. Acceptance tests" rows A-07, A-08, A-13.
- **Files (create):** `test/upgrade/upgrade.test.ts`, `test/upgrade/bundles.test.ts`, done file.

Steps:

1. Branch `task/M0-T36-tier3`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `test/upgrade/upgrade.test.ts` | `docs/13-testing.md` | `### 8.1 ` | `ts` | 0 | 1883 | (print and compare) |

2. `test/upgrade/bundles.test.ts`: the three tests A-07, A-08, A-13 with the names and assertions doc 01 section 11 prints. They need the `default` fixtures of Tabs, Dialog and Toast, which do not exist in M0. Register each test only when its fixture exists:

```ts
const has = (id: string) => loadFixtures().some((c) => c.component.name === id && c.fixture.name === "default")
```

   (use the field names `loadFixtures()` really returns; read the return type in `src/testing/fixtures.ts`). A test that is not registered is not a skip, so `--no-skips` passes. Add above the block the comment `// Registered per fixture: tabs (M3), dialog (M1-T17), toast (M3). All three run from M3 on.`
3. Parts of A-07, A-08, A-13 that need only `pkg/browser/` files (file presence, import graph, no duplicate kernel) and no fixture: register them unconditionally when section 11 words them so.

Acceptance: phase P4 or P5; `pnpm build && pnpm test:upgrade --no-skips` exits 0 with at least the 5 tests of M0-T30.

- **Out of scope:** element tests `src/elements/<tag>.test.ts`; `pnpm gen --snapshot` (M3-T03).
- **If blocked:** `upgrade.test.ts` is NOT RUN as a file; its first gate is `[T3] <fixture>: zero unpermitted mutations at upgrade` in M1-T01.

## M0-T37 Tier 4 React hydration

- **Goal:** Add the generic React hydration test file and its allow-list.
- **Depends on:** M0-T34.
- **Read first:** `docs/13-testing.md` "### 9.1 `test/hydration/react.test.ts`" (whole); `docs/06-bindings.md` "### 11.2 React adapter": rule Q-10 and the `REACT_HYDRATION_ALLOW` text.
- **Files (create):** `test/hydration/react.test.ts`, `test/hydration/react-allow.ts`, done file.

Steps:

1. Branch `task/M0-T37-tier4-react`.
2. `test/hydration/react-allow.ts`: export `REACT_HYDRATION_ALLOW` with exactly the entries Q-10 lists (an `input` entry and a `textarea` entry); copy the entry text from doc 06.
3. `test/hydration/react.test.ts`: for every component of kind `native`, `ui` or `commerce` and each of its fixtures whose hosts include `react`, register the two tests

```text
[T4] <fixture id>: react hydrates with elements defined first
[T4] <fixture id>: react hydrates with hydrateRoot first
```

   implementing mechanics 1 to 6 of 9.1 literally (esbuild options, `<StrictMode>`, `window.__rpRecoverable`, the two orders, the `<Raw>` wrapper and the plain-text children rule, `installUpgradeRecorder` with the component's `upgradeAllow` plus `GLOBAL_UPGRADE_ALLOW`, the `textarea` filter). Pass condition: Q-10 items 1 to 3.
4. The test `[T4] react: useRegionHtml returns null during hydration and the HTML after the first publish` needs `useRegionHtml` (`src/react/index.ts` is a stub in M0) and the commerce runtime. Do NOT register it in M0. Leave in the file the comment `// [T4] react: useRegionHtml ... is added by the task that writes src/react/index.ts (docs/13-testing.md 9.1)` naming M1-T25 (`useCart` and `useRegionHtml`) and M4-T22 (SPIKE-10 part b, which verifies it).
5. Skip rule: when the React adapter is `unavailable`, each registered test skips with the adapter's reason.

Acceptance: phase P5; `pnpm typecheck` exits 0; `pnpm test:hydration; echo $?` - with zero tests the runner may exit 2 ("no test matched"); the gate command is `pnpm ci`, which exits 0.

- **Out of scope:** Q-10 items 4 to 6 (per component, `components/<id>/<id>.test.ts`).
- **If blocked:** NOT RUN; first gate is M1-T17 (first `native` component; Button is `static` and creates no hydration test). Report this: the Button pilot does not exercise this file.

## M0-T38 Tier 4 Remix morph

- **Goal:** Add the generic Remix morph test file.
- **Depends on:** M0-T34 (and M0-T31 for `startExample`).
- **Read first:** `docs/13-testing.md` "### 9.2 `test/hydration/remix.test.ts`", "### 12.1" function description of `startExample`; `docs/06-bindings.md` "### 11.3 Remix adapter": rule Q-15.
- **Files (create):** `test/hydration/remix.test.ts`, done file.

Steps:

1. Branch `task/M0-T38-tier4-remix`.
2. For every component of kind `native`, `ui` or `commerce` register `[T4] <component id>: remix morph keeps state, instance and listeners`. The test calls `startExample("remix")`, opens `/__rp/morph/a?c=<component id>`, follows the link to `/__rp/morph/b?c=<component id>`, and asserts the three properties Q-15 names (state, element instance identity, listeners) the way Q-15 states them.
3. Skips: an error `RIPPLE_NETWORK is not 1` from `startExample` becomes a skip with that reason (T-5); the T-7 reason below Node 24.3.
4. The test MUST NOT require a `<Frame>` and MUST NOT configure `reloadFrames` or `navigate` (9.2).

Acceptance: phase P5; `pnpm typecheck` exits 0; `pnpm ci` exits 0 (zero tests registered in M0).

- **Out of scope:** the real morph routes in `examples/remix` (M1; see M0-T31 step 4).
- **If blocked:** NOT RUN; first gate is M1-T17. Problem to keep in mind and report: `startExample` requires `RIPPLE_NETWORK=1`. The CI job `verify` sets it, but a local `pnpm ci` does not; once a `native` component exists, this test skips locally and `--no-skips` fails unless the developer exports `RIPPLE_NETWORK=1`. Do not change `startExample`; report.

## M0-T39 Tier 5 accessibility

- **Goal:** Add the automated WCAG scan, its exception list, and the three generic keyboard tests.
- **Depends on:** M0-T30.
- **Read first:** `docs/13-testing.md` "### 10.3 Automated WCAG scan" (prose), "### 10.4 Keyboard, focus visibility and target size" (whole), "### 10.5 Announcements".
- **Files (create):** `test/a11y/axe.test.ts`, `test/a11y/axe-exceptions.ts`, `test/a11y/keyboard.test.ts`, done file.

Steps:

1. Branch `task/M0-T39-tier5-a11y`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `test/a11y/axe.test.ts` | `docs/13-testing.md` | `### 10.3 ` | `ts` | 0 | 1524 | (print and compare) |
| `test/a11y/axe-exceptions.ts` | `docs/13-testing.md` | `### 10.3 ` | `ts` | 1 | 287 | (print and compare) |

2. Add to `test/a11y/axe.test.ts`, when the extracted block does not contain it, the test `[T1] axe-exceptions: every entry names an existing fixture and has a reason` (10.3 states it). A `[T1]` test in a file of other tiers is legal only when doc 13 section 2.4 allows mixed tiers in one file; when it does not, put the test in `test/a11y/axe-exceptions.test.ts`.
3. `test/a11y/keyboard.test.ts`: for every case of `loadFixtures()` that the `html` host renders, three tests with the names, procedures and pass conditions of the table in 10.4:
   - `[T5] <fixture id>: Tab visits each focusable element once, in document order`
   - `[T5] <fixture id>: every Tab stop shows a focus indicator`
   - `[T5] <fixture id>: interactive targets are at least 24 by 24 CSS px`
   Each loads `fixturePageUrl(id)` and awaits `settled` (exported by `test/support/collect.ts` or `browser.ts`; use the existing export, do not write a second one). The second test needs the "other element that carries the indicator" exception: read it from the manifest field the component spec's Accessibility section maps to; when no manifest field exists for it, implement only the main condition and report the silence.

Acceptance: phase P4 or P5; `pnpm typecheck` exits 0; `pnpm test --no-skips` exits 0 (one `[T1]` test passes with an empty exception list; the generic tests register zero).

- **Out of scope:** component behaviour tests (10.1, 10.2); announcements helper beyond what 10.5 asks of this task (10.5 describes a pattern for component tests; add no file for it).
- **If blocked:** NOT RUN; gate is M1-T01.

## M0-T40 Style snapshots

- **Goal:** Add the computed-style snapshot test.
- **Depends on:** M0-T30.
- **Read first:** `docs/13-testing.md` "## 14. Visual regression": 14.1, 14.2, 14.3 (whole; 14.4 not needed).
- **Files (create):** `test/visual/style.test.ts`, done file.

Steps:

1. Branch `task/M0-T40-style-snapshots`.
2. Per case one test `[T5] <fixture id>: style snapshot matches [chromium]`, with the line above it exactly `// [chromium]: computed colour serialisation differs between engines`. Procedure steps 1 to 3 of 14.3: collect the five states of 14.1 (keys `375-light`, `1280-light`, `1280-dark`, `1280-light-hover`, `1280-light-focus`) with the collector of `test/support/collect.ts` and `STYLE_PROPERTIES` (use the existing export; 14.1 names where it lives); with `process.env.RIPPLE_UPDATE_SNAPSHOTS === "1"` write the file and pass; otherwise a missing file fails with `missing style snapshot <path>; run pnpm test:visual --update and commit the file`; an existing file is compared with `assert.deepEqual(collected, JSON.parse(file))`.
3. File format of 14.2: `test/visual/snapshots/<component id>/<fixture name>.json`, UTF-8, LF, two-space indentation, one trailing newline, key order of 14.1.
4. One more test: `[T5] style-snapshots: no stale snapshot file [chromium]` (same comment line above it): every file under `test/visual/snapshots/` corresponds to a case; with `RIPPLE_UPDATE_SNAPSHOTS=1` stale files are deleted instead. With no `snapshots/` directory it passes.
5. `--update` and `--component=<id>` are runner options (M0-T02 maps `--update` to `RIPPLE_UPDATE_SNAPSHOTS=1`; check `test/run.ts`); do not parse arguments in the test file.

Acceptance: phase P4 or P5; `pnpm test:visual --no-skips` ends with `1 passed, 0 failed, 0 skipped`.

- **Out of scope:** screenshots (14.4); committing any snapshot (none exists in M0).
- **If blocked:** when the stale-file test launches no browser, the `[chromium]` tag is still required by 14.3; keep it.

## M0-T41 Tier 6 no-JS render

- **Goal:** Add the generic test that renders every case with scripts disabled and with scripts blocked.
- **Depends on:** M0-T30.
- **Read first:** `docs/13-testing.md` "### 11.1 `test/nojs/render.test.ts`" (prose).
- **Files (create):** `test/nojs/render.test.ts`, done file.

Steps:

1. Branch `task/M0-T41-tier6`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `test/nojs/render.test.ts` | `docs/13-testing.md` | `### 11.1 ` | `ts` | 0 | 1656 | (print and compare) |

2. `pnpm typecheck`; fix only type errors.

Acceptance: phase P4 or P5; `pnpm typecheck` and `pnpm test --no-skips` exit 0.

- **Out of scope:** flows (11.2), cross-engine (11.3).
- **If blocked:** NOT RUN as a file; gate is M1-T01.

## M0-T42 Checker core

- **Goal:** Add the checker API, the engine for layers S and H, the text and JSON reports, and the `fix` computation, with an empty rule list.
- **Depends on:** M0-T10.
- **Read first:** `docs/07-manifest-registry-cli.md` "### 9.1 Layers", "### 9.3 API and rule modules" (prose; the block is extracted), "### 9.4 Output" (9.4.1, 9.4.2), "#### 9.5.1 Computing `fix`"; `docs/08-agent-kit-and-evals.md` "### 5.3 How `fix` is computed" (the task table omits it; `FIX_SYNONYMS` is defined there).
- **Files (create):** `src/check/index.ts`, `src/check/engine.ts`, `src/check/report.ts`, `src/check/rules/index.ts`, `src/check/types.ts` (only when 9.3 names a file for the types; otherwise the types live in `src/check/index.ts`), `src/check/check.test.ts`, done file.

Steps:

1. Branch `task/M0-T42-checker-core`. Extract the types and API:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `node_modules/.cache/ripple/check-types.ts` | `docs/07-manifest-registry-cli.md` | `### 9.3 ` | `ts` | 0 | 3218 | `export type Layer = "S" \| "H" \| "P" \| "B"` |

   Place the text in the file 9.3 names for it.
2. `src/check/index.ts` exports exactly `check`, `formatText`, `rules`, and the types of step 1; nothing else.
3. `src/check/rules/index.ts`: `export const rules: Rule[] = []` (use the rule type name of 9.3). A rule that is not implemented MUST be absent (9.7).
4. `src/check/engine.ts`: file discovery, layer S (source) and layer H (HTML) dispatch as 9.1 and 9.3 state; layers P and B are rejected with the message 9.3 or 9.2 states, or, when neither states one, are simply not run (record it). An exception thrown by a rule becomes the internal diagnostic `RP000` as 9.3 states.
5. `src/check/report.ts`: `formatText` (9.4.1), the JSON shape (9.4.2), the `fix` computation (9.5.1) and `FIX_SYNONYMS` exactly as doc 08 section 5.3 lists them; `RuleText` type as doc 08 section 5.5 declares it.
6. Tests in `src/check/check.test.ts`, with a test-only rule object defined in the test:
   - `[T1] check: no rules and no files gives no diagnostics and exit status ok`
   - `[T1] check: a rule's diagnostics are reported in file, line, column order`
   - `[T1] check: formatText prints the text format of 9.4.1` (expected text copied from the example in 9.4.1)
   - `[T1] check: the JSON report has the keys of 9.4.2`
   - `[T1] check: fix uses the closest allowed value and the synonym table` (cases from 9.5.1 and doc 08 section 5.3)
   - `[T1] check: a throwing rule is reported as RP000`

Acceptance: the phase in force; `pnpm test:unit --files=src/check/check.test.ts` reports 6 passed; M0-T04's import-rule test still passes for `src/check/`.

- **Out of scope:** the CLI command `ripple check` (9.2); the Liquid tokeniser (9.5.2); every rule; layers P and B.
- **If blocked:** when 9.3 and doc 08 section 5.3 disagree on `fix`, the ledger decides; when the ledger is silent, doc 07 owns the checker (follow 9.5.1) and report.

## M0-T43 Checker rule RP113

- **Goal:** Add rule RP113 with the structure rule kinds and `CUSTOM_RULES`.
- **Depends on:** M0-T42.
- **Read first:** `docs/07-manifest-registry-cli.md` "#### 9.5.3 Structure rules", in "### 9.6" the row RP113, the last paragraph of "### 9.7" (test convention); `docs/00-decisions.md` D-111; `docs/08-agent-kit-and-evals.md` "### 5.5 Rule registry" row RP113.
- **Files (create):** `src/check/rules/RP113.ts`, `src/check/rules/RP113.test.ts`, done file. **Modify:** `src/check/rules/index.ts` (add RP113).

Steps:

1. Branch `task/M0-T43-rp113`.
2. `src/check/rules/RP113.ts` exports the two exports every rule file has: `meta` (9.3) and `text` (the `RuleText` of doc 08 section 5.5; copy the RP113 row's texts verbatim), the rule object in the shape of 9.3, and `CUSTOM_RULES` (D-111 and 9.5.3 state its type and its entries; with zero components in M0 include only the entries those two places list).
3. Implement every structure rule kind of the table in 9.5.3. The rule reads `rules[]` of each component from the manifest passed to `check`.
4. Add the rule to the array in `src/check/rules/index.ts`.
5. Tests in `src/check/rules/RP113.test.ts` (convention of 9.7: at least one failing input that yields exactly one diagnostic with id `RP113`, one passing input that yields none). Per rule kind of 9.5.3 one pair, named `[T1] RP113: <kind> reports <statement>` and `[T1] RP113: <kind> accepts <statement>`, on a hand-built manifest with one made-up component object defined in the test (not a file under `components/`).

Acceptance: the phase in force; `pnpm test:unit --files=src/check/rules/RP113.test.ts` has 0 failed and 2 tests per rule kind of 9.5.3.

- **Out of scope:** RP110 to RP112, RP114 to RP118 (M2-T30); docs page generation for rules.
- **If blocked:** a `CUSTOM_RULES` entry that refers to a component which does not exist yet is still listed (the table is data); its function body may throw `new Error("PLAN 4.4: implemented by <component task>")` only when D-111 assigns the body to that component's task.

## M0-T44 CI workflows

- **Goal:** Add the two GitHub Actions workflows.
- **Depends on:** M0-T28.
- **Read first:** `docs/13-testing.md` "## 17. CI": intro, "### 17.2 What each job gates", "### 17.3" (not the YAML blocks).
- **Files (create):** `.github/workflows/ci.yml`, `.github/workflows/nightly.yml`, done file.

Steps:

1. Branch `task/M0-T44-ci`. Extract:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `.github/workflows/ci.yml` | `docs/13-testing.md` | `### 17.1 ` | `yaml` | 0 | 3649 | `name: ci` |
| `.github/workflows/nightly.yml` | `docs/13-testing.md` | `### 17.4 ` | `yaml` | 0 | 1484 | `name: nightly` |

2. Do not edit either file. The files MUST be byte-equal to the blocks.
3. Syntax check: `node -e "const y=require('yaml');for(const f of ['.github/workflows/ci.yml','.github/workflows/nightly.yml'])y.parse(require('fs').readFileSync(f,'utf8'))"` exits 0 when the package `yaml` is installed (it is a transitive dependency; when `require` fails, skip this step and say so).

Acceptance: the phase in force; after pushing the branch, read the result of the workflow run of the pull request. Expected: every step of the job `verify` up to and including `pnpm ci` (or the steps it is split into) is green. Known conflict, to be written into the pull request and NOT fixed here: (a) `verify` itself has the step `pnpm test:commerce --no-skips`; when the runner exits 2 ("no test matched") for a tier with no test file, that step is red until M7 writes `test/commerce/e2e.test.ts`, so `verify` cannot be green in M0 although the gate row M0 demands it (reported as a plan table error; the coordinator decides, see "If blocked"); (b) the job `package-node20` runs `node pkg/bin/ripple.mjs manifest` against the CLI stub and passes only because the stub exits 0.

- **Out of scope:** the `evals` job (doc 08); branch protection settings.
- **If blocked:** when `verify` is red because of a job step that cannot pass with zero components, do NOT edit the YAML (D-113: the workflow is the gate). Report the step and its output; the coordinator decides.

## M0-T45 M0 gate

- **Goal:** Prove the M0 gate row of `docs/PLAN.md` section 4.2 on `main` and record the result.
- **Depends on:** M0-T01 to M0-T44 (every `docs/plan/done/M0-T<nn>.md` exists).
- **Read first:** `docs/PLAN.md` section 4.2 (row M0), section 4.4, section 3.1.
- **Files (create):** `docs/plan/done/M0-T45.md`. No source change.

Steps:

1. `ls docs/plan/done/ | grep -c "^M0-T"` MUST print `44` before this task writes its own file.
2. On a clean checkout of `main` (`git status --porcelain` empty; `git clean -xdn` reviewed), run in order and record each exit code:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm gen --check
pnpm build
pnpm examples:install
pnpm test
```

   All six MUST exit 0. `pnpm test` is run WITHOUT `--no-skips` here, as the gate row words it; record the last line and every skip line with its reason.
3. `ls pkg/browser/*.js | wc -l` MUST print `12`, and the names MUST equal the 12 names of D-054 (`docs/00-decisions.md`; the same list is the table of `docs/04-elements.md` section 4.2).
4. `ls components 2>/dev/null | wc -l` MUST print `0` (zero components).
5. The latest run of the workflow `ci` on `main`: job `verify` MUST be green. Record the run URL. `ripple check` is not required. When the only red step of `verify` is `pnpm test:commerce --no-skips` with the runner message for "no test matched" (see M0-T44), the gate is NOT passed by this task's authority: record the step output and ask the coordinator for a written decision; create the done file only with that decision quoted in it.
6. List every `PLAN 4.4` marker: `grep -rn "PLAN 4.4" src bin test | sort`. Copy the list into the done file with the removing task of each; a marker without a removing task is a defect: open a fix task request, do not delete the marker.
7. Write `docs/plan/done/M0-T45.md` with: the six exit codes, the last line of `pnpm test`, the 12 file names, the CI run URL, the marker list, and the list "NOT RUN harness files first exercised by M1-T01 / M1-T17" (from section 0.7 and the tasks M0-T32 to M0-T41).

Acceptance: the done file exists and contains the seven items; every command of step 2 exited 0; step 5 is green.

- **Out of scope:** fixing a failure (each failure goes back to the task that owns the file; the gate task changes no source).
- **If blocked:** any non-zero exit or a red `verify`: the gate is NOT passed. Write the failing command and its last 30 output lines into a report; do not create the done file.
