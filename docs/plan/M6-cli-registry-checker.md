# M6 Registry, CLI, checker: task detail

Status: detail file for the 35 rows of milestone M6 in `docs/PLAN.md` section 6. `docs/00-decisions.md` (the ledger) wins over every spec; a spec wins over this file. This file adds no public API. Where it fixes a choice the specs leave open, the choice is marked "Plan reading" and listed in section 0.9.

How to use: read `AGENTS.md`, `docs/CONVENTIONS.md`, `docs/PLAN.md` sections 1 to 3 and 5.0, then section 0 of this file (about 25 kB), then ONLY your task's section `## <task id>`. Do not read other task sections and do not read the other `docs/plan/M*.md` files: every rule you need from them is restated in section 0.

Contents: 0 Rules for every M6 task. Then M6-T01 to M6-T35 in table order.

---

## 0. Rules for every M6 task

### 0.1 Finding what to read

- **M6-R1** Spec files are large and are edited between sessions. Never use a line number. Find a section by searching for its heading text exactly as this file prints it (for example search `### 7.4 ` in `docs/07-manifest-registry-cli.md`) and read up to the next heading of the same or a higher level.
- **M6-R2** "Read first" lists are complete. Sizes are approximate. Read nothing else unless a failing command names another file. "doc 07" is `docs/07-manifest-registry-cli.md`; "doc 08" is `docs/08-agent-kit-and-evals.md`; "doc 14" is `docs/14-liquid-theme.md`; "doc 01" is `docs/01-architecture.md`; "doc 13" is `docs/13-testing.md`; "doc 03" is `docs/03-styling-and-tokens.md`.
- **M6-R3** A code block that doc 07 prints "complete" is the required starting text (D-113). Extract it with the extractor (0.3); do not retype it and do not read it into your context. Change it only where a named test fails, and then change the code, never the test. List every change in the pull request under "Deviations".

### 0.2 Values every M6 task uses

| Thing | Value | Source |
|---|---|---|
| Package placeholder | `ripple-kit`, read only from `PKG_NAME` in `src/identity.ts`; the binary is `ripple` (`BIN_NAME`); the version is `VERSION` (`0.1.0`) | CONVENTIONS, D-052 |
| Hosts | `html`, `react`, `remix`, `liquid`; "npm hosts" are the first three | doc 07 section 4.4 |
| Exit codes | `0` success, `1` findings or conflicts, `2` usage or environment error | doc 07 section 7.1 rule 6 |
| Streams | results, plans and JSON to standard output; `error:`, `warning:`, `note:` lines to standard error | doc 07 section 7.1 rules 4 and 5 |
| Error format | `error: <one sentence>` and, when a fix is known, a second line `fix: <one command or one sentence>` | doc 07 section 7.1 rule 5 |
| Test tier | every test of this milestone is `[T1]` (no `pkg/`, no browser, no network), except the layer B tests of M6-T32 and M6-T33, which are `[T5]` | doc 13 section 6.2 |
| Test name | `[T1] <subject>: <statement>`; `<subject>` is the source module name without extension (`trailer`, `plan`, `init`, `RP401`); flat `test()` from `node:test`; `node:assert/strict`; no `describe` | doc 13 section 2.4 |
| Test files | next to the source: `src/cli/<name>.test.ts`, `src/cli/commands/<command>.test.ts`, `src/gen/<name>.test.ts`, `src/check/<name>.test.ts`, `src/check/rules/<RULE>.test.ts` | doc 13 section 3.1 last line |
| Temporary directories | `mkdtempSync(join(tmpdir(), "ripple-"))` inside a test, removed in `finally`; never write under the repository | doc 13 W-5, W-6 |
| Bring-up mode | until M5-T14 the constant `BRINGUP_SUBSET` is `true`; the repository holds a subset of the 84 components and no blueprint before M7. Every M6 module MUST work with any subset and with zero blueprints | PLAN 4.4 |
| Proof commands | `pnpm typecheck && pnpm gen --check && pnpm build && pnpm examples:install && pnpm test --no-skips` (`pnpm ci`); while working: `pnpm test:unit --files=<path prefix>` | PLAN 5.0 |
| Node in a session | Node 24.22.3; the install steps and the fallback are the text below this table | ledger D-136; `docs/PLAN.md` section 3.1 |
| `ripple-kit` in test files | never as a literal: test A-04 searches every `src/**/*.ts` except `src/architecture.test.ts` (D-134 item 11), test files included. Build an expected value from `PKG_NAME` and `VERSION` of `src/identity.ts`, for example `` `npx ${PKG_NAME}@${VERSION}` `` | doc 01 `### 6.3 ` rule 1, row A-04 |

Node in a task session (ledger D-136, `docs/PLAN.md` section 3.1):

> Node 24 (ledger D-136, `docs/PLAN.md` section 3.1). `pnpm test --no-skips` needs Node 24.3 or later, because Remix needs it (rule T-7). Install once per machine, and repeat the two `export` lines in every new shell:
>
> ```bash
> export PNPM_HOME="$HOME/.local/share/pnpm"
> export PATH="$PNPM_HOME:$PATH"
> pnpm env use --global 24.22.3
> node --version   # prints v24.22.3
> ```
>
> When that install fails, run each `--no-skips` command without `--no-skips`, check that every skip reason starts with `Remix needs Node 24.3 or later`, list the skip lines in the pull request; the `verify` CI job (Node 24) is the proof.

Export `RIPPLE_NETWORK=1` before `pnpm ci`: the Remix morph tests start the npm example `examples/remix` with `startExample` and skip otherwise (doc 13 rule T-5). Without network access, run without `--no-skips`, list the skips (reason `RIPPLE_NETWORK is not 1`), and `verify` is the proof.

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

Usage: `node node_modules/.cache/ripple/extract.mjs <doc file> '<heading prefix>' <language> <index> <output path>`. An extraction is written in this file as a table row:

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|

"Bytes" is the number the script prints: `e - s + 1`, the JavaScript string length of the block in UTF-16 code units plus 1 for the trailing newline. It is NOT the output of `wc -c` (the two differ when the block has non-ASCII characters); compare a size with the number the extractor prints, or compare files with `cmp`. "First line" is the first line of the output. Both were re-checked on 2026-11-22 against the current docs. When either differs, the doc changed: stop and report; do not guess another block. The extractor finds only code fences that start at column 0.

### 0.4 What exists before M6 and what each task replaces

| Thing | State before M6 | Replaced by |
|---|---|---|
| `src/cli/index.ts` | stub: exits 0 for any arguments, prints nothing; carries a `PLAN 4.4` comment naming M6-T09 | M6-T09 |
| `bin/ripple.mjs` | two lines: `#!/usr/bin/env node` and `import "../dist/cli/index.mjs";`. MUST NOT change (doc 01 section 4.2) | nobody |
| `src/gen/registry.ts` | holds `MANIFEST_VERSION`, `PREFIX`, `HOSTS`, `validateSchema`, `loadSources`, `assembleManifest`, `checkManifest`, `LEDGER_COMPONENTS`. The registry half of MB-15 is skipped under a comment `PLAN 4.4: registry part of MB-15 is M6-T01` | M6-T01 adds to it |
| `src/gen/build.ts` step 8 | writes `pkg/manifest.json` and the schema files that exist; prints `build: skipped <step> (PLAN 4.4)` for the registry outputs, `custom-elements.json`, `html-custom-data.json`, `docs/`, `skills/`, `guides/` | M6-T01 (registry, the two JSON files), M6-T14 (docs); `skills/` and `guides/` stay skipped until M8 creates the directories |
| `pkg/registry/liquid/assets/*.js` | written by build step 7 (six files) since M0 | unchanged |
| `src/check/{index,engine,report}.ts`, `src/check/rules/RP113.ts`, `src/check/rules/index.ts` | engine for layers S and H; layers P and B do not run | M6-T31 (layer P driver), M6-T32 (layer B driver) |
| Rule files RP101 to RP105, RP110 to RP118, RP201 to RP204 (M2), RP301 to RP309, RP320, RP321 (M4) | exist when those tasks are done; M6 rule tasks do not depend on them except the gate | - |
| `src/gen/props-css.ts` (`generatePropsCss(tokensCss)`), `src/gen/theme-css.ts` (`generateThemeCss(tokensCss)`), `src/gen/tokens-source.ts` (`readScales(tokensCss)`) | exist since M0 | - |
| `components/<id>/liquid/locales/<id>.json`, `locales/core.json`, `locales/blueprint.<id>.json` | generated and committed by step G5 since M0 (`core.json` may be absent while it would be empty) | M6-T05 completes `core.json` |
| `test/fixtures/theme-min/` | exists: `layout/theme.liquid` (with a `{{ content_for_header }}` line), empty `templates/`, `config/settings_schema.json` holding `[]`, `locales/en.default.json` holding `{}` | - |

A bring-up line in source carries a comment containing `PLAN 4.4` and the task that removes it. The task that adds the real code deletes the line and its marker.

### 0.5 Names chosen by this plan (the specs are silent)

Separate sessions must agree on these. Each is PLAN-CHOSEN and internal (none is a package export). When a spec section you read names the same thing differently, the spec wins; use its name and record it in the done file.

| Identifier | File | Signature and meaning | Created by |
|---|---|---|---|
| `InstallMode`, `RegistryFile`, `RegistryIndex` | `src/types.ts` (type-only), re-exported by `src/gen/registry.ts` with `export type { ... } from "../types.ts"` | the three types of doc 07 section 4.2, unchanged. They live in `src/types.ts` because `src/cli/**` may not import `src/gen/registry.ts` (PR-M6-2) | M6-T01 |
| `REGISTRY_VERSION` | `src/gen/registry.ts` (value `1`) and, separately, `src/cli/base.ts` (value `1`) | the `registryVersion` written, and the highest one the CLI reads | M6-T01, M6-T19 |
| `CORE_FILES` | `src/gen/registry.ts` | spec name (doc 07 section 4.4): `Record<Host, RegistryFile[]>` | M6-T03 |
| `buildRegistry` | `src/gen/registry.ts` | spec name and signature (doc 07 section 10.2): `(pkgDir: string) => void` | M6-T01 |
| `buildRegistryIndex` | `src/gen/registry.ts` | `(manifest: Manifest, options: { skills: RegistryIndex["skills"]; localeOwners: string[] }) => RegistryIndex`; pure; step G9. `localeOwners` lists the owners (`<id>`, `core`, `blueprint.<id>`) that have a generated locale file | M6-T01 |
| `CliIo` | `src/cli/index.ts` | `{ cwd: string; packageRoot: string; env: Record<string, string \| undefined>; out(line: string): void; err(line: string): void }`. `out` and `err` receive one line without the trailing newline | M6-T09 |
| `main` | `src/cli/index.ts` | `(argv: string[], io?: Partial<CliIo>) => Promise<number>`; returns the exit code; never calls `process.exit` | M6-T09 |
| `getPackageRoot` | `src/cli/index.ts` | spec name (doc 07 section 7.1 rule 10): `() => string` | M6-T09 |
| `commandForm`, `detectPackageManager` | `src/cli/index.ts` | `commandForm(io: CliIo, host: Host \| null) => string` returns the prefix of doc 07 section 7.1 rule 12 without a trailing space (`npx <PKG_NAME>@<VERSION>`, `pnpm exec ripple`, `npx ripple`); `detectPackageManager(cwd, env) => "npm" \| "pnpm" \| "yarn" \| "bun"` | M6-T09 |
| `CommandRun` and the export `run` | each `src/cli/commands/<command>.ts` | `export const run: CommandRun`, where `type CommandRun = (args: string[], io: CliIo, globals: { host?: string }) => Promise<number>`; `args` is the argument list after the command name with the global options removed | M6-T09 (type), each command task |
| `scanProject`, `ScannedFile` | `src/cli/plan.ts` | spec name (doc 07 section 5.2): `(root: string, host: Host) => ScannedFile[]`; `ScannedFile` is `{ path: string; id: string; pkg: string; version: string; hash: string; modified: boolean }` | M6-T06 (M6-T10 adds the Liquid composite regions) |
| `installTransform`, `TransformContext` | `src/cli/plan.ts` | spec (doc 07 section 4.6) | M6-T02 |
| `planFile`, `Action`, `PlanOptions`, `FilePlan` | `src/cli/plan.ts` | spec (doc 07 section 8.1) | M6-T10 |
| `PlanEntry` | `src/cli/plan.ts` | `{ action: Action \| "regenerate" \| "patch" \| "patch-skipped" \| "patch-failed"; path: string; id: string \| null; content?: string; remove?: boolean; messages?: string[] }`. `path` is project-relative with `/`; a composite region is `assets/ripple.css#<id>`. `content` is the complete text to write (trailer included; for a composite region: the region content, body plus trailer line). `messages` are complete lines printed after the plan (`warning: ...`, `note: ...`, instruction lines) | M6-T10 |
| `loadRegistry` | `src/cli/plan.ts` | `(packageRoot: string) => RegistryIndex`; reads `<packageRoot>/registry/index.json`; throws an error whose message is `this project needs a newer <pkg>.` when `registryVersion` is greater than 1 | M6-T10 |
| `resolveTarget` | `src/cli/plan.ts` | `(target: string, config: RippleConfig \| null, liquidPrefix: string) => string`; replaces the four aliases of doc 07 section 4.3 and applies the block file prefix | M6-T10 |
| `readLiquidPrefix` | `src/cli/plan.ts` | `(scan: ScannedFile[], flag: string \| undefined) => string`; the rule of the last paragraph of doc 07 section 4.6 | M6-T10 |
| `planOwnedFiles` | `src/cli/plan.ts` | `(files: RegistryFile[], context: PlanContext, options: PlanOptions) => PlanEntry[]`; `PlanContext` is `{ io: CliIo; host: Host; index: RegistryIndex; config: RippleConfig \| null; scan: ScannedFile[]; liquidPrefix: string; getBase?: (pkg: string, version: string, id: string) => string \| undefined }` | M6-T10 |
| `formatPlan`, `applyPlan`, `exitCodeOf` | `src/cli/plan.ts` | `formatPlan(header: string, entries: PlanEntry[]) => string[]` (doc 07 section 7.1 rule 8); `applyPlan(root: string, entries: PlanEntry[]) => void` (rule 7); `exitCodeOf(entries: PlanEntry[]) => 0 \| 1` | M6-T10 |
| `derivedEntries`, `renderCssEntry` | `src/cli/plan.ts` | `renderCssEntry(existing: string \| undefined, componentIds: string[]) => string` (doc 07 section 7.6.1 third row); `derivedEntries(context: PlanContext, tokensCss: string, componentIds: string[]) => PlanEntry[]` | M6-T03 (`renderCssEntry`), M6-T10 (`derivedEntries`) |
| `isInitialized`, `installedComponents`, `installedBlueprints` | `src/cli/plan.ts` | `isInitialized(scan, index, host, config, liquidPrefix) => boolean` (doc 07 section 5.3 field `initialized`); `installedComponents(scan, index) => string[]` (ids with at least one file found, ascending); `installedBlueprints(scan) => string[]` | M6-T16 |
| `RippleConfig`, `readConfig`, `validateConfig`, `defaultConfig` | `src/cli/config.ts` | `RippleConfig` is the object of doc 07 section 6.1; `readConfig(cwd) => RippleConfig \| null` (throws on an invalid file with the message of 6.2); `validateConfig(value: unknown) => string[]`; `defaultConfig(cwd, host, flags) => RippleConfig` | M6-T07 |
| Patch functions `patchCssEntry`, `patchAgents`, `patchPackageJson`, `patchHead`, `patchImportMap`, `patchThemeReference`, `patchSettings`, `patchLocale` | `src/cli/commands/init.ts` | each `(context: PlanContext, ...) => PlanEntry` (or `PlanEntry[]` for `patchLocale`); also `patchState(id, context) => "present" \| "stale" \| "absent" \| "skipped"`. They live in `init.ts` because doc 07 "Fallback (SPIKE-03)" puts the patch constant `THEME_REFERENCE_PATCH` there | M6-T11, M6-T12 |
| `syncSkills`, `SkillsPlan` | `src/cli/commands/skills.ts` | `syncSkills(io: CliIo, host: Host, options: { force: boolean; dryRun: boolean }) => SkillsPlan`; `SkillsPlan` is `{ add: number; update: number; remove: number; unchanged: number; modified: number; conflicts: string[]; lines: string[] }` | M6-T26 |
| `computeLock` | `src/cli/commands/status.ts` | `(io: CliIo, host: Host) => ComputedLock`; `ComputedLock` is the type-only declaration in `src/types.ts` written from doc 07 section 5.3 | M6-T22 |
| `RuleContext.cwd` | `src/check/index.ts` | the field `cwd: string`, the project root, set by the engine from `CheckOptions.cwd` (ledger D-142, which ratifies PR-M6-9). It exists before M6: no M6 task adds it; rules use it | M0-T42 |
| CLI test helper | `test/support/cli.ts` | 0.8 | M6-T09, extended by M6-T15 |

### 0.6 Order

The "Depends on" column of `docs/PLAN.md` section 6 is the only source of order (PLAN section 6). Before starting, check that `docs/plan/done/<id>.md` exists for each task in your row's cell. Facts for reading only:

- M6-T15 depends on M6-T07, M6-T10 and M6-T26 because `init` writes `ripple.json`, plans files and runs `skills sync` (doc 07 section 7.4). M6-T19 depends on M6-T01, M6-T02 and M6-T10 (`getBaseBody` reads a registry index and applies the install transform). M6-T22 depends on M6-T26 (the `skills` field of the computed lock is a `skills sync` dry run). M6-T23 and M6-T26 depend on M6-T08 (host detection). M6-T09 depends on M6-T08 (`resolveHost`). M6-T12 depends on M6-T11 (both add to `src/cli/commands/init.ts`).
- Two needs that the table does not show yet (reported to the core plan): M6-T10 needs `src/cli/merge3.ts` of M6-T18, and M6-T11 needs `renderAgentsSection` of M6-T13. Their sections say what to do when the file is missing: do not start, pick another task.
- Tasks of the same group may edit the same registration file when each adds only its own lines (PLAN section 6 "Grp", ledger D-147): `src/cli/index.ts` (one command-table line each), `src/check/rules/index.ts` (ascending id order). On a rebase conflict keep both sides' lines and re-run the proof.

### 0.7 Shared files that several M6 tasks edit

Edit only what your task names. On a `git rebase origin/main` conflict keep both sides' lines, then re-run the proof commands.

| File | Rule |
|---|---|
| `src/cli/index.ts` | M6-T09 creates the command table with a stub per command. A command task replaces ONLY its own stub line |
| `src/cli/plan.ts` | append exports only; never change another task's function. Creators in order of arrival: M6-T02, M6-T06, M6-T03, M6-T10, M6-T16 |
| `src/cli/commands/init.ts` | M6-T11 and M6-T12 add patch functions; M6-T15 adds `run` |
| `src/gen/registry.ts` | M6-T01, M6-T03, M6-T05 append; never change `assembleManifest` or `checkManifest` except the MB-15 line M6-T01 names |
| `src/gen/build.ts` | each task replaces only the `build: skipped ...` line it names, or adds only the check it names to step 10 |
| `src/check/rules/index.ts` | add your rules; keep ascending id order |
| `src/check/index.ts`, `src/check/engine.ts`, `src/check/flows.ts` | M6-T31 adds the layer P driver to `engine.ts`; M6-T32 writes the layer B driver and `FLOWS` in `flows.ts` and one call in `engine.ts`; M6-T30 adds the Theme Check sub-step to `engine.ts`. Checker types stay in `src/check/index.ts`. There is no file `src/check/types.ts`, `src/check/theme-check.ts` or `src/check/browser.ts` (ledger D-148). `RuleContext.cwd` exists since M0-T42 (D-142) |
| `src/architecture.test.ts` | only the `IMPORT_RULES` entries that PR-M6-1 and PR-M6-3 name |
| `test/support/cli.ts` | M6-T09 creates; M6-T15 extends; other tasks only import |

### 0.8 CLI tests (Plan reading PR-M6-7)

The specs say CLI tests are `[T1]` (doc 13 section 6.2) and give no harness. This plan fixes one.

- `bin/ripple.mjs` imports `dist/cli/index.mjs` for its side effect, so `src/cli/index.ts` runs the CLI when it is the built entry. It MUST end with exactly this statement and have no other top-level side effect:

  ```ts
  if (import.meta.url.endsWith("/dist/cli/index.mjs")) process.exitCode = await main(process.argv.slice(2))
  ```

  Test bundles live under `node_modules/.cache/ripple/test/`, so importing `main` in a test does not run it.
- Tests call `main(argv, io)` in-process through `runCli` of `test/support/cli.ts`:

  ```ts
  export interface CliResult { code: number; stdout: string; stderr: string }
  export function runCli(args: string[], options: { cwd: string; packageRoot?: string; env?: Record<string, string | undefined> }): Promise<CliResult>
  export function tempDir(): string                                  // mkdtempSync(join(tmpdir(), "ripple-")); the caller removes it
  export function fixturePackageRoot(): string                       // added by M6-T15, see there
  export function tempProject(kind: "theme" | "react" | "remix" | "html" | "empty"): string   // added by M6-T15
  export function treeHash(dir: string): string                      // added by M6-T15: sha256 over sorted "<relative path>\0<content>\0"
  ```

  `runCli` collects the `out` lines into `stdout` and the `err` lines into `stderr` (joined with `\n`, with a final `\n` when not empty), passes `env: {}` unless given, and passes `packageRoot` (default `fixturePackageRoot()` once M6-T15 exists; before that the test MUST pass one).
- A CLI test MUST NOT read `pkg/`, MUST NOT spawn a process, and MUST NOT use the network. Tests that set `RIPPLE_OFFLINE` or `RIPPLE_CACHE_DIR` pass them through `env`; CLI code reads the environment only through `io.env`.
- The built CLI itself (`node pkg/bin/ripple.mjs`) is exercised by the build checks RB-8 and RB-9 (M6-T34) and by the CI job `package-node20`.

### 0.9 Plan readings made by this file

Each was the smallest choice that keeps the gates green where two specs conflicted or all were silent. Ledger D-146 ratifies all thirteen (PR-M6-9 as D-142; the layer B driver is in `src/check/flows.ts` and the Theme Check sub-step in `src/check/engine.ts`, D-148). They are the rules to follow. No task adds a `## Ledger issues` line for them.

| # | Topic | The specs | Reading | Owning doc | Applied by |
|---|---|---|---|---|---|
| PR-M6-1 | `src/cli` needs `renderAgentsSection` | doc 07 sections 3.2 and 7.6.5: `src/gen/agents-md.ts` is "bundled into the CLI". doc 01 section 2.2 `IMPORT_RULES`: `src/cli/**` may import only `src/gen/{props-css,theme-css,tokens-source}.ts` | In `src/architecture.test.ts` change the `src/cli/**` entry `"./src/gen/{props-css,theme-css,tokens-source}.ts"` to `"./src/gen/{props-css,theme-css,tokens-source,agents-md}.ts"`. `src/gen/agents-md.ts` imports nothing except `src/types.ts` and `src/identity.ts` (reading rule 5 of that section then holds for it too) | doc 01 | M6-T11 |
| PR-M6-2 | `RegistryIndex` type location | doc 07 section 4.2 prints the types as `// src/gen/registry.ts (types)`; the CLI reads the index and may not import that file | 0.5 first row | doc 07 | M6-T01 |
| PR-M6-3 | Layer B needs the upgrade recorder | doc 13 UD-6: layer B MUST call `installUpgradeRecorder` (`src/testing/upgrade-diff.ts`). doc 01 `IMPORT_RULES`: `src/check/**` may import only `src/testing/canonicalize.ts` | Add `"./src/testing/upgrade-diff.ts"` to the `src/check/**` entry. That file imports Playwright types only, so `dist/check` still loads without Playwright (test A-05) | doc 01 | M6-T32 |
| PR-M6-4 | Source of the `checkPattern` page script for RP605 | doc 07 row RP605: "injected with `page.addScriptTag`". doc 01 section 2.3: `@ui-sdk/core/testing` is for test files only; `pkg/` has no file for it | M6-T33, section "RP605" | doc 07 | M6-T33 |
| PR-M6-5 | `registry/liquid/locales/core.json` content | doc 07 section 4.1 rule 2: `storefront` is `{}`. doc 14 section 7.3 rule 4: it MUST hold the seven keys `rp-head` reads; doc 07's own generation check (same rule 2, last item) requires every key a file reads to be in its owner's file. doc 14 section 11.2: the `schema` part holds "exactly" `settings`; doc 07 adds `props` | `storefront` holds the seven keys; `schema` holds `settings` and `props` (doc 07 acceptance item 5b needs `props`) | doc 07 | M6-T05 |
| PR-M6-6 | Example calls in component pages | doc 08 rule C-2: `renderComponentDoc` MUST use "the same emitters" as conformance. Those emitters are `liquidCaseSource` (`test/support/hosts/liquid.ts`) and `caseJsx` (`test/support/hosts/tsx.ts`); `src/gen` may not import `test/` | M6-T14 step 4: private copies in `src/gen/docs.ts` plus a test that proves them equal to the conformance emitters for every fixture | doc 08 | M6-T14 |
| PR-M6-7 | CLI test harness | none | 0.8 | doc 13 | M6-T09 |
| PR-M6-8 | Where patch code, `REGISTRY_VERSION`, `applyPlan`'s signature and the other names of 0.5 live | doc 07 names the files of `src/cli/` but not these | 0.5 | doc 07 | each creator |
| PR-M6-9 | Rules that read project files | now ledger D-142 and doc 07 section 9.3: `RuleContext.cwd: string`, added by M0-T42. RP307, RP402, RP403, RP405, RP406, RP503, RP505, the Liquid case of RP112 and cases (b), (c) of RP117 use it | Rules read files with `node:fs` below `context.cwd`. No M6 task adds the field | doc 07 | M0-T42 |
| PR-M6-10 | Command form inside checker output | doc 07: `docs` and command fixes are printed in the command form (7.1 rule 12, owned by `src/cli`); `src/check` may not import `src/cli`; `CheckOptions` has no field for it | M6-T23 step 4 | doc 07 | M6-T23 |
| PR-M6-11 | Tier of layer B rule tests | doc 13 section 6.2 calls checker rule tests `[T1]`; RP601 to RP609 need a browser | `[T5]`, in `src/check/rules/RP60<n>.test.ts`, using `openPage()` and `getFixtureServer()` of `test/support/` | doc 13 | M6-T32, M6-T33 |
| PR-M6-12 | Text form of `ripple status` for blueprints, duplicates and orphans | doc 07 section 7.10 shows components, core, patches, unmanaged, skills only | M6-T22 step 4 | doc 07 | M6-T22 |
| PR-M6-13 | Tests of `--blueprint` before any blueprint exists | blueprints are M7 | M6-T16 builds a synthetic blueprint in a copy of the fixture package root | - | M6-T16 |

### 0.10 Definition of done reminder

Every task ends with PLAN section 5.0 (commit, push, pull request in the five-heading form, done file `docs/plan/done/<task id>.md`). "Acceptance" lists what is specific; PLAN section 3.1 always applies. A task that cannot finish opens a draft pull request and writes no done file (PLAN 1 item 7).

---

## M6-T01 Generator `src/gen/registry.ts` (step G9 and build step 8): `registry/index.json`, file keys and targets, `manifest.json`, schemas, `custom-elements.json`, `html-custom-data.json`

- **Goal:** Build `pkg/registry/` with `index.json`, and write `pkg/custom-elements.json` and `pkg/html-custom-data.json`, from the manifest (generator step G9 and build step 8).
- **Depends on:** M1-T46.
- **Kind:** `gen`. Size M.

### Read first

doc 07: `### 3.4 ` (2.5 kB), `### 4.1 ` (4 kB), `### 4.2 ` (5 kB; the `ts` block is extracted), `### 4.3 ` (4 kB), `### 10.2 ` (3 kB; rules RB-1 to RB-4 only), row G9 of `### 3.2 `, row MB-15 of `### 1.6 `. This file 0.4, 0.5. Repository: the export list of `src/gen/registry.ts` (`grep -n "^export" src/gen/registry.ts`), the step 8 part of `src/gen/build.ts`, `components/button/button.json` (key `files`).

### Files

Change: `src/gen/registry.ts`, `src/types.ts` (append three types), `src/gen/build.ts` (step 8 and step 10), `src/gen/index.ts` (call `buildRegistryIndex` in step G9, in memory). Create: `src/gen/registry-build.test.ts`. Must not change: any `components/**` file, `src/gen/schema/*`.

### Steps

1. Branch `task/M6-T01-registry`. Extract:

   | Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
   |---|---|---|---|---|---|---|
   | `node_modules/.cache/ripple/registry-types.ts` | `docs/07-manifest-registry-cli.md` | `### 4.2 ` | `ts` | 0 | 1562 | `// src/gen/registry.ts (types)` |

   Append its three declarations (`InstallMode`, `RegistryFile`, `RegistryIndex`) to `src/types.ts` unchanged, and add `export type { InstallMode, RegistryFile, RegistryIndex } from "../types.ts"` to `src/gen/registry.ts` (PR-M6-2).
2. `export const REGISTRY_VERSION = 1` in `src/gen/registry.ts`.
3. `buildRegistryIndex(manifest, options)` (signature: 0.5). Derivation, from `### 4.2 ` "Derivation from a manifest file entry":
   - `registryVersion: 1`; `package` from the manifest; `prefix` from the manifest.
   - `components[id]`: `title`, `status`, `dependencies` (the manifest `dependencies.components`), `files[host]` = the entries of `files.shared` followed by `files.<host>`, each mapped to a `RegistryFile`: `id` is `<component name>/<key>`; `source` is `"registry/" + f.source`; `mode` is `f.mode`, except type `asset` with a target ending `.js`, which is `library`; `target` is `f.target`, except host `liquid` and type `css`, where it is `"assets/ripple.css#" + id`.
   - `blueprints[id]`: `title`, `components`, `files[host]` with owner `blueprint.<id>` (trailer id `blueprint.<id>/<key>`). With zero blueprints the value is `{}`.
   - A `locale` file entry (key `locale`, target `locales/*.json`, type `asset`, mode `patch`) is kept only when its owner is in `options.localeOwners`.
   - `liquidBlocks`: every Liquid block file name without extension that any component ships (targets matching `blocks/<name>.liquid`), sorted ascending, unique.
   - `skills`: `options.skills`.
   - `core`: `{ html: [], react: [], remix: [], liquid: [] }` with the comment `// PLAN 4.4: CORE_FILES is added by M6-T03`.
   - Iteration order: components and blueprints in ascending byte order of id; file arrays in manifest order.
4. MB-15, registry half, in `checkManifest`: replace the line marked `PLAN 4.4: registry part of MB-15 is M6-T01` by the check "`(owner, key)` to `source`, `target`, `type`, `mode` follows the table of `### 4.3 `" (one comparison per row of that table; `<id>` is the component name, `<part>` any part name of the component). Message form: `manifest: <component id>: MB-15: <text>`. "Every source exists in the registry build" is checked by RB-2 in step 6 below, not here.
5. `buildRegistry(pkgDir)` (doc 07 `### 10.2 `, the five numbered steps, in that order). Details:
   - Step 3 copies, by the tree of `### 4.1 `: `css/tokens.css`, `css/base.css`, `css/props.css`, `css/theme.css` to `registry/css/`; `components/<id>/<id>.css` to `registry/css/components/<id>.css`; `components/<id>/html/<id>.html`; `components/<id>/react/*` and `remix/*`; `components/<id>/liquid/blocks/*` and `liquid/snippets/*`; `components/<id>/liquid/locales/<id>.json`, `locales/core.json`, `locales/blueprint.<id>.json` to `registry/liquid/locales/` (only files that exist); `blueprints/<id>/<host>/**` (skip the directory `blueprints/_sample/`). In every copied text file replace `__PKG__` with the resolved package name (the name `build.ts` passes; read how step 8 already replaces it).
   - `options.localeOwners` is computed from the locale files that exist. `options.skills` is read from `skills/<name>/ripple.json` (`{ "hosts": [...] }`), sorted by name; `[]` when `skills/` does not exist.
   - Files written for `src/gen/liquid-core/*` are M6-T05; a missing directory is skipped with `// PLAN 4.4: liquid-core is added by M6-T05`.
   - Step 5 of `### 10.2 `: the six `registry/liquid/assets/*.js` files are already written by build step 7; do not bundle; leave them.
   - `custom-elements.json`: the shape of the block in `### 3.4 ` (extract when needed: `### 3.4 `, `json`, index 0, 817 bytes, first line `{`), one module per `rp-*` key of `manifest.elements` except `rp-view-event`; `path`, `name`, `events`, `attributes` by the three bullets under the block. `html-custom-data.json`: the paragraph that starts "`html-custom-data.json` (VS Code custom data". Both are `JSON.stringify(value, null, 2)` plus `\n`.
6. `src/gen/build.ts`: in step 8 delete the `build: skipped` lines for the registry outputs, `custom-elements.json` and `html-custom-data.json` and call `buildRegistry("pkg")`. In step 10 add RB-1 to RB-4 exactly as the table of `### 10.2 ` states them; each failure prints `build: RB-<n>: <text>` and fails the build. RB-3 uses "status other than `planned`".
7. Tests, `src/gen/registry-build.test.ts` (build the manifest with `assembleManifest(loadSources())` from the repository):
   - `[T1] registry-build: button entry equals the example of 4.2` (the `components.button.files` object equals the JSON example of `### 4.2 ` for the four hosts; compare `id`, `source`, `target`, `type`, `mode`; the `locale` entry is present exactly when `components/button/liquid/locales/button.json` exists).
   - `[T1] registry-build: liquid css target is a composite region`.
   - `[T1] registry-build: liquidBlocks is sorted and unique`.
   - `[T1] registry-build: MB-15 rejects a wrong target` (mutate one `target`).
   - `[T1] registry-build: custom-elements has one module per rp tag except rp-view-event`.
   - `[T1] registry-build: html-custom-data lists rp-view-event with its two attributes`.
   - `[T1] registry-build: buildRegistry writes every source of the index` (call `buildRegistry(<temp dir>)` after creating `<temp dir>/registry/liquid/assets/` with six empty `.js` files; every non-null `source` exists; RB-4 text scan finds no trailer line and no `__PKG__`).
8. Proof: PLAN 5.0.

### Acceptance

`pnpm build` exits 0 and prints no `build: skipped` line containing `registry`, `custom-elements` or `html-custom-data`. `node -e "const i=require('./pkg/registry/index.json'); if(i.registryVersion!==1||!i.components.button) process.exit(1)"` exits 0. `test -f pkg/custom-elements.json && test -f pkg/html-custom-data.json`. `pnpm test:unit --files=src/gen/registry-build` reports 7 passed. `grep -c "registry part of MB-15" src/gen/registry.ts` prints `0`.

### Out of scope

`CORE_FILES` (M6-T03). `src/gen/liquid-core/` (M6-T05). RB-5 (M6-T04), RB-6 (M6-T03), RB-7 (already test A-06), RB-8 and RB-9 (M6-T34). `docs/` (M6-T14). Any CLI code.

### If blocked

- A component's `files` entry fails the new MB-15 check: the manifest entry is wrong, not the check. Do not edit the component in this task; draft pull request naming the component and the row of 4.3.
- `build.ts` replaces `__PKG__` in a way that cannot be reused: do the replacement inside `buildRegistry` with a second parameter defaulting to `PKG_NAME`, and report it.

---

## M6-T02 Install transform (specifier, alias and prefix rewriting)

- **Goal:** Add `installTransform` (steps T1 to T3: package name, Liquid block prefix, component import specifier) with its five acceptance cases.
- **Depends on:** M6-T01.
- **Kind:** `cli`. Size S.

### Read first

doc 07: `### 4.6 ` (4.7 kB; the code block is extracted), acceptance item 11a in `## 12. `. This file 0.5, 0.7.

### Files

Create or append: `src/cli/plan.ts`, `src/cli/plan.test.ts`.

### Steps

1. Branch `task/M6-T02-install-transform`. Extract:

   | Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
   |---|---|---|---|---|---|---|
   | `node_modules/.cache/ripple/transform.ts` | `docs/07-manifest-registry-cli.md` | `### 4.6 ` | `ts` | 0 | 1877 | `import { posix } from "node:path"` |

2. Put the extracted text into `src/cli/plan.ts` unchanged (when the file exists, append and merge the import line with the existing imports).
3. Tests in `src/cli/plan.test.ts`, the five cases of item 11a, one test each:
   - `[T1] plan: installTransform rewrites a Remix blueprint file` (`.tsx` and `.data.ts` extensions appended; `__PKG__` replaced). Use the example at the end of `### 4.6 `: `import { Stack } from "@components/stack";` at `app/pages/product.tsx` with `componentsDir` `app/components/ripple` gives `import { Stack } from "../components/ripple/stack.tsx";`.
   - `[T1] plan: installTransform rewrites a React file two directories deep` (no extension).
   - `[T1] plan: installTransform keeps ./ when components are below pages`.
   - `[T1] plan: installTransform prefixes only known Liquid blocks` (prefix `rp-`; a name not in `liquidBlocks` and a `{% render %}` call are unchanged).
   - `[T1] plan: installTransform leaves Liquid unchanged with an empty prefix`.
4. Proof: `pnpm typecheck && pnpm test:unit --files=src/cli/plan && pnpm ci`.

### Acceptance

`pnpm test:unit --files=src/cli/plan` passes the five tests. `grep -c "export function installTransform" src/cli/plan.ts` prints `1`.

### Out of scope

Reading the block prefix from installed files (`readLiquidPrefix`, M6-T10). Target alias resolution (M6-T10).

### If blocked

A case of 11a fails with the extracted code: fix the code (D-113), list the change under "Deviations".

---

## M6-T03 Core registry files and derived files (`core/tokens`, `core/base`, `core/props`, `core/theme`, `core/entry`, `core/js*`)

- **Goal:** Add the constant `CORE_FILES` so that `registry/index.json` lists the files `ripple init` installs per host, and add the generator of the derived CSS entry file. This task owns the CSS entry files a project receives from the registry: `<paths.styles>/ripple.css` (`core/entry`, doc 03 `### 5.2 ` first block) and the `core/tokens`, `core/base`, `core/props`, `core/theme` rows (M0-T23 writes none of them). The edit of the project's own CSS entry (`core/patch:css-entry`, doc 03 `### 5.2 ` second and third blocks) is M6-T11.
- **Depends on:** M6-T01.
- **Kind:** `gen`. Size M.

### Read first

doc 07: `### 4.4 ` (5.4 kB), `#### 7.6.1 ` (1.5 kB), rule RB-6 in `### 10.2 `. doc 03: `### 5.2 ` (1.5 kB), `### 5.3 ` (2 kB). This file 0.5, 0.7.

### Files

Change: `src/gen/registry.ts` (`CORE_FILES`, use it in `buildRegistryIndex`), `src/gen/build.ts` (RB-6 in step 10), `src/cli/plan.ts` (append `renderCssEntry`), `src/gen/registry-build.test.ts`, `src/cli/plan.test.ts`.

### Steps

1. Branch `task/M6-T03-core-files`.
2. `export const CORE_FILES: Record<"html" | "react" | "remix" | "liquid", RegistryFile[]>` in `src/gen/registry.ts`: one `RegistryFile` per row of the two tables of `### 4.4 `, in table order. Rules for the fields the tables do not print:
   - `source`: the table cell; `null` where the cell says "none" (also when it continues with a function call).
   - `type`: `css` for `core/tokens`, `core/base`, `core/props`, `core/theme`, `core/entry`; `asset` for every `core/js*` row and every `core/patch:*` row; `snippet` for the four `core/snippet:*` rows.
   - npm hosts: rows whose "Hosts" cell is "all three" go to `html`, `react` and `remix`; the six `core/js*` rows go to `html` and `remix` only.
   - `core/patch:css-entry` target: the literal string `@css` (the CLI replaces it by the `css` value of `ripple.json`). `core/patch:import-map` target: `snippets/import-map.liquid`.
   - Liquid: `core/snippet:icon` source is `registry/liquid/snippets/rp-icon.liquid` (it is the Icon component's snippet, copied there by M6-T01 step 5).
3. `buildRegistryIndex`: `core` is `CORE_FILES`; delete the `PLAN 4.4: CORE_FILES` marker.
4. `renderCssEntry(existing, componentIds)` in `src/cli/plan.ts` (third row of the table in `#### 7.6.1 `; reference text: doc 03 `### 5.2 `, extract: `### 5.2 `, `css`, index 0, 268 bytes, first line `@layer ui-sdk, theme, base, rp, components, rmx, utilities;`):
   - `existing` undefined: return the two layer statements, the line `/* ripple:start imports */`, `@import "./tokens.css";`, `@import "./base.css";`, `@import "./props.css";`, one `@import "./components/<id>.css";` per id in ascending byte order, the line `/* ripple:end imports */`, each line ending with `\n`.
   - `existing` given: replace only the text from the start marker line to the end marker line (both included) and keep everything else byte for byte; when the markers are absent, return the new file text.
5. `src/gen/build.ts` step 10: RB-6 as the table states it (`registry/css/props.css` equals `generatePropsCss(<registry/css/tokens.css>)`; `registry/css/theme.css` equals `generateThemeCss(<registry/css/tokens.css>)`).
6. Tests:
   - `src/gen/registry-build.test.ts`: `[T1] registry-build: CORE_FILES has the rows of 4.4` (counts: `html` 14, `remix` 14, `react` 8, `liquid` 20; the ids in table order); `[T1] registry-build: react core has no library file`; `[T1] registry-build: every core source with a registry/ prefix exists after buildRegistry` (skip the three `rp-head`, `rp-tokens`, `rp-import-map-entries` snippets and `registry/liquid/settings.json` while `src/gen/liquid-core/` does not exist; mark the skip in code with `// PLAN 4.4: liquid-core is added by M6-T05`, not with a skipped test).
   - `src/cli/plan.test.ts`: `[T1] plan: renderCssEntry prints the file of doc 03 5.2 for button` (equals the extracted block); `[T1] plan: renderCssEntry replaces only the imports region`; `[T1] plan: renderCssEntry sorts component ids`.
7. Proof: PLAN 5.0.

### Acceptance

`pnpm build` exits 0 (RB-6 runs). `node -e "const c=require('./pkg/registry/index.json').core; if(c.liquid.length!==20||c.react.length!==8) process.exit(1)"` exits 0. The six tests pass.

### Out of scope

Planning or writing core files in a project (M6-T10, M6-T15). The patches (M6-T11, M6-T12). `src/gen/liquid-core/` content (M6-T05). `derivedEntries` (M6-T10).

### If blocked

RB-6 fails: `css/props.css` or `css/theme.css` is stale; run `pnpm gen`. When it still fails, the generator and the committed file disagree: draft pull request, do not edit the CSS by hand.

---

## M6-T04 Liquid composite stylesheet `assets/ripple.css` (marker regions) and the prebuilt `ripple.css` outputs

- **Goal:** Add `src/cli/composite.ts`, the parser and writer of the Liquid composite stylesheet, and the build check RB-5 that ties the registry CSS to `pkg/browser/ripple.css`.
- **Depends on:** M6-T01.
- **Kind:** `gen`. Size M.

### Read first

doc 07: `### 4.5 ` (rules 1 to 5 above the code block, 1.5 kB; the block is extracted), `### 10.1 ` (1 kB), rule RB-5 in `### 10.2 `. doc 03: `### 5.3 ` (2 kB).

### Files

Create: `src/cli/composite.ts`, `src/cli/composite.test.ts`. Change: `src/gen/build.ts` (RB-5 in step 10).

### Steps

1. Branch `task/M6-T04-composite`. Extract:

   | Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
   |---|---|---|---|---|---|---|
   | `src/cli/composite.ts` | `docs/07-manifest-registry-cli.md` | `### 4.5 ` | `ts` | 0 | 3063 | `// src/cli/composite.ts - the Liquid composite stylesheet assets/ripple.css (00-decisions D-055 item 3).` |

2. Tests, `src/cli/composite.test.ts` (the four cases doc 07 names: round trip, CRLF input, insert order, removal):
   - `[T1] composite: parse then serialize returns the text` (a file with the layer header, three core regions, two component regions and one line of project text between two regions).
   - `[T1] composite: CRLF input parses to the same segments`.
   - `[T1] composite: setRegion inserts core regions first and components in ascending id order` (insert `core/props`, `core/tokens`, `dialog/css`, `button/css`, `core/base` into `emptyComposite()`; the result order is `core/tokens`, `core/base`, `core/props`, `button/css`, `dialog/css`).
   - `[T1] composite: setRegion never moves an existing region`.
   - `[T1] composite: setRegion with null removes the region and keeps other text`.
   - `[T1] composite: an indented marker without a slash is body text` (a region body containing `  /* ripple:start display */`).
   - `[T1] composite: a region without an end marker throws`.
   - `[T1] composite: a new file starts with the two layer statements` (`serializeComposite(emptyComposite()) === LAYER_HEADER`).
3. `src/gen/build.ts` step 10: RB-5 as the table states it. The three files named `ripple.css` are different files (`### 10.1 `); this check concerns only `pkg/browser/ripple.css`.
4. Proof: PLAN 5.0.

### Acceptance

The eight tests pass. `pnpm build` exits 0 with RB-5 active (`grep -c "RB-5" src/gen/build.ts` prints at least `1`).

### Out of scope

Using the composite in `scanProject`, `planOwnedFiles` and `applyPlan` (M6-T10). Trailers inside regions (M6-T06 gives `stamp`; M6-T10 combines them). The npm entry file (M6-T03).

### If blocked

RB-5 fails although nothing in `css/` changed: build step 7 and the registry copy read different files (for example a filtered component list in bring-up mode). Make RB-5 use the same component list as step 7; do not change step 7.

---

## M6-T05 Liquid infrastructure snippets `rp-head`, `rp-tokens`, `rp-import-map-entries`; `registry/liquid/settings.json`; locale sources

- **Goal:** Add the sources under `src/gen/liquid-core/`, copy them into the registry, and complete the generated `locales/core.json`.
- **Depends on:** M6-T01.
- **Kind:** `gen`. Size M.

### Read first

doc 14: `### 6.1 ` only the paragraph below the JSON block (0.5 kB), `### 6.3 ` prose (0.5 kB), `### 7.2 ` (1 kB), `### 7.3 ` rules 0 to 6 below the block (4 kB), `### 11.2 ` (1 kB). doc 07: `### 4.1 ` rule 2 (2 kB), rows `core/snippet:*`, `core/patch:settings`, `core/patch:locale` of `### 4.4 `. doc 05 (`docs/05-commerce.md`): the table of `### 4.3 Strings` (1 kB). This file PR-M6-5.

### Files

Create: `src/gen/liquid-core/rp-head.liquid`, `rp-tokens.liquid`, `rp-import-map-entries.liquid`, `settings.json`, `settings.locale.json`; `src/gen/liquid-core.test.ts`. Change: `src/gen/registry.ts` (copy step), `src/gen/liquid.ts` (only the function that writes `locales/core.json`), generated and committed `locales/core.json`; `locales/en.default.json` only by step 5.

### Steps

1. Branch `task/M6-T05-liquid-core`. Extract:

   | Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
   |---|---|---|---|---|---|---|
   | `src/gen/liquid-core/rp-tokens.liquid` | `docs/14-liquid-theme.md` | `### 6.3 ` | `liquid` | 0 | 2210 | `{% doc %}` |
   | `src/gen/liquid-core/rp-import-map-entries.liquid` | `docs/14-liquid-theme.md` | `### 7.2 ` | `liquid` | 0 | 538 | `{% doc %}` |
   | `src/gen/liquid-core/rp-head.liquid` | `docs/14-liquid-theme.md` | `### 7.3 ` | `liquid` | 0 | 2605 | `{% doc %}` |
   | `src/gen/liquid-core/settings.locale.json` | `docs/14-liquid-theme.md` | `### 11.2 ` | `json` | 0 | 208 | `{` |
   | `node_modules/.cache/ripple/settings_schema.json` | `docs/14-liquid-theme.md` | `### 6.1 ` | `json` | 0 | 1580 | `[` |

2. `src/gen/liquid-core/settings.json` is the SECOND element of the extracted array, written as `JSON.stringify(array[1], null, 2) + "\n"` (1192 bytes; its `name` is `t:ripple.settings.name`; settings ids in order: `rp_palette`, `rp_font_body`, `rp_font_heading`, `rp_radius`, `rp_density`, `rp_text_scale`):

   ```bash
   node -e "const fs=require('fs');const a=JSON.parse(fs.readFileSync('node_modules/.cache/ripple/settings_schema.json','utf8'));fs.writeFileSync('src/gen/liquid-core/settings.json',JSON.stringify(a[1],null,2)+'\n')"
   ```

3. `buildRegistry` (`src/gen/registry.ts`): copy the three `.liquid` files to `registry/liquid/snippets/` and `settings.json` to `registry/liquid/settings.json` (read with `node:fs`; the files are never imported). Delete the `PLAN 4.4: liquid-core is added by M6-T05` markers (also the one in `src/gen/registry-build.test.ts` when M6-T03 is done).
4. `locales/core.json` (generated by step G5; shape `{ "storefront": <object>, "schema": <object> }`, doc 07 `### 4.1 ` rule 2, with PR-M6-5):
   - `schema`: `{ "settings": <the "settings" object of src/gen/liquid-core/settings.locale.json>, "props": { <every ripple.props.* key, ascending byte order> } }`. The `props` half is what M0 already generates; keep it.
   - `storefront`: the seven keys that `rp-head.liquid` reads with the `t` filter, as a nested object under their component ids, with the values of `locales/en.default.json`: `product-form.added`, `cart-lines.updated`, `cart-lines.removed`, `discount-code.applied`, `discount-code.removed`, `cart-note.saved`, `cart-lines.error`. Find the keys by scanning the three liquid-core files for a string literal immediately followed by `| t` (use `findLiquidUses` or `findLiquidCalls` of `src/check/liquid-calls.ts` when M6-T28 is done; otherwise the regular expression `/'(ripple\.[a-z0-9_.-]+)'\s*\|\s*t\b/g`). A key missing from `locales/en.default.json` fails `pnpm gen` with `gen: src/gen/liquid-core/rp-head.liquid: locale key <key> is not in locales/en.default.json`.
5. Bring-up only: when `pnpm gen` fails in step 4 because the component that owns a key is not in the repository yet (DiscountCode: M4-T15; CartNote: M4-T14), add exactly that key to `locales/en.default.json` with the English text of doc 05 `### 4.3 Strings` (`Discount applied`, `Discount removed`, `Note saved`) and list it in the done file. Do not add any other key.
6. Run `pnpm gen`; commit `locales/core.json`.
7. Tests, `src/gen/liquid-core.test.ts`:
   - `[T1] liquid-core: settings.json equals the second object of doc 14 6.1` (parse the doc block at test time with the extractor logic inlined, or compare with a SHA-256 of the file text that starts with `7883605867ab`).
   - `[T1] liquid-core: settings.locale.json equals doc 14 11.2` (six keys: `name`, `font_body`, `font_heading`, `radius`, `density`, `text_scale`).
   - `[T1] liquid-core: rp-head prints the five items in the order of D-054` (the indexes of `stylesheet_tag`, `{% render 'rp-tokens' %}`, `id="rp-commerce"`, `window.rpDomReady`, `<script type="module"` are ascending; the file contains no `content_for_header`, no `<title`, no `importmap`).
   - `[T1] liquid-core: the inline script of rp-head equals INLINE_COMMANDS_POLYFILL` (import the constant from `src/runtime/commands-polyfill.ts` in the test; compare with the text between `<script>` and `</script>` after trimming one leading and one trailing newline).
   - `[T1] liquid-core: rp-import-map-entries has six entries, each line ending with a comma` (`ripple`, `ripple/tabs`, `ripple/tooltip`, `ripple/toast`, `ripple/shared`, `ripple/agent`).
   - `[T1] liquid-core: core.json holds the seven storefront keys and the settings labels`.
   - `[T1] liquid-core: every ripple.props key a generated block schema refers to is in core.json` (doc 07 acceptance item 5b).
8. Proof: PLAN 5.0.

### Acceptance

`ls src/gen/liquid-core | wc -l` prints `5`. `pnpm build` exits 0; `test -f pkg/registry/liquid/snippets/rp-head.liquid && test -f pkg/registry/liquid/settings.json`. `pnpm gen --check` exits 0. The seven tests pass. `grep -rn "liquid-core is added by M6-T05" src/` prints nothing.

### Out of scope

`snippets/import-map.liquid` and `snippets/meta-tags.liquid` (files of the `layout` blueprint, M7-T06). `rp-icon` (the Icon component). The patches that install these files (M6-T12). Tests E-20, E-21 and the Liquid clauses of E-22, E-28 of `docs/04-elements.md` that M3 done files mark "deferred to M6-T05": they are NOT in this row; copy the deferred list into your done file under "notes for later tasks" for M6-T35.

### If blocked

- The inline-script test fails: `rp-head.liquid` comes from doc 14 and the constant from doc 04 (D-078 says they are byte-identical). Do not edit either; draft pull request with the first differing line.
- `src/gen/liquid.ts` has no separate function for `core.json`: add the `storefront` and `settings` parts where the file is assembled; change nothing else in that module.

---

## M6-T06 Provenance trailers `src/cli/trailer.ts` and finding installed files

- **Goal:** Add the trailer module (parse, hash, stamp) and `scanProject`, which finds installed Ripple files by their trailers.
- **Depends on:** M1-T46.
- **Kind:** `cli`. Size M.

### Read first

doc 07: `### 5.1 ` (the table and rules 1 to 8, 2 kB; the code block is extracted), `### 5.2 ` (1 kB), acceptance item 7 in `## 12. `. This file 0.5, 0.7.

### Files

Create: `src/cli/trailer.ts`, `src/cli/trailer.test.ts`. Create or append: `src/cli/plan.ts`, `src/cli/plan.test.ts`.

### Steps

1. Branch `task/M6-T06-trailers`. Extract:

   | Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
   |---|---|---|---|---|---|---|
   | `src/cli/trailer.ts` | `docs/07-manifest-registry-cli.md` | `### 5.1 ` | `ts` | 0 | 3105 | `// src/cli/trailer.ts - provenance trailers (00-decisions D-056). The trailer is the lock record.` |

2. `scanProject(root, host)` in `src/cli/plan.ts`, exactly the steps of `### 5.2 `:
   - Walk `root` recursively. Skip directories named `node_modules`, `.git`, `dist`, `build`, `out`, `coverage`, `pkg`, and every directory whose name starts with `.`.
   - Consider files with the extensions `.liquid`, `.css`, `.ts`, `.tsx`, `.js`, `.html`. Read the last 512 bytes, take the last non-empty line, test it against the trailer regular expression (export `TRAILER_RE` from `trailer.ts` by adding the word `export`; this is the one permitted change). On a match read the whole file and call `parseFile`.
   - Step 3 of 5.2 (host `liquid`: the regions of `assets/ripple.css`) is NOT implemented here: leave the comment `// PLAN 4.4: composite regions are added by M6-T10`.
   - Result: `ScannedFile[]` (0.5), sorted by `path` ascending, paths project-relative with `/`.
   - Also delete nothing: leftover `*.ripple-tmp` handling is M6-T10.
3. Tests:
   - `src/cli/trailer.test.ts` (acceptance item 7 and the list in the sentence above the code block of 5.1): `[T1] trailer: stamp then parseFile is unmodified for the three syntaxes` (paths `a.liquid`, `a.css`, `a.html`); `[T1] trailer: one changed byte gives modified`; `[T1] trailer: CRLF conversion of the whole file is unmodified`; `[T1] trailer: a scoped package name and a prerelease version parse` (`@acme/storefront-ui@0.2.0-next.1`); `[T1] trailer: a file whose last line is not a trailer is unmanaged`; `[T1] trailer: the trailer hash is the hash of the upstream body, not of the local body` (`stamp(syntax, id, pkg, v, upstream, local)` then `parseFile(...).modified === true` and `trailer.hash === hashBody(upstream)`); `[T1] trailer: syntaxForPath throws for an unknown extension`.
   - When `src/cli/commands/skills.ts` exists and contains the line marked `// PLAN 4.4: M6-T06 adds trailer package names` (M6-T26 ran first), replace that line by the `scanProject` form of M6-T26 step 4 and delete the marker.
   - `src/cli/plan.test.ts`: `[T1] plan: scanProject finds trailered files and skips node_modules and dot directories`; `[T1] plan: scanProject ignores a trailer that is not the last non-empty line`; `[T1] plan: scanProject reports two files with the same id` (both entries are returned; choosing between them is the caller's rule).
4. Proof: `pnpm typecheck && pnpm test:unit --files=src/cli/ && pnpm ci`.

### Acceptance

The ten tests pass. `grep -c "^export" src/cli/trailer.ts` prints `9` (the eight of the spec plus `TRAILER_RE`).

### Out of scope

The composite regions in the scan (M6-T10). `SKILL.md` metadata (M6-T26). The computed lock (M6-T22). Rule RP512.

### If blocked

`grep -c "^export"` differs because the extracted block changed: the "Bytes" check of 0.3 failed first; stop and report.

---

## M6-T07 Project configuration `src/cli/config.ts`, `src/gen/schema/config.schema.json`

- **Goal:** Add the schema file of `ripple.json` and the hand-written reader, validator and default builder.
- **Depends on:** M1-T46.
- **Kind:** `cli`. Size S.

### Read first

doc 07: `## 6. ` whole (`### 6.1 ` and `### 6.2 `, 3.8 kB). This file 0.5.

### Files

Create: `src/gen/schema/config.schema.json`, `src/cli/config.ts`, `src/cli/config.test.ts`. Change: `src/gen/build.ts` only when it prints a skip line for `config.schema.json` (delete that line; step 8 already copies the schema files that exist).

### Steps

1. Branch `task/M6-T07-config`. Extract:

   | Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
   |---|---|---|---|---|---|---|
   | `src/gen/schema/config.schema.json` | `docs/07-manifest-registry-cli.md` | `### 6.2 ` | `json` | 0 | 1342 | `{` |

2. `src/cli/config.ts` (imports: `node:fs`, `node:path`, `src/identity.ts`, `src/types.ts` only):
   - `RippleConfig`: `{ $schema?: string; host: "html" | "react" | "remix"; paths: { components: string; styles: string; public?: string; pages: string }; css: string | null; prefix: { css: string; element: string } }`.
   - `validateConfig(value)`: implements exactly the constraints of the schema of 6.2 by hand (no JSON Schema library): required keys `host`, `paths`, `css`, `prefix`; no additional property at any level; `host` enum; path pattern `^(?!/)(?!\./)(?!.*\.\.)[A-Za-z0-9._/@-]+$`; `paths.public` required when `host` is `html` or `remix`; prefix pattern `^[a-z]+-$`. Each problem is a string `<key>: <problem>` (for example `paths.components: must not start with "/" or "./" or contain ".."`).
   - `readConfig(cwd)`: returns `null` when `ripple.json` does not exist; throws `Error("ripple.json: <key>: <problem>")` for the first problem (the CLI prints it after `error: `, exit code 2); throws `Error("ripple.json prefix does not match the installed package (rp-).")` when `prefix.css` or `prefix.element` is not `rp-`.
   - `defaultConfig(cwd, host, flags)`, `flags` being `{ components?: string; styles?: string; public?: string; pages?: string; css?: string }` (the word `none` for `css` means `null`): the "Default chosen by `init`" column of the table in `### 6.1 `, literally: `paths.components` is `app/components/ripple` when `app/` exists, else `src/components/ripple` when `src/` exists, else `components/ripple`; `paths.styles` by the same rule with `styles/ripple`; `paths.public` is `public/ripple` (omitted on `react`); `paths.pages` is `app/pages` on `remix`, `src/pages` on `react`, `pages` on `html`, whatever directories exist; `css` is the first that exists of `app/app.css`, `app/styles/app.css`, `app/root.css`, `app/tailwind.css`, `app/globals.css`, `src/index.css`, `src/app.css`, `src/styles.css`, `src/main.css`, `styles/app.css`, `public/styles.css`, else `null`; `prefix` is `{ css: "rp-", element: "rp-" }`; `$schema` is `./node_modules/<PKG_NAME>/config.schema.json`. Key order of the object: `$schema`, `host`, `paths` (`components`, `styles`, `public`, `pages`), `css`, `prefix`.
3. Tests, `src/cli/config.test.ts`: `[T1] config: the example of 6.1 is valid`; `[T1] config: schema file equals the JSON of 6.2` (compare after `JSON.parse`); `[T1] config: an unknown key is rejected`; `[T1] config: a path starting with ./ or containing .. is rejected`; `[T1] config: public is required on html and remix and optional on react`; `[T1] config: css null is valid`; `[T1] config: defaults for remix with an app directory` (the example object of 6.1 when `app/app.css` exists); `[T1] config: defaults for react without app or src` (`components/ripple`, `styles/ripple`, `src/pages`, no `public`, `css` null); `[T1] config: readConfig throws the 6.2 message`; `[T1] config: a prefix other than rp- is rejected`.
4. Proof: PLAN 5.0.

### Acceptance

The ten tests pass. `pnpm build` exits 0 and `test -f pkg/config.schema.json`.

### Out of scope

Writing `ripple.json` (M6-T15). Host detection (M6-T08). The `ripple.json already exists` flag error (M6-T15).

### If blocked

`pkg/config.schema.json` is not written although the source exists: step 8 of `build.ts` has a file list; add the name there and delete its `PLAN 4.4` marker.

---

## M6-T08 Host detection `src/cli/detect-host.ts`

- **Goal:** Add `detectHost` and `validateTheme` with the fourteen assertions of the specification.
- **Depends on:** M1-T46.
- **Kind:** `cli`. Size M.

### Read first

doc 07: `### 7.3 ` (prose above and below the code block, 1.5 kB; the block is extracted), acceptance item 11 in `## 12. `.

### Files

Create: `src/cli/detect-host.ts`, `src/cli/detect-host.test.ts`.

### Steps

1. Branch `task/M6-T08-detect-host`. Extract:

   | Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
   |---|---|---|---|---|---|---|
   | `src/cli/detect-host.ts` | `docs/07-manifest-registry-cli.md` | `### 7.3 ` | `ts` | 0 | 4084 | `// src/cli/detect-host.ts - host detection (00-decisions D-057). First match wins; nothing is guessed.` |

2. Tests, `src/cli/detect-host.test.ts`. Each builds its layout in a temporary directory. The 12 layouts of acceptance item 11, named `[T1] detect-host: <layout>`:

   | Layout | Expected |
   |---|---|
   | empty directory | `ok: false`, message `No host detected. Run from a theme root or an app root, or pass --host.` |
   | `--host` flag `react` in an empty directory | `host: "react"`, `source: "flag"` |
   | invalid flag value `vue` | `ok: false`, message `Unknown host "vue". Use one of: html, react, remix, liquid.` |
   | `ripple.json` with `"host": "remix"` | `host: "remix"`, `source: "config"` |
   | theme (`layout/theme.liquid`, `templates/`, `config/settings_schema.json`) | `host: "liquid"`, `source: "theme"` |
   | theme plus `package.json` | `host: "liquid"` |
   | theme with `sections/` | `ok: false`, the `sections/` message of the code |
   | theme with `templates/index.json` | `ok: false`, the JSON template message naming `templates/index.json` |
   | `package.json` with `"remix": "^3.0.0"` | `host: "remix"`, `source: "package"` |
   | `package.json` with `"remix": "^2.0.0"` and no `react` | `host: "html"` |
   | `package.json` with `react` in `devDependencies` | `host: "react"` |
   | `package.json` with no dependencies | `host: "html"` |

   And the two `validateTheme` cases: `[T1] detect-host: validateTheme accepts a directory without templates` (returns `null`); `[T1] detect-host: validateTheme rejects templates/customers/x.json` (returns a string containing `templates/customers/x.json`).
3. Proof: `pnpm typecheck && pnpm test:unit --files=src/cli/detect-host && pnpm ci`.

### Acceptance

`pnpm test:unit --files=src/cli/detect-host` reports 14 passed.

### Out of scope

Calling `validateTheme` after a `--host liquid` flag (each command does that through a helper M6-T09 adds). `ripple.json` validation beyond the `host` key (M6-T07).

### If blocked

A layout gives another result with the extracted code: fix the code (D-113) and list the change.

---

## M6-T09 CLI entry `bin/`, `src/cli/index.ts`: general rules, argument parsing, command table, exit codes 0/1/2, no prompts

- **Goal:** Replace the CLI stub by the real entry: global options, the command table, usage text, error printing, the command form, and the test helper.
- **Depends on:** M1-T46, M6-T08.
- **Kind:** `cli`. Size S. Group J.

### Read first

doc 07: `### 7.1 ` (6 kB), `### 7.2 ` (1.2 kB). This file 0.4, 0.5, 0.8.

### Files

Change: `src/cli/index.ts` (replace the stub). Create: `src/cli/index.test.ts`, `test/support/cli.ts`. Must not change: `bin/ripple.mjs`.

### Steps

1. Branch `task/M6-T09-cli-entry`.
2. `src/cli/index.ts` exports `CliIo`, `CommandRun`, `main`, `getPackageRoot`, `commandForm`, `detectPackageManager`, and `resolveHost` (below). Imports: `node:*`, `src/identity.ts`, and (lazily, see 3) the command modules. It ends with the statement of 0.8 and has no other top-level side effect.
3. Command table: `const COMMANDS: Record<string, () => Promise<{ run: CommandRun }>>` with exactly the ten keys `init`, `add`, `diff`, `upgrade`, `remove`, `status`, `check`, `docs`, `manifest`, `skills`. Until a command's module exists its entry is the stub

   ```ts
   const stub = async () => ({ run: (async () => 0) as CommandRun })   // PLAN 4.4: stub, replaced by the command's task
   ```

   written as `init: stub, // PLAN 4.4: M6-T15` (tasks: `init` M6-T15, `add` M6-T16, `diff` M6-T17, `upgrade` M6-T20, `remove` M6-T21, `status` M6-T22, `check` M6-T23, `docs` M6-T24, `manifest` M6-T25, `skills` M6-T26). A command task replaces its line by `<name>: () => import("./commands/<name>.ts"),`. The stubs keep the CI job `package-node20` (`node pkg/bin/ripple.mjs manifest`) green.
4. `main(argv, io)`:
   - Fill `io` defaults: `cwd: process.cwd()`, `packageRoot: getPackageRoot()`, `env: process.env`, `out: (line) => process.stdout.write(line + "\n")`, `err: (line) => process.stderr.write(line + "\n")`.
   - Split the global options out of `argv` before the command sees them: `--host <value>`, `--cwd <dir>` (replaces `io.cwd`, resolved against the current `io.cwd`), `--help` / `-h`, `--version` / `-v`, `--yes` (no effect). `--version`: print `<PKG_NAME> <VERSION>`, return 0. No command, or the command `help`: print the usage text, return 0. `<command> --help`: print the usage line of that command (the `text` block at the top of its section in doc 07; keep them in one constant `USAGE: Record<string, string>` copied from sections 7.4, 7.5, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13 and 9.2), return 0.
   - Usage text: the first line `Usage: ripple <command> [options]`, an empty line, then exactly these ten lines (the rows of the table of `### 7.2 `: the command cell without backticks, padded with spaces to 34 characters, or followed by two spaces when it is 34 characters or longer; then the "Purpose" cell without backticks). Store them as one constant; do not compute them from the doc:

     ```text
     ripple init                       Install core files and patches; write ripple.json; sync skills
     ripple add <component...>         Install components (and their dependencies) or blueprints
     ripple diff [component...]        Show how installed files differ from the running package
     ripple upgrade [component...]     Bring installed files to the running package's version, merging local edits
     ripple remove <component...>      Delete a component's files
     ripple status                     Print the computed lock
     ripple check [paths...]           Run the checker (section 9)
     ripple docs, ripple docs <component>, ripple docs <RULE>, ripple docs guide <topic>  Print documentation (7.11; positionals only)
     ripple manifest [component]       Print manifest JSON
     ripple skills sync, ripple skills check  Install or verify agent skills
     ```
   - Unknown command: `error: unknown command "<name>".` and `fix: run ripple help`, return 2.
   - A command's `run` parses its own options with `parseArgs({ args, options, strict: true, allowPositionals: true })`. `main` wraps the call in `try`/`catch`: an error thrown by `parseArgs` (its `code` starts with `ERR_PARSE_ARGS`) prints `error: <message>` and returns 2; any other thrown `Error` prints `error: <message>` and returns 2 (commands throw only for usage and environment errors; findings are return values).
   - Rule 11 (version mismatch warning): after the command is known and before it runs, when `<cwd>/node_modules/<PKG_NAME>/package.json` exists and its `version` differs from `VERSION`, print the `warning:` line of rule 11.
   - Never read standard input. Never print ANSI codes (V1 prints plain text only, which satisfies rule 4).
5. `getPackageRoot()`: the directory two levels above the file of `import.meta.url` (`dirname(dirname(dirname(fileURLToPath(import.meta.url))))`).
6. `detectPackageManager(cwd, env)` and `commandForm(io, host)`: rule 12 of `### 7.1 `, in that order (the `packageManager` field; lockfiles `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `bun.lockb` or `bun.lock`; the first word of `npm_config_user_agent` before `/`; else `npm`). Result: `npx <PKG_NAME>@<VERSION>` when `host` is `liquid` or `<cwd>/package.json` does not exist; `npx ripple` for npm; otherwise `<pm> exec ripple`.
7. `resolveHost(io, flag): Host` (used by every command that needs a host): calls `detectHost(io.cwd, flag)` of `./detect-host.ts`; on `ok: false` throws `Error(message)`; when the host is `liquid` calls `validateTheme(io.cwd)` and throws its message when it is a string.
8. `test/support/cli.ts`: `runCli` and `tempDir` of 0.8 (`runCli` REQUIRES `packageRoot` until M6-T15 adds the default).
9. Tests, `src/cli/index.test.ts` (package root: a temporary directory holding only `manifest.json` with `{}`):
   - `[T1] index: no command prints the usage table and exits 0` (the output contains one line starting with `ripple <name>` for each of the ten names `init`, `add`, `diff`, `upgrade`, `remove`, `status`, `check`, `docs`, `manifest`, `skills`).
   - `[T1] index: help prints the same text`.
   - `[T1] index: --version prints the package name and version`.
   - `[T1] index: an unknown command exits 2 with the error format`.
   - `[T1] index: --yes is accepted and has no effect`.
   - `[T1] index: commandForm is npx with the version when there is no package.json`.
   - `[T1] index: commandForm follows the packageManager field` (`pnpm@10.28.0` gives `pnpm exec ripple`).
   - `[T1] index: commandForm for npm is npx ripple` (`package-lock.json`).
   - `[T1] index: commandForm for liquid is npx with the version even with a package.json`.
   - `[T1] index: the module has one top-level side effect` (read `src/cli/index.ts`; its last non-empty line equals the statement of 0.8).
10. Proof: PLAN 5.0. Also `node pkg/bin/ripple.mjs --version` prints `<PKG_NAME> <VERSION>` (today `ripple-kit 0.1.0`) and `node pkg/bin/ripple.mjs manifest; echo $?` prints `0`.

### Acceptance

The ten tests pass. The two commands of step 10 give the stated output after `pnpm build`. `grep -c "PLAN 4.4" src/cli/index.ts` prints the number of commands still stubbed plus one (the `stub` line).

### Out of scope

Every command body. Plan printing (M6-T10). `--host`'s effect inside commands beyond `resolveHost`.

### If blocked

- Test A-05 or the build's export check lists exports of `dist/cli/index.mjs`: the CLI entry is not a package export (doc 01 section 6.4); when a check fails on the new exports, read the failing check and report; do not remove `main`.
- `import.meta.url` is rewritten by the bundler in a test bundle so that the guard is true in tests: the guard compares a string suffix; print `import.meta.url` once in a test to see it, then report. Do not replace the guard by an environment variable.

---

## M6-T10 Install plan `src/cli/plan.ts` and `src/cli/composite.ts`

- **Goal:** Add the per-file decision table `planFile`, the plan entry model, the plan printer and the writer, and connect them to the Liquid composite stylesheet.
- **Depends on:** M6-T02, M6-T04, M6-T06, M6-T07.
- **Kind:** `cli`. Size M.

### Read first

doc 07: `### 8.1 ` (table and rules 1 to 8, 4 kB; the code block is extracted), rules 7 and 8 of `### 7.1 ` (2 kB), `### 4.3 ` only the paragraph "Target aliases" (0.5 kB), the last three paragraphs of `### 4.6 ` (1 kB), `### 4.5 ` rules 1 to 5 (1 kB), `### 5.2 ` item 3 and 4, `#### 7.6.1 ` (1.5 kB), acceptance item 8 in `## 12. `. This file 0.5, 0.7. Repository: `grep -n "^export" src/cli/plan.ts src/cli/composite.ts src/cli/trailer.ts src/cli/config.ts`.

### Files

Change: `src/cli/plan.ts`, `src/cli/plan.test.ts`. Must not change: `src/cli/composite.ts`, `src/cli/trailer.ts`.

### Steps

1. Branch `task/M6-T10-plan`. Extract:

   | Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
   |---|---|---|---|---|---|---|
   | `node_modules/.cache/ripple/planfile.ts` | `docs/07-manifest-registry-cli.md` | `### 8.1 ` | `ts` | 0 | 2927 | `// src/cli/plan.ts - the upgrade decision table for one owned file.` |

   Append it to `src/cli/plan.ts` unchanged (merge the import lines). It imports `merge3` from `./merge3.ts`. Before step 1, check `test -f docs/plan/done/M6-T18.md`: when it fails, this task cannot start (the table does not list M6-T18 yet; reported to the core plan); do not stub `merge3`; pick another task.
2. Composite regions in `scanProject` (replace the marker `PLAN 4.4: composite regions are added by M6-T10`): for host `liquid`, when `assets/ripple.css` exists, call `parseComposite`; for every region segment call `parseFile(segment.content)`; a managed result gives a `ScannedFile` with `path: "assets/ripple.css#<region id>"`. A region whose content has no trailer is skipped.
3. Add the functions of 0.5 with these behaviours:
   - `loadRegistry(packageRoot)`: 0.5.
   - `resolveTarget(target, config, liquidPrefix)`: `@components/` becomes `paths.components + "/"`, `@styles/` `paths.styles + "/"`, `@public/` `paths.public + "/"`, `@pages/` `paths.pages + "/"`; the literal `@css` becomes `config.css`; a Liquid target `blocks/<name>.liquid` becomes `blocks/<liquidPrefix><name>.liquid`; snippet names never take the prefix.
   - `readLiquidPrefix(scan, flag)`: the last paragraph of `### 4.6 `. Mixed prefixes throw `Error('mixed block file prefixes: "<a>" and "<b>".')`. A `flag` that does not match `^[a-z]+-$` throws `Error("--prefix must match ^[a-z]+-$.")`; a `flag` that differs from the prefix of installed files throws `Error('--prefix "<flag>" differs from the installed prefix "<installed>".')` (doc 07 gives the exit code 2 for both and no wording).
   - `planOwnedFiles(files, context, options)`: for each `RegistryFile` with mode `owned` or `library` and a non-null `source`: read the body from `<packageRoot>/<source>`; compute the project path with `resolveTarget`; apply `installTransform` (host, `index.package.name`, `index.liquidBlocks`, `liquidPrefix`, the project path, `config?.paths.components ?? ""`); find the local text: the scanned file with the same trailer id whose path equals the target, else the first scanned file with that id in path order (`### 5.2 ` item 4), else the file at the target path when it exists (it then has no trailer); call `planFile(local, next, (version) => context.getBase?.(trailerPkg, version, id), { ...options, blueprint: file.type === "blueprint" })`. For mode `library` pass `theirs: true` (rule 1 of 8.1) and, when the result is row 6, add the message `warning: <path> is a library file; your edits were replaced.` Build `content` with `stamp(syntaxForPath(path), id, index.package.name, index.package.version, next, body)` (rule 8 of 8.1) when the plan has a `body`; for a composite region the syntax is `block-comment` and `content` is the region content.
   - `derivedEntries(context, tokensCss, componentIds)`: the table of `#### 7.6.1 `. npm hosts: `@styles/props.css` from `generatePropsCss(tokensCss)`, `@styles/theme.css` from `generateThemeCss(tokensCss)`, each stamped with id `core/props` or `core/theme`, the running version and the hash of the generated body (rule 8 of `### 5.1 `); `@styles/ripple.css` from `renderCssEntry` (no trailer; it is a marker-region file). Liquid: the region `core/props` of `assets/ripple.css`. Action: `unchanged` when the generated text equals the local text, else `regenerate`; when the local body differs from its own trailer hash add the message `warning: <path> is generated from tokens.css; your edits were replaced. Edit tokens.css instead.`
   - `formatPlan(header, entries)`: rule 8 of `### 7.1 `: the header line as given; one line per entry sorted by path: two spaces, the action padded with spaces to 18 characters, two spaces, the path; the summary line `<w> written, <u> unchanged, <m> merged, <c> conflicts.` with the four counting rules of that rule; then every `messages` line of every entry in entry order.
   - `exitCodeOf(entries)`: `1` when any action is `merge-conflict`, `needs-base`, `conflict-unmanaged` or `patch-failed`; else `0`.
   - `applyPlan(root, entries)`: rule 7 of `### 7.1 `. When any entry is `conflict-unmanaged`, write nothing. Otherwise for each entry with `content`: create the parent directory with `mkdirSync(dir, { recursive: true })`, write `<target>.ripple-tmp`, `renameSync` over the target; for `remove: true` delete the file. All entries whose path starts with `assets/ripple.css#` are applied together: read the file (or `emptyComposite()`), apply `setRegion(segments, id, content ?? null)` per entry (`null` for a removal), write once. A failed rename throws `Error("could not write <path> (<code>).")`. Also export `removeLeftovers(root)`: deletes every `*.ripple-tmp` file found by the walk of `scanProject`.
4. Tests in `src/cli/plan.test.ts`:
   - `[T1] plan: planFile row <n> <action>` for n = 1, 2 (both with and without `force`), 3, 4, 5, 6, 7, 8 (base unavailable; base with another hash), 9, 9a (`blueprint: true` gives `keep-local`, row 9, with any flag), 10, 11 (with and without `writeConflicts`): eleven tests (acceptance item 8; rows 12 and 13 belong to M6-T20).
   - `[T1] plan: scanProject returns the regions of assets/ripple.css on liquid`.
   - `[T1] plan: resolveTarget replaces the four aliases and applies the block prefix`.
   - `[T1] plan: readLiquidPrefix reads rp- from blocks/rp-button.liquid` and `[T1] plan: readLiquidPrefix rejects mixed prefixes`.
   - `[T1] plan: formatPlan prints the example of 7.1 rule 8` (the five file lines and the summary `3 written, 1 unchanged, 0 merged, 0 conflicts.` of that example; the example's entries are `add`, `add`, `unchanged`, `regenerate`, `patch`. Note: the example counts 3 written for 4 writing actions; when your output says `4 written`, keep the counting rules of rule 8 and assert `4`, and record the example's count under `## Ledger issues` of doc 07).
   - `[T1] plan: applyPlan writes nothing when one entry is conflict-unmanaged` (compare a directory listing before and after).
   - `[T1] plan: applyPlan writes through a temporary file and leaves none behind`.
   - `[T1] plan: applyPlan inserts, replaces and removes composite regions in one write`.
   - `[T1] plan: a modified library file is overwritten with a warning`.
   - `[T1] plan: derivedEntries is unchanged on a fresh install and regenerate after tokens.css changes`.
5. Proof: PLAN 5.0.

### Acceptance

`pnpm test:unit --files=src/cli/plan` exits 0 with the tests above. `grep -rn "composite regions are added by M6-T10" src/` prints nothing.

### Out of scope

Patches (M6-T11, M6-T12). Base retrieval (M6-T19; `getBase` is a parameter here). Commands. Rows 12 (the warning text is here; the `upgrade` wiring is M6-T20) and 13.

### If blocked

- The task proves too large: finish steps 1 to 3 up to `planOwnedFiles` with their tests, open the pull request as a draft naming the missing functions (`derivedEntries`, `formatPlan`, `applyPlan`), and report that the table needs a follow-up row. Do not stub.
- `generatePropsCss` or `generateThemeCss` has another signature than `(tokensCss: string) => string`: use what `src/gen/` exports and record it.

---

## M6-T11 Patches for npm hosts: `core/patch:css-entry`, `core/patch:agents`, `core/patch:package-json`

- **Goal:** Add the three patches that `init`, `add`, `upgrade` and `remove` apply on `html`, `react` and `remix` (the agents patch also on `liquid`).
- **Depends on:** M6-T10. `patchAgents` also needs `renderAgentsSection` of M6-T13, which the table does not list yet (reported to the core plan): when `docs/plan/done/M6-T13.md` does not exist, this task cannot start; pick another task.
- **Kind:** `cli`. Size S.

### Read first

doc 07: the first paragraph of `### 7.6 ` (0.4 kB), `#### 7.6.2 ` (1 kB), `#### 7.6.5 ` (1 kB), `#### 7.6.6 ` (0.6 kB), the "patch `state`" row of the field table in `### 5.3 `. doc 08: `### 3.1 ` (2 kB). This file 0.5, PR-M6-1.

### Files

Create or append: `src/cli/commands/init.ts`, `src/cli/commands/init.test.ts`. Change: `src/architecture.test.ts` (PR-M6-1, one entry).

### Steps

1. Branch `task/M6-T11-patches-npm`. Apply PR-M6-1 in `src/architecture.test.ts` (ratified by D-146; no ledger-issue line).
2. Each patch function returns one `PlanEntry` with `id` the patch id and action `patch` (the target changes; `content` is the new file text), `patch-skipped` (nothing to write and not an error) or `patch-failed` (anchor not found; `messages` holds the line `add this line to <file> <where>:` followed by the exact line). It reads files but writes nothing.
3. `patchCssEntry(context)` (`#### 7.6.2 `): skipped when `config.css` is `null`. `R` is the relative POSIX path from the entry's directory to `paths.styles`, starting with `./`. Rules 1 to 3 literally, with the three regular expressions printed there. Rule 3 gives `patch-failed` with the instruction `move @import "<R>/ripple.css"; to the first line of <css>`.
4. `patchAgents(context, installed, blueprints)` (`#### 7.6.5 `): target `AGENTS.md` at the project root. Build `AgentsSectionInput` (doc 08 `### 3.1 `): `pkg` = `index.package.name`; `command` = `commandForm(io, host)`; `version`; `host`; `installed` = for each installed component id, from `<packageRoot>/manifest.json`: `name`, `title`, `kind`, `summary`, `liquidBlock` (the manifest `liquid.block`, or `null`), sorted by the sorting rule of doc 08 section 2.1 (category order, then name); `blueprints`; `hasShell: true`. Body = `renderAgentsSection(input)`. File absent: the content is the region only. Markers absent: the existing text, one blank line, the region. Markers present: replace from the line `<!-- ripple:start agents -->` to the line `<!-- ripple:end agents -->` in place. Equal result: `patch-skipped`. Host `liquid` and the resulting file larger than 50,000 bytes: `patch-failed`, nothing written.
5. `patchPackageJson(context, pins)` (`#### 7.6.6 `): skipped when there is no `package.json`. Add to `dependencies`, only when the name is in neither `dependencies` nor `devDependencies`: `"<pkg>": "<running version>"` and `"@shopify/hydrogen": "<manifest.pins value>"`; sort the keys of `dependencies` in ascending byte order; rewrite with the detected indentation (the leading whitespace of the file's second line; default two spaces) and one trailing newline.
6. `patchState(id, context)` for these three ids: `present` when the function returns `patch-skipped` because the content is already there; `stale` when a marker region exists and differs (`core/patch:agents`); `absent` when not applied; `skipped` for `core/patch:css-entry` with `css: null` and for `core/patch:package-json` without `package.json`.
7. Tests, `src/cli/commands/init.test.ts`:
   - `[T1] init: css-entry inserts the ripple import before the first statement` (a file starting with a comment and `@charset`).
   - `[T1] init: css-entry inserts theme.css after the tailwind import` (`app/styles/app.css` containing `@import "tailwindcss";` gives the three-line entry of doc 03 section 5.2 with `R` computed).
   - `[T1] init: css-entry is skipped when css is null`.
   - `[T1] init: css-entry fails when the ripple import is not first, and names the move`.
   - `[T1] init: css-entry applied twice is patch-skipped`.
   - `[T1] init: agents patch creates, appends and replaces` (the three cases of doc 08 K-13; bytes outside the markers unchanged).
   - `[T1] init: agents patch fails above 50000 bytes on liquid`.
   - `[T1] init: package-json adds two sorted dependencies and keeps the indentation` (a tab-indented file stays tab-indented).
   - `[T1] init: package-json does not add a name that is a devDependency`.
8. Proof: PLAN 5.0.

### Acceptance

The nine tests pass. `pnpm test:unit --files=src/architecture` exits 0 (the import rule accepts `src/cli/commands/init.ts` importing `src/gen/agents-md.ts`).

### Out of scope

The Liquid patches (M6-T12). The `run` function of `init` (M6-T15). RP505, RP406, RP510 (M6-T29, M6-T31).

### If blocked

`renderAgentsSection` needs the manifest type from `src/types.ts` only; when `src/gen/agents-md.ts` imports another `src/gen` file, PR-M6-1 does not hold: move the needed constant into `agents-md.ts` (M6-T13 owns that file) or stop and report.

---

## M6-T12 Patches for Liquid: `core/patch:head`, `core/patch:import-map`, `core/patch:theme-reference`, `core/patch:settings`, `core/patch:locale`

- **Goal:** Add the five patches that `init`, `add` and `upgrade` apply to a Liquid theme.
- **Depends on:** M6-T05, M6-T10, M6-T11.
- **Kind:** `cli`. Size M.

### Read first

doc 07: the first paragraph of `### 7.6 `, `#### 7.6.3 ` (4.5 kB), `#### 7.6.4 ` (2 kB), the "patch `state`" row of `### 5.3 `, acceptance items 11c and 19 in `## 12. `, "### Fallback (SPIKE-03)" (1 kB). doc 14: `### 6.2 ` rule 4 only. This file 0.5.

### Files

Create or append: `src/cli/commands/init.ts`, `src/cli/commands/init.test.ts`.

### Steps

1. Branch `task/M6-T12-patches-liquid`. Entry model: M6-T11 step 2 (restated: each function returns a `PlanEntry` with action `patch`, `patch-skipped` or `patch-failed`; it reads but never writes).
2. `patchHead(context)`: `#### 7.6.3 ` first paragraph. File absent: `patch-skipped` with the message `note: layout/theme.liquid does not exist; core/patch:head was skipped. Add the layout with: <command form> add --blueprint layout`. Already present (`/\{%-?\s*render\s+'rp-head'/`): `patch-skipped`. Otherwise insert the line `{% render 'rp-head' %}` with the indentation of the anchor line at the first anchor that exists, in the order 1, 2, 3 printed there (after the first `render 'import-map'` line; before the first line containing `stylesheet_tag`; before the first line containing `{{ content_for_header }}`). No anchor: `patch-failed`.
3. `patchImportMap(context)`: second paragraph. The inserted line is `{% render 'rp-import-map-entries' %}`, indented two spaces more than the anchor line, immediately after the first line matching `/"imports"\s*:\s*\{/`, in the first of `snippets/import-map.liquid`, `layout/theme.liquid` that contains the text `<script type="importmap">`. Messages and the `patch-failed` instruction: as printed.
4. `patchThemeReference(context, tokensCss)`: third paragraph. Declare `export const THEME_REFERENCE_PATCH = true` (the SPIKE-03 switch; do not implement the `false` branch). Skipped when `config/styles.css` does not exist or does not match `/@import\s+["']tailwindcss["']/`. The region is `/* ripple:start theme */`, `generateThemeCss(tokensCss)`, `/* ripple:end theme */`; appended after one blank line when absent, replaced in place when present. `tokensCss` is the body of the region `core/tokens` (after this run's plan).
5. `patchSettings(context)`: the six numbered rules. The group is read from `<packageRoot>/registry/liquid/settings.json`. Rule 3 note, exactly: `note: this theme already has a color_palette setting ("<id>"); rp_palette was not added. Ripple colours stay at their tokens.css values until you map them in snippets/rp-tokens.liquid.` Rule 1: file absent gives `patch-failed` with `create config/settings_schema.json (14-liquid-theme.md section 6.1)`. Output: two-space indentation, one trailing newline.
6. `patchLocale(context, owners): PlanEntry[]` (`#### 7.6.4 `), one entry per locale file changed or created, all with the patch id of the owner (`core/patch:locale`, `<id>/locale`, `blueprint.<id>/locale`; when one file receives keys of several owners use ONE entry whose `id` is `core/patch:locale`). Sources: `registry/liquid/locales/core.json`, `<id>.json` per installed component, `blueprint.<id>.json` per installed blueprint. Rules 1 to 6 literally: strip and restore a leading `/* ... */` comment block; add missing key paths only, never change or remove a value; non-default locale files receive the English text; two-space indentation and one trailing newline; existing keys keep their position, new keys are appended in source order; when the theme has no `locales/*.schema.json`, create `locales/en.default.schema.json`; when it has no storefront locale file, create `locales/en.default.json`. Everything is merged under the single top-level key `ripple`.
7. `patchState` for the five ids: the "patch `state`" row of `### 5.3 ` and rule 6 of `core/patch:settings`. `skipped`: `core/patch:theme-reference` without `config/styles.css`; `core/patch:head` and `core/patch:import-map` when their target file does not exist.
8. Tests, `src/cli/commands/init.test.ts`:
   - `[T1] init: head patch uses anchor 1, then 2, then 3` (three small layouts; the theme-min layout has only anchor 3).
   - `[T1] init: head patch keeps the indentation of the anchor line`.
   - `[T1] init: head patch is skipped with a note when the layout does not exist`.
   - `[T1] init: head patch fails without an anchor`.
   - `[T1] init: import-map patch inserts after the imports line, two spaces deeper`.
   - `[T1] init: import-map patch is skipped when no file exists and fails when no file has an import map`.
   - `[T1] init: theme-reference region is appended, then replaced in place`.
   - `[T1] init: theme-reference is skipped without a tailwind import`.
   - `[T1] init: settings patch on [] writes the group with rp_palette` (item 11c).
   - `[T1] init: settings patch drops rp_palette when another color_palette exists and prints the note` (a group with a setting `{ "type": "color_palette", "id": "color_palette" }`).
   - `[T1] init: settings patch replaces an existing Ripple group as a whole`.
   - `[T1] init: locale patch adds missing keys to every locale file and keeps edited values` (item 19: `locales/en.default.json` and `locales/fr.json` get the same key paths under `ripple.<id>`; a value edited in `fr.json` survives a second run).
   - `[T1] init: locale patch keeps a leading comment block`.
   - `[T1] init: locale patch creates en.default.schema.json when the theme has no schema locale`.
9. Proof: PLAN 5.0.

### Acceptance

The fourteen tests pass. `grep -c "THEME_REFERENCE_PATCH = true" src/cli/commands/init.ts` prints `1`.

### Out of scope

The fallbacks of SPIKE-02 and SPIKE-03 (M10-T06). `snippets/import-map.liquid` itself (blueprint `layout`, M7). Removing locale keys (never: rule 5).

### If blocked

- SPIKE-03 or SPIKE-02 has no report yet: implement the default path above. The fallbacks are the sections "Fallback (SPIKE-03)" and "Fallback (SPIKE-02)" of doc 07, applied only by M10-T06.
- `registry/liquid/settings.json` is missing from the fixture package root: M6-T05 is not done; stop.

---

## M6-T13 Generator `src/gen/agents-md.ts` (the `AGENTS.md` section)

- **Goal:** Add `renderAgentsSection`, the pure function that prints the Ripple region of a project's `AGENTS.md`.
- **Depends on:** M6-T01.
- **Kind:** `gen`. Size S.

### Read first

doc 08: `## 3. ` whole: `### 3.1 `, `### 3.2 `, `### 3.3 `, `### 3.4 ` (13 kB); the "Sorting rule" paragraph of `### 2.1 `. This file PR-M6-1.

### Files

Create: `src/gen/agents-md.ts`, `src/gen/agents-md.test.ts`.

### Steps

1. Branch `task/M6-T13-agents-md`.
2. `src/gen/agents-md.ts` imports nothing except type-only imports from `src/types.ts` (PR-M6-1). Exports exactly: `AgentsSectionInput`, `renderAgentsSection`, `AGENTS_SECTION_MAX_BYTES` (12000), `UNIVERSAL_RULES` (the ten lines of block B with the token `{command}` in line 10), declared as doc 08 `### 3.1 ` prints them.
3. Content: blocks A to E of `### 3.2 `, in order, separated by one blank line; copy every literal line from the fenced blocks of that section (four variants of block C: `liquid` 15 rules, `react` 8, `remix` 7, `html` 6). Substitutions: `<version>`, `<pkg>`, `<host>`, `<command form>` = `input.command`. In blocks C, `<paths.components>` and `/ripple/ripple.js` are NOT known to this function (`AgentsSectionInput` has no paths): print the literal text `<paths.components>` replaced by the words `the components directory of ripple.json` is NOT allowed; instead keep the literal placeholders exactly as the spec prints them (`<paths.components>`, `/ripple/ripple.js`) and record the gap under `## Ledger issues` of doc 08 (`AgentsSectionInput has no paths; block C placeholders are printed literally`).
4. Block D line format: `- <call name> (<kind>): <summary>`; `<call name>` is `liquidBlock` on `liquid` (for Icon the text `rp-icon snippet`), the component `title` otherwise. The last block D lines: `Blueprints installed: <comma-separated ids, or "none">.` and the `Not installed yet?` line.
5. Block E: on hosts other than `liquid`, item (3) is `(3) no custom element tag written by hand`.
6. Size rule: the four steps of `### 3.3 `, in order; throw `Error("AGENTS.md section is <n> bytes; limit 12000")` when step 4 still exceeds the limit. Step 4 needs each component's category: `installed[]` has no `category` field; group by `kind` instead ONLY when no category is available, and record it under `## Ledger issues` of doc 08.
7. Tests, `src/gen/agents-md.test.ts`, ids of `### 3.4 `: `[T1] agents-md: K-10 ...` (render per host with every component of the repository's manifest installed; at most 12,000 bytes; starts with `<!-- ripple:start agents -->\n`; ends with `<!-- ripple:end agents -->\n`), `[T1] agents-md: K-11 ...`, `[T1] agents-md: K-12 ...`, `[T1] agents-md: K-14 ...`, `[T1] agents-md: K-16 ...`. K-13 is the patch test of M6-T11; write the comment line `// K-13: src/cli/commands/init.test.ts (M6-T11)`. K-15 is an eval (M8); write `// K-15: eval, not gating`. Add `[T1] agents-md: the size rule falls through steps 1 to 4 and then throws` with synthetic inputs of 84, 300 and 3000 components.
8. Proof: PLAN 5.0.

### Acceptance

The six tests pass. `grep -c "^import" src/gen/agents-md.ts` prints `0` or only lines starting with `import type`.

### Out of scope

Writing `AGENTS.md` (M6-T11). The `ripple` skill that shares `UNIVERSAL_RULES` (M8-T07). The acceptance run with all 84 components (M8-T21).

### If blocked

K-10 exceeds 12,000 bytes with the components present: the size rule is wrong, not the limit; fix the rule.

---

## M6-T14 Generator `src/gen/docs.ts`: `docs/components/<id>.md`, `docs/INDEX.md`, `docs/llms.txt`, `docs/rules/<RULE>.md` in `pkg/`

- **Goal:** Add the four pure page renderers and make build step 8 write `pkg/docs/`.
- **Depends on:** M6-T01.
- **Kind:** `gen`. Size M.

### Read first

doc 08: `### 2.1 ` (3 kB), `### 2.2 ` (2.5 kB), `### 2.3 ` (1 kB), `### 2.4 ` (4 kB), `### 2.6 ` (1 kB), `### 2.8 ` (2 kB), the frontmatter block of `### 2.5 ` (0.3 kB). doc 13: in `### 7.3 ` the function `liquidCaseSource` and its helpers, in `### 7.4 ` the function `caseJsx` and its helpers (3 kB). This file PR-M6-6.

### Files

Create: `src/gen/docs.ts`, `src/gen/docs.test.ts`. Change: `src/gen/build.ts` (step 8: replace the `build: skipped` line for `docs`).

### Steps

1. Branch `task/M6-T14-docs`.
2. `src/gen/docs.ts` exports exactly `GuideMeta`, `RuleDoc`, `renderIndex`, `renderLlmsTxt`, `renderComponentDoc`, `renderRuleDoc`, with the signatures of the `ts` block of `### 2.1 `. It imports types from `src/types.ts`, `VERSION` and `PKG_NAME` from `src/identity.ts`, and nothing from `src/check/`.
3. Shapes: copy the fenced `markdown` blocks of `### 2.2 `, `### 2.3 `, `### 2.4 `, `### 2.6 ` as the literal templates. `<command form>` is `npx <pkg>` (rule I-1; the package name is written `__PKG__` in source and replaced by the build, or read from `PKG_NAME`: use `PKG_NAME`). Rules I-1 to I-5, C-1 to C-5, the sorting rule of `### 2.1 `, the fence-language rule of `### 2.6 `. Every generated file ends with exactly one newline, uses LF, has no trailing spaces.
4. Example calls (rule C-2, PR-M6-6): `renderComponentDoc` prints the TSX and Liquid calls of a fixture with two PRIVATE functions that are line-for-line copies of `caseJsx` (without the children tokenisation: children are printed as they are) and `liquidCaseSource` of doc 13. They are not exported. A resource prop is printed as those emitters print it (`RES["product.basic"]`, `rp_product_basic`). The test of step 6 proves the copies equal the conformance emitters.
5. `src/gen/build.ts` step 8: for every manifest component whose `status` is not `planned` write `pkg/docs/components/<name>.md`; write `pkg/docs/INDEX.md` and `pkg/docs/llms.txt`; for every rule of `rules` (`src/check/rules/index.ts`) build `RuleDoc` as `{ ...rule.meta, ...text }` from the two exports of `src/check/rules/<RULE>.ts` and write `pkg/docs/rules/<id>.md`; copy `guides/*.md` to `pkg/docs/guides/` when `guides/` exists and read each guide's frontmatter into `GuideMeta` (while `guides/` does not exist keep the line `build: skipped guides (PLAN 4.4)`; M8 removes it). A rule file that lacks the `text` export fails the build with `build: src/check/rules/<RULE>.ts has no text export`.
6. Tests, `src/gen/docs.test.ts` (ids of `### 2.8 `; subject `docs`):
   - `[T1] docs: K-03 index and llms.txt list the same components, guides and rules` (render both from the repository's manifest, two synthetic guides and two synthetic rules).
   - `[T1] docs: K-04 an index above 40000 bytes throws` (150 synthetic components with 140-character summaries; message `INDEX.md is <n> bytes; limit 40000`).
   - `[T1] docs: K-05 every html example equals a fixture file` (for every component in the repository).
   - `[T1] docs: K-08 a rule page prints bad and good` (for every rule in `rules`: both non-empty and different).
   - `[T1] docs: planned components are omitted and beta is marked`.
   - `[T1] docs: a pipe in a cell is escaped`.
   - `[T1] docs: component page sections are in the fixed order and empty sections are omitted, except Props`.
   - `[T1] docs: example calls equal the conformance emitters` (import `liquidCaseSource` from `test/support/hosts/liquid.ts` and `caseJsx` from `test/support/hosts/tsx.ts`; for every fixture printed in a page, the Liquid block text equals `liquidCaseSource(case)`, and the TSX block text equals `caseJsx(case, "react").jsx` after each `__RP_CHILDREN_<n>__` token is replaced by its fragment).
   - `[T1] docs: generated files end with one newline and have no trailing spaces`.
   - Comment lines for the ids that need `pkg/` or all components: `// K-01, K-02, K-06, K-07, K-09: need pkg/ and the 84 components; M8-T01 and M8-T21`.
7. Proof: PLAN 5.0. `ls pkg/docs/components | wc -l` equals the number of non-planned components; `ls pkg/docs/rules | wc -l` equals `ls src/check/rules/RP*.ts | grep -vc test`.

### Acceptance

The nine tests pass. `pnpm build` prints no `build: skipped` line containing `docs`. `grep -rL "^# " pkg/docs/components/*.md` prints nothing. `grep -rn "__PKG__" pkg/docs | wc -l` prints `0`.

### Out of scope

The guides (M8-T04 to M8-T06). `meta.expected.json` and K-31 to K-36 (M8-T01). `ripple docs` (M6-T24). `docs/` of the repository (the specs): never written.

### If blocked

- A manifest key the page template names (`useWhen`, `dontUseWhen`, `a11y.*`, `events`, `commands`) is absent from a component: the section is omitted (rule "a section whose source is empty is omitted").
- The equality test of step 6 fails for a fixture with parts or resources: the private copy drifted from doc 13; copy again. Do not special-case a component.

---

## M6-T15 Command `ripple init`

- **Goal:** Add `ripple init` for the four hosts: core files, patches, `ripple.json`, skills, next-step lines; idempotent.
- **Depends on:** M6-T03, M6-T08, M6-T09, M6-T11, M6-T12, M6-T13, M6-T07, M6-T10, M6-T26.
- **Kind:** `cli`. Size M.

### Read first

doc 07: `### 7.4 ` (3.6 kB), `### 4.4 ` (5.4 kB), the `initialized` row of `### 5.3 `, the last paragraph of `### 7.3 ` (0.8 kB), acceptance items 11b (first half), 11e, 17, 18 in `## 12. `. This file 0.5, 0.8. Repository: `grep -n "^export" src/cli/plan.ts src/cli/commands/init.ts src/cli/commands/skills.ts`.

### Files

Change: `src/cli/commands/init.ts` (add `run`), `src/cli/index.ts` (the `init` line of the command table), `test/support/cli.ts` (add the three helpers), `src/cli/commands/init.test.ts`.

### Steps

1. Branch `task/M6-T15-init`.
2. `test/support/cli.ts`:
   - `fixturePackageRoot()`: once per process, under `node_modules/.cache/ripple/cli-test/pkg-<process.pid>/`: call `buildRegistry(dir)` (M6-T01; create `registry/liquid/assets/` with the six file names of doc 07 section 4.4, each holding `// stub\n`, BEFORE the call); create `browser/` with the same six names; write `manifest.json` as `JSON.stringify(assembleManifest(loadSources()), null, 2) + "\n"`; create `skills/fixture-skill/SKILL.md` (frontmatter `name: fixture-skill`, `description: Fixture. Use when testing.`, one body line) and `skills/fixture-skill/ripple.json` (`{ "hosts": ["html", "react", "remix", "liquid"] }`), then rebuild `registry/index.json` so that `skills` lists it; create `docs/INDEX.md` holding `# index\n`. Return the directory. `runCli` uses it as the default `packageRoot`.
   - `tempProject(kind)`: `theme`: a copy of `test/fixtures/theme-min/`; `react`: `package.json` with `{"name":"p","dependencies":{"react":"19.0.0"}}` and `app/styles/app.css` holding `@import "tailwindcss";\n`; `remix`: `package.json` with `{"name":"p","dependencies":{"remix":"3.0.0"}}` and an empty `app/` directory; `html`: `package.json` with `{"name":"p"}`; `empty`: nothing.
   - `treeHash(dir)`: 0.8.
3. `run` for npm hosts, the seven numbered steps of "Behaviour, npm hosts" in `### 7.4 `:
   1. `resolveHost`; `removeLeftovers`.
   2. `ripple.json`: absent: `defaultConfig(cwd, host, flags)`, planned as an entry with action `add`, path `ripple.json`, `id: null`, content `JSON.stringify(config, null, 2) + "\n"`. Present: `readConfig`; a path flag (`--components`, `--styles`, `--public`, `--pages`, `--css`) whose value differs from the file throws `Error("ripple.json already exists. Edit it instead of passing --<flag>.")`.
   3. `planOwnedFiles(index.core[host], ...)` with all options `false`; `derivedEntries` with the body of the planned `tokens.css` (the local body when the file exists, else the registry body) and the installed component ids.
   4. `patchCssEntry`, `patchPackageJson`, `patchAgents`.
   5. Print `formatPlan(header, entries)`; header `ripple init  (host: <host>, <pkg>@<version>)`, plus ` [dry run]` with `--dry-run`. Unless `--dry-run`: `applyPlan`.
   6. Unless `--dry-run` and unless the plan has a `conflict-unmanaged` entry: `syncSkills(io, host, { force: false, dryRun: false })`; print its `lines`.
   7. The `next: ` lines of step 7, exactly those that apply, in the order printed there.
4. `run` for `liquid`, the six numbered steps of "Behaviour, `liquid`": `readLiquidPrefix(scan, flags.prefix)`; the core files of `index.core.liquid` (three regions of `assets/ripple.css`, six JavaScript assets, four snippets); the patches `patchHead`, `patchImportMap`, `patchThemeReference`, `patchSettings`, `patchLocale` (owner `core`), `patchAgents`; apply; `syncSkills`; then the `note:` line about `config/styles.css` when this run changed that file, then `next: add components with: npx <pkg>@<version> add <component>`.
5. Return value: `exitCodeOf(entries)`. Options are parsed with `parseArgs` (strict): `prefix`, `components`, `styles`, `public`, `pages`, `css` (strings), `dry-run` (boolean).
6. Tests, `src/cli/commands/init.test.ts` (through `runCli`):
   - `[T1] init: liquid in an empty directory needs --host and plans six assets, four snippets, and skips the head and import-map patches` (item 11b first half: `tempProject("empty")` with `config/settings_schema.json` holding `[]`; exit 0; plan lines for `assets/ripple.js` and the five `assets/ripple-*.js`, the four `snippets/rp-*.liquid`; both patches `patch-skipped`).
   - `[T1] init: liquid on theme-min inserts the head line and exits 0`.
   - `[T1] init: remix writes six js files under paths.public and ripple.json with paths.pages app/pages` (item 11e).
   - `[T1] init: react writes no js file and paths.pages is src/pages` (item 11e).
   - `[T1] init: a second run on theme writes nothing` (item 18 on `tempProject("theme")`: `treeHash` equal before and after the second run; every plan line of the second run is `unchanged` or `patch-skipped`).
   - `[T1] init: a second run on react writes nothing` (the same on `tempProject("react")`).
   - `[T1] init: --dry-run writes nothing and marks the header`.
   - `[T1] init: an untrailered file at a target path gives conflict-unmanaged, exit 1, and no write` (`snippets/rp-head.liquid` exists without a trailer).
   - `[T1] init: a path flag that differs from ripple.json exits 2`.
   - `[T1] init: the next lines of 7.4 are printed for remix`.
   - `[T1] init: a theme with sections is refused with exit 2`.
   - `[T1] init: skills are synced to .claude/skills and .agents/skills`.
7. Proof: PLAN 5.0. After `pnpm build`: `d=$(mktemp -d) && cp -R test/fixtures/theme-min/. $d && node pkg/bin/ripple.mjs init --host liquid --cwd $d < /dev/null; echo $?` prints `0` and a second run prints only `unchanged` and `patch-skipped` plan lines.

### Acceptance

The twelve tests pass. The command of step 7 gives the stated result. `grep -c "PLAN 4.4: M6-T15" src/cli/index.ts` prints `0`.

### Out of scope

`add`, `--blueprint` (M6-T16). The computed lock (M6-T22). RB-8 and RB-9 in the build (M6-T34). The Ripple theme (M7-T04, M7-T23).

### If blocked

- `syncSkills` does not exist although `docs/plan/done/M6-T26.md` exists: open a draft pull request naming the function `syncSkills` and its owning task M6-T26, and write the same sentence in the pull request body (a draft pull request has no done file, PLAN 1 item 7).
- The second run is not idempotent: find the entry that is not `unchanged` or `patch-skipped`; the usual cause is a derived file stamped with a different hash on each run or a patch whose "already present" test does not match its own output. Fix the function that owns the entry when it is in a file this task changes. When that function belongs to another task: open a draft pull request naming the function and its owning task, and write the same sentence in the pull request body (a draft pull request has no done file, PLAN 1 item 7). Do not fix another task's function here (AGENTS.md).

---

## M6-T16 Command `ripple add` (`--all`, `--blueprint`, `--dry-run`, `--diff`, `--prefix`)

- **Goal:** Add `ripple add`: install components with their dependencies, and blueprints, with derived files and patches.
- **Depends on:** M6-T15.
- **Kind:** `cli`. Size M.

### Read first

doc 07: `### 7.5 ` (2.8 kB), `### 5.3 ` only the rows `initialized` and `orphans` of the field table, `#### 7.6.1 ` (1.5 kB), row RP405 of `### 9.6 `, acceptance items 11b (second half), 13, 19 in `## 12. `. This file 0.5, PR-M6-13. Repository: `grep -n "^export" src/cli/plan.ts src/cli/commands/init.ts`.

### Files

Create: `src/cli/commands/add.ts`, `src/cli/commands/add.test.ts`. Change: `src/cli/plan.ts` (append `isInitialized`, `installedComponents`, `installedBlueprints`), `src/cli/index.ts` (the `add` line).

### Steps

1. Branch `task/M6-T16-add`.
2. `src/cli/plan.ts`: `isInitialized` (true when every `owned` and `library` core file of the host exists with a trailer: every such id of `index.core[host]` is in the scan); `installedComponents(scan, index)` (the component ids that own at least one scanned trailer id; ascending); `installedBlueprints(scan)` (ids `<x>` of owners `blueprint.<x>`).
3. `run`, the eight numbered steps of "Behaviour" in `### 7.5 `:
   1. `resolveHost`; scan; not initialized: print `error: Ripple is not initialized in this project.` and `fix: <command form> init`, return 2.
   2. Names: no component, no `--all`, no `--blueprint`: usage error, exit 2. Unknown component: `error: unknown component "<name>".` plus ` Did you mean "<id>"?` when a registry id is within Levenshtein distance 2 (reuse the Levenshtein function of `src/check/report.ts`; when it is not exported, add the word `export` there; do not write a second one). `planned`: `error: component "<id>" is planned and not shipped in <pkg>@<version>.` Unknown blueprint: `error: unknown blueprint "<id>".` All exit 2.
   3. Closure of `dependencies`: breadth-first, ascending id order, each component once. `--all`: every component whose `status` is not `planned`. `--blueprint <id>` adds every id of that blueprint's `components`.
   4. `planOwnedFiles` for `index.components[id].files[host]` of every resolved component and `index.blueprints[id].files[host]` of every requested blueprint, all options `false`.
   5. `liquid`: count block files after the plan. More than 150 whose trailer owner is a Ripple component, or more than 300 `blocks/*.liquid` in total: print the RP405 line `error: <n> block files; limit <max>` and `fix: remove unused blocks`, return 1 before writing.
   6. `derivedEntries` (component ids = installed plus resolved); `patchLocale` for `core`, the resolved components and the requested blueprints (Liquid); `patchAgents`. `liquid` and a requested blueprint is `layout`: also `patchHead` and `patchImportMap`, evaluated against the text the plan will write.
   7. Print the plan (header `ripple add <positionals>  (host: <host>, <pkg>@<version>)`), then apply unless `--dry-run` or `--diff`.
   8. For each component added for the first time: `docs: <command form> docs <id>`.
   - `--diff`: for each planned file that already exists, print the unified diff between the local body and the running body. `unifiedDiff` is M6-T17; while `src/cli/diff.ts` does not exist print `note: --diff needs ripple diff` and return 2, with the comment `// PLAN 4.4: --diff is completed by M6-T17`.
   - `--prefix`: allowed only while no Ripple block file is installed (passed to `readLiquidPrefix`).
   - Return `exitCodeOf(entries)`.
4. Tests, `src/cli/commands/add.test.ts`:
   - `[T1] add: button on react installs the binding and the css and regenerates the entry` (plan lines `add` for `app/components/ripple/button.tsx` and `app/styles/ripple/components/button.css`; `ripple.css` contains `@import "./components/button.css";`).
   - `[T1] add: dialog on liquid installs its block files, its region and its dependencies` (every id of the dependency closure has a region in `assets/ripple.css`, in ascending order after the three core regions).
   - `[T1] add: a second run prints only unchanged and patch-skipped`.
   - `[T1] add: not initialized exits 2 with the fix line`.
   - `[T1] add: an unknown component suggests the nearest id` (`buton` gives `Did you mean "button"?`).
   - `[T1] add: an untrailered blocks/button.liquid gives conflict-unmanaged, exit 1, and the tree is unchanged` (item 13; `treeHash`).
   - `[T1] add: --all installs every non-planned component and status of each file is unmodified`.
   - `[T1] add: --dry-run writes nothing`.
   - `[T1] add: locale keys are merged into every locale file` (item 19, first half).
   - `[T1] add: --blueprint installs the blueprint files, its components and its locale keys` (PR-M6-13: copy `fixturePackageRoot()` to a temporary directory; add to its `registry/index.json` a blueprint `layout` with `components: ["button"]` and, for `liquid`, the files `{ id: "blueprint.layout/template", source: "registry/blueprints/layout/liquid/layout/theme.liquid", target: "layout/theme.liquid", type: "blueprint", mode: "owned" }` and `{ id: "blueprint.layout/import-map", source: "registry/blueprints/layout/liquid/snippets/import-map.liquid", target: "snippets/import-map.liquid", type: "blueprint", mode: "owned" }`; write the two source files: the layout holding the lines `{% render 'import-map' %}`, `{% render 'rp-head' %}`, `{{ content_for_header }}`, `{{ content_for_layout }}`, and the import map of doc 14 section 7.1 (extract: `docs/14-liquid-theme.md`, `### 7.1 `, `liquid`, index 0, 649 bytes). Run in `tempProject("empty")` with `config/settings_schema.json` holding `[]`: `init --host liquid`, then `add --blueprint layout --host liquid`; `layout/theme.liquid` exists; both patches are `patch-skipped`; item 11b second half is asserted by M6-T22).
   - `[T1] add: an unknown blueprint exits 2`.
   - `[T1] add: the block budget stops the command with exit 1` (150 synthetic trailered block files already in `blocks/`).
5. Proof: PLAN 5.0.

### Acceptance

The twelve tests pass. `grep -c "PLAN 4.4: M6-T16" src/cli/index.ts` prints `0`.

### Out of scope

`ripple diff` (M6-T17). Base retrieval and merge on re-add of a modified outdated file: `getBase` is left undefined here, so such a file plans `needs-base`; M6-T20 wires `getBaseBody` into `add` (one line). The real blueprints (M7).

### If blocked

The deprecated-component warning of doc 07 section 11.3 item 5 (`warning:` on `add`): print `warning: <id> is deprecated: <text>` when `manifest.components[id].deprecated` exists; no test component has the key, so write one unit test with a patched fixture index only when the index carries the field; otherwise note it in the done file.

---

## M6-T17 Command `ripple diff` (`src/cli/diff.ts`)

- **Goal:** Add the unified diff printer and the read-only command `ripple diff`; complete `add --diff`.
- **Depends on:** M6-T16.
- **Kind:** `cli`. Size M.

### Read first

doc 07: `### 7.7 ` (prose, 1 kB; the code block is extracted), the file `state` rows of the field table of `### 5.3 `, the `--diff` row of `### 7.5 `, acceptance item 10 in `## 12. `.

### Files

Create: `src/cli/diff.ts`, `src/cli/diff.test.ts`, `src/cli/commands/diff.ts`, `src/cli/commands/diff.test.ts`. Change: `src/cli/index.ts` (the `diff` line), `src/cli/commands/add.ts` (replace the `PLAN 4.4: --diff` lines).

### Steps

1. Branch `task/M6-T17-diff`. Extract:

   | Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
   |---|---|---|---|---|---|---|
   | `src/cli/diff.ts` | `docs/07-manifest-registry-cli.md` | `### 7.7 ` | `ts` | 0 | 2478 | (the line below) |

   First line of the output (the cell above cannot hold its backticks):

   ```text
   // src/cli/diff.ts - unified diff printer for `ripple diff` and `ripple add --diff`. No dependencies.
   ```

2. `src/cli/commands/diff.ts`, `run`: `resolveHost`; scan; for every installed file with registry mode `owned` or `library` (all, or those of the named components; an unknown or not-installed name is exit 2): compute the running body (registry source, `installTransform`) and the file state (`current`, `outdated`, `modified`, `modified-outdated`, definitions in `### 5.3 `). `current`: print nothing. Otherwise print `<state>  <path>` and `unifiedDiff(local body, running body, "<path> (yours)", "<path> (<pkg>@<running version>)")`. Last line `<n> files differ.` or `No differences.` Exit 0 when nothing differs, 1 when at least one file differs.
3. `add --diff` (replace the marker of M6-T16): for each planned file that already exists print the same two things; write nothing; exit code as for the plan.
4. Tests:
   - `src/cli/diff.test.ts`: `[T1] diff: equal texts give an empty string`; `[T1] diff: one changed line prints a hunk with three lines of context`; `[T1] diff: output applies with patch on 500 seeded random cases` (item 10: a seeded linear congruential generator builds two texts of 0 to 14 lines over a 4-word alphabet; write the first text and the diff to a temporary directory and run `patch` with `execFileSync("patch", ["-s", file, diffFile])`; the result equals the second text. When `patch` is not on `PATH` the test skips with the reason `patch is not on PATH`; this is the one permitted skip of this task; state it in the pull request).
   - `src/cli/commands/diff.test.ts`: `[T1] diff: a fresh install prints No differences and exits 0`; `[T1] diff: an edited file is printed as modified with a diff and the exit code is 1`; `[T1] diff: a named component limits the output`; `[T1] diff: an unknown component exits 2`; `[T1] diff: add --diff prints the diff and writes nothing`.
5. Proof: PLAN 5.0.

### Acceptance

The eight tests pass (the `patch` test passes on a machine with `patch`). `grep -rn "PLAN 4.4: --diff" src/` prints nothing.

### Out of scope

Attributing hunks to "yours" and "upstream" (doc 07: V1 does not). Derived files and patches (not diffed).

### If blocked

The `patch` test fails for a seed: the extracted code is the required text and was verified on 500 cases; check the test's own file writing (final newline, empty file) first.

---

## M6-T18 Three-way merge `src/cli/merge3.ts`

- **Goal:** Add the zero-dependency three-way line merge and prove it against `git merge-file` on 2000 random cases.
- **Depends on:** M1-T46.
- **Kind:** `cli`. Size M.

### Read first

doc 07: `### 8.2 ` (prose, 2.5 kB; the code block is extracted), acceptance item 9 in `## 12. `. Optional, only when the random test fails: `docs/research/spikes/agent-kit/merge/` (the spike's own comparison script).

### Files

Create: `src/cli/merge3.ts`, `src/cli/merge3.test.ts`.

### Steps

1. Branch `task/M6-T18-merge3`. Extract:

   | Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
   |---|---|---|---|---|---|---|
   | `src/cli/merge3.ts` | `docs/07-manifest-registry-cli.md` | `### 8.2 ` | `ts` | 0 | 4801 | `// src/cli/merge3.ts - zero-dependency three-way line merge.` |

2. Tests, `src/cli/merge3.test.ts`:
   - `[T1] merge3: disjoint edits merge without a conflict`.
   - `[T1] merge3: the same edit on both sides is taken once`.
   - `[T1] merge3: overlapping edits give one conflict region with the four markers` (`<<<<<<< yours`, `||||||| installed`, `=======`, `>>>>>>> upstream`, in that order, with the local, base and upstream lines between them).
   - `[T1] merge3: adjacent edits conflict` (base `a\nb\n`; ours changes line 1; theirs changes line 2: one conflict, as `git merge-file`).
   - `[T1] merge3: the result ends with one newline unless empty`.
   - `[T1] merge3: CRLF input is merged as LF`.
   - `[T1] merge3: above the line limit equal sides are returned and different sides are one conflict` (5001 lines).
   - `[T1] merge3: agrees with git merge-file on 2000 seeded random cases` (item 9: random edits, insertions and deletions over a 4-word alphabet, files of 0 to 14 lines; run `git merge-file -p --diff3 -L yours -L installed -L upstream <ours> <base> <theirs>` with `execFileSync` inside a `try` (its exit code is the number of conflicts); 0 disagreements about whether a case conflicts; 0 clean merges with different text. The test skips with the reason `git is not on PATH` when `git` is absent; this skip is permitted by doc 07 section 8.2; state it in the pull request).
3. Proof: PLAN 5.0.

### Acceptance

The eight tests pass. `grep -c "MERGE_LINE_LIMIT = 5000" src/cli/merge3.ts` prints `1`.

### Out of scope

The decision table (M6-T10). `upgrade` (M6-T20). Any whitespace, Liquid or CSS awareness (doc 07: line-based only).

### If blocked

A random case disagrees: the grouping rule is `<=` ("a hunk that merely touches the group joins it"); the extracted code has it. Check the test generator and the argument order of `git merge-file` (`<current> <base> <other>`) before touching the code.

---

## M6-T19 Base retrieval `src/cli/base.ts`

- **Goal:** Add `getBaseBody`, which returns a file's upstream body as shipped by an older package version (running package, project `node_modules`, cache, `npm pack`).
- **Depends on:** M6-T06, M6-T01, M6-T02, M6-T10.
- **Kind:** `cli`. Size S.

### Read first

doc 07: `### 8.3 ` whole (3.6 kB; its code block is indented, so copy `fetchBaseRegistry` by hand from the section, character for character), the `registryVersion` paragraph at the end of `### 11.1 `.

### Files

Create: `src/cli/base.ts`, `src/cli/base.test.ts`.

### Steps

1. Branch `task/M6-T19-base`.
2. `src/cli/base.ts`:
   - `export const REGISTRY_VERSION = 1`.
   - `fetchBaseRegistry(pkg, version, cacheRoot)`: the function printed in `### 8.3 ` item 4, unchanged.
   - `cacheRoot(env)`: the first defined of `env.RIPPLE_CACHE_DIR`; `env.XDG_CACHE_HOME + "/ripple"`; `<os.homedir()>/.cache/ripple`.
   - `findBaseRegistry(pkg, version, context)`: the five-step order of `### 8.3 `: (1) running package when `version` equals the running version and `pkg` the running name: `<packageRoot>/registry`; (2) `<cwd>/node_modules/<pkg>/package.json` with that `version`: its `registry`; (3) the cache directory `<cache>/<pkg segments>/<version>/package/registry` when it exists; (4) only when `env.RIPPLE_OFFLINE` is not `1`: `fetchBaseRegistry`; (5) `undefined`.
   - `getBaseBody(pkg, version, id, context)`, `context` being `{ io: CliIo; host: Host; liquidPrefix: string; config: RippleConfig | null }`: from the registry directory found, the three numbered steps under "From the registry directory found": read `index.json`; `registryVersion` greater than `REGISTRY_VERSION` returns `undefined`; find the file entry with trailer id `id` for the host among `core[host]`, every `components[*].files[host]`, every `blueprints[*].files[host]`; none: `undefined`; read `<registry dir>/../<source>`, apply `installTransform` with the PROJECT's current prefix, paths and the target path resolved by `resolveTarget`; return the text. Never throws: every failure returns `undefined`.
3. Tests, `src/cli/base.test.ts` (no network: every test passes `env: { RIPPLE_OFFLINE: "1", RIPPLE_CACHE_DIR: <temp dir> }`):
   - `[T1] base: the running package is used for the running version`.
   - `[T1] base: project node_modules is used when its version matches`.
   - `[T1] base: the cache directory is used` (a hand-made `<cache>/<PKG_NAME>/0.0.9/package/registry/` with an `index.json` and one file; build the path from `PKG_NAME`, never the literal, 0.2).
   - `[T1] base: a scoped package name uses two path segments in the cache`.
   - `[T1] base: offline with an empty cache returns undefined`.
   - `[T1] base: a higher registryVersion returns undefined`.
   - `[T1] base: an unknown id returns undefined`.
   - `[T1] base: the install transform is applied with the project prefix` (a Liquid template body with `{% block 'button'` and prefix `rp-`).
4. Proof: PLAN 5.0.

### Acceptance

The eight tests pass. `grep -c "RIPPLE_OFFLINE" src/cli/base.ts` prints at least `1`; `grep -c "process.env" src/cli/base.ts` prints `0` (the environment is read through `io.env`).

### Out of scope

Running `npm pack` in a test (network; never). The hash comparison of the fetched base with the trailer (`planFile` does it). `tar` on Windows (UNVERIFIED in the spec; failure returns `undefined`).

### If blocked

`fetchBaseRegistry` as printed reads `process.platform`; that is not the environment and stays. Nothing else in this file may read `process.env`.

---

## M6-T20 Command `ripple upgrade` (`--dry-run`, `--ours`, `--theirs`, `--write-conflicts`, `--force`)

- **Goal:** Add `ripple upgrade`: bring installed files to the running version with the decision table, the three-way merge and base retrieval; process orphans, derived files, patches and skills.
- **Depends on:** M6-T16, M6-T18, M6-T19.
- **Kind:** `cli`. Size M.

### Read first

doc 07: `### 7.8 ` (2.4 kB), `### 8.1 ` the table and rules 1 to 8 (4 kB), `### 8.4 ` (1.2 kB), acceptance items 8 (rows 12 and 13) and 14 in `## 12. `, item 5 of `### 11.3 `. Repository: `grep -n "^export" src/cli/plan.ts src/cli/base.ts src/cli/commands/init.ts src/cli/commands/add.ts`.

### Files

Create: `src/cli/commands/upgrade.ts`, `src/cli/commands/upgrade.test.ts`. Change: `src/cli/index.ts` (the `upgrade` line), `src/cli/commands/add.ts` (pass `getBase`, one line).

### Steps

1. Branch `task/M6-T20-upgrade`.
2. Options (strict): `dry-run`, `ours`, `theirs`, `write-conflicts`, `force` (booleans). `--ours` together with `--theirs` or `--force`: `error: --ours cannot be combined with --theirs or --force.`, exit 2.
3. `run`, the eight numbered steps of "Behaviour" in `### 7.8 `:
   1. `resolveHost`; require `isInitialized` (same error as `add`); scan.
   2. Downgrade guard: compare each trailer version with the running version (major, minor, patch numerically; a prerelease is lower than its release). Any greater and no `--force`: `error: installed files come from <pkg>@<x>, which is newer than the running <pkg>@<y>.` and `fix: npx <pkg>@<x> upgrade`, exit 2.
   3. Every installed file whose id is in the running registry (all, or core files plus the files of the named components): `planOwnedFiles` with the flags and `getBase: (pkg, version, id) => getBaseBody(pkg, version, id, ...)`. Row 12 is the library rule inside `planOwnedFiles` (M6-T10).
   4. Every installed component: each file of the component for the host that does not exist is planned `add`.
   5. Row 13, before `planFile`: a scanned file whose id is not in the running registry: not modified gives an entry with action `remove` (`remove: true`; a composite region is removed); modified gives `orphan-kept` plus `note: <path> is no longer shipped by <pkg>; it has local edits and was kept.`
   6. `derivedEntries`; every patch of the host re-planned (the functions of `init.ts`).
   7. Print the plan (header `ripple upgrade <positionals>  (host: ..., ...)`). After it, for each `merge-conflict`: the line `conflict in <path>:` and each conflict region of `conflictText` from `<<<<<<< yours` to `>>>>>>> upstream` with three lines of context before and after; for each `needs-base`: `needs-base <path>: <reason>` and `fix: connect to the npm registry and run upgrade again, or pass --ours or --theirs`.
   8. Apply unless `--dry-run` (entries `merge-conflict` without `--write-conflicts` and `needs-base` have no `content`, so they are untouched). Then `syncSkills`.
   - A component with a `deprecated` key in the manifest prints `warning: <id> is deprecated: <text>`.
   - Return `exitCodeOf(entries)`.
4. `src/cli/commands/add.ts`: pass the same `getBase` closure to `planOwnedFiles`.
5. Tests, `src/cli/commands/upgrade.test.ts`. "Upstream changed" is produced without a second package: copy `fixturePackageRoot()` to a temporary directory A, install with A, then run `upgrade` with a second copy B in which the registry file was edited and `registry/index.json` and `manifest.json` carry `package.version` `0.2.0` (copy the `0.1.0` registry into `<RIPPLE_CACHE_DIR>/ripple-kit/0.1.0/package/registry` to make the base available). Write this as one helper inside the test file. The eight scenarios of item 14, each asserting the plan line and the exit code:
   - `[T1] upgrade: unmodified and upstream changed gives update, exit 0`.
   - `[T1] upgrade: modified and upstream unchanged gives keep-local, exit 0`.
   - `[T1] upgrade: modified with a disjoint upstream change gives merged, exit 0` (the file holds both edits; its trailer names `0.2.0`).
   - `[T1] upgrade: an overlapping change gives merge-conflict, exit 1, file unchanged`.
   - `[T1] upgrade: --write-conflicts writes the markers` (the file contains `<<<<<<< yours`).
   - `[T1] upgrade: --ours gives keep-local with a new trailer, exit 0`.
   - `[T1] upgrade: --theirs gives overwrite, exit 0`.
   - `[T1] upgrade: base unavailable gives needs-base, exit 1` (`RIPPLE_OFFLINE=1`, empty cache).
   And: `[T1] upgrade: row 12 a modified library file is overwritten with a warning`; `[T1] upgrade: row 13 an unmodified orphan is removed and a modified one is kept with a note`; `[T1] upgrade: a newer installed version is refused without --force`; `[T1] upgrade: --ours with --theirs exits 2`; `[T1] upgrade: with an unchanged package only derived files change after tokens.css is edited` (edit `tokens.css`; the plan shows `regenerate` for `props.css` and `theme.css` and `keep-local` for `tokens.css`); `[T1] upgrade: an edited blueprint file is kept with any flag` (row 9a; synthetic blueprint as in M6-T16).
6. Proof: PLAN 5.0.

### Acceptance

The fourteen tests pass. `grep -c "PLAN 4.4: M6-T20" src/cli/index.ts` prints `0`.

### Out of scope

`ripple check` reporting RP511 after `--write-conflicts` (M6-T31 has RP511; the combined assertion of item 14 is in M6-T34). The release rehearsals of doc 07 section 11.4 (M9-T01).

### If blocked

The scenario helper cannot make B differ from A because both read the same directory: `fixturePackageRoot()` returns one directory per process; always copy it (`cpSync(dir, copy, { recursive: true })`) before editing.

---

## M6-T21 Command `ripple remove`

- **Goal:** Add `ripple remove`: delete a component's files, refusing dependents and local edits unless forced.
- **Depends on:** M6-T16.
- **Kind:** `cli`. Size S.

### Read first

doc 07: `### 7.9 ` (1 kB), `#### 7.6.1 ` (1.5 kB).

### Files

Create: `src/cli/commands/remove.ts`, `src/cli/commands/remove.test.ts`. Change: `src/cli/index.ts` (the `remove` line).

### Steps

1. Branch `task/M6-T21-remove`. Options (strict): `force`, `dry-run`.
2. `run`, the five numbered rules of `### 7.9 `:
   1. Unknown or not-installed component: `error: component "<id>" is not installed.` (or the unknown-component message of `add`), exit 2.
   2. Another installed component lists a named one in its transitive `dependencies` and is not itself named: `error: <id> is required by <other>.` and `fix: remove <other> as well, or keep <id>.`, exit 1, nothing written; `--force` does not override.
   3. For each owned file of the named components: unmodified gives an entry `remove`; modified gives `keep-local`. Without `--force` and with at least one modified file: print the plan, then `error: <n> files have local edits.` and `fix: pass --force to delete them`, write nothing, exit 1. With `--force` modified files are `remove` too.
   4. Liquid: the component's region `<id>/css` is removed from `assets/ripple.css` (an entry `remove` with path `assets/ripple.css#<id>/css`). npm: `derivedEntries` regenerates the imports region. `patchAgents` is refreshed. Locale keys stay.
   5. Core files are never removed.
3. Tests: `[T1] remove: an unmodified component is deleted and the css entry is regenerated`; `[T1] remove: on liquid the region is removed and other text of assets/ripple.css is kept`; `[T1] remove: a dependent blocks the removal with exit 1 even with --force`; `[T1] remove: a modified file blocks without --force and nothing is written`; `[T1] remove: --force deletes modified files`; `[T1] remove: a component that is not installed exits 2`; `[T1] remove: locale keys stay`; `[T1] remove: --dry-run writes nothing`.
4. Proof: PLAN 5.0.

### Acceptance

The eight tests pass. `grep -c "PLAN 4.4: M6-T21" src/cli/index.ts` prints `0`.

### Out of scope

Removing blueprints (the command takes components only). Removing skills (M6-T26 rule 7).

### If blocked

The not-installed message is not worded by the spec ("exit code 2" only): use the text above and record it under `## Ledger issues` of doc 07.

---

## M6-T22 Command `ripple status` (`--json`, the computed lock)

- **Goal:** Add `computeLock` and the command that prints the computed lock as JSON or text.
- **Depends on:** M6-T16, M6-T26.
- **Kind:** `cli`. Size S.

### Read first

doc 07: `### 5.3 ` whole (4.3 kB), `### 7.10 ` (1 kB), acceptance items 11b (second half), 15, 16 in `## 12. `. This file 0.5, PR-M6-12.

### Files

Create: `src/cli/commands/status.ts`, `src/cli/commands/status.test.ts`. Change: `src/types.ts` (the type `ComputedLock`), `src/cli/index.ts` (the `status` line).

### Steps

1. Branch `task/M6-T22-status`.
2. `src/types.ts`: declare (or complete, when a partial declaration exists) the type-only `ComputedLock` with exactly the keys of the JSON example of `### 5.3 `: `lockVersion: 1`; `package: { name; version; source: "node_modules" | "npx" }`; `host`; `prefix: { css; element; liquidFile }`; `initialized`; `components: Record<string, { state: "current" | "outdated" | "modified" | "modified-outdated" | "incomplete"; missing: string[]; files: LockFile[] }>`; `core: LockFile[]`; `blueprints: Record<string, { state: ...; missing: string[]; files: LockFile[] }>`; `patches: { id: string; path: string; state: "present" | "stale" | "absent" | "skipped" }[]`; `unmanaged: string[]`; `duplicates: { id: string; paths: string[] }[]`; `orphans: { id: string; path: string; modified: boolean }[]`; `skills: { version: string; pending: { add: number; update: number; remove: number; modified: number }; conflicts: string[] }`. `LockFile` is `{ id; path; mode: "owned" | "library" | "derived"; version; upstream; local; state: "current" | "outdated" | "modified" | "modified-outdated" | "stale" }`.
3. `computeLock(io, host)`: every row of the "Field definitions" table of `### 5.3 `, literally. `prefix.liquidFile` is the project's block prefix. File `state` for modes `owned` and `library`, and for `derived`, by the two rows. Component `state`: the worst file state, `incomplete` when `missing` is not empty; a component is listed when at least one of its files is found. `patches`: `patchState` of every patch id of `index.core[host]` (and one entry per installed component or blueprint locale patch is NOT listed: only the `core/patch:*` ids). `unmanaged`: registry targets of ANY component or core file of this host that exist and have no trailer. `skills`: `syncSkills(io, host, { force: false, dryRun: true })`. Sorting: the last paragraph of the section. The function writes nothing.
4. `run`: `--json` prints `JSON.stringify(lock, null, 2)`. Without it, the text form of `### 7.10 `: the first line `<pkg>@<version>  host: <host>  block prefix: <prefix or (none)>  initialized: <yes|no>`; then the sections `components (<n>)` (always printed; rows: two spaces, the id padded to 20, the state padded to 20, `<n> files`), `core` (id, state, path), `patches` (id, state, path), `unmanaged (<n>)` (two spaces and the path), the line `skills: <a> to add, <u> to update, <r> to remove`. Sections with no rows are omitted, except `components`. PR-M6-12, for the three fields the example does not show: `blueprints (<n>)` with rows like `components`, printed after `components`; `duplicates (<n>)` with rows `<id>` padded to 20 then the paths joined by `, `, and `orphans (<n>)` with rows `<id>` padded to 20, `modified` or `unmodified` padded to 20, the path, both printed after `unmanaged`. Exit 0 (a project that is not initialized prints `initialized: no`); no host detected is exit 2 (thrown by `resolveHost`).
5. Tests, `src/cli/commands/status.test.ts`:
   - `[T1] status: a fresh install reports every file current and initialized true`.
   - `[T1] status: an edited file is modified and its component is modified`.
   - `[T1] status: a deleted file is listed in missing and the component is incomplete`.
   - `[T1] status: an untrailered file at a registry path is unmanaged`.
   - `[T1] status: a copied file is a duplicate`.
   - `[T1] status: patches are present after init and stale after AGENTS.md is edited inside the markers`.
   - `[T1] status: after add --blueprint layout the head and import-map patches are present` (item 11b second half; synthetic blueprint as in M6-T16).
   - `[T1] status: a derived file is stale after tokens.css is edited`.
   - `[T1] status: --json output has exactly the keys of 5.3 and sorted arrays` (item 16: assert the key sets of the top level, of a component, of a file, of a patch, of `skills`; a JSON Schema generator is not available, so the key-set comparison is the test).
   - `[T1] status: the text form matches the layout of 7.10` (column widths 20 and 20).
   - `[T1] status: not initialized prints initialized: no and exits 0`.
   - `[T1] status: the command writes no file` (item 15: `treeHash` before and after; no `ripple.lock` or `ripple-lock.json`).
6. Proof: PLAN 5.0.

### Acceptance

The twelve tests pass. `grep -c "PLAN 4.4: M6-T22" src/cli/index.ts` prints `0`. `grep -c "ComputedLock" src/types.ts` prints at least `1`.

### Out of scope

Rules RP501 to RP512 (M6-T31). Writing a lock file (never, D-056).

### If blocked

- A rule file of M2 casts the lock because `ComputedLock` lacked `components`: leave the cast; note it in the done file.
- Item 16 asks for a JSON Schema generated from the type; no generator is in the repository and none may be added. The key-set test above is the plan's reading; record it under `## Ledger issues` of doc 07.

---

## M6-T23 Command `ripple check` (`--json`, `--url`, `--browser`, `--rule`, `--max-warnings`)

- **Goal:** Add the command module that parses the `check` options, calls `check()` of `src/check/index.ts`, prints the report and returns the exit code.
- **Depends on:** M6-T09, M6-T08.
- **Kind:** `cli`. Size S.

### Read first

doc 07: `### 9.2 ` (1.9 kB), `#### 9.4.1 ` (1.6 kB), `#### 9.4.2 ` (0.3 kB), in `### 9.3 ` only the interfaces `CheckOptions`, `Report`, `RuleContext` and the paragraph after the code block (2 kB), `### 7.1 ` rules 3 to 6 and 12 (2 kB), acceptance items 22 and 23 in `## 12. `. This file 0.5 (rows `CliIo`, `commandForm`, `CommandRun`, `RuleContext.cwd`), 0.8, PR-M6-10. Source: `src/check/index.ts`, `src/check/engine.ts`, `src/check/report.ts` (whole; they are small).

### Files

Create: `src/cli/commands/check.ts`, `src/cli/commands/check.test.ts`. Change: `src/cli/index.ts` (the `check` line only), `src/check/engine.ts` and `src/check/report.ts` (only step 4), `docs/07-manifest-registry-cli.md` (a line under `## Ledger issues` only when "If blocked" says so).

### Steps

1. Branch `task/M6-T23-check`.
2. Options, parsed with `parseArgs` in strict mode (`allowPositionals: true`): `url` (string, multiple), `browser` (boolean), `rule` (string, multiple), `json` (boolean), `max-warnings` (string). Any other option is the usage error of doc 07 `### 7.1 ` (the same code path M6-T09 uses for an unknown option), exit 2.
3. `RuleContext.cwd` exists since M0-T42 (ledger D-142); `check()` receives `cwd` in `CheckOptions` and the engine passes it on. This task adds nothing for it. Check: `grep -n "cwd: string" src/check/index.ts` prints two lines (`CheckOptions` and `RuleContext`); when it prints fewer, open a draft pull request naming M0-T42.
4. Command form (PR-M6-10). `src/check` MUST NOT import `src/cli`, so the engine cannot call `commandForm`. Run `grep -n "command form\|docs RP\|docs \${" src/check/engine.ts src/check/report.ts`.
   - When the engine already writes the literal token `<command form>` (11 characters between the angle brackets, as printed here) into `docs` and into the last line of `formatText`: change nothing.
   - Otherwise change the engine so that `docs` is the string `"<command form> docs " + meta.id`, and `formatText` so that its last line contains the literal token where 9.4.1 item 6 prints `<command form>`. Change the test of acceptance item 22 so that it applies `` .replaceAll("<command form>", `npx ${PKG_NAME}@${VERSION}`) `` (both imported from `src/identity.ts`; never the literal package name, 0.2) to the output of `formatText` before the byte comparison. Rule files MUST write the same token wherever a `fix` cell of doc 08 section 5.5 prints `<command form>`.
   - The command module replaces every occurrence of the token: `const form = commandForm(io, host)`; for every diagnostic, `fix` and `docs` get `.replaceAll("<command form>", form)` (null stays null); the text returned by `formatText(report)` gets the same replacement. This holds for the text output and for `--json`.
5. `run(args, io, globals)`:
   1. `const host = resolveHost(io, globals.host)` (M6-T08; it throws the exit-2 error when no host is detected). `check` works before `init`: do not call `readConfig` and do not require `ripple.json`.
   2. `--max-warnings`: the value MUST match `/^\d+$/`; otherwise `error: --max-warnings needs a whole number.`, exit 2 (wording PLAN-CHOSEN).
   3. `--rule`: every value MUST be the `meta.id` of an entry of `rules` (exported by `src/check/index.ts`); otherwise `error: unknown rule "<RULE>".` and `fix: valid rules: <ids of rules, ascending, separated by ", ">`, exit 2 (wording PLAN-CHOSEN, copied from doc 07 `### 7.11 ` rule 3).
   4. `--browser` without `--url`: `error: --browser needs at least one --url.` and `fix: <command form> check --browser --url <url>`, exit 2 (wording PLAN-CHOSEN; the spec says only "exit code 2").
   5. `--browser` with `--url`: `createRequire(join(io.cwd, "package.json")).resolve("playwright")` inside `try`. On a throw: `error: --browser needs Playwright.` and `fix: <pm> add -D playwright` where `<pm>` is `detectPackageManager(io.cwd, io.env)`, exit 2. Never download a browser; never run `playwright install`.
   6. Call `check({ cwd: io.cwd, host, lock: undefined, paths, urls, browser, rules })`. `paths` are the positionals unchanged (absent when there are none); `urls`, `rules` absent when not given. `lock` stays `undefined` in this task: M6-T31 passes the computed lock. Do not add a note; the engine adds the note that layer P did not run (9.3, comment on `lock`).
   7. Fetching of `--url` documents: run `grep -n "fetch(" src/check/engine.ts`. When the engine fetches `options.urls` already, keep it and make sure of the three properties below. When it does not, add it to the engine: `await fetch(url, { headers: { Accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(30000) })`; a response whose `ok` is false throws `new Error("could not fetch " + url + " (" + response.status + ").")`; a rejected fetch throws `new Error("could not fetch " + url + " (" + error.message + ").")`; the body text becomes an `HtmlDocument` with `file: null`, `url`, `serverHtml: true`. The command catches an error whose message starts with `could not fetch ` and prints `error: ` plus the message, exit 2. No other error is caught here.
   8. Print. Each entry of `report.notes` goes to `io.err` before anything goes to `io.out`; when an entry does not start with `note: `, prefix it. With `--json`: `io.out(JSON.stringify(report, null, 2))` and nothing else on standard output. Without: `io.out` of the text of `formatText(report)` with its trailing newline removed (`io.out` adds the newline; split on `\n` and call once per line when `CliIo.out` takes one line).
   9. Return `1` when `report.counts.error > 0`, or when `--max-warnings` was given and `report.counts.warning` is greater than it; else `0`.
6. The command MUST NOT write any file.
7. `src/cli/index.ts`: replace the line `check: stub, // PLAN 4.4: M6-T23` by `check: () => import("./commands/check.ts"),`.
8. Tests, `src/cli/commands/check.test.ts`. Each builds its project in `tempDir()` and passes `--host` so that M6-T15 is not needed. A test that needs `--url` replaces `globalThis.fetch` by a function returning `new Response(html, { status, headers: { "content-type": "text/html" } })` and restores it in `finally`; no server is started.
   - `[T1] check: a clean html project prints No problems in 1 files. and exits 0` (one `.html` file holding the canonical HTML of the Button `default` fixture, read from `components/button/fixtures/default.html`).
   - `[T1] check: an unknown enumeration value prints an RP101 block and exits 1` (same file with `rp-button--primary` replaced by `rp-button--outlined`; assert the first stdout line starts with `RP101 error  ` and the last line starts with `1 problem in 1 files. Fix the first one and run `).
   - `[T1] check: the docs line and the last line carry the command form` (assert stdout contains no `<command form>` and contains `docs RP101`).
   - `[T1] check: --json prints exactly one JSON value` (item 23: `JSON.parse(stdout)` succeeds; `version === 1`; keys `ok`, `counts`, `files`, `diagnostics`, `notes`; no diagnostic `docs` contains `<command form>`).
   - `[T1] check: notes go to standard error` (host `react`, no paths: stderr contains `note: layer H did not run`).
   - `[T1] check: --rule limits the rules and an unknown id exits 2`.
   - `[T1] check: --max-warnings 0 exits 1 when one warning is reported and 0 without the flag` (use an input that yields one warning-severity diagnostic of a rule present in `rules`; pick the rule by `rules.find((r) => r.meta.severity === "warning")` and its `text.bad`; when no warning rule exists yet, write the test with `{ skip: "no warning rule is implemented yet" }` and list it in the pull request).
   - `[T1] check: --url documents are checked as server HTML`.
   - `[T1] check: a 404 for --url exits 2 with could not fetch`.
   - `[T1] check: --browser without --url exits 2`.
   - `[T1] check: --browser without playwright in the project exits 2 with the fix line` (the temp project has a `package.json` and no `node_modules`).
   - `[T1] check: the command writes no file` (`treeHash` before and after when M6-T15 exists; otherwise compare `readdirSync(dir, { recursive: true })`).
9. Proof: PLAN 5.0.

### Acceptance

The twelve tests pass (`pnpm test:unit --files=src/cli/commands/check`). `pnpm test:unit --files=src/check/` still passes (item 22 included). `grep -c "PLAN 4.4: M6-T23" src/cli/index.ts` prints `0`. `grep -rn "from \"\.\./cli\|from \"\.\./\.\./cli" src/check` prints nothing.

### Out of scope

Passing the computed lock and the layer P driver (M6-T31). The layer B driver (M6-T32). Theme Check (M6-T30). Any rule file.

### If blocked

- `resolveHost` does not exist although `docs/plan/done/M6-T09.md` exists: open a draft pull request naming the function `resolveHost` and its owning task M6-T09.
- The item 22 test cannot be made to pass with the token: keep the engine's existing fixed string, make the command replace THAT string by `commandForm(...)`, and describe it in the done file and under `## Ledger issues` of doc 07.
- `--no-skips` fails because of the skipped warning test: implement the test against a rule listed in `rules` with severity `warning`; when there is none, remove the test and say so in the pull request.

---

## M6-T24 Command `ripple docs`

- **Goal:** Add the command that prints one shipped documentation file to standard output.
- **Depends on:** M6-T09, M6-T14.
- **Kind:** `cli`. Size S.

### Read first

doc 07: `### 7.11 ` (2 kB), acceptance item 11d in `## 12. `. doc 08: `### 2.7 ` (0.7 kB). This file 0.5 (rows `CliIo`, `commandForm`, `CommandRun`), 0.8.

### Files

Create: `src/cli/commands/docs.ts`, `src/cli/commands/docs.test.ts`. Change: `src/cli/index.ts` (the `docs` line only).

### Steps

1. Branch `task/M6-T24-docs`.
2. `run(args, io, globals)`. `args` holds the positionals and any non-global option. Decide in this order:
   1. Any element of `args` that starts with `-`, or more than two elements, or two elements whose first is not `guide`: `error: ripple docs takes positionals only: docs, docs <component>, docs <RULE>, docs guide <topic>.`, exit 2.
   2. No element: print `<io.packageRoot>/docs/INDEX.md`.
   3. One element matching `/^RP\d{3}$/`: the file `docs/rules/<RULE>.md`. Absent: `error: unknown rule "<RULE>".` and `fix: valid rules: <list>`, exit 2. `<list>` is the base name without `.md` of every file `docs/rules/RP*.md` of the package root, ascending, joined by `, `.
   4. One element that is exactly `guide`: `error: ripple docs guide needs a topic.` and `fix: valid topics: <list>`, exit 2.
   5. One other element: the file `docs/components/<id>.md`. Absent: `error: unknown component "<name>".`; when a key of `components` in `<io.packageRoot>/manifest.json` is within Levenshtein distance 2 of `<name>`, append ` Did you mean "<id>"?` to the same line (the nearest id; on a tie the first in ascending order); second line `fix: <command form> docs`; exit 2.
   6. `guide <topic>`: the file `docs/guides/<topic>.md`. Absent, or `<topic>` contains `/`, `\` or `..`: `error: unknown guide "<topic>".` and `fix: valid topics: <list>`, exit 2. `<list>` is the base name without `.md` of every file in `docs/guides/` of the package root, ascending, joined by `, `; an absent or empty directory gives an empty list (the line is then `fix: valid topics: `). The CLI holds no topic list of its own.
3. An argument for forms 3 and 5 that contains `/`, `\` or `..` is "unknown" (never read a path outside `docs/`).
4. Printing: the file is printed byte for byte. `CliIo.out` appends a newline, so: read the file as UTF-8; when it ends with `\n`, remove that one character; call `io.out` once with the rest. When the file does not end with `\n`, the output has one extra newline; every generated page ends with `\n` (M6-T14), so this does not occur for shipped files.
5. `<command form>` is `commandForm(io, detectedHostOrNull)`: call `detectHost` in a `try`; pass `null` when it throws or detects nothing. `--host` has no other effect.
6. Levenshtein: run `grep -rn "levenshtein\|function distance" src/cli src/check`. When `src/cli` or `src/check` already exports such a function, import it. Otherwise write a private `function levenshtein(a: string, b: string): number` (two-row dynamic programming) in `docs.ts`.
7. `src/cli/index.ts`: replace `docs: stub, // PLAN 4.4: M6-T24` by `docs: () => import("./commands/docs.ts"),`.
8. Tests, `src/cli/commands/docs.test.ts`. One helper in the test file builds a package root in `tempDir()`: `manifest.json` holding `{ "components": { "button": {}, "product-card": {} } }`, `docs/INDEX.md`, `docs/components/button.md`, `docs/rules/RP101.md`, `docs/rules/RP113.md`, `docs/guides/layout-props.md`, each with two distinct lines and a final newline; pass it as `packageRoot`.
   - `[T1] docs: no argument prints INDEX.md byte for byte` (stdout equals the file content).
   - `[T1] docs: a component id prints its page`.
   - `[T1] docs: a rule id prints its page`.
   - `[T1] docs: guide with a topic prints the guide`.
   - `[T1] docs: buton exits 2 and suggests button` (stderr first line `error: unknown component "buton". Did you mean "button"?`, second line starts with `fix: ` and ends with ` docs`).
   - `[T1] docs: an unknown component with no near id has no suggestion` (`zzzzzz`).
   - `[T1] docs: RP999 exits 2 and lists RP101, RP113`.
   - `[T1] docs: guide alone exits 2 with needs a topic and the topic list`.
   - `[T1] docs: guide nope exits 2 with unknown guide and the topic list`.
   - `[T1] docs: --rule RP101 exits 2 with the positionals-only message`.
   - `[T1] docs: three arguments exit 2 with the positionals-only message`.
   - `[T1] docs: a path with .. is unknown and reads nothing outside docs`.
9. Proof: PLAN 5.0.

### Acceptance

The twelve tests pass. After `pnpm build`: `node pkg/bin/ripple.mjs docs --host html | cmp - pkg/docs/INDEX.md` exits 0, and `node pkg/bin/ripple.mjs docs RP999 --host html; echo $?` prints an `error:` line, a `fix:` line and `2`. `grep -c "PLAN 4.4: M6-T24" src/cli/index.ts` prints `0`.

### Out of scope

Generating the pages (M6-T14). The guides (M8-T04 to M8-T06): until they exist `docs guide <topic>` is exit 2 for every topic.

### If blocked

- `pkg/docs/INDEX.md` does not exist after `pnpm build`: M6-T14 is not merged; run only the unit tests, state it in the pull request, and do not write the done file until the two `pkg` commands pass.
- M6-T09 passes a strict `parseArgs` result instead of raw arguments, so `--rule` is rejected before `run`: make the command table entry of `docs` opt out of option parsing in the way M6-T09's done file describes; when it describes none, catch the unknown-option error in `main` for the command `docs` only and print the positionals-only message.

---

## M6-T25 Command `ripple manifest`

- **Goal:** Add the command that prints the manifest, or one component's entry, as JSON.
- **Depends on:** M6-T01, M6-T09.
- **Kind:** `cli`. Size S.

### Read first

doc 07: `### 7.12 ` (0.2 kB), `### 7.11 ` rule 2 (the unknown-component message). This file 0.5, 0.8.

### Files

Create: `src/cli/commands/manifest.ts`, `src/cli/commands/manifest.test.ts`. Change: `src/cli/index.ts` (the `manifest` line only).

### Steps

1. Branch `task/M6-T25-manifest`.
2. `run(args, io)`: no option of its own; any option or more than one positional is the usage error of M6-T09, exit 2.
3. Read `<io.packageRoot>/manifest.json` and `JSON.parse` it.
   - No argument: `io.out(JSON.stringify(manifest, null, 2))`.
   - One argument `<id>`: when `Object.hasOwn(manifest.components, id)`, `io.out(JSON.stringify(manifest.components[id], null, 2))`; otherwise `error: unknown component "<id>".` and `fix: <command form> docs`, exit 2. The spec gives only the exit code; the wording is copied from `### 7.11 ` rule 2 without the suggestion (PLAN-CHOSEN; record under `## Ledger issues` of doc 07 as `M6-T25: message of ripple manifest for an unknown component is not specified`).
4. `io.out` adds the one trailing newline. Exit 0. The command writes nothing and needs no host.
5. `src/cli/index.ts`: replace `manifest: stub, // PLAN 4.4: M6-T25` by `manifest: () => import("./commands/manifest.ts"),`.
6. Tests (package root built in `tempDir()` with a `manifest.json` of two components):
   - `[T1] manifest: no argument prints the file re-serialised with two spaces and one trailing newline` (stdout equals `JSON.stringify(parsed, null, 2) + "\n"`).
   - `[T1] manifest: a component id prints only that entry`.
   - `[T1] manifest: an unknown component exits 2`.
   - `[T1] manifest: __proto__ is an unknown component`.
   - `[T1] manifest: two positionals exit 2`.
7. Proof: PLAN 5.0.

### Acceptance

The five tests pass. After `pnpm build`: `node pkg/bin/ripple.mjs manifest button | node -e 'const m=JSON.parse(require("fs").readFileSync(0,"utf8")); if(!m.root) process.exit(1)'` exits 0. `grep -c "PLAN 4.4: M6-T25" src/cli/index.ts` prints `0`.

### Out of scope

Validating the manifest (the generator does). Printing blueprints or elements.

### If blocked

`button` is not in the bring-up subset: use the first key of `components` in `pkg/manifest.json` in the acceptance command and name it in the done file.

---

## M6-T26 Command `ripple skills sync`

- **Goal:** Add `syncSkills` and the `skills sync` command, which copy the shipped skills for the detected host into `.claude/skills/` and `.agents/skills/` with a metadata block.
- **Depends on:** M6-T09, M6-T08. (Step 4 uses `scanProject` of M6-T06 when it exists; when it does not, step 4 leaves a marker that M6-T06 replaces.)
- **Kind:** `cli`. Size S.

### Read first

doc 07: `### 7.13 ` whole (2.6 kB). doc 08: in `### 4.1 ` the two numbered items at the top and the paragraph that starts "`ripple skills sync` (algorithm owned by" (1.3 kB). This file 0.5 (row `syncSkills`), 0.8.

### Files

Create: `src/cli/commands/skills.ts`, `src/cli/commands/skills.test.ts`. Change: `src/cli/index.ts` (the `skills` line only).

### Steps

1. Branch `task/M6-T26-skills-sync`.
2. Pure helpers in `skills.ts` (export them; M6-T27 and the tests use them):
   - `injectMetadata(skillMd: string, meta: { source: string; version: string; hash: string }): string`. `SKILL.md` starts with a line `---` and has a second line that is exactly `---`. Insert, immediately before that second line, the four lines of rule 4 of `### 7.13 ` (`metadata:`, two spaces then `source: "<pkg>"`, two spaces then `version: "<running version>"`, two spaces then `hash: "sha256:<64 hex>"`). A file without that frontmatter throws `new Error("SKILL.md has no frontmatter")`.
   - `stripMetadata(skillMd: string): { text: string; meta: { source: string; version: string; hash: string } | null }`. Convert CRLF to LF first. Inside the frontmatter, find a line that is exactly `metadata:` followed by lines that start with two spaces; remove the `metadata:` line and those lines; read `source`, `version`, `hash` from them with `/^  (source|version|hash): "(.*)"$/`. `meta` is null when the block or any of the three keys is absent.
   - `skillHash(files: { path: string; content: string }[]): string`. Rule 3: exclude the sidecar `ripple.json`; convert CRLF to LF in every content; replace the content of `SKILL.md` by `stripMetadata(...).text`; sort by `path` (POSIX separators, plain code-unit order); feed `<path>\0<content>\0` for each to one SHA-256; return the 64 lower-case hex digits.
3. `syncSkills(io, host, { force, dryRun }): SkillsPlan` (synchronous `node:fs`):
   1. Shipped set: every directory `<io.packageRoot>/skills/<name>/` that has a `ripple.json` whose `hosts` array contains `host`. An absent `skills/` directory is an empty set (true until M8).
   2. Destinations: `.claude/skills` and `.agents/skills` below `io.cwd`, always both (rule 2).
   3. Unless `dryRun`: remove every directory `<destination>/<anything>.ripple-sync` (rule 9, last sentence).
   4. Known package names for rule 5: `PKG_NAME`, plus every distinct `pkg` of `scanProject(io.cwd, host)` when `src/cli/plan.ts` exports `scanProject` (check with `grep -n "export function scanProject" src/cli/plan.ts`; when absent use `PKG_NAME` alone and leave a comment `// PLAN 4.4: M6-T06 adds trailer package names`).
   5. State of `<destination>/<name>/` (rule 5): directory absent gives `absent`; directory without `SKILL.md` gives `partial`; `stripMetadata` gives `meta === null`, or `meta.source` is not a known name, gives `unmanaged`; otherwise `managed`, with `modified = skillHash(files of the destination directory) !== meta.hash.slice("sha256:".length)`.
   6. Action per destination and shipped skill: the decision table of rule 6, literally. "Same version and hash" means `meta.version === VERSION` and `meta.hash` equals the shipped skill's hash; "shipped is the same version" means `meta.version === VERSION`.
   7. Rule 7: for every directory of a destination that is `managed` and whose name is not in the shipped set: unmodified gives `remove`, modified gives nothing (kept, not counted).
   8. Rule 8: when any pair is a conflict (state `unmanaged` without `force`), write nothing at all; `conflicts` lists each `<destination>/<name>` (project-relative, `/`), ascending.
   9. Unless `dryRun` and unless there is a conflict, apply. For `add` and `update` (rule 9): `mkdirSync` of `<destination>/<name>.ripple-sync` (recursive); write into it `SKILL.md` as `injectMetadata(shipped SKILL.md with LF line endings, { source: PKG_NAME, version: VERSION, hash: "sha256:" + shipped hash })`; `rmSync` of the old `<destination>/<name>` (recursive, force); `renameSync` of the staging directory to `<destination>/<name>`. Only `SKILL.md` is written (doc 08 4.1: "writing only `SKILL.md`"); the sidecar is never copied. For `remove`: `rmSync` (recursive).
   10. `lines`: for each destination, in the order `.claude/skills`, `.agents/skills`, the line of rule 10 with that destination's own counts: `Synced Ripple <VERSION> skills to <dir>: <a> added, <u> updated, <n> unchanged, <r> removed.` where `<dir>` is `.claude/skills` or `.agents/skills`. Skills skipped as `modified` are in none of the four numbers. With a conflict, `lines` is empty.
   11. The numbers `add`, `update`, `remove`, `unchanged`, `modified` of `SkillsPlan` count SKILL NAMES, not destination pairs: a name is counted once, under the first of `add`, `update`, `remove`, `modified`, `unchanged` that applies to either destination (a `partial` state and a forced `unmanaged` count as `update`). The spec does not say how the two destinations combine; this is PLAN-CHOSEN. Record under `## Ledger issues` of doc 07: `M6-T26: how skills counts combine across the two destinations is not specified`.
4. `run(args, io, globals)`: `args[0]` MUST be `sync` (M6-T27 adds `check`); anything else: `error: unknown skills command "<value>".` and `fix: <command form> skills sync`, exit 2. Option `force` (boolean), strict. `const host = resolveHost(io, globals.host)`. Call `syncSkills(io, host, { force, dryRun: false })`.
   - Conflicts: for each, `error: <path> exists and was not written by Ripple.`; then once `fix: pass --force to replace it, or move the directory`; return 1 (wording PLAN-CHOSEN; rule 8 gives only the exit code).
   - Otherwise print `lines` with `io.out`. Then, when `createRequire(join(io.cwd, "package.json")).resolve("@shopify/hydrogen")` does not throw, print with `io.out` exactly: ``Hydrogen has its own skills. Run `npx @shopify/hydrogen skills sync` to install them.`` Return 0. Never copy a directory whose metadata `source` is `@shopify/hydrogen`.
5. `src/cli/index.ts`: replace `skills: stub, // PLAN 4.4: M6-T26` by `skills: () => import("./commands/skills.ts"),`.
6. Tests, `src/cli/commands/skills.test.ts`. A helper builds a package root in `tempDir()` with `skills/alpha/SKILL.md` (frontmatter `name: alpha`, `description: Alpha. Use when testing.`, then a body line), `skills/alpha/ripple.json` `{ "hosts": ["html", "liquid"] }`, `skills/beta/...` with `{ "hosts": ["liquid"] }`. Projects are `tempDir()` with `--host html` or `--host liquid`.
   - `[T1] skills: injectMetadata then stripMetadata returns the original text and the three values`.
   - `[T1] skills: skillHash ignores the sidecar, CRLF and the metadata block`.
   - `[T1] skills: sync on an empty project adds the host's skills to both destinations` (host `html`: `alpha` only; both `SKILL.md` files contain `` `source: "${PKG_NAME}"` `` (built from `PKG_NAME`, never the literal, 0.2), `version: "0.1.0"` and a `hash: "sha256:` line of 64 hex digits; no `ripple.json` is copied; stdout is the two `Synced Ripple 0.1.0 skills to ...: 1 added, 0 updated, 0 unchanged, 0 removed.` lines).
   - `[T1] skills: a second sync reports unchanged and writes nothing` (compare the two trees).
   - `[T1] skills: a partial directory is updated`.
   - `[T1] skills: an unmanaged directory is a conflict, exits 1 and nothing is written anywhere` (the other destination stays absent).
   - `[T1] skills: --force replaces an unmanaged directory`.
   - `[T1] skills: a managed unmodified skill is updated when the shipped text changes`.
   - `[T1] skills: a managed modified skill is kept when the shipped text changes and replaced with --force`.
   - `[T1] skills: a managed modified skill of the same version is unchanged`.
   - `[T1] skills: a managed skill that is no longer shipped is removed when unmodified and kept when modified`.
   - `[T1] skills: a leftover .ripple-sync directory is removed`.
   - `[T1] skills: the Hydrogen line is printed only when @shopify/hydrogen resolves` (create `node_modules/@shopify/hydrogen/package.json` with `{ "name": "@shopify/hydrogen", "version": "0.0.0", "main": "index.js" }` and an empty `index.js`, plus a project `package.json`).
   - `[T1] skills: dryRun writes nothing and returns the same counts` (call `syncSkills` directly).
   - `[T1] skills: a package without a skills directory syncs nothing and exits 0`.
7. Proof: PLAN 5.0.

### Acceptance

The fifteen tests pass. `grep -c "PLAN 4.4: M6-T26" src/cli/index.ts` prints `0`. `grep -c "export function syncSkills" src/cli/commands/skills.ts` prints `1`.

### Out of scope

`skills check` (M6-T27). Skill content and the `skills/` directory of the repository (M8). RP506 (M6-T31). Calling `syncSkills` from `init` (M6-T15) and from `computeLock` (M6-T22).

### If blocked

- `resolveHost` is absent: M6-T08 is not done; stop.
- The Hydrogen source `hydrogen/packages/hydrogen/src/cli/skills.ts` is not in the repository: do not look for it; the ten rules of `### 7.13 ` are complete for this task.
- `require.resolve("@shopify/hydrogen")` fails in the test because the stub has no resolvable entry: resolve `@shopify/hydrogen/package.json` as a second attempt in the code, and say so in the done file.

---

## M6-T27 Command `ripple skills check`

- **Goal:** Add `skills check`, which reports whether a sync would change anything and writes nothing.
- **Depends on:** M6-T26.
- **Kind:** `cli`. Size S.

### Read first

doc 07: the last paragraph of `### 7.13 ` (0.4 kB) and its usage block. Source: `src/cli/commands/skills.ts`.

### Files

Change: `src/cli/commands/skills.ts`, `src/cli/commands/skills.test.ts`.

### Steps

1. Branch `task/M6-T27-skills-check`.
2. In `run`, add the branch `args[0] === "check"`. Option `mode` (string, default `error`); a value other than `error` or `warn`: `error: --mode must be error or warn.`, exit 2 (wording PLAN-CHOSEN). `--force` is not an option of `check` (usage error, exit 2).
3. `const plan = syncSkills(io, host, { force: false, dryRun: true })`. Drift is `plan.add + plan.update + plan.remove + plan.conflicts.length > 0`.
   - No drift: `io.out("Ripple skills are up to date.")`, return 0.
   - Drift: `io.out("Ripple skills are out of date: <a> to add, <u> to update, <r> to remove.")` with `<a>` = `plan.add`, `<u>` = `plan.update + plan.conflicts.length`, `<r>` = `plan.remove`; then `io.err("fix: <command form> skills sync")`; return 1 for mode `error`, 0 for mode `warn`.
4. "A project with no synced skills counts as drift" holds through `plan.add` whenever the package ships at least one skill for the host. When the package ships none (true until M8) there is nothing to sync and the output is `Ripple skills are up to date.` The spec does not cover that case; record under `## Ledger issues` of doc 07: `M6-T27: skills check when the package ships no skill for the host is not specified; reported as up to date`.
5. Tests added to `src/cli/commands/skills.test.ts`:
   - `[T1] skills: check on a project with no synced skills reports drift and exits 1`.
   - `[T1] skills: check --mode warn prints the same lines and exits 0`.
   - `[T1] skills: check after sync prints Ripple skills are up to date. and exits 0`.
   - `[T1] skills: check counts a skill once for both destinations` (one shipped skill, nothing synced: `1 to add`).
   - `[T1] skills: check writes nothing` (tree comparison, including no `.claude` directory created).
   - `[T1] skills: check --mode nope exits 2`.
   - `[T1] skills: check with no shipped skills is up to date`.
6. Proof: PLAN 5.0.

### Acceptance

The seven tests pass together with the fifteen of M6-T26. `grep -c '"check"' src/cli/commands/skills.ts` prints at least `1`.

### Out of scope

RP506 (M6-T31 calls the same plan through the computed lock). Any change to `syncSkills` beyond a defect a new test exposes.

### If blocked

A stream question (whether the `fix:` line goes to standard error): doc 07 `### 7.1 ` rule 5 puts `fix:` lines with `error:` lines on standard error; follow that rule.

---

## M6-T28 Checker Liquid call tokeniser `src/check/liquid-calls.ts`

- **Goal:** Add the Liquid tag scanner `findLiquidCalls` and `findLiquidUses` from the spec's complete code, with its test, and make the engine fill `SourceFile.liquid`.
- **Depends on:** M1-T46.
- **Kind:** `checker`. Size M.

### Read first

doc 07: `#### 9.5.2 ` prose only (the three paragraphs outside the code block, 1.2 kB; do not read the code block into context, extract it), acceptance item 24 in `## 12. `, in `### 9.3 ` the line `export interface SourceFile`. Source: `src/check/engine.ts`.

### Files

Create: `src/check/liquid-calls.ts`, `src/check/liquid-calls.test.ts`. Change: `src/check/engine.ts` (step 4 only).

### Steps

1. Branch `task/M6-T28-liquid-calls`. When `src/check/liquid-calls.ts` already exists (an earlier task needed it), run `cmp` against the extraction of step 2; when identical go to step 3; when different, list the differences in the done file and keep the existing file unless a test of step 3 fails.
2. Extract (0.3):

   | Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
   |---|---|---|---|---|---|---|
   | `src/check/liquid-calls.ts` | `docs/07-manifest-registry-cli.md` | `#### 9.5.2 ` | `ts` | 0 | 8116 | `// src/check/liquid-calls.ts - finds {% block %}, {% render %} and {% partial %} tags in Liquid source and tokenises their arguments.` |

   The file exports exactly: types `ArgKind`, `CallArg`, `LiquidCall`, `LiquidUse`; functions `findLiquidCalls(source: string): LiquidCall[]` and `findLiquidUses(source: string): LiquidUse[]`. Run `pnpm typecheck`; fix only what the compiler names (M6-R3).
3. Write `src/check/liquid-calls.test.ts`. The spec names the cases but does not print the test, so the source text below is PLAN-CHOSEN. Build each source with an array of lines joined by `\n`.
   - `[T1] liquid-calls: findLiquidCalls returns the 7 calls with kinds and positions`. Source lines, in order:
     1. `{% block 'button', label: 'Add', variant: 'primary' %}`
     2. `{% block 'stack',`
     3. `  gap: 4,`
     4. `  wrap: true %}`
     5. `{%- render 'rp-icon', name: 'cart' -%}`
     6. `{% liquid`
     7. `  block 'badge', tone: nil`
     8. `%}`
     9. `{% comment %}{% block 'hidden', a: 1 %}{% endcomment %}`
     10. `{% block 'text', content: product.title | escape %}`
     11. `{% partial 'rp-cart-lines' %}`
     12. `{% block 'link', label: 'a, b: c', href: '/x' %}`

     Assert: `calls.length === 7`; tags `["block","block","render","block","block","partial","block"]`; names `["button","stack","rp-icon","badge","text","rp-cart-lines","link"]`; lines `[1,2,5,7,10,11,12]`; `calls[0].col === 4` and `calls[2].col === 5` (the position of the tag name, 1-based); `calls[0].args.map((a) => [a.name, a.kind, a.value])` equals `[["label","string","Add"],["variant","string","primary"]]`; `calls[0].args[0].text === "label: 'Add'"`; `calls[1].args.map((a) => [a.name, a.kind, a.value, a.line])` equals `[["gap","number",4,3],["wrap","boolean",true,4]]`; `calls[3].args[0].kind === "nil"` and `.value === null`; `calls[4].args[0].kind === "expression"` and `.value === null`; `calls[6].args.map((a) => a.name)` equals `["label","href"]` and `calls[6].args[0].value === "a, b: c"`; no call has the name `hidden`. These values were produced by running the spec's code on these twelve lines with Node 22.23 on 2026-11-22.
   - `[T1] liquid-calls: a call whose first operand is a variable has name null` (the single line `{% block name_var, size: 'sm' %}`: one call, `name === null`, one argument `size`).
   - `[T1] liquid-calls: findLiquidUses returns tags and filters in source order`. Acceptance item 24 fixes the result; the source is PLAN-CHOSEN. Lines:
     1. `{% doc %}`
     2. `  @param {string} title - uses {% render %} and | upcase in prose`
     3. `{% enddoc %}`
     4. `{% liquid`
     5. `  # a comment line with | downcase`
     6. `  assign parts = settings.list | split: ','`
     7. `  unless parts == blank`
     8. `    assign first = parts[0] | escape`
     9. `  endunless`
     10. `  echo 'a | b' | escape`
     11. `%}`
     12. `{% if show %}{{ title | default: 'x' }}{% endif %}`
     13. `{% render 'rp-icon', name: icon | url_encode %}`
     14. `{% for item in items %}{{ item | standard_event_data }}{% endfor %}`
     15. `{% comment %}{% section 'x' %}{{ y | upcase }}{% endcomment %}`
     16. `{% javascript %}const a = b | c{% endjavascript %}`
     17. `{% schema %}{ "name": "x | y" }{% endschema %}`
     18. `{{ last | escape }}`

     Assert `uses.filter((u) => u.kind === "tag").map((u) => u.name).join(" ")` equals `doc liquid assign unless assign echo if render for comment javascript schema` and `uses.filter((u) => u.kind === "filter").map((u) => u.name).join(" ")` equals `split escape escape default url_encode standard_event_data escape`. Assert the first use is `{ kind: "tag", name: "doc", line: 1, col: 4 }`. Both strings were reproduced with the spec's code on these lines on 2026-11-22.
   - `[T1] liquid-calls: an unterminated tag does not throw` (`{% block 'button', label: 'x'` with no closing: the result is `[]`).

   When an assertion on line numbers, columns or the two joined strings fails, FIRST re-check the test source against the lists above (a mistyped line is the usual cause), THEN adjust the PLAN-CHOSEN source lines so that the function output matches item 24. Change `liquid-calls.ts` only when a result contradicts the prose of `#### 9.5.2 ` or item 24 itself, and list the change under "Deviations".
4. Engine: run `grep -n "liquid" src/check/engine.ts`. Where the engine builds a `SourceFile`, set `liquid: path.endsWith(".liquid") ? findLiquidCalls(text) : null`. When it already does, change nothing. Remove any `PLAN 4.4` comment that names M6-T28.
5. Proof: PLAN 5.0.

### Acceptance

`pnpm test:unit --files=src/check/liquid-calls` passes with the four tests. `cmp <(node node_modules/.cache/ripple/extract.mjs docs/07-manifest-registry-cli.md '#### 9.5.2 ' ts 0 /dev/stdout | sed '$d') src/check/liquid-calls.ts` reports no difference, or every difference is listed under "Deviations". `grep -c "findLiquidCalls" src/check/engine.ts` prints at least `1`. `grep -rn "PLAN 4.4: M6-T28" src` prints nothing.

### Out of scope

Rules that use the calls (M2-T29: RP101 to RP104 on Liquid; M6-T29: RP401 to RP404). A Liquid parser: the file is a tag scanner and MUST stay one.

### If blocked

- The extractor prints a byte count other than 8116 or another first line: the doc changed; stop and report (0.3).
- The first test cannot reach seven calls with the lines above (for example the `{% liquid %}` call is not found): keep the failing assertion, do not delete the case, open a draft pull request with the actual output pasted, and write no done file. The spec states the function was run on exactly these six kinds of call.

---

## M6-T29 Checker family "Liquid": RP401 to RP406

- **Goal:** Add the six checker rules RP401 to RP406, each with a bad and a good example and tests.
- **Depends on:** M6-T28. (The tests of RP405 and RP406 call `rule.project()` directly, because the layer P driver is M6-T31.)
- **Kind:** `checker`. Size M.

### Read first

doc 07: in `### 9.3 ` the interfaces `RuleMeta`, `RuleContext`, `SourceFile`, `Rule` and "Engine rules" (2.5 kB); in `### 9.6 ` only the six rows RP401 to RP406 (2.5 kB); `### 9.7 ` (0.6 kB); the last paragraph of `#### 9.5.2 ` ("A call ... is a call of component C"); acceptance item 24a (first sentence). doc 08: `### 5.4 ` and in `### 5.5 ` only the rows RP401 to RP406 and the last note ("`bad` and `good` examples") (2.5 kB). `docs/06-bindings.md`: the item that starts `**L-13 Liquid subset` up to `**L-14` (2 kB). Source: `src/check/rules/RP113.ts`, `src/check/rules/RP113.test.ts`, `src/check/rules/index.ts`. This file 0.5 row `RuleContext.cwd`, PR-M6-10.

### Files

Create: `src/check/rules/RP401.ts` to `RP406.ts` and one `.test.ts` beside each (12 files). Change: `src/check/rules/index.ts` (add the six, ascending id order). `RuleContext.cwd` exists since M0-T42 (ledger D-142); do not change `src/check/index.ts` or `src/check/engine.ts`.

### Steps

1. Branch `task/M6-T29-rules-rp4xx`. Rules RP402, RP403, RP405 and RP406 read project files below `context.cwd` (ledger D-142).
2. Per rule, copy the module shape of `src/check/rules/RP113.ts`. `meta.id`, `severity`, `layers`, `hosts` from the 9.6 row (`hosts` of RP401 to RP405 is `["liquid"]`; RP406 is all four); `meta.title` is the first sentence of the "Detects" cell; `meta.why` is the "why" cell of the doc 08 row. `text.problem` and `text.fix` are the doc 08 cells; where a cell has two forms separated by "or" or `/`, `text.problem` and `text.fix` hold the cell text unchanged and the rule passes the chosen form to `report`. Write `<command form>` as the literal token (PR-M6-10). Fill every `{placeholder}` (doc 08 5.4).
3. Detection. Implement the 9.6 "Detects" cell literally. Details the cells leave open are fixed here (PLAN-CHOSEN where marked):

   | Rule | Function | Detection |
   |---|---|---|
   | RP401 (a) | `source` | The file path starts with `blocks/` or `snippets/` and `findLiquidUses(file.text)` has a use `{ kind: "tag", name: "block" }`: one diagnostic per such use, at its line and column. Problem form `{% block %} in {file}`. Fix: when the tag's first operand is a quoted name `<name>` and `<context.cwd>/snippets/rp-<name>.liquid` exists, `{% render 'rp-<name>' %}`; else `move the block call to a template or layout` |
   | RP401 (b) | `source` | Only for a `.liquid` file that carries a Ripple trailer. `src/check` may not import `src/cli/trailer.ts`, so the trailer id is taken from the computed lock: the entry whose `path` equals `file.path` among `lock.core`, `lock.components[*].files`, `lock.blueprints[*].files` (PLAN-CHOSEN). With `context.lock === null`, or no entry, item (b) does not run for the file. Scope from the id as the 9.6 cell says (owner is the id text before the first `/`). Report each use of `findLiquidUses` whose `name` is not in the scope's tag list (for `kind: "tag"`) or filter list (for `kind: "filter"`). Problem form `"{name}" is outside the Ripple Liquid subset for {file}`; `allowed` is the scope's list joined by ` \| `; fix `allowed in this file: <the scope's list>` |
   | RP401 data | - | `export const LIQUID_SUBSET` in `RP401.ts`: `{ component: { tags: string[]; filters: string[] }; blueprint: { tags: string[]; filters: string[] }; infrastructure: { tags: string[]; filters: string[] } }` (key names PLAN-CHOSEN), copied from doc 06 L-13. When L-13 defines a scope as "the previous scope plus ...", store the full list in each scope. Objects and globals are not checked |
   | RP402 | `source` | For each `file.liquid` call with `tag === "block"` and `name !== null`: `<context.cwd>/blocks/<name>.liquid` does not exist. Prefix: `context.lock?.prefix.liquidFile ?? ""`. When `<name>` minus the prefix equals `C.liquid.block` or a part's block name of a manifest component C: fix `<command form> add <C id>`. Otherwise the fix is the nearest existing base name of `blocks/*.liquid` (Levenshtein, private function) written as `'<name>'`, or null when `blocks/` is empty. `meta.layers` is `["S", "P"]` as the row says; the rule has no `project` function (the row gives no separate layer P detection; PLAN-CHOSEN) |
   | RP403 | `source` | Runs for every `.liquid` file. Region names used: every literal value of a `data-rp-refresh` attribute in `file.text` (`/data-rp-refresh="([^"]*)"/g`; split the value on white space; skip a token that contains `{`). Declared partials: `findLiquidCalls` with `tag === "partial"` and a non-null `name`, over every file under `<context.cwd>/layout/` and `<context.cwd>/templates/` (read with `node:fs`; cache the result per `context` in a `WeakMap`). A used name with no declaration: problem `region "{region}" has no {% partial %}`. In a file under `layout/` or `templates/`: a partial name declared twice in that file: problem `partial "{region}" is declared twice`, reported at the second declaration |
   | RP404 | `source` | In one file, in source order: a `partial` call opens a region named by its `name`; the next match of `/\{%-?\s*endpartial\s*-?%\}/` closes it. A `block` call positioned between them whose name minus the prefix equals `liquid.block` of one of the manifest components `dialog`, `drawer`, `cart-drawer`, `mobile-nav`, `product-gallery` (use only the ids present in `context.manifest.components`) is reported. `{Component}` is the component's title; `{region}` the partial name |
   | RP405 | `project` | `n1` = number of `*.liquid` files in `<context.cwd>/blocks/`; when `n1 > 300`: `{n}` = n1, `{max}` = 300. Else, with a lock: `n2` = number of files in `lock.components[*].files` whose `path` starts with `blocks/`; when `n2 > 150`: `{n}` = n2, `{max}` = 150. At most one diagnostic; `file: null` |
   | RP406 | `project` | Error (host `liquid` only): `<context.cwd>/AGENTS.md` exists and `statSync(...).size > 50000`; problem `AGENTS.md is {n} bytes; limit 50000`; fix `shorten the text outside the Ripple markers`. Warning (all hosts; pass `severity: "warning"` to `report`): `context.lock` has a patch with id `core/patch:agents` and state `absent` or `stale`; problem `the Ripple section of AGENTS.md is missing or out of date`; fix `<command form> upgrade`. `file: "AGENTS.md"` |

4. `text.bad` and `text.good`: the smallest example and the same example fixed (doc 08 5.5 last note). For RP401 to RP404 they are Liquid source. For RP405 and RP406 (layer P only, fence language `text`) they are one line describing the state (for example `blocks/: 301 files` and `blocks/: 300 files`); a layer P example cannot be executed, so the test builds the state the line describes (PLAN-CHOSEN).
5. Register the six rules in `src/check/rules/index.ts`.
6. Tests, each `src/check/rules/<N>.test.ts`. Build the context the way `RP113.test.ts` does, plus `cwd` pointing at a `tempDir()` project the test writes. Every rule: `[T1] <N>: bad example reports exactly one <N> diagnostic`; `[T1] <N>: good example reports nothing`; `[T1] <N>: meta matches the 9.6 row`. In addition:
   - `[T1] RP401: case a reports a block tag in snippets/ and not in templates/`.
   - `[T1] RP401: case b reports javascript in a file with trailer id button/block` (item 24a; lock entry `{ id: "button/block", path: "blocks/button.liquid" }`).
   - `[T1] RP401: case b does not report block in a file with trailer id blueprint.product/template` (item 24a).
   - `[T1] RP401: a file without a lock entry is checked only by case a`.
   - `[T1] RP401: scope infrastructure is chosen for owner core and for blueprint.layout/import-map`.
   - `[T1] RP402: the fix is the add command for a manifest block and the nearest name otherwise`.
   - `[T1] RP402: a call with a variable name is skipped`.
   - `[T1] RP403: a region with no partial is reported` and `[T1] RP403: a partial declared twice in one template is reported once`.
   - `[T1] RP404: a dialog block between partial and endpartial is reported and one after endpartial is not`.
   - `[T1] RP405: 301 block files report limit 300` and `[T1] RP405: 151 Ripple block files in the lock report limit 150`.
   - `[T1] RP406: a 50001 byte AGENTS.md is an error on liquid and nothing on html`; `[T1] RP406: patch state stale is a warning on every host`.
7. Proof: `pnpm typecheck && pnpm test:unit --files=src/check/rules/ --no-skips`, then PLAN 5.0.

### Acceptance

`ls src/check/rules/RP40[1-6].ts | wc -l` prints `6`; the same with `.test.ts` prints `6`. `pnpm test:unit --files=src/check/rules/ --no-skips` exits 0. `pnpm ci` exits 0 (no existing fixture, example or registry file may trigger a new rule). `grep -c "LIQUID_SUBSET" src/check/rules/RP401.ts` prints at least `1`.

### Out of scope

Theme Check and its duplicate suppression (M6-T30). The layer P driver (M6-T31). Rule pages (generated by M6-T14 from `meta` and `text`). `meta.expected.json` (M8-T01).

### If blocked

- L-13 does not give a filter list for a scope: stop; draft pull request quoting L-13. Do not derive a list from the Liquid files in the repository.
- A registry Liquid file of the repository triggers RP401 (b): the file or the list is wrong. Do not edit either; draft pull request naming the file, the name reported and the scope.
- `ComputedLock` in `src/types.ts` has no `prefix`, `components` or `patches` yet (M6-T22 not merged): read the fields through an optional chain on a local type `{ prefix?: { liquidFile?: string }; ... }` and note it in the done file; M6-T22 completes the type.
- Unsure how the value of `data-rp-refresh` is written: search `data-rp-refresh` in `docs/05-commerce.md`, read the defining paragraph only; when it contradicts the white-space split above, follow doc 05 and record it under `## Ledger issues` of doc 07.

---

## M6-T30 Checker Theme Check sub-step (`TC:<CheckName>`) in `src/check/engine.ts` (D-148)

- **Goal:** Run Theme Check on Liquid projects when it is installed, merge its offenses into the report as `TC:<CheckName>` diagnostics, and suppress the duplicated Ripple rules.
- **Depends on:** M6-T29.
- **Kind:** `checker`. Size S.

### Read first

doc 07: `#### 9.5.4 ` (1.1 kB), the "What runs per host" table of `### 9.1 ` (0.8 kB), in `### 9.3 ` the interfaces `Diagnostic` and `Report`, `### 13.3 ` item 1. doc 01: the `src/check/**` row of the table in section 2.2 (search `| \`src/check/**\` |`). Source: `src/check/engine.ts`.

### Files

Change: `src/check/engine.ts` (the five exports of step 2 and the call of step 3). Create: `src/check/engine.test.ts` (append when it exists). There is no file `src/check/theme-check.ts` (ledger D-148).

### Steps

1. Branch `task/M6-T30-theme-check`.
2. In `src/check/engine.ts` (names PLAN-CHOSEN, internal; `src/check/index.ts` does not re-export them):

   ```ts
   export interface ThemeCheckOffense { check: string; severity: number; uri: string; start: { line: number; character: number }; message: string }
   export type ThemeCheckModule = { themeCheckRun(root: string): Promise<{ offenses: ThemeCheckOffense[] }> }
   export function loadThemeCheck(cwd: string): Promise<ThemeCheckModule | null>
   export function mapOffenses(offenses: ThemeCheckOffense[], cwd: string): Diagnostic[]
   export function suppressDuplicates(diagnostics: Diagnostic[]): Diagnostic[]
   ```

   - `loadThemeCheck`: try `createRequire(join(cwd, "package.json")).resolve("@shopify/theme-check-node")`; on a throw try `createRequire(import.meta.url).resolve("@shopify/theme-check-node")`; on a second throw return `null`. Load the resolved path with `await import(pathToFileURL(resolved).href)`. No static `import` of the package anywhere (doc 01: dynamic `import()` only).
   - `mapOffenses`: rule 3 of `#### 9.5.4 `. Severity `0` gives `error`, `1` gives `warning`, `2` is dropped. `file` is `relative(cwd, fileURLToPath(uri))` with `\` replaced by `/`; `line: start.line + 1`; `col: start.character + 1`; `rule: "TC:" + check`; `problem: message`; `url`, `selector`, `component`, `found`, `allowed`, `fix`, `why`, `docs` are null.
   - `suppressDuplicates`: rule 4. Build the set of `file + ":" + line` of every diagnostic whose `rule` starts with `TC:`. Drop every diagnostic whose `rule` is `RP102`, `RP104` or `RP401` and whose `file` and `line` are in the set. The spec limits RP104 to "doc params"; a diagnostic does not record that, so every RP104 on such a line is dropped (PLAN-CHOSEN; add `M6-T30: RP104 suppression cannot tell doc params from other findings` under `## Ledger issues` of doc 07; this is a finding, not a plan reading).
3. Engine: after layers S and H, when `options.host === "liquid"` and `options.rules` is absent (a `--rule` selection lists Ripple rule ids only, so Theme Check does not run with it; PLAN-CHOSEN):
   - `const mod = await loadThemeCheck(options.cwd)`. When `null`: push the note `Theme Check did not run: @shopify/theme-check-node is not installed. Run "shopify theme check" separately.` and continue.
   - Otherwise `const { offenses } = await mod.themeCheckRun(options.cwd)`; append `mapOffenses(...)`; when `options.paths` is given keep only the TC diagnostics whose `file` is one of the examined source files (PLAN-CHOSEN); then `suppressDuplicates` over all diagnostics, before sorting and counting.
   - A throw from `themeCheckRun` adds the note `Theme Check did not run: <error message>` and continues (PLAN-CHOSEN; the spec covers only "not installed").
   - TC diagnostics are counted in `counts` and sorted like any other.
4. Tests, `src/check/engine.test.ts`:
   - `[T1] engine: theme check mapOffenses maps severity, file, line and col` (hand-built offenses of severities 0, 1, 2; `uri` from `pathToFileURL(join(dir, "snippets/x.liquid")).href`; expect two diagnostics, `file === "snippets/x.liquid"`, `line === start.line + 1`).
   - `[T1] engine: theme check suppressDuplicates drops RP102, RP104 and RP401 on a TC line and keeps RP101`.
   - `[T1] engine: theme check positions are zero-based in the installed @shopify/theme-check-node`. This is the test the spec requires (UNVERIFIED item 1 of 13.3). Write a theme in `tempDir()`: `layout/theme.liquid` holding `<html><head>{{ content_for_header }}</head><body>{{ content_for_layout }}</body></html>`, `snippets/x.liquid` holding three lines: `<p>a</p>`, `<p>b</p>`, `{% assign rp_unused = 1 %}`, and empty directories `templates/`, `config/`, `locales/`. Call `loadThemeCheck(repository root)` then `themeCheckRun(dir)`. Find the offense whose `check` is `UnusedAssign`; assert `mapOffenses` gives it `file === "snippets/x.liquid"` and `line === 3`, and `col >= 1`. The offense name and its exact column are UNVERIFIED by this plan: when no `UnusedAssign` offense is returned, print all offenses, choose one whose source line is known from the input, and assert its line with the same `+ 1` rule.
   - `[T1] engine: theme check the engine adds the not-installed note when the loader returns null` (call the engine function with a loader that returns `null`; give the engine an optional internal parameter or a module-level setter `__setThemeCheckLoader` used only by tests; PLAN-CHOSEN).
   - `[T1] engine: theme check Theme Check does not run for host html and does not run with a --rule selection`.
5. Proof: PLAN 5.0.

### Acceptance

The five tests pass (`pnpm test:unit --files=src/check/engine`). `test ! -e src/check/theme-check.ts` succeeds. `grep -n "from \"@shopify/theme-check-node\"" -r src` prints nothing. `pnpm test:unit --files=src/architecture` passes (test A-05: `dist/check` loads without the package). `pnpm ci` exits 0.

### Out of scope

Configuring Theme Check (`.theme-check.yml` is the project's). Any text for TC findings (doc 08 5.5 note: Theme Check's own message). RP102 and RP104 themselves (M2).

### If blocked

- `@shopify/theme-check-node` is not installed in the repository (`ls node_modules/@shopify/theme-check-node` fails): it is a devDependency by doc 01 section 6 (`"@shopify/theme-check-node": "4.0.2"`); run `pnpm install --frozen-lockfile`. Still absent: write the third test with `{ skip: "theme-check-node not installed" }`, do NOT add the dependency, record `BLOCKED-ON-ENV` for that test in a draft pull request.
- `themeCheckRun` needs the network (it tries to download theme documentation) and the test hangs or fails offline: wrap the call in a 20 s timeout; on timeout treat it as the previous bullet and record under `## Ledger issues` of doc 07 that the zero-based assertion stays UNVERIFIED.
- The assertion `line === 3` fails with `line === 4`: positions are one-based in this version. Remove the `+ 1` from `mapOffenses` for both `line` and `col`, keep the test with the corrected expectation, and record the finding under `## Ledger issues` of doc 07.

---

## M6-T31 Checker family "project state" (layer P): RP501 to RP508, RP510 to RP512

- **Goal:** Add the eleven project-state rules, the engine's layer P driver, and pass the computed lock from `ripple check`.
- **Depends on:** M6-T06, M6-T22. (Step 8 changes `src/cli/commands/check.ts` of M6-T23; when `docs/plan/done/M6-T23.md` does not exist, skip step 8 and say so in the done file; M6-T23 then passes the lock itself.)
- **Kind:** `checker`. Size M.

### Read first

doc 07: in `### 9.6 ` only the rows RP501 to RP512 and the line "RP509 is reserved" (3.5 kB); `### 5.3 ` the JSON example and the "Field definitions" table (4.3 kB); in `### 9.3 ` the interfaces `CheckOptions`, `RuleContext`, `HtmlDocument`, `Rule` and "Engine rules" (2.5 kB); the last paragraph of `### 9.2 ` ("`check` works before `init`"); `#### 9.4.1 ` item 1. doc 08: `### 5.4 ` and in `### 5.5 ` only the rows RP501 to RP512 and the last note (3 kB). doc 03: `### 5.2 ` (the CSS entry; 1 kB). Source: `src/check/rules/RP113.ts`, `src/check/engine.ts`, `src/types.ts` (the type `ComputedLock`).

### Files

Create: `src/check/rules/RP501.ts` to `RP508.ts`, `RP510.ts`, `RP511.ts`, `RP512.ts` and one `.test.ts` beside each (22 files). Change: `src/check/rules/index.ts`, `src/check/engine.ts` (layer P driver), `src/check/check.test.ts` (driver tests; create when absent), `src/cli/commands/check.ts` (step 8).

### Steps

1. Branch `task/M6-T31-rules-rp5xx`. RP503 and RP505 read project files below `context.cwd` (it exists since M0-T42, ledger D-142).
2. Layer P driver in the engine. Run `grep -n "project" src/check/engine.ts` first; when a driver exists, make it satisfy this list, else add it:
   - `options.lock` undefined: layer P does not run; the note that says so stays.
   - Otherwise set `context.lock = options.lock` and call `rule.project(context)` for every rule that has `project`, has `"P"` in `meta.layers`, has `options.host` in `meta.hosts` and passes the `--rule` filter.
   - `options.lock.initialized === false`: call only RP405, RP503 and RP504 (doc 07 `### 9.2 ` last paragraph).
   - A diagnostic from `project` with `file: null` and `url: null` is printed with the location word `project` (9.4.1 item 1); check `formatText` does this and add it when it does not.
   - Layer P runs once per `check()` call, on the whole project, also when `paths` are given.
3. Module shape, `meta` and `text` as in M6-T29 step 2 (hosts: RP503 and RP505 are `["html", "react", "remix"]`; the others all four). Token `<command form>` literal.
4. Detection (the 9.6 cells are normative; the table fixes what they leave open, PLAN-CHOSEN where marked):

   | Rule | Function | Detection |
   |---|---|---|
   | RP501 | `project` | For each id in `lock.components`: (1) for each entry of its `missing` list: one diagnostic, `{Component}` the component title, `{name}` the entry, fix `<command form> add <id>`; (2) for each id in the transitive closure of `manifest.components[id].dependencies` that is not a key of `lock.components`: one diagnostic, `{name}` the dependency id, fix `<command form> add <dependency id>`. `component` is the id; `file: null` |
   | RP502 | `project` | `n` = number of files in `lock.core`, `lock.components[*].files`, `lock.blueprints[*].files` whose `state` is `outdated` or `modified-outdated`. `n > 0`: exactly one diagnostic with `{n}` |
   | RP503 | `project` | For each name of `@ui-sdk/core`, `@ui-sdk/web`, `@shopify/hydrogen`: collect every `package.json` at `<cwd>/node_modules/**/<name>/package.json`. Walk with `readdirSync` (`withFileTypes`), descending into every directory named `node_modules`, every scope directory `@*`, every package directory's own `node_modules`, and `.pnpm/*/node_modules`; follow symbolic links but identify a copy by `realpathSync` of its directory, and never visit a real path twice. More than one distinct real path: `{n} copies of {name} are installed`. Exactly one, and `manifest.pins[name]` is defined and differs from its `version`: `{name} is {version}; expected {value}`. `{value}` in the fix is `manifest.pins[name]`. No copy: nothing |
   | RP504 | `project` | One diagnostic per entry of `lock.unmanaged`, `file` = the path |
   | RP505 | `source` | Read `<cwd>/ripple.json` with `node:fs` and `JSON.parse` (no import of `src/cli`); cache per context. (a), (b), (c) apply only to the file whose path equals its `css` value: follow doc 03 `### 5.2 ` for what the first statements of the entry are; report the matching one of the first three problem forms of the doc 08 row; `fix` is the corrected first lines exactly as doc 03 `### 5.2 ` prints them. (d) any scanned file whose text contains `@tailwindcss/browser`: problem `@tailwindcss/browser is used`, fix `remove @tailwindcss/browser; compile Tailwind in the project's build`. No `ripple.json`: only (d) runs |
   | RP506 | `project` | `lock.skills.pending.add + pending.update + pending.remove > 0`, or `lock.skills.conflicts.length > 0`: one diagnostic, `{version}` = `lock.skills.version` |
   | RP507 | `html` | Every `script` element with a `src`. Take the `src`, cut it at the first `?` or `#`, and test whether it ends with `/ripple.js` or `/ripple.elements.js`, or equals `ripple.js` or `ripple.elements.js`. More than one match in the document: one diagnostic at the second matching element; `{n}` the count; `{value}` the matching `src` values joined by `, ` |
   | RP508 | `project` | One diagnostic per file in `lock.core` (and any other list) with `mode === "derived"` and `state` `stale` or `modified`; `{file}` its path |
   | RP510 | `project` | One diagnostic per entry of `lock.patches` with `state === "absent"` (`skipped` and `stale` are not reported here). `{file}` the patch `path`. `{value}` from a constant `PATCH_VALUE: Record<string, string>` in `RP510.ts`, keyed by patch id, holding for each `core/patch:*` id the one line the user must add, copied from the sub-section of doc 07 `### 7.6 ` that defines that patch (read only the paragraph that prints the inserted line or region; for a multi-line region use its start marker line). An id without an entry uses the id itself as `{value}` |
   | RP511 | `source` | Lines matched by `/^(<<<<<<< yours\|\|\|\|\|\|\|\| installed\|>>>>>>> upstream)/m` (written here with escaped bars; the three literal prefixes are `<<<<<<< yours`, seven bars then ` installed`, `>>>>>>> upstream`). One diagnostic per line that starts with `<<<<<<< yours`; when a file has none of those but has one of the other two, one diagnostic at the first such line. All hosts, every scanned file |
   | RP512 | `project` | For each entry of `lock.duplicates`: one diagnostic per path after the first; `{file}` that path, `{name}` the entry id |

5. `text.bad` and `text.good`: RP505 is CSS (the entry with the wrong order, and the entry of doc 03 `### 5.2 `); RP507 is HTML (two `script` tags, one `script` tag); RP511 is a three-line conflict and the resolved line; the layer P rules use one describing line each, as in M6-T29 step 4.
6. Register the eleven rules in `src/check/rules/index.ts` (ascending; RP509 is absent).
7. Tests. A helper `lock(overrides)` in each test file (or one shared `src/check/rules/lock.fixture.ts`, not a test file) returns a complete `ComputedLock` with `initialized: true`, empty lists, and the overrides applied. Every rule: the three standard tests of M6-T29 step 6 (for a layer P rule "bad example" means the state built from `text.bad`). In addition:
   - `[T1] RP501: a missing file and a missing dependency are two diagnostics`; `[T1] RP501: a transitive dependency is found`.
   - `[T1] RP502: three outdated files give one diagnostic with n 3`.
   - `[T1] RP503: two copies under node_modules and nested node_modules are reported`; `[T1] RP503: a pnpm symlink to the same real path is one copy`; `[T1] RP503: a version that differs from manifest.pins is reported`; `[T1] RP503: no copy reports nothing`.
   - `[T1] RP505: each of the four problem forms` (four tests, names `case a` to `case d`).
   - `[T1] RP507: one of each runtime is reported and a query string is ignored`.
   - `[T1] RP510: skipped and stale patches are not reported`.
   - `[T1] RP511: one conflict gives one diagnostic`; `[T1] RP511: a line that only contains seven equal signs is not reported`.
   - In `src/check/check.test.ts`: `[T1] check: layer P does not run without a lock and the note says so`; `[T1] check: with an uninitialized lock only RP405, RP503 and RP504 run` (lock with `initialized: false`, one `unmanaged` path and one outdated file: RP504 is reported, RP502 is not); `[T1] check: a layer P diagnostic without a file prints the location project`; `[T1] check: layer P runs when paths are given`.
8. `src/cli/commands/check.ts`: replace `lock: undefined` by `lock: computeLock(io, host)` (import from `./status.ts`). Add to `src/cli/commands/check.test.ts`: `[T1] check: a file without a trailer at a registry path is reported as RP504` (needs `fixturePackageRoot()` of M6-T15; when M6-T15 is not merged write the test against a hand-built package root as M6-T24 does).
9. Proof: `pnpm typecheck && pnpm test:unit --files=src/check/ --no-skips && pnpm test:unit --files=src/cli/commands/check --no-skips`, then PLAN 5.0.

### Acceptance

`ls src/check/rules/RP50[1-8].ts src/check/rules/RP51[0-2].ts | wc -l` prints `11`; the same with `.test.ts` prints `11`; `ls src/check/rules/RP509.ts` fails. The tests of step 7 pass. `grep -c "computeLock" src/cli/commands/check.ts` prints at least `1` (when step 8 ran). `pnpm ci` exits 0.

### Out of scope

Computing the lock (M6-T22). `skills check` (M6-T27). The combined scenario "`upgrade --write-conflicts` then `check` reports RP511" (M6-T34). Layer B.

### If blocked

- The task does not fit one session (22 files): finish the driver (step 2), RP501, RP502, RP504, RP506, RP508, RP510, RP512 and step 8; merge that; write the done file with the line `FOLLOW-UP NEEDED: RP503, RP505, RP507, RP511` and ask the coordinator for a follow-up row. Never register a rule file that has no test.
- `manifest.pins` is not keyed by package name: read the manifest schema entry for `pins` in `src/gen/schema/manifest.schema.json`, use the key it defines, and note it in the done file.
- doc 03 `### 5.2 ` does not let you tell forms (a), (b), (c) apart: implement (d) and the forms you can decide, record the rest under `## Ledger issues` of doc 07 as `RP505 partial`, and do not guess.
- `computeLock` throws on a project without `ripple.json`: that is a defect of M6-T22 (`initialized: false` is required); catch nothing, open a draft pull request naming M6-T22.

---

## M6-T32 Checker layer B procedure: the driver and `src/check/flows.ts` (no `src/check/browser.ts`, D-148)

- **Goal:** Add the browser driver that loads each `--url` in Chromium in three passes and collects the facts the RP601 to RP609 rules read, plus the no-JavaScript flow data.
- **Depends on:** M1-T46. (`src/testing/upgrade-diff.ts` and the test helpers `getFixtureServer`, `fixturePageUrl` of `test/support/server.ts` exist since M0 and M1.)
- **Kind:** `checker`. Size M.

### Read first

doc 07: `#### 9.5.5 ` (1.1 kB); in `### 9.6 ` only the rows RP601 to RP609 (3 kB); the `--browser` row of `### 9.2 `; in `### 9.3 ` the interfaces `CheckOptions`, `RuleContext`, `Rule`; `### 13.3 ` item 6. doc 13: in `### 4.3 ` (search `export interface UpgradeDiffOptions`) the declarations `UpgradeRecord`, `UpgradeDiffOptions`, `UpgradeReport`, the signature of `upgradeDiff`, and rules UD-1 to UD-6 (3 kB; do not read the recorder body); rules W-1, W-2, W-4 (search `- **W-1**`); the paragraph that starts `` `getFixtureServer(): Promise<{ url: string }>` `` (0.6 kB). This file PR-M6-3, PR-M6-11.

### Files

Create: `src/check/flows.ts` (the flow data and the layer B driver), `src/check/flows.test.ts`. Change: `src/check/engine.ts` (the call), `src/architecture.test.ts` (PR-M6-3, one entry). There is no file `src/check/browser.ts` (ledger D-148). No `## Ledger issues` line: PR-M6-3 and PR-M6-11 are ratified (D-146).

### Steps

1. Branch `task/M6-T32-layer-b`.
2. PR-M6-3: in `src/architecture.test.ts` add `"./src/testing/upgrade-diff.ts"` to the array of the `"src/check/**"` entry of `IMPORT_RULES`. Check `grep -n "^import" src/testing/upgrade-diff.ts`: every import MUST be `import type` (Playwright types only). When it has a value import of `playwright`, stop (If blocked).
3. `src/check/flows.ts` (shape PLAN-CHOSEN; the spec says only "data keyed by component id"):

   ```ts
   export interface Flow {
     /** What the driver does inside the component root. */
     action: "submit" | "click"
     /** For "click": a selector evaluated inside the root; "" means the root itself. Unused for "submit". */
     target: string
     expect: "navigation-2xx-3xx" | "query-changes" | "navigation-to-href" | "details-open"
   }
   export const FLOWS: Record<string, Flow> = {
     "product-form": { action: "submit", target: "", expect: "navigation-2xx-3xx" },
     filters: { action: "submit", target: "", expect: "query-changes" },
     "sort-select": { action: "submit", target: "", expect: "query-changes" },
     "cart-link": { action: "click", target: "", expect: "navigation-to-href" },
     accordion: { action: "click", target: "summary", expect: "details-open" },
   }
   ```

   Exactly these five keys (the V1 flows of row RP606). Other components add entries in their own tasks.
4. The driver, also in `src/check/flows.ts` below `FLOWS` (names PLAN-CHOSEN, internal):

   ```ts
   export interface Box { x: number; y: number; width: number; height: number }
   export interface RootInfo { component: string; selector: string }           // component id, or the tag name for a manifest element
   export interface BrowserFacts {
     roots: RootInfo[]                          // every Ripple root of pass 2, document order
     boxesNoJs: Record<string, Box>             // key: RootInfo.selector; pass 1
     boxesJs: Record<string, Box>               // pass 2, after the waits
     cls: number                                // sum of layout-shift entries without recent input, pass 2
     upgrade: import("../testing/upgrade-diff.ts").UpgradeReport
     errors: string[]                           // first line of each: console error, pageerror, failed same-origin request, console message containing "Hydration"
     flows: { component: string; selector: string; ok: boolean; detail: string }[]   // pass 1
     overflow: { width: 375 | 768 | 1440; by: number }[]                             // pass 3, only widths that overflow
   }
   export function browserFacts(page: import("playwright").Page): BrowserFacts
   export function runLayerB(options: { urls: string[]; rules: Rule[]; context: RuleContext; chromium: import("playwright").BrowserType }): Promise<void>
   export function loadChromium(cwd: string): Promise<import("playwright").BrowserType>
   ```

   - `browserFacts` reads a module-level `WeakMap<Page, BrowserFacts>` that `runLayerB` fills; it throws `new Error("no browser facts for this page")` when absent. The `Rule.browser(page, url, context)` signature of doc 07 has no place for pass 1 and pass 3 data; the WeakMap carries it without changing the interface.
   - `loadChromium`: `createRequire(join(cwd, "package.json")).resolve("playwright")`, then `(await import(pathToFileURL(resolved).href)).chromium`. No static value import of `playwright` in `src/check` (doc 01: dynamic `import()` only); `import type` is allowed.
   - Selector of a root: a unique CSS path built in the page: `#<id>` when the element has an id that is unique in the document, else the chain of `<tag>:nth-of-type(<n>)` from `body`. The same function runs in pass 1 and pass 2 so keys match.
   - "Ripple root" is the vocabulary of doc 07 `### 9.3 `: an element whose class list contains `root.class` of a manifest component, or whose tag name is a key of `manifest.elements`.
5. `runLayerB`, per URL, with ONE browser from `chromium.launch()` for all URLs, closed in `finally`:
   1. **Pass 1.** `browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } })`; `page.goto(url, { waitUntil: "load" })`; record `boxesNoJs` with `getBoundingClientRect()` of every Ripple root. Flows: for every root of a component that has `noJs.level === "full"` in the manifest AND a key in `FLOWS`: open a NEW page in the same context, load the URL, find the root by its selector, perform the action, judge, close the page. `submit`: click the first `button:not([type="button"]), input[type="submit"]` of the form (the root when it is a `form`, else the first `form` inside it, else its closest `form` ancestor); no form or no submitter is `ok: false` with `detail: "no form submitter"`. Judging: `navigation-2xx-3xx`: a main-frame navigation happens within 5 s and its response status is 200 to 399; `query-changes`: within 5 s the page URL's `search` differs from before; `navigation-to-href`: within 5 s the page URL equals the root's `href` resolved against the page URL; `details-open`: after the click the root, or its closest `details`, matches `details[open]`. `detail` on failure is one short clause (`no navigation`, `status 500`, `query did not change`, `URL is <url>`, `details did not open`).
   2. **Pass 2.** A new context with the default `javaScriptEnabled` and the same viewport; a new page. Before navigating: `page.addInitScript` of a self-contained function that creates `window.__rpCls = 0` and a `PerformanceObserver` for `{ type: "layout-shift", buffered: true }` adding `entry.value` of entries with `hadRecentInput === false`; listeners `page.on("console")` (type `error`, or text containing `Hydration`), `page.on("pageerror")`, `page.on("requestfailed")` (only requests whose URL has the origin of the page URL). Then `upgrade = await upgradeDiff(page, { url, allow, rootClasses, timeoutMs: 2000 })` where `allow` is the concatenation of `upgradeAllow` of every manifest component (absent means empty) and `rootClasses` is every `root.class`. `upgradeDiff` installs the MutationObserver recorder, navigates with `waitUntil: "load"` and waits for `customElements.whenDefined` (UD-6: no second recorder). Then read `cls`, `roots`, `boxesJs`.
   3. **Pass 3.** On the pass 2 page: for each width of 375, 768, 1440: `page.setViewportSize({ width, height: 800 })`, wait two animation frames, evaluate `document.documentElement.scrollWidth - document.documentElement.clientWidth`; a value above 0 is pushed as `{ width, by }`. Then restore 1280 by 800 and wait two animation frames. Pass 3 runs before the rules so that every fact exists when a rule is called; the upgrade records and `cls` were read before the first resize, so resizing does not affect RP601 and RP602 (PLAN-CHOSEN order).
   4. Store the facts in the WeakMap under the pass 2 page. Call `await rule.browser(page, url, context)` for every rule that has `browser`, `"B"` in `meta.layers`, the host in `meta.hosts`, and passes the `--rule` filter. A throw is reported as `RP000` like any rule (engine rule 4).
   5. Close both contexts.
6. Engine: when `options.browser` is true and `options.urls` has entries, `await runLayerB({ urls, rules, context, chromium: await loadChromium(options.cwd) })`. When `options.browser` is not true, add no note for layer B. When `loadChromium` throws, rethrow an error whose message is `--browser needs Playwright.` (the CLI checks this before calling, M6-T23 step 5).
7. Tests, `src/check/flows.test.ts`, tier `[T5]` except the last (PR-M6-11). Each test obtains `chromium` with `const { chromium } = await import("playwright")` inside the test and the page URL from `fixturePageUrl(...)` of `test/support/server.ts`; a spy rule `{ meta: { id: "RP601", severity: "error", layers: ["B"], hosts: ["html"], title: "", why: "" }, browser: async (page) => { facts = browserFacts(page) } }` captures the facts.
   - `[T5] flows: facts for the tabs default fixture have no upgrade failure, no error and equal boxes` (`facts.upgrade.failures.length === 0`, `facts.errors` is empty, every key of `boxesNoJs` is a key of `boxesJs`).
   - `[T5] flows: overflow is recorded at 375 for a page with a 2000px wide element` (serve a page from a `node:http` server created inside the test on `127.0.0.1` port 0 and closed in `finally`; doc 13 W-1 allows a server started lazily inside a test).
   - `[T5] flows: a console error and a failed same-origin request are collected` (same local server: an inline `console.error("boom")` and an `img` with a `src` that returns 404 are NOT both failures of `requestfailed`; assert only that `facts.errors` contains a line starting with `boom`).
   - `[T5] flows: the accordion flow passes with JavaScript off` (a page holding the Accordion `default` fixture, when `accordion` is in the bring-up subset; otherwise `{ skip: "accordion is not in the bring-up subset" }` is NOT allowed under `--no-skips`: build the page from the literal `<details class="rp-accordion__item"><summary>Q</summary><p>A</p></details>` only when the component is absent, and name that in the done file).
   - `[T5] flows: a flow with no form submitter is ok false`.
   - `[T5] flows: one browser is launched for two urls` (wrap `chromium.launch` and count).
   - `[T1] flows: FLOWS has exactly the five V1 keys`.
8. Proof: `pnpm build && pnpm test:behavior --files=src/check/flows`, `pnpm test:unit --files=src/check/flows`, `pnpm test:unit --files=src/architecture`, then PLAN 5.0.

### Acceptance

The seven tests pass. `test ! -e src/check/browser.ts` succeeds. `grep -c "upgradeDiff" src/check/flows.ts` prints at least `1`; `grep -c "MutationObserver" src/check/flows.ts` prints `0` (UD-6). `grep -n "^import .* from \"playwright\"" src/check/*.ts | grep -v "import type"` prints nothing. Test A-05 of `src/architecture.test.ts` (and build step 10) still passes: `dist/check` loads without `playwright` installed.

### Out of scope

The nine rule files (M6-T33). The `checkPattern` page script and the agent snapshot (M6-T33). `ripple check --browser` option handling (M6-T23). Running layer B in the examples or evals (M7, M8).

### If blocked

- `pnpm test:behavior --files=src/check/flows` runs zero tests: the runner's tier 5 file list (doc 13 section 1 table: `components/`, `src/elements/`, `test/commerce/`, `test/a11y/`, `test/visual/`) does not include `src/check/`. Read how `test/run.ts` chooses files for a tier; when it selects by the `[T5]` name prefix over all test files, nothing is needed; when it uses path globs, add `src/check/**/*.test.ts` to the tier 5 globs AND make sure tier 1 does not execute `[T5]` tests of that file, record it under `## Ledger issues` of doc 13, and say so in the pull request.
- `src/testing/upgrade-diff.ts` has a value import of `playwright`: do not copy the recorder. Draft pull request naming M1's task for that file; UD-6 forbids a second implementation.
- `layout-shift` entries are not delivered in headless Chromium for the fixture: keep `cls` at 0, keep the box comparison (the second half of RP602), record under `## Ledger issues` of doc 07. Layer B is UNVERIFIED in the spec (13.3 item 6); every deviation found by running it belongs in that list.
- Chromium is not installed (`browserType.launch: Executable doesn't exist`): this is `BLOCKED-ON-ENV`; run `pnpm exec playwright install chromium` only when CONVENTIONS allows it for your session, otherwise draft pull request.

---

## M6-T33 Checker family "browser" (layer B): RP601 to RP609

- **Goal:** Add the nine browser rules RP601 to RP609 on top of the layer B driver, bringing `src/check/rules/index.ts` to the 55 ids.
- **Depends on:** M6-T32.
- **Kind:** `checker`. Size M (see "If blocked" for the split).

### Read first

doc 07: in `### 9.6 ` only the rows RP601 to RP609 (3 kB); `#### 9.5.5 ` (1.1 kB); `#### 9.4.1 ` item 1 (layer B location is `<url> <selector>`). doc 08: `### 5.4 `, in `### 5.5 ` only the rows RP601 to RP609 and the notes on RP607 and on `bad` / `good` (3 kB); the item that starts "- RP607 applies only to roots whose manifest `agent.actions` is non-empty. It reports two things" (0.6 kB). doc 13: `### 5.5 ` (search ``### 5.5 `in-page.ts` ``; 1.5 kB). doc 01: the paragraph that starts `` `loadAgent()` imports the set's `agent` chunk `` (0.4 kB). Source: `src/check/browser.ts`, `src/check/rules/RP113.ts`. This file PR-M6-4, PR-M6-11.

### Files

Create: `src/check/rules/RP601.ts` to `RP609.ts` and one `.test.ts` beside each (18 files). Change: `src/check/rules/index.ts`; `src/gen/build.ts` (section "RP605" below); `docs/07-manifest-registry-cli.md` (a line under `## Ledger issues` only when a step or "If blocked" says so).

### Steps

1. Branch `task/M6-T33-rules-rp6xx`.
2. Module shape, `meta` and `text` as in M6-T29 step 2. All nine: `layers: ["B"]`, hosts all four; severity `error` except RP607 and RP609 (`warning`). Each rule has only a `browser(page, url, context)` function; it reads `browserFacts(page)` (imported from `../flows.ts`, M6-T32; there is no `src/check/browser.ts`) and reports with `url`, `selector`, `file: null`, `line: null`, `col: null`.
3. Detection:

   | Rule | Detection |
   |---|---|
   | RP601 | One diagnostic per entry of `facts.upgrade.failures`: `selector` = the record's `path`; `component` = the manifest component whose `root.class` or tag equals the record's `root` (null when none); `{attr}` = `attributeName`, or the record `type` when `attributeName` is null; `found` = `JSON.stringify(oldValue) + " -> " + JSON.stringify(newValue)`. No own MutationObserver (UD-6) |
   | RP602 | (1) `facts.cls > 0.01`: one diagnostic, `{value}` = `cls` with three decimals, `selector: null`. (2) per root: any of `x`, `y`, `x + width`, `y + height` differs between `boxesNoJs[selector]` and `boxesJs[selector]` by more than 0.5: one diagnostic, `{value}` = the largest difference with one decimal followed by `px`. A root present in only one map is skipped |
   | RP603 | One diagnostic per distinct entry of `facts.errors`; `problem` is the entry (first line of the message) |
   | RP604 | One diagnostic per tag of `facts.upgrade.undefinedTags` that is a key of `context.manifest.elements`; `{tag}` the tag; `{component}` in the fix is the id of the first manifest component whose `elements` list names the tag, or the tag when none |
   | RP605 | Section "RP605" below |
   | RP606 | One diagnostic per entry of `facts.flows` with `ok === false`; `{Component}` the title; `{value}` the entry's `detail` |
   | RP607 | Section "RP607" below |
   | RP608 | One diagnostic per entry of `facts.overflow`: `{value}` = `by`, `{n}` = `width`; `selector: null` |
   | RP609 | Section "RP609" below |

4. **RP605** (PR-M6-4). The page script is the IIFE bundle of `test/support/in-page.ts` (two lines, doc 13 5.5: it sets `globalThis.__rpTesting = { checkPattern }`). `src/check` may not import `@ui-sdk/core/testing` under `IMPORT_RULES`, and `pkg/` has no file for it. This plan embeds the bundle text in `dist/check` at build time:
   - `src/gen/build.ts`: in the step that bundles the `dist/check` entry, before that bundle, build the page script in memory with esbuild (`entryPoints: ["test/support/in-page.ts"]`, `bundle: true`, `format: "iife"`, `platform: "browser"`, `target: "es2022"`, `write: false`, `minify: true`) and pass `define: { __RP_CHECK_IN_PAGE__: JSON.stringify(<the output text>) }` to the `dist/check` bundle and to any other bundle that inlines `src/check` (the CLI bundle when it does not import `dist/check` as an external).
   - `RP605.ts`: `declare const __RP_CHECK_IN_PAGE__: string | undefined`; the script text is `typeof __RP_CHECK_IN_PAGE__ === "string" ? __RP_CHECK_IN_PAGE__ : readFileSync("node_modules/.cache/ripple/test/in-page.js", "utf8")` (the second branch is reached only in tests, where the runner has built that file, doc 13 section 3). Inject with `page.addScriptTag({ content: text })`.
   - For every root on the page of a component whose manifest `a11y.checkPattern` is not null: evaluate in the page `__rpTesting.checkPattern(element, pattern)` inside `try`; on a throw, each non-empty line of the message is one diagnostic with `{Component}` the title and `{value}` the line.
5. **RP607.** Only roots of components whose manifest `agent.actions` is a non-empty array. When the page has no such root: return.
   - Find the first `script[src]` whose `src` path ends with `/ripple.js` or `/ripple.elements.js`. In the page: `const mod = await import(src); const agent = await mod.loadAgent(); const snap = agent.createAgent().snapshot()` (doc 01: `loadAgent()` returns a promise of `{ createAgent, agentTools, registerTools }`). When the page has no such script (a bundled build), the rule cannot load the agent chunk: report nothing (the spec says "with `ripple-agent.js` loaded by the checker" and gives no path for bundled pages; record `M6-T33: RP607 on pages without a prebuilt script is not specified` under `## Ledger issues` of doc 07).
   - The shape of `snapshot()` is owned by `docs/04-elements.md` section 12 and doc 08 section 7: before writing the comparison, run `grep -n "snapshot()" docs/08-agent-kit-and-evals.md | head` and read the one paragraph that defines the entry fields `component`, `label`, `items`, `buttons`. Do not invent a field.
   - (a) a qualifying root with no snapshot entry: problem `{Component} is missing from the agent snapshot`. (b) two or more qualifying roots whose entries have the same `component`, no `label`, and deep-equal `items` and `buttons`: ONE diagnostic for the group, problem `{n} {Component} roots cannot be told apart in the agent snapshot`. Never report a root whose tag is `rp-dialog`, `rp-quantity` or `rp-navigation-menu`. A missing label alone is never reported.
6. **RP609.** In the page, for every text node with non-white-space text inside a Ripple root whose parent element is visible (`getClientRects().length > 0`, computed `visibility` not `hidden`): foreground = computed `color` of the parent; background = the first computed `background-color` with alpha above 0 walking up from the parent (white when none; skip the node when an ancestor on the way has a `background-image` other than `none`, because contrast over images cannot be judged). Convert each colour to sRGB by drawing it: `fillStyle = <colour>` on a 1 by 1 canvas (`getContext("2d", { willReadFrequently: true })`), `fillRect`, `getImageData`; composite a translucent foreground over the background. Ratio by the WCAG 2.2 relative-luminance formula. Threshold `{max}`: 3 when the computed `font-size` is at least 24 px, or at least 18.66 px with `font-weight` at least 700; else 4.5. Below the threshold: one diagnostic per distinct (parent selector) with `{value}` = the ratio with two decimals. Report at most one diagnostic per element. The gamut case of the row needs no extra code: a dial colour outside sRGB is clamped by the canvas and judged like any other.
7. `text.bad` and `text.good` are HTML fragments. They cannot be judged without a browser, so the standard tests are tier `[T5]` and load the fragment in a page.
8. Tests, `src/check/rules/RP60<n>.test.ts`, tier `[T5]` (PR-M6-11). One shared non-test helper `src/check/rules/browser.fixture.ts`: `runB(rule, html, options?)` starts (lazily, once per file, closed in `after()`) a `node:http` server on `127.0.0.1` port 0 that serves `html` at `/` and the built `pkg/browser/` files under `/ripple/`, runs `runLayerB` with `[rule]`, and returns the diagnostics. Every rule: `[T5] <N>: bad example reports exactly one <N> diagnostic`; `[T5] <N>: good example reports nothing`; `[T1] <N>: meta matches the 9.6 row`. In addition:
   - `[T5] RP601: a record permitted by upgradeAllow is not reported`.
   - `[T5] RP602: a root that grows by 10px after scripts load is reported with 10.0px`.
   - `[T5] RP603: a console message containing Hydration is reported`.
   - `[T5] RP604: an rp- tag with no runtime loaded is reported and a tag outside manifest.elements is not`.
   - `[T5] RP605: a tablist without tabs reports one diagnostic per message line` (use the Tabs `default` fixture with one `role="tab"` attribute removed; when `tabs` is not in the bring-up subset use any component whose `a11y.checkPattern` is not null and name it in the done file).
   - `[T5] RP606: a product form whose action answers 500 is reported` (only when `product-form` is in the manifest; otherwise test `accordion` with a `details` that has no `summary`).
   - `[T5] RP607: two unlabeled product-form roots give one diagnostic and labelled ones give none`; `[T5] RP607: rp-quantity is never reported`.
   - `[T5] RP608: overflow at 375 only gives one diagnostic naming 375`.
   - `[T5] RP609: #777 on #fff at 16px is reported and at 24px is not` (ratio 4.48).
   - In `src/check/check.test.ts`: `[T1] check: rules/index.ts lists exactly the 55 ids` (the list of doc 07 `### 9.6 ` last paragraph; skip-free only once M2 and M4 rule tasks are merged; when ids are missing because those tasks are open, assert instead that the nine ids of this task are present and leave the 55-id assertion to M6-T35).
9. Proof: `pnpm build && pnpm test:behavior --files=src/check/rules/RP6`, `pnpm test:unit --files=src/check/`, then PLAN 5.0.

### Acceptance

`ls src/check/rules/RP60[1-9].ts | wc -l` prints `9`; the same with `.test.ts` prints `9`. The tests of step 8 pass. After `pnpm build`: `grep -c "__rpTesting" pkg/dist/check/*.mjs | grep -vc ":0"` prints at least `1` (the page script is embedded); when the path differs, use the `dist/check` location that build step 5 of doc 01 names. `pnpm ci` exits 0 and build step 10 (A-05) still passes.

### Out of scope

Changing the driver's facts (M6-T32) except to fix a defect a test here exposes. Flow data for components beyond the five V1 keys. The eval harness use of `check --browser` (M8). Cross-engine runs: layer B is Chromium only.

### If blocked

- The task does not fit one session. Planned split: first pull request RP601, RP602, RP603, RP604, RP606, RP608 (facts only, no page script); write the done file with `FOLLOW-UP NEEDED: RP605, RP607, RP609` and ask the coordinator for a follow-up row. `rules/index.ts` lists only rules that exist (doc 07 `### 9.7 `).
- esbuild cannot bundle `test/support/in-page.ts` from `src/gen/build.ts` because an import-boundary test forbids `src/gen` to name a `test/` path: `src/gen` may read other directories as data (doc 01 section 2.2 reading rule 1); pass the path as a string to esbuild (no `import`). When the boundary test still fails, stop and report; do not move `in-page.ts`.
- `mod.loadAgent` is undefined on the page's `ripple.js`: the bundle predates the agent chunk (M1/M3). Report nothing from RP607 in that case, add the line `RP607 partial: loadAgent missing` to the done file, and name the owning task of `browser/ripple.js`.
- `checkPattern` rejects a pattern name: the manifest value is outside the list of doc 13 5.5. That is a manifest defect; draft pull request naming the component.

---

## M6-T34 Registry and CLI acceptance: RB-8, RB-9 and the remaining rows of doc 07 §12

- **Goal:** Add the build checks RB-8 and RB-9 that run the built CLI end to end, and the acceptance tests of doc 07 section 12 that no earlier task owns.
- **Depends on:** M6-T15 to M6-T27. (The RP511 assertion of item 14 needs M6-T31 and the 55-id form of item 20 needs M6-T33; step 5 writes each conditionally.)
- **Kind:** `harness`. Size M.

### Read first

doc 07: in `### 10.2 ` only the rows RB-8 and RB-9 of the table (1 kB); `## 12. ` items 12 to 23 (4 kB). doc 01: the description of build step 10 (search `step 10` in `docs/01-architecture.md`; read the paragraph that lists what step 10 checks, 1 kB). Source: the step 10 function of `src/gen/build.ts`; `test/support/cli.ts`; `src/check/check.test.ts`. This file 0.8.

### Files

Change: `src/gen/build.ts` (two checks in step 10), `src/gen/build.test.ts` or the file that tests step 10 (find it with `grep -ln "RB-6\|RB-5" src/gen/*.test.ts`), `src/check/check.test.ts`, `src/cli/commands/upgrade.test.ts`, `src/cli/commands/add.test.ts`. Create: `src/cli/acceptance.test.ts`.

### Steps

1. Branch `task/M6-T34-cli-acceptance`.
2. Coverage table. For each item run the `grep`; a hit means the item is covered and you add nothing; no hit means you add the test named in step 4 or 5.

   | Item | Owner | Check |
   |---|---|---|
   | 12 (RB-8, RB-9) | this task | step 3 |
   | 13 | M6-T16 | `grep -n "conflict-unmanaged" src/cli/commands/add.test.ts` |
   | 14 | M6-T20, this task for the RP511 half | `grep -n "needs-base\|merge-conflict" src/cli/commands/upgrade.test.ts`; step 5 |
   | 15 | this task | step 4 |
   | 16 | M6-T22 | `grep -n "exactly the keys of 5.3" src/cli/commands/status.test.ts` |
   | 17 | this task | step 3 (every spawn has closed standard input and a 30 s limit) and step 4 |
   | 18 | M6-T15 | `grep -n "twice" src/cli/commands/init.test.ts` |
   | 19 | M6-T12 / M6-T16 | `grep -n "fr.json" src/cli/commands/*.test.ts` |
   | 20 | this task | step 5 |
   | 21 | this task when absent | `grep -n "0 diagnostics from layer H\|every fixture" src/check/check.test.ts`; step 5 |
   | 22 | M0-T42 | `grep -n "RP101" src/check/check.test.ts src/check/report.test.ts` |
   | 23 | M6-T23 | `grep -n "exactly one JSON value" src/cli/commands/check.test.ts` |

   An item whose owner test is missing and is not "this task": write it here, in the owner's test file, and name it in the pull request.
3. RB-8 and RB-9 in build step 10 of `src/gen/build.ts`. Add one function `checkCliEndToEnd(pkgDir: string): void` and call it at the end of step 10 (after the package is complete). A failure throws an error whose message starts with `build: RB-8: ` or `build: RB-9: ` followed by the command line, the exit code and the first 20 lines of its standard error.
   - Helper: `run(args, cwd)` is `spawnSync(process.execPath, [join(pkgDir, "bin/ripple.mjs"), ...args], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30000, env: { ...process.env, RIPPLE_OFFLINE: "1" } })`. `stdio[0]` `"ignore"` is the closed standard input of item 17; a result with `error` set or `signal` set (timeout) fails the check with the text `did not terminate within 30 s`.
   - RB-8: `dir = mkdtempSync(join(tmpdir(), "ripple-"))`; copy `test/fixtures/theme-min/` into it (`cpSync` recursive; create the empty `templates/` directory when the copy did not, because git does not store empty directories). Run `init --host liquid`, then `add --all --host liquid`: both exit 0. Run both again: every non-empty line of their standard output that is a plan line (starts with two spaces, or is one of the action words at the line start as `formatPlan` prints them) MUST start, after trimming, with `unchanged` or `patch-skipped`; the header and summary lines of doc 07 `### 7.1 ` rule 8 are exempt. Run `status --json --host liquid`: exit 0; `JSON.parse` the output; every value of `components` has `state === "current"`; `components` is not empty. Remove `dir` in `finally`.
   - RB-9: the same with `--host react` in a directory that holds `package.json` with `{ "name": "rb9", "private": true, "dependencies": { "react": "19.0.0" } }` and `app/styles/app.css` holding `@import "tailwindcss";` and a newline. No `npm install` is run; the CLI resolves its package root from `bin/ripple.mjs`.
   - Bring-up: with `BRINGUP_SUBSET` true, `add --all` installs the subset; the checks are unchanged.
   - Test in the step 10 test file: `[T1] build: RB-8 and RB-9 failures are reported with their id` (call `checkCliEndToEnd` with a `pkgDir` whose `bin/ripple.mjs` is a one-line script `process.exit(3)`; expect a throw whose message starts with `build: RB-8: `). This test spawns `node` on a file it wrote itself, not on `pkg/`; doc 13 tier 1 forbids `pkg/` and a browser, not a child process of a build function. When the tier 1 runner forbids child processes (a guard test fails), move the assertion into a second call inside `pnpm build` self-check and record it in the done file.
4. `src/cli/acceptance.test.ts` (in-process, `runCli`, `fixturePackageRoot()`, `tempProject`):
   - `[T1] acceptance: no command writes ripple.lock, ripple-lock.json or an unlisted file` (item 15). For host `liquid` and host `react`: run in order `init`, `add --all`, `status --json`, `diff`, `check`, `docs`, `manifest`, `skills check`, `upgrade`, `remove <first installed component with no dependents> --force`; after each, list the tree; assert no path's base name is `ripple.lock` or `ripple-lock.json`, no path ends with `.ripple-tmp` or `.ripple-sync`, and every new path since the previous command is (a) a `target` of the fixture registry index for the host, resolved with `resolveTarget`, or (b) one of `ripple.json`, `AGENTS.md`, a patch target path reported in `status --json` `patches[].path`, or (c) below `.claude/skills/` or `.agents/skills/`. The read-only commands (`status`, `diff`, `check`, `docs`, `manifest`, `skills check`) MUST leave `treeHash` unchanged.
   - `[T1] acceptance: every command returns without reading standard input` (item 17, in-process half): the test replaces `process.stdin.on`, `process.stdin.read` and `process.stdin.resume` by functions that throw, runs each command of the list above once, restores them in `finally`, and asserts no throw.
   - `[T1] acceptance: every command of the command table has a real module` (`grep`-free: import `COMMANDS` when `src/cli/index.ts` exports it, else read the file text; assert it contains no `PLAN 4.4` and has the keys `init`, `add`, `diff`, `upgrade`, `remove`, `status`, `check`, `docs`, `manifest`, `skills`).
5. Conditional additions:
   - Item 14, RP511 half, in `src/cli/commands/upgrade.test.ts`: `[T1] upgrade: after --write-conflicts ripple check reports RP511`: build the overlapping-change scenario the file already has, run `upgrade --write-conflicts`, then `runCli(["check", "--json", "--host", <host>])`; assert exit 1 and a diagnostic with `rule === "RP511"` whose `file` is the conflicted path. Requires RP511 in `rules` (M6-T31): when `rules.some((r) => r.meta.id === "RP511")` is false at the time of writing, do not write a skipped test; add the line `FOLLOW-UP NEEDED: item 14 RP511 half (after M6-T31)` to the done file.
   - Item 20, in `src/check/check.test.ts`: `[T1] check: every rule in rules/index.ts has a rule file, a test file and a docs page source` (for each id of `rules`: `src/check/rules/<id>.ts` and `<id>.test.ts` exist; `meta.id === id`; `text.bad` and `text.good` are non-empty strings, which is what the page generator of M6-T14 needs). And `[T1] check: no file names a rule id outside the 55` : walk `src/`, `components/`, `blueprints/`, `skills/`, `guides/`, `test/`, `examples/` (directories that exist; skip `node_modules`, `dist`, `pkg`) for `/\bRP\d{3}\b/g`; every match MUST be one of the 55 ids, `RP000` or `RP509`. `docs/` is excluded here (the specs name reserved ids in prose; doc 07 item 20 exempts its own reserved list).
   - Item 21, when the grep of step 2 found nothing: `[T1] check: every fixture html of every component gives 0 layer H diagnostics`: for each component directory, each file `components/<id>/fixtures/*.html`, call `check({ cwd: <temp dir holding only that file>, host: "html", paths: [file] })` or the engine's document-level entry point that `check.test.ts` already uses; assert `diagnostics` is empty; the failure message names the fixture and the first diagnostic.
6. Proof: `pnpm build` (now runs RB-8 and RB-9), `pnpm test:unit --files=src/cli/ --no-skips`, `pnpm test:unit --files=src/check/ --no-skips`, then PLAN 5.0. Paste the two `status --json` component state summaries of RB-8 and RB-9 (ids and states only) into the pull request.

### Acceptance

`pnpm build` exits 0 and `grep -c "RB-8\|RB-9" src/gen/build.ts` prints at least `2`. Temporarily replacing the body of `pkg/bin/ripple.mjs` is NOT part of acceptance; the unit test of step 3 proves the failure path. The tests of steps 4 and 5 pass. `pnpm ci` exits 0. No directory named `ripple-*` created by this task remains under the system temporary directory after `pnpm build` (`ls "$(node -p 'require("os").tmpdir()')" | grep -c '^ripple-'` prints the same number before and after).

### Out of scope

Fixing a command that fails RB-8 or RB-9 (the owning command task does; this task reports). The release rehearsal of doc 07 section 11.4 and item 25 (`pnpm release:check`, M9-T01). Items 1 to 11e (owned by M0 and by M6-T01 to M6-T24). Installing into `examples/` (M7-T04).

### If blocked

- RB-8 fails on the second run with lines other than `unchanged` / `patch-skipped` (for example `regenerate` or `patch`): that is an idempotency defect of `init`, `add` or a patch. Do not widen the allowed set. Draft pull request with the exact lines and the owning task (patches: M6-T11 or M6-T12; derived files: M6-T03 or M6-T10; skills lines are not plan lines).
- `status --json` reports a component `incomplete` or `modified` right after `add --all`: defect of M6-T16 or M6-T22; same handling.
- RB-9 fails because `init` on `react` refuses a project without `node_modules`: read doc 07 `### 7.4 ` for what `init` requires on npm hosts; when it requires the package to be installed, create `node_modules/<PKG_NAME>` as a symbolic link to `pkgDir` in the temporary directory and state it in the done file and under `## Ledger issues` of doc 07 (RB-9 does not say how the package is present).
- The build step 10 function cannot spawn the CLI because `pkg/dist/cli/index.mjs` is written after step 10: move the call to the end of the build's last step and record the order in the done file.

---

## M6-T35 M6 gate

- **Goal:** Prove that milestone M6 is complete by running the gate checks of the M6 gate row of `docs/PLAN.md` and recording the result.
- **Depends on:** M4-T23, M6-T01 to M6-T34, M2-T29 to M2-T31.
- **Kind:** `gate`. No source, test or spec file changes.

### Read first

`docs/PLAN.md`: section 4.2 (the gate rules) and the M6 row of the gate table (search `| M6 | M6-T35 |`). This file: sections 0.2, 0.6 and 0.9.

### Files

Create: `docs/plan/done/M6-T35.md`. Change nothing else.

### Steps

1. Branch `task/M6-T35-gate`, from an up-to-date `main`.
2. Done files: `ls docs/plan/done/ | grep -c '^M6-T\(0[1-9]\|[12][0-9]\|3[0-4]\)\.md$'` MUST print `34`. `ls docs/plan/done/M4-T23.md docs/plan/done/M2-T29.md docs/plan/done/M2-T30.md docs/plan/done/M2-T31.md` lists four files. `grep -l 'BLOCKED\|FOLLOW-UP NEEDED' docs/plan/done/M6-T*.md` prints nothing, or every file it prints names a follow-up task whose own done file exists.
3. `pnpm install --frozen-lockfile && pnpm ci` exits 0. The build output contains no line `build: skipped` for the registry, `custom-elements.json`, `html-custom-data.json` or `docs/` (`pnpm build 2>&1 | grep "build: skipped"` prints at most the `skills/` and `guides/` lines, which M8 removes).
4. Commands of D-057: after `pnpm build`,

   ```bash
   grep -c "PLAN 4.4" src/cli/index.ts          # MUST print 0
   for c in init add diff upgrade remove status check docs manifest skills; do
     test -f src/cli/commands/$c.ts || echo "MISSING $c"
   done                                          # MUST print nothing
   node pkg/bin/ripple.mjs docs --host html > /dev/null; echo $?            # 0
   node pkg/bin/ripple.mjs manifest > /dev/null; echo $?                    # 0
   node pkg/bin/ripple.mjs nope; echo $?                                    # 2
   ```

5. RB-8 and RB-9: `grep -c "RB-8\|RB-9" src/gen/build.ts` prints at least `2`, and step 3's build ran them (a build that passed proves both).
6. Acceptance rows of doc 07 section 12: the output of `pnpm test --no-skips` contains a passing line for each of these test names (grep each): `[T1] trailer:` (item 7), `[T1] plan:` (items 8, 11a), `[T1] merge3:` (item 9), `[T1] diff:` (item 10), `[T1] detect-host:` (item 11), `[T1] init:` (items 11b, 11e, 18), `[T1] docs:` (item 11d), `[T1] add:` (item 13), `[T1] upgrade:` (item 14), `[T1] acceptance:` (items 15, 17), `[T1] status:` (item 16), `[T1] check:` (items 20 to 23), `[T1] liquid-calls:` (item 24), `[T1] RP401:` (item 24a).
7. The 55 rule ids:

   ```bash
   for n in 101 102 103 104 105 110 111 112 113 114 115 116 117 118 201 202 203 204 301 302 303 304 305 306 307 308 309 320 321 401 402 403 404 405 406 501 502 503 504 505 506 507 508 510 511 512 601 602 603 604 605 606 607 608 609; do
     test -f src/check/rules/RP$n.ts && test -f src/check/rules/RP$n.test.ts || echo "MISSING RP$n"
   done                                          # MUST print nothing
   ls src/check/rules/RP[0-9][0-9][0-9].ts | wc -l                          # 55
   node pkg/bin/ripple.mjs check --rule RP509 --host html; echo $?          # 2 (reserved id is not a rule)
   node pkg/bin/ripple.mjs check --rule RP609 --host html > /dev/null; echo $?   # 0 or 1, never 2
   ls pkg/docs/rules/ | grep -c '^RP[0-9][0-9][0-9]\.md$'                   # 55
   ```

8. Layer B ran at least once in CI: the output of `pnpm test --no-skips` contains a passing line starting `[T5] flows:` and one starting `[T5] RP601:`.
9. `grep -rn 'PLAN 4.4: M6-' src/` prints nothing.
10. Write `docs/plan/done/M6-T35.md`. First line `M6 gate: PASS`. Then the commands above with their observed output, the commit hash checked, the list of M6 tasks with their pull requests, and a section `## Open notes` that lists:
    - every line added under `## Ledger issues` of docs 01, 07, 08, 13 by M6 tasks (the per-task lines; the Plan readings PR-M6-1 to PR-M6-13 are ratified by D-146 and add none);
    - every UNVERIFIED item of doc 07 `### 13.3 ` that an M6 task settled (Theme Check positions, layer B) with the result;
    - whether `BRINGUP_SUBSET` was still `true` when the gate ran.
    Commit only this file; PLAN 5.0.

### Acceptance

Every command of steps 2 to 9 gives the stated output. The done file exists and its first line is `M6 gate: PASS`.

### Out of scope

Fixing anything. Completing the deferred rule parts and the deferred E tests listed under `## Open notes` (they need a follow-up row from the coordinator). Skills, guides and `meta.expected.json` (M8). Blueprints (M7).

### If blocked

- Any check fails: write `M6 gate: FAIL` as the first line of the done file with the failing command and its output, name the task id that owns the failing item (the table of step 6 and the families: RP1xx and RP2xx are M2-T29 to M2-T31, RP3xx is M4-T23, RP4xx is M6-T29, RP5xx is M6-T31, RP6xx is M6-T33), open a draft pull request, stop. Never fix inside the gate task.
- Step 7 prints fewer than 55 because a rule family was split with `FOLLOW-UP NEEDED`: the gate fails until the follow-up task's done file exists.
- `pkg/docs/rules/` has fewer pages than rule files: the owner is M6-T14 (pages are generated from `meta` and `text` of every registered rule); the gate fails.
