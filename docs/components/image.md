# Image

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `image` |
| Kind | `static` |
| Category | `media` |
| Custom elements | none |
| Root element and class | `img` `.rp-image` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A responsive image from a Shopify image object. It always prints `alt`, `width`, `height`, `srcset` and `sizes`, so call sites never compute them by hand (D-039, D-049).

- Use when: showing any Shopify image (product, collection, article, a merchant-chosen image).
- Do not use when: there is no image object (use Placeholder), for icons (use Icon), or for an image that is not on the Shopify CDN and has no known dimensions (write a plain `<img>`).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Image` | `blocks/image.liquid` | `img` | `rp-image` | none | yes | none |

Nesting rules: none. The parent decides the rendered width; the image fills the inline size of its parent.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `image` | `image` | object | `RippleImage` (`url`, `altText`, `width`, `height`; `05-commerce.md` section 11.1); in Liquid an image drop | none | yes | no | `src`, `srcset`, `width`, `height` and the default of `alt` (rules below); never an attribute itself |
| `alt` | `alt` | string | text | the image's own alt text (`image.altText`; Liquid `image.alt`); the empty string when that is missing | no | no | `alt`; ALWAYS printed, as `alt=""` when empty (the one exception to FC-5) |
| `sizes` | `sizes` | string | a `sizes` value | `100vw` | no | no | `sizes` |
| `loading` | `loading` | enum | `lazy eager` | `lazy` | no | no | `loading` |
| `fetchPriority` | `fetch_priority` | enum | `auto high low` | `auto` | no | no | `fetchpriority`; omitted at default (`auto` prints nothing) |
| `ratio` | `ratio` | enum | `auto 1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9` | `auto` | no | no | `data-ratio` |
| `fit` | `fit` | enum | `cover contain` | `cover` | no | no | `data-fit` |
| `radius` | `radius` | enum | `none sm md lg xl full` | `none` | no | no | `data-radius` |

Rules for the attributes derived from `image` (the contract template expresses them with a `host` node per host, `07-manifest-registry-cli.md`):

1. `width` and `height` are the image's intrinsic dimensions: `image.width`, `image.height`. They give the aspect ratio; they are not the requested size.
2. `src` is the image URL at width 800. TSX: `imageUrl(image.url, { width: 800 })` from `<pkg>`. Liquid: `{{ image | image_url: width: 800 }}`.
3. `srcset` has exactly six candidates, widths `200, 400, 600, 800, 1200, 1600`, in this order, separated by `, `. TSX: `imageSrcSet(image.url, [200, 400, 600, 800, 1200, 1600])`. Liquid: six `image_url` calls, each followed by ` <width>w`. Widths are not filtered by the intrinsic width.
4. `decoding="async"` is always printed.
5. An image above the fold (the largest image of the first viewport) MUST be called with `loading="eager"` and `fetchPriority="high"`. Every other image keeps the defaults.
6. `sizes` SHOULD be passed whenever the image is narrower than the viewport, for example `(min-width: 64rem) 25vw, 50vw`.

### Content model

`none` - `<img>` is void.

### HTML contract

Fixture `default` (`image` = resource `image.basic`: URL `https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg`, alt `Linen shirt on a hanger`, width 1600, height 2000):

```html
<img class="rp-image" src="https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?width=1600 1600w" sizes="100vw" alt="Linen shirt on a hanger" width="1600" height="2000" loading="lazy" decoding="async" data-ratio="auto" data-fit="cover" data-radius="none">
```

Fixture `hero` (`image` = `image.basic`, `sizes="(min-width: 64rem) 50vw, 100vw"`, `loading="eager"`, `fetchPriority="high"`, `ratio="4/5"`, `fit="contain"`, `radius="lg"`). `src` and `srcset` are the same as in `default`:

```html
<img class="rp-image" src="https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0000/0001/files/linen-shirt.jpg?width=1600 1600w" sizes="(min-width: 64rem) 50vw, 100vw" alt="Linen shirt on a hanger" width="1600" height="2000" loading="eager" fetchpriority="high" decoding="async" data-ratio="4/5" data-fit="contain" data-radius="lg">
```

Every Image fixture has the mask `[{ "select": "img", "op": "attr", "name": "src" }, { "select": "img", "op": "srcset", "name": "srcset" }]`.

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{ "image": { "$resource": "image.basic" } }` | absent |
| `hero` | `{ "image": { "$resource": "image.basic" }, "sizes": "(min-width: 64rem) 50vw, 100vw", "loading": "eager", "fetchPriority": "high", "ratio": "4/5", "fit": "contain", "radius": "lg" }` | absent |
| `alt-override` | `{ "image": { "$resource": "image.basic" }, "alt": "Front view" }` (output `alt="Front view"`) | absent |
| `no-alt` | `{ "image": { "$resource": "image.no-alt" } }` (output `alt=""`) | absent |
| `class` | `{ "image": { "$resource": "image.basic" }, "class": "custom-a custom-b" }` | absent |
| `invalid-enum-falls-back` | `{ "image": { "$resource": "image.basic" }, "loading": "bogus" }` (output `loading="lazy"`) | absent |
| `escaping` | `{ "image": { "$resource": "image.basic" }, "alt": "Say \"hi\" & <go>" }` | absent |

Rule for `alt`: a non-blank `alt` prop is printed; otherwise the image's own alt text is printed; when both are blank the output is `alt=""`. An empty-string `alt` prop is unset (FC-5), so there is no way to force an empty `alt` on an image that has alt text: decorative use is decided by the image's data.

Resource fixtures this component needs: `image.basic` (values above) and `image.no-alt` (same URL and dimensions, alt text `null` / blank). `13-testing.md` supplies both in `src/testing/resources.ts` under exactly these names (D-074 item 6).

Host-owned regions and masks: the values of `src` and `srcset` (the Liquid `image_url` filter prints protocol-relative URLs with a version parameter). Masked on every fixture as stated above. The width descriptors (`200w` to `1600w`) are compared.

### State and attributes

None.

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Identical to the behaviour with JavaScript. Lazy loading is the browser's native `loading="lazy"`.

### Events, commands and methods

None.

### Accessibility

- Pattern: native `<img>`; `checkPattern`: none.
- Accessible name: `alt`. Always present (`02-html-contract.md` A-7). An empty `alt` marks the image as decorative.
- Focus: not focusable.
- Announcements: None.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/image/image.css` (layer `rp.components`).
- Tokens used: `--color-muted`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-image-radius` | `0` | corner radius |

| Modifier selector | Sets |
|---|---|
| `.rp-image[data-ratio="1/1"]` | `--_ratio: 1 / 1` |
| `.rp-image[data-ratio="4/5"]` | `--_ratio: 4 / 5` |
| `.rp-image[data-ratio="3/4"]` | `--_ratio: 3 / 4` |
| `.rp-image[data-ratio="2/3"]` | `--_ratio: 2 / 3` |
| `.rp-image[data-ratio="4/3"]` | `--_ratio: 4 / 3` |
| `.rp-image[data-ratio="3/2"]` | `--_ratio: 3 / 2` |
| `.rp-image[data-ratio="16/9"]` | `--_ratio: 16 / 9` |
| `.rp-image[data-ratio="21/9"]` | `--_ratio: 21 / 9` |
| `.rp-image[data-fit="contain"]` | `--_fit: contain` |
| `.rp-image[data-radius="sm"]` | `--rp-image-radius: var(--radius-sm)` |
| `.rp-image[data-radius="md"]` | `--rp-image-radius: var(--radius-md)` |
| `.rp-image[data-radius="lg"]` | `--rp-image-radius: var(--radius-lg)` |
| `.rp-image[data-radius="xl"]` | `--rp-image-radius: var(--radius-xl)` |
| `.rp-image[data-radius="full"]` | `--rp-image-radius: 9999px` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-image` | custom properties: `--rp-image-radius` as above; `--_ratio: auto; --_fit: cover`. Declarations: `display: block; inline-size: 100%; max-inline-size: 100%; block-size: auto; aspect-ratio: var(--_ratio); object-fit: var(--_fit); border-radius: var(--rp-image-radius); background-color: var(--color-muted)` |

With `ratio="auto"` the box takes the intrinsic ratio from the `width` and `height` attributes, so space is reserved before the image loads.

### Host notes

- HTML: write the six `srcset` candidates by hand or copy the reference file; the URL parameters are those of `imageUrl` (`05-commerce.md` section 11.3).
- React: `export function Image(props: ImageProps)`; generated; no hooks; no `children`. `fetchPriority` is passed to React as `fetchPriority` and printed as `fetchpriority`.
- Remix: None.
- Liquid: `{% block 'image', image: product.featured_image, sizes: '(min-width: 64rem) 25vw, 50vw' %}{% endblock %}`. The caller MUST test that the image exists and use Placeholder otherwise. Schema settings: `ratio`, `fit`, `radius`. Locale keys: `ripple.image.name`.

```tsx
<Image image={product.featuredImage} ratio="4/5" sizes="(min-width: 64rem) 25vw, 50vw" />
```

```liquid
{% block 'image', image: product.featured_image, ratio: '4/5', sizes: '(min-width: 64rem) 25vw, 50vw' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4, plus RP203 (Image root without `alt`, `width` or `height`). Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 2: with masks, all four hosts are canonically equal for every fixture; the masked `srcset` is `MASKED 200w, MASKED 400w, MASKED 600w, MASKED 800w, MASKED 1200w, MASKED 1600w`.
3. Tier 2: fixture `no-alt` prints `alt=""`; fixture `alt-override` prints `alt="Front view"`; fixture `default` prints no `fetchpriority` attribute.
4. Tier 5: fixture `default` in a 400 px parent has a bounding box of 400 by 500 px before the image loads (request for the image aborted).
5. Tier 5: an Image with `ratio="1/1"` in a 400 px parent has a bounding box of 400 by 400 px and `object-fit: cover`.
6. Unit: `imageUrl` and `imageSrcSet` tests C-22 of `05-commerce.md` pass.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/blocks/image.liquid` (srcset loop, hand-computed `sizes` at call sites); `ripple/docs/00-decisions.md` D-049 as amended (one REQUIRED `image` object of type `RippleImage`; `alt`, `width`, `height` derived and always printed; fixed srcset widths), D-074 item 6 (resource fixtures `image.basic` and `image.no-alt`, supplied by `13-testing.md`), D-039; `05-commerce.md` section 11.3 (`src/image.ts`); `hydrogen/packages/hydrogen/skills/hydrogen-image/SKILL.md`.
- UNVERIFIED: the `image_url` filter of the liquidjs shim returning a URL for the `image.basic` resource (owned by `13-testing.md`); real Shopify output is covered by tier 8.

### Fallback (SPIKE-nn)

None.

---
