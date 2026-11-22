import { createRequire } from 'module'; const require = createRequire('/opt/node-tools/'); const { chromium } = require('playwright');
const [,, variant='min', order='elements-first', env='development', verbose] = process.argv;
const { render } = require(process.cwd() + `/out/server.${env}.cjs`);
const html = render(variant);
const b = await chromium.launch(); const p = await b.newPage();
const cons = [];
p.on('console', m => cons.push(`[${m.type()}] ${m.text().slice(0, 1500)}`)); p.on('pageerror', e => cons.push('[pageerror] ' + e.message));
await p.setContent(`<!doctype html><html><body><div id="root">${html}</div></body></html>`);
const snap = () => p.evaluate(() => { const o = {}; const walk = (el, path) => { const key = path + '/' + el.localName + (el.getAttribute('value') ? `[${el.getAttribute('value')}]` : '') ; o[key] = Object.fromEntries([...el.attributes].map(a => [a.name, a.value])); o[key]['#text'] = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.data).join('|'); [...el.children].forEach((c, i) => walk(c, key)) }; walk(document.getElementById('root').firstElementChild, ''); return o });
let prev = await snap();
const step = async (name, fn) => {
  const c0 = cons.length; await fn(); await p.waitForTimeout(250);
  const cur = await snap(); const lines = [];
  for (const k of new Set([...Object.keys(prev), ...Object.keys(cur)])) {
    if (!prev[k]) { lines.push(`  + ${k} ${JSON.stringify(cur[k])}`); continue } if (!cur[k]) { lines.push(`  - ${k}`); continue }
    const d = []; for (const a of new Set([...Object.keys(prev[k]), ...Object.keys(cur[k])])) if (prev[k][a] !== cur[k][a]) d.push(`${a}: ${JSON.stringify(prev[k][a])} -> ${JSON.stringify(cur[k][a])}`);
    if (d.length) lines.push(`  ~ ${k.split('/').slice(-2).join('/')}: ${d.join('; ')}`);
  }
  const logs = await p.evaluate(() => { const l = window.__log || []; window.__log = []; return l });
  console.log(`\n== ${name}: ${lines.length} element(s) changed`); if (verbose || lines.length < 14) console.log(lines.join('\n')); else console.log(lines.slice(0, 6).join('\n') + '\n  ...');
  if (logs.length) console.log('  app log:', logs.join(' | '));
  for (const c of cons.slice(c0)) console.log('  CONSOLE', c);
  prev = cur;
};
const define = () => p.addScriptTag({ path: 'out/elements.js' });
const hydrate = async () => { await p.addScriptTag({ path: `out/client.${env}.js` }); await p.evaluate(v => window.__hydrate(v), variant); await p.waitForFunction(() => window.__hydrated) };
console.log(`##### variant=${variant} order=${order} env=${env}`);
if (order === 'elements-first') { await step('define elements (upgrade)', define); await step('hydrate', hydrate) } else { await step('hydrate', hydrate); await step('define elements (upgrade)', define) }
await step('rerender: unrelated state (tick)', () => p.evaluate(() => window.__set({ tick: 1 })));
await step('rerender: aria-label + text + class changed', () => p.evaluate(() => window.__set({ label: 'Prefs', text: 'v2', cls: 'b' })));
await step('user clicks Password tab', () => p.click('ui-tabs-tab[value=password] button'));
await step('rerender: unrelated state (tick) after user click', () => p.evaluate(() => window.__set({ tick: 2 })));
await step('rerender: add a tab + panel via React', () => p.evaluate(() => window.__set({ extra: true })));
await step('user clicks Extra tab', () => p.click('ui-tabs-tab[value=extra] button'));
await step('React sets tab state = account (controlled only)', () => p.evaluate(() => window.__set({ tab: 'account' })));
await step('user clicks Returns accordion trigger', () => p.click('ui-accordion-item[value=returns] button'));
await step('React sets accordion value prop = ["shipping"] (array property)', () => p.evaluate(() => window.__set({ acc: ['shipping'] })));
await step('user clicks dialog trigger', () => p.click('#dlg-trigger'));
console.log('  dialog state:', await p.evaluate(() => { const d = document.querySelector('#dlg'); const c = document.querySelector('ui-dialog-content'); return JSON.stringify({ openProp: d.open, contentParent: c.parentElement.localName, contentVisible: c.checkVisibility(), popoverOpen: c.matches(':popover-open'), bodyAttrs: [...document.body.attributes].map(a => a.name + '=' + a.value), htmlAttrs: [...document.documentElement.attributes].map(a => a.name + '=' + a.value), bodyChildren: [...document.body.children].map(e => e.localName) }) }));
await step('rerender while dialog open (text v3)', () => p.evaluate(() => window.__set({ text: 'v3' })));
await step('React sets open=false (controlled only)', () => p.evaluate(() => window.__set({ open: false })));
await step('user presses Escape', () => p.keyboard.press('Escape'));
await step('React sets open=true (controlled only)', () => p.evaluate(() => window.__set({ open: true })));
console.log('  final: dialog open prop =', await p.evaluate(() => document.querySelector('#dlg').open), '; tabs value =', await p.evaluate(() => document.querySelector('#tabs').value), '; acc value =', await p.evaluate(() => JSON.stringify(document.querySelector('#acc').value)));
await b.close();
