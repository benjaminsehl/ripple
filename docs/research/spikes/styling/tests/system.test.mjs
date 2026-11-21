import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)('playwright')
const r = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const PLAIN = ['ripple/layers.css', 'ripple/tokens.css', 'ripple/base.css', 'ripple/layout.css', 'ripple/button.css', 'out/layout-a.css'].map(r).join('\n')
const browser = await chromium.launch()
const results = []
const ok = (name, got, want) => { const pass = JSON.stringify(got) === JSON.stringify(want); results.push(pass); console.log(pass ? 'PASS' : 'FAIL', name, pass ? '' : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`) }
const cs = (page, sel, prop) => page.$eval(sel, (el, prop) => getComputedStyle(el).getPropertyValue(prop), prop)
// helpers injected in the page: sRGB bytes of any CSS color, WCAG contrast
const HELPERS = `
  window.rgb = (c) => { const x = document.createElement('canvas').getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0,0,1,1); x.fillStyle = c; x.fillRect(0,0,1,1); return [...x.getImageData(0,0,1,1).data].slice(0,3) }
  window.lum = ([r,g,b]) => { const f = (v) => { v/=255; return v <= 0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4 }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b) }
  window.contrast = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((p,q)=>q-p); return Math.round(((x+0.05)/(y+0.05))*100)/100 }
  window.tok = (el, name) => { const p = document.createElement('i'); p.style.color = 'var(' + name + ')'; el.appendChild(p); const v = getComputedStyle(p).color; p.remove(); return v }
`

// ---------- 1. Tailwind build: layer precedence ----------
{
  const page = await browser.newPage()
  await page.setContent(`<style>${r('tw/app.out.css')}</style>${r('tw/page.html')}`)
  await page.setViewportSize({ width: 375, height: 700 })
  ok('TW utility gap-8 beats data-gap (375)', await cs(page, '#u1', 'row-gap'), '32px')
  ok('TW md:gap-10 not active at 375 -> prop wins', await cs(page, '#u2', 'row-gap'), '8px')
  await page.setViewportSize({ width: 800, height: 700 })
  ok('TW md:gap-10 beats data-gap md:6 (800)', await cs(page, '#u2', 'row-gap'), '40px')
  ok('TW utilities beat component CSS', [await cs(page, '#b2', 'border-radius'), await cs(page, '#b2', 'height')], ['0px', '80px'])
  ok('TW user @layer components beats rp', await cs(page, '#b3', 'background-color'), 'rgb(0, 128, 0)')
  ok('TW outline lg', [await cs(page, '#b4', 'background-color'), await cs(page, '#b4', 'min-height')], ['rgba(0, 0, 0, 0)', '52px'])
  ok('TW token utilities read Ripple vars', [await cs(page, '#t1', 'border-radius'), await cs(page, '#t1', 'z-index'), await cs(page, '#t1', 'transition-duration'), await cs(page, '#t1', 'max-width'), await cs(page, '#t1', 'height'), await cs(page, '#t1', 'padding-top')], ['6px', '20', '0.1s', '1280px', '44px', '16px'])
  console.log('INFO  text-lg computed', await cs(page, '#t1', 'font-size'))
  // dial change is seen by Tailwind utilities
  await page.evaluate(() => { document.documentElement.style.setProperty('--rp-radius', '1rem'); document.documentElement.style.setProperty('--rp-density', '0.5') })
  await page.waitForTimeout(300) // #t1 has duration-fast with transition-property:all
  ok('TW utilities follow dials (radius 1rem, density .5)', [await cs(page, '#t1', 'border-radius'), await cs(page, '#t1', 'padding-top'), await cs(page, '#u1', 'row-gap')], ['12px', '8px', '16px'])
  console.log('INFO  @apply button vs plain button:', { apply_bg: await cs(page, '#a1', 'background-color'), plain_bg: await cs(page, '#b1', 'background-color'), apply_h: await cs(page, '#a1', 'min-height'), apply_border: await cs(page, '#a1', 'border-top-style') })
  await page.close()
}

// ---------- 2. No build: plain CSS only ----------
const page = await browser.newPage()
await page.setViewportSize({ width: 900, height: 900 })
const BODY = `
<div class="rp-container rp-stack" data-gap="6" data-py="8">
  <div class="rp-inline" id="row">
    <button class="rp-button" id="solid">Add to cart</button>
    <button class="rp-button" data-variant="soft">Soft</button>
    <button class="rp-button" data-variant="outline">Outline</button>
    <button class="rp-button" data-variant="ghost">Ghost</button>
    <button class="rp-button" data-variant="link">Link</button>
    <button class="rp-button" data-tone="destructive">Remove</button>
    <button class="rp-button" data-tone="destructive" data-variant="soft">Remove</button>
    <button class="rp-button" data-tone="destructive" data-variant="outline">Remove</button>
    <button class="rp-button" data-size="sm" id="sm">Small</button>
    <button class="rp-button" data-size="lg" id="lg">Large</button>
    <button class="rp-button" disabled>Disabled</button>
    <button class="rp-button" data-pending aria-busy="true" id="pending">Pending</button>
    <button class="rp-button" data-variant="outline" data-pending>Pending</button>
  </div>
  <p style="margin:0;color:var(--color-muted-foreground)">Muted text <span style="color:var(--color-destructive)">destructive</span> <span style="color:var(--color-success)">success</span> <span style="color:var(--color-warning)">warning</span> <span style="color:var(--color-info)">info</span></p>
  <div class="rp-card" id="card">card <input style="border:1px solid var(--color-input);border-radius:var(--radius-field);background:transparent;height:var(--spacing-control-md);padding:0 12px" value="input"></div>
</div>`
await page.setContent(`<style>${PLAIN}</style><script>${HELPERS}</script>
<div id="light">${BODY}</div>
<div id="dark" data-scheme="dark">${BODY.replaceAll('id="', 'id="d-')}</div>
<div id="brand" data-scheme style="--rp-brand: oklch(0.85 0.17 90); --rp-background: oklch(0.98 0.01 90)">${BODY.replaceAll('id="', 'id="y-')}</div>
<div id="pill" data-scheme style="--rp-radius: 1rem; --radius-control: 9999px; --rp-brand: oklch(0.55 0.22 265); --rp-density: 0.8; --rp-text-scale: 1.333">${BODY.replaceAll('id="', 'id="p-')}<h2 style="font-size:var(--text-4xl);margin:0;padding:0 16px">Heading 4xl</h2></div>`)
ok('no-build: solid button', [await cs(page, '#solid', 'min-height'), await cs(page, '#solid', 'border-radius'), await cs(page, '#solid', 'padding-left')], ['44px', '8px', '20px'])
ok('no-build: sizes', [await cs(page, '#sm', 'min-height'), await cs(page, '#lg', 'min-height')], ['36px', '52px'])
ok('pending keeps width (no shift): pending width == its label width class', (await page.$eval('#pending', (e) => e.getBoundingClientRect().width)) > 60, true)
ok('scheme re-scope recomputes derived tokens', await page.evaluate(() => tok(document.querySelector('#light'), '--color-muted') !== tok(document.querySelector('#dark'), '--color-muted')), true)
ok('local dials: radius pill + density .8', [await cs(page, '#p-solid', 'border-radius'), await cs(page, '#p-solid', 'padding-left'), await cs(page, '#p-card', 'border-radius')], ['9999px', '16px', '24px'])
ok('light brand (yellow): non-solid variants stay readable', await page.evaluate(() => ['soft','outline','ghost','link'].map((v) => contrast(getComputedStyle(document.querySelector('#brand .rp-button[data-variant=' + v + ']')).color, tok(document.querySelector('#brand'), '--color-background')) >= 4.5)), [true, true, true, true])
console.log('INFO  text-4xl @ scale 1.2 =', await page.evaluate(() => { const i = document.createElement('i'); i.style.fontSize = 'var(--text-4xl)'; document.querySelector('#light').append(i); const v = getComputedStyle(i).fontSize; i.remove(); return v }), ' @ scale 1.333 =', await page.$eval('#pill h2', (e) => getComputedStyle(e).fontSize))

// contrast table
const table = await page.evaluate(() => {
  const out = {}
  for (const id of ['light', 'dark', 'brand', 'pill']) {
    const el = document.querySelector('#' + id), t = (n) => tok(el, n)
    out[id] = {
      'fg/bg': contrast(t('--color-foreground'), t('--color-background')),
      'muted-fg/bg': contrast(t('--color-muted-foreground'), t('--color-background')),
      'muted-fg/muted': contrast(t('--color-muted-foreground'), t('--color-muted')),
      'primary-fg/primary': contrast(t('--color-primary-foreground'), t('--color-primary')),
      'destructive/bg': contrast(t('--color-destructive'), t('--color-background')),
      'success/bg': contrast(t('--color-success'), t('--color-background')),
      'warning/bg': contrast(t('--color-warning'), t('--color-background')),
      'info/bg': contrast(t('--color-info'), t('--color-background')),
      'destr-fg/destr': contrast(t('--color-destructive-foreground'), t('--color-destructive')),
      'success-fg/success': contrast(t('--color-success-foreground'), t('--color-success')),
      'warning-fg/warning': contrast(t('--color-warning-foreground'), t('--color-warning')),
      'input-border/bg (3:1)': contrast(t('--color-input'), t('--color-background')),
      'border/bg': contrast(t('--color-border'), t('--color-background')),
      'destructive/muted': contrast(t('--color-destructive'), t('--color-muted')),
    }
  }
  return out
})
console.table(table)
const bad = Object.entries(table).flatMap(([s, row]) => Object.entries(row).filter(([k, v]) => !k.startsWith('border') && v < (k.includes('3:1') ? 3 : 4.5)).map(([k, v]) => `${s} ${k}=${v}`))
console.log(bad.length ? 'CONTRAST BELOW THRESHOLD: ' + bad.join('; ') : 'contrast: all text pairs >= 4.5, input border >= 3')

// auto contrast sweep: is the pick always the better of black/white?
const sweep = await page.evaluate(() => {
  const host = document.createElement('div'); host.setAttribute('data-scheme', ''); document.body.append(host)
  let outOfGamut = 0, n = 0, wrong = 0, min = 99, minAt = '', heuristicWrong = 0
  for (let l = 0.05; l <= 0.99; l += 0.03) for (let c = 0; c <= 0.3; c += 0.06) for (let h = 0; h < 360; h += 20) {
    const brand = `oklch(${l.toFixed(2)} ${c.toFixed(2)} ${h})`
    host.style.setProperty('--rp-brand', brand)
    const probe = document.createElement('i'); probe.style.color = `rgb(from ${brand} r g b)`; host.append(probe)
    const ch = getComputedStyle(probe).color.match(/-?[\d.]+/g).slice(0, 3).map(Number); probe.remove()
    if (ch.some((v) => v < -0.0005 || v > 1.0005)) { outOfGamut++; continue }
    const p = tok(host, '--color-primary'), f = tok(host, '--color-primary-foreground')
    const got = contrast(f, p), w = contrast('#fff', p), b = contrast('#000', p)
    n++; if (got < Math.max(w, b) - 0.3) wrong++
    if (got < min) { min = got; minAt = brand }
    // the base theme's heuristic: brightness > 128 -> black
    const [r, g, bl] = rgb(p); const bright = (r * 299 + g * 587 + bl * 114) / 1000
    if ((bright > 128 ? b : w) < Math.max(w, b) - 0.3) heuristicWrong++
  }
  host.remove(); return { outOfGamutSkipped: outOfGamut, samples: n, wrongPicks: wrong, minContrast: min, minAt, baseThemeBrightnessHeuristicWrongPicks: heuristicWrong }
})
console.log('INFO  auto-contrast sweep', sweep)
await page.screenshot({ path: new URL('../out/system.png', import.meta.url).pathname, fullPage: true })

// counter-test: derive only on :root -> scheme does not recompute
{
  const broken = PLAIN.replaceAll(/:root,\s*\[data-scheme\] \{/g, ':root {')
  const p2 = await browser.newPage()
  await p2.setContent(`<style>${broken}</style><script>${HELPERS}</script><div id="light"></div><div id="dark" data-scheme="dark"></div>`)
  ok('COUNTER-TEST derived tokens on :root only: dark scheme background unchanged (bug)', await p2.evaluate(() => tok(document.querySelector('#light'), '--color-background') === tok(document.querySelector('#dark'), '--color-background')), true)
  await p2.close()
}
await page.close()

// ---------- 3. Pre-upgrade layout shift: see tests/cls.test.mjs ----------
await browser.close()
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED')
