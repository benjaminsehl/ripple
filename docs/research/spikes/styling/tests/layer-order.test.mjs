// Failure mode: the Ripple layer statement placed AFTER `@import "tailwindcss"`.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)('playwright')
const r = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const b = await chromium.launch()
for (const f of ['tw/app.out.css', 'tw/app-late.out.css']) {
  const p = await b.newPage(); await p.setContent(`<style>${r(f)}</style>${r('tw/page.html')}`)
  console.log(f.padEnd(24), 'class="gap-8" data-gap="2" ->', await p.$eval('#u1', (e) => getComputedStyle(e).rowGap), '| class="rp-button rounded-none h-20" ->', await p.$eval('#b2', (e) => getComputedStyle(e).borderRadius + ' ' + getComputedStyle(e).height))
  await p.close()
}
await b.close()
