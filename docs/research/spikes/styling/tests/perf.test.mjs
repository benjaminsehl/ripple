// Style recalc cost: 894 attribute-token rules (design A) vs the same matrix as Tailwind classes.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)('playwright')
const r = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const b = await chromium.launch()
const N = 5000
const run = async (label, css, attrs) => {
  const p = await b.newPage()
  await p.setContent(`<style>:root{--spacing:.25rem}${css}</style><div id=root></div>`)
  const ms = await p.evaluate(({ N, attrs }) => {
    const root = document.getElementById('root'); let h = ''
    for (let i = 0; i < N; i++) h += `<div ${attrs}><span>x</span></div>`
    const times = []
    for (let k = 0; k < 7; k++) { root.innerHTML = ''; root.offsetHeight; root.innerHTML = h; const t = performance.now(); root.offsetHeight; times.push(performance.now() - t) }
    return times.sort((a, b) => a - b)[3]
  }, { N, attrs })
  console.log(label.padEnd(46), `median style+layout for ${N} elements: ${ms.toFixed(1)} ms`)
  await p.close()
}
await run('A attribute tokens', r('out/layout-a.min.css'), 'style="display:flex" data-gap="2 md:6" data-p="4 lg:8" data-align="center"')
await run('Tailwind classes (static matrix)', r('tw/static.out.css'), 'style="display:flex" class="gap-2 md:gap-6 p-4 lg:p-8 items-center"')
await run('A stylesheet, elements WITHOUT prop attributes', r('out/layout-a.min.css'), 'style="display:flex" class="x y z"')
await run('A stylesheet, 1 prop attribute', r('out/layout-a.min.css'), 'style="display:flex" data-gap="2"')
await run('A stylesheet, 3 props, single token each', r('out/layout-a.min.css'), 'style="display:flex" data-gap="2" data-p="4" data-align="center"')
await run('no rules (baseline)', '', 'style="display:flex"')
await b.close()
