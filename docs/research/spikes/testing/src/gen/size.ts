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
