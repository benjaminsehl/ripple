import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import './server.mjs'
const B = 'http://localhost:4173'
const browser = await chromium.launch()
const out = []
const say = (...a) => { out.push(a.map((x) => typeof x === 'string' ? x : JSON.stringify(x)).join(' ')); console.log(out.at(-1)) }

async function open(path, { js = true } = {}) {
  let ctx = await browser.newContext({ javaScriptEnabled: js })
  let page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') say('  [console]', m.type(), m.text().slice(0, 200)) })
  page.on('pageerror', (e) => say('  [pageerror]', String(e).slice(0, 200)))
  await page.addInitScript(() => {
    window.__marker = Math.random()
    window.__muts = []
    document.addEventListener('readystatechange', () => {
      if (document.readyState !== 'interactive') return
      let main = document.querySelector('main'); if (!main) return
      new MutationObserver((rs) => { for (let r of rs) window.__muts.push(r.type + ':' + (r.target.nodeName || '') + (r.target.id ? '#' + r.target.id : '') + ':' + (r.attributeName ?? '')) }).observe(main, { attributes: true, childList: true, characterData: true, subtree: true })
    })
  })
  await page.goto(B + path)
  if (js) await page.waitForFunction(() => window.__ready)
  return page
}
const snap = (page) => page.evaluate(() => {
  let a = (el) => el ? Object.fromEntries(el.getAttributeNames().filter((n) => !n.startsWith('data-rmx') && n !== 'class').map((n) => [n, el.getAttribute(n)])) : null
  let dlg = document.querySelector('main ui-dialog'), content = document.querySelector('main ui-dialog-content'), tabs = document.querySelector('ui-tabs')
  return {
    title: document.title,
    dlgId: dlg?.id, dlgOpenProp: dlg?.open,
    contentPopoverOpen: content ? content.matches(':popover-open') : null,
    content: a(content),
    trigger: a(document.querySelector('main ui-dialog-trigger button')), navOpen: document.querySelector('#nav')?.open, navPopover: document.querySelector('#nav ui-dialog-content')?.matches(':popover-open'), tabRole: document.querySelector('ui-tabs-tab')?.getAttribute('role'),
    desc: document.querySelector('main ui-dialog-description')?.textContent,
    htmlStyle: document.documentElement.getAttribute('style'),
    inert: [...document.querySelectorAll('[inert]')].map((e) => e.nodeName + (e.id ? '#' + e.id : '')),
    tabsValue: tabs?.value,
    tabSel: [...document.querySelectorAll('[role=tab]')].map((t) => t.id + '=' + t.getAttribute('aria-selected')),
    panels: [...document.querySelectorAll('ui-tabs-panel')].map((p) => (p.hidden ? 'hidden' : 'shown') + ':' + p.textContent),
    count: document.querySelector('#count')?.textContent, renderN: document.querySelector('#render-n')?.textContent,
    marker: window.__marker, log: window.__log?.splice(0) ?? [],
  }
})

// ---- T0 upgrade stability
{
  let page = await open('/a?mode=attrs&keyed=1')
  say('T0 mutations inside <main> during element upgrade + run():', await page.evaluate(() => window.__muts), 'ui-tabs-tab role now:', await page.evaluate(() => document.querySelector('ui-tabs-tab').getAttribute('role')))
  await page.context().close()
}
// ---- T1 frame reload with live state, per mode
for (let mode of ['none', 'attrs', 'dom']) for (let hp of [false, true]) {
  if (hp && mode !== 'attrs') continue
  let page = await open(`/a?mode=${mode}&keyed=1${hp ? '&hp=1' : ''}`)
  await page.click('#tabs-tab-two')
  await page.click('#dlg-trigger')
  await page.waitForTimeout(300)
  let before = await snap(page)
  say(`\nT1 mode=${mode} htmlPreserve=${hp} BEFORE reload`, { dlgOpenProp: before.dlgOpenProp, popoverOpen: before.contentPopoverOpen, content: before.content, trigger: before.trigger, htmlStyle: before.htmlStyle, inert: before.inert, tabsValue: before.tabsValue, tabSel: before.tabSel, panels: before.panels, desc: before.desc })
  await page.evaluate(() => window.__app.frames.top.reload())
  await page.waitForTimeout(300)
  let after = await snap(page)
  say(`T1 mode=${mode} AFTER top-frame reload`, { sameDocument: after.marker === before.marker, dlgOpenProp: after.dlgOpenProp, popoverOpen: after.contentPopoverOpen, content: after.content, trigger: after.trigger, htmlStyle: after.htmlStyle, inert: after.inert, tabsValue: after.tabsValue, tabSel: after.tabSel, panels: after.panels, desc: after.desc, renderN: after.renderN, log: after.log })
  await page.keyboard.press('Escape'); await page.waitForTimeout(300)
  let closed = await snap(page)
  say(`T1 mode=${mode} AFTER Escape`, { dlgOpenProp: closed.dlgOpenProp, popoverOpen: closed.contentPopoverOpen, contentHidden: closed.content?.hidden, htmlStyle: closed.htmlStyle, inert: closed.inert })
  await page.click('#tabs-tab-one'); await page.waitForTimeout(100)
  let t = await snap(page)
  say(`T1 mode=${mode} AFTER click tab one`, { tabsValue: t.tabsValue, tabSel: t.tabSel, panels: t.panels })
  await page.context().close()
}
// ---- T2 navigation A -> B -> back, keyed vs unkeyed
for (let keyed of [0, 1]) {
  let page = await open(`/a?mode=attrs&keyed=${keyed}`)
  let s0 = await snap(page)
  await page.click('#to-b'); await page.waitForSelector('#b-only'); await page.waitForTimeout(200)
  let s1 = await snap(page)
  say(`\nT2 keyed=${keyed} A->B`, { sameDocument: s0.marker === s1.marker, title: s1.title, dlgId: s1.dlgId, log: s1.log })
  await page.click('#other-trigger').catch((e) => say('  click failed', String(e).slice(0, 100))); await page.waitForTimeout(300)
  let s2 = await snap(page)
  say(`T2 keyed=${keyed} B dialog opened`, { dlgOpenProp: s2.dlgOpenProp, popoverOpen: s2.contentPopoverOpen, content: s2.content, trigger: s2.trigger })
  await page.keyboard.press('Escape'); await page.waitForTimeout(200)
  await page.goBack(); await page.waitForTimeout(500)
  let s3 = await snap(page)
  say(`T2 keyed=${keyed} back to A`, { sameDocument: s0.marker === s3.marker, title: s3.title, dlgId: s3.dlgId, log: s3.log, content: s3.content })
  await page.context().close()
}
// ---- T2b navigate from inside an open dialog
{
  let page = await open('/a?mode=attrs&keyed=1')
  await page.click('#dlg-trigger'); await page.waitForTimeout(200)
  await page.click('#in-dialog-link'); await page.waitForSelector('#b-only'); await page.waitForTimeout(300)
  let s = await snap(page)
  say('\nT2b navigated A->B while dialog open', { title: s.title, htmlStyle: s.htmlStyle, inert: s.inert, log: s.log })
  await page.context().close()
}
// ---- T3 forms
{
  let page = await open('/a?mode=attrs&keyed=1')
  let s0 = await snap(page)
  await page.click('.rp-add-to-cart button'); await page.waitForTimeout(400)
  let s = await snap(page)
  say('\nT3a rp-cart-form defined: submit', { sameDocument: s.marker === s0.marker, count: s.count, log: s.log })
  await page.context().close()

  page = await open('/a?mode=attrs&keyed=1&norp=1')
  s0 = await snap(page)
  await page.click('#tabs-tab-two')
  await page.click('.rp-add-to-cart button'); await page.waitForTimeout(600)
  s = await snap(page)
  say('T3b rp-cart-form NOT defined, Remix run() active: submit', { sameDocument: s.marker === s0.marker, count: s.count, renderN: s.renderN, tabsValue: s.tabsValue, tabSel: s.tabSel, panels: s.panels, log: s.log })
  await page.context().close()

  page = await open('/a?mode=attrs&keyed=1', { js: false })
  let c0 = await page.textContent('#count')
  await page.click('.rp-add-to-cart button'); await page.waitForLoadState()
  say('T3c JavaScript disabled: submit', { before: c0, after: await page.textContent('#count'), url: page.url(), dialogContentVisible: await page.isVisible('ui-dialog-content') })
  await page.context().close()
}
{
  let page = await open('/a?mode=attrs&keyed=1&norp=1&doc=1')
  let s0 = await snap(page)
  await page.click('.rp-add-to-cart button'); await page.waitForLoadState(); await page.waitForFunction(() => window.__ready)
  let s = await snap(page)
  say('T3d rp-cart-form NOT defined, form has data-rmx-document: submit', { sameDocument: s.marker === s0.marker, countBefore: s0.count, count: s.count })
  await page.context().close()
}
for (let con of [0, 1]) {
  let page = await open(`/a?mode=attrs&keyed=1${con ? '&con=1' : ''}`)
  await page.click('#nav-trigger'); await page.waitForTimeout(200)
  await page.click('#nav-to-b'); await page.waitForSelector('#b-only'); await page.waitForTimeout(400)
  let s = await snap(page)
  say(`\nT4 layout-level dialog #nav open, navigate A->B via link inside it, closeOnNavigate=${con}`, { title: s.title, navOpen: s.navOpen, navPopover: s.navPopover, htmlStyle: s.htmlStyle, inert: s.inert, tabRole: s.tabRole })
  await page.context().close()
}
say('\nserver requests:', await (await fetch(B + '/__requests')).json())
import('node:fs').then((fs) => fs.writeFileSync(new URL('./out/result.txt', import.meta.url), out.join('\n')))
await browser.close(); process.exit(0)
