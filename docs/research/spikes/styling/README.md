# Styling spike
Run (after `npm i`): `node gen-layout.mjs && node gen-theme.mjs && npx @tailwindcss/cli -i tw/app.css -o tw/app.out.css && npx @tailwindcss/cli -i tw/static.css -o tw/static.out.css && node tests/layout.test.mjs && node tests/system.test.mjs && node tests/cls.test.mjs && node tests/perf.test.mjs && npx @tailwindcss/cli -i tw/app-late.css -o tw/app-late.out.css && node tests/layer-order.test.mjs && node measure.mjs tw/static.out.css`
Report: src/ripple/docs/research/styling-spike.md
