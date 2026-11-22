// Stand-in for `pnpm build` in this spike: builds the one browser file the tests load and a pkg/ marker.
import { build } from "esbuild"
import { mkdirSync, writeFileSync } from "node:fs"
await build({ entryPoints: ["src/tabs-entry.ts"], bundle: true, format: "esm", platform: "browser", target: "es2022", minify: true, outfile: "out/ripple-tabs.js", logLevel: "warning" })
mkdirSync("pkg", { recursive: true }); writeFileSync("pkg/package.json", "{}\n")
