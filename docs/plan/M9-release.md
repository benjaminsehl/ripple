# M9 Release: task detail

Status: detail file for the 8 rows of milestone M9 in `docs/PLAN.md` section 6. `docs/00-decisions.md` (the ledger) wins over every spec; a spec wins over this file. This file adds no public API. Where it fixes a choice the specs leave open, the choice is marked "Plan reading" and listed in section 0.7.

How to use: read `AGENTS.md`, `docs/CONVENTIONS.md`, `docs/PLAN.md` sections 1 to 3 and 5.0, then section 0 of this file (about 10 kB), then ONLY your task's section `## <task id>`. Do not read other task sections and do not read the other `docs/plan/M*.md` files: every rule you need from them is restated in section 0.

Contents: 0 Rules for every M9 task. Then M9-T01 to M9-T08 in table order.

---

## 0. Rules for every M9 task

### 0.1 Finding what to read

- **M9-R1** Spec files are large and are edited between sessions. Never use a line number. Find a section by searching for its heading text exactly as this file prints it (for example search `### 11.4 ` in `docs/07-manifest-registry-cli.md`) and read up to the next heading of the same or a higher level.
- **M9-R2** "Read first" lists are complete. Sizes are approximate. Read nothing else unless a failing command names another file. "doc 01" is `docs/01-architecture.md`; "doc 07" is `docs/07-manifest-registry-cli.md`; "doc 08" is `docs/08-agent-kit-and-evals.md`; "doc 13" is `docs/13-testing.md`; "doc 14" is `docs/14-liquid-theme.md`.
- **M9-R3** A code block that a spec prints "complete" is the required starting text (D-113). Extract it with the extractor (0.3); do not retype it. Change it only where a named check fails, and list every change in the pull request under "Deviations".

### 0.2 Values every M9 task uses

| Thing | Value | Source |
|---|---|---|
| Package name | read only from `PKG_NAME` in `src/identity.ts` (placeholder `ripple-kit`); binary `BIN_NAME` (`ripple`); version `VERSION` | D-052; doc 01 `### 6.3 ` |
| Release version of V1 | `0.1.0` (the value `VERSION` already has; doc 01 `## 9. ` rule 4) | doc 07 `### 11.1 ` |
| Version numbers that start at `1` | `manifestVersion` (`manifest.json`), `registryVersion` (`registry/index.json`), `lockVersion` (`ripple status --json`), check report `version` (`ripple check --json`) | doc 07 `### 11.1 ` |
| Changelog sub-headings, fixed, in this order | `Breaking`, `Added`, `Fixed`, `Checker`, `Pins` | doc 07 `### 11.4 ` rule 3 |
| Name token in hand-written text that reaches `pkg/` | `__PKG__` (replaced by build step 8). The string `ripple-kit` MUST NOT be written anywhere except `src/identity.ts` | doc 01 `### 6.3 ` rules 1 and 2 |
| Rename test name | `@acme/storefront-ui` (environment variable `RIPPLE_PKG_NAME`) | doc 13 `### 17.1 ` job `rename` |
| CI jobs required to merge | `verify`, `node22`, `rename`, `package-node20`; `cross-engine` from M9-T06 on | doc 13 `### 17.2 `, `### 17.3 ` |
| Node versions | repository `>=22.18`; main CI job 24; job `node22` runs `22.18.0`; job `package-node20` runs the built CLI on `20.18.0`; Remix tests skip below 24.3 | D-103 item 4; doc 01 `## 9. ` |
| Runner options | `--tiers=`, `--component=`, `--grep=<regex>` (matches the name after the tier tag), `--files=<substring>`, `--engine=`, `--cross-engine`, `--no-skips`. Last output line is always `test: tiers <list> engine <engine>: <p> passed, <f> failed, <s> skipped` | doc 13 `### 2.6 ` (table below the code block) |
| Network | tier 7 and the hydrogen no-JS flows need `RIPPLE_NETWORK=1` and access to `https://mock.shop/api` | PLAN 3.1 |
| Test names | `[T<n>] <subject>: <statement>`, flat `test()` from `node:test`, `node:assert/strict`, no `describe` | doc 13 `### 2.4 ` |
| Temporary directories | `mkdtempSync(join(tmpdir(), "ripple-"))`, removed in `finally`; never write under the repository | doc 13 W-5, W-6 |

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

Usage: `node node_modules/.cache/ripple/extract.mjs <doc file> '<heading prefix>' <language> <index> <output path>`. "Bytes" and "First line" in the extraction tables of this file were checked on 2026-11-22. When either differs, the doc changed: stop and report; do not guess another block.

| Output | Doc | Heading prefix | Lang | Index | Bytes | First line |
|---|---|---|---|---|---|---|
| `node_modules/.cache/ripple/ci.yml` | `docs/13-testing.md` | `### 17.1 ` | `yaml` | 0 | 3649 | `name: ci` |
| `node_modules/.cache/ripple/nightly.yml` | `docs/13-testing.md` | `### 17.4 ` | `yaml` | 0 | 1484 | `name: nightly` |

The `evals` job of doc 08 `### 8.14 ` is indented inside a list item; the extractor does not find it (column-0 fences only). Compare it by eye when a task needs it.

### 0.4 What exists before M9

| Thing | State before M9 | Changed by |
|---|---|---|
| `src/gen/index.ts` argument parser | accepts `--check`, `--subset`, `--snapshot <id...>`; `--release-check` takes the unknown-argument path (`gen: unknown argument --release-check`, exit 2) and carries the marker `// PLAN 4.4: --release-check by M9` (M0-T15 wrote `--snapshot added by M3-T03, --release-check by M9`; M3-T03 deleted the first half) | M9-T01 |
| `src/architecture.test.ts` | A-01 and A-02 check "every entry is allowed" (subset) with the marker `// PLAN 4.4: subset until every directory exists; set equality is restored by M9-T05`; A-02 also accepts `src/types.generated.ts` with the marker `// PLAN 4.4: ledger tree lacks src/types.generated.ts; see docs/plan/M0-bootstrap.md problems` | M9-T05 |
| Other `PLAN 4.4` markers under `src/` | each names the task that removes it; after M8 none should remain except the three above | M9-T05 audits |
| `README.md` (root) | stub: `# Ripple`, one sentence, `Status: under construction. This file is completed by task M9-T04.` | M9-T04 |
| `CHANGELOG.md` (root) | `# Changelog`, empty line, `## 0.1.0`, empty line, `- Development version. Not released.` | M9-T04 |
| `.github/workflows/ci.yml` | byte-equal to doc 13 `### 17.1 ` (job `cross-engine` has `continue-on-error: true`) | M9-T06 (one line) |
| `.github/workflows/nightly.yml` | doc 13 `### 17.4 ` plus the `evals` job of doc 08 `### 8.14 ` when M8-T41 is done | nobody in M9 |
| `src/gen/build.ts` step 10 | runs A-05, A-06, A-11, the `__PKG__` scan, `manifest.pins`, the budgets, RB-1 to RB-9 | nobody in M9 (M9-T02 may fix a name leak in a generator it calls) |
| `docs/plan/done/` | one file per finished task; `BEN-eval-access.md` exists only when Ben provided model access | each task |

### 0.5 Names chosen by this plan (the specs are silent)

Separate sessions must agree on these. Each is PLAN-CHOSEN and internal (no package export). When a spec section you read names the same thing differently, the spec wins; use its name and record it in the done file.

| Identifier | File | Signature and meaning | Created by |
|---|---|---|---|
| `ReleaseCheckDeps` | `src/gen/index.ts` | `{ run(cmd: string, args: string[], options: { cwd: string; env?: Record<string, string> }): { code: number; stdout: string; stderr: string }; version: string; pkgName: string; out(line: string): void; err(line: string): void }`. Defaults: `run` is `spawnSync(cmd, args, { cwd, env: { ...process.env, ...env }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 256 * 1024 * 1024 })` mapped to `{ code: status ?? 1, stdout, stderr }`; `version` is `VERSION`; `pkgName` is `PKG_NAME` (both from `src/identity.ts`); `out` is `console.log`; `err` is `console.error` | M9-T01 |
| `runReleaseCheck` | `src/gen/index.ts` | `(root: string, deps?: Partial<ReleaseCheckDeps>) => Promise<number>`; runs the seven lines of doc 07 `### 11.4 ` rule 4 in order; returns 0, or 1 at the first failed line; never calls `process.exit` | M9-T01 |
| `parseChangelog` | `src/gen/index.ts` | `(text: string) => { version: string \| null; sections: Record<"Breaking" \| "Added" \| "Fixed" \| "Checker" \| "Pins", string[]> }`. `version` is the text after `## ` of the first line that starts with `## `; `sections` are the non-empty lines below each `### <name>` heading of that version's section, up to the next `### ` or `## ` heading. A section whose only line is `None.` is returned as `[]` | M9-T01 |
| `releaseTags` | `src/gen/index.ts` | `(root: string, deps) => { tag: string; version: string }[]`; the output of `git tag --list` filtered to names that, with one leading `v` removed, match `/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/`; sorted by version, lowest first (numeric `major.minor.patch`; a prerelease sorts below its release) | M9-T01 |
| Output lines of the release check | stdout `release-check: <n> ok` (or `release-check: <n> ok (<note>)`); stderr `release-check: <n> failed: <one sentence>` followed by at most 20 lines of the failing command's output. `<n>` is the item number 1 to 7 of doc 07 `### 11.4 ` rule 4 | M9-T01 |
| Changelog file format | below | M9-T04 writes it, M9-T01 parses it |

Changelog file format (Plan reading PR-M9-2):

```markdown
# Changelog

## <version>

### Breaking

None.

### Added

- <one line per entry>

### Fixed

None.

### Checker

- <one line per entry>

### Pins

- <one line per entry>
```

Newest version first. Every version section has all five `###` sub-headings in the fixed order. An empty sub-section holds exactly the line `None.`.

### 0.6 Order constraints the task table does not show

Obey these in addition to the "Depends on" column. Before starting, check that `docs/plan/done/<id>.md` exists for each task named; when it does not, pick another task.

| Task | Also needs | Why |
|---|---|---|
| M9-T05 | M9-T01, M9-T02 | M9-T01 deletes the `--release-check` `PLAN 4.4` marker and owns doc 07 item 25; M9-T02 proves A-10. Without them the strict audit cannot pass |
| M9-T05 | M9-T06 is NOT needed | when M9-T06 is done, the doc 13 item 7 reading of M9-T05 step 6 applies |
| M9-T06 | every follow-up row that the SPIKE-06 report requires (PLAN 7.2): each `FOLLOW-UP NEEDED:` line of `docs/plan/done/M1-T42.md` or of the report's `## Verdict` names a row whose done file must exist | doc 13 `### 17.3 ` requires the fallbacks applied before the job becomes blocking |
| M9-T01, M9-T04 | may run in parallel | M9-T01 tests use their own temporary changelogs; the real `CHANGELOG.md` is written by M9-T04 |
| M9-T08 | M9-T07 is NOT needed | E4 is Ben's action; the hand-off note lists it |

### 0.7 Plan readings made by this file

Each is the smallest choice that keeps the gates green where the specs are silent or conflict. The task that first applies one adds one line under `## Ledger issues` of the named owning doc (text: `<PR id>: <topic> (docs/plan/M9-release.md 0.7)`) and mentions it in the pull request.

| # | Topic | The specs | Reading | Owning doc | Applied by |
|---|---|---|---|---|---|
| PR-M9-1 | Which tiers item 3 of the release checklist runs | doc 07 `### 11.4 ` rule 4 item 3: "the full test suite of doc 13 for the tiers that need no store". Tier 9 needs WebKit and Gecko builds; tier 11 needs model access | Item 3 runs what the `verify` job runs: `pnpm examples:install`, `pnpm test --no-skips`, `pnpm test:commerce --no-skips`, both with `RIPPLE_NETWORK=1` (tiers 1 to 7 and 10). Tier 9 is gated by the required `cross-engine` CI job (M9-T06); tier 11 by eval gate E4 (M9-T07) | doc 07 | M9-T01 |
| PR-M9-2 | Changelog layout, "first heading", "non-empty Breaking" | doc 07 `### 11.4 ` rule 3 fixes the sub-heading names only; item 7 compares "the changelog's first heading"; the M0 stub's first heading is `# Changelog` | The format of 0.5. "First heading" is the first `## ` line. "Non-empty" means at least one line other than `None.` | doc 07 | M9-T01 |
| PR-M9-3 | What a release tag is, and which is "previous" | doc 07 `### 11.4 ` items 4, 5, 7 name "the previous release tag" and "the git tag" without a format | A release tag is a git tag whose name, with one leading `v` removed, is a semver version (`releaseTags`). The previous release is the highest release-tag version lower than `VERSION`. Tags MUST be fetched (`git fetch --tags origin`) before the check; a shallow clone without tags looks like a first release | doc 07 | M9-T01 |
| PR-M9-4 | The first release | items 4 to 6 compare against a previous release; V1 has none | When no previous release exists, items 4, 5 and 6 print `release-check: <n> ok (no previous release)` | doc 07 | M9-T01 |
| PR-M9-5 | Item 7 before tagging | item 7 compares `VERSION`, the changelog and "the git tag"; the gate M9-T08 runs on `main` before Ben tags | When no release tag points at `HEAD` (`git tag --points-at HEAD`), item 7 compares `VERSION` with the changelog only and prints `release-check: 7 ok (no release tag at HEAD)`. When one points at `HEAD`, its version MUST equal `VERSION` | doc 07 | M9-T01 |
| PR-M9-6 | "The installed Button CSS" in item 6 on Liquid | on Liquid the Button CSS is the region `button/css` inside `assets/ripple.css` (doc 07 `### 5.3 ` example path `assets/ripple.css#button/css`) | npm host project: append the line `/* local */` to the end of the file whose `status --json` file id is `button/css`. Liquid project: insert the line `/* local */` immediately before the trailer line of the `button/css` region of `assets/ripple.css` | doc 07 | M9-T01 |
| PR-M9-7 | Command form in the root `README.md` | D-110 row 1: static files use `npx <pkg>` with no version. doc 07 `### 11.4 ` rule 2: "Liquid instructions always say `npx <pkg>@latest`" | Ledger wins: `npx __PKG__` with no version everywhere in `README.md` | doc 07 | M9-T04 |
| PR-M9-8 | `src/types.generated.ts` in test A-02 | doc 01 A-02 lists the files of `src/` exactly; the ledger tree 5.1 lacks `src/types.generated.ts`, which step G7 writes (doc 07 `### 3.2 ` row G7) | A-02 set equality accepts `types.generated.ts`; the marker comment is rewritten without the string `PLAN 4.4` | doc 01 | M9-T05 |
| PR-M9-9 | `ripple-kit` in test files | doc 01 `### 6.3 ` rule 1: the string MUST NOT appear in any file under `src/` except `src/identity.ts`. doc 01 A-04 excludes `*.test.ts` from its search, and M6 tests compare against the literal `npx ripple-kit@0.1.0` | A test file may contain `ripple-kit` only as an expected value derived from `PKG_NAME` at run time; a literal is replaced by `` `npx ${PKG_NAME}@${VERSION}` ``. M9-T02 does the replacement | doc 01 | M9-T02 |

### 0.8 Definition of done reminder

Every task ends with PLAN section 5.0 (commit, push, pull request in the five-heading form, done file `docs/plan/done/<task id>.md`). "Acceptance" lists what is specific; PLAN section 3.1 always applies. A task that cannot finish opens a draft pull request and writes no done file (PLAN 1 item 7). Reading CI results: `gh pr checks <pull request number>` lists each job with its state; when `gh` is not available, read the checks on the pull request page and paste the job names and states into the pull request body.

---

## M9-T01 `pnpm release:check` (`pnpm gen --release-check`)

- **Goal:** Implement the release checklist of doc 07 `### 11.4 ` rule 4 as `runReleaseCheck`, reached through `pnpm gen --release-check`, with the tests that prove doc 07 acceptance item 25.
- **Depends on:** M8-T43.
- **Kind:** `release`. Size M.

### Read first

doc 07: `## 11. ` whole (`### 11.1 ` to `### 11.4 ` and rule 5, about 5 kB); in `## 12. ` item 25 (0.2 kB); in `### 10.2 ` the rows RB-8 and RB-9 (1 kB); in `### 5.3 ` the field table only (2 kB). doc 01: in `### 5.1 ` the row `release:check` of the script table and the two bullets below it (0.5 kB). This file 0.2, 0.4, 0.5, 0.7 (PR-M9-1 to PR-M9-6). Repository: `src/gen/index.ts` (the argument parser and `runGen`; `grep -n "PLAN 4.4\|--snapshot\|--check" src/gen/index.ts`), the function `checkCliEndToEnd` in `src/gen/build.ts` (the two project set-ups of RB-8 and RB-9), the top of `src/gen/index.test.ts` (how tests call `runGen` in-process).

### Files

Change: `src/gen/index.ts`, `src/gen/index.test.ts`. Must not change: `package.json` (the script `release:check` already exists and is byte-fixed by doc 13 `### 2.3 `), `src/gen/build.ts`, `CHANGELOG.md`, `src/identity.ts`.

### Steps

1. Branch `task/M9-T01-release-check`. Create the extractor (0.3).
2. Argument parsing in `runGen`: `--release-check` is accepted only as the single argument. Any other argument with it: stderr `gen: --release-check takes no other argument`, return 2. On `--release-check` alone, `return runReleaseCheck(<repository root>)`. Delete the marker `// PLAN 4.4: --release-check by M9` (and any other text left of that marker line).
3. Add `ReleaseCheckDeps`, `runReleaseCheck`, `parseChangelog`, `releaseTags` (0.5). `src/gen/index.ts` MUST NOT import `src/gen/build.ts` (build imports the generator). Copy the two project set-ups of `checkCliEndToEnd` (RB-8: a copy of `test/fixtures/theme-min/` plus an empty `templates/`; RB-9: `package.json` `{ "name": "rb9", "private": true, "dependencies": { "react": "19.0.0" } }` and `app/styles/app.css` holding `@import "tailwindcss";` and a newline) into two private functions in `src/gen/index.ts`; when `build.ts` writes them differently, copy what `build.ts` writes and say so in the pull request.
4. The seven lines, in order. Each prints its output line (0.5) and the first failure returns 1:
   1. `run("pnpm", ["gen", "--check"])` exits 0.
   2. `run("pnpm", ["build"])` exits 0.
   3. With `env: { RIPPLE_NETWORK: "1" }`: `run("pnpm", ["examples:install"])`, `run("pnpm", ["test", "--no-skips"])`, `run("pnpm", ["test:commerce", "--no-skips"])`, each exits 0 (PR-M9-1).
   4. Fixture diff (PR-M9-3, PR-M9-4). `prev` = the highest entry of `releaseTags` whose version is lower than `deps.version`; none: ok with note `no previous release`. Otherwise list the paths at `prev.tag` with `run("git", ["ls-tree", "-r", "--name-only", prev.tag, "--", "components"])`, keep those matching `components/<id>/fixtures/<name>.html`, and compare each with `run("git", ["show", prev.tag + ":" + path]).stdout` against the current file (bytes; a missing current file counts as disappeared). When at least one changed or disappeared: the new version MUST differ from `prev.version` in major, or, when the major of `prev.version` is `0`, in major or minor; and `parseChangelog(<root>/CHANGELOG.md).sections.Breaking` MUST be non-empty. Failure sentence names the first three changed paths.
   5. Upgrade rehearsal (only when `prev` exists; else ok with note `no previous release`). In a temporary directory `t`: `run("npm", ["pack", deps.pkgName + "@" + prev.version], { cwd: t })`, then `run("tar", ["-xzf", <the .tgz file name npm printed on its last stdout line>], { cwd: t })`; the previous CLI is `node <t>/package/bin/ripple.mjs`, the new CLI is `node <root>/pkg/bin/ripple.mjs`. For each project (RB-8 with `--host liquid`, RB-9 with `--host react`, each in its own fresh temporary directory): previous CLI `init --host <h>`, previous CLI `add --all --host <h>`, new CLI `upgrade --host <h>`: all exit 0. Then new CLI `status --json --host <h>`: exit 0, and every value of `components` in the parsed JSON has `state === "current"`.
   6. Merge rehearsal (only when `prev` exists). The same as 5 in fresh projects, but before `upgrade` change the installed Button CSS (PR-M9-6). The `upgrade` output line that names the Button CSS path MUST start, after trimming, with `merged` or `keep-local`; `merge-conflict` fails the line unless `parseChangelog(...).sections.Breaking` contains a line with the word `button`. The exit code of `upgrade` is not checked in item 6.
   7. `parseChangelog(...).version === deps.version`; and when `run("git", ["tag", "--points-at", "HEAD"])` lists a release tag, its version equals `deps.version` (PR-M9-5).
   Remove every temporary directory in `finally`.
5. Tests in `src/gen/index.test.ts`. Each test passes a stub `run` that records calls and returns canned results, and `out`/`err` that collect lines; no test spawns `pnpm`, `npm` or the network. Item 4 tests use a real temporary git repository (`git init`, `git -c user.email=t@example.com -c user.name=t commit`, `git tag`), with `run` forwarding only `git` calls to `spawnSync`:
   - `[T1] gen: release-check rejects other arguments` (`runGen(["--release-check", "--check"])` returns 2).
   - `[T1] gen: release-check stops at the first failing line` (stub `pnpm build` returns 1: result 1; stderr starts with `release-check: 2 failed:`; no call after the build).
   - `[T1] gen: release-check passes items 4 to 6 with no previous release` (no tag in the temporary repository; three `ok (no previous release)` lines).
   - `[T1] gen: release-check fails when a fixture changed without a Breaking section` (doc 07 item 25: tag `v0.1.0` with `components/x/fixtures/default.html`; next commit changes one byte; `version` `0.2.0`; `CHANGELOG.md` with `## 0.2.0` and `### Breaking` holding `None.`; result 1 at item 4).
   - `[T1] gen: release-check accepts a changed fixture with a Breaking entry and a minor bump` (same, Breaking holds `- x: ...`; item 4 ok).
   - `[T1] gen: release-check rejects a changed fixture in a patch release` (`version` `0.1.1`, Breaking non-empty; item 4 fails).
   - `[T1] gen: release-check rehearsal runs the previous CLI then the new upgrade` (stub records the `npm pack`, `tar`, previous `init` and `add --all`, new `upgrade`, new `status --json` calls for both hosts in that order; canned status JSON with one component `current`).
   - `[T1] gen: release-check rehearsal fails when a component is not current` (canned status with `state: "outdated"`).
   - `[T1] gen: release-check item 6 rejects merge-conflict for the Button CSS`.
   - `[T1] gen: release-check item 7 compares VERSION, the changelog heading and the tag` (three cases: equal; changelog differs; tag `v0.1.0` at HEAD with `version` `0.2.0`).
   - `[T1] gen: parseChangelog reads the first version section and treats None. as empty`.
6. Proof: `pnpm test:unit --files=src/gen/index --no-skips`, then PLAN 5.0. Then run the real check once: `git fetch --tags origin && pnpm release:check; echo $?`. Paste its stdout lines into the pull request. Items 1 to 3 need `RIPPLE_NETWORK=1` access to mock.shop; without network the run stops at item 3: paste that output and say so (CI-5: never make it pass by unsetting the variable).

### Acceptance

- `grep -c "PLAN 4.4" src/gen/index.ts` prints `0`.
- `pnpm test:unit --files=src/gen/index --no-skips` exits 0 and its output contains the eleven test names of step 5.
- `pnpm gen --release-check --check; echo $?` prints `2`.
- With network: `pnpm release:check; echo $?` prints seven `release-check: <n> ok` lines and `0` on a tree where `CHANGELOG.md`'s first `## ` heading equals `VERSION`. Before M9-T04 is merged the stub changelog satisfies this (`## 0.1.0`).

### Out of scope

Writing `CHANGELOG.md` or `README.md` (M9-T04). Creating or pushing a git tag. Publishing. Fixing a failing test that item 3 runs (report it; its owning task fixes it). The CI test of item 25 "with a temporary commit in CI" as a workflow job: the `[T1]` test above runs in the `verify` job; no workflow file changes.

### If blocked

- The previous CLI of item 5 cannot start without `npm install` in `package/`: run `run("npm", ["install", "--omit=dev", "--ignore-scripts"], { cwd: <t>/package })` before `init`, and record it under `## Ledger issues` of doc 07 (the spec does not say how P's CLI is run). This path cannot be exercised before a first release exists; say so in the done file.
- `git` is not available to tests: draft pull request; the item 4 tests need it.
- Item 2 or 3 fails on `main`: this task is not the owner. Paste the failing line and the last 20 lines; draft pull request only when the failure is in code this task wrote.

---

## M9-T02 CI job `rename` green: build with `RIPPLE_PKG_NAME` set, test A-10

- **Goal:** Make the build under the name `@acme/storefront-ui` leave no `ripple-kit` and no `__PKG__` anywhere in `pkg/`, so that the `rename` CI job (test A-10) is green.
- **Depends on:** M6-T35.
- **Kind:** `release`. Size S.

### Read first

doc 01: `### 6.3 ` (1 kB), in `## 7. ` steps 3 and 8 (1.5 kB), row A-10 and row A-04 of `## 11. ` (0.6 kB). doc 13: `### 17.1 ` only the job `rename` (0.6 kB), `### 17.2 ` (1.5 kB). This file 0.2, 0.7 (PR-M9-9).

### Files

Change only the files a leak is found in: generator modules under `src/gen/` (most likely `docs.ts`, `registry.ts`, `agents-md.ts`, `index.ts`, `src/gen/liquid-core/*`), hand-written text under `skills/`, `guides/`, `components/`, `blueprints/`, `locales/`, `css/`, `bin/`, and test files under `src/` that contain a `ripple-kit` literal (PR-M9-9). Must not change: `src/identity.ts`, `.github/workflows/ci.yml`, `package.json`, any generated file by hand (change its source and run `pnpm gen`).

### Steps

1. Branch `task/M9-T02-rename`.
2. Source scan (doc 01 `### 6.3 ` rule 1, read with A-04's test-file exclusion and PR-M9-9):

   ```bash
   grep -rln "ripple-kit" src css components blueprints skills guides locales bin | grep -v '^src/identity\.ts$'
   ```

   Every hit that is not a `*.test.ts` file is a defect: replace the literal with the token `__PKG__` (text that is copied into `pkg/`) or with `PKG_NAME` imported from `src/identity.ts` (TypeScript that runs in the CLI or the browser bundles). Every hit in a `*.test.ts` file: replace the literal with an expression built from `PKG_NAME` (PR-M9-9).
3. Run the job's commands locally:

   ```bash
   RIPPLE_PKG_NAME="@acme/storefront-ui" pnpm build
   grep -R -l -e 'ripple-kit' -e '__PKG__' pkg; echo "exit $?"     # MUST print only "exit 1" (no file)
   node -e "const n=require('./pkg/package.json').name; if(n!=='@acme/storefront-ui'){console.error('name is '+n);process.exit(1)}"
   ```

4. For each file the `grep` prints, find its producer and fix the source, never the output:
   - A file copied by build step 8 (`README.md`, `css/`, `skills/`, registry sources): the source writes `ripple-kit` instead of `__PKG__`.
   - A file WRITTEN by a generator module (`pkg/manifest.json` key `package`, `pkg/registry/index.json` key `package`, `pkg/docs/**`, `pkg/registry/liquid/**`, the `AGENTS.md` section text): trap. `pnpm build` runs `src/gen/build.ts` bundled by the `build` script WITHOUT the identity plugin (doc 01 `## 7. ` step 3: the plugin is used by steps 4, 5 and 7 only), so a generator that imports `PKG_NAME` sees `ripple-kit` under any `RIPPLE_PKG_NAME`. Fix: the generator writes `__PKG__` (build step 8 then replaces it), or takes the resolved name as a parameter that `build.ts` passes (the name `build.ts` already resolves in step 3). Do not read `process.env.RIPPLE_PKG_NAME` in a generator.
   - A file under `pkg/dist/`: the identity plugin did not apply (an import of `src/identity.ts` under another path or specifier). Fix the import, not the plugin.
   - `__PKG__` left in `pkg/`: a generated or copied text file skipped the step 8 replacement; add the file to the replacement, in `build.ts` step 8 only.
5. Rebuild under the normal name, because `examples/` depend on `pkg/` by `file:` link: `pnpm build && pnpm examples:install`.
6. Proof: the three commands of step 3, then PLAN 5.0 (`pnpm ci`). Push; the `rename` job of the pull request MUST be green.

### Acceptance

- The `grep` of step 2 prints no file outside `*.test.ts`, and no `*.test.ts` file contains the literal `ripple-kit`: `grep -rln "ripple-kit" src css components blueprints skills guides locales bin | grep -v '^src/identity\.ts$'` prints nothing.
- After `RIPPLE_PKG_NAME="@acme/storefront-ui" pnpm build`: `grep -R -l -e 'ripple-kit' -e '__PKG__' pkg` prints nothing and exits 1; the `node -e` check exits 0.
- `gh pr checks <number>` shows `rename` as pass.

### Out of scope

Choosing the final package name (Ben, ledger Q6). Changing `src/identity.ts`. Renaming anything in `examples/` or `evals/` (not part of `pkg/`). The `package-node20` and `node22` jobs (M9-T03).

### If blocked

- RB-8 or RB-9 (build step 10) fails only under the renamed build: the CLI compares a trailer's package name with a hard-coded `ripple-kit`; fix it to use `PKG_NAME`. When the failure is in the trailer format itself (doc 07 `### 5.1 `), draft pull request naming the rule.
- A leak comes from a file under `theme/` or `docs/`: those are not copied into `pkg/` (doc 01 `### 6.1 `); a hit there means the build copies a file it must not; report it as a defect of the build task that added the copy.

---

## M9-T03 CI jobs `node22` and `package-node20` green

- **Goal:** Make the CI job `node22` (repository tooling and tiers 1 and 2 on Node 22.18.0) and the CI job `package-node20` (the built CLI starts on Node 20.18.0) green.
- **Depends on:** M6-T35.
- **Kind:** `release`. Size S.

### Read first

doc 13: `### 17.1 ` only the jobs `node22` and `package-node20` (1.2 kB), `### 17.2 ` (1.5 kB), rule T-7 (search `**T-7**`, 0.2 kB). doc 01: `## 9. ` the "Node matrix" table and rules 1 to 5 below it (1.5 kB), and the last bullet of `## 12. ` (0.3 kB). This file 0.2.

### Files

Change only source files that fail on the older Node: files under `src/`, `test/`, `examples/*/` (server code). Must not change: `.github/workflows/ci.yml`, the `engines` of the root `package.json`, `src/gen/build.ts` target settings (`node20` in build step 5), unless "If blocked" says so.

### Steps

1. Branch `task/M9-T03-node-versions`.
2. Get the two Node versions. Check in this order and use the first that works: `fnm use 22.18.0` / `fnm use 20.18.0`; `nvm use 22.18.0`; `npx -y node@22.18.0 --version` (runs that Node through npm). When none works, skip to step 5 and use the CI run of the pull request as the only proof.
3. Job `node22`, locally on Node 22.18.0, the job's commands in order:

   ```bash
   pnpm install --frozen-lockfile
   pnpm typecheck
   pnpm gen --check
   pnpm build
   pnpm examples:install
   pnpm test:unit --no-skips
   pnpm test:conformance
   ```

   `pnpm test:conformance` may report skips, and every skip reason MUST be `Remix needs Node 24.3 or later (running <version>)` (T-7). Any other skip or any failure is a defect.
4. Job `package-node20`: build on Node 24 (`pnpm build`), then on Node 20.18.0 run `node pkg/bin/ripple.mjs manifest > /dev/null; echo $?`; MUST print `0`.
5. Fix each failure in the source that uses an API newer than the job's Node version. Common causes (check with the failing stack trace; this list is guidance, not spec): on Node 20.18 in `pkg/dist/cli` and its chunks: `Object.groupBy`, `Promise.withResolvers`, `Set.prototype.union` and the other new `Set` methods, iterator helpers (`.map` on an iterator), `fs.globSync`, `require()` of an ES module; on Node 22.18 in tooling and tests: `RegExp.escape`, `URLPattern`, `import.meta.main`, `Error.isError`. esbuild's `target: "node20"` lowers syntax only, not missing APIs; replace the call with an equivalent that exists in the job's version.
6. Proof: steps 3 and 4 (or the CI run), then PLAN 5.0 on Node 24. Push; jobs `node22` and `package-node20` of the pull request MUST be green.

### Acceptance

- On Node 22.18.0 the seven commands of step 3 exit 0; skips of `pnpm test:conformance` all carry the T-7 reason.
- On Node 20.18.0 `node pkg/bin/ripple.mjs manifest > /dev/null` exits 0.
- `gh pr checks <number>` shows `node22` and `package-node20` as pass.

### Out of scope

Other CLI commands on Node 20 (the job runs `manifest` only). Raising any version floor without the fallback below. The jobs `verify`, `rename`, `cross-engine`.

### If blocked

- Spec mismatch to note, not fix: doc 01 `## 9. ` says the job "installs the packed `pkg/`"; the complete job text of doc 13 `### 17.1 ` runs `node pkg/bin/ripple.mjs manifest` without installing. The job text is the spec (D-113); add one line under `## Ledger issues` of doc 01 and keep the job.
- The CLI cannot run on Node 20.18 without a dependency or language feature that has no replacement: doc 01 `## 12. ` (last UNVERIFIED item) allows raising `engines.node` instead. Default now: fix the code. Fallback, only with that reason written in the pull request: change `engines.node` in the generated `pkg/package.json` (source: `src/gen/build.ts` step 9) and the second `node-version` of the `package-node20` job to `22.18.0`, keep the job name, and add a line under `## Ledger issues` of doc 01 and doc 13 (D-052 item (f) states `>=20.18`; the ledger change is Ben's to confirm).

---

## M9-T04 Root `README.md` and `CHANGELOG.md`; version numbers applied

- **Goal:** Replace the root `README.md` stub by the project README (what Ripple is, quick start per host, links) and write `CHANGELOG.md` for version `0.1.0`, and confirm every version number of doc 07 `### 11.1 ` has its release value.
- **Depends on:** M8-T43.
- **Kind:** `docs`. Size S.

### Read first

Ledger `## 12. ` row `README.md` (0.1 kB). doc 07: `### 11.1 ` (1 kB), `### 11.3 ` (1 kB), `### 11.4 ` rule 3 (0.3 kB). Ledger D-110 row 1 (search `| 1 | \`<command form>\``, 0.3 kB). Repository: `guides/getting-started.md` (the section "Install per host"), `docs/README.md` (only its first 20 lines, to name it in a link), `ls guides/`, `ls skills/`. This file 0.2, 0.5 (changelog format), 0.7 (PR-M9-2, PR-M9-7).

### Files

Change: `README.md`, `CHANGELOG.md`. Must not change: `src/identity.ts` (`VERSION` is already `0.1.0`), any manifest, `PLAN.md`, anything under `docs/`.

### Steps

1. Branch `task/M9-T04-readme-changelog`.
2. `README.md`, in this order, plain Markdown, no badges, no images:
   1. `# Ripple`, then one paragraph of at most four sentences: a design system and component library for Shopify storefronts; one HTML contract per component, rendered by four hosts (`html`, `react`, `remix`, `liquid`); light-DOM custom elements with progressive enhancement; Hydrogen as the cart layer on every host. Every claim MUST be a fact of `docs/01-architecture.md` `## 1. ` or the ledger section 1 A; write nothing else.
   2. `## Quick start`, one `###` sub-section per host in the order `react`, `remix`, `html`, `liquid`. Each holds the exact commands of `guides/getting-started.md` "Install per host" for that host, copied unchanged (they are written with `__PKG__`). Command form: `npx __PKG__` with no version (D-110 row 1, PR-M9-7).
   3. `## Documentation`: links to `docs/README.md` (the specification index), `guides/` (one bullet per guide file with its frontmatter `title`), `skills/` (one line naming the 14 skills), and the sentence `In an installed project, run npx __PKG__ docs for the same pages.`
   4. `## Status`: the two lines `Version 0.1.0. Components with status beta are not covered by semantic versioning (see CHANGELOG.md).` and `The package name is a placeholder until the first publish.` Do not name the placeholder itself (it would fail the rename test).
   5. `## License`: `MIT (see LICENSE).`
   The file MUST NOT contain the string `ripple-kit` (it is copied to `pkg/README.md`, doc 01 `## 7. ` step 8; the `rename` job scans `pkg/`). Relative links in `pkg/README.md` point into the package, where `docs/README.md` does not exist; this is accepted (the `ripple docs` sentence covers installed projects).
3. `CHANGELOG.md` in the format of 0.5, one section `## 0.1.0`:
   - `### Breaking`: `None.`
   - `### Added`: one bullet per component id with status other than `planned`, ascending, written `` - `<id>` (<status>) `` from `node -e "const m=require('./pkg/manifest.json');for(const [id,c] of Object.entries(m.components).sort())if(c.status!=='planned')console.log('- \`'+id+'\` ('+c.status+')')"` after `pnpm build`; then one bullet per blueprint id (`ls blueprints | grep -v '^_'`); then the bullets `- CLI commands: init, add, diff, upgrade, remove, status, check, docs, manifest, skills sync, skills check.` and `- Skills: ` followed by the 14 skill names of `ls skills/`, comma-separated.
   - `### Fixed`: `None.`
   - `### Checker`: one bullet `- Rules: ` followed by the 55 rule ids of `ls src/check/rules/ | grep -o '^RP[0-9]*' | sort -u`, comma-separated, and one bullet `` - `TC:<CheckName>` for Theme Check findings. ``
   - `### Pins`: three bullets, values read from `pkg/manifest.json` `pins`: `` - `@ui-sdk/core` 0.1.0-beta.14 (exact). ``, `` - `@ui-sdk/web` 0.1.0-beta.14 (exact). ``, `` - `@shopify/hydrogen` 2026.10.3 (peer range >=2026.10.3 <2027). ``
4. Version numbers (doc 07 `### 11.1 `). Check, do not edit; a wrong value is a defect of its owning task:

   ```bash
   grep -c 'VERSION = "0.1.0"' src/identity.ts      # 1
   node -e "const m=require('./pkg/manifest.json');if(m.manifestVersion!==1)process.exit(1);const bad=Object.entries(m.components).filter(([,c])=>c.status!=='planned'&&c.since!=='0.1.0');if(bad.length){console.error(bad.map(b=>b[0]).join(' '));process.exit(1)}"
   node -e "if(require('./pkg/registry/index.json').registryVersion!==1)process.exit(1)"
   node -e "if(require('./pkg/package.json').version!=='0.1.0')process.exit(1)"
   ```

   `lockVersion` and the check report `version` are asserted by existing tests (`pnpm test:unit --grep="status:|check:"` passes).
5. Proof: `pnpm build` (copies `README.md` to `pkg/README.md`), `grep -c "ripple-kit" README.md` prints `0`, then PLAN 5.0.

### Acceptance

- `head -1 README.md` prints `# Ripple`; `grep -c "under construction" README.md` prints `0`; `grep -c "^## " README.md` prints `4`; `grep -c "ripple-kit" README.md` prints `0`.
- `grep -m1 "^## " CHANGELOG.md` prints `## 0.1.0`; `grep -c "^### " CHANGELOG.md` prints `5`; the five `###` lines are, in order, `### Breaking`, `### Added`, `### Fixed`, `### Checker`, `### Pins`.
- The `grep` and the three `node -e` commands of step 4 succeed.
- When M9-T01 is merged and the session has network (0.2): `pnpm release:check` prints `release-check: 7 ok`.

### Out of scope

Changing `VERSION`, `since` or `status` of any component (M7-T28 set commerce components `stable`). The package docs under `guides/` and `pkg/docs/`. A documentation website (ledger section 11 item 12). Creating a git tag.

### If blocked

- `guides/getting-started.md` has no "Install per host" section: the guide task (M8-T04) is incomplete; draft pull request. Do not write install commands from memory.
- A component other than `planned` has `since` other than `0.1.0`, or `status` `beta` remains: list the ids in the pull request and the done file; do not edit manifests here.

---

## M9-T05 Strict audit: no `PLAN 4.4` string under `src/`; acceptance lists of doc 01 §11, doc 07 §12, doc 13 §19 all pass

- **Goal:** Remove the last bring-up markers (restore set equality of tests A-01 and A-02) and prove, item by item, that the acceptance lists of doc 01 `## 11. `, doc 07 `## 12. ` and doc 13 `## 19. ` pass.
- **Depends on:** M8-T43. Also needs M9-T01 and M9-T02 (section 0.6).
- **Kind:** `release`. Size M.

### Read first

doc 01: `## 11. ` (8 kB). doc 07: `## 12. ` (8 kB). doc 13: `## 19. ` (2.5 kB), `### 17.3 ` (0.6 kB). This file 0.2, 0.4, 0.7 (PR-M9-8). Repository: `src/architecture.test.ts` (the A-01 and A-02 tests and their markers), the output of `grep -rn "PLAN 4.4" src/`.

### Files

Change: `src/architecture.test.ts`; `docs/01-architecture.md` (one line under `## Ledger issues`, PR-M9-8). Change any other file under `src/` ONLY to delete a stale `PLAN 4.4` marker comment whose replacement code already exists (step 3). Must not change: any test's assertion other than A-01 and A-02; any spec section other than the ledger-issue line; `.github/workflows/*`.

### Steps

1. Branch `task/M9-T05-strict-audit`. Create the extractor (0.3). Keep every command's output: `<command> 2>&1 | tee -a node_modules/.cache/ripple/m9-audit.log`.
2. `pnpm install --frozen-lockfile && pnpm build && pnpm examples:install`.
3. Markers. Run `grep -rn "PLAN 4.4" src/`. For each hit:
   - The two markers of `src/architecture.test.ts` (0.4): step 4.
   - A marker naming a task whose done file exists, where the code the marker says is missing now exists (the stub was replaced but the comment stayed): delete the comment line only.
   - A marker naming a task whose done file exists, where the relaxation is still in force (a skip, a filter, a stub): defect of that task. Do not fix it here; draft pull request naming the marker, the file and the task.
   - A marker naming a task whose done file does not exist: stop; this task started too early.
4. `src/architecture.test.ts`:
   - A-01: set equality with the list of doc 01 row A-01 (`pkg` optional; excluded: `.git`, `.gitignore`, `node_modules`). Rename the test to `[T1] architecture: A-01 top-level entries equal the closed list` and delete its marker.
   - A-02: directories equal the ten of row A-02; files equal `identity.ts`, `index.ts`, `responsive.ts`, `image.ts`, `types.ts`, `types.generated.ts` plus `*.test.ts`; `src/runtime/element.ts` does not exist (on the SPIKE-04 default path). Rename it to `[T1] architecture: A-02 entries of src equal the closed list`. Replace both markers by one comment `// types.generated.ts: written by step G7; ledger tree 5.1 lacks it (docs/01-architecture.md Ledger issues, PR-M9-8)`.
   - Add under `## Ledger issues` of `docs/01-architecture.md` the line `PR-M9-8: src/types.generated.ts is missing from the ledger tree 5.1 and from A-02 (docs/plan/M9-release.md 0.7)`.
   - When A-01 fails with set equality: an extra top-level entry is a defect of the task that created it; a missing one (for example `evals`) means a milestone is incomplete. Draft pull request either way.
5. Run the suites once and keep the logs:

   ```bash
   RIPPLE_NETWORK=1 pnpm ci
   RIPPLE_NETWORK=1 pnpm test:commerce --no-skips
   RIPPLE_NETWORK=1 pnpm test:nojs --no-skips
   ```

   Each last line MUST read `... <p> passed, 0 failed, 0 skipped`. A "passing line" below is a line of these logs that contains the test name and is not a failure line.
6. The audit. Fill this table in the pull request body (column "Result": `pass` with the evidence, or `FAIL` with the output). Every row MUST be `pass`.

   doc 01 `## 11. `:

   | Item | Evidence |
   |---|---|
   | A-01 to A-04, A-12, A-15 | passing lines `[T1] architecture: A-01`, `A-02`, `A-03`, `A-04`, `A-12`, `A-15` |
   | A-05, A-06, A-11 | `pnpm build` exited 0 in step 2 (build step 10 runs them) |
   | A-07, A-08, A-13 | passing lines in `test/upgrade/bundles.test.ts` containing `A-07`, `A-08`, `A-13` (`pnpm test:upgrade --files=test/upgrade/bundles --no-skips`) |
   | A-09 | passing line containing `E2E-10` in the `test:commerce` log |
   | A-10 | the three commands of M9-T02 step 3 (rerun them, then `pnpm build && pnpm examples:install`) |
   | A-14 | passing line containing `NJ-F1` in the `test:nojs` log |

   doc 07 `## 12. `:

   | Item | Evidence |
   |---|---|
   | 1 | extract the `json` block of doc 07 `### 1.2 ` (index 0; 26303 bytes, first line `{`, checked 2026-11-22; do not read it into context) to `node_modules/.cache/ripple/schema.json` and compare: `node -e "const a=JSON.parse(require('fs').readFileSync('src/gen/schema/manifest.schema.json','utf8')),b=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.exit(JSON.stringify(a,null,2)===JSON.stringify(b,null,2)?0:1)" <extracted file>` exits 0 |
   | 2 | passing lines starting `[T1] manifest:` (the 23 `mutation <n> is rejected` tests and the three worked entries); `grep -n "LEDGER_COMPONENTS" src/gen/*.test.ts` finds the 84-key count assertion |
   | 3 | `grep -n "\-\-check" src/gen/index.test.ts` finds the five stale-file cases (fixture, `{% schema %}` region, Dialog React header, `css/props.css` line, `blueprints/product/html/product.html`); each has a passing line |
   | 4 | 24 passing lines containing `MB-` (`pnpm test:unit --grep="MB-[0-9]+" --no-skips` reports at least 24 passed) |
   | 5, 6 | passing lines starting `[T1] gen-html:` |
   | 5a | `grep -n "data-rmx-preserve-attrs" src/gen/*.test.ts` finds a test with a passing line |
   | 5b | passing line `[T1] liquid-core: every ripple.props key a generated block schema refers to is in core.json` |
   | 7 to 11e, 13 to 24a | the test-name prefixes of the M6 gate: `[T1] trailer:` (7), `[T1] plan:` (8, 11a), `[T1] merge3:` (9), `[T1] diff:` (10), `[T1] detect-host:` (11), `[T1] init:` (11b, 11e, 18), `[T1] docs:` (11d), `[T1] add:` (13), `[T1] upgrade:` (14), `[T1] acceptance:` (15, 17), `[T1] status:` (16), `[T1] check:` (20 to 23), `[T1] liquid-calls:` (24), `[T1] RP401:` (24a); and `ls src/check/rules/RP[0-9][0-9][0-9].ts \| wc -l` prints `55` (item 20, layer B shipped) |
   | 12 | `pnpm build` exited 0 (RB-8, RB-9 in step 10) |
   | 19 | `grep -n "fr.json" src/cli/commands/*.test.ts` finds a test with a passing line |
   | 25 | passing line `[T1] gen: release-check fails when a fixture changed without a Breaking section` (M9-T01) |

   doc 13 `## 19. `:

   | Item | Evidence |
   |---|---|
   | 1 | passing line `[T1] run: package.json scripts equal docs/13-testing.md 2.3` |
   | 2 | `pnpm test:run --bogus; echo $?` prints `2`; in a copy without `pkg/` (`mv pkg pkg.off`): `pnpm test:unit` exits 0 and `pnpm test:conformance` exits 2 printing the `pkg/ is missing` message; then `mv pkg.off pkg` |
   | 3 | `git log --oneline -1 -- test/run.ts src/testing/ src/gen/size.ts test/support/hosts/` is listed; byte comparison is not required for the files marked NOT RUN (their gates are the tests of item 4) |
   | 4, 5 | the `pnpm ci` log has no failure and no skip |
   | 6 | `node -e "require('./size-budget.json')"` exits 0, and the build of step 2 passed its budgets |
   | 7 | `diff .github/workflows/ci.yml node_modules/.cache/ripple/ci.yml` prints nothing, or, when `docs/plan/done/M9-T06.md` exists, exactly the one removed line `    continue-on-error: true` (doc 13 `### 17.3 `). `diff .github/workflows/nightly.yml node_modules/.cache/ripple/nightly.yml` prints only the added `evals` job of doc 08 `### 8.14 ` (compare by eye), or nothing while `docs/plan/done/M8-T41.md` does not exist (record "evals job waits for M8-T41") |
   | 8 | the `RIPPLE_NETWORK=1 pnpm ci` last line of step 5 |
   | 9 | in `components/tabs/fixtures/`, the file found by `grep -l 'id="t-tab-account"' components/tabs/fixtures/*.html`: delete `aria-selected="true"` from that button, run `pnpm test:upgrade --component=tabs`, confirm a failure line containing `button#t-tab-account: attributes aria-selected: null -> "true"`, then `git checkout -- components/tabs/fixtures/` |
   | 10 | A-05 (above), and `node -e "import('./pkg/dist/testing/index.mjs').then(m=>{if(typeof m.serveTheme!=='function')process.exit(1)})"` exits 0 |
   | 11 | passing lines `[T1] resources: the set is the documented set`, `[T1] liquid-shim: filters`, `[T1] liquid-shim: tags outside the union throw` |

7. A row that fails: when the missing piece is a test that no task wrote, write it in the owner's test file with the name the spec item gives and list it under "What changed"; when an existing test fails, draft pull request naming the item and the owning task.
8. Proof: `grep -rn "PLAN 4.4" src/` prints nothing; step 5; PLAN 5.0. The done file lists the table's row count and "all pass".

### Acceptance

- `grep -rn "PLAN 4.4" src/ | wc -l` prints `0`.
- `pnpm test:unit --grep="architecture: A-0[12]" --no-skips` reports 2 passed.
- The three commands of step 5 exit 0 with `0 failed, 0 skipped`.
- The pull request body holds the three audit tables with every row `pass`.

### Out of scope

`PLAN 4.4` markers under `test/` (M9 checks `src/` only; PLAN 4.4). Fixing an owning task's failing test. Tier 8 (M10), tier 9 (M9-T06), tier 11 (M9-T07). Editing ledger text.

### If blocked

- Network to mock.shop is unavailable: A-09, A-14 and doc 13 item 8 cannot be proven locally. Run the other rows, open the pull request, and use the `verify` job of the pull request (it sets `RIPPLE_NETWORK=1` and runs tier 7) as the evidence for those three rows.
- `mv pkg pkg.off` is not allowed in the session: run item 2 of doc 13 in a fresh clone (`git clone . node_modules/.cache/ripple/nopkg && cd node_modules/.cache/ripple/nopkg && pnpm install --frozen-lockfile`).

---

## M9-T06 Make the `cross-engine` CI job blocking (requires the SPIKE-06 report)

- **Goal:** Delete `continue-on-error: true` from the `cross-engine` job of `.github/workflows/ci.yml`, with the job passing, so that tier 9 (WebKit and Gecko) is required to merge.
- **Depends on:** M1-T42. Also needs every follow-up row the SPIKE-06 report requires (section 0.6).
- **Kind:** `release`. Size S.

### Read first

doc 13: `### 17.1 ` only the job `cross-engine` (0.8 kB), `### 17.2 ` (1.5 kB), `### 17.3 ` (0.6 kB), in `### 11.3 ` the rules XE-1, XE-2, XE-4 (1 kB), `### Fallback (SPIKE-06)` in `## 21. ` (1.5 kB). The report `docs/research/spikes/cross-engine-features/README.md` (its `## Verdict` section). `docs/plan/done/M1-T42.md`. This file 0.6.

### Files

Change: `.github/workflows/ci.yml` (delete one line). Must not change: anything else in either workflow file; any CSS, element or test (fallbacks are the follow-up rows' work).

### Steps

1. Preconditions, in order:
   1. `test -f docs/research/spikes/cross-engine-features/README.md`. When missing (M1-T42 recorded BLOCKED-ON-ENV, or wrote only `partial-results.md`): this task cannot start; pick another task.
   2. `grep -h "FOLLOW-UP NEEDED" docs/plan/done/M1-T42.md docs/research/spikes/cross-engine-features/README.md`: for each line, the follow-up row it names has a done file. When the report says the floor of D-032 must be raised for a feature with no fallback (`attribute-token props match`, `revert-layer`; doc 13 `### Fallback (SPIKE-06)`), the ledger change is Ben's: stop, BLOCKED-ON-BEN (below).
2. Branch `task/M9-T06-cross-engine-blocking`.
3. Engines: `pnpm exec playwright install --with-deps webkit firefox` (PLAN 5.0 allows it because this task says so). When the install fails, skip to step 5 and use the CI run as the proof.
4. `pnpm build && pnpm examples:install`, then `RIPPLE_NETWORK=1 pnpm test:webkit` and `RIPPLE_NETWORK=1 pnpm test:firefox`. Both MUST exit 0. A failure is not fixed here: draft pull request naming each failing test; the coordinator adds a follow-up row (PLAN 7.2).
5. In `.github/workflows/ci.yml` delete exactly the line `    continue-on-error: true` (four spaces; it occurs once, in the `cross-engine` job). Nothing else changes.
6. Proof: extract `node_modules/.cache/ripple/ci.yml` (0.3); `diff node_modules/.cache/ripple/ci.yml .github/workflows/ci.yml` prints exactly one removed line. Then PLAN 5.0. Push; both matrix legs of `cross-engine` on the pull request MUST be green.
7. Done file: note that from now on line 17 of the component checklist (doc 13 `### 18.1 `) blocks merges, and that marking `cross-engine` as a required status check in the repository's branch protection is a setting only an administrator can change (listed in the M9 hand-off note).

### Acceptance

- `grep -c "continue-on-error" .github/workflows/ci.yml` prints `0`.
- The `diff` of step 6 shows exactly one removed line and no added line.
- `gh pr checks <number>` shows `cross-engine (webkit)` and `cross-engine (firefox)` as pass.

### Out of scope

Applying a SPIKE-06 fallback, raising the floor, editing `[chromium]` tags, the `nightly.yml` `cross-engine` job (it never had `continue-on-error`).

### If blocked

- BLOCKED-ON-BEN: the report requires raising the browser floor (D-032). Default path now: leave `continue-on-error: true`; write nothing; the M9 gate (M9-T08) then fails on its dependency and the hand-off note lists the floor decision. Fallback after Ben decides: the follow-up row records the floor in the ledger and the probes pass at the new floor (doc 13 `### Fallback (SPIKE-06)`); then run this task.
- No local engines and the CI legs fail: draft pull request with the failing test names from the job log.

---

## M9-T07 Eval gate E4: release gate on the core set. **BLOCKED-ON-BEN (model access)**

- **Goal:** Run the release eval of doc 08 `### 8.14 ` (core set, arm `ripple`, bar adapter and model, 5 runs per cell, judged) and record that its pass rate is not more than 5 points below the previous release's recorded run.
- **Depends on:** M8-T42.
- **Kind:** `gate`. Size S (the run itself takes hours; the session only starts it and records the result).

### Read first

doc 08: `### 8.14 ` the "Release gate" bullet (0.4 kB), `### 8.4 ` the command line and defaults (0.5 kB), `### 8.12 ` the `bar.json` block and the definition of a cell (1.5 kB). PLAN `### 4.3 ` (BLOCKED-ON-BEN table). This file 0.8.

### Files

Create: `docs/plan/done/M9-T07.md`. Change nothing else. `evals/runs/` is git-ignored and is never committed.

### Steps

1. Preconditions (PLAN 4.3), each MUST hold, else this task is BLOCKED-ON-BEN and is skipped:
   - `test -f docs/plan/done/BEN-eval-access.md` and the CI secret `RIPPLE_EVAL_API_KEY` is set (locally: the variable is exported in the session's environment).
   - `node -e "const b=require('./evals/rubric/bar.json');if(!b.weakModel||!b.judgeModel)process.exit(1)"` exits 0 (the run is judged, so `judgeModel` is needed: ledger Q17).
   - `test -f docs/plan/done/M8-T42.md` and its first line reports the bar passed.
2. Branch `task/M9-T07-eval-e4`.
3. Run, with `<agentModel>` and `<adapter>` read from `evals/rubric/bar.json` keys `agentModel` and `adapter`:

   ```bash
   pnpm eval -- --tasks core --hosts all --adapter <adapter> --model <agentModel> --arm ripple --runs 5 --judge --out evals/runs/release-0.1.0
   ```

   The core set is 25 cells (doc 08 `### 8.12 `), 125 judged runs.
4. Read `evals/runs/release-0.1.0/report.md`: the overall pass rate. Previous release's recorded run: the pass rate in the done file of the previous release's E4 run. For version `0.1.0` there is none: the gate passes and this run is the baseline (spec silent; see the problem list). For a later release: fail when `previous - current > releaseMaxDrop` (`0.05` in `bar.json`).
5. Done file (at most 15 lines): first line `E4: PASS` or `E4: FAIL`; the command; the run id; the pass rate as a number with three decimals; the previous rate or `baseline`; the per-cell lines below 4 of 5. Attach `report.md` to the pull request (paste it into the body or upload it as a file comment). Commit only the done file; PLAN 5.0.

### Acceptance

- `docs/plan/done/M9-T07.md` exists; its first line is `E4: PASS`; it names `evals/runs/release-0.1.0` and a pass rate.
- The pull request carries the content of `report.md`.

### Out of scope

Changing tasks, checks, budgets or rubric to improve a score (rules G-1 to G-7 of doc 08 `### 8.13 `). Running the bar (`--bar`, M8-T42). The nightly `evals` job (M8-T41).

### If blocked

- Default path now (no model access): write no done file; M9-T08 does not depend on this task and lists E4 in the hand-off note as Ben's action.
- The run aborts with `skill discovery is not working in <adapter>` (canary, doc 08 `### 8.4 ` step 6): harness defect of M8-T25; draft pull request.

---

## M9-T08 M9 gate: release candidate; hand-off note `docs/plan/done/M9-handoff.md`

- **Goal:** Prove that the repository is a release candidate (the M9 row of PLAN 4.2) and write the hand-off note listing what only Ben does.
- **Depends on:** M9-T01 to M9-T06.
- **Kind:** `gate`. No source, test or spec file changes.

### Read first

`docs/PLAN.md`: `### 4.2 ` (the M9 row and the eval gate table), `### 4.3 `. doc 07: `### 11.4 ` (1.5 kB). Ledger `## 10. ` rows Q5, Q6, Q17, Q18 (1 kB). doc 13: `### 17.2 ` (1.5 kB). This file 0.6, 0.7.

### Files

Create: `docs/plan/done/M9-T08.md`, `docs/plan/done/M9-handoff.md`. Change nothing else.

### Steps

1. Branch `task/M9-T08-gate`, from an up-to-date `main`; `git fetch --tags origin`.
2. Done files: `ls docs/plan/done/M9-T0[1-6].md | wc -l` prints `6`. `grep -l 'BLOCKED\|FOLLOW-UP NEEDED' docs/plan/done/M9-T0[1-6].md` prints nothing, or every file it prints names a follow-up task whose own done file exists.
3. `pnpm install --frozen-lockfile && RIPPLE_NETWORK=1 pnpm release:check; echo $?`: seven `release-check: <n> ok` lines and `0`.
4. CI on `main`: `gh run list --branch main --workflow ci --limit 1 --json databaseId,conclusion` gives `conclusion` `success`; `gh run view <databaseId> --json jobs --jq '.jobs[] | [.name, .conclusion] | @tsv'` lists `verify`, `node22`, `rename`, `package-node20` as `success`. Also record the two `cross-engine` legs (required since M9-T06).
5. `grep -rn "PLAN 4.4" src/ | wc -l` prints `0`.
6. Write `docs/plan/done/M9-handoff.md` (no line limit) with these sections, each fact copied from the source named:
   - `## Release candidate`: the commit hash checked; `VERSION` (`0.1.0`); the output lines of step 3; the CI run id of step 4.
   - `## Only Ben does`:
     1. Final package name and scope (ledger Q6; placeholder `ripple-kit`): change the one line `PKG_NAME` in `src/identity.ts`; the `rename` job proves the rest (D-052). Do it before the first publish: trailers record the name, and after a publish the old name's versions must stay available (doc 07 `### 11.4 ` rule 5).
     2. Licence (ledger Q18; placeholder `MIT`).
     3. Tag and publish: tag the release commit; publish the `pkg/` directory built from it with dist-tag `latest` (prereleases `next`, doc 07 `### 11.4 ` rule 2); a published version is never unpublished and its tarball never changes (rule 1). The publish command itself is not specified by the docs.
     4. Eval gate E4 (M9-T07): needs `docs/plan/done/BEN-eval-access.md`, the secret `RIPPLE_EVAL_API_KEY` and non-null `weakModel` and `judgeModel` in `evals/rubric/bar.json` (ledger Q17); attach its `report.md` to the release (doc 08 `### 8.14 `).
     5. Branch protection: mark `verify`, `node22`, `rename`, `package-node20`, and both `cross-engine` legs as required checks (doc 13 `### 17.2 `, `### 17.3 `).
     6. Liquid live track M10 (ledger Q5: preview store, secrets `RIPPLE_STORE_URL`, `RIPPLE_STORE_PASSWORD`, `docs/plan/done/BEN-store.md`); until then bar row B-8 is `blocked` and the Liquid host MUST NOT be described as ready (doc 08 `### 8.12 `).
   - `## Tasks waiting on Ben`: every task id marked BLOCKED-ON-BEN in PLAN section 6 that has no done file (`M8-T39`, `M8-T41`, `M8-T42`, `M9-T07`, `M10-T02` to `M10-T09` as applicable), each with what it waits for (PLAN 4.3).
   - `## Open questions at their default`: the ledger `## 10. ` rows Q1 to Q26, one line each: the number and the default (copied).
   - `## Plan readings to confirm`: PR-M9-1 to PR-M9-9 of this file, one line each.
7. Write `docs/plan/done/M9-T08.md`: first line `M9 gate: PASS`; the commands of steps 2 to 5 with their observed output; the list of M9 tasks with their pull requests; M9-T07 as `BLOCKED-ON-BEN` or with its result. Commit only the two files; PLAN 5.0.

### Acceptance

Every command of steps 2 to 5 gives the stated output. `docs/plan/done/M9-T08.md` exists and its first line is `M9 gate: PASS`. `docs/plan/done/M9-handoff.md` exists with the five sections of step 6.

### Out of scope

Fixing anything. Tagging, publishing, renaming, changing branch protection. Running E4.

### If blocked

- Any check fails: first line `M9 gate: FAIL`, the failing command and its output, the owning task (release check line 1 to 7: M9-T01 unless the failing child command names another owner; jobs: `rename` M9-T02, `node22` and `package-node20` M9-T03, `cross-engine` M9-T06, `verify` the task named by the failing test), draft pull request, stop. Never fix inside the gate task.
- `gh` is not available: read the latest `ci` run of `main` in the repository's Actions page and paste job names and conclusions.
