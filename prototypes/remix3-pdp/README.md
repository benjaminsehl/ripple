# Ripple prototype: product page + cart on Remix 3

Throwaway prototype. Not a spec. It answers three questions:

1. Can a small Ripple kit produce a polished product page and cart that work with JS off?
2. Can ~12 CSS-variable tokens change the look completely?
3. Does a Tailwind/custom-HTML escape hatch work, and can an agent be steered to the high-level components first?

## Run

```sh
npm i
npm run dev            # builds CSS, serves http://localhost:44100
```

Data comes from mock.shop through `@shopify/hydrogen` (Storefront client + `createCartServerHandlers`, which serves the
no-JS `POST /api/cart` form contract). If mock.shop is unreachable it falls back to fixtures with the same shapes and an
in-memory cart behind the same contract (`RIPPLE_DATA=live|fixture` forces a mode). The footer says which mode is on.

Useful URLs:

- `/products/everyday-hoodie?Color=Sage&Size=M`: product page (variant lives in the URL)
- `?theme=linen|mono|bloom`: switch token sets (remembered in a cookie; also the pill at the bottom)
- `?inspect=1`: outline every escape hatch on the page
- `/cart`: cart page. The drawer opens on add to cart when JS is on.
- `/experiments/a`, `/experiments/b`: pages built by test agents (see below)

## Layout

```
app/ripple/            the kit an agent uses
  AGENTS.md            agent-facing index: "about to write X → use Y", scales, escape-hatch rules
  index.ts             exports
  layout.tsx type.tsx controls.tsx commerce.tsx icons.tsx
  tokens.css           12 theme tokens × 3 themes, everything else derived
  ripple.css           component CSS, loaded into Tailwind's `components` layer
public/ripple/ripple.js   light-DOM custom elements (gallery, qty, product form, cart drawer). Optional.
app/styles/app.css     Tailwind v4 + Ripple; maps tokens into Tailwind (bg-accent, rounded-rp, spacing = density)
scripts/ripple-check.mjs  flags hand-rolled markup that has a Ripple equivalent
app/actions/products/product-page.tsx   the reference page
```

## How it works without JS

- Variant picker is a GET form of radios. A CSS `:has()` rule hides Add to cart and promotes "Update selection" when the
  picked options differ from the rendered variant, so you can't add the wrong variant.
- Add to cart and cart line edits are native POSTs to `/api/cart` (Hydrogen's contract); the handler redirects back.
- Gallery is scroll-snap + anchor thumbnails. Accordions are `<details>`.
- With JS: Remix's runtime turns the variant GET into an in-place navigation, and `ripple.js` posts add-to-cart in the
  background and opens the drawer.

## Agent-steering test (what happened)

Two fresh Sonnet subagents got the same request: "build a limited-drop page for the Loop Crewneck: full-bleed hero with
the name over the image, 'Only 40 made' callout, color/size, add to cart, 3-up features with icons, size guide table,
FAQ, complete the look; must work without JS." Each could edit one file only.

| | A: told to read `app/ripple/AGENTS.md` | B: baseline, told not to open it |
|---|---|---|
| Ripple components used | 20 (incl. custom ProductForm composition) | 15 |
| Hand-rolled | hero, size table (both marked `data-escape`) | hero, size table |
| `ripple-check` findings | 0 | 5 (raw `<img>`, raw `<h1>`, `from-black/70`, `text-white`) |
| Asked for | Hero, Table, Feature, Stat/scarcity, Media fill, more icons, inverse text tone | Hero, Table, Feature, FAQ group, scarcity meter, more icons |

Screenshots: `screenshots/10-agent-*.jpg` (pink outlines = marked escape hatches).

Takeaways:

- Both agents reached for components first. The baseline did too, mostly by copying `product-page.tsx`, so a strong
  reference page is itself a steering tool. The index's measurable effect was on the edges: token-only colors, no raw
  headings/images, and every escape marked.
- The escape hatches both agents needed were the same two (hero over image, table). That is the signal for what to build
  next: when independent agents escape in the same place, promote it to a component.
- Bug found by the test and fixed: `Badge` stretched full width inside a `Stack`.
