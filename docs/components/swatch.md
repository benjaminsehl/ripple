# Swatch

> Component spec. Group doc: [11-components-commerce.md](../11-components-commerce.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `swatch` |
| Kind | `static` |
| Category | `product` |
| Custom elements | none |
| Root element and class | `span` `.rp-swatch` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M3 |

### Purpose

A small decorative sample of a colour or an image, used inside option values and filter values.

- Use when: visualising a colour or pattern next to (or instead of) its text label.
- Do not use when: the sample is the only label; the surrounding control MUST carry the text.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Swatch` | `blocks/swatch.liquid` + `snippets/rp-swatch.liquid` | `span` | `rp-swatch` | none | yes | none |
| image | printed by root | same | `img` | `rp-swatch-image` | none | when `image` is set | none |

Nesting rules: the image is the only possible child. A Swatch has no text and no interactive content.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `fill` | `fill` | string | a CSS colour (for example `#1d4ed8`) | none | no | no | `style="--rp-swatch-fill:<value>"` on root |
| `image` | `image` | object | `RippleImage` / Liquid image drop | none | no | no | the image part |
| `size` | `size` | enum | `sm md lg` | `md` | no | no | `data-size` |
| `radius` | `radius` | enum | `none md full` | `full` | no | no | `data-radius` |

When both `fill` and `image` are set, both are printed (the image covers the fill). When neither is set, the root is printed with neither `style` nor child. The `style` value MUST be exactly `--rp-swatch-fill:` followed by the escaped value, with no spaces and no trailing semicolon. A `fill` value that contains `;`, `{`, `}`, `<`, `>` or `"` MUST be dropped (treated as unset).

### Content model

`none` - no children.

### HTML contract

Fixture `default` (`fill`: `#1d4ed8`):

```html
<span class="rp-swatch" data-size="md" data-radius="full" aria-hidden="true" style="--rp-swatch-fill:#1d4ed8"></span>
```

Fixture `image` (`image`: `{ "$resource": "image.shirt-front" }`, `size`: `lg`, `radius`: `md`). The resource `image.shirt-front` is added by the Swatch task under `13-testing.md` RS-2 (D-140, D-134 item 13): both sides are the first image of `product.basic` (the constant `shirtFront` of `src/testing/resources.ts`):

```html
<span class="rp-swatch" data-size="lg" data-radius="md" aria-hidden="true"><img class="rp-swatch-image" src="https://cdn.shopify.com/s/files/1/0001/linen-shirt.jpg?width=96" alt="" width="96" height="96" loading="lazy"></span>
```

Further required fixtures: `class`; `invalid-enum-falls-back` (`size`: `huge`; equals `default`); `unsafe-fill` (`fill`: `red;background:url(x)`; the root has no `style` attribute).

Host-owned regions and masks: no host-owned region. Masks (fixture `image`): `{ "select": "img", "op": "attr", "name": "src" }`.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| None. | | | | |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None.

### Behaviour without JavaScript

Identical.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| None. | | | | |

### Accessibility

- Pattern: decorative image; `checkPattern`: none.
- Accessible name: none; the root has `aria-hidden="true"` and the image has `alt=""`.
- Focus: not focusable.
- Announcements: None.

| Key | Action |
|---|---|
| None | |

### Styling

- File: `components/swatch/swatch.css` (layer `rp.components`).
- Tokens used: `--color-border`, `--color-muted`, `--radius-md`, `--spacing`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-swatch-fill` | `var(--color-muted)` | background colour; set inline from data |
| `--rp-swatch-size` | `calc(var(--spacing) * 7)` | inline and block size |
| `--rp-swatch-radius` | `9999px` | corner radius |

| Modifier selector | Sets |
|---|---|
| `.rp-swatch[data-size="sm"]` | `--rp-swatch-size: calc(var(--spacing) * 5)` |
| `.rp-swatch[data-size="md"]` | `--rp-swatch-size: calc(var(--spacing) * 7)` |
| `.rp-swatch[data-size="lg"]` | `--rp-swatch-size: calc(var(--spacing) * 9)` |
| `.rp-swatch[data-radius="none"]` | `--rp-swatch-radius: 0` |
| `.rp-swatch[data-radius="md"]` | `--rp-swatch-radius: var(--radius-md)` |
| `.rp-swatch[data-radius="full"]` | `--rp-swatch-radius: 9999px` |

Required rules: root `display: inline-block; overflow: hidden; background-color: var(--rp-swatch-fill); border: 1px solid var(--color-border)`; image `inline-size: 100%; block-size: 100%; object-fit: cover`. The inline custom property is data, not a colour prop; checker RP116 does not apply because the `style` attribute contains no `color`, `background` or `border-color` declaration.

### Host notes

- Binding paths (D-139): `static` that the template language of `07-manifest-registry-cli.md` 2.3 cannot express (D-072 row 2): no `template`; every fixture is `generated: "hand"`; `html` is generated from the fixture files; the `react`, `remix` and `liquid` files are hand-written with their generated regions. Where a line below says a binding is "generated", this line wins.
- HTML: None.
- React: generated. `Swatch(props: { fill?: string; image?: RippleImage | null; size?: "sm" | "md" | "lg"; radius?: "none" | "md" | "full"; className?: string })`; the style is passed as `style={{ "--rp-swatch-fill": fill } as CSSProperties}`.
- Remix: None.
- Liquid: markup in `snippets/rp-swatch.liquid` (embedded by VariantPicker and FilterGroup). Image: `image | image_url: width: 96`. Schema settings: `size`, `radius`. No locale keys.

```tsx
<Swatch fill="#1d4ed8" size="lg" />
```

```liquid
{% block 'swatch', fill: value.swatch.color, image: value.swatch.image, size: 'lg' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree` (hidden from it by `aria-hidden`); actions: none; confirm: none; secret: none.

### Checker rules

RP101 (`size`, `radius`), RP110. No `rules[]` entry.

### Acceptance tests

1. Tier 2: fixtures `default`, `image`, `class`, `invalid-enum-falls-back`, `unsafe-fill` are canonical-equal in all four hosts.
2. Tier 5: the computed `background-color` of fixture `default` is `rgb(29, 78, 216)`.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/snippets/swatch.liquid` (colour and image swatches, 96 px image slot).
- UNVERIFIED: that React 19 serialises the custom property style exactly as `--rp-swatch-fill:#1d4ed8` (tier 2 decides; if React adds a trailing semicolon, the canonicaliser rule for `style` in [13-testing.md](13-testing.md) MUST strip it on both sides).

### Fallback (SPIKE-nn)

None.

---
