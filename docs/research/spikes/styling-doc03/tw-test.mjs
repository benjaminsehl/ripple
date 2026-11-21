import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)('playwright')
const r = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')
const browser = await chromium.launch(); const page = await browser.newPage()
await page.setViewportSize({ width: 375, height: 700 })
await page.setContent(`<style>${r('tw/app.out.css')}</style>${r('tw/page.html')}`)
const cs = (sel, prop) => page.$eval(sel, (el, prop) => getComputedStyle(el).getPropertyValue(prop), prop)
const out = {}
out.u1 = await cs('#u1', 'row-gap'); out.u2_375 = await cs('#u2', 'row-gap')
out.b2 = [await cs('#b2', 'border-radius'), await cs('#b2', 'height'), await cs('#b2', 'background-color')]
out.b3 = await cs('#b3', 'background-color')
out.t1 = [await cs('#t1', 'border-radius'), await cs('#t1', 'z-index'), await cs('#t1', 'transition-duration'), await cs('#t1', 'padding-top'), await cs('#t1', 'font-weight'), await cs('#t1', 'display')]
await page.setViewportSize({ width: 800, height: 700 }); out.u2_800 = await cs('#u2', 'row-gap'); out.t1_800 = await cs('#t1', 'display')
await page.setViewportSize({ width: 1100, height: 700 }); out.t1_1100 = await cs('#t1', 'display')
await page.evaluate(() => { document.documentElement.style.setProperty('--rp-radius', '1rem'); document.documentElement.style.setProperty('--rp-density', '0.5') }); await page.waitForTimeout(300)
out.dials = [await cs('#t1', 'border-radius'), await cs('#t1', 'padding-top')]
console.log(JSON.stringify(out, null, 1)); await browser.close()
