import { createRequire } from 'module'; const require = createRequire('/opt/node-tools/'); const { chromium } = require('playwright');
const { ssr } = require(process.cwd() + '/out/props.server.cjs'); const html = ssr(); console.log('SSR:', html);
const b = await chromium.launch();
for (const mode of ['defined-then-hydrate', 'hydrate-then-defined', 'defined-then-client-mount']) {
  const p = await b.newPage(); const cons = []; p.on('console', m => cons.push(m.text().slice(0, 600)));
  await p.setContent(`<!doctype html><body><div id="root">${mode.includes('mount') ? '' : html}</div></body>`);
  await p.addScriptTag({ path: 'out/props.client.js' });
  const st = () => p.evaluate(() => { const e = document.querySelector('x-probe'); return e.outerHTML.replace(/>[\s\S]*/, '>') + '  SETTER-CALLS=' + JSON.stringify(e.__sets || []) + ' OWNPROPS=' + JSON.stringify(Object.keys(e).filter(k => !k.startsWith('__react'))) });
  console.log('\n#### ' + mode);
  if (mode === 'defined-then-hydrate') { await p.evaluate(() => { window.__defineProbe(); window.__hydrateP() }) }
  if (mode === 'hydrate-then-defined') { await p.evaluate(() => window.__hydrateP()); await p.waitForTimeout(100); console.log('after hydrate (undefined element):', await st()); await p.evaluate(() => window.__defineProbe()) }
  if (mode === 'defined-then-client-mount') { await p.evaluate(() => { window.__defineProbe(); window.__mountP() }) }
  await p.waitForTimeout(150); console.log('step0:', await st());
  await p.evaluate(() => { const e = document.querySelector('x-probe'); for (const n of ['foo', 'Foo', '-foo', 'click']) e.dispatchEvent(new CustomEvent(n)) });
  console.log('events fired for foo, Foo, -foo, click ->', await p.evaluate(() => JSON.stringify(window.__ev)));
  await p.evaluate(() => window.__step(1)); await p.waitForTimeout(150); console.log('step1:', await st());
  console.log('console:', cons.join('\n---\n') || '(none)');
  await p.close();
}
await b.close();
