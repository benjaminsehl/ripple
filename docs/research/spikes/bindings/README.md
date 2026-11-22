# Bindings spike (evidence for docs/06-bindings.md)

One set of 12 fixtures (`fixtures/fixtures.json`) rendered by three bindings and compared with the canonicaliser of `02-html-contract.md` 12.5 (`pkg/canonicalize.ts`, copied verbatim from that document).

- `pkg/` stand-in for `<pkg>` (`index.ts`: `rv`, `cx`), `<pkg>/react` (`react.ts`: `useElement`, `useCart`, `RestProps`, JSX types), `<pkg>/remix` (`remix.ts`: `RestProps`, JSX types).
- `react/`, `remix/`, `liquid/theme/` the bindings of Button, Stack, Dialog, Tabs, ProductForm for each host.
- `browser/` `rp-dialog.ts` (copied from `../elements-runtime/src/elements/`) and `@ui-sdk/web/tabs`, used by the hydration test.
- `run.sh` installs and runs everything; `result.txt` is the output of the last run (100 `ok` lines, 0 `FAIL`).

Versions: react 19.3.1, react-dom 19.3.1, @types/react 19.3.0, remix 3.3.0, typescript 5.9.3, liquidjs 10.30.1, parse5 8.1.1, @shopify/theme-check-node 4.0.2, @ui-sdk/web 0.1.0-beta.14, Chromium via Playwright. Node 22.
