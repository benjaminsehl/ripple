import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { extname, join, normalize } from "node:path"
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" }
const root = process.cwd()
export function serve(port = 0) {
  return new Promise((done) => {
    const server = createServer(async (req, res) => {
      const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname))
      try {
        const body = await readFile(join(root, path))
        res.writeHead(200, { "content-type": types[extname(path)] ?? "text/plain" })
        res.end(body)
      } catch {
        res.writeHead(404)
        res.end("not found")
      }
    })
    server.listen(port, "127.0.0.1", () => done({ server, url: `http://127.0.0.1:${server.address().port}` }))
  })
}
