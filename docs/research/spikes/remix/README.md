# Remix 3 binding spike

Versions: remix@3.3.0 (@remix-run/component@1.3.0), @ui-sdk/web@0.1.0-beta.14, Node 22 (Remix requires >=24.3 for its own dev server; this spike only uses the component runtime, bundled with esbuild).

    npm install
    B="--bundle --jsx=automatic --jsx-import-source=remix/component --log-level=warning"
    npx esbuild src/ssr.tsx $B --platform=node --format=esm --outfile=out/ssr.mjs && node out/ssr.mjs   # SSR output of each binding
    npx tsc -p .                                                                                      # typecheck
    npx esbuild src/pages.tsx $B --platform=node --format=esm --outfile=out/pages.mjs
    npx esbuild src/island-page.tsx $B --platform=node --format=esm --outfile=out/island-page.mjs
    npx esbuild src/entry.ts $B --format=esm --target=es2022 --outfile=out/entry.js
    node run.mjs      # frame reload / navigation / forms  -> out/result.txt
    node island.mjs   # bindings inside a clientEntry      -> out/island-result.txt
    node race.mjs     # hydration race + node identity     -> out/race-result.txt
