# Spike: elements-runtime (covers SPIKE-04 `rp-root-only-primitive`, default path)

Backs `docs/04-elements.md`. Run on 2026-11-21 with `@ui-sdk/core` and `@ui-sdk/web` 0.1.0-beta.14, Rollup 4.24.0, Chromium 157 (Playwright). WebKit and Gecko were not available.

## What was run

| Question | Result | Output |
|---|---|---|
| Does `definePrimitive` + `createParts` with only a `root` part work (upgrade, events, live property, descendant replacement, disconnect and reconnect, agent bridge)? | Yes, for `rp-quantity`, `rp-dialog`, `rp-carousel`, `rp-navigation-menu`. | `results-test.txt`, `results-dialog2.txt` |
| Is the pre-rendered contract upgrade-stable with Ripple's own bundle? | Zero value-changing mutations inside `rp-*`, `ui-tabs`, `ui-tooltip` roots. `ui-toast-region` gets `style` writes and an `<ol>` child. `ui-tabs-tab` gets a same-value `role="none"` write. | `results-test.txt` |
| Can one Rollup build give `<main>.js` plus lazy chunks that import the kernel from it? | Yes, with one extra file `<main>-shared.js` (code shared by tooltip and toast). | `results-build.txt` |
| Does the bare-specifier (Liquid) form work behind one import map? | Yes; one request per file, one kernel instance. | `results-liquid.txt` |
| Does the agent bridge see root-only `rp-*` primitives and honour `data-agent-confirm` on a native button inside one? | Yes. A root with `display: contents` is NOT listed (`checkVisibility()` is false). | `results-test.txt`, `results-agent-confirm.txt` |
| Invoker Commands polyfill | Simulated only (native support hidden in Chromium). | `results-polyfill.txt` |

## Reproduce

```bash
npm install
npx tsc -p .
npx esbuild build.ts --bundle --platform=node --format=esm --packages=external --outfile=node_modules/.cache/build.mjs
node node_modules/.cache/build.mjs
node test.mjs && node test-dialog2.mjs && node test-liquid.mjs && node test-polyfill.mjs && node probe-agent.mjs
```

`src/` holds the exact source files quoted in `docs/04-elements.md`. `src/fake-commerce.ts` stands in for `src/commerce/index.ts`.

`fallback/element.ts` is the SPIKE-04 fallback base class quoted in `docs/04-elements.md` (typechecked only, never run).
