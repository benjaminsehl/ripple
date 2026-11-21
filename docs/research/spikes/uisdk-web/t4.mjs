import { createRequire } from "node:module"; const { chromium } = createRequire(import.meta.url)("playwright"); import { start } from "./server.mjs"
const s=await start(); const b=await chromium.launch(); const p=await (await b.newContext()).newPage(); await p.goto("http://localhost:4173/all-bare.html")
await p.waitForFunction(()=>[...document.querySelectorAll("*")].every(e=>!e.localName.startsWith("ui-")||customElements.get(e.localName))); await p.waitForTimeout(500)
console.log(await p.evaluate(()=>[...document.body.children].filter(e=>e.localName!=="section").map(e=>e.outerHTML.slice(0,400)).join("\n")))
// which section triggers them: test per-entry
await b.close(); s.close()
