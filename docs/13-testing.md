# 13 - Testing

Status: specification. Law: `00-decisions.md` (D-063, D-064, and every decision this document tests). Where this document and the ledger disagree, the ledger wins. No disagreement is open ([Ledger issues](#ledger-issues)).

## 0. Scope and how to read this document

This document specifies how Ripple is tested: the test tiers of D-063, the test runner, the exact `pnpm` scripts, the support code under `src/testing/` and `test/`, the Liquid shim, the resource fixtures, the size-budget file, the CI workflows, and the definition of done for a component.

Owned here:

| Thing | Section |
|---|---|
| Tier table, tags, commands | 1, 2 |
| Runner `test/run.ts`, scripts, devDependencies, environment variables | 2 |
| Layout of `test/` and `src/testing/` | 3 |
| `src/testing/fixtures.ts`, `resources.ts`, `upgrade-diff.ts`, `liquid-shim.ts`, `serve-theme.ts`, `index.ts` | 4 |
| Browser support code (`test/support/`), the fixture page | 5 |
| Tiers 1 to 11: what each runs and when it passes | 6 to 16 |
| Visual regression | 14 |
| `size-budget.json` and `src/gen/size.ts` | 15 |
| CI workflows | 17 |
| Definition of done for a component | 18 |

Not owned here (linked, never restated):

| Thing | Owner |
|---|---|
| Canonicalisation algorithm, fixture record schema, required fixtures, masks, fixture lint, upgrade allow-list format | `02-html-contract.md` sections 7, 11, 12. The reference code of section 12 IS `src/testing/canonicalize.ts`; this document never restates the algorithm (D-075) |
| What each host adapter asserts (Q-1 to Q-22), `REACT_HYDRATION_ALLOW` | `06-bindings.md` section 11 |
| `pnpm gen`, `pnpm gen --check`, `pnpm gen --snapshot`, checker rules RP601 to RP609 | `07-manifest-registry-cli.md` |
| CSS acceptance tests A-01 to A-23, the measuring minifier | `03-styling-and-tokens.md` sections 5.4, 15 |
| Element acceptance tests E-01 to E-25 | `04-elements.md` section 13 |
| Commerce acceptance tests C-01 to C-23, `fake-sa.js` | `05-commerce.md` section 14 |
| Eval suite (tier 11) | `08-agent-kit-and-evals.md` |
| Per-component acceptance tests | `09-components-foundation.md` to `12-components-chrome-and-blueprints.md` |
| Complete text of every blueprint file, including Liquid layouts and templates | `12-components-chrome-and-blueprints.md` (D-099) |
| Live Liquid store questions (SPIKE-02) | `14-liquid-theme.md` |

Vocabulary: "tier n" is item n of D-063. "Fixture", "reference HTML", "mask", "canonical form" have the meanings of `02-html-contract.md`. "Case" means one (component, fixture) pair. "Fixture id" is `<component id>/<fixture name>`.

Evidence marker: code blocks marked **RUN** were executed for this document in `ripple/docs/research/spikes/testing/` (Node 22.23.5, Playwright 1.63.0 Chromium; output in `result.txt`, 22 tests passed). Code blocks marked **NOT RUN** were written for this document and not executed; the tests named next to them are the gate. Status of NOT RUN code (D-113): it is the required starting text of the file; the behaviour tables and the named gate tests are normative; when the printed code fails its gate, the code is changed and the gate is not weakened, and such a change needs no ledger entry.

---

## 1. Tiers

- **T-1** Every automated test belongs to exactly one tier and carries the tier tag at the start of its name (2.4).
- **T-2** A tier passes when every test of the tier passes and none is skipped, except skips this document permits by name (T-5, T-6, T-7).
- **T-3** A skipped test is never reported as passed. CI runs with `--no-skips` wherever a skip is not permitted (17).

| Tier | Name | Tag | Command | Test files | Needs | Engine |
|---|---|---|---|---|---|---|
| 1 | Generation and static | `[T1]` | `pnpm gen --check`, `pnpm typecheck`, `pnpm test:unit` | `src/**/*.test.ts`, `css/**/*.test.ts`, `test/conformance/acceptance-coverage.test.ts` | nothing (no `pkg/`, no browser) | none |
| 2 | Fixture conformance | `[T2]` | `pnpm test:conformance` | `test/conformance/conformance.test.ts`, `test/conformance/hosts.test.ts` | `pnpm build`, `pnpm examples:install` | Chromium for Q-9 only |
| 3 | Upgrade stability | `[T3]` | `pnpm test:upgrade` | `test/upgrade/upgrade.test.ts`, `[T3]` tests in element and component test files | `pnpm build` | Chromium |
| 4 | Hydration and morph | `[T4]` | `pnpm test:hydration` | `test/hydration/react.test.ts`, `test/hydration/remix.test.ts` | `pnpm build`, `pnpm examples:install`; Remix: Node 24.3 or later | Chromium |
| 5 | Behaviour, keyboard, a11y, style | `[T5]` | `pnpm test:behavior` | `components/<id>/<id>.test.ts`, `src/elements/*.test.ts`, `test/commerce/*.test.ts` (emulated), `test/a11y/*.test.ts`, `test/visual/*.test.ts` | `pnpm build` | Chromium |
| 6 | No-JS and scripts blocked | `[T6]` | `pnpm test:nojs` | `test/nojs/*.test.ts`, `[T6]` tests in component test files | `pnpm build`, `pnpm examples:install` | Chromium |
| 7 | Commerce end to end (mock.shop) | `[T7]` | `pnpm test:commerce` | `test/commerce/e2e.test.ts` | network access to `https://mock.shop/api`; `RIPPLE_NETWORK=1` | Chromium |
| 8 | Liquid live | `[T8]` | `pnpm test:liquid-live` | `test/liquid/live.test.ts` | preview store (ledger Q5); `RIPPLE_STORE_URL` | Chromium |
| 9 | Cross-engine | tiers 3, 5, 6 re-run, plus `[T9]` | `pnpm test:webkit`, `pnpm test:firefox` | all `[T3]`, `[T5]`, `[T6]` tests without the `[chromium]` tag; `test/cross-engine/features.test.ts` | Playwright WebKit and Firefox builds | WebKit, Gecko |
| 10 | Size budgets | `[T10]` | `pnpm test:size` | `src/gen/size.test.ts` | `pnpm build` | none |
| 11 | Evals | none | `pnpm eval` | `evals/` (`08-agent-kit-and-evals.md`) | model access | Chromium |

Permitted skips:

- **T-5** Tier 7 tests, and the tier 6 flows on the hydrogen backend (11.2), skip with the reason `RIPPLE_NETWORK is not 1` when the environment variable `RIPPLE_NETWORK` is not `1` (D-063 as amended, item (d)). CI sets it (17).
- **T-6** Tier 8 tests skip with the reason `RIPPLE_STORE_URL is not set` until a preview store exists (D-063 item 8). Until then tiers 2 to 6 on the shim are the gate for Liquid.
- **T-7** Remix cases of tiers 2 and 4 skip with the reason `Remix needs Node 24.3 or later (running <version>)` when the Node version is lower. The main CI job runs Node 24, so no Remix case is skipped there.

Which tiers gate which milestone (D-067):

| Milestone | Tiers that MUST pass on CI for every component of the milestone |
|---|---|
| M1 | 1, 2, 3 (static components trivially), 5 (generic matrix tests), 6, 10 |
| M2 | M1 plus 4 and the component behaviour tests of tier 5 |
| M3 | M2 plus 7; eval tasks T01, T02, T08 (tier 11) |
| M4 | M3 for the components and blueprints of doc 12 |
| M5 | 8 when the store exists; SPIKE-01, 02, 03, 09 reports |
| M6 | 11 (the Sidekick bar) |

Tier 9 is non-blocking until the SPIKE-06 report exists and blocking afterwards (11.3, 17.3).

---

## 2. Runner, scripts and environment

### 2.1 Decisions

- **R-1** The test runner is the Node.js built-in `node:test` module, driven by `test/run.ts`. `vitest`, `jest`, `mocha`, `@playwright/test`, `jsdom` and `happy-dom` MUST NOT be added.
- **R-2** Browser tests use the `playwright` library (already a devDependency, `01-architecture.md` section 9) from Node test files. A test that needs a DOM runs in a real browser; there is no simulated DOM.
- **R-3** Test files are TypeScript (`*.test.ts`), bundled by esbuild before they run, exactly like `pnpm gen`. Test files MUST NOT be `.tsx`; TSX needed by a test is generated into a work directory and bundled there (7.4).
- **R-4** Assertions use `node:assert/strict`. No assertion library is added.
- **R-5** `test/run.ts` runs test files with `run({ files })` from `node:test`, never with the `node --test` command line. Reason (verified): `node --test <file under node_modules/>` prints `Could not find '<file>'`, and the bundles live under `node_modules/.cache/ripple/test/`.

### 2.2 devDependencies added by this document

Add to `devDependencies` of the root `package.json` (`01-architecture.md` 5.1), exact versions:

| Package | Version | Used for |
|---|---|---|
| `axe-core` | `4.14.1` | automated WCAG scan in tier 5 (10.3) |
| `@types/node` | `22.20.5` | types for `node:test`, `node:fs` in `pnpm typecheck` |

These two rows and their versions are D-103 item 3. The same decision pins `lightningcss` `1.33.0` (the measuring minifier, `03-styling-and-tokens.md` 5.4, imported by `src/gen/size.ts`), `rollup` `4.24.0`, `@rollup/plugin-node-resolve` `15.3.0`, `@rollup/plugin-terser` `0.4.4` and `@types/react` `19.3.0`; those rows are in the devDependencies table of `01-architecture.md` section 9 and are not repeated here.

`axe-core`, `@types/node` and `lightningcss` are development-only. They MUST NOT appear in `pkg/package.json`.

### 2.3 Scripts

The `scripts` object of the root `package.json` MUST contain these entries exactly. `gen`, `build` and `typecheck` are those of `01-architecture.md` 5.1 (unchanged); `eval` is owned by `08-agent-kit-and-evals.md`; `release:check` is owned by `07-manifest-registry-cli.md`; `theme:css` is owned by `14-liquid-theme.md` (section 5.3). All others are owned here. The object is byte-equal to the `scripts` object of `01-architecture.md` 5.1.

```json
{
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
  "release:check": "pnpm gen --release-check",
  "theme:css": "tailwindcss -i examples/liquid/config/styles.css -o examples/liquid/assets/styles.min.css --minify"
}
```

pnpm appends extra arguments to the end of a script, so options reach the runner: `pnpm test --grep=dialog`, `pnpm test:component --component=button`, `pnpm test:visual --update`.

Required commands and the order in which a developer or agent runs them:

| # | Command | When |
|---|---|---|
| 1 | `pnpm install --frozen-lockfile` | once per checkout |
| 2 | `pnpm exec playwright install chromium` | once per machine (skip when Chromium for Playwright 1.63.0 is already installed) |
| 3 | `pnpm gen` | after editing a manifest entry, `css/tokens.css`, an icon, or a locale string |
| 4 | `pnpm typecheck` | before every commit |
| 5 | `pnpm gen --check` | before every commit |
| 6 | `pnpm build` | before any tier other than 1; again after any change under `src/`, `css/`, `components/` |
| 7 | `pnpm examples:install` | after every `pnpm build` (the examples depend on `file:../../pkg`, which pnpm copies at install time) |
| 8 | `pnpm test` | before every commit |
| 9 | `pnpm test:component --component=<id>` | while working on one component |
| 10 | `pnpm ci` | equals what the `verify` CI job runs (17.1) |

### 2.4 Test names and tags

- **N-1** Every test name MUST match `^\[T(10|[1-9])\] <subject>: <statement>( \[chromium\])?$`.
  - `<subject>` is a fixture id (`button/default`), a component id (`dialog`), or a source module name without extension (`canonicalize`, `rp-quantity`, `run`).
  - `<statement>` is a sentence fragment saying what holds. When the test implements a numbered acceptance test of a specification, the statement starts with that test's id: `AT-3` for item 3 of a component's "Acceptance tests" section; `E-05`, `C-02`, `A-07`, `Q-10` for the ids of the documents named in section 0.
  - A component acceptance test is named `AT-<n>`; prefixed ids of infrastructure documents and blueprints (`E-05`, `C-02`, `A-07`, `LT-3`, `CR-2`, `CA-4`, `BP-11`) are kept as written. `CA-<n>` names only the common component tests of `09-components-foundation.md`; the `cart` blueprint's tests are `CR-<n>` (D-104 item 1).
- **N-2** The `[chromium]` tag, at the END of the name, marks a test that MUST NOT run in WebKit or Gecko. It is allowed only for: a Chromium-only API (Navigation API, `layout-shift` performance entries), computed-style serialisation snapshots (14), and React client-render equality (Q-9). The line above the test MUST be a comment `// [chromium]: <reason>`.
- **N-3** A test that another document marks for cross-engine (the "X" tests of `04-elements.md` section 13, C-19 of `05-commerce.md`, A-17 of `03-styling-and-tokens.md`) MUST NOT carry `[chromium]`.
- **N-4** Tests are flat `test()` calls. `describe()` and `suite()` MUST NOT be used (the runner filters on the full name of a top-level test).
- **N-5** Examples:

```text
[T2] button/default: liquid output equals the reference HTML
[T3] tabs/default: zero unpermitted mutations at upgrade
[T5] dialog: AT-4 Escape closes and returns focus to the opener
[T5] rp-quantity: Q-2 increment fires valuechange, input, change
[T5] button/default: style snapshot matches [chromium]
[T6] product-form: AT-9 form post adds the line with scripting disabled
```

### 2.5 Rules for writing a test file

- **W-1** A test file MUST NOT start a browser, a server or a child process in `before()`, `beforeEach()` or at module top level. It MUST obtain them lazily inside a test through the helpers of section 5 (`getBrowser()`, `getFixtureServer()`), which start on first use and are closed by one `after()` hook registered by the helper module. Reason (verified): when a name filter excludes every test of a file, a top-level `before()` still runs but `after()` does not, and the run hangs with the browser open.
- **W-2** Each test opens its own browser context with `openPage()` and closes it in a `finally` block. Tests MUST NOT share a page.
- **W-3** A test MUST NOT call `page.waitForTimeout()` or `setTimeout` to wait for a condition. It waits with `page.waitForFunction`, `customElements.whenDefined`, a locator assertion loop, or `settled(page)` (5.2). A fixed delay is allowed only where a specification states a duration (debounce of 250 ms in C-03, hover intent in E-15).
- **W-4** A test MUST fail on unexpected console output: `openPage()` collects `pageerror` and `console.error`; every browser test ends with `assert.deepEqual(errors, [])` unless the test is about an error message.
- **W-5** Tests read files relative to `process.cwd()` (the repository root). They MUST NOT use `import.meta.url` to find repository files (`01-architecture.md` 4.2 rule 4).
- **W-6** A test MUST NOT depend on another test having run. Order of execution is unspecified.
- **W-7** A test selects elements by role, by `id`, by tag, by a hook attribute of ledger 4.4, or by a manifest class. It MUST NOT select by text that is a locale string unless it reads the string from `locales/en.default.json`.
- **W-8** Loops that create tests (one per fixture) run at module top level and only read files; they MUST NOT touch the network or a browser.

### 2.6 `test/run.ts` (complete, RUN)

```ts
// The test runner behind every `pnpm test*` script. Bundles each *.test.ts with esbuild and runs
// the bundles with node:test. Run from the repository root.
import { build } from "esbuild"
import { run } from "node:test"
import { spec } from "node:test/reporters"
import { availableParallelism } from "node:os"
import { existsSync, globSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const DEFAULT_TIERS = "1,2,3,4,5,6,10"
const KNOWN_TIERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
const ENGINES = ["chromium", "webkit", "firefox"]
const OUT = "node_modules/.cache/ripple/test"
const REPORT = "node_modules/.cache/ripple/report/test-report.json"
const TEST_GLOBS = ["src/**/*.test.ts", "css/**/*.test.ts", "components/**/*.test.ts", "blueprints/**/*.test.ts", "test/**/*.test.ts"]

function fail(message: string): never {
  console.error(`test: ${message}`)
  process.exit(2)
}

const args = process.argv.slice(2).filter((arg) => arg !== "--")
const VALUE_OPTIONS = ["tiers", "grep", "files", "engine", "component"]
const FLAG_OPTIONS = ["no-skips", "update", "cross-engine"]
for (const arg of args) {
  const name = arg.replace(/^--/, "").split("=")[0]!
  const known = arg.startsWith("--") && (arg.includes("=") ? VALUE_OPTIONS.includes(name) : FLAG_OPTIONS.includes(name))
  if (!known) fail(`unknown argument ${arg}`)
}
const value = (name: string) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
const flag = (name: string) => args.includes(`--${name}`)

const tiers = (value("tiers") ?? DEFAULT_TIERS).split(",")
for (const tier of tiers) if (!KNOWN_TIERS.includes(tier)) fail(`unknown tier ${tier}; tiers are ${KNOWN_TIERS.join(", ")}`)
const engine = value("engine") ?? process.env.RIPPLE_ENGINE ?? "chromium"
if (!ENGINES.includes(engine)) fail(`unknown engine ${engine}; engines are ${ENGINES.join(", ")}`)
const grep = value("grep")
if (grep !== undefined) {
  try {
    new RegExp(grep)
  } catch {
    fail(`--grep is not a regular expression: ${grep}`)
  }
}
if (tiers.some((tier) => tier !== "1") && !existsSync("pkg/package.json")) fail("pkg/ is missing; run `pnpm build` first")

const component = value("component")
if (component !== undefined && !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(component)) fail(`--component is not a component id: ${component}`)

// One pattern: the tier tag, then optionally no [chromium] tag, the component id as subject, and --grep.
const pattern =
  `^\\[T(?:${tiers.join("|")})\\]` +
  (flag("cross-engine") ? "(?!.*\\[chromium\\])" : "") +
  (component ? ` ${component}[/:]` : "") +
  (grep ? `.*(?:${grep})` : "")

const only = value("files")
const sources = globSync(TEST_GLOBS).sort().filter((file) => only === undefined || file.includes(only))
if (sources.length === 0) fail("no test file matched")

rmSync(OUT, { recursive: true, force: true })
if (existsSync("test/support/in-page.ts")) {
  await build({ entryPoints: ["test/support/in-page.ts"], outfile: `${OUT}/in-page.js`, bundle: true, format: "iife", platform: "browser", target: "es2022", logLevel: "warning" })
}
await build({
  entryPoints: sources,
  outdir: OUT,
  outbase: ".",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  packages: "external",
  sourcemap: "inline",
  outExtension: { ".js": ".mjs" },
  logLevel: "warning",
})
const files = sources.map((file) => resolve(OUT, file.replace(/\.ts$/, ".mjs")))

process.env.RIPPLE_ENGINE = engine
if (flag("update")) process.env.RIPPLE_UPDATE_SNAPSHOTS = "1"

let passed = 0
const failed: string[] = []
const skipped: Array<{ name: string; reason: string }> = []
const started = Date.now()
const stream = run({
  files,
  concurrency: tiers.includes("7") || tiers.includes("8") ? 1 : Math.max(1, Math.min(4, availableParallelism() - 1)),
  testNamePatterns: [pattern],
  timeout: 120_000,
  execArgv: ["--enable-source-maps"],
})
// A test file is itself reported as a test whose name is its path; count only tagged tests.
const tagged = (name: string) => /^\[T\d+\]/.test(name)
stream.on("test:pass", (data) => {
  if (!tagged(data.name)) return
  if (data.skip !== undefined) skipped.push({ name: data.name, reason: typeof data.skip === "string" ? data.skip : "" })
  else passed += 1
})
stream.on("test:fail", (data) => {
  failed.push(data.name)
})
stream.compose(spec).pipe(process.stdout)
stream.on("end", () => {
  mkdirSync("node_modules/.cache/ripple/report", { recursive: true })
  writeFileSync(REPORT, `${JSON.stringify({ tiers, engine, pattern, passed, failed, skipped, durationMs: Date.now() - started }, null, 2)}\n`)
  for (const entry of skipped) console.log(`skipped: ${entry.name}: ${entry.reason}`)
  console.log(`test: tiers ${tiers.join(",")} engine ${engine}: ${passed} passed, ${failed.length} failed, ${skipped.length} skipped`)
  if (failed.length > 0) process.exit(1)
  if (passed === 0 && skipped.length === 0) fail(`no test matched ${pattern}`)
  if (flag("no-skips") && skipped.length > 0) {
    console.error("test: --no-skips was given and tests were skipped")
    process.exit(1)
  }
  process.exit(0)
})
```

Runner behaviour (each line is tested by `test/run.test.ts`, 6.3):

| Invocation | Result |
|---|---|
| no option | tiers `1,2,3,4,5,6,10`, engine `chromium` |
| `--tiers=<list>` | comma-separated tier numbers from `1` to `10`; an unknown number exits 2 |
| `--component=<id>` | only tests whose subject is that component id or one of its fixture ids |
| `--grep=<regex>` | only tests whose name, after the tier tag, contains a match |
| `--files=<substring>` | only test files whose path contains the substring |
| `--engine=<chromium\|webkit\|firefox>` | sets `RIPPLE_ENGINE` for the test processes |
| `--cross-engine` | excludes tests tagged `[chromium]` |
| `--update` | sets `RIPPLE_UPDATE_SNAPSHOTS=1` (14) |
| `--no-skips` | exit 1 when any selected test was skipped |
| unknown argument | prints `test: unknown argument <arg>`, exit 2 |
| `pkg/package.json` missing and a tier other than 1 selected | prints ``test: pkg/ is missing; run `pnpm build` first``, exit 2 |
| no test matched | prints `test: no test matched <pattern>`, exit 2 |

Exit codes: 0 all selected tests passed; 1 at least one failed (or skipped with `--no-skips`); 2 usage or environment error. The last line of output is always `test: tiers <list> engine <engine>: <p> passed, <f> failed, <s> skipped`. The file `node_modules/.cache/ripple/report/test-report.json` is written on every run that reaches the end.

### 2.7 Environment variables

| Variable | Set by | Meaning |
|---|---|---|
| `RIPPLE_ENGINE` | `--engine`, default `chromium` | Playwright browser type used by `getBrowser()` |
| `RIPPLE_UPDATE_SNAPSHOTS` | `--update` | `1`: style snapshots are rewritten instead of compared (14) |
| `RIPPLE_SCREENSHOTS` | developer or CI | `1`: `test/visual/style.test.ts` also writes PNG files (14.4) |
| `RIPPLE_NETWORK` | developer or CI | `1`: tier 7 tests run (T-5) |
| `RIPPLE_STORE_URL` | CI secret | Origin of the preview store including the theme preview query, for tier 8 (13) |
| `RIPPLE_STORE_PASSWORD` | CI secret | Storefront password of the preview store, when it has one (13) |
| `RIPPLE_PKG_NAME` | CI `rename` job | Package name override for the rename test (`01-architecture.md` A-10) |

No other environment variable may change test behaviour.

---

## 3. Files

### 3.1 `test/`

```text
test/
  run.ts                                 # the runner (2.6)
  run.test.ts                            # [T1] runner options (6.3)
  support/
    browser.ts                           # getBrowser, openPage, settled (5.1, 5.2)
    server.ts                            # getFixtureServer, fixturePageUrl (5.3)
    collect.ts                           # in-page collectors: boxes, styles (5.4)
    in-page.ts                           # checkPattern bundle entry (5.5)
    examples.ts                          # startExample (12.1)
    fake-sa.js                           # copy of ripple/docs/research/spikes/commerce/fake-sa.js, byte for byte
    tailwind-entry.css                   # 5.3
    hosts/
      index.ts  html.ts  react.ts  remix.ts  liquid.ts  tsx.ts     # host adapters (7)
  fixtures/
    theme-min/                           # owned by 07-manifest-registry-cli.md (RB-8)
  conformance/
    conformance.test.ts                  # [T2] every case in every host (7.1)
    hosts.test.ts                        # [T2] per-host extras Q-7, Q-9, Q-12, Q-14, Q-19, Q-20, Q-22 (7.5)
    acceptance-coverage.test.ts          # [T1] definition-of-done check (18.2)
  upgrade/
    upgrade.test.ts                      # [T3] every case (8)
    bundles.test.ts                      # [T3] A-07, A-08, A-13 of 01-architecture.md
  hydration/
    react-allow.ts                       # REACT_HYDRATION_ALLOW, owned by 06-bindings.md Q-10
    react.test.ts                        # [T4] Q-10
    remix.test.ts                        # [T4] Q-15
  nojs/
    render.test.ts                       # [T6] every case, scripts disabled and blocked (11.1)
    blueprints.test.ts                   # [T6] flows on the four example projects (11.2)
  commerce/
    liquid.test.ts                       # [T5] C-01 to C-08 (emulated Standard Actions)
    hydrogen.test.ts                     # [T5] C-09 to C-15 against a local stub server
    e2e.test.ts                          # [T7] mock.shop (12)
  liquid/
    shim.test.ts                         # [T1] shim and theme server (4.6)
    live.test.ts                         # [T8] (13)
  a11y/
    axe.test.ts                          # [T5] (10.3)
    keyboard.test.ts                     # [T5] (10.4)
    axe-exceptions.ts                    # (10.3)
  visual/
    style.test.ts                        # [T5] (14)
    snapshots/<component id>/<fixture name>.json
  cross-engine/
    features.test.ts                     # [T9] SPIKE-06 feature probes (11.3)
```

`test/support/`, `test/fixtures/`, `test/a11y/`, `test/visual/` and the two files directly under `test/` are listed in `00-decisions.md` section 5.1.

Files outside `test/` that the loaders of section 4 read: `components/<id>/<id>.json` and `components/<id>/fixtures/<name>.html` (4.1), `blueprints/_sample/<id>.json` and `blueprints/_sample/layout.json` (`12-components-chrome-and-blueprints.md` 2.5; read by `loadBlueprintSample`, 4.1).

Unit and component tests stay next to their source (ledger 4.6): `src/<area>/<name>.test.ts`, `components/<id>/<id>.test.ts`, `blueprints/<id>/<id>.test.ts`.

### 3.2 `src/testing/`

| File | Exports | Section |
|---|---|---|
| `canonicalize.ts` | `canonicalize`, `selectAll`, `parseSelector`, `MASKED`, types | `02-html-contract.md` 12 |
| `fixtures.ts` | `loadComponents`, `loadFixtures`, `loadBlueprintSample`, `rootClasses`, `tokenizeChildren`, `restoreChildren`, `childrenToken`, `resolveProps`, `resolveSample`, `resourceRefs`, `hostHasProp`, types | 4.1 |
| `resources.ts` | `RESOURCES`, `resolveResource`, `liquidProductOf`, `liquidCollection`, `LIQUID_GLOBAL_OF_TYPE`, `ResourceFixture` | 4.2 |
| `upgrade-diff.ts` | `GLOBAL_UPGRADE_ALLOW`, `installUpgradeRecorder`, `upgradeDiff`, `formatUpgradeFailures`, types | 4.3 |
| `liquid-shim.ts` | `createShim`, `SHIM_GLOBALS`, `SHIM_TAGS`, `SHIM_FILTERS`, types | 4.4 |
| `serve-theme.ts` | `serveTheme`, `DEFAULT_THEME_ROUTES`, `NOT_FOUND_ROUTE`, `injectPlatformImports`, `STANDARD_ACTIONS_SERVER_EMULATION`, `PARTIAL_RENDERING_EMULATION`, `STANDARD_EVENTS_EMULATION`, types | 4.5 |
| `index.ts` | re-exports all of the above | 4.7 |

Every file of this table is listed in `00-decisions.md` section 5.1. `<pkg>/testing` exports all of them, including `serveTheme`, which the Liquid eval tier of `08-agent-kit-and-evals.md` imports (D-104 item 4, D-106). Import rules for `src/testing/**` are those of `01-architecture.md` 2.2: `parse5`, `liquidjs`, `node:*`, and `playwright` as a type-only import. A file under `src/testing/` MUST NOT import a value from `playwright`; functions that drive a browser take a `Page` argument.

---

## 4. `src/testing/`

### 4.1 `fixtures.ts` (complete; RUN except `hostHasProp`, `resolveSample` and `loadBlueprintSample`, which are NOT RUN; their gates are `[T1] fixtures: host-scoped props are skipped` and `[T1] fixtures: blueprint samples resolve`, 6.2)

```ts
// Loads components and fixtures from the repository, and prepares fixture inputs for host adapters.
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { MaskRule } from "./canonicalize"
import { resolveResource } from "./resources"
import type { UpgradeAllowEntry } from "./upgrade-diff"

export type Host = "html" | "react" | "remix" | "liquid"
export const HOSTS: Host[] = ["html", "react", "remix", "liquid"]

export type PropValue = string | number | boolean | { $resource: string }
export interface PartInstance {
  part: string
  props?: Record<string, PropValue>
  children?: string
  parts?: PartInstance[]
}
export interface FixtureRecord {
  name: string
  props: Record<string, PropValue>
  children?: string
  parts?: PartInstance[]
  hosts?: Host[]
  mask?: MaskRule[]
  generated: "template" | "upgrade-snapshot" | "hand"
}
/** A manifest prop. `hosts`, when present, lists the hosts that accept the prop; absent means all four. */
export interface PropEntry {
  name: string
  type: string
  hosts?: Host[]
  liquid?: { name: string }
}
/** The manifest keys the test harness reads. The full schema is owned by docs/07-manifest-registry-cli.md. */
export interface ComponentEntry {
  name: string
  title: string
  kind: "static" | "native" | "ui" | "commerce"
  status: "stable" | "beta" | "planned"
  root: { elements: string[]; class: string; requiresId: boolean }
  props: PropEntry[]
  parts?: Array<{ name: string; props?: PropEntry[] }>
  noJs: { level: "full" | "degraded" | "none" }
  a11y: { checkPattern: string | null }
  liquid: { tier: "block" | "parts" | "resource" | "snippet" }
  upgradeAllow?: UpgradeAllowEntry[]
  fixtures: FixtureRecord[]
}
export interface FixtureCase {
  /** "<component id>/<fixture name>" */
  id: string
  component: ComponentEntry
  fixture: FixtureRecord
  /** Content of components/<id>/fixtures/<name>.html. */
  html: string
  /** fixture.hosts, or all four. */
  hosts: Host[]
}

/** Every component with status other than "planned", in ascending order of id. */
export function loadComponents(root = "components"): ComponentEntry[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(root, entry.name, `${entry.name}.json`)))
    .map((entry) => JSON.parse(readFileSync(join(root, entry.name, `${entry.name}.json`), "utf8")) as ComponentEntry)
    .filter((component) => component.status !== "planned")
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
}

/** Every fixture of every loaded component, in manifest order. `only` restricts to one component id. */
export function loadFixtures(options: { root?: string; only?: string } = {}): FixtureCase[] {
  const root = options.root ?? "components"
  const cases: FixtureCase[] = []
  for (const component of loadComponents(root)) {
    if (options.only !== undefined && component.name !== options.only) continue
    for (const fixture of component.fixtures) {
      const file = join(root, component.name, "fixtures", `${fixture.name}.html`)
      if (!existsSync(file)) throw new Error(`${component.name}/${fixture.name}: missing fixture file ${file}`)
      cases.push({ id: `${component.name}/${fixture.name}`, component, fixture, html: readFileSync(file, "utf8"), hosts: fixture.hosts ?? HOSTS })
    }
  }
  return cases
}

/** Every manifest root class, for the upgrade recorder (U-1). */
export function rootClasses(components: ComponentEntry[]): string[] {
  return components.map((component) => component.root.class)
}

// ---- children placeholders (F-7) -------------------------------------------------------------

export const childrenToken = (index: number): string => `__RP_CHILDREN_${index}__`

export interface TokenizedFixture {
  /** A copy of the fixture in which every `children` string is replaced by a token. */
  fixture: FixtureRecord
  /** fragments[i] is the original children string of token i. */
  fragments: string[]
}

/** Replaces every children string (root first, then parts depth-first in order) by a unique token. */
export function tokenizeChildren(fixture: FixtureRecord): TokenizedFixture {
  const fragments: string[] = []
  const take = (children: string | undefined): string | undefined => {
    if (children === undefined) return undefined
    fragments.push(children)
    return childrenToken(fragments.length - 1)
  }
  const walk = (parts: PartInstance[] | undefined): PartInstance[] | undefined =>
    parts?.map((part) => {
      const children = take(part.children)
      const nested = walk(part.parts)
      return { part: part.part, ...(part.props ? { props: part.props } : {}), ...(children !== undefined ? { children } : {}), ...(nested ? { parts: nested } : {}) }
    })
  const children = take(fixture.children)
  const parts = walk(fixture.parts)
  const copy: FixtureRecord = { ...fixture }
  delete copy.children
  delete copy.parts
  if (children !== undefined) copy.children = children
  if (parts) copy.parts = parts
  return { fixture: copy, fragments }
}

/** Puts the original fragments back. Throws unless every token occurs exactly once in `html`. */
export function restoreChildren(html: string, fragments: string[], id: string): string {
  let out = html
  fragments.forEach((fragment, index) => {
    const token = childrenToken(index)
    const count = out.split(token).length - 1
    if (count !== 1) throw new Error(`${id}: children token ${token} occurs ${count} times in the host output (expected 1)`)
    out = out.replace(token, () => fragment)
  })
  return out
}

/** Replaces { "$resource": "<type>.<name>" } values by the resource for one side. */
export function resolveProps(props: Record<string, PropValue> | undefined, side: "hydrogen" | "liquid"): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props ?? {})) {
    out[key] = typeof value === "object" && value !== null ? resolveResource(value.$resource, side) : value
  }
  return out
}

/** False when the manifest prop `name` exists and its `hosts` list excludes `host`. An adapter skips such a prop. */
export function hostHasProp(props: PropEntry[] | undefined, name: string, host: Host): boolean {
  const entry = props?.find((prop) => prop.name === name)
  return !entry?.hosts || entry.hosts.includes(host)
}

/** Deep copy of a JSON value in which every { "$resource": "<type>.<name>" } object is replaced by the resource for one side. */
export function resolveSample(value: unknown, side: "hydrogen" | "liquid"): unknown {
  if (Array.isArray(value)) return value.map((item) => resolveSample(item, side))
  if (typeof value !== "object" || value === null) return value
  const record = value as Record<string, unknown>
  if (typeof record.$resource === "string" && Object.keys(record).length === 1) return resolveResource(record.$resource, side)
  return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, resolveSample(item, side)]))
}

export interface BlueprintSample {
  /** Props of the TSX blueprint component (hydrogen side of every resource). */
  props: Record<string, unknown>
  /** Liquid render scope built from the same resource names (liquid side), merged with the file's "$liquid" object. */
  liquid: Record<string, unknown>
}

/**
 * Reads blueprints/_sample/<id>.json (docs/12-components-chrome-and-blueprints.md 2.5, X-11).
 * Every key other than "$liquid" is a prop of the TSX blueprint; a { "$resource": ... } value anywhere inside is resolved.
 * The Liquid scope has the same keys resolved on the liquid side; the optional top-level "$liquid" object
 * (plain JSON, may contain { "$resource": ... }) is merged over it and never reaches the TSX props.
 */
export function loadBlueprintSample(id: string, root = "blueprints"): BlueprintSample {
  const file = join(root, "_sample", `${id}.json`)
  if (!existsSync(file)) throw new Error(`${id}: missing blueprint sample ${file}`)
  const { $liquid, ...rest } = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>
  return {
    props: resolveSample(rest, "hydrogen") as Record<string, unknown>,
    liquid: { ...(resolveSample(rest, "liquid") as Record<string, unknown>), ...((resolveSample($liquid ?? {}, "liquid") as Record<string, unknown>)) },
  }
}

/** Every resource reference used by a fixture (root props and part props), without duplicates. */
export function resourceRefs(fixture: FixtureRecord): string[] {
  const found = new Set<string>()
  const scan = (props: Record<string, PropValue> | undefined) => {
    for (const value of Object.values(props ?? {})) if (typeof value === "object" && value !== null) found.add(value.$resource)
  }
  const walk = (parts: PartInstance[] | undefined) => {
    for (const part of parts ?? []) {
      scan(part.props)
      walk(part.parts)
    }
  }
  scan(fixture.props)
  walk(fixture.parts)
  return [...found]
}
```

Rules:

- **FX-1** `loadFixtures()` is the only way a test obtains cases. A test MUST NOT list component ids or fixture names by hand, except a component's own test file, which names its own fixtures.
- **FX-2** Components with `status: "planned"` are not loaded and therefore not tested.
- **FX-4** A host adapter MUST skip a fixture prop for which `hostHasProp(props, name, host)` is false. This is how one fixture record serves a component whose resource prop exists on TSX hosts only (for example a prop that Liquid reads from a global instead).
- **FX-5** `loadBlueprintSample(id)` is the only way a test obtains blueprint sample data. `layout` is a valid id (`blueprints/_sample/layout.json`). The TSX props and the Liquid scope are built from the same resource names, so both hosts print the same data (X-11 of doc 12).
- **FX-3** `ComponentEntry` lists only the manifest keys the harness reads. When `07-manifest-registry-cli.md` names a key differently, that document wins and this interface is changed to match; no other code in this document depends on further keys.

### 4.2 `resources.ts`: resource fixtures (complete)

Evidence: the module below was bundled with esbuild 0.25.0 and loaded under Node 22.23.5 for this document; `resolveResource` was called for every name on both sides without an error. The tests `[T1] resources: ...` (6.2) are NOT RUN in this form and are the gate.

A fixture references commerce data only as `{ "$resource": "<type>.<name>" }` (`02-html-contract.md` F-4, D-074 item 6). The set is exactly `image.basic`, `image.no-alt`, the resources of `11-components-commerce.md` section 0.5 and the resources of `12-components-chrome-and-blueprints.md` section 1.6. Values are those documents' values; where this table and an owning document differ, the owning document wins and this module is changed.

| Reference | What it is | Values owned by |
|---|---|---|
| `image.basic` | 1600 by 2000 image with alt text `Linen shirt on a hanger` | `09-components-foundation.md` |
| `image.no-alt` | the same image with no alt text | `09-components-foundation.md` |
| `product.basic` | "Linen Shirt", 48.00 USD, available, one variant (id 11), two media | doc 11 section 0.5 |
| `product.sale` | "Wool Socks", 12.00 USD, compare-at 16.00 USD, one variant (id 21) | doc 11 section 0.5 |
| `product.sold-out` | "Canvas Tote", not available, no featured image, one variant (id 31) | doc 11 section 0.5 |
| `product.options` | `product.basic` with options Color (Blue, Sand) and Size (S, M, L); variants 11 (Blue / S, selected), 12 (Blue / M), 13 (Sand / S, not available) | doc 11 section 0.5 |
| `collection.basic` | "Summer", handle `summer` | doc 11 section 0.5 |
| `article.basic` | "How to wash linen" | doc 11 section 0.5 |
| `line.basic` | 2 of variant 11 of `product.options`, total 96.00 USD | doc 11 section 0.5 |
| `cart.two-lines` | `line.basic` and 1 of "Wool Socks"; total quantity 3; total 108.00 USD | doc 11 section 0.5 |
| `cart.empty` | no lines | doc 11 section 0.5 |
| `cart.discounted` | `cart.two-lines` with code `SAVE10` applied; discount 10.80; total 97.20 USD | doc 11 section 0.5 |
| `filters.basic` | filters, sort options and form action of `/collections/summer?filter.v.availability=1&filter.v.price.lte=50` | doc 11 section 0.5 |
| `search.shirt` | terms `shirt`, 2 results (`product.basic`, `product.sale`) | doc 11 section 0.5 |
| `menu.main`, `menu.deep`, `menu.footer`, `menu.empty` | menus | doc 12 section 1.6 |
| `shop.basic`, `shop.logo` | shop name `Mock Shop`, without and with a logo | doc 12 section 1.6 |
| `locale.multi` | two countries, two languages | doc 12 section 1.6 |

There are no `money.*`, `variant.*` or `media.*` resources: a money, variant or media value is always reached through a product, line or cart.

```ts
// Resource fixtures: the only commerce and chrome data a fixture may reference
// ({ "$resource": "<type>.<name>" }, D-074 item 6).
// `hydrogen` is the value TSX hosts and the html reference receive (shapes: docs/05-commerce.md 11.1).
// `liquid` is the drop-like object bound in the Liquid render scope.
// Values: image.* from docs/09-components-foundation.md (Image); product, collection, article, line,
// cart, filters, search from docs/11-components-commerce.md 0.5; menu, shop, locale from
// docs/12-components-chrome-and-blueprints.md 1.6.
export interface ResourceFixture {
  hydrogen: unknown
  liquid: unknown
}

const usd = (amount: string) => ({ amount, currencyCode: "USD" })
const toCents = (amount: string): number => Math.round(Number(amount) * 100)

interface Img {
  hydrogen: { url: string; altText: string | null; width: number; height: number }
  liquid: { src: string; alt: string | null; width: number; height: number }
}
/** The Liquid stand-in has the protocol-relative URL with a version query, as an image drop prints it. */
function img(url: string, alt: string | null, width: number, height: number): Img {
  return {
    hydrogen: { url, altText: alt, width, height },
    liquid: { src: `${url.replace(/^https:/, "")}?v=1700000000`, alt, width, height },
  }
}

const FILES = "https://cdn.shopify.com/s/files/1/0001"
const imageBasic = img("https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg", "Linen shirt on a hanger", 1600, 2000)
const imageNoAlt = img("https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg", null, 1600, 2000)
const shirtFront = img(`${FILES}/linen-shirt.jpg`, "Linen shirt on a hanger", 1200, 1200)
const shirtBack = img(`${FILES}/linen-shirt-back.jpg`, "Back of the linen shirt", 1200, 1200)
const socks = img(`${FILES}/wool-socks.jpg`, "Grey wool socks", 1200, 1200)
const summer = img(`${FILES}/summer.jpg`, "Beach at noon", 1600, 1200)
const wash = img(`${FILES}/wash.jpg`, "Linen in a basin", 1500, 1000)

// ---- products --------------------------------------------------------------------------------

interface VariantDef {
  id: number
  title: string
  available: boolean
  /** [option name, value] pairs in option order. */
  options: Array<[string, string]>
}
interface ProductDef {
  id: number
  title: string
  handle: string
  price: string
  compareAt: string | null
  /** [media id, image] pairs; the first is the featured image. Empty: the product has no image. */
  media: Array<[number, Img]>
  options: Array<{ name: string; values: Array<{ name: string; swatch: string | null }> }>
  variants: VariantDef[]
  /** Id of the variant that is selected when the URL names none. */
  selected: number
}

const DEFAULT_OPTION = [{ name: "Title", values: [{ name: "Default Title", swatch: null }] }]
const defaultVariant = (id: number, available: boolean): VariantDef => ({ id, title: "Default Title", available, options: [["Title", "Default Title"]] })

const PRODUCT_DEFS: Record<string, ProductDef> = {
  "product.basic": {
    id: 1, title: "Linen Shirt", handle: "linen-shirt", price: "48.00", compareAt: null,
    media: [[101, shirtFront], [102, shirtBack]],
    options: DEFAULT_OPTION, variants: [defaultVariant(11, true)], selected: 11,
  },
  "product.sale": {
    id: 2, title: "Wool Socks", handle: "wool-socks", price: "12.00", compareAt: "16.00",
    media: [[201, socks]],
    options: DEFAULT_OPTION, variants: [defaultVariant(21, true)], selected: 21,
  },
  "product.sold-out": {
    id: 3, title: "Canvas Tote", handle: "canvas-tote", price: "48.00", compareAt: null,
    media: [],
    options: DEFAULT_OPTION, variants: [defaultVariant(31, false)], selected: 31,
  },
  "product.options": {
    id: 1, title: "Linen Shirt", handle: "linen-shirt", price: "48.00", compareAt: null,
    media: [[101, shirtFront], [102, shirtBack]],
    options: [
      { name: "Color", values: [{ name: "Blue", swatch: "#1d4ed8" }, { name: "Sand", swatch: "#d6c7a1" }] },
      { name: "Size", values: [{ name: "S", swatch: null }, { name: "M", swatch: null }, { name: "L", swatch: null }] },
    ],
    variants: [
      { id: 11, title: "Blue / S", available: true, options: [["Color", "Blue"], ["Size", "S"]] },
      { id: 12, title: "Blue / M", available: true, options: [["Color", "Blue"], ["Size", "M"]] },
      { id: 13, title: "Sand / S", available: false, options: [["Color", "Sand"], ["Size", "S"]] },
    ],
    selected: 11,
  },
}

const pick = (def: ProductDef, variantId?: number): VariantDef =>
  def.variants.find((v) => v.id === variantId) ?? def.variants.find((v) => v.id === def.selected)!
const differsByOne = (a: VariantDef, b: VariantDef): boolean => a.options.filter(([, value], index) => b.options[index]![1] !== value).length === 1

function hydrogenVariant(def: ProductDef, v: VariantDef) {
  return {
    id: `gid://shopify/ProductVariant/${v.id}`,
    title: v.title,
    availableForSale: v.available,
    price: usd(def.price),
    compareAtPrice: def.compareAt === null ? null : usd(def.compareAt),
    image: def.media[0]?.[1].hydrogen ?? null,
    selectedOptions: v.options.map(([name, value]) => ({ name, value })),
  }
}
function hydrogenProduct(def: ProductDef, variantId?: number) {
  const selected = pick(def, variantId)
  return {
    id: `gid://shopify/Product/${def.id}`,
    title: def.title,
    handle: def.handle,
    url: `/products/${def.handle}`,
    vendor: "Acme",
    availableForSale: def.variants.some((v) => v.available),
    featuredImage: def.media[0]?.[1].hydrogen ?? null,
    price: usd(def.price),
    compareAtPrice: def.compareAt === null ? null : usd(def.compareAt),
    selectedOrFirstAvailableVariant: hydrogenVariant(def, selected),
    adjacentVariants: def.variants.filter((v) => differsByOne(v, selected)).map((v) => hydrogenVariant(def, v)),
    options: def.options.map((option) => ({
      name: option.name,
      optionValues: option.values.map((value) => ({ name: value.name, swatch: value.swatch === null ? null : { color: value.swatch, image: null } })),
    })),
    media: def.media.map(([id, image]) => ({ id: `gid://shopify/MediaImage/${id}`, image: image.hydrogen })),
  }
}

function liquidVariant(def: ProductDef, v: VariantDef) {
  return {
    id: v.id,
    title: v.title,
    available: v.available,
    price: toCents(def.price),
    compare_at_price: def.compareAt === null ? null : toCents(def.compareAt),
    image: def.media[0]?.[1].liquid ?? null,
    url: `/products/${def.handle}?variant=${v.id}`,
  }
}
function liquidProduct(def: ProductDef, variantId?: number) {
  const selected = pick(def, variantId)
  return {
    id: def.id,
    title: def.title,
    handle: def.handle,
    url: `/products/${def.handle}`,
    vendor: "Acme",
    description: `<p>${def.title}.</p>`,
    available: def.variants.some((v) => v.available),
    featured_image: def.media[0]?.[1].liquid ?? null,
    price: toCents(def.price),
    compare_at_price: def.compareAt === null ? null : toCents(def.compareAt),
    has_only_default_variant: def.options === DEFAULT_OPTION,
    selected_or_first_available_variant: liquidVariant(def, selected),
    variants: def.variants.map((v) => liquidVariant(def, v)),
    options_with_values: def.options.map((option, position) => ({
      name: option.name,
      position: position + 1,
      selected_value: selected.options[position]![1],
      values: option.values.map((value) => {
        // The variant reached by choosing this value while keeping the other selected options.
        const target = def.variants.find((v) => v.options.every(([, have], index) => have === (index === position ? value.name : selected.options[index]![1])))
        return {
          name: value.name,
          selected: selected.options[position]![1] === value.name,
          available: target?.available ?? false,
          variant: target ? { id: target.id, url: `/products/${def.handle}?variant=${target.id}`, available: target.available } : null,
          swatch: value.swatch === null ? null : { color: value.swatch, image: null },
          product_url: null,
        }
      }),
    })),
    media: def.media.map(([id, image]) => ({ id, media_type: "image", alt: image.liquid.alt, preview_image: image.liquid })),
  }
}

/** The Liquid product drop stand-in of a product resource with `variantId` selected (default: the resource's selected variant). Used by serve-theme.ts. */
export function liquidProductOf(reference: string, variantId?: number): any {
  const def = PRODUCT_DEFS[reference]
  if (!def) throw new Error(`"${reference}" is not a product resource`)
  return liquidProduct(def, variantId)
}

const productResource = (reference: string): ResourceFixture => ({
  hydrogen: hydrogenProduct(PRODUCT_DEFS[reference]!),
  liquid: liquidProduct(PRODUCT_DEFS[reference]!),
})

// ---- cart ------------------------------------------------------------------------------------

interface LineDef {
  n: number
  key: string
  product: string
  variant: number
  quantity: number
}
const LINE_BASIC: LineDef = { n: 1, key: "11:abc", product: "product.options", variant: 11, quantity: 2 }
const LINE_SALE: LineDef = { n: 2, key: "21:def", product: "product.sale", variant: 21, quantity: 1 }

function line(l: LineDef): { hydrogen: any; liquid: any } {
  const def = PRODUCT_DEFS[l.product]!
  const v = pick(def, l.variant)
  const image = def.media[0]?.[1] ?? null
  const total = toCents(def.price) * l.quantity
  const original = toCents(def.compareAt ?? def.price) * l.quantity
  const hasOptions = def.options !== DEFAULT_OPTION
  const money = (cents: number) => usd((cents / 100).toFixed(2))
  return {
    hydrogen: {
      id: `gid://shopify/CartLine/${l.n}?cart=c1`,
      quantity: l.quantity,
      title: def.title,
      variantTitle: hasOptions ? v.title : "",
      url: `/products/${def.handle}?variant=${v.id}`,
      image: image?.hydrogen ?? null,
      totalPrice: money(total),
      compareAtTotalPrice: original > total ? money(original) : null,
      attributes: [],
    },
    liquid: {
      key: l.key,
      quantity: l.quantity,
      product: { title: def.title, has_only_default_variant: !hasOptions, url: `/products/${def.handle}` },
      variant: { id: v.id, title: v.title },
      url: `/products/${def.handle}?variant=${v.id}`,
      url_to_remove: `/cart/change?id=${l.key}&quantity=0`,
      image: image?.liquid ?? null,
      final_line_price: total,
      original_line_price: original,
      properties: {},
    },
  }
}

function cart(lines: LineDef[], discount: { code: string; cents: number } | null): ResourceFixture {
  const built = lines.map(line)
  const subtotal = built.reduce((sum, l) => sum + l.liquid.final_line_price, 0)
  const total = subtotal - (discount?.cents ?? 0)
  const count = built.reduce((sum, l) => sum + l.liquid.quantity, 0)
  const money = (cents: number) => usd((cents / 100).toFixed(2))
  return {
    hydrogen: {
      id: lines.length ? "gid://shopify/Cart/c1" : null,
      totalQuantity: count,
      checkoutUrl: "/checkout",
      note: "",
      subtotal: money(subtotal),
      total: money(total),
      discountCodes: discount ? [{ code: discount.code, applicable: true }] : [],
      lines: built.map((l) => l.hydrogen),
    },
    liquid: {
      item_count: count,
      note: null,
      items: built.map((l) => l.liquid),
      items_subtotal_price: subtotal,
      total_price: total,
      cart_level_discount_applications: discount ? [{ title: discount.code, type: "discount_code", total_allocated_amount: discount.cents }] : [],
    },
  }
}

// ---- collection, filters, search, article ----------------------------------------------------

const collectionHydrogen = { id: "gid://shopify/Collection/1", title: "Summer", handle: "summer", url: "/collections/summer", image: summer.hydrogen }
/** Products a listing shows. product.basic is not listed: it shares its handle with product.options. */
const LISTED = ["product.options", "product.sale", "product.sold-out"]
const SORT_OPTIONS = [
  { value: "manual", name: "Featured" },
  { value: "price-ascending", name: "Price, low to high" },
]

/** The Liquid collection drop stand-in. `filters` state: availability "1", "0" or null; price bounds in currency units or null. Used by serve-theme.ts. */
export function liquidCollection(state: { availability?: string | null; priceGte?: string | null; priceLte?: string | null; sortBy?: string | null } = {}): any {
  const base = "/collections/summer"
  const params: Array<[string, string]> = []
  if (state.availability) params.push(["filter.v.availability", state.availability])
  if (state.priceGte) params.push(["filter.v.price.gte", state.priceGte])
  if (state.priceLte) params.push(["filter.v.price.lte", state.priceLte])
  const withParams = (list: Array<[string, string]>) => (list.length === 0 ? base : `${base}?${list.map(([name, value]) => `${name}=${value}`).join("&")}`)
  const without = (drop: (name: string) => boolean) => withParams(params.filter(([name]) => !drop(name)))
  const availabilityValues = [
    { label: "In stock", value: "1", count: 8 },
    { label: "Out of stock", value: "0", count: 2 },
  ].map((entry) => ({
    ...entry,
    active: state.availability === entry.value,
    param_name: "filter.v.availability",
    swatch: null,
    url_to_add: withParams([...params.filter(([name]) => name !== "filter.v.availability"), ["filter.v.availability", entry.value]]),
    url_to_remove: without((name) => name === "filter.v.availability"),
  }))
  let products = LISTED.map((reference) => liquidProductOf(reference))
  if (state.availability === "1") products = products.filter((p) => p.available)
  if (state.availability === "0") products = products.filter((p) => !p.available)
  if (state.priceGte) products = products.filter((p) => p.price >= toCents(state.priceGte!))
  if (state.priceLte) products = products.filter((p) => p.price <= toCents(state.priceLte!))
  if (state.sortBy === "price-ascending") products = [...products].sort((a, b) => a.price - b.price)
  return {
    id: 1,
    title: "Summer",
    handle: "summer",
    url: base,
    description: "",
    image: summer.liquid,
    products,
    products_count: products.length,
    all_products_count: LISTED.length,
    sort_options: SORT_OPTIONS,
    sort_by: state.sortBy ?? "manual",
    default_sort_by: "manual",
    filters: [
      {
        label: "Availability",
        type: "list",
        param_name: "filter.v.availability",
        presentation: "text",
        values: availabilityValues,
        active_values: availabilityValues.filter((value) => value.active),
        url_to_remove: without((name) => name === "filter.v.availability"),
        min_value: null,
        max_value: null,
        range_max: null,
      },
      {
        label: "Price",
        type: "price_range",
        param_name: "filter.v.price",
        presentation: "text",
        values: [],
        active_values: [],
        url_to_remove: without((name) => name.startsWith("filter.v.price")),
        min_value: { param_name: "filter.v.price.gte", value: state.priceGte ? toCents(state.priceGte) : null },
        max_value: { param_name: "filter.v.price.lte", value: state.priceLte ? toCents(state.priceLte) : null },
        range_max: null,
      },
    ],
  }
}

const filtersHydrogen = {
  action: "/collections/summer",
  url: "/collections/summer?filter.v.availability=1&filter.v.price.lte=50",
  sortBy: "manual",
  sortOptions: [
    { value: "manual", label: "Featured" },
    { value: "price-ascending", label: "Price, low to high" },
  ],
  filters: [
    {
      label: "Availability",
      type: "list",
      values: [
        { label: "In stock", name: "filter.v.availability", value: "1", count: 8, active: true, swatch: null },
        { label: "Out of stock", name: "filter.v.availability", value: "0", count: 2, active: false, swatch: null },
      ],
      price: null,
      removeUrl: "/collections/summer?filter.v.price.lte=50",
    },
    {
      label: "Price",
      type: "price_range",
      values: [],
      price: { minName: "filter.v.price.gte", maxName: "filter.v.price.lte", min: "", max: "50", rangeMax: "" },
      removeUrl: "/collections/summer?filter.v.availability=1",
    },
  ],
}

// ---- menus, shop, locale ---------------------------------------------------------------------

interface MenuItem {
  id: string
  title: string
  url: string | null
  current: boolean
  items: MenuItem[]
}
const item = (n: number, title: string, url: string | null, current = false, items: MenuItem[] = []): MenuItem => ({ id: `gid://shopify/MenuItem/${n}`, title, url, current, items })
/** A linklist drop stand-in. A link without a URL has url "#", as on Shopify (rule MN-1 of doc 12). */
const links = (items: MenuItem[]): any[] => items.map((entry) => ({ title: entry.title, url: entry.url ?? "#", current: entry.current, links: links(entry.items) }))
function menu(id: string, items: MenuItem[]): ResourceFixture {
  return { hydrogen: { id, items }, liquid: { links: links(items) } }
}

const LOGO = img("https://cdn.shopify.com/s/files/1/0000/0001/files/logo.png", null, 400, 100)

// ---- the set ---------------------------------------------------------------------------------

export const RESOURCES: Record<string, ResourceFixture> = {
  "image.basic": imageBasic,
  "image.no-alt": imageNoAlt,
  "product.basic": productResource("product.basic"),
  "product.sale": productResource("product.sale"),
  "product.sold-out": productResource("product.sold-out"),
  "product.options": productResource("product.options"),
  "collection.basic": { hydrogen: collectionHydrogen, liquid: liquidCollection() },
  "article.basic": {
    hydrogen: {
      id: "gid://shopify/Article/1",
      title: "How to wash linen",
      url: "/blogs/news/how-to-wash-linen",
      excerpt: "Cold water and patience.",
      publishedAt: "2026-06-01T09:00:00Z",
      image: wash.hydrogen,
    },
    liquid: {
      id: 1,
      title: "How to wash linen",
      url: "/blogs/news/how-to-wash-linen",
      excerpt: "Cold water and patience.",
      published_at: "2026-06-01T09:00:00Z",
      image: wash.liquid,
      author: "Mock Shop",
      content: "<p>Cold water and patience.</p>",
    },
  },
  "line.basic": line(LINE_BASIC),
  "cart.two-lines": cart([LINE_BASIC, LINE_SALE], null),
  "cart.empty": cart([], null),
  "cart.discounted": cart([LINE_BASIC, LINE_SALE], { code: "SAVE10", cents: 1080 }),
  "filters.basic": {
    hydrogen: filtersHydrogen,
    liquid: liquidCollection({ availability: "1", priceLte: "50" }),
  },
  "search.shirt": {
    hydrogen: { terms: "shirt", total: 2, products: [hydrogenProduct(PRODUCT_DEFS["product.basic"]!), hydrogenProduct(PRODUCT_DEFS["product.sale"]!)] },
    liquid: {
      terms: "shirt",
      performed: true,
      results_count: 2,
      results: [
        { ...liquidProductOf("product.basic"), object_type: "product" },
        { ...liquidProductOf("product.sale"), object_type: "product" },
      ],
    },
  },
  "menu.main": menu("gid://shopify/Menu/1", [
    item(1, "Shop", "/collections/all", true, [item(11, "Shirts", "/collections/shirts"), item(12, "Socks", "/collections/socks")]),
    item(2, "About", "/pages/about"),
  ]),
  "menu.deep": menu("gid://shopify/Menu/2", [
    item(3, "Clothing", null, false, [item(31, "Tops", "/collections/tops", false, [item(311, "Shirts", "/collections/shirts", true)])]),
  ]),
  "menu.footer": menu("gid://shopify/Menu/3", [item(4, "Search", "/search"), item(5, "Contact", "/pages/contact")]),
  "menu.empty": menu("empty", []),
  "shop.basic": {
    hydrogen: { name: "Mock Shop", url: "/", logo: null },
    liquid: { name: "Mock Shop", brand: { logo: null } },
  },
  "shop.logo": {
    hydrogen: { name: "Mock Shop", url: "/", logo: LOGO.hydrogen },
    liquid: { name: "Mock Shop", brand: { logo: LOGO.liquid } },
  },
  "locale.multi": {
    hydrogen: {
      countries: [
        { code: "CA", name: "Canada", currency: "CAD $", current: true },
        { code: "US", name: "United States", currency: "USD $", current: false },
      ],
      languages: [
        { code: "EN", name: "English", current: true },
        { code: "FR", name: "français", current: false },
      ],
    },
    liquid: {
      country: { iso_code: "CA", name: "Canada", currency: { iso_code: "CAD", symbol: "$" } },
      language: { iso_code: "en", endonym_name: "English" },
      available_countries: [
        { iso_code: "CA", name: "Canada", currency: { iso_code: "CAD", symbol: "$" } },
        { iso_code: "US", name: "United States", currency: { iso_code: "USD", symbol: "$" } },
      ],
      available_languages: [
        { iso_code: "en", endonym_name: "English" },
        { iso_code: "fr", endonym_name: "français" },
      ],
    },
  },
}

/** Liquid global that a resource of this type ALSO provides in a Liquid render scope (RS-3). */
export const LIQUID_GLOBAL_OF_TYPE: Record<string, string> = {
  cart: "cart",
  shop: "shop",
  locale: "localization",
  search: "search",
}

export function resolveResource(reference: string, side: "hydrogen" | "liquid"): unknown {
  const entry = RESOURCES[reference]
  if (!entry) throw new Error(`unknown resource fixture "${reference}"; known: ${Object.keys(RESOURCES).join(", ")}`)
  return structuredClone(entry[side])
}
```

Rules:

- **RS-1** The `hydrogen` side has exactly the shapes of `05-commerce.md` 11.1 for product, collection, article, line and cart resources, the prop types of `11-components-commerce.md` for `filters.basic` and `search.shirt`, and the JSON of `12-components-chrome-and-blueprints.md` 1.6 for `menu.*`, `shop.*` and `locale.multi`. The `liquid` side has the fields named in the "Liquid" column of the `05-commerce.md` 11.1 table plus the drop members the component snippets read. A component that reads another field MUST add the field to the resource here in the same change; it MUST NOT inline data in a fixture.
- **RS-2** A new resource is added by its owning component document first (doc 11 section 0.5 or doc 12 section 1.6), then by one entry in `RESOURCES` and one row in the table above, in the same change. Resource names are kebab-case.
- **RS-3** How each host receives a resource: `html`: the fixture file is written by hand from the `hydrogen` side (`02-html-contract.md` F-9). `react`, `remix`: the adapter passes `resolveResource(ref, "hydrogen")` as the prop value. `liquid`: the adapter binds `resolveResource(ref, "liquid")` to the Liquid variable `rp_<reference with "." and "-" replaced by "_">` (`product.basic` becomes `rp_product_basic`) and passes that variable as the argument. In addition, for a resource whose type is a key of `LIQUID_GLOBAL_OF_TYPE` (`cart`, `shop`, `locale`, `search`), the adapter sets the Liquid global named there (`cart`, `shop`, `localization`, `search`) to the same value for that render, because Liquid components of those types read the global. `filters.basic` on the liquid side is a collection drop stand-in (`filters`, `sort_options`, `sort_by`, `url`).
- **RS-4** `pnpm gen --check` MUST fail when a fixture references a name that is not a key of `RESOURCES` (the check calls `resolveResource`).
- **RS-5** Resource values are fixed. Changing a value is a change to every fixture that prints it and needs the fixtures regenerated in the same change.

### 4.3 `upgrade-diff.ts` (complete, RUN)

```ts
// Tier 3: upgrade stability (docs/02-html-contract.md section 7). Node side takes a Playwright Page;
// this file imports Playwright types only.
import type { Page } from "playwright"

export interface UpgradeAllowEntry {
  select: string
  attrs?: string[]
  childList?: boolean
  text?: boolean
  subtree?: boolean
  reason: string
}

export const GLOBAL_UPGRADE_ALLOW: UpgradeAllowEntry[] = [
  {
    select: "a[data-rp-open]",
    attrs: ["aria-haspopup", "aria-controls"],
    reason: "The runtime adds them when the target dialog is inside a defined rp-dialog (D-009); the link may be a Link, Button or IconButton.",
  },
]

export interface UpgradeRecord {
  type: "attributes" | "characterData" | "childList"
  /** Canonical path of the judged element E, for example "main > ui-tabs#t > ui-tabs-list:nth-child(1)". */
  path: string
  /** Tag name or root class of the nearest component root that contains E. */
  root: string
  attributeName: string | null
  oldValue: string | null
  newValue: string | null
  /** True when the record changed nothing (attribute or text written with the value it already had). */
  sameValue: boolean
  /** True when an allow-list entry permits the record. */
  permitted: boolean
}

export interface RecorderConfig {
  allow: UpgradeAllowEntry[]
  /** Every manifest root class (root.class of every component). */
  rootClasses: string[]
}

/** Runs IN THE PAGE before any page script (page.addInitScript). It MUST stay self-contained:
 *  no imports and no references to anything outside its own body. */
export function installUpgradeRecorder(config: RecorderConfig): void {
  const w = window as unknown as { __rpUpgradeRecords?: UpgradeRecord[] }
  if (w.__rpUpgradeRecords) return
  const records: UpgradeRecord[] = (w.__rpUpgradeRecords = [])
  const rootClasses = new Set(config.rootClasses)
  const isRoot = (el: Element): string | null => {
    if (el.localName.startsWith("ui-") || el.localName.startsWith("rp-")) return el.localName
    for (const name of Array.from(el.classList)) if (rootClasses.has(name)) return name
    return null
  }
  const rootOf = (el: Element | null): string | null => {
    for (let node = el; node; node = node.parentElement) {
      const found = isRoot(node)
      if (found) return found
    }
    return null
  }
  const pathOf = (el: Element): string => {
    const parts: string[] = []
    for (let node: Element | null = el; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
      const index = node.parentElement ? Array.prototype.indexOf.call(node.parentElement.children, node) + 1 : 1
      parts.unshift(node.id ? `${node.localName}#${node.id}` : `${node.localName}:nth-child(${index})`)
    }
    return parts.join(" > ")
  }
  const applying = (el: Element) =>
    config.allow.filter((entry) => el.matches(entry.select) || (entry.subtree === true && el.closest(entry.select) !== null))
  const onlyText = (list: NodeList) => Array.prototype.every.call(list, (node: Node) => node.nodeType === 3)
  const observe = () => {
    new MutationObserver((list) => {
      for (const r of list) {
        const el = r.target.nodeType === 1 ? (r.target as Element) : r.target.parentElement
        if (!el) continue
        const root = rootOf(el)
        if (root === null) continue // U-3: mutations outside component roots are not covered
        const entries = applying(el)
        let permitted = false
        let sameValue = false
        let newValue: string | null = null
        if (r.type === "attributes") {
          newValue = el.getAttribute(r.attributeName as string)
          sameValue = newValue === r.oldValue
          permitted = entries.some((entry) => (entry.attrs ?? []).includes(r.attributeName as string))
        } else if (r.type === "characterData") {
          newValue = r.target.nodeValue
          sameValue = newValue === r.oldValue
          permitted = entries.some((entry) => entry.text === true)
        } else {
          const text = onlyText(r.addedNodes) && onlyText(r.removedNodes)
          permitted = entries.some((entry) => (text ? entry.text === true : entry.childList === true))
        }
        records.push({ type: r.type, path: pathOf(el), root, attributeName: r.attributeName, oldValue: r.oldValue, newValue, sameValue, permitted })
      }
    }).observe(document, { subtree: true, attributes: true, attributeOldValue: true, childList: true, characterData: true, characterDataOldValue: true })
  }
  // Start when the parser has finished (so parser insertions are not recorded) and before
  // deferred and module scripts run: readystatechange to "interactive" fires before both.
  document.addEventListener("readystatechange", () => {
    if (document.readyState === "interactive") observe()
  })
}

export interface UpgradeDiffOptions {
  url: string
  /** Component allow-list entries (manifest upgradeAllow). GLOBAL_UPGRADE_ALLOW is always added. */
  allow?: UpgradeAllowEntry[]
  rootClasses: string[]
  /** Upper bound for customElements.whenDefined of each tag. Default 2000 ms. */
  timeoutMs?: number
}

export interface UpgradeReport {
  /** Value-changing records that no entry permits. Tier 3 passes when this is empty. */
  failures: UpgradeRecord[]
  /** Records that wrote the value already present. Reported, never a failure. */
  sameValue: UpgradeRecord[]
  /** Records permitted by an allow-list entry. */
  permitted: UpgradeRecord[]
  /** ui-* and rp-* tags in the document that were still undefined after timeoutMs. */
  undefinedTags: string[]
}

/** Loads `url` in `page` with the recorder installed and returns the judged records. The page MUST be new. */
export async function upgradeDiff(page: Page, options: UpgradeDiffOptions): Promise<UpgradeReport> {
  const allow = [...GLOBAL_UPGRADE_ALLOW, ...(options.allow ?? [])]
  await page.addInitScript(installUpgradeRecorder, { allow, rootClasses: options.rootClasses })
  await page.goto(options.url, { waitUntil: "load" })
  const undefinedTags = await page.evaluate(async (timeoutMs) => {
    const tags = new Set<string>()
    for (const el of Array.from(document.querySelectorAll("*"))) {
      if (el.localName.startsWith("ui-") || el.localName.startsWith("rp-")) tags.add(el.localName)
    }
    const late: string[] = []
    await Promise.all(
      Array.from(tags).map((tag) =>
        Promise.race([
          customElements.whenDefined(tag),
          new Promise((resolve) => setTimeout(() => { late.push(tag); resolve(null) }, timeoutMs)),
        ]),
      ),
    )
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))))
    return late.sort()
  }, options.timeoutMs ?? 2000)
  const records = (await page.evaluate(() => (window as unknown as { __rpUpgradeRecords: UpgradeRecord[] }).__rpUpgradeRecords)) ?? []
  return {
    failures: records.filter((r) => !r.permitted && !r.sameValue),
    sameValue: records.filter((r) => r.sameValue),
    permitted: records.filter((r) => r.permitted && !r.sameValue),
    undefinedTags,
  }
}

/** One line per failure, in the format required by docs/02-html-contract.md 7.2 item 6. */
export function formatUpgradeFailures(fixtureId: string, failures: UpgradeRecord[]): string {
  return failures
    .map((r) => `${fixtureId}: ${r.path}: ${r.type}${r.attributeName ? ` ${r.attributeName}` : ""}: ${JSON.stringify(r.oldValue)} -> ${JSON.stringify(r.newValue)}`)
    .join("\n")
}
```

Rules:

- **UD-1** The recorder starts observing at `readystatechange` to `interactive`: after the parser has inserted the server HTML and before deferred and module scripts run. Tier 3 pages MUST load Ripple scripts only as `<script type="module">` (which is what every host does, D-054). A classic blocking script that mutates component roots while parsing is not observed; RP603 and the fixture lint forbid such scripts.
- **UD-2** A record that writes the value already present (`sameValue`) is not a mutation (D-002 as amended; D-071 item 4). It is reported as information in `report.records`, is never a failure, and MUST NOT have an allow-list entry. Verified for this document: upgrading the Tabs `default` fixture of `02-html-contract.md` 11.9 with `@ui-sdk/web@0.1.0-beta.14` produces two such records (`role="none"` rewritten on each `ui-tabs-tab`) and zero value-changing records; Tabs therefore has no `upgradeAllow` entry.
- **UD-7** `UpgradeAllowEntry` is manifest data (`upgradeAllow`, D-071). `GLOBAL_UPGRADE_ALLOW` has exactly the one entry above. The Toast entry is the one of `02-html-contract.md` 7.3. React hydration is judged against the separate list `REACT_HYDRATION_ALLOW` (`test/hydration/react-allow.ts`, content owned by `06-bindings.md`).
- **UD-3** `childList` records always count, whatever was inserted.
- **UD-4** `undefinedTags` non-empty is a failure of the test that called `upgradeDiff` (it is also checker rule RP604).
- **UD-5** `installUpgradeRecorder` MUST remain self-contained (it is serialised into the page). It MUST NOT reference an imported symbol or a module-level constant.
- **UD-6** The checker's layer B (RP601) MUST call `installUpgradeRecorder` and judge with the same code; it MUST NOT have a second implementation (`07-manifest-registry-cli.md` 9.5.5).

### 4.4 `liquid-shim.ts` (complete; NOT RUN in this form)

The shim renders Ripple theme files locally with `liquidjs` 10.30.1. It is a stand-in for Shopify's renderer, not an emulator. It implements the union of the three scopes of `06-bindings.md` rule L-13 (D-097) and nothing else.

Evidence. The earlier form of this module (a TypeScript port of `ripple/docs/research/spikes/liquid/shim.mjs`) was RUN in the spike. The form below adds the union pruning, `paginate`, `layout`, four form types, `standard_event_data`, `font_face`, `date` and the added globals. It was bundled with esbuild 0.25.0 and exercised by an ad hoc script under Node 22.23.5 (each construct of the table below rendered once; `money_with_currency`, `upcase`, `{% raw %}` and `{% stylesheet %}` threw), but the named tests of 4.6 were NOT RUN in this form and are the gate.

```ts
// Local stand-in for Shopify's Liquid renderer. It renders Ripple theme files for tests.
// It is NOT a Shopify emulator: it implements the union of the three Liquid scopes of
// docs/06-bindings.md L-13 (D-097) and nothing else. Every other tag or filter throws.
import { Liquid, type Template } from "liquidjs"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { liquidCollection, resolveResource } from "./resources"

export interface ShimOptions {
  /** Locale file base name under locales/. Default "en.default". */
  locale?: string
  /** Value of the Liquid global `settings`. Default {}. */
  settings?: Record<string, unknown>
  /** Extra Liquid globals, merged over SHIM_GLOBALS. */
  globals?: Record<string, unknown>
  /** Test only: page size used by every {% paginate %} tag in place of its `by` value. */
  pageSize?: number
}

export interface Shim {
  /** Render Liquid source as if it were the file templates/<name>.liquid (no layout). */
  renderTemplate(source: string, scope?: Record<string, unknown>, name?: string): Promise<string>
  /**
   * Render templates/<template>.liquid inside its layout: layout/<name>.liquid when the template
   * contains {% layout '<name>' %}, no layout when it contains {% layout none %}, else layout/theme.liquid.
   */
  renderPage(template: string, scope?: Record<string, unknown>): Promise<string>
  /** Names of every {% partial %} rendered since the shim was created, in order. */
  readonly partials: string[]
}

/** Tags and filters of the union of the three scopes of docs/06-bindings.md L-13 (D-097). */
export const SHIM_TAGS: string[] = [
  "doc", "schema", "liquid", "assign", "if", "unless", "case", "for", "capture", "render", "form", "comment", "echo",
  "block", "partial", "paginate", "layout",
]
export const SHIM_FILTERS: string[] = [
  "escape", "split", "t", "default", "append", "prepend", "strip", "plus", "minus", "times", "size", "money", "image_url",
  "json", "divided_by", "modulo", "round", "remove", "date", "url_encode", "payment_button",
  "standard_event_data", "asset_url", "stylesheet_tag", "font_face",
  // Infrastructure scope, used only by snippets/meta-tags.liquid (D-097 as amended, D-109):
  "first", "join", "remove_first", "slice", "strip_html", "money_without_currency", "structured_data",
]

const liquidOf = (reference: string): any => resolveResource(reference, "liquid")
const summerCollection = liquidCollection()
const US = { iso_code: "US", name: "United States", currency: { iso_code: "USD", symbol: "$" } }
const EN = { iso_code: "en", endonym_name: "English" }

/**
 * Shim-only scope variables (not Shopify globals): `current_page` (page number for {% paginate %}),
 * `current_query` (query string used to build pagination URLs) and `form_state`
 * (per form type: { posted?: boolean, errors?: unknown, email?: string, name?: string, body?: string }).
 */
export const SHIM_GLOBALS: Record<string, unknown> = {
  routes: {
    root_url: "/",
    cart_url: "/cart",
    cart_add_url: "/cart/add",
    cart_change_url: "/cart/change",
    cart_update_url: "/cart/update",
    all_products_collection_url: "/collections/all",
    collections_url: "/collections",
    search_url: "/search",
    predictive_search_url: "/search/suggest",
    product_recommendations_url: "/recommendations/products",
    account_url: "/account",
    account_login_url: "/account/login",
  },
  request: { locale: { iso_code: "en", root_url: "/", direction: "ltr" }, design_mode: false, page_type: "index", path: "/", origin: "http://127.0.0.1" },
  template: { name: "index" },
  shop: {
    name: "Mock Shop",
    url: "http://127.0.0.1",
    currency: "USD",
    money_format: "${{amount}}",
    policies: [],
    brand: { logo: null, favicon: null },
    password_message: "",
    description: "",
    published_locales: [],
  },
  localization: { country: US, language: EN, available_countries: [US], available_languages: [EN] },
  linklists: { "main-menu": liquidOf("menu.main"), footer: liquidOf("menu.footer") },
  // An array (so that {% paginate collections by n %} and `collections.size` work) with handle keys.
  collections: Object.assign([summerCollection], { frontpage: summerCollection, summer: summerCollection, all: summerCollection }),
  cart: { item_count: 0, note: null, items: [], items_subtotal_price: 0, total_price: 0 },
  customer: null,
  search: { terms: "", performed: false, results_count: 0, results: [] },
  recommendations: { performed: false, products: [] },
  gift_card: null,
  page_title: "Mock Shop",
  page_description: null,
  page_image: null,
  canonical_url: "http://127.0.0.1/",
  current_tags: null,
  content_for_header: "",
  content_for_additional_checkout_buttons: "",
  additional_checkout_buttons: false,
  current_page: 1,
  current_query: "",
  form_state: {},
}

/** Split "a, b: [1, 'x,y'], c: d" on top-level commas. */
function splitArgs(source: string): string[] {
  const out: string[] = []
  let current = ""
  let quote: string | null = null
  let depth = 0
  for (const ch of source) {
    if (quote) {
      current += ch
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      current += ch
      continue
    }
    if (ch === "[" || ch === "(") depth += 1
    if (ch === "]" || ch === ")") depth -= 1
    if (ch === "," && depth === 0) {
      out.push(current.trim())
      current = ""
      continue
    }
    current += ch
  }
  if (current.trim()) out.push(current.trim())
  return out
}

function collectBody(tag: any, tagToken: any, remainTokens: any[], endName: string): void {
  tag.templates = []
  const stream = tag.liquid.parser
    .parseStream(remainTokens)
    .on(`tag:${endName}`, () => stream.stop())
    .on("template", (tpl: Template) => tag.templates.push(tpl))
    .on("end", () => {
      throw new Error(`tag ${tagToken.getText()} not closed`)
    })
  stream.start()
}

/** Default id and class of each form type, and its action. `<id>` is replaced by the form's id. */
const FORMS: Record<string, { action: string; id: string; class: string }> = {
  product: { action: "/cart/add", id: "product_form_", class: "shopify-product-form" },
  cart: { action: "/cart", id: "cart_form", class: "shopify-cart-form" },
  localization: { action: "/localization", id: "localization_form", class: "shopify-localization-form" },
  customer: { action: "/contact#<id>", id: "contact_form", class: "contact-form" },
  contact: { action: "/contact#<id>", id: "ContactForm", class: "contact-form" },
  storefront_password: { action: "/password", id: "login_form", class: "storefront-password-form" },
}

function swallow(tagToken: any, remainTokens: any[], endName: string): void {
  while (remainTokens.length) {
    const token = remainTokens.shift()
    if (token.name === endName) return
  }
  throw new Error(`tag ${tagToken.getText()} not closed`)
}

const escapeAttr = (value: unknown): string =>
  String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/** liquidjs passes a named filter argument (`width: 800`) as the array ["width", 800]. */
function namedArgs(args: unknown[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const arg of args) if (Array.isArray(arg) && arg.length === 2 && typeof arg[0] === "string") out[arg[0]] = arg[1]
  return out
}

export function createShim(themeRoot: string, options: ShimOptions = {}): Shim {
  const locale = options.locale ?? "en.default"
  const translations = JSON.parse(readFileSync(join(themeRoot, "locales", `${locale}.json`), "utf8"))
  const partials: string[] = []
  const engine = new Liquid({
    root: [join(themeRoot, "templates"), join(themeRoot, "layout")],
    partials: join(themeRoot, "snippets"),
    extname: ".liquid",
    strictFilters: true, // a filter the shim does not define fails loudly
    strictVariables: false, // unset block params are nil, as on Shopify
    ownPropertyOnly: true,
  })
  const globals = { ...SHIM_GLOBALS, settings: options.settings ?? {}, ...(options.globals ?? {}) }

  const blockCache = new Map<string, { tpl: Template[]; defaults: Record<string, unknown> }>()
  let blockSeq = 0
  const loadBlock = (name: string) => {
    if (!/^[a-z0-9_-]+$/.test(name)) throw new Error(`invalid block name '${name}'`)
    let entry = blockCache.get(name)
    if (!entry) {
      const file = join(themeRoot, "blocks", `${name}.liquid`)
      if (!existsSync(file)) throw new Error(`blocks/${name}.liquid does not exist`)
      const source = readFileSync(file, "utf8")
      // Shopify binds each schema setting id as a bare variable and as block.settings.<id>.
      const match = source.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/)
      const schema = match ? JSON.parse(match[1]!) : {}
      const defaults: Record<string, unknown> = {}
      for (const setting of schema.settings ?? []) if (setting.id) defaults[setting.id] = setting.default ?? null
      entry = { tpl: engine.parse(source, file), defaults }
      blockCache.set(name, entry)
    }
    return entry
  }

  // {% block 'name', key: value, list: ['a', 'b'] %} body {% endblock %}
  engine.registerTag("block", {
    parse(this: any, tagToken: any, remainTokens: any[]) {
      const file: string = tagToken.file ?? ""
      if (/[\\/](blocks|snippets)[\\/]/.test(file)) throw new Error(`'block' tag used outside templates/ and layout/: ${file}`)
      const [nameSource, ...rest] = splitArgs(tagToken.args)
      this.nameSource = nameSource
      this.pairs = rest.map((pair: string) => {
        const index = pair.indexOf(":")
        if (index < 0) throw new Error(`block argument without a name: ${pair}`)
        const key = pair.slice(0, index).trim()
        if (key.includes(".")) throw new Error(`dotted block argument '${key}'`)
        return [key, pair.slice(index + 1).trim()]
      })
      collectBody(this, tagToken, remainTokens, "endblock")
    },
    *render(this: any, ctx: any, emitter: any): Generator<any, void, any> {
      const liquid = this.liquid
      const name = yield liquid.evalValue(this.nameSource, ctx)
      // 1. The body renders first, in the CALLER's scope.
      const content = yield liquid.renderer.renderTemplates(this.templates, ctx)
      // 2. Arguments are evaluated in the caller's scope.
      const scope: Record<string, unknown> = {}
      for (const [key, source] of this.pairs as Array<[string, string]>) {
        if (source.startsWith("[")) {
          const items: unknown[] = []
          for (const item of splitArgs(source.slice(1, -1))) items.push(yield liquid.evalValue(item, ctx))
          scope[key] = items
        } else {
          scope[key] = yield liquid.evalValue(source, ctx)
        }
      }
      if (String(content).trim() !== "" || scope.content === undefined) scope.content = content
      // 3. The block file renders in an isolated scope: params + content + block + globals.
      // liquidjs returns a computed value for an UNSET top-level variable named size, first or last;
      // Ruby Liquid returns nil. Define them so unset params behave like Shopify.
      for (const key of ["size", "first", "last"]) if (!(key in scope)) scope[key] = null
      const { tpl, defaults } = loadBlock(name)
      const settings: Record<string, unknown> = {}
      for (const [id, fallback] of Object.entries(defaults)) {
        // A call-site argument with a setting's id overrides the setting.
        settings[id] = scope[id] === undefined || scope[id] === null ? fallback : scope[id]
        scope[id] = settings[id]
      }
      blockSeq += 1
      scope.block = { shopify_attributes: "", settings, id: `shim${blockSeq}`, type: name }
      emitter.write(yield liquid.render(tpl, scope, { globals: ctx.globals }))
    },
  })

  // {% partial 'name' %} body {% endpartial %}: renders its body with no wrapper (SPIKE-02 default path).
  engine.registerTag("partial", {
    parse(this: any, tagToken: any, remainTokens: any[]) {
      this.nameSource = tagToken.args.trim()
      if (!/^(['"])[^'"/]+\1$/.test(this.nameSource)) throw new Error(`partial needs a quoted literal name: ${this.nameSource}`)
      collectBody(this, tagToken, remainTokens, "endpartial")
    },
    *render(this: any, ctx: any, emitter: any): Generator<any, void, any> {
      partials.push(this.nameSource.slice(1, -1))
      emitter.write(yield this.liquid.renderer.renderTemplates(this.templates, ctx))
    },
  })

  // {% layout 'name' %} and {% layout none %}: prints nothing; renderPage reads the tag from the source.
  engine.registerTag("layout", {
    parse(tagToken: any) {
      if (!/^(none|'[a-z0-9_.-]+'|"[a-z0-9_.-]+")$/.test(tagToken.args.trim())) throw new Error(`layout needs a quoted literal name or none: ${tagToken.args}`)
      if (!/[\\/]templates[\\/]/.test(tagToken.file ?? "")) throw new Error(`'layout' tag used outside templates/: ${tagToken.file}`)
    },
    render() {},
  })

  // {% paginate <array path> by <n> %} body {% endpaginate %}. The path has one or two segments.
  // Inside the body the path yields the current page's slice, and `paginate` exists.
  engine.registerTag("paginate", {
    parse(this: any, tagToken: any, remainTokens: any[]) {
      const match = /^([a-z_]+(?:\.[a-z_]+)?)\s+by\s+(\d+)$/.exec(tagToken.args.trim())
      if (!match) throw new Error(`paginate needs '<array> by <number>': ${tagToken.args}`)
      this.path = match[1]!.split(".")
      this.by = Number(match[2])
      collectBody(this, tagToken, remainTokens, "endpaginate")
    },
    *render(this: any, ctx: any, emitter: any): Generator<any, void, any> {
      const liquid = this.liquid
      const by: number = options.pageSize ?? this.by
      const [head, member] = this.path as [string, string | undefined]
      const owner = yield liquid.evalValue(head, ctx)
      const all: unknown[] = member === undefined ? owner : owner?.[member]
      const items = Array.isArray(all) ? all : []
      const pages = Math.max(1, Math.ceil(items.length / by))
      const current = Math.min(pages, Math.max(1, Number(yield liquid.evalValue("current_page", ctx)) || 1))
      const request = yield liquid.evalValue("request", ctx)
      const query = yield liquid.evalValue("current_query", ctx)
      const urlOf = (page: number): string => {
        const params = new URLSearchParams(String(query ?? ""))
        params.delete("page")
        if (page > 1) params.set("page", String(page))
        const text = params.toString()
        return `${request?.path ?? "/"}${text ? `?${text}` : ""}`
      }
      const slice = items.slice((current - 1) * by, current * by)
      const paginate = {
        current_page: current,
        current_offset: (current - 1) * by,
        page_size: by,
        pages,
        items: items.length,
        previous: current > 1 ? { url: urlOf(current - 1), title: "Previous", is_link: true } : null,
        next: current < pages ? { url: urlOf(current + 1), title: "Next", is_link: true } : null,
        parts: Array.from({ length: pages }, (_, index) => ({ title: String(index + 1), url: urlOf(index + 1), is_link: index + 1 !== current })),
      }
      const paged = member === undefined ? slice : { ...owner, [member]: slice }
      ctx.push({ paginate, [head]: paged })
      emitter.write(yield liquid.renderer.renderTemplates(this.templates, ctx))
      ctx.pop()
    },
  })

  for (const raw of ["doc", "schema"]) {
    engine.registerTag(raw, {
      parse(tagToken: any, remainTokens: any[]) {
        swallow(tagToken, remainTokens, `end${raw}`)
      },
      render() {},
    })
  }

  // {% form '<type>', <resource>, id: 'x', class: 'y', return_to: '/z' %} for the six types of FORMS.
  // Output shape of the product form: https://shopify.dev/docs/api/liquid/tags/form (as recorded in
  // docs/research/liquid-blocks-partials.md section 2.6). The other shapes are the shim's choice.
  // Fixtures mask everything the platform owns (SH-3).
  engine.registerTag("form", {
    parse(this: any, tagToken: any, remainTokens: any[]) {
      this.parts = splitArgs(tagToken.args)
      collectBody(this, tagToken, remainTokens, "endform")
    },
    *render(this: any, ctx: any, emitter: any): Generator<any, void, any> {
      const liquid = this.liquid
      const type: string = yield liquid.evalValue(this.parts[0], ctx)
      const spec = FORMS[type]
      if (!spec) throw new Error(`form shim supports ${Object.keys(FORMS).join(", ")}; got '${type}'`)
      const resource = this.parts[1] && !this.parts[1].includes(":") ? yield liquid.evalValue(this.parts[1], ctx) : null
      const named: Record<string, unknown> = {}
      for (const part of this.parts.slice(1) as string[]) {
        const index = part.indexOf(":")
        if (index < 0) continue
        const key = part.slice(0, index).trim()
        if (key !== "id" && key !== "class" && key !== "return_to") throw new Error(`form argument '${key}' is not allowed (id, class, return_to; D-091)`)
        named[key] = yield liquid.evalValue(part.slice(index + 1).trim(), ctx)
      }
      const id = String(named.id ?? (type === "product" ? `${spec.id}${resource?.id ?? ""}` : spec.id))
      const cssClass = String(named.class ?? spec.class)
      const states = (yield liquid.evalValue("form_state", ctx)) ?? {}
      const state = states[type] ?? {}
      const form = {
        id,
        errors: state.errors ?? null,
        "posted_successfully?": state.posted === true,
        email: state.email ?? null,
        name: state.name ?? null,
        body: state.body ?? null,
      }
      ctx.push({ form })
      const body = yield liquid.renderer.renderTemplates(this.templates, ctx)
      ctx.pop()
      const hidden = (name: string, value: unknown): string => `<input type="hidden" name="${name}" value="${escapeAttr(value)}" />`
      let first = hidden("form_type", type) + hidden("utf8", "✓")
      if (type === "localization") {
        const request = yield liquid.evalValue("request", ctx)
        first += hidden("_method", "put") + hidden("return_to", named.return_to ?? request?.path ?? "/")
      } else if (named.return_to !== undefined) {
        first += hidden("return_to", named.return_to)
      }
      const last = type === "product" ? hidden("product-id", resource?.id ?? "") : ""
      const enctype = type === "product" ? ' enctype="multipart/form-data"' : ""
      emitter.write(
        `<form method="post" action="${escapeAttr(spec.action.replace("<id>", id))}" id="${escapeAttr(id)}" accept-charset="UTF-8" class="${escapeAttr(cssClass)}"${enctype}>` +
          `${first}${body}${last}</form>`,
      )
    },
  })

  // Shopify filters used by Ripple files. A filter MUST be added here before a Ripple file uses it.
  engine.registerFilter("t", (key: unknown, ...args: unknown[]) => {
    let value: unknown = String(key).split(".").reduce((node: any, part) => (node == null ? node : node[part]), translations)
    const named = namedArgs(args)
    if (value !== null && typeof value === "object" && "count" in named) {
      value = (value as Record<string, unknown>)[Number(named.count) === 1 ? "one" : "other"]
    }
    if (typeof value !== "string") throw new Error(`missing translation '${key}'`)
    return value.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (whole, name: string) => (name in named ? String(named[name]) : whole))
  })
  engine.registerFilter("money", (cents: unknown) => `$${(Number(cents) / 100).toFixed(2)}`)
  engine.registerFilter("image_url", (image: any, ...args: unknown[]) => {
    const source = typeof image === "string" ? image : (image?.src ?? image?.featured_image?.src ?? image?.preview_image?.src ?? image?.image?.src)
    if (typeof source !== "string" || source === "") throw new Error("image_url: the input has no image")
    const named = namedArgs(args)
    if (named.width === undefined && named.height === undefined) throw new Error("image_url: width or height is required")
    let url = source
    for (const key of ["width", "height", "crop"]) {
      if (named[key] !== undefined) url += `${url.includes("?") ? "&" : "?"}${key}=${named[key]}`
    }
    return url
  })
  engine.registerFilter("asset_url", (name: unknown) => `/assets/${name}`)
  engine.registerFilter("stylesheet_tag", (url: unknown) => `<link href="${url}" rel="stylesheet" type="text/css" media="all" />`)
  engine.registerFilter("payment_button", () => '<div data-shopify="payment-button" class="shopify-payment-button"></div>')

  engine.registerFilter("standard_event_data", () => '{"shim":"standard_event_data"}')
  // meta-tags.liquid only (D-109). `first`, `join`, `remove_first`, `slice`, `strip_html` are the liquidjs built-ins, kept by the pruning below.
  engine.registerFilter("money_without_currency", (cents: unknown) => (Number(cents) / 100).toFixed(2))
  engine.registerFilter("structured_data", () => '{"shim":"structured_data"}')
  // font | font_face: prints one rule for a font that is not a system font; a system font prints nothing.
  engine.registerFilter("font_face", (font: any) =>
    font && typeof font === "object" && font["system?"] !== true ? `@font-face { font-family: "${escapeAttr(font.family)}"; }` : "",
  )
  // date: `date: format: 'date'` prints YYYY-MM-DD (UTC); every other form is the liquidjs filter.
  const builtinDate = (engine as any).filters["date"]
  const builtinDateHandler: (...args: unknown[]) => unknown = typeof builtinDate === "function" ? builtinDate : builtinDate.handler
  engine.registerFilter("date", function (this: unknown, value: unknown, ...args: unknown[]) {
    const named = namedArgs(args)
    if (named.format === undefined) return builtinDateHandler.call(this, value, ...args)
    if (named.format !== "date") throw new Error(`date: the shim supports format: 'date' only, got '${named.format}'`)
    const date = new Date(String(value))
    if (Number.isNaN(date.getTime())) throw new Error(`date: not a date: ${value}`)
    return date.toISOString().slice(0, 10)
  })

  // Remove every liquidjs built-in outside the union, so that a file using one throws at parse time.
  for (const registry of [
    [(engine as any).tags, SHIM_TAGS],
    [(engine as any).filters, SHIM_FILTERS],
  ] as Array<[Record<string, unknown>, string[]]>) {
    for (const name of Object.keys(registry[0])) if (!registry[1].includes(name)) delete registry[0][name]
    for (const name of registry[1]) if (!(name in registry[0])) throw new Error(`liquid shim: '${name}' is in the union but not implemented`)
  }

  const renderTemplate = async (source: string, scope: Record<string, unknown> = {}, name = "case"): Promise<string> => {
    const tpl = engine.parse(source, join(themeRoot, "templates", `${name}.liquid`))
    return engine.render(tpl, scope, { globals })
  }
  const renderPage = async (template: string, scope: Record<string, unknown> = {}): Promise<string> => {
    const source = readFileSync(join(themeRoot, "templates", `${template}.liquid`), "utf8")
    // Shopify: template.name and request.page_type are the file name up to the first dot ("page.contact" gives "page").
    const name = template.split(".")[0]!
    const pageScope = {
      ...scope,
      template: { name },
      request: { ...(globals.request as object), page_type: name, ...((scope.request as object | undefined) ?? {}) },
    }
    const body = await renderTemplate(source, pageScope, template)
    const match = /\{%-?\s*layout\s+(?:(none)|['"]([a-z0-9_.-]+)['"])\s*-?%\}/.exec(source)
    if (match?.[1] === "none") return body
    const layoutFile = join(themeRoot, "layout", `${match?.[2] ?? "theme"}.liquid`)
    const layout = engine.parse(readFileSync(layoutFile, "utf8"), layoutFile)
    return engine.render(layout, { ...pageScope, content_for_layout: body }, { globals })
  }
  return { renderTemplate, renderPage, partials }
}
```

What the shim implements. Anything not in this table throws, so that an unsupported construct fails a test instead of printing wrong HTML.

| Construct | Behaviour in the shim |
|---|---|
| Tags of `liquidjs` kept | `assign`, `if`, `unless` (with `elsif`, `else`), `case` (with `when`), `for`, `capture`, `render`, `comment`, `echo`, `liquid` (built in). Every other built-in tag (`raw`, `include`, `increment`, `decrement`, `cycle`, `tablerow`, `break`, `continue`, `#`) is removed and throws `tag "<name>" not found` |
| `{% block 'name', key: value %}...{% endblock %}` | Renders the body in the caller's scope, then `blocks/<name>.liquid` in an isolated scope: arguments, `content`, `block` (`id`, `type`, `settings`, `shopify_attributes: ""`), schema setting defaults bound as bare variables, globals. Every named argument is passed through unchanged. Throws when used in a file under `blocks/` or `snippets/`, when an argument has no name, or when a name contains a dot. Array literals `['a', 'b']` are accepted as argument values |
| `{% partial 'name' %}...{% endpartial %}` | Renders the body with no wrapper and records the name (SPIKE-02 default path) |
| `{% doc %}`, `{% schema %}` | Swallowed; print nothing |
| `{% layout 'name' %}`, `{% layout none %}` | Prints nothing. `renderPage` renders the template inside `layout/<name>.liquid`, or with no layout for `none`. Without the tag the layout is `theme`. Throws outside `templates/` and for an argument that is not a quoted literal or `none` |
| `{% paginate <array> by <n> %}...{% endpaginate %}` | `<array>` is a path of one or two segments (`collections`, `collection.products`, `search.results`, `blog.articles`). Inside the body the path yields the slice of the current page, and `paginate` has `current_page`, `current_offset`, `page_size`, `pages`, `items` (total count), `previous` and `next` (`{ url, title, is_link }` or nil), and `parts` (`{ title, url, is_link }` per page). The page number is the scope variable `current_page` (default 1). URLs are `request.path` plus the scope variable `current_query` with `page` replaced. `ShimOptions.pageSize` overrides `<n>` |
| `{% form '<type>', <resource>, id: 'x', class: 'y' %}` | Types: `product`, `cart`, `localization`, `customer`, `contact`, `storefront_password`. Prints `<form method="post" action="<route>" id="<id>" accept-charset="UTF-8" class="<class>">` followed by hidden inputs `form_type` and `utf8`; `localization` adds `_method` (`put`) and `return_to`; `product` adds `enctype="multipart/form-data"` and a trailing hidden `product-id`. Routes: `product` `/cart/add`, `cart` `/cart`, `localization` `/localization`, `customer` and `contact` `/contact#<id>`, `storefront_password` `/password`. Accepts only the named arguments `id`, `class`, `return_to`; any other throws (D-091). Inside the body `form` has `id`, `errors`, `posted_successfully?`, `email`, `name`, `body`, read from the scope variable `form_state.<type>` (`{ posted, errors, email, name, body }`); without it `errors` is nil and `posted_successfully?` is false |
| Filters of `liquidjs` kept | `escape`, `split`, `default`, `append`, `prepend`, `strip`, `plus`, `minus`, `times`, `size`, `json`, `divided_by`, `modulo`, `round`, `remove`, `url_encode` (built in). Every other built-in filter is removed and throws `undefined filter: <name>` |
| `t` | Looks the key up in `locales/<locale>.json`. A named argument replaces `{{ name }}` in the string. With a `count` argument and an object value, picks `one` when the count is 1, otherwise `other`. A missing key throws `missing translation '<key>'` |
| `money` | cents to `$<amount with two decimals>` |
| `image_url` | Input: an object with `src`, or an object with `featured_image.src`, `preview_image.src` or `image.src`, or a string. Appends `width`, `height`, `crop` named arguments as query parameters. Throws without `width` or `height`, and when the input has no image |
| `date` | `date: format: 'date'` prints `YYYY-MM-DD` in UTC; any other `format:` value throws. `date: '<strftime>'` is the `liquidjs` filter |
| `payment_button` | `<div data-shopify="payment-button" class="shopify-payment-button"></div>` (opaque markup; fixtures mask it, D-004) |
| `standard_event_data` | returns the fixed string `{"shim":"standard_event_data"}` whatever its input and arguments (the payload is masked, D-089 item 3) |
| `money_without_currency` | `48.00` for `4800` (cents divided by 100, two decimals) |
| `structured_data` | returns the fixed string `{"shim":"structured_data"}` whatever its input |
| `first`, `join`, `remove_first`, `slice`, `strip_html` | the `liquidjs` built-in filters, kept (not pruned) because `snippets/meta-tags.liquid` uses them (D-109) |
| `asset_url` | `/assets/<name>` |
| `stylesheet_tag` | `<link href="<url>" rel="stylesheet" type="text/css" media="all" />` |
| `font_face` | for a font object whose `system?` is not true: `@font-face { font-family: "<family>"; }`; for a system font or nil: nothing. Named arguments are ignored |
| Members ending in `?` | `form.posted_successfully?` and `<font>.system?` are read as the property whose key includes the `?` (`liquidjs` 10.30.1 parses them; verified for this document) |
| Globals | `SHIM_GLOBALS` above, plus `settings` (default `{}`). A font setting is passed by the test as `settings.<id> = { family, fallback_families, weight, style, "system?": <boolean> }` |

Globals in `SHIM_GLOBALS`, with the members Ripple files read: `routes` (the twelve URLs above), `request` (`locale.iso_code`, `locale.root_url`, `locale.direction` = `ltr`, `design_mode`, `page_type`, `path`), `template.name`, `shop` (`name`, `url`, `currency`, `money_format`, `policies` = empty, `brand.logo` = nil, `password_message`), `localization` (`country`, `language`, `available_countries`, `available_languages`), `linklists` (`main-menu` from `menu.main`, `footer` from `menu.footer`; each link has `title`, `url`, `current`, `links`), `collections` (an array with the keys `frontpage`, `summer`, `all`), `cart`, `customer` (nil), `search`, `recommendations` (`products`, `performed`), `gift_card` (nil), `page_title`, `page_description` (nil), `page_image` (nil), `canonical_url`, `current_tags` (nil), `request.origin`, `shop.description`, `shop.published_locales` (empty), `shop.brand.favicon` (nil) (the last seven are read only by `snippets/meta-tags.liquid`), `content_for_header`, `content_for_additional_checkout_buttons` (empty string), `additional_checkout_buttons` (false). `renderPage` sets `template.name` and `request.page_type` to the template file name up to its first dot (`page.contact` gives `page`).

Rules:

- **SH-1** A Ripple `.liquid` file uses only the tags, filters and objects of its scope in `06-bindings.md` L-13 (D-097); the shim implements the union (`SHIM_TAGS`, `SHIM_FILTERS`, `SHIM_GLOBALS`); a construct outside the union throws. Which scope a file may use is checked by the checker (layer S), not by the shim. A change to L-13 MUST change the shim, the table above and `test/liquid/shim.test.ts` in the same change.
- **SH-2** The shim MUST keep `strictFilters: true`. It MUST NOT gain a catch-all filter or tag.
- **SH-3** The shim's `money`, `image_url`, `payment_button`, `standard_event_data`, `font_face`, `date`, `paginate` and `form` output is NOT Shopify's output. Every fixture that prints them masks them (`02-html-contract.md` 11.6). A test MUST NOT assert their exact text, except the tests of the shim itself (4.6); tier 8 covers the real output.
- **SH-4** Differences from Shopify that the shim hides are listed in "Evidence and UNVERIFIED" (20). They are settled only by tier 8.
- **SH-5** `current_query` and `form_state` are shim-only scope variables, and `current_page` is set only by tests and `serveTheme`. A Ripple `.liquid` file MUST NOT read them. One exception: `snippets/meta-tags.liquid` reads `current_page` and `current_tags`, which are Shopify globals with the same meaning (D-109).

### 4.5 `serve-theme.ts` (complete; NOT RUN in this form)

`serveTheme` serves a whole theme directory through the shim over HTTP, with an in-memory cart, the native Liquid cart endpoints, and emulations of the three platform modules. It is the theme-serving function that `08-agent-kit-and-evals.md` requires: the Liquid eval tier starts the theme with `serveTheme` imported from `<pkg>/testing` (D-104 item 4, D-106), and `evals/adapters/serve.ts` MUST call it.

Evidence. The earlier form (seven routes, no POST handlers besides the cart, no `PageViewEvent`) was RUN in the spike. The form below was bundled with esbuild 0.25.0 and exercised over HTTP by an ad hoc script under Node 22.23.5 against a twelve-template stand-in theme (every route of `DEFAULT_THEME_ROUTES`, the 404 template, the three POST handlers and the cart endpoints answered as the table below says); it was NOT RUN against the Ripple theme or in a browser. The tests of 4.6 are the gate.

```ts
// Serves a Liquid theme directory through the shim, with a stateful in-memory cart and
// emulations of the platform modules. Test double only. Used by tiers 3 to 6 for Liquid and by evals.
import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { extname, join, normalize } from "node:path"
import { createShim, type ShimOptions } from "./liquid-shim"
import { liquidCollection, liquidProductOf, resolveResource } from "./resources"

export interface ThemeRoute {
  /** Matched against the URL path. */
  pattern: RegExp
  /** Template base name under templates/ ("page.contact" is templates/page.contact.liquid). */
  template: string
  /** HTTP status. Default 200. */
  status?: number
  /** Extra Liquid scope for the template. `match` is the RegExp match; `query` the URL query.
   *  Returning null means "no such resource": the server renders NOT_FOUND_ROUTE. */
  scope?(match: RegExpMatchArray, query: URLSearchParams): Record<string, unknown> | null
}

export interface ServeThemeOptions extends ShimOptions {
  themeRoot: string
  /** Default 0 (an ephemeral port). */
  port?: number
  /** Default DEFAULT_THEME_ROUTES. */
  routes?: ThemeRoute[]
}

export interface ThemeServer {
  url: string
  /** Empties the cart. Call between tests. */
  resetCart(): void
  close(): Promise<void>
}

interface CartLineState { key: string; variantId: number; quantity: number }

const liquid = (name: string): any => resolveResource(name, "liquid")
// The catalogue. Lookup by handle takes the first match, so /products/linen-shirt is product.options
// (product.basic has the same handle and is its single-variant form).
const CATALOGUE = ["product.options", "product.sale", "product.sold-out", "product.basic"]
const PRODUCTS: any[] = CATALOGUE.map((reference) => liquidProductOf(reference))
const referenceOf = (handle: string): string | undefined => CATALOGUE.find((reference) => liquidProductOf(reference).handle === handle)
const collectionOf = (query: URLSearchParams): any =>
  liquidCollection({
    availability: query.get("filter.v.availability"),
    priceGte: query.get("filter.v.price.gte"),
    priceLte: query.get("filter.v.price.lte"),
    sortBy: query.get("sort_by"),
  })
const searchOf = (terms: string): any => {
  const results = terms === "" ? [] : PRODUCTS.slice(0, 3).filter((p) => p.title.toLowerCase().includes(terms.toLowerCase()))
  return { terms, performed: terms !== "", results, results_count: results.length }
}
const page = (handle: string) => ({ title: handle, handle, url: `/pages/${handle}`, content: "<p>Page content.</p>" })

/** Matched in order; the first match wins. An unmatched path renders NOT_FOUND_ROUTE. */
export const DEFAULT_THEME_ROUTES: ThemeRoute[] = [
  { pattern: /^\/$/, template: "index" },
  {
    pattern: /^\/products\/([a-z0-9-]+)$/,
    template: "product",
    scope: (match, query) => {
      const reference = referenceOf(match[1]!)
      if (!reference) return null
      const wanted = Number(query.get("variant"))
      const known = liquidProductOf(reference).variants.some((v: any) => v.id === wanted)
      return { product: liquidProductOf(reference, known ? wanted : undefined) }
    },
  },
  {
    // Shopify answers this path with the product template rendered for partial rendering; the shim
    // renders the whole product page with `recommendations` set.
    pattern: /^\/recommendations\/products$/,
    template: "product",
    scope: () => ({ product: PRODUCTS[0], recommendations: { performed: true, products: [PRODUCTS[1], PRODUCTS[2]] } }),
  },
  { pattern: /^\/collections$/, template: "list-collections" },
  { pattern: /^\/collections\/([a-z0-9-]+)$/, template: "collection", scope: (_match, query) => ({ collection: collectionOf(query) }) },
  { pattern: /^\/cart$/, template: "cart" },
  { pattern: /^\/search$/, template: "search", scope: (_match, query) => ({ search: searchOf(query.get("q") ?? "") }) },
  {
    pattern: /^\/blogs\/([a-z0-9-]+)$/,
    template: "blog",
    scope: (match) => ({ blog: { title: "News", handle: match[1], url: `/blogs/${match[1]}`, articles: [liquid("article.basic")] } }),
  },
  { pattern: /^\/blogs\/[a-z0-9-]+\/[a-z0-9-]+$/, template: "article", scope: () => ({ article: liquid("article.basic") }) },
  { pattern: /^\/pages\/contact$/, template: "page.contact", scope: () => ({ page: page("contact") }) },
  { pattern: /^\/pages\/([a-z0-9-]+)$/, template: "page", scope: (match) => ({ page: page(match[1]!) }) },
  { pattern: /^\/password$/, template: "password" },
  {
    pattern: /^\/gift_cards\/([a-z0-9]+)$/,
    template: "gift_card",
    scope: (match) => ({
      gift_card: { code: match[1], balance: 2500, initial_value: 5000, currency: "USD", enabled: true, expired: false, expires_on: null, pass_url: null, url: `/gift_cards/${match[1]}` },
    }),
  },
]

export const NOT_FOUND_ROUTE: ThemeRoute = { pattern: /^/, template: "404", status: 404 }

const TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
}

/** Emulation of window.Shopify.actions backed by the shim server's cart. Shapes follow
 *  docs/research/spikes/commerce/fake-sa.js (which follows hydrogen/packages/hydrogen/vendor/standard-actions.d.ts). */
export const STANDARD_ACTIONS_SERVER_EMULATION = `(function(){
  const log = (window.__log = []);
  let config = null;
  const call = async (method, body) => (await fetch("/__shim/cart", { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined })).json();
  const defaultUpdate = (payload) => call("POST", payload);
  function updateCart(payload, options){
    log.push(["updateCart", JSON.parse(JSON.stringify(payload))]);
    const run = () => config?.handler ? config.handler(() => { log.push(["defaultHandler"]); return defaultUpdate(payload); }, payload, options) : defaultUpdate(payload);
    const promise = run();
    if (payload.lines) {
      const action = payload.lines[0].id ? (payload.lines[0].quantity === 0 ? "remove" : "update") : "add";
      const ev = new Event("shopify:cart:lines-update", { bubbles: true });
      Object.assign(ev, { action, context: "standard-action", lines: payload.lines, promise, detail: options?.event?.detail });
      const target = config?.eventTarget?.({ type: ev.type, action }) ?? document;
      target.dispatchEvent(ev);
    }
    return promise;
  }
  updateCart.configure = (c) => { log.push(["configure", Object.keys(c)]); if (config || window.__preconfigured) return false; config = c; return true; };
  updateCart.isDefault = () => !config;
  const getCart = async (p) => { log.push(["getCart", p ?? null]); return call("GET"); };
  let oc = null; const openCart = async () => { log.push(["openCart"]); return oc?.handler ? oc.handler(async () => {}) : undefined; }; openCart.configure = (c) => { oc = c; log.push(["openCart.configure"]); return true; }; openCart.isDefault = () => true;
  window.Shopify = { actions: { getCart, updateCart, openCart } };
})();`

/** Emulation of @shopify/partial-rendering for the SPIKE-02 default path: a region is the element
 *  that carries data-rp-region="<partial name>"; apply() replaces it. */
export const PARTIAL_RENDERING_EMULATION = `export const partials = {
  async fetch(...args) {
    const options = typeof args[args.length - 1] === "object" && args[args.length - 1] !== null ? args.pop() : {};
    const response = await fetch(options.url ?? location.href, { headers: { accept: "text/html" }, signal: options.signal });
    if (!response.ok) throw new Error("partials.fetch: " + response.status);
    (window.__partialsLog ??= []).push({ names: args, url: options.url ?? null });
    return { names: args, html: await response.text() };
  },
  apply(payload) {
    const fresh = new DOMParser().parseFromString(payload.html, "text/html");
    for (const name of payload.names) {
      const selector = '[data-rp-region="' + name + '"]';
      const next = fresh.querySelectorAll(selector);
      document.querySelectorAll(selector).forEach((stale, index) => { if (next[index]) stale.replaceWith(document.adoptNode(next[index])); });
    }
  },
};`

/** Emulation of @shopify/standard-events. The real event type string of PageViewEvent is UNVERIFIED
 *  (SPIKE-02); tests read window.__log, never the event type. */
export const STANDARD_EVENTS_EMULATION = `export function createViewEventElement(){ return class extends HTMLElement {}; }
export class PageViewEvent extends Event {
  constructor(init) { super("rp-test:page-view"); this.init = init; (window.__log ||= []).push(["pageView", init]); }
}`

const PLATFORM_IMPORTS: Record<string, string> = {
  "@shopify/partial-rendering": "/__shim/partial-rendering.js",
  "@shopify/standard-actions": "/__shim/standard-actions.js",
  "@shopify/standard-events": "/__shim/standard-events.js",
}

/** Adds the platform specifiers to the page's single import map; creates the map when the page has none. */
export function injectPlatformImports(html: string): string {
  const pattern = /(<script\b[^>]*type=["']importmap["'][^>]*>)([\s\S]*?)(<\/script>)/i
  const found = html.match(pattern)
  if (found) {
    const map = JSON.parse(found[2]!.trim() || "{}")
    map.imports = { ...PLATFORM_IMPORTS, ...(map.imports ?? {}) }
    return html.replace(pattern, (_whole, open: string, _body: string, close: string) => `${open}${JSON.stringify(map)}${close}`)
  }
  return html.replace(/<head\b[^>]*>/i, (head) => `${head}<script type="importmap">${JSON.stringify({ imports: PLATFORM_IMPORTS })}</script>`)
}

export async function serveTheme(options: ServeThemeOptions): Promise<ThemeServer> {
  const routes = options.routes ?? DEFAULT_THEME_ROUTES
  let lines: CartLineState[] = []
  let note: string | null = null
  let sequence = 0

  // Form state of the next GET, set by a POST to /contact (one use).
  let formState: Record<string, unknown> = {}

  const variantOf = (id: number) => {
    for (const product of PRODUCTS) for (const variant of product.variants) if (variant.id === id) return { product, variant }
    throw new Error(`shim cart: unknown variant ${id}`)
  }
  const cartDrop = () => {
    const items = lines.map((line) => {
      const { product, variant } = variantOf(line.variantId)
      return {
        key: line.key,
        quantity: line.quantity,
        product,
        variant,
        url: `${product.url}?variant=${variant.id}`,
        image: variant.image ?? product.featured_image,
        final_line_price: variant.price * line.quantity,
        original_line_price: (variant.compare_at_price ?? variant.price) * line.quantity,
        properties: {},
        url_to_remove: `/cart/change?id=${encodeURIComponent(line.key)}&quantity=0`,
      }
    })
    const cents = items.reduce((sum, item) => sum + item.final_line_price, 0)
    return { item_count: items.reduce((sum, item) => sum + item.quantity, 0), note, items, items_subtotal_price: cents, total_price: cents }
  }
  const money = (cents: number) => ({ amount: (cents / 100).toFixed(2), currencyCode: "USD" })
  const summary = () => {
    const drop = cartDrop()
    if (drop.items.length === 0) return null
    return {
      id: "gid://shopify/Cart/c1",
      totalQuantity: drop.item_count,
      cost: { subtotalAmount: money(drop.items_subtotal_price), totalAmount: money(drop.total_price) },
      lines: {
        nodes: drop.items.map((item) => ({
          id: item.key,
          quantity: item.quantity,
          cost: { subtotalAmount: money(item.original_line_price), totalAmount: money(item.final_line_price) },
        })),
      },
      discountCodes: [],
    }
  }
  const add = (variantId: number, quantity: number) => {
    variantOf(variantId)
    const existing = lines.find((line) => line.variantId === variantId)
    if (existing) existing.quantity += quantity
    else lines.push({ key: `${variantId}:rpline${++sequence}`, variantId, quantity })
  }
  const setQuantity = (key: string, quantity: number) => {
    const line = lines.find((entry) => entry.key === key)
    if (line) line.quantity = quantity
    lines = lines.filter((entry) => entry.quantity > 0)
  }
  const numericVariant = (value: unknown) => Number(String(value).replace(/^gid:\/\/shopify\/ProductVariant\//, ""))

  const readBody = (req: import("node:http").IncomingMessage) =>
    new Promise<string>((resolve) => {
      let body = ""
      req.on("data", (chunk) => (body += chunk))
      req.on("end", () => resolve(body))
    })
  // Reads urlencoded and multipart/form-data text fields into name/value pairs, in document order.
  const formFields = (body: string, contentType: string): Array<[string, string]> => {
    const boundary = contentType.match(/boundary=(.+)$/)?.[1]
    if (!boundary) return [...new URLSearchParams(body).entries()]
    const out: Array<[string, string]> = []
    for (const part of body.split(`--${boundary}`)) {
      const match = part.match(/name="([^"]*)"\r\n\r\n([\s\S]*?)\r\n$/)
      if (match) out.push([match[1]!, match[2]!])
    }
    return out
  }

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://127.0.0.1")
      const path = decodeURIComponent(url.pathname)
      const send = (status: number, type: string, body: string | Buffer, headers: Record<string, string> = {}) => {
        res.writeHead(status, { "content-type": type, "cache-control": "no-store", ...headers })
        res.end(body)
      }
      const redirect = (to: string) => send(303, "text/plain", "", { location: to })

      if (path === "/__shim/standard-actions.js") return send(200, TYPES[".js"]!, STANDARD_ACTIONS_SERVER_EMULATION)
      if (path === "/__shim/partial-rendering.js") return send(200, TYPES[".js"]!, PARTIAL_RENDERING_EMULATION)
      if (path === "/__shim/standard-events.js") return send(200, TYPES[".js"]!, STANDARD_EVENTS_EMULATION)
      if (path === "/__shim/cart") {
        if (req.method === "POST") {
          const payload = JSON.parse((await readBody(req)) || "{}")
          for (const line of payload.lines ?? []) {
            if (line.id) setQuantity(String(line.id), Number(line.quantity))
            else add(numericVariant(line.merchandiseId), Number(line.quantity ?? 1))
          }
          if (typeof payload.note === "string") note = payload.note
        }
        return send(200, TYPES[".json"]!, JSON.stringify({ cart: summary() }))
      }
      if (path.startsWith("/assets/")) {
        const file = join(options.themeRoot, "assets", normalize(path.slice("/assets/".length)).replace(/^(\.\.[/\\])+/, ""))
        try {
          return send(200, TYPES[extname(file)] ?? "application/octet-stream", await readFile(file))
        } catch {
          return send(404, "text/plain", "not found")
        }
      }
      if (req.method === "POST" && path === "/cart/add") {
        const fields = formFields(await readBody(req), req.headers["content-type"] ?? "")
        const get = (name: string) => fields.find(([key]) => key === name)?.[1]
        add(numericVariant(get("id")), Number(get("quantity") ?? 1))
        return redirect("/cart")
      }
      if (req.method === "POST" && (path === "/cart" || path === "/cart/update")) {
        const fields = formFields(await readBody(req), req.headers["content-type"] ?? "")
        const updates = fields.filter(([key]) => key === "updates[]").map(([, value]) => Number(value))
        const keys = lines.map((line) => line.key)
        updates.forEach((quantity, index) => keys[index] !== undefined && setQuantity(keys[index]!, quantity))
        const noteField = fields.find(([key]) => key === "note")
        if (noteField) note = noteField[1]
        return redirect(fields.some(([key]) => key === "checkout") ? "/checkout" : "/cart")
      }
      if (path === "/cart/change") {
        setQuantity(url.searchParams.get("id") ?? "", Number(url.searchParams.get("quantity") ?? 0))
        return redirect("/cart")
      }
      if (req.method === "POST" && path === "/localization") {
        const fields = formFields(await readBody(req), req.headers["content-type"] ?? "")
        return redirect(fields.find(([key]) => key === "return_to")?.[1] || "/")
      }
      if (req.method === "POST" && path === "/contact") {
        const fields = formFields(await readBody(req), req.headers["content-type"] ?? "")
        const get = (name: string) => fields.find(([key]) => key === name)?.[1]
        const type = get("form_type") === "customer" ? "customer" : "contact"
        formState = { [type]: { posted: true, email: get("contact[email]") ?? null, name: get("contact[name]") ?? null, body: get("contact[body]") ?? null } }
        return redirect(req.headers.referer ? new URL(req.headers.referer).pathname : "/")
      }
      if (req.method === "POST" && path === "/password") {
        await readBody(req)
        return redirect("/")
      }
      if (path === "/checkout") return send(200, "text/html; charset=utf-8", "<!doctype html><title>Checkout</title><h1>Checkout</h1>")

      let route = routes.find((entry) => entry.pattern.test(path)) ?? NOT_FOUND_ROUTE
      let scope = route.scope ? route.scope(path.match(route.pattern)!, url.searchParams) : {}
      if (scope === null) {
        route = NOT_FOUND_ROUTE
        scope = {}
      }
      const state = formState
      formState = {}
      const shim = createShim(options.themeRoot, {
        ...options,
        globals: {
          cart: cartDrop(),
          content_for_header: `<script src="/__shim/standard-actions.js"></script>`,
          request: { locale: { iso_code: "en", root_url: "/", direction: "ltr" }, design_mode: false, path },
          current_page: Number(url.searchParams.get("page")) || 1,
          current_query: url.searchParams.toString(),
          form_state: state,
          ...(options.globals ?? {}),
        },
      })
      const html = await shim.renderPage(route.template, scope)
      return send(route.status ?? 200, "text/html; charset=utf-8", injectPlatformImports(html))
    } catch (error) {
      res.writeHead(500, { "content-type": "text/plain" })
      res.end(String((error as Error).stack ?? error))
    }
  })
  await new Promise<void>((resolve) => server.listen(options.port ?? 0, "127.0.0.1", resolve))
  const { port } = server.address() as { port: number }
  return {
    url: `http://127.0.0.1:${port}`,
    resetCart: () => {
      lines = []
      note = null
      sequence = 0
      formState = {}
    },
    close: () => new Promise((resolve) => server.close(() => resolve())),
  }
}
```

Behaviour:

| Request | Response |
|---|---|
| a path matching a route | the template rendered inside its layout (4.4 `layout`); `cart` is the current cart drop; `content_for_header` is `<script src="/__shim/standard-actions.js"></script>`; `request.path` is the URL path; `request.page_type` and `template.name` are the template name up to its first dot; `current_page` is the `page` query parameter; the three platform specifiers are merged into the page's import map |
| `/` | `index` |
| `/products/<handle>` | `product` with `product` set; `?variant=<id>` selects that variant; an unknown handle renders `404` |
| `/recommendations/products` | `product` with `recommendations` set to `{ performed: true, products: [<two products>] }` |
| `/collections` | `list-collections` |
| `/collections/<handle>` | `collection`; honours `sort_by` (`manual`, `price-ascending`), `filter.v.availability`, `filter.v.price.gte`, `filter.v.price.lte` and `page` |
| `/cart` | `cart` |
| `/search?q=<terms>` | `search` with `search.terms`, `search.performed`, `search.results`, `search.results_count` (title match on the catalogue) |
| `/blogs/<blog>` | `blog` with `blog.title`, `blog.url`, `blog.articles` |
| `/blogs/<blog>/<article>` | `article` |
| `/pages/contact` | `page.contact` (matched before `/pages/<handle>`) |
| `/pages/<handle>` | `page` |
| `/password` | `password` (its layout is `password` through the template's `{% layout 'password' %}`) |
| `/gift_cards/<id>` | `gift_card` with `gift_card` set |
| any other page path | the `404` template inside the layout, status `404` |
| `GET /assets/<file>` | the file from `<themeRoot>/assets/` |
| `POST /cart/add` (`id`, `quantity`; urlencoded or multipart) | adds the variant; `303` to `/cart` |
| `POST /cart` or `POST /cart/update` (`updates[]` in line order, `note`, `checkout`) | sets quantities and note; `303` to `/checkout` when a `checkout` field is present, otherwise to `/cart` |
| `GET /cart/change?id=<key>&quantity=<n>` | sets one line; `303` to `/cart` |
| `POST /localization` | `303` to the `return_to` field (default `/`); the country and language do not change |
| `POST /contact` | `303` to the path of the `Referer` header (default `/`); the next page render, and only that one, has `form_state.<form_type>` = `{ posted: true, email, name, body }`, so `form.posted_successfully?` is true once |
| `POST /password` | `303` to `/` |
| `GET` or `POST /__shim/cart` | JSON `{ "cart": <summary or null> }`; `POST` applies `{ lines, note }` in the Standard Actions payload shape of `fake-sa.js`. The summary has `cost.subtotalAmount` and `cost.totalAmount` on the cart and on each line |
| `GET /__shim/standard-actions.js`, `/__shim/partial-rendering.js`, `/__shim/standard-events.js` | the emulations |

Rules:

- **ST-1** The server is a test double. It MUST NOT be exported from any entry other than `<pkg>/testing`, and no file outside `test/`, `evals/` and `src/testing/` may import it.
- **ST-2** `STANDARD_ACTIONS_SERVER_EMULATION` differs from `05-commerce.md`'s `fake-sa.js` only in where the cart lives (the server instead of the page). Tests C-01 to C-08 of `05-commerce.md` use `fake-sa.js` unchanged (`test/support/fake-sa.js`); tests that render a whole theme use `serveTheme`.
- **ST-3** The catalogue is `product.basic`, `product.sale`, `product.sold-out` and `product.options` of `resources.ts`. `product.basic` and `product.options` share the handle `linen-shirt` (doc 11 section 0.5); `/products/linen-shirt` and every listing serve `product.options`. A theme template that needs other data receives it through `routes[].scope`.
- **ST-4** `PARTIAL_RENDERING_EMULATION` implements the SPIKE-02 default path: a region is the element carrying `data-rp-region="<partial name>"`. See [Fallback (SPIKE-02)](#fallback-spike-02).
- **ST-5** Not run for this document: a real `ripple.js` commerce element against this server (no such file exists yet). The first test to do so is C-01 in `test/commerce/liquid.test.ts` re-run through `serveTheme` as `[T5] cart: theme server add-to-cart updates the count and the lines region`; it is the gate for this file.
- **ST-6** `STANDARD_EVENTS_EMULATION` exports `createViewEventElement()` and `PageViewEvent`. Constructing a `PageViewEvent` appends `["pageView", init]` to `window.__log`. The event type string of the real class is UNVERIFIED (SPIKE-02); a test MUST read `window.__log` and MUST NOT listen for an event type.

### 4.6 Tests of the shim and the server

`test/liquid/shim.test.ts` MUST contain these tests. The first seven were run in the spike against the earlier form of the two modules; all are NOT RUN against the form above.

| Name | Assertion |
|---|---|
| `[T1] liquid-shim: filters` | `{{ image \| image_url: width: 800 }}` on `image.basic` (liquid side) prints `//cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?v=1700000000&width=800`; `{{ 4800 \| money }}` prints `$48.00`; `{{ 5 \| divided_by: 2.0 }}` prints `2.5`; `{{ 7 \| modulo: 4 }}` prints `3`; `{{ 2.6 \| round }}` prints `3`; `{{ 'abc' \| remove: 'b' }}` prints `ac`; `{{ 'a b' \| url_encode }}` prints `a+b`; `{{ '2026-06-01T09:00:00Z' \| date: format: 'date' }}` prints `2026-06-01`; `{{ '2026-06-01T09:00:00Z' \| date: '%Y' }}` prints `2026`; `font_face` on `{ family: "Inter", "system?": false }` prints `@font-face { font-family: "Inter"; }` and on a font with `system?` true prints nothing; every name of `SHIM_FILTERS` renders without `undefined filter`; `money_with_currency` and `upcase` reject with `undefined filter`; `{{ 'ripple.nope.key' \| t }}` rejects with `missing translation`; `image_url` without a size rejects with `width or height` |
| `[T1] liquid-shim: tags outside the union throw` | `{% raw %}`, `{% stylesheet %}`, `{% javascript %}`, `{% include 'x' %}` and `{% increment n %}` each reject with `not found`; every name of `SHIM_TAGS` parses |
| `[T1] liquid-shim: partial renders its body and records the name` | body printed unchanged; `shim.partials` equals `["rp-cart-lines"]` |
| `[T1] liquid-shim: block tag is rejected inside blocks and snippets` | rendering a block file that contains `{% block %}` rejects with `'block' tag used outside templates/ and layout/` |
| `[T1] liquid-shim: renderPage wraps the template in the layout` | output contains `<html` and the template body |
| `[T1] liquid-shim: layout tag selects the layout` | a template starting with `{% layout 'password' %}` is rendered inside `layout/password.liquid` and not inside `layout/theme.liquid`; a template with `{% layout none %}` is rendered with no layout; `{{ template.name }}` in `templates/page.contact.liquid` prints `page` |
| `[T1] liquid-shim: paginate exposes previous and next` | with a three-item array, `by 2` and `current_page` 2: the body's loop prints one item; `paginate.pages` is 2; `paginate.items` is 3; `paginate.previous.url` is `request.path` without a `page` parameter; `paginate.next` is nil. With `current_page` 1: `paginate.next.url` ends with `page=2` and `paginate.previous` is nil |
| `[T1] liquid-shim: form types print hidden inputs` | for each of `product`, `cart`, `localization`, `customer`, `contact`, `storefront_password`: the output is one `form` with `method="post"`, the route of 4.4, the given `id` and `class`, and hidden inputs `form_type` (value: the type) and `utf8`; `localization` also has `_method` and `return_to`; a named argument other than `id`, `class`, `return_to` rejects with `is not allowed`; an unknown type rejects with `form shim supports` |
| `[T1] liquid-shim: members ending in a question mark` | `{% if form.posted_successfully? %}` is true with `form_state.contact.posted` true and false without it; `{% if f.system? %}` follows the `system?` key of `f`. When a later `liquidjs` version stops parsing these, the shim MUST rewrite `.<name>?` to `.<name>__q` in the source before parsing and expose both keys; this test is the tripwire |
| `[T1] liquid-shim: standard_event_data returns the fixed JSON` | `{{ x \| standard_event_data: 'view', context: 'page' }}` prints `{"shim":"standard_event_data"}` |
| `[T1] serve-theme: injectPlatformImports merges into the single import map` | exactly one `importmap` script; it contains the theme's entries and the three platform entries; a page with no map gets one as the first child of `<head>` |
| `[T1] serve-theme: routes` | against `test/fixtures/theme-min/` extended with one-line templates: every row of the behaviour table of 4.5 answers with the stated template and status; an unmatched path has status `404` and contains the layout's `<html` |
| `[T6] serve-theme: add by form post then remove by link with scripting disabled` | after submitting the product form the URL path is `/cart` and one `[data-rp-line]` exists; after following the remove link none exists |
| `[T5] serve-theme: emulated Standard Actions and partial rendering` | `Shopify.actions.updateCart({ lines: [{ merchandiseId, quantity: 2 }] })` resolves with `cart.totalQuantity === 2`; `partials.apply(await partials.fetch("rp-cart-lines"))` leaves one `[data-rp-line]`; no console error |
| `[T5] serve-theme: one page view per document load` | on the Ripple theme (`pnpm build` output), for each of `/`, `/products/linen-shirt`, `/collections/summer`, `/cart`: after `settled(page)`, `window.__log` contains exactly one `pageView` entry (D-089). With the commerce config element's `analytics` set to `false` it contains none. The entry's `init.page.template` equals the route's template name up to its first dot (read from `data-template` on `<main>`, D-089); nothing else of `init` is asserted (the `standard_event_data` payload is the shim's fixed JSON) |

### 4.7 `index.ts` (complete)

```ts
export * from "./canonicalize"
export * from "./fixtures"
export * from "./resources"
export * from "./upgrade-diff"
export * from "./liquid-shim"
export * from "./serve-theme"
```

`<pkg>/testing` therefore exports `serveTheme`, `createShim`, `RESOURCES`, `loadFixtures`, `loadBlueprintSample`, `upgradeDiff` and `canonicalize` by name (D-104 item 4). It MUST be importable in Node with no DOM globals and without `playwright` installed (`01-architecture.md` 6.4 rule 1, test A-05): the only Playwright import in these files is `import type`.

---

## 5. Browser support code (`test/support/`)

Files under `test/` may import values from `playwright`; they are not subject to the import rules of `src/`.

### 5.1 `browser.ts` (complete; the functions were RUN in the spike as `src/harness.ts` with `createRequire` in place of the static import)

```ts
import { after } from "node:test"
import { chromium, firefox, webkit, type Browser, type BrowserContext, type Page } from "playwright"

export type Engine = "chromium" | "webkit" | "firefox"
export type ScriptMode = "on" | "disabled" | "blocked"

export const engine = (): Engine => (process.env.RIPPLE_ENGINE as Engine | undefined) ?? "chromium"

let browser: Promise<Browser> | undefined

/** Starts the browser on first use. Closed by the after() hook below. */
export function getBrowser(): Promise<Browser> {
  browser ??= { chromium, webkit, firefox }[engine()].launch()
  return browser
}

after(async () => {
  if (browser) await (await browser).close()
})

export interface OpenedPage {
  context: BrowserContext
  page: Page
  /** pageerror and console.error messages, in order. */
  errors: string[]
  close(): Promise<void>
}

export interface OpenPageOptions {
  /** "on": scripts run. "disabled": the context has JavaScript off. "blocked": every ripple*.js request is aborted. Default "on". */
  scripts?: ScriptMode
  /** Default 1280 by 720. */
  viewport?: { width: number; height: number }
  /** Default "reduce". Tests of motion pass "no-preference". */
  reducedMotion?: "reduce" | "no-preference"
}

export async function openPage(options: OpenPageOptions = {}): Promise<OpenedPage> {
  const scripts = options.scripts ?? "on"
  const context = await (await getBrowser()).newContext({
    viewport: options.viewport ?? { width: 1280, height: 720 },
    javaScriptEnabled: scripts !== "disabled",
    reducedMotion: options.reducedMotion ?? "reduce",
    locale: "en-US",
    timezoneId: "UTC",
  })
  if (scripts === "blocked") await context.route(/\/ripple[^/]*\.js(\?.*)?$/, (route) => route.abort())
  const page = await context.newPage()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console.error: ${message.text()}`)
  })
  return { context, page, errors, close: () => context.close() }
}

/** Resolves when every ui-* and rp-* tag in the document is defined (2 s cap each) and two animation frames have passed. */
export async function settled(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const tags = new Set<string>()
    for (const el of Array.from(document.querySelectorAll("*"))) {
      if (el.localName.startsWith("ui-") || el.localName.startsWith("rp-")) tags.add(el.localName)
    }
    await Promise.all(Array.from(tags).map((tag) => Promise.race([customElements.whenDefined(tag), new Promise((resolve) => setTimeout(resolve, 2000))])))
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))))
  })
}
```

- **B-1** "Scripts disabled" means `javaScriptEnabled: false`. "Scripts blocked" means scripting is enabled and every request whose path matches `/ripple[^/]*\.js` is aborted; this simulates a failed download (Ben decision 2: "script failure == no script"). In blocked mode `openPage` records one `console.error` per aborted request; tests in blocked mode filter those messages (`errors.filter((e) => !e.includes("net::ERR_FAILED"))`) before asserting.
- **B-2** With `scripts: "disabled"`, `page.evaluate` still works (Playwright evaluates through the debugger), so a test can read boxes and computed styles. It MUST NOT use `page.evaluate` to change the page in a no-JS test; it interacts only with `page.click`, `page.fill`, `page.press`, `page.selectOption`, `page.goto`.
- **B-3** The default viewport is 1280 by 720. "Narrow" is 375 by 720. No other viewport is used unless a specification names it (RP608 uses 375, 768, 1440).

### 5.2 The fixture page

Every case can be opened as a page at `fixturePageUrl(id, options)`. The page is exactly this document, with the placeholders replaced:

```html
<!doctype html>
<html lang="en" dir="{dir}" data-scheme="{scheme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{fixture id}</title>
<link rel="stylesheet" href="{css href}">
{commerce head}
{script tag}
</head>
<body>
<main id="rp-test-root">
{reference HTML}
</main>
</body>
</html>
```

| Placeholder | Value |
|---|---|
| `{dir}` | query `dir`: `ltr` (default) or `rtl` |
| `{scheme}` | query `scheme`: `light` (default) or `dark` |
| `{css href}` | query `css`: `ripple` (default) gives `/pkg/browser/ripple.css`; `tailwind` gives `/__test/tailwind.css` |
| `{script tag}` | query `js`: `on` (default) gives `<script type="module" src="/pkg/browser/ripple.elements.js"></script>` for a component of kind `static`, `native` or `ui`, and `<script type="module" src="/pkg/browser/ripple.js"></script>` for kind `commerce`; `off` gives nothing |
| `{commerce head}` | kind `commerce` only, otherwise empty: `<script src="/__test/fake-sa.js"></script>` followed by `<script type="application/json" id="rp-commerce">{"host":"html","cartEndpoint":"/api/cart","cartUrl":"/cart","initialCart":{"cart":null}}</script>` (the config element of D-087 and `05-commerce.md` 10.1; `cartDrawer` and `analytics` are absent and take their defaults `cart-drawer` and `true`; `strings` is omitted, so the adapter's built-in English texts apply) |
| `{reference HTML}` | the content of `components/<id>/fixtures/<name>.html`, unchanged |

- **P-1** The page contains nothing else: no reset, no extra wrapper, no inline style. `ripple.css` alone styles it (D-030).
- **P-2** `js=off` is used with a context in any script mode; `js=on` with `scripts: "disabled"` or `"blocked"` is how tier 6 is run (the script tag is present, as on a real page, but never executes).

### 5.3 `server.ts`

`getFixtureServer(): Promise<{ url: string }>` starts one HTTP server per test file on first use (port 0, host `127.0.0.1`) and closes it in an `after()` hook, in the same lazy way as `getBrowser()`. `fixturePageUrl(id: string, options?: { js?: "on" | "off"; css?: "ripple" | "tailwind"; dir?: "ltr" | "rtl"; scheme?: "light" | "dark" }): Promise<string>` returns `<server url>/fixture/<component id>/<fixture name>?<query>`.

Routes (every response has `cache-control: no-store`):

| Request | Response |
|---|---|
| `GET /fixture/<component id>/<fixture name>` | the page of 5.2; `404` for an unknown case |
| `GET /pkg/<path>` | the file `pkg/<path>`; content type by extension (`.js` and `.mjs`: `text/javascript`; `.css`: `text/css`; `.json`: `application/json`; `.svg`: `image/svg+xml`; `.html`: `text/html; charset=utf-8`) |
| `GET /__test/in-page.js` | `node_modules/.cache/ripple/test/in-page.js` (5.5) |
| `GET /__test/axe.js` | `node_modules/axe-core/axe.min.js` |
| `GET /__test/fake-sa.js` | `test/support/fake-sa.js` |
| `GET /__test/tailwind.css` | the Tailwind build described below |
| `GET /api/cart` | `200`, `application/json`, body `{"cart":null}` |
| `POST /api/cart` with `content-type: application/json` | `200`, body `{"cart":null}` |
| `POST /api/cart` otherwise | `303` with `location` equal to the request's `Referer` header, or `/cart` when there is none |
| `GET /cart` | `200`, `<!doctype html><title>Cart</title><h1>Cart</h1>` |
| anything else | `404` |

The path traversal guard is the one of `serve-theme.ts` (`normalize(...).replace(/^(\.\.[/\\])+/, "")`).

Tailwind build for `css=tailwind` (used by CA-7 of `09-components-foundation.md` and A-12 of `03-styling-and-tokens.md`): on the first request the server runs, once per process, `pnpm exec tailwindcss -i test/support/tailwind-entry.css -o node_modules/.cache/ripple/test/tailwind.css` and serves the output. `test/support/tailwind-entry.css` is exactly (the verified entry of `03-styling-and-tokens.md` 5.2 with paths into `pkg/`):

```css
@import "../../pkg/browser/ripple.css";
@import "tailwindcss";
@import "../../pkg/css/theme.css";
```

NOT RUN for this document: `server.ts` itself. Its routes are exercised by every tier 3, 5 and 6 test; `[T3] tabs/default: zero unpermitted mutations at upgrade` is the first gate.

### 5.4 `collect.ts` (complete; NOT RUN in this form: the spike ran an inline version of `collectBoxes` that returned tuples without `root` and `js`; `collectStyles` NOT RUN)

Both functions run in the page through `page.evaluate(fn, arg)` and MUST stay self-contained.

```ts
/** Property list of the style snapshot (14). Order is the order in the snapshot files. */
export const STYLE_PROPERTIES = [
  "display", "position", "visibility", "opacity", "z-index",
  "flex-direction", "flex-wrap", "align-items", "justify-content", "row-gap", "column-gap",
  "padding-block-start", "padding-block-end", "padding-inline-start", "padding-inline-end",
  "margin-block-start", "margin-block-end", "margin-inline-start", "margin-inline-end",
  "border-block-start-width", "border-block-end-width", "border-inline-start-width", "border-inline-end-width",
  "border-block-start-style", "border-block-start-color",
  "border-start-start-radius", "border-end-end-radius",
  "background-color", "color", "box-shadow",
  "font-size", "font-weight", "line-height", "letter-spacing", "text-align", "text-transform", "text-decoration-line",
  "min-block-size", "min-inline-size", "max-inline-size", "aspect-ratio", "object-fit",
  "outline-style", "outline-width", "outline-color", "outline-offset",
  "overflow-x", "overflow-y", "cursor", "transition-duration",
] as const

export type Box = {
  path: string
  x: number
  y: number
  width: number
  height: number
  display: string
  /** true when the element is a component root: its tag starts with "ui-" or "rp-", or it has a class in rootClasses */
  root: boolean
  /** true when the element is, or is inside, an element with the attribute data-rp-js */
  js: boolean
}

/** Bounding boxes (rounded to 0.5 CSS px) and computed display of the root element and every descendant. */
export function collectBoxes(arg: { rootSelector: string; rootClasses: string[] }): Box[] {
  const round = (value: number) => Math.round(value * 2) / 2
  const pathOf = (el: Element): string => {
    const parts: string[] = []
    for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
      const index = node.parentElement ? Array.prototype.indexOf.call(node.parentElement.children, node) + 1 : 1
      parts.unshift(node.id ? `${node.localName}#${node.id}` : `${node.localName}:nth-child(${index})`)
    }
    return parts.join(" > ")
  }
  const root = document.querySelector(arg.rootSelector)
  if (!root) return []
  return [root, ...Array.from(root.querySelectorAll("*"))].map((el) => {
    const box = el.getBoundingClientRect()
    return {
      path: pathOf(el),
      x: round(box.x),
      y: round(box.y),
      width: round(box.width),
      height: round(box.height),
      display: getComputedStyle(el).display,
      root:
        el.localName.startsWith("ui-") ||
        el.localName.startsWith("rp-") ||
        arg.rootClasses.some((name) => el.classList.contains(name)),
      js: el.closest("[data-rp-js]") !== null,
    }
  })
}

/** Computed values of `properties` for every element inside `rootSelector` that has a class token
 *  starting with "rp-" or a tag starting with "rp-" or "ui-", plus its ::before and ::after when they
 *  generate a box. Keys are element paths; pseudo-elements have the suffix "::before" or "::after". */
export function collectStyles(arg: { rootSelector: string; properties: string[] }): Record<string, Record<string, string>> {
  const pathOf = (el: Element): string => {
    const parts: string[] = []
    for (let node: Element | null = el; node && node !== document.body; node = node.parentElement) {
      const index = node.parentElement ? Array.prototype.indexOf.call(node.parentElement.children, node) + 1 : 1
      parts.unshift(node.id ? `${node.localName}#${node.id}` : `${node.localName}:nth-child(${index})`)
    }
    return parts.join(" > ")
  }
  const out: Record<string, Record<string, string>> = {}
  const read = (el: Element, pseudo: string | null): Record<string, string> => {
    const style = getComputedStyle(el, pseudo)
    const values: Record<string, string> = {}
    for (const property of arg.properties) values[property] = style.getPropertyValue(property)
    return values
  }
  const root = document.querySelector(arg.rootSelector)
  if (!root) return out
  for (const el of Array.from(root.querySelectorAll("*"))) {
    const owned = el.localName.startsWith("rp-") || el.localName.startsWith("ui-") || Array.from(el.classList).some((name) => name.startsWith("rp-"))
    if (!owned) continue
    const path = pathOf(el)
    out[path] = read(el, null)
    for (const pseudo of ["::before", "::after"]) {
      const content = getComputedStyle(el, pseudo).getPropertyValue("content")
      if (content !== "none" && content !== "normal" && content !== "") out[`${path}${pseudo}`] = read(el, pseudo)
    }
  }
  return out
}
```

### 5.5 `in-page.ts`: `checkPattern` in the page (complete, RUN)

`checkPattern(root: Element, pattern: Pattern): Promise<void>` from `@ui-sdk/core/testing` needs a DOM and throws one `Error` whose message lists every problem (`uisdk/packages/core/src/testing/check-pattern.ts`). `Pattern` is one of `listbox`, `menu`, `menubar`, `tabs`, `radio-group`, `toolbar`, `tree`, `dialog`, `alertdialog`, `disclosure`, `accordion`, `combobox`, `slider`, `switch`, `checkbox`. The runner bundles this entry as an IIFE to `node_modules/.cache/ripple/test/in-page.js` on every run (2.6):

```ts
import { checkPattern } from "@ui-sdk/core/testing"
;(globalThis as any).__rpTesting = { checkPattern }
```

Use in a test (RUN on the Tabs fixture: returns an empty string):

```ts
await page.addScriptTag({ url: `${server.url}/__test/in-page.js` })
const problems = await page.evaluate(async ([selector, pattern]) => {
  try {
    await (window as any).__rpTesting.checkPattern(document.querySelector(selector as string), pattern)
    return ""
  } catch (error) {
    return String((error as Error).message)
  }
}, [selector, pattern])
assert.equal(problems, "")
```

- **IP-1** `@ui-sdk/core/testing` MUST be imported only by `test/support/in-page.ts` and by the checker's RP605 (`01-architecture.md` 2.3). It is marked experimental upstream; a UI SDK bump re-runs every `checkPattern` test (D-062).
- **IP-2** The in-page bundle contains its own copy of `@ui-sdk/core`. That is acceptable only because `checkPattern` reads the DOM and owns no primitive; the bundle MUST NOT import `@ui-sdk/web` or define any custom element.

---

## 6. Tier 1: generation and static checks

### 6.1 Commands

Tier 1 is three commands. All three MUST exit 0.

| Command | What it proves | Owner of the checks |
|---|---|---|
| `pnpm gen --check` | generated files are current; fixture lint; required fixtures; masks; resource references (RS-4); binding lint; CSS lint | `07-manifest-registry-cli.md` 3; `02-html-contract.md` 11.5, 11.8; `03-styling-and-tokens.md` 7.9; `06-bindings.md` 12 |
| `pnpm typecheck` | `tsc --noEmit` over `src`, `test`, `components/**/*.test.ts` | `01-architecture.md` 5.2 |
| `pnpm test:unit` | every `[T1]` test | the document that owns the tested module |

### 6.2 What is a tier 1 test

A test is `[T1]` when it needs neither `pkg/` nor a browser nor the network. Every `src/**/<name>.test.ts` for a pure module is `[T1]`: `canonicalize`, `responsive`, `architecture`, checker rules, CLI commands, generator modules, `fixtures`, `resources`, `liquid-shim`, `size`. A test in `src/elements/` or `src/commerce/` drives a browser and is `[T3]` or `[T5]`.

Tests this document adds to tier 1 (file, name, assertion):

| File | Name | Assertion |
|---|---|---|
| `src/testing/fixtures.test.ts` | `[T1] fixtures: tokenizeChildren and restoreChildren round-trip` | For the Tabs record of `02-html-contract.md` 11.9: fragments are `["Account", "Password", "<p>Manage your profile.</p>", "<p>Choose a new password.</p>"]`; the third part's `children` is `__RP_CHILDREN_2__`; `restoreChildren("<a>__RP_CHILDREN_0__</a><b>__RP_CHILDREN_1__</b>", ["x & $1", "<i>y</i>"], "t/x")` returns `<a>x & $1</a><b><i>y</i></b>`; a missing token throws `occurs 0 times` |
| `src/testing/fixtures.test.ts` | `[T1] fixtures: every fixture file has a record and every record a file` | `loadFixtures()` does not throw; for every component directory, the set of `fixtures/*.html` base names equals the set of fixture names |
| `src/testing/resources.test.ts` | `[T1] resources: both sides exist and clones are independent` | every entry has `hydrogen` and `liquid`; mutating a value returned by `resolveResource` does not change the next call's result; an unknown reference throws `unknown resource fixture` |
| `src/testing/fixtures.test.ts` | `[T1] fixtures: host-scoped fixtures are the allowed pairs` | For every record with a `hosts` key (D-074 item 7): the component is one of `cart-lines`, `cart-line`, `cart-summary`, `cart-note`, `checkout-button`, `cart-drawer`, `discount-code`; `hosts` is exactly `["html", "react", "remix"]` and the name does not start with `liquid-`, or `hosts` is exactly `["liquid"]` and the name is `liquid-<name>` where a record `<name>` with the other host list exists in the same component; every such `<name>` has its `liquid-<name>` |
| `src/testing/fixtures.test.ts` | `[T1] fixtures: host-scoped props are skipped` | `hostHasProp([{ name: "shop", type: "resource", hosts: ["html", "react", "remix"] }], "shop", "liquid")` is `false`, and `true` for `"react"`; an unknown prop name gives `true`; `liquidCaseSource` of a case with that prop does not contain `shop:` |
| `src/testing/fixtures.test.ts` | `[T1] fixtures: blueprint samples resolve` | for every directory `blueprints/<id>/` other than `_sample`: `loadBlueprintSample(id)` does not throw; `props` contains no `$resource` key at any depth; `liquid` contains no `$resource` and no `$liquid` key; `loadBlueprintSample("layout")` does not throw |
| `src/testing/resources.test.ts` | `[T1] resources: every $resource reference resolves and every resource is referenced` | the set of references found by `resourceRefs` over `loadFixtures()` plus every `$resource` value in `blueprints/_sample/*.json` is a subset of the keys of `RESOURCES` (a missing key fails with `unknown resource fixture`), and every key of `RESOURCES` is in that set (an unreferenced key fails with `resource "<name>" is not referenced by any fixture or blueprint sample`) |
| `src/testing/resources.test.ts` | `[T1] resources: the set is the documented set` | the keys of `RESOURCES` are exactly the 21 references of the table of 4.2, in that order |
| `src/testing/resources.test.ts` | `[T1] resources: values the worked fixtures depend on` | `product.basic` hydrogen `id` is `gid://shopify/Product/1`, `title` `Linen Shirt`, `price.amount` `48.00`; liquid `selected_or_first_available_variant.id` is `11`; `product.sale` hydrogen `compareAtPrice.amount` is `16.00`; `product.sold-out` hydrogen `availableForSale` is `false` and `featuredImage` is `null`; `cart.two-lines` hydrogen `totalQuantity` is 3 and `total.amount` is `108.00`; `cart.discounted` hydrogen `total.amount` is `97.20`; `line.basic` hydrogen `variantTitle` is `Blue / S` and liquid `key` is `11:abc`; `image.basic` hydrogen `url` is `https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg`, `width` 1600, `height` 2000; `image.no-alt` `altText` is `null` |
| `test/liquid/shim.test.ts` | the `[T1]` rows of 4.6 | as listed |
| `test/run.test.ts` | 6.3 | as listed |
| `test/conformance/acceptance-coverage.test.ts` | 18.2 | as listed |

### 6.3 `test/run.test.ts`

Each test spawns `process.execPath` with `["node_modules/.cache/ripple/test-run.mjs", ...args]` (the bundle exists because the test is running through it) and asserts the exit code and the last line of standard error.

| Name | Arguments | Expected |
|---|---|---|
| `[T1] run: unknown argument exits 2` | `--bogus` | exit 2; stderr ends with `test: unknown argument --bogus` |
| `[T1] run: unknown tier exits 2` | `--tiers=11` | exit 2; stderr contains `unknown tier 11` |
| `[T1] run: invalid component id exits 2` | `--tiers=1 --component=Bad` | exit 2; stderr contains `--component is not a component id: Bad` |
| `[T1] run: unknown engine exits 2` | `--tiers=1 --engine=ie` | exit 2; stderr contains `unknown engine ie` |

---

## 7. Tier 2: fixture conformance

Rule under test: for every case and every host of the case, `canonicalize(hostOutput, { mask }) === canonicalize(referenceHtml, { mask })` (`02-html-contract.md` K-11; `06-bindings.md` Q-1).

### 7.1 `test/conformance/conformance.test.ts` (complete, NOT RUN as a file; the adapters' mechanisms were RUN, 7.3 and 7.4)

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { canonicalize, loadFixtures } from "../../src/testing/index"
import { getHostRenderer } from "../support/hosts/index"

for (const testCase of loadFixtures()) {
  for (const host of testCase.hosts) {
    test(`[T2] ${testCase.id}: ${host} output equals the reference HTML`, async (t) => {
      const renderer = await getHostRenderer(host)
      if (renderer.unavailable) {
        t.skip(renderer.unavailable)
        return
      }
      const mask = testCase.fixture.mask
      const output = await renderer.render(testCase)
      // No message argument: node:assert then prints the line diff of the two canonical forms (K-11).
      assert.equal(canonicalize(output, { mask }), canonicalize(testCase.html, { mask }))
    })
  }
}
```

- **C-1** The test name carries the fixture id and the host; the assertion output is the line diff of the canonical forms. Together they satisfy the failure format of K-11.
- **C-3** `canonicalize` is imported from `src/testing/canonicalize.ts`, which is the reference code of `02-html-contract.md` section 12 (D-075). This document adds no canonicalisation step; the host-extras step of that section (which also removes the SPIKE-02 fallback wrapper) is part of `canonicalize`.
- **C-4** Host-scoped fixtures (D-074 item 7): where the form dialect forces different tags per backend, a state has two fixtures, `<name>` with `hosts: ["html", "react", "remix"]` and `liquid-<name>` with `hosts: ["liquid"]`. Only CartLines, CartLine, CartSummary, CartNote, CheckoutButton, CartDrawer and DiscountCode may scope a fixture by host; `[T1] fixtures: host-scoped fixtures are the allowed pairs` (6.2) enforces it.
- **C-5** Masks with op `drop-attr` or `remove` are exempt from rule F-19 of `02-html-contract.md` (they need not match anything in the reference HTML; D-074 item 5). Fixture lint check `pe-2` is skipped on the root element of Button and IconButton fixtures (D-074 item 8). Both exemptions are implemented in the fixture lint of `02-html-contract.md`, not here.
- **C-2** The number of `[T2] ...: <host> output equals the reference HTML` tests MUST equal the sum over all cases of the number of hosts of the case. `hosts.test.ts` asserts this count against `loadFixtures()` (`[T2] conformance: one test per case and host`), so that a silently empty loop cannot pass.

### 7.2 `test/support/hosts/index.ts` and `html.ts` (complete, NOT RUN)

```ts
// test/support/hosts/index.ts
import type { FixtureCase, Host } from "../../../src/testing/index"
import { createHtmlRenderer } from "./html"
import { createLiquidRenderer } from "./liquid"
import { createReactRenderer } from "./react"
import { createRemixRenderer } from "./remix"

export interface HostRenderer {
  /** Set when the host cannot run in this environment; the string is the skip reason. */
  unavailable?: string
  /** Returns the host's HTML for the case, with children restored (F-7), before canonicalisation. */
  render(testCase: FixtureCase): Promise<string>
}

const factories: Record<Host, () => Promise<HostRenderer>> = {
  html: createHtmlRenderer,
  react: createReactRenderer,
  remix: createRemixRenderer,
  liquid: createLiquidRenderer,
}
const renderers = new Map<Host, Promise<HostRenderer>>()

/** One renderer per host per test process, created on first use. */
export function getHostRenderer(host: Host): Promise<HostRenderer> {
  let renderer = renderers.get(host)
  if (!renderer) {
    renderer = factories[host]()
    renderers.set(host, renderer)
  }
  return renderer
}
```

```ts
// test/support/hosts/html.ts  (06-bindings.md Q-22; 02-html-contract.md F-21 to F-23)
import { readFileSync } from "node:fs"
import type { FixtureCase } from "../../../src/testing/index"
import type { HostRenderer } from "./index"

const MARKER = /^<!-- ripple:fixture ([a-z][a-z0-9]*(?:-[a-z0-9]+)*) -->$/
const TRAILER = /^<!-- ripple [a-z0-9-]+\/html /

/** Splits a reference file into fixture name and body. */
export function parseReferenceFile(text: string): Map<string, string> {
  const bodies = new Map<string, string>()
  let name: string | null = null
  let lines: string[] = []
  const flush = () => {
    if (name !== null) bodies.set(name, lines.join("\n").trim())
  }
  for (const line of text.split("\n")) {
    const marker = line.match(MARKER)
    if (marker) {
      flush()
      name = marker[1]!
      lines = []
    } else if (TRAILER.test(line)) {
      flush()
      name = null
    } else if (name !== null) {
      lines.push(line)
    }
  }
  flush()
  return bodies
}

export async function createHtmlRenderer(): Promise<HostRenderer> {
  const files = new Map<string, Map<string, string>>()
  return {
    async render(testCase: FixtureCase): Promise<string> {
      const id = testCase.component.name
      let bodies = files.get(id)
      if (!bodies) {
        bodies = parseReferenceFile(readFileSync(`components/${id}/html/${id}.html`, "utf8"))
        files.set(id, bodies)
      }
      const body = bodies.get(testCase.fixture.name)
      if (body === undefined) throw new Error(`${testCase.id}: no "<!-- ripple:fixture ${testCase.fixture.name} -->" section in components/${id}/html/${id}.html`)
      return body
    },
  }
}
```

### 7.3 Liquid adapter: `test/support/hosts/liquid.ts`

`liquidCaseSource` and `renderLiquidCase` (complete; RUN without the two additions marked FX-4 and RS-3, which are NOT RUN: the builder reproduces the hand-written templates of `ripple/docs/research/spikes/bindings/liquid/run.mjs`, and Button and Tabs conform through it. Gate for the additions: `[T1] fixtures: host-scoped props are skipped` and the `[T2]` Liquid cases of Header and CartCount):

```ts
// Liquid host adapter: builds the case template of docs/06-bindings.md Q-17 and renders it through the shim.
import type { ComponentEntry, FixtureCase, PartInstance, PropValue } from "../../../src/testing/fixtures"
import { LIQUID_GLOBAL_OF_TYPE, resolveResource } from "../../../src/testing/resources"
import { hostHasProp, resourceRefs, type PropEntry } from "../../../src/testing/fixtures"
import type { Shim } from "../../../src/testing/liquid-shim"

/** Liquid variable name for a resource reference: "product.basic" becomes "rp_product_basic". */
export const resourceVariable = (reference: string): string => `rp_${reference.replace(/[.-]/g, "_")}`

type PropDef = PropEntry
const snake = (name: string): string => name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

function literal(value: PropValue, def: PropDef | undefined): string {
  if (typeof value === "object") return resourceVariable(value.$resource)
  if (typeof value === "boolean") return value ? "true" : "false"
  if (typeof value === "number") return def?.type === "scale" ? `'${value}'` : String(value)
  if (value.includes("'") && value.includes('"')) throw new Error(`string prop with both quote characters (F-5): ${value}`)
  return value.includes("'") ? `"${value}"` : `'${value}'`
}

function args(props: Record<string, PropValue> | undefined, defs: PropDef[]): string {
  return Object.entries(props ?? {})
    .filter(([name]) => hostHasProp(defs, name, "liquid")) // FX-4
    .map(([name, value]) => {
      const def = defs.find((entry) => entry.name === name)
      return `, ${def?.liquid?.name ?? snake(name)}: ${literal(value, def)}`
    })
    .join("")
}

function partSource(component: ComponentEntry, part: PartInstance): string {
  const defs = component.parts?.find((entry) => entry.name === part.part)?.props ?? []
  const body = part.children ?? (part.parts ?? []).map((child) => partSource(component, child)).join("")
  return `{% block '${component.name}-${part.part}'${args(part.props, defs)} %}${body}{% endblock %}`
}

/** The Liquid source of one case (Q-17). */
export function liquidCaseSource(testCase: FixtureCase): string {
  const { component, fixture } = testCase
  if (component.liquid.tier === "snippet") return `{% render 'rp-${component.name}'${args(fixture.props, component.props)} %}`
  const body = fixture.children ?? (fixture.parts ?? []).map((part) => partSource(component, part)).join("")
  return `{% block '${component.name}'${args(fixture.props, component.props)} %}${body}{% endblock %}`
}

/** Renders one case. `shim` is created once per run over the work directory of Q-16. */
export async function renderLiquidCase(shim: Shim, testCase: FixtureCase): Promise<string> {
  const scope: Record<string, unknown> = {}
  for (const reference of resourceRefs(testCase.fixture)) {
    const value = resolveResource(reference, "liquid")
    scope[resourceVariable(reference)] = value
    // RS-3: cart, shop, locale and search resources also replace the Liquid global of their type for this render.
    const global = LIQUID_GLOBAL_OF_TYPE[reference.split(".")[0]!]
    if (global) scope[global] = value
  }
  return shim.renderTemplate(liquidCaseSource(testCase), scope, testCase.id.replace("/", "--"))
}
```

Add `createLiquidRenderer` to the same file (NOT RUN). It builds the work directory of `06-bindings.md` Q-16 and creates one shim:

```ts
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { createShim } from "../../../src/testing/liquid-shim"
import type { HostRenderer } from "./index"

export const LIQUID_WORK_DIR = "node_modules/.cache/ripple/test/liquid-theme"

/** Fills LIQUID_WORK_DIR from every components/<id>/liquid/ directory and returns its path. */
export function buildLiquidWorkDir(): string {
  rmSync(LIQUID_WORK_DIR, { recursive: true, force: true })
  for (const dir of ["blocks", "snippets", "templates", "layout", "locales", "config", "assets"]) mkdirSync(join(LIQUID_WORK_DIR, dir), { recursive: true })
  for (const id of readdirSync("components")) {
    for (const kind of ["blocks", "snippets"]) {
      const source = join("components", id, "liquid", kind)
      if (existsSync(source)) cpSync(source, join(LIQUID_WORK_DIR, kind), { recursive: true })
    }
  }
  cpSync("locales/en.default.json", join(LIQUID_WORK_DIR, "locales", "en.default.json"))
  writeFileSync(join(LIQUID_WORK_DIR, "layout", "theme.liquid"), "<!doctype html><html><head>{{ content_for_header }}</head><body>{{ content_for_layout }}</body></html>\n")
  writeFileSync(join(LIQUID_WORK_DIR, "config", "settings_schema.json"), "[]\n")
  return LIQUID_WORK_DIR
}

export async function createLiquidRenderer(): Promise<HostRenderer> {
  const shim = createShim(buildLiquidWorkDir())
  return { render: (testCase) => renderLiquidCase(shim, testCase) }
}
```

- **L-1** Children are passed as the literal block body (F-7); no token is used on Liquid.
- **L-2** A prop without `liquid.name` in the manifest uses the snake_case of its name (ledger 4.2).
- **L-3** Resources are bound as stated in RS-3. A prop whose manifest `hosts` excludes `liquid` is not passed (FX-4).
- **L-4** The work directory contains component blocks and snippets only. Blueprint files (`layout/*.liquid`, `templates/*.liquid`) are not conformance cases; they are tested as pages through `serveTheme` on the built theme (tiers 3 to 6) with the scope of `loadBlueprintSample` (FX-5). Cross-host comparison of blueprint output is test BT-3 of `12-components-chrome-and-blueprints.md`: it compares the CHILDREN of `<main>`; the `<main>` start tag is not compared, because only the Liquid layout prints `data-template` on it (D-089 item 6).

### 7.4 React and Remix adapters

Shared generator `test/support/hosts/tsx.ts` (complete; RUN without the FX-4 filter, which is NOT RUN: a generated module was bundled with esbuild, rendered with `react-dom/server`, and conformed after `restoreChildren`):

```ts
// Shared by the React and Remix adapters: turns fixtures into one TSX module of render functions.
import type { ComponentEntry, FixtureCase, PartInstance, PropEntry, PropValue } from "../../../src/testing/fixtures"
import { hostHasProp, tokenizeChildren } from "../../../src/testing/fixtures"

const pascal = (id: string): string => id.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("")

function attributes(props: Record<string, PropValue> | undefined, defs: PropEntry[] | undefined, host: "react" | "remix"): string {
  return Object.entries(props ?? {})
    .filter(([name]) => hostHasProp(defs, name, host)) // FX-4
    .map(([name, value]) => {
      const key = name === "class" && host === "react" ? "className" : name
      if (typeof value === "object") return ` ${key}={RES[${JSON.stringify(value.$resource)}]}`
      return ` ${key}={${JSON.stringify(value)}}`
    })
    .join("")
}

function partJsx(component: ComponentEntry, part: PartInstance, host: "react" | "remix"): string {
  const tag = `${component.title}${pascal(part.part)}`
  const body = part.children !== undefined ? `{${JSON.stringify(part.children)}}` : (part.parts ?? []).map((child) => partJsx(component, child, host)).join("")
  const defs = component.parts?.find((entry) => entry.name === part.part)?.props
  return `<${tag}${attributes(part.props, defs, host)}>${body}</${tag}>`
}

/** JSX for one case, with children already replaced by tokens. */
export function caseJsx(testCase: FixtureCase, host: "react" | "remix"): { jsx: string; fragments: string[] } {
  const { fixture, fragments } = tokenizeChildren(testCase.fixture)
  const tag = testCase.component.title
  const body = fixture.children !== undefined ? `{${JSON.stringify(fixture.children)}}` : (fixture.parts ?? []).map((part) => partJsx(testCase.component, part, host)).join("")
  const attrs = attributes(fixture.props, testCase.component.props, host)
  const jsx = body === "" ? `<${tag}${attrs} />` : `<${tag}${attrs}>${body}</${tag}>`
  return { jsx, fragments }
}

/** Source of the generated module `cases.tsx` written into the adapter's work directory.
 *  It exports `cases`: fixture id to a function returning the JSX node. */
export function caseModuleSource(cases: FixtureCase[], host: "react" | "remix"): string {
  const components = [...new Map(cases.map((testCase) => [testCase.component.name, testCase.component])).values()]
  const imports = components.map((component) => `import * as ${pascal(component.name)}Module from "./${component.name}";`).join("\n")
  const names = components
    .map((component) => {
      const exported = [component.title, ...(component.parts ?? []).map((part) => `${component.title}${pascal(part.name)}`)]
      return `const { ${exported.join(", ")} } = ${pascal(component.name)}Module as any;`
    })
    .join("\n")
  const entries = cases.map((testCase) => `  ${JSON.stringify(testCase.id)}: () => ${caseJsx(testCase, host).jsx},`).join("\n")
  return `${imports}\nimport { RES } from "./resources";\n${names}\nexport const cases: Record<string, () => unknown> = {\n${entries}\n};\n`
}
```

The children placeholder mechanism (owned here, `02-html-contract.md` F-7):

1. `tokenizeChildren` replaces every `children` string by the token `__RP_CHILDREN_<n>__` (root first, then parts depth-first).
2. The adapter passes each token as a plain string child. React and Remix escape text, and the token contains no character that escaping changes.
3. After rendering, `restoreChildren` replaces each token by its original fragment. A token that does not occur exactly once fails the case with `children token __RP_CHILDREN_<n>__ occurs <k> times in the host output (expected 1)`: this catches a binding that drops or duplicates its children.
4. A binding MUST therefore render `children` exactly once and MUST NOT inspect, wrap or transform them.

`test/support/hosts/react.ts` (complete, NOT RUN as a file; steps are `06-bindings.md` Q-6 and Q-8):

```ts
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { build } from "esbuild"
import { PKG_NAME } from "../../../src/identity"
import { loadFixtures, RESOURCES, restoreChildren, type FixtureCase } from "../../../src/testing/index"
import type { HostRenderer } from "./index"
import { caseJsx, caseModuleSource } from "./tsx"

export const REACT_WORK_DIR = "examples/react/.ripple-conformance"

/** Copies every components/<id>/<host>/*.tsx and *.data.ts flat into `workDir`, with __PKG__ resolved, and writes resources.ts and cases.tsx. */
export function writeTsxWorkDir(workDir: string, host: "react" | "remix", cases: FixtureCase[]): void {
  rmSync(workDir, { recursive: true, force: true })
  mkdirSync(workDir, { recursive: true })
  for (const id of readdirSync("components")) {
    const source = join("components", id, host)
    if (!existsSync(source)) continue
    for (const file of readdirSync(source)) {
      if (file.endsWith(".tsx") || file.endsWith(".data.ts")) writeFileSync(join(workDir, file), readFileSync(join(source, file), "utf8").replaceAll("__PKG__", PKG_NAME))
    }
  }
  const resources = Object.fromEntries(Object.entries(RESOURCES).map(([name, entry]) => [name, entry.hydrogen]))
  writeFileSync(join(workDir, "resources.ts"), `export const RES: Record<string, any> = ${JSON.stringify(resources, null, 2)};\n`)
  writeFileSync(join(workDir, "cases.tsx"), caseModuleSource(cases, host))
}

export async function createReactRenderer(): Promise<HostRenderer> {
  if (!existsSync("examples/react/node_modules")) return { unavailable: "examples/react/node_modules is missing; run pnpm examples:install", render: async () => "" }
  const cases = loadFixtures().filter((testCase) => testCase.hosts.includes("react"))
  writeTsxWorkDir(REACT_WORK_DIR, "react", cases)
  writeFileSync(
    join(REACT_WORK_DIR, "entry.tsx"),
    `import { renderToString } from "react-dom/server";\nimport { cases } from "./cases";\nexport const render = (id: string): string => renderToString(cases[id]!() as any);\n`,
  )
  await build({
    entryPoints: [join(REACT_WORK_DIR, "entry.tsx")],
    outfile: join(REACT_WORK_DIR, "entry.mjs"),
    bundle: true,
    format: "esm",
    platform: "node",
    jsx: "automatic",
    external: ["react", "react-dom"],
    logLevel: "warning",
  })
  const { render } = (await import(pathToFileURL(join(process.cwd(), REACT_WORK_DIR, "entry.mjs")).href)) as { render(id: string): string }
  return {
    async render(testCase) {
      return restoreChildren(render(testCase.id), caseJsx(testCase, "react").fragments, testCase.id)
    },
  }
}
```

`test/support/hosts/remix.ts` is the same file with these differences, and nothing else (NOT RUN; steps are `06-bindings.md` Q-11 and Q-13):

| Item | Value |
|---|---|
| Work directory | `examples/remix/.ripple-conformance` |
| Source directories | `components/<id>/remix/` |
| Availability | `unavailable` is `Remix needs Node 24.3 or later (running <process.versions.node>)` when the Node version is lower than 24.3.0; `examples/remix/node_modules is missing; run pnpm examples:install` when that directory is missing |
| `entry.tsx` | `import { renderToString } from "remix/component/server";\nimport { cases } from "./cases";\nexport const render = async (id: string): Promise<string> => await renderToString(cases[id]!() as any);\n` |
| esbuild options | `jsx: "automatic"`, `jsxImportSource: "remix/component"`, `external: ["remix", "remix/*"]` |
| `render` | `restoreChildren(await render(testCase.id), caseJsx(testCase, "remix").fragments, testCase.id)` |
| Host argument | `"remix"` in `writeTsxWorkDir`, `caseModuleSource`, `caseJsx` (so `class` is not renamed) |

- **X-1** The per-host work directories are `examples/<host>/.ripple-conformance/` (D-096 item 5). `examples/react/.ripple-conformance/` and `examples/remix/.ripple-conformance/` are recreated on every run and MUST be listed in `examples/react/.gitignore` and `examples/remix/.gitignore`.
- **X-3** The generated `cases.tsx` imports each binding by relative path (`./<id>`), the form an installed binding has under `<paths.components>`. Sibling imports between bindings (`./<id>`, Remix `./<id>.tsx`) and `./<id>.data` (D-094, D-096 item 3) resolve because every binding and data file is copied flat into the work directory.
- **X-4** Blueprint TSX files are not conformance cases. They are tested as installed files: the example projects are produced by the CLI (12.1), which rewrites every `@components/<id>` specifier to the relative path from the installed file to `<paths.components>/<id>` (D-096 item 4). A test MUST NOT bundle a blueprint source file that still contains `@components/`.
- **X-2** `<pkg>` imports inside the bindings resolve through `examples/<host>/node_modules`, which holds a copy of `pkg/` made by `pnpm examples:install`. Running tier 2 after `pnpm build` without `pnpm examples:install` tests a stale package; `pnpm ci` and the CI jobs always run both.

### 7.5 Per-host extras: `test/conformance/hosts.test.ts`

One test per row. The assertions are owned by `06-bindings.md`; this table fixes names and files.

| Name | Rule | Skips when |
|---|---|---|
| `[T2] conformance: one test per case and host` | C-2 | never |
| `[T2] html: reference files parse into the manifest fixture names in order` | F-21, F-23, Q-22 | never |
| `[T2] react: bindings type-check and every ts-expect-error is used` | Q-7 | `examples/react/node_modules` missing |
| `[T2] react: client render equals the reference for every case [chromium]` | Q-9 | same |
| `[T2] remix: bindings type-check and every ts-expect-error is used` | Q-12 | T-7 |
| `[T2] remix: raw output carries data-rmx-key and data-rmx-preserve-attrs, no on* attribute, no className` | Q-14 | T-7 |
| `[T2] liquid: Theme Check reports no error and no warning` | Q-19 | never |
| `[T2] liquid: attributes param cannot override contract attributes` | Q-20 | never |
| `[T2] liquid: Ripple block files number at most 150` | D-038 item 7 | never |

---

## 8. Tier 3: upgrade stability

Rules under test: `02-html-contract.md` U-2 (with UD-2 of this document), D-021 item 3 (no layout change at upgrade), RP602.

### 8.1 `test/upgrade/upgrade.test.ts` (complete, NOT RUN as a file; `upgradeDiff` was RUN on the Tabs fixture and on a broken copy of it)

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { formatUpgradeFailures, loadComponents, loadFixtures, rootClasses, upgradeDiff } from "../../src/testing/index"
import { openPage, settled } from "../support/browser"
import { collectBoxes } from "../support/collect"
import { fixturePageUrl } from "../support/server"

const classes = rootClasses(loadComponents())

for (const testCase of loadFixtures()) {
  test(`[T3] ${testCase.id}: zero unpermitted mutations at upgrade`, async () => {
    const opened = await openPage()
    try {
      const report = await upgradeDiff(opened.page, {
        url: await fixturePageUrl(testCase.id),
        allow: testCase.component.upgradeAllow,
        rootClasses: classes,
      })
      assert.equal(formatUpgradeFailures(testCase.id, report.failures), "")
      assert.deepEqual(report.undefinedTags, [])
      assert.deepEqual(opened.errors, [])
    } finally {
      await opened.close()
    }
  })

  for (const width of [375, 1280]) {
    test(`[T3] ${testCase.id}: component root boxes are equal before and after upgrade at ${width} px`, async () => {
      const before = await openPage({ viewport: { width, height: 720 } })
      const after = await openPage({ viewport: { width, height: 720 } })
      try {
        await before.page.goto(await fixturePageUrl(testCase.id, { js: "off" }))
        await after.page.goto(await fixturePageUrl(testCase.id))
        await settled(after.page)
        const arg = { rootSelector: "#rp-test-root", rootClasses: classes }
        const roots = (boxes: Awaited<ReturnType<typeof collectBoxes>>) => boxes.filter((box) => box.root)
        assert.deepEqual(roots(await after.page.evaluate(collectBoxes, arg)), roots(await before.page.evaluate(collectBoxes, arg)))
      } finally {
        await before.close()
        await after.close()
      }
    })
  }
}
```

Pass conditions:

- **U3-1** `report.failures` is empty: no value-changing mutation inside a component root other than those the component's `upgradeAllow` plus `GLOBAL_UPGRADE_ALLOW` permit. The failure text is one line per record in the format `<fixture id>: <element path>: <record type> <attribute name>: <old value> -> <new value>`.
- **U3-2** `report.undefinedTags` is empty.
- **U3-3** No `pageerror` and no `console.error`.
- **U3-4** For every component root in the fixture (U-1), the bounding box rounded to 0.5 CSS px and the computed `display` are equal with and without the script, at 375 px and 1280 px viewport width. This is CA-5 of `09-components-foundation.md` and the per-root part of RP602.
- **U3-6** Every `rp-*` root in the fixture computes `display: block`, with and without the script (D-080). No `rp-*` root computes `display: contents` or `display: none`. The generic test asserts it with `collectBoxes` (5.4) in both passes: for every box whose tag name starts with `rp-`, other than `rp-view-event` (an infrastructure element, not a component root), `display === "block"`.
- **U3-5** Same-value writes are counted and printed (`report.sameValue.length`) but do not fail (UD-2).

### 8.2 Other tier 3 tests

| File | Tests |
|---|---|
| `test/upgrade/bundles.test.ts` | A-07, A-08, A-13 of `01-architecture.md` section 11 |
| `src/elements/<tag>.test.ts` | the tier 3 cases of `04-elements.md` (E-01, Q-1) |
| `test/commerce/*.test.ts` | C-16 of `05-commerce.md` |

### 8.3 Snapshot fixtures

`upgrade-snapshot` fixtures (Tabs, Tooltip, Toast) are written only by `pnpm gen --snapshot <component id>` (`07-manifest-registry-cli.md` 3.1; procedure `02-html-contract.md` 11.4). Step 6 of that procedure MUST call `upgradeDiff` from `src/testing/upgrade-diff.ts` on the written file and fail when `failures` is not empty. A UI SDK version bump is a pull request that runs `pnpm gen --snapshot tabs tooltip toast` and then every tier (D-062).

---

## 9. Tier 4: hydration (React) and morph navigation (Remix)

The assertions are `06-bindings.md` Q-10 (React, items 1 to 6) and Q-15 (Remix). This section fixes the files and the page mechanics.

### 9.1 `test/hydration/react.test.ts`

For every component of kind `native`, `ui` or `commerce` and each of its fixtures whose hosts include `react`, two tests:

```text
[T4] <fixture id>: react hydrates with elements defined first
[T4] <fixture id>: react hydrates with hydrateRoot first
```

Mechanics:

1. Server HTML: the case rendered by the React adapter of 7.4 (`renderToString`), with children restored, wrapped as `<div id="app">{html}</div>` in the fixture page of 5.2 with `{script tag}` replaced by the client bundle below.
2. Client bundle: built by esbuild from a generated entry in `examples/react/.ripple-conformance/` with `bundle: true`, `format: "esm"`, `platform: "browser"`, `jsx: "automatic"`, `jsxDev: true`, `define: { "process.env.NODE_ENV": "\"development\"" }`. The entry renders the same case inside `<StrictMode>` with `hydrateRoot(document.getElementById("app"), node, { onRecoverableError })` and pushes every recoverable error to `window.__rpRecoverable`.
3. Order "elements defined first": the entry's first statements are `import "<pkg>/elements"; import "<pkg>/commerce";`, then `hydrateRoot`. Order "hydrateRoot first": the entry calls `hydrateRoot`, awaits two animation frames, then `await import("<pkg>/elements")` and `await import("<pkg>/commerce")`.
4. Children in the client entry are the same token strings; the test replaces the tokens in the server HTML with the same fragments wrapped in nothing, and the client renders the fragments through a test-only component `<Raw html={fragment} />` that prints `<span data-rp-test-raw dangerouslySetInnerHTML={{ __html: fragment }} suppressHydrationWarning />`. Because that wrapper is not part of any contract, hydration cases use only fixtures whose `children` are plain text (no `<`); a fixture with markup children is hydrated with its children replaced by the text `children`. (Conformance of markup children is tier 2's job.)
5. The recorder is `installUpgradeRecorder` with the component's `upgradeAllow` plus `GLOBAL_UPGRADE_ALLOW`. Same-value writes already do not fail (UD-2), which covers the `input` entry of `REACT_HYDRATION_ALLOW`; the `textarea` entry is applied by the test as an extra filter (`test/hydration/react-allow.ts`).
6. Pass: Q-10 items 1 to 3 for every case; items 4 to 6 are written per component in `components/<id>/<id>.test.ts` as `[T4]` tests, for the components and props D-036 lists as controllable.

One more test in this file (NOT RUN; `useRegionHtml` is UNVERIFIED until the SPIKE-10 report exists, D-090 item 4, D-108):

| Name | Assertion |
|---|---|
| `[T4] react: useRegionHtml returns null during hydration and the HTML after the first publish` | A test component renders `String(useRegionHtml("rp-predictive-results"))` into `<output>`. Server HTML and the first client render print `null`, and hydration logs no recoverable error. After the commerce runtime performs a `predictive` refresh against a stub URL whose response contains `<div data-rp-region="rp-predictive-results"><p>x</p></div>`, the `<output>` text is `<p>x</p>` (the inner HTML of the same-named region, D-090 item 2, `react` row) |

### 9.2 `test/hydration/remix.test.ts`

Tests: `[T4] <component id>: remix morph keeps state, instance and listeners` for every component of kind `native`, `ui` or `commerce` (Q-15). The test starts `examples/remix` with `startExample("remix")` (12.1) and uses two routes that the example MUST provide for tests only when the environment variable `RIPPLE_TEST_ROUTES` is `1`: `/__rp/morph/a?c=<component id>` and `/__rp/morph/b?c=<component id>`, each rendering that component's `default` fixture props with the same id and a link to the other route. Skips: T-7. The `RIPPLE_TEST_ROUTES` contract on `examples/remix` is item 6 of 12.1 (D-104 item 3).

The morph test MUST NOT require a `<Frame>`: on Remix, regions are plain elements carrying `data-rp-region` and the default refresh strategy is the `html` strategy (D-090 item 5). `examples/remix` configures neither `reloadFrames` nor `navigate` (12.1); the configuration that uses them is SPIKE-11 and is not tested by this tier.

### 9.3 Commerce

C-23 of `05-commerce.md` (`[T4] cart-link: C-23 hydrating CartLink and CartLines logs no hydration error`) lives in `test/hydration/react.test.ts`.

---

## 10. Tier 5: behaviour, keyboard and accessibility

### 10.1 Component behaviour tests: `components/<id>/<id>.test.ts`

- **BH-1** Every component has the file `components/<id>/<id>.test.ts`, even when it has no JavaScript (the definition-of-done check 18.2 reads it).
- **BH-2** For each numbered item `n` of the component's "Acceptance tests" section that is not satisfied by a generic matrix test, the file contains one test whose statement starts with `AT-<n>`. For an item that a generic matrix test satisfies (CA-1 to CA-9, "T1", "T2", "T3", "T10"), the file contains the comment line `// AT-<n>: generic (<test file>)`.
- **BH-3** A behaviour test loads the case through `fixturePageUrl`, interacts as a user (`page.click`, `page.keyboard.press`, `page.fill`), and asserts DOM state, events and focus. It MUST NOT call element methods to cause the behaviour under test, except in tests of the methods themselves.

Template (complete; copy and replace the component id, fixture and statements):

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { openPage, settled } from "../../test/support/browser"
import { fixturePageUrl } from "../../test/support/server"

// AT-1: generic (test/conformance/conformance.test.ts, test/upgrade/upgrade.test.ts, test/nojs/render.test.ts)

test("[T5] accordion: AT-2 activating a summary opens its item", async () => {
  const opened = await openPage()
  try {
    await opened.page.goto(await fixturePageUrl("accordion/default"))
    await settled(opened.page)
    const item = opened.page.locator("details.rp-accordion-item").first()
    assert.equal(await item.getAttribute("open"), null)
    await item.locator("summary.rp-accordion-trigger").click()
    assert.equal(await item.getAttribute("open"), "")
    assert.deepEqual(opened.errors, [])
  } finally {
    await opened.close()
  }
})

test("[T6] accordion: AT-3 a summary opens its item with scripting disabled", async () => {
  const opened = await openPage({ scripts: "disabled" })
  try {
    await opened.page.goto(await fixturePageUrl("accordion/default"))
    const item = opened.page.locator("details.rp-accordion-item").first()
    await item.locator("summary.rp-accordion-trigger").click()
    assert.equal(await item.getAttribute("open"), "")
  } finally {
    await opened.close()
  }
})
```

### 10.2 What a component's tests MUST cover

| Component has | Required tests (tier) |
|---|---|
| any kind | the generic matrix tests of 7.1, 8.1, 10.3, 10.4, 11.1, 14 run for it automatically; nothing to write |
| a "Behaviour with JavaScript" list | one `[T5]` test per numbered statement |
| an event (manifest `events[]`) | `[T5]`: the event fires exactly once per user action, on the component root, with `bubbles === false`, with the documented `detail.value` and `detail.reason`; a property or attribute write fires none (D-023) |
| a method (primitive `api`) | `[T5]`: `Object.keys(element.api)` equals the documented list; each method has the documented effect |
| an `rp-*` element | `[T5]`: after replacing every descendant with new nodes of the same markup, the next interaction works; after removing the root from the document and inserting it again, the next interaction fires its event once (D-019 item 3) |
| a keyboard table | `[T5]`: one test per row, pressing the key with `page.keyboard.press` from the stated focus position |
| `a11y.checkPattern` not null | `[T5] <id>: checkPattern <pattern> reports no problem`, using 5.5; for a pattern that must be open (dialog), the test opens it first |
| a "Focus" statement | `[T5]`: focus is where the statement says after open, close and removal |
| an "Announcements" statement | `[T5]`: 10.5 |
| `noJs.level: "full"` | one `[T6]` test per function listed under "Behaviour without JavaScript", with `scripts: "disabled"`, and one with `scripts: "blocked"` for the primary function |
| `noJs.level: "degraded"` | `[T6]`: the content is readable (the stated elements are visible) and the stated primary path works with `scripts: "disabled"` |
| `noJs.level: "none"` | `[T6]`: every element with `data-rp-js="overlay"` computes `display: none`, and the trigger still has an accessible name |
| controlled React props (D-036) | `[T4]`: Q-10 items 4 to 6 |
| a controlled `value` with a cancelable `valuechange` (D-036; `rp-quantity`) | `[T5]`: a `valuechange` listener that calls `preventDefault()` keeps the previous value: after the user action the control's value, the form value and the visible text are unchanged (the veto test of `04-elements.md` is the element-level form of this test) |
| Toast | `[T5] toast: the chunk is not requested until the first toast() call`: on a page with a toast region and `ripple.elements.js` loaded, no request whose URL contains `toast` is made before `toast()` is called; exactly one is made after the first call and none after the second (D-083) |
| a region part (D-091) | `[T2]`: in every host the region root carries `data-rp-region="<region name>"` (asserted by the fixture; the conformance case covers it). `[T5]`: on the `html` and `remix` hosts a refresh replaces the region root exactly once (one `childList` record on the region root's parent, the new root carries the same `data-rp-region`), and elements outside the region keep their identity |
| component rules (manifest `rules[]`, D-102 item 3) | `[T1]`: for each rule id, the manifest's failing example string checked by the checker reports exactly one `RP113` diagnostic whose message contains the rule id in square brackets (`[<rule id>]`); the component's `default` fixture reports none |
| kind `commerce` | the `C-nn` tests of `05-commerce.md` that name the component, in `test/commerce/` |

### 10.3 Automated WCAG scan: `test/a11y/axe.test.ts` (complete, NOT RUN as a file; the axe injection and call were RUN on the Tabs fixture: zero violations)

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { loadFixtures } from "../../src/testing/index"
import { openPage, settled } from "../support/browser"
import { fixturePageUrl, getFixtureServer } from "../support/server"
import { AXE_EXCEPTIONS } from "./axe-exceptions"

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

for (const testCase of loadFixtures()) {
  for (const scheme of ["light", "dark"] as const) {
    test(`[T5] ${testCase.id}: axe reports no WCAG 2.2 AA violation in scheme ${scheme}`, async () => {
      const opened = await openPage()
      try {
        await opened.page.goto(await fixturePageUrl(testCase.id, { scheme }))
        await settled(opened.page)
        await opened.page.addScriptTag({ url: `${(await getFixtureServer()).url}/__test/axe.js` })
        const violations: Array<{ id: string; nodes: Array<{ target: string[] }> }> = await opened.page.evaluate(
          async (tags) => (await (window as any).axe.run("#rp-test-root", { runOnly: { type: "tag", values: tags } })).violations,
          TAGS,
        )
        const excepted = new Set(AXE_EXCEPTIONS.filter((entry) => entry.fixture === testCase.id).map((entry) => entry.rule))
        const found = violations.filter((violation) => !excepted.has(violation.id)).map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)
        assert.deepEqual(found, [])
      } finally {
        await opened.close()
      }
    })
  }
}
```

`test/a11y/axe-exceptions.ts` (complete initial content):

```ts
export interface AxeException {
  /** Fixture id, "<component id>/<fixture name>". */
  fixture: string
  /** axe rule id. */
  rule: string
  /** Why the finding is a false positive for this fixture. One sentence. */
  reason: string
}

export const AXE_EXCEPTIONS: AxeException[] = []
```

- **AX-1** The scan runs on `#rp-test-root` only, with exactly the five tags above (WCAG 2.2 AA, D-066). Best-practice rules are not run: fixtures are fragments and have no landmarks or headings of their own.
- **AX-2** An exception is added only for a false positive caused by the fixture being a fragment (for example a `<li>` fixture without its list). It MUST NOT be added for a contrast, name, role or target-size finding. `[T1] axe-exceptions: every entry names an existing fixture and has a reason` (in `test/a11y/axe.test.ts`) fails on a stale entry.
- **AX-3** axe-core cannot judge contrast of text over gradients or images; token contrast is additionally tested by A-02 of `03-styling-and-tokens.md` and by RP609.

### 10.4 Keyboard, focus visibility and target size: `test/a11y/keyboard.test.ts`

Three generic tests per case (NOT RUN). Each loads `fixturePageUrl(id)` and awaits `settled`.

| Name | Procedure | Pass |
|---|---|---|
| `[T5] <fixture id>: Tab visits each focusable element once, in document order` | Focus `body`. Press `Tab` until `document.activeElement` is outside `#rp-test-root` or 200 presses. Record each focused element. | No element is recorded twice. Each recorded element follows the previous one in document order (`compareDocumentPosition` has `DOCUMENT_POSITION_FOLLOWING`). Every element in `#rp-test-root` that matches `a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]`, is visible (`checkVisibility()`), is not inside a closed `dialog`, a closed `[popover]`, a `[hidden]` element, or a `details:not([open])` (other than its own `summary`), and is not a radio input that is not the checked or first one of its group, was recorded. An element with `tabindex="-1"` was not recorded |
| `[T5] <fixture id>: every Tab stop shows a focus indicator` | During the same walk, at each stop read computed `outline-style`, `outline-width`, `outline-color`, `box-shadow` of the focused element. | `outline-style` is `solid` and `outline-width` is at least `2px` and `outline-color` equals the computed value of `--color-ring` resolved on that element; OR the component spec's Accessibility section names another element that carries the indicator, in which case that element satisfies the same condition (A-08 of `03-styling-and-tokens.md`) |
| `[T5] <fixture id>: interactive targets are at least 24 by 24 CSS px` | For every `button, a[href], input:not([type="hidden"]), select, summary` in `#rp-test-root` that is visible and not inside `.rp-rich-text` or `.rp-text`: `getBoundingClientRect()`. | `width >= 24` and `height >= 24` (D-066; CA-8 of `09-components-foundation.md`). For `input[type="checkbox"]` and `input[type="radio"]`, the box of the wrapping `label` is used when the input is inside a `label` |

### 10.5 Announcements

A test asserts an announcement by polling (at most 2 s, with `page.waitForFunction`) until the expected text is contained in the text content of any of these elements: `[data-ui-sdk-announcer]` (the kernel live regions appended to `<body>`, `02-html-contract.md` U-3), `[data-rp-part="status"]`, `[role="status"]`, `[role="alert"]`. Where the text goes is fixed by D-079: when the announcing element is inside an open modal `<dialog>`, the test MUST find the text in a `[data-rp-part="status"]` element inside that dialog (CartLines, CartSummary, CartNote and DiscountCode each print one); otherwise in the page-level region. The `layout` blueprint prints no Announcer, so a page-level `[data-rp-part="status"]` outside every `rp-*` root and `<dialog>` is a failure of `[T5] layout: no page-level Announcer`. The expected text is read from `locales/en.default.json` (W-7), with `{{ name }}` placeholders replaced by the test.

### 10.6 Other tier 5 tests owned elsewhere

| Tests | File | Owner |
|---|---|---|
| A-02 to A-09, A-11, A-14, A-18 to A-22 (tokens, dials, schemes, props, focus, motion, RTL, hidden, display of custom elements, Tabs without JS, scroll padding, `data-rp-js` on a form) | `css/styling.test.ts` | `03-styling-and-tokens.md` 15 |
| A-23 (the linter's own tests) | `src/gen/css-lint.test.ts` | `03-styling-and-tokens.md` 7.9, 15 |
| E-02 to E-30 | `src/elements/<tag>.test.ts`, `src/runtime/<name>.test.ts` (the file of each test is stated in `04-elements.md` 13) | `04-elements.md` 13 |
| C-01 to C-32 | `test/commerce/liquid.test.ts`, `test/commerce/hydrogen.test.ts` (the file of each test is stated in `05-commerce.md` 14) | `05-commerce.md` 14 |

---

## 11. Tier 6: no-JS and scripts blocked; tier 9: cross-engine

### 11.1 `test/nojs/render.test.ts` (complete, NOT RUN as a file; the two script modes were RUN and gave identical boxes)

Every case is rendered three ways: scripts on, scripts disabled, scripts blocked.

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { loadComponents, loadFixtures, rootClasses } from "../../src/testing/index"
import { openPage, settled, type ScriptMode } from "../support/browser"
import { collectBoxes } from "../support/collect"
import { fixturePageUrl } from "../support/server"

const classes = rootClasses(loadComponents())
const arg = { rootSelector: "#rp-test-root", rootClasses: classes }

async function render(id: string, scripts: ScriptMode) {
  const opened = await openPage({ scripts })
  try {
    await opened.page.goto(await fixturePageUrl(id))
    if (scripts === "on") await settled(opened.page)
    return await opened.page.evaluate(collectBoxes, arg)
  } finally {
    await opened.close()
  }
}

for (const testCase of loadFixtures()) {
  for (const scripts of ["disabled", "blocked"] as const) {
    test(`[T6] ${testCase.id}: renders the same with scripts ${scripts}`, async () => {
      const withScripts = await render(testCase.id, "on")
      const without = await render(testCase.id, scripts)
      // 1. Component roots: same box and display.
      assert.deepEqual(without.filter((box) => box.root), withScripts.filter((box) => box.root))
      // 2. Every element not owned by a data-rp-js control: same computed display.
      const display = (boxes: typeof without) => boxes.filter((box) => !box.js).map((box) => [box.path, box.display])
      assert.deepEqual(display(without), display(withScripts))
      // 3. A static component is unaffected by scripts in every respect.
      if (testCase.component.kind === "static") assert.deepEqual(without, withScripts)
    })
  }
}
```

Pass conditions (CA-9 of `09-components-foundation.md`; invariant I-4 of `01-architecture.md`):

- **NJ-1** Component root boxes and displays are equal with scripts on, disabled and blocked. Every `rp-*` root computes `display: block` in all three modes (D-080); no `rp-*` root computes `display: contents` or `display: none` (the assertion of U3-6, run here on the three sets of boxes).
- **NJ-2** Computed `display` is equal for every element that is not a `data-rp-js` control or inside one (D-063 as amended, item (e): the comparison excludes `data-rp-js="fallback"` controls; `data-rp-js` controls change by design, D-021 item 4). A component whose root box changes when a `fallback` control disappears fails NJ-1 and must reserve the space.
- **NJ-3** For kind `static`, every box is equal.
- **NJ-4** Exception to NJ-2, stated here once (D-063 as amended, item (e), exempts Tabs): Tabs under `@media (scripting: none)` shows every panel (D-012). For fixtures of component `tabs`, comparison 2 skips elements matching `ui-tabs-panel`, `ui-tabs-list` and their descendants, and comparison 1 is run only for `scripts: "blocked"` (where `scripting: none` does not match). No other component is exempt.

### 11.2 Flows

Component flows are the `[T6]` tests of 10.2 in each component's test file. In addition `test/nojs/blueprints.test.ts` runs whole-page flows on the four example projects with `scripts: "disabled"`. Liquid uses `serveTheme({ themeRoot: "examples/liquid" })`; the other hosts use `startExample(host)` (12.1) and therefore mock.shop (skip rule T-5).

Test names are `[T6] <host>: NJ-F<n> <statement>`; every flow runs for `html`, `react`, `remix` and `liquid` unless the row says otherwise.

| Id | Flow (scripting disabled) | Pass |
|---|---|---|
| NJ-F1 | Load `/`. | Status 200; `main` has content; no request for a `ripple*.js` file is needed for any content to be visible (every Ripple root computes a non-zero box or is a closed overlay); A-14 of `01-architecture.md` |
| NJ-F2 | On `/`, click the first link inside the header `nav`. | The URL changes to the link's `href` |
| NJ-F3 | On a product page, activate a VariantPicker control that is not the current one (`.rp-variant-picker a[href]:not([aria-current="true"])`, or select a radio and submit the picker's form). | Navigation to a URL whose query differs; the page shows the newly selected variant as current |
| NJ-F4 | On a product page, submit the form inside `rp-product-form` with its submit button. | hydrogen backend: the browser ends on a page with status 200 after a `303`; the next load of `/cart` shows one `[data-rp-line]`. Liquid: the URL path is `/cart` with one `[data-rp-line]` |
| NJ-F5 | On `/cart` with one line: set the quantity input to `3` and press the control marked `data-rp-js="fallback"` (the Update submit button). | After the navigation the line's quantity input has the value `3` |
| NJ-F6 | On `/cart` with one line: activate the remove control (hydrogen: `button[name="intent"][value="remove"]`; Liquid: the link whose `href` is the line's `url_to_remove`). | No `[data-rp-line]` remains |
| NJ-F7 | On `/cart`: type a note into `[data-rp-field="note"]` and submit the cart form. | After reload the field holds the note |
| NJ-F8 | hydrogen backend only (`html`, `react`, `remix`): submit the DiscountCode form with the text `RIPPLE-NOT-A-CODE`. | The browser ends on a page with status 200 (no error page). DiscountCode works without JavaScript on the hydrogen backend; its manifest level is `degraded` because Liquid needs JavaScript (D-005 as amended) |
| NJ-F9 | On `/cart` with one line: activate the CheckoutButton. | A navigation request starts whose URL path contains `/checkout` (Liquid: the shim's `/checkout`) or whose host differs from the example's host (hydrogen: the `checkoutUrl`). The test aborts that request; it does not load checkout |
| NJ-F10 | On a collection page: choose another value in `select[name="sort_by"]` and submit its form; then, when a filter form exists, check its first checkbox and submit. | Each submit navigates to a URL whose query contains `sort_by=` (and then a `filter.` parameter) |
| NJ-F11 | On a collection page with more than one page: activate the Pagination "next" link. | The URL query contains `page=2` |
| NJ-F12 | Submit the header SearchForm with the text `shirt`. | The URL path is the search route and the query contains `q=shirt` |
| NJ-F13 | On `/`, click the cart opener `a[data-rp-open="cart-drawer"]` in the header. Then load `/cart`. | The browser navigates to the link's `href` (the cart page); no dialog opens. On `/cart` the cart link has no `data-rp-open` attribute and no element with the id `cart-drawer` exists (D-091 item 5) |
| NJ-F14 | Click the MobileNav opener `a[data-rp-open="mobile-nav"]` at viewport width 375. | The browser navigates to the opener's `href`, `#footer-menu`: the URL fragment is `#footer-menu`, the element with that id is in the viewport, and `dialog#mobile-nav` is not open |
| NJ-F15 | Submit the NewsletterForm with `test@example.com`. | The form's request is sent with method `POST` and a field holding the address; the response status is below 500 |
| NJ-F16 | Submit the LocaleSelector form with another option, when the example offers more than one. | A navigation or form post occurs whose request contains the chosen value |

- **NJ-5** The selectors above use only tags, ledger hook attributes, native field names fixed by D-043 and D-047, and manifest classes. Where a component document later fixes a more precise hook for the same control, the test uses that hook and this table is updated in the same change.
- **NJ-6** C-17 and C-18 of `05-commerce.md` are NJ-F4 to NJ-F9 (hydrogen) and the Liquid rows respectively; they are not implemented twice.

### 11.3 Tier 9: cross-engine

- **XE-1** `pnpm test:webkit` and `pnpm test:firefox` run every `[T3]`, `[T5]`, `[T6]` and `[T9]` test that does not carry `[chromium]`, with `RIPPLE_ENGINE` set. The same test files are used; there is no second copy of any test.
- **XE-2** Installing the engines: `pnpm exec playwright install --with-deps webkit firefox` (CI does this, 17.2). When the engine binary is missing the run fails with Playwright's error; it MUST NOT skip.
- **XE-3** `test/cross-engine/features.test.ts` holds the SPIKE-06 feature probes. Each is one `[T9]` test that loads a minimal page built in the test (through `page.setContent`) and asserts either that the feature works or that its fallback is in effect. A probe never fails merely because a feature is absent; it fails when neither the feature nor the fallback works.

| Name | Feature | Passes when |
|---|---|---|
| `[T9] features: attribute-token props match` | `[data-gap~="md:6"]` in a media query | at 800 px width an `rp-stack` with `data-gap="2 md:6"` computes `row-gap: 24px`; at 375 px, `8px` |
| `[T9] features: pow() or literal type scale` | `pow()` | `--text-4xl` on `:root` computes to a length within 0.1 px of 36.3 px (A-03 of `03-styling-and-tokens.md`) |
| `[T9] features: relative colour or literal colours` | `oklch(from ...)` | the primary Button label contrast is at least 4.5 in schemes `light` and `dark` |
| `[T9] features: anchor positioning or centred popover` | CSS anchor positioning | an open Popover panel is fully inside the viewport and does not have a 0 by 0 box |
| `[T9] features: scripting none or default panel` | `@media (scripting: none)` | with scripting disabled, the default Tabs panel is visible; when `matchMedia("(scripting: none)")` is supported, every panel is visible |
| `[T9] features: closedby or backdrop click` | `closedby="any"` | with scripts on, a click on the backdrop at viewport (2, 2) closes an open Dialog (E-06 of `04-elements.md`) |
| `[T9] features: Invoker Commands or polyfill` | `commandfor` | with scripts on, a Button with `commandfor` and `command="show-modal"` opens its Dialog (E-23) |
| `[T9] features: details name is exclusive` | `<details name>` | opening a second Accordion item of `type="single"` closes the first; when it does not, the test fails with the message `details[name] is not exclusive in <engine> <version>` |
| `[T9] features: revert-layer` | `display: revert-layer` | an `rp-stack` with `data-hidden="true md:false"` computes `display: flex` at 800 px |
| `[T9] features: hydrogen runtime needs` | `AbortSignal.any`, `crypto.randomUUID` | the page reports both; when either is missing the test asserts instead that `getCommerce().usable === false` and that a cart form posts natively (A-13 of `01-architecture.md`) |

- **XE-4** Tier 9 becomes blocking when the SPIKE-06 report `docs/research/spikes/cross-engine-features/README.md` exists (17.3). The report lists, per engine and version run, each probe's result and the fallback applied; any raised floor is recorded in the ledger (D-032).

---

## 12. Tier 7: commerce end to end against mock.shop

### 12.1 `test/support/examples.ts`

Contract that each of `examples/html`, `examples/react`, `examples/remix` MUST satisfy (D-104 item 3). The examples are the 14 blueprints installed by the CLI (D-099, D-107); `12-components-chrome-and-blueprints.md` owns the blueprint files:

1. `package.json` has scripts `build` and `start`. `pnpm --dir examples/<host> build` exits 0 and may be a no-op. `pnpm --dir examples/<host> start` serves the built project on `127.0.0.1` at the port given by the environment variable `PORT`.
2. Storefront data comes from `https://mock.shop/api` (Ben decision 10) through `@shopify/hydrogen`.
3. Routes: `/` (home), `/collections/<handle>`, `/products/<handle>` (variant in the query), `/cart`, `/search` (query `q`), and the cart handlers at `/api/cart` (D-041).
4. The cart drawer's `<dialog>` has the id `cart-drawer`, equal to `CommerceOptions.cartDrawer` (D-087). It is absent on `/cart` (D-091 item 5).
5. `examples/liquid` is a theme directory and is served by `serveTheme({ themeRoot: "examples/liquid" })`.
6. `examples/remix` only: when the environment variable `RIPPLE_TEST_ROUTES` is `1`, the routes `/__rp/morph/a?c=<component id>` and `/__rp/morph/b?c=<component id>` of 9.2 exist; otherwise they answer `404`.
7. `examples/remix` configures neither `reloadFrames` nor `navigate`: regions are plain elements and the `html` refresh strategy runs (D-090 item 5). The configuration with both options is SPIKE-11; it is not part of tier 7.

`startExample(host: "html" | "react" | "remix" | "liquid"): Promise<{ url: string; stop(): Promise<void> }>`:

1. `liquid`: return `serveTheme({ themeRoot: "examples/liquid" })` (its `close` as `stop`).
2. Others: when `process.env.RIPPLE_NETWORK !== "1"`, throw the error `RIPPLE_NETWORK is not 1`; the calling test turns it into a skip with that reason (T-5). When `remix` and Node is lower than 24.3.0, throw the T-7 reason.
3. Run `pnpm --dir examples/<host> build` once per process (synchronously; a non-zero exit throws with the captured output).
4. Find a free port (listen on port 0, read the port, close). Spawn `pnpm --dir examples/<host> start` with `PORT` set to it and `RIPPLE_TEST_ROUTES=1`.
5. Poll `GET http://127.0.0.1:<port>/` every 250 ms until the status is 200, for at most 60 s; on timeout kill the process and throw with its captured output.
6. `stop()` kills the process group and resolves when it has exited. The helper registers one `after()` hook that stops every example it started.

Handles are discovered, never hard-coded: the test posts `{"query":"{ products(first: 1) { nodes { handle } } collections(first: 1) { nodes { handle } } }"}` to `https://mock.shop/api` once and uses the two handles.

### 12.2 `test/commerce/e2e.test.ts`

Test names: `[T7] <host>: E2E-<n> <statement>`, for `html`, `react` and `remix`. Scripts are on. Every test ends with `assert.deepEqual(errors, [])`.

| Id | Steps | Pass |
|---|---|---|
| E2E-1 | Load `/`, the collection page and the product page. | Each has status 200; `settled`; no `pageerror`, no `console.error`, no failed same-origin request; no element with a `ui-` or `rp-` tag matches `:not(:defined)` |
| E2E-2 | On the product page click the submit control of `rp-product-form` (`[data-rp-part="submit"]`). | `dialog#cart-drawer` is open; it contains one `[data-rp-line]`; the header `[data-rp-part="count"]` shows `1`; the URL did not change; an announcement was made (10.5) |
| E2E-3 | Continue: in the open drawer press the line's `[data-rp-part="increment"]`. | Within 5 s the line's quantity input has the value `2` and the count shows `2`; while the request is in flight the line or the cart root has `data-pending` and `aria-busy="true"`, and neither afterwards |
| E2E-4 | Continue: activate the line's remove control. | No `[data-rp-line]` remains; the count part is `hidden` or shows `0`; focus is inside the drawer |
| E2E-5 | Reload the page after E2E-2. | The count shows `1` before any click (server-rendered or filled after load from the store) |
| E2E-6 | On the product page activate a VariantPicker control that is not current. | The URL query changes without a document navigation (the `window` object identity is unchanged, checked with a marker property); the region `[data-rp-region="rp-product-buy"]` was replaced (a marker attribute set on the old node is gone) |
| E2E-7 | On the collection page change `select[name="sort_by"]`. | One history entry is added; the URL query contains `sort_by=`; `[data-rp-region="rp-collection-results"]` was replaced; Back restores the previous URL |
| E2E-8 | Type a product title's first word into the PredictiveSearch input. | Within 2 s `[data-rp-region="rp-predictive-results"]` contains at least one link; ArrowDown moves focus to the first link; Escape returns focus to the input |
| E2E-9 | With one line in the cart, read the CheckoutButton. | It is an `a` with `data-agent-confirm` and an `href` whose host differs from the example's host (D-050). The test does not follow it |
| E2E-10 | A-09 of `01-architecture.md` (React only). | As stated there |

- **E-1** Tier 7 was NOT RUN for this document: `mock.shop` is not reachable from the environment in which this document was written (a request returned no response). The first CI run is the gate.
- **E-4** mock.shop data for `menu`, `blog`, `page`, `localization` and the `frontpage` collection is UNVERIFIED (D-104 item 5). Before the first test, the file queries `https://mock.shop/api` once for `menu(handle: "main-menu")`, `blogs(first: 1)`, `pages(first: 1)`, `localization { availableCountries { isoCode } }` and `collection(handle: "frontpage")`, and runs one test per host and thing: `[T7] <host>: E2E-11 mock.shop has <thing>` (`<thing>` is `menu`, `blog`, `page`, `localization` or `frontpage`). The test loads the page that shows the thing (`/` for `menu`, `localization` and `frontpage`; the first blog URL; the first page URL) and asserts status 200 and no console error. When the query returned `null` or an empty list the test skips with the reason `mock.shop has no <thing>`. Under `--no-skips` (CI) that skip fails the run; this is how tier 7 reports the gap, and the resolution is a ledger change, not a test change. E2E-1 to E2E-10 do not depend on these five things.
- **E-2** mock.shop state is per cart; tests never share a browser context, so they never share a cart.
- **E-3** Tier 7 runs with concurrency 1 (the runner sets this when tier 7 or 8 is selected).

---

## 13. Tier 8: Liquid live

Blocked until Ben provides a preview store (ledger Q5). Until then every `[T8]` test skips with the reason `RIPPLE_STORE_URL is not set` (T-6), and tiers 2 to 6 on the shim are the gate for Liquid (D-063 item 8). This section fixes the default path to implement now so that the tests exist and start running the day the variable is set. Everything about the live platform here is UNVERIFIED.

Environment: `RIPPLE_STORE_URL` is the origin plus the theme preview query, for example `https://<store>.myshopify.com/?preview_theme_id=<id>`. `RIPPLE_STORE_PASSWORD` is the storefront password when the store has one; the test submits it once to `/password` (field `password`) in the browser context before the first page.

The theme under test is `examples/liquid` with one extra template, generated by `test/liquid/build-live-theme.ts` into `node_modules/.cache/ripple/live-theme/` (a copy of `examples/liquid` plus the file below) and uploaded to the store by a person or by the nightly job (17.4) before the run:

- `templates/page.rp-fixtures.liquid`: for every case whose hosts include `liquid` and that needs no resource other than those the template can obtain from the store, one line `<div data-rp-case="<fixture id>">` + the case source of `liquidCaseSource` (7.3) + `</div>`. Resources: `rp_product_basic` is assigned from `collections.all.products.first`, and the other `rp_*` variables from that product (`.featured_image`, `.selected_or_first_available_variant`); cases that reference cart, line, article or collection resources are omitted from this template and covered by the behaviour tests below.

Tests in `test/liquid/live.test.ts`:

| Name | Procedure | Pass |
|---|---|---|
| `[T8] <fixture id>: live Liquid output equals the reference HTML` | Fetch `<store>/pages/<any page handle>?view=rp-fixtures` once; split the response by `div[data-rp-case]`; compare each inner HTML per K-11 with the fixture's masks | canonical forms equal |
| `[T8] liquid: SPIKE-02 no platform wrapper around blocks and partials` | In the same response, the parent of each case's root is the `div[data-rp-case]` | true; otherwise apply [Fallback (SPIKE-02)](#fallback-spike-02) |
| `[T8] liquid: upgrade stability on the home, product and cart pages` | `upgradeDiff` on each URL with every component's `upgradeAllow` | no failure |
| `[T8] liquid: C-21 Standard Actions checklist` | SPIKE-01 checklist of `05-commerce.md` section 16 | as stated there |
| `[T8] liquid: NJ-F1 to NJ-F16 on the live store` | the Liquid rows of 11.2 | as stated there |
| `[T8] liquid: E2E-2 to E2E-8 on the live store` | 12.2 with the Liquid selectors | as stated there |
| `[T8] liquid: one page view per load` | Load `/`, a product page, a collection page and `/cart`; on each, record Standard Events page views with the hook the SPIKE-01 report names (UNVERIFIED until that report exists; D-089) | exactly one page view per document load; when the platform publishes the page view by itself, the adapter's dispatch is removed and this test still expects exactly one |
| `[T8] liquid: SPIKE-02 argument and setting questions` | On the fixtures page: a block called with the argument `as`; a block whose schema has a bare setting; a cart with a discount code applied; `{{ request.page_type }}`; a font setting's `system?`; `{{ ... \| standard_event_data: 'view', context: 'page' }}` inside `rp-view-event` | `as` reaches the block; the bare setting is accepted by the theme upload; the `type` of the discount-code `discount_application` is recorded in the report; `request.page_type` equals the template name; `system?` is a boolean; the filter prints JSON. Each failing line names the fallback of `00-decisions.md` section 3 (SPIKE-02) to apply |

UNVERIFIED and to be settled by the first live run: that `?view=rp-fixtures` selects an alternate Liquid template in the developer preview; that `{% block %}` is legal in such a template; the platform questions V-1 to V-20 of `14-liquid-theme.md` (SPIKE-02), which include the ones SPIKE-02 gained (D-108): whether `as` is a legal block argument, whether a bare schema setting is accepted, the `type` value of a discount-code `discount_application`, the value of `request.page_type`, `font.system?`, and `standard_event_data` under `rp-view-event`.

---

## 14. Visual regression

D-063 rejects screenshot comparison as the conformance mechanism and uses screenshots only in evals. Visual regression in Ripple is therefore a **style snapshot**: the computed values of a fixed list of CSS properties for every Ripple element of every fixture, compared with a committed JSON file. It detects an unintended change of the default look without depending on fonts, antialiasing or the operating system. Layout is covered by relative assertions that need no baseline (8.1, 11.1; A-12, A-13, A-14 of `03-styling-and-tokens.md`).

### 14.1 What is recorded

For each case, five states, each a map from element path to property values (`collectStyles`, 5.4, with `STYLE_PROPERTIES`):

| Key | Viewport | Scheme | State |
|---|---|---|---|
| `375-light` | 375 by 720 | light | at rest |
| `1280-light` | 1280 by 720 | light | at rest |
| `1280-dark` | 1280 by 720 | dark | at rest |
| `1280-light-hover` | 1280 by 720 | light | pointer over the first interactive element |
| `1280-light-focus` | 1280 by 720 | light | keyboard focus on the first interactive element |

"First interactive element" is the first element in `#rp-test-root`, in document order, matching `a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary`. When there is none, the `hover` and `focus` keys are absent. Hover is produced with `locator.hover()`; focus with `page.keyboard.press("Tab")` repeated until that element is `document.activeElement` (at most 50 presses). The `hover` and `focus` entries store only the properties whose value differs from `1280-light` (a diff), so the files stay small.

Pages are opened with `reducedMotion: "reduce"` (the default of `openPage`), so transitions have zero duration and no waiting is needed beyond two animation frames.

### 14.2 Files

`test/visual/snapshots/<component id>/<fixture name>.json`: UTF-8, LF, two-space indentation, one trailing newline, keys in the order of 14.1, element paths in document order, properties in the order of `STYLE_PROPERTIES`:

```json
{
  "375-light": {
    "main#rp-test-root > button:nth-child(1)": {
      "display": "inline-flex",
      "position": "relative"
    }
  },
  "1280-light": {},
  "1280-dark": {},
  "1280-light-hover": {
    "main#rp-test-root > button:nth-child(1)": {
      "background-color": "oklch(0.3 0.02 260)"
    }
  },
  "1280-light-focus": {}
}
```

(The example is abbreviated to show the shape; a real file lists every property of `STYLE_PROPERTIES` for every element in the three at-rest keys.)

### 14.3 `test/visual/style.test.ts`

One test per case: `[T5] <fixture id>: style snapshot matches [chromium]` (the line above it: `// [chromium]: computed colour serialisation differs between engines`).

Procedure:

1. Collect the five states.
2. When `process.env.RIPPLE_UPDATE_SNAPSHOTS === "1"`: write the file (creating directories) and pass.
3. Otherwise: when the file is missing, fail with `missing style snapshot <path>; run pnpm test:visual --update and commit the file`. When it exists, `assert.deepEqual(collected, JSON.parse(file))`.

One more test, `[T5] style-snapshots: no stale snapshot file [chromium]`: every file under `test/visual/snapshots/` corresponds to a case of `loadFixtures()`; with `RIPPLE_UPDATE_SNAPSHOTS=1` stale files are deleted instead.

Rules:

- **V-1** Snapshots are generated only with the pinned Playwright Chromium (1.63.0) and committed. A Playwright bump regenerates all snapshots in a pull request that changes nothing else under `css/` or `components/`.
- **V-2** A pull request that changes a snapshot file MUST state in its description, per changed component, the intended visual change. A snapshot change with no stated intent MUST be rejected in review.
- **V-3** `pnpm test:visual --update --component=<id>` updates one component. `--update` MUST NOT be passed in CI.
- **V-4** A value that depends on the font file, the viewport text metrics or the device pixel ratio MUST NOT be added to `STYLE_PROPERTIES` (no `width`, `height`, `inline-size`, `block-size`, `font-family`, `grid-template-columns`).
- **V-5** Changing a dial default or a token in `css/tokens.css` is expected to change many snapshots; that is the purpose of the test.

### 14.4 Screenshots for people (never compared)

When `RIPPLE_SCREENSHOTS=1`, `style.test.ts` also writes `node_modules/.cache/ripple/report/screenshots/<component id>--<fixture name>--<key>.png` for the three at-rest keys (`locator("#rp-test-root").screenshot()`). The `verify` CI job sets the variable and uploads the directory as an artifact (17.1) so that a reviewer can look at the result. No test reads these files. Pixel comparison MUST NOT be added (D-063).

---

## 15. Tier 10: size budgets

### 15.1 `size-budget.json` (complete)

```json
{
  "version": 1,
  "entries": [
    { "id": "js-ripple", "files": ["pkg/browser/ripple.js"], "measure": "gzip", "max": 45000, "source": "D-064" },
    { "id": "js-ripple-liquid", "files": ["pkg/registry/liquid/assets/ripple.js"], "measure": "gzip", "max": 45000, "source": "D-064" },
    { "id": "js-elements", "files": ["pkg/browser/ripple.elements.js"], "measure": "gzip", "max": 30000, "source": "D-064" },
    { "id": "js-tabs", "files": ["pkg/browser/ripple-tabs.js"], "measure": "gzip", "max": 10000, "source": "D-064" },
    { "id": "js-elements-tabs", "files": ["pkg/browser/ripple.elements-tabs.js"], "measure": "gzip", "max": 10000, "source": "D-064" },
    { "id": "js-tooltip", "files": ["pkg/browser/ripple-tooltip.js"], "measure": "gzip", "max": 22000, "source": "D-064" },
    { "id": "js-elements-tooltip", "files": ["pkg/browser/ripple.elements-tooltip.js"], "measure": "gzip", "max": 22000, "source": "D-064" },
    { "id": "js-toast", "files": ["pkg/browser/ripple-toast.js"], "measure": "gzip", "max": 15000, "source": "D-064" },
    { "id": "js-elements-toast", "files": ["pkg/browser/ripple.elements-toast.js"], "measure": "gzip", "max": 15000, "source": "D-064" },
    { "id": "js-agent", "files": ["pkg/browser/ripple-agent.js"], "measure": "gzip", "max": 14000, "source": "D-064" },
    { "id": "js-elements-agent", "files": ["pkg/browser/ripple.elements-agent.js"], "measure": "gzip", "max": 14000, "source": "D-064" },
    { "id": "js-shared", "files": ["pkg/browser/ripple-shared.js"], "measure": "gzip", "max": 10000, "source": "D-064" },
    { "id": "js-elements-shared", "files": ["pkg/browser/ripple.elements-shared.js"], "measure": "gzip", "max": 10000, "source": "D-064" },
    { "id": "css-tokens-base", "files": ["pkg/css/tokens.css", "pkg/css/base.css"], "measure": "min-gzip", "max": 2200, "source": "D-064" },
    { "id": "css-props", "files": ["pkg/css/props.css"], "measure": "min-gzip", "max": 5200, "source": "D-064" },
    { "id": "css-ripple", "files": ["pkg/browser/ripple.css"], "measure": "min-gzip", "max": 45000, "source": "D-064" },
    { "id": "css-component", "glob": "pkg/css/components/*.css", "measure": "min", "max": 6000, "source": "D-064" }
  ]
}
```

Format rules:

- **SZ-1** `max` is in bytes. One kB in D-064 is 1000 bytes.
- **SZ-2** `measure`: `gzip` is the gzip (level 9) size of the file bytes as shipped; used for JavaScript, which ships minified. `min-gzip` is the gzip (level 9) size after the measuring minifier of `03-styling-and-tokens.md` 5.4; used for CSS, which ships unminified. `min` is the byte length after the measuring minifier, without gzip.
- **SZ-3** `files` are concatenated in the listed order and measured as one. `glob` measures every matching file on its own against `max`.
- **SZ-4** Every entry has a non-empty `source` naming the decision or document that set the number.
- **SZ-5** A missing file is a failure (`missing`), not a pass.
- **SZ-6** Every entry's `source` is `D-064`, and no entry may have a `max` greater than the ledger's value: `ripple.js` 45000 (both the `pkg/browser/` file and the Liquid build), `ripple.elements.js` 30000, tabs chunk 10000, tooltip chunk 22000, toast chunk 15000, shared chunk 10000, agent chunk 14000 (each chunk in both chunk sets), tokens plus base 2200, props 5200, `ripple.css` 45000, one component CSS file 6000 minified. `src/gen/size.test.ts` holds those values as constants and fails when the file exceeds them; raising one needs a ledger change first. An entry added later with another `source` is raised only in a change whose description contains a line `Size budget: <id> <old> -> <new>: <reason>` (`03-styling-and-tokens.md` section 14 rule 1).
- **SZ-7** The Liquid build has no chunk entries of its own: D-064 budgets only its `ripple.js` (`js-ripple-liquid`), and the two chunk sets it names are the `ripple-*.js` and `ripple.elements-*.js` files of `pkg/browser/`.

### 15.2 `src/gen/size.ts` (complete, RUN)

```ts
// Tier 10: measures build output against size-budget.json. Called by src/gen/build.ts (step 10)
// and by src/gen/size.test.ts.
import { existsSync, globSync, readFileSync } from "node:fs"
import { gzipSync } from "node:zlib"
import { Features, transform } from "lightningcss"

export type Measure = "gzip" | "min-gzip" | "min"
export interface BudgetEntry {
  id: string
  /** Files concatenated in this order and measured as one. Exactly one of `files` and `glob` is set. */
  files?: string[]
  /** Every matching file is measured on its own against `max`. */
  glob?: string
  measure: Measure
  /** Bytes. */
  max: number
  /** The decision or document that set the number. */
  source: string
}
export interface BudgetFile {
  version: 1
  entries: BudgetEntry[]
}
export interface SizeResult {
  id: string
  /** The measured file, or the files joined with " + ". */
  subject: string
  bytes: number
  max: number
  status: "ok" | "over" | "missing"
}

/** The measuring minifier of docs/03-styling-and-tokens.md section 5.4. The output is never shipped. */
export function minifyCss(css: Buffer): Buffer {
  const { code } = transform({
    filename: "ripple.css",
    code: css,
    minify: true,
    targets: { chrome: 111 << 16, safari: (16 << 16) | (4 << 8), ios_saf: (16 << 16) | (4 << 8), firefox: 128 << 16 },
    exclude: Features.LightDark,
  })
  return Buffer.from(code)
}

function measure(bytes: Buffer, how: Measure): number {
  if (how === "gzip") return gzipSync(bytes, { level: 9 }).length
  const minified = minifyCss(bytes)
  return how === "min" ? minified.length : gzipSync(minified, { level: 9 }).length
}

export function readBudget(path = "size-budget.json"): BudgetFile {
  const budget = JSON.parse(readFileSync(path, "utf8")) as BudgetFile
  if (budget.version !== 1 || !Array.isArray(budget.entries)) throw new Error(`${path}: expected { "version": 1, "entries": [...] }`)
  const seen = new Set<string>()
  for (const entry of budget.entries) {
    if (seen.has(entry.id)) throw new Error(`${path}: duplicate id ${entry.id}`)
    seen.add(entry.id)
    if ((entry.files === undefined) === (entry.glob === undefined)) throw new Error(`${path}: ${entry.id}: set exactly one of "files" and "glob"`)
    if (!["gzip", "min-gzip", "min"].includes(entry.measure)) throw new Error(`${path}: ${entry.id}: unknown measure ${entry.measure}`)
    if (!Number.isInteger(entry.max) || entry.max <= 0) throw new Error(`${path}: ${entry.id}: "max" must be a positive integer`)
    if (typeof entry.source !== "string" || entry.source === "") throw new Error(`${path}: ${entry.id}: "source" is required`)
  }
  return budget
}

export function measureSizes(budget: BudgetFile): SizeResult[] {
  const results: SizeResult[] = []
  for (const entry of budget.entries) {
    if (entry.files) {
      const subject = entry.files.join(" + ")
      if (!entry.files.every((file) => existsSync(file))) {
        results.push({ id: entry.id, subject, bytes: 0, max: entry.max, status: "missing" })
        continue
      }
      const bytes = measure(Buffer.concat(entry.files.map((file) => readFileSync(file))), entry.measure)
      results.push({ id: entry.id, subject, bytes, max: entry.max, status: bytes <= entry.max ? "ok" : "over" })
    } else {
      const files = globSync(entry.glob as string).sort()
      if (files.length === 0) results.push({ id: entry.id, subject: entry.glob as string, bytes: 0, max: entry.max, status: "missing" })
      for (const file of files) {
        const bytes = measure(readFileSync(file), entry.measure)
        results.push({ id: entry.id, subject: file, bytes, max: entry.max, status: bytes <= entry.max ? "ok" : "over" })
      }
    }
  }
  return results
}

/** One line per result: "<status> <id> <subject> <bytes> / <max> (<percent>%)". */
export function formatSizes(results: SizeResult[]): string {
  return results
    .map((r) => `${r.status.padEnd(7)} ${r.id} ${r.subject} ${r.bytes} / ${r.max} (${Math.round((r.bytes / r.max) * 100)}%)`)
    .join("\n")
}
```

### 15.3 Where it runs

1. Step 10 of `pnpm build` (`01-architecture.md` section 7) calls `measureSizes(readBudget())`, prints `formatSizes(results)`, writes the results as JSON to `node_modules/.cache/ripple/report/size-report.json`, and fails the build when any `status` is not `ok`.
2. `src/gen/size.test.ts`:

| Name | Assertion |
|---|---|
| `[T10] size: every budget of size-budget.json holds for pkg/` | `measureSizes(readBudget())` has only `ok` results; the failure message is `formatSizes` of the results that are not `ok` |
| `[T10] size: ledger budgets are not raised` | for each id of the table below, the entry exists and `max` is at most the value |
| `[T10] size: measureSizes reports ok, over and missing` | with a temporary budget file and temporary files: statuses `["ok", "over", "ok", "missing"]` for a `min-gzip` entry within budget, a `gzip` entry over budget, a `glob` `min` entry, and an entry whose file does not exist (RUN) |
| `[T10] size: the median component CSS is at most 2500 bytes minified` | reported with `console.log` as `warning: median component CSS <n> bytes` when above; never fails (`03-styling-and-tokens.md` section 14) |

Ledger values for the second test: `js-ripple` 45000, `js-ripple-liquid` 45000, `js-elements` 30000, `js-tabs` 10000, `js-elements-tabs` 10000, `js-tooltip` 22000, `js-elements-tooltip` 22000, `js-toast` 15000, `js-elements-toast` 15000, `js-agent` 14000, `js-elements-agent` 14000, `js-shared` 10000, `js-elements-shared` 10000, `css-tokens-base` 2200, `css-props` 5200, `css-ripple` 45000, `css-component` 6000 (per file).

`src/gen/size.ts` is listed in `00-decisions.md` section 5.1. It may import `lightningcss` (add `lightningcss` to the allowed external imports of `src/gen/**` in `IMPORT_RULES`, `01-architecture.md` 2.2).

---

## 16. Tier 11: evals

Owned by `08-agent-kit-and-evals.md` (D-061). This document fixes only how the eval harness uses the test support:

1. Liquid tasks in the local tier are served by `serveTheme` from `<pkg>/testing` (4.5).
2. Eval checks compare HTML only through `canonicalize` from `<pkg>/testing`.
3. `pnpm eval` is not part of `pnpm test` or `pnpm ci`. T01, T02 and T08 MUST have run by the end of M3 (D-061).

---

## 17. CI

Two GitHub Actions workflow files under `.github/workflows/`. `.github/` is in the repository tree of `00-decisions.md` section 5.1 and in the closed root file list of test A-01 of `01-architecture.md` (D-103 item 5).

### 17.1 `.github/workflows/ci.yml` (complete)

```yaml
name: ci

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-24.04
    timeout-minutes: 60
    env:
      RIPPLE_NETWORK: "1"
      RIPPLE_SCREENSHOTS: "1"
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm typecheck
      - run: pnpm gen --check
      - run: pnpm build
      - run: pnpm examples:install
      - run: pnpm test --no-skips
      - run: pnpm test:commerce --no-skips
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: verify-report
          path: node_modules/.cache/ripple/report/
          include-hidden-files: true
          if-no-files-found: warn

  node22:
    runs-on: ubuntu-24.04
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22.18.0"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm typecheck
      - run: pnpm gen --check
      - run: pnpm build
      - run: pnpm examples:install
      - run: pnpm test:unit --no-skips
      - run: pnpm test:conformance

  rename:
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          RIPPLE_PKG_NAME: "@acme/storefront-ui"
      - name: No trace of the placeholder name
        run: |
          if grep -R -l -e 'ripple-kit' -e '__PKG__' pkg; then
            echo "placeholder package name found in pkg/"
            exit 1
          fi
          node -e "const n=require('./pkg/package.json').name; if(n!=='@acme/storefront-ui'){console.error('name is '+n);process.exit(1)}"

  package-node20:
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/setup-node@v4
        with:
          node-version: "20.18.0"
      - name: The built CLI starts on the package's minimum Node version
        run: node pkg/bin/ripple.mjs manifest > /dev/null

  cross-engine:
    runs-on: ubuntu-24.04
    timeout-minutes: 60
    continue-on-error: true
    strategy:
      fail-fast: false
      matrix:
        engine: [webkit, firefox]
    env:
      RIPPLE_NETWORK: "1"
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps ${{ matrix.engine }}
      - run: pnpm build
      - run: pnpm examples:install
      - run: pnpm test:${{ matrix.engine }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: cross-engine-${{ matrix.engine }}-report
          path: node_modules/.cache/ripple/report/
          include-hidden-files: true
          if-no-files-found: warn
```

### 17.2 What each job gates

| Job | Tiers | Required to merge |
|---|---|---|
| `verify` | 1, 2, 3, 4, 5, 6, 10 with no skip; 7 with no skip | yes |
| `node22` | 1 (no skip), 2 (Remix cases may skip, T-7), on the repository's minimum Node version | yes |
| `rename` | A-10 of `01-architecture.md` | yes |
| `package-node20` | the built CLI starts on Node 20.18 (`01-architecture.md` section 12, last UNVERIFIED item) | yes |
| `cross-engine` | 9 | no, until 17.3 |

- **CI-1** `pnpm/action-setup@v4` with no `version` input reads `packageManager` from `package.json` (`pnpm@10.28.0`).
- **CI-2** The `verify` job is exactly `pnpm ci` plus tier 7, with Playwright installation and artifact upload. When `pnpm ci` passes locally with `RIPPLE_NETWORK=1`, `verify` passes.
- **CI-3** A job MUST NOT pass `--update`, MUST NOT set `continue-on-error` (except `cross-engine` under 17.3), and MUST NOT retry failed tests. A flaky test is a defect: fix the wait (W-3) or the code.
- **CI-4** Pull requests from forks have no secrets; no job in `ci.yml` needs one.
- **CI-5** When mock.shop is unreachable, `verify` fails. It MUST NOT be made to pass by unsetting `RIPPLE_NETWORK`; re-run the job.

### 17.3 When `cross-engine` becomes blocking

Tier 9 is non-blocking until the SPIKE-06 report exists (D-063 as amended). `continue-on-error: true` stays on the `cross-engine` job until the file `docs/research/spikes/cross-engine-features/README.md` (the SPIKE-06 report) exists. The pull request that adds that file MUST, in the same change: apply the per-feature fallbacks the report calls for (section 21), record any raised floor in the ledger, delete the `continue-on-error: true` line, and leave `cross-engine` passing. From then on the job is required to merge.

### 17.4 `.github/workflows/nightly.yml` (complete, except the `evals` job that `08-agent-kit-and-evals.md` section 8.14 adds from M3 onward; CI-8)

```yaml
name: nightly

on:
  schedule:
    - cron: "0 3 * * *"
  workflow_dispatch:

jobs:
  liquid-live:
    runs-on: ubuntu-24.04
    timeout-minutes: 60
    env:
      RIPPLE_STORE_URL: ${{ secrets.RIPPLE_STORE_URL }}
      RIPPLE_STORE_PASSWORD: ${{ secrets.RIPPLE_STORE_PASSWORD }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
      - run: pnpm examples:install
      - run: pnpm test:liquid-live
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: liquid-live-report
          path: node_modules/.cache/ripple/report/
          include-hidden-files: true
          if-no-files-found: warn

  cross-engine:
    runs-on: ubuntu-24.04
    timeout-minutes: 60
    strategy:
      fail-fast: false
      matrix:
        engine: [webkit, firefox]
    env:
      RIPPLE_NETWORK: "1"
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps ${{ matrix.engine }}
      - run: pnpm build
      - run: pnpm examples:install
      - run: pnpm test:${{ matrix.engine }}
```

- **CI-6** While the secret `RIPPLE_STORE_URL` is unset, `liquid-live` runs, every `[T8]` test skips, the last output line reports the skips, and the job is green. That is the one place where a green job with skips is accepted; its report states `skipped`, never `passed` (T-3). Once the secret is set, change the job's command to `pnpm test:liquid-live --no-skips` in the same pull request that records the store in the ledger.
- **CI-7** Uploading `node_modules/.cache/ripple/live-theme/` to the preview store before the run is UNVERIFIED tooling (the Shopify CLI command for the developer preview was not checked). Default now: a person uploads it; the step is added to `liquid-live` by `14-liquid-theme.md` once SPIKE-02 has run.
- **CI-8** The eval job (tier 11) is added to `nightly.yml` by `08-agent-kit-and-evals.md` (section 8.14: job `evals`, secret `RIPPLE_EVAL_API_KEY`); this document defines no eval job. `nightly.yml` is therefore the text of 17.4 plus that one job.

---

## 18. Definition of done for a component

### 18.1 Checklist

A component is done, and its manifest `status` may be set to `stable`, only when every line holds. Each line names the command or file that proves it. `<id>` is the component id.

| # | Condition | Proof |
|---|---|---|
| 1 | The spec section for the component exists in doc 09, 10, 11 or 12 and follows the template of ledger section 7 | review |
| 2 | `components/<id>/<id>.json` validates against the manifest schema; `kind` follows D-006; every prop value comes from ledger section 6 | `pnpm gen --check` exit 0 |
| 3 | Fixtures: `default` first, plus every required fixture of `02-html-contract.md` 11.5; every fixture has its file; fixture lint has no finding; resources are referenced, not inlined | `pnpm gen --check` exit 0 |
| 4 | Generated files are current: reference HTML file, bindings of kind `static`, types, `props.css` if touched, docs page, registry index | `pnpm gen --check` exit 0 |
| 5 | Hand-written files exist: `components/<id>/<id>.css`; for kinds other than `static` the React, Remix and Liquid bindings; for a new element its source file and `src/.../<tag>.test.ts` | `pnpm build` exit 0 |
| 6 | Types are sound | `pnpm typecheck` exit 0 |
| 7 | Tier 1 | `pnpm test:component --component=<id>` reports the `[T1]` tests passed |
| 8 | Tier 2: every fixture conforms in every host of the fixture, with no skipped case | same command; `pnpm test:conformance --component=<id> --no-skips` exit 0 on Node 24 |
| 9 | Tier 3: zero unpermitted mutations and equal root boxes for every fixture; every `upgradeAllow` entry is as narrow as U-6 requires and has a `reason` | same command |
| 10 | Tier 4 (kinds `native`, `ui`, `commerce`): React hydration in both script orders; Remix morph | same command |
| 11 | Tier 5: `components/<id>/<id>.test.ts` covers every row of 10.2 that applies; axe reports nothing and `AXE_EXCEPTIONS` has no entry for the component other than under AX-2; keyboard, focus indicator and target-size tests pass | same command |
| 12 | Tier 6: render tests pass in both script modes; the flows required by the component's `noJs.level` pass | same command |
| 13 | Acceptance coverage: every numbered acceptance test of the spec has an `AT-<n>` test or an `AT-<n>: generic` line | `[T1] <id>: every acceptance test of the spec is covered` (18.2) |
| 14 | Style snapshots exist for every fixture and are committed; the pull request description states the intended look | `pnpm test:visual --component=<id>` exit 0; review |
| 15 | Size: the component CSS is at most 6,000 bytes minified and no budget is exceeded | `pnpm test:size` exit 0 |
| 16 | Tier 7 (kind `commerce` only): the `E2E` rows that exercise the component pass on `html`, `react` and `remix` | `RIPPLE_NETWORK=1 pnpm test:commerce --no-skips` exit 0 |
| 17 | Cross-engine: after 17.3 takes effect, `pnpm test:webkit --component=<id>` and `pnpm test:firefox --component=<id>` exit 0. Before that, both are run and their output is attached to the pull request | commands |
| 18 | The whole suite still passes | `pnpm ci` exit 0 |
| 19 | No test of the component is skipped, marked `todo`, or carries `[chromium]` without the comment required by N-2 | `[T1] test-names: every test name matches N-1 and every [chromium] tag has a reason` (18.3) |
| 20 | Liquid tier 8 is NOT a condition while the store does not exist (T-6). When `RIPPLE_STORE_URL` is set in CI, the component's `[T8]` conformance test MUST pass | `pnpm test:liquid-live` |
| 21 | Every `rp-*` root is `display: block`, before and after upgrade and without scripts (D-080) | U3-6 and NJ-1: `pnpm test:component --component=<id>` |
| 22 | Component rules exist as manifest `rules[]`, each with a failing example that reports `RP113` with the rule id in brackets (D-102 item 3) | the `[T1]` row "component rules" of 10.2 |
| 23 | A `"use client"` binding exports components only; helpers are in `<id>.data.ts` (D-094) | `pnpm gen --check` exit 0 (checker); `[T2] react: bindings type-check and every ts-expect-error is used` |
| 24 | Embedded and composed markup equals the owning contract: where the component prints another component's markup, that markup canonicalises to the owning component's reference for the same props (D-069, D-070) | fixture lint in `pnpm gen --check`; tier 2 |

A component with `status: "beta"` satisfies lines 1 to 9, 13 and 21 to 24. A component with `status: "planned"` has a manifest entry and nothing else, and is not tested (FX-2).

### 18.2 `test/conformance/acceptance-coverage.test.ts`

For every loaded component (status not `planned`), one test `[T1] <id>: every acceptance test of the spec is covered`:

1. Read `docs/09-components-foundation.md`, `docs/10-components-interactive.md`, `docs/11-components-commerce.md`, `docs/12-components-chrome-and-blueprints.md` (those that exist).
2. Find the level-2 heading `## <title>` where `<title>` equals the component's manifest `title`. Within that section (up to the next level-2 heading), find the heading `### Acceptance tests` and take the lines up to the next heading that starts with `###`.
3. Collect the required ids. A list item matching `^(\d+)\. ` with number `n` gives the id `AT-<n>` (D-104 item 1). A list item matching `^- \*\*([A-Z]{1,3}-\d+)\*\*` gives that prefixed id as written (`E-05`, `C-02`, `LT-3`, `CR-2`); prefixed ids are never renumbered to `AT-`. The set MUST NOT be empty.
4. Read `components/<id>/<id>.test.ts`. For every required id, the file text MUST contain the string `<id> ` (in a test name; for example `AT-3 ` or `CR-2 `) or the string `// <id>: generic`.
5. Fail with `components/<id>/<id>.test.ts: no test or generic note for <list of missing ids>`; fail with `<id>: no "## <title>" section with "### Acceptance tests" found in docs 09 to 12` when step 2 finds nothing.

### 18.3 `[T1] test-names` (in `test/run.test.ts`)

Reads every file matching the runner's `TEST_GLOBS`. Every string literal that is the first argument of a `test(` call and contains no `${` MUST match the pattern of N-1; a template literal MUST start with `[T` followed by a tier number and `] `. No file contains `describe(`, `suite(`, `test.todo(`, `test.only(`, `{ todo:` or `{ only:`. Every line containing `[chromium]` inside a test name is preceded by a line starting with `// [chromium]: `.

---

## 19. Acceptance criteria for this document

Each line is pass or fail and checkable by a command.

1. The root `package.json` `scripts` contains every entry of 2.3 with exactly the given value (`[T1] run: package.json scripts equal docs/13-testing.md 2.3`, comparing against a constant copy in `test/run.test.ts`).
2. `pnpm test:run --bogus` exits 2; `pnpm test:unit` exits 0 on a tree with no `pkg/`; `pnpm test:conformance` exits 2 with the `pkg/ is missing` message on the same tree.
3. `test/run.ts`, `src/testing/fixtures.ts`, `resources.ts`, `upgrade-diff.ts`, `liquid-shim.ts`, `serve-theme.ts`, `src/gen/size.ts`, `test/support/hosts/liquid.ts` and `tsx.ts` equal the code of this document. `test/run.ts`, `upgrade-diff.ts` and `src/gen/size.ts` were run as written; the others carry changes that are NOT RUN in this form (20, UNVERIFIED item 10).
4. The tests named in 4.6, 6.2, 6.3, 7.5, 15.3, 18.2 and 18.3 exist with exactly those names and pass.
5. For every case, the tests named by the templates of 7.1, 8.1, 10.3, 10.4, 11.1 and 14.3 exist (they are generated by loops over `loadFixtures()`), and the count test C-2 passes.
6. `size-budget.json` equals 15.1; `pnpm build` fails when a budget is exceeded or a budgeted file is missing.
7. `.github/workflows/ci.yml` equals 17.1. `.github/workflows/nightly.yml` equals 17.4 plus, from M3 onward, the `evals` job of `08-agent-kit-and-evals.md` section 8.14 (CI-8).
8. `pnpm ci` exits 0 on the main branch with `RIPPLE_NETWORK=1`, with the last runner line reporting `0 failed, 0 skipped`.
9. Removing one attribute that an element writes at upgrade from an `upgrade-snapshot` fixture makes `pnpm test:upgrade` fail with a line in the format of U3-1 (verified on the Tabs fixture: removing `aria-selected="true"` gives `... button#t-tab-account: attributes aria-selected: null -> "true"`).
10. `<pkg>/testing` imports in Node without `playwright` installed (A-05 of `01-architecture.md`), and `serveTheme` is among its exports.
11. The keys of `RESOURCES` equal the 21 references of 4.2 (`[T1] resources: the set is the documented set`), and `SHIM_TAGS` plus `SHIM_FILTERS` equal the union of the three scopes of `06-bindings.md` L-13 (`[T1] liquid-shim: filters`, `[T1] liquid-shim: tags outside the union throw`).

---

## 20. Evidence and UNVERIFIED

Evidence (all under `ripple/docs/research/spikes/testing/`; run `npm install && node prepare.mjs && pnpm test`; recorded output `result.txt`: 22 passed, 0 failed):

| Claim | Evidence |
|---|---|
| `node --test` refuses files under `node_modules/`; `run({ files })` accepts them; esbuild-bundled `.test.ts` files report failures at `.ts` lines | `test/run.ts`, `README.md` items 1, 2, 10 |
| A top-level `before()` runs when every test of the file is filtered out and its `after()` does not; lazy start avoids the hang | `README.md` item 9 |
| Recorder timing (`readystatechange` to `interactive`), `page.addInitScript(fn, arg)`, judging in the page with `matches` and `closest` | `src/upgrade-diff.ts`, `test/demo.test.ts` |
| Tabs `default` fixture: 2 same-value records, 0 value-changing; a broken fixture yields the stated failure lines | `result.txt` |
| `checkPattern` as an injected IIFE; axe-core injection; scripts disabled and scripts blocked give the same boxes | `test/demo.test.ts`, `test/support/in-page.ts` |
| Liquid shim in TypeScript conforms on six fixtures of the bindings spike; filters and errors | `src/liquid-shim.ts`, `test/shim.test.ts` |
| Theme server: multipart product form post, remove link, server-backed Standard Actions emulation, partial-rendering emulation through the injected import map | `src/serve-theme.ts`, `test/serve-theme.test.ts` |
| Liquid case builder, TSX case module, children tokens | `test/adapters.test.ts` |
| Size measurer with `lightningcss` 1.33.0 | `src/gen/size.ts`, `test/size.test.ts` |
| `checkPattern` signature and `Pattern` union | `uisdk/packages/core/src/testing/check-pattern.ts`, `uisdk/packages/core/src/testing.ts` |
| Standard Actions emulation shapes | `ripple/docs/research/spikes/commerce/fake-sa.js` |
| Original shim and canonicaliser | `ripple/docs/research/spikes/liquid/shim.mjs`, `ripple/docs/research/spikes/bindings/pkg/canonicalize.ts` |

UNVERIFIED (each with the default path that is implemented now):

1. `test/support/server.ts`, `browser.ts` as a module with a static Playwright import, the matrix test files of 7.1, 8.1, 10.3, 10.4, 11.1, 14.3, and the React and Remix renderer files were not executed as files; their mechanisms were. Default: implement as written; the named tests are the gate.
2. Tier 7: mock.shop was not reachable while this document was written. Default: 12.2 as written.
3. Tier 8 and everything about the live Liquid platform (13). Default: skip until `RIPPLE_STORE_URL` is set.
4. WebKit and Gecko: nothing in this document was run in them (SPIKE-06). Default: tier 9 non-blocking until the report exists.
5. Remix adapter and morph tests need Node 24.3; this environment has Node 22. Default: 7.4 and 9.2 as written; `06-bindings.md` reports the Remix SSR pipeline as run in its own spike.
6. The Tailwind build of 5.3 through the test server (the entry itself is the verified one of `03-styling-and-tokens.md` 5.2).
7. Shim differences from Shopify that tests cannot see: Liquid `blank` and `nil` semantics; the exact output of `money`, `image_url`, `payment_button`, `standard_event_data`, `font_face`, `date: format: 'date'`, `paginate` (titles, `parts`, URLs) and `form` for all six types (ids, classes, actions, hidden inputs; the four added types are the shim's own choice); `divided_by`, which in `liquidjs` always divides as floating point, while Shopify divides integers when both operands are integers (Ripple files MUST write a float divisor such as `16.0`, as `14-liquid-theme.md` does, or apply `round`); whether Shopify binds an unpassed schema setting as a bare variable; whether the platform wraps block or partial output. Default: masks plus tier 8.
8. `actions/upload-artifact@v4` option `include-hidden-files` and `pnpm/action-setup@v4` reading `packageManager` are stated from the actions' documentation as known to the author, not executed here.
9. `serveTheme` with a real `ripple.js` commerce element (ST-5).
10. The changed code of this revision was not run in its new form as the named test files: `resources.ts` (new resource set; 4.2), `liquid-shim.ts` (union pruning, `paginate`, `layout`, form types, added filters and globals; 4.4), `serve-theme.ts` (added routes, 404 template, POST handlers, `PageViewEvent`; 4.5), `hostHasProp`, `resolveSample`, `loadBlueprintSample` (4.1) and the FX-4 and RS-3 additions to the Liquid and TSX adapters (7.3, 7.4). What was done instead is stated at each block (bundled with esbuild 0.25.0; ad hoc scripts under Node 22.23.5 with `liquidjs` 10.30.1). Default: implement as written; the tests of 4.6 and 6.2 are the gate.
11. Members ending in `?` (`form.posted_successfully?`, `font.system?`): `liquidjs` 10.30.1 parses them and reads the key that includes the `?` (verified by script). Fallback when a later version does not: rewrite `.<name>?` to `.<name>__q` before parsing and expose both keys (4.6).
12. The event type string of the real `PageViewEvent` of `@shopify/standard-events` (ST-6), and whether the platform publishes the page view by itself (SPIKE-01). Default: the emulation logs to `window.__log`; tests never read the event type.
13. `useRegionHtml` (9.1): hydration without a mismatch and update after the first publish are UNVERIFIED until the SPIKE-10 report exists. Default: D-090 as written; fallback: the app cancels `rp:refresh` for the reasons `predictive` and `recommendations` and renders the results itself, and the test of 9.1 is replaced by a test of that cancellation.
14. The `_sample` file form read by `loadBlueprintSample` (`{ "$resource": ... }` values and the optional `"$liquid"` key) is this document's reading of `12-components-chrome-and-blueprints.md` 2.5 and X-11; that document owns the files.

---

## 21. Fallbacks

### Fallback (SPIKE-02)

Applies when the live platform wraps block or partial output in an element (the second `[T8]` test of section 13 fails).

1. Tier 8 conformance calls `canonicalize(output, { mask, unwrap: [<wrapper selector>] })` (`02-html-contract.md` 12.2 and section 15); the reference side is unchanged. The wrapper is also removed by the canonicaliser's host-extras step (D-075), so no test adds an unwrapping step of its own.
2. The shim's `partial` tag prints the same wrapper the platform prints (one line changed in `liquid-shim.ts`: `emitter.write("<wrapper open>" + body + "<wrapper close>")`), and tier 2 for Liquid passes the same `unwrap` list.
3. `PARTIAL_RENDERING_EMULATION.apply` selects the wrapper instead of `[data-rp-region]`.
4. The wrapper selector is a constant `LIQUID_WRAPPERS: string[]` exported from `src/testing/liquid-shim.ts`, empty on the default path.

### Fallback (SPIKE-06)

Per feature, when a `[T9]` probe of 11.3 fails in an engine at the floor. The CSS and JS changes are owned by `03-styling-and-tokens.md` (section 12) and `04-elements.md`; the test changes are:

| Probe that fails | Test change |
|---|---|
| `pow() or literal type scale` | none: the probe asserts the computed size, which the literal scale also satisfies |
| `relative colour or literal colours` | none: the probe asserts contrast |
| `anchor positioning or centred popover` | none on the default fallback (centred). If the positioning routine of the ledger's fallback is added to the runtime, add `[T5] popover: panel is placed on the requested side` and remove `[chromium]` from nothing (the test runs in all engines) |
| `scripting none or default panel` | NJ-4 already limits the Tabs comparison; no change |
| `details name is exclusive` | Accordion `type="single"` becomes `noJs.level: "degraded"` in that engine only if the ledger records it; the probe then asserts that each item still toggles |
| `attribute-token props match`, `revert-layer` | no fallback exists; record the engine and version in the ledger and raise the floor (D-032); the probe keeps failing below the new floor and passes at it |
| `closedby or backdrop click`, `Invoker Commands or polyfill` | the fallback is already the tested path (the element's handler and the polyfill) |

---

## Ledger issues

None open. See `00-decisions.md` sections 13.2 and 13.3 (D-109 to D-113).
