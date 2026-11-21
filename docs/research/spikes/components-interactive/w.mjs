import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const nm = path.resolve('../spikes/uisdk-web/node_modules');
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title>
<script type="importmap">{"imports":{"@ui-sdk/core":"/@ui-sdk/core/dist/index.js","@ui-sdk/core/":"/@ui-sdk/core/dist/","@ui-sdk/web":"/@ui-sdk/web/dist/index.js","@ui-sdk/web/":"/@ui-sdk/web/dist/"}}</script>
<script type="module">import "@ui-sdk/web/toast"; import { toast } from "@ui-sdk/web"; window.toast = toast;</script></head><body>
<ui-toast-region id="r" class="rp-toast" aria-label="Notifications" data-slot="toast-region" data-side="bottom" data-align="end" popover="manual"></ui-toast-region>
</body></html>`;
const s = http.createServer((q,res)=>{const u=new URL(q.url,'http://x').pathname; if(u==='/'){res.writeHead(200,{"content-type":"text/html"});return res.end(page)} let f=path.join(nm,u); if(!fs.existsSync(f)&&fs.existsSync(f+'.js')) f+='.js'; if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){console.log('404',u);res.writeHead(404);return res.end()} res.writeHead(200,{"content-type":"text/javascript"}); fs.createReadStream(f).pipe(res)}).listen(4197);
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1000,height:700}});
p.on('pageerror', e=>console.log('PAGEERROR', e.message)); p.on('console', m=>{ if(m.type()==='error') console.log('CONSOLE', m.text()) });
await p.goto('http://localhost:4197/');
try { await p.waitForFunction(()=>customElements.get('ui-toast-region') && window.toast, null, {timeout:8000}); } catch(e) { console.log('timeout'); }
await p.waitForTimeout(300);
await p.evaluate(()=>{ window.toast('Added to cart', {description:'Linen shirt', type:'success', duration: 60000}); window.toast('Second', {duration: 60000}); });
await p.waitForTimeout(800);
console.log((await p.evaluate(()=>document.getElementById('r').outerHTML)).replace(/></g,'>\n<'));
console.log(await p.evaluate(()=>[...document.querySelectorAll('ui-toast')].map(e=>{const r=e.getBoundingClientRect(); const cs=getComputedStyle(e); return [Math.round(r.top),Math.round(r.height),cs.position,cs.display].join(' ')})));
await b.close(); s.close();
