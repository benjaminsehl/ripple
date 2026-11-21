import { createRequire } from 'module'; const require = createRequire('/opt/node-tools/'); const { chromium } = require('playwright');
const { ssr } = require(process.cwd() + '/out/drawer.server.cjs');
const b = await chromium.launch();
for (const wv of [false, true]) for (const order of ['elements-first', 'hydrate-first']) {
  const p = await b.newPage(); const cons = []; p.on('console', m => cons.push(`[${m.type()}] ` + m.text().slice(0, 260).replace(/\n/g, ' '))); p.on('pageerror', e => cons.push('[pageerror] ' + e.message.slice(0, 200)));
  await p.setContent(`<!doctype html><body><div id="root">${ssr(wv)}</div></body>`);
  await p.evaluate(() => { window.__first = document.querySelector('ui-drawer') });
  const def = () => p.addScriptTag({ path: 'out/elements2.js' }); const hyd = async () => { await p.addScriptTag({ path: 'out/drawer.client.js' }); await p.evaluate(w => window.__hydrateD(w), wv) };
  if (order === 'elements-first') { await def(); await p.waitForTimeout(150); await hyd() } else { await hyd(); await p.waitForTimeout(150); await def() }
  await p.waitForTimeout(300);
  const st = async (label) => { await p.waitForTimeout(250); console.log(`  ${label}: sameNode=${await p.evaluate(() => document.querySelector('ui-drawer') === window.__first)} recoverable=${JSON.stringify(await p.evaluate(() => { const r = window.__rec || []; window.__rec = []; return r }))} html=${(await p.evaluate(() => (document.querySelector('#root').innerHTML).replace(/ (data-[a-z-]+|style|aria-[a-z]+|id|role|tabindex|type|popover)="[^"]*"/g, ''))).slice(0, 420)}`); for (const c of cons.splice(0)) console.log('     CONSOLE ' + c) };
  console.log(`\n#### drawer withViewport=${wv} order=${order}`);
  await st('after both');
  await p.evaluate(() => window.__setD({ text: 'v2' })); await st('text v2');
  await p.click('#drw-t').catch(e => console.log('click fail', e.message.slice(0, 80))); await st('opened');
  await p.evaluate(() => window.__setD({ text: 'v3', extraSibling: true })); await st('text v3 + sibling inserted while open');
  await p.keyboard.press('Escape'); await st('escape');
  await p.evaluate(() => window.__setD({ show: false })); await st('unmounted');
  await p.evaluate(() => window.__setD({ show: true })); await st('remounted (client-created)');
  await p.evaluate(() => window.__setD({ text: 'v4' })); await st('text v4');
  await p.evaluate(() => window.__setD({ show: false })); await st('unmounted again');
  await p.close();
}
await b.close();
