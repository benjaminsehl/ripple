import { createRequire } from 'module'; const require = createRequire('/opt/node-tools/'); const { chromium } = require('playwright');
import fs from 'fs';
const dir = 'node_modules/@ui-sdk/web/docs/components/'; const b = await chromium.launch();
const want = process.argv.slice(2);
for (const f of fs.readdirSync(dir)) {
  const name = f.replace('.md', ''); if (want.length && !want.includes(name)) continue;
  const m = fs.readFileSync(dir + f, 'utf8').match(/```html[^\n]*\n([\s\S]*?)```/); if (!m) { console.log(name, ': no html example'); continue }
  m[1] = m[1].replace(/<script[\s\S]*?<\/script>/g, ""); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 100)));
  await p.setContent(`<!doctype html><body><div id="root">${m[1]}</div></body>`);
  await p.evaluate(() => { window.__m = []; const d = (n) => n.nodeType === 1 ? `<${n.localName}${n.getAttribute('data-slot') ? ' data-slot=' + n.getAttribute('data-slot') : ''}${n.getAttribute('type') ? ' type=' + n.getAttribute('type') : ''}>` : n.nodeType === 3 ? `#text(${JSON.stringify(n.data.slice(0, 20))})` : '#' + n.nodeName; new MutationObserver(rs => { for (const r of rs) { if (r.type === 'characterData') { window.__m.push('text-change in ' + d(r.target.parentNode)); continue } const par = d(r.target) + (r.target === document.body ? '' : ''); r.addedNodes.forEach(n => window.__m.push(`+${d(n)} in ${par}`)); r.removedNodes.forEach(n => window.__m.push(`-${d(n)} from ${par}`)) } }).observe(document.documentElement, { childList: true, subtree: true, characterData: true }) });
  await p.addScriptTag({ path: 'out/all.js' }); await p.waitForTimeout(250);
  const up = await p.evaluate(() => { const r = window.__m.filter(x => !x.startsWith('+<script') && !x.includes('<style>')); window.__m = []; return r });
  // click the first trigger-like button to open popups
  const trig = await p.$('[data-slot$="trigger"]'); let open = [];
  if (trig) { await trig.click({ force: true }).catch(() => {}); await p.waitForTimeout(250); open = (await p.evaluate(() => window.__m || []).catch(() => ['<navigated>'])).filter(x => !x.includes('<style>')) }
  console.log(`${name}: upgrade childList=${up.length ? JSON.stringify([...new Set(up)].slice(0, 6)) : 'NONE'}${trig ? ` | on-open=${open.length ? JSON.stringify([...new Set(open)].slice(0, 6)) : 'NONE'}` : ''}${errs.length ? ' ERR ' + errs[0] : ''}`);
  await p.close();
}
await b.close();
