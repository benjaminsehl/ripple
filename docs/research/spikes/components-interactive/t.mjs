import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const html = `<!doctype html><html><head><style>
@layer ui-sdk, theme, base, rp, components, rmx, utilities;
@layer rp.tokens, rp.base, rp.components, rp.props;
@layer ui-sdk {
  :where([hidden]:not([hidden="until-found"])) { display: none !important; }
  @media (scripting: none) {
    ui-tabs-panel[hidden] { display: block !important; }
    ui-tabs-list { display: none !important; }
  }
}
@layer rp.base { ui-tabs, ui-tabs-list, ui-tabs-panel { display:block } }
@layer rp.components {
  @media (scripting: none) { .x-panel[hidden] { display: block !important; } }
  .rp-popover { position: fixed; inset: auto; margin: 0; padding: 8px; border: 1px solid; }
  @supports (anchor-name: --a) {
    .rp-popover { position-area: block-end span-inline-end; position-try-fallbacks: flip-block, flip-inline; margin-block: 4px; }
    .rp-popover[data-side="top"] { position-area: block-start span-inline-end; }
    .rp-popover[data-side="end"] { position-area: inline-end span-block-end; margin-block:0; margin-inline:4px }
    .rp-popover[data-side="bottom"][data-align="center"] { position-area: block-end; }
    .rp-popover[data-side="bottom"][data-align="end"] { position-area: block-end span-inline-start; }
  }
}
</style></head><body style="margin:0">
<ui-tabs><ui-tabs-list id="l">list</ui-tabs-list><ui-tabs-panel id="p1">one</ui-tabs-panel><ui-tabs-panel id="p2" hidden>two</ui-tabs-panel></ui-tabs>
<div id="x" class="x-panel" hidden>x</div>
<div style="height:200px"></div>
<button id="b" popovertarget="pop" style="margin-left:300px;width:100px;height:30px">open</button>
<div id="pop" popover class="rp-popover" data-side="bottom" data-align="start" style="width:150px;height:50px;box-sizing:border-box">hello</div>
<details name="a" id="d1" open><summary>1</summary>one</details><details name="a" id="d2"><summary>2</summary>two</details>
</body></html>`;
const b = await chromium.launch();
console.log('chromium', b.version());
for (const js of [false, true]) {
  const ctx = await b.newContext({ javaScriptEnabled: js, viewport:{width:1000,height:700} });
  const p = await ctx.newPage(); await p.setContent(html);
  const disp = async (s) => p.locator(s).evaluate(e => getComputedStyle(e).display).catch(()=> 'n/a');
  if (js) {
    console.log('js on: p2', await disp('#p2'), 'list', await disp('#l'), 'x', await disp('#x'));
    for (const [side, align] of [['bottom','start'],['bottom','center'],['bottom','end'],['top','start'],['end','start']]) {
      await p.evaluate(([s,a]) => { const e = document.getElementById('pop'); e.dataset.side = s; e.dataset.align = a; }, [side, align]);
      await p.click('#b');
      const r = await p.evaluate(() => { const q = e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round) }; return { btn: q(document.getElementById('b')), pop: q(document.getElementById('pop')), open: document.getElementById('pop').matches(':popover-open') } });
      console.log(side, align, JSON.stringify(r));
      await p.keyboard.press('Escape');
    }
    await p.click('#d2 summary');
    console.log('details exclusive: d1 open', await p.locator('#d1').evaluate(e=>e.open), 'd2 open', await p.locator('#d2').evaluate(e=>e.open));
  } else {
    // cannot evaluate with JS disabled? evaluate works via CDP even when page JS disabled
    console.log('js off: p2', await disp('#p2'), 'list', await disp('#l'), 'x(component-layer important)', await disp('#x'));
    await p.click('#b'); const bb = await p.locator('#pop').boundingBox(); console.log('nojs popover box', JSON.stringify(bb));
  }
  await ctx.close();
}
await b.close();
