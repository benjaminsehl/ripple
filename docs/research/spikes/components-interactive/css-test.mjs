import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'node:fs';
const read = f => fs.readFileSync(f,'utf8');
const base = `
@layer ui-sdk, theme, base, rp, components, rmx, utilities;
@layer rp.tokens, rp.base, rp.components, rp.props;
@layer ui-sdk { :where([hidden]:not([hidden="until-found"])) { display: none !important; }
  @media (scripting: none) { ui-tabs-panel[hidden] { display: block !important; } ui-tabs-list { display: none !important; } } }
@layer rp.base { *, ::before, ::after { box-sizing: border-box } :where(body){margin:0;font-family:var(--font-sans);font-size:var(--text-base)} :where(button,input,select,textarea){font:inherit;color:inherit}
  :where(:focus-visible){outline: var(--rp-ring-width) solid var(--color-ring); outline-offset: var(--rp-ring-offset)} :where(dialog, main):focus-visible { outline: none; }
  :where(ui-tabs-tab, ui-tooltip-trigger) { display: contents } :where(rp-dialog, rp-carousel, rp-quantity, ui-tabs, ui-tabs-list, ui-tabs-panel, ui-toast-region) { display:block } rp-dialog { position:absolute; inline-size:0; block-size:0 } }
@layer rp.props { :where(rp-carousel, rp-quantity):not(:defined) [data-rp-js="inflow"] { visibility: hidden } }
`;
const css = base + read('tokens.css') + ['dialog','drawer','popover','accordion','tabs','tooltip','toast','carousel','quantity-input'].map(n=>read('css/'+n+'.css')).join('\n');
const body = `
<button id="o1" commandfor="d1" command="show-modal">open</button>
<rp-dialog class="rp-dialog" data-slot="rp-dialog"><dialog class="rp-dialog-panel" id="d1" data-size="md" aria-labelledby="d1-title" closedby="any"><div class="rp-dialog-header"><h2 class="rp-dialog-title" id="d1-title">Size guide</h2><button commandfor="d1" command="close">x</button></div><div class="rp-dialog-body"><p>Measure across the chest.</p></div><div class="rp-dialog-footer"><button>OK</button></div></dialog></rp-dialog>
<rp-dialog class="rp-dialog" data-slot="rp-dialog"><dialog class="rp-dialog-panel" id="d2" data-size="full" aria-labelledby="d2-title"><h2 class="rp-dialog-title" id="d2-title">Full</h2></dialog></rp-dialog>
<rp-dialog class="rp-drawer" data-slot="rp-dialog"><dialog class="rp-drawer-panel" id="w1" data-side="end" aria-labelledby="w1-title"><div class="rp-drawer-header"><h2 class="rp-drawer-title" id="w1-title">Filters</h2></div><div class="rp-drawer-body"><p style="height:2000px">long</p></div><div class="rp-drawer-footer"><button>Apply</button></div></dialog></rp-dialog>
<rp-dialog class="rp-drawer" data-slot="rp-dialog"><dialog class="rp-drawer-panel" id="w2" data-side="start" aria-labelledby="w2-title"><h2 class="rp-drawer-title" id="w2-title">Menu</h2></dialog></rp-dialog>
<rp-dialog class="rp-drawer" data-slot="rp-dialog"><dialog class="rp-drawer-panel" id="w3" data-side="bottom" aria-labelledby="w3-title"><h2 class="rp-drawer-title" id="w3-title">Sheet</h2></dialog></rp-dialog>
<div style="height:120px"></div>
<button id="pb" popovertarget="p1" style="margin-inline-start:300px">Shipping</button>
<div class="rp-popover" id="p1" popover data-side="bottom" data-align="start"><p class="rp-popover-title" id="p1-title">Shipping</p><p style="margin:0">Free shipping on orders over $50.</p></div>
<div class="rp-accordion" id="faq" data-type="single"><details class="rp-accordion-item" name="faq" open><summary class="rp-accordion-trigger">Shipping</summary><div class="rp-accordion-content"><p>Ships in two days.</p></div></details><details class="rp-accordion-item" name="faq"><summary class="rp-accordion-trigger">Returns</summary><div class="rp-accordion-content"><p>Thirty days.</p></div></details></div>
<rp-carousel class="rp-carousel" id="c1" data-columns="2 md:4" role="group" aria-roledescription="carousel" aria-label="Featured" data-slot="rp-carousel"><button class="rp-carousel-control" type="button" disabled aria-controls="c1-list" aria-label="Previous" data-rp-part="prev" data-rp-js="inflow">&lt;</button><ul class="rp-carousel-viewport" id="c1-list" tabindex="0" data-rp-part="viewport">${[1,2,3,4,5,6].map(i=>`<li class="rp-carousel-item" data-rp-part="item"><div style="height:80px;background:#ccc">${i}</div></li>`).join('')}</ul><button class="rp-carousel-control" type="button" aria-controls="c1-list" aria-label="Next" data-rp-part="next" data-rp-js="inflow">&gt;</button></rp-carousel>
<rp-quantity class="rp-quantity" id="q" data-size="md" data-slot="rp-quantity"><button class="rp-quantity-button" type="button" disabled aria-label="Decrease quantity" data-rp-part="decrement" data-rp-js="inflow">-</button><input class="rp-quantity-input" type="number" name="quantity" value="1" min="1" step="1" inputmode="numeric" aria-label="Quantity" data-rp-part="input"><button class="rp-quantity-button" type="button" aria-label="Increase quantity" data-rp-part="increment" data-rp-js="inflow">+</button></rp-quantity>
<ui-tabs class="rp-tabs" id="t"><ui-tabs-list class="rp-tabs-list" role="tablist"><ui-tabs-tab role="none"><button class="rp-tabs-tab" role="tab" aria-selected="true" data-selected>A</button></ui-tabs-tab><ui-tabs-tab role="none"><button class="rp-tabs-tab" role="tab" aria-selected="false">B</button></ui-tabs-tab></ui-tabs-list><ui-tabs-panel class="rp-tabs-panel">a</ui-tabs-panel><ui-tabs-panel class="rp-tabs-panel" hidden>b</ui-tabs-panel></ui-tabs>
`;
const b = await chromium.launch();
const box = (p, s) => p.locator(s).first().evaluate(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round).join(',') });
for (const [w, dir] of [[1000,'ltr'],[600,'rtl']]) {
  const p = await b.newPage({ viewport: { width: w, height: 700 } });
  await p.setContent(`<!doctype html><html dir="${dir}"><head><style>${css}</style></head><body>${body}</body></html>`);
  console.log(`--- ${w}px ${dir}`);
  console.log('closed dialog display', await p.locator('#d1').evaluate(e=>getComputedStyle(e).display), 'rp-dialog box', await box(p,'rp-dialog'));
  await p.click('#o1'); await p.waitForTimeout(450);
  console.log('dialog md box', await box(p,'#d1'), 'display', await p.locator('#d1').evaluate(e=>getComputedStyle(e).display), 'opacity', await p.locator('#d1').evaluate(e=>getComputedStyle(e).opacity), 'backdrop', await p.locator('#d1').evaluate(e=>getComputedStyle(e,'::backdrop').backgroundColor));
  console.log('header: title', await box(p,'#d1-title'), 'close', await box(p,'#d1 [command=close]'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(350);
  for (const id of ['d2','w1','w2','w3']) { await p.evaluate(i=>document.getElementById(i).showModal(), id); await p.waitForTimeout(450); console.log(id, await box(p,'#'+id), id==='w1' ? 'body '+await box(p,'#w1 .rp-drawer-body')+' footer '+await box(p,'#w1 .rp-drawer-footer') : ''); await p.evaluate(i=>document.getElementById(i).close(), id); await p.waitForTimeout(300); }
  console.log('closed after transition display', await p.locator('#w1').evaluate(e=>getComputedStyle(e).display));
  await p.click('#pb'); await p.waitForTimeout(300); console.log('popover btn', await box(p,'#pb'), 'pop', await box(p,'#p1'), 'opacity', await p.locator('#p1').evaluate(e=>getComputedStyle(e).opacity)); await p.keyboard.press('Escape');
  console.log('accordion trigger', await box(p,'.rp-accordion-trigger'), 'marker display', await p.locator('.rp-accordion-trigger').first().evaluate(e=>getComputedStyle(e).listStyleType));
  console.log('carousel root', await box(p,'#c1'), 'viewport', await box(p,'#c1-list'), 'item1', await box(p,'#c1 li:nth-child(1)'), 'item2', await box(p,'#c1 li:nth-child(2)'), 'prev visibility', await p.locator('#c1 [data-rp-part=prev]').evaluate(e=>getComputedStyle(e).visibility), 'scrollW', await p.locator('#c1-list').evaluate(e=>e.scrollWidth+'/'+e.clientWidth));
  console.log('quantity root', await box(p,'#q'), 'input', await box(p,'#q input'), 'btn', await box(p,'#q button'));
  console.log('tabs list', await box(p,'.rp-tabs-list'), 'tab', await box(p,'.rp-tabs-tab'), 'selected border', await p.locator('.rp-tabs-tab').first().evaluate(e=>getComputedStyle(e).borderBlockEndColor));
  await p.screenshot({ path: `shot-${w}.png`, fullPage: true });
  await p.evaluate(()=>document.getElementById('d1').showModal()); await p.waitForTimeout(450); await p.screenshot({ path: `shot-${w}-dialog.png` });
  await p.evaluate(()=>{document.getElementById('d1').close(); document.getElementById('w1').showModal()}); await p.waitForTimeout(450); await p.screenshot({ path: `shot-${w}-drawer.png` });
  await p.close();
}
await b.close();
