import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)('playwright')
const css = readFileSync(new URL('out/ripple.min.css', import.meta.url), 'utf8')
const browser = await chromium.launch(); const page = await browser.newPage()
const tones = { neutral: ['foreground','background','foreground'], muted: ['muted','muted-foreground','muted-foreground'], primary: ['primary','primary-foreground','foreground'], info: ['info','info-foreground','info'], success: ['success','success-foreground','success'], warning: ['warning','warning-foreground','warning'], destructive: ['destructive','destructive-foreground','destructive'], sale: ['sale','sale-foreground','sale'] }
const variants = { solid: ['var(--_tone)','var(--_on-tone)'], soft: ['color-mix(in oklab, var(--_tone-text) 12%, transparent)','var(--_tone-text)'], outline: ['transparent','var(--_tone-text)'], plain: ['transparent','var(--_tone-text)'] }
let html = ''
for (const scheme of ['light','dark']) { html += `<section data-scheme="${scheme}" id="${scheme}">`; for (const [t, [a,b,c]] of Object.entries(tones)) for (const [v, [bg, fg]] of Object.entries(variants)) html += `<span id="${scheme}-${t}-${v}" style="--_tone:var(--color-${a});--_on-tone:var(--color-${b});--_tone-text:var(--color-${c});background-color:${bg};color:${fg}">x</span>`; html += '</section>' }
await page.setContent(`<style>${css}</style>${html}<script>
  window.rgb = (c, under) => { const x = document.createElement('canvas').getContext('2d', { willReadFrequently: true }); x.fillStyle = under || '#fff'; x.fillRect(0,0,1,1); x.fillStyle = c; x.fillRect(0,0,1,1); return [...x.getImageData(0,0,1,1).data].slice(0,3) }
  window.lum = ([r,g,b]) => { const f = (v) => { v/=255; return v <= 0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4 }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b) }
  window.contrastRgb = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p,q)=>q-p); return Math.round(((x+0.05)/(y+0.05))*100)/100 }
</script>`)
const res = await page.evaluate(() => [...document.querySelectorAll('span')].map((el) => { const s = getComputedStyle(el); const pg = rgb(getComputedStyle(el.parentElement).backgroundColor); const bg = rgb(s.backgroundColor, 'rgb(' + pg + ')'); return [el.id, contrastRgb(rgb(s.color, 'rgb(' + bg + ')'), bg)] }))
console.log(res.filter(([, c]) => c < 4.5).length ? 'BELOW 4.5: ' + JSON.stringify(res.filter(([, c]) => c < 4.5)) : 'all >= 4.5'); console.log('min', Math.min(...res.map(r => r[1])), JSON.stringify(res.filter(([id]) => id.includes('soft'))))
await browser.close()
