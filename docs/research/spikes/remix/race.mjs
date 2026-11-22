import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import './server.mjs'
const B = 'http://localhost:4173'
const browser = await chromium.launch(); let page = await browser.newPage()
page.on('console', (m) => console.log('  [console]', m.type(), m.text().slice(0, 300)))
await page.goto(B + '/island?pre=1'); await page.waitForFunction(() => window.__ready); await page.waitForTimeout(200)
console.log('R1 before hydration (dialog opened):', await page.evaluate(() => window.__pre))
console.log('R1 after hydration: open prop', await page.evaluate(() => document.querySelector('#idlg').open), '| content:', await page.evaluate(() => document.querySelector('#idlg ui-dialog-content').outerHTML.split('>')[0]), '| trigger:', await page.evaluate(() => document.querySelector('#idlg-trigger').outerHTML.split('>')[0]))
await page.close()
for (let keyed of [0, 1]) {
  page = await browser.newPage()
  await page.goto(B + `/a?mode=attrs&keyed=${keyed}`); await page.waitForFunction(() => window.__ready)
  await page.evaluate(() => { window.__nav = document.querySelector('#nav'); window.__main = document.querySelector('main ui-dialog'); window.__stack = document.querySelector('main .rp-stack') })
  await page.click('#to-b'); await page.waitForSelector('#b-only'); await page.waitForTimeout(200)
  console.log(`R2 keyed=${keyed} A->B node identity:`, await page.evaluate(() => ({ layoutDialogSameNode: window.__nav === document.querySelector('#nav'), mainDialogSameNode: window.__main === document.querySelector('main ui-dialog'), stackSameNode: window.__stack === document.querySelector('main .rp-stack'), stackGap: document.querySelector('main .rp-stack').getAttribute('data-gap') })))
  await page.close()
}
await browser.close(); process.exit(0)
