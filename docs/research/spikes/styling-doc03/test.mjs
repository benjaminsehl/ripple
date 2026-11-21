import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)('playwright')
const css = readFileSync(new URL('out/ripple.min.css', import.meta.url), 'utf8')
const browser = await chromium.launch()
let fails = 0
const ok = (name, got, want) => { const pass = JSON.stringify(got) === JSON.stringify(want); if (!pass) fails++; console.log(pass ? 'PASS' : 'FAIL', name, pass ? '' : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`) }
const HELPERS = `
  window.rgb = (c, under) => { const x = document.createElement('canvas').getContext('2d', { willReadFrequently: true }); x.fillStyle = under || '#fff'; x.fillRect(0,0,1,1); x.fillStyle = c; x.fillRect(0,0,1,1); return [...x.getImageData(0,0,1,1).data].slice(0,3) }
  window.lum = ([r,g,b]) => { const f = (v) => { v/=255; return v <= 0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4 }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b) }
  window.contrastRgb = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p,q)=>q-p); return Math.round(((x+0.05)/(y+0.05))*100)/100 }
  window.tok = (el, name) => { const p = document.createElement('i'); p.style.color = 'var(' + name + ')'; el.appendChild(p); const v = getComputedStyle(p).color; p.remove(); return v }
  window.pair = (el, a, b) => { const bg = rgb(tok(el, '--color-background')); const B = rgb(tok(el, b), 'rgb(' + bg + ')'); const A = rgb(tok(el, a), 'rgb(' + B + ')'); return contrastRgb(A, B) }
`
const variants = ['primary','secondary','outline','ghost','link','destructive']
const BODY = `
<div id="light">${variants.map(v => `<button class="rp-button" data-variant="${v}" data-size="md" id="l-${v}">Label</button>`).join('')}
  <button class="rp-button" data-variant="primary" data-size="sm" id="sm">S</button>
  <button class="rp-button" data-variant="primary" data-size="lg" id="lg">L</button>
  <button class="rp-button" data-variant="primary" data-size="md" id="np">Pending</button>
  <button class="rp-button" data-variant="primary" data-size="md" data-pending="" aria-busy="true" id="pend">Pending</button>
  <div style="width:400px"><button class="rp-button" data-variant="primary" data-size="md" data-full-width="" id="full">Full</button></div>
  <button class="rp-button" data-variant="primary" data-size="md" hidden id="hid">Hidden</button>
  <a class="rp-button" data-variant="primary" data-size="md" aria-disabled="true" tabindex="-1" id="adis">A</a>
</div>
<section data-scheme="dark" id="dark">${variants.map(v => `<button class="rp-button" data-variant="${v}" data-size="md" id="d-${v}">Label</button>`).join('')}
  <div data-scheme="light" id="nested"><button class="rp-button" data-variant="primary" data-size="md" id="n-primary">Label</button></div>
</section>
<section data-scheme="brand" style="--rp-brand: oklch(0.9 0.18 100)" id="yellow"><button class="rp-button" data-variant="primary" data-size="md" id="y-primary">Label</button></section>
<div data-scheme="x" style="--rp-radius: 1rem; --rp-density: 0.5; --rp-text-scale: 1.333" id="dials"><button class="rp-button" data-variant="primary" data-size="md" id="dial-btn">Label</button></div>
<rp-cart id="cart"><button class="rp-button" data-variant="primary" data-size="md" data-rp-js="overlay" id="js-overlay">o</button><button class="rp-button" data-variant="primary" data-size="md" data-rp-js="inflow" id="js-inflow">i</button><button class="rp-button" data-variant="primary" data-size="md" data-rp-js="fallback" id="js-fallback">f</button></rp-cart>
<div class="rp-stack" id="st" data-gap="2 md:6" data-p="2 md:6" data-px="4" data-text-align="start md:center" data-hidden="true md:false">x</div>
<div dir="rtl"><span id="rtl">r</span><div dir="ltr"><span id="ltr">l</span></div></div>
`
const page = await browser.newPage()
await page.setViewportSize({ width: 375, height: 900 })
await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body>${BODY}<script>${HELPERS}</script></body></html>`)
const cs = (sel, prop) => page.$eval(sel, (el, prop) => getComputedStyle(el).getPropertyValue(prop), prop)
const pairs = [['--color-foreground','--color-background'],['--color-muted-foreground','--color-background'],['--color-muted-foreground','--color-muted'],['--color-primary-foreground','--color-primary'],['--color-secondary-foreground','--color-secondary'],['--color-accent-foreground','--color-accent'],['--color-destructive','--color-background'],['--color-success','--color-background'],['--color-warning','--color-background'],['--color-info','--color-background'],['--color-sale','--color-background'],['--color-destructive','--color-muted'],['--color-destructive-foreground','--color-destructive'],['--color-success-foreground','--color-success'],['--color-warning-foreground','--color-warning'],['--color-info-foreground','--color-info'],['--color-sale-foreground','--color-sale'],['--color-link','--color-background'],['--color-input','--color-background'],['--color-ring','--color-background'],['--color-border','--color-background']]
for (const scope of ['#light', '#dark', '#nested', '#yellow']) {
  const res = await page.evaluate(([scope, pairs]) => Object.fromEntries(pairs.map(([a, b]) => [a.replace('--color-','') + '/' + b.replace('--color-',''), pair(document.querySelector(scope), a, b)])), [scope, pairs])
  console.log(scope, JSON.stringify(res))
  const text = Object.entries(res).filter(([k]) => !k.startsWith('input/') && !k.startsWith('border/') && !k.startsWith('ring/'))
  ok(scope + ' text pairs >= 4.5', text.filter(([, v]) => v < 4.5), [])
  ok(scope + ' input and ring >= 3', [res['input/background'] >= 3, res['ring/background'] >= 3], [true, true])
}
// buttons: fg vs own bg contrast (transparent bg composited on scheme background)
for (const sc of ['l', 'd']) for (const v of variants) {
  const c = await page.$eval(`#${sc}-${v}`, (el) => { const s = getComputedStyle(el); const page = tok(el.parentElement, '--color-background'); const bg = rgb(s.backgroundColor, 'rgb(' + rgb(page) + ')'); return contrastRgb(rgb(s.color, 'rgb(' + bg + ')'), bg) })
  ok(`button ${sc}-${v} contrast ${c} >= 4.5`, c >= 4.5, true)
}
ok('default bg/fg', [await cs('#l-primary', 'background-color'), await cs('#l-primary', 'color')], [await page.evaluate(() => tok(document.body, '--color-primary')), await page.evaluate(() => tok(document.body, '--color-primary-foreground'))])
console.log('INFO primary bg', await cs('#l-primary', 'background-color'), 'fg', await cs('#l-primary', 'color'), 'dark fg', await cs('#d-primary', 'color'), 'nested fg', await cs('#n-primary', 'color'), 'nested bg', await cs('#n-primary', 'background-color'), 'yellow fg', await cs('#y-primary', 'color'))
ok('heights sm/md/lg/link', [await cs('#sm', 'min-height'), await cs('#l-primary', 'min-height'), await cs('#lg', 'min-height'), await cs('#l-link', 'min-height')], ['36px', '44px', '52px', '24px'])
ok('link underline + no padding', [await cs('#l-link', 'text-decoration-line'), await cs('#l-link', 'padding-left'), await cs('#l-primary', 'text-decoration-line')], ['underline', '0px', 'none'])
ok('outline border = input', await cs('#l-outline', 'border-top-color'), await page.evaluate(() => tok(document.body, '--color-input')))
const w = async (sel) => (await page.$eval(sel, (el) => el.getBoundingClientRect().width))
ok('pending keeps width', await w('#pend'), await w('#np'))
ok('pending hides label, spinner present', [await cs('#pend', 'color'), await page.$eval('#pend', (el) => getComputedStyle(el, '::after').borderTopWidth)], ['rgba(0, 0, 0, 0)', '2px'])
ok('full width', [await w('#full'), await cs('#full', 'display')], [400, 'flex'])
ok('hidden attr beats component display', await cs('#hid', 'display'), 'none')
ok('aria-disabled link', [await cs('#adis', 'opacity'), await cs('#adis', 'pointer-events')], ['0.5', 'none'])
// hover / active
for (const v of variants) { await page.hover(`#l-${v}`); await page.waitForTimeout(250); console.log('INFO hover', v, await cs(`#l-${v}`, 'background-color')) }
await page.hover('#d-outline'); await page.waitForTimeout(250); console.log('INFO hover dark outline', await cs('#d-outline', 'background-color'))
// focus ring
await page.mouse.move(0, 0)
await page.focus('#l-primary'); await page.keyboard.press('Tab')
const focused = await page.evaluate(() => document.activeElement.id)
ok('focus ring via keyboard on ' + focused, [await cs('#' + focused, 'outline-style'), await cs('#' + focused, 'outline-width'), await cs('#' + focused, 'outline-offset'), await cs('#' + focused, 'outline-color')], ['solid', '2px', '2px', await page.evaluate(() => tok(document.body, '--color-ring'))])
// dials
ok('dials: radius 16px, px 10px (density .5)', [await cs('#dial-btn', 'border-radius'), await cs('#dial-btn', 'padding-left'), await cs('#dial-btn', 'min-height')], ['16px', '10px', '44px'])
console.log('INFO text-4xl at 1.333', await page.$eval('#dials', (el) => { const p = document.createElement('i'); p.style.fontSize = 'var(--text-4xl)'; el.appendChild(p); const v = getComputedStyle(p).fontSize; p.remove(); return v }), 'root', await page.evaluate(() => { const p = document.createElement('i'); p.style.fontSize = 'var(--text-4xl)'; document.body.appendChild(p); const v = getComputedStyle(p).fontSize; p.remove(); return v }))
// script-state rules
ok('undefined: overlay none, inflow hidden, fallback shown', [await cs('#js-overlay', 'display'), await cs('#js-inflow', 'visibility'), await cs('#js-fallback', 'display')], ['none', 'hidden', 'inline-flex'])
ok('rp-cart display before define', await cs('#cart', 'display'), 'block')
await page.evaluate(() => customElements.define('rp-cart', class extends HTMLElement {}))
ok('defined: overlay shown, inflow visible, fallback none', [await cs('#js-overlay', 'display'), await cs('#js-inflow', 'visibility'), await cs('#js-fallback', 'display')], ['inline-flex', 'visible', 'none'])
// props
ok('props at 375', [await cs('#st', 'display')], ['none'])
await page.setViewportSize({ width: 800, height: 900 })
ok('props at 800', [await cs('#st', 'display'), await cs('#st', 'row-gap'), await cs('#st', 'padding-top'), await cs('#st', 'padding-left'), await cs('#st', 'text-align')], ['flex', '24px', '24px', '24px', 'center'])
ok('rtl dir token', [await cs('#rtl', '--rp-dir'), await cs('#ltr', '--rp-dir'), await cs('body', '--rp-dir')], ['-1', '1', '1'])
// motion
ok('motion on: transition', (await cs('#l-primary', 'transition-duration')).split(',')[0], '0.1s')
await page.emulateMedia({ reducedMotion: 'reduce' })
ok('reduced motion: no transition, no animation', [await cs('#l-primary', 'transition-duration'), await page.$eval('#pend', (el) => getComputedStyle(el, '::after').animationName)], ['0s', 'none'])
ok('box-sizing on ::after', await page.$eval('#pend', (el) => getComputedStyle(el, '::after').boxSizing), 'border-box')
await browser.close()
console.log(fails ? `${fails} FAILED` : 'ALL PASS')
