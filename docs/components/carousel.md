# Carousel

> Component spec. Group doc: [10-components-interactive.md](../10-components-interactive.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `carousel` |
| Kind | `native` |
| Category | `navigation` |
| Custom elements | `rp-carousel` |
| Root element and class | `rp-carousel` `.rp-carousel` |
| Liquid tier | `parts` |
| No-JS level | `degraded` |
| Requires `id` | yes |
| Depends on | `icon` |
| Milestone | M2 |

### Purpose

A horizontally scrolling list of items with CSS scroll snapping, plus Previous and Next buttons added by `rp-carousel` (D-016). Scrolling, snapping, touch and keyboard scrolling are native; the element only pages the list and keeps the two buttons' `disabled` state in step with the scroll position.

- Use when: a row of peer items (product cards, images, testimonials) is longer than the available width and seeing all of them is optional.
- Do not use when: every item must be seen (use Grid); the items are the media of one product (use ProductGallery, which composes `rp-carousel`); the content must advance by itself (V1 has no auto-rotation, by decision); there are fewer items than columns at every breakpoint (use Grid).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Carousel` | `blocks/carousel.liquid` | `rp-carousel` | `rp-carousel` | `data-slot="rp-carousel"` | yes | `<id>` |
| prev | none (printed by `Carousel`) | none (printed by `blocks/carousel.liquid`) | `button` | `rp-carousel-control` | `data-rp-part="prev"`, `data-rp-js="inflow"` | yes | none |
| viewport | none (printed by `Carousel`) | none (printed by `blocks/carousel.liquid`) | `ul` | `rp-carousel-viewport` | `data-rp-part="viewport"` | yes | `<id>-list` |
| item | `CarouselItem` | `blocks/carousel-item.liquid` | `li` | `rp-carousel-item` | `data-rp-part="item"` | yes, at least one | none |
| next | none (printed by `Carousel`) | none (printed by `blocks/carousel.liquid`) | `button` | `rp-carousel-control` | `data-rp-part="next"`, `data-rp-js="inflow"` | yes | none |

Nesting rules:

1. The children of the root are exactly three, in this order: the prev button, the viewport, the next button. The root prints all three; the author writes only items.
2. The children of the viewport are items only. The author's `CarouselItem`s are placed inside the viewport by the root.
3. The two buttons MUST be outside the viewport. Both use the class `rp-carousel-control`; they differ by `data-rp-part`.
4. An item contains any flow content (normally one card). An item MUST NOT be given `aria-hidden`, `inert`, `hidden` or `tabindex`.
5. A Carousel root MUST NOT be inside an `<a>`, a `<button>` or a `<label>`. A Carousel MAY be inside a Dialog or Drawer body.
6. A Carousel MUST NOT be nested inside the item of another Carousel.

### Props

Root (`Carousel`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | yes | no | `id` on the root; `id="<id>-list"` on the viewport; `aria-controls="<id>-list"` on both buttons |
| `ariaLabel` | `aria_label` | string | any non-empty text | none | yes | no | `aria-label` on the root |
| `columns` | `columns` | enum | `1` `2` `3` `4` `5` `6` | none | no | yes | `data-columns` on the root (D-028 token grammar, for example `2 md:4`); absent when not passed |
| `previousLabel` | `previous_label` | string | any non-empty text | locale key `ripple.carousel.previous` (English: `Previous`) | no | no | `aria-label` on the prev button |
| `nextLabel` | `next_label` | string | any non-empty text | locale key `ripple.carousel.next` (English: `Next`) | no | no | `aria-label` on the next button |
| `onIndexChange` | none (React only) | callback | `(index: number, detail: { value: number; reason: "next-press" \| "previous-press" \| "scroll" \| "imperative"; source: string }) => void` | none | no | no | no attribute; listener for `indexchange` through `useElement` |

`class` and rest props / `attributes` on `Carousel` apply to `rp-carousel`. The item has no props other than `class` and rest props / `attributes`.

`columns` is the number of items visible at once. Without it each item keeps the width of its content (the author sizes the content, for example a card with a fixed width). The element option `default-index` of `rp-carousel` is not exposed as a prop in V1: a Carousel always starts at the first item (D-016). `columns` reuses the prop name of Grid with the values `1` to `6` and its own CSS (D-016; `00-decisions.md` section 6.3).

### Content model

`parts` - the children of `Carousel` are `CarouselItem`s only. `CarouselItem` takes any flow content.

### HTML contract

Fixture `default` (`id="featured"`, `ariaLabel="Featured products"`; three items):

```html
<rp-carousel class="rp-carousel" id="featured" role="group" aria-roledescription="carousel" aria-label="Featured products" data-slot="rp-carousel">
  <button class="rp-carousel-control" type="button" disabled aria-controls="featured-list" aria-label="Previous" data-rp-part="prev" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
  <ul class="rp-carousel-viewport" id="featured-list" tabindex="0" data-rp-part="viewport">
    <li class="rp-carousel-item" data-rp-part="item"><p>One</p></li>
    <li class="rp-carousel-item" data-rp-part="item"><p>Two</p></li>
    <li class="rp-carousel-item" data-rp-part="item"><p>Three</p></li>
  </ul>
  <button class="rp-carousel-control" type="button" aria-controls="featured-list" aria-label="Next" data-rp-part="next" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
</rp-carousel>
```

Fixture `responsive` (`id="featured"`, `ariaLabel="Featured products"`, `columns="2 md:4"`; three items). It differs from `default` only by `data-columns` on the root:

```html
<rp-carousel class="rp-carousel" id="featured" data-columns="2 md:4" role="group" aria-roledescription="carousel" aria-label="Featured products" data-slot="rp-carousel">
  <button class="rp-carousel-control" type="button" disabled aria-controls="featured-list" aria-label="Previous" data-rp-part="prev" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
  <ul class="rp-carousel-viewport" id="featured-list" tabindex="0" data-rp-part="viewport">
    <li class="rp-carousel-item" data-rp-part="item"><p>One</p></li>
    <li class="rp-carousel-item" data-rp-part="item"><p>Two</p></li>
    <li class="rp-carousel-item" data-rp-part="item"><p>Three</p></li>
  </ul>
  <button class="rp-carousel-control" type="button" aria-controls="featured-list" aria-label="Next" data-rp-part="next" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
</rp-carousel>
```

Fixture `escaping` (`id="looks"`, `ariaLabel` is the text `Say "hi" & <go>`, `previousLabel="Previous look"`, `nextLabel="Next look"`; one item):

```html
<rp-carousel class="rp-carousel" id="looks" role="group" aria-roledescription="carousel" aria-label="Say &quot;hi&quot; &amp; &lt;go&gt;" data-slot="rp-carousel">
  <button class="rp-carousel-control" type="button" disabled aria-controls="looks-list" aria-label="Previous look" data-rp-part="prev" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
  <ul class="rp-carousel-viewport" id="looks-list" tabindex="0" data-rp-part="viewport">
    <li class="rp-carousel-item" data-rp-part="item"><p>One</p></li>
  </ul>
  <button class="rp-carousel-control" type="button" aria-controls="looks-list" aria-label="Next look" data-rp-part="next" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
</rp-carousel>
```

Fixture `class` (`id="w2"`, `ariaLabel="Items"`, `class="custom-a custom-b"` on the root; one item with `class="custom-c"`):

```html
<rp-carousel class="rp-carousel custom-a custom-b" id="w2" role="group" aria-roledescription="carousel" aria-label="Items" data-slot="rp-carousel">
  <button class="rp-carousel-control" type="button" disabled aria-controls="w2-list" aria-label="Previous" data-rp-part="prev" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
  <ul class="rp-carousel-viewport" id="w2-list" tabindex="0" data-rp-part="viewport">
    <li class="rp-carousel-item custom-c" data-rp-part="item"><p>One</p></li>
  </ul>
  <button class="rp-carousel-control" type="button" aria-controls="w2-list" aria-label="Next" data-rp-part="next" data-rp-js="inflow"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
</rp-carousel>
```

Carousel has no enumerated prop with a default (`columns` is responsive and has none), so there is no default to fall back to and Carousel has no `invalid-enum-falls-back` fixture (`02-html-contract.md` F-13; D-074 item 3). A `columns` token outside the enumeration is reported by the checker (RP101, RP103) and printed unchanged in every host (`06-bindings.md` L-16); no CSS rule matches it, so items keep their content width.

The two `<svg>` elements are the Icon contract for `chevron-left` and `chevron-right` (G-4). The server MUST print `disabled` on the prev button and MUST NOT print it on the next button (`04-elements.md` 9.2 item 6). The server MUST NOT print: `default-index`, `aria-live`, `aria-hidden`, `role` on the viewport or on an item, `aria-roledescription="slide"`, `aria-current`.

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `disabled` | prev button | element (`rp-carousel`) | the scroll offset is at most 1 px from the start | present |
| `disabled` | next button | element (`rp-carousel`) | the scroll offset is within 1 px of the maximum (including when all items fit) | absent |

Upgrade allow-list (mutations permitted when the element upgrades):

```json
[
  {
    "select": "[data-rp-part=\"next\"]",
    "attrs": ["disabled"],
    "reason": "Whether all items fit depends on layout, which the server cannot know; rp-carousel adds disabled to the next button at upgrade when nothing can be scrolled."
  }
]
```

### Behaviour with JavaScript

The behaviour of `rp-carousel` is specified in `04-elements.md` 9.2 (items 1 to 7 there). Summary of what a user sees:

1. At upgrade the two buttons become visible (they were `visibility: hidden` and kept their space, so nothing moves). The next button gets `disabled` when all items fit.
2. A press on Next or Previous scrolls the viewport by one viewport width in the inline direction, smoothly, or instantly under `prefers-reduced-motion: reduce`. Scroll snapping decides the resting position, so an item is never cut at the start edge.
3. The buttons' `disabled` state follows the scroll position on every scroll and on every resize of the root.
4. `indexchange` is dispatched on `rp-carousel` when the index of the first visible item changes, whatever caused the scroll. It cannot be vetoed (D-016, D-023).
5. In a right-to-left document the first item is at the right, Next scrolls to the left, and both chevrons are mirrored by CSS (`scale: var(--rp-dir) 1`).
6. The element never moves focus, never hides an item, and never scrolls by itself (no auto-rotation, no looping).
7. A region refresh that replaces items (`rp:refresh` in a surrounding region) needs no action: the element reads the items at event time (`04-elements.md` rule R-5).

### Behaviour without JavaScript

- The list scrolls and snaps by touch, trackpad, mouse wheel with Shift, and keyboard (the viewport is focusable; arrow keys scroll it). All items are reachable.
- The Previous and Next buttons are invisible but keep their space: the generated rule `rp-carousel:not(:defined) [data-rp-js="inflow"] { visibility: hidden }` (`03-styling-and-tokens.md`; `04-elements.md` 10.16 C-4). Nothing shifts at upgrade.
- The scrollbar is hidden by `scrollbar-width: none`; pointer users without a wheel or trackpad and without JavaScript can still scroll by focusing the viewport and using the keyboard. This is the reason the level is `degraded` and not `full`.
- Manifest: `noJs.level: "degraded"`, `noJs.behavior: "The list scrolls and snaps natively. The Previous and Next buttons are hidden until rp-carousel is defined."`, `noJs.hideUntilDefined: ["[data-rp-part=\"prev\"]", "[data-rp-part=\"next\"]"]`, `noJs.fallbackHref`: absent.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `indexchange` | `rp-carousel` | `{ value: number, reason: "next-press" \| "previous-press" \| "scroll" \| "imperative", source: string }`; not bubbling; not cancelable (D-023) | `onIndexChange(index, detail)` |
| method | `api.getIndex()` | `rp-carousel` | returns the 0-based index of the first visible item | none |
| method | `api.next()`, `api.previous()` | `rp-carousel` | scroll one viewport width | none |
| method | `api.goTo(index)` | `rp-carousel` | smooth scroll to the item; `indexchange` with reason `imperative` | none |
| method | property `index` (settable) | `rp-carousel` | jumps without animation and without an event | none |

No command.

### Accessibility

- Pattern: APG "Carousel", basic variant without auto-rotation and without slide picker; `checkPattern`: `null`.
- Accessible name: REQUIRED on the root, from `ariaLabel`. The root is `role="group"` with `aria-roledescription="carousel"`. The two buttons are named by `previousLabel` / `nextLabel`. The viewport keeps its native list role, so assistive technology announces the number of items; items are not given a "slide" role description.
- Focus: tab order is Previous, the viewport (`tabindex="0"`, so that keyboard users can scroll it), the focusable content of the items in document order, then Next. Pressing a button does not move focus. When a button becomes `disabled` while focused, focus stays on it (a disabled button that already has focus keeps it in all engines; UNVERIFIED outside Chromium) and the other button remains reachable with Tab.
- Announcements: None. There is no live region: the list does not change by itself, and after a button press the user reads the newly visible items in the list.

| Key | Action |
|---|---|
| Tab | Previous button, viewport, item content, Next button |
| ArrowRight / ArrowLeft on the viewport | Native scrolling of the list (mirrored in right-to-left) |
| Enter or Space on a button | Scrolls one page |

### Styling

- File: `components/carousel/carousel.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--spacing-control-sm`, `--color-background`, `--color-foreground`, `--color-border`, `--color-accent`, `--rp-ring-width`, `--rp-duration-fast`, `--ease-out`, `--rp-dir`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-carousel-gap` | `calc(var(--spacing) * 4)` | gap between items |
| `--rp-carousel-control-size` | `var(--spacing-control-sm)` | width and height of the two buttons |

| Modifier selector | Sets |
|---|---|
| `.rp-carousel[data-columns~="<n>"]` for `<n>` in 1 to 6 | `--_item-size` |
| `.rp-carousel[data-columns~="<bp>:<n>"]` for `<bp>` in `sm`, `md`, `lg`, `xl`, `2xl` and `<n>` in 1 to 6, inside `@media (min-width: 40rem \| 48rem \| 64rem \| 80rem \| 96rem)` | `--_item-size` |

Rules specific to this file:

1. Layout: the root is a three-column grid `auto minmax(0, 1fr) auto` (button, viewport, button). The viewport is a flex row with `overflow-x: auto`, `scroll-snap-type: inline mandatory`, `overscroll-behavior-x: contain` and `scrollbar-width: none`; every item has `scroll-snap-align: start`.
2. Item width for `columns = n` is `calc((100% - var(--rp-carousel-gap) * (n - 1)) / n)`, so exactly `n` items and `n - 1` gaps fill the viewport.
3. The `data-columns` rules are written out in this file (6 base rules and 30 breakpoint rules) and not generated into `props.css`: the `data-columns` rules of `props.css` are scoped to `:where(.rp-grid)` (`03-styling-and-tokens.md` 6.1) and set `grid-template-columns`, which is wrong for a scrolling flex row. A component MAY select its own manifest prop attribute together with its own class (D-024 item (b), D-105; section 0.3 item 4). The breakpoints are those of `03-styling-and-tokens.md` (D-028); the media blocks are in ascending order so that a larger breakpoint wins.
4. The file MUST NOT hide the buttons before upgrade; that is the generated `[data-rp-js="inflow"]` rule. The file MUST NOT set `scroll-behavior`: the element chooses `smooth` or `auto` per call.
5. The buttons use `scale: var(--rp-dir) 1` to mirror the chevrons in right-to-left documents (`03-styling-and-tokens.md` section 10).
6. The viewport's focus ring is drawn inside it (negative `outline-offset`), because the viewport clips overflow.

Complete file:

```css
/* carousel.css
   Component: Carousel (id `carousel`). Contract: 10-components-interactive.md, "Carousel".
   Root:      <rp-carousel>, class rp-carousel
   Parts:     rp-carousel-control (<button>, previous and next)
              rp-carousel-viewport (<ul>)
              rp-carousel-item (<li>)
   Props:     data-columns = 1 | 2 | 3 | 4 | 5 | 6, responsive token list   (no default: items keep their own width)
   States:    :disabled, :hover, :focus-visible
   Public:    --rp-carousel-gap, --rp-carousel-control-size */
@layer rp.components {
  /* 1. ROOT */
  .rp-carousel {
    /* 1a. public custom properties */
    --rp-carousel-gap: calc(var(--spacing) * 4);
    --rp-carousel-control-size: var(--spacing-control-sm);
    /* 1b. colour slots */
    --_bg: var(--color-background);
    --_fg: var(--color-foreground);
    --_border: var(--color-border);
    /* 1c. other private custom properties */
    --_item-size: auto;
    /* 1d. declarations */
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: calc(var(--spacing) * 2);
  }

  /* 2. PARTS */
  .rp-carousel-control {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--rp-carousel-control-size);
    block-size: var(--rp-carousel-control-size);
    margin: 0;
    padding: 0;
    border: 1px solid var(--_border);
    border-radius: 9999px;
    background-color: var(--_bg);
    color: var(--_fg);
    scale: var(--rp-dir) 1;
    cursor: pointer;
  }
  .rp-carousel-viewport {
    display: flex;
    gap: var(--rp-carousel-gap);
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: inline mandatory;
    scrollbar-width: none;
  }
  .rp-carousel-item {
    flex: 0 0 var(--_item-size);
    min-inline-size: 0;
    scroll-snap-align: start;
  }

  /* 3. MODIFIERS */
  .rp-carousel[data-columns~="1"] {
    --_item-size: 100%;
  }
  .rp-carousel[data-columns~="2"] {
    --_item-size: calc((100% - var(--rp-carousel-gap) * 1) / 2);
  }
  .rp-carousel[data-columns~="3"] {
    --_item-size: calc((100% - var(--rp-carousel-gap) * 2) / 3);
  }
  .rp-carousel[data-columns~="4"] {
    --_item-size: calc((100% - var(--rp-carousel-gap) * 3) / 4);
  }
  .rp-carousel[data-columns~="5"] {
    --_item-size: calc((100% - var(--rp-carousel-gap) * 4) / 5);
  }
  .rp-carousel[data-columns~="6"] {
    --_item-size: calc((100% - var(--rp-carousel-gap) * 5) / 6);
  }
  /* 4. STATES */
  @media (hover: hover) {
    .rp-carousel-control:hover {
      background-color: var(--color-accent);
    }
  }
  .rp-carousel-viewport:focus-visible {
    outline-offset: calc(var(--rp-ring-width) * -1);
  }
  .rp-carousel-control:disabled {
    opacity: 0.4;
    cursor: default;
  }

  /* 5. MOTION */
  @media (prefers-reduced-motion: no-preference) {
    .rp-carousel-control {
      transition-property: background-color, opacity;
      transition-duration: var(--rp-duration-fast);
      transition-timing-function: var(--ease-out);
    }
  }

  /* 6. ENVIRONMENT */
  @media (min-width: 40rem) {
    .rp-carousel[data-columns~="sm:1"] {
      --_item-size: 100%;
    }
    .rp-carousel[data-columns~="sm:2"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 1) / 2);
    }
    .rp-carousel[data-columns~="sm:3"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 2) / 3);
    }
    .rp-carousel[data-columns~="sm:4"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 3) / 4);
    }
    .rp-carousel[data-columns~="sm:5"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 4) / 5);
    }
    .rp-carousel[data-columns~="sm:6"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 5) / 6);
    }
  }
  @media (min-width: 48rem) {
    .rp-carousel[data-columns~="md:1"] {
      --_item-size: 100%;
    }
    .rp-carousel[data-columns~="md:2"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 1) / 2);
    }
    .rp-carousel[data-columns~="md:3"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 2) / 3);
    }
    .rp-carousel[data-columns~="md:4"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 3) / 4);
    }
    .rp-carousel[data-columns~="md:5"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 4) / 5);
    }
    .rp-carousel[data-columns~="md:6"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 5) / 6);
    }
  }
  @media (min-width: 64rem) {
    .rp-carousel[data-columns~="lg:1"] {
      --_item-size: 100%;
    }
    .rp-carousel[data-columns~="lg:2"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 1) / 2);
    }
    .rp-carousel[data-columns~="lg:3"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 2) / 3);
    }
    .rp-carousel[data-columns~="lg:4"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 3) / 4);
    }
    .rp-carousel[data-columns~="lg:5"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 4) / 5);
    }
    .rp-carousel[data-columns~="lg:6"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 5) / 6);
    }
  }
  @media (min-width: 80rem) {
    .rp-carousel[data-columns~="xl:1"] {
      --_item-size: 100%;
    }
    .rp-carousel[data-columns~="xl:2"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 1) / 2);
    }
    .rp-carousel[data-columns~="xl:3"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 2) / 3);
    }
    .rp-carousel[data-columns~="xl:4"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 3) / 4);
    }
    .rp-carousel[data-columns~="xl:5"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 4) / 5);
    }
    .rp-carousel[data-columns~="xl:6"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 5) / 6);
    }
  }
  @media (min-width: 96rem) {
    .rp-carousel[data-columns~="2xl:1"] {
      --_item-size: 100%;
    }
    .rp-carousel[data-columns~="2xl:2"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 1) / 2);
    }
    .rp-carousel[data-columns~="2xl:3"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 2) / 3);
    }
    .rp-carousel[data-columns~="2xl:4"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 3) / 4);
    }
    .rp-carousel[data-columns~="2xl:5"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 4) / 5);
    }
    .rp-carousel[data-columns~="2xl:6"] {
      --_item-size: calc((100% - var(--rp-carousel-gap) * 5) / 6);
    }
  }
}
```

### Host notes

- HTML: copy the contract. Load `ripple.js` or `ripple.elements.js`.
- React: `Carousel` and `CarouselItem` in `carousel.tsx`, hand-written below the generated header region (D-072), pattern of Dialog in `06-bindings.md` 6.6. The file starts with `"use client"` (it calls a hook, R-14). `Carousel` uses `useElement(ref, { events: { indexchange } })` for `onIndexChange`; there is no controlled prop (D-036). `suppressHydrationWarning` on `rp-carousel` and on both buttons (their `disabled` is element-written state, R-6). The buttons are rendered with constant props (R-11): `disabled` is `true` on prev and absent on next for the lifetime of the component. Icons: `<Icon name="chevron-left" />` and `<Icon name="chevron-right" />`. Default strings in TSX: `previousLabel = "Previous"`, `nextLabel = "Next"`.
- Remix: generated. Prints `data-rmx-key="<id>"` on `rp-carousel` (the `id` is required, G-11) and `data-rmx-preserve-attrs="disabled"` on both buttons. No callback.
- Liquid: two block files, generated: `carousel`, `carousel-item`. Schema settings: none (`columns` is a responsive string param, L-16). Schema label keys (G-8): `t:ripple.carousel.name`, `t:ripple.carousel.item_name`. `{{ attributes }}` is printed last (G-13). Locale keys for strings the component prints: `ripple.carousel.previous` (English: `Previous`), `ripple.carousel.next` (English: `Next`). The icons are printed with `{% render 'rp-icon', name: 'chevron-left' %}` and `{% render 'rp-icon', name: 'chevron-right' %}`.

```tsx
import type { RippleProduct } from "<pkg>";
import { Carousel, CarouselItem } from "./carousel";
import { ProductCard } from "./product-card";

export function Featured({ products }: { products: RippleProduct[] }) {
  return (
    <Carousel id="featured" ariaLabel="Featured products" columns="2 md:4">
      {products.map((product) => (
        <CarouselItem key={product.id}>
          <ProductCard product={product} />
        </CarouselItem>
      ))}
    </Carousel>
  );
}
```

```liquid
{% block 'carousel', id: 'featured', aria_label: 'Featured products', columns: '2 md:4' %}
  {% for product in collection.products limit: 8 %}
    {% block 'carousel-item' %}
      {% block 'product-card', product: product %}{% endblock %}
    {% endblock %}
  {% endfor %}
{% endblock %}
```

`blocks/carousel.liquid` between `{% doc %}` and `{% schema %}`, complete:

```liquid
{%- liquid
  if previous_label == blank
    assign previous_label = 'ripple.carousel.previous' | t
  endif
  if next_label == blank
    assign next_label = 'ripple.carousel.next' | t
  endif
-%}
<rp-carousel class="rp-carousel {{ class | escape }}" id="{{ id | escape }}" {% if columns != blank %}data-columns="{{ columns | escape }}"{% endif %} role="group" aria-roledescription="carousel" aria-label="{{ aria_label | escape }}" data-slot="rp-carousel" {{ attributes }}>
  <button class="rp-carousel-control" type="button" disabled aria-controls="{{ id | escape }}-list" aria-label="{{ previous_label | escape }}" data-rp-part="prev" data-rp-js="inflow">{% render 'rp-icon', name: 'chevron-left' %}</button>
  <ul class="rp-carousel-viewport" id="{{ id | escape }}-list" tabindex="0" data-rp-part="viewport">{{ content }}</ul>
  <button class="rp-carousel-control" type="button" aria-controls="{{ id | escape }}-list" aria-label="{{ next_label | escape }}" data-rp-part="next" data-rp-js="inflow">{% render 'rp-icon', name: 'chevron-right' %}</button>
</rp-carousel>
```

### Commerce

None. ProductGallery and FeaturedCollection with `layout="carousel"` compose this contract and are specified in `11-components-commerce.md`.

### Agent surface

`bridge`. Bridge component: `rp-carousel`. Actions: `next`, `previous` (no arguments), `goTo` (argument: 0-based index). Confirm: none. Secret: none. Every item is in the DOM and in the accessibility tree at all times, so an agent can read and activate item content without paging.

### Checker rules

- RP104: `id` or `ariaLabel` missing on `Carousel`.
- RP101, RP103: a `columns` token outside `1` to `6`, or a malformed responsive value.
- RP113 with these manifest `rules[]` entries:
  - `carousel-needs-label`: kind `requires-attribute`, selector `rp-carousel`, target `aria-label` (an attribute name). Message: "A Carousel has no accessible name." Fix: "Pass aria_label (TSX: ariaLabel)."
  - `carousel-needs-viewport`: kind `requires-descendant`, selector `rp-carousel`, target `[data-rp-part="viewport"][tabindex="0"]`. Message: "A Carousel has no focusable viewport, so rp-carousel has nothing to scroll." Fix: "Use the Carousel component; do not hand-write its inner markup."
  - `carousel-one-viewport`: kind `max-count`, selector `rp-carousel > [data-rp-part="viewport"]`, count `1`. Message: "A Carousel has more than one viewport." Fix: "Keep one."
  - `carousel-item-in-viewport`: kind `requires-ancestor`, selector `.rp-carousel-item`, target `.rp-carousel-viewport`. Message: "A carousel-item is outside a Carousel." Fix: "Move it inside a carousel block."
  - `carousel-controls-outside-viewport`: kind `forbids-ancestor`, selector `.rp-carousel-control`, target `.rp-carousel-viewport`. Message: "A carousel button is inside the scrolling list." Fix: "Use the Carousel component; it prints the buttons outside the list."
  - `carousel-not-nested`: kind `forbids-ancestor`, selector `rp-carousel`, target `.rp-carousel-item`. Message: "A Carousel is inside the item of another Carousel." Fix: "Use one Carousel, or a Grid inside the item."
- RP114: the viewport id MUST equal `<carousel id>-list`; both buttons' `aria-controls` MUST name it.
- RP204: a Carousel root inside `a[href]` or `button`.
- Fixture lint `a-4`: `aria-hidden` or `inert` on an item.

### Acceptance tests

1. T2: fixtures `default`, `responsive`, `escaping`, `class` are canonical-equal in `html`, `react`, `remix`, `liquid`.
2. T3: with fixture `responsive` at viewport 1000 by 700 and each item 300 px high (three items, four columns: everything fits), the mutation records inside the root after upgrade are exactly one: `disabled` added on the next button. With eight items: zero records.
3. T3: the boxes of both buttons and of the viewport are identical before and after upgrade; before upgrade both buttons have computed `visibility: hidden`, after upgrade `visible`.
4. T5 (eight items, `columns="2 md:4"`, viewport 1000 by 700): a click on Next scrolls the viewport so that `api.getIndex()` is 4; exactly one `indexchange` with `detail.value === 4` and `detail.reason === "next-press"`; the prev button has no `disabled`. A second click makes the next button `disabled`. A click on Previous dispatches `indexchange` with reason `previous-press`.
5. T5: `viewport.scrollTo({ left: viewport.scrollWidth })` from the test dispatches `indexchange` with reason `scroll` and sets `disabled` on the next button.
6. T5: `api.goTo(2)` results in `api.getIndex() === 2` and `indexchange` with reason `imperative`; setting `element.index = 0` scrolls to the start and dispatches no event.
7. T5 (CSS), viewport 1000 by 700, default tokens, `columns="2 md:4"`: the viewport box is left 44, width 912; each item is 216 px wide; consecutive items are 16 px apart; `scrollWidth` is greater than `clientWidth` with eight items. At viewport 600 by 700 each item is 248 px wide (two columns).
8. T5 (CSS), `<html dir="rtl">`, viewport 600 by 700: the first item's right edge equals the viewport's right edge (556); a click on Next makes `viewport.scrollLeft` negative; the computed `scale` of both buttons is `-1 1`.
9. T5: with focus on the viewport, pressing ArrowRight increases `scrollLeft`.
10. T5 (a11y): the accessibility snapshot has a group named "Featured products" with role description "carousel", containing a button "Previous" (disabled), a list with eight items, and a button "Next".
11. T6 (JavaScript disabled): both buttons have computed `visibility: hidden`; `viewport.scrollWidth > viewport.clientWidth`; after `page.mouse.wheel(300, 0)` over the viewport, `scrollLeft` is greater than 0 and equals an item's offset (snapped).
12. T4 (React): hydration of `default` logs no warning in both script orders; `onIndexChange` is called with `(4, detail)` after test 4's first click.
13. T4 (Remix): after a click on Next, a morph navigation to a URL that renders the same Carousel with unchanged server HTML and the same `id` leaves the prev button without `disabled`, the scroll position unchanged, and the `rp-carousel` element the same object (`06-bindings.md` Q-15).
14. T9: tests 4, 5 and 8 pass in WebKit and Gecko.

### Evidence and UNVERIFIED

- Evidence: `00-decisions.md` D-016, D-019, D-023, D-024, D-028, D-034, D-071, D-105; `ripple/docs/04-elements.md` 9.2 (source and behaviour of `rp-carousel`), 10.9, 10.16 C-4, 11.1; `ripple/docs/02-html-contract.md` section 8 (Carousel row); CSS rendered in Chromium 157 in both writing directions (`ripple/docs/research/spikes/components-interactive/css-test.mjs`, `results-css-test.txt`: viewport 44 / 912, items 216 px at 1000 px and 248 px at 600 px, buttons `visibility: hidden` before definition, `scrollWidth` 1376 against `clientWidth` 912).
- UNVERIFIED: `scroll-snap-type: inline` and negative `scrollLeft` in right-to-left documents in WebKit and Gecko (SPIKE-06); focus retention on a button that becomes `disabled`; `scrollbar-width: none` in Safari 16.4 (if unsupported the scrollbar is visible there, which is acceptable and needs no change); root-only `definePrimitive` (SPIKE-04, owned by `04-elements.md`).

### Fallback (SPIKE-04)

When SPIKE-04 finds that a root-only `definePrimitive` does not work, `rp-carousel` is re-implemented on the `RippleElement` base class as specified in `04-elements.md`, "Fallback (SPIKE-04)". The contract, the allow-list, the event, the methods, the CSS and every acceptance test of this section are unchanged.

---
