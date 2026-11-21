# Announcer

> Component spec. Group doc: [09-components-foundation.md](../09-components-foundation.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `announcer` |
| Kind | `static` |
| Category | `utilities` |
| Custom elements | none |
| Root element and class | `div` `.rp-announcer` |
| Liquid tier | `block` |
| No-JS level | `full` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M1 |

### Purpose

An empty, visually hidden live region placed inside a modal dialog or an `rp-*` root (D-079). The runtime function `announce(text, { from })` writes status text into the first `[data-rp-part="status"]` element of the open modal `<dialog>` that contains `from`, because content outside an open modal dialog is inert and a page-level live region is not announced (D-008 item 7).

- Use when: building a Dialog or Drawer body, or a commerce root, whose script-driven changes must be announced. A Dialog or Drawer MAY print one directly after its header (`10-components-interactive.md`). CartLines, CartSummary, CartNote and DiscountCode always print their own status part (D-079 item 3; `11-components-commerce.md`), so an author does not add an Announcer to them.
- Do not use when: the announcement is page-level (the runtime creates its own page-level regions; `04-elements.md` section 3), or the message must be visible (use FormMessage or Banner).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Announcer` | `blocks/announcer.liquid` | `div` | `rp-announcer` | `data-rp-part="status"` | yes | none |

Nesting rules:

1. MUST be a descendant of a `<dialog>` or of an `rp-*` root.
2. At most one per `<dialog>` and at most one per `rp-*` root (not counting those of nested dialogs).
3. MUST NOT be placed directly in `<body>` or anywhere outside a `<dialog>` and outside every `rp-*` root: the `layout` blueprint prints NO Announcer; page-level live regions are created by the runtime (D-079 item 2, `00-decisions.md` section 8.5).

### Props

Announcer takes the universal props `id` and `class` only; it does NOT take `span` or `hidden`.

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| none | | | | | | | |

### Content model

`none` - the root is printed empty. The server MUST NOT print text in it.

### HTML contract

Fixture `default` (no props):

```html
<div class="rp-announcer" role="status" data-rp-part="status"></div>
```

| Fixture | `props` | `children` |
|---|---|---|
| `default` | `{}` | absent |
| `class` | `{ "class": "custom-a custom-b" }` | absent |

Host-owned regions and masks: the text content of the root is runtime-owned after load. It is empty in every fixture, so no mask is needed.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `role` | root | server | always | `status` |
| `data-rp-part` | root | server | always | `status` |

Upgrade allow-list (mutations permitted when the element upgrades): None at upgrade. After upgrade, `announce()` MAY replace the text content of the root (`04-elements.md` section 3); no attribute is written.

### Behaviour with JavaScript

The component has no script of its own (FC-1). The runtime's `announce(text, { from })` looks for the nearest enclosing open modal `<dialog>` of `from` that contains `[data-rp-part="status"]` and writes the text there; otherwise it uses the page-level regions (`04-elements.md` section 3, rule 2).

### Behaviour without JavaScript

Fully functional in the sense of D-005: the region is empty and inert; nothing depends on it. Server-rendered feedback uses FormMessage or Banner.

### Events, commands and methods

None.

### Accessibility

- Pattern: live region (`role="status"`, polite); `checkPattern`: none.
- Accessible name: not applicable.
- Focus: not focusable.
- Announcements: whatever `announce()` writes. Errors raised inside a dialog use a visible FormMessage with `role="alert"` in addition.
- The region is visually hidden with the same declarations as VisuallyHidden; it MUST NOT be hidden with `display: none`, `visibility: hidden` or the `hidden` attribute (a hidden live region is not announced).

| Key | Action |
|---|---|
| none | none |

### Styling

- File: `components/announcer/announcer.css` (layer `rp.components`).
- Tokens used: none.

| Custom property | Default | Purpose |
|---|---|---|
| none | | |

| Modifier selector | Sets |
|---|---|
| none | |

| File section | Selector | Declarations |
|---|---|---|
| ROOT | `.rp-announcer` | `position: absolute; inline-size: 1px; block-size: 1px; margin: calc(1px * -1); padding: 0; overflow: hidden; border: 0; clip-path: inset(50%); white-space: nowrap` |

The declarations are repeated here, not shared with VisuallyHidden, because a component file styles only its own class (CSS-02).

### Host notes

- HTML: None.
- React: `export function Announcer(props: AnnouncerProps)`; generated. The element has no children in React, so React never reconciles the text the runtime writes.
- Remix: None.
- Liquid: `{% block 'announcer' %}{% endblock %}`. Schema settings: none. Locale keys: `ripple.announcer.name`.

```tsx
<Dialog id="size-guide">
  <DialogBody>
    <Announcer />
    {children}
  </DialogBody>
</Dialog>
```

```liquid
{% block 'announcer' %}{% endblock %}
```

### Commerce

None.

### Agent surface

`accessibility-tree`; actions: none; confirm: none; secret: none.

### Checker rules

Common rules of section 0.4. Manifest `rules[]` (reported by RP113, D-059): `announcer-needs-container`: kind `requires-ancestor`, selector `:scope`, target `dialog, rp-dialog, rp-cart, rp-product-form, rp-live, rp-predictive-search, rp-recommendations, rp-quantity, rp-carousel, rp-navigation-menu` (a `<dialog>` and every `rp-*` component tag of `00-decisions.md` section 8; `rp-view-event` is not a container). Message: "An Announcer is outside a dialog and outside every rp-* root." Fix: "Move the Announcer inside the dialog, or delete it: page-level announcements need no markup."

### Acceptance tests

1. CA-1 to CA-9 pass.
2. Tier 2: every fixture output has `role="status"`, `data-rp-part="status"` and no child nodes.
3. Tier 5: fixture `default` computes a bounding box of 1 by 1 px and `display` other than `none`.
4. Tier 3: a page with `<dialog id="d"><button id="b" type="button">x</button>` + fixture `default` + `</dialog>`, opened with `showModal()`: after `announce("Added to cart", { from: document.getElementById("b") })` the fixture root's `textContent` is `Added to cart` and no page-level region contains that text.
5. Tier 4: React server render then hydration of `<Announcer />`, then `announce()` writes text, then the parent re-renders: the text remains and no hydration warning is logged.
6. Tier 1: fixture `default` as a direct child of `<body>` produces exactly one RP113 finding whose problem ends with `[announcer-needs-container]`; the same fixture inside `<dialog>` and inside `<rp-cart>` produces none.

### Evidence and UNVERIFIED

- Evidence: `ripple/docs/00-decisions.md` D-079 (root markup, placement, no Announcer in `layout`), D-008 item 7, section 8.1 (`div role="status" data-rp-part="status"`), section 8.5; `ripple/docs/04-elements.md` section 3 rule 2 (`data-rp-part="status"` inside an open modal dialog), section 2 (`src/runtime/announcer.ts`).
- UNVERIFIED: None. (The signature `announce(text, { from })` is fixed by D-019 item 5 and D-079.)

### Fallback (SPIKE-nn)

None.

---
