# Banner

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `banner` |
| Kind | `static` |
| Category | `feedback` |
| Custom elements | none |
| Root element and class | `div` `.rp-banner` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `icon` |
| Milestone | M1 |

### Purpose

A prominent in-page message about the page or a section: an error summary after a form post, a shipping notice, a success confirmation. The server prints it; it does not appear or disappear by script.

- Use when: the message concerns a page, a form as a whole, or a section, and must stay visible.
- Do not use when: the message concerns one control (use FormMessage), is transient feedback for a script action (use `toast()`, `10-components-interactive.md`), or is the site-wide promotional bar (use AnnouncementBar, `12-components-chrome-and-blueprints.md`).

Banner has no dismiss button: dismissing needs JavaScript, and a Banner whose message must stay until the condition is resolved is not dismissible.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Banner` | `blocks/banner.liquid` | `div` | `rp-banner` | none | yes | none |
| icon | none (printed by the root) | none | `svg` | `rp-icon rp-banner-icon` | none | yes (always printed) | none |
| content | none (printed by the root) | none | `div` | `rp-banner-content` | none | yes (always printed) | none |

Nesting rules: the root prints the icon part, then the content part; the caller's children go inside the content part. The icon and content parts are not separate exports.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `variant` | `variant` | enum | `soft solid outline` | `soft` | no | no | `data-variant` |
| `tone` | `tone` | enum | `info success warning destructive neutral` | `info` | no | no | `data-tone`; `role`: `alert` when the tone is `destructive`, `status` for every other tone; and the icon name of the table below |

| `tone` | Embedded Icon `name` | `role` |
|---|---|---|
| `info` | `info` | `status` |
| `success` | `check` | `status` |
| `warning` | `warning` | `status` |
| `destructive` | `warning` | `alert` |
| `neutral` | `info` | `status` |

### Content model

`flow` - Heading, Text, Link, Button, lists. The first Heading or Text states the message.

### HTML contract

Fixture `default` (no props; children `Free shipping on orders over $50.`):

```html
<div class="rp-banner" data-variant="soft" data-tone="info" role="status"><svg class="rp-icon rp-banner-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg><div class="rp-banner-content">Free shipping on orders over $50.</div></div>
```

Fixture `destructive` (`tone="destructive"`, `id="form-errors"`; children `<p class="rp-text" data-variant="body" data-tone="neutral">Your cart could not be updated.</p>`):

```html
<div class="rp-banner" id="form-errors" data-variant="soft" data-tone="destructive" role="alert"><svg class="rp-icon rp-banner-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 4l9 16H3zM12 10v4M12 17h.01"/></svg><div class="rp-banner-content"><p class="rp-text" data-variant="body" data-tone="neutral">Your cart could not be updated.</p></div></div>
```

Fixture `success-solid` (`tone="success"`, `variant="solid"`; children `Thanks for your order.`):

```html
<div class="rp-banner" data-variant="solid" data-tone="success" role="status"><svg class="rp-icon rp-banner-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><div class="rp-banner-content">Thanks for your order.</div></div>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | `Free shipping on orders over $50.` |
| `destructive` | `{ "tone": "destructive", "id": "form-errors" }` | `<p class="rp-text" data-variant="body" data-tone="neutral">Your cart could not be updated.</p>` |
| `success-solid` | `{ "tone": "success", "variant": "solid" }` | `Thanks for your order.` |
| `warning-outline` | `{ "tone": "warning", "variant": "outline" }` | `Only 2 left in stock.` |
| `neutral` | `{ "tone": "neutral" }` | `We are closed on public holidays.` |
| `class` | `{ "class": "custom-a custom-b" }` | `Free shipping on orders over $50.` |
| `invalid-enum-falls-back` | `{ "variant": "bogus" }` (output equals `default`) | `Free shipping on orders over $50.` |
| `invalid-tone-falls-back` | `{ "tone": "bogus" }` (output equals `default`: `data-tone="info"`, icon `info`, `role="status"`) | `Free shipping on orders over $50.` |

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `role` | root | server | always | `alert` for `tone="destructive"`, otherwise `status` |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional: the server prints the Banner in the page that needs it.

### Events, commands and methods

None.

### Accessibility

- Pattern: live region; `checkPattern`: none. `role="alert"` for `destructive`, `role="status"` otherwise. A region that is already in the page at load is not announced by itself; after a failed form post the host SHOULD link the first invalid control from the Banner text.
- Accessible name: not applicable.
- Focus: not focusable. Links and Buttons inside it are in the normal tab order.
- Announcements: none by script.
- The icon is decorative (`aria-hidden="true"`). The text MUST state the kind of message ("Error:", "could not be") and MUST NOT rely on colour or icon.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/banner/banner.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--radius-surface`, `--text-sm`, `--text-sm--line-height`, `--text-lg`, `--color-foreground`, `--color-background`, `--color-info`, `--color-info-foreground`, `--color-success`, `--color-success-foreground`, `--color-warning`, `--color-warning-foreground`, `--color-destructive`, `--color-destructive-foreground`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-banner-padding` | `calc(var(--spacing) * 4)` | padding on all four sides |
| `--rp-banner-gap` | `calc(var(--spacing) * 3)` | gap between icon and content |
| `--rp-banner-radius` | `var(--radius-surface)` | corner radius |

| Modifier selector | Sets |
|---|---|
| `.rp-banner[data-tone="success"]` | `--_tone: var(--color-success); --_on-tone: var(--color-success-foreground); --_tone-text: var(--color-success)` |
| `.rp-banner[data-tone="warning"]` | `--_tone: var(--color-warning); --_on-tone: var(--color-warning-foreground); --_tone-text: var(--color-warning)` |
| `.rp-banner[data-tone="destructive"]` | `--_tone: var(--color-destructive); --_on-tone: var(--color-destructive-foreground); --_tone-text: var(--color-destructive)` |
| `.rp-banner[data-tone="neutral"]` | `--_tone: var(--color-foreground); --_on-tone: var(--color-background); --_tone-text: var(--color-foreground)` |
| `.rp-banner[data-variant="solid"]` | `--_bg: var(--_tone); --_fg: var(--_on-tone); --_border: transparent` |
| `.rp-banner[data-variant="outline"]` | `--_bg: transparent; --_fg: var(--_tone-text); --_border: color-mix(in oklab, var(--_tone-text) 45%, transparent)` |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-banner` | custom properties: the three public properties above; `--_bg: color-mix(in oklab, var(--_tone-text) 12%, transparent)`; `--_fg: var(--_tone-text)`; `--_border: transparent`; `--_tone: var(--color-info)`; `--_on-tone: var(--color-info-foreground)`; `--_tone-text: var(--color-info)`. Declarations: `display: flex; align-items: flex-start; gap: var(--rp-banner-gap); box-sizing: border-box; margin: 0; padding: var(--rp-banner-padding); border: 1px solid var(--_border); border-radius: var(--rp-banner-radius); background-color: var(--_bg); color: var(--_fg); font-size: var(--text-sm); line-height: var(--text-sm--line-height)` |
| PARTS | `.rp-banner-icon` | `flex: none; inline-size: var(--text-lg); block-size: var(--text-lg); margin-block-start: calc((var(--text-sm--line-height) * 1em - var(--text-lg)) / 2)` |
| PARTS | `.rp-banner-content` | `flex: 1 1 0%; min-inline-size: 0` |

`--text-sm--line-height` is a unitless ratio in `tokens.css` (`03-styling-and-tokens.md` section 3.4), so `var(--text-sm--line-height) * 1em` is the line box height; the margin centres the icon on the first text line.

Text and Link components inside the content part keep their own colours. A caller that wants the message in the banner colour writes plain text or passes no `tone` to a `variant="plain"` Link.

### Host notes

- HTML: None.
- React: `export function Banner(props: BannerProps)`; generated. The root renders `<Icon name={iconName} className="rp-banner-icon" />` (`iconName` is the icon chosen from the validated `tone`) then `<div className="rp-banner-content">{children}</div>`.
- Remix: None.
- Liquid: the icon is `{% render 'rp-icon', name: icon_name, class: 'rp-banner-icon' %}` where `icon_name` is assigned with a `case` on the normalised `tone`. `{% block 'banner', tone: 'success' %}<children>{% endblock %}`. Schema settings: `variant`, `tone`. Locale keys: `ripple.banner.name`.

```tsx
{actionData?.error ? (
  <Banner tone="destructive" id="form-errors">
    {actionData.error}
  </Banner>
) : null}
```

```liquid
{% if form.errors %}
  {% block 'banner', tone: 'destructive', id: 'form-errors' %}{{ form.errors | default_errors }}{% endblock %}
{% endif %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4. Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 2: for each tone, the root `role` and the `d` attributes of the icon equal the table under Props and the icon set of section 0.6.
3. Tier 2: every fixture output contains exactly one `svg.rp-icon.rp-banner-icon` and exactly one `div.rp-banner-content`, in that order, as the only children of the root.
4. Tier 5: for each of the 15 pairs of `variant` and `tone`, in `data-scheme="light"` and `data-scheme="dark"`, the contrast ratio between the computed `color` of the root and its effective background is at least 4.5.
5. Tier 5: fixture `default` at 375 px viewport width: the content part's inline size plus the icon's inline size plus the gap equals the root's content-box inline size (0.5 px).

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` section 6.3, section 8.1, D-068 (icons embedded as inline SVG); `ripple/docs/03-styling-and-tokens.md` section 7.5; `ripple/docs/02-html-contract.md` N-3 (part class appended to an embedded root), S-10.
- UNVERIFIED: that `{{ form.errors | default_errors }}` output is acceptable flow content inside the content part in every theme form. It is a caller concern and does not affect the contract.

### Fallback (SPIKE-nn)

None.

---
