# Hero

> Component spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `hero` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none |
| Root element and class | `section` `.rp-hero` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M4 |

### Purpose

A large introductory band: optional full-bleed background image with content (heading, text, buttons) laid over it.

- Use when: opening a home or landing page with one dominant message.
- Do not use when: you need an ordinary content band (use Container) or a product image (use Image or ProductGallery).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Hero` | `blocks/hero.liquid` | `section` | `rp-hero` | none | yes | none |
| media | none (printed by root) | same file | `div` | `rp-hero-media` | none | when `image` is set | none |
| image | none (printed by root) | same file | `img` | `rp-hero-image` | none | when `image` is set | none |
| content | none (printed by root) | same file | `div` | `rp-hero-content` | none | yes | none |

Nesting rules: root contains `media` (when printed) then `content`. `media` contains exactly `image`. Children are the content of `content`. A page SHOULD contain at most one Hero, and it SHOULD be the first element of `<main>` (its image is printed as the page's priority image).

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `image` | `image` | object | `RippleImage`; Liquid: an image drop | none | no | no | the `media` and `image` parts |
| `alt` | `alt` | string | any text | `""` | no | no | `alt` on `image` |
| `size` | `size` | enum | `sm`, `md`, `lg`, `full` | `md` | no | no | `data-size` on root |
| `align` | `align` | enum | `start`, `center`, `end` | `start` | no | no | `data-align` on root |
| `scheme` | `scheme` | enum | `light`, `dark`, project scheme names | none | no | no | `data-scheme` on root; omitted when unset |

When `image` is set the caller SHOULD pass `scheme="dark"` so that text over the image has contrast (the image is darkened by an overlay of `--color-overlay`).

### Content model

`flow` - REQUIRED. Typically a Stack with a Heading (`level` 1), a Text and one or two Buttons.

### HTML contract

Fixture `default` (children: `<h1>Welcome</h1>`):

```html
<section class="rp-hero" data-size="md" data-align="start"><div class="rp-hero-content"><h1>Welcome</h1></div></section>
```

Fixture `image` (`image: { url: "https://cdn.shopify.com/s/files/1/0000/0001/files/hero.jpg", altText: null, width: 2400, height: 1200 }`, `alt: "Model wearing a linen shirt"`, `size: "lg"`, `align: "center"`, `scheme: "dark"`):

```html
<section class="rp-hero" data-size="lg" data-align="center" data-scheme="dark"><div class="rp-hero-media"><img class="rp-hero-image" src="https://cdn.shopify.com/s/files/1/0000/0001/files/hero.jpg?width=1600" srcset="https://cdn.shopify.com/s/files/1/0000/0001/files/hero.jpg?width=800 800w, https://cdn.shopify.com/s/files/1/0000/0001/files/hero.jpg?width=1200 1200w, https://cdn.shopify.com/s/files/1/0000/0001/files/hero.jpg?width=1600 1600w, https://cdn.shopify.com/s/files/1/0000/0001/files/hero.jpg?width=2400 2400w" sizes="100vw" alt="Model wearing a linen shirt" width="2400" height="1200" loading="eager" fetchpriority="high"></div><div class="rp-hero-content"><h1>Welcome</h1></div></section>
```

Rules for the `image` part: `src` is `imageUrl(image.url, { width: 1600 })`; `srcset` is `imageSrcSet(image.url, [800, 1200, 1600, 2400])`; `sizes` is the literal `100vw`; `width` and `height` are intrinsic; `loading="eager"` and `fetchpriority="high"` are always printed. Liquid prints the same with `image_url: width: N`.

Fixture `invalid-enum-falls-back` (`size: "huge"`): equal to `default`.

Fixture `escaping` (`alt: "Say \"hi\" & <go>"` with the image above): `alt="Say &quot;hi&quot; &amp; &lt;go&gt;"`.

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-hero custom-a custom-b`.

Host-owned regions and masks: `{ "select": "img", "op": "attr", "name": "src" }`, `{ "select": "img", "op": "srcset", "name": "srcset" }` (D-049).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-scheme` | root | server | prop `scheme` is set | the scheme name or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None.

### Behaviour without JavaScript

Identical.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| none | none | none | none | none |

### Accessibility

- Pattern: native `<section>` (not a landmark: it has no accessible name); `checkPattern`: none.
- Accessible name: none. The image's `alt` describes it; pass `alt=""` (the default) when the image is decorative.
- Focus: none.
- Announcements: None.

| Key | Action |
|---|---|
| none | none |

Contrast: text over the image MUST meet WCAG 2.2 AA (4.5:1). The overlay guarantees it only together with a dark scheme; the eval visual rubric checks it (`08-agent-kit-and-evals.md`).

### Styling

- File: `components/hero/hero.css` (layer `rp.components`).
- Tokens used: `--color-background`, `--color-foreground`, `--color-overlay`, `--container-page`, `--spacing-gutter`, `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-hero-min-height` | `28rem` | Minimum block size of the root |
| `--rp-hero-padding-block` | `calc(var(--spacing) * 16)` | Block padding of `content` |
| `--rp-hero-content-max-width` | `42rem` | Maximum inline size of the children column |
| `--_align` | `start` | `align-items` and `text-align` of `content` |

| Modifier selector | Sets |
|---|---|
| `.rp-hero[data-size="sm"]` | `--rp-hero-min-height: 20rem` |
| `.rp-hero[data-size="md"]` | `--rp-hero-min-height: 28rem` |
| `.rp-hero[data-size="lg"]` | `--rp-hero-min-height: 36rem` |
| `.rp-hero[data-size="full"]` | `--rp-hero-min-height: 100svh` |
| `.rp-hero[data-align="start"]` | `--_align: start` |
| `.rp-hero[data-align="center"]` | `--_align: center` |
| `.rp-hero[data-align="end"]` | `--_align: end` |

Required rules: root `position: relative; display: grid; min-block-size: var(--rp-hero-min-height); background: var(--color-background); color: var(--color-foreground); overflow: clip`; `media` `position: absolute; inset: 0`; `media::after` `content: ""; position: absolute; inset: 0; background: var(--color-overlay)`; `image` `inline-size: 100%; block-size: 100%; object-fit: cover`; `content` `position: relative; display: flex; flex-direction: column; justify-content: center; align-items: var(--_align); text-align: var(--_align); inline-size: 100%; max-inline-size: var(--container-page); margin-inline: auto; padding: var(--rp-hero-padding-block) var(--spacing-gutter)`; `.rp-hero-content > *` `max-inline-size: var(--rp-hero-content-max-width)`. `data-align` is a UI SDK reserved name; every selector that uses it includes `.rp-hero`. The generated `props.css` rules for `align` are scoped to Stack, Inline and Grid (D-028) and do not match Hero.

### Host notes

- HTML: None.
- React: `export function Hero(props: HeroProps): JSX.Element`. Generated from the contract template, with the `srcset` computed by `imageSrcSet` from `<pkg>` (if the template language cannot express the `srcset` value, the binding is hand-written and MUST pass the fixtures).
- Remix: None.
- Liquid: block `hero`. Schema settings: `size`, `align`, `scheme` (select; three, the maximum of D-038 item 5). Locale keys: `ripple.hero.name`. `{{ attributes }}` is printed LAST in the root's opening tag (D-035). Block name `t:ripple.hero.name`; setting labels `t:ripple.props.<prop name>`, option labels `t:ripple.props.<value>` (D-038).

```tsx
<Hero image={heroImage} size="lg" align="center" scheme="dark">
  <Stack gap="4" align="center">
    <Heading level={1} size="5xl">New season</Heading>
    <Button href="/collections/all" size="lg">Shop now</Button>
  </Stack>
</Hero>
```

```liquid
{% block 'hero', image: collections.frontpage.image, size: 'lg', align: 'center', scheme: 'dark' %}
  {% block 'stack', gap: '4', align: 'center' %}
    {% block 'heading', level: 1, size: '5xl' %}{{ shop.name }}{% endblock %}
    {% block 'button', href: routes.all_products_collection_url, size: 'lg' %}{{ 'ripple.blueprints.home.cta' | t }}{% endblock %}
  {% endblock %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`. Actions: none. Confirm: none. Secret: none.

### Checker rules

- RP203: the image has `alt`, `width`, `height`. RP113 structure rule `hero-once` (warning, not error): more than one `.rp-hero` with an image in a document means two images with `fetchpriority="high"`.

### Acceptance tests

- **AT-1** Tier 2: fixtures `default`, `image`, `invalid-enum-falls-back`, `escaping`, `class` conform in all four hosts with the masks above.
- **AT-2** Tier 5: `size="full"` gives a root height equal to the viewport height (within 1 px) at 375 by 667 and 1280 by 800.
- **AT-3** Tier 5: with `align="center"` the children column is horizontally centred (left and right offsets differ by at most 1 px).
- **AT-4** Tier 5: the image covers the root box exactly (its bounding box equals the root's, within 0.5 px).
- **AT-5** Tier 3: zero mutations when `ripple.js` loads.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/templates/index.liquid` (hero container with background image and LCP preload); `ripple/docs/research/base-theme.md` 3.1 item 5 (image loading decided at call sites; Hero fixes eager loading and priority itself); ledger 6.3 (`scheme` accepted by Hero), D-049, `05-commerce.md` 11.3.
- UNVERIFIED: `100svh` at the browser floor (Chrome 108, Safari 15.4, Firefox 101 by general knowledge; inside the floor if correct). SPIKE-06.

### Fallback (SPIKE-nn)

None.

---
