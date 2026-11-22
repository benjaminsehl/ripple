# ProductGallery

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `product-gallery` |
| Kind | `native` |
| Category | `product` |
| Custom elements | `rp-carousel`, `rp-dialog` |
| Root element and class | `div` `.rp-product-gallery` |
| Liquid tier | `resource` |
| No-JS level | `degraded` |
| Requires `id` | yes |
| Depends on | `carousel`, `dialog`, `image`, `placeholder`, `icon-button`, `icon`, `visually-hidden` |
| Milestone | M3 |

### Purpose

The product page image gallery: a scroll-snap Carousel of product images, each of which opens a full-size lightbox Dialog.

- Use when: showing all images of one product on its page.
- Do not use when: showing one image (use Image) or a row of products (use Carousel with ProductCard).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `ProductGallery` | `blocks/product-gallery.liquid` | `div` | `rp-product-gallery` | none | yes | none |
| media (region part) | `ProductGalleryMedia` | `snippets/rp-product-gallery-media.liquid` | `div` | `rp-product-gallery-media` | `data-rp-region="rp-product-media"` | yes | none |
| carousel | printed by media | same | `rp-carousel` | `rp-carousel` | `data-slot="rp-carousel"` | yes | `<id>` |
| viewport | printed by media | same | `ul` | `rp-carousel-viewport` | `data-rp-part="viewport"` | yes | `<id>-list` |
| item | printed by media | same | `li` | `rp-carousel-item` | `data-rp-part="item"` | yes | none |
| zoom | printed by media | same | `a` | `rp-product-gallery-zoom` | `data-rp-open="<id>-content"` | yes (per image) | none |
| lightbox | printed by root | `blocks/product-gallery.liquid` | `rp-dialog` | `rp-dialog rp-product-gallery-lightbox` | `data-slot="rp-dialog"` | when there is at least one image | none |
| lightbox panel | printed by root | same | `dialog` | `rp-dialog-panel` | none | with lightbox | `<id>-content` |
| lightbox header | printed by root | same | `div` | `rp-dialog-header` | none | with lightbox | none |
| lightbox title | printed by root | same | `h2` (child of the lightbox header) | `rp-dialog-title rp-visually-hidden` | none | with lightbox | `<id>-content-title` |
| lightbox close | printed by root (embedded IconButton, child of the lightbox header, after the title) | same | `button` | `rp-icon-button` | none | with lightbox | none |
| lightbox body | printed by root | same | `div` | `rp-dialog-body` | none | with lightbox | none |

Nesting rules: root has two children: the media region part, then the lightbox. The lightbox `rp-dialog` MUST be outside the region part (RS-7, D-046 item 5). The children of the lightbox `<dialog>` are exactly, in this order: the header (`div.rp-dialog-header`, containing the visually hidden title and then the close button) and the body (`div.rp-dialog-body`, containing the images). This is Dialog's nesting rule 2 (`components/dialog.md`: header, then body; no other element may be a child of the `<dialog>`); the close button is therefore INSIDE the header, first in the dialog's tab order and at the top of the panel, never a bare child after the body. The `id` prop is printed on the `rp-carousel`, not on root. `prev` and `next` buttons are children of `rp-carousel`, outside the viewport ([04-elements.md](04-elements.md) section 10.9).

### Props

Root (`ProductGallery`) and region part (`ProductGalleryMedia`) take the same props; root passes them on.

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | any id | none | yes | no | `id` on `rp-carousel`; derives `<id>-list`, `<id>-content`, `<id>-content-title` |
| `media` | `media` | object | `Array<{ id: string; image: RippleImage }>` / Liquid `product.media` | none | yes | no | one item per image |
| `variant` | `variant` | object | `RippleVariant` / Liquid `variant` drop | none | no | no | the item whose image is the variant's image is printed first |
| `ratio` | `ratio` | enum | `auto 1/1 4/5 3/4 2/3 4/3 3/2 16/9 21/9` | `1/1` | no | no | `data-ratio` on each carousel Image |
| `ariaLabel` | `aria_label` | string | text | `Product images` (locale key) | no | no | `aria-label` on `rp-carousel`; text of the lightbox title |

Order rule: items are printed in `media` order, except that when `variant` is set and one media image is the variant's image (TSX: `media[i].image.url === variant.image?.url`; Liquid: `media.id == variant.featured_media.id`), that item is moved to the first position. Non-image media are skipped in V1.

### Content model

`parts` - children (`{{ content }}`) replace the default rendering of the media region part (RS-2). Nothing else may be passed.

### HTML contract

Fixture `default` (`id`: `gallery`, `media`: media of `product.basic`):

```html
<div class="rp-product-gallery">
  <div class="rp-product-gallery-media" data-rp-region="rp-product-media">
    <rp-carousel class="rp-carousel" id="gallery" role="group" aria-roledescription="carousel" aria-label="Product images" data-slot="rp-carousel">
      <button class="rp-carousel-control" type="button" disabled aria-controls="gallery-list" aria-label="Previous" data-rp-part="prev" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
      <ul class="rp-carousel-viewport" id="gallery-list" tabindex="0" data-rp-part="viewport">
        <li class="rp-carousel-item" data-rp-part="item">
          <a class="rp-product-gallery-zoom" href="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=2000" data-rp-open="gallery-content"><img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1600 1600w" sizes="(min-width: 64rem) 50vw, 100vw" alt="Linen shirt on a hanger" width="1200" height="1200" loading="eager" fetchpriority="high" decoding="async" data-ratio="1/1" data-fit="cover" data-radius="none"><span class="rp-visually-hidden">View larger image</span></a>
        </li>
        <li class="rp-carousel-item" data-rp-part="item">
          <a class="rp-product-gallery-zoom" href="https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=2000" data-rp-open="gallery-content"><img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=1600 1600w" sizes="(min-width: 64rem) 50vw, 100vw" alt="Back of the linen shirt" width="1200" height="1200" loading="lazy" decoding="async" data-ratio="1/1" data-fit="cover" data-radius="none"><span class="rp-visually-hidden">View larger image</span></a>
        </li>
      </ul>
      <button class="rp-carousel-control" type="button" aria-controls="gallery-list" aria-label="Next" data-rp-part="next" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
    </rp-carousel>
  </div>
  <rp-dialog class="rp-dialog rp-product-gallery-lightbox" data-slot="rp-dialog">
    <dialog class="rp-dialog-panel" id="gallery-content" data-size="full" aria-labelledby="gallery-content-title" closedby="any">
      <div class="rp-dialog-header">
        <h2 class="rp-dialog-title rp-visually-hidden" id="gallery-content-title">Product images</h2>
        <button class="rp-icon-button" type="button" commandfor="gallery-content" command="close" data-variant="ghost" data-size="md" aria-label="Close"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>
      <div class="rp-dialog-body">
        <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=1600 1600w" sizes="100vw" alt="Linen shirt on a hanger" width="1200" height="1200" loading="lazy" decoding="async" data-ratio="auto" data-fit="contain" data-radius="none">
        <img class="rp-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=800" srcset="https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=200 200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=400 400w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=600 600w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0001/linen-shirt-back.jpg?width=1600 1600w" sizes="100vw" alt="Back of the linen shirt" width="1200" height="1200" loading="lazy" decoding="async" data-ratio="auto" data-fit="contain" data-radius="none">
      </div>
    </dialog>
  </rp-dialog>
</div>
```

Fixture `empty` (`id`: `gallery`, `media`: empty list):

```html
<div class="rp-product-gallery">
  <div class="rp-product-gallery-media" data-rp-region="rp-product-media">
    <div class="rp-placeholder" data-ratio="1/1" data-radius="none" aria-hidden="true"></div>
  </div>
</div>
```

Further required fixtures: `class` (root class `rp-product-gallery custom-a custom-b`); `invalid-enum-falls-back` (`ratio`: `9/9`; equals `default`); `escaping` (`ariaLabel`: `Say "hi" & <go>`; the `aria-label` attribute and the title text are escaped); `variant-first` (`variant` whose image is the second media image; the two `<li>` are swapped, the first printed image has `loading="eager" fetchpriority="high"`, and the lightbox images are swapped the same way).

Image rules: every image is the embedded Image of doc 09 (`src` at width 800 and the six-width `srcset`, printed by Image). Carousel images pass `sizes="(min-width: 64rem) 50vw, 100vw"` and `ratio` from the prop; the first printed image passes `loading="eager"` and `fetchPriority="high"`, the others `loading="lazy"` and no `fetchPriority`. Lightbox images pass `sizes="100vw"`, `ratio="auto"`, `fit="contain"`, `loading="lazy"`. The zoom `href` is the only URL the binding builds itself: `imageUrl(image.url, { width: 2000 })` from `<pkg>` (Liquid: `image | image_url: width: 2000`).

Host-owned regions and masks: no host-owned region. Masks: `{ "select": "img", "op": "attr", "name": "src" }`, `{ "select": "img", "op": "srcset", "name": "srcset" }`, `{ "select": "a.rp-product-gallery-zoom", "op": "attr", "name": "href" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `disabled` | `prev` button | server, then `rp-carousel` | scroll offset is at the start | present |
| `disabled` | `next` button | `rp-carousel` | scroll offset is at the end | absent |
| `open` | lightbox `dialog` | browser | lightbox open | absent |
| `aria-haspopup`, `aria-controls` | zoom links | runtime opener listener (D-009) | after upgrade | absent |
| `aria-busy` | media region part | commerce adapter | while region `rp-product-media` refreshes | absent |

Upgrade allow-list (mutations permitted when the element upgrades): `{ "select": "[data-rp-part=\"next\"]", "attrs": ["disabled"], "reason": "Whether all slides fit depends on layout." }` (from Carousel); the global entry for `a[data-rp-open]`.

### Behaviour with JavaScript

1. Carousel behaviour is that of `rp-carousel` ([04-elements.md](04-elements.md) section 9.2): previous / next buttons page the list; `indexchange` is dispatched on the `rp-carousel`.
2. An unmodified primary click on a zoom link opens the lightbox with `showModal()` and does not navigate (opener listener, [04-elements.md](04-elements.md) section 3.4). A modified click opens the full-size image in a new tab.
3. The lightbox shows every image at full width in one vertically scrolling column, starting at the first image. Scrolling to the clicked image is NOT done in V1.
4. The lightbox closes with the close button, Escape, or a press on the backdrop; `openchange` is dispatched on the `rp-dialog`.
5. When a VariantPicker refreshes region `rp-product-media`, the media region part is replaced; the new `rp-carousel` starts at its first item. The lightbox is not replaced.

### Behaviour without JavaScript

The image list scrolls and snaps by touch, trackpad and keyboard. The previous and next buttons are invisible but keep their space (`rp-carousel:not(:defined) [data-rp-js="inflow"]`). A zoom link navigates to the full-size image file (`noJs.fallbackHref`: the image URL). The lightbox is never shown. Missing: paging buttons, lightbox.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `indexchange` | `rp-carousel` | `{ value: number, reason: "next-press" \| "previous-press" \| "scroll" \| "imperative", source }` | `onIndexChange` |
| event | `openchange` | lightbox `rp-dialog` | `{ value: boolean, reason, source }` | `onOpenChange` |
| command | `close` | lightbox `dialog` | `commandfor="<id>-content"` | none |

### Accessibility

- Pattern: carousel (group with `aria-roledescription="carousel"`) plus native modal dialog; `checkPattern`: none.
- Accessible name: `aria-label` on the `rp-carousel` (prop `ariaLabel`); the lightbox is named by its visually hidden title. Each zoom link is named by the image `alt` followed by `View larger image`.
- Focus: opening the lightbox moves focus into the dialog (browser); closing returns focus to the zoom link that opened it.
- Announcements: None.

| Key | Action |
|---|---|
| ArrowRight / ArrowLeft on the focused viewport | scrolls the list (native) |
| Tab | moves through the zoom links |
| Enter on a zoom link | opens the lightbox |
| Escape in the lightbox | closes it |

### Styling

- File: `components/product-gallery/product-gallery.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--radius-surface`, `--color-background`, `--color-ring`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-product-gallery-gap` | `calc(var(--spacing) * 2)` | gap between slides |
| `--rp-product-gallery-radius` | `var(--radius-surface)` | corner radius of slides |
| `--rp-product-gallery-slide-size` | `100%` | inline size of one slide |
| `--rp-product-gallery-lightbox-max` | `80rem` | maximum inline size of lightbox images |

| Modifier selector | Sets |
|---|---|
| None. | |

Required rules: `.rp-product-gallery .rp-carousel-item { flex: 0 0 var(--rp-product-gallery-slide-size) }`; `.rp-product-gallery-zoom { display: block; cursor: zoom-in }`; `.rp-product-gallery-lightbox .rp-dialog-body { display: grid; gap: var(--rp-product-gallery-gap); justify-items: center; overflow-y: auto }`; `.rp-product-gallery-lightbox .rp-dialog-header { justify-content: flex-end }` (the title is visually hidden, so the close button sits at the inline end of the header).

### Host notes

- HTML: None.
- React: `ProductGallery(props: { id: string; media: RippleMedia[]; variant?: RippleVariant | null; ratio?: Ratio; ariaLabel?: string; onIndexChange?: (value: number, detail: object) => void; onOpenChange?: (value: boolean, detail: object) => void; className?: string; children?: ReactNode })` where `RippleMedia` is imported as a type from `<pkg>` ([05-commerce.md](05-commerce.md) section 11.1, D-094); this component reads its fields `id: string` and `image: RippleImage`. The file starts with `"use client"` because it calls `useElement` for the two callbacks (R-4). `ProductGalleryMedia` is exported from the same file. The carousel is the embedded Carousel (controls `rp-carousel-control`, doc 10). The lightbox composes Dialog by contract (D-070; class pairs `rp-dialog rp-product-gallery-lightbox` and `rp-dialog-title rp-visually-hidden`, section 0.2): the binding prints the `rp-dialog`, the `<dialog class="rp-dialog-panel">`, the header `<div class="rp-dialog-header">`, the title (inside the header) and the body itself; the close button is the embedded IconButton, printed inside the header after the title (Dialog nesting rule 2). The Liquid block and all three TSX bindings print this same order. Manifest `dependencies.components`: `carousel`, `dialog`, `image`, `placeholder`, `icon-button`, `icon`, `visually-hidden`.
- Remix: `data-rmx-key="<id>"` on the `rp-carousel` and `data-rmx-key="<id>-content"` on the `rp-dialog`; the `prev` and `next` buttons print `data-rmx-preserve-attrs="disabled"`; the `dialog` prints `data-rmx-preserve-attrs="open"`.
- Liquid: the block prints root and lightbox and renders `rp-product-gallery-media` as its default body. Media loop: `{% for item in media %}{% if item.media_type == 'image' %}` reading `item.preview_image` and `item.alt`. No schema settings. Locale keys: `ripple.product-gallery.label` = `Product images`; `ripple.product-gallery.zoom` = `View larger image`; `ripple.product-gallery.previous` = `Previous`; `ripple.product-gallery.next` = `Next`; `ripple.product-gallery.close` = `Close`.

```tsx
<ProductGallery id="gallery" media={product.media.nodes.filter((m) => m.__typename === "MediaImage")} variant={variant} />
```

```liquid
{% block 'product-gallery', id: 'gallery', media: product.media, variant: product.selected_or_first_available_variant %}
  {% partial 'rp-product-media' %}{% render 'rp-product-gallery-media', id: 'gallery', media: product.media, variant: product.selected_or_first_available_variant %}{% endpartial %}
{% endblock %}
```

### Commerce

None. (The region `rp-product-media` is refreshed by VariantPicker; ProductGallery binds no store.)

### Agent surface

`bridge` for the two elements: `rp-carousel` actions `next`, `previous`, `goTo`; `rp-dialog` actions `open`, `close` ([04-elements.md](04-elements.md) section 12). Confirm: none. Secret: none.

### Checker rules

RP104 (`id`, `media`), RP114 (derived ids), RP203 (every image), RP302 (zoom link has `href`), RP308 and RP404 (the lightbox dialog is not inside a region or a partial), RP403 (Liquid: partial `rp-product-media` declared when a VariantPicker names it). Manifest `rules[]`: `product-gallery-lightbox-outside-region` (`forbids-descendant`, selector `.rp-product-gallery-media`, target `dialog`).

### Acceptance tests

1. Tier 2: fixtures `default`, `empty`, `class`, `invalid-enum-falls-back`, `escaping`, `variant-first` are canonical-equal in all four hosts with the masks above.
2. Tier 3: zero mutations at upgrade outside the allow-list.
3. Tier 5: clicking the second zoom link opens `#gallery-content` (`dialog.open === true`), the URL does not change, and Escape closes it and returns focus to that link.
4. Tier 5: pressing `next` scrolls the viewport and dispatches `indexchange` with `value: 1`.
5. Tier 6: with scripting disabled, a click on a zoom link navigates to a URL ending in `width=2000`.
6. Tier 5: after `getCommerce().refresh(["rp-product-media"], { url })` the lightbox `dialog` element is the same node as before.
7. Tier 2: the element children of `#gallery-content` are exactly `div.rp-dialog-header` then `div.rp-dialog-body`; the header's children are the `h2.rp-dialog-title` then the close `button`. Tier 5: after opening the lightbox, the first Tab stop inside the dialog is the close button.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/04-elements.md` sections 9.1, 9.2, 10.9; `ripple/theme/assets/s-product-image-zoom.js`; `ripple/theme/templates/product.liquid`; ledger D-016, D-009.
- UNVERIFIED: Liquid `variant.featured_media.id` and `media.preview_image` on the preview store (tier 8); Storefront API `media` selection of `RippleProductDetail`.

### Fallback (SPIKE-nn)

None.

---
