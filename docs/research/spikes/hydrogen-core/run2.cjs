const { chromium } = require('playwright'); const fs = require('fs');
const bundle = fs.readFileSync(__dirname + '/out-cart.dev.js', 'utf8'); const fake = fs.readFileSync(__dirname + '/fake-sa.js', 'utf8');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage(); page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.route('**/*', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }));
  await page.goto('http://localhost/'); await page.evaluate('window.__initialCart = { id: "gid://shopify/Cart/c1", lines: [{ id: "gid://shopify/CartLine/9?cart=c1", quantity: 1 }] }');
  await page.addScriptTag({ content: fake }); await page.addScriptTag({ content: bundle });
  const out = await Promise.race([page.evaluate(`(async () => { const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const snap = (s) => { const st = s.getState(); return { qty: st.data.totalQuantity, lines: st.data.lines.nodes.map(l => [l.id, l.quantity]), pendingLines: [...st.pending.lines], cost: st.pending.cost, lineErr: [...st.errors.lines.keys()] }; };
    const s = H.createCartStore(); s.connect(); await sleep(50); const states = []; s.subscribe(() => states.push(snap(s)));
    // A: Liquid line key used as lineId through a synthetic Hydrogen form (store holds GID lines)
    const f = document.createElement('form'); f.innerHTML = '<button name="intent" value="set" type="submit" hidden></button><input name="lineId" value="40123:abcdef"><input name="quantity" value="4"><button name="intent" value="increase"></button>';
    const ev = new SubmitEvent('submit', { submitter: f.querySelector('button[value=set]'), cancelable: true }); f.dispatchEvent(ev);
    let err = null; await s.handleFormSubmit(ev).catch(e => err = String(e)); await sleep(100);
    // B: attachQuantityInput on a form whose first submit button is not set
    const g = document.createElement('form'); g.innerHTML = '<input name="quantity"><button name="add">x</button>'; let attachErr = null; try { H.attachQuantityInput(g.querySelector('input'), g); } catch (e) { attachErr = e.message; }
    return { err, states, log: __log, attachErr, money: String(H.formatMoney({ amount: '1299.5', currencyCode: 'CAD' }, { locale: 'en-CA' })) }; })()`), new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT')), 8000))]).catch(e => String(e));
  console.log(JSON.stringify(out)); await browser.close();
})();
