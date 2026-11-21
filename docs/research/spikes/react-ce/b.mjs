import { createRequire } from 'module'; const require = createRequire('/opt/node-tools/'); const { chromium } = require('playwright');
const { ssr } = require(process.cwd() + '/out/b.server.cjs'); import fs from 'fs';
const b = await chromium.launch();
for (const asCE of [false, true]) {
  let html; try { html = ssr(asCE) } catch (e) { console.log('SSR error asCE=' + asCE, e.message.slice(0, 300)); continue }
  console.log(`\n#### @ui-sdk/react SSR (asCE=${asCE}):\n` + html.replace(/></g, '>\n<'));
  const p = await b.newPage(); const cons = []; p.on('console', m => cons.push(`[${m.type()}] ` + m.text().slice(0, 300))); p.on('pageerror', e => cons.push('[pageerror] ' + e.message.slice(0, 200)));
  await p.setContent(`<!doctype html><body><div id="root">${html}</div></body>`);
  await p.addScriptTag({ path: 'out/b.client.js' }); await p.evaluate(a => window.__hydrateB(a), asCE); await p.waitForTimeout(400);
  const after = await p.evaluate(() => document.getElementById('root').innerHTML);
  console.log(`-- after hydration identical to SSR: ${after === html}`); if (after !== html) { const a = html.split(/(?=<)/), c = after.split(/(?=<)/); for (let i = 0; i < Math.max(a.length, c.length); i++) if (a[i] !== c[i]) console.log(`   ssr:   ${a[i]}\n   hydr:  ${c[i]}`) }
  fs.writeFileSync(`out/b.${asCE ? 'ce' : 'plain'}.html`, after);
  console.log('-- console:', cons.join(' || ') || '(none)');
  await p.close();
}
await b.close();
