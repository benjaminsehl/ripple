# Tooltip

> Component spec. Group doc: [10-components-interactive.md](../10-components-interactive.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `tooltip` |
| Kind | `ui` |
| Category | `overlays` |
| Custom elements | `ui-tooltip`, `ui-tooltip-trigger`, `ui-tooltip-content` |
| Root element and class | `ui-tooltip` `.rp-tooltip` |
| Liquid tier | `parts` |
| No-JS level | `none` |
| Requires `id` | yes |
| Depends on | `button`, `icon-button`, `icon` (the trigger written by the author) |
| Milestone | M2 |

### Purpose

A one-line text hint that appears next to a button on hover and on keyboard focus. It is the UI SDK tooltip (`ui-tooltip`), loaded lazily, with the closed state pre-rendered by the server (D-013, D-082).

- Use when: an icon-only or terse button benefits from a short description that is also available somewhere else, or is not needed to complete a task.
- Do not use when: the text is needed to complete a task or must be reachable on touch screens and without JavaScript (print it as visible Text, or use Popover); the hint contains a link, a button or more than one sentence (use Popover); the control is a link (`<a href>`), which V1 does not support as a trigger.

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Tooltip` | `blocks/tooltip.liquid` | `ui-tooltip` | `rp-tooltip` | none | yes | `<id>` |
| trigger | `TooltipTrigger` | `blocks/tooltip-trigger.liquid` | `ui-tooltip-trigger` | none | none | yes | none |
| content | `TooltipContent` | `blocks/tooltip-content.liquid` | `ui-tooltip-content` | `rp-tooltip-content` | `data-slot="tooltip-content"` | yes | `<id>-content` |

Nesting rules:

1. The root contains exactly two children, in this order: the trigger part, then the content part.
2. The trigger part contains exactly ONE element: a Button or IconButton (`09-components-foundation.md`) WITHOUT `href`, which prints a native `<button>`. It MUST NOT be an `<a>` (a Link, or a Button or IconButton with `href`): UI SDK writes `type="button"` on a link trigger at upgrade (a mutation and an invalid attribute; evidence below; D-082 item 2).
3. That button MUST carry `aria-describedby="<id>-content"` and `data-slot="tooltip-trigger"`. Both are printed by the Button or IconButton prop `tooltip="<tooltip id>"` (`09-components-foundation.md`). Passing them through rest props or `attributes` is prohibited. The button MUST have its own accessible name (visible text, or `ariaLabel` on IconButton). The tooltip text MUST NOT be the button's only name (D-013).
4. The content part contains text only. No element children, no links, no buttons.
5. The trigger part (`ui-tooltip-trigger`) has no class and no `data-slot`, because it is `display: contents` (`base.css`) and has no box to style. This is the same exception as `ui-tabs-tab`. The hook `data-slot="tooltip-trigger"` is on the BUTTON inside it (`00-decisions.md` 4.4).
6. A Tooltip root MUST NOT be inside an `<a>`, a `<button>` or a `<label>`.
7. A button that opens a Dialog, Drawer or Popover MAY be a tooltip trigger (it keeps its `commandFor` / `command` or `popoverTarget` props next to `tooltip`).

### Props

Root (`Tooltip`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `id` | `id` | id | matches `^[a-zA-Z][a-zA-Z0-9_-]*$` | none | yes | no | `id` on the root |
| `onOpenChange` | none (React only) | callback | `(open: boolean, detail: { value: boolean; reason: string; source: string }) => void` | none | no | no | no attribute; listener for `openchange` through `useElement` |

Content (`TooltipContent`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `tooltip` | `tooltip` | id | the `id` of the Tooltip | none | yes | no | `id="<tooltip>-content"` on the content |
| `side` | `side` (setting) | enum | `top` `bottom` `start` `end` | `top` | no | no | attribute `side` on the content, ONLY when the value is not `top`. Never `data-side`. |
| `align` | `align` (setting) | enum | `start` `center` `end` | `center` | no | no | attribute `align` on the content, ONLY when the value is not `center`. Never `data-align`. |

The trigger part has no props. `class` and rest props / `attributes` on `Tooltip` apply to `ui-tooltip`; on `TooltipContent` to `ui-tooltip-content`; `TooltipTrigger` accepts neither.

The prop that wires the trigger is on the BUTTON, not on a Tooltip part. It is defined by `09-components-foundation.md` (Button, IconButton) and repeated here because every Tooltip needs it:

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `tooltip` (on Button or IconButton) | `tooltip` | id | the `id` of the Tooltip | none | yes, on the one button inside `TooltipTrigger` | no | `aria-describedby="<tooltip>-content"` and `data-slot="tooltip-trigger"` on the `<button>`; allowed only without `href` |

Why `side` and `align` are not `data-*` attributes and are omitted at their default: they are UI SDK option attributes read by `ui-tooltip-content`. `data-side` and `data-align` are STATE attributes that UI SDK writes on the open content with the side that was actually used after collision handling. Printing them from the server would be overwritten. This is the one exception to the prop-attribute rule of `00-decisions.md` 4.3 (D-082 item 3).

### Content model

`parts` - the children of `Tooltip` are exactly one `TooltipTrigger` and one `TooltipContent`. `TooltipTrigger` takes exactly one Button or IconButton that has `tooltip="<tooltip id>"` and no `href`. `TooltipContent` takes text.

### HTML contract

In every fixture the trigger button is byte-equal to the Button or IconButton contract of `09-components-foundation.md` for the stated props (G-3); doc 09's fixture `tooltip-trigger` of IconButton equals the button of fixture `default` here.

Fixture `default` (`id="size-tip"`; trigger `IconButton` with `icon="info"`, `ariaLabel="Sizing information"`, `tooltip="size-tip"`; content `tooltip="size-tip"`, text "Runs small"):

```html
<ui-tooltip class="rp-tooltip" id="size-tip">
  <ui-tooltip-trigger><button class="rp-icon-button" type="button" data-variant="ghost" data-size="md" aria-label="Sizing information" aria-describedby="size-tip-content" data-slot="tooltip-trigger"><svg class="rp-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg></button></ui-tooltip-trigger>
  <ui-tooltip-content class="rp-tooltip-content" hidden id="size-tip-content" role="tooltip" data-closed data-slot="tooltip-content">Runs small</ui-tooltip-content>
</ui-tooltip>
```

Fixture `placement` (`id="ship-tip"`; trigger `Button` with `tooltip="ship-tip"`, children "Shipping"; content `tooltip="ship-tip"`, `side="bottom"`, `align="start"`):

```html
<ui-tooltip class="rp-tooltip" id="ship-tip">
  <ui-tooltip-trigger><button class="rp-button" type="button" data-variant="primary" data-size="md" aria-describedby="ship-tip-content" data-slot="tooltip-trigger">Shipping</button></ui-tooltip-trigger>
  <ui-tooltip-content class="rp-tooltip-content" side="bottom" align="start" hidden id="ship-tip-content" role="tooltip" data-closed data-slot="tooltip-content">Free over $50</ui-tooltip-content>
</ui-tooltip>
```

Fixture `invalid-enum-falls-back` (`id="w1"`; trigger `Button` with `tooltip="w1"`, children "Label"; content `tooltip="w1"`, `side="bogus"`; the default `top` is used, so no `side` attribute is printed):

```html
<ui-tooltip class="rp-tooltip" id="w1">
  <ui-tooltip-trigger><button class="rp-button" type="button" data-variant="primary" data-size="md" aria-describedby="w1-content" data-slot="tooltip-trigger">Label</button></ui-tooltip-trigger>
  <ui-tooltip-content class="rp-tooltip-content" hidden id="w1-content" role="tooltip" data-closed data-slot="tooltip-content">Text</ui-tooltip-content>
</ui-tooltip>
```

Fixture `class` (`id="w2"`; `class="custom-a custom-b"` on the root; trigger `Button` with `tooltip="w2"`, children "Label"; content `tooltip="w2"`):

```html
<ui-tooltip class="rp-tooltip custom-a custom-b" id="w2">
  <ui-tooltip-trigger><button class="rp-button" type="button" data-variant="primary" data-size="md" aria-describedby="w2-content" data-slot="tooltip-trigger">Label</button></ui-tooltip-trigger>
  <ui-tooltip-content class="rp-tooltip-content" hidden id="w2-content" role="tooltip" data-closed data-slot="tooltip-content">Text</ui-tooltip-content>
</ui-tooltip>
```

All four fixtures have `generated: "upgrade-snapshot"` and are PENDING RE-CAPTURE: the measured run (`ripple/docs/research/spikes/components-interactive/u.mjs`) used a trigger `<button type="button" class="rp-icon-button" aria-label aria-describedby data-slot="tooltip-trigger">` and recorded no mutation; the attributes `data-variant` and `data-size` and the `<svg>` child that the Button and IconButton contracts add were not in that run (UNVERIFIED; AT-2 is the gate and the re-capture). UI SDK reads none of them (`uisdk/packages/web/src/tooltip.ts`), so no mutation is expected.

The server MUST NOT print on the content: `data-open`, `popover`, `style`, `data-side`, `data-align`, `data-instant`, `aria-hidden`. The server MUST NOT print on the trigger button: `aria-expanded`, `aria-haspopup`, `title`, `href`.

Host-owned regions and masks: None.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `hidden` | content | element (UI SDK) | present while closed, removed while open | present |
| `data-closed` | content | element (UI SDK) | present while closed | present |
| `data-open` | content | element (UI SDK) | present while open | absent |
| `popover="manual"` | content | element (UI SDK) | set when the content is first shown (top layer) | absent |
| `style` | content | element (UI SDK) | position, while open | absent |
| `style` (`anchor-name: --ui-anchor-<n>`) | the trigger `<button>` (the caller's Button or IconButton) | element (UI SDK) | while the tooltip is open: UI SDK names the trigger as the CSS anchor (`uisdk/packages/core/src/foundation/platform/anchoring.ts`) and writes `position-anchor: --ui-anchor-<n>` in the content's `style`; removed when it closes. This is a run-time write, not an upgrade mutation, so the upgrade allow-list stays `[]` | absent |
| `data-side`, `data-align` | content | element (UI SDK) | the side and alignment actually used, while open; `data-side` is physical (`top`, `bottom`, `left`, `right`: `side="end"` gave `data-side="right"` in a left-to-right page) | absent |
| `data-instant` | content | element (UI SDK) | the tooltip opened without delay (keyboard focus, or another tooltip was just open) | absent |
| `data-starting-style`, `data-ending-style` | content | element (UI SDK) | one frame at the start of the open transition; during the close transition | absent |

Upgrade allow-list (mutations permitted when the element upgrades):

```json
[]
```

### Behaviour with JavaScript

1. Loading: the `tooltip` chunk (and the `shared` chunk it imports, D-054) is loaded by the lazy loader of `04-elements.md` 3.2 when the document contains a `ui-tooltip` at `DOMContentLoaded` or one is inserted later. Until it has loaded the trigger works as an ordinary button and no tooltip shows.
2. Upgrade writes nothing inside the root (verified for a button trigger with the attributes of the contract).
3. Hover: when the pointer rests on the trigger for 600 ms (UI SDK default `delay`; Ripple sets no `delay` attribute) the content is shown. When another tooltip is open or was open a moment before, the next one opens at once. It closes when the pointer leaves the trigger (UI SDK default `closeDelay` 0).
4. Keyboard focus: the content is shown at once when the trigger receives keyboard focus, and closes on blur.
5. Escape closes the tooltip and does nothing else (it does not close a Dialog that contains the trigger while the tooltip is open; UNVERIFIED, settled by AT-8, D-108).
6. Activating the trigger performs the button's own action (for example `commandfor`) and closes the tooltip.
7. Position: UI SDK places the content in the top layer next to the trigger on `side` with `align`, flips when there is no room, and writes the result as `data-side` / `data-align`. `start` and `end` follow the writing direction.
8. The content has `pointer-events: none`: it cannot be hovered or selected.
9. Motion: an opacity fade of `--rp-duration-fast` through `[data-starting-style]` and `[data-ending-style]`, only under `prefers-reduced-motion: no-preference`.
10. Touch: there is no hover. Whether a tap shows the tooltip through focus is UNVERIFIED and MUST NOT be relied on. The UI SDK option `toggleable` is not used in V1.
11. `openchange` is dispatched on `ui-tooltip` for every open and close.

### Behaviour without JavaScript

- The tooltip never shows. The content stays `hidden`.
- The trigger keeps its accessible name and its own action. Assistive technology still reads the description, because `aria-describedby` references are resolved for hidden elements.
- Sighted users without JavaScript, and touch users, do not see the text. Therefore the tooltip text MUST NOT be the only place where information needed to complete a task appears.
- No control is marked `data-rp-js`.
- Manifest: `noJs.level: "none"`, `noJs.behavior: "The tooltip never shows. The trigger keeps its name and action; the description is still exposed to assistive technology through aria-describedby."`, `noJs.fallbackHref`: absent.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| event | `openchange` | `ui-tooltip` | `{ value: boolean, reason: string, source: string }`; not bubbling. Reasons are UI SDK's: `trigger-hover`, `trigger-focus`, `escape-key` are in its vocabulary (`uisdk/packages/core/src/foundation/kernel/details.ts`). | `onOpenChange(open, detail)` |

No command and no Ripple method. The UI SDK properties and methods of `ui-tooltip` are not part of the Ripple contract and MUST NOT be used by bindings (`04-elements.md` 2.1).

### Accessibility

- Pattern: APG "Tooltip"; `checkPattern`: `null` (the `Pattern` union of `uisdk/packages/core/src/testing/check-pattern.ts` has no tooltip entry).
- Accessible name: the trigger button's own name, REQUIRED. The content has `role="tooltip"` and is the button's DESCRIPTION through `aria-describedby`.
- Focus: never moves. The content is not focusable and contains nothing focusable.
- Announcements: None. Screen readers read the description after the button's name when the button is focused.

| Key | Action |
|---|---|
| Tab to the trigger | Shows the tooltip at once |
| Tab away | Hides the tooltip |
| Escape | Hides the tooltip; focus stays on the trigger |
| Enter or Space | Performs the trigger's own action; hides the tooltip |

### Styling

- File: `components/tooltip/tooltip.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--radius-sm`, `--color-foreground`, `--color-background`, `--text-xs`, `--text-xs--line-height`, `--rp-duration-fast`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-tooltip-max-width` | `calc(var(--spacing) * 64)` | maximum inline size of the content |
| `--rp-tooltip-px` | `calc(var(--spacing) * 2)` | inline padding |
| `--rp-tooltip-py` | `calc(var(--spacing) * 1)` | block padding |
| `--rp-tooltip-radius` | `var(--radius-sm)` | corner radius |

| Modifier selector | Sets |
|---|---|
| none | not applicable |

Rules specific to this file:

1. The colours are inverted on purpose (`--color-foreground` as background): a tooltip must stand out from the surface below it. They are the only colour slots.
2. The file MUST NOT set `display`, `position`, `inset`, `top`, `left` or `translate` on `.rp-tooltip-content`: UI SDK positions the content with inline style and the user-agent popover rules.
3. The file MUST NOT select `[data-side]` or `[data-align]`: there is no arrow in V1, so the placement needs no styling.
4. The root is `display: inline-flex` so that the wrapper does not change the line box of the button it wraps.

Complete file:

```css
/* tooltip.css
   Component: Tooltip (id `tooltip`). Contract: 10-components-interactive.md, "Tooltip".
   Root:      <ui-tooltip>, class rp-tooltip
   Parts:     rp-tooltip-content (<ui-tooltip-content>)
   Props:     none (side and align are UI SDK option attributes, not styled)
   States:    [data-open], [data-closed], [data-starting-style], [data-ending-style]
   Public:    --rp-tooltip-max-width, --rp-tooltip-px, --rp-tooltip-py, --rp-tooltip-radius */
@layer rp.components {
  /* 1. ROOT */
  .rp-tooltip {
    /* 1a. public custom properties */
    --rp-tooltip-max-width: calc(var(--spacing) * 64);
    --rp-tooltip-px: calc(var(--spacing) * 2);
    --rp-tooltip-py: calc(var(--spacing) * 1);
    --rp-tooltip-radius: var(--radius-sm);
    /* 1b. colour slots */
    --_bg: var(--color-foreground);
    --_fg: var(--color-background);
    --_border: transparent;
    /* 1c. other private custom properties */
    /* 1d. declarations */
    display: inline-flex;
  }

  /* 2. PARTS */
  .rp-tooltip-content {
    box-sizing: border-box;
    inline-size: max-content;
    max-inline-size: var(--rp-tooltip-max-width);
    margin: 0;
    padding-block: var(--rp-tooltip-py);
    padding-inline: var(--rp-tooltip-px);
    border: 1px solid var(--_border);
    border-radius: var(--rp-tooltip-radius);
    background-color: var(--_bg);
    color: var(--_fg);
    font-size: var(--text-xs);
    line-height: var(--text-xs--line-height);
    pointer-events: none;
  }

  /* 3. MODIFIERS */

  /* 4. STATES */

  /* 5. MOTION */
  @media (prefers-reduced-motion: no-preference) {
    .rp-tooltip-content {
      transition-property: opacity;
      transition-duration: var(--rp-duration-fast);
      transition-timing-function: var(--ease-out);
    }
    .rp-tooltip-content[data-starting-style] {
      opacity: 0;
    }
    .rp-tooltip-content[data-ending-style] {
      opacity: 0;
    }
  }

  /* 6. ENVIRONMENT */
  @media (forced-colors: active) {
    .rp-tooltip-content {
      border-color: CanvasText;
    }
  }
}
```

### Host notes

- HTML: copy the contract. Load `ripple.js` (the lazy loader fetches the `tooltip` chunk) or `ripple.elements.js`.
- React: `Tooltip`, `TooltipTrigger`, `TooltipContent` in `tooltip.tsx`, hand-written below the generated header region (D-072), pattern of Tabs in `06-bindings.md` 6.6. The file starts with `"use client"` (it calls `useElement`). `Tooltip` uses `useElement(ref, { events: { openchange } })` for `onOpenChange`; there is no controlled prop (D-036). All three custom elements carry `suppressHydrationWarning`. `TooltipContent` prints `side={side === "top" ? undefined : side}` and `align={align === "center" ? undefined : align}` after validating both against their enumerations, and the fixed attributes `hidden`, `role="tooltip"`, `data-closed=""`, `data-slot="tooltip-content"`. `TooltipTrigger` is `({ children }) => <ui-tooltip-trigger suppressHydrationWarning>{children}</ui-tooltip-trigger>`. The trigger button is the caller's `<Button tooltip="<id>">` or `<IconButton tooltip="<id>">`; the Tooltip binding writes nothing on it.
- Remix: generated, pattern of Tabs in `06-bindings.md` 7.6. `ui-tooltip` prints `data-rmx-key="<id>"`. `ui-tooltip-content` prints `data-rmx-preserve-attrs="data-align data-closed data-instant data-open data-side hidden popover style"`. The trigger `<button>` is printed by Button or IconButton, whose Remix binding prints `data-rmx-preserve-attrs="style"` on it when `tooltip` is set (D-132): without it a morph while the tooltip is open strips the inline `anchor-name` and the content loses its anchor. No callbacks.
- Liquid: three block files, generated: `tooltip`, `tooltip-trigger`, `tooltip-content`. The trigger is `{% block 'button', tooltip: '<id>' %}` or `{% block 'icon-button', icon: 'info', aria_label: 'About sizes', tooltip: '<id>' %}` inside `tooltip-trigger`. `{{ attributes }}` is printed last on `tooltip` and `tooltip-content` (G-13). Schema settings: `side`, `align` (on `tooltip-content` only); label keys per G-8. Guards (L-15) with fallbacks `'top'` and `'center'`; the attributes are then printed as `{% if side != 'top' %}side="{{ side }}"{% endif %}` and `{% if align != 'center' %}align="{{ align }}"{% endif %}`. `blocks/tooltip-trigger.liquid` has no `class` or `attributes` param output: its markup is exactly `<ui-tooltip-trigger>{{ content }}</ui-tooltip-trigger>`. Locale keys for strings the component prints: none.

```tsx
import { IconButton } from "./icon-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export function SizeTip() {
  return (
    <Tooltip id="size-tip">
      <TooltipTrigger>
        <IconButton icon="info" ariaLabel="Sizing information" tooltip="size-tip" />
      </TooltipTrigger>
      <TooltipContent tooltip="size-tip" side="bottom">Runs small</TooltipContent>
    </Tooltip>
  );
}
```

```liquid
{% block 'tooltip', id: 'size-tip' %}
  {% block 'tooltip-trigger' %}
    {% block 'icon-button', icon: 'info', aria_label: 'Sizing information', tooltip: 'size-tip' %}{% endblock %}
  {% endblock %}
  {% block 'tooltip-content', tooltip: 'size-tip', side: 'bottom' %}Runs small{% endblock %}
{% endblock %}
```

### Commerce

None.

### Agent surface

`bridge`. Bridge component: `ui-tooltip`. Actions: `setOpen` (UI SDK's own action; argument: boolean). Confirm: none. Secret: none. An agent does not need the tooltip: the description is in the accessibility tree as the trigger's description whether or not the tooltip is open.

### Checker rules

- RP104: `id` missing on `Tooltip`; `tooltip` prop missing on `TooltipContent`.
- RP101: `side` or `align` outside its enumeration; a literal `tooltip` value on a Button or IconButton is checked as that component's prop (`09-components-foundation.md`).
- RP113 with these manifest `rules[]` entries:
  - `tooltip-needs-trigger`: kind `requires-descendant`, selector `ui-tooltip.rp-tooltip`, target `ui-tooltip-trigger > button[type="button"][data-slot="tooltip-trigger"][aria-describedby]`. Message: "A Tooltip has no button trigger wired to its content." Fix: "Pass `tooltip=\"<id>\"` to the Button or IconButton inside TooltipTrigger." (D-082 item 5 fixes this rule id.)
  - `tooltip-needs-content`: kind `requires-descendant`, selector `ui-tooltip.rp-tooltip`, target `ui-tooltip-content[role="tooltip"][hidden]`. Message: "A Tooltip has no content part in its closed initial state." Fix: "Add one tooltip-content with tooltip set to the Tooltip id."
  - `tooltip-no-link-trigger`: kind `forbids-descendant`, selector `ui-tooltip-trigger`, target `a`. Message: "A link is used as a tooltip trigger; UI SDK rewrites it as a button." Fix: "Use a Button or IconButton without href, or print the text visibly."
  - `tooltip-one-trigger`: kind `max-count`, selector `ui-tooltip-trigger > *`, count `1`. Message: "A tooltip-trigger has more than one child." Fix: "Keep exactly one button."
  - `tooltip-content-is-text`: kind `forbids-descendant`, selector `ui-tooltip-content`, target `a, button, input, select, textarea`. Message: "A tooltip contains an interactive element that cannot be reached." Fix: "Use Popover."
- RP114: the content id MUST equal `<tooltip id>-content`; the trigger's `aria-describedby` MUST name that id.
- RP201: the trigger button MUST have an accessible name other than the tooltip text.
- RP204: a Tooltip root inside `a[href]` or `button`.
- RP304 (warning): not applicable (a tooltip contains text only).

### Acceptance tests

1. T2: fixtures `default`, `placement`, `invalid-enum-falls-back`, `class` are canonical-equal in `html`, `react`, `remix`, `liquid`.
2. T3: zero mutation records inside the root for every fixture after the `tooltip` chunk has loaded and `customElements.get("ui-tooltip")` is defined.
3. T5: `page.hover()` on the trigger; within 1500 ms the content matches `[data-open]`, does not have `hidden`, and `getComputedStyle(content).display` is not `none`. Moving the pointer to (0, 0) restores `hidden` within 1000 ms.
4. T5: `trigger.focus()` through the keyboard (Tab) shows the content within 300 ms and the content has `data-instant`. Escape hides it; `document.activeElement` is still the trigger.
5. T5: fixture `placement` open: the content's top edge is at or below the trigger's bottom edge, and `content.getAttribute("data-side")` is `bottom`. Fixture `default` open in a viewport with room above: `data-side` is `top` and the content's bottom edge is at or above the trigger's top edge.
6. T5: exactly one `openchange` event per open and per close, on `ui-tooltip`, with `detail.value` `true` then `false`; a listener on `document` in the bubbling phase receives none.
7. T5 (a11y): the accessibility snapshot of the trigger has name "Sizing information" and description "Runs small" both before and after upgrade.
8. T5: with the trigger inside an open Dialog and the tooltip open, one Escape press closes the tooltip and leaves `dialog.open === true`. (If this fails, item 5 of "Behaviour with JavaScript" is changed to say that Escape closes both, and `04-elements.md` 10.4 copies it; the contract does not change.)
9. T5 (CSS): open content has computed `background-color` equal to the computed `--color-foreground`, `max-inline-size` 256 px with the default tokens, and `pointer-events: none`.
10. T4 (React): hydration of `default` logs no warning; `onOpenChange` is called with `(true, detail)` on hover.
11. T6: with JavaScript disabled the content is not visible on hover or focus, and test 7's name and description still hold.
12. T9: tests 3 and 4 pass in WebKit and Gecko.

### Evidence and UNVERIFIED

- Evidence: `00-decisions.md` D-013, D-082; `ripple/docs/04-elements.md` 10.4, 11.1, 11.3; `ripple/docs/09-components-foundation.md` (Button, IconButton: prop `tooltip`); `uisdk/packages/web/src/tooltip.ts`; `uisdk/packages/core/src/components/tooltip/tooltip.ts` (options `delay` default 600, `closeDelay` default 0, `toggleable`); Chromium 157 run `ripple/docs/research/spikes/components-interactive/u.mjs` with `site/t.html`: with `side="bottom" align="start"` printed on the content and a button trigger the upgrade recorded no attribute or text mutation inside the root (the `childList` records in `results-u.txt` are the HTML parser inserting the server markup, because the observer is installed before the body is parsed); the open content had `data-open`, `popover="manual"`, `data-side`, `data-align`, `style`, and `data-instant` when opened by focus; Escape hid it; a link trigger (`<a href>`) received `type="button"` at upgrade.
- UNVERIFIED: the upgrade of the trigger markup with `data-variant`, `data-size` and the icon child (fixtures pending re-capture; AT-2 settles it); behaviour on touch input; Escape inside an open modal dialog (AT-8 settles it, D-108); whether `popover` and `style` remain on the content after it closes (they are in the Remix preserve list either way); the exact reason strings other than the three named; WebKit and Gecko (SPIKE-06).

### Fallback (SPIKE-nn)

None.

---
