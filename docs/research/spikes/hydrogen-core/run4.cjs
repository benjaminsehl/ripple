const { chromium } = require('playwright'); const fs = require('fs');
const bundle = fs.readFileSync(__dirname + '/out-cart.dev.js', 'utf8'); const fake = fs.readFileSync(__dirname + '/fake-sa.js', 'utf8');
async function scenario(name, pre, body, copies = 1) {
  const browser = await chromium.launch(); const page = await browser.newPage();
  await page.route('**/*', (route) => { const u = new URL(route.request().url()); if (u.pathname === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }); route.fulfill({ status: 404, body: '' }); });
  await page.goto('http://localhost/');
  await page.evaluate(pre); await page.addScriptTag({ content: fake }); await page.addScriptTag({ content: bundle });
  if (copies === 2) { await page.evaluate('window.H1 = window.H'); await page.addScriptTag({ content: bundle }); await page.evaluate('window.H2 = window.H'); }
  let out; try { out = await Promise.race([page.evaluate(body), new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT 8s')), 8000))]); } catch (e) { out = 'THROW ' + e.message.split('\n')[0]; }
  console.log('## ' + name + '\n' + JSON.stringify({ out })); await browser.close();
}
const pre = 'const sleep = (ms) => new Promise(r => setTimeout(r, ms)); const snap = (s) => { const st = s.getState(); return { id: st.data.id, qty: st.data.totalQuantity, lines: st.data.lines.nodes.map(l => [l.id, l.quantity]), loading: st.loading, pending: [...st.pending.lines], net: st.errors.network.map(e => e.message) }; }; const calls = () => __log.filter(x => x[0] === "updateCart").map(x => x[1]);';
const mkForm = `const mk = (s, id) => { const f = document.createElement('form'); f.innerHTML = '<input name="merchandiseId" value="' + id + '"><button value="add"></button>'; document.body.append(f); f.addEventListener('submit', (e) => { e.preventDefault(); s.handleFormSubmit(e).catch(x => window.__err = String(x)); }); return f; };`;
(async () => {
  await scenario('H two stores, ONE module copy: A submits, B observes', '0', `(async () => { ${pre} ${mkForm} const a = H.createCartStore({ initialData: { cart: null } }), b = H.createCartStore({ initialData: { cart: null } }); a.connect(); b.connect();
    const bStates = []; b.subscribe(() => bStates.push(snap(b)));
    mk(a, 'gid://shopify/ProductVariant/1').querySelector('button').click(); await sleep(150);
    return { a: snap(a), b: snap(b), bStates, calls: calls(), err: window.__err ?? null }; })()`);
  await scenario('I two stores, TWO module copies (app copy + prebuilt ripple.js copy)', '0', `(async () => { ${pre} ${mkForm} const a = H1.createCartStore({ initialData: { cart: null } }), b = H2.createCartStore({ initialData: { cart: null } }); a.connect(); await sleep(20); b.connect(); await sleep(20);
    mk(a, 'gid://shopify/ProductVariant/1').querySelector('button').click(); await sleep(150); const afterA = { a: snap(a), b: snap(b) };
    mk(b, 'gid://shopify/ProductVariant/2').querySelector('button').click(); await sleep(150);
    return { afterA, a: snap(a), b: snap(b), calls: calls(), err: window.__err ?? null, configures: __log.filter(x => x[0] === 'configure').length }; })()`, 2);
  await scenario('J two copies, endpoint configured only in copy 1: where do copy 2 store requests go?', '0', `(async () => { ${pre} H1.configureCartEndpoint('/api/cart'); const a = H1.createCartStore(), b = H2.createCartStore(); a.connect(); await sleep(30); b.connect(); await sleep(60);
    return { a: snap(a), b: snap(b), log: __log.map(x => x[0]) }; })()`, 2);
  await scenario('K connect() during document loading (module-eval timing), Shopify.actions defined later before DOMContentLoaded', '0', `(async () => { ${pre} return 'see run5'; })()`);
})();
