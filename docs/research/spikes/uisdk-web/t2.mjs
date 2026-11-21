import { createRequire } from "node:module"; const { chromium } = createRequire(import.meta.url)("playwright")
import fs from "node:fs"; import { start } from "./server.mjs"; import { snap } from "./snap.mjs"
const s = await start(); const b = await chromium.launch(); const out=[]; const log=(...a)=>{out.push(a.join(" ")); fs.appendFileSync("out/t2.txt", a.join(" ")+"\n")}; fs.writeFileSync("out/t2.txt","")
const U="http://localhost:4173/t2.html"
async function ready(page){ await page.waitForFunction(()=>[...document.querySelectorAll("*")].every(e=>!/^(ui|rp)-/.test(e.localName)||customElements.get(e.localName))); await page.waitForTimeout(300) }
const html=(page,sel)=>page.evaluate(sel=>{const e=document.querySelector(sel).cloneNode(false); return e.outerHTML},sel)
const mk=async(js=true)=>{const c=await b.newContext({javaScriptEnabled:js}); c.setDefaultTimeout(4000); const p=await c.newPage(); const errs=[]; p.on("console",m=>errs.push(m.type()+": "+m.text())); p.on("pageerror",e=>errs.push("ERR "+e.message)); await p.goto(U); if(js) await ready(p); p.errs=errs; return p}
// A. zero-diff check on accordion + field
{ const off=await mk(false), on=await mk(true); const A=await off.evaluate(snap), B=await on.evaluate(snap)
  const flat=(t,p="",acc={})=>{const k=p+"/"+t.tag+(t.attrs.id?"#"+t.attrs.id:""); acc[k+"|"+Object.keys(acc).length]={attrs:t.attrs,display:t.display,text:t.text}; t.children.forEach(c=>flat(c,k,acc)); return acc}
  for(const id of ["c-acc","c-field"]){ const a=Object.values(flat(A.sections[id])), bb=Object.values(flat(B.sections[id])); const ka=Object.keys(flat(A.sections[id]))
    let n=0; a.forEach((x,i)=>{ const y=bb[i]; const d=[]; for(const k of new Set([...Object.keys(x.attrs),...Object.keys(y.attrs)])) if(x.attrs[k]!==y.attrs[k]) d.push(`${k}: ${JSON.stringify(x.attrs[k])} -> ${JSON.stringify(y.attrs[k])}`); if(x.text!==y.text) d.push(`text ${x.text}->${y.text}`); if(d.length){n++; log(`  ${id} ${ka[i]}: ${d.join("; ")}`)} })
    log(`ZERO-DIFF ${id}: ${n} elements differ in attributes/text`) }
  const m=(p)=>p.evaluate(()=>[...document.querySelectorAll("section")].map(s=>{const r=s.getBoundingClientRect(); return s.id+" "+Math.round(r.top)+":"+Math.round(r.height)}).join(" | "))
  log("LAYOUT nojs:", await m(off)); log("LAYOUT js:  ", await m(on)); log("warnings:", JSON.stringify(on.errs)) }
// B. field no-JS label association
{ const off=await mk(false); log("FIELD nojs: label.control ->", await off.evaluate(()=>document.querySelector("#fe-label").control?.id)); 
  const on=await mk(true); log("FIELD js: label.control ->", await on.evaluate(()=>document.querySelector("#fe-label").control?.id), "| label:", await html(on,"#fe-label"), "| input:", await html(on,"#fe-control"))
  await on.click("#f-field button[type=submit]"); await on.waitForTimeout(300); log("FIELD js submit empty required: url", on.url().replace("http://localhost:4173",""), "| error:", await on.evaluate(()=>document.querySelector("ui-field-error").outerHTML), "| input:", await html(on,"#fe-control")) }
// C. number input formatting / submission
for (const [form,inc] of [["f-num","inc"],["f-num2","inc2"]]) { const on=await mk(true)
  log(`NUMBER ${form}: input after upgrade:`, await on.evaluate((f)=>{const i=document.querySelector(`#${f} input`); return i.outerHTML+" .value="+JSON.stringify(i.value)},form))
  await on.click("#"+inc); await on.waitForTimeout(100); log(`  after increment .value=`, await on.evaluate((f)=>document.querySelector(`#${f} input`).value,form), "host.value=", await on.evaluate((f)=>document.querySelector(`#${f} ui-number-input`).value,form))
  await on.click(`#${form} button[type=submit]`); await on.waitForLoadState(); log(`  submit ->`, on.url().replace("http://localhost:4173","")) }
{ const off=await mk(false); await off.click(`#f-num button[type=submit]`); await off.waitForLoadState(); log("NUMBER f-num nojs submit ->", off.url().replace("http://localhost:4173","")) }
// D. link trigger
{ const on=await mk(true); const nav=[]; on.on("framenavigated",f=>nav.push(f.url()))
  await on.evaluate(()=>{ window.__oc=[]; document.querySelector("#dr").addEventListener("openchange",e=>window.__oc.push(e.detail.value+":"+e.detail.reason)) })
  await on.click("#drawer-link"); await on.waitForTimeout(500); log("LINK default: navigated=", !on.url().includes("t2.html"), "url=", on.url().replace("http://localhost:4173","")) }
{ const on=await mk(true)
  await on.evaluate(()=>{ window.__oc=[]; const dr=document.querySelector("#dr"); dr.addEventListener("openchange",e=>window.__oc.push(e.detail.value+":"+e.detail.reason)); document.querySelector("#drawer-link").addEventListener("click",e=>{ if(e.metaKey||e.ctrlKey||e.shiftKey||e.button!==0) return; e.preventDefault() }) })
  await on.click("#drawer-link"); await on.waitForTimeout(600); log("LINK + page preventDefault (bubble listener on <a>): navigated=", !on.url().includes("t2.html"), "open=", await on.evaluate(()=>document.querySelector("#dr").open), "events=", await on.evaluate(()=>window.__oc.join(","))) }
{ const on=await mk(true)
  await on.evaluate(()=>{ window.__oc=[]; const dr=document.querySelector("#dr"); dr.addEventListener("openchange",e=>window.__oc.push(e.detail.value+":"+e.detail.reason)); document.querySelector("#drawer-link").addEventListener("click",e=>{ if(e.metaKey||e.ctrlKey||e.shiftKey||e.button!==0) return; e.preventDefault() },{capture:true}) })
  await on.click("#drawer-link"); await on.waitForTimeout(600); log("LINK + page preventDefault (capture listener on <a>): navigated=", !on.url().includes("t2.html"), "open=", await on.evaluate(()=>document.querySelector("#dr").open), "events=", await on.evaluate(()=>window.__oc.join(","))) }
{ const on=await mk(true)
  await on.evaluate(()=>{ window.__oc=[]; const dr=document.querySelector("#dr"); dr.addEventListener("openchange",e=>window.__oc.push(e.detail.value+":"+e.detail.reason)); document.querySelector("#plain-link").addEventListener("click",e=>{ if(e.metaKey||e.ctrlKey||e.shiftKey||e.button!==0) return; e.preventDefault(); dr.api.open({}) }) })
  await on.click("#plain-link"); await on.waitForTimeout(600); log("PLAIN LINK + preventDefault + api.open(): navigated=", !on.url().includes("t2.html"), "open=", await on.evaluate(()=>document.querySelector("#dr").open), "events=", await on.evaluate(()=>window.__oc.join(",")))
  await on.keyboard.press("Escape"); await on.waitForTimeout(600); log("   after Escape: open=", await on.evaluate(()=>document.querySelector("#dr").open), "events=", await on.evaluate(()=>window.__oc.join(",")), "focus=", await on.evaluate(()=>document.activeElement.id)) }
// E. morph resilience
{ const on=await mk(true)
  log("MORPH: tab button before:", await html(on,"#t-tab-account"))
  await on.evaluate(()=>{ const btn=document.querySelector("#t-tab-account"); for(const a of [...btn.attributes]) if(a.name!=="type") btn.removeAttribute(a.name) })
  await on.waitForTimeout(100); log("  after stripping all attrs (simulated morph to bare server HTML), immediately:", await on.evaluate(()=>document.querySelector("ui-tabs-tab[value=account] button").outerHTML))
  await on.click("ui-tabs-tab[value=password] button"); await on.waitForTimeout(100); log("  after clicking other tab: stripped tab:", await on.evaluate(()=>document.querySelector("ui-tabs-tab[value=account] button").outerHTML)); log("  panel password hidden?", await on.evaluate(()=>document.querySelector("ui-tabs-panel[value=password]").hidden))
  // replace node
  await on.evaluate(()=>{ const w=document.querySelector("ui-tabs-tab[value=account]"); w.innerHTML='<button type="button">Account (new node)</button>' }); await on.waitForTimeout(100)
  log("  after replacing the <button> node:", await on.evaluate(()=>document.querySelector("ui-tabs-tab[value=account] button").outerHTML))
  // replace whole panel content + add a new tab+panel dynamically
  await on.evaluate(()=>{ const list=document.querySelector("ui-tabs-list"); list.insertAdjacentHTML("beforeend",'<ui-tabs-tab value="new"><button type="button">New</button></ui-tabs-tab>'); document.querySelector("ui-tabs").insertAdjacentHTML("beforeend",'<ui-tabs-panel value="new" hidden>New panel</ui-tabs-panel>') }); await on.waitForTimeout(100)
  log("  dynamically added tab:", await on.evaluate(()=>document.querySelector("ui-tabs-tab[value=new] button").outerHTML))
  // innerHTML replace of the whole root's children (like a partial refresh that replaces a region containing the element)
  await on.evaluate(()=>{ const sec=document.querySelector("#c-tabs"); const h=sec.innerHTML; sec.innerHTML=h }); await on.waitForTimeout(200)
  log("  after replacing the whole <ui-tabs> via innerHTML (state?):", await on.evaluate(()=>[...document.querySelectorAll("#c-tabs button")].map(b=>b.textContent+":"+b.getAttribute("aria-selected")).join(", ")))
  log("  warnings:", JSON.stringify(on.errs)) }
// F. native details exclusive accordion without JS
{ const off=await mk(false); await off.click("#c-details details:nth-of-type(2) summary"); log("DETAILS nojs exclusive: open states =", await off.evaluate(()=>[...document.querySelectorAll("#c-details details")].map(d=>d.open).join(","))) }
await b.close(); s.close()
