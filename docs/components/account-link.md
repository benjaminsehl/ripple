# AccountLink

> Component spec. Group doc: [12-components-chrome-and-blueprints.md](../12-components-chrome-and-blueprints.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `account-link` |
| Kind | `static` |
| Category | `chrome` |
| Custom elements | none |
| Root element and class | `a` `.rp-account-link` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `icon` |
| Milestone | M4 |

### Purpose

A link to the Shopify-hosted customer account (D-051): an account icon and a text label. It is the only account UI in V1.

- Use when: linking to the customer account from the Header, MobileNav or Footer.
- Do not use when: you need login, order or address UI (not in V1; those pages are hosted by Shopify).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `AccountLink` | `blocks/account-link.liquid` | `a` | `rp-account-link` | none | yes | none |
| icon | none (printed by root) | same file | `svg` (Icon `account`) | `rp-icon` | none | yes | none |
| label | none (printed by root) | same file | `span` | `rp-account-link-label` | none | yes | none |

Nesting rules: root contains `icon` then `label`. Children are the content of `label`.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `href` | `href` | url | any URL | TSX: `/account`. Liquid: `routes.account_url` when `customer` is set, otherwise `routes.account_login_url` | no | no | `href` on root |
| `iconOnly` | `icon_only` | boolean | `true`, `false` | `false` | no | no | `data-icon-only=""` on root |

### Content model

`text` - the label; REQUIRED. English default used by Header: `ripple.account-link.label` ("Account"). With `iconOnly` the label is visually hidden by CSS and remains the accessible name.

### HTML contract

Fixture `default` (children: `Account`):

```html
<a class="rp-account-link" href="/account"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg><span class="rp-account-link-label">Account</span></a>
```

Fixture `icon-only` (`iconOnly: true`, `href: "/account/login"`):

```html
<a class="rp-account-link" href="/account/login" data-icon-only=""><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg><span class="rp-account-link-label">Account</span></a>
```

Fixture `class` (`class: "custom-a custom-b"`): root class is `rp-account-link custom-a custom-b`.

Host-owned regions and masks: `{ "select": "a.rp-account-link", "op": "attr", "name": "href" }` (the account URL differs by backend).

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| none | none | none | none | none |

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

1. None. The link is a full document navigation in every host.

### Behaviour without JavaScript

Identical.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| none | none | none | none | none |

### Accessibility

- Pattern: native `<a>`; `checkPattern`: none.
- Accessible name: the label text (required), also when `iconOnly`.
- Focus: none.
- Announcements: None.

| Key | Action |
|---|---|
| Enter | Follow the link |

### Styling

- File: `components/account-link/account-link.css` (layer `rp.components`).
- Tokens used: `--color-foreground`, `--color-accent`, `--color-ring`, `--radius-control`, `--spacing`, `--spacing-control-md`, `--text-sm`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-account-link-size` | `var(--spacing-control-md)` | Minimum block size; also the inline size when `iconOnly` |

| Modifier selector | Sets |
|---|---|
| `.rp-account-link[data-icon-only]` | `--_inline: var(--rp-account-link-size); --_padding: 0; --_justify: center` |

Required rules: root `display: inline-flex; align-items: center; justify-content: var(--_justify, flex-start); gap: calc(var(--spacing) * 2); min-block-size: var(--rp-account-link-size); min-inline-size: var(--_inline, auto); padding-inline: var(--_padding, calc(var(--spacing) * 2)); border-radius: var(--radius-control); color: var(--color-foreground); text-decoration: none; font-size: var(--text-sm)`. `.rp-account-link[data-icon-only] .rp-account-link-label` uses the visually-hidden declarations (`position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap`). Hover background `--color-accent` inside `@media (hover: hover)`.

### Host notes

- HTML: None.
- React: `export function AccountLink(props: AccountLinkProps): JSX.Element`. Generated from the contract template.
- Remix: prints `data-rmx-document` on the root (links to account routes MUST be document navigations, D-034 item 3).
- Liquid: block `account-link`; markup in `snippets/rp-account-link.liquid` (embedded by Header). No schema settings. Locale keys: `ripple.account-link.name`, `ripple.account-link.label` ("Account"). `{{ attributes }}` is printed LAST in the root's opening tag (D-035). Block name `t:ripple.account-link.name`; setting labels `t:ripple.props.<prop name>`, option labels `t:ripple.props.<value>` (D-038).

```tsx
<AccountLink href="/account" iconOnly>Account</AccountLink>
```

```liquid
{% block 'account-link', icon_only: true %}{{ 'ripple.account-link.label' | t }}{% endblock %}
```

Liquid default for `href` (in the snippet's `{% liquid %}` block):

```liquid
if href == blank
  if customer
    assign href = routes.account_url
  else
    assign href = routes.account_login_url
  endif
endif
```

The snippet reads the global `customer`; it has no param of that name (rule L-5).

### Commerce

None.

### Agent surface

`accessibility-tree`. Actions: none. Confirm: none. Secret: none.

### Checker rules

- RP201: the link has a non-empty label.

### Acceptance tests

- **AT-1** Tier 2: fixtures `default`, `icon-only`, `class` conform in all four hosts (`href` masked).
- **AT-2** Tier 5: with `iconOnly` the link box is 44 by 44 CSS px, the label's box is 1 by 1 CSS px, and the computed accessible name is `Account`.
- **AT-3** Tier 4 (Remix): the rendered link has `data-rmx-document`; clicking it causes a document navigation (no `X-Remix-Frame` request).

### Evidence and UNVERIFIED

- Evidence: ledger D-051, D-034 item 3; `ripple/docs/research/remix-3.md` (links to `/account/*` need `data-rmx-document`); `ripple/theme/assets/icon-account.svg`.
- UNVERIFIED: the hydrogen-backend account URL. `hydrogen/packages/hydrogen/src/customer-account/` exists but was not researched (D-051); the default `/account` is a placeholder path the app MUST route to the Shopify-hosted account (for example by redirect).

### Fallback (SPIKE-nn)

None.

---
