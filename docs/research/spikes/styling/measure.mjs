import { readFileSync } from 'node:fs'
import { sizes } from './gen-layout.mjs'
const r = (p) => readFileSync(new URL('./' + p, import.meta.url), 'utf8')
const row = (css) => { const s = sizes(css); return { raw: s.raw, min: s.min, gzip: s.gzip, brotli: s.brotli } }
const t = {}
for (const f of ['ripple/layers.css', 'ripple/tokens.css', 'ripple/base.css', 'ripple/layout.css', 'ripple/button.css', 'out/layout-a.css', 'out/layout-b.css']) t[f] = row(r(f))
const all = ['ripple/layers.css', 'ripple/tokens.css', 'ripple/base.css', 'ripple/layout.css', 'ripple/button.css', 'out/layout-a.css'].map(r).join('\n')
t['TOTAL spike (tokens+base+layout+button+props A)'] = row(all)
// projection: 90 component files the size of button.css
const btn = r('ripple/button.css')
t['PROJECTION 90 x button.css + rest'] = row(all + Array.from({ length: 89 }, (_, i) => btn.replaceAll('rp-button', 'rp-c' + i).replaceAll('--_', '--_' + i)).join('\n'))
// @apply button vs plain button compiled output
const out = r('tw/app.out.css')
const applyBlock = out.slice(out.lastIndexOf('@layer rp.components'), out.indexOf('@layer properties {', out.lastIndexOf('@layer rp.components')))
t['button via @apply (3 of 15 modifier rules only), compiled'] = row(applyBlock)
if (process.argv[2]) t[process.argv[2]] = row(r(process.argv[2]))
console.table(t)
