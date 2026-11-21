const { chromium } = require('playwright'); const fs = require('fs');
const bundle = fs.readFileSync(__dirname + '/out.js', 'utf8'); const fake = fs.readFileSync(__dirname + '/fake-sa.js', 'utf8');
const PARTIALS = `export const partials = { async fetch(...args) { const o = args[args.length-1]; const names = args.slice(0,-1); (window.__pf ??= []).push([names, o.url ?? null]); await new Promise(r => setTimeout(r, 20)); if (window.__partialFail) throw new Error('partial fail'); return { names }; }, apply(p) { for (const n of p.names) for (const el of document.querySelectorAll('[data-rp-region="'+n+'"]')) { const t = document.createElement('template'); t.innerHTML = window.__render(n); el.replaceWith(t.content); } } };`;
const LIQUID_PAGE = (extra = '') => `<!doctype html><html lang="en"><head><script type="importmap">{"imports":{"@shopify/partial-rendering":"/partials.js","@shopify/standard-events":"/events.js"}}</script>
<script type="application/json" id="rp-commerce">{"host":"liquid","cartUrl":"/cart","cartAddUrl":"/cart/add","strings":{"added":"Ajouté"}}</script>${extra}</head><body>
<rp-cart id="link"><a href="/cart">Cart <span data-rp-part="count" hidden>0</span></a></rp-cart>
<rp-product-form id="pf"><form method="post" action="/cart/add"><input type="hidden" name="id" value="123" data-rp-field="merchandise-id"><input type="number" name="quantity" value="2" data-rp-field="quantity"><input type="hidden" name="selling_plan" value="77" data-rp-field="selling-plan"><input name="properties[Engraving]" value="Hi"><button type="submit" name="add" data-rp-part="submit">Add</button><button type="submit" name="buy" id="buy">Buy now</button><p data-rp-part="error" role="alert" hidden></p></form></rp-product-form>
<rp-dialog><dialog id="cart-drawer"><rp-cart id="lines" data-rp-refresh="rp-cart-lines rp-cart-summary"><div role="status" data-rp-part="status"></div>
<form method="post" action="/cart" id="cartform"><div data-rp-region="rp-cart-lines">__LINES__</div><textarea name="note" data-rp-field="note"></textarea><button type="submit" name="update" data-rp-part="submit" data-rp-js="fallback">Update</button><p data-rp-part="error" role="alert" hidden></p><button type="submit" name="checkout">Checkout</button></form>
<form method="post" action="/cart" id="disc"><input data-rp-field="discount-code" value="SAVE10"><button type="submit" name="intent" value="discount-apply">Apply</button><p data-rp-part="error" role="alert" hidden></p></form>
</rp-cart></dialog></rp-dialog></body></html>`;
const LINES = (q) => `<div data-rp-line="40123:abc"><input type="number" name="updates[]" value="${q}" data-rp-field="quantity"><a href="/cart/change?id=40123:abc&quantity=0" data-rp-part="remove">Remove</a><p data-rp-part="error" role="alert" hidden></p></div>`;
async function scenario(name, { html, pre = '0', body, routes = {} }) {
  const browser = await chromium.launch(); const page = await browser.newPage();
  const requests = [];
  page.on('console', (m) => { if (m.type() === 'error') requests.push('console.error ' + m.text().slice(0, 160)); }); page.on('pageerror', (e) => requests.push('pageerror ' + e.message.slice(0,200))); page.on('framenavigated', () => requests.push('NAV'));
  await page.route('**/*', async (route) => { try { const req = route.request(); const u = new URL(req.url());
    if (u.pathname === '/' && req.method() === 'GET' && !req.headers()['x-test']) { if (req.isNavigationRequest()) return route.fulfill({ contentType: 'text/html', body: html }); }
    if (u.pathname === '/partials.js') return route.fulfill({ contentType: 'text/javascript', body: PARTIALS });
    if (u.pathname === '/events.js') return route.fulfill({ contentType: 'text/javascript', body: 'export function createViewEventElement(){ return class extends HTMLElement {}; }' });
    if (u.pathname === '/sa.js') return route.fulfill({ contentType: 'text/javascript', body: pre + ';' + fake });
    if (u.pathname === '/ripple.js') return route.fulfill({ contentType: 'text/javascript', body: bundle });
    requests.push(req.method() + ' ' + u.pathname + u.search + (req.postData() ? ' ' + req.postData() : ''));
    const r = routes[req.method() + ' ' + u.pathname]; if (r) return route.fulfill(typeof r === 'function' ? r(req) : r);
    return route.fulfill({ status: 404, body: 'nf' }); } catch (e) { console.log('ROUTE ERR', e.message); route.abort(); } });
  await page.goto('http://localhost/', { timeout: 8000 }).catch((e) => console.log('GOTO', e.message.split('\n')[0]));
  let out; try { out = await Promise.race([page.evaluate(body), new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT 8s')), 8000))]); } catch (e) { out = 'THROW ' + e.message.split('\n')[0]; }
  console.log('## ' + name + '\n' + JSON.stringify({ out, requests })); await browser.close();
}
const H = `const sleep = (ms) => new Promise(r => setTimeout(r, ms)); const calls = () => __log.filter(x => x[0] === "updateCart").map(x => x[1]); const C = () => RP.getCommerce();`;
const scripts = `<script src="/sa.js"></script><script src="/ripple.js" defer></script>`;
const seeded = 'window.__initialCart = { id: "gid://shopify/Cart/c1", lines: [{ id: "40123:abc", quantity: 2 }] }; window.__render = (n) => n === "rp-cart-lines" ? \'<div data-rp-region="rp-cart-lines">\' + window.__LINES(window.__q ?? 2) + \'</div>\' : ""; window.__LINES = ' + LINES.toString() + ';';
(async () => {
  const page = LIQUID_PAGE(scripts).replace('__LINES__', LINES(2));
  await scenario('L1 liquid boot', { html: page, pre: seeded, body: `(async () => { ${H} await C().ready; await sleep(30);
    return { usable: C().usable, backend: C().backend, host: C().host, log: __log.map(x => x[0]), count: document.querySelector('[data-rp-part=count]').outerHTML, defined: ['rp-cart','rp-product-form','rp-live','rp-predictive-search','rp-recommendations','rp-view-event'].map(t => !!customElements.get(t)), dialect: C().dialect.fields }; })()` });
  await scenario('L2 liquid add', { html: page, pre: seeded, body: `(async () => { ${H} await C().ready; const pf = document.getElementById('pf'); const seen = []; let action = null;
    pf.addEventListener('action', (e) => action = e.detail); const refreshes = []; document.addEventListener('rp:refresh', (e) => refreshes.push(e.detail)); document.addEventListener('rp:refreshed', (e) => refreshes.push(['done', e.detail]));
    pf.querySelector('[name=add]').click(); await sleep(5); seen.push(pf.getAttribute('data-pending'), pf.getAttribute('aria-busy'), document.getElementById('link').getAttribute('data-pending'));
    await sleep(200);
    return { calls: calls(), seen, after: [pf.hasAttribute('data-pending'), pf.hasAttribute('aria-busy')], action, open: document.getElementById('cart-drawer').open, announced: window.__announced, refreshes, pf: window.__pf, count: document.querySelector('[data-rp-part=count]').outerHTML, error: pf.querySelector('[data-rp-part=error]').outerHTML }; })()` });
  await scenario('L3 liquid quantity change, remove link, Enter submit, discount', { html: page, pre: seeded, body: `(async () => { ${H} await C().ready; const out = {};
    let input = document.querySelector('[data-rp-line] input'); input.value = '5'; window.__q = 5; input.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(100); out.beforeDebounce = calls().length; await sleep(200); out.midPending = document.querySelector('[data-rp-line]').getAttribute('data-pending'); await sleep(200);
    out.afterChange = calls().slice(); out.status = document.querySelector('[data-rp-part=status]').textContent; out.pf = window.__pf; out.value = document.querySelector('[data-rp-line] input').value;
    document.querySelector('a[data-rp-part=remove]').click(); await sleep(200); out.afterRemove = calls().slice(-1); out.status2 = document.querySelector('[data-rp-part=status]').textContent;
    input = document.querySelector('[data-rp-line] input'); input.value = '7'; document.getElementById('cartform').requestSubmit(document.querySelector('[name=update]')); await sleep(200); out.afterUpdateSubmit = calls().slice(-1);
    document.querySelector('#disc button').click(); await sleep(200); out.afterDiscount = calls().slice(-1);
    out.href = location.href; return out; })()` });
  await scenario('L4 liquid userErrors on line', { html: page, pre: seeded + 'window.__userErrors = [{ message: "Only 3 left", field: ["lines","0","quantity"], code: "INVALID" }];', body: `(async () => { ${H} await C().ready;
    const input = document.querySelector('[data-rp-line] input'); input.value = '9'; input.dispatchEvent(new Event('change', { bubbles: true })); await sleep(600);
    const st = C().cart.getState(); return { lineErr: document.querySelector('[data-rp-line] [data-rp-part=error]').outerHTML, cartErr: document.querySelector('#cartform > [data-rp-part=error]').outerHTML, status: document.querySelector('[data-rp-part=status]').textContent, errs: { lines: [...st.errors.lines.entries()].map(([k, v]) => [k, v.userErrors.map(e => e.message)]), cart: st.errors.cart.userErrors.map(e => e.message), last: st.errors.lastUpdatedAt > 0 } }; })()` });
  await scenario('L5 liquid: updateCart configured by another script first', { html: page, pre: seeded + 'window.__preconfigured = true; document.addEventListener("DOMContentLoaded", () => {});', body: `(async () => { ${H} await sleep(100); Shopify.actions.updateCart.isDefault = () => false; return { usable: C().usable, defined: !!customElements.get('rp-cart'), log: __log.map(x => x[0]) }; })()` });
  const pre5 = seeded + 'window.__preconfigured = true;';
  await scenario('L6 liquid: configure fails at runtime (isDefault still true at start): probe rejects, forms native', { html: page, pre: pre5, routes: { 'POST /cart/add': { status: 200, contentType: 'text/html', body: '<html><body>NATIVE CART</body></html>' } }, body: `(async () => { ${H} await C().ready; const usable = C().usable; let prevented = null; document.addEventListener('submit', (e) => { setTimeout(() => prevented = e.defaultPrevented, 0); }, true);
    return { usable, defined: !!customElements.get('rp-cart') }; })()` });
  await scenario('L7 partial refresh failure falls back to reload', { html: page, pre: seeded + 'window.__partialFail = true;', body: `(async () => { ${H} await C().ready; sessionStorage.setItem('n', String(Number(sessionStorage.getItem('n') ?? 0) + 1)); if (sessionStorage.getItem('n') !== '1') return { reloaded: true };
    document.querySelector('a[data-rp-part=remove]').click(); await sleep(3000); return { reloaded: false }; })()` });
})();
