import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, writeFileSync } from "node:fs"
import { formatSizes, measureSizes, readBudget } from "../src/gen/size"

test("[T10] size: measureSizes reports ok, over and missing", () => {
  mkdirSync("node_modules/.cache/size/c", { recursive: true })
  writeFileSync("node_modules/.cache/size/a.css", ".rp-a { color: red; }\n".repeat(50))
  writeFileSync("node_modules/.cache/size/b.js", "export const a = 1;\n".repeat(500))
  writeFileSync("node_modules/.cache/size/c/x.css", "@layer rp.components { .rp-x[data-gap~=\"md:6\"] { gap: calc(var(--spacing) * 6); } }\n")
  writeFileSync("node_modules/.cache/size/budget.json", JSON.stringify({ version: 1, entries: [
    { id: "css-a", files: ["node_modules/.cache/size/a.css"], measure: "min-gzip", max: 100, source: "test" },
    { id: "js-b", files: ["node_modules/.cache/size/b.js"], measure: "gzip", max: 10, source: "test" },
    { id: "css-each", glob: "node_modules/.cache/size/c/*.css", measure: "min", max: 6000, source: "test" },
    { id: "gone", files: ["node_modules/.cache/size/nope.js"], measure: "gzip", max: 10, source: "test" },
  ] }))
  const results = measureSizes(readBudget("node_modules/.cache/size/budget.json"))
  console.log(formatSizes(results))
  assert.deepEqual(results.map((r) => r.status), ["ok", "over", "ok", "missing"])
})
