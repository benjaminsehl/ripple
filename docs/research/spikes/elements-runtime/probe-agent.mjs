import { createRequire } from "node:module"
import { serve } from "./server.mjs"
const { chromium } = createRequire(import.meta.url)("playwright")
const { server, url } = await serve()
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(url + "/site/index.html")
await page.waitForFunction(() => customElements.get("rp-dialog"))
const out = await page.evaluate(async () => {
  const m = await import("/out/browser/ripple.elements.js")
  const agent = (await m.loadAgent()).createAgent()
  document.getElementById("dlg").parentElement.api.open()
  await new Promise((r) => setTimeout(r, 100))
  const snap = agent.snapshot().filter((c) => c.component === "rp-dialog")
  const r = await agent.act({ steps: [{ ref: snap.find((c) => c.open !== false && JSON.stringify(c).includes("Close"))?.ref ?? snap[0].ref, action: "press", args: ["Close"] }] }).catch((e) => ({ thrown: String(e.message ?? e) }))
  return { snap, r, stillOpen: document.getElementById("dlg").open }
})
console.log(JSON.stringify(out, null, 1).slice(0, 2500))
await browser.close(); server.close()
