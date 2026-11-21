# Styling files for docs/03-styling-and-tokens.md

The exact CSS and generator files printed in `docs/03-styling-and-tokens.md`, plus the checks that were run on them.

Needs `tailwindcss`, `@tailwindcss/cli` and `lightningcss` (use the `node_modules` of `../styling`: `ln -s ../styling/node_modules node_modules`) and Playwright with Chromium.

```sh
node gen/run.ts            # writes css/props.css and css/theme.css from css/tokens.css
node gen/run-display.ts    # prints IDENTICAL when the regions of css/base.css match the generator
node measure.mjs           # minified, gzip and brotli sizes; writes out/ripple.min.css (mkdir out first)
node test.mjs              # browser assertions on out/ripple.min.css
node soft.mjs              # contrast of the tone x variant formulas
cp css/*.css tw/ripple/ && cp css/components/button.css tw/ripple/components/
npx @tailwindcss/cli -i tw/app.css -o tw/app.out.css && node tw-test.mjs
```
