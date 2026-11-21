#!/bin/sh
# Re-runs every check of the bindings spike. Needs npm access for `npm install` and a Playwright Chromium (preinstalled).
set -e
npm install --no-audit --no-fund
E="npx esbuild --bundle --format=esm --jsx=automatic --log-level=warning"
mkdir -p out
$E pkg/canonicalize.ts --platform=node --external:parse5 --outfile=out/canonicalize.mjs
echo "== typecheck (React 19 JSX, Remix 3 JSX)"
npx tsc -p tsconfig.react.json
npx tsc -p tsconfig.remix.json
echo "== React SSR conformance"
$E react/ssr.tsx --platform=node --external:react --external:react-dom --external:parse5 --outfile=out/react-ssr.mjs
node out/react-ssr.mjs
echo "== Remix SSR conformance"
$E remix/ssr.tsx --platform=node --jsx-import-source=remix/component --external:remix --external:parse5 --outfile=out/remix-ssr.mjs
node out/remix-ssr.mjs
echo "== Liquid shim conformance + Theme Check"
node liquid/run.mjs
node liquid/check.mjs liquid/theme
echo "== React hydration (both orders, 3 modes) and client render, Chromium, development build"
$E react/app.tsx --platform=node --external:react --external:react-dom --outfile=out/app.mjs '--define:process.env.NODE_ENV="development"'
$E react/client.tsx --jsx-dev --outfile=out/client.js '--define:process.env.NODE_ENV="development"'
$E react/client2.tsx --jsx-dev --outfile=out/client2.js '--define:process.env.NODE_ENV="development"'
$E browser/elements.ts --outfile=out/elements.js
NODE_ENV=development node react/hydrate-test.mjs
NODE_ENV=development node react/client-render-test.mjs
