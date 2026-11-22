# Ripple layer for UI SDK (prototype)

A visual layer that sits on top of [UI SDK](https://ui-sdk.dev/) (`@ui-sdk/web` 0.1.0-beta.13). UI SDK keeps behavior, accessibility and markup; Ripple sets the look.

Live demo: `dist/index.html` (self-contained). Build it with `npm install && npm run build`.

## How it works

| Piece | File | What it does |
| --- | --- | --- |
| Knobs | `src/ripple.css` §1 | 12 custom properties: paper, ink, brand, highlight, radius, elevation, density, body font, display font, display weight, display tracking, display case, type scale (plus optional `--rp-on-brand`). |
| Derived tokens | `src/ripple.css` §2 | ~40 tokens from `color-mix()` and `calc()`: surfaces, lines, subtle text, focus, brand tints, spacing unit, type scale, shadows. Mapped onto UI SDK's `--ui-*`, so every UI SDK component follows the theme. |
| Surfaces | `src/ripple.css` §2 | `data-surface="muted|inverse|brand"` re-themes a section. `data-theme` works on any element. |
| Parts | `src/ripple.css` §3 | Storefront refinements keyed on UI SDK's `data-slot` and state attributes: button sizes and variants, radio-group `chips`, `swatches` and `cards`, one-box quantity stepper, accordion, tabs, segmented control, drawer, toast. |
| Primitives | `src/ripple.css` §4 | Things UI SDK doesn't ship: `heading`, `text`, `eyebrow`, `price`, `badge`, `card`, `media`. Same `data-slot` convention. |
| Themes | `src/themes.css` | Five presets. Each is only knobs. |
| Tailwind bridge | `src/tailwind.css` | `@theme inline` so utilities read the tokens (`bg-surface`, `border-line`, `text-subtle`), and `--spacing` follows density. |

Cascade order: `@layer theme, base, ui-sdk, ripple, components, utilities;` so Ripple beats UI SDK and Tailwind utilities beat Ripple.

## Rules for agents

1. Behavior is UI SDK. If UI SDK has the part, use it.
2. `data-slot` says what it is.
3. `data-variant`, `data-size`, `data-tone` say how it looks, from closed lists. State comes from UI SDK.
4. Tailwind arranges (layout, width, position, one-offs) with token colors only.
5. Themes are knobs. Change the theme block or a `data-surface`, never restyle a part.

## Findings

- **Layer order fight.** UI SDK's runtime prepends its own `@layer ui-sdk` styles to `<head>`, so `ui-sdk` becomes the first-declared layer, which puts Tailwind's preflight (`base`) above it and zeroes UI SDK's borders. The demo keeps a `@layer` order statement first in `<head>` with a small MutationObserver. Worth asking UI SDK to append instead, or to document the order.
- UI SDK's slot names and state attributes were enough for every refinement here; no markup changes were needed.
- `oklch(from …)` gives automatic text-on-brand contrast; themes can still set `--rp-on-brand`.
- Derived tokens must be re-declared on `[data-theme]` and `[data-surface]` or a subtree's knob change won't reach them. Surface palettes are computed once per theme to avoid custom-property cycles.
