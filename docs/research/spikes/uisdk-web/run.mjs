import { createRequire } from "node:module"; const { chromium } = createRequire(import.meta.url)("playwright"); import fs from "node:fs"; import { start, requests } from "./server.mjs"; import { snap } from "./snap.mjs"
const page_ = process.argv[2] || "all-bare.html"
const s = await start(); const b = await chromium.launch()
const off = await (await b.newContext({javaScriptEnabled:false})).newPage(); await off.goto("http://localhost:4173/"+page_)
// with JS disabled page.evaluate still works (CDP), so snapshot is fine
const before = await off.evaluate(snap)
const onCtx = await b.newContext(); const on = await onCtx.newPage(); const logs=[]; on.on("console",m=>logs.push(m.type()+": "+m.text())); on.on("pageerror",e=>logs.push("pageerror: "+e.message))
const t0=Date.now(); await on.goto("http://localhost:4173/"+page_)
await on.waitForFunction(()=>[...document.querySelectorAll("*")].every(e=>!e.localName.startsWith("ui-")||customElements.get(e.localName)),null,{timeout:15000}).catch(e=>logs.push("timeout waiting define"))
await on.waitForTimeout(500)
const after = await on.evaluate(snap)
const lines=[]
const fmt=(a)=>Object.entries(a).map(([k,v])=>v===""?k:`${k}="${v}"`).join(" ")
function diff(a,b,path){
  const p=path+"/"+b.tag
  if(!a){ lines.push(`  + NEW ${p} <${b.tag} ${fmt(b.attrs)}> text="${b.text}" display=${b.display}`); b.children.forEach(c=>diff(null,c,p)); return }
  const add=[],chg=[],rem=[]
  for(const [k,v] of Object.entries(b.attrs)) if(!(k in a.attrs)) add.push(v===""?k:`${k}="${v}"`); else if(a.attrs[k]!==v) chg.push(`${k}: "${a.attrs[k]}" -> "${v}"`)
  for(const k of Object.keys(a.attrs)) if(!(k in b.attrs)) rem.push(k)
  const lay=[]; if(a.display!==b.display) lay.push(`display ${a.display}->${b.display}`); if(a.w!==b.w||a.h!==b.h) lay.push(`box ${a.w}x${a.h}->${b.w}x${b.h}`)
  if(a.text!==b.text) lay.push(`text "${a.text}"->"${b.text}"`)
  if(add.length||chg.length||rem.length||lay.length) lines.push(`  ${p}${a.attrs.value?`[value=${a.attrs.value}]`:""}\n      added: ${add.join(" ")||"-"}${chg.length?"\n      changed: "+chg.join("; "):""}${rem.length?"\n      removed: "+rem.join(" "):""}${lay.length?"\n      layout: "+lay.join("; "):""}`)
  const at=a.children.map(c=>c.tag).join(","), bt=b.children.map(c=>c.tag).join(",")
  if(at!==bt){ lines.push(`  ${p} CHILDREN CHANGED: [${at}] -> [${bt}]`)
    // align by tag sequence greedily
    let i=0; for(const c of b.children){ const j=a.children.findIndex((x,k)=>k>=i&&x.tag===c.tag); if(j>=0){diff(a.children[j],c,p); i=j+1} else diff(null,c,p) }
  } else b.children.forEach((c,i)=>diff(a.children[i],c,p))
}
for(const id of Object.keys(after.sections)){ lines.push(`\n## ${id}`); diff(before.sections[id],after.sections[id],"") }
lines.push("\n## injected <style> after upgrade"); for(const st of after.styles) lines.push(`<style id="${st.id}">\n${st.css}\n</style>`)
lines.push("\nstyles before: "+before.styles.length+", adoptedStyleSheets after: "+after.adopted)
lines.push("body children after: "+after.bodyChildren.join(", "))
lines.push("undefined ui-* tags after: "+after.undefinedTags.join(", "))
lines.push("\n## console\n"+logs.join("\n"))
lines.push("\n## requests ("+requests.length+")\n"+[...new Set(requests)].join("\n"))
const name=page_.replace(".html","")
fs.mkdirSync("out",{recursive:true}); fs.writeFileSync(`out/${name}.diff.txt`,lines.join("\n")); fs.writeFileSync(`out/${name}.before.json`,JSON.stringify(before,null,1)); fs.writeFileSync(`out/${name}.after.json`,JSON.stringify(after,null,1))
await off.screenshot({path:`out/${name}.nojs.png`,fullPage:true}); await on.screenshot({path:`out/${name}.js.png`,fullPage:true})
await b.close(); s.close(); console.log(lines.join("\n"))
