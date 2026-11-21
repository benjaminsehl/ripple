import { createRequire } from "node:module"; const { chromium } = createRequire(import.meta.url)("playwright")
import fs from "node:fs"; import { start } from "./server.mjs"
const s = await start(); const b = await chromium.launch(); const out=[]; const log=(...a)=>{out.push(a.join(" ")); fs.appendFileSync("out/interact.live.txt", a.join(" ")+"\n")}
fs.mkdirSync("out",{recursive:true}); fs.writeFileSync("out/interact.live.txt","")
const U="http://localhost:4173/pe-pre.html"
const attrs = (page, sel) => page.evaluate((sel)=>{const e=document.querySelector(sel); if(!e) return "(missing)"; const cs=getComputedStyle(e); return `<${e.localName} ${[...e.attributes].map(a=>a.value===""?a.name:`${a.name}="${a.value}"`).join(" ")}> display=${cs.display} parent=${e.parentElement?.localName} topLayer=${e.matches(":popover-open")}`}, sel)
async function ready(page){ await page.waitForFunction(()=>[...document.querySelectorAll("*")].every(e=>!/^(ui|rp)-/.test(e.localName)||customElements.get(e.localName))); await page.waitForTimeout(300) }
// ---------- 1. forms: no JS vs JS
for (const js of [false,true]) {
  const ctx = await b.newContext({javaScriptEnabled:js}); ctx.setDefaultTimeout(4000)
  for (const f of ["f-checkbox","f-select","f-number-host","f-number-native","f-number-both","f-field-native","f-button"]) {
    const page = await ctx.newPage(); await page.goto(U); if(js) await ready(page)
    await page.click(`#${f} button[type=submit]`); await page.waitForLoadState()
    log(`FORM ${f} js=${js} -> ${new URL(page.url()).pathname}${new URL(page.url()).search}`); await page.close()
  }
  // links inside triggers
  for (const id of ["drawer-link","dialog-link"]) {
    const page = await ctx.newPage(); await page.goto(U); if(js) await ready(page)
    await page.click(`#${id}`); await page.waitForTimeout(400)
    const navigated = !page.url().includes("pe-pre")
    log(`LINK-TRIGGER ${id} js=${js} -> url=${new URL(page.url()).pathname}${new URL(page.url()).search}` + (js&&!navigated? " open="+await page.evaluate((id)=>document.querySelector("#"+id).closest("ui-drawer,ui-dialog").open, id):""))
    if(js&&!navigated){ // modifier click should still navigate/open new tab? check ctrl-click not prevented
      const prevented = await page.evaluate((id)=>{ const a=document.querySelector("#"+id); const root=a.closest("ui-drawer,ui-dialog"); root.open=false; const ev=new MouseEvent("click",{bubbles:true,cancelable:true,ctrlKey:true,metaKey:true}); a.addEventListener("click",e=>{ if(e===ev) setTimeout(()=>0) }); const r=a.dispatchEvent(ev); return {defaultPrevented:ev.defaultPrevented, open:root.open} }, id)
      log(`   ctrl/meta-click: ${JSON.stringify(prevented)}`) }
    await page.close()
  }
  // tabs as links no-js: click B
  { const page = await ctx.newPage(); await page.goto(U); if(js) await ready(page); await page.click("#c-tabs-links a >> nth=1"); await page.waitForTimeout(200)
    log(`TABS-LINKS js=${js} url=${page.url().replace("http://localhost:4173","")} panelBVisible=${await page.isVisible("#tl-panel-b")} panelAVisible=${await page.isVisible("#tl-panel-a")}`); await page.close() }
  await ctx.close()
}
// ---------- 2. open states (JS)
{ const c2=await b.newContext(); c2.setDefaultTimeout(4000); const page = await c2.newPage(); const errs=[]; page.on("pageerror",e=>errs.push(e.message)); page.on("console",m=>{ if(m.type()!=="log") errs.push(m.type()+": "+m.text()) })
  await page.goto(U); await ready(page)
  log("\nOPEN STATES")
  log("dialog closed content:", await attrs(page,"#d ui-dialog-content"))
  await page.click("#d-trigger"); await page.waitForTimeout(400)
  log("dialog open trigger:", await attrs(page,"#d-trigger"))
  log("dialog open content:", await attrs(page,"#d ui-dialog-content"))
  log("dialog open backdrop:", await attrs(page,"#d ui-dialog-backdrop"))
  log("dialog open: html attrs:", await attrs(page,"html"), "| body:", await attrs(page,"body"))
  log("dialog open: inert elements:", await page.evaluate(()=>[...document.querySelectorAll("[inert],[aria-hidden=true]")].map(e=>e.localName+(e.id?"#"+e.id:"")).join(", ")))
  log("dialog open: body-level extra children:", await page.evaluate(()=>[...document.body.children].filter(e=>e.localName!=="section").map(e=>e.outerHTML.slice(0,300)).join(" || ")))
  log("dialog open: activeElement:", await page.evaluate(()=>document.activeElement.outerHTML.slice(0,120)))
  await page.keyboard.press("Escape"); await page.waitForTimeout(400)
  log("dialog after Escape content:", await attrs(page,"#d ui-dialog-content"))
  log("dialog after Escape trigger:", await attrs(page,"#d-trigger"))
  // tabs
  await page.click("#t-tab-password"); await page.waitForTimeout(200)
  log("tabs after click tab2:", await attrs(page,"#t-tab-password")); log("  tab1:", await attrs(page,"#t-tab-account"))
  log("  panel1:", await attrs(page,"#t ui-tabs-panel[value=account]")); log("  panel2:", await attrs(page,"#t ui-tabs-panel[value=password]")); log("  root:", await attrs(page,"#t"))
  // accordion
  await page.click("#a-trigger-returns"); await page.waitForTimeout(400)
  log("accordion after open returns: trigger:", await attrs(page,"#a-trigger-returns")); log("  panel:", await attrs(page,"#a ui-accordion-item[value=returns] ui-accordion-panel")); log("  item:", await attrs(page,"#a ui-accordion-item[value=returns]")); log("  root:", await attrs(page,"#a"))
  log("  shipping item (multiple default?):", await attrs(page,"#a ui-accordion-item[value=shipping]"))
  // popover, menu, tooltip
  await page.click("#p button"); await page.waitForTimeout(300); log("popover open content:", await attrs(page,"#p ui-popover-content")); log("  trigger:", await attrs(page,"#p-trigger")); await page.keyboard.press("Escape"); await page.waitForTimeout(300)
  await page.click("#m button"); await page.waitForTimeout(300); log("menu open content:", await attrs(page,"#m ui-menu-content")); log("  item:", await attrs(page,"#m ui-menu-item")); await page.keyboard.press("Escape"); await page.waitForTimeout(300)
  await page.focus("#tt button"); await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab"); await page.waitForTimeout(900); log("tooltip focused content:", await attrs(page,"#tt ui-tooltip-content")); 
  // drawer
  await page.evaluate(()=>{ document.querySelector("#dr").open = true }); await page.waitForTimeout(600)
  log("drawer open viewport:", await attrs(page,"#dr ui-drawer-viewport")); log("  content:", await attrs(page,"#dr ui-drawer-content")); log("  backdrop:", await attrs(page,"#dr ui-drawer-backdrop")); log("  link trigger:", await attrs(page,"#drawer-link"))
  await page.keyboard.press("Escape"); await page.waitForTimeout(600)
  // select open
  await page.click("#f-select ui-select button"); await page.waitForTimeout(300); log("select open content:", await attrs(page,"#f-select ui-select-content")); log("  trigger:", await attrs(page,"#f-select ui-select button")); await page.keyboard.press("Escape")
  // custom element
  log("\nCUSTOM ELEMENT")
  log("rp-cart-count after upgrade:", await attrs(page,"#cc"), "| text:", await page.textContent("#cc"))
  const r = await page.evaluate(async()=>{ const el=document.querySelector("#cc"); const events=[]; el.addEventListener("countchange",e=>events.push({value:e.detail.value,reason:e.detail.reason,source:e.detail.source,bubbles:e.bubbles,cancelable:e.cancelable})); 
    const r1=el.api.setCount(5); await 0; const t1=el.textContent; el.count=7; await 0; const t2=el.textContent; el.setAttribute("count","9"); await new Promise(r=>setTimeout(r,50)); const t3=el.textContent; el.api.setPending(true); await new Promise(r=>setTimeout(r,50));
    return {apiKeys:Object.keys(el.api), r1, t1, t2, t3, prop:el.count, events, html:el.outerHTML, parts:Object.keys(window.__parts), isCls: el instanceof window.__parts.Root} })
  log(JSON.stringify(r,null,1))
  log("\npage errors/warnings:", JSON.stringify(errs))
}
// ---------- 3. layout shift with static pre-upgrade CSS
for (const pg of ["all-bare.html","all-pre.html"]) {
  const off = await (await b.newContext({javaScriptEnabled:false})).newPage(); await off.goto("http://localhost:4173/"+pg)
  const on = await (await b.newContext()).newPage(); await on.goto("http://localhost:4173/"+pg); await ready(on); await on.waitForTimeout(300)
  const m = (p)=>p.evaluate(()=>Object.fromEntries([...document.querySelectorAll("section")].map(s=>{const r=s.getBoundingClientRect(); return [s.id, Math.round(r.top)+":"+Math.round(r.height)]})))
  const A=await m(off), B=await m(on); const shifted=Object.keys(A).filter(k=>A[k]!==B[k]).map(k=>`${k} ${A[k]}->${B[k]}`)
  log(`\nLAYOUT SHIFT ${pg}: ${shifted.length} of ${Object.keys(A).length} sections moved/resized (top:height)\n  `+shifted.join("\n  "))
}
fs.writeFileSync("out/interact.txt", out.join("\n")); console.log(out.join("\n")); await b.close(); s.close()
