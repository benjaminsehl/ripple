import { createRequire } from 'module'; const require = createRequire('/opt/node-tools/'); const { chromium } = require('playwright');
const { ssr } = require(process.cwd() + '/out/props.server.cjs'); const html = ssr();
const b = await chromium.launch();
for (const bundle of ['out/props.client.js', 'out/props.client.prod.js']) for (const order of ['define-first', 'hydrate-first']) {
  const p = await b.newPage();
  await p.setContent(`<!doctype html><body><div id="root">${html}</div></body>`);
  await p.addScriptTag({ path: bundle });
  if (order === 'define-first') await p.evaluate(() => { window.__defineProbe(); window.__hydrateP() }); else { await p.evaluate(() => window.__hydrateP()); await p.waitForTimeout(300); await p.evaluate(() => window.__defineProbe()) }
  await p.waitForTimeout(800);
  const fire = () => p.evaluate(() => { window.__ev = []; document.querySelector('x-probe').dispatchEvent(new CustomEvent('foo')); return JSON.stringify(window.__ev) + ' setters=' + JSON.stringify(document.querySelector('x-probe').__sets || []) });
  console.log(bundle, order, 'after hydration:', await fire());
  await p.evaluate(() => window.__step(0)); await p.waitForTimeout(200);
  console.log('   after re-render with same step (new fn identities):', await fire());
  await p.close();
}
await b.close();
