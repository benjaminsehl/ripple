// Popover placement boxes (acceptance tests 5, 6, 7 of Popover).
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'node:fs';
const css = `@layer rp.tokens, rp.base, rp.components; @layer rp.base { *{box-sizing:border-box} body{margin:0} }` + fs.readFileSync('tokens.css','utf8') + fs.readFileSync('css/popover.css','utf8');
const b = await chromium.launch();
const box = (p, s) => p.locator(s).evaluate(e => { const r = e.getBoundingClientRect(); return {l:Math.round(r.left), t:Math.round(r.top), r:Math.round(r.right), b:Math.round(r.bottom)} });
for (const dir of ['ltr','rtl']) for (const top of [300, 650]) for (const side of ['bottom','top','start','end']) for (const align of ['start','center','end']) {
  if (top === 650 && side !== 'bottom') continue;
  const p = await b.newPage({ viewport: { width: 1000, height: 700 } });
  await p.setContent(`<!doctype html><html dir="${dir}"><head><style>${css}</style></head><body><button id="b" popovertarget="p" style="position:absolute;left:400px;top:${top}px;width:100px;height:40px;margin:0">B</button><div class="rp-popover" id="p" popover data-side="${side}" data-align="${align}"><p style="margin:0">Free shipping on orders.</p></div></body></html>`);
  await p.click('#b'); await p.waitForTimeout(250);
  console.log(dir, 'btnTop', top, side, align, JSON.stringify(await box(p,'#p')));
  await p.close();
}
await b.close();
