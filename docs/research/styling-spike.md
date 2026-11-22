# Styling spike: props, tokens, dials, component CSS, pre-upgrade styling

Status: investigation complete. Everything marked **Verified** was run in this environment
(Chromium 157 via Playwright, Node 22, `tailwindcss` 4.3.5 and `@tailwindcss/cli` installed from
the npm registry, which was reachable). Anything not run or not read in source is marked
**UNVERIFIED**. Browser version numbers for Safari and Firefox are from memory, not from a run:
only Chromium is installed here, so every Safari/Firefox statement is **UNVERIFIED** until a
WebKit and Gecko run exists.

Spike source: `docs/research/spikes/styling/` (copy of the working directory
`/tmp/claude-0/-home-user/479d4208-eab8-516e-866a-427bc015f063/scratchpad/spikes/styling`).

| File | What it is |
|---|---|
| `gen-layout.mjs` | Generates the layout-prop CSS for design A and design B, prints sizes |
| `gen-theme.mjs` | Generates `ripple/theme.css` (`@theme reference`) from `ripple/tokens.css` |
| `ripple/layers.css`, `tokens.css`, `base.css`, `layout.css`, `button.css` | The proposed CSS, as real files |
| `tw/app.css`, `tw/page.html` | Tailwind v4 build that includes the Ripple files |
| `tw/apply-button.css` | The Button authored with `@apply`, for comparison |
| `tw/static.css` | The same prop matrix compiled as Tailwind utilities, for size comparison |
| `tests/layout.test.mjs` | 15 assertions: cascade, colon escaping, design B leak, typed `attr()` |
| `tests/system.test.mjs` | 16 assertions: layer precedence, no-build render, dials, schemes, contrast |
| `tests/cls.test.mjs`, `tests/layer-order.test.mjs`, `tests/perf.test.mjs` | Layout shift, wrong layer order, style recalc cost |
| `out/system.png` | Screenshot: Button matrix in light, dark, yellow-brand and pill/dense/large-type scopes |

Re-run: see `docs/research/spikes/styling/README.md` (needs `npm i` in that directory).

---

## 0. Results in one page

1. **Attribute-token responsive props work and are the right design.** `data-gap="2 md:6"`
   matched by `[data-gap~="md:6"]` inside `@media` is correct in every case tested. The full
   layout-prop layer (15 props, 16 spacing steps, base + 5 breakpoints, 942 rules) is
   54.4 kB minified, **4.9 kB gzip, 2.4 kB brotli**. The same matrix as Tailwind utilities is
   43.8 kB / 4.5 kB / 2.5 kB, so the attribute form costs nothing extra on the wire.
2. **The custom-property alternative is smaller (0.8 kB brotli) but worse**: it needs an inline
   `style` attribute plus a marker attribute, leaks values into nested layout elements unless 90
   `@property` rules are registered (Firefox 128+), and its values cannot be enumerated by CSS.
   Typed `attr()` works in Chromium only. Recommendation: design A.
3. **A collision was found and fixed**: UI SDK writes `data-align="start|center|end"` on popup
   content. Flex-only props (`align`, `justify`, `direction`, `wrap`, `columns`) MUST be scoped
   to the layout primitives with `:where()`.
4. **Layer order that works**: `@layer ui-sdk, theme, base, rp, components, utilities;` with
   `@layer rp.tokens, rp.base, rp.components, rp.props;`. Tailwind utilities beat Ripple props
   and component CSS; a project's own `@layer components` rules beat Ripple. **The statement
   MUST come before `@import "tailwindcss"`**; placed after it, Ripple silently beats utilities
   (verified failure).
5. **One token source, two consumers, no generated values**: `tokens.css` is plain CSS and is
   the only place values live. Tailwind learns the names from a generated
   `@theme reference { ... }` block, which makes `bg-primary`, `rounded-md`, `text-lg`, `gap-4`,
   `h-control-md`, `z-sticky`, `duration-fast` compile to `var(--name, fallback)` without
   emitting any variables. Verified with a real build; utilities follow the dials at runtime.
6. **Six dials derive everything**: `--rp-background`, `--rp-foreground`, `--rp-brand`,
   `--rp-radius`, `--rp-density`, `--rp-text-scale`. Derived tokens MUST be declared on
   `:root, [data-scheme]`, not on `:root` alone, or re-scoping does nothing (verified bug).
7. **Automatic foreground-on-brand** using relative color syntax on the XYZ luminance channel
   picks the better of black/white for all 1,385 in-gamut samples (minimum contrast 4.58:1).
   The base theme's `color_brightness > 128` heuristic picks the worse one in 78 of the same
   samples.
8. **Component CSS is plain CSS, not `@apply`.** Compiled `@apply` output depends on Tailwind's
   `@property --tw-*` registrations (`border-style: var(--tw-border-style)`), so it cannot be
   shipped as a prebuilt file without Tailwind's runtime layer. The authoring pattern in
   section 4 is mechanical: modifiers set custom properties only.
9. **Pre-upgrade layout shift is real and fixable with static CSS**: an undefined wrapper
   element caused a 50 px shift (CLS 0.014) on upgrade in a product-form layout; with static
   `display` rules the shift is 0.
10. **The UI SDK does not write `data-state`.** It writes presence attributes (`data-open`,
    `data-closed`, `data-pending`, `data-disabled`, ...). Component CSS MUST select those.

---

## 1. Responsive layout props

### 1.1 Grammar

```
prop-value := token ( " " token )*
token      := value | breakpoint ":" value
breakpoint := "sm" | "md" | "lg" | "xl" | "2xl"
value      := one of the prop's enumerated values (manifest)
```

- Token order inside the attribute does not matter (verified: `"xl:10 md:6 2"` equals
  `"2 md:6 xl:10"`).
- At most one token per breakpoint. Two base tokens (`"2 4"`) both match; the later CSS rule
  wins. The checker MUST reject this.
- A bare token applies from width 0. `md:6` applies from 48rem up, until a larger breakpoint
  token overrides it. If no bare token is present, the component default applies below the
  first breakpoint (verified: `data-gap="md:6"` on `.rp-stack` gives the Stack default 16 px
  at 375 px and 24 px at 800 px).
- `~=` matches whole whitespace-separated tokens, so `"16"` does not match `md:16` or `6`
  (verified).

The binding API in every host is the same string: `gap="2 md:6"` (React/Remix),
`gap: '2 md:6'` (Liquid), `data-gap="2 md:6"` (HTML). Bindings print the value unchanged.
A binding MAY also accept a number (`gap={4}`) and print it with `String()`.

### 1.2 Generated CSS (design A)

Generator: `docs/research/spikes/styling/gen-layout.mjs`. Shape of the output:

```css
@layer rp.props {
  [data-gap~="0"]{gap:0}
  [data-gap~="2"]{gap:calc(var(--spacing) * 2)}
  [data-p~="4"]{padding:calc(var(--spacing) * 4)}
  [data-px~="4"]{padding-inline:calc(var(--spacing) * 4)}
  :where(.rp-stack,.rp-inline,.rp-grid)[data-align~="center"]{align-items:center}
  :where(.rp-grid)[data-columns~="3"]{grid-template-columns:repeat(3,minmax(0,1fr))}
  [data-hidden~="true"]{display:none}
  [data-hidden~="false"]{display:revert-layer}
  @media (min-width:40rem){
    [data-gap~="sm:0"]{gap:0}
    /* every prop again with the sm: prefix */
  }
  @media (min-width:48rem){ /* md: */ }
  @media (min-width:64rem){ /* lg: */ }
  @media (min-width:80rem){ /* xl: */ }
  @media (min-width:96rem){ /* 2xl: */ }
}
```

Rules the generator MUST follow (each verified in `tests/layout.test.mjs`):

1. **One block per breakpoint, ascending; inside a block, props in a fixed order with
   shorthands before longhands**: `gap, gap-x, gap-y, p, px, py, pt, pb, direction, wrap, align,
   justify, columns, span, hidden`. This reproduces Tailwind's semantics:
   `data-p="2 md:6" data-px="4"` gives inline padding 16 px below `md` and 24 px from `md`
   (the `md:` shorthand beats the base longhand), exactly as `p-2 md:p-6 px-4` does.
   Grouping by prop first (all `p` breakpoints, then all `px` breakpoints) gives a different,
   wrong result.
2. **Every selector has specificity (0,1,0).** Scoping uses `:where()`, which adds none.
3. **Values are always quoted in authored CSS.** `[data-gap~="md:6"]` needs no escaping.
   Unquoted, the colon MUST be escaped (`[data-gap~=md\:6]`); a bare `[data-gap~=md:6]` is a
   parse error and the rule is dropped (verified). lightningcss minification rewrites the quoted
   form to the escaped unquoted form, which is valid and passes the same tests.
   `document.querySelectorAll('[data-gap~="md:6"]')` works.
4. **Logical properties only**: `padding-inline`, `padding-block`, `padding-block-start`,
   `padding-block-end`. This matches the base theme's RTL rule (`theme/AGENTS.md`,
   "Right-to-left language support").
5. **Flex/grid-only props are scoped to layout primitives**:
   `direction`, `wrap` to `:where(.rp-stack,.rp-inline)`; `align`, `justify` to
   `:where(.rp-stack,.rp-inline,.rp-grid)`; `columns` to `:where(.rp-grid)`.
   Reason: UI SDK writes `data-align="start|center|end"` together with `data-side` on positioned
   popup content (`uisdk/packages/core/src/foundation/platform/position.ts`; attribute list in
   `docs/research/uisdk-web-elements.md`, appendix). An unscoped `[data-align~="start"]` would set
   `align-items` on every popover. Verified: `<ui-popover-content data-align="center">` is not
   matched.
   `gap*`, `p*`, `span`, `hidden` stay unscoped so they work on any element (Section, Card, a
   grid child).
6. **`hidden` uses `display: revert-layer` to un-hide**, so the element returns to whatever
   `rp.components` gave it (`flex`, `grid`, ...) without a per-component rule. Verified:
   `.rp-stack[data-hidden="true md:false"]` is `none` at 375 px and `flex` at 800 px.
7. **Minifier targets.** With no targets, lightningcss rewrites `(min-width:40rem)` to
   `(width>=40rem)` (media range syntax: Chrome 104, Safari 16.4, Firefox 63). That is inside
   the support floor in section 7, but the build MUST set explicit browser targets so the
   output is a decision, not an accident.

Prop names Ripple MUST NOT use as `data-*` attributes because UI SDK writes them:
`data-align` (handled by scoping), `data-side`, `data-orientation`, `data-type`, `data-value`,
`data-count`, `data-index`, `data-open`, `data-closed`, `data-disabled`, `data-pending`,
`data-selected`, `data-checked`, `data-active`, `data-current`, `data-slot`
(`docs/research/uisdk-web-elements.md`, appendix "Data Attributes"). The manifest build MUST
fail if a Ripple prop attribute equals a UI SDK state attribute and is not scoped.

### 1.3 Precedence against Tailwind (verified with a real Tailwind 4.3.5 build)

`tests/system.test.mjs`, section 1, using `tw/app.css`:

| Markup | Result | Meaning |
|---|---|---|
| `class="rp-stack gap-8" data-gap="2 md:6"` | 32 px at every width | utility beats prop |
| `class="rp-stack md:gap-10" data-gap="2 md:6"` | 8 px at 375, 40 px at 800 | responsive utility beats prop only where active |
| `class="rp-button bg-red-500 rounded-none h-20"` | radius 0, height 80 px | utilities beat component CSS |
| `class="rp-button my-button"` with `.my-button` in `@layer components` | project color | project components layer beats Ripple |

Failure mode (`tests/layer-order.test.mjs`, `tw/app-late.css`): with the Ripple layer statement
placed after `@import "tailwindcss"`, Tailwind's own `@layer theme, base, components, utilities;`
is seen first, `ui-sdk` and `rp` are appended after `utilities`, and Ripple wins:
`class="gap-8" data-gap="2 md:6"` renders 24 px and `rounded-none` is ignored.

### 1.4 Size (measured, `node gen-layout.mjs`, `node measure.mjs`)

Spacing subset: `0 0.5 1 1.5 2 3 4 5 6 8 10 12 16 20 24 32` (16 steps). Breakpoints: base + 5.

| Output | Rules | Minified | gzip -9 | brotli 11 |
|---|---:|---:|---:|---:|
| **A full**: gap, gap-x, gap-y, p, px, py, pt, pb, direction, wrap, align, justify, columns, span, hidden | 942 | 54,446 | 4,933 | 2,353 |
| A core: without gap-x, gap-y, pt, pb | 558 | 32,334 | 3,085 | 1,651 |
| A spacing only: gap, p, px, py | 384 | 20,132 | 1,885 | 967 |
| B: custom-property design, same 15 props (without the 90 `@property` rules it needs) | 105 | 7,819 | 1,014 | 836 |
| Same matrix as Tailwind utilities (`tw/static.css`, `@source inline(...)`) | - | 43,777 | 4,502 | 2,501 |

For scale: the base theme's whole compiled stylesheet `theme/assets/styles.min.css` is
86,431 bytes, 15,895 gzip.

### 1.5 Style recalculation cost (measured, `tests/perf.test.mjs`)

Median of 7 runs, 5,000 `<div>` + 5,000 `<span>`, forced style + layout, this machine:

| Case | ms |
|---|---:|
| No rules | 32-34 |
| Design A stylesheet loaded, elements carry no prop attributes | 33 |
| Design A, one prop attribute per div | 44-45 |
| Design A, three prop attributes per div | 63-69 |
| Design A, three props with responsive tokens | 68-80 |
| Tailwind classes, same styles | 36-39 |

Reading: elements without prop attributes cost nothing (Blink buckets attribute selectors by
attribute name). Each prop attribute costs about 2 microseconds per element here, because
every rule for that attribute name is tested. A page with 200 prop-carrying elements pays about
1.5 ms per full recalc on this machine. This is acceptable; the spec SHOULD keep an upper
bound of roughly 100 rules per attribute name (currently 96 for a spacing prop) and SHOULD NOT
add spacing steps casually.

### 1.6 The alternative: one generic rule per prop driven by custom properties (design B)

Markup: `<div class="rp-stack" data-gap style="--gap:2;--gap-md:6">`. CSS, per prop:

```css
[data-gap]{--_gap:var(--gap);gap:calc(var(--spacing) * var(--_gap))}
@media (min-width:48rem){[data-gap]{--_gap:var(--gap-md,var(--gap-sm,var(--gap)))}}
```

Verified facts (`tests/layout.test.mjs`):

- It computes the right values, including enumerated values passed raw
  (`--align-md:center`).
- **It leaks.** Custom properties inherit: a nested `[data-gap]` element that sets only
  `--gap:1` inside a parent with `--gap-md:6` resolves to 24 px at `md`, not 4 px. The fix is
  registering every input as non-inheriting: `@property --gap-md{syntax:"*";inherits:false}`
  for 15 props x 6 = 90 rules (about 4 kB raw). `@property` is Chrome 85, Safari 16.4,
  **Firefox 128**. Without `@property` the leak is back.
- It needs an inline `style` attribute. Hydrogen's default CSP allows it
  (`hydrogen/packages/hydrogen/src/core/csp/index.ts`: `styleSrc: ["'self'", "'unsafe-inline'", ...]`),
  but a stricter policy breaks layout props.
- Values are not constrained by CSS: `--gap: 7.3` works. Enumeration then exists only in the
  checker.
- Two attributes per element (marker + style) and a private naming scheme, where design A has
  one attribute whose value reads like Tailwind.

Typed `attr()` (`gap: calc(var(--spacing) * attr(data-gap type(<number>), 0))`): works in the
Chromium used here (`CSS.supports` true, computed 24 px). Shipped in Chrome 133. Not in Safari
or Firefox as far as known (**UNVERIFIED**, from memory). It also cannot express breakpoints
without one attribute per breakpoint. Not usable for V1.

**Recommendation: design A.** The 1.5 kB brotli difference does not pay for the leak, the
`@property` dependency, the CSP dependency and the loss of enumeration. Arbitrary values remain
available through Tailwind utilities in `class` and through `style`.

### 1.7 Why data attributes rather than classes in Liquid

The base theme stores whole utility strings as schema option values because Tailwind must see
complete class names (`theme/blocks/container.liquid`: `"value": "py-8"`, `"py-16"`, `"py-24"`,
`"py-32"`; `theme/AGENTS.md`: "never assemble utility names dynamically"; `theme/config/styles.css`
line 1: `source(none)`). With precompiled attribute rules, a setting value is the bare token
(`"8"`), any combination of prop values works without a compiler run, and merchant data in
`settings_data.json` holds no class names. This is the strongest argument for the attribute
design on Liquid, and it also holds on Classic Edit Code, where the compiler does not run
(`theme/DESIGN.md`, "Token API").

### 1.8 Changing the scales

Breakpoints cannot be CSS variables (media queries do not accept `var()`), and each spacing
step is one rule per prop per breakpoint. So "scales changeable" means:

- Spacing **values** change at runtime through `--spacing` / `--rp-density` (no regeneration).
- Spacing **steps** and **breakpoints** change by editing `ripple.config.json` and running the
  generator (`ripple build props`, name **UNVERIFIED**/to be decided), which rewrites
  `props.css`. This is a CLI step at change time, not a build step at deploy time.

---

## 2. Tokens with Tailwind v4 and without a build

### 2.1 Findings from real builds (`tw/*.css`, tailwindcss 4.3.5)

1. `@theme reference { --color-primary: <value>; }` makes Tailwind generate
   `.bg-primary{background-color:var(--color-primary, <value>)}` and emit **no** `:root`
   declaration for it. The value is used only as the `var()` fallback.
2. `@theme reference { --color-primary: initial; }` generates **nothing**: `initial` removes the
   token. The reference block therefore needs a real value for every token.
3. The value may contain `var()` and `calc()`: `--radius-md: calc(var(--rp-radius) * 0.75)`
   compiles to `border-radius: var(--radius-md, calc(var(--rp-radius) * 0.75))`.
4. Namespaces verified to produce utilities: `--color-*` (`bg-`, `text-`, `border-`, `ring-`,
   with `/50` opacity modifiers via `color-mix`), `--radius-*` (`rounded-*`), `--spacing`
   (`gap-4`, `p-4`), `--spacing-*` (`h-control-md`, `p-control-md`), `--container-*`
   (`max-w-page`), `--font-*` (`font-heading`), `--text-*` with `--text-*--line-height`
   (`text-lg`), `--ease-*` (`ease-out`), `--z-index-*` (`z-sticky`),
   `--transition-duration-*` (`duration-fast`). The last two compile in 4.3.5 but I did not find
   them in Tailwind's documentation: **UNVERIFIED as a supported contract**.
5. `shadow-md` **inlines** the theme value into `--tw-shadow` instead of referencing
   `var(--shadow-md)`. Shadow utilities therefore do not follow a runtime change of
   `--shadow-md`. Ripple component CSS reads `var(--shadow-md)` directly and does follow it.
6. Tailwind passes Ripple's plain CSS through unchanged (attribute selectors with colons,
   `pow()`, relative colors, nested `@layer` names): the browser tests pass against the built
   file.
7. Utilities follow dials at runtime: setting `--rp-radius: 1rem; --rp-density: 0.5` on `<html>`
   changes `rounded-md` from 6 px to 12 px and `p-4` from 16 px to 8 px (verified).

### 2.2 Design: one source, two consumers

```
tokens.css   plain CSS, the only file that contains token VALUES   -> browser (always)
theme.css    GENERATED from tokens.css: @theme reference { ... }   -> Tailwind (only if present)
```

- `tokens.css` is authored and scaffolded into the project. It works with no build.
- `theme.css` is generated by `gen-theme.mjs`: it copies every declaration from the derived
  block of `tokens.css` whose name is in a Tailwind namespace, and wraps them in
  `@theme reference`. It contains names and fallbacks, never a second source of truth. A test
  MUST fail if `theme.css` is stale.
- Token naming rule: **a token that has a Tailwind v4 namespace uses the Tailwind name
  verbatim** (`--color-primary`, `--radius-md`, `--spacing`, `--text-lg`, `--font-sans`,
  `--shadow-md`, `--ease-out`, `--container-page`). **Everything else is prefixed `--rp-`**:
  the dials, durations, z-index, and every component API variable (`--rp-button-height`).
  This differs from shadcn, which declares `--primary` and maps it with
  `@theme inline { --color-primary: var(--primary) }`; using the namespace name directly gives
  one name per token and matches the base theme (`theme/config/styles.css` `@theme` block).

### 2.3 Layers

```css
/* layers.css: MUST be the first CSS the page parses, and line 1 of any Tailwind entry file */
@layer ui-sdk, theme, base, rp, components, utilities;
@layer rp.tokens, rp.base, rp.components, rp.props;
```

| Layer | Owner | Content |
|---|---|---|
| `ui-sdk` | UI SDK runtime | Injected `<style>` elements, `:where()` selectors (`uisdk/apps/docs/content/docs/web-components/styling-and-animation.mdx`, "The ui-sdk Layer": "Declare that layer at the top of the stylesheet your page links ... With Tailwind, put it above `@import "tailwindcss"`") |
| `theme` | Tailwind | Tailwind's own `:root` variables |
| `base` | Tailwind | Preflight |
| `rp.tokens` | Ripple | Dials and derived tokens. After `theme`, so Ripple's `--spacing`, `--radius-*`, `--text-*` override Tailwind's defaults regardless of file order |
| `rp.base` | Ripple | Minimal reset (needed when Tailwind is absent), scheme painting, `hidden` rule, pre-upgrade display rules |
| `rp.components` | Ripple | One file per component |
| `rp.props` | Ripple | Generated layout props. After components, so `data-p` beats a component's own padding at equal specificity |
| `components` | Project | Project CSS; beats Ripple |
| `utilities` | Tailwind | Beats everything layered |

Notes:

- This is the order option 1 of `docs/research/uisdk-web-elements.md` section 6 with the
  project's `components` layer kept above Ripple. `docs/research/base-theme.md` proposes putting
  Ripple CSS directly in `@layer components`; a dedicated `rp` layer immediately below
  `components` is a refinement of that, needed for two verified reasons: token overrides must
  not depend on file order relative to Tailwind's `theme` layer, and props must sit after
  component rules.
- UI SDK's docs recommend importing its optional `web.css` with `layer(components)`
  (`uisdk/apps/docs/content/docs/web-components/installation.mdx`). Ripple does not load
  `web.css` (`docs/research/uisdk-web-elements.md` section 6).
- **Unlayered CSS beats every layer.** Ripple MUST NOT ship an unlayered rule. The only
  unlayered CSS on the page should be the host's token bridge (`:root{--rp-brand:...}`), which
  is meant to win. The base theme already states this hazard (`theme/AGENTS.md`: "Unlayered
  author rules outrank every layered Tailwind rule").
- The `hidden` rule MUST be `!important` in an early layer, per
  `docs/research/uisdk-web-elements.md` section 6. It is in `rp.base` in the spike; the spec
  SHOULD move it to the `ui-sdk` layer name so it is the earliest important rule.

### 2.4 Entry files

With Tailwind (React, Remix 3, or a theme whose compiler runs):

```css
@layer ui-sdk, theme, base, rp, components, utilities;   /* line 1, before the import */
@layer rp.tokens, rp.base, rp.components, rp.props;
@import "tailwindcss";
@import "./ripple/theme.css";      /* @theme reference: names only */
@import "./ripple/tokens.css";
@import "./ripple/base.css";
@import "./ripple/components/button.css";   /* one per installed component */
@import "./ripple/props.css";
```

Without a build: one prebuilt `ripple.css` = `layers.css` + `tokens.css` + `base.css` +
component files + `props.css`, minified. Same HTML.

Tailwind utilities without a build (risk R6): there are three options, in order of preference.
(1) Use none: Ripple props plus component CSS cover layout; (2) the project runs Tailwind
(Vite plugin, or Canvas/Sidekick in a theme); (3) `@tailwindcss/browser` (runtime compiler):
measured at 287,414 bytes, **75,279 gzip** of JavaScript (4.3.5), which is unacceptable for
production storefronts and MUST NOT be a documented path. A static "utility subset" file is
not worth shipping: it would duplicate the props layer at the same size (section 1.4).

### 2.5 The base theme: what it confirms, constrains, conflicts with

| Base theme fact | Evidence | Effect on Ripple |
|---|---|---|
| Tokens live in `@theme`; components sit in `@layer components` "so that Tailwind utility classes passed via the `class` parameter can reliably override variant styles" | `theme/config/styles.css` ("COMPONENT VARIANT TOKENS") | **Confirms** the layer design. |
| The theme already has component classes it could not express as utilities: `.button-primary`, `.button-secondary`, `.button-outline`, `.button-ghost`, `.button-surface`, `.swatch-*`, `.quantity-selector-*`, `.richtext` | same file | **Confirms** that component CSS on tokens is needed; Ripple makes it the rule instead of the exception. Conflicts with the letter of "no BEM or component CSS files" (`theme/AGENTS.md`); the rule must be rewritten as "component CSS lives only in Ripple's layer". |
| Settings-backed tokens are re-emitted at `:root` by an unlayered `<style>` after the stylesheet | `theme/snippets/theme-styles.liquid`, `theme/layout/theme.liquid` lines 8-9 | **Confirms** the bridge. Ripple's bridge emits the six dials instead of resolved values. |
| Foreground on the interactive color is chosen with `color_brightness > 128`; the theme documents that this "is a light-or-dark heuristic rather than a WCAG ratio" | `theme/snippets/theme-styles.liquid`, `theme/AGENTS.md` | Ripple's CSS pick (section 3.3) is exact for black/white. The bridge SHOULD still print `--rp-brand-foreground` for browsers without relative color syntax. |
| Radius settings are per kind: buttons, cards, forms, each `sharp / rounded / pill` | `theme/snippets/theme-styles.liquid` | **Constrains** the radius design: Ripple needs semantic radius tokens `--radius-control`, `--radius-surface`, `--radius-field` that can be set independently of the scale (section 3.2). |
| Custom elements need `display: block` in `@layer base` ("Missing either treatment can collapse measurements"), and one element is styled with `not-[&:defined]:flex ...` utilities | `theme/config/styles.css` (`s-video, s-predictive-search, s-cart, ...`), `theme/layout/theme.liquid` line 79 | **Confirms** section 5: static display rules and `:not(:defined)` rules, generated instead of hand-maintained. |
| Single CSS source `config/styles.css`, compiled by Canvas/Sidekick to `assets/styles.min.css`; Classic Edit Code does not compile | `theme/AGENTS.md`, `theme/DESIGN.md` | **Constrains** installation. Primary path (agrees with `docs/research/base-theme.md`): Ripple CSS and the `@theme reference` block are written into `config/styles.css`, with the layer statement as line 1. Fallback: prebuilt `assets/ripple.css` linked **before** `styles.min.css` so its layer statement is parsed first. Whether the Canvas compiler resolves relative `@import` is **UNVERIFIED**; whether it supports `@theme reference` is **UNVERIFIED** (it is core Tailwind v4 syntax and the theme's compiled file says `tailwindcss v4.3.0`). |
| Color role names: `surface`, `surface-secondary`, `on-surface`, `on-surface-secondary`, `border`, `accent`, `interactive`, `interactive-text`; `color_palette` setting with slots `surface`, `on_surface`, `surface_2`, `accent`, `interactive` | `theme/config/styles.css`, `theme/snippets/theme-styles.liquid` | **Conflicts** with the proposal's shadcn names. See mapping below and open question 1. |
| Motion: `--ease-ui`, `--ease-drawer`, entrances about 300 ms, exits about 200 ms, `active:scale-[0.97]`, gated by `motion-safe:` | `theme/AGENTS.md` "Motion and interaction feel", `theme/config/styles.css` | Adopted in the scales (section 6) and in the Button pattern. |
| Disabled buttons use `aria-disabled="true"`, and keep pointer events in the theme editor | `theme/blocks/button.liquid` | Button CSS matches `[aria-disabled="true"]`. The Liquid binding needs a way to keep pointer events in design mode; the spec SHOULD define `[data-design-mode] .rp-button[aria-disabled="true"]{pointer-events:auto}` or equivalent. |

Mapping from the theme's palette to Ripple dials (the bridge prints the right-hand side):

| Theme setting | Ripple |
|---|---|
| `settings.color_palette.surface` | `--rp-background` |
| `settings.color_palette.on_surface` | `--rp-foreground` |
| `settings.color_palette.interactive` | `--rp-brand` |
| computed interactive text | `--rp-brand-foreground` (optional; CSS computes it otherwise) |
| `settings.color_palette.surface_2` | `--color-muted` (direct override of a derived token) |
| `settings.color_palette.accent` | no shadcn equivalent: shadcn's `accent` is a hover surface, the theme's `accent` is a punctuation color for links and focus. See open question 1 |
| `border_radius_buttons / cards / forms` | `--radius-control / --radius-surface / --radius-field` |

---

## 3. Dials

Real CSS: `docs/research/spikes/styling/ripple/tokens.css` (5,230 bytes minified, 1,291 gzip).
Rendered and asserted in `tests/system.test.mjs`; screenshot `out/system.png`.

### 3.1 Inputs

```css
:root {
  --rp-background: oklch(1 0 0);
  --rp-foreground: oklch(0.21 0.006 286);
  --rp-brand: oklch(0.21 0.006 286);
  --rp-radius: 0.5rem;      /* 0 = square; 0.5rem reproduces Tailwind's default radii */
  --rp-density: 1;          /* multiplies --spacing; suggested range 0.75 to 1.25 */
  --rp-text-scale: 1.2;     /* ratio between heading steps; suggested range 1.125 to 1.333 */
  --rp-font-body: ui-sans-serif, system-ui, sans-serif;
  --rp-font-heading: var(--rp-font-body);
}
```

Optional input: `--rp-brand-foreground` (overrides the automatic pick).

A Liquid "less / more" slider is a `range` setting printed into one of these, for example
`--rp-radius: {{ settings.corner_radius | times: 0.125 }}rem`.

### 3.2 Derivation rules (the part that is easy to get wrong)

**Rule 1: derived tokens are declared on `:root, [data-scheme]`.** A `var()` is resolved on
the element that declares the property; descendants inherit the resolved value. If
`--color-muted: color-mix(... var(--rp-foreground) ...)` is declared on `:root` only, then
`<div data-scheme="dark">` changes `--rp-foreground` and nothing derived changes. Verified
counter-test: with derivations on `:root` only, the dark scope's `--color-background` equals
the light one. Consequence: **any element that changes a dial MUST carry the `data-scheme`
attribute** (with or without a value), including for radius, density and type scale:

```html
<section data-scheme="dark">...</section>
<section data-scheme style="--rp-radius: 1rem; --rp-density: 0.8">...</section>
```

**Rule 2: a scheme cannot swap two dials by reference.** `[data-scheme="inverse"]
{ --rp-background: var(--rp-foreground); --rp-foreground: var(--rp-background) }` is a cycle
and both become invalid. Schemes MUST use literal values (or values printed by the host).

**Rule 3: every feature above the support floor is inside `@supports` with a static value
declared first.**

Color roles (shadcn names), using only `color-mix()`:

```css
:root, [data-scheme] {
  --color-background: var(--rp-background);
  --color-foreground: var(--rp-foreground);
  --color-card: var(--rp-background);
  --color-card-foreground: var(--rp-foreground);
  --color-popover: var(--rp-background);
  --color-popover-foreground: var(--rp-foreground);
  --color-primary: var(--rp-brand);
  --color-primary-foreground: var(--rp-brand-foreground, #fff);
  --color-secondary: color-mix(in oklab, var(--rp-foreground) 9%, var(--rp-background));
  --color-secondary-foreground: var(--rp-foreground);
  --color-muted: color-mix(in oklab, var(--rp-foreground) 5%, var(--rp-background));
  --color-muted-foreground: color-mix(in oklab, var(--rp-foreground) 64%, var(--rp-background));
  --color-accent: color-mix(in oklab, var(--rp-foreground) 8%, var(--rp-background));
  --color-accent-foreground: var(--rp-foreground);
  --color-border: color-mix(in oklab, var(--rp-foreground) 14%, var(--rp-background));
  --color-input: color-mix(in oklab, var(--rp-foreground) 45%, var(--rp-background));
  --color-ring: var(--rp-foreground);
  --color-overlay: oklch(0 0 0 / 0.5);
  --color-destructive: oklch(0.53 0.21 27);
  --color-success: oklch(0.5 0.13 160);
  --color-warning: oklch(0.52 0.13 65);
  --color-info: oklch(0.5 0.17 255);
  --color-sale: var(--color-destructive);
  --color-destructive-foreground: #fff;   /* same for success, warning, info */
}
```

Because every neutral is a mix of the two scheme inputs, a dark scheme is three literal values
and needs no second palette:

```css
[data-scheme="dark"] {
  --rp-background: oklch(0.17 0.006 286);
  --rp-foreground: oklch(0.97 0 0);
  --rp-brand: oklch(0.97 0 0);
  color-scheme: dark;
}
@media (prefers-color-scheme: dark) { [data-scheme="auto"] { /* same three values */ } }
```

Dark mode is opt-in (`data-scheme="dark"` or `"auto"` on `<html>` or any element). Painting is
done by `:where(body, [data-scheme]) { background-color: var(--color-background); color:
var(--color-foreground) }` in `rp.base`.

Radius, spacing, type:

```css
--spacing: calc(0.25rem * var(--rp-density));
--radius-xs: calc(var(--rp-radius) * 0.25);
--radius-sm: calc(var(--rp-radius) * 0.5);
--radius-md: calc(var(--rp-radius) * 0.75);
--radius-lg: var(--rp-radius);
--radius-xl: calc(var(--rp-radius) * 1.5);
--radius-2xl: calc(var(--rp-radius) * 2);
--radius-3xl: calc(var(--rp-radius) * 3);
--radius-control: var(--radius-lg);     /* buttons */
--radius-field: var(--radius-lg);       /* inputs, selects */
--radius-surface: var(--radius-xl);     /* cards, dialogs, popovers */
```

The radius scale is multiplicative so that `--rp-radius: 0` gives a square system; shadcn's
subtractive form (`calc(var(--radius) - 4px)`) goes negative. A pill look is
`--radius-control: 9999px`, set separately, because surfaces must not become pills (verified:
control 9999 px, card 24 px in the same scope).

Type scale with `pow()` and a static fallback:

```css
--text-lg: 1.125rem; /* ... static Tailwind defaults first ... */
@supports (width: calc(1px * pow(2, 2))) {
  :root, [data-scheme] {
    --text-lg:  calc(1rem * pow(var(--rp-text-scale), 0.65));
    --text-xl:  calc(1rem * pow(var(--rp-text-scale), 1.25));
    --text-2xl: calc(1rem * pow(var(--rp-text-scale), 2.25));
    --text-3xl: calc(1rem * pow(var(--rp-text-scale), 3.5));
    --text-4xl: calc(1rem * pow(var(--rp-text-scale), 4.5));
    --text-5xl: calc(1rem * pow(var(--rp-text-scale), 6));
    --text-6xl: calc(1rem * pow(var(--rp-text-scale), 7.25));
  }
}
```

The exponents are chosen so that ratio 1.2 reproduces Tailwind's defaults within 0.4 px
(verified: `text-lg` 18.01 px, `text-4xl` 36.34 px). At 1.333, `text-4xl` is 58.3 px.
`--text-xs`, `--text-sm`, `--text-base` are fixed and never scale.

### 3.3 Automatic foreground on the brand color, and scheme-aware status colors

```css
@supports (color: oklch(from red l c h)) {
  :root, [data-scheme] {
    /* y is relative luminance. Black has the higher WCAG contrast when y > 0.179. */
    --rp-auto-contrast: color(
      from var(--rp-brand) xyz-d65
      calc(clamp(0, (0.179 - y) * 99999, 1) * 0.9505)
      clamp(0, (0.179 - y) * 99999, 1)
      calc(clamp(0, (0.179 - y) * 99999, 1) * 1.089)
    );
    --color-primary-foreground: var(--rp-brand-foreground, var(--rp-auto-contrast));
    /* status colors used as text: lightness follows the scheme background */
    --color-destructive: oklch(from var(--rp-background) clamp(0.53, (0.6 - l) * 99999, 0.76) 0.19 27);
    --color-success:     oklch(from var(--rp-background) clamp(0.5,  (0.6 - l) * 99999, 0.8)  0.13 160);
    --color-warning:     oklch(from var(--rp-background) clamp(0.52, (0.6 - l) * 99999, 0.82) 0.13 65);
    --color-info:        oklch(from var(--rp-background) clamp(0.5,  (0.6 - l) * 99999, 0.78) 0.15 255);
    --color-destructive-foreground: oklch(from var(--rp-background) clamp(0.15, (l - 0.6) * 99999, 1) 0 0);
  }
}
```

Verified results:

- Sweep of `--rp-brand` over OKLCH (l 0.05-0.98, c 0-0.3, h 0-340): of 1,385 in-sRGB-gamut
  samples, the pick was the better of black/white in **all** of them; minimum contrast
  **4.58:1** (the theoretical floor for a black/white choice). The base theme's
  `brightness > 128` rule picked the worse color in **78** of the same samples.
  Out-of-gamut brand colors (2,071 samples skipped) are not guaranteed: the browser gamut-maps
  the paint but the formula sees the unmapped luminance. The checker SHOULD warn when a dial
  color is outside sRGB.
- WCAG contrast of the default tokens, measured from computed colors:

| Pair | light | dark | yellow brand on cream | blue brand |
|---|---:|---:|---:|---:|
| foreground / background | 17.72 | 17.55 | 16.7 | 17.72 |
| muted-foreground / background | 6.17 | 6.72 | 5.99 | 6.17 |
| muted-foreground / muted | 5.51 | 6.22 | 5.34 | 5.51 |
| primary-foreground / primary | 17.72 | 19.26 | 13.21 | 5.14 |
| destructive / background | 5.79 | 7.43 | 5.46 | 5.79 |
| success / background | 5.49 | 10.77 | 5.17 | 5.49 |
| warning / background | 5.72 | 10.72 | 5.39 | 5.72 |
| info / background | 6.07 | 9.28 | 5.72 | 6.07 |
| destructive-foreground / destructive | 5.79 | 7.64 | 5.79 | 5.79 |
| destructive / muted | 5.17 | 6.88 | 4.87 | 5.17 |
| input border / background (needs 3:1) | 3.31 | 3.6 | 3.25 | 3.31 |
| border / background (decorative) | 1.4 | 1.32 | 1.38 | 1.4 |

  All text pairs are at least 4.5:1 and the input border is at least 3:1 in the four scopes.
  The base theme's `--color-success: #059669` and `--color-warning: #d97706` are below 4.5:1 as
  text on white (general knowledge of those hex values; not measured here), which is why the
  values above are darker.

### 3.4 Browser support of each feature used

Versions from memory; **UNVERIFIED** except "Chromium 157 runs it".

| Feature | Used for | Chrome | Safari | Firefox | Fallback in the CSS |
|---|---|---|---|---|---|
| Cascade layers `@layer` | everything | 99 | 15.4 | 97 | none (floor) |
| `:where()` | zero-specificity scoping | 88 | 14 | 78 | none |
| `oklch()` | token values | 111 | 15.4 | 113 | none (floor) |
| `color-mix()` | neutrals, hover states | 111 | 16.2 | 113 | none (floor) |
| Relative color syntax, incl. `color(from ... xyz-d65 ...)` with `calc()` on channels | auto contrast, status colors | 119 | 16.4 (channel math reported unreliable before 18) | 128 | `@supports` + static values; host may print `--rp-brand-foreground` |
| `pow()` | type scale | 120 | 15.4 | 118 | `@supports` + static scale |
| `revert-layer` | `data-hidden="... md:false"` | 99 | 15.4 | 97 | none |
| Individual `scale` / `rotate` properties | press feedback, spinner | 104 | 14.1 | 72 | none |
| `:defined` | pre-upgrade rules | 54 | 10 | 63 | none |
| `@property` | **not used** by design A | 85 | 16.4 | 128 | - |
| typed `attr()` | **not used** | 133 | no | no | - |
| CSS nesting | **not used** in authored Ripple CSS | 120 | 17.2 | 117 | - |

Support floor implied: Chrome 111, Safari 16.4, Firefox 128 for full fidelity (this is also
Tailwind v4's stated floor, from memory, **UNVERIFIED**). The `@supports` test for relative
color cannot detect a browser that parses the syntax but computes channel math wrongly; a
WebKit run against Safari 16.4-17.x MUST be done before the spec freezes section 3.3, and if it
fails the `@supports` condition MUST be tightened (for example by testing a feature that
shipped with the fix).

---

## 4. Component CSS: the canonical authoring pattern

### 4.1 Plain CSS versus `@apply`

The same Button was written both ways (`ripple/button.css`, `tw/apply-button.css`) and
compiled.

| | Plain CSS on tokens | `@apply` |
|---|---|---|
| Works with no build | Yes: the authored file is the shipped file | No: must be compiled by Tailwind |
| Compiled output is self-contained | Yes | **No.** Output contains `border-style: var(--tw-border-style)`, `outline-style: var(--tw-outline-style)`, `--tw-font-weight`, `--tw-duration`, `--tw-ease`, and relies on `@property --tw-border-style { initial-value: solid }` in Tailwind's `properties` layer and on `--font-weight-medium`, `--default-transition-duration` in Tailwind's `theme` layer (verified in `tw/app.out.css`). A prebuilt `ripple.css` would have to carry part of Tailwind's runtime |
| Variant composition | Modifiers set custom properties; no ordering problems | Each variant re-applies utilities; correctness depends on Tailwind's property sort |
| Hover color | `color-mix(in oklab, tone 88%, on-tone)`: adapts to any scheme | `hover:bg-primary/90` compiles to a mix with `transparent` (shows whatever is behind) |
| Component API variables (`--rp-button-height`) | Natural | Needs arbitrary-value utilities such as `min-h-(--rp-button-height)` |
| Three-way merge on `ripple upgrade` | One declaration per line | Long utility lines conflict on any edit |
| Size (Button, minified) | 3,858 bytes for 15 modifier rules and all states | 2,881 bytes for 3 modifier rules, no pending spinner |

**Recommendation: component CSS MUST be plain CSS on tokens, with no Tailwind directives
(`@apply`, `@utility`, `@variant`, `theme()`), no preprocessor syntax and no nesting.** This
agrees with `docs/research/base-theme.md` ("It contains no Tailwind directives"). The base
theme itself uses `@apply` only inside `.richtext` (`theme/config/styles.css`), which is the
one place where it must restyle unclassed merchant HTML.

### 4.2 The skeleton every component file MUST follow

Full working example: `docs/research/spikes/styling/ripple/button.css`. Structure:

```css
/* button.css
   Contract: <button|a class="rp-button" data-variant? data-tone? data-size? data-full?>
   variant: solid (default) | soft | outline | ghost | link
   tone:    primary (default) | neutral | destructive
   size:    sm | md (default) | lg
   States:  :hover, :active, :focus-visible, :disabled | [aria-disabled="true"] | [data-disabled],
            [data-pending] | [aria-busy="true"]
   API:     --rp-button-height, --rp-button-px, --rp-button-gap, --rp-button-radius,
            --rp-button-font-size, --rp-button-font-weight */
@layer rp.components {
  /* 1. BASE */
  .rp-button {
    /* 1a. public API: --rp-<component>-<name>, default from a global token */
    --rp-button-height: var(--spacing-control-md);
    --rp-button-px: calc(var(--spacing) * 5);
    --rp-button-gap: calc(var(--spacing) * 2);
    --rp-button-radius: var(--radius-control);
    --rp-button-font-size: var(--text-sm);
    --rp-button-font-weight: 500;
    /* 1b. tone slots (private, set by [data-tone]) */
    --_tone: var(--color-primary);                /* fill */
    --_on-tone: var(--color-primary-foreground);  /* text on the fill */
    --_tone-text: var(--color-foreground);        /* the tone used as text on the page background */
    /* 1c. paint slots (private, set by [data-variant]) */
    --_bg: var(--_tone);
    --_fg: var(--_on-tone);
    --_border: transparent;
    --_bg-hover: color-mix(in oklab, var(--_tone) 88%, var(--_on-tone));
    --_bg-active: color-mix(in oklab, var(--_tone) 80%, var(--_on-tone));
    /* 1d. declarations: read slots and global tokens only; no literals except 0, 1px, 100%, keywords */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--rp-button-gap);
    min-block-size: var(--rp-button-height);
    padding: 0 var(--rp-button-px);
    border: 1px solid var(--_border);
    border-radius: var(--rp-button-radius);
    background-color: var(--_bg);
    color: var(--_fg);
    font-size: var(--rp-button-font-size);
    font-weight: var(--rp-button-font-weight);
    /* ... */
  }

  /* 2. MODIFIERS: one rule per value, custom properties ONLY */
  .rp-button[data-tone="destructive"] {
    --_tone: var(--color-destructive);
    --_on-tone: var(--color-destructive-foreground);
    --_tone-text: var(--color-destructive);
  }
  .rp-button[data-variant="outline"] {
    --_bg: transparent;
    --_fg: var(--_tone-text);
    --_border: color-mix(in oklab, var(--_tone-text) 45%, var(--color-background));
    --_bg-hover: color-mix(in oklab, var(--_tone-text) 8%, transparent);
    --_bg-active: color-mix(in oklab, var(--_tone-text) 14%, transparent);
  }
  .rp-button[data-size="lg"] {
    --rp-button-height: var(--spacing-control-lg);
    --rp-button-px: calc(var(--spacing) * 7);
    --rp-button-font-size: var(--text-base);
  }

  /* 3. STRUCTURAL MODIFIERS: the only modifiers that may set real properties (listed per component) */
  .rp-button[data-full] { display: flex; inline-size: 100%; }

  /* 4. STATES: real properties from slots; fixed order hover, active, focus-visible, disabled, pending */
  @media (hover: hover) { .rp-button:hover { background-color: var(--_bg-hover); } }
  .rp-button:active { background-color: var(--_bg-active); }
  @media (prefers-reduced-motion: no-preference) { .rp-button:active { scale: 0.97; } }
  .rp-button:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 2px; }
  .rp-button:is(:disabled, [aria-disabled="true"], [data-disabled]) { opacity: 0.5; pointer-events: none; }
  .rp-button:is([data-pending], [aria-busy="true"]) { color: transparent; pointer-events: none; }
  .rp-button:is([data-pending], [aria-busy="true"])::after { /* centered spinner, border: 2px solid var(--_fg) */ }

  /* 5. PARTS: descendants by data-slot or rp-<component>-<part> class */
  .rp-button > :where(svg, [data-slot="icon"]) { inline-size: 1.25em; block-size: 1.25em; flex: none; }
}
```

Rules (each is checkable by a linter over the CSS file):

1. The whole file is one `@layer rp.components { ... }` block. Nothing outside it.
2. The root selector is exactly one class: `.rp-<component>`. Parts are `.rp-<component>-<part>`
   or `[data-slot="<part>"]` under the root.
3. Modifier selectors are exactly `.rp-<component>[data-<prop>="<value>"]`: one class, one
   attribute, specificity (0,2,0). One rule per enumerated value. The default value has no rule
   (the base rule is the default), and bindings MAY omit the attribute for the default.
4. **Modifier rules contain custom-property declarations only.** Because tone, variant and size
   write disjoint sets of variables (tone: `--_tone*`; variant: `--_bg*`, `--_fg`, `--_border`;
   size: `--rp-<component>-*` dimensions), any combination composes with no `variant x tone`
   rules and no dependence on rule order. 5 variants x 3 tones x 3 sizes = 45 combinations from
   9 rules (verified by rendering the matrix, `out/system.png`).
5. Public API variables are named `--rp-<component>-<name>`, declared in the base rule with a
   token default, and listed in the header comment and the manifest. Private slots are named
   `--_<name>` and MUST NOT be documented or set from outside the file.
6. Real declarations read only `var()` of slots, API variables and global tokens. No color
   literals, no lengths other than `0`, `1px`, `2px` (borders/outlines) and percentages.
7. **A tone has three slots, not two.** `--_tone-text` is separate from `--_tone` because a
   light brand color is not readable as text. Found by rendering: with a yellow brand, soft,
   outline, ghost and link variants were yellow text on cream until `--_tone-text` was added;
   afterwards all four are at least 4.5:1 (asserted). For `primary` and `neutral`,
   `--_tone-text` is `--color-foreground`; for status tones it is the status color, which
   section 3.3 keeps readable in every scheme.
8. States select **presence attributes written by UI SDK** (`[data-pending]`, `[data-disabled]`,
   `[data-open]`, `[data-closed]`, `[data-selected]`, `[data-checked]`, `[data-highlighted]`,
   `[data-starting-style]`, `[data-ending-style]`) and their server-written ARIA equivalents
   (`[aria-busy="true"]`, `[aria-disabled="true"]`, `[aria-expanded="true"]`,
   `[aria-selected="true"]`, `[aria-current]`). There is no `data-state="..."` in UI SDK
   (`uisdk/apps/docs/content/docs/web-components/styling-and-animation.mdx`: "State attributes
   such as `data-pressed` and `data-disabled` are present or absent";
   `docs/research/uisdk-web-elements.md` appendix). Selecting both forms means the pre-upgrade
   server HTML and the upgraded element look the same.
9. Entry/exit animation uses `[data-starting-style]` and `[data-ending-style]`
   (same UI SDK doc: "Put exit styles on `data-ending-style`; `data-closed` describes state but
   doesn't wait for an exit").
10. Hover is always inside `@media (hover: hover)`. Motion is always inside
    `@media (prefers-reduced-motion: no-preference)`. Durations and easings are tokens.
11. A state that replaces content MUST NOT change the box size. Button pending hides the label
    with `color: transparent` and draws the spinner in `::after`, so the width does not change
    (asserted).
12. `ui-button` and other UI SDK wrappers are `display: contents`; the `rp-*` class and
    all `data-*` props go on the native element inside
    (`docs/research/uisdk-web-elements.md` sections 2.1 and 3.1).

### 4.3 Sizes

`button.css`: 5,790 bytes authored, 3,858 minified, 1,058 gzip, 887 brotli. Button is among the
larger simple components (5 variants, 3 tones, 3 sizes, 5 states).

Proposed budgets (to be re-baselined at the end of the foundations milestone, enforced in CI):

| Artifact | Minified | gzip | brotli | Basis |
|---|---:|---:|---:|---|
| `tokens.css` + `base.css` | <= 8 kB | <= 2.2 kB | <= 2 kB | measured 6.0 kB / 1.7 kB / 1.4 kB |
| `props.css` | <= 56 kB | <= 5.2 kB | <= 2.6 kB | measured 54.4 kB / 4.9 kB / 2.4 kB |
| One component file | median <= 2.5 kB, max 6 kB | - | - | Button 3.9 kB |
| Prebuilt `ripple.css`, all ~90 components | <= 220 kB | <= 45 kB | <= 36 kB | 90 x 1.7 kB avg + 62 kB; gzip estimated from Button's 3.6:1 ratio. **Estimate, not measured** |
| `ripple.css` for a typical storefront (about 45 components installed) | <= 140 kB | <= 26 kB | <= 21 kB | estimate |

The full file is 2-3 times the base theme's 15.9 kB gzip stylesheet. The spec SHOULD therefore
make the default stylesheet "installed components only" (the CLI concatenates the scaffolded
files on `add`/`upgrade`) and treat the all-components prebuilt file as the zero-install CDN
option.

---

## 5. Pre-upgrade and no-JS styling

Build on `docs/research/uisdk-web-elements.md` section 6; the following adds measurements.

### 5.1 Measured layout shift (`tests/cls.test.mjs`)

Page: a header row with `<ui-dialog-trigger><button>`, a product form
`<div class="stack"><rp-product-form>` with three children, and two sibling text elements
`<rp-price>`, `<rp-inventory>`. Elements are defined 200 ms after load and UI SDK's runtime
display rules are injected, as on a real upgrade.

| | Content-below position before | after upgrade | CLS |
|---|---:|---:|---:|
| No static display rules | 142 px | 192 px | 0.0141 |
| Static display rules in `rp.base` | 192 px | 192 px | 0 |

Cause: an undefined custom element is `display: inline`. A wrapper that will become
`display: contents` is, before upgrade, a single flex item hiding its children from the
parent's `gap`; two sibling elements that will become `display: block` sit on one line.

### 5.2 Rules

1. `rp.base` MUST contain a static `display` rule for **every** `ui-*` and `rp-*` tag Ripple
   uses, generated from the manifest (for `ui-*` tags, from the part's default display in UI
   SDK, `docs/research/uisdk-web-elements.md` section 6: "one
   `:where(<tag>:not([hidden]), <tag>[hidden="until-found"]) { display: block | contents }` per
   defined tag"). CSS has no tag-prefix selector, so the list must be enumerated. Selectors are
   `:where(...)` so component CSS can override.
2. Every `rp-*` element declares `display: contents | block | inline-block | ...` in the
   manifest. `contents` is for pure behavior wrappers (they then have no box: they cannot take
   `data-p`, cannot be measured, cannot be a scroll container). Elements that need a box are
   `block`. The base theme hit this exact problem (`theme/AGENTS.md`: "Custom elements are
   inline by default ... Missing either treatment can collapse measurements such as
   `ResizeObserver` results to zero").
3. Controls that only work after upgrade are marked in the contract and hidden until the
   owning element is defined. Measured (`tests/cls.test.mjs`): with `visibility: hidden` the
   neighbouring input stays at x = 48 px before and after; with `display: none` it moves from
   0 px to 48 px on upgrade.
   - In-flow control (quantity stepper buttons): `visibility: hidden` (keeps the box, no shift).
   - Out-of-flow control (absolutely positioned carousel arrows): `display: none`.
   ```css
   :where(rp-quantity, rp-carousel):not(:defined) [data-js="inflow"]  { visibility: hidden; }
   :where(rp-quantity, rp-carousel):not(:defined) [data-js="overlay"] { display: none; }
   ```
   The selector MUST name the owning tag. A bare `:not(:defined) [data-js]` would hide controls
   under any never-defined third-party custom element (theme app blocks add such elements).
   The attribute name `data-js` is a proposal.
4. The pre-upgrade look MUST equal the upgraded look. Component CSS selects both the
   server-written ARIA state and the UI SDK data attribute (section 4.2 rule 8), and never
   uses `:defined` to change size, spacing or visibility of content.
5. `[hidden]` MUST be forced with `display: none !important` in the earliest layer
   (`docs/research/uisdk-web-elements.md` section 6, verified hazard there).
6. No `:not(:defined)` rule may hide content or a working native control (link, form submit).
   Script failure equals no script: an element that never upgrades keeps its hidden JS-only
   controls hidden forever, and everything else works.

---

## 6. Proposed scales (exact values)

Values are the defaults in `tokens.css`. "TW" marks names that are Tailwind namespaces.

**Breakpoints** (min-width; compiled into `props.css`; identical to Tailwind's defaults so
`data-columns="2 md:4"` and `class="md:hidden"` agree):
`sm` 40rem (640 px), `md` 48rem (768), `lg` 64rem (1024), `xl` 80rem (1280), `2xl` 96rem (1536).

**Space** (TW `--spacing: calc(0.25rem * var(--rp-density))`; prop steps are multiples):

| Step | 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| px at density 1 | 0 | 2 | 4 | 6 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64 | 80 | 96 | 128 |

Step 32 is included because the base theme's section padding options go up to `py-32`
(`theme/blocks/container.liquid`).

**Size**

| Token | Value | Use |
|---|---|---|
| `--spacing-control-sm` | 2.25rem (36 px) | small buttons, inputs |
| `--spacing-control-md` | 2.75rem (44 px) | default; equals the base theme's `--spacing-touch-target` |
| `--spacing-control-lg` | 3.25rem (52 px) | large |
| `--container-page` | 80rem | page max width (base theme `--spacing-page`) |
| `--container-prose` | 42rem | rich text measure (proposal; not in the spike file) |
| `--spacing-gutter` | `max(calc(var(--spacing) * 4), env(safe-area-inset-left, 0px), env(safe-area-inset-right, 0px))` | page side padding |
| icon sizes | 1rem, 1.25rem, 1.5rem for `sm`, `md`, `lg` | Icon `size` prop (proposal) |

Control heights do not follow `--rp-density`, so a dense theme keeps 44 px targets.

**Radius** (TW `--radius-*`, each `calc(var(--rp-radius) * k)`, `--rp-radius` default 0.5rem):

| Token | xs | sm | md | lg | xl | 2xl | 3xl |
|---|---|---|---|---|---|---|---|
| k | 0.25 | 0.5 | 0.75 | 1 | 1.5 | 2 | 3 |
| default | 2 px | 4 px | 6 px | 8 px | 12 px | 16 px | 24 px |

Semantic: `--radius-control: var(--radius-lg)`, `--radius-field: var(--radius-lg)`,
`--radius-surface: var(--radius-xl)`. `rounded-full` stays Tailwind's built-in.

**Type** (TW `--text-*`; sizes above `base` follow `--rp-text-scale`, default 1.2):

| Token | Size at 1.2 | Exponent | Line height (`--text-*--line-height`) |
|---|---|---|---|
| `--text-xs` | 0.75rem | fixed | 1.3333 |
| `--text-sm` | 0.875rem | fixed | 1.4286 |
| `--text-base` | 1rem | fixed | 1.5 |
| `--text-lg` | 1.126rem | 0.65 | 1.5556 |
| `--text-xl` | 1.256rem | 1.25 | 1.4 |
| `--text-2xl` | 1.507rem | 2.25 | 1.3333 |
| `--text-3xl` | 1.893rem | 3.5 | 1.2 |
| `--text-4xl` | 2.272rem | 4.5 | 1.1111 |
| `--text-5xl` | 2.986rem | 6 | 1.05 |
| `--text-6xl` | 3.750rem | 7.25 | 1 |

Fonts: `--font-sans: var(--rp-font-body)`, `--font-heading: var(--rp-font-heading)`.
Weights: 400 body, 500 controls and labels, 600 headings (proposal; the base theme uses regular
weight headings, `theme/AGENTS.md` "Variants", so heading weight SHOULD be a token
`--rp-heading-weight`).

**Shadow** (TW `--shadow-*`; Tailwind's default values):

| Token | Value |
|---|---|
| `--shadow-xs` | `0 1px 2px 0 oklch(0 0 0 / 0.05)` |
| `--shadow-sm` | `0 1px 3px 0 oklch(0 0 0 / 0.1), 0 1px 2px -1px oklch(0 0 0 / 0.1)` |
| `--shadow-md` | `0 4px 6px -1px oklch(0 0 0 / 0.1), 0 2px 4px -2px oklch(0 0 0 / 0.1)` |
| `--shadow-lg` | `0 10px 15px -3px oklch(0 0 0 / 0.1), 0 4px 6px -4px oklch(0 0 0 / 0.1)` |
| `--shadow-xl` | `0 20px 25px -5px oklch(0 0 0 / 0.1), 0 8px 10px -6px oklch(0 0 0 / 0.1)` |

**Motion**

| Token | Value | Use |
|---|---|---|
| `--rp-duration-fast` | 100ms | hover, press, color changes |
| `--rp-duration-base` | 200ms | exits, small reveals |
| `--rp-duration-slow` | 300ms | entrances of overlays and drawers |
| `--ease-out` (TW) | `cubic-bezier(0.16, 1, 0.3, 1)` | default UI easing (base theme `--ease-ui`) |
| `--ease-in-out` (TW) | `cubic-bezier(0.65, 0, 0.35, 1)` | moves |
| `--ease-drawer` (TW) | `cubic-bezier(0.32, 0.72, 0, 1)` | drawers, sheets (base theme `--ease-drawer`) |

Mapped to Tailwind in `theme.css` as `--transition-duration-fast|base|slow`.

**Z-index** (overlays use the top layer through `popover`/`dialog`, so the scale is short):

| Token | Value | Use |
|---|---|---|
| `--rp-z-raised` | 1 | badges over media, focus rings inside groups |
| `--rp-z-sticky` | 20 | sticky header, sticky add-to-cart bar |
| `--rp-z-overlay` | 40 | non-top-layer fallbacks |
| `--rp-z-toast` | 50 | toast region when not in the top layer |

Mapped to Tailwind in `theme.css` as `--z-index-raised|sticky|overlay|toast`. UI SDK sets its
own toast region `z-index: 2147483000` in the `ui-sdk` layer
(`docs/research/uisdk-web-elements.md` section 6); Ripple's component CSS overrides it.

**Color roles**: section 3.2 (20 roles plus status foregrounds).

---

## 7. Radix Themes and shadcn: what Ripple copies and avoids

From memory of both projects; not verified against their source in this environment
(**UNVERIFIED** as to exact current values).

Radix Themes, as recalled: a `<Theme>` wrapper with `accentColor`, `grayColor`, `radius`
(`none | small | medium | large | full`), `scaling` (`90%` to `110%`), `panelBackground`
(`solid | translucent`), `appearance`. Components take `size` (`"1"`-`"4"` for most controls,
`"1"`-`"9"` for Text/Heading), `variant` (`classic | solid | soft | surface | outline | ghost`),
`color`, `highContrast`, `radius`. Layout components (`Box`, `Flex`, `Grid`, `Container`,
`Section`) take `gap`, `p`, `px`, `py`, `m*` with a `"1"`-`"9"` space scale and responsive
objects (`{ initial: "2", md: "4" }`), compiled to one precompiled class per value per
breakpoint. Colors are 12-step Radix Colors scales.

shadcn/ui, as recalled: CSS variables `--background`, `--foreground`, `--card`, `--popover`,
`--primary`, `--secondary`, `--muted`, `--accent`, `--destructive` (each with `-foreground`),
`--border`, `--input`, `--ring`, `--radius`; mapped in Tailwind v4 with
`@theme inline { --color-primary: var(--primary) }`; dark mode by a `.dark` class; radius steps
by subtraction from `--radius`; variants in JavaScript class strings (cva); parts marked with
`data-slot`; code copied into the project.

| Ripple copies | From | Because |
|---|---|---|
| A few global dials (radius, scaling/density, brand color) that restyle everything | Radix | It is why most Radix users never edit component styles |
| Small enumerated prop vocabularies and the variant names `solid / soft / outline / ghost` | Radix | Agents pick from a list instead of composing classes |
| Responsive values on layout props, precompiled per breakpoint | Radix | Same mechanism as design A, proven at scale |
| Role names and `X` / `X-foreground` pairs | shadcn | The most widely known token vocabulary; `bg-primary text-primary-foreground` works |
| Tokens exposed to Tailwind through `@theme` | shadcn | Utilities and components share one set of variables |
| `data-slot` on parts | shadcn, UI SDK | Stable styling hooks |
| Styled code scaffolded into the project | shadcn | Decision 5 |

| Ripple avoids | From | Because |
|---|---|---|
| Numeric `"1"`-`"9"` scales with their own meaning | Radix | Frequent complaint: `gap="4"` is not 16 px, and the numbers differ from Tailwind. Ripple's step numbers are Tailwind's (`4` = `calc(var(--spacing) * 4)`) |
| Its own breakpoint names and widths (`xs` 520, `sm` 768, `md` 1024, ...) | Radix | They disagree with Tailwind's `sm`/`md`; Ripple uses Tailwind's |
| 12-step color scales and a fixed list of accent colors | Radix | A merchant brand color is one value; Ripple derives roles from three inputs |
| A mandatory wrapper component and re-wrapping for portals | Radix | Tokens are on `:root`; scopes are a plain attribute |
| Margin props (`m`, `mx`, `mt`, ...) | Radix | They let agents fight the layout primitives; spacing is `gap` and padding only |
| Large always-loaded stylesheet and selectors that are hard to override | Radix | Layers plus (0,1,0)/(0,2,0) selectors; installed-components-only CSS |
| `size="1".."4"` | Radix | `sm / md / lg` is self-describing |
| Variants as JavaScript class strings | shadcn | Not usable from Liquid or plain HTML, and not checkable |
| `.dark` class | shadcn | `data-scheme` supports any number of merchant schemes and nesting |
| Subtractive radius (`calc(var(--radius) - 4px)`) | shadcn | Goes negative; cannot express "square" with one value |
| Unprefixed globals (`--primary`, `--radius`) plus a mapping layer | shadcn | Two names per token; collisions with theme or app CSS |
| No upgrade path for copied code | shadcn | Ripple records hashes and three-way merges; plain one-declaration-per-line CSS keeps merges small |
| The ambiguous `accent` role | shadcn | Kept for compatibility but flagged: it means "hover surface" in shadcn and "brand punctuation color" in the base theme (open question 1) |

---

## 8. What the spec must say

Layers and files

1. The layer order is `@layer ui-sdk, theme, base, rp, components, utilities;` followed by
   `@layer rp.tokens, rp.base, rp.components, rp.props;`. These two statements MUST be the first
   CSS the page parses and, in a Tailwind entry file, MUST precede `@import "tailwindcss"`.
   The checker MUST verify this in `config/styles.css` and in app entry stylesheets.
2. Ripple MUST NOT ship any unlayered rule. The host's token bridge is the only unlayered CSS.
3. Ripple CSS is plain CSS: no Tailwind directives, no preprocessor, no nesting. The authored
   file is the shipped file.
4. The scaffolded CSS files are: `layers.css`, `tokens.css`, `base.css` (generated parts
   marked), `components/<name>.css`, `props.css` (generated), `theme.css` (generated, Tailwind
   only). The prebuilt `ripple.css` is their concatenation in that order, minified with explicit
   browser targets.
5. On a Liquid theme with a compiler, the CSS and the `@theme reference` block are installed
   into `config/styles.css`. Without a compiler, `assets/ripple.css` is linked before
   `assets/styles.min.css`. The HTML is identical in both cases.

Props

6. The prop value grammar is section 1.1. Bindings print the string unchanged into
   `data-<prop>`. The default value MAY be omitted.
7. `props.css` is generated with the ordering rules of section 1.2 (breakpoint blocks ascending;
   inside a block a fixed prop order with shorthands first; quoted values; logical properties;
   specificity (0,1,0); `:where()` scoping for `direction`, `wrap`, `align`, `justify`,
   `columns`; `revert-layer` for `hidden`).
8. V1 layout props and values: `gap`, `gap-x`, `gap-y`, `p`, `px`, `py`, `pt`, `pb` (16 space
   steps); `direction` (`row | column`); `wrap` (`wrap | nowrap`); `align`
   (`start | center | end | stretch | baseline`); `justify` (`start | center | end | between`);
   `columns` (`1 | 2 | 3 | 4 | 5 | 6 | 12`); `span` (`1`-`6 | full`); `hidden`
   (`true | false`). No margin props.
9. The manifest build MUST fail when a Ripple `data-*` prop name equals an attribute UI SDK
   writes, unless the prop's selector is scoped to Ripple classes.
10. Tailwind utilities in `class` always override props and component CSS. This is the escape
    hatch and MUST be stated in every binding's documentation.
11. The checker MUST reject: unknown values, unknown breakpoints, two tokens for the same
    breakpoint, flex-only props on a non-layout element.

Tokens and dials

12. `tokens.css` is the only place token values live. Tokens with a Tailwind v4 namespace use
    the Tailwind name; all others use `--rp-`. `theme.css` is generated from `tokens.css` as
    `@theme reference { ... }` with real values (never `initial`), and a test fails when it is
    stale.
13. The dials are `--rp-background`, `--rp-foreground`, `--rp-brand`, `--rp-radius`,
    `--rp-density`, `--rp-text-scale`, `--rp-font-body`, `--rp-font-heading`, and the optional
    `--rp-brand-foreground`.
14. Derived tokens MUST be declared on `:root, [data-scheme]`. Any element that sets a dial MUST
    carry `data-scheme`. Schemes use literal values.
15. Features above the support floor (relative color syntax, `pow()`) MUST be inside
    `@supports` after a static declaration. The Liquid bridge SHOULD print
    `--rp-brand-foreground`.
16. The default palette MUST meet: 4.5:1 for every text role on `background` and on `muted`,
    4.5:1 for each `X-foreground` on `X`, 3:1 for `--color-input` on `background`. A test
    measures this from computed colors for the light scheme, the dark scheme and at least two
    brand colors (as `tests/system.test.mjs` does).
17. The scales are those of section 6.

Component CSS

18. Every component file follows section 4.2 (skeleton and the 12 rules). A linter enforces
    rules 1-6 mechanically.
19. States are selected by UI SDK presence attributes and by ARIA attributes, both. `data-state`
    MUST NOT be used.
20. Tones have three slots: fill, text-on-fill, tone-as-text.
21. Size budgets of section 4.3 are enforced in CI.

Pre-upgrade

22. `rp.base` contains a generated static `display` rule for every `ui-*` and `rp-*` tag used.
    Each `rp-*` element declares its display in the manifest.
23. JS-only controls are marked in the HTML contract and hidden with a rule that names the
    owning tag and `:not(:defined)`: `visibility: hidden` when in flow, `display: none` when out
    of flow.
24. A conformance test loads each component page with JS disabled and with JS enabled and
    asserts identical bounding boxes for the component root and zero layout shift on upgrade.

---

## 9. Open questions and unverified items

1. **Color role names (decision for Ben).** The proposal says shadcn names;
   `docs/research/base-theme.md` recommends the theme's names (`surface`, `on-surface`,
   `interactive`, ...) because the platform `color_palette` setting has those slots. Both work
   technically: the palette slots map onto the dials (section 2.5) whichever names the roles
   have, and renaming is confined to `tokens.css` and the component files. Recommended default:
   shadcn names (most familiar to coding agents, matches the stated proposal), with the mapping
   table in the Liquid bridge. Sub-question: the theme's `accent` (punctuation color) needs a
   Ripple role; recommended `--color-link`, leaving shadcn's `accent` as the hover surface.
2. **Safari 16.4-17.x and Firefox behaviour** of relative color channel math, `pow()` and
   `revert-layer`: UNVERIFIED (only Chromium is available here). Required before freezing
   section 3.3: one Playwright WebKit run and one Firefox run of `tests/system.test.mjs`.
3. **Canvas/Sidekick compiler**: whether it accepts `@theme reference`, resolves relative
   `@import`, and preserves a leading `@layer` statement before `@import "tailwindcss"`:
   UNVERIFIED. The fallback (prebuilt asset linked first) does not depend on it.
4. **`--z-index-*` and `--transition-duration-*`** produce `z-sticky` and `duration-fast` in
   Tailwind 4.3.5 but may not be a documented contract: UNVERIFIED. If they are not, drop those
   two mappings; component CSS does not use them.
5. **Total size of ~90 components** is an estimate from one component.
6. **Typed `attr()` in Safari/Firefox**: stated as unsupported from memory.
7. **Design-mode pointer events** for disabled controls in the theme editor
   (`theme/blocks/button.liquid`) need a contract attribute.
8. **Fluid type** (`clamp()` on `--text-4xl` and up) was not explored; responsive `size` props
   cover the need.
