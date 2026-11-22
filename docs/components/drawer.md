# Drawer

> Component spec. Group doc: [10-components-interactive.md](../10-components-interactive.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `drawer` |
| Kind | `native` |
| Category | `overlays` |
| Custom elements | `rp-dialog` |
| Root element and class | `rp-dialog` `.rp-drawer` |
| Liquid tier | `parts` |
| No-JS level | `degraded` |
| Requires `id` | yes |
| Depends on | `button`, `icon-button`, `icon`, `link` (openers and closers written by the author) |
| Milestone | M2 |

### Purpose

A modal panel that slides in from an edge of the screen. It is the same element and the same native `<dialog>` as Dialog, with different classes and a `side` prop. CartDrawer and MobileNav compose it by contract (D-070): their root is this root with a second class after `rp-drawer` (`class="rp-drawer rp-cart-drawer"`, `class="rp-drawer rp-mobile-nav"`), their panel and parts use the part classes of this section, and `drawer.css` is the only CSS that styles the panel.

- Use when: a tall or long-lived panel is needed beside the page (filters, cart, navigation, a long form).
- Do not use when: the content is short and centred (use Dialog); the popup is small and anchored to its button (use Popover); the content is the cart or the mobile menu (use CartDrawer or MobileNav, which already compose Drawer).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Drawer` | `blocks/drawer.liquid` | `rp-dialog` | `rp-drawer` | `data-slot="rp-dialog"` | yes | none |
| panel | none (printed by `Drawer`) | none (printed by `blocks/drawer.liquid`) | `dialog` | `rp-drawer-panel` | none | yes | `<id>` |
| header | `DrawerHeader` | `blocks/drawer-header.liquid` | `div` | `rp-drawer-header` | none | no | none |
| title | `DrawerTitle` | `blocks/drawer-title.liquid` | `h2` | `rp-drawer-title` | none | yes | `<id>-title` |
| description | `DrawerDescription` | `blocks/drawer-description.liquid` | `p` | `rp-drawer-description` | none | no | `<id>-description` |
| body | `DrawerBody` | `blocks/drawer-body.liquid` | `div` | `rp-drawer-body` | none | no | none |
| footer | `DrawerFooter` | `blocks/drawer-footer.liquid` | `div` | `rp-drawer-footer` | none | no | none |

Openers and closers are not parts (D-008 item 2, D-084). An opener is a Button or IconButton with `commandFor="<id>"` and `command="show-modal"`, or, when a page equivalent exists, a Link (or a Button or IconButton with `href`) with the prop `dialog="<id>"` (D-009). A closer is a Button or IconButton with `commandFor="<id>"` and `command="close"`. There is no `DrawerClose` and no `DrawerTrigger` part or export.

Nesting rules:

1. `rp-dialog` MUST contain exactly one child, the `<dialog>`. The `id` is on the `<dialog>`. `data-slot` is `rp-dialog` (the tag name), not `rp-drawer`.
2. The children of the `<dialog>` are, in this order: header (optional), title (only when there is no header), description (optional), body (optional), footer (optional). No other element may be a child of the `<dialog>`, with one exception: one status part, `<div class="rp-announcer" role="status" data-rp-part="status"></div>` (the Announcer of `09-components-foundation.md`, D-079; `04-elements.md` 3.5), MAY be printed directly after the header (or after the title when there is no header). Commerce components placed in the body print their own status part (`11-components-commerce.md`).
3. The title is REQUIRED, exactly once, as a direct child of the `<dialog>` or as the first child of the header.
4. The header contains the title first, then at most one closer (an IconButton with `commandFor="<id>"` and `command="close"`).
5. All free flow content goes inside the body. The body is the only part that scrolls. A refreshable region (`data-rp-region`) that the drawer's content refreshes MUST be inside the body; the Drawer root MUST NOT be inside that region (D-046 item 5).
6. The footer contains Buttons or a CheckoutButton, stacked in one column.
7. A Drawer root MUST NOT be inside an `<a>`, a `<button>`, a `<label>`, another `<dialog>` or a Popover.

### Props

Root (`Drawer`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | yes | no | `id` on the `<dialog>` and `aria-labelledby="<id>-title"` on the `<dialog>` |
| `side` | `side` (setting) | enum | `start` `end` `bottom` | `end` | no | no | `data-side` on the `<dialog>` (default printed) |
| `defaultOpen` | `default_open` | boolean | `true` `false` | `false` | no | no | `data-default-open=""` on the `<dialog>` when true; never `open` |
| `open` | none (React only) | boolean | `true` `false` | none | no | no | no attribute; property `open` of `rp-dialog` through `useElement` |
| `onOpenChange` | none (React only) | callback | `(open: boolean, detail: OpenChangeDetail) => void` | none | no | no | no attribute; listener for `openchange` through `useElement` |

`class` (React: `className`) and rest props / `attributes` apply to the `rp-dialog` root.

Title (`DrawerTitle`) and description (`DrawerDescription`), same table for both:

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `drawer` | `drawer` | id | the `id` of the Drawer | none | yes | no | title: `id="<drawer>-title"`; description: `id="<drawer>-description"` |

Header, body and footer have no props other than `class` and rest props / `attributes`.

### Content model

`parts` - the children of `Drawer` are its own parts only: `DrawerHeader`, `DrawerTitle`, `DrawerDescription`, `DrawerBody`, `DrawerFooter`, in the order of nesting rule 2. `DrawerTitle` and `DrawerDescription` take text. `DrawerHeader` takes one `DrawerTitle` and at most one IconButton. `DrawerBody` takes any flow content. `DrawerFooter` takes Buttons.

### HTML contract

Fixture `default` (`id="filters"`; title "Filters"):

```html
<rp-dialog class="rp-drawer" data-slot="rp-dialog">
  <dialog class="rp-drawer-panel" id="filters" data-side="end" aria-labelledby="filters-title" closedby="any">
    <h2 class="rp-drawer-title" id="filters-title">Filters</h2>
  </dialog>
</rp-dialog>
```

Fixture `composed` (`id="filters"`, `side="start"`; header with title and a closer, description, body, footer):

```html
<rp-dialog class="rp-drawer" data-slot="rp-dialog">
  <dialog class="rp-drawer-panel" id="filters" data-side="start" aria-labelledby="filters-title" closedby="any">
    <div class="rp-drawer-header">
      <h2 class="rp-drawer-title" id="filters-title">Filters</h2>
      <button type="button" commandfor="filters" command="close" aria-label="Close">x</button>
    </div>
    <p class="rp-drawer-description" id="filters-description">Narrow the product list.</p>
    <div class="rp-drawer-body">
      <p>Size</p>
    </div>
    <div class="rp-drawer-footer">
      <button type="button" commandfor="filters" command="close">Show results</button>
    </div>
  </dialog>
</rp-dialog>
```

Fixture `bottom` (`id="sheet"`, `side="bottom"`):

```html
<rp-dialog class="rp-drawer" data-slot="rp-dialog">
  <dialog class="rp-drawer-panel" id="sheet" data-side="bottom" aria-labelledby="sheet-title" closedby="any">
    <h2 class="rp-drawer-title" id="sheet-title">Sort</h2>
  </dialog>
</rp-dialog>
```

Fixture `default-open` (`id="welcome"`, `defaultOpen`):

```html
<rp-dialog class="rp-drawer" data-slot="rp-dialog">
  <dialog class="rp-drawer-panel" id="welcome" data-side="end" aria-labelledby="welcome-title" closedby="any" data-default-open="">
    <h2 class="rp-drawer-title" id="welcome-title">Welcome</h2>
  </dialog>
</rp-dialog>
```

Fixture `invalid-enum-falls-back` (`id="w1"`, `side="left"`):

```html
<rp-dialog class="rp-drawer" data-slot="rp-dialog">
  <dialog class="rp-drawer-panel" id="w1" data-side="end" aria-labelledby="w1-title" closedby="any">
    <h2 class="rp-drawer-title" id="w1-title">Title</h2>
  </dialog>
</rp-dialog>
```

Fixture `class` (`id="w2"`, `class="custom-a custom-b"`):

```html
<rp-dialog class="rp-drawer custom-a custom-b" data-slot="rp-dialog">
  <dialog class="rp-drawer-panel" id="w2" data-side="end" aria-labelledby="w2-title" closedby="any">
    <h2 class="rp-drawer-title" id="w2-title">Title</h2>
  </dialog>
</rp-dialog>
```

The opener of a Drawer that has a page equivalent is a link, written by the author outside the root (shown for reference; it is not part of any Drawer fixture). The author writes it as a Link with the prop `dialog` (TSX `<Link href="/collections/all" dialog="filters">Filters</Link>`; Liquid `{% block 'link', href: '/collections/all', dialog: 'filters' %}Filters{% endblock %}`), which prints the Link contract of `09-components-foundation.md` plus `data-rp-open`:

```html
<a class="rp-link" href="/collections/all" data-variant="inline" data-rp-open="filters">Filters</a>
```

Callers MUST NOT pass `data-rp-open` through rest props or `attributes` (D-009). When the target drawer is not on the page (CartDrawer on the cart page, D-091), the `dialog` prop is omitted and the link navigates.

The server MUST NOT print on the `<dialog>`: `open`, `hidden`, `role`, `aria-modal`, `aria-hidden`, `tabindex`. The server MUST NOT print on a link opener: `aria-haspopup`, `aria-controls`, `role`, `commandfor`.

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `open` | panel (`<dialog>`) | browser | while the drawer is open | absent |
| `data-default-open` | panel | server | prop `defaultOpen` is true | `""` when true, otherwise absent |
| `aria-haspopup="dialog"`, `aria-controls="<id>"` | an `a[data-rp-open="<id>"]` opener anywhere in the document | element (the opener listener of the runtime, `04-elements.md` 3.4; once, after `rp-dialog` is defined) | the link targets this drawer | absent |

Upgrade allow-list (mutations permitted when the element upgrades):

```json
[
  {
    "select": "dialog[data-default-open]",
    "attrs": ["open"],
    "reason": "rp-dialog calls showModal() on connect; the server must not print open on a modal dialog."
  }
]
```

### Behaviour with JavaScript

Identical to Dialog, "Behaviour with JavaScript", items 1 to 11, with "dialog" read as "drawer". In addition:

1. `side="end"` attaches the panel to the inline-end edge at full viewport height; `side="start"` to the inline-start edge; `side="bottom"` to the bottom edge at full width with a maximum height of `85dvh`. In a right-to-left document `start` and `end` swap sides.
2. Entrance and exit are a slide from the attached edge (`translate`), 300 ms in and 200 ms out with `--ease-drawer`; with `prefers-reduced-motion: reduce` the panel appears and disappears instantly.
3. A region refresh inside the body (`rp:refresh`) does not close the drawer (`04-elements.md` 9.1 item 7).

### Behaviour without JavaScript

- A Drawer opened by `<a href="<page>" data-rp-open="<id>">` (a Link with the prop `dialog`): the link navigates to the page. Full function through the page. This is the REQUIRED opener when a page equivalent exists (D-009): cart drawer and `/cart`, search dialog and `/search`, mobile nav and the footer menu anchor. (The `collection` blueprint renders Filters inline and never inside a Drawer, D-005; the `filters` drawer of this section's examples is a generic example.)
- A Drawer opened by a `commandfor` button: works in browsers with Invoker Commands; in other browsers the button does nothing and the content is not reachable.
- No control is marked `data-rp-js`. `defaultOpen` has no effect without JavaScript.
- Manifest: `noJs.level: "degraded"`, `noJs.behavior: "With Invoker Commands the drawer opens and closes with no script. Without them a button opener does nothing; an opener with a page equivalent MUST be a link with the dialog prop, which navigates."`, `noJs.fallbackHref`: absent on the generic Drawer (CartDrawer and MobileNav set it).

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `openchange` | `rp-dialog` | `{ value: boolean, reason: "trigger-press" \| "close-press" \| "escape-key" \| "outside-press" \| "link-press" \| "imperative", source: string }`; not bubbling; cancelable | `onOpenChange(open, detail)` |
| command | `show-modal` | the `<dialog>` (`commandfor="<id>"`) | none | none |
| command | `close` | the `<dialog>` (`commandfor="<id>"`) | none | none |
| method | `api.open(event?)` | `rp-dialog` | returns `false` when already open or vetoed | none |
| method | `api.close(event?)` | `rp-dialog` | returns `false` when already closed or vetoed | none |
| method | `api.isOpen()` | `rp-dialog` | returns `boolean` | none |
| method | `api.setOpen(value)` | `rp-dialog` | silent: no event | none |

### Accessibility

- Pattern: native `<dialog>` opened with `showModal()` (APG "Dialog (Modal)"); `checkPattern`: `dialog`.
- Accessible name: REQUIRED. From the title through `aria-labelledby="<id>-title"`.
- Focus: on open the browser focuses the first focusable element inside the `<dialog>`; when nothing is focusable, the `<dialog>` itself. On close focus returns to the opener (button or link).
- Announcements: None by Drawer itself. An element that changes content while the drawer is open announces with `announce(text, { from })`, which writes into the first `data-rp-part="status"` element inside the open `<dialog>` (D-079; used by the cart components inside CartDrawer).

| Key | Action |
|---|---|
| Escape | Closes the drawer; focus returns to the opener |
| Tab / Shift+Tab | Moves focus among the controls inside the drawer only |
| Enter on a link opener, Enter or Space on a button opener | Opens |

### Styling

- File: `components/drawer/drawer.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--radius-surface`, `--color-popover`, `--color-popover-foreground`, `--color-border`, `--color-overlay`, `--color-muted-foreground`, `--shadow-lg`, `--font-heading`, `--rp-heading-weight`, `--text-lg`, `--text-lg--line-height`, `--text-sm`, `--text-sm--line-height`, `--rp-duration-base`, `--rp-duration-slow`, `--ease-drawer`, `--ease-out`, `--rp-dir`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-drawer-size` | `calc(var(--spacing) * 96)` | inline size for `side="start"` and `side="end"` (capped at 100% of the viewport) |
| `--rp-drawer-padding` | `calc(var(--spacing) * 6)` | padding of the panel |
| `--rp-drawer-gap` | `calc(var(--spacing) * 4)` | gap between header, description, body, footer |
| `--rp-drawer-radius` | `var(--radius-surface)` | radius of the two top corners for `side="bottom"` |

| Modifier selector | Sets |
|---|---|
| `.rp-drawer-panel[data-side="start"]` | `--_inset-inline-start`, `--_inset-inline-end`, `--_from-x` |
| `.rp-drawer-panel[data-side="bottom"]` | `--_inset-block-start`, `--_inset-inline-start`, `--_inline-size`, `--_block-size`, `--_max-block-size`, `--_radius-block-start`, `--_from-x`, `--_from-y` |

Rules specific to this file: the four rules of Dialog, "Styling", apply unchanged. In addition the closed position uses `translate: calc(var(--_from-x) * var(--rp-dir)) var(--_from-y)` so that the slide direction follows the writing direction (`03-styling-and-tokens.md` section 10).

Complete file:

```css
/* drawer.css
   Component: Drawer (id `drawer`). Contract: 10-components-interactive.md, "Drawer".
   Root:      <rp-dialog>, class rp-drawer
   Parts:     rp-drawer-panel (<dialog>)
              rp-drawer-header (<div>)
              rp-drawer-title (<h2>)
              rp-drawer-description (<p>)
              rp-drawer-body (<div>)
              rp-drawer-footer (<div>)
   Props:     data-side = start | end | bottom   (default end), on rp-drawer-panel
   States:    [open], ::backdrop
   Public:    --rp-drawer-size, --rp-drawer-padding, --rp-drawer-gap, --rp-drawer-radius */
@layer rp.components {
  /* 1. ROOT */
  .rp-drawer {
    /* 1a. public custom properties */
    --rp-drawer-size: calc(var(--spacing) * 96);
    --rp-drawer-padding: calc(var(--spacing) * 6);
    --rp-drawer-gap: calc(var(--spacing) * 4);
    --rp-drawer-radius: var(--radius-surface);
    /* 1b. colour slots */
    --_bg: var(--color-popover);
    --_fg: var(--color-popover-foreground);
    --_border: var(--color-border);
    /* 1c. other private custom properties */
    --_inset-block-start: 0;
    --_inset-inline-start: auto;
    --_inset-inline-end: 0;
    --_inline-size: var(--rp-drawer-size);
    --_block-size: 100dvh;
    --_max-block-size: 100dvh;
    --_radius-block-start: 0;
    --_from-x: 100%;
    --_from-y: 0%;
    /* 1d. declarations */
  }

  /* 2. PARTS */
  .rp-drawer-panel {
    box-sizing: border-box;
    flex-direction: column;
    gap: var(--rp-drawer-gap);
    inset-block-start: var(--_inset-block-start);
    inset-block-end: 0;
    inset-inline-start: var(--_inset-inline-start);
    inset-inline-end: var(--_inset-inline-end);
    inline-size: var(--_inline-size);
    block-size: var(--_block-size);
    max-inline-size: 100%;
    max-block-size: var(--_max-block-size);
    margin: 0;
    padding: var(--rp-drawer-padding);
    border: 1px solid var(--_border);
    border-start-start-radius: var(--_radius-block-start);
    border-start-end-radius: var(--_radius-block-start);
    border-end-start-radius: 0;
    border-end-end-radius: 0;
    background-color: var(--_bg);
    color: var(--_fg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }
  .rp-drawer-header {
    display: flex;
    flex: none;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--rp-drawer-gap);
  }
  .rp-drawer-title {
    flex: 1 1 auto;
    min-inline-size: 0;
    margin: 0;
    font-family: var(--font-heading);
    font-size: var(--text-lg);
    line-height: var(--text-lg--line-height);
    font-weight: var(--rp-heading-weight);
  }
  .rp-drawer-description {
    flex: none;
    margin: 0;
    color: var(--color-muted-foreground);
    font-size: var(--text-sm);
    line-height: var(--text-sm--line-height);
  }
  .rp-drawer-body {
    flex: 1 1 auto;
    min-block-size: 0;
    overflow-y: auto;
  }
  .rp-drawer-footer {
    display: flex;
    flex: none;
    flex-direction: column;
    gap: calc(var(--spacing) * 2);
  }

  /* 3. MODIFIERS */
  .rp-drawer-panel[data-side="start"] {
    --_inset-inline-start: 0;
    --_inset-inline-end: auto;
    --_from-x: -100%;
  }
  .rp-drawer-panel[data-side="bottom"] {
    --_inset-block-start: auto;
    --_inset-inline-start: 0;
    --_inline-size: 100%;
    --_block-size: auto;
    --_max-block-size: 85dvh;
    --_radius-block-start: var(--rp-drawer-radius);
    --_from-x: 0%;
    --_from-y: 100%;
  }

  /* 4. STATES */
  .rp-drawer-panel[open] {
    display: flex;
  }
  .rp-drawer-panel::backdrop {
    background-color: var(--color-overlay);
  }

  /* 5. MOTION */
  @media (prefers-reduced-motion: no-preference) {
    .rp-drawer-panel {
      translate: calc(var(--_from-x) * var(--rp-dir)) var(--_from-y);
      transition-property: translate, display, overlay;
      transition-duration: var(--rp-duration-base);
      transition-timing-function: var(--ease-drawer);
      transition-behavior: allow-discrete;
    }
    .rp-drawer-panel[open] {
      translate: 0 0;
      transition-duration: var(--rp-duration-slow);
    }
    .rp-drawer-panel::backdrop {
      opacity: 0;
      transition-property: opacity, display, overlay;
      transition-duration: var(--rp-duration-base);
      transition-timing-function: var(--ease-out);
      transition-behavior: allow-discrete;
    }
    .rp-drawer-panel[open]::backdrop {
      opacity: 1;
    }
    @starting-style {
      .rp-drawer-panel[open] {
        translate: calc(var(--_from-x) * var(--rp-dir)) var(--_from-y);
      }
      .rp-drawer-panel[open]::backdrop {
        opacity: 0;
      }
    }
  }

  /* 6. ENVIRONMENT */
  @media (forced-colors: active) {
    .rp-drawer-panel {
      border-color: CanvasText;
    }
  }
}
```

### Host notes

- HTML: copy the contract. Use a link opener (`<a href="<page>" data-rp-open="<id>">`) when a page equivalent exists.
- React: `export function Drawer(props: DrawerProps): JSX.Element`, plus `DrawerHeader`, `DrawerTitle`, `DrawerDescription`, `DrawerBody`, `DrawerFooter`, all in `drawer.tsx`. The file is `dialog.tsx` of `06-bindings.md` 6.6 with these substitutions and no other change: class prefix `rp-dialog` to `rp-drawer` (the tag `rp-dialog` and `data-slot="rp-dialog"` stay); the enum constant `SIZE` and the prop `size` are replaced by `const SIDE = ["start", "end", "bottom"] as const` and the prop `side` with fallback `"end"`, printed as `data-side`; the part prop `dialog` is renamed `drawer`. Hand-written below the generated header region (D-072); first line `"use client"`. Controlled prop: `open`. Callback: `onOpenChange(open, detail)`.
- Remix: generated; the same substitutions applied to `06-bindings.md` 7.6. Prints `data-rmx-key="<id>"` on `rp-dialog` and `data-rmx-preserve-attrs="open"` on the `<dialog>`.
- Liquid: six block files, generated: `drawer`, `drawer-header`, `drawer-title`, `drawer-description`, `drawer-body`, `drawer-footer`. `blocks/drawer.liquid` is `blocks/dialog.liquid` of `06-bindings.md` 8.6 with the same substitutions (guard `assign allowed_side = 'start,end,bottom' | split: ','`, fallback `'end'`). Schema settings: `side` (root only); label keys per G-8. Locale keys for strings the component prints: none. `{{ attributes }}` is printed last (G-13).

```tsx
import { Button } from "./button";
import { IconButton } from "./icon-button";
import { Link } from "./link";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader, DrawerTitle } from "./drawer";

export function FilterDrawer() {
  return (
    <>
      <Link href="/collections/all" dialog="filters">Filters</Link>
      <Drawer id="filters" side="start">
        <DrawerHeader>
          <DrawerTitle drawer="filters">Filters</DrawerTitle>
          <IconButton icon="close" ariaLabel="Close" commandFor="filters" command="close" />
        </DrawerHeader>
        <DrawerBody>
          <p>Size</p>
        </DrawerBody>
        <DrawerFooter>
          <Button commandFor="filters" command="close">Show results</Button>
        </DrawerFooter>
      </Drawer>
    </>
  );
}
```

```liquid
{% block 'link', href: collection.url, dialog: 'filters' %}Filters{% endblock %}
{% block 'drawer', id: 'filters', side: 'start' %}
  {% block 'drawer-header' %}
    {% block 'drawer-title', drawer: 'filters' %}Filters{% endblock %}
    {% block 'icon-button', icon: 'close', aria_label: 'Close', command_for: 'filters', command: 'close' %}{% endblock %}
  {% endblock %}
  {% block 'drawer-body' %}
    <p>Size</p>
  {% endblock %}
  {% block 'drawer-footer' %}
    {% block 'button', command_for: 'filters', command: 'close' %}Show results{% endblock %}
  {% endblock %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`bridge` (and the accessibility tree). Bridge component: `rp-dialog`. Actions: `open`, `close`. Confirm: none. Secret: none.

### Checker rules

- RP104: `id` missing; `drawer` prop missing on a title or description.
- RP113 with these manifest `rules[]` entries (the selectors match a composed root such as `class="rp-drawer rp-cart-drawer"` too, G-12):
  - `drawer-needs-title`: kind `requires-descendant`, selector `rp-dialog.rp-drawer`, target `.rp-drawer-title`. Message: "A Drawer has no title, so it has no accessible name." Fix: "Add a drawer-title part with drawer set to the Drawer id."
  - `drawer-one-title`: kind `max-count`, selector `rp-dialog.rp-drawer .rp-drawer-title`, count `1`. Message: "A Drawer has more than one title." Fix: "Keep one drawer-title."
  - `drawer-not-nested`: kind `forbids-ancestor`, selector `rp-dialog.rp-drawer`, target `dialog, a, button, label, [popover]`. Message: "A Drawer is inside a dialog, link, button, label or popover." Fix: "Move the Drawer to the end of the page body; openers find it by id."
  - The rule `dialog-not-open-in-server-html` of Dialog selects `rp-dialog` and therefore covers Drawer too.
- RP114: the title id MUST equal `<drawer id>-title`.
- RP302: an element with `data-rp-open` MUST be an `<a>` with a non-empty `href`; for components that compose Drawer and set `noJs.fallbackHref` (CartDrawer, MobileNav) the opener MUST be an `<a href>`.
- RP204, RP304: as for Dialog.

### Acceptance tests

1. T2: fixtures `default`, `composed`, `bottom`, `default-open`, `invalid-enum-falls-back`, `class` are canonical-equal in the four hosts.
2. T3: zero mutation records inside the root for `default`; exactly one (`open` added) for `default-open`.
3. T5: with `<a class="rp-link" href="/x" data-variant="inline" data-rp-open="filters">` (a Link with `dialog="filters"`) on the page and `ripple.js` loaded: a primary click opens the drawer and `location.pathname` does not change; `openchange` has `reason === "trigger-press"`; the link has `aria-haspopup="dialog"` and `aria-controls="filters"`. A click with the Meta or Ctrl key held does not open the drawer.
4. T5 (CSS), viewport 1000 by 700, default tokens, panel open: `side="end"` box is left 616, top 0, width 384, height 700; `side="start"` box is 0, 0, 384, 700; `side="bottom"` has left 0, width 1000, bottom edge 700 and height at most 595.
5. T5 (CSS), `<html dir="rtl">`, viewport 600 by 700: `side="end"` has left edge 0; `side="start"` has right edge 600.
6. T5 (CSS): with a body taller than the viewport, the body's `scrollHeight` is greater than its `clientHeight`, and the footer's bottom edge is inside the viewport.
7. T5: Escape closes the drawer and focus returns to the link opener.
8. T6: with JavaScript disabled, a click on the link opener of test 3 navigates to `/x` (response status 2xx) and no dialog is open.
9. T4 (React): hydration of `default` logs no warning; controlled `open` behaves as in Dialog test 10.
10. T9: tests 3 and 7 pass in WebKit and Gecko.

### Evidence and UNVERIFIED

- Evidence: `00-decisions.md` D-008, D-009, D-017, D-046 item 5, D-070, D-079, D-084; `ripple/docs/04-elements.md` 3.4 (opener listener), 9.1, 10.2; `ripple/theme/snippets/drawer.liquid`; `ripple/docs/03-styling-and-tokens.md` section 10 (`--rp-dir`); CSS rendered in Chromium 157 in both directions (`ripple/docs/research/spikes/components-interactive/css-test.mjs`: boxes of acceptance tests 4 and 5).
- UNVERIFIED: the same items as Dialog (SPIKE-05, SPIKE-06).

### Fallback (SPIKE-05)

Identical to Dialog, "Fallback (SPIKE-05)": only on this fallback path do `<button>` openers and closers additionally carry `data-rp-open` / `data-rp-close`. The Drawer contract does not change. Link openers already use `data-rp-open` (through the `dialog` prop) and are not affected.

---
