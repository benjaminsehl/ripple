// Layout shift when custom elements upgrade, with and without static pre-upgrade display rules.
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const b = await chromium.launch()
const STATIC = `:where(ui-dialog-trigger,rp-product-form){display:contents}:where(rp-price,rp-inventory){display:block}`
for (const [label, staticRules] of [['WITHOUT static display rules', ''], ['WITH static display rules', STATIC]]) {
  const p = await b.newPage()
  await p.setViewportSize({ width: 600, height: 800 })
  await p.setContent(`<style>@layer ui-sdk, rp; @layer rp{body{margin:0} .stack{display:flex;flex-direction:column;gap:16px} .row{display:flex;gap:8px} button{height:44px} .full{width:100%} ${staticRules}}</style>
  <script>window.cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.cls += e.value }).observe({ type: 'layout-shift', buffered: true })</script>
  <div class="row" id="r"><ui-dialog-trigger><button>Open</button></ui-dialog-trigger><rp-cart-count>3</rp-cart-count><a href="#">Account</a></div>
  <div class="stack"><rp-product-form><div>Options</div><div>Quantity</div><button class="full">Add</button></rp-product-form></div>
  <rp-price>$10.00</rp-price><rp-inventory>In stock</rp-inventory>
  <div id="after" style="height:50px;background:#ddd">after</div>`)
  const m = () => p.evaluate(() => ({ afterTop: document.querySelector('#after').getBoundingClientRect().top, cls: +window.cls.toFixed(4) }))
  const before = await m()
  await p.waitForTimeout(200)
  await p.evaluate(() => {
    for (const t of ['ui-dialog-trigger', 'rp-cart-count', 'rp-product-form', 'rp-price', 'rp-inventory']) customElements.define(t, class extends HTMLElement {})
    // what ui-sdk injects when parts upgrade (uisdk-web-elements.md section 6)
    const s = document.createElement('style'); s.textContent = '@layer ui-sdk{:where(ui-dialog-trigger,rp-product-form){display:contents}:where(rp-price,rp-inventory){display:block}}'; document.head.prepend(s)
  })
  await p.waitForTimeout(300)
  console.log(label, 'before', before, 'after', await m())
  await p.close()
}
// :not(:defined) hiding: visibility keeps the box, display:none collapses it
{
  const p = await b.newPage()
  await p.setContent(`<style>body{margin:0} rp-quantity{display:flex;gap:4px} button{width:44px;height:44px}
    rp-quantity:not(:defined) [data-js="inflow"]{visibility:hidden} rp-quantity.none:not(:defined) [data-js="inflow"]{display:none}</style>
    <rp-quantity id="v"><button data-js="inflow">-</button><input size="2"><button data-js="inflow">+</button></rp-quantity>
    <rp-quantity id="n" class="none"><button data-js="inflow">-</button><input size="2"><button data-js="inflow">+</button></rp-quantity>`)
  const w = () => p.evaluate(() => [...document.querySelectorAll('rp-quantity')].map((e) => Math.round(e.querySelector('input').getBoundingClientRect().left)))
  const before = await w()
  await p.evaluate(() => customElements.define('rp-quantity', class extends HTMLElement {}))
  console.log(':not(:defined) input x-position [visibility:hidden, display:none] before', before, 'after define', await w())
  await p.close()
}
await b.close()
