// Lazy loader for the ui-* families (00-decisions D-054 item 2).
type LazyChunk = { tag: string; load: () => Promise<unknown>; promise?: Promise<unknown> }

const chunks = new Map<string, LazyChunk>()
let observing = false

// Registers a chunk: `tag` is the root tag whose presence in the document loads it.
function registerLazy(name: string, tag: string, load: () => Promise<unknown>): void {
  if (!chunks.has(name)) chunks.set(name, { tag, load })
}

// Loads a chunk once. Resolves to the chunk's module, or to undefined when it failed.
function loadChunk(name: string): Promise<unknown> {
  const chunk = chunks.get(name)
  if (!chunk) return Promise.resolve(undefined)
  chunk.promise ??= chunk.load().catch((error: unknown) => {
    chunk.promise = undefined
    console.error(`[ripple] chunk "${name}" failed to load`, error)
    return undefined
  })
  return chunk.promise
}

function scan(root: ParentNode): void {
  for (const [name, chunk] of chunks) {
    if (chunk.promise) continue
    const self = root instanceof Element && root.localName === chunk.tag
    if (self || root.querySelector(chunk.tag)) void loadChunk(name)
  }
}

function startLoader(): void {
  if (observing || typeof document === "undefined") return
  observing = true
  const begin = () => {
    scan(document)
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) scan(node)
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true })
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", begin, { once: true })
  } else {
    begin()
  }
}

export { loadChunk, registerLazy, startLoader }
