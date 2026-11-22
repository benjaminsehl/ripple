import { rmSync } from "node:fs"
import { buildBrowserBundles } from "./src/gen/browser-bundles"

rmSync("out", { recursive: true, force: true })
const sizes = await buildBrowserBundles({
  mains: {
    ripple: ["src/elements/index.ts", "src/fake-commerce.ts"],
    "ripple.elements": ["src/elements/index.ts"],
  },
  agentEntry: "src/agent/index.ts",
  outDir: "out/browser",
  liquidDir: "out/liquid",
  liquidMain: "ripple",
})
for (const size of sizes) console.log(size.file.padEnd(28), String(size.raw).padStart(7), "raw", String(size.gzip).padStart(6), "gzip")
