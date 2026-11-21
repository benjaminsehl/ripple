import { createRequire } from "node:module";
import fs from "node:fs";
import http from "node:http";
import { renderToString } from "react-dom/server";
import { createElement, StrictMode } from "react";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { App } = await import("../out/app.mjs");

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname.endsWith(".js")) { res.setHeader("content-type", "text/javascript"); res.end(fs.readFileSync("out" + url.pathname)); return; }
  const mode = url.searchParams.get("mode");
  const html = renderToString(createElement(StrictMode, null, createElement(App, { mode })));
  res.setHeader("content-type", "text/html");
  res.end(`<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root">${html}</div>
<script>window.__mode=${JSON.stringify(mode)};window.__log=[];window.__mut=[];
new MutationObserver((rs)=>{for(const r of rs){const same=r.type==="attributes"&&r.oldValue===r.target.getAttribute(r.attributeName);window.__mut.push(r.type+":"+(r.attributeName||"")+":"+(r.target.nodeName)+(r.target.type?"["+r.target.type+"]":"")+":"+(same?"same":"CHANGED "+r.oldValue+"->"+(r.target.getAttribute?r.target.getAttribute(r.attributeName):"")))}}).observe(document.getElementById("root"),{attributes:true,attributeOldValue:true,childList:true,characterData:true,subtree:true});</script>
<script type="module" src="/client.js"></script></body></html>`);
}).listen(0);
const port = server.address().port;
const browser = await chromium.launch();
let failed = 0;
const check = (label, cond, extra = "") => { if (!cond) failed++; console.log(`${cond ? "ok  " : "FAIL"} ${label} ${extra}`); };
for (const mode of ["uncontrolled", "controlled", "reject"]) {
  for (const order of ["elements-first", "hydrate-first"]) {
    const page = await browser.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(m.text().slice(0, 300)); });
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`http://localhost:${port}/?mode=${mode}`);
    await page.waitForFunction(() => typeof window.__hydrate === "function");
    const defineElements = async () => { await page.addScriptTag({ type: "module", url: "/elements.js" }); await page.waitForFunction(() => customElements.get("rp-dialog") && customElements.get("ui-tabs")); };
    const hydrate = async () => { await page.evaluate(() => window.__hydrate()); await page.waitForTimeout(150); };
    if (order === "elements-first") { await defineElements(); await page.waitForTimeout(100); await hydrate(); } else { await hydrate(); await defineElements(); await page.waitForTimeout(100); }
    const tag = `[${mode}/${order}]`;
    const mut = await page.evaluate(() => window.__mut.slice());
    // Tolerated: same-value attribute writes by React hydration on native <input> (type, value, name, checked),
    // React re-setting the text of <textarea>, and the UI SDK same-value write of role on ui-tabs-tab.
    const tolerated = (m) =>
      /^attributes:(type|value|name|checked):INPUT\[[a-z]+\]:same$/.test(m) ||
      /^childList::TEXTAREA\[textarea\]:/.test(m) ||
      m === "attributes:role:UI-TABS-TAB:same";
    const real = mut.filter((m) => !tolerated(m));
    check(`${tag} zero mutations outside the tolerated list at upgrade+hydration`, real.length === 0, JSON.stringify(real));
    if (mode === "uncontrolled") console.log("     tolerated records:", JSON.stringify([...new Set(mut)]));
    check(`${tag} textarea text unchanged`, (await page.evaluate(() => document.querySelector("textarea").textContent)) === "hi");
    check(`${tag} no console output`, errors.length === 0, JSON.stringify(errors));
    check(`${tag} no recoverable errors`, (await page.evaluate(() => window.__recoverable.length)) === 0);
    // first interaction, no prior re-render
    await page.click("#t-tab-password");
    await page.waitForTimeout(50);
    const log1 = await page.evaluate(() => window.__log.slice());
    check(`${tag} onValueChange fired on first click`, log1.includes("tab:password"), JSON.stringify(log1));
    const selected = await page.evaluate(() => document.getElementById("t-tab-password").getAttribute("aria-selected"));
    check(`${tag} tab selection ${mode === "reject" ? "vetoed" : "applied"}`, selected === (mode === "reject" ? "false" : "true"), selected);
    await page.click("#opener");
    await page.waitForTimeout(80);
    const isOpen = await page.evaluate(() => document.getElementById("size-guide").open);
    check(`${tag} dialog ${mode === "reject" ? "stays closed (veto)" : "opens"}`, isOpen === (mode !== "reject"), String(isOpen));
    const log2 = await page.evaluate(() => window.__log.slice());
    check(`${tag} onOpenChange(true) fired`, log2.some((l) => l.startsWith("open:true")), JSON.stringify(log2));
    if (mode !== "reject") {
      await page.evaluate(() => document.getElementById("rerender").click());
      await page.waitForTimeout(50);
      check(`${tag} re-render keeps dialog open`, await page.evaluate(() => document.getElementById("size-guide").open && document.getElementById("size-guide").textContent.includes("S, M, L. 1")));
      await page.click("#closer");
      await page.waitForTimeout(80);
      check(`${tag} closer closes`, !(await page.evaluate(() => document.getElementById("size-guide").open)));
    }
    if (mode === "controlled") {
      await page.evaluate(() => document.getElementById("ext-open").click());
      await page.waitForTimeout(80);
      check(`${tag} parent state opens dialog`, await page.evaluate(() => document.getElementById("size-guide").open));
    }
    check(`${tag} no console output after interaction`, errors.length === 0, JSON.stringify(errors));
    await page.close();
  }
}
await browser.close(); server.close();
console.log(failed === 0 ? "ALL OK" : `${failed} FAILED`);
