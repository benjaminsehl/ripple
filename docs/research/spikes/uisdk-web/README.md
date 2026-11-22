# Spike: @ui-sdk/web 0.1.0-beta.14 upgrade behaviour

Sources of the spike reported in `../../uisdk-web-elements.md`. `node_modules` and the copied browser build are not checked in.

Re-run:

```bash
npm install                                   # @ui-sdk/web@0.1.0-beta.14 + @ui-sdk/core@0.1.0-beta.14
cp -r node_modules/@ui-sdk/web/browser/* site/ # web.js, web.css, web/
# Build the pages from the body fragments (see the shell in the report, section 11), then:
node run.mjs all-bare.html   # DOM diff no-JS vs upgraded -> out/all-bare.diff.txt
node run.mjs pe-bare.html    # pre-rendered-ARIA variants  -> out/pe-bare.diff.txt
node interact.mjs            # forms, link triggers, open states, custom element, layout shift
node t2.mjs                  # zero-diff, number formatting, link interception, morph resilience
node t3.mjs                  # hidden + author display before/after upgrade
```

Playwright must already be installed globally (`require("playwright")`); never run `playwright install`.
