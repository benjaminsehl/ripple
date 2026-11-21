import { createServer, type Server } from "node:http"
import { readFile } from "node:fs/promises"
import { extname, join, normalize } from "node:path"
import { createRequire } from "node:module"
import type { Browser, BrowserContext, Page } from "playwright"
const pw = createRequire(import.meta.url)("playwright") as typeof import("playwright")

const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" }

export async function serveStatic(roots: Record<string, string>, pages: Map<string, string> = new Map()): Promise<{ url: string; close(): Promise<void> }> {
  const server: Server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname)
    if (pages.has(path)) { res.writeHead(200, { "content-type": TYPES[".html"]! }); res.end(pages.get(path)); return }
    for (const [prefix, dir] of Object.entries(roots)) {
      if (!path.startsWith(prefix)) continue
      const file = join(dir, normalize(path.slice(prefix.length)).replace(/^(\.\.[/\\])+/, ""))
      try { const body = await readFile(file); res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }); res.end(body); return } catch {}
    }
    res.writeHead(404); res.end("not found")
  })
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r))
  const { port } = server.address() as { port: number }
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(() => r())) }
}

export type Engine = "chromium" | "webkit" | "firefox"
export async function launch(engine: Engine = (process.env.RIPPLE_ENGINE as Engine) ?? "chromium"): Promise<Browser> {
  return pw[engine].launch()
}
export type ScriptMode = "on" | "disabled" | "blocked"
export async function openPage(browser: Browser, mode: ScriptMode, viewport = { width: 1280, height: 720 }): Promise<{ context: BrowserContext; page: Page; errors: string[] }> {
  const context = await browser.newContext({ viewport, javaScriptEnabled: mode !== "disabled", reducedMotion: "reduce" })
  if (mode === "blocked") await context.route(/\/ripple[^/]*\.js(\?.*)?$/, (route) => route.abort())
  const page = await context.newPage()
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`))
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console.error: ${m.text()}`) })
  return { context, page, errors }
}
