# Dialog

> Component spec. Group doc: [10-components-interactive.md](../10-components-interactive.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `dialog` |
| Kind | `native` |
| Category | `overlays` |
| Custom elements | `rp-dialog` |
| Root element and class | `rp-dialog` `.rp-dialog` |
| Liquid tier | `parts` |
| No-JS level | `degraded` |
| Requires `id` | yes |
| Depends on | `button`, `icon-button`, `icon` (openers and closers written by the author) |
| Milestone | M2 |

### Purpose

A modal window centred over the page, built on the native `<dialog>` element inside one `rp-dialog` wrapper.

- Use when: short, self-contained content interrupts the page (size guide, confirmation, quick view, search).
- Do not use when: the panel slides in from a screen edge (use Drawer); the content must be readable when JavaScript never loads (use Accordion); the popup is small and anchored to its button (use Popover).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Dialog` | `blocks/dialog.liquid` | `rp-dialog` | `rp-dialog` | `data-slot="rp-dialog"` | yes | none |
| panel | none (printed by `Dialog`) | none (printed by `blocks/dialog.liquid`) | `dialog` | `rp-dialog-panel` | none | yes | `<id>` |
| header | `DialogHeader` | `blocks/dialog-header.liquid` | `div` | `rp-dialog-header` | none | no | none |
| title | `DialogTitle` | `blocks/dialog-title.liquid` | `h2` | `rp-dialog-title` | none | yes | `<id>-title` |
| description | `DialogDescription` | `blocks/dialog-description.liquid` | `p` | `rp-dialog-description` | none | no | `<id>-description` |
| body | `DialogBody` | `blocks/dialog-body.liquid` | `div` | `rp-dialog-body` | none | no | none |
| footer | `DialogFooter` | `blocks/dialog-footer.liquid` | `div` | `rp-dialog-footer` | none | no | none |

Openers and closers are not parts (D-008 item 2, D-084). An opener is a Button or IconButton with `commandFor="<id>"` and `command="show-modal"`, or, when a page equivalent exists, a Link (or a Button or IconButton with `href`) with the prop `dialog="<id>"` (D-009). A closer is a Button or IconButton with `commandFor="<id>"` and `command="close"`. There is no `DialogClose` and no `DialogTrigger` part or export.

Nesting rules:

1. `rp-dialog` MUST contain exactly one child, the `<dialog>`. The `id` is on the `<dialog>`, never on `rp-dialog`.
2. The children of the `<dialog>` are, in this order: header (optional), title (only when there is no header), description (optional), body (optional), footer (optional). No other element may be a child of the `<dialog>`, with one exception: one status part, `<div class="rp-announcer" role="status" data-rp-part="status"></div>` (the Announcer of `09-components-foundation.md`, D-079), MAY be printed directly after the header (or after the title when there is no header).
3. The title is REQUIRED. It is either a direct child of the `<dialog>` or the first child of the header. There MUST be exactly one title per Dialog.
4. The header contains the title first, then at most one closer (an IconButton with `commandFor="<id>"` and `command="close"`).
5. All free flow content goes inside the body. The body is the only part that scrolls.
6. The footer contains Buttons only.
7. A Dialog root MUST NOT be inside an `<a>`, a `<button>`, a `<label>`, another `<dialog>`, a Popover, or a region that its own content refreshes (D-046 item 5).
8. The Dialog root may be placed anywhere else in `<body>`. It takes no space in the flow.

### Props

Root (`Dialog`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | yes | no | `id` on the `<dialog>` and `aria-labelledby="<id>-title"` on the `<dialog>` |
| `size` | `size` (setting) | enum | `sm` `md` `lg` `full` | `md` | no | no | `data-size` on the `<dialog>` (default printed) |
| `defaultOpen` | `default_open` | boolean | `true` `false` | `false` | no | no | `data-default-open=""` on the `<dialog>` when true; never `open` |
| `open` | none (React only) | boolean | `true` `false` | none | no | no | no attribute; assigned as the property `open` of `rp-dialog` through `useElement` |
| `onOpenChange` | none (React only) | callback | `(open: boolean, detail: OpenChangeDetail) => void` | none | no | no | no attribute; listener for `openchange` through `useElement` |

`class` (React: `className`) and rest props / `attributes` apply to the `rp-dialog` root.

Title (`DialogTitle`) and description (`DialogDescription`), same table for both:

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `dialog` | `dialog` | id | the `id` of the Dialog | none | yes | no | title: `id="<dialog>-title"`; description: `id="<dialog>-description"` |

Header, body and footer have no props other than `class` and rest props / `attributes`.

### Content model

`parts` - the children of `Dialog` are its own parts only: `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogBody`, `DialogFooter`, in the order of nesting rule 2. `DialogTitle` and `DialogDescription` take text (phrasing content). `DialogHeader` takes one `DialogTitle` and at most one IconButton. `DialogBody` takes any flow content. `DialogFooter` takes Buttons.

### HTML contract

Fixture `default` (`id="size-guide"`; title "Size guide"):

```html
<rp-dialog class="rp-dialog" data-slot="rp-dialog">
  <dialog class="rp-dialog-panel" id="size-guide" data-size="md" aria-labelledby="size-guide-title" closedby="any">
    <h2 class="rp-dialog-title" id="size-guide-title">Size guide</h2>
  </dialog>
</rp-dialog>
```

Fixture `composed` (`id="remove-item"`, `size="lg"`; header with title and a closer, description, body, footer):

```html
<rp-dialog class="rp-dialog" data-slot="rp-dialog">
  <dialog class="rp-dialog-panel" id="remove-item" data-size="lg" aria-labelledby="remove-item-title" closedby="any">
    <div class="rp-dialog-header">
      <h2 class="rp-dialog-title" id="remove-item-title">Remove item</h2>
      <button type="button" commandfor="remove-item" command="close" aria-label="Close">x</button>
    </div>
    <p class="rp-dialog-description" id="remove-item-description">This removes the item from your cart.</p>
    <div class="rp-dialog-body">
      <p>Linen shirt, size M</p>
    </div>
    <div class="rp-dialog-footer">
      <button type="button" commandfor="remove-item" command="close">Cancel</button>
    </div>
  </dialog>
</rp-dialog>
```

Fixture `default-open` (`id="promo"`, `defaultOpen`):

```html
<rp-dialog class="rp-dialog" data-slot="rp-dialog">
  <dialog class="rp-dialog-panel" id="promo" data-size="md" aria-labelledby="promo-title" closedby="any" data-default-open="">
    <h2 class="rp-dialog-title" id="promo-title">Welcome</h2>
  </dialog>
</rp-dialog>
```

Fixture `invalid-enum-falls-back` (`id="d1"`, `size="huge"`):

```html
<rp-dialog class="rp-dialog" data-slot="rp-dialog">
  <dialog class="rp-dialog-panel" id="d1" data-size="md" aria-labelledby="d1-title" closedby="any">
    <h2 class="rp-dialog-title" id="d1-title">Title</h2>
  </dialog>
</rp-dialog>
```

Fixture `class` (`id="d2"`, `class="custom-a custom-b"` on the root, `class="custom-c"` on the title):

```html
<rp-dialog class="rp-dialog custom-a custom-b" data-slot="rp-dialog">
  <dialog class="rp-dialog-panel" id="d2" data-size="md" aria-labelledby="d2-title" closedby="any">
    <h2 class="rp-dialog-title custom-c" id="d2-title">Title</h2>
  </dialog>
</rp-dialog>
```

The server MUST NOT print on the `<dialog>`: `open`, `hidden`, `role`, `aria-modal`, `aria-hidden`, `tabindex`. The server MUST NOT print on `rp-dialog`: `id`, `open`, any `aria-*`.

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `open` | panel (`<dialog>`) | browser (`showModal()` / `close()`, called by Invoker Commands, the polyfill, `rp-dialog`, Escape, light dismiss) | while the dialog is open | absent |
| `data-default-open` | panel | server | prop `defaultOpen` is true | `""` when true, otherwise absent |
| `aria-haspopup="dialog"`, `aria-controls="<id>"` | an `a[data-rp-open="<id>"]` opener anywhere in the document | element (the opener listener of the runtime, `04-elements.md` 3.4; once, after `rp-dialog` is defined) | the link targets this dialog | absent |

`rp-dialog` writes no attribute on itself or on any descendant (`04-elements.md` 9.1 item 8).

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

(The link opener attributes are covered by the global entry `GLOBAL_UPGRADE_ALLOW`, `02-html-contract.md` 7.3 entry 1.)

### Behaviour with JavaScript

1. A click on any `<button commandfor="<id>" command="show-modal">` opens the dialog with `showModal()`. Natively in browsers with Invoker Commands; through the polyfill of `04-elements.md` 3.3 elsewhere.
2. A click on any `<button commandfor="<id>" command="close">` closes it.
3. An unmodified primary click on any `<a href data-rp-open="<id>">` (printed by the `dialog` prop of Link, Button or IconButton) opens it and does not navigate; a modified click (Ctrl, Meta, Shift, Alt, middle button) navigates (D-009).
4. Escape closes it. A press on the backdrop closes it (`closedby="any"`; in browsers without `closedby`, `rp-dialog` closes it when the click target is the `<dialog>` itself and the pointer is outside the dialog's box).
5. Every open and every close dispatches `openchange` on the `rp-dialog` root with `detail.value` (`true` or `false`) and `detail.reason` (one of `trigger-press`, `close-press`, `escape-key`, `outside-press`, `link-press`, `imperative`). The event does not bubble and is cancelable. A cancelled event puts the dialog back in its previous state.
6. With `data-default-open` the element calls `showModal()` once when it connects; `openchange` fires with `value: true`, reason `imperative`.
7. While the dialog is open the rest of the page is inert (browser behaviour of `showModal()`). Feedback raised while it is open MUST be rendered inside it: a FormMessage with `role="alert"`, or an announcement through `announce(text, { from })`, which writes into the first `[data-rp-part="status"]` element inside the open dialog (D-079). Code MUST NOT call `toast()` while `document.querySelector("dialog:modal")` is not `null` (D-008 item 7).
8. Navigation (D-008 item 6 as amended): when the browser has the Navigation API, a `navigate` event that has a `sourceElement` (a link or a form started it) closes the dialog with reason `link-press`. A `navigate` event without a `sourceElement` (`history.pushState` and `history.replaceState`, as called by `rp-live`) does NOT close it. Without the Navigation API the element closes an open dialog only on `pagehide` with `persisted === true` (reason `link-press`), so that a back/forward-cache restore does not show a stale open dialog (D-131). The exact conditions are in `04-elements.md` 9.1 item 7.
9. After close, focus is on the opener. If the opener was replaced by a node with the same `id`, focus goes to that node.
10. The body scrolls when the content is taller than `100dvh` minus the margins; header and footer stay visible.
11. Page scroll behind the dialog is not locked by Ripple. The component CSS MUST NOT set `overflow` on `<html>` or `<body>`.

Items 1 to 9 are implemented by the browser and by `src/elements/rp-dialog.ts` (`04-elements.md` 9.1); this component adds no code.

### Behaviour without JavaScript

- Browser with Invoker Commands: fully working. Buttons open and close the modal dialog; Escape and (where `closedby` is supported) a backdrop press close it. No event is dispatched.
- Browser without Invoker Commands: the opener button does nothing; the dialog stays closed and its content is not reachable. This is why the level is `degraded`.
- Therefore: content that MUST be reachable without JavaScript MUST NOT exist only in a Dialog. When the dialog has a page equivalent, the opener MUST be `<a href="<page>" data-rp-open="<id>">`, written as a Link (or a Button or IconButton with `href`) with the prop `dialog="<id>"` (D-009); without JavaScript the link navigates to the page.
- No control is marked `data-rp-js`. Nothing is hidden by Ripple CSS: a closed `<dialog>` is hidden by the browser.
- `defaultOpen` has no effect without JavaScript (the dialog stays closed).
- Manifest: `noJs.level: "degraded"`, `noJs.behavior: "With Invoker Commands in the browser the dialog opens and closes with no script. Without them the opener does nothing; an opener with a page equivalent MUST be a link with the dialog prop."`, `noJs.fallbackHref`: absent (the generic Dialog has no page equivalent).

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

The property `open` on the `rp-dialog` element is a live boolean; writing it is silent. To reach the element from the id: `document.getElementById("<id>").parentElement`.

### Accessibility

- Pattern: native `<dialog>` opened with `showModal()` (APG "Dialog (Modal)"); `checkPattern`: `dialog`.
- Accessible name: REQUIRED. From the title through `aria-labelledby="<id>-title"`. A Dialog without a title is a checker error.
- Focus: on open the browser focuses the first focusable element inside the `<dialog>` (an author MAY put the `autofocus` attribute on another control); when nothing is focusable the `<dialog>` itself is focused. Focus cannot leave the dialog while it is open. On close focus returns to the opener.
- Announcements: None. (The browser announces the dialog and its name when it opens.)

| Key | Action |
|---|---|
| Escape | Closes the dialog; focus returns to the opener |
| Tab / Shift+Tab | Moves focus among the controls inside the dialog only |
| Enter or Space on an opener or closer | Opens or closes |

### Styling

- File: `components/dialog/dialog.css` (layer `rp.components`).
- Tokens used: `--container-prose`, `--spacing`, `--radius-surface`, `--color-popover`, `--color-popover-foreground`, `--color-border`, `--color-overlay`, `--color-muted-foreground`, `--shadow-lg`, `--font-heading`, `--rp-heading-weight`, `--text-lg`, `--text-lg--line-height`, `--text-sm`, `--text-sm--line-height`, `--rp-duration-base`, `--rp-duration-slow`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-dialog-width` | `calc(var(--container-prose) * 0.8)` | inline size at `size="md"`; `sm` is 0.75 times, `lg` is 1.5 times this value |
| `--rp-dialog-padding` | `calc(var(--spacing) * 6)` | padding of the panel |
| `--rp-dialog-gap` | `calc(var(--spacing) * 4)` | gap between header, description, body, footer |
| `--rp-dialog-radius` | `var(--radius-surface)` | corner radius of the panel |

| Modifier selector | Sets |
|---|---|
| `.rp-dialog-panel[data-size="sm"]` | `--_inline-size` |
| `.rp-dialog-panel[data-size="lg"]` | `--_inline-size` |
| `.rp-dialog-panel[data-size="full"]` | `--_inline-size`, `--_block-size`, `--_max-inline-size`, `--_max-block-size`, `--_radius` |

Rules specific to this file:

1. `display` is set on the panel ONLY under `[open]`. Setting it on a closed `<dialog>` would show the dialog.
2. No `z-index`: a modal dialog is in the browser's top layer.
3. The backdrop colour is `var(--color-overlay)` on `::backdrop`. In an engine where `::backdrop` does not inherit custom properties (UNVERIFIED which versions; SPIKE-06) the backdrop is transparent; the panel keeps its border and shadow, and the dialog stays modal.
4. Entrance and exit use `@starting-style` and `transition-behavior: allow-discrete`; an engine without them shows and hides the dialog instantly.

Complete file:

```css
/* dialog.css
   Component: Dialog (id `dialog`). Contract: 10-components-interactive.md, "Dialog".
   Root:      <rp-dialog>, class rp-dialog
   Parts:     rp-dialog-panel (<dialog>)
              rp-dialog-header (<div>)
              rp-dialog-title (<h2>)
              rp-dialog-description (<p>)
              rp-dialog-body (<div>)
              rp-dialog-footer (<div>)
   Props:     data-size = sm | md | lg | full   (default md), on rp-dialog-panel
   States:    [open], ::backdrop
   Public:    --rp-dialog-width, --rp-dialog-padding, --rp-dialog-gap, --rp-dialog-radius */
@layer rp.components {
  /* 1. ROOT */
  .rp-dialog {
    /* 1a. public custom properties */
    --rp-dialog-width: calc(var(--container-prose) * 0.8);
    --rp-dialog-padding: calc(var(--spacing) * 6);
    --rp-dialog-gap: calc(var(--spacing) * 4);
    --rp-dialog-radius: var(--radius-surface);
    /* 1b. colour slots */
    --_bg: var(--color-popover);
    --_fg: var(--color-popover-foreground);
    --_border: var(--color-border);
    /* 1c. other private custom properties */
    --_inline-size: var(--rp-dialog-width);
    --_block-size: fit-content;
    --_max-inline-size: calc(100% - var(--spacing) * 8);
    --_max-block-size: calc(100dvh - var(--spacing) * 8);
    --_radius: var(--rp-dialog-radius);
    /* 1d. declarations */
  }

  /* 2. PARTS */
  .rp-dialog-panel {
    box-sizing: border-box;
    flex-direction: column;
    gap: var(--rp-dialog-gap);
    inline-size: var(--_inline-size);
    block-size: var(--_block-size);
    max-inline-size: var(--_max-inline-size);
    max-block-size: var(--_max-block-size);
    margin: auto;
    padding: var(--rp-dialog-padding);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
    background-color: var(--_bg);
    color: var(--_fg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }
  .rp-dialog-header {
    display: flex;
    flex: none;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--rp-dialog-gap);
  }
  .rp-dialog-title {
    flex: 1 1 auto;
    min-inline-size: 0;
    margin: 0;
    font-family: var(--font-heading);
    font-size: var(--text-lg);
    line-height: var(--text-lg--line-height);
    font-weight: var(--rp-heading-weight);
  }
  .rp-dialog-description {
    flex: none;
    margin: 0;
    color: var(--color-muted-foreground);
    font-size: var(--text-sm);
    line-height: var(--text-sm--line-height);
  }
  .rp-dialog-body {
    flex: 1 1 auto;
    min-block-size: 0;
    overflow-y: auto;
  }
  .rp-dialog-footer {
    display: flex;
    flex: none;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: calc(var(--spacing) * 2);
  }

  /* 3. MODIFIERS */
  .rp-dialog-panel[data-size="sm"] {
    --_inline-size: calc(var(--rp-dialog-width) * 0.75);
  }
  .rp-dialog-panel[data-size="lg"] {
    --_inline-size: calc(var(--rp-dialog-width) * 1.5);
  }
  .rp-dialog-panel[data-size="full"] {
    --_inline-size: 100%;
    --_block-size: 100dvh;
    --_max-inline-size: 100%;
    --_max-block-size: 100dvh;
    --_radius: 0;
  }

  /* 4. STATES */
  .rp-dialog-panel[open] {
    display: flex;
  }
  .rp-dialog-panel::backdrop {
    background-color: var(--color-overlay);
  }

  /* 5. MOTION */
  @media (prefers-reduced-motion: no-preference) {
    .rp-dialog-panel {
      opacity: 0;
      translate: 0 calc(var(--spacing) * 2);
      transition-property: opacity, translate, display, overlay;
      transition-duration: var(--rp-duration-base);
      transition-timing-function: var(--ease-out);
      transition-behavior: allow-discrete;
    }
    .rp-dialog-panel[open] {
      opacity: 1;
      translate: 0 0;
      transition-duration: var(--rp-duration-slow);
    }
    .rp-dialog-panel::backdrop {
      opacity: 0;
      transition-property: opacity, display, overlay;
      transition-duration: var(--rp-duration-base);
      transition-timing-function: var(--ease-out);
      transition-behavior: allow-discrete;
    }
    .rp-dialog-panel[open]::backdrop {
      opacity: 1;
    }
    @starting-style {
      .rp-dialog-panel[open] {
        opacity: 0;
        translate: 0 calc(var(--spacing) * 2);
      }
      .rp-dialog-panel[open]::backdrop {
        opacity: 0;
      }
    }
  }

  /* 6. ENVIRONMENT */
  @media (forced-colors: active) {
    .rp-dialog-panel {
      border-color: CanvasText;
    }
  }
}
```

### Host notes

- HTML: copy the contract. Load `ripple.js` or `ripple.elements.js` (`04-elements.md` section 5). Put the opener anywhere; it is the Button contract of `09-components-foundation.md`, fixture `dialog-opener`: `<button class="rp-button" type="button" commandfor="size-guide" command="show-modal" data-variant="link" data-size="md">Size guide</button>`.
- React: `export function Dialog(props: DialogProps): JSX.Element`, plus `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogBody`, `DialogFooter`, all in `dialog.tsx`. The code of `Dialog` and `DialogTitle` is in `06-bindings.md` 6.6 and MUST be used unchanged; the other four parts follow the `DialogTitle` pattern (`DialogDescription` prints `<p className="rp-dialog-description" id={`${dialog}-description`}>`; header, body, footer print a `<div>` with their class and children). Controlled prop: `open`. Callback: `onOpenChange(open, detail)`. When `open` is passed the binding calls `event.preventDefault()` on every `openchange` and re-applies `open` from React state (R-5). Hand-written below the generated header region (D-072). The file starts with `"use client"` (it calls `useElement`). `suppressHydrationWarning` on `rp-dialog` and on the `<dialog>`. The file exports the six components and their props types (`OpenChangeDetail` and `<Component>Props`, as `06-bindings.md` 6.6 prints them) and nothing else; recipe N "components only" counts these type exports as allowed (D-134 item 10).
- Remix: generated; code in `06-bindings.md` 7.6. Prints `data-rmx-key="<id>"` on `rp-dialog` and `data-rmx-preserve-attrs="open"` on the `<dialog>`. No `open`, no callbacks.
- Liquid: six block files, generated: `dialog`, `dialog-header`, `dialog-title`, `dialog-description`, `dialog-body`, `dialog-footer`. The code of `blocks/dialog.liquid` and `blocks/dialog-title.liquid` is in `06-bindings.md` 8.6. Schema settings: `size` (root only); label keys per G-8. Locale keys for strings the component prints: none (the author writes all text). Each block accepts `class` and `attributes`; `{{ attributes }}` is printed last in the start tag (G-13).

```tsx
import { Button } from "./button";
import { IconButton } from "./icon-button";
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogTitle } from "./dialog";

export function SizeGuide() {
  return (
    <>
      <Button variant="outline" commandFor="size-guide" command="show-modal">Size guide</Button>
      <Dialog id="size-guide" size="lg">
        <DialogHeader>
          <DialogTitle dialog="size-guide">Size guide</DialogTitle>
          <IconButton icon="close" ariaLabel="Close" commandFor="size-guide" command="close" />
        </DialogHeader>
        <DialogBody>
          <p>Measure across the chest.</p>
        </DialogBody>
        <DialogFooter>
          <Button commandFor="size-guide" command="close">Done</Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
```

```liquid
{% block 'button', variant: 'outline', command_for: 'size-guide', command: 'show-modal' %}Size guide{% endblock %}
{% block 'dialog', id: 'size-guide', size: 'lg' %}
  {% block 'dialog-header' %}
    {% block 'dialog-title', dialog: 'size-guide' %}Size guide{% endblock %}
    {% block 'icon-button', icon: 'close', aria_label: 'Close', command_for: 'size-guide', command: 'close' %}{% endblock %}
  {% endblock %}
  {% block 'dialog-body' %}
    <p>Measure across the chest.</p>
  {% endblock %}
  {% block 'dialog-footer' %}
    {% block 'button', command_for: 'size-guide', command: 'close' %}Done{% endblock %}
  {% endblock %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`bridge` (and the accessibility tree). Bridge component: `rp-dialog`. Actions: `open`, `close` (no arguments). Confirm: none. Secret: none. A browser agent that does not use the bridge opens the dialog by activating the opener button or link and reads it as a modal dialog named by its title.

### Checker rules

- RP104: `id` missing on `Dialog` (source) or on the `<dialog>` inside `rp-dialog.rp-dialog` (HTML); `dialog` prop missing on a title or description.
- RP113 with these manifest `rules[]` entries (component rules have kebab-case ids, live in the manifest and are reported as `RP113 [<rule id>]`, D-059; `dialog-needs-title` is fixed by D-084 and used by eval task T08, D-061):
  - `dialog-needs-title`: kind `requires-descendant`, selector `rp-dialog.rp-dialog`, target `.rp-dialog-title`. Message: "A Dialog has no title, so it has no accessible name." Fix: "Add a dialog-title part with dialog set to the Dialog id."
  - `dialog-not-open-in-server-html`: kind `forbids-descendant`, selector `rp-dialog`, target `dialog[open]`. Message: "A <dialog> is printed with the open attribute, which shows it as a non-modal box before JavaScript runs." Fix: "Remove open and pass defaultOpen (Liquid: default_open: true)."
  - `dialog-one-title`: kind `max-count`, selector `rp-dialog.rp-dialog .rp-dialog-title`, count `1`. Message: "A Dialog has more than one title." Fix: "Keep one dialog-title."
  - `dialog-not-nested`: kind `forbids-ancestor`, selector `rp-dialog`, target `dialog, a, button, label, [popover]`. Message: "A Dialog is inside a dialog, link, button, label or popover." Fix: "Move the Dialog to the end of the page body; openers find it by id."
- RP114: the title id MUST equal `<dialog id>-title`; ids unique in the document.
- RP204: a Dialog root inside a link or a clickable card.
- RP304 (warning): a component with `noJs.level: "full"` placed only inside a Dialog.
- Fixture lint `a-4`: `open` or `aria-hidden` on `<dialog>`; `aria-expanded` on a `commandfor` button.

### Acceptance tests

1. T2: fixtures `default`, `composed`, `default-open`, `invalid-enum-falls-back`, `class` are canonical-equal in `html`, `react`, `remix`, `liquid`.
2. T3: fixtures `default` and `composed` produce zero mutation records inside the root after `rp-dialog` is defined. Fixture `default-open` produces exactly one record: attribute `open` added on the `<dialog>`.
3. T3: `getBoundingClientRect()` of `rp-dialog` has width 0 and height 0 before and after upgrade; the closed `<dialog>` has computed `display: none`.
4. T5: with a button `commandfor="size-guide" command="show-modal"` on the page, a click makes `dialog.matches(":modal")` true and dispatches exactly one `openchange` with `detail.value === true` and `detail.reason === "trigger-press"`.
5. T5: Escape closes the dialog; `openchange` has `value === false`, `reason === "escape-key"`; `document.activeElement` is the opener.
6. T5: a click at viewport coordinates (5, 5) while the dialog is open closes it with reason `outside-press`.
7. T5: a listener that calls `preventDefault()` on `openchange` keeps the dialog closed after an opener click.
8. T5 (CSS): at viewport 1000 by 700 with `size="md"` and the default tokens, the open panel is 538 px wide and horizontally centred (left edge 231 px), computed `display` is `flex`, and the `::backdrop` computed `background-color` equals the computed `--color-overlay`. With `size="full"` the panel box is 0, 0, 1000, 700.
9. T5 (CSS): in fixture `composed` the closer's right edge is within 1 px of the panel's content-box right edge, and its top edge equals the title's top edge.
10. T4 (React): hydration of `default` and `default-open` logs no warning; with `open={false}` and an `onOpenChange` that does not update state, an opener click leaves the dialog closed and calls the callback once with `(true, detail)`.
11. T4 (Remix): when a `data-rp-region` element inside the `DialogBody` of an open dialog is replaced by a region refresh (the `html` strategy, which is the Remix default, D-090), the dialog is still open (`dialog.open === true`) and no `openchange` fires. When a link inside the open dialog starts a morph navigation (Chromium, Navigation API present), the dialog closes and `openchange` fires with `reason === "link-press"`.
12. T6: with JavaScript disabled in Chromium (Invoker Commands present), a click on the opener makes `dialog.open === true`; Escape closes it.
13. T9: tests 4, 5 and 6 pass in WebKit and Gecko with `ripple.js` loaded (polyfill and light-dismiss fallback).
14. T5: `checkPattern(document.getElementById("size-guide"), "dialog")` from `@ui-sdk/core/testing` resolves while the dialog is open.

### Evidence and UNVERIFIED

- Evidence: `00-decisions.md` D-008, D-009, D-020, D-021, D-036, D-079, D-080, D-084; `ripple/docs/04-elements.md` 9.1, 10.1 (element behaviour, verified in `ripple/docs/research/spikes/elements-runtime/results-test.txt`, `results-dialog2.txt`); `ripple/docs/06-bindings.md` 6.6, 7.6, 8.6 (binding code); `ripple/docs/07-manifest-registry-cli.md` 1.7.2 (manifest entry); `ripple/theme/snippets/command-polyfill.liquid`; `ripple/theme/assets/s-dialog.js`; `uisdk/packages/core/src/testing/check-pattern.ts` (pattern name `dialog`); CSS rendered in Chromium 157 (`ripple/docs/research/spikes/components-interactive/css-test.mjs`: panel 538 px at `md`, full-size box, backdrop colour).
- UNVERIFIED: `checkPattern(..., "dialog")` against a native `<dialog>` (it was run only against `ui-dialog`). It gates a test, not the contract (D-108): AT-14 settles it; if AT-14 fails, set manifest `a11y.checkPattern` to `null` and mark AT-14 as removed (the numbers of the other tests do not change). `closedby` support and `::backdrop` custom property inheritance in WebKit and Gecko at the floor (SPIKE-06; AT-13 and AT-8 settle them). React 19 and Remix 3 printing `commandfor`, `command` and `closedby` unchanged (SPIKE-05; AT-1 settles it).

### Fallback (SPIKE-05)

This subsection is the ONLY place where a `<button>` carries `data-rp-open` or `data-rp-close`. On the default path neither attribute is ever printed on a `<button>`, and `data-rp-close` is never printed at all (`00-decisions.md` 4.4).

When SPIKE-05 finds that a host does not print `commandfor` / `command` unchanged, or that the polyfill fails in WebKit or Gecko:

1. The Dialog contract does not change.
2. Button and IconButton (`09-components-foundation.md`) additionally print `data-rp-open="<id>"` when `command` is `show-modal` and `data-rp-close="<id>"` when `command` is `close`, on the same element that carries `commandfor`.
3. The runtime opener listener (`04-elements.md` Fallback (SPIKE-05)) handles clicks on `[data-rp-open]` and `[data-rp-close]` for buttons as well as links. `data-rp-close` is listed in `00-decisions.md` 4.4 for this path only.
4. Acceptance tests 4 to 7, 12 and 13 are unchanged.

SPIKE-04 (root-only primitive) and SPIKE-06 (`closedby`) do not change this contract: the SPIKE-04 fallback replaces only the implementation of `rp-dialog`; the `closedby` fallback (backdrop click handled by `rp-dialog`) is already part of the default path.

---
