import { createRequire } from "node:module"
import { serve } from "./server.mjs"
const { chromium } = createRequire(import.meta.url)("playwright")
const { server, url } = await serve()
const browser = await chromium.launch()
const page = await browser.newPage()
const requests = []
page.on("request", (r) => { if (r.url().includes(".js")) requests.push(r.url().split("/").pop()) })
page.on("pageerror", (e) => console.log("PAGEERROR", e.message))
await page.goto(url + "/site/liquid.html")
await page.waitForFunction(() => ["rp-dialog", "ui-tabs", "ui-tooltip", "ui-toast-region"].every((t) => customElements.get(t)))
await page.click("#tabs-tab-shipping")
const ok = await page.evaluate(async () => {
  const m = await import("ripple")
  const agent = (await m.loadAgent()).createAgent()
  return { selected: document.getElementById("tabs").value, components: agent.snapshot().map((c) => c.component) }
})
console.log(JSON.stringify(ok))
console.log("requests:", JSON.stringify(requests))
console.log(new Set(requests).size === requests.length && ok.selected === "shipping" && ok.components.includes("tabs") && ok.components.includes("rp-quantity") ? "PASS  liquid import map: one instance of every file, agent sees ui-* and rp-*" : "FAIL")
await browser.close(); server.close()
