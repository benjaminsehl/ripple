# EmptyState

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `empty-state` |
| Kind | `static` |
| Category | `feedback` |
| Custom elements | none |
| Root element and class | `div` `.rp-empty-state` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | `icon` |
| Milestone | M1 |

### Purpose

A centred block that explains that a list or region has nothing in it and offers the next step: an empty cart, a search with no results, an empty collection.

- Use when: a region that normally lists items has none.
- Do not use when: the region failed to load (use Banner with `tone="destructive"`), or the page does not exist (the 404 page is a blueprint, `12-components-chrome-and-blueprints.md`, which uses EmptyState inside it).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `EmptyState` | `blocks/empty-state.liquid` | `div` | `rp-empty-state` | none | yes | none |
| icon | none (printed by the root when `icon` is set) | none | `svg` | `rp-icon rp-empty-state-icon` | none | no | none |

Nesting rules: children SHOULD be, in order: one Heading, at most one Text, at most two Buttons or Links. The Heading level is the caller's choice and MUST fit the page outline.

### Props

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `icon` | `icon` | enum | the 24 icon names of section 0.6 | none (omitted) | no | no | when set to a known name: the embedded Icon with class `rp-icon rp-empty-state-icon` as the first child. Unset or unknown: nothing |

### Content model

`flow` - Heading, Text, Button, Link.

### HTML contract

Fixture `default` (no props; children `<h2 class="rp-heading">Your cart is empty</h2>`):

```html
<div class="rp-empty-state"><h2 class="rp-heading">Your cart is empty</h2></div>
```

Fixture `with-icon-and-action` (`icon="cart"`; children: Heading, Text, Button link):

```html
<div class="rp-empty-state"><svg class="rp-icon rp-empty-state-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h10.2L20 7H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg><h2 class="rp-heading">Your cart is empty</h2><p class="rp-text" data-variant="body" data-tone="neutral">Items you add appear here.</p><a class="rp-button" href="/collections/all" data-variant="primary" data-size="md">Continue shopping</a></div>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | `<h2 class="rp-heading">Your cart is empty</h2>` |
| `with-icon-and-action` | `{ "icon": "cart" }` | `<h2 class="rp-heading">Your cart is empty</h2><p class="rp-text" data-variant="body" data-tone="neutral">Items you add appear here.</p><a class="rp-button" href="/collections/all" data-variant="primary" data-size="md">Continue shopping</a>` |
| `unknown-icon` | `{ "icon": "bogus" }` (output equals `default`) | `<h2 class="rp-heading">Your cart is empty</h2>` |
| `class` | `{ "class": "custom-a custom-b" }` | `<h2 class="rp-heading">Your cart is empty</h2>` |

`invalid-enum-falls-back` does not apply (`icon` has no default); `unknown-icon` takes its place.

Host-owned regions and masks: None.

### State and attributes

None.

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional: static markup; the action is a link or a form button.

### Events, commands and methods

None.

### Accessibility

- Pattern: none; `checkPattern`: none.
- Accessible name: not applicable. The Heading names the state.
- Focus: not focusable; the actions are in the normal tab order.
- Announcements: none. When a commerce element replaces a list with an EmptyState (the last cart line is removed) the owning element announces the change (`05-commerce.md`).
- The icon is decorative (`aria-hidden="true"`).

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/empty-state/empty-state.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--color-muted-foreground`, `--container-prose`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-empty-state-padding` | `calc(var(--spacing) * 12)` | block padding |
| `--rp-empty-state-gap` | `calc(var(--spacing) * 3)` | gap between children |
| `--rp-empty-state-icon-size` | `calc(var(--spacing) * 12)` | icon inline and block size |

| Modifier selector | Sets |
|---|---|
| none | |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-empty-state` | custom properties: the three public properties above. Declarations: `display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--rp-empty-state-gap); box-sizing: border-box; max-inline-size: var(--container-prose); margin-block: 0; margin-inline: auto; padding-block: var(--rp-empty-state-padding); padding-inline: 0; text-align: center` |
| PARTS | `.rp-empty-state-icon` | `inline-size: var(--rp-empty-state-icon-size); block-size: var(--rp-empty-state-icon-size); color: var(--color-muted-foreground)` |

### Host notes

- HTML: None.
- React: `export function EmptyState(props: EmptyStateProps)`; generated; `icon?: IconName`.
- Remix: None.
- Liquid: `{% render 'rp-icon', name: icon, class: 'rp-empty-state-icon' %}` when `icon != blank` (the snippet prints nothing for an unknown name). `{% block 'empty-state', icon: 'cart' %}<children>{% endblock %}`. Schema settings: none (`icon` has no default). Locale keys: `ripple.empty-state.name`.

```tsx
<EmptyState icon="search">
  <Heading level={2}>No results for "{term}"</Heading>
  <Text tone="muted">Check the spelling or try a broader term.</Text>
  <Button href="/collections/all">Browse all products</Button>
</EmptyState>
```

```liquid
{% block 'empty-state', icon: 'cart' %}
  {% block 'heading', level: 2 %}{{ 'cart.empty' | t }}{% endblock %}
  {% block 'button', href: routes.all_products_collection_url %}{{ 'cart.continue' | t }}{% endblock %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4 (RP101 reports an unknown `icon`). Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 2: fixture `unknown-icon` output contains no `svg`; fixture `with-icon-and-action` has the `svg` as the first child of the root.
3. Tier 5: fixture `with-icon-and-action` in a 1280 px viewport: the horizontal centre of every child equals the horizontal centre of the root (0.5 px); the icon computes 48 by 48 px at default dials; the root's computed `text-align` is `center`.
4. Tier 5: the root's inline size is at most the computed `--container-prose`.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` section 8.1, D-068; `ripple/docs/02-html-contract.md` N-3, S-10; `ripple/docs/03-styling-and-tokens.md` section 3.4 (`--container-prose`).
- UNVERIFIED: the Liquid object name `routes.all_products_collection_url` in the example (example only; not part of the contract).

### Fallback (SPIKE-nn)

None.

---
