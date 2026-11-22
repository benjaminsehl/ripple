import http from "node:http"; import fs from "node:fs"; import path from "node:path"
const root = path.resolve("site"); const types={".html":"text/html",".js":"text/javascript",".css":"text/css"}
export const requests=[]
export function start(port=4173){ return new Promise(r=>{ const s=http.createServer((q,res)=>{ const u=new URL(q.url,"http://x"); requests.push(u.pathname+u.search)
  if(u.pathname==="/submit"){res.writeHead(200,{"content-type":"text/html"});return res.end("<pre id=q>"+u.search+"</pre>")}
  const f=path.join(root,u.pathname); if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end("nf")}
  res.writeHead(200,{"content-type":types[path.extname(f)]||"application/octet-stream"}); fs.createReadStream(f).pipe(res)}); s.listen(port,()=>r(s)) }) }
