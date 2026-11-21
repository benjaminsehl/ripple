# Spike: test runner and harness for docs/13-testing.md

Run: `npm install && node prepare.mjs && pnpm test` (Playwright 1.63.0 and Chromium preinstalled on the machine; the sibling spike `../bindings` supplies the theme, fixtures and canonicaliser used by `test/shim.test.ts`). Output: `result.txt` (22 passed, 0 failed).

Files that `docs/13-testing.md` reproduces: `test/run.ts` (runner), `src/liquid-shim.ts`, `src/serve-theme.ts`, `src/resources.ts`, `src/upgrade-diff.ts`, `src/harness.ts`.

Verified on Node 22.23.5, esbuild 0.28.2, @ui-sdk/core and @ui-sdk/web 0.1.0-beta.14, axe-core 4.14.1, react 19.3.1:

1. `node --test <file under node_modules/>` prints `Could not find '<file>'`. `run({ files })` from `node:test` accepts the same files. The runner therefore uses `run()`.
2. esbuild bundles `*.test.ts` (extensionless imports, `packages: "external"`, inline source maps) and failures are reported at the `.ts` line with `--enable-source-maps`.
3. A recorder installed with `page.addInitScript` that starts its `MutationObserver` at `readystatechange` to `interactive` records no parser insertions and records every write by module scripts.
4. Upgrading the Tabs `default` fixture of `02-html-contract.md` 11.9: 2 records inside the root, both same-value attribute writes (`role="none"` to `role="none"` on each `ui-tabs-tab`); 0 value-changing records.
5. `checkPattern` from `@ui-sdk/core/testing`, bundled as an IIFE and injected with `page.addScriptTag`, runs in the page and returns without error for the Tabs fixture.
6. `axe-core` injected with `page.addScriptTag` runs on the fixture and reports zero violations.
7. `javaScriptEnabled: false` and `context.route(/\/ripple[^/]*\.js(\?.*)?$/, abort)` both leave `ui-tabs` undefined and give identical boxes.
8. A placeholder text child (`RPCHILDREN0`) passes through `renderToString` unescaped and is replaced by the children fragment afterwards.
9. A top-level `before()` hook that launches a browser still runs when a name filter excludes every test of the file, and the matching `after()` hook then never runs: the run hangs. Launching lazily from the first test (`setup()`) and closing in `after()` only when started does not hang. A failing test gives exit code 1; a `{ skip: "<reason>" }` test is reported as skipped with the reason.
10. `test/run.ts` through the `pnpm test:run` script: `--tiers`, `--grep`, `--no-skips` and unknown arguments behave as specified (exit codes 0, 1, 2); the report is written to `node_modules/.cache/ripple/report/test-report.json`.
11. `src/liquid-shim.ts` (TypeScript port of `../liquid/shim.mjs` plus `image_url`, `t` with named arguments and plural keys, the `cart` form, `renderPage`): 6 of the bindings spike fixtures conform; an undefined filter, a missing translation and `image_url` without a size throw.
12. `src/serve-theme.ts`: a no-JS add-to-cart form post (multipart) and a remove link work against the in-memory cart; the server-backed Standard Actions emulation and the `@shopify/partial-rendering` emulation work from a page through the injected import map. Not run: any real `ripple.js` commerce element against this server.
13. `src/upgrade-diff.ts`: `page.addInitScript(fn, arg)` carries the allow-list into the page; removing `aria-selected` and `aria-controls` from the Tabs fixture yields exactly two failures in the required message format; an allow-list entry with `subtree: true` permits them.
14. `src/fixtures.ts` (`tokenizeChildren`, `restoreChildren`, `resolveProps`), `test/support/hosts/liquid.ts` (`liquidCaseSource`, `renderLiquidCase`) and `test/support/hosts/tsx.ts` (`caseJsx`, `caseModuleSource`): the Liquid case builder reproduces the hand-written templates of the bindings spike and its output conforms for Button and Tabs; a generated TSX case module bundles with esbuild, renders through `react-dom/server`, and conforms after the children are restored.

Layout note: in the Ripple repository these files live under `src/testing/` and `test/support/`; the one-line files in `src/testing/` here only re-export so that the adapter imports have their final paths.
15. `src/gen/size.ts` with `lightningcss` 1.33.0: `measureSizes` reports `ok`, `over` and `missing` for `gzip`, `min-gzip` and `min` entries and for a glob entry.
