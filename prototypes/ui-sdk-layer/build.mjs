// Builds dist/index.html: one self-contained page (UI SDK, Ripple and the demo inlined).
// Usage: node build.mjs   (needs @ui-sdk/web and esbuild; see README)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const here = new URL(".", import.meta.url).pathname;
const nm = process.env.UISDK_NODE_MODULES ?? `${here}node_modules`;
const read = (p) => readFileSync(p, "utf8");

const ripple = read(`${here}src/ripple.css`);
const [before, rest] = ripple.split("/* @parts-start */");
const [parts, after] = rest.split("/* @parts-end */");
const tailwind = read(`${here}src/tailwind.css`)
  .replace(/^@layer theme.*$/m, "")
  .replace(/^@import "tailwindcss";$/m, "");

mkdirSync(`${here}dist`, { recursive: true });
execFileSync(`${nm}/.bin/esbuild`, [
  `${here}src/app.js`, "--bundle", "--format=esm", "--minify",
  `--outfile=${here}dist/app.js`, `--resolve-extensions=.js`,
], { env: { ...process.env, NODE_PATH: nm }, stdio: "inherit" });

const html = read(`${here}src/demo.html`)
  .replace("{{UISDK_CSS}}", () => read(`${nm}/@ui-sdk/web/browser/web.css`))
  .replace("{{RIPPLE_CSS}}", () => before + after)
  .replace("{{RIPPLE_PARTS_CSS}}", () => parts)
  .replace("{{THEMES_CSS}}", () => read(`${here}src/themes.css`))
  .replace("{{TAILWIND_THEME}}", () => tailwind)
  .replace("{{APP_JS}}", () => read(`${here}dist/app.js`).replace(/<\/script/g, "<\\/script"));
writeFileSync(`${here}dist/index.html`, html);
console.log("dist/index.html", (html.length / 1024).toFixed(0), "KB");
