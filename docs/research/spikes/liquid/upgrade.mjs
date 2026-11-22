// Renders the Liquid dialog + accordion example, loads it in Chromium with the real
// @ui-sdk/web bundle built by the uisdk-web spike, and records every DOM mutation on upgrade.
import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { createEngine, globals } from './shim.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const theme = path.resolve('theme');
const engine = createEngine(theme);
const src = `{% block 'rp-dialog', id: 'sg' %}{% block 'rp-dialog-trigger', dialog: 'sg', variant: 'link' %}Size guide{% endblock %}{% block 'rp-dialog-content' %}{% block 'rp-dialog-title', dialog: 'sg' %}Size guide{% endblock %}<p>S, M, L.</p>{% endblock %}{% endblock %}`;
const body = await engine.render(engine.parse(src, path.join(theme, 'templates', 'x.liquid')), {}, { globals });
const page1 = `<!doctype html><html><head><link rel="stylesheet" href="/pre-upgrade.css"></head><body><main>${body}</main>
<script>window.__m=[];new MutationObserver(r=>{for(const x of r)window.__m.push(x.type+':'+(x.target.nodeName||'')+':'+(x.attributeName||'')+':'+[...(x.addedNodes||[])].map(n=>n.nodeName).join(','))}).observe(document.querySelector('main'),{attributes:true,childList:true,characterData:true,subtree:true});</script>
<script type="module" src="/web.js"></script></body></html>`;
const siteRoot = process.argv[2];
const types = { '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((q, res) => {
  const u = new URL(q.url, 'http://x');
  if (u.pathname === '/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(page1); }
  const f = path.join(siteRoot, u.pathname);
  if (!f.startsWith(siteRoot) || !fs.existsSync(f)) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(4391);
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:4391/');
await page.waitForFunction(() => customElements.get('ui-dialog'));
await page.waitForTimeout(300);
const muts = await page.evaluate(() => window.__m);
console.log('mutations on upgrade:', JSON.stringify(muts));
await page.click('#sg-trigger');
await page.waitForTimeout(300);
console.log('after click:', JSON.stringify(await page.evaluate(() => ({
  contentHidden: document.querySelector('ui-dialog-content').hidden,
  expanded: document.querySelector('#sg-trigger').getAttribute('aria-expanded'),
  labelledby: document.querySelector('ui-dialog-content').getAttribute('aria-labelledby'),
  role: document.querySelector('ui-dialog-content').getAttribute('role'),
}))));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
console.log('after Escape hidden:', await page.evaluate(() => document.querySelector('ui-dialog-content').hidden), 'errors:', JSON.stringify(errors));
await browser.close(); server.close();
