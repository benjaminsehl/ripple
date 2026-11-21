# Liquid block spike

Renders Ripple example block files without Shopify (liquidjs + a shim for
`{% block %}`, `{% partial %}`, `{% doc %}`, `{% schema %}`, `{% form 'product' %}`)
and lints them with the real Theme Check.

```
npm i liquidjs@10.30.1 @shopify/theme-check-node@4.0.2 parse5
node render.mjs        # 13 cases: block output vs expected HTML, after canonicalisation; exits 1 on any diff
node check.mjs theme   # Theme Check, theme-check:recommended; expects 0 offenses
./neg.sh               # theme + negsrc/ (deliberately wrong files); expected offenses are in result.txt
gem install liquid && ruby sem.rb   # reference Ruby Liquid semantics for the constructs the blocks use
```

- `theme/` example theme: blocks, snippets, templates, layout, locales.
- `shim.mjs` the local stand-in for Shopify's renderer. Not a Shopify emulator.
- `canon.mjs` HTML canonicaliser used to compare bindings.
- `result.txt` recorded output of every command above.

Findings: `../../liquid-blocks-partials.md`.
