# Popover

> Component spec. Group doc: [10-components-interactive.md](../10-components-interactive.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `popover` |
| Kind | `static` |
| Category | `overlays` |
| Custom elements | none |
| Root element and class | `div` `.rp-popover` |
| Liquid tier | `parts` |
| No-JS level | `degraded` |
| Requires `id` | yes |
| Depends on | `button`, `icon-button` (openers written by the author) |
| Milestone | M2 |

### Purpose

A small non-modal panel that opens next to the button that controls it and closes on Escape or on a press outside. It is the native `popover` attribute plus CSS; Ripple ships no JavaScript for it (D-010). There is no Menu component in V1 (D-018): an action list is a Popover that contains links or buttons.

- Use when: a short piece of secondary content or a short list of links and actions belongs to one button (shipping details, a sort list, an account menu, order actions).
- Do not use when: the content needs the user's full attention or contains a long form (use Dialog); the panel is tall or attached to a screen edge (use Drawer); the content is a one-line hint for a control (use Tooltip); the items are site navigation with sublevels (use NavigationMenu).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Popover` | `blocks/popover.liquid` | `div` | `rp-popover` | none | yes | `<id>` |
| title | `PopoverTitle` | `blocks/popover-title.liquid` | `p` | `rp-popover-title` | none | no | none |

Nesting rules:

1. The root carries the `id` and the `popover` attribute with the empty value (`popover=""`, written bare in this document, G-2; D-010 item (b)).
2. The title, when present, MUST be the first child of the root and MUST appear at most once. It is a visual heading only; it is not referenced by any ARIA attribute.
3. Everything else inside the root is free flow content: text, Links, Buttons, a LinkList, form controls.
4. A Popover root MUST NOT be inside an `<a>`, a `<button>` or a `<label>`. It MAY be inside a `<dialog>` and inside another Popover (the browser keeps the outer one open).
5. A Popover MUST NOT contain a Dialog or Drawer root (`dialog-not-nested`, `drawer-not-nested`).
6. The opener is not a part: it is a Button or IconButton with `popoverTarget="<id>"` (Liquid `popover_target`), placed by the author directly BEFORE the root in document order whenever the layout allows it, so that the keyboard order is opener, then panel content. There is no `PopoverTrigger` export.

### Props

Root (`Popover`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | yes | no | `id` on the root |
| `side` | `side` (setting) | enum | `top` `bottom` `start` `end` | `bottom` | no | no | `data-side` on the root (default printed) |
| `align` | `align` (setting) | enum | `start` `center` `end` | `start` | no | no | `data-align` on the root (default printed) |

The title has no props other than `class` and rest props / `attributes`.

### Content model

`flow` - any flow content, optionally preceded by one `PopoverTitle`. `PopoverTitle` takes text.

### HTML contract

Fixture `default` (`id="shipping-info"`; one paragraph):

```html
<div class="rp-popover" id="shipping-info" popover="" data-side="bottom" data-align="start">
  <p>Free shipping on orders over $50.</p>
</div>
```

Fixture `title` (`id="shipping-info"`; title and one paragraph):

```html
<div class="rp-popover" id="shipping-info" popover="" data-side="bottom" data-align="start">
  <p class="rp-popover-title">Shipping</p>
  <p>Free shipping on orders over $50.</p>
</div>
```

Fixture `placement` (`id="order-actions"`, `side="top"`, `align="end"`):

```html
<div class="rp-popover" id="order-actions" popover="" data-side="top" data-align="end">
  <p>Actions</p>
</div>
```

Fixture `invalid-enum-falls-back` (`id="w1"`, `side="bogus"`):

```html
<div class="rp-popover" id="w1" popover="" data-side="bottom" data-align="start">
  <p>Text</p>
</div>
```

Fixture `class` (`id="w2"`, `class="custom-a custom-b"`):

```html
<div class="rp-popover custom-a custom-b" id="w2" popover="" data-side="bottom" data-align="start">
  <p>Text</p>
</div>
```

The opener, written by the author outside the root (shown for reference; it is not part of any Popover fixture):

```html
<button type="button" class="rp-button" popovertarget="shipping-info">Shipping</button>
```

The server MUST NOT print on the root: `hidden`, `open`, `role`, `aria-hidden`, `aria-labelledby`, `tabindex`, or `popover` with the value `manual`. The server MUST NOT print on the opener: `aria-expanded`, `aria-haspopup`, `aria-controls` (`02-html-contract.md` I-2: the browser exposes the expanded state of a `popovertarget` button).

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| none (the open state is the pseudo-class `:popover-open`; no attribute changes) | root | browser | while the popover is shown | not applicable |

Upgrade allow-list (mutations permitted when the element upgrades):

```json
[]
```

### Behaviour with JavaScript

Identical to "Behaviour without JavaScript": no Ripple script reads or writes a Popover. The only script that can be involved is the Invoker Commands polyfill of `04-elements.md` 3.3, and only when the opener uses `commandfor` with `command="toggle-popover"`, `"show-popover"` or `"hide-popover"` instead of `popovertarget`. Authors MUST prefer `popovertarget`, which needs no polyfill.

### Behaviour without JavaScript

1. A press on the opener toggles the panel. The panel is shown in the top layer.
2. Escape, a press outside the panel, or opening another auto popover that is not nested inside this one closes it. A button inside the panel with `popovertarget="<id>"` and `popovertargetaction="hide"` closes it.
3. Position, in browsers with CSS anchor positioning: the panel is placed against its implicit anchor, which is the button that opened it. `data-side` chooses the edge of the button (`top`, `bottom`: block axis; `start`, `end`: inline axis, mirrored in a right-to-left document). `data-align` chooses the alignment along that edge (`start`: start edges aligned; `center`: centred; `end`: end edges aligned). The gap to the button is `--rp-popover-offset`. When the panel does not fit, the browser tries the opposite side, then the opposite alignment, then both (`position-try-fallbacks`).
4. Position, in browsers without CSS anchor positioning (the rules are inside `@supports (anchor-name: --a)`): the user-agent default applies and the panel is centred in the viewport. It stays fully usable.
5. In a browser without the `popover` attribute the panel is ordinary in-flow content, always visible, and the opener button is present and does nothing; there is no polyfill (D-081, the capability tier for this feature). Content is readable; nothing is hidden. According to public compatibility tables (not run, UNVERIFIED) this includes browsers inside the floor of D-032: the attribute arrived in Chrome 114, Safari 17.0 and Firefox 125, and the floor is Chrome 111, Safari 16.4, Firefox 128. The floor is not raised; raising it is open question Q15 of `00-decisions.md` section 10. Because of this, a Popover MUST NOT contain content that is harmful when always visible (for example a second copy of a form with the same field ids).
6. Entrance and exit: opacity fade of `--rp-duration-base`, only inside `@supports selector(:popover-open)` and `prefers-reduced-motion: no-preference`.
7. No control is marked `data-rp-js`.
8. Manifest: `noJs.level: "degraded"`, `noJs.behavior: "Opens and closes natively with no script. Without CSS anchor positioning the panel is centred in the viewport instead of placed next to its button. Without the Popover API the panel is always-visible content in the page flow."`, `noJs.fallbackHref`: absent.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `beforetoggle` (native) | root | `ToggleEvent` with `oldState`, `newState`; cancelable when opening | none |
| event | `toggle` (native) | root | `ToggleEvent` with `oldState`, `newState` | none |
| command | `popovertarget="<id>"` with optional `popovertargetaction="toggle" \| "show" \| "hide"` | a `<button>` | none | none |
| command | `toggle-popover`, `show-popover`, `hide-popover` | a `<button commandfor="<id>">` | none | none |
| method | `showPopover()`, `hidePopover()`, `togglePopover()` (native) | root | none | none |

### Accessibility

- Pattern: native popover with a button invoker (disclosure semantics supplied by the browser); `checkPattern`: `null`.
- Accessible name: not applicable. The root has no role and MUST NOT be given `aria-label` or `aria-labelledby`. The opener MUST have an accessible name (text, or `ariaLabel` on IconButton).
- Focus: opening does not move focus; it stays on the opener. The browser inserts the panel's focusable content into the Tab order directly after the opener. When the panel closes while focus is inside it, the browser returns focus to the opener.
- Announcements: None. The browser exposes the opener's expanded state.

| Key | Action |
|---|---|
| Enter or Space on the opener | Toggles the panel |
| Tab from the opener while open | Moves to the first focusable element in the panel |
| Escape | Closes the panel; focus returns to the opener when it was inside the panel |

There is no `role="menu"`, no `role="menuitem"` and no arrow-key roving (D-018). Items in an action list are reached with Tab.

### Styling

- File: `components/popover/popover.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--radius-surface`, `--color-popover`, `--color-popover-foreground`, `--color-border`, `--shadow-md`, `--text-sm`, `--text-sm--line-height`, `--font-weight-semibold`, `--rp-duration-base`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-popover-width` | `calc(var(--spacing) * 80)` | maximum inline size (the panel is as wide as its content up to this value, and never wider than the viewport minus `calc(var(--spacing) * 4)`) |
| `--rp-popover-padding` | `calc(var(--spacing) * 4)` | padding |
| `--rp-popover-offset` | `calc(var(--spacing) * 1)` | gap between the opener and the panel |
| `--rp-popover-radius` | `var(--radius-surface)` | corner radius |

| Modifier selector | Sets |
|---|---|
| `.rp-popover[data-align="center"]` | `--_align-on-block-side`, `--_align-on-inline-side` |
| `.rp-popover[data-align="end"]` | `--_align-on-block-side`, `--_align-on-inline-side` |
| `.rp-popover[data-side="top"]` | `--_area` |
| `.rp-popover[data-side="start"]` | `--_area`, `--_offset-block`, `--_offset-inline` |
| `.rp-popover[data-side="end"]` | `--_area`, `--_offset-block`, `--_offset-inline` |

Rules specific to this file:

1. The file selects `[data-side]` and `[data-align]`, always together with the class `rp-popover`. These are the Popover props `side` and `align` of D-010, not the layout prop of `props.css` (whose `data-align` rules are scoped to layout components, `03-styling-and-tokens.md` 6.2 rule 6); a component selecting its own manifest props is allowed by D-024 item (b) and D-105 item 3 (section 0.3 item 4).
2. The file MUST NOT set `display` on `.rp-popover` (`04-elements.md` 10.16 C-5): the user-agent rule `[popover]:not(:popover-open) { display: none }` keeps a closed panel hidden.
3. Every positioning declaration (`inset`, `margin-block`, `margin-inline`, `position-area`, `position-try-fallbacks`) is inside `@supports (anchor-name: --a)`. Outside it the file MUST NOT set `inset` or `margin`, so the user-agent centring stays in effect.
4. The file sets no `position-anchor` and no `anchor-name`: the implicit anchor of a popover is its invoker.
5. `position-area` uses logical keywords only (`block-start`, `block-end`, `inline-start`, `inline-end`, `span-inline-start`, `span-inline-end`, `span-block-start`, `span-block-end`, `span-all`), so the placement mirrors in a right-to-left document with no extra rule.

Complete file:

```css
/* popover.css
   Component: Popover (id `popover`). Contract: 10-components-interactive.md, "Popover".
   Root:      <div popover>, class rp-popover
   Parts:     rp-popover-title (<p>)
   Props:     data-side  = top | bottom | start | end   (default bottom)
              data-align = start | center | end         (default start)
   States:    :popover-open
   Public:    --rp-popover-width, --rp-popover-padding, --rp-popover-offset, --rp-popover-radius */
@layer rp.components {
  /* 1. ROOT */
  .rp-popover {
    /* 1a. public custom properties */
    --rp-popover-width: calc(var(--spacing) * 80);
    --rp-popover-padding: calc(var(--spacing) * 4);
    --rp-popover-offset: calc(var(--spacing) * 1);
    --rp-popover-radius: var(--radius-surface);
    /* 1b. colour slots */
    --_bg: var(--color-popover);
    --_fg: var(--color-popover-foreground);
    --_border: var(--color-border);
    /* 1c. other private custom properties */
    --_align-on-block-side: span-inline-end;
    --_align-on-inline-side: span-block-end;
    --_area: block-end var(--_align-on-block-side);
    --_offset-block: var(--rp-popover-offset);
    --_offset-inline: 0;
    /* 1d. declarations */
    box-sizing: border-box;
    inline-size: max-content;
    max-inline-size: min(var(--rp-popover-width), calc(100% - var(--spacing) * 4));
    padding: var(--rp-popover-padding);
    border: 1px solid var(--_border);
    border-radius: var(--rp-popover-radius);
    background-color: var(--_bg);
    color: var(--_fg);
    box-shadow: var(--shadow-md);
  }

  /* 2. PARTS */
  .rp-popover-title {
    margin: 0;
    margin-block-end: calc(var(--spacing) * 2);
    font-size: var(--text-sm);
    line-height: var(--text-sm--line-height);
    font-weight: var(--font-weight-semibold);
  }

  /* 3. MODIFIERS */
  .rp-popover[data-align="center"] {
    --_align-on-block-side: span-all;
    --_align-on-inline-side: span-all;
  }
  .rp-popover[data-align="end"] {
    --_align-on-block-side: span-inline-start;
    --_align-on-inline-side: span-block-start;
  }
  .rp-popover[data-side="top"] {
    --_area: block-start var(--_align-on-block-side);
  }
  .rp-popover[data-side="start"] {
    --_area: inline-start var(--_align-on-inline-side);
    --_offset-block: 0;
    --_offset-inline: var(--rp-popover-offset);
  }
  .rp-popover[data-side="end"] {
    --_area: inline-end var(--_align-on-inline-side);
    --_offset-block: 0;
    --_offset-inline: var(--rp-popover-offset);
  }

  /* 4. STATES */

  /* 5. MOTION */
  @media (prefers-reduced-motion: no-preference) {
    @supports selector(:popover-open) {
      .rp-popover {
        opacity: 0;
        transition-property: opacity, display, overlay;
        transition-duration: var(--rp-duration-base);
        transition-timing-function: var(--ease-out);
        transition-behavior: allow-discrete;
      }
      .rp-popover:popover-open {
        opacity: 1;
      }
      @starting-style {
        .rp-popover:popover-open {
          opacity: 0;
        }
      }
    }
  }

  /* 6. ENVIRONMENT */
  @supports (anchor-name: --a) {
    .rp-popover {
      inset: auto;
      margin-block: var(--_offset-block);
      margin-inline: var(--_offset-inline);
      position-area: var(--_area);
      position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
    }
  }
  @media (forced-colors: active) {
    .rp-popover {
      border-color: CanvasText;
    }
  }
}
```

### Host notes

- HTML: copy the contract. No script is needed for a `popovertarget` opener.
- React: `export function Popover(props: PopoverProps): JSX.Element` and `export function PopoverTitle(props: PopoverTitleProps): JSX.Element` in `popover.tsx`, generated (kind `static`, D-072), static pattern of `06-bindings.md` 6.4. The root prints `popover=""`. No `"use client"`, no hook, no controlled prop, no callback. The opener is `<Button popoverTarget="<id>">` (React spelling; `06-bindings.md` 6.3).
- Remix: generated, static pattern of `06-bindings.md` 7.4. The Remix source writes `popover={true}`: Remix types the attribute as `'auto' | 'hint' | 'manual' | boolean` (`remix/packages/component/src/runtime/dom.ts`), so `popover=""` is a TypeScript error there; `popover` is not a `data-*` or `aria-*` name, so the server prints the bare attribute `popover`, which parses equal to the fixture's `popover=""`. It prints no `data-rmx-key` (the root is a `div`, not a custom element, G-11) and no `data-rmx-preserve-attrs` (the open state is not an attribute). Opener: `<Button popoverTarget="<id>">`.
- Liquid: two block files, generated: `popover`, `popover-title`. Schema settings: `side`, `align` (root only); label keys per G-8. `{{ attributes }}` is printed last (G-13). Guards (L-15): `assign allowed_side = 'top,bottom,start,end' | split: ','` with fallback `'bottom'`; `assign allowed_align = 'start,center,end' | split: ','` with fallback `'start'`. Locale keys for strings the component prints: none. Opener: `{% block 'button', popover_target: '<id>' %}`.

```tsx
import { Button } from "./button";
import { Link } from "./link";
import { Popover, PopoverTitle } from "./popover";

export function ShippingInfo() {
  return (
    <>
      <Button variant="outline" popoverTarget="shipping-info">Shipping</Button>
      <Popover id="shipping-info" side="bottom" align="start">
        <PopoverTitle>Shipping</PopoverTitle>
        <p>Free shipping on orders over $50.</p>
        <Link href="/policies/shipping-policy">Shipping policy</Link>
      </Popover>
    </>
  );
}
```

```liquid
{% block 'button', variant: 'outline', popover_target: 'shipping-info' %}Shipping{% endblock %}
{% block 'popover', id: 'shipping-info', side: 'bottom', align: 'start' %}
  {% block 'popover-title' %}Shipping{% endblock %}
  <p>Free shipping on orders over $50.</p>
  {% block 'link', href: '/policies/shipping-policy' %}Shipping policy{% endblock %}
{% endblock %}
```

`blocks/popover.liquid` markup (between the guards and the schema), complete:

```liquid
<div class="rp-popover {{ class | escape }}" id="{{ id | escape }}" popover="" data-side="{{ side }}" data-align="{{ align }}" {{ attributes }}>{{ content }}</div>
```

### Commerce

None.

### Agent surface

`accessibility-tree`. Bridge component: none. Actions: none. Confirm: none. Secret: none. An agent opens the panel by activating the opener button and reads the panel content that follows it.

### Checker rules

- RP104: `id` missing on `Popover` (source) or on `.rp-popover` (HTML).
- RP101: `side` or `align` outside its enumeration.
- RP113 with these manifest `rules[]` entries:
  - `popover-needs-popover-attribute`: kind `requires-attribute`, selector `.rp-popover`, target `popover` (an attribute name). Message: "An element with class rp-popover has no popover attribute, so it is always visible." Fix: "Add the bare popover attribute, or use the Popover component."
  - `popover-one-title`: kind `max-count`, selector `.rp-popover > .rp-popover-title`, count `1`. Message: "A Popover has more than one title." Fix: "Keep one popover-title."
  - `popover-title-in-popover`: kind `requires-ancestor`, selector `.rp-popover-title`, target `.rp-popover`. Message: "A popover-title is outside a Popover." Fix: "Move it inside the Popover."
- RP114: the `id` MUST be unique in the document.
- RP204: a Popover root inside `a[href]` or `button`.
- RP304 (warning): a component with `noJs.level: "full"` placed only inside a Popover.
- Fixture lint `a-4`: `aria-expanded` on a `popovertarget` button; `hidden` on a `[popover]` element.

### Acceptance tests

1. T2: fixtures `default`, `title`, `placement`, `invalid-enum-falls-back`, `class` are canonical-equal in `html`, `react`, `remix`, `liquid`.
2. T3: zero mutation records inside the root for every fixture after `ripple.js` has loaded.
3. T6 (scripting disabled, Chromium): with `<button popovertarget="shipping-info">` before the root, a click makes `root.matches(":popover-open")` true; Escape makes it false; a second click on the button after reopening makes it false.
4. T6: a click at a point outside the panel and outside the button closes the panel.
5. T5 (CSS, Chromium, viewport 1000 by 700, button box left 400, top 300, width 100, height 40, default tokens): with `side="bottom" align="start"` the panel's left edge equals the button's left edge (400) and its top edge equals the button's bottom edge plus 4 (344). With `side="top" align="end"` the panel's right edge equals the button's right edge (500) and its bottom edge is 296. With `side="end" align="center"` the panel's left edge is 504 and its vertical centre equals the button's vertical centre (320) within 1 px.
6. T5 (CSS), `<html dir="rtl">`, same button: with `side="bottom" align="start"` the panel's right edge equals the button's right edge; with `side="end"` the panel's right edge equals the button's left edge minus 4.
7. T5 (CSS): with the button at the bottom edge of the viewport (top 650) and `side="bottom"`, the panel's bottom edge is at or above the button's top edge (flip).
8. T5 (CSS): a closed panel has computed `display: none`; an open panel has `max-inline-size` at most 320 px with the default tokens.
9. T5: while the panel is open, pressing Tab on the opener moves `document.activeElement` to the first link inside the panel.
10. T4 (React): hydration of `default` logs no warning and the server HTML contains `popover=""`.
11. T9: tests 3, 4 and 9 pass in WebKit and Gecko. Tests 5 to 7 run only where `CSS.supports("anchor-name: --a")` is true; where it is false the test asserts instead that the open panel's box is inside the viewport.

### Evidence and UNVERIFIED

- Evidence: `00-decisions.md` D-010, D-018, D-032, D-081; `ripple/docs/04-elements.md` 10.3, 10.5, 10.16 C-5; `ripple/docs/06-bindings.md` 6.3 (`popoverTarget` prints `popovertarget` in React 19.3.1), 6.4 (Button prop `popoverTarget`); Chromium 157 runs in `ripple/docs/research/spikes/components-interactive/t.mjs` (implicit anchor of a `popovertarget` button) and `popover-placement.mjs` with `results-popover.txt` (the boxes of acceptance tests 5, 6 and 7 for all twelve `side` / `align` combinations in both writing directions).
- UNVERIFIED: React 19 and Remix 3 printing the `popover` attribute with an empty value on a `<div>` (SPIKE-05; AT-10 settles it for React). The first versions of the `popover` attribute (Chrome 114, Safari 17.0, Firefox 125) are from compatibility tables, not run (SPIKE-06, D-081). CSS anchor positioning, implicit anchors and `position-try-fallbacks` outside Chromium (SPIKE-06; AT-11 settles them). Whether a `commandfor` invoker (as opposed to `popovertarget`) becomes the implicit anchor; this is the second reason to prefer `popovertarget`.

### Fallback (SPIKE-05)

When SPIKE-05 finds that React or Remix does not print `popover=""` (for example prints nothing, or prints `popover="true"`):

1. The contract changes in ALL hosts to `popover="auto"` (same behaviour, a value every host can print). The five fixtures are regenerated; nothing else changes.
2. When a host does not print `popovertarget` unchanged, the opener uses `commandfor="<id>" command="toggle-popover"` through Button's `commandFor` / `command` props, and `ripple.js` (the polyfill) becomes REQUIRED for Popover in browsers without Invoker Commands. `noJs.behavior` gains the sentence "In browsers without Invoker Commands the opener needs ripple.js."

### Fallback (SPIKE-06)

When SPIKE-06 finds that CSS anchor positioning is missing at the floor in WebKit or Gecko (expected), the default path already covers it: the `@supports (anchor-name: --a)` block is skipped and the panel is centred in the viewport (D-010, D-081). No custom element is added and the kind stays `static`. If the spike report requires anchored placement in those browsers, the change is the 1 kB positioning routine in the runtime named by the SPIKE-06 fallback of `00-decisions.md` section 3, specified in `04-elements.md`; this contract (the root `div`, its attributes and classes) does not change, and the routine sets only the inline custom properties `--rp-popover-x` and `--rp-popover-y` on the open panel, which a new rule in section 6 of `popover.css` reads under `@supports not (anchor-name: --a)`. No `upgradeAllow` entry is needed for it, because the write happens when the panel opens, not at upgrade.

When SPIKE-06 finds that the `popover` attribute itself is missing at the floor: nothing changes. The behaviour is item 5 of "Behaviour without JavaScript" (D-081); the floor question is Q15.

---
