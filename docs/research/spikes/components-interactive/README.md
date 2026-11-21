# Spike: components-interactive

Evidence for `ripple/docs/10-components-interactive.md`. All runs: Playwright Chromium 157.0.8103.78, 2026-11-21.

| File | What it shows | Output |
|---|---|---|
| `t.mjs` | `!important` layer order: a `scripting: none` override works in layer `ui-sdk` and has no effect in `rp.components`; implicit popover anchor with `position-area`; exclusive `<details name>` | `results-t.txt` |
| `popover-placement.mjs` | `css/popover.css` boxes for all 12 `side` / `align` combinations, LTR and RTL, and the flip at the viewport edge | `results-popover.txt` |
| `u.mjs` + `site/t.html` | UI SDK tooltip and toast region: upgrade mutations with the Ripple contract, open-state attributes, a link trigger gets `type="button"` | `results-u.txt` |
| `tabs.mjs` + `site/tabs.html` | UI SDK tabs: the classed `default` fixture upgrades with two same-value `role` writes only; click and keyboard behaviour; event reasons | `results-tabs.txt` |
| `css-test.mjs` + `css/` + `tokens.css` | the nine component CSS files rendered at 1000 px LTR and 600 px RTL; boxes quoted in the acceptance tests | `results-css-test.txt` |
| `v.mjs`, `w.mjs` + `site/toast.html` | FAILED attempts to capture the DOM of a live toast (the autoloader bundle exports no `toast`; an import-map approach returned 404 for core paths). Kept so the next attempt does not repeat them. | none |

Not copied here: `site/web.js` and `site/web/` (the built `@ui-sdk/web` autoloader bundle, copied from the local `uisdk` build output next to `site/t.html` before running `u.mjs` and `tabs.mjs`), and screenshots. In the result files, `childList` records are the HTML parser inserting server markup: the observer is installed before the body is parsed.
