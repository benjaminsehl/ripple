# VisuallyHidden

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `visually-hidden` |
| Kind | `static` |
| Category | `utilities` |
| Custom elements | none |
| Root element and class | `span` `.rp-visually-hidden` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

Text that assistive technology reads and that is not painted: extra context for a link or a count ("items in cart", "reviews").

- Use when: a visible label is too terse out of context and an `aria-label` would replace, not extend, the visible text.
- Do not use when: the element is a control with no visible text (use `ariaLabel` on the control), content must be hidden from everyone (use the `hidden` attribute), or content must be hidden at some breakpoints (use the `hidden` prop).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `VisuallyHidden` | `blocks/visually-hidden.liquid` | `span` | `rp-visually-hidden` | none | yes | none |

Nesting rules: MUST NOT contain focusable elements (a focused, unpainted control fails WCAG 2.4.7).

### Props

VisuallyHidden takes the universal props `id` and `class` only; it does NOT take `span` or `hidden`.

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| none | | | | | | | |

### Content model

`text` - phrasing content with no interactive descendants.

### HTML contract

Fixture `default` (no props; children `items in cart`):

```html
<span class="rp-visually-hidden">items in cart</span>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | `items in cart` |
| `with-id` | `{ "id": "cart-count-label" }` | `items in cart` |
| `class` | `{ "class": "custom-a custom-b" }` | `items in cart` |

Host-owned regions and masks: None.

### State and attributes

None.

Upgrade allow-list (mutations permitted when the element upgrades): None.

### Behaviour with JavaScript

None.

### Behaviour without JavaScript

Fully functional: static markup.

### Events, commands and methods

None.

### Accessibility

- Pattern: visually hidden text; `checkPattern`: none.
- Accessible name: not applicable; the text contributes to the name of an enclosing link or button and is read in place otherwise.
- Focus: not focusable; MUST NOT contain focusable content.
- Announcements: none.

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/visually-hidden/visually-hidden.css` (layer `rp.components`).
- Tokens used: none.

| Custom property | Default | Purpose |
|---|---|---|
| none | | |

| Modifier selector | Sets |
|---|---|
| none | |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-visually-hidden` | `position: absolute; inline-size: 1px; block-size: 1px; margin: calc(1px * -1); padding: 0; overflow: hidden; border: 0; clip-path: inset(50%); white-space: nowrap` |

The class `rp-visually-hidden` MAY also be written by hand on any element (it is the documented way to hide a `<legend>` or a `<caption>` visually); the checker accepts it on any element (exception to RP110 for this one class).

### Host notes

- HTML: None.
- React: `export function VisuallyHidden(props: VisuallyHiddenProps)`; generated.
- Remix: None.
- Liquid: `{% block 'visually-hidden' %}<children>{% endblock %}`. Schema settings: none. Locale keys: `ripple.visually-hidden.name`.

```tsx
<Link href="/cart">
  Cart (3<VisuallyHidden> items</VisuallyHidden>)
</Link>
```

```liquid
{% block 'visually-hidden' %}{{ 'cart.items_label' | t }}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4, with the RP110 exception stated under Styling. Manifest `rules[]`: none.

### Acceptance tests

1. CA-1 to CA-9 pass. (For CA-5 the compared box is 1 by 1 px.)
2. Tier 5: fixture `default` computes `position: absolute`, a bounding box of 1 by 1 px, and `clip-path: inset(50%)`; a screenshot of a page that contains only the fixture on the page background has every pixel equal to the background colour.
3. Tier 3: the accessibility snapshot of `<a class="rp-link" href="/cart" data-variant="inline">Cart (3<span class="rp-visually-hidden"> items</span>)</a>` has a link named `Cart (3 items)`.
4. Tier 5: a 200 px wide `overflow: auto` container that holds the fixture has `scrollWidth` equal to `clientWidth`.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` section 8.1 (VisuallyHidden); `ripple/docs/03-styling-and-tokens.md` CSS-13 (`1px` allowed; `calc(1px * -1)` is a `calc()` over an allowed literal), CSS-14.
- Accepted by the CSS linter (D-105 item 2): `calc(1px * -1)`.
- UNVERIFIED: None.

### Fallback (SPIKE-nn)

None.

---
