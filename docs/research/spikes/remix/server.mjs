import http from 'node:http'
import fs from 'node:fs'
import { pageA, pageB } from './out/pages.mjs'
import { islandPage } from './out/island-page.mjs'
import { Readable } from 'node:stream'
let count = 0, n = 0
export const requests = []
const server = http.createServer(async (req, res) => {
  let url = new URL(req.url, 'http://x')
  requests.push(`${req.method} ${url.pathname} frame=${req.headers['x-remix-frame'] ?? '-'}`)
  if (url.pathname === '/entry.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(fs.readFileSync(new URL('./out/entry.js', import.meta.url))) }
  if (url.pathname === '/__requests') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(requests)) }
  if (url.pathname === '/api/cart' && req.method === 'POST') {
    let body = ''; for await (let c of req) body += c
    requests.push('cart body ' + body + ' referer=' + req.headers.referer)
    count++
    res.writeHead(303, { location: req.headers.referer ?? '/a' }); return res.end()
  }
  if (url.pathname === '/island') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.write('<!DOCTYPE html>'); return Readable.fromWeb(islandPage(url.searchParams.has('pre'))).pipe(res) }
  let opts = { doc: url.searchParams.has('doc'), closeOnNav: url.searchParams.has('con'), mode: url.searchParams.get('mode') ?? 'none', keyed: url.searchParams.get('keyed') === '1', norp: url.searchParams.has('norp'), htmlPreserve: url.searchParams.has('hp'), count, n: ++n }
  let html = url.pathname === '/a' ? await pageA(opts) : url.pathname === '/b' ? await pageB(opts) : null
  if (html == null) { res.writeHead(404); return res.end('nf') }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end('<!DOCTYPE html>' + html)
})
server.listen(4173, () => console.log('listening'))
