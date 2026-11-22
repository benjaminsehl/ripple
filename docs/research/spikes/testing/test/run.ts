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
