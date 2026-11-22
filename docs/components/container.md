# Container

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `container` |
| Kind | `static` |
| Category | `layout` |
| Custom elements | none |
| Root element and class | `div` (or the `as` tag) `.rp-container` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A full-width band whose content is centred and limited to the page or prose width. It owns the page gutter, vertical band padding and the colour scheme of a band. It replaces the cut Section component.

- Use when: starting any top-level band of a page (hero, product area, footer band).
- Do not use when: arranging children (use Stack, Inline or Grid inside it), or inside another Container.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Container` | `blocks/container.liquid` | `div`, `section`, `ul`, `ol`, `nav`, `header`, `footer`, `main`, `aside`, `article`, `form` | `rp-container` | none | yes | none |

Nesting rules: a Container MUST NOT be a descendant of another Container (the gutter would be applied twice). The root is always a block that fills the inline size of its parent.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `as` | `as` | enum | `div section ul ol nav header footer main aside article form` | `div` | no | no | the root tag; no attribute. When the tag is `ul` or `ol`, the root also gets `role="list"` |
| `width` | `width` | enum | `page prose full` | `page` | no | no | `data-width` |
| `scheme` | `scheme` | string | `light`, `dark`, or a project scheme name matching `^[a-z][a-z0-9-]*$` | none (omitted) | no | no | `data-scheme` |
| `p` | `p` | scale | space steps | none (omitted) | no | yes | `data-p` |
| `px` | `px` | scale | space steps | none (omitted) | no | yes | `data-px` |
| `py` | `py` | scale | space steps | none (omitted) | no | yes | `data-py` |
| `pt` | `pt` | scale | space steps | none (omitted) | no | yes | `data-pt` |
| `pb` | `pb` | scale | space steps | none (omitted) | no | yes | `data-pb` |

`p` and `px` replace the gutter and the centring (they set `padding-inline`). They SHOULD be used only with `width="full"`. Vertical band padding is `py`, `pt`, `pb`.

### Content model

`flow` - any flow content.

### HTML contract

Fixture `default` (no props; children `<p>Content</p>`):

```html
<div class="rp-container" data-width="page"><p>Content</p></div>
```

Fixture `band` (`as="section"`, `width="prose"`, `scheme="dark"`, `py="12 md:20"`; children `<p>Content</p>`):

```html
<section class="rp-container" data-width="prose" data-scheme="dark" data-py="12 md:20"><p>Content</p></section>
```

Fixture `list` (`as="ul"`, `width="full"`; children `<li>One</li>`):

```html
<ul class="rp-container" data-width="full" role="list"><li>One</li></ul>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | `<p>Content</p>` |
| `band` | `{ "as": "section", "width": "prose", "scheme": "dark", "py": "12 md:20" }` | `<p>Content</p>` |
| `list` | `{ "as": "ul", "width": "full" }` | `<li>One</li>` |
| `padding` | `{ "width": "full", "p": "4", "px": "6", "pt": "2", "pb": "8" }` | `<p>Content</p>` |
| `class` | `{ "class": "custom-a custom-b" }` | `<p>Content</p>` |
| `invalid-enum-falls-back` | `{ "as": "bogus" }` (output tag is `div`) | `<p>Content</p>` |
| `responsive` | `{ "py": "8 lg:16" }` | `<p>Content</p>` |
| `escaping` | `{ "scheme": "Say \"hi\" & <go>" }` | `<p>Content</p>` |

Host-owned regions and masks: None.

### State and attributes

None.

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Identical to the behaviour with JavaScript: static markup styled by CSS.

### Events, commands and methods

None.

### Accessibility

- Pattern: native element chosen by `as`; `checkPattern`: none.
- Accessible name: not required. When `as` is `nav`, `section` or `aside` the caller SHOULD pass `aria-label` through rest props (`attributes` in Liquid).
- Focus: not focusable.
- Announcements: None.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/container/container.css` (layer `rp.components`).
- Tokens used: `--container-page`, `--container-prose`, `--spacing-gutter`. Scheme painting comes from `base.css` (`[data-scheme]`).

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-container-max` | `var(--container-page)` | maximum inline size of the content box |
| `--rp-container-gutter` | `var(--spacing-gutter)` | minimum inline padding |

| Modifier selector | Sets |
|---|---|
| `.rp-container[data-width="prose"]` | `--rp-container-max: var(--container-prose)` |
| `.rp-container[data-width="full"]` | `--rp-container-max: 100%` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-container` | `display: block; inline-size: 100%; margin: 0; padding-block: 0; padding-inline: max(var(--rp-container-gutter), calc((100% - var(--rp-container-max)) / 2)); border: 0; list-style: none` |

Values a test can assert (default dials, 16 px root, parent 1600 px wide): `width="page"` content box is 1280 px wide and centred; `width="prose"` content box is 672 px; `width="full"` content box is 1568 px (gutter 16 px each side). In a 375 px parent every width gives a 343 px content box.

### Host notes

- HTML: None.
- React: `export function Container(props: ContainerProps)`; generated; no hooks.
- Remix: None.
- Liquid: `{% block 'container', width: 'page', py: '12 md:20' %}<children>{% endblock %}`. Schema settings: `width`. Locale keys: `ripple.container.name`.

```tsx
<Container as="section" scheme="dark" py="12 md:20">
  <Heading level={1}>New arrivals</Heading>
</Container>
```

```liquid
{% block 'container', as: 'section', scheme: 'dark', py: '12 md:20' %}
  {% block 'heading', level: 1 %}New arrivals{% endblock %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4. Manifest `rules[]` (reported by RP113): `container-no-nesting`: kind `forbids-ancestor`, selector `:scope`, target `.rp-container`. Message: "A Container is nested inside another Container." Fix: "Remove the inner Container or replace it with Stack."

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 5: the asserted widths under "Styling" hold at parent widths 375 px and 1600 px.
3. Tier 5: fixture `band` inside `<body>` computes `background-color` equal to the computed `--color-background` of the `dark` scheme and a different value from the page background.
4. Tier 5: fixture `responsive` computes `padding-block-start` 32 px at 375 px viewport width and 64 px at 1280 px.
5. Tier 2: fixture `invalid-enum-falls-back` output root tag is `div` in all four hosts.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/blocks/container.liquid`; `ripple/docs/research/styling-spike.md` (tokens, schemes); `ripple/docs/00-decisions.md` sections 6.2, 6.3, 8.7 (Section merged into Container).
- UNVERIFIED: whether Shopify accepts `as` as a block argument name (SPIKE-02; D-038 as amended, item d). The default path uses the Liquid param `as`; the fallback is below.

### Fallback (SPIKE-02)

If SPIKE-02 finds that `as` is not a legal block argument name, the Liquid param is renamed `tag` through the manifest key `prop.liquid.name` (D-038 as amended; `06-bindings.md` section 8.5). The TSX prop stays `as`. Values, default, contract and fixtures do not change; Liquid calls become `{% block '<id>', tag: 'ul' %}`.

---
