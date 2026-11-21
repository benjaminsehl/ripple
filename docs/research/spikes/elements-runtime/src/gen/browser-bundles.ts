// Builds the browser bundles (04-elements.md section 7).
// For each main entry it writes <main>.js, <main>-tabs.js, <main>-tooltip.js,
// <main>-toast.js, <main>-agent.js and at most one <main>-shared.js.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { gzipSync } from "node:zlib"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import terser from "@rollup/plugin-terser"
import { transform } from "esbuild"
import { rollup, type OutputChunk, type Plugin } from "rollup"

type BrowserBundleOptions = {
  /** Main bundle base name -> source files whose exports the bundle re-exports, in order. */
  mains: Record<string, string[]>
  /** Source file of the agent entry, reached only by `loadAgent()` or by loading <main>-agent.js. */
  agentEntry: string
  /** Directory for the relative-import form (pkg/browser). */
  outDir: string
  /** Directory for the bare-specifier form (pkg/registry/liquid/assets). */
  liquidDir: string
  /** The main bundle that the Liquid form is made from. */
  liquidMain: string
  /** Specifiers left as imports (platform-provided modules). */
  external?: string[]
  /** Replacement source for src/identity.ts (01-architecture.md section 7 step 3). */
  identity?: { file: string; code: string }
}

type BundleSize = { file: string; raw: number; gzip: number }

// Base name of the source file of each lazy chunk -> output suffix.
const CHUNK_NAMES: Record<string, string> = {
  "ui-tabs": "tabs",
  "ui-tooltip": "tooltip",
  "ui-toast": "toast",
  index: "agent", // src/agent/index.ts
}
const HOIST = "\0ripple-hoist"
const ENTRY = "\0ripple-entry:"

function stripTypes(identity?: { file: string; code: string }): Plugin {
  const identityFile = identity ? resolve(identity.file) : ""
  return {
    name: "ripple-strip-types",
    load(id) {
      return identity && id === identityFile ? identity.code : null
    },
    async transform(code, id) {
      if (!id.endsWith(".ts")) return null
      const out = await transform(code, { loader: "ts", target: "es2022" })
      return { code: out.code, map: null }
    },
  }
}

// The virtual entry of a main bundle. It re-exports every source file of the
// bundle, exports `loadAgent`, and imports every module in `hoisted`, so that
// those modules are emitted in the main file.
function entry(main: string, sources: string[], agentEntry: string, hoisted: Set<string>): Plugin {
  const id = ENTRY + main
  return {
    name: "ripple-entry",
    resolveId(source) {
      return source === id || source === HOIST ? source : null
    },
    load(loaded) {
      if (loaded === HOIST) {
        return [...hoisted].map((module) => `import ${JSON.stringify(module)}`).join("\n")
      }
      if (loaded !== id) return null
      return [
        `import ${JSON.stringify(HOIST)}`,
        ...sources.map((file) => `export * from ${JSON.stringify(resolve(file))}`),
        `export const loadAgent = () => import(${JSON.stringify(resolve(agentEntry))})`,
      ].join("\n")
    },
    transform(code, transformed) {
      return hoisted.has(transformed) ? { code, map: null, moduleSideEffects: "no-treeshake" } : null
    },
  }
}

async function buildMain(main: string, sources: string[], options: BrowserBundleOptions): Promise<void> {
  const hoisted = new Set<string>()
  const named = new Set([main, ...Object.keys(CHUNK_NAMES)])
  for (let pass = 1; pass <= 8; pass++) {
    const build = await rollup({
      input: { [main]: ENTRY + main },
      external: options.external ?? [],
      preserveEntrySignatures: "allow-extension",
      onwarn(warning, warn) {
        if (warning.code !== "CIRCULAR_DEPENDENCY") warn(warning)
      },
      plugins: [entry(main, sources, options.agentEntry, hoisted), stripTypes(options.identity), nodeResolve({ extensions: [".ts", ".js", ".mjs"] }), terser()],
    })
    const output = {
      dir: options.outDir,
      format: "es" as const,
      entryFileNames: "[name].js",
      chunkFileNames: (chunk: { name: string }) =>
        CHUNK_NAMES[chunk.name] ? `${main}-${CHUNK_NAMES[chunk.name]}.js` : `${main}-shared.js`,
    }
    const generated = await build.generate(output)
    const shared = generated.output
      .filter((file): file is OutputChunk => file.type === "chunk" && !named.has(file.name))
      .sort((a, b) => b.code.length - a.code.length)
    if (shared.length <= 1) {
      await build.write(output)
      await build.close()
      return
    }
    // Keep the largest shared chunk as <main>-shared.js; move the others into the main file.
    for (const chunk of shared.slice(1)) for (const id of Object.keys(chunk.modules)) hoisted.add(id)
    await build.close()
  }
  throw new Error(`${main}: more than one shared chunk remains after 8 passes`)
}

// Liquid assets may not import each other by relative path. Rewrites
// "./<main>.js" to "ripple" and "./<main>-<chunk>.js" to "ripple/<chunk>",
// and names the files ripple.js and ripple-<chunk>.js.
function writeLiquidForm(options: BrowserBundleOptions): void {
  const main = options.liquidMain
  mkdirSync(options.liquidDir, { recursive: true })
  const escaped = main.replace(/\./g, "\\.")
  const specifier = new RegExp(`(["'])\\./${escaped}(?:-([a-z]+))?\\.js\\1`, "g")
  for (const file of readdirSync(options.outDir)) {
    if (file !== `${main}.js` && !file.startsWith(`${main}-`)) continue
    const code = readFileSync(join(options.outDir, file), "utf8").replace(
      specifier,
      (_match: string, quote: string, chunk: string | undefined) =>
        chunk ? `${quote}ripple/${chunk}${quote}` : `${quote}ripple${quote}`
    )
    if (/(?:from|import)\s*\(?\s*["']\.{1,2}\//.test(code)) {
      throw new Error(`${file}: a relative import is left after the rewrite`)
    }
    writeFileSync(join(options.liquidDir, file.replace(main, "ripple")), code)
  }
}

async function buildBrowserBundles(options: BrowserBundleOptions): Promise<BundleSize[]> {
  mkdirSync(options.outDir, { recursive: true })
  for (const [main, sources] of Object.entries(options.mains)) await buildMain(main, sources, options)
  writeLiquidForm(options)
  return readdirSync(options.outDir)
    .filter((file) => file.endsWith(".js"))
    .sort()
    .map((file) => {
      const bytes = readFileSync(join(options.outDir, file))
      return { file, raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length }
    })
}

export { buildBrowserBundles, type BrowserBundleOptions, type BundleSize }
