# Logo

> Component spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `logo` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none |
| Root element and class | `a` `.rp-logo` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `visually-hidden` |
| Milestone | M4 |

### Purpose

The shop's brand mark as a link to the home page: the logo image when one exists, otherwise the shop name as text.

- Use when: showing the brand in the Header, the Footer or a minimal layout (password, gift card).
- Do not use when: showing a content image (use Image) or a text link (use Link).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Logo` | `blocks/logo.liquid` | `a` | `rp-logo` | none | yes | none |
| image | none (printed by root) | same file | `img` | `rp-logo-image` | none | when `image` is set | none |

Nesting rules: with `image`, root contains `image` followed by one VisuallyHidden holding the children. Without `image`, root contains the children directly.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `href` | `href` | url | any URL | TSX: `/`. Liquid: `routes.root_url` | no | no | `href` on root |
| `image` | `image` | object | `RippleImage`; Liquid: an image drop | TSX: none. Liquid: `shop.brand.logo` | no | no | the `image` part |
| `size` | `size` | enum | `sm`, `md`, `lg` | `md` | no | no | `data-size` on root |

### Content model

`text` - the shop name; REQUIRED. It is the visible text when there is no image and the accessible name in both cases.

### HTML contract

Fixture `default` (children: `Mock Shop`):

```html
<a class="rp-logo" href="/" data-size="md">Mock Shop</a>
```

Fixture `image` (`image`: the logo of `shop.logo`, `size: "lg"`, `href: "/fr-ca"`, children: `Mock Shop`):

```html
<a class="rp-logo" href="/fr-ca" data-size="lg"><img class="rp-logo-image" src="https://cdn.shopify.com/s/files/1/0000/0001/files/logo.png?width=400" alt="" width="400" height="100"><span class="rp-visually-hidden">Mock Shop</span></a>
```

Fixture `invalid-enum-falls-back` (`size: "huge"`): equal to `default`.

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-logo custom-a custom-b`.

Rules for the `image` part: `src` is `imageUrl(image.url, { width: 400 })` in TSX and `{{ image | image_url: width: 400 }}` in Liquid; `width` and `height` are the image's intrinsic dimensions; `alt` is always the empty string (the name comes from the VisuallyHidden text); no `loading` attribute (the logo is above the fold; the browser default is eager).

Host-owned regions and masks: `{ "select": "img", "op": "attr", "name": "src" }` (D-049).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| none | none | none | none | none |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None.

### Behaviour without JavaScript

Identical: the link navigates to `href`.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| none | none | none | none | none |

### Accessibility

- Pattern: native `<a>`; `checkPattern`: none.
- Accessible name: the children text (directly, or through VisuallyHidden when the image is shown); required.
- Focus: none.
- Announcements: None.

| Key | Action |
|---|---|
| Enter | Follow the link |

### Styling

- File: `components/logo/logo.css` (layer `rp.components`).
- Tokens used: `--color-foreground`, `--color-ring`, `--font-heading`, `--text-lg`, `--text-xl`, `--text-2xl`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-logo-height` | `2rem` | Block size of the image |
| `--rp-logo-font-size` | `var(--text-xl)` | Font size of the text form |

| Modifier selector | Sets |
|---|---|
| `.rp-logo[data-size="sm"]` | `--rp-logo-height: 1.5rem; --rp-logo-font-size: var(--text-lg)` |
| `.rp-logo[data-size="md"]` | `--rp-logo-height: 2rem; --rp-logo-font-size: var(--text-xl)` |
| `.rp-logo[data-size="lg"]` | `--rp-logo-height: 2.5rem; --rp-logo-font-size: var(--text-2xl)` |

Required rules: root `display: inline-flex; align-items: center; min-block-size: 1.5rem; color: var(--color-foreground); font-family: var(--font-heading); font-size: var(--rp-logo-font-size); font-weight: 600; text-decoration: none`; `image` `block-size: var(--rp-logo-height); inline-size: auto; max-inline-size: 100%`.

### Host notes

- HTML: None.
- React: `export function Logo(props: LogoProps): JSX.Element`. Generated from the contract template.
- Remix: None.
- Liquid: block `logo`; markup in `snippets/rp-logo.liquid` (embedded by Header). In the snippet, `content` is the shop name as TEXT and is printed with `| escape` (an exception to "content is HTML" of rule L-11, needed because Header passes `shop.name`); the block wrapper passes its `{{ content }}` through unchanged, so a template author MUST write only text between the block tags. Schema settings: `size` (select). Locale keys: `ripple.logo.name`. `{{ attributes }}` is printed LAST in the root's opening tag (D-035). Block name `t:ripple.logo.name`; setting labels `t:ripple.props.<prop name>`, option labels `t:ripple.props.<value>` (D-038).

```tsx
<Logo href={shop.url} image={shop.logo ?? undefined}>{shop.name}</Logo>
```

```liquid
{% block 'logo' %}{{ shop.name }}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`. Actions: none. Confirm: none. Secret: none.

### Checker rules

- RP201: the link has an accessible name (children are required). RP203: the image has `alt`, `width`, `height`.

### Acceptance tests

- **AT-1** Tier 2: fixtures `default`, `image`, `invalid-enum-falls-back`, `class` conform in all four hosts (image `src` masked).
- **AT-2** Tier 5: for fixture `image` with `size="lg"` the rendered image height is 40 CSS px and its width keeps the 4:1 ratio.
- **AT-3** Tier 5: the accessible name computed by the browser for fixture `image` is `Mock Shop`.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/blocks/logo.liquid` (image from `shop.brand.logo`, text fallback, `image_url: width: 400`); `05-commerce.md` 11.3 (`imageUrl`).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
