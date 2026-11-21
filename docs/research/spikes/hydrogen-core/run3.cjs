const { chromium } = require('playwright'); const fs = require('fs');
const bundle = fs.readFileSync(__dirname + '/out-cart.dev.js', 'utf8'); const fake = fs.readFileSync(__dirname + '/fake-sa.js', 'utf8');
async function scenario(name, pre, body) {
  const browser = await chromium.launch(); const page = await browser.newPage();
  const fetches = []; await page.route('**/*', (route) => { const u = new URL(route.request().url()); if (u.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }); fetches.push(route.request().method() + ' ' + u.pathname); route.fulfill({ status: 404, body: '' }); });
  await page.goto('http://localhost/');
  await page.evaluate(pre); await page.addScriptTag({ content: fake }); await page.addScriptTag({ content: bundle });
  let out; try { out = await Promise.race([page.evaluate(body), new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT 8s')), 8000))]); } catch (e) { out = 'THROW ' + e.message.split('\n')[0]; }
  console.log('## ' + name + '\n' + JSON.stringify({ out, fetches })); await browser.close();
}
const pre = 'const sleep = (ms) => new Promise(r => setTimeout(r, ms)); const snap = (s) => { const st = s.getState(); return { id: st.data.id, qty: st.data.totalQuantity, lines: st.data.lines.nodes.map(l => [l.id, l.quantity]), loading: st.loading, pending: [...st.pending.lines], pcost: st.pending.cost, pdisc: [...st.pending.discountCodes], disc: st.data.discountCodes, note: st.data.note }; }; const calls = () => __log.filter(x => x[0] === "updateCart").map(x => x[1]);';
const seeded = 'window.__initialCart = { id: "gid://shopify/Cart/c1", lines: [{ id: "gid://shopify/CartLine/9?cart=c1", quantity: 2 }] }';
(async () => {
  // A: Liquid-native form + JS-added mirror inputs, real click, real SubmitEvent.
  await scenario('A native Liquid add form with mirrored Hydrogen fields', '0', `(async () => { ${pre} const s = H.createCartStore({ initialData: { cart: null } }); s.connect();
    document.body.innerHTML = '<form method="post" action="/cart/add"><input type="hidden" name="id" value="123"><input type="hidden" name="selling_plan" value="77"><input name="properties[Engraving]" value="Hi"><input name="quantity" value="2"><button type="submit" name="add">Add</button></form>';
    const f = document.querySelector('form'); let err = null;
    f.addEventListener('submit', (e) => { e.preventDefault();
      const mirror = (n, v) => { const i = document.createElement('input'); i.type = 'hidden'; i.name = n; i.value = v; i.dataset.rpMirror = ''; f.append(i); };
      const fd = new FormData(f); mirror('merchandiseId', fd.get('id')); mirror('sellingPlanId', fd.get('selling_plan'));
      for (const [k, v] of fd) { const m = k.match(/^properties\\[(.+)\\]$/); if (m) mirror('attributes.' + m[1], v); }
      s.handleFormSubmit(e).catch(x => err = String(x)); f.querySelectorAll('[data-rp-mirror]').forEach(n => n.remove()); });
    f.querySelector('button').click(); await sleep(120); return { err, calls: calls(), state: snap(s) }; })()`);
  // B: store loaded via getCart (GID line ids). DOM renders Liquid line keys. increase intent with a Liquid key.
  await scenario('B increase intent with a line id the store does not hold (Liquid key vs SFAPI GID)', seeded, `(async () => { ${pre} const s = H.createCartStore(); s.connect(); await sleep(60); const loaded = snap(s);
    const f = document.createElement('form'); f.innerHTML = '<button name="intent" value="set" type="submit" hidden></button><input name="lineId" value="40123:abcdef" readonly><input name="quantity" value="2"><button name="intent" value="increase">+</button><button name="intent" value="decrease">-</button>'; document.body.append(f);
    f.addEventListener('submit', (e) => { e.preventDefault(); s.handleFormSubmit(e); });
    f.querySelector('[value=increase]').click(); await sleep(100); const afterInc = calls().slice();
    f.querySelector('[value=decrease]').click(); await sleep(100);
    return { loaded, afterInc, allCalls: calls(), state: snap(s) }; })()`);
  // C: same DOM, but set intent with absolute quantity read from the input.
  await scenario('C set intent with Liquid key and absolute quantity', seeded, `(async () => { ${pre} const s = H.createCartStore(); s.connect(); await sleep(60);
    const f = document.createElement('form'); f.innerHTML = '<button name="intent" value="set" type="submit" hidden></button><input name="lineId" value="40123:abcdef" readonly><input name="quantity" value="2">'; document.body.append(f);
    const states = []; s.subscribe(() => states.push(snap(s)));
    f.addEventListener('submit', (e) => { e.preventDefault(); s.handleFormSubmit(e); });
    const detach = H.attachQuantityInput(f.querySelector('[name=quantity]'), f);
    const q = f.querySelector('[name=quantity]'); q.value = '5'; q.dispatchEvent(new Event('change', { bubbles: true })); await sleep(100);
    return { calls: calls(), states }; })()`);
  // D: store seeded with initialData using Liquid keys as ids, then increase; what ids does the store hold afterwards?
  await scenario('D initialData seeded with Liquid keys; increase; ids after settle', 'window.__initialCart = { id: "gid://shopify/Cart/c1", lines: [{ id: "40123:abcdef", quantity: 2 }] }', `(async () => { ${pre}
    const s = H.createCartStore({ initialData: { cart: { id: 'gid://shopify/Cart/c1', totalQuantity: 2, cost: { totalAmount: { amount: '20.0', currencyCode: 'USD' } }, lines: { nodes: [{ id: '40123:abcdef', quantity: 2, cost: { totalAmount: { amount: '20.0', currencyCode: 'USD' } } }] }, discountCodes: [], attributes: [], note: '' } } }); s.connect();
    const f = document.createElement('form'); f.innerHTML = '<button name="intent" value="set" type="submit" hidden></button><input name="lineId" value="40123:abcdef" readonly><input name="quantity" value="2"><button name="intent" value="increase">+</button>'; document.body.append(f);
    const states = []; s.subscribe(() => states.push(snap(s)));
    f.addEventListener('submit', (e) => { e.preventDefault(); s.handleFormSubmit(e); });
    f.querySelector('[value=increase]').click(); await sleep(120);
    return { calls: calls(), states, fetchesGetCart: __log.filter(x => x[0] === 'getCart').length }; })()`);
  // E: discount apply + note via forms (default handler).
  await scenario('E discount-apply and note-update forms on default handler', seeded, `(async () => { ${pre} const s = H.createCartStore(); s.connect(); await sleep(60);
    const f = document.createElement('form'); f.innerHTML = '<input name="discountCode" value="SAVE10"><button name="intent" value="discount-apply">Apply</button>'; document.body.append(f);
    const g = document.createElement('form'); g.innerHTML = '<textarea name="note">hello</textarea><button name="intent" value="note-update">Save</button>'; document.body.append(g);
    const states = []; s.subscribe(() => states.push(snap(s)));
    for (const x of [f, g]) x.addEventListener('submit', (e) => { e.preventDefault(); s.handleFormSubmit(e); });
    f.querySelector('button').click(); await sleep(100); g.querySelector('button').click(); await sleep(100);
    return { calls: calls(), first: states[0], final: snap(s), events: __log.map(x => x[0]) }; })()`);
  // F: theme configured first via DOMContentLoaded-like ordering; does the store still OBSERVE events (read-only) even though configure failed?
  await scenario('F configure lost to theme: store still observes third-party updateCart events?', 'window.__preconfigured = true; ' + seeded, `(async () => { ${pre} const s = H.createCartStore(); s.connect(); await sleep(60); const loaded = snap(s);
    const states = []; s.subscribe(() => states.push(snap(s)));
    await Shopify.actions.updateCart({ lines: [{ id: 'gid://shopify/CartLine/9?cart=c1', quantity: 4 }] }); await sleep(100);
    return { loaded, states, final: snap(s) }; })()`);
  // G: two rapid adds with no cart: are transports serialized (one updateCart at a time until cart id known)?
  await scenario('G two rapid form adds with no cart', '0', `(async () => { ${pre} const s = H.createCartStore({ initialData: { cart: null } }); s.connect();
    const mk = (id) => { const f = document.createElement('form'); f.innerHTML = '<input name="merchandiseId" value="' + id + '"><button value="add"></button>'; document.body.append(f); f.addEventListener('submit', (e) => { e.preventDefault(); s.handleFormSubmit(e); }); return f; };
    const a = mk('gid://shopify/ProductVariant/1'), b = mk('gid://shopify/ProductVariant/2');
    a.querySelector('button').click(); b.querySelector('button').click(); await sleep(10); const during = calls().length; await sleep(150);
    return { during, calls: calls(), final: snap(s) }; })()`);
})();
