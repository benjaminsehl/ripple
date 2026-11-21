# Toast

> Component spec. Group doc: [10-components-interactive.md](../10-components-interactive.md). Read its section 0 (rules shared by every component in the group) before this file. The decision ledger [00-decisions.md](../00-decisions.md) wins on any conflict.

| Field | Value |
|---|---|
| Id | `toast` |
| Kind | `ui` |
| Category | `feedback` |
| Custom elements | `ui-toast-region` |
| Root element and class | `ui-toast-region` `.rp-toast` |
| Liquid tier | `block` |
| No-JS level | `none` |
| Requires `id` | no |
| Depends on | none |
| Milestone | M2 |

### Purpose

The page's single, empty notification region plus the `toast()` function that shows a short, self-dismissing message in it after a client-side action. The region is the UI SDK `ui-toast-region` with root class `rp-toast`; its chunk is loaded on the first `toast()` call, never because the tag is in the document (D-013, D-054 item 2, D-083).

- Use when: an action that completed WITHOUT a page load needs a brief confirmation or error ("Added to cart", "Could not update quantity") and the result is also visible elsewhere on the page.
- Do not use when: the message is produced by the server or must survive a reload (use Banner); the message belongs to a form or a field (use FormMessage); the message needs a decision (use Dialog); a modal dialog is open (use a FormMessage inside the dialog, or `announce(text, { from })`, which writes into the dialog's `data-rp-part="status"` element; D-008 item 7, D-079).

### Anatomy

| Part | Export (TSX) | Liquid file | Element | Class | Hook attribute | Required | Id rule |
|---|---|---|---|---|---|---|---|
| root | `Toast` | `blocks/toast.liquid` | `ui-toast-region` | `rp-toast` | `data-slot="toast-region"` | yes | none |

Nesting rules:

1. A document MUST contain at most one Toast root. The `layout` blueprint (`12-components-chrome-and-blueprints.md`) prints it as the last element child of `<body>`. Page templates and other blueprints MUST NOT print one.
2. The root is printed EMPTY. The server MUST NOT print a toast inside it.
3. The root MUST NOT be inside a `<dialog>`, a `[popover]`, an `<a>`, a `<button>`, a `data-rp-region` element, or a Remix `<Frame>`.
4. Elements that UI SDK creates inside the root at run time are not parts of the contract and carry no Ripple class (D-083 item 1): `<ol data-slot="toast-list">` and, per toast, `ui-toast`, `ui-toast-title`, `ui-toast-description`, `ui-toast-close` (structure under "Behaviour with JavaScript").

### Props

Root (`Toast`):

| Prop (TSX) | Liquid param | Type | Values | Default | Required | Responsive | Renders as |
|---|---|---|---|---|---|---|---|
| `ariaLabel` | `aria_label` | string | any non-empty text | locale key `ripple.toast.label` (English: `Notifications`) | no | no | `aria-label` on the root |
| `rmxKey` | none (Remix only) | string | any non-empty text, unique among siblings | none | no | no | `data-rmx-key` on the root; the attribute is omitted when the prop is unset (D-034, `06-bindings.md` X-3). Host extra: absent from fixtures, React and Liquid |
| `side` | `side` (setting) | enum | `top` `bottom` | `bottom` | no | no | `data-side` on the root (default printed); additionally the UI SDK option attribute `side` when the value is `top` |
| `align` | `align` (setting) | enum | `start` `center` `end` | `end` | no | no | `data-align` on the root (default printed); additionally the UI SDK option attribute `align` when the value is not `end` |

Why two attributes: UI SDK reads the OPTION attributes `side` / `align` and reflects them as `data-side` / `data-align`. Printing both in the server HTML means the upgrade does not have to write the `data-*` pair (verified for `top` / `center`).

### Content model

`none` - the root has no children in server HTML.

### HTML contract

Fixture `default` (no props):

```html
<ui-toast-region class="rp-toast" aria-label="Notifications" data-slot="toast-region" data-side="bottom" data-align="end" popover="manual"></ui-toast-region>
```

Fixture `placement` (`side="top"`, `align="center"`):

```html
<ui-toast-region class="rp-toast" side="top" align="center" aria-label="Notifications" data-slot="toast-region" data-side="top" data-align="center" popover="manual"></ui-toast-region>
```

Fixture `escaping` (`ariaLabel` is the text `Say "hi" & <go>`):

```html
<ui-toast-region class="rp-toast" aria-label="Say &quot;hi&quot; &amp; &lt;go&gt;" data-slot="toast-region" data-side="bottom" data-align="end" popover="manual"></ui-toast-region>
```

Fixture `invalid-enum-falls-back` (`side="bogus"`):

```html
<ui-toast-region class="rp-toast" aria-label="Notifications" data-slot="toast-region" data-side="bottom" data-align="end" popover="manual"></ui-toast-region>
```

Fixture `class` (`class="custom-a custom-b"`):

```html
<ui-toast-region class="rp-toast custom-a custom-b" aria-label="Notifications" data-slot="toast-region" data-side="bottom" data-align="end" popover="manual"></ui-toast-region>
```

The server MUST NOT print on the root: `style`, `role`, `aria-live`, `hidden`, `tabindex`, or any child node.

Host-owned regions and masks: the whole content of the root is element-owned after upgrade (allow-list below). No mask is needed for the server HTML.

### State and attributes

| Attribute | On | Written by | When | Initial value printed by server |
|---|---|---|---|---|
| `style` | root | element (UI SDK) | at upgrade and on every viewport or toast change (inline custom properties and position) | absent |
| `popover` | root | element (UI SDK) | at upgrade UI SDK re-writes the same value `manual`; a same-value write is not a mutation (D-002) and is not what the allow-list entry is for; the region is shown in the top layer while it has toasts | `manual` |
| `data-side`, `data-align` | root | element (UI SDK) | reflected from the options; same values as printed (same-value writes, D-002) | `bottom` / `end`, or the prop values |
| children | root | element (UI SDK) | `<ol data-slot="toast-list">` appended at upgrade; one `ui-toast` per message | none |
| `data-type` | `ui-toast` (run time only) | element (UI SDK) | the `type` option of the message | not printed |
| `data-starting-style`, `data-ending-style` | `ui-toast` (run time only) | element (UI SDK) | enter and exit transitions | not printed |

Upgrade allow-list (mutations permitted when the element upgrades). It is ONE entry, identical key for key and value for value to entry 2 of `02-html-contract.md` 7.3 (D-071 item 3; the two documents MUST print the same entry, and it MUST NOT be widened). The entry exists because the region is element-owned: UI SDK changes `style` and the child list at upgrade and at run time. `data-slot`, `data-side`, `data-align` and `popover` are listed for the element-owned subtree and for run-time changes; at upgrade their writes on the root are same-value writes, which need no entry (D-002):

```json
[
  {
    "select": "ui-toast-region",
    "attrs": ["data-slot", "data-side", "data-align", "popover", "style"],
    "childList": true,
    "text": true,
    "subtree": true,
    "reason": "UI SDK writes viewport-dependent inline variables and appends <ol data-slot=\"toast-list\">; the region is element-owned."
  }
]
```

### Behaviour with JavaScript

1. Loading (D-083 item 3, D-054 item 2): the `toast` chunk, and the `shared` chunk it imports, are NOT loaded at page load. A `ui-toast-region` in the document does NOT trigger a load; the lazy loader MUST NOT register the toast chunk by tag. The first `toast()` call imports both chunks (`04-elements.md` 10.6). The region is inert until then.
2. Showing a message is only possible through the helper:

   ```ts
   // bundled apps (react): import from the package entry
   import { toast } from "<pkg>/elements";
   // liquid: import { toast } from "ripple";
   // html and remix: import { toast } from "/ripple/ripple.js";  (the URL of the main browser file the page loads)

   await toast("Added to cart", { description: "Linen shirt, size M", type: "success", duration: 5000 });
   ```

   Signature (D-083 item 2): `toast(message: string, options?: ToastOptions): Promise<void>`. `ToastOptions` is exactly `{ id?: string; description?: string; type?: "default" | "success" | "error" | "warning" | "info" | "loading"; duration?: number; priority?: "polite" | "assertive" }`. `message` is the toast's title text. `duration` is milliseconds. Toast actions are not supported in V1. The source of the helper is owned by `04-elements.md`.

   Where callers get `toast` (D-083 item 4, D-054 item 1): `<pkg>/elements` in bundled apps; the specifier `ripple` on Liquid; the export of the main browser file (`ripple.js` or `ripple.elements.js`) on `html` and `remix`. The Toast binding file (`toast.tsx`, `blocks/toast.liquid`) prints the region and nothing else: it MUST NOT re-export `toast` and MUST NOT import `<pkg>/elements`.
3. The promise resolves after UI SDK has accepted the message. When the chunk cannot be loaded, or the document has no `ui-toast-region`, the promise resolves and nothing is shown; the helper MUST NOT throw.
4. DOM that UI SDK renders for one message (from `uisdk/packages/web/src/toast.ts`, function `fromData`), inside `<ol data-slot="toast-list">`:

   ```html
   <ui-toast toast="<id>" role="listitem">
     <div>
       <ui-toast-title>Added to cart</ui-toast-title>
       <ui-toast-description>Linen shirt, size M</ui-toast-description>
     </div>
     <ui-toast-close><button type="button"></button></ui-toast-close>
   </ui-toast>
   ```

   These elements have no Ripple class. `toast.css` styles them as `.rp-toast :where(<tag>)`. Action buttons inside a toast (`ui-toast-action`) are not supported in V1: `ToastOptions` has no `action`.
5. A message is removed after its `duration` (UI SDK default when omitted), or when its close button is pressed. Timers pause while the pointer is over the region or focus is inside it (UI SDK behaviour; agent action `pause`).
6. Calling `toast()` with the `id` of a message that is still shown replaces that message instead of adding one (UI SDK behaviour, UNVERIFIED in a browser).
7. Callers MUST NOT call `toast()` while a modal dialog is open (D-008 item 7, D-079 item 4; `04-elements.md` 9.1 item 9): commerce elements test `document.querySelector("dialog:modal")` and use `announce(text, { from })` and the dialog's status part instead.
8. Rules for message text: `title` at most 60 characters, no trailing full stop, no HTML (the helper passes text, not markup). An `error` toast MUST be accompanied by a persistent message at the place of the error (FormMessage or the `data-rp-part="error"` element of the commerce component): a toast alone is never the only report of a failure.
9. Position: UI SDK places the region at `side` / `align` of the viewport in the top layer. `start` and `end` follow the writing direction.

### Behaviour without JavaScript

- The region is empty and takes no space. No toast can exist.
- Every flow that would call `toast()` is a native form post or link without JavaScript, and the page that loads next shows the result (cart page, Banner, FormMessage).
- No control is marked `data-rp-js`.
- Manifest: `noJs.level: "none"`, `noJs.behavior: "The region stays empty. Actions that would toast reload a page that shows the result."`, `noJs.fallbackHref`: absent.

### Events, commands and methods

| Kind | Name | Target | Detail or arguments | React callback |
|---|---|---|---|---|
| method | `toast(message, options?)` | module export of `<pkg>/elements` (Liquid: `ripple`; `html` and `remix`: the main browser file) | see "Behaviour with JavaScript" item 2; returns `Promise<void>` | none (call the function from an event handler) |

No event and no command.

### Accessibility

- Pattern: a labelled notification region whose items are announced by UI SDK live regions; `checkPattern`: `null`.
- Accessible name: REQUIRED on the root, from `aria-label` (default "Notifications").
- Focus: showing a toast never moves focus. The close button inside a toast is reachable with Tab while the toast is shown. A keyboard shortcut that jumps to the region is UI SDK's and is not specified by Ripple (UNVERIFIED).
- Announcements: each message is announced once when it appears; `priority: "polite"` (default) waits for the current speech, `priority: "assertive"` interrupts and is reserved for errors.

| Key | Action |
|---|---|
| Tab | Reaches the close button of a visible toast in document order (the region is the last element of `<body>`) |
| Enter or Space on the close button | Removes that toast |

### Styling

- File: `components/toast/toast.css` (layer `rp.components`).
- Tokens used: `--spacing`, `--radius-surface`, `--radius-control`, `--color-popover`, `--color-popover-foreground`, `--color-border`, `--color-muted-foreground`, `--color-success`, `--color-destructive`, `--color-warning`, `--color-info`, `--shadow-lg`, `--text-sm`, `--text-sm--line-height`, `--font-weight-medium`, `--spacing-target-min`, `--rp-z-toast`, `--rp-duration-base`, `--ease-out`.

| Custom property | Default | Purpose |
|---|---|---|
| `--rp-toast-width` | `calc(var(--spacing) * 90)` | inline size of the region (capped at 100% of the viewport) |
| `--rp-toast-gap` | `calc(var(--spacing) * 2)` | gap between toasts, and between a toast's text and its close button |
| `--rp-toast-padding` | `calc(var(--spacing) * 4)` | padding of one toast |
| `--rp-toast-radius` | `var(--radius-surface)` | corner radius of one toast |
| `--rp-toast-inset` | `calc(var(--spacing) * 4)` | distance between the toasts and the viewport edges |

| Modifier selector | Sets |
|---|---|
| none (`data-side` and `data-align` are read by UI SDK, not by CSS) | not applicable |

Rules specific to this file:

1. Run-time elements are selected ONLY as `.rp-toast :where(ol)`, `.rp-toast :where(ui-toast)`, `.rp-toast :where(ui-toast-title)`, `.rp-toast :where(ui-toast-description)`, `.rp-toast :where(ui-toast button)` and `.rp-toast :where(ui-toast[<state attribute>])`. `lintComponentCss` MUST accept exactly this selector form in this file (section 0.3 item 3).
2. Toasts are laid out as a plain vertical list (`flex-direction: column`). The file MUST NOT read UI SDK's inline stacking custom properties: CSS-11 forbids reading custom properties that are not Ripple tokens, so V1 has no overlapped "stack" effect.
3. The region has `pointer-events: none` and each toast `pointer-events: auto`, so the empty margin around toasts does not block the page.
4. The file MUST NOT set `position`, `inset` or `display` on `.rp-toast`: UI SDK and the user-agent popover rules own them.
5. The close button gets a visible label from CSS only if UI SDK prints none; V1 does not add one. Whether the UI SDK close button has an accessible name is UNVERIFIED and is checked by acceptance test 7.

Complete file:

```css
/* toast.css
   Component: Toast (id `toast`). Contract: 10-components-interactive.md, "Toast".
   Root:      <ui-toast-region>, class rp-toast
   Parts:     none printed by the server. UI SDK creates <ol data-slot="toast-list"> and, per toast,
              <ui-toast>, <ui-toast-title>, <ui-toast-description>, <ui-toast-action>, <ui-toast-close>.
              They carry no class, so they are selected as .rp-toast :where(<tag>).
   Props:     data-side  = top | bottom           (default bottom); positioned by UI SDK, not styled here
              data-align = start | center | end   (default end); positioned by UI SDK, not styled here
   States:    [data-type], [data-starting-style], [data-ending-style] on ui-toast
   Public:    --rp-toast-width, --rp-toast-gap, --rp-toast-padding, --rp-toast-radius, --rp-toast-inset */
@layer rp.components {
  /* 1. ROOT */
  .rp-toast {
    /* 1a. public custom properties */
    --rp-toast-width: calc(var(--spacing) * 90);
    --rp-toast-gap: calc(var(--spacing) * 2);
    --rp-toast-padding: calc(var(--spacing) * 4);
    --rp-toast-radius: var(--radius-surface);
    --rp-toast-inset: calc(var(--spacing) * 4);
    /* 1b. colour slots */
    --_bg: var(--color-popover);
    --_fg: var(--color-popover-foreground);
    --_border: var(--color-border);
    /* 1c. other private custom properties */
    /* 1d. declarations */
    box-sizing: border-box;
    inline-size: var(--rp-toast-width);
    max-inline-size: 100%;
    padding: var(--rp-toast-inset);
    z-index: var(--rp-z-toast);
    pointer-events: none;
  }

  /* 2. PARTS */
  .rp-toast :where(ol) {
    display: flex;
    flex-direction: column;
    gap: var(--rp-toast-gap);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rp-toast :where(ui-toast) {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--rp-toast-gap);
    padding: var(--rp-toast-padding);
    border: 1px solid var(--_border);
    border-radius: var(--rp-toast-radius);
    background-color: var(--_bg);
    color: var(--_fg);
    box-shadow: var(--shadow-lg);
    font-size: var(--text-sm);
    line-height: var(--text-sm--line-height);
    pointer-events: auto;
  }
  .rp-toast :where(ui-toast-title) {
    font-weight: var(--font-weight-medium);
  }
  .rp-toast :where(ui-toast-description) {
    color: var(--color-muted-foreground);
  }
  .rp-toast :where(ui-toast button) {
    min-block-size: var(--spacing-target-min);
    margin: 0;
    padding-block: 0;
    padding-inline: calc(var(--spacing) * 2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-control);
    background-color: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  /* 3. MODIFIERS */

  /* 4. STATES */
  .rp-toast :where(ui-toast[data-type="success"]) {
    border-color: var(--color-success);
  }
  .rp-toast :where(ui-toast[data-type="error"]) {
    border-color: var(--color-destructive);
  }
  .rp-toast :where(ui-toast[data-type="warning"]) {
    border-color: var(--color-warning);
  }
  .rp-toast :where(ui-toast[data-type="info"]) {
    border-color: var(--color-info);
  }

  /* 5. MOTION */
  @media (prefers-reduced-motion: no-preference) {
    .rp-toast :where(ui-toast) {
      transition-property: opacity, translate;
      transition-duration: var(--rp-duration-base);
      transition-timing-function: var(--ease-out);
    }
    .rp-toast :where(ui-toast[data-starting-style]) {
      opacity: 0;
      translate: 0 calc(var(--spacing) * 2);
    }
    .rp-toast :where(ui-toast[data-ending-style]) {
      opacity: 0;
    }
  }

  /* 6. ENVIRONMENT */
  @media (forced-colors: active) {
    .rp-toast :where(ui-toast) {
      border-color: CanvasText;
    }
  }
}
```

### Host notes

- HTML: copy fixture `default` to the end of `<body>`. Load `ripple.js` (or `ripple.elements.js`). Call `toast()` from a module script that imports it from the SAME main browser file the page loads, for example `import { toast } from "/ripple/ripple.js"` (`public/ripple/` is the default `paths.public`, D-054 item 4).
- React: `export function Toast(props: ToastProps): JSX.Element` in `toast.tsx`, hand-written below the generated header region (D-072). The binding prints the region and nothing else (D-083 item 4): the root with `suppressHydrationWarning` and no children. It calls no hook, so the file has NO `"use client"` directive (D-033 item (b)). It imports only `react` types and `<pkg>` helpers; it MUST NOT import `<pkg>/elements` and MUST NOT export `toast` (D-096 item 3). A caller imports the helper itself, `import { toast } from "<pkg>/elements"`, in a client module and writes `onClick={() => { void toast("Saved"); }}`. Default string in TSX: `ariaLabel = "Notifications"`. No controlled prop, no callback.
- Remix: generated. The root has no required `id`, so the Remix-only prop `rmxKey` is optional: when passed, the root prints `data-rmx-key="<rmxKey>"`; when unset, the attribute is omitted (D-034, `06-bindings.md` X-3). The root prints `data-rmx-preserve-attrs="data-align data-side popover style"`. The root MUST be rendered by the root layout, outside every `<Frame>`. Callers get `toast` from the main browser file (`/ripple/ripple.js`).
- Liquid: one block file, generated: `blocks/toast.liquid`, called once from `layout/theme.liquid` as `{% block 'toast' %}{% endblock %}`. Schema settings: `side`, `align`; label keys per G-8. Locale keys for strings the component prints: `ripple.toast.label` (English: `Notifications`). Theme code gets the helper with `import { toast } from "ripple"`.

```tsx
// layout.tsx (server or client): prints the region
import type { ReactNode } from "react";
import { Toast } from "./toast";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <body>
      {children}
      <Toast />
    </body>
  );
}
```

```tsx
// save-button.tsx (app code, a client module): calls the helper
"use client";
import { toast } from "<pkg>/elements";
import { Button } from "./button";

export function SaveButton() {
  return <Button onClick={() => { void toast("Saved", { type: "success" }); }}>Save</Button>;
}
```

```liquid
{% comment %} layout/theme.liquid, last statement before </body> {% endcomment %}
{% block 'toast' %}{% endblock %}
```

`blocks/toast.liquid` between `{% doc %}` and `{% schema %}`, complete:

```liquid
{%- liquid
  assign allowed_side = 'top,bottom' | split: ','
  unless allowed_side contains side
    assign side = 'bottom'
  endunless
  assign allowed_align = 'start,center,end' | split: ','
  unless allowed_align contains align
    assign align = 'end'
  endunless
  if aria_label == blank
    assign aria_label = 'ripple.toast.label' | t
  endif
-%}
<ui-toast-region class="rp-toast {{ class | escape }}" {% if side != 'bottom' %}side="{{ side }}"{% endif %} {% if align != 'end' %}align="{{ align }}"{% endif %} aria-label="{{ aria_label | escape }}" data-slot="toast-region" data-side="{{ side }}" data-align="{{ align }}" popover="manual" {{ attributes }}></ui-toast-region>
```

### Commerce

None. Commerce elements call `toast()` as specified in `05-commerce.md` and `11-components-commerce.md`; Toast itself reads no commerce data.

### Agent surface

`bridge`. Bridge component: `ui-toast-region`. Actions: `pause` (UI SDK's own action). Confirm: none. Secret: none. Toast text is also exposed through the accessibility tree as list items of the region.

### Checker rules

- RP101: `side` or `align` outside its enumeration.
- RP113 with these manifest `rules[]` entries:
  - `toast-one-region`: kind `max-count`, selector `ui-toast-region`, count `1`. Message: "The document has more than one toast region." Fix: "Keep the one printed by the layout."
  - `toast-region-needs-label`: kind `requires-attribute`, selector `ui-toast-region`, target `aria-label` (an attribute name). Message: "The toast region has no accessible name." Fix: "Use the Toast component, which prints aria-label."
  - `toast-region-empty`: kind `forbids-descendant`, selector `ui-toast-region`, target `*`. Message: "The server printed content inside the toast region." Fix: "Print the region empty; show server messages with Banner or FormMessage." (Applies to documents with `serverHtml: true` only.)
  - `toast-region-placement`: kind `forbids-ancestor`, selector `ui-toast-region`, target `dialog, [popover], a, button, [data-rp-region]`. Message: "The toast region is inside an overlay, a control or a refreshable region." Fix: "Move it to the end of <body> in the layout."
- RP111: the class `rp-toast-region` is not in the manifest and is reported; the root class is `rp-toast` (D-083).

### Acceptance tests

1. T2: fixtures `default`, `placement`, `escaping`, `invalid-enum-falls-back`, `class` are canonical-equal in `html`, `react`, `remix`, `liquid`.
2. T3: after `await toast("x")` has forced the chunk to load on a page with fixture `default`, every mutation inside the root is covered by the allow-list (same-value writes are reported as information and do not fail, D-002); `aria-label` and `class` are never written.
3. T5 (D-083 item 3): on a page with fixture `default`, before the first `toast()` call no network request for the `toast` or the `shared` chunk has been made (`page.on("request")` sees no URL whose file name is `ripple-toast.js`, `ripple-shared.js`, `ripple.elements-toast.js` or `ripple.elements-shared.js`). After the first `toast()` call the `toast` and `shared` chunks of the loaded set have each been requested exactly once.
4. T5: `await toast("Added to cart", { description: "Linen shirt", type: "success", duration: 1000 })` results in exactly one `ui-toast` inside the root whose text content contains both strings and whose `data-type` is `success`; after 2500 ms the root contains no `ui-toast`.
5. T5: three calls in a row produce three `ui-toast` elements whose boxes do not overlap and are 8 px apart with the default tokens (`--rp-toast-gap`).
6. T5: pressing the `button` inside `ui-toast-close` removes that toast within 1000 ms.
7. T5 (a11y): the accessibility snapshot contains a node named "Notifications"; the close button of a visible toast has a non-empty accessible name. (UNVERIFIED, D-108. If the second assertion fails, the `toast()` helper of `04-elements.md` sets `aria-label` on that button from a new locale key `ripple.toast.close`, English `Dismiss`, and this section's "Host notes" gains that key; the root contract does not change.)
8. T5: on a page with no `ui-toast-region`, `await toast("x")` resolves and logs no error.
9. T5 (CSS): with one toast shown at viewport 1000 by 700 and default tokens, the toast's right edge is 16 px from the viewport's right edge and its bottom edge 16 px from the bottom; in fixture `placement` it is horizontally centred within 1 px and its top edge is 16 px from the top.
10. T4 (React): hydration of `default` logs no warning.
11. T6: with JavaScript disabled the root has no children and `getBoundingClientRect()` height 0.
12. T9: tests 4 and 6 pass in WebKit and Gecko.

### Evidence and UNVERIFIED

- Evidence: `00-decisions.md` D-013, D-054, D-071, D-083; `ripple/docs/02-html-contract.md` 7.3 entry 2; `ripple/docs/04-elements.md` 10.6 (helper and `ToastOptions`); `uisdk/packages/web/src/toast.ts` (`fromData`: the DOM of one toast); `uisdk/packages/core/src/components/toast/toast-parts.ts`; Chromium 157 run `ripple/docs/research/spikes/components-interactive/u.mjs` with `site/t.html`: a region printed with `side="top" align="center"` plus `data-side`, `data-align`, `popover="manual"`, `aria-label` produced only `style` writes, one same-value `popover` write and the appended `<ol data-slot="toast-list">`; `ripple/docs/04-elements.md` L-5 (measured cost of loading the toast chunk on every page: 19.5 kB gzip, the reason for the load-on-first-call rule).
- UNVERIFIED (D-108; each gates a test, not the root contract): the rendered DOM and attributes of a live toast (`data-type`, `data-starting-style`, `data-ending-style` on `ui-toast`; the close button's content and name): two attempts to capture them failed for tooling reasons (`w.mjs`), so item 4 of "Behaviour with JavaScript" and the state selectors in `toast.css` come from source reading only. Acceptance tests 4 to 7 and 9 are the gate; when one fails, the selector in `toast.css` is corrected to the attribute UI SDK really writes and the contract of the root does not change. Also UNVERIFIED: replace-by-`id`; the default duration; toasts surviving a Remix morph navigation; WebKit and Gecko (SPIKE-06).

### Fallback (SPIKE-nn)

None.

---
