# M8 Agent kit and evals: task detail

Status: detail file for the 43 rows of milestone M8 in `docs/PLAN.md` section 6. `docs/00-decisions.md` (the ledger) wins over every spec; a spec wins over this file. This file adds no public API. Where it fixes a choice the specs leave open, the choice is marked PLAN-CHOSEN (a name) or "Plan reading" (a conflict or silence), and every Plan reading is listed in section 0.12.

How to use: read `AGENTS.md`, `docs/CONVENTIONS.md`, `docs/PLAN.md` sections 1 to 3 and 5.0, then the parts of section 0 of this file that your task's "Read first" names (0.1, 0.2, 0.5 to 0.8 and 0.13 always; about 16 kB), then ONLY your task's section `## <task id>`. Do not read other task sections and do not read the other `docs/plan/M*.md` files: every rule you need from them is restated in section 0.

Contents: 0 Rules for every M8 task. Then M8-T01 to M8-T43 in table order.

---

## 0. Rules for every M8 task

### 0.1 Finding what to read

- **M8-R1** Spec files are large and are edited between sessions. Never use a line number. Find a section by searching for its heading text exactly as this file prints it (for example search `### 8.5 ` in `docs/08-agent-kit-and-evals.md`) and read up to the next heading of the same or a higher level.
- **M8-R2** "Read first" lists are complete. Sizes are approximate. Read nothing else unless a failing command names another file. Abbreviations: "doc 01" is `docs/01-architecture.md`, "doc 02" `docs/02-html-contract.md`, "doc 03" `docs/03-styling-and-tokens.md`, "doc 04" `docs/04-elements.md`, "doc 05" `docs/05-commerce.md`, "doc 06" `docs/06-bindings.md`, "doc 07" `docs/07-manifest-registry-cli.md`, "doc 08" `docs/08-agent-kit-and-evals.md`, "doc 10" `docs/10-components-interactive.md`, "doc 11" `docs/11-components-commerce.md`, "doc 12" `docs/12-components-chrome-and-blueprints.md`, "doc 13" `docs/13-testing.md`, "doc 14" `docs/14-liquid-theme.md`, "ledger" `docs/00-decisions.md`.
- **M8-R3** A code block that a spec prints as the required text (the `EvalTask` and `HarnessAdapter` interfaces, `bar.json`, the `evals` job, the `nightly.yml` text) MUST be extracted with an extractor (0.3); do not retype it and do not read it into your context. Change it only where a named test fails, and list every change in the pull request under "Deviations".
- **M8-R4** The specs cite reference trees `hydrogen/`, `uisdk/`, `tobi/` and `remix/` by paths such as `hydrogen/scripts/storefront-benchmark-harness/Dockerfile`. They are sibling checkouts of the repository, so from the repository root they are `../hydrogen/...`. Whether a session has them is UNVERIFIED: check with `ls ../hydrogen/scripts/storefront-benchmark-harness/`. When absent, follow the spec text alone and say so in the pull request. Never copy a file from them into the repository except where a step says "port".
- **M8-R5** Never edit `theme/` or `docs/research/` except the one file M8-T39 creates (`docs/research/spikes/evals-baseline/README.md`).

### 0.2 Values every M8 task uses

| Thing | Value | Source |
|---|---|---|
| Package placeholder | `ripple-kit`, read only from `PKG_NAME` in `src/identity.ts`; binary `ripple`; `VERSION` `0.1.0`. Hand-written text under `skills/` and `guides/` writes `__PKG__`; the build replaces it in `pkg/` | doc 01 section 6.3 rules 1 and 2 |
| Command form in static files | always `npx __PKG__ <command>`; the only `docs` forms are `docs`, `docs <component id>`, `docs <RULE>`, `docs guide <topic>` | doc 08 sections 0 and 2.7, ledger D-110 |
| Hosts | `html`, `react`, `remix`, `liquid` | doc 07 section 4.4 |
| Test name | `[T<n>] <subject>: <statement>`, flat `test()` from `node:test`, `node:assert/strict`, no `describe`. `<subject>` is the source module name without extension | doc 13 section 2.4 |
| Root test runner | `test/run.ts`; it collects tests under `src/`, `css/`, `components/`, `blueprints/`, `test/` only. It never runs anything under `skills/`, `guides/` or `evals/` | doc 13 section 2.6 |
| `tsconfig.json` | excludes `evals`; does not include `skills/` or `guides/` | doc 01 section 5.2 |
| Root scripts | byte-equal to doc 13 section 2.3; they already contain `"eval": "node evals/adapters/run.ts"`. MUST NOT change | doc 13 section 2.3, D-061, D-103 |
| `.gitignore` | exactly `node_modules/`, `pkg/`, `evals/runs/` | doc 01 section 4.1 |
| Eval harness runtime | erasable-syntax TypeScript run directly by Node 22.18 or later; no build step; `evals/adapters/package.json` is `"private": true` and depends on `"ripple-kit": "file:../../pkg"` and on `playwright` at the root's exact version | doc 08 section 8.1, doc 01 section 4.2 rule 2 |
| Eval scoring | weights 35 / 15 / 20 / 10 / 10 / 10; a run passes at total 80 with all gates, functional fraction at least 0.9 and zero checker errors | doc 08 section 8.8 |
| Proof commands | `pnpm typecheck && pnpm gen --check && pnpm build && pnpm examples:install && pnpm test --no-skips` (`pnpm ci`); while working: `pnpm test:unit --files=<path prefix>`. Eval tasks add the commands of 0.11 | PLAN 5.0 |
| Node below 24.3 | Remix cases skip; run without `--no-skips`, confirm every skip reason is `Remix needs Node 24.3 or later`, list the skips in the pull request | doc 13 T-7 |

### 0.3 The extractors

Create once per session (not committed; `node_modules/` is git-ignored). The first is the extractor of the M6 plan; the second also finds fences indented inside a list item.

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
cat > node_modules/.cache/ripple/extract-indented.mjs <<'EOF'
import fs from "node:fs"; import path from "node:path"
const [file, heading, lang, indent, out] = process.argv.slice(2)
const pad = " ".repeat(Number(indent))
const t = fs.readFileSync(file, "utf8")
const i = t.indexOf("\n" + heading)
if (i < 0) throw new Error("heading not found: " + heading)
const open = "\n" + pad + "```" + lang + "\n"
const p = t.indexOf(open, i)
if (p < 0) throw new Error("code block not found")
const s = p + open.length
const e = t.indexOf("\n" + pad + "```", s)
const body = t.slice(s, e).split("\n").map((l) => (l.startsWith(pad) ? l.slice(pad.length) : l)).join("\n")
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, body + "\n")
console.log(out, body.length + 1, "bytes")
EOF
```

Usage: `node node_modules/.cache/ripple/extract.mjs <doc file> '<heading prefix>' <language> <index> <output path>` and `node node_modules/.cache/ripple/extract-indented.mjs <doc file> '<heading prefix>' <language> <indent> <output path>`. Extractions used by this file (bytes and first line checked on 2026-11-22; when either differs the doc changed: stop and report, do not guess another block):

| Id | Doc | Heading prefix | Lang | Index or indent | Bytes | First line |
|---|---|---|---|---|---|---|
| X-1 | doc 08 | `### 8.2 ` | ts | index 0 | 1187 | `interface EvalTask {` |
| X-2 | doc 08 | `### 8.7 ` | ts | index 0 | 884 | `export interface HarnessAdapter {` |
| X-3 | doc 08 | `### 8.8 ` | json | index 0 | 1348 | `{` |
| X-4 | doc 08 | `### 8.12 ` | json | index 0 | 434 | `{` |
| X-5 | doc 08 | `### 8.14 ` | yaml | indent 2 | 735 | `  evals:` |
| X-6 | doc 08 | `### 8.3 ` | ts | indent 4 | 292 | `import { serveTheme } from "<pkg>/testing";` |
| X-7 | doc 08 | `### 7.4 ` | js | index 0 | 649 | `// bundled app (react)` |
| X-8 | doc 13 | `### 17.4 ` | yaml | index 0 | 1484 | `name: nightly` |

### 0.4 Lint scripts for guides and skills

Read only by M8-T04 to M8-T20. They check every machine-checkable rule of doc 08 sections 2.5, 2.8 (K-06, K-07, K-09 for one guide) and 4.1 to 4.6 (K-20 to K-28 for one skill, except K-26 and K-27, which M8-T21 tests). They are session tools, not committed. M8-T21 turns the same rules into committed tests; when a lint script and a test disagree, the test wins and the disagreement goes into the pull request.

```bash
cat > node_modules/.cache/ripple/skill-lint.mjs <<'EOF'
// Usage: node node_modules/.cache/ripple/skill-lint.mjs <skill name>   (run from the repository root)
// Checks one skill against docs/08-agent-kit-and-evals.md sections 4.1, 4.2, 4.3, 4.5 (K-20 to K-28 for one skill).
import fs from "node:fs"
import path from "node:path"

const name = process.argv[2]
if (!name) { console.error("usage: skill-lint.mjs <skill name>"); process.exit(2) }
const doc = fs.readFileSync("docs/08-agent-kit-and-evals.md", "utf8")
const section = (start, end) => { const s = doc.indexOf("\n" + start); const e = doc.indexOf("\n" + end, s + 1); if (s < 0 || e < 0) throw new Error("heading not found: " + start); return doc.slice(s, e) }
const problems = []
const fail = (m) => problems.push(m)

// 4.2: name, hosts, title
const table = {}
for (const line of section("### 4.2 ", "### 4.3 ").split("\n")) {
  const m = /^\| \d+ \| `([a-z-]+)` \| ([a-z, ]+) \| (.+) \|$/.exec(line)
  if (m) table[m[1]] = { hosts: m[2].split(", "), title: m[3] }
}
if (Object.keys(table).length !== 14) throw new Error("4.2 table not parsed: " + Object.keys(table).length)
const known = new Set(Object.keys(table))
if (!known.has(name)) { console.error(`unknown skill ${name}`); process.exit(2) }
// 4.3: other packages' skills
const others = new Set()
for (const line of section("### 4.3 ", "### 4.4 ").split("\n")) { const m = /^\| `([a-z0-9-]+)` \|/.exec(line); if (m) others.add(m[1]) }
// 4.5.n: description, line budget, topic headings
const outlineStart = doc.indexOf("\n#### 4.5.", doc.indexOf("\n### 4.5 "))
const outlines = doc.slice(outlineStart, doc.indexOf("\n### 4.6 ")).split("\n#### 4.5.").slice(1)
const outline = outlines.find((o) => o.split("\n")[0].endsWith("`" + name + "`"))
if (!outline) throw new Error("outline not found for " + name)
const descLine = outline.split("\n").find((l) => l.startsWith("- description: `"))
const description = descLine.slice("- description: `".length, descLine.lastIndexOf("`"))
const budget = Number(/- Line budget: (\d+)\./.exec(outline)[1])
const topics = [...outline.matchAll(/^- `## ([^`]+)`/gm)].map((m) => m[1]).filter((h) => !["When to use", "Rules", "Steps", "Done when"].includes(h))
const otherOmitted = name === "ripple-theming"
const expectedHeadings = ["When to use", "Rules", "Steps", ...topics, ...(otherOmitted ? [] : ["Other skills"]), "Done when"]

const dir = path.join("skills", name)
const entries = fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []
if (entries.join(",") !== "SKILL.md,ripple.json") fail(`K-20: ${dir} must contain exactly SKILL.md and ripple.json, found: ${entries.join(", ")}`)
if (fs.existsSync(path.join(dir, "ripple.json"))) {
  const raw = fs.readFileSync(path.join(dir, "ripple.json"), "utf8")
  if (JSON.stringify(JSON.parse(raw)) !== JSON.stringify({ hosts: table[name].hosts })) fail(`K-23: ripple.json must be ${JSON.stringify({ hosts: table[name].hosts })}`)
}
if (!fs.existsSync(path.join(dir, "SKILL.md"))) { fail(`K-20: ${dir}/SKILL.md is missing`); report(0) }
const text = fs.readFileSync(path.join(dir, "SKILL.md"), "utf8")
if (text.includes("\r")) fail("SKILL.md must use LF line endings")
if (!text.endsWith("\n") || text.endsWith("\n\n")) fail("SKILL.md must end with exactly one newline")
const lines = text.slice(0, -1).split("\n")
if (lines.length > Math.min(300, budget)) fail(`S-1: ${lines.length} lines; budget ${budget}, limit 300`)
if (lines[0] !== "---" || lines[1] !== `name: ${name}` || !lines[2].startsWith("description: ") || lines[3] !== "---") fail("K-21: frontmatter must be exactly ---, name, description, ---")
else {
  if (lines[2].slice("description: ".length) !== description) fail(`K-21: description differs from doc 08 4.5:\n  expected: ${description}\n  found:    ${lines[2].slice(13)}`)
  if (!/ Use (when|for|after)/.test(description)) fail("K-21: description lacks Use when/for/after")
}
// headings outside fences
let fence = false
const h1 = [], h2 = []
const blocks = []
let current = null
lines.forEach((l, i) => {
  if (/^```/.test(l)) {
    if (!fence) { current = { lang: l.slice(3).trim(), body: [] }; fence = true } else { blocks.push(current); fence = false }
    return
  }
  if (fence) { current.body.push(l); return }
  if (/^# /.test(l)) h1.push(l.slice(2))
  if (/^## /.test(l)) h2.push({ text: l.slice(3), index: i })
})
if (fence) fail("unclosed code fence")
if (h1.length !== 1 || h1[0] !== table[name].title) fail(`S-6: exactly one title line "# ${table[name].title}" is required`)
const found = h2.map((h) => h.text)
if (found.join(" | ") !== expectedHeadings.join(" | ")) fail(`S-6: level-2 headings differ\n  expected: ${expectedHeadings.join(" | ")}\n  found:    ${found.join(" | ")}`)
const body = (heading) => { const k = h2.findIndex((h) => h.text === heading); if (k < 0) return []; return lines.slice(h2[k].index + 1, k + 1 < h2.length ? h2[k + 1].index : lines.length) }
const rules = body("Rules").filter((l) => /^\d+\. /.test(l))
if (rules.length === 0 || rules.length > 12) fail(`S-7: Rules has ${rules.length} numbered items; 1 to 12 allowed`)
const done = body("Done when").filter((l) => l.trim() !== "")
const lastItem = name === "ripple-setup" ? "- [ ] `npx __PKG__ check` prints `No problems` (run it after the first page exists)." : "- [ ] `npx __PKG__ check` prints `No problems`."
if (done.length === 0 || done.some((l) => !l.startsWith("- [ ] ")) || done[done.length - 1] !== lastItem) fail(`S-7: Done when must be a "- [ ] " checklist whose last line is: ${lastItem}`)
// banned strings (K-06, K-09, K-24, K-28)
const outsideHtml = []
fence = false; let lang = ""
for (const l of lines) { if (/^```/.test(l)) { if (!fence) { lang = l.slice(3).trim() } fence = !fence; continue } if (!(fence && lang === "html")) outsideHtml.push(l) }
const banned = [[/D-0\d\d/, "K-24"], [/SPIKE-/, "K-24"], [/src\//, "K-24"], [/00-decisions/, "K-24"], [/ripple-kit/, "K-24"], [/named blocking Frame/, "K-28"], [/(?<!data-)orientation=/, "K-28"], [/docs --rule/, "K-28"], [/[,{%]\s*form:\s/, "K-28"], [/references\//, "K-28"], [/pnpm exec ripple|yarn ripple|bunx/, "K-09"], [/\bTBD\b/, "K-06"]]
lines.forEach((l, i) => { for (const [re, id] of banned) if (re.test(l)) fail(`${id}: line ${i + 1} matches ${re}`) })
outsideHtml.forEach((l) => { if (l.includes("data-rp-open=")) fail("K-28: data-rp-open= outside a fenced html block") })
// K-25: other skills named in backticks
for (const m of text.matchAll(/`([a-z0-9-]+)`/g)) {
  const n = m[1]
  if ((n.startsWith("hydrogen-") || ["ui-sdk", "remix", "migrate-to-hydrogen-2026-10"].includes(n)) && !others.has(n)) fail(`K-25: \`${n}\` is not in the table of 4.3`)
  if (n.startsWith("ripple-") && !known.has(n)) fail(`K-25: \`${n}\` is not a skill of 4.2`)
}
// K-22: code blocks come from fixtures, generated component pages or blueprint files
const squash = (s) => s.replace(/\s+/g, " ").trim()
const walk = (d, out = []) => { if (!fs.existsSync(d)) return out; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else out.push(p) } return out }
let corpus = null
const sources = () => {
  if (corpus) return corpus
  const files = [...walk("components").filter((f) => f.includes(`${path.sep}fixtures${path.sep}`) && f.endsWith(".html")), ...walk("blueprints").filter((f) => !f.includes("_sample") && !f.endsWith(".json") && !f.endsWith(".test.ts")), ...walk("pkg/docs/components")]
  corpus = files.map((f) => squash(fs.readFileSync(f, "utf8")))
  return corpus
}
let sketches = 0
for (const b of blocks) {
  if (!["html", "liquid", "tsx"].includes(b.lang)) continue
  const first = (b.body[0] ?? "").trim()
  if (["<!-- sketch -->", "{% comment %}sketch{% endcomment %}", "// sketch"].includes(first)) { sketches++; continue }
  const needle = squash(b.body.join("\n"))
  if (!sources().some((s) => s.includes(needle))) fail(`K-22: a fenced ${b.lang} block is not a substring of any fixture, component page or blueprint file:\n  ${needle.slice(0, 160)}`)
}
if (sketches > 3) fail(`K-22: ${sketches} sketch blocks; at most 3`)
if (!fs.existsSync("pkg/docs/components")) console.log("note: pkg/docs/components is absent; run pnpm build so that TSX examples from component pages are found")
report(lines.length)

function report(count) {
  if (problems.length) { for (const p of problems) console.log("FAIL " + p); console.log(`skill-lint ${name}: ${problems.length} problem(s)`); process.exit(1) }
  console.log(`skill-lint ${name}: ok (${count} lines)`)
  process.exit(0)
}
EOF
cat > node_modules/.cache/ripple/guide-lint.mjs <<'EOF'
// Usage: node node_modules/.cache/ripple/guide-lint.mjs <topic> [<topic> ...]   (run from the repository root)
// Checks guides/<topic>.md against docs/08-agent-kit-and-evals.md section 2.5 and tests K-06, K-07, K-09.
import fs from "node:fs"
import path from "node:path"

const doc = fs.readFileSync("docs/08-agent-kit-and-evals.md", "utf8")
const s = doc.indexOf("\n### 2.5 "), e = doc.indexOf("\n### 2.6 ")
const table = {}
for (const line of doc.slice(s, e).split("\n")) {
  const m = /^\| (\d+) \| `([a-z-]+)` \| ([^|]+) \|/.exec(line)
  if (m) table[m[2]] = { n: Number(m[1]), title: m[3].trim() }
}
if (Object.keys(table).length !== 12) throw new Error("2.5 table not parsed: " + Object.keys(table).length)
const components = new Set(fs.existsSync("components") ? fs.readdirSync("components").filter((d) => fs.existsSync(path.join("components", d, d + ".json"))) : [])
const rules = new Set(fs.existsSync("src/check/rules") ? fs.readdirSync("src/check/rules").filter((f) => /^RP\d{3}\.ts$/.test(f)).map((f) => f.slice(0, 5)) : [])
let failed = 0
for (const topic of process.argv.slice(2)) {
  const problems = []
  const fail = (m) => problems.push(m)
  if (!table[topic]) { console.log(`FAIL ${topic}: not a topic of doc 08 2.5`); failed++; continue }
  const file = path.join("guides", topic + ".md")
  if (!fs.existsSync(file)) { console.log(`FAIL ${topic}: ${file} is missing`); failed++; continue }
  const text = fs.readFileSync(file, "utf8")
  if (text.includes("\r")) fail("CRLF line endings")
  if (!text.endsWith("\n") || text.endsWith("\n\n")) fail("must end with exactly one newline")
  const lines = text.slice(0, -1).split("\n")
  if (lines.length > 250) fail(`K-07: ${lines.length} lines; limit 250`)
  if (lines[0] !== "---" || lines[1] !== `title: ${table[topic].title}` || !lines[2]?.startsWith("summary: ") || lines[3] !== "---") fail(`K-07: frontmatter must be ---, title: ${table[topic].title}, summary: <sentence>, ---`)
  else {
    const summary = lines[2].slice("summary: ".length)
    if (summary.length === 0 || summary.length > 140) fail(`summary is ${summary.length} characters; 1 to 140 allowed`)
    if (summary.includes("|")) fail("summary contains |")
  }
  const banned = [[/ripple-kit/, "doc 01 6.3 rule 1"], [/\bTBD\b/, "K-06"], [/docs --rule|pnpm exec ripple|yarn ripple|bunx/, "K-09"]]
  lines.forEach((l, i) => {
    for (const [re, id] of banned) if (id && re.test(l)) fail(`${id}: line ${i + 1} matches ${re}`)
    for (const m of l.matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = m[1].split("#")[0]
      if (/^[a-z]+:/.test(target) || target === "") continue
      const resolved = path.posix.normalize(path.posix.join("docs/guides", target))
      let ok = false
      if (/^docs\/guides\/[a-z-]+\.md$/.test(resolved)) ok = !!table[path.posix.basename(resolved, ".md")]
      else if (/^docs\/components\/[a-z0-9-]+\.md$/.test(resolved)) ok = components.has(path.posix.basename(resolved, ".md"))
      else if (/^docs\/rules\/RP\d{3}\.md$/.test(resolved)) ok = rules.has(path.posix.basename(resolved, ".md"))
      else ok = resolved === "docs/INDEX.md" || resolved === "docs/llms.txt"
      if (!ok) fail(`K-07: line ${i + 1}: link ${m[1]} does not resolve inside pkg/docs/`)
    }
  })
  if (problems.length) { failed++; for (const p of problems) console.log(`FAIL ${topic}: ${p}`) } else console.log(`guide-lint ${topic}: ok (${lines.length} lines)`)
}
process.exit(failed ? 1 : 0)
EOF
```

Usage, from the repository root, after `pnpm build` (K-22 also searches `pkg/docs/components/`): `node node_modules/.cache/ripple/skill-lint.mjs <skill name>` prints `skill-lint <name>: ok (<n> lines)` and exits 0, or prints `FAIL` lines and exits 1. `node node_modules/.cache/ripple/guide-lint.mjs <topic> [<topic> ...]` prints `guide-lint <topic>: ok (<n> lines)` per guide. Both scripts were run on 2026-11-22 against a hand-made passing skill and guide and against broken copies.

### 0.5 What exists before M8 and what each task replaces

| Thing | State before M8 | Replaced or completed by |
|---|---|---|
| `src/check/rules/RP*.ts` | 55 files, each exporting `rule` (with `meta`) and `text: RuleText` (M2, M4, M6); `src/check/rules/index.ts` lists them | M8-T01 audits; it changes text only where K-31 fails |
| `src/check/report.ts` | exports `RuleText`, `FIX_SYNONYMS` and the text and JSON formatters (M0, M6) | M8-T01 adds tests only |
| `src/gen/docs.ts`, `src/gen/docs.test.ts` | M6-T14: component pages, `INDEX.md`, `llms.txt`, rule pages; K-03, K-04, K-05, K-08 tests | M8-T01 adds K-01; M8-T21 adds K-02, K-06, K-07, K-09 |
| `src/gen/agents-md.ts` | M6-T13: `renderAgentsSection`, `UNIVERSAL_RULES`, `AGENTS_SECTION_MAX_BYTES`; tests K-10 to K-12, K-14, K-16 | M8-T21 re-runs them with all 84 components and records K-15 |
| `src/gen/build.ts` step 8 | copies `guides/*.md` to `pkg/docs/guides/` when `guides/` exists, else prints `build: skipped guides (PLAN 4.4)`; prints `build: skipped skills (PLAN 4.4)` for the skills copy. The exact wording is in the file: find it with `grep -n "PLAN 4.4" src/gen/build.ts` | M8-T21 removes both skip lines and their markers |
| `src/cli/commands/skills.ts` | M6-T26: `syncSkills` reads `<packageRoot>/skills/<name>/{SKILL.md,ripple.json}`; an absent `skills/` syncs nothing | unchanged; M8-T21 tests it on the real skills (K-27) |
| `skills/`, `guides/`, `evals/` | absent (or holding only what an earlier task created; check with `ls`) | M8-T07 to M8-T20, M8-T04 to M8-T06, M8-T22 onward |
| `src/agent/` (bridge), `src/commerce/rp-*.ts` | M1, M4: the bridge `createAgent`, `registerTools`, `loadAgent()` on `ripple.js`; each commerce element declares its actions; `src/commerce/rp-cart.agent-confirm.test.ts` (SPIKE-08, M1-T41) | M8-T03 adds tests; it changes source only where a 7.8 test fails |
| `examples/<host>/` | complete after M7 (M7-T20 to M7-T23): every blueprint installed by the CLI | read by M8-T22 (templates) and M8-T31 to M8-T38 (references) |
| `.github/workflows/nightly.yml` | text of doc 13 section 17.4 (M0) | M8-T41 appends the `evals` job |
| `BRINGUP_SUBSET` | deleted by M5-T14; all 84 components exist | - |

A bring-up line in source carries a comment containing `PLAN 4.4` and the task that removes it. The task that adds the real code deletes the line and its marker. After M8 the only `PLAN 4.4` strings left under `src/` are ones a done file names for M9 (M9-T05 fails on any).

### 0.6 Names chosen by this plan (the specs are silent)

Separate sessions must agree on these. Each is PLAN-CHOSEN and internal (no package export). When a spec section you read names the same thing differently, the spec wins; use its name and record it in the done file.

Tests and data files:

| Name | File | Meaning | Created by |
|---|---|---|---|
| `meta.expected.json` | `src/check/rules/meta.expected.json` | spec name (K-31). Object keyed by rule id, ascending; each value `{ "problem", "fix", "why" }` holding the raw cell text of doc 08 section 5.5 columns "problem", "fix", "why" (backticks kept, nothing unescaped). Generated once by the script of M8-T01 step 3 | M8-T01 |
| rule text tests | `src/check/rules/meta.test.ts`, subject `meta` | K-31, K-32, K-34 (audit), K-36 | M8-T01 |
| `test/dev-only-strings.json` | spec name (K-41) | JSON array of strings, one per development-only family of doc 08 section 6.2 | M8-T02 |
| warning source scan | `src/warnings.test.ts`, subject `warnings` | K-40 | M8-T02 |
| skills acceptance | `src/gen/skills.test.ts`, subject `skills` | K-20 to K-28 (PR-M8-1) | M8-T21 |
| agent action table test | `src/commerce/agent-actions.test.ts`, subject `agent-actions` | K-56 and the build assertion of doc 08 section 7.6 last paragraph | M8-T03 |

Eval harness modules (all under `evals/adapters/`; every function is exported for tests):

| Name | File | Signature and meaning | Created by |
|---|---|---|---|
| `EvalTask`, `HarnessAdapter`, `RunResult` | `types.ts` | the interfaces of doc 08 sections 8.2 and 8.7, extracted (X-1, X-2), each with `export` added | M8-T22 |
| `Host`, `Arm`, `Tier` | `types.ts` | `"html" \| "react" \| "remix" \| "liquid"`; `"ripple" \| "control" \| "no-skills" \| "pi-package"`; `"local" \| "live"` | M8-T22 |
| `RunRecord` | `types.ts` | the shape of `result.json` (X-3) as an interface; `visual` is `null` when unjudged; `scores.visual` is `number \| null` | M8-T22 |
| `validateTask` | `types.ts` | `(value: unknown, id: string) => string[]`; one message per violation of `EvalTask` (missing or extra key, wrong type, `id` not equal to the directory name, `set` not matching 0.11 core list, `hosts` empty) | M8-T22 |
| `CORE_SET` | `types.ts` | `["T01","T02","T03","T04","T06","T07","T08","T09","T10","T11"]` (doc 08 section 8.6) | M8-T22 |
| `buildWorkspace` | `workspace.ts` | `(o: { task: EvalTask; host: Host; arm: Arm; workspaceDir: string; tarball: string; prevTarball?: string; cliImpl?: typeof cli }) => Promise<{ startCommit: string; startModified: string[] }>`; doc 08 sections 8.4 steps 2 and 3 and 8.5 | M8-T22 |
| `spawnInContainer` | `workspace.ts` | `(argv: string[], o: { cwd: string; env: Record<string, string>; timeoutMs: number; name: string }) => Promise<{ exitCode: number; timedOut: boolean; stdout: string; stderr: string; wallMs: number }>`; the one place that runs `docker` | M8-T22 |
| `parseOptions`, `main` | `run.ts` | `parseOptions(argv: string[])` returns the options of 8.4 plus PR-M8-18; `main(argv: string[], inject?: { adapters?: Record<string, HarnessAdapter> }) => Promise<number>` returns the exit code | M8-T22 (`inject` added by M8-T30) |
| `cli` | `workspace.ts` | `(workspaceDir: string, host: Host, args: string[]) => Promise<{ code: number; stdout: string; stderr: string }>`; runs the packed CLI in a workspace: Liquid `npx --yes ./vendor/ripple.tgz <args>`, npm hosts `pnpm exec ripple <args>` after the workspace install | M8-T22 |
| `startApp` | `serve.ts` | `(workspaceDir: string, host: Host) => Promise<{ url: string; resetCart(): Promise<void>; close(): Promise<void> }>`; Liquid: exactly the `serveTheme` call of X-6; npm hosts: the template's `start` script on a free port, `resetCart` clears the cart cookie of the checks' browser context | M8-T23 |
| `waitForRoutes` | `serve.ts` | `(url: string, paths: string[], timeoutMs = 120000) => Promise<void>` | M8-T23 |
| `pickCatalogue` | `mockshop.ts` | `(runDir: string, fetchImpl = fetch) => Promise<{ product: string; collection: string; page: string }>`; one Storefront API query; cached in `<runDir>/mockshop.json` | M8-T23 |
| `fillRoute` | `mockshop.ts` | `(path: string, catalogue) => string`; replaces `{product}`, `{collection}`, `{page}` | M8-T23 |
| `EvalCheck`, `CheckContext`, `SkipCheck` | `checks.ts` | `interface EvalCheck { id: string; rippleOnly?: boolean; run(ctx: CheckContext): Promise<void> }` (throws an `Error` to fail, `SkipCheck` to skip); `CheckContext` is `{ baseUrl: string; host: Host; tier: Tier; arm: Arm; workspace: string; browser: import("playwright").Browser; routes: Record<string, string>; ripple(args: string[]): Promise<{ code: number; stdout: string; stderr: string }>; resetCart(): Promise<void>; baselineDir: string \| null }` (`baselineDir`: 1440 px screenshots of the base state without the overlay; T08 only); `class SkipCheck extends Error { constructor(reason: string) }` | M8-T23 |
| check helpers | `checks.ts` | `settled(page, quietMs = 500)`, `jsOff(browser)` (a context with `javaScriptEnabled: false`), `inheritedChecks(task: EvalTask): EvalCheck[]` (`<task>-C0`, `<task>-CL`), `compareScreenshots(page: import("playwright").Page, actual: Buffer, expected: Buffer, o: { maxDiffPixelRatio: number; threshold: number }): Promise<{ ratio: number; passed: boolean }>`, `runChecks(checks, ctx): Promise<RunRecord["functional"]>`, gates `gateRenders(ctx)`, `gateNoPageError(ctx)`, `gateNoSecret(ctx, secrets)` (each `Promise<boolean>`), `takeScreenshots(ctx, task, outDir)`, `visualFindings(page)` | M8-T23 |
| task check modules | `evals/tasks/<id>/checks.spec.ts` | `export const checks: EvalCheck[]`; plus one exported `async function <name>(page)` per `task.screenshots[].steps` (PR-M8-8) | M8-T31 to M8-T38 |
| `scoreRun` | `score.ts` | `(r: Omit<RunRecord, "scores" \| "passed">, budgets: EvalTask["budgets"]) => { scores: RunRecord["scores"]; passed: boolean; unjudged: boolean }` | M8-T24 |
| `measureOutside` | `outside.ts` | `(o: { workspace: string; startCommit: string; codeDirs: EvalTask["codeDirs"]; html: string[]; statusJson: unknown; startModified: string[] }) => RunRecord["outside"]` | M8-T24 |
| `extractFriction` | `friction.ts` | `(r: Pick<RunResult, "toolOutputs" \| "commands">) => { friction: RunRecord["friction"]; checkInvocations: number; checksUntilClean: number \| null; docsInvocations: number }` | M8-T24 |
| `writeReport` | `report.ts` | `(runDir: string) => void`; reads every `<runDir>/*/result.json`, writes `<runDir>/report.md` and `<runDir>/report.json` | M8-T24 |
| `gateStayedInWorkspace` | `outside.ts` | `(commands: string[], cwd: string) => boolean` | M8-T24 |
| `decisionTriggers` | `report.ts` | `(results: RunRecord[]) => Array<{ rule: string; metric: string; value: number }>`; G-1 to G-6 of doc 08 8.13 | M8-T30 |
| adapters | `pi.ts`, `claude-code.ts`, `opencode.ts` | each `export const adapter: HarnessAdapter` and `export function parseTranscript(text: string, transcriptPath: string): RunResult` (pure; `wallMs`, `exitCode`, `timedOut` are set by `run`) | M8-T25 to M8-T27 |
| `judgeRun`, `calibrate` | `judge.ts` | `judgeRun(o: { runDir: string; prompt: string; referenceDir: string; model: string; fetchImpl?: typeof fetch }) => Promise<{ criteria: Record<string, number>; capped: string[] } \| null>`; `calibrate(o: { model: string; fetchImpl?: typeof fetch }) => Promise<{ spearman: number; mae: number; passed: boolean }>` | M8-T28 |
| `freezeBudgets` | `freeze-budgets.ts` | `(runDir: string) => Record<string, EvalTask["budgets"]>`; also runnable as `node evals/adapters/freeze-budgets.ts <run dir>`, which writes the task files | M8-T29 |
| `evaluateBar` | `run.ts` | `(runDir: string, bar: unknown) => { conditions: Record<"B-1" \| "B-2" \| "B-3" \| "B-4" \| "B-5" \| "B-6" \| "B-7" \| "B-8", "passed" \| "failed" \| "blocked">; met: boolean }` | M8-T29 |
| `KEY_ENV` | `run.ts` | `Record<string, string>` from the model id prefix to the environment variable name the harness CLI expects (PR-M8-11) | M8-T22 |
| eval unit tests | `evals/adapters/<module>.test.ts` | flat `test()` named `<module>: <statement>`, no tier tag (PR-M8-10) | each creator |
| eval type check | `evals/adapters/tsconfig.json` | `{ "compilerOptions": { "target": "es2023", "module": "nodenext", "moduleResolution": "nodenext", "allowImportingTsExtensions": true, "noEmit": true, "strict": true, "erasableSyntaxOnly": true, "skipLibCheck": true }, "include": ["./**/*.ts", "../tasks/**/*.ts"] }` | M8-T22 |
| sample transcripts | `evals/adapters/__fixtures__/<adapter>.jsonl` and `<adapter>.missing-usage.jsonl` | spec name for the first (E-4); the second is K-61's "missing usage fields" sample | M8-T25 to M8-T27 |
| friction samples | `evals/adapters/__fixtures__/friction-text.json`, `friction-json.json` | two `RunResult` objects (only `toolOutputs` and `commands` filled) for K-65 | M8-T24 |

### 0.7 Order constraints the task table does not show

Obey these in addition to the "Depends on" column. Before starting, check that `docs/plan/done/<id>.md` exists for each task named; when it does not, pick another task. Each row is also reported as a table error (section 0.12).

| Task | Also needs | Why |
|---|---|---|
| M8-T03 | M7-T29 | K-51, K-52 and K-54 render blueprint pages |
| M8-T21 | M8-T04, M8-T05, M8-T06 | K-02 counts 12 guides; K-07 checks every guide |
| M8-T31 to M8-T38 | M8-T24, and `evals/adapters/templates/<host>/` present for every host the task lists | the reference arm writes `result.json` through `score.ts`; start states `template` and `initialised` need the templates (M8-T22 step 9) |
| M8-T42 | M8-T25 | the bar runs with the `pi` adapter |

### 0.8 Shared files that several M8 tasks edit

Edit only what your task names. On a `git rebase origin/main` conflict keep both sides' lines, then re-run the proof commands.

| File | Rule |
|---|---|
| `src/gen/docs.test.ts` | M8-T01 adds K-01; M8-T21 adds K-02, K-06, K-07, K-09. Never change an M6 test |
| `test/upgrade/bundles.test.ts` | M8-T02 adds K-41; M8-T03 adds K-53. Never change A-07, A-08, A-13 |
| `src/gen/build.ts` | only M8-T21, only the two skip lines |
| `evals/adapters/types.ts` | M8-T22 creates; later tasks MAY add types, never change one |
| `evals/adapters/run.ts` | M8-T22 creates the CLI with a `// step <n>` comment per step of doc 08 section 8.4; M8-T23, M8-T24, M8-T28, M8-T29, M8-T30 replace only the step stubs they name |
| `evals/adapters/package.json`, `evals/adapters/pnpm-lock.yaml` | M8-T22 creates; a task that adds a dependency runs `pnpm --dir evals/adapters install` and commits both |
| `evals/rubric/api-decisions.md` | M8-T30 creates; later entries are appended only |
| `evals/rubric/bar.json` | M8-T29 creates; only M8-T42 (calibration date and numbers, after Ben names the models) writes it later |
| `evals/tasks/<id>/task.json` | the task group task creates; M8-T42 changes only `budgets` (by `freeze-budgets.ts`) |

### 0.9 Skill recipe (M8-T07 to M8-T20)

Every skill task follows these steps with its own `<name>`, `<n>` (the outline number in doc 08 section 4.5) and the notes of its task section.

1. Branch `task/<task id>-skill-<name>`.
2. Read doc 08 `### 4.1 ` (3.7 kB), `### 4.2 ` (1.2 kB), `### 4.3 ` (3.3 kB; only the rows your outline names under "Defers to"), `### 4.4 ` (1.1 kB) and your outline `#### 4.5.<n> `, then the sources your task section lists.
3. Create `skills/<name>/ripple.json`: exactly `{ "hosts": [<the hosts of your 4.2 row, in that order, as strings>] }` followed by a newline, formatted as `JSON.stringify(value)` prints it (one line).
4. Create `skills/<name>/SKILL.md`. Frontmatter: line 1 `---`, line 2 `name: <name>`, line 3 `description: ` followed by the description of the outline copied byte for byte (the text between the backticks of the `- description:` line), line 4 `---`. Then a blank line, `# <Title>` (4.2), and the `##` sections of S-6 in order: `When to use`, `Rules`, `Steps`, the outline's topic sections in outline order, `Other skills` (omitted only in `ripple-theming`), `Done when`.
5. Content: each section holds what its outline bullet says, facts copied from the named source (rule S-5: never copy another package's wording; write one boundary sentence per named skill, taken from its row of 4.3). Rules: a numbered list `1. ` to at most `12. `, one sentence each. Done when: `- [ ] ` items only; the last line is ``- [ ] `npx __PKG__ check` prints `No problems`.`` (for `ripple-setup` see its task).
6. Code blocks: only `html`, `liquid` and `tsx` fences count for K-22. Copy each block from a file that exists in the repository: `components/<id>/fixtures/<name>.html` (html), a blueprint file under `blueprints/<id>/` (any language), or the generated `pkg/docs/components/<id>.md` example (tsx and liquid; run `pnpm build` first). Do not reformat inside the block except whitespace. Do not put an `import` line in a `tsx` block unless the source file has it with `__PKG__`. At most 3 blocks may instead start with the sketch comment of K-22 (`<!-- sketch -->`, `{% comment %}sketch{% endcomment %}`, `// sketch`).
7. Forbidden anywhere in the file (K-24, K-28, K-06, K-09, S-2, S-3): a ledger id (`D-0` followed by two digits), `SPIKE-`, `src/`, `00-decisions`, the literal package name, `named blocking Frame`, an `orientation=` attribute not preceded by `data-`, `docs --rule`, a Liquid param `form:`, `references/`, `pnpm exec ripple`, `yarn ripple`, `bunx`, the word `TBD`; `data-rp-open=` only inside an `html` fence. Name other skills in backticks only when they are in 4.2 (Ripple) or 4.3 (others).
8. Spike fallbacks: when your task section names a spike, run `grep -n "^| SPIKE-<nn>" docs/00-decisions.md` and read the row. When it ends with `Result (<date>): FALLBACK required`, apply the outline's "Fallback (SPIKE-<nn>)" text; when the result is `DEFAULT holds` or there is no result yet, write the default text and add a line to the done file `SPIKE-<nn>: <state>; default text written`.
9. Run `pnpm build`, then `node node_modules/.cache/ripple/skill-lint.mjs <name>` until it prints `ok`. Count is also checked by `wc -l skills/<name>/SKILL.md` (at most the outline's line budget).
10. Proof: PLAN 5.0. `pnpm test --no-skips` does not run skill tests until M8-T21; the lint output goes into the pull request under "Proof".

Acceptance for every skill task: `node node_modules/.cache/ripple/skill-lint.mjs <name>` prints `skill-lint <name>: ok (<n> lines)` and exits 0; `ls skills/<name>` prints exactly `SKILL.md` and `ripple.json`; `grep -c "__PKG__" pkg/skills/<name>/SKILL.md` prints `0` after `pnpm build` (or, while M8-T21 has not removed the skills skip line, `pkg/skills/` is absent and this item is not checked; say so in the pull request).

If blocked, for every skill task: a fact the outline asks for is not in the named source: write the sentence the outline gives, add a line under `## Ledger issues` of doc 08 (`<task id>: <section> needs <fact>; source silent`), and continue. K-22 finds no source block for an example the outline requires: use a sketch block (at most 3) and name the missing fixture in the done file. The line budget is exceeded: shorten prose; never drop an outline item.

### 0.10 Guide recipe (M8-T04 to M8-T06)

1. Branch `task/<task id>-guides`.
2. For each topic of the task, create `guides/<topic>.md`. Line 1 `---`, line 2 `title: <Title of doc 08 section 2.5>`, line 3 `summary: <one sentence, 1 to 140 characters, no |>`, line 4 `---`, then a blank line and the body. The body follows the "Content (in this order)" cell of the topic's row; each item is one `##` section whose heading names the item. Every fact is taken from the "Source" cell's documents and MUST NOT contradict them.
3. Package name `__PKG__`; commands `npx __PKG__ <command>`; `docs` only in the four forms of doc 08 section 2.7.
4. Links: relative, from `pkg/docs/guides/`. Allowed targets: `<topic>.md` (another guide), `../components/<id>.md` (a component that exists), `../rules/RP<nnn>.md` (a rule that exists), `../INDEX.md`, `../llms.txt`. No link into the repository (`../../src/...`, `docs/0x-...`).
5. Code examples: copy from fixtures, blueprints or generated component pages, as 0.9 step 6 (guides have no K-22 test; the copy rule keeps them correct).
6. Spike fallbacks: as 0.9 step 8.
7. Run `pnpm build`, then `node node_modules/.cache/ripple/guide-lint.mjs <topic> <topic> <topic> <topic>`; every line MUST be `ok`. Confirm `ls pkg/docs/guides/` lists the new files (M6-T14 copies them; when the build prints `build: skipped guides (PLAN 4.4)` while `guides/` exists, the copy is broken: stop and report against M6-T14).
8. Proof: PLAN 5.0.

Acceptance for every guide task: the lint prints `ok` for each topic; `grep -c "__PKG__" pkg/docs/guides/<topic>.md` prints `0` for each; `pnpm test --no-skips` passes (K-03 of M6-T14 compares the guide sets of `INDEX.md` and `llms.txt`).

### 0.11 Eval harness conventions (M8-T22 to M8-T42)

- **EV-1** Every harness file imports only `node:*`, `playwright`, `ripple-kit/testing` and sibling `./<module>.ts` files (with the `.ts` extension). `run.ts` imports only `node:*` at top level and loads the rest with `await import()` after step 0 (PR-M8-9).
- **EV-2** Eval commands, in addition to PLAN 5.0: `pnpm build && pnpm --dir evals/adapters install --frozen-lockfile` (once per session, after the build), `pnpm --dir evals/adapters exec tsc -p tsconfig.json` (type check; MUST exit 0), `node --test evals/adapters/*.test.ts` (unit tests; MUST exit 0). The shell expands the glob; do not rely on `node --test` defaults.
- **EV-3** A unit test MUST NOT start a container, call a model, or use the network: transcripts, catalogue responses and judge answers come from `__fixtures__/` or from a stub `fetchImpl`.
- **EV-4** Runs write only below `evals/runs/<run id>/`; a test writes only below `mkdtempSync(join(tmpdir(), "ripple-eval-"))` and removes it in `finally`.
- **EV-5** Nothing under `evals/` is published (K-69): `pkg/` is built from the root only. Never add `evals` to a `files` list or copy step.
- **EV-6** Core set (`set: "core"`): T01, T02, T03, T04, T06, T07, T08, T09, T10, T11. Extended: T05, T12, T13, T14, T15, T16, T17 (doc 08 section 8.6).
- **EV-7** Check ids are `<task>-C<n>` exactly as doc 08 section 8.6 numbers them (T03 has C11 between C3 and C4; keep the spec's ids, not a renumbering). Each task also gets `<task>-C0` and `<task>-CL` from `inheritedChecks`.
- **EV-8** Task group tasks (M8-T31 to M8-T38) follow this order per task: `task.json` (`prompt` copied byte for byte from 8.6, `budgets` from 8.11 with `frozen: false`, `timeoutMs` 2700000, `maxCostUsd` 25 unless 8.6 says otherwise), `checks.spec.ts`, `start/<host>/` (only when 8.6 names an overlay), `reference/<host>/` (a passing solution, written by hand on top of the start state; it is the files that differ from the start state, copied over it by `--reference`), then `pnpm eval -- --reference --tasks <id> --hosts <its hosts>` until every reference passes with total at least 95.
- **EV-9** `codeDirs` per host (PLAN-CHOSEN; doc 08 section 8.2 gives no values): `react` and `remix` `{ "routes": ["app/routes"], "data": ["app/lib"] }`, `html` `{ "routes": [], "data": ["server"] }`, `liquid` `{ "routes": [], "data": [] }`. One `task.json` serves all hosts, so `codeDirs` lists the union: `{ "routes": ["app/routes"], "data": ["app/lib", "server"] }`. M8-T22 step 9 MUST make the templates use exactly these directories.
- **EV-10** A task's `reference/<host>/` holds every file that differs from its `start.base` state, including the files its `start.after` reference and its overlay brought (cumulative; PLAN-CHOSEN). `start.after: "T03"` then needs only one copy, as doc 08 8.5 describes.

### 0.12 Plan readings made by this file

Each is the smallest choice that keeps the gates green where two specs conflict or all are silent. The task that first applies one adds one line under `## Ledger issues` of the named owning doc (text: `<PR id>: <topic> (docs/plan/M8-agent-kit-evals.md 0.12)`) and mentions it in the pull request.

| # | Topic | The specs | Reading | Owning doc | Applied by |
|---|---|---|---|---|---|
| PR-M8-1 | Location of the skills acceptance test | doc 08 4.6: `skills/skills.test.ts`, "run by the root test script". doc 13 2.6: the runner never collects `skills/`; doc 01 6.1: `skills/` is copied to `pkg/skills/`, so a test file there would ship; K-20 allows only `SKILL.md` and `ripple.json` per skill | `src/gen/skills.test.ts`, subject `skills`, tier `[T1]`; it reads `skills/` with `node:fs` (allowed by doc 01 2.2 rule 1 for `src/gen/**`) | doc 08 | M8-T21 |
| PR-M8-2 | Tier of package-content tests | K-01, K-02, K-06, K-09 read `pkg/` after a build; doc 13 6.2: a `[T1]` test reads no `pkg/` | `[T10]` (tier 10 runs after the build, doc 13 15.3), in `src/gen/docs.test.ts` | doc 13 | M8-T01 |
| PR-M8-3 | Tier and file of K-41 and K-53 | both grep `pkg/browser/*.js` | `[T3]` in `test/upgrade/bundles.test.ts`, beside A-07 and A-08, which read the same files | doc 13 | M8-T02 |
| PR-M8-4 | What K-40 scans | "every string literal passed to `console.warn(` or `console.error(`" | the first argument of every `console.warn(` and `console.error(` call in non-test files under `src/`; it passes when it is a string or template literal starting with `[ripple] `, or an identifier assigned in the same file from such a literal. Anything else fails with the file and line | doc 08 | M8-T02 |
| PR-M8-5 | File of K-42 | none | `[T2]` in `test/conformance/hosts.test.ts`, which already renders React fixtures with the host adapter | doc 13 | M8-T02 |
| PR-M8-6 | Files of K-31 to K-36 | K-31 names only `meta.expected.json` | K-31, K-32, K-34, K-36 in `src/check/rules/meta.test.ts`; K-33 in `src/check/report.test.ts`. K-34 is an audit: every `src/check/rules/RP*.test.ts` mentions both `text.bad` and `text.good`; a rule test that lacks the pair gets the two assertions of the last note of doc 08 5.5 added to it | doc 08 | M8-T01 |
| PR-M8-7 | K-35 is in the checker text task | K-35 runs `check --json` on the T08 start state, which exists only after M8-T32 (and K-66 restates it) | M8-T01 records `// K-35: evals/adapters/workspace.test.ts (M8-T32)`; M8-T32 implements K-35 and K-66 as one eval unit test | doc 08 | M8-T01, M8-T32 |
| PR-M8-8 | Form of `checks.spec.ts` | doc 08 8.1 calls them "deterministic Playwright checks"; 8.3 writes `test.skip(tier === "local", ...)`; T08-C3 uses `expect(page).toHaveScreenshot`. Both are `@playwright/test` APIs, whose runner, snapshot directory and process model do not fit `run.ts` step 8 and are not in the harness dependencies | a plain module exporting `checks: EvalCheck[]` (0.6), run in-process by `runChecks`; `throw new SkipCheck(reason)` replaces `test.skip`; `compareScreenshots` with the same two options replaces `toHaveScreenshot` (pixel differs when its largest channel difference exceeds `threshold x 255`; passes when the share of differing pixels is at most `maxDiffPixelRatio`) | doc 08 | M8-T23 |
| PR-M8-9 | Installing the harness dependencies | doc 08 8.14 job runs `pnpm install`, `pnpm build`, `pnpm eval`; the harness needs `evals/adapters/node_modules` (it depends on `file:../../pkg`, which exists only after the build) | `run.ts` step 0, before anything else: `pnpm build`, then `pnpm --dir evals/adapters install --frozen-lockfile`, then dynamic imports. Step 1's build is that same build | doc 08 | M8-T22 |
| PR-M8-10 | Eval unit test runner and names | none; doc 13 2.4 tier tags stop at `[T10]` and the root runner never collects `evals/` | `node --test evals/adapters/*.test.ts`; names `<module>: <statement>` | doc 13 | M8-T22 |
| PR-M8-11 | Model key and judge call | doc 08 8.14: the key is passed "under the name the harness CLI expects"; 8.9 gives no transport for the judge | `KEY_ENV` in `run.ts`: model id prefix `anthropic/` gives `ANTHROPIC_API_KEY`, `openai/` gives `OPENAI_API_KEY` (UNVERIFIED for each CLI; check each CLI's documentation when the adapter is written and correct the table). `judge.ts` calls the provider HTTP API named by the prefix with the key from `RIPPLE_EVAL_API_KEY` (UNVERIFIED); tests use a stub `fetchImpl` | doc 08 | M8-T22, M8-T28 |
| PR-M8-12 | What `--reference` runs | K-62 scores references "as if an agent produced it; no model call" | `--reference` copies `reference/<host>/` over the start state as the end state and skips steps 4 to 6 (no container, no adapter, no canary); step 7 serves on the host machine; efficiency and adherence are set to full (8.14) | doc 08 | M8-T22 |
| PR-M8-13 | Content of `tasks/T09/prev/` | 8.6 T09: "older versions of two files: the Button CSS and the Card CSS"; it does not give them | M8-T32 step 6 | doc 08 | M8-T32 |
| PR-M8-14 | Source of the npm-host templates | 8.5 describes them; no source names their files | copy the server, data-loading and cart-handler files of `examples/<host>/` and remove every Ripple file (trailered files, `ripple.json`, Ripple imports, skills, the Ripple region of `AGENTS.md`) | doc 08 | M8-T22 |
| PR-M8-15 | `ripple-agent-ready` names `references/agent-ready.md` | outline 4.5.14 "Defers to: `ui-sdk` (...; `references/agent-ready.md`)"; K-28 forbids `references/` in skills | the boundary sentence names `ui-sdk` and its agent-ready reference by words, without the path | doc 08 | M8-T20 |
| PR-M8-16 | K-26 comparison | "Rules section byte-equal to `UNIVERSAL_RULES`" | the lines between `## Rules` and the next `##` heading, with leading and trailing blank lines removed, joined with `\n`, equal `UNIVERSAL_RULES` (joined with `\n` when it is an array) with `{command}` replaced by `npx __PKG__` | doc 08 | M8-T07 |
| PR-M8-17 | `{page}` route | 8.5 fixes `/pages/{page}` in every template; `mockshop.ts` fills only `{product}` and `{collection}` | `pickCatalogue` also returns the handle of the first page of `pages(first: 1)`; UNVERIFIED that mock.shop has pages; when it has none, `{page}` is `about` and the template serves a static page for it | doc 08 | M8-T23 |
| PR-M8-18 | Flags `--bar`, `--calibrate`, `--reference`, `--parallel` | used in 8.4, 8.9, 8.12, 8.15 but absent from the 8.4 synopsis | `run.ts` accepts all four; `--bar` runs the cells of 8.12 with `bar.json` and ignores `--tasks`, `--hosts`, `--adapter`, `--model`, `--arm`, `--runs` | doc 08 | M8-T22 |
| PR-M8-19 | Files under `evals/adapters/` beyond the 8.1 tree | 8.1 lists the harness files; E-4 adds `__fixtures__/` | also `types.ts`, `tsconfig.json`, `pnpm-lock.yaml`, `*.test.ts` | doc 08 | M8-T22 |
| PR-M8-20 | Guide summary | 2.5: at most 140 characters, no newline | also no `\|`, because `renderIndex` prints it in a table cell | doc 08 | M8-T04 |
| PR-M8-21 | How K-31 compares a cell | doc 08 5.5 `RuleText` comment: several forms are joined with ` \| `; the cells are prose ("one of: ...", "... or ...") with code spans; the M6 plan stored multi-form cells unchanged | `normalizeCell` of M8-T01 step 4: a single code span loses its backticks, a cell starting with `computed` becomes `computed`, any other cell is compared unchanged | doc 08 | M8-T01 |
| PR-M8-22 | `meta.title` | doc 08 5.5: "`meta.title` is the Reports cell"; doc 07 9.3 (and the M6 rule files): the first sentence of the 9.6 "Detects" cell | not changed by M8; recorded for the owners | doc 07, doc 08 | M8-T01 |
| PR-M8-23 | Text of the "Binding wiring" family | doc 08 6.2: "defined in `06-bindings.md`"; doc 06 defines no message text for `useElement` | K-41 registers a substring only for families whose text exists in source; the gap is recorded | doc 06 | M8-T02 |
| PR-M8-24 | Two messages missing from 6.2 | 6.2 says it is complete; `[ripple] Shopify scripts not initialised.` and `[ripple] Standard Events not available; view events and the page view are not sent.` are printed by commerce code (doc 05) | not changed; recorded | doc 08 | M8-T02 |

### 0.13 Definition of done reminder

Every task ends with PLAN section 5.0 (commit, push, pull request in the five-heading form, done file `docs/plan/done/<task id>.md`). "Acceptance" lists what is specific; PLAN section 3.1 always applies. A task that cannot finish opens a draft pull request and writes no done file (PLAN 1 item 7). A BLOCKED-ON-BEN task whose input is missing writes no done file; it is skipped when picking (PLAN 4.3).

---

## M8-T01 Checker rule text audit: every rule file exports `meta` and `text`; every rule page builds; acceptance of doc 08 §5.6

- **Goal:** Prove with committed tests that the 55 rule files carry exactly the `problem`, `fix` and `why` text of doc 08 section 5.5 and that every rule page is built, and correct the rule files where they do not.
- **Depends on:** M6-T35.
- **Kind:** `docs`. Size S.

### Read first

doc 08: `## 5. ` intro and `### 5.1 ` to `### 5.4 ` (2.5 kB); in `### 5.5 ` the prose above the table and the "Notes" list below it, NOT the table (it is read by the script of step 3); `### 5.6 ` (2 kB); `### 2.6 ` (0.6 kB); `### 2.8 ` row K-01. doc 07: in `### 9.3 ` the `RuleMeta` and `Rule` declarations (search `interface RuleMeta`); in `### 7.1 ` rule 12 (one paragraph). This file 0.5, 0.6, 0.12 (PR-M8-2, PR-M8-6, PR-M8-7, PR-M8-21).

### Files

Create: `src/check/rules/meta.expected.json`, `src/check/rules/meta.test.ts`. Change: `src/gen/docs.test.ts` (K-01 only), `src/check/report.test.ts` (K-33 only; create it when absent), and only where a test of this task fails: the `text` export of `src/check/rules/RP*.ts`, the `meta.why` of those files, and `src/check/rules/RP*.test.ts` (K-34 audit).

### Steps

1. Branch `task/M8-T01-rule-text`.
2. `ls src/check/rules/RP[0-9][0-9][0-9].ts | wc -l` MUST print `55`. When not, stop (If blocked).
3. Write the expected file with this script (session tool, not committed), then commit its output:

   ```bash
   cat > node_modules/.cache/ripple/meta-expected.mjs <<'EOF'
   import fs from "node:fs"
   const t = fs.readFileSync("docs/08-agent-kit-and-evals.md", "utf8")
   const s = t.indexOf("\n### 5.5 "), e = t.indexOf("\n### 5.6 ")
   const out = {}
   for (const line of t.slice(s, e).split("\n")) {
     if (!/^\| RP\d{3} \| /.test(line)) continue
     const cells = line.slice(2, -2).split(" | ")
     if (cells.length !== 7) throw new Error("row has " + cells.length + " cells: " + cells[0])
     out[cells[0]] = { problem: cells[4], fix: cells[5], why: cells[6] }
   }
   if (Object.keys(out).length !== 55) throw new Error("rows: " + Object.keys(out).length)
   fs.writeFileSync("src/check/rules/meta.expected.json", JSON.stringify(out, null, 2) + "\n")
   console.log("rules", Object.keys(out).length)
   EOF
   node node_modules/.cache/ripple/meta-expected.mjs
   ```

   It MUST print `rules 55`. The file holds the raw cell text (the "JSON copy of those three columns" of K-31).
4. `src/check/rules/meta.test.ts` (all `[T1]`, subject `meta`). It imports the rule list from `src/check/rules/index.ts` and each rule file's `text` export. Define in the test file `normalizeCell(cell: string): string`: when the whole cell is one code span (`/^`[^`]*`$/`), return the text inside the backticks; when the cell starts with `computed`, return `computed`; otherwise return the cell unchanged (PR-M8-21: multi-form cells stay unchanged, which is the convention the M6 rule files used).
   - `[T1] meta: K-31 every rule file's meta.id equals its file name`.
   - `[T1] meta: K-31 text.problem, text.fix and meta.why equal doc 08 5.5` (one assertion per rule and field, `normalizeCell(expected)`; the failure message names the rule and field).
   - `[T1] meta: K-32 the rule files and the keys of meta.expected.json are exactly the 55 ids` (the id list of K-32 written in the test as an array literal).
   - `[T1] meta: K-34 every rule test asserts bad and good` (for each `src/check/rules/RP*.test.ts`, the source contains `text.bad` and `text.good`).
   - `[T1] meta: K-36 no fix text names the package after npx` (scan every `text.fix` and the source of every `src/check/rules/RP*.ts`, excluding `*.test.ts`, for `/npx\s+ripple-kit/` and for `npx ` followed by `PKG_NAME`; zero matches).
   - Write the comment `// K-30: retired (doc 08 5.6)` and `// K-35: evals/adapters/workspace.test.ts (M8-T32)` (PR-M8-7).
5. `src/check/report.test.ts`: add `[T1] report: K-33 FIX_SYNONYMS gives the six results of doc 08 5.6` with exactly the six cases of the K-33 row, calling the `fix` computation `report.ts` exports (search `export function` in `src/check/report.ts` for the function that applies `FIX_SYNONYMS`; do not re-implement it).
6. `src/gen/docs.test.ts`: add `[T10] docs: K-01 pkg/docs/components holds one page per non-planned component` (reads `pkg/manifest.json` and lists `pkg/docs/components/`; PR-M8-2).
7. Run `pnpm test:unit --files=src/check` and fix every failure in the rule files, never in the test or the JSON file: a wrong `text` cell is replaced by the normalised 5.5 cell; a missing `text.bad` / `text.good` assertion in a rule test is added as the last note of 5.5 states (`bad` gives exactly one diagnostic of this rule, `good` none). When a text change breaks a rule's own test, change the rule's `report` call so it passes the chosen form, not the text.
8. `meta.title` is NOT changed by this task (PR-M8-22).
9. Proof: PLAN 5.0.

### Acceptance

The seven tests pass. `node -e 'console.log(Object.keys(require("./src/check/rules/meta.expected.json")).length)'` prints `55`. `ls pkg/docs/rules/ | grep -c "^RP[0-9][0-9][0-9]\.md$"` prints `55` after `pnpm build`.

### Out of scope

The output format of `check` (doc 07). K-35 (M8-T32). Changing the 5.5 table. The rule page renderer (M6-T14).

### If blocked

- Fewer than 55 rule files: the owning milestone task is not done (RP1xx and RP2xx M2, RP3xx M4, RP4xx to RP6xx M6); stop.
- The script throws "row has N cells": a cell of 5.5 contains ` | `; stop and report the row (do not hand-edit the JSON).
- A rule's detection cannot produce one of the forms of a multi-form cell: leave the rule as it is, add `M8-T01: <RULE> cannot print form <n>` under `## Ledger issues` of doc 07.

---

## M8-T02 Development-mode warnings: the catalogue and its invariants

- **Goal:** Make every message Ripple prints satisfy W-1 to W-6 of doc 08 section 6.1 and prove it with tests K-40, K-41 and K-42.
- **Depends on:** M5-T15.
- **Kind:** `runtime`. Size S.

### Read first

doc 08: `## 6. ` whole (`### 6.1 ` to `### 6.4 `, 4.9 kB). doc 06: `### 10. ` heading section "Validation of enumerated and responsive" (search `## 10. `, 2.2 kB) and the paragraph of rule V-2 (search `**V-2**`). doc 13: `### 2.4 `, `### 3.1 ` (the two lines for `test/upgrade/bundles.test.ts` and `test/conformance/hosts.test.ts`). This file 0.6, 0.12 (PR-M8-3, PR-M8-4, PR-M8-5, PR-M8-23, PR-M8-24).

### Files

Create: `src/warnings.test.ts`, `test/dev-only-strings.json`. Change: `test/upgrade/bundles.test.ts` (K-41 only), `test/conformance/hosts.test.ts` (K-42 only), and only where K-40 fails: the `console.warn(` and `console.error(` calls under `src/`.

### Steps

1. Branch `task/M8-T02-warnings`.
2. Inventory: `grep -rn "console\.\(warn\|error\)(" src/ --include=*.ts | grep -v "\.test\.ts"`. For each call, check that the first argument starts with `[ripple] ` (directly or through a constant in the same file) and is one line.
3. Fix each call that fails: prefix `[ripple] `; keep the family's text as its owner defines it (6.2 "Text" column). Never change a message's wording beyond the prefix. A development-only call MUST be guarded as rule W-4 says and printed at most once per distinct text (W-3); when a call is not, add the guard and a `Set` of printed texts in that module.
4. `test/dev-only-strings.json`: a JSON array with one distinctive substring per development-only family of 6.2. Families with mode `development`: "Prop value validation" (`rv()`) and "Binding wiring" (`useElement`). For prop validation register the fixed part of `rv()`'s problem text (read it in the `rv` source; search `export function rv`), for example `Tokens are separated by exactly one space` when that is the text; for Binding wiring register the fixed part of the message `useElement` prints. When `useElement` prints no development message, register nothing for it and record PR-M8-23 in the done file.
5. `src/warnings.test.ts`, `[T1] warnings: K-40 every console.warn and console.error message under src starts with "[ripple] "`: read every non-test `.ts` and `.tsx` file under `src/`, find each `console.warn(` and `console.error(` call, and apply the rule of PR-M8-4. Report every failure as `<file>:<line>`.
6. `test/upgrade/bundles.test.ts`: `[T3] bundles: K-41 pkg/browser holds no development-only string` (each string of `test/dev-only-strings.json` against every `pkg/browser/*.js`; zero matches; also assert the JSON is a non-empty array of strings).
7. `test/conformance/hosts.test.ts`: `[T2] hosts: K-42 a React render with an invalid gap is byte-equal in development and production`. Render one Stack fixture with `gap="banana"` through the React host adapter used by this file, once with `process.env.NODE_ENV = "development"` and once with `"production"` (restore the value in `finally`); capture `console.warn` with a stub. HTML equal; development captured exactly one call; production none.
8. Two messages appear in source but not in 6.2 when M4 implemented them as `[ripple] Shopify scripts not initialised.` and `[ripple] Standard Events not available; view events and the page view are not sent.` (grep for both). Do not change them; add both under `## Ledger issues` of doc 08 (PR-M8-24), because the catalogue says a new family MUST be added to the table in the same pull request and this task does not edit the spec table.
9. Proof: PLAN 5.0.

### Acceptance

The three tests pass. `node -e 'const a=require("./test/dev-only-strings.json");console.log(Array.isArray(a)&&a.length>0)'` prints `true`.

### Out of scope

New warning families. Liquid warnings (6.3: there are none; the checker reports). Changing `rv()` validation rules (doc 06).

### If blocked

- A message owned by another document lacks the prefix and its owner's text has no prefix either: add the prefix (W-1 applies to every message) and record it under `## Ledger issues` of the owner.
- K-42 prints two warnings because the server render and a hydration both run `rv()`: W-3's once-per-text rule is broken; fix the `Set` guard in `rv()`, not the test.

---

## M8-T03 Agent surface tests: snapshot per commerce element (C-31), confirmation, labels, acceptance of doc 08 §7.8

- **Goal:** Add the agent tests of doc 08 sections 7.6 and 7.8 (K-50 to K-56) and test C-31 of doc 05, and fix the elements where they fail.
- **Depends on:** M1-T41, M4-T24. Also 0.7: M7-T29.
- **Kind:** `harness`. Size M.

### Read first

doc 08: `## 7. ` intro, `### 7.1 ` to `### 7.6 ` (11 kB), `### 7.7 ` only the last paragraph and `### Fallback (SPIKE-08)`, `### 7.8 ` (1.2 kB). doc 05: `## 14. ` row C-31 (search `| C-31 |`). doc 04: `### 12.2 ` (2.3 kB), `### 12.3 ` (2 kB). The SPIKE-08 row of ledger section 3 (search `SPIKE-08`) and its result sentence. doc 13 `### 10.1 ` (2.3 kB). This file 0.5, 0.6.

### Files

Create: `src/commerce/agent-actions.test.ts`. Change: `src/commerce/rp-product-form.test.ts`, `src/commerce/rp-cart.test.ts`, `src/commerce/rp-live.test.ts`, `src/commerce/rp-predictive-search.test.ts`, `src/commerce/rp-recommendations.test.ts` (one test each), `test/upgrade/bundles.test.ts` (K-53 only), `blueprints/cart/cart.test.ts` (K-51), `blueprints/product/product.test.ts` (K-52), `src/check/rules/RP320.test.ts` (K-54); source files only where a test fails. Use the file names that exist: `ls src/commerce/*.test.ts blueprints/cart/ blueprints/product/`.

### Steps

1. Branch `task/M8-T03-agent-surface`.
2. Find how the bridge is loaded in a page test: `grep -rln "createAgent" src/ test/support/ | head`. The page loads `ripple.js` from the fixture server and calls `loadAgent()` on its module (X-7 shows the form: `(await import(<ripple.js URL>)).loadAgent()`). Reuse the page set-up of the element's existing `[T5]` smoke test in the same file; do not add a new helper unless two files need it.
3. K-50, in each of the four element test files, `[T5] <tag>: K-50 agent test steps 1 to 4` following 7.6 steps 1 to 4 literally. Action arguments: `rp-product-form` `setQuantity` `[2]` then `add` `[]` (observe one call of the adapter's `submitCart`, through the fake adapter the file already uses); `rp-cart` `setQuantity` `["<first line id>", 2]` and `remove` `["<first line id>"]`; `rp-live` `submit` `[]` (on a fixture whose root has a GET form); `rp-predictive-search` `setQuery` `["shirt"]` then `clear` `[]`. The "documented state change" is the "Behaviour" cell of the 7.2 table for that action.
4. C-31, in `src/commerce/rp-recommendations.test.ts`: `[T5] rp-recommendations: C-31 the root is not in the agent snapshot`; and in `src/commerce/agent-actions.test.ts`: `[T5] agent-actions: C-31 no snapshot entry of any commerce element lists an action named checkout` (mount the `default` fixture of each commerce component that has a root element; read the list with `grep -l '"agent"' components/*/*.json`, restricted to manifests with `"kind": "commerce"`).
5. K-56, in `src/commerce/agent-actions.test.ts`: `[T1] agent-actions: K-56 manifest agent.actions equal the 7.2 table`. Write the 7.2 rows as a literal in the test (names in order, `description` text exactly as the 7.2 descriptions table, no `confirm` key). Compare with `pkg/`-free sources: read `components/<id>/<id>.json` for every commerce component. Also `[T5] agent-actions: the manifest action names equal each primitive's declared list` (the last paragraph of 7.6: load each primitive in a fixture page and read its declared list; tier 5 because the element modules need a DOM).
6. K-51, in `blueprints/cart/cart.test.ts`: `[T5] cart: K-51 checkout press is refused without allow and does not navigate`. Render the `cart` blueprint page on the html host with the same page renderer the blueprint's BT-2 test uses (find it: `grep -n "BT-2" blueprints/cart/cart.test.ts`). Then 7.6 step 5: `act({ steps: [{ ref, action: "press", args: ["<checkout control name>"] }] })` with no `allow` gives `ok: false`, `error.message` starts with `Needs a person:`, and `page.url()` is unchanged.
7. K-52, in `blueprints/product/product.test.ts`: `[T5] product: K-52 snapshot shows rp-product-form with setQuantity and add and hides rp-recommendations`.
8. K-53, in `test/upgrade/bundles.test.ts`: `[T3] bundles: K-53 the main bundles do not contain the bridge` (`pkg/browser/ripple.js` and `pkg/browser/ripple.elements.js` do not contain `Needs a person`).
9. K-54, in `src/check/rules/RP320.test.ts`: `[T2] RP320: K-54 every blueprint page has zero findings on every host`. For each blueprint id (`ls blueprints/ | grep -v "^_"`) and host, render the page as BT-2 does and run RP320 on the output; zero findings. When BT-2's renderer lives in a blueprint test file and is not exported, move it to `test/support/blueprints.ts` (one export, no behaviour change) and import it from both places; list the move in the pull request.
10. K-55: confirm `src/commerce/rp-cart.agent-confirm.test.ts` exists and passes. Then run `grep -rn '"checkout"' components/*/*.json src/commerce/*.ts | grep -i action`. Default path (SPIKE-08 result `DEFAULT holds`, or no `checkout` action anywhere): add `[T1] agent-actions: K-55 checkout is absent from every published agent.actions`. Fallback path (doc 08 "Fallback (SPIKE-08)" applied, `checkout` present): the test instead asserts that the three cases (a), (b), (c) of the SPIKE-08 test file are present by name and not skipped.
11. Run `pnpm test --no-skips`. Fix failures in the element or manifest, never in the 7.2 literal. A label problem (7.5) is fixed by `ariaLabel` in the fixture or blueprint only where 7.5 says so; never add a label to `rp-dialog`, `rp-quantity` or `rp-navigation-menu`.
12. Proof: PLAN 5.0.

### Acceptance

The tests K-50 (four), C-31 (two), K-51, K-52, K-53, K-54, K-55, K-56 and the primitive-list test pass. `grep -c "Needs a person" pkg/browser/ripple.js` prints `0`.

### Out of scope

The guide and skill text (`agent-ready`, M8-T05, M8-T20). RP607 itself (M6). WebMCP behaviour in a browser that has `document.modelContext`.

### If blocked

- `createAgent` is not reachable from a page test: the M1 bridge or `loadAgent()` is missing; stop and name M1-T41's done file in the draft pull request.
- K-51 navigates: the checkout control lacks `data-agent-confirm` (D-050); fix the blueprint or component, then re-run BT tests.

---

## M8-T04 Guides `getting-started`, `layout-props`, `tokens-and-dials`, `progressive-enhancement`

- **Goal:** Write the guides 1 to 4 of doc 08 section 2.5 so that they pass K-07 and appear in the built `INDEX.md`.
- **Depends on:** M7-T29.
- **Kind:** `guide`. Size M.

### Read first

doc 08: `### 2.5 ` (4.9 kB), `### 2.7 ` (0.7 kB), `### 2.8 ` rows K-06, K-07, K-09. Sources (only these sections): doc 01 `### 1.1 ` (1.5 kB), `### 6.5 ` (3 kB), `### 10.1 `, `### 10.2 ` (4 kB); doc 07 `### 7.2 ` (1.1 kB), `### 7.4 ` (3.6 kB), `### 7.5 ` (2.8 kB), `### 7.11 ` (2 kB); doc 03 `### 3.2 ` (1.8 kB), `### 3.6 ` (2.4 kB), `### 3.7 ` (1.6 kB), `### 6.1 ` (1.8 kB), `## 9. ` (1.3 kB); ledger D-026, D-027, D-028, D-029 and section 6.2 (search `#### D-026` and so on); doc 02 `## 9. ` (8.8 kB); ledger D-005, D-009, D-021, D-081. This file 0.2, 0.4, 0.10, PR-M8-20.

### Files

Create: `guides/getting-started.md`, `guides/layout-props.md`, `guides/tokens-and-dials.md`, `guides/progressive-enhancement.md`.

### Steps

1. Follow 0.10 with topics `getting-started`, `layout-props`, `tokens-and-dials`, `progressive-enhancement`.
2. `getting-started`: install commands per host exactly as doc 07 7.4 and 7.5 give them, written `npx __PKG__ init`, `npx __PKG__ add <component>`, `npx __PKG__ add --blueprint <id>`. "How to find docs" lists the four forms of 2.7 and the path `node_modules/__PKG__/docs/INDEX.md`.
3. `layout-props`: the six responsive examples exactly as 2.5 row 2 lists them, in that order, each in a code span; the prop list of ledger section 6.2; the sentence "There are no margin props." Write no other responsive example.
4. `tokens-and-dials`: dials, colour roles, scales, schemes and `data-scheme`, how to change a scale (doc 03 3.7), the contrast rule (doc 03 section 9).
5. `progressive-enhancement`: the three `noJs` levels, the opener pattern (`dialog` prop prints `data-rp-open`; state "never written through rest props or `attributes`"), the `data-rp-js` values, the D-081 browser table, "What breaks the contract".
6. Run the lint for the four topics; PLAN 5.0.

### Acceptance

0.10 acceptance for the four topics. `grep -c 'gap="2 md:6"' guides/layout-props.md` prints at least `1`. `grep -c "margin" guides/layout-props.md` prints at least `1` (the no-margin sentence).

### Out of scope

Guides 5 to 12 (M8-T05, M8-T06). Changing `renderIndex` (M6-T14).

### If blocked

0.10 steps; a source silent on a listed item: write one sentence that says what the source says and add `M8-T04: guide <topic> item <item>: source silent` under `## Ledger issues` of doc 08.

---

## M8-T05 Guides `commerce`, `overlays-and-ids`, `customize-and-upgrade`, `agent-ready`

- **Goal:** Write guides 5, 6, 11 and 12 of doc 08 section 2.5.
- **Depends on:** M7-T29.
- **Kind:** `guide`. Size M.

### Read first

doc 08: `### 2.5 `, `### 2.7 `, `### 2.8 ` rows K-06, K-07, K-09; `## 7. ` (sections 7.1 to 7.5, 9.6 kB) for `agent-ready`. Sources: doc 05 `### 4.4 ` (2.4 kB), `### 6.1 ` (1.6 kB), `### 8.1 ` (2 kB), `### 8.3 ` (8.3 kB), `### 9.2 ` (4.3 kB), `### 10.5 ` (1 kB); doc 11 `### 0.3 ` (5.9 kB), `### 0.7 ` (6.3 kB); ledger D-043, D-090, D-091, D-020; doc 04 `### 10.1 ` to `### 10.8 ` (only the first paragraph and the markup block of each, about 10 kB), `### 3.4 ` prose (not the code); doc 10 `### 0.2 ` (7.2 kB); doc 07 `### 5.1 ` (4.8 kB) prose, `### 7.7 ` (3.3 kB), `### 7.8 ` (2.4 kB), `### 8.4 ` (1.1 kB); ledger D-053, D-056. This file 0.2, 0.4, 0.10.

### Files

Create: `guides/commerce.md`, `guides/overlays-and-ids.md`, `guides/customize-and-upgrade.md`, `guides/agent-ready.md`.

### Steps

1. Follow 0.10 with topics `commerce`, `overlays-and-ids`, `customize-and-upgrade`, `agent-ready`.
2. `commerce`: include the sentence that `rp-view-event` is printed only by the product, collection, search and cart blueprints. The region parts table copies the rows of D-091.
3. `overlays-and-ids`: Tooltip trigger rule ("a Button or IconButton with the prop `tooltip=\"<tooltip id>\"`, never a link"); `toast(message, options?)` imported from `__PKG__/elements` (Liquid: the `ripple` specifier; prebuilt pages: `ripple.js`); "Tabs is horizontal only and has no `orientation` prop" written exactly so (the word `orientation` MUST NOT be followed by `=`); Accordion `type` values `single`, `multiple`.
4. `agent-ready`: doc 08 section 7 as numbered steps: enable the bridge (the four forms of X-7, copied from the doc with `<pkg>` written `__PKG__`), labels (7.5), confirmation (7.3), what each audience sees (7.1). Extract X-7 with the extractor and paste the file content; do not retype.
5. `customize-and-upgrade`: library versus scaffolded; trailers; `status`, `diff`, `upgrade`; conflicts (the action words of doc 07 8.4).
6. Run the lint for the four topics; PLAN 5.0.

### Acceptance

0.10 acceptance for the four topics. `grep -c "orientation=" guides/overlays-and-ids.md` prints `0`. `grep -c "loadAgent" guides/agent-ready.md` prints at least `1`.

### Out of scope

The skills that cover the same ground (M8-T10, M8-T13, M8-T16, M8-T20).

### If blocked

0.10 steps.

---

## M8-T06 Guides `hosts-liquid`, `hosts-react`, `hosts-remix`, `hosts-html`

- **Goal:** Write the four host guides 7 to 10 of doc 08 section 2.5.
- **Depends on:** M7-T29.
- **Kind:** `guide`. Size M.

### Read first

doc 08: `### 2.5 `, `### 2.7 `, `### 2.8 ` rows K-06, K-07, K-09; `#### 4.5.13 ` "Fallback (SPIKE-11)" line. Sources: doc 06 `### 8.1 ` (1.3 kB), `### 8.2 ` (10 kB), `### 6.1 ` (4.6 kB), `### 6.2 ` prose only (skip code; about 3 kB), `### 7.1 ` (3.9 kB), `### 7.2 ` (2.2 kB), `### 7.3 ` (1.2 kB), `## 9. ` (1.2 kB); doc 14 `### 7.2 ` (0.9 kB), `### 7.3 ` prose above the code (about 1.5 kB), `### 9.3 ` (1 kB), `### 10.1 ` (1.6 kB), `## 11. ` intro (0.5 kB), `### 5.1 ` (1.4 kB); doc 12 `### 2.1 ` (5.6 kB); ledger D-097 (table); doc 05 `### 10.1 ` (5.9 kB), `### 10.2 ` (2.3 kB), `### 8.3 ` (8.3 kB); doc 02 `### 11.7 ` (1.3 kB). Ledger section 3 row SPIKE-11. This file 0.2, 0.4, 0.10.

### Files

Create: `guides/hosts-liquid.md`, `guides/hosts-react.md`, `guides/hosts-remix.md`, `guides/hosts-html.md`.

### Steps

1. Follow 0.10 with topics `hosts-liquid`, `hosts-react`, `hosts-remix`, `hosts-html`.
2. `hosts-liquid`: every `L-` rule of doc 06 8.2 as a numbered list, in order, one sentence each; it includes "`{{ attributes }}` is printed last" and the D-097 subset table with its three scopes. `{% partial %}` only in templates and layouts, at most once per name per page. Layout and templates are blueprint files. `rp-head` and the six import-map entries. Locale keys. The CSS asset and the compiler.
3. `hosts-react`: rules R-1 to R-5, `useElement`, callbacks and the four controlled props, `useCart(selector, serverValue)`, `useRegionHtml(name)`, and the `"use client"` rule (components only; data helpers in `<id>.data.ts`). SPIKE-10: apply the doc 08 4.5.12 fallback wording when the SPIKE-10 row of ledger section 3 says `FALLBACK required` (0.9 step 8).
4. `hosts-remix`: server components only; `data-rmx-*` and `rmxKey`; regions are plain elements with `data-rp-region`, no Frame; the opt-in options `reloadFrames` and `navigate` in one paragraph headed "Opt-in" (delete it when SPIKE-11 says `FALLBACK required`, 0.9 step 8); `data-rmx-document`. MUST NOT contain `named blocking Frame`.
5. `hosts-html`: two tags; `#rp-commerce` and the Hydrogen script tags on commerce pages; reference files and the fixture delimiter line (doc 02 11.7); region refresh by document fetch.
6. Run the lint for the four topics; PLAN 5.0.

### Acceptance

0.10 acceptance for the four topics. `grep -c "^[0-9]*\. " guides/hosts-liquid.md` prints at least the number of `L-` rules (`grep -o "\*\*L-[0-9]*\*\*" docs/06-bindings.md | sort -u | wc -l`). `grep -c "named blocking Frame" guides/hosts-remix.md` prints `0`.

### Out of scope

The host skills (M8-T17 to M8-T19).

### If blocked

0.10 steps. The guide exceeds 250 lines (`hosts-liquid` is the largest): shorten each `L-` rule to its first sentence; never drop a rule.

---

## M8-T07 Skill `ripple` (`skills/ripple/SKILL.md`, `ripple.json`)

- **Goal:** Write the routing skill `ripple` (doc 08 outline 4.5.1).
- **Depends on:** M7-T29.
- **Kind:** `skill`. Size S.

### Read first

This file 0.4, 0.9, PR-M8-16. doc 08: the 0.9 step 2 list with outline `#### 4.5.1 ` (1.9 kB); `### 3.2 ` block B only (search `### Rules for every task`, 1.6 kB). Nothing else: the skill names Ripple skills only.

### Files

Create: `skills/ripple/SKILL.md`, `skills/ripple/ripple.json`.

### Steps

1. Follow 0.9 with name `ripple`, outline 4.5.1.
2. `## Rules` is exactly the text of `UNIVERSAL_RULES` with `{command}` replaced by `npx __PKG__` (K-26, PR-M8-16). Print it and paste it; do not retype:

   ```bash
   node --input-type=module -e 'const m = await import("./src/gen/agents-md.ts"); const r = m.UNIVERSAL_RULES; process.stdout.write((Array.isArray(r) ? r.join("\n") : r).replace("{command}", "npx __PKG__") + "\n")'
   ```

   Put one blank line after `## Rules`, then the printed lines, then one blank line before `## Steps`.
3. `## Pick your path` is the table of doc 08 4.4 copied byte for byte (two columns, 13 rows).
4. `## What Ripple is` has at most 8 lines.
5. `## Other skills`: one sentence, "Each row of the table above names the Ripple skill to read next." The outline says "Defers to: none (names Ripple skills only)": the section exists (S-6) and names no other package's skill.

### Acceptance

0.9 acceptance with `<name>` = `ripple`. The K-26 comparison, run by hand:

```bash
node --input-type=module -e 'import fs from "node:fs"; const m = await import("./src/gen/agents-md.ts"); const r = m.UNIVERSAL_RULES; const want = (Array.isArray(r) ? r.join("\n") : r).replace("{command}", "npx __PKG__"); const t = fs.readFileSync("skills/ripple/SKILL.md", "utf8").split("\n"); const a = t.indexOf("## Rules"), b = t.findIndex((l, i) => i > a && l.startsWith("## ")); const got = t.slice(a + 1, b).join("\n").trim(); console.log(got === want.trim() ? "K-26 ok" : "K-26 FAIL")'
```

prints `K-26 ok`.

### Out of scope

The other 13 skills. The `AGENTS.md` section (M6-T13).

### If blocked

`UNIVERSAL_RULES` does not import (the module has a value import): stop; M6-T13 is broken (its acceptance requires type-only imports).

---

## M8-T08 Skill `ripple-setup` (`skills/ripple-setup/SKILL.md`, `ripple.json`)

- **Goal:** Write the skill `ripple-setup` (doc 08 outline 4.5.2).
- **Depends on:** M7-T29.
- **Kind:** `skill`. Size S.

### Read first

This file 0.4, 0.9. doc 08: the 0.9 step 2 list with outline `#### 4.5.2 ` (3 kB) and the 4.3 rows `hydrogen-setup`, `hydrogen-request-handlers`. Sources: doc 07 `### 7.3 ` (5.5 kB), `### 7.4 ` (3.6 kB), `### 7.6 ` prose and tables only (about 6 kB); ledger section 5.3 (search `### 5.3 `); doc 04 `### 5.1 ` to `### 5.4 ` (5.3 kB); doc 14 `### 7.3 ` prose above the code (about 1.5 kB).

### Files

Create: `skills/ripple-setup/SKILL.md`, `skills/ripple-setup/ripple.json`.

### Steps

1. Follow 0.9 with name `ripple-setup`, outline 4.5.2.
2. The last `Done when` item is ``- [ ] `npx __PKG__ check` prints `No problems` (run it after the first page exists).`` (the setup exception of S-7; the lint expects this exact line).
3. `## What init changes`: one table per host, files written and lines patched, from doc 07 7.4 and 7.6 and ledger 5.3.
4. `## Host notes`: four `###` subsections `html`, `react`, `remix`, `liquid` in that order, each at most 12 lines.
5. `## If init stops`: the three failure messages of `init` copied from doc 07 7.4 and the fix for each.
6. `## Other skills`: one boundary sentence each for `hydrogen-setup` and `hydrogen-request-handlers` from their 4.3 rows.

### Acceptance

0.9 acceptance with `<name>` = `ripple-setup`. `grep -c "^### " skills/ripple-setup/SKILL.md` prints `4`.

### Out of scope

Other skills. Changing `init` messages (doc 07).

### If blocked

0.9 if-blocked rules.

---

## M8-T09 Skill `ripple-compose-page` (`skills/ripple-compose-page/SKILL.md`, `ripple.json`)

- **Goal:** Write the skill `ripple-compose-page` (doc 08 outline 4.5.3).
- **Depends on:** M7-T29.
- **Kind:** `skill`. Size S.

### Read first

This file 0.4, 0.9. doc 08: the 0.9 step 2 list with outline `#### 4.5.3 ` (3.2 kB) and the 4.3 rows `hydrogen-routing`, `hydrogen-storefront-client`; `### 2.5 ` row 2 (the six examples). Sources: doc 03 `### 6.1 ` (1.8 kB); ledger section 6.2 (search `### 6.2 `); doc 12 `### 2.2 ` (4.4 kB); the `### Components used` section of each of `docs/blueprints/{home,collection,product,search,cart,article,page}.md` (about 0.5 kB each).

### Files

Create: `skills/ripple-compose-page/SKILL.md`, `skills/ripple-compose-page/ripple.json`.

### Steps

1. Follow 0.9 with name `ripple-compose-page`, outline 4.5.3.
2. `## Responsive values`: the grammar in three lines, then exactly the six examples of doc 08 2.5 row 2, each once in TSX and once in Liquid. Take each example from a generated component page or a blueprint file where one exists; otherwise use the sketch form (at most 3 sketch blocks in the whole skill: put several examples in one block).
3. `## Spacing rhythm`: the four values of the outline, exactly: `py="12 md:20"`, `gap="8 md:12"`, `gap="2"` to `gap="4"`, `gap="4 md:6"`.
4. `## Page checklists`: one `###` per blueprint id (`home`, `collection`, `product`, `search`, `cart`, `article`, `page`), each at most 6 `- [ ] ` items naming components from that blueprint's "Components used". Note: these `- [ ] ` items are inside a topic section, not `Done when`; the lint checks only `Done when`.
5. `## Other skills`: boundary sentences for `hydrogen-routing`, `hydrogen-storefront-client` (hydrogen backend only), and one line each routing to `ripple-commerce` and `ripple-discovery`.

### Acceptance

0.9 acceptance with `<name>` = `ripple-compose-page`. `grep -c 'py="12 md:20"' skills/ripple-compose-page/SKILL.md` prints at least `1`.

### Out of scope

Other skills. Blueprint content (M7).

### If blocked

0.9 if-blocked rules.

---

## M8-T10 Skill `ripple-commerce` (`skills/ripple-commerce/SKILL.md`, `ripple.json`)

- **Goal:** Write the skill `ripple-commerce` (doc 08 outline 4.5.4).
- **Depends on:** M7-T29.
- **Kind:** `skill`. Size S.

### Read first

This file 0.4, 0.9. doc 08: the 0.9 step 2 list with outline `#### 4.5.4 ` (4.1 kB) and the 4.3 rows `hydrogen-cart-ui`, `hydrogen-cart-drawer`, `hydrogen-variant-form`, `hydrogen-money`, `hydrogen-shop-pay`. Sources: doc 05 `### 6.2 ` (10.2 kB), `### 8.1 ` (2 kB), `### 9.1 ` (3.6 kB), `### 9.2 ` (4.3 kB), `### 10.5 ` (1 kB); doc 11 `### 0.3 ` (5.9 kB); ledger D-050, D-091.

### Files

Create: `skills/ripple-commerce/SKILL.md`, `skills/ripple-commerce/ripple.json`.

### Steps

1. Follow 0.9 with name `ripple-commerce`, outline 4.5.4.
2. `## Form field names`: per backend, from doc 05 10.5. On the Liquid side, never write a param `form:` (K-28); the Liquid param for joining a control to a form is the one doc 05 6.2 names (`form_id`).
3. `## Regions`: the five region names and the region-part table exactly as the outline lists them.
4. `## Checkout`: both forms of the checkout control, each with `data-agent-confirm`; inert when the cart is empty; `acceleratedCheckout`. Any `data-rp-open=` appears only inside an `html` fence.
5. `## Other skills`: one boundary sentence per named Hydrogen skill, including which apply on Liquid (4.3).

### Acceptance

0.9 acceptance with `<name>` = `ripple-commerce`. `grep -c "data-agent-confirm" skills/ripple-commerce/SKILL.md` prints at least `1`.

### Out of scope

Other skills. Commerce behaviour.

### If blocked

0.9 if-blocked rules.

---

## M8-T11 Skill `ripple-discovery` (`skills/ripple-discovery/SKILL.md`, `ripple.json`)

- **Goal:** Write the skill `ripple-discovery` (doc 08 outline 4.5.5).
- **Depends on:** M7-T29.
- **Kind:** `skill`. Size S.

### Read first

This file 0.4, 0.9. doc 08: the 0.9 step 2 list with outline `#### 4.5.5 ` (2.2 kB) and the 4.3 rows `hydrogen-collection-browser`, `hydrogen-predictive-search`. Sources: doc 05 `### 7.3 ` (2.2 kB), `### 7.4 ` (2.6 kB), `### 8.3 ` (8.3 kB); doc 11 `### 0.3 ` (5.9 kB); `docs/blueprints/collection.md` `### Regions` and `### Components used`; `docs/blueprints/search.md` the same two sections.

### Files

Create: `skills/ripple-discovery/SKILL.md`, `skills/ripple-discovery/ripple.json`.

### Steps

1. Follow 0.9 with name `ripple-discovery`, outline 4.5.5.
2. `## URL params`: `filter.*`, `sort_by`, `page`, `q` and one example URL.
3. `## Where filters go`: the MUST NOT sentence of the outline (never inside a Drawer, Dialog or Popover).
4. `## Other skills`: the `hydrogen-collection-browser` boundary sentence and the "Do NOT use `hydrogen-predictive-search`" sentence of 4.3.

### Acceptance

0.9 acceptance with `<name>` = `ripple-discovery`. `grep -c "sort_by" skills/ripple-discovery/SKILL.md` prints at least `1`.

### Out of scope

Other skills.

### If blocked

0.9 if-blocked rules.

---

## M8-T12 Skill `ripple-theming` (`skills/ripple-theming/SKILL.md`, `ripple.json`)

- **Goal:** Write the skill `ripple-theming` (doc 08 outline 4.5.6).
- **Depends on:** M7-T29.
- **Kind:** `skill`. Size S.

### Read first

This file 0.4, 0.9. doc 08: the 0.9 step 2 list with outline `#### 4.5.6 ` (2.1 kB); no 4.3 row ("Defers to: none"). Sources: doc 03 `### 3.2 ` (1.8 kB), `### 3.6 ` (2.4 kB), `### 3.7 ` (1.6 kB), `### 3.4 ` the table header and the colour-role rows (about 3 kB); ledger D-026, D-027, D-029; doc 14 `### 6.1 ` prose (about 1 kB), `### 6.2 ` (3.1 kB).

### Files

Create: `skills/ripple-theming/SKILL.md`, `skills/ripple-theming/ripple.json`.

### Steps

1. Follow 0.9 with name `ripple-theming`, outline 4.5.6.
2. This is the only skill WITHOUT `## Other skills` (S-6: "Defers to: none" and no Ripple skill named). Do not name any other skill anywhere in the file.
3. `## Liquid theme settings`: the mapping of doc 14 6.2 (setting id to token).

### Acceptance

0.9 acceptance with `<name>` = `ripple-theming`. `grep -c "^## Other skills" skills/ripple-theming/SKILL.md` prints `0`. `grep -c "\`ripple-\|\`hydrogen-" skills/ripple-theming/SKILL.md` prints `0`.

### Out of scope

Other skills. Token values (doc 03).

### If blocked

0.9 if-blocked rules.

---

## M8-T13 Skill `ripple-customize-component` (`skills/ripple-customize-component/SKILL.md`, `ripple.json`)

- **Goal:** Write the skill `ripple-customize-component` (doc 08 outline 4.5.7).
- **Depends on:** M7-T29.
- **Kind:** `skill`. Size S.

### Read first

This file 0.4, 0.9. doc 08: the 0.9 step 2 list with outline `#### 4.5.7 ` (1.4 kB). Sources: doc 02 `### 7.1 ` (2 kB); doc 03 `### 7.1 ` (1.4 kB), `### 7.3 ` (9.2 kB); doc 07 `### 5.1 ` prose (about 2 kB), `### 8.1 ` the decision table (7.2 kB), `### 8.4 ` (1.1 kB); ledger D-053, D-056.

### Files

Create: `skills/ripple-customize-component/SKILL.md`, `skills/ripple-customize-component/ripple.json`.

### Steps

1. Follow 0.9 with name `ripple-customize-component`, outline 4.5.7.
2. `## Other skills`: one line routing to `ripple-upgrade` and one to `ripple-theming`.

### Acceptance

0.9 acceptance with `<name>` = `ripple-customize-component`.

### Out of scope

Other skills.

### If blocked

0.9 if-blocked rules.

---

## M8-T14 Skill `ripple-new-component` (`skills/ripple-new-component/SKILL.md`, `ripple.json`)

- **Goal:** Write the skill `ripple-new-component` (doc 08 outline 4.5.8).
- **Depends on:** M7-T29.
- **Kind:** `skill`. Size S.

### Read first

This file 0.4, 0.9. doc 08: the 0.9 step 2 list with outline `#### 4.5.8 ` (1.6 kB) and the 4.3 row `ui-sdk`; `### 8.6 ` the T15 paragraph only (search `**T15 escape hatch**`, 0.8 kB). Sources: doc 03 `### 2.2 ` (2.2 kB), `## 10. ` (3.4 kB); doc 02 `### 2.4 ` (0.7 kB); doc 04 `## 7. ` (5.7 kB).

### Files

Create: `skills/ripple-new-component/SKILL.md`, `skills/ripple-new-component/ripple.json`.

### Steps

1. Follow 0.9 with name `ripple-new-component`, outline 4.5.8.
2. `## Static pattern example`: the size-chart table as a sketch block (`<!-- sketch -->` first line; no fixture has it), plus its CSS as a second fenced block of language `css` (K-22 does not check `css`), using `var(--color-border)`, `var(--color-muted)`, logical properties and a sticky header.
3. `## Other skills`: the `ui-sdk` boundary sentence (4.3) and one line routing to `ripple-customize-component`.

### Acceptance

0.9 acceptance with `<name>` = `ripple-new-component`. `grep -c "var(--color-border)" skills/ripple-new-component/SKILL.md` prints at least `1`.

### Out of scope

Other skills. The T15 eval task (M8-T35).

### If blocked

0.9 if-blocked rules.

---

## M8-T15 Skill `ripple-check-and-fix` (`skills/ripple-check-and-fix/SKILL.md`, `ripple.json`)

- **Goal:** Write the skill `ripple-check-and-fix` (doc 08 outline 4.5.9).
- **Depends on:** M7-T29.
- **Kind:** `skill`. Size S.

### Read first

This file 0.4, 0.9. doc 08: the 0.9 step 2 list with outline `#### 4.5.9 ` (1.8 kB) and the 4.3 row `hydrogen-smoke-test`; `### 2.7 ` (0.7 kB). Sources: doc 07 `### 9.1 ` (1.7 kB), `### 9.2 ` (1.9 kB), `### 9.4 ` (1.9 kB, including the example of 9.4.1).

### Files

Create: `skills/ripple-check-and-fix/SKILL.md`, `skills/ripple-check-and-fix/ripple.json`.

### Steps

1. Follow 0.9 with name `ripple-check-and-fix`, outline 4.5.9.
2. `## Reading a diagnostic`: the example of doc 07 9.4.1 copied byte for byte inside a fence of language `text`, except that its command form is written `npx __PKG__` (the doc prints `npx ripple-kit@0.1.0`, which K-24 forbids; record the change in the done file). One sentence per label (`found`, `allowed`, `fix`, `why`, `docs`).
3. This skill MAY name the rule ids that outline 4.5.9 lists (S-4 exception) and no others.
4. `## Commands`: only the `check` options of doc 07 9.2 and the four `docs` forms of doc 08 2.7.
5. `## Other skills`: the `hydrogen-smoke-test` boundary sentence.

### Acceptance

0.9 acceptance with `<name>` = `ripple-check-and-fix`. `grep -c "docs --rule" skills/ripple-check-and-fix/SKILL.md` prints `0`.

### Out of scope

Other skills. Rule text (M8-T01).

### If blocked

0.9 if-blocked rules.

---

## M8-T16 Skill `ripple-upgrade` (`skills/ripple-upgrade/SKILL.md`, `ripple.json`)

- **Goal:** Write the skill `ripple-upgrade` (doc 08 outline 4.5.10).
- **Depends on:** M7-T29.
- **Kind:** `skill`. Size S.

### Read first

This file 0.4, 0.9. doc 08: the 0.9 step 2 list with outline `#### 4.5.10 ` (1.4 kB) and the 4.3 row `migrate-to-hydrogen-2026-10`. Sources: doc 07 `### 7.7 ` (3.3 kB), `### 7.8 ` (2.4 kB), `### 8.1 ` (7.2 kB), `### 8.2 ` prose (about 2 kB), `### 8.4 ` (1.1 kB), `### 7.13 ` (2.6 kB).

### Files

Create: `skills/ripple-upgrade/SKILL.md`, `skills/ripple-upgrade/ripple.json`.

### Steps

1. Follow 0.9 with name `ripple-upgrade`, outline 4.5.10.
2. `## Reading the plan`: every action word of the doc 07 8.1 decision table with its meaning; `## Resolving conflicts`: the conflict marker lines exactly as doc 07 8.2 prints them, inside a `text` fence.
3. `## Other skills`: the `migrate-to-hydrogen-2026-10` boundary sentence.

### Acceptance

0.9 acceptance with `<name>` = `ripple-upgrade`.

### Out of scope

Other skills. The T09 eval task (M8-T32).

### If blocked

0.9 if-blocked rules.

---

## M8-T17 Skill `ripple-liquid` (`skills/ripple-liquid/SKILL.md`, `ripple.json`)

- **Goal:** Write the skill `ripple-liquid` (doc 08 outline 4.5.11).
- **Depends on:** M7-T29.
- **Kind:** `skill`. Size S.

### Read first

This file 0.4, 0.9. doc 08: the 0.9 step 2 list with outline `#### 4.5.11 ` (4.4 kB) and the 4.3 rows the outline's "Which Hydrogen skills apply here" names; `### 6.3 ` (0.7 kB). Sources: doc 06 `### 8.1 ` (1.3 kB), `### 8.2 ` (10 kB); doc 14 `## 3. ` (3.8 kB), `### 7.2 ` (0.9 kB), `### 7.3 ` prose (about 1.5 kB), `### 9.3 ` (1 kB), `### 5.1 ` (1.4 kB), `### 5.4 ` (0.4 kB); ledger D-097 (table). Ledger section 3 rows SPIKE-02 and SPIKE-03.

### Files

Create: `skills/ripple-liquid/SKILL.md`, `skills/ripple-liquid/ripple.json`.

### Steps

1. Follow 0.9 with name `ripple-liquid`, outline 4.5.11. Hosts: `liquid` only; the description's first sentence names Liquid (4.1).
2. The sentence of doc 08 6.3 MUST appear exactly: "A wrong value renders the default silently. Run the checker."
3. `## Three kinds of component`: one example each from fixtures or generated pages: Button (block), Dialog with DialogTitle (parts), ProductCard (resource), as `liquid` fences copied from `pkg/docs/components/{button,dialog,product-card}.md`.
4. `## Partials and regions`: the six region snippets; the layout omits the CartDrawer when `template.name == 'cart'`.
5. Spike fallbacks (0.9 step 8): SPIKE-03 (last sentence of `## CSS`) and SPIKE-02 (`as` becomes `tag`).
6. `## Other skills`: the theme's own `AGENTS.md` and `DESIGN.md` in one sentence; one line each routing to `ripple-commerce` and `ripple-theming`.

### Acceptance

0.9 acceptance with `<name>` = `ripple-liquid`. `grep -c "A wrong value renders the default silently. Run the checker." skills/ripple-liquid/SKILL.md` prints `1`. `cat skills/ripple-liquid/ripple.json` prints `{"hosts":["liquid"]}`.

### Out of scope

Other skills. The theme (M7-T23).

### If blocked

0.9 if-blocked rules. The 260-line budget is exceeded: shorten `## Liquid subset` to the table of D-097.

---

## M8-T18 Skill `ripple-react` (`skills/ripple-react/SKILL.md`, `ripple.json`)

- **Goal:** Write the skill `ripple-react` (doc 08 outline 4.5.12).
- **Depends on:** M7-T29.
- **Kind:** `skill`. Size S.

### Read first

This file 0.4, 0.9. doc 08: the 0.9 step 2 list with outline `#### 4.5.12 ` (2.2 kB) and the 4.3 rows `hydrogen-storefront-client`, `hydrogen-routing`. Sources: doc 06 `### 6.1 ` (4.6 kB), `### 6.2 ` prose (about 3 kB), `### 5.1 ` (4.1 kB); ledger D-036. Ledger section 3 row SPIKE-10.

### Files

Create: `skills/ripple-react/SKILL.md`, `skills/ripple-react/ripple.json`.

### Steps

1. Follow 0.9 with name `ripple-react`, outline 4.5.12. Hosts: `react` only.
2. `## Controlled props`: the four props of D-036 and one example (Dialog `open` with `onOpenChange`) copied from `pkg/docs/components/dialog.md` (tsx) or a blueprint file.
3. Spike fallback SPIKE-10 (0.9 step 8): the `useRegionHtml` sentences.
4. `## Other skills`: boundary sentences for `hydrogen-storefront-client` and `hydrogen-routing`; one line routing to `ripple-commerce`.

### Acceptance

0.9 acceptance with `<name>` = `ripple-react`. `cat skills/ripple-react/ripple.json` prints `{"hosts":["react"]}`.

### Out of scope

Other skills.

### If blocked

0.9 if-blocked rules.

---

## M8-T19 Skill `ripple-remix` (`skills/ripple-remix/SKILL.md`, `ripple.json`)

- **Goal:** Write the skill `ripple-remix` (doc 08 outline 4.5.13).
- **Depends on:** M7-T29.
- **Kind:** `skill`. Size S.

### Read first

This file 0.4, 0.9. doc 08: the 0.9 step 2 list with outline `#### 4.5.13 ` (1.7 kB) and the 4.3 row `remix`. Sources: doc 06 `### 7.1 ` (3.9 kB), `### 7.2 ` (2.2 kB), `### 7.3 ` (1.2 kB); doc 05 `### 10.2 ` (2.3 kB), `### 8.3 ` the Remix rows (about 2 kB). Ledger section 3 row SPIKE-11.

### Files

Create: `skills/ripple-remix/SKILL.md`, `skills/ripple-remix/ripple.json`.

### Steps

1. Follow 0.9 with name `ripple-remix`, outline 4.5.13. Hosts: `remix` only.
2. `## Regions`: regions are plain elements; no Frame, no client code; then the "Opt-in" paragraph (`reloadFrames`, `navigate`). SPIKE-11 (0.9 step 8): when its result is `FALLBACK required`, delete the "Opt-in" paragraph here, and also from `guides/hosts-remix.md` in the same pull request (PLAN SPIKE-11 row names M8-T06 and M8-T19).
3. `## Listening to events`: a 6-line `tsx` block with `addEventListener("openchange", ...)` in the app's own client code. No fixture contains it: use a sketch block (`// sketch` first line).
4. MUST NOT contain `named blocking Frame` (K-28).
5. `## Other skills`: the `remix` boundary sentence; one line routing to `ripple-commerce`.

### Acceptance

0.9 acceptance with `<name>` = `ripple-remix`. `cat skills/ripple-remix/ripple.json` prints `{"hosts":["remix"]}`.

### Out of scope

Other skills. SPIKE-11 itself (M1-T45).

### If blocked

0.9 if-blocked rules.

---

## M8-T20 Skill `ripple-agent-ready` (`skills/ripple-agent-ready/SKILL.md`, `ripple.json`)

- **Goal:** Write the skill `ripple-agent-ready` (doc 08 outline 4.5.14).
- **Depends on:** M7-T29.
- **Kind:** `skill`. Size S.

### Read first

This file 0.4, 0.9, PR-M8-15. doc 08: the 0.9 step 2 list with outline `#### 4.5.14 ` (1.6 kB) and the 4.3 row `ui-sdk`; `### 7.1 ` to `### 7.5 ` (9.6 kB).

### Files

Create: `skills/ripple-agent-ready/SKILL.md`, `skills/ripple-agent-ready/ripple.json`.

### Steps

1. Follow 0.9 with name `ripple-agent-ready`, outline 4.5.14.
2. The enabling snippet is X-7 (extract it; replace `<pkg>` by `__PKG__`) in a fence of language `js` (K-22 does not check `js`).
3. `## Actions`: the action names of doc 08 7.2 per element, no others; `## Confirmation`: `data-agent-confirm` and the `Needs a person:` refusal.
4. `## Other skills`: the `ui-sdk` boundary sentence WITHOUT the path `references/agent-ready.md` (PR-M8-15; K-28 forbids `references/`).

### Acceptance

0.9 acceptance with `<name>` = `ripple-agent-ready`. `grep -c "references/" skills/ripple-agent-ready/SKILL.md` prints `0`.

### Out of scope

Other skills. Agent tests (M8-T03).

### If blocked

0.9 if-blocked rules.

---

## M8-T21 Skills acceptance (doc 08 §4.6) and `AGENTS.md` section acceptance (§3.3, §3.4)

- **Goal:** Commit tests K-20 to K-28 for the 14 skills, the remaining documentation tests K-02, K-06, K-07, K-09, publish `skills/` and `guides/` in `pkg/`, and confirm K-10 to K-16 with all 84 components.
- **Depends on:** M6-T13, M8-T07 to M8-T20. Also 0.7: M8-T04, M8-T05, M8-T06.
- **Kind:** `harness`. Size S.

### Read first

doc 08: `### 4.6 ` (2 kB), `### 4.1 ` (3.7 kB), `### 4.2 ` (1.2 kB), `### 3.3 ` (0.8 kB), `### 3.4 ` (1.3 kB), `### 2.8 ` (1.5 kB). doc 01 `## 7. ` step 8 and step 10 (search `8. **Copy and token-replace.**`, 1 kB). doc 07 `### 7.13 ` (2.6 kB). This file 0.4 (the two lint scripts: the tests implement the same rules), 0.5, 0.6, PR-M8-1, PR-M8-2.

### Files

Create: `src/gen/skills.test.ts`. Change: `src/gen/docs.test.ts` (K-02, K-06, K-07, K-09), `src/gen/build.ts` (the two skip lines), `src/gen/agents-md.test.ts` (only when K-10 does not use all 84 components).

### Steps

1. Branch `task/M8-T21-skills-acceptance`.
2. `ls skills/ | wc -l` prints `14`; `ls guides/ | wc -l` prints `12`. Otherwise stop (0.7).
3. `src/gen/build.ts`: delete the `build: skipped skills (PLAN 4.4)` and `build: skipped guides (PLAN 4.4)` lines and their markers. Step 8 copies `skills/` to `pkg/skills/` with the `__PKG__` replacement of doc 01 section 7 step 8 (the replacement is already applied to every copied text file; use the same function the step uses for `css/`). After `pnpm build`: `ls pkg/skills | wc -l` prints `14`; `grep -rl "__PKG__" pkg/skills pkg/docs` prints nothing.
4. `src/gen/skills.test.ts` (`[T1]`, subject `skills`), reading `skills/` and `docs/08-agent-kit-and-evals.md` with `node:fs`. Port the checks of `skill-lint.mjs` (0.4), one test per id:
   - `[T1] skills: K-20 skills holds exactly the 14 directories, each with exactly SKILL.md and ripple.json`.
   - `[T1] skills: K-21 frontmatter, description, line budget and headings follow doc 08 4.1 and 4.5` (description byte-equal to the outline's; at most 300 lines and at most the outline's line budget; heading sequence of S-6; Rules 1 to 12 items; Done when last line).
   - `[T1] skills: K-22 every html, liquid and tsx block comes from a fixture, a component page or a blueprint file`. This test needs `pkg/docs/components/`: tag it `[T10]` instead (PR-M8-2) and name it `[T10] skills: K-22 ...`.
   - `[T1] skills: K-23 every sidecar equals the hosts of doc 08 4.2`.
   - `[T1] skills: K-24 no skill names a ledger id, a spike, src/, the ledger file or the package name`.
   - `[T1] skills: K-25 every skill named in backticks exists in 4.2 or 4.3`.
   - `[T1] skills: K-26 the ripple skill Rules equal UNIVERSAL_RULES` (import `UNIVERSAL_RULES` from `src/gen/agents-md.ts`; comparison of PR-M8-16).
   - `[T1] skills: K-27 skills sync installs 12, 12, 12 and 11 skills for liquid, react, remix and html`: for each host, `runCli(["skills", "sync", "--host", host], { cwd: tempDir(), packageRoot: process.cwd() })` from `test/support/cli.ts` (the repository root has `skills/` in the layout `syncSkills` reads); list `.claude/skills` and `.agents/skills`; each holds exactly the skills whose sidecar lists the host.
   - `[T1] skills: K-28 no skill contains the forbidden strings` (the K-28 list; `data-rp-open=` allowed only inside `html` fences).
   The tests parse doc 08 tables at run time as the lint does; do not copy the 14 descriptions into the test.
5. `src/gen/docs.test.ts`: `[T10] docs: K-02 INDEX.md row counts and links`, `[T10] docs: K-06 pkg/docs and pkg/skills contain no __PKG__ and no TBD`, `[T10] docs: K-07 every guide in pkg/docs/guides has the frontmatter, at most 250 lines and relative links that resolve inside pkg/docs`, `[T10] docs: K-09 pkg/docs and pkg/skills print no forbidden command form`.
6. K-10 to K-16: run `pnpm test:unit --files=src/gen/agents-md`. Confirm that K-10's render uses every component of the repository manifest (84, `BRINGUP_SUBSET` is gone); when the test builds its input from a fixed subset, change only its input to the full manifest. K-15 is an eval: in `src/gen/agents-md.test.ts` keep the comment `// K-15: eval, not gating` and record in the done file that K-15 runs as task T11 with arm `no-skills` (M8-T37 or later; doc 08 3.4).
7. Proof: PLAN 5.0. `pnpm build 2>&1 | grep -c "build: skipped"` prints `0`.

### Acceptance

All tests named in steps 4 to 6 pass. `grep -c "PLAN 4.4" src/gen/build.ts` prints `0`. `ls pkg/skills | wc -l` prints `14`. `ls pkg/docs/guides | wc -l` prints `12`.

### Out of scope

Changing skill or guide content beyond what a failing test forces (fix in the skill file, record which skill). The pi-package arm (M8-T25).

### If blocked

- A K-21 or K-28 failure in a skill: fix the skill in this pull request and name it under "Deviations".
- K-10 exceeds 12,000 bytes with 84 components: the size rule of M6-T13 is wrong; fix `renderAgentsSection` per doc 08 3.3 and record it.
- K-27 fails because `syncSkills` also reads `registry/index.json`: pass `packageRoot` as a temporary copy holding `skills/` only, and record the reading in the done file.

---

## M8-T22 Eval harness: `evals/adapters/{package.json,run.ts,workspace.ts,Dockerfile,entrypoint.sh}`, `task.json` schema, start states, `templates/<host>/`

- **Goal:** Create the eval harness skeleton: the package, the shared types and `validateTask`, the `run.ts` command line with its nine steps (stubs where later tasks fill them), `workspace.ts` with the four base states and the arms, the container files, and the four base templates.
- **Depends on:** M0-T45.
- **Kind:** `eval`. Size M (the templates part may be split, step 9).

### Read first

doc 08: `## 8. ` intro, `### 8.1 ` to `### 8.5 ` (10.8 kB), `### 8.7 ` the table rows only (search `| Adapter | Command`, 1.5 kB), `### 8.14 ` the last paragraph (0.4 kB). doc 01 `### 4.2 ` rule 2 (search `ONE pnpm package`, 0.5 kB). doc 13 `## 16. ` (0.4 kB). `../hydrogen/scripts/storefront-benchmark-harness/Dockerfile` (0.6 kB) and `entrypoint.sh` (0.7 kB); the docker invocation in `run-opencode-docker.ts` (search `docker`, about 3 kB). This file 0.2, 0.3 (X-1, X-2, X-3, X-6), 0.6, 0.8, 0.11, PR-M8-9 to PR-M8-14, PR-M8-18, PR-M8-19.

### Files

Create: `evals/adapters/package.json`, `evals/adapters/pnpm-lock.yaml` (written by pnpm), `evals/adapters/tsconfig.json`, `evals/adapters/types.ts`, `evals/adapters/types.test.ts`, `evals/adapters/run.ts`, `evals/adapters/run.test.ts`, `evals/adapters/workspace.ts`, `evals/adapters/workspace.test.ts`, `evals/adapters/Dockerfile`, `evals/adapters/entrypoint.sh`, `evals/adapters/templates/liquid/**`, and (step 9) `evals/adapters/templates/{html,react,remix}/**`.

### Steps

1. Branch `task/M8-T22-eval-harness`.
2. `evals/adapters/package.json`: `{ "name": "ripple-evals", "private": true, "type": "module", "dependencies": { "ripple-kit": "file:../../pkg", "playwright": "<v>" }, "devDependencies": { "typescript": "<t>", "@types/node": "<n>" } }` where `<v>`, `<t>`, `<n>` are the exact versions of the root `package.json` (`node -p 'const p=require("./package.json");[p.devDependencies.playwright,p.devDependencies.typescript,p.devDependencies["@types/node"]].join(" ")'`). The name `ripple-evals` is PLAN-CHOSEN. Then `pnpm build && pnpm --dir evals/adapters install` (writes the lockfile). Do not add `evals/adapters` to any workspace file (there is none, doc 01).
3. `evals/adapters/tsconfig.json`: exactly the object of 0.6 (row "eval type check").
4. `types.ts`: extract X-1 and X-2 to `node_modules/.cache/ripple/x1.ts` and `x2.ts`, paste them, and prefix `interface EvalTask` with `export`. Add `Host`, `Arm`, `Tier`, `RunRecord` (fields of X-3; extract X-3 to read them, do not paste the JSON), `CORE_SET`, and `validateTask` (0.6). `validateTask` checks: every key of `EvalTask` present, no other key; types; `id` equals the directory name; `set` is `core` exactly when `id` is in `CORE_SET`; `hosts` non-empty and each a `Host`; `start.base` one of the four values; `budgets.frozen` boolean.
5. `run.ts` (EV-1):
   - `parseOptions(argv)` with `node:util` `parseArgs`, strict: `--tasks` (`<ids>` comma list, `core`, `all`; default `core`), `--hosts` (default `all`), `--adapter` (default `pi`), `--model` (default `agentModel` of `evals/rubric/bar.json` when that file exists, else `anthropic/claude-opus-4-6`), `--arm` (default `ripple`), `--runs` (default 1), `--judge`, `--out` (default `evals/runs/<UTC YYYYMMDD-HHMMSS>`), `--parallel` (default 2, at most 4), `--reference`, `--bar`, `--calibrate` (PR-M8-18). A leading `--` (from `pnpm eval -- ...`) is dropped. Unknown option or value: print `error: <one sentence>` to standard error, exit 2.
   - `main(argv): Promise<number>`; the file ends with `if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main(process.argv.slice(2))`.
   - Step 0 (PR-M8-9): `pnpm build`, then `pnpm --dir evals/adapters install --frozen-lockfile`, then `await import()` of the sibling modules.
   - Steps 1 to 9 of doc 08 8.4 as separate functions with a comment `// step <n>` each. This task implements steps 1, 2, 3, 4 (container start), 5 (adapter call through the `HarnessAdapter` loaded from `./<adapter>.ts`; when that file does not exist, exit 2 with `error: adapter <name> is not implemented`), and 9 (write `result.json` from whatever later steps returned; never delete a run directory). Steps 6, 7, 8 are stubs that throw `Error("step <n>: not implemented (<task id>)")` naming M8-T30, M8-T23 and M8-T23/M8-T24.
   - `--reference` (PR-M8-12): for each cell, build the start state, copy `tasks/<id>/reference/<host>/` over it, skip steps 4 to 6, run step 7 on the host machine.
   - `KEY_ENV` (PR-M8-11): read `RIPPLE_EVAL_API_KEY`; pass it into the container under `KEY_ENV[<model prefix>]`; an unknown prefix exits 2.
   - Cells: tasks times hosts (only hosts the task lists) times runs; up to `--parallel` at once.
6. `workspace.ts`: `buildWorkspace` (0.6) for the four base states of 8.5, `start.after`, the overlay `start/<host>/`, the arms table of 8.5, then `git init`, `git add -A`, `git -c user.name=ripple-eval -c user.email=eval@localhost commit -m start`. It returns `{ startCommit, startModified }` where `startModified` is the list of paths that `status --json` reports `modified` in the start state (empty for `template`). Rules:
   - Every state copies the tarball to `workspace/vendor/ripple.tgz`. npm hosts: set the dependency `"ripple-kit": "file:./vendor/ripple.tgz"` in the workspace `package.json` (replace an existing `ripple-kit` entry), then `pnpm install`. Liquid: no install; the CLI is `npx --yes ./vendor/ripple.tgz` (function `cli` of 0.6).
   - `initialised`: `template`, then `cli(["init"])`, `cli(["add", "--blueprint", "layout"])`, `cli(["skills", "sync"])`; on `liquid` delete `layout/theme.liquid` first and pass `--host liquid` to the first two.
   - `reference` and `liquid-theme`: copy `examples/<host>/` without `node_modules/`, `.ripple-conformance/` and the example's lockfile, then `cli(["skills", "sync"])`.
   - Arms: `no-skills` and `pi-package` delete `.claude/skills/ripple*` and `.agents/skills/ripple*`; `control` uses `template` for every task and, for `liquid`, a copy of `theme/` (never modify `theme/`).
   - `spawnInContainer(argv, { cwd, env, timeoutMs, name })` (PLAN-CHOSEN, exported for the adapters): `docker run --rm --name <name> -v <cwd>:/workspace -w /workspace` plus `-e` for each env entry, image `ripple-eval:latest`, then `argv`. On timeout it runs `docker kill <name>` (E-2). It returns `{ exitCode, timedOut, stdout, stderr, wallMs }`. Port the mounts and the anonymous `node_modules` volume from `run-opencode-docker.ts` when present (M8-R4). Network egress limits (8.4 step 4): use the mechanism of the Hydrogen runner when it has one; otherwise leave a `// UNVERIFIED: egress is not limited` comment and record it in the done file.
7. `Dockerfile`: `FROM node:24-bookworm-slim`; `apt-get install -y --no-install-recommends ca-certificates git ripgrep`; `npm install -g pnpm@10.33.0 opencode-ai@1.14.30 @earendil-works/pi-coding-agent@1.6.0 <claude package>@2.1.330`, where `<claude package>` is the npm name of Claude Code: UNVERIFIED in the sources; confirm it with `npm view <name>@2.1.330 version` before committing, and when the version does not exist, use the newest version that `claude --help` shows with every flag of the 8.7 row, and record the change. A non-root user `eval`; `WORKDIR /workspace`; `COPY entrypoint.sh /runner/`; `ENTRYPOINT ["/runner/entrypoint.sh"]`. `entrypoint.sh`: the Hydrogen file's three actions (create and chown `/workspace/node_modules`, set `HOME=/home/eval`, `exec setpriv --reuid=eval --regid=eval --init-groups "$@"`). Build tag `ripple-eval:latest` (`docker build -t ripple-eval:latest evals/adapters`) is done by `run.ts` step 4 when the image is missing.
8. `templates/liquid/`: the platform skeleton only: `layout/theme.liquid` (doctype, `<html lang="en">`, `<head>` with `<meta charset="utf-8">`, `<title>{{ shop.name }}</title>` and a line `{{ content_for_header }}`, `<body>` with `{{ content_for_layout }}`), one empty `templates/<name>.liquid` for each file name in `ls theme/templates/`, `config/settings_schema.json` holding `[]`, `locales/en.default.json` holding `{}`, and `AGENTS.md` holding a `# Theme rules` heading and the bullet list of doc 14 `### 2.1 ` (the rules D-039 keeps) copied verbatim.
9. `templates/html/`, `templates/react/`, `templates/remix/` (PR-M8-14). Only when `docs/plan/done/M7-T20.md`, `M7-T21.md` and `M7-T22.md` exist; otherwise skip this step, and write `FOLLOW-UP NEEDED: templates html, react, remix (M8-T22 step 9)` in the done file (0.7 makes M8-T31 to M8-T38 wait for them). For each host: copy `examples/<host>/` without `node_modules/`, `.ripple-conformance/`; delete every file that `node <repo>/pkg/bin/ripple.mjs status --json` (run in the copy) lists as installed, then `ripple.json`, `.claude/`, `.agents/`, the Ripple region of `AGENTS.md`, and every import of `ripple-kit`; replace every route file of the 8.5 path list (`/`, `/products/{product}`, `/collections/{collection}`, `/collections`, `/cart`, `/search`, `/pages/{page}`) by one that returns a page with only an `<h1>`; keep the Hydrogen client, the `/api/cart` handlers and the Tailwind v4 set-up. The directories MUST match EV-9 (`app/routes`, `app/lib` on react and remix; `server` on html). `package.json` has the scripts `dev`, `build`, `typecheck`, `start`; `AGENTS.md` lists `install`, `dev`, `build`, `typecheck`, `start` with their commands. Hydrogen's skills: run `npx @shopify/hydrogen skills sync` in the template when the Hydrogen package of the example provides that command and commit its output; otherwise record `UNVERIFIED: Hydrogen skills not synced` in the done file.
10. Tests (`node --test`, names `<module>: <statement>`, EV-3, EV-4):
    - `types.test.ts`: `types: validateTask accepts a complete task`, `types: validateTask reports a missing key, an extra key, a wrong set and an id mismatch`.
    - `run.test.ts`: `run: parseOptions applies the defaults of doc 08 8.4`, `run: parseOptions drops a leading --`, `run: an unknown option exits 2`, `run: K-69 npm pack --dry-run in pkg lists no evals path` (spawns `npm pack --dry-run --json` in `pkg/`; requires a build, skipped with a clear message when `pkg/package.json` is absent).
    - `workspace.test.ts`: with a synthetic task and a fake tarball file: `workspace: template copies the host template and commits it`, `workspace: an overlay replaces files of the base state`, `workspace: after copies the earlier reference first`, `workspace: no-skills deletes only ripple skills`. Pass a stub for `cli` through an optional `cliImpl` field of the options (PLAN-CHOSEN) so that no package is installed.
11. Proof: PLAN 5.0 and EV-2.

### Acceptance

EV-2 commands exit 0. `node evals/adapters/run.ts --nope; echo $?` prints the error line and `2`. `node -e 'JSON.parse(require("fs").readFileSync("evals/adapters/package.json","utf8")).private===true||process.exit(1)'` exits 0. `git check-ignore evals/runs/x` prints `evals/runs/x`. `ls evals/adapters/templates/liquid/templates | wc -l` equals `ls theme/templates | wc -l`.

### Out of scope

Serving, checks and scores (M8-T23, M8-T24). Adapters (M8-T25 to M8-T27). The canary (M8-T30). Task files (M8-T31 to M8-T38).

### If blocked

- `pnpm --dir evals/adapters install` resolves the root project instead: add `--ignore-workspace` to every such command in this file's steps and in `run.ts`, and record it.
- Docker is not available in the session: implement and unit-test everything; state in the pull request that `spawnInContainer` was not run; M8-T39 runs it first.

---

## M8-T23 Eval harness: `serve.ts`, `mockshop.ts`, `checks.ts`

- **Goal:** Serve a workspace, pick the catalogue handles, and run a task's deterministic checks, gates `renders`, `no-page-error`, `no-secret`, the screenshots and the deterministic visual checks (steps 7 and 8 of doc 08 8.4, except scoring).
- **Depends on:** M8-T22.
- **Kind:** `eval`. Size M.

### Read first

doc 08: `### 8.3 ` (1.5 kB), `### 8.4 ` steps 7 and 8, `### 8.5 ` the paragraph "Fixed paths in every npm-host template" (0.6 kB), `### 8.6 ` the first three paragraphs (search `Check conventions`, 1 kB), `### 8.8 ` the gates table (0.8 kB), `### 8.9 ` the first two lists (screenshots and deterministic visual checks, 1.2 kB). doc 13 `### 4.5 ` the `ServeThemeOptions` declaration only (search `interface ServeThemeOptions`) and `## 16. `. This file 0.3 (X-6), 0.6, 0.11, PR-M8-8, PR-M8-17.

### Files

Create: `evals/adapters/serve.ts`, `serve.test.ts`, `mockshop.ts`, `mockshop.test.ts`, `checks.ts`, `checks.test.ts`, `__fixtures__/mockshop.json`. Change: `evals/adapters/run.ts` (step 7 and the check part of step 8 only), `evals/adapters/types.ts` (add types only).

### Steps

1. Branch `task/M8-T23-eval-serve-checks`.
2. `serve.ts`: `startApp` and `waitForRoutes` (0.6). Liquid: extract X-6 and use exactly that call with `{ themeRoot: workspaceDir }`, importing from `ripple-kit/testing`; `url`, `resetCart()`, `close()` come from the returned server. npm hosts: run the template's `start` script with `PORT=<free port>` (get one with `net.createServer().listen(0)`), wait for `waitForRoutes`; `resetCart` clears cookies of the shared check context. Never render Liquid any other way (8.3).
3. `mockshop.ts`: `pickCatalogue` sends one POST to `https://mock.shop/api` with a GraphQL query for `products(first: 50) { nodes { handle variants(first: 2) { nodes { id } } } }`, `collections(first: 50) { nodes { handle products(first: 8) { nodes { id } } } }` and `pages(first: 1) { nodes { handle } }`; picks the first product with at least two variants, the first collection with 8 products, and the first page (PR-M8-17); caches the answer in `<runDir>/mockshop.json`. `fillRoute` replaces the three placeholders. Liquid local tier: handles come from the `serveTheme` fixture data instead; read the fixture product, collection and page handles from `ripple-kit/testing` (search the doc 13 4.5 text for the fixture handles) and record which in the done file.
4. `checks.ts` (0.6 and PR-M8-8): `EvalCheck`, `CheckContext` (add the field `baselineDir: string | null`, the directory of 1440 px screenshots of the base state without the overlay, used only by T08), `SkipCheck`, `settled`, `jsOff`, `inheritedChecks`, `compareScreenshots`, `runChecks`. `runChecks` runs each check in order with a fresh browser context, catches `SkipCheck` (adds the id to `skipped`), catches other errors (adds the id to `failed`), skips checks with `rippleOnly` when `ctx.arm === "control"`, and returns `{ passed, applicable, skipped, failed }` (`applicable` excludes skipped). `compareScreenshots` decodes both PNGs in a Playwright page through `<canvas>` and counts differing pixels (PR-M8-8 rule).
5. Gates in `checks.ts`: `gateRenders(ctx)` (each route answers 200 and has a non-empty `body`), `gateNoPageError(ctx)` (no `pageerror` event on any route with JavaScript on), `gateNoSecret(ctx, secrets: string[])` (every response body the browser received on the routes, scanned for each secret, for `/shpat_[a-f0-9]{32}/` and for the private Storefront token of the template's environment).
6. Screenshots and visual checks in `checks.ts`: `takeScreenshots(ctx, task, outDir)` with `reducedMotion: "reduce"`, animations disabled (`page.addStyleTag` with `*{animation:none!important;transition:none!important}`), after `document.fonts.ready`, `fullPage: true`, at the viewports and states of 8.9's first list, named `<route>-<width>x<height>[-nojs].png` and `<screenshot name>-<width>x<height>.png`. `visualFindings(page)` returns one finding per occurrence type per route for the aspect-ratio rule and the clipped-text rule of 8.9 (RP608, RP602, RP609 come from `check --browser`).
7. `run.ts`: step 7 (stop the container is already done; in a fresh container without model access run the project's install; `startApp`; `waitForRoutes` with 120000 ms) and the check part of step 8 (gates, `checks.spec.ts` loaded with `await import(pathToFileURL(<task dir>/checks.spec.ts).href)`, `ripple check --browser --json --url <base>` per route through `cli`, the template's `typecheck` and `build` scripts or, on Liquid, the Theme Check errors in the `check --json` output (`rule` starting `TC:`), `takeScreenshots`, `visualFindings`). The run writes their raw results into the cell directory as `checks.json`; scoring is M8-T24.
8. Tests: `serve: startApp serves a Liquid theme through serveTheme` (copy `test/fixtures/theme-min/` to a temp dir; `/` answers 200); `mockshop: pickCatalogue picks the first matching handles and caches them` (stub `fetchImpl` returning `__fixtures__/mockshop.json`, a hand-made response with three products, of which the second has two variants); `checks: runChecks counts passed, failed, skipped and rippleOnly`; `checks: compareScreenshots passes identical images and fails a 2% change at maxDiffPixelRatio 0.015` (generate PNGs with `page.screenshot` of two small HTML pages); `checks: inheritedChecks returns C0 and CL`.
9. Proof: PLAN 5.0 and EV-2.

### Acceptance

EV-2 commands exit 0. `grep -c "serveTheme" evals/adapters/serve.ts` prints at least `1`; `grep -c "liquid-shim\|renderLiquid" evals/adapters/serve.ts` prints `0`.

### Out of scope

Scores (M8-T24). Judging (M8-T28). Task checks (M8-T31 to M8-T38).

### If blocked

- `ripple-kit/testing` does not export `serveTheme`: stop; the owner is the M0 or M7 task that built `src/testing/index.ts` (doc 13 4.7).
- mock.shop has no pages: PR-M8-17 fallback (`about`).

---

## M8-T24 Eval scoring: `score.ts`, `outside.ts`, `friction.ts`, `report.ts` (weights 35/15/20/10/10/10, pass at 80)

- **Goal:** Turn a cell's raw results into `result.json` (doc 08 8.8), the outside-Ripple measure (8.10), the friction data (8.13) and an invocation report, with tests K-63, K-64 and K-65.
- **Depends on:** M8-T22.
- **Kind:** `eval`. Size M.

### Read first

doc 08: `### 8.8 ` (3.4 kB; extract X-3 instead of reading the JSON), `### 8.10 ` (1.3 kB), `### 8.13 ` the "Friction data" paragraph and list (1 kB), `### 8.12 ` the "Control-arm scoring" paragraph (0.5 kB), `### 8.14 ` the "M4 and M5" item (K-62 scoring rule, 0.4 kB). doc 07 `### 9.4 ` (1.9 kB, the 9.4.1 example). This file 0.6, 0.11.

### Files

Create: `evals/adapters/score.ts`, `score.test.ts`, `outside.ts`, `outside.test.ts`, `friction.ts`, `friction.test.ts`, `report.ts`, `report.test.ts`, `__fixtures__/score-example.json`, `__fixtures__/outside/` (a fixture repository built by the test), `__fixtures__/friction-text.json`, `__fixtures__/friction-json.json`. Change: `evals/adapters/run.ts` (the scoring part of step 8 and step 9 only).

### Steps

1. Branch `task/M8-T24-eval-scoring`.
2. `score.ts` `scoreRun` (0.6): gates first (any `false` gives every score 0 and `passed: false`); the six components of 8.8 with the formulas exactly as the table states; `visual: null` scales the total to `100 x sum / 80` and sets `unjudged: true`; the control arm (`arm === "control"`) excludes checker and adherence and scales the total to 75 points (8.12); `passed` is all gates, total at least 80, functional fraction at least 0.9, zero checker errors (control: gates, scaled total at least 80, fraction at least 0.9). Round each score to one decimal only when writing `result.json`. A reference run (`--reference`) sets adherence and efficiency to full.
3. `outside.ts` `measureOutside` (0.6): the five terms of 8.10 from `git diff --unified=0 <startCommit>` in the workspace plus the rendered HTML strings and the `status --json` value; `total = cssLines + jsLines + 5 x rawInteractive + 2 x arbitraryValues + 10 x modifiedScaffolded`. Also `gateStayedInWorkspace(commands: string[], cwd: string): boolean`: false when a command writes to an absolute path outside `cwd` (redirections `>`/`>>` to such a path, `cp`, `mv`, `tee`, `mkdir`, `touch`, `rm` with such a target; PLAN-CHOSEN list, written in the file).
4. `friction.ts` `extractFriction` (0.6): the regular expression of 8.13 for text diagnostics with the following `found:` line; every tool output that parses as a `Report`; `firstCheck`; `guessed` for RP101, RP102, RP104, RP105, RP111, RP115 as `{ rule, component, prop, found }`; `ruleHits`; from `commands`, the number of `check` and `docs` invocations and `checksUntilClean` (index of the first `check` whose output has zero errors, counted from 1; `null` when none).
5. `report.ts` `writeReport`: per cell and overall: pass rate, mean scores, the 20 most frequent `guessed` tuples with run share, rule hit rates, skills read versus `expectedSkills`, the share of runs that never ran `check`; a header line that states the E-3 sentence of doc 08 8.7 verbatim; tiers reported `skipped` are listed as skipped, never as passed. `report.md` is Markdown; `report.json` holds the same numbers.
6. `run.ts`: the scoring part of step 8 (`measureOutside`, `extractFriction`) and step 9 (`scoreRun`, then write `result.json` with the key order of X-3; copy the transcript; after all cells, `writeReport`).
7. Tests:
   - `score: K-63 the example of 8.8 yields the listed scores and passed false` (`__fixtures__/score-example.json` is X-3 with `scores` and `passed` removed; budgets T02 of 8.11). Expected: functional 31.1, checker 14.5, visual 16.7, adherence 10, build 10, efficiency 10, total 92.3.
   - `score: K-63 changing functional.passed to 9 yields passed true`.
   - `score: a failed gate scores 0`, `score: unjudged scales to 80 points`, `score: control arm scales to 75 points`.
   - `outside: K-64 counts equal hand-computed values for each of the five terms` (the test builds a git repository in a temp dir with a start commit and an end commit containing known CSS, JS, JSX composition lines, one arbitrary-value class; HTML strings with two raw buttons and one Ripple button; a `status` value with one newly modified file; assert each term and `total`).
   - `friction: K-65 both samples give one guessed tuple RP101 button variant outlined` (`friction-text.json` has the 9.4.1 text in one `toolOutputs` entry, written with the command form the doc prints; `friction-json.json` has the same diagnostic as a `--json` `Report`).
   - `report: writeReport aggregates two cells and lists skipped tiers`.
8. Proof: PLAN 5.0 and EV-2.

### Acceptance

EV-2 commands exit 0; the K-63, K-64 and K-65 tests pass.

### Out of scope

The judge (M8-T28; until then `visual` is `null`). Bar conditions (M8-T29). Decision triggers (M8-T30).

### If blocked

K-63 differs at the first decimal: compute without intermediate rounding; when it still differs, the 8.8 example is inconsistent: record the computed values under `## Ledger issues` of doc 08 and make the test use them.

---

## M8-T25 Eval adapter `pi`

- **Goal:** Implement the `pi` adapter of doc 08 8.7 and its transcript test (K-61), including the `pi-package` arm.
- **Depends on:** M8-T22.
- **Kind:** `eval`. Size S.

### Read first

doc 08: `### 8.7 ` (3.4 kB; X-2 is in `types.ts` already), `### 8.5 ` the arms table (0.6 kB). `docs/research/agent-kit-and-distribution.md` section 2.7, the pi part only (search `pi [SRC]`, about 2 kB). This file 0.6, 0.11.

### Files

Create: `evals/adapters/pi.ts`, `evals/adapters/pi.test.ts`, `evals/adapters/__fixtures__/pi.jsonl`, `evals/adapters/__fixtures__/pi.missing-usage.jsonl`.

### Steps

1. Branch `task/M8-T25-adapter-pi`.
2. `run`: `spawnInContainer(["pi", "--mode", "json", "--no-session", "--model", model, ...extraArgs, prompt], { cwd, env, timeoutMs, name })`. Arm `pi-package` adds `-e npm:./vendor/ripple.tgz` (run.ts passes it in `extraArgs`). Save stdout unmodified as `transcript.jsonl` in the cell directory; `transcriptPath` points to it.
3. `parseTranscript`: split strictly on `\n` (not `readline`); ignore empty lines and lines that do not parse (count them in a `// skipped lines` variable, never throw). `turns` = number of `turn_end` records; tokens = sum over assistant `message_end` records of their final `usage` (`input`, `output`, `cacheRead`, `cacheWrite`; a missing field counts 0); `total` = sum of the four; `costUsd` = sum of `usage.cost.total`, or `null` when no record has it; the run ends at `agent_settled`; `toolCalls`, `commands` (shell tool calls), `toolOutputs`, `skillsRead` (skill names whose `.agents/skills/<name>/SKILL.md` path appears in a file-read tool call). Field paths of tool calls inside records are UNVERIFIED: read them from the pi 1.6.0 documentation the research file quotes and write each path as a named constant at the top of the file.
4. Fixtures: `pi.jsonl` is a hand-written stream in the documented record shapes with two turns, one shell call `npx ripple-kit check`, one file read of `.agents/skills/ripple/SKILL.md`, and usage on two `message_end` records; mark it in its first record as `{"type":"comment","text":"synthetic sample written from pi 1.6.0 docs; replace with a recorded stream after M8-T39"}`. `pi.missing-usage.jsonl`: the same without any `usage`.
5. Tests: `pi: K-61 the sample transcript parses to the expected RunResult` (deep-equal to a literal); `pi: K-61 a transcript without usage parses without throwing` (tokens all 0, `costUsd` null); `pi: lines split only on \n` (a record containing ` `).
6. Proof: PLAN 5.0 and EV-2.

### Acceptance

EV-2 commands exit 0; the three tests pass.

### Out of scope

Running pi against a model (M8-T39). Other adapters.

### If blocked

The pi documentation is not reachable: write the record names of 8.7 only, mark every other field path UNVERIFIED in the constants, and record it in the done file; M8-T39 replaces the sample with a recorded stream.

---

## M8-T26 Eval adapter `claude-code`

- **Goal:** Implement the `claude-code` adapter of doc 08 8.7 and its transcript test (K-61).
- **Depends on:** M8-T22.
- **Kind:** `eval`. Size S.

### Read first

doc 08: `### 8.7 ` (3.4 kB). `docs/research/agent-kit-and-distribution.md` section 2.7, the Claude Code part only (about 1.5 kB). This file 0.6, 0.11.

### Files

Create: `evals/adapters/claude-code.ts`, `claude-code.test.ts`, `__fixtures__/claude-code.jsonl`, `__fixtures__/claude-code.missing-usage.jsonl`.

### Steps

1. Branch `task/M8-T26-adapter-claude-code`.
2. Before the run (E-1, the only edit an adapter makes): when the workspace has `AGENTS.md` and no `CLAUDE.md`, write `CLAUDE.md` with the single line `@AGENTS.md`.
3. `run`: `spawnInContainer(["claude", "-p", prompt, "--output-format", "stream-json", "--verbose", "--permission-mode", "bypassPermissions", "--model", model, "--max-budget-usd", String(maxCostUsd), ...extraArgs], ...)`.
4. `parseTranscript`: one JSON object per line; `turns` = number of assistant messages; tokens and cost from the final `result` record, reading `num_turns`, `usage`, `total_cost_usd`, `duration_ms` defensively (missing gives 0 or `null`, never a crash; all four names are UNVERIFIED, 8.7); `skillsRead` from file reads of `.claude/skills/<name>/SKILL.md`; `commands` from shell tool calls; `toolOutputs` from tool results.
5. Fixtures and tests as M8-T25 steps 4 and 5 (synthetic, marked in a first record `{"type":"comment",...}`): `claude-code: K-61 ...` twice, and `claude-code: CLAUDE.md is written only when AGENTS.md exists and CLAUDE.md does not` (call the pre-run function on temp dirs).
6. Proof: PLAN 5.0 and EV-2.

### Acceptance

EV-2 commands exit 0; the three tests pass.

### Out of scope

Running Claude Code (M8-T39).

### If blocked

As M8-T25.

---

## M8-T27 Eval adapter `opencode`

- **Goal:** Port the `opencode` adapter from Hydrogen's `opencode-runner.ts` (doc 08 8.7) with its transcript test (K-61).
- **Depends on:** M8-T22.
- **Kind:** `eval`. Size S.

### Read first

doc 08: `### 8.7 ` (3.4 kB). `../hydrogen/scripts/storefront-benchmark-harness/opencode-runner.ts` (22 kB; the parsing functions and the command line only, about 8 kB) and `opencode-runner.test.ts` (search for the sample stream, about 3 kB). This file 0.6, 0.11, M8-R4.

### Files

Create: `evals/adapters/opencode.ts`, `opencode.test.ts`, `__fixtures__/opencode.jsonl`, `__fixtures__/opencode.missing-usage.jsonl`.

### Steps

1. Branch `task/M8-T27-adapter-opencode`.
2. `run`: `spawnInContainer(["opencode", "run", "--pure", "--format", "json", "--thinking", "--dangerously-skip-permissions", prompt], { env: { ...env, OPENCODE_MODEL: model } ... })`.
3. `parseTranscript`: port the event parsing of `opencode-runner.ts` (turns, tokens, cost, tool calls, shell commands, tool outputs); adapt names to `RunResult`; keep its defensive reads. `skillsRead` from reads of `.agents/skills/<name>/SKILL.md` or `.opencode/skills/<name>/SKILL.md`.
4. Fixtures: copy one sample stream from `opencode-runner.test.ts` into `__fixtures__/opencode.jsonl` (port, M8-R4); the missing-usage sample is the same stream with usage fields removed. Tests: `opencode: K-61 ...` twice.
5. Proof: PLAN 5.0 and EV-2.

### Acceptance

EV-2 commands exit 0; both tests pass.

### Out of scope

The Hydrogen runner's own docker code (M8-T22 already ported the mounts).

### If blocked

`../hydrogen/` is absent: write the adapter from the 8.7 row alone with a synthetic sample (M8-T25 step 4 form) and record it; mark the event names UNVERIFIED.

---

## M8-T28 Eval judge and visual rubric: `judge.ts`, `rubric/visual.md`, `rubric/golden/`

- **Goal:** Implement the visual judge and calibration of doc 08 8.9, write the rubric, and assemble the golden screenshot set.
- **Depends on:** M8-T24.
- **Kind:** `eval`. Size M.

### Read first

doc 08: `### 8.9 ` (4 kB), `### 8.12 ` B-3 row and the `calibration` key of X-4 (0.5 kB). Ledger Q14 (search `| Q14 |`). This file 0.6, 0.11, PR-M8-11.

### Files

Create: `evals/adapters/judge.ts`, `judge.test.ts`, `__fixtures__/judge-answers.json`, `evals/rubric/visual.md`, `evals/rubric/golden/*.png`, `evals/rubric/golden/ratings.json`. Change: `evals/adapters/run.ts` (`--judge` in step 8, `--calibrate` mode).

### Steps

1. Branch `task/M8-T28-eval-judge`.
2. `evals/rubric/visual.md`: the nine-criterion table of 8.9 copied byte for byte, then one `## <key>` section per criterion with five paragraphs headed `0`, `1`, `2`, `3`, `4`. Paragraphs 0, 2, 4 restate the table's anchors; 1 and 3 are the midpoints ("poor", "good"); 4 also says "indistinguishable in quality from the reference blueprint".
3. `judge.ts` `judgeRun` (0.6): procedure 8.9 steps 1 to 3 literally: temperature 0; input `visual.md`, the prompt and the screenshots only; JSON output with the nine keys; at most two retries for invalid JSON, then `null`; the pairwise cap per criterion against the reference solution's screenshot of the same route and viewport (order randomised with a seed recorded in the cell directory; labels A and B); three judgements, median per criterion. Transport: PR-M8-11 (`fetchImpl` injectable).
4. `calibrate` (8.9 step 4): judge each golden screenshot (single judgement, no pairwise), compute Spearman correlation and mean absolute error over all (file, criterion) pairs against `ratings.json`; `passed` is Spearman at least 0.7 and MAE at most 0.75. `run.ts --calibrate`: prints the two numbers and `calibration: passed` or `calibration: failed`; exits 0 or 1; when fewer than 30 rated screenshots exist it prints `error: golden set has <n> rated screenshots; at least 30 are needed` and exits 2. It never writes `bar.json` (M8-T42 does).
5. `rubric/golden/`: at least 30 PNG screenshots taken by `takeScreenshots` (M8-T23) of the reference solutions that exist and of the four examples, file names `<source>-<route>-<viewport>.png`. `ratings.json` is `[]` until people rate them: the ratings are human input (8.9 step 4, ledger Q14) that this task cannot produce. Record `BLOCKED-ON-BEN: golden ratings (ledger Q14)` in the done file.
6. Until a calibration has passed, `report.ts` labels visual scores `uncalibrated` (add only that label).
7. Tests (stub `fetchImpl` returning `__fixtures__/judge-answers.json` answers): `judge: three judgements give the median per criterion`, `judge: invalid JSON is retried twice then discarded`, `judge: a "no" in the pairwise question caps the criterion at 2 and lists it in capped`, `judge: calibrate computes Spearman and MAE` (a hand-computed case of 4 files), `judge: the judge input contains no code, arm or adapter name`.
8. Proof: PLAN 5.0 and EV-2.

### Acceptance

EV-2 commands exit 0; the five tests pass. `ls evals/rubric/golden/*.png | wc -l` prints at least `30`. `node evals/adapters/run.ts --calibrate; echo $?` prints the "rated screenshots" error and `2` while `ratings.json` is `[]`.

### Out of scope

Rating the golden set and writing the calibration into `bar.json` (M8-T42). Ben's sign-off of the default look (ledger Q14).

### If blocked

Fewer than 30 screenshots can be taken because few references exist yet: take the examples' screenshots at all three viewports for every route (4 hosts x 7 routes x 3 viewports is more than 30).

---

## M8-T29 Eval budgets and bar: `freeze-budgets.ts`, `rubric/bar.json`, the `--bar` run

- **Goal:** Add the budget freeze script, `bar.json`, and the `--bar` run that evaluates B-1 to B-8, with test K-68.
- **Depends on:** M8-T24.
- **Kind:** `eval`. Size S.

### Read first

doc 08: `### 8.11 ` (1.3 kB), `### 8.12 ` (2.9 kB). This file 0.3 (X-4), 0.6, 0.11.

### Files

Create: `evals/adapters/freeze-budgets.ts`, `freeze-budgets.test.ts`, `evals/rubric/bar.json`, `evals/adapters/bar.test.ts`. Change: `evals/adapters/run.ts` (`--bar` mode, `evaluateBar`).

### Steps

1. Branch `task/M8-T29-eval-bar`.
2. `evals/rubric/bar.json`: extract X-4 to that path (the extractor writes the file; do not retype).
3. `freezeBudgets(runDir)`: over every `result.json` in `runDir` with `arm: "ripple"`, `adapter: "pi"`, `model` equal to `agentModel`, `passed: true`, group by task; require at least 10 passing runs per task (else throw `Error("<task>: <n> passing runs; 10 needed")`); median of `efficiency.turns`, `efficiency.tokens`, `outside.total`; multiply by 1.25; round up (turns and outside to an integer, tokens to a multiple of 100,000). The CLI form writes each value into `evals/tasks/<id>/task.json` (`modifiedScaffolded` unchanged) with `frozen: true`, keeping the file's key order, and prints one line per task.
4. `run.ts --bar` (PR-M8-18): read `bar.json`; for each of `weakModel` and `judgeModel` that is `null`, print `bar.json: <key> is not set` to standard error and exit 2 (8.12, K-68), before any build. Otherwise run, in one invocation: the 25 cells of 8.12 with `runsPerCell` runs, judged; the control arm on the six tasks of B-6 with 5 runs each; the weak-model arm on the 25 cells with 3 runs each; the live tier for B-8 only when a preview store is configured. `evaluateBar(runDir, bar)` computes B-1 to B-8 exactly as the 8.12 table states (B-8 `blocked` without a store) and `report.ts` prints them.
5. Tests: `freeze-budgets: medians are multiplied by 1.25 and rounded up` (synthetic results), `freeze-budgets: fewer than 10 passing runs throws`, `bar: K-68 --bar with a null model key exits 2 with the stated message` (run `main(["--bar"])` with a temp copy of `bar.json`; inject its path through the environment variable `RIPPLE_EVAL_BAR` (PLAN-CHOSEN, test only)), `bar: evaluateBar computes B-1 to B-7 on synthetic results and reports B-8 blocked`.
6. Proof: PLAN 5.0 and EV-2.

### Acceptance

EV-2 commands exit 0; the four tests pass. `node evals/adapters/run.ts --bar; echo $?` prints `bar.json: weakModel is not set`, `bar.json: judgeModel is not set` and `2`.

### Out of scope

Freezing budgets and running the bar for real (M8-T42).

### If blocked

None expected.

---

## M8-T30 Eval canary skill `evals/adapters/canary/SKILL.md` and `rubric/api-decisions.md` (gates G-1 to G-7)

- **Goal:** Add the skill-discovery canary (8.4 step 6, K-67), the decision log file, and the computation of the G-1 to G-6 triggers in the report.
- **Depends on:** M8-T24.
- **Kind:** `eval`. Size S.

### Read first

doc 08: `### 8.4 ` step 6 (0.4 kB), `### 8.13 ` (5.1 kB). `../hydrogen/scripts/storefront-benchmark-harness/workspace-template/.opencode/skills/benchmark-canary/SKILL.md` (0.3 kB, for the format). This file 0.6, 0.11.

### Files

Create: `evals/adapters/canary/SKILL.md`, `evals/adapters/canary.test.ts`, `evals/rubric/api-decisions.md`. Change: `evals/adapters/run.ts` (step 6 only), `evals/adapters/report.ts` (add `decisionTriggers` only).

### Steps

1. Branch `task/M8-T30-eval-canary`.
2. `canary/SKILL.md`: frontmatter `name: benchmark-canary` and a one-line `description` that starts "Answers questions about the ripple canary phrase. Use when asked which skill contains a phrase."; body: one sentence containing the phrase `ripple canary`.
3. `run.ts` step 6: in the first run of an invocation only (not in `--reference` mode), build a temp workspace holding `canary/SKILL.md` at `.claude/skills/benchmark-canary/SKILL.md`, `.agents/skills/benchmark-canary/SKILL.md` and `.opencode/skills/benchmark-canary/SKILL.md` (PLAN-CHOSEN: every harness's skill directory), run the adapter with the exact prompt of 8.4 step 6, and when the final answer (the last assistant text in `toolOutputs`/transcript as the adapter exposes it; add `finalText: string` to the adapter result only when no field carries it, and record it) does not contain `benchmark-canary`, abort the invocation with `skill discovery is not working in <adapter>` on standard error and exit 1.
4. `evals/rubric/api-decisions.md`: a first line `# API decisions`, one paragraph stating the entry format, and the fenced entry template of 8.13 copied byte for byte; no entries yet.
5. `report.ts` `decisionTriggers(results)`: G-1 (guessed tuple share), G-2 (outside median over budget; the "two consecutive invocations" half reads the previous `report.json` path given by `--previous <dir>` when present), G-3, G-4, G-5, G-6, each only when every cell has at least 10 runs (8.13); `report.md` lists triggered rules with their metric; G-7 is a merge rule and is not computed.
6. Tests: `canary: K-67 a stub adapter that cannot see skills aborts the invocation with the stated message` (inject a stub adapter through `main`'s optional second argument `{ adapters?: Record<string, HarnessAdapter> }`, PLAN-CHOSEN); `canary: a stub adapter that answers benchmark-canary continues`; `report: decisionTriggers fires G-1 at 30 percent of a cell and stays silent below 10 runs per cell`.
7. Proof: PLAN 5.0 and EV-2.

### Acceptance

EV-2 commands exit 0; the three tests pass. `grep -c "ripple canary" evals/adapters/canary/SKILL.md` prints at least `1`.

### Out of scope

Opening decision entries (people do it from report data). The A/B protocol runs.

### If blocked

None expected.

---

## M8-T31 Eval task group T01 (home), T02 (product page): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/`

- **Goal:** Create the task files and passing reference solutions of T01 and T02.
- **Depends on:** M7-T29, M8-T23. Also 0.7: M8-T24 and the templates.
- **Kind:** `eval`. Size M.

### Read first

doc 08: `### 8.2 ` (X-1 is in `types.ts`), `### 8.5 ` (3.2 kB), `### 8.6 ` the first three paragraphs and the paragraphs `**T01 home**` and `**T02 product page**` (2 kB), `### 8.11 ` rows T01, T02, `### 4.4 ` (for `expectedSkills`). This file 0.6, 0.11 (EV-6 to EV-9).

### Files

Create: `evals/tasks/T01/{task.json,checks.spec.ts}`, `evals/tasks/T01/reference/{react,remix,liquid}/**`, `evals/tasks/T02/{task.json,checks.spec.ts}`, `evals/tasks/T02/reference/{react,remix,liquid}/**`. No `start/` (neither task has an overlay).

### Steps

1. Branch `task/M8-T31-eval-T01-T02`.
2. `task.json` per EV-8: T01 `{ id: "T01", slug: "home", set: "core", hosts: ["react","remix","liquid"], start: { base: "template" }, routes: { home: "/" } ... }`; T02 `slug: "product"`, `start: { base: "initialised" }`, `routes: { product: "/products/{product}", cart: "/cart" }`, `screenshots: [{ name: "second-variant", route: "/products/{product}", steps: "secondVariant" }]`. `expectedSkills` from 8.6. `budgets` from 8.11. `codeDirs` from EV-9. Validate both with `validateTask` in a one-off `node -e`.
3. `checks.spec.ts` for each: one `EvalCheck` per check of 8.6 with ids `T01-C1` to `T01-C7` and `T02-C1` to `T02-C8`, each implementing the sentence of 8.6 literally. `T01-C1` (`status --json` exits 0) has `rippleOnly: true` (8.12). "JS off" uses `jsOff`; "settles" uses `settled`. T02 exports `async function secondVariant(page)` (choose the second value of the first option, as in C1). `T02-C6` uses a `MutationObserver` installed with `page.addInitScript` before C5's click.
4. References: for each host, build the start state with `buildWorkspace` (run.ts `--reference` does the same) into a temp dir, then do the task by hand with the CLI: T01: `init`, `add --blueprint layout`, `add --blueprint home`, then wire the featured products to the store data; T02: `add --blueprint product`. Copy every file that differs from the base state into `reference/<host>/` (EV-8).
5. `pnpm eval -- --reference --tasks T01,T02 --hosts react,remix,liquid`; iterate until every reference passes all applicable checks with zero checker errors, passes the gates and has `scores.total` at least 95.
6. Proof: PLAN 5.0 and EV-2; paste the reference report table into the pull request.

### Acceptance

`node -e` validation of both `task.json` files returns no message. The `--reference` run prints a pass for all six cells with total at least 95. `grep -c '"prompt"' evals/tasks/T01/task.json` prints `1` and the prompt is byte-equal to 8.6 (`node -e` comparison against the extracted 8.6 line: the text between the backticks after `Prompt: ` in the T01 paragraph).

### Out of scope

Agent runs (M8-T39). Other tasks.

### If blocked

- A check cannot pass on the local Liquid tier because the shim lacks the feature: throw `SkipCheck("<reason>")` when `ctx.tier === "local"` and list the check in the done file (8.3 allows it; the live tier runs it).
- mock.shop is unreachable: the npm-host references cannot be scored; open a draft pull request marked BLOCKED-ON-ENV (PLAN 4.3).

---

## M8-T32 Eval task group T08 (fix), T09 (upgrade): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/`

- **Goal:** Create T08 and T09 with their seeded and previous-package start states, passing references, and tests K-35 and K-66.
- **Depends on:** M7-T29, M8-T23. Also 0.7: M8-T24 and the templates.
- **Kind:** `eval`. Size M.

### Read first

doc 08: `### 8.5 ` (3.2 kB), `### 8.6 ` the first three paragraphs and the paragraphs `**T08 fix**` and `**T09 upgrade**` (2.8 kB), `### 8.11 ` rows T08, T09, `### 5.6 ` row K-35, `### 8.15 ` row K-66. doc 07 `### 9.3 ` the `Report` declaration (search `interface Report`). doc 03 `### 7.4 ` the Button CSS root rule (search `--_hover: 88%;` and read the enclosing rule, about 1 kB). This file 0.6, 0.11, PR-M8-7, PR-M8-13.

### Files

Create: `evals/tasks/T08/{task.json,checks.spec.ts}`, `evals/tasks/T08/start/{react,liquid}/**`, `evals/tasks/T08/reference/{react,liquid}/**`, `evals/tasks/T09/{task.json,checks.spec.ts}`, `evals/tasks/T09/prev/**`, `evals/tasks/T09/start/{react,liquid}/**`, `evals/tasks/T09/reference/{react,liquid}/**`. Change: `evals/adapters/workspace.ts` (the T09 previous-package path only), `evals/adapters/workspace.test.ts` (K-35/K-66 test).

### Steps

1. Branch `task/M8-T32-eval-T08-T09`.
2. T08 `task.json`: `start: { base: "reference", overlay: true }`, hosts `react`, `liquid`, routes `home`, `product`, `cart` (`/`, `/products/{product}`, `/cart`).
3. T08 `start/<host>/`: seed exactly the ten rows of the 8.6 table, one per row, each in a different file where possible (row 6 is RP306 on liquid and RP320 on react). Each seeded file is a copy of the `examples/<host>/` file with the one change.
4. T08 checks: `T08-C1` to `T08-C4`. C2 re-runs `T02-C4`, `T02-C5`, `T03-C2`, `T03-C7` by importing those checks from `../T02/checks.spec.ts` and `../T03/checks.spec.ts` (when T03 does not exist yet, C2 throws `SkipCheck("T03 checks not written yet")` for the two T03 checks; M8-T33 removes that branch). C3 uses `compareScreenshots` with `maxDiffPixelRatio: 0.015`, `threshold: 0.1` against `ctx.baselineDir` (PR-M8-8). `run.ts` fills `baselineDir` for T08 by building the base state without the overlay and taking the 1440 px screenshots once per invocation (add this to step 2 of `run.ts`, only when `task.id === "T08"`; PLAN-CHOSEN).
5. K-35 and K-66 (PR-M8-7), in `evals/adapters/workspace.test.ts`: `workspace: K-66 the T08 start state gives K-35 on react and liquid`: `buildWorkspace` for T08 on each host with the real tarball (`pnpm build` then `npm pack` in `pkg/` to a temp dir), then `cli(["check", "--json"])`: valid JSON of the `Report` shape, `counts.error` 9, `counts.warning` 1, the rule ids are those of the T08 table, the two RP113 problems end with `[variant-picker-outside-form]` and `[dialog-needs-title]`. The test needs the network (package install): it runs only when `RIPPLE_NETWORK=1` and otherwise skips with the reason `K-66 needs RIPPLE_NETWORK=1` (an exception to EV-3, recorded here).
6. T09 `prev/` (PR-M8-13): `prev/components/button/button.css` is the current `components/button/button.css` with the line `    --_hover: 88%;` replaced by `    --_hover: 90%;` (confirm the line occurs once: `grep -c "^    --_hover: 88%;$" components/button/button.css` prints `1`; adjust only the indentation if it differs). `prev/components/card/card.css` is the current `components/card/card.css` with the value of the first `--` custom property declaration inside the `.rp-card {` rule replaced by `inherit`. Both files are complete copies.
7. T09 previous package in `workspace.ts`: when `task.id === "T09"`, build `ripple-prev.tgz` once per invocation: copy the repository (excluding `node_modules/`, `pkg/`, `evals/runs/`, `.git/`) to a temp dir, replace `VERSION` in `src/identity.ts` by `"0.0.9"`, copy `evals/tasks/T09/prev/` over it, run `pnpm install --frozen-lockfile && pnpm build`, `npm pack` in its `pkg/`. Scaffold the workspace from `ripple-prev.tgz` (the `reference` state's `examples/<host>/` copy, then `cli(["add", "--all", "--force"])` and `cli(["add", "--blueprint", "<id>", "--force"])` for each blueprint, so every trailer names 0.0.9; then `skills sync`), then copy the current tarball to `vendor/ripple.tgz`, then apply the two local edits: Button CSS gets the declaration `letter-spacing: 0.02em;` as the last declaration of its base rule; Card CSS changes the same line step 6 changed to the value `unset`. The edits are written as `start/<host>/` overlay files (the edited Button and Card CSS at the host's paths) so that they are reviewable. When `add --force` is not a CLI option, use the option doc 07 7.5 gives for replacing installed files and record it.
8. T09 checks `T09-C1` to `T09-C6` as 8.6. Reference: run `upgrade` with the current package in a built start state, resolve the Card conflict keeping the new version's line, keep the Button edit, run `skills sync`; copy the changed files.
9. `pnpm eval -- --reference --tasks T08,T09 --hosts react,liquid` until all four cells pass with total at least 95.
10. Proof: PLAN 5.0 and EV-2; `RIPPLE_NETWORK=1 node --test evals/adapters/workspace.test.ts` output in the pull request.

### Acceptance

The four reference cells pass with total at least 95. With `RIPPLE_NETWORK=1`, the K-66 test passes.

### Out of scope

The T02 and T03 checks themselves (M8-T31, M8-T33).

### If blocked

- K-35 counts differ: a seed triggers a second rule or none; change the seed (never the counts) and re-run. Report when a row of the T08 table cannot produce exactly its rule.
- The previous-package build fails because the temporary copy needs `examples:install`: run `pnpm examples:install` in the copy too.

---

## M8-T33 Eval task group T03 (cart), T04 (collection): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/`

- **Goal:** Create T03 and T04 with passing references.
- **Depends on:** M7-T29, M8-T23. Also 0.7: M8-T24 and the templates; M8-T31 (T03 starts after T02).
- **Kind:** `eval`. Size M.

### Read first

doc 08: `### 8.5 ` (3.2 kB), `### 8.6 ` the first three paragraphs and the paragraphs `**T03 cart**` and `**T04 collection**` (3 kB), `### 8.11 ` rows T03, T04. `docs/blueprints/layout.md` `### Structure` only the Header call and the CartDrawer call (search `cartDrawer`, about 1 kB). This file 0.6, 0.11.

### Files

Create: `evals/tasks/T03/{task.json,checks.spec.ts}`, `evals/tasks/T03/start/{react,remix,liquid}/**`, `evals/tasks/T03/reference/{react,remix,liquid}/**`, `evals/tasks/T04/{task.json,checks.spec.ts}`, `evals/tasks/T04/reference/{react,remix,liquid}/**`. Change: `evals/tasks/T08/checks.spec.ts` (remove the T03 `SkipCheck` branch of M8-T32 step 4, only when it exists).

### Steps

1. Branch `task/M8-T33-eval-T03-T04`.
2. T03: `start: { base: "initialised", after: "T02", overlay: true }`; `start/<host>/` holds the layout file of the `initialised` state with the CartDrawer call removed and the Header called without `cartDrawer` (the cart link then navigates to `/cart`). Checks `T03-C1` to `T03-C11` with the ids exactly as 8.6 prints them (EV-7); `T03-C6` and `T03-C9` are `rippleOnly` (8.12).
3. T04: `start: { base: "initialised" }`; checks as 8.6.
4. References (EV-8): T03 includes the T02 reference files (cumulative, EV-8) and restores the CartDrawer; T04 is `add --blueprint collection` plus wiring.
5. `pnpm eval -- --reference --tasks T03,T04 --hosts react,remix,liquid` until all six cells pass with total at least 95. Then re-run `--reference --tasks T08` to confirm T08-C2 still passes.
6. Proof: PLAN 5.0 and EV-2.

### Acceptance

The six cells pass with total at least 95; T08 still passes.

### Out of scope

Other tasks.

### If blocked

As M8-T31.

---

## M8-T34 Eval task group T05 (search), T16 (chrome): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/`

- **Goal:** Create T05 and T16 with their overlays and passing references.
- **Depends on:** M7-T29, M8-T23. Also 0.7: M8-T24 and the templates.
- **Kind:** `eval`. Size M.

### Read first

doc 08: `### 8.5 ` (3.2 kB), `### 8.6 ` the first three paragraphs and the paragraphs `**T05 search**` and `**T16 chrome**` (1.8 kB), `### 8.11 ` rows T05, T16. `docs/blueprints/layout.md` the Header call (`searchDialog`), the AnnouncementBar call and the Footer call (search each, about 1.5 kB). This file 0.6, 0.11.

### Files

Create: `evals/tasks/T05/{task.json,checks.spec.ts}`, `evals/tasks/T05/start/{react,remix}/**`, `evals/tasks/T05/reference/{react,remix}/**`, `evals/tasks/T16/{task.json,checks.spec.ts}`, `evals/tasks/T16/start/{react,liquid}/**`, `evals/tasks/T16/reference/{react,liquid}/**`.

### Steps

1. Branch `task/M8-T34-eval-T05-T16`.
2. T05: `set: "extended"`, hosts `react`, `remix`; overlay: the layout file without the search Dialog and its PredictiveSearch and with the Header called without `searchDialog`.
3. T16: `set: "extended"`, hosts `react`, `liquid`; overlay: the layout file without the AnnouncementBar and with the Footer called with a body that holds only its LinkList (id `footer-menu`), so no NewsletterForm is printed.
4. Checks per 8.6; references per EV-8.
5. `pnpm eval -- --reference --tasks T05,T16 --hosts react,remix,liquid` until all four cells pass with total at least 95.
6. Proof: PLAN 5.0 and EV-2.

### Acceptance

The four cells pass with total at least 95.

### Out of scope

Other tasks.

### If blocked

As M8-T31.

---

## M8-T35 Eval task group T06 (restyle), T07 (new section), T15 (escape hatch): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/`

- **Goal:** Create T06, T07 and T15 with passing references.
- **Depends on:** M7-T29, M8-T23. Also 0.7: M8-T24 and the templates.
- **Kind:** `eval`. Size M.

### Read first

doc 08: `### 8.5 ` (3.2 kB), `### 8.6 ` the first three paragraphs and the paragraphs `**T06 restyle**`, `**T07 new section**`, `**T15 escape hatch**` (2.6 kB), `### 8.11 ` rows T06, T07, T15. This file 0.6, 0.11.

### Files

Create: `evals/tasks/{T06,T07,T15}/{task.json,checks.spec.ts}` and `evals/tasks/T06/reference/{react,liquid}/**`, `evals/tasks/T07/reference/{react,remix,liquid}/**`, `evals/tasks/T15/reference/{react,liquid}/**`.

### Steps

1. Branch `task/M8-T35-eval-T06-T07-T15`.
2. All three: `start: { base: "reference" }`. T06 `budgets.modifiedScaffolded` is `0` (8.11); T15 `budgets.outside` is `120`; T15 `set: "extended"`.
3. Checks per 8.6; `T07-C1` and `T07-C6` are `rippleOnly` (8.12).
4. References per EV-8: T06 changes tokens only (no scaffolded file modified); T07 adds a section from Ripple components; T15 builds the size-chart table with project CSS and tokens.
5. `pnpm eval -- --reference --tasks T06,T07,T15 --hosts react,remix,liquid` until all seven cells pass with total at least 95.
6. Proof: PLAN 5.0 and EV-2.

### Acceptance

The seven cells pass with total at least 95. The T06 references give `outside.modifiedScaffolded` 0.

### Out of scope

Other tasks.

### If blocked

As M8-T31.

---

## M8-T36 Eval task group T10 (dialog and accordion), T17 (agent ready): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/`

- **Goal:** Create T10 and T17 with passing references.
- **Depends on:** M7-T29, M8-T23. Also 0.7: M8-T24 and the templates; M8-T31 (T10 after T02); M8-T33 (T17 after T03).
- **Kind:** `eval`. Size M.

### Read first

doc 08: `### 8.5 ` (3.2 kB), `### 8.6 ` the first three paragraphs and the paragraphs `**T10 dialog and accordion**` and `**T17 agent ready**` (2.1 kB), `### 8.11 ` rows T10, T17, `### 7.4 ` (X-7). This file 0.6, 0.11.

### Files

Create: `evals/tasks/{T10,T17}/{task.json,checks.spec.ts}`, `evals/tasks/T10/reference/{react,remix,liquid}/**`, `evals/tasks/T17/reference/react/**`.

### Steps

1. Branch `task/M8-T36-eval-T10-T17`.
2. T10: `start: { base: "initialised", after: "T02" }`; `expectedSkills` `["ripple", "ripple-compose-page", "<host skill>"]` cannot vary per host in one `task.json`: write `["ripple", "ripple-compose-page"]` and record in the done file that the host skill of 8.6 ("and the host skill") is reported by `report.ts` as read or not, but not expected (PLAN-CHOSEN; doc 08 8.2 has one `expectedSkills` per task).
3. T17: `set: "extended"`, hosts `react`, `start: { base: "initialised", after: "T03" }` (T03's reference is cumulative, EV-8).
4. Checks per 8.6; references per EV-8 (T17 loads the bridge with the react form of X-7).
5. `pnpm eval -- --reference --tasks T10,T17 --hosts react,remix,liquid` until all four cells pass with total at least 95.
6. Proof: PLAN 5.0 and EV-2.

### Acceptance

The four cells pass with total at least 95.

### Out of scope

Other tasks.

### If blocked

As M8-T31.

---

## M8-T37 Eval task group T11 (Liquid dialect), T12 (Liquid cart): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/`

- **Goal:** Create the two Liquid-only tasks T11 and T12 with passing local-tier references.
- **Depends on:** M7-T29, M8-T23. Also 0.7: M8-T24 and the Liquid template.
- **Kind:** `eval`. Size M.

### Read first

doc 08: `### 8.3 ` (1.5 kB), `### 8.5 ` (3.2 kB), `### 8.6 ` the first three paragraphs and the paragraphs `**T11 Liquid dialect**` and `**T12 Liquid cart**` (2.4 kB), `### 8.11 ` rows T11, T12, `### 3.4 ` row K-15. This file 0.6, 0.11.

### Files

Create: `evals/tasks/{T11,T12}/{task.json,checks.spec.ts}`, `evals/tasks/T12/start/liquid/**`, `evals/tasks/T11/reference/liquid/**`, `evals/tasks/T12/reference/liquid/**`.

### Steps

1. Branch `task/M8-T37-eval-T11-T12`.
2. T11: `set: "core"`, hosts `["liquid"]`, `start: { base: "liquid-theme" }`. T12: `set: "extended"`, `start: { base: "liquid-theme", overlay: true }`; overlay: `templates/cart.liquid` emptied (a file with no content) and the layout without the CartDrawer.
3. Checks per 8.6. A check that needs the platform (a real store) throws `SkipCheck` on the local tier (8.3) with its reason; list each in the done file (the live tier is M10).
4. References per EV-8.
5. `pnpm eval -- --reference --tasks T11,T12 --hosts liquid` until both cells pass with total at least 95.
6. K-15: add to the done file the command that measures it once model access exists: `pnpm eval -- --tasks T11 --hosts liquid --arm no-skills --runs 5` (recorded, not gating).
7. Proof: PLAN 5.0 and EV-2.

### Acceptance

Both cells pass with total at least 95 on the local tier.

### Out of scope

The live tier (M10).

### If blocked

As M8-T31.

---

## M8-T38 Eval task group T13 (plain HTML), T14 (markets): `task.json`, `checks.spec.ts`, `start/<host>/`, `reference/<host>/`

- **Goal:** Create T13 and T14 with passing references.
- **Depends on:** M7-T29, M8-T23. Also 0.7: M8-T24 and the html and react templates.
- **Kind:** `eval`. Size M.

### Read first

doc 08: `### 8.5 ` (3.2 kB), `### 8.6 ` the first three paragraphs and the paragraphs `**T13 plain HTML**` and `**T14 markets**` (1.6 kB), `### 8.11 ` rows T13, T14. This file 0.6, 0.11.

### Files

Create: `evals/tasks/{T13,T14}/{task.json,checks.spec.ts}`, `evals/tasks/T13/reference/html/**`, `evals/tasks/T14/reference/react/**`.

### Steps

1. Branch `task/M8-T38-eval-T13-T14`.
2. T13: `set: "extended"`, hosts `["html"]`, `start: { base: "template" }`. T14: `set: "extended"`, hosts `["react"]`, `start: { base: "reference" }`.
3. Checks per 8.6; references per EV-8 (T13 with `init`, `add --blueprint` on the `html` host).
4. `pnpm eval -- --reference --tasks T13,T14 --hosts html,react` until both cells pass with total at least 95.
5. Proof: PLAN 5.0 and EV-2.

### Acceptance

Both cells pass with total at least 95.

### Out of scope

Other tasks.

### If blocked

As M8-T31.

---

## M8-T39 Eval gate E1: baseline run of T01, T02, T08 on `react` and `liquid` (local tier); results in `docs/research/spikes/evals-baseline/README.md`. **BLOCKED-ON-BEN (model access)**

- **Goal:** Run the first agent baseline (doc 08 8.14 "M3" item, gate E1 of PLAN 4.2) and commit its results.
- **Depends on:** M8-T24, M8-T25, M8-T26, M8-T31, M8-T32. Waits for `docs/plan/done/BEN-eval-access.md` (PLAN 4.3).
- **Kind:** `gate`. Size S.

### Read first

doc 08: `### 8.4 ` (2.5 kB), `### 8.14 ` the "M3" item (0.5 kB), `### 8.13 ` the decision-rules table header row (0.3 kB). PLAN 3.4 (report form) and the E1 row of PLAN 4.2. This file 0.11.

### Files

Create: `docs/research/spikes/evals-baseline/README.md`, `docs/plan/done/M8-T39.md`. Change (only when step 4 records a recorded stream): `evals/adapters/__fixtures__/pi.jsonl`, `claude-code.jsonl`.

### Steps

1. Branch `task/M8-T39-eval-baseline`. Confirm `docs/plan/done/BEN-eval-access.md` exists and `RIPPLE_EVAL_API_KEY` is set in the session (`test -n "$RIPPLE_EVAL_API_KEY" && echo set`); never print the key.
2. `pnpm eval -- --tasks T01,T02,T08 --hosts react,liquid --adapter pi --arm ripple --runs 1 --out evals/runs/e1-pi`.
3. `pnpm eval -- --tasks T01,T02,T08 --hosts react,liquid --adapter claude-code --arm ripple --runs 1 --out evals/runs/e1-claude-code`.
4. Replace the synthetic samples of M8-T25 and M8-T26 by the first 200 lines of one real transcript each, with every secret removed and file contents shortened to `"<omitted>"`; update the expected `RunResult` literals in the two tests to match. EV-2 MUST still pass.
5. `README.md` in the PLAN 3.4 form: question ("Does the harness run end to end, and what do T01, T02, T08 score unjudged?"), procedure, the two commands, a table per adapter (task, host, gates, functional, checker, adherence, build, efficiency, total, passed), harness problems found, the top `guessed` tuples, and verdict `BASELINE RECORDED` (no threshold applies, 8.14). Rules G-1 to G-5 need at least 10 runs per cell, so no decision is opened; say so.
6. Done file: first line `E1: PASS` when both commands completed every cell (a cell with score 0 still completes); list the run ids.

### Acceptance

Both run directories hold 6 `result.json` files each. The README exists with both tables. EV-2 passes.

### Out of scope

Thresholds. Judging. Fixing API friction (decisions follow 8.13).

### If blocked

- Model access absent: do not start (PLAN 4.3).
- A harness failure stops a cell: fix the harness in this pull request only when the fix is under 30 lines and in one module; otherwise record it, name the owning task (M8-T22 to M8-T27), and write `E1: FAIL` with the failing step.

---

## M8-T40 Eval gate E2: every reference solution passes with at least 95 (K-62)

- **Goal:** Prove that the reference solutions of T01 to T17 all pass (K-62) and that the eval acceptance list K-60 to K-69 holds.
- **Depends on:** M8-T24, M8-T31 to M8-T38.
- **Kind:** `gate`. Size S. No source change.

### Read first

doc 08 `### 8.15 ` (1.6 kB). PLAN 3.5 and the E2 row of PLAN 4.2. This file 0.11.

### Files

Create: `docs/plan/done/M8-T40.md`. Change nothing else.

### Steps

1. Branch `task/M8-T40-eval-references`.
2. `ls evals/tasks/` prints exactly `T01` to `T17` (K-60). For each, `node --input-type=module -e` with `validateTask` prints no message, and `prompt` equals the 8.6 text (the comparison of M8-T31's acceptance, for all 17).
3. `pnpm build && pnpm --dir evals/adapters install --frozen-lockfile && node --test evals/adapters/*.test.ts` exits 0 (K-61, K-63, K-64, K-65, K-67, K-68, K-69).
4. `RIPPLE_NETWORK=1 node --test evals/adapters/workspace.test.ts` passes K-66 (and so K-35).
5. `pnpm eval -- --reference --tasks all --hosts all --out evals/runs/e2`. Every cell: all gates pass, every applicable check passes, zero checker errors, total at least 95 (K-62). Skipped checks are listed with reasons.
6. Done file: first line `E2: PASS`; the per-cell table (task, host, total, skipped checks); the commands with their exit codes.

### Acceptance

Steps 2 to 5 give the stated results; the done file's first line is `E2: PASS`.

### Out of scope

Fixing references (each task group owns its own).

### If blocked

Any cell fails: write `E2: FAIL` with the cell, name the owning task (T01, T02: M8-T31; T08, T09: M8-T32; T03, T04: M8-T33; T05, T16: M8-T34; T06, T07, T15: M8-T35; T10, T17: M8-T36; T11, T12: M8-T37; T13, T14: M8-T38), open a draft pull request, stop.

---

## M8-T41 Nightly CI job `evals`. **BLOCKED-ON-BEN (model access)**

- **Goal:** Add the `evals` job of doc 08 8.14 to `.github/workflows/nightly.yml`.
- **Depends on:** M8-T39. Waits for `docs/plan/done/BEN-eval-access.md` (PLAN 4.3).
- **Kind:** `infra`. Size S.

### Read first

doc 08 `### 8.14 ` the "Nightly job" item (1.3 kB). doc 13 `### 17.4 ` rule CI-8 (0.3 kB). This file 0.3 (X-5, X-8).

### Files

Change: `.github/workflows/nightly.yml`.

### Steps

1. Branch `task/M8-T41-nightly-evals`.
2. Extract X-8 to `node_modules/.cache/ripple/nightly.yml` and X-5 to `node_modules/.cache/ripple/evals-job.yml`. `cmp node_modules/.cache/ripple/nightly.yml .github/workflows/nightly.yml` MUST report no difference (the file is still the doc 13 text); when it differs, stop.
3. `cat node_modules/.cache/ripple/nightly.yml node_modules/.cache/ripple/evals-job.yml > .github/workflows/nightly.yml` (the job is indented two spaces under `jobs:`, which is the last top-level key of X-8; confirm with `tail -n 20 node_modules/.cache/ripple/nightly.yml` that the last lines belong to a job under `jobs:`).
4. `grep -c "^  evals:" .github/workflows/nightly.yml` prints `1`; `grep -c "^jobs:" .github/workflows/nightly.yml` prints `1`.
5. Proof: PLAN 5.0. Trigger the workflow once by `workflow_dispatch` when the session can (`gh workflow run nightly.yml`), and paste the `evals` job result: with the secret set, the eval step ran; without it, the step is skipped and the job is green (8.14).

### Acceptance

Step 4 output; `head -c $(wc -c < node_modules/.cache/ripple/nightly.yml) .github/workflows/nightly.yml | cmp - node_modules/.cache/ripple/nightly.yml` reports no difference.

### Out of scope

Branch protection. Making the job gate merges (it never does).

### If blocked

`nightly.yml` differs from X-8: another task changed it; add the job at the end of `jobs:` by hand, list the difference in the pull request.

---

## M8-T42 Eval gate E3: judge calibrated, budgets frozen, Sidekick bar B-1 to B-7. **BLOCKED-ON-BEN (model ids, ledger Q17)**

- **Goal:** Calibrate the judge, freeze the budgets, and run the Sidekick bar (gate E3).
- **Depends on:** M8-T28, M8-T29, M8-T40. Also 0.7: M8-T25. Waits for non-null `weakModel` and `judgeModel` in `evals/rubric/bar.json` (PLAN 4.3) and for at least 30 human ratings in `evals/rubric/golden/ratings.json` (M8-T28 step 5).
- **Kind:** `gate`. Size M.

### Read first

doc 08: `### 8.9 ` steps 4 and 5 (0.8 kB), `### 8.11 ` the paragraph above the table (0.5 kB), `### 8.12 ` (2.9 kB), `### 8.14 ` the "M6" item. PLAN 3.5 and the E3 row of PLAN 4.2. This file 0.8, 0.11.

### Files

Change: `evals/rubric/bar.json` (`calibration` only), `evals/tasks/*/task.json` (`budgets` only, by the script). Create: `docs/plan/done/M8-T42.md`.

### Steps

1. Branch `task/M8-T42-eval-bar`. Confirm both model keys are set and `node -e 'console.log(require("./evals/rubric/golden/ratings.json").length)'` prints at least `30`. Ben's sign-off (8.9 step 5): the reference-blueprint screenshots have a human median of at least 3 on every criterion; when not, stop (the pairwise anchor is not accepted).
2. `pnpm eval -- --calibrate`; it MUST print `calibration: passed`. Write the date (UTC `YYYY-MM-DD`), Spearman and MAE into `bar.json` `calibration`.
3. Budgets: `pnpm eval -- --tasks all --hosts all --adapter pi --arm ripple --runs 10 --out evals/runs/budgets` (model: `agentModel`), then `node evals/adapters/freeze-budgets.ts evals/runs/budgets`; commit the changed `task.json` files (`frozen: true`).
4. `pnpm eval -- --bar --out evals/runs/bar`. The report MUST show B-1 to B-7 `passed`; B-8 is `blocked` until the preview store exists (ledger Q5) and the Liquid host is not described as ready.
5. Done file: first line `E3: PASS`, the three run ids, the B table, the calibration numbers.

### Acceptance

`bar.json` `calibration` has a date and both numbers; every `task.json` has `budgets.frozen: true`; the bar report lists B-1 to B-7 as `passed`.

### Out of scope

B-8 (M10-T09). Opening decisions for triggers in the report (people do it per 8.13).

### If blocked

- Inputs missing: do not start (PLAN 4.3); the M8 gate records E3 as BLOCKED-ON-BEN.
- Calibration fails: do not tune the rubric to pass; record the numbers, write `E3: FAIL`, and leave `bar.json` unchanged.
- A bar condition fails: write `E3: FAIL` with the condition and the cells; decisions follow 8.13 rules G-1 to G-6 in later tasks.

---

## M8-T43 M8 gate

- **Goal:** Prove that milestone M8 is complete by the gate row of `docs/PLAN.md` and record the result.
- **Depends on:** M8-T40, M8-T01 to M8-T38.
- **Kind:** `gate`. No source, test or spec file changes.

### Read first

`docs/PLAN.md` section 4.2 (the gate rules), the M8 row of the gate table (search `| M8 | M8-T43 |`) and the E1 to E3 rows; section 4.3. This file 0.5, 0.7, 0.12.

### Files

Create: `docs/plan/done/M8-T43.md`. Change nothing else.

### Steps

1. Branch `task/M8-T43-gate`, from an up-to-date `main`.
2. Done files: `ls docs/plan/done/ | grep -c '^M8-T\(0[1-9]\|[12][0-9]\|3[0-8]\)\.md$'` MUST print `38`; `docs/plan/done/M8-T40.md` exists and starts with `E2: PASS`. `grep -l 'FOLLOW-UP NEEDED' docs/plan/done/M8-T*.md` prints nothing, or every file it prints names a follow-up task whose own done file exists.
3. `pnpm install --frozen-lockfile && pnpm ci` exits 0. `pnpm build 2>&1 | grep -c "build: skipped"` prints `0`. `grep -rn "PLAN 4.4" src/` prints nothing, or only lines whose marker names an M9 task.
4. Acceptance lists (grep the passing lines of `pnpm test --no-skips`): doc 08 2.8 `[T10] docs: K-01`, `K-02`, `K-06`, `K-09`, `[T10] docs: K-07`, `[T1] docs: K-03`, `K-04`, `K-05`, `K-08`; 3.4 `[T1] agents-md: K-10`, `K-11`, `K-12`, `K-14`, `K-16` and the K-13 test of `src/cli/commands/init.test.ts`; 4.6 `[T1] skills: K-20`, `K-21`, `K-23` to `K-28` and `[T10] skills: K-22`; 5.6 `[T1] meta: K-31`, `K-32`, `K-34`, `K-36`, `[T1] report: K-33`; 6.4 `[T1] warnings: K-40`, `[T3] bundles: K-41`, `[T2] hosts: K-42`; 7.8 the K-50 to K-56 and C-31 tests of M8-T03.
5. `ls pkg/skills | wc -l` prints `14`; `ls pkg/docs/guides | wc -l` prints `12`; `ls pkg/docs/rules | wc -l` prints `55`.
6. Eval gates: E2 from step 2. E1: `docs/plan/done/M8-T39.md` starts with `E1: PASS`, or `BEN-eval-access.md` is absent and E1 is recorded `BLOCKED-ON-BEN (model access, RIPPLE_EVAL_API_KEY)`. E3: `docs/plan/done/M8-T42.md` starts with `E3: PASS`, or the inputs are absent and E3 is recorded `BLOCKED-ON-BEN (weakModel and judgeModel, ledger Q17; golden ratings, ledger Q14)`.
7. Write the done file. First line `M8 gate: PASS`. Then the commands with their output, the commit checked, the M8 tasks with their pull requests, the E1 to E3 states, and `## Open notes`: every line added under `## Ledger issues` of docs 01, 07, 08, 13 by M8 tasks (the Plan readings PR-M8-1 to PR-M8-24 and per-task lines); the spike states the skills and guides used (SPIKE-02, -03, -10, -11); K-15 not measured until model access; UNVERIFIED items settled or still open (Claude Code package name, `KEY_ENV`, judge transport, network egress limit, pi record field paths). Commit only this file; PLAN 5.0.

### Acceptance

Every command of steps 2 to 6 gives the stated output. The done file exists and its first line is `M8 gate: PASS`.

### Out of scope

Fixing anything. Running blocked gates.

### If blocked

Any check fails: first line `M8 gate: FAIL` with the failing command and output, name the owning task (2.8 items: M8-T01, M8-T21, M6-T14; 3.4: M6-T13, M8-T21; 4.6: M8-T21 and the skill task; 5.6: M8-T01; 6.4: M8-T02; 7.8: M8-T03; evals: M8-T40's list), open a draft pull request, stop. Never fix inside the gate task.
