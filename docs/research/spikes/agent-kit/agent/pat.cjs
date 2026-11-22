const { chromium } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
(async()=>{
 const s=http.createServer((q,r)=>{const f=path.join(__dirname,q.url.split('?')[0]); r.writeHead(200,{'content-type':f.endsWith('.js')?'text/javascript':'text/html'}); r.end(fs.readFileSync(f))}).listen(4612);
 const b=await chromium.launch(); const p=await b.newPage(); await p.goto('http://localhost:4612/pat.html'); await p.waitForFunction(()=>window.checkPattern);
 await p.click('#good-trigger'); console.log('good dialog (open):', await p.evaluate(()=>window.checkPattern('#good','dialog')));
 await p.keyboard.press('Escape');
 await p.click('#bad button'); console.log('bad dialog (open):', await p.evaluate(()=>window.checkPattern('#bad','dialog')));
 await p.keyboard.press('Escape');
 console.log('hand-rolled tablist:', await p.evaluate(()=>window.checkPattern('#fake','tabs')));
 // Second route: inject the testing-only bundle into ANY page (no ui-sdk on it) with addScriptTag
 const p2=await b.newPage(); await p2.setContent('<div role="tablist" aria-label="T"><button role="tab" aria-selected="true">A</button></div>'); await p2.addScriptTag({path:path.join(__dirname,'pat-only.js')});
 console.log('injected into plain page:', await p2.evaluate(async()=>{try{await window.checkPattern(document.querySelector('[role=tablist]'),'tabs');return 'ok'}catch(e){return e.message}}));
 await b.close(); s.close();
})().catch(e=>{console.error(e);process.exit(1)});
