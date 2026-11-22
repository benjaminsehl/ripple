// Upgrade-idempotence probe: upgrade docs example -> serialize -> load serialization in a fresh page -> upgrade -> count mutations.
import { createRequire } from 'module'; const require = createRequire('/opt/node-tools/'); const { chromium } = require('playwright');
import fs from 'fs';
const dir = 'node_modules/@ui-sdk/web/docs/components/'; const b = await chromium.launch(); const want = process.argv.slice(2);
const observe = () => { window.__m = []; new MutationObserver(rs => { for (const r of rs) { const t = r.target.nodeType === 1 ? r.target : r.target.parentElement; if (!t || !t.closest('#root')) continue; if (r.type === 'attributes') { const now = r.target.getAttribute(r.attributeName); if (now !== r.oldValue) window.__m.push(`attr ${r.target.localName}@${r.attributeName}: ${JSON.stringify(r.oldValue)} -> ${JSON.stringify(now)}`) } else if (r.type === 'childList') { r.addedNodes.forEach(n => window.__m.push(`+${n.nodeName.toLowerCase()} in ${r.target.localName}`)); r.removedNodes.forEach(n => window.__m.push(`-${n.nodeName.toLowerCase()} from ${r.target.localName}`)) } else window.__m.push('text in ' + t.localName) } }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeOldValue: true }) };
for (const f of fs.readdirSync(dir)) {
  const name = f.replace('.md', ''); if (want.length && !want.includes(name)) continue;
  const m = fs.readFileSync(dir + f, 'utf8').match(/```html[^\n]*\n([\s\S]*?)```/); if (!m) continue;
  const src = m[1].replace(/<script[\s\S]*?<\/script>/g, '');
  const run = async (html) => { const p = await b.newPage(); await p.setContent(`<!doctype html><body><div id="root">${html}</div></body>`); await p.evaluate(observe); await p.addScriptTag({ path: 'out/all.js' }); await p.waitForTimeout(300); const r = { muts: await p.evaluate(() => window.__m), html: await p.evaluate(() => document.getElementById('root').innerHTML) }; await p.close(); return r };
  const first = await run(src); const second = await run(first.html);
  console.log(`${name}: first-upgrade mutations=${first.muts.length}; second-upgrade (of serialized result) mutations=${second.muts.length}${second.muts.length ? ' ' + JSON.stringify([...new Set(second.muts)].slice(0, 5)) : ''}`);
}
await b.close();
