# RichText

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `rich-text` |
| Kind | `static` |
| Category | `typography` |
| Custom elements | none |
| Root element and class | `div` `.rp-rich-text` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

A wrapper that styles HTML Ripple did not author: product descriptions, page and article bodies, policy text. It replaces the cut ArticleBody component and the base theme's `richtext` block.

- Use when: printing an HTML field from Shopify (`descriptionHtml`, `product.description`, `page.content`, `article.content`).
- Do not use when: the content is written in the template (use Heading, Text, Link).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `RichText` | `blocks/rich-text.liquid` | `div` | `rp-rich-text` | none | yes | none |

Nesting rules: a RichText MUST NOT contain Ripple components; its content is plain HTML. A RichText MUST NOT be nested in another RichText.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `html` | `html` | string | an HTML fragment | none | no | no | the root's inner HTML, printed RAW (not escaped). When `html` is set, children are ignored |
| `size` | `size` | enum | `sm base lg` | `base` | no | no | `data-size` |

`html` MUST come from a trusted source (Shopify HTML fields are sanitised by the platform). It MUST NOT be built from shopper input.

### Content model

`flow` - when `html` is unset, the children are the content: plain HTML elements (`p`, `h1` to `h6`, `ul`, `ol`, `li`, `a`, `blockquote`, `img`, `table`, `pre`, `code`, `hr`, `strong`, `em`).

### HTML contract

Fixture `default` (no props; children `<p>Soft linen, cut for a relaxed fit.</p>`):

```html
<div class="rp-rich-text" data-size="base"><p>Soft linen, cut for a relaxed fit.</p></div>
```

Fixture `html` (`html="<h2>Care</h2><ul><li>Machine wash cold</li></ul>"`, `size="sm"`; no children):

```html
<div class="rp-rich-text" data-size="sm"><h2>Care</h2><ul><li>Machine wash cold</li></ul></div>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | `<p>Soft linen, cut for a relaxed fit.</p>` |
| `html` | `{ "html": "<h2>Care</h2><ul><li>Machine wash cold</li></ul>", "size": "sm" }` | absent |
| `large` | `{ "size": "lg" }` | `<p>Soft linen.</p><p>Made in Portugal.</p>` |
| `class` | `{ "class": "custom-a custom-b" }` | `<p>Soft linen, cut for a relaxed fit.</p>` |
| `invalid-enum-falls-back` | `{ "size": "bogus" }` (output `data-size="base"`) | `<p>Soft linen, cut for a relaxed fit.</p>` |

The `escaping` fixture does not apply: `html` is not rendered as an attribute.

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

- Pattern: native HTML; `checkPattern`: none. Heading levels inside the HTML are the author's; the component does not change them. Links inside are underlined so that they are distinguishable without colour.
- Accessible name: not applicable.
- Focus: links inside are focusable natively.
- Announcements: None.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/rich-text/rich-text.css` (layer `rp.components`). All descendant rules use `.rp-rich-text :where(<tags>)` (specificity (0,1,0)), the form `03-styling-and-tokens.md` CSS-03 allows.
- Tokens used: `--text-sm`, `--text-base`, `--text-lg` and line heights, `--font-heading`, `--rp-heading-weight`, `--color-link`, `--color-border`, `--color-muted-foreground`, `--radius-md`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-rich-text-size` | `var(--text-base)` | font size |
| `--rp-rich-text-line-height` | `var(--text-base--line-height)` | line height |
| `--rp-rich-text-gap` | `1em` | space after block elements |

| Modifier selector | Sets |
|---|---|
| `.rp-rich-text[data-size="sm"]` | `--rp-rich-text-size: var(--text-sm); --rp-rich-text-line-height: var(--text-sm--line-height)` |
| `.rp-rich-text[data-size="lg"]` | `--rp-rich-text-size: var(--text-lg); --rp-rich-text-line-height: var(--text-lg--line-height)` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-rich-text` | `font-size: var(--rp-rich-text-size); line-height: var(--rp-rich-text-line-height); overflow-wrap: break-word` |
| PARTS | `.rp-rich-text :where(p, ul, ol, blockquote, pre, table, figure, hr)` | `margin-block: 0 var(--rp-rich-text-gap); margin-inline: 0` |
| PARTS | `.rp-rich-text :where(h1, h2, h3, h4, h5, h6)` | `margin-block: 1.5em 0.5em; margin-inline: 0; font-family: var(--font-heading); font-weight: var(--rp-heading-weight); line-height: 1.25` |
| PARTS | `.rp-rich-text :where(h1, h2)` | `font-size: 1.5em` |
| PARTS | `.rp-rich-text :where(h3)` | `font-size: 1.25em` |
| PARTS | `.rp-rich-text :where(h4, h5, h6)` | `font-size: 1em` |
| PARTS | `.rp-rich-text :where(ul, ol)` | `padding-inline-start: 1.5em` |
| PARTS | `.rp-rich-text :where(ul)` | `list-style-type: disc` |
| PARTS | `.rp-rich-text :where(ol)` | `list-style-type: decimal` |
| PARTS | `.rp-rich-text :where(li)` | `margin-block: 0.25em` |
| PARTS | `.rp-rich-text :where(a)` | `color: var(--color-link); text-decoration-line: underline; text-underline-offset: 0.2em` |
| PARTS | `.rp-rich-text :where(blockquote)` | `padding-inline-start: 1em; border-inline-start: 2px solid var(--color-border); color: var(--color-muted-foreground)` |
| PARTS | `.rp-rich-text :where(img, video, iframe)` | `max-inline-size: 100%; block-size: auto; border-radius: var(--radius-md)` |
| PARTS | `.rp-rich-text :where(table)` | `inline-size: 100%; border-collapse: collapse` |
| PARTS | `.rp-rich-text :where(th, td)` | `padding-block: 0.5em; padding-inline: 0.75em; border-block-end: 1px solid var(--color-border); text-align: start` |
| PARTS | `.rp-rich-text :where(hr)` | `block-size: 1px; border: 0; background-color: var(--color-border)` |
| PARTS | `.rp-rich-text :where(pre)` | `overflow-x: auto` |
| PARTS | `.rp-rich-text :where(code)` | `font-family: ui-monospace, monospace; font-size: 0.9em` |
| PARTS | `.rp-rich-text :where(:first-child)` | `margin-block-start: 0` |
| PARTS | `.rp-rich-text :where(:last-child)` | `margin-block-end: 0` |

The two last rows MUST be the last rules of file section 2 (they override the margins above at equal specificity).

### Host notes

- HTML: None.
- React: `export function RichText(props: RichTextProps)`; when `html` is set the root is rendered with `dangerouslySetInnerHTML={{ __html: html }}` and no children; otherwise with `children`.
- Remix: when `html` is set the root is rendered with `innerHTML={unsafeHTML(html)}` (D-034 item 6); otherwise with `children`.
- Liquid: `{{ html }}` is printed without `escape` when `html != blank`; otherwise `{{ content }}`. `{% block 'rich-text', html: product.description %}{% endblock %}`. Schema settings: `size`. Locale keys: `ripple.rich-text.name`.

```tsx
<RichText html={product.descriptionHtml} />
```

```liquid
{% block 'rich-text', html: product.description %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4. Manifest `rules[]`: `rich-text-plain-html` (RP113, error): an element with a class starting `rp-` MUST NOT be a descendant of `.rp-rich-text`.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 2: fixture `html` prints the fragment unescaped in all four hosts (the output contains an `h2` element, not the text `&lt;h2&gt;`).
3. Tier 5: in fixture `large` the first `<p>` computes `margin-block-start` 0 and `margin-block-end` equal to its own `font-size`; the last `<p>` computes `margin-block-end` 0; `font-size` equals the computed `--text-lg`.
4. Tier 5: an `<a>` inside the root computes `text-decoration-line: underline` and `color` equal to the computed `--color-link`.
5. Tier 5 (A-13 exemption): CA-8 skips elements inside `.rp-rich-text`.

### Evidence and UNVERIFIED

- Evidence: `ripple/theme/blocks/richtext.liquid`; `ripple/docs/00-decisions.md` D-034 item 6, D-035 item 5, section 8.7 (ArticleBody is RichText); `remix/packages/component` (`innerHTML`; cited in `ripple/docs/research/remix-3.md`).
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
