import { createRequire } from "node:module"; const { chromium } = createRequire(import.meta.url)("playwright"); import { start } from "./server.mjs"
const s=await start(); const b=await chromium.launch()
for (const js of [false,true]) { const p=await (await b.newContext({javaScriptEnabled:js})).newPage(); await p.goto("http://localhost:4173/t3.html"); if(js){ await p.waitForFunction(()=>customElements.get("ui-dialog")&&customElements.get("ui-collapsible")); await p.waitForTimeout(300) }
  console.log("js="+js, await p.evaluate(()=>({c1:getComputedStyle(document.querySelector("#c1")).display, c2:getComputedStyle(document.querySelector("#c2")).display, headOrder:[...document.head.children].map(e=>e.localName+(e.id?"#"+e.id:"")).join(" > ")}))) }
await b.close(); s.close()
