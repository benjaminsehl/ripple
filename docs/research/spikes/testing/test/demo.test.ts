import { test, after } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { gzipSync } from "node:zlib"
import { createElement } from "react"
import { renderToString } from "react-dom/server"
import type { Browser } from "playwright"
import { launch, openPage, serveStatic } from "../src/harness"
import { formatUpgradeFailures, upgradeDiff } from "../src/upgrade-diff"

let browser: Browser
let site: { url: string; close(): Promise<void> }
const tabs = readFileSync("site/tabs.html", "utf8")
const doc = (body: string, script: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title>${script}</head><body><main>${body}</main></body></html>`

// Lazy: a top-level before() hook still runs when every test of the file is filtered out,
// and its after() hook then never runs, which leaves the browser open and hangs the run.
let started: Promise<void> | undefined
const setup = () => (started ??= (async () => {
  browser = await launch()
  site = await serveStatic({ "/out/": "out/", "/axe/": "node_modules/axe-core/", "/cache/": "node_modules/.cache/ripple/test/" }, new Map([
    ["/tabs", doc(tabs, `<script type="module" src="/out/ripple-tabs.js"></script>`)],
    ["/tabs-broken", doc(tabs.replace(' aria-selected="true"', "").replace(' aria-controls="t-panel-account"', ""), `<script type="module" src="/out/ripple-tabs.js"></script>`)],
  ]))
})())
after(async () => { if (started) { await started; await browser.close(); await site.close() } })

test("[T3] upgradeDiff: Tabs default fixture has zero failures; a fixture missing an attribute fails", async () => {
  await setup()
  const good = await openPage(browser, "on")
  const report = await upgradeDiff(good.page, { url: site.url + "/tabs", rootClasses: ["rp-tabs"] })
  console.log("good:", report.failures.length, "failures,", report.sameValue.length, "same-value,", report.undefinedTags.length, "undefined tags")
  assert.deepEqual(report.failures, [])
  assert.equal(report.sameValue.length, 2)
  assert.deepEqual(report.undefinedTags, [])
  await good.context.close()
  const bad = await openPage(browser, "on")
  const broken = await upgradeDiff(bad.page, { url: site.url + "/tabs-broken", rootClasses: ["rp-tabs"] })
  console.log(formatUpgradeFailures("tabs/default", broken.failures))
  assert.ok(broken.failures.some((r) => r.attributeName === "aria-selected" && r.oldValue === null && r.newValue === "true"))
  await bad.context.close()
  const allowed = await openPage(browser, "on")
  const withAllow = await upgradeDiff(allowed.page, { url: site.url + "/tabs-broken", rootClasses: ["rp-tabs"], allow: [{ select: "ui-tabs", subtree: true, attrs: ["aria-selected", "aria-controls", "tabindex", "data-selected", "id"], reason: "test" }] })
  console.log("with allow:", withAllow.failures.length, "failures,", withAllow.permitted.length, "permitted")
  await allowed.context.close()
})

test("[T5] checkPattern injected as an IIFE passes for tabs", async () => {
  await setup()
  const { context, page } = await openPage(browser, "on")
  await page.goto(site.url + "/tabs")
  await page.evaluate(() => customElements.whenDefined("ui-tabs"))
  await page.addScriptTag({ url: site.url + "/cache/in-page.js" })
  const message = await page.evaluate(async () => {
    try { await (window as any).__rpTesting.checkPattern(document.querySelector("ui-tabs"), "tabs"); return "" } catch (e) { return String((e as Error).message) }
  })
  console.log("checkPattern message:", JSON.stringify(message))
  assert.equal(message, "")
  await context.close()
})

test("[T5] axe-core reports zero violations", async () => {
  await setup()
  const { context, page } = await openPage(browser, "on")
  await page.goto(site.url + "/tabs")
  await page.evaluate(() => customElements.whenDefined("ui-tabs"))
  await page.addScriptTag({ url: site.url + "/axe/axe.min.js" })
  const result = await page.evaluate(() => (window as any).axe.run(document.querySelector("main"), { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, rules: { "color-contrast": { enabled: false } } }))
  console.log("axe violations:", JSON.stringify(result.violations.map((v: any) => v.id)), "passes:", result.passes.length)
  assert.deepEqual(result.violations.map((v: any) => v.id), [])
  await context.close()
})

test("[T6] scripts disabled and scripts blocked render the same boxes", async () => {
  await setup()
  const boxes: Record<string, unknown> = {}
  for (const mode of ["on", "disabled", "blocked"] as const) {
    const { context, page } = await openPage(browser, mode)
    const requested: string[] = []
    page.on("requestfailed", (r) => requested.push("failed:" + r.url().split("/").pop()))
    await page.goto(site.url + "/tabs")
    if (mode === "on") await page.evaluate(() => customElements.whenDefined("ui-tabs"))
    boxes[mode] = await page.locator("ui-tabs, ui-tabs *").evaluateAll((els) => els.map((e) => { const b = e.getBoundingClientRect(); return [e.localName, Math.round(b.x * 2) / 2, Math.round(b.y * 2) / 2, Math.round(b.width * 2) / 2, Math.round(b.height * 2) / 2, getComputedStyle(e).display] }))
    console.log(mode, "defined:", mode === "disabled" ? "n/a" : await page.evaluate(() => !!customElements.get("ui-tabs")), requested.join(","))
    await context.close()
  }
  console.log("on == disabled:", JSON.stringify(boxes.on) === JSON.stringify(boxes.disabled), " on == blocked:", JSON.stringify(boxes.on) === JSON.stringify(boxes.blocked))
  assert.deepEqual(boxes.disabled, boxes.blocked)
})

test("[T2] children placeholder survives renderToString unescaped after substitution", () => {
  const children = `<p>One &amp; "two"</p>`
  const token = "RPCHILDREN0"
  const html = renderToString(createElement("button", { className: "rp-button", type: "button" }, token))
  assert.equal(html.split(token).length, 2)
  assert.equal(html.replace(token, children), `<button class="rp-button" type="button"><p>One &amp; "two"</p></button>`)
})

test("[T10] gzip level 9 size of a built file is deterministic", () => {
  const bytes = readFileSync("out/ripple-tabs.js")
  const a = gzipSync(bytes, { level: 9 }).length, b = gzipSync(bytes, { level: 9 }).length
  console.log("ripple-tabs.js raw", bytes.length, "gzip", a)
  assert.equal(a, b)
})
