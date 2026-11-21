#!/bin/sh
# Rebuilds every spike bundle into ./out. Run from this directory after:
#   npm i react@19 react-dom@19 @ui-sdk/web@0.1.0-beta.14 @ui-sdk/react@0.1.0-beta.14 @ui-sdk/core@0.1.0-beta.14 esbuild
# The .mjs runners resolve Playwright from /opt/node-tools (edit createRequire(...) if yours lives elsewhere).
set -e
mkdir -p out
E="npx esbuild --bundle --log-level=error"
$E src/elements.js  --format=iife --outfile=out/elements.js
$E src/elements2.js --format=iife --outfile=out/elements2.js
$E src/all.js       --format=iife --outfile=out/all.js
for env in development production; do
  $E src/server.jsx --platform=node --format=cjs --jsx=automatic --define:process.env.NODE_ENV=\"$env\" --outfile=out/server.$env.cjs
  $E src/client.jsx --format=iife --jsx=automatic --define:process.env.NODE_ENV=\"$env\" --outfile=out/client.$env.js
done
for name in props drawer b final; do
  $E src/$name.jsx --platform=node --format=cjs --jsx=automatic --define:process.env.NODE_ENV=\"development\" --outfile=out/$name.server.cjs
  $E src/$name.jsx --format=iife --jsx=automatic --define:process.env.NODE_ENV=\"development\" --outfile=out/$name.client.js
done
$E src/props.jsx --format=iife --jsx=automatic --define:process.env.NODE_ENV=\"production\" --outfile=out/props.client.prod.js
# Runners: node base.mjs | node run.mjs <min|static|static-ctl> <elements-first|hydrate-first> <development|production> [v]
#          node props.mjs | node props2.mjs | node struct.mjs | node idem.mjs | node drawer.mjs | node b.mjs | node final.mjs | node unmount.mjs
