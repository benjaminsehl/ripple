# Rating

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `rating` |
| Kind | `static` |
| Category | `feedback` |
| Custom elements | none |
| Root element and class | `span` `.rp-rating` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A read-only display of an average rating as five stars filled in half-star steps, with an optional review count after it.

- Use when: showing a product's average review score on a card or a product page.
- Do not use when: the shopper sets a rating (that is a RadioGroup with five options inside a review form; Ripple has no rating input), or the product has no reviews (print nothing).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Rating` | `blocks/rating.liquid` | `span` | `rp-rating` | none | yes | none |
| stars | none (printed by the root) | none | `span` | `rp-rating-stars` | none | yes (always printed) | none |

Nesting rules: none. Rating is phrasing content.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `value` | `value` | enum | `0 0.5 1 1.5 2 2.5 3 3.5 4 4.5 5` | `0` | no | no | `data-value` on the root |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` |
| `ariaLabel` | `aria_label` | string | text, for example `4.5 out of 5 stars` | none | yes | no | `aria-label` on the stars part |

`value` is an enumeration, not a number, because the contract template has no arithmetic and the fill is selected by CSS attribute selectors. The caller rounds to the nearest half before passing it:

- TSX: `value` accepts the number or the string; `String(Math.round(n * 2) / 2)` gives a member of the list for `0 <= n <= 5`.
- Liquid: `{% assign v = n | times: 2 | round | divided_by: 2.0 | remove: '.0' %}` (`4.0` becomes `4`, `4.5` stays `4.5`).

A value outside the list prints `data-value="0"` (FC-6).

### Content model

`text` - optional phrasing content printed after the stars: the review count, for example `(128)`. MAY be empty.

### HTML contract

Fixture `default` (`ariaLabel="0 out of 5 stars"`; no children):

```html
<span class="rp-rating" data-value="0" data-size="md"><span class="rp-rating-stars" role="img" aria-label="0 out of 5 stars"></span></span>
```

Fixture `with-count` (`value="4.5"`, `ariaLabel="4.5 out of 5 stars"`; children `(128)`):

```html
<span class="rp-rating" data-value="4.5" data-size="md"><span class="rp-rating-stars" role="img" aria-label="4.5 out of 5 stars"></span>(128)</span>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{ "ariaLabel": "0 out of 5 stars" }` | absent |
| `with-count` | `{ "value": "4.5", "ariaLabel": "4.5 out of 5 stars" }` | `(128)` |
| `small-whole` | `{ "value": "3", "size": "sm", "ariaLabel": "3 out of 5 stars" }` | absent |
| `class` | `{ "ariaLabel": "0 out of 5 stars", "class": "custom-a custom-b" }` | absent |
| `invalid-enum-falls-back` | `{ "value": "4.25", "ariaLabel": "0 out of 5 stars" }` (output equals `default`) | absent |
| `escaping` | `{ "ariaLabel": "Say \"hi\" & <go>" }` | absent |

In addition the generator MUST emit one fixture per value named `value-<value with "." replaced by "-">` (`value-0`, `value-0-5`, `value-1`, `value-1-5`, `value-2`, `value-2-5`, `value-3`, `value-3-5`, `value-4`, `value-4-5`, `value-5`; 11 fixtures) with `ariaLabel` `<value> out of 5 stars`.

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `role` | stars | server | always | `img` |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional: static markup.

### Events, commands and methods

None.

### Accessibility

- Pattern: image with a text alternative (`role="img"` plus `aria-label` on the stars part); `checkPattern`: none.
- Accessible name: `ariaLabel` (required) states the score in words. The count in the children is read after it as text; the caller SHOULD make it self-explanatory with a VisuallyHidden suffix (`(128<span class="rp-visually-hidden"> reviews</span>)`).
- Focus: not focusable. A Rating that links to the reviews is wrapped in a Link by the caller.
- Announcements: none.
- The filled stars use the current text colour and the unfilled stars use the same colour at 25 percent, so the display follows the scheme. In forced-colours mode the stars part is drawn in `CanvasText` and the score remains available as the accessible name.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/rating/rating.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--text-sm`, `--text-base`, `--text-lg`, `--rp-dir`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-rating-size` | `var(--text-base)` | block size of one star; the stars part is five times as wide |
| `--rp-rating-gap` | `calc(var(--spacing) * 1.5)` | gap between the stars and the count |

| Modifier selector | Sets |
|---|---|
| `.rp-rating[data-value="0.5"]` | `--_fill: 10%` |
| `.rp-rating[data-value="1"]` | `--_fill: 20%` |
| `.rp-rating[data-value="1.5"]` | `--_fill: 30%` |
| `.rp-rating[data-value="2"]` | `--_fill: 40%` |
| `.rp-rating[data-value="2.5"]` | `--_fill: 50%` |
| `.rp-rating[data-value="3"]` | `--_fill: 60%` |
| `.rp-rating[data-value="3.5"]` | `--_fill: 70%` |
| `.rp-rating[data-value="4"]` | `--_fill: 80%` |
| `.rp-rating[data-value="4.5"]` | `--_fill: 90%` |
| `.rp-rating[data-value="5"]` | `--_fill: 100%` |
| `.rp-rating[data-size="sm"]` | `--rp-rating-size: var(--text-sm)` |
| `.rp-rating[data-size="lg"]` | `--rp-rating-size: var(--text-lg)` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-rating` | custom properties: the two public properties above; `--_fill: 0%`. Declarations: `display: inline-flex; align-items: center; gap: var(--rp-rating-gap); font-size: var(--rp-rating-size); line-height: 1; vertical-align: middle` |
| PARTS | `.rp-rating-stars` | `display: inline-block; flex: none; inline-size: 5em; block-size: 1em; background-image: linear-gradient(calc(90deg * var(--rp-dir)), currentColor var(--_fill), color-mix(in oklab, currentColor 25%, transparent) var(--_fill)); mask-image: url("<STAR>"); mask-size: 20% 100%; mask-repeat: repeat-x; mask-position: 0 0` |
| ENVIRONMENT | `.rp-rating-stars` (inside `@media (forced-colors: active)`) | `forced-color-adjust: none; background-image: linear-gradient(calc(90deg * var(--rp-dir)), CanvasText var(--_fill), GrayText var(--_fill))` |

`<STAR>` MUST be exactly this data URI (one line; a solid star in a 24 by 24 box; no colour is named because the default SVG fill is used only as mask alpha):

```text
data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.2-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9z'/%3E%3C/svg%3E
```

Notes:

1. The gradient angle `calc(90deg * var(--rp-dir))` is `90deg` (fill grows from the left) in left-to-right and `-90deg` (fill grows from the right) in right-to-left, so the stars fill from the inline start. The mask is symmetric, so `mask-position` needs no mirroring.
2. The unprefixed `mask-*` properties are used. No `-webkit-mask-*` duplicate is written (`03-styling-and-tokens.md` section 12, browser floor).
3. The count text takes the font size of the root (`--rp-rating-size`). A caller that wants a different count size wraps the count in Text.

### Host notes

- HTML: None.
- React: `export function Rating(props: RatingProps)`; generated; `value?: number | RatingValue` where `RatingValue` is the string union of the Values column; the binding prints `String(value)`.
- Remix: None.
- Liquid: `{% block 'rating', value: v, aria_label: label %}({{ count }}){% endblock %}`. Schema settings: `size` (`value` is data, not a merchant setting, and MUST NOT be a schema setting although it is an enum with a default). Locale keys: `ripple.rating.name`.

```tsx
<Rating value={Math.round(avg * 2) / 2} ariaLabel={`${avg.toFixed(1)} out of 5 stars`}>
  ({count})
</Rating>
```

```liquid
{% assign avg = product.metafields.reviews.rating.value.rating %}
{% assign v = avg | times: 2 | round | divided_by: 2.0 | remove: '.0' %}
{% capture label %}{{ 'products.rating_label' | t: rating: avg }}{% endcapture %}
{% block 'rating', value: v, aria_label: label %}({{ product.metafields.reviews.rating_count }}){% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4 (RP101 reports a literal `value` outside the list; RP104 reports a missing `ariaLabel`). Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: for each `value-*` fixture, the computed `--_fill` on the root equals `value * 20` percent, and the stars part computes inline size 80 px and block size 16 px at default dials (`size="md"`).
3. Tier 5: screenshot of fixture `with-count`: sampling the stars part on its vertical centre line, the pixel at 50 percent of the width of the fifth star's left half is opaque in the full colour and the pixel at the centre of its right half has lower alpha. Repeated inside `dir="rtl"`, the result is mirrored.
4. Tier 3: the accessibility snapshot of fixture `with-count` contains an image named `4.5 out of 5 stars` followed by the text `(128)`.
5. Tier 2: the React host given `value={4.5}` (number) and the Liquid host given `value: '4.5'` print the same `data-value="4.5"`; both given `4.25` print `data-value="0"`.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` section 8.1 (Rating), section 4.3 (enum props render as `data-<prop>`); `ripple/docs/03-styling-and-tokens.md` section 10 (`--rp-dir` for physical values), CSS-12 (`currentColor`, `color-mix()`, system colours in forced-colours media), CSS-06.
- Accepted by the CSS linter (D-105 item 2): a data-URI `mask-image`.
- UNVERIFIED: the Liquid float formatting assumed by `remove: '.0'` (that `8 | divided_by: 2.0` prints `4.0`); acceptance test 5 does not depend on it because it passes strings. UNVERIFIED: the metafield path in the Liquid example (example only).

### Fallback (SPIKE-06)

If the browser-floor spike of `03-styling-and-tokens.md` section 12 finds a floor browser without unprefixed `mask-image`, add the three `-webkit-mask-image`, `-webkit-mask-size`, `-webkit-mask-repeat` declarations before the unprefixed ones in the stars part rule, with the same values.

---
