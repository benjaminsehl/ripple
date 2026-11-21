# AnnouncementBar

> Component spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `announcement-bar` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none |
| Root element and class | `div` `.rp-announcement-bar` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M4 |

### Purpose

A full-width band above the Header for one short message (shipping threshold, sale notice), optionally containing a Link.

- Use when: one short site-wide message must be visible on every page.
- Do not use when: the message is the result of an action (use Banner or FormMessage) or is transient (use Toast).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `AnnouncementBar` | `blocks/announcement-bar.liquid` | `div` | `rp-announcement-bar` | none | yes | none |
| inner | none (printed by root) | same file | `p` | `rp-announcement-bar-inner` | none | yes | none |

Nesting rules: `inner` is the only child of root. Children MUST be phrasing content (text, Link, `<strong>`, `<bdi>`); they MUST NOT contain block elements, because `inner` is a `<p>`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `scheme` | `scheme` | enum | `light`, `dark`, project scheme names | none | no | no | `data-scheme` on root; omitted when unset |
| `ariaLabel` | `aria_label` | string | any text | `{ "t": "ripple.announcement-bar.label" }` ("Announcement") | no | no | `aria-label` on root |

### Content model

`text` - phrasing content; REQUIRED (an empty bar MUST NOT be rendered; the caller omits the component when there is no message).

### HTML contract

Fixture `default` (children: `Free shipping over $50`):

```html
<div class="rp-announcement-bar" role="region" aria-label="Announcement"><p class="rp-announcement-bar-inner">Free shipping over $50</p></div>
```

Fixture `scheme` (`scheme: "dark"`):

```html
<div class="rp-announcement-bar" role="region" aria-label="Announcement" data-scheme="dark"><p class="rp-announcement-bar-inner">Free shipping over $50</p></div>
```

Fixture `escaping` (`ariaLabel: "Say \"hi\" & <go>"`):

```html
<div class="rp-announcement-bar" role="region" aria-label="Say &quot;hi&quot; &amp; &lt;go&gt;"><p class="rp-announcement-bar-inner">Free shipping over $50</p></div>
```

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-announcement-bar custom-a custom-b`.

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `data-scheme` | root | server | prop `scheme` is set | the scheme name or absent |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None. There is no dismiss control in V1 (a dismiss button would do nothing without JS and its state would need storage).

### Behaviour without JavaScript

Identical.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| none | none | none | none | none |

### Accessibility

- Pattern: a named `region` landmark (`role="region"` with `aria-label`); `checkPattern`: none. `role="region"` is listed here as required by rule A-1 of `02-html-contract.md`.
- Accessible name: `aria-label` from `ariaLabel`; always printed.
- Focus: none.
- Announcements: None. It is not a live region.

| Key | Action |
|---|---|
| Tab | Moves to a Link inside the message, when there is one |

### Styling

- File: `components/announcement-bar/announcement-bar.css` (layer `rp.components`).
- Tokens used: `--color-primary`, `--color-primary-foreground`, `--spacing`, `--spacing-gutter`, `--text-sm`, `--container-page`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-announcement-bar-padding-block` | `calc(var(--spacing) * 2)` | Block padding |
| `--_bg` | `var(--color-primary)` | Background (tone slot) |
| `--_fg` | `var(--color-primary-foreground)` | Text colour (tone slot) |
| `--_border` | `transparent` | Border colour (tone slot) |

| Modifier selector | Sets |
|---|---|
| `.rp-announcement-bar[data-scheme]` | `--_bg: var(--color-background); --_fg: var(--color-foreground)` (a scheme supplies its own surface) |

Required rules: root `background: var(--_bg); color: var(--_fg); border-block-end: 1px solid var(--_border)`; `inner` `margin: 0 auto; max-inline-size: var(--container-page); padding: var(--rp-announcement-bar-padding-block) var(--spacing-gutter); text-align: center; font-size: var(--text-sm)`. Links inside inherit colour and are underlined.

### Host notes

- HTML: None.
- React: `export function AnnouncementBar(props: AnnouncementBarProps): JSX.Element`. Generated from the contract template (kind `static`).
- Remix: None.
- Liquid: block `announcement-bar`. `{{ attributes }}` is printed LAST in the root's opening tag (D-035). Schema settings: `scheme` (select; label `t:ripple.props.scheme`, block name `t:ripple.announcement-bar.name`, D-038). Locale keys: `ripple.announcement-bar.name`, `ripple.announcement-bar.label`.

```tsx
<AnnouncementBar>Free shipping over $50</AnnouncementBar>
```

```liquid
{% block 'announcement-bar' %}{{ 'ripple.blueprints.layout.announcement' | t }}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`. Actions: none. Confirm: none. Secret: none.

### Checker rules

- RP113 structure rule `announcement-bar-not-empty`: `.rp-announcement-bar-inner` MUST have non-whitespace text.

### Acceptance tests

- **AT-1** Tier 2: fixtures `default`, `scheme`, `escaping`, `class` conform in all four hosts.
- **AT-2** Tier 1: `pnpm gen --check` regenerates the four bindings from the template with no diff.
- **AT-3** Tier 5: the root spans the full viewport width at 375 px and 1280 px; text is centred.

### Evidence and UNVERIFIED

- Evidence: ledger 8.4 and 6.3 (`scheme` accepted by AnnouncementBar); `02-html-contract.md` A-1.
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
