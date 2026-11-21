// Snapshot function run in page: returns per-section tree with attrs + layout
export function snap(){
  const tree=(el)=>{ const cs=getComputedStyle(el); const r=el.getBoundingClientRect();
    return { tag:el.localName, attrs:Object.fromEntries([...el.attributes].map(a=>[a.name,a.value]).sort()),
      display:cs.display, w:Math.round(r.width), h:Math.round(r.height),
      text:[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join("").slice(0,40),
      children:[...el.children].map(tree) } }
  const out={}; for(const s of document.querySelectorAll("section[id^=c-]")) out[s.id]=tree(s)
  return { sections:out, styles:[...document.querySelectorAll("style")].map(s=>({id:s.id,css:s.textContent})), adopted:document.adoptedStyleSheets.length,
    bodyChildren:[...document.body.children].map(e=>e.localName+(e.id?"#"+e.id:"")), undefinedTags:[...new Set([...document.querySelectorAll("*")].map(e=>e.localName).filter(t=>t.startsWith("ui-")&&!customElements.get(t)))] }
}
