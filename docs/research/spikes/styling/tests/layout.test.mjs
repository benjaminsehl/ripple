import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import { readFileSync } from 'node:fs'
const r = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const css = [r('ripple/layers.css'), r('ripple/tokens.css'), r('ripple/base.css'), r('ripple/layout.css')].join('\n')
const A = r('out/layout-a.css'), AMIN = r('out/layout-a.min.css'), B = r('out/layout-b.css')
const browser = await chromium.launch()
console.log('chromium', browser.version())
const results = []
const ok = (name, got, want) => { const pass = JSON.stringify(got) === JSON.stringify(want); results.push(pass); console.log(pass ? 'PASS' : 'FAIL', name, pass ? '' : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`) }
const cs = (page, sel, prop) => page.$eval(sel, (el, prop) => getComputedStyle(el)[prop], prop)

for (const [label, layoutCss] of [['A (authored, quoted)', A], ['A (lightningcss minified, unquoted+escaped)', AMIN]]) {
  const page = await browser.newPage()
  await page.setContent(`<style>${css}\n${layoutCss}</style>
  <div id=a class=rp-stack data-gap="2 md:6 xl:10">x</div>
  <div id=b class=rp-stack data-gap="xl:10 md:6 2">attribute order reversed</div>
  <div id=c class=rp-stack data-p="2 md:6" data-px="4">p then px</div>
  <div id=d class=rp-stack data-hidden="true md:false">hidden on mobile</div>
  <div id=e class=rp-grid data-columns="2 md:4 lg:6"><i data-span="2 md:full"></i></div>
  <div id=f class=rp-stack data-direction="column md:row" data-align="stretch md:center" data-justify="md:between">dir</div>
  <div id=g class=rp-stack data-gap="0.5 md:1.5">decimal</div>
  <div id=h class=rp-stack data-gap="md:6">only md, base is component default</div>
  <div id=i class=rp-stack data-gap="16">token 16 must not match md:16 or 6</div>
  <ui-popover-content id=pop style="display:flex" data-side="bottom" data-align="center">ui-sdk writes data-align here</ui-popover-content>`)
  ok(`${label} ui-sdk data-align is not captured by the align prop`, await cs(page, '#pop', 'alignItems'), 'normal')
  for (const [w, exp] of [[375, { a: '8px', b: '8px', cpl: '16px', cpt: '8px', d: 'none', e: 2, span: 'span 2', f: 'column', fa: 'stretch', g: '2px', h: '16px', i: '64px' }],
                          [800, { a: '24px', b: '24px', cpl: '24px', cpt: '24px', d: 'flex', e: 4, span: '1 / -1', f: 'row', fa: 'center', g: '6px', h: '24px', i: '64px' }],
                          [1300, { a: '40px', b: '40px', cpl: '24px', cpt: '24px', d: 'flex', e: 6, span: '1 / -1', f: 'row', fa: 'center', g: '6px', h: '24px', i: '64px' }]]) {
    await page.setViewportSize({ width: w, height: 600 })
    const got = {
      a: await cs(page, '#a', 'rowGap'), b: await cs(page, '#b', 'rowGap'),
      cpl: await cs(page, '#c', 'paddingLeft'), cpt: await cs(page, '#c', 'paddingTop'),
      d: await cs(page, '#d', 'display'),
      e: (await cs(page, '#e', 'gridTemplateColumns')).split(' ').length,
      span: (await cs(page, '#e i', 'gridColumnStart')) === 'span 2' ? 'span 2' : (await cs(page, '#e i', 'gridColumnStart')) + ' / ' + (await cs(page, '#e i', 'gridColumnEnd')),
      f: await cs(page, '#f', 'flexDirection'), fa: await cs(page, '#f', 'alignItems'),
      g: await cs(page, '#g', 'rowGap'), h: await cs(page, '#h', 'rowGap'), i: await cs(page, '#i', 'rowGap'),
    }
    ok(`${label} @${w}px`, got, exp)
  }
  await page.close()
}

// Unescaped colon without quotes is a parse error (rule dropped); quoted or escaped both work.
{
  const page = await browser.newPage()
  await page.setContent(`<style>
    #q[data-gap~="md:6"]{outline-width:1px} #e[data-gap~=md\\:6]{outline-width:2px} #u[data-gap~=md:6]{outline-width:3px}
    div{outline:0px solid red}</style>
    <div id=q data-gap="md:6"></div><div id=e data-gap="md:6"></div><div id=u data-gap="md:6"></div>`)
  ok('colon: quoted works, escaped works, bare is dropped', [await cs(page, '#q', 'outlineWidth'), await cs(page, '#e', 'outlineWidth'), await cs(page, '#u', 'outlineWidth')], ['1px', '2px', '0px'])
  ok('querySelector with quoted colon', await page.evaluate(() => document.querySelectorAll('[data-gap~="md:6"]').length), 3)
  await page.close()
}

// Design B: correctness + the inheritance leak.
{
  const page = await browser.newPage()
  await page.setViewportSize({ width: 800, height: 600 })
  const html = `<div id=o class=rp-stack data-gap style="--gap:2;--gap-md:6;--gap-xl:10">
       <div id=n class=rp-stack data-gap style="--gap:1">nested: sets only base</div></div>
     <div id=al class=rp-stack data-align style="--align:stretch;--align-md:center"></div>`
  await page.setContent(`<style>${css}\n${B}</style>${html}`)
  ok('B outer @800 (md)', await cs(page, '#o', 'rowGap'), '24px')
  ok('B enum via inline var', await cs(page, '#al', 'alignItems'), 'center')
  const leak = await cs(page, '#n', 'rowGap')
  console.log('INFO  B nested element with only --gap:1 inside a parent with --gap-md:6 resolves to', leak, leak === '4px' ? '(no leak)' : '(LEAK: parent breakpoint value inherited)')
  // fix: register every input as non-inheriting
  const reg = ['gap', 'align'].flatMap((n) => ['', '-sm', '-md', '-lg', '-xl', '-2xl'].map((b) => `@property --${n}${b}{syntax:"*";inherits:false}`)).join('')
  await page.setContent(`<style>${css}\n${B}\n${reg}</style>${html}`)
  ok('B nested with inputs registered inherits:false', await cs(page, '#n', 'rowGap'), '4px')
  ok('B outer still right', await cs(page, '#o', 'rowGap'), '24px')
  console.log('INFO  @property rules needed for B (15 props x 6):', 15 * 6, 'extra bytes ~', 15 * 6 * 44)
  await page.close()
}

// typed attr() (CSS Values 5)
{
  const page = await browser.newPage()
  await page.setContent(`<style>#t{display:flex;gap:calc(4px * attr(data-gap type(<number>), 0))}</style><div id=t data-gap="6"></div>`)
  console.log('INFO  typed attr() in this Chromium: gap =', await cs(page, '#t', 'columnGap'), ' CSS.supports:', await page.evaluate(() => CSS.supports('gap', 'calc(4px * attr(data-gap type(<number>), 0))')))
  await page.close()
}
await browser.close()
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED')
