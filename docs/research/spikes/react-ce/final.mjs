import { createRequire } from 'module'; const require = createRequire('/opt/node-tools/'); const { chromium } = require('playwright');
const { ssr } = require(process.cwd() + '/out/final.server.cjs');
const b = await chromium.launch();
console.log('SSR (uncontrolled):\n' + ssr('uncontrolled').replace(/></g, '>\n<'));
for (const mode of ['uncontrolled', 'controlled']) for (const order of ['elements-first', 'hydrate-first']) {
  const html = ssr(mode); const p = await b.newPage(); const cons = []; p.on('console', m => cons.push(`[${m.type()}] ` + m.text().slice(0, 400).replace(/\n/g, ' '))); p.on('pageerror', e => cons.push('[pageerror] ' + e.message.slice(0, 200)));
  await p.setContent(`<!doctype html><body><div id="root">${html}</div></body>`);
  await p.evaluate(() => { window.__m = []; new MutationObserver(rs => { for (const r of rs) { if (r.type === 'attributes') { const now = r.target.getAttribute(r.attributeName); if (now !== r.oldValue) window.__m.push(`${r.target.localName}@${r.attributeName}:${r.oldValue}->${now}`) } else window.__m.push(r.type + ' in ' + r.target.nodeName) } }).observe(document.getElementById('root'), { childList: true, subtree: true, characterData: true, attributes: true, attributeOldValue: true }) });
  const muts = () => p.evaluate(() => { const m = window.__m; window.__m = []; return m.length + (m.length ? ' ' + JSON.stringify(m.slice(0, 4)) : '') });
  const def = () => p.addScriptTag({ path: 'out/elements.js' }); const hyd = async () => { await p.addScriptTag({ path: 'out/final.client.js' }); await p.evaluate(m => window.__hydrateF(m), mode); await p.waitForFunction(() => window.__hydrated) };
  console.log(`\n#### final pattern mode=${mode} order=${order}`);
  if (order === 'elements-first') { await def(); await p.waitForTimeout(100); console.log('  mutations by upgrade:', await muts()); await hyd(); await p.waitForTimeout(200); console.log('  mutations by hydration:', await muts()) }
  else { await hyd(); await p.waitForTimeout(200); console.log('  mutations by hydration:', await muts()); await def(); await p.waitForTimeout(100); console.log('  mutations by upgrade:', await muts()) }
  const st = async (label) => { await p.waitForTimeout(250); console.log(`  ${label}: ` + await p.evaluate(() => JSON.stringify({ tabsValue: document.querySelector('#tabs').value, selected: [...document.querySelectorAll('[role=tab][aria-selected=true]')].map(e => e.textContent), visiblePanels: [...document.querySelectorAll('ui-tabs-panel:not([hidden])')].map(e => e.textContent), dlgOpen: document.querySelector('#dlg').open, dlgVisible: document.querySelector('ui-dialog-content').checkVisibility(), log: (() => { const l = window.__log || []; window.__log = []; return l })() }))) };
  await st('initial');
  await p.click('ui-tabs-tab[value=password] button'); await st('click Password (no prior re-render)');
  await p.evaluate(() => window.__app.setN(1)); await st('parent re-render adds Extra tab');
  await p.click('ui-tabs-tab[value=extra] button'); await st('click Extra');
  await p.evaluate(() => window.__app.setTab('account')); await st('parent sets tab=account (controlled only)');
  await p.evaluate(() => window.__app.setReject(true)); await p.click('ui-tabs-tab[value=password] button'); await st('parent REJECTS change; click Password'); await p.evaluate(() => window.__app.setReject(false));
  await p.click('#dlg-trigger'); await st('click dialog trigger');
  await p.evaluate(() => window.__app.setN(2)); await st('re-render while open');
  await p.keyboard.press('Escape'); await st('Escape');
  await p.evaluate(() => window.__app.setOpen(true)); await st('parent sets open=true (controlled only)');
  if (mode === 'controlled') { await p.click('ui-dialog-close button'); await st('click Close') }
  console.log('  CONSOLE:', cons.join(' || ') || '(none)');
  await p.close();
}
await b.close();
